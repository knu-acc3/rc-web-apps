"use client";

import Link from "@/ui/link";
import { Maximize2 } from "lucide-react";
import { href } from "@/i18n/config";
import { isoWeek } from "@/tools/time/calendar/lib/dates";
import { buttonClass } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { BigTime } from "./ui/BigTime";
import { longDate, ymdOf } from "./lib/text";
import { fmtOffset, zoned } from "./lib/tz";
import { modernZone, useLocalZone, useNow } from "./lib/use-now";
import type { NowProps } from "./lib/types";

const T = {
  ru: { week: "неделя", zone: "Часовой пояс", full: "Часы на весь экран", device: "Время вашего устройства" },
  en: { week: "week", zone: "Time zone", full: "Full-screen clock", device: "Your device time" },
} as const;

export default function Now({ locale }: NowProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const p = now !== null && tz ? zoned(tz, now) : null;
  const week = p ? isoWeek(ymdOf(p)).week : null;

  return (
    <Panel className="flex flex-col items-center gap-4 px-4 py-8 text-center sm:py-12">
      <p className="text-sm font-medium text-fg-3">{t.device}</p>
      <BigTime parts={p} className="text-[min(19vw,4rem)] sm:text-[7rem] 2xl:text-[9rem]" />
      <p className="min-h-7 text-lg text-fg-2 sm:text-xl">
        {p ? (
          <>
            {longDate(locale, p)}
            <span className="text-fg-3">
              {" · "}
              {t.week} {week}
            </span>
          </>
        ) : (
          " "
        )}
      </p>
      <p className="min-h-6 text-[0.9375rem] text-fg-3">
        {p && tz ? (
          <>
            {t.zone}: <span className="font-medium text-fg-2">{modernZone(tz)}</span>, {fmtOffset(p.off)}
          </>
        ) : (
          " "
        )}
      </p>
      <Link href={href(locale, ["online-clock"])} className={buttonClass("tonal", "md")}>
        <Maximize2 aria-hidden />
        {t.full}
      </Link>
    </Panel>
  );
}
