import type { ToolDef } from "@/registry/types";

export const heartRateTool: ToolDef = {
  slug: "heart-rate-zone-calculator",
  component: "health/heart-rate",
  icon: "HeartPulse",
  name: { ru: "Калькулятор пульсовых зон", en: "Heart rate zone calculator" },
  title: { ru: "Калькулятор пульсовых зон — максимальный пульс и Карвонен", en: "Heart rate zone calculator — max HR and Karvonen" },
  h1: { ru: "Калькулятор пульсовых зон для тренировок", en: "Heart rate zone calculator" },
  description: {
    ru: "Максимальный пульс по формулам Танаки (208 − 0,7 × возраст) и 220 − возраст и пять тренировочных зон, в том числе по Карвонену с пульсом в покое. В 30 лет — 187 уд/мин.",
    en: "Maximum heart rate by Tanaka (208 − 0.7 × age) and 220 − age, plus five training zones, including the Karvonen method with resting heart rate. At 30 it is 187 bpm.",
  },
  lead: {
    ru: "В 30 лет максимальный пульс по Танаке — 187 уд/мин; зона 2 (выносливость) — 112–131 уд/мин.",
    en: "At 30 your maximum heart rate by Tanaka is 187 bpm; zone 2 (endurance) is 112–131 bpm.",
  },
  keywords: {
    ru: ["пульсовые зоны", "максимальный пульс", "формула Карвонена", "пульс для жиросжигания", "зона 2"],
    en: ["heart rate zones", "max heart rate", "karvonen formula", "zone 2 heart rate", "target heart rate"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите возраст — калькулятор посчитает максимальный пульс.",
      "Добавьте пульс в покое, чтобы зоны считались по методу Карвонена.",
      "Выберите формулу максимума: Танаки или классическую 220 − возраст.",
      "Используйте диапазоны пяти зон для планирования тренировок.",
    ],
    en: [
      "Enter your age — the calculator works out your maximum heart rate.",
      "Add your resting heart rate to use the Karvonen method.",
      "Choose the max HR formula: Tanaka or the classic 220 − age.",
      "Use the five zone ranges to plan your training.",
    ],
  },
  about: {
    ru: [
      "Пульсовые зоны делят нагрузку по интенсивности: от лёгкой (50–60 % максимума) до предельной (90–100 %). Большую часть тренировок на выносливость обычно проводят во второй зоне, а интервалы — в четвёртой и пятой.",
      "Метод Карвонена учитывает пульс в покое: зона считается от резерва пульса (максимум минус покой). У тренированных людей с низким пульсом покоя зоны получаются выше и точнее отражают реальную нагрузку.",
    ],
    en: [
      "Heart-rate zones divide effort by intensity, from easy (50–60% of maximum) to all-out (90–100%). Most endurance training is typically done in zone 2, with intervals in zones 4 and 5.",
      "The Karvonen method uses your resting heart rate: zones are based on heart-rate reserve (maximum minus resting). For fit people with a low resting rate the zones come out higher and better reflect real effort.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать максимальный пульс?", a: "По формуле Танаки: 208 − 0,7 × возраст. В 40 лет это 180 уд/мин. Классическая формула 220 − возраст даёт в том же возрасте тоже 180, но расходится у людей моложе и старше." },
      { q: "Что такое метод Карвонена?", a: "Целевой пульс = (максимум − пульс в покое) × интенсивность + пульс в покое. Например, при максимуме 190, покое 60 и 70 % — 151 уд/мин." },
      { q: "В какой зоне лучше сжигается жир?", a: "Во второй зоне (60–70 %) организм использует больший процент энергии из жиров, а такие тренировки можно делать долго. Для снижения веса важнее общий расход калорий." },
    ],
    en: [
      { q: "How do I calculate my maximum heart rate?", a: "With the Tanaka formula: 208 − 0.7 × age. At 40 that is 180 bpm. The classic 220 − age also gives 180 at 40 but differs for younger and older people." },
      { q: "What is the Karvonen method?", a: "Target HR = (maximum − resting) × intensity + resting. With a maximum of 190, resting 60 and 70% intensity it is 151 bpm." },
      { q: "Which zone burns the most fat?", a: "In zone 2 (60–70%) a larger share of energy comes from fat and sessions can be long. For weight loss, total calories burned matter more." },
    ],
  },
  related: ["calorie-calculator", "water-intake-calculator", "bmi-calculator", "sleep-calculator"],
};
