"use client";

import { useMemo, useState } from "react";
import { House } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

interface PaymentRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface YearRow {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface MortgageResult {
  propertyPrice: number;
  downPayment: number;
  principal: number;
  months: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paidOffMonths: number;
  rows: PaymentRow[];
  years: YearRow[];
}

function parseNonNegative(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^[+]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatNumber(value: number, precision: number): string {
  if (Object.is(value, -0) || Math.abs(value) < 1e-12) return "0";
  const absolute = Math.abs(value);
  if (absolute >= 1e15 || absolute < 10 ** -(precision + 2)) {
    return value.toExponential(Math.max(2, precision));
  }
  return value.toFixed(precision).replace(/\.?0+$/, "");
}

function annuityPayment(
  principal: number,
  annualRate: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = (1 + monthlyRate) ** months;
  if (!Number.isFinite(factor)) {
    return principal * monthlyRate;
  }
  return (principal * monthlyRate * factor) / (factor - 1);
}

function buildAnnuitySchedule(
  principal: number,
  annualRate: number,
  months: number,
  extraMonthly: number,
): {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paidOffMonths: number;
  rows: PaymentRow[];
} {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = annuityPayment(principal, annualRate, months);
  const rows: PaymentRow[] = [];
  let balance = principal;
  let totalPayment = 0;
  let totalInterest = 0;

  for (let month = 1; month <= months && balance > 0.005; month += 1) {
    const interest = balance * monthlyRate;
    const scheduledPayment = Math.min(monthlyPayment, balance + interest);
    const scheduledPrincipal = Math.max(0, scheduledPayment - interest);
    const extra = Math.min(
      extraMonthly,
      Math.max(0, balance - scheduledPrincipal),
    );
    const payment = scheduledPayment + extra;
    const principalPaid = Math.min(balance, payment - interest);
    balance = Math.max(0, balance - principalPaid);
    totalPayment += payment;
    totalInterest += interest;
    rows.push({
      month,
      payment,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    paidOffMonths: rows.length,
    rows,
  };
}

function aggregateYears(rows: PaymentRow[]): YearRow[] {
  const years = new Map<number, YearRow>();

  for (const row of rows) {
    const year = Math.ceil(row.month / 12);
    const current = years.get(year) || {
      year,
      payment: 0,
      principal: 0,
      interest: 0,
      balance: row.balance,
    };
    current.payment += row.payment;
    current.principal += row.principal;
    current.interest += row.interest;
    current.balance = row.balance;
    years.set(year, current);
  }

  return Array.from(years.values());
}

function calculateMortgage(
  propertyPrice: number,
  downPaymentPercent: number,
  annualRate: number,
  termYears: number,
  extraMonthly: number,
): MortgageResult {
  const months = Math.max(1, Math.round(termYears * 12));
  const downPayment = (propertyPrice * downPaymentPercent) / 100;
  const principal = Math.max(0, propertyPrice - downPayment);
  const schedule = buildAnnuitySchedule(
    principal,
    annualRate,
    months,
    extraMonthly,
  );

  return {
    propertyPrice,
    downPayment,
    principal,
    months,
    monthlyPayment: schedule.monthlyPayment,
    totalPayment: schedule.totalPayment,
    totalInterest: schedule.totalInterest,
    paidOffMonths: schedule.paidOffMonths,
    rows: schedule.rows,
    years: aggregateYears(schedule.rows),
  };
}

export default function MortgageCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [priceInput, setPriceInput] = useState("");
  const [downPaymentInput, setDownPaymentInput] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [termInput, setTermInput] = useState("");
  const [extraInput, setExtraInput] = useState("0");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [precision, setPrecision] = useState(2);
  const [showSchedule, setShowSchedule] = useState(false);
  const [processedSignature, setProcessedSignature] = useState("");

  const price = parseNonNegative(priceInput);
  const downPaymentPercent = parseNonNegative(downPaymentInput);
  const annualRate = parseNonNegative(rateInput);
  const termYears = parseNonNegative(termInput);
  const extraMonthly = parseNonNegative(extraInput);
  const isValid =
    price !== null &&
    price > 0 &&
    downPaymentPercent !== null &&
    downPaymentPercent >= 0 &&
    downPaymentPercent < 100 &&
    annualRate !== null &&
    annualRate <= 100 &&
    termYears !== null &&
    termYears > 0 &&
    termYears <= 100 &&
    extraMonthly !== null;

  const calculation = useMemo(
    () =>
      isValid &&
      price !== null &&
      downPaymentPercent !== null &&
      annualRate !== null &&
      termYears !== null &&
      extraMonthly !== null
        ? calculateMortgage(
            price,
            downPaymentPercent,
            annualRate,
            termYears,
            extraMonthly,
          )
        : null,
    [annualRate, downPaymentPercent, extraMonthly, isValid, price, termYears],
  );

  const signature = JSON.stringify([
    priceInput,
    downPaymentInput,
    rateInput,
    termInput,
    extraInput,
    currencyLabel,
    precision,
  ]);
  const hasFreshResult =
    processedSignature === signature && processedSignature !== "";
  const suffix = currencyLabel.trim() ? " " + currencyLabel.trim() : "";
  const monthlyPayment = calculation
    ? formatNumber(calculation.monthlyPayment, precision)
    : "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mortgage-price" className="mb-1.5 block text-sm">
              {isEn ? "Property price" : "Стоимость недвижимости"}
            </Label>
            <Input
              id="mortgage-price"
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="300000"
              className={cn(
                "h-12 font-mono text-lg",
                priceInput.trim() &&
                  (price === null || price <= 0) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label
              htmlFor="mortgage-down-payment"
              className="mb-1.5 block text-sm"
            >
              {isEn ? "Down payment (%)" : "Первоначальный взнос (%)"}
            </Label>
            <Input
              id="mortgage-down-payment"
              type="text"
              inputMode="decimal"
              value={downPaymentInput}
              onChange={(event) => setDownPaymentInput(event.target.value)}
              placeholder="20"
              className={cn(
                "h-12 font-mono text-lg",
                downPaymentInput.trim() &&
                  (downPaymentPercent === null || downPaymentPercent >= 100) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="mortgage-rate" className="mb-1.5 block text-sm">
              {isEn ? "Annual interest rate (%)" : "Годовая ставка (%)"}
            </Label>
            <Input
              id="mortgage-rate"
              type="text"
              inputMode="decimal"
              value={rateInput}
              onChange={(event) => setRateInput(event.target.value)}
              placeholder="6"
              className={cn(
                "h-12 font-mono text-lg",
                rateInput.trim() &&
                  (annualRate === null || annualRate > 100) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="mortgage-term" className="mb-1.5 block text-sm">
              {isEn ? "Term (years)" : "Срок (лет)"}
            </Label>
            <Input
              id="mortgage-term"
              type="text"
              inputMode="decimal"
              value={termInput}
              onChange={(event) => setTermInput(event.target.value)}
              placeholder="30"
              className={cn(
                "h-12 font-mono text-lg",
                termInput.trim() &&
                  (termYears === null || termYears <= 0 || termYears > 100) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="mt-4">
          <ToolPrimaryAction
            type="button"
            onClick={() => setProcessedSignature(signature)}
            disabled={!calculation}
            leadingIcon={<House size={20} />}
          >
            {isEn ? "Calculate mortgage" : "Рассчитать ипотеку"}
          </ToolPrimaryAction>
        </div>

        <section
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {isEn ? "Scheduled monthly payment" : "Ежемесячный платёж"}
            </span>
            {hasFreshResult ? (
              <CopyButton text={monthlyPayment} size="medium" />
            ) : null}
          </div>
          <p className="break-all font-mono text-2xl font-bold">
            {hasFreshResult
              ? monthlyPayment + suffix
              : isEn
                ? "Result appears here"
                : "Здесь появится результат"}
          </p>

          {hasFreshResult && calculation ? (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[var(--color-border)] pt-3 text-sm sm:grid-cols-3">
              <p>
                <span className="block text-[var(--color-text-muted)]">
                  {isEn ? "Loan amount" : "Сумма кредита"}
                </span>
                <strong className="font-mono">
                  {formatNumber(calculation.principal, precision) + suffix}
                </strong>
              </p>
              <p>
                <span className="block text-[var(--color-text-muted)]">
                  {isEn ? "Total interest" : "Всего процентов"}
                </span>
                <strong className="font-mono">
                  {formatNumber(calculation.totalInterest, precision) + suffix}
                </strong>
              </p>
              <p>
                <span className="block text-[var(--color-text-muted)]">
                  {isEn ? "Payoff time" : "Срок погашения"}
                </span>
                <strong>
                  {calculation.paidOffMonths + " " + (isEn ? "months" : "мес.")}
                </strong>
              </p>
            </div>
          ) : null}
        </section>
      </Card>

      <AdvancedSettings
        title={isEn ? "Mortgage details" : "Дополнительные настройки"}
        description={
          isEn
            ? "Extra payments, yearly schedule, display and assumptions"
            : "Досрочные платежи, годовой график, отображение и допущения"
        }
      >
        <div className="space-y-5 [&_input]:min-h-11 [&_select]:min-h-11">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="mortgage-extra" className="mb-1.5 block text-sm">
                {isEn ? "Extra payment each month" : "Досрочный платёж в месяц"}
              </Label>
              <Input
                id="mortgage-extra"
                type="text"
                inputMode="decimal"
                value={extraInput}
                onChange={(event) => setExtraInput(event.target.value)}
                className={cn(
                  "font-mono",
                  extraInput.trim() &&
                    extraMonthly === null &&
                    "border-[var(--color-danger)]/60",
                )}
              />
            </div>

            <div>
              <Label
                htmlFor="mortgage-currency"
                className="mb-1.5 block text-sm"
              >
                {isEn ? "Currency label (optional)" : "Обозначение валюты"}
              </Label>
              <Input
                id="mortgage-currency"
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

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={showSchedule}
              onChange={(event) => setShowSchedule(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            {isEn ? "Show yearly payment schedule" : "Показать годовой график"}
          </label>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            <p className="font-mono">
              payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)
            </p>
            <p className="mt-2">
              {isEn
                ? "Annuity calculation with monthly compounding. Extra payments reduce principal after the scheduled payment and shorten the term. Fees, insurance, taxes, changing rates and lender-specific rounding are not included."
                : "Аннуитетный расчёт с ежемесячным начислением. Досрочный платёж уменьшает основной долг после планового платежа и сокращает срок. Комиссии, страхование, налоги, изменение ставки и округление кредитора не учитываются."}
            </p>
            <p className="mt-2">
              {isEn
                ? "This estimate is informational and is not a lending offer or approval."
                : "Расчёт справочный и не является кредитным предложением или одобрением."}
            </p>
          </div>

          {showSchedule && calculation ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "Yearly schedule" : "График по годам"}
              </p>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {calculation.years.map((row) => (
                  <div
                    key={row.year}
                    className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm sm:grid-cols-4"
                  >
                    <p>
                      <span className="block text-[var(--color-text-muted)]">
                        {isEn ? "Year" : "Год"}
                      </span>
                      <strong>{row.year}</strong>
                    </p>
                    <p>
                      <span className="block text-[var(--color-text-muted)]">
                        {isEn ? "Paid" : "Платежи"}
                      </span>
                      <strong className="font-mono">
                        {formatNumber(row.payment, precision) + suffix}
                      </strong>
                    </p>
                    <p>
                      <span className="block text-[var(--color-text-muted)]">
                        {isEn ? "Interest" : "Проценты"}
                      </span>
                      <strong className="font-mono">
                        {formatNumber(row.interest, precision) + suffix}
                      </strong>
                    </p>
                    <p>
                      <span className="block text-[var(--color-text-muted)]">
                        {isEn ? "Balance" : "Остаток"}
                      </span>
                      <strong className="font-mono">
                        {formatNumber(row.balance, precision) + suffix}
                      </strong>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </AdvancedSettings>
    </div>
  );
}
