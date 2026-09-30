"use client";

import { useState } from "react";
import { Receipt } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type TaxPeriod = "monthly" | "annual";

function parseNonNegative(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatNumber(value: number, precision: number): string {
  if (Object.is(value, -0) || Math.abs(value) < 1e-14) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e15 || absolute < 10 ** -(precision + 2)) {
    return value.toExponential(Math.max(2, precision));
  }
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

export default function TaxCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [incomeInput, setIncomeInput] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [deductionsInput, setDeductionsInput] = useState("0");
  const [period, setPeriod] = useState<TaxPeriod>("annual");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [precision, setPrecision] = useState(2);
  const [processedSignature, setProcessedSignature] = useState("");

  const income = parseNonNegative(incomeInput);
  const rate = parseNonNegative(rateInput);
  const deductions = parseNonNegative(deductionsInput);
  const rateIsValid = rate !== null && rate <= 100;
  const isValid = income !== null && rateIsValid && deductions !== null;
  const taxableIncome =
    isValid && income !== null && deductions !== null
      ? Math.max(0, income - deductions)
      : null;
  const tax =
    taxableIncome === null || rate === null
      ? null
      : (taxableIncome * rate) / 100;
  const net = tax === null || income === null ? null : income - tax;
  const formattedTax = tax === null ? "" : formatNumber(tax, precision);
  const formattedNet = net === null ? "" : formatNumber(net, precision);
  const formattedTaxable =
    taxableIncome === null ? "" : formatNumber(taxableIncome, precision);
  const suffix = currencyLabel.trim() ? " " + currencyLabel.trim() : "";
  const signature = JSON.stringify([
    incomeInput,
    rateInput,
    deductionsInput,
    period,
    currencyLabel,
    precision,
  ]);
  const hasFreshResult =
    processedSignature === signature && processedSignature !== "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="tax-income" className="mb-1.5 block text-sm">
              {period === "monthly"
                ? isEn
                  ? "Monthly income"
                  : "Доход за месяц"
                : isEn
                  ? "Annual income"
                  : "Доход за год"}
            </Label>
            <Input
              id="tax-income"
              type="text"
              inputMode="decimal"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
              placeholder="50000"
              className={cn(
                "h-12 font-mono text-lg",
                incomeInput.trim() &&
                  income === null &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="tax-rate" className="mb-1.5 block text-sm">
              {isEn ? "Tax rate (%)" : "Ставка налога (%)"}
            </Label>
            <Input
              id="tax-rate"
              type="text"
              inputMode="decimal"
              value={rateInput}
              onChange={(event) => setRateInput(event.target.value)}
              placeholder="20"
              className={cn(
                "h-12 font-mono text-lg",
                rateInput.trim() &&
                  !rateIsValid &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>
        </div>

        {rate !== null && rate > 100 ? (
          <p className="mt-2 text-sm text-[var(--color-danger)]">
            {isEn
              ? "Enter a rate from 0% to 100%."
              : "Введите ставку от 0% до 100%."}
          </p>
        ) : null}

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            onClick={() => setProcessedSignature(signature)}
            disabled={!isValid}
            leadingIcon={<Receipt size={20} />}
          >
            {isEn ? "Estimate tax" : "Рассчитать налог"}
          </ToolPrimaryAction>
        </div>

        <section
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {period === "monthly"
                ? isEn
                  ? "Estimated monthly tax"
                  : "Расчётный налог за месяц"
                : isEn
                  ? "Estimated annual tax"
                  : "Расчётный налог за год"}
            </span>
            {hasFreshResult ? (
              <CopyButton text={formattedTax} size="medium" />
            ) : null}
          </div>
          <p className="break-all font-mono text-2xl font-bold">
            {hasFreshResult
              ? formattedTax + suffix
              : isEn
                ? "Result appears here"
                : "Здесь появится результат"}
          </p>
          {hasFreshResult ? (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[var(--color-border)] pt-3 text-sm sm:grid-cols-2">
              <p>
                <span className="text-[var(--color-text-muted)]">
                  {isEn ? "Taxable income: " : "Налоговая база: "}
                </span>
                <strong className="font-mono">
                  {formattedTaxable + suffix}
                </strong>
              </p>
              <p>
                <span className="text-[var(--color-text-muted)]">
                  {isEn ? "After tax: " : "После налога: "}
                </span>
                <strong className="font-mono">{formattedNet + suffix}</strong>
              </p>
            </div>
          ) : null}
        </section>
      </Card>

      <AdvancedSettings
        title={isEn ? "More tax options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Deductions, period, display and calculation limits"
            : "Вычеты, период, отображение и ограничения расчёта"
        }
      >
        <div className="space-y-5 [&_input]:min-h-11 [&_select]:min-h-11">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax-deductions" className="mb-1.5 block text-sm">
                {isEn
                  ? "Deductions in the same period"
                  : "Вычеты за тот же период"}
              </Label>
              <Input
                id="tax-deductions"
                type="text"
                inputMode="decimal"
                value={deductionsInput}
                onChange={(event) => setDeductionsInput(event.target.value)}
                className={cn(
                  "font-mono",
                  deductionsInput.trim() &&
                    deductions === null &&
                    "border-[var(--color-danger)]/60",
                )}
              />
            </div>

            <label className="text-sm">
              <span className="mb-1.5 block">
                {isEn ? "Income period" : "Период дохода"}
              </span>
              <select
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value as TaxPeriod);
                  setProcessedSignature("");
                }}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                <option value="monthly">{isEn ? "Monthly" : "Месяц"}</option>
                <option value="annual">{isEn ? "Annual" : "Год"}</option>
              </select>
            </label>

            <div>
              <Label htmlFor="tax-currency" className="mb-1.5 block text-sm">
                {isEn
                  ? "Currency label (optional)"
                  : "Обозначение валюты (необязательно)"}
              </Label>
              <Input
                id="tax-currency"
                value={currencyLabel}
                onChange={(event) =>
                  setCurrencyLabel(event.target.value.slice(0, 8))
                }
                placeholder={isEn ? "Currency" : "Валюта"}
              />
            </div>

            <label className="text-sm">
              <span className="mb-1.5 block">
                {isEn ? "Decimal places" : "Знаков после запятой"}
              </span>
              <select
                value={precision}
                onChange={(event) => {
                  setPrecision(Number(event.target.value));
                  setProcessedSignature("");
                }}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                {[0, 2, 4, 6].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p className="font-mono">
              taxable income = max(0, income − deductions)
            </p>
            <p className="font-mono">tax = taxable income × rate ÷ 100</p>
            <p className="mt-3 font-medium text-[var(--color-text)]">
              {isEn ? "Important limitation" : "Важное ограничение"}
            </p>
            <p className="mt-1">
              {isEn
                ? "This is a generic flat-rate estimate, not legal or tax advice. It does not model progressive brackets, payroll contributions, credits, filing status, local rules or exemptions. Enter a rate and deductions appropriate to your own situation."
                : "Это общий расчёт по единой ставке, а не юридическая или налоговая консультация. Он не учитывает прогрессивные шкалы, взносы, льготы, статус декларации, местные правила и исключения. Укажите ставку и вычеты для своей ситуации."}
            </p>
          </div>
        </div>
      </AdvancedSettings>
    </div>
  );
}
