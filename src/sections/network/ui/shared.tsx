"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import type { V4Error } from "../lib/ipv4";
import type { V6Error } from "../lib/ipv6";

export interface ValueRow {
  label: string;
  value: string;
  /** Plain text (not monospace). */
  plain?: boolean;
}

const L = {
  ru: { copyAll: "Копировать всё", copied: "Скопировано", details: "Подробности" },
  en: { copyAll: "Copy all", copied: "Copied", details: "Details" },
} as const;

/** The one prominent result of a tool: big value, one or two quiet lines under it. */
export function ResultCard({ value, sub, badge, className }: { value: ReactNode; sub?: ReactNode; badge?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-[0.75rem] bg-surface-2 px-4 py-4 sm:px-5", className)}>
      <div aria-live="polite" className="font-mono text-2xl font-semibold tracking-tight break-words [overflow-wrap:anywhere] text-fg sm:text-3xl">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[0.9375rem] text-fg-2">{sub}</div>}
      {badge && <div className="mt-2.5 flex flex-wrap items-center gap-2">{badge}</div>}
    </div>
  );
}

/** Quiet two-column definition list with a single "copy all" action. Values are easy to select. */
export function DetailList({ rows, locale, title, className }: { rows: ValueRow[]; locale: Locale; title?: string; className?: string }) {
  const t = L[locale];
  const text = rows.map((r) => `${r.label}: ${r.value}`).join("\n");
  return (
    <section className={cn("rounded-[0.75rem] border border-line bg-surface", className)}>
      <div className="flex min-h-11 items-center justify-between gap-2 border-b border-line px-4 py-1.5">
        <h2 className="text-sm font-semibold text-fg-2">{title ?? t.details}</h2>
        <CopyButton value={text} label={t.copyAll} copiedLabel={t.copied} variant="ghost" />
      </div>
      <dl className="grid gap-x-8 px-4 py-2.5 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col py-1.5">
            <dt className="text-[0.8125rem] text-fg-3">{r.label}</dt>
            <dd className={cn("break-words [overflow-wrap:anywhere] text-fg select-all", r.plain ? "text-[0.9375rem]" : "font-mono text-sm")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const ERR4: Record<Locale, Record<V4Error, string>> = {
  ru: {
    empty: "Введите IP-адрес",
    format: "Неверный формат: нужен адрес вида 192.168.1.10 или 192.168.1.10/24",
    octet: "Каждое число в адресе должно быть от 0 до 255",
    "leading-zero": "Уберите ведущие нули: «010» некоторые системы читают как восьмеричное число",
    prefix: "Префикс должен быть от /0 до /32 (или маска вида 255.255.255.0)",
    mask: "Маска должна быть непрерывной (единицы слева, нули справа), например 255.255.255.0",
  },
  en: {
    empty: "Enter an IP address",
    format: "Invalid format: use 192.168.1.10 or 192.168.1.10/24",
    octet: "Each number in the address must be between 0 and 255",
    "leading-zero": "Remove leading zeros: some systems read “010” as octal",
    prefix: "The prefix must be /0 to /32 (or a mask like 255.255.255.0)",
    mask: "The mask must be contiguous (ones then zeros), e.g. 255.255.255.0",
  },
};

const ERR6: Record<Locale, Record<V6Error, string>> = {
  ru: {
    empty: "Введите IPv6-адрес",
    format: "Неверный формат IPv6: нужно 8 групп по 1–4 шестнадцатеричные цифры или сокращение «::»",
    group: "Каждая группа — от 1 до 4 шестнадцатеричных цифр (0–9, a–f)",
    "double-colon": "«::» можно использовать только один раз и только вместо хотя бы одной нулевой группы",
    ipv4: "Встроенный IPv4-адрес допускается только в конце и должен быть корректным",
    prefix: "Префикс IPv6 должен быть от /0 до /128",
  },
  en: {
    empty: "Enter an IPv6 address",
    format: "Invalid IPv6: use 8 groups of 1–4 hex digits or the “::” shorthand",
    group: "Each group is 1 to 4 hex digits (0–9, a–f)",
    "double-colon": "“::” may appear only once and must replace at least one zero group",
    ipv4: "An embedded IPv4 address is only allowed at the end and must be valid",
    prefix: "An IPv6 prefix must be /0 to /128",
  },
};

export const err4 = (locale: Locale, e: V4Error) => ERR4[locale][e];
export const err6 = (locale: Locale, e: V6Error) => ERR6[locale][e];

export function bigFmt(locale: Locale, n: bigint | number): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(n);
}
