/* Scoreboard and counter state: pure helpers, unit-tested. */

export type Sport = "default" | "basketball" | "volleyball" | "football" | "hockey" | "table-tennis" | "badminton" | "quiz";

const SPORT_IDS: Sport[] = ["default", "basketball", "volleyball", "football", "hockey", "table-tennis", "badminton", "quiz"];

type L = { ru: string; en: string };

interface SportConfig {
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
}

const HOME: SportConfig["names"] = { ru: ["Хозяева", "Гости"], en: ["Home", "Guest"] };
const TEAMS: SportConfig["names"] = { ru: ["Команда 1", "Команда 2"], en: ["Team 1", "Team 2"] };
const PLAYERS: SportConfig["names"] = { ru: ["Игрок 1", "Игрок 2"], en: ["Player 1", "Player 2"] };

export const SPORTS: Record<Sport, SportConfig> = {
  default: { steps: [1], small: { ru: "Сеты", en: "Sets" }, period: null, periods: 9, names: HOME, serve: null, win: null },
  basketball: { steps: [1, 2, 3], small: { ru: "Фолы", en: "Fouls" }, period: { ru: "Четверть", en: "Quarter" }, periods: 9, names: HOME, serve: null, win: null },
  volleyball: { steps: [1], small: { ru: "Партии", en: "Sets" }, period: null, periods: 5, names: TEAMS, serve: "rally", win: { to: 25, by: 2, last: 15, bestOf: 5 } },
  football: { steps: [1], small: null, period: { ru: "Тайм", en: "Half" }, periods: 4, names: HOME, serve: null, win: null },
  hockey: { steps: [1], small: null, period: { ru: "Период", en: "Period" }, periods: 5, names: HOME, serve: null, win: null },
  "table-tennis": { steps: [1], small: { ru: "Партии", en: "Games" }, period: null, periods: 7, names: PLAYERS, serve: "two", win: { to: 11, by: 2, bestOf: 5 } },
  badminton: { steps: [1], small: { ru: "Геймы", en: "Games" }, period: null, periods: 3, names: PLAYERS, serve: "rally", win: { to: 21, by: 2, cap: 30, bestOf: 3 } },
  quiz: { steps: [1, 5, 10], small: null, period: { ru: "Раунд", en: "Round" }, periods: 99, names: TEAMS, serve: null, win: null },
};

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
