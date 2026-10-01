"use client";

import { Download, Flag, Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { downloadText } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Kbd, Panel, PanelHeader } from "@/ui/panel";
import { usePersistentState } from "@/lib/persist";
import { useFullscreen } from "@/ui/fullscreen";
import { ToolTitle } from "@/ui/tool-title";
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

const isTitle = (v: unknown): v is string => typeof v === "string" && v.length <= 60;

export default function Stopwatch({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [running, setRunning] = useState(false);
  const base = useRef(0);
  const startedAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<Lap[]>([]);
  const { ref, active: full, toggle } = useFullscreen<HTMLDivElement>();
  const [title, setTitle] = usePersistentState("timer:stopwatch:title:v1", "", isTitle);

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
    <div className={cn("grid gap-4", laps.length > 0 && "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start")}>
      <div className="flex min-w-0 flex-col gap-3">
        <Panel ref={ref} className={cn("flex flex-col items-center justify-center gap-6 px-3 py-8 sm:py-10", full && "min-h-screen rounded-none! shadow-none!")}>
          <ToolTitle value={title} onChange={setTitle} locale={locale} full={full} />
          <div className={cn("tabular font-semibold leading-none tracking-tight text-fg", full ? "text-[min(16vw,34vh)]" : "text-[min(15vw,7rem)] 2xl:text-[9rem]")}>
            {clock(elapsed, { up: true })}
            <span className="text-[0.55em] text-fg-3">.{String(Math.floor((elapsed % 1000) / 10)).padStart(2, "0")}</span>
          </div>
          <div className="flex w-full max-w-lg flex-wrap items-center justify-center gap-2 sm:gap-3">
            {running ? (
              <Button variant="filled" size="xl" onClick={stop} className="min-w-40 flex-1 sm:max-w-60">
                <Pause aria-hidden />
                {t.stop}
              </Button>
            ) : (
              <Button variant="filled" size="xl" onClick={start} className="min-w-40 flex-1 sm:max-w-60">
                <Play aria-hidden />
                {elapsed > 0 ? t.resume : t.start}
              </Button>
            )}
            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="tonal" size="xl" onClick={lap} className="min-w-32">
                  <Flag aria-hidden />
                  {t.lap}
                </Button>
              ) : (
                <Button variant="tonal" size="xl" onClick={reset} disabled={elapsed === 0} className="min-w-32">
                  <RotateCcw aria-hidden />
                  {t.reset}
                </Button>
              )}
              <IconButton label={t.full} size="lg" onClick={toggle} icon={full ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />} />
            </div>
          </div>
        </Panel>

        <p className="hidden flex-wrap gap-x-4 px-1 text-[0.8125rem] text-fg-3 sm:flex">
          {t.keys.map(([k, label]) => (
            <span key={k}>
              <Kbd>{k}</Kbd> {label}
            </span>
          ))}
        </p>
      </div>

      {laps.length > 0 && (
        <Panel className="min-w-0 overflow-hidden">
          <PanelHeader
            title={`${t.laps}: ${laps.length}`}
            actions={
              <>
                <CopyButton value={asText} label={t.copy} copiedLabel={t.copied} variant="ghost" size="icon-sm" />
                <Button variant="text" size="sm" onClick={() => downloadText(asCsv(), `${t.file}.csv`, "text/csv;charset=utf-8")}>
                  <Download aria-hidden />
                  {t.csv}
                </Button>
                <Button variant="text" size="sm" onClick={() => downloadText(asText(), `${t.file}.txt`)}>
                  {t.txt}
                </Button>
              </>
            }
          />
          <div className="max-h-[28rem] overflow-auto">
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
                  <tr key={l.n} className="border-t border-line motion-safe:animate-[menu-in_200ms_ease-out]">
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
        </Panel>
      )}
    </div>
  );
}
