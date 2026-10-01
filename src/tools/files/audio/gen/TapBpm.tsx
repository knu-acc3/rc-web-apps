"use client";

import { RotateCcw } from "lucide-react";
import { useId, useState } from "react";
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
  },
} as const;

export default function TapBpm({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [taps, setTaps] = useState<number[]>([]);
  const r = tempoFromTaps(taps);
  const [flash, setFlash] = useState(0);
  const tap = (time: number) => {
    setTaps((l) => addTap(l, time));
    setFlash((n) => n + 1);
  };
  const hintId = useId();

  return (
    <Panel className="flex flex-col items-center gap-5 p-4 sm:p-6">
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
        className="group relative isolate flex size-60 touch-manipulation select-none flex-col items-center justify-center rounded-full bg-accent-container text-on-accent-container shadow-elev-2 transition-[transform,box-shadow] duration-100 hover:shadow-elev-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40 active:scale-95 active:shadow-elev-1 sm:size-72"
        aria-describedby={hintId}
      >
        {/* A ripple on every tap (restarted by the key). */}
        {flash > 0 && <span key={flash} aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-accent opacity-0 motion-safe:animate-[ripple_500ms_var(--ease-emph)]" />}
        <span className="tabular text-7xl font-bold text-fg" aria-live="polite">
          {r ? formatNumber(locale, Math.round(r.bpm)) : "—"}
        </span>
        <span className="mt-1 text-base font-semibold">{r ? `BPM · ${tempoMarking(r.bpm)}` : t.tap}</span>
      </button>
      <p id={hintId} className="text-center text-sm text-fg-3">
        {t.hint}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-fg-2">
        <span>{count(locale, taps.length, t.taps)}</span>
        {r && (
          <span className="tabular">
            {t.interval}: {formatNumber(locale, Math.round(r.interval))} {t.ms} · {formatNumber(locale, r.bpm, { maximumFractionDigits: 1 })} BPM
          </span>
        )}
        {r && <span className={r.used >= 6 && r.spread < 0.04 ? "font-semibold text-ok" : "text-fg-3"}>{r.used >= 6 && r.spread < 0.04 ? t.stable : t.more}</span>}
        <Button size="sm" variant="text" onClick={() => setTaps([])} disabled={!taps.length}>
          <RotateCcw aria-hidden />
          {t.reset}
        </Button>
      </div>
    </Panel>
  );
}
