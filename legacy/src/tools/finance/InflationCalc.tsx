"use client";

import { useCallback, useState } from "react";
import { ChartLineDown, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { parseUserNumber } from "@/src/utils/numberParsing";

type Direction = "future-cost" | "purchasing-power";

interface InflationSuccess {
  ok: true;
  value: number;
  amount: number;
  annualRate: number;
  years: number;
  factor: number;
}

interface InflationError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type InflationResult = InflationSuccess | InflationError;

function parseFinite(value: string) {
  return parseUserNumber(value);
}

function calculateInflation(
  amountInput: string,
  rateInput: string,
  yearsInput: string,
  direction: Direction,
): InflationResult {
  const amount = parseFinite(amountInput);
  const annualRate = parseFinite(rateInput);
  const years = parseFinite(yearsInput);

  if (amount === null || annualRate === null || years === null) {
    return {
      ok: false,
      messageEn: "Enter finite numbers in all three fields.",
      messageRu: "Введите конечные числа во всех трёх полях.",
    };
  }
  if (amount < 0) {
    return {
      ok: false,
      messageEn: "Amount cannot be negative.",
      messageRu: "Сумма не может быть отрицательной.",
    };
  }
  if (annualRate <= -100 || annualRate > 1000) {
    return {
      ok: false,
      messageEn:
        "Annual inflation must be greater than −100% and at most 1000%.",
      messageRu: "Годовая инфляция должна быть больше −100% и не выше 1000%.",
    };
  }
  if (!Number.isInteger(years) || years < 0 || years > 200) {
    return {
      ok: false,
      messageEn: "Years must be a whole number from 0 to 200.",
      messageRu: "Количество лет должно быть целым числом от 0 до 200.",
    };
  }

  const factor = Math.pow(1 + annualRate / 100, years);
  const value = direction === "future-cost" ? amount * factor : amount / factor;
  if (
    !Number.isFinite(factor) ||
    !Number.isFinite(value) ||
    (factor === 0 && amount > 0)
  ) {
    return {
      ok: false,
      messageEn: "This combination overflows the supported numeric range.",
      messageRu: "Эта комбинация выходит за поддерживаемый числовой диапазон.",
    };
  }

  return { ok: true, value, amount, annualRate, years, factor };
}

function formatNumber(value: number, isEn: boolean) {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU", {
    maximumFractionDigits: 4,
  });
}

export default function InflationCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("future-cost");
  const [amount, setAmount] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [years, setYears] = useState("");
  const [result, setResult] = useState<InflationResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);
  const hasAllInputs = amount.trim() && annualRate.trim() && years.trim();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <ChartLineDown size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Inflation calculator" : "Калькулятор инфляции"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Compare future cost or purchasing power under a constant annual rate."
                : "Сравнивает будущую стоимость или покупательную способность при постоянной годовой ставке."}
            </p>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">
            {isEn ? "Direction" : "Направление"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                ["future-cost", isEn ? "Future cost" : "Будущая стоимость"],
                [
                  "purchasing-power",
                  isEn ? "Purchasing power" : "Покупательная способность",
                ],
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
                  "min-h-11 rounded-[var(--radius-md)] border px-2 text-sm font-semibold transition-colors",
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

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="inflation-amount">
              {isEn ? "Amount" : "Сумма"}
            </Label>
            <Input
              id="inflation-amount"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                clearResult();
              }}
              placeholder={isEn ? "Amount" : "Сумма"}
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
          <div>
            <Label htmlFor="inflation-rate">
              {isEn ? "Annual inflation, %" : "Годовая инфляция, %"}
            </Label>
            <Input
              id="inflation-rate"
              inputMode="decimal"
              autoComplete="off"
              value={annualRate}
              onChange={(event) => {
                setAnnualRate(event.target.value);
                clearResult();
              }}
              placeholder="%"
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
          <div>
            <Label htmlFor="inflation-years">{isEn ? "Years" : "Лет"}</Label>
            <Input
              id="inflation-years"
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
          disabled={!hasAllInputs}
          onClick={() =>
            setResult(calculateInflation(amount, annualRate, years, direction))
          }
          leadingIcon={<ChartLineDown size={20} aria-hidden="true" />}
        >
          {isEn ? "Calculate inflation effect" : "Рассчитать влияние инфляции"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Formula and assumptions" : "Формула и допущения"}
          description={
            isEn
              ? "Constant compound rate, not a forecast"
              : "Постоянная сложная ставка, а не прогноз"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Future cost uses amount × (1 + rate)^years. Purchasing power uses amount ÷ (1 + rate)^years. A 0% rate leaves the amount unchanged."
                : "Будущая стоимость считается как сумма × (1 + ставка)^лет. Покупательная способность — сумма ÷ (1 + ставка)^лет. При ставке 0% сумма не меняется."}
            </p>
            <p>
              {isEn
                ? "The entered annual rate is assumed constant for every year. It is a scenario, not historical data or an inflation forecast."
                : "Введённая годовая ставка считается постоянной каждый год. Это сценарий, а не исторические данные или прогноз инфляции."}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="inflation-result-title"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="inflation-result-title" className="font-bold">
                  {direction === "future-cost"
                    ? isEn
                      ? "Future equivalent cost"
                      : "Эквивалентная будущая стоимость"
                    : isEn
                      ? "Remaining purchasing power"
                      : "Оставшаяся покупательная способность"}
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {isEn
                    ? `${result.annualRate}% assumed every year for ${result.years} years`
                    : `Допущение: ${result.annualRate}% ежегодно в течение ${result.years} лет`}
                </p>
              </div>
              <CopyButton
                text={result.value.toFixed(4).replace(/\.0+$/u, "")}
                size="medium"
                tooltip={isEn ? "Copy result" : "Копировать результат"}
              />
            </div>
            <p className="mt-4 break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-center font-mono text-3xl font-bold text-[var(--color-primary)]">
              {formatNumber(result.value, isEn)}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "The result uses the same monetary or numeric unit as the amount entered. It is not a forecast."
                : "Результат использует ту же денежную или числовую единицу, что и введённая сумма. Это не прогноз."}
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
                    ? "Cannot calculate this scenario"
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
