"use client";

import { useMemo, useState } from "react";
import {
  ChartBar,
  DownloadSimple,
  Link as LinkIcon,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { useUrlFetcher } from "@/src/hooks/useUrlFetcher";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { escapeCsvCellForSpreadsheet } from "@/src/utils/exportHelpers";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "but",
  "by",
  "can",
  "do",
  "for",
  "from",
  "had",
  "has",
  "have",
  "he",
  "her",
  "his",
  "how",
  "i",
  "if",
  "in",
  "is",
  "it",
  "its",
  "may",
  "not",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "those",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

const RUSSIAN_STOP_WORDS = new Set([
  "и", "в", "во", "не", "что", "он", "на", "я", "с", "со", "как", "а", "то", "все",
  "она", "так", "его", "но", "да", "ты", "к", "у", "же", "вы", "за", "бы", "по",
  "только", "ее", "мне", "было", "вот", "от", "меня", "еще", "нет", "о", "из", "ему",
  "теперь", "когда", "даже", "ну", "вдруг", "ли", "если", "уже", "или", "ни", "быть",
  "был", "него", "до", "вас", "нибудь", "опять", "уж", "вам", "ведь", "там", "потом",
  "себя", "ничего", "ей", "может", "они", "тут", "где", "есть", "надо", "ней", "для",
  "мы", "тебя", "их", "чем", "была", "сам", "чтоб", "без", "будто", "чего", "раз",
  "тоже", "себе", "под", "будет", "ж", "тогда", "кто", "этот", "того", "потому",
  "этого", "какой", "совсем", "ним", "здесь", "этом", "один", "почти", "мой", "тем", "чтобы",
  "были", "весь", "им", "ко", "между", "над", "наш", "нее", "об", "оно", "при", "про", "свой",
  "также", "те", "тот", "эта", "эти", "это"
]);

export const COMBINED_STOP_WORDS = new Set([...STOP_WORDS, ...RUSSIAN_STOP_WORDS]);

type NgramSize = 1 | 2 | 3;

type KeywordStat = {
  phrase: string;
  count: number;
  share: number;
};

function tokenize(value: string) {
  return (
    value.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu) ??
    []
  );
}

function createNgrams(tokens: string[], size: NgramSize) {
  return Array.from(
    { length: Math.max(0, tokens.length - size + 1) },
    (_, index) => tokens.slice(index, index + size),
  );
}

function downloadCsv(rows: KeywordStat[], size: NgramSize) {
  const body = rows
    .map((row, index) =>
      [
        index + 1,
        escapeCsvCellForSpreadsheet(row.phrase),
        row.count,
        row.share.toFixed(3),
      ].join(
        ",",
      ),
    )
    .join("\n");
  const csv = `rank,phrase,count,occurrence_share_percent\n${body}\n`;
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `keyword-frequency-${size}-gram.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function isWebUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function ruWordLabel(value: number) {
  const lastTwo = Math.abs(value) % 100;
  const last = lastTwo % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "слов";
  if (last === 1) return "слово";
  if (last >= 2 && last <= 4) return "слова";
  return "слов";
}

export default function KeywordDensity() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const {
    fetchUrl,
    extractText,
    loading: urlLoading,
    error: fetchError,
  } = useUrlFetcher();
  const [text, setText] = useState("");
  const [analyzedText, setAnalyzedText] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [ngramSize, setNgramSize] = useState<NgramSize>(1);
  const [minimumLength, setMinimumLength] = useState(2);
  const [excludeStopWords, setExcludeStopWords] = useState(true);
  const [resultLimit, setResultLimit] = useState(20);

  const analysis = useMemo(() => {
    const tokens = tokenize(analyzedText);
    const allNgrams = createNgrams(tokens, ngramSize);
    const eligible = allNgrams.filter((parts) =>
      parts.every(
        (part) =>
          part.length >= minimumLength &&
          (!excludeStopWords || !COMBINED_STOP_WORDS.has(part)),
      ),
    );
    const frequency = new Map<string, number>();
    for (const parts of eligible) {
      const phrase = parts.join(" ");
      frequency.set(phrase, (frequency.get(phrase) ?? 0) + 1);
    }

    const denominator = allNgrams.length;
    const rows = [...frequency.entries()]
      .map(([phrase, count]) => ({
        phrase,
        count,
        share: denominator ? (count / denominator) * 100 : 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count || left.phrase.localeCompare(right.phrase),
      )
      .slice(0, resultLimit);

    return {
      rows,
      wordCount: tokens.length,
      uniqueWords: new Set(tokens).size,
      eligibleCount: eligible.length,
    };
  }, [analyzedText, excludeStopWords, minimumLength, ngramSize, resultLimit]);

  const runAnalysis = () => setAnalyzedText(text.trim());

  const loadFromUrl = async () => {
    const normalized = url.trim();
    if (!isWebUrl(normalized)) {
      setUrlError(
        isEn
          ? "Enter a full http or https URL."
          : "Введите полный URL с http или https.",
      );
      return;
    }
    setUrlError("");
    const html = await fetchUrl(normalized);
    if (!html) return;
    setText(extractText(html));
    setAnalyzedText("");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="keyword-source" className="text-sm font-semibold">
          {isEn ? "Text to analyze" : "Текст для анализа"}
        </Label>
        <Textarea
          id="keyword-source"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setAnalyzedText("");
          }}
          rows={9}
          placeholder={
            isEn
              ? "Paste an article, landing page copy, or any other text…"
              : "Вставьте статью, текст страницы или любой другой текст…"
          }
          className="mt-2 min-h-52 resize-y text-base"
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <span>
            {tokenize(text).length.toLocaleString()}{" "}
            {isEn ? "words" : ruWordLabel(tokenize(text).length)}
          </span>
          {text ? (
            <button
              type="button"
              className="min-h-9 font-semibold text-[var(--color-primary)]"
              onClick={() => {
                setText("");
                setAnalyzedText("");
              }}
            >
              {isEn ? "Clear" : "Очистить"}
            </button>
          ) : null}
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-3"
          disabled={!text.trim()}
          onClick={runAnalysis}
          leadingIcon={<MagnifyingGlass size={20} weight="bold" />}
        >
          {isEn ? "Analyze keywords" : "Анализировать ключевые слова"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Analysis options" : "Параметры анализа"}
          description={
            isEn
              ? "URL import, phrases, filters and export"
              : "Импорт URL, фразы, фильтры и экспорт"
          }
        >
          <div>
            <Label htmlFor="keyword-url">
              {isEn
                ? "Import visible text from a URL"
                : "Импортировать видимый текст по URL"}
            </Label>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                id="keyword-url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setUrlError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !urlLoading) void loadFromUrl();
                }}
                placeholder="https://site.test/page"
                className="h-11"
              />
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={urlLoading || !url.trim()}
                onClick={() => void loadFromUrl()}
              >
                <LinkIcon size={18} />{" "}
                {urlLoading
                  ? isEn
                    ? "Loading…"
                    : "Загрузка…"
                  : isEn
                    ? "Import"
                    : "Импортировать"}
              </Button>
            </div>
            {urlError || fetchError ? (
              <p
                role="alert"
                className="mt-2 text-sm text-[var(--color-danger)]"
              >
                {urlError || fetchError}
              </p>
            ) : null}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="keyword-ngram">
                {isEn ? "Phrase size" : "Размер фразы"}
              </Label>
              <Select
                value={String(ngramSize)}
                onValueChange={(value) =>
                  setNgramSize(Number(value) as NgramSize)
                }
              >
                <SelectTrigger id="keyword-ngram" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    {isEn ? "Single words" : "Отдельные слова"}
                  </SelectItem>
                  <SelectItem value="2">
                    {isEn ? "Two-word phrases" : "Фразы из двух слов"}
                  </SelectItem>
                  <SelectItem value="3">
                    {isEn ? "Three-word phrases" : "Фразы из трёх слов"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="keyword-min-length">
                {isEn ? "Minimum word length" : "Минимальная длина слова"}
              </Label>
              <Input
                id="keyword-min-length"
                type="number"
                min={1}
                max={30}
                value={minimumLength}
                onChange={(event) =>
                  setMinimumLength(
                    Math.min(30, Math.max(1, Number(event.target.value) || 1)),
                  )
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="keyword-limit">
                {isEn ? "Rows in result" : "Строк в результате"}
              </Label>
              <Select
                value={String(resultLimit)}
                onValueChange={(value) => setResultLimit(Number(value))}
              >
                <SelectTrigger id="keyword-limit" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
            <input
              type="checkbox"
              checked={excludeStopWords}
              onChange={(event) => setExcludeStopWords(event.target.checked)}
              className="size-5 accent-[var(--color-primary)]"
            />
            <span>
              {isEn
                ? "Exclude common English and Russian stop words"
                : "Исключить частые русские и английские стоп-слова"}
            </span>
          </label>

          {analysis.rows.length ? (
            <Button
              type="button"
              variant="outline"
              className="mt-4 min-h-11"
              onClick={() => downloadCsv(analysis.rows, ngramSize)}
            >
              <DownloadSimple size={18} />{" "}
              {isEn ? "Download CSV" : "Скачать CSV"}
            </Button>
          ) : null}
        </AdvancedSettings>
      </section>

      {analyzedText ? (
        <section
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold">
                <ChartBar size={20} className="text-[var(--color-primary)]" />
                {isEn ? "Most frequent phrases" : "Самые частые фразы"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {analysis.wordCount.toLocaleString()}{" "}
                {isEn ? "words" : ruWordLabel(analysis.wordCount)} ·{" "}
                {analysis.uniqueWords.toLocaleString()}{" "}
                {isEn ? "unique" : "уникальных"}
              </p>
            </div>
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
              {analysis.eligibleCount.toLocaleString()}{" "}
              {isEn ? "eligible occurrences" : "учтённых вхождений"}
            </span>
          </div>

          {analysis.rows.length ? (
            <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem] gap-2 bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                <span>{isEn ? "Phrase" : "Фраза"}</span>
                <span className="text-right">{isEn ? "Count" : "Кол-во"}</span>
                <span className="text-right">{isEn ? "Share" : "Доля"}</span>
              </div>
              <ol className="divide-y divide-[var(--color-border)]">
                {analysis.rows.map((row) => (
                  <li
                    key={row.phrase}
                    className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem] items-center gap-2 px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 break-words font-semibold">
                      {row.phrase}
                    </span>
                    <span className="text-right tabular-nums">{row.count}</span>
                    <span className="text-right tabular-nums text-[var(--color-text-muted)]">
                      {row.share.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? "No phrases remain after the selected filters."
                : "После выбранных фильтров фраз не осталось."}
            </p>
          )}

          <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
            {isEn
              ? "Share is the phrase count divided by all possible phrases of the selected size. It is a frequency measure, not a search-ranking score; there is no universal “ideal” keyword density."
              : "Доля — это число вхождений фразы, делённое на число всех возможных фраз выбранного размера. Это частотность, а не оценка ранжирования; универсальной «идеальной» плотности ключевых слов нет."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
