"use client";

import { useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type Algorithm = "crc32" | "adler32";
type DisplayFormat = "hex-upper" | "hex-lower" | "decimal";
type SourceMode = "text" | "file";

const CRC32_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export function crc32(bytes: Uint8Array) {
  let checksum = 0xffffffff;
  for (const byte of bytes) {
    checksum = CRC32_TABLE[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

export function adler32(bytes: Uint8Array) {
  const modulus = 65_521;
  let a = 1;
  let b = 0;

  for (const byte of bytes) {
    a = (a + byte) % modulus;
    b = (b + a) % modulus;
  }

  return ((b << 16) | a) >>> 0;
}

export function checksumBytes(bytes: Uint8Array, algorithm: Algorithm) {
  return algorithm === "crc32" ? crc32(bytes) : adler32(bytes);
}

export function checksumText(text: string, algorithm: Algorithm) {
  return checksumBytes(new TextEncoder().encode(text), algorithm);
}

export function formatChecksum(value: number, format: DisplayFormat) {
  if (format === "decimal") return String(value >>> 0);
  const hexadecimal = (value >>> 0).toString(16).padStart(8, "0");
  return format === "hex-upper" ? hexadecimal.toUpperCase() : hexadecimal;
}

export default function ChecksumCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("crc32");
  const [displayFormat, setDisplayFormat] =
    useState<DisplayFormat>("hex-upper");
  const [result, setResult] = useState<number | null>(null);
  const [byteCount, setByteCount] = useState(0);
  const [processedName, setProcessedName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setResult(null);
    setByteCount(0);
    setProcessedName("");
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const calculate = async () => {
    setLoading(true);
    setError("");

    try {
      let bytes: Uint8Array;
      if (sourceMode === "file") {
        if (!file) {
          setResult(null);
          setError(isEn ? "Choose a file first." : "Сначала выберите файл.");
          return;
        }
        bytes = new Uint8Array(await file.arrayBuffer());
      } else {
        bytes = new TextEncoder().encode(input);
      }

      setResult(checksumBytes(bytes, algorithm));
      setByteCount(bytes.length);
      setProcessedName(sourceMode === "file" ? (file?.name ?? "") : "");
      setCopied(false);
      setCopyFailed(false);
    } catch {
      setResult(null);
      setError(
        isEn
          ? "The browser could not read this file."
          : "Браузер не смог прочитать этот файл.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formattedResult =
    result === null ? "" : formatChecksum(result, displayFormat);

  const copyResult = async () => {
    const success = await copyText(formattedResult);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label id="checksum-source-label">
              {isEn ? "Source" : "Источник"}
            </Label>
            <div
              role="radiogroup"
              aria-labelledby="checksum-source-label"
              className="mt-1.5 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
            >
              {(["text", "file"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={sourceMode === value}
                  onClick={() => {
                    setSourceMode(value);
                    if (value === "file") setFile(null);
                    invalidate();
                  }}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
                    sourceMode === value
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  {value === "text"
                    ? isEn
                      ? "Text"
                      : "Текст"
                    : isEn
                      ? "File"
                      : "Файл"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label id="checksum-algorithm-label">
              {isEn ? "Algorithm" : "Алгоритм"}
            </Label>
            <div
              role="radiogroup"
              aria-labelledby="checksum-algorithm-label"
              className="mt-1.5 grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
            >
              {(["crc32", "adler32"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={algorithm === value}
                  onClick={() => {
                    setAlgorithm(value);
                    invalidate();
                  }}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
                    algorithm === value
                      ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                  )}
                >
                  {value === "crc32" ? "CRC-32" : "Adler-32"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sourceMode === "text" ? (
          <div className="mt-4">
            <Label htmlFor="checksum-input">
              {isEn ? "Text (UTF-8)" : "Текст (UTF-8)"}
            </Label>
            <Textarea
              id="checksum-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                invalidate();
              }}
              placeholder={isEn ? "Enter text" : "Введите текст"}
              className="mt-1.5 min-h-36 resize-y font-mono text-base"
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? "Calculated from the exact UTF-8 bytes. An empty value is valid input."
                : "Расчёт идёт по точным байтам UTF-8. Пустое значение тоже допустимо."}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <input
              id="checksum-file"
              type="file"
              data-file-paste-target="true"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                invalidate();
              }}
              className="peer sr-only"
            />
            <Label
              htmlFor="checksum-file"
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]/45 px-3.5 py-3 transition-colors hover:bg-[var(--color-surface-muted)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-ring)]"
            >
              <UploadSimple
                size={20}
                className="shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">
                {file ? file.name : isEn ? "Choose a file" : "Выберите файл"}
              </span>
            </Label>
            <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              {file
                ? `${file.size.toLocaleString(isEn ? "en" : "ru")} ${isEn ? "exact bytes" : "точных байт"}`
                : isEn
                  ? "The file stays in your browser and is read as exact bytes."
                  : "Файл остаётся в браузере и читается как точная последовательность байтов."}
            </p>
          </div>
        )}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          loading={loading}
          loadingLabel={isEn ? "Calculating" : "Расчёт"}
          onClick={() => void calculate()}
        >
          {sourceMode === "file"
            ? isEn
              ? "Calculate file checksum"
              : "Рассчитать сумму файла"
            : isEn
              ? "Calculate checksum"
              : "Рассчитать сумму"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "File is required" : "Нужен файл"}
            description={error}
            className="mt-5"
          />
        ) : result !== null ? (
          <ToolResult
            status="success"
            title={algorithm === "crc32" ? "CRC-32" : "Adler-32"}
            description={
              sourceMode === "file"
                ? isEn
                  ? `${byteCount} exact bytes processed · ${processedName}`
                  : `Обработано точных байтов: ${byteCount} · ${processedName}`
                : isEn
                  ? `${byteCount} UTF-8 bytes processed`
                  : `Обработано байт UTF-8: ${byteCount}`
            }
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copyResult()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy"
                    : "Копировать"}
              </Button>
            }
          >
            <output className="block overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-4 font-mono text-2xl font-bold tracking-wider text-[var(--color-text)] sm:text-3xl">
              {formattedResult}
            </output>
            {copyFailed ? (
              <p
                role="alert"
                className="mt-2 text-sm text-[var(--color-danger)]"
              >
                {isEn
                  ? "Clipboard access was denied."
                  : "Браузер запретил доступ к буферу обмена."}
              </p>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The checksum will appear here."
                : "Здесь появится контрольная сумма."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Result format" : "Формат результата"}
          description={
            isEn
              ? "Choose hexadecimal case or decimal notation"
              : "Выберите регистр HEX или десятичную запись"
          }
        >
          <Label htmlFor="checksum-display-format">
            {isEn ? "Display" : "Отображение"}
          </Label>
          <select
            id="checksum-display-format"
            value={displayFormat}
            onChange={(event) => {
              setDisplayFormat(event.target.value as DisplayFormat);
              setCopied(false);
              setCopyFailed(false);
            }}
            className="mt-1.5 h-11 w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
          >
            <option value="hex-upper">HEX · ABCDEF</option>
            <option value="hex-lower">HEX · abcdef</option>
            <option value="decimal">
              {isEn ? "Decimal" : "Десятичное число"}
            </option>
          </select>
        </AdvancedSettings>
      </section>
    </div>
  );
}
