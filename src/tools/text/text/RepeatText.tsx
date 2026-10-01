"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import { repeatText } from "./lib/lineTools";
import { graphemeCount } from "./lib/textOps";
import { countLabel, InputPanel, OutputPanel, TwoPane, TX } from "./ui/shared";

const T = {
  ru: {
    times: "Сколько раз",
    sep: "Разделитель",
    nl: "новая строка",
    space: "пробел",
    none: "без разделителя",
    comma: "запятая и пробел",
    blank: "пустая строка",
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
  const parseTimes = (v: string) => {
    const x = Number.parseInt(v.replace(/\s/g, ""), 10);
    return Number.isFinite(x) ? x : null;
  };
  const n = Math.min(10000, Math.max(0, parseTimes(times) ?? 0));
  const out = useMemo(() => repeatText(text, n, SEP[sep]), [text, n, sep]);
  const chars = useMemo(() => graphemeCount(text) * n + graphemeCount(SEP[sep]) * Math.max(0, n - 1), [text, n, sep]);
  return (
    <div className="flex flex-col gap-4">
      <div className="panel grid items-end gap-x-8 gap-y-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <SliderField id={`${id}-n`} label={t.times} value={times} onChange={setTimes} parse={parseTimes} format={(x) => formatNumber(locale, x)} min={1} max={10000} scale="exp" inputMode="numeric" />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg-2">{t.sep}</span>
          <Segmented label={t.sep} value={sep} onChange={setSep} size="sm" options={(["nl", "space", "comma", "blank", "none"] as const).map((s) => ({ value: s, label: t[s] }))} />
        </div>
      </div>
      <TwoPane>
        <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} rows={6} />
        <OutputPanel locale={locale} value={out} filename="repeated.txt" title={`${TX[locale].output} · ${countLabel(locale, chars, TX[locale].chars)}`} />
      </TwoPane>
    </div>
  );
}
