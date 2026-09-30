"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  ClipboardText,
  Equals,
  Sparkle,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { writeClipboardText } from "@/src/utils/clipboard";

type Slot = "A" | "B" | "C" | "D";

interface SolveResult {
  slot: Slot;
  value: number;
  formula: string;
}

const SLOT_ORDER: readonly Slot[] = ["A", "B", "C", "D"];

function parseKnownValue(value: string) {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function solveProportion(values: Record<Slot, string>): {
  result: SolveResult | null;
  error: string | null;
} {
  const parsed = Object.fromEntries(
    SLOT_ORDER.map((slot) => [slot, parseKnownValue(values[slot])]),
  ) as Record<Slot, number | null>;
  const missing = SLOT_ORDER.filter((slot) => parsed[slot] === null);

  if (missing.length === 0) {
    return { result: null, error: "all_filled" };
  }
  if (missing.length > 1) {
    return { result: null, error: "missing" };
  }
  if (
    SLOT_ORDER.some(
      (slot) => parsed[slot] !== null && Number.isNaN(parsed[slot]),
    )
  ) {
    return { result: null, error: "number" };
  }
  if (parsed.B === 0 || parsed.D === 0) {
    return { result: null, error: "denominator" };
  }

  const slot = missing[0];
  const a = parsed.A;
  const b = parsed.B;
  const c = parsed.C;
  const d = parsed.D;
  let value: number;
  let formula = "";

  if (slot === "A") {
    value = ((b as number) * (c as number)) / (d as number);
    formula = `A = (${values.B} × ${values.C}) / ${values.D}`;
  } else if (slot === "B") {
    if (c === null || c === 0) return { result: null, error: "indeterminate" };
    value = ((a as number) * (d as number)) / c;
    formula = `B = (${values.A} × ${values.D}) / ${values.C}`;
  } else if (slot === "C") {
    value = ((a as number) * (d as number)) / (b as number);
    formula = `C = (${values.A} × ${values.D}) / ${values.B}`;
  } else {
    if (a === null || a === 0) return { result: null, error: "indeterminate" };
    value = ((b as number) * (c as number)) / a;
    formula = `D = (${values.B} × ${values.C}) / ${values.A}`;
  }

  if (!Number.isFinite(value)) {
    return { result: null, error: "finite" };
  }
  if ((slot === "B" || slot === "D") && value === 0) {
    return { result: null, error: "denominator" };
  }
  return { result: { slot, value, formula }, error: null };
}

function formatNumber(value: number, decimals: number) {
  const rounded = Number(value.toFixed(decimals));
  return Object.is(rounded, -0)
    ? "0"
    : rounded.toLocaleString("en-US", {
        useGrouping: false,
        maximumFractionDigits: decimals,
      });
}

interface Preset {
  labelRu: string;
  labelEn: string;
  A: string;
  B: string;
  C: string;
  D: string;
}

const PRESETS: Preset[] = [
  {
    labelRu: "Разрешение 16:9 (1920×1080 → 1280×?)",
    labelEn: "16:9 Aspect (1920×1080 → 1280×?)",
    A: "1920",
    B: "1080",
    C: "1280",
    D: "",
  },
  {
    labelRu: "Рецепт (4 порции → 7 порций)",
    labelEn: "Recipe scale (4 portions → 7)",
    A: "400",
    B: "4",
    C: "",
    D: "7",
  },
  {
    labelRu: "Проценты (150 из 600 = ? из 100)",
    labelEn: "Percentage (150 of 600 = ? of 100)",
    A: "150",
    B: "600",
    C: "",
    D: "100",
  },
  {
    labelRu: "Масштаб карты 1:50 000 (3 см = ? м)",
    labelEn: "Scale 1:50,000 (3 cm = ?)",
    A: "1",
    B: "50000",
    C: "3",
    D: "",
  },
];

export default function ProportionCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const [values, setValues] = useState<Record<Slot, string>>({
    A: "1920",
    B: "1080",
    C: "1280",
    D: "",
  });
  const [targetSlot, setTargetSlot] = useState<Slot>("D");
  const [decimals, setDecimals] = useState(2);
  const [copyStatus, setCopyStatus] = useState(false);

  const solved = useMemo(() => solveProportion(values), [values]);

  const update = (slot: Slot, value: string) => {
    setValues((prev) => ({ ...prev, [slot]: value }));
  };

  const setUnknownSlot = (slot: Slot) => {
    setTargetSlot(slot);
    setValues((prev) => ({ ...prev, [slot]: "" }));
  };

  const applyPreset = (p: Preset) => {
    setValues({ A: p.A, B: p.B, C: p.C, D: p.D });
    const empty = (["A", "B", "C", "D"] as Slot[]).find((k) => !p[k]);
    if (empty) setTargetSlot(empty);
  };

  const clear = () => {
    setValues({ A: "", B: "", C: "", D: "" });
  };

  const solvedResult = solved.result;
  const formattedResult = solvedResult
    ? formatNumber(solvedResult.value, decimals)
    : null;

  const copyResult = async () => {
    if (!formattedResult) return;
    await writeClipboardText(formattedResult);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* 1-Click Common Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-amber-500" />
          {isEn ? "Presets:" : "Сценарии:"}
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(p)}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
          >
            {isEn ? p.labelEn : p.labelRu}
          </button>
        ))}
        {(values.A || values.B || values.C || values.D) && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-red-500"
          >
            <Trash size={14} />
            {isEn ? "Clear" : "Очистить"}
          </button>
        )}
      </div>

      <Card className="p-4 sm:p-6">
        {/* Slot selector for quick solve targeting */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span>{isEn ? "Solve for:" : "Искать значение:"}</span>
            {SLOT_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setUnknownSlot(s)}
                className={cn(
                  "h-7 w-7 rounded-md font-mono text-xs font-bold transition-colors",
                  targetSlot === s
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Inline Precision Controls (No hidden spoiler!) */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <Label htmlFor="prop-precision" className="text-xs">
              {isEn ? "Decimals:" : "Точность:"}
            </Label>
            <select
              id="prop-precision"
              value={decimals}
              onChange={(e) => setDecimals(Number(e.target.value))}
              className="h-7 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text)]"
            >
              {[0, 1, 2, 3, 4, 6].map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? (isEn ? "Integer (0)" : "Целое (0)") : `${n}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Visual Proportion Fraction Formula */}
        <div className="my-3 flex items-center justify-center gap-3 sm:gap-6">
          {/* Fraction 1: A / B */}
          <div className="flex w-36 flex-col items-center gap-2 sm:w-44">
            <div className="relative w-full">
              <span className="absolute -top-5 left-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                A {targetSlot === "A" && "(X)"}
              </span>
              <Input
                id="proportion-a"
                inputMode="decimal"
                value={values.A}
                onChange={(e) => update("A", e.target.value)}
                placeholder={targetSlot === "A" ? "X" : "A"}
                className={cn(
                  "h-12 text-center text-lg font-bold font-mono transition-colors",
                  targetSlot === "A" && "border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] placeholder:text-[var(--color-primary)]",
                )}
              />
            </div>
            <div className="h-0.5 w-full bg-[var(--color-border-strong)] rounded-full" />
            <div className="relative w-full">
              <span className="absolute -top-5 left-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                B {targetSlot === "B" && "(X)"}
              </span>
              <Input
                id="proportion-b"
                inputMode="decimal"
                value={values.B}
                onChange={(e) => update("B", e.target.value)}
                placeholder={targetSlot === "B" ? "X" : "B"}
                className={cn(
                  "h-12 text-center text-lg font-bold font-mono transition-colors",
                  targetSlot === "B" && "border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] placeholder:text-[var(--color-primary)]",
                )}
              />
            </div>
          </div>

          {/* Equals Sign */}
          <Equals
            size={36}
            weight="bold"
            className="shrink-0 text-[var(--color-primary)]"
            aria-hidden="true"
          />

          {/* Fraction 2: C / D */}
          <div className="flex w-36 flex-col items-center gap-2 sm:w-44">
            <div className="relative w-full">
              <span className="absolute -top-5 left-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                C {targetSlot === "C" && "(X)"}
              </span>
              <Input
                id="proportion-c"
                inputMode="decimal"
                value={values.C}
                onChange={(e) => update("C", e.target.value)}
                placeholder={targetSlot === "C" ? "X" : "C"}
                className={cn(
                  "h-12 text-center text-lg font-bold font-mono transition-colors",
                  targetSlot === "C" && "border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] placeholder:text-[var(--color-primary)]",
                )}
              />
            </div>
            <div className="h-0.5 w-full bg-[var(--color-border-strong)] rounded-full" />
            <div className="relative w-full">
              <span className="absolute -top-5 left-1 text-[10px] font-bold text-[var(--color-text-muted)]">
                D {targetSlot === "D" && "(X)"}
              </span>
              <Input
                id="proportion-d"
                inputMode="decimal"
                value={values.D}
                onChange={(e) => update("D", e.target.value)}
                placeholder={targetSlot === "D" ? "X" : "D"}
                className={cn(
                  "h-12 text-center text-lg font-bold font-mono transition-colors",
                  targetSlot === "D" && "border-2 border-dashed border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] placeholder:text-[var(--color-primary)]",
                )}
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Result Card */}
        {solvedResult ? (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isEn ? "Solution" : "Решение пропорции"}
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[var(--color-text)]">
                    {solvedResult.slot} = {formattedResult}
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs text-[var(--color-text-muted)]">
                  {solvedResult.formula} = {formattedResult}
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
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center text-sm text-[var(--color-text-muted)]">
            {solved.error === "all_filled"
              ? isEn
                ? "All four fields are filled. Clear one field or choose what to solve above."
                : "Заполнены все 4 поля. Очистите одно поле или нажмите букву для поиска выше."
              : solved.error === "denominator"
                ? isEn
                  ? "Denominators B and D cannot be zero."
                  : "Знаменатели B и D не могут быть равны нулю."
                : isEn
                  ? "Fill any 3 values to solve for the missing one."
                  : "Заполните любые 3 значения, чтобы вычислить четвёртое."}
          </div>
        )}
      </Card>

      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? "Precision and rules" : "Точность и правила"}
        description={isEn ? "Round decimal places and zero handling" : "Округление знаков и обработка нулей"}
      >
        <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <p>{isEn ? "Cross-multiplication rule: A × D = B × C. If one value is missing, it is solved using this equality." : "Основное свойство пропорции: произведение крайних членов равно произведению средних: A × D = B × C."}</p>
          <p>{isEn ? "Denominator cannot be zero in fractions A/B and C/D." : "Знаменатели дробей B и D не могут равняться нулю."}</p>
        </div>
      </AdvancedSettings>
    </div>
  );
}
