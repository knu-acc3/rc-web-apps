import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { tableTip } from "./tips";

const NUMBERS = Array.from({ length: 19 }, (_, i) => i + 2);

function tableBlock(locale: Locale, n: number): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? `Таблица умножения на ${n}` : `${n} times table`,
    head: ru ? ["1–10", "11–20"] : ["1–10", "11–20"],
    rows: Array.from({ length: 10 }, (_, i) => [`${n} × ${i + 1} = ${n * (i + 1)}`, `${n} × ${i + 11} = ${n * (i + 11)}`]),
  };
}

function facts(locale: Locale, n: number): Block {
  const ru = locale === "ru";
  const sq = n * n;
  return {
    type: "facts",
    title: ru ? `Таблица на ${n}: главное` : `${n} times table: key facts`,
    rows: ru
      ? [
          ["Как запомнить", tableTip(locale, n)],
          ["Квадрат", `${n} × ${n} = ${sq}`],
          ["Сумма ответов 1–10", String(n * 55)],
          ["Самый большой в 1–10", `${n} × 10 = ${n * 10}`],
        ]
      : [
          ["How to remember", tableTip(locale, n)],
          ["Square", `${n} × ${n} = ${sq}`],
          ["Sum of answers 1–10", String(n * 55)],
          ["Largest in 1–10", `${n} × 10 = ${n * 10}`],
        ],
  };
}

function faq(locale: Locale, n: number): QA[] {
  const a = n <= 9 ? 8 : 7;
  const b = n <= 9 ? 7 : 6;
  if (locale === "ru")
    return [
      { q: `Сколько будет ${n} × ${a}?`, a: `${n} × ${a} = ${n * a}. ${tableTip("ru", n)}` },
      { q: `Как быстро выучить таблицу умножения на ${n}?`, a: `Повторяйте по 5–10 минут в день: сначала читайте столбик вслух, затем закрывайте ответы и проверяйте себя в тренажёре. Трудные примеры, например ${n} × ${b} = ${n * b}, выписывайте отдельно.` },
      { q: `Как распечатать таблицу умножения на ${n}?`, a: "Нажмите «Распечатать» над таблицей — откроется печать только самой таблицы, без меню и рекламы. Можно выбрать вариант до 10 или до 20." },
    ];
  return [
    { q: `What is ${n} × ${a}?`, a: `${n} × ${a} = ${n * a}. ${tableTip("en", n)}` },
    { q: `How can I learn the ${n} times table quickly?`, a: `Practise 5–10 minutes a day: read the column aloud, then cover the answers and test yourself in practice mode. Write down tricky facts such as ${n} × ${b} = ${n * b}.` },
    { q: `How do I print the ${n} times table?`, a: "Click Print above the table — only the table itself is printed, without menus. Choose up to 10 or up to 20." },
  ];
}

function variants(): VariantDef[] {
  return NUMBERS.map((n) => ({
    slug: String(n),
    name: { ru: `на ${n}`, en: `× ${n}` },
    title: { ru: `Таблица умножения на ${n} — распечатать и тренажёр`, en: `${n} times table — printable chart and practice` },
    h1: { ru: `Таблица умножения на ${n}`, en: `${n} times table` },
    description: {
      ru: `Таблица умножения на ${n} от 1 до 20: ${n} × 7 = ${n * 7}, ${n} × 8 = ${n * 8}, ${n} × 9 = ${n * 9}. Приём для запоминания, печать без лишнего и тренажёр со случайными примерами.`,
      en: `The ${n} times table from 1 to 20: ${n} × 7 = ${n * 7}, ${n} × 8 = ${n * 8}, ${n} × 9 = ${n * 9}. A memory trick, a clean printable chart and practice with random questions.`,
    },
    lead: { ru: `${n} × 1 = ${n}, ${n} × 5 = ${n * 5}, ${n} × 10 = ${n * 10}. ${tableTip("ru", n)}`, en: `${n} × 1 = ${n}, ${n} × 5 = ${n * 5}, ${n} × 10 = ${n * 10}. ${tableTip("en", n)}` },
    keywords: { ru: [`таблица умножения на ${n}`, `умножение на ${n}`], en: [`${n} times table`, `multiplication by ${n}`] },
    props: { n },
    blocks: (locale) => [tableBlock(locale, n), facts(locale, n)],
    faq: { ru: faq("ru", n), en: faq("en", n) },
  }));
}

export const multiplicationTool: ToolDef = {
  slug: "multiplication-table",
  component: "calc/multiplication",
  icon: "X",
  popular: true,
  name: { ru: "Таблица умножения", en: "Multiplication table" },
  title: { ru: "Таблица умножения — распечатать и тренажёр онлайн", en: "Multiplication table — printable chart and practice" },
  h1: { ru: "Таблица умножения", en: "Multiplication table" },
  description: {
    ru: "Таблица умножения от 2 до 20: столбики на каждое число, полная таблица 10 × 10 и 20 × 20 с подсветкой строки и столбца, печать без лишнего и тренажёр со счётом.",
    en: "Multiplication tables from 2 to 20: a column for each number, full 10 × 10 and 20 × 20 charts with row and column highlighting, clean printing and a practice mode.",
  },
  lead: {
    ru: "Выберите число — таблица, приём для запоминания и тренажёр с проверкой ответов уже здесь.",
    en: "Pick a number — the table, a memory trick and a practice mode with instant checking are right here.",
  },
  keywords: {
    ru: ["таблица умножения", "таблица умножения распечатать", "тренажёр таблицы умножения", "пифагорова таблица"],
    en: ["multiplication table", "times tables", "printable multiplication chart", "times table practice"],
  },
  props: { n: 7 },
  howTo: {
    ru: [
      "Выберите число или откройте всю таблицу 10 × 10 или 20 × 20.",
      "Наведите курсор на ячейку полной таблицы — подсветятся строка и столбец.",
      "Нажмите «Распечатать», чтобы вывести на печать только таблицу.",
      "Переключитесь в тренажёр и отвечайте на случайные примеры — счёт ведётся автоматически.",
    ],
    en: [
      "Choose a number or open the full 10 × 10 or 20 × 20 chart.",
      "Hover a cell in the full chart to highlight its row and column.",
      "Click Print to print only the table.",
      "Switch to practice and answer random questions — your score is kept automatically.",
    ],
  },
  about: {
    ru: [
      "Таблицу умножения (таблицу Пифагора) обычно учат во 2–3 классе. Помогают две вещи: переместительный закон — 7 × 8 и 8 × 7 одно и то же — и приёмы для отдельных чисел, например правило девяти или удвоение для 4 и 8.",
      "Тренажёр задаёт примеры в случайном порядке, чтобы ответы запоминались, а не заучивались по порядку. Страницы для чисел от 2 до 20 содержат столбик с ответами до 20 и приём для запоминания.",
    ],
    en: [
      "Times tables are usually learned at ages 7–9. Two things help: the commutative law — 7 × 8 equals 8 × 7 — and tricks for particular numbers, such as the nines rule or doubling for 4 and 8.",
      "Practice mode asks questions in random order so facts are remembered rather than recited in sequence. The pages for 2 to 20 list the answers up to 20 with a memory trick.",
    ],
  },
  faq: {
    ru: [
      { q: "Как быстро выучить таблицу умножения?", a: "Начните с простых столбиков (2, 5, 10), затем 3, 4, 9 и в конце 6, 7, 8. Используйте переместительный закон и занимайтесь понемногу каждый день." },
      { q: "Сколько будет 7 × 8?", a: "56. Подсказка: 5, 6, 7, 8 — «56 = 7 × 8»." },
      { q: "Как распечатать таблицу умножения?", a: "Выберите нужный вид и нажмите «Распечатать» — на печать уйдёт только таблица." },
    ],
    en: [
      { q: "How can a child learn times tables quickly?", a: "Start with 2, 5 and 10, then 3, 4 and 9, and finally 6, 7 and 8. Use the fact that order doesn't matter and practise a little every day." },
      { q: "What is 7 × 8?", a: "56. A hint: 5, 6, 7, 8 — '56 = 7 × 8'." },
      { q: "How do I print the multiplication chart?", a: "Choose the view and click Print — only the table is printed." },
    ],
  },
  related: ["percentage-calculator", "fraction-calculator", "scientific-calculator", "gcd-lcm-calculator"],
  variants: { title: { ru: "Таблица умножения на число", en: "Times tables by number" }, list: variants },
};
