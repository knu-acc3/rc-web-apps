"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const MAX_INTEGER_COUNT = 50;
const MAX_INTEGER_DIGITS = 100;

export interface ParsedIntegerList {
  values: bigint[];
  normalized: bigint[];
  hadNegative: boolean;
  hasZero: boolean;
}

export interface GcdLcmResult {
  gcd: bigint;
  lcm: bigint;
}

function absolute(value: bigint) {
  return value < 0n ? -value : value;
}

export function gcdBigInt(first: bigint, second: bigint) {
  let a = absolute(first);
  let b = absolute(second);

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

export function lcmBigInt(first: bigint, second: bigint) {
  const a = absolute(first);
  const b = absolute(second);
  if (a === 0n || b === 0n) return 0n;
  return (a / gcdBigInt(a, b)) * b;
}

export function parseIntegerList(input: string): ParsedIntegerList {
  const tokens = input
    .trim()
    .split(/[\s,;]+/)
    .filter(Boolean);

  if (tokens.length < 2) throw new Error("too-few");
  if (tokens.length > MAX_INTEGER_COUNT) throw new Error("too-many");

  const values = tokens.map((token) => {
    if (!/^[+-]?\d+$/.test(token)) throw new Error("invalid-integer");
    const digits = token.replace(/^[+-]/, "").replace(/^0+(?=\d)/, "");
    if (digits.length > MAX_INTEGER_DIGITS) throw new Error("too-large");
    return BigInt(token);
  });
  const normalized = values.map(absolute);

  return {
    values,
    normalized,
    hadNegative: values.some((value) => value < 0n),
    hasZero: normalized.some((value) => value === 0n),
  };
}

export function calculateGcdLcm(values: bigint[]): GcdLcmResult {
  if (values.length < 2) throw new Error("too-few");
  const normalized = values.map(absolute);
  let gcd = normalized[0];
  let lcm = normalized[0];

  for (let index = 1; index < normalized.length; index += 1) {
    gcd = gcdBigInt(gcd, normalized[index]);
    lcm = lcmBigInt(lcm, normalized[index]);
  }

  return { gcd, lcm };
}

function formatBigInt(value: bigint, isEn: boolean) {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU");
}

export default function GcdLcm() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedIntegerList | null>(null);
  const [result, setResult] = useState<GcdLcmResult | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setParsed(null);
    setResult(null);
    setError("");
  };

  const errorMessage = (code: string) => {
    const messages: Record<string, [string, string]> = {
      "too-few": [
        "Введите хотя бы два целых числа.",
        "Enter at least two integers.",
      ],
      "too-many": [
        `Можно ввести не более ${MAX_INTEGER_COUNT} чисел.`,
        `Enter no more than ${MAX_INTEGER_COUNT} integers.`,
      ],
      "invalid-integer": [
        "Используйте только целые числа, разделённые пробелами, запятыми или точками с запятой.",
        "Use integers separated by spaces, commas or semicolons.",
      ],
      "too-large": [
        `Каждое число может содержать не более ${MAX_INTEGER_DIGITS} цифр.`,
        `Each integer may contain no more than ${MAX_INTEGER_DIGITS} digits.`,
      ],
    };
    return (messages[code] ?? messages["invalid-integer"])[isEn ? 1 : 0];
  };

  const calculate = () => {
    try {
      const nextParsed = parseIntegerList(input);
      setParsed(nextParsed);
      setResult(calculateGcdLcm(nextParsed.normalized));
      setError("");
    } catch (caught) {
      setParsed(null);
      setResult(null);
      setError(errorMessage(caught instanceof Error ? caught.message : ""));
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="gcd-lcm-input">
          {isEn ? "Integer list" : "Список целых чисел"}
        </Label>
        <Input
          id="gcd-lcm-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            invalidate();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") calculate();
          }}
          placeholder={
            isEn
              ? "Enter integers separated by commas"
              : "Введите целые числа через запятую"
          }
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 font-mono text-base"
        />

        <ToolPrimaryAction type="button" className="mt-4" onClick={calculate}>
          {isEn ? "Calculate GCD and LCM" : "Рассчитать НОД и НОК"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the list" : "Проверьте список"}
            description={error}
            className="mt-5"
          />
        ) : result && parsed ? (
          <ToolResult
            status="success"
            title={isEn ? "Exact result" : "Точный результат"}
            description={
              isEn
                ? "Calculated with integer arithmetic"
                : "Рассчитано в целочисленной арифметике"
            }
            className="mt-5"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "GCD" : "НОД"}
                </p>
                <output className="mt-1 block overflow-x-auto whitespace-nowrap font-mono text-2xl font-bold text-[var(--color-text)]">
                  {formatBigInt(result.gcd, isEn)}
                </output>
              </div>
              <div className="min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                  {isEn ? "LCM" : "НОК"}
                </p>
                <output className="mt-1 block overflow-x-auto whitespace-nowrap font-mono text-2xl font-bold text-[var(--color-text)]">
                  {formatBigInt(result.lcm, isEn)}
                </output>
              </div>
            </div>

            <div className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <p className="break-all">
                <span className="font-semibold text-[var(--color-text)]">
                  {isEn ? "Normalized:" : "Нормализовано:"}
                </span>{" "}
                {parsed.normalized.map(String).join(", ")}
              </p>
              {parsed.hadNegative ? (
                <p>
                  {isEn
                    ? "Signs were removed; GCD and LCM use absolute values."
                    : "Знаки удалены: НОД и НОК считаются по абсолютным значениям."}
                </p>
              ) : null}
              {parsed.hasZero ? (
                <p>
                  {isEn
                    ? "A list containing zero has LCM 0; GCD with zero is determined by the non-zero values."
                    : "Если в списке есть ноль, НОК равен 0; НОД определяется ненулевыми значениями."}
                </p>
              ) : null}
            </div>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The exact GCD and LCM will appear here."
                : "Здесь появятся точные НОД и НОК."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Calculation rules" : "Правила расчёта"}
          description={
            isEn
              ? "Signs, zero and supported input size"
              : "Знаки, ноль и допустимый размер ввода"
          }
        >
          <div className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "Calculations use absolute integer values. GCD(0, 0) is reported as 0, and any LCM containing 0 is 0."
                : "Расчёт использует абсолютные целые значения. НОД(0, 0) выводится как 0, а НОК списка с нулём равен 0."}
            </p>
            <p>
              {isEn
                ? `Results are exact for up to ${MAX_INTEGER_COUNT} integers of ${MAX_INTEGER_DIGITS} digits each.`
                : `Результат точный для списка до ${MAX_INTEGER_COUNT} чисел длиной не более ${MAX_INTEGER_DIGITS} цифр каждое.`}
            </p>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
