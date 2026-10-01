"use client";

import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useMemo } from "react";
import { fmtDate } from "@/tools/time/calendar/lib/dates";
import { Panel } from "@/ui/panel";
import { BigTime } from "./ui/BigTime";
import { sunDay, sunElevation } from "./lib/sun";
import { dayShift, diffShort, durationWords, hms, hmWords, longDate, placeParts } from "./lib/text";
import { fmtOffset, nextTransition, pad2, tzOffset, zoned } from "./lib/tz";
import { useLocalZone, useMinute, useNow } from "./lib/use-now";
import type { CityTimeProps, Place } from "./lib/types";

const T = {
  ru: {
    ahead: (d: string) => `На ${d} впереди вашего времени`,
    behind: (d: string) => `На ${d} позади вашего времени`,
    same: "Совпадает с вашим временем",
    sunrise: "Восход",
    sunset: "Закат",
    day: "Долгота дня",
    polarDay: "Полярный день",
    polarNight: "Полярная ночь",
    noDst: "Часы здесь не переводят",
    next: (date: string, from: string, to: string, off: string) => `Следующий перевод часов: ${date}, ${from} → ${to} (${off})`,
    table: "Сейчас в других городах",
    city: "Город",
    time: "Время",
    diff: "Разница",
    dayTime: "день",
    nightTime: "ночь",
  },
  en: {
    ahead: (d: string) => `${d} ahead of your time`,
    behind: (d: string) => `${d} behind your time`,
    same: "Same as your time",
    sunrise: "Sunrise",
    sunset: "Sunset",
    day: "Day length",
    polarDay: "Polar day",
    polarNight: "Polar night",
    noDst: "Clocks do not change here",
    next: (date: string, from: string, to: string, off: string) => `Next clock change: ${date}, ${from} → ${to} (${off})`,
    table: "Right now in other cities",
    city: "City",
    time: "Time",
    diff: "Difference",
    dayTime: "day",
    nightTime: "night",
  },
} as const;

function hmAt(t: number, off: number): string {
  const p = zoned(off, t);
  return `${pad2(p.h)}:${pad2(p.mi)}`;
}

export default function CityTime({ locale, city, compare, world }: CityTimeProps) {
  const t = T[locale];
  const now = useNow();
  const minute = useMinute();
  const localTz = useLocalZone();
  const p = now !== null ? placeParts(city, now) : null;

  const rel = useMemo(() => {
    if (minute === null || !localTz) return null;
    const d = placeParts(city, minute).off - tzOffset(localTz, minute);
    if (d === 0) return t.same;
    return d > 0 ? t.ahead(durationWords(d, locale, true)) : t.behind(durationWords(d, locale, true));
  }, [minute, localTz, city, t, locale]);

  const sun = useMemo(() => {
    if (minute === null || city.lat === undefined || city.lon === undefined) return null;
    const q = placeParts(city, minute);
    return { ...sunDay(q.y, q.m, q.d, city.lat, city.lon, q.off), off: q.off };
  }, [minute, city]);

  const dst = useMemo(() => {
    if (minute === null || !city.tz) return null;
    const n = nextTransition(city.tz, minute);
    if (!n) return t.noDst;
    const q = zoned(n.to, n.at);
    return t.next(fmtDate(locale, { y: q.y, m: q.m, d: q.d }), hmAt(n.at, n.from), hmAt(n.at, n.to), fmtOffset(n.to));
  }, [minute, city.tz, t, locale]);

  const others = useMemo(() => {
    const seen = new Set<string>([city.key]);
    const out: Place[] = [];
    for (const x of [...compare, ...world]) {
      if (seen.has(x.key)) continue;
      seen.add(x.key);
      out.push(x);
    }
    return out;
  }, [compare, world, city.key]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:items-start">
      <Panel className="min-w-0 px-4 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <BigTime parts={p} className="text-[min(18vw,3.75rem)] sm:text-[6.5rem] 2xl:text-[8rem]" />
          <p className="min-h-7 text-lg text-fg-2 sm:text-xl">{p ? longDate(locale, p) : " "}</p>
          <p className="min-h-6 text-[0.9375rem] text-fg-3">
            {p ? fmtOffset(p.off) : "UTC"}
            {rel && <> · {rel}</>}
          </p>
        </div>
        <dl className="mx-auto mt-7 grid max-w-2xl grid-cols-3 gap-2 border-t border-line pt-5 text-center">
          <div>
            <dt className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-fg-3">
              <Sunrise className="size-4" aria-hidden />
              {t.sunrise}
            </dt>
            <dd className="tabular mt-1 text-lg font-semibold text-fg">{sun ? (sun.sunrise !== null ? hmAt(sun.sunrise, sun.off) : "—") : "—"}</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-1.5 text-[0.8125rem] text-fg-3">
              <Sunset className="size-4" aria-hidden />
              {t.sunset}
            </dt>
            <dd className="tabular mt-1 text-lg font-semibold text-fg">{sun ? (sun.sunset !== null ? hmAt(sun.sunset, sun.off) : "—") : "—"}</dd>
          </div>
          <div>
            <dt className="text-[0.8125rem] text-fg-3">{t.day}</dt>
            <dd className="tabular mt-1 text-lg font-semibold text-fg">{sun ? (sun.polar === "day" ? t.polarDay : sun.polar === "night" ? t.polarNight : hmWords(sun.dayLength, locale)) : "—"}</dd>
          </div>
        </dl>
        <p className="mt-4 min-h-5 text-center text-sm text-fg-3">{dst ?? " "}</p>
      </Panel>

      <Panel className="min-w-0 overflow-hidden">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold text-fg">{t.table}</h2>
        <ul className="rows xl:grid-cols-1! xl:[&>li]:border-r-0!">
          {others.map((x) => {
            const q = now !== null ? placeParts(x, now) : null;
            const shift = q && p ? dayShift(locale, p, q) : "";
            const d = q && p ? q.off - p.off : null;
            const isDay = now !== null && x.lat !== undefined && x.lon !== undefined ? sunElevation(now, x.lat, x.lon) > -0.833 : null;
            return (
              <li key={x.key}>
                <span className="flex min-w-0 items-center gap-2">
                  {isDay === null ? <span className="size-4" /> : isDay ? <Sun className="size-4 shrink-0 text-warn" aria-label={t.dayTime} /> : <Moon className="size-4 shrink-0 text-fg-3" aria-label={t.nightTime} />}
                  <span className="truncate text-[0.9375rem] text-fg">{x.name}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="tabular text-[0.9375rem] font-semibold text-fg">{q ? hms(q, false) : "--:--"}</span>
                  <span className="tabular min-w-16 text-right text-[0.8125rem] text-fg-3">
                    {d !== null ? diffShort(d, locale) : ""}
                    {shift && `, ${shift}`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
