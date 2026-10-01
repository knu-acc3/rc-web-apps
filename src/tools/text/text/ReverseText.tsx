"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { reverseText, type ReverseMode } from "./lib/textOps";
import { InputPanel, OutputPanel, TwoPane } from "./ui/shared";
import { ChipChoice } from "@/ui/chip-choice";

const T = {
  ru: {
    mode: "Что переворачивать",
    text: "Весь текст",
    "each-line": "Каждую строку",
    words: "Порядок слов",
    "letters-in-words": "Буквы в словах",
    lines: "Порядок строк",
    sample: "А роза упала на лапу Азора 🌹\nФлаги 🇰🇿 🇷🇺 и эмодзи 👨‍👩‍👧 не ломаются",
  },
  en: {
    mode: "What to reverse",
    text: "Whole text",
    "each-line": "Each line",
    words: "Word order",
    "letters-in-words": "Letters in words",
    lines: "Line order",
    sample: "Was it a car or a cat I saw? 🚗\nFlags 🇰🇿 🇺🇸 and emoji 👨‍👩‍👧 stay intact",
  },
} as const;

const MODES: ReverseMode[] = ["text", "each-line", "words", "letters-in-words", "lines"];

export default function ReverseText({ locale, mode: mode0 = "text" }: { locale: Locale; mode?: ReverseMode }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [mode, setMode] = useState<ReverseMode>(mode0);
  const out = useMemo(() => reverseText(text, mode, locale), [text, mode, locale]);
  return (
    <div className="flex flex-col gap-4">
      <ChipChoice label={t.mode} value={mode} onChange={setMode} grid="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" options={MODES.map((m) => ({ value: m, label: t[m] }))} />
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={out} filename="reversed.txt" />
      </TwoPane>
    </div>
  );
}
