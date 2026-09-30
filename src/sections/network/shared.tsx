"use client";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import type { V4Error } from "./lib/ipv4";
import type { V6Error } from "./lib/ipv6";

export interface ValueRow {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
  /** Hide the copy button (e.g. for plain descriptive values). */
  noCopy?: boolean;
}

const L = {
  ru: { copy: "Копировать", copied: "Скопировано" },
  en: { copy: "Copy", copied: "Copied" },
} as const;

/** Label/value list with a copy button per value. */
export function ValueRows({ rows, locale, className }: { rows: ValueRow[]; locale: Locale; className?: string }) {
  const t = L[locale];
  return (
    <ul className={cn("rows", className)}>
      {rows.map((r) => (
        <li key={r.label}>
          <span className="min-w-0">
            <span className="block text-[13px] text-fg-3">{r.label}</span>
            <span className={cn("block font-semibold break-all text-fg", r.mono !== false && "font-mono text-[15px]")}>{r.value}</span>
            {r.hint && <span className="block text-[13px] text-fg-3">{r.hint}</span>}
          </span>
          {!r.noCopy && <CopyButton value={r.value} label={`${t.copy}: ${r.label}`} copiedLabel={t.copied} size="icon-sm" variant="ghost" showLabel={false} />}
        </li>
      ))}
    </ul>
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
