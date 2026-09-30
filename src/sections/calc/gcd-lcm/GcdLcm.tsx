"use client";

import { useId } from "react";
import { Field, Input } from "@/ui/field";
import type { ToolProps } from "../../types";
import { factorText, fmtBig } from "../bigint/format";
import { babs, factorize, gcd, gcdMany, gcdSteps, lcm, lcmMany, parseIntList } from "../bigint/nt";
import { CalcGrid, DataTable, Explain, ResultMain, Stack, SubHeading, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

const T = {
  ru: {
    numbers: "Целые числа",
    hint: "Через пробел, запятую или с новой строки — от двух до сотни чисел любой длины",
    gcd: "НОД",
    lcm: "НОК",
    gcdLong: "Наибольший общий делитель",
    lcmLong: "Наименьшее общее кратное",
    enter: "Введите хотя бы два целых числа",
    invalid: (x: string) => `Не целые числа: ${x}`,
    coprime: "числа взаимно просты",
    steps: "Алгоритм Евклида",
    pair: (a: string, b: string, g: string) => `НОД(${a}, ${b}) = ${g}`,
    lcmStep: (a: string, b: string, g: string, l: string) => `НОК(${a}, ${b}) = ${a} × ${b} / ${g} = ${l}`,
    factors: "Разложение на простые множители",
    number: "Число",
    factor: "Множители",
  },
  en: {
    numbers: "Integers",
    hint: "Separated by spaces, commas or new lines — two to a hundred numbers of any length",
    gcd: "GCD",
    lcm: "LCM",
    gcdLong: "Greatest common divisor",
    lcmLong: "Least common multiple",
    enter: "Enter at least two integers",
    invalid: (x: string) => `Not integers: ${x}`,
    coprime: "the numbers are coprime",
    steps: "Euclid's algorithm",
    pair: (a: string, b: string, g: string) => `GCD(${a}, ${b}) = ${g}`,
    lcmStep: (a: string, b: string, g: string, l: string) => `LCM(${a}, ${b}) = ${a} × ${b} / ${g} = ${l}`,
    factors: "Prime factorization",
    number: "Number",
    factor: "Factors",
  },
} as const;

export default function GcdLcm({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ n: "48 180 240" }, { maxLength: 3000 });
  const { values: all, invalid } = parseIntList(q.v.n);
  const values = all.slice(0, 100);
  const ok = values.length >= 2;
  const g = ok ? gcdMany(values) : null;
  const l = ok ? lcmMany(values) : null;
  const f = (x: bigint) => fmtBig(locale, x);

  // Euclid steps for the chain gcd(gcd(a, b), c)…
  const lines: string[] = [];
  const notes: string[] = [];
  if (ok) {
    let acc = babs(values[0]);
    for (let i = 1; i < values.length && lines.length < 60; i++) {
      const r = gcdSteps(acc, values[i]);
      for (const s of r.steps) lines.push(`${f(s.a)} = ${f(s.b)} × ${f(s.q)} + ${f(s.r)}`);
      notes.push(t.pair(f(acc), f(babs(values[i])), f(r.gcd)));
      acc = r.gcd;
    }
    let lc = babs(values[0]);
    for (let i = 1; i < values.length && i < 12; i++) {
      const gg = gcd(lc, values[i]);
      const next = lcm(lc, values[i]);
      notes.push(t.lcmStep(f(lc), f(babs(values[i])), f(gg), f(next)));
      lc = next;
    }
  }
  const small = values.filter((v) => babs(v) > 1n && babs(v) < 10n ** 18n).slice(0, 12);

  return (
    <Stack>
      <CalcGrid
        inputs={
          <Field label={t.numbers} htmlFor={`${id}-n`} hint={t.hint} error={invalid.length ? t.invalid(invalid.slice(0, 6).join(", ")) : undefined}>
            <Input id={`${id}-n`} value={q.v.n} onChange={(e) => q.set({ n: e.target.value })} size="lg" className="tabular" autoComplete="off" spellCheck={false} inputMode="numeric" />
          </Field>
        }
        result={
          <ResultMain
            label={t.gcdLong}
            value={g !== null ? f(g) : "—"}
            sub={g === 1n ? t.coprime : ok ? `${t.lcm} = ${f(l!)}` : t.enter}
            rows={ok ? [{ label: t.lcmLong, value: <span className="break-all">{f(l!)}</span> }] : undefined}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {small.length > 0 && (
        <section>
          <SubHeading>{t.factors}</SubHeading>
          <DataTable caption={t.factors} head={[t.number, t.factor]} align={["left", "left"]} rows={small.map((v) => [f(babs(v)), factorText(factorize(v))])} />
        </section>
      )}
      {lines.length > 0 && <Explain locale={locale} title={t.steps} formula={lines} notes={notes} />}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["НОД(a, b) = НОД(b, a mod b), НОД(a, 0) = a", "НОК(a, b) = a × b / НОД(a, b)", "НОД(a, b, c) = НОД(НОД(a, b), c)"]}
          notes={["Алгоритм Евклида делит большее число на меньшее и продолжает с остатком, пока остаток не станет нулём; последний ненулевой остаток — НОД.", "Числа могут быть любой длины: вычисления идут с целыми числами произвольной точности (BigInt)."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["gcd(a, b) = gcd(b, a mod b), gcd(a, 0) = a", "lcm(a, b) = a × b / gcd(a, b)", "gcd(a, b, c) = gcd(gcd(a, b), c)"]}
          notes={["Euclid's algorithm divides the larger number by the smaller and continues with the remainder until it is zero; the last non-zero remainder is the GCD.", "Numbers can be of any length: the arithmetic uses arbitrary-precision integers (BigInt)."]}
        />
      )}
    </Stack>
  );
}
