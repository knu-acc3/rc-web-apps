"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Checkbox } from "@/ui/field";
import { removeDuplicateLines, type BlankMode, type DedupeMode } from "./lib/textOps";
import { countLabel, InlineSelect, InputPanel, OptionsBar, OutputPanel, ResultNote, TwoPane, TX, useDebounced } from "./shared";

const T = {
  ru: {
    ignoreCase: "Без учёта регистра",
    trim: "Игнорировать пробелы по краям",
    collapse: "Считать несколько пробелов одним",
    blank: "Пустые строки",
    blankKeep: "оставить все",
    blankDedupe: "удалить повторы",
    blankRemove: "удалить все",
    mode: "Результат",
    first: "Без повторов (первое вхождение)",
    unique: "Только уникальные (встречаются 1 раз)",
    dups: "Только повторяющиеся строки",
    summary: (removed: string, repeated: string) => `Удалено: ${removed}. Строк с повторами: ${repeated}.`,
    sample: "яблоко\nгруша\nЯблоко\nслива\nгруша\n\nслива \nвишня",
  },
  en: {
    ignoreCase: "Ignore case",
    trim: "Ignore leading/trailing spaces",
    collapse: "Treat multiple spaces as one",
    blank: "Blank lines",
    blankKeep: "keep all",
    blankDedupe: "remove repeats",
    blankRemove: "remove all",
    mode: "Output",
    first: "Remove duplicates (keep first)",
    unique: "Only unique lines (appear once)",
    dups: "Only duplicated lines",
    summary: (removed: string, repeated: string) => `Removed: ${removed}. Lines that had duplicates: ${repeated}.`,
    sample: "apple\npear\nApple\nplum\npear\n\nplum \ncherry",
  },
} as const;

export default function RemoveDuplicates({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trim, setTrim] = useState(true);
  const [collapse, setCollapse] = useState(false);
  const [blank, setBlank] = useState<BlankMode>("keep");
  const [mode, setMode] = useState<DedupeMode>("first");
  const res = useMemo(
    () => removeDuplicateLines(text, { ignoreCase, trim, collapseSpaces: collapse, blank, mode, locale }),
    [text, ignoreCase, trim, collapse, blank, mode, locale],
  );
  const note = useDebounced(t.summary(countLabel(locale, res.removed, TX[locale].lines), String(res.repeated)), 400);

  return (
    <div className="flex flex-col gap-4">
      <OptionsBar>
        <Checkbox label={t.ignoreCase} checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} />
        <Checkbox label={t.trim} checked={trim} onChange={(e) => setTrim(e.target.checked)} />
        <Checkbox label={t.collapse} checked={collapse} onChange={(e) => setCollapse(e.target.checked)} />
        <InlineSelect
          id={`${id}-blank`}
          label={t.blank}
          value={blank}
          onChange={setBlank}
          options={[
            { value: "keep", label: t.blankKeep },
            { value: "dedupe", label: t.blankDedupe },
            { value: "remove", label: t.blankRemove },
          ]}
        />
        <InlineSelect
          id={`${id}-mode`}
          label={t.mode}
          value={mode}
          onChange={setMode}
          options={[
            { value: "first", label: t.first },
            { value: "unique", label: t.unique },
            { value: "duplicates", label: t.dups },
          ]}
        />
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} mono />
        <OutputPanel locale={locale} value={res.text} filename="unique-lines.txt" />
      </TwoPane>
      <ResultNote>{note}</ResultNote>
    </div>
  );
}
