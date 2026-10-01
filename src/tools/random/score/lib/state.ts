/* Saved state of the scoreboard and the counter (localStorage) and its validators. New fields are optional so
   saves made by older versions keep loading. Pure, unit-tested. */

import { isClock, isSteps, type GameClock, type Pair, type Side } from "./score";

export type Theme = "redblue" | "led" | "mono" | "light";
export const THEME_IDS: Theme[] = ["redblue", "led", "mono", "light"];

export interface Board {
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
  /** Score buttons chosen on the generic board; absent — the sport's own. */
  steps?: number[];
  /** Game clock: absent — the sport's default, null — switched off. */
  clock?: GameClock | null;
}

const isPair = (v: unknown): v is Pair => Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === "number" && Number.isFinite(n));

export const isBoard = (v: unknown): v is Board => {
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
    typeof b.flip === "boolean" &&
    (b.steps === undefined || isSteps(b.steps)) &&
    (b.clock === undefined || b.clock === null || isClock(b.clock))
  );
};

export type CounterView = "number" | "tally";

export interface TallyItem {
  name: string;
  value: number;
}

export interface Tally {
  title: string;
  items: TallyItem[];
  step: number;
  goal: number | null;
  loop: boolean;
  laps: number;
  sound: boolean;
  active: number;
  /** Plain number or tally marks; absent (older saves) — the number. */
  view?: CounterView;
}

export const MAX_COUNTERS = 24;

export const isTally = (v: unknown): v is Tally => {
  if (!v || typeof v !== "object") return false;
  const s = v as Tally;
  return (
    typeof s.title === "string" &&
    Array.isArray(s.items) &&
    s.items.length > 0 &&
    s.items.length <= MAX_COUNTERS &&
    s.items.every((i) => i && typeof i.name === "string" && typeof i.value === "number" && Number.isFinite(i.value)) &&
    typeof s.step === "number" &&
    (s.goal === null || typeof s.goal === "number") &&
    typeof s.loop === "boolean" &&
    typeof s.laps === "number" &&
    typeof s.sound === "boolean" &&
    typeof s.active === "number" &&
    (s.view === undefined || s.view === "number" || s.view === "tally")
  );
};
