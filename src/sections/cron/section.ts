import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { Block, QA, VariantDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerLink, registerTools, withRelated } from "@/sections/code/kit/related";
import { describe } from "./lib/describe";
import { matchingDays, parseCron, runsPerDay, type CronExpr } from "./lib/engine";
import { toSystemd } from "./lib/systemd";

const HUE = 205;
type L = { ru: string; en: string };

interface V {
  slug: string;
  expr: string;
  name: L;
  h1: L;
  note?: { q: L; a: L };
}

const V_LIST: V[] = [
  { slug: "every-minute", expr: "* * * * *", name: { ru: "каждую минуту", en: "every minute" }, h1: { ru: "Cron каждую минуту", en: "Cron every minute" } },
  { slug: "every-2-minutes", expr: "*/2 * * * *", name: { ru: "каждые 2 минуты", en: "every 2 minutes" }, h1: { ru: "Cron каждые 2 минуты", en: "Cron every 2 minutes" } },
  { slug: "every-5-minutes", expr: "*/5 * * * *", name: { ru: "каждые 5 минут", en: "every 5 minutes" }, h1: { ru: "Cron каждые 5 минут", en: "Cron every 5 minutes" } },
  { slug: "every-10-minutes", expr: "*/10 * * * *", name: { ru: "каждые 10 минут", en: "every 10 minutes" }, h1: { ru: "Cron каждые 10 минут", en: "Cron every 10 minutes" } },
  { slug: "every-15-minutes", expr: "*/15 * * * *", name: { ru: "каждые 15 минут", en: "every 15 minutes" }, h1: { ru: "Cron каждые 15 минут", en: "Cron every 15 minutes" } },
  { slug: "every-20-minutes", expr: "*/20 * * * *", name: { ru: "каждые 20 минут", en: "every 20 minutes" }, h1: { ru: "Cron каждые 20 минут", en: "Cron every 20 minutes" } },
  { slug: "every-30-minutes", expr: "*/30 * * * *", name: { ru: "каждые 30 минут", en: "every 30 minutes" }, h1: { ru: "Cron каждые 30 минут", en: "Cron every 30 minutes" } },
  { slug: "every-hour", expr: "0 * * * *", name: { ru: "каждый час", en: "every hour" }, h1: { ru: "Cron каждый час", en: "Cron every hour" } },
  { slug: "every-2-hours", expr: "0 */2 * * *", name: { ru: "каждые 2 часа", en: "every 2 hours" }, h1: { ru: "Cron каждые 2 часа", en: "Cron every 2 hours" } },
  { slug: "every-3-hours", expr: "0 */3 * * *", name: { ru: "каждые 3 часа", en: "every 3 hours" }, h1: { ru: "Cron каждые 3 часа", en: "Cron every 3 hours" } },
  { slug: "every-4-hours", expr: "0 */4 * * *", name: { ru: "каждые 4 часа", en: "every 4 hours" }, h1: { ru: "Cron каждые 4 часа", en: "Cron every 4 hours" } },
  { slug: "every-6-hours", expr: "0 */6 * * *", name: { ru: "каждые 6 часов", en: "every 6 hours" }, h1: { ru: "Cron каждые 6 часов", en: "Cron every 6 hours" } },
  { slug: "every-8-hours", expr: "0 */8 * * *", name: { ru: "каждые 8 часов", en: "every 8 hours" }, h1: { ru: "Cron каждые 8 часов", en: "Cron every 8 hours" } },
  { slug: "every-12-hours", expr: "0 */12 * * *", name: { ru: "каждые 12 часов", en: "every 12 hours" }, h1: { ru: "Cron каждые 12 часов", en: "Cron every 12 hours" } },
  { slug: "daily-at-midnight", expr: "0 0 * * *", name: { ru: "в полночь", en: "daily at midnight" }, h1: { ru: "Cron каждый день в полночь", en: "Cron daily at midnight" }, note: { q: { ru: "Чем 0 0 * * * отличается от @daily?", en: "How is 0 0 * * * different from @daily?" }, a: { ru: "Ничем: @daily и @midnight — сокращения для 0 0 * * *. Их понимают Vixie cron, cronie и systemd-crontab-generator, но не все планировщики.", en: "It isn't: @daily and @midnight are shortcuts for 0 0 * * *. Vixie cron and cronie understand them, but not every scheduler does." } } },
  { slug: "daily-at-2am", expr: "0 2 * * *", name: { ru: "в 2 часа ночи", en: "daily at 2 am" }, h1: { ru: "Cron каждый день в 2 часа ночи", en: "Cron daily at 2 am" }, note: { q: { ru: "Почему бэкапы часто ставят на 2–3 часа ночи?", en: "Why are backups often scheduled at 2–3 am?" }, a: { ru: "Это время минимальной нагрузки. Но учтите переход на летнее время: в странах с DST время 02:30 в день перехода может не наступить или повториться. В Казахстане и России перехода нет.", en: "Load is lowest then. Mind daylight saving time, though: in countries with DST, 02:30 may not exist or may repeat on the transition day." } } },
  { slug: "daily-at-9am", expr: "0 9 * * *", name: { ru: "в 9 утра", en: "daily at 9 am" }, h1: { ru: "Cron каждый день в 9 утра", en: "Cron daily at 9 am" } },
  { slug: "daily-at-noon", expr: "0 12 * * *", name: { ru: "в полдень", en: "daily at noon" }, h1: { ru: "Cron каждый день в 12:00", en: "Cron daily at noon" } },
  { slug: "daily-at-6pm", expr: "0 18 * * *", name: { ru: "в 18:00", en: "daily at 6 pm" }, h1: { ru: "Cron каждый день в 18:00", en: "Cron daily at 6 pm" } },
  { slug: "twice-a-day", expr: "0 0,12 * * *", name: { ru: "2 раза в день", en: "twice a day" }, h1: { ru: "Cron 2 раза в день", en: "Cron twice a day" } },
  { slug: "weekdays-at-9am", expr: "0 9 * * 1-5", name: { ru: "по будням в 9:00", en: "weekdays at 9 am" }, h1: { ru: "Cron по будням в 9:00", en: "Cron on weekdays at 9 am" } },
  { slug: "business-hours", expr: "0 9-18 * * 1-5", name: { ru: "в рабочее время", en: "business hours" }, h1: { ru: "Cron каждый час в рабочее время", en: "Cron every hour during business hours" } },
  { slug: "every-5-minutes-business-hours", expr: "*/5 9-17 * * 1-5", name: { ru: "каждые 5 минут в рабочее время", en: "every 5 min, business hours" }, h1: { ru: "Cron каждые 5 минут в рабочее время", en: "Cron every 5 minutes during business hours" } },
  { slug: "every-weekday-hourly", expr: "0 * * * 1-5", name: { ru: "каждый час по будням", en: "hourly on weekdays" }, h1: { ru: "Cron каждый час по будням", en: "Cron every hour on weekdays" } },
  { slug: "weekends", expr: "0 10 * * 6,0", name: { ru: "по выходным", en: "weekends" }, h1: { ru: "Cron по выходным", en: "Cron on weekends" } },
  { slug: "every-monday", expr: "0 0 * * 1", name: { ru: "каждый понедельник", en: "every Monday" }, h1: { ru: "Cron каждый понедельник", en: "Cron every Monday" } },
  { slug: "every-friday-at-17", expr: "0 17 * * 5", name: { ru: "по пятницам в 17:00", en: "Fridays at 5 pm" }, h1: { ru: "Cron каждую пятницу в 17:00", en: "Cron every Friday at 5 pm" } },
  { slug: "every-sunday", expr: "0 0 * * 0", name: { ru: "каждое воскресенье", en: "every Sunday" }, h1: { ru: "Cron каждое воскресенье", en: "Cron every Sunday" }, note: { q: { ru: "Воскресенье — это 0 или 7?", en: "Is Sunday 0 or 7?" }, a: { ru: "В Unix cron и то и другое: 0 и 7 означают воскресенье. В Quartz дни нумеруются иначе — 1 = воскресенье, 7 = суббота, поэтому надёжнее писать SUN.", en: "In Unix cron both: 0 and 7 mean Sunday. Quartz numbers days differently — 1 = Sunday, 7 = Saturday — so SUN is safer." } } },
  { slug: "first-day-of-month", expr: "0 0 1 * *", name: { ru: "1-го числа", en: "1st of the month" }, h1: { ru: "Cron первого числа каждого месяца", en: "Cron on the first day of every month" } },
  { slug: "15th-of-month", expr: "0 0 15 * *", name: { ru: "15-го числа", en: "15th of the month" }, h1: { ru: "Cron 15-го числа каждого месяца", en: "Cron on the 15th of every month" } },
  { slug: "twice-a-month", expr: "0 0 1,15 * *", name: { ru: "1-го и 15-го", en: "1st and 15th" }, h1: { ru: "Cron 2 раза в месяц", en: "Cron twice a month" } },
  {
    slug: "last-day-of-month",
    expr: "0 0 0 L * ?",
    name: { ru: "последний день месяца", en: "last day of month" },
    h1: { ru: "Cron в последний день месяца", en: "Cron on the last day of the month" },
    note: { q: { ru: "Как сделать «последний день месяца» в обычном crontab?", en: "How do I do “last day of month” in plain crontab?" }, a: { ru: "L есть только в Quartz и Spring. В crontab запускайте задачу 28–31 числа и проверяйте, что завтра первое: 0 0 28-31 * * [ \"$(date -d tomorrow +\\%d)\" = \"01\" ] && команда (GNU date).", en: "L exists only in Quartz and Spring. In crontab run on days 28–31 and check that tomorrow is the 1st: 0 0 28-31 * * [ \"$(date -d tomorrow +\\%d)\" = \"01\" ] && command (GNU date)." } },
  },
  { slug: "last-friday-of-month", expr: "0 0 18 ? * 6L", name: { ru: "последняя пятница месяца", en: "last Friday of month" }, h1: { ru: "Cron в последнюю пятницу месяца", en: "Cron on the last Friday of the month" } },
  { slug: "first-monday-of-month", expr: "0 0 9 ? * 2#1", name: { ru: "первый понедельник месяца", en: "first Monday of month" }, h1: { ru: "Cron в первый понедельник месяца", en: "Cron on the first Monday of the month" } },
  { slug: "quarterly", expr: "0 0 1 1,4,7,10 *", name: { ru: "раз в квартал", en: "quarterly" }, h1: { ru: "Cron раз в квартал", en: "Cron quarterly" } },
  { slug: "every-6-months", expr: "0 0 1 1,7 *", name: { ru: "раз в полгода", en: "every 6 months" }, h1: { ru: "Cron раз в полгода", en: "Cron every 6 months" } },
  { slug: "yearly", expr: "0 0 1 1 *", name: { ru: "раз в год", en: "yearly" }, h1: { ru: "Cron раз в год", en: "Cron once a year" } },
  {
    slug: "every-30-seconds",
    expr: "*/30 * * * * *",
    name: { ru: "каждые 30 секунд", en: "every 30 seconds" },
    h1: { ru: "Cron каждые 30 секунд", en: "Cron every 30 seconds" },
    note: { q: { ru: "Можно ли запускать crontab каждые 30 секунд?", en: "Can crontab run every 30 seconds?" }, a: { ru: "Классический crontab работает с точностью до минуты. Обходной путь — две строки: * * * * * команда и * * * * * sleep 30; команда. Поле секунд есть в Quartz, Spring, node-cron и systemd-таймерах.", en: "Classic crontab has one-minute resolution. The workaround is two lines: * * * * * command and * * * * * sleep 30; command. Seconds are supported by Quartz, Spring, node-cron and systemd timers." } },
  },
  { slug: "every-10-seconds", expr: "*/10 * * * * *", name: { ru: "каждые 10 секунд", en: "every 10 seconds" }, h1: { ru: "Cron каждые 10 секунд", en: "Cron every 10 seconds" } },
  {
    slug: "reboot",
    expr: "@reboot",
    name: { ru: "при загрузке (@reboot)", en: "@reboot" },
    h1: { ru: "Cron @reboot — запуск при загрузке", en: "Cron @reboot — run at startup" },
    note: { q: { ru: "Когда срабатывает @reboot?", en: "When does @reboot fire?" }, a: { ru: "Один раз при старте демона cron — обычно при загрузке системы. Если перезапустить сам cron, в некоторых системах задача выполнится снова. Сеть в этот момент может быть ещё не поднята, поэтому часто добавляют sleep 30.", en: "Once when the cron daemon starts — usually at boot. Restarting cron itself may run it again on some systems. The network may not be up yet, so people often add sleep 30." } },
  },
];

const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** First candidate that fits a meta description (≤ 160 characters). */
const fit = (candidates: string[]) => candidates.find((c) => c.length <= 160) ?? candidates[candidates.length - 1];

/** Quartz / Spring 6-field equivalents for a Unix expression (null if not expressible). */
function equivalents(e: CronExpr): { spring: string | null; quartz: string | null } {
  if (e.reboot) return { spring: null, quartz: null };
  if (e.dialect !== "unix") {
    const parts = e.source.split(" ");
    return { spring: e.dialect === "quartz" ? parts.slice(0, 6).join(" ").replace(/\?/g, "*") : e.source, quartz: e.dialect === "quartz" ? e.source : null };
  }
  const src = e.macro ? parseCron(e.source.startsWith("@") ? ({ "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *" } as Record<string, string>)[e.macro] ?? e.source : e.source) : e;
  const [mi, h, dom, mon, dow] = src.source.split(" ");
  const spring = `0 ${mi} ${h} ${dom} ${mon} ${dow}`;
  const domR = dom !== "*";
  const dowR = dow !== "*";
  if (domR && dowR) return { spring, quartz: null };
  const v = src.fields.dow.values;
  const dowQ = !dowR ? "?" : v.length > 2 && v.every((x, i) => i === 0 || x === v[i - 1] + 1) ? `${DOW_NAMES[v[0]]}-${DOW_NAMES[v[v.length - 1]]}` : v.map((d) => DOW_NAMES[d]).join(",");
  return { spring, quartz: `0 ${mi} ${h} ${dowR ? "?" : dom} ${mon} ${dowQ}` };
}

function counts(e: CronExpr, locale: Locale): { perDay: number; days: number; text: string } {
  const perDay = runsPerDay(e);
  const days = matchingDays(e, 2027);
  const ru = locale === "ru";
  const fmt = (n: number) => formatNumber(locale, n);
  if (days === 365) return { perDay, days, text: ru ? `${fmt(perDay)} ${plural("ru", perDay, ["запуск", "запуска", "запусков"])} в сутки` : `${fmt(perDay)} run${perDay === 1 ? "" : "s"} a day` };
  const total = perDay * days;
  return { perDay, days, text: ru ? `${fmt(total)} ${plural("ru", total, ["запуск", "запуска", "запусков"])} в 2027 году (${fmt(days)} ${plural("ru", days, ["день", "дня", "дней"])})` : `${fmt(total)} run${total === 1 ? "" : "s"} in 2027 (${fmt(days)} day${days === 1 ? "" : "s"})` };
}

function variant(v: V): VariantDef {
  const e = parseCron(v.expr);
  const dRu = describe(e, "ru");
  const dEn = describe(e, "en");
  const cRu = e.reboot ? null : counts(e, "ru");
  const cEn = e.reboot ? null : counts(e, "en");
  const eq = equivalents(e);
  const sd = toSystemd(e);
  const kind = e.dialect === "quartz" ? { ru: "Quartz / Spring", en: "Quartz / Spring" } : e.dialect === "seconds" ? { ru: "6 полей с секундами", en: "6 fields with seconds" } : { ru: "crontab", en: "crontab" };
  const faq = (locale: Locale): QA[] => {
    const ru = locale === "ru";
    const list: QA[] = [
      {
        q: ru ? `Как записать «${v.name.ru}» в cron?` : `How do I write “${v.name.en}” in cron?`,
        a: ru ? `Выражение ${v.expr} — ${dRu.charAt(0).toLowerCase()}${dRu.slice(1)}.${e.dialect === "unix" ? ` В crontab -e добавьте строку: ${v.expr} /path/to/script.sh` : ""}` : `${v.expr} — ${dEn.charAt(0).toLowerCase()}${dEn.slice(1)}.${e.dialect === "unix" ? ` In crontab -e add the line: ${v.expr} /path/to/script.sh` : ""}`,
      },
    ];
    if (cRu && cEn) list.push({ q: ru ? "Сколько раз сработает задача?" : "How many times will the job run?", a: ru ? `${cRu.text.charAt(0).toUpperCase()}${cRu.text.slice(1)}.` : `${cEn.text.charAt(0).toUpperCase()}${cEn.text.slice(1)}.` });
    if (v.note) list.push({ q: v.note.q[locale], a: v.note.a[locale] });
    else if (e.dialect === "unix")
      list.push({
        q: ru ? "В каком часовом поясе сработает задача?" : "Which time zone does it use?",
        a: ru ? "Cron использует часовой пояс сервера (или переменную CRON_TZ в cronie). GitHub Actions всегда работают по UTC — для Алматы это на 5 часов раньше, для Москвы — на 3. Ближайшие запуски выше можно посмотреть в нужном поясе." : "Cron uses the server's time zone (or CRON_TZ in cronie). GitHub Actions schedules always run in UTC. Check the next runs above in any zone.",
      });
    return list;
  };
  return {
    slug: v.slug,
    name: v.name,
    glyph: undefined,
    h1: v.h1,
    title: { ru: `${v.h1.ru} — ${v.expr}`, en: `${v.h1.en} — ${v.expr}` },
    description: {
      ru: fit([
        `Cron-выражение «${v.name.ru}»: ${v.expr}. ${dRu}${cRu ? `, ${cRu.text}` : ""}. Расшифровка полей и ближайшие запуски.`,
        `Cron-выражение «${v.name.ru}»: ${v.expr}. ${dRu}${cRu ? `, ${cRu.text}` : ""}. Ближайшие запуски онлайн.`,
        `Cron «${v.name.ru}»: ${v.expr}. ${dRu}. Расшифровка полей и ближайшие запуски.`,
        `Cron «${v.name.ru}»: ${v.expr}. ${dRu}.`,
      ]),
      en: fit([
        `Cron expression for ${v.name.en}: ${v.expr}. ${dEn}${cEn ? `, ${cEn.text}` : ""}. Field breakdown and next run times.`,
        `Cron expression for ${v.name.en}: ${v.expr}. ${dEn}${cEn ? `, ${cEn.text}` : ""}. Next run times online.`,
        `Cron for ${v.name.en}: ${v.expr}. ${dEn}. Field breakdown and next run times.`,
        `Cron for ${v.name.en}: ${v.expr}. ${dEn}.`,
      ]),
    },
    lead: { ru: `${v.expr} — ${dRu.charAt(0).toLowerCase()}${dRu.slice(1)}.`, en: `${v.expr} — ${dEn.charAt(0).toLowerCase()}${dEn.slice(1)}.` },
    props: { expr: v.expr },
    keywords: { ru: [`cron ${v.name.ru}`, v.expr, `crontab ${v.name.ru}`], en: [`cron ${v.name.en}`, v.expr, `crontab ${v.name.en}`] },
    faq: { ru: faq("ru"), en: faq("en") },
    blocks: (locale) => {
      const ru = locale === "ru";
      const rows: [string, string][] = [
        [ru ? "Выражение" : "Expression", v.expr],
        [ru ? "Формат" : "Format", kind[locale]],
        [ru ? "Расшифровка" : "Meaning", ru ? dRu : dEn],
      ];
      const c = ru ? cRu : cEn;
      if (c) rows.push([ru ? "Запусков" : "Runs", c.text]);
      if (eq.spring && eq.spring !== v.expr) rows.push([ru ? "С секундами (Spring, node-cron)" : "With seconds (Spring, node-cron)", eq.spring]);
      if (eq.quartz && eq.quartz !== v.expr) rows.push(["Quartz", eq.quartz]);
      if (sd) rows.push(["systemd OnCalendar", sd]);
      const blocks: Block[] = [{ type: "facts", title: ru ? "Коротко" : "At a glance", rows }];
      if (e.dialect === "unix" && !e.reboot)
        blocks.push({
          type: "list",
          title: ru ? "Как использовать" : "How to use it",
          items: [`crontab: ${v.expr} /usr/local/bin/job.sh >> /var/log/job.log 2>&1`, `GitHub Actions: on: schedule: - cron: "${v.expr}"${ru ? " (UTC)" : " (UTC)"}`, `Kubernetes CronJob: spec.schedule: "${v.expr}"`],
        });
      if (e.reboot) blocks.push({ type: "list", title: ru ? "Как использовать" : "How to use it", items: ["crontab: @reboot sleep 30 && /usr/local/bin/start.sh", ru ? "systemd: юнит с WantedBy=multi-user.target надёжнее для служб" : "systemd: a unit with WantedBy=multi-user.target is more robust for services"] });
      return blocks;
    },
  };
}

const variants = V_LIST.map(variant);

export const cronSection = withRelated(
  defineToolSection({
    id: "cron",
    name: { ru: "Cron", en: "Cron" },
    description: { ru: "Генератор и расшифровка cron-выражений с ближайшими запусками", en: "Build and explain cron expressions with next run times" },
    icon: "Clock3",
    hue: HUE,
    category: "dev",
    order: 4,
    tools: [
      {
        slug: "",
        component: "cron/tool",
        icon: "Clock3",
        popular: true,
        wide: false,
        props: { expr: "*/5 * * * *" },
        name: { ru: "Генератор cron", en: "Cron generator" },
        h1: { ru: "Cron онлайн: генератор и расшифровка", en: "Cron expression generator and explainer" },
        title: { ru: "Cron онлайн — генератор и расшифровка cron-выражений", en: "Cron expression generator and explainer online" },
        description: {
          ru: "Генератор cron онлайн: расшифровка выражения на русском, ближайшие запуски в вашем часовом поясе, конструктор полей, 5 и 6 полей, Quartz с L, W и #.",
          en: "Cron expression generator: plain-English explanation, next run times in your time zone, a field builder, 5- and 6-field formats and Quartz L, W and #.",
        },
        lead: { ru: "Введите cron-выражение — увидите, что оно значит, и ближайшие запуски в вашем часовом поясе.", en: "Type a cron expression to see what it means and when it runs next in your time zone." },
        keywords: { ru: ["cron", "crontab", "генератор cron", "cron выражение", "расписание cron"], en: ["cron", "crontab", "cron generator", "cron expression", "crontab guru"] },
        howTo: {
          ru: ["Введите выражение, например */15 9-18 * * 1-5, или выберите готовое расписание ниже.", "Прочитайте расшифровку и проверьте ближайшие запуски — в своём часовом поясе или в UTC.", "Соберите выражение в конструкторе: для каждого поля выберите «каждые N», конкретные значения или диапазон.", "Скопируйте выражение в crontab -e, GitHub Actions или конфигурацию Kubernetes."],
          en: ["Type an expression such as */15 9-18 * * 1-5, or pick a ready schedule below.", "Read the explanation and check the next runs in your zone or in UTC.", "Build an expression in the builder: choose every N, specific values or a range per field.", "Copy it into crontab -e, GitHub Actions or a Kubernetes CronJob."],
        },
        faq: {
          ru: [
            { q: "Какой порядок полей в cron?", a: "Минута (0–59), час (0–23), день месяца (1–31), месяц (1–12 или JAN–DEC), день недели (0–7 или SUN–SAT, 0 и 7 — воскресенье). В формате с секундами первым идёт поле секунд, в Quartz возможен седьмой — год." },
            { q: "Как работают одновременно день месяца и день недели?", a: "Если оба поля заданы, задача запускается, когда совпадает ЛЮБОЕ из них: 0 0 13 * 5 — 13-го числа и каждую пятницу. Если одно из полей начинается со *, учитываются оба. Это правило Vixie cron и cronie." },
            { q: "Что значат ? L W #?", a: "Это расширения Quartz: ? — «не задано», L — последний день месяца (или последняя пятница — 6L), W — ближайший будний день, # — n-й день недели месяца (2#1 — первый понедельник)." },
            { q: "Что происходит при переходе на летнее время?", a: "Здесь время, которого нет из-за перехода, сдвигается на момент сразу после него, а повторяющийся час выполняется один раз — так ведёт себя cronie для задач с фиксированным временем. В Казахстане и России перехода на летнее время нет." },
          ],
          en: [
            { q: "What is the field order?", a: "Minute (0–59), hour (0–23), day of month (1–31), month (1–12 or JAN–DEC), day of week (0–7 or SUN–SAT; 0 and 7 are Sunday). The seconds format adds seconds first; Quartz may add a year last." },
            { q: "How do day of month and day of week combine?", a: "If both are set, the job runs when EITHER matches: 0 0 13 * 5 runs on the 13th and on every Friday. If one starts with *, both must match. That's the Vixie cron and cronie rule." },
            { q: "What do ? L W # mean?", a: "They're Quartz extensions: ? means no value, L the last day of the month (or the last Friday — 6L), W the nearest weekday, # the nth weekday of the month (2#1 is the first Monday)." },
            { q: "What happens at daylight saving time changes?", a: "Here a time skipped by the change is moved to the moment right after it, and a repeated hour runs once — how cronie treats fixed-time jobs." },
          ],
        },
        about: {
          ru: [
            "Расшифровка и расчёт выполняются прямо в браузере. Ближайшие запуски вычисляются по полям выражения — перебирая месяцы, дни, часы и минуты, — поэтому даже невозможные расписания вроде 30 февраля не подвешивают страницу, а честно сообщают, что запусков нет.",
            "Поддерживаются классический crontab (5 полей), формат с секундами (Spring, node-cron), Quartz с ?, L, W и #, имена месяцев и дней, шаги (*/5, 1-10/2), списки и макросы @daily, @weekly, @reboot.",
          ],
          en: [
            "Parsing and scheduling run in your browser. Next runs are computed field by field — months, days, hours, minutes — so even impossible schedules such as 30 February don't hang the page; they honestly report no runs.",
            "Supported: classic crontab (5 fields), the seconds format (Spring, node-cron), Quartz with ?, L, W and #, month and day names, steps (*/5, 1-10/2), lists and macros such as @daily, @weekly and @reboot.",
          ],
        },
        variants: { title: { ru: "Готовые расписания", en: "Common schedules" }, list: () => variants },
      },
    ],
  }),
  (segs) => (segs.length > 1 ? ["cron"] : []),
);

registerTools("cron", HUE, [{ slug: "", component: "cron/tool", icon: "Clock3", name: { ru: "Cron онлайн", en: "Cron generator" }, h1: { ru: "Cron онлайн", en: "Cron generator" }, title: { ru: "Cron", en: "Cron" }, description: { ru: "Генератор и расшифровка cron-выражений", en: "Cron expression generator and explainer" } }]);
for (const v of V_LIST) registerLink(`cron/${v.slug}`, { label: v.h1, icon: "Clock3", hue: HUE });
