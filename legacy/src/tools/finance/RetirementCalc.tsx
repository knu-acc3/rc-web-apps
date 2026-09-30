"use client";

import { useCallback, useState } from "react";
import { PiggyBank, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

type Compounding = "monthly" | "annual";
type ContributionTiming = "end" | "beginning";
type CurrencyCode = "USD" | "EUR" | "GBP" | "RUB" | "JPY";

interface RetirementSuccess {
  ok: true;
  futureValue: number;
  totalDeposited: number;
  investmentChange: number;
  annualReturn: number;
  years: number;
  compounding: Compounding;
  timing: ContributionTiming;
  currency: CurrencyCode;
}

interface RetirementError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type RetirementResult = RetirementSuccess | RetirementError;

function parseFinite(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculateRetirement(
  currentSavingsInput: string,
  monthlyContributionInput: string,
  yearsInput: string,
  annualReturnInput: string,
  compounding: Compounding,
  timing: ContributionTiming,
  currency: CurrencyCode,
): RetirementResult {
  const currentSavings = parseFinite(currentSavingsInput);
  const monthlyContribution = parseFinite(monthlyContributionInput);
  const years = parseFinite(yearsInput);
  const annualReturn = parseFinite(annualReturnInput);

  if (
    currentSavings === null ||
    monthlyContribution === null ||
    years === null ||
    annualReturn === null
  ) {
    return {
      ok: false,
      messageEn: "Enter finite numbers in every required field.",
      messageRu: "Введите конечные числа во всех обязательных полях.",
    };
  }
  if (currentSavings < 0 || currentSavings > 1e15) {
    return {
      ok: false,
      messageEn: "Current savings must be between 0 and 1 quadrillion.",
      messageRu: "Текущие накопления должны быть от 0 до 1 квадриллиона.",
    };
  }
  if (monthlyContribution < 0 || monthlyContribution > 1e12) {
    return {
      ok: false,
      messageEn: "Monthly contribution must be between 0 and 1 trillion.",
      messageRu: "Ежемесячный взнос должен быть от 0 до 1 триллиона.",
    };
  }
  if (!Number.isInteger(years) || years < 0 || years > 100) {
    return {
      ok: false,
      messageEn: "Years must be a whole number from 0 to 100.",
      messageRu: "Количество лет должно быть целым числом от 0 до 100.",
    };
  }
  if (annualReturn <= -100 || annualReturn > 100) {
    return {
      ok: false,
      messageEn:
        "Expected annual return must be greater than −100% and at most 100%.",
      messageRu:
        "Ожидаемая годовая доходность должна быть больше −100% и не выше 100%.",
    };
  }

  const periodsPerYear = compounding === "monthly" ? 12 : 1;
  const periods = years * periodsPerYear;
  const periodicContribution =
    compounding === "monthly" ? monthlyContribution : monthlyContribution * 12;
  const periodicRate = annualReturn / 100 / periodsPerYear;
  const growthFactor = Math.pow(1 + periodicRate, periods);

  let contributionValue: number;
  if (Math.abs(periodicRate) < 1e-12) {
    contributionValue = periodicContribution * periods;
  } else {
    contributionValue =
      periodicContribution * ((growthFactor - 1) / periodicRate);
    if (timing === "beginning") contributionValue *= 1 + periodicRate;
  }

  const futureValue = currentSavings * growthFactor + contributionValue;
  const totalDeposited = currentSavings + monthlyContribution * 12 * years;
  const investmentChange = futureValue - totalDeposited;
  if (
    !Number.isFinite(growthFactor) ||
    !Number.isFinite(futureValue) ||
    !Number.isFinite(totalDeposited) ||
    !Number.isFinite(investmentChange)
  ) {
    return {
      ok: false,
      messageEn: "This combination overflows the supported numeric range.",
      messageRu: "Эта комбинация выходит за поддерживаемый числовой диапазон.",
    };
  }

  return {
    ok: true,
    futureValue,
    totalDeposited,
    investmentChange,
    annualReturn,
    years,
    compounding,
    timing,
    currency,
  };
}

function formatCurrency(value: number, currency: CurrencyCode, isEn: boolean) {
  return new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function RetirementCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [currentSavings, setCurrentSavings] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [years, setYears] = useState("");
  const [annualReturn, setAnnualReturn] = useState("0");
  const [compounding, setCompounding] = useState<Compounding>("monthly");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [result, setResult] = useState<RetirementResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);
  const hasMainInputs =
    currentSavings.trim() && monthlyContribution.trim() && years.trim();

  const compoundingLabel =
    compounding === "monthly"
      ? isEn
        ? "monthly"
        : "ежемесячно"
      : isEn
        ? "annually"
        : "ежегодно";
  const timingLabel =
    timing === "end"
      ? compounding === "monthly"
        ? isEn
          ? "end of each month"
          : "в конце каждого месяца"
        : isEn
          ? "end of each year"
          : "в конце каждого года"
      : compounding === "monthly"
        ? isEn
          ? "beginning of each month"
          : "в начале каждого месяца"
        : isEn
          ? "beginning of each year"
          : "в начале каждого года";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <PiggyBank size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn
                ? "Retirement savings projection"
                : "Расчёт будущих накоплений"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Estimate future value from current savings and regular contributions."
                : "Оценивает будущую стоимость текущих накоплений и регулярных взносов."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="retirement-current">
              {isEn ? "Current savings" : "Текущие накопления"}
            </Label>
            <Input
              id="retirement-current"
              inputMode="decimal"
              autoComplete="off"
              value={currentSavings}
              onChange={(event) => {
                setCurrentSavings(event.target.value);
                clearResult();
              }}
              placeholder={isEn ? "Current amount" : "Текущая сумма"}
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
          <div>
            <Label htmlFor="retirement-monthly">
              {isEn ? "Monthly contribution" : "Ежемесячный взнос"}
            </Label>
            <Input
              id="retirement-monthly"
              inputMode="decimal"
              autoComplete="off"
              value={monthlyContribution}
              onChange={(event) => {
                setMonthlyContribution(event.target.value);
                clearResult();
              }}
              placeholder={isEn ? "Monthly amount" : "Сумма в месяц"}
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
          <div>
            <Label htmlFor="retirement-years">{isEn ? "Years" : "Лет"}</Label>
            <Input
              id="retirement-years"
              inputMode="numeric"
              autoComplete="off"
              value={years}
              onChange={(event) => {
                setYears(event.target.value);
                clearResult();
              }}
              placeholder={isEn ? "Years" : "Лет"}
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!hasMainInputs || !annualReturn.trim()}
          onClick={() =>
            setResult(
              calculateRetirement(
                currentSavings,
                monthlyContribution,
                years,
                annualReturn,
                compounding,
                timing,
                currency,
              ),
            )
          }
          leadingIcon={<PiggyBank size={20} aria-hidden="true" />}
        >
          {isEn ? "Project savings" : "Рассчитать накопления"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={
            isEn
              ? "Return and calculation assumptions"
              : "Доходность и допущения"
          }
          description={`${annualReturn || "—"}% · ${compoundingLabel} · ${timingLabel} · ${currency}`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="retirement-return">
                {isEn
                  ? "Expected annual return, %"
                  : "Ожидаемая годовая доходность, %"}
              </Label>
              <Input
                id="retirement-return"
                inputMode="decimal"
                autoComplete="off"
                value={annualReturn}
                onChange={(event) => {
                  setAnnualReturn(event.target.value);
                  clearResult();
                }}
                placeholder="%"
                className="mt-2 h-11 font-mono"
              />
            </div>

            <div>
              <Label htmlFor="retirement-compounding">
                {isEn ? "Compounding" : "Начисление"}
              </Label>
              <Select
                value={compounding}
                onValueChange={(value) => {
                  setCompounding(value as Compounding);
                  clearResult();
                }}
              >
                <SelectTrigger
                  id="retirement-compounding"
                  className="mt-2 h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    {isEn ? "Monthly" : "Ежемесячно"}
                  </SelectItem>
                  <SelectItem value="annual">
                    {isEn ? "Annually" : "Ежегодно"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retirement-timing">
                {isEn ? "Contribution timing" : "Момент взноса"}
              </Label>
              <Select
                value={timing}
                onValueChange={(value) => {
                  setTiming(value as ContributionTiming);
                  clearResult();
                }}
              >
                <SelectTrigger id="retirement-timing" className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end">
                    {isEn ? "End of period" : "В конце периода"}
                  </SelectItem>
                  <SelectItem value="beginning">
                    {isEn ? "Beginning of period" : "В начале периода"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retirement-currency">
                {isEn ? "Display currency" : "Валюта отображения"}
              </Label>
              <Select
                value={currency}
                onValueChange={(value) => {
                  setCurrency(value as CurrencyCode);
                  clearResult();
                }}
              >
                <SelectTrigger id="retirement-currency" className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="RUB">RUB (₽)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "The annual return is treated as a nominal scenario rate divided by the selected number of compounding periods. With annual compounding, monthly contributions are grouped into one annual contribution."
              : "Годовая доходность считается номинальной сценарной ставкой и делится на выбранное число периодов начисления. При ежегодном начислении ежемесячные взносы объединяются в один годовой взнос."}
          </p>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="retirement-result-title"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="retirement-result-title" className="font-bold">
                  {isEn
                    ? "Projected future savings"
                    : "Расчётные будущие накопления"}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? `${result.annualReturn}% nominal annual return · ${compoundingLabel} · contributions at ${timingLabel} · ${result.currency}`
                    : `${result.annualReturn}% номинальной годовой доходности · ${compoundingLabel} · взносы ${timingLabel} · ${result.currency}`}
                </p>
              </div>
              <CopyButton
                text={result.futureValue.toFixed(2)}
                size="medium"
                tooltip={
                  isEn
                    ? "Copy projected value"
                    : "Копировать расчётное значение"
                }
              />
            </div>
            <p className="mt-4 break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-center text-3xl font-bold text-[var(--color-primary)]">
              {formatCurrency(result.futureValue, result.currency, isEn)}
            </p>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                <span className="text-[var(--color-text-muted)]">
                  {isEn ? "Total deposited: " : "Всего внесено: "}
                </span>
                <span className="font-semibold">
                  {formatCurrency(result.totalDeposited, result.currency, isEn)}
                </span>
              </p>
              <p className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] p-3">
                <span className="text-[var(--color-text-muted)]">
                  {isEn ? "Investment change: " : "Изменение от доходности: "}
                </span>
                <span className="font-semibold">
                  {formatCurrency(
                    result.investmentChange,
                    result.currency,
                    isEn,
                  )}
                </span>
              </p>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "This is a mathematical scenario, not financial advice or a guarantee. It excludes fees, taxes, inflation, pension rules, account limits, and market variability."
                : "Это математический сценарий, а не финансовый совет или гарантия. Комиссии, налоги, инфляция, пенсионные правила, лимиты счетов и колебания рынка не учитываются."}
            </p>
          </Card>
        ) : (
          <Card className="p-4 sm:p-5" role="alert" aria-live="polite">
            <div className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-bold">
                  {isEn
                    ? "Cannot project this scenario"
                    : "Не удалось рассчитать сценарий"}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {isEn ? result.messageEn : result.messageRu}
                </p>
              </div>
            </div>
          </Card>
        )
      ) : null}
    </div>
  );
}
