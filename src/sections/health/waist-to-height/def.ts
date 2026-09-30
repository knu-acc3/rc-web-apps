import type { ToolDef } from "@/registry/types";

export const waistToHeightTool: ToolDef = {
  slug: "waist-to-height-ratio-calculator",
  component: "health/waist-to-height",
  icon: "Ruler",
  name: { ru: "Отношение талии к росту", en: "Waist-to-height ratio" },
  title: { ru: "Отношение талии к росту — калькулятор риска онлайн", en: "Waist-to-height ratio calculator — health risk" },
  h1: { ru: "Калькулятор отношения талии к росту", en: "Waist-to-height ratio calculator" },
  description: {
    ru: "Разделите обхват талии на рост: до 0,5 — норма, 0,5–0,59 — повышенный риск, от 0,6 — высокий риск (NICE, 2022). Правило: талия меньше половины роста.",
    en: "Divide your waist by your height: below 0.5 is healthy, 0.5–0.59 increased risk, 0.6 or more high risk (NICE, 2022). Rule: waist under half your height.",
  },
  lead: {
    ru: "Талия 80 см при росте 170 см — отношение 0,47, это норма: талия меньше половины роста.",
    en: "An 80 cm waist at 170 cm height is a ratio of 0.47 — healthy, the waist is under half the height.",
  },
  keywords: {
    ru: ["отношение талии к росту", "обхват талии норма", "абдоминальное ожирение", "индекс талия рост"],
    en: ["waist to height ratio", "WHtR", "waist size", "abdominal fat"],
  },
  props: {},
  howTo: {
    ru: [
      "Измерьте талию посередине между нижним ребром и тазовой костью на спокойном выдохе.",
      "Введите обхват талии и рост в одних единицах — сантиметрах или дюймах.",
      "Сравните отношение с порогами 0,5 и 0,6.",
    ],
    en: [
      "Measure your waist midway between the lowest rib and the top of the hip bone after breathing out.",
      "Enter your waist and height in the same units — centimetres or inches.",
      "Compare the ratio with the 0.5 and 0.6 thresholds.",
    ],
  },
  about: {
    ru: [
      "Отношение талии к росту показывает, сколько жира накоплено в области живота. Такой жир сильнее связан с риском диабета 2 типа и болезней сердца, чем вес в целом, поэтому показатель хорошо дополняет ИМТ.",
      "В 2022 году британский NICE рекомендовал всем взрослым держать обхват талии меньше половины роста: 0,4–0,49 — норма, 0,5–0,59 — повышенный риск, от 0,6 — высокий риск.",
    ],
    en: [
      "The waist-to-height ratio shows how much fat is stored around the abdomen. That fat is more closely linked to type 2 diabetes and heart disease than overall weight, so the ratio is a useful addition to BMI.",
      "In 2022 the UK's NICE advised all adults to keep their waist to less than half their height: 0.4–0.49 healthy, 0.5–0.59 increased risk, 0.6 or more high risk.",
    ],
  },
  faq: {
    ru: [
      { q: "Какое отношение талии к росту нормальное?", a: "От 0,4 до 0,49. При росте 170 см это обхват талии меньше 85 см." },
      { q: "Чем этот показатель лучше ИМТ?", a: "ИМТ учитывает только общий вес, а отношение талии к росту — распределение жира. Оно точнее отражает риск, связанный с жиром на животе." },
      { q: "Подходит ли показатель всем?", a: "Пороги рассчитаны на взрослых с ИМТ до 35; при беременности и для детей их не применяют." },
    ],
    en: [
      { q: "What is a healthy waist-to-height ratio?", a: "0.4 to 0.49. At 170 cm that means a waist under 85 cm." },
      { q: "Why is it better than BMI?", a: "BMI only uses total weight, while waist-to-height reflects where fat is stored — a better signal of abdominal-fat risk." },
      { q: "Does it apply to everyone?", a: "The thresholds are for adults with a BMI under 35; they are not used in pregnancy or for children." },
    ],
  },
  related: ["bmi-calculator", "body-fat-calculator", "ideal-weight-calculator", "calorie-calculator"],
};
