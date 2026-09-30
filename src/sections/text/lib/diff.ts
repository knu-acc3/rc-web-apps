/** Text comparison built on jsdiff with Unicode-aware tokens. */
import { createTwoFilesPatch, diffArrays, diffWords } from "diff";
import { graphemes, normalizeNewlines } from "./textOps";

export type DiffMode = "lines" | "words" | "chars";

export interface DiffOptions {
  mode: DiffMode;
  ignoreCase: boolean;
  /** Lines mode: ignore leading/trailing whitespace and runs of spaces. */
  ignoreWhitespace: boolean;
  locale?: string;
}

export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface SideRow {
  left: string | null;
  right: string | null;
  kind: "same" | "changed" | "removed" | "added";
  leftNo: number | null;
  rightNo: number | null;
}

export interface DiffResult {
  parts: DiffPart[];
  rows: SideRow[];
  added: number;
  removed: number;
  /** Unified patch (lines mode only). */
  patch: string;
}

function lineKey(o: DiffOptions) {
  return (l: string) => {
    let k = l;
    if (o.ignoreWhitespace) k = k.trim().replace(/\s+/g, " ");
    if (o.ignoreCase) k = k.toLocaleLowerCase(o.locale);
    return k;
  };
}

export function computeDiff(aRaw: string, bRaw: string, o: DiffOptions): DiffResult {
  const a = normalizeNewlines(aRaw);
  const b = normalizeNewlines(bRaw);
  if (o.mode === "lines") {
    const la = a === "" ? [] : a.split("\n");
    const lb = b === "" ? [] : b.split("\n");
    const key = lineKey(o);
    const changes = diffArrays(la, lb, { comparator: (x, y) => key(x) === key(y) });
    const parts: DiffPart[] = [];
    const rows: SideRow[] = [];
    let added = 0;
    let removed = 0;
    let ln = 1;
    let rn = 1;
    for (let i = 0; i < changes.length; i++) {
      const c = changes[i];
      if (c.removed && changes[i + 1]?.added) {
        const next = changes[i + 1];
        parts.push({ value: c.value.join("\n"), removed: true }, { value: next.value.join("\n"), added: true });
        removed += c.value.length;
        added += next.value.length;
        const n = Math.max(c.value.length, next.value.length);
        for (let k = 0; k < n; k++) {
          const l = c.value[k] ?? null;
          const r = next.value[k] ?? null;
          rows.push({ left: l, right: r, kind: l !== null && r !== null ? "changed" : l !== null ? "removed" : "added", leftNo: l !== null ? ln++ : null, rightNo: r !== null ? rn++ : null });
        }
        i++;
      } else if (c.removed) {
        parts.push({ value: c.value.join("\n"), removed: true });
        removed += c.value.length;
        for (const l of c.value) rows.push({ left: l, right: null, kind: "removed", leftNo: ln++, rightNo: null });
      } else if (c.added) {
        parts.push({ value: c.value.join("\n"), added: true });
        added += c.value.length;
        for (const r of c.value) rows.push({ left: null, right: r, kind: "added", leftNo: null, rightNo: rn++ });
      } else {
        parts.push({ value: c.value.join("\n") });
        // equal chunk: show the new text on the right, the old on the left
        for (const l of c.value) rows.push({ left: la[ln - 1] ?? l, right: lb[rn - 1] ?? l, kind: "same", leftNo: ln++, rightNo: rn++ });
      }
    }
    const patch = createTwoFilesPatch("a.txt", "b.txt", a.endsWith("\n") || !a ? a : a + "\n", b.endsWith("\n") || !b ? b : b + "\n", "", "", { ignoreWhitespace: o.ignoreWhitespace });
    return { parts, rows, added, removed, patch };
  }

  let parts: DiffPart[];
  if (o.mode === "words") {
    const seg = new Intl.Segmenter(o.locale ?? "ru", { granularity: "word" });
    parts = diffWords(a, b, { ignoreCase: o.ignoreCase, intlSegmenter: seg });
  } else {
    const ga = graphemes(a);
    const gb = graphemes(b);
    const norm = (g: string) => (o.ignoreCase ? g.toLocaleLowerCase(o.locale) : g);
    parts = diffArrays(ga, gb, { comparator: (x, y) => norm(x) === norm(y) }).map((c) => ({ value: c.value.join(""), added: c.added, removed: c.removed }));
  }
  let added = 0;
  let removed = 0;
  const unit = o.mode === "words" ? (s: string) => (s.match(/[\p{L}\p{N}]+/gu) ?? []).length : (s: string) => graphemes(s).length;
  for (const p of parts) {
    if (p.added) added += unit(p.value);
    if (p.removed) removed += unit(p.value);
  }
  return { parts, rows: [], added, removed, patch: "" };
}
