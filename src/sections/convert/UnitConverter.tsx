"use client";

import { ArrowLeftRight } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatSmart, parseNumber, plural } from "@/i18n/format";
import { copyText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { clean, convert, type ConvUnit } from "./engine";

export interface ClientUnit extends ConvUnit {
  slug: string;
  sym: string;
  /** Select label, e.g. «Километры (км)» */
  label: string;
  /** Plural forms for "N units" in the current locale */
  forms: string[];
  /** Symbol is a word that must be declined ("миля" → "5 миль") */
  word?: boolean;
}

export interface UnitConverterProps {
  locale: Locale;
  units: ClientUnit[];
  from: string;
  to: string;
  value?: number;
  allowNegative?: boolean;
}

const T = {
  ru: {
    value: "Значение",
    from: "Из",
    to: "В",
    swap: "Поменять единицы местами",
    precision: "Точность",
    auto: "Авто",
    digits: "зн.",
    all: "во всех единицах",
    invalid: "Введите число",
    negative: "Значение не может быть отрицательным",
    copy: "Копировать",
    copied: "Скопировано",
    result: "Результат",
  },
  en: {
    value: "Value",
    from: "From",
    to: "To",
    swap: "Swap units",
    precision: "Precision",
    auto: "Auto",
    digits: "dp",
    all: "in all units",
    invalid: "Enter a number",
    negative: "Value can't be negative",
    copy: "Copy",
    copied: "Copied",
    result: "Result",
  },
} as const;

const PRECISIONS = ["auto", "0", "1", "2", "3", "4", "6", "8", "10"] as const;
type Precision = (typeof PRECISIONS)[number];

const plainSpaces = (s: string) => s.replace(/[  ]/g, " ");

export default function UnitConverter({ locale, units, from: from0, to: to0, value = 1, allowNegative = false }: UnitConverterProps) {
  const t = T[locale];
  const id = useId();
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(to0);
  // The field the user typed in last is the source of truth.
  const [edited, setEdited] = useState<"a" | "b">("a");
  const [aText, setAText] = useState(() => plainSpaces(formatSmart(locale, value)));
  const [bText, setBText] = useState("");
  const [precision, setPrecision] = useState<Precision>("auto");
  const [copiedRow, setCopiedRow] = useState<string | null>(null);

  const U = useMemo(() => new Map(units.map((u) => [u.slug, u])), [units]);
  const uFrom = U.get(from) ?? units[0];
  const uTo = U.get(to) ?? units[1] ?? units[0];

  const fmt = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    return plainSpaces(
      precision === "auto"
        ? formatSmart(locale, clean(n))
        : new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: Number(precision) }).format(n),
    );
  };

  const srcText = edited === "a" ? aText : bText;
  const srcNum = parseNumber(srcText);
  const error = srcText.trim() === "" ? null : srcNum === null ? t.invalid : !allowNegative && srcNum < 0 ? t.negative : null;
  const ok = srcNum !== null && !error;

  const aNum = !ok ? null : edited === "a" ? srcNum : convert(srcNum, uTo, uFrom);
  const bNum = !ok ? null : edited === "b" ? srcNum : convert(srcNum, uFrom, uTo);
  const aShown = edited === "a" ? aText : aNum === null ? "" : fmt(aNum);
  const bShown = edited === "b" ? bText : bNum === null ? "" : fmt(bNum);

  const sentence =
    aNum !== null && bNum !== null
      ? `${fmt(aNum)} ${plural(locale, clean(aNum), uFrom.forms)} = ${fmt(bNum)} ${plural(locale, clean(bNum), uTo.forms)}`
      : "";

  function swap() {
    setFrom(to);
    setTo(from);
    setAText(aShown);
    setEdited("a");
  }

  const unitOptions = units.map((u) => (
    <option key={u.slug} value={u.slug}>
      {u.label}
    </option>
  ));

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-2">
            <Field label={t.value} htmlFor={`${id}-a`}>
              <Input
                id={`${id}-a`}
                inputMode="decimal"
                autoComplete="off"
                value={aShown}
                aria-invalid={edited === "a" && !!error}
                onChange={(e) => {
                  setAText(e.target.value);
                  setEdited("a");
                }}
                size="lg"
                className="tabular"
              />
            </Field>
            <Field label={t.from} htmlFor={`${id}-fu`}>
              <Select id={`${id}-fu`} value={uFrom.slug} onChange={(e) => setFrom(e.target.value)} size="lg">
                {unitOptions}
              </Select>
            </Field>
          </div>
          <Button variant="outline" size="icon" onClick={swap} aria-label={t.swap} title={t.swap} className="mx-auto mb-1 max-md:rotate-90">
            <ArrowLeftRight />
          </Button>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-2">
            <Field label={t.result} htmlFor={`${id}-b`}>
              <Input
                id={`${id}-b`}
                inputMode="decimal"
                autoComplete="off"
                value={bShown}
                aria-invalid={edited === "b" && !!error}
                onChange={(e) => {
                  setBText(e.target.value);
                  setEdited("b");
                }}
                size="lg"
                className="tabular"
              />
            </Field>
            <Field label={t.to} htmlFor={`${id}-tu`}>
              <Select id={`${id}-tu`} value={uTo.slug} onChange={(e) => setTo(e.target.value)} size="lg">
                {unitOptions}
              </Select>
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-[10px] bg-surface-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="tabular min-h-7 text-lg font-semibold break-words text-fg sm:text-xl" aria-live="polite">
            {error ? <span className="text-base font-medium text-err">{error}</span> : sentence}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <label htmlFor={`${id}-p`} className="text-sm text-fg-3">
              {t.precision}
            </label>
            <Select id={`${id}-p`} value={precision} onChange={(e) => setPrecision(e.target.value as Precision)} size="sm" className="w-28">
              {PRECISIONS.map((p) => (
                <option key={p} value={p}>
                  {p === "auto" ? t.auto : `${p} ${t.digits}`}
                </option>
              ))}
            </Select>
            <CopyButton value={bShown} label={t.copy} copiedLabel={t.copied} size="sm" />
          </div>
        </div>
      </Panel>

      {aNum !== null && (
        <Panel>
          <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">
            {fmt(aNum)} {uFrom.sym} — {t.all}
          </h2>
          <ul className="rows">
            {units
              .filter((u) => u.slug !== uFrom.slug)
              .map((u) => {
                const text = fmt(convert(aNum, uFrom, u));
                return (
                  <li key={u.slug}>
                    <span className="min-w-0">
                      <span className="tabular block font-semibold break-all text-fg">
                        {text} <span className="font-normal text-fg-2">{u.word ? plural(locale, clean(convert(aNum, uFrom, u)), u.forms) : u.sym}</span>
                      </span>
                      <span className="block truncate text-[13px] text-fg-3">{u.label}</span>
                    </span>
                    <button
                      type="button"
                      className="shrink-0 rounded-[6px] px-2 py-1 text-[13px] text-fg-3 hover:bg-surface-2 hover:text-accent"
                      onClick={async () => {
                        if (await copyText(text)) setCopiedRow(u.slug);
                      }}
                    >
                      {copiedRow === u.slug ? t.copied : t.copy}
                    </button>
                  </li>
                );
              })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
