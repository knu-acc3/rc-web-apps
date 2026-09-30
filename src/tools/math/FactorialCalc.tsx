"use client";

import { useCallback, useState } from "react";
import { Function, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";

const MAX_EXACT_N = 1000;

interface FactorialSuccess {
  ok: true;
  n: number;
  value: string;
  digits: number;
}

interface FactorialError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type FactorialResult = FactorialSuccess | FactorialError;

function factorial(n: number) {
  let value = 1n;
  for (let factor = 2n; factor <= BigInt(n); factor += 1n) {
    value *= factor;
  }
  return value;
}

function calculateFactorial(input: string): FactorialResult {
  const trimmed = input.trim();
  if (!/^\d+$/u.test(trimmed)) {
    return {
      ok: false,
      messageEn: "Enter a whole number greater than or equal to 0.",
      messageRu: "Введите целое число, большее или равное 0.",
    };
  }

  const n = Number(trimmed);
  if (!Number.isSafeInteger(n)) {
    return {
      ok: false,
      messageEn: "The input is outside the supported integer range.",
      messageRu:
        "Ввод находится за пределами поддерживаемого диапазона целых чисел.",
    };
  }
  if (n > MAX_EXACT_N) {
    return {
      ok: false,
      messageEn: `The exact limit is ${MAX_EXACT_N}!. Choose a smaller n.`,
      messageRu: `Точный предел — ${MAX_EXACT_N}!. Выберите меньшее n.`,
    };
  }

  const value = factorial(n).toString();
  return { ok: true, n, value, digits: value.length };
}

export default function FactorialCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [result, setResult] = useState<FactorialResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Function size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Factorial calculator" : "Калькулятор факториала"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Calculate n! exactly with integer arithmetic."
                : "Вычисляет n! точно с помощью целочисленной арифметики."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="factorial-input">
            {isEn ? "Whole number n" : "Целое число n"}
          </Label>
          <Input
            id="factorial-input"
            inputMode="numeric"
            autoComplete="off"
            maxLength={5}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              clearResult();
            }}
            placeholder={
              isEn ? "Enter n from 0 to 1000" : "Введите n от 0 до 1000"
            }
            className="mt-2 h-12 font-mono text-base"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!input.trim()}
          onClick={() => setResult(calculateFactorial(input))}
          leadingIcon={<Function size={20} aria-hidden="true" />}
        >
          {isEn ? "Calculate factorial" : "Вычислить факториал"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Exact calculation limits" : "Границы точного расчёта"}
          description={
            isEn
              ? "Definition, BigInt precision, and output size"
              : "Определение, точность BigInt и размер результата"
          }
        >
          <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "For n ≥ 1, n! is the product of all integers from 1 through n; by definition, 0! = 1."
                : "Для n ≥ 1 значение n! равно произведению всех целых чисел от 1 до n; по определению 0! = 1."}
            </p>
            <p>
              {isEn
                ? `Results are exact BigInt values up to ${MAX_EXACT_N}!. Large results may contain thousands of digits.`
                : `Результаты вычисляются точно через BigInt до ${MAX_EXACT_N}!. Большие значения могут содержать тысячи цифр.`}
            </p>
          </div>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="factorial-result-title"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="factorial-result-title" className="font-bold">
                  {result.n}!
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
                  {isEn ? `${result.digits} digits` : `Цифр: ${result.digits}`}
                </p>
              </div>
              <CopyButton
                text={result.value}
                size="medium"
                tooltip={
                  isEn ? "Copy exact result" : "Копировать точный результат"
                }
              />
            </div>
            <Textarea
              value={result.value}
              readOnly
              aria-label={
                isEn ? "Exact factorial result" : "Точный результат факториала"
              }
              className="mt-3 min-h-32 resize-y bg-[var(--color-surface-muted)]/50 font-mono text-sm leading-relaxed"
              spellCheck={false}
            />
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
                    ? "Cannot calculate factorial"
                    : "Не удалось вычислить факториал"}
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
