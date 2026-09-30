/**
 * Batch-rename engine. Pure, unit-tested.
 * Order of operations: find/replace → pattern → transliteration → spaces → case.
 */

export type CaseMode = "keep" | "lower" | "upper" | "title";
export type SpaceMode = "keep" | "-" | "_" | "remove";

export interface RenameOptions {
  /** Tokens: {name} {ext} {n} {n:3} {date} {time}. The extension is kept automatically. */
  pattern: string;
  start: number;
  pad: number;
  find: string;
  replace: string;
  regex: boolean;
  caseMode: CaseMode;
  translit: boolean;
  spaces: SpaceMode;
}

export const DEFAULT_RENAME: RenameOptions = { pattern: "{name}", start: 1, pad: 0, find: "", replace: "", regex: false, caseMode: "keep", translit: false, spaces: "keep" };

export interface RenameInput {
  name: string;
  lastModified: number;
}

export type RenameError = "empty" | "illegal" | "reserved" | "duplicate" | "long";

export interface RenameResult {
  name: string;
  error?: RenameError;
}

const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Kazakh letters
  ә: "a", ғ: "gh", қ: "q", ң: "ng", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
  // Ukrainian / Belarusian extras
  є: "ye", ї: "yi", ґ: "g", ў: "w",
};

/** Transliterate Cyrillic (Russian, Kazakh) to Latin letters. */
export function transliterate(s: string): string {
  let out = "";
  for (const ch of s) {
    const low = ch.toLowerCase();
    const t = MAP[low];
    if (t === undefined) {
      out += ch;
      continue;
    }
    out += ch !== low && t ? t[0].toUpperCase() + t.slice(1) : t;
  }
  return out;
}

export function splitName(name: string): { base: string; ext: string } {
  const i = name.lastIndexOf(".");
  if (i <= 0 || i === name.length - 1) return { base: name, ext: "" };
  return { base: name.slice(0, i), ext: name.slice(i + 1) };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Validate a regex once; returns an error message or null. */
export function regexError(find: string, regex: boolean): string | null {
  if (!regex || !find) return null;
  try {
    new RegExp(find, "g");
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

function applyCase(s: string, mode: CaseMode): string {
  if (mode === "lower") return s.toLowerCase();
  if (mode === "upper") return s.toUpperCase();
  if (mode === "title") return s.toLowerCase().replace(/(^|[\s_\-.([])(\p{L})/gu, (_, p: string, c: string) => p + c.toUpperCase());
  return s;
}

const ILLEGAL = /[<>:"/\\|?*\u0000-\u001f]/;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;

/** New names for a list of files (same order). */
export function renameAll(files: RenameInput[], o: RenameOptions): RenameResult[] {
  const re = o.regex && o.find && !regexError(o.find, true) ? new RegExp(o.find, "g") : null;
  const out = files.map((f, i): RenameResult => {
    const { base, ext } = splitName(f.name);
    let b = base;
    if (o.find) b = re ? b.replace(re, o.replace) : b.split(o.find).join(o.replace);
    const d = new Date(f.lastModified);
    const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const time = `${pad2(d.getHours())}-${pad2(d.getMinutes())}-${pad2(d.getSeconds())}`;
    const num = o.start + i;
    let name = (o.pattern || "{name}")
      .replace(/\{n(?::(\d{1,2}))?\}/g, (_, p?: string) => String(num).padStart(p ? Number(p) : o.pad, "0"))
      .replace(/\{name\}/g, b)
      .replace(/\{ext\}/g, ext)
      .replace(/\{date\}/g, date)
      .replace(/\{time\}/g, time);
    let e = ext;
    if (o.translit) {
      name = transliterate(name);
      e = transliterate(e);
    }
    if (o.spaces !== "keep") name = name.replace(/\s+/g, o.spaces === "remove" ? "" : o.spaces);
    name = applyCase(name, o.caseMode);
    if (o.caseMode === "lower") e = e.toLowerCase();
    if (o.caseMode === "upper") e = e.toUpperCase();
    const full = e ? `${name}.${e}` : name;
    let error: RenameError | undefined;
    if (!name.trim()) error = "empty";
    else if (ILLEGAL.test(full) || /[. ]$/.test(full)) error = "illegal";
    else if (RESERVED.test(full)) error = "reserved";
    else if (full.length > 255) error = "long";
    return { name: full, error };
  });
  // Duplicates (case-insensitive: Windows and macOS file systems ignore case)
  const seen = new Map<string, number>();
  out.forEach((r) => seen.set(r.name.toLowerCase(), (seen.get(r.name.toLowerCase()) ?? 0) + 1));
  for (const r of out) if (!r.error && (seen.get(r.name.toLowerCase()) ?? 0) > 1) r.error = "duplicate";
  return out;
}
