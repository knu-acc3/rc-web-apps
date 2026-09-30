"use client";

import { useState } from "react";
import { LinkSimple } from "@phosphor-icons/react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type Direction = "encode" | "decode";
type UrlMode = "component" | "full-url";

function transformUrl(
  value: string,
  direction: Direction,
  mode: UrlMode,
  plusAsSpace: boolean,
) {
  if (direction === "encode") {
    return mode === "component" ? encodeURIComponent(value) : encodeURI(value);
  }

  const source =
    mode === "component" && plusAsSpace ? value.replaceAll("+", " ") : value;
  return mode === "component" ? decodeURIComponent(source) : decodeURI(source);
}

export default function UrlEncoder() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("encode");
  const [mode, setMode] = useState<UrlMode>("component");
  const [plusAsSpace, setPlusAsSpace] = useState(false);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const invalidate = () => {
    setResult("");
    setError("");
    setHasRun(false);
    setCopied(false);
    setCopyFailed(false);
  };

  const chooseDirection = (next: Direction) => {
    setDirection(next);
    invalidate();
  };

  const convert = () => {
    if (!input) {
      setResult("");
      setError(
        isEn
          ? direction === "encode"
            ? "Enter text or a URL component."
            : "Enter percent-encoded text."
          : direction === "encode"
            ? "Введите текст или компонент URL."
            : "Введите текст с percent-кодированием.",
      );
      setHasRun(true);
      return;
    }

    try {
      setResult(transformUrl(input, direction, mode, plusAsSpace));
      setError("");
    } catch {
      setResult("");
      setError(
        isEn
          ? "The percent-encoded input is malformed. Check every % sequence and its UTF-8 bytes."
          : "Некорректное percent-кодирование. Проверьте каждую последовательность % и байты UTF-8.",
      );
    }
    setHasRun(true);
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
          className="grid grid-cols-2 gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1"
        >
          {(["encode", "decode"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={direction === value}
              onClick={() => chooseDirection(value)}
              className={cn(
                "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]",
                direction === value
                  ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                  : "text-[var(--color-text-muted)]",
              )}
            >
              {value === "encode"
                ? isEn
                  ? "Encode"
                  : "Кодировать"
                : isEn
                  ? "Decode"
                  : "Декодировать"}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="url-encoder-input">
            {direction === "encode"
              ? isEn
                ? "Text or URL component"
                : "Текст или компонент URL"
              : isEn
                ? "Percent-encoded text"
                : "Текст с percent-кодированием"}
          </Label>
          <Textarea
            id="url-encoder-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              invalidate();
            }}
            placeholder={
              direction === "encode"
                ? isEn
                  ? "Enter the value to encode"
                  : "Введите значение для кодирования"
                : isEn
                  ? "Paste the value to decode"
                  : "Вставьте значение для декодирования"
            }
            className="mt-1.5 min-h-40 resize-y font-mono text-base"
            spellCheck={false}
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={convert}
          disabled={!input}
          leadingIcon={<LinkSimple size={20} aria-hidden="true" />}
        >
          {direction === "encode"
            ? isEn
              ? "Encode URL"
              : "Кодировать URL"
            : isEn
              ? "Decode URL"
              : "Декодировать URL"}
        </ToolPrimaryAction>

        {hasRun ? (
          error ? (
            <ToolResult
              status="error"
              title={isEn ? "Check the input" : "Проверьте ввод"}
              description={error}
              className="mt-5"
            />
          ) : (
            <ToolResult
              status="success"
              title={isEn ? "Result" : "Результат"}
              className="mt-5"
              actions={
                <Button
                  type="button"
                  variant="secondary"
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
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-sm leading-6">
                {result}
              </pre>
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
          )
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
          title={isEn ? "URL encoding mode" : "Режим URL-кодирования"}
          description={
            isEn ? "Component or complete URL" : "Компонент или полный URL"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="url-encoding-mode">
                {isEn ? "Value type" : "Тип значения"}
              </Label>
              <select
                id="url-encoding-mode"
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as UrlMode);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="component">
                  {isEn ? "URL component" : "Компонент URL"}
                </option>
                <option value="full-url">
                  {isEn ? "Complete URL" : "Полный URL"}
                </option>
              </select>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
                {mode === "component"
                  ? isEn
                    ? "Encodes reserved characters such as /, ?, & and =."
                    : "Кодирует зарезервированные символы /, ?, & и =."
                  : isEn
                    ? "Keeps URL syntax such as ://, /, ? and #."
                    : "Сохраняет синтаксис URL: ://, /, ? и #."}
              </p>
            </div>

            {direction === "decode" && mode === "component" ? (
              <label className="flex min-h-11 items-center gap-3 self-start rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm sm:mt-6">
                <input
                  type="checkbox"
                  checked={plusAsSpace}
                  onChange={(event) => {
                    setPlusAsSpace(event.target.checked);
                    invalidate();
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                {isEn
                  ? "Treat + as a space (form data)"
                  : "Считать + пробелом (данные формы)"}
              </label>
            ) : null}
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
