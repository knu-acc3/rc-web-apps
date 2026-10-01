import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { decimalExpansion, parseQ, q, toText } from "../algebra/rational";

function decimalsTable(locale: Locale): Block {
  const ru = locale === "ru";
  const sep = ru ? "," : ".";
  const rows = ["1/2", "1/3", "2/3", "1/4", "3/4", "1/5", "1/6", "1/8", "3/8", "1/9", "1/10", "1/12"].map((s) => {
    const v = parseQ(s)!;
    const e = decimalExpansion(v);
    return [s, `${e.int}${sep}${e.fixed}${e.repeat ? `(${e.repeat})` : ""}`];
  });
  return { type: "table", title: ru ? "Частые дроби в десятичном виде" : "Common fractions as decimals", head: ru ? ["Дробь", "Десятичная"] : ["Fraction", "Decimal"], rows };
}

function simplifyTable(locale: Locale): Block {
  const ru = locale === "ru";
  const pairs: [number, number][] = [
    [6, 8],
    [12, 16],
    [15, 25],
    [18, 24],
    [21, 28],
    [42, 56],
    [45, 60],
    [64, 96],
    [75, 100],
    [120, 144],
  ];
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  return {
    type: "table",
    title: ru ? "Примеры сокращения дробей" : "Simplifying fractions: examples",
    head: ru ? ["Дробь", "НОД", "Несократимая"] : ["Fraction", "GCD", "Lowest terms"],
    rows: pairs.map(([a, b]) => [`${a}/${b}`, String(gcd(a, b)), toText(q(a, b))]),
  };
}

function variants(): VariantDef[] {
  return [
    {
      slug: "simplify",
      name: { ru: "Сокращение дробей", en: "Simplify fractions" },
      title: { ru: "Сокращение дробей онлайн — несократимая дробь и НОД", en: "Simplify fractions online — lowest terms and GCD" },
      h1: { ru: "Сокращение дробей онлайн", en: "Simplify fractions" },
      description: {
        ru: "Сократите дробь до несократимой: калькулятор находит НОД числителя и знаменателя и делит на него. 42/56 = 3/4, 45/60 = 3/4, 120/144 = 5/6. Смешанные числа тоже.",
        en: "Reduce a fraction to lowest terms: the calculator finds the GCD of the numerator and denominator and divides by it. 42/56 = 3/4, 45/60 = 3/4, 120/144 = 5/6.",
      },
      lead: { ru: "Чтобы сократить дробь, разделите числитель и знаменатель на их НОД: 42/56 → НОД 14 → 3/4.", en: "To simplify a fraction, divide the numerator and denominator by their GCD: 42/56 → GCD 14 → 3/4." },
      props: { mode: "simplify" },
      blocks: (locale) => [simplifyTable(locale)],
      faq: {
        ru: [
          { q: "Как сократить дробь?", a: "Найдите наибольший общий делитель числителя и знаменателя и разделите оба числа на него. 18/24: НОД = 6, получаем 3/4." },
          { q: "Как понять, что дробь несократима?", a: "Если НОД числителя и знаменателя равен 1, например 7/9 или 5/12, дробь уже несократима." },
        ],
        en: [
          { q: "How do I simplify a fraction?", a: "Find the greatest common divisor of the numerator and denominator and divide both by it. 18/24: GCD = 6, giving 3/4." },
          { q: "How do I know a fraction is in lowest terms?", a: "If the GCD of the numerator and denominator is 1, as in 7/9 or 5/12, it cannot be simplified further." },
        ],
      },
    },
    {
      slug: "decimal-to-fraction",
      name: { ru: "Десятичная в обычную", en: "Decimal to fraction" },
      title: { ru: "Перевод десятичной дроби в обычную — онлайн", en: "Decimal to fraction converter — exact result" },
      h1: { ru: "Перевести десятичную дробь в обычную", en: "Convert a decimal to a fraction" },
      description: {
        ru: "Переведите десятичную дробь в обычную: 0,125 = 1/8, 0,75 = 3/4, периодические 0,(3) = 1/3 и 0,1(6) = 1/6. Результат точный и сразу сокращён.",
        en: "Convert decimals to fractions: 0.125 = 1/8, 0.75 = 3/4, and repeating decimals 0.(3) = 1/3 and 0.1(6) = 1/6. The result is exact and already simplified.",
      },
      lead: { ru: "0,125 = 125/1000 = 1/8: запишите цифры после запятой в числитель, 10ⁿ — в знаменатель и сократите.", en: "0.125 = 125/1000 = 1/8: put the digits after the point over 10ⁿ and simplify." },
      props: { mode: "decimal" },
      blocks: (locale) => [decimalsTable(locale)],
      faq: {
        ru: [
          { q: "Как перевести десятичную дробь в обычную?", a: "Запишите число без запятой в числитель, а в знаменатель — 10, 100, 1000 по числу знаков после запятой, затем сократите: 0,36 = 36/100 = 9/25." },
          { q: "Как перевести периодическую дробь?", a: "Период записывается в скобках: 0,(3) = 1/3, 0,(27) = 3/11, 0,1(6) = 1/6. Калькулятор делает это точно." },
        ],
        en: [
          { q: "How do I convert a decimal to a fraction?", a: "Write the digits without the point over 10, 100, 1000… by the number of decimal places, then simplify: 0.36 = 36/100 = 9/25." },
          { q: "How do I convert a repeating decimal?", a: "Put the repeating part in brackets: 0.(3) = 1/3, 0.(27) = 3/11, 0.1(6) = 1/6. The calculator does it exactly." },
        ],
      },
    },
  ];
}

export const fractionsTool: ToolDef = {
  slug: "fraction-calculator",
  component: "calc/fractions",
  icon: "Divide",
  popular: true,
  name: { ru: "Калькулятор дробей", en: "Fraction calculator" },
  title: { ru: "Калькулятор дробей онлайн — с решением по шагам", en: "Fraction calculator with step-by-step solution" },
  h1: { ru: "Калькулятор дробей", en: "Fraction calculator" },
  description: {
    ru: "Сложение, вычитание, умножение и деление обычных дробей и смешанных чисел с решением по шагам, сокращение и перевод десятичных дробей в обычные: 1/2 + 1/3 = 5/6.",
    en: "Add, subtract, multiply and divide fractions and mixed numbers with step-by-step working, simplify fractions and convert decimals to fractions: 1/2 + 1/3 = 5/6.",
  },
  lead: {
    ru: "1/2 + 1/3 = 3/6 + 2/6 = 5/6 — калькулятор показывает каждый шаг и ответ в виде смешанного числа.",
    en: "1/2 + 1/3 = 3/6 + 2/6 = 5/6 — the calculator shows every step and the answer as a mixed number.",
  },
  keywords: {
    ru: ["калькулятор дробей", "сложение дробей", "деление дробей", "смешанные числа", "сократить дробь", "дроби онлайн"],
    en: ["fraction calculator", "adding fractions", "dividing fractions", "mixed numbers", "simplify fractions"],
  },
  props: { mode: "calc" },
  howTo: {
    ru: [
      "Введите две дроби: 3/4, смешанное число через пробел (1 2/3) или десятичную дробь.",
      "Выберите действие: сложение, вычитание, умножение или деление.",
      "Ответ появится в виде обычной дроби, смешанного числа и десятичной записи.",
      "Ниже — решение по шагам: общий знаменатель, действие с числителями, сокращение.",
    ],
    en: [
      "Enter two fractions: 3/4, a mixed number with a space (1 2/3) or a decimal.",
      "Choose the operation: add, subtract, multiply or divide.",
      "The answer appears as a fraction, a mixed number and a decimal.",
      "Below is the step-by-step solution: common denominator, numerators, simplifying.",
    ],
  },
  about: {
    ru: [
      "Чтобы сложить или вычесть дроби, их приводят к общему знаменателю — наименьшему общему кратному знаменателей. Умножают дроби «числитель на числитель, знаменатель на знаменатель», а делят — умножая на перевёрнутую вторую дробь. В конце результат сокращают на НОД.",
      "Калькулятор считает точно, без округлений: числитель и знаменатель могут быть любой длины. Он понимает смешанные числа (1 2/3), отрицательные дроби и периодические десятичные дроби с периодом в скобках — 0,(3).",
    ],
    en: [
      "To add or subtract fractions, bring them to a common denominator — the least common multiple of the denominators. Multiply fractions straight across, and divide by multiplying by the reciprocal of the second fraction. Finally simplify by the GCD.",
      "The calculator works exactly, with no rounding, for numbers of any length. It understands mixed numbers (1 2/3), negative fractions and repeating decimals with the period in brackets — 0.(3).",
    ],
  },
  faq: {
    ru: [
      { q: "Как сложить дроби с разными знаменателями?", a: "Найдите наименьшее общее кратное знаменателей и приведите к нему обе дроби: 1/4 + 1/6 → НОК(4, 6) = 12 → 3/12 + 2/12 = 5/12." },
      { q: "Как разделить дробь на дробь?", a: "Умножьте первую дробь на перевёрнутую вторую: 2/3 ÷ 4/9 = 2/3 × 9/4 = 18/12 = 3/2 = 1 1/2." },
      { q: "Как ввести смешанное число?", a: "Через пробел: 2 1/4 — это две целых и одна четвёртая, то есть 9/4." },
    ],
    en: [
      { q: "How do I add fractions with different denominators?", a: "Find the least common multiple of the denominators and convert both fractions: 1/4 + 1/6 → LCM(4, 6) = 12 → 3/12 + 2/12 = 5/12." },
      { q: "How do I divide fractions?", a: "Multiply the first fraction by the reciprocal of the second: 2/3 ÷ 4/9 = 2/3 × 9/4 = 18/12 = 3/2 = 1 1/2." },
      { q: "How do I enter a mixed number?", a: "With a space: 2 1/4 means two and a quarter, i.e. 9/4." },
    ],
  },
  related: ["percentage-calculator", "gcd-lcm-calculator", "ratio-calculator", "scientific-calculator", "proportion-calculator"],
  variants: { title: { ru: "Ещё о дробях", en: "More fraction tools" }, list: variants },
};
