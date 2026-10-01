"use client";

import { ArrowLeftRight, Maximize, Minus, Plus, RotateCcw, Trophy, Undo2 } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { usePersistentState } from "@/lib/persist";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Input, Switch } from "@/ui/field";
import { Kbd } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { addScore, clampScore, digitsScale, isSport, matchWinner, setWinner, SPORTS, tableTennisServer, type Pair, type Side, type Sport } from "./lib/score";

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
    keys: "Клавиши",
    left: "левая команда",
    right: "правая",
    stage: "Табло на весь экран",
    close: "Закрыть",
    hint: "Нажмите на число, чтобы добавить очко. Провести вниз — отнять.",
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
    keys: "Keys",
    left: "left team",
    right: "right",
    stage: "Full-screen scoreboard",
    close: "Close",
    hint: "Tap a number to add a point. Swipe down to take one off.",
    live: (a: string, x: number, b: string, y: number) => `${a} ${x}, ${b} ${y}`,
  },
} as const;

type Theme = "redblue" | "led" | "mono" | "light";
const THEME_IDS: Theme[] = ["redblue", "led", "mono", "light"];

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

interface Board {
  title: string;
  names: [string, string];
  scores: Pair;
  small: Pair;
  period: number;
  /** "rally": who serves now; table tennis: who served first in this game. */
  serve: Side | null;
  theme: Theme;
  showSmall: boolean;
  /** Sides were swapped an odd number of times: colours stay with the teams. */
  flip: boolean;
}

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

const isPair = (v: unknown): v is Pair => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number" && Number.isFinite(n));
const isBoard = (v: unknown): v is Board => {
  if (!v || typeof v !== "object") return false;
  const b = v as Board;
  return (
    typeof b.title === "string" &&
    Array.isArray(b.names) &&
    b.names.length === 2 &&
    b.names.every((n) => typeof n === "string") &&
    isPair(b.scores) &&
    isPair(b.small) &&
    typeof b.period === "number" &&
    (b.serve === null || b.serve === 0 || b.serve === 1) &&
    THEME_IDS.includes(b.theme) &&
    typeof b.showSmall === "boolean" &&
    typeof b.flip === "boolean"
  );
};

const vibrate = () => {
  try {
    navigator.vibrate?.(12);
  } catch {
    // not supported
  }
};

export default function Scoreboard({ locale, sport: sportProp = "default" }: { locale: Locale; sport?: string }) {
  const t = T[locale];
  const sport: Sport = isSport(sportProp) ? sportProp : "default";
  const cfg = SPORTS[sport];
  const [board, setBoard] = usePersistentState<Board>(`scoreboard:v1:${sport}`, fresh(sport), isBoard);
  const [past, setPast] = useState<Board[]>([]);
  const stage = useStage();

  const names: [string, string] = [board.names[0].trim() || cfg.names[locale][0], board.names[1].trim() || cfg.names[locale][1]];
  const game = sport === "badminton";
  const won = setWinner(sport, board.scores, board.small[0] + board.small[1]);
  const champion = matchWinner(sport, board.small);
  const serving: Side | null = board.serve === null ? null : cfg.serve === "two" ? tableTennisServer(board.scores, board.serve) : board.serve;

  const commit = (next: Board) => {
    setPast((p) => [...p.slice(-199), board]);
    setBoard(next);
  };
  const undo = () => {
    const prev = past[past.length - 1];
    if (!prev) return;
    setPast((p) => p.slice(0, -1));
    setBoard(prev);
  };

  const score = (i: Side, delta: number) => {
    if (delta > 0 && (won !== null || champion !== null)) return; // finish the set first
    const scores = addScore(board.scores, i, delta);
    if (scores[i] === board.scores[i]) return;
    vibrate();
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
    });

  const resultText = () => {
    const sets = cfg.small && board.showSmall ? ` (${cfg.small[locale].toLowerCase()} ${board.small[0]}:${board.small[1]})` : "";
    return `${board.title.trim() ? `${board.title.trim()}: ` : ""}${names[0]} ${board.scores[0]} : ${board.scores[1]} ${names[1]}${sets}`;
  };

  // Shortcuts by physical key (work in any keyboard layout): Q/A left +/−, P/L right +/−, S swap, Z undo, F full screen.
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
        KeyQ: () => score(0, cfg.steps[0]),
        KeyA: () => score(0, -1),
        KeyP: () => score(1, cfg.steps[0]),
        KeyL: () => score(1, -1),
        KeyS: swap,
        KeyZ: undo,
        KeyF: () => !stage.open && stage.enter(),
      };
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
      steps: cfg.steps,
      serving: serving === i,
      canServe: cfg.serve !== null,
      bg: theme.bg[c],
      fg: theme.fg[c],
      dark: theme.dark,
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
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[0.75rem] bg-ok-soft px-4 py-3 text-ok">
        <Trophy className="size-5" aria-hidden />
        <span className="font-semibold">{t.matchWin(names[champion])}</span>
        <Button
          size="sm"
          variant="primary"
          onClick={() =>
            commit({
              ...fresh(sport),
              title: board.title,
              names: board.names,
              theme: board.theme,
              showSmall: board.showSmall,
              flip: board.flip,
            })
          }
        >
          {t.newMatch}
        </Button>
      </div>
    ) : won !== null ? (
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-[0.75rem] bg-ok-soft px-4 py-3 text-ok">
        <Trophy className="size-5" aria-hidden />
        <span className="font-semibold">{t.setWin(names[won], game)}</span>
        <Button size="sm" variant="primary" onClick={nextSet}>
          {t.nextSet(game)}
        </Button>
      </div>
    ) : null;

  const periodControl = cfg.period && (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-medium">{cfg.period[locale]}</span>
      <button
        type="button"
        onClick={() => period(-1)}
        disabled={board.period <= 1}
        aria-label={`${cfg.period[locale]} −1`}
        className="flex size-8 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40 pointer-coarse:size-10"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="tabular-nums min-w-6 text-center text-lg font-bold">{board.period}</span>
      <button
        type="button"
        onClick={() => period(1)}
        disabled={board.period >= cfg.periods}
        aria-label={`${cfg.period[locale]} +1`}
        className="flex size-8 items-center justify-center rounded-full hover:bg-black/10 disabled:opacity-40 pointer-coarse:size-10"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
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
          <Button size="icon" variant="ghost" onClick={undo} disabled={past.length === 0} aria-label={t.undo} title={t.undo}>
            <Undo2 aria-hidden />
          </Button>
          <Button size="icon" variant="ghost" onClick={swap} aria-label={t.swap} title={t.swap}>
            <ArrowLeftRight aria-hidden />
          </Button>
          <Button size="icon" variant="ghost" onClick={reset} aria-label={t.reset} title={t.reset}>
            <RotateCcw aria-hidden />
          </Button>
          <Button variant="primary" onClick={stage.enter} title={t.full}>
            <Maximize aria-hidden />
            <span className="max-sm:sr-only">{t.full}</span>
          </Button>
        </div>
      </div>

      {banner}

      <div className="@container overflow-hidden rounded-[1rem] border border-line-strong">
        <div className="grid grid-cols-2">
          <Half {...halfProps(0)} big={false} />
          <Half {...halfProps(1)} big={false} />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {t.live(names[0], board.scores[0], names[1], board.scores[1])}
      </p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {periodControl}
        <div role="radiogroup" aria-label={t.theme} className="flex items-center gap-2">
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
                "flex size-9 overflow-hidden rounded-full border border-line-strong pointer-coarse:size-10",
                board.theme === id && "ring-3 ring-accent ring-offset-2 ring-offset-bg",
              )}
            >
              <span className="h-full w-1/2" style={{ background: THEMES[id].bg[0] }}>
                <span
                  className="block size-full"
                  style={{
                    background: `radial-gradient(circle, ${THEMES[id].fg[0]} 22%, transparent 24%)`,
                  }}
                />
              </span>
              <span className="h-full w-1/2" style={{ background: THEMES[id].bg[1] }}>
                <span
                  className="block size-full"
                  style={{
                    background: `radial-gradient(circle, ${THEMES[id].fg[1]} 22%, transparent 24%)`,
                  }}
                />
              </span>
            </button>
          ))}
        </div>
        {cfg.small && <Switch label={t.showSmall(cfg.small[locale])} checked={board.showSmall} onChange={(e) => setBoard({ ...board, showSmall: e.target.checked })} />}
        <CopyButton value={resultText} label={t.copy} copiedLabel={t.copied} variant="ghost" compact />
      </div>

      <p className="text-sm text-fg-3">{t.hint}</p>
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
      </p>

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        dark={theme.dark}
        bar={
          <>
            <button
              type="button"
              onClick={undo}
              disabled={past.length === 0}
              aria-label={t.undo}
              title={t.undo}
              className="flex size-9 items-center justify-center rounded-full disabled:opacity-40"
            >
              <Undo2 className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={swap} aria-label={t.swap} title={t.swap} className="flex size-9 items-center justify-center rounded-full">
              <ArrowLeftRight className="size-5" aria-hidden />
            </button>
            <button type="button" onClick={reset} aria-label={t.reset} title={t.reset} className="flex size-9 items-center justify-center rounded-full">
              <RotateCcw className="size-5" aria-hidden />
            </button>
          </>
        }
        style={{ background: theme.bg[0] }}
      >
        {stage.open && (
          <div className="flex size-full flex-col">
            <div className="flex min-h-0 flex-1 flex-col landscape:flex-row">
              <Half {...halfProps(0)} big />
              <Half {...halfProps(1)} big />
            </div>
            {(board.title.trim() || cfg.period || banner) && (
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 bg-black/85 px-3 py-2 text-white [padding-bottom:max(0.5rem,env(safe-area-inset-bottom))] [&_button:hover]:bg-white/15">
                {board.title.trim() && <span className="max-w-full truncate text-lg font-semibold">{board.title.trim()}</span>}
                {periodControl}
                {banner}
              </div>
            )}
          </div>
        )}
      </StageLayer>
    </div>
  );
}

interface HalfProps {
  side: Side;
  name: string;
  shown: string;
  placeholder: string;
  score: number;
  small: { label: string; value: number } | null;
  steps: number[];
  serving: boolean;
  canServe: boolean;
  bg: string;
  fg: string;
  dark: boolean;
  led: boolean;
  t: (typeof T)[Locale];
  onScore: (delta: number) => void;
  onSmall: (delta: number) => void;
  onServe: () => void;
  onName: (v: string) => void;
}

/** One team: name, the big number (tap +, swipe down −), extra step buttons and the small counter. */
function Half({
  big,
  side,
  name,
  shown,
  placeholder,
  score,
  small,
  steps,
  serving,
  canServe,
  bg,
  fg,
  dark,
  led,
  t,
  onScore,
  onSmall,
  onServe,
  onName,
}: HalfProps & { big: boolean }) {
  const startY = useRef<number | null>(null);
  const swiped = useRef(false);
  const ctl = cn("flex items-center justify-center rounded-full font-semibold tabular-nums", dark ? "bg-white/15 hover:bg-white/25" : "bg-black/[0.06] hover:bg-black/10");
  const k = digitsScale(score);
  const digits: CSSProperties = {
    ["--k" as string]: k,
    color: fg,
    textShadow: led ? "0 0 0.06em currentColor, 0 0 0.2em color-mix(in srgb, currentColor 45%, transparent)" : undefined,
  };

  return (
    <section
      aria-label={shown}
      className={cn(
        "relative flex min-w-0 flex-col items-center",
        big ? "min-h-0 flex-1 justify-between gap-2 px-3 pb-4 pt-4 first:pt-16 landscape:pt-16" : "gap-2 px-2 pb-3 pt-3",
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
            className={cn("flex shrink-0 items-center justify-center rounded-full", big ? "size-10" : "size-7 pointer-coarse:size-9")}
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
            className={cn(
              "w-full min-w-0 rounded-[0.375rem] bg-transparent px-1 py-1 text-center font-semibold outline-none focus:ring-2",
              dark ? "placeholder:text-white/80 focus:ring-white/50" : "placeholder:text-black/70 focus:ring-black/30",
            )}
            style={{ color: fg }}
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
            "tabular-nums flex w-full touch-none items-center justify-center rounded-[0.75rem] font-bold leading-none tracking-tight transition-transform active:scale-[0.97]",
            big ? "h-full [font-size:calc(min(82cqh,46cqw)*var(--k))]" : "py-1 [font-size:calc(min(28cqw,11rem)*var(--k))]",
            led && "font-mono",
          )}
          style={digits}
        >
          {score}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onScore(-1)}
          disabled={score === 0}
          aria-label={t.sub}
          title={t.sub}
          className={cn(ctl, "disabled:opacity-40", big ? "size-12 text-lg" : "size-9 pointer-coarse:size-10")}
        >
          <Minus className="size-5" aria-hidden />
        </button>
        {steps.slice(1).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScore(s)}
            aria-label={t.add(s)}
            className={cn(ctl, big ? "h-12 min-w-12 px-3 text-lg" : "h-9 min-w-9 px-2 text-sm pointer-coarse:h-10")}
          >
            +{s}
          </button>
        ))}
        {steps.length === 1 && (
          <button
            type="button"
            onClick={() => onScore(steps[0])}
            aria-label={t.add(steps[0])}
            title={t.add(steps[0])}
            className={cn(ctl, big ? "size-12" : "size-9 pointer-coarse:size-10")}
          >
            <Plus className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {small && (
        <div className={cn("flex items-center gap-1", big ? "text-lg" : "text-sm")}>
          <span className="opacity-85">{small.label}</span>
          <button
            type="button"
            onClick={() => onSmall(-1)}
            disabled={small.value === 0}
            aria-label={`${small.label} −1`}
            className={cn(ctl, "disabled:opacity-40", big ? "size-10" : "size-7 pointer-coarse:size-9")}
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <span className={cn("tabular-nums min-w-6 text-center font-bold", big ? "text-3xl" : "text-lg")}>{clampScore(small.value)}</span>
          <button type="button" onClick={() => onSmall(1)} aria-label={`${small.label} +1`} className={cn(ctl, big ? "size-10" : "size-7 pointer-coarse:size-9")}>
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </section>
  );
}
