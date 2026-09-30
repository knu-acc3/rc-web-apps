import type { L10n, Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { CPS_RANK_LABELS, CPS_RANKS, type CpsDuration } from "../lib/cps";

/* ───────────── Click speed (CPS) ───────────── */

interface CpsVariant {
  seconds: CpsDuration;
  slug: string;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  /** Typical clicks for an ordinary click technique [from, to]. */
  typical: [number, number];
  about: L10n;
  faq: Record<Locale, QA[]>;
}

const CPS_VARIANTS: CpsVariant[] = [
  {
    seconds: 1,
    slug: "1-second",
    name: { ru: "1 секунда", en: "1 second" },
    title: { ru: "Тест скорости кликов за 1 секунду — CPS тест", en: "1 second CPS test — how many clicks in a second" },
    h1: { ru: "Тест скорости кликов за 1 секунду", en: "1 second CPS test" },
    description: {
      ru: "Сколько кликов вы сделаете за 1 секунду? Обычно 6–8, у быстрых игроков 10–14. Короткий тест показывает пиковую скорость пальца, рекорд сохраняется в браузере.",
      en: "How many clicks can you do in 1 second? Most people manage 6–8, fast players 10–14. The short test measures peak finger speed and saves your best.",
    },
    lead: { ru: "За 1 секунду обычно успевают 6–8 кликов. Кликните по полю — отсчёт пойдёт с первого нажатия.", en: "Most people fit 6–8 clicks into 1 second. Click the box — the countdown starts with your first press." },
    typical: [6, 8],
    about: {
      ru: "Секундный тест — это спринт: рука не успевает устать, поэтому он показывает максимальную скорость, на которую способен палец. Зато результат сильно зависит от удачного старта — один лишний клик меняет CPS на целую единицу, поэтому стоит пройти тест несколько раз.",
      en: "The one-second test is a sprint: your hand has no time to tire, so it shows the fastest your finger can go. The result depends heavily on a clean start — one extra click changes the score by a full CPS — so take it a few times.",
    },
    faq: {
      ru: [
        { q: "Сколько кликов в секунду делает обычный человек?", a: "Большинство людей обычным кликом делают 6–8 кликов за секунду. В коротком тесте рука не устаёт, поэтому результат за 1 секунду обычно выше, чем в тестах на 10 и 60 секунд." },
        { q: "Почему результат за 1 секунду так скачет?", a: "За секунду набирается всего 5–15 кликов, и один лишний или пропущенный клик меняет CPS на целую единицу. Пройдите тест несколько раз — лучший результат сохранится автоматически." },
      ],
      en: [
        { q: "How many clicks per second does an average person do?", a: "Most people manage 6–8 clicks in a second with a normal click. The hand doesn't tire in such a short test, so 1-second scores are usually higher than 10 or 60-second ones." },
        { q: "Why does my 1-second score vary so much?", a: "A second only holds 5–15 clicks, so one extra or missed click shifts the score by a full CPS. Take the test several times — your best is saved automatically." },
      ],
    },
  },
  {
    seconds: 5,
    slug: "5-seconds",
    name: { ru: "5 секунд", en: "5 seconds" },
    title: { ru: "Тест скорости кликов (CPS) за 5 секунд", en: "5 second CPS test — clicks in 5 seconds" },
    h1: { ru: "Тест скорости кликов за 5 секунд", en: "5 second CPS test" },
    description: {
      ru: "CPS тест за 5 секунд: средний результат — 30–35 кликов (6–7 CPS), хороший — от 45. Таймер запускается с первого клика, рекорд для 5 секунд хранится отдельно.",
      en: "5 second CPS test: 30–35 clicks (6–7 CPS) is average, 45 or more is good. The timer starts on your first click and your 5-second best is kept separately.",
    },
    lead: { ru: "За 5 секунд средний результат — 30–35 кликов. Кликните по полю, чтобы начать.", en: "An average 5-second score is 30–35 clicks. Click the box to start." },
    typical: [30, 35],
    about: {
      ru: "Пять секунд — достаточно, чтобы сгладить неудачный старт, но слишком мало, чтобы рука заметно устала. Поэтому CPS здесь обычно на 0,5–1 выше, чем в 10-секундном тесте: это хороший способ узнать свою пиковую скорость в серии.",
      en: "Five seconds is long enough to smooth out a clumsy start but too short for real fatigue. That's why CPS here is usually 0.5–1 higher than in the 10-second test — a good way to find your peak speed over a burst.",
    },
    faq: {
      ru: [
        { q: "Сколько кликов за 5 секунд — хороший результат?", a: "30–35 кликов (6–7 CPS) — средний уровень, 40–50 — быстро, больше 50 обычно получается только с джиттер- или баттерфляй-кликом." },
        { q: "Чем тест на 5 секунд отличается от теста на 10?", a: "За 5 секунд рука почти не устаёт, поэтому CPS обычно выше. Пятисекундный тест показывает пиковую скорость, а 10-секундный — самый распространённый для сравнения результатов." },
      ],
      en: [
        { q: "How many clicks in 5 seconds is good?", a: "30–35 clicks (6–7 CPS) is average, 40–50 is fast, and more than 50 usually takes jitter or butterfly clicking." },
        { q: "How is the 5-second test different from the 10-second one?", a: "Your hand barely tires in 5 seconds, so CPS tends to be higher. The 5-second test shows peak speed; the 10-second one is the most common for comparing scores." },
      ],
    },
  },
  {
    seconds: 10,
    slug: "10-seconds",
    name: { ru: "10 секунд", en: "10 seconds" },
    title: { ru: "Тест скорости кликов за 10 секунд — CPS тест", en: "10 second CPS test — clicks in 10 seconds" },
    h1: { ru: "Тест скорости кликов за 10 секунд", en: "10 second CPS test" },
    description: {
      ru: "Классический CPS тест на 10 секунд: 60–70 кликов — средний уровень, 100 и больше — уровень джиттер-клика. Счётчик, CPS в реальном времени и личный рекорд.",
      en: "The classic 10 second CPS test: 60–70 clicks is average, 100 or more is jitter-click territory. Live click counter, real-time CPS and your personal best.",
    },
    lead: { ru: "За 10 секунд средний результат — 60–70 кликов, то есть 6–7 CPS.", en: "An average 10-second score is 60–70 clicks, or 6–7 CPS." },
    typical: [60, 70],
    about: {
      ru: "Десять секунд — стандартная длительность CPS теста: случайный лишний клик меняет результат всего на 0,1 CPS, а рука ещё не успевает серьёзно устать. Поэтому результаты 10-секундного теста удобнее всего сравнивать с друзьями и между разными техниками клика.",
      en: "Ten seconds is the standard CPS test length: a stray click changes the score by only 0.1 CPS, and your hand doesn't have time to tire badly. That makes 10-second results the easiest to compare with friends and between clicking techniques.",
    },
    faq: {
      ru: [
        { q: "Сколько кликов за 10 секунд — это нормально?", a: "60–70 кликов (6–7 CPS) — средний результат, 80–100 — быстрый. Больше 100 кликов за 10 секунд набирают те, кто освоил джиттер-клик или баттерфляй." },
        { q: "Почему 10 секунд — самый популярный тест?", a: "Этого достаточно, чтобы случайная ошибка почти не влияла на результат, и недостаточно, чтобы сильно устать. Поэтому именно 10-секундные результаты чаще всего сравнивают между собой." },
      ],
      en: [
        { q: "How many clicks in 10 seconds is normal?", a: "60–70 clicks (6–7 CPS) is average and 80–100 is fast. More than 100 clicks in 10 seconds usually means jitter or butterfly clicking." },
        { q: "Why is 10 seconds the most popular length?", a: "It's long enough that a stray click hardly matters and short enough that fatigue doesn't dominate, so 10-second scores are the ones people compare most." },
      ],
    },
  },
  {
    seconds: 30,
    slug: "30-seconds",
    name: { ru: "30 секунд", en: "30 seconds" },
    title: { ru: "Тест скорости кликов за 30 секунд — проверка выносливости", en: "30 second CPS test — click endurance test" },
    h1: { ru: "Тест скорости кликов за 30 секунд", en: "30 second CPS test" },
    description: {
      ru: "Тест кликов на 30 секунд проверяет выносливость: к концу темп падает, и 6 CPS (около 180 кликов) — хороший результат. Рекорд для 30 секунд хранится отдельно.",
      en: "The 30 second click test measures endurance: pace drops towards the end, so 6 CPS (about 180 clicks) is a good score. Your 30-second best is saved.",
    },
    lead: { ru: "За полминуты хороший результат — около 180 кликов (6 CPS). Кликните по полю, чтобы начать.", en: "A good half-minute score is about 180 clicks (6 CPS). Click the box to start." },
    typical: [150, 180],
    about: {
      ru: "Полуминутный тест проверяет уже не пиковую скорость, а выносливость: во второй половине теста у большинства людей темп снижается на 10–20 %. Выигрывает тот, кто держит ровный ритм с самого начала, а не тот, кто резко стартует.",
      en: "A half-minute test is about endurance rather than peak speed: most people slow down by 10–20 % in the second half. The winner is whoever keeps an even rhythm from the start, not whoever sprints first.",
    },
    faq: {
      ru: [
        { q: "Какой результат хороший для 30 секунд?", a: "Около 180 кликов (6 CPS) — хороший результат для полуминутного теста, 240 и больше (8+ CPS) — отличный. Темп обычно падает во второй половине теста." },
        { q: "Как не выдохнуться за 30 секунд?", a: "Кликайте кончиком пальца, не напрягая кисть, и держите ровный темп с самого начала — резкий старт быстро выматывает. Джиттер-клик на 30 секунд выдерживают немногие." },
      ],
      en: [
        { q: "What is a good 30-second score?", a: "About 180 clicks (6 CPS) is good for a half-minute test, and 240 or more (8+ CPS) is excellent. Pace usually drops in the second half." },
        { q: "How do I keep my pace for 30 seconds?", a: "Click with your fingertip, keep the wrist relaxed and hold an even pace from the first second — a fast start wears you out quickly. Few people can jitter-click for 30 seconds." },
      ],
    },
  },
  {
    seconds: 60,
    slug: "60-seconds",
    name: { ru: "60 секунд", en: "60 seconds" },
    title: { ru: "Тест скорости кликов за 60 секунд (1 минута)", en: "60 second CPS test — clicks in one minute" },
    h1: { ru: "Тест скорости кликов за 1 минуту", en: "60 second CPS test" },
    description: {
      ru: "Минутный тест скорости кликов: сколько раз вы кликнете за 60 секунд. Обычный результат — 300–390 кликов (5–6,5 CPS). Проверка выносливости руки и ровного темпа.",
      en: "One-minute click speed test: how many times can you click in 60 seconds? Typical scores are 300–390 clicks (5–6.5 CPS). It tests hand endurance and pace.",
    },
    lead: { ru: "За минуту обычно получается 300–400 кликов. Кликните по полю — таймер стартует с первого клика.", en: "Most people reach 300–400 clicks in a minute. Click the box — the timer starts with the first click." },
    typical: [300, 390],
    about: {
      ru: "Минута непрерывных кликов — тест на выносливость предплечья и кисти. Средний CPS здесь почти всегда ниже, чем за 10 секунд, поэтому сравнивайте результат только с другими минутными попытками. Если появляется боль или онемение в запястье, остановитесь.",
      en: "A full minute of clicking tests the endurance of your forearm and wrist. Average CPS here is almost always lower than over 10 seconds, so compare only with other one-minute runs. Stop if your wrist starts to hurt or tingle.",
    },
    faq: {
      ru: [
        { q: "Сколько кликов можно сделать за минуту?", a: "Обычно 300–400 (5–6,5 CPS). 500 кликов за минуту (больше 8 CPS) — очень хороший результат: к концу минуты рука устаёт у всех." },
        { q: "Не вредно ли кликать минуту без остановки?", a: "Для здоровой руки один тест безопасен, но частые долгие серии кликов перегружают запястье и сухожилия. Если появились боль или онемение, сделайте перерыв." },
      ],
      en: [
        { q: "How many clicks can you do in a minute?", a: "Usually 300–400 (5–6.5 CPS). 500 clicks in a minute (over 8 CPS) is very good — everyone's hand tires by the end." },
        { q: "Is clicking for a whole minute bad for my hand?", a: "A single test is fine for a healthy hand, but frequent long clicking sessions strain the wrist and tendons. Take a break if you feel pain or numbness." },
      ],
    },
  },
];

function cpsBlocks(v: CpsVariant, locale: Locale): Block[] {
  const n = v.seconds;
  const secs = locale === "ru" ? `${n} ${plural("ru", n, ["секунду", "секунды", "секунд"])}` : `${n} ${n === 1 ? "second" : "seconds"}`;
  const clicksWord = (k: number) => (locale === "ru" ? plural("ru", k, ["клик", "клика", "кликов"]) : k === 1 ? "click" : "clicks");
  const f = (x: number) => formatNumber(locale, x, { maximumFractionDigits: 1 });
  const [lo, hi] = v.typical;
  const rows = CPS_RANKS.map((r, i) => {
    const next = CPS_RANKS[i + 1]?.min;
    const cpsRange = next ? `${r.min}–${next}` : `${r.min}+`;
    const clicks = next ? `${f(r.min * n)}–${f(next * n)}` : `${f(r.min * n)}+`;
    return [CPS_RANK_LABELS[locale][r.id], cpsRange, clicks];
  });
  return locale === "ru"
    ? [
        {
          type: "facts",
          title: "Коротко",
          rows: [
            ["Длительность теста", secs],
            ["Обычный результат", `${lo}–${hi} ${clicksWord(hi)} (${f(lo / n)}–${f(hi / n)} CPS)`],
            ["Быстрый результат", `${f(10 * n)} ${clicksWord(10 * n)} (10 CPS)`],
            ["Формула", `CPS = клики ÷ ${n}`],
          ],
        },
        { type: "table", title: `Уровни для теста за ${secs}`, head: ["Уровень", "CPS", `Кликов за ${n} с`], rows },
        { type: "text", title: `Что показывает тест за ${secs}`, paragraphs: [v.about.ru] },
      ]
    : [
        {
          type: "facts",
          title: "Quick facts",
          rows: [
            ["Test length", secs],
            ["Typical result", `${lo}–${hi} clicks (${f(lo / n)}–${f(hi / n)} CPS)`],
            ["Fast result", `${f(10 * n)} ${clicksWord(10 * n)} (10 CPS)`],
            ["Formula", `CPS = clicks ÷ ${n}`],
          ],
        },
        { type: "table", title: `Ranks for the ${n}-second test`, head: ["Rank", "CPS", `Clicks in ${n} s`], rows },
        { type: "text", title: `What the ${n}-second test shows`, paragraphs: [v.about.en] },
      ];
}

export const clickSpeedTool: ToolDef = {
  slug: "click-speed-test",
  seoAlt: { ru: ["тест CPS онлайн", "CPS тест"], en: ["CPS test online", "CPS test"] },
  component: "test/click-speed",
  icon: "MousePointerClick",
  popular: true,
  props: { seconds: 10 },
  name: { ru: "Тест скорости кликов (CPS)", en: "CPS test" },
  title: { ru: "Тест скорости кликов (CPS) — кликов в секунду онлайн", en: "CPS test — clicks per second speed test online" },
  h1: { ru: "Тест скорости кликов (CPS)", en: "CPS test — clicks per second" },
  description: {
    ru: "Сколько кликов в секунду вы делаете? Тесты на 1, 5, 10, 30 и 60 секунд, подсчёт CPS, рекорд для каждой длительности и уровень от «неспешно» до «баттерфляй».",
    en: "How many clicks per second can you do? 1, 5, 10, 30 and 60-second modes, live CPS, a personal best for each duration and a rank from relaxed to butterfly.",
  },
  lead: {
    ru: "Кликайте по полю как можно быстрее — таймер стартует с первого клика, результат в кликах в секунду.",
    en: "Click the box as fast as you can — the timer starts on the first click and your score is in clicks per second.",
  },
  keywords: {
    ru: ["кликер тест", "cps тест", "кликов в секунду", "тест кликов", "скорость клика", "баттерфляй клик"],
    en: ["click speed test", "clicks per second", "cps tester", "click test", "jitter click test"],
  },
  howTo: {
    ru: [
      "Выберите длительность: 1, 5, 10, 30 или 60 секунд (по умолчанию 10).",
      "Кликните по большому полю — отсчёт начнётся с первого нажатия.",
      "Кликайте как можно быстрее, пока не закончится время. Можно касаться экрана или нажимать пробел.",
      "Посмотрите результат: клики, CPS и уровень. Лучший результат для каждой длительности сохраняется в браузере.",
    ],
    en: [
      "Choose a length: 1, 5, 10, 30 or 60 seconds (10 by default).",
      "Click the big box — the countdown starts with the first press.",
      "Click as fast as you can until time runs out. Tapping the screen or pressing space works too.",
      "Check your clicks, CPS and rank. The best result for each length is saved in your browser.",
    ],
  },
  about: {
    ru: [
      "CPS (clicks per second) — число кликов, делённое на длительность теста: 57 кликов за 10 секунд дают 5,7 CPS. Считаются нажатия основной кнопки мыши, касания экрана и нажатия пробела или Enter (удержание клавиши с автоповтором не засчитывается).",
      "Обычный клик даёт 6–7 CPS. Джиттер-клик (быстрое напряжение мышц предплечья) — 10–14 CPS, баттерфляй-клик (поочерёдно двумя пальцами по одной кнопке) — 15–25 CPS и больше. В коротком тесте результат выше: рука ещё не устала.",
      "Рекорды хранятся только в localStorage вашего браузера и никуда не отправляются. Тест не отличает автокликер от человека — он просто считает нажатия.",
    ],
    en: [
      "CPS (clicks per second) is the number of clicks divided by the test length: 57 clicks in 10 seconds is 5.7 CPS. Primary mouse-button presses, screen taps and space or Enter presses count (holding a key with auto-repeat doesn't).",
      "A normal click gives 6–7 CPS. Jitter clicking (rapidly tensing the forearm) reaches 10–14 CPS, and butterfly clicking (two fingers alternating on one button) 15–25 CPS or more. Short tests score higher because the hand hasn't tired yet.",
      "Best scores are kept only in your browser's localStorage and never sent anywhere. The test doesn't try to tell an autoclicker from a human — it simply counts presses.",
    ],
  },
  faq: {
    ru: [
      { q: "Какой CPS считается хорошим?", a: "Для обычного клика 6–8 CPS — средний уровень, 8–10 — быстро. Больше 10 CPS обычно получается только с джиттер- или баттерфляй-кликом, а больше 20 — редкость даже среди опытных игроков." },
      { q: "Как кликать быстрее?", a: "Держите кисть расслабленной и кликайте кончиком пальца. Джиттер-клик — быстрое напряжение предплечья, баттерфляй — чередование указательного и среднего пальцев на одной кнопке. Делайте перерывы: долгие серии кликов нагружают запястье." },
      { q: "Почему у каждой длительности свой рекорд?", a: "За 1 секунду можно выдать максимальный темп, а за 60 секунд рука устаёт, и средний CPS падает. Результаты разных тестов сравнивать нельзя, поэтому лучший результат хранится отдельно для каждого режима." },
      { q: "Засчитываются ли клики автокликера?", a: "Тест не пытается распознать автокликер и считает любые нажатия. Честный результат — только ваши собственные клики." },
    ],
    en: [
      { q: "What is a good CPS?", a: "With a normal click, 6–8 CPS is average and 8–10 is fast. More than 10 CPS usually takes jitter or butterfly clicking, and more than 20 is rare even among experienced players." },
      { q: "How can I click faster?", a: "Keep your wrist relaxed and click with your fingertip. Jitter clicking means rapidly tensing the forearm; butterfly clicking alternates the index and middle fingers on one button. Take breaks — long clicking sessions strain the wrist." },
      { q: "Why does each length have its own best?", a: "You can hit peak pace for 1 second, but over 60 seconds your hand tires and average CPS drops. Results of different lengths aren't comparable, so each mode keeps its own best." },
      { q: "Do autoclicker clicks count?", a: "The test doesn't try to detect autoclickers and counts every press. An honest score is your own clicks only." },
    ],
  },
  variants: {
    title: { ru: "Длительность теста", en: "Test length" },
    list: (): VariantDef[] =>
      CPS_VARIANTS.map((v) => ({
        slug: v.slug,
        name: v.name,
        title: v.title,
        h1: v.h1,
        description: v.description,
        lead: v.lead,
        props: { seconds: v.seconds },
        keywords: {
          ru: [`кликов за ${v.seconds} ${plural("ru", v.seconds, ["секунду", "секунды", "секунд"])}`, `cps ${v.seconds}`],
          en: [`clicks in ${v.seconds} seconds`, `${v.seconds} second click test`],
        },
        blocks: (locale) => cpsBlocks(v, locale),
        faq: v.faq,
      })),
  },
};

/* ───────────── Typing speed ───────────── */

const TYPING_LEVELS: { ru: string; en: string; wpm: number }[] = [
  { ru: "Начинающий", en: "Beginner", wpm: 20 },
  { ru: "Средний", en: "Average", wpm: 40 },
  { ru: "Уверенный", en: "Proficient", wpm: 60 },
  { ru: "Быстрый", en: "Fast", wpm: 80 },
  { ru: "Профессионал", en: "Expert", wpm: 100 },
];

interface TypingVariant {
  minutes: 1 | 3 | 5;
  slug: string;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  about: L10n;
  faq: Record<Locale, QA[]>;
}

const TYPING_VARIANTS: TypingVariant[] = [
  {
    minutes: 1,
    slug: "1-minute",
    name: { ru: "1 минута", en: "1 minute" },
    title: { ru: "Тест скорости печати за 1 минуту — знаков в минуту", en: "1 minute typing test — WPM in 60 seconds" },
    h1: { ru: "Тест скорости печати за 1 минуту", en: "1 minute typing test" },
    description: {
      ru: "Минутный тест печати на русском или английском: 200 знаков в минуту (40 WPM) — средний уровень, 300 — уверенный. Точность учитывает даже исправленные ошибки.",
      en: "One-minute typing test in English or Russian: 40 WPM (200 characters a minute) is average, 60 WPM is fast. Accuracy counts every mistake, even corrected ones.",
    },
    lead: { ru: "Печатайте 60 секунд — средний результат около 200 знаков в минуту.", en: "Type for 60 seconds — the average result is about 40 WPM." },
    about: {
      ru: "Минута — самый популярный формат: результат легко сравнивать, а сосредоточенности хватает на весь тест. Зато он чуть завышает скорость — на длинной дистанции темп и точность обычно немного падают.",
      en: "One minute is the most popular format: results are easy to compare and you can stay focused the whole time. It slightly flatters your speed, though — over longer runs pace and accuracy usually dip a little.",
    },
    faq: {
      ru: [
        { q: "Сколько знаков в минуту — хорошая скорость?", a: "Около 200 знаков в минуту (40 WPM) — средний уровень, 300 (60 WPM) — уверенный, 400 и больше (80+ WPM) — профессиональный." },
        { q: "Почему минутный результат выше, чем трёхминутный?", a: "За минуту легко удержать максимальный темп и концентрацию. На длинной дистанции скорость и точность немного падают, поэтому для реальной оценки пройдите и тест на 3 или 5 минут." },
      ],
      en: [
        { q: "What is a good typing speed for one minute?", a: "About 40 WPM (200 characters per minute) is average, 60 WPM is proficient and 80 WPM or more is professional level." },
        { q: "Why is my one-minute score higher than my three-minute one?", a: "It's easy to hold top speed and focus for a minute. Over longer runs speed and accuracy dip slightly, so try the 3 or 5-minute test for a more realistic figure." },
      ],
    },
  },
  {
    minutes: 3,
    slug: "3-minutes",
    name: { ru: "3 минуты", en: "3 minutes" },
    title: { ru: "Тест скорости печати на 3 минуты — скорость и точность", en: "3 minute typing test — speed and accuracy" },
    h1: { ru: "Тест скорости печати на 3 минуты", en: "3 minute typing test" },
    description: {
      ru: "Тест печати на 3 минуты: около 600 знаков при средней скорости 200 зн/мин. Он длиннее минутного, поэтому точнее показывает ваш реальный темп и точность набора.",
      en: "3 minute typing test: about 600 characters at an average 40 WPM. It's longer than a one-minute sprint, so it shows your real pace and accuracy more reliably.",
    },
    lead: { ru: "За 3 минуты при средней скорости набирается около 600 знаков.", en: "At an average speed you'll type about 600 characters in 3 minutes." },
    about: {
      ru: "Три минуты — золотая середина: достаточно долго, чтобы случайные ошибки и удачные слова не искажали результат, и не так утомительно, как пятиминутный тест. Этот формат часто используют при проверке навыков набора.",
      en: "Three minutes is the sweet spot: long enough that lucky words and random slips don't skew the result, yet less tiring than five minutes. It's a common format for typing skill checks.",
    },
    faq: {
      ru: [
        { q: "Сколько текста нужно набрать за 3 минуты?", a: "При средней скорости 200 зн/мин — около 600 знаков, это примерно 80–90 слов по-русски. При 300 зн/мин — около 900 знаков." },
        { q: "Зачем проходить тест на 3 минуты, если есть минутный?", a: "Минутный тест показывает рывок, трёхминутный — рабочий темп. Разница между ними подсказывает, насколько быстро вы устаёте и теряете точность." },
      ],
      en: [
        { q: "How much text is typed in 3 minutes?", a: "At an average 40 WPM, about 600 characters — 120 standard five-character words. At 60 WPM, about 900 characters." },
        { q: "Why take a 3-minute test if there's a 1-minute one?", a: "The one-minute test shows a sprint; three minutes shows your working pace. The gap between them tells you how quickly you tire and lose accuracy." },
      ],
    },
  },
  {
    minutes: 5,
    slug: "5-minutes",
    name: { ru: "5 минут", en: "5 minutes" },
    title: { ru: "Тест скорости печати на 5 минут — устойчивый темп", en: "5 minute typing test — sustained typing speed" },
    h1: { ru: "Тест скорости печати на 5 минут", en: "5 minute typing test" },
    description: {
      ru: "Пятиминутный тест скорости печати: около 1000 знаков при 200 зн/мин. Показывает устойчивую скорость — темп, который вы держите при реальной работе с текстом.",
      en: "5 minute typing test: about 1,000 characters at 40 WPM. It shows your sustained speed — the pace you actually keep up when writing real text.",
    },
    lead: { ru: "Пять минут без остановки — около 1000 знаков при средней скорости.", en: "Five minutes non-stop — about 1,000 characters at an average speed." },
    about: {
      ru: "Пять минут — проверка выносливости: в таком тесте видно, как меняются темп и точность, когда первое волнение прошло и появилась усталость. Результат ближе всего к скорости, с которой вы пишете письма и документы.",
      en: "Five minutes tests endurance: you can see how pace and accuracy change once the initial adrenaline fades and fatigue sets in. The result is closest to the speed at which you write emails and documents.",
    },
    faq: {
      ru: [
        { q: "Сколько знаков печатают за 5 минут?", a: "При 200 зн/мин — около 1000 знаков, это больше половины стандартной страницы (1800 знаков с пробелами). Профессионал со скоростью 400 зн/мин наберёт больше целой страницы." },
        { q: "Почему к концу теста падает точность?", a: "Утомление и потеря концентрации. Держите ровный ритм, не торопитесь в начале и не смотрите на клавиатуру — это экономит силы на всю дистанцию." },
      ],
      en: [
        { q: "How many characters can you type in 5 minutes?", a: "At 40 WPM about 1,000 characters — more than half a standard 1,800-character page. An expert at 80 WPM types over a full page." },
        { q: "Why does accuracy drop towards the end?", a: "Fatigue and loss of focus. Keep an even rhythm, don't rush at the start and avoid looking at the keyboard — it saves energy for the whole run." },
      ],
    },
  },
];

function typingBlocks(v: TypingVariant, locale: Locale): Block[] {
  const m = v.minutes;
  const f = (x: number) => formatNumber(locale, x);
  const rows = TYPING_LEVELS.map((l) => [l[locale], f(l.wpm), f(l.wpm * 5), f(l.wpm * 5 * m)]);
  const mins = locale === "ru" ? `${m} ${plural("ru", m, ["минута", "минуты", "минут"])}` : `${m} ${m === 1 ? "minute" : "minutes"}`;
  const minsAcc = `${m} ${plural("ru", m, ["минуту", "минуты", "минут"])}`;
  return locale === "ru"
    ? [
        {
          type: "facts",
          title: "Коротко",
          rows: [
            ["Длительность", mins],
            ["Средняя скорость", `200 знаков в минуту (40 WPM) — около ${f(200 * m)} знаков за тест`],
            ["WPM", "правильные знаки ÷ 5 ÷ минуты"],
            ["Точность", "каждое неверное нажатие, даже исправленное"],
          ],
        },
        { type: "table", title: `Уровни скорости печати за ${minsAcc}`, head: ["Уровень", "WPM", "Знаков в минуту", `Знаков за ${m} мин`], rows },
        { type: "text", title: `Чем полезен тест на ${minsAcc}`, paragraphs: [v.about.ru] },
      ]
    : [
        {
          type: "facts",
          title: "Quick facts",
          rows: [
            ["Length", mins],
            ["Average speed", `40 WPM (200 characters per minute) — about ${f(200 * m)} characters per test`],
            ["WPM", "correct characters ÷ 5 ÷ minutes"],
            ["Accuracy", "every wrong keystroke counts, even if corrected"],
          ],
        },
        { type: "table", title: `Typing speed levels for ${mins}`, head: ["Level", "WPM", "Characters per minute", `Characters in ${m} min`], rows },
        { type: "text", title: `Why take the ${m}-minute test`, paragraphs: [v.about.en] },
      ];
}

export const typingTool: ToolDef = {
  slug: "typing-speed-test",
  component: "test/typing",
  icon: "Keyboard",
  popular: true,
  props: { seconds: 60 },
  name: { ru: "Тест скорости печати", en: "Typing speed test" },
  title: { ru: "Тест скорости печати онлайн — знаков в минуту и WPM", en: "Typing speed test — check your WPM online" },
  h1: { ru: "Тест скорости печати", en: "Typing speed test" },
  description: {
    ru: "Проверьте скорость печати на русском и английском: знаки и слова в минуту, точность с учётом исправленных ошибок, режимы на 1, 3 и 5 минут или целый текст.",
    en: "Check your typing speed in English or Russian: WPM and characters per minute, accuracy that counts corrected mistakes, 1, 3 and 5-minute or full-text modes.",
  },
  lead: {
    ru: "Начните печатать текст в поле ввода — таймер запустится с первой буквы.",
    en: "Start typing the text in the box — the timer starts with your first keystroke.",
  },
  keywords: {
    ru: ["скорость печати", "тест печати", "знаков в минуту", "проверить скорость набора", "тест скорости набора текста"],
    en: ["typing test", "wpm test", "typing speed", "words per minute test", "keyboard speed test"],
  },
  howTo: {
    ru: [
      "Выберите язык текста и режим: 1, 3, 5 минут или весь текст.",
      "Щёлкните в поле ввода и начните печатать — отсчёт пойдёт с первого символа.",
      "Ошибки подсвечиваются красным. Их можно исправить Backspace, но в точности они всё равно учитываются.",
      "После финиша посмотрите скорость, точность и число ошибок, затем попробуйте другой текст.",
    ],
    en: [
      "Choose the text language and a mode: 1, 3 or 5 minutes or the full text.",
      "Click the input box and start typing — the clock starts with the first character.",
      "Mistakes are highlighted in red. You can fix them with Backspace, but they still count against accuracy.",
      "When you finish, check your speed, accuracy and mistakes, then try another text.",
    ],
  },
  about: {
    ru: [
      "Скорость считается по правильно набранным символам: знаки в минуту — правильные символы за минуту, WPM — то же, делённое на 5 (стандартное «слово» из 5 знаков с пробелами). 250 правильных символов за минуту — это 250 зн/мин или 50 WPM.",
      "Точность учитывает каждое неверное нажатие, даже исправленное: если из 200 нажатий 10 были ошибочными, точность — 95 %. Исправление тоже отнимает время, поэтому такой подсчёт честнее.",
      "Тексты написаны специально для теста — 12 русских и 12 английских разной длины. Буква «ё» засчитывается и при наборе «е», вставка из буфера обмена отключена.",
    ],
    en: [
      "Speed counts correctly typed characters: characters per minute (CPM) is correct characters per minute, and WPM is the same divided by 5 (a standard “word” of 5 characters including spaces). 250 correct characters in a minute is 250 CPM or 50 WPM.",
      "Accuracy counts every wrong keystroke, even if you fixed it: 10 wrong out of 200 keystrokes means 95 % accuracy. Corrections cost time too, so this is the honest way to count.",
      "The texts were written for this test — 12 in English and 12 in Russian, of different lengths. Pasting from the clipboard is disabled.",
    ],
  },
  faq: {
    ru: [
      { q: "Какая скорость печати считается хорошей?", a: "Средняя скорость набора на компьютере — около 200 знаков в минуту (40 WPM). 300 зн/мин (60 WPM) — уверенный уровень для работы с текстом, 400 и больше (80+ WPM) — профессиональный." },
      { q: "Чем WPM отличается от знаков в минуту?", a: "Знаки в минуту — сколько правильных символов (включая пробелы) вы набираете за минуту. WPM (words per minute) — то же число, делённое на 5: так удобно сравнивать тексты с разной длиной слов." },
      { q: "Почему точность ниже 100 %, хотя я всё исправил?", a: "Точность считает все нажатия: ошибочная буква, стёртая Backspace, всё равно была ошибкой. Поэтому исправленный текст может быть полностью верным, а точность — 95 %." },
      { q: "Как научиться печатать быстрее?", a: "Освойте слепой десятипальцевый метод: указательные пальцы на буквах А и О (F и J), каждый палец отвечает за свои клавиши. Сначала добивайтесь точности — скорость придёт с практикой. 15–20 минут в день дают заметный рост за несколько недель." },
    ],
    en: [
      { q: "What is a good typing speed?", a: "The average computer user types about 40 WPM (200 characters per minute). 60 WPM is a solid level for text-heavy work, and 80 WPM or more is professional." },
      { q: "What's the difference between WPM and CPM?", a: "CPM is how many correct characters (including spaces) you type per minute. WPM is that number divided by 5, which makes texts with different word lengths comparable." },
      { q: "Why is my accuracy below 100 % if I fixed everything?", a: "Accuracy counts every keystroke: a wrong letter deleted with Backspace was still a mistake. So your final text can be perfect while accuracy is 95 %." },
      { q: "How can I type faster?", a: "Learn touch typing: index fingers rest on F and J, and each finger owns its own keys. Aim for accuracy first — speed follows with practice. 15–20 minutes a day brings noticeable gains within a few weeks." },
    ],
  },
  variants: {
    title: { ru: "Длительность", en: "Length" },
    list: (): VariantDef[] =>
      TYPING_VARIANTS.map((v) => ({
        slug: v.slug,
        name: v.name,
        title: v.title,
        h1: v.h1,
        description: v.description,
        lead: v.lead,
        props: { seconds: v.minutes * 60 },
        keywords: {
          ru: [`тест печати ${v.minutes} мин`, `скорость печати за ${v.minutes} ${plural("ru", v.minutes, ["минуту", "минуты", "минут"])}`],
          en: [`${v.minutes} minute typing test`, `wpm ${v.minutes} min`],
        },
        blocks: (locale) => typingBlocks(v, locale),
        faq: v.faq,
      })),
  },
};

/* ───────────── Reaction time ───────────── */

export const reactionTool: ToolDef = {
  slug: "reaction-time-test",
  component: "test/reaction",
  icon: "Zap",
  name: { ru: "Тест реакции", en: "Reaction time test" },
  title: { ru: "Тест на скорость реакции онлайн — время реакции в мс", en: "Reaction time test — measure your reflexes in ms" },
  h1: { ru: "Тест на скорость реакции", en: "Reaction time test" },
  description: {
    ru: "Проверьте скорость реакции: дождитесь зелёного цвета и кликните. 5 попыток со случайной задержкой 1,5–4 с, среднее и лучшее время в мс, защита от фальстарта.",
    en: "Measure your reaction time: wait for green, then click. 5 attempts with a random 1.5–4 s delay, average and best time in ms, and false-start detection.",
  },
  lead: {
    ru: "Когда поле станет зелёным, кликните как можно быстрее — у большинства людей это 200–300 мс.",
    en: "When the box turns green, click as fast as you can — most people land between 200 and 300 ms.",
  },
  keywords: {
    ru: ["тест реакции", "скорость реакции", "проверить реакцию", "время реакции", "тест рефлексов"],
    en: ["reaction test", "reflex test", "reaction speed", "human benchmark reaction"],
  },
  howTo: {
    ru: [
      "Нажмите на поле — оно станет красным.",
      "Дождитесь зелёного цвета: задержка случайная, от 1,5 до 4 секунд.",
      "Сразу кликните, коснитесь экрана или нажмите пробел. Нажатие до сигнала — фальстарт, попытка не засчитывается.",
      "После 5 попыток посмотрите среднее, лучшее и худшее время.",
    ],
    en: [
      "Click the box — it turns red.",
      "Wait for green: the delay is random, between 1.5 and 4 seconds.",
      "Click, tap or press space immediately. Pressing before the signal is a false start and doesn't count.",
      "After 5 attempts, check your average, best and worst times.",
    ],
  },
  about: {
    ru: [
      "Время измеряется функцией performance.now() с точностью до долей миллисекунды — от кадра, в котором браузер рисует зелёный цвет, до события нажатия. Задержку перед сигналом выбирает криптографический генератор случайных чисел, поэтому её невозможно предугадать.",
      "В результат входит не только ваша реакция, но и задержка оборудования: мышь или сенсорный экран, монитор и его частота обновления. На игровом мониторе с высокой частотой результат обычно на несколько миллисекунд лучше, чем на офисном 60 Гц.",
      "Реакция на зрительный сигнал у большинства людей — 200–300 мс. Она ухудшается при усталости и недосыпе и немного улучшается с тренировкой и разминкой.",
    ],
    en: [
      "Time is measured with performance.now() to a fraction of a millisecond — from the frame in which the browser paints green to your press. The delay before the signal comes from a cryptographic random generator, so it can't be predicted.",
      "The result includes not just your reaction but hardware latency: the mouse or touchscreen, the monitor and its refresh rate. On a high-refresh gaming monitor scores are typically a few milliseconds better than on a 60 Hz office screen.",
      "Most people react to a visual signal in 200–300 ms. Reaction slows when you're tired or short of sleep and improves slightly with practice and a warm-up.",
    ],
  },
  faq: {
    ru: [
      { q: "Какое время реакции считается нормальным?", a: "В этом тесте у большинства людей получается 200–300 мс. Меньше 200 мс — отличный результат, больше 350 мс — повод отдохнуть и попробовать снова." },
      { q: "Почему на телефоне результат хуже?", a: "Сенсорные экраны сканируют касания с задержкой, а браузер на телефоне может добавлять ещё несколько миллисекунд. Сравнивайте результаты, полученные на одном и том же устройстве." },
      { q: "Что такое фальстарт?", a: "Нажатие до того, как поле стало зелёным. Такая попытка не засчитывается: задержка случайная, и угадать момент сигнала нельзя." },
      { q: "Можно ли улучшить скорость реакции?", a: "Немного — да: высыпайтесь, делайте разминку и тренируйтесь регулярно. Также помогает монитор с высокой частотой обновления и проводная мышь — они уменьшают задержку оборудования." },
    ],
    en: [
      { q: "What is a normal reaction time?", a: "Most people score 200–300 ms in this test. Under 200 ms is excellent; over 350 ms suggests you should rest and try again." },
      { q: "Why is my score worse on a phone?", a: "Touchscreens scan for touches with some delay, and mobile browsers can add a few milliseconds more. Compare only results from the same device." },
      { q: "What is a false start?", a: "Pressing before the box turns green. That attempt doesn't count: the delay is random, so the signal can't be anticipated." },
      { q: "Can I improve my reaction time?", a: "A little: sleep well, warm up and practise regularly. A high-refresh monitor and a wired mouse also help by cutting hardware latency." },
    ],
  },
};
