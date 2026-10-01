"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CodeOutput } from "@/ui/code-output";
import { Field, Input, Select, Switch, Textarea } from "@/ui/field";
import { Fold } from "@/ui/fold";
import { Notice, Panel } from "@/ui/panel";

export type L = Record<Locale, string>;
export type Fields = Record<string, string>;

export interface FieldSpec {
  key: string;
  kind: "text" | "textarea" | "select" | "checkbox" | "datetime" | "date";
  label: L;
  placeholder?: string;
  hint?: L;
  options?: [string, L | string][];
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
  mono?: boolean;
  half?: boolean;
  rows?: number;
  /** Secondary field shown under "More fields". */
  more?: boolean;
}

const OUT = {
  ru: { copy: "Копировать", copied: "Скопировано", download: "Скачать" },
  en: { copy: "Copy", copied: "Copied", download: "Download" },
} as const;

/** Code output with localized labels. */
export function Output({ locale, value, title, filename, mime, rows = 10, className }: { locale: Locale; value: string; title?: ReactNode; filename?: string; mime?: string; rows?: number; className?: string }) {
  return <CodeOutput value={value} title={title} filename={filename} mime={mime} labels={OUT[locale]} minRows={rows} className={className} />;
}

export function FieldGrid({ specs, f, set, locale, id }: { specs: FieldSpec[]; f: Fields; set: (k: string, v: string) => void; locale: Locale; id: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {specs.map((s) => {
        const fid = `${id}-${s.key}`;
        const cls = s.half ? "" : "sm:col-span-2";
        const value = f[s.key] ?? "";
        if (s.kind === "checkbox")
          return (
            <div key={s.key} className={cn("flex items-end", cls)}>
              <Switch label={s.label[locale]} checked={value === "true"} onChange={(e) => set(s.key, e.target.checked ? "true" : "")} />
            </div>
          );
        return (
          <Field key={s.key} label={s.label[locale]} htmlFor={fid} hint={s.hint?.[locale]} className={cls}>
            {s.kind === "textarea" ? (
              <Textarea
                id={fid}
                value={value}
                onChange={(e) => set(s.key, e.target.value)}
                placeholder={s.placeholder}
                rows={s.rows ?? 3}
                className={s.mono ? "font-mono text-sm" : undefined}
                spellCheck={s.mono ? false : undefined}
              />
            ) : s.kind === "select" ? (
              <Select id={fid} value={value || s.options?.[0][0]} onChange={(e) => set(s.key, e.target.value)}>
                {s.options?.map(([v, l]) => (
                  <option key={v} value={v}>
                    {typeof l === "string" ? l : l[locale]}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id={fid}
                type={s.kind === "datetime" ? "datetime-local" : s.kind === "date" ? "date" : "text"}
                value={value}
                onChange={(e) => set(s.key, e.target.value)}
                placeholder={s.placeholder}
                inputMode={s.inputMode}
                autoComplete="off"
                spellCheck={s.mono || s.inputMode === "url" ? false : undefined}
                className={s.mono ? "font-mono" : undefined}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

/** Secondary fields tucked under a quiet "More" text button inside the input card. */
export function More({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Fold variant="inline" title={label}>
      {children}
    </Fold>
  );
}

/** Inputs in a card on the left, the generated result on the right from `lg` (stacked on phones). */
export function Split({ input, children, className }: { input: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid items-start gap-4 lg:grid-cols-2 lg:gap-6", className)}>
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">{input}</Panel>
      <div className="flex min-w-0 flex-col gap-4 empty:hidden">{children}</div>
    </div>
  );
}

export function Issues({ items, tone = "warn" }: { items: string[]; tone?: "warn" | "err" | "ok" | "neutral" }) {
  if (!items.length) return null;
  return (
    <Notice tone={tone}>
      {items.length === 1 ? (
        items[0]
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </Notice>
  );
}

/** A counter that turns amber/red past soft/hard limits. */
export function Meter({ value, max, label, unit }: { value: number; max: number; label: string; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const tone = value > max ? "bg-err" : value > max * 0.9 ? "bg-warn" : "bg-ok";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-[0.8125rem] text-fg-3">
        <span>{label}</span>
        <span className={cn("tabular-nums", value > max && "font-semibold text-err")}>
          {Math.round(value)} / {max} {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-[width] duration-150", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
