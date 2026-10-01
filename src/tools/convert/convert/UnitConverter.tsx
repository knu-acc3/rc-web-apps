"use client";

import { ArrowLeftRight } from "lucide-react";
import { useId, useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatSmart, parseNumber, plural } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { clean, convert, type ConvUnit } from "./lib/engine";

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
    result: "Результат",
    fromUnit: "Исходная единица",
    toUnit: "Единица результата",
    swap: "Поменять единицы местами",
    all: "во всех единицах",
    invalid: "Введите число",
    negative: "Значение не может быть отрицательным",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    value: "Value",
    result: "Result",
    fromUnit: "From unit",
    toUnit: "To unit",
    swap: "Swap units",
    all: "in all units",
    invalid: "Enter a number",
    negative: "Value can't be negative",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

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

  const U = useMemo(() => new Map(units.map((u) => [u.slug, u])), [units]);
  const uFrom = U.get(from) ?? units[0];
  const uTo = U.get(to) ?? units[1] ?? units[0];

  const fmt = (n: number) => (Number.isFinite(n) ? plainSpaces(formatSmart(locale, clean(n))) : "—");
  const unitText = (n: number, u: ClientUnit) => (u.word ? plural(locale, clean(n), u.forms) : u.sym);

  const srcText = edited === "a" ? aText : bText;
  const srcNum = parseNumber(srcText, locale);
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

  const options = units.map((u) => (
    <option key={u.slug} value={u.slug}>
      {u.label}
    </option>
  ));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-3">
        <UnitBox
          id={`${id}-a`}
          value={aShown}
          invalid={edited === "a" && !!error}
          onValue={(v) => {
            setAText(v);
            setEdited("a");
          }}
          valueLabel={t.value}
          unit={uFrom.slug}
          unitLabel={t.fromUnit}
          onUnit={setFrom}
          options={options}
        />
        <div className="relative z-10 -my-5 flex justify-center md:my-0 md:items-center">
          <IconButton
            label={t.swap}
            variant="tonal"
            onClick={swap}
            className="shadow-elev-1"
            icon={<ArrowLeftRight aria-hidden className="max-md:rotate-90 motion-safe:transition-transform" />}
          />
        </div>
        <UnitBox
          id={`${id}-b`}
          primary
          value={bShown}
          invalid={edited === "b" && !!error}
          onValue={(v) => {
            setBText(v);
            setEdited("b");
          }}
          valueLabel={t.result}
          unit={uTo.slug}
          unitLabel={t.toUnit}
          onUnit={setTo}
          options={options}
        />
      </div>

      <div className="flex min-h-9 items-center justify-between gap-3 pl-1">
        <p className="tabular min-w-0 text-[0.9375rem] break-words text-fg-2" aria-live="polite">
          {error ? <span className="text-err">{error}</span> : sentence}
        </p>
        <CopyButton value={bShown} label={t.copy} copiedLabel={t.copied} variant="ghost" size="icon-sm" className="shrink-0" />
      </div>

      {aNum !== null && units.length > 2 && (
        <Fold
          title={
            <span className="tabular font-medium">
              {fmt(aNum)} {unitText(aNum, uFrom)} {t.all}
            </span>
          }
          bodyClassName="px-0! pb-1! pt-0!"
        >
          <ul className="rows border-t border-line">
            {units
              .filter((u) => u.slug !== uFrom.slug)
              .map((u) => {
                const v = convert(aNum, uFrom, u);
                return (
                  <li key={u.slug}>
                    <span className="min-w-0 text-sm text-fg-3">{u.label}</span>
                    <span className="tabular ml-auto text-right text-[0.9375rem] font-medium text-fg">
                      {fmt(v)} <span className="font-normal text-fg-3">{unitText(v, u)}</span>
                    </span>
                  </li>
                );
              })}
          </ul>
        </Fold>
      )}
    </div>
  );
}

function UnitBox({
  id,
  value,
  invalid,
  onValue,
  valueLabel,
  unit,
  unitLabel,
  onUnit,
  options,
  primary,
}: {
  id: string;
  value: string;
  invalid: boolean;
  onValue: (v: string) => void;
  valueLabel: string;
  unit: string;
  unitLabel: string;
  onUnit: (slug: string) => void;
  options: ReactNode;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[1.25rem] px-3 pt-3 pb-4 ring-inset transition-shadow focus-within:ring-2 focus-within:ring-accent sm:px-4",
        primary ? "bg-accent-soft" : "bg-surface shadow-card",
        invalid && "ring-2 ring-err! focus-within:ring-err",
      )}
    >
      <Select id={`${id}-u`} aria-label={unitLabel} value={unit} onChange={(e) => onUnit(e.target.value)} variant="tonal" fit="selected" size="lg" className="max-w-full">
        {options}
      </Select>
      <input
        id={`${id}-v`}
        aria-label={valueLabel}
        aria-invalid={invalid}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onValue(e.target.value)}
        className={cn(
          "tabular mt-1.5 block w-full min-w-0 bg-transparent px-1 text-[2.25rem] leading-[1.2] font-semibold tracking-tight outline-none sm:text-[2.75rem] 2xl:text-[3.25rem]",
          primary ? "text-accent" : "text-fg",
        )}
      />
    </div>
  );
}
