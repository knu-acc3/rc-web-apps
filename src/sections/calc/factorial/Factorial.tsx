"use client";

import { useEffect, useId, useState } from "react";
import { CopyButton } from "@/ui/copy-button";
import type { ToolProps } from "../../types";
import { fmtBig } from "../bigint/format";
import { doubleFactorial, factorial, factorialDigits, factorialZeros } from "../bigint/nt";
import { field } from "../kit/num";
import { CalcGrid, Explain, InlineToggle, NumField, OptionsRow, ResultMain, Stack, SubHeading, ToolActions } from "../kit/ui";
import { useQueryState } from "../kit/url-state";

const T = {
  ru: {
    n: "Число n",
    nHint: "Точное значение — до 20 000!, количество цифр — до миллиарда",
    kind: "Вид",
    single: "n!",
    double: "n!!",
    digits: "Цифр в числе",
    zeros: "Нулей в конце",
    approx: "Приближённо",
    exact: "Точное значение",
    computing: "Вычисляем…",
    tooBig: "Точное значение показывается до 20 000!",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    n: "Number n",
    nHint: "Exact value up to 20,000!, digit count up to a billion",
    kind: "Kind",
    single: "n!",
    double: "n!!",
    digits: "Digits",
    zeros: "Trailing zeros",
    approx: "Approximately",
    exact: "Exact value",
    computing: "Computing…",
    tooBig: "The exact value is shown up to 20,000!",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

const EXACT_MAX = 20000;
const SYNC_MAX = 1500;

/** log10(n!) via Stirling's series (accurate far beyond display precision for n ≥ 10). */
function log10Fact(n: number): number {
  if (n < 2) return 0;
  if (n < 171) {
    let s = 0;
    for (let i = 2; i <= n; i++) s += Math.log10(i);
    return s;
  }
  return (n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n) - 1 / (360 * n ** 3)) / Math.LN10;
}

function sci(locale: "ru" | "en", log10: number): string {
  const e = Math.floor(log10);
  const m = 10 ** (log10 - e);
  const mant = m.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", { maximumFractionDigits: 6 });
  return `${mant} × 10${String(e).split("").map((c) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(c)]).join("")}`;
}

export default function Factorial({ locale, n = 20 }: ToolProps<{ n?: number }>) {
  const t = T[locale];
  const id = useId();
  const q = useQueryState({ n: String(n), k: "1" }, { enums: { k: ["1", "2"] } });
  const N = field(locale, q.v.n, { min: 0, max: 1e9, int: true });
  const double = q.v.k === "2";
  const v = N.value;
  const [bg, setBg] = useState<{ n: number; double: boolean; text: string } | null>(null);

  const exactSync = v !== null && v <= SYNC_MAX ? (double ? doubleFactorial(v) : factorial(v)).toString() : null;
  const needWorker = v !== null && v > SYNC_MAX && v <= EXACT_MAX;

  useEffect(() => {
    if (!needWorker || v === null) return;
    const w = new Worker(new URL("./factorial.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e) => setBg(e.data);
    w.postMessage({ n: v, double });
    return () => w.terminate();
  }, [needWorker, v, double]);

  const exact = exactSync ?? (bg && bg.n === v && bg.double === double ? bg.text : null);
  const digits = v === null ? null : double ? (exact ? exact.length : null) : factorialDigits(v);
  const zeros = v !== null && !double ? factorialZeros(v) : exact ? exact.length - exact.replace(/0+$/, "").length : null;
  const approx = v !== null && !double ? sci(locale, log10Fact(v)) : null;
  const shown = exact ? (exact.length <= 30 ? fmtBig(locale, BigInt(exact)) : approx ?? `${exact.slice(0, 12)}…`) : approx ?? "—";

  return (
    <Stack>
      <CalcGrid
        inputs={
          <>
            <NumField id={`${id}-n`} label={t.n} hint={t.nHint} value={q.v.n} onChange={(x) => q.set({ n: x })} error={N.message} inputMode="numeric" size="lg" />
            <OptionsRow>
              <InlineToggle
                label={t.kind}
                value={q.v.k as "1" | "2"}
                onChange={(k) => q.set({ k })}
                options={[
                  { value: "1", label: t.single },
                  { value: "2", label: t.double },
                ]}
              />
            </OptionsRow>
          </>
        }
        result={
          <ResultMain
            label={v !== null ? `${v}${double ? "!!" : "!"}` : t.n}
            value={<span className="break-all">{shown}</span>}
            sub={exact && exact.length > 30 && approx ? `${t.approx}; ${t.digits.toLowerCase()}: ${digits}` : undefined}
            rows={
              v !== null
                ? [
                    ...(digits !== null ? [{ label: t.digits, value: fmtBig(locale, BigInt(digits)) }] : []),
                    ...(zeros !== null ? [{ label: t.zeros, value: fmtBig(locale, BigInt(zeros)) }] : []),
                    ...(approx && (!exact || exact.length > 15) ? [{ label: t.approx, value: approx }] : []),
                  ]
                : undefined
            }
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {v !== null && (v > EXACT_MAX || exact) && (
        <section>
          <SubHeading aside={exact ? <CopyButton value={exact} label={t.copy} copiedLabel={t.copied} variant="ghost" /> : undefined}>{t.exact}</SubHeading>
          {exact ? (
            <p className="tabular max-h-72 overflow-y-auto rounded-[0.75rem] border border-line bg-surface p-4 font-mono text-sm leading-relaxed break-all text-fg-2">{exact}</p>
          ) : (
            <p className="text-sm text-fg-3">{v > EXACT_MAX ? t.tooBig : t.computing}</p>
          )}
        </section>
      )}
      {locale === "ru" ? (
        <Explain
          locale={locale}
          formula={["n! = 1 · 2 · 3 · … · n,  0! = 1", "n!! = n · (n − 2) · (n − 4) · …", "Нулей в конце n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …", "Цифр: ⌊lg n!⌋ + 1, lg n! по формуле Стирлинга"]}
          notes={["Точное значение считается целыми числами произвольной длины; для больших n — в фоновом потоке, чтобы страница не зависала.", "Для очень больших n (до миллиарда) показываются количество цифр, нули в конце и приближённое значение."]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["n! = 1 · 2 · 3 · … · n,  0! = 1", "n!! = n · (n − 2) · (n − 4) · …", "Trailing zeros of n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …", "Digits: ⌊log₁₀ n!⌋ + 1, via Stirling's formula"]}
          notes={["The exact value uses arbitrary-precision integers; large n is computed in a background thread so the page stays responsive.", "For very large n (up to a billion) the digit count, trailing zeros and an approximation are shown."]}
        />
      )}
    </Stack>
  );
}
