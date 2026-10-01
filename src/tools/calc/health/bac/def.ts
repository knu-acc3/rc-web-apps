import type { ToolDef } from "@/registry/types";

export const bacTool: ToolDef = {
  slug: "blood-alcohol-calculator",
  component: "health/bac",
  icon: "Wine",
  name: { ru: "Калькулятор промилле", en: "Blood alcohol calculator" },
  title: { ru: "Калькулятор промилле — алкоголь в крови по Видмарку", en: "Blood alcohol calculator — Widmark estimate" },
  h1: { ru: "Калькулятор алкоголя в крови (промилле)", en: "Blood alcohol content (BAC) calculator" },
  description: {
    ru: "Грубая оценка алкоголя в крови по формуле Видмарка: промилле с учётом веса, пола, напитков и прошедшего времени. Только для справки — за руль после алкоголя нельзя.",
    en: "A rough Widmark estimate of blood alcohol in per mille from your weight, sex, drinks and time elapsed. For information only — never drive after drinking.",
  },
  lead: {
    ru: "Мужчина 80 кг после двух бутылок пива 0,5 л (5 %) — около 0,73 ‰ на пике; выведение занимает порядка 5 часов.",
    en: "An 80 kg man after two 500 ml beers (5%) peaks at about 0.73 ‰; elimination takes roughly 5 hours.",
  },
  keywords: {
    ru: ["калькулятор промилле", "алкоголь в крови", "формула Видмарка", "сколько выветривается алкоголь"],
    en: ["blood alcohol calculator", "bac calculator", "widmark formula", "alcohol elimination"],
  },
  props: {},
  howTo: {
    ru: [
      "Укажите пол и вес.",
      "Добавьте выпитые напитки: объём, крепость и количество — или выберите типовой напиток из списка.",
      "Введите, сколько часов прошло с начала употребления.",
      "Посмотрите приблизительную концентрацию и время выведения. Помните, что это грубая оценка.",
    ],
    en: [
      "Choose your sex and enter your weight.",
      "Add your drinks: volume, strength and number — or pick a typical drink from the list.",
      "Enter the hours since you started drinking.",
      "See the approximate concentration and elimination time. Remember it is only a rough estimate.",
    ],
  },
  about: {
    ru: [
      "Формула Видмарка оценивает концентрацию алкоголя в крови: граммы чистого спирта делятся на массу тела, умноженную на коэффициент распределения (около 0,68 у мужчин и 0,55 у женщин), а затем вычитается выведение — в среднем 0,15 ‰ в час.",
      "Реальные значения могут сильно отличаться: влияют еда, скорость употребления, состояние печени, лекарства и индивидуальные особенности. Калькулятор не определяет, можно ли садиться за руль, — после употребления алкоголя водить нельзя.",
    ],
    en: [
      "The Widmark formula estimates blood alcohol: grams of pure alcohol divided by body weight times a distribution factor (about 0.68 for men and 0.55 for women), minus elimination of about 0.15 ‰ per hour.",
      "Real values can differ a lot depending on food, drinking speed, liver health, medication and individual factors. The calculator cannot tell whether you may drive — do not drive after drinking.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько выветривается бутылка пива?", a: "0,5 л пива 5 % — около 20 г спирта. Для мужчины 80 кг это ≈ 0,36 ‰ на пике и примерно 2,5 часа до нуля при средней скорости выведения. У многих людей выведение медленнее." },
      { q: "Как рассчитать промилле?", a: "Граммы алкоголя (объём × крепость × 0,789) разделите на вес × коэффициент (0,68 для мужчин, 0,55 для женщин) и вычтите 0,15 ‰ за каждый прошедший час." },
      { q: "Можно ли по калькулятору понять, когда садиться за руль?", a: "Нет. Оценка слишком грубая, а остаточное опьянение ухудшает реакцию. Если вы пили — не садитесь за руль." },
    ],
    en: [
      { q: "How long does a beer take to wear off?", a: "A 500 ml beer at 5% has about 20 g of alcohol. For an 80 kg man that is about 0.36 ‰ at peak and roughly 2.5 hours to zero at an average elimination rate. Many people are slower." },
      { q: "How is BAC calculated?", a: "Divide grams of alcohol (volume × ABV × 0.789) by weight × distribution factor (0.68 men, 0.55 women) and subtract 0.15 ‰ for each hour." },
      { q: "Can the calculator tell me when I can drive?", a: "No. The estimate is too rough and residual alcohol impairs reactions. If you have been drinking, do not drive." },
    ],
  },
  related: ["water-intake-calculator", "calorie-calculator", "sleep-calculator"],
};
