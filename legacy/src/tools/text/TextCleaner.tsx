"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type CleanOption = {
  key: string;
  labelRu: string;
  labelEn: string;
  apply: (text: string) => string;
};

const OPTIONS: CleanOption[] = [
  {
    key: "normalizeLineEndings",
    labelRu: "Нормализовать переносы строк",
    labelEn: "Normalize line endings",
    apply: (text) => text.replace(/\r\n?/g, "\n"),
  },
  {
    key: "zeroWidth",
    labelRu: "Удалить невидимые символы",
    labelEn: "Remove invisible characters",
    apply: (text) =>
      text.replace(/[\u200B-\u200F\uFEFF\u2060-\u2064\u00AD]/g, ""),
  },
  {
    key: "nbsp",
    labelRu: "Заменить неразрывные пробелы",
    labelEn: "Replace non-breaking spaces",
    apply: (text) => text.replace(/\u00A0/g, " "),
  },
  {
    key: "trimLines",
    labelRu: "Убрать пробелы по краям строк",
    labelEn: "Trim every line",
    apply: (text) =>
      text
        .split("\n")
        .map((line) => line.trim())
        .join("\n"),
  },
  {
    key: "extraWhitespace",
    labelRu: "Сжать повторяющиеся пробелы",
    labelEn: "Collapse repeated spaces",
    apply: (text) => text.replace(/[^\S\n]{2,}/g, " "),
  },
  {
    key: "extraBlankLines",
    labelRu: "Убрать лишние пустые строки",
    labelEn: "Remove extra blank lines",
    apply: (text) => text.replace(/(?:\n\s*){3,}/g, "\n\n"),
  },
  {
    key: "smartQuotes",
    labelRu: "Заменить фигурные кавычки прямыми",
    labelEn: "Convert smart quotes to straight quotes",
    apply: (text) => text.replace(/[“”„‟«»]/g, '"').replace(/[‘’‚‛]/g, "'"),
  },
  {
    key: "unifyDashes",
    labelRu: "Заменить длинные тире дефисом",
    labelEn: "Convert long dashes to hyphens",
    apply: (text) => text.replace(/[—–]/g, "-"),
  },
  {
    key: "normalizeUnicode",
    labelRu: "Нормализовать Unicode (NFKC)",
    labelEn: "Normalize Unicode (NFKC)",
    apply: (text) => text.normalize("NFKC"),
  },
  {
    key: "htmlTags",
    labelRu: "Удалить HTML-теги",
    labelEn: "Remove HTML tags",
    apply: (text) => text.replace(/<[^>]*>/g, ""),
  },
  {
    key: "htmlEntities",
    labelRu: "Декодировать основные HTML-сущности",
    labelEn: "Decode common HTML entities",
    apply: (text) =>
      text
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#0?39;/gi, "'")
        .replace(/&hellip;/gi, "…")
        .replace(/&mdash;/gi, "—")
        .replace(/&ndash;/gi, "–"),
  },
  {
    key: "removeMarkdown",
    labelRu: "Удалить разметку Markdown",
    labelEn: "Remove Markdown formatting",
    apply: (text) =>
      text
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.+?)\*\*/gs, "$1")
        .replace(/__(.+?)__/gs, "$1")
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/gs, "$1")
        .replace(/~~(.+?)~~/gs, "$1")
        .replace(/`{1,3}(.+?)`{1,3}/gs, "$1")
        .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
        .replace(/^>\s?/gm, "")
        .replace(/^[-+*]\s+/gm, "")
        .replace(/^\d+\.\s+/gm, ""),
  },
  {
    key: "removeUrls",
    labelRu: "Удалить URL",
    labelEn: "Remove URLs",
    apply: (text) => text.replace(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi, ""),
  },
  {
    key: "removeEmails",
    labelRu: "Удалить email-адреса",
    labelEn: "Remove email addresses",
    apply: (text) => text.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi, ""),
  },
  {
    key: "removeEmoji",
    labelRu: "Удалить эмодзи",
    labelEn: "Remove emoji",
    apply: (text) => text.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, ""),
  },
  {
    key: "removeNumbers",
    labelRu: "Удалить цифры",
    labelEn: "Remove numbers",
    apply: (text) => text.replace(/\d+/g, ""),
  },
  {
    key: "removePunctuation",
    labelRu: "Удалить пунктуацию",
    labelEn: "Remove punctuation",
    apply: (text) => text.replace(/[\p{P}\p{S}]/gu, ""),
  },
  {
    key: "fixPunctuation",
    labelRu: "Исправить пробелы у знаков",
    labelEn: "Fix punctuation spacing",
    apply: (text) =>
      text
        .replace(/\s+([.,!?;:])/g, "$1")
        .replace(/([.,!?;:])\s{2,}/g, "$1 ")
        .replace(/\.{2,}/g, "...")
        .replace(/\s+\)/g, ")")
        .replace(/\(\s+/g, "("),
  },
  {
    key: "collapseLines",
    labelRu: "Свернуть в одну строку",
    labelEn: "Collapse to one line",
    apply: (text) => text.replace(/\s*\n\s*/g, " ").trim(),
  },
];

const BASIC_KEYS = [
  "normalizeLineEndings",
  "zeroWidth",
  "nbsp",
  "trimLines",
  "extraWhitespace",
  "extraBlankLines",
];
const WEB_KEYS = [...BASIC_KEYS, "htmlTags", "htmlEntities"];
const SINGLE_LINE_KEYS = [...BASIC_KEYS, "collapseLines"];

type Preset = "basic" | "web" | "single" | "custom";

function keysToToggles(keys: string[]) {
  return Object.fromEntries(
    OPTIONS.map((option) => [option.key, keys.includes(option.key)]),
  );
}

function cleanText(source: string, toggles: Record<string, boolean>) {
  return OPTIONS.reduce(
    (text, option) => (toggles[option.key] ? option.apply(text) : text),
    source,
  );
}

export default function TextCleaner() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [preset, setPreset] = useState<Preset>("basic");
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    keysToToggles(BASIC_KEYS),
  );
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const enabledCount = useMemo(
    () => Object.values(toggles).filter(Boolean).length,
    [toggles],
  );
  const removedCount = result ? Math.max(0, source.length - result.length) : 0;

  const choosePreset = (nextPreset: Preset) => {
    const keys =
      nextPreset === "web"
        ? WEB_KEYS
        : nextPreset === "single"
          ? SINGLE_LINE_KEYS
          : BASIC_KEYS;
    setPreset(nextPreset);
    setToggles(keysToToggles(keys));
    setHasRun(false);
    setError("");
  };

  const runCleaner = () => {
    if (!source) {
      setError(
        isEn
          ? "Paste or enter text first."
          : "Сначала вставьте или введите текст.",
      );
      return;
    }
    setResult(cleanText(source, toggles));
    setHasRun(true);
    setError("");
    setCopied(false);
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="text-cleaner-source" className="text-sm font-semibold">
          {isEn ? "Text to clean" : "Текст для очистки"}
        </Label>
        <Textarea
          id="text-cleaner-source"
          rows={8}
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError("");
            setHasRun(false);
          }}
          placeholder={
            isEn
              ? "Paste text with extra spaces or unwanted formatting…"
              : "Вставьте текст с лишними пробелами или разметкой…"
          }
          className="mt-2 min-h-44 resize-y text-base"
        />

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">
            {isEn ? "Cleaning mode" : "Режим очистки"}
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                ["basic", isEn ? "Basic" : "Обычная"],
                ["web", isEn ? "From web" : "Из сайта"],
                ["single", isEn ? "One line" : "Одна строка"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={preset === value}
                onClick={() => choosePreset(value)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-2 text-sm font-semibold transition-colors",
                  preset === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={runCleaner}
          leadingIcon={<Sparkle size={20} weight="fill" />}
        >
          {isEn ? "Clean text" : "Очистить текст"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Advanced cleaning" : "Расширенная очистка"}
          description={
            isEn
              ? `${enabledCount} of ${OPTIONS.length} operations selected`
              : `Выбрано операций: ${enabledCount} из ${OPTIONS.length}`
          }
        >
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setPreset("basic");
                setToggles(keysToToggles(BASIC_KEYS));
                setHasRun(false);
              }}
            >
              {isEn ? "Reset" : "Сбросить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={() => {
                setPreset("custom");
                setToggles(keysToToggles(OPTIONS.map((option) => option.key)));
                setHasRun(false);
              }}
            >
              {isEn ? "Select all" : "Выбрать все"}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map((option) => (
              <label
                key={option.key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(toggles[option.key])}
                  onChange={() => {
                    setPreset("custom");
                    setToggles((current) => ({
                      ...current,
                      [option.key]: !current[option.key],
                    }));
                    setHasRun(false);
                  }}
                  className="size-5 accent-[var(--color-primary)]"
                />
                <span>{isEn ? option.labelEn : option.labelRu}</span>
              </label>
            ))}
          </div>
        </AdvancedSettings>
      </section>

      {hasRun ? (
        <section
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">
                {isEn ? "Cleaned text" : "Очищенный текст"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? `${removedCount} characters removed`
                  : `Удалено символов: ${removedCount}`}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0"
              onClick={copyResult}
            >
              {copied ? <Check size={18} weight="bold" /> : <Copy size={18} />}
              <span className="hidden sm:inline">
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy"
                    : "Копировать"}
              </span>
            </Button>
          </div>
          <Textarea
            rows={8}
            value={result}
            readOnly
            aria-label={isEn ? "Cleaned result" : "Очищенный результат"}
            className="mt-3 min-h-44 resize-y bg-[var(--color-surface-muted)] font-mono text-sm"
          />
        </section>
      ) : null}
    </div>
  );
}
