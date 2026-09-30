import { randomIntBetween } from "./rng";

/**
 * Dice notation: "2d6+3", "4d6", "d20-1", "3d6+1d4", "d%" (= d100).
 * Russian "к" is accepted as well ("3к6"). Terms are joined with + or −.
 */

export type DiceTerm = { kind: "dice"; sign: 1 | -1; count: number; sides: number } | { kind: "const"; sign: 1 | -1; value: number };

export interface DiceExpr {
  terms: DiceTerm[];
  /** Canonical text, e.g. "3d6+1d4-1". */
  text: string;
}

export type DiceError = "empty" | "syntax" | "count" | "sides" | "total" | "const";

export const DICE_LIMITS = { maxCount: 100, maxSides: 1000, maxTotalDice: 200, maxConst: 100000 } as const;

const TERM = /^(\d*)[dк](\d+|%)$/i;

export function parseDice(input: string): { ok: true; expr: DiceExpr } | { ok: false; error: DiceError } {
  const s = input.replace(/\s+/g, "").replace(/[−–]/g, "-").toLowerCase();
  if (!s) return { ok: false, error: "empty" };
  if (!/^[+-]?[0-9dк%]+([+-][0-9dк%]+)*$/i.test(s)) return { ok: false, error: "syntax" };
  const parts = s.match(/[+-]?[^+-]+/g) ?? [];
  const terms: DiceTerm[] = [];
  let totalDice = 0;
  for (const raw of parts) {
    const sign: 1 | -1 = raw.startsWith("-") ? -1 : 1;
    const body = raw.replace(/^[+-]/, "");
    const m = TERM.exec(body);
    if (m) {
      const count = m[1] === "" ? 1 : Number(m[1]);
      const sides = m[2] === "%" ? 100 : Number(m[2]);
      if (!Number.isSafeInteger(count) || count < 1 || count > DICE_LIMITS.maxCount) return { ok: false, error: "count" };
      if (!Number.isSafeInteger(sides) || sides < 2 || sides > DICE_LIMITS.maxSides) return { ok: false, error: "sides" };
      totalDice += count;
      terms.push({ kind: "dice", sign, count, sides });
    } else if (/^\d+$/.test(body)) {
      const value = Number(body);
      if (value > DICE_LIMITS.maxConst) return { ok: false, error: "const" };
      terms.push({ kind: "const", sign, value });
    } else {
      return { ok: false, error: "syntax" };
    }
  }
  if (totalDice === 0) return { ok: false, error: "syntax" };
  if (totalDice > DICE_LIMITS.maxTotalDice) return { ok: false, error: "total" };
  return { ok: true, expr: { terms, text: formatDice(terms) } };
}

export function formatDice(terms: readonly DiceTerm[]): string {
  return terms
    .map((t, i) => {
      const body = t.kind === "dice" ? `${t.count}d${t.sides}` : String(t.value);
      return t.sign < 0 ? `-${body}` : i === 0 ? body : `+${body}`;
    })
    .join("");
}

export function diceRange(expr: DiceExpr): { min: number; max: number } {
  let min = 0;
  let max = 0;
  for (const t of expr.terms) {
    const lo = t.kind === "dice" ? t.count : t.value;
    const hi = t.kind === "dice" ? t.count * t.sides : t.value;
    if (t.sign > 0) {
      min += lo;
      max += hi;
    } else {
      min -= hi;
      max -= lo;
    }
  }
  return { min, max };
}

/** Expected value and standard deviation of the total. */
export function diceStats(expr: DiceExpr): { mean: number; sd: number } {
  let mean = 0;
  let variance = 0;
  for (const t of expr.terms) {
    if (t.kind === "const") mean += t.sign * t.value;
    else {
      mean += t.sign * t.count * ((t.sides + 1) / 2);
      variance += (t.count * (t.sides * t.sides - 1)) / 12;
    }
  }
  return { mean, sd: Math.sqrt(variance) };
}

export interface DiceRoll {
  /** One entry per dice term: the individual faces rolled. */
  groups: { sign: 1 | -1; sides: number; faces: number[] }[];
  modifier: number;
  total: number;
}

export function rollDice(expr: DiceExpr): DiceRoll {
  const groups: DiceRoll["groups"] = [];
  let modifier = 0;
  let total = 0;
  for (const t of expr.terms) {
    if (t.kind === "const") {
      modifier += t.sign * t.value;
      total += t.sign * t.value;
      continue;
    }
    const faces: number[] = [];
    for (let i = 0; i < t.count; i++) {
      const f = randomIntBetween(1, t.sides);
      faces.push(f);
      total += t.sign * f;
    }
    groups.push({ sign: t.sign, sides: t.sides, faces });
  }
  return { groups, modifier, total };
}

/**
 * Exact distribution of the total: `ways[i]` = number of equally likely outcomes
 * giving `min + i`; `outcomes` = Π sides^count. Counts are exact bigints.
 * Returns null when the table would be too large (range > maxRange).
 */
export function diceDistribution(expr: DiceExpr, maxRange = 20000): { min: number; ways: bigint[]; outcomes: bigint } | null {
  const { min, max } = diceRange(expr);
  if (max - min + 1 > maxRange) return null;
  // Distribution over offsets from 0, built by convolution one die at a time.
  let dist: bigint[] = [1n];
  let offset = 0; // value represented by dist[0]
  let outcomes = 1n;
  for (const t of expr.terms) {
    if (t.kind === "const") {
      offset += t.sign * t.value;
      continue;
    }
    // Every face is equally likely, so the kernel is all ones; a subtracted die
    // (values −sides … −1) has the same kernel and only shifts the offset.
    const die = new Array<bigint>(t.sides).fill(1n);
    for (let c = 0; c < t.count; c++) {
      dist = convolve(dist, die);
      outcomes *= BigInt(t.sides);
      offset += t.sign > 0 ? 1 : -t.sides;
    }
  }
  // offset now equals the minimum total
  return { min: offset, ways: dist, outcomes };
}

export function convolve(a: readonly bigint[], b: readonly bigint[]): bigint[] {
  const out = new Array<bigint>(a.length + b.length - 1).fill(0n);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0n) continue;
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  }
  return out;
}

/** Probability as a JS number (for display). */
export function ratio(num: bigint, den: bigint): number {
  // Scale to keep 15 significant digits even for huge denominators.
  const SCALE = 10n ** 15n;
  return Number((num * SCALE) / den) / 1e15;
}

/** Greatest common divisor (for reduced fractions like 1/6). */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}
