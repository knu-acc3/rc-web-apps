"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  DownloadSimple,
  TextAlignLeft,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { CopyButton } from "@/src/components/CopyButton";
import { downloadBlob } from "@/src/utils/exportHelpers";
import {
  formatCode,
  type CodeFormatOptions,
  type CodeLanguage,
} from "@/src/utils/beautifiers/formatCode";

type Preset = "default" | "airbnb" | "standard" | "google" | "custom";

const MAX_INPUT_BYTES = 500 * 1024;

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "JSX / TSX",
  json: "JSON",
  css: "CSS",
  scss: "SCSS",
  less: "Less",
};

const EXTENSIONS: Record<CodeLanguage, string> = {
  js: "js",
  ts: "ts",
  jsx: "tsx",
  json: "json",
  css: "css",
  scss: "scss",
  less: "less",
};

const PRESETS: Record<Exclude<Preset, "custom">, CodeFormatOptions> = {
  default: {
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    singleQuote: false,
    semicolons: true,
    trailingComma: false,
  },
  airbnb: {
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    singleQuote: true,
    semicolons: true,
    trailingComma: true,
  },
  standard: {
    tabWidth: 2,
    useTabs: false,
    printWidth: 100,
    singleQuote: true,
    semicolons: false,
    trailingComma: false,
  },
  google: {
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    singleQuote: true,
    semicolons: true,
    trailingComma: true,
  },
};

function byteSize(value: string) {
  return new TextEncoder().encode(value).length;
}

export default function JsBeautifier() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [language, setLanguage] = useState<CodeLanguage>("js");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [preset, setPreset] = useState<Preset>("default");
  const [options, setOptions] = useState<CodeFormatOptions>(PRESETS.default);
  const [autoFormat, setAutoFormat] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<number | null>(null);
  const formatRequestRef = useRef(0);

  const cancelPendingFormat = useCallback(() => {
    formatRequestRef.current += 1;
    setIsFormatting(false);
  }, []);

  const applyPreset = useCallback((nextPreset: Preset) => {
    cancelPendingFormat();
    setPreset(nextPreset);
    if (nextPreset !== "custom") setOptions(PRESETS[nextPreset]);
  }, [cancelPendingFormat]);

  const setOption = useCallback(
    <K extends keyof CodeFormatOptions>(
      key: K,
      value: CodeFormatOptions[K],
    ) => {
      cancelPendingFormat();
      setOptions((current) => ({ ...current, [key]: value }));
      setPreset("custom");
    },
    [cancelPendingFormat],
  );

  const runFormat = useCallback(async () => {
    const source = input.trim();
    if (!source) return;
    if (byteSize(input) > MAX_INPUT_BYTES) {
      setError(
        isEn ? "Input is larger than 500 KB." : "Размер кода превышает 500 КБ.",
      );
      return;
    }

    const requestId = ++formatRequestRef.current;
    setIsFormatting(true);
    setError("");
    try {
      const formatted = await formatCode(input, language, options);
      if (requestId !== formatRequestRef.current) return;
      setOutput(formatted);
    } catch (formatError) {
      if (requestId !== formatRequestRef.current) return;
      const message =
        formatError instanceof Error ? formatError.message.split("\n")[0] : "";
      setError(
        isEn
          ? `Could not format this ${LANGUAGE_LABELS[language]} code.${message ? ` ${message}` : ""}`
          : `Не удалось отформатировать ${LANGUAGE_LABELS[language]}.${message ? ` ${message}` : ""}`,
      );
    } finally {
      if (requestId === formatRequestRef.current) setIsFormatting(false);
    }
  }, [input, isEn, language, options]);

  useEffect(() => {
    if (!autoFormat || !input.trim()) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void runFormat(), 450);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [autoFormat, input, runFormat]);

  const clear = useCallback(() => {
    cancelPendingFormat();
    setInput("");
    setOutput("");
    setError("");
  }, [cancelPendingFormat]);

  const useResultAsInput = useCallback(() => {
    if (!output) return;
    cancelPendingFormat();
    setInput(output);
    setOutput("");
  }, [cancelPendingFormat, output]);

  const download = useCallback(() => {
    if (!output) return;
    downloadBlob(
      new Blob([output], { type: "text/plain;charset=utf-8" }),
      `formatted.${EXTENSIONS[language]}`,
    );
  }, [language, output]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)] sm:p-5">
      <label className="tool-short-landscape-toolbar order-0 mb-4 flex w-full flex-col gap-1.5 text-sm font-semibold sm:ml-auto sm:w-52">
        {isEn ? "Format" : "Формат"}
        <select
          value={language}
          onChange={(event) => {
            cancelPendingFormat();
            setLanguage(event.target.value as CodeLanguage);
          }}
          className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm font-semibold"
        >
          {(Object.keys(LANGUAGE_LABELS) as CodeLanguage[]).map((key) => (
            <option key={key} value={key}>
              {LANGUAGE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <div className="contents md:order-2 md:grid md:grid-cols-2 md:gap-4">
        <div className="order-2 md:order-none">
          <div className="mb-1.5 flex min-h-11 items-center justify-between gap-2 text-sm">
            <span className="font-semibold">{isEn ? "Input" : "Вход"}</span>
            <div className="flex items-center gap-1.5">
              {input ? (
                <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                  {byteSize(input)} B · {input.split("\n").length}{" "}
                  {isEn ? "lines" : "строк"}
                </span>
              ) : null}
              {input || output ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clear}
                  aria-label={isEn ? "Clear" : "Очистить"}
                  title={isEn ? "Clear" : "Очистить"}
                >
                  <X size={16} />
                </Button>
              ) : null}
            </div>
          </div>
          <Textarea
            rows={10}
            value={input}
            onChange={(event) => {
              cancelPendingFormat();
              setInput(event.target.value);
            }}
            placeholder={
              isEn
                ? `Paste ${LANGUAGE_LABELS[language]} code`
                : `Вставьте ${LANGUAGE_LABELS[language]}-код`
            }
            className="tool-short-landscape-editor min-h-48 resize-y font-mono text-sm leading-relaxed md:min-h-80"
            aria-label={isEn ? "Input" : "Вход"}
            spellCheck={false}
          />
        </div>

        <div className="order-4 md:order-none">
          <div className="mb-1.5 flex min-h-11 items-center justify-between gap-2 text-sm">
            <span className="font-semibold">
              {isEn ? "Result" : "Результат"}
            </span>
            {output ? (
              <div className="flex items-center gap-1">
                <CopyButton text={output} size="medium" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={useResultAsInput}
                  title={isEn ? "Use as input" : "Перенести во вход"}
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={download}
                  title={isEn ? "Download" : "Скачать"}
                >
                  <DownloadSimple size={16} />
                </Button>
              </div>
            ) : null}
          </div>
          <Textarea
            rows={10}
            value={output}
            readOnly
            placeholder={
              isEn ? "Formatted code appears here" : "Здесь появится результат"
            }
            className="tool-short-landscape-editor min-h-48 resize-y bg-[var(--color-surface-muted)]/50 font-mono text-sm leading-relaxed md:min-h-80"
            aria-label={isEn ? "Result" : "Результат"}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="order-3 mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="lg"
          onClick={() => void runFormat()}
          disabled={!input.trim() || isFormatting}
          className="w-full gap-2 sm:w-auto sm:min-w-52"
        >
          <TextAlignLeft size={18} />
          {isFormatting
            ? isEn
              ? "Formatting…"
              : "Форматирование…"
            : isEn
              ? "Beautify"
              : "Форматировать"}
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          className="order-4 mt-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
        >
          {error}
        </div>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Advanced settings" : "Расширенные настройки"}
        description={isEn ? "Presets and code style" : "Пресеты и стиль кода"}
        className="order-5 mt-4"
      >
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-40 flex-1 gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {isEn ? "Preset" : "Пресет"}
              <select
                value={preset}
                onChange={(event) => applyPreset(event.target.value as Preset)}
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="default">
                  {isEn ? "Default" : "По умолчанию"}
                </option>
                <option value="airbnb">Airbnb</option>
                <option value="standard">Standard</option>
                <option value="google">Google</option>
                <option value="custom">
                  {isEn ? "Custom" : "Свои настройки"}
                </option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {isEn ? "Indent" : "Отступ"}
              <select
                value={options.useTabs ? "tabs" : String(options.tabWidth)}
                onChange={(event) => {
                  const value = event.target.value;
                  setOption("useTabs", value === "tabs");
                  if (value !== "tabs")
                    setOption("tabWidth", Number(value) as 2 | 4);
                }}
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tabs">Tabs</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {isEn ? "Line width" : "Ширина строки"}
              <select
                value={options.printWidth}
                onChange={(event) =>
                  setOption(
                    "printWidth",
                    Number(event.target.value) as 80 | 100 | 120,
                  )
                }
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="80">80</option>
                <option value="100">100</option>
                <option value="120">120</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
              {isEn ? "Quotes" : "Кавычки"}
              <select
                value={options.singleQuote ? "single" : "double"}
                onChange={(event) =>
                  setOption("singleQuote", event.target.value === "single")
                }
                className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
              >
                <option value="double">{isEn ? "Double" : "Двойные"}</option>
                <option value="single">{isEn ? "Single" : "Одинарные"}</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={options.semicolons}
                onChange={(event) =>
                  setOption("semicolons", event.target.checked)
                }
              />
              {isEn ? "Semicolons" : "Точки с запятой"}
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={options.trailingComma}
                onChange={(event) =>
                  setOption("trailingComma", event.target.checked)
                }
              />
              {isEn ? "Trailing commas" : "Висячие запятые"}
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={autoFormat}
                onChange={(event) => setAutoFormat(event.target.checked)}
              />
              {isEn ? "Auto-format while typing" : "Форматировать при вводе"}
            </label>
          </div>
        </div>
      </AdvancedSettings>

      <output aria-live="polite" className="sr-only">
        {output ? (isEn ? "Code formatted." : "Код отформатирован.") : ""}
      </output>
    </div>
  );
}
