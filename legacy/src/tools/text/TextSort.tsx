"use client";

import { useState } from "react";
import { SortAscending } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cryptoShuffle } from "@/src/lib/cryptoRandom";
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

type SortMode =
  | "az"
  | "za"
  | "natural"
  | "num-asc"
  | "num-desc"
  | "length-asc"
  | "length-desc"
  | "reverse"
  | "shuffle";

const SORT_OPTIONS: Array<{ value: SortMode; ru: string; en: string }> = [
  { value: "az", ru: "А → Я", en: "A → Z" },
  { value: "za", ru: "Я → А", en: "Z → A" },
  { value: "natural", ru: "Натуральная", en: "Natural" },
  { value: "num-asc", ru: "По числу ↑", en: "By number ↑" },
  { value: "num-desc", ru: "По числу ↓", en: "By number ↓" },
  { value: "length-asc", ru: "По длине ↑", en: "By length ↑" },
  { value: "length-desc", ru: "По длине ↓", en: "By length ↓" },
  { value: "reverse", ru: "Обратный порядок", en: "Reverse order" },
  { value: "shuffle", ru: "Перемешать", en: "Shuffle" },
];

function extractNumber(line: string): number {
  const match = line.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

function naturalCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function sortLines(
  lines: string[],
  mode: SortMode,
  locale: string,
  options: {
    caseInsensitive: boolean;
    reverseAfter: boolean;
    dedupe: boolean;
  },
): string[] {
  let working = [...lines];
  if (options.dedupe) {
    const seen = new Set<string>();
    working = working.filter((line) => {
      const key = options.caseInsensitive ? line.toLocaleLowerCase() : line;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const language = locale === "en" ? "en" : "ru";
  const sensitivity = options.caseInsensitive ? "base" : "variant";
  switch (mode) {
    case "az":
      working.sort((a, b) => a.localeCompare(b, language, { sensitivity }));
      break;
    case "za":
      working.sort((a, b) => b.localeCompare(a, language, { sensitivity }));
      break;
    case "natural":
      working.sort(naturalCompare);
      break;
    case "num-asc":
      working.sort((a, b) => extractNumber(a) - extractNumber(b));
      break;
    case "num-desc":
      working.sort((a, b) => extractNumber(b) - extractNumber(a));
      break;
    case "length-asc":
      working.sort((a, b) => a.length - b.length);
      break;
    case "length-desc":
      working.sort((a, b) => b.length - a.length);
      break;
    case "reverse":
      working.reverse();
      break;
    case "shuffle":
      working = cryptoShuffle(working);
      break;
  }
  return options.reverseAfter ? working.reverse() : working;
}

export default function TextSort() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<SortMode>("az");
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [keepEmpty, setKeepEmpty] = useState(false);
  const [dedupe, setDedupe] = useState(false);
  const [reverseAfter, setReverseAfter] = useState(false);
  const [result, setResult] = useState<string[] | null>(null);
  const [processedSignature, setProcessedSignature] = useState("");

  const signature = [
    input,
    mode,
    caseInsensitive,
    keepEmpty,
    dedupe,
    reverseAfter,
    locale,
  ].join("|");
  const hasFreshResult = result !== null && processedSignature === signature;
  const activeOption = SORT_OPTIONS.find((option) => option.value === mode);

  const runSort = () => {
    const allLines = input.split("\n");
    const lines = keepEmpty
      ? allLines
      : allLines.filter((line) => line.trim().length > 0);
    setResult(
      sortLines(lines, mode, locale, {
        caseInsensitive,
        reverseAfter,
        dedupe,
      }),
    );
    setProcessedSignature(signature);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <Card className="p-4 sm:p-5">
        <Label htmlFor="sort-input" className="mb-1.5 block text-sm">
          {isEn ? "Lines to sort" : "Строки для сортировки"}
        </Label>
        <Textarea
          id="sort-input"
          rows={8}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={isEn ? "Enter one item per line" : "Введите по одному элементу в строке"}
          className="mb-4 font-mono text-sm"
        />

        <Label className="mb-1.5 block text-sm">
          {isEn ? "Sort order" : "Порядок сортировки"}
        </Label>
        <Select value={mode} onValueChange={(value) => setMode(value as SortMode)}>
          <SelectTrigger aria-label={isEn ? "Sort order" : "Порядок сортировки"}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {isEn ? option.en : option.ru}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AdvancedSettings
          className="mt-3"
          title={isEn ? "More sorting options" : "Дополнительные настройки"}
          description={isEn ? "Case, blank lines and duplicates" : "Регистр, пустые строки и дубликаты"}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={caseInsensitive}
                onChange={(event) => setCaseInsensitive(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Ignore case" : "Не учитывать регистр"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={keepEmpty}
                onChange={(event) => setKeepEmpty(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Keep blank lines" : "Сохранять пустые строки"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={dedupe}
                onChange={(event) => setDedupe(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Remove duplicate lines" : "Удалить одинаковые строки"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
              <input
                type="checkbox"
                checked={reverseAfter}
                onChange={(event) => setReverseAfter(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Reverse final order" : "Развернуть результат"}
            </label>
          </div>
        </AdvancedSettings>

        <Button
          type="button"
          size="lg"
          className="mt-3 w-full"
          onClick={runSort}
          disabled={!input.trim()}
        >
          <SortAscending size={20} />
          {mode === "shuffle"
            ? isEn
              ? "Shuffle lines"
              : "Перемешать строки"
            : isEn
              ? "Sort lines"
              : "Сортировать строки"}
        </Button>
      </Card>

      {hasFreshResult && result && (
        <Card className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{isEn ? "Sorted text" : "Отсортированный текст"}</div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {result.length} {isEn ? (result.length === 1 ? "line" : "lines") : "строк"} · {isEn ? activeOption?.en : activeOption?.ru}
              </div>
            </div>
            <CopyButton text={result.join("\n")} size="medium" />
          </div>
          <Textarea
            rows={9}
            value={result.join("\n")}
            readOnly
            aria-label={isEn ? "Sorted text result" : "Результат сортировки"}
            className="bg-[var(--color-surface-muted)] font-mono text-sm"
          />
        </Card>
      )}
    </div>
  );
}
