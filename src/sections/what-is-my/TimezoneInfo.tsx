"use client";

import { useSyncExternalStore } from "react";
import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { formatDate } from "@/i18n/format";
import type { ToolProps } from "../types";
import { dstInfo, nextTransition, tzOffsetMinutes, utcLabel, type DstInfo, type Transition } from "./lib/tz";
import { clockStore, useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Hint, Stack } from "./ui/kit";

const T = {
  ru: {
    label: "Ваш часовой пояс",
    iana: "Идентификатор IANA",
    offset: "Смещение от UTC сейчас",
    name: "Название пояса",
    dst: "Летнее время",
    dstYes: (d: DstInfo) => `есть: зимой ${utcLabel(d.standard)}, летом ${utcLabel(d.daylight ?? d.standard)}`,
    dstNo: "не переводится",
    next: "Следующий перевод часов",
    nextNone: "в ближайший год не ожидается",
    nextValue: (date: string, to: number) => `${date} → ${utcLabel(to)}`,
    raw: "new Date().getTimezoneOffset()",
    rawNote: "минут (знак обратный: восток — минус)",
    local: "Местное время",
    utc: "Время UTC",
    unix: "Unix-время",
    utcWarn:
      "Браузер сообщает пояс UTC. Если в системе не выставлен UTC специально, это может быть защита от отпечатков: Firefox с privacy.resistFingerprinting и Tor Browser всегда показывают сайтам UTC.",
  },
  en: {
    label: "Your time zone",
    iana: "IANA identifier",
    offset: "Current UTC offset",
    name: "Zone name",
    dst: "Daylight saving time",
    dstYes: (d: DstInfo) => `yes: ${utcLabel(d.standard)} in winter, ${utcLabel(d.daylight ?? d.standard)} in summer`,
    dstNo: "not observed",
    next: "Next clock change",
    nextNone: "none expected within a year",
    nextValue: (date: string, to: number) => `${date} → ${utcLabel(to)}`,
    raw: "new Date().getTimezoneOffset()",
    rawNote: "minutes (inverted sign: east is negative)",
    local: "Local time",
    utc: "UTC time",
    unix: "Unix time",
    utcWarn:
      "The browser reports the UTC zone. Unless your system is deliberately set to UTC, this may be anti-fingerprinting: Firefox with privacy.resistFingerprinting and Tor Browser always tell websites UTC.",
  },
} as const;

interface TzData {
  zone: string;
  offset: number;
  raw: number;
  dst: DstInfo | null;
  next: Transition | null;
  longName: Record<Locale, string | null>;
}

function zoneName(zone: string, locale: Locale, at: Date): string | null {
  try {
    for (const style of ["longGeneric", "long"] as const) {
      const part = new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: zone, timeZoneName: style })
        .formatToParts(at)
        .find((p) => p.type === "timeZoneName")?.value;
      if (part && !/^GMT|^UTC/.test(part)) return part;
    }
  } catch {
    /* unsupported style */
  }
  return null;
}

function detectTz(): TzData {
  const now = new Date();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let offset = -now.getTimezoneOffset();
  let dst: DstInfo | null = null;
  let next: Transition | null = null;
  try {
    offset = tzOffsetMinutes(zone, now);
    dst = dstInfo(zone, now.getFullYear());
    next = nextTransition(zone, now);
  } catch {
    /* exotic zone id */
  }
  return { zone, offset, raw: now.getTimezoneOffset(), dst, next, longName: { ru: zoneName(zone, "ru", now), en: zoneName(zone, "en", now) } };
}

export default function TimezoneInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detectTz);
  const sec = useSyncExternalStore(clockStore.subscribe, clockStore.getSnapshot, clockStore.getServerSnapshot);
  const now = sec === null ? null : new Date(sec * 1000);
  const time = (zone?: string) =>
    now ? formatDate(locale, now, { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", day: "numeric", month: "long", timeZone: zone }) : null;
  const name = d?.longName[locale] ?? null;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={d ? d.zone : null}
        sub={d ? [utcLabel(d.offset), name].filter(Boolean).join(" · ") : undefined}
        copy={d ? `${d.zone} (${utcLabel(d.offset)})` : undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.iana, v: d ? d.zone : null, mono: true },
          { k: t.offset, v: d ? utcLabel(d.offset) : null },
          { k: t.name, v: d ? (name ?? "—") : null },
          { k: t.dst, v: d ? (d.dst ? (d.dst.observes ? t.dstYes(d.dst) : t.dstNo) : c.unknown) : null },
          {
            k: t.next,
            v: d
              ? d.next
                ? t.nextValue(formatDate(locale, d.next.at, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }), d.next.to)
                : t.nextNone
              : null,
          },
          { k: t.raw, v: d ? `${d.raw} ${t.rawNote}` : null },
          // Ticking values below: no aria-live.
          { k: t.local, v: time() },
          { k: t.utc, v: time("UTC") },
          { k: t.unix, v: sec, mono: true },
        ]}
      />
      {d && (d.zone === "UTC" || d.zone === "Etc/UTC") ? <Hint>{t.utcWarn}</Hint> : null}
    </Stack>
  );
}
