"use client";

import { useMemo, useState } from "react";

import {
  ArrowsLeftRight,
  Check,
  Copy,
  Sparkle,
} from "@phosphor-icons/react";
import { cn } from "@/src/lib/cn";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { writeClipboardText } from "@/src/utils/clipboard";

export type LinearUnit = {
  id: string;
  labelRu: string;
  labelEn: string;
  symbol: string;
  /** Number of base units represented by one unit. */
  factor: number;
};

type Props = {
  units: LinearUnit[];
  defaultFrom: string;
  defaultTo: string;
  valueLabelRu: string;
  valueLabelEn: string;
  baseNoteRu: string;
  baseNoteEn: string;
};

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumber(value: number, precision: number) {
  if (!Number.isFinite(value)) return "—";
  const normalized = Object.is(value, -0) ? 0 : value;
  const absolute = Math.abs(normalized);
  if (
    absolute !== 0 &&
    (absolute >= 1e15 || absolute < 10 ** -(precision + 1))
  ) {
    return normalized
      .toExponential(Math.max(1, Math.min(precision, 12)))
      .replace(/\.0+e/, "e")
      .replace(/(\.\d*?[1-9])0+e/, "$1e");
  }
  return normalized
    .toFixed(precision)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?[1-9])0+$/, "$1");
}

export default function FocusedUnitConverter({
  units,
  defaultFrom,
  defaultTo,
  valueLabelRu,
  valueLabelEn,
  baseNoteRu,
  baseNoteEn,
}: Props) {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [value, setValue] = useState("1");
  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [precision, setPrecision] = useState(6);
  const [copied, setCopied] = useState(false);

  const from = units.find((unit) => unit.id === fromId) ?? units[0];
  const to = units.find((unit) => unit.id === toId) ?? units[1] ?? units[0];
  const numericValue = parseNumber(value);
  const converted =
    numericValue === null ? null : (numericValue * from.factor) / to.factor;
  const formatted =
    converted === null ? "—" : formatNumber(converted, precision);

  const allResults = useMemo(
    () =>
      numericValue === null
        ? []
        : units.map((unit) => ({
            ...unit,
            value: formatNumber(
              (numericValue * from.factor) / unit.factor,
              precision,
            ),
          })),
    [from.factor, numericValue, precision, units],
  );

  const labelFor = (unit: LinearUnit) => (isEn ? unit.labelEn : unit.labelRu);

  const resetCopyState = () => setCopied(false);

  const swap = () => {
    setFromId(to.id);
    setToId(from.id);
    resetCopyState();
  };

  const copyResult = async () => {
    if (converted === null) return;
    const didCopy = await writeClipboardText(`${formatted} ${to.symbol}`);
    if (didCopy) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_600);
    }
  };

  const presets = useMemo(() => {
    if (units.length < 2) return [];
    const u0 = units[0];
    const u1 = units[1];
    const u2 = units[2] || units[0];
    return [
      { label: `1 ${u0.symbol} → ${u1.symbol}`, value: "1", from: u0.id, to: u1.id },
      { label: `10 ${u0.symbol} → ${u1.symbol}`, value: "10", from: u0.id, to: u1.id },
      { label: `100 ${u0.symbol} → ${u1.symbol}`, value: "100", from: u0.id, to: u1.id },
      { label: `1 ${u1.symbol} → ${u0.symbol}`, value: "1", from: u1.id, to: u0.id },
      { label: `1 ${u2.symbol} → ${u0.symbol}`, value: "1", from: u2.id, to: u0.id },
    ];
  }, [units]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      {/* 1-Click Preset Chips */}
      {presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            <Sparkle size={14} className="text-amber-500" />
            {isEn ? "Presets:" : "Быстрый выбор:"}
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setValue(p.value);
                setFromId(p.from);
                setToId(p.to);
                resetCopyState();
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-medium transition-colors",
                fromId === p.from && toId === p.to && value === p.value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* FROM COLUMN */}
          <div className="space-y-2">
            <Label
              htmlFor="linear-converter-value"
              className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
            >
              {isEn ? valueLabelEn : valueLabelRu}
            </Label>
            <Input
              id="linear-converter-value"
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                resetCopyState();
              }}
              inputMode="decimal"
              autoComplete="off"
              className={cn(
                "h-14 font-mono text-2xl font-bold",
                Boolean(value.trim()) && numericValue === null && "border-[var(--color-danger)]",
              )}
              aria-invalid={Boolean(value.trim()) && numericValue === null}
            />
            {value.trim() && numericValue === null ? (
              <p
                role="alert"
                className="mt-1 text-xs text-[var(--color-danger)]"
              >
                {isEn ? "Enter a valid number." : "Введите корректное число."}
              </p>
            ) : null}

            <Select
              value={from.id}
              onValueChange={(next) => {
                setFromId(next);
                resetCopyState();
              }}
            >
              <SelectTrigger
                id="linear-converter-from"
                className="h-12 w-full text-sm font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {labelFor(unit)} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center pt-2 md:pt-8">
            <button
              type="button"
              onClick={swap}
              aria-label={isEn ? "Swap units" : "Поменять единицы местами"}
              className="flex size-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm transition-all hover:scale-105 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] active:scale-95"
            >
              <ArrowsLeftRight size={20} weight="bold" />
            </button>
          </div>

          {/* TO / RESULT COLUMN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="linear-converter-to"
                className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]"
              >
                {isEn ? "To (result)" : "В (результат)"}
              </Label>
              {converted !== null && (
                <button
                  type="button"
                  onClick={() => void copyResult()}
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                  {copied
                    ? isEn ? "Copied" : "Скопировано!"
                    : isEn ? "Copy" : "Копировать"}
                </button>
              )}
            </div>

            <div
              className="flex h-14 items-center justify-between overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4"
              aria-live="polite"
            >
              <span className="font-mono text-2xl font-extrabold text-[var(--color-text)]">
                {formatted}
              </span>
              <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                {to.symbol}
              </span>
            </div>

            <Select
              value={to.id}
              onValueChange={(next) => {
                setToId(next);
                resetCopyState();
              }}
            >
              <SelectTrigger
                id="linear-converter-to"
                className="h-12 w-full text-sm font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {labelFor(unit)} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* EQUALITY SUMMARY & COMPACT PRIMARY ACTION */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {converted !== null && numericValue !== null ? (
              <span>
                {value} {from.symbol} ={" "}
                <strong className="font-semibold text-[var(--color-text)]">
                  {formatted} {to.symbol}
                </strong>
                <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                  (1 {from.symbol} = {formatNumber(from.factor / to.factor, precision)} {to.symbol})
                </span>
              </span>
            ) : (
              <span>{isEn ? "Enter a valid number" : "Введите корректное число"}</span>
            )}
          </div>

          <ToolPrimaryAction
            type="button"
            fullWidthOnMobile={false}
            className="h-11 w-auto min-w-[180px] px-6 shadow-sm"
            disabled={converted === null}
            onClick={() => void copyResult()}
            leadingIcon={
              copied ? <Check size={20} weight="bold" /> : <Copy size={20} />
            }
          >
            {copied
              ? isEn ? "Result copied" : "Результат скопирован"
              : isEn ? "Copy result" : "Скопировать результат"}
          </ToolPrimaryAction>
        </div>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Precision and all units" : "Точность и все единицы"}
          description={
            isEn
              ? "Decimal places, formula and complete conversion list"
              : "Знаки после запятой, формула и полный список значений"
          }
        >
          <div className="max-w-48">
            <Label htmlFor="linear-converter-precision">
              {isEn ? "Decimal places" : "Знаков после запятой"}
            </Label>
            <Input
              id="linear-converter-precision"
              type="number"
              min={0}
              max={12}
              value={precision}
              onChange={(event) => {
                setPrecision(
                  Math.min(12, Math.max(0, Number(event.target.value) || 0)),
                );
                resetCopyState();
              }}
              className="mt-1.5 h-11"
            />
          </div>

          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm text-[var(--color-text-muted)]">
            <p className="font-semibold text-[var(--color-text)]">
              {value || "—"} {from.symbol} × {from.factor} ÷ {to.factor} ={" "}
              {formatted} {to.symbol}
            </p>
            <p className="mt-1 text-xs leading-5">
              {isEn ? baseNoteEn : baseNoteRu}
            </p>
          </div>

          {allResults.length ? (
            <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <ul className="divide-y divide-[var(--color-border)]">
                {allResults.map((row) => (
                  <li
                    key={row.id}
                    className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 break-words text-[var(--color-text-muted)]">
                      {labelFor(row)}
                    </span>
                    <span className="min-w-0 break-words text-right font-semibold tabular-nums">
                      {row.value} {row.symbol}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </AdvancedSettings>
      </section>
    </div>
  );
}
