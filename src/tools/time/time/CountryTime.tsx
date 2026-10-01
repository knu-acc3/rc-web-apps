"use client";

import { Panel } from "@/ui/panel";
import { BigTime } from "./ui/BigTime";
import { dayShift, hms, longDate, placeParts } from "./lib/text";
import { fmtOffset } from "./lib/tz";
import { useNow } from "./lib/use-now";
import type { CountryTimeProps } from "./lib/types";

export default function CountryTime({ locale, groups }: CountryTimeProps) {
  const now = useNow();

  if (groups.length === 1) {
    const g = groups[0];
    const p = now !== null ? placeParts(g.places[0], now) : null;
    return (
      <Panel className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:py-10">
        <BigTime parts={p} className="text-[min(18vw,3.75rem)] sm:text-[6.5rem] 2xl:text-[8rem]" />
        <p className="min-h-7 text-lg text-fg-2 sm:text-xl">{p ? longDate(locale, p) : " "}</p>
        <p className="text-[0.9375rem] text-fg-3">
          {p ? fmtOffset(p.off) : g.label} · {g.places.map((x) => x.name).join(", ")}
        </p>
      </Panel>
    );
  }

  const ref = now !== null ? placeParts(groups[0].places[0], now) : null;
  return (
    <Panel>
      <ul className="divide-y divide-line">
        {groups.map((g) => {
          const p = now !== null ? placeParts(g.places[0], now) : null;
          const shift = p && ref ? dayShift(locale, ref, p) : "";
          return (
            <li key={g.label} className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg-2">{p ? fmtOffset(p.off) : g.label}</div>
                <div className="truncate text-[0.8125rem] text-fg-3">{g.places.map((x) => x.name).join(", ")}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{p ? hms(p) : "--:--:--"}</div>
                {shift && <div className="text-[0.75rem] text-fg-3">{shift}</div>}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
