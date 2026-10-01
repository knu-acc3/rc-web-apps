// Symbols data generator.
// Sources: Unicode 16.0 character database (names, blocks — package @unicode/unicode-16.0.0), Unicode CLDR 48
// annotations (ru/en short names and keywords), the WHATWG HTML named character references (html-entities),
// Windows-1251/1252 code pages (Alt codes) and the hand-curated collections and Russian names next to this file.
// Output:
//   src/tools/symbols/symbols/data/symbols.json     – collections and per-character data (server only)
//   src/tools/symbols/symbols/data/client/unicode*.json – name index for the /unicode-table lookup tool (-> public/vendor/symbols)
//
// Run: node scripts/data/gen-symbols.mjs  (needs gen-emoji.mjs output for links to emoji pages)
// Packages are resolved from scripts/data/node_modules, the project node_modules, or DATA_PACKAGES_DIRS.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { COLLECTIONS } from "./gen-symbols-collections.mjs";
import { BLOCKS_RU, CYRILLIC, DISPLAY, LATEX, MAC, RU_NAMES, SLUGS } from "./gen-symbols-names.mjs";
import { patternRu } from "./gen-symbols-ru.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const bases = [here, root, ...(process.env.DATA_PACKAGES_DIRS ?? "").split(delimiter).filter(Boolean)].map((d) => join(d, "noop.js"));
function resolve(spec) {
  for (const b of bases) {
    try {
      return createRequire(b).resolve(spec);
    } catch {
      /* try next */
    }
  }
  throw new Error(`Cannot find ${spec}. Run: npm --prefix scripts/data install (or set DATA_PACKAGES_DIRS)`);
}
const load = (spec) => createRequire(resolve(spec))(resolve(spec));
const UCD = dirname(resolve("@unicode/unicode-16.0.0/package.json"));
const esm = async (rel) => (await import(pathToFileURL(join(UCD, rel)).href)).default;

/* ── Unicode data ── */
const NAMES = await esm("Names/index.mjs");
const BLOCKS = [];
for (const dir of readdirSync(join(UCD, "Block"))) {
  if (dir.includes(".")) continue;
  const ranges = await esm(`Block/${dir}/ranges.mjs`);
  // Folder names → official block names ("Greek_And_Coptic" → "Greek and Coptic", "Latin_Extended_A" → "Latin Extended-A").
  let name = dir
    .replace(/_/g, " ")
    .replace(/^Latin 1/, "Latin-1")
    .replace(/ (And|For|Of) /g, (m) => m.toLowerCase());
  if (!/Extension [A-Z]$/.test(name)) name = name.replace(/ ([A-Z])$/, "-$1");
  BLOCKS.push([ranges[0].begin, ranges[0].end - 1, name]);
}
BLOCKS.sort((a, b) => a[0] - b[0]);
const blockOf = (cp) => BLOCKS.findIndex(([a, b]) => cp >= a && cp <= b);

function unicodeName(cp) {
  const n = NAMES.get(cp);
  if (!n) return null;
  if (n.startsWith("CJK Ideograph")) return `CJK UNIFIED IDEOGRAPH-${cp.toString(16).toUpperCase()}`;
  return n;
}

const GC = ["Lu", "Ll", "Lt", "Lm", "Lo", "Mn", "Mc", "Me", "Nd", "Nl", "No", "Pc", "Pd", "Ps", "Pe", "Pi", "Pf", "Po", "Sm", "Sc", "Sk", "So", "Zs", "Zl", "Zp", "Cc", "Cf", "Co", "Cn"];
const GC_RE = GC.map((g) => [g, new RegExp(`^\\p{gc=${g}}$`, "u")]);
const gcOf = (ch) => GC_RE.find(([, re]) => re.test(ch))?.[0] ?? "Cn";
const EP = /^\p{Emoji_Presentation}$/u;

/* ── CLDR ── */
const CLDR = {
  en: load("cldr-annotations-full/annotations/en/annotations.json").annotations.annotations,
  ru: load("cldr-annotations-full/annotations/ru/annotations.json").annotations.annotations,
};

/* ── HTML entities: preferred name per character (HTML 4 names first, then the shortest). ── */
// The package only exports its entry point; the named-reference table is loaded by path.
const { namedReferences } = createRequire(import.meta.url)(join(dirname(resolve("html-entities/package.json")), "dist", "commonjs", "named-references.js"));
const html4 = new Set(Object.keys(namedReferences.html4.entities));
const entitiesOf = new Map();
for (const [ent, ch] of Object.entries(namedReferences.html5.entities)) {
  if (!ent.endsWith(";") || [...ch].length !== 1) continue;
  (entitiesOf.get(ch) ?? entitiesOf.set(ch, []).get(ch)).push(ent);
}
for (const list of entitiesOf.values()) list.sort((a, b) => Number(html4.has(b)) - Number(html4.has(a)) || a.length - b.length || a.localeCompare(b));

/* ── Windows code pages for Alt+0nnn ── */
function codePage(label) {
  const dec = new TextDecoder(label);
  const map = new Map();
  for (let b = 0x80; b <= 0xff; b++) {
    const ch = dec.decode(new Uint8Array([b]));
    if (ch !== "�" && !map.has(ch)) map.set(ch, b);
  }
  return map;
}
const CP1252 = codePage("windows-1252");
const CP1251 = codePage("windows-1251");

/* ── emoji pages (from gen-emoji.mjs output) ── */
const emojiData = JSON.parse(readFileSync(join(root, "src", "tools", "symbols", "emoji", "data", "emoji.json"), "utf8"));
const emojiSlug = new Map(emojiData.emoji.map((r) => [r[0].replace(/\u{FE0F}/gu, ""), r[1]]));

/* ── names ── */
function cyrillicRu(ch) {
  const lower = ch.toLowerCase();
  const entry = CYRILLIC[lower];
  if (!entry) return null;
  if (lower === "ӏ") return "палочка";
  const upper = ch.toUpperCase() !== ch;
  const letter = entry[0].replace(lower, upper ? lower : ch.toUpperCase());
  return `${ch === lower ? "строчная" : "заглавная"} буква ${ch === lower ? entry[0] : letter}`;
}
function ruName(ch, name) {
  return RU_NAMES[ch] ?? cyrillicRu(ch) ?? patternRu(name) ?? CLDR.ru[ch]?.tts?.[0] ?? null;
}
const kebab = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
function slugOf(ch, name, pairs) {
  if (SLUGS[ch]) return SLUGS[ch];
  if (pairs) {
    const m = /^(?:LATIN|GREEK|CYRILLIC) SMALL (?:LETTER|LIGATURE) (.+)$/.exec(name);
    if (m) return kebab(m[1]);
  }
  return kebab(name);
}

/* ── build ── */
const chars = {};
const usedBlocks = new Set();
const problems = [];
function addChar(ch) {
  const cp = ch.codePointAt(0);
  const key = cp.toString(16).toUpperCase();
  if (chars[key]) return;
  const name = unicodeName(cp);
  if (!name) return problems.push(`no Unicode name for U+${key}`);
  const ru = ruName(ch, name);
  if (!ru) problems.push(`no Russian name for ${ch} U+${key} ${name}`);
  const en = CLDR.en[ch];
  const rc = CLDR.ru[ch];
  const bi = blockOf(cp);
  usedBlocks.add(bi);
  const ext = {};
  const ents = entitiesOf.get(ch);
  if (ents) ext.e = ents.slice(0, 3);
  if (cp >= 0x80 && CP1252.has(ch)) ext.w = CP1252.get(ch);
  if (cp >= 0x80 && CP1251.has(ch)) ext.r = CP1251.get(ch);
  if (MAC[ch]) ext.m = MAC[ch];
  if (LATEX[ch]) ext.t = LATEX[ch];
  if (DISPLAY[ch]) ext.d = DISPLAY[ch];
  if (EP.test(ch)) ext.ep = 1;
  const em = emojiSlug.get(ch);
  if (em) ext.em = em;
  const kwEn = (en?.default ?? []).filter((k) => k !== en?.tts?.[0]);
  const kwRu = (rc?.default ?? []).filter((k) => k !== rc?.tts?.[0] && k !== ru);
  chars[key] = [name, ru ?? "", en?.tts?.[0] ?? "", kwEn.join("|"), kwRu.join("|"), gcOf(ch), bi];
  if (Object.keys(ext).length) chars[key].push(ext);
}

const homes = new Map();
const collections = COLLECTIONS.map((c) => {
  const list = [...c.chars];
  const seen = new Set();
  for (const ch of list) {
    if (seen.has(ch)) problems.push(`${c.id}: duplicate ${ch}`);
    seen.add(ch);
    addChar(ch);
  }
  const slugs = new Set();
  const pages = [...c.pages].map((ch) => {
    if (!seen.has(ch)) problems.push(`${c.id}: page ${ch} is not in chars`);
    if (EP.test(ch)) problems.push(`${c.id}: ${ch} has emoji presentation, it must link to /emoji`);
    if (homes.has(ch)) problems.push(`${ch} has pages in ${homes.get(ch)} and ${c.id}`);
    homes.set(ch, c.id);
    const cp = ch.codePointAt(0);
    const slug = slugOf(ch, unicodeName(cp), c.pairs);
    if (slugs.has(slug)) problems.push(`${c.id}: duplicate slug ${slug}`);
    slugs.add(slug);
    const pair = c.pairs && ch.toUpperCase() !== ch && [...ch.toUpperCase()].length === 1 ? ch.toUpperCase() : undefined;
    if (pair) addChar(pair);
    return pair ? [ch, slug, pair] : [ch, slug];
  });
  return { id: c.id, chars: list.join(""), pages };
});

if (problems.length) {
  console.error(problems.join("\n"));
  throw new Error(`gen-symbols: ${problems.length} problems`);
}

const blockList = [...usedBlocks].sort((a, b) => a - b);
const blockIndex = new Map(blockList.map((b, i) => [b, i]));
for (const v of Object.values(chars)) v[6] = blockIndex.get(v[6]);

const data = {
  source: "Unicode 16.0, Unicode CLDR 48, WHATWG HTML entities",
  blocks: blockList.map((b) => [...BLOCKS[b], BLOCKS_RU[BLOCKS[b][2]] ?? ""]),
  collections,
  chars,
};
const dataDir = join(root, "src", "tools", "symbols", "symbols", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "symbols.json"), JSON.stringify(data));

/* ── lookup index for /unicode-table ── */
const SMP = new Set([
  "Musical Symbols", "Mathematical Alphanumeric Symbols", "Mahjong Tiles", "Domino Tiles", "Playing Cards", "Enclosed Alphanumeric Supplement",
  "Miscellaneous Symbols and Pictographs", "Emoticons", "Ornamental Dingbats", "Transport and Map Symbols", "Alchemical Symbols",
  "Geometric Shapes Extended", "Supplemental Arrows-C", "Supplemental Symbols and Pictographs", "Chess Symbols",
  "Symbols and Pictographs Extended-A", "Symbols for Legacy Computing", "Tags", "Counting Rod Numerals", "Ancient Greek Numbers",
  "Ancient Symbols", "Tai Xuan Jing Symbols", "Byzantine Musical Symbols", "Ancient Greek Musical Notation", "Mayan Numerals",
]);
const SKIP = /^(CJK Unified Ideographs|CJK Compatibility Ideographs|Hangul Syllables|Yi Syllables|Private Use Area|High Surrogates|High Private Use Surrogates|Low Surrogates)/;
const lookupBlocks = BLOCKS.filter(([a, , n]) => (a < 0x10000 ? !SKIP.test(n) : SMP.has(n)));
const lines = [];
let prev = -1;
let count = 0;
for (const [a, b] of lookupBlocks) {
  for (let cp = a; cp <= b; cp++) {
    const n = NAMES.get(cp);
    if (!n || n.startsWith("<") || n.startsWith("CJK Ideograph") || n.startsWith("Hangul Syllable")) continue;
    lines.push(`${(cp - prev).toString(36)} ${n}`);
    prev = cp;
    count++;
  }
}
const pagePaths = {};
for (const c of collections) for (const [ch, slug] of c.pages) pagePaths[ch.codePointAt(0).toString(36)] = `${c.id}/${slug}`;
const emojiPaths = {};
for (const [g, slug] of emojiSlug) if ([...g].length === 1) emojiPaths[g.codePointAt(0).toString(36)] = slug;
const ents = {};
for (const [ch, list] of entitiesOf) if ([...ch].length === 1) ents[ch.codePointAt(0).toString(36)] = list[0].slice(1, -1);
const ruIndex = {};
for (const [k, v] of Object.entries(chars)) if (v[1]) ruIndex[parseInt(k, 16).toString(36)] = v[1];
for (const [ch, a] of Object.entries(CLDR.ru)) if ([...ch].length === 1 && a.tts && !EP.test(ch)) ruIndex[ch.codePointAt(0).toString(36)] ??= a.tts[0];
const ruBlocks = {};
for (const [a, , n] of lookupBlocks) if (BLOCKS_RU[n]) ruBlocks[a.toString(36)] = BLOCKS_RU[n];
// Committed in src/tools/symbols/symbols/data/client/ and copied to public/vendor/symbols/ by scripts/vendor-symbols.mjs.
const files = {
  "unicode.json": JSON.stringify({ v: "16.0", b: lookupBlocks.map(([a, b, n]) => [a, b, n]), n: lines.join("\n"), p: pagePaths, em: emojiPaths, e: ents }),
  "unicode-ru.json": JSON.stringify({ n: ruIndex, b: ruBlocks }),
};
for (const dir of [join(dataDir, "client"), join(root, "public", "vendor", "symbols")]) {
  mkdirSync(dir, { recursive: true });
  for (const [f, json] of Object.entries(files)) writeFileSync(join(dir, f), json);
}

const pageCount = collections.reduce((s, c) => s + c.pages.length, 0);
console.log(`symbols: ${collections.length} collections, ${Object.keys(chars).length} characters, ${pageCount} pages; lookup index ${count} characters`);
