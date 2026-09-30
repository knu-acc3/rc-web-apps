"use client";

import { useDeferredValue, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Checkbox, Field, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { analyze } from "./lib/keywords";

type N = "1" | "2" | "3";

const T = {
  ru: {
    text: "Текст для анализа",
    ph: "Вставьте текст статьи или страницы…",
    words: "Слов",
    unique: "Уникальных",
    water: "Водность",
    nausea: "Тошнота",
    chars: (a: string, b: string) => `${a} символов, ${b} без пробелов`,
    n: "Фразы",
    one: "Слова",
    two: "2 слова",
    three: "3 слова",
    stem: "Объединять словоформы",
    stop: "Скрывать стоп-слова",
    phrase: "Фраза",
    count: "Раз",
    density: "Доля, %",
    empty: "Пока нечего считать — вставьте текст.",
    none: "Повторяющихся фраз нет.",
    hint: "Водность — доля служебных слов (предлоги, союзы, местоимения). Классическая тошнота — квадратный корень из числа повторов самого частого слова.",
  },
  en: {
    text: "Text to analyse",
    ph: "Paste the article or page text…",
    words: "Words",
    unique: "Unique",
    water: "Stop words",
    nausea: "Nausea",
    chars: (a: string, b: string) => `${a} characters, ${b} without spaces`,
    n: "Phrases",
    one: "Words",
    two: "2 words",
    three: "3 words",
    stem: "Group word forms",
    stop: "Hide stop words",
    phrase: "Phrase",
    count: "Count",
    density: "Density, %",
    empty: "Nothing to count yet — paste some text.",
    none: "No repeated phrases.",
    hint: "Stop-word share counts function words (prepositions, conjunctions, pronouns). Classic nausea is the square root of the top word's count.",
  },
} as const;

export default function KeywordDensity({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("");
  const [n, setN] = useState<N>("1");
  const [stemming, setStemming] = useState(true);
  const [stop, setStop] = useState(true);
  const deferred = useDeferredValue(text);
  const a = analyze(deferred, { stemming, stopWords: stop });
  const rows = a.grams[Number(n) as 1 | 2 | 3].slice(0, 40);
  const fmt = (x: number, d = 0) => formatNumber(locale, x, { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <div className="flex flex-col gap-5">
      <Field label={t.text} htmlFor={`${id}-t`} aside={deferred ? <span className="text-[13px] text-fg-3">{t.chars(fmt(a.chars), fmt(a.charsNoSpaces))}</span> : undefined}>
        <Textarea id={`${id}-t`} value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder={t.ph} />
      </Field>

      <div aria-live="polite" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            [t.words, fmt(a.words)],
            [t.unique, fmt(a.unique)],
            [t.water, `${fmt(a.stopShare, 1)}%`],
            [t.nausea, fmt(a.nausea, 2)],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-[12px] bg-surface-2 px-4 py-3">
            <div className="text-[13px] text-fg-3">{k}</div>
            <div className="text-2xl font-semibold text-fg tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Segmented<N>
          label={t.n}
          value={n}
          onChange={setN}
          options={[
            { value: "1", label: t.one },
            { value: "2", label: t.two },
            { value: "3", label: t.three },
          ]}
        />
        <Checkbox label={t.stem} checked={stemming} onChange={(e) => setStemming(e.target.checked)} />
        <Checkbox label={t.stop} checked={stop} onChange={(e) => setStop(e.target.checked)} />
      </div>

      {!deferred.trim() ? (
        <p className="text-[15px] text-fg-3">{t.empty}</p>
      ) : rows.length === 0 ? (
        <p className="text-[15px] text-fg-3">{t.none}</p>
      ) : (
        <div tabIndex={0} className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.phrase}</th>
                <th scope="col" className="text-right">
                  {t.count}
                </th>
                <th scope="col" className="text-right">
                  {t.density}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.phrase}>
                  <td>{r.phrase}</td>
                  <td className="text-right tabular-nums">{r.count}</td>
                  <td className="text-right tabular-nums">{fmt(r.density, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-sm text-fg-3">{t.hint}</p>
    </div>
  );
}
