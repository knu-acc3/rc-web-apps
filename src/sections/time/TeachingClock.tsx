"use client";

import { Check, Clock, Maximize, Minus, Plus, Shuffle, X } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { StageLayer, useStage } from "@/ui/stage";
import { randomInt, shuffle } from "../random/lib/rng";
import { digits, dragMinute, enSpoken, handAngles, ruDayPart, ruOfficial, ruSpoken } from "./lib/words";

type Mode = "free" | "read" | "set";
type Level = "hours" | "halves" | "quarters" | "fives" | "minutes";
const LEVEL_STEP: Record<Level, number> = { hours: 60, halves: 30, quarters: 15, fives: 5, minutes: 1 };

const T = {
  ru: {
    mode: "Режим",
    modes: { free: "Изучать", read: "Сколько времени?", set: "Поставь стрелки" },
    level: "Сложность",
    levels: { hours: "Часы", halves: "Полчаса", quarters: "Четверти", fives: "5 минут", minutes: "1 минута" },
    now: "Сейчас",
    random: "Случайное время",
    hourBack: "Час назад",
    hourFwd: "Час вперёд",
    minBack: "5 минут назад",
    minFwd: "5 минут вперёд",
    minutesRing: "Минуты по краю",
    words: "Время словами",
    official: "Официально",
    say: "Говорят",
    question: "Сколько времени на часах?",
    setTask: "Поставьте стрелки:",
    check: "Проверить",
    next: "Дальше",
    right: "Верно!",
    wrong: (a: string) => `Неверно. Правильно: ${a}`,
    score: (r: number, n: number) => `Верно ${r} из ${n}`,
    full: "На весь экран",
    close: "Закрыть",
    stage: "Учебные часы на весь экран",
    clock: "Учебные часы",
    hourHand: "Часовая стрелка",
    minuteHand: "Минутная стрелка",
    drag: "Тяните за стрелки: короткая — часы, длинная — минуты.",
  },
  en: {
    mode: "Mode",
    modes: { free: "Explore", read: "What time is it?", set: "Set the clock" },
    level: "Level",
    levels: { hours: "Hours", halves: "Half hours", quarters: "Quarters", fives: "5 minutes", minutes: "1 minute" },
    now: "Now",
    random: "Random time",
    hourBack: "Hour back",
    hourFwd: "Hour forward",
    minBack: "5 minutes back",
    minFwd: "5 minutes forward",
    minutesRing: "Minutes around the edge",
    words: "Time in words",
    official: "Digital",
    say: "We say",
    question: "What time does the clock show?",
    setTask: "Set the hands to:",
    check: "Check",
    next: "Next",
    right: "Correct!",
    wrong: (a: string) => `Not quite. The answer is ${a}`,
    score: (r: number, n: number) => `${r} of ${n} correct`,
    full: "Full screen",
    close: "Close",
    stage: "Teaching clock full screen",
    clock: "Teaching clock",
    hourHand: "Hour hand",
    minuteHand: "Minute hand",
    drag: "Drag the hands: the short one shows hours, the long one minutes.",
  },
} as const;

interface Opts {
  ring: boolean;
  words: boolean;
  level: Level;
}
const isOpts = (v: unknown): v is Opts => {
  const o = v as Opts;
  return !!o && typeof o.ring === "boolean" && typeof o.words === "boolean" && o.level in LEVEL_STEP;
};

const NUMS = Array.from({ length: 12 }, (_, i) => i + 1);
/** Point on the dial; rounded so the server and the browser print the same SVG (no hydration mismatch). */
const at = (n: number, r: number) => {
  const a = (n * 30 * Math.PI) / 180;
  return { x: Math.round((100 + r * Math.sin(a)) * 100) / 100, y: Math.round((100 - r * Math.cos(a)) * 100) / 100 };
};
const TICKS = Array.from({ length: 60 }, (_, i) => i);

const spoken = (locale: Locale, total: number) => {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return locale === "ru" ? ruSpoken(h, m) : enSpoken(h, m);
};
const label12 = (total: number) => digits(Math.floor(total / 60) % 12 === 0 ? 12 : Math.floor(total / 60) % 12, total % 60, false).replace(/^0/, "");

/** A random time on the level's grid (12-hour: what the dial can show). */
function randomTime(level: Level): number {
  const step = LEVEL_STEP[level];
  return randomInt(720 / step) * step;
}

/** Four answers: the right one, the classic "hands swapped" mistake and near misses. */
function makeOptions(answer: number, level: Level): number[] {
  const step = Math.max(5, LEVEL_STEP[level]);
  const h = Math.floor(answer / 60) % 12;
  const m = answer % 60;
  const swapped = ((Math.round(m / 5) % 12) * 60 + ((h * 5) % 60)) % 720;
  const pool = [swapped, (answer + 60) % 720, (answer + 660) % 720, (answer + step) % 720, (answer + 720 - step) % 720, (answer + 30) % 720];
  const out = [answer];
  for (const x of shuffle(pool)) if (!out.includes(x) && out.length < 4) out.push(x);
  return shuffle(out);
}

function Dial({
  total,
  ring,
  t,
  onChange,
  big = false,
}: {
  total: number;
  ring: boolean;
  t: (typeof T)[Locale];
  onChange?: (total: number) => void;
  big?: boolean;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<"hour" | "minute" | null>(null);
  const { hour, minute } = handAngles(Math.floor(total / 60), total % 60);

  const angleOf = (e: ReactPointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    return { angle: (Math.atan2(dx, -dy) * 180) / Math.PI, dist: (Math.hypot(dx, dy) / r.width) * 200 };
  };
  const apply = (e: ReactPointerEvent) => {
    if (!onChange || !drag.current) return;
    const { angle } = angleOf(e);
    if (drag.current === "minute") onChange(dragMinute(total, angle, 1));
    else {
      // The hour hand points between numbers; keep the minutes, move the hour, and flip AM/PM when passing 12.
      const a = ((angle % 360) + 360) % 360;
      const h = Math.floor(a / 30);
      const half = total >= 720 ? 720 : 0;
      const prevH = Math.floor((total % 720) / 60);
      let next = half + h * 60 + (total % 60);
      if (prevH === 11 && h === 0) next += 720;
      else if (prevH === 0 && h === 11) next -= 720;
      onChange(((next % 1440) + 1440) % 1440);
    }
  };

  return (
    <svg
      ref={svg}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`${t.clock}: ${label12(total)}`}
      className={cn("aspect-square touch-none select-none", big ? "w-[min(86vh,92vw)]" : "w-full max-w-[26rem]", onChange && "cursor-pointer")}
      onPointerDown={(e) => {
        if (!onChange) return;
        const { angle, dist } = angleOf(e);
        const a = ((angle % 360) + 360) % 360;
        const near = (x: number) => Math.min(Math.abs(a - x), 360 - Math.abs(a - x));
        // Grab the hand under the finger; a tap elsewhere moves the minute hand there.
        drag.current = dist < 62 && near(hour % 360) < 25 && !(near(minute) < 12 && dist > 40) ? "hour" : "minute";
        svg.current!.setPointerCapture(e.pointerId);
        apply(e);
      }}
      onPointerMove={(e) => drag.current && apply(e)}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <circle cx="100" cy="100" r="97" className="fill-surface stroke-line-strong" strokeWidth="2.5" />
      {TICKS.map((i) => (
        <line key={i} x1="100" y1={i % 5 === 0 ? 5 : 5} x2="100" y2={i % 5 === 0 ? 13 : 9} transform={`rotate(${i * 6} 100 100)`} className={i % 5 === 0 ? "stroke-fg" : "stroke-fg-3"} strokeWidth={i % 5 === 0 ? 2 : 1} />
      ))}
      {ring &&
        NUMS.map((n) => {
          const { x, y } = at(n, 79);
          return (
            <text key={`m${n}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-[#2563eb] text-[7.5px] font-semibold dark:fill-[#7aa7ff]">
              {n === 12 ? "00" : String(n * 5).padStart(2, "0")}
            </text>
          );
        })}
      {NUMS.map((n) => {
        const { x, y } = at(n, ring ? 62 : 74);
        return (
          <text key={n} x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-fg text-[17px] font-bold">
            {n}
          </text>
        );
      })}
      <g transform={`rotate(${hour} 100 100)`} aria-label={t.hourHand}>
        <line x1="100" y1="112" x2="100" y2="54" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
        <line x1="100" y1="100" x2="100" y2="54" stroke="transparent" strokeWidth="22" />
      </g>
      <g transform={`rotate(${minute} 100 100)`} aria-label={t.minuteHand}>
        <line x1="100" y1="116" x2="100" y2="22" stroke="#2563eb" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="100" y1="100" x2="100" y2="22" stroke="transparent" strokeWidth="18" />
        {onChange && <circle cx="100" cy="24" r="5" fill="#2563eb" />}
      </g>
      <circle cx="100" cy="100" r="5" className="fill-fg" />
    </svg>
  );
}

export default function TeachingClock({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [o, setO] = usePersistentState<Opts>("teaching-clock:v1", { ring: true, words: true, level: "quarters" }, isOpts);
  const [mode, setMode] = useState<Mode>("free");
  const [total, setTotal] = useState(10 * 60 + 10);
  const [task, setTask] = useState<{ answer: number; options: number[]; picked: number | null; checked: boolean | null } | null>(null);
  const [score, setScore] = useState({ right: 0, all: 0 });
  const stage = useStage();

  const newTask = (m: Mode, level: Level = o.level) => {
    const answer = randomTime(level);
    setTask({ answer, options: makeOptions(answer, level), picked: null, checked: null });
    if (m === "set") setTotal(0);
  };
  const changeMode = (m: Mode) => {
    setMode(m);
    if (m === "free") setTask(null);
    else newTask(m);
  };
  const setLevel = (level: Level) => {
    setO({ ...o, level });
    if (mode !== "free") newTask(mode, level);
  };
  const toNow = () => {
    const d = new Date();
    setTotal(d.getHours() * 60 + d.getMinutes());
  };
  const shift = (d: number) => setTotal((x) => (((x + d) % 1440) + 1440) % 1440);

  const h = Math.floor(total / 60);
  const m = total % 60;
  const words = (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="tabular-nums text-4xl font-bold tracking-tight sm:text-5xl">{locale === "ru" ? digits(h, m, false) : digits(h, m, true)}</span>
      {o.words && (
        <>
          <span className="text-xl font-semibold text-accent sm:text-2xl">
            {spoken(locale, total)}
            {locale === "ru" && h !== 0 && h !== 12 && m !== 0 ? ` ${ruDayPart(h)}` : ""}
          </span>
          {locale === "ru" && <span className="text-sm text-fg-3">{ruOfficial(h, m)}</span>}
        </>
      )}
    </div>
  );

  const answer = (x: number) => `${spoken(locale, x)} (${label12(x)})`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented wrap label={t.mode} value={mode} onChange={changeMode} options={(["free", "read", "set"] as Mode[]).map((v) => ({ value: v, label: t.modes[v] }))} />
        <Button variant="primary" onClick={stage.enter} title={t.full}>
          <Maximize aria-hidden />
          <span className="max-sm:sr-only">{t.full}</span>
        </Button>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="flex justify-center">
          <Dial total={mode === "read" && task ? task.answer : total} ring={o.ring} t={t} onChange={mode === "read" ? undefined : setTotal} />
        </div>

        <div className="flex flex-col gap-5">
          {mode === "free" && (
            <>
              {words}
              <div className="grid grid-cols-4 gap-2">
                <Button onClick={() => shift(-60)} aria-label={t.hourBack} title={t.hourBack}>
                  <Minus aria-hidden />1 {locale === "ru" ? "ч" : "h"}
                </Button>
                <Button onClick={() => shift(-5)} aria-label={t.minBack} title={t.minBack}>
                  <Minus aria-hidden />5 {locale === "ru" ? "мин" : "min"}
                </Button>
                <Button onClick={() => shift(5)} aria-label={t.minFwd} title={t.minFwd}>
                  <Plus aria-hidden />5 {locale === "ru" ? "мин" : "min"}
                </Button>
                <Button onClick={() => shift(60)} aria-label={t.hourFwd} title={t.hourFwd}>
                  <Plus aria-hidden />1 {locale === "ru" ? "ч" : "h"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={toNow}>
                  <Clock aria-hidden />
                  {t.now}
                </Button>
                <Button variant="outline" onClick={() => setTotal(randomInt(720 / LEVEL_STEP[o.level]) * LEVEL_STEP[o.level] + (total >= 720 ? 720 : 0))}>
                  <Shuffle aria-hidden />
                  {t.random}
                </Button>
              </div>
              <p className="text-sm text-fg-3">{t.drag}</p>
            </>
          )}

          {mode === "read" && task && (
            <div className="flex flex-col gap-3">
              <p className="text-lg font-semibold">{t.question}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {task.options.map((x) => {
                  const picked = task.picked === x;
                  const isRight = x === task.answer;
                  return (
                    <button
                      key={x}
                      type="button"
                      disabled={task.picked !== null}
                      onClick={() => {
                        setTask({ ...task, picked: x });
                        setScore((s) => ({ right: s.right + (isRight ? 1 : 0), all: s.all + 1 }));
                      }}
                      className={cn(
                        "flex min-h-14 items-center justify-between gap-2 rounded-[0.75rem] border px-4 py-2 text-left font-medium transition-colors",
                        task.picked === null && "border-line bg-surface hover:border-accent",
                        task.picked !== null && isRight && "border-ok bg-ok-soft text-ok",
                        picked && !isRight && "border-err bg-err-soft text-err",
                        task.picked !== null && !isRight && !picked && "border-line opacity-60",
                      )}
                    >
                      <span>{o.words ? answer(x) : label12(x)}</span>
                      {task.picked !== null && isRight && <Check className="size-5 shrink-0" aria-hidden />}
                      {picked && !isRight && <X className="size-5 shrink-0" aria-hidden />}
                    </button>
                  );
                })}
              </div>
              {task.picked !== null && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className={cn("font-semibold", task.picked === task.answer ? "text-ok" : "text-err")} role="status">
                    {task.picked === task.answer ? t.right : t.wrong(answer(task.answer))}
                  </span>
                  <Button variant="primary" onClick={() => newTask("read")}>
                    {t.next}
                  </Button>
                </div>
              )}
            </div>
          )}

          {mode === "set" && task && (
            <div className="flex flex-col gap-3">
              <p className="text-lg">
                {t.setTask} <b className="text-accent">{spoken(locale, task.answer)}</b>
                {!o.words && <span className="text-fg-3"> ({label12(task.answer)})</span>}
              </p>
              <p className="text-sm text-fg-3">{t.drag}</p>
              <div className="flex flex-wrap items-center gap-3">
                {task.checked === null ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const ok = total % 720 === task.answer;
                      setTask({ ...task, checked: ok });
                      setScore((s) => ({ right: s.right + (ok ? 1 : 0), all: s.all + 1 }));
                    }}
                  >
                    <Check aria-hidden />
                    {t.check}
                  </Button>
                ) : (
                  <>
                    <span className={cn("font-semibold", task.checked ? "text-ok" : "text-err")} role="status">
                      {task.checked ? t.right : t.wrong(label12(task.answer))}
                    </span>
                    <Button variant="primary" onClick={() => newTask("set")}>
                      {t.next}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {mode !== "free" && score.all > 0 && <p className="tabular-nums text-sm text-fg-2">{t.score(score.right, score.all)}</p>}

          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg-2">{t.level}</span>
              <Segmented wrap size="sm" label={t.level} value={o.level} onChange={setLevel} options={(Object.keys(LEVEL_STEP) as Level[]).map((v) => ({ value: v, label: t.levels[v] }))} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Switch label={t.minutesRing} checked={o.ring} onChange={(e) => setO({ ...o, ring: e.target.checked })} />
              <Switch label={t.words} checked={o.words} onChange={(e) => setO({ ...o, words: e.target.checked })} />
            </div>
          </div>
        </div>
      </div>

      <StageLayer stage={stage} label={t.stage} closeLabel={t.close} className="bg-bg text-fg">
        {stage.open && (
          <div className="flex size-full flex-col items-center justify-center gap-4 p-4 landscape:flex-row landscape:gap-10">
            <Dial total={mode === "read" && task ? task.answer : total} ring={o.ring} t={t} onChange={mode === "read" ? undefined : setTotal} big />
            {mode === "free" && <div className="landscape:max-w-[30vw]">{words}</div>}
          </div>
        )}
      </StageLayer>
    </div>
  );
}
