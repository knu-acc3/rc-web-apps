"use client";

import { INTL_LOCALE, type Locale } from "@/i18n/config";
import type { ToolProps } from "../types";
import { useDetected } from "./lib/probe";
import { COMMON, Facts, Hero, Stack } from "./ui";

const T = {
  ru: {
    label: "Основной язык вашего браузера",
    primary: "navigator.language",
    list: "Все предпочитаемые языки (по порядку)",
    resolved: "Локаль форматирования (Intl)",
    number: "Формат чисел",
    date: "Формат даты",
    hours: "Формат времени",
    h12: "12-часовой (AM/PM)",
    h24: "24-часовой",
    week: "Первый день недели",
    calendar: "Календарь",
    digits: "Система цифр",
    dir: "Направление текста",
    ltr: "слева направо",
    rtl: "справа налево",
  },
  en: {
    label: "Your browser's primary language",
    primary: "navigator.language",
    list: "All preferred languages (in order)",
    resolved: "Formatting locale (Intl)",
    number: "Number format",
    date: "Date format",
    hours: "Time format",
    h12: "12-hour (AM/PM)",
    h24: "24-hour",
    week: "First day of the week",
    calendar: "Calendar",
    digits: "Numbering system",
    dir: "Text direction",
    ltr: "left to right",
    rtl: "right to left",
  },
} as const;

interface LangData {
  language: string;
  languages: string[];
  resolved: string;
  number: string;
  date: string;
  hourCycle: string | null;
  firstDay: number | null;
  calendar: string;
  numbering: string;
  dir: "ltr" | "rtl" | null;
}

type WeekInfoLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
  getTextInfo?: () => { direction: "ltr" | "rtl" };
  textInfo?: { direction: "ltr" | "rtl" };
};

function detectLang(): LangData {
  const language = navigator.language || "";
  const languages = navigator.languages?.length ? [...navigator.languages] : language ? [language] : [];
  const ro = Intl.DateTimeFormat().resolvedOptions();
  let hourCycle: string | null = null;
  try {
    hourCycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle ?? null;
  } catch {
    /* ignore */
  }
  let firstDay: number | null = null;
  let dir: "ltr" | "rtl" | null = null;
  try {
    const loc = new Intl.Locale(ro.locale) as WeekInfoLocale;
    firstDay = (loc.getWeekInfo?.() ?? loc.weekInfo)?.firstDay ?? null;
    dir = (loc.getTextInfo?.() ?? loc.textInfo)?.direction ?? null;
  } catch {
    /* Intl.Locale extensions unsupported */
  }
  return {
    language,
    languages,
    resolved: ro.locale,
    number: new Intl.NumberFormat().format(1234567.89),
    date: new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(new Date()),
    hourCycle,
    firstDay,
    calendar: ro.calendar,
    numbering: ro.numberingSystem,
    dir,
  };
}

function langName(tag: string, locale: Locale): string {
  try {
    const n = new Intl.DisplayNames([INTL_LOCALE[locale]], { type: "language" }).of(tag);
    return n && n !== tag ? n : tag;
  } catch {
    return tag;
  }
}

function dayName(day: number, locale: Locale): string {
  // 2024-01-01 was a Monday; ISO day 1..7.
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, day)));
}

export default function LanguageInfo({ locale }: ToolProps) {
  const c = COMMON[locale];
  const t = T[locale];
  const d = useDetected(detectLang);
  const main = d?.language ? langName(d.language, locale) : null;
  return (
    <Stack>
      <Hero
        locale={locale}
        label={t.label}
        value={d ? (main ? main.charAt(0).toUpperCase() + main.slice(1) : c.unknown) : null}
        sub={d?.language ? d.language : undefined}
        copy={d?.languages.join(", ") || undefined}
      />
      <Facts
        locale={locale}
        title={c.details}
        rows={[
          { k: t.primary, v: d ? d.language || "—" : null, mono: true },
          {
            k: t.list,
            v: d ? (
              <ol className="list-decimal pl-5">
                {d.languages.map((l) => (
                  <li key={l}>
                    <span className="font-mono text-sm">{l}</span> — {langName(l, locale)}
                  </li>
                ))}
              </ol>
            ) : null,
          },
          { k: t.resolved, v: d ? d.resolved : null, mono: true },
          { k: t.number, v: d ? d.number : null },
          { k: t.date, v: d ? d.date : null },
          { k: t.hours, v: d ? (d.hourCycle ? (d.hourCycle === "h11" || d.hourCycle === "h12" ? t.h12 : t.h24) : c.unknown) : null },
          { k: t.week, v: d ? (d.firstDay ? dayName(d.firstDay, locale) : c.notAvailable) : null },
          { k: t.calendar, v: d ? d.calendar : null, mono: true },
          { k: t.digits, v: d ? d.numbering : null, mono: true },
          { k: t.dir, v: d ? (d.dir ? (d.dir === "rtl" ? t.rtl : t.ltr) : c.notAvailable) : null },
        ]}
      />
    </Stack>
  );
}
