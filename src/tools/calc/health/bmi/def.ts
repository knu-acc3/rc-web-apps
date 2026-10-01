import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { Block, ToolDef } from "@/registry/types";
import { healthyRange } from "../lib/body";

const n1 = (locale: Locale, v: number) => formatNumber(locale, v, { maximumFractionDigits: 1 });

function heightTable(locale: Locale): Block {
  const ru = locale === "ru";
  const heights = [150, 155, 160, 165, 170, 175, 180, 185, 190, 195];
  return {
    type: "table",
    title: ru ? "Нормальный вес по росту (ИМТ 18,5–24,9)" : "Healthy weight by height (BMI 18.5–24.9)",
    head: ru ? ["Рост", "Нормальный вес", "Избыточный вес от", "Ожирение от"] : ["Height", "Healthy weight", "Overweight from", "Obesity from"],
    rows: heights.map((h) => {
      const [lo, hi] = healthyRange(h);
      const m2 = (h / 100) ** 2;
      return [`${h} ${ru ? "см" : "cm"}`, `${n1(locale, lo)}–${n1(locale, hi)} ${ru ? "кг" : "kg"}`, `${n1(locale, 25 * m2)} ${ru ? "кг" : "kg"}`, `${n1(locale, 30 * m2)} ${ru ? "кг" : "kg"}`];
    }),
  };
}

export const bmiTool: ToolDef = {
  slug: "bmi-calculator",
  component: "health/bmi",
  icon: "Scale",
  popular: true,
  name: { ru: "Калькулятор ИМТ", en: "BMI calculator" },
  title: { ru: "Калькулятор ИМТ — индекс массы тела онлайн", en: "BMI calculator — body mass index for adults" },
  h1: { ru: "Калькулятор индекса массы тела (ИМТ)", en: "BMI calculator (body mass index)" },
  description: {
    ru: "Рассчитайте индекс массы тела по росту и весу: классы ВОЗ от дефицита до ожирения III степени, нормальный вес для вашего роста, азиатские пороги 23 и 27,5.",
    en: "Calculate your body mass index from height and weight: WHO classes from underweight to obesity class III, healthy weight for your height and Asian cut-offs.",
  },
  lead: {
    ru: "При росте 170 см и весе 70 кг ИМТ = 24,2 — нормальный вес; норма для этого роста — 53,5–72 кг.",
    en: "At 170 cm and 70 kg your BMI is 24.2 — a healthy weight; the healthy range for that height is 53.5–72 kg.",
  },
  keywords: {
    ru: ["ИМТ", "индекс массы тела", "калькулятор ИМТ", "норма веса", "ожирение", "BMI"],
    en: ["bmi calculator", "body mass index", "healthy weight", "bmi chart", "obesity class"],
  },
  props: { height: 170, weight: 70 },
  howTo: {
    ru: [
      "Введите рост в сантиметрах и вес в килограммах — или переключитесь на футы, дюймы и фунты.",
      "ИМТ и категория по классификации ВОЗ появятся сразу.",
      "Посмотрите нормальный вес для вашего роста и сколько до него осталось.",
      "Если вы из Азии, отметьте азиатские пороги 23 и 27,5.",
    ],
    en: [
      "Enter your height and weight in cm and kg, or switch to feet, inches and pounds.",
      "Your BMI and WHO category appear instantly.",
      "See the healthy weight range for your height and how far you are from it.",
      "If you are of Asian descent, tick the Asian cut-offs of 23 and 27.5.",
    ],
  },
  about: {
    ru: [
      "Индекс массы тела — отношение веса к квадрату роста в метрах. ВОЗ использует его как быстрый скрининг для взрослых: норма — от 18,5 до 24,9, от 25 — избыточный вес, от 30 — ожирение (I, II и III степени с шагом 5).",
      "ИМТ не показывает, из чего состоит вес: у спортсменов с большой мышечной массой он может быть высоким при нормальном количестве жира. Поэтому для оценки риска его дополняют окружностью талии и отношением талии к росту.",
      "Для детей и подростков взрослые пороги не подходят — используются возрастные процентили ВОЗ, и оценку лучше доверить педиатру.",
    ],
    en: [
      "Body mass index is weight divided by height in metres squared. The WHO uses it as a quick adult screening tool: 18.5–24.9 is normal, 25 and above overweight, 30 and above obesity (classes I, II and III in steps of 5).",
      "BMI does not show what the weight is made of: muscular athletes can have a high BMI with normal body fat. Waist size and waist-to-height ratio help assess the risk more accurately.",
      "Adult cut-offs do not apply to children and teens — they are assessed with WHO age-specific percentiles, best done by a paediatrician.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать ИМТ?", a: "Разделите вес в килограммах на квадрат роста в метрах. При росте 175 см и весе 80 кг: 80 / 1,75² = 26,1 — избыточный вес." },
      { q: "Какой ИМТ считается нормальным?", a: "По классификации ВОЗ для взрослых — от 18,5 до 24,9. Для азиатского населения ВОЗ рекомендует считать повышенный риск уже с 23." },
      { q: "Почему у спортсменов ИМТ бывает высоким?", a: "Мышцы тяжелее жира, а ИМТ учитывает только общий вес. Для оценки состава тела используйте калькулятор процента жира." },
      { q: "Подходит ли калькулятор для детей?", a: "Нет. У детей и подростков ИМТ оценивают по процентильным таблицам ВОЗ с учётом возраста и пола — обратитесь к педиатру." },
    ],
    en: [
      { q: "How is BMI calculated?", a: "Divide your weight in kilograms by your height in metres squared. At 175 cm and 80 kg: 80 / 1.75² = 26.1 — overweight." },
      { q: "What is a healthy BMI?", a: "18.5 to 24.9 for adults, according to the WHO. For Asian populations the WHO suggests increased risk from 23." },
      { q: "Why can athletes have a high BMI?", a: "Muscle is denser than fat and BMI only uses total weight. Use the body-fat calculator to assess body composition." },
      { q: "Can I use it for children?", a: "No. Children and teens are assessed with WHO percentile charts for age and sex — ask a paediatrician." },
    ],
  },
  related: ["ideal-weight-calculator", "body-fat-calculator", "waist-to-height-ratio-calculator", "calorie-calculator", "water-intake-calculator"],
  blocks: (locale) => [heightTable(locale)],
};
