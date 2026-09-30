"use client";

import { useCallback, useMemo, useState } from "react";
import { CreditCard } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useUrlState } from "@/src/hooks/useUrlState";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type PaymentType = "annuity" | "differentiated";
type TermUnit = "years" | "months";

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

interface LoanResult {
  scheduledPayment: number;
  firstPayment: number;
  lastPayment: number;
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
  return (principal * monthlyRate * factor) / (factor - 1);
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

function calculateLoan(
  principal: number,
  annualRate: number,
  months: number,
  paymentType: PaymentType,
  extraMonthly: number,
): LoanResult {
  const monthlyRate = annualRate / 100 / 12;
  const scheduledPayment =
    paymentType === "annuity"
      ? annuityPayment(principal, annualRate, months)
      : principal / months;
  const rows: PaymentRow[] = [];
  let balance = principal;
  let totalPayment = 0;
  let totalInterest = 0;

  for (let month = 1; month <= months && balance > 0.005; month += 1) {
    const interest = balance * monthlyRate;
    let scheduledPrincipal: number;
    let scheduledTotal: number;

    if (paymentType === "annuity") {
      scheduledTotal = Math.min(scheduledPayment, balance + interest);
      scheduledPrincipal = Math.max(0, scheduledTotal - interest);
    } else {
      scheduledPrincipal = Math.min(scheduledPayment, balance);
      scheduledTotal = scheduledPrincipal + interest;
    }

    const extra = Math.min(
      extraMonthly,
      Math.max(0, balance - scheduledPrincipal),
    );
    const payment = scheduledTotal + extra;
    const principalPaid = Math.min(balance, scheduledPrincipal + extra);
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
    scheduledPayment,
    firstPayment:
      paymentType === "annuity"
        ? scheduledPayment
        : scheduledPayment + principal * monthlyRate,
    lastPayment: rows.at(-1)?.payment || 0,
    totalPayment,
    totalInterest,
    paidOffMonths: rows.length,
    rows,
    years: aggregateYears(rows),
  };
}

export default function LoanCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const { state: urlState, setState: setUrlState } = useUrlState({
    defaultValues: {
      amount: "",
      rate: "",
      term: "",
      type: "annuity" as PaymentType,
    },
  });

  const amountInput = urlState.amount;
  const rateInput = urlState.rate;
  const termInput = urlState.term;
  const paymentType = urlState.type;

  const setAmountInput = useCallback((val: string) => {
    setUrlState({ amount: val });
  }, [setUrlState]);
  const setRateInput = useCallback((val: string) => {
    setUrlState({ rate: val });
  }, [setUrlState]);
  const setTermInput = useCallback((val: string) => {
    setUrlState({ term: val });
  }, [setUrlState]);
  const setPaymentType = useCallback((val: PaymentType) => {
    setUrlState({ type: val });
  }, [setUrlState]);

  const [termUnit, setTermUnit] = useState<TermUnit>("years");
  const [extraInput, setExtraInput] = useState("0");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [precision, setPrecision] = useState(2);
  const [showSchedule, setShowSchedule] = useState(false);
  const [processedSignature, setProcessedSignature] = useState("");

  const amount = parseNonNegative(amountInput);
  const annualRate = parseNonNegative(rateInput);
  const termValue = parseNonNegative(termInput);
  const extraMonthly = parseNonNegative(extraInput);
  const months =
    termValue === null
      ? null
      : termUnit === "years"
        ? Math.round(termValue * 12)
        : Math.round(termValue);
  const termIsValid =
    termValue !== null &&
    termValue > 0 &&
    months !== null &&
    months >= 1 &&
    months <= 1200 &&
    (termUnit === "years" || Number.isInteger(termValue));
  const isValid =
    amount !== null &&
    amount > 0 &&
    annualRate !== null &&
    annualRate <= 100 &&
    termIsValid &&
    months !== null &&
    extraMonthly !== null;

  const calculation = useMemo(
    () =>
      isValid &&
      amount !== null &&
      annualRate !== null &&
      months !== null &&
      extraMonthly !== null
        ? calculateLoan(amount, annualRate, months, paymentType, extraMonthly)
        : null,
    [amount, annualRate, extraMonthly, isValid, months, paymentType],
  );

  const signature = JSON.stringify([
    amountInput,
    rateInput,
    termInput,
    termUnit,
    paymentType,
    extraInput,
    currencyLabel,
    precision,
  ]);
  const hasFreshResult =
    processedSignature === signature && processedSignature !== "";
  const suffix = currencyLabel.trim() ? " " + currencyLabel.trim() : "";
  const mainPayment =
    calculation === null
      ? ""
      : formatNumber(
          paymentType === "annuity"
            ? calculation.scheduledPayment
            : calculation.firstPayment,
          precision,
        );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="loan-amount" className="mb-1.5 block text-sm">
              {isEn ? "Loan amount" : "Сумма кредита"}
            </Label>
            <Input
              id="loan-amount"
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="10000"
              className={cn(
                "h-12 font-mono text-lg",
                amountInput.trim() &&
                  (amount === null || amount <= 0) &&
                  "border-[var(--color-danger)]/60",
              )}
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="loan-rate" className="mb-1.5 block text-sm">
              {isEn ? "Annual interest rate (%)" : "Годовая ставка (%)"}
            </Label>
            <Input
              id="loan-rate"
              type="text"
              inputMode="decimal"
              value={rateInput}
              onChange={(event) => setRateInput(event.target.value)}
              placeholder="8"
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
            <Label htmlFor="loan-term" className="mb-1.5 block text-sm">
              {termUnit === "years"
                ? isEn
                  ? "Term (years)"
                  : "Срок (лет)"
                : isEn
                  ? "Term (months)"
                  : "Срок (месяцев)"}
            </Label>
            <Input
              id="loan-term"
              type="text"
              inputMode="decimal"
              value={termInput}
              onChange={(event) => setTermInput(event.target.value)}
              placeholder={termUnit === "years" ? "5" : "60"}
              className={cn(
                "h-12 font-mono text-lg",
                termInput.trim() &&
                  !termIsValid &&
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
            leadingIcon={<CreditCard size={20} />}
          >
            {isEn ? "Calculate loan" : "Рассчитать кредит"}
          </ToolPrimaryAction>
        </div>

        <section
          className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-11 items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {paymentType === "annuity"
                ? isEn
                  ? "Scheduled monthly payment"
                  : "Ежемесячный платёж"
                : isEn
                  ? "First monthly payment"
                  : "Первый платёж"}
            </span>
            {hasFreshResult ? (
              <CopyButton text={mainPayment} size="medium" />
            ) : null}
          </div>
          <p className="break-all font-mono text-2xl font-bold">
            {hasFreshResult
              ? mainPayment + suffix
              : isEn
                ? "Result appears here"
                : "Здесь появится результат"}
          </p>

          {hasFreshResult && calculation ? (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-[var(--color-border)] pt-3 text-sm sm:grid-cols-3">
              {paymentType === "differentiated" ? (
                <p>
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Last payment" : "Последний платёж"}
                  </span>
                  <strong className="font-mono">
                    {formatNumber(calculation.lastPayment, precision) + suffix}
                  </strong>
                </p>
              ) : (
                <p>
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Total paid" : "Всего выплачено"}
                  </span>
                  <strong className="font-mono">
                    {formatNumber(calculation.totalPayment, precision) + suffix}
                  </strong>
                </p>
              )}
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
        title={isEn ? "Loan details" : "Дополнительные настройки"}
        description={
          isEn
            ? "Payment type, term units, extra payments and schedule"
            : "Тип платежей, единицы срока, досрочные платежи и график"
        }
      >
        <div className="space-y-5 [&_input]:min-h-11 [&_select]:min-h-11">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1.5 block">
                {isEn ? "Payment type" : "Тип платежей"}
              </span>
              <select
                value={paymentType}
                onChange={(event) => {
                  setPaymentType(event.target.value as PaymentType);
                  setProcessedSignature("");
                }}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                <option value="annuity">
                  {isEn ? "Annuity" : "Аннуитетные"}
                </option>
                <option value="differentiated">
                  {isEn ? "Differentiated" : "Дифференцированные"}
                </option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1.5 block">
                {isEn ? "Term unit" : "Единица срока"}
              </span>
              <select
                value={termUnit}
                onChange={(event) => {
                  setTermUnit(event.target.value as TermUnit);
                  setProcessedSignature("");
                }}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
              >
                <option value="years">{isEn ? "Years" : "Годы"}</option>
                <option value="months">{isEn ? "Months" : "Месяцы"}</option>
              </select>
            </label>

            <div>
              <Label htmlFor="loan-extra" className="mb-1.5 block text-sm">
                {isEn ? "Extra payment each month" : "Досрочный платёж в месяц"}
              </Label>
              <Input
                id="loan-extra"
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
              <Label htmlFor="loan-currency" className="mb-1.5 block text-sm">
                {isEn ? "Currency label (optional)" : "Обозначение валюты"}
              </Label>
              <Input
                id="loan-currency"
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
              {paymentType === "annuity"
                ? "payment = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)"
                : "principal each month = P ÷ n; interest = balance × r"}
            </p>
            <p className="mt-2">
              {isEn
                ? "Monthly compounding is assumed. Extra payments reduce principal after the scheduled payment. Fees, insurance, penalties, changing rates and lender-specific rounding are not included."
                : "Предполагается ежемесячное начисление. Досрочный платёж уменьшает основной долг после планового платежа. Комиссии, страхование, штрафы, изменение ставки и округление кредитора не учитываются."}
            </p>
            <p className="mt-2">
              {isEn
                ? "This educational estimate is not a lending offer."
                : "Справочный расчёт не является кредитным предложением."}
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
