"use client";

import { Segmented } from "@/ui/segmented";
import { Switch } from "@/ui/field";
import { BigTime } from "./ui/BigTime";
import { ClockShell, isOpts, type ClockOptions } from "./ui/ClockShell";
import { longDate } from "./lib/text";
import { zoned } from "./lib/tz";
import { useStoredJson } from "./lib/storage";
import { useLocalZone, useNow } from "./lib/use-now";
import type { NowProps } from "./lib/types";

const T = {
  ru: { format: "Формат времени", sec: "Секунды", date: "Дата" },
  en: { format: "Time format", sec: "Seconds", date: "Date" },
} as const;

const DEFAULTS: Record<"ru" | "en", ClockOptions> = { ru: { h12: false, sec: true, date: true }, en: { h12: false, sec: true, date: true } };

export default function DigitalClock({ locale }: NowProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const [o, setO] = useStoredJson<ClockOptions>("online-clock:v1", DEFAULTS[locale], isOpts);
  const p = now !== null && tz ? zoned(tz, now) : null;

  return (
    <ClockShell
      locale={locale}
      options={
        <>
          <Segmented
            label={t.format}
            size="sm"
            value={o.h12 ? "12" : "24"}
            onChange={(v) => setO({ ...o, h12: v === "12" })}
            options={[
              { value: "24", label: locale === "ru" ? "24 ч" : "24 h" },
              { value: "12", label: locale === "ru" ? "12 ч" : "12 h" },
            ]}
          />
          <Switch label={t.sec} checked={o.sec} onChange={(e) => setO({ ...o, sec: e.target.checked })} />
          <Switch label={t.date} checked={o.date} onChange={(e) => setO({ ...o, date: e.target.checked })} />
        </>
      }
    >
      <BigTime parts={p} seconds={o.sec} h12={o.h12} className={o.sec ? "text-[min(19vw,12.5rem)]" : "text-[min(26vw,16.25rem)]"} />
      {o.date && <p className="mt-4 min-h-8 text-[min(5vw,2rem)] text-fg-2">{p ? longDate(locale, p) : " "}</p>}
    </ClockShell>
  );
}
