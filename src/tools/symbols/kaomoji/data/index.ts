import type { L10n, L10nList } from "@/i18n/config";
import { ACTIONS } from "./actions";
import { ANIMALS } from "./animals";
import { EMOTIONS } from "./emotions";
import { FAMOUS } from "./famous";
import { MOODS } from "./moods";

export { DISAPPROVAL, LENNY, SHRUG, TABLE_BACK, TABLE_FLIP } from "./famous";

export interface KaomojiCategory {
  slug: string;
  /** Chip label. */
  name: L10n;
  /** Extra search words (both languages are searched regardless of the UI locale). */
  keywords: L10nList;
  /** Short signature kaomoji used in titles. */
  sample: string;
  items: readonly string[];
}

type Meta = Omit<KaomojiCategory, "items">;

/** Display order of categories. */
const META: Meta[] = [
  { slug: "joy", name: { ru: "Радость", en: "Happy" }, sample: "(≧▽≦)", keywords: { ru: ["радость", "счастье", "улыбка", "весёлые", "веселье", "позитив"], en: ["happy", "joy", "smile", "cheerful", "glad"] } },
  { slug: "love", name: { ru: "Любовь", en: "Love" }, sample: "(♡°▽°♡)", keywords: { ru: ["любовь", "сердце", "сердечки", "влюблённые", "нежность", "милые"], en: ["love", "heart", "crush", "cute", "affection"] } },
  { slug: "excited", name: { ru: "Восторг", en: "Excited" }, sample: "＼(＾▽＾)／", keywords: { ru: ["восторг", "ура", "праздник", "ликование", "победа"], en: ["excited", "yay", "hooray", "celebrate", "cheer"] } },
  { slug: "sad", name: { ru: "Грусть", en: "Sad" }, sample: "(︶︹︺)", keywords: { ru: ["грусть", "грустные", "печаль", "тоска", "уныние", "отчаяние"], en: ["sad", "unhappy", "down", "despair", "gloomy"] } },
  { slug: "crying", name: { ru: "Слёзы", en: "Crying" }, sample: "(╥﹏╥)", keywords: { ru: ["слёзы", "слезы", "плачет", "плач", "рыдает"], en: ["crying", "cry", "tears", "sob", "weep"] } },
  { slug: "angry", name: { ru: "Злость", en: "Angry" }, sample: "(＃`Д´)", keywords: { ru: ["злость", "злой", "злые", "гнев", "бешенство", "раздражение"], en: ["angry", "mad", "rage", "furious", "annoyed"] } },
  { slug: "surprised", name: { ru: "Удивление", en: "Surprised" }, sample: "(⊙_⊙)", keywords: { ru: ["удивление", "шок", "изумление", "испуг"], en: ["surprised", "shocked", "shock", "wow", "amazed"] } },
  { slug: "shy", name: { ru: "Смущение", en: "Shy" }, sample: "(⁄ ⁄•⁄ω⁄•⁄ ⁄)", keywords: { ru: ["смущение", "стеснение", "стесняется", "краснеет", "румянец"], en: ["shy", "blush", "bashful", "flustered"] } },
  { slug: "embarrassed", name: { ru: "Неловкость", en: "Embarrassed" }, sample: "(^_^;)", keywords: { ru: ["неловкость", "неловко", "капля пота", "вина", "упс"], en: ["embarrassed", "awkward", "sweat drop", "nervous", "oops"] } },
  { slug: "confused", name: { ru: "Растерянность", en: "Confused" }, sample: "(o_O)", keywords: { ru: ["растерянность", "непонимание", "замешательство", "что"], en: ["confused", "puzzled", "what", "huh", "baffled"] } },
  { slug: "thinking", name: { ru: "Раздумья", en: "Thinking" }, sample: "( ˘･з･)", keywords: { ru: ["раздумья", "думает", "мысли", "задумчивость", "идея"], en: ["thinking", "thought", "pondering", "idea", "hmm"] } },
  { slug: "tired", name: { ru: "Усталость", en: "Tired" }, sample: "_(:3 」∠)_", keywords: { ru: ["усталость", "устал", "лень", "без сил", "вздох"], en: ["tired", "exhausted", "lazy", "sigh", "worn out"] } },
  { slug: "sleep", name: { ru: "Сон", en: "Sleeping" }, sample: "(－_－) zzZ", keywords: { ru: ["сон", "спит", "спать", "сонный", "спокойной ночи"], en: ["sleep", "sleeping", "sleepy", "good night", "zzz"] } },
  { slug: "cool", name: { ru: "Крутые", en: "Cool" }, sample: "(⌐■_■)", keywords: { ru: ["крутые", "крутой", "очки", "уверенность", "класс"], en: ["cool", "sunglasses", "deal with it", "smug", "thumbs up"] } },
  { slug: "evil", name: { ru: "Злодеи", en: "Evil" }, sample: "ψ(｀∇´)ψ", keywords: { ru: ["злодей", "коварный", "хитрый", "демон", "ухмылка"], en: ["evil", "devil", "wicked", "sly", "smirk"] } },
  { slug: "dead", name: { ru: "Нокаут", en: "Dead" }, sample: "(x_x)", keywords: { ru: ["нокаут", "мёртвый", "умер", "без чувств", "обморок"], en: ["dead", "knocked out", "ko", "dying", "faint"] } },
  { slug: "shrug", name: { ru: "Пожимает плечами", en: "Shrug" }, sample: "¯\\_(ツ)_/¯", keywords: { ru: ["пожимает плечами", "плечи", "всё равно", "не знаю", "шраг"], en: ["shrug", "whatever", "dunno", "idk"] } },
  { slug: "table-flip", name: { ru: "Переворот стола", en: "Table flip" }, sample: "(╯°□°)╯︵ ┻━┻", keywords: { ru: ["переворот стола", "стол", "переворачивает", "ярость"], en: ["table flip", "flip table", "tableflip", "unflip", "rage"] } },
  { slug: "lenny-face", name: { ru: "Ленни фейс", en: "Lenny face" }, sample: "( \u0361° \u035Cʖ \u0361°)", keywords: { ru: ["ленни", "ленни фейс", "мем"], en: ["lenny", "lenny face", "le lenny", "meme"] } },
  { slug: "disapproval", name: { ru: "Неодобрение", en: "Disapproval" }, sample: "ಠ_ಠ", keywords: { ru: ["неодобрение", "осуждение", "косой взгляд", "фейспалм"], en: ["disapproval", "look of disapproval", "side eye", "judging"] } },
  { slug: "cat", name: { ru: "Котики", en: "Cats" }, sample: "(=^･ω･^=)", keywords: { ru: ["кот", "котик", "кошка", "котёнок", "мяу"], en: ["cat", "kitty", "kitten", "neko", "meow"] } },
  { slug: "dog", name: { ru: "Собачки", en: "Dogs" }, sample: "∪･ω･∪", keywords: { ru: ["собака", "собачка", "пёс", "щенок", "гав"], en: ["dog", "puppy", "doggo", "woof"] } },
  { slug: "bear", name: { ru: "Медведи", en: "Bears" }, sample: "ʕ•ᴥ•ʔ", keywords: { ru: ["медведь", "мишка", "медвежонок"], en: ["bear", "teddy", "teddy bear"] } },
  { slug: "bunny", name: { ru: "Зайчики", en: "Bunnies" }, sample: "／(^ x ^)＼", keywords: { ru: ["заяц", "зайчик", "кролик", "зайка"], en: ["bunny", "rabbit", "hare"] } },
  { slug: "bird", name: { ru: "Птички", en: "Birds" }, sample: "ʚ(•Θ•)ɞ", keywords: { ru: ["птица", "птичка", "цыплёнок", "сова"], en: ["bird", "chick", "owl", "birdie"] } },
  { slug: "pig", name: { ru: "Свинки", en: "Pigs" }, sample: "(￣(oo)￣)", keywords: { ru: ["свинья", "свинка", "хрюшка", "поросёнок"], en: ["pig", "piggy", "oink"] } },
  { slug: "hug", name: { ru: "Обнимашки", en: "Hugs" }, sample: "(っ＾▽＾)っ", keywords: { ru: ["обнимашки", "объятия", "обнять", "обнимает"], en: ["hug", "hugs", "cuddle", "embrace"] } },
  { slug: "kiss", name: { ru: "Поцелуи", en: "Kisses" }, sample: "(づ￣ ³￣)づ", keywords: { ru: ["поцелуй", "поцелуи", "чмок", "целует"], en: ["kiss", "kisses", "smooch", "mwah"] } },
  { slug: "wink", name: { ru: "Подмигивание", en: "Wink" }, sample: "(^_-)☆", keywords: { ru: ["подмигивание", "подмигивает", "подмигнуть", "флирт"], en: ["wink", "winking", "flirt"] } },
  { slug: "dance", name: { ru: "Танцы", en: "Dancing" }, sample: "(〜￣▽￣)〜", keywords: { ru: ["танец", "танцы", "танцует", "вечеринка"], en: ["dance", "dancing", "party", "groove"] } },
  { slug: "music", name: { ru: "Музыка", en: "Music" }, sample: "d(-_-)b", keywords: { ru: ["музыка", "песня", "поёт", "ноты", "наушники"], en: ["music", "song", "singing", "notes", "headphones"] } },
  { slug: "fight", name: { ru: "Драка", en: "Fighting" }, sample: "(ง'\u0300-'\u0301)ง", keywords: { ru: ["драка", "бой", "кулаки", "сила", "решимость"], en: ["fight", "fighting", "punch", "strong", "flex"] } },
  { slug: "greeting", name: { ru: "Привет", en: "Hello" }, sample: "(・ω・)ノ", keywords: { ru: ["привет", "приветствие", "здравствуй", "машет"], en: ["hello", "hi", "greeting", "wave"] } },
  { slug: "goodbye", name: { ru: "Пока", en: "Goodbye" }, sample: "(^_^)/~~", keywords: { ru: ["пока", "прощание", "до свидания", "увидимся"], en: ["goodbye", "bye", "farewell", "see you"] } },
  { slug: "thanks", name: { ru: "Спасибо", en: "Thank you" }, sample: "(人´∀`)", keywords: { ru: ["спасибо", "благодарность", "благодарю"], en: ["thanks", "thank you", "grateful", "gratitude"] } },
  { slug: "apology", name: { ru: "Извинение", en: "Sorry" }, sample: "m(_ _)m", keywords: { ru: ["извини", "извинение", "прости", "поклон"], en: ["sorry", "apology", "apologize", "bow"] } },
  { slug: "food", name: { ru: "Еда", en: "Food" }, sample: "(っ˘ڡ˘ς)", keywords: { ru: ["еда", "вкусно", "ест", "голодный", "чай", "кофе"], en: ["food", "eating", "yummy", "hungry", "tea", "coffee"] } },
  { slug: "running", name: { ru: "Бег", en: "Running" }, sample: "ε=ε=┌( >_<)┘", keywords: { ru: ["бег", "бежит", "спешит", "убегает"], en: ["running", "run", "rush", "hurry"] } },
  { slug: "writing", name: { ru: "Пишет", en: "Writing" }, sample: "φ(．．)", keywords: { ru: ["пишет", "записывает", "заметки", "учёба"], en: ["writing", "notes", "taking notes", "study"] } },
  { slug: "magic", name: { ru: "Магия", en: "Magic" }, sample: "(∩｀-´)⊃━☆ﾟ.*･｡ﾟ", keywords: { ru: ["магия", "волшебство", "искры", "звёздочки", "блёстки"], en: ["magic", "sparkles", "wizard", "spell", "stars"] } },
];

const LISTS: Record<string, readonly string[]> = { ...EMOTIONS, ...MOODS, ...FAMOUS, ...ANIMALS, ...ACTIONS };

export const CATEGORIES: readonly KaomojiCategory[] = META.map((m) => {
  const items = LISTS[m.slug];
  if (!items) throw new Error(`kaomoji: no list for category ${m.slug}`);
  return { ...m, items };
});

export const CATEGORY_BY_SLUG: ReadonlyMap<string, KaomojiCategory> = new Map(CATEGORIES.map((c) => [c.slug, c]));

/**
 * Kaomoji that also fit other categories: listed once in their main category and tagged with
 * the slugs of the others, so search and category pages can surface them there too.
 */
export const EXTRA_TAGS: Readonly<Record<string, readonly string[]>> = {
  "ʕっ•ᴥ•ʔっ": ["hug"],
  "ʕノ•ᴥ•ʔノ ︵ ┻━┻": ["bear"],
  "¯\\_( \u0361° \u035Cʖ \u0361°)_/¯": ["lenny-face"],
  "(つ \u0361° \u035Cʖ \u0361°)つ": ["hug"],
  "╰( \u0361° \u035Cʖ \u0361° )つ──☆*:・ﾟ": ["lenny-face"],
  "( \u0361° \u035Cʖ \u0361°)ﾉ⌐■-■": ["cool"],
  "ᕦ( \u0361° \u035Cʖ \u0361°)ᕤ": ["fight"],
  "(ಥ \u035Cʖಥ)": ["crying"],
  "(ᵔᴥᵔ)": ["bear"],
  "ʕ•ᴥ•ʔ⊃━☆ﾟ.*": ["bear"],
  "orz": ["apology"],
  "_|￣|○": ["apology"],
  "(っ´ω`)ﾉ(╥ω╥)": ["crying"],
  "(=ＴェＴ=)": ["crying"],
  "(ToT)/~~~": ["crying"],
  "(´；ω；)ﾉｼ": ["crying"],
  "(ಠ_ಠ)>⌐■-■": ["disapproval"],
  "┻━┻ ︵ ¯\\(ツ)/¯ ︵ ┻━┻": ["shrug"],
  "¯\\_(ಠ_ಠ)_/¯": ["disapproval"],
  "(┛ಠ_ಠ)┛彡┻━┻": ["disapproval"],
  "ᕦ(ಠ_ಠ)ᕤ": ["disapproval"],
  "(ง ಠ_ಠ)ง": ["disapproval"],
  "(´▽`ʃ♡ƪ)": ["love"],
  "(っ◔◡◔)っ ♥": ["love"],
  "(つ ♡ ‿ ♡)つ": ["love"],
  "( ˘ ³˘)♥": ["love"],
  "ヾ(⌐■_■)ノ♪": ["cool", "music"],
  "ᕕ(⌐■_■)ᕗ": ["dance"],
  "ʕ•ᴥ•ʔﾉ♡": ["love"],
  "(ﾟΘﾟ)♪": ["music"],
  "(^_^)o自自o(^_^)": ["excited"],
  "(ヘ･_･)ヘ┳━┳": ["angry"],
  "(ノಠ益ಠ)ノ彡┻━┻": ["angry"],
};

/** Unique kaomoji count across all categories. */
export const TOTAL = CATEGORIES.reduce((n, c) => n + c.items.length, 0);

/** Kaomoji from other categories tagged with `slug`. */
export function taggedFor(slug: string): string[] {
  return Object.entries(EXTRA_TAGS)
    .filter(([, tags]) => tags.includes(slug))
    .map(([k]) => k);
}
