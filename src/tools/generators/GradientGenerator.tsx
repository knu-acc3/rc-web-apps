"use client";

import { useState, type FormEvent } from "react";
import { DownloadSimple, PaintBrush } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
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
import { downloadBlob } from "@/src/utils/exportHelpers";

type GradientType = "linear" | "radial" | "conic";
type StopCount = "2" | "3";
type ExportFormat = "css" | "json";

interface GradientStop {
  color: string;
  position: number;
}

interface GradientResult {
  css: string;
  type: GradientType;
  angle: number;
  stops: GradientStop[];
}

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function buildGradient(
  type: GradientType,
  angle: number,
  stops: GradientStop[],
): string {
  const stopList = stops
    .map((stop) => `${stop.color.toUpperCase()} ${stop.position}%`)
    .join(", ");
  if (type === "radial") return `radial-gradient(circle, ${stopList})`;
  if (type === "conic") return `conic-gradient(from ${angle}deg, ${stopList})`;
  return `linear-gradient(${angle}deg, ${stopList})`;
}

function buildExport(result: GradientResult, format: ExportFormat): string {
  if (format === "json") {
    return JSON.stringify(
      {
        type: result.type,
        angle: result.type === "radial" ? null : result.angle,
        stops: result.stops,
        css: result.css,
      },
      null,
      2,
    );
  }
  return `.gradient {\n  background: ${result.css};\n}`;
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
          className="h-12 w-12 shrink-0 cursor-pointer p-1"
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
            "h-12 min-w-0 font-mono uppercase",
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

export default function GradientGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [firstColor, setFirstColor] = useState("#2563EB");
  const [secondColor, setSecondColor] = useState("#F97316");
  const [type, setType] = useState<GradientType>("linear");
  const [angleInput, setAngleInput] = useState("90");
  const [stopCount, setStopCount] = useState<StopCount>("2");
  const [middleColor, setMiddleColor] = useState("#A855F7");
  const [middlePositionInput, setMiddlePositionInput] = useState("50");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [result, setResult] = useState<GradientResult | null>(null);

  const firstValid = HEX_PATTERN.test(firstColor);
  const secondValid = HEX_PATTERN.test(secondColor);
  const middleValid = stopCount === "2" || HEX_PATTERN.test(middleColor);
  const angle = Number(angleInput);
  const angleValid =
    type === "radial" || (Number.isFinite(angle) && angle >= 0 && angle <= 360);
  const middlePosition = Number(middlePositionInput);
  const middlePositionValid =
    stopCount === "2" ||
    (Number.isFinite(middlePosition) &&
      middlePosition >= 1 &&
      middlePosition <= 99);
  const formValid =
    firstValid &&
    secondValid &&
    middleValid &&
    angleValid &&
    middlePositionValid;
  const exportText = result ? buildExport(result, exportFormat) : "";

  const resetResult = () => setResult(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;
    const stops: GradientStop[] = [
      { color: firstColor.toUpperCase(), position: 0 },
      ...(stopCount === "3"
        ? [{ color: middleColor.toUpperCase(), position: middlePosition }]
        : []),
      { color: secondColor.toUpperCase(), position: 100 },
    ];
    const normalizedAngle = type === "radial" ? 0 : angle;
    setResult({
      css: buildGradient(type, normalizedAngle, stops),
      type,
      angle: normalizedAngle,
      stops,
    });
  };

  const downloadGradient = () => {
    if (!result) return;
    const extension = exportFormat === "json" ? "json" : "css";
    const mime = exportFormat === "json" ? "application/json" : "text/css";
    downloadBlob(
      new Blob([exportText], { type: `${mime};charset=utf-8` }),
      `gradient.${extension}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="gradient-first-color"
              label={isEn ? "First color" : "Первый цвет"}
              value={firstColor}
              error={
                isEn
                  ? "Enter a six-digit HEX color."
                  : "Введите HEX-цвет из шести знаков."
              }
              onChange={(value) => {
                setFirstColor(value);
                resetResult();
              }}
            />
            <ColorField
              id="gradient-second-color"
              label={isEn ? "Second color" : "Второй цвет"}
              value={secondColor}
              error={
                isEn
                  ? "Enter a six-digit HEX color."
                  : "Введите HEX-цвет из шести знаков."
              }
              onChange={(value) => {
                setSecondColor(value);
                resetResult();
              }}
            />
          </div>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<PaintBrush size={20} />}
        >
          {isEn ? "Create CSS gradient" : "Создать CSS-градиент"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={
            isEn
              ? "Direction, stops and export"
              : "Направление, точки и экспорт"
          }
          description={
            isEn
              ? "Change the gradient type, add a middle color and save the result"
              : "Измените тип градиента, добавьте средний цвет и сохраните результат"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="gradient-type">{isEn ? "Type" : "Тип"}</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as GradientType);
                  resetResult();
                }}
              >
                <SelectTrigger id="gradient-type" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">
                    {isEn ? "Linear" : "Линейный"}
                  </SelectItem>
                  <SelectItem value="radial">
                    {isEn ? "Radial" : "Радиальный"}
                  </SelectItem>
                  <SelectItem value="conic">
                    {isEn ? "Conic" : "Конический"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type !== "radial" ? (
              <div>
                <Label htmlFor="gradient-angle">
                  {isEn ? "Angle" : "Угол"}
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="gradient-angle"
                    type="number"
                    min={0}
                    max={360}
                    step={1}
                    inputMode="decimal"
                    value={angleInput}
                    onChange={(event) => {
                      setAngleInput(event.target.value);
                      resetResult();
                    }}
                    aria-invalid={!angleValid}
                    aria-describedby="gradient-angle-help"
                    className={cn(
                      "h-11 pr-10 font-mono",
                      !angleValid && "border-[var(--color-danger)]",
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                    °
                  </span>
                </div>
                <p
                  id="gradient-angle-help"
                  className={cn(
                    "mt-1 text-xs text-[var(--color-text-muted)]",
                    !angleValid && "text-[var(--color-danger)]",
                  )}
                >
                  {angleValid
                    ? "0–360"
                    : isEn
                      ? "Enter an angle from 0 to 360."
                      : "Введите угол от 0 до 360."}
                </p>
              </div>
            ) : null}

            <div>
              <Label htmlFor="gradient-stops">
                {isEn ? "Color stops" : "Цветовые точки"}
              </Label>
              <Select
                value={stopCount}
                onValueChange={(value) => {
                  setStopCount(value as StopCount);
                  resetResult();
                }}
              >
                <SelectTrigger id="gradient-stops" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gradient-export">
                {isEn ? "Export format" : "Формат экспорта"}
              </Label>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
                }
              >
                <SelectTrigger id="gradient-export" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {stopCount === "3" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ColorField
                id="gradient-middle-color"
                label={isEn ? "Middle color" : "Средний цвет"}
                value={middleColor}
                error={
                  isEn
                    ? "Enter a six-digit HEX color."
                    : "Введите HEX-цвет из шести знаков."
                }
                onChange={(value) => {
                  setMiddleColor(value);
                  resetResult();
                }}
              />
              <div>
                <Label htmlFor="gradient-middle-position">
                  {isEn ? "Middle position" : "Позиция среднего цвета"}
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="gradient-middle-position"
                    type="number"
                    min={1}
                    max={99}
                    step={1}
                    inputMode="decimal"
                    value={middlePositionInput}
                    onChange={(event) => {
                      setMiddlePositionInput(event.target.value);
                      resetResult();
                    }}
                    aria-invalid={!middlePositionValid}
                    aria-describedby="gradient-middle-position-help"
                    className={cn(
                      "h-11 pr-10 font-mono",
                      !middlePositionValid && "border-[var(--color-danger)]",
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-text-muted)]">
                    %
                  </span>
                </div>
                <p
                  id="gradient-middle-position-help"
                  className={cn(
                    "mt-1 text-xs text-[var(--color-text-muted)]",
                    !middlePositionValid && "text-[var(--color-danger)]",
                  )}
                >
                  {middlePositionValid
                    ? "1–99"
                    : isEn
                      ? "Enter a position from 1 to 99."
                      : "Введите позицию от 1 до 99."}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={!result}
              onClick={downloadGradient}
            >
              <DownloadSimple size={18} />
              {isEn ? "Download" : "Скачать"}
            </Button>
            {!result ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Create the gradient before exporting."
                  : "Сначала создайте градиент."}
              </p>
            ) : null}
          </div>
        </AdvancedSettings>
      </form>

      {result ? (
        <Card className="overflow-hidden p-0" aria-live="polite">
          <div
            className="h-44 w-full sm:h-52"
            style={{ background: result.css }}
            role="img"
            aria-label={
              isEn ? "Generated gradient preview" : "Предпросмотр градиента"
            }
          />
          <div className="flex min-w-0 items-start gap-2 border-t border-[var(--color-border)] p-3 sm:p-4">
            <code className="min-w-0 flex-1 break-all text-xs leading-relaxed text-[var(--color-text-muted)]">
              background: {result.css};
            </code>
            <CopyButton
              text={`background: ${result.css};`}
              size="medium"
              tooltip={isEn ? "Copy CSS" : "Копировать CSS"}
            />
          </div>
        </Card>
      ) : null}
    </div>
  );
}
