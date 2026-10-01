"use client";

import { Shuffle } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Field, Switch } from "@/ui/field";
import { NumberInput } from "@/ui/number-input";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { ALPHABETS, drawLetters, letterPool, type AlphabetId, type LetterFilter } from "./lib/letters";
import { HistoryPanel, pushHistory } from "./ui/shared";

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
    words: "Без букв, с которых слова не начинаются",
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
      <Panel className="flex flex-col items-center justify-center gap-6 p-4 sm:p-6 lg:min-h-[24rem]">
        <div aria-live="polite" className="flex min-h-28 items-center justify-center sm:min-h-40">
          <div key={history[0]?.id} className="flex flex-wrap items-center justify-center gap-3 motion-safe:animate-[menu-in_0.3s_ease-out]">
          {letters?.map((l, i) => (
            <span
              key={i}
              className={
                single
                  ? "flex size-32 items-center justify-center rounded-[1.25rem] bg-accent-container text-8xl font-bold text-on-accent-container shadow-elev-1 sm:size-40 sm:text-9xl"
                  : "flex size-16 items-center justify-center rounded-[1rem] bg-accent-container text-4xl font-bold text-on-accent-container shadow-elev-1 sm:size-20 sm:text-5xl"
              }
            >
              {l}
            </span>
          ))}
            {!letters && <span className="text-sm text-fg-3">{t.idle}</span>}
          </div>
        </div>
        <Button variant="filled" size="xl" onClick={generate} disabled={pool.length === 0} className="w-full sm:w-auto sm:min-w-64">
          <Shuffle aria-hidden />
          {n > 1 ? t.generateMany : t.generate}
        </Button>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex flex-col gap-4 p-4 sm:p-5">
          <Field label={t.alphabet}>
            <Segmented label={t.alphabet} value={alpha} onChange={setAlpha} options={(["ru", "en", "kk"] as const).map((v) => ({ value: v, label: t.alphabets[v] }))} />
          </Field>
          <Field label={t.filter}>
            <Segmented label={t.filter} value={filter} onChange={setFilter} options={(["all", "vowels", "consonants"] as const).map((v) => ({ value: v, label: t.filters[v] }))} />
          </Field>
          <Field label={t.count} htmlFor={`${id}-n`} className="w-40">
            <NumberInput id={`${id}-n`} locale={locale} min={1} max={Math.max(1, maxN)} value={Math.min(n, Math.max(1, maxN))} onChange={(v) => v !== null && setN(v)} />
          </Field>
          <div className="flex flex-col gap-1">
            <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
            {A.neverInitial.length > 0 && <Switch label={`${t.words} (${A.neverInitial.join(", ")})`} checked={words} onChange={(e) => setWords(e.target.checked)} />}
          </div>
          <p className="text-sm break-words text-fg-3">
            {t.pool} ({pool.length}): {pool.join(" ")}
          </p>
        </Panel>
        <HistoryPanel title={t.history} items={history} onClear={() => setHistory([])} clearLabel={t.clear} emptyLabel={t.empty} render="inline" />
      </div>
    </div>
  );
}
