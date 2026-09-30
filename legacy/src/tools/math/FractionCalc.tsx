"use client";

import { useCallback, useState } from "react";
import { Divide, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type Operation = "add" | "subtract" | "multiply" | "divide";

interface Fraction {
  numerator: bigint;
  denominator: bigint;
}

interface CalculationSuccess {
  ok: true;
  fraction: Fraction;
}

interface CalculationError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type CalculationResult = CalculationSuccess | CalculationError;

const MAX_INTEGER_DIGITS = 100;

const OPERATION_SYMBOLS: Readonly<Record<Operation, string>> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
};

function absolute(value: bigint) {
  return value < 0n ? -value : value;
}

function gcd(left: bigint, right: bigint) {
  let a = absolute(left);
  let b = absolute(right);
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function normalize(fraction: Fraction): Fraction {
  if (fraction.numerator === 0n) return { numerator: 0n, denominator: 1n };

  const divisor = gcd(fraction.numerator, fraction.denominator);
  let numerator = fraction.numerator / divisor;
  let denominator = fraction.denominator / divisor;
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  return { numerator, denominator };
}

function parseInteger(value: string) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+$/u.test(trimmed))
    return { ok: false as const, reason: "syntax" as const };

  const digits = trimmed.replace(/^[+-]/u, "").replace(/^0+(?=\d)/u, "");
  if (digits.length > MAX_INTEGER_DIGITS) {
    return { ok: false as const, reason: "length" as const };
  }

  return { ok: true as const, value: BigInt(trimmed) };
}

function calculate(
  numeratorA: string,
  denominatorB: string,
  numeratorC: string,
  denominatorD: string,
  operation: Operation,
): CalculationResult {
  const parsed = [
    parseInteger(numeratorA),
    parseInteger(denominatorB),
    parseInteger(numeratorC),
    parseInteger(denominatorD),
  ];

  if (parsed.some((value) => !value.ok && value.reason === "syntax")) {
    return {
      ok: false,
      messageEn: "All four fields must contain whole integers.",
      messageRu: "Все четыре поля должны содержать целые числа.",
    };
  }
  if (parsed.some((value) => !value.ok && value.reason === "length")) {
    return {
      ok: false,
      messageEn: `Each integer is limited to ${MAX_INTEGER_DIGITS} digits.`,
      messageRu: `Каждое целое число ограничено ${MAX_INTEGER_DIGITS} цифрами.`,
    };
  }

  const [a, b, c, d] = parsed.map((value) => (value.ok ? value.value : 0n));
  if (b === 0n) {
    return {
      ok: false,
      messageEn: "The denominator b of the first fraction cannot be zero.",
      messageRu: "Знаменатель b первой дроби не может быть равен нулю.",
    };
  }
  if (d === 0n) {
    return {
      ok: false,
      messageEn: "The denominator d of the second fraction cannot be zero.",
      messageRu: "Знаменатель d второй дроби не может быть равен нулю.",
    };
  }

  const left = normalize({ numerator: a, denominator: b });
  const right = normalize({ numerator: c, denominator: d });
  let result: Fraction;

  if (operation === "add") {
    result = {
      numerator:
        left.numerator * right.denominator + right.numerator * left.denominator,
      denominator: left.denominator * right.denominator,
    };
  } else if (operation === "subtract") {
    result = {
      numerator:
        left.numerator * right.denominator - right.numerator * left.denominator,
      denominator: left.denominator * right.denominator,
    };
  } else if (operation === "multiply") {
    result = {
      numerator: left.numerator * right.numerator,
      denominator: left.denominator * right.denominator,
    };
  } else {
    if (right.numerator === 0n) {
      return {
        ok: false,
        messageEn: "Division by the zero fraction is undefined.",
        messageRu: "Деление на нулевую дробь не определено.",
      };
    }
    result = {
      numerator: left.numerator * right.denominator,
      denominator: left.denominator * right.numerator,
    };
  }

  return { ok: true, fraction: normalize(result) };
}

function fractionText(fraction: Fraction) {
  return fraction.denominator === 1n
    ? fraction.numerator.toString()
    : `${fraction.numerator}/${fraction.denominator}`;
}

function mixedText(fraction: Fraction) {
  if (fraction.denominator === 1n) return fraction.numerator.toString();
  if (absolute(fraction.numerator) < fraction.denominator) return null;

  const whole = fraction.numerator / fraction.denominator;
  const remainder = absolute(fraction.numerator % fraction.denominator);
  return remainder === 0n
    ? whole.toString()
    : `${whole} ${remainder}/${fraction.denominator}`;
}

function FractionFields({
  label,
  prefix,
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  isEn,
}: {
  label: string;
  prefix: "left" | "right";
  numerator: string;
  denominator: string;
  onNumeratorChange: (value: string) => void;
  onDenominatorChange: (value: string) => void;
  isEn: boolean;
}) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
      <p className="mb-2 text-center text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </p>
      <Label htmlFor={`${prefix}-numerator`} className="sr-only">
        {isEn ? "Numerator" : "Числитель"}
      </Label>
      <Input
        id={`${prefix}-numerator`}
        inputMode="text"
        autoComplete="off"
        maxLength={MAX_INTEGER_DIGITS + 1}
        value={numerator}
        onChange={(event) => onNumeratorChange(event.target.value)}
        placeholder={prefix === "left" ? "a" : "c"}
        className="h-11 min-w-0 text-center font-mono text-base"
      />
      <div
        className="my-2 h-px bg-[var(--color-text-muted)]"
        aria-hidden="true"
      />
      <Label htmlFor={`${prefix}-denominator`} className="sr-only">
        {isEn ? "Denominator" : "Знаменатель"}
      </Label>
      <Input
        id={`${prefix}-denominator`}
        inputMode="text"
        autoComplete="off"
        maxLength={MAX_INTEGER_DIGITS + 1}
        value={denominator}
        onChange={(event) => onDenominatorChange(event.target.value)}
        placeholder={prefix === "left" ? "b" : "d"}
        className="h-11 min-w-0 text-center font-mono text-base"
      />
    </div>
  );
}

export default function FractionCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [numeratorA, setNumeratorA] = useState("");
  const [denominatorB, setDenominatorB] = useState("");
  const [numeratorC, setNumeratorC] = useState("");
  const [denominatorD, setDenominatorD] = useState("");
  const [operation, setOperation] = useState<Operation>("add");
  const [showMixed, setShowMixed] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);
  const hasAllInputs = [
    numeratorA,
    denominatorB,
    numeratorC,
    denominatorD,
  ].every((value) => value.trim().length > 0);

  const changeValue = useCallback(
    (setter: (value: string) => void, value: string) => {
      setter(value);
      clearResult();
    },
    [clearResult],
  );

  const exactResult = result?.ok ? fractionText(result.fraction) : "";
  const mixedResult = result?.ok ? mixedText(result.fraction) : null;
  const displayedResult = showMixed && mixedResult ? mixedResult : exactResult;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Divide size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Fraction calculator" : "Калькулятор дробей"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Calculate a/b and c/d exactly, then reduce the result."
                : "Точно вычисляет операцию над a/b и c/d, затем сокращает результат."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] items-center gap-2">
          <FractionFields
            label="a / b"
            prefix="left"
            numerator={numeratorA}
            denominator={denominatorB}
            onNumeratorChange={(value) => changeValue(setNumeratorA, value)}
            onDenominatorChange={(value) => changeValue(setDenominatorB, value)}
            isEn={isEn}
          />
          <div
            className="text-center font-mono text-2xl font-bold"
            aria-hidden="true"
          >
            {OPERATION_SYMBOLS[operation]}
          </div>
          <FractionFields
            label="c / d"
            prefix="right"
            numerator={numeratorC}
            denominator={denominatorD}
            onNumeratorChange={(value) => changeValue(setNumeratorC, value)}
            onDenominatorChange={(value) => changeValue(setDenominatorD, value)}
            isEn={isEn}
          />
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">
            {isEn ? "Operation" : "Операция"}
          </legend>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(Object.keys(OPERATION_SYMBOLS) as Operation[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={operation === value}
                aria-label={
                  isEn
                    ? value
                    : value === "add"
                      ? "Сложение"
                      : value === "subtract"
                        ? "Вычитание"
                        : value === "multiply"
                          ? "Умножение"
                          : "Деление"
                }
                onClick={() => {
                  setOperation(value);
                  clearResult();
                }}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border text-xl font-bold transition-colors",
                  operation === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {OPERATION_SYMBOLS[value]}
              </button>
            ))}
          </div>
        </fieldset>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!hasAllInputs}
          onClick={() =>
            setResult(
              calculate(
                numeratorA,
                denominatorB,
                numeratorC,
                denominatorD,
                operation,
              ),
            )
          }
          leadingIcon={<Divide size={20} aria-hidden="true" />}
        >
          {isEn ? "Calculate fraction" : "Вычислить дробь"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Exact and mixed form" : "Точная и смешанная форма"}
          description={
            isEn
              ? "BigInt precision, sign normalization, and display"
              : "Точность BigInt, нормализация знака и отображение"
          }
        >
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={showMixed}
              onChange={(event) => setShowMixed(event.target.checked)}
              className="size-5 accent-[var(--color-primary)]"
            />
            <span>
              {isEn
                ? "Show improper results as a mixed number"
                : "Показывать неправильную дробь как смешанное число"}
            </span>
          </label>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? `All operations use exact BigInt integers, with up to ${MAX_INTEGER_DIGITS} digits per field. The sign is moved to the numerator and the denominator stays positive after reduction by GCD.`
              : `Все операции используют точные целые BigInt до ${MAX_INTEGER_DIGITS} цифр в поле. После сокращения по НОД знак переносится в числитель, а знаменатель остаётся положительным.`}
          </p>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="fraction-result-title"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 id="fraction-result-title" className="font-bold">
                  {isEn ? "Reduced result" : "Сокращённый результат"}
                </h2>
                {showMixed && mixedResult ? (
                  <p className="mt-0.5 break-all font-mono text-sm text-[var(--color-text-muted)]">
                    {isEn ? "Exact fraction" : "Точная дробь"}: {exactResult}
                  </p>
                ) : null}
              </div>
              <CopyButton
                text={exactResult}
                size="medium"
                tooltip={
                  isEn ? "Copy exact fraction" : "Копировать точную дробь"
                }
              />
            </div>
            <p className="mt-4 break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-center font-mono text-2xl font-bold text-[var(--color-primary)]">
              {displayedResult}
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
                    ? "Cannot calculate fractions"
                    : "Не удалось вычислить дроби"}
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
