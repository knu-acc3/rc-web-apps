import type { L10n, Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { NAME_LISTS, feminineSurname, ruPatronymic, type Gender, type NameFormat, type NameLang } from "../lib/names";
import { L, num } from "./common";

interface NamePreset {
  slug: string;
  lang?: NameLang;
  gender?: Gender;
  format?: NameFormat;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq: Record<Locale, QA[]>;
}

const N = {
  ru: [NAME_LISTS.ru.male.length, NAME_LISTS.ru.female.length, NAME_LISTS.ru.surnames.length],
  kk: [NAME_LISTS.kk.male.length, NAME_LISTS.kk.female.length, NAME_LISTS.kk.surnames.length],
  en: [NAME_LISTS.en.male.length, NAME_LISTS.en.female.length, NAME_LISTS.en.surnames.length],
};

const PRESETS: NamePreset[] = [
  {
    slug: "russian",
    lang: "ru",
    name: { ru: "Русские имена", en: "Russian names" },
    title: { ru: "Генератор русских имён и фамилий онлайн", en: "Random Russian Name Generator — first and last names" },
    h1: { ru: "Генератор русских имён", en: "Random Russian name generator" },
    description: {
      ru: `Случайные русские имена и фамилии: ${N.ru[0]} мужских и ${N.ru[1]} женских имён, ${N.ru[2]} фамилий с правильной женской формой (Иванов — Иванова). Можно получить ФИО с отчеством.`,
      en: `Random Russian names: ${N.ru[0]} male and ${N.ru[1]} female first names and ${N.ru[2]} surnames with the correct feminine form (Ivanov → Ivanova). In Cyrillic or Latin letters.`,
    },
    lead: { ru: "Русские имена, фамилии и отчества — от одного до 50 за раз.", en: "Russian first names, surnames and patronymics — up to 50 at a time." },
    note: {
      ru: "Фамилии склоняются по роду: Иванов — Иванова, Вишневский — Вишневская, а Шевченко и Черных не меняются. Отчества образуются по правилам: Сергей — Сергеевич, Юрий — Юрьевич, Илья — Ильич.",
      en: "Russian surnames change with gender: Ivanov becomes Ivanova, Vishnevsky becomes Vishnevskaya, while Shevchenko stays the same. Turn on “Latin letters” for passport-style spelling.",
    },
    faq: {
      ru: [{ q: "Как образуются отчества?", a: "По правилам русского языка: Иван — Иванович/Ивановна, Сергей — Сергеевич, Юрий — Юрьевич, Лев — Львович, Илья — Ильич/Ильинична." }],
      en: [{ q: "How are the Latin spellings made?", a: "With a readable passport-style transliteration: Бауыржан → Bauyrzhan, Дмитрий → Dmitry, Юлия → Yulia." }],
    },
  },
  {
    slug: "kazakh",
    lang: "kk",
    name: { ru: "Казахские имена", en: "Kazakh names" },
    title: { ru: "Генератор казахских имён и фамилий онлайн", en: "Random Kazakh Name Generator — names and surnames" },
    h1: { ru: "Генератор казахских имён", en: "Random Kazakh name generator" },
    description: {
      ru: `Случайные казахские имена и фамилии: ${N.kk[0]} мужских и ${N.kk[1]} женских имён, ${N.kk[2]} фамилий (Нурланов — Нурланова), отчества на -ович/-овна или -ұлы/-қызы.`,
      en: `Random Kazakh names: ${N.kk[0]} male and ${N.kk[1]} female first names, ${N.kk[2]} surnames (Nurlanov → Nurlanova) and patronymics in -ovich/-ovna or -uly/-kyzy.`,
    },
    lead: { ru: "Казахские имена, фамилии и отчества — от одного до 50 за раз.", en: "Kazakh first names, surnames and patronymics — up to 50 at a time." },
    note: {
      ru: "Имена даны в написании, принятом в русскоязычных документах Казахстана. Отчество можно получить в двух вариантах: Нурланович/Нурлановна или по-казахски — Нурланұлы/Нурланқызы.",
      en: "Names use the spelling common in Russian-language documents in Kazakhstan. Patronymics come in two styles: Nurlanovich/Nurlanovna or the Kazakh Nurlanuly/Nurlankyzy.",
    },
    faq: {
      ru: [{ q: "Что значат -ұлы и -қызы?", a: "Это казахские формы отчества: -ұлы означает «сын», -қызы — «дочь». Нурланұлы — «сын Нурлана», Нурланқызы — «дочь Нурлана»." }],
      en: [{ q: "What do -uly and -kyzy mean?", a: "They're the Kazakh patronymic forms: -uly means “son of” and -kyzy “daughter of”. Nurlanuly is “son of Nurlan”." }],
    },
  },
  {
    slug: "english",
    lang: "en",
    name: { ru: "Английские имена", en: "English names" },
    title: { ru: "Генератор английских имён и фамилий", en: "Random English Name Generator — first and last names" },
    h1: { ru: "Генератор английских имён", en: "Random English name generator" },
    description: {
      ru: `Случайные английские имена и фамилии латиницей: ${N.en[0]} мужских и ${N.en[1]} женских имён, ${N.en[2]} распространённых фамилий. Для персонажей, тестовых данных и изучения языка.`,
      en: `Random English names: ${N.en[0]} male and ${N.en[1]} female first names plus ${N.en[2]} common surnames. Useful for characters, placeholder data, games and baby-name ideas.`,
    },
    lead: { ru: "Английские имена и фамилии — от одного до 50 за раз.", en: "English first and last names — up to 50 at a time." },
    note: {
      ru: "В списках распространённые имена и фамилии англоязычных стран — от James и Olivia до Smith и Taylor. Английские фамилии не меняются по роду.",
      en: "The lists hold common names and surnames from English-speaking countries — from James and Olivia to Smith and Taylor.",
    },
    faq: {
      ru: [{ q: "Где пригодятся английские имена?", a: "Для персонажей рассказов и игр, тестовых аккаунтов, диалогов на уроках английского и примеров в документации." }],
      en: [{ q: "Are these real names?", a: "Yes, they're common real-world first names and surnames, combined at random — any match with a real person is a coincidence." }],
    },
  },
  {
    slug: "male",
    gender: "male",
    name: { ru: "Мужские имена", en: "Male names" },
    title: { ru: "Случайное мужское имя — генератор онлайн", en: "Random Male Name Generator — boys' names" },
    h1: { ru: "Случайное мужское имя", en: "Random male name" },
    description: {
      ru: "Случайные мужские имена: русские, казахские или английские, с фамилией или без. Более 100 имён в каждом списке, до 50 имён за раз без повторов.",
      en: "Random male names: English, Russian or Kazakh, with or without a surname. Over 100 names in every list, up to 50 names at a time with no repeats.",
    },
    lead: { ru: "Мужские имена из русского, казахского или английского списка.", en: "Male names from the English, Russian or Kazakh lists." },
    note: {
      ru: "Нужно имя для персонажа или тестового аккаунта? Выберите язык и формат: только имя, имя с фамилией или полное ФИО.",
      en: "Need a name for a character or a test account? Pick the language and the format: first name only or first and last name.",
    },
    faq: {
      ru: [{ q: "Можно получить имя с отчеством?", a: "Да, для русских и казахских имён выберите формат «ФИО»: например, Сергеев Андрей Николаевич." }],
      en: [{ q: "Can I get a surname too?", a: "Yes, choose “First + last name”. Russian and Kazakh surnames automatically take the right form." }],
    },
  },
  {
    slug: "female",
    gender: "female",
    name: { ru: "Женские имена", en: "Female names" },
    title: { ru: "Случайное женское имя — генератор онлайн", en: "Random Female Name Generator — girls' names" },
    h1: { ru: "Случайное женское имя", en: "Random female name" },
    description: {
      ru: "Случайные женские имена: русские, казахские или английские, с фамилией в женской форме (Смирнова, Вишневская). Более 100 имён в каждом списке, до 50 за раз.",
      en: "Random female names: English, Russian or Kazakh, with surnames in the feminine form where the language needs it. Over 100 names per list, up to 50 at once.",
    },
    lead: { ru: "Женские имена с правильной формой фамилии и отчества.", en: "Female names with correctly formed surnames." },
    note: {
      ru: "Для женских имён фамилия и отчество автоматически ставятся в женскую форму: Смирнова Анна Сергеевна, Нурланова Айгерим Маратовна.",
      en: "For Russian and Kazakh female names the surname automatically takes the feminine form: Smirnova, Vishnevskaya, Nurlanova.",
    },
    faq: {
      ru: [{ q: "Правильно ли склоняются фамилии?", a: "Да: фамилии на -ов, -ев, -ин получают окончание -а, на -ский — -ская, а Шевченко или Черных не меняются." }],
      en: [{ q: "Do surnames change for women?", a: "In Russian and Kazakh, yes: Ivanov becomes Ivanova and Vishnevsky becomes Vishnevskaya. English surnames stay the same." }],
    },
  },
  {
    slug: "full-name",
    format: "fio",
    name: { ru: "ФИО", en: "Full names" },
    title: { ru: "Генератор ФИО онлайн — фамилия, имя и отчество", en: "Random Full Name Generator — first and last names" },
    h1: { ru: "Генератор ФИО", en: "Random full name generator" },
    description: {
      ru: "Генератор ФИО: случайные фамилия, имя и отчество с правильными формами для мужчин и женщин. Русские и казахские ФИО, до 50 за раз, результат копируется.",
      en: "Random full name generator: first name plus surname in English, Russian or Kazakh, with correct feminine surname forms. Up to 50 names at a time, ready to copy.",
    },
    lead: { ru: "Фамилия, имя и отчество — в правильной форме для мужчин и женщин.", en: "First and last names, correctly formed for men and women." },
    note: {
      ru: "ФИО удобно для тестовых данных, образцов документов и анкет. Порядок — как в официальных бумагах: сначала фамилия, затем имя и отчество. Совпадение с реальным человеком случайно.",
      en: "Full names are handy for test data, sample documents and forms. Names are combined at random, so any match with a real person is a coincidence.",
    },
    faq: {
      ru: [{ q: "Можно использовать ФИО для тестовых данных?", a: "Да, для этого генератор и нужен: имена и фамилии сочетаются случайно, настоящих людей среди них нет, а совпадения случайны." }],
      en: [{ q: "Can I use these names for test data?", a: "Yes, that's a common use: first names and surnames are combined at random, so they don't describe real people." }],
    },
  },
];

function nameBlocks(p: NamePreset, locale: Locale): Block[] {
  const lang: NameLang = p.lang ?? (locale === "en" ? "en" : "ru");
  const lists = NAME_LISTS[lang];
  const langName = L(locale, { ru: "русском", en: "английском", kk: "казахском" }, { ru: "Russian", en: "English", kk: "Kazakh" })[lang];
  const rows: [string, string][] = [
    [L(locale, "Мужских имён", "Male first names"), num(locale, lists.male.length)],
    [L(locale, "Женских имён", "Female first names"), num(locale, lists.female.length)],
    [L(locale, "Фамилий", "Surnames"), num(locale, lists.surnames.length)],
    [L(locale, "Комбинаций «имя + фамилия»", "First + last name combinations"), num(locale, (lists.male.length + lists.female.length) * lists.surnames.length)],
  ];
  const sample = (a: readonly string[], k: number) => a.slice(0, k).join(", ");
  const blocks: Block[] = [{ type: "facts", title: L(locale, `Списки на ${langName} языке`, `${langName} name lists`), rows }];
  if (lang !== "en") {
    const m = lists.male.slice(0, 4);
    blocks.push({
      type: "table",
      title: L(locale, "Как меняются формы", "How the forms change"),
      head: [L(locale, "Мужская форма", "Male"), L(locale, "Женская форма", "Female")],
      rows: [
        ...lists.surnames.slice(0, 3).map((s) => [s, feminineSurname(s)]),
        ...m.slice(0, 3).map((f) => [ruPatronymic(f, "male"), ruPatronymic(f, "female")]),
      ],
    });
  }
  const g = p.gender;
  blocks.push({
    type: "text",
    title: L(locale, "Примеры из списка", "Examples from the list"),
    paragraphs: [
      g === "female"
        ? sample(lists.female, 20)
        : g === "male"
          ? sample(lists.male, 20)
          : `${sample(lists.male, 10)}; ${sample(lists.female, 10)}`,
      p.note[locale],
    ],
  });
  return blocks;
}

const FAIR: Record<Locale, QA> = {
  ru: { q: "Имена повторяются?", a: "В одной выдаче — нет: генератор следит, чтобы все имена в списке были разными. Каждое имя и фамилия выбираются криптографическим генератором браузера с равными шансами." },
  en: { q: "Do names repeat?", a: "Not within one batch: the generator makes sure every name in the list is different. Each first name and surname is picked with equal chances by the browser's cryptographic generator." },
};

function nameVariant(p: NamePreset): VariantDef {
  const props: Record<string, unknown> = {};
  if (p.lang) props.lang = p.lang;
  if (p.gender) props.gender = p.gender;
  if (p.format) props.format = p.format;
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props,
    keywords: { ru: ["генератор имён", p.name.ru.toLowerCase(), "случайное имя"], en: ["name generator", p.name.en.toLowerCase(), "random name"] },
    blocks: (locale) => nameBlocks(p, locale),
    faq: { ru: [...p.faq.ru, FAIR.ru], en: [...p.faq.en, FAIR.en] },
  };
}

export const nameTool: ToolDef = {
  slug: "random-name-generator",
  seoAlt: { ru: ["случайные имена и фамилии", "случайные имена", "имена"], en: ["random first and last names", "random names", "names"] },
  component: "random/name",
  icon: "Contact",
  name: { ru: "Генератор имён", en: "Random name generator" },
  title: { ru: "Генератор случайных имён онлайн — имена, фамилии, ФИО", en: "Random Name Generator — first names, surnames, full names" },
  h1: { ru: "Генератор случайных имён", en: "Random name generator" },
  description: {
    ru: "Генератор случайных имён: русские, казахские и английские имена, фамилии и ФИО с отчеством. Мужские и женские, до 50 за раз, латиницей или кириллицей.",
    en: "Random name generator: English, Russian and Kazakh first names, surnames and full names. Male or female, up to 50 at once, Cyrillic names in Latin letters too.",
  },
  lead: {
    ru: "Выберите язык, пол и формат и нажмите «Сгенерировать».",
    en: "Choose the language, gender and format, then press Generate.",
  },
  keywords: {
    ru: ["случайное имя", "генератор фио", "придумать имя", "имя для персонажа", "генератор фамилий"],
    en: ["name picker", "fake name", "character name", "full name generator", "surname generator"],
  },
  howTo: {
    ru: [
      "Выберите язык имён: русские, казахские или английские.",
      "Укажите пол и формат: только имя, имя и фамилия или ФИО.",
      "Выберите, сколько имён нужно — от 1 до 50.",
      "Нажмите «Сгенерировать» и скопируйте список одной кнопкой.",
    ],
    en: [
      "Choose the name language: English, Russian or Kazakh.",
      "Set the gender and the format: first name only or first and last name.",
      "Choose how many names you need — 1 to 50.",
      "Press Generate and copy the list with one click.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько имён в списках?", a: "Больше 100 в каждом: мужские, женские имена и фамилии отдельно для русского, казахского и английского языков." },
      { q: "Фамилии правильно ставятся в женский род?", a: "Да: Иванов — Иванова, Вишневский — Вишневская, Донской — Донская, а Шевченко и Черных не меняются. Отчества тоже образуются по правилам." },
      { q: "Можно получить имена латиницей?", a: "Да, для русских и казахских имён включите «Латиницей» — получится написание в стиле загранпаспорта: Bauyrzhan, Dmitry, Yulia." },
      FAIR.ru,
    ],
    en: [
      { q: "How many names are in the lists?", a: "Over 100 in each: male names, female names and surnames, separately for English, Russian and Kazakh." },
      { q: "Do Russian surnames get the feminine form?", a: "Yes: Ivanov → Ivanova, Vishnevsky → Vishnevskaya, while Shevchenko stays the same. Russian and Kazakh patronymics follow the rules too." },
      { q: "Can I get Russian or Kazakh names in Latin letters?", a: "Yes, turn on “Latin letters” for a passport-style spelling: Bauyrzhan, Dmitry, Yulia." },
      FAIR.en,
    ],
  },
  about: {
    ru: [
      "Генератор помогает придумать имя персонажу, заполнить тестовую базу или выбрать имя для игры. Имена берутся из списков распространённых русских, казахских и английских имён и фамилий.",
      "Грамматика учитывается: для женщин фамилия и отчество ставятся в женскую форму, а казахское отчество можно получить как в русской форме, так и с -ұлы/-қызы.",
    ],
    en: [
      "The generator helps you name a character, fill a test database or pick a name for a game. Names come from lists of common English, Russian and Kazakh first names and surnames.",
      "Grammar is respected: Russian and Kazakh surnames take the feminine form for women, and Kazakh patronymics are available in both the Russian form and with -uly/-kyzy.",
    ],
  },
  variants: {
    title: { ru: "Какие имена", en: "Name lists" },
    list: () => PRESETS.map(nameVariant),
  },
};
