"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Checkbox } from "@/ui/field";
import { CASE_IDS, convertCase, type CaseId } from "./lib/case";
import { InputPanel, OptionsBar, OutputPanel, TwoPane } from "./shared";

const CASE_LABELS: Record<CaseId, { ru: string; en: string }> = {
  upper: { ru: "ВСЕ ЗАГЛАВНЫЕ", en: "UPPER CASE" },
  lower: { ru: "все строчные", en: "lower case" },
  title: { ru: "Каждое Слово С Заглавной", en: "Title Case" },
  sentence: { ru: "Как в предложении", en: "Sentence case" },
  camel: { ru: "camelCase", en: "camelCase" },
  pascal: { ru: "PascalCase", en: "PascalCase" },
  snake: { ru: "snake_case", en: "snake_case" },
  kebab: { ru: "kebab-case", en: "kebab-case" },
  constant: { ru: "CONSTANT_CASE", en: "CONSTANT_CASE" },
  dot: { ru: "dot.case", en: "dot.case" },
  alternating: { ru: "чЕрЕдОвАнИе", en: "aLtErNaTiNg" },
  inverse: { ru: "иНВЕРСИЯ рЕГИСТРА", en: "iNVERSE cASE" },
};

const T = {
  ru: {
    caseLabel: "Регистр",
    acronyms: "Сохранять аббревиатуры (NASA, США)",
    small: "Предлоги и артикли строчными (для английских заголовков)",
    sample: "как перевести XMLHttpRequest в snake_case? hello,_world и приветМир — тоже слова. NASA и США остаются аббревиатурами.",
  },
  en: {
    caseLabel: "Case",
    acronyms: "Keep acronyms (NASA, USA)",
    small: "Keep articles and short prepositions lowercase",
    sample: "how to turn XMLHttpRequest into snake_case? hello,_world and приветМир are words too. NASA and the USA stay acronyms.",
  },
} as const;

export interface CaseConverterProps {
  locale: Locale;
  caseId?: CaseId;
}

export default function CaseConverter({ locale, caseId = "upper" }: CaseConverterProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [mode, setMode] = useState<CaseId>(caseId);
  const [acronyms, setAcronyms] = useState(true);
  const [smallWords, setSmallWords] = useState(locale === "en");
  const out = useMemo(
    () => convertCase(text, mode, { locale: locale === "ru" ? "ru" : "en", keepAcronyms: acronyms, smallWords }),
    [text, mode, acronyms, smallWords, locale],
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label={t.caseLabel} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {CASE_IDS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={mode === c}
            onClick={() => setMode(c)}
            className={cn(
              "h-10 truncate rounded-[8px] border px-2 text-sm font-medium transition-colors duration-150",
              mode === c ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-fg hover:border-line-strong",
            )}
          >
            {CASE_LABELS[c][locale]}
          </button>
        ))}
      </div>
      {(mode === "title" || mode === "sentence") && (
        <OptionsBar>
          <Checkbox label={t.acronyms} checked={acronyms} onChange={(e) => setAcronyms(e.target.checked)} />
          {mode === "title" && <Checkbox label={t.small} checked={smallWords} onChange={(e) => setSmallWords(e.target.checked)} />}
        </OptionsBar>
      )}
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} />
        <OutputPanel locale={locale} value={out} filename={`${mode}-case.txt`} />
      </TwoPane>
    </div>
  );
}
