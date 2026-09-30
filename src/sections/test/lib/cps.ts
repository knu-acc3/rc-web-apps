/** Click-speed (CPS) test calculator. */

export const CPS_DURATIONS = [1, 5, 10, 30, 60] as const;
export type CpsDuration = (typeof CPS_DURATIONS)[number];
export const DEFAULT_CPS_DURATION: CpsDuration = 10;

/** Clicks per second over the full test duration. */
export function cps(clicks: number, seconds: number): number {
  if (!(seconds > 0) || clicks <= 0) return 0;
  return clicks / seconds;
}

/** CPS rounded to two decimals for display and storage. */
export function roundCps(v: number): number {
  return Math.round(v * 100) / 100;
}

export type CpsRank = "relaxed" | "casual" | "average" | "fast" | "very-fast" | "butterfly" | "superhuman";

/** Lower bound (inclusive) of each rank, ascending. */
export const CPS_RANKS: readonly { id: CpsRank; min: number }[] = [
  { id: "relaxed", min: 0 },
  { id: "casual", min: 4 },
  { id: "average", min: 6 },
  { id: "fast", min: 8 },
  { id: "very-fast", min: 10 },
  { id: "butterfly", min: 14 },
  { id: "superhuman", min: 20 },
];

export function cpsRank(value: number): CpsRank {
  let id: CpsRank = "relaxed";
  for (const r of CPS_RANKS) if (value >= r.min) id = r.id;
  return id;
}

/** Upper bound (exclusive) of a rank, or null for the last one. */
export function rankMax(id: CpsRank): number | null {
  const i = CPS_RANKS.findIndex((r) => r.id === id);
  return i >= 0 && i < CPS_RANKS.length - 1 ? CPS_RANKS[i + 1].min : null;
}

/** True if `next` beats the stored best (or there is none). */
export function isNewBest(best: number | null, next: number): boolean {
  return next > 0 && (best === null || next > best);
}

export function isCpsDuration(n: unknown): n is CpsDuration {
  return typeof n === "number" && (CPS_DURATIONS as readonly number[]).includes(n);
}

/** Rank names shown in the tool and in the tables of the variant pages. */
export const CPS_RANK_LABELS: Record<"ru" | "en", Record<CpsRank, string>> = {
  ru: {
    relaxed: "Неспешно",
    casual: "Обычный темп",
    average: "Средний уровень",
    fast: "Быстро",
    "very-fast": "Очень быстро (джиттер-клик)",
    butterfly: "Уровень баттерфляй-клика",
    superhuman: "Нечеловеческая скорость",
  },
  en: {
    relaxed: "Relaxed",
    casual: "Casual",
    average: "Average",
    fast: "Fast",
    "very-fast": "Very fast (jitter clicking)",
    butterfly: "Butterfly-clicker level",
    superhuman: "Superhuman",
  },
};
