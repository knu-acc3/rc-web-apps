import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";

/** Polynomial solvers (degree 1–3) with complex roots, plus human-friendly formatting. */

export interface Complex {
  re: number;
  im: number;
}

const EPS = 1e-12;
const clean = (x: number) => {
  if (Math.abs(x) < 1e-12) return 0;
  const r = Math.round(x);
  return Math.abs(x - r) < 1e-9 * Math.max(1, Math.abs(x)) ? r : Number(x.toPrecision(12));
};

/* ───────────── formatting ───────────── */

export function num(locale: Locale, x: number, digits = 6): string {
  const s = formatNumber(locale, clean(x), { maximumFractionDigits: digits });
  return s.replace("-", "−");
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n: number) => String(n).split("").map((c) => SUP[c]).join("");

/**
 * Pretty polynomial: coeffs from the highest power down.
 * poly([1, -3, 2]) → "x² − 3x + 2"; zero terms skipped; coefficient 1 omitted; never "+ −3".
 */
export function poly(locale: Locale, coeffs: number[], v = "x"): string {
  const deg = coeffs.length - 1;
  const parts: string[] = [];
  coeffs.forEach((c0, i) => {
    const c = clean(c0);
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const coef = p > 0 && abs === 1 ? "" : num(locale, abs);
    const term = p === 0 ? coef : `${coef}${v}${p > 1 ? sup(p) : ""}`;
    if (parts.length === 0) parts.push(c < 0 ? `−${term}` : term);
    else parts.push(c < 0 ? `− ${term}` : `+ ${term}`);
  });
  return parts.length ? parts.join(" ") : "0";
}

/** "−1 + 2i", "2i", "3", "0,5 − 0,866025i". */
export function complexText(locale: Locale, z: Complex, digits = 6): string {
  const re = clean(z.re);
  const im = clean(z.im);
  if (im === 0) return num(locale, re, digits);
  const imAbs = Math.abs(im);
  const imText = `${imAbs === 1 ? "" : num(locale, imAbs, digits)}i`;
  if (re === 0) return im < 0 ? `−${imText}` : imText;
  return `${num(locale, re, digits)} ${im < 0 ? "−" : "+"} ${imText}`;
}

/* ───────────── linear ───────────── */

type LinearResult = { kind: "one"; x: number } | { kind: "none" } | { kind: "all" };

/** a·x + b = c */
export function linear(a: number, b: number, c: number): LinearResult {
  if (Math.abs(a) < EPS) return Math.abs(c - b) < EPS ? { kind: "all" } : { kind: "none" };
  return { kind: "one", x: clean((c - b) / a) };
}

/* ───────────── quadratic ───────────── */

interface QuadResult {
  D: number;
  roots: [Complex, Complex];
  /** Exact form when a, b, c are integers, e.g. "(3 ± √5) / 2", "−1 ± 2i". */
  exact: string | null;
}

function gcdN(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** Largest k with k² | n → [k, n / k²]. */
function squareFree(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let f = 2; f * f <= m; f++) {
    while (m % (f * f) === 0) {
      m /= f * f;
      k *= f;
    }
  }
  return [k, m];
}

function exactQuadratic(locale: Locale, a: number, b: number, D: number): string | null {
  if (![a, b, D].every(Number.isInteger) || Math.abs(D) > 1e12) return null;
  const den0 = 2 * a;
  const absD = Math.abs(D);
  const [k0, m] = squareFree(absD);
  const neg = D < 0;
  if (m === 1 && !neg) {
    // rational roots are shown by the numeric part
    return null;
  }
  let p = -b;
  let k = k0;
  let s = den0;
  const g = gcdN(gcdN(p, k), s) || 1;
  p /= g;
  k /= g;
  s /= g;
  if (s < 0) {
    p = -p;
    s = -s;
  }
  const rad = m === 1 ? "" : `√${m}`;
  const kText = k === 1 && rad ? "" : String(k);
  const irr = neg ? (m === 1 ? `${kText || "1"}i`.replace(/^1i$/, "i") : `${kText}i${rad}`) : `${kText}${rad}`;
  const pm = p === 0 ? `±${irr}` : `${num(locale, p)} ± ${irr}`;
  if (s === 1) return pm;
  return p === 0 ? `${pm}/${s}` : `(${pm}) / ${s}`;
}

/** a·x² + b·x + c = 0 (a ≠ 0). */
export function quadratic(locale: Locale, a: number, b: number, c: number): QuadResult {
  const D = b * b - 4 * a * c;
  const Dc = Math.abs(D) < 1e-12 * Math.max(1, b * b) ? 0 : D;
  let roots: [Complex, Complex];
  if (Dc >= 0) {
    const s = Math.sqrt(Dc);
    // numerically stable form
    const qv = -0.5 * (b + (b >= 0 ? s : -s));
    const x1 = qv !== 0 ? qv / a : -b / (2 * a);
    const x2 = qv !== 0 ? c / qv : -b / (2 * a);
    const [lo, hi] = x1 <= x2 ? [x1, x2] : [x2, x1];
    roots = [
      { re: clean(lo), im: 0 },
      { re: clean(hi), im: 0 },
    ];
  } else {
    const re = -b / (2 * a);
    const im = Math.sqrt(-Dc) / (2 * Math.abs(a));
    roots = [
      { re: clean(re), im: clean(im) },
      { re: clean(re), im: clean(-im) },
    ];
  }
  return { D: clean(Dc), roots, exact: exactQuadratic(locale, a, b, Dc) };
}

/* ───────────── cubic ───────────── */

interface CubicResult {
  /** Discriminant of the depressed cubic: (q/2)² + (p/3)³ (> 0: one real root, = 0: multiple, < 0: three distinct real). */
  disc: number;
  roots: Complex[];
  nature: "three-real" | "multiple" | "one-real";
  p: number;
  q: number;
  shift: number;
}

function polish(a: number, b: number, c: number, d: number, x: number): number {
  for (let i = 0; i < 3; i++) {
    const f = ((a * x + b) * x + c) * x + d;
    const df = (3 * a * x + 2 * b) * x + c;
    if (Math.abs(df) < 1e-14) break;
    const nx = x - f / df;
    if (!Number.isFinite(nx)) break;
    x = nx;
  }
  return x;
}

/** a·x³ + b·x² + c·x + d = 0 (a ≠ 0), Cardano / trigonometric method. */
export function cubic(a: number, b: number, c: number, d: number): CubicResult {
  const B = b / a;
  const C = c / a;
  const Dd = d / a;
  const p = C - (B * B) / 3;
  const q = (2 * B * B * B) / 27 - (B * C) / 3 + Dd;
  const shift = -B / 3;
  const disc = (q / 2) ** 2 + (p / 3) ** 3;
  const scale = Math.max(1, Math.abs(q / 2) ** 2, Math.abs(p / 3) ** 3);
  const discC = Math.abs(disc) < 1e-12 * scale ? 0 : disc;
  let roots: Complex[];
  let nature: CubicResult["nature"];
  if (discC > 0) {
    const sq = Math.sqrt(discC);
    const u = Math.cbrt(-q / 2 + sq);
    const v = Math.cbrt(-q / 2 - sq);
    const t1 = u + v;
    const re = -t1 / 2 + shift;
    const im = (Math.sqrt(3) / 2) * (u - v);
    roots = [
      { re: polish(a, b, c, d, t1 + shift), im: 0 },
      { re, im: Math.abs(im) },
      { re, im: -Math.abs(im) },
    ];
    nature = "one-real";
  } else if (discC === 0) {
    if (Math.abs(p) < 1e-12) roots = [0, 0, 0].map(() => ({ re: shift, im: 0 }));
    else {
      const t1 = (3 * q) / p;
      const t2 = (-3 * q) / (2 * p);
      roots = [t1, t2, t2].map((t) => ({ re: polish(a, b, c, d, t + shift), im: 0 }));
    }
    nature = "multiple";
  } else {
    const r = 2 * Math.sqrt(-p / 3);
    const phi = Math.acos(Math.max(-1, Math.min(1, ((3 * q) / (2 * p)) * Math.sqrt(-3 / p)))) / 3;
    roots = [0, 1, 2].map((k) => ({ re: polish(a, b, c, d, r * Math.cos(phi - (2 * Math.PI * k) / 3) + shift), im: 0 }));
    nature = "three-real";
  }
  roots = roots.map((z) => ({ re: clean(z.re), im: clean(z.im) }));
  roots.sort((x, y) => (x.im === 0 && y.im !== 0 ? -1 : x.im !== 0 && y.im === 0 ? 1 : x.re - y.re || y.im - x.im));
  return { disc: discC, roots, nature, p, q, shift };
}
