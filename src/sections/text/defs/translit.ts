import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { convertLayout, LAYOUT_PAIRS } from "../lib/layout";
import { slugify, transliterate, type Lang, type StandardId } from "../lib/translit";
import { FAQ, facts, L, LL } from "./util";

const RU_LETTERS = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const UK_LETTERS = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя";
const KK_LETTERS = "аәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя";

/** Letter table for a standard: shows context-dependent values as "start / middle". */
function letterTable(locale: Locale, std: StandardId, lang: Lang, letters: string): Block {
  const rows = [...letters].map((ch) => {
    const start = transliterate(ch, std, { lang });
    const mid = transliterate(`б${ch}`, std, { lang }).slice(1);
    let value = start === mid ? start : `${start} / ${mid}`;
    if (std === "gost-b" && ch === "ц") value = locale === "ru" ? "c (перед i, e, y, j) / cz" : "c (before i, e, y, j) / cz";
    if (std === "ukrainian-2010" && ch === "г") value = locale === "ru" ? "h (gh после з)" : "h (gh after z)";
    return [`${ch.toUpperCase()} ${ch}`, value || "—"];
  });
  return {
    type: "table",
    title: locale === "ru" ? "Таблица транслитерации" : "Transliteration table",
    head: locale === "ru" ? ["Буква", "Латиница"] : ["Letter", "Latin"],
    rows,
    mono: true,
  };
}

interface StdPage {
  slug: string;
  std: StandardId;
  lang: Lang;
  letters: string;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  examples: string[];
  use: [string, string];
  reversible: boolean;
  faq: { ru: [string, string][]; en: [string, string][] };
  keywords: [string[], string[]];
}

const PAGES: StdPage[] = [
  {
    slug: "icao-9303",
    std: "icao",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["Для загранпаспорта (ICAO)", "Passport (ICAO)"],
    title: ["Транслитерация для загранпаспорта онлайн — ICAO Doc 9303", "Russian passport transliteration — ICAO Doc 9303"],
    h1: ["Транслитерация для загранпаспорта", "Russian passport name transliteration"],
    description: [
      "Переведите ФИО на латиницу, как в загранпаспорте РФ: стандарт ICAO Doc 9303 действует с 2013 года. Щукин → SHCHUKIN, Юлия → IULIIA, ъ → IE, ь не пишется.",
      "Transliterate a Russian name the way it appears in a Russian passport: ICAO Doc 9303, used since 2013. Щукин → SHCHUKIN, Юлия → IULIIA, ъ → IE.",
    ],
    lead: ["Имя и фамилия на латинице — как в загранпаспорте, выданном после 2013 года.", "The Latin spelling of a Russian name as in passports issued since 2013."],
    examples: ["Щукин", "Юлия", "Наталья", "Подъячев", "Хрущёв", "Цой"],
    use: ["Загранпаспорта РФ с 2013 года, авиабилеты и визы (имя должно совпадать с паспортом)", "Russian passports since 2013, air tickets and visas (the name must match the passport)"],
    reversible: false,
    faq: {
      ru: [
        ["Почему в загранпаспорте Юлия пишется IULIIA?", "По ICAO Doc 9303 буква ю передаётся как IU, я — как IA, й — как I. Поэтому Юлия → IULIIA, Юрий → IURII."],
        ["Как пишется ъ и ь?", "Твёрдый знак передаётся как IE (Подъячев → PODIEIACHEV), мягкий знак не пишется (Наталья → NATALIA)."],
        ["Можно ли оставить написание из старого паспорта?", "Да, по заявлению можно сохранить написание из предыдущего загранпаспорта или другого документа. Для нового паспорта без таких документов используется ICAO."],
        ["Как купить билет, если имя в паспорте написано иначе?", "Имя в билете вводят точно так, как в загранпаспорте, по которому вы летите, даже если оно отличается от этой транслитерации."],
      ],
      en: [
        ["Why is Юлия spelled IULIIA?", "Under ICAO Doc 9303 ю becomes IU, я becomes IA and й becomes I, so Юлия → IULIIA and Юрий → IURII."],
        ["How are ъ and ь written?", "The hard sign becomes IE (Подъячев → PODIEIACHEV); the soft sign is dropped (Наталья → NATALIA)."],
        ["Can the old spelling be kept?", "Yes, on request the spelling from a previous passport or another document can be kept. Otherwise ICAO rules apply."],
        ["What name goes on a plane ticket?", "Exactly the spelling in the passport you travel with, even if it differs from this transliteration."],
      ],
    },
    keywords: [["загранпаспорт", "фио латиницей", "мвд", "icao"], ["passport name", "russian name in latin"]],
  },
  {
    slug: "gost-7-79-a",
    std: "gost-a",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["ГОСТ 7.79, система А (ISO 9)", "GOST 7.79 System A (ISO 9)"],
    title: ["Транслитерация по ГОСТ 7.79-2000 (система А, ISO 9)", "GOST 7.79-2000 System A (ISO 9) transliteration"],
    h1: ["Транслитерация по ГОСТ 7.79-2000, система А", "GOST 7.79-2000 System A transliteration"],
    description: [
      "Транслитерация по ГОСТ 7.79-2000 системе А (ISO 9:1995): каждая буква — одна латинская с диакритикой, поэтому текст однозначно переводится обратно. Щ → Ŝ, Ю → Û.",
      "Transliterate by GOST 7.79-2000 System A, identical to ISO 9:1995: one Latin letter with diacritics per Cyrillic letter, fully reversible. Щ → Ŝ, Ю → Û.",
    ],
    lead: ["Одна кириллическая буква — одна латинская: Щукин → Ŝukin.", "One Cyrillic letter, one Latin letter: Щукин → Ŝukin."],
    examples: ["Щукин", "Чайковский", "Съезд", "Юрьев", "Эхо"],
    use: ["Научные и библиографические публикации, где важна однозначная обратимость", "Scholarly and bibliographic work where exact reversibility matters"],
    reversible: true,
    faq: {
      ru: [
        ["Чем система А отличается от системы Б?", "Система А использует латиницу с диакритикой (ž, č, š, ŝ) — одна буква на одну. Система Б обходится ASCII-символами и буквосочетаниями (zh, ch, shh), поэтому её проще набрать."],
        ["Можно ли вернуть текст обратно в кириллицу?", "Да, система А полностью обратима: переключите направление «Латиница → кириллица»."],
      ],
      en: [
        ["How does System A differ from System B?", "System A uses Latin letters with diacritics (ž, č, š, ŝ), one per Cyrillic letter. System B sticks to ASCII and digraphs (zh, ch, shh), so it’s easier to type."],
        ["Can the text be converted back?", "Yes, System A is fully reversible: switch the direction to Latin → Cyrillic."],
      ],
    },
    keywords: [["гост 7.79", "iso 9", "система а", "диакритика"], ["iso 9", "gost 7.79 a"]],
  },
  {
    slug: "gost-7-79-b",
    std: "gost-b",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["ГОСТ 7.79, система Б", "GOST 7.79 System B"],
    title: ["Транслитерация по ГОСТ 7.79-2000 (система Б) онлайн", "GOST 7.79-2000 System B transliteration online"],
    h1: ["Транслитерация по ГОСТ 7.79-2000, система Б", "GOST 7.79-2000 System B transliteration"],
    description: [
      "Транслитерация по ГОСТ 7.79-2000 системе Б — только латиница без диакритики: щ → shh, х → x, ы → y`, ц → c или cz. Текст можно перевести обратно в кириллицу.",
      "Transliterate by GOST 7.79-2000 System B — plain ASCII without diacritics: щ → shh, х → x, ы → y`, ц → c or cz. The text can be converted back to Cyrillic.",
    ],
    lead: ["Только ASCII-символы: Щукин → Shhukin, Цапля → Czaplya.", "ASCII only: Щукин → Shhukin, Цапля → Czaplya."],
    examples: ["Щукин", "Цапля", "Цирк", "Цыган", "Съезд", "Хрущёв"],
    use: ["Тексты, где допустимы только латинские буквы и знаки ASCII, с возможностью обратного перевода", "Texts limited to ASCII letters and signs that must remain reversible"],
    reversible: true,
    faq: {
      ru: [
        ["Почему ц пишется то как c, то как cz?", "По ГОСТ 7.79 система Б буква ц передаётся как c перед i, e, y, j и как cz в остальных случаях: Цирк → Cirk, Цапля → Czaplya."],
        ["Что означают апострофы в y` и e`?", "Обратный апостроф отличает ы (y`) и э (e`) от других букв, а ` и `` — это мягкий и твёрдый знаки. Благодаря этому текст можно перевести обратно."],
      ],
      en: [
        ["Why is ц written as c or cz?", "In System B ц is c before i, e, y, j and cz elsewhere: Цирк → Cirk, Цапля → Czaplya."],
        ["What are the backticks in y` and e`?", "The backtick marks ы (y`) and э (e`), while ` and `` stand for the soft and hard signs. That makes the text reversible."],
      ],
    },
    keywords: [["гост 7.79 б", "система б", "транслит гост"], ["gost 7.79 b", "ascii transliteration"]],
  },
  {
    slug: "bgn-pcgn",
    std: "bgn",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["BGN/PCGN", "BGN/PCGN"],
    title: ["Транслитерация BGN/PCGN — русские названия на английском", "BGN/PCGN romanization of Russian online"],
    h1: ["Транслитерация BGN/PCGN", "BGN/PCGN romanization of Russian"],
    description: [
      "Система BGN/PCGN (1947) для русских географических названий в англоязычных картах и СМИ: е в начале слова и после гласных — ye, ё — ë, ь — ’. Ельцин → Yel’tsin.",
      "BGN/PCGN (1947) romanization for Russian place names on English maps and in the press: word-initial е becomes ye, ё becomes ë, ь becomes ’. Ельцин → Yel’tsin.",
    ],
    lead: ["Как пишут русские названия на картах и в англоязычной прессе: Ельцин → Yel’tsin.", "How Russian names appear on maps and in the English press: Ельцин → Yel’tsin."],
    examples: ["Ельцин", "Королёв", "Юрьев", "Подъезд", "Щукин"],
    use: ["Географические названия на картах, в атласах и в англоязычных изданиях", "Place names on maps, in atlases and English-language publications"],
    reversible: false,
    faq: {
      ru: [
        ["Когда е пишется как ye?", "В начале слова, после гласных и после й, ъ, ь: Ельцин → Yel’tsin, Подъезд → Pod”yezd. В остальных случаях — e."],
        ["Используется ли средняя точка?", "BGN/PCGN допускает точку (t·s) для различения сочетаний вроде тс и ц, но она необязательна; здесь точка не ставится."],
        ["Для украинских текстов?", "Для украинского BGN/PCGN с 2019 года используют национальную систему Украины 2010 года — при выборе украинского языка применяется она."],
      ],
      en: [
        ["When is е written as ye?", "At the start of a word, after vowels and after й, ъ, ь: Ельцин → Yel’tsin, Подъезд → Pod”yezd. Otherwise e."],
        ["Is the middle dot used?", "BGN/PCGN allows a dot (t·s) to tell тс from ц, but it’s optional and not used here."],
        ["What about Ukrainian?", "Since 2019 BGN/PCGN has adopted Ukraine’s 2010 national system for Ukrainian, which is applied when you choose Ukrainian."],
      ],
    },
    keywords: [["bgn", "pcgn", "географические названия"], ["bgn pcgn", "russian place names"]],
  },
  {
    slug: "scientific",
    std: "scientific",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["Научная транслитерация", "Scientific"],
    title: ["Научная транслитерация кириллицы онлайн", "Scientific transliteration of Cyrillic online"],
    h1: ["Научная транслитерация", "Scientific (scholarly) transliteration"],
    description: [
      "Научная (лингвистическая) транслитерация, принятая в славистике: ж → ž, х → x, щ → šč, ю → ju, ь → ′. Обратимо и удобно для цитирования русских слов в статьях.",
      "Scholarly transliteration used in Slavic studies: ж → ž, х → x, щ → šč, ю → ju, ь → ′. Reversible and convenient for quoting Russian words in papers.",
    ],
    lead: ["Как пишут русские слова лингвисты: Хрущёв → Xruščëv.", "How linguists write Russian words: Хрущёв → Xruščëv."],
    examples: ["Хрущёв", "Щукин", "Юрьев", "Съезд", "Чайка"],
    use: ["Лингвистика, славистика, академические статьи", "Linguistics, Slavic studies, academic papers"],
    reversible: true,
    faq: {
      ru: [
        ["Чем научная транслитерация отличается от ISO 9?", "Она ближе к чешской орфографии: щ → šč (а не ŝ), ю → ju, я → ja, а мягкий и твёрдый знаки — штрихи ′ и ″."],
        ["Можно ли перевести обратно?", "Да, выберите направление «Латиница → кириллица»."],
      ],
      en: [
        ["How is it different from ISO 9?", "It’s closer to Czech spelling: щ → šč (not ŝ), ю → ju, я → ja, and the soft and hard signs are the primes ′ and ″."],
        ["Can it be reversed?", "Yes, choose Latin → Cyrillic."],
      ],
    },
    keywords: [["научная транслитерация", "славистика", "лингвистическая"], ["scholarly transliteration", "slavic studies"]],
  },
  {
    slug: "informal",
    std: "informal",
    lang: "ru",
    letters: RU_LETTERS,
    name: ["Транслит как в чатах", "Informal translit"],
    title: ["Транслит онлайн — русский текст латиницей и обратно", "Translit — Russian in Latin letters and back"],
    h1: ["Транслит онлайн", "Translit converter"],
    description: [
      "Переведите русский текст в привычный транслит, как пишут в чатах и СМС: привет → privet, щука → schuka. Работает и обратно: privet → привет, moy → мой.",
      "Convert Russian into everyday translit as people type it in chats and texts: привет → privet, щука → schuka. It works backwards too: privet → привет.",
    ],
    lead: ["«Привет, как дела?» → «Privet, kak dela?» и обратно.", "“Привет, как дела?” → “Privet, kak dela?” and back."],
    examples: ["Привет, как дела?", "Щука", "Ёжик", "Мягкий знак"],
    use: ["Переписка без русской раскладки, ники, СМС латиницей", "Messages without a Russian keyboard, nicknames, SMS in Latin letters"],
    reversible: true,
    faq: {
      ru: [
        ["Как перевести транслит обратно в русский?", "Выберите «Латиница → кириллица»: privet → привет, shchuka или schuka → щука, zh → ж, y после гласной → й (moy → мой)."],
        ["Чем транслит отличается от ГОСТа?", "Это неофициальный вариант «как удобно»: х → h, щ → sch, ь → '. Для документов используйте стандарт ICAO или ГОСТ."],
      ],
      en: [
        ["How do I turn translit back into Russian?", "Choose Latin → Cyrillic: privet → привет, shchuka or schuka → щука, zh → ж, y after a vowel → й (moy → мой)."],
        ["How is it different from GOST?", "It’s an informal “whatever is convenient” style: х → h, щ → sch, ь → '. Use ICAO or GOST for documents."],
      ],
    },
    keywords: [["транслит", "translit", "латиницей", "перевести транслит"], ["translit", "russian in english letters"]],
  },
  {
    slug: "kazakh-latin-2021",
    std: "kazakh-2021",
    lang: "kk",
    letters: KK_LETTERS,
    name: ["Казахская латиница 2021", "Kazakh Latin 2021"],
    title: ["Перевод на казахскую латиницу онлайн — алфавит 2021 года", "Kazakh Cyrillic to Latin converter — 2021 alphabet"],
    h1: ["Перевод на казахскую латиницу", "Kazakh Cyrillic to Latin converter"],
    description: [
      "Переведите казахский текст на латиницу по алфавиту, представленному в 2021 году: Ә → Ä, Ғ → Ğ, Қ → Q, Ң → Ñ, Ө → Ö, Ұ → Ū, Ү → Ü, Ш → Ş, І → I. Есть обратный перевод.",
      "Convert Kazakh text to the Latin alphabet presented in 2021: Ә → Ä, Ғ → Ğ, Қ → Q, Ң → Ñ, Ө → Ö, Ұ → Ū, Ү → Ü, Ш → Ş, І → I. Works in reverse too.",
    ],
    lead: ["Қазақстан → Qazaqstan: казахский текст на латинице 2021 года.", "Қазақстан → Qazaqstan: Kazakh text in the 2021 Latin alphabet."],
    examples: ["Қазақстан", "Өскемен", "Ақтөбе", "Шымкент", "Жезқазған", "Ұлытау"],
    use: ["Новый казахский алфавит на латинице, переход на который идёт поэтапно", "The new Kazakh Latin alphabet, being introduced in stages"],
    reversible: true,
    faq: {
      ru: [
        ["Какой вариант казахской латиницы используется?", "Алфавит из 31 буквы, представленный в январе 2021 года: с умлаутами и знаками Ä, Ğ, Ñ, Ö, Ş, Ū, Ü, İ и I без точки. Он заменил варианты 2017 года с апострофами и 2018 года с акутами."],
        ["Как передаются буквы ц, ч, щ, ё, ю, я?", "Их нет в алфавите 2021 года, поэтому они передаются условно: ц → ts, ч → ch, щ → şş, ю → iu, я → ia, ё → io; ъ и ь не пишутся."],
        ["Чем І отличается от И?", "І (казахская) → I без точки в заглавной и ı в строчной; И и Й → İ с точкой и i. Поэтому Іле → Ile, а Ислам → İslam."],
      ],
      en: [
        ["Which Kazakh Latin version is used?", "The 31-letter alphabet presented in January 2021, with Ä, Ğ, Ñ, Ö, Ş, Ū, Ü, dotted İ and dotless I. It replaced the 2017 apostrophe and 2018 acute-accent versions."],
        ["How are ц, ч, щ, ё, ю, я written?", "They aren’t in the 2021 alphabet, so conventional values are used: ц → ts, ч → ch, щ → şş, ю → iu, я → ia, ё → io; ъ and ь are dropped."],
        ["How is І different from И?", "Kazakh І becomes dotless I/ı; И and Й become dotted İ/i. So Іле → Ile and Ислам → İslam."],
      ],
    },
    keywords: [["казахская латиница", "латынь казахский", "қазақ латын", "2021"], ["kazakh latin alphabet", "qazaq latin"]],
  },
  {
    slug: "ukrainian-2010",
    std: "ukrainian-2010",
    lang: "uk",
    letters: UK_LETTERS,
    name: ["Украинский стандарт 2010", "Ukrainian 2010"],
    title: ["Украинская транслитерация онлайн — стандарт КМУ 2010", "Ukrainian transliteration — official 2010 system"],
    h1: ["Украинская транслитерация (стандарт 2010 года)", "Ukrainian transliteration (official 2010 system)"],
    description: [
      "Транслитерация украинского текста по постановлению Кабмина № 55 от 27.01.2010: Київ → Kyiv, Згорани → Zghorany, Юрій → Yurii. Используется в паспортах Украины.",
      "Transliterate Ukrainian by the Cabinet of Ministers resolution No. 55 of 27.01.2010: Київ → Kyiv, Згорани → Zghorany, Юрій → Yurii. Used in Ukrainian passports.",
    ],
    lead: ["Київ → Kyiv, Харків → Kharkiv — как в паспортах Украины.", "Київ → Kyiv, Харків → Kharkiv — as in Ukrainian passports."],
    examples: ["Київ", "Харків", "Згорани", "Єнакієве", "Юрій", "Знам'янка"],
    use: ["Паспорта и документы Украины, карты, дорожные указатели", "Ukrainian passports and documents, maps and road signs"],
    reversible: false,
    faq: {
      ru: [
        ["Почему є, ї, й, ю, я пишутся по-разному?", "В начале слова — ye, yi, y, yu, ya; в других позициях — ie, i, i, iu, ia. Поэтому Єнакієве → Yenakiieve, Юрій → Yurii."],
        ["Зачем «gh» в слове Zghorany?", "Сочетание зг передаётся как zgh, чтобы его не путали с ж (zh)."],
        ["Что с апострофом и мягким знаком?", "Они не передаются: Знам'янка → Znamianka, Львів → Lviv."],
      ],
      en: [
        ["Why do є, ї, й, ю, я change?", "At the start of a word they are ye, yi, y, yu, ya; elsewhere ie, i, i, iu, ia. Hence Єнакієве → Yenakiieve, Юрій → Yurii."],
        ["Why the “gh” in Zghorany?", "зг is written zgh so it isn’t confused with ж (zh)."],
        ["What about the apostrophe and soft sign?", "They are not transliterated: Знам'янка → Znamianka, Львів → Lviv."],
      ],
    },
    keywords: [["украинская транслитерация", "паспорт украины", "кму 55"], ["ukrainian transliteration", "kmu 55"]],
  },
];

function stdVariant(p: StdPage): VariantDef {
  return {
    slug: p.slug,
    name: L(...p.name),
    title: L(...p.title),
    h1: L(...p.h1),
    description: L(...p.description),
    lead: L(...p.lead),
    keywords: LL(...p.keywords),
    props: { standard: p.std },
    blocks: (locale) => [
      facts(locale, L("Примеры", "Examples"), [
        ...p.examples.map((ex) => [ex, transliterate(ex, p.std, { lang: p.lang })] as [string, string]),
        [L("Где применяется", "Where it’s used"), p.use[locale === "ru" ? 0 : 1]],
        [L("Обратный перевод", "Reverse direction"), p.reversible ? L("есть", "available") : L("нет — стандарт неоднозначен", "no — the standard is ambiguous")],
      ]),
      letterTable(locale, p.std, p.lang, p.letters),
    ],
    faq: FAQ(p.faq.ru, p.faq.en),
  };
}

const slugVariant: VariantDef = {
  slug: "url-slug",
  name: L("Для URL (ЧПУ)", "URL slug"),
  title: L("Транслитерация для URL — ЧПУ из заголовка онлайн", "URL slug generator from Cyrillic titles"),
  h1: L("Транслитерация для URL (ЧПУ)", "URL slug from a Cyrillic title"),
  description: L(
    "Сделайте адрес страницы из заголовка: латиница, строчные буквы и дефисы. Понимает русский, казахский и украинский: Қазақстан → qazaqstan, Київ → kyiv.",
    "Turn a title into a URL slug: Latin letters, lowercase and hyphens. Understands Russian, Kazakh and Ukrainian: Қазақстан → qazaqstan, Київ → kyiv.",
  ),
  lead: L("«Как выбрать ноутбук» → kak-vybrat-noutbuk.", "“Как выбрать ноутбук” → kak-vybrat-noutbuk."),
  keywords: LL(["чпу", "slug", "адрес страницы", "url транслит"], ["slug generator", "seo url", "cyrillic slug"]),
  props: { mode: "slug" },
  blocks: (locale) => [
    facts(
      locale,
      L("Примеры", "Examples"),
      ["Как выбрать ноутбук в 2025 году: 10 советов", "Қазақстан Республикасы", "Київ і Львів", "Щукин & сыновья", "Crème brûlée"].map((s) => [s, slugify(s)] as [string, string]),
    ),
  ],
  faq: FAQ(
    [
      ["Какие правила транслитерации используются для URL?", "Для русского — привычные для адресов: ж → zh, х → kh, ц → ts, щ → shch, ь и ъ не пишутся. Украинский текст переводится по стандарту 2010 года, казахские буквы — как в латинице (қ → q, ә → a)."],
      ["Что происходит со знаками и пробелами?", "Любые знаки и пробелы заменяются одним дефисом (или подчёркиванием), дефисы в начале и конце удаляются, диакритика снимается: crème → creme."],
      ["Можно ли ограничить длину адреса?", "Да, выберите максимальную длину — адрес обрежется по границе слова."],
    ],
    [
      ["Which rules are used for URLs?", "Common URL rules for Russian: ж → zh, х → kh, ц → ts, щ → shch, ь and ъ dropped. Ukrainian uses the 2010 national system; Kazakh letters follow the Latin alphabet (қ → q, ә → a)."],
      ["What happens to punctuation and spaces?", "Any run of symbols and spaces becomes one hyphen (or underscore), leading and trailing hyphens are removed and accents are stripped: crème → creme."],
      ["Can I limit the slug length?", "Yes, choose a maximum length — the slug is cut at a word boundary."],
    ],
  ),
};

export const transliterationTool: ToolDef = {
  slug: "transliteration",
  component: "text/translit",
  icon: "Languages",
  popular: true,
  props: { standard: "icao" },
  name: L("Транслитерация", "Transliteration"),
  title: L("Транслитерация онлайн — перевод с русского на латиницу", "Transliteration — Cyrillic to Latin converter online"),
  h1: L("Транслитерация с русского на латиницу", "Cyrillic to Latin transliteration"),
  description: L(
    "Транслитерация кириллицы по 8 стандартам: загранпаспорт (ICAO), ГОСТ 7.79 А и Б, BGN/PCGN, научная, транслит, казахская латиница и украинский стандарт 2010.",
    "Transliterate Cyrillic by 8 standards: passport (ICAO), GOST 7.79 A and B, BGN/PCGN, scholarly, informal translit, Kazakh Latin and Ukrainian 2010.",
  ),
  lead: L("Выберите стандарт — текст сразу появится латиницей: Щукин → Shchukin.", "Pick a standard and the text appears in Latin letters: Щукин → Shchukin."),
  keywords: LL(["транслит", "латиницей", "кириллица в латиницу", "перевод на латиницу"], ["romanization", "cyrillic to latin", "russian to latin"]),
  howTo: LL(
    [
      "Вставьте текст на русском, украинском или казахском — язык определится автоматически.",
      "Выберите стандарт: для загранпаспорта — ICAO, для научных текстов — ГОСТ или научный, для карт — BGN/PCGN.",
      "Для обратимых стандартов можно переключить направление «Латиница → кириллица».",
      "Скопируйте результат.",
    ],
    [
      "Paste Russian, Ukrainian or Kazakh text — the language is detected automatically.",
      "Pick a standard: ICAO for passports, GOST or scholarly for academic texts, BGN/PCGN for maps.",
      "For reversible standards you can switch the direction to Latin → Cyrillic.",
      "Copy the result.",
    ],
  ),
  about: LL(
    [
      "Заглавные буквы передаются с учётом слова: «Щукин» → «Shchukin», а «ЩУКИН» → «SHCHUKIN». Контекстные правила соблюдаются: ye в начале слова по BGN/PCGN, c или cz по ГОСТ 7.79 Б, zgh и формы ye/ie в украинском стандарте.",
      "Буквы других кириллических алфавитов не теряются: если стандарт не описывает казахские Қ, Ә, Ң и другие, они передаются по казахской латинице (в ASCII-стандартах — без диакритики: қ → q, ә → a). Так «Қазақстан» не превращается в «aza-stan».",
    ],
    [
      "Capitals follow the word: “Щукин” → “Shchukin” but “ЩУКИН” → “SHCHUKIN”. Context rules are applied: ye at the start of a word in BGN/PCGN, c or cz in GOST 7.79 B, zgh and ye/ie forms in the Ukrainian system.",
      "Letters of other Cyrillic alphabets are never lost: if a standard doesn’t cover Kazakh Қ, Ә, Ң and others, they follow the Kazakh Latin alphabet (without diacritics in ASCII standards: қ → q, ә → a). So “Қазақстан” doesn’t turn into “aza-stan”.",
    ],
  ),
  faq: FAQ(
    [
      ["Какой стандарт нужен для загранпаспорта?", "ICAO Doc 9303 — он используется в загранпаспортах РФ с 2013 года: Юлия → IULIIA, Щукин → SHCHUKIN. Выберите «Загранпаспорт (ICAO)»."],
      ["Чем транслитерация отличается от перевода?", "Транслитерация передаёт буквы одного алфавита буквами другого, не меняя смысла: «Москва» → «Moskva». Перевод даёт слово на другом языке: «Moscow»."],
      ["Можно ли перевести латиницу обратно в кириллицу?", "Да, для обратимых стандартов: ГОСТ 7.79 А и Б, научная, транслит и казахская латиница. Стандарты ICAO, BGN/PCGN и украинский неоднозначны, для них обратного перевода нет."],
      ["Поддерживаются ли казахский и украинский?", "Да. Язык определяется автоматически по буквам (қ, ә, ң… — казахский; ї, є, ґ — украинский), но его можно выбрать и вручную."],
    ],
    [
      ["Which standard is used for Russian passports?", "ICAO Doc 9303, used in Russian passports since 2013: Юлия → IULIIA, Щукин → SHCHUKIN. Choose “Passport (ICAO)”."],
      ["How is transliteration different from translation?", "Transliteration spells the same word in another alphabet: “Москва” → “Moskva”. Translation gives the word in another language: “Moscow”."],
      ["Can Latin be converted back to Cyrillic?", "Yes, for reversible standards: GOST 7.79 A and B, scholarly, informal translit and Kazakh Latin. ICAO, BGN/PCGN and the Ukrainian system are ambiguous, so there is no reverse mode for them."],
      ["Are Kazakh and Ukrainian supported?", "Yes. The language is detected from its letters (қ, ә, ң… for Kazakh; ї, є, ґ for Ukrainian), or you can pick it yourself."],
    ],
  ),
  related: ["keyboard-layout-converter", "case-converter", "word-counter"],
  variants: { title: L("Стандарты транслитерации", "Transliteration standards"), list: () => [...PAGES.map(stdVariant), slugVariant] },
};

/* ───────────── keyboard layout ───────────── */

function layoutTable(locale: Locale): Block {
  const letters = LAYOUT_PAIRS.filter(([en]) => /[a-z`,.;'[\]/]/.test(en));
  return {
    type: "table",
    title: locale === "ru" ? "Соответствие клавиш QWERTY и ЙЦУКЕН" : "QWERTY to ЙЦУКЕН key map",
    head: locale === "ru" ? ["EN", "RU", "EN", "RU", "EN", "RU"] : ["EN", "RU", "EN", "RU", "EN", "RU"],
    rows: Array.from({ length: Math.ceil(letters.length / 3) }, (_, i) => letters.slice(i * 3, i * 3 + 3).flatMap(([a, b]) => [a, b])).map((r) => [...r, "", "", "", ""].slice(0, 6)),
    mono: true,
  };
}

export const keyboardLayoutConverter: ToolDef = {
  slug: "keyboard-layout-converter",
  component: "text/layout",
  icon: "Keyboard",
  popular: true,
  name: L("Перевод раскладки клавиатуры", "Keyboard layout converter"),
  title: L("Перевод раскладки клавиатуры онлайн — ghbdtn → привет", "Keyboard Layout Converter — fix text typed in the wrong layout"),
  h1: L("Перевод текста из неправильной раскладки", "Fix text typed in the wrong keyboard layout"),
  description: L(
    "Забыли переключить раскладку? Вставьте текст — ghbdtn превратится в «привет», а руддщ — в hello. Направление определяется само, знаки препинания тоже переводятся.",
    "Forgot to switch the keyboard layout? Paste the text — ghbdtn turns into «привет» and руддщ into hello. The direction is detected and punctuation mapped.",
  ),
  lead: L("«Ghbdtn? rfr ltkf&» → «Привет, как дела?» — без повторного набора.", "“Ghbdtn? rfr ltkf&” → “Привет, как дела?” — no retyping."),
  keywords: LL(["раскладка", "ghbdtn", "переключить раскладку", "punto switcher", "не та раскладка"], ["wrong keyboard layout", "qwerty to russian", "ghbdtn"]),
  howTo: LL(
    [
      "Вставьте текст, набранный не в той раскладке.",
      "Направление определится автоматически по буквам; при необходимости выберите EN → RU или RU → EN.",
      "Скопируйте исправленный текст.",
    ],
    ["Paste the text typed in the wrong layout.", "The direction is detected from the letters; pick EN → RU or RU → EN if needed.", "Copy the corrected text."],
  ),
  about: LL(
    [
      "Каждый символ заменяется тем, что даёт та же клавиша в другой раскладке — стандартной русской ЙЦУКЕН (Windows) и американской QWERTY. Поэтому переводятся и знаки: «?» в английской раскладке — это «,» в русской, «&» — «?», «,» — «б».",
      "Автоопределение смотрит, каких букв в тексте больше — латинских или кириллических. Для текста вперемешку выберите направление вручную.",
    ],
    [
      "Each character is replaced with what the same key produces in the other layout — the standard Russian ЙЦУКЕН (Windows) and US QWERTY. So punctuation is mapped too: “?” on the English layout is “,” on the Russian one, “&” is “?” and “,” is “б”.",
      "Auto-detection checks which letters dominate — Latin or Cyrillic. For mixed text pick the direction yourself.",
    ],
  ),
  faq: FAQ(
    [
      ["Как перевести ghbdtn в привет?", "Вставьте текст в поле — он сразу превратится в «привет». Инструмент заменяет каждую клавишу английской раскладки на русскую."],
      ["Почему запятая превратилась в «б»?", "На клавише с английской запятой в русской раскладке находится буква «б». Русская запятая — это Shift + «/» в английской раскладке, то есть «?»."],
      ["Работает ли с раскладкой Mac?", "Таблица соответствует стандартным раскладкам Windows. Буквы на Mac расположены так же, а часть знаков препинания — иначе."],
      ["Поддерживается ли казахская раскладка?", "Нет, только русская ЙЦУКЕН и английская QWERTY: в казахской раскладке буквы ә, ғ, қ, ң, ө, ұ, ү, һ, і стоят на цифровом ряду."],
    ],
    [
      ["How do I turn ghbdtn into привет?", "Paste the text — it turns into «привет» at once. Every key of the English layout is replaced with the Russian one."],
      ["Why did a comma become «б»?", "The key with the English comma produces «б» on the Russian layout. The Russian comma is Shift + “/” on the English layout, i.e. “?”."],
      ["Does it work with Mac layouts?", "The map follows the standard Windows layouts. Letters are in the same places on a Mac, some punctuation isn’t."],
      ["Is the Kazakh layout supported?", "No, only Russian ЙЦУКЕН and English QWERTY; the Kazakh layout puts ә, ғ, қ, ң, ө, ұ, ү, һ, і on the number row."],
    ],
  ),
  blocks: (locale) => [layoutTable(locale)],
  related: ["transliteration", "case-converter", "text-cleaner"],
  variants: {
    title: L("Направления", "Directions"),
    list: () => [
      {
        slug: "en-to-ru",
        name: L("С английской на русскую", "English → Russian"),
        title: L("Перевести текст с английской раскладки на русскую", "Convert English layout text to Russian (ghbdtn → привет)"),
        h1: L("С английской раскладки на русскую", "English layout to Russian"),
        description: L(
          "Текст, набранный латиницей вместо кириллицы, превратится в нормальный русский: ghbdtn → привет, Ntrcn → Текст. Знаки препинания тоже переводятся по клавишам.",
          "Text typed in Latin letters instead of Cyrillic turns into proper Russian: ghbdtn → привет, Ntrcn → Текст. Punctuation is mapped by key too.",
        ),
        lead: L("ghbdtn → привет, ,elet → будет.", "ghbdtn → привет, ,elet → будет."),
        props: { direction: "en-ru" },
        blocks: (locale) => [
          facts(
            locale,
            L("Примеры", "Examples"),
            ["ghbdtn", "Ghbdtn? rfr ltkf&", "Z yt gthtrk.xbk hfcrkflre", ",elet cltkfyj"].map((s) => [s, convertLayout(s, "en-ru")] as [string, string]),
          ),
        ],
        faq: FAQ(
          [["Почему «?» стал запятой?", "Русская запятая набирается Shift + клавиша «/», а в английской раскладке это «?». Поэтому при переводе «?» становится запятой."]],
          [["Why did “?” become a comma?", "The Russian comma is Shift + the “/” key, which types “?” on the English layout, so “?” becomes a comma."]],
        ),
      },
      {
        slug: "ru-to-en",
        name: L("С русской на английскую", "Russian → English"),
        title: L("Перевести текст с русской раскладки на английскую", "Convert Russian layout text to English (руддщ → hello)"),
        h1: L("С русской раскладки на английскую", "Russian layout to English"),
        description: L(
          "Английский текст, случайно набранный в русской раскладке, станет читаемым: руддщ → hello, цщкв → word. Удобно для паролей, адресов и команд, набранных вслепую.",
          "English typed on the Russian layout by mistake becomes readable again: руддщ → hello, цщкв → word. Handy for passwords, addresses and commands typed blind.",
        ),
        lead: L("руддщ → hello, ыщьуерштп → something.", "руддщ → hello, ыщьуерштп → something."),
        props: { direction: "ru-en" },
        blocks: (locale) => [
          facts(
            locale,
            L("Примеры", "Examples"),
            ["руддщ", "Руддщб цщкдв!", "ыщьуерштп", "цццюучфьздуюсщь"].map((s) => [s, convertLayout(s, "ru-en")] as [string, string]),
          ),
        ],
        faq: FAQ(
          [["Можно ли так восстановить пароль?", "Да, если вы набрали пароль в русской раскладке: вставьте то, что получилось, и увидите, какие клавиши были нажаты в английской."]],
          [["Can it recover a password?", "Yes, if you typed it on the Russian layout: paste what you got and see which keys produce on the English layout."]],
        ),
      },
    ],
  },
};
