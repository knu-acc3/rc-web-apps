"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Panel } from "@/ui/panel";
import { addTap, tempoFromTaps, tempoMarking } from "../lib/bpm";

const T = {
  ru: {
    tap: "Нажимайте в такт",
    hint: "Нажимайте на кнопку, пробел или любую клавишу в ритме музыки",
    taps: ["нажатие", "нажатия", "нажатий"],
    interval: "Интервал",
    ms: "мс",
    reset: "Сбросить",
    more: "Ещё несколько нажатий для точности",
    stable: "Темп стабилен",
    note: "После паузы дольше 2 секунд отсчёт начинается заново. Учитываются последние 16 нажатий; случайные пропуски и двойные нажатия отбрасываются.",
  },
  en: {
    tap: "Tap to the beat",
    hint: "Tap the button, the space bar or any key in time with the music",
    taps: ["tap", "taps"],
    interval: "Interval",
    ms: "ms",
    reset: "Reset",
    more: "A few more taps for accuracy",
    stable: "Tempo is steady",
    note: "A pause longer than 2 seconds starts a new count. The last 16 taps are used; missed and double taps are ignored.",
  },
} as const;

export default function TapBpm({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [taps, setTaps] = useState<number[]>([]);
  const r = tempoFromTaps(taps);
  const tap = (time: number) => setTaps((l) => addTap(l, time));

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-5 p-6">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            tap(performance.now());
          }}
          onKeyDown={(e) => {
            if (e.repeat || e.key === "Tab" || e.key === "Escape") return;
            e.preventDefault();
            tap(performance.now());
          }}
          className="flex size-56 touch-manipulation select-none flex-col items-center justify-center rounded-full border-4 border-accent bg-accent-soft text-accent transition-transform duration-75 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 sm:size-64"
          aria-describedby="tap-hint"
        >
          <span className="tabular text-6xl font-bold text-fg" aria-live="polite">
            {r ? formatNumber(locale, Math.round(r.bpm)) : "—"}
          </span>
          <span className="text-sm font-medium">{r ? `BPM · ${tempoMarking(r.bpm)}` : t.tap}</span>
        </button>
        <p id="tap-hint" className="text-center text-sm text-fg-3">
          {t.hint}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-fg-2">
          <span>{count(locale, taps.length, t.taps)}</span>
          {r && (
            <span className="tabular">
              {t.interval}: {formatNumber(locale, Math.round(r.interval))} {t.ms} · {formatNumber(locale, r.bpm, { maximumFractionDigits: 1 })} BPM
            </span>
          )}
          {r && <span className={r.used >= 6 && r.spread < 0.04 ? "text-ok" : "text-fg-3"}>{r.used >= 6 && r.spread < 0.04 ? t.stable : t.more}</span>}
          <Button size="sm" variant="ghost" onClick={() => setTaps([])} disabled={!taps.length}>
            <RotateCcw aria-hidden />
            {t.reset}
          </Button>
        </div>
      </Panel>
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
