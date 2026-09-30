"use client";

import { useState } from "react";
import { Calculator, Warning } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type CalculationDirection = "gross-to-net" | "net-to-gross";
type InputPeriod = "monthly" | "annual" | "daily" | "hourly";

interface SalaryResult {
  grossMonthly: number;
  netMonthly: number;
  deductionMonthly: number;
  grossAnnual: number;
  netAnnual: number;
  grossDaily: number;
  netDaily: number;
  grossHourly: number;
  netHourly: number;
}

const PERIODS: Array<{ value: InputPeriod; ru: string; en: string }> = [
  { value: "monthly", ru: "В месяц", en: "Monthly" },
  { value: "annual", ru: "В год", en: "Annual" },
  { value: "daily", ru: "В день", en: "Daily" },
  { value: "hourly", ru: "В час", en: "Hourly" },
];

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toMonthly(
  value: number,
  period: InputPeriod,
  workDays: number,
  workHours: number,
) {
  if (period === "annual") return value / 12;
  if (period === "daily") return value * workDays;
  if (period === "hourly") return value * workDays * workHours;
  return value;
}

export default function SalaryCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [amount, setAmount] = useState("");
  const [deductionRate, setDeductionRate] = useState("");
  const [direction, setDirection] =
    useState<CalculationDirection>("gross-to-net");
  const [period, setPeriod] = useState<InputPeriod>("monthly");
  const [workDays, setWorkDays] = useState("22");
  const [workHours, setWorkHours] = useState("8");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [error, setError] = useState("");

  const clearResult = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const parsedAmount = parseNumber(amount);
    const parsedRate = parseNumber(deductionRate);
    const parsedDays = parseNumber(workDays);
    const parsedHours = parseNumber(workHours);

    if (parsedAmount === null || parsedAmount <= 0 || parsedAmount > 1e15) {
      setError(
        isEn
          ? "Enter a salary greater than zero."
          : "Введите зарплату больше нуля.",
      );
      setResult(null);
      return;
    }
    if (parsedRate === null || parsedRate < 0 || parsedRate >= 100) {
      setError(
        isEn
          ? "Enter your total deduction rate from 0% up to, but not including, 100%."
          : "Введите общую ставку удержаний от 0% до значения меньше 100%.",
      );
      setResult(null);
      return;
    }
    if (parsedDays === null || parsedDays < 1 || parsedDays > 31) {
      setError(
        isEn
          ? "Work days per month must be from 1 to 31."
          : "Рабочих дней в месяце должно быть от 1 до 31.",
      );
      setResult(null);
      return;
    }
    if (parsedHours === null || parsedHours <= 0 || parsedHours > 24) {
      setError(
        isEn
          ? "Work hours per day must be greater than 0 and no more than 24."
          : "Рабочих часов в день должно быть больше 0 и не больше 24.",
      );
      setResult(null);
      return;
    }

    const monthlyInput = toMonthly(
      parsedAmount,
      period,
      parsedDays,
      parsedHours,
    );
    const rate = parsedRate / 100;
    const grossMonthly =
      direction === "gross-to-net" ? monthlyInput : monthlyInput / (1 - rate);
    const netMonthly =
      direction === "gross-to-net" ? grossMonthly * (1 - rate) : monthlyInput;
    const deductionMonthly = grossMonthly - netMonthly;

    const nextResult: SalaryResult = {
      grossMonthly,
      netMonthly,
      deductionMonthly,
      grossAnnual: grossMonthly * 12,
      netAnnual: netMonthly * 12,
      grossDaily: grossMonthly / parsedDays,
      netDaily: netMonthly / parsedDays,
      grossHourly: grossMonthly / parsedDays / parsedHours,
      netHourly: netMonthly / parsedDays / parsedHours,
    };

    if (Object.values(nextResult).some((value) => !Number.isFinite(value))) {
      setError(
        isEn
          ? "These inputs produce a number too large to calculate safely."
          : "При таких параметрах результат слишком велик для безопасного расчёта.",
      );
      setResult(null);
      return;
    }

    setError("");
    setResult(nextResult);
  };

  const formatAmount = (value: number) => {
    const formatted = value.toLocaleString(isEn ? "en-US" : "ru-RU", {
      maximumFractionDigits: 2,
    });
    return currencyLabel.trim()
      ? `${formatted} ${currencyLabel.trim()}`
      : formatted;
  };

  const amountLabel = (() => {
    const salaryType =
      direction === "gross-to-net"
        ? isEn
          ? "Gross salary"
          : "Зарплата до удержаний"
        : isEn
          ? "Net salary"
          : "Зарплата после удержаний";
    const periodLabel =
      PERIODS.find((option) => option.value === period)?.[isEn ? "en" : "ru"] ??
      "";
    return `${salaryType} — ${periodLabel.toLowerCase()}`;
  })();

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="salary-amount" className="text-sm font-semibold">
              {amountLabel}
            </Label>
            <Input
              id="salary-amount"
              value={amount}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => {
                setAmount(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-2 h-12 text-base tabular-nums"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="salary-rate" className="text-sm font-semibold">
              {isEn
                ? "Your total deduction / tax rate, %"
                : "Ваша общая ставка удержаний / налогов, %"}
            </Label>
            <Input
              id="salary-rate"
              value={deductionRate}
              inputMode="decimal"
              autoComplete="off"
              onChange={(event) => {
                setDeductionRate(event.target.value);
                clearResult();
              }}
              placeholder="0"
              className="mt-2 h-12 text-base tabular-nums"
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]"
          >
            <Warning size={19} weight="fill" className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!amount.trim() || !deductionRate.trim()}
          onClick={calculate}
          leadingIcon={<Calculator size={20} weight="bold" />}
        >
          {direction === "gross-to-net"
            ? isEn
              ? "Calculate take-home pay"
              : "Рассчитать зарплату на руки"
            : isEn
              ? "Calculate gross salary"
              : "Рассчитать зарплату до удержаний"}
        </ToolPrimaryAction>

        <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Educational estimate using only the rate you enter. It is not tax advice; actual deductions may use multiple rules and bases."
            : "Учебная оценка только по введённой вами ставке. Это не налоговая консультация: реальные удержания могут рассчитываться по нескольким правилам и базам."}
        </p>
      </section>

      {result ? (
        <section
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)] p-4 sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            {direction === "gross-to-net"
              ? isEn
                ? "Estimated net per month"
                : "Расчётная зарплата на руки в месяц"
              : isEn
                ? "Estimated gross per month"
                : "Расчётная зарплата до удержаний в месяц"}
          </p>
          <p className="mt-1 break-words text-3xl font-extrabold tabular-nums text-[var(--color-text)]">
            {formatAmount(
              direction === "gross-to-net"
                ? result.netMonthly
                : result.grossMonthly,
            )}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Gross per month" : "До удержаний в месяц"}
              </p>
              <p className="mt-1 break-words text-lg font-bold tabular-nums">
                {formatAmount(result.grossMonthly)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Estimated deductions" : "Расчётные удержания"}
              </p>
              <p className="mt-1 break-words text-lg font-bold tabular-nums">
                {formatAmount(result.deductionMonthly)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Advanced settings" : "Расширенные настройки"}
        description={
          isEn
            ? "Direction, input period, work schedule and currency label"
            : "Направление, период ввода, рабочий график и обозначение валюты"
        }
      >
        <fieldset>
          <legend className="text-sm font-semibold">
            {isEn ? "Calculation direction" : "Направление расчёта"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["gross-to-net", isEn ? "Gross → Net" : "До → На руки"],
                ["net-to-gross", isEn ? "Net → Gross" : "На руки → До"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={direction === value}
                onClick={() => {
                  setDirection(value);
                  clearResult();
                }}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold transition-colors",
                  direction === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="salary-period">
              {isEn ? "Input period" : "Период введённой суммы"}
            </Label>
            <select
              id="salary-period"
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value as InputPeriod);
                clearResult();
              }}
              className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            >
              {PERIODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {isEn ? option.en : option.ru}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="salary-currency">
              {isEn
                ? "Currency label — optional"
                : "Обозначение валюты — необязательно"}
            </Label>
            <Input
              id="salary-currency"
              value={currencyLabel}
              maxLength={8}
              onChange={(event) => {
                setCurrencyLabel(event.target.value);
                clearResult();
              }}
              placeholder="CUR"
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="salary-days">
              {isEn ? "Work days per month" : "Рабочих дней в месяце"}
            </Label>
            <Input
              id="salary-days"
              type="number"
              min={1}
              max={31}
              value={workDays}
              onChange={(event) => {
                setWorkDays(event.target.value);
                clearResult();
              }}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="salary-hours">
              {isEn ? "Work hours per day" : "Рабочих часов в день"}
            </Label>
            <Input
              id="salary-hours"
              type="number"
              min={0.1}
              max={24}
              step={0.1}
              value={workHours}
              onChange={(event) => {
                setWorkHours(event.target.value);
                clearResult();
              }}
              className="mt-1.5 h-11"
            />
          </div>
        </div>

        {result ? (
          <div className="mt-5">
            <h3 className="text-sm font-bold">
              {isEn
                ? "Annual and hourly breakdown"
                : "Расчёт за год, день и час"}
            </h3>
            <div className="mt-3 divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              {[
                {
                  label: isEn ? "Per month" : "В месяц",
                  gross: result.grossMonthly,
                  net: result.netMonthly,
                },
                {
                  label: isEn ? "Per year" : "В год",
                  gross: result.grossAnnual,
                  net: result.netAnnual,
                },
                {
                  label: isEn ? "Per work day" : "В рабочий день",
                  gross: result.grossDaily,
                  net: result.netDaily,
                },
                {
                  label: isEn ? "Per work hour" : "В рабочий час",
                  gross: result.grossHourly,
                  net: result.netHourly,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">{row.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Gross" : "До удержаний"}:{" "}
                      {formatAmount(row.gross)}
                    </p>
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="break-words font-bold tabular-nums">
                      {formatAmount(row.net)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Net" : "На руки"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </AdvancedSettings>
    </div>
  );
}
