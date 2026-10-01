import type { ToolDef } from "@/registry/types";

export const roundingTool: ToolDef = {
  slug: "rounding-calculator",
  component: "calc/rounding",
  icon: "CircleDot",
  name: { ru: "Округление чисел", en: "Rounding calculator" },
  title: { ru: "Округление чисел онлайн — до десятых, сотых, тысяч", en: "Rounding calculator — decimals, significant figures, tens" },
  h1: { ru: "Округление чисел онлайн", en: "Rounding calculator" },
  description: {
    ru: "Округлите число до нужного количества знаков после запятой, значащих цифр, до десятков, сотен или любого шага. Математическое, банковское, вниз и вверх — точно.",
    en: "Round a number to decimal places, significant figures, the nearest 10, 100 or any step. Half up, banker's, floor and ceiling — with exact decimal arithmetic.",
  },
  lead: {
    ru: "2,675 до сотых — 2,68, а 123 456 до двух значащих цифр — 120 000.",
    en: "2.675 to two decimal places is 2.68, and 123,456 to two significant figures is 120,000.",
  },
  keywords: {
    ru: ["округление чисел", "округлить до сотых", "округлить до десятых", "значащие цифры", "банковское округление"],
    en: ["rounding calculator", "round to 2 decimal places", "significant figures", "round to nearest ten", "bankers rounding"],
  },
  props: {},
  howTo: {
    ru: ["Введите число — с запятой или точкой.", "Выберите, до чего округлять: до знаков после запятой, значащих цифр или разряда.", "Выберите правило округления — результат и таблица появятся сразу."],
    en: ["Enter a number.", "Choose what to round to: decimal places, significant figures or a step.", "Pick the rounding rule — the result and a comparison table appear instantly."],
  },
  about: {
    ru: [
      "По школьному правилу цифру округляют вверх, если следующая цифра 5 и больше: 3,146 до сотых — 3,15. Калькулятор работает с точной десятичной записью, поэтому не повторяет ошибку многих программ, где 1,005 превращается в 1,00 из-за двоичного представления чисел.",
      "Банковское округление (к чётному) используют в бухгалтерии и статистике: 2,5 → 2, 3,5 → 4. Округление до значащих цифр удобно для измерений и научной записи: 0,0012345 до трёх значащих — 0,00123.",
    ],
    en: [
      "By the usual rule a digit is rounded up when the next digit is 5 or more: 3.146 to two places is 3.15. The calculator uses exact decimal arithmetic, so it avoids the common bug where 1.005 becomes 1.00 because of binary floating point.",
      "Banker's rounding (half to even) is used in accounting and statistics: 2.5 → 2, 3.5 → 4. Significant figures suit measurements and scientific notation: 0.0012345 to three significant figures is 0.00123.",
    ],
  },
  faq: {
    ru: [
      { q: "Как округлить до сотых?", a: "Оставьте две цифры после запятой и посмотрите на третью: если она 5 или больше, увеличьте вторую на 1. 7,346 → 7,35; 7,344 → 7,34." },
      { q: "Что такое значащие цифры?", a: "Все цифры числа, начиная с первой ненулевой. В 0,00340 три значащие цифры: 3, 4 и последний 0." },
      { q: "Чем банковское округление отличается от обычного?", a: "Только для ровно половины: обычное округляет 2,5 до 3, банковское — до ближайшего чётного, то есть до 2. В остальных случаях результат одинаковый." },
    ],
    en: [
      { q: "How do I round to two decimal places?", a: "Keep two digits after the point and look at the third: if it is 5 or more, increase the second by 1. 7.346 → 7.35; 7.344 → 7.34." },
      { q: "What are significant figures?", a: "All digits from the first non-zero digit. 0.00340 has three significant figures: 3, 4 and the final 0." },
      { q: "How is banker's rounding different?", a: "Only for exact halves: normal rounding sends 2.5 to 3, banker's rounding to the nearest even number, 2. Otherwise the results match." },
    ],
  },
  related: ["percentage-calculator", "scientific-calculator", "average-calculator", "fraction-calculator"],
};
