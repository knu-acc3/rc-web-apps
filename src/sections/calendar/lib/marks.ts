"use client";

import { useCallback } from "react";
import type { Locale } from "@/i18n/config";
import { useStoredJson } from "@/sections/time/lib/storage";
import { useLocalZone } from "@/sections/time/lib/use-now";
import type { DayMark } from "../ui/MonthGrid";
import type { Ymd } from "./dates";
import { productionYear, type HolidayCountry } from "./holidays";

export type HolidayChoice = HolidayCountry | "none";

const KZ_ZONES = new Set(["Asia/Almaty", "Asia/Qostanay", "Asia/Qyzylorda", "Asia/Aqtobe", "Asia/Aqtau", "Asia/Atyrau", "Asia/Oral"]);
const RU_ZONES = new Set([
  "Europe/Moscow", "Europe/Kaliningrad", "Europe/Samara", "Europe/Saratov", "Europe/Ulyanovsk", "Europe/Astrakhan", "Europe/Volgograd", "Europe/Kirov",
  "Asia/Yekaterinburg", "Asia/Omsk", "Asia/Novosibirsk", "Asia/Barnaul", "Asia/Tomsk", "Asia/Novokuznetsk", "Asia/Krasnoyarsk", "Asia/Irkutsk",
  "Asia/Chita", "Asia/Yakutsk", "Asia/Khandyga", "Asia/Vladivostok", "Asia/Ust-Nera", "Asia/Magadan", "Asia/Sakhalin", "Asia/Srednekolymsk", "Asia/Kamchatka", "Asia/Anadyr",
]);

const isChoice = (v: unknown): v is HolidayChoice => v === "ru" || v === "kz" || v === "none";

/**
 * Which country's holidays to mark. Stored per browser; the default follows the
 * visitor's time zone (Kazakhstan / Russia), then the page language.
 */
export function useHolidayChoice(locale: Locale, fallback?: HolidayChoice): [HolidayChoice, (c: HolidayChoice) => void] {
  const tz = useLocalZone();
  const [stored, setStored] = useStoredJson<HolidayChoice | null>("calendar:holidays:v1", null, isChoiceOrNull);
  const auto: HolidayChoice = fallback ?? (tz && KZ_ZONES.has(tz) ? "kz" : tz && RU_ZONES.has(tz) ? "ru" : locale === "ru" ? "ru" : "none");
  const set = useCallback((c: HolidayChoice) => setStored(c), [setStored]);
  return [stored ?? auto, set];
}
function isChoiceOrNull(v: unknown): v is HolidayChoice | null {
  return v === null || isChoice(v);
}

const T = {
  ru: { off: "выходной (перенос)", short: "сокращённый день", workSat: "рабочий день (перенос)" },
  en: { off: "day off (moved)", short: "shortened day", workSat: "working day (moved)" },
} as const;

/** Cell styling for a date in the chosen country's calendar. */
export function holidayMarker(choice: HolidayChoice, locale: Locale): ((d: Ymd) => DayMark | undefined) | undefined {
  if (choice === "none") return undefined;
  const t = T[locale];
  return (d) => {
    const py = productionYear(choice, d.y);
    const type = py.type(d);
    switch (type) {
      case "holiday":
        return { cls: "bg-err-soft font-semibold text-err", title: py.holidayOn(d)?.name[locale] };
      case "off":
        return { cls: "bg-err-soft/50 text-err", title: t.off };
      case "short":
        return { cls: "bg-warn-soft text-warn", title: t.short };
      case "workSat":
        return { cls: "bg-surface-2 text-fg underline decoration-dotted", title: t.workSat };
      case "weekend":
        return { cls: "text-err" };
      default:
        return { cls: "text-fg" };
    }
  };
}
