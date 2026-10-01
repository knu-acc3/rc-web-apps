import type { ToolDef } from "@/registry/types";
import { ACTIVITY_FACTOR, mifflin } from "../lib/body";

const M = mifflin("male", 75, 175, 30);
const TDEE = Math.round(M * ACTIVITY_FACTOR.light);

export const caloriesTool: ToolDef = {
  slug: "calorie-calculator",
  component: "health/calories",
  icon: "Flame",
  popular: true,
  name: { ru: "Калькулятор калорий", en: "Calorie calculator" },
  title: { ru: "Калькулятор калорий — норма в день для похудения", en: "Calorie calculator — daily calories to lose or gain weight" },
  h1: { ru: "Калькулятор калорий в день", en: "Daily calorie calculator" },
  description: {
    ru: "Суточная норма калорий по формуле Миффлина — Сан Жеора и Харриса — Бенедикта с учётом активности и цели: похудеть, поддерживать вес или набрать массу.",
    en: "Daily calorie needs by the Mifflin–St Jeor and Harris–Benedict equations, adjusted for activity and your goal: lose weight, maintain it or gain muscle.",
  },
  lead: {
    ru: `Мужчине 30 лет, 175 см, 75 кг при лёгкой активности нужно около ${TDEE.toLocaleString("ru-RU")} ккал в день, чтобы держать вес.`,
    en: `A 30-year-old man, 175 cm and 75 kg, with light activity needs about ${TDEE.toLocaleString("en-US")} kcal a day to maintain weight.`,
  },
  keywords: {
    ru: ["калькулятор калорий", "норма калорий", "калории для похудения", "базовый обмен", "Миффлин Сан Жеор", "суточная норма"],
    en: ["calorie calculator", "tdee calculator", "bmr calculator", "calories to lose weight", "mifflin st jeor"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите рост, вес и возраст, выберите пол.",
      "Укажите уровень активности — от сидячей работы до тяжёлого труда.",
      "Выберите цель: похудеть, поддерживать вес или набрать массу.",
      "Получите суточную норму калорий, базовый обмен по двум формулам и таблицу для всех уровней активности.",
    ],
    en: [
      "Enter your height, weight and age and choose your sex.",
      "Choose your activity level, from desk job to heavy physical work.",
      "Pick a goal: lose weight, maintain or gain.",
      "Get your daily calorie target, BMR by two formulas and a table for every activity level.",
    ],
  },
  about: {
    ru: [
      "Базовый обмен (BMR) — энергия, которую тело тратит в покое на дыхание, кровообращение и работу органов. Умножив его на коэффициент активности, получаем суточный расход (TDEE) — столько калорий нужно, чтобы вес не менялся.",
      `Для снижения веса обычно вычитают 250–500 ккал в день: при расходе около ${TDEE.toLocaleString("ru-RU")} ккал это ${(TDEE - 500).toLocaleString("ru-RU")}–${(TDEE - 250).toLocaleString("ru-RU")} ккал. Дефицит 500 ккал даёт в среднем около 0,45 кг в неделю. Более жёсткие ограничения сложно выдерживать, и их стоит обсуждать с врачом.`,
    ],
    en: [
      "Basal metabolic rate (BMR) is the energy your body uses at rest for breathing, circulation and organ function. Multiplied by an activity factor it gives your total daily energy expenditure (TDEE) — the calories that keep your weight stable.",
      "To lose weight, a deficit of 250–500 kcal a day is typical; 500 kcal a day averages about 0.45 kg (1 lb) a week. Stricter limits are hard to sustain and are best discussed with a doctor.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько калорий нужно в день?", a: `Зависит от пола, возраста, роста, веса и активности. Например, мужчине 30 лет, 175 см и 75 кг при лёгкой активности — около ${TDEE.toLocaleString("ru-RU")} ккал для поддержания веса.` },
      { q: "Какая формула точнее — Миффлина или Харриса — Бенедикта?", a: "Формула Миффлина — Сан Жеора (1990) в исследованиях точнее для современных взрослых, поэтому она основная. Разница между формулами обычно 50–150 ккал." },
      { q: "Сколько калорий нужно, чтобы похудеть?", a: "Обычно норма для поддержания минус 250–500 ккал. Не опускайтесь ниже базового обмена без наблюдения врача." },
      { q: "Насколько точен расчёт?", a: "Погрешность формул — около ±10 %. Считайте результат стартовой точкой и корректируйте его по изменению веса за 2–3 недели." },
    ],
    en: [
      { q: "How many calories do I need a day?", a: `It depends on sex, age, height, weight and activity. A 30-year-old man, 175 cm and 75 kg, with light activity needs about ${TDEE.toLocaleString("en-US")} kcal to maintain weight.` },
      { q: "Which is more accurate — Mifflin–St Jeor or Harris–Benedict?", a: "Studies found Mifflin–St Jeor (1990) more accurate for today's adults, so it is the main result. The two usually differ by 50–150 kcal." },
      { q: "How many calories should I eat to lose weight?", a: "Usually your maintenance calories minus 250–500 kcal. Do not go below your BMR without medical supervision." },
      { q: "How accurate is it?", a: "The equations are accurate to about ±10%. Treat the result as a starting point and adjust it by your weight trend over 2–3 weeks." },
    ],
  },
  related: ["macro-calculator", "bmi-calculator", "body-fat-calculator", "ideal-weight-calculator", "water-intake-calculator"],
};
