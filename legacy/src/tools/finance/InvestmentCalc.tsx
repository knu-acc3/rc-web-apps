"use client";

import { useState } from "react";
import { TrendUp, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

import { parseUserNumber } from "@/src/utils/numberParsing";

export type Currency = "USD" | "EUR" | "GBP" | "RUB" | "KZT";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  RUB: "₽",
  KZT: "₸",
};

type Compounding = "annual" | "quarterly" | "monthly";
type InvestmentField = "initial" | "return" | "years" | "contribution";
type InvestmentErrorCode =
  "empty" | "invalid" | "negative" | "years" | "overflow";

type InvestmentResult =
  | {
      kind: "projection";
      futureValue: number;
      totalContributed: number;
      projectedGrowth: number;
      effectiveAnnualRate: number;
      months: number;
    }
  | {
      kind: "error";
      code: InvestmentErrorCode;
      field: InvestmentField;
    };

class InvestmentInputError extends Error {
  code: InvestmentErrorCode;
  field: InvestmentField;

  constructor(code: InvestmentErrorCode, field: InvestmentField) {
    super(code);
    this.name = "InvestmentInputError";
    this.code = code;
    this.field = field;
  }
}

const COMPOUNDING_PERIODS: Record<Compounding, number> = {
  annual: 1,
  quarterly: 4,
  monthly: 12,
};

function parseNonNegative(
  value: string,
  field: InvestmentField,
  optional = false,
): number {
  const trimmed = value.trim();
  if (!trimmed && optional) return 0;
  if (!trimmed) throw new InvestmentInputError("empty", field);
  const parsed = parseUserNumber(trimmed);
  if (parsed === null) {
    throw new InvestmentInputError("invalid", field);
  }
  if (!Number.isFinite(parsed)) {
    throw new InvestmentInputError("overflow", field);
  }
  if (parsed < 0) throw new InvestmentInputError("negative", field);
  return parsed;
}

function parseYears(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new InvestmentInputError("empty", "years");
  if (/^-/.test(trimmed)) {
    throw new InvestmentInputError("negative", "years");
  }
  const parsed = parseUserNumber(trimmed);
  if (parsed === null) {
    throw new InvestmentInputError("years", "years");
  }
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvestmentInputError("years", "years");
  }
  return parsed;
}

function calculateProjection(
  initialInput: string,
  returnInput: string,
  yearsInput: string,
  contributionInput: string,
  compounding: Compounding,
): InvestmentResult {
  try {
    const initial = parseNonNegative(initialInput, "initial");
    const annualReturnPercent = parseNonNegative(returnInput, "return");
    const years = parseYears(yearsInput);
    const monthlyContribution = parseNonNegative(
      contributionInput,
      "contribution",
      true,
    );
    const months = years * 12;
    if (!Number.isSafeInteger(months)) {
      throw new InvestmentInputError("overflow", "years");
    }

    const periodsPerYear = COMPOUNDING_PERIODS[compounding];
    const nominalRate = annualReturnPercent / 100;
    const monthlyLogGrowth =
      nominalRate === 0
        ? 0
        : (periodsPerYear / 12) * Math.log1p(nominalRate / periodsPerYear);
    const totalLogGrowth = monthlyLogGrowth * months;
    const growthFactor = monthlyLogGrowth === 0 ? 1 : Math.exp(totalLogGrowth);
    const contributionFactor =
      monthlyLogGrowth === 0
        ? months
        : Math.expm1(totalLogGrowth) / Math.expm1(monthlyLogGrowth);
    const futureValue =
      initial * growthFactor + monthlyContribution * contributionFactor;
    const totalContributed = initial + monthlyContribution * months;
    const projectedGrowth = futureValue - totalContributed;
    const effectiveAnnualRate =
      nominalRate === 0
        ? 0
        : Math.expm1(
            periodsPerYear * Math.log1p(nominalRate / periodsPerYear),
          ) * 100;

    if (
      !Number.isFinite(growthFactor) ||
      !Number.isFinite(contributionFactor) ||
      !Number.isFinite(futureValue) ||
      !Number.isFinite(totalContributed) ||
      !Number.isFinite(projectedGrowth) ||
      !Number.isFinite(effectiveAnnualRate)
    ) {
      throw new InvestmentInputError("overflow", "return");
    }

    return {
      kind: "projection",
      futureValue,
      totalContributed,
      projectedGrowth,
      effectiveAnnualRate,
      months,
    };
  } catch (caught) {
    if (caught instanceof InvestmentInputError) {
      return { kind: "error", code: caught.code, field: caught.field };
    }
    return { kind: "error", code: "invalid", field: "initial" };
  }
}

function formatNumber(value: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(12)).toString();
}

function errorMessage(
  result: Extract<InvestmentResult, { kind: "error" }>,
  isEn: boolean,
): string {
  const fieldLabels: Record<InvestmentField, { en: string; ru: string }> = {
    initial: { en: "Initial amount", ru: "Начальная сумма" },
    return: { en: "Annual return", ru: "Годовая доходность" },
    years: { en: "Term", ru: "Срок" },
    contribution: { en: "Monthly contribution", ru: "Ежемесячный взнос" },
  };
  const field = isEn
    ? fieldLabels[result.field].en
    : fieldLabels[result.field].ru;

  if (result.code === "empty") {
    return isEn ? field + " is required." : field + ": заполните поле.";
  }
  if (result.code === "negative") {
    return isEn
      ? field + " cannot be negative."
      : field + " не может быть отрицательным.";
  }
  if (result.code === "years") {
    return isEn
      ? "Term must be a positive whole number of years."
      : "Срок должен быть положительным целым числом лет.";
  }
  if (result.code === "overflow") {
    return isEn
      ? "The projection exceeds the finite calculation range."
      : "Проекция выходит за конечный диапазон вычислений.";
  }
  return isEn
    ? field + " must be a valid number."
    : field + ": введите корректное число.";
}

function ProjectionItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive";
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </dt>
      <dd
        className={
          "mt-1 break-all text-lg font-bold " +
          (tone === "positive"
            ? "text-[var(--color-success)]"
            : "text-[var(--color-text)]")
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default function InvestmentCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [initialAmount, setInitialAmount] = useState("");
  const [annualReturn, setAnnualReturn] = useState("");
  const [years, setYears] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("0");
  const [compounding, setCompounding] = useState<Compounding>("annual");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [result, setResult] = useState<InvestmentResult | null>(null);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div
      data-finance-tool="investment-calc"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Project investment growth" : "Рассчитайте рост вложений"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter a starting amount, nominal annual return and whole years."
            : "Введите начальную сумму, номинальную годовую доходность и целое число лет."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(
              calculateProjection(
                initialAmount,
                annualReturn,
                years,
                monthlyContribution,
                compounding,
              ),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="investment-initial">
                {isEn ? "Initial amount" : "Начальная сумма"}
              </Label>
              <Input
                id="investment-initial"
                value={initialAmount}
                onChange={(event) => {
                  setInitialAmount(event.target.value);
                  setResult(null);
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="investment-return">
                {isEn ? "Annual return (%)" : "Годовая доходность (%)"}
              </Label>
              <Input
                id="investment-return"
                value={annualReturn}
                onChange={(event) => {
                  setAnnualReturn(event.target.value);
                  setResult(null);
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="investment-years">
                {isEn ? "Term (years)" : "Срок (лет)"}
              </Label>
              <Input
                id="investment-years"
                value={years}
                onChange={(event) => {
                  setYears(event.target.value);
                  setResult(null);
                }}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
          </div>

          <ToolPrimaryAction
            type="submit"
            disabled={
              !initialAmount.trim() || !annualReturn.trim() || !years.trim()
            }
            className="mt-4"
            leadingIcon={<TrendUp size={20} weight="bold" />}
          >
            {isEn ? "Calculate projection" : "Рассчитать проекцию"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        result.kind === "error" ? (
          <section
            aria-live="polite"
            data-investment-result=""
            data-investment-status="error"
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
                  {isEn ? "Check the inputs" : "Проверьте значения"}
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
            data-investment-result=""
            data-investment-status="success"
            data-investment-future={formatNumber(result.futureValue)}
            data-investment-contributed={formatNumber(result.totalContributed)}
            data-investment-growth={formatNumber(result.projectedGrowth)}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {isEn ? "Nominal projection" : "Номинальная проекция"}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {result.months} {isEn ? "months" : "месяцев"} ·{" "}
              {isEn ? "effective annual rate" : "эффективная годовая ставка"}{" "}
              {formatNumber(result.effectiveAnnualRate)}%
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <ProjectionItem
                label={isEn ? "Future value" : "Будущая стоимость"}
                value={formatMoney(result.futureValue)}
                tone="positive"
              />
              <ProjectionItem
                label={isEn ? "Total contributed" : "Всего внесено"}
                value={formatMoney(result.totalContributed)}
              />
              <ProjectionItem
                label={isEn ? "Projected growth" : "Расчётный рост"}
                value={formatMoney(result.projectedGrowth)}
                tone="positive"
              />
            </dl>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Monthly contributions are added at the end of each month."
                : "Ежемесячные взносы добавляются в конце каждого месяца."}
            </p>
          </section>
        )
      ) : null}

      <AdvancedSettings
        title={
          isEn ? "Contributions and compounding" : "Взносы и капитализация"
        }
        description={
          isEn
            ? "Monthly contribution, compounding frequency and currency"
            : "Ежемесячный взнос, частота капитализации и валюта"
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="investment-contribution">
              {isEn ? "Monthly contribution" : "Ежемесячный взнос"}
            </Label>
            <Input
              id="investment-contribution"
              value={monthlyContribution}
              onChange={(event) => {
                setMonthlyContribution(event.target.value);
                setResult(null);
              }}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="investment-compounding">
              {isEn ? "Compounding" : "Капитализация"}
            </Label>
            <select
              id="investment-compounding"
              value={compounding}
              onChange={(event) => {
                setCompounding(event.target.value as Compounding);
                setResult(null);
              }}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
            >
              <option value="annual">{isEn ? "Annual" : "Ежегодно"}</option>
              <option value="quarterly">
                {isEn ? "Quarterly" : "Ежеквартально"}
              </option>
              <option value="monthly">{isEn ? "Monthly" : "Ежемесячно"}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="investment-currency">
              {isEn ? "Currency" : "Валюта"}
            </Label>
            <select
              id="investment-currency"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as Currency)}
              className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="RUB">RUB (₽)</option>
              <option value="KZT">KZT (₸)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          <p>
            {isEn
              ? "The nominal annual rate and selected compounding frequency are converted to an equivalent monthly growth rate for end-of-month contributions."
              : "Номинальная годовая ставка и выбранная частота капитализации преобразуются в эквивалентный месячный темп для взносов в конце месяца."}
          </p>
          <p>
            {isEn
              ? "This is a nominal mathematical projection, not financial advice or a guarantee. Taxes, fees, inflation and market volatility are not included."
              : "Это номинальная математическая проекция, а не финансовая рекомендация или гарантия. Налоги, комиссии, инфляция и волатильность рынка не учитываются."}
          </p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
