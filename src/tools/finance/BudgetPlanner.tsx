"use client";

import { useState } from "react";
import { Calculator, XCircle } from "@phosphor-icons/react";
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

type BudgetErrorCode = "empty" | "invalid" | "negative" | "range";
type BudgetField = "income" | "spending";

type BudgetResult =
  | {
      kind: "budget";
      income: number;
      spending: number;
      balance: number;
      savingsRate: number | null;
      overBudget: boolean;
    }
  | {
      kind: "error";
      code: BudgetErrorCode;
      field: BudgetField;
    };

class BudgetInputError extends Error {
  code: BudgetErrorCode;
  field: BudgetField;

  constructor(code: BudgetErrorCode, field: BudgetField) {
    super(code);
    this.name = "BudgetInputError";
    this.code = code;
    this.field = field;
  }
}

function parseAmount(value: string, field: BudgetField): number {
  const trimmed = value.trim();
  if (!trimmed) throw new BudgetInputError("empty", field);
  const parsed = parseUserNumber(trimmed);
  if (parsed === null) {
    throw new BudgetInputError("invalid", field);
  }
  if (!Number.isFinite(parsed)) {
    throw new BudgetInputError("range", field);
  }
  if (parsed < 0) throw new BudgetInputError("negative", field);
  return parsed;
}

function calculateBudget(
  incomeInput: string,
  spendingInput: string,
): BudgetResult {
  try {
    const income = parseAmount(incomeInput, "income");
    const spending = parseAmount(spendingInput, "spending");
    const balance = income - spending;
    const savingsRate = income === 0 ? null : (balance / income) * 100;

    if (
      !Number.isFinite(balance) ||
      (savingsRate !== null && !Number.isFinite(savingsRate))
    ) {
      throw new BudgetInputError("range", "spending");
    }

    return {
      kind: "budget",
      income,
      spending,
      balance,
      savingsRate,
      overBudget: balance < 0,
    };
  } catch (caught) {
    if (caught instanceof BudgetInputError) {
      return { kind: "error", code: caught.code, field: caught.field };
    }
    return { kind: "error", code: "invalid", field: "income" };
  }
}

function formatPercent(value: number): string {
  if (Object.is(value, -0) || value === 0) return "0";
  return Number(value.toPrecision(6)).toString();
}

function errorMessage(
  result: Extract<BudgetResult, { kind: "error" }>,
  isEn: boolean,
): string {
  const field = isEn
    ? result.field === "income"
      ? "Monthly income"
      : "Monthly spending"
    : result.field === "income"
      ? "Месячный доход"
      : "Месячные расходы";

  if (result.code === "empty") {
    return isEn ? field + " is required." : field + ": заполните поле.";
  }
  if (result.code === "negative") {
    return isEn
      ? field + " cannot be negative."
      : result.field === "income"
        ? "Месячный доход не может быть отрицательным."
        : "Месячные расходы не могут быть отрицательными.";
  }
  if (result.code === "range") {
    return isEn
      ? field + " exceeds the finite calculation range."
      : result.field === "income"
        ? "Месячный доход выходит за конечный диапазон вычислений."
        : "Месячные расходы выходят за конечный диапазон вычислений.";
  }
  return isEn
    ? field + " must be a valid number."
    : field + ": введите корректное число.";
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
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
            : tone === "negative"
              ? "text-[var(--color-danger)]"
              : "text-[var(--color-text)]")
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default function BudgetPlanner() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [income, setIncome] = useState("");
  const [spending, setSpending] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [result, setResult] = useState<BudgetResult | null>(null);

  const formatMoney = (value: number) =>
    new Intl.NumberFormat(isEn ? "en-US" : "ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div
      data-finance-tool="budget-planner"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {isEn ? "Check your monthly balance" : "Проверьте месячный баланс"}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Enter total monthly income and total monthly spending."
            : "Введите общий месячный доход и общие месячные расходы."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(calculateBudget(income, spending));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="budget-income">
                {isEn ? "Monthly income" : "Месячный доход"}
              </Label>
              <Input
                id="budget-income"
                value={income}
                onChange={(event) => {
                  setIncome(event.target.value);
                  setResult(null);
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="budget-spending">
                {isEn ? "Total monthly spending" : "Общие месячные расходы"}
              </Label>
              <Input
                id="budget-spending"
                value={spending}
                onChange={(event) => {
                  setSpending(event.target.value);
                  setResult(null);
                }}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="mt-2 font-mono"
              />
            </div>
          </div>

          <ToolPrimaryAction
            type="submit"
            disabled={!income.trim() || !spending.trim()}
            className="mt-4"
            leadingIcon={<Calculator size={20} weight="bold" />}
          >
            {isEn ? "Calculate budget" : "Рассчитать бюджет"}
          </ToolPrimaryAction>
        </form>
      </section>

      {result ? (
        result.kind === "error" ? (
          <section
            aria-live="polite"
            data-budget-result=""
            data-budget-status="error"
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
                  {isEn ? "Check the amounts" : "Проверьте суммы"}
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
            data-budget-result=""
            data-budget-status={result.overBudget ? "over" : "within"}
            data-budget-balance={result.balance}
            data-budget-savings-rate={
              result.savingsRate === null
                ? ""
                : formatPercent(result.savingsRate)
            }
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
          >
            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {isEn ? "Monthly summary" : "Итог за месяц"}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <SummaryItem
                label={isEn ? "Balance" : "Баланс"}
                value={formatMoney(result.balance)}
                tone={result.overBudget ? "negative" : "positive"}
              />
              <SummaryItem
                label={isEn ? "Savings rate" : "Доля остатка"}
                value={
                  result.savingsRate === null
                    ? "—"
                    : formatPercent(result.savingsRate) + "%"
                }
                tone={
                  result.savingsRate === null
                    ? undefined
                    : result.savingsRate < 0
                      ? "negative"
                      : "positive"
                }
              />
              <SummaryItem
                label={isEn ? "Status" : "Статус"}
                value={
                  result.overBudget
                    ? isEn
                      ? "Over by " + formatMoney(Math.abs(result.balance))
                      : "Перерасход " + formatMoney(Math.abs(result.balance))
                    : isEn
                      ? "Within budget"
                      : "В пределах бюджета"
                }
                tone={result.overBudget ? "negative" : "positive"}
              />
            </dl>
            {result.savingsRate === null ? (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                {isEn
                  ? "Savings rate is undefined when monthly income is zero."
                  : "Доля остатка не определяется при нулевом месячном доходе."}
              </p>
            ) : null}
          </section>
        )
      ) : null}

      <AdvancedSettings
        title={isEn ? "Display and budgeting note" : "Отображение и примечание"}
        description={
          isEn
            ? "Currency and optional 50/30/20 reference"
            : "Валюта и необязательный ориентир 50/30/20"
        }
      >
        <Label htmlFor="budget-currency">{isEn ? "Currency" : "Валюта"}</Label>
        <select
          id="budget-currency"
          value={currency}
          onChange={(event) => {
            setCurrency(event.target.value as Currency);
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
        >
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="RUB">RUB (₽)</option>
          <option value="KZT">KZT (₸)</option>
        </select>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "The 50/30/20 split is one optional budgeting guideline, not a rule or personalized recommendation."
            : "Схема 50/30/20 — лишь один необязательный ориентир, а не правило или персональная рекомендация."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
