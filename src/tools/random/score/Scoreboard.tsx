"use client";

import { ArrowLeftRight, Maximize, Minus, Pause, Play, Plus, Pointer, RotateCcw, TimerReset, Trophy, Undo2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button, IconButton } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input, Switch } from "@/ui/field";
import Link from "@/ui/link";
import { NumberInput } from "@/ui/number-input";
import { Kbd } from "@/ui/panel";
import { ScrollRow } from "@/ui/scroll-row";
import { Segmented } from "@/ui/segmented";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import {
  addScore,
  CLOCK_MAX_MIN,
  clampScore,
  clockElapsed,
  clockMs,
  clockOver,
  clockReset,
  clockToggle,
  digitsScale,
  fallbackClock,
  formatClock,
  isSport,
  matchWinner,
  setWinner,
  SPORT_LIST,
  SPORTS,
  sportClock,
  STEP_SETS,
  tableTennisServer,
  type ClockDir,
  type GameClock,
  type Pair,
  type Side,
  type Sport,
} from "./lib/score";
import { isBoard, THEME_IDS, type Board, type Theme } from "./lib/state";
import { useSound } from "./ui/sound";

const T = {
  ru: {
    title: "Название (необязательно)",
    titlePh: "Например, финал",
    name: "Название команды",
    add: (n: number) => `Добавить ${n}`,
    sub: "Отнять 1",
    swap: "Поменять стороны",
    undo: "Отменить",
    reset: "Сбросить счёт",
    newMatch: "Новый матч",
    full: "На весь экран",
    sport: "Вид спорта",
    buttons: "Кнопки",
    theme: "Цвета",
    themes: {
      redblue: "Красный и синий",
      led: "Светодиодное табло",
      mono: "Тёмное",
      light: "Светлое",
    },
    showSmall: (label: string) => `Показывать: ${label.toLowerCase()}`,
    serve: "Подаёт",
    setServe: "Подача у этой стороны",
    setWin: (who: string, game: boolean) => `${who} выигрывает ${game ? "гейм" : "партию"}`,
    nextSet: (game: boolean) => (game ? "Следующий гейм" : "Следующая партия"),
    matchWin: (who: string) => `${who} — победа в матче!`,
    copy: "Копировать счёт",
    copied: "Скопировано",
    left: "левая команда",
    right: "правая",
    stage: "Табло на весь экран",
    close: "Закрыть",
    tapHint: (n: number) => `Нажмите на счёт: +${n}`,
    clock: "Время матча",
    minutes: "Минут",
    clockDir: "Отсчёт",
    start: "Запустить время",
    pause: "Остановить время",
    clockReset: "Сбросить время",
    clockKey: "время",
    live: (a: string, x: number, b: string, y: number) => `${a} ${x}, ${b} ${y}`,
  },
  en: {
    title: "Title (optional)",
    titlePh: "E.g. Final",
    name: "Team name",
    add: (n: number) => `Add ${n}`,
    sub: "Subtract 1",
    swap: "Swap sides",
    undo: "Undo",
    reset: "Reset score",
    newMatch: "New match",
    full: "Full screen",
    sport: "Sport",
    buttons: "Buttons",
    theme: "Colours",
    themes: {
      redblue: "Red and blue",
      led: "LED board",
      mono: "Dark",
      light: "Light",
    },
    showSmall: (label: string) => `Show ${label.toLowerCase()}`,
    serve: "Serving",
    setServe: "This side serves",
    setWin: (who: string, game: boolean) => `${who} wins the ${game ? "game" : "set"}`,
    nextSet: (game: boolean) => (game ? "Next game" : "Next set"),
    matchWin: (who: string) => `${who} wins the match!`,
    copy: "Copy score",
    copied: "Copied",
    left: "left team",
    right: "right",
    stage: "Full-screen scoreboard",
    close: "Close",
    tapHint: (n: number) => `Tap the score: +${n}`,
    clock: "Game clock",
    minutes: "Minutes",
    clockDir: "Counts",
    start: "Start the clock",
    pause: "Stop the clock",
    clockReset: "Reset the clock",
    clockKey: "clock",
    live: (a: string, x: number, b: string, y: number) => `${a} ${x}, ${b} ${y}`,
  },
} as const;

type Strings = (typeof T)[Locale];

/** Colours follow the team, not the side: index 0 / 1 = first / second team. */
const THEMES: Record<Theme, { bg: [string, string]; fg: [string, string]; dark: boolean; led?: boolean }> = {
  redblue: {
    bg: ["#c62828", "#1f4fbf"],
    fg: ["#ffffff", "#ffffff"],
    dark: true,
  },
  led: {
    bg: ["#070707", "#070707"],
    fg: ["#ffcf24", "#ff5040"],
    dark: true,
    led: true,
  },
  mono: { bg: ["#141414", "#202020"], fg: ["#ffffff", "#ffffff"], dark: true },
  light: {
    bg: ["#ffffff", "#eef1f5"],
    fg: ["#111418", "#111418"],
    dark: false,
  },
};

const fresh = (sport: Sport): Board => ({
  title: "",
  names: ["", ""],
  scores: [0, 0],
  small: [0, 0],
  period: 1,
  serve: SPORTS[sport].serve ? 0 : null,
  theme: "redblue",
  showSmall: SPORTS[sport].small !== null && sport !== "default",
  flip: false,
});

const isBool = (v: unknown): v is boolean => typeof v === "boolean";
const stepsKey = (s: readonly number[]) => s.join("-");

const vibrate = (ms: number | number[] = 12) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
};

export default function Scoreboard({ locale, sport: sportProp = "default" }: { locale: Locale; sport?: string }) {
  const t = T[locale];
  const sport: Sport = isSport(sportProp) ? sportProp : "default";
  const cfg = SPORTS[sport];
  const [board, setBoard] = usePersistentState<Board>(`scoreboard:v1:${sport}`, fresh(sport), isBoard);
  const [hintDone, setHintDone] = usePersistentState<boolean>("scoreboard:hint:v1", false, isBool);
  const [past, setPast] = useState<Board[]>([]);
  const stage = useStage();
  const { play: playSound, prime: primeSound } = useSound();

  const names: [string, string] = [board.names[0].trim() || cfg.names[locale][0], board.names[1].trim() || cfg.names[locale][1]];
  const steps = sport === "default" && board.steps ? board.steps : cfg.steps;
  const clock: GameClock | null = board.clock === undefined ? sportClock(sport) : board.clock;
  const game = sport === "badminton";
  const won = setWinner(sport, board.scores, board.small[0] + board.small[1]);
  const champion = matchWinner(sport, board.small);
  const serving: Side | null = board.serve === null ? null : cfg.serve === "two" ? tableTennisServer(board.scores, board.serve) : board.serve;

  const commit = (next: Board) => {
    setPast((p) => [...p.slice(-199), board]);
    setBoard(next);
  };
  // Undo brings back the game (score, sets, period, serve, sides), never the settings or the running clock.
  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setBoard({ ...board, names: prev.names, scores: prev.scores, small: prev.small, period: prev.period, serve: prev.serve, flip: prev.flip });
  };

  const score = (i: Side, delta: number) => {
    if (delta > 0 && (won !== null || champion !== null)) return; // finish the set first
    const scores = addScore(board.scores, i, delta);
    if (scores[i] === board.scores[i]) return;
    vibrate();
    if (delta > 0 && !hintDone) setHintDone(true);
    commit({
      ...board,
      scores,
      serve: cfg.serve === "rally" && delta > 0 ? i : board.serve,
    });
  };
  const smallAdd = (i: Side, delta: number) => {
    const small: Pair = [board.small[0], board.small[1]];
    small[i] = Math.min(99, Math.max(0, small[i] + delta));
    commit({ ...board, small });
  };
  const period = (delta: number) =>
    commit({
      ...board,
      period: Math.min(cfg.periods, Math.max(1, board.period + delta)),
    });
  const swap = () =>
    commit({
      ...board,
      names: [board.names[1], board.names[0]],
      scores: [board.scores[1], board.scores[0]],
      small: [board.small[1], board.small[0]],
      serve: board.serve === null ? null : ((1 - board.serve) as Side),
      flip: !board.flip,
    });
  const setServe = (i: Side) => {
    if (cfg.serve === "two")
      commit({
        ...board,
        serve: tableTennisServer(board.scores, 0) === i ? 0 : 1,
      });
    else commit({ ...board, serve: i });
  };
  const nextSet = () => {
    if (won === null) return;
    const small: Pair = [board.small[0], board.small[1]];
    small[won] += 1;
    // Table tennis: the first serve alternates between games; badminton/volleyball: the winner serves.
    const serve: Side | null = board.serve === null ? null : cfg.serve === "two" ? ((1 - board.serve) as Side) : won;
    commit({ ...board, scores: [0, 0], small, serve });
  };
  const reset = () =>
    commit({
      ...board,
      scores: [0, 0],
      small: [0, 0],
      period: 1,
      serve: cfg.serve ? 0 : null,
      clock: clock ? clockReset(clock) : board.clock,
    });

  /* ── game clock ── */
  const setClock = (c: GameClock | null) => setBoard({ ...board, clock: c });
  const toggleClock = () => {
    if (!clock) return;
    primeSound(); // the buzzer at 0 plays without a tap: unlock audio now
    setClock(clockToggle(clock, Date.now()));
  };
  const resetClock = () => clock && setClock(clockReset(clock));

  // Stop the clock and sound the buzzer when the period runs out (also right after a reload, if it ran out meanwhile).
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  });
  const clockKey = clock?.running ? `${clock.startedAt}|${clock.baseMs}|${clock.lengthMs}` : "";
  useEffect(() => {
    if (!clockKey) return;
    let id = 0;
    const arm = () => {
      const b = boardRef.current;
      const c = b.clock === undefined ? sportClock(sport) : b.clock;
      if (!c || !c.running) return;
      const now = Date.now();
      if (!clockOver(c, now)) {
        id = window.setTimeout(arm, c.lengthMs - clockElapsed(c, now) + 20);
        return;
      }
      setBoard({ ...b, clock: { ...c, running: false, baseMs: c.lengthMs, startedAt: null } });
      playSound("end");
      vibrate([300, 120, 300]);
    };
    arm();
    return () => window.clearTimeout(id);
  }, [clockKey, sport, setBoard, playSound]);

  const resultText = () => {
    const sets = cfg.small && board.showSmall ? ` (${cfg.small[locale].toLowerCase()} ${board.small[0]}:${board.small[1]})` : "";
    return `${board.title.trim() ? `${board.title.trim()}: ` : ""}${names[0]} ${board.scores[0]} : ${board.scores[1]} ${names[1]}${sets}`;
  };

  // Shortcuts by physical key (work in any keyboard layout): Q/A left +/−, P/L right +/−, S swap, Z undo,
  // F full screen, Space starts/stops the clock in full screen.
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyRef.current = (e) => {
      if (e.altKey || typingTarget(e)) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const map: Record<string, () => void> = {
        KeyQ: () => score(0, steps[0]),
        KeyA: () => score(0, -1),
        KeyP: () => score(1, steps[0]),
        KeyL: () => score(1, -1),
        KeyS: swap,
        KeyZ: undo,
        KeyF: () => !stage.open && stage.enter(),
      };
      if (stage.open && clock) map.Space = toggleClock;
      const fn = map[e.code];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const theme = THEMES[board.theme];
  const halfProps = (i: Side): HalfProps => {
    const c = board.flip ? 1 - i : i;
    return {
      side: i,
      name: board.names[i],
      shown: names[i],
      placeholder: cfg.names[locale][i],
      score: board.scores[i],
      small: cfg.small && board.showSmall ? { label: cfg.small[locale], value: board.small[i] } : null,
      steps,
      serving: serving === i,
      canServe: cfg.serve !== null,
      hint: !hintDone,
      bg: theme.bg[c],
      fg: theme.fg[c],
      led: !!theme.led,
      t,
      onScore: (d) => score(i, d),
      onSmall: (d) => smallAdd(i, d),
      onServe: () => setServe(i),
      onName: (v) =>
        setBoard({
          ...board,
          names: (i === 0 ? [v, board.names[1]] : [board.names[0], v]) as [string, string],
        }),
    };
  };

  const banner =
    champion !== null ? (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1rem] bg-ok-soft px-4 py-3 text-center text-ok">
        <Trophy className="size-5" aria-hidden />
        <span className="font-semibold">{t.matchWin(names[champion])}</span>
        <Button
          size="sm"
          variant="filled"
          onClick={() =>
            commit({
              ...fresh(sport),
              title: board.title,
              names: board.names,
              theme: board.theme,
              showSmall: board.showSmall,
              flip: board.flip,
              steps: board.steps,
              clock: clock ? clockReset(clock) : board.clock,
            })
          }
        >
          {t.newMatch}
        </Button>
      </div>
    ) : won !== null ? (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1rem] bg-ok-soft px-4 py-3 text-center text-ok">
        <Trophy className="size-5" aria-hidden />
        <span className="font-semibold">{t.setWin(names[won], game)}</span>
        <Button size="sm" variant="filled" onClick={nextSet}>
          {t.nextSet(game)}
        </Button>
      </div>
    ) : null;

  /** Period and game clock: a dark strip under the board, the middle of the full-screen view. */
  const center = (big: boolean) => {
    const ctl = cn("flex shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-95 disabled:opacity-35", big ? "size-[clamp(2.75rem,8vmin,4.5rem)]" : "size-10 pointer-coarse:size-11");
    const icon = big ? "size-[45%]" : "size-5";
    return (
      <>
        {cfg.period && (
          <div className="flex flex-col items-center gap-1">
            <span className={cn("font-medium text-white/75", big ? "[font-size:clamp(0.875rem,2.6vmin,1.75rem)]" : "text-[0.8125rem]")}>{cfg.period[locale]}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => period(-1)} disabled={board.period <= 1} aria-label={`${cfg.period[locale]} −1`} className={ctl}>
                <Minus className={icon} aria-hidden />
              </button>
              <span className={cn("tabular-nums min-w-[1.5ch] text-center font-bold leading-none", big ? "[font-size:clamp(1.75rem,7vmin,4.5rem)]" : "text-3xl")}>{board.period}</span>
              <button type="button" onClick={() => period(1)} disabled={board.period >= cfg.periods} aria-label={`${cfg.period[locale]} +1`} className={ctl}>
                <Plus className={icon} aria-hidden />
              </button>
            </div>
          </div>
        )}
        {clock && (
          <div className="flex flex-col items-center gap-1">
            <ClockFace clock={clock} className={big ? "[font-size:clamp(2.25rem,11vmin,8rem)] landscape:[font-size:clamp(1.75rem,min(11vmin,5.6vw),8rem)]" : "text-[2.5rem]"} />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleClock}
                aria-label={clock.running ? t.pause : t.start}
                title={clock.running ? t.pause : t.start}
                className={cn(ctl, clock.running ? "bg-white/15" : "bg-[#ffcf24]! text-black hover:bg-[#ffd84d]!")}
              >
                {clock.running ? <Pause className={icon} aria-hidden /> : <Play className={cn(icon, "translate-x-[6%]")} aria-hidden />}
              </button>
              <button type="button" onClick={resetClock} disabled={clockElapsed(clock, 0) === 0 && !clock.running} aria-label={t.clockReset} title={t.clockReset} className={ctl}>
                <TimerReset className={icon} aria-hidden />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };
  const hasCenter = !!cfg.period || !!clock;

  const stepSets = STEP_SETS.map((s) => ({ value: stepsKey(s), label: s.map((n) => `+${n}`).join(" ") }));

  return (
    <div className="flex flex-col gap-4">
      <ScrollRow label={t.sport} rowClassName="gap-2">
        {SPORT_LIST.map((id) => (
          <Link key={id} href={href(locale, id === "default" ? ["scoreboard"] : ["scoreboard", id])} aria-current={id === sport ? "page" : undefined} className="chip shrink-0">
            <span aria-hidden>{SPORTS[id].emoji}</span>
            {SPORTS[id].label[locale]}
          </Link>
        ))}
      </ScrollRow>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t.title}
          placeholder={t.titlePh}
          value={board.title}
          maxLength={60}
          onChange={(e) => setBoard({ ...board, title: e.target.value })}
          className="min-w-0 flex-1 basis-40 font-semibold"
        />
        <div className="flex items-center gap-1">
          <IconButton label={t.undo} icon={<Undo2 aria-hidden />} onClick={undo} disabled={past.length === 0} />
          <IconButton label={t.swap} icon={<ArrowLeftRight aria-hidden />} onClick={swap} />
          <IconButton label={t.reset} icon={<RotateCcw aria-hidden />} onClick={reset} />
          <Button variant="filled" onClick={stage.enter}>
            <Maximize aria-hidden />
            {t.full}
          </Button>
        </div>
      </div>

      {banner}

      <div className="overflow-hidden rounded-[1.25rem] shadow-elev-2">
        <div className="grid grid-cols-2">
          <Half {...halfProps(0)} big={false} />
          <Half {...halfProps(1)} big={false} />
        </div>
        {hasCenter && <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-3 bg-[#111216] px-3 py-3 text-white">{center(false)}</div>}
      </div>
      <p className="sr-only" aria-live="polite">
        {t.live(names[0], board.scores[0], names[1], board.scores[1])}
      </p>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        {sport === "default" && (
          <Field label={t.buttons}>
            <Segmented label={t.buttons} value={stepsKey(steps)} onChange={(v) => setBoard({ ...board, steps: v.split("-").map(Number) })} options={stepSets} />
          </Field>
        )}
        <Field label={t.theme}>
          <div role="radiogroup" aria-label={t.theme} className="flex h-10 items-center gap-2 pointer-coarse:h-11">
            {THEME_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={board.theme === id}
                aria-label={t.themes[id]}
                title={t.themes[id]}
                onClick={() => setBoard({ ...board, theme: id })}
                className={cn(
                  "flex size-9 overflow-hidden rounded-full border border-line-strong transition-transform hover:scale-105 pointer-coarse:size-10",
                  board.theme === id && "ring-3 ring-accent ring-offset-2 ring-offset-bg",
                )}
              >
                {[0, 1].map((k) => (
                  <span key={k} className="h-full w-1/2" style={{ background: THEMES[id].bg[k] }}>
                    <span className="block size-full" style={{ background: `radial-gradient(circle, ${THEMES[id].fg[k]} 22%, transparent 24%)` }} />
                  </span>
                ))}
              </button>
            ))}
          </div>
        </Field>
        {cfg.small && <Switch label={t.showSmall(cfg.small[locale])} checked={board.showSmall} onChange={(e) => setBoard({ ...board, showSmall: e.target.checked })} />}
        <Switch label={t.clock} checked={!!clock} onChange={(e) => setClock(e.target.checked ? fallbackClock(sport) : null)} />
        {clock && (
          <>
            <Field label={t.minutes} htmlFor="sb-clock-min" className="w-36">
              <NumberInput
                id="sb-clock-min"
                locale={locale}
                min={1}
                max={CLOCK_MAX_MIN}
                value={Math.round(clock.lengthMs / 60_000)}
                onChange={(v) => v !== null && v >= 1 && setClock({ ...clock, lengthMs: Math.min(CLOCK_MAX_MIN, Math.round(v)) * 60_000 })}
              />
            </Field>
            <Field label={t.clockDir}>
              <Segmented
                label={t.clockDir}
                value={clock.dir}
                onChange={(d: ClockDir) => setClock({ ...clock, dir: d })}
                options={[
                  { value: "down", label: `${formatClock(clock.lengthMs, "up")} → 0` },
                  { value: "up", label: `0 → ${formatClock(clock.lengthMs, "up")}` },
                ]}
              />
            </Field>
          </>
        )}
        <CopyButton value={resultText} label={t.copy} copiedLabel={t.copied} variant="ghost" compact className="mb-0.5" />
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
        <span>
          <Kbd>Q</Kbd> <Kbd>A</Kbd> {t.left}
        </span>
        <span>
          <Kbd>P</Kbd> <Kbd>L</Kbd> {t.right}
        </span>
        <span>
          <Kbd>S</Kbd> {t.swap.toLowerCase()}
        </span>
        <span>
          <Kbd>Z</Kbd> {t.undo.toLowerCase()}
        </span>
        <span>
          <Kbd>F</Kbd> {t.full.toLowerCase()}
        </span>
        {clock && (
          <span>
            <Kbd>Space</Kbd> {t.clockKey}
          </span>
        )}
      </p>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        dark={theme.dark}
        bar={
          <>
            <button type="button" onClick={undo} disabled={past.length === 0} aria-label={t.undo} title={t.undo} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40">
              <Undo2 className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={swap} aria-label={t.swap} title={t.swap} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10">
              <ArrowLeftRight className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={reset} aria-label={t.reset} title={t.reset} className="flex size-10 items-center justify-center rounded-full hover:bg-black/10">
              <RotateCcw className="size-5" aria-hidden />
            </button>
          </>
        }
        style={{ background: theme.bg[0] }}
      >
        {stage.open && (
          <div className="flex size-full flex-col landscape:flex-row">
            <Half {...halfProps(0)} big />
            {(hasCenter || board.title.trim() || banner) && (
              <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-[5vmin] gap-y-2 bg-[#111216] px-3 py-2 text-white landscape:w-[clamp(9rem,20vw,30rem)] landscape:flex-col landscape:flex-nowrap landscape:gap-y-[4vmin] landscape:py-16">
                {board.title.trim() && <span className="max-w-full truncate text-center font-semibold [font-size:clamp(1rem,3.5vmin,2.5rem)] landscape:whitespace-normal">{board.title.trim()}</span>}
                {center(true)}
                {banner && <div className="max-w-full text-base">{banner}</div>}
              </div>
            )}
            <Half {...halfProps(1)} big />
          </div>
        )}
      </StageLayer>
    </div>
  );
}

/** The clock's digits; ticks by itself while running (only this element re-renders). */
function ClockFace({ clock, className }: { clock: GameClock; className?: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!clock.running) return;
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(id);
    };
  }, [clock.running]);
  const at = clock.running ? Math.max(now, clock.startedAt ?? 0) : 0;
  const over = clockOver(clock, at);
  return (
    <span
      role="timer"
      className={cn("tabular-nums font-mono font-bold leading-none tracking-tight transition-opacity", !clock.running && !over && clockElapsed(clock, at) > 0 && "opacity-70", className)}
      style={{ color: over ? "#ff5a4f" : "#ffcf24", textShadow: "0 0 0.12em color-mix(in srgb, currentColor 40%, transparent)" }}
    >
      {formatClock(clockMs(clock, at), clock.dir)}
    </span>
  );
}

interface HalfProps {
  side: Side;
  name: string;
  shown: string;
  placeholder: string;
  score: number;
  small: { label: string; value: number } | null;
  steps: readonly number[];
  serving: boolean;
  canServe: boolean;
  hint: boolean;
  bg: string;
  fg: string;
  led: boolean;
  t: Strings;
  onScore: (delta: number) => void;
  onSmall: (delta: number) => void;
  onServe: () => void;
  onName: (v: string) => void;
}

/** One team: name, the big number (tap +, swipe down −), a row of score buttons and the small counter. */
/** True for a light colour ("#ffffff", "#fde047"): a light team colour gets a light veil, a dark one a dark veil. */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}

function Half({ big, side, name, shown, placeholder, score, small, steps, serving, canServe, hint, bg, fg, led, t, onScore, onSmall, onServe, onName }: HalfProps & { big: boolean }) {
  const startY = useRef<number | null>(null);
  const swiped = useRef(false);
  // Full screen fills the half: the scale is tighter so 3–4 digits still fit in the wider font size.
  const len = String(score).length;
  const k = big ? (len <= 2 ? 1 : len === 3 ? 0.7 : len === 4 ? 0.52 : 0.42) : digitsScale(score);
  const digits: CSSProperties = {
    ["--k" as string]: k,
    color: fg,
    textShadow: led ? "0 0 0.06em currentColor, 0 0 0.2em color-mix(in srgb, currentColor 45%, transparent)" : undefined,
  };
  // Buttons on the team colour: "+N" filled with the text colour (the main action), "−1" a tinted outline.
  const filled: CSSProperties = { background: fg, color: bg };
  const tonal: CSSProperties = { color: fg, background: `color-mix(in srgb, ${fg} 14%, transparent)`, boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${fg} 45%, transparent)` };
  const btn = cn(
    "tabular-nums flex min-w-0 items-center justify-center rounded-full font-bold transition-[transform,filter] hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:active:scale-100",
    big ? "h-[clamp(3.25rem,11vmin,6.5rem)] [font-size:clamp(1.25rem,5vmin,3rem)]" : "h-11 text-lg pointer-coarse:h-12",
  );
  const small40 = cn("flex shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-35", big ? "size-[clamp(2.5rem,7vmin,4rem)]" : "size-10 pointer-coarse:size-11");
  const cols = steps.length + 1;

  return (
    <section
      aria-label={shown}
      className={cn(
        "@container relative flex min-w-0 flex-col items-center",
        big ? "min-h-0 flex-1 justify-between gap-[1.5vmin] px-[2.5vmin] pb-[max(2.5vmin,env(safe-area-inset-bottom))] pt-[2vmin] first:pt-16 landscape:pt-16" : "gap-2 px-2 pb-3 pt-3 sm:px-4",
      )}
      style={{ background: bg, color: fg }}
    >
      <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
        {canServe && (
          <button
            type="button"
            onClick={onServe}
            aria-pressed={serving}
            aria-label={serving ? t.serve : t.setServe}
            title={serving ? t.serve : t.setServe}
            className={cn("flex shrink-0 items-center justify-center rounded-full", big ? "size-12" : "size-9 pointer-coarse:size-10")}
          >
            <span className={cn("rounded-full transition-opacity", big ? "size-4" : "size-3", serving ? "opacity-100" : "opacity-25")} style={{ background: fg }} />
          </button>
        )}
        {big ? (
          <span className="min-w-0 truncate text-center font-semibold [font-size:clamp(1.125rem,4vmin,3.5rem)]">{shown}</span>
        ) : (
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder={placeholder}
            aria-label={`${t.name} ${side + 1}`}
            maxLength={30}
            className="w-full min-w-0 rounded-[0.5rem] bg-transparent px-1 py-1 text-center font-semibold outline-none placeholder:text-(--ph) focus:ring-2"
            style={{ color: fg, ["--ph" as string]: `color-mix(in srgb, ${fg} 85%, transparent)`, ["--tw-ring-color" as string]: `color-mix(in srgb, ${fg} 50%, transparent)` }}
          />
        )}
      </div>

      <div className={cn("flex w-full items-center justify-center", big && "min-h-0 flex-1 [container-type:size]")}>
        <button
          type="button"
          aria-label={`${shown}: ${score}. ${t.add(steps[0])}`}
          onPointerDown={(e) => {
            startY.current = e.clientY;
            swiped.current = false;
          }}
          onPointerUp={(e) => {
            if (startY.current === null) return;
            const dy = e.clientY - startY.current;
            startY.current = null;
            if (Math.abs(dy) > 40) {
              swiped.current = true;
              onScore(dy > 0 ? -1 : steps[0]);
            }
          }}
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            onScore(steps[0]);
          }}
          className={cn(
            "tabular-nums flex w-full touch-none items-center justify-center rounded-[1rem] font-bold leading-none tracking-tight transition-transform active:scale-[0.97]",
            big ? "h-full [font-size:calc(min(82cqh,66cqw)*var(--k))]" : "py-1 [font-size:calc(min(56cqw,12.5rem)*var(--k))]",
            led && "font-mono",
          )}
          style={digits}
        >
          {score}
        </button>
      </div>

      {hint && (
        <span
          className={cn("pointer-events-none inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 font-semibold", big ? "[font-size:clamp(0.875rem,2.6vmin,1.5rem)]" : "text-[0.8125rem] sm:text-sm")}
          // A veil darker (or lighter) than the team colour keeps the hint readable on any theme.
          style={{ background: isLight(bg) ? "rgb(255 255 255 / 0.72)" : "rgb(0 0 0 / 0.38)" }}
        >
          <Pointer className="size-[1.1em] shrink-0" aria-hidden />
          <span className="min-w-0 truncate">{t.tapHint(steps[0])}</span>
        </span>
      )}

      <div
        className={cn("grid w-full gap-2", big ? "max-w-[44rem] gap-[1.5vmin]" : cols > 3 ? "grid-cols-2 @min-[17rem]:grid-cols-4" : "max-w-[24rem]")}
        style={big || cols <= 3 ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
      >
        <button type="button" onClick={() => onScore(-1)} disabled={score === 0} aria-label={`${shown}: ${t.sub}`} title={t.sub} className={btn} style={tonal}>
          −1
        </button>
        {steps.map((s) => (
          <button key={s} type="button" onClick={() => onScore(s)} aria-label={`${shown}: ${t.add(s)}`} className={cn(btn, "shadow-[0_2px_6px_rgba(0,0,0,0.22)]")} style={filled}>
            +{s}
          </button>
        ))}
      </div>

      {small && <SmallCounter big={big} label={small.label} value={small.value} cls={small40} tonal={tonal} onSmall={onSmall} />}
    </section>
  );
}

function SmallCounter({ big, label, value, cls, tonal, onSmall }: { big: boolean; label: string; value: number; cls: string; tonal: CSSProperties; onSmall: (d: number) => void }): ReactNode {
  return (
    <div className={cn("flex items-center gap-2", big ? "[font-size:clamp(1rem,3vmin,1.75rem)]" : "text-sm")}>
      <span className="font-medium">{label}</span>
      <button type="button" onClick={() => onSmall(-1)} disabled={value === 0} aria-label={`${label} −1`} className={cls} style={tonal}>
        <Minus className="size-[45%]" aria-hidden />
      </button>
      <span className={cn("tabular-nums min-w-[1.5ch] text-center font-bold", big ? "[font-size:clamp(1.5rem,5vmin,3rem)]" : "text-xl")}>{clampScore(value)}</span>
      <button type="button" onClick={() => onSmall(1)} aria-label={`${label} +1`} className={cls} style={tonal}>
        <Plus className="size-[45%]" aria-hidden />
      </button>
    </div>
  );
}
