"use client";

import { useId, type ReactNode } from "react";
import type { ToolProps } from "../../../types";
import { fmtBig } from "../bigint/format";
import { fmtN } from "../../shared/fmt";
import { field } from "../../shared/num";
import { CalcGrid, Explain, FieldRow, InlineToggle, NumField, OptionsRow, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { exactPower, logBase, nthRoot, simplifyRadical } from "./engine";

type Mode = "root" | "power" | "log";

const T = {
  ru: {
    x: "Число x",
    n: "Степень корня n",
    base: "Основание a",
    exp: "Показатель b",
    logX: "Число x",
    logBase: "Основание",
    customBase: "Своё основание",
    root: (n: string) => (n === "2" ? "Квадратный корень" : n === "3" ? "Кубический корень" : `Корень ${n}-й степени`),
    power: "Степень",
    log: (b: string) => `Логарифм по основанию ${b}`,
    exact: "Упрощённый вид",
    digits: (d: number) => `${d} цифр`,
    square: "Квадрат корня (проверка)",
    enter: "Введите числа",
    undefinedRoot: "Корень чётной степени из отрицательного числа не определён среди действительных чисел",
    undefinedLog: "Логарифм определён для x > 0 и основания a > 0, a ≠ 1",
    ln: "Натуральный ln x",
    lg: "Десятичный lg x",
    log2: "Двоичный log₂ x",
    scientific: "В научной записи",
    inverse: (v: string) => `обратная величина: ${v}`,
  },
  en: {
    x: "Number x",
    n: "Root degree n",
    base: "Base a",
    exp: "Exponent b",
    logX: "Number x",
    logBase: "Base",
    customBase: "Custom base",
    root: (n: string) => (n === "2" ? "Square root" : n === "3" ? "Cube root" : `${n}th root`),
    power: "Power",
    log: (b: string) => `Logarithm base ${b}`,
    exact: "Simplified form",
    digits: (d: number) => `${d} digits`,
    square: "Check (root raised to n)",
    enter: "Enter the numbers",
    undefinedRoot: "An even root of a negative number is not a real number",
    undefinedLog: "The logarithm is defined for x > 0 and base a > 0, a ≠ 1",
    ln: "Natural ln x",
    lg: "Common log₁₀ x",
    log2: "Binary log₂ x",
    scientific: "Scientific notation",
    inverse: (v: string) => `reciprocal: ${v}`,
  },
} as const;

const BASES = ["10", "e", "2", "custom"] as const;

export default function Rpl({ locale, mode = "root" }: ToolProps<{ mode?: Mode }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ x: mode === "log" ? "1000" : "72", n: "2", a: "2", b: "10", lb: "10", cb: "3" }, { enums: { lb: BASES } });
  const f = (v: number) => fmtN(locale, v, 10);

  let label = "";
  let value = "—";
  let sub: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  let inputs: ReactNode = null;

  if (mode === "root") {
    const X = field(locale, q.v.x);
    const N = field(locale, q.v.n, { min: 2, max: 100, int: true });
    label = t.root(q.v.n.trim() || "n");
    if (X.value !== null && N.value !== null) {
      const r = nthRoot(X.value, N.value);
      if (Number.isNaN(r)) sub = t.undefinedRoot;
      else {
        value = f(r);
        const simp = simplifyRadical(Math.abs(X.value), N.value);
        const sign = X.value < 0 ? "−" : "";
        const rad = N.value === 2 ? "√" : `${"⁰¹²³⁴⁵⁶⁷⁸⁹"[N.value] ?? ""}√`;
        sub = `${rad}${f(X.value)} = ${f(r)}`;
        rows = [
          ...(simp && simp.inside !== 1n && simp.outside !== 1n ? [{ label: t.exact, value: `${sign}${simp.outside}${rad}${simp.inside}` }] : []),
          { label: t.square, value: `${f(r)}^${N.value} = ${f(Math.pow(r, N.value))}` },
        ];
      }
    }
    inputs = (
      <FieldRow>
        <NumField id={`${id}-x`} label={t.x} value={q.v.x} onChange={(x) => q.set({ x })} error={X.message} size="lg" />
        <NumField id={`${id}-n`} label={t.n} value={q.v.n} onChange={(n) => q.set({ n })} error={N.message} inputMode="numeric" size="lg" />
      </FieldRow>
    );
  } else if (mode === "power") {
    const A = field(locale, q.v.a);
    const B = field(locale, q.v.b);
    label = t.power;
    if (A.value !== null && B.value !== null) {
      const exact = exactPower(A.value, B.value);
      const approx = Math.pow(A.value, B.value);
      if (exact !== null) {
        const s = exact.toString();
        value = s.length <= 60 ? fmtBig(locale, exact) : `${s.slice(0, 30)}…`;
        sub = `${f(A.value)}^${f(B.value)}${s.length > 15 ? ` · ${t.digits(s.replace("-", "").length)}` : ""}`;
        rows = s.length > 15 && Number.isFinite(approx) ? [{ label: t.scientific, value: approx.toExponential(8).replace("e+", " × 10^").replace("e-", " × 10^−").replace(".", locale === "ru" ? "," : ".") }] : undefined;
      } else if (Number.isFinite(approx)) {
        value = f(approx);
        sub = `${f(A.value)}^${f(B.value)}`;
        rows = B.value < 0 && approx !== 0 ? [{ label: "1 / x", value: f(1 / approx) }] : undefined;
      } else sub = Number.isNaN(approx) ? t.undefinedRoot : "∞";
    }
    inputs = (
      <FieldRow>
        <NumField id={`${id}-a`} label={t.base} value={q.v.a} onChange={(a) => q.set({ a })} error={A.message} size="lg" />
        <NumField id={`${id}-b`} label={t.exp} value={q.v.b} onChange={(b) => q.set({ b })} error={B.message} size="lg" />
      </FieldRow>
    );
  } else {
    const X = field(locale, q.v.x);
    const CB = field(locale, q.v.cb, { gt: 0 });
    const baseKey = q.v.lb as (typeof BASES)[number];
    const base = baseKey === "e" ? Math.E : baseKey === "custom" ? CB.value : Number(baseKey);
    const baseText = baseKey === "e" ? "e" : baseKey === "custom" ? q.v.cb : baseKey;
    label = t.log(baseText);
    if (X.value !== null && base !== null) {
      const r = logBase(X.value, base);
      if (Number.isNaN(r)) sub = t.undefinedLog;
      else {
        value = f(r);
        sub = `${baseText}^${f(r)} = ${f(X.value)}`;
        rows = [
          { label: t.ln, value: f(logBase(X.value, Math.E)) },
          { label: t.lg, value: f(logBase(X.value, 10)) },
          { label: t.log2, value: f(logBase(X.value, 2)) },
        ];
      }
    }
    inputs = (
      <>
        <NumField id={`${id}-x`} label={t.logX} value={q.v.x} onChange={(x) => q.set({ x })} error={X.message} size="lg" />
        <OptionsRow>
          <InlineToggle
            label={t.logBase}
            showLabel
            value={baseKey}
            onChange={(lb) => q.set({ lb })}
            options={[
              { value: "10", label: "10" },
              { value: "e", label: "e" },
              { value: "2", label: "2" },
              { value: "custom", label: "a" },
            ]}
          />
        </OptionsRow>
        {baseKey === "custom" && <NumField id={`${id}-cb`} label={t.customBase} value={q.v.cb} onChange={(cb) => q.set({ cb })} error={CB.message} />}
      </>
    );
  }

  const ru = locale === "ru";
  const formulas: Record<Mode, string[]> = {
    root: ["ⁿ√x = x^(1/n)", "√(a²·b) = a·√b, например √72 = √(36·2) = 6√2", ru ? "корень нечётной степени из отрицательного числа: ³√−8 = −2" : "odd roots of negatives: ³√−8 = −2"],
    power: [ru ? "aᵇ = a · a · … · a (b раз)" : "aᵇ = a · a · … · a (b times)", "a⁻ᵇ = 1 / aᵇ,  a^(1/n) = ⁿ√a", "a⁰ = 1"],
    log: ["logₐ x = y  ⇔  aʸ = x", "logₐ x = ln x / ln a", "lg x = log₁₀ x,  ln x = logₑ x"],
  };
  const notes: Record<Mode, string[]> = ru
    ? {
        root: ["Для целых чисел показывается упрощённый вид корня — вынесение множителя из-под знака корня.", "Квадратный корень из отрицательного числа не существует среди действительных чисел."],
        power: ["Целые степени целых чисел считаются точно, без округления, даже если в ответе тысячи цифр.", "Дробный показатель означает корень: 8^(1/3) = 2."],
        log: ["Логарифм отвечает на вопрос «в какую степень нужно возвести основание, чтобы получить x»: log₂ 8 = 3.", "Логарифм по любому основанию выражается через натуральный: logₐ x = ln x / ln a."],
      }
    : {
        root: ["For whole numbers the simplified radical is shown — factors are taken out of the root.", "The square root of a negative number is not a real number."],
        power: ["Whole-number powers of integers are exact, with no rounding, even with thousands of digits.", "A fractional exponent is a root: 8^(1/3) = 2."],
        log: ["A logarithm answers 'to what power must the base be raised to get x': log₂ 8 = 3.", "Any base can be expressed through the natural log: logₐ x = ln x / ln a."],
      };

  return (
    <Stack>
      <CalcGrid inputs={inputs} result={<ResultMain label={label} value={<span className="break-all">{value}</span>} sub={sub} rows={rows} actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />} />} />
      <Explain locale={locale} formula={formulas[mode]} notes={notes[mode]} />
    </Stack>
  );
}
