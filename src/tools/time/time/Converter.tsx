"use client";

import { RotateCcw, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useBrowser12h } from "@/lib/clock-format";
import { cn } from "@/lib/cn";
import { parseYmd, ymdStr } from "@/tools/time/calendar/lib/dates";
import { Button } from "@/ui/button";
import { Slider } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { PlaceSearch } from "./ui/PlaceSearch";
import { dayShift, diffShort, shortDate, placeParts } from "./lib/text";
import { fmtOffset, pad2, zonedToUtc } from "./lib/tz";
import { useStoredJson } from "./lib/storage";
import { modernZone, useLocalZone, useMinute } from "./lib/use-now";
import type { ConverterProps, Place } from "./lib/types";

const T = {
  ru: {
    you: "Ваше время",
    date: "Дата",
    time: "Время",
    now: "Сейчас",
    add: "Добавить город или пояс",
    edit: "Изменить",
    done: "Готово",
    remove: "Убрать",
    planner: "Планировщик встреч",
    plannerHint: "Зелёным — рабочее время (9:00–18:00) во всех городах. Нажмите на час, чтобы выбрать его.",
    noOverlap: "Общего рабочего времени нет — ищите ближайшие к нему часы.",
    slider: "Время в первой строке",
    hourOf: (h: string) => `Выбрать ${h}`,
  },
  en: {
    you: "Your time",
    date: "Date",
    time: "Time",
    now: "Now",
    add: "Add a city or zone",
    edit: "Edit",
    done: "Done",
    remove: "Remove",
    planner: "Meeting planner",
    plannerHint: "Green: working hours (9:00–18:00) in every city. Click an hour to select it.",
    noOverlap: "No common working hours — look for the closest hours.",
    slider: "Time in the first row",
    hourOf: (h: string) => `Select ${h}`,
  },
} as const;

const isPlaces = (v: unknown): v is Place[] => Array.isArray(v) && v.every((p) => p && typeof (p as Place).key === "string" && typeof (p as Place).name === "string");
const src = (p: Place) => p.tz ?? p.offset ?? 0;

export default function Converter({ locale, rows: initial, withLocal = false, persist = false }: ConverterProps) {
  const t = T[locale];
  const h12 = useBrowser12h();
  const id = useId();
  const now = useMinute();
  const localTz = useLocalZone();
  const [stored, setStored] = useStoredJson<Place[]>(`time-converter:${locale}:v1`, initial, isPlaces);
  const [plain, setPlain] = useState<Place[]>(initial);
  const rowsData = persist ? stored : plain;
  const setRows = persist ? setStored : setPlain;
  const [fixed, setFixed] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);

  const rows = useMemo(() => {
    if (!withLocal) return rowsData;
    const local: Place = { key: "local", name: t.you, sub: localTz ? modernZone(localTz) : "", tz: localTz, offset: null };
    return [local, ...rowsData.filter((r) => r.key !== "local")];
  }, [withLocal, rowsData, localTz, t.you]);
  const ready = now !== null && rows.every((r) => r.tz !== null || r.offset !== null);
  const T0 = fixed ?? now;
  const first = rows[0];

  const parts = useMemo(() => (ready && T0 !== null ? rows.map((r) => placeParts(r, T0)) : null), [ready, T0, rows]);
  const firstParts = parts?.[0] ?? null;

  function setWall(r: Place, value: string) {
    if (!ready || T0 === null) return;
    const m = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!m) return;
    const q = placeParts(r, T0);
    setFixed(zonedToUtc(src(r), q.y, q.m, q.d, Number(m[1]), Number(m[2])));
  }

  function setDate(value: string) {
    const d = parseYmd(value);
    if (!d || !firstParts) return;
    setFixed(zonedToUtc(src(first), d.y, d.m, d.d, firstParts.h, firstParts.mi));
  }

  function setMinutes(v: number) {
    if (!firstParts) return;
    setFixed(zonedToUtc(src(first), firstParts.y, firstParts.m, firstParts.d, Math.floor(v / 60), v % 60));
  }

  /* meeting planner: 24 hours of the first row's day */
  const planner = useMemo(() => {
    if (!firstParts || rows.length < 2) return null;
    const cols = Array.from({ length: 24 }, (_, h) => {
      const at = zonedToUtc(src(first), firstParts.y, firstParts.m, firstParts.d, h, 0);
      const hours = rows.map((r) => placeParts(r, at));
      const all = hours.every((p) => p.h >= 9 && p.h < 18);
      return { h, at, hours, all };
    });
    return cols;
  }, [firstParts, rows, first]);

  const minutes = firstParts ? firstParts.h * 60 + firstParts.mi : 0;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label htmlFor={`${id}-d`} className="text-sm text-fg-3">
              {t.date}
            </label>
            <input
              id={`${id}-d`}
              type="date"
              className="control h-9 w-40 text-sm"
              value={firstParts ? ymdStr({ y: firstParts.y, m: firstParts.m, d: firstParts.d }) : ""}
              onChange={(e) => setDate(e.target.value)}
              disabled={!firstParts}
            />
          </div>
          <Slider
            aria-label={t.slider}
            min={0}
            max={1425}
            step={15}
            value={Math.round(minutes / 15) * 15}
            onChange={(e) => setMinutes(Number(e.target.value))}
            disabled={!firstParts}
            className="sm:flex-1"
          />
          <Button variant={fixed === null ? "secondary" : "outline"} size="sm" onClick={() => setFixed(null)} disabled={fixed === null}>
            <RotateCcw aria-hidden />
            {t.now}
          </Button>
        </div>

        <ul className="mt-4 divide-y divide-line">
          {rows.map((r, i) => {
            const p = parts?.[i] ?? null;
            const shift = p && firstParts && i > 0 ? dayShift(locale, firstParts, p) : "";
            const d = p && firstParts && i > 0 ? p.off - firstParts.off : null;
            return (
              <li key={r.key} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-fg">{r.name}</div>
                  <div className="truncate text-[0.8125rem] text-fg-3">
                    {p ? fmtOffset(p.off) : ""}
                    {r.sub ? `${p ? " · " : ""}${r.sub}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <label htmlFor={`${id}-t${i}`} className="sr-only">
                      {t.time}: {r.name}
                    </label>
                    <input
                      id={`${id}-t${i}`}
                      type="time"
                      step={60}
                      className={cn("tabular rounded-[0.5rem] border border-transparent bg-transparent px-1 text-right font-semibold text-fg hover:border-line focus:border-accent focus:outline-none", h12 ? "w-[9.5rem] text-lg min-[400px]:text-xl sm:w-48 sm:text-2xl" : "w-[8.5rem] text-[1.375rem] min-[400px]:text-2xl sm:w-40 sm:text-3xl")}
                      value={p ? `${pad2(p.h)}:${pad2(p.mi)}` : ""}
                      onChange={(e) => setWall(r, e.target.value)}
                      disabled={!p}
                    />
                    <div className="text-[0.75rem] text-fg-3">
                      {p ? shortDate(locale, p) : " "}
                      {shift && `, ${shift}`}
                      {d !== null && d !== 0 && ` · ${diffShort(d, locale)}`}
                    </div>
                  </div>
                  {editing && r.key !== "local" && (
                    <button
                      type="button"
                      className="rounded-[0.375rem] p-1 text-fg-3 hover:bg-surface-2 hover:text-err"
                      aria-label={`${t.remove}: ${r.name}`}
                      onClick={() => setRows(rowsData.filter((x) => x.key !== r.key))}
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <PlaceSearch locale={locale} label={t.add} className="sm:max-w-sm sm:flex-1" exclude={rows.map((r) => r.key)} onPick={(p) => setRows([...rowsData, p])} />
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)} aria-pressed={editing}>
            {editing ? t.done : t.edit}
          </Button>
        </div>
      </Panel>

      {planner && (
        <section aria-labelledby={`${id}-pl`}>
          <h2 id={`${id}-pl`} className="mb-1 text-sm font-semibold text-fg">
            {t.planner}
          </h2>
          <p className="mb-2 text-[0.8125rem] text-fg-3">{planner.some((c) => c.all) ? t.plannerHint : t.noOverlap}</p>
          <div className="overflow-x-auto rounded-[0.75rem] border border-line bg-surface p-2 scrollbar-thin">
            <table className="w-full border-separate border-spacing-0.5 text-center text-[0.75rem]">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.key}>
                    <th scope="row" className="sticky left-0 z-10 max-w-28 truncate bg-surface pr-2 text-left font-medium text-fg-2">
                      {r.name}
                    </th>
                    {planner.map((c) => {
                      const h = c.hours[i].h;
                      const selected = firstParts && c.h === firstParts.h;
                      return (
                        <td
                          key={c.h}
                          className={cn(
                            "tabular h-7 min-w-7 rounded-[0.25rem] px-0.5",
                            h >= 9 && h < 18 ? (c.all ? "bg-ok-soft font-semibold text-ok" : "bg-accent-soft text-fg") : h >= 7 && h < 22 ? "bg-surface-2 text-fg-2" : "text-fg-3",
                            selected && "outline outline-2 outline-accent",
                          )}
                        >
                          {i === 0 ? (
                            <button type="button" className="h-full w-full" onClick={() => setFixed(c.at)} aria-label={t.hourOf(`${pad2(h)}:00`)}>
                              {h}
                            </button>
                          ) : (
                            h
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
