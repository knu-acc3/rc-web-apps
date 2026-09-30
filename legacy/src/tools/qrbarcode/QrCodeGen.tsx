"use client";

import { useRef, useState, type FormEvent } from "react";
import { DownloadSimple, QrCode } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadCanvas } from "@/src/utils/exportHelpers";
import JSZip from "jszip";
import { generateQR, getQrMeta, type EcLevel, type QrMeta } from "./qrcore";

export const QR_CONTENT_HARD_LIMIT = 4_096;
export const QR_SIZE_LIMITS = {
  minimum: 256,
  maximum: 1_024,
  default: 384,
} as const;
export const QR_MIN_CONTRAST_RATIO = 3;

export type FocusedQrIssue = "empty" | "input-limit" | "capacity" | "matrix";

export class FocusedQrError extends Error {
  readonly issue: FocusedQrIssue;
  readonly meta: QrMeta | null;

  constructor(issue: FocusedQrIssue, meta: QrMeta | null = null) {
    super(issue);
    this.name = "FocusedQrError";
    this.issue = issue;
    this.meta = meta;
  }
}

export interface FocusedQrPayload {
  content: string;
  ecLevel: EcLevel;
  meta: QrMeta;
  matrix: boolean[][];
}

export interface FocusedQrResult extends FocusedQrPayload {
  size: number;
  foreground: string;
  background: string;
  contrastRatio: number;
}

const EC_LEVELS: readonly EcLevel[] = ["L", "M", "Q", "H"];
const QUIET_ZONE_MODULES = 4;

export function isQrEcLevel(value: string): value is EcLevel {
  return EC_LEVELS.includes(value as EcLevel);
}

export function parseQrCanvasSize(value: string): number | null {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d*)$/.test(normalized)) return null;

  const parsed = Number(normalized);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < QR_SIZE_LIMITS.minimum ||
    parsed > QR_SIZE_LIMITS.maximum
  ) {
    return null;
  }
  return parsed;
}

export function isQrHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function qrColorContrastRatio(
  foreground: string,
  background: string,
): number | null {
  if (!isQrHexColor(foreground) || !isQrHexColor(background)) return null;

  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function hasFinderPattern(
  matrix: readonly (readonly boolean[])[],
  startRow: number,
  startColumn: number,
): boolean {
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const expectedDark =
        row === 0 ||
        row === 6 ||
        column === 0 ||
        column === 6 ||
        (row >= 2 && row <= 4 && column >= 2 && column <= 4);
      if (matrix[startRow + row][startColumn + column] !== expectedDark) {
        return false;
      }
    }
  }
  return true;
}

export function validateQrMatrix(
  matrix: readonly (readonly boolean[])[],
  meta: QrMeta,
): boolean {
  const modules = meta.modules;
  if (
    !Number.isInteger(modules) ||
    modules < 21 ||
    modules > 57 ||
    modules % 2 === 0 ||
    modules !== 17 + meta.version * 4 ||
    matrix.length !== modules
  ) {
    return false;
  }
  if (
    matrix.some(
      (row) =>
        row.length !== modules ||
        row.some((module) => typeof module !== "boolean"),
    )
  ) {
    return false;
  }

  return (
    hasFinderPattern(matrix, 0, 0) &&
    hasFinderPattern(matrix, 0, modules - 7) &&
    hasFinderPattern(matrix, modules - 7, 0) &&
    matrix[modules - 8][8] === true
  );
}

export function generateFocusedQrPayload(
  content: string,
  ecLevel: EcLevel,
): FocusedQrPayload {
  if (content.length === 0) throw new FocusedQrError("empty");
  if (content.length > QR_CONTENT_HARD_LIMIT) {
    throw new FocusedQrError("input-limit");
  }
  if (!isQrEcLevel(ecLevel)) throw new FocusedQrError("matrix");

  // qrcore clamps oversized input to version 10, so capacity MUST be checked
  // before generateQR or the byte stream would be silently truncated.
  const meta = getQrMeta(content, ecLevel);
  if (!meta.willFit) throw new FocusedQrError("capacity", meta);

  const matrix = generateQR(content, ecLevel);
  if (!validateQrMatrix(matrix, meta)) {
    throw new FocusedQrError("matrix", meta);
  }

  return { content, ecLevel, meta, matrix };
}

export function drawFocusedQrToCanvas(
  canvas: HTMLCanvasElement,
  result: FocusedQrResult,
): void {
  if (!validateQrMatrix(result.matrix, result.meta)) {
    throw new FocusedQrError("matrix", result.meta);
  }

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable.");

  const modulesWithQuietZone = result.meta.modules + QUIET_ZONE_MODULES * 2;
  const moduleSize = Math.floor(result.size / modulesWithQuietZone);
  if (moduleSize < 1)
    throw new RangeError("Canvas is too small for this QR matrix.");

  const renderedSize = modulesWithQuietZone * moduleSize;
  const outerOffset = Math.floor((result.size - renderedSize) / 2);
  const matrixOffset = outerOffset + QUIET_ZONE_MODULES * moduleSize;

  // Resetting the dimensions clears every prior render, which keeps repeated
  // generation deterministic and prevents stale modules from surviving.
  canvas.width = result.size;
  canvas.height = result.size;
  context.imageSmoothingEnabled = false;
  context.fillStyle = result.background;
  context.fillRect(0, 0, result.size, result.size);
  context.fillStyle = result.foreground;

  for (let row = 0; row < result.matrix.length; row += 1) {
    for (let column = 0; column < result.matrix[row].length; column += 1) {
      if (!result.matrix[row][column]) continue;
      context.fillRect(
        matrixOffset + column * moduleSize,
        matrixOffset + row * moduleSize,
        moduleSize,
        moduleSize,
      );
    }
  }
}

function generationErrorMessage(error: unknown, isEn: boolean): string {
  if (!(error instanceof FocusedQrError)) {
    return isEn
      ? "The QR code could not be generated."
      : "Не удалось создать QR-код.";
  }

  if (error.issue === "empty") {
    return isEn
      ? "Enter content for the QR code."
      : "Введите содержимое QR-кода.";
  }
  if (error.issue === "input-limit") {
    return isEn
      ? `Content cannot exceed ${QR_CONTENT_HARD_LIMIT.toLocaleString("en-US")} characters.`
      : `Содержимое не может превышать ${QR_CONTENT_HARD_LIMIT.toLocaleString("ru-RU")} символов.`;
  }
  if (error.issue === "capacity" && error.meta) {
    return isEn
      ? `This correction level fits ${error.meta.capacityBytes} UTF-8 bytes, but the content uses ${error.meta.usedBytes}. Shorten the content or choose a lower correction level.`
      : `При этом уровне коррекции помещается ${error.meta.capacityBytes} байт UTF-8, а содержимое занимает ${error.meta.usedBytes}. Сократите содержимое или выберите более низкий уровень коррекции.`;
  }
  return isEn
    ? "The QR encoder returned an invalid matrix."
    : "QR-кодировщик вернул некорректную матрицу.";
}

export default function QrCodeGen() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [content, setContent] = useState("");
  const [ecLevel, setEcLevel] = useState<EcLevel>("M");
  const [sizeInput, setSizeInput] = useState(String(QR_SIZE_LIMITS.default));
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#FFFFFF");
  const [result, setResult] = useState<FocusedQrResult | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [downloadError, setDownloadError] = useState("");

  // Batch QR states
  const [batchInput, setBatchInput] = useState("");
  const [batchNaming, setBatchNaming] = useState("qr_{index}");
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const clearOutput = () => {
    setResult(null);
    setGenerationError("");
    setDownloadError("");
  };

  const handleBatchFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setBatchInput(text);
    } catch {
      // ignore
    }
  };

  const generateBatchQrZip = async () => {
    const lines = batchInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setBatchGenerating(true);
    setBatchProgress(0);

    const size = parseQrCanvasSize(sizeInput) ?? QR_SIZE_LIMITS.default;
    const contrastRatio = qrColorContrastRatio(foreground, background) ?? 21;

    try {
      const zip = new JSZip();
      const tempCanvas = document.createElement("canvas");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        try {
          const payload = generateFocusedQrPayload(line, ecLevel);
          const qrRes: FocusedQrResult = {
            ...payload,
            size,
            foreground,
            background,
            contrastRatio,
          };
          drawFocusedQrToCanvas(tempCanvas, qrRes);

          const blob = await new Promise<Blob | null>((resolve) =>
            tempCanvas.toBlob(resolve, "image/png"),
          );
          if (blob) {
            const fileName = batchNaming
              .replace("{index}", String(i + 1).padStart(3, "0"))
              .replace("{content}", line.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30));
            zip.file(`${fileName || `qr_${i + 1}`}.png`, blob);
          }
        } catch {
          // skip entries that exceed capacity
        }
        setBatchProgress(Math.round(((i + 1) / lines.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "batch_qr_codes.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // ignore
    } finally {
      setBatchGenerating(false);
    }
  };

  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDownloadError("");

    const size = parseQrCanvasSize(sizeInput);
    if (size === null) {
      setResult(null);
      setGenerationError(
        isEn
          ? `Enter a whole size from ${QR_SIZE_LIMITS.minimum} to ${QR_SIZE_LIMITS.maximum} pixels.`
          : `Введите целый размер от ${QR_SIZE_LIMITS.minimum} до ${QR_SIZE_LIMITS.maximum} пикселей.`,
      );
      return;
    }

    const contrastRatio = qrColorContrastRatio(foreground, background);
    if (contrastRatio === null) {
      setResult(null);
      setGenerationError(
        isEn
          ? "Choose valid six-digit colors."
          : "Выберите корректные шестизначные цвета.",
      );
      return;
    }
    if (contrastRatio < QR_MIN_CONTRAST_RATIO) {
      setResult(null);
      setGenerationError(
        isEn
          ? `Choose colors with a contrast ratio of at least ${QR_MIN_CONTRAST_RATIO}:1.`
          : `Выберите цвета с контрастностью не менее ${QR_MIN_CONTRAST_RATIO}:1.`,
      );
      return;
    }

    try {
      const payload = generateFocusedQrPayload(content, ecLevel);
      const nextResult: FocusedQrResult = {
        ...payload,
        size,
        foreground,
        background,
        contrastRatio,
      };
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas is unavailable.");
      drawFocusedQrToCanvas(canvas, nextResult);
      setResult(nextResult);
      setGenerationError("");
    } catch (error) {
      setResult(null);
      setGenerationError(generationErrorMessage(error, isEn));
    }
  };

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    try {
      // downloadCanvas uses a data URL, so repeated downloads do not retain
      // object URLs or require an asynchronous cleanup lifecycle.
      downloadCanvas(canvas, { baseName: "qr-code", format: "png" });
      setDownloadError("");
    } catch {
      setDownloadError(
        isEn
          ? "The PNG file could not be created."
          : "Не удалось создать PNG-файл.",
      );
    }
  };

  const resultStatus = generationError ? "error" : result ? "success" : "idle";
  const resultTitle = generationError
    ? isEn
      ? "QR code not generated"
      : "QR-код не создан"
    : result
      ? isEn
        ? "QR code ready"
        : "QR-код готов"
      : isEn
        ? "Ready to generate"
        : "Готов к созданию";
  const resultDescription = generationError
    ? generationError
    : result
      ? isEn
        ? `Version ${result.meta.version}, ${result.meta.modules} × ${result.meta.modules} modules, ${result.meta.usedBytes} of ${result.meta.capacityBytes} UTF-8 bytes.`
        : `Версия ${result.meta.version}, ${result.meta.modules} × ${result.meta.modules} модулей, ${result.meta.usedBytes} из ${result.meta.capacityBytes} байт UTF-8.`
      : isEn
        ? "Enter content and generate a QR code."
        : "Введите содержимое и создайте QR-код.";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <form onSubmit={generate} noValidate>
          <div>
            <Label htmlFor="qr-content">
              {isEn ? "QR content" : "Содержимое QR-кода"}
            </Label>
            <Textarea
              id="qr-content"
              rows={5}
              maxLength={QR_CONTENT_HARD_LIMIT}
              value={content}
              aria-invalid={Boolean(generationError)}
              aria-describedby="qr-content-hint"
              onChange={(event) => {
                setContent(event.target.value);
                clearOutput();
              }}
              className="mt-1.5 min-h-32 resize-y text-base"
            />
            <p
              id="qr-content-hint"
              className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]"
            >
              {isEn
                ? "Content is encoded as UTF-8 bytes, and capacity is checked for the selected correction level. Test non-ASCII text with the target scanner."
                : "Содержимое кодируется в байты UTF-8, а ёмкость проверяется для выбранного уровня коррекции. Текст с символами вне ASCII проверьте целевым сканером."}
            </p>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-5"
            leadingIcon={<QrCode size={20} weight="bold" aria-hidden="true" />}
          >
            {isEn ? "Generate QR code" : "Создать QR-код"}
          </ToolPrimaryAction>

          <ToolResult
            status={resultStatus}
            title={resultTitle}
            description={resultDescription}
            className="mt-5"
          >
            <canvas
              ref={canvasRef}
              hidden={!result}
              role={result ? "img" : undefined}
              aria-hidden={!result}
              aria-label={
                result
                  ? isEn
                    ? `Generated QR code, version ${result.meta.version}, ${result.meta.modules} by ${result.meta.modules} modules`
                    : `Созданный QR-код, версия ${result.meta.version}, ${result.meta.modules} на ${result.meta.modules} модулей`
                  : undefined
              }
              className="mx-auto h-auto max-w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]"
            >
              {isEn ? "Generated QR code" : "Созданный QR-код"}
            </canvas>

            {result ? (
              <div className="mt-4 flex min-w-0 flex-col items-center gap-3">
                <p className="text-center text-xs leading-5 text-[var(--color-text-muted)]">
                  {isEn
                    ? `Error correction ${result.ecLevel}; output ${result.size} × ${result.size} px; contrast ${result.contrastRatio.toFixed(2)}:1.`
                    : `Коррекция ошибок ${result.ecLevel}; размер ${result.size} × ${result.size} px; контрастность ${result.contrastRatio.toFixed(2)}:1.`}
                </p>
                <Button type="button" variant="outline" onClick={downloadPng}>
                  <DownloadSimple size={18} weight="bold" aria-hidden="true" />
                  {isEn ? "Download PNG" : "Скачать PNG"}
                </Button>
                {downloadError ? (
                  <p
                    role="alert"
                    className="text-sm text-[var(--color-danger)]"
                  >
                    {downloadError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ToolResult>

          <AdvancedSettings
            className="mt-5"
            defaultOpen={true}
            title={isEn ? "Advanced settings" : "Расширенные настройки"}
            description={
              isEn
                ? "Error correction, output size and colors"
                : "Коррекция ошибок, размер и цвета"
            }
          >
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <Label htmlFor="qr-error-correction">
                  {isEn ? "Error correction" : "Коррекция ошибок"}
                </Label>
                <select
                  id="qr-error-correction"
                  value={ecLevel}
                  onChange={(event) => {
                    if (isQrEcLevel(event.target.value)) {
                      setEcLevel(event.target.value);
                      clearOutput();
                    }
                  }}
                  className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                >
                  <option value="L">L — 7%</option>
                  <option value="M">M — 15%</option>
                  <option value="Q">Q — 25%</option>
                  <option value="H">H — 30%</option>
                </select>
              </div>

              <div className="min-w-0">
                <Label htmlFor="qr-output-size">
                  {isEn ? "Output size (px)" : "Размер результата (px)"}
                </Label>
                <Input
                  id="qr-output-size"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={sizeInput}
                  onChange={(event) => {
                    setSizeInput(event.target.value);
                    clearOutput();
                  }}
                  className="mt-1.5 h-12 font-mono text-base tabular-nums"
                />
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {QR_SIZE_LIMITS.minimum}–{QR_SIZE_LIMITS.maximum} px
                </p>
              </div>

              <div className="min-w-0">
                <Label htmlFor="qr-foreground">
                  {isEn ? "Foreground" : "Основной цвет"}
                </Label>
                <div className="mt-1.5 flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
                  <input
                    id="qr-foreground"
                    type="color"
                    value={foreground}
                    onChange={(event) => {
                      setForeground(event.target.value.toUpperCase());
                      clearOutput();
                    }}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <output htmlFor="qr-foreground" className="font-mono text-sm">
                    {foreground}
                  </output>
                </div>
              </div>

              <div className="min-w-0">
                <Label htmlFor="qr-background">
                  {isEn ? "Background" : "Фон"}
                </Label>
                <div className="mt-1.5 flex min-h-12 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
                  <input
                    id="qr-background"
                    type="color"
                    value={background}
                    onChange={(event) => {
                      setBackground(event.target.value.toUpperCase());
                      clearOutput();
                    }}
                    className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <output htmlFor="qr-background" className="font-mono text-sm">
                    {background}
                  </output>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? `A four-module quiet zone is always preserved. Colors must keep at least ${QR_MIN_CONTRAST_RATIO}:1 contrast.`
                : `Тихая зона в четыре модуля сохраняется всегда. Контрастность цветов должна быть не ниже ${QR_MIN_CONTRAST_RATIO}:1.`}
            </p>

            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <Label className="text-sm font-semibold">
                {isEn ? "Batch QR Generation" : "Пакетная генерация QR-кодов"}
              </Label>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Upload CSV or TXT (one URL/SKU per line) to generate and download a single ZIP archive."
                  : "Загрузите CSV или TXT файл (одна ссылка/артикул на строку) для массовой генерации QR в ZIP-архив."}
              </p>

              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="batch-qr-file" className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Load from CSV / TXT" : "Загрузить из CSV / TXT"}
                  </Label>
                  <Input
                    id="batch-qr-file"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleBatchFile}
                    className="mt-1 h-10 text-xs cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="batch-qr-text" className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Or paste lines (URL / text / SKU per line)" : "Или вставьте список (одна ссылка на строку)"}
                  </Label>
                  <Textarea
                    id="batch-qr-text"
                    rows={3}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder={"https://site.org/item1\nhttps://site.org/item2\nSKU-99481"}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="batch-qr-naming" className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "Naming template ({index} or {content})" : "Шаблон имени ({index} или {content})"}
                  </Label>
                  <Input
                    id="batch-qr-naming"
                    value={batchNaming}
                    onChange={(e) => setBatchNaming(e.target.value)}
                    className="mt-1 h-9 text-xs font-mono"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateBatchQrZip}
                  disabled={batchGenerating || !batchInput.trim()}
                  className="w-full"
                >
                  <DownloadSimple size={15} />
                  {batchGenerating
                    ? (isEn ? `Generating ZIP… ${batchProgress}%` : `Генерация ZIP… ${batchProgress}%`)
                    : (isEn ? "Download batch ZIP" : "Скачать все QR-коды (ZIP)")}
                </Button>
              </div>
            </div>
          </AdvancedSettings>
        </form>
      </section>
    </div>
  );
}
