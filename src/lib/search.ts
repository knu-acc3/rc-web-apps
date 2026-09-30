/** Compact search entry: [title, path, hint, keywords, glyph, weight, section hue] */
export type PackedEntry = [string, string, string, string, string, number, number?];

const RU = "йцукенгшщзхъфывапролджэячсмитьбю";
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const toRu = new Map<string, string>();
const toEn = new Map<string, string>();
for (let i = 0; i < RU.length; i++) {
  toRu.set(EN[i], RU[i]);
  toEn.set(RU[i], EN[i]);
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s#%+.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function switchLayout(s: string): string {
  const hasLatin = /[a-z]/.test(s);
  const map = hasLatin ? toRu : toEn;
  return s.split("").map((c) => map.get(c) ?? c).join("");
}

function translit(s: string): string {
  return s.split("").map((c) => TRANSLIT[c] ?? c).join("");
}

export interface IndexedEntry {
  title: string;
  path: string;
  hint: string;
  glyph: string;
  weight: number;
  hue: number;
  hay: string;
  titleN: string;
}

export function prepare(entries: PackedEntry[]): IndexedEntry[] {
  return entries.map(([title, path, hint, keywords, glyph, weight, hue]) => {
    const titleN = normalize(title);
    return { title, path, hint, glyph, weight, hue: hue ?? 225, titleN, hay: `${titleN} ${normalize(keywords)} ${translit(titleN)} ${normalize(hint)}` };
  });
}

function scoreOne(e: IndexedEntry, q: string, tokens: string[]): number {
  let s = 0;
  if (e.titleN === q) s += 120;
  else if (e.titleN.startsWith(q)) s += 90;
  else if (e.titleN.includes(" " + q)) s += 70;
  else if (e.titleN.includes(q)) s += 50;
  let all = true;
  for (const t of tokens) {
    if (e.titleN.includes(t)) s += 12;
    else if (e.hay.includes(t)) s += 6;
    else all = false;
  }
  if (!all) return s >= 50 ? s : 0;
  return s + 5 + e.weight * 3;
}

export function searchIndex(index: IndexedEntry[], query: string, limit = 40): IndexedEntry[] {
  const q = normalize(query);
  if (!q) return [];
  const variants = Array.from(new Set([q, switchLayout(q), translit(q)])).filter(Boolean);
  const scored: { e: IndexedEntry; s: number }[] = [];
  for (const e of index) {
    let best = 0;
    for (const v of variants) {
      const sc = scoreOne(e, v, v.split(" ").filter(Boolean));
      if (sc > best) best = sc;
    }
    if (best > 0) scored.push({ e, s: best });
  }
  scored.sort((a, b) => b.s - a.s || a.e.title.length - b.e.title.length);
  return scored.slice(0, limit).map((x) => x.e);
}
