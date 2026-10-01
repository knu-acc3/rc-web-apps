import type { L10n, Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { numberGrid } from "../lib/numbers";
import { L, num, pct } from "./common";

interface NumberPreset {
  slug: string;
  min: number;
  max: number;
  decimals?: number;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  note: L10n;
  faq?: Record<Locale, QA>;
}

const r = (min: number, max: number) => ({ min, max });

const PRESETS: NumberPreset[] = [
  {
    slug: "0-1",
    ...r(0, 1),
    decimals: 4,
    name: { ru: "от 0 до 1", en: "0 to 1" },
    title: { ru: "Случайное число от 0 до 1 — генератор дробных чисел", en: "Random Number Between 0 and 1 — decimal generator" },
    h1: { ru: "Случайное число от 0 до 1", en: "Random number between 0 and 1" },
    description: {
      ru: "Случайное дробное число от 0 до 1 с четырьмя знаками после запятой: 10 001 равновероятное значение от 0,0000 до 1,0000. Точность меняется от 1 до 6 знаков.",
      en: "Random decimal between 0 and 1 with four decimal places: 10,001 equally likely values from 0.0000 to 1.0000. Precision can be set from 1 to 6 places.",
    },
    lead: { ru: "Дробное число от 0 до 1 с точностью до 0,0001 — нажмите «Сгенерировать».", en: "A decimal from 0 to 1 to four places — press Generate." },
    note: {
      ru: "Число от 0 до 1 используют как вероятность: например, событие с шансом 30 % «случилось», если выпало меньше 0,3. Для моделирования берите 6 знаков — это миллион возможных значений.",
      en: "A number between 0 and 1 works as a probability: an event with a 30% chance “happens” if the result is below 0.3. For simulations use 6 places — a million possible values.",
    },
    faq: {
      ru: { q: "Могут ли выпасть ровно 0 или 1?", a: "Да, обе границы входят в диапазон, но шанс каждой при четырёх знаках — 1 из 10 001." },
      en: { q: "Can exactly 0 or 1 come up?", a: "Yes, both ends are included, but with four decimals each has a 1 in 10,001 chance." },
    },
  },
  {
    slug: "0-9",
    ...r(0, 9),
    name: { ru: "от 0 до 9", en: "0 to 9" },
    title: { ru: "Случайная цифра от 0 до 9 — генератор онлайн", en: "Random Digit 0–9 — single digit generator" },
    h1: { ru: "Случайная цифра от 0 до 9", en: "Random digit from 0 to 9" },
    description: {
      ru: "Случайная цифра от 0 до 9: десять равновероятных значений, шанс каждой ровно 10 %. Можно получить несколько цифр подряд или без повторов для кода или игры.",
      en: "Random digit from 0 to 9: ten equally likely values, each with exactly a 10% chance. Get several digits in a row, or without repeats for a code or a game.",
    },
    lead: { ru: "Одна из десяти цифр 0–9, у каждой шанс 10 %.", en: "One of the ten digits 0–9, each with a 10% chance." },
    note: {
      ru: "Для кода из нескольких цифр укажите количество — например, 4 — и получите цифры одну за другой. С опцией «Без повторов» каждая цифра встретится не больше раза.",
      en: "For a multi-digit code set the count — say 4 — and get the digits one after another. With “No repeats” each digit appears at most once.",
    },
  },
  {
    slug: "1-2",
    ...r(1, 2),
    name: { ru: "от 1 до 2", en: "1 to 2" },
    title: { ru: "Случайное число от 1 до 2 — как подбросить монетку", en: "Random Number 1 or 2 — a digital coin toss" },
    h1: { ru: "Случайное число от 1 до 2", en: "Random number 1 or 2" },
    description: {
      ru: "Случайное число 1 или 2: два равных исхода с шансом 50 % каждый — то же самое, что подбросить монетку. Удобно, чтобы решить спор между двумя вариантами.",
      en: "Random number 1 or 2: two equal outcomes with a 50% chance each — exactly like tossing a coin. Handy for settling a choice between two options.",
    },
    lead: { ru: "Выпадет 1 или 2 — шанс каждого ровно 50 %.", en: "You'll get 1 or 2 — each exactly 50%." },
    note: {
      ru: "Назначьте каждому варианту число — например, 1 = пицца, 2 = суши — и нажмите кнопку. Если хочется наглядности, подбросьте монетку с анимацией.",
      en: "Assign a number to each option — 1 = pizza, 2 = sushi — and press the button. For something more visual, use the animated coin flip.",
    },
  },
  {
    slug: "1-3",
    ...r(1, 3),
    name: { ru: "от 1 до 3", en: "1 to 3" },
    title: { ru: "Случайное число от 1 до 3 — генератор", en: "Random Number 1–3 — pick one of three" },
    h1: { ru: "Случайное число от 1 до 3", en: "Random number from 1 to 3" },
    description: {
      ru: "Случайное число от 1 до 3: три равновероятных исхода, шанс каждого 1/3 ≈ 33,3 %. Помогает выбрать один из трёх вариантов, когда монетки уже мало.",
      en: "Random number from 1 to 3: three equally likely outcomes, each with a 1/3 ≈ 33.3% chance. Pick one of three options when a coin flip isn't enough.",
    },
    lead: { ru: "Одно из трёх чисел — у каждого шанс 1/3.", en: "One of three numbers — each with a 1/3 chance." },
    note: {
      ru: "Честно разделить шансы на три с монеткой сложно, а здесь каждое число выпадает ровно в трети случаев.",
      en: "Splitting a choice three ways fairly is awkward with a coin; here each number comes up exactly a third of the time.",
    },
  },
  {
    slug: "1-4",
    ...r(1, 4),
    name: { ru: "от 1 до 4", en: "1 to 4" },
    title: { ru: "Случайное число от 1 до 4 — генератор онлайн", en: "Random Number 1–4 — generator" },
    h1: { ru: "Случайное число от 1 до 4", en: "Random number from 1 to 4" },
    description: {
      ru: "Случайное число от 1 до 4: четыре равновероятных значения, шанс каждого 25 %. Для выбора одного из четырёх вариантов, очерёдности игроков или ответа в тесте.",
      en: "Random number from 1 to 4: four equally likely values, each with a 25% chance. For picking one of four options, player order or a quiz answer.",
    },
    lead: { ru: "Одно из четырёх чисел — у каждого шанс 25 %.", en: "One of four numbers — each with a 25% chance." },
    note: {
      ru: "Нужна случайная очерёдность четырёх игроков? Укажите количество 4 и включите «Без повторов» — получится перестановка чисел 1–4.",
      en: "Need a random order for four players? Set the count to 4 and turn on “No repeats” to get a shuffled 1–4.",
    },
  },
  {
    slug: "1-5",
    ...r(1, 5),
    name: { ru: "от 1 до 5", en: "1 to 5" },
    title: { ru: "Случайное число от 1 до 5 — генератор онлайн", en: "Random Number 1–5 — generator" },
    h1: { ru: "Случайное число от 1 до 5", en: "Random number from 1 to 5" },
    description: {
      ru: "Случайное число от 1 до 5: пять равновероятных значений, шанс каждого ровно 20 %. Для оценок, выбора одного из пяти вариантов и игр в небольшой компании.",
      en: "Random number from 1 to 5: five equally likely values, each with exactly a 20% chance. For ratings, picking one of five options and small group games.",
    },
    lead: { ru: "Одно из пяти чисел — у каждого шанс 20 %.", en: "One of five numbers — each with a 20% chance." },
    note: {
      ru: "Пять вариантов — частый случай: дни рабочей недели, пять вопросов, пять участников. Каждому назначьте число и нажмите кнопку.",
      en: "Five options come up often: workdays, five questions, five players. Give each a number and press the button.",
    },
  },
  {
    slug: "1-6",
    ...r(1, 6),
    name: { ru: "от 1 до 6", en: "1 to 6" },
    title: { ru: "Случайное число от 1 до 6 — вместо игрального кубика", en: "Random Number 1–6 — instead of a dice" },
    h1: { ru: "Случайное число от 1 до 6", en: "Random number from 1 to 6" },
    description: {
      ru: "Случайное число от 1 до 6 — то же, что бросок игрального кубика: шесть значений с шансом 1/6 ≈ 16,7 % каждое, среднее 3,5. Можно получить сразу несколько.",
      en: "Random number from 1 to 6 — the same as rolling a die: six values with a 1/6 ≈ 16.7% chance each and an average of 3.5. Generate several at once if needed.",
    },
    lead: { ru: "Как бросок кубика: от 1 до 6, у каждого числа шанс 1/6.", en: "Like a die roll: 1 to 6, each number with a 1/6 chance." },
    note: {
      ru: "Если нужен наглядный кубик с точками, сумма нескольких костей или формулы вроде 2d6+3 — откройте онлайн-кубик.",
      en: "For a die drawn with pips, sums of several dice or formulas like 2d6+3, use the dice roller.",
    },
  },
  {
    slug: "1-10",
    ...r(1, 10),
    name: { ru: "от 1 до 10", en: "1 to 10" },
    title: { ru: "Случайное число от 1 до 10 — генератор онлайн", en: "Random Number 1–10 — generator" },
    h1: { ru: "Случайное число от 1 до 10", en: "Random number from 1 to 10" },
    description: {
      ru: "Случайное число от 1 до 10: десять равновероятных значений, шанс каждого ровно 10 %, среднее 5,5. Можно получить несколько чисел сразу, с повторами или без.",
      en: "Random number from 1 to 10: ten equally likely values, each with exactly a 10% chance, average 5.5. Generate several numbers at once, with or without repeats.",
    },
    lead: { ru: "Число от 1 до 10 — у каждого шанс ровно 10 %.", en: "A number from 1 to 10 — each with exactly a 10% chance." },
    note: {
      ru: "Классическое «загадай число от 1 до 10»: генератор делает это честно — ни одно число не выпадает чаще других, в отличие от людей, которые чаще называют 7.",
      en: "The classic “pick a number from 1 to 10”: the generator does it fairly — no number is favoured, unlike people, who pick 7 far more often than chance.",
    },
    faq: {
      ru: { q: "Как получить все числа от 1 до 10 в случайном порядке?", a: "Укажите количество 10 и включите «Без повторов» — получится случайная перестановка всех десяти чисел." },
      en: { q: "How do I get 1 to 10 in random order?", a: "Set the count to 10 and turn on “No repeats” — you'll get a random permutation of all ten numbers." },
    },
  },
  {
    slug: "1-12",
    ...r(1, 12),
    name: { ru: "от 1 до 12", en: "1 to 12" },
    title: { ru: "Случайное число от 1 до 12 — генератор", en: "Random Number 1–12 — generator" },
    h1: { ru: "Случайное число от 1 до 12", en: "Random number from 1 to 12" },
    description: {
      ru: "Случайное число от 1 до 12: двенадцать равновероятных значений, шанс каждого 1/12 ≈ 8,3 %. Для выбора месяца, часа на циферблате или одного из 12 вариантов.",
      en: "Random number from 1 to 12: twelve equally likely values, each with a 1/12 ≈ 8.3% chance. Use it to pick a month, an hour on the clock or one of twelve options.",
    },
    lead: { ru: "Одно из двенадцати чисел — у каждого шанс 1/12.", en: "One of twelve numbers — each with a 1/12 chance." },
    note: {
      ru: "Двенадцать — это месяцы, часы на циферблате и знаки зодиака. Для месяцев с названиями удобнее готовое колесо месяцев.",
      en: "Twelve means months, clock hours and star signs. For months by name, the ready-made month wheel is handier.",
    },
  },
  {
    slug: "1-20",
    ...r(1, 20),
    name: { ru: "от 1 до 20", en: "1 to 20" },
    title: { ru: "Случайное число от 1 до 20 — генератор онлайн", en: "Random Number 1–20 — generator" },
    h1: { ru: "Случайное число от 1 до 20", en: "Random number from 1 to 20" },
    description: {
      ru: "Случайное число от 1 до 20: двадцать равновероятных значений, шанс каждого 5 %, среднее 10,5. Работает как кубик d20, можно получить несколько чисел сразу.",
      en: "Random number from 1 to 20: twenty equally likely values, each with a 5% chance and an average of 10.5. Works like a d20, and you can generate several at once.",
    },
    lead: { ru: "Число от 1 до 20 — у каждого шанс 5 %, как у кубика d20.", en: "A number from 1 to 20 — 5% each, just like a d20." },
    note: {
      ru: "В классе из 20 человек можно выбрать отвечающего по номеру в журнале. Для настольных игр есть отдельная страница кубика d20 с таблицей шансов.",
      en: "In a class of 20, pick who answers by register number. For tabletop games there's a d20 page with a full odds table.",
    },
  },
  {
    slug: "1-30",
    ...r(1, 30),
    name: { ru: "от 1 до 30", en: "1 to 30" },
    title: { ru: "Случайное число от 1 до 30 — генератор", en: "Random Number 1–30 — generator" },
    h1: { ru: "Случайное число от 1 до 30", en: "Random number from 1 to 30" },
    description: {
      ru: "Случайное число от 1 до 30: тридцать равновероятных значений, шанс каждого 1/30 ≈ 3,3 %. Для выбора ученика по списку, дня месяца или номера в розыгрыше.",
      en: "Random number from 1 to 30: thirty equally likely values, 1/30 ≈ 3.3% each. Pick a student from the register, a day of the month or a raffle number.",
    },
    lead: { ru: "Число от 1 до 30 — у каждого шанс 1/30.", en: "A number from 1 to 30 — each with a 1/30 chance." },
    note: {
      ru: "Для розыгрыша между 30 участниками раздайте номера и сгенерируйте победителя. Если призов несколько, укажите количество и включите «Без повторов».",
      en: "For a raffle among 30 people, hand out numbers and generate the winner. With several prizes, set the count and turn on “No repeats”.",
    },
  },
  {
    slug: "1-50",
    ...r(1, 50),
    name: { ru: "от 1 до 50", en: "1 to 50" },
    title: { ru: "Случайное число от 1 до 50 — генератор онлайн", en: "Random Number 1–50 — generator" },
    h1: { ru: "Случайное число от 1 до 50", en: "Random number from 1 to 50" },
    description: {
      ru: "Случайное число от 1 до 50: пятьдесят равновероятных значений, шанс каждого ровно 2 %, среднее 25,5. Для розыгрышей, лото и выбора номера из списка.",
      en: "Random number from 1 to 50: fifty equally likely values, each with exactly a 2% chance, average 25.5. For giveaways, bingo-style games and picking from a list.",
    },
    lead: { ru: "Число от 1 до 50 — у каждого шанс 2 %.", en: "A number from 1 to 50 — each with a 2% chance." },
    note: {
      ru: "Для лотерейных комбинаций вроде «6 из 49» или «5 из 50» удобнее генератор лотерейных чисел: он сразу выдаёт уникальные числа по возрастанию.",
      en: "For lottery-style picks such as 5 of 50 the lottery number generator is handier: it returns unique numbers in ascending order.",
    },
  },
  {
    slug: "1-100",
    ...r(1, 100),
    name: { ru: "от 1 до 100", en: "1 to 100" },
    title: { ru: "Случайное число от 1 до 100 — генератор онлайн", en: "Random Number 1–100 — generator" },
    h1: { ru: "Случайное число от 1 до 100", en: "Random number from 1 to 100" },
    description: {
      ru: "Случайное число от 1 до 100: сто равновероятных значений, шанс каждого ровно 1 %, среднее 50,5. Несколько чисел сразу, без повторов и по возрастанию.",
      en: "Random number from 1 to 100: a hundred equally likely values, each with exactly a 1% chance and an average of 50.5. Get several at once, unique and sorted.",
    },
    lead: { ru: "Число от 1 до 100 — у каждого шанс ровно 1 %.", en: "A number from 1 to 100 — each with exactly a 1% chance." },
    note: {
      ru: "Самый популярный диапазон: розыгрыши в соцсетях, угадайки, процентные броски. Результат выбирается криптографическим генератором браузера, без смещения к «круглым» числам.",
      en: "The most popular range: social media giveaways, guessing games, percentile rolls. The browser's cryptographic generator picks the result with no bias towards “round” numbers.",
    },
    faq: {
      ru: { q: "Как выбрать нескольких победителей из 100 участников?", a: "Укажите количество победителей и включите «Без повторов» — номера не будут совпадать. «По возрастанию» упорядочит список." },
      en: { q: "How do I pick several winners out of 100?", a: "Set the number of winners and turn on “No repeats” so no number appears twice. “Sort ascending” orders the list." },
    },
  },
  {
    slug: "1-365",
    ...r(1, 365),
    name: { ru: "от 1 до 365", en: "1 to 365" },
    title: { ru: "Случайное число от 1 до 365 — случайный день года", en: "Random Number 1–365 — random day of the year" },
    h1: { ru: "Случайное число от 1 до 365", en: "Random number from 1 to 365" },
    description: {
      ru: "Случайное число от 1 до 365 — номер дня в году: шанс каждого 1/365 ≈ 0,27 %, среднее 183. Для конкретной даты удобнее генератор случайных дат.",
      en: "Random number from 1 to 365 — a day of the year: each has a 1/365 ≈ 0.27% chance, average 183. For an actual calendar date, use the random date generator.",
    },
    lead: { ru: "Номер дня в году от 1 до 365 — все равновероятны.", en: "A day-of-year number from 1 to 365 — all equally likely." },
    note: {
      ru: "Номер 1 — это 1 января, 365 — 31 декабря в невисокосном году. В високосном году дней 366, поменяйте верхнюю границу при необходимости.",
      en: "Day 1 is 1 January and day 365 is 31 December in a common year. Leap years have 366 days — change the upper limit if you need it.",
    },
  },
  {
    slug: "1-1000",
    ...r(1, 1000),
    name: { ru: "от 1 до 1000", en: "1 to 1000" },
    title: { ru: "Случайное число от 1 до 1000 — генератор онлайн", en: "Random Number 1–1000 — generator" },
    h1: { ru: "Случайное число от 1 до 1000", en: "Random number from 1 to 1000" },
    description: {
      ru: "Случайное число от 1 до 1000: тысяча равновероятных значений, шанс каждого 0,1 %, среднее 500,5. Для больших розыгрышей и выбора номера из длинного списка.",
      en: "Random number from 1 to 1000: a thousand equally likely values, each with a 0.1% chance and an average of 500.5. For big giveaways and long numbered lists.",
    },
    lead: { ru: "Число от 1 до 1000 — у каждого шанс 0,1 %.", en: "A number from 1 to 1000 — each with a 0.1% chance." },
    note: {
      ru: "Если участники пронумерованы по порядку комментариев или заказов, генератор выберет победителя за секунду. Для нескольких призов включите «Без повторов».",
      en: "If entries are numbered by comment or order, the generator picks a winner in a second. For several prizes turn on “No repeats”.",
    },
  },
  {
    slug: "1-10000",
    ...r(1, 10000),
    name: { ru: "от 1 до 10 000", en: "1 to 10,000" },
    title: { ru: "Случайное число от 1 до 10000 — генератор", en: "Random Number 1–10000 — generator" },
    h1: { ru: "Случайное число от 1 до 10 000", en: "Random number from 1 to 10,000" },
    description: {
      ru: "Случайное число от 1 до 10 000: десять тысяч равновероятных значений, шанс каждого 0,01 %. Для крупных розыгрышей, выборок и тестовых данных.",
      en: "Random number from 1 to 10,000: ten thousand equally likely values, each with a 0.01% chance. For large giveaways, random samples and test data.",
    },
    lead: { ru: "Число от 1 до 10 000 — у каждого шанс 0,01 %.", en: "A number from 1 to 10,000 — each with a 0.01% chance." },
    note: {
      ru: "Для случайной выборки из большой таблицы укажите нужный размер выборки и включите «Без повторов» — генератор выдаст до 10 000 уникальных номеров строк.",
      en: "For a random sample from a large table set the sample size and turn on “No repeats” — you'll get up to 10,000 unique row numbers.",
    },
  },
  {
    slug: "3-digit",
    ...r(100, 999),
    name: { ru: "Трёхзначное", en: "3-digit" },
    title: { ru: "Случайное трёхзначное число — от 100 до 999", en: "Random 3-Digit Number — 100 to 999" },
    h1: { ru: "Случайное трёхзначное число", en: "Random 3-digit number" },
    description: {
      ru: "Случайное трёхзначное число от 100 до 999: 900 равновероятных значений, шанс каждого 1/900 ≈ 0,11 %. Ведущего нуля не бывает — число всегда из трёх цифр.",
      en: "Random 3-digit number from 100 to 999: 900 equally likely values, each with a 1/900 ≈ 0.11% chance. No leading zero — the result always has three digits.",
    },
    lead: { ru: "Число от 100 до 999 — всегда ровно три цифры.", en: "A number from 100 to 999 — always exactly three digits." },
    note: {
      ru: "Трёхзначных чисел ровно 900. Если нужны коды с ведущим нулём (000–999), задайте диапазон от 0 до 999 и дополните число нулями слева.",
      en: "There are exactly 900 three-digit numbers. For codes with leading zeros (000–999), use 0 to 999 and pad with zeros.",
    },
  },
  {
    slug: "4-digit",
    ...r(1000, 9999),
    name: { ru: "Четырёхзначное", en: "4-digit" },
    title: { ru: "Случайное четырёхзначное число — от 1000 до 9999", en: "Random 4-Digit Number — 1000 to 9999" },
    h1: { ru: "Случайное четырёхзначное число", en: "Random 4-digit number" },
    description: {
      ru: "Случайное четырёхзначное число от 1000 до 9999: 9000 равновероятных значений, шанс каждого 1/9000 ≈ 0,011 %. Для игр вроде «Быков и коров» и тестовых кодов.",
      en: "Random 4-digit number from 1000 to 9999: 9,000 equally likely values, each with a 1/9000 ≈ 0.011% chance. For games like Bulls and Cows and test codes.",
    },
    lead: { ru: "Число от 1000 до 9999 — всегда ровно четыре цифры.", en: "A number from 1000 to 9999 — always exactly four digits." },
    note: {
      ru: "Для PIN-кода банковской карты лучше придумать код самому или взять генератор паролей: четырёхзначный номер без нулей в начале — лишь 9000 вариантов из 10 000 возможных PIN.",
      en: "For a real PIN, use a password generator instead: 4-digit numbers without a leading zero cover only 9,000 of the 10,000 possible PINs.",
    },
  },
  {
    slug: "5-digit",
    ...r(10000, 99999),
    name: { ru: "Пятизначное", en: "5-digit" },
    title: { ru: "Случайное пятизначное число — от 10000 до 99999", en: "Random 5-Digit Number — 10000 to 99999" },
    h1: { ru: "Случайное пятизначное число", en: "Random 5-digit number" },
    description: {
      ru: "Случайное пятизначное число от 10 000 до 99 999: 90 000 равновероятных значений, шанс каждого около 0,0011 %. Для тестовых номеров, индексов и розыгрышей.",
      en: "Random 5-digit number from 10,000 to 99,999: 90,000 equally likely values, each with roughly a 0.0011% chance. For test IDs, codes and large raffles.",
    },
    lead: { ru: "Число от 10 000 до 99 999 — всегда ровно пять цифр.", en: "A number from 10,000 to 99,999 — always exactly five digits." },
    note: {
      ru: "Пятизначные числа удобны как тестовые номера заказов или идентификаторы. С опцией «Без повторов» можно получить до 10 000 уникальных значений за раз.",
      en: "Five-digit numbers make handy test order numbers or IDs. With “No repeats” you can get up to 10,000 unique values at once.",
    },
  },
  {
    slug: "6-digit",
    ...r(100000, 999999),
    name: { ru: "Шестизначное", en: "6-digit" },
    title: { ru: "Случайное шестизначное число — от 100000 до 999999", en: "Random 6-Digit Number — 100000 to 999999" },
    h1: { ru: "Случайное шестизначное число", en: "Random 6-digit number" },
    description: {
      ru: "Случайное шестизначное число от 100 000 до 999 999: 900 000 равновероятных значений. Для тестовых кодов подтверждения, номеров билетов и идентификаторов.",
      en: "Random 6-digit number from 100,000 to 999,999: 900,000 equally likely values. For test verification codes, ticket numbers and identifiers.",
    },
    lead: { ru: "Число от 100 000 до 999 999 — всегда ровно шесть цифр.", en: "A number from 100,000 to 999,999 — always exactly six digits." },
    note: {
      ru: "Шесть цифр — формат одноразовых кодов из SMS. Генератор подходит для тестов и макетов; настоящие коды должен выдавать сервер, а не страница в браузере.",
      en: "Six digits is the format of one-time SMS codes. The generator is fine for tests and mock-ups; real codes must be issued by a server, not a web page.",
    },
  },
];

function numberBlocks(p: NumberPreset, locale: Locale): Block[] {
  const g = numberGrid({ min: p.min, max: p.max, decimals: p.decimals ?? 0 })!;
  const step = 1 / g.scale;
  const fmt = (v: number) => num(locale, v);
  const rows: [string, string][] = [
    [L(locale, "Диапазон", "Range"), `${fmt(p.min)} … ${fmt(p.max)}${p.decimals ? L(locale, `, шаг ${num(locale, step)}`, `, step ${num(locale, step)}`) : ""}`],
    [L(locale, "Возможных значений", "Possible values"), num(locale, g.size)],
    [L(locale, "Шанс каждого значения", "Chance of each value"), `1/${num(locale, g.size)} ≈ ${pct(locale, 1 / g.size)}`],
    [L(locale, "Среднее (матожидание)", "Average (expected value)"), num(locale, (p.min + p.max) / 2)],
  ];
  if (g.size >= 2 && g.size <= 1000) {
    rows.push([L(locale, "Шанс, что два числа совпадут", "Chance two draws match"), pct(locale, 1 / g.size)]);
  }
  return [
    { type: "facts", title: L(locale, "Коротко", "Quick facts"), rows },
    { type: "text", paragraphs: [p.note[locale]] },
  ];
}

function numberFaq(p: NumberPreset, locale: Locale): QA[] {
  const g = numberGrid({ min: p.min, max: p.max, decimals: p.decimals ?? 0 })!;
  const range = `${num(locale, p.min)}–${num(locale, p.max)}`;
  const base: QA =
    locale === "ru"
      ? { q: `Все ли числа ${range} выпадают одинаково часто?`, a: `Да. Возможных значений ${num(locale, g.size)}, и у каждого шанс ${pct(locale, 1 / g.size)}. Генератор использует crypto.getRandomValues с отбором без смещения, поэтому ни одно значение не выпадает чаще.` }
      : { q: `Is every number in ${range} equally likely?`, a: `Yes. There are ${num(locale, g.size)} possible values and each has a ${pct(locale, 1 / g.size)} chance. The generator uses crypto.getRandomValues with unbiased rejection sampling, so no value is favoured.` };
  const multi: QA =
    locale === "ru"
      ? { q: "Можно получить несколько чисел сразу?", a: `Да, укажите количество (до ${num(locale, Math.min(10000, g.size))} без повторов). Включите «По возрастанию», чтобы отсортировать результат.` }
      : { q: "Can I get several numbers at once?", a: `Yes, set the count (up to ${num(locale, Math.min(10000, g.size))} without repeats). Turn on “Sort ascending” to order the result.` };
  return [...(p.faq ? [p.faq[locale]] : []), base, multi];
}

function numberVariant(p: NumberPreset): VariantDef {
  return {
    slug: p.slug,
    name: p.name,
    title: p.title,
    h1: p.h1,
    description: p.description,
    lead: p.lead,
    props: { min: p.min, max: p.max, decimals: p.decimals ?? 0 },
    keywords: {
      ru: [`случайное число от ${p.min} до ${p.max}`, "рандом", "генератор чисел"],
      en: [`random number ${p.min} ${p.max}`, "rng", "number generator"],
    },
    blocks: (locale) => numberBlocks(p, locale),
    faq: { ru: numberFaq(p, "ru"), en: numberFaq(p, "en") },
  };
}

export const numberTool: ToolDef = {
  slug: "random-number-generator",
  component: "random/number",
  icon: "Hash",
  popular: true,
  name: { ru: "Генератор случайных чисел", en: "Random number generator" },
  title: { ru: "Генератор случайных чисел онлайн — от и до, без повторов", en: "Random Number Generator — any range, no repeats" },
  h1: { ru: "Генератор случайных чисел", en: "Random number generator" },
  description: {
    ru: "Генератор случайных чисел в любом диапазоне: целые или дробные, до 10 000 чисел за раз, без повторов и по возрастанию. Отрицательные числа тоже работают.",
    en: "Random number generator for any range: whole or decimal numbers, up to 10,000 at once, unique and sorted if you like. Negative numbers work too.",
  },
  lead: {
    ru: "Задайте диапазон «от» и «до» и нажмите «Сгенерировать» — все числа равновероятны.",
    en: "Set the min and max and press Generate — every number is equally likely.",
  },
  keywords: {
    ru: ["рандом", "случайное число", "генератор чисел", "рандомайзер чисел", "выбрать число"],
    en: ["rng", "random number", "number picker", "random integer", "number generator"],
  },
  props: { min: 1, max: 100 },
  howTo: {
    ru: [
      "Введите нижнюю и верхнюю границы — обе входят в диапазон, можно отрицательные.",
      "Укажите, сколько чисел нужно, и при необходимости число знаков после запятой.",
      "Включите «Без повторов» для уникальных чисел и «По возрастанию» для сортировки.",
      "Нажмите «Сгенерировать» или Enter; результат можно скопировать одной кнопкой.",
    ],
    en: [
      "Enter the lower and upper limits — both are included, negatives are fine.",
      "Set how many numbers you need and, optionally, the number of decimal places.",
      "Turn on “No repeats” for unique numbers and “Sort ascending” to order them.",
      "Press Generate or Enter; copy the result with one click.",
    ],
  },
  faq: {
    ru: [
      { q: "Входят ли границы в диапазон?", a: "Да, обе. Для диапазона от 1 до 10 могут выпасть и 1, и 10 — каждое с шансом 10 %." },
      { q: "Насколько случайны числа?", a: "Числа выдаёт криптографический генератор браузера (crypto.getRandomValues). Для перевода в диапазон используется отбор без смещения, поэтому все значения равновероятны — нет перекоса к меньшим числам, как у наивного деления с остатком." },
      { q: "Как получить числа без повторов?", a: "Включите «Без повторов». Тогда чисел не может быть больше, чем значений в диапазоне: от 1 до 10 — не больше 10." },
      { q: "Можно генерировать дробные числа?", a: "Да, выберите от 1 до 6 знаков после запятой. Значения выбираются равномерно на сетке с этим шагом, например 0,01." },
      { q: "Числа куда-нибудь отправляются?", a: "Нет. Всё считается в вашем браузере, ничего не передаётся на сервер и не сохраняется после закрытия страницы." },
    ],
    en: [
      { q: "Are the limits included?", a: "Yes, both. For 1 to 10 you can get 1 and 10, each with a 10% chance." },
      { q: "How random are the numbers?", a: "They come from the browser's cryptographic generator (crypto.getRandomValues). Mapping to your range uses unbiased rejection sampling, so every value is equally likely — no skew towards small numbers as with naive modulo." },
      { q: "How do I get numbers without repeats?", a: "Turn on “No repeats”. You then can't ask for more numbers than the range holds: at most 10 for 1 to 10." },
      { q: "Can it generate decimals?", a: "Yes, choose 1 to 6 decimal places. Values are picked uniformly on a grid with that step, e.g. 0.01." },
      { q: "Are my numbers sent anywhere?", a: "No. Everything runs in your browser; nothing is sent to a server or kept after you close the page." },
    ],
  },
  about: {
    ru: [
      "Генератор выдаёт случайные целые или дробные числа в любом диапазоне — для розыгрышей, игр, выборок и тестовых данных. Можно получить одно число крупно или список до 10 000 чисел и скопировать его.",
      "В основе — криптографический генератор браузера и отбор без смещения: каждое значение диапазона выпадает с одинаковой вероятностью. Режим «Без повторов» выбирает числа без возвращения, как шары из барабана.",
    ],
    en: [
      "The generator gives random whole or decimal numbers in any range — for giveaways, games, samples and test data. Get one big number or a list of up to 10,000 and copy it.",
      "It is built on the browser's cryptographic generator with unbiased rejection sampling: every value in the range is equally likely. “No repeats” draws without replacement, like balls from a drum.",
    ],
  },
  variants: {
    title: { ru: "Популярные диапазоны", en: "Popular ranges" },
    list: () => PRESETS.map(numberVariant),
  },
};
