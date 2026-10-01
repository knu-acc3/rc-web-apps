import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, VariantDef } from "@/registry/types";
import { addDays, cap, fmtDate, isLeap, isoWeekday, WEEKDAYS, type Ymd } from "@/tools/time/calendar/lib/dates";
import { fmtOffset, tzOffset } from "@/tools/time/time/lib/tz";
import { iso8601, rfc2822 } from "./lib/engine";

const BUILD_YEAR = new Date().getFullYear();
const ruPl = (n: number, f: [string, string, string]) => `${formatNumber("ru", n)} ${plural("ru", n, f)}`;
const years = (locale: Locale, n: number) => (locale === "ru" ? ruPl(n, ["год", "года", "лет"]) : `${n} ${n === 1 ? "year" : "years"}`);
const wd = (locale: Locale, x: Ymd) => (locale === "ru" ? WEEKDAYS.ru : WEEKDAYS.en)[isoWeekday(x.y, x.m, x.d) - 1];

/* ───────────── age by birth year ───────────── */

function generation(y: number): { ru: string; en: string } {
  if (y <= 1945) return { ru: "молчаливое поколение (1928–1945)", en: "Silent Generation (1928–1945)" };
  if (y <= 1964) return { ru: "бэби-бумеры (1946–1964)", en: "Baby Boomers (1946–1964)" };
  if (y <= 1980) return { ru: "поколение X (1965–1980)", en: "Generation X (1965–1980)" };
  if (y <= 1996) return { ru: "миллениалы, поколение Y (1981–1996)", en: "Millennials (1981–1996)" };
  if (y <= 2012) return { ru: "поколение Z (1997–2012)", en: "Generation Z (1997–2012)" };
  return { ru: "поколение Альфа (с 2013 года)", en: "Generation Alpha (from 2013)" };
}

const AGE_YEARS: number[] = [
  ...Array.from({ length: 31 }, (_, i) => 1980 + i),
  ...Array.from({ length: 10 }, (_, i) => 1970 + i),
  ...Array.from({ length: 15 }, (_, i) => 2011 + i),
  ...Array.from({ length: 10 }, (_, i) => 1960 + i),
  ...Array.from({ length: 20 }, (_, i) => 1940 + i),
];

function ageVariant(y: number): VariantDef {
  const now = BUILD_YEAR - y;
  const gen = generation(y);
  const jan1 = { y, m: 1, d: 1 };
  const nextRound = [18, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].find((a) => y + a >= BUILD_YEAR)!;
  const rows = (locale: Locale) =>
    Array.from({ length: 11 }, (_, i) => BUILD_YEAR - 2 + i)
      .filter((yy) => yy > y)
      .map((yy) => [String(yy), years(locale, yy - y), years(locale, yy - y - 1)]);
  const near = Array.from({ length: 11 }, (_, i) => y - 5 + i).filter((v) => v !== y && v >= 1940 && v <= 2025);

  const blocks = (locale: Locale): Block[] => {
    const ru = locale === "ru";
    return [
      {
        type: "table",
        title: ru ? `Возраст родившихся в ${y} году по годам` : `Age of people born in ${y}, by year`,
        head: ru ? ["Год", "После дня рождения", "До дня рождения"] : ["Year", "After the birthday", "Before the birthday"],
        rows: rows(locale),
      },
      {
        type: "facts",
        title: ru ? `${y} год` : `The year ${y}`,
        rows: [
          [ru ? "Високосный" : "Leap year", isLeap(y) ? (ru ? "да, 366 дней" : "yes, 366 days") : ru ? "нет, 365 дней" : "no, 365 days"],
          [ru ? "1 января" : "January 1", wd(locale, jan1)],
          [ru ? "Поколение" : "Generation", ru ? `${gen.ru} — по классификации Pew Research Center` : `${gen.en} — by the Pew Research Center definition`],
          [ru ? `${nextRound} лет исполнится` : `Turns ${nextRound}`, ru ? `в ${y + nextRound} году` : `in ${y + nextRound}`],
        ],
      },
      { type: "links", title: ru ? "Соседние годы рождения" : "Nearby birth years", style: "chips", items: near.map((v) => ({ path: ["age-calculator", String(v)], label: String(v) })) },
    ];
  };

  return {
    slug: String(y),
    name: { ru: String(y), en: String(y) },
    title: { ru: `Сколько лет, если родился в ${y} году — калькулятор возраста`, en: `How old am I if I was born in ${y} — age calculator` },
    h1: { ru: `Сколько лет, если родился в ${y} году`, en: `How old am I if I was born in ${y}` },
    description: {
      ru: `Родившимся в ${y} году в ${BUILD_YEAR} году исполняется ${years("ru", now)}, до дня рождения им ${years("ru", now - 1)}. Точный возраст по дате рождения, таблица по годам, поколение.`,
      en: `People born in ${y} turn ${now} in ${BUILD_YEAR} and are ${now - 1} before their birthday. Exact age from the date of birth, an age-by-year table and generation.`,
    },
    lead: {
      ru: `В ${BUILD_YEAR} году родившимся в ${y} году исполняется ${years("ru", now)}; пока день рождения не наступил — ${years("ru", now - 1)}.`,
      en: `In ${BUILD_YEAR} people born in ${y} turn ${now}; until their birthday they are ${now - 1}.`,
    },
    props: { birthYear: y },
    keywords: { ru: [`${y} год рождения`, `родился в ${y}`, `сколько лет ${y}`], en: [`born in ${y}`, `age ${y}`] },
    blocks,
    faq: {
      ru: [
        { q: `Сколько лет родившимся в ${y} году в ${BUILD_YEAR} году?`, a: `${cap(years("ru", now))} — если день рождения в ${BUILD_YEAR} году уже прошёл, и ${years("ru", now - 1)} — если ещё нет. Выберите день и месяц рождения выше, чтобы узнать точный возраст.` },
        { q: `В каком году исполнится ${nextRound} лет?`, a: `Родившимся в ${y} году ${nextRound} лет исполнится в ${y + nextRound} году.` },
        { q: `Какое поколение — ${y} год рождения?`, a: `По классификации Pew Research Center это ${gen.ru}. Границы поколений условны и в разных исследованиях отличаются на несколько лет.` },
      ],
      en: [
        { q: `How old are people born in ${y} in ${BUILD_YEAR}?`, a: `${now} if their ${BUILD_YEAR} birthday has passed, ${now - 1} if not. Pick the day and month above for the exact age.` },
        { q: `When will someone born in ${y} turn ${nextRound}?`, a: `In ${y + nextRound}.` },
        { q: `Which generation is ${y}?`, a: `By the Pew Research Center definition, ${gen.en}. Generation boundaries are conventional and vary between studies.` },
      ],
    },
  };
}

/* ───────────── add N days ───────────── */

const ADD = [7, 10, 14, 30, 45, 60, 90, 100, 180, 365];

function addVariant(n: number): VariantDef {
  const weeks = Math.floor(n / 7);
  const rest = n % 7;
  const blocks = (locale: Locale): Block[] => {
    const ru = locale === "ru";
    const rows = Array.from({ length: 12 }, (_, i) => {
      const from = { y: BUILD_YEAR, m: i + 1, d: 1 };
      const to = addDays(from, n);
      return [fmtDate(locale, from), `${fmtDate(locale, to)}, ${wd(locale, to)}`];
    });
    return [
      {
        type: "facts",
        title: ru ? "Коротко" : "Quick facts",
        rows: [
          [ru ? `${n} дней — это` : `${n} days is`, ru ? `${ruPl(weeks, ["неделя", "недели", "недель"])}${rest ? ` и ${ruPl(rest, ["день", "дня", "дней"])}` : ""}` : `${weeks} weeks${rest ? ` and ${rest} days` : ""}`],
          [ru ? "В часах" : "In hours", formatNumber(locale, n * 24)],
          [ru ? "Примерно в месяцах" : "Roughly in months", formatNumber(locale, n / 30.44, { maximumFractionDigits: 1 })],
        ],
      },
      { type: "table", title: ru ? `Через ${n} дней от 1-го числа, ${BUILD_YEAR} год` : `${n} days after the 1st of each month, ${BUILD_YEAR}`, head: ru ? ["Начальная дата", `Через ${n} дней`] : ["Start date", `After ${n} days`], rows },
    ];
  };
  const ex = { y: BUILD_YEAR, m: 3, d: 1 };
  const exTo = addDays(ex, n);
  return {
    slug: `${n}-days`,
    name: { ru: `+${n} дней`, en: `+${n} days` },
    title: { ru: `Какая дата будет через ${n} дней — калькулятор дат`, en: `What date is ${n} days from today — date calculator` },
    h1: { ru: `Какая дата будет через ${n} дней`, en: `What date is ${n} days from now` },
    description: {
      ru: `Дата через ${n} дней от сегодня или от любой даты: результат сразу, с днём недели. ${n} дней = ${weeks} нед.${rest ? ` ${rest} дн.` : ""}; например, от 1 марта ${BUILD_YEAR} — ${fmtDate("ru", exTo)}.`,
      en: `The date ${n} days from today or from any date, instantly and with the weekday. ${n} days = ${weeks} weeks${rest ? ` ${rest} days` : ""}; e.g. from March 1, ${BUILD_YEAR} it is ${fmtDate("en", exTo)}.`,
    },
    lead: { ru: `Прибавьте ${n} дней к сегодняшней или любой другой дате — результат появится сразу.`, en: `Add ${n} days to today or any other date — the result appears instantly.` },
    props: { days: n },
    blocks,
    faq: {
      ru: [
        { q: `Как посчитать дату через ${n} дней?`, a: `Прибавьте ${n} календарных дней к начальной дате, переходя через границы месяцев. Например, от 1 марта ${BUILD_YEAR} года через ${n} дней будет ${fmtDate("ru", exTo)} (${wd("ru", exTo)}). Калькулятор выше делает это для любой даты.` },
        { q: n === 30 ? "30 дней и месяц — одно и то же?" : `Сколько это в неделях — ${n} дней?`, a: n === 30 ? "Нет. Календарный месяц длится от 28 до 31 дня, поэтому «через месяц» и «через 30 дней» могут давать разные даты. Для месяцев выберите в калькуляторе единицу «месяцев»." : `${ruPl(weeks, ["неделя", "недели", "недель"])}${rest ? ` и ${ruPl(rest, ["день", "дня", "дней"])}` : ""}.` },
      ],
      en: [
        { q: `How do I find the date ${n} days from now?`, a: `Add ${n} calendar days to the start date, carrying over month boundaries. From March 1, ${BUILD_YEAR}, ${n} days later is ${fmtDate("en", exTo)} (${wd("en", exTo)}). The calculator above does this for any date.` },
        { q: n === 30 ? "Is 30 days the same as a month?" : `How many weeks is ${n} days?`, a: n === 30 ? "No. A calendar month has 28 to 31 days, so “in a month” and “in 30 days” can give different dates. Choose “months” in the calculator for months." : `${weeks} weeks${rest ? ` and ${rest} days` : ""}.` },
      ],
    },
  };
}

/* ───────────── notable Unix timestamps ───────────── */

const UNIX: [string, { ru: string; en: string }][] = [
  ["0", { ru: "Эпоха Unix — точка отсчёта: 1 января 1970 года, 00:00:00 UTC. Отрицательные значения обозначают даты до 1970 года.", en: "The Unix epoch — the starting point: January 1, 1970, 00:00:00 UTC. Negative values mean dates before 1970." }],
  ["1000000000", { ru: "Миллиардная секунда Unix-времени наступила 9 сентября 2001 года; программисты называли этот момент «billennium».", en: "The billionth second of Unix time arrived on September 9, 2001; programmers called it the “billennium”." }],
  ["1234567890", { ru: "Число 1234567890 наступило 13 февраля 2009 года (по UTC ещё 13-е, а в Москве уже 14 февраля); этот момент отмечали разработчики по всему миру.", en: "1234567890 arrived on February 13, 2009 UTC (already February 14 in Moscow); developers around the world celebrated it." }],
  ["1500000000", { ru: "Полтора миллиарда секунд Unix-времени — 14 июля 2017 года.", en: "One and a half billion seconds of Unix time — July 14, 2017." }],
  ["1700000000", { ru: "1,7 миллиарда секунд — 14 ноября 2023 года по UTC; в Москве и Астане уже было 15 ноября.", en: "1.7 billion seconds — November 14, 2023 UTC; it was already November 15 in Moscow and Astana." }],
  ["2000000000", { ru: "Два миллиарда секунд Unix-времени наступят 18 мая 2033 года.", en: "Two billion seconds of Unix time arrive on May 18, 2033." }],
  ["2147483647", { ru: "2 147 483 647 — наибольшее 32-битное знаковое целое. 19 января 2038 года в 03:14:07 UTC 32-битные счётчики времени переполнятся — это «проблема 2038 года»; современные системы хранят время в 64 битах.", en: "2,147,483,647 is the largest signed 32-bit integer. On January 19, 2038 at 03:14:07 UTC 32-bit time counters overflow — the “Year 2038 problem”; modern systems store time in 64 bits." }],
];

function unixVariant([ts, note]: [string, { ru: string; en: string }]): VariantDef {
  const ms = Number(ts) * 1000;
  const ymdAt = (off: number): { ymd: Ymd; time: string } => {
    const d = new Date(ms + off * 60000);
    const p = (v: number) => String(v).padStart(2, "0");
    return { ymd: { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }, time: `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}` };
  };
  // Real historical offsets from the tz database (Moscow was UTC+4 in summer 2001, Astana UTC+6 before 2024).
  const mskOff = tzOffset("Europe/Moscow", ms);
  const astOff = tzOffset("Asia/Almaty", ms);
  const u = ymdAt(0);
  const msk = ymdAt(mskOff);
  const ast = ymdAt(astOff);
  const pretty = formatNumber("ru", Number(ts));
  return {
    slug: ts,
    name: { ru: ts, en: ts },
    title: { ru: `Unix-время ${ts} — какая это дата`, en: `Unix timestamp ${ts} — what date is it` },
    h1: { ru: `Unix-время ${ts}`, en: `Unix time ${ts}` },
    description: {
      ru: `Unix-время ${ts} — это ${fmtDate("ru", u.ymd)}, ${u.time} UTC (${fmtDate("ru", msk.ymd, false)}, ${msk.time} по Москве). ISO 8601, RFC 2822, миллисекунды и конвертер.`,
      en: `Unix time ${ts} is ${fmtDate("en", u.ymd)}, ${u.time} UTC (${fmtDate("en", msk.ymd, false)}, ${msk.time} in Moscow). ISO 8601, RFC 2822, milliseconds and a converter.`,
    },
    lead: { ru: `${ts} — это ${fmtDate("ru", u.ymd)}, ${u.time} UTC.`, en: `${ts} is ${fmtDate("en", u.ymd)}, ${u.time} UTC.` },
    props: { value: ts },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? "Дата и время" : "Date and time",
        rows: [
          ["UTC", `${fmtDate(locale, u.ymd)}, ${u.time} (${wd(locale, u.ymd)})`],
          [locale === "ru" ? "Москва" : "Moscow", `${fmtDate(locale, msk.ymd)}, ${msk.time} (${fmtOffset(mskOff)})`],
          [locale === "ru" ? "Астана, Алматы" : "Astana, Almaty", `${fmtDate(locale, ast.ymd)}, ${ast.time} (${fmtOffset(astOff)})`],
          ["ISO 8601", iso8601(ms)],
          ["RFC 2822", rfc2822(ms)],
          [locale === "ru" ? "В миллисекундах" : "In milliseconds", String(ms)],
          [locale === "ru" ? "Шестнадцатеричное" : "Hexadecimal", `0x${Number(ts).toString(16).toUpperCase()}`],
        ],
      },
      { type: "text", paragraphs: [note[locale]] },
    ],
    faq: {
      ru: [
        { q: `Какая дата соответствует ${pretty}?`, a: `${cap(fmtDate("ru", u.ymd))}, ${u.time} по UTC. В Москве в этот момент было ${fmtDate("ru", msk.ymd)}, ${msk.time}, в Астане — ${fmtDate("ru", ast.ymd)}, ${ast.time}.` },
        { q: "Что такое Unix-время?", a: "Количество секунд, прошедших с 1 января 1970 года 00:00:00 UTC, без учёта високосных секунд. Оно одинаково для всех часовых поясов." },
      ],
      en: [
        { q: `What date is ${ts}?`, a: `${fmtDate("en", u.ymd)}, ${u.time} UTC. In Moscow it was ${fmtDate("en", msk.ymd)}, ${msk.time}; in Astana ${fmtDate("en", ast.ymd)}, ${ast.time}.` },
        { q: "What is Unix time?", a: "The number of seconds since January 1, 1970 00:00:00 UTC, not counting leap seconds. It is the same in every time zone." },
      ],
    },
    keywords: { ru: [`${ts} дата`, `timestamp ${ts}`], en: [`${ts} date`, `epoch ${ts}`] },
  };
}

/* ───────────── section ───────────── */

export const dateSection = defineToolSection({
  id: "date",
  name: { ru: "Даты", en: "Date calculators" },
  description: {
    ru: "Возраст, разница между датами, прибавление дней, день недели, Unix-время и калькулятор времени",
    en: "Age, days between dates, adding days, day of the week, Unix time and time calculator",
  },
  icon: "CalendarClock",
  hue: 225,
  category: "time",
  order: 5,
  tools: [
    {
      slug: "age-calculator",
      component: "date/age",
      icon: "Cake",
      name: { ru: "Калькулятор возраста", en: "Age calculator" },
      title: { ru: "Калькулятор возраста — сколько мне лет по дате рождения", en: "Age calculator — how old am I by date of birth" },
      h1: { ru: "Калькулятор возраста", en: "Age calculator" },
      description: {
        ru: "Сколько мне лет: точный возраст в годах, месяцах и днях по дате рождения, сколько дней прожито, когда следующий день рождения и в какой день недели вы родились.",
        en: "How old am I: exact age in years, months and days from the date of birth, days lived, the next birthday and the weekday you were born on.",
      },
      lead: { ru: "Выберите дату рождения — возраст появится сразу.", en: "Choose the date of birth — the age appears instantly." },
      howTo: {
        ru: ["Выберите день, месяц и год рождения.", "Возраст в полных годах появится крупно, ниже — точный возраст в годах, месяцах и днях.", "Под результатом — сколько дней вы прожили, когда следующий день рождения и в какой день недели вы родились.", "Чтобы узнать возраст на другую дату, укажите её в поле «Возраст на дату»."],
        en: ["Choose the day, month and year of birth.", "The age in full years appears in large type, the exact age in years, months and days below.", "Below: days lived, the next birthday and the weekday you were born on.", "To get the age on another date, set it in “Age on date”."],
      },
      about: {
        ru: [
          "Возраст считается так же, как в документах: полный год прибавляется в день рождения. Родившимся 29 февраля в невисокосные годы год прибавляется 28 февраля — по правилу о сроках, которые заканчиваются в месяце без нужного числа.",
          "Все вычисления идут в браузере по дате вашего устройства; дата рождения никуда не отправляется.",
        ],
        en: [
          "Age is counted the way documents count it: a full year is added on the birthday. People born on February 29 age on February 28 in common years.",
          "Everything is calculated in your browser from your device date; the birth date is never sent anywhere.",
        ],
      },
      faq: {
        ru: [
          { q: "Как посчитать точный возраст?", a: "Вычтите год рождения из текущего года и отнимите единицу, если в этом году день рождения ещё не наступил. Оставшиеся месяцы и дни считаются от последнего дня рождения — калькулятор делает это автоматически." },
          { q: "Сколько дней я прожил?", a: "Калькулятор показывает число дней от даты рождения до сегодняшней (или выбранной) даты с учётом високосных лет." },
          { q: "Когда день рождения у родившихся 29 февраля?", a: "В високосные годы — 29 февраля, в остальные возраст прибавляется 28 февраля; калькулятор так и считает." },
        ],
        en: [
          { q: "How is the exact age calculated?", a: "Subtract the birth year from the current year and take off one if this year's birthday hasn't come yet. The remaining months and days are counted from the last birthday — the calculator does it for you." },
          { q: "How many days have I lived?", a: "The calculator shows the number of days from the birth date to today (or the chosen date), including leap years." },
          { q: "When do people born on February 29 celebrate?", a: "On February 29 in leap years; in other years the age increases on February 28, and the calculator follows that rule." },
        ],
      },
      related: ["countdown", "calendar"],
      popular: true,
      variants: { title: { ru: "Возраст по году рождения", en: "Age by birth year" }, list: () => AGE_YEARS.map(ageVariant), limit: 48 },
    },
    {
      slug: "days-between-dates",
      component: "date/diff",
      icon: "CalendarRange",
      name: { ru: "Дни между датами", en: "Days between dates" },
      title: { ru: "Сколько дней между датами — калькулятор дней онлайн", en: "Days between dates — date difference calculator" },
      h1: { ru: "Сколько дней между датами", en: "Days between dates" },
      description: {
        ru: "Сколько дней между двумя датами: разница в днях, неделях, месяцах и годах, с учётом конечной даты или без, рабочие дни с праздниками России и Казахстана.",
        en: "How many days are between two dates: the difference in days, weeks, months and years, with or without the end date, and working days with Russian or Kazakh holidays.",
      },
      lead: { ru: "Выберите две даты — разница в днях появится сразу.", en: "Pick two dates — the difference in days appears instantly." },
      howTo: {
        ru: ["Укажите начальную дату (пустое поле — сегодня) и конечную.", "Крупно — число дней, ниже — то же в годах, месяцах и днях.", "Включите «Включая конечную дату», если считаете, например, дни отпуска.", "Для рабочих дней выберите календарь: пн–пт, Россия или Казахстан."],
        en: ["Set the start date (empty = today) and the end date.", "The number of days is shown in large type, with years, months and days below.", "Turn on “Include the end date” when counting e.g. vacation days.", "For working days choose the calendar: Mon–Fri, Russia or Kazakhstan."],
      },
      about: {
        ru: [
          "По умолчанию считается, сколько дней проходит от начальной даты до конечной: от 1 до 2 января — 1 день. С включённой конечной датой считаются все дни периода: с 1 по 2 января — 2 дня.",
          "Рабочие дни считаются по производственному календарю: для России учтены праздники и переносы выходных 2024–2026 годов, для других лет — праздники по закону; для Казахстана — праздники по закону без постановлений о переносах.",
        ],
        en: [
          "By default the calculator counts how many days pass from the start to the end: January 1 to January 2 is 1 day. With the end date included, every day of the period counts: January 1–2 is 2 days.",
          "Working days follow the official calendar: for Russia, holidays and moved days off for 2024–2026 and statutory holidays for other years; for Kazakhstan, statutory holidays without transfer decrees.",
        ],
      },
      faq: {
        ru: [
          { q: "Считать ли последний день?", a: "Зависит от задачи. Для сроков «через N дней» конечная дата не включается, для отпуска или командировки — включается. Переключатель «Включая конечную дату» добавляет один день." },
          { q: "Сколько рабочих дней между датами?", a: "Выберите календарь (Россия или Казахстан) — калькулятор исключит выходные и праздники. Для простого подсчёта пн–пт выберите «Пн–пт»." },
          { q: "Как посчитать разницу в месяцах?", a: "Месяцы считаются по календарю: от 15 января до 15 марта — ровно 2 месяца. Остаток показывается в днях." },
        ],
        en: [
          { q: "Should the last day be counted?", a: "It depends. Deadlines like “in N days” exclude the end date; vacations or trips include it. The “Include the end date” switch adds one day." },
          { q: "How many working days are between two dates?", a: "Choose a calendar (Russia or Kazakhstan) and weekends and holidays are excluded. For a plain Mon–Fri count choose “Mon–Fri”." },
          { q: "How is the difference in months counted?", a: "Months follow the calendar: January 15 to March 15 is exactly 2 months. The remainder is shown in days." },
        ],
      },
      related: ["production-calendar", "calendar", "countdown"],
      popular: true,
    },
    {
      slug: "add-days-to-date",
      component: "date/add",
      icon: "CalendarPlus",
      name: { ru: "Прибавить дни к дате", en: "Add days to a date" },
      title: { ru: "Прибавить дни к дате — калькулятор дат онлайн", en: "Add days to a date — date calculator" },
      h1: { ru: "Прибавить дни к дате", en: "Add days to a date" },
      description: {
        ru: "Прибавить или отнять дни, недели, месяцы, годы или рабочие дни от даты: результат сразу, с днём недели и номером недели. Рабочие дни — с праздниками России и Казахстана.",
        en: "Add or subtract days, weeks, months, years or working days from a date: instant result with the weekday and week number. Working days include Russian or Kazakh holidays.",
      },
      lead: { ru: "Какая дата будет через N дней, недель или месяцев — или была N дней назад.", en: "What date it will be in N days, weeks or months — or was N days ago." },
      props: { days: 30 },
      howTo: {
        ru: ["Укажите начальную дату — или оставьте поле пустым, чтобы считать от сегодня.", "Выберите «Прибавить» или «Отнять» и введите число.", "Выберите единицу: дни, недели, месяцы, годы или рабочие дни.", "Итоговая дата с днём недели появится сразу."],
        en: ["Set the start date — or leave it empty to count from today.", "Choose Add or Subtract and enter the number.", "Choose the unit: days, weeks, months, years or working days.", "The resulting date with its weekday appears instantly."],
      },
      about: {
        ru: [
          "При прибавлении месяцев число сохраняется, а если в итоговом месяце такого числа нет, берётся последний день месяца: 31 января + 1 месяц = 28 февраля (29 — в високосный год).",
          "Рабочие дни отсчитываются от следующего за начальной датой дня: +1 рабочий день от пятницы — это понедельник, если он не праздничный.",
        ],
        en: [
          "When adding months the day of month is kept; if the target month is shorter, its last day is used: January 31 + 1 month = February 28 (29 in a leap year).",
          "Working days are counted from the day after the start date: +1 working day from a Friday is Monday unless it is a holiday.",
        ],
      },
      faq: {
        ru: [
          { q: "Как узнать дату через 90 дней?", a: "Оставьте начальную дату пустой (сегодня), введите 90 и выберите «дней». Или откройте готовую страницу «Через 90 дней» ниже." },
          { q: "Чем «через месяц» отличается от «через 30 дней»?", a: "Месяц — это тот же день следующего месяца (с поправкой на длину месяца), а 30 дней — ровно 30 суток. От 1 февраля через месяц — 1 марта, а через 30 дней — 3 марта (в невисокосный год)." },
          { q: "Учитываются ли праздники?", a: "Только в режиме «рабочих дней»: выберите календарь России или Казахстана." },
        ],
        en: [
          { q: "How do I find the date in 90 days?", a: "Leave the start date empty (today), enter 90 and choose “days”, or open the ready-made “90 days” page below." },
          { q: "How is “in a month” different from “in 30 days”?", a: "A month means the same day of the next month (adjusted for month length); 30 days is exactly 30 days. From February 1, a month later is March 1, while 30 days later is March 3 in a common year." },
          { q: "Are holidays taken into account?", a: "Only in “working days” mode: choose the Russian or Kazakh calendar." },
        ],
      },
      related: ["countdown", "production-calendar"],
      variants: { title: { ru: "Какая дата будет через…", en: "What date is in…" }, list: () => ADD.map(addVariant) },
    },
    {
      slug: "day-of-the-week",
      component: "date/weekday",
      icon: "CalendarDays",
      name: { ru: "День недели по дате", en: "Day of the week" },
      title: { ru: "Какой день недели — узнать по дате онлайн", en: "What day of the week — find it by date" },
      h1: { ru: "День недели по дате", en: "Day of the week by date" },
      description: {
        ru: "Какой день недели был или будет в любую дату: день недели, номер дня в году и номер недели по ISO, а также тот же день в соседние годы. Для дат с 1 года н. э. по григорианскому календарю.",
        en: "What day of the week any date was or will be: the weekday, day of the year and ISO week number, plus the same date in nearby years. Dates from year 1 AD in the Gregorian calendar.",
      },
      lead: { ru: "Выберите дату — день недели появится сразу.", en: "Pick a date — the weekday appears instantly." },
      howTo: {
        ru: ["Выберите дату (пустое поле — сегодня).", "Крупно — день недели, ниже — номер дня в году и номер недели.", "Внизу — на какой день недели эта дата приходится в соседние годы."],
        en: ["Pick a date (empty = today).", "The weekday is shown in large type, with the day of the year and week number below.", "Below: which weekday the same date falls on in nearby years."],
      },
      about: {
        ru: ["Расчёт ведётся по григорианскому календарю, в том числе для дат до его введения (пролептический календарь). В России григорианский календарь действует с 14 февраля 1918 года — для более ранних дат по старому стилю прибавьте 13 дней (для XIX века — 12)."],
        en: ["Calculations use the Gregorian calendar, including dates before its introduction (proleptic calendar). Russia adopted it on February 14, 1918 — for earlier Old Style dates add 13 days (12 for the 19th century)."],
      },
      faq: {
        ru: [
          { q: "Как узнать день недели по дате рождения?", a: "Введите дату рождения — калькулятор покажет день недели. Та же дата сдвигается на один день недели каждый год и на два — после 29 февраля." },
          { q: "Какой номер недели у даты?", a: "Он показан под днём недели — по ISO 8601, где неделя начинается в понедельник." },
        ],
        en: [
          { q: "How do I find the weekday of my birth date?", a: "Enter the date — the calculator shows the weekday. A date moves one weekday later each year, and two after a February 29." },
          { q: "What week number is a date?", a: "It is shown under the weekday — by ISO 8601, with weeks starting on Monday." },
        ],
      },
      related: ["calendar", "week-number"],
    },
    {
      slug: "unix-timestamp",
      component: "date/unix",
      icon: "Binary",
      name: { ru: "Unix-время", en: "Unix timestamp" },
      title: { ru: "Unix-время онлайн — конвертер timestamp в дату и обратно", en: "Unix timestamp converter — epoch to date and back" },
      h1: { ru: "Конвертер Unix-времени", en: "Unix timestamp converter" },
      description: {
        ru: "Конвертер Unix timestamp: секунды, миллисекунды, микро- и наносекунды с автоопределением, текущее Unix-время, дата в UTC и вашем поясе, ISO 8601, RFC 2822 и обратный перевод.",
        en: "Unix timestamp converter: seconds, milliseconds, micro- and nanoseconds with auto-detection, the current Unix time, date in UTC and your zone, ISO 8601, RFC 2822 and back.",
      },
      lead: { ru: "Вставьте timestamp — дата появится сразу; единица определяется по числу цифр.", en: "Paste a timestamp — the date appears instantly; the unit is detected from the number of digits." },
      howTo: {
        ru: ["Вставьте Unix-время в поле: 10 цифр — секунды, 13 — миллисекунды, 16 — микросекунды, 19 — наносекунды.", "Если единица определилась неверно, выберите её вручную.", "Скопируйте нужный формат: ISO 8601, RFC 2822, секунды или миллисекунды.", "Для обратного перевода выберите дату и время внизу."],
        en: ["Paste a Unix timestamp: 10 digits = seconds, 13 = milliseconds, 16 = microseconds, 19 = nanoseconds.", "If the unit is detected wrongly, choose it manually.", "Copy the format you need: ISO 8601, RFC 2822, seconds or milliseconds.", "To convert back, pick a date and time at the bottom."],
      },
      about: {
        ru: [
          "Unix-время — число секунд с 1 января 1970 года 00:00:00 UTC. В JavaScript и Java время обычно хранится в миллисекундах (13 цифр), в Python и PHP — в секундах (10 цифр), в Go и некоторых базах — в наносекундах.",
          "Если число выглядит как миллисекунды, а интерпретировать его как секунды, получится дата через десятки тысяч лет — калькулятор предупреждает о таких необычных результатах.",
        ],
        en: [
          "Unix time is the number of seconds since January 1, 1970 00:00:00 UTC. JavaScript and Java usually store milliseconds (13 digits), Python and PHP seconds (10 digits), Go and some databases nanoseconds.",
          "Reading milliseconds as seconds gives a date tens of thousands of years ahead — the converter warns about such unusual results.",
        ],
      },
      faq: {
        ru: [
          { q: "Как отличить секунды от миллисекунд?", a: "По длине: сейчас Unix-время в секундах — 10 цифр, в миллисекундах — 13. Калькулятор определяет единицу автоматически и показывает, как он понял число." },
          { q: "Зависит ли Unix-время от часового пояса?", a: "Нет, это одно и то же число во всём мире. От пояса зависит только отображение даты — калькулятор показывает её в UTC и в вашем времени." },
          { q: "Что такое проблема 2038 года?", a: "19 января 2038 года в 03:14:07 UTC Unix-время превысит 2 147 483 647 — максимум 32-битного знакового целого. Системы, где время хранится в 32 битах, начнут ошибаться; современные используют 64 бита." },
        ],
        en: [
          { q: "How do I tell seconds from milliseconds?", a: "By length: Unix time today is 10 digits in seconds and 13 in milliseconds. The converter detects the unit and shows how it read the number." },
          { q: "Does Unix time depend on the time zone?", a: "No, it is the same number worldwide. Only the displayed date depends on the zone — shown here in UTC and in your time." },
          { q: "What is the Year 2038 problem?", a: "On January 19, 2038 at 03:14:07 UTC Unix time exceeds 2,147,483,647, the largest signed 32-bit integer. Systems storing time in 32 bits will break; modern ones use 64 bits." },
        ],
      },
      related: ["utc-time", "time-zone-converter"],
      popular: true,
      variants: { title: { ru: "Известные значения", en: "Notable timestamps" }, list: () => UNIX.map(unixVariant) },
    },
    {
      slug: "time-calculator",
      component: "date/duration",
      icon: "Sigma",
      name: { ru: "Калькулятор времени", en: "Time calculator" },
      title: { ru: "Калькулятор времени — сложение и вычитание часов и минут", en: "Time calculator — add and subtract hours and minutes" },
      h1: { ru: "Калькулятор времени", en: "Time calculator" },
      description: {
        ru: "Сложение и вычитание времени онлайн: часы, минуты и секунды в форматах 1:30:00, 45 мин, 2ч 15м. Сумма в формате ч:мм:сс, в часах, минутах и секундах. Удобно для табеля и хронометража.",
        en: "Add and subtract time online: hours, minutes and seconds as 1:30:00, 45 min or 2h 15m. The total as h:mm:ss, in hours, minutes and seconds. Handy for timesheets and video lengths.",
      },
      lead: { ru: "Впишите промежутки по одному в строке — сумма считается сразу.", en: "Enter durations one per line — the total updates instantly." },
      howTo: {
        ru: ["Впишите промежутки времени, по одному в строке: 1:30:00, 45 мин, 2ч 15м.", "Чтобы вычесть, поставьте минус в начале строки.", "Выберите, что означает число без единиц: минуты, секунды или часы.", "Итог показан в формате ч:мм:сс и в десятичных часах — его можно скопировать."],
        en: ["Enter durations one per line: 1:30:00, 45 min, 2h 15m.", "Put a minus at the start of a line to subtract it.", "Choose what a plain number means: minutes, seconds or hours.", "The total is shown as h:mm:ss and in decimal hours — copy it with one click."],
      },
      about: {
        ru: ["Запись с двумя двоеточиями читается как часы:минуты:секунды, с одним — как минуты:секунды (90:00 — это полтора часа). Понимаются и слова: «2 часа 5 минут», «1ч 30м», «1,5ч»."],
        en: ["A value with two colons is hours:minutes:seconds, with one colon minutes:seconds (90:00 is an hour and a half). Words work too: “2 hours 5 minutes”, “1h 30m”, “1.5h”."],
      },
      faq: {
        ru: [
          { q: "Как сложить часы и минуты?", a: "Впишите каждое значение в отдельную строку, например 1:45:00 и 2:30:00, — калькулятор покажет 4:15:00 и 4,25 ч." },
          { q: "Как перевести минуты в часы?", a: "Впишите число минут — справа появится значение в часах. Например, 150 минут = 2:30:00 = 2,5 ч." },
          { q: "Можно ли вычитать время?", a: "Да: начните строку с минуса, например −0:20:00." },
        ],
        en: [
          { q: "How do I add hours and minutes?", a: "Put each value on its own line, e.g. 1:45:00 and 2:30:00 — the calculator shows 4:15:00 and 4.25 h." },
          { q: "How do I convert minutes to hours?", a: "Enter the minutes — the result in hours appears on the right. 150 minutes = 2:30:00 = 2.5 h." },
          { q: "Can I subtract time?", a: "Yes: start the line with a minus, e.g. −0:20:00." },
        ],
      },
      related: ["stopwatch", "timer"],
    },
    {
      slug: "work-hours-calculator",
      component: "date/workhours",
      icon: "BriefcaseBusiness",
      name: { ru: "Калькулятор рабочих часов", en: "Work hours calculator" },
      title: { ru: "Калькулятор рабочих часов — сколько отработано за неделю", en: "Work hours calculator — hours worked per week" },
      h1: { ru: "Калькулятор рабочих часов", en: "Work hours calculator" },
      description: {
        ru: "Сколько часов отработано за неделю: начало и конец смены, перерывы, ночные смены через полночь, итог в часах и минутах и в десятичных часах, оплата по почасовой ставке.",
        en: "How many hours you worked this week: shift start and end, breaks, overnight shifts, the total in hours and minutes and as decimal hours, pay at an hourly rate.",
      },
      lead: { ru: "Впишите время начала и конца смен — итог за неделю считается сразу.", en: "Enter shift start and end times — the weekly total updates instantly." },
      howTo: {
        ru: ["Для каждого дня укажите начало и конец смены; пустые поля — выходной.", "Добавьте перерыв в минутах — он вычитается из смены.", "Если смена заканчивается после полуночи, просто укажите время конца — калькулятор это учтёт.", "Введите ставку в час, чтобы увидеть сумму к оплате."],
        en: ["For each day enter the shift start and end; leave empty for a day off.", "Add a break in minutes — it is subtracted from the shift.", "If a shift ends after midnight, just enter the end time — the calculator handles it.", "Enter an hourly rate to see the pay."],
      },
      about: {
        ru: ["По умолчанию заполнена стандартная неделя: пн–пт с 9:00 до 18:00 с часовым перерывом — 40 часов, как в нормальной рабочей неделе по Трудовым кодексам России и Казахстана. Ставку можно указывать в любой валюте — в тенге, рублях или долларах."],
        en: ["The default is a standard week: Mon–Fri 9:00–18:00 with a one-hour break — 40 hours. The rate can be in any currency."],
      },
      faq: {
        ru: [
          { q: "Как посчитать рабочие часы с перерывом?", a: "Из времени между началом и концом смены вычтите перерыв: с 9:00 до 18:00 с перерывом 60 минут — 8 часов." },
          { q: "Что такое десятичные часы?", a: "Часы в виде дроби: 7 ч 30 мин = 7,5 ч. В таком виде их удобно умножать на почасовую ставку." },
          { q: "Как учитывается ночная смена?", a: "Если время окончания меньше времени начала (например, 22:00–06:00), смена считается до следующего дня: 8 часов минус перерыв." },
        ],
        en: [
          { q: "How do I calculate hours with a break?", a: "Take the time between start and end and subtract the break: 9:00–18:00 with a 60-minute break is 8 hours." },
          { q: "What are decimal hours?", a: "Hours as a fraction: 7 h 30 min = 7.5 h — easy to multiply by an hourly rate." },
          { q: "How are night shifts handled?", a: "If the end time is earlier than the start (e.g. 22:00–06:00), the shift runs into the next day: 8 hours minus the break." },
        ],
      },
      related: ["production-calendar"],
    },
  ],
});
