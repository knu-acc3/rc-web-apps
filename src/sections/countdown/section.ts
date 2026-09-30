import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, VariantDef } from "@/registry/types";
import { fmtDate, isoWeekday, WEEKDAYS, ymdStr, type Ymd } from "@/sections/calendar/lib/dates";
import { EVENTS, type EventDef } from "./data/events";
import { seasonMoment } from "./lib/astro";
import type { CountdownSpec } from "./lib/next";

/** Build year: the date tables list years from here; the countdown itself is computed live. */
const BUILD_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 14 }, (_, i) => BUILD_YEAR - 1 + i);

function occurrences(e: EventDef): Ymd[] {
  if (e.once) {
    const [y, m, d] = e.once.split("-").map(Number);
    return [{ y, m, d }];
  }
  if (e.md) return YEARS.map((y) => ({ y, m: e.md![0], d: e.md![1] }));
  if (e.dates) return YEARS.flatMap((y) => e.dates!(y));
  return [];
}

function specOf(e: EventDef, locale: Locale): CountdownSpec {
  const base = { name: e.name[locale], to: e.to[locale], yearProgress: e.yearProgress, expected: e.expected };
  if (e.weekend) return { ...base, weekend: true };
  if (e.season) return { ...base, moments: YEARS.map((y) => seasonMoment(y, e.season!)) };
  return { ...base, dates: occurrences(e).map(ymdStr), once: !!e.once, allDay: !e.endOfDay };
}

const wdShort = (locale: Locale, x: Ymd) => (locale === "ru" ? WEEKDAYS.ruShort : WEEKDAYS.enShort)[isoWeekday(x.y, x.m, x.d) - 1];
const wdLong = (locale: Locale, x: Ymd) => (locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[isoWeekday(x.y, x.m, x.d) - 1];

function hhmm(t: number, off: number): { ymd: Ymd; time: string } {
  const d = new Date(t + off * 60000);
  return { ymd: { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }, time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}` };
}

const BUILD_DAY = (() => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
})();

/** Occurrences from the build date on (stable, year-labelled facts). */
function upcoming(e: EventDef): Ymd[] {
  const list = occurrences(e);
  if (e.once) return list;
  return list.filter((x) => x.y * 10000 + x.m * 100 + x.d >= BUILD_DAY).slice(0, 6);
}

function eventBlocks(e: EventDef) {
  return (locale: Locale): Block[] => {
    const ru = locale === "ru";
    const blocks: Block[] = [];
    if (e.season) {
      const rows = YEARS.filter((y) => y >= BUILD_YEAR)
        .slice(0, 6)
        .map((y) => {
          const t = seasonMoment(y, e.season!);
          const u = hhmm(t, 0);
          const msk = hhmm(t, 180);
          const ast = hhmm(t, 300);
          const cell = (x: { ymd: Ymd; time: string }) => `${fmtDate(locale, x.ymd, false)}, ${x.time}`;
          return [String(y), cell(u), cell(msk), cell(ast)];
        });
      blocks.push({ type: "table", title: ru ? `${e.name.ru}: точное время` : `${e.name.en}: exact time`, head: ru ? ["Год", "UTC", "Москва (UTC+3)", "Астана (UTC+5)"] : ["Year", "UTC", "Moscow (UTC+3)", "Astana (UTC+5)"], rows });
    } else if (!e.weekend) {
      const list = upcoming(e);
      blocks.push({
        type: "table",
        title: ru ? `Даты: ${e.name.ru}` : `Dates: ${e.name.en}`,
        head: ru ? ["Год", "Дата", "День недели"] : ["Year", "Date", "Weekday"],
        rows: list.map((x) => [String(x.y), fmtDate(locale, x, false), wdLong(locale, x) + (e.expected && x.y > BUILD_YEAR ? (ru ? " (ожидается)" : " (expected)") : "")]),
      });
    }
    blocks.push({ type: "text", title: ru ? "О дате" : "About the date", paragraphs: [e.about[locale]] });
    return blocks;
  };
}

function eventVariant(e: EventDef): VariantDef {
  const list = upcoming(e).slice(0, 3);
  const datesRu = e.season
    ? YEARS.filter((y) => y >= BUILD_YEAR)
        .slice(0, 2)
        .map((y) => {
          const x = hhmm(seasonMoment(y, e.season!), 180);
          return `${fmtDate("ru", x.ymd)}, ${x.time} мск`;
        })
        .join("; ")
    : list.map((x) => `${fmtDate("ru", x)} (${wdShort("ru", x).toLowerCase()})`).join(", ");
  const datesEn = e.season
    ? YEARS.filter((y) => y >= BUILD_YEAR)
        .slice(0, 2)
        .map((y) => {
          const x = hhmm(seasonMoment(y, e.season!), 0);
          return `${fmtDate("en", x.ymd)}, ${x.time} UTC`;
        })
        .join("; ")
    : list.map((x) => `${fmtDate("en", x)} (${wdShort("en", x)})`).join(", ");

  const faqRu: QA[] = [
    {
      q: `Сколько дней осталось ${e.to.ru}?`,
      a: `Точное число дней, часов, минут и секунд показывает счётчик вверху страницы — он считает время по часам вашего устройства и вашему часовому поясу. ${e.weekend ? "Отсчёт идёт до субботы, 00:00." : datesRu ? `Ближайшие даты: ${datesRu}.` : ""}`.trim(),
    },
    {
      q: "Почему время у знакомых в другом городе отличается?",
      a: e.season
        ? "Момент равноденствия или солнцестояния один для всей Земли, поэтому в разных часовых поясах он приходится на разное местное время — счётчик показывает его по вашему времени."
        : "Отсчёт идёт до полуночи по местному времени, а в разных часовых поясах полночь наступает в разное время: в Астане — на 2 часа раньше, чем в Москве.",
    },
  ];
  if (e.expected) faqRu.push({ q: "Точна ли дата?", a: "Даты взяты из календаря Умм аль-Кура. Окончательную дату праздника объявляет Духовное управление мусульман Казахстана (или России), и она может отличаться на один день." });
  const faqEn: QA[] = [
    {
      q: `How many days are left ${e.to.en}?`,
      a: `The counter at the top shows the exact days, hours, minutes and seconds, using your device clock and time zone. ${e.weekend ? "It counts down to Saturday, 00:00." : datesEn ? `Upcoming dates: ${datesEn}.` : ""}`.trim(),
    },
    {
      q: "Why does a friend in another city see a different time?",
      a: e.season
        ? "An equinox or solstice is a single instant for the whole Earth, so it falls at different local times in different zones — the counter shows it in your time."
        : "The countdown runs to local midnight, which comes at different moments in different time zones: in Astana 2 hours before Moscow.",
    },
  ];
  if (e.expected) faqEn.push({ q: "Is the date exact?", a: "Dates come from the Umm al-Qura calendar. The final date is announced by religious authorities and may differ by one day." });

  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    slug: e.slug,
    name: e.name,
    glyph: e.glyph,
    title: { ru: `Сколько дней ${e.to.ru} — обратный отсчёт`, en: `How many days ${e.to.en} — countdown` },
    h1: { ru: `Сколько дней ${e.to.ru}`, en: `How many days ${e.to.en}` },
    description: {
      ru: `Сколько дней, часов и минут ${e.to.ru}: точный обратный отсчёт по вашему времени. ${datesRu && !e.weekend ? `Даты: ${datesRu}.` : `${cap(e.rule.ru)}.`}`,
      en: `How many days, hours and minutes ${e.to.en}: an exact countdown in your local time. ${datesEn && !e.weekend ? `Dates: ${datesEn}.` : `${cap(e.rule.en)}.`}`,
    },
    lead: { ru: `${cap(e.name.ru)}: ${e.rule.ru}. Счётчик идёт по вашему местному времени.`, en: `${e.name.en}: ${e.rule.en}. The countdown uses your local time.` },
    props: { event: specOf(e, "ru"), eventEn: specOf(e, "en") },
    keywords: { ru: [e.name.ru, `сколько осталось ${e.to.ru}`, `отсчёт ${e.to.ru}`], en: [e.name.en, `countdown ${e.to.en}`] },
    blocks: eventBlocks(e),
    faq: { ru: faqRu, en: faqEn },
  };
}

export const countdownSection = defineToolSection({
  id: "countdown",
  name: { ru: "Обратный отсчёт", en: "Countdown" },
  description: {
    ru: "Сколько дней, часов и минут осталось до праздников и важных дат",
    en: "How many days, hours and minutes are left until holidays and important dates",
  },
  icon: "Hourglass",
  hue: 205,
  category: "time",
  order: 3,
  tools: [
    {
      slug: "",
      component: "countdown/countdown",
      icon: "Hourglass",
      name: { ru: "Обратный отсчёт до даты", en: "Countdown to a date" },
      title: { ru: "Обратный отсчёт до даты онлайн — дни, часы, минуты", en: "Countdown to a date online — days, hours, minutes" },
      h1: { ru: "Обратный отсчёт до даты", en: "Countdown to a date" },
      description: {
        ru: "Обратный отсчёт до любой даты онлайн: дни, часы, минуты и секунды до отпуска, дня рождения или дедлайна. Отсчёт по вашему времени, ссылкой можно поделиться. Праздники — готовые.",
        en: "Countdown to any date online: days, hours, minutes and seconds until a vacation, birthday or deadline. Uses your local time, shareable link. Ready-made holiday countdowns.",
      },
      lead: { ru: "Выберите дату и время — счётчик покажет, сколько осталось.", en: "Pick a date and time — the counter shows how much is left." },
      howTo: {
        ru: [
          "Откройте счётчик нужного праздника или задайте свою дату и время на странице «Обратный отсчёт до даты».",
          "Счётчик сразу покажет дни, часы, минуты и секунды — по часам и часовому поясу вашего устройства.",
          "Для своего события добавьте название и скопируйте ссылку — у получателя откроется тот же отсчёт.",
          "Когда праздник наступит, счётчик покажет это, а на следующий день перейдёт к следующей дате.",
        ],
        en: [
          "Open a holiday countdown or set your own date and time on the “Countdown to a date” page.",
          "The counter immediately shows days, hours, minutes and seconds, using your device clock and time zone.",
          "For your own event add a title and copy the link — the recipient sees the same countdown.",
          "When a holiday arrives the counter says so, and the next day it moves on to the next date.",
        ],
      },
      about: {
        ru: [
          "Отсчёт считается в вашем браузере по часам устройства и вашему часовому поясу: полночь 31 декабря у пользователя в Алматы наступит раньше, чем у пользователя в Москве. Когда событие наступит, счётчик покажет, сколько времени прошло.",
          "Дата и название хранятся после знака # в адресе страницы — на сервер они не отправляются. Ниже — готовые счётчики до праздников России и Казахстана.",
        ],
        en: [
          "The countdown runs in your browser on your device clock and time zone. Once the event has passed, the counter shows how long ago it was.",
          "The date and title are stored after the # in the page address and are never sent to a server. Ready-made holiday countdowns are listed below.",
        ],
      },
      faq: {
        ru: [
          { q: "Можно ли поделиться отсчётом?", a: "Да: скопируйте ссылку под счётчиком. В ней записаны дата, время и название, поэтому у получателя откроется тот же отсчёт — по его местному времени." },
          { q: "Учитывается ли часовой пояс?", a: "Да, время считается в вашем часовом поясе. Если нужно отсчитывать до момента в другом городе, переведите время конвертером часовых поясов." },
          { q: "Что будет, когда дата наступит?", a: "Счётчик покажет, что событие наступило, и начнёт считать, сколько времени прошло." },
        ],
        en: [
          { q: "Can I share a countdown?", a: "Yes: copy the link under the counter. It stores the date, time and title, so the recipient sees the same countdown in their local time." },
          { q: "Is my time zone taken into account?", a: "Yes, time is calculated in your zone. To count down to a moment in another city, convert the time with the time zone converter first." },
          { q: "What happens when the date arrives?", a: "The counter shows that the event has arrived and starts counting the time since." },
        ],
      },
      related: ["calendar", "week-number", "time-zone-converter"],
      popular: true,
      variants: { title: { ru: "Сколько дней до праздника", en: "Holiday countdowns" }, list: () => EVENTS.map(eventVariant), limit: 48 },
    },
  ],
});
