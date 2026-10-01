"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Input } from "@/ui/field";
import { repeatText } from "./lib/lineTools";
import { graphemeCount } from "./lib/textOps";
import { countLabel, InlineSelect, InputPanel, OptionsBar, OutputPanel, TwoPane, TX } from "./ui/shared";

const T = {
  ru: {
    times: "Сколько раз",
    sep: "Разделитель",
    nl: "новая строка",
    space: "пробел",
    none: "без разделителя",
    comma: "запятая и пробел",
    blank: "пустая строка",
    max: "Не больше 10 000 повторов",
    sample: "Я не буду болтать на уроке.",
  },
  en: {
    times: "Repeat",
    sep: "Separator",
    nl: "new line",
    space: "space",
    none: "nothing",
    comma: "comma and space",
    blank: "blank line",
    max: "Up to 10,000 repetitions",
    sample: "I will not talk in class.",
  },
} as const;

type Sep = "nl" | "space" | "none" | "comma" | "blank";
const SEP: Record<Sep, string> = { nl: "\n", space: " ", none: "", comma: ", ", blank: "\n\n" };

export default function RepeatText({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [times, setTimes] = useState("10");
  const [sep, setSep] = useState<Sep>("nl");
  const n = Math.min(10000, Math.max(0, Number.parseInt(times.replace(/\s/g, ""), 10) || 0));
  const out = useMemo(() => repeatText(text, n, SEP[sep]), [text, n, sep]);
  const chars = useMemo(() => graphemeCount(text) * n + graphemeCount(SEP[sep]) * Math.max(0, n - 1), [text, n, sep]);
  return (
    <div className="flex flex-col gap-4">
      <OptionsBar>
        <label className="flex items-center gap-2">
          <span className="text-fg-2">{t.times}</span>
          <Input value={times} onChange={(e) => setTimes(e.target.value)} inputMode="numeric" size="sm" className="w-24" autoComplete="off" title={t.max} />
        </label>
        <InlineSelect
          id={`${id}-sep`}
          label={t.sep}
          value={sep}
          onChange={setSep}
          options={(["nl", "space", "comma", "blank", "none"] as const).map((s) => ({ value: s, label: t[s] }))}
        />
      </OptionsBar>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} rows={6} />
        <OutputPanel locale={locale} value={out} filename="repeated.txt" title={`${TX[locale].output} · ${countLabel(locale, chars, TX[locale].chars)}`} />
      </TwoPane>
    </div>
  );
}
