"use client";

import Link from "@/ui/link";
import { cn } from "@/lib/cn";
import { Panel } from "@/ui/panel";
import { BigTime } from "./BigTime";
import { dayShift, hms, longDate } from "./lib/text";
import { fmtOffset, zoned } from "./lib/tz";
import { modernZone, useLocalZone, useNow } from "./lib/use-now";
import type { ZonesTableProps } from "./types";

const T = {
  ru: { yours: "Ваш часовой пояс", offset: "Пояс", time: "Сейчас", cities: "Где", you: "вы здесь" },
  en: { yours: "Your time zone", offset: "Zone", time: "Now", cities: "Where", you: "you are here" },
} as const;

export default function ZonesTable({ locale, rows }: ZonesTableProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const me = now !== null && tz ? zoned(tz, now) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-2 px-4 py-6 text-center sm:py-8">
        <p className="text-sm font-medium text-fg-3">{t.yours}</p>
        <p className="min-h-8 text-2xl font-semibold text-fg sm:text-3xl">{me && tz ? `${modernZone(tz)} · ${fmtOffset(me.off)}` : " "}</p>
        <BigTime parts={me} className="text-[44px] sm:text-[64px]" />
        <p className="min-h-6 text-[15px] text-fg-2">{me ? longDate(locale, me) : " "}</p>
      </Panel>
      <div tabIndex={0} className="tbl">
        <table>
          <thead>
            <tr>
              <th scope="col">{t.offset}</th>
              <th scope="col">{t.time}</th>
              <th scope="col">{t.cities}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = now !== null ? zoned(r.offset, now) : null;
              const mine = me?.off === r.offset;
              const shift = p && me ? dayShift(locale, me, p) : "";
              return (
                <tr key={r.offset} className={cn(mine && "bg-accent-soft")}>
                  <td className="whitespace-nowrap font-medium">
                    {r.path ? (
                      <Link href={r.path} className="text-accent hover:underline">
                        {r.label}
                      </Link>
                    ) : (
                      r.label
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="tabular font-semibold">{p ? hms(p, false) : "--:--"}</span>
                    {shift && <span className="ml-1.5 text-[13px] text-fg-3">{shift}</span>}
                    {mine && <span className="ml-1.5 text-[13px] text-accent">· {t.you}</span>}
                  </td>
                  <td className="text-fg-2">{r.cities}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
