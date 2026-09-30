"use client";

import { ArrowLeftRight } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { BaseSteps } from "./BaseSteps";
import { baseName, baseShort, baseTitle, digitRange, readAs } from "./base-names";
import { formatBase, formattedText, fromTwos, groupDigits, groupFrac, parseBase, signedRange, signedValue, toTwos, type Formatted } from "./bases";
import { Details } from "./ui-bits";

export interface BaseConverterProps {
  locale: Locale;
  from?: number;
  to?: number;
  value?: string;
}

const T = {
  ru: {
    number: "Число",
    from: "Из системы",
    to: "В систему",
    swap: "Поменять системы местами",
    upper: "Заглавные A–F",
    group: "Группы цифр",
    twos: "Доп. код",
    off: "нет",
    signed: "Знаковое значение",
    pattern: (b: number) => `${b} бит, двоичный`,
    hexPattern: (b: number) => `${b} бит, шестнадцатеричный`,
    range: (b: number, lo: string, hi: string) => `Дополнительный код, ${b} бит: диапазон ${lo} … ${hi}.`,
    outOfRange: (b: number, lo: string, hi: string) => `Не помещается в ${b} бит со знаком (${lo} … ${hi}).`,
    tooWide: (b: number) => `Битовая строка длиннее ${b} бит.`,
    patternNote: "Ввод прочитан как битовая комбинация в дополнительном коде.",
    fracTwos: "Дополнительный код строится только для целых чисел.",
    period: "Цифры под чертой повторяются бесконечно.",
    truncated: (n: number) => `Дробь бесконечная — показаны первые ${n} знаков.`,
    prefix: (p: string, as: string) => `Префикс ${p}: число прочитано ${as}.`,
    errDigit: (c: string, base: number) => `«${c}» — не цифра системы с основанием ${base} (допустимы ${digitRange(base)}).`,
    errFormat: "В числе несколько разделителей дробной части.",
    errLong: "Слишком длинное число: не больше 4096 цифр.",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    number: "Number",
    from: "From base",
    to: "To base",
    swap: "Swap bases",
    upper: "Uppercase A–F",
    group: "Digit groups",
    twos: "Two's compl.",
    off: "off",
    signed: "Signed value",
    pattern: (b: number) => `${b}-bit binary`,
    hexPattern: (b: number) => `${b}-bit hex`,
    range: (b: number, lo: string, hi: string) => `Two's complement, ${b} bits: range ${lo} … ${hi}.`,
    outOfRange: (b: number, lo: string, hi: string) => `Doesn't fit in a signed ${b}-bit integer (${lo} … ${hi}).`,
    tooWide: (b: number) => `The bit pattern is wider than ${b} bits.`,
    patternNote: "The input is read as a two's complement bit pattern.",
    fracTwos: "Two's complement applies to whole numbers only.",
    period: "Digits under the bar repeat forever.",
    truncated: (n: number) => `The fraction doesn't terminate — the first ${n} digits are shown.`,
    prefix: (p: string, as: string) => `Prefix ${p}: the number is read ${as}.`,
    errDigit: (c: string, base: number) => `“${c}” is not a digit in base ${base} (allowed: ${digitRange(base)}).`,
    errFormat: "The number has more than one fraction separator.",
    errLong: "The number is too long: at most 4096 digits.",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const ALL_BASES = Array.from({ length: 35 }, (_, i) => i + 2);
const MAIN_BASES = [2, 8, 10, 16];
const BITS = ["off", "8", "16", "32", "64"] as const;
type BitsOpt = (typeof BITS)[number];
const MAX_FRAC = 32;

const groupSize = (base: number) => (base === 10 || base === 8 ? 3 : 4);

function groupedText(f: Formatted, base: number, group: boolean): string {
  if (!group) return formattedText(f);
  const g = groupSize(base);
  const frac = f.frac || f.repeat ? `.${groupFrac(f.frac, g)}${f.repeat ? `(${f.repeat})` : ""}` : "";
  return (f.neg ? "-" : "") + groupDigits(f.int, g) + frac + (f.truncated ? "…" : "");
}

function FormattedView({ f, base, group }: { f: Formatted; base: number; group: boolean }) {
  const g = groupSize(base);
  return (
    <span className="font-mono break-all">
      {f.neg && "−"}
      {group ? groupDigits(f.int, g) : f.int}
      {(f.frac || f.repeat) && "."}
      {group ? groupFrac(f.frac, g) : f.frac}
      {f.repeat && <span className="overline decoration-2">{f.repeat}</span>}
      {f.truncated && "…"}
    </span>
  );
}

export default function BaseConverter({ locale, from: from0 = 10, to: to0 = 2, value = "42" }: BaseConverterProps) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(to0);
  const [upper, setUpper] = useState(true);
  const [group, setGroup] = useState(false);
  const [bits, setBits] = useState<BitsOpt>("off");

  const p = parseBase(text, from);
  let error: string | null = null;
  if (!p.ok) {
    if (p.error === "digit") error = t.errDigit(p.char ?? "?", p.base);
    else if (p.error === "format") error = t.errFormat;
    else if (p.error === "too-long") error = t.errLong;
  }
  const out = p.ok ? formatBase(p.value, to, MAX_FRAC, upper) : null;
  const others = p.ok ? [...new Set([...MAIN_BASES, 36])].filter((b) => b !== to && b !== p.base).map((b) => ({ b, f: formatBase(p.value, b, MAX_FRAC, upper) })) : [];

  // Two's complement
  const nBits = bits === "off" ? 0 : Number(bits);
  let twos: { signed: bigint; pattern: bigint; note?: string } | null = null;
  let twosError: string | null = null;
  if (p.ok && nBits) {
    const [lo, hi] = signedRange(nBits);
    if (p.value.num !== 0n) twosError = t.fracTwos;
    else if (p.base === 10 || p.value.neg) {
      const v = signedValue(p.value);
      const pat = toTwos(v, nBits);
      if (pat === null) twosError = t.outOfRange(nBits, lo.toString(), hi.toString());
      else twos = { signed: v, pattern: pat };
    } else {
      const s = fromTwos(p.value.int, nBits);
      if (s === null) twosError = t.tooWide(nBits);
      else twos = { signed: s, pattern: p.value.int, note: t.patternNote };
    }
  }

  function swap() {
    if (out) {
      const digits = out.frac + (out.repeat ? out.repeat.repeat(Math.ceil(MAX_FRAC / out.repeat.length)) : "");
      const f = digits.slice(0, MAX_FRAC);
      setText((out.neg ? "-" : "") + out.int + (f ? `.${f}` : ""));
    }
    setFrom(to);
    setTo(p.ok ? p.base : from);
  }

  const baseOptions = ALL_BASES.map((b) => (
    <option key={b} value={b}>
      {baseShort(b, locale)}
    </option>
  ));
  const hex = (x: bigint, n: number) => {
    const h = x.toString(16).padStart(n / 4, "0");
    return upper ? h.toUpperCase() : h;
  };

  const detailRows = [
    ...others.map(({ b, f }) => ({ key: `b${b}`, label: baseTitle(b, locale), value: groupedText(f, b, group), view: <FormattedView f={f} base={b} group={group} />, mono: true })),
    ...(twos
      ? [
          { key: "ts", label: t.signed, value: twos.signed.toString(), view: twos.signed.toString(), mono: true },
          { key: "tb", label: t.pattern(nBits), value: twos.pattern.toString(2).padStart(nBits, "0"), view: groupDigits(twos.pattern.toString(2).padStart(nBits, "0"), 4), mono: true },
          { key: "th", label: t.hexPattern(nBits), value: hex(twos.pattern, nBits), view: hex(twos.pattern, nBits), mono: true },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="min-w-0">
            <label htmlFor={`${id}-n`} className="text-sm font-medium text-fg-2">
              {t.number}
            </label>
            <Input
              id={`${id}-n`}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              size="lg"
              className="mt-1.5 h-14! font-mono text-2xl!"
              value={text}
              aria-invalid={!!error}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 md:w-[26rem]">
            <div className="min-w-0">
              <label htmlFor={`${id}-f`} className="text-sm font-medium text-fg-2">
                {t.from}
              </label>
              <Select id={`${id}-f`} size="lg" className="mt-1.5" value={from} onChange={(e) => setFrom(Number(e.target.value))}>
                {baseOptions}
              </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={swap} aria-label={t.swap} title={t.swap} className="mb-1">
              <ArrowLeftRight />
            </Button>
            <div className="min-w-0">
              <label htmlFor={`${id}-t`} className="text-sm font-medium text-fg-2">
                {t.to}
              </label>
              <Select id={`${id}-t`} size="lg" className="mt-1.5" value={to} onChange={(e) => setTo(Number(e.target.value))}>
                {baseOptions}
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-5 min-h-16" aria-live="polite">
          {error ? (
            <p className="text-[0.9375rem] text-err">{error}</p>
          ) : out ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-3xl leading-tight font-semibold text-fg sm:text-4xl">
                  <FormattedView f={out} base={to} group={group} />
                  <sub className="ml-1 font-sans text-base font-normal text-fg-3">{to}</sub>
                </div>
                <p className="mt-1 text-sm text-fg-3">
                  {baseName(to, locale)}
                  {p.ok && p.prefix ? ` · ${t.prefix(p.prefix, readAs(p.base, locale))}` : ""}
                  {out.repeat ? ` · ${t.period}` : ""}
                  {out.truncated ? ` · ${t.truncated(MAX_FRAC)}` : ""}
                </p>
              </div>
              <CopyButton value={groupedText(out, to, group)} label={t.copy} copiedLabel={t.copied} className="shrink-0 self-start" />
            </div>
          ) : null}
        </div>

        {detailRows.length > 0 && (
          <div className="mt-3">
            <Details rows={detailRows} label={t.copy} copiedLabel={t.copied} />
          </div>
        )}
        {nBits > 0 && p.ok && <p className="mt-2 text-sm text-fg-3">{twosError ?? `${twos?.note ? `${twos.note} ` : ""}${t.range(nBits, signedRange(nBits)[0].toString(), signedRange(nBits)[1].toString())}`}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4">
          <Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} className="text-sm!" />
          <Switch label={t.group} checked={group} onChange={(e) => setGroup(e.target.checked)} className="text-sm!" />
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-sm text-fg-2" aria-hidden>
              {t.twos}
            </span>
            <Segmented size="sm" label={t.twos} value={bits} onChange={setBits} options={BITS.map((b) => ({ value: b, label: b === "off" ? t.off : b }))} />
          </div>
        </div>
      </Panel>

      {p.ok && !p.hasFrac && <BaseSteps locale={locale} value={p.value.int} from={p.base} to={to} upper={upper} />}
    </div>
  );
}
