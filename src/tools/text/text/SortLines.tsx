"use client";

import { Shuffle } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { prepareLines, shuffle, sortLines, type SortMode } from "./lib/textOps";
import { InlineSelect, InputPanel, MoreOptions, OptionsBar, OutputPanel, TwoPane } from "./ui/shared";
import { ChipChoice } from "@/ui/chip-choice";

const T = {
  ru: {
    mode: "Сортировка",
    alpha: "По алфавиту",
    natural: "Естественная (2 < 10)",
    numeric: "По числу в строке",
    length: "По длине строки",
    random: "Случайный порядок",
    reverse: "Обратный порядок",
    desc: "По убыванию",
    ignoreCase: "Без учёта регистра",
    collation: "Алфавит",
    ruFirst: "русский (кириллица первой)",
    enFirst: "английский (латиница первой)",
    kkFirst: "казахский",
    removeEmpty: "Удалить пустые строки",
    trim: "Обрезать пробелы",
    unique: "Удалить повторы",
    shuffle: "Перемешать",
    shuffleHint: "Нажмите «Перемешать» — порядок выбирается криптографическим генератором браузера.",
    numericNote: "Строки без чисел остаются в конце в исходном порядке.",
    sample: "Яблоко 12\nбанан 3\nАпельсин 100\nzebra 7\nЁлка 25\nвишня\nApple 2,5\nгруша 1 000",
  },
  en: {
    mode: "Sort",
    alpha: "Alphabetical",
    natural: "Natural (2 < 10)",
    numeric: "By number in line",
    length: "By line length",
    random: "Random order",
    reverse: "Reverse order",
    desc: "Descending",
    ignoreCase: "Ignore case",
    collation: "Alphabet",
    ruFirst: "Russian (Cyrillic first)",
    enFirst: "English (Latin first)",
    kkFirst: "Kazakh",
    removeEmpty: "Remove empty lines",
    trim: "Trim spaces",
    unique: "Remove duplicates",
    shuffle: "Shuffle",
    shuffleHint: "Press “Shuffle” — the order comes from the browser’s cryptographic random generator.",
    numericNote: "Lines without a number stay at the end in their original order.",
    sample: "banana 3\nApple 12\norange 100\nzebra 7\ncherry\napricot 2.5\nmango 1,000\nкиви 25",
  },
} as const;

export interface SortLinesProps {
  locale: Locale;
  mode?: SortMode;
  descending?: boolean;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export default function SortLines({ locale, mode: mode0 = "alpha", descending = false }: SortLinesProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [mode, setMode] = useState<SortMode>(mode0);
  const [desc, setDesc] = useState(descending);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [collation, setCollation] = useState<"ru" | "en" | "kk">(locale === "ru" ? "ru" : "en");
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [trim, setTrim] = useState(true);
  const [unique, setUnique] = useState(false);
  /** Permutation for random mode — generated only in event handlers (crypto). */
  const [order, setOrder] = useState<number[] | null>(null);

  const prep = { removeEmpty, trim, unique, ignoreCase, locale: collation };
  const lines = useMemo(() => prepareLines(text, { removeEmpty, trim, unique, ignoreCase, locale: collation }), [text, removeEmpty, trim, unique, ignoreCase, collation]);
  const shuffled = mode === "random" && order !== null && order.length === lines.length;

  const out = useMemo(() => {
    if (mode === "random") return (shuffled ? order!.map((i) => lines[i]) : lines).join("\n");
    return sortLines(text, { mode, descending: desc, ignoreCase, locale: collation, removeEmpty, trim, unique }).join("\n");
  }, [text, mode, desc, ignoreCase, collation, removeEmpty, trim, unique, lines, order, shuffled]);

  const reshuffle = (src: string) => setOrder(shuffle(range(prepareLines(src, prep).length)));
  const sortable = mode !== "random" && mode !== "reverse";
  return (
    <div className="flex flex-col gap-4">
      <ChipChoice
        label={t.mode}
        value={mode}
        onChange={(m) => {
          setMode(m);
          if (m === "random") reshuffle(text);
        }}
        grid="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        options={(["alpha", "natural", "numeric", "length", "random", "reverse"] as const).map((m) => ({ value: m, label: t[m] }))}
      />
      <OptionsBar>
        {mode === "random" && (
          <Button size="lg" variant="filled" onClick={() => reshuffle(text)}>
            <Shuffle aria-hidden />
            {t.shuffle}
          </Button>
        )}
        {sortable && <Switch label={t.desc} checked={desc} onChange={(e) => setDesc(e.target.checked)} />}
      </OptionsBar>
      <TwoPane>
        <InputPanel
          id={`${id}-in`}
          locale={locale}
          value={text}
          onChange={(v) => {
            setText(v);
            if (mode === "random") reshuffle(v);
          }}
          mono
        />
        <OutputPanel locale={locale} value={out} filename="sorted.txt" />
      </TwoPane>
      {mode === "numeric" && <p className="text-sm text-fg-3">{t.numericNote}</p>}
      {mode === "random" && !shuffled && <p className="text-sm text-fg-3">{t.shuffleHint}</p>}
      <MoreOptions locale={locale}>
        {sortable && <Switch label={t.ignoreCase} checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />}
        {sortable && (
          <InlineSelect
            id={`${id}-coll`}
            label={t.collation}
            value={collation}
            onChange={setCollation}
            options={[
              { value: "ru", label: t.ruFirst },
              { value: "en", label: t.enFirst },
              { value: "kk", label: t.kkFirst },
            ]}
          />
        )}
        <Switch label={t.removeEmpty} checked={removeEmpty} onChange={(e) => setRemoveEmpty(e.target.checked)} />
        <Switch label={t.trim} checked={trim} onChange={(e) => setTrim(e.target.checked)} />
        <Switch label={t.unique} checked={unique} onChange={(e) => setUnique(e.target.checked)} />
      </MoreOptions>
    </div>
  );
}
