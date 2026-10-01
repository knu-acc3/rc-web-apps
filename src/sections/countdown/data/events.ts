import type { L10n } from "@/i18n/config";
import { addDays, nthWeekday, orthodoxEaster, westernEaster, type Ymd } from "@/sections/calendar/lib/dates";
import { islamicDates } from "@/sections/calendar/lib/islamic";
import type { Season } from "../lib/astro";

/**
 * Countdown events. Dates are civil dates; the client turns them into instants
 * in the visitor's own time zone (New Year starts at local midnight everywhere).
 */
export interface EventDef {
  slug: string;
  /** Chip label / name: «Новый год». */
  name: L10n;
  /** «до Нового года» / "until New Year" */
  to: L10n;
  /** Annual fixed date [month, day]. */
  md?: [number, number];
  /** Dates in a year (movable feasts, US rules, Islamic calendar). */
  dates?: (y: number) => Ymd[];
  /** Exact astronomical moment. */
  season?: Season;
  /** One-off date (YYYY-MM-DD). */
  once?: string;
  /** Next Saturday 00:00. */
  weekend?: boolean;
  /** Target is the end of the day before (e.g. "end of the year" = Dec 31, 24:00). */
  endOfDay?: boolean;
  /** Short text: what it is, where it is a day off. */
  about: L10n;
  /** Date rule in words («1 января», «первое воскресенье после…»). */
  rule: L10n;
  /** Dates are expected (announced by religious authorities). */
  expected?: boolean;
  /** Show "how much of the year has passed". */
  yearProgress?: boolean;
  glyph: string;
}

const islamic = (ev: "ramadan" | "fitr" | "adha") => (y: number) => islamicDates(ev, y);

export const EVENTS: EventDef[] = [
  {
    slug: "new-year",
    glyph: "🎄",
    name: { ru: "Новый год", en: "New Year" },
    to: { ru: "до Нового года", en: "until New Year" },
    md: [1, 1],
    yearProgress: true,
    rule: { ru: "1 января, 00:00", en: "January 1, 00:00" },
    about: {
      ru: "Новый год наступает в полночь 1 января по местному времени, поэтому счётчик идёт до полуночи в вашем часовом поясе. В России нерабочие дни — с 1 по 8 января, в Казахстане праздничные — 1 и 2 января.",
      en: "New Year arrives at midnight on January 1 local time, so the countdown runs to midnight in your own time zone. Russia has days off from January 1 to 8, Kazakhstan on January 1 and 2.",
    },
  },
  {
    slug: "new-year-2027",
    glyph: "🎆",
    name: { ru: "Новый год 2027", en: "New Year 2027" },
    to: { ru: "до Нового 2027 года", en: "until New Year 2027" },
    once: "2027-01-01",
    rule: { ru: "1 января 2027 года (пятница), 00:00", en: "Friday, January 1, 2027, 00:00" },
    about: {
      ru: "2027 год начнётся в пятницу. Счётчик показывает, сколько осталось до полуночи 1 января 2027 года по вашему местному времени, а после наступления — сколько прошло.",
      en: "2027 begins on a Friday. The counter shows the time left until midnight on January 1, 2027 in your local time, and how long ago it was once it has passed.",
    },
  },
  {
    slug: "old-new-year",
    glyph: "🥂",
    name: { ru: "Старый Новый год", en: "Old New Year" },
    to: { ru: "до Старого Нового года", en: "until the Old New Year" },
    md: [1, 14],
    rule: { ru: "14 января — Новый год по юлианскому календарю", en: "January 14 — New Year by the Julian calendar" },
    about: {
      ru: "Старый Новый год — Новый год по юлианскому календарю, который на 13 дней отстаёт от григорианского. Неофициальный праздник, отмечается в ночь с 13 на 14 января.",
      en: "The Old New Year is New Year by the Julian calendar, 13 days behind the Gregorian one. An unofficial holiday celebrated on the night of January 13–14.",
    },
  },
  {
    slug: "orthodox-christmas",
    glyph: "⭐",
    name: { ru: "Рождество (7 января)", en: "Orthodox Christmas" },
    to: { ru: "до Рождества Христова", en: "until Orthodox Christmas" },
    md: [1, 7],
    rule: { ru: "7 января", en: "January 7" },
    about: {
      ru: "Православное Рождество отмечают 7 января (25 декабря по юлианскому календарю). Это выходной день в России и Казахстане.",
      en: "Orthodox Christmas is celebrated on January 7 (December 25 in the Julian calendar). It is a public holiday in Russia and Kazakhstan.",
    },
  },
  {
    slug: "valentines-day",
    glyph: "💘",
    name: { ru: "День святого Валентина", en: "Valentine's Day" },
    to: { ru: "до Дня святого Валентина", en: "until Valentine's Day" },
    md: [2, 14],
    rule: { ru: "14 февраля", en: "February 14" },
    about: { ru: "День всех влюблённых отмечают 14 февраля. Это не выходной день ни в России, ни в Казахстане.", en: "Valentine's Day is on February 14. It is not a public holiday in Russia or Kazakhstan." },
  },
  {
    slug: "feb-23",
    glyph: "🎖️",
    name: { ru: "23 февраля", en: "February 23" },
    to: { ru: "до 23 февраля", en: "until February 23" },
    md: [2, 23],
    rule: { ru: "23 февраля — День защитника Отечества", en: "February 23 — Defender of the Fatherland Day" },
    about: {
      ru: "День защитника Отечества — выходной день в России; если он выпадает на субботу или воскресенье, выходной переносится на понедельник. В Казахстане день защитника отмечают 7 мая.",
      en: "Defender of the Fatherland Day is a day off in Russia; if it falls on a weekend, the day off moves to Monday. Kazakhstan celebrates its defenders on May 7.",
    },
  },
  {
    slug: "maslenitsa",
    glyph: "🥞",
    name: { ru: "Масленица", en: "Maslenitsa" },
    to: { ru: "до Масленицы", en: "until Maslenitsa" },
    dates: (y) => [addDays(orthodoxEaster(y), -55)],
    rule: { ru: "неделя за 7 недель до православной Пасхи (с понедельника)", en: "the week 7 weeks before Orthodox Easter (from Monday)" },
    about: {
      ru: "Масленичная неделя начинается за 55 дней до православной Пасхи и заканчивается Прощёным воскресеньем, поэтому её даты меняются каждый год. Счётчик идёт до понедельника масленичной недели.",
      en: "Maslenitsa week starts 55 days before Orthodox Easter and ends on Forgiveness Sunday, so its dates change every year. The countdown runs to the Monday of Maslenitsa week.",
    },
  },
  {
    slug: "march-8",
    glyph: "🌷",
    name: { ru: "8 Марта", en: "March 8" },
    to: { ru: "до 8 Марта", en: "until March 8" },
    md: [3, 8],
    rule: { ru: "8 марта — Международный женский день", en: "March 8 — International Women's Day" },
    about: {
      ru: "Международный женский день — выходной в России и Казахстане. Если 8 марта выпадает на выходной, нерабочим становится следующий понедельник.",
      en: "International Women's Day is a public holiday in Russia and Kazakhstan. If March 8 falls on a weekend, the following Monday is a day off.",
    },
  },
  {
    slug: "nauryz",
    glyph: "🌸",
    name: { ru: "Наурыз", en: "Nauryz" },
    to: { ru: "до Наурыза", en: "until Nauryz" },
    md: [3, 21],
    rule: { ru: "21 марта (праздничные дни 21–23 марта)", en: "March 21 (public holidays March 21–23)" },
    about: {
      ru: "Наурыз мейрамы — праздник весеннего равноденствия и нового года у народов Центральной Азии. В Казахстане это три праздничных дня: 21, 22 и 23 марта.",
      en: "Nauryz is the spring-equinox and new-year festival of Central Asia. In Kazakhstan it is three public holidays: March 21, 22 and 23.",
    },
  },
  {
    slug: "kazakhstan-constitution-day",
    glyph: "📜",
    name: { ru: "День Конституции Казахстана", en: "Kazakhstan Constitution Day" },
    to: { ru: "до Дня Конституции Казахстана", en: "until Kazakhstan Constitution Day" },
    md: [3, 15],
    rule: { ru: "15 марта", en: "March 15" },
    about: {
      ru: "День Конституции Республики Казахстан с 2027 года отмечают 15 марта — в этот день в 2026 году на референдуме приняли новую Конституцию. Это выходной день. До 2025 года праздник был 30 августа, а в 2026 году не отмечался.",
      en: "Since 2027 Kazakhstan's Constitution Day is on March 15, the day the new Constitution was adopted by referendum in 2026. It is a public holiday. Until 2025 it was on August 30, and in 2026 it was not observed.",
    },
  },
  {
    slug: "spring-equinox",
    glyph: "🌗",
    name: { ru: "Весеннее равноденствие", en: "Spring equinox" },
    to: { ru: "до весеннего равноденствия", en: "until the spring equinox" },
    season: "march",
    rule: { ru: "20 или 21 марта, точный момент — по расчёту", en: "March 20 or 21, exact instant calculated" },
    about: {
      ru: "В момент весеннего равноденствия Солнце пересекает небесный экватор, и день почти равен ночи. Это астрономическое начало весны; момент один для всей Земли, счётчик показывает его по вашему времени.",
      en: "At the spring equinox the Sun crosses the celestial equator and day and night are nearly equal. It is the astronomical start of spring; the instant is the same worldwide and is shown in your time.",
    },
  },
  {
    slug: "spring",
    glyph: "🌱",
    name: { ru: "Весна", en: "Spring" },
    to: { ru: "до весны", en: "until spring" },
    md: [3, 1],
    rule: { ru: "1 марта — календарная весна", en: "March 1 — meteorological spring" },
    about: {
      ru: "Календарная (метеорологическая) весна начинается 1 марта, астрономическая — в день весеннего равноденствия, 20 или 21 марта.",
      en: "Meteorological spring starts on March 1; astronomical spring begins at the March equinox on the 20th or 21st.",
    },
  },
  {
    slug: "easter",
    glyph: "🐣",
    name: { ru: "Католическая Пасха", en: "Easter" },
    to: { ru: "до католической Пасхи", en: "until Easter" },
    dates: (y) => [westernEaster(y)],
    rule: { ru: "первое воскресенье после весеннего полнолуния (григорианская пасхалия)", en: "first Sunday after the spring full moon (Gregorian computus)" },
    about: {
      ru: "Дата католической (западной) Пасхи рассчитывается по григорианской пасхалии и выпадает на период с 22 марта по 25 апреля.",
      en: "Western Easter is calculated with the Gregorian computus and falls between March 22 and April 25.",
    },
  },
  {
    slug: "orthodox-easter",
    glyph: "🥚",
    name: { ru: "Пасха", en: "Orthodox Easter" },
    to: { ru: "до Пасхи", en: "until Orthodox Easter" },
    dates: (y) => [orthodoxEaster(y)],
    rule: { ru: "по юлианской пасхалии (Александрийский расчёт)", en: "by the Julian (Alexandrian) computus" },
    about: {
      ru: "Православная Пасха считается по юлианской пасхалии и в XXI веке выпадает на даты с 4 апреля по 8 мая. Иногда она совпадает с католической (как в 2025 и 2028 годах).",
      en: "Orthodox Easter follows the Julian computus and in the 21st century falls between April 4 and May 8. Sometimes it coincides with Western Easter (as in 2025 and 2028).",
    },
  },
  {
    slug: "may-1",
    glyph: "🌼",
    name: { ru: "1 Мая", en: "May 1" },
    to: { ru: "до 1 Мая", en: "until May 1" },
    md: [5, 1],
    rule: { ru: "1 мая", en: "May 1" },
    about: {
      ru: "1 мая — Праздник Весны и Труда в России и Праздник единства народа Казахстана. В обеих странах это выходной день.",
      en: "May 1 is Spring and Labour Day in Russia and Unity Day of the People of Kazakhstan. It is a public holiday in both countries.",
    },
  },
  {
    slug: "kazakhstan-unity-day",
    glyph: "🤝",
    name: { ru: "День единства народа Казахстана", en: "Kazakhstan Unity Day" },
    to: { ru: "до Дня единства народа Казахстана", en: "until Kazakhstan Unity Day" },
    md: [5, 1],
    rule: { ru: "1 мая", en: "May 1" },
    about: {
      ru: "Праздник единства народа Казахстана отмечают 1 мая. Это государственный праздник и выходной день; если он выпадает на выходной, отдыхают в следующий рабочий день.",
      en: "Unity Day of the People of Kazakhstan is on May 1. It is a public holiday; if it falls on a weekend, the next working day is off.",
    },
  },
  {
    slug: "kazakhstan-defender-day",
    glyph: "🎖️",
    name: { ru: "7 мая — День защитника Отечества", en: "May 7 — Defender of the Fatherland Day" },
    to: { ru: "до 7 мая — Дня защитника Отечества в Казахстане", en: "until May 7 — Kazakhstan's Defender of the Fatherland Day" },
    md: [5, 7],
    rule: { ru: "7 мая", en: "May 7" },
    about: {
      ru: "День защитника Отечества в Казахстане отмечают 7 мая — в день создания Вооружённых сил страны в 1992 году. Это выходной день.",
      en: "Kazakhstan celebrates Defender of the Fatherland Day on May 7, the day its Armed Forces were founded in 1992. It is a public holiday.",
    },
  },
  {
    slug: "may-9",
    glyph: "🕊️",
    name: { ru: "День Победы", en: "Victory Day" },
    to: { ru: "до Дня Победы", en: "until Victory Day" },
    md: [5, 9],
    rule: { ru: "9 мая", en: "May 9" },
    about: { ru: "День Победы — 9 мая, выходной день в России и Казахстане.", en: "Victory Day is on May 9, a public holiday in Russia and Kazakhstan." },
  },
  {
    slug: "last-bell",
    glyph: "🔔",
    name: { ru: "Последний звонок", en: "Last bell" },
    to: { ru: "до последнего звонка", en: "until the last bell" },
    md: [5, 25],
    rule: { ru: "обычно 25 мая", en: "usually May 25" },
    about: {
      ru: "Последний звонок в российских и казахстанских школах традиционно проводят около 25 мая; точную дату назначает школа, в выходной день праздник переносят.",
      en: "The last-bell school ceremony in Russia and Kazakhstan is traditionally held around May 25; each school sets the exact date.",
    },
  },
  {
    slug: "summer",
    glyph: "☀️",
    name: { ru: "Лето", en: "Summer" },
    to: { ru: "до лета", en: "until summer" },
    md: [6, 1],
    rule: { ru: "1 июня — календарное лето", en: "June 1 — meteorological summer" },
    about: {
      ru: "Календарное лето начинается 1 июня, астрономическое — в день летнего солнцестояния, 20 или 21 июня, когда день самый длинный в году.",
      en: "Meteorological summer starts on June 1; astronomical summer begins at the June solstice on the 20th or 21st, the longest day of the year.",
    },
  },
  {
    slug: "summer-solstice",
    glyph: "🌞",
    name: { ru: "Летнее солнцестояние", en: "Summer solstice" },
    to: { ru: "до летнего солнцестояния", en: "until the summer solstice" },
    season: "june",
    rule: { ru: "20 или 21 июня, точный момент — по расчёту", en: "June 20 or 21, exact instant calculated" },
    about: {
      ru: "Летнее солнцестояние — самый длинный день в Северном полушарии: Солнце поднимается выше всего над горизонтом. После него дни начинают укорачиваться.",
      en: "The June solstice is the longest day in the Northern Hemisphere, when the Sun is highest in the sky. After it the days get shorter.",
    },
  },
  {
    slug: "russia-day",
    glyph: "🎉",
    name: { ru: "День России", en: "Russia Day" },
    to: { ru: "до Дня России", en: "until Russia Day" },
    md: [6, 12],
    rule: { ru: "12 июня", en: "June 12" },
    about: { ru: "День России — 12 июня, выходной день. Если он выпадает на выходной, отдыхают в понедельник.", en: "Russia Day is on June 12, a public holiday; if it falls on a weekend, Monday is a day off." },
  },
  {
    slug: "capital-day",
    glyph: "🏙️",
    name: { ru: "День столицы", en: "Capital Day" },
    to: { ru: "до Дня столицы", en: "until Capital Day" },
    md: [7, 6],
    rule: { ru: "6 июля", en: "July 6" },
    about: {
      ru: "День столицы Казахстана отмечают 6 июля; это государственный праздник и выходной день по всей стране. В этот день в Астане проходят концерты и салют.",
      en: "Kazakhstan's Capital Day is on July 6, a public holiday across the country, with concerts and fireworks in Astana.",
    },
  },
  {
    slug: "september-1",
    glyph: "🎒",
    name: { ru: "1 сентября", en: "September 1" },
    to: { ru: "до 1 сентября", en: "until September 1" },
    md: [9, 1],
    rule: { ru: "1 сентября — День знаний", en: "September 1 — Knowledge Day" },
    about: {
      ru: "1 сентября — начало учебного года в школах России и Казахстана. Если оно выпадает на воскресенье, учёба может начаться со 2 сентября — это решают регионы.",
      en: "September 1 is the start of the school year in Russia and Kazakhstan. If it falls on a Sunday, classes may start on the 2nd.",
    },
  },
  {
    slug: "autumn",
    glyph: "🍂",
    name: { ru: "Осень", en: "Autumn" },
    to: { ru: "до осени", en: "until autumn" },
    md: [9, 1],
    rule: { ru: "1 сентября — календарная осень", en: "September 1 — meteorological autumn" },
    about: {
      ru: "Календарная осень начинается 1 сентября, астрономическая — в день осеннего равноденствия, 22 или 23 сентября.",
      en: "Meteorological autumn starts on September 1; astronomical autumn begins at the September equinox on the 22nd or 23rd.",
    },
  },
  {
    slug: "autumn-equinox",
    glyph: "🌓",
    name: { ru: "Осеннее равноденствие", en: "Autumn equinox" },
    to: { ru: "до осеннего равноденствия", en: "until the autumn equinox" },
    season: "september",
    rule: { ru: "22 или 23 сентября, точный момент — по расчёту", en: "September 22 or 23, exact instant calculated" },
    about: {
      ru: "В осеннее равноденствие Солнце переходит в Южное полушарие неба, и в Северном полушарии начинается астрономическая осень: ночи становятся длиннее дней.",
      en: "At the September equinox the Sun moves into the southern sky and astronomical autumn begins in the Northern Hemisphere: nights become longer than days.",
    },
  },
  {
    slug: "kazakhstan-republic-day",
    glyph: "🏛️",
    name: { ru: "День Республики", en: "Republic Day" },
    to: { ru: "до Дня Республики", en: "until Republic Day" },
    md: [10, 25],
    rule: { ru: "25 октября", en: "October 25" },
    about: {
      ru: "День Республики — 25 октября, годовщина принятия Декларации о государственном суверенитете Казахской ССР в 1990 году. С 2022 года это снова государственный праздник и выходной.",
      en: "Republic Day, October 25, marks the 1990 Declaration of State Sovereignty of the Kazakh SSR. Since 2022 it is again a public holiday.",
    },
  },
  {
    slug: "halloween",
    glyph: "🎃",
    name: { ru: "Хэллоуин", en: "Halloween" },
    to: { ru: "до Хэллоуина", en: "until Halloween" },
    md: [10, 31],
    rule: { ru: "31 октября", en: "October 31" },
    about: { ru: "Хэллоуин отмечают в ночь на 1 ноября, в канун Дня всех святых. Это не выходной день.", en: "Halloween is celebrated on October 31, the eve of All Saints' Day. It is not a public holiday." },
  },
  {
    slug: "thanksgiving",
    glyph: "🦃",
    name: { ru: "День благодарения", en: "Thanksgiving" },
    to: { ru: "до Дня благодарения", en: "until Thanksgiving" },
    dates: (y) => [nthWeekday(y, 11, 4, 4)],
    rule: { ru: "четвёртый четверг ноября (США)", en: "fourth Thursday of November (US)" },
    about: {
      ru: "День благодарения в США отмечают в четвёртый четверг ноября — поэтому дата меняется от 22 до 28 ноября. На следующий день начинается Чёрная пятница.",
      en: "US Thanksgiving is the fourth Thursday of November, so it falls between November 22 and 28. Black Friday follows the next day.",
    },
  },
  {
    slug: "black-friday",
    glyph: "🛍️",
    name: { ru: "Чёрная пятница", en: "Black Friday" },
    to: { ru: "до Чёрной пятницы", en: "until Black Friday" },
    dates: (y) => [addDays(nthWeekday(y, 11, 4, 4), 1)],
    rule: { ru: "пятница после Дня благодарения (США)", en: "the Friday after US Thanksgiving" },
    about: {
      ru: "Чёрная пятница — день распродаж после американского Дня благодарения, то есть пятница после четвёртого четверга ноября. Многие магазины начинают скидки раньше и продлевают их до Киберпонедельника.",
      en: "Black Friday is the sales day after US Thanksgiving — the Friday after the fourth Thursday of November. Many shops start earlier and run deals through Cyber Monday.",
    },
  },
  {
    slug: "winter",
    glyph: "❄️",
    name: { ru: "Зима", en: "Winter" },
    to: { ru: "до зимы", en: "until winter" },
    md: [12, 1],
    rule: { ru: "1 декабря — календарная зима", en: "December 1 — meteorological winter" },
    about: {
      ru: "Календарная зима начинается 1 декабря, астрономическая — в день зимнего солнцестояния, 21 или 22 декабря, самый короткий день года.",
      en: "Meteorological winter starts on December 1; astronomical winter begins at the December solstice on the 21st or 22nd, the shortest day of the year.",
    },
  },
  {
    slug: "winter-solstice",
    glyph: "🌑",
    name: { ru: "Зимнее солнцестояние", en: "Winter solstice" },
    to: { ru: "до зимнего солнцестояния", en: "until the winter solstice" },
    season: "december",
    rule: { ru: "21 или 22 декабря, точный момент — по расчёту", en: "December 21 or 22, exact instant calculated" },
    about: {
      ru: "Зимнее солнцестояние — самый короткий день и самая длинная ночь в Северном полушарии. После него световой день начинает прибавляться.",
      en: "The December solstice brings the shortest day and longest night in the Northern Hemisphere. After it the days start getting longer.",
    },
  },
  {
    slug: "kazakhstan-independence-day",
    glyph: "🌟",
    name: { ru: "День Независимости Казахстана", en: "Kazakhstan Independence Day" },
    to: { ru: "до Дня Независимости Казахстана", en: "until Kazakhstan Independence Day" },
    md: [12, 16],
    rule: { ru: "16 декабря", en: "December 16" },
    about: {
      ru: "День Независимости Казахстана — 16 декабря: в этот день в 1991 году был принят закон о государственной независимости. С 2022 года выходной — только 16 декабря.",
      en: "Kazakhstan's Independence Day is December 16 — the independence law was adopted that day in 1991. Since 2022 only December 16 is a day off.",
    },
  },
  {
    slug: "christmas",
    glyph: "🎁",
    name: { ru: "Католическое Рождество", en: "Christmas" },
    to: { ru: "до католического Рождества", en: "until Christmas" },
    md: [12, 25],
    rule: { ru: "25 декабря", en: "December 25" },
    about: {
      ru: "Католики и протестанты отмечают Рождество 25 декабря. В России и Казахстане это рабочий день; православное Рождество — 7 января.",
      en: "Catholics and Protestants celebrate Christmas on December 25. It is a working day in Russia and Kazakhstan, where Orthodox Christmas is on January 7.",
    },
  },
  {
    slug: "end-of-year",
    glyph: "⏳",
    name: { ru: "Конец года", en: "End of the year" },
    to: { ru: "до конца года", en: "until the end of the year" },
    md: [1, 1],
    endOfDay: true,
    yearProgress: true,
    rule: { ru: "31 декабря, 24:00", en: "December 31, midnight" },
    about: {
      ru: "Счётчик показывает, сколько осталось до конца текущего года — до полуночи с 31 декабря на 1 января, — и какая часть года уже прошла.",
      en: "The counter shows how much of the current year is left — until midnight between December 31 and January 1 — and how much has passed.",
    },
  },
  {
    slug: "weekend",
    glyph: "🛋️",
    name: { ru: "Выходные", en: "Weekend" },
    to: { ru: "до выходных", en: "until the weekend" },
    weekend: true,
    rule: { ru: "суббота, 00:00", en: "Saturday, 00:00" },
    about: {
      ru: "Счётчик идёт до полуночи с пятницы на субботу по вашему времени. Праздники и переносы рабочих дней он не учитывает — сверяйтесь с производственным календарём.",
      en: "The counter runs to midnight between Friday and Saturday in your time zone. It does not account for public holidays or moved working days.",
    },
  },
  {
    slug: "ramadan",
    glyph: "🌙",
    name: { ru: "Рамадан", en: "Ramadan" },
    to: { ru: "до Рамадана", en: "until Ramadan" },
    dates: islamic("ramadan"),
    expected: true,
    rule: { ru: "1 рамадана по календарю Умм аль-Кура", en: "1 Ramadan by the Umm al-Qura calendar" },
    about: {
      ru: "Начало Рамадана определяют по лунному календарю, поэтому каждый год оно сдвигается примерно на 11 дней раньше. Даты здесь — по календарю Умм аль-Кура; духовные управления мусульман объявляют окончательную дату, она может отличаться на день.",
      en: "Ramadan follows the lunar calendar and moves about 11 days earlier each year. Dates here follow the Umm al-Qura calendar; the final date is announced by religious authorities and may differ by a day.",
    },
  },
  {
    slug: "eid-al-fitr",
    glyph: "🌙",
    name: { ru: "Ораза айт", en: "Eid al-Fitr" },
    to: { ru: "до Ораза айта", en: "until Eid al-Fitr" },
    dates: islamic("fitr"),
    expected: true,
    rule: { ru: "1 шавваля — первый день после Рамадана", en: "1 Shawwal — the day after Ramadan" },
    about: {
      ru: "Ораза айт (Ураза-байрам, Ид аль-Фитр) — праздник окончания поста в месяц Рамадан. Даты — по календарю Умм аль-Кура; окончательную дату объявляет Духовное управление мусульман, возможна разница в один день.",
      en: "Eid al-Fitr marks the end of the Ramadan fast. Dates follow the Umm al-Qura calendar; religious authorities announce the final date, which may differ by a day.",
    },
  },
  {
    slug: "kurban-ait",
    glyph: "🕌",
    name: { ru: "Курбан айт", en: "Eid al-Adha" },
    to: { ru: "до Курбан айта", en: "until Eid al-Adha" },
    dates: islamic("adha"),
    expected: true,
    rule: { ru: "10 зу-ль-хиджа", en: "10 Dhu al-Hijjah" },
    about: {
      ru: "Курбан айт (Курбан-байрам, Ид аль-Адха) — праздник жертвоприношения. В Казахстане его первый день — выходной. Даты — по календарю Умм аль-Кура, окончательную объявляет Духовное управление мусульман.",
      en: "Eid al-Adha is the Feast of the Sacrifice; its first day is a public holiday in Kazakhstan. Dates follow the Umm al-Qura calendar; the final date is announced by religious authorities.",
    },
  },
];

