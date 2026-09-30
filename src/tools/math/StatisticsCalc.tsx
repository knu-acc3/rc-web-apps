"use client";

import { useState } from "react";
import { ChartBar, XCircle } from "@phosphor-icons/react";
import { CopyButton } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type DeviationMode = "population" | "sample";
type StatisticsErrorCode = "empty" | "invalid" | "sample-size" | "range";

interface Statistics {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  minimum: number;
  maximum: number;
  standardDeviation: number;
}

type StatisticsResult =
  | {
      kind: "statistics";
      values: Statistics;
    }
  | {
      kind: "error";
      code: StatisticsErrorCode;
      invalidTokens: string[];
    };

const NUMBER_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function calculateStatistics(
  input: string,
  deviationMode: DeviationMode,
): StatisticsResult {
  const normalized = input.replace(/−/g, "-").trim();
  if (!normalized) {
    return { kind: "error", code: "empty", invalidTokens: [] };
  }

  const tokens = normalized.split(/[\s,;]+/).filter(Boolean);
  const invalidTokens: string[] = [];
  const numbers: number[] = [];

  for (const token of tokens) {
    if (!NUMBER_TOKEN.test(token)) {
      invalidTokens.push(token);
      continue;
    }
    const value = Number(token);
    if (!Number.isFinite(value)) {
      invalidTokens.push(token);
      continue;
    }
    numbers.push(value);
  }

  if (invalidTokens.length > 0) {
    return { kind: "error", code: "invalid", invalidTokens };
  }
  if (numbers.length === 0) {
    return { kind: "error", code: "empty", invalidTokens: [] };
  }
  if (deviationMode === "sample" && numbers.length < 2) {
    return { kind: "error", code: "sample-size", invalidTokens: [] };
  }

  let mean = 0;
  let squaredDifferences = 0;
  for (let index = 0; index < numbers.length; index += 1) {
    const count = index + 1;
    const delta = numbers[index] - mean;
    mean += delta / count;
    squaredDifferences += delta * (numbers[index] - mean);
  }

  if (!Number.isFinite(mean) || !Number.isFinite(squaredDifferences)) {
    return { kind: "error", code: "range", invalidTokens: [] };
  }

  const sorted = numbers.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1
      ? sorted[middle]
      : sorted[middle - 1] / 2 + sorted[middle] / 2;

  const frequencies = new Map<number, number>();
  let highestFrequency = 0;
  for (const value of sorted) {
    const frequency = (frequencies.get(value) ?? 0) + 1;
    frequencies.set(value, frequency);
    highestFrequency = Math.max(highestFrequency, frequency);
  }
  const mode =
    highestFrequency < 2
      ? []
      : Array.from(frequencies.entries())
          .filter((entry) => entry[1] === highestFrequency)
          .map((entry) => entry[0])
          .sort((left, right) => left - right);

  const divisor =
    deviationMode === "sample" ? numbers.length - 1 : numbers.length;
  const variance = Math.max(0, squaredDifferences / divisor);
  const standardDeviation = Math.sqrt(variance);
  if (!Number.isFinite(median) || !Number.isFinite(standardDeviation)) {
    return { kind: "error", code: "range", invalidTokens: [] };
  }

  return {
    kind: "statistics",
    values: {
      count: numbers.length,
      mean,
      median,
      mode,
      minimum: sorted[0],
      maximum: sorted[sorted.length - 1],
      standardDeviation,
    },
  };
}

function formatNumber(value: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(12)).toString();
}

function errorMessage(
  result: Extract<StatisticsResult, { kind: "error" }>,
  isEn: boolean,
): string {
  if (result.code === "empty") {
    return isEn ? "Enter at least one number." : "Введите хотя бы одно число.";
  }
  if (result.code === "sample-size") {
    return isEn
      ? "Sample standard deviation requires at least two values."
      : "Для выборочного стандартного отклонения нужны минимум два значения.";
  }
  if (result.code === "range") {
    return isEn
      ? "The values exceed the finite calculation range."
      : "Значения выходят за конечный диапазон вычислений.";
  }

  const visible = result.invalidTokens
    .slice(0, 3)
    .map((token) => "“" + token + "”")
    .join(", ");
  const remainder =
    result.invalidTokens.length > 3
      ? " +" + (result.invalidTokens.length - 3)
      : "";
  return isEn
    ? "Invalid numeric token" +
        (result.invalidTokens.length === 1 ? "" : "s") +
        ": " +
        visible +
        remainder +
        "."
    : "Некорректные числовые токены: " + visible + remainder + ".";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 break-all font-mono text-lg font-bold text-[var(--color-text)]">
        {value}
      </dd>
    </div>
  );
}

export default function StatisticsCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [deviationMode, setDeviationMode] =
    useState<DeviationMode>("population");
  const [result, setResult] = useState<StatisticsResult | null>(null);

  const values = result?.kind === "statistics" ? result.values : null;
  const modeText = values
    ? values.mode.length > 0
      ? values.mode.map(formatNumber).join(", ")
      : isEn
        ? "No mode"
        : "Мода отсутствует"
    : "";
  const summary = values
    ? [
        (isEn ? "Mean: " : "Среднее: ") + formatNumber(values.mean),
        (isEn ? "Median: " : "Медиана: ") + formatNumber(values.median),
        (isEn ? "Mode: " : "Мода: ") + modeText,
        (isEn ? "Minimum: " : "Минимум: ") + formatNumber(values.minimum),
        (isEn ? "Maximum: " : "Максимум: ") + formatNumber(values.maximum),
        (isEn ? "Standard deviation: " : "Стандартное отклонение: ") +
          formatNumber(values.standardDeviation),
      ].join("\n")
    : "";

  return (
    <div
      data-math-tool="statistics-calc"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn
            ? "Calculate descriptive statistics"
            : "Рассчитайте описательную статистику"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter one list of numbers separated by spaces, commas, semicolons or new lines."
            : "Введите один список чисел через пробелы, запятые, точки с запятой или новые строки."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(calculateStatistics(input, deviationMode));
          }}
        >
          <Label htmlFor="statistics-input">{isEn ? "Numbers" : "Числа"}</Label>
          <Textarea
            id="statistics-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setResult(null);
            }}
            placeholder={
              isEn
                ? "Numbers separated by spaces, commas or new lines"
                : "Числа через пробелы, запятые или новые строки"
            }
            className="mt-2 min-h-36 font-mono"
            spellCheck={false}
          />

          <ToolPrimaryAction
            type="submit"
            disabled={!input.trim()}
            className="mt-4"
            leadingIcon={<ChartBar size={20} weight="bold" />}
          >
            {isEn ? "Calculate statistics" : "Рассчитать статистику"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        result.kind === "error" ? (
          <section
            aria-live="polite"
            data-statistics-result=""
            data-statistics-status="error"
            role="alert"
            className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-lg font-bold text-[var(--color-danger)]">
                  {isEn ? "Cannot calculate" : "Не удалось выполнить расчёт"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {errorMessage(result, isEn)}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section
            aria-live="polite"
            data-statistics-result=""
            data-statistics-status="success"
            data-statistics-mean={formatNumber(result.values.mean)}
            data-statistics-median={formatNumber(result.values.median)}
            data-statistics-mode={result.values.mode
              .map(formatNumber)
              .join(",")}
            data-statistics-min={formatNumber(result.values.minimum)}
            data-statistics-max={formatNumber(result.values.maximum)}
            data-statistics-std={formatNumber(result.values.standardDeviation)}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">
                  {isEn ? "Result" : "Результат"}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {result.values.count} {isEn ? "values" : "значений"} ·{" "}
                  {deviationMode === "population"
                    ? isEn
                      ? "population"
                      : "генеральная совокупность"
                    : isEn
                      ? "sample"
                      : "выборка"}
                </p>
              </div>
              <CopyButton
                text={summary}
                size="medium"
                tooltip={isEn ? "Copy statistics" : "Скопировать статистику"}
                className="shrink-0"
              />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                label={isEn ? "Mean" : "Среднее"}
                value={formatNumber(result.values.mean)}
              />
              <Metric
                label={isEn ? "Median" : "Медиана"}
                value={formatNumber(result.values.median)}
              />
              <Metric label={isEn ? "Mode" : "Мода"} value={modeText} />
              <Metric
                label={isEn ? "Minimum" : "Минимум"}
                value={formatNumber(result.values.minimum)}
              />
              <Metric
                label={isEn ? "Maximum" : "Максимум"}
                value={formatNumber(result.values.maximum)}
              />
              <Metric
                label={
                  deviationMode === "population"
                    ? isEn
                      ? "Population SD"
                      : "Станд. откл. совокупности"
                    : isEn
                      ? "Sample SD"
                      : "Выборочное станд. откл."
                }
                value={formatNumber(result.values.standardDeviation)}
              />
            </dl>
          </section>
        )
      ) : null}

      <AdvancedSettings
        title={isEn ? "Standard deviation" : "Стандартное отклонение"}
        description={
          isEn
            ? "Population denominator N or sample denominator N − 1"
            : "Делитель N для совокупности или N − 1 для выборки"
        }
      >
        <Label htmlFor="statistics-deviation-mode">
          {isEn ? "Data type" : "Тип данных"}
        </Label>
        <select
          id="statistics-deviation-mode"
          value={deviationMode}
          onChange={(event) => {
            setDeviationMode(event.target.value as DeviationMode);
            setResult(null);
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
        >
          <option value="population">
            {isEn ? "Population (divide by N)" : "Совокупность (делить на N)"}
          </option>
          <option value="sample">
            {isEn ? "Sample (divide by N − 1)" : "Выборка (делить на N − 1)"}
          </option>
        </select>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Use a decimal point. Invalid tokens reject the entire list instead of being skipped."
            : "Используйте точку как десятичный разделитель. Некорректный токен отклоняет весь список и не пропускается."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
