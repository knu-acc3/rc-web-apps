"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input } from "@/ui/field";
import { parsePageRanges, type RangeResult } from "../lib/ranges";
import { S, rangeErrorText } from "./strings";

/** Parse a range field; an empty field means "all pages" when `emptyIsAll`. */
export function resolveRange(text: string, pageCount: number, emptyIsAll = true): RangeResult {
  if (!text.trim() && emptyIsAll) {
    return { ok: true, segments: [{ start: 1, end: pageCount, token: "" }], pages: Array.from({ length: pageCount }, (_, i) => i + 1) };
  }
  return parsePageRanges(text, pageCount);
}

/** Page range input ("1-3, 5, 8-") with inline validation. */
export function RangeField({
  locale,
  label,
  value,
  onChange,
  result,
  pageCount,
  placeholder,
  className,
  size = "md",
}: {
  locale: Locale;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  result: RangeResult;
  pageCount: number;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const t = S[locale];
  const id = useId();
  const error = !result.ok && value.trim() ? rangeErrorText(locale, result.error, pageCount) : null;
  return (
    <Field label={label ?? t.pagesLabel} htmlFor={id} error={error} hint={error ? undefined : t.rangeHint} className={className}>
      <Input id={id} size={size} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} aria-invalid={!!error} inputMode="text" />
    </Field>
  );
}
