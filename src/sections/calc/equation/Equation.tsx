"use client";

import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { Tabs } from "@/ui/tabs";
import type { ToolProps } from "../../types";
import { complexText, cubic, linear, num, poly, quadratic, type Complex } from "../algebra/poly";
import { parseQ, toNumber, toText, type Q } from "../algebra/rational";
import { solveSystem } from "../algebra/system";
import { Explain, ResultMain, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

export const EQ_MODES = ["linear", "quadratic", "cubic", "system-2x2", "system-3x3"] as const;
export type EqMode = (typeof EQ_MODES)[number];

const T = {
  ru: {
    modes: { linear: "Линейное", quadratic: "Квадратное", cubic: "Кубическое", "system-2x2": "Система 2×2", "system-3x3": "Система 3×3" } satisfies Record<EqMode, string>,
    modeLabel: "Тип уравнения",
    coef: (n: string) => `Коэффициент ${n}`,
    roots: "Корни",
    root: "Корень",
    solution: "Решение",
    noSolution: "Нет решений",
    anyX: "x — любое число",
    infinite: "Бесконечно много решений",
    enter: "Введите коэффициенты",
    bad: "Проверьте коэффициенты: допустимы числа и дроби (1/2)",
    notQuad: "a = 0 — это линейное уравнение",
    notCubic: "a = 0 — уравнение не кубическое, решите его как квадратное",
    exact: "Точная запись",
    D: "Дискриминант",
    twoReal: "D > 0 — два различных действительных корня",
    oneReal: "D = 0 — один корень (два совпадающих)",
    complexRoots: "D < 0 — действительных корней нет, два комплексно-сопряжённых",
    natures: { "three-real": "Три различных действительных корня", multiple: "Есть кратные корни", "one-real": "Один действительный корень и два комплексных" },
    steps: "Решение по шагам",
    det: "Определитель",
    singular: "Определитель равен нулю — правило Крамера неприменимо",
    eq: "Уравнение",
  },
  en: {
    modes: { linear: "Linear", quadratic: "Quadratic", cubic: "Cubic", "system-2x2": "System 2×2", "system-3x3": "System 3×3" } satisfies Record<EqMode, string>,
    modeLabel: "Equation type",
    coef: (n: string) => `Coefficient ${n}`,
    roots: "Roots",
    root: "Root",
    solution: "Solution",
    noSolution: "No solution",
    anyX: "x can be any number",
    infinite: "Infinitely many solutions",
    enter: "Enter the coefficients",
    bad: "Check the coefficients: numbers and fractions (1/2) are allowed",
    notQuad: "a = 0 — this is a linear equation",
    notCubic: "a = 0 — not a cubic; solve it as a quadratic",
    exact: "Exact form",
    D: "Discriminant",
    twoReal: "D > 0 — two distinct real roots",
    oneReal: "D = 0 — one repeated root",
    complexRoots: "D < 0 — no real roots, two complex conjugate roots",
    natures: { "three-real": "Three distinct real roots", multiple: "Repeated roots", "one-real": "One real root and two complex roots" },
    steps: "Step by step",
    det: "Determinant",
    singular: "The determinant is zero — Cramer's rule does not apply",
    eq: "Equation",
  },
} as const;

const DEFAULTS: Record<EqMode, Record<string, string>> = {
  linear: { a: "2", b: "3", c: "11" },
  quadratic: { a: "1", b: "-3", c: "2" },
  cubic: { a: "1", b: "-6", c: "11", d: "-6" },
  "system-2x2": { a1: "2", b1: "3", c1: "13", a2: "1", b2: "-1", c2: "-1" },
  "system-3x3": { a1: "1", b1: "1", c1: "1", d1: "6", a2: "0", b2: "2", c2: "5", d2: "-4", a3: "2", b3: "5", c3: "-1", d3: "27" },
};

const KEYS = ["a", "b", "c", "d", "a1", "b1", "c1", "d1", "a2", "b2", "c2", "d2", "a3", "b3", "c3", "d3"] as const;

function Coef({ id, label, value, onChange, invalid }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <input
      id={id}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode="text"
      autoComplete="off"
      spellCheck={false}
      aria-invalid={invalid}
      className="control tabular h-11 w-16 px-2 text-center text-lg font-semibold sm:w-20"
    />
  );
}

/** Linear combination with exact coefficients: "2x − y + 3z" (never "+ −"). */
function lin(coeffs: Q[], vars: string[]): string {
  const parts: string[] = [];
  coeffs.forEach((c, i) => {
    if (c.n === 0n) return;
    const neg = c.n < 0n;
    const abs = toText(neg ? { n: -c.n, d: c.d } : c);
    const term = `${abs === "1" ? "" : abs}${vars[i]}`;
    parts.push(parts.length === 0 ? (neg ? `−${term}` : term) : `${neg ? "−" : "+"} ${term}`);
  });
  return parts.length ? parts.join(" ") : "0";
}

const sub = (n: number) => String(n).replace(/\d/g, (c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)]);

export default function Equation({ locale, mode = "quadratic" }: ToolProps<{ mode?: EqMode }>) {
  const t = T[locale];
  const ru = locale === "ru";
  const base: Record<string, string> = { m: mode };
  for (const k of KEYS) base[k] = DEFAULTS[mode][k] ?? "";
  const qs = useQueryState(base as Record<"m" | (typeof KEYS)[number], string>, { enums: { m: EQ_MODES } });
  const m = qs.v.m as EqMode;
  const V = (k: (typeof KEYS)[number]) => qs.v[k];
  const P = (k: (typeof KEYS)[number]): Q | null => (V(k).trim() === "" ? null : parseQ(V(k)));
  const coefField = (k: (typeof KEYS)[number], label: string) => (
    <Coef id={`eq-${k}`} label={t.coef(label)} value={V(k)} onChange={(v) => qs.set({ [k]: v } as never)} invalid={V(k).trim() !== "" && !parseQ(V(k))} />
  );

  function switchMode(next: EqMode) {
    const patch: Record<string, string> = { m: next };
    for (const k of KEYS) patch[k] = DEFAULTS[next][k] ?? "";
    qs.set(patch as never);
  }

  const n = (x: number) => num(locale, x);
  const nz = (x: number) => (x < 0 ? `(${n(x)})` : n(x));
  let value: ReactNode = "—";
  let label: string = t.roots;
  let sub1: string = t.enter;
  let rows: { label: string; value: string }[] | undefined;
  let steps: string[] = [];
  let notes: string[] = [];
  let equation = "";

  const need = (keys: (typeof KEYS)[number][]) => keys.map(P);
  const zs = (zs: Complex[]) => zs.map((z) => complexText(locale, z)).join("; ");

  if (m === "linear") {
    const [a, b, c] = need(["a", "b", "c"]);
    if (a && b && c) {
      const A = toNumber(a), B = toNumber(b), C = toNumber(c);
      equation = `${poly(locale, [A, B])} = ${n(C)}`;
      const r = linear(A, B, C);
      label = t.root;
      if (r.kind === "one") {
        value = `x = ${n(r.x)}`;
        sub1 = equation;
        steps = [`${poly(locale, [A, 0])} = ${n(C)} − ${nz(B)} = ${n(C - B)}`, `x = ${n(C - B)} / ${nz(A)} = ${n(r.x)}`];
      } else {
        value = r.kind === "all" ? t.anyX : t.noSolution;
        sub1 = equation;
        steps = [`0 · x = ${n(C - B)}`];
      }
    }
  } else if (m === "quadratic") {
    const [a, b, c] = need(["a", "b", "c"]);
    if (a && b && c) {
      const A = toNumber(a), B = toNumber(b), C = toNumber(c);
      equation = `${poly(locale, [A, B, C])} = 0`;
      if (A === 0) {
        sub1 = t.notQuad;
        const r = linear(B, C, 0);
        value = r.kind === "one" ? `x = ${n(r.x)}` : r.kind === "all" ? t.anyX : t.noSolution;
      } else {
        const r = quadratic(locale, A, B, C);
        const [x1, x2] = r.roots;
        const same = x1.re === x2.re && x1.im === x2.im;
        value = same ? `x = ${complexText(locale, x1)}` : r.exact && r.D < 0 ? `x = ${r.exact}` : `x₁ = ${complexText(locale, x1)}, x₂ = ${complexText(locale, x2)}`;
        sub1 = r.D > 0 ? t.twoReal : r.D === 0 ? t.oneReal : t.complexRoots;
        rows = [
          { label: `${t.D} D`, value: n(r.D) },
          ...(!same ? [{ label: "x₁", value: complexText(locale, x1) }, { label: "x₂", value: complexText(locale, x2) }] : []),
          ...(r.exact ? [{ label: t.exact, value: `x = ${r.exact}` }] : []),
        ];
        const sq = r.D >= 0 ? n(Math.sqrt(r.D)) : `${n(Math.sqrt(-r.D))}i`;
        steps = [
          equation,
          `D = b² − 4ac = ${nz(B)}² − 4 · ${nz(A)} · ${nz(C)} = ${n(r.D)}`,
          `√D = ${r.D < 0 ? `√(${n(r.D)}) = ` : ""}${sq}`,
          `x = (−b ± √D) / 2a = (${n(-B)} ± ${sq}) / ${nz(2 * A)}`,
          same ? `x = ${complexText(locale, x1)}` : `x₁ = ${complexText(locale, x1)},  x₂ = ${complexText(locale, x2)}`,
        ];
      }
    }
  } else if (m === "cubic") {
    const [a, b, c, d] = need(["a", "b", "c", "d"]);
    if (a && b && c && d) {
      const A = toNumber(a), B = toNumber(b), C = toNumber(c), D = toNumber(d);
      equation = `${poly(locale, [A, B, C, D])} = 0`;
      if (A === 0) {
        sub1 = t.notCubic;
        if (B !== 0) {
          const r = quadratic(locale, B, C, D);
          value = `x = ${zs(r.roots)}`;
        }
      } else {
        const r = cubic(A, B, C, D);
        value = r.roots.map((z, i) => `x${sub(i + 1)} = ${complexText(locale, z)}`).join(", ");
        sub1 = t.natures[r.nature];
        rows = r.roots.map((z, i) => ({ label: `x${sub(i + 1)}`, value: complexText(locale, z) }));
        steps = [
          equation,
          ru ? `Замена x = t ${r.shift < 0 ? "−" : "+"} ${n(Math.abs(r.shift))}: t³ + p·t + q = 0` : `Substitute x = t ${r.shift < 0 ? "−" : "+"} ${n(Math.abs(r.shift))}: t³ + p·t + q = 0`,
          `p = ${n(r.p)},  q = ${n(r.q)}`,
          `Δ = (q/2)² + (p/3)³ = ${n(r.disc)}`,
          ...r.roots.map((z, i) => `x${sub(i + 1)} = ${complexText(locale, z)}`),
        ];
        notes = [ru ? "Δ > 0 — один действительный корень, Δ = 0 — кратные корни, Δ < 0 — три различных действительных (тригонометрическая формула)." : "Δ > 0: one real root; Δ = 0: repeated roots; Δ < 0: three distinct real roots (trigonometric formula)."];
      }
    }
  } else {
    const size = m === "system-2x2" ? 2 : 3;
    const vars = ["x", "y", "z"].slice(0, size);
    const cols = ["a", "b", "c", "d"].slice(0, size + 1);
    const cells = Array.from({ length: size }, (_, i) => cols.map((c) => P(`${c}${i + 1}` as (typeof KEYS)[number])));
    if (cells.every((r) => r.every(Boolean))) {
      const A = cells.map((r) => r.slice(0, size) as Q[]);
      const bvec = cells.map((r) => r[size] as Q);
      const r = solveSystem(A, bvec);
      const qt = (x: Q) => toText(x);
      const detText = (M: Q[][]) => (size === 2 ? `${qt(M[0][0])}·${qt(M[1][1])} − ${qt(M[0][1])}·${qt(M[1][0])}` : "");
      equation = cells.map((row) => `${lin(row.slice(0, size) as Q[], vars)} = ${qt(row[size]!)}`).join("; ");
      label = t.solution;
      if (r.kind === "one") {
        value = r.x.map((x, i) => `${vars[i]} = ${qt(x)}`).join(", ");
        sub1 = r.x.some((x) => x.d !== 1n) ? r.x.map((x, i) => `${vars[i]} ≈ ${n(toNumber(x))}`).join(", ") : `${t.det} Δ = ${qt(r.D)}`;
        steps = [
          `Δ = ${size === 2 ? `${detText(A)} = ` : ""}${qt(r.D)}`,
          ...r.Di.map((d, i) => `Δ${vars[i]} = ${qt(d)}`),
          ...r.x.map((x, i) => `${vars[i]} = Δ${vars[i]} / Δ = ${qt(r.Di[i])} / ${qt(r.D)} = ${qt(x)}`),
        ];
      } else {
        value = r.kind === "none" ? t.noSolution : t.infinite;
        sub1 = t.singular;
        steps = [`Δ = 0`];
      }
    }
  }

  const coefRow = (parts: (string | [(typeof KEYS)[number], string])[]) => (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-lg">
      {parts.map((p, i) => (typeof p === "string" ? <span key={i} className="font-medium text-fg-2">{p}</span> : <Fragment key={i}>{coefField(p[0], p[1])}</Fragment>))}
    </div>
  );

  const inputs =
    m === "linear"
      ? coefRow([["a", "a"], "x +", ["b", "b"], "=", ["c", "c"]])
      : m === "quadratic"
        ? coefRow([["a", "a"], "x² +", ["b", "b"], "x +", ["c", "c"], "= 0"])
        : m === "cubic"
          ? coefRow([["a", "a"], "x³ +", ["b", "b"], "x² +", ["c", "c"], "x +", ["d", "d"], "= 0"])
          : (
            <div className="flex flex-col gap-3">
              {Array.from({ length: m === "system-2x2" ? 2 : 3 }, (_, i) =>
                coefRow(
                  m === "system-2x2"
                    ? [[`a${i + 1}` as (typeof KEYS)[number], `a${i + 1}`], "x +", [`b${i + 1}` as (typeof KEYS)[number], `b${i + 1}`], "y =", [`c${i + 1}` as (typeof KEYS)[number], `c${i + 1}`]]
                    : [[`a${i + 1}` as (typeof KEYS)[number], `a${i + 1}`], "x +", [`b${i + 1}` as (typeof KEYS)[number], `b${i + 1}`], "y +", [`c${i + 1}` as (typeof KEYS)[number], `c${i + 1}`], "z =", [`d${i + 1}` as (typeof KEYS)[number], `d${i + 1}`]],
                ),
              )}
            </div>
          );

  const anyBad = KEYS.some((k) => V(k).trim() !== "" && !parseQ(V(k)));

  return (
    <Stack>
      <div className="flex flex-col gap-4">
        <Tabs label={t.modeLabel} value={m} onChange={switchMode} items={EQ_MODES.map((x) => ({ value: x, label: t.modes[x] }))} />
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <section className="flex min-w-0 flex-col gap-3 rounded-[12px] border border-line bg-surface p-4 sm:p-5">
            {inputs}
            {anyBad && <p className="text-sm text-err">{t.bad}</p>}
          </section>
          <ResultMain label={label} value={value} sub={sub1} rows={rows} size="md" actions={<ToolActions locale={locale} onReset={qs.reset} shareUrl={qs.shareUrl} />} />
        </div>
      </div>
      {steps.length > 0 && <Explain locale={locale} title={t.steps} formula={steps} notes={notes} />}
      <EquationTheory locale={locale} mode={m} />
    </Stack>
  );
}

function EquationTheory({ locale, mode }: { locale: Locale; mode: EqMode }) {
  const ru = locale === "ru";
  const f: Record<EqMode, string[]> = {
    linear: ["a·x + b = c  →  x = (c − b) / a"],
    quadratic: ["D = b² − 4ac", "x₁,₂ = (−b ± √D) / 2a", ru ? "D < 0: x = −b/2a ± i·√(−D)/2a" : "D < 0: x = −b/2a ± i·√(−D)/2a"],
    cubic: ["x = t − b/3a", "t³ + p·t + q = 0", "Δ = (q/2)² + (p/3)³"],
    "system-2x2": ["Δ = a₁b₂ − a₂b₁", "x = Δx / Δ,  y = Δy / Δ"],
    "system-3x3": ["x = Δx / Δ,  y = Δy / Δ,  z = Δz / Δ", ru ? "Δx — определитель, где столбец x заменён свободными членами" : "Δx is the determinant with the x column replaced by the constants"],
  };
  const notes: Record<EqMode, string[]> = ru
    ? {
        linear: ["Если a = 0, решений нет (при b ≠ c) или любое x подходит (при b = c)."],
        quadratic: ["Коэффициенты можно вводить дробями (1/2) и с десятичной запятой.", "При целых коэффициентах корни показываются и в точном виде с корнем: (3 ± √5) / 2."],
        cubic: ["Корни находятся по формуле Кардано или тригонометрическим способом и уточняются методом Ньютона; показаны с точностью до 6 знаков."],
        "system-2x2": ["Правило Крамера: каждое неизвестное — отношение двух определителей. Вычисления точные, ответ может быть обыкновенной дробью.", "Если Δ = 0, система либо несовместна, либо имеет бесконечно много решений — калькулятор определяет это по рангу."],
        "system-3x3": ["Вычисления выполняются точно, в обыкновенных дробях.", "Если главный определитель равен нулю, по рангам матриц определяется, нет ли решений или их бесконечно много."],
      }
    : {
        linear: ["If a = 0 there is no solution (b ≠ c) or every x works (b = c)."],
        quadratic: ["Coefficients may be fractions (1/2) or decimals.", "With integer coefficients the roots are also shown in exact radical form: (3 ± √5) / 2."],
        cubic: ["Roots are found with Cardano's formula or the trigonometric method and refined with Newton's method; shown to 6 decimal places."],
        "system-2x2": ["Cramer's rule: each unknown is a ratio of two determinants. The arithmetic is exact, so answers may be fractions.", "If Δ = 0 the system has no solution or infinitely many — the calculator decides by comparing ranks."],
        "system-3x3": ["All arithmetic is exact, with fractions.", "If the main determinant is zero, the ranks show whether there is no solution or infinitely many."],
      };
  return <Explain locale={locale} formula={f[mode]} notes={notes[mode]} />;
}
