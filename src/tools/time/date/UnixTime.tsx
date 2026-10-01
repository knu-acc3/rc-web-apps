"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { fmtDateLong } from "@/tools/time/calendar/lib/dates";
import { fmtOffset, pad2, zoned } from "@/tools/time/time/lib/tz";
import { modernZone, useLocalZone, useNow } from "@/tools/time/time/lib/use-now";
import { nowMs } from "@/tools/time/timer/lib/now";
import { iso8601, parseTimestamp, rfc2822, type TsUnit } from "./lib/engine";

export interface UnixTimeProps {
  locale: Locale;
  value?: string;
}

const T = {
  ru: {
    now: "Сейчас",
    input: "Unix-время",
    ph: "например, 1700000000",
    unit: "Единица",
    auto: "Авто",
    units: { s: "секунды", ms: "миллисекунды", us: "микросекунды", ns: "наносекунды" } as Record<TsUnit, string>,
    guessed: (u: string, n: number) => `Определено как ${u} по числу цифр (${n}). Если это не так, выберите единицу вручную.`,
    suspicious: "Дата получилась необычной — возможно, число в других единицах.",
    invalid: "Введите целое число (можно со знаком минус)",
    local: "Ваше время",
    utc: "UTC (ISO 8601)",
    iso: "ISO 8601 с вашим смещением",
    rfc: "RFC 2822",
    rel: "Относительно сейчас",
    sec: "В секундах",
    ms: "В миллисекундах",
    reverse: "Дата → Unix-время",
    dt: "Дата и время (ваш часовой пояс)",
    copy: "Копировать",
    copied: "Скопировано",
  },
  en: {
    now: "Now",
    input: "Unix timestamp",
    ph: "e.g. 1700000000",
    unit: "Unit",
    auto: "Auto",
    units: { s: "seconds", ms: "milliseconds", us: "microseconds", ns: "nanoseconds" } as Record<TsUnit, string>,
    guessed: (u: string, n: number) => `Interpreted as ${u} from the number of digits (${n}). If that's wrong, choose the unit manually.`,
    suspicious: "The resulting date looks unusual — the number may be in other units.",
    invalid: "Enter an integer (a minus sign is allowed)",
    local: "Your time",
    utc: "UTC (ISO 8601)",
    iso: "ISO 8601 with your offset",
    rfc: "RFC 2822",
    rel: "Relative to now",
    sec: "In seconds",
    ms: "In milliseconds",
    reverse: "Date → Unix time",
    dt: "Date and time (your time zone)",
    copy: "Copy",
    copied: "Copied",
  },
} as const;

function relative(locale: Locale, ms: number, now: number): string {
  const rtf = new Intl.RelativeTimeFormat(locale === "ru" ? "ru" : "en", { numeric: "auto" });
  const diff = (ms - now) / 1000;
  const a = Math.abs(diff);
  const pick: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [86400 * 30, "day"],
    [86400 * 365, "month"],
    [Infinity, "year"],
  ];
  const div: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400, month: 86400 * 30.44, year: 86400 * 365.25 };
  const unit = pick.find(([lim]) => a < lim)![1];
  return rtf.format(Math.round(diff / div[unit]), unit);
}

export default function UnixTime({ locale, value = "" }: UnixTimeProps) {
  const t = T[locale];
  const id = useId();
  const now = useNow();
  const tz = useLocalZone();
  const [text, setText] = useState(value);
  const [unit, setUnit] = useState<TsUnit | "auto">("auto");
  const [dt, setDt] = useState("");
  const parsed = text.trim() ? parseTimestamp(text, unit) : null;
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").length;
  const off = parsed && tz ? zoned(tz, parsed.ms).off : null;
  const p = parsed && tz ? zoned(tz, parsed.ms) : null;
  const dtMs = dt ? new Date(dt).getTime() : NaN;

  const rows: [string, string][] = parsed
    ? [
        [t.utc, iso8601(parsed.ms)],
        ...(off !== null ? ([[t.iso, iso8601(parsed.ms, off)]] as [string, string][]) : []),
        [t.rfc, rfc2822(parsed.ms, off ?? 0)],
        [t.sec, String(Math.floor(parsed.ms / 1000))],
        [t.ms, String(Math.floor(parsed.ms))],
        ...(now !== null ? ([[t.rel, relative(locale, parsed.ms, now)]] as [string, string][]) : []),
      ]
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[0.75rem] bg-surface-2 px-4 py-2.5">
        <span className="text-sm text-fg-3">
          {t.now}: <span className="tabular font-mono text-[0.9375rem] font-semibold text-fg">{now !== null ? Math.floor(now / 1000) : "—"}</span>
        </span>
        <CopyButton value={() => String(Math.floor(nowMs() / 1000))} label={t.copy} copiedLabel={t.copied} variant="ghost" />
      </div>

      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t.input} htmlFor={`${id}-ts`} className="sm:flex-1">
            <Input id={`${id}-ts`} inputMode="numeric" autoComplete="off" spellCheck={false} placeholder={t.ph} size="lg" className="tabular font-mono" value={text} onChange={(e) => setText(e.target.value)} aria-invalid={!!text.trim() && !parsed} />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg-2">{t.unit}</span>
            <Segmented
              label={t.unit}
              size="sm"
              value={unit}
              onChange={setUnit}
              options={[
                { value: "auto", label: t.auto },
                { value: "s", label: locale === "ru" ? "с" : "s" },
                { value: "ms", label: locale === "ru" ? "мс" : "ms" },
                { value: "us", label: locale === "ru" ? "мкс" : "µs" },
                { value: "ns", label: locale === "ru" ? "нс" : "ns" },
              ]}
            />
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-5 text-center" aria-live="polite">
          {text.trim() && !parsed ? (
            <p className="text-err">{t.invalid}</p>
          ) : parsed && p ? (
            <>
              <p className="text-sm font-medium text-fg-3">
                {t.local}: {tz ? `${modernZone(tz)}, ${fmtOffset(p.off)}` : ""}
              </p>
              <p className="tabular mt-1 text-2xl font-bold tracking-tight text-fg sm:text-4xl">
                {pad2(p.h)}:{pad2(p.mi)}:{pad2(p.s)}
              </p>
              <p className="mt-1 text-lg text-fg-2">{fmtDateLong(locale, { y: p.y, m: p.m, d: p.d })}</p>
            </>
          ) : (
            <p className="text-fg-3">{t.ph}</p>
          )}
        </div>
        {parsed?.guessed && digits > 11 && <p className="mt-3 text-center text-[0.8125rem] text-fg-3">{t.guessed(t.units[parsed.unit], digits)}</p>}
        {parsed?.suspicious && (
          <Notice tone="warn" className="mt-3">
            {t.suspicious}
          </Notice>
        )}
      </Panel>

      {rows.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-[0.75rem] border border-line bg-surface">
          {rows.map(([k, v]) => (
            <li key={k} className="flex min-h-11 items-center justify-between gap-3 px-4 py-1.5">
              <span className="shrink-0 text-sm text-fg-3">{k}</span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate font-mono text-[0.875rem] text-fg">{v}</span>
                <CopyButton value={v} label={t.copy} copiedLabel={t.copied} showLabel={false} size="icon-sm" variant="ghost" />
              </span>
            </li>
          ))}
        </ul>
      )}

      <Panel className="p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-fg">{t.reverse}</h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field label={t.dt} htmlFor={`${id}-dt`} className="sm:w-64">
            <Input id={`${id}-dt`} type="datetime-local" step={1} value={dt} onChange={(e) => setDt(e.target.value)} />
          </Field>
          {Number.isFinite(dtMs) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.9375rem] text-fg">
              <span>
                {Math.floor(dtMs / 1000)} <span className="text-fg-3">{locale === "ru" ? "с" : "s"}</span>
              </span>
              <CopyButton value={String(Math.floor(dtMs / 1000))} label={t.copy} copiedLabel={t.copied} showLabel={false} size="icon-sm" variant="ghost" />
              <span className="text-fg-2">
                {formatNumber(locale, dtMs, { useGrouping: false })} <span className="text-fg-3">{locale === "ru" ? "мс" : "ms"}</span>
              </span>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
