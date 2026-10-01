"use client";

import { Barcode } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Panel } from "@/ui/panel";
import { ChipChoice } from "@/ui/chip-choice";
import { gs1Steps, isbn10Steps, upcEToA, type CheckStep } from "./lib/checkdigits";

export type CheckKind = "ean13" | "ean8" | "upca" | "upce" | "gtin14" | "sscc" | "isbn10";

const KINDS: { kind: CheckKind; label: string; body: number; barcode?: string }[] = [
  { kind: "ean13", label: "EAN-13", body: 12, barcode: "ean-13" },
  { kind: "ean8", label: "EAN-8", body: 7, barcode: "ean-8" },
  { kind: "upca", label: "UPC-A", body: 11, barcode: "upc-a" },
  { kind: "upce", label: "UPC-E", body: 7, barcode: "upc-e" },
  { kind: "gtin14", label: "GTIN-14", body: 13, barcode: "itf-14" },
  { kind: "sscc", label: "SSCC", body: 17 },
  { kind: "isbn10", label: "ISBN-10", body: 9 },
];

const SAMPLE: Record<CheckKind, string> = { ean13: "460123456789", ean8: "9638507", upca: "03600029145", upce: "0425261", gtin14: "1001234567890", sscc: "34012345000000001", isbn10: "030640615" };

const T = {
  ru: {
    kind: "Тип кода",
    input: (n: number) => `Первые ${n} цифр (или весь код с контрольной — для проверки)`,
    inputUpce: "Системная цифра 0/1 и 6 цифр кода (или все 8 — для проверки)",
    result: "Код с контрольной цифрой",
    digit: "Контрольная цифра",
    ok: "Контрольная цифра верна",
    bad: (c: string) => `Контрольная цифра неверна — должна быть ${c}`,
    need: (n: number) => `Введите ${n} цифр`,
    count: (n: number, have: number) => `Нужно ${n} цифр (или ${n + 1} с контрольной), введено ${have}`,
    digitsOnly: "Допустимы только цифры",
    upceNs: "Код UPC-E начинается с системной цифры 0 или 1",
    steps: "Как посчитана",
    legend: "Позиция, цифра, вес и произведение",
    sum: "Сумма произведений",
    gs1: (s: number, c: number) => (s % 10 === 0 ? `${s} делится на 10 без остатка → контрольная цифра 0` : `${s} mod 10 = ${s % 10} → 10 − ${s % 10} = ${c}`),
    isbn: (s: number, c: string) => `${s} mod 11 = ${s % 11} → 11 − ${s % 11} = ${(11 - (s % 11)) % 11 === 0 ? "11 → 0" : 11 - (s % 11)}${c === "X" ? " → 10 записывается как X" : ""}`,
    expand: (a: string) => `UPC-E сначала разворачивается в UPC-A: ${a}`,
    barcode: "Сделать штрихкод",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    kind: "Code type",
    input: (n: number) => `The first ${n} digits (or the full code with the check digit to verify it)`,
    inputUpce: "Number system 0/1 and the 6 code digits (or all 8 to verify)",
    result: "Code with check digit",
    digit: "Check digit",
    ok: "The check digit is correct",
    bad: (c: string) => `Wrong check digit — it should be ${c}`,
    need: (n: number) => `${n} digits needed`,
    count: (n: number, have: number) => `Enter ${n} digits (or ${n + 1} with the check digit); you have ${have}`,
    digitsOnly: "Digits only",
    upceNs: "UPC-E starts with number system 0 or 1",
    steps: "How it's calculated",
    legend: "Position, digit, weight and product",
    sum: "Sum of products",
    gs1: (s: number, c: number) => (s % 10 === 0 ? `${s} is divisible by 10 → the check digit is 0` : `${s} mod 10 = ${s % 10} → 10 − ${s % 10} = ${c}`),
    isbn: (s: number, c: string) => `${s} mod 11 = ${s % 11} → 11 − ${s % 11} = ${(11 - (s % 11)) % 11 === 0 ? "11 → 0" : 11 - (s % 11)}${c === "X" ? " → 10 is written as X" : ""}`,
    expand: (a: string) => `UPC-E is first expanded to UPC-A: ${a}`,
    barcode: "Make a barcode",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

interface Calc {
  body: string;
  check: string;
  given?: string;
  steps: CheckStep[];
  sum: number;
  expanded?: string;
}

function compute(kind: CheckKind, digits: string, body: number): Calc | { error: "digits" | "count" | "upceNs" } {
  if (!/^\d*$/.test(digits) && !(kind === "isbn10" && /^\d{9}[\dXx]$/.test(digits))) return { error: "digits" };
  if (digits.length !== body && digits.length !== body + 1) return { error: "count" };
  const b = digits.slice(0, body);
  const given = digits.length === body + 1 ? digits[body].toUpperCase() : undefined;
  if (kind === "isbn10") {
    const s = isbn10Steps(b);
    return { body: b, check: s.check, given, steps: s.steps, sum: s.sum };
  }
  if (kind === "upce") {
    const a = upcEToA(b[0], b.slice(1));
    if (!a) return { error: "upceNs" };
    const s = gs1Steps(a);
    return { body: b, check: String(s.check), given, steps: s.steps, sum: s.sum, expanded: a };
  }
  const s = gs1Steps(b);
  return { body: b, check: String(s.check), given, steps: s.steps, sum: s.sum };
}

export default function CheckDigitCalculator({ locale, kind: initial = "ean13" }: { locale: Locale; kind?: CheckKind }) {
  const t = T[locale];
  const id = useId();
  const [kind, setKind] = useState<CheckKind>(initial);
  const [value, setValue] = useState(SAMPLE[initial]);
  const k = KINDS.find((x) => x.kind === kind)!;
  const digits = value.replace(/[\s-]/g, "");
  const r = digits ? compute(kind, digits, k.body) : null;
  const calc = r && "body" in r ? r : null;
  const full = calc ? calc.body + calc.check : "";
  const verdict = calc?.given ? (calc.given === calc.check ? "ok" : "bad") : null;

  return (
    <div className="flex flex-col gap-4">
      <ChipChoice
        label={t.kind}
        value={kind}
        onChange={(v) => {
          setKind(v);
          setValue(SAMPLE[v]);
        }}
        options={KINDS.map((x) => ({ value: x.kind, label: x.label }))}
      />
      <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
        <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          <Field label={kind === "upce" ? t.inputUpce : t.input(k.body)} htmlFor={`${id}-v`}>
            <Input
              id={`${id}-v`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              size="lg"
              className="font-mono tracking-wider"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!r && !calc}
            />
          </Field>
          {calc && k.barcode && (
            <ButtonLink variant="outlined" href={`${href(locale, ["barcode-generator", k.barcode])}`} className="w-fit">
              <Barcode aria-hidden className="size-4" />
              {t.barcode}
            </ButtonLink>
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <div aria-live="polite" className={cn("min-w-0 rounded-[1.25rem] p-5 sm:p-6", verdict === "bad" || (r && !calc) ? "bg-err-soft" : verdict === "ok" ? "bg-ok-soft" : "bg-accent-soft")}>
            {calc ? (
              <>
                <div className="text-sm font-medium text-fg-2">{verdict === "ok" ? t.ok : verdict === "bad" ? t.bad(calc.check) : t.result}</div>
                <div className="mt-1 font-mono text-3xl font-bold tracking-wider break-words text-fg [overflow-wrap:anywhere] sm:text-4xl">
                  {calc.body}
                  <span className="text-accent">{calc.check}</span>
                </div>
                <CopyButton value={full} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" className="mt-4" />
              </>
            ) : r && "error" in r ? (
              <div className="text-[0.9375rem] text-err">{r.error === "digits" ? t.digitsOnly : r.error === "upceNs" ? t.upceNs : t.count(k.body, digits.length)}</div>
            ) : (
              <div className="text-[0.9375rem] text-fg-3">{t.need(k.body)}</div>
            )}
          </div>

          {calc && (
            <Fold title={t.steps}>
              <div className="flex flex-col gap-3 text-sm text-fg-2">
                {calc.expanded && <p>{t.expand(calc.expanded)}</p>}
                <p className="text-[0.8125rem] text-fg-3">{t.legend}</p>
                <ol className="flex flex-wrap gap-1.5">
                  {calc.steps.map((s, i) => (
                    <li key={i} className="flex min-w-[2.75rem] flex-col items-center rounded-[0.75rem] bg-surface-2 px-1.5 py-1.5 font-mono text-[0.8125rem] leading-tight">
                      <span className="text-[0.6875rem] text-fg-3">{i + 1}</span>
                      <span className="text-lg font-semibold text-fg">{s.digit}</span>
                      <span className="text-fg-3">×{s.weight}</span>
                      <span className="font-semibold text-fg">{s.product}</span>
                    </li>
                  ))}
                </ol>
                <p>
                  {t.sum}: <span className="font-mono text-fg">{calc.sum}</span>. {kind === "isbn10" ? t.isbn(calc.sum, calc.check) : t.gs1(calc.sum, Number(calc.check))}
                </p>
              </div>
            </Fold>
          )}
        </div>
      </div>
    </div>
  );
}
