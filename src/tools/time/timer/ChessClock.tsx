"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";
import { ScrollRow } from "@/ui/scroll-row";
import { useWakeLock } from "@/ui/stage";
import { schedule, scheduleTick, unlockAudio } from "./lib/audio";
import { clock } from "./lib/format";
import { useKeys } from "./lib/keys";
import { nowMs } from "./lib/now";
import { useTicker } from "./lib/notify";

export interface ChessClockProps {
  locale: Locale;
  minutes?: number;
  increment?: number;
}

const PRESETS: [number, number][] = [
  [1, 0],
  [2, 1],
  [3, 0],
  [3, 2],
  [5, 0],
  [5, 3],
  [10, 0],
  [10, 5],
  [15, 10],
  [25, 10],
  [30, 0],
  [60, 0],
];

type Status = "idle" | "running" | "paused" | "flag";

const T = {
  ru: {
    control: "Контроль времени",
    player: (n: number) => `Игрок ${n}`,
    moves: (n: number) => `ходов: ${n}`,
    tap: "Нажмите, чтобы закончить ход",
    startHint: "Нажмите на свою половину — пойдут часы соперника",
    flag: "Время вышло",
    pause: "Пауза",
    resume: "Продолжить",
    reset: "Сброс",
    minShort: "мин",
    secShort: "с",
    keys: "Пробел — переключить часы",
  },
  en: {
    control: "Time control",
    player: (n: number) => `Player ${n}`,
    moves: (n: number) => `moves: ${n}`,
    tap: "Tap to end your move",
    startHint: "Tap your side to start your opponent's clock",
    flag: "Time is up",
    pause: "Pause",
    resume: "Resume",
    reset: "Reset",
    minShort: "min",
    secShort: "s",
    keys: "Space — switch clocks",
  },
} as const;

export default function ChessClock({ locale, minutes = 5, increment = 0 }: ChessClockProps) {
  const t = T[locale];
  const id = useId();
  const [ctl, setCtl] = useState<[number, number]>([minutes, increment]);
  const base = ctl[0] * 60000;
  const [times, setTimes] = useState<[number, number]>([base, base]);
  const [moves, setMoves] = useState<[number, number]>([0, 0]);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tickNow, setTickNow] = useState(0);
  const [turnAt, setTurnAt] = useState(0);
  useWakeLock(status === "running");

  const liveLeft = (side: 0 | 1) => (status === "running" && active === side ? times[side] - Math.max(0, tickNow - turnAt) : times[side]);

  useTicker(status === "running", () => {
    if (active === null) return;
    const now = nowMs();
    if (times[active] - (now - turnAt) <= 0) {
      setTimes((ts) => {
        const n: [number, number] = [...ts];
        n[active] = 0;
        return n;
      });
      setStatus("flag");
      schedule("digital", 0, 1);
    } else setTickNow(now);
  });

  /** `side` finished its move (tapped its half). */
  function press(side: 0 | 1) {
    if (status === "flag" || status === "paused") return;
    unlockAudio();
    if (status === "idle") {
      const now = nowMs();
      setTurnAt(now);
      setTickNow(now);
      setActive(side === 0 ? 1 : 0);
      setStatus("running");
      return;
    }
    if (active !== side) return;
    const now = nowMs();
    const spent = now - turnAt;
    setTimes((ts) => {
      const n: [number, number] = [...ts];
      n[side] = n[side] - spent + ctl[1] * 1000;
      return n;
    });
    setMoves((m) => {
      const n: [number, number] = [...m];
      n[side] += 1;
      return n;
    });
    setTurnAt(now);
    setTickNow(now);
    setActive(side === 0 ? 1 : 0);
    scheduleTick(0);
  }

  function pause() {
    if (status !== "running" || active === null) return;
    const spent = nowMs() - turnAt;
    setTimes((ts) => {
      const n: [number, number] = [...ts];
      n[active] -= spent;
      return n;
    });
    setStatus("paused");
  }
  function resume() {
    const now = nowMs();
    setTurnAt(now);
    setTickNow(now);
    setStatus("running");
  }
  function reset(c: [number, number] = ctl) {
    setTimes([c[0] * 60000, c[0] * 60000]);
    setMoves([0, 0]);
    setActive(null);
    setStatus("idle");
  }

  useKeys({ " ": () => (active !== null ? press(active) : press(0)), r: () => reset() });

  const half = (side: 0 | 1) => {
    const left = liveLeft(side);
    const isActive = active === side && status !== "idle";
    const lost = status === "flag" && active === side;
    return (
      <button
        type="button"
        onClick={() => press(side)}
        disabled={status === "flag" || status === "paused" || (status === "running" && active !== side)}
        aria-label={`${t.player(side + 1)}: ${clock(left)}. ${t.tap}`}
        className={cn(
          "flex min-h-[34vh] min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-[1.25rem] transition-[background-color,color,box-shadow,transform] duration-200 enabled:active:scale-[0.985] sm:min-h-[46vh]",
          side === 0 && "max-sm:rotate-180",
          lost
            ? "bg-err-soft text-err ring-2 ring-err"
            : isActive
              ? "bg-accent text-accent-fg shadow-elev-2"
              : "bg-surface text-fg shadow-card enabled:hover:shadow-elev-1 disabled:text-fg-2",
        )}
      >
        <span className="text-sm font-medium opacity-80">{t.player(side + 1)}</span>
        <span className="tabular text-[min(18vw,7.5rem)] leading-none font-semibold tracking-tight">{left < 10000 && left > 0 ? `${Math.floor(left / 1000)}.${Math.floor((left % 1000) / 100)}` : clock(left)}</span>
        <span className="text-[0.8125rem] opacity-80">{lost ? t.flag : t.moves(moves[side])}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {half(0)}
        <div className="flex items-center justify-center gap-2 sm:flex-col">
          {status === "running" ? (
            <IconButton label={t.pause} variant="tonal" size="lg" onClick={pause} icon={<Pause aria-hidden />} />
          ) : status === "paused" ? (
            <IconButton label={t.resume} variant="filled" size="lg" onClick={resume} icon={<Play aria-hidden />} />
          ) : null}
          <IconButton label={t.reset} size="lg" onClick={() => reset()} icon={<RotateCcw aria-hidden />} />
        </div>
        {half(1)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span id={`${id}-c`} className="text-sm font-medium text-fg-2">
          {t.control}
        </span>
        <ScrollRow label={t.control} role="radiogroup" rowClassName="gap-1.5">
          {(PRESETS.some(([m, i]) => m === ctl[0] && i === ctl[1]) ? PRESETS : [ctl, ...PRESETS]).map(([m, i]) => (
            <button
              key={`${m}+${i}`}
              type="button"
              role="radio"
              aria-checked={m === ctl[0] && i === ctl[1]}
              disabled={status === "running"}
              onClick={() => {
                setCtl([m, i]);
                reset([m, i]);
              }}
              className="chip tabular"
            >
              {m} {t.minShort} + {i} {t.secShort}
            </button>
          ))}
        </ScrollRow>
        <p className="px-1 text-[0.8125rem] text-fg-3">{status === "idle" ? t.startHint : t.keys}</p>
      </div>
    </div>
  );
}
