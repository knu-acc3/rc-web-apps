/** Split a CSS value on a separator character that is not inside parentheses or quotes. */
export function splitTop(value: string, sep: "," | "/" | " "): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (const ch of value) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    const isSep = sep === " " ? /\s/.test(ch) : ch === sep;
    if (isSep && depth === 0) {
      if (sep !== " " || cur) out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (sep !== " " || cur) out.push(cur);
  return out.map((s) => s.trim()).filter((s, i, a) => sep !== " " || s !== "" || a.length === 1);
}

const LENGTH_UNITS = [
  "px", "em", "rem", "%", "vw", "vh", "vmin", "vmax", "svw", "svh", "lvw", "lvh", "dvw", "dvh",
  "ch", "ex", "cap", "ic", "lh", "rlh", "pt", "pc", "cm", "mm", "q", "in", "cqw", "cqh", "cqi", "cqb", "cqmin", "cqmax",
] as const;

export interface Length {
  value: number;
  /** "" for unitless zero. */
  unit: string;
}

const LEN_RE = new RegExp(`^([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)(${LENGTH_UNITS.join("|")})?$`, "i");

/**
 * Parse a CSS length token. Accepts every absolute/relative unit, negative and decimal values
 * and unitless 0. Unitless non-zero numbers are read as px (common when pasting from design tools).
 */
export function parseLength(token: string): Length | null {
  const m = LEN_RE.exec(token.trim());
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  const unit = (m[2] ?? "").toLowerCase();
  if (!unit) return value === 0 ? { value: 0, unit: "" } : { value, unit: "px" };
  return { value, unit: unit === "q" ? "Q" : unit };
}

/** Serialize a length without float noise: 0 stays unitless. */
export function fmtLength(l: Length, digits = 3): string {
  const v = Math.round(l.value * 10 ** digits) / 10 ** digits;
  if (v === 0) return "0";
  return `${v}${l.unit || "px"}`;
}

/** Round to at most `digits` decimals and print without trailing zeros. */
export function round(n: number, digits = 4): string {
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  return String(v === 0 ? 0 : v);
}
