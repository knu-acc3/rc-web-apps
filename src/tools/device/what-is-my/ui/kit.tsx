"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Notice, Panel } from "@/ui/panel";
import { CopyButton } from "@/ui/copy-button";

/** Strings shared by every what-is-my tool. */
export const COMMON = {
  ru: {
    detecting: "Определяем…",
    unknown: "Не удалось определить",
    notAvailable: "Недоступно",
    yes: "Да",
    no: "Нет",
    on: "Включено",
    off: "Выключено",
    supported: "Поддерживается",
    notSupported: "Нет",
    copy: "Копировать",
    copied: "Скопировано",
    details: "Подробности",
    source: "Источник данных",
    hints: "Client Hints (navigator.userAgentData)",
    uaString: "Строка User-Agent",
    platform: "navigator.platform и факты о платформе",
    noscript: "JavaScript отключён — значения определяются скриптом прямо в браузере. Включите JavaScript и обновите страницу.",
    local: "Всё определяется в вашем браузере, данные никуда не отправляются.",
  },
  en: {
    detecting: "Detecting…",
    unknown: "Could not detect",
    notAvailable: "Not available",
    yes: "Yes",
    no: "No",
    on: "On",
    off: "Off",
    supported: "Supported",
    notSupported: "No",
    copy: "Copy",
    copied: "Copied",
    details: "Details",
    source: "Data source",
    hints: "Client Hints (navigator.userAgentData)",
    uaString: "User-Agent string",
    platform: "navigator.platform and platform facts",
    noscript: "JavaScript is off — these values are detected by a script right in your browser. Enable JavaScript and reload the page.",
    local: "Everything is detected in your browser; nothing is sent anywhere.",
  },
} as const;

type Common = (typeof COMMON)[Locale];

export function sourceLabel(c: Common, s: "hints" | "ua" | "platform" | null): string {
  return s === "hints" ? c.hints : s === "ua" ? c.uaString : s === "platform" ? c.platform : c.unknown;
}

export function Pending({ locale }: { locale: Locale }) {
  return <span className="text-fg-3">{COMMON[locale].detecting}</span>;
}

/**
 * The one focal point of every tool: the detected answer in large type, with a
 * single copy button. Everything else on the page is quieter.
 */
export function Hero({
  locale,
  label,
  value,
  sub,
  copy,
  live = true,
  noscript,
  children,
}: {
  locale: Locale;
  label: ReactNode;
  /** null → "Detecting…" */
  value: ReactNode | null;
  sub?: ReactNode;
  copy?: string;
  /** Announce the value to screen readers once detected (false for ticking values). */
  live?: boolean;
  /** Replaces the generic "JavaScript is off" notice. */
  noscript?: ReactNode;
  children?: ReactNode;
}) {
  const c = COMMON[locale];
  return (
    <div className="min-w-0 rounded-[1.25rem] bg-accent-soft px-5 py-6 sm:px-7 sm:py-7">
      <p className="text-sm font-medium text-fg-2">{label}</p>
      <div aria-live={live ? "polite" : undefined} className="mt-1.5 min-h-12">
        <div className="tabular text-[2rem] leading-[1.15] font-bold tracking-tight break-words text-fg sm:text-5xl lg:text-6xl">{value === null ? <span className="text-fg-3">{c.detecting}</span> : value}</div>
        {sub ? <div className="mt-2 text-[0.9375rem] text-fg-2 sm:text-base">{sub}</div> : null}
      </div>
      {copy ? <CopyButton value={copy} label={c.copy} copiedLabel={c.copied} size="md" variant="primary" className="mt-4" /> : null}
      {children}
      <noscript>
        <Notice tone="warn" className="mt-4">
          {noscript ?? c.noscript}
        </Notice>
      </noscript>
    </div>
  );
}

interface Row {
  k: ReactNode;
  /** null → "Detecting…" */
  v: ReactNode | null;
  mono?: boolean;
}

const plain = (x: ReactNode | null) => (typeof x === "string" || typeof x === "number" ? String(x) : null);

/** Key/value tiles under the main answer, with one "copy all" when every value is plain text. */
export function Facts({ locale, title, rows, className }: { locale: Locale; title?: ReactNode; rows: Row[]; className?: string }) {
  const c = COMMON[locale];
  const lines = rows.map((r) => (plain(r.k) !== null && plain(r.v) !== null ? `${plain(r.k)}: ${plain(r.v)}` : null));
  const text = lines.every((l) => l !== null) ? lines.join("\n") : null;
  return (
    <Panel className={cn("p-4 sm:p-5", className)}>
      {title || text ? (
        <div className="mb-3 flex min-h-9 items-center justify-between gap-2">
          {title ? <h2 className="text-sm font-semibold text-fg">{title}</h2> : <span />}
          {text ? <CopyButton value={text} label={c.copy} copiedLabel={c.copied} size="sm" variant="ghost" compact /> : null}
        </div>
      ) : null}
      <dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-0.5 rounded-[1rem] bg-surface-2 px-4 py-3">
            <dt className="text-[0.8125rem] text-fg-3">{r.k}</dt>
            <dd className={cn("min-w-0 break-words text-base font-medium text-fg [overflow-wrap:anywhere]", r.mono && "font-mono text-sm")}>{r.v === null ? <Pending locale={locale} /> : r.v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

export function YesNo({ locale, value, yes, no }: { locale: Locale; value: boolean | null; yes?: string; no?: string }) {
  const c = COMMON[locale];
  if (value === null) return <Pending locale={locale} />;
  return <span className={value ? "text-ok" : "text-fg-2"}>{value ? (yes ?? c.yes) : (no ?? c.no)}</span>;
}

export function Hint({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "ok" }) {
  return <Notice tone={tone}>{children}</Notice>;
}

export function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:gap-5">{children}</div>;
}

/** Width × height. */
export const dims = (w: number, h: number) => `${w} × ${h}`;
