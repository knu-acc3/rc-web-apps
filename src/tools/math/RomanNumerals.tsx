"use client";

import { useMemo, useState } from "react";
import {
  ArrowsLeftRight,
  CheckCircle,
  ClipboardText,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { writeClipboardText } from "@/src/utils/clipboard";

type Direction = "to-roman" | "to-number";

const ROMAN_VALUES: ReadonlyArray<readonly [number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const SYMBOL_VALUES: Readonly<Record<string, number>> = {
  M: 1000,
  D: 500,
  C: 100,
  L: 50,
  X: 10,
  V: 5,
  I: 1,
};

const CHEAT_SHEET: ReadonlyArray<readonly [string, number]> = [
  ["I", 1],
  ["V", 5],
  ["X", 10],
  ["L", 50],
  ["C", 100],
  ["D", 500],
  ["M", 1000],
];

function numberToRoman(value: number) {
  let remaining = value;
  let roman = "";
  for (const [number, symbol] of ROMAN_VALUES) {
    while (remaining >= number) {
      roman += symbol;
      remaining -= number;
    }
  }
  return roman;
}

function romanValue(roman: string) {
  let total = 0;
  for (let index = 0; index < roman.length; index += 1) {
    const current = SYMBOL_VALUES[roman[index]];
    const next = SYMBOL_VALUES[roman[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total;
}

interface ConversionResult {
  ok: boolean;
  output: string;
  error?: string;
  steps?: string[];
}

function convert(input: string, direction: Direction, isEn: boolean): ConversionResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, output: "" };
  }

  if (direction === "to-roman") {
    if (!/^\d+$/u.test(trimmed)) {
      return {
        ok: false,
        output: "",
        error: isEn
          ? "Enter an integer from 1 to 3999"
          : "Введите целое число от 1 до 3999",
      };
    }

    const value = Number(trimmed);
    if (!Number.isInteger(value) || value < 1 || value > 3999) {
      return {
        ok: false,
        output: "",
        error: isEn
          ? "Supported range is 1 to 3999"
          : "Диапазон римских чисел: от 1 до 3999",
      };
    }

    const roman = numberToRoman(value);
    return {
      ok: true,
      output: roman,
    };
  }

  const upper = trimmed.toUpperCase();
  if (!/^[MDCLXVI]+$/u.test(upper)) {
    return {
      ok: false,
      output: "",
      error: isEn
        ? "Only Roman characters I, V, X, L, C, D, M are allowed"
        : "Допустимы только символы I, V, X, L, C, D, M",
    };
  }

  const val = romanValue(upper);
  if (val < 1 || val > 3999 || numberToRoman(val) !== upper) {
    return {
      ok: false,
      output: "",
      error: isEn
        ? "Non-canonical Roman numeral (such as IIII instead of IV)"
        : "Неканоническая запись (такая как IIII вместо IV)",
    };
  }

  return { ok: true, output: String(val) };
}

const PRESETS = [
  { val: "2026", dir: "to-roman" as Direction, label: "2026 (MMXXVI)" },
  { val: "1984", dir: "to-roman" as Direction, label: "1984 (MCMLXXXIV)" },
  { val: "77", dir: "to-roman" as Direction, label: "77 (LXXVII)" },
  { val: "XIV", dir: "to-number" as Direction, label: "XIV (14)" },
  { val: "MMXXIV", dir: "to-number" as Direction, label: "MMXXIV (2024)" },
];

export default function RomanNumerals() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [direction, setDirection] = useState<Direction>("to-roman");
  const [input, setInput] = useState("2026");
  const [copyStatus, setCopyStatus] = useState(false);

  const result = useMemo(
    () => convert(input, direction, isEn),
    [input, direction, isEn],
  );

  const toggleDirection = () => {
    if (result.ok && result.output) {
      const nextInput = result.output;
      setDirection((prev) => (prev === "to-roman" ? "to-number" : "to-roman"));
      setInput(nextInput);
    } else {
      setDirection((prev) => (prev === "to-roman" ? "to-number" : "to-roman"));
      setInput("");
    }
  };

  const copyResult = async () => {
    if (!result.output) return;
    await writeClipboardText(result.output);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* 1-Click Common Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Шаблоны:"}
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setDirection(p.dir);
              setInput(p.val);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
          >
            {p.label}
          </button>
        ))}
        {input && (
          <button
            type="button"
            onClick={() => setInput("")}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <Trash size={14} />
            {isEn ? "Clear" : "Очистить"}
          </button>
        )}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Direction Switcher Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDirection("to-roman");
                if (result.ok && result.output && direction === "to-number") {
                  setInput(result.output);
                }
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                direction === "to-roman"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {isEn ? "123 → Roman" : "Число → Римское (123 → CXXIII)"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection("to-number");
                if (result.ok && result.output && direction === "to-roman") {
                  setInput(result.output);
                }
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
                direction === "to-number"
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              )}
            >
              {isEn ? "Roman → 123" : "Римское → Число (CXXIII → 123)"}
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDirection}
            className="h-8 gap-1 text-xs"
            title={isEn ? "Swap direction" : "Поменять направление"}
          >
            <ArrowsLeftRight size={16} />
            {isEn ? "Swap" : "Поменять"}
          </Button>
        </div>

        {/* Input Field */}
        <div className="mt-4">
          <Label htmlFor="roman-input" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {direction === "to-roman"
              ? isEn ? "Decimal number (1–3999)" : "Десятичное число (1–3999)"
              : isEn ? "Roman numeral (I, V, X, L, C, D, M)" : "Римское число (I, V, X, L, C, D, M)"}
          </Label>
          <div className="relative mt-1.5">
            <Input
              id="roman-input"
              inputMode={direction === "to-roman" ? "numeric" : "text"}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={20}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={direction === "to-roman" ? "2026" : "MMXXVI"}
              className="h-14 font-mono text-xl uppercase tracking-wider"
              autoFocus
            />
          </div>
        </div>

        {/* Quick Insert Symbol Buttons for Roman Input */}
        {direction === "to-number" && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[var(--color-text-muted)]">
              {isEn ? "Insert:" : "Вставить:"}
            </span>
            {CHEAT_SHEET.map(([sym, val]) => (
              <button
                key={sym}
                type="button"
                onClick={() => setInput((prev) => prev + sym)}
                className="h-7 min-w-[28px] rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 font-mono text-xs font-bold text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                title={`${sym} = ${val}`}
              >
                {sym}
              </button>
            ))}
          </div>
        )}

        {/* Result Block */}
        {result.ok && result.output ? (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isEn ? "Result" : "Результат"}
                </span>
                <div className="mt-1 font-mono text-3xl font-extrabold tracking-wider text-[var(--color-text)]">
                  {result.output}
                </div>
              </div>

              <Button
                data-tool-primary-action=""
                size="md"
                className="w-auto"
                onClick={copyResult}
              >
                {copyStatus ? (
                  <CheckCircle size={18} weight="fill" />
                ) : (
                  <ClipboardText size={18} />
                )}
                {copyStatus
                  ? isEn ? "Copied" : "Скопировано"
                  : isEn ? "Copy result" : "Копировать"}
              </Button>
            </div>
          </div>
        ) : result.error ? (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 p-3.5 text-sm text-red-600 dark:text-red-400">
            {result.error}
          </div>
        ) : null}
      </Card>

      {/* Reference Cheat Sheet */}
      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? "Roman numerals guide" : "Справочная таблица римских чисел"}
        description={isEn ? "Basic symbols and subtractive notation" : "Базовые символы и вычитательные пары"}
      >
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {CHEAT_SHEET.map(([sym, val]) => (
            <div
              key={sym}
              className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] py-2 text-center"
            >
              <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                {sym}
              </span>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {val.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Canonical subtractive pairs: IV (4), IX (9), XL (40), XC (90), CD (400), CM (900). Symbols may repeat up to 3 times."
            : "Канонические вычитательные пары: IV (4), IX (9), XL (40), XC (90), CD (400), CM (900). Повтор одинакового символа подряд не более 3 раз."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
