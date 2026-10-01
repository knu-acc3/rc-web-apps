import { sample, randomInt } from "./rng";

export type AlphabetId = "ru" | "en" | "kk";
type LetterKind = "vowel" | "consonant" | "sign";
export type LetterFilter = "all" | "vowels" | "consonants";

interface Alphabet {
  id: AlphabetId;
  letters: readonly string[];
  vowels: readonly string[];
  /** Letters that are neither vowels nor consonants (ъ, ь). */
  signs: readonly string[];
  /** Letters no ordinary word starts with — excluded by the "word games" option. */
  neverInitial: readonly string[];
}

const split = (s: string) => s.split(" ");

export const ALPHABETS: Record<AlphabetId, Alphabet> = {
  ru: {
    id: "ru",
    letters: split("А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я"),
    vowels: split("А Е Ё И О У Ы Э Ю Я"),
    signs: split("Ъ Ь"),
    neverInitial: split("Ъ Ы Ь"),
  },
  en: {
    id: "en",
    letters: split("A B C D E F G H I J K L M N O P Q R S T U V W X Y Z"),
    vowels: split("A E I O U"),
    signs: [],
    neverInitial: [],
  },
  kk: {
    id: "kk",
    letters: split("А Ә Б В Г Ғ Д Е Ё Ж З И Й К Қ Л М Н Ң О Ө П Р С Т У Ұ Ү Ф Х Һ Ц Ч Ш Щ Ъ Ы І Ь Э Ю Я"),
    vowels: split("А Ә Е Ё И О Ө У Ұ Ү Ы І Э Ю Я"),
    signs: split("Ъ Ь"),
    neverInitial: split("Ъ Ь"),
  },
};

function letterKind(a: Alphabet, letter: string): LetterKind {
  if (a.vowels.includes(letter)) return "vowel";
  if (a.signs.includes(letter)) return "sign";
  return "consonant";
}

export function consonants(a: Alphabet): string[] {
  return a.letters.filter((l) => letterKind(a, l) === "consonant");
}

export function letterPool(a: Alphabet, filter: LetterFilter, wordGames: boolean): string[] {
  let pool = a.letters.slice();
  if (filter === "vowels") pool = pool.filter((l) => letterKind(a, l) === "vowel");
  if (filter === "consonants") pool = pool.filter((l) => letterKind(a, l) === "consonant");
  if (wordGames) pool = pool.filter((l) => !a.neverInitial.includes(l));
  return pool;
}

/** `count` letters from the pool; with `unique` there are no repeats (count ≤ pool size). */
export function drawLetters(pool: readonly string[], count: number, unique: boolean): string[] {
  if (pool.length === 0) return [];
  if (unique) return sample(pool, Math.min(count, pool.length));
  return Array.from({ length: count }, () => pool[randomInt(pool.length)]);
}
