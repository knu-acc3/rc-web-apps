"use client";

import { useState } from "react";
import { Percent } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type PercentageMode =
  "percentOf" | "whatPercent" | "change" | "increase" | "decrease";

interface ModeCopy {
  firstEn: string;
  firstRu: string;
  secondEn: string;
  secondRu: string;
  resultEn: string;
  resultRu: string;
}

const MODE_COPY: Record<PercentageMode, ModeCopy> = {
  percentOf: {
    firstEn: "Percentage",
    firstRu: "Процент",
    secondEn: "Number",
    secondRu: "Число",
    resultEn: "Percentage of number",
    resultRu: "Процент от числа",
  },
  whatPercent: {
    firstEn: "Part",
    firstRu: "Часть",
    secondEn: "Whole",
    secondRu: "Целое",
    resultEn: "Share of whole",
    resultRu: "Доля от целого",
  },
  change: {
    firstEn: "Original value",
    firstRu: "Исходное значение",
    secondEn: "New value",
    secondRu: "Новое значение",
    resultEn: "Percentage change",
    resultRu: "Изменение в процентах",
  },
  increase: {
    firstEn: "Percentage",
    firstRu: "Процент",
    secondEn: "Number",
    secondRu: "Число",
    resultEn: "Value after increase",
    resultRu: "Значение после увеличения",
  },
  decrease: {
    firstEn: "Percentage",
    firstRu: "Процент",
    secondEn: "Number",
    secondRu: "Число",
    resultEn: "Value after decrease",
    resultRu: "Значение после уменьшения",
  },
};

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, precision: number): string {
  if (Object.is(value, -0) || Math.abs(value) < 1e-14) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 10 ** -(precision + 2)) {
    return value.toExponential(Math.max(2, precision));
  }
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function calculatePercentage(
  mode: PercentageMode,
  first: number,
  second: number,
): number | null {
  if (mode === "percentOf") return (first / 100) * second;
  if (mode === "whatPercent") {
    return second === 0 ? null : (first / second) * 100;
  }
  if (mode === "change") {
    return first === 0 ? null : ((second - first) / Math.abs(first)) * 100;
  }
  if (mode === "increase") return second * (1 + first / 100);
  return second * (1 - first / 100);
}

function formulaForMode(mode: PercentageMode): string {
  if (mode === "percentOf") return "result = percentage ÷ 100 × number";
  if (mode === "whatPercent") return "result = part ÷ whole × 100";
  if (mode === "change") {
    return "result = (new − original) ÷ |original| × 100";
  }
  if (mode === "increase") return "result = number × (1 + percentage ÷ 100)";
  return "result = number × (1 − percentage ÷ 100)";
}

export default function PercentageCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<PercentageMode>("percentOf");
  const [firstInput, setFirstInput] = useState("15");
  const [secondInput, setSecondInput] = useState("100");
  const [precision, setPrecision] = useState(2);
  const [processedSignature, setProcessedSignature] = useState("");

  const first = parseDecimal(firstInput);
  const second = parseDecimal(secondInput);
  const rawResult =
    first === null || second === null
      ? null
      : calculatePercentage(mode, first, second);
  const result = rawResult === null ? "" : formatNumber(rawResult, precision);
  const resultUsesPercent = mode === "whatPercent" || mode === "change";
  const signature = JSON.stringify([mode, firstInput, secondInput, precision]);
  const hasFreshResult =
    processedSignature === signature && processedSignature !== "";
  const copy = MODE_COPY[mode];

  const invalidDenominator =
    (mode === "whatPercent" && second === 0) ||
    (mode === "change" && first === 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="percentage-first" className="mb-1.5 block text-sm">
              {isEn ? copy.firstEn : copy.firstRu}
            </Label>
            <Input
              id="percentage-first"
              type="text"
              inputMode="decimal"
              value={firstInput}
              onChange={(event) => setFirstInput(event.target.value)}
              placeholder="15"
              className={cn(
                "h-12 font-mono text-lg",
                firstInput.trim() &&
                  first === null &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="percentage-second" className="mb-1.5 block text-sm">
              {isEn ? copy.secondEn : copy.secondRu}
            </Label>
            <Input
              id="percentage-second"
              type="text"
              inputMode="decimal"
              value={secondInput}
              onChange={(event) => setSecondInput(event.target.value)}
              placeholder="100"
              className={cn(
                "h-12 font-mono text-lg",
                secondInput.trim() &&
                  (second === null || invalidDenominator) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>
        </div>

        {invalidDenominator ? (
          <p className="mt-2 text-sm text-[var(--color-danger)]">
            {isEn
              ? "The denominator must not be zero."
              : "Знаменатель не должен быть равен нулю."}
          </p>
        ) : null}

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            onClick={() => setProcessedSignature(signature)}
            disabled={rawResult === null}
            leadingIcon={<Percent size={20} />}
          >
            {isEn ? "Calculate percentage" : "Рассчитать процент"}
          </ToolPrimaryAction>
        </div>

        <section
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {isEn ? copy.resultEn : copy.resultRu}
            </span>
            {hasFreshResult ? <CopyButton text={result} size="medium" /> : null}
          </div>
          <p className="break-all font-mono text-2xl font-bold">
            {hasFreshResult
              ? result + (resultUsesPercent ? "%" : "")
              : isEn
                ? "Result appears here"
                : "Здесь появится результат"}
          </p>
        </section>
      </Card>

      <AdvancedSettings
        title={isEn ? "More percentage options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Calculation mode, precision and formula"
            : "Режим расчёта, точность и формула"
        }
      >
        <div className="space-y-5 [&_select]:min-h-11">
          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Calculation mode" : "Режим расчёта"}
            </span>
            <select
              value={mode}
              onChange={(event) => {
                setMode(event.target.value as PercentageMode);
                setProcessedSignature("");
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            >
              <option value="percentOf">{isEn ? "X% of Y" : "X% от Y"}</option>
              <option value="whatPercent">
                {isEn ? "X is what % of Y" : "Сколько процентов X от Y"}
              </option>
              <option value="change">
                {isEn ? "Percentage change from X to Y" : "Изменение от X к Y"}
              </option>
              <option value="increase">
                {isEn ? "Increase Y by X%" : "Увеличить Y на X%"}
              </option>
              <option value="decrease">
                {isEn ? "Decrease Y by X%" : "Уменьшить Y на X%"}
              </option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Decimal places" : "Знаков после запятой"}
            </span>
            <select
              value={precision}
              onChange={(event) => {
                setPrecision(Number(event.target.value));
                setProcessedSignature("");
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
            >
              {[0, 2, 4, 6, 10].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p className="font-mono">{formulaForMode(mode)}</p>
            <p className="mt-2">
              {isEn
                ? "Percentage change uses the absolute original value in the denominator. A zero denominator is undefined."
                : "Для процентного изменения в знаменателе используется модуль исходного значения. Нулевой знаменатель не определён."}
            </p>
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
