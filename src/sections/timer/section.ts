import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, VariantDef } from "@/registry/types";
import { timerSpecs, usesOf, type TimerVariantSpec } from "./data/durations";
import { durationText } from "./lib/format";

/* ───────────── duration wording ───────────── */

const ruPl = (n: number, f: [string, string, string]) => `${n} ${plural("ru", n, f)}`;

/** «5 минут», «90 секунд», «1 час 30 минут»; acc = accusative for «таймер на …». */
function label(x: TimerVariantSpec, locale: Locale, acc = false): string {
  if (x.style === "sec") return locale === "ru" ? ruPl(x.sec, [acc ? "секунду" : "секунда", "секунды", "секунд"]) : `${x.sec} ${x.sec === 1 ? "second" : "seconds"}`;
  if (x.style === "min") {
    const m = Math.floor(x.sec / 60);
    const s = x.sec % 60;
    if (locale === "ru") return [ruPl(m, [acc ? "минуту" : "минута", "минуты", "минут"]), s ? ruPl(s, [acc ? "секунду" : "секунда", "секунды", "секунд"]) : ""].filter(Boolean).join(" ");
    return [`${m} ${m === 1 ? "minute" : "minutes"}`, s ? `${s} seconds` : ""].filter(Boolean).join(" ");
  }
  return durationText(x.sec, locale, acc);
}

/** English adjective form: "5 minute", "1 hour 30 minute", "90 second". */
function enAdj(x: TimerVariantSpec): string {
  return label(x, "en").replace(/(\d+) (second|minute|hour)s?/g, "$1 $2");
}

const n = (locale: Locale, v: number, digits = 3) => formatNumber(locale, v, { maximumFractionDigits: digits });
const p2 = (v: number) => String(v).padStart(2, "0");

/** If started at 12:00 — when does it ring? (wall-clock arithmetic, a stable fact) */
function endsAt(sec: number, locale: Locale): string {
  const total = 12 * 3600 + sec;
  const days = Math.floor(total / 86400);
  const r = total % 86400;
  const t = `${p2(Math.floor(r / 3600))}:${p2(Math.floor((r % 3600) / 60))}${r % 60 ? `:${p2(r % 60)}` : ""}`;
  if (!days) return t;
  return locale === "ru" ? `${t} следующего дня` : `${t} the next day`;
}

function timerVariant(x: TimerVariantSpec, all: TimerVariantSpec[]): VariantDef {
  const ruAcc = label(x, "ru", true);
  const ruNom = label(x, "ru");
  const en = label(x, "en");
  const adj = enAdj(x);
  const min = x.sec / 60;
  const hours = x.sec / 3600;
  const sorted = [...all].sort((a, b) => a.sec - b.sec || a.slug.localeCompare(b.slug));
  const pos = sorted.findIndex((v) => v.slug === x.slug);
  const near = sorted.slice(Math.max(0, pos - 5), pos + 6).filter((v) => v.slug !== x.slug);

  const secWord = (l: Locale) => (l === "ru" ? ruPl(x.sec, ["секунда", "секунды", "секунд"]) : `${formatNumber("en", x.sec)} seconds`);

  const blocks = (locale: Locale): Block[] => {
    const ru = locale === "ru";
    const rows: [string, string][] = [
      [ru ? "Длительность" : "Duration", ru ? ruNom : en],
      [ru ? "В секундах" : "In seconds", n(locale, x.sec)],
    ];
    if (x.sec >= 60) rows.push([ru ? "В минутах" : "In minutes", n(locale, min, 2)]);
    if (x.sec >= 600) rows.push([ru ? "В часах" : "In hours", n(locale, hours, 3)]);
    rows.push([ru ? "Если запустить в 12:00" : "If started at 12:00", ru ? `сигнал в ${endsAt(x.sec, locale)}` : `rings at ${endsAt(x.sec, locale)}`]);
    return [
      { type: "facts", title: ru ? "Коротко" : "Quick facts", rows },
      { type: "list", title: ru ? `Для чего ставят таймер на ${ruAcc}` : `What a ${adj} timer is used for`, items: usesOf(x.sec, locale) },
      {
        type: "links",
        title: ru ? "Соседние значения" : "Nearby durations",
        style: "chips",
        items: near.map((v) => ({ path: ["timer", v.slug], label: locale === "ru" ? label(v, "ru") : label(v, "en") })),
      },
    ];
  };

  const faqRu: QA[] = [
    {
      q: x.style === "sec" ? `Сколько это — ${ruNom}?` : x.style === "min" && x.sec % 60 === 0 ? `Сколько секунд в ${ruPl(Math.round(min), ["минуте", "минутах", "минутах"])}?` : `${cap(ruNom)} — это сколько секунд?`,
      a:
        x.style === "sec"
          ? `${cap(ruNom)} — это ${n("ru", min, 2)} ${plural("ru", min, ["минута", "минуты", "минут", "минуты"])}.`
          : `${cap(ruNom)} = ${secWord("ru")}${x.sec >= 3600 && x.style === "min" ? ` = ${durationText(x.sec, "ru")}` : ""}.`,
    },
    {
      q: "Будет ли таймер работать, если свернуть вкладку или переключиться на другую?",
      a: "Да. Время считается от момента старта по часам устройства, поэтому в фоновой вкладке отсчёт не отстаёт. Звук заранее ставится в очередь аудиосистемы браузера, а уведомление (если включено) придёт, когда вкладка не на экране. Не закрывайте вкладку и не отправляйте устройство в сон.",
    },
    { q: `Можно ли поставить таймер на ${ruAcc} без звука?`, a: "Да: выберите «Без звука» в списке звуков. Окончание будет видно по надписи «Время вышло!» и в заголовке вкладки, а при включённых уведомлениях придёт системное оповещение." },
  ];
  const faqEn: QA[] = [
    {
      q: x.style === "sec" ? `How long is ${en}?` : `How many seconds are in ${en}?`,
      a: x.style === "sec" ? `${cap(en)} is ${n("en", min, 2)} minutes.` : `${cap(en)} = ${secWord("en")}${x.sec >= 3600 && x.style === "min" ? ` = ${durationText(x.sec, "en")}` : ""}.`,
    },
    {
      q: "Does the timer keep running if I switch tabs?",
      a: "Yes. Time is measured from the start moment using your device clock, so a background tab never falls behind. The sound is queued in the browser's audio system in advance, and a notification (if enabled) arrives when the tab is not visible. Keep the tab open and the device awake.",
    },
    { q: `Can I run a ${adj} timer without sound?`, a: "Yes: choose “No sound”. The end is shown as “Time's up!” and in the tab title, and a system notification appears if notifications are on." },
  ];

  return {
    slug: x.slug,
    name: { ru: ruNom, en },
    title: { ru: `Таймер на ${ruAcc} — онлайн со звуком`, en: `${cap(adj)} timer — online countdown with sound` },
    h1: { ru: `Таймер на ${ruAcc}`, en: `${cap(adj)} timer` },
    description: {
      ru: `Таймер на ${ruAcc} онлайн: ${secWord("ru")} обратного отсчёта, звуковой сигнал и уведомление в конце. Старт одной кнопкой, точно работает в фоновой вкладке.`,
      en: `${cap(adj)} timer online: ${secWord("en")} of countdown, an alarm sound and a notification at the end. One-click start, stays accurate in a background tab.`,
    },
    lead: { ru: `Нажмите «Старт» — через ${ruAcc} прозвучит сигнал.`, en: `Press Start — the alarm sounds in ${en}.` },
    props: { seconds: x.sec },
    keywords: { ru: [`таймер ${ruNom}`, `${ruNom} таймер`, `обратный отсчёт ${ruNom}`], en: [`${en} timer`, `${adj} countdown`] },
    blocks,
    faq: { ru: faqRu, en: faqEn },
  };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ───────────── pomodoro, alarm, interval variants ───────────── */

const POMODORO: [number, number, number, string, string][] = [
  [25, 5, 15, "классическая схема Франческо Чирилло: 25 минут работы, 5 минут отдыха, после четырёх «помидоров» — длинный перерыв 15–30 минут", "Francesco Cirillo's classic scheme: 25 minutes of work, 5 minutes of rest, and a 15–30 minute break after four pomodoros"],
  [50, 10, 30, "удвоенный «помидор» для глубокой работы: 50 минут без отвлечений и 10 минут отдыха — удобно совпадает с часом", "a double pomodoro for deep work: 50 distraction-free minutes and a 10-minute break — it lines up with the hour"],
  [52, 17, 17, "схема 52/17 стала известна после исследования приложения DeskTime: у самых продуктивных пользователей рабочие отрезки в среднем длились 52 минуты, а перерывы — 17", "the 52/17 scheme became known from a DeskTime study: its most productive users worked in stretches of about 52 minutes with 17-minute breaks"],
  [90, 20, 30, "90 минут работы и 20 минут отдыха — схема, основанная на идее ультрадианных ритмов с циклами около полутора часов", "90 minutes of work and 20 of rest — based on the idea of ultradian rhythms with cycles of about an hour and a half"],
];

function pomodoroVariants(): VariantDef[] {
  const mins = (v: number) => ruPl(v, ["минута", "минуты", "минут"]);
  return POMODORO.map(([w, s, l, ru, en]) => ({
    slug: `${w}-${s}`,
    name: { ru: `${w}/${s}`, en: `${w}/${s}` },
    title: { ru: `Помодоро ${w}/${s} — ${mins(w)} работы, ${s} отдыха`, en: `Pomodoro ${w}/${s} timer — ${w} min focus, ${s} min break` },
    h1: { ru: `Таймер помодоро ${w}/${s}`, en: `Pomodoro timer ${w}/${s}` },
    description: {
      ru: `Помодоро-таймер ${w}/${s}: ${mins(w)} работы, ${mins(s)} перерыва, после 4 циклов — ${mins(l)} отдыха. Звук и уведомление при смене этапа, автозапуск, счётчик.`,
      en: `Pomodoro timer ${w}/${s}: ${w} minutes of focus, ${s}-minute breaks and a ${l}-minute break after 4 cycles. Sound and notification between phases, auto-start, counter.`,
    },
    lead: { ru: `${cap(mins(w))} работы, ${mins(s)} отдыха — ${ru.split(":")[0]}.`, en: `${w} minutes of focus, ${s} minutes of rest — ${en.split(":")[0]}.` },
    props: { work: w, short: s, long: l, cycles: 4 },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? "Схема" : "Scheme",
        rows:
          locale === "ru"
            ? [
                ["Работа", mins(w)],
                ["Короткий перерыв", mins(s)],
                ["Длинный перерыв", `${mins(l)} после 4 циклов`],
                ["Один цикл", mins(w + s)],
                ["4 цикла с длинным перерывом", `${mins(4 * w + 3 * s + l)} ≈ ${formatNumber("ru", (4 * w + 3 * s + l) / 60, { maximumFractionDigits: 1 })} ч`],
              ]
            : [
                ["Focus", `${w} minutes`],
                ["Short break", `${s} minutes`],
                ["Long break", `${l} minutes after 4 cycles`],
                ["One cycle", `${w + s} minutes`],
                ["4 cycles with a long break", `${4 * w + 3 * s + l} minutes ≈ ${formatNumber("en", (4 * w + 3 * s + l) / 60, { maximumFractionDigits: 1 })} h`],
              ],
      },
      { type: "text", paragraphs: [locale === "ru" ? cap(`${ru}.`) : cap(`${en}.`)] },
    ],
  }));
}

const ALARMS = ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00"];

function alarmVariants(): VariantDef[] {
  return ALARMS.map((t) => {
    const [h, m] = t.split(":").map(Number);
    const disp = `${h}:${p2(m)}`;
    const sleep = (hours: number) => {
      const total = (h * 60 + m - hours * 60 + 1440) % 1440;
      return `${Math.floor(total / 60)}:${p2(total % 60)}`;
    };
    return {
      slug: `${h}-${p2(m)}`,
      name: { ru: disp, en: disp },
      title: { ru: `Будильник на ${disp} — онлайн со звуком`, en: `Alarm for ${disp} — online alarm clock` },
      h1: { ru: `Будильник на ${disp}`, en: `Set an alarm for ${disp}` },
      description: {
        ru: `Онлайн-будильник на ${disp}: сработает в ближайшие ${disp} по времени вашего устройства. Чтобы поспать 8 часов, ложитесь в ${sleep(8)}, 7 часов — в ${sleep(7)}.`,
        en: `Online alarm clock for ${disp}: rings at the next ${disp} on your device clock. To sleep 8 hours go to bed at ${sleep(8)}, for 7 hours at ${sleep(7)}.`,
      },
      lead: { ru: `Нажмите «Завести будильник» — он прозвенит в ${disp}, пока вкладка открыта.`, en: `Press “Set alarm” — it rings at ${disp} while the tab stays open.` },
      props: { time: `${p2(h)}:${p2(m)}` },
      blocks: (locale) => [
        {
          type: "table",
          title: locale === "ru" ? `Во сколько лечь спать, чтобы встать в ${disp}` : `When to go to bed to wake up at ${disp}`,
          head: locale === "ru" ? ["Сон", "Лечь в"] : ["Sleep", "Go to bed at"],
          rows: [6, 7, 7.5, 8, 9].map((hrs) => [
            locale === "ru" ? `${formatNumber("ru", hrs)} ${plural("ru", hrs, ["час", "часа", "часов", "часа"])}` : `${hrs} hours`,
            sleep(hrs),
          ]),
        },
        {
          type: "text",
          paragraphs: [
            locale === "ru"
              ? "Цикл сна длится в среднем около 90 минут, поэтому многим легче просыпаться после 6 или 7,5 часа сна — в конце цикла. Добавьте 10–20 минут на засыпание."
              : "A sleep cycle lasts about 90 minutes on average, so many people find it easier to wake up after 6 or 7.5 hours — at the end of a cycle. Add 10–20 minutes to fall asleep.",
          ],
        },
      ],
    };
  });
}

function intervalVariants(): VariantDef[] {
  return [
    {
      slug: "tabata",
      name: { ru: "Табата 20/10", en: "Tabata 20/10" },
      title: { ru: "Таймер табата онлайн — 20 секунд работы, 10 отдыха", en: "Tabata timer online — 20 s work, 10 s rest, 8 rounds" },
      h1: { ru: "Таймер для табаты", en: "Tabata timer" },
      description: {
        ru: "Таймер табата: 8 раундов по 20 секунд работы и 10 секунд отдыха — ровно 4 минуты, плюс 10 секунд на подготовку. Сигналы за 3 секунды до смены, на весь экран.",
        en: "Tabata timer: 8 rounds of 20 seconds work and 10 seconds rest — exactly 4 minutes, plus a 10-second get-ready. Beeps 3 seconds before each change, full screen.",
      },
      lead: { ru: "8 раундов: 20 секунд максимальной работы, 10 секунд отдыха.", en: "8 rounds: 20 seconds all-out, 10 seconds rest." },
      props: { work: 20, rest: 10, rounds: 8, prepare: 10 },
      blocks: (l) => [
        {
          type: "text",
          paragraphs: [
            l === "ru"
              ? "Протокол назван по имени японского исследователя Идзуми Табаты, который в 1990-х изучал такие интервалы на спортсменах. Классическая табата — 8 раундов по 20 секунд очень интенсивной работы с отдыхом по 10 секунд."
              : "The protocol is named after Japanese researcher Izumi Tabata, who studied these intervals on athletes in the 1990s. Classic Tabata is 8 rounds of 20 seconds of very hard work with 10-second rests.",
          ],
        },
      ],
    },
    {
      slug: "hiit",
      name: { ru: "HIIT 40/20", en: "HIIT 40/20" },
      title: { ru: "Таймер HIIT 40/20 — интервальная тренировка онлайн", en: "HIIT timer 40/20 — interval workout online" },
      h1: { ru: "Таймер HIIT 40/20", en: "HIIT timer 40/20" },
      description: {
        ru: "Таймер для HIIT: 10 раундов по 40 секунд работы и 20 секунд отдыха — 10 минут. Звуковые сигналы за 3 секунды до смены этапа, счётчик раундов, режим на весь экран.",
        en: "HIIT timer: 10 rounds of 40 seconds work and 20 seconds rest — 10 minutes. Beeps 3 seconds before each change, round counter, full-screen mode.",
      },
      lead: { ru: "10 раундов: 40 секунд работы, 20 секунд отдыха.", en: "10 rounds: 40 seconds work, 20 seconds rest." },
      props: { work: 40, rest: 20, rounds: 10, prepare: 10 },
      blocks: (l) => [
        {
          type: "text",
          paragraphs: [
            l === "ru"
              ? "40/20 — популярная схема высокоинтенсивной интервальной тренировки: работа вдвое длиннее отдыха. Количество раундов, длительность работы и отдыха можно изменить под себя."
              : "40/20 is a popular high-intensity interval scheme: work is twice as long as rest. You can change the number of rounds and the work and rest times.",
          ],
        },
      ],
    },
    {
      slug: "emom",
      name: { ru: "EMOM", en: "EMOM" },
      title: { ru: "Таймер EMOM — каждую минуту в начале минуты", en: "EMOM timer — every minute on the minute" },
      h1: { ru: "Таймер EMOM", en: "EMOM timer" },
      description: {
        ru: "Таймер EMOM (every minute on the minute): 10 раундов по 1 минуте с сигналом в начале каждой минуты. Выполните задание и отдыхайте до конца минуты; сигналы за 3 секунды.",
        en: "EMOM timer (every minute on the minute): 10 one-minute rounds with a beep at the start of each minute. Do the reps, rest for the rest of the minute; beeps 3 seconds ahead.",
      },
      lead: { ru: "Каждую минуту — новое задание, отдых — сколько останется до конца минуты.", en: "A new set every minute; rest for whatever is left of the minute." },
      props: { work: 60, rest: 0, rounds: 10, prepare: 10 },
      blocks: (l) => [
        {
          type: "text",
          paragraphs: [
            l === "ru"
              ? "EMOM — формат из кроссфита: в начале каждой минуты выполняется заданное число повторений, оставшиеся секунды — отдых. Чем быстрее сделано задание, тем больше отдыха."
              : "EMOM comes from CrossFit: at the start of every minute you do a set number of reps and rest for the remaining seconds. The faster you finish, the longer you rest.",
          ],
        },
      ],
    },
  ];
}

/* ───────────── section ───────────── */

const SPECS = timerSpecs();

export const timerSection = defineToolSection({
  id: "timer",
  name: { ru: "Таймер и секундомер", en: "Timer & stopwatch" },
  description: {
    ru: "Онлайн-таймер на любое время, секундомер, помодоро, будильник, интервальный таймер и шахматные часы",
    en: "Online timer for any duration, stopwatch, pomodoro, alarm clock, interval timer and chess clock",
  },
  icon: "Timer",
  hue: 185,
  category: "time",
  order: 2,
  tools: [
    {
      slug: "",
      component: "timer/countdown",
      icon: "Timer",
      name: { ru: "Таймер онлайн", en: "Online timer" },
      title: { ru: "Таймер онлайн — обратный отсчёт со звуком", en: "Online timer — countdown with sound" },
      h1: { ru: "Таймер онлайн", en: "Online timer" },
      description: {
        ru: "Онлайн-таймер обратного отсчёта на любое время: часы, минуты и секунды, звуковой сигнал, уведомление, отображение в заголовке вкладки и режим на весь экран. Работает и в фоне.",
        en: "Online countdown timer for any duration: hours, minutes and seconds, alarm sound, notification, remaining time in the tab title and full screen. Keeps time in the background.",
      },
      lead: { ru: "Введите время прямо в цифры и нажмите «Старт».", en: "Type the time right into the digits and press Start." },
      props: { seconds: 300 },
      howTo: {
        ru: ["Кликните по часам, минутам или секундам и введите нужное время — или выберите готовый вариант ниже.", "Нажмите «Старт» (или пробел). Кнопка «+1» добавляет минуту даже во время отсчёта.", "Когда время выйдет, прозвучит сигнал; включите уведомление, если будете в другой вкладке.", "«Стоп» выключает звук, «Сброс» (R) возвращает исходное время."],
        en: ["Click the hours, minutes or seconds and type the time — or pick a preset below.", "Press Start (or Space). “+1” adds a minute even while counting down.", "When time is up the alarm sounds; enable notifications if you'll be in another tab.", "Stop silences the alarm, Reset (R) restores the original time."],
      },
      about: {
        ru: [
          "Таймер считает время от момента старта по часам вашего устройства, а не «тиками», поэтому не отстаёт, даже если вкладка в фоне или браузер экономит заряд. Когда вы возвращаетесь на вкладку, показания сразу догоняют реальное время.",
          "Звук окончания заранее ставится в очередь аудиосистемы браузера и играет вовремя даже в свёрнутой вкладке. Пока таймер идёт, экран не гаснет (Screen Wake Lock), а оставшееся время видно в заголовке вкладки.",
        ],
        en: [
          "The timer measures time from the start moment using your device clock instead of counting ticks, so it never falls behind in a background tab or in battery-saver mode. When you come back to the tab the display catches up instantly.",
          "The end sound is queued in the browser's audio system in advance and plays on time even in a minimised tab. While running, the screen stays on (Screen Wake Lock) and the remaining time is shown in the tab title.",
        ],
      },
      faq: {
        ru: [
          { q: "Почему нет звука?", a: "Браузеры разрешают звук только после действия на странице — нажатие «Старт» его включает. Проверьте, что вкладка не заглушена и громкость устройства не на нуле; кнопка «Проверить звук» проигрывает сигнал сразу." },
          { q: "Работает ли таймер в фоновой вкладке?", a: "Да. Отсчёт идёт по часам устройства, а сигнал заранее запланирован в аудиосистеме, поэтому он прозвучит вовремя. Закрывать вкладку нельзя, и устройство не должно уходить в сон." },
          { q: "Как поставить таймер на 1 час 30 минут?", a: "Введите 01 в часы и 30 в минуты или откройте готовую страницу «Таймер на 1 час 30 минут» ниже." },
          { q: "Можно ли получить уведомление?", a: "Да: включите переключатель «Уведомление» и разрешите уведомления в браузере — по окончании придёт системное оповещение, если вкладка не на экране." },
        ],
        en: [
          { q: "Why is there no sound?", a: "Browsers allow sound only after an action on the page — pressing Start enables it. Check that the tab isn't muted and the volume isn't zero; “Test sound” plays the alarm immediately." },
          { q: "Does it work in a background tab?", a: "Yes. The countdown follows the device clock and the alarm is scheduled in the audio system ahead of time, so it sounds on time. Don't close the tab or let the device sleep." },
          { q: "How do I set a 1 hour 30 minute timer?", a: "Type 01 in hours and 30 in minutes, or open the ready-made “1 hour 30 minute timer” page below." },
          { q: "Can I get a notification?", a: "Yes: turn on “Notification” and allow notifications in the browser — a system notification appears when time is up and the tab is not visible." },
        ],
      },
      related: ["countdown", "online-clock"],
      popular: true,
      variants: { title: { ru: "Таймер на время", en: "Timers by duration" }, list: () => SPECS.map((x) => timerVariant(x, SPECS)), limit: 40 },
    },
    {
      slug: "stopwatch",
      component: "timer/stopwatch",
      icon: "Watch",
      name: { ru: "Секундомер", en: "Stopwatch" },
      title: { ru: "Секундомер онлайн — с кругами и сотыми секунды", en: "Online stopwatch — with laps and hundredths" },
      h1: { ru: "Секундомер онлайн", en: "Online stopwatch" },
      description: {
        ru: "Секундомер онлайн с точностью до сотых: круги с временем круга и общим временем, лучший и худший круг, экспорт в CSV и TXT, управление пробелом и режим на весь экран.",
        en: "Online stopwatch accurate to hundredths: laps with lap and total times, best and worst lap, export to CSV and TXT, keyboard control and full-screen mode.",
      },
      lead: { ru: "Старт, круги и стоп — одним пробелом и клавишей L.", en: "Start, laps and stop — with Space and the L key." },
      howTo: {
        ru: ["Нажмите «Старт» или пробел.", "«Круг» (L) фиксирует время круга и общее время — лучший круг подсвечивается зелёным, худший красным.", "«Стоп» останавливает отсчёт, «Продолжить» — возобновляет, «Сброс» (R) обнуляет.", "Скопируйте круги или скачайте их в CSV для Excel."],
        en: ["Press Start or Space.", "Lap (L) records the lap time and the total — the best lap is green, the worst red.", "Stop pauses, Resume continues, Reset (R) clears.", "Copy the laps or download them as CSV for Excel."],
      },
      about: {
        ru: [
          "Время считается от момента старта по часам устройства, поэтому секундомер не сбивается в фоновой вкладке. Для каждого круга сохраняются два значения: время круга (сплит) и общее время на момент отметки.",
          "Экспорт в CSV содержит и миллисекунды, и отформатированное время — файл открывается в Excel и Google Таблицах.",
        ],
        en: [
          "Time is measured from the start moment using the device clock, so the stopwatch stays correct in a background tab. Each lap stores both the lap (split) time and the total time at that moment.",
          "The CSV export contains milliseconds and formatted times and opens in Excel and Google Sheets.",
        ],
      },
      faq: {
        ru: [
          { q: "Чем время круга отличается от общего?", a: "Время круга — сколько длился только этот круг, общее — сколько прошло с начала замера. Например, круги 1:05 и 1:02 дают общее время 2:07." },
          { q: "Насколько точен секундомер?", a: "Показания обновляются с частотой экрана, а время берётся из часов устройства с точностью до миллисекунд. Реальная точность ручного замера ограничена реакцией человека — около 0,1–0,2 секунды." },
          { q: "Сохраняются ли круги?", a: "Только до перезагрузки страницы. Чтобы сохранить результаты, скопируйте их или скачайте CSV/TXT." },
        ],
        en: [
          { q: "What is the difference between lap and total time?", a: "Lap time is how long that lap alone took; total time is the time since the start. Laps of 1:05 and 1:02 give a total of 2:07." },
          { q: "How accurate is it?", a: "The display updates with your screen's refresh rate and time comes from the device clock with millisecond resolution. Real accuracy of manual timing is limited by human reaction — about 0.1–0.2 s." },
          { q: "Are the laps saved?", a: "Only until the page is reloaded. Copy them or download CSV/TXT to keep the results." },
        ],
      },
      related: ["online-clock"],
      popular: true,
    },
    {
      slug: "pomodoro-timer",
      component: "timer/pomodoro",
      icon: "Apple",
      name: { ru: "Помодоро-таймер", en: "Pomodoro timer" },
      title: { ru: "Помодоро-таймер онлайн — 25 минут работы и перерывы", en: "Pomodoro timer online — 25-minute focus and breaks" },
      h1: { ru: "Таймер помодоро", en: "Pomodoro timer" },
      description: {
        ru: "Помодоро-таймер онлайн: 25 минут работы, 5 минут перерыва и длинный перерыв после 4 циклов. Свои интервалы, автозапуск, звук и уведомление при смене этапа, счётчик «помидоров».",
        en: "Pomodoro timer online: 25 minutes of focus, 5-minute breaks and a long break after 4 cycles. Custom intervals, auto-start, sound and notification between phases, pomodoro counter.",
      },
      lead: { ru: "Чередуйте 25 минут работы и 5 минут отдыха.", en: "Alternate 25 minutes of focus with 5 minutes of rest." },
      props: { work: 25, short: 5, long: 15, cycles: 4 },
      howTo: {
        ru: ["Нажмите «Старт» — начнётся рабочий отрезок.", "По окончании прозвучит сигнал и начнётся перерыв (если включён автозапуск).", "После четырёх «помидоров» — длинный перерыв; длительности можно изменить.", "«Пропустить» сразу переходит к следующему этапу."],
        en: ["Press Start — a focus session begins.", "When it ends, a sound plays and the break starts (if auto-start is on).", "After four pomodoros comes a long break; all durations are adjustable.", "Skip moves straight to the next phase."],
      },
      about: {
        ru: [
          "Техника Помодоро (от итальянского «помидор» — у автора был кухонный таймер в форме томата) делит работу на отрезки по 25 минут с короткими перерывами. Так проще начать сложную задачу и не выгореть к вечеру.",
          "Таймер переходит между работой и отдыхом по часам устройства: если вкладка была свёрнута или компьютер засыпал, при возвращении он пересчитает, какой этап идёт сейчас.",
        ],
        en: [
          "The Pomodoro technique (Italian for tomato — its author used a tomato-shaped kitchen timer) splits work into 25-minute blocks with short breaks. It makes it easier to start hard tasks and not burn out by evening.",
          "The timer switches between focus and rest by the device clock: if the tab was hidden or the computer slept, it works out the current phase when you come back.",
        ],
      },
      faq: {
        ru: [
          { q: "Сколько длится помодоро?", a: "Классически 25 минут работы и 5 минут отдыха, а после четырёх циклов — перерыв 15–30 минут. Популярны и схемы 50/10, 52/17 и 90/20." },
          { q: "Можно ли поменять длительность?", a: "Да, в полях под таймером: работа, короткий и длинный перерыв, количество «помидоров» до длинного перерыва." },
          { q: "Что будет, если свернуть вкладку?", a: "Таймер продолжит отсчёт, а при смене этапа прозвучит сигнал и (если включено) придёт уведомление." },
        ],
        en: [
          { q: "How long is a pomodoro?", a: "Classically 25 minutes of focus and 5 of rest, with a 15–30 minute break after four cycles. 50/10, 52/17 and 90/20 are popular too." },
          { q: "Can I change the durations?", a: "Yes, in the fields below the timer: focus, short and long break, and the number of pomodoros before a long break." },
          { q: "What if I minimise the tab?", a: "The timer keeps going; a sound plays between phases and a notification appears if enabled." },
        ],
      },
      related: ["countdown"],
      popular: true,
      variants: { title: { ru: "Схемы помодоро", en: "Pomodoro schemes" }, list: pomodoroVariants },
    },
    {
      slug: "alarm-clock",
      component: "timer/alarm",
      icon: "AlarmClock",
      name: { ru: "Будильник онлайн", en: "Online alarm clock" },
      title: { ru: "Будильник онлайн — со звуком на нужное время", en: "Online alarm clock — set an alarm with sound" },
      h1: { ru: "Будильник онлайн", en: "Online alarm clock" },
      description: {
        ru: "Онлайн-будильник: выберите время и звук — сигнал прозвучит в браузере, пока вкладка открыта. Отложить на 5 минут, уведомление, запрет гашения экрана. Без установки и регистрации.",
        en: "Online alarm clock: pick a time and a sound — the alarm rings in the browser while the tab is open. Snooze 5 minutes, notification, keep-screen-on. No install or sign-up.",
      },
      lead: { ru: "Выберите время и нажмите «Завести будильник» — вкладку не закрывайте.", en: "Pick a time and press “Set alarm” — keep the tab open." },
      props: { time: "07:00" },
      howTo: {
        ru: ["Введите время сигнала.", "Выберите звук и проверьте громкость кнопкой «Проверить звук».", "Нажмите «Завести будильник» и не закрывайте вкладку.", "Когда зазвонит — «Выключить» или «Отложить на 5 минут»."],
        en: ["Enter the alarm time.", "Choose a sound and check the volume with “Test sound”.", "Press “Set alarm” and keep the tab open.", "When it rings — Turn off or Snooze 5 minutes."],
      },
      about: {
        ru: [
          "Будильник срабатывает в ближайшее наступление выбранного времени по часам вашего устройства — сегодня или завтра. Сигнал заранее запланирован в аудиосистеме браузера, поэтому звучит вовремя даже в фоновой вкладке.",
          "Честное ограничение: страница не может разбудить спящий компьютер или телефон и не работает после закрытия вкладки. Для сна на телефоне надёжнее встроенный будильник; онлайн-будильник удобен днём — для напоминаний за компьютером.",
        ],
        en: [
          "The alarm fires at the next occurrence of the chosen time on your device clock — today or tomorrow. The sound is scheduled in the browser's audio system in advance, so it plays on time even in a background tab.",
          "An honest limit: a web page can't wake a sleeping computer or phone and stops when the tab is closed. For sleep, your phone's built-in alarm is more reliable; the online alarm is handy for reminders at your desk.",
        ],
      },
      faq: {
        ru: [
          { q: "Сработает ли будильник, если закрыть вкладку?", a: "Нет. Будильник работает, только пока вкладка открыта, а устройство не спит. Свернуть вкладку или переключиться на другую можно." },
          { q: "Почему может не быть звука?", a: "Браузер разрешает звук после действия на странице — нажатие «Завести будильник» его включает. Проверьте громкость кнопкой «Проверить звук» и не заглушайте вкладку." },
          { q: "Не погаснет ли экран?", a: "При включённом «Не гасить экран» страница просит браузер держать экран включённым (Screen Wake Lock). Это работает в Chrome, Edge и Safari, пока вкладка на экране." },
        ],
        en: [
          { q: "Will the alarm ring if I close the tab?", a: "No. It works only while the tab is open and the device is awake. Minimising or switching tabs is fine." },
          { q: "Why might there be no sound?", a: "Browsers allow sound after an action on the page — pressing “Set alarm” enables it. Check the volume with “Test sound” and don't mute the tab." },
          { q: "Will the screen turn off?", a: "With “Keep screen on” the page asks the browser to keep the display on (Screen Wake Lock). This works in Chrome, Edge and Safari while the tab is visible." },
        ],
      },
      related: ["time", "countdown"],
      variants: { title: { ru: "Будильник на время", en: "Alarm for a time" }, list: alarmVariants },
    },
    {
      slug: "interval-timer",
      component: "timer/interval",
      icon: "Repeat",
      name: { ru: "Интервальный таймер", en: "Interval timer" },
      title: { ru: "Интервальный таймер онлайн — табата, HIIT, EMOM", en: "Interval timer online — Tabata, HIIT, EMOM" },
      h1: { ru: "Интервальный таймер", en: "Interval timer" },
      description: {
        ru: "Интервальный таймер для тренировок: работа, отдых и число раундов, подготовка, сигналы за 3 секунды до смены этапа. Готовые схемы: табата 20/10, HIIT 40/20, EMOM.",
        en: "Interval timer for workouts: work, rest and number of rounds, get-ready time, beeps 3 seconds before every change. Presets: Tabata 20/10, HIIT 40/20, EMOM.",
      },
      lead: { ru: "Задайте работу, отдых и число раундов — сигналы подскажут смену.", en: "Set work, rest and rounds — beeps tell you when to switch." },
      props: { work: 30, rest: 15, rounds: 8, prepare: 10 },
      howTo: {
        ru: ["Укажите длительность работы и отдыха в секундах и число раундов.", "Нажмите «Старт»: сначала идёт подготовка, затем раунды.", "За 3 секунды до смены этапа звучат короткие сигналы, в момент смены — длинный.", "Экран не гаснет во время тренировки; разверните таймер на весь экран."],
        en: ["Set work and rest in seconds and the number of rounds.", "Press Start: a get-ready phase comes first, then the rounds.", "Short beeps sound 3 seconds before each change, a long beep at the change.", "The screen stays on during the workout; expand the timer to full screen."],
      },
      about: {
        ru: ["Все звуковые сигналы заранее расставлены на шкале времени аудиосистемы браузера, поэтому они не «плывут», даже если телефон экономит заряд или вкладка ушла в фон. На паузе очередь сигналов сбрасывается и пересчитывается при продолжении."],
        en: ["All beeps are placed on the browser audio system's timeline in advance, so they don't drift even if the phone saves battery or the tab is in the background. Pausing clears the queue and it is rebuilt on resume."],
      },
      faq: {
        ru: [
          { q: "Что такое табата?", a: "8 раундов по 20 секунд максимальной работы и 10 секунд отдыха — всего 4 минуты. Для неё есть готовая страница с настройками." },
          { q: "Можно ли тренироваться без звука?", a: "Да, отключите «Звуковые сигналы» — фазы различаются цветом: работа красным, отдых зелёным, подготовка жёлтым." },
          { q: "Как сделать EMOM?", a: "Поставьте работу 60 секунд, отдых 0 и нужное число раундов — или откройте готовую схему EMOM." },
        ],
        en: [
          { q: "What is Tabata?", a: "8 rounds of 20 seconds all-out and 10 seconds rest — 4 minutes total. There's a ready-made page for it." },
          { q: "Can I train without sound?", a: "Yes, turn off Beeps — phases differ by colour: work red, rest green, get-ready yellow." },
          { q: "How do I set up EMOM?", a: "Set work to 60 seconds, rest to 0 and the rounds you need — or open the EMOM preset." },
        ],
      },
      related: ["online-clock"],
      variants: { title: { ru: "Готовые схемы", en: "Presets" }, list: intervalVariants },
    },
    {
      slug: "chess-clock",
      component: "timer/chess",
      icon: "Crown",
      name: { ru: "Шахматные часы", en: "Chess clock" },
      title: { ru: "Шахматные часы онлайн — блиц, рапид, добавление времени", en: "Chess clock online — blitz, rapid and increment" },
      h1: { ru: "Шахматные часы онлайн", en: "Online chess clock" },
      description: {
        ru: "Шахматные часы онлайн для двух игроков: контроль 1, 3, 5, 10, 15, 30 минут, добавление времени за ход (Фишер), счётчик ходов и сигнал при падении флажка. Удобно на телефоне.",
        en: "Online chess clock for two players: 1, 3, 5, 10, 15 and 30-minute controls, Fischer increment, move counter and a sound when the flag falls. Phone-friendly.",
      },
      lead: { ru: "Положите телефон между игроками и нажимайте на свою половину после хода.", en: "Put the phone between the players and tap your half after each move." },
      props: { minutes: 5, increment: 0 },
      howTo: {
        ru: ["Выберите контроль времени, например 3 + 2 (3 минуты и 2 секунды за ход).", "Игрок чёрными нажимает на свою половину — пошли часы белых.", "После каждого хода нажимайте на свою половину (или пробел).", "Когда время заканчивается, половина краснеет — флажок упал."],
        en: ["Choose a time control, e.g. 3 + 2 (3 minutes plus 2 seconds per move).", "Black taps their half — White's clock starts.", "After each move tap your half (or press Space).", "When time runs out the half turns red — the flag has fallen."],
      },
      about: {
        ru: ["На телефоне верхняя половина повёрнута к сопернику, чтобы каждый видел свои цифры. Время считается по часам устройства, а экран не гаснет во время партии.", "Добавление по Фишеру прибавляет указанные секунды к вашему времени после каждого сделанного хода."],
        en: ["On a phone the top half faces the opponent so both players can read their time. Time follows the device clock and the screen stays on during the game.", "The Fischer increment adds the given seconds to your clock after every move you make."],
      },
      faq: {
        ru: [
          { q: "Что значит 3 + 2?", a: "3 минуты на партию каждому и 2 секунды добавки за каждый сделанный ход." },
          { q: "Кто нажимает первым?", a: "Игрок чёрными — после этого начинают идти часы белых, которые делают первый ход." },
          { q: "Можно ли поставить партию на паузу?", a: "Да, кнопкой паузы между половинами; продолжить можно той же кнопкой." },
        ],
        en: [
          { q: "What does 3 + 2 mean?", a: "3 minutes per player for the game plus 2 seconds added for each move made." },
          { q: "Who presses first?", a: "Black — that starts White's clock, and White makes the first move." },
          { q: "Can I pause the game?", a: "Yes, with the pause button between the halves; press it again to continue." },
        ],
      },
      related: ["online-clock"],
    },
  ],
});
