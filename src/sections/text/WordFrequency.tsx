"use client";

import { Download } from "lucide-react";
import { useDeferredValue, useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { downloadText } from "@/lib/clipboard";
import { buttonClass } from "@/ui/button";
import { Checkbox } from "@/ui/field";
import { Panel, PanelHeader } from "@/ui/panel";
import { wordFrequency } from "./lib/textOps";
import { countLabel, InlineSelect, InputPanel, MoreOptions, OptionsBar, TX } from "./ui/shared";

const T = {
  ru: {
    stop: "Без служебных слов (и, в, на, the…)",
    ngram: "Считать",
    n1: "слова",
    n2: "фразы из 2 слов",
    n3: "фразы из 3 слов",
    minLen: "Мин. длина слова",
    numbers: "Учитывать числа",
    caseSensitive: "Различать регистр",
    word: "Слово",
    phrase: "Фраза",
    count: "Раз",
    share: "Доля",
    csv: "CSV",
    total: "Всего учтено",
    showAll: "Показаны первые 200",
    empty: "Введите текст — таблица появится сразу.",
    sample:
      "Частотный анализ показывает, какие слова встречаются в тексте чаще всего. Анализ частотности слов помогает проверить текст на переспам: если ключевое слово встречается слишком часто, текст читается хуже. Слова считаются без учёта регистра, а служебные слова можно скрыть.",
  },
  en: {
    stop: "Hide stop words (the, and, of…)",
    ngram: "Count",
    n1: "words",
    n2: "2-word phrases",
    n3: "3-word phrases",
    minLen: "Min word length",
    numbers: "Include numbers",
    caseSensitive: "Case-sensitive",
    word: "Word",
    phrase: "Phrase",
    count: "Count",
    share: "Share",
    csv: "CSV",
    total: "Counted",
    showAll: "Showing the first 200",
    empty: "Type or paste text — the table appears instantly.",
    sample:
      "Word frequency analysis shows which words occur in a text most often. Checking word frequency helps you spot keyword stuffing: if a keyword appears too often, the text reads worse. Words are counted case-insensitively, and stop words can be hidden.",
  },
} as const;

const LIMIT = 200;

export default function WordFrequency({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState<string>(t.sample);
  const [stop, setStop] = useState(true);
  const [ngram, setNgram] = useState<"1" | "2" | "3">("1");
  const [minLen, setMinLen] = useState<"1" | "2" | "3" | "4" | "5">("2");
  const [numbers, setNumbers] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const deferred = useDeferredValue(text);
  const { rows, total } = useMemo(
    () =>
      wordFrequency(deferred, {
        locale,
        excludeStopWords: stop,
        ngram: Number(ngram) as 1 | 2 | 3,
        minLength: Number(minLen),
        includeNumbers: numbers,
        ignoreCase: !caseSensitive,
      }),
    [deferred, locale, stop, ngram, minLen, numbers, caseSensitive],
  );
  const pct = (x: number) => `${formatNumber(locale, x * 100, { maximumFractionDigits: 1 })} %`;
  const csv = () => ["word,count,share", ...rows.map((r) => `"${r.word.replace(/"/g, '""')}",${r.count},${(r.share * 100).toFixed(2)}`)].join("\n");

  return (
    <div className="flex flex-col gap-4">
      <InputPanel id={`${id}-in`} locale={locale} value={text} onChange={setText} rows={7} />
      <OptionsBar>
        <Checkbox label={t.stop} checked={stop} onChange={(e) => setStop(e.target.checked)} />
        <InlineSelect
          id={`${id}-ng`}
          label={t.ngram}
          value={ngram}
          onChange={setNgram}
          options={[
            { value: "1", label: t.n1 },
            { value: "2", label: t.n2 },
            { value: "3", label: t.n3 },
          ]}
        />
      </OptionsBar>
      <Panel>
        <PanelHeader
          title={`${t.total}: ${countLabel(locale, total, TX[locale].words)}`}
          actions={
            <button type="button" className={buttonClass("ghost", "sm")} disabled={!rows.length} onClick={() => downloadText(csv(), "word-frequency.csv", "text/csv;charset=utf-8")}>
              <Download aria-hidden />
              {t.csv}
            </button>
          }
        />
        {rows.length === 0 ? (
          <p className="px-4 py-3 text-sm text-fg-3">{t.empty}</p>
        ) : (
          <div tabIndex={0} className="max-h-[28rem] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-2 text-fg-2">
                <tr>
                  <th scope="col" className="w-10 px-4 py-2 font-medium">
                    #
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    {ngram === "1" ? t.word : t.phrase}
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    {t.count}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    {t.share}
                  </th>
                </tr>
              </thead>
              <tbody className="tabular">
                {rows.slice(0, LIMIT).map((r, i) => (
                  <tr key={r.word} className="border-t border-line">
                    <td className="px-4 py-1.5 text-fg-3">{i + 1}</td>
                    <td className="px-2 py-1.5 font-medium break-all text-fg">{r.word}</td>
                    <td className="px-2 py-1.5 text-right text-fg">{formatNumber(locale, r.count)}</td>
                    <td className="px-4 py-1.5 text-right text-fg-2">{pct(r.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > LIMIT && <p className="border-t border-line px-4 py-2 text-[0.8125rem] text-fg-3">{t.showAll}</p>}
          </div>
        )}
      </Panel>
      <MoreOptions locale={locale}>
        <InlineSelect id={`${id}-min`} label={t.minLen} value={minLen} onChange={setMinLen} options={(["1", "2", "3", "4", "5"] as const).map((v) => ({ value: v, label: v }))} />
        <Checkbox label={t.numbers} checked={numbers} onChange={(e) => setNumbers(e.target.checked)} />
        <Checkbox label={t.caseSensitive} checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
      </MoreOptions>
    </div>
  );
}
