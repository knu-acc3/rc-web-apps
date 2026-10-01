/**
 * Placeholder text generator (Lorem Ipsum and "рыба"). Deterministic for a
 * given seed so the server can render real text and the client can hydrate it;
 * "generate again" just picks a new seed from crypto.getRandomValues.
 */
import {
  EN_ADJECTIVES,
  EN_CONJUNCTIONS,
  EN_NOUNS,
  EN_OPENERS,
  EN_VERBS,
  LATIN,
  LATIN_OPENING,
  RU_ADJECTIVES,
  RU_CONJUNCTIONS,
  RU_NOUNS,
  RU_OPENERS,
  RU_VERBS,
} from "./loremWords";

export type LoremLang = "latin" | "russian" | "cyrillic" | "english";
export type LoremUnit = "paragraphs" | "sentences" | "words" | "list";

/** mulberry32 — small, fast, deterministic PRNG. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rnd = () => number;
const pick = <T,>(r: Rnd, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
const between = (r: Rnd, a: number, b: number) => a + Math.floor(r() * (b - a + 1));
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ───────────── Latin / Cyrillic lorem ───────────── */

/** Phonetic Latin → Cyrillic used for the classic "Лорем ипсум долор сит амет". */
export function latinToCyrillicLorem(word: string): string {
  let out = "";
  const w = word.toLowerCase();
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    const n = w[i + 1] ?? "";
    const prev = w[i - 1] ?? "";
    if (c === "q" && n === "u") {
      out += "кв";
      i++;
    } else if (c === "p" && n === "h") {
      out += "ф";
      i++;
    } else if (c === "c" && n === "h") {
      out += "х";
      i++;
    } else if (c === "t" && n === "h") {
      out += "т";
      i++;
    } else if (c === "c") out += /[eiy]/.test(n) ? "ц" : "к";
    else if (c === "e") out += !prev || /[aeiouy]/.test(prev) ? "э" : "е";
    else out += ({ a: "а", b: "б", d: "д", f: "ф", g: "г", h: "х", i: "и", j: "й", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", r: "р", s: "с", t: "т", u: "у", v: "в", w: "в", x: "кс", y: "и", z: "з" } as Record<string, string>)[c] ?? c;
  }
  return out;
}

const CYRILLIC = LATIN.map(latinToCyrillicLorem);
const CYRILLIC_OPENING = "Лорем ипсум долор сит амет, консектетур адиписцинг элит, сед до эиусмод темпор инцидидунт ут лаборе эт долоре магна аликва.";

function loremSentence(r: Rnd, vocab: readonly string[]): string {
  const n = between(r, 6, 14);
  const words: string[] = [];
  const commaAt = n > 8 && r() < 0.6 ? between(r, 3, n - 3) : -1;
  for (let i = 0; i < n; i++) {
    let w = pick(r, vocab);
    if (i > 0 && w === words[i - 1]) w = pick(r, vocab);
    words.push(i === commaAt ? `${w},` : w);
  }
  return `${cap(words.join(" "))}${r() < 0.08 ? "?" : "."}`;
}

/* ───────────── Russian ───────────── */

type Gender = "m" | "f" | "n";

/** Adjective forms: [masc nom, fem nom, neut nom, fem acc]. */
export function ruAdjForms(masc: string): [string, string, string, string] {
  const stem = masc.slice(0, -2);
  const end = masc.slice(-2);
  if (end === "ий" && !/[гкхжшчщ]$/.test(stem)) return [masc, stem + "яя", stem + "ее", stem + "юю"];
  const neut = end === "ий" && /[жшчщ]$/.test(stem) ? stem + "ее" : stem + "ое";
  return [masc, stem + "ая", neut, stem + "ую"];
}

/** Accusative of an inanimate noun. */
export function ruNounAcc(noun: string, g: Gender): string {
  if (g !== "f") return noun;
  if (noun.endsWith("а")) return noun.slice(0, -1) + "у";
  if (noun.endsWith("я")) return noun.slice(0, -1) + "ю";
  return noun;
}

const RU_ALL_NOUNS: [string, Gender][] = (["m", "f", "n"] as Gender[]).flatMap((g) => RU_NOUNS[g].map((n) => [n, g] as [string, Gender]));

function ruNP(r: Rnd, kase: "nom" | "acc", withAdj = true): string {
  const [noun, g] = pick(r, RU_ALL_NOUNS);
  const n = kase === "acc" ? ruNounAcc(noun, g) : noun;
  if (!withAdj) return n;
  const f = ruAdjForms(pick(r, RU_ADJECTIVES));
  const adj = g === "m" ? f[0] : g === "n" ? f[2] : kase === "acc" ? f[3] : f[1];
  return `${adj} ${n}`;
}

function ruClause(r: Rnd): string {
  return `${ruNP(r, "nom", r() < 0.7)} ${pick(r, RU_VERBS)[0]} ${ruNP(r, "acc", r() < 0.75)}`;
}

function ruSentence(r: Rnd): string {
  const k = r();
  let s: string;
  if (k < 0.3) s = ruClause(r);
  else if (k < 0.5) s = `${pick(r, RU_OPENERS)} ${ruClause(r)}`;
  else if (k < 0.62) s = `${ruNP(r, "nom", r() < 0.6)} и ${ruNP(r, "nom", r() < 0.4)} ${pick(r, RU_VERBS)[1]} ${ruNP(r, "acc")}`;
  else if (k < 0.74) s = `${ruClause(r)}${pick(r, RU_CONJUNCTIONS)} ${ruClause(r)}`;
  else if (k < 0.84) s = `${ruNP(r, "nom")} ${pick(r, RU_VERBS)[0]} не только ${ruNP(r, "acc", r() < 0.5)}, но и ${ruNP(r, "acc")}`;
  else if (k < 0.94) s = `${ruNP(r, "nom")} — это ${ruNP(r, "nom")}`;
  else {
    const s2 = `Что ${pick(r, RU_VERBS)[0]} ${ruNP(r, "acc")}`;
    return `${s2}?`;
  }
  return `${cap(s)}.`;
}

/* ───────────── English ───────────── */

const EN_ADJ = [...new Set(EN_ADJECTIVES)];
const art = (w: string) => (/^(?:[aeio]|u(?!ni|s|ti))/i.test(w) ? "an" : "a");

function enNP(r: Rnd, withAdj = true, article: "the" | "a" = "the"): string {
  const noun = pick(r, EN_NOUNS);
  const phrase = withAdj ? `${pick(r, EN_ADJ)} ${noun}` : noun;
  return article === "a" ? `${art(phrase)} ${phrase}` : `the ${phrase}`;
}

function enClause(r: Rnd): string {
  return `${enNP(r, r() < 0.7)} ${pick(r, EN_VERBS)[0]} ${enNP(r, r() < 0.75)}`;
}

function enSentence(r: Rnd): string {
  const k = r();
  let s: string;
  if (k < 0.3) s = enClause(r);
  else if (k < 0.5) s = `${pick(r, EN_OPENERS)} ${enClause(r)}`;
  else if (k < 0.62) s = `${enNP(r, r() < 0.6)} and ${enNP(r, r() < 0.4)} ${pick(r, EN_VERBS)[1]} ${enNP(r)}`;
  else if (k < 0.74) s = `${enClause(r)}${pick(r, EN_CONJUNCTIONS)} ${enClause(r)}`;
  else if (k < 0.84) s = `${enNP(r)} ${pick(r, EN_VERBS)[0]} not only ${enNP(r, r() < 0.5)} but also ${enNP(r)}`;
  else if (k < 0.94) s = `${enNP(r)} is ${enNP(r, true, "a")}`;
  else return `What ${pick(r, EN_VERBS)[0]} ${enNP(r)}?`;
  return `${cap(s)}.`;
}

/* ───────────── public API ───────────── */

function sentenceFor(lang: LoremLang, r: Rnd): string {
  if (lang === "russian") return ruSentence(r);
  if (lang === "english") return enSentence(r);
  return loremSentence(r, lang === "cyrillic" ? CYRILLIC : LATIN);
}

function listItem(lang: LoremLang, r: Rnd): string {
  if (lang === "russian") return cap(r() < 0.5 ? ruNP(r, "nom") : `${ruNP(r, "nom")} и ${ruNP(r, "nom", false)}`);
  if (lang === "english") return cap(`${pick(r, EN_ADJ)} ${pick(r, EN_NOUNS)}${r() < 0.5 ? ` and ${pick(r, EN_NOUNS)}` : ""}`);
  const vocab = lang === "cyrillic" ? CYRILLIC : LATIN;
  return cap(Array.from({ length: between(r, 2, 5) }, () => pick(r, vocab)).join(" "));
}

interface LoremOptions {
  lang: LoremLang;
  unit: LoremUnit;
  count: number;
  seed: number;
  /** Start with the classic "Lorem ipsum dolor sit amet…" (Latin and Cyrillic). */
  classicStart?: boolean;
}

/** Returns blocks: paragraphs (or list items / a single block for words/sentences). */
export function generateLorem(o: LoremOptions): string[] {
  const r = prng(o.seed);
  const count = Math.max(1, Math.min(o.unit === "words" ? 10000 : 500, Math.floor(o.count)));
  const opening = o.classicStart && (o.lang === "latin" || o.lang === "cyrillic") ? (o.lang === "latin" ? LATIN_OPENING : CYRILLIC_OPENING) : null;

  if (o.unit === "list") return Array.from({ length: count }, () => listItem(o.lang, r));

  if (o.unit === "sentences") {
    const out: string[] = [];
    if (opening) out.push(opening);
    while (out.length < count) out.push(sentenceFor(o.lang, r));
    return [out.slice(0, count).join(" ")];
  }

  if (o.unit === "words") {
    const words: string[] = opening ? opening.split(" ") : [];
    while (words.length < count) words.push(...sentenceFor(o.lang, r).split(" "));
    const cut = words.slice(0, count);
    cut[cut.length - 1] = cut[cut.length - 1].replace(/[,;:—–-]+$/, "").replace(/[.?!]?$/, ".");
    return [cut.join(" ")];
  }

  return Array.from({ length: count }, (_, i) => {
    const n = between(r, 4, 7);
    const sents = Array.from({ length: n }, () => sentenceFor(o.lang, r));
    if (i === 0 && opening) sents[0] = opening;
    return sents.join(" ");
  });
}

export function loremToText(blocks: string[], unit: LoremUnit, listStyle: "bullets" | "numbers" = "bullets"): string {
  if (unit === "list") return blocks.map((b, i) => (listStyle === "numbers" ? `${i + 1}. ${b}` : `• ${b}`)).join("\n");
  return blocks.join("\n\n");
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function loremToHtml(blocks: string[], unit: LoremUnit, listStyle: "bullets" | "numbers" = "bullets"): string {
  if (unit === "list") {
    const tag = listStyle === "numbers" ? "ol" : "ul";
    return `<${tag}>\n${blocks.map((b) => `  <li>${esc(b)}</li>`).join("\n")}\n</${tag}>`;
  }
  return blocks.map((b) => `<p>${esc(b)}</p>`).join("\n");
}

/** Fresh seed for "generate again" (never called during render). */
export function randomSeed(): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0];
}
