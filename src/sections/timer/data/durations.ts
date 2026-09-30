import type { Locale } from "@/i18n/config";

/**
 * Timer variant durations (seconds). The first entries are the most searched and
 * are the ones shown as chips on the main timer page.
 */
export const POPULAR: number[] = [
  60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 720, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600,
  5, 10, 15, 20, 30, 45, 90,
  5400, 7200, 9000, 10800, 14400, 18000, 21600, 28800, 36000, 43200, 86400,
];

const MINUTES = Array.from({ length: 60 }, (_, i) => (i + 1) * 60);
const EXTRA = [150, 4200, 4500, 4800, 6000, 12600, 25200, 32400, 39600];
const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1) * 3600);

/** All variant durations, popular first, unique. */
export const DURATIONS: number[] = [...new Set([...POPULAR, ...MINUTES, ...HOURS, ...EXTRA])];

/** Durations above an hour that people search in minutes ("таймер на 75 минут"). */
const MINUTE_STYLE = new Set([4200, 4500, 4800, 6000]);

export type Style = "sec" | "min" | "hour";

export interface TimerVariantSpec {
  sec: number;
  slug: string;
  /** How the duration is named on the page: "90 секунд", "90 минут", "1 час 30 минут". */
  style: Style;
}

function spec(sec: number, style?: Style): TimerVariantSpec {
  const st: Style = style ?? (sec <= 90 && sec % 60 !== 0 ? "sec" : sec < 3600 || MINUTE_STYLE.has(sec) ? "min" : "hour");
  if (st === "sec") return { sec, slug: `${sec}-seconds`, style: st };
  if (st === "min") {
    const mm = Math.floor(sec / 60);
    const s = sec % 60;
    const slug = !s ? (mm === 1 ? "1-minute" : `${mm}-minutes`) : `${mm}-minute${mm === 1 ? "" : "s"}-${s}-seconds`;
    return { sec, slug, style: st };
  }
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const hp = h === 1 ? "1-hour" : `${h}-hours`;
  return { sec, slug: m ? `${hp}-${m}-minutes` : hp, style: st };
}

/** Final list; 60, 90 and 120 minutes also exist in hour form ("1-hour", "1-hour-30-minutes", "2-hours"). */
export function timerSpecs(): TimerVariantSpec[] {
  const out: TimerVariantSpec[] = [];
  const seen = new Set<string>();
  const add = (x: TimerVariantSpec) => {
    if (seen.has(x.slug)) return;
    seen.add(x.slug);
    out.push(x);
  };
  for (const sec of DURATIONS) {
    if (sec === 3600 || sec === 5400 || sec === 7200) {
      add(spec(sec, "min"));
      add(spec(sec, "hour"));
    } else add(spec(sec));
  }
  return out;
}

/* ───────────── what each duration is typically used for ───────────── */

type Uses = Record<Locale, string[]>;

const EXACT: Record<number, Uses> = {
  5: { ru: ["обратный отсчёт перед стартом или снимком", "короткая пауза в игре или упражнении"], en: ["a countdown before a start or a photo", "a short pause in a game or exercise"] },
  10: { ru: ["отсчёт перед стартом забега, видео или эфира", "раунд быстрых вопросов", "короткая задержка дыхания в дыхательной практике"], en: ["a countdown before a race, video or live stream", "a round of quick-fire questions", "a short breath hold in breathing exercises"] },
  15: { ru: ["ответ на вопрос в викторине", "короткий отдых между упражнениями (схема 45/15)"], en: ["answering a quiz question", "short rest between exercises (45/15 scheme)"] },
  20: { ru: ["рабочий интервал табаты: 20 секунд работы, 10 отдыха", "мытьё рук — намыливать руки советуют не меньше 20 секунд"], en: ["a Tabata work interval: 20 seconds on, 10 off", "hand washing — lather your hands for at least 20 seconds"] },
  30: { ru: ["планка или растяжка одной группы мышц", "интервал в круговой тренировке", "короткая самопрезентация"], en: ["a plank or a single stretch", "an interval in a circuit workout", "a short elevator pitch"] },
  45: { ru: ["рабочий интервал HIIT по схеме 45/15", "подход в упражнении на время"], en: ["a HIIT work interval (45/15)", "a timed set of an exercise"] },
  60: { ru: ["планка на минуту", "минута молчания или тишины", "отдых между подходами"], en: ["a one-minute plank", "a minute of silence", "rest between sets"] },
  90: { ru: ["отдых между подходами в силовой тренировке (обычно 60–90 секунд)", "разогрев еды в микроволновке"], en: ["rest between strength sets (usually 60–90 seconds)", "reheating food in a microwave"] },
  120: { ru: ["чистка зубов — стоматологи советуют чистить не меньше 2 минут", "отдых между тяжёлыми подходами", "заваривание зелёного чая"], en: ["brushing teeth — dentists recommend at least 2 minutes", "rest between heavy sets", "steeping green tea"] },
  150: { ru: ["отдых между тяжёлыми подходами", "заваривание зелёного или белого чая"], en: ["rest between heavy sets", "steeping green or white tea"] },
  180: { ru: ["яйцо всмятку — около 3 минут после закипания", "раунд в боксе длится 3 минуты", "заваривание зелёного чая (2–3 минуты)"], en: ["a soft-boiled egg — about 3 minutes after the water boils", "a boxing round lasts 3 minutes", "steeping green tea (2–3 minutes)"] },
  240: { ru: ["заваривание чёрного чая (3–5 минут)", "полная табата: 8 раундов по 20 + 10 секунд — ровно 4 минуты"], en: ["steeping black tea (3–5 minutes)", "a full Tabata: 8 rounds of 20 + 10 seconds is exactly 4 minutes"] },
  300: { ru: ["короткий перерыв — например, между «помидорами»", "дыхательная практика или быстрая медитация", "заваривание чёрного чая"], en: ["a short break — e.g. between pomodoros", "a breathing exercise or a quick meditation", "steeping black tea"] },
  360: { ru: ["яйцо в мешочек (6–7 минут)", "короткое выступление"], en: ["a jammy egg (6–7 minutes)", "a short talk"] },
  420: { ru: ["«7-минутная тренировка»: 12 упражнений по 30 секунд с короткими паузами", "яйцо в мешочек с более плотным желтком"], en: ["the “7-minute workout”: 12 exercises of 30 seconds with short breaks", "a medium-boiled egg"] },
  480: { ru: ["яйцо вкрутую (8–10 минут)", "многие виды пасты варятся 8–10 минут"], en: ["a hard-boiled egg (8–10 minutes)", "many kinds of pasta cook in 8–10 minutes"] },
  540: { ru: ["яйцо вкрутую", "паста аль денте"], en: ["a hard-boiled egg", "pasta al dente"] },
  600: { ru: ["медитация для начинающих", "короткая зарядка или разминка", "перерыв после 50 минут работы"], en: ["a beginner meditation", "a quick workout or warm-up", "a break after 50 minutes of work"] },
  720: { ru: ["тест Купера — бег в течение 12 минут", "короткий дневной сон"], en: ["the Cooper test — a 12-minute run", "a short nap"] },
  900: { ru: ["перерыв на кофе", "короткий дневной сон (обычно советуют 10–20 минут)", "самостоятельная работа на уроке"], en: ["a coffee break", "a power nap (10–20 minutes is usually advised)", "a short in-class exercise"] },
  1200: { ru: ["дневной сон — 20 минут, чтобы не уйти в глубокую фазу сна", "запекание овощей или рыбы", "сеанс медитации"], en: ["a nap — 20 minutes keeps you out of deep sleep", "roasting vegetables or fish", "a meditation session"] },
  1500: { ru: ["один «помидор» — рабочий интервал техники Помодоро", "сфокусированная работа над одной задачей"], en: ["one pomodoro — the work interval of the Pomodoro technique", "focused work on a single task"] },
  1800: { ru: ["тренировка или пробежка", "занятие на музыкальном инструменте", "выпечка печенья или маффинов (обычно 15–30 минут)"], en: ["a workout or a run", "instrument practice", "baking cookies or muffins (usually 15–30 minutes)"] },
  2400: { ru: ["урок в школе (40–45 минут)", "занятие с репетитором", "онлайн-встреча"], en: ["a school lesson (40–45 minutes)", "a tutoring session", "an online meeting"] },
  2700: { ru: ["школьный урок и академический час — по 45 минут", "тайм футбольного матча — 45 минут"], en: ["a school lesson or an academic hour — 45 minutes", "one half of a football match — 45 minutes"] },
  3000: { ru: ["рабочий блок по схеме 50/10: 50 минут работы, 10 отдыха", "занятие в спортзале"], en: ["a 50/10 work block: 50 minutes of work, 10 of rest", "a gym session"] },
  3600: { ru: ["тренировка в зале", "запекание курицы целиком — около часа", "урок или онлайн-встреча"], en: ["a gym workout", "roasting a whole chicken — about an hour", "a lesson or an online meeting"] },
  5400: { ru: ["пара в вузе — 2 академических часа по 45 минут", "футбольный матч — 2 тайма по 45 минут", "цикл сна в среднем длится около 90 минут"], en: ["a university class — two 45-minute academic hours", "a football match — two 45-minute halves", "a sleep cycle averages about 90 minutes"] },
  7200: { ru: ["фильм", "экзамен или контрольная", "длинная тренировка"], en: ["a film", "an exam or a test", "a long workout"] },
  28800: { ru: ["рабочий день — 8 часов", "сон — взрослым обычно советуют 7–9 часов"], en: ["a working day — 8 hours", "sleep — adults are usually advised 7–9 hours"] },
  43200: { ru: ["рабочая смена 12 часов", "маринование мяса", "длинный перелёт"], en: ["a 12-hour shift", "marinating meat", "a long flight"] },
  86400: { ru: ["сутки: маринование, выдержка теста, дедлайн «через сутки»", "интервальное голодание — отсчёт до следующего приёма пищи"], en: ["a full day: marinating, proofing dough, a “24 hours from now” deadline", "intermittent fasting — counting down to the next meal"] },
};

function range(sec: number): Uses {
  if (sec < 60) return { ru: ["короткие интервалы в тренировке", "игры и викторины"], en: ["short workout intervals", "games and quizzes"] };
  if (sec < 600) return { ru: ["короткий перерыв", "приготовление напитков и простых блюд", "интервалы в тренировке"], en: ["a short break", "making drinks and simple dishes", "workout intervals"] };
  if (sec < 1800) return { ru: ["домашнее задание по одной теме", "уборка «по таймеру»", "короткий дневной отдых"], en: ["homework on one topic", "a timed tidy-up", "a short rest"] };
  if (sec < 3600) return { ru: ["рабочий блок без отвлечений", "тренировка", "приготовление основного блюда"], en: ["a distraction-free work block", "a workout", "cooking a main dish"] };
  if (sec < 10800) return { ru: ["долгий рабочий блок или лекция", "экзамен", "запекание и тушение"], en: ["a long work block or a lecture", "an exam", "roasting and stewing"] };
  if (sec < 28800) return { ru: ["медленное тушение или запекание", "поездка или зарядка устройства", "контроль времени на экзамене или смене"], en: ["slow cooking or roasting", "a trip or charging a device", "timing an exam or a shift"] };
  return { ru: ["сон или рабочая смена", "маринование и выдержка", "долгий перелёт"], en: ["sleep or a work shift", "marinating and proofing", "a long flight"] };
}

export function usesOf(sec: number, locale: Locale): string[] {
  return (EXACT[sec] ?? range(sec))[locale];
}
