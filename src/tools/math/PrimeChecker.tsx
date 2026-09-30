"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const MAX_PRIME_INPUT = (1n << 64n) - 1n;

const SMALL_PRIMES = [
  2n,
  3n,
  5n,
  7n,
  11n,
  13n,
  17n,
  19n,
  23n,
  29n,
  31n,
  37n,
] as const;

const MILLER_RABIN_BASES = [
  2n,
  325n,
  9_375n,
  28_178n,
  450_775n,
  9_780_504n,
  1_795_265_022n,
] as const;

export function modularPower(base: bigint, exponent: bigint, modulus: bigint) {
  let result = 1n;
  let current = base % modulus;
  let remaining = exponent;

  while (remaining > 0n) {
    if (remaining & 1n) result = (result * current) % modulus;
    current = (current * current) % modulus;
    remaining >>= 1n;
  }
  return result;
}

export function isPrimeDeterministic(value: bigint) {
  if (value < 2n) return false;
  if (value > MAX_PRIME_INPUT) throw new Error("out-of-range");

  for (const prime of SMALL_PRIMES) {
    if (value === prime) return true;
    if (value % prime === 0n) return false;
  }

  let oddPart = value - 1n;
  let powerOfTwo = 0;
  while (oddPart % 2n === 0n) {
    oddPart /= 2n;
    powerOfTwo += 1;
  }

  for (const rawBase of MILLER_RABIN_BASES) {
    const base = rawBase % value;
    if (base === 0n) continue;

    let candidate = modularPower(base, oddPart, value);
    if (candidate === 1n || candidate === value - 1n) continue;

    let reachedMinusOne = false;
    for (let round = 1; round < powerOfTwo; round += 1) {
      candidate = (candidate * candidate) % value;
      if (candidate === value - 1n) {
        reachedMinusOne = true;
        break;
      }
    }

    if (!reachedMinusOne) return false;
  }

  return true;
}

export function parsePrimeInput(input: string) {
  const normalized = input.trim();
  if (!normalized) throw new Error("empty");
  if (!/^\+?\d+$/.test(normalized)) throw new Error("invalid-integer");

  const digits = normalized.replace(/^\+/, "");
  if (digits.length > 20) throw new Error("out-of-range");
  const value = BigInt(normalized);
  if (value > MAX_PRIME_INPUT) throw new Error("out-of-range");
  return value;
}

export default function PrimeChecker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("");
  const [value, setValue] = useState<bigint | null>(null);
  const [prime, setPrime] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setValue(null);
    setPrime(null);
    setError("");
  };

  const errorMessage = (code: string) => {
    if (code === "empty") {
      return isEn ? "Enter an integer." : "Введите целое число.";
    }
    if (code === "out-of-range") {
      return isEn
        ? `Enter a value from 0 to ${MAX_PRIME_INPUT.toString()}.`
        : `Введите значение от 0 до ${MAX_PRIME_INPUT.toString()}.`;
    }
    return isEn
      ? "Use a non-negative integer without decimal places."
      : "Используйте неотрицательное целое число без десятичной части.";
  };

  const check = () => {
    try {
      const parsed = parsePrimeInput(input);
      setValue(parsed);
      setPrime(isPrimeDeterministic(parsed));
      setError("");
    } catch (caught) {
      setValue(null);
      setPrime(null);
      setError(errorMessage(caught instanceof Error ? caught.message : ""));
    }
  };

  const resultTitle = () => {
    if (value === null || prime === null) return "";
    if (prime) return isEn ? "Prime number" : "Простое число";
    if (value > 1n) return isEn ? "Composite number" : "Составное число";
    return isEn ? "Not a prime number" : "Не является простым числом";
  };

  const resultDescription = () => {
    if (value === null || prime === null) return "";
    if (prime) {
      return isEn
        ? "The deterministic test confirms primality within the supported range."
        : "Детерминированный тест подтверждает простоту в поддерживаемом диапазоне.";
    }
    if (value === 0n || value === 1n) {
      return isEn
        ? `${value.toString()} is neither prime nor composite.`
        : `${value.toString()} не является ни простым, ни составным числом.`;
    }
    return isEn
      ? "The deterministic test confirms that this integer is composite."
      : "Детерминированный тест подтверждает, что это число составное.";
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="prime-input">
          {isEn ? "Non-negative integer" : "Неотрицательное целое число"}
        </Label>
        <Input
          id="prime-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            invalidate();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") check();
          }}
          placeholder={isEn ? "Enter an integer" : "Введите целое число"}
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 font-mono text-base"
        />

        <ToolPrimaryAction type="button" className="mt-4" onClick={check}>
          {isEn ? "Check primality" : "Проверить простоту"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the number" : "Проверьте число"}
            description={error}
            className="mt-5"
          />
        ) : value !== null && prime !== null ? (
          <ToolResult
            status={prime ? "success" : "idle"}
            title={resultTitle()}
            description={resultDescription()}
            className="mt-5"
          >
            <output className="block overflow-x-auto whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-4 py-4 font-mono text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              {value.toLocaleString(isEn ? "en-US" : "ru-RU")}
            </output>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The primality result will appear here."
                : "Здесь появится результат проверки простоты."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Method and range" : "Метод и диапазон"}
          description={
            isEn
              ? "Deterministic check for unsigned 64-bit integers"
              : "Детерминированная проверка 64-битных беззнаковых чисел"
          }
        >
          <div className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? `Accepted range: 0 to ${MAX_PRIME_INPUT.toString()}. Values outside it are rejected.`
                : `Допустимый диапазон: от 0 до ${MAX_PRIME_INPUT.toString()}. Значения за его пределами отклоняются.`}
            </p>
            <p>
              {isEn
                ? "Fixed Miller–Rabin bases make the result deterministic and exact throughout this range."
                : "Фиксированные основания Миллера — Рабина дают детерминированный и точный результат во всём этом диапазоне."}
            </p>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
