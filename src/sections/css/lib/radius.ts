import { fmtLength, parseLength, splitTop, type Length } from "./tokens";

/** Horizontal radii (tl, tr, br, bl) and vertical radii (tl, tr, br, bl). */
export interface Radii {
  h: [Length, Length, Length, Length];
  v: [Length, Length, Length, Length];
}

/** Expand 1–4 values the CSS way: a → a a a a; a b → a b a b; a b c → a b c b. */
function expand<T>(xs: T[]): [T, T, T, T] {
  const [a, b = a, c = a, d = b] = xs;
  return [a, b, c, d];
}

/** Parse a border-radius value: 1–4 lengths, optionally "/" and 1–4 vertical lengths. */
export function parseRadius(value: string): Radii | null {
  const v = value.trim().replace(/^border-radius\s*:\s*/i, "").replace(/;\s*$/, "");
  const halves = splitTop(v, "/");
  if (halves.length < 1 || halves.length > 2) return null;
  const parse = (s: string) => {
    const toks = splitTop(s, " ");
    if (toks.length < 1 || toks.length > 4) return null;
    const ls = toks.map(parseLength);
    if (ls.some((l) => !l || l.value < 0)) return null;
    return expand(ls as Length[]);
  };
  const h = parse(halves[0]);
  if (!h) return null;
  const vv = halves[1] !== undefined ? parse(halves[1]) : h;
  if (!vv) return null;
  return { h, v: [...vv] as [Length, Length, Length, Length] };
}

/** Shortest equivalent list of 4 values. */
function shorten(xs: string[]): string[] {
  const [a, b, c, d] = xs;
  if (b === d) {
    if (a === c) return a === b ? [a] : [a, b];
    return [a, b, c];
  }
  return [a, b, c, d];
}

/** Shortest border-radius value; `full` always writes all 8 values (blob syntax). */
export function radiusValue(r: Radii, full = false): string {
  const h = r.h.map((l) => fmtLength(l));
  const v = r.v.map((l) => fmtLength(l));
  const same = h.every((x, i) => x === v[i]);
  if (full) return `${h.join(" ")} / ${v.join(" ")}`;
  return same ? shorten(h).join(" ") : `${shorten(h).join(" ")} / ${shorten(v).join(" ")}`;
}

/** Random organic "blob" shape: 8 percentages where opposite corners add up to 100%. */
export function blobRadii(rand: () => number): Radii {
  const p = () => 25 + Math.round(rand() * 50); // 25…75 %
  const [a, b, c, d] = [p(), p(), p(), p()];
  const pct = (value: number): Length => ({ value, unit: "%" });
  return { h: [pct(a), pct(100 - a), pct(100 - b), pct(b)], v: [pct(c), pct(d), pct(100 - d), pct(100 - c)] };
}
