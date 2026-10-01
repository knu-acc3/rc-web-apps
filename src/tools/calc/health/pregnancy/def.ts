import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { pregnancyMonth, trimester } from "../lib/cycle";
import { WEEKS, type WeekInfo } from "./weeks";

const num = (locale: Locale, v: number, d = 1) => formatNumber(locale, v, { maximumFractionDigits: d });
const len = (locale: Locale, cm: number) => (cm < 1 ? `${num(locale, cm * 10, 0)} ${locale === "ru" ? "мм" : "mm"}` : `${num(locale, cm, cm < 10 ? 1 : 0)} ${locale === "ru" ? "см" : "cm"}`);
const wt = (locale: Locale, g: number) => (g >= 1000 ? `${num(locale, g / 1000, 1)} ${locale === "ru" ? "кг" : "kg"}` : `${num(locale, g, 0)} ${locale === "ru" ? "г" : "g"}`);
const TRI_RU = ["", "первый", "второй", "третий"];
const TRI_EN = ["", "first", "second", "third"];

function sizeText(locale: Locale, w: WeekInfo): string {
  return `${len(locale, w.length)}${w.weight ? (locale === "ru" ? ` и ${wt(locale, w.weight)}` : ` and ${wt(locale, w.weight)}`) : ""}`;
}

function weekBlocks(w: WeekInfo, locale: Locale): Block[] {
  const ru = locale === "ru";
  const tri = trimester(w.week * 7);
  const month = pregnancyMonth(w.week);
  const nearby = WEEKS.filter((x) => Math.abs(x.week - w.week) <= 2);
  return [
    {
      type: "facts",
      title: ru ? `${w.week}-я неделя в цифрах` : `Week ${w.week} at a glance`,
      rows: ru
        ? [
            ["Триместр", `${tri}-й`],
            ["Месяц беременности", `${month}-й (${Math.ceil(w.week / 4)}-й акушерский)`],
            ["Длина плода", `≈ ${len(locale, w.length)}${w.week >= 20 ? " (от макушки до пяток)" : w.week >= 7 ? " (от темени до копчика)" : ""}`],
            ["Вес плода", w.weight ? `≈ ${wt(locale, w.weight)}` : "меньше 1 г"],
            ["До предполагаемой даты родов", w.week < 40 ? `${40 - w.week} ${plural("ru", 40 - w.week, ["неделя", "недели", "недель"])}` : w.week === 40 ? "эта неделя" : "срок прошёл"],
          ]
        : [
            ["Trimester", TRI_EN[tri]],
            ["Month of pregnancy", String(month)],
            ["Baby's length", `≈ ${len(locale, w.length)}${w.week >= 20 ? " (head to heel)" : w.week >= 7 ? " (crown to rump)" : ""}`],
            ["Baby's weight", w.weight ? `≈ ${wt(locale, w.weight)}` : "under 1 g"],
            ["To the due date", w.week < 40 ? `${40 - w.week} ${40 - w.week === 1 ? "week" : "weeks"}` : w.week === 40 ? "this week" : "passed"],
          ],
    },
    { type: "list", title: ru ? "Что происходит на этой неделе" : "What happens this week", items: w[locale] },
    {
      type: "table",
      title: ru ? "Размер плода по неделям" : "Baby size by week",
      head: ru ? ["Неделя", "Длина", "Вес"] : ["Week", "Length", "Weight"],
      rows: nearby.map((x) => [ru ? `${x.week}-я` : String(x.week), `≈ ${len(locale, x.length)}`, x.weight ? `≈ ${wt(locale, x.weight)}` : "—"]),
    },
  ];
}

function weekFaq(w: WeekInfo, locale: Locale): QA[] {
  const tri = trimester(w.week * 7);
  const month = pregnancyMonth(w.week);
  if (locale === "ru")
    return [
      { q: `Какой размер плода на ${w.week}-й неделе беременности?`, a: `В среднем около ${sizeText(locale, w)}. Размеры у разных детей заметно отличаются — точные данные показывает УЗИ.` },
      { q: `${w.week}-я неделя — это какой месяц и триместр?`, a: `Это ${TRI_RU[tri]} триместр и примерно ${month}-й календарный месяц беременности (${Math.ceil(w.week / 4)}-й акушерский месяц по 4 недели).` },
      { q: `Как считается ${w.week}-я неделя?`, a: "Акушерский срок отсчитывают от первого дня последних месячных, поэтому он примерно на 2 недели больше срока от зачатия. Рассчитать свой срок и дату родов можно в калькуляторе выше." },
    ];
  return [
    { q: `How big is the baby at ${w.week} weeks?`, a: `On average about ${sizeText(locale, w)}. Babies vary considerably — an ultrasound gives exact measurements.` },
    { q: `What month and trimester is week ${w.week}?`, a: `It is the ${TRI_EN[tri]} trimester and roughly month ${month} of pregnancy.` },
    { q: `How is week ${w.week} counted?`, a: "Pregnancy weeks are counted from the first day of the last period, about 2 weeks more than from conception. Work out your own dates with the calculator above." },
  ];
}

function variants(): VariantDef[] {
  return WEEKS.map((w) => {
    const tri = trimester(w.week * 7);
    const month = pregnancyMonth(w.week);
    const firstRu = w.ru[0].replace(/\.$/, "");
    const firstEn = w.en[0].replace(/\.$/, "");
    return {
      slug: `week-${w.week}`,
      name: { ru: `${w.week} неделя`, en: `Week ${w.week}` },
      title: { ru: `${w.week} неделя беременности — размер плода и развитие`, en: `${w.week} weeks pregnant — baby size and development` },
      h1: { ru: `${w.week} неделя беременности`, en: `${w.week} weeks pregnant` },
      description: {
        ru: `${w.week}-я неделя беременности: ${tri}-й триместр, ${month}-й месяц. Размер плода ≈ ${sizeText("ru", w)}. Что происходит на этой неделе и что обычно проверяют.`,
        en: `Week ${w.week} of pregnancy: ${TRI_EN[tri]} trimester, month ${month}. The baby is about ${sizeText("en", w)}. What happens this week and what is usually checked.`,
      },
      lead: { ru: `${firstRu}. Плод ≈ ${sizeText("ru", w)}.`, en: `${firstEn}. The baby is about ${sizeText("en", w)}.` },
      keywords: { ru: [`${w.week} неделя беременности`, `${w.week} недель беременности`], en: [`${w.week} weeks pregnant`, `week ${w.week} pregnancy`] },
      props: { week: w.week },
      blocks: (locale) => weekBlocks(w, locale),
      faq: { ru: weekFaq(w, "ru"), en: weekFaq(w, "en") },
    };
  });
}

function sizesTable(locale: Locale): Block {
  const ru = locale === "ru";
  return {
    type: "table",
    title: ru ? "Размер плода по неделям беременности" : "Baby size week by week",
    head: ru ? ["Неделя", "Триместр", "Длина", "Вес"] : ["Week", "Trimester", "Length", "Weight"],
    rows: WEEKS.filter((w) => w.week % 2 === 0 || w.week === 13 || w.week === 27).map((w) => [String(w.week), String(trimester(w.week * 7)), `≈ ${len(locale, w.length)}`, w.weight ? `≈ ${wt(locale, w.weight)}` : "—"]),
  };
}

export const pregnancyTool: ToolDef = {
  slug: "pregnancy-calculator",
  component: "health/pregnancy",
  icon: "Baby",
  popular: true,
  name: { ru: "Калькулятор беременности", en: "Pregnancy calculator" },
  title: { ru: "Калькулятор беременности — срок и дата родов по неделям", en: "Pregnancy calculator — due date and weeks pregnant" },
  h1: { ru: "Калькулятор срока беременности и даты родов", en: "Pregnancy due date calculator" },
  description: {
    ru: "Предполагаемая дата родов и срок беременности по месячным с учётом длины цикла, по зачатию, после ЭКО (перенос на 3-й или 5-й день) или по УЗИ. Триместры и ключевые даты.",
    en: "Estimated due date and how many weeks pregnant you are — from your last period with cycle length, conception, IVF (day-3 or day-5 transfer) or an ultrasound.",
  },
  lead: {
    ru: "Первый день месячных 1 января 2026 года при цикле 28 дней — дата родов 8 октября 2026; при цикле 35 дней — 15 октября.",
    en: "With a last period starting on 1 January 2026 and a 28-day cycle, the due date is 8 October 2026; with a 35-day cycle, 15 October.",
  },
  keywords: {
    ru: ["калькулятор беременности", "срок беременности", "дата родов", "ПДР", "акушерский срок", "правило Негеле", "ЭКО дата родов"],
    en: ["pregnancy calculator", "due date calculator", "how many weeks pregnant", "naegele rule", "ivf due date"],
  },
  props: {},
  howTo: {
    ru: [
      "Выберите способ расчёта: по месячным, зачатию, дате переноса при ЭКО или по УЗИ.",
      "Введите дату и, для расчёта по месячным, длину цикла — калькулятор учтёт её и в дате родов, и в текущем сроке.",
      "Смотрите предполагаемую дату родов, текущий срок, триместр и ключевые даты.",
      "Ниже — что происходит с малышом на вашей неделе и ссылка на подробную страницу.",
    ],
    en: [
      "Choose the method: last period, conception, IVF transfer date or ultrasound.",
      "Enter the date and, for the period method, your cycle length — it is applied to both the due date and your current age.",
      "See the estimated due date, how far along you are, the trimester and key dates.",
      "Below is what is happening in your week, with a link to the detailed page.",
    ],
  },
  about: {
    ru: [
      "Классический расчёт — правило Негеле: к первому дню последних месячных прибавляют 280 дней (40 недель). Оно предполагает цикл 28 дней с овуляцией на 14-й день; при более длинном или коротком цикле дата родов и срок сдвигаются на разницу — калькулятор делает поправку сразу для обоих значений.",
      "После ЭКО срок известен точнее: к дате переноса 5-дневного эмбриона прибавляют 261 день, 3-дневного — 263. Если есть УЗИ первого триместра, расчёт по нему обычно считается самым надёжным.",
      "Даже при точном расчёте лишь около 4–5 % детей рождаются в предполагаемую дату. Роды с 37 до 42 недель считаются своевременными.",
    ],
    en: [
      "The classic method is Naegele's rule: add 280 days (40 weeks) to the first day of your last period. It assumes a 28-day cycle with ovulation on day 14; with a longer or shorter cycle both the due date and your current age shift by the difference, and the calculator corrects both.",
      "After IVF the dates are more precise: add 261 days to a day-5 transfer or 263 days to a day-3 transfer. A first-trimester ultrasound is usually considered the most reliable dating method.",
      "Even with exact dating only about 4–5% of babies are born on the due date. Birth between 37 and 42 weeks is considered on time.",
    ],
  },
  faq: {
    ru: [
      { q: "Как рассчитать дату родов?", a: "Прибавьте 280 дней к первому дню последних месячных, а при цикле длиннее или короче 28 дней — ещё разницу. Например, месячные 1 января и цикл 35 дней: 1 января + 287 дней = 15 октября." },
      { q: "Как считается срок беременности — от зачатия или от месячных?", a: "Врачи считают акушерский срок от первого дня последних месячных. Он примерно на 2 недели больше, чем срок от зачатия." },
      { q: "Как рассчитать дату родов после ЭКО?", a: "К дате переноса 5-дневного эмбриона прибавьте 261 день, 3-дневного — 263 дня. Выберите соответствующий способ в калькуляторе." },
      { q: "Что делать, если дата по УЗИ отличается?", a: "Если срок по УЗИ первого триместра расходится с расчётом по месячным, обычно ориентируются на УЗИ. Выберите способ «По данным УЗИ» и введите срок из заключения." },
    ],
    en: [
      { q: "How is the due date calculated?", a: "Add 280 days to the first day of your last period, plus the difference if your cycle is longer or shorter than 28 days. For example, a period on 1 January with a 35-day cycle: 1 January + 287 days = 15 October." },
      { q: "Is pregnancy counted from conception or from the period?", a: "Doctors count gestational age from the first day of the last period, about 2 weeks more than from conception." },
      { q: "How do I calculate the due date after IVF?", a: "Add 261 days to the date of a day-5 embryo transfer or 263 days to a day-3 transfer. Choose that method in the calculator." },
      { q: "What if the ultrasound date is different?", a: "If a first-trimester ultrasound disagrees with the period-based date, doctors usually go by the ultrasound. Choose 'Ultrasound dating' and enter the age from the report." },
    ],
  },
  related: ["ovulation-calculator", "calorie-calculator", "water-intake-calculator", "sleep-calculator"],
  blocks: (locale) => [sizesTable(locale)],
  variants: { title: { ru: "Беременность по неделям", en: "Pregnancy week by week" }, list: variants, limit: 39 },
};
