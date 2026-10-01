"use client";

import type { Locale } from "@/i18n/config";
import { Input, Select } from "@/ui/field";

type Mode = "any" | "every" | "at" | "range";

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

/** Per-field editor that rewrites one field of the expression at a time. */
export function CronBuilder({ locale, expr, onChange }: { locale: Locale; expr: string; onChange: (e: string) => void }) {
  const t = T[locale];
  const parts = expr.trim().split(/\s+/);
  const labels = parts.length === 5 ? t.names.slice(1, 6) : t.names.slice(0, parts.length);
  const set = (i: number, raw: string) => {
    const next = [...parts];
    next[i] = raw;
    onChange(next.join(" "));
  };
  return (
    <details className="rounded-[0.75rem] border border-line bg-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-fg">{t.title}</summary>
      <div className="grid gap-3 border-t border-line p-4 sm:grid-cols-2 lg:grid-cols-3">
        {parts.map((raw, i) => {
          const s = detect(raw);
          return (
            <fieldset key={i} className="flex min-w-0 flex-col gap-1.5">
              <legend className="mb-1.5 text-sm font-medium text-fg-2">
                {labels[i]} <span className="font-mono text-fg-3">{raw}</span>
              </legend>
              <Select size="sm" value={s.mode} aria-label={labels[i]} onChange={(e) => set(i, build(e.target.value as Mode, s.a, s.b, raw))}>
                {(Object.keys(t.modes) as Mode[]).map((m) => (
                  <option key={m} value={m}>
                    {t.modes[m]}
                  </option>
                ))}
              </Select>
              {s.mode === "every" && <Input size="sm" inputMode="numeric" aria-label={`${labels[i]} N`} value={s.a} placeholder={t.everyPh} onChange={(e) => set(i, build("every", e.target.value.replace(/\D/g, ""), "", raw))} />}
              {s.mode === "at" && <Input size="sm" aria-label={labels[i]} value={s.a} placeholder={t.atPh} className="font-mono" onChange={(e) => set(i, e.target.value.replace(/\s/g, "") || "0")} />}
              {s.mode === "range" && (
                <div className="flex items-center gap-2 text-sm text-fg-3">
                  {t.from}
                  <Input size="sm" aria-label={`${labels[i]} ${t.from}`} value={s.a} className="font-mono" onChange={(e) => set(i, build("range", e.target.value.trim(), s.b, raw))} />
                  {t.to}
                  <Input size="sm" aria-label={`${labels[i]} ${t.to}`} value={s.b} className="font-mono" onChange={(e) => set(i, build("range", s.a, e.target.value.trim(), raw))} />
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
    </details>
  );
}
