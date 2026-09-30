"use client";

import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ALPHABETS, drawLetters, letterPool, type AlphabetId, type LetterFilter } from "./lib/letters";
import { HistoryPanel, pushHistory } from "./shared";

export interface LetterGenProps {
  locale: Locale;
  alphabet?: AlphabetId;
}

const T = {
  ru: {
    alphabet: "Алфавит",
    alphabets: { ru: "Русский", en: "Английский", kk: "Казахский" },
    filter: "Буквы",
    filters: { all: "Все", vowels: "Гласные", consonants: "Согласные" },
    count: "Сколько букв",
    unique: "Без повторов",
    words: "Без букв, с которых не начинаются слова",
    generate: "Случайная буква",
    generateMany: "Случайные буквы",
    result: "Буква",
    results: "Буквы",
    idle: "Нажмите кнопку",
    history: "История",
    clear: "Очистить",
    empty: "Здесь появятся выпавшие буквы",
    pool: "Участвуют",
  },
  en: {
    alphabet: "Alphabet",
    alphabets: { ru: "Russian", en: "English", kk: "Kazakh" },
    filter: "Letters",
    filters: { all: "All", vowels: "Vowels", consonants: "Consonants" },
    count: "How many letters",
    unique: "No repeats",
    words: "Skip letters no word starts with",
    generate: "Random letter",
    generateMany: "Random letters",
    result: "Letter",
    results: "Letters",
    idle: "Press the button",
    history: "History",
    clear: "Clear",
    empty: "Drawn letters will appear here",
    pool: "In the draw",
  },
} as const;

export default function LetterGen({ locale, alphabet: alpha0 }: LetterGenProps) {
  const t = T[locale];
  const id = useId();
  const [alpha, setAlpha] = useState<AlphabetId>(alpha0 ?? (locale === "en" ? "en" : "ru"));
  const [filter, setFilter] = useState<LetterFilter>("all");
  const [n, setN] = useState(1);
  const [unique, setUnique] = useState(true);
  const [words, setWords] = useState(false);
  const [letters, setLetters] = useState<string[] | null>(null);
  const [history, setHistory] = useState<{ id: number; text: string }[]>([]);
  const hid = useRef(0);

  const A = ALPHABETS[alpha];
  const pool = letterPool(A, filter, words && A.neverInitial.length > 0);
  const maxN = unique ? Math.min(10, pool.length) : 10;
  const single = letters?.length === 1;

  function generate() {
    const r = drawLetters(pool, Math.min(n, maxN), unique);
    setLetters(r);
    setHistory((h) => pushHistory(h, { id: hid.current++, text: r.join(" ") }, 80));
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
        <div aria-live="polite" className="flex min-h-28 flex-wrap items-center justify-center gap-3 sm:min-h-36">
          {letters?.map((l, i) => (
            <span
              key={i}
              className={
                single
                  ? "flex size-28 items-center justify-center rounded-[16px] bg-accent-soft text-7xl font-bold text-accent sm:size-36 sm:text-8xl"
                  : "flex size-16 items-center justify-center rounded-[12px] bg-accent-soft text-4xl font-bold text-accent sm:size-20 sm:text-5xl"
              }
            >
              {l}
            </span>
          ))}
          {!letters && <span className="text-sm text-fg-3">{t.idle}</span>}
        </div>
        <Button variant="primary" size="lg" onClick={generate} disabled={pool.length === 0} className="w-full sm:w-auto sm:min-w-56">
          {n > 1 ? t.generateMany : t.generate}
        </Button>

        <div className="flex w-full flex-col gap-3 border-t border-line pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.alphabet}</span>
              <Segmented label={t.alphabet} value={alpha} onChange={setAlpha} options={(["ru", "en", "kk"] as const).map((v) => ({ value: v, label: t.alphabets[v] }))} size="sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.filter}</span>
              <Segmented label={t.filter} value={filter} onChange={setFilter} options={(["all", "vowels", "consonants"] as const).map((v) => ({ value: v, label: t.filters[v] }))} size="sm" />
            </div>
            <Field label={t.count} htmlFor={`${id}-n`} className="w-32">
              <Select id={`${id}-n`} value={Math.min(n, maxN)} onChange={(e) => setN(Number(e.target.value))} size="sm">
                {Array.from({ length: Math.max(1, maxN) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
            {A.neverInitial.length > 0 && <Switch label={`${t.words} (${A.neverInitial.join(", ")})`} checked={words} onChange={(e) => setWords(e.target.checked)} />}
          </div>
          <p className="text-sm break-words text-fg-3">
            {t.pool} ({pool.length}): {pool.join(" ")}
          </p>
        </div>
      </Panel>
      <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} render="inline" />
    </div>
  );
}
