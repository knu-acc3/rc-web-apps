"use client";

import { useId } from "react";
import { Field, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../types";
import { fmtN } from "../kit/fmt";
import { parseLocaleNumber } from "../kit/num";
import { CalcGrid, Explain, ResultMain, Stack, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";
import { arithmeticMean, geometricMean, harmonicMean, median, weightedMean } from "../numbers/engines";
import { parseData } from "../statistics/engine";

const KINDS = ["arithmetic", "weighted", "geometric", "harmonic"] as const;
type Kind = (typeof KINDS)[number];

const T = {
  ru: {
    kind: "Вид среднего",
    kinds: { arithmetic: "Арифметическое", weighted: "Взвешенное", geometric: "Геометрическое", harmonic: "Гармоническое" } satisfies Record<Kind, string>,
    data: "Числа",
    dataHint: "Через пробел, с новой строки или через «;» — запятая остаётся десятичной: 4,5",
    pairs: "Значение и вес — по паре в строке",
    pairsHint: "Например: «5 3» — оценка 5 с весом 3. Между числами пробел или «;»",
    label: { arithmetic: "Среднее арифметическое", weighted: "Среднее взвешенное", geometric: "Среднее геометрическое", harmonic: "Среднее гармоническое" } satisfies Record<Kind, string>,
    others: "Другие средние",
    medianL: "Медиана",
    n: (n: number) => `по ${n} ${n % 10 === 1 && n % 100 !== 11 ? "числу" : "числам"}`,
    enter: "Введите числа",
    geoErr: "Геометрическое среднее определено только для положительных чисел",
    harErr: "Гармоническое среднее не определено, если среди чисел есть ноль",
    weightErr: "Сумма весов равна нулю",
    invalid: (x: string) => `Пропущены: ${x}`,
  },
  en: {
    kind: "Type of mean",
    kinds: { arithmetic: "Arithmetic", weighted: "Weighted", geometric: "Geometric", harmonic: "Harmonic" } satisfies Record<Kind, string>,
    data: "Numbers",
    dataHint: "Separated by spaces, new lines or ';'",
    pairs: "Value and weight — one pair per line",
    pairsHint: "For example '5 3' — a grade of 5 with weight 3",
    label: { arithmetic: "Arithmetic mean", weighted: "Weighted mean", geometric: "Geometric mean", harmonic: "Harmonic mean" } satisfies Record<Kind, string>,
    others: "Other means",
    medianL: "Median",
    n: (n: number) => `of ${n} ${n === 1 ? "number" : "numbers"}`,
    enter: "Enter the numbers",
    geoErr: "The geometric mean is defined for positive numbers only",
    harErr: "The harmonic mean is undefined when a number is zero",
    weightErr: "The weights add up to zero",
    invalid: (x: string) => `Skipped: ${x}`,
  },
} as const;

export default function Average({ locale, kind = "arithmetic" }: ToolProps<{ kind?: Kind }>) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState(
    { k: kind, d: ru ? "4 5 3 5 4,5 5" : "4 5 3 5 4.5 5", w: "5 3\n4 2\n3 1" },
    { enums: { k: KINDS }, maxLength: 3000 },
  );
  const k = q.v.k as Kind;
  const f = (x: number) => (Number.isFinite(x) ? fmtN(locale, x, 6) : "—");
  const { values, invalid } = parseData(locale, q.v.d);

  const pairs: [number, number][] = [];
  const badPairs: string[] = [];
  for (const line of q.v.w.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    const [a, b, ...rest] = line.split(/[\s;×*xх]+/).filter(Boolean);
    const x = a ? parseLocaleNumber(locale, a) : null;
    const w = b ? parseLocaleNumber(locale, b) : null;
    if (x === null || w === null || rest.length) badPairs.push(line);
    else pairs.push([x, w]);
  }

  let value = NaN;
  let err: string | undefined;
  if (k === "weighted") {
    value = weightedMean(pairs);
    if (pairs.length && !Number.isFinite(value)) err = t.weightErr;
  } else if (k === "arithmetic") value = arithmeticMean(values);
  else if (k === "geometric") {
    value = geometricMean(values);
    if (values.length && !Number.isFinite(value)) err = t.geoErr;
  } else {
    value = harmonicMean(values);
    if (values.length && !Number.isFinite(value)) err = t.harErr;
  }
  const count = k === "weighted" ? pairs.length : values.length;
  const others = k !== "weighted" && values.length
    ? [
        ...(k !== "arithmetic" ? [{ label: t.label.arithmetic, value: f(arithmeticMean(values)) }] : []),
        { label: t.medianL, value: f(median(values)) },
        ...(k !== "geometric" ? [{ label: t.label.geometric, value: f(geometricMean(values)) }] : []),
        ...(k !== "harmonic" ? [{ label: t.label.harmonic, value: f(harmonicMean(values)) }] : []),
      ]
    : undefined;

  const bad = k === "weighted" ? badPairs : invalid;
  return (
    <Stack>
      <CalcGrid
        inputs={
          <>
            <Segmented label={t.kind} value={k} onChange={(v) => q.set({ k: v })} options={KINDS.map((x) => ({ value: x, label: t.kinds[x] }))} />
            {k === "weighted" ? (
              <Field label={t.pairs} htmlFor={`${id}-w`} hint={t.pairsHint} error={bad.length ? t.invalid(bad.slice(0, 5).join(" | ")) : undefined}>
                <Textarea id={`${id}-w`} value={q.v.w} onChange={(e) => q.set({ w: e.target.value })} rows={6} className="tabular text-base" />
              </Field>
            ) : (
              <Field label={t.data} htmlFor={`${id}-d`} hint={t.dataHint} error={bad.length ? t.invalid(bad.slice(0, 8).join(", ")) : undefined}>
                <Textarea id={`${id}-d`} value={q.v.d} onChange={(e) => q.set({ d: e.target.value })} rows={6} className="tabular text-base" />
              </Field>
            )}
          </>
        }
        result={
          <ResultMain
            label={t.label[k]}
            value={f(value)}
            sub={err ?? (count ? t.n(count) : t.enter)}
            rows={others}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {ru ? (
        <Explain
          locale={locale}
          formula={["Арифметическое: (x₁ + … + xₙ) / n", "Взвешенное: Σ(xᵢ·wᵢ) / Σwᵢ", "Геометрическое: ⁿ√(x₁·…·xₙ)", "Гармоническое: n / (1/x₁ + … + 1/xₙ)"]}
          notes={[
            "Арифметическое — обычное среднее. Взвешенное учитывает важность значений: средний балл с разными весами оценок, средняя цена при разных объёмах покупок.",
            "Геометрическое используют для темпов роста: рост на 10 % и на 30 % в среднем даёт √(1,1 × 1,3) − 1 ≈ 19,58 % в год, а не 20 %.",
            "Гармоническое — для средних скоростей и цен: 40 км/ч туда и 60 км/ч обратно в среднем дают 48 км/ч, а не 50.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Arithmetic: (x₁ + … + xₙ) / n", "Weighted: Σ(xᵢ·wᵢ) / Σwᵢ", "Geometric: ⁿ√(x₁·…·xₙ)", "Harmonic: n / (1/x₁ + … + 1/xₙ)"]}
          notes={[
            "The arithmetic mean is the everyday average. The weighted mean accounts for importance: a grade average with different weights, an average price over different quantities.",
            "The geometric mean suits growth rates: +10% and +30% average √(1.1 × 1.3) − 1 ≈ 19.58% a year, not 20%.",
            "The harmonic mean suits average speeds: 40 km/h there and 60 km/h back average 48 km/h, not 50.",
          ]}
        />
      )}
    </Stack>
  );
}
