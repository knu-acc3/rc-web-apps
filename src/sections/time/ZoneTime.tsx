"use client";

import { useMemo } from "react";
import { Panel } from "@/ui/panel";
import { BigTime } from "./BigTime";
import { durationWords, longDate } from "./lib/text";
import { fmtOffset, tzOffset, zoned } from "./lib/tz";
import { useLocalZone, useMinute, useNow } from "./lib/use-now";
import type { ZoneTimeProps } from "./types";

const T = {
  ru: {
    ahead: (d: string) => `на ${d} впереди вашего времени`,
    behind: (d: string) => `на ${d} позади вашего времени`,
    same: "совпадает с вашим временем",
    now: "Сейчас по этому времени живут",
  },
  en: {
    ahead: (d: string) => `${d} ahead of your time`,
    behind: (d: string) => `${d} behind your time`,
    same: "same as your time",
    now: "Places on this time right now",
  },
} as const;

export default function ZoneTime({ locale, label, offset, tz, candidates }: ZoneTimeProps) {
  const t = T[locale];
  const now = useNow();
  const minute = useMinute();
  const localTz = useLocalZone();
  const src = tz ?? offset ?? 0;
  const p = now !== null ? zoned(src, now) : null;

  const rel = useMemo(() => {
    if (minute === null || !localTz) return null;
    const d = zoned(src, minute).off - tzOffset(localTz, minute);
    if (d === 0) return t.same;
    return d > 0 ? t.ahead(durationWords(d, locale, true)) : t.behind(durationWords(d, locale, true));
  }, [minute, localTz, src, t, locale]);

  const current = useMemo(() => {
    if (minute === null || offset === null) return [];
    return candidates.filter((c) => (c.tz ? tzOffset(c.tz, minute) : c.offset) === offset);
  }, [minute, candidates, offset]);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:py-10">
        <p className="text-sm font-semibold text-fg-3">
          {label}
          {p && tz ? ` · ${fmtOffset(p.off)}` : ""}
        </p>
        <BigTime parts={p} className="text-[60px] sm:text-[104px]" />
        <p className="min-h-7 text-lg text-fg-2 sm:text-xl">{p ? longDate(locale, p) : " "}</p>
        <p className="min-h-6 text-[15px] text-fg-3">{rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : " "}</p>
      </Panel>
      {current.length > 0 && (
        <p className="text-sm text-fg-3">
          <span className="font-medium text-fg-2">{t.now}:</span> {current.map((c) => c.name).join(", ")}
        </p>
      )}
    </div>
  );
}
