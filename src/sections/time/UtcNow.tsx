"use client";

import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { BigTime } from "./BigTime";
import { diffShort, hms, longDate } from "./lib/text";
import { fmtOffset, pad2, zoned } from "./lib/tz";
import { useLocalZone, useNow } from "./lib/use-now";
import type { NowProps } from "./types";

const T = {
  ru: { iso: "ISO 8601", unix: "Unix-время", you: "Вы", msk: "Москва", ast: "Астана", copy: "Копировать", copied: "Скопировано", same: "совпадает с UTC" },
  en: { iso: "ISO 8601", unix: "Unix time", you: "You", msk: "Moscow", ast: "Astana", copy: "Copy", copied: "Copied", same: "same as UTC" },
} as const;

export default function UtcNow({ locale }: NowProps) {
  const t = T[locale];
  const now = useNow();
  const tz = useLocalZone();
  const u = now !== null ? zoned(0, now) : null;
  const me = now !== null && tz ? zoned(tz, now) : null;
  const iso = u ? `${u.y}-${pad2(u.m)}-${pad2(u.d)}T${pad2(u.h)}:${pad2(u.mi)}:${pad2(u.s)}Z` : "";
  const unix = now !== null ? String(Math.floor(now / 1000)) : "";

  const rows: [string, string, string?][] = [
    [t.iso, iso, iso],
    [t.unix, unix, unix],
    [t.you, me ? `${hms(me, false)} · ${me.off === 0 ? t.same : `${fmtOffset(me.off)} (${diffShort(me.off, locale)})`}` : ""],
    [t.msk, u ? `${hms(zoned(180, now!), false)} · UTC+3` : ""],
    [t.ast, u ? `${hms(zoned(300, now!), false)} · UTC+5` : ""],
  ];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:py-12">
        <p className="text-sm font-semibold tracking-wide text-fg-3">UTC</p>
        <BigTime parts={u} className="text-[3.75rem] sm:text-[6.5rem]" />
        <p className="min-h-7 text-lg text-fg-2 sm:text-xl">{u ? longDate(locale, u) : " "}</p>
      </Panel>
      <Panel>
        <ul className="divide-y divide-line">
          {rows.map(([k, v, copy]) => (
            <li key={k} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
              <span className="text-sm text-fg-3">{k}</span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="tabular truncate font-mono text-[0.9375rem] text-fg">{v || "—"}</span>
                {copy !== undefined && <CopyButton value={copy} label={t.copy} copiedLabel={t.copied} showLabel={false} size="icon-sm" variant="ghost" />}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
