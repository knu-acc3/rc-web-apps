"use client";

import { useState } from "react";
import { ArrowRight, FileArrowDown, FileArrowUp } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { downloadBlob } from "@/src/utils/exportHelpers";

type Direction = "encode" | "decode";
type SourceMode = "text" | "file";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64Bytes(value: string): Uint8Array {
  const cleaned = value.replace(/[ \t\r\n]/g, "");
  if (
    !cleaned ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      cleaned,
    )
  ) {
    throw new Error("base64");
  }
  const binary = atob(cleaned);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeUtf8Base64(value: string): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(
    decodeBase64Bytes(value),
  );
}

function safeFileName(value: string) {
  return (
    value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-") || "decoded.bin"
  );
}

export default function Base64Encoder() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);
  const [outputFileName, setOutputFileName] = useState("decoded.bin");
  const [includeDataUri, setIncludeDataUri] = useState(false);
  const [error, setError] = useState("");

  const invalidate = () => {
    setResult("");
    setResultBytes(null);
    setError("");
  };

  const convert = async () => {
    try {
      if (direction === "encode" && sourceMode === "file") {
        if (!file) return;
        const MAX_TEXTAREA_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_TEXTAREA_SIZE) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const encoded = bytesToBase64(bytes);
          const fullEncoded = includeDataUri
            ? "data:" + (file.type || "application/octet-stream") + ";base64," + encoded
            : encoded;
          const blob = new Blob([fullEncoded], { type: "text/plain;charset=utf-8" });
          downloadBlob(blob, `${file.name}.base64.txt`);
          setResult(
            isEn
              ? `File is large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Base64 text was downloaded directly to avoid browser memory crash.`
              : `Файл слишком велик (${(file.size / (1024 * 1024)).toFixed(1)} МБ). Base64-текст скачан файлом во избежание зависания браузера.`
          );
          setResultBytes(bytes);
          return;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const encoded = bytesToBase64(bytes);
        setResult(
          includeDataUri
            ? "data:" +
                (file.type || "application/octet-stream") +
                ";base64," +
                encoded
            : encoded,
        );
        setResultBytes(bytes);
      } else if (direction === "decode" && sourceMode === "file") {
        const bytes = decodeBase64Bytes(input);
        setResult("");
        setResultBytes(bytes);
      } else {
        const next =
          direction === "encode"
            ? bytesToBase64(new TextEncoder().encode(input))
            : decodeUtf8Base64(input);
        setResult(next);
        setResultBytes(null);
      }
      setError("");
    } catch {
      setResult("");
      setError(
        isEn
          ? "Invalid Base64 or decoded bytes are not valid UTF-8."
          : "Некорректный Base64 или декодированные байты не являются UTF-8.",
      );
    }
  };

  const downloadDecoded = () => {
    if (!resultBytes) return;
    downloadBlob(
      new Blob([resultBytes as BlobPart], {
        type: "application/octet-stream",
      }),
      safeFileName(outputFileName),
    );
  };

  const needsTextInput = sourceMode === "text" || direction === "decode";
  const canRun =
    direction === "encode" && sourceMode === "file"
      ? Boolean(file)
      : Boolean(input);

  return (
    <div data-encoding-tool="base64" className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold">
          {isEn ? "Base64 converter" : "Конвертер Base64"}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup">
          {(["text", "file"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={sourceMode === item}
              onClick={() => {
                setSourceMode(item);
                setInput("");
                setFile(null);
                invalidate();
              }}
              className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 font-semibold aria-checked:border-[var(--color-primary)] aria-checked:bg-[var(--color-primary-soft)] aria-checked:text-[var(--color-primary)]"
            >
              {item === "text"
                ? isEn
                  ? "Text"
                  : "Текст"
                : isEn
                  ? "File"
                  : "Файл"}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
          {(["encode", "decode"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={direction === item}
              onClick={() => {
                setDirection(item);
                setInput("");
                setFile(null);
                invalidate();
              }}
              className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 font-semibold aria-checked:border-[var(--color-primary)] aria-checked:bg-[var(--color-primary-soft)] aria-checked:text-[var(--color-primary)]"
            >
              {item === "encode"
                ? isEn
                  ? "Encode"
                  : "Кодировать"
                : isEn
                  ? "Decode"
                  : "Декодировать"}
            </button>
          ))}
        </div>
        {needsTextInput ? (
          <>
            <Label htmlFor="base64-input" className="mt-4 block">
              {direction === "encode"
                ? isEn
                  ? "UTF-8 text"
                  : "Текст UTF-8"
                : sourceMode === "file"
                  ? isEn
                    ? "Base64 file data"
                    : "Данные файла Base64"
                  : "Base64"}
            </Label>
            <Textarea
              id="base64-input"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                invalidate();
              }}
              placeholder={
                direction === "encode"
                  ? isEn
                    ? "Enter text"
                    : "Введите текст"
                  : isEn
                    ? "Paste Base64"
                    : "Вставьте Base64"
              }
              className="mt-2 min-h-36 font-mono"
              spellCheck={false}
            />
          </>
        ) : (
          <div className="mt-4">
            <Label htmlFor="base64-file">{isEn ? "File" : "Файл"}</Label>
            <label
              htmlFor="base64-file"
              className="mt-2 flex min-h-24 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-3"
            >
              <FileArrowUp
                size={26}
                className="shrink-0 text-[var(--color-primary)]"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">
                  {file?.name ?? (isEn ? "Choose a file" : "Выберите файл")}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                  {file
                    ? file.size.toLocaleString() + " B"
                    : isEn
                      ? "Processed only in this browser"
                      : "Обработка только в этом браузере"}
                </span>
              </span>
            </label>
            <input
              id="base64-file"
              type="file"
              data-file-paste-target="true"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                invalidate();
              }}
            />
          </div>
        )}
        {error ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
        <ToolPrimaryAction
          type="button"
          onClick={() => void convert()}
          disabled={!canRun}
          className="mt-4"
          leadingIcon={<ArrowRight size={20} />}
        >
          {direction === "encode"
            ? isEn
              ? "Encode Base64"
              : "Кодировать Base64"
            : isEn
              ? sourceMode === "file"
                ? "Decode file"
                : "Decode Base64"
              : sourceMode === "file"
                ? "Декодировать файл"
                : "Декодировать Base64"}
        </ToolPrimaryAction>
        <AdvancedSettings
          className="mt-4"
          title={isEn ? "File settings" : "Параметры файла"}
          description={
            isEn
              ? "Data URI and downloaded filename"
              : "Data URI и имя скачиваемого файла"
          }
        >
          {sourceMode === "file" && direction === "encode" ? (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={includeDataUri}
                onChange={(event) => {
                  setIncludeDataUri(event.target.checked);
                  invalidate();
                }}
                className="size-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Include data URI prefix" : "Добавить префикс data URI"}
            </label>
          ) : sourceMode === "file" && direction === "decode" ? (
            <div>
              <Label htmlFor="base64-output-name">
                {isEn ? "Downloaded filename" : "Имя скачиваемого файла"}
              </Label>
              <Input
                id="base64-output-name"
                value={outputFileName}
                onChange={(event) => setOutputFileName(event.target.value)}
                className="mt-2 h-11"
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {isEn
                ? "Switch to File mode to access file-specific settings."
                : "Переключитесь в режим «Файл» для параметров файлов."}
            </p>
          )}
        </AdvancedSettings>
      </section>
      {result ||
      (sourceMode === "file" && direction === "decode" && resultBytes) ? (
        <section
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">
              {isEn ? "Result" : "Результат"}
            </h2>
            {sourceMode === "file" && direction === "decode" ? (
              <Button type="button" onClick={downloadDecoded}>
                <FileArrowDown size={18} aria-hidden="true" />
                {isEn ? "Download" : "Скачать"}
              </Button>
            ) : (
              <CopyButton text={result} size="medium" />
            )}
          </div>
          {sourceMode === "file" && direction === "decode" ? (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? (resultBytes?.length ?? 0).toLocaleString() + " decoded bytes"
                : "Декодировано байт: " +
                  (resultBytes?.length ?? 0).toLocaleString()}
            </p>
          ) : (
            <Textarea
              value={result}
              readOnly
              className="mt-3 min-h-28 font-mono"
            />
          )}
        </section>
      ) : null}
    </div>
  );
}
