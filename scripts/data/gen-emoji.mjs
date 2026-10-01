// Emoji data generator.
// Sources: emojibase-data 17 (order, groups, versions, shortcodes, skin tones) +
// Unicode CLDR 48 annotations (ru/en names and keywords, the authoritative translations).
// Output:
//   src/tools/symbols/emoji/data/emoji.json        – compact server-side data (never shipped to the client)
//   src/tools/symbols/emoji/data/client/index-{ru,en}.json – search index lazily loaded by the /emoji hub (-> public/vendor/emoji)
//
// Run: node scripts/data/gen-emoji.mjs
// Packages are resolved from scripts/data/node_modules (npm --prefix scripts/data install) or from the
// directories listed in DATA_PACKAGES_DIRS (path-delimiter separated folders that contain node_modules).
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");

function load(spec) {
  const bases = [join(here, "noop.js"), ...(process.env.DATA_PACKAGES_DIRS ?? "").split(delimiter).filter(Boolean).map((d) => join(d, "noop.js"))];
  for (const b of bases) {
    try {
      return createRequire(b)(spec);
    } catch {
      /* try next */
    }
  }
  throw new Error(`Cannot load ${spec}. Run: npm --prefix scripts/data install (or set DATA_PACKAGES_DIRS)`);
}

/** Maximum emoji version included (the Unicode 16 emoji set). */
export const MAX_VERSION = 16;

const EN = load("emojibase-data/en/data.json");
const RU_EB = load("emojibase-data/ru/data.json");
const GH = load("emojibase-data/en/shortcodes/github.json");
const SLACK = load("emojibase-data/en/shortcodes/iamcal.json");
const CLDR = {
  en: { ...load("cldr-annotations-full/annotations/en/annotations.json").annotations.annotations, ...load("cldr-annotations-derived-full/annotationsDerived/en/annotations.json").annotationsDerived.annotations },
  ru: { ...load("cldr-annotations-full/annotations/ru/annotations.json").annotations.annotations, ...load("cldr-annotations-derived-full/annotationsDerived/ru/annotations.json").annotationsDerived.annotations },
};
const CONTAIN = load("cldr-core/supplemental/territoryContainment.json").supplemental.territoryContainment;
const EB_VERSION = load("emojibase-data/package.json").version;
const CLDR_VERSION = load("cldr-annotations-full/package.json").version;

/** Russian names that differ from the everyday name; the CLDR name is kept as an alternative. */
const RU_OVERRIDE = { "❤️": "красное сердце" };

/** Slugs that are namespaces of the /emoji section and can never be emoji slugs. */
export const RESERVED = new Set(["group", "subgroup", "topic", "search", "all", "list"]);

const GROUP_KEYS = ["smileys-emotion", "people-body", "component", "animals-nature", "food-drink", "travel-places", "activities", "objects", "symbols", "flags"];
// Emoji `subgroup` numbers are message `order` values. Two messages share order 46 (the retired
// "food-marine" and "food-sweet"); the later one wins, exactly as in emojibase itself.
const SUBGROUP_KEYS = {};
for (const s of load("emojibase-data/en/messages.json").subgroups) SUBGROUP_KEYS[s.order] = s.key;
const HAIR = { 0x1f9b0: "red", 0x1f9b1: "curly", 0x1f9b2: "bald", 0x1f9b3: "white" };

const cps = (s) => [...s].map((c) => c.codePointAt(0));
const strip = (s) => s.replace(/\u{FE0F}/gu, "");
const EP = /^\p{Emoji_Presentation}$/u;

/** Fully-qualified form (UTS #51): drop redundant U+FE0F after characters with emoji presentation. */
function qualify(s) {
  const out = [];
  for (const c of s) {
    if (c === "\u{FE0F}" && out.length && EP.test(out[out.length - 1])) continue;
    out.push(c);
  }
  return out.join("");
}

export function slugify(label) {
  return label
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[’'`]/g, "")
    .replace(/&/g, " and ")
    .replace(/#/g, " number sign ")
    .replace(/\*/g, " asterisk ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cldr(locale, glyph) {
  return CLDR[locale][strip(glyph)];
}

/* ── flag regions (UN M49 via CLDR territory containment) ── */
const CONTINENTS = { "150": "europe", "142": "asia", "002": "africa", "019": "americas", "009": "oceania" };
const regionOf = new Map();
function expand(code, cont) {
  const node = CONTAIN[code];
  if (!node) {
    if (/^[A-Z]{2}$/.test(code) && !regionOf.has(code)) regionOf.set(code, cont);
    return;
  }
  for (const c of node._contains) if (c !== "QO") expand(c, cont);
}
for (const [code, cont] of Object.entries(CONTINENTS)) expand(code, cont);
function flagCode(glyph) {
  const c = cps(glyph);
  if (c.length !== 2 || c.some((x) => x < 0x1f1e6 || x > 0x1f1ff)) return null;
  return String.fromCharCode(...c.map((x) => x - 0x1f1e6 + 65));
}

/* ── build ── */
const ruByHex = new Map(RU_EB.map((e) => [e.hexcode, e]));
const scList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const kw = (list, name) => (list ?? []).filter((k) => k && k !== name && !/^[,\s]+$/.test(k));

function names(e) {
  const glyph = qualify(e.emoji);
  const en = cldr("en", glyph)?.tts?.[0] ?? e.label;
  // CLDR 48 derives "facing right" names with an empty slot: "человек идет: , направленные вправо".
  const cldrRu = (cldr("ru", glyph)?.tts?.[0] ?? ruByHex.get(e.hexcode)?.label)?.replace(/: , направленн\S* вправо$/, ", лицом вправо");
  if (!cldrRu) throw new Error(`No Russian name for ${glyph} ${e.label}`);
  const ru = RU_OVERRIDE[glyph] ?? cldrRu;
  return { glyph, en, ru, ruAlt: ru !== cldrRu ? cldrRu : undefined };
}

function toneLabel(tone) {
  return Array.isArray(tone) ? tone.join("-") : String(tone);
}

const all = EN.filter((e) => e.group !== undefined && e.group !== 2 && e.version <= MAX_VERSION);
const hairOf = (e) => cps(e.emoji).find((c) => HAIR[c]);

// Hair-style variants (man: red hair, …) are shown on their base emoji page.
const baseEmoji = all.filter((e) => !hairOf(e));
const hairVariants = all.filter((e) => hairOf(e));

const subgroupsUsed = [...new Set(baseEmoji.map((e) => e.subgroup))].sort((a, b) => a - b);
const groupsUsed = [...new Set(baseEmoji.map((e) => e.group))].sort((a, b) => a - b);
const groupIdx = new Map(groupsUsed.map((g, i) => [g, i]));
const subIdx = new Map(subgroupsUsed.map((s, i) => [s, i]));

const slugs = new Set();
const out = [];
const byBase = new Map();
for (const e of baseEmoji.sort((a, b) => a.order - b.order)) {
  const n = names(e);
  let slug = slugify(n.en);
  if (!slug || RESERVED.has(slug)) slug = `${slug || "emoji"}-emoji`;
  let unique = slug;
  for (let i = 2; slugs.has(unique); i++) unique = `${slug}-${i}`;
  if (unique !== slug) console.warn(`slug collision: ${slug} → ${unique}`);
  slugs.add(unique);

  const ext = {};
  const gh = scList(GH[e.hexcode]);
  const sl = scList(SLACK[e.hexcode]);
  if (gh.length || sl.length) ext.sc = [gh, sl];
  if (e.skins?.length) ext.sk = e.skins.filter((s) => s.version <= MAX_VERSION).map((s) => [qualify(s.emoji), toneLabel(s.tone)]);
  if (e.emoticon) ext.emo = scList(e.emoticon);
  if (e.type === 0) ext.t = 1;
  if (n.ruAlt) ext.ruAlt = n.ruAlt;
  const fc = flagCode(n.glyph);
  if (fc) {
    ext.cc = fc;
    if (regionOf.has(fc)) ext.rg = regionOf.get(fc);
  }
  const row = [
    n.glyph,
    unique,
    subIdx.get(e.subgroup),
    e.version,
    n.en,
    n.ru,
    kw(cldr("en", n.glyph)?.default ?? e.tags, n.en).join("|"),
    kw(cldr("ru", n.glyph)?.default ?? ruByHex.get(e.hexcode)?.tags, n.ru).join("|"),
  ];
  if (Object.keys(ext).length) row.push(ext);
  out.push(row);
  byBase.set(strip(n.glyph), row);
}

for (const e of hairVariants) {
  const n = names(e);
  const c = cps(strip(n.glyph));
  const baseCps = c.filter((x, i) => !HAIR[x] && !(x === 0x200d && HAIR[c[i + 1]]));
  const base = byBase.get(String.fromCodePoint(...baseCps));
  if (!base) throw new Error(`No base for hair variant ${n.glyph}`);
  if (!base[8]) base[8] = {};
  (base[8].hair ??= []).push([n.glyph, HAIR[hairOf(e)], n.en, n.ru, (e.skins ?? []).filter((s) => s.version <= MAX_VERSION).map((s) => qualify(s.emoji))]);
}

const TONES = [0x1f3fb, 0x1f3fc, 0x1f3fd, 0x1f3fe, 0x1f3ff].map((c) => String.fromCodePoint(c));
const data = {
  source: `emojibase-data ${EB_VERSION}, Unicode CLDR ${CLDR_VERSION}, Emoji ≤ ${MAX_VERSION}.0`,
  groups: groupsUsed.map((g) => GROUP_KEYS[g]),
  subgroups: subgroupsUsed.map((s) => [SUBGROUP_KEYS[s], groupIdx.get(baseEmoji.find((e) => e.subgroup === s).group)]),
  tones: { ru: TONES.map((t) => cldr("ru", t).tts[0]), en: TONES.map((t) => cldr("en", t).tts[0]) },
  emoji: out,
};

// Sanity checks for the group/subgroup mapping.
for (const [glyph, sub] of [["🍦", "food-sweet"], ["🇰🇿", "country-flag"], ["⌚", "time"], ["😀", "face-smiling"], ["🏁", "flag"], ["⚽", "sport"]]) {
  const row = out.find((r) => strip(r[0]) === strip(glyph));
  if (data.subgroups[row[2]][0] !== sub) throw new Error(`${glyph} expected in ${sub}, got ${data.subgroups[row[2]][0]}`);
}

const dataDir = join(root, "src", "tools", "symbols", "emoji", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(join(dataDir, "emoji.json"), JSON.stringify(data));

/* ── client search index: [glyph, slug, name, search text, group index] ──
   Committed in src/tools/symbols/emoji/data/client/ and copied to public/vendor/emoji/ by scripts/vendor-emoji.mjs. */
const clientDir = join(dataDir, "client");
const vendor = join(root, "public", "vendor", "emoji");
mkdirSync(clientDir, { recursive: true });
mkdirSync(vendor, { recursive: true });
for (const locale of ["ru", "en"]) {
  const rows = out.map((r) => {
    const ext = r[8] ?? {};
    const words = new Set([...(locale === "ru" ? r[7] : r[6]).split("|"), ...(locale === "ru" ? [r[4]] : []), ...(ext.sc?.flat() ?? []).map((s) => `:${s}:`)]);
    words.delete("");
    const name = locale === "ru" ? r[5] : r[4];
    return [r[0], r[1], name, [...words].join(" ").toLowerCase(), data.subgroups[r[2]][1]];
  });
  const json = JSON.stringify({ g: data.groups, e: rows });
  writeFileSync(join(clientDir, `index-${locale}.json`), json);
  writeFileSync(join(vendor, `index-${locale}.json`), json);
}

console.log(`emoji: ${out.length} pages, ${data.groups.length} groups, ${data.subgroups.length} subgroups, ${hairVariants.length} hair variants`);
