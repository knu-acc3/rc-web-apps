"use client";

import { useRef, useState } from "react";
import { Shuffle, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { useLanguage } from "@/src/i18n/LanguageContext";

type PickerMode = "list" | "integer" | "coin" | "die";
type PickerErrorCode =
  | "list-min"
  | "list-count"
  | "list-length"
  | "integer-invalid"
  | "integer-order"
  | "integer-range"
  | "die-invalid"
  | "die-range";

type PickerResult =
  | {
      kind: "success";
      mode: PickerMode;
      value: string;
      detail: string;
    }
  | {
      kind: "error";
      code: PickerErrorCode;
    };

class PickerInputError extends Error {
  code: PickerErrorCode;

  constructor(code: PickerErrorCode) {
    super(code);
    this.name = "PickerInputError";
    this.code = code;
  }
}

const MAX_LIST_ITEMS = 500;
const MAX_ITEM_LENGTH = 200;
const MAX_LIST_LENGTH = 50_000;
const MIN_INTEGER = -1_000_000_000;
const MAX_INTEGER = 1_000_000_000;
const MAX_DIE_SIDES = 1_000;
const UINT32_RANGE = 0x1_0000_0000;
const INTEGER_VALUE = /^[+-]?\d+$/;

export function unbiasedRandomInt(maxExclusive: number): number {
  if (
    !Number.isSafeInteger(maxExclusive) ||
    maxExclusive <= 0 ||
    maxExclusive > UINT32_RANGE
  ) {
    throw new RangeError("maxExclusive is outside the supported range");
  }

  const cryptoSource =
    typeof globalThis === "undefined" ? undefined : globalThis.crypto;
  if (cryptoSource?.getRandomValues) {
    const acceptedRange = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    const buffer = new Uint32Array(1);

    do {
      cryptoSource.getRandomValues(buffer);
    } while (buffer[0] >= acceptedRange);

    return buffer[0] % maxExclusive;
  }

  return Math.floor(Math.random() * maxExclusive);
}

function parseInteger(value: string): number {
  const trimmed = value.trim();
  if (!INTEGER_VALUE.test(trimmed)) {
    throw new PickerInputError("integer-invalid");
  }

  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed)) {
    throw new PickerInputError("integer-invalid");
  }
  if (parsed < MIN_INTEGER || parsed > MAX_INTEGER) {
    throw new PickerInputError("integer-range");
  }
  return parsed;
}

function parseList(value: string, deduplicate: boolean): string[] {
  const entries = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length > MAX_LIST_ITEMS) {
    throw new PickerInputError("list-count");
  }
  if (entries.some((entry) => entry.length > MAX_ITEM_LENGTH)) {
    throw new PickerInputError("list-length");
  }

  const validEntries = deduplicate ? Array.from(new Set(entries)) : entries;
  if (validEntries.length < 2) {
    throw new PickerInputError("list-min");
  }
  return validEntries;
}

function generateResult(
  mode: PickerMode,
  options: {
    list: string;
    deduplicate: boolean;
    minimum: string;
    maximum: string;
    dieSides: string;
  },
  isEn: boolean,
): PickerResult {
  try {
    if (mode === "list") {
      const entries = parseList(options.list, options.deduplicate);
      const index = unbiasedRandomInt(entries.length);
      return {
        kind: "success",
        mode,
        value: entries[index],
        detail: isEn
          ? "Chosen from " + entries.length + " valid entries"
          : "Выбрано из " + entries.length + " корректных вариантов",
      };
    }

    if (mode === "integer") {
      const minimum = parseInteger(options.minimum);
      const maximum = parseInteger(options.maximum);
      if (minimum > maximum) {
        throw new PickerInputError("integer-order");
      }

      const span = maximum - minimum + 1;
      return {
        kind: "success",
        mode,
        value: String(minimum + unbiasedRandomInt(span)),
        detail: isEn
          ? "Inclusive range " + minimum + "–" + maximum
          : "Включительный диапазон " + minimum + "–" + maximum,
      };
    }

    if (mode === "coin") {
      const heads = unbiasedRandomInt(2) === 0;
      return {
        kind: "success",
        mode,
        value: heads ? (isEn ? "Heads" : "Орёл") : isEn ? "Tails" : "Решка",
        detail: isEn ? "One coin flip" : "Один бросок монеты",
      };
    }

    const trimmedSides = options.dieSides.trim();
    if (!INTEGER_VALUE.test(trimmedSides)) {
      throw new PickerInputError("die-invalid");
    }
    const sides = Number(trimmedSides);
    if (!Number.isSafeInteger(sides)) {
      throw new PickerInputError("die-invalid");
    }
    if (sides < 2 || sides > MAX_DIE_SIDES) {
      throw new PickerInputError("die-range");
    }

    return {
      kind: "success",
      mode,
      value: String(unbiasedRandomInt(sides) + 1),
      detail: isEn ? sides + "-sided die" : "Кубик с " + sides + " гранями",
    };
  } catch (caught) {
    if (caught instanceof PickerInputError) {
      return { kind: "error", code: caught.code };
    }
    return {
      kind: "error",
      code: mode === "die" ? "die-invalid" : "integer-invalid",
    };
  }
}

function errorMessage(code: PickerErrorCode, isEn: boolean): string {
  if (code === "list-min") {
    return isEn
      ? "Enter at least two valid options. Empty lines are ignored."
      : "Введите минимум два корректных варианта. Пустые строки игнорируются.";
  }
  if (code === "list-count") {
    return isEn
      ? "The list can contain up to 500 non-empty options."
      : "В списке может быть не больше 500 непустых вариантов.";
  }
  if (code === "list-length") {
    return isEn
      ? "Each option can contain up to 200 characters."
      : "Каждый вариант может содержать не больше 200 символов.";
  }
  if (code === "integer-invalid") {
    return isEn
      ? "Enter valid whole numbers for both bounds."
      : "Введите корректные целые числа для обеих границ.";
  }
  if (code === "integer-order") {
    return isEn
      ? "Minimum cannot be greater than maximum."
      : "Минимум не может быть больше максимума.";
  }
  if (code === "integer-range") {
    return isEn
      ? "Each bound must be from −1,000,000,000 to 1,000,000,000."
      : "Каждая граница должна быть от −1 000 000 000 до 1 000 000 000.";
  }
  if (code === "die-range") {
    return isEn
      ? "The die must have from 2 to 1,000 sides."
      : "У кубика должно быть от 2 до 1 000 граней.";
  }
  return isEn
    ? "Enter a valid whole number of sides."
    : "Введите корректное целое число граней.";
}

function modeLabel(mode: PickerMode, isEn: boolean): string {
  if (mode === "list") {
    return isEn ? "Random choice" : "Случайный выбор";
  }
  if (mode === "integer") {
    return isEn ? "Random integer" : "Случайное целое число";
  }
  if (mode === "coin") {
    return isEn ? "Coin flip" : "Бросок монеты";
  }
  return isEn ? "Die roll" : "Бросок кубика";
}

function actionLabel(mode: PickerMode, isEn: boolean): string {
  if (mode === "list") {
    return isEn ? "Pick randomly" : "Выбрать случайно";
  }
  if (mode === "integer") {
    return isEn ? "Generate integer" : "Получить число";
  }
  if (mode === "coin") {
    return isEn ? "Flip coin" : "Бросить монету";
  }
  return isEn ? "Roll die" : "Бросить кубик";
}

export default function RandomPicker() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<PickerMode>("list");
  const [list, setList] = useState("");
  const [deduplicate, setDeduplicate] = useState(false);
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [dieSides, setDieSides] = useState("6");
  const [result, setResult] = useState<PickerResult | null>(null);
  const listRef = useRef<HTMLTextAreaElement>(null);
  const minimumRef = useRef<HTMLInputElement>(null);
  const dieRef = useRef<HTMLInputElement>(null);

  const focusModeField = (nextMode: PickerMode) => {
    window.requestAnimationFrame(() => {
      if (nextMode === "list") listRef.current?.focus();
      if (nextMode === "integer") minimumRef.current?.focus();
      if (nextMode === "die") dieRef.current?.focus();
    });
  };

  return (
    <div
      data-entertainment-tool="random-picker"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-bold text-[var(--color-text)]">
          {modeLabel(mode, isEn)}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {mode === "list"
            ? isEn
              ? "Add one option per line. Empty lines are ignored."
              : "Добавьте по одному варианту на строку. Пустые строки игнорируются."
            : mode === "integer"
              ? isEn
                ? "Enter the inclusive minimum and maximum."
                : "Укажите включительные минимум и максимум."
              : mode === "coin"
                ? isEn
                  ? "Flip one fair two-sided coin."
                  : "Бросьте одну равновероятную двустороннюю монету."
                : isEn
                  ? "Set the number of sides, then roll once."
                  : "Укажите число граней и выполните один бросок."}
        </p>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            setResult(
              generateResult(
                mode,
                {
                  list,
                  deduplicate,
                  minimum,
                  maximum,
                  dieSides,
                },
                isEn,
              ),
            );
          }}
        >
          {mode === "list" ? (
            <div>
              <Label htmlFor="random-list">
                {isEn
                  ? "Options — one per line"
                  : "Варианты — по одному на строку"}
              </Label>
              <Textarea
                ref={listRef}
                id="random-list"
                value={list}
                onChange={(event) => {
                  setList(event.target.value);
                  setResult(null);
                }}
                maxLength={MAX_LIST_LENGTH}
                rows={7}
                autoFocus
                spellCheck={false}
                className="mt-2"
                placeholder={
                  isEn ? "One option per line" : "Один вариант на строку"
                }
              />
            </div>
          ) : mode === "integer" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="random-minimum">
                  {isEn ? "Minimum" : "Минимум"}
                </Label>
                <Input
                  ref={minimumRef}
                  id="random-minimum"
                  value={minimum}
                  onChange={(event) => {
                    setMinimum(event.target.value);
                    setResult(null);
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                  className="mt-2 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="random-maximum">
                  {isEn ? "Maximum" : "Максимум"}
                </Label>
                <Input
                  id="random-maximum"
                  value={maximum}
                  onChange={(event) => {
                    setMaximum(event.target.value);
                    setResult(null);
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={12}
                  className="mt-2 font-mono"
                />
              </div>
            </div>
          ) : mode === "die" ? (
            <div className="max-w-sm">
              <Label htmlFor="random-die-sides">
                {isEn ? "Number of sides" : "Количество граней"}
              </Label>
              <Input
                ref={dieRef}
                id="random-die-sides"
                value={dieSides}
                onChange={(event) => {
                  setDieSides(event.target.value);
                  setResult(null);
                }}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                maxLength={4}
                className="mt-2 font-mono"
              />
            </div>
          ) : null}

          <ToolPrimaryAction
            type="submit"
            className={mode === "coin" ? "" : "mt-4"}
            leadingIcon={<Shuffle size={20} weight="bold" />}
          >
            {actionLabel(mode, isEn)}
          </ToolPrimaryAction>
        </form>

        {result ? (
          result.kind === "error" ? (
            <section
              aria-live="polite"
              data-random-result=""
              data-random-status="error"
              role="alert"
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <div className="flex items-start gap-3">
                <XCircle
                  size={24}
                  weight="fill"
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[var(--color-danger)]"
                />
                <div>
                  <h3 className="font-bold text-[var(--color-danger)]">
                    {isEn ? "Check the input" : "Проверьте данные"}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {errorMessage(result.code, isEn)}
                  </p>
                </div>
              </div>
            </section>
          ) : (
            <section
              aria-live="polite"
              data-random-result=""
              data-random-status="success"
              data-random-mode={result.mode}
              data-random-value={result.value}
              className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-surface-muted)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {isEn ? "Result" : "Результат"}
              </p>
              <p className="mt-1 break-words text-3xl font-black tracking-tight text-[var(--color-text)]">
                {result.value}
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {result.detail}
              </p>
            </section>
          )
        ) : null}
      </section>

      <AdvancedSettings
        title={isEn ? "Mode and list handling" : "Режим и обработка списка"}
        description={
          isEn
            ? "Switch generator or remove exact duplicates"
            : "Смена генератора или удаление точных дублей"
        }
      >
        <Label htmlFor="random-mode">{isEn ? "Mode" : "Режим"}</Label>
        <select
          id="random-mode"
          value={mode}
          onChange={(event) => {
            const nextMode = event.target.value as PickerMode;
            setMode(nextMode);
            setResult(null);
            focusModeField(nextMode);
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] sm:text-sm"
        >
          <option value="list">
            {isEn ? "Choose from a list" : "Выбор из списка"}
          </option>
          <option value="integer">
            {isEn ? "Integer in a range" : "Целое число в диапазоне"}
          </option>
          <option value="coin">{isEn ? "Coin" : "Монета"}</option>
          <option value="die">{isEn ? "Die" : "Кубик"}</option>
        </select>

        {mode === "list" ? (
          <div className="mt-4">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2.5">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(event) => {
                  setDeduplicate(event.target.checked);
                  setResult(null);
                }}
                className="size-5 shrink-0 accent-[var(--color-primary)]"
              />
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {isEn
                  ? "Remove exact duplicates before choosing"
                  : "Удалять точные дубли перед выбором"}
              </span>
            </label>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Off by default: repeated lines are separate entries and therefore receive separate chances."
                : "По умолчанию выключено: повторяющиеся строки считаются отдельными вариантами и получают отдельные шансы."}
            </p>
          </div>
        ) : null}

        <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "When available, the browser supplies random values and rejection sampling removes modulo bias. A standard runtime generator is used as a fallback; this tool is not intended for security-sensitive choices."
            : "Если доступно, случайные значения берутся из браузера, а rejection sampling устраняет modulo bias. В качестве запасного варианта используется стандартный генератор среды; инструмент не предназначен для решений, связанных с безопасностью."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
