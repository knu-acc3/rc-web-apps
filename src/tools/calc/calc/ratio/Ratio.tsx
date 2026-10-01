"use client";

import { useId } from "react";
import { Segmented } from "@/ui/segmented";
import type { ToolProps } from "../../../types";
import { toNumber, type Q } from "../algebra/rational";
import { fmtFixed, fmtN } from "../../shared/fmt";
import { field } from "../../shared/num";
import { CalcGrid, Explain, NumField, ResultMain, Stack, ToolActions } from "../../shared/ui";
import { useQueryState } from "../../shared/url-state";
import { parseDecimal, simplifyRatio, splitInRatio } from "../numbers/engines";

const MODES = ["simplify", "split", "scale"] as const;
type Mode = (typeof MODES)[number];

const T = {
  ru: {
    mode: "Что сделать",
    simplify: "Упростить",
    split: "Разделить сумму",
    scale: "Масштабировать",
    ratio: "Соотношение",
    ratioHint: "Части через двоеточие: 1,5 : 2,25 или 16 : 9 : 4",
    amount: "Сумма для деления",
    first: "Новое значение первой части",
    simplified: "Упрощённое соотношение",
    shares: "Доли",
    scaled: "Масштабированное соотношение",
    part: (i: number) => `Часть ${i}`,
    enter: "Введите соотношение из двух и более чисел",
    bad: "Части — неотрицательные числа, разделённые двоеточием",
    sumExact: (s: string) => `в сумме ровно ${s}`,
    factor: (k: string) => `коэффициент ×${k}`,
  },
  en: {
    mode: "What to do",
    simplify: "Simplify",
    split: "Split an amount",
    scale: "Scale",
    ratio: "Ratio",
    ratioHint: "Parts separated by colons: 1.5 : 2.25 or 16 : 9 : 4",
    amount: "Amount to split",
    first: "New value of the first part",
    simplified: "Simplified ratio",
    shares: "Shares",
    scaled: "Scaled ratio",
    part: (i: number) => `Part ${i}`,
    enter: "Enter a ratio of two or more numbers",
    bad: "Parts must be non-negative numbers separated by colons",
    sumExact: (s: string) => `adds up to exactly ${s}`,
    factor: (k: string) => `factor ×${k}`,
  },
} as const;

export default function Ratio({ locale }: ToolProps) {
  const t = T[locale];
  const id = useId();
  const ru = locale === "ru";
  const q = useQueryState({ m: "simplify", r: ru ? "1,5 : 2,25" : "1.5 : 2.25", a: "100000", f: "1920" }, { enums: { m: MODES } });
  const m = q.v.m as Mode;
  const tokens = q.v.r.split(/\s*[:∶/]\s*|\s+(?=\d)/).map((s) => s.trim()).filter(Boolean);
  const parts = tokens.map(parseDecimal);
  const ok = parts.length >= 2 && parts.every((p): p is Q => p !== null && p.n >= 0n);
  const A = field(locale, q.v.a, { min: 0 });
  const F = field(locale, q.v.f, { gt: 0 });
  const f = (x: number) => fmtN(locale, x, 6);

  let value = "—";
  let sub: string | undefined = ok ? undefined : q.v.r.trim() ? t.bad : t.enter;
  let rows: { label: string; value: string }[] | undefined;
  const simple = ok ? simplifyRatio(parts as Q[]) : null;
  if (ok && simple) {
    if (m === "simplify") {
      value = simple.join(" : ");
      sub = tokens.join(" : ");
    } else if (m === "split" && A.value !== null) {
      const minor = BigInt(Math.round(A.value * 100));
      const shares = splitInRatio(minor, simple);
      value = shares.map((s) => fmtFixed(locale, Number(s) / 100, 2)).join(" + ");
      sub = t.sumExact(fmtFixed(locale, A.value, 2));
      rows = shares.map((s, i) => ({ label: `${t.part(i + 1)} (${simple[i]})`, value: fmtFixed(locale, Number(s) / 100, 2) }));
    } else if (m === "scale" && F.value !== null) {
      const first = toNumber(parts[0] as Q);
      if (first > 0) {
        const k = F.value / first;
        const scaled = (parts as Q[]).map((p) => toNumber(p) * k);
        value = scaled.map(f).join(" : ");
        sub = t.factor(f(k));
      }
    }
  }

  return (
    <Stack>
      <CalcGrid
        inputs={
          <>
            <Segmented
              label={t.mode}
              value={m}
              onChange={(v) => q.set({ m: v })}
              options={[
                { value: "simplify", label: t.simplify },
                { value: "split", label: t.split },
                { value: "scale", label: t.scale },
              ]}
            />
            <NumField id={`${id}-r`} label={t.ratio} hint={t.ratioHint} value={q.v.r} onChange={(r) => q.set({ r })} inputMode="text" size="lg" error={ok || !q.v.r.trim() ? undefined : t.bad} />
            {m === "split" && <NumField id={`${id}-a`} label={t.amount} value={q.v.a} onChange={(a) => q.set({ a })} error={A.message} size="lg" />}
            {m === "scale" && <NumField id={`${id}-f`} label={t.first} value={q.v.f} onChange={(v) => q.set({ f: v })} error={F.message} size="lg" />}
          </>
        }
        result={
          <ResultMain
            label={m === "simplify" ? t.simplified : m === "split" ? t.shares : t.scaled}
            value={<span className="break-all">{value}</span>}
            sub={sub}
            rows={rows}
            actions={<ToolActions locale={locale} onReset={q.reset} shareUrl={q.shareUrl} />}
          />
        }
      />
      {ru ? (
        <Explain
          locale={locale}
          formula={["a : b = (a·k) : (b·k)", "1,5 : 2,25 → ×4 → 6 : 9 → ÷3 → 2 : 3", "Доля части = сумма × часть / сумма частей"]}
          notes={[
            "Чтобы упростить соотношение с дробями, все части умножаются на общий знаменатель, а затем делятся на наибольший общий делитель.",
            "При делении суммы доли округляются до сотых так, чтобы в сумме получилось ровно исходное число (лишние копейки распределяются по наибольшим остаткам).",
            "Масштабирование удобно для пропорций экрана: 16 : 9 при ширине 1920 даёт высоту 1080.",
          ]}
        />
      ) : (
        <Explain
          locale={locale}
          formula={["a : b = (a·k) : (b·k)", "1.5 : 2.25 → ×4 → 6 : 9 → ÷3 → 2 : 3", "Share = amount × part / sum of parts"]}
          notes={[
            "To simplify a ratio with decimals, all parts are multiplied by a common denominator and divided by their greatest common divisor.",
            "When splitting an amount, shares are rounded to cents so they add up to exactly the original amount (spare cents go to the largest remainders).",
            "Scaling is handy for aspect ratios: 16 : 9 at a width of 1920 gives a height of 1080.",
          ]}
        />
      )}
    </Stack>
  );
}
