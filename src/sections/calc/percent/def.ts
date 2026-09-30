import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { fmtN, fmtPct } from "../kit/fmt";
import { computePercent, PERCENT_MODES, type PercentMode } from "./engine";

const n = (locale: Locale, x: number) => fmtN(locale, x, 4);
const p = (locale: Locale, x: number) => fmtPct(locale, x, 2);
const val = (mode: PercentMode, a: number, b: number) => {
  const r = computePercent(mode, a, b);
  return r.ok ? r.value : NaN;
};
const sgn = (s: string, x: number) => (x > 0 ? `+${s}` : s.replace("-", "−"));

/* ───────────── per-mode tables (computed at build time) ───────────── */

function modeBlocks(mode: PercentMode, locale: Locale): Block[] {
  const ru = locale === "ru";
  switch (mode) {
    case "x-percent-of-y": {
      const bases = [100, 1000, 10000, 100000];
      return [
        {
          type: "table",
          title: ru ? "Таблица: проценты от круглых чисел" : "Table: percentages of round numbers",
          head: [ru ? "Процент" : "Percent", ...bases.map((b) => (ru ? `от ${n(locale, b)}` : `of ${n(locale, b)}`))],
          rows: [1, 2, 3, 5, 10, 12, 15, 16, 20, 25, 30, 40, 50, 75].map((x) => [p(locale, x), ...bases.map((b) => n(locale, val(mode, x, b)))]),
        },
      ];
    }
    case "what-percent": {
      const rows: [number, number][] = [
        [1, 2],
        [1, 3],
        [2, 3],
        [1, 4],
        [3, 4],
        [1, 5],
        [1, 8],
        [3, 8],
        [1, 10],
        [1, 20],
        [7, 12],
        [45, 60],
      ];
      return [
        {
          type: "table",
          title: ru ? "Частые доли в процентах" : "Common fractions as percentages",
          head: [ru ? "Часть" : "Part", ru ? "Целое" : "Whole", ru ? "Процент" : "Percent"],
          rows: rows.map(([a, b]) => [n(locale, a), n(locale, b), p(locale, val(mode, a, b))]),
        },
      ];
    }
    case "percent-change": {
      const rows: [number, number][] = [
        [100, 110],
        [100, 150],
        [100, 200],
        [80, 100],
        [100, 80],
        [200, 100],
        [50, 100],
        [250, 300],
        [1000, 1160],
        [1200, 900],
      ];
      return [
        {
          type: "table",
          title: ru ? "Примеры изменения в процентах" : "Percent change examples",
          head: [ru ? "Было" : "From", ru ? "Стало" : "To", ru ? "Изменение" : "Change"],
          rows: rows.map(([a, b]) => [n(locale, a), n(locale, b), sgn(p(locale, val(mode, a, b)), val(mode, a, b))]),
        },
        {
          type: "facts",
          title: ru ? "Рост и снижение несимметричны" : "Increases and decreases are not symmetric",
          rows: [
            [ru ? "Со 100 до 200" : "From 100 to 200", ru ? "+100 %" : "+100%"],
            [ru ? "С 200 до 100" : "From 200 to 100", ru ? "−50 %" : "−50%"],
            [ru ? "Со 100 до 125" : "From 100 to 125", ru ? "+25 %" : "+25%"],
            [ru ? "Со 125 до 100" : "From 125 to 100", ru ? "−20 %" : "−20%"],
          ],
        },
      ];
    }
    case "add-percent":
    case "subtract-percent": {
      const add = mode === "add-percent";
      const ps = add ? [1, 3, 5, 10, 12, 15, 16, 18, 20, 22, 25, 30, 50, 100] : [1, 3, 5, 10, 12, 15, 20, 25, 30, 40, 50, 60, 70, 90];
      const bases = [100, 1000, 25000, 100000];
      return [
        {
          type: "table",
          title: add ? (ru ? "Число плюс процент" : "Number plus percent") : ru ? "Число минус процент" : "Number minus percent",
          head: [ru ? "Процент" : "Percent", ...bases.map((b) => n(locale, b))],
          rows: ps.map((x) => [`${add ? "+" : "−"}${p(locale, x)}`, ...bases.map((b) => n(locale, val(mode, b, x)))]),
        },
      ];
    }
    case "reverse-percent": {
      const rows: [number, number][] = [
        [10, 5],
        [30, 15],
        [50, 20],
        [120, 12],
        [160, 16],
        [200, 25],
        [450, 30],
        [1000, 40],
        [75, 75],
        [300, 150],
      ];
      return [
        {
          type: "table",
          title: ru ? "Примеры: целое по части и проценту" : "Examples: whole from a part and a percentage",
          head: [ru ? "Часть" : "Part", ru ? "Это процент" : "Is this percent", ru ? "Целое" : "Whole"],
          rows: rows.map(([a, b]) => [n(locale, a), p(locale, b), n(locale, val(mode, a, b))]),
        },
      ];
    }
    case "percentage-points": {
      const rows: [number, number][] = [
        [12, 16],
        [20, 22],
        [5, 7.5],
        [10, 15],
        [16, 14],
        [3, 4],
        [45, 50],
        [60, 48],
      ];
      return [
        {
          type: "table",
          title: ru ? "Процентные пункты и относительное изменение" : "Percentage points vs relative change",
          head: [ru ? "Было" : "From", ru ? "Стало" : "To", ru ? "П. п." : "pp", ru ? "Относительно" : "Relative"],
          rows: rows.map(([a, b]) => {
            const r = computePercent(mode, a, b);
            const pp = r.ok ? r.value : NaN;
            const rel = r.ok && r.relative !== undefined ? r.relative : NaN;
            return [p(locale, a), p(locale, b), sgn(n(locale, pp), pp), sgn(p(locale, rel), rel)];
          }),
        },
      ];
    }
  }
}

/* ───────────── texts ───────────── */

interface ModeText {
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  keywords: [string[], string[]];
  faq: [QA[], QA[]];
}

const MODE_TEXT: Record<PercentMode, ModeText> = {
  "x-percent-of-y": {
    name: ["Процент от числа", "Percent of a number"],
    title: ["Процент от числа — посчитать онлайн", "Percent of a number calculator"],
    h1: ["Как найти процент от числа", "How to find a percent of a number"],
    description: [
      "Сколько будет 15 % от 200? Ответ — 30. Калькулятор находит процент от любого числа по формуле Число × Процент / 100 и даёт таблицу частых значений.",
      "What is 15% of 200? It is 30. Find any percentage of a number with the formula Number × Percent / 100, plus a table of common values.",
    ],
    lead: ["15 % от 200 = 30: умножьте число на процент и разделите на 100.", "15% of 200 = 30: multiply the number by the percentage and divide by 100."],
    keywords: [["процент от числа", "найти процент", "сколько будет процентов"], ["percent of number", "percentage of", "what is x percent of y"]],
    faq: [
      [
        { q: "Как посчитать 20 % от числа?", a: "Умножьте число на 20 и разделите на 100 — или просто умножьте на 0,2. Например, 20 % от 3 500 = 3 500 × 0,2 = 700." },
        { q: "Как найти 10 % от числа в уме?", a: "Сдвиньте запятую на один знак влево: 10 % от 4 250 = 425. Отсюда легко получить 5 % (половина — 212,5) и 20 % (вдвое больше — 850)." },
        { q: "Можно ли посчитать процент больше 100?", a: "Да. 150 % от 80 = 120: формула та же, результат просто больше исходного числа." },
      ],
      [
        { q: "How do I calculate 20% of a number?", a: "Multiply the number by 20 and divide by 100 — or simply multiply by 0.2. For example, 20% of 3,500 = 3,500 × 0.2 = 700." },
        { q: "How can I find 10% in my head?", a: "Move the decimal point one place to the left: 10% of 4,250 = 425. From there, 5% is half (212.5) and 20% is double (850)." },
        { q: "Can I calculate a percentage above 100?", a: "Yes. 150% of 80 = 120 — the formula is the same, the result is simply larger than the original number." },
      ],
    ],
  },
  "what-percent": {
    name: ["Сколько процентов", "What percent"],
    title: ["Сколько процентов составляет число от числа", "What percent of a number is another number"],
    h1: ["Сколько процентов одно число составляет от другого", "What percent is one number of another"],
    description: [
      "Узнайте, какую долю в процентах одно число составляет от другого: 30 от 200 — это 15 %. Формула Часть / Целое × 100 и таблица частых дробей.",
      "Find what percent one number is of another: 30 out of 200 is 15%. Uses the formula Part / Whole × 100, with a table of common fractions in percent.",
    ],
    lead: ["30 от 200 — это 15 %: разделите часть на целое и умножьте на 100.", "30 out of 200 is 15%: divide the part by the whole and multiply by 100."],
    keywords: [["сколько процентов составляет", "процентное соотношение", "доля в процентах"], ["what percent", "percentage of total", "part of whole percent"]],
    faq: [
      [
        { q: "Как узнать, сколько процентов составляет число?", a: "Разделите число на целое и умножьте на 100. Например, 45 из 60 — это 45 / 60 × 100 = 75 %." },
        { q: "Как посчитать процент выполнения плана?", a: "Факт делите на план и умножайте на 100: 1 150 при плане 1 000 — это 115 %, план перевыполнен на 15 %." },
        { q: "Почему получилось больше 100 %?", a: "Потому что часть больше целого. Это нормально, например когда продажи превысили план." },
      ],
      [
        { q: "How do I find what percent a number is of another?", a: "Divide the part by the whole and multiply by 100. For example, 45 out of 60 is 45 / 60 × 100 = 75%." },
        { q: "How do I calculate percent of a target achieved?", a: "Divide the actual result by the target and multiply by 100: 1,150 against a target of 1,000 is 115%, i.e. 15% over target." },
        { q: "Why is the answer above 100%?", a: "Because the part is larger than the whole — for example, when sales exceed the plan." },
      ],
    ],
  },
  "percent-change": {
    name: ["Изменение в процентах", "Percent change"],
    title: ["На сколько процентов изменилось число — калькулятор", "Percent change calculator — increase and decrease"],
    h1: ["На сколько процентов увеличилось или уменьшилось число", "Percent change between two numbers"],
    description: [
      "Процентное изменение между двумя числами: с 80 до 100 — рост на 25 %, со 100 до 80 — снижение на 20 %. Формула (Стало − Было) / Было × 100 и примеры.",
      "Percent change between two values: 80 to 100 is a 25% increase, 100 to 80 is a 20% decrease. Formula (New − Old) / Old × 100 with worked examples.",
    ],
    lead: ["С 80 до 100 — это +25 %: разность делится на исходное значение.", "From 80 to 100 is +25%: the difference is divided by the original value."],
    keywords: [["процентное изменение", "на сколько процентов увеличилось", "прирост в процентах", "разница в процентах"], ["percent change", "percentage increase", "percentage decrease", "percent difference"]],
    faq: [
      [
        { q: "Как посчитать, на сколько процентов выросла цена?", a: "Из новой цены вычтите старую, разделите на старую и умножьте на 100. Цена выросла с 1 200 до 1 380 ₸: (1 380 − 1 200) / 1 200 × 100 = 15 %." },
        { q: "Почему рост на 100 % и падение на 50 % возвращают к исходному числу?", a: "Процент считается от разной базы: 100 → 200 — это +100 % от 100, а 200 → 100 — это −50 % от 200." },
        { q: "Что делать, если исходное значение равно нулю?", a: "Процентное изменение от нуля не определено — на ноль делить нельзя. В этом случае указывают абсолютную разницу." },
      ],
      [
        { q: "How do I calculate a price increase in percent?", a: "Subtract the old price from the new one, divide by the old price and multiply by 100: from $1,200 to $1,380 is (1,380 − 1,200) / 1,200 × 100 = 15%." },
        { q: "Why do +100% and −50% cancel out?", a: "The base differs: 100 → 200 is +100% of 100, while 200 → 100 is −50% of 200." },
        { q: "What if the original value is zero?", a: "Percent change from zero is undefined because you cannot divide by zero. Report the absolute difference instead." },
      ],
    ],
  },
  "add-percent": {
    name: ["Прибавить процент", "Add a percentage"],
    title: ["Прибавить процент к числу — калькулятор онлайн", "Add a percentage to a number — calculator"],
    h1: ["Как прибавить процент к числу", "How to add a percentage to a number"],
    description: [
      "Прибавьте процент к числу: 1 000 + 16 % = 1 160. Подходит для наценки, цены с НДС и индексации. Формула Число × (1 + Процент / 100) и таблица.",
      "Add a percentage to a number: 1,000 + 16% = 1,160. Useful for markups, prices with VAT and indexation. Formula Number × (1 + Percent / 100) and a table.",
    ],
    lead: ["1 000 + 16 % = 1 160: умножьте число на 1,16.", "1,000 + 16% = 1,160: multiply the number by 1.16."],
    keywords: [["прибавить процент", "плюс процент", "наценка в процентах", "увеличить на процент"], ["add percent", "plus percent", "increase by percent", "markup"]],
    faq: [
      [
        { q: "Как прибавить 20 % к числу?", a: "Умножьте число на 1,2. Например, 2 500 + 20 % = 2 500 × 1,2 = 3 000." },
        { q: "Как посчитать цену с наценкой?", a: "Цена = себестоимость × (1 + наценка / 100). При себестоимости 800 и наценке 35 % цена будет 1 080." },
        { q: "Почему после +10 % и −10 % число меньше исходного?", a: "Вычитание считается уже от увеличенного числа: 100 + 10 % = 110, а 110 − 10 % = 99." },
      ],
      [
        { q: "How do I add 20% to a number?", a: "Multiply the number by 1.2. For example, 2,500 + 20% = 2,500 × 1.2 = 3,000." },
        { q: "How do I calculate a marked-up price?", a: "Price = cost × (1 + markup / 100). With a cost of 800 and a 35% markup, the price is 1,080." },
        { q: "Why is +10% then −10% less than the start?", a: "The subtraction is taken from the larger number: 100 + 10% = 110, and 110 − 10% = 99." },
      ],
    ],
  },
  "subtract-percent": {
    name: ["Вычесть процент", "Subtract a percentage"],
    title: ["Вычесть процент из числа — калькулятор онлайн", "Subtract a percentage from a number — calculator"],
    h1: ["Как вычесть процент из числа", "How to subtract a percentage from a number"],
    description: [
      "Вычтите процент из числа: 1 000 − 20 % = 800. Удобно для скидок, удержаний и снижения цены. Формула Число × (1 − Процент / 100) и таблица значений.",
      "Subtract a percentage from a number: 1,000 − 20% = 800. Handy for discounts, deductions and price cuts. Formula Number × (1 − Percent / 100) and a table.",
    ],
    lead: ["1 000 − 20 % = 800: умножьте число на 0,8.", "1,000 − 20% = 800: multiply the number by 0.8."],
    keywords: [["вычесть процент", "минус процент", "уменьшить на процент", "цена со скидкой"], ["subtract percent", "minus percent", "decrease by percent", "sale price"]],
    faq: [
      [
        { q: "Как вычесть 15 % из суммы?", a: "Умножьте сумму на 0,85. Например, 12 000 − 15 % = 12 000 × 0,85 = 10 200." },
        { q: "Как вычесть НДС из суммы?", a: "Не вычитайте ставку напрямую: цена с НДС 16 % равна 116 % от цены без налога. Цена без НДС = сумма / 1,16 — это умеет калькулятор НДС." },
        { q: "Как посчитать две скидки подряд?", a: "Скидки перемножаются: −20 % и ещё −10 % дают × 0,8 × 0,9 = 0,72, то есть итоговая скидка 28 %, а не 30 %." },
      ],
      [
        { q: "How do I subtract 15% from an amount?", a: "Multiply by 0.85. For example, 12,000 − 15% = 12,000 × 0.85 = 10,200." },
        { q: "How do I remove VAT from a price?", a: "Do not subtract the rate directly: a price with 16% VAT is 116% of the net price, so net = gross / 1.16. The VAT calculator does this for you." },
        { q: "How do two discounts in a row work?", a: "They multiply: −20% and then −10% give × 0.8 × 0.9 = 0.72, i.e. a 28% total discount, not 30%." },
      ],
    ],
  },
  "reverse-percent": {
    name: ["Число по проценту", "Whole from a percentage"],
    title: ["Найти число по его проценту — калькулятор", "Find the whole from a percentage — calculator"],
    h1: ["Как найти число по его проценту", "How to find a number from its percentage"],
    description: [
      "Найдите целое по части и её проценту: 30 — это 15 % от 200. Формула Целое = Часть × 100 / Процент, примеры и мгновенный расчёт онлайн.",
      "Find the whole when you know a part and its percentage: 30 is 15% of 200. Formula Whole = Part × 100 / Percent, with examples and instant results.",
    ],
    lead: ["30 — это 15 % от 200: часть умножьте на 100 и разделите на процент.", "30 is 15% of 200: multiply the part by 100 and divide by the percentage."],
    keywords: [["найти число по проценту", "найти целое по части", "от какого числа процент", "обратный процент"], ["reverse percentage", "find the whole", "x is y percent of what"]],
    faq: [
      [
        { q: "Как найти число, если известен его процент?", a: "Разделите известную часть на процент и умножьте на 100. Если 12 % равны 3 600, то всё число — 3 600 / 12 × 100 = 30 000." },
        { q: "Как найти исходную цену до скидки?", a: "Цена со скидкой — это (100 − скидка) % от исходной. Если после скидки 25 % товар стоит 1 500, исходная цена — 1 500 / 75 × 100 = 2 000." },
        { q: "Чем это отличается от процента от числа?", a: "Здесь известна часть и процент, а найти нужно целое. В обычной задаче наоборот: известно целое, ищем часть." },
      ],
      [
        { q: "How do I find a number when I know its percentage?", a: "Divide the known part by the percentage and multiply by 100. If 12% equals 3,600, the whole is 3,600 / 12 × 100 = 30,000." },
        { q: "How do I find the original price before a discount?", a: "The sale price is (100 − discount)% of the original. If an item costs 1,500 after a 25% discount, the original was 1,500 / 75 × 100 = 2,000." },
        { q: "How is this different from a percent of a number?", a: "Here you know the part and the percentage and look for the whole. In the usual task it is the other way round." },
      ],
    ],
  },
  "percentage-points": {
    name: ["Процентные пункты", "Percentage points"],
    title: ["Процентные пункты — калькулятор разницы процентов", "Percentage points calculator — difference of percents"],
    h1: ["Процентные пункты: разница между процентами", "Percentage points: the difference between two percentages"],
    description: [
      "Разница между процентами в процентных пунктах: ставка выросла с 12 % до 16 % — на 4 п. п., или на 33,33 % в относительном выражении. Расчёт и примеры.",
      "Difference between two percentages in percentage points: a rate rising from 12% to 16% is up 4 pp, or 33.33% in relative terms. Calculator and examples.",
    ],
    lead: ["С 12 % до 16 % — это +4 п. п. и +33,33 % относительно исходного значения.", "From 12% to 16% is +4 pp and +33.33% relative to the starting value."],
    keywords: [["процентные пункты", "п.п.", "разница процентов", "процентный пункт"], ["percentage points", "pp", "difference between percentages", "basis points"]],
    faq: [
      [
        { q: "Чем процентный пункт отличается от процента?", a: "Процентный пункт — это простая разница двух процентов (16 % − 12 % = 4 п. п.), а процент показывает относительное изменение (4 / 12 = 33,33 %)." },
        { q: "Когда говорят о процентных пунктах?", a: "Когда меняются величины, которые сами выражены в процентах: ставки по кредитам и вкладам, налоги, доля голосов, уровень безработицы." },
        { q: "Сколько базисных пунктов в одном процентном пункте?", a: "100. Базисный пункт — это 0,01 п. п.; рост ставки на 0,25 п. п. — это 25 базисных пунктов." },
      ],
      [
        { q: "What is the difference between a percentage point and a percent?", a: "A percentage point is the plain difference between two percentages (16% − 12% = 4 pp), while percent describes the relative change (4 / 12 = 33.33%)." },
        { q: "When are percentage points used?", a: "Whenever the values are themselves percentages: interest rates, tax rates, vote shares, unemployment rates." },
        { q: "How many basis points are in a percentage point?", a: "100. One basis point is 0.01 pp, so a 0.25 pp rate hike is 25 basis points." },
      ],
    ],
  },
};

function variants(): VariantDef[] {
  return PERCENT_MODES.map((mode) => {
    const x = MODE_TEXT[mode];
    return {
      slug: mode,
      name: { ru: x.name[0], en: x.name[1] },
      title: { ru: x.title[0], en: x.title[1] },
      h1: { ru: x.h1[0], en: x.h1[1] },
      description: { ru: x.description[0], en: x.description[1] },
      lead: { ru: x.lead[0], en: x.lead[1] },
      keywords: { ru: x.keywords[0], en: x.keywords[1] },
      props: { mode },
      faq: { ru: x.faq[0], en: x.faq[1] },
      blocks: (locale) => modeBlocks(mode, locale),
    };
  });
}

export const percentTool: ToolDef = {
  slug: "percentage-calculator",
  component: "calc/percent",
  icon: "Percent",
  popular: true,
  name: { ru: "Калькулятор процентов", en: "Percentage calculator" },
  title: { ru: "Калькулятор процентов онлайн — все виды расчёта", en: "Percentage calculator — percent of, change, add, subtract" },
  h1: { ru: "Калькулятор процентов", en: "Percentage calculator" },
  description: {
    ru: "Калькулятор процентов онлайн: процент от числа, сколько процентов составляет число, изменение в %, прибавить и вычесть процент, процентные пункты.",
    en: "Free percentage calculator: percent of a number, what percent one number is of another, percent change, add or subtract a percentage, percentage points.",
  },
  lead: {
    ru: "Семь видов расчёта процентов на одной странице — ответ и формула появляются сразу при вводе.",
    en: "Seven kinds of percentage calculations on one page — the answer and the formula appear as you type.",
  },
  keywords: {
    ru: ["проценты", "процент от числа", "калькулятор процентов", "посчитать процент"],
    en: ["percent", "percentage", "percent calculator", "calculate percentage"],
  },
  props: { mode: "x-percent-of-y" },
  howTo: {
    ru: [
      "Выберите вкладку с нужным видом расчёта: процент от числа, изменение, прибавить или вычесть процент.",
      "Введите два числа — можно с пробелами и запятой, например «1 000,5».",
      "Ответ, развёрнутая формула и пояснение обновляются сразу, без кнопки «Рассчитать».",
      "Скопируйте результат или ссылку на расчёт, чтобы отправить её коллеге.",
    ],
    en: [
      "Pick a tab for the calculation you need: percent of a number, change, add or subtract a percentage.",
      "Enter two numbers — separators are fine, e.g. 1,000.5.",
      "The answer, the worked formula and a short explanation update instantly — there is no Calculate button.",
      "Copy the result or a link to the calculation to share it.",
    ],
  },
  about: {
    ru: [
      "Процент — это сотая доля числа. Почти любая бытовая задача с процентами сводится к одной из семи формул на этой странице: найти процент от числа, долю в процентах, изменение, число с наценкой или скидкой, целое по части или разницу в процентных пунктах.",
      "Калькулятор показывает не только ответ, но и формулу с вашими числами — удобно проверить расчёт или объяснить его. Точность можно ограничить нужным числом знаков после запятой.",
      "Состояние расчёта сохраняется в адресе страницы, поэтому ссылкой можно поделиться. Все вычисления выполняются в браузере.",
    ],
    en: [
      "A percent is one hundredth of a number. Almost any everyday percentage problem is one of the seven formulas on this page: a percent of a number, a share in percent, a change, a price with a markup or discount, the whole from a part, or a difference in percentage points.",
      "The calculator shows the formula with your numbers, not just the answer — handy for checking the result or explaining it. You can round the output to a fixed number of decimal places.",
      "The calculation is stored in the page address, so you can share it with a link. Everything runs in your browser.",
    ],
  },
  faq: {
    ru: [
      { q: "Как посчитать процент от числа?", a: "Умножьте число на процент и разделите на 100: 15 % от 200 = 200 × 15 / 100 = 30." },
      { q: "Как узнать, сколько процентов составляет одно число от другого?", a: "Разделите часть на целое и умножьте на 100: 30 от 200 — это 30 / 200 × 100 = 15 %." },
      { q: "Как посчитать изменение в процентах?", a: "(Стало − Было) / Было × 100. Рост с 80 до 100 — это +25 %, снижение со 100 до 80 — −20 %." },
      { q: "Чем проценты отличаются от процентных пунктов?", a: "Процентные пункты — разница двух процентов: с 12 % до 16 % — это +4 п. п., или +33,33 % в относительном выражении." },
    ],
    en: [
      { q: "How do I calculate a percent of a number?", a: "Multiply the number by the percentage and divide by 100: 15% of 200 = 200 × 15 / 100 = 30." },
      { q: "How do I find what percent one number is of another?", a: "Divide the part by the whole and multiply by 100: 30 out of 200 is 30 / 200 × 100 = 15%." },
      { q: "How do I calculate percent change?", a: "(New − Old) / Old × 100. Going from 80 to 100 is +25%; from 100 to 80 is −20%." },
      { q: "What is the difference between percent and percentage points?", a: "Percentage points are the plain difference of two percentages: 12% to 16% is +4 pp, or +33.33% in relative terms." },
    ],
  },
  related: ["discount-calculator", "vat-calculator", "markup-margin-calculator", "proportion-calculator", "fraction-calculator"],
  variants: { title: { ru: "Виды расчёта процентов", en: "Percentage calculations" }, list: variants },
};
