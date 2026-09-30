"use client";

import { useState } from "react";
import { Calculator } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

interface DiscountResult {
  originalPrice: number;
  firstDiscount: number;
  secondDiscount: number;
  tax: number;
  cashback: number;
  afterFirstDiscount: number;
  discountedPrice: number;
  discountSavings: number;
  taxAmount: number;
  finalPrice: number;
  cashbackAmount: number;
  effectiveCost: number;
  currencyLabel: string;
}

function parseDecimal(value: string): number {
  if (!value.trim()) return Number.NaN;
  return Number(value.trim().replace(",", "."));
}

function parseOptionalPercent(value: string): number {
  return value.trim() ? parseDecimal(value) : 0;
}

function percentValid(value: string, optional = false): boolean {
  if (optional && !value.trim()) return true;
  const number = parseDecimal(value);
  return Number.isFinite(number) && number >= 0 && number <= 100;
}

function calculateDiscount(
  originalPrice: number,
  firstDiscount: number,
  secondDiscount: number,
  tax: number,
  cashback: number,
  currencyLabel: string,
): DiscountResult {
  const afterFirstDiscount = originalPrice * (1 - firstDiscount / 100);
  const discountedPrice = afterFirstDiscount * (1 - secondDiscount / 100);
  const discountSavings = originalPrice - discountedPrice;
  const taxAmount = discountedPrice * (tax / 100);
  const finalPrice = discountedPrice + taxAmount;
  const cashbackAmount = finalPrice * (cashback / 100);
  const effectiveCost = finalPrice - cashbackAmount;

  return {
    originalPrice,
    firstDiscount,
    secondDiscount,
    tax,
    cashback,
    afterFirstDiscount,
    discountedPrice,
    discountSavings,
    taxAmount,
    finalPrice,
    cashbackAmount,
    effectiveCost,
    currencyLabel: currencyLabel.trim(),
  };
}

function formatAmount(
  value: number,
  currencyLabel: string,
  locale: string,
): string {
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  const label = currencyLabel.trim();
  return label ? `${label} ${formatted}` : formatted;
}

export default function DiscountCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const numberLocale = isEn ? "en-US" : "ru-RU";
  const [priceInput, setPriceInput] = useState("100");
  const [discountInput, setDiscountInput] = useState("20");
  const [secondDiscountInput, setSecondDiscountInput] = useState("");
  const [taxInput, setTaxInput] = useState("");
  const [cashbackInput, setCashbackInput] = useState("");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [result, setResult] = useState<DiscountResult | null>(null);

  const price = parseDecimal(priceInput);
  const firstDiscount = parseDecimal(discountInput);
  const secondDiscount = parseOptionalPercent(secondDiscountInput);
  const tax = parseOptionalPercent(taxInput);
  const cashback = parseOptionalPercent(cashbackInput);
  const priceValid = Number.isFinite(price) && price >= 0;
  const firstDiscountValid = percentValid(discountInput);
  const secondDiscountValid = percentValid(secondDiscountInput, true);
  const taxValid = percentValid(taxInput, true);
  const cashbackValid = percentValid(cashbackInput, true);
  const formValid =
    priceValid &&
    firstDiscountValid &&
    secondDiscountValid &&
    taxValid &&
    cashbackValid;
  const formula = formValid
    ? calculateDiscount(
        price,
        firstDiscount,
        secondDiscount,
        tax,
        cashback,
        currencyLabel,
      )
    : null;

  const resetResult = () => setResult(null);

  const calculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formula) return;
    setResult(formula);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form onSubmit={calculate} noValidate className="space-y-4">
        <Card className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="discount-price">
                {isEn ? "Original price" : "Исходная цена"}
              </Label>
              <Input
                id="discount-price"
                value={priceInput}
                onChange={(event) => {
                  setPriceInput(event.target.value);
                  resetResult();
                }}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={priceInput.trim().length > 0 && !priceValid}
                aria-describedby="discount-price-error"
                className={cn(
                  "mt-1.5 h-12 min-w-0 font-mono text-base",
                  priceInput.trim().length > 0 &&
                    !priceValid &&
                    "border-[var(--color-danger)]",
                )}
              />
              <p
                id="discount-price-error"
                className="mt-1.5 min-h-4 text-xs text-[var(--color-text-muted)]"
              >
                {priceInput.trim().length > 0 && !priceValid
                  ? isEn
                    ? "Price cannot be negative."
                    : "Цена не может быть отрицательной."
                  : isEn
                    ? "Dot or comma decimals are accepted."
                    : "Можно использовать точку или запятую."}
              </p>
            </div>

            <div className="min-w-0">
              <Label htmlFor="discount-percent">
                {isEn ? "Discount" : "Скидка"}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="discount-percent"
                  value={discountInput}
                  onChange={(event) => {
                    setDiscountInput(event.target.value);
                    resetResult();
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={
                    discountInput.trim().length > 0 && !firstDiscountValid
                  }
                  aria-describedby="discount-percent-error"
                  className={cn(
                    "h-12 min-w-0 pr-10 font-mono text-base",
                    discountInput.trim().length > 0 &&
                      !firstDiscountValid &&
                      "border-[var(--color-danger)]",
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
              <p
                id="discount-percent-error"
                className="mt-1.5 min-h-4 text-xs text-[var(--color-text-muted)]"
              >
                {discountInput.trim().length > 0 && !firstDiscountValid
                  ? isEn
                    ? "Use a percentage from 0 to 100."
                    : "Укажите процент от 0 до 100."
                  : isEn
                    ? "From 0% to 100%."
                    : "От 0% до 100%."}
              </p>
            </div>
          </div>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<Calculator size={20} />}
        >
          {isEn ? "Calculate discount" : "Рассчитать скидку"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={
            isEn
              ? "Second discount, tax and cashback"
              : "Вторая скидка, налог и кэшбэк"
          }
          description={
            isEn
              ? "Optional sequential adjustments, currency label and full formula"
              : "Необязательные последовательные операции, валюта и полная формула"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="discount-second">
                {isEn ? "Second discount" : "Вторая скидка"}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="discount-second"
                  value={secondDiscountInput}
                  onChange={(event) => {
                    setSecondDiscountInput(event.target.value);
                    resetResult();
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={!secondDiscountValid}
                  aria-describedby="discount-second-help"
                  className={cn(
                    "h-11 pr-10 font-mono",
                    !secondDiscountValid && "border-[var(--color-danger)]",
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
              <p
                id="discount-second-help"
                className={cn(
                  "mt-1 text-xs text-[var(--color-text-muted)]",
                  !secondDiscountValid && "text-[var(--color-danger)]",
                )}
              >
                {!secondDiscountValid
                  ? isEn
                    ? "Use a percentage from 0 to 100."
                    : "Укажите процент от 0 до 100."
                  : isEn
                    ? "Applied after the first discount."
                    : "Применяется после первой скидки."}
              </p>
            </div>

            <div>
              <Label htmlFor="discount-tax">{isEn ? "Tax" : "Налог"}</Label>
              <div className="relative mt-1.5">
                <Input
                  id="discount-tax"
                  value={taxInput}
                  onChange={(event) => {
                    setTaxInput(event.target.value);
                    resetResult();
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={!taxValid}
                  aria-describedby="discount-tax-help"
                  className={cn(
                    "h-11 pr-10 font-mono",
                    !taxValid && "border-[var(--color-danger)]",
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
              <p
                id="discount-tax-help"
                className={cn(
                  "mt-1 text-xs text-[var(--color-text-muted)]",
                  !taxValid && "text-[var(--color-danger)]",
                )}
              >
                {!taxValid
                  ? isEn
                    ? "Use a percentage from 0 to 100."
                    : "Укажите процент от 0 до 100."
                  : isEn
                    ? "Added after both discounts."
                    : "Добавляется после обеих скидок."}
              </p>
            </div>

            <div>
              <Label htmlFor="discount-cashback">
                {isEn ? "Cashback" : "Кэшбэк"}
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="discount-cashback"
                  value={cashbackInput}
                  onChange={(event) => {
                    setCashbackInput(event.target.value);
                    resetResult();
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={!cashbackValid}
                  aria-describedby="discount-cashback-help"
                  className={cn(
                    "h-11 pr-10 font-mono",
                    !cashbackValid && "border-[var(--color-danger)]",
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
              <p
                id="discount-cashback-help"
                className={cn(
                  "mt-1 text-xs text-[var(--color-text-muted)]",
                  !cashbackValid && "text-[var(--color-danger)]",
                )}
              >
                {!cashbackValid
                  ? isEn
                    ? "Use a percentage from 0 to 100."
                    : "Укажите процент от 0 до 100."
                  : isEn
                    ? "Calculated from the after-tax price."
                    : "Считается от цены после налога."}
              </p>
            </div>

            <div>
              <Label htmlFor="discount-currency-label">
                {isEn
                  ? "Currency label (optional)"
                  : "Обозначение валюты (необязательно)"}
              </Label>
              <Input
                id="discount-currency-label"
                value={currencyLabel}
                maxLength={8}
                onChange={(event) => {
                  setCurrencyLabel(event.target.value);
                  resetResult();
                }}
                autoComplete="off"
                className="mt-1.5 h-11"
              />
            </div>
          </div>

          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              {isEn ? "Calculation order" : "Порядок расчёта"}
            </p>
            {formula ? (
              <div className="mt-2 space-y-1.5 break-words font-mono text-xs leading-relaxed">
                <p>
                  1.{" "}
                  {formatAmount(
                    formula.originalPrice,
                    formula.currencyLabel,
                    numberLocale,
                  )}{" "}
                  × (1 − {formula.firstDiscount}% / 100) ={" "}
                  {formatAmount(
                    formula.afterFirstDiscount,
                    formula.currencyLabel,
                    numberLocale,
                  )}
                </p>
                {formula.secondDiscount > 0 ? (
                  <p>
                    2.{" "}
                    {formatAmount(
                      formula.afterFirstDiscount,
                      formula.currencyLabel,
                      numberLocale,
                    )}{" "}
                    × (1 − {formula.secondDiscount}% / 100) ={" "}
                    {formatAmount(
                      formula.discountedPrice,
                      formula.currencyLabel,
                      numberLocale,
                    )}
                  </p>
                ) : null}
                {formula.tax > 0 ? (
                  <p>
                    {formula.secondDiscount > 0 ? "3" : "2"}.{" "}
                    {formatAmount(
                      formula.discountedPrice,
                      formula.currencyLabel,
                      numberLocale,
                    )}{" "}
                    × (1 + {formula.tax}% / 100) ={" "}
                    {formatAmount(
                      formula.finalPrice,
                      formula.currencyLabel,
                      numberLocale,
                    )}
                  </p>
                ) : null}
                {formula.cashback > 0 ? (
                  <p>
                    {2 +
                      Number(formula.secondDiscount > 0) +
                      Number(formula.tax > 0)}
                    .{" "}
                    {formatAmount(
                      formula.finalPrice,
                      formula.currencyLabel,
                      numberLocale,
                    )}{" "}
                    × {formula.cashback}% / 100 ={" "}
                    {formatAmount(
                      formula.cashbackAmount,
                      formula.currencyLabel,
                      numberLocale,
                    )}{" "}
                    {isEn ? "cashback" : "кэшбэка"};{" "}
                    {isEn ? "effective cost" : "эффективная стоимость"} ={" "}
                    {formatAmount(
                      formula.effectiveCost,
                      formula.currencyLabel,
                      numberLocale,
                    )}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--color-danger)]">
                {isEn
                  ? "Correct the values to show the formula."
                  : "Исправьте значения, чтобы увидеть формулу."}
              </p>
            )}
          </div>
        </AdvancedSettings>
      </form>

      <Card className="overflow-hidden p-0" aria-live="polite">
        {result ? (
          <>
            <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {result.tax > 0
                    ? isEn
                      ? "New price incl. tax"
                      : "Новая цена с налогом"
                    : isEn
                      ? "New price"
                      : "Новая цена"}
                </p>
                <p className="mt-1 break-all font-mono text-3xl font-extrabold text-[var(--color-primary)]">
                  {formatAmount(
                    result.finalPrice,
                    result.currencyLabel,
                    numberLocale,
                  )}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "Discount savings" : "Экономия на скидках"}
                </p>
                <p className="mt-1 break-all font-mono text-3xl font-extrabold">
                  {formatAmount(
                    result.discountSavings,
                    result.currencyLabel,
                    numberLocale,
                  )}
                </p>
              </div>
            </div>

            {result.tax > 0 || result.cashback > 0 ? (
              <div className="grid gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-muted)] sm:grid-cols-2 sm:px-5">
                {result.tax > 0 ? (
                  <p>
                    {isEn ? "Tax added:" : "Добавлено налога:"}{" "}
                    <span className="font-mono font-semibold text-[var(--color-text)]">
                      {formatAmount(
                        result.taxAmount,
                        result.currencyLabel,
                        numberLocale,
                      )}
                    </span>
                  </p>
                ) : (
                  <span />
                )}
                {result.cashback > 0 ? (
                  <p>
                    {isEn
                      ? "Cashback / effective cost:"
                      : "Кэшбэк / эффективная стоимость:"}{" "}
                    <span className="font-mono font-semibold text-[var(--color-text)]">
                      {formatAmount(
                        result.cashbackAmount,
                        result.currencyLabel,
                        numberLocale,
                      )}{" "}
                      /{" "}
                      {formatAmount(
                        result.effectiveCost,
                        result.currencyLabel,
                        numberLocale,
                      )}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="p-5 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "Enter a price and discount, then calculate the result."
              : "Введите цену и скидку, затем выполните расчёт."}
          </p>
        )}
      </Card>
    </div>
  );
}
