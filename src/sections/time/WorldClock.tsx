"use client";

import { Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { PlaceSearch } from "./PlaceSearch";
import { sunElevation } from "./lib/sun";
import { dayShift, diffShort, hms, longDate, placeParts, shortDate } from "./lib/text";
import { fmtOffset, zoned } from "./lib/tz";
import { useStoredJson } from "./lib/storage";
import { modernZone, useLocalZone, useNow } from "./lib/use-now";
import type { Place, WorldClockProps } from "./types";

const T = {
  ru: { you: "Ваше время", add: "Добавить город", edit: "Изменить", done: "Готово", remove: "Убрать", reset: "Вернуть список по умолчанию", day: "день", night: "ночь", same: "как у вас" },
  en: { you: "Your time", add: "Add a city", edit: "Edit", done: "Done", remove: "Remove", reset: "Restore default list", day: "day", night: "night", same: "same as you" },
} as const;

const isPlaces = (v: unknown): v is Place[] =>
  Array.isArray(v) && v.every((p) => p && typeof p === "object" && typeof (p as Place).key === "string" && typeof (p as Place).name === "string" && ((p as Place).tz === null || typeof (p as Place).tz === "string"));

export default function WorldClock({ locale, defaults }: WorldClockProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const [places, setPlaces] = useStoredJson<Place[]>(`world-clock:${locale}:v1`, defaults, isPlaces);
  const [editing, setEditing] = useState(false);
  const me = now !== null && tz ? zoned(tz, now) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <p className="text-[0.9375rem] text-fg-2">
          {t.you}:{" "}
          <span className="tabular text-xl font-semibold text-fg">{me ? hms(me) : "--:--:--"}</span>
          <span className="text-fg-3"> {me && tz ? `· ${longDate(locale, me)} · ${modernZone(tz)}, ${fmtOffset(me.off)}` : ""}</span>
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((p) => {
          const q = now !== null ? placeParts(p, now) : null;
          const d = q && me ? q.off - me.off : null;
          const shift = q && me ? dayShift(locale, me, q) : "";
          const isDay = now !== null && p.lat !== undefined && p.lon !== undefined ? sunElevation(now, p.lat, p.lon) > -0.833 : null;
          return (
            <li key={p.key}>
              <Panel className="relative flex h-full flex-col gap-1 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-fg">{p.name}</span>
                  {editing ? (
                    <button
                      type="button"
                      onClick={() => setPlaces(places.filter((x) => x.key !== p.key))}
                      className="rounded-[0.375rem] p-1 text-fg-3 hover:bg-surface-2 hover:text-err"
                      aria-label={`${t.remove}: ${p.name}`}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  ) : isDay === null ? null : isDay ? (
                    <Sun className="size-4 shrink-0 text-warn" aria-label={t.day} />
                  ) : (
                    <Moon className="size-4 shrink-0 text-fg-3" aria-label={t.night} />
                  )}
                </div>
                <span className="tabular text-4xl font-semibold tracking-tight text-fg">{q ? hms(q, false) : "--:--"}</span>
                <span className="text-[0.8125rem] text-fg-3">
                  {q ? (
                    <>
                      {shortDate(locale, q)}
                      {shift && `, ${shift}`} · {d === 0 ? t.same : diffShort(d ?? 0, locale)}
                    </>
                  ) : (
                    p.sub
                  )}
                </span>
              </Panel>
            </li>
          );
        })}
      </ul>

      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center")}>
        <PlaceSearch
          locale={locale}
          label={t.add}
          className="sm:max-w-sm sm:flex-1"
          exclude={places.map((p) => p.key)}
          onPick={(p) => setPlaces([...places, p])}
        />
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} aria-pressed={editing}>
            {editing ? t.done : t.edit}
          </Button>
          {editing && (
            <Button variant="ghost" size="sm" onClick={() => setPlaces(null)}>
              {t.reset}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
