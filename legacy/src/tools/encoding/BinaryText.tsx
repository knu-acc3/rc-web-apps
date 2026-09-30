"use client";

import { useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type Mode = "text-to-binary" | "binary-to-text";
type ByteSeparator = "space" | "newline" | "none";
type DecodeError =
  "empty" | "invalid-character" | "invalid-byte" | "invalid-utf8";

interface DecodeResult {
  value: string;
  error: DecodeError | null;
}

function byteSeparatorValue(separator: ByteSeparator) {
  if (separator === "newline") return "\n";
  if (separator === "none") return "";
  return " ";
}

function encodeUtf8(text: string, separator: ByteSeparator) {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (byte) => byte.toString(2).padStart(8, "0")).join(
    byteSeparatorValue(separator),
  );
}

function binaryByteGroups(input: string): {
  bytes: Uint8Array | null;
  error: DecodeError | null;
} {
  const trimmed = input.trim();
  if (!trimmed) return { bytes: null, error: "empty" };
  if (!/^[01\s]+$/.test(trimmed)) {
    return { bytes: null, error: "invalid-character" };
  }

  let groups: string[];
  if (/\s/.test(trimmed)) {
    groups = trimmed.split(/\s+/);
    if (groups.some((group) => group.length !== 8)) {
      return { bytes: null, error: "invalid-byte" };
    }
  } else {
    if (trimmed.length % 8 !== 0) {
      return { bytes: null, error: "invalid-byte" };
    }
    groups = trimmed.match(/.{8}/g) ?? [];
  }

  if (groups.length === 0 || groups.some((group) => !/^[01]{8}$/.test(group))) {
    return { bytes: null, error: "invalid-byte" };
  }

  return {
    bytes: Uint8Array.from(groups, (group) => Number.parseInt(group, 2)),
    error: null,
  };
}

function decodeUtf8(input: string): DecodeResult {
  const parsed = binaryByteGroups(input);
  if (!parsed.bytes) return { value: "", error: parsed.error };

  try {
    return {
      value: new TextDecoder("utf-8", { fatal: true }).decode(parsed.bytes),
      error: null,
    };
  } catch {
    return { value: "", error: "invalid-utf8" };
  }
}

export default function BinaryText() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<Mode>("text-to-binary");
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState<ByteSeparator>("space");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setResult("");
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setInput("");
    invalidate();
  };

  const errorMessage = (code: DecodeError) => {
    const messages: Record<DecodeError, [string, string]> = {
      empty: ["Введите двоичные байты.", "Enter binary bytes."],
      "invalid-character": [
        "Допустимы только 0, 1 и пробельные разделители.",
        "Only 0, 1 and whitespace separators are allowed.",
      ],
      "invalid-byte": [
        "Каждая группа должна содержать ровно 8 бит. Непрерывная строка должна делиться на 8 без остатка.",
        "Each byte group must contain exactly 8 bits. A continuous bit string must be divisible by 8.",
      ],
      "invalid-utf8": [
        "Байты не образуют корректную последовательность UTF-8.",
        "The bytes do not form a valid UTF-8 sequence.",
      ],
    };
    return messages[code][isEn ? 1 : 0];
  };

  const convert = () => {
    if (mode === "text-to-binary") {
      if (!input) {
        setError(
          isEn ? "Enter text to encode." : "Введите текст для кодирования.",
        );
        setResult("");
        return;
      }
      setResult(encodeUtf8(input, separator));
      setError("");
      setCopied(false);
      setCopyFailed(false);
      return;
    }

    const decoded = decodeUtf8(input);
    if (decoded.error) {
      setError(errorMessage(decoded.error));
      setResult("");
      return;
    }
    setResult(decoded.value);
    setError("");
    setCopied(false);
    setCopyFailed(false);
  };

  const copyResult = async () => {
    const success = await copyText(result);
    setCopyFailed(!success);
    if (!success) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div
          role="group"
          aria-label={
            isEn ? "Conversion direction" : "Направление преобразования"
          }
          className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
        >
          {(["text-to-binary", "binary-to-text"] as const).map((value) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => changeMode(value)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
                  selected
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {value === "text-to-binary"
                  ? isEn
                    ? "Text → binary"
                    : "Текст → двоичный"
                  : isEn
                    ? "Binary → text"
                    : "Двоичный → текст"}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <Label htmlFor="binary-text-input">
            {mode === "text-to-binary"
              ? isEn
                ? "Text (UTF-8)"
                : "Текст (UTF-8)"
              : isEn
                ? "Binary bytes"
                : "Двоичные байты"}
          </Label>
          <Textarea
            id="binary-text-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              invalidate();
            }}
            placeholder={
              mode === "text-to-binary"
                ? isEn
                  ? "Enter text"
                  : "Введите текст"
                : isEn
                  ? "Enter 8-bit byte groups"
                  : "Введите группы по 8 бит"
            }
            className="mt-1.5 min-h-36 resize-y font-mono text-base"
            spellCheck={false}
          />
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={convert}>
          {mode === "text-to-binary"
            ? isEn
              ? "Encode as UTF-8 binary"
              : "Кодировать в UTF-8"
            : isEn
              ? "Decode UTF-8"
              : "Декодировать UTF-8"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the input" : "Проверьте ввод"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={isEn ? "Converted result" : "Готовый результат"}
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
            {mode === "text-to-binary" ? (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-base leading-7 text-[var(--color-text)]">
                {result}
              </pre>
            ) : (
              <p className="whitespace-pre-wrap break-words text-xl font-bold leading-relaxed text-[var(--color-text)]">
                {result}
              </p>
            )}
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
                ? "The converted value will appear here."
                : "Преобразованное значение появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Binary output format" : "Формат двоичного вывода"}
          description={
            isEn
              ? "Choose the separator between encoded UTF-8 bytes"
              : "Выберите разделитель между байтами UTF-8"
          }
        >
          <Label htmlFor="binary-byte-separator">
            {isEn ? "Byte separator" : "Разделитель байтов"}
          </Label>
          <select
            id="binary-byte-separator"
            value={separator}
            disabled={mode === "binary-to-text"}
            onChange={(event) => {
              setSeparator(event.target.value as ByteSeparator);
              invalidate();
            }}
            className="mt-1.5 h-11 w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] disabled:opacity-50"
          >
            <option value="space">{isEn ? "Space" : "Пробел"}</option>
            <option value="newline">
              {isEn ? "New line" : "Новая строка"}
            </option>
            <option value="none">
              {isEn ? "No separator" : "Без разделителя"}
            </option>
          </select>
          {mode === "binary-to-text" ? (
            <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? "Decoding accepts whitespace-separated 8-bit groups or one continuous bit string."
                : "Декодирование принимает 8-битные группы с пробелами или одну непрерывную строку."}
            </p>
          ) : null}
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Encoding uses TextEncoder UTF-8 bytes. Decoding uses fatal TextDecoder validation, so malformed byte sequences are rejected instead of being replaced silently."
            : "Кодирование использует UTF-8-байты TextEncoder. Декодирование выполняется через TextDecoder в строгом режиме: повреждённые последовательности отклоняются, а не заменяются молча."}
        </p>
      </section>
    </div>
  );
}
