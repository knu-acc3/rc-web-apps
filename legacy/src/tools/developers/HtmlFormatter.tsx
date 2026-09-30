"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  DownloadSimple,
  TextAlignLeft,
  X,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { downloadBlob } from "@/src/utils/exportHelpers";
import {
  formatHtml,
  type HtmlFormatOptions,
} from "@/src/utils/beautifiers/formatHtml";

const MAX_INPUT_BYTES = 500 * 1024;

const DEFAULT_OPTIONS: HtmlFormatOptions = {
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  singleAttributePerLine: false,
};

function byteSize(value: string): number {
  return new TextEncoder().encode(value).length;
}

export default function HtmlFormatter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [options, setOptions] = useState<HtmlFormatOptions>(DEFAULT_OPTIONS);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const runFormat = useCallback(async () => {
    const source = input.trim();
    if (!source) return;

    if (byteSize(input) > MAX_INPUT_BYTES) {
      setError(
        isEn
          ? "The HTML is larger than 500 KB. Split it into smaller parts."
          : "HTML больше 500 КБ. Разделите его на несколько частей.",
      );
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsFormatting(true);
    setError("");

    try {
      const formatted = await formatHtml(input, options);
      if (requestId === requestIdRef.current) setOutput(formatted);
    } catch (caught) {
      if (requestId !== requestIdRef.current) return;
      const message =
        caught instanceof Error ? caught.message.split("\n")[0] : "";
      setOutput("");
      setError(
        message ||
          (isEn
            ? "Could not format this markup. Check the HTML syntax."
            : "Не удалось отформатировать разметку. Проверьте синтаксис HTML."),
      );
    } finally {
      if (requestId === requestIdRef.current) setIsFormatting(false);
    }
  }, [input, isEn, options]);

  const clear = () => {
    requestIdRef.current += 1;
    setInput("");
    setOutput("");
    setError("");
    setIsFormatting(false);
  };

  const useResultAsInput = () => {
    if (!output) return;
    setInput(output);
    setOutput("");
    setError("");
  };

  const download = () => {
    if (!output) return;
    downloadBlob(
      new Blob([output], { type: "text/html;charset=utf-8" }),
      "formatted.html",
    );
  };

  const setOption = <Key extends keyof HtmlFormatOptions>(
    key: Key,
    value: HtmlFormatOptions[Key],
  ) => setOptions((current) => ({ ...current, [key]: value }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-5">
      <div className="contents md:grid md:grid-cols-2 md:gap-4">
        <div className="order-1">
          <div className="mb-1.5 flex min-h-11 items-center justify-between gap-2 text-sm">
            <span className="font-semibold">
              {isEn ? "HTML input" : "HTML-код"}
            </span>
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
            rows={11}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isEn ? "Paste HTML markup" : "Вставьте HTML-разметку"}
            className="tool-short-landscape-editor min-h-52 resize-y font-mono text-sm leading-relaxed md:min-h-80"
            aria-label={isEn ? "HTML input" : "HTML-код"}
            spellCheck={false}
          />
        </div>

        <div className="order-3 md:order-2">
          <div className="mb-1.5 flex min-h-11 items-center justify-between gap-2 text-sm">
            <span className="font-semibold">
              {isEn ? "Formatted result" : "Результат"}
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
                  aria-label={isEn ? "Use as input" : "Перенести во вход"}
                >
                  <ArrowRight size={16} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={download}
                  title={isEn ? "Download HTML" : "Скачать HTML"}
                  aria-label={isEn ? "Download HTML" : "Скачать HTML"}
                >
                  <DownloadSimple size={16} />
                </Button>
              </div>
            ) : null}
          </div>
          <Textarea
            rows={11}
            value={output}
            readOnly
            placeholder={
              isEn ? "Formatted HTML appears here" : "Здесь появится результат"
            }
            className="tool-short-landscape-editor min-h-52 resize-y bg-[var(--color-surface-muted)]/50 font-mono text-sm leading-relaxed md:min-h-80"
            aria-label={isEn ? "Formatted result" : "Результат"}
            spellCheck={false}
          />
        </div>
      </div>

      <div className="order-2 mt-4 md:order-3">
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
              ? "Format HTML"
              : "Форматировать HTML"}
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
        description={
          isEn ? "Indentation and line wrapping" : "Отступы и перенос строк"
        }
        className="order-5 mt-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {isEn ? "Indentation" : "Отступ"}
            <select
              value={options.useTabs ? "tabs" : String(options.tabWidth)}
              onChange={(event) => {
                const value = event.target.value;
                setOptions((current) => ({
                  ...current,
                  useTabs: value === "tabs",
                  tabWidth: value === "4" ? 4 : 2,
                }));
              }}
              className="h-11 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="tabs">Tabs</option>
            </select>
          </label>

          <label className="grid gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
            {isEn ? "Line width" : "Длина строки"}
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
              <option value={80}>80</option>
              <option value={100}>100</option>
              <option value={120}>120</option>
            </select>
          </label>

          <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={options.singleAttributePerLine}
              onChange={(event) =>
                setOption("singleAttributePerLine", event.target.checked)
              }
            />
            {isEn ? "One attribute per line" : "Атрибут с новой строки"}
          </label>
        </div>
      </AdvancedSettings>

      <output aria-live="polite" className="sr-only">
        {output ? (isEn ? "HTML formatted." : "HTML отформатирован.") : ""}
      </output>
    </div>
  );
}
