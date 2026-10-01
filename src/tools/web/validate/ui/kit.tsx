"use client";

import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Panel } from "@/ui/panel";

type Tone = "ok" | "err" | "warn" | "idle";

const L = {
  ru: { copyAll: "Копировать всё", copied: "Скопировано", details: "Подробности" },
  en: { copyAll: "Copy all", copied: "Copied", details: "Details" },
} as const;

/** Validator page: the input in a card on the left, the verdict and details on the right (stacked on phones). */
export function Layout({ input, note, children }: { input: ReactNode; note?: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        {input}
        {note && <p className="text-sm text-fg-3">{note}</p>}
      </Panel>
      <div className="flex min-w-0 flex-col gap-4 empty:hidden">{children}</div>
    </div>
  );
}

/** The primary input of a validator: large, monospace, no autocorrect. */
export function BigInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  hint,
  invalid,
  inputMode,
  mono = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: ReactNode;
  invalid?: boolean;
  inputMode?: "text" | "numeric" | "email" | "tel";
  mono?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        size="lg"
        className={mono ? "font-mono" : undefined}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode={inputMode}
        aria-invalid={invalid}
      />
    </Field>
  );
}

/** One prominent verdict: icon + title in large type, optional value and quiet notes. */
export function Verdict({ tone, title, value, children }: { tone: Tone; title: ReactNode; value?: ReactNode; children?: ReactNode }) {
  const Icon = tone === "ok" ? CircleCheck : tone === "err" ? CircleX : CircleAlert;
  return (
    <div className={cn("min-w-0 rounded-[1.25rem] p-5 sm:p-6", tone === "ok" ? "bg-ok-soft" : tone === "err" ? "bg-err-soft" : tone === "warn" ? "bg-warn-soft" : "bg-surface-2")}>
      <div aria-live="polite" className={cn("flex items-center gap-2.5 text-xl font-semibold sm:text-2xl", tone === "ok" ? "text-ok" : tone === "err" ? "text-err" : tone === "warn" ? "text-warn" : "text-fg-2")}>
        {tone !== "idle" && <Icon className="size-7 shrink-0" aria-hidden />}
        <span>{title}</span>
      </div>
      {value && <div className="mt-2 font-mono text-2xl font-bold break-words [overflow-wrap:anywhere] text-fg sm:text-3xl">{value}</div>}
      {children && <div className="mt-2 flex flex-col gap-1 text-[0.9375rem] text-fg-2">{children}</div>}
    </div>
  );
}

export interface Row {
  label: string;
  value: string;
  mono?: boolean;
}

/** Quiet details list with a single "copy all" action. */
export function Details({ rows, locale, title }: { rows: Row[]; locale: Locale; title?: string }) {
  const t = L[locale];
  if (!rows.length) return null;
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-fg">{title ?? t.details}</h2>
        <CopyButton value={rows.map((r) => `${r.label}: ${r.value}`).join("\n")} label={t.copyAll} copiedLabel={t.copied} variant="ghost" />
      </div>
      <dl className="mt-1 grid gap-x-8 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col py-1.5">
            <dt className="text-[0.8125rem] text-fg-3">{r.label}</dt>
            <dd className={cn("break-words [overflow-wrap:anywhere] text-fg select-all", r.mono ? "font-mono text-sm" : "text-[0.9375rem]")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/** Bulleted list of problems under a verdict. */
export function Problems({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc pl-5 marker:text-fg-3">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}
