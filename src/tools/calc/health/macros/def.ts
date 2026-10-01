import type { ToolDef } from "@/registry/types";

export const macrosTool: ToolDef = {
  slug: "macro-calculator",
  component: "health/macros",
  icon: "Salad",
  name: { ru: "Калькулятор БЖУ", en: "Macro calculator" },
  title: { ru: "Калькулятор БЖУ — белки, жиры и углеводы в граммах", en: "Macro calculator — protein, fat and carbs in grams" },
  h1: { ru: "Калькулятор БЖУ", en: "Macro calculator" },
  description: {
    ru: "Переведите суточную норму калорий в граммы белков, жиров и углеводов: готовые распределения 25/30/45, 30/45/25, 35/30/35 или своё. Белок на кг веса.",
    en: "Turn your daily calories into grams of protein, fat and carbs: ready splits 25/30/45, 30/45/25, 35/30/35 or your own, plus protein per kilogram of body weight.",
  },
  lead: {
    ru: "При 2 000 ккал и распределении 25/30/45 — 125 г белка, 67 г жиров и 225 г углеводов в день.",
    en: "At 2,000 kcal with a 25/30/45 split you need 125 g of protein, 67 g of fat and 225 g of carbs a day.",
  },
  keywords: {
    ru: ["БЖУ", "калькулятор БЖУ", "белки жиры углеводы", "норма белка", "макронутриенты"],
    en: ["macro calculator", "macros", "protein fat carbs", "iifym", "protein per kg"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите суточную норму калорий — её можно рассчитать в калькуляторе калорий.",
      "Выберите распределение или задайте своё в процентах от калорий.",
      "При желании укажите вес — калькулятор покажет белок в граммах на килограмм.",
      "Граммы белков, жиров и углеводов появятся сразу.",
    ],
    en: [
      "Enter your daily calories — you can work them out in the calorie calculator.",
      "Pick a split or set your own as a percentage of calories.",
      "Optionally enter your weight to see protein in grams per kilogram.",
      "Grams of protein, fat and carbs appear instantly.",
    ],
  },
  about: {
    ru: [
      "БЖУ — это белки, жиры и углеводы. Калорийность пересчитывается в граммы по коэффициентам Этуотера: 4 ккал в грамме белка и углеводов и 9 ккал в грамме жира. Поэтому 30 % калорий из жиров — это меньше граммов, чем 30 % из углеводов.",
      "Нет единственно правильного соотношения: главное — общая калорийность и достаточное количество белка. Сбалансированное распределение подходит большинству, варианты с меньшим количеством углеводов или большим количеством белка выбирают под свои цели и самочувствие.",
    ],
    en: [
      "Macros are protein, fat and carbohydrates. Calories convert to grams using the Atwater factors: 4 kcal per gram of protein and carbs, 9 kcal per gram of fat, so 30% of calories from fat is fewer grams than 30% from carbs.",
      "There is no single correct ratio: total calories and enough protein matter most. A balanced split suits most people; lower-carb or higher-protein splits are chosen for personal goals and how you feel.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать БЖУ?", a: "Умножьте калорийность на долю каждого макронутриента и разделите на калорийность грамма: белки и углеводы — на 4, жиры — на 9. 2 000 ккал × 25 % / 4 = 125 г белка." },
      { q: "Сколько белка нужно в день?", a: "Обычно 0,8–1,2 г на кг веса; при силовых тренировках — до 1,4–2 г/кг. Человеку весом 70 кг — примерно 56–84 г, при тренировках — до 100–140 г." },
      { q: "Какое соотношение БЖУ выбрать для похудения?", a: "Важнее всего дефицит калорий. Чуть больше белка (30–35 %) помогает сохранять мышцы и дольше не чувствовать голод." },
    ],
    en: [
      { q: "How do I calculate macros?", a: "Multiply calories by each macro's share and divide by calories per gram: 4 for protein and carbs, 9 for fat. 2,000 kcal × 25% / 4 = 125 g of protein." },
      { q: "How much protein do I need a day?", a: "Usually 0.8–1.2 g per kg of body weight; with strength training up to 1.4–2 g/kg. A 70 kg person needs about 56–84 g, or 100–140 g when training." },
      { q: "What split is best for weight loss?", a: "The calorie deficit matters most. Slightly more protein (30–35%) helps keep muscle and stay full longer." },
    ],
  },
  related: ["calorie-calculator", "bmi-calculator", "body-fat-calculator", "water-intake-calculator"],
};
