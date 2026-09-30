import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";

function table(locale: Locale): Block {
  const ru = locale === "ru";
  const lens = [24, 26, 28, 30, 32, 35];
  return {
    type: "table",
    title: ru ? "День овуляции при разной длине цикла (лютеиновая фаза 14 дней)" : "Ovulation day by cycle length (14-day luteal phase)",
    head: ru ? ["Цикл", "Овуляция", "Фертильные дни"] : ["Cycle", "Ovulation", "Fertile days"],
    rows: lens.map((l) => {
      const ov = l - 14;
      return [ru ? `${l} дней` : `${l} days`, ru ? `${ov}-й день` : `day ${ov}`, ru ? `${ov - 5}–${ov + 1}-й дни` : `days ${ov - 5}–${ov + 1}`];
    }),
  };
}

export const ovulationTool: ToolDef = {
  slug: "ovulation-calculator",
  component: "health/ovulation",
  icon: "CalendarHeart",
  popular: true,
  name: { ru: "Калькулятор овуляции", en: "Ovulation calculator" },
  title: { ru: "Калькулятор овуляции — календарь фертильных дней", en: "Ovulation calculator — fertile window calendar" },
  h1: { ru: "Калькулятор овуляции и фертильных дней", en: "Ovulation and fertile window calculator" },
  description: {
    ru: "Рассчитайте день овуляции и фертильное окно на ближайшие циклы по дате последних месячных и длине цикла. Календарь на 3 цикла, дата следующих месячных.",
    en: "Find your ovulation day and fertile window for the next cycles from the date of your last period and cycle length. Calendar for 3 cycles and your next period date.",
  },
  lead: {
    ru: "При цикле 28 дней овуляция приходится примерно на 14-й день, а фертильное окно — на 9–15-й дни цикла.",
    en: "With a 28-day cycle ovulation falls around day 14 and the fertile window on days 9–15.",
  },
  keywords: {
    ru: ["калькулятор овуляции", "день овуляции", "фертильные дни", "календарь овуляции", "благоприятные дни для зачатия"],
    en: ["ovulation calculator", "fertile window", "ovulation calendar", "most fertile days"],
  },
  props: {},
  howTo: {
    ru: [
      "Введите первый день последних месячных.",
      "Укажите среднюю длину цикла — от первого дня одних месячных до первого дня следующих.",
      "При необходимости измените длину лютеиновой фазы (по умолчанию 14 дней).",
      "Смотрите ближайшую овуляцию, фертильное окно и календарь на три цикла.",
    ],
    en: [
      "Enter the first day of your last period.",
      "Enter your average cycle length — from the first day of one period to the first day of the next.",
      "Adjust the luteal phase if you know it (14 days by default).",
      "See your next ovulation, fertile window and a calendar for three cycles.",
    ],
  },
  about: {
    ru: [
      "Овуляция обычно происходит примерно за 14 дней до начала следующих месячных: при цикле 28 дней это 14-й день цикла, при цикле 32 дня — 18-й. Фертильное окно — около 6 дней: 5 дней до овуляции, потому что сперматозоиды живут до 5 дней, и день овуляции с запасом в один день.",
      "Расчёт по календарю даёт среднюю оценку. Стресс, болезни, смена часовых поясов и гормональные изменения сдвигают овуляцию, поэтому для планирования беременности полезно дополнить календарь тестами на ЛГ. Для контрацепции календарный метод ненадёжен.",
    ],
    en: [
      "Ovulation usually happens about 14 days before the next period: cycle day 14 in a 28-day cycle, day 18 in a 32-day cycle. The fertile window is about 6 days: 5 days before ovulation, because sperm live up to 5 days, plus ovulation day and one more day.",
      "The calendar method gives an average estimate. Stress, illness, travel and hormonal changes shift ovulation, so LH tests are a useful addition when trying to conceive. The calendar method is not reliable contraception.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать день овуляции?", a: "Вычтите 14 из длины цикла — получится день цикла, на который приходится овуляция (первый день месячных считается первым днём цикла). При цикле 30 дней это примерно 16-й день." },
      { q: "Сколько длится фертильное окно?", a: "Около 6 дней: 5 дней до овуляции и сам день овуляции. Калькулятор добавляет ещё день после для запаса." },
      { q: "Можно ли использовать калькулятор для контрацепции?", a: "Нет. Овуляция может сдвигаться даже при регулярном цикле, поэтому календарный метод не защищает от беременности." },
    ],
    en: [
      { q: "How do I calculate my ovulation day?", a: "Subtract 14 from your cycle length to get the cycle day of ovulation (the first day of your period is day 1). With a 30-day cycle that is around day 16." },
      { q: "How long is the fertile window?", a: "About 6 days: the 5 days before ovulation and ovulation day. The calculator adds one more day to be safe." },
      { q: "Can I use it for contraception?", a: "No. Ovulation can shift even in regular cycles, so the calendar method does not reliably prevent pregnancy." },
    ],
  },
  related: ["pregnancy-calculator", "sleep-calculator", "water-intake-calculator", "bmi-calculator"],
  blocks: (locale) => [table(locale)],
};
