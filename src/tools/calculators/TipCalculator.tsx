"use client";

import { useState } from "react";
import { Calculator } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
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
import { cn } from "@/src/lib/cn";

type RoundingMode = "none" | "nearest" | "up";

interface TipResult {
  tipAmount: number;
  total: number;
  perPerson: number;
  enteredTipPercent: number;
  people: number;
  roundingMode: RoundingMode;
  currencyLabel: string;
}

function parseDecimal(value: string): number {
  if (!value.trim()) return Number.NaN;
  return Number(value.trim().replace(",", "."));
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

export default function TipCalculator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [billInput, setBillInput] = useState("100");
  const [tipInput, setTipInput] = useState("10");
  const [peopleInput, setPeopleInput] = useState("2");
  const [currencyLabel, setCurrencyLabel] = useState("");
  const [roundingMode, setRoundingMode] = useState<RoundingMode>("none");
  const [result, setResult] = useState<TipResult | null>(null);

  const bill = parseDecimal(billInput);
  const tipPercent = parseDecimal(tipInput);
  const people = Number(peopleInput);
  const billValid = Number.isFinite(bill) && bill >= 0;
  const tipValid =
    Number.isFinite(tipPercent) && tipPercent >= 0 && tipPercent <= 100;
  const peopleValid = Number.isInteger(people) && people >= 1;
  const formValid = billValid && tipValid && peopleValid;

  const resetResult = () => setResult(null);

  const calculate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formValid) return;

    const rawTip = bill * (tipPercent / 100);
    const rawTotal = bill + rawTip;
    let total = rawTotal;

    if (roundingMode === "up") {
      total = Math.ceil(rawTotal - 1e-10);
    } else if (roundingMode === "nearest") {
      total = Math.max(Math.ceil(bill), Math.round(rawTotal));
    }

    const tipAmount = Math.max(0, total - bill);

    setResult({
      tipAmount,
      total,
      perPerson: total / people,
      enteredTipPercent: tipPercent,
      people,
      roundingMode,
      currencyLabel: currencyLabel.trim(),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form onSubmit={calculate} noValidate className="space-y-4">
        <Card className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <Label htmlFor="tip-bill">
                {isEn ? "Bill amount" : "Сумма счёта"}
              </Label>
              <Input
                id="tip-bill"
                value={billInput}
                onChange={(event) => {
                  setBillInput(event.target.value);
                  resetResult();
                }}
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={billInput.trim().length > 0 && !billValid}
                aria-describedby="tip-bill-error"
                className={cn(
                  "mt-1.5 h-12 min-w-0 font-mono text-base",
                  billInput.trim().length > 0 &&
                    !billValid &&
                    "border-[var(--color-danger)]",
                )}
              />
              <p
                id="tip-bill-error"
                className="mt-1.5 min-h-4 text-xs text-[var(--color-text-muted)]"
              >
                {billInput.trim().length > 0 && !billValid
                  ? isEn
                    ? "Enter zero or a positive amount."
                    : "Введите ноль или положительную сумму."
                  : isEn
                    ? "Dot or comma decimals are accepted."
                    : "Можно использовать точку или запятую."}
              </p>
            </div>

            <div className="min-w-0">
              <Label htmlFor="tip-percent">{isEn ? "Tip" : "Чаевые"}</Label>
              <div className="relative mt-1.5">
                <Input
                  id="tip-percent"
                  value={tipInput}
                  onChange={(event) => {
                    setTipInput(event.target.value);
                    resetResult();
                  }}
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={tipInput.trim().length > 0 && !tipValid}
                  aria-describedby="tip-percent-error"
                  className={cn(
                    "h-12 min-w-0 pr-10 font-mono text-base",
                    tipInput.trim().length > 0 &&
                      !tipValid &&
                      "border-[var(--color-danger)]",
                  )}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </div>
              <p
                id="tip-percent-error"
                className="mt-1.5 min-h-4 text-xs text-[var(--color-text-muted)]"
              >
                {tipInput.trim().length > 0 && !tipValid
                  ? isEn
                    ? "Use a percentage from 0 to 100."
                    : "Укажите процент от 0 до 100."
                  : isEn
                    ? "From 0% to 100%."
                    : "От 0% до 100%."}
              </p>
            </div>

            <div className="min-w-0">
              <Label htmlFor="tip-people">
                {isEn ? "People" : "Количество людей"}
              </Label>
              <Input
                id="tip-people"
                type="number"
                min={1}
                step={1}
                value={peopleInput}
                onChange={(event) => {
                  setPeopleInput(event.target.value);
                  resetResult();
                }}
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={peopleInput.trim().length > 0 && !peopleValid}
                aria-describedby="tip-people-error"
                className={cn(
                  "mt-1.5 h-12 min-w-0 font-mono text-base",
                  peopleInput.trim().length > 0 &&
                    !peopleValid &&
                    "border-[var(--color-danger)]",
                )}
              />
              <p
                id="tip-people-error"
                className="mt-1.5 min-h-4 text-xs text-[var(--color-text-muted)]"
              >
                {peopleInput.trim().length > 0 && !peopleValid
                  ? isEn
                    ? "Enter a whole number of 1 or more."
                    : "Введите целое число не меньше 1."
                  : isEn
                    ? "The total is split equally."
                    : "Итог делится поровну."}
              </p>
            </div>
          </div>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!formValid}
          leadingIcon={<Calculator size={20} />}
        >
          {isEn ? "Calculate tip" : "Рассчитать чаевые"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={
            isEn
              ? "Currency label and rounding"
              : "Обозначение валюты и округление"
          }
          description={
            isEn
              ? "Optional display label and how the final total is rounded"
              : "Необязательная подпись и способ округления итоговой суммы"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tip-currency-label">
                {isEn
                  ? "Currency label (optional)"
                  : "Обозначение валюты (необязательно)"}
              </Label>
              <Input
                id="tip-currency-label"
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

            <div>
              <Label htmlFor="tip-rounding">
                {isEn ? "Round final total" : "Округление итога"}
              </Label>
              <Select
                value={roundingMode}
                onValueChange={(value) => {
                  setRoundingMode(value as RoundingMode);
                  resetResult();
                }}
              >
                <SelectTrigger id="tip-rounding" className="mt-1.5 h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {isEn ? "Do not round" : "Не округлять"}
                  </SelectItem>
                  <SelectItem value="nearest">
                    {isEn ? "Nearest whole unit" : "До ближайшего целого"}
                  </SelectItem>
                  <SelectItem value="up">
                    {isEn ? "Up to a whole unit" : "Вверх до целого"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Rounding is applied after the percentage tip. When enabled, the displayed tip includes the rounding adjustment so the numbers always add up."
              : "Округление применяется после процентных чаевых. При округлении показанная сумма чаевых включает корректировку, поэтому итог всегда сходится."}
          </p>
        </AdvancedSettings>
      </form>

      <Card className="overflow-hidden p-0" aria-live="polite">
        {result ? (
          <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Tip" : "Чаевые"}
              </p>
              <p className="mt-1 break-all font-mono text-2xl font-extrabold">
                {formatAmount(
                  result.tipAmount,
                  result.currencyLabel,
                  isEn ? "en-US" : "ru-RU",
                )}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Total" : "Итого"}
              </p>
              <p className="mt-1 break-all font-mono text-2xl font-extrabold text-[var(--color-primary)]">
                {formatAmount(
                  result.total,
                  result.currencyLabel,
                  isEn ? "en-US" : "ru-RU",
                )}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Per person" : "На человека"}
              </p>
              <p className="mt-1 break-all font-mono text-2xl font-extrabold">
                {formatAmount(
                  result.perPerson,
                  result.currencyLabel,
                  isEn ? "en-US" : "ru-RU",
                )}
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn ? `${result.people} people` : `${result.people} чел.`}
              </p>
            </div>
          </div>
        ) : (
          <p className="p-5 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "Enter the bill details and calculate the split."
              : "Введите данные счёта и выполните расчёт."}
          </p>
        )}
      </Card>
    </div>
  );
}
