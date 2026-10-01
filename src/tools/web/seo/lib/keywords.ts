/* Keyword density: tokenisation with ё→е, RU/EN stop words, light stemming and 1–3-grams
   that never cross sentence boundaries or start/end with a stop word. */

const STOP_RU = new Set(
  (
    "а без более бы был была были было быть в вам вас ведь весь во вот все всё всего всех вы где да даже для до его ее её ей ему если есть еще ещё же за и из или им их к как какая какой когда кто ли либо мне может мы на над надо наш не него нее неё нет ни них но ну о об однако он она они оно от очень по под после при про раз с свой свою себя со так также такой там те тем то того тоже той только том ты у уже хотя чего чей чем что чтобы чье эта эти это этого этой этом этот я ваш ваша ваше ваши будет будут может можно нужно тот та тех этих всем всеми между через потому поэтому где-то кто-то что-то тоже здесь тут него нам нас им ими ему ей её вами тебе тебя себе меня мой моя мое моё мои твой твоя твое твоё твои наша наше наши который которая которое которые которых котором которой которого"
  )
    .split(/\s+/)
    .map((w) => w.replace(/ё/g, "е")),
);

const STOP_EN = new Set(
  "a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves also may might must shall one ones us let get got".split(
    " ",
  ),
);

function isStop(w: string): boolean {
  return STOP_RU.has(w) || STOP_EN.has(w);
}

const RU_SUFFIXES = [
  "иями", "ями", "ами", "иях", "ях", "ах", "ием", "ьем", "ем", "ом", "ией", "ей", "ой", "ий", "ый", "ой", "ая", "яя", "ое", "ее", "ие", "ые",
  "ого", "его", "ому", "ему", "ыми", "ими", "ых", "их", "ую", "юю", "ть", "ешь", "ет", "ем", "ете", "ут", "ют", "ат", "ят", "ишь", "ит", "им", "ите",
  "ал", "ала", "ало", "али", "ил", "ила", "ило", "или", "ел", "ела", "ело", "ели", "ов", "ев", "ей", "ия", "ья", "ию", "ью", "ии", "ьи",
  "а", "я", "о", "е", "ы", "и", "у", "ю", "ь", "й",
].sort((a, b) => b.length - a.length);

/** A very light stemmer: strips common inflection endings so that word forms group together. */
export function stem(w: string): string {
  if (/^[а-я-]+$/.test(w)) {
    if (w.length <= 3) return w;
    for (const s of RU_SUFFIXES) if (w.endsWith(s) && w.length - s.length >= 3) return w.slice(0, -s.length);
    return w;
  }
  if (/^[a-z'-]+$/.test(w)) {
    if (w.length <= 3) return w;
    if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
    if (w.endsWith("sses")) return w.slice(0, -2);
    if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
    if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
    if (w.endsWith("es") && /(s|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
    if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) return w.slice(0, -1);
    return w;
  }
  return w;
}

/** Sentences → lists of normalised words (lower case, ё→е, apostrophes kept inside words). */
export function tokenize(text: string): string[][] {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(/[.!?…;:\n\r]+|\s[—–-]\s/)
    .map((s) => (s.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).map((w) => w.replace(/’/g, "'")))
    .filter((s) => s.length);
}

interface Phrase {
  phrase: string;
  count: number;
  density: number;
}

interface Analysis {
  words: number;
  unique: number;
  stopShare: number;
  nausea: number;
  chars: number;
  charsNoSpaces: number;
  grams: Record<1 | 2 | 3, Phrase[]>;
}

/** Keyword statistics. `stemming` groups word forms; the most frequent form labels the group. */
export function analyze(text: string, opts: { stemming?: boolean; stopWords?: boolean } = {}): Analysis {
  const stemming = opts.stemming ?? true;
  const dropStop = opts.stopWords ?? true;
  const sentences = tokenize(text);
  const all = sentences.flat().filter((w) => !/^\d+$/.test(w));
  const words = all.length;
  const stops = all.filter(isStop).length;
  const grams = { 1: [] as Phrase[], 2: [] as Phrase[], 3: [] as Phrase[] };

  for (const n of [1, 2, 3] as const) {
    const counts = new Map<string, { count: number; forms: Map<string, number> }>();
    for (const s of sentences) {
      for (let i = 0; i + n <= s.length; i++) {
        const g = s.slice(i, i + n);
        if (g.some((w) => /^\d+$/.test(w))) continue;
        if (dropStop && (isStop(g[0]) || isStop(g[n - 1]))) continue;
        if (n === 1 && g[0].length < 2) continue;
        const key = (stemming ? g.map(stem) : g).join(" ");
        const form = g.join(" ");
        const e = counts.get(key) ?? { count: 0, forms: new Map() };
        e.count++;
        e.forms.set(form, (e.forms.get(form) ?? 0) + 1);
        counts.set(key, e);
      }
    }
    grams[n] = [...counts.values()]
      .filter((e) => n === 1 || e.count > 1)
      .map((e) => ({
        phrase: [...e.forms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
        count: e.count,
        density: words ? (e.count * n * 100) / words : 0,
      }))
      .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));
  }
  const top = grams[1][0]?.count ?? 0;
  return {
    words,
    unique: new Set(all.map((w) => (stemming ? stem(w) : w))).size,
    stopShare: words ? (stops * 100) / words : 0,
    nausea: Math.sqrt(top),
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, "").length,
    grams,
  };
}
