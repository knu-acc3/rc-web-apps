import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { BED_PAGES, bedtimesFor, hm, hm12, parseHm, WAKE_PAGES, wakeTimesFor, type SleepOption } from "../lib/sleep";

/** "7:00" (ru, no leading zero) / "7:00 AM" (en). */
const clock = (locale: Locale, m: number) => (locale === "ru" ? hm(m).replace(/^0(\d)/, "$1") : hm12(m));
const dur = (locale: Locale, min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return locale === "ru" ? `${h} ${plural("ru", h, ["час", "часа", "часов"])}${m ? ` ${m} мин` : ""}` : `${h}${m ? `.5` : ""} hours`;
};
const cyc = (locale: Locale, n: number) => (locale === "ru" ? `${n} ${plural("ru", n, ["цикл", "цикла", "циклов"])}` : `${n} cycles`);

function table(locale: Locale, opts: SleepOption[], wakeMode: boolean): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: wakeMode ? (ru ? "Когда ложиться" : "When to go to bed") : ru ? "Когда вставать" : "When to wake up",
    head: ru ? ["Циклы сна", wakeMode ? "Лечь в" : "Встать в", "Сон"] : ["Sleep cycles", wakeMode ? "Go to bed" : "Wake up", "Sleep"],
    rows: opts.map((o) => [cyc(locale, o.cycles), clock(locale, o.time), dur(locale, o.sleep)]),
  };
}

const slugOf = (prefix: string, time: string) => `${prefix}-${time.replace(":", "-")}`;

function wakeVariant(time: string): VariantDef {
  const w = parseHm(time)!;
  const opts = bedtimesFor(w);
  const [b6, b5, b4] = opts;
  const faq = (locale: Locale): QA[] =>
    locale === "ru"
      ? [
          { q: `Во сколько лечь, чтобы встать в ${clock("ru", w)}?`, a: `Оптимально в ${clock("ru", b5.time)} (5 циклов, 7,5 часа сна) или в ${clock("ru", b6.time)} (6 циклов, 9 часов). Время уже включает 15 минут на засыпание.` },
          { q: `Сколько я посплю, если лягу в ${clock("ru", b4.time)}?`, a: `Около 6 часов — 4 полных цикла. Это меньше рекомендуемых взрослым 7–9 часов, поэтому такой режим подходит только изредка.` },
          { q: "Почему именно 90 минут?", a: "Это средняя длина цикла сна. У разных людей цикл длится от 80 до 110 минут — если знаете свой, измените длину цикла в настройках калькулятора." },
        ]
      : [
          { q: `What time should I go to bed to wake up at ${clock("en", w)}?`, a: `Ideally at ${clock("en", b5.time)} (5 cycles, 7.5 hours of sleep) or ${clock("en", b6.time)} (6 cycles, 9 hours). The times include 15 minutes to fall asleep.` },
          { q: `How long will I sleep if I go to bed at ${clock("en", b4.time)}?`, a: "About 6 hours — 4 full cycles. That is less than the 7–9 hours recommended for adults, so keep it occasional." },
          { q: "Why 90 minutes?", a: "It is the average length of a sleep cycle. Cycles last 80–110 minutes for different people — if you know yours, change the cycle length in the settings." },
        ];
  return {
    slug: slugOf("wake-up", time),
    name: { ru: `Встать в ${clock("ru", w)}`, en: `Wake at ${clock("en", w)}` },
    title: { ru: `Во сколько лечь спать, чтобы встать в ${clock("ru", w)}`, en: `What time to go to bed to wake up at ${clock("en", w)}` },
    h1: { ru: `Во сколько лечь спать, чтобы проснуться в ${clock("ru", w)}`, en: `Bedtime to wake up at ${clock("en", w)}` },
    description: {
      ru: `Чтобы проснуться в ${clock("ru", w)} бодрым, ложитесь в ${clock("ru", b5.time)} (7,5 часа сна) или ${clock("ru", b6.time)} (9 часов). Расчёт по 90-минутным циклам сна и 15 минутам на засыпание.`,
      en: `To wake up at ${clock("en", w)} feeling rested, go to bed at ${clock("en", b5.time)} (7.5 hours) or ${clock("en", b6.time)} (9 hours), based on 90-minute sleep cycles plus 15 minutes to fall asleep.`,
    },
    lead: {
      ru: `Для подъёма в ${clock("ru", w)} ложитесь в ${clock("ru", b5.time)} или ${clock("ru", b6.time)} — так будильник прозвенит в конце цикла сна.`,
      en: `To wake at ${clock("en", w)}, go to bed at ${clock("en", b5.time)} or ${clock("en", b6.time)} so the alarm rings at the end of a sleep cycle.`,
    },
    keywords: { ru: [`во сколько лечь чтобы встать в ${clock("ru", w)}`, `подъём в ${clock("ru", w)}`], en: [`bedtime for ${clock("en", w)}`, `wake up at ${clock("en", w)}`] },
    props: { mode: "wake", time },
    blocks: (locale) => [table(locale, opts, true)],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

function bedVariant(time: string): VariantDef {
  const b = parseHm(time)!;
  const opts = wakeTimesFor(b, 90, 15, [6, 5, 4, 3]);
  const [w6, w5, w4] = opts;
  const faq = (locale: Locale): QA[] =>
    locale === "ru"
      ? [
          { q: `Во сколько вставать, если лечь в ${clock("ru", b)}?`, a: `Лучше всего в ${clock("ru", w5.time)} (5 циклов, 7,5 часа сна) или в ${clock("ru", w6.time)} (6 циклов, 9 часов). Учтены 15 минут на засыпание.` },
          { q: `Можно ли встать в ${clock("ru", w4.time)}?`, a: "Да, это конец четвёртого цикла, но сна будет только 6 часов — меньше рекомендуемых взрослым 7–9 часов." },
          { q: "Что делать, если я засыпаю дольше 15 минут?", a: "Укажите своё время засыпания в настройках калькулятора — время подъёма сдвинется." },
        ]
      : [
          { q: `What time should I wake up if I go to bed at ${clock("en", b)}?`, a: `Best at ${clock("en", w5.time)} (5 cycles, 7.5 hours of sleep) or ${clock("en", w6.time)} (6 cycles, 9 hours). This includes 15 minutes to fall asleep.` },
          { q: `Can I get up at ${clock("en", w4.time)}?`, a: "Yes, it is the end of the fourth cycle, but that is only 6 hours of sleep — less than the 7–9 hours adults need." },
          { q: "What if I take longer than 15 minutes to fall asleep?", a: "Enter your own time in the calculator settings and the wake-up times will shift." },
        ];
  return {
    slug: slugOf("bedtime", time),
    name: { ru: `Лечь в ${clock("ru", b)}`, en: `Bed at ${clock("en", b)}` },
    title: { ru: `Во сколько вставать, если лечь спать в ${clock("ru", b)}`, en: `What time to wake up if you go to bed at ${clock("en", b)}` },
    h1: { ru: `Во сколько проснуться, если лечь в ${clock("ru", b)}`, en: `Wake-up time if you go to bed at ${clock("en", b)}` },
    description: {
      ru: `Если лечь спать в ${clock("ru", b)}, лучше всего проснуться в ${clock("ru", w5.time)} (7,5 часа сна) или ${clock("ru", w6.time)} (9 часов). Время рассчитано по 90-минутным циклам сна.`,
      en: `If you go to bed at ${clock("en", b)}, the best times to wake up are ${clock("en", w5.time)} (7.5 hours) or ${clock("en", w6.time)} (9 hours), based on 90-minute sleep cycles.`,
    },
    lead: {
      ru: `Ложитесь в ${clock("ru", b)} — ставьте будильник на ${clock("ru", w5.time)} или ${clock("ru", w6.time)}, чтобы проснуться в конце цикла сна.`,
      en: `Going to bed at ${clock("en", b)}? Set the alarm for ${clock("en", w5.time)} or ${clock("en", w6.time)} to wake at the end of a sleep cycle.`,
    },
    keywords: { ru: [`лечь в ${clock("ru", b)}`, `если лечь в ${clock("ru", b)} во сколько вставать`], en: [`bed at ${clock("en", b)}`, `wake up time ${clock("en", b)}`] },
    props: { mode: "bed", time },
    blocks: (locale) => [table(locale, opts, false)],
    faq: { ru: faq("ru"), en: faq("en") },
  };
}

export const sleepTool: ToolDef = {
  slug: "sleep-calculator",
  seoAlt: { ru: ["калькулятор сна по циклам", "калькулятор сна", "сон по циклам"], en: ["sleep cycle calculator", "sleep calculator", "sleep cycles"] },
  component: "health/sleep",
  icon: "BedDouble",
  popular: true,
  name: { ru: "Калькулятор сна", en: "Sleep calculator" },
  title: { ru: "Калькулятор сна по циклам — во сколько лечь и встать", en: "Sleep calculator — bedtime and wake-up by sleep cycles" },
  h1: { ru: "Калькулятор сна по циклам", en: "Sleep cycle calculator" },
  description: {
    ru: "Во сколько лечь спать, чтобы проснуться бодрым, или во сколько вставать, если ложитесь сейчас: расчёт по 90-минутным циклам сна и 15 минутам на засыпание.",
    en: "When to go to bed to wake up refreshed, or when to wake up if you go to bed now — based on 90-minute sleep cycles and 15 minutes to fall asleep.",
  },
  lead: {
    ru: "Чтобы встать в 7:00, ложитесь в 23:15 (5 циклов, 7,5 часа сна) или в 21:45 (6 циклов, 9 часов).",
    en: "To wake up at 7:00 AM, go to bed at 11:15 PM (5 cycles, 7.5 hours) or 9:45 PM (6 cycles, 9 hours).",
  },
  keywords: {
    ru: ["калькулятор сна", "циклы сна", "во сколько лечь спать", "фазы сна", "во сколько вставать"],
    en: ["sleep calculator", "sleep cycles", "bedtime calculator", "what time to go to bed", "wake up time"],
  },
  props: { mode: "wake", time: "07:00" },
  howTo: {
    ru: [
      "Выберите режим: время подъёма, время отбоя или «лечь сейчас».",
      "Введите время — калькулятор посчитает варианты для 3–6 циклов сна.",
      "При желании измените длину цикла и время на засыпание.",
      "Выберите вариант с 5 или 6 циклами, чтобы спать 7,5–9 часов.",
    ],
    en: [
      "Choose a mode: wake-up time, bedtime or sleep now.",
      "Enter the time — the calculator lists options for 3–6 sleep cycles.",
      "Optionally change the cycle length and the time it takes you to fall asleep.",
      "Pick 5 or 6 cycles to sleep 7.5–9 hours.",
    ],
  },
  about: {
    ru: [
      "Ночной сон состоит из повторяющихся циклов: лёгкий сон, глубокий сон и фаза быстрого сна. Один цикл длится в среднем около 90 минут. Если будильник прозвенит в конце цикла, проснуться обычно легче, чем посреди глубокого сна.",
      "Калькулятор прибавляет 15 минут на засыпание и считает время для 3–6 циклов. Взрослым рекомендуется спать не меньше 7 часов, поэтому ориентируйтесь на 5 циклов (7,5 часа) или 6 циклов (9 часов).",
    ],
    en: [
      "Night sleep consists of repeating cycles of light sleep, deep sleep and REM sleep, each about 90 minutes on average. Waking at the end of a cycle usually feels easier than waking from deep sleep.",
      "The calculator adds 15 minutes to fall asleep and lists times for 3–6 cycles. Adults should sleep at least 7 hours, so aim for 5 cycles (7.5 hours) or 6 cycles (9 hours).",
    ],
  },
  faq: {
    ru: [
      { q: "Сколько длится цикл сна?", a: "В среднем около 90 минут, у разных людей — от 80 до 110. За ночь проходит 4–6 циклов." },
      { q: "Сколько нужно спать взрослому?", a: "Не меньше 7 часов; большинству взрослых нужно 7–9 часов. Это 5–6 полных циклов сна." },
      { q: "Во сколько лечь спать, чтобы встать в 6:00?", a: "В 22:15 (5 циклов, 7,5 часа) или в 20:45 (6 циклов, 9 часов) — с учётом 15 минут на засыпание." },
    ],
    en: [
      { q: "How long is a sleep cycle?", a: "About 90 minutes on average, 80–110 minutes for different people. You go through 4–6 cycles a night." },
      { q: "How much sleep do adults need?", a: "At least 7 hours; most adults need 7–9 hours, which is 5–6 full cycles." },
      { q: "What time should I go to bed to wake up at 6 AM?", a: "At 10:15 PM (5 cycles, 7.5 hours) or 8:45 PM (6 cycles, 9 hours), including 15 minutes to fall asleep." },
    ],
  },
  related: ["water-intake-calculator", "heart-rate-zone-calculator", "calorie-calculator", "pregnancy-calculator"],
  variants: {
    title: { ru: "Время сна", en: "Sleep times" },
    list: () => [...WAKE_PAGES.map(wakeVariant), ...BED_PAGES.map(bedVariant)],
  },
};
