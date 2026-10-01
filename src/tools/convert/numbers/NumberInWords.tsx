"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Input, Switch } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { CASES, CASE_NAMES, ruCardinalCase } from "./lib/declension";
import { parseDecimalInput } from "./lib/parse";
import { Details } from "./ui/ui-bits";
import { enCardinal, enDecimal, enOrdinal, enOrdinalSuffix } from "./lib/words-en";
import { capitalize, ruCardinal, ruDecimal, ruOrdinal, RU_MAX, RU_MAX_FRACTION_DIGITS, type Gender } from "./lib/words-ru";

export interface NumberInWordsProps {
  locale: Locale;
  value?: string;
}

const T = {
  ru: {
    number: "Число",
    placeholder: "Например, 2024 или 12,5",
    gender: "Род",
    genders: { m: "муж.", f: "жен.", n: "ср." },
    british: "Британский английский",
    cap: "С заглавной",
    ordinal: "Порядковое",
    other: "По-английски",
    otherOrdinal: "Порядковое по-английски",
    cases: "Склонение по падежам",
    invalid: "Введите число, например 1 234 или 12,5",
    tooBig: "Слишком большое число: поддерживаются значения до 10¹⁸ − 1 (999 квадриллионов).",
    tooLong: `Слишком много знаков после запятой — не больше ${RU_MAX_FRACTION_DIGITS}.`,
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    number: "Number",
    placeholder: "e.g. 2024 or 12.5",
    gender: "Russian gender",
    genders: { m: "masc.", f: "fem.", n: "neut." },
    british: "British “and”",
    cap: "Capitalize",
    ordinal: "Ordinal",
    other: "In Russian",
    otherOrdinal: "Russian ordinal",
    cases: "Russian cases",
    invalid: "Enter a number, e.g. 1,234 or 12.5",
    tooBig: "The number is too large: values up to 10¹⁸ − 1 (999 quadrillion) are supported.",
    tooLong: `Too many decimal places — at most ${RU_MAX_FRACTION_DIGITS}.`,
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const CASE_EN: Record<(typeof CASES)[number], string> = { nom: "Nominative", gen: "Genitive", dat: "Dative", acc: "Accusative", ins: "Instrumental", pre: "Prepositional" };

export default function NumberInWords({ locale, value = "2024" }: NumberInWordsProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const [gender, setGender] = useState<Gender>("m");
  const [british, setBritish] = useState(false);
  const [cap, setCap] = useState(false);

  const d = text.trim() ? parseDecimalInput(text) : null;
  let error: string | null = null;
  if (text.trim() && !d) error = t.invalid;
  else if (d && d.int > RU_MAX) error = t.tooBig;
  else if (d && d.frac.length > RU_MAX_FRACTION_DIGITS) error = t.tooLong;
  const ok = d && !error;
  const c = (s: string) => (cap ? capitalize(s) : s);

  let main = "";
  let rows: { key: string; label: string; value: string; lang: string }[] = [];
  let signed = 0n;
  if (ok) {
    signed = d.neg ? -d.int : d.int;
    const ru = d.frac ? c(ruDecimal(d.int, d.frac, d.neg)) : c(ruCardinal(signed, gender));
    const en = d.frac ? c(enDecimal(d.int, d.frac, d.neg, { british })) : c(enCardinal(signed, { british }));
    const ruOrd = d.frac ? "" : c(ruOrdinal(signed, gender));
    const enOrd = d.frac ? "" : `${c(enOrdinal(signed, { british }))} (${enOrdinalSuffix(signed)})`;
    if (locale === "ru") {
      main = ru;
      rows = [
        { key: "ro", label: t.ordinal, value: ruOrd, lang: "ru" },
        { key: "en", label: t.other, value: en, lang: "en" },
        { key: "eo", label: t.otherOrdinal, value: enOrd, lang: "en" },
      ];
    } else {
      main = en;
      rows = [
        { key: "eo", label: t.ordinal, value: enOrd, lang: "en" },
        { key: "ru", label: t.other, value: ru, lang: "ru" },
        { key: "ro", label: t.otherOrdinal, value: ruOrd, lang: "ru" },
      ];
    }
    rows = rows.filter((r) => r.value);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <label htmlFor={`${id}-n`} className="text-sm font-medium text-fg-2">
          {t.number}
        </label>
        <Input
          id={`${id}-n`}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          size="lg"
          className="mt-1.5 h-14! text-2xl! tabular"
          placeholder={t.placeholder}
          value={text}
          aria-invalid={!!error}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-5 min-h-16" aria-live="polite">
          {error ? (
            <p className="text-[0.9375rem] text-err">{error}</p>
          ) : ok ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <p lang={locale} className="text-2xl leading-snug font-semibold break-words text-fg sm:text-3xl">
                {main}
              </p>
              <CopyButton value={main} label={t.copy} copiedLabel={t.copied} className="shrink-0 self-start" />
            </div>
          ) : null}
        </div>

        {ok && rows.length > 0 && (
          <div className="mt-3">
            <Details rows={rows.map((r) => ({ ...r, view: r.value }))} label={t.copy} copiedLabel={t.copied} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-sm text-fg-2" aria-hidden>
              {t.gender}
            </span>
            <Segmented label={t.gender} size="sm" value={gender} onChange={setGender} options={(["m", "f", "n"] as const).map((g) => ({ value: g, label: t.genders[g] }))} />
          </div>
          <Switch label={t.cap} checked={cap} onChange={(e) => setCap(e.target.checked)} className="text-sm!" />
          <Switch label={t.british} checked={british} onChange={(e) => setBritish(e.target.checked)} className="text-sm!" />
        </div>
      </Panel>

      {ok && !d.frac && (
        <Fold title={t.cases} open={locale === "ru"} bodyClassName="px-0! pb-2! pt-0!">
          <div tabIndex={0} className="tbl rounded-none! border-0! border-t! border-line! shadow-none!">
            <table>
              <tbody>
                {CASES.map((k) => (
                  <tr key={k}>
                    <th scope="row" className="w-40 text-left font-normal!">
                      {locale === "ru" ? CASE_NAMES[k].name : CASE_EN[k]}
                    </th>
                    <td lang="ru">{(k === "pre" ? "о " : "") + ruCardinalCase(signed, k, gender)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Fold>
      )}
    </div>
  );
}
