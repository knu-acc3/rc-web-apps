"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import type { ToolProps } from "../../../types";
import { BarChart } from "../../shared/charts";
import { fmtN } from "../../shared/fmt";
import { Explain, ResultMain, ResultRows, Stack, SubHeading, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { describe, histogram, parseData, type Stats } from "./engine";

const T = {
  ru: {
    data: "Данные",
    hint: "Числа через пробел, с новой строки или через «;». Запятая — десятичный разделитель: 1,5",
    mean: "Среднее арифметическое",
    sub: (n: string, med: string) => `n = ${n}, медиана ${med}`,
    enter: "Введите хотя бы одно число",
    invalid: (x: string) => `Не числа, пропущены: ${x}`,
    median: "Медиана",
    mode: "Мода",
    noMode: "нет (все значения встречаются по одному разу)",
    times: (n: number) => `встречается ${n} раза`,
    sdS: "Стандартное отклонение (выборка)",
    sdP: "Стандартное отклонение (совокупность)",
    varS: "Дисперсия (выборка)",
    varP: "Дисперсия (совокупность)",
    min: "Минимум",
    max: "Максимум",
    range: "Размах",
    sum: "Сумма",
    count: "Количество",
    q1: "Первый квартиль Q1",
    q3: "Третий квартиль Q3",
    iqr: "Межквартильный размах IQR",
    fences: "Границы выбросов",
    outliers: "Выбросы",
    none: "нет",
    cv: "Коэффициент вариации",
    se: "Стандартная ошибка среднего",
    geo: "Среднее геометрическое",
    all: "Все показатели",
    spread: "Разброс и квартили",
    box: "Диаграмма размаха",
    hist: "Гистограмма",
    sorted: "Упорядоченные данные",
    freq: "Частота",
  },
  en: {
    data: "Data",
    hint: "Numbers separated by spaces, new lines or ';'",
    mean: "Mean",
    sub: (n: string, med: string) => `n = ${n}, median ${med}`,
    enter: "Enter at least one number",
    invalid: (x: string) => `Not numbers, skipped: ${x}`,
    median: "Median",
    mode: "Mode",
    noMode: "none (every value occurs once)",
    times: (n: number) => `occurs ${n} times`,
    sdS: "Standard deviation (sample)",
    sdP: "Standard deviation (population)",
    varS: "Variance (sample)",
    varP: "Variance (population)",
    min: "Minimum",
    max: "Maximum",
    range: "Range",
    sum: "Sum",
    count: "Count",
    q1: "First quartile Q1",
    q3: "Third quartile Q3",
    iqr: "Interquartile range IQR",
    fences: "Outlier fences",
    outliers: "Outliers",
    none: "none",
    cv: "Coefficient of variation",
    se: "Standard error of the mean",
    geo: "Geometric mean",
    all: "All statistics",
    spread: "Spread and quartiles",
    box: "Box plot",
    hist: "Histogram",
    sorted: "Sorted data",
    freq: "Frequency",
  },
} as const;

function BoxPlot({ s, locale }: { s: Stats; locale: Locale }) {
  const lo = Math.min(s.min, s.lowerFence);
  const hi = Math.max(s.max, s.upperFence);
  const span = hi - lo || 1;
  const X = (v: number) => 20 + ((v - lo) / span) * 960;
  const wLo = Math.min(...s.sorted.filter((x) => x >= s.lowerFence));
  const wHi = Math.max(...s.sorted.filter((x) => x <= s.upperFence));
  const f = (v: number) => fmtN(locale, v, 3);
  return (
    <figure className="panel min-w-0 p-3 sm:p-4" role="img" aria-label={`${T[locale].box}: Q1 ${f(s.q1)}, ${T[locale].median} ${f(s.median)}, Q3 ${f(s.q3)}`}>
      <svg viewBox="0 0 1000 120" className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
        <line x1={X(wLo)} x2={X(s.q1)} y1={50} y2={50} stroke="var(--fg-3)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <line x1={X(s.q3)} x2={X(wHi)} y1={50} y2={50} stroke="var(--fg-3)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <line x1={X(wLo)} x2={X(wLo)} y1={35} y2={65} stroke="var(--fg-3)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <line x1={X(wHi)} x2={X(wHi)} y1={35} y2={65} stroke="var(--fg-3)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <rect x={X(s.q1)} width={Math.max(2, X(s.q3) - X(s.q1))} y={25} height={50} fill="color-mix(in oklab, var(--accent) 22%, transparent)" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <line x1={X(s.median)} x2={X(s.median)} y1={25} y2={75} stroke="var(--accent)" strokeWidth={3} vectorEffect="non-scaling-stroke" />
        {s.outliers.map((o, i) => (
          <circle key={i} cx={X(o)} cy={50} r={6} fill="var(--err)" />
        ))}
      </svg>
      <div className="tabular flex flex-wrap justify-between gap-x-3 text-[0.75rem] text-fg-3">
        <span>{f(lo)}</span>
        <span className="text-center">
          Q1 {f(s.q1)} · Me {f(s.median)} · Q3 {f(s.q3)}
        </span>
        <span>{f(hi)}</span>
      </div>
    </figure>
  );
}

export default function Statistics({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState({ d: ru ? "2 4 4 4 5 5 7 9 12,5" : "2 4 4 4 5 5 7 9 12.5" }, { maxLength: 4000 });
  const { values, invalid } = parseData(locale, q.v.d);
  const s = describe(values);
  const f = (v: number | null) => (v === null ? "—" : fmtN(locale, v, 6));

  const result = (
    <ResultMain
      label={t.mean}
      value={s ? f(s.mean) : "—"}
      sub={s ? t.sub(String(s.n), f(s.median)) : t.enter}
      rows={
        s
          ? [
              { label: t.median, value: f(s.median) },
              { label: t.mode, value: s.modes.length ? s.modes.map(f).join("; ") : t.none, hint: s.modes.length ? t.times(s.modeCount) : undefined },
              { label: t.sdS, value: f(s.sdSample) },
              { label: t.range, value: `${f(s.range)} (${f(s.min)} … ${f(s.max)})` },
            ]
          : undefined
      }
      actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
    >
      {invalid.length > 0 && <p className="mt-2 text-sm text-warn">{t.invalid(invalid.slice(0, 8).join(", "))}</p>}
    </ResultMain>
  );

  const bins = s ? histogram(s.sorted) : [];

  return (
    <Stack>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
        <Panel className="p-4 sm:p-6">
          <Field label={t.data} htmlFor={`${id}-d`} hint={t.hint}>
            <Textarea id={`${id}-d`} value={q.v.d} onChange={(e) => q.set({ d: e.target.value })} rows={8} className="tabular text-base" />
          </Field>
        </Panel>
        <div className="lg:sticky lg:top-20">{result}</div>
      </div>
      {s && (
        <div className="grid gap-4 md:grid-cols-2">
          <ResultRows
            title={t.spread}
            rows={[
              { label: t.count, value: String(s.n) },
              { label: t.sum, value: f(s.sum) },
              { label: t.varS, value: f(s.varSample) },
              { label: t.varP, value: f(s.varPop) },
              { label: t.sdP, value: f(s.sdPop) },
              { label: t.se, value: f(s.se) },
              { label: t.cv, value: s.cv === null ? "—" : `${fmtN(locale, s.cv, 2)} %` },
              ...(s.geoMean !== null ? [{ label: t.geo, value: f(s.geoMean) }] : []),
            ]}
          />
          <ResultRows
            title={t.all}
            rows={[
              { label: t.q1, value: f(s.q1) },
              { label: t.q3, value: f(s.q3) },
              { label: t.iqr, value: f(s.iqr) },
              { label: t.fences, value: `${f(s.lowerFence)} … ${f(s.upperFence)}` },
              { label: t.outliers, value: s.outliers.length ? s.outliers.map(f).join("; ") : t.none },
              { label: t.min, value: f(s.min) },
              { label: t.max, value: f(s.max) },
            ]}
          />
        </div>
      )}
      {s && s.n >= 3 && (
        <div className="grid gap-6 md:grid-cols-2">
          <section>
            <SubHeading>{t.box}</SubHeading>
            <BoxPlot s={s} locale={locale} />
          </section>
          <section>
            <SubHeading>{t.hist}</SubHeading>
            <BarChart ariaLabel={t.hist} labels={bins.map((b) => fmtN(locale, b.from, 2))} series={[{ label: t.freq, values: bins.map((b) => b.count), tone: "accent" }]} yFormat={(v) => fmtN(locale, v, 0)} height={180} />
          </section>
        </div>
      )}
      {s && (
        <section>
          <SubHeading>{t.sorted}</SubHeading>
          <p className="tabular panel max-h-72 overflow-y-auto break-words p-4 text-sm text-fg-2">{s.sorted.slice(0, 500).map(f).join("; ")}{s.n > 500 ? " …" : ""}</p>
        </section>
      )}
      {ru ? (
        <Explain
          locale={locale}
          formula={["Среднее x̄ = Σx / n", "Дисперсия выборки s² = Σ(x − x̄)² / (n − 1), совокупности σ² = Σ(x − x̄)² / n", "Квартили: линейная интерполяция, позиция (n − 1)·p (как QUARTILE.INC в Excel)", "Выбросы: x < Q1 − 1,5·IQR или x > Q3 + 1,5·IQR"]}
          notes={[
            "Выборочное стандартное отклонение (делитель n − 1) используют, когда данные — часть большой совокупности; для всех значений целиком — делитель n.",
            "Числа разделяются пробелами, переносами строк или точкой с запятой. Запятая всегда считается десятичной: «1,5» — это одно число полтора.",
            "Мода — значение, которое встречается чаще других; если таких несколько, показываются все.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["Mean x̄ = Σx / n", "Sample variance s² = Σ(x − x̄)² / (n − 1), population σ² = Σ(x − x̄)² / n", "Quartiles: linear interpolation at position (n − 1)·p (Excel QUARTILE.INC)", "Outliers: x < Q1 − 1.5·IQR or x > Q3 + 1.5·IQR"]}
          notes={[
            "Use the sample standard deviation (divisor n − 1) when your data is a sample of a larger population, and the population one (divisor n) for complete data.",
            "Separate numbers with spaces, new lines or semicolons.",
            "The mode is the most frequent value; if several values tie, all are shown.",
          ]}
        />
      )}
    </Stack>
  );
}
