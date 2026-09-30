"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import { DownloadSimple, UserCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { canvasToBlob, downloadBlob } from "@/src/utils/exportHelpers";

type AvatarStyle = "initials" | "identicon" | "geometric";
type ColorMode = "automatic" | "custom";
type ExportFormat = "svg" | "png";
type AvatarSize = 128 | 256 | 512;

interface AvatarResult {
  svg: string;
  url: string;
  size: AvatarSize;
  seed: string;
}

interface AvatarConfig {
  seed: string;
  style: AvatarStyle;
  background: string;
  foreground: string;
  size: AvatarSize;
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = (((hue % 360) + 360) % 360) / 60;
  const second = chroma * (1 - Math.abs((segment % 2) - 1));
  const offset = l - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (segment < 1) [red, green, blue] = [chroma, second, 0];
  else if (segment < 2) [red, green, blue] = [second, chroma, 0];
  else if (segment < 3) [red, green, blue] = [0, chroma, second];
  else if (segment < 4) [red, green, blue] = [0, second, chroma];
  else if (segment < 5) [red, green, blue] = [second, 0, chroma];
  else [red, green, blue] = [chroma, 0, second];

  return `#${[red, green, blue]
    .map((channel) =>
      Math.round((channel + offset) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function getAutomaticColors(seed: string): {
  background: string;
  foreground: string;
} {
  const hash = hashString(seed.trim().toLowerCase());
  const hue = hash % 360;
  const lightBackground = ((hash >>> 8) & 1) === 1;
  return {
    background: hslToHex(hue, 62, lightBackground ? 72 : 38),
    foreground: lightBackground ? "#111827" : "#FFFFFF",
  };
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function getInitials(seed: string): string {
  const words = seed.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "?";
  const second =
    words.length > 1
      ? (Array.from(words[words.length - 1])[0] ?? "")
      : (Array.from(words[0])[1] ?? "");
  return `${first}${second}`.toLocaleUpperCase();
}

function buildInitials(config: AvatarConfig): string {
  const fontSize = Math.round(config.size * 0.38);
  return `<text x="50%" y="50%" dy="0.34em" text-anchor="middle" fill="${config.foreground}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">${escapeXml(getInitials(config.seed))}</text>`;
}

function buildIdenticon(config: AvatarConfig): string {
  const random = createRandom(hashString(`${config.seed}|identicon`));
  const cell = config.size / 5;
  const squares: string[] = [];

  for (let row = 0; row < 5; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if (random() < 0.48) continue;
      const xPositions = column === 2 ? [column] : [column, 4 - column];
      for (const x of xPositions) {
        squares.push(
          `<rect x="${(x * cell).toFixed(2)}" y="${(row * cell).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" fill="${config.foreground}"/>`,
        );
      }
    }
  }

  return squares.join("");
}

function buildGeometric(config: AvatarConfig): string {
  const random = createRandom(hashString(`${config.seed}|geometric`));
  const shapes: string[] = [];

  for (let index = 0; index < 5; index += 1) {
    const centerX = Math.round(random() * config.size);
    const centerY = Math.round(random() * config.size);
    const radius = Math.round(config.size * (0.12 + random() * 0.2));
    const opacity = (0.42 + random() * 0.48).toFixed(2);
    shapes.push(
      `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${config.foreground}" opacity="${opacity}"/>`,
    );
  }

  return shapes.join("");
}

function buildAvatarSvg(config: AvatarConfig): string {
  const radius = Math.round(config.size * 0.18);
  const content =
    config.style === "identicon"
      ? buildIdenticon(config)
      : config.style === "geometric"
        ? buildGeometric(config)
        : buildInitials(config);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${config.size}" height="${config.size}" viewBox="0 0 ${config.size} ${config.size}" role="img">
  <title>${escapeXml(config.seed)}</title>
  <defs><clipPath id="avatar-clip"><rect width="${config.size}" height="${config.size}" rx="${radius}"/></clipPath></defs>
  <g clip-path="url(#avatar-clip)">
    <rect width="${config.size}" height="${config.size}" fill="${config.background}"/>
    ${content}
  </g>
</svg>`;
}

async function svgToPng(svg: string, size: number): Promise<Blob> {
  const temporaryUrl = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = document.createElement("img");
    image.decoding = "async";
    image.src = temporaryUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, size, size);
    return canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(temporaryUrl);
  }
}

function safeFileName(seed: string): string {
  return (
    seed
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "avatar"
  );
}

function ColorField({ id, label, value, error, onChange }: ColorFieldProps) {
  const valid = HEX_PATTERN.test(value);
  const helpId = `${id}-help`;

  return (
    <div className="min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex min-w-0 gap-2">
        <Input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={label}
          className="h-11 w-11 shrink-0 cursor-pointer p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!valid}
          aria-describedby={helpId}
          className={cn(
            "h-11 min-w-0 font-mono uppercase",
            !valid && "border-[var(--color-danger)]",
          )}
        />
      </div>
      <p
        id={helpId}
        className={cn(
          "mt-1 text-xs text-[var(--color-text-muted)]",
          !valid && "text-[var(--color-danger)]",
        )}
      >
        {valid ? "HEX" : error}
      </p>
    </div>
  );
}

export default function AvatarGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const previewUrlRef = useRef<string | null>(null);
  const [seed, setSeed] = useState("");
  const [style, setStyle] = useState<AvatarStyle>("initials");
  const [colorMode, setColorMode] = useState<ColorMode>("automatic");
  const [background, setBackground] = useState("#2563EB");
  const [foreground, setForeground] = useState("#FFFFFF");
  const [size, setSize] = useState<AvatarSize>(256);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [result, setResult] = useState<AvatarResult | null>(null);

  const seedValid = seed.trim().length >= 1 && seed.trim().length <= 80;
  const colorsValid =
    colorMode === "automatic" ||
    (HEX_PATTERN.test(background) && HEX_PATTERN.test(foreground));
  const formValid = seedValid && colorsValid;

  const releasePreviewUrl = useCallback(() => {
    if (!previewUrlRef.current) return;
    URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }, []);

  const resetResult = useCallback(() => {
    releasePreviewUrl();
    setDownloadError("");
    setResult(null);
  }, [releasePreviewUrl]);

  useEffect(() => releasePreviewUrl, [releasePreviewUrl]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;
    const normalizedSeed = seed.trim();
    const colors =
      colorMode === "automatic"
        ? getAutomaticColors(normalizedSeed)
        : { background, foreground };
    const svg = buildAvatarSvg({
      seed: normalizedSeed,
      style,
      background: colors.background,
      foreground: colors.foreground,
      size,
    });
    releasePreviewUrl();
    const url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
    previewUrlRef.current = url;
    setDownloadError("");
    setResult({ svg, url, size, seed: normalizedSeed });
  };

  const downloadAvatar = async () => {
    if (!result || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      const baseName = safeFileName(result.seed);
      if (exportFormat === "svg") {
        downloadBlob(
          new Blob([result.svg], { type: "image/svg+xml;charset=utf-8" }),
          `${baseName}.svg`,
        );
      } else {
        const png = await svgToPng(result.svg, result.size);
        downloadBlob(png, `${baseName}.png`);
      }
    } catch {
      setDownloadError(
        isEn
          ? "Could not prepare the file. Try SVG export."
          : "Не удалось подготовить файл. Попробуйте экспорт SVG.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <Label htmlFor="avatar-seed">
            {isEn ? "Name or seed" : "Имя или seed"}
          </Label>
          <Input
            id="avatar-seed"
            value={seed}
            onChange={(event) => {
              setSeed(event.target.value);
              resetResult();
            }}
            maxLength={80}
            autoComplete="off"
            aria-invalid={!seedValid && seed.length > 0}
            aria-describedby="avatar-seed-help"
            className={cn(
              "mt-1.5 h-12",
              !seedValid && seed.length > 0 && "border-[var(--color-danger)]",
            )}
          />
          <p
            id="avatar-seed-help"
            className={cn(
              "mt-1 text-xs text-[var(--color-text-muted)]",
              !seedValid && seed.length > 0 && "text-[var(--color-danger)]",
            )}
          >
            {!seedValid && seed.length > 0
              ? isEn
                ? "Use from 1 to 80 characters."
                : "Введите от 1 до 80 символов."
              : isEn
                ? "The same value creates the same avatar."
                : "Одинаковое значение создаёт одинаковый аватар."}
          </p>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<UserCircle size={20} />}
        >
          {isEn ? "Create avatar" : "Создать аватар"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={isEn ? "Style, colors and export" : "Стиль, цвета и экспорт"}
          description={
            isEn
              ? "Change the avatar look, output size and file format"
              : "Настройте вид аватара, размер и формат файла"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="avatar-style">{isEn ? "Style" : "Стиль"}</Label>
              <Select
                value={style}
                onValueChange={(value) => {
                  setStyle(value as AvatarStyle);
                  resetResult();
                }}
              >
                <SelectTrigger id="avatar-style" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="initials">
                    {isEn ? "Initials" : "Инициалы"}
                  </SelectItem>
                  <SelectItem value="identicon">Identicon</SelectItem>
                  <SelectItem value="geometric">
                    {isEn ? "Geometric" : "Геометрический"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="avatar-color-mode">
                {isEn ? "Colors" : "Цвета"}
              </Label>
              <Select
                value={colorMode}
                onValueChange={(value) => {
                  setColorMode(value as ColorMode);
                  resetResult();
                }}
              >
                <SelectTrigger id="avatar-color-mode" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">
                    {isEn ? "From seed" : "Из seed"}
                  </SelectItem>
                  <SelectItem value="custom">
                    {isEn ? "Custom" : "Свои"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="avatar-size">{isEn ? "Size" : "Размер"}</Label>
              <Select
                value={String(size)}
                onValueChange={(value) => {
                  setSize(Number(value) as AvatarSize);
                  resetResult();
                }}
              >
                <SelectTrigger id="avatar-size" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128 × 128</SelectItem>
                  <SelectItem value="256">256 × 256</SelectItem>
                  <SelectItem value="512">512 × 512</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="avatar-export">
                {isEn ? "File format" : "Формат файла"}
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger id="avatar-export" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {colorMode === "custom" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ColorField
                id="avatar-background"
                label={isEn ? "Background" : "Фон"}
                value={background}
                error={
                  isEn
                    ? "Enter a six-digit HEX color."
                    : "Введите HEX-цвет из шести знаков."
                }
                onChange={(value) => {
                  setBackground(value);
                  resetResult();
                }}
              />
              <ColorField
                id="avatar-foreground"
                label={isEn ? "Foreground" : "Передний план"}
                value={foreground}
                error={
                  isEn
                    ? "Enter a six-digit HEX color."
                    : "Введите HEX-цвет из шести знаков."
                }
                onChange={(value) => {
                  setForeground(value);
                  resetResult();
                }}
              />
            </div>
          ) : null}
        </AdvancedSettings>
      </form>

      {result ? (
        <Card className="p-4 sm:p-5" aria-live="polite">
          <div className="flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-64 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <Image
                src={result.url}
                alt={isEn ? "Generated avatar" : "Созданный аватар"}
                fill
                unoptimized
                sizes="256px"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={downloading}
              onClick={() => void downloadAvatar()}
              className="mt-4 w-full sm:w-auto"
            >
              <DownloadSimple size={18} />
              {downloading
                ? isEn
                  ? "Preparing…"
                  : "Подготовка…"
                : isEn
                  ? `Download ${exportFormat.toUpperCase()}`
                  : `Скачать ${exportFormat.toUpperCase()}`}
            </Button>
            {downloadError ? (
              <p
                className="mt-2 text-sm text-[var(--color-danger)]"
                role="alert"
              >
                {downloadError}
              </p>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
