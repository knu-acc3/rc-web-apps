"use client";

import { useId } from "react";
import type { Locale } from "@/i18n/config";
import { Input, Select } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { NumberInput } from "@/ui/number-input";

type Mode = "any" | "every" | "at" | "range";

/** Largest sensible step per field: seconds, minutes, hours, day of month, month, day of week, year. */
const MAX = [59, 59, 23, 31, 12, 7, 100];

const T = {
  ru: {
    title: "Конструктор выражения",
    modes: { any: "любое (*)", every: "каждые N", at: "конкретные", range: "диапазон" },
    names: ["Секунды", "Минуты", "Часы", "День месяца", "Месяц", "День недели", "Год"],
    everyPh: "N",
    atPh: "0,15,30",
    from: "с",
    to: "по",
  },
  en: {
    title: "Expression builder",
    modes: { any: "any (*)", every: "every N", at: "specific", range: "range" },
    names: ["Seconds", "Minutes", "Hours", "Day of month", "Month", "Day of week", "Year"],
    everyPh: "N",
    atPh: "0,15,30",
    from: "from",
    to: "to",
  },
} as const;

function detect(raw: string): { mode: Mode; a: string; b: string } {
  if (raw === "*" || raw === "?") return { mode: "any", a: "", b: "" };
  let m = /^\*\/(\d+)$/.exec(raw);
  if (m) return { mode: "every", a: m[1], b: "" };
  m = /^([^,/-]+)-([^,/-]+)$/.exec(raw);
  if (m) return { mode: "range", a: m[1], b: m[2] };
  return { mode: "at", a: raw, b: "" };
}

function build(mode: Mode, a: string, b: string, keep: string): string {
  if (mode === "any") return keep === "?" ? "?" : "*";
  if (mode === "every") return `*/${a || "2"}`;
  if (mode === "range") return `${a || "0"}-${b || a || "0"}`;
  return a || "0";
}

/** Per-field editor that rewrites one field of the expression at a time: a folded card of tonal field blocks. */
export function CronBuilder({ locale, expr, onChange }: { locale: Locale; expr: string; onChange: (e: string) => void }) {
  const t = T[locale];
  const id = useId();
  const parts = expr.trim().split(/\s+/);
  const labels = parts.length === 5 ? t.names.slice(1, 6) : t.names.slice(0, parts.length);
  const maxes = parts.length === 5 ? MAX.slice(1, 6) : MAX.slice(0, parts.length);
  const set = (i: number, raw: string) => {
    const next = [...parts];
    next[i] = raw;
    onChange(next.join(" "));
  };
  return (
    <Fold title={t.title} bodyClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {parts.map((raw, i) => {
        const s = detect(raw);
        return (
          <div key={i} role="group" aria-labelledby={`${id}-${i}`} className="flex min-w-0 flex-col gap-2 rounded-[1rem] bg-surface-2 p-3">
            <div id={`${id}-${i}`} className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg-2">
              {labels[i]} <span className="font-mono text-fg">{raw}</span>
            </div>
            <Select size="sm" value={s.mode} aria-label={labels[i]} onChange={(e) => set(i, build(e.target.value as Mode, s.a, s.b, raw))}>
              {(Object.keys(t.modes) as Mode[]).map((m) => (
                <option key={m} value={m}>
                  {t.modes[m]}
                </option>
              ))}
            </Select>
            {s.mode === "every" && (
              <NumberInput size="sm" aria-label={`${labels[i]} N`} locale={locale} min={1} max={maxes[i]} value={s.a ? Number(s.a) : null} placeholder={t.everyPh} onChange={(v) => set(i, build("every", v === null ? "" : String(v), "", raw))} />
            )}
            {s.mode === "at" && <Input size="sm" aria-label={labels[i]} value={s.a} placeholder={t.atPh} className="font-mono" onChange={(e) => set(i, e.target.value.replace(/\s/g, "") || "0")} />}
            {s.mode === "range" && (
              <div className="flex items-center gap-2 text-sm text-fg-3">
                {t.from}
                <Input size="sm" aria-label={`${labels[i]} ${t.from}`} value={s.a} className="font-mono" onChange={(e) => set(i, build("range", e.target.value.trim(), s.b, raw))} />
                {t.to}
                <Input size="sm" aria-label={`${labels[i]} ${t.to}`} value={s.b} className="font-mono" onChange={(e) => set(i, build("range", s.a, e.target.value.trim(), raw))} />
              </div>
            )}
          </div>
        );
      })}
    </Fold>
  );
}
