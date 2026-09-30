import type { ToolDef } from "@/registry/types";

export const waterTool: ToolDef = {
  slug: "water-intake-calculator",
  component: "health/water",
  icon: "GlassWater",
  name: { ru: "Калькулятор нормы воды", en: "Water intake calculator" },
  title: { ru: "Норма воды в день — калькулятор по весу и активности", en: "Water intake calculator — how much water per day" },
  h1: { ru: "Калькулятор нормы воды в день", en: "Daily water intake calculator" },
  description: {
    ru: "Сколько воды пить в день с учётом веса, тренировок и жары: в литрах, стаканах и fl oz. Для веса 70 кг и 30 минут тренировок — около 2,35 литра в день.",
    en: "How much water to drink a day based on weight, exercise and hot weather — in litres, glasses and US fl oz. At 70 kg with 30 minutes of exercise it is about 2.35 L.",
  },
  lead: {
    ru: "При весе 70 кг и получасовой тренировке нужно около 2,35 л воды в день — примерно 9 стаканов.",
    en: "At 70 kg with a half-hour workout you need about 2.35 L of water a day — around 9 glasses.",
  },
  keywords: {
    ru: ["норма воды", "сколько пить воды", "вода в день", "водный баланс"],
    en: ["water intake calculator", "how much water to drink", "daily water intake", "hydration"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите вес в килограммах или фунтах.",
      "Укажите, сколько минут в день вы тренируетесь.",
      "Отметьте жаркий климат, если на улице жарко или вы много потеете.",
      "Получите норму в литрах, стаканах и жидких унциях.",
    ],
    en: [
      "Enter your weight in kilograms or pounds.",
      "Enter how many minutes a day you exercise.",
      "Choose hot climate if it is hot outside or you sweat a lot.",
      "Get your target in litres, glasses and fluid ounces.",
    ],
  },
  about: {
    ru: [
      "Калькулятор использует простое правило: около 30 мл на килограмм веса плюс 500 мл на час тренировки и ещё 500 мл в жару. Для 70 кг это 2,1 л в спокойный день.",
      "Официальные рекомендации EFSA — 2,0 л в день для женщин и 2,5 л для мужчин с учётом всей жидкости и воды из еды. Точная потребность индивидуальна; здоровому человеку достаточно пить по жажде, следя за светлым цветом мочи.",
    ],
    en: [
      "The calculator uses a simple rule: about 30 ml per kilogram of body weight, plus 500 ml per hour of exercise and another 500 ml in hot weather. At 70 kg that is 2.1 L on a quiet day.",
      "EFSA recommends 2.0 L a day for women and 2.5 L for men, counting all drinks and water from food. Needs vary; healthy people can drink to thirst and aim for pale urine.",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько воды нужно пить в день?", a: "В среднем 30 мл на кг веса: при 60 кг — около 1,8 л, при 80 кг — 2,4 л, плюс больше при тренировках и в жару. Часть воды поступает с едой." },
      { q: "Считаются ли чай и кофе?", a: "Да. Кофеин слабо мочегонный, но при привычном потреблении чай и кофе тоже восполняют жидкость." },
      { q: "Можно ли выпить слишком много воды?", a: "Да, очень большие объёмы за короткое время опасны (гипонатриемия). Пейте равномерно в течение дня и по жажде." },
    ],
    en: [
      { q: "How much water should I drink a day?", a: "On average 30 ml per kg of body weight: about 1.8 L at 60 kg, 2.4 L at 80 kg, plus more for exercise and heat. Some of it comes from food." },
      { q: "Do tea and coffee count?", a: "Yes. Caffeine is mildly diuretic, but for regular drinkers tea and coffee still add to fluid intake." },
      { q: "Can you drink too much water?", a: "Yes — very large amounts in a short time are dangerous (hyponatraemia). Spread drinks through the day and follow your thirst." },
    ],
  },
  related: ["calorie-calculator", "bmi-calculator", "heart-rate-zone-calculator", "sleep-calculator"],
};
