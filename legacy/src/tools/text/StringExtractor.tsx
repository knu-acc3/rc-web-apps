"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Check,
  Copy,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { escapeCsvCellForSpreadsheet } from "@/src/utils/exportHelpers";
import { cn } from "@/src/lib/cn";

type ExtractionType =
  | "emails"
  | "urls"
  | "phones"
  | "ips"
  | "numbers"
  | "dates"
  | "hashtags"
  | "mentions"
  | "colors"
  | "uuids"
  | "custom";

type ExtractionOption = {
  type: ExtractionType;
  label: string;
  labelEn: string;
  pattern?: RegExp;
};

const OPTIONS: ExtractionOption[] = [
  {
    type: "emails",
    label: "Email",
    labelEn: "Email",
    pattern: /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi,
  },
  {
    type: "urls",
    label: "Ссылки",
    labelEn: "Links",
    pattern: /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi,
  },
  {
    type: "phones",
    label: "Телефоны",
    labelEn: "Phones",
    pattern: /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?(?:[\s.-]?\d{2,4}){2,3}/g,
  },
  {
    type: "ips",
    label: "IP-адреса",
    labelEn: "IP addresses",
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
  },
  {
    type: "numbers",
    label: "Числа",
    labelEn: "Numbers",
    pattern: /-?\d+(?:[.,]\d+)?(?:\s?%)?/g,
  },
  {
    type: "dates",
    label: "Даты",
    labelEn: "Dates",
    pattern:
      /\b(?:\d{4}[-./]\d{1,2}[-./]\d{1,2}|\d{1,2}[-./]\d{1,2}[-./]\d{2,4})\b/g,
  },
  {
    type: "hashtags",
    label: "Хэштеги",
    labelEn: "Hashtags",
    pattern: /#[\p{L}\p{N}_]+/gu,
  },
  {
    type: "mentions",
    label: "Упоминания",
    labelEn: "Mentions",
    pattern: /@[\w.]+/g,
  },
  {
    type: "colors",
    label: "HEX-цвета",
    labelEn: "HEX colors",
    pattern: /#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi,
  },
  {
    type: "uuids",
    label: "UUID",
    labelEn: "UUID",
    pattern:
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
  },
  { type: "custom", label: "Свой regex", labelEn: "Custom regex" },
];

const QUICK_TYPES: ExtractionType[] = ["emails", "urls", "phones"];

type ExtractionResult = {
  type: ExtractionType;
  label: string;
  value: string;
};

function uniqueMatches(text: string, pattern: RegExp) {
  const matches = text.match(pattern) ?? [];
  return [...new Set(matches.map((value) => value.trim()).filter(Boolean))];
}

function downloadFile(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function StringExtractor() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [source, setSource] = useState("");
  const [submittedSource, setSubmittedSource] = useState("");
  const [activeTypes, setActiveTypes] = useState<ExtractionType[]>(["emails"]);
  const [customPattern, setCustomPattern] = useState("");
  const [customFlags, setCustomFlags] = useState("gi");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const results = useMemo<ExtractionResult[]>(() => {
    if (!submittedSource.trim()) return [];

    return OPTIONS.flatMap((option) => {
      if (!activeTypes.includes(option.type)) return [];

      let pattern = option.pattern;
      if (option.type === "custom") {
        if (!customPattern.trim()) return [];
        try {
          pattern = new RegExp(
            customPattern,
            customFlags.includes("g") ? customFlags : `${customFlags}g`,
          );
        } catch {
          return [];
        }
      }

      if (!pattern) return [];
      const label = isEn ? option.labelEn : option.label;
      return uniqueMatches(
        submittedSource,
        new RegExp(pattern.source, pattern.flags),
      ).map((value) => ({
        type: option.type,
        label,
        value,
      }));
    });
  }, [activeTypes, customFlags, customPattern, isEn, submittedSource]);

  const selectQuickType = (type: ExtractionType) => {
    setActiveTypes([type]);
    setError("");
  };

  const toggleAdvancedType = (type: ExtractionType) => {
    setActiveTypes((current) => {
      if (!current.includes(type)) return [...current, type];
      if (current.length === 1) return current;
      return current.filter((item) => item !== type);
    });
    setError("");
  };

  const extract = () => {
    if (!source.trim()) {
      setError(
        isEn
          ? "Paste or enter text first."
          : "Сначала вставьте или введите текст.",
      );
      return;
    }
    if (activeTypes.includes("custom") && customPattern.trim()) {
      try {
        new RegExp(customPattern, customFlags);
      } catch {
        setError(
          isEn
            ? "Check the custom regular expression."
            : "Проверьте своё регулярное выражение.",
        );
        return;
      }
    }
    setError("");
    setCopied(false);
    setSubmittedSource(source);
  };

  const copyResults = useCallback(async () => {
    if (!results.length) return;
    await navigator.clipboard.writeText(
      results.map((item) => item.value).join("\n"),
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }, [results]);

  const downloadCsv = () => {
    const csv = [
      "type,value",
      ...results.map(
        (item) =>
          `${escapeCsvCellForSpreadsheet(item.type)},${escapeCsvCellForSpreadsheet(item.value)}`,
      ),
    ].join("\n");
    downloadFile(csv, "text/csv;charset=utf-8", "extracted-data.csv");
  };

  const downloadJson = () => {
    const grouped = results.reduce<Record<string, string[]>>((all, item) => {
      (all[item.type] ??= []).push(item.value);
      return all;
    }, {});
    downloadFile(
      JSON.stringify(grouped, null, 2),
      "application/json",
      "extracted-data.json",
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="extractor-source" className="text-sm font-semibold">
          {isEn ? "Text to scan" : "Текст для поиска"}
        </Label>
        <Textarea
          id="extractor-source"
          rows={8}
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setError("");
          }}
          placeholder={
            isEn
              ? "Paste text containing emails, links or phone numbers…"
              : "Вставьте текст с email, ссылками или телефонами…"
          }
          className="mt-2 min-h-44 resize-y text-base"
        />

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">
            {isEn ? "What to find" : "Что найти"}
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUICK_TYPES.map((type) => {
              const option = OPTIONS.find((item) => item.type === type)!;
              const selected =
                activeTypes.length === 1 && activeTypes[0] === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectQuickType(type)}
                  className={cn(
                    "min-h-11 rounded-[var(--radius-md)] border px-2 text-sm font-semibold transition-colors",
                    selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                  )}
                >
                  {isEn ? option.labelEn : option.label}
                </button>
              );
            })}
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
          onClick={extract}
          leadingIcon={<MagnifyingGlass size={20} weight="bold" />}
        >
          {isEn ? "Extract data" : "Извлечь данные"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "More data types" : "Другие типы данных"}
          description={
            isEn
              ? "Combine types, use regex or export structured files"
              : "Объединение типов, regex и экспорт файлов"
          }
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const selected = activeTypes.includes(option.type);
              return (
                <button
                  key={option.type}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAdvancedType(option.type)}
                  className={cn(
                    "flex min-h-11 items-center justify-between rounded-[var(--radius-md)] border px-3 text-left text-sm",
                    selected
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)]",
                  )}
                >
                  <span>{isEn ? option.labelEn : option.label}</span>
                  {selected ? <Check size={16} weight="bold" /> : null}
                </button>
              );
            })}
          </div>

          {activeTypes.includes("custom") ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_6rem]">
              <div>
                <Label htmlFor="extractor-regex">
                  {isEn ? "Regular expression" : "Регулярное выражение"}
                </Label>
                <Input
                  id="extractor-regex"
                  value={customPattern}
                  onChange={(event) => setCustomPattern(event.target.value)}
                  placeholder="\\b[A-Z]{3}-\\d{4}\\b"
                  className="mt-1.5 h-11 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="extractor-flags">
                  {isEn ? "Flags" : "Флаги"}
                </Label>
                <Input
                  id="extractor-flags"
                  value={customFlags}
                  onChange={(event) =>
                    setCustomFlags(
                      event.target.value.replace(/[^dgimsuvy]/g, ""),
                    )
                  }
                  className="mt-1.5 h-11 font-mono"
                />
              </div>
            </div>
          ) : null}

          {results.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={downloadCsv}
              >
                <DownloadSimple size={18} /> CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={downloadJson}
              >
                <DownloadSimple size={18} /> JSON
              </Button>
            </div>
          ) : null}
        </AdvancedSettings>
      </section>

      {submittedSource ? (
        <section
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">
                {isEn ? "Result" : "Результат"}
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                {results.length
                  ? isEn
                    ? `${results.length} unique values`
                    : `${results.length} уникальных значений`
                  : isEn
                    ? "No values of the selected types found"
                    : "Данные выбранных типов не найдены"}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 shrink-0"
              disabled={!results.length}
              onClick={copyResults}
            >
              {copied ? <Check size={18} weight="bold" /> : <Copy size={18} />}
              <span className="hidden sm:inline">
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy all"
                    : "Копировать"}
              </span>
            </Button>
          </div>

          {results.length ? (
            <ul className="mt-4 max-h-96 divide-y divide-[var(--color-border-subtle)] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {results.map((item, index) => (
                <li
                  key={`${item.type}-${item.value}-${index}`}
                  className="grid gap-1 px-3 py-2.5 sm:grid-cols-[7rem_1fr] sm:gap-3"
                >
                  <span className="text-xs font-semibold text-[var(--color-primary)]">
                    {item.label}
                  </span>
                  <span className="break-all font-mono text-sm text-[var(--color-text)]">
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
