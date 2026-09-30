"use client";

import { useState } from "react";
import { Rows, TextT, Textbox } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";

type Mode = "lines" | "words" | "chars";

interface Result {
  text: string;
  total: number;
  unique: number;
  removed: number;
}

const MODES: Array<{
  value: Mode;
  ru: string;
  en: string;
  icon: typeof Rows;
}> = [
  { value: "lines", ru: "Строки", en: "Lines", icon: Rows },
  { value: "words", ru: "Слова", en: "Words", icon: TextT },
  { value: "chars", ru: "Символы", en: "Characters", icon: Textbox },
];

function removeDuplicates(
  text: string,
  mode: Mode,
  options: {
    caseSensitive: boolean;
    trimWhitespace: boolean;
    keepLast: boolean;
    sortResult: boolean;
    minOccurrence: number;
  },
): Result {
  if (!text.trim()) return { text: "", total: 0, unique: 0, removed: 0 };

  const separator = mode === "lines" ? "\n" : mode === "words" ? " " : "";
  const items =
    mode === "lines"
      ? text.split("\n")
      : mode === "words"
        ? text.split(/\s+/).filter(Boolean)
        : Array.from(text);
  const normalize = (item: string) => {
    const trimmed = options.trimWhitespace && mode === "lines" ? item.trim() : item;
    return options.caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
  };

  const frequencies = new Map<string, number>();
  items.forEach((item) => {
    const key = normalize(item);
    if (mode === "lines" && options.trimWhitespace && !key) return;
    frequencies.set(key, (frequencies.get(key) ?? 0) + 1);
  });

  const source = options.keepLast ? [...items].reverse() : items;
  const seen = new Set<string>();
  let uniqueItems: string[] = [];
  source.forEach((item) => {
    const key = normalize(item);
    if (mode === "lines" && options.trimWhitespace && !key) return;
    if (seen.has(key)) return;
    seen.add(key);
    uniqueItems.push(options.trimWhitespace && mode === "lines" ? item.trim() : item);
  });
  if (options.keepLast) uniqueItems.reverse();
  if (options.minOccurrence > 1) {
    uniqueItems = uniqueItems.filter(
      (item) => (frequencies.get(normalize(item)) ?? 0) >= options.minOccurrence,
    );
  }
  if (options.sortResult) {
    uniqueItems.sort((a, b) => a.localeCompare(b));
  }

  return {
    text: uniqueItems.join(separator),
    total: items.length,
    unique: uniqueItems.length,
    removed: items.length - uniqueItems.length,
  };
}

export default function RemoveDuplicates() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("lines");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [keepLast, setKeepLast] = useState(false);
  const [sortResult, setSortResult] = useState(false);
  const [minOccurrence, setMinOccurrence] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const [processedSignature, setProcessedSignature] = useState("");

  const signature = [
    input,
    mode,
    caseSensitive,
    trimWhitespace,
    keepLast,
    sortResult,
    minOccurrence,
  ].join("|");
  const hasFreshResult =
    result !== null && processedSignature === signature;

  const process = () => {
    setResult(
      removeDuplicates(input, mode, {
        caseSensitive,
        trimWhitespace,
        keepLast,
        sortResult,
        minOccurrence,
      }),
    );
    setProcessedSignature(signature);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="duplicates-input" className="mb-1.5 block text-sm">
          {isEn ? "Text with duplicates" : "Текст с дубликатами"}
        </Label>
        <Textarea
          id="duplicates-input"
          rows={7}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={
            isEn
              ? "Enter one item per line"
              : "Введите по одному элементу в строке"
          }
          className="mb-4 font-mono text-sm"
        />

        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label={isEn ? "Remove duplicate" : "Удалять дубликаты"}
        >
          {MODES.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                type="button"
                variant={mode === option.value ? "soft" : "outline"}
                className="min-w-0 px-1 text-xs min-[430px]:px-3 min-[430px]:text-sm"
                role="radio"
                aria-checked={mode === option.value}
                onClick={() => setMode(option.value)}
              >
                <Icon size={18} className="hidden min-[430px]:block" />
                <span className="whitespace-normal text-center leading-tight">
                  {isEn ? option.en : option.ru}
                </span>
              </Button>
            );
          })}
        </div>

        <AdvancedSettings
          className="mt-3"
          title={isEn ? "Matching options" : "Настройки сравнения"}
          description={isEn ? "Case, spaces, order and frequency" : "Регистр, пробелы, порядок и частота"}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(event) => setCaseSensitive(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? "Case sensitive" : "Учитывать регистр"}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={trimWhitespace}
                  onChange={(event) => setTrimWhitespace(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? "Trim line spaces" : "Убирать пробелы в строках"}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={keepLast}
                  onChange={(event) => setKeepLast(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? "Keep last occurrence" : "Сохранять последнее вхождение"}
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                <input
                  type="checkbox"
                  checked={sortResult}
                  onChange={(event) => setSortResult(event.target.checked)}
                  className="h-5 w-5 accent-[var(--color-primary)]"
                />
                {isEn ? "Sort result" : "Сортировать результат"}
              </label>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">
                {isEn ? "Minimum occurrences" : "Минимум вхождений"}
              </Label>
              <Select
                value={String(minOccurrence)}
                onValueChange={(value) => setMinOccurrence(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 5, 10].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value === 1
                        ? isEn
                          ? "Keep every unique item"
                          : "Все уникальные элементы"
                        : isEn
                          ? `${value} or more`
                          : `${value} и более`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </AdvancedSettings>

        <Button
          type="button"
          size="lg"
          className="mt-3 w-full"
          onClick={process}
          disabled={!input.trim()}
        >
          {isEn ? "Remove duplicates" : "Удалить дубликаты"}
        </Button>
      </Card>

      {hasFreshResult && result && (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{isEn ? "Clean text" : "Текст без дубликатов"}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? `${result.removed} removed · ${result.unique} of ${result.total} kept`
                  : `Удалено ${result.removed} · оставлено ${result.unique} из ${result.total}`}
              </div>
            </div>
            <CopyButton text={result.text} size="medium" />
          </div>
          <Textarea
            rows={8}
            value={result.text}
            readOnly
            aria-label={isEn ? "Text without duplicates" : "Текст без дубликатов"}
            className="bg-[var(--color-surface-muted)] font-mono text-sm"
          />
        </Card>
      )}
    </div>
  );
}
