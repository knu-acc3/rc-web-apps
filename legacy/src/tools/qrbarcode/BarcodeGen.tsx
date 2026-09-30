"use client";

import { useState } from "react";
import {
  Barcode,
  DownloadSimple,
  FileImage,
  FileSvg,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { canvasToBlob, downloadBlob } from "@/src/utils/exportHelpers";

export type BarcodeFormat = "ean13" | "upca";
export type BarcodeChecksumMode = "calculate" | "validate";

export interface EncodedBarcode {
  format: BarcodeFormat;
  value: string;
  modules: string;
}

export type BarcodeGeneration =
  | {
      ok: true;
      symbol: EncodedBarcode;
      checksumMode: BarcodeChecksumMode;
    }
  | {
      ok: false;
      error: "empty" | "characters" | "length" | "checksum";
      expectedLength?: number;
      expectedCheckDigit?: string;
    };

export interface BarcodeLayoutOptions {
  moduleWidth: number;
  barHeight: number;
  showHumanReadable: boolean;
}

export interface BarcodeBar {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BarcodeLayout {
  width: number;
  height: number;
  bars: BarcodeBar[];
  textX: number;
  textY: number;
  fontSize: number;
}

const EAN_L = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
] as const;

const EAN_G = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
] as const;

const EAN_R = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
] as const;

const EAN_PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
] as const;

const EAN_UPC_MODULE_COUNT = 95;
const QUIET_ZONE_MODULES = 11;
const GUARD_MODULES = new Set([0, 2, 46, 48, 92, 94]);

export function calculateGs1CheckDigit(payload: string): string {
  if (!/^\d+$/.test(payload)) {
    throw new Error("GS1 check digit payload must contain digits only.");
  }

  let sum = 0;
  let positionFromRight = 0;
  for (let index = payload.length - 1; index >= 0; index -= 1) {
    const digit = Number(payload[index]);
    sum += digit * (positionFromRight % 2 === 0 ? 3 : 1);
    positionFromRight += 1;
  }
  return String((10 - (sum % 10)) % 10);
}

function assertCompleteGtin(value: string, length: number, label: string) {
  if (!new RegExp(`^\\d{${length}}$`).test(value)) {
    throw new Error(`${label} must contain exactly ${length} digits.`);
  }
  const expected = calculateGs1CheckDigit(value.slice(0, -1));
  if (value.at(-1) !== expected) {
    throw new Error(`${label} has an invalid check digit.`);
  }
}

function encodeEan13ModulesUnchecked(value: string): string {
  const firstDigit = Number(value[0]);
  const parity = EAN_PARITY[firstDigit];
  let modules = "101";

  for (let index = 1; index <= 6; index += 1) {
    const digit = Number(value[index]);
    modules += parity[index - 1] === "L" ? EAN_L[digit] : EAN_G[digit];
  }

  modules += "01010";
  for (let index = 7; index <= 12; index += 1) {
    modules += EAN_R[Number(value[index])];
  }
  return modules + "101";
}

export function encodeEan13(value: string): EncodedBarcode {
  assertCompleteGtin(value, 13, "EAN-13");
  const modules = encodeEan13ModulesUnchecked(value);
  if (modules.length !== EAN_UPC_MODULE_COUNT) {
    throw new Error("EAN-13 encoder produced an invalid module count.");
  }
  return { format: "ean13", value, modules };
}

export function encodeUpca(value: string): EncodedBarcode {
  assertCompleteGtin(value, 12, "UPC-A");
  const modules = encodeEan13ModulesUnchecked("0" + value);
  if (modules.length !== EAN_UPC_MODULE_COUNT) {
    throw new Error("UPC-A encoder produced an invalid module count.");
  }
  return { format: "upca", value, modules };
}

export function generateBarcode(
  input: string,
  format: BarcodeFormat,
  checksumMode: BarcodeChecksumMode,
): BarcodeGeneration {
  const value = input.trim();
  if (!value) return { ok: false, error: "empty" };
  if (!/^\d+$/.test(value)) return { ok: false, error: "characters" };

  const payloadLength = format === "ean13" ? 12 : 11;
  const completeLength = payloadLength + 1;
  const expectedLength =
    checksumMode === "calculate" ? payloadLength : completeLength;
  if (value.length !== expectedLength) {
    return { ok: false, error: "length", expectedLength };
  }

  let completeValue = value;
  if (checksumMode === "calculate") {
    completeValue += calculateGs1CheckDigit(value);
  } else {
    const expectedCheckDigit = calculateGs1CheckDigit(value.slice(0, -1));
    if (value.at(-1) !== expectedCheckDigit) {
      return {
        ok: false,
        error: "checksum",
        expectedCheckDigit,
      };
    }
  }

  return {
    ok: true,
    symbol:
      format === "ean13"
        ? encodeEan13(completeValue)
        : encodeUpca(completeValue),
    checksumMode,
  };
}

function isExtendedBar(format: BarcodeFormat, moduleIndex: number): boolean {
  if (GUARD_MODULES.has(moduleIndex)) return true;
  if (format !== "upca") return false;
  return (
    (moduleIndex >= 3 && moduleIndex < 10) ||
    (moduleIndex >= 85 && moduleIndex < 92)
  );
}

export function buildBarcodeLayout(
  symbol: EncodedBarcode,
  options: BarcodeLayoutOptions,
): BarcodeLayout {
  const { moduleWidth, barHeight, showHumanReadable } = options;
  if (!Number.isInteger(moduleWidth) || moduleWidth < 1 || moduleWidth > 8) {
    throw new Error("Module width must be a whole value from 1 to 8.");
  }
  if (!Number.isInteger(barHeight) || barHeight < 40 || barHeight > 240) {
    throw new Error("Bar height must be a whole value from 40 to 240.");
  }
  if (
    symbol.modules.length !== EAN_UPC_MODULE_COUNT ||
    /[^01]/.test(symbol.modules)
  ) {
    throw new Error("Barcode symbol contains invalid modules.");
  }

  const topPadding = Math.max(8, moduleWidth * 4);
  const guardExtension = moduleWidth * 5;
  const bars: BarcodeBar[] = [];

  for (let index = 0; index < symbol.modules.length; index += 1) {
    if (symbol.modules[index] !== "1") continue;
    bars.push({
      x: (QUIET_ZONE_MODULES + index) * moduleWidth,
      y: topPadding,
      width: moduleWidth,
      height:
        barHeight + (isExtendedBar(symbol.format, index) ? guardExtension : 0),
    });
  }

  const width = (EAN_UPC_MODULE_COUNT + QUIET_ZONE_MODULES * 2) * moduleWidth;
  const barsBottom = topPadding + barHeight + guardExtension;
  const fontSize = Math.max(14, moduleWidth * 7);
  const textY = barsBottom + fontSize + 4;
  const height = showHumanReadable ? textY + 8 : barsBottom + 8;

  return {
    width,
    height,
    bars,
    textX: width / 2,
    textY,
    fontSize,
  };
}

export function buildBarcodeSvg(
  symbol: EncodedBarcode,
  options: BarcodeLayoutOptions,
): string {
  const layout = buildBarcodeLayout(symbol, options);
  const bars = layout.bars
    .map(
      (bar) =>
        `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}"/>`,
    )
    .join("");
  const text = options.showHumanReadable
    ? `<text x="${layout.textX}" y="${layout.textY}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${layout.fontSize}" fill="#000">${symbol.value}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">${bars}</g>${text}</svg>`;
}

async function barcodeSvgToPng(
  svg: string,
  width: number,
  height: number,
): Promise<Blob> {
  const source = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(source);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("SVG preview could not be rasterized."));
      image.src = url;
    });

    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasToBlob(canvas, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function formatLabel(format: BarcodeFormat): string {
  return format === "ean13" ? "EAN-13" : "UPC-A";
}

export default function BarcodeGen() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [content, setContent] = useState("");
  const [format, setFormat] = useState<BarcodeFormat>("ean13");
  const [checksumMode, setChecksumMode] =
    useState<BarcodeChecksumMode>("calculate");
  const [moduleWidth, setModuleWidth] = useState(2);
  const [barHeight, setBarHeight] = useState(96);
  const [showHumanReadable, setShowHumanReadable] = useState(true);
  const [result, setResult] = useState<BarcodeGeneration | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState("");

  const resetResult = () => {
    setResult(null);
    setExportError("");
  };
  const successfulResult = result?.ok ? result : null;
  const layout = successfulResult
    ? buildBarcodeLayout(successfulResult.symbol, {
        moduleWidth,
        barHeight,
        showHumanReadable,
      })
    : null;

  const expectedLength =
    format === "ean13"
      ? checksumMode === "calculate"
        ? 12
        : 13
      : checksumMode === "calculate"
        ? 11
        : 12;

  const errorDescription =
    result && !result.ok
      ? result.error === "empty"
        ? isEn
          ? "Enter numeric content."
          : "Введите цифровое содержимое."
        : result.error === "characters"
          ? isEn
            ? "EAN-13 and UPC-A accept digits only."
            : "EAN-13 и UPC-A принимают только цифры."
          : result.error === "length"
            ? isEn
              ? `${formatLabel(format)} in this checksum mode requires exactly ${result.expectedLength} digits.`
              : `Для ${formatLabel(format)} в этом режиме контрольной цифры требуется ровно ${result.expectedLength} цифр.`
            : isEn
              ? `The check digit is incorrect. Expected ${result.expectedCheckDigit}.`
              : `Контрольная цифра неверна. Ожидалась цифра ${result.expectedCheckDigit}.`
      : "";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Generate a retail barcode" : "Создайте товарный штрихкод"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "The generator supports EAN-13 and UPC-A and validates the check digit."
            : "Генератор поддерживает проверенные форматы EAN‑13 и UPC‑A."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setExportError("");
            setResult(generateBarcode(content, format, checksumMode));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div>
              <Label htmlFor="barcode-content">
                {isEn ? "Numeric content" : "Цифровое содержимое"}
              </Label>
              <Input
                id="barcode-content"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                value={content}
                aria-invalid={result?.ok === false || undefined}
                aria-describedby="barcode-content-hint"
                onChange={(event) => {
                  setContent(event.target.value);
                  resetResult();
                }}
                placeholder={isEn ? "Digits only" : "Только цифры"}
                className="mt-1.5 h-12 font-mono"
              />
              <p
                id="barcode-content-hint"
                className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]"
              >
                {isEn
                  ? `Enter exactly ${expectedLength} digits for the selected checksum mode.`
                  : `Введите ровно ${expectedLength} цифр для выбранного режима контрольной цифры.`}
              </p>
            </div>

            <div>
              <Label htmlFor="barcode-format">
                {isEn ? "Format" : "Формат"}
              </Label>
              <select
                id="barcode-format"
                value={format}
                onChange={(event) => {
                  setFormat(event.target.value as BarcodeFormat);
                  resetResult();
                }}
                className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="ean13">EAN-13</option>
                <option value="upca">UPC-A</option>
              </select>
            </div>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Barcode size={20} weight="bold" aria-hidden="true" />}
          >
            {isEn ? "Generate barcode" : "Создать штрихкод"}
          </ToolPrimaryAction>
        </form>

        {result ? (
          <ToolResult
            status={result.ok ? "success" : "error"}
            title={
              result.ok
                ? isEn
                  ? `${formatLabel(result.symbol.format)} generated`
                  : `${formatLabel(result.symbol.format)} создан`
                : isEn
                  ? "Barcode was not generated"
                  : "Штрихкод не создан"
            }
            description={
              result.ok
                ? isEn
                  ? `Complete value: ${result.symbol.value}. Check digit ${result.checksumMode === "calculate" ? "calculated" : "validated"}.`
                  : `Полное значение: ${result.symbol.value}. Контрольная цифра ${result.checksumMode === "calculate" ? "рассчитана" : "проверена"}.`
                : errorDescription
            }
            className="mt-5"
            data-barcode-valid={String(result.ok)}
          >
            {successfulResult && layout ? (
              <div>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    width={layout.width}
                    height={layout.height}
                    role="img"
                    aria-label={
                      isEn
                        ? `${formatLabel(successfulResult.symbol.format)} barcode ${successfulResult.symbol.value}`
                        : `Штрихкод ${formatLabel(successfulResult.symbol.format)} ${successfulResult.symbol.value}`
                    }
                    shapeRendering="crispEdges"
                    className="mx-auto h-auto max-w-full"
                  >
                    <rect width="100%" height="100%" fill="#fff" />
                    <g fill="#000">
                      {layout.bars.map((bar, index) => (
                        <rect
                          key={index}
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                        />
                      ))}
                    </g>
                    {showHumanReadable ? (
                      <text
                        x={layout.textX}
                        y={layout.textY}
                        textAnchor="middle"
                        fontFamily="ui-monospace, monospace"
                        fontSize={layout.fontSize}
                        fill="#000"
                      >
                        {successfulResult.symbol.value}
                      </text>
                    ) : null}
                  </svg>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setExportError("");
                      const svg = buildBarcodeSvg(successfulResult.symbol, {
                        moduleWidth,
                        barHeight,
                        showHumanReadable,
                      });
                      downloadBlob(
                        new Blob([svg], {
                          type: "image/svg+xml;charset=utf-8",
                        }),
                        `barcode-${successfulResult.symbol.format}-${successfulResult.symbol.value}.svg`,
                      );
                    }}
                  >
                    <FileSvg size={18} aria-hidden="true" />
                    {isEn ? "Download SVG" : "Скачать SVG"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isExportingPng}
                    onClick={() => {
                      setExportError("");
                      setIsExportingPng(true);
                      const svg = buildBarcodeSvg(successfulResult.symbol, {
                        moduleWidth,
                        barHeight,
                        showHumanReadable,
                      });
                      void barcodeSvgToPng(svg, layout.width, layout.height)
                        .then((blob) => {
                          downloadBlob(
                            blob,
                            `barcode-${successfulResult.symbol.format}-${successfulResult.symbol.value}.png`,
                          );
                        })
                        .catch(() => {
                          setExportError(
                            isEn
                              ? "PNG export failed in this browser. SVG is still available."
                              : "Не удалось создать PNG в этом браузере. SVG остаётся доступным.",
                          );
                        })
                        .finally(() => setIsExportingPng(false));
                    }}
                  >
                    {isExportingPng ? (
                      <DownloadSimple size={18} aria-hidden="true" />
                    ) : (
                      <FileImage size={18} aria-hidden="true" />
                    )}
                    {isExportingPng
                      ? isEn
                        ? "Preparing PNG…"
                        : "Готовим PNG…"
                      : isEn
                        ? "Download PNG"
                        : "Скачать PNG"}
                  </Button>
                </div>
                {exportError ? (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-[var(--color-danger)]"
                  >
                    {exportError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </ToolResult>
        ) : null}

        <AdvancedSettings
          className="mt-5"
          title={
            isEn
              ? "Size, text and checksum"
              : "Размер, текст и контрольная цифра"
          }
          description={
            isEn
              ? "Secondary rendering and validation controls"
              : "Дополнительные настройки отображения и проверки"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="barcode-module-width">
                {isEn
                  ? `Module width: ${moduleWidth}px`
                  : `Ширина модуля: ${moduleWidth}px`}
              </Label>
              <input
                id="barcode-module-width"
                type="range"
                min="2"
                max="4"
                step="1"
                value={moduleWidth}
                onChange={(event) => {
                  setModuleWidth(Number(event.target.value));
                  setExportError("");
                }}
                className="mt-1.5 min-h-11 w-full accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <Label htmlFor="barcode-bar-height">
                {isEn
                  ? `Bar height: ${barHeight}px`
                  : `Высота штрихов: ${barHeight}px`}
              </Label>
              <input
                id="barcode-bar-height"
                type="range"
                min="64"
                max="160"
                step="4"
                value={barHeight}
                onChange={(event) => {
                  setBarHeight(Number(event.target.value));
                  setExportError("");
                }}
                className="mt-1.5 min-h-11 w-full accent-[var(--color-primary)]"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="barcode-checksum-mode">
              {isEn ? "Checksum behavior" : "Контрольная цифра"}
            </Label>
            <select
              id="barcode-checksum-mode"
              value={checksumMode}
              onChange={(event) => {
                setChecksumMode(event.target.value as BarcodeChecksumMode);
                resetResult();
              }}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            >
              <option value="calculate">
                {isEn
                  ? "Calculate and append check digit"
                  : "Рассчитать и добавить контрольную цифру"}
              </option>
              <option value="validate">
                {isEn
                  ? "Require and validate check digit"
                  : "Требовать и проверить контрольную цифру"}
              </option>
            </select>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Calculation accepts the payload without its final digit. Validation requires the complete value and rejects a mismatch."
                : "Расчёт принимает данные без последней цифры. Проверка требует полное значение и отклоняет несовпадение."}
            </p>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={showHumanReadable}
              onChange={(event) => {
                setShowHumanReadable(event.target.checked);
                setExportError("");
              }}
              className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <span>
              {isEn
                ? "Show human-readable digits"
                : "Показывать цифры под штрихами"}
            </span>
          </label>

          <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-xs leading-5 text-[var(--color-text-muted)]">
            {isEn
              ? "This creates the symbol from a supplied number. It does not allocate, register or verify ownership of a GTIN."
              : "Инструмент создаёт символ из указанного номера. Он не выделяет, не регистрирует и не проверяет владельца GTIN."}
          </p>
        </AdvancedSettings>
      </section>
    </div>
  );
}
