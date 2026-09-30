"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { parseUserNumber } from "@/src/utils/numberParsing";

type Compounding = "monthly" | "quarterly" | "annually" | "simple";
type CurrencyCode = "KZT" | "USD" | "EUR" | "RUB";

export interface DepositInput {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
  compounding: Compounding;
  taxRatePercent?: number;
}

export interface DepositResult {
  finalBeforeTax: number;
  grossInterest: number;
  taxOnInterest: number;
  finalAfterTax: number;
}

const PERIODS_PER_YEAR: Record<Exclude<Compounding, "simple">, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

export function calculateDeposit({
  principal,
  annualRatePercent,
  termMonths,
  compounding,
  taxRatePercent = 0,
}: DepositInput): DepositResult {
  const annualRate = annualRatePercent / 100;
  const years = termMonths / 12;
  let finalBeforeTax: number;

  if (annualRate === 0) {
    finalBeforeTax = principal;
  } else if (compounding === "simple") {
    finalBeforeTax = principal * (1 + annualRate * years);
  } else {
    const periodsPerYear = PERIODS_PER_YEAR[compounding];
    finalBeforeTax =
      principal * (1 + annualRate / periodsPerYear) ** (periodsPerYear * years);
  }

  const grossInterest = Math.max(0, finalBeforeTax - principal);
  const taxOnInterest = grossInterest * (taxRatePercent / 100);

  return {
    finalBeforeTax,
    grossInterest,
    taxOnInterest,
    finalAfterTax: finalBeforeTax - taxOnInterest,
  };
}

function formatMoney(value: number, currency: CurrencyCode, isEn: boolean) {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DepositCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [compounding, setCompounding] = useState<Compounding>("monthly");
  const [currency, setCurrency] = useState<CurrencyCode>("KZT");
  const [taxRate, setTaxRate] = useState("0");
  const [result, setResult] = useState<DepositResult | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const parsedPrincipal = parseUserNumber(principal) ?? Number.NaN;
    const parsedRate = parseUserNumber(annualRate) ?? Number.NaN;
    const parsedTerm = parseUserNumber(termMonths) ?? Number.NaN;
    const parsedTaxRate = parseUserNumber(taxRate) ?? Number.NaN;

    if (
      !Number.isFinite(parsedPrincipal) ||
      parsedPrincipal <= 0 ||
      parsedPrincipal > 1_000_000_000_000_000
    ) {
      setResult(null);
      setError(
        isEn
          ? "Enter a positive principal amount."
          : "Введите положительную сумму вклада.",
      );
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate < 0 || parsedRate > 1_000) {
      setResult(null);
      setError(
        isEn
          ? "Annual rate must be from 0% to 1,000%."
          : "Годовая ставка должна быть от 0% до 1 000%.",
      );
      return;
    }
    if (!Number.isInteger(parsedTerm) || parsedTerm < 1 || parsedTerm > 1_200) {
      setResult(null);
      setError(
        isEn
          ? "Term must be a whole number from 1 to 1,200 months."
          : "Срок должен быть целым числом от 1 до 1 200 месяцев.",
      );
      return;
    }
    if (
      !Number.isFinite(parsedTaxRate) ||
      parsedTaxRate < 0 ||
      parsedTaxRate > 100
    ) {
      setResult(null);
      setError(
        isEn
          ? "Optional tax rate must be from 0% to 100%."
          : "Необязательная ставка налога должна быть от 0% до 100%.",
      );
      return;
    }

    const nextResult = calculateDeposit({
      principal: parsedPrincipal,
      annualRatePercent: parsedRate,
      termMonths: parsedTerm,
      compounding,
      taxRatePercent: parsedTaxRate,
    });

    if (!Object.values(nextResult).every(Number.isFinite)) {
      setResult(null);
      setError(
        isEn
          ? "These values produce a number too large to display."
          : "При таких значениях результат слишком велик для отображения.",
      );
      return;
    }

    setResult(nextResult);
    setError("");
  };

  const compoundingLabels: Record<Compounding, [string, string]> = {
    monthly: ["Ежемесячно", "Monthly"],
    quarterly: ["Ежеквартально", "Quarterly"],
    annually: ["Ежегодно", "Annually"],
    simple: ["Простой процент", "Simple interest"],
  };

  const formula =
    compounding === "simple"
      ? "A = P × (1 + r × m / 12)"
      : "A = P × (1 + r / n) ^ (n × m / 12)";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="deposit-principal">
              {isEn ? "Principal" : "Сумма вклада"}
            </Label>
            <Input
              id="deposit-principal"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={principal}
              onChange={(event) => {
                setPrincipal(event.target.value);
                invalidate();
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="deposit-rate">
              {isEn ? "Annual rate, %" : "Ставка в год, %"}
            </Label>
            <Input
              id="deposit-rate"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={annualRate}
              onChange={(event) => {
                setAnnualRate(event.target.value);
                invalidate();
              }}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="deposit-term">
              {isEn ? "Term, months" : "Срок, месяцев"}
            </Label>
            <Input
              id="deposit-term"
              type="number"
              min="1"
              max="1200"
              step="1"
              inputMode="numeric"
              value={termMonths}
              onChange={(event) => {
                setTermMonths(event.target.value);
                invalidate();
              }}
              className="mt-1.5"
            />
          </div>
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={calculate}>
          {isEn ? "Calculate deposit" : "Рассчитать вклад"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the values" : "Проверьте значения"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={
              isEn ? "Estimated amount at maturity" : "Сумма к концу срока"
            }
            description={
              isEn
                ? compoundingLabels[compounding][1]
                : compoundingLabels[compounding][0]
            }
            className="mt-5"
          >
            <output className="block overflow-x-auto whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-4 font-mono text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              {formatMoney(result.finalAfterTax, currency, isEn)}
            </output>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-text-muted)]">
              <div className="flex min-h-8 items-center justify-between gap-3">
                <span>
                  {isEn ? "Interest before tax" : "Проценты до налога"}
                </span>
                <strong className="font-mono text-[var(--color-text)]">
                  {formatMoney(result.grossInterest, currency, isEn)}
                </strong>
              </div>
              {result.taxOnInterest > 0 ? (
                <div className="flex min-h-8 items-center justify-between gap-3">
                  <span>{isEn ? "Tax on interest" : "Налог с процентов"}</span>
                  <strong className="font-mono text-[var(--color-text)]">
                    −{formatMoney(result.taxOnInterest, currency, isEn)}
                  </strong>
                </div>
              ) : null}
              <p className="border-t border-[var(--color-border-subtle)] pt-2 font-mono text-xs text-[var(--color-text-muted)]">
                {formula}
              </p>
              <p className="text-xs leading-5">
                {isEn
                  ? "Estimate only. Actual bank day-count rules, fees and product terms may differ; this is not a return guarantee."
                  : "Это оценка. Банковские правила начисления по дням, комиссии и условия продукта могут отличаться; доходность не гарантируется."}
              </p>
            </div>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The estimated maturity amount will appear here."
                : "Здесь появится расчётная сумма к концу срока."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Calculation settings" : "Настройки расчёта"}
          description={
            isEn
              ? "Compounding, display currency and optional tax"
              : "Капитализация, валюта отображения и необязательный налог"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="deposit-compounding">
                {isEn ? "Interest method" : "Начисление процентов"}
              </Label>
              <select
                id="deposit-compounding"
                value={compounding}
                onChange={(event) => {
                  setCompounding(event.target.value as Compounding);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                {(Object.keys(compoundingLabels) as Compounding[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {compoundingLabels[value][isEn ? 1 : 0]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label htmlFor="deposit-currency">
                {isEn ? "Display currency" : "Валюта отображения"}
              </Label>
              <select
                id="deposit-currency"
                value={currency}
                onChange={(event) => {
                  setCurrency(event.target.value as CurrencyCode);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                {(["KZT", "USD", "EUR", "RUB"] as const).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="deposit-tax-rate">
                {isEn ? "Tax on interest, %" : "Налог с процентов, %"}
              </Label>
              <Input
                id="deposit-tax-rate"
                type="number"
                min="0"
                max="100"
                step="any"
                inputMode="decimal"
                value={taxRate}
                onChange={(event) => {
                  setTaxRate(event.target.value);
                  invalidate();
                }}
                className="mt-1.5"
              />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
            {isEn
              ? "Compound calculations use fractional years in the standard formula. Tax is deducted from earned interest at maturity; keep it at 0 unless a real withholding applies. Currency changes formatting only and does not convert values."
              : "Капитализация считается по стандартной формуле с дробной частью года. Налог удерживается с заработанных процентов в конце срока; оставьте 0, если реального удержания нет. Валюта меняет только формат, без конвертации."}
          </p>
        </AdvancedSettings>
      </section>
    </div>
  );
}
