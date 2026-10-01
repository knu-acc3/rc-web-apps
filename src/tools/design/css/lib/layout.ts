/* ───────────── Flexbox ───────────── */

export interface FlexItem {
  id: number;
  label: string;
  grow: number;
  shrink: number;
  basis: string;
  order: number;
  alignSelf: "auto" | "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  /** margin-inline-start: auto — pushes the item (and the ones after it) to the end. */
  push: boolean;
}

export interface FlexState {
  direction: "row" | "row-reverse" | "column" | "column-reverse";
  wrap: "nowrap" | "wrap" | "wrap-reverse";
  justify: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly";
  alignItems: "stretch" | "flex-start" | "flex-end" | "center" | "baseline";
  alignContent: "normal" | "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "stretch";
  gap: number;
  /** Preview height hint for column layouts, px (not emitted when 0). */
  minHeight: number;
  items: FlexItem[];
}

export const flexItem = (id: number, label: string, patch: Partial<FlexItem> = {}): FlexItem => ({
  id,
  label,
  grow: 0,
  shrink: 1,
  basis: "auto",
  order: 0,
  alignSelf: "auto",
  push: false,
  ...patch,
});

export const DEFAULT_FLEX: FlexState = {
  direction: "row",
  wrap: "nowrap",
  justify: "flex-start",
  alignItems: "stretch",
  alignContent: "normal",
  gap: 12,
  minHeight: 0,
  items: [flexItem(1, "1"), flexItem(2, "2"), flexItem(3, "3")],
};

/** Declarations of an item that differ from the defaults (only these are emitted). */
function flexItemDecls(it: FlexItem): string[] {
  const out: string[] = [];
  if (it.grow !== 0 || it.shrink !== 1 || it.basis !== "auto") {
    if (it.grow === 1 && it.shrink === 1 && it.basis === "0%") out.push("flex: 1;");
    else out.push(`flex: ${it.grow} ${it.shrink} ${it.basis};`);
  }
  if (it.order !== 0) out.push(`order: ${it.order};`);
  if (it.alignSelf !== "auto") out.push(`align-self: ${it.alignSelf};`);
  if (it.push) out.push("margin-inline-start: auto;");
  return out;
}

function flexContainerDecls(s: FlexState): string[] {
  const out = ["display: flex;"];
  if (s.direction !== "row") out.push(`flex-direction: ${s.direction};`);
  if (s.wrap !== "nowrap") out.push(`flex-wrap: ${s.wrap};`);
  if (s.justify !== "flex-start") out.push(`justify-content: ${s.justify};`);
  if (s.alignItems !== "stretch") out.push(`align-items: ${s.alignItems};`);
  if (s.wrap !== "nowrap" && s.alignContent !== "normal") out.push(`align-content: ${s.alignContent};`);
  if (s.gap) out.push(`gap: ${s.gap}px;`);
  if (s.minHeight) out.push(`min-height: ${s.minHeight}px;`);
  return out;
}

/** CSS for the current items only: settings of removed items can't leak because they live on the item. */
export function flexCss(s: FlexState): string {
  const rules = [`.container {\n${flexContainerDecls(s).map((d) => `  ${d}`).join("\n")}\n}`];
  s.items.forEach((it, i) => {
    const d = flexItemDecls(it);
    if (d.length) rules.push(`.item-${i + 1} {\n${d.map((x) => `  ${x}`).join("\n")}\n}`);
  });
  return rules.join("\n\n");
}

export function flexHtml(s: FlexState): string {
  const items = s.items.map((it, i) => `  <div class="item${flexItemDecls(it).length ? ` item-${i + 1}` : ""}">${escapeHtml(it.label)}</div>`);
  return `<div class="container">\n${items.join("\n")}\n</div>`;
}

/* ───────────── Grid ───────────── */

export interface GridItem {
  id: number;
  label: string;
  /** Named area ("" = none) */
  area: string;
  /** Raw grid-column / grid-row values, e.g. "span 2", "1 / -1" ("" = auto). */
  column: string;
  row: string;
}

export interface GridState {
  columns: string;
  rows: string;
  gap: number;
  /** Rows of area names; "." = empty cell. Empty array = no template areas. */
  areas: string[][];
  justifyItems: "stretch" | "start" | "end" | "center";
  alignItems: "stretch" | "start" | "end" | "center";
  items: GridItem[];
}

export const gridItem = (id: number, label: string, patch: Partial<GridItem> = {}): GridItem => ({ id, label, area: "", column: "", row: "", ...patch });

export const DEFAULT_GRID: GridState = {
  columns: "repeat(3, 1fr)",
  rows: "",
  gap: 12,
  areas: [],
  justifyItems: "stretch",
  alignItems: "stretch",
  items: [1, 2, 3, 4, 5, 6].map((n) => gridItem(n, String(n))),
};

/** Every named area must be a single filled rectangle; all rows must have the same number of cells. */
export function validateAreas(areas: string[][]): { ok: true } | { ok: false; error: "rows" | "shape" | "name"; name?: string } {
  if (!areas.length) return { ok: true };
  const w = areas[0].length;
  if (!w || areas.some((r) => r.length !== w)) return { ok: false, error: "rows" };
  const boxes = new Map<string, { r0: number; r1: number; c0: number; c1: number; n: number }>();
  for (let r = 0; r < areas.length; r++)
    for (let c = 0; c < w; c++) {
      const name = areas[r][c];
      if (name === ".") continue;
      if (!/^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(name)) return { ok: false, error: "name", name };
      const b = boxes.get(name);
      if (!b) boxes.set(name, { r0: r, r1: r, c0: c, c1: c, n: 1 });
      else {
        b.r0 = Math.min(b.r0, r);
        b.r1 = Math.max(b.r1, r);
        b.c0 = Math.min(b.c0, c);
        b.c1 = Math.max(b.c1, c);
        b.n++;
      }
    }
  for (const [name, b] of boxes) if ((b.r1 - b.r0 + 1) * (b.c1 - b.c0 + 1) !== b.n) return { ok: false, error: "shape", name };
  return { ok: true };
}

export function areaNames(areas: string[][]): string[] {
  return [...new Set(areas.flat().filter((n) => n !== "."))];
}

export function gridItemDecls(it: GridItem, areas: string[][]): string[] {
  const out: string[] = [];
  if (it.area && areas.length && areaNames(areas).includes(it.area)) out.push(`grid-area: ${it.area};`);
  else {
    if (it.column.trim()) out.push(`grid-column: ${it.column.trim()};`);
    if (it.row.trim()) out.push(`grid-row: ${it.row.trim()};`);
  }
  return out;
}

function gridContainerDecls(s: GridState): string[] {
  const out = ["display: grid;"];
  if (s.columns.trim()) out.push(`grid-template-columns: ${s.columns.trim()};`);
  if (s.rows.trim()) out.push(`grid-template-rows: ${s.rows.trim()};`);
  if (s.areas.length && validateAreas(s.areas).ok) {
    const w = Math.max(...s.areas.map((r) => r.map((x) => x.length)).flat());
    out.push(`grid-template-areas:\n${s.areas.map((r) => `    "${r.map((x) => x.padEnd(w)).join(" ").trimEnd()}"`).join("\n")};`);
  }
  if (s.gap) out.push(`gap: ${s.gap}px;`);
  if (s.justifyItems !== "stretch") out.push(`justify-items: ${s.justifyItems};`);
  if (s.alignItems !== "stretch") out.push(`align-items: ${s.alignItems};`);
  return out;
}

export function gridCss(s: GridState): string {
  const rules = [`.grid {\n${gridContainerDecls(s).map((d) => `  ${d}`).join("\n")}\n}`];
  s.items.forEach((it, i) => {
    const d = gridItemDecls(it, s.areas);
    if (d.length) rules.push(`.item-${i + 1} {\n${d.map((x) => `  ${x}`).join("\n")}\n}`);
  });
  return rules.join("\n\n");
}

export function gridHtml(s: GridState): string {
  const items = s.items.map((it, i) => `  <div class="item${gridItemDecls(it, s.areas).length ? ` item-${i + 1}` : ""}">${escapeHtml(it.label)}</div>`);
  return `<div class="grid">\n${items.join("\n")}\n</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
