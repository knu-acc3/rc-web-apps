import type { L10n, Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { jackpotCombinations, matchCounts, type LotteryField } from "../lib/lottery";
import { L, num, oneIn, pct } from "./common";

interface LotteryPreset {
  slug: string;
  fields: LotteryField[];
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
}

const PRESETS: LotteryPreset[] = [
  {
    slug: "6-45",
    fields: [{ pick: 6, of: 45 }],
    name: { ru: "6 из 45", en: "6 of 45" },
    title: { ru: "Генератор чисел 6 из 45 — случайная комбинация", en: "6 of 45 Number Generator — random lottery numbers" },
    h1: { ru: "Генератор чисел 6 из 45", en: "6 of 45 number generator" },
    description: {
      ru: "Случайные числа для лотереи 6 из 45: шесть разных чисел по возрастанию. Всего 8 145 060 комбинаций — шанс угадать все шесть 1 из 8 145 060.",
      en: "Random numbers for a 6 of 45 lottery: six different numbers in ascending order. There are 8,145,060 combinations — a 1 in 8,145,060 chance to match all six.",
    },
    lead: { ru: "Шесть разных чисел от 1 до 45 — одним нажатием.", en: "Six different numbers from 1 to 45 in one click." },
    note: {
      ru: "Формат «6 из 45» — один из самых распространённых в России. Ни одна комбинация не выигрывает чаще другой: 1-2-3-4-5-6 так же вероятна, как любая «красивая» случайная.",
      en: "6 of 45 is one of the most common lottery formats. No combination wins more often than another: 1-2-3-4-5-6 is exactly as likely as any random-looking pick.",
    },
  },
  {
    slug: "5-36",
    fields: [{ pick: 5, of: 36 }],
    name: { ru: "5 из 36", en: "5 of 36" },
    title: { ru: "Генератор чисел 5 из 36 — случайные числа лотереи", en: "5 of 36 Number Generator — random lottery pick" },
    h1: { ru: "Генератор чисел 5 из 36", en: "5 of 36 number generator" },
    description: {
      ru: "Случайные числа для лотереи 5 из 36: пять разных чисел от 1 до 36 по возрастанию. Комбинаций 376 992 — шанс угадать все пять 1 из 376 992.",
      en: "Random numbers for a 5 of 36 lottery: five different numbers from 1 to 36 in ascending order. There are 376,992 combinations — a 1 in 376,992 jackpot chance.",
    },
    lead: { ru: "Пять разных чисел от 1 до 36 — одним нажатием.", en: "Five different numbers from 1 to 36 in one click." },
    note: {
      ru: "В формате «5 из 36» комбинаций почти в 22 раза меньше, чем в «6 из 45», поэтому шанс угадать все числа заметно выше — хотя всё равно очень мал.",
      en: "5 of 36 has about 22 times fewer combinations than 6 of 45, so matching every number is much likelier — though still very unlikely.",
    },
  },
  {
    slug: "6-49",
    fields: [{ pick: 6, of: 49 }],
    name: { ru: "6 из 49", en: "6 of 49" },
    title: { ru: "Генератор чисел 6 из 49 — случайная комбинация", en: "6 of 49 Number Generator — random lotto numbers" },
    h1: { ru: "Генератор чисел 6 из 49", en: "6 of 49 number generator" },
    description: {
      ru: "Случайные числа для лото 6 из 49: шесть разных чисел от 1 до 49 по возрастанию. Всего 13 983 816 комбинаций — шанс угадать все шесть 1 из 13 983 816.",
      en: "Random numbers for 6 of 49 lotto: six different numbers from 1 to 49 in ascending order. 13,983,816 combinations — a 1 in 13,983,816 chance to match all six.",
    },
    lead: { ru: "Шесть разных чисел от 1 до 49 — одним нажатием.", en: "Six different numbers from 1 to 49 in one click." },
    note: {
      ru: "«6 из 49» — классический формат лото, который используют во многих странах. Почти 14 миллионов комбинаций: если покупать один билет в день, на перебор всех ушло бы больше 38 тысяч лет.",
      en: "6 of 49 is the classic lotto format used in many countries. With almost 14 million combinations, buying one ticket a day would take over 38,000 years to cover them all.",
    },
  },
  {
    slug: "7-49",
    fields: [{ pick: 7, of: 49 }],
    name: { ru: "7 из 49", en: "7 of 49" },
    title: { ru: "Генератор чисел 7 из 49 — случайные числа", en: "7 of 49 Number Generator — random numbers" },
    h1: { ru: "Генератор чисел 7 из 49", en: "7 of 49 number generator" },
    description: {
      ru: "Случайные числа для лотереи 7 из 49: семь разных чисел от 1 до 49 по возрастанию. Всего 85 900 584 комбинации — шанс угадать все семь 1 из 85 900 584.",
      en: "Random numbers for a 7 of 49 lottery: seven different numbers from 1 to 49, sorted. 85,900,584 combinations — a 1 in 85,900,584 chance to match all seven.",
    },
    lead: { ru: "Семь разных чисел от 1 до 49 — одним нажатием.", en: "Seven different numbers from 1 to 49 in one click." },
    note: {
      ru: "Седьмое число из того же барабана увеличивает количество комбинаций в 6 с лишним раз по сравнению с «6 из 49».",
      en: "Adding a seventh number from the same drum multiplies the combinations by more than six compared with 6 of 49.",
    },
  },
  {
    slug: "4-20",
    fields: [
      { pick: 4, of: 20 },
      { pick: 4, of: 20 },
    ],
    name: { ru: "4 из 20 (два поля)", en: "4 of 20 × 2" },
    title: { ru: "Генератор чисел 4 из 20 — два поля", en: "4 of 20 Number Generator — two fields" },
    h1: { ru: "Генератор чисел 4 из 20 (два поля)", en: "4 of 20 number generator (two fields)" },
    description: {
      ru: "Случайные числа для лотереи 4 из 20 с двумя полями: по четыре разных числа от 1 до 20 в каждом. Всего 23 474 025 комбинаций билета, у каждого поля 4845.",
      en: "Random numbers for a two-field 4 of 20 lottery: four different numbers from 1 to 20 in each field. 23,474,025 ticket combinations, 4,845 per field.",
    },
    lead: { ru: "Два поля по четыре числа от 1 до 20 — одним нажатием.", en: "Two fields of four numbers from 1 to 20 in one click." },
    note: {
      ru: "В каждом поле 4845 комбинаций, а в билете целиком — 4845², то есть 23 474 025. Числа в двух полях выбираются независимо и могут совпадать.",
      en: "Each field has 4,845 combinations and the whole ticket 4,845², i.e. 23,474,025. The two fields are drawn independently and may share numbers.",
    },
  },
  {
    slug: "powerball",
    fields: [
      { pick: 5, of: 69 },
      { pick: 1, of: 26 },
    ],
    name: { ru: "5 из 69 + 1 из 26", en: "Powerball format" },
    title: { ru: "Генератор чисел 5 из 69 + 1 из 26 (формат Powerball)", en: "Powerball Number Generator — 5 of 69 + 1 of 26" },
    h1: { ru: "Генератор чисел 5 из 69 + 1 из 26", en: "Powerball-format number generator" },
    description: {
      ru: "Случайные числа в формате американской Powerball: 5 разных чисел из 69 и бонус-шар из 26. Комбинаций 292 201 338 — шанс джекпота 1 из 292 201 338.",
      en: "Random numbers in the US Powerball format: 5 different numbers from 69 plus a bonus ball from 26. 292,201,338 combinations — a 1 in 292,201,338 jackpot chance.",
    },
    lead: { ru: "Пять чисел из 69 и один бонус-шар из 26 — одним нажатием.", en: "Five numbers from 69 and one bonus ball from 26 in one click." },
    note: {
      ru: "Сайт не связан с организаторами лотерей и не продаёт билеты — генератор лишь выдаёт случайную комбинацию в этом формате. C(69,5) = 11 238 513, умноженное на 26, даёт 292 201 338.",
      en: "This site isn't affiliated with any lottery operator and sells no tickets — it only generates a random pick in this format. C(69,5) = 11,238,513 times 26 gives 292,201,338.",
    },
  },
  {
    slug: "euromillions",
    fields: [
      { pick: 5, of: 50 },
      { pick: 2, of: 12 },
    ],
    name: { ru: "5 из 50 + 2 из 12", en: "EuroMillions format" },
    title: { ru: "Генератор чисел 5 из 50 + 2 из 12 (формат EuroMillions)", en: "EuroMillions Number Generator — 5 of 50 + 2 of 12" },
    h1: { ru: "Генератор чисел 5 из 50 + 2 из 12", en: "EuroMillions-format number generator" },
    description: {
      ru: "Случайные числа в формате EuroMillions: 5 разных чисел из 50 и 2 «звезды» из 12. Всего 139 838 160 комбинаций — шанс джекпота 1 из 139 838 160.",
      en: "Random numbers in the EuroMillions format: 5 different numbers from 50 plus 2 Lucky Stars from 12. 139,838,160 combinations — a 1 in 139,838,160 jackpot chance.",
    },
    lead: { ru: "Пять чисел из 50 и две «звезды» из 12 — одним нажатием.", en: "Five numbers from 50 and two stars from 12 in one click." },
    note: {
      ru: "Сайт не связан с организаторами лотерей — это только генератор случайной комбинации. C(50,5) = 2 118 760, C(12,2) = 66, их произведение — 139 838 160.",
      en: "This site isn't affiliated with any lottery operator — it only generates a random pick. C(50,5) = 2,118,760 and C(12,2) = 66; their product is 139,838,160.",
    },
  },
];

/** "1 из 557" for rare outcomes, a percentage for common ones. */
function chance(locale: Locale, n: number): string {
  return n >= 100 ? oneIn(locale, Math.round(n)) : pct(locale, 1 / n);
}

function lotteryBlocks(p: LotteryPreset, locale: Locale): Block[] {
  const total = jackpotCombinations(p.fields);
  const main = p.fields[0];
  const mainTotal = jackpotCombinations([main]);
  const counts = matchCounts(main);
  const fieldText = p.fields.map((f) => `${f.pick} ${L(locale, "из", "of")} ${f.of}`).join(" + ");
  const blocks: Block[] = [
    {
      type: "facts",
      title: L(locale, "Коротко", "Quick facts"),
      rows: [
        [L(locale, "Формат", "Format"), fieldText],
        [L(locale, "Всего комбинаций", "Total combinations"), num(locale, total)],
        [L(locale, "Шанс угадать все числа", "Chance to match every number"), oneIn(locale, total)],
        ...(p.fields.length > 1 ? ([[L(locale, "Комбинаций в первом поле", "Combinations in the first field"), num(locale, mainTotal)]] as [string, string][]) : []),
      ],
    },
    {
      type: "table",
      title: L(locale, `Сколько чисел совпадёт: ${main.pick} из ${main.of}`, `How many numbers match: ${main.pick} of ${main.of}`),
      head: [L(locale, "Совпало", "Matched"), L(locale, "Комбинаций", "Combinations"), L(locale, "Вероятность", "Probability")],
      rows: counts
        .map((c, m) => [`${m} ${L(locale, "из", "of")} ${main.pick}`, num(locale, c), chance(locale, Number(mainTotal) / Number(c))] as string[])
        .reverse(),
      caption: L(locale, "Точные числа по гипергеометрическому распределению", "Exact hypergeometric counts"),
    },
    { type: "text", paragraphs: [p.note[locale]] },
  ];
  return blocks;
}

function lotteryFaq(p: LotteryPreset, locale: Locale): QA[] {
  const total = jackpotCombinations(p.fields);
  return locale === "ru"
    ? [
        { q: "Повышает ли генератор шанс на выигрыш?", a: `Нет. Любая комбинация выигрывает с одинаковой вероятностью — ${oneIn(locale, total)}. Генератор лишь избавляет от выбора и от «популярных» чисел вроде дат рождения, которые чаще выбирают другие игроки.` },
        { q: "Могут ли числа повториться в одной комбинации?", a: "Нет, в каждом поле числа разные и идут по возрастанию — как шары, вынутые из барабана без возвращения." },
      ]
    : [
        { q: "Does the generator improve my odds?", a: `No. Every combination wins with the same probability — ${oneIn(locale, total)}. The generator just saves you choosing and avoids “popular” numbers such as birthdays that many other players pick.` },
        { q: "Can a number repeat within a pick?", a: "No, numbers in each field are all different and sorted — like balls drawn from a drum without replacement." },
      ];
}

function lotteryVariant(p: LotteryPreset): VariantDef {
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props: { fields: p.fields, fixed: true },
    keywords: {
      ru: ["лотерея", "генератор чисел лотереи", p.name.ru],
      en: ["lottery numbers", "lotto generator", p.name.en],
    },
    blocks: (locale) => lotteryBlocks(p, locale),
    faq: { ru: lotteryFaq(p, "ru"), en: lotteryFaq(p, "en") },
  };
}

export const lotteryTool: ToolDef = {
  slug: "lottery-number-generator",
  component: "random/lottery",
  icon: "Ticket",
  name: { ru: "Генератор чисел лотереи", en: "Lottery number generator" },
  title: { ru: "Генератор чисел для лотереи — случайные комбинации", en: "Lottery Number Generator — random picks for any lotto" },
  h1: { ru: "Генератор чисел для лотереи", en: "Lottery number generator" },
  description: {
    ru: "Генератор чисел для лотереи: любые форматы вроде 6 из 45 или 5 из 36, второе поле с бонус-шарами, до 10 билетов сразу и точный шанс угадать все числа.",
    en: "Lottery number generator for any format such as 6 of 49 or 5 of 69, with an optional bonus drum, up to 10 tickets at once and the exact jackpot odds.",
  },
  lead: {
    ru: "Выберите формат «сколько из скольких» и получите случайные числа без повторов.",
    en: "Choose the “pick N of M” format and get random numbers without repeats.",
  },
  keywords: {
    ru: ["лотерея", "числа для лотереи", "лото", "спортлото", "случайные числа лотерея"],
    en: ["lotto numbers", "lottery picker", "quick pick", "random lottery numbers"],
  },
  props: { fields: [{ pick: 6, of: 45 }] },
  howTo: {
    ru: [
      "Выберите готовый формат ниже или задайте свой: сколько чисел и из скольких, например 6 из 45.",
      "Для своего формата с бонус-шарами включите второе поле и задайте его размер.",
      "Выберите количество билетов и нажмите «Сгенерировать числа».",
      "Скопируйте комбинации одной кнопкой — числа в каждом поле уже по возрастанию.",
    ],
    en: [
      "Pick a ready-made format below or set your own: how many numbers from how many, e.g. 6 of 49.",
      "For a custom game with bonus balls, turn on the second drum and set its size.",
      "Choose the number of tickets and press “Generate numbers”.",
      "Copy the picks with one click — numbers in each field are already sorted.",
    ],
  },
  faq: {
    ru: [
      { q: "Как считается шанс угадать все числа?", a: "Это число сочетаний C(n, k): для «6 из 45» — 45! / (6! · 39!) = 8 145 060. Если есть второе поле, шансы полей перемножаются." },
      { q: "Бывают ли «счастливые» комбинации?", a: "Нет. Все комбинации равновероятны; последовательность 1, 2, 3, 4, 5, 6 выпадает так же редко, как любая другая." },
      { q: "Сайт связан с лотереями?", a: "Нет. Это только генератор случайных чисел: мы не продаём билеты, не проверяем тиражи и не принимаем ставки." },
      { q: "Насколько случайны числа?", a: "Числа выбираются криптографическим генератором браузера без повторов и без смещения — каждая комбинация равновероятна." },
    ],
    en: [
      { q: "How are the jackpot odds calculated?", a: "They're the number of combinations C(n, k): for 6 of 49 that's 49! / (6! · 43!) = 13,983,816. With a second drum the two counts multiply." },
      { q: "Are there lucky combinations?", a: "No. All combinations are equally likely; 1, 2, 3, 4, 5, 6 is exactly as rare as any other." },
      { q: "Is this site linked to any lottery?", a: "No. It's only a random number generator: we don't sell tickets, check draws or take bets." },
      { q: "How random are the numbers?", a: "They're drawn by the browser's cryptographic generator, without repeats and without bias — every combination is equally likely." },
    ],
  },
  about: {
    ru: [
      "Генератор выбирает числа так же, как лототрон: без повторов и с равными шансами для каждого шара. Для каждого формата показывается точное число комбинаций и шанс угадать все числа.",
      "Результат — просто случайная комбинация. Никакой генератор не может предсказать тираж или повысить шанс выигрыша, поэтому относитесь к лотерее как к развлечению.",
    ],
    en: [
      "The generator picks numbers the way a draw machine does: no repeats and an equal chance for every ball. Each format shows the exact number of combinations and the jackpot odds.",
      "The result is just a random pick. No generator can predict a draw or improve your odds, so treat the lottery as entertainment.",
    ],
  },
  variants: {
    title: { ru: "Форматы лотерей", en: "Lottery formats" },
    list: () => PRESETS.map(lotteryVariant),
  },
};
