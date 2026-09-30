"use client";

import { useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type SortMode = "none" | "asc" | "desc";
type RandomSource = "crypto" | "math";

const UINT64_RANGE = 1n << 64n;
const MAX_SAFE_SPAN = BigInt(Number.MAX_SAFE_INTEGER);

function hasWebCrypto() {
  return typeof globalThis.crypto?.getRandomValues === "function";
}

function secureUint64() {
  const words = new Uint32Array(2);
  globalThis.crypto.getRandomValues(words);
  return (BigInt(words[0]) << 32n) | BigInt(words[1]);
}

function secureInteger(min: number, max: number) {
  const span = BigInt(max) - BigInt(min) + 1n;
  const rejectionLimit = UINT64_RANGE - (UINT64_RANGE % span);
  let value = secureUint64();
  while (value >= rejectionLimit) value = secureUint64();
  return Number(BigInt(min) + (value % span));
}

function secureUnit() {
  return Number(secureUint64() >> 11n) / 9_007_199_254_740_992;
}

function pseudoInteger(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function formatNumber(value: number, integer: boolean) {
  if (integer) return String(value);
  return String(Number(value.toFixed(6)));
}

export default function RandomNumber() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [minimum, setMinimum] = useState("1");
  const [maximum, setMaximum] = useState("100");
  const [count, setCount] = useState("1");
  const [integer, setInteger] = useState(true);
  const [unique, setUnique] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("none");
  const [preferCrypto, setPreferCrypto] = useState(true);
  const [results, setResults] = useState<number[]>([]);
  const [source, setSource] = useState<RandomSource>("math");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const min = Number(minimum);
    const max = Number(maximum);
    const parsedCount = Number(count);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      setError(
        isEn
          ? "Minimum and maximum must be finite numbers."
          : "Минимум и максимум должны быть конечными числами.",
      );
      return;
    }
    if (min > max) {
      setError(
        isEn
          ? "Minimum cannot be greater than maximum."
          : "Минимум не может быть больше максимума.",
      );
      return;
    }
    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 1 ||
      parsedCount > 1000
    ) {
      setError(
        isEn
          ? "Count must be a whole number from 1 to 1000."
          : "Количество должно быть целым числом от 1 до 1000.",
      );
      return;
    }
    if (integer && (!Number.isSafeInteger(min) || !Number.isSafeInteger(max))) {
      setError(
        isEn
          ? "Integer bounds must be safe whole numbers."
          : "Границы целых чисел должны быть безопасными целыми значениями.",
      );
      return;
    }

    const integerSpan = integer ? BigInt(max) - BigInt(min) + 1n : 0n;
    if (integer && integerSpan > MAX_SAFE_SPAN) {
      setError(
        isEn
          ? "The integer range is too large for exact JavaScript numbers."
          : "Диапазон слишком велик для точных чисел JavaScript.",
      );
      return;
    }
    if (unique && integer && BigInt(parsedCount) > integerSpan) {
      setError(
        isEn
          ? "Unique count is larger than the available integer range."
          : "Уникальных значений запрошено больше, чем есть в диапазоне.",
      );
      return;
    }
    if (!integer && !Number.isFinite(max - min)) {
      setError(
        isEn
          ? "The fractional range is too large."
          : "Диапазон дробных чисел слишком велик.",
      );
      return;
    }

    const useSecureSource = preferCrypto && hasWebCrypto();
    const randomInteger = useSecureSource ? secureInteger : pseudoInteger;
    const randomUnit = useSecureSource ? secureUnit : Math.random;
    let generated: number[];

    if (integer && unique) {
      const span = Number(integerSpan);
      const selected = new Set<number>();
      for (let cursor = span - parsedCount; cursor < span; cursor += 1) {
        const candidate = randomInteger(0, cursor);
        selected.add(selected.has(candidate) ? cursor : candidate);
      }
      generated = [...selected].map((offset) => min + offset);
      for (let index = generated.length - 1; index > 0; index -= 1) {
        const swapIndex = randomInteger(0, index);
        [generated[index], generated[swapIndex]] = [
          generated[swapIndex],
          generated[index],
        ];
      }
    } else {
      generated = Array.from({ length: parsedCount }, () => {
        if (integer) return randomInteger(min, max);
        if (min === max) return min;
        return min + randomUnit() * (max - min);
      });
    }

    if (sortMode === "asc") generated.sort((a, b) => a - b);
    if (sortMode === "desc") generated.sort((a, b) => b - a);

    setResults(generated);
    setSource(useSecureSource ? "crypto" : "math");
    setError("");
    setCopied(false);
  };

  const copyResults = async () => {
    const value = results
      .map((result) => formatNumber(result, integer))
      .join("\n");
    const success = await copyText(value);
    if (!success) {
      setError(
        isEn
          ? "Clipboard access was denied."
          : "Браузер запретил доступ к буферу обмена.",
      );
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <Label htmlFor="random-number-min">
              {isEn ? "Minimum" : "Минимум"}
            </Label>
            <Input
              id="random-number-min"
              type="number"
              inputMode="decimal"
              value={minimum}
              onChange={(event) => setMinimum(event.target.value)}
              className="mt-1.5 h-12"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="random-number-max">
              {isEn ? "Maximum" : "Максимум"}
            </Label>
            <Input
              id="random-number-max"
              type="number"
              inputMode="decimal"
              value={maximum}
              onChange={(event) => setMaximum(event.target.value)}
              className="mt-1.5 h-12"
            />
          </div>
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={generate}>
          {isEn ? "Generate number" : "Создать число"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the range" : "Проверьте диапазон"}
            description={error}
            className="mt-5"
          />
        ) : results.length > 0 ? (
          <ToolResult
            status="success"
            title={
              results.length === 1
                ? isEn
                  ? "Generated number"
                  : "Готовое число"
                : isEn
                  ? "Generated numbers"
                  : "Готовые числа"
            }
            description={
              source === "crypto"
                ? isEn
                  ? "Web Crypto was used."
                  : "Использован Web Crypto."
                : isEn
                  ? "Math.random was used; this is not security-sensitive randomness."
                  : "Использован Math.random; это не случайность для задач безопасности."
            }
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copyResults()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : isEn
                    ? "Copy"
                    : "Копировать"}
              </Button>
            }
          >
            {results.length === 1 ? (
              <p className="break-all font-mono text-4xl font-black leading-none text-[var(--color-text)] sm:text-5xl">
                {formatNumber(results[0], integer)}
              </p>
            ) : (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 font-mono text-base leading-7 text-[var(--color-text)]">
                {results
                  .map((result) => formatNumber(result, integer))
                  .join("\n")}
              </pre>
            )}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The generated value will appear here."
                : "Созданное значение появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Number settings" : "Настройки чисел"}
          description={
            isEn
              ? "Count, integer mode, uniqueness, sorting and random source"
              : "Количество, целые числа, уникальность, сортировка и источник"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 sm:max-w-48">
              <Label htmlFor="random-number-count">
                {isEn ? "Count" : "Количество"}
              </Label>
              <Input
                id="random-number-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                step={1}
                value={count}
                onChange={(event) => setCount(event.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="random-number-sort">
                {isEn ? "Sort" : "Сортировка"}
              </Label>
              <select
                id="random-number-sort"
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as SortMode)
                }
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="none">
                  {isEn ? "As generated" : "Как создано"}
                </option>
                <option value="asc">
                  {isEn ? "Ascending" : "По возрастанию"}
                </option>
                <option value="desc">
                  {isEn ? "Descending" : "По убыванию"}
                </option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={integer}
                onChange={(event) => {
                  setInteger(event.target.checked);
                  if (!event.target.checked) setUnique(false);
                }}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Whole numbers" : "Только целые"}
            </label>
            <label
              className={
                "flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium " +
                (integer
                  ? "cursor-pointer hover:bg-[var(--color-surface-muted)]"
                  : "cursor-not-allowed opacity-50")
              }
            >
              <input
                type="checkbox"
                checked={unique}
                disabled={!integer}
                onChange={(event) => setUnique(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Unique results" : "Уникальные значения"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)] sm:col-span-2">
              <input
                type="checkbox"
                checked={preferCrypto}
                onChange={(event) => setPreferCrypto(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn
                ? "Use Web Crypto when available"
                : "Использовать Web Crypto, если доступен"}
            </label>
          </div>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Integer bounds are inclusive. Fractional results use the interval from minimum inclusive to maximum exclusive and are shown with up to 6 decimals. Web Crypto integer sampling uses rejection sampling to avoid modulo bias."
            : "Границы целых чисел включены. Дробные значения берутся от минимума включительно до максимума исключительно и показываются с точностью до 6 знаков. Для целых чисел Web Crypto использует rejection sampling без modulo bias."}
        </p>
      </section>
    </div>
  );
}
