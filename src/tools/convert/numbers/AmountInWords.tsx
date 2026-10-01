"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { amountEn, amountRu, CURRENCIES, currencyByCode, moneyNumeric, parseMoney, type CurrencyCode, type MinorStyle, type Wrap } from "./lib/amount";
import { groupThousands, parseDecimalInput } from "./lib/parse";
import { Details } from "./ui/ui-bits";

export interface AmountInWordsProps {
  locale: Locale;
  currency?: CurrencyCode;
  value?: string;
}

const T = {
  ru: {
    amount: "Сумма",
    currency: "Валюта",
    minor: "Копейки",
    minorOpts: { digits: "цифрами", words: "прописью", none: "не писать" },
    wrap: "Формат",
    wrapOpts: { none: "текст", contract: "100 (сто) руб.", paren: "(в скобках)" },
    cap: "С заглавной",
    other: "По-английски",
    numeric: "Цифрами",
    rounded: "Сумма округлена до копеек.",
    errors: { empty: "", invalid: "Введите сумму, например 1 234 567,89", negative: "Сумма не может быть отрицательной", "too-big": "Слишком большая сумма: до 999 квадриллионов" },
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    amount: "Amount",
    currency: "Currency",
    minor: "Cents",
    minorOpts: { digits: "00/100", words: "in words", none: "omit" },
    wrap: "Format",
    wrapOpts: { none: "text", contract: "100 (one hundred)", paren: "(in brackets)" },
    cap: "Capitalize",
    other: "In Russian",
    numeric: "In figures",
    rounded: "The amount was rounded to whole cents.",
    errors: { empty: "", invalid: "Enter an amount, e.g. 1,234,567.89", negative: "The amount can't be negative", "too-big": "The amount is too large: up to 999 quadrillion" },
    copy: "Copy",
    copied: "Copied",
  },
} as const;

/** "1234567.89" → "1 234 567,89" (ru) / "1,234,567.89" (en) */
function display(value: string, locale: Locale): string {
  const d = parseDecimalInput(value);
  if (!d) return value;
  const int = groupThousands(d.int.toString(), locale === "ru" ? " " : ",");
  return d.frac ? `${int}${locale === "ru" ? "," : "."}${d.frac}` : int;
}

export default function AmountInWords({ locale, currency: cur0 = "RUB", value = "1234567.89" }: AmountInWordsProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(() => display(value, locale));
  const [code, setCode] = useState<CurrencyCode>(cur0);
  const [minor, setMinor] = useState<MinorStyle>("digits");
  const [wrap, setWrap] = useState<Wrap>("none");
  const [cap, setCap] = useState(true);

  const cur = currencyByCode.get(code) ?? CURRENCIES[0];
  const parsed = parseMoney(text);
  const opts = { minor, wrap, capitalize: cap };
  const error = parsed.ok ? null : t.errors[parsed.error] || null;
  const ru = parsed.ok ? amountRu(parsed.money, cur, opts) : "";
  const en = parsed.ok ? amountEn(parsed.money, cur, opts) : "";
  const main = locale === "ru" ? ru : en;

  return (
    <Panel className="p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <div className="min-w-0">
          <label htmlFor={`${id}-a`} className="text-sm font-medium text-fg-2">
            {t.amount}
          </label>
          <Input
            id={`${id}-a`}
            inputMode="decimal"
            autoComplete="off"
            size="lg"
            className="mt-1.5 h-14! text-2xl! tabular"
            value={text}
            aria-invalid={!!error}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-c`} className="text-sm font-medium text-fg-2">
            {t.currency}
          </label>
          <Select id={`${id}-c`} size="lg" className="mt-1.5 [&_select]:h-14!" value={code} onChange={(e) => setCode(e.target.value as CurrencyCode)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {locale === "ru" ? c.ru.name : c.en.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-5 min-h-16" aria-live="polite">
        {error ? (
          <p className="text-[0.9375rem] text-err">{error}</p>
        ) : parsed.ok ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p lang={locale} className="text-2xl leading-snug font-semibold break-words text-fg">
              {main}
            </p>
            <CopyButton value={main} label={t.copy} copiedLabel={t.copied} className="shrink-0 self-start" />
          </div>
        ) : null}
        {parsed.ok && parsed.money.rounded && <p className="mt-2 text-sm text-warn">{t.rounded}</p>}
      </div>

      {parsed.ok && (
        <div className="mt-3">
          <Details
            label={t.copy}
            copiedLabel={t.copied}
            rows={[
              { key: "other", label: t.other, value: locale === "ru" ? en : ru, lang: locale === "ru" ? "en" : "ru" },
              { key: "num", label: t.numeric, value: moneyNumeric(parsed.money, cur, locale) },
            ].map((r) => ({ ...r, view: r.value }))}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm text-fg-2" aria-hidden>
            {t.minor}
          </span>
          <Segmented size="sm" label={t.minor} value={minor} onChange={setMinor} options={(["digits", "words", "none"] as const).map((v) => ({ value: v, label: t.minorOpts[v] }))} />
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="text-sm text-fg-2" aria-hidden>
            {t.wrap}
          </span>
          <Segmented size="sm" label={t.wrap} value={wrap} onChange={setWrap} options={(["none", "contract", "paren"] as const).map((v) => ({ value: v, label: t.wrapOpts[v] }))} />
        </div>
        <Switch label={t.cap} checked={cap} onChange={(e) => setCap(e.target.checked)} className="text-sm!" />
      </div>
    </Panel>
  );
}
