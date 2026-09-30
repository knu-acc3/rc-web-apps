"use client";

import { Download, Flag, Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Kbd } from "@/ui/panel";
import { useFullscreen } from "@/sections/time/lib/use-fullscreen";
import { clock } from "./lib/format";
import { useKeys } from "./lib/keys";
import { nowMs } from "./lib/now";
import { useTicker, useTitle } from "./lib/notify";

const T = {
  ru: {
    start: "Старт",
    stop: "Стоп",
    resume: "Продолжить",
    lap: "Круг",
    reset: "Сброс",
    laps: "Круги",
    n: "№",
    split: "Время круга",
    total: "Общее время",
    best: "лучший",
    worst: "худший",
    copy: "Копировать",
    copied: "Скопировано",
    csv: "CSV",
    txt: "TXT",
    keys: [["Space", "старт/стоп"], ["L", "круг"], ["R", "сброс"], ["F", "весь экран"]],
    file: "секундомер",
    full: "На весь экран",
  },
  en: {
    start: "Start",
    stop: "Stop",
    resume: "Resume",
    lap: "Lap",
    reset: "Reset",
    laps: "Laps",
    n: "#",
    split: "Lap time",
    total: "Total time",
    best: "best",
    worst: "worst",
    copy: "Copy",
    copied: "Copied",
    csv: "CSV",
    txt: "TXT",
    keys: [["Space", "start/stop"], ["L", "lap"], ["R", "reset"], ["F", "full screen"]],
    file: "stopwatch",
    full: "Full screen",
  },
} as const;

interface Lap {
  n: number;
  /** split: time of this lap only */
  lap: number;
  /** total elapsed at the moment of the lap */
  total: number;
}

const fmt = (ms: number) => clock(ms, { up: true, hundredths: true });

export default function Stopwatch({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [running, setRunning] = useState(false);
  const base = useRef(0);
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const { ref, active: full, toggle } = useFullscreen<HTMLDivElement>();

  const now = () => base.current + (running ? nowMs() - startedAt.current : 0);

  useTicker(running, () => setElapsed(now()));
  useTitle(running ? clock(elapsed, { up: true }) : null);

  function start() {
    startedAt.current = nowMs();
    setRunning(true);
  }
  function stop() {
    base.current += nowMs() - startedAt.current;
    setElapsed(base.current);
    setRunning(false);
  }
  function lap() {
    if (!running) return;
    const total = now();
    setLaps((ls) => {
      const prev = ls[0]?.total ?? 0;
      return [{ n: ls.length + 1, lap: total - prev, total }, ...ls];
    });
  }
  function reset() {
    if (running) return;
    base.current = 0;
    setElapsed(0);
    setLaps([]);
  }
  useKeys({ " ": () => (running ? stop() : start()), l: lap, r: reset });

  const lapTimes = laps.map((l) => l.lap);
  const best = laps.length >= 2 ? Math.min(...lapTimes) : -1;
  const worst = laps.length >= 2 ? Math.max(...lapTimes) : -1;

  const asText = () => [`${t.n}\t${t.split}\t${t.total}`, ...[...laps].reverse().map((l) => `${l.n}\t${fmt(l.lap)}\t${fmt(l.total)}`)].join("\n");
  const asCsv = () => [`n,lap_ms,total_ms,lap,total`, ...[...laps].reverse().map((l) => `${l.n},${l.lap},${l.total},${fmt(l.lap)},${fmt(l.total)}`)].join("\n");

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center gap-6 rounded-[0.75rem] border border-line bg-surface px-3 py-8 sm:py-10", full && "min-h-screen rounded-none border-0")}
      >
        <div className={cn("tabular font-semibold leading-none tracking-tight text-fg", full ? "text-[min(16vw,34vh)]" : "text-[min(15vw,7rem)]")}>
          {clock(elapsed, { up: true })}
          <span className="text-[0.55em] text-fg-3">.{String(Math.floor((elapsed % 1000) / 10)).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-2">
          {running ? (
            <Button variant="primary" size="lg" onClick={stop} className="min-w-36">
              <Pause aria-hidden />
              {t.stop}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={start} className="min-w-36">
              <Play aria-hidden />
              {elapsed > 0 ? t.resume : t.start}
            </Button>
          )}
          {running ? (
            <Button variant="secondary" size="lg" onClick={lap} className="min-w-28">
              <Flag aria-hidden />
              {t.lap}
            </Button>
          ) : (
            <Button variant="secondary" size="lg" onClick={reset} disabled={elapsed === 0} className="min-w-28">
              <RotateCcw aria-hidden />
              {t.reset}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="hidden flex-wrap gap-x-4 text-[0.8125rem] text-fg-3 sm:flex">
          {t.keys.map(([k, label]) => (
            <span key={k}>
              <Kbd>{k}</Kbd> {label}
            </span>
          ))}
        </p>
        <Button variant="ghost" size="sm" onClick={toggle} className="ml-auto">
          <Maximize2 aria-hidden />
          {t.full}
        </Button>
      </div>

      {laps.length > 0 && (
        <section className="overflow-hidden rounded-[0.75rem] border border-line bg-surface">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
            <h2 className="text-sm font-semibold text-fg">
              {t.laps}: {laps.length}
            </h2>
            <div className="flex items-center gap-1">
              <CopyButton value={asText} label={t.copy} copiedLabel={t.copied} variant="ghost" />
              <Button variant="ghost" size="sm" onClick={() => downloadText(asCsv(), `${t.file}.csv`, "text/csv;charset=utf-8")}>
                <Download aria-hidden />
                {t.csv}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => downloadText(asText(), `${t.file}.txt`)}>
                {t.txt}
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-[0.9375rem]">
              <thead className="sticky top-0 bg-surface-2 text-[0.8125rem] text-fg-2">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {t.n}
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {t.split}
                  </th>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {t.total}
                  </th>
                </tr>
              </thead>
              <tbody className="tabular">
                {laps.map((l) => (
                  <tr key={l.n} className="border-t border-line">
                    <td className="px-4 py-2 text-fg-3">{l.n}</td>
                    <td className={cn("px-4 py-2 font-semibold", l.lap === best ? "text-ok" : l.lap === worst ? "text-err" : "text-fg")}>
                      {fmt(l.lap)}
                      {l.lap === best && <span className="ml-2 text-[0.75rem] font-normal">{t.best}</span>}
                      {l.lap === worst && <span className="ml-2 text-[0.75rem] font-normal">{t.worst}</span>}
                    </td>
                    <td className="px-4 py-2 text-fg-2">{fmt(l.total)}</td>
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
