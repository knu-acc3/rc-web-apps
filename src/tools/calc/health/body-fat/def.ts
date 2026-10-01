import type { ToolDef } from "@/registry/types";

export const bodyFatTool: ToolDef = {
  slug: "body-fat-calculator",
  component: "health/body-fat",
  icon: "Ruler",
  name: { ru: "Калькулятор процента жира", en: "Body fat calculator" },
  title: { ru: "Калькулятор процента жира в организме — метод ВМС США", en: "Body fat calculator — US Navy method" },
  h1: { ru: "Калькулятор процента жира в организме", en: "Body fat percentage calculator" },
  description: {
    ru: "Процент жира по обхватам талии, шеи и бёдер (метод ВМС США) и по ИМТ, жировая и безжировая масса, категории от спортивной формы до ожирения для мужчин и женщин.",
    en: "Body fat percentage from waist, neck and hip measurements (US Navy method) and from BMI, with fat and lean mass and categories from athletic to obese.",
  },
  lead: {
    ru: "Мужчина 180 см с талией 85 см и шеей 38 см — около 16 % жира, это хорошая физическая форма.",
    en: "A 180 cm man with an 85 cm waist and 38 cm neck has about 16% body fat — the fitness range.",
  },
  keywords: {
    ru: ["процент жира", "калькулятор жира", "метод ВМС США", "состав тела", "жировая масса"],
    en: ["body fat calculator", "body fat percentage", "navy method", "lean body mass", "fat mass"],
  },
  props: {},
  howTo: {
    ru: [
      "Выберите пол и введите рост и вес.",
      "Измерьте сантиметровой лентой талию и шею (женщинам — ещё и бёдра) и введите значения.",
      "Укажите возраст — для дополнительной оценки по ИМТ.",
      "Смотрите процент жира, категорию, жировую и безжировую массу.",
    ],
    en: [
      "Choose your sex and enter your height and weight.",
      "Measure your waist and neck (women also the hips) with a tape and enter them.",
      "Enter your age for the additional BMI-based estimate.",
      "See your body fat percentage, its category and your fat and lean mass.",
    ],
  },
  about: {
    ru: [
      "Метод ВМС США оценивает долю жира по обхватам тела и росту — его разработали для быстрой проверки военнослужащих без специального оборудования. Он точнее, чем оценка только по ИМТ, потому что учитывает распределение жира на животе.",
      "Категории Американского совета по физическим упражнениям (ACE): у мужчин 6–13 % — спортсмены, 14–17 % — хорошая форма, 18–24 % — средний уровень, от 25 % — ожирение; у женщин те же уровни сдвинуты примерно на 8 пунктов вверх, потому что женскому организму нужно больше необходимого жира.",
    ],
    en: [
      "The US Navy method estimates body fat from circumferences and height — it was developed to check service members quickly without special equipment. It is more informative than BMI alone because it reflects fat around the waist.",
      "American Council on Exercise (ACE) categories: for men 6–13% athletes, 14–17% fitness, 18–24% average, 25% and above obese; for women the same levels are about 8 points higher because women need more essential fat.",
    ],
  },
  faq: {
    ru: [
      { q: "Какой процент жира считается нормальным?", a: "По шкале ACE для мужчин 14–24 % — от хорошей формы до среднего уровня, для женщин — 21–31 %. Ожирение начинается с 25 % у мужчин и 32 % у женщин." },
      { q: "Насколько точен метод ВМС США?", a: "Обычно в пределах 3–4 процентных пунктов от лабораторных методов, если обхваты измерены правильно. Точнее всего состав тела показывает DEXA-сканирование." },
      { q: "Как правильно измерить талию и шею?", a: "Мягкой лентой, горизонтально, на выдохе, не втягивая живот. Мужчины измеряют талию на уровне пупка, женщины — в самом узком месте; шею — прямо под кадыком." },
    ],
    en: [
      { q: "What is a healthy body fat percentage?", a: "On the ACE scale 14–24% for men (fitness to average) and 21–31% for women. Obesity starts at 25% for men and 32% for women." },
      { q: "How accurate is the Navy method?", a: "Usually within 3–4 percentage points of lab methods if measured correctly. DEXA scans are the most accurate." },
      { q: "How do I measure my waist and neck?", a: "With a soft tape, level, after breathing out and without pulling in. Men measure the waist at the navel, women at the narrowest point; the neck just below the larynx." },
    ],
  },
  related: ["bmi-calculator", "waist-to-height-ratio-calculator", "calorie-calculator", "ideal-weight-calculator"],
};
