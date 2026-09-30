import raw from "./data/symbols.json";

/* Server-side symbol catalog built by scripts/data/gen-symbols.mjs. Never import from client components. */

export interface SymExt {
  /** HTML named entities, preferred first. */
  e?: string[];
  /** Alt+0nnn byte in Windows-1252 / Windows-1251. */
  w?: number;
  r?: number;
  /** macOS Option combination (U.S./ABC layout). */
  m?: string;
  /** LaTeX command. */
  t?: string;
  /** Visible label of an invisible character. */
  d?: string;
  /** Default emoji presentation. */
  ep?: 1;
  /** Emoji page slug. */
  em?: string;
}
type Row = [string, string, string, string, string, string, number, SymExt?];

export interface Sym {
  ch: string;
  cp: number;
  hex: string;
  /** Official Unicode name. */
  name: string;
  ru: string;
  /** CLDR short English name. */
  enShort: string;
  kwEn: string[];
  kwRu: string[];
  gc: string;
  /** [first, last, English name, Russian name or ""] */
  block: [number, number, string, string];
  ext: SymExt;
}

export interface SymPage {
  col: string;
  slug: string;
  sym: Sym;
  /** Uppercase form for letter pages. */
  pair?: Sym;
}

export interface Collection {
  id: string;
  chars: Sym[];
  pages: SymPage[];
}

const data = raw as unknown as {
  source: string;
  blocks: [number, number, string, string][];
  collections: { id: string; chars: string; pages: [string, string, string?][] }[];
  chars: Record<string, Row>;
};

export const SOURCE = data.source;

export const SYMS = new Map<string, Sym>();
for (const [hex, r] of Object.entries(data.chars)) {
  const cp = parseInt(hex, 16);
  const ch = String.fromCodePoint(cp);
  SYMS.set(ch, {
    ch,
    cp,
    hex: hex.padStart(4, "0"),
    name: r[0],
    ru: r[1],
    enShort: r[2],
    kwEn: r[3] ? r[3].split("|") : [],
    kwRu: r[4] ? r[4].split("|") : [],
    gc: r[5],
    block: data.blocks[r[6]],
    ext: r[7] ?? {},
  });
}
export const sym = (ch: string) => SYMS.get(ch);

export const COLLECTIONS: Collection[] = data.collections.map((c) => ({
  id: c.id,
  chars: Array.from(c.chars, (ch) => SYMS.get(ch)!),
  pages: c.pages.map(([ch, slug, pair]) => ({ col: c.id, slug, sym: SYMS.get(ch)!, pair: pair ? SYMS.get(pair) : undefined })),
}));
export const collectionById = new Map(COLLECTIONS.map((c) => [c.id, c]));

export const PAGES: SymPage[] = COLLECTIONS.flatMap((c) => c.pages);
export const pageByKey = new Map(PAGES.map((p) => [`${p.col}/${p.slug}`, p]));
/** The page of a character (by the character or its case pair). */
export const pageOf = new Map<string, SymPage>();
for (const p of PAGES) {
  pageOf.set(p.sym.ch, p);
  if (p.pair) pageOf.set(p.pair.ch, p);
}

/** Collections that contain a character. */
export const collectionsOf = new Map<string, Collection[]>();
for (const c of COLLECTIONS) for (const s of c.chars) (collectionsOf.get(s.ch) ?? collectionsOf.set(s.ch, []).get(s.ch)!).push(c);
