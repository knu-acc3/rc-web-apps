/** Spelling alphabets: ICAO/NATO and the Russian radiotelephony alphabet. */

export const NATO: Record<string, string> = {
  A: "Alfa", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf", H: "Hotel", I: "India", J: "Juliett", K: "Kilo",
  L: "Lima", M: "Mike", N: "November", O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform",
  V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
  "0": "Zero", "1": "One", "2": "Two", "3": "Three", "4": "Four", "5": "Five", "6": "Six", "7": "Seven", "8": "Eight", "9": "Nine",
};

/** ICAO pronunciation of letters (stressed syllable in capitals). */
export const NATO_SAY: Record<string, string> = {
  A: "AL-fah", B: "BRAH-voh", C: "CHAR-lee", D: "DELL-tah", E: "ECK-oh", F: "FOKS-trot", G: "golf", H: "hoh-TELL", I: "IN-dee-ah",
  J: "JEW-lee-ett", K: "KEY-loh", L: "LEE-mah", M: "mike", N: "no-VEM-ber", O: "OSS-cah", P: "pah-PAH", Q: "keh-BECK", R: "ROW-me-oh",
  S: "see-AIR-rah", T: "TANG-go", U: "YOU-nee-form", V: "VIK-tah", W: "WISS-key", X: "ECKS-ray", Y: "YANG-key", Z: "ZOO-loo",
  "0": "ZE-RO", "1": "WUN", "2": "TOO", "3": "TREE", "4": "FOW-er", "5": "FIFE", "6": "SIX", "7": "SEV-en", "8": "AIT", "9": "NIN-er",
};

export const RUSSIAN: Record<string, string> = {
  А: "Анна", Б: "Борис", В: "Василий", Г: "Григорий", Д: "Дмитрий", Е: "Елена", Ё: "Елена", Ж: "Женя", З: "Зинаида", И: "Иван",
  Й: "Иван краткий", К: "Константин", Л: "Леонид", М: "Михаил", Н: "Николай", О: "Ольга", П: "Павел", Р: "Роман", С: "Семён",
  Т: "Татьяна", У: "Ульяна", Ф: "Фёдор", Х: "Харитон", Ц: "Цапля", Ч: "Человек", Ш: "Шура", Щ: "Щука", Ъ: "Твёрдый знак",
  Ы: "Еры", Ь: "Мягкий знак", Э: "Эхо", Ю: "Юрий", Я: "Яков",
};

export type Spelling = "nato" | "russian";

/** Spell text letter by letter; unknown characters are kept as they are. Words are separated by " / ". */
export function spell(text: string, alphabet: Spelling, fallback = true): string {
  const primary = alphabet === "nato" ? NATO : RUSSIAN;
  const secondary = alphabet === "nato" ? RUSSIAN : NATO;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) =>
      [...w]
        .map((ch) => {
          const up = ch.toUpperCase();
          return primary[up] ?? (fallback ? (secondary[up] ?? (/\d/.test(up) ? NATO[up] : ch)) : ch);
        })
        .join(" "),
    )
    .join(" / ");
}
