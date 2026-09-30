import { EN_FEMALE, EN_MALE, EN_SURNAMES, KK_FEMALE, KK_MALE, KK_SURNAMES, RU_FEMALE, RU_MALE, RU_PATRONYMIC_EXCEPTIONS, RU_SURNAMES } from "../data/names";
import { pick } from "./rng";

export type NameLang = "ru" | "en" | "kk";
export type Gender = "male" | "female";
/** first = given name; full = given name + surname; fio = surname, given name, patronymic (ru/kk). */
export type NameFormat = "first" | "full" | "fio";
/** Kazakh patronymic style: Russified (-ович/-овна) or Kazakh (-ұлы/-қызы). */
export type KkPatronymic = "ovich" | "uly";

export const NAME_LISTS = {
  ru: { male: RU_MALE, female: RU_FEMALE, surnames: RU_SURNAMES },
  en: { male: EN_MALE, female: EN_FEMALE, surnames: EN_SURNAMES },
  kk: { male: KK_MALE, female: KK_FEMALE, surnames: KK_SURNAMES },
} as const;

/** Feminine form of a Russian or Russified Kazakh surname. */
export function feminineSurname(s: string): string {
  if (/(ск|цк)ий$/.test(s)) return s.slice(0, -2) + "ая";
  if (/[кгх]ий$/.test(s)) return s.slice(0, -2) + "ая";
  if (/(ой|ый)$/.test(s)) return s.slice(0, -2) + "ая";
  if (/(ов|ев|ёв|ин|ын)$/.test(s)) return s + "а";
  return s; // Шевченко, Черных, Седых… are the same for both genders
}

/** Russian patronymic from a (Russian or Kazakh) male given name. */
export function ruPatronymic(father: string, gender: Gender): string {
  const ex = RU_PATRONYMIC_EXCEPTIONS[father];
  if (ex) return gender === "male" ? ex[0] : ex[1];
  let stem: string;
  if (father.endsWith("ий")) stem = father.slice(0, -2) + "ьев";
  else if (/[аеоуэюя]й$/.test(father)) stem = father.slice(0, -1) + "ев";
  else if (father.endsWith("ь")) stem = father.slice(0, -1) + "ев";
  else if (/[жшчщц]$/.test(father)) stem = father + "ев";
  else stem = father + "ов";
  return stem + (gender === "male" ? "ич" : "на");
}

/** Kazakh patronymic: Нурлан → Нурланұлы / Нурланқызы. */
export function kkPatronymic(father: string, gender: Gender): string {
  return father + (gender === "male" ? "ұлы" : "қызы");
}

export interface NameParts {
  first: string;
  last?: string;
  patronymic?: string;
  gender: Gender;
}

export function randomName(lang: NameLang, gender: Gender, format: NameFormat, kkStyle: KkPatronymic = "ovich"): NameParts {
  const L = NAME_LISTS[lang];
  const first = pick(gender === "male" ? L.male : L.female);
  if (format === "first") return { first, gender };
  const base = pick(L.surnames);
  const last = lang === "en" || gender === "male" ? base : feminineSurname(base);
  if (format === "full" || lang === "en") return { first, last, gender };
  const father = pick(L.male);
  const patronymic = lang === "kk" && kkStyle === "uly" ? kkPatronymic(father, gender) : ruPatronymic(father, gender);
  return { first, last, patronymic, gender };
}

export function formatName(p: NameParts): string {
  if (p.patronymic && p.last) return `${p.last} ${p.first} ${p.patronymic}`;
  return p.last ? `${p.first} ${p.last}` : p.first;
}

/* ───────────── Latin transliteration (readable, passport-like) ───────────── */

const LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ә: "a", ғ: "g", қ: "k", ң: "n", ө: "o", ұ: "u", ү: "u", һ: "h", і: "i",
};

export function toLatin(text: string): string {
  const s = text
    .replace(/ий(?=$|[\s-])/g, "y")
    .replace(/ый(?=$|[\s-])/g, "y")
    .replace(/ия(?=$|[\s-])/g, "ia")
    .replace(/ей/g, "ey");
  let out = "";
  for (const ch of s) {
    const lower = ch.toLowerCase();
    const m = LAT[lower];
    if (m === undefined) {
      out += ch;
      continue;
    }
    out += ch !== lower && m ? m[0].toUpperCase() + m.slice(1) : m;
  }
  return out;
}
