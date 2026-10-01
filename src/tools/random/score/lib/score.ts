/* Scoreboard and counter state: pure helpers, unit-tested. */

export type Sport = "default" | "basketball" | "volleyball" | "football" | "hockey" | "table-tennis" | "badminton" | "quiz";

const SPORT_IDS: Sport[] = ["default", "basketball", "volleyball", "football", "hockey", "table-tennis", "badminton", "quiz"];

type L = { ru: string; en: string };

export type ClockDir = "down" | "up";

interface SportConfig {
  /** Short name for the sport switch (with an emoji that reads at a glance). */
  label: L;
  emoji: string;
  /** Score buttons; a tap on the big number adds the first one. */
  steps: number[];
  /** Small per-team number: sets won, games, team fouls. */
  small: L | null;
  /** Shared number in the middle: quarter, half, period, round. */
  period: L | null;
  /** Highest period offered by the − / + buttons. */
  periods: number;
  names: { ru: [string, string]; en: [string, string] };
  /** Who serves next: "rally" — whoever won the last point; "two" — table tennis (two serves each, one each from 10:10). */
  serve: "rally" | "two" | null;
  /** A set/game is won at `to` points with a lead of `by`; `cap` ends it regardless (badminton 30); `last` = deciding set. */
  win: { to: number; by: number; cap?: number; last?: number; bestOf: number } | null;
  /** Game clock offered by default: minutes per period and direction (null — off, can be switched on). */
  clock: { min: number; dir: ClockDir } | null;
}

const HOME: SportConfig["names"] = { ru: ["Хозяева", "Гости"], en: ["Home", "Guest"] };
const TEAMS: SportConfig["names"] = { ru: ["Команда 1", "Команда 2"], en: ["Team 1", "Team 2"] };
const PLAYERS: SportConfig["names"] = { ru: ["Игрок 1", "Игрок 2"], en: ["Player 1", "Player 2"] };

export const SPORTS: Record<Sport, SportConfig> = {
  default: { label: { ru: "Любая игра", en: "Any game" }, emoji: "🏆", steps: [1], small: { ru: "Сеты", en: "Sets" }, period: null, periods: 9, names: HOME, serve: null, win: null, clock: null },
  basketball: { label: { ru: "Баскетбол", en: "Basketball" }, emoji: "🏀", steps: [1, 2, 3], small: { ru: "Фолы", en: "Fouls" }, period: { ru: "Четверть", en: "Quarter" }, periods: 9, names: HOME, serve: null, win: null, clock: { min: 10, dir: "down" } },
  volleyball: { label: { ru: "Волейбол", en: "Volleyball" }, emoji: "🏐", steps: [1], small: { ru: "Партии", en: "Sets" }, period: null, periods: 5, names: TEAMS, serve: "rally", win: { to: 25, by: 2, last: 15, bestOf: 5 }, clock: null },
  football: { label: { ru: "Футбол", en: "Football" }, emoji: "⚽", steps: [1], small: null, period: { ru: "Тайм", en: "Half" }, periods: 4, names: HOME, serve: null, win: null, clock: { min: 45, dir: "up" } },
  hockey: { label: { ru: "Хоккей", en: "Hockey" }, emoji: "🏒", steps: [1], small: null, period: { ru: "Период", en: "Period" }, periods: 5, names: HOME, serve: null, win: null, clock: { min: 20, dir: "down" } },
  "table-tennis": { label: { ru: "Настольный теннис", en: "Table tennis" }, emoji: "🏓", steps: [1], small: { ru: "Партии", en: "Games" }, period: null, periods: 7, names: PLAYERS, serve: "two", win: { to: 11, by: 2, bestOf: 5 }, clock: null },
  badminton: { label: { ru: "Бадминтон", en: "Badminton" }, emoji: "🏸", steps: [1], small: { ru: "Геймы", en: "Games" }, period: null, periods: 3, names: PLAYERS, serve: "rally", win: { to: 21, by: 2, cap: 30, bestOf: 3 }, clock: null },
  quiz: { label: { ru: "Квиз", en: "Quiz" }, emoji: "💡", steps: [1, 5, 10], small: null, period: { ru: "Раунд", en: "Round" }, periods: 99, names: TEAMS, serve: null, win: null, clock: null },
};

export const SPORT_LIST: readonly Sport[] = SPORT_IDS;

export const isSport = (s: unknown): s is Sport => typeof s === "string" && (SPORT_IDS as string[]).includes(s);

const MAX_SCORE = 9999;
const MIN_COUNTER = -999999;
const MAX_COUNTER = 9999999;

export const clampScore = (n: number) => Math.max(0, Math.min(MAX_SCORE, Math.round(n)));
export const clampCounter = (n: number) => Math.max(MIN_COUNTER, Math.min(MAX_COUNTER, Math.round(n)));

export type Pair = [number, number];
export type Side = 0 | 1;

/** Add `delta` to team `i` of a pair, never below zero. */
export function addScore(pair: readonly [number, number], i: Side, delta: number): Pair {
  const out: Pair = [pair[0], pair[1]];
  out[i] = clampScore(out[i] + delta);
  return out;
}

/** Who has won the current set/game, if anyone: `to` points with a `by` lead, or `cap` points. */
export function setWinner(sport: Sport, scores: readonly [number, number], setsPlayed: number): Side | null {
  const w = SPORTS[sport].win;
  if (!w) return null;
  const decider = w.last && setsPlayed === w.bestOf - 1;
  const to = decider ? w.last! : w.to;
  const [a, b] = scores;
  for (const i of [0, 1] as const) {
    const me = i === 0 ? a : b;
    const them = i === 0 ? b : a;
    if (w.cap && me >= w.cap && me > them) return i;
    if (me >= to && me - them >= w.by) return i;
  }
  return null;
}

/** The match is over: someone has won the majority of `bestOf` sets. */
export function matchWinner(sport: Sport, sets: readonly [number, number]): Side | null {
  const w = SPORTS[sport].win;
  if (!w) return null;
  const need = Math.floor(w.bestOf / 2) + 1;
  return sets[0] >= need ? 0 : sets[1] >= need ? 1 : null;
}

/**
 * Table tennis: the first server serves two points, then the other player two, and so on; from 10:10 the serve
 * changes after every point.
 */
export function tableTennisServer(scores: readonly [number, number], first: Side): Side {
  const total = scores[0] + scores[1];
  const n = total < 20 ? Math.floor(total / 2) : 10 + (total - 20);
  return (n % 2 === 0 ? first : 1 - first) as Side;
}

/** Sum of counters for the list mode. */
export const total = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

/** Share of `v` in `sum` as a whole percent string ("0 %" when nothing is counted yet). */
export const percentOf = (v: number, sum: number) => (sum > 0 ? Math.round((v / sum) * 1000) / 10 : 0);

/** Scale for a big number: longer numbers get smaller so they always fit. */
export function digitsScale(n: number): 1 | 0.8 | 0.65 | 0.5 {
  const len = String(Math.abs(n)).length + (n < 0 ? 1 : 0);
  return len <= 2 ? 1 : len === 3 ? 0.8 : len === 4 ? 0.65 : 0.5;
}

/* ───────────── counter with a goal ───────────── */

/**
 * Add `delta` to a counter with an optional goal. With `loop` (prayer beads, sets of reps), reaching the goal starts
 * the next lap from zero. Returns the new value, laps and whether the goal was just reached.
 */
export function countStep(value: number, laps: number, delta: number, goal: number | null, loop: boolean): { value: number; laps: number; reached: boolean } {
  const next = clampCounter(value + delta);
  if (!goal || goal <= 0 || delta <= 0) return { value: next, laps, reached: false };
  if (value < goal && next >= goal) {
    if (loop) return { value: next - goal, laps: laps + 1, reached: true };
    return { value: next, laps, reached: true };
  }
  return { value: next, laps, reached: false };
}

/* ───────────── score buttons ───────────── */

/** Button sets offered on the generic board. */
export const STEP_SETS: readonly (readonly number[])[] = [[1], [1, 2, 3], [1, 5, 10]];

/** A saved set of score buttons: 1–4 whole numbers from 1 to 100. */
export const isSteps = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length >= 1 && v.length <= 4 && v.every((n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 100);

/* ───────────── game clock ───────────── */

/**
 * A game clock that survives reloads: while running, the time is `baseMs` plus what passed since `startedAt`
 * (a Date.now() timestamp), so nothing has to tick in the background.
 */
export interface GameClock {
  running: boolean;
  /** Time already played (ms) when the clock was last paused. */
  baseMs: number;
  startedAt: number | null;
  /** Length of a period (ms). */
  lengthMs: number;
  /** "down" shows the time left (basketball, hockey), "up" the time played (football). */
  dir: ClockDir;
}

export const CLOCK_MAX_MIN = 99;
const MIN = 60_000;

export const newClock = (min: number, dir: ClockDir): GameClock => ({ running: false, baseMs: 0, startedAt: null, lengthMs: Math.max(1, Math.min(CLOCK_MAX_MIN, Math.round(min))) * MIN, dir });

/** The clock a sport starts with; sports without one get a 10-minute countdown when it is switched on. */
export const sportClock = (sport: Sport): GameClock | null => (SPORTS[sport].clock ? newClock(SPORTS[sport].clock!.min, SPORTS[sport].clock!.dir) : null);
export const fallbackClock = (sport: Sport): GameClock => sportClock(sport) ?? newClock(10, "down");

export const isClock = (v: unknown): v is GameClock => {
  if (!v || typeof v !== "object") return false;
  const c = v as GameClock;
  return (
    typeof c.running === "boolean" &&
    typeof c.baseMs === "number" &&
    Number.isFinite(c.baseMs) &&
    c.baseMs >= 0 &&
    (c.startedAt === null || (typeof c.startedAt === "number" && Number.isFinite(c.startedAt))) &&
    typeof c.lengthMs === "number" &&
    c.lengthMs >= MIN &&
    c.lengthMs <= CLOCK_MAX_MIN * MIN &&
    (c.dir === "down" || c.dir === "up")
  );
};

/** Time played (ms), never more than the period. */
export function clockElapsed(c: GameClock, now: number): number {
  const run = c.running && c.startedAt !== null ? Math.max(0, now - c.startedAt) : 0;
  return Math.min(c.lengthMs, Math.max(0, c.baseMs + run));
}

/** What the clock shows (ms): the time left for "down", the time played for "up". */
export const clockMs = (c: GameClock, now: number): number => (c.dir === "down" ? c.lengthMs - clockElapsed(c, now) : clockElapsed(c, now));

/** The period is over. */
export const clockOver = (c: GameClock, now: number): boolean => clockElapsed(c, now) >= c.lengthMs;

/** Start, or pause a running clock. Starting a finished clock begins the next period from zero. */
export function clockToggle(c: GameClock, now: number): GameClock {
  if (c.running) return { ...c, running: false, baseMs: clockElapsed(c, now), startedAt: null };
  return { ...c, running: true, baseMs: clockOver(c, now) ? 0 : clockElapsed(c, now), startedAt: now };
}

export const clockReset = (c: GameClock): GameClock => ({ ...c, running: false, baseMs: 0, startedAt: null });

/** "10:00", "9:05"; a countdown shows tenths in its last minute ("59.9"), like a basketball clock. */
export function formatClock(ms: number, dir: ClockDir): string {
  const v = Math.max(0, ms);
  if (dir === "down" && v < MIN) return (Math.floor(v / 100) / 10).toFixed(1);
  const s = dir === "down" ? Math.ceil(v / 1000) : Math.floor(v / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ───────────── tally marks ───────────── */

/** Strokes in groups of five: 12 → [5, 5, 2]. Zero or less → no groups. */
export function tallyGroups(n: number): number[] {
  const k = Math.max(0, Math.floor(n));
  const out: number[] = Array.from({ length: Math.floor(k / 5) }, () => 5);
  if (k % 5) out.push(k % 5);
  return out;
}

export const TALLY_MAX = 500;

/**
 * How a value is drawn as tally marks: up to 500 — only marks; above that the number plus the strokes of the
 * current hundred (1–100); negative values — only digits.
 */
export function tallyView(n: number): { marks: number; digits: boolean } {
  if (n < 0) return { marks: 0, digits: true };
  if (n <= TALLY_MAX) return { marks: Math.floor(n), digits: false };
  return { marks: ((Math.floor(n) - 1) % 100) + 1, digits: true };
}
