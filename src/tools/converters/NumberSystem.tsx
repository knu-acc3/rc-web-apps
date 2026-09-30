"use client";

import { useMemo, useState } from "react";
import { ArrowsLeftRight, Check, Copy, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { CopyButton } from "@/src/components/CopyButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

interface ParsedInteger {
  value: bigint | null;
  error: "empty" | "too-long" | "invalid" | null;
}

const DIGITS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const COMMON_BASES = [2, 8, 10, 16];
const MAX_DIGITS = 10_000;

const BASE_NAMES_EN: Record<number, string> = {
  2: "Binary",
  8: "Octal",
  10: "Decimal",
  16: "Hexadecimal",
};

const BASE_NAMES_RU: Record<number, string> = {
  2: "Двоичная",
  8: "Восьмеричная",
  10: "Десятичная",
  16: "Шестнадцатеричная",
};

const NUMBER_SYSTEM_PRESETS = [
  { label: "255 (Dec → Hex)", value: "255", from: 10, to: 16 },
  { label: "101010 (Bin → Dec)", value: "101010", from: 2, to: 10 },
  { label: "0xFF (Hex → Dec)", value: "FF", from: 16, to: 10 },
  { label: "1024 (Dec → Bin)", value: "1024", from: 10, to: 2 },
  { label: "777 (Oct → Dec)", value: "777", from: 8, to: 10 },
];

function digitValue(character: string): number {
  return DIGITS.indexOf(character.toUpperCase());
}

function parseIntegerInput(input: string, base: number): ParsedInteger {
  let normalized = input.trim().replace(/[\s_]/g, "");
  if (!normalized) return { value: null, error: "empty" };

  let negative = false;
  if (normalized.startsWith("-") || normalized.startsWith("+")) {
    negative = normalized.startsWith("-");
    normalized = normalized.slice(1);
  }

  const lower = normalized.toLowerCase();
  if (base === 2 && lower.startsWith("0b")) normalized = normalized.slice(2);
  if (base === 8 && lower.startsWith("0o")) normalized = normalized.slice(2);
  if (base === 16 && lower.startsWith("0x")) normalized = normalized.slice(2);

  if (!normalized) return { value: null, error: "invalid" };
  if (normalized.length > MAX_DIGITS) {
    return { value: null, error: "too-long" };
  }

  let result = 0n;
  const radix = BigInt(base);
  for (const character of normalized) {
    const digit = digitValue(character);
    if (digit < 0 || digit >= base) {
      return { value: null, error: "invalid" };
    }
    result = result * radix + BigInt(digit);
  }

  return { value: negative ? -result : result, error: null };
}

function prefixForBase(base: number): string {
  if (base === 2) return "0b";
  if (base === 8) return "0o";
  if (base === 16) return "0x";
  return "";
}

function groupFromRight(value: string, size: number): string {
  if (!size) return value;
  const groups: string[] = [];
  for (let end = value.length; end > 0; end -= size) {
    groups.unshift(value.slice(Math.max(0, end - size), end));
  }
  return groups.join(" ");
}

function formatInteger(
  value: bigint,
  base: number,
  uppercase: boolean,
  groupSize: number,
  includePrefix: boolean,
): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  let digits = absolute.toString(base);
  if (uppercase) digits = digits.toUpperCase();
  digits = groupFromRight(digits, groupSize);
  const prefix = includePrefix ? prefixForBase(base) : "";
  return (negative ? "-" : "") + prefix + digits;
}

function baseLabel(base: number, isEn: boolean): string {
  const known = (isEn ? BASE_NAMES_EN : BASE_NAMES_RU)[base];
  return known
    ? known + " (" + String(base) + ")"
    : (isEn ? "Base " : "Основание ") + String(base);
}

export default function NumberSystem() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [input, setInput] = useState("42");
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(16);
  const [showAllBases, setShowAllBases] = useState(false);
  const [uppercase, setUppercase] = useState(true);
  const [includePrefix, setIncludePrefix] = useState(false);
  const [groupSize, setGroupSize] = useState(0);
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(
    () => parseIntegerInput(input, fromBase),
    [fromBase, input],
  );
  const baseOptions = showAllBases
    ? Array.from({ length: 35 }, (_, index) => index + 2)
    : COMMON_BASES;
  const result =
    parsed.value === null
      ? ""
      : formatInteger(
          parsed.value,
          toBase,
          uppercase,
          groupSize,
          includePrefix,
        );

  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const hasFreshResult =
    parsed.value !== null && fromBase !== toBase;

  const properties = useMemo(() => {
    if (parsed.value === null) return null;
    const absolute = parsed.value < 0n ? -parsed.value : parsed.value;
    const binary = absolute.toString(2);
    return {
      bitLength: absolute === 0n ? 0 : binary.length,
      setBits: absolute === 0n ? 0 : binary.split("1").length - 1,
      sign:
        parsed.value < 0n
          ? isEn
            ? "Negative"
            : "Отрицательное"
          : parsed.value === 0n
            ? "0"
            : isEn
              ? "Positive"
              : "Положительное",
      decimalDigits: absolute.toString(10).length,
    };
  }, [isEn, parsed.value]);

  const commonResults = useMemo(() => {
    if (parsed.value === null) return [];
    return COMMON_BASES.map((base) => ({
      base,
      label: baseLabel(base, isEn),
      value: formatInteger(
        parsed.value!,
        base,
        uppercase,
        groupSize,
        includePrefix,
      ),
    }));
  }, [groupSize, includePrefix, isEn, parsed.value, uppercase]);

  const swap = () => {
    const nextFrom = toBase;
    const nextTo = fromBase;
    if (parsed.value !== null) {
      setInput(formatInteger(parsed.value, nextFrom, uppercase, 0, false));
    }
    setFromBase(nextFrom);
    setToBase(nextTo);
  };

  const toggleAllBases = (enabled: boolean) => {
    setShowAllBases(enabled);
    if (!enabled) {
      if (!COMMON_BASES.includes(fromBase)) setFromBase(10);
      if (!COMMON_BASES.includes(toBase)) setToBase(16);
    }
  };

  const errorText =
    parsed.error === "too-long"
      ? isEn
        ? "The input exceeds the 10,000-digit safety limit."
        : "Ввод превышает безопасный лимит в 10 000 цифр."
      : parsed.error === "invalid"
        ? isEn
          ? "The value contains a digit that is not valid for the selected base."
          : "Значение содержит цифру, недопустимую для выбранного основания."
        : "";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      {/* 1-Click Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Быстрый выбор:"}
        </span>
        {NUMBER_SYSTEM_PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setInput(p.value);
              setFromBase(p.from);
              setToBase(p.to);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
              fromBase === p.from && toBase === p.to && input === p.value
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="number-system-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? "Value" : "Значение"}
            </Label>
            <Input
              id="number-system-value"
              type="text"
              inputMode={fromBase <= 10 ? "decimal" : "text"}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={fromBase === 16 ? "2A" : "42"}
              className={cn(
                "mt-1.5 h-14 font-mono text-2xl font-bold",
                parsed.error &&
                  parsed.error !== "empty" &&
                  "border-[var(--color-danger)]/60",
              )}
              maxLength={MAX_DIGITS + 100}
              autoComplete="off"
            />
            {errorText ? (
              <p className="mt-1.5 text-xs text-[var(--color-danger)]">{errorText}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "From base" : "Из основания"}
              </Label>
              <select
                value={fromBase}
                onChange={(event) => {
                  setFromBase(Number(event.target.value));
                }}
                className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
              >
                {baseOptions.map((base) => (
                  <option key={base} value={base}>
                    {baseLabel(base, isEn)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={swap}
              disabled={fromBase === toBase}
              aria-label={isEn ? "Swap bases" : "Поменять основания"}
              className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95 disabled:opacity-40"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {isEn ? "To base" : "В основание"}
              </Label>
              <select
                value={toBase}
                onChange={(event) => {
                  setToBase(Number(event.target.value));
                }}
                className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium"
              >
                {baseOptions.map((base) => (
                  <option key={base} value={base}>
                    {baseLabel(base, isEn)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section
          className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)]/30 p-4"
          aria-live="polite"
        >
          <div className="mb-2 flex min-h-8 items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
              {isEn ? "Result" : "Результат"}
            </span>
            {hasFreshResult ? <CopyButton text={result} size="medium" /> : null}
          </div>
          <p className="break-all font-mono text-3xl font-extrabold text-[var(--color-text)]">
            {hasFreshResult
              ? result
              : isEn
                ? "Result appears here"
                : "Здесь появится результат"}
          </p>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            onClick={() => void handleCopyResult()}
            disabled={parsed.value === null || fromBase === toBase}
            leadingIcon={copied ? <Check size={20} /> : <Copy size={20} />}
          >
            {copied
              ? (isEn ? "Copied!" : "Скопировано!")
              : (isEn ? "Copy result" : "Копировать результат")}
          </ToolPrimaryAction>
        </div>
      </Card>

      <AdvancedSettings
        title={isEn ? "More number-system options" : "Дополнительные настройки"}
        description={
          isEn
            ? "Bases 2–36, grouping, prefixes and integer properties"
            : "Основания 2–36, группировка, префиксы и свойства числа"
        }
      >
        <div className="space-y-5 [&_button]:min-h-11 [&_select]:min-h-11">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={showAllBases}
              onChange={(event) => toggleAllBases(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            {isEn ? "Enable bases 2–36" : "Включить основания 2–36"}
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(event) => {
                  setUppercase(event.target.checked);
                }}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Uppercase letters" : "Заглавные буквы"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={includePrefix}
                onChange={(event) => {
                  setIncludePrefix(event.target.checked);
                }}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn
                ? "Add 0b / 0o / 0x prefix"
                : "Добавлять префикс 0b / 0o / 0x"}
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block">
              {isEn ? "Group digits" : "Группировать цифры"}
            </span>
            <select
              value={groupSize}
              onChange={(event) => {
                setGroupSize(Number(event.target.value));
              }}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:max-w-xs"
            >
              <option value={0}>
                {isEn ? "No grouping" : "Без группировки"}
              </option>
              <option value={4}>{isEn ? "Groups of 4" : "По 4"}</option>
              <option value={8}>{isEn ? "Groups of 8" : "По 8"}</option>
            </select>
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={swap}
            disabled={fromBase === toBase}
          >
            <ArrowsLeftRight size={18} />
            {isEn ? "Swap bases" : "Поменять основания"}
          </Button>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
            {isEn
              ? "Exact BigInt conversion for signed integers only. Fractions are not accepted. Spaces and underscores are ignored. Inputs are limited to 10,000 digits."
              : "Точное преобразование BigInt только для целых чисел со знаком. Дроби не поддерживаются. Пробелы и подчёркивания игнорируются. Лимит — 10 000 цифр."}
          </div>

          {properties ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "Integer properties" : "Свойства целого числа"}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Bit length" : "Битовая длина"}
                  </span>
                  <strong className="font-mono">{properties.bitLength}</strong>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Set bits" : "Единичных битов"}
                  </span>
                  <strong className="font-mono">{properties.setBits}</strong>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Sign" : "Знак"}
                  </span>
                  <strong>{properties.sign}</strong>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
                  <span className="block text-[var(--color-text-muted)]">
                    {isEn ? "Decimal digits" : "Десятичных цифр"}
                  </span>
                  <strong className="font-mono">
                    {properties.decimalDigits}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}

          {commonResults.length ? (
            <div>
              <p className="mb-2 text-sm font-medium">
                {isEn ? "Common bases" : "Основные системы"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {commonResults.map((item) => (
                  <div
                    key={item.base}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--color-text-muted)]">
                      {item.label}
                    </span>
                    <span className="max-w-[65%] break-all text-right font-mono text-sm font-semibold">
                      {item.value}
                    </span>
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
