"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import type { ToolProps } from "../../types";
import { approximate, decimalExpansion, isInt, parseQ, toMixed, toNumber, toText, type Q } from "../algebra/rational";
import { CalcGrid, Explain, FieldRow, NumField, ResultMain, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";
import { FRAC_OPS, operate, simplifySteps, type FracOp, type Step } from "./engine";

const MODES = ["calc", "simplify", "decimal"] as const;
type Mode = (typeof MODES)[number];

const T = {
  ru: {
    modes: { calc: "Действия с дробями", simplify: "Сокращение", decimal: "Десятичная ↔ обычная" } satisfies Record<Mode, string>,
    modeLabel: "Режим",
    a: "Первая дробь",
    b: "Вторая дробь",
    op: "Действие",
    hint: "Например: 3/4, 1 2/3, −5/6, 0,25",
    frac: "Дробь",
    dec: "Десятичная дробь",
    decHint: "Например: 0,125 или 0,(3) — период в скобках",
    result: "Ответ",
    mixed: "Смешанное число",
    decimal: "Десятичная запись",
    improper: "Неправильная дробь",
    enter: "Введите дроби",
    bad: "Не удалось прочитать число",
    div0: "На ноль делить нельзя",
    steps: "Решение по шагам",
    step: {
      lcm: (n?: string) => `Приводим к общему знаменателю — наименьшему общему кратному знаменателей: ${n}`,
      expand: () => "Домножаем числители",
      combine: () => "Складываем или вычитаем числители",
      multiply: () => "Перемножаем числители и знаменатели",
      flip: () => "Деление заменяем умножением на перевёрнутую дробь",
      simplify: (n?: string) => `Сокращаем на НОД = ${n}`,
      done: () => "",
    } satisfies Record<Step["kind"], (n?: string) => string>,
    gcd: (g: string) => `НОД числителя и знаменателя = ${g}`,
    already: "Дробь уже несократима",
    period: "в скобках — повторяющийся период",
  },
  en: {
    modes: { calc: "Fraction arithmetic", simplify: "Simplify", decimal: "Decimal ↔ fraction" } satisfies Record<Mode, string>,
    modeLabel: "Mode",
    a: "First fraction",
    b: "Second fraction",
    op: "Operation",
    hint: "For example: 3/4, 1 2/3, −5/6, 0.25",
    frac: "Fraction",
    dec: "Decimal",
    decHint: "For example: 0.125 or 0.(3) — the repeating part in brackets",
    result: "Answer",
    mixed: "Mixed number",
    decimal: "Decimal",
    improper: "Improper fraction",
    enter: "Enter the fractions",
    bad: "Could not read the number",
    div0: "Division by zero",
    steps: "Step by step",
    step: {
      lcm: (n?: string) => `Find the common denominator — the least common multiple of the denominators: ${n}`,
      expand: () => "Scale the numerators",
      combine: () => "Add or subtract the numerators",
      multiply: () => "Multiply numerators and denominators",
      flip: () => "Division is multiplication by the reciprocal",
      simplify: (n?: string) => `Simplify by the GCD = ${n}`,
      done: () => "",
    } satisfies Record<Step["kind"], (n?: string) => string>,
    gcd: (g: string) => `GCD of numerator and denominator = ${g}`,
    already: "The fraction is already in lowest terms",
    period: "the repeating part is in brackets",
  },
} as const;

/** Stacked fraction: −1 ²⁄₃ rendered as whole + numerator over denominator. */
function FracView({ v, mixed = false }: { v: Q; mixed?: boolean }) {
  if (isInt(v)) return <span>{toText(v)}</span>;
  const m = toMixed(v);
  const num = mixed ? m.num : m.whole * m.den + m.num;
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {m.negative && <span>−</span>}
      {mixed && m.whole > 0n && <span>{m.whole.toString()}</span>}
      <span className="inline-flex flex-col items-center leading-none">
        <span className="px-1 pb-1">{num.toString()}</span>
        <span className="w-full border-t-2 border-current px-1 pt-1">{m.den.toString()}</span>
      </span>
    </span>
  );
}

function decText(locale: Locale, v: Q): string {
  const e = decimalExpansion(v, 60);
  const sep = locale === "ru" ? "," : ".";
  const sign = e.negative ? "−" : "";
  if (!e.fixed && !e.repeat) return `${sign}${e.int}`;
  return `${sign}${e.int}${sep}${e.fixed}${e.repeat ? `(${e.repeat})` : e.truncated ? "…" : ""}`;
}

const mixedText = (v: Q) => {
  const m = toMixed(v);
  if (m.num === 0n || m.whole === 0n) return toText(v);
  return `${m.negative ? "−" : ""}${m.whole} ${m.num}/${m.den}`;
};

export default function Fractions({ locale, mode = "calc" }: ToolProps<{ mode?: Mode }>) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState({ m: mode, a: "1/2", o: "+", b: "1/3", s: "42/56", d: ru ? "0,125" : "0.125" }, { enums: { m: MODES, o: FRAC_OPS } });
  const m = q.v.m as Mode;
  const op = q.v.o as FracOp;

  let value: Q | null = null;
  let steps: Step[] = [];
  let error: string | undefined;
  let lines: string[] = [];

  const A = parseQ(q.v.a);
  const B = parseQ(q.v.b);
  const S = parseQ(q.v.s);
  const D = parseQ(q.v.d);
  if (m === "calc") {
    if (A && B) {
      if (op === "/" && B.n === 0n) error = t.div0;
      else {
        const r = operate(A, op, B);
        value = r.result;
        steps = r.steps;
      }
    }
  } else if (m === "simplify") {
    const raw = /^\s*[-−]?\d+\s*\/\s*\d+\s*$/.test(q.v.s) ? q.v.s.replace(/\s/g, "").replace("−", "-").split("/") : null;
    if (S) {
      value = S;
      if (raw && BigInt(raw[1]) !== 0n) {
        const { gcd } = simplifySteps(BigInt(raw[0]), BigInt(raw[1]));
        lines = gcd > 1n ? [t.gcd(gcd.toString()), `${raw[0]}/${raw[1]} = ${toText(S)}`] : [t.already];
      }
    }
  } else if (D) {
    value = D;
    lines = [`${q.v.d.trim()} = ${toText(D)}`];
  } else if (q.v.d.trim()) {
    const x = Number(q.v.d.replace(",", "."));
    if (Number.isFinite(x)) value = approximate(x);
  }
  const bad = (text: string, parsed: Q | null) => (text.trim() && !parsed ? t.bad : undefined);

  const inputs =
    m === "calc" ? (
      <>
        <FieldRow>
          <NumField id={`${id}-a`} label={t.a} value={q.v.a} onChange={(a) => q.set({ a })} inputMode="text" error={bad(q.v.a, A)} size="lg" />
          <NumField id={`${id}-b`} label={t.b} value={q.v.b} onChange={(b) => q.set({ b })} inputMode="text" error={bad(q.v.b, B) ?? error} size="lg" />
        </FieldRow>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg-2">{t.op}</span>
          <Segmented
            label={t.op}
            value={op}
            onChange={(o) => q.set({ o })}
            options={[
              { value: "+", label: "+" },
              { value: "-", label: "−" },
              { value: "*", label: "×" },
              { value: "/", label: "÷" },
            ]}
          />
        </div>
        <p className="text-[0.8125rem] text-fg-3">{t.hint}</p>
      </>
    ) : m === "simplify" ? (
      <NumField id={`${id}-s`} label={t.frac} hint={t.hint} value={q.v.s} onChange={(s) => q.set({ s })} inputMode="text" error={bad(q.v.s, S)} size="lg" />
    ) : (
      <NumField id={`${id}-d`} label={t.dec} hint={t.decHint} value={q.v.d} onChange={(d) => q.set({ d })} inputMode="text" error={q.v.d.trim() && !value ? t.bad : undefined} size="lg" />
    );

  const rows = value
    ? [
        ...(!isInt(value) && toMixed(value).whole > 0n ? [{ label: t.mixed, value: mixedText(value) }] : []),
        { label: t.improper, value: toText(value) },
        { label: t.decimal, value: decText(locale, value), hint: decimalExpansion(value, 60).repeat ? t.period : undefined },
      ]
    : undefined;

  return (
    <Stack>
      <div className="flex flex-col gap-4">
        <Tabs label={t.modeLabel} value={m} onChange={(v) => q.set({ m: v })} items={MODES.map((x) => ({ value: x, label: t.modes[x] }))} />
        <CalcGrid
          inputs={inputs}
          result={
            <ResultMain
              label={t.result}
              value={value ? <FracView v={value} mixed /> : "—"}
              sub={value ? `≈ ${toNumber(value).toLocaleString(ru ? "ru-RU" : "en-US", { maximumFractionDigits: 10 })}` : (error ?? t.enter)}
              rows={rows}
              actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
            />
          }
        />
      </div>
      {(steps.length > 0 || lines.length > 0) && (
        <Explain
          locale={locale}
          title={t.steps}
          formula={[...steps.map((s) => s.math), ...lines]}
          notes={steps.map((s) => t.step[s.kind](s.n)).filter(Boolean)}
        />
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["a/b + c/d = (a·d + c·b) / (b·d), затем сокращение", "a/b × c/d = (a·c) / (b·d)", "a/b ÷ c/d = a/b × d/c"]}
          notes={[
            "Смешанное число вводится через пробел: 1 2/3 = 5/3. Десятичные дроби — с запятой или точкой.",
            "Периодическая дробь записывается с периодом в скобках: 0,(3) = 1/3, 1,2(34) = 611/495.",
            "Все вычисления точные: числитель и знаменатель могут быть сколь угодно большими.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["a/b + c/d = (a·d + c·b) / (b·d), then simplify", "a/b × c/d = (a·c) / (b·d)", "a/b ÷ c/d = a/b × d/c"]}
          notes={[
            "Enter mixed numbers with a space: 1 2/3 = 5/3. Decimals use a point.",
            "Write repeating decimals with the period in brackets: 0.(3) = 1/3, 1.2(34) = 611/495.",
            "All calculations are exact: numerators and denominators can be arbitrarily large.",
          ]}
        />
      )}
    </Stack>
  );
}
