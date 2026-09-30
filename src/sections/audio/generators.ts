import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { INSTRUMENTS } from "./data/instruments";
import { TONES } from "./data/tones";
import { BPMS, INSTRUMENT_TEXTS, NOISES } from "./data/variants";
import { noteLengths, tempoMarking } from "./lib/bpm";
import { NOISE_SLOPE } from "./lib/noise";
import { midiToFreq, NOTE_NAMES_RU, noteOf, parseNote } from "./lib/pitch";

const fmt = (locale: Locale, n: number, digits = 2) => formatNumber(locale, n, { maximumFractionDigits: digits });
const OCTAVE_RU = ["субконтроктавы", "контроктавы", "большой октавы", "малой октавы", "первой октавы", "второй октавы", "третьей октавы", "четвёртой октавы", "пятой октавы"];

function noteText(locale: Locale, midi: number): string {
  const idx = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const sci = `${noteOf(midiToFreq(midi)).name}${octave}`;
  return locale === "ru" ? `${NOTE_NAMES_RU[idx].toLowerCase()} ${OCTAVE_RU[octave + 1] ?? ""} (${sci})`.replace(" )", ")") : sci;
}

/* ───────────── tone generator variants ───────────── */

const HEARING: [number, string, string][] = [
  [8000, "почти все", "almost everyone"],
  [12000, "примерно до 50 лет", "roughly up to 50"],
  [15000, "примерно до 40–50 лет", "roughly up to 40–50"],
  [16000, "примерно до 30–40 лет", "roughly up to 30–40"],
  [17400, "примерно до 20–25 лет", "roughly up to 20–25"],
  [19000, "в основном до 20 лет", "mostly under 20"],
];

function toneVariants(): VariantDef[] {
  return TONES.map((t) => ({
    slug: `${t.hz}-hz`,
    name: { ru: `${formatNumber("ru", t.hz)} Гц`, en: `${formatNumber("en", t.hz)} Hz` },
    title: t.title,
    h1: t.h1,
    description: t.description,
    lead: t.lead,
    props: { freq: t.hz },
    keywords: { ru: [`${t.hz} гц`, `звук ${t.hz} гц`, `частота ${t.hz} гц`, `тон ${t.hz}`], en: [`${t.hz} hz`, `${t.hz} hz tone`, `${t.hz} hz sound`, `${t.hz} hz frequency`] },
    blocks: (locale) => {
      const ru = locale === "ru";
      const n = noteOf(t.hz);
      const blocks: Block[] = [
        {
          type: "facts",
          title: ru ? `${formatNumber(locale, t.hz)} Гц в цифрах` : `${formatNumber(locale, t.hz)} Hz in numbers`,
          rows: [
            [ru ? "Период колебания" : "Period", t.hz >= 1000 ? `${fmt(locale, 1000 / t.hz, 3)} ${ru ? "мс" : "ms"}` : `${fmt(locale, 1000 / t.hz, 2)} ${ru ? "мс" : "ms"}`],
            [ru ? "Длина волны в воздухе (20 °C)" : "Wavelength in air (20 °C)", 343 / t.hz >= 1 ? `${fmt(locale, 343 / t.hz, 2)} ${ru ? "м" : "m"}` : `${fmt(locale, 34300 / t.hz, 1)} ${ru ? "см" : "cm"}`],
            [ru ? "Ближайшая нота" : "Nearest note", `${noteText(locale, n.midi)}${Math.abs(n.cents) >= 1 ? `, ${n.cents > 0 ? "+" : "−"}${fmt(locale, Math.abs(Math.round(n.cents)), 0)} ${ru ? "центов" : "cents"}` : ""}`],
            [ru ? "Колебаний за минуту" : "Cycles per minute", formatNumber(locale, t.hz * 60)],
          ],
        },
        { type: "text", title: ru ? `О частоте ${formatNumber(locale, t.hz)} Гц` : `About ${formatNumber(locale, t.hz)} Hz`, paragraphs: [t.about[locale]] },
      ];
      if (t.hz >= 8000)
        blocks.push({
          type: "table",
          title: ru ? "Кто слышит высокие частоты (ориентировочно)" : "Who hears high frequencies (approximate)",
          head: [ru ? "Частота" : "Frequency", ru ? "Обычно слышат" : "Usually heard by"],
          rows: HEARING.map(([f, r, e]) => [`${formatNumber(locale, f)} ${ru ? "Гц" : "Hz"}`, ru ? r : e]),
          caption: ru ? "По популярным тестам слуха; у каждого индивидуально" : "From popular hearing tests; individual results vary",
        });
      return blocks;
    },
    faq: {
      ru: [
        { q: t.faq.q.ru, a: t.faq.a.ru },
        { q: `Как долго можно слушать тон ${formatNumber("ru", t.hz)} Гц?`, a: "На комфортной громкости — сколько нужно для проверки, обычно достаточно нескольких секунд. Громкие чистые тоны, особенно высокие и в наушниках, утомляют слух: делайте паузы и не повышайте громкость, если звук кажется тихим из-за динамика." },
      ],
      en: [
        { q: t.faq.q.en, a: t.faq.a.en },
        { q: `How long can I listen to a ${formatNumber("en", t.hz)} Hz tone?`, a: "At a comfortable volume, as long as the test needs — usually a few seconds. Loud pure tones, especially high ones in headphones, tire your hearing: take breaks and don't turn it up just because your speaker plays it quietly." },
      ],
    },
  }));
}

/* ───────────── noise variants ───────────── */

function noiseVariants(): VariantDef[] {
  return NOISES.map((n) => ({
    slug: `${n.color}-noise`,
    name: n.name,
    title: n.title,
    h1: n.name,
    description: n.description,
    lead: n.lead,
    props: { color: n.color },
    keywords: { ru: [n.name.ru.toLowerCase(), `${n.name.ru.toLowerCase()} слушать`, `${n.name.ru.toLowerCase()} для сна`], en: [n.name.en.toLowerCase(), `${n.name.en.toLowerCase()} for sleep`, `${n.name.en.toLowerCase()} generator`] },
    blocks: (locale) => {
      const ru = locale === "ru";
      const s = NOISE_SLOPE[n.color];
      const psd: Record<string, string> = { white: "const", pink: "1/f", brown: "1/f²", blue: "f", violet: "f²" };
      return [
        {
          type: "facts",
          title: ru ? `${n.name.ru}: характеристики` : `${n.name.en}: characteristics`,
          rows: [
            [ru ? "Наклон спектра" : "Spectral slope", `${s > 0 ? "+" : s < 0 ? "−" : ""}${Math.abs(s)} ${ru ? "дБ на октаву" : "dB per octave"}`],
            [ru ? "Спектральная плотность" : "Power spectral density", `∝ ${psd[n.color]}`],
            [ru ? "Похож на" : "Sounds like", n.sounds[locale]],
            [ru ? "Для чего" : "Used for", n.uses[locale]],
          ],
        },
        { type: "text", title: ru ? `Что такое ${n.name.ru.toLowerCase()}` : `What is ${n.name.en.toLowerCase()}`, paragraphs: [n.about[locale]] },
        {
          type: "table",
          title: ru ? "Цвета шума: сравнение" : "Noise colours compared",
          head: [ru ? "Цвет" : "Colour", ru ? "Наклон" : "Slope", ru ? "Похож на" : "Sounds like"],
          rows: NOISES.map((x) => [x.name[locale], `${NOISE_SLOPE[x.color] > 0 ? "+" : NOISE_SLOPE[x.color] < 0 ? "−" : ""}${Math.abs(NOISE_SLOPE[x.color])} ${ru ? "дБ/окт" : "dB/oct"}`, x.sounds[locale]]),
        },
      ];
    },
    faq: { ru: [{ q: n.faq.q.ru, a: n.faq.a.ru }], en: [{ q: n.faq.q.en, a: n.faq.a.en }] },
  }));
}

/* ───────────── metronome variants ───────────── */

function bpmVariants(): VariantDef[] {
  return BPMS.map((b) => {
    const ms = 60000 / b.bpm;
    const mark = tempoMarking(b.bpm);
    const ruBeats = plural("ru", b.bpm, ["удар", "удара", "ударов"]);
    return {
      slug: `${b.bpm}-bpm`,
      name: { ru: `${b.bpm} BPM`, en: `${b.bpm} BPM` },
      title: { ru: `Метроном ${b.bpm} ударов в минуту онлайн — ${b.bpm} BPM`.replace(`${b.bpm} ударов`, `${b.bpm} ${ruBeats}`), en: `Metronome ${b.bpm} BPM online — ${b.bpm} beats per minute` },
      h1: { ru: `Метроном ${b.bpm} BPM`, en: `Metronome ${b.bpm} BPM` },
      description: {
        ru: `Метроном на ${b.bpm} BPM: доля ${formatNumber("ru", Math.round(ms))} мс, темп ${mark}. Размеры 2/4–7/8, восьмые и триоли, акцент на первую долю и таблица длительностей нот.`,
        en: `A ${b.bpm} BPM metronome: ${formatNumber("en", Math.round(ms))} ms per beat, ${mark} tempo. Time signatures 2/4–7/8, eighths and triplets, first-beat accent and a note-length table.`,
      },
      lead: { ru: `${b.bpm} ${ruBeats} в минуту — один удар каждые ${formatNumber("ru", Math.round(ms))} мс.`, en: `${b.bpm} beats per minute — one beat every ${formatNumber("en", Math.round(ms))} ms.` },
      props: { bpm: b.bpm },
      keywords: { ru: [`метроном ${b.bpm}`, `${b.bpm} bpm`, `${b.bpm} ударов в минуту`], en: [`metronome ${b.bpm}`, `${b.bpm} bpm`, `${b.bpm} beats per minute`] },
      blocks: (locale) => {
        const ru = locale === "ru";
        const l = noteLengths(b.bpm);
        const f = (x: number) => `${fmt(locale, x, 1)} ${ru ? "мс" : "ms"}`;
        return [
          {
            type: "facts",
            title: ru ? `${b.bpm} BPM в цифрах` : `${b.bpm} BPM in numbers`,
            rows: [
              [ru ? "Интервал между ударами" : "Time between beats", f(ms)],
              [ru ? "Ударов в секунду" : "Beats per second", `${fmt(locale, b.bpm / 60, 3)} ${ru ? "Гц" : "Hz"}`],
              [ru ? "Итальянский термин" : "Tempo marking", mark],
              [ru ? "Тактов в минуту в размере 4/4" : "Bars per minute in 4/4", fmt(locale, b.bpm / 4, 2)],
              [ru ? "Где встречается" : "Where it's used", b.style[locale]],
            ],
          },
          {
            type: "table",
            title: ru ? `Длительности нот при ${b.bpm} BPM` : `Note lengths at ${b.bpm} BPM`,
            head: [ru ? "Длительность" : "Note", ru ? "Миллисекунды" : "Milliseconds"],
            rows: [
              [ru ? "Целая" : "Whole", f(l.whole)],
              [ru ? "Половинная" : "Half", f(l.half)],
              [ru ? "Четвертная (доля)" : "Quarter (beat)", f(l.quarter)],
              [ru ? "Восьмая с точкой" : "Dotted eighth", f(l.dottedEighth)],
              [ru ? "Восьмая" : "Eighth", f(l.eighth)],
              [ru ? "Триоль восьмыми" : "Eighth triplet", f(l.tripletEighth)],
              [ru ? "Шестнадцатая" : "Sixteenth", f(l.sixteenth)],
            ],
            caption: ru ? "Удобно для настройки задержки (delay) в эффектах" : "Handy for setting delay effect times",
          },
        ];
      },
      faq: {
        ru: [
          { q: `Сколько миллисекунд между ударами при ${b.bpm} BPM?`, a: `${formatNumber("ru", Math.round(ms * 10) / 10)} мс: 60 000 мс в минуте делятся на ${b.bpm} ${ruBeats}. Восьмая нота длится вдвое меньше — ${formatNumber("ru", Math.round(ms / 2 * 10) / 10)} мс.` },
          { q: `Какой это темп по классической шкале?`, a: `${b.bpm} BPM относится к темпу ${mark}. Границы итальянских терминов в разных источниках немного отличаются, поэтому это ориентир, а не правило.` },
        ],
        en: [
          { q: `How many milliseconds are between beats at ${b.bpm} BPM?`, a: `${formatNumber("en", Math.round(ms * 10) / 10)} ms: 60,000 ms in a minute divided by ${b.bpm} beats. An eighth note lasts half that — ${formatNumber("en", Math.round(ms / 2 * 10) / 10)} ms.` },
          { q: "What classical tempo is this?", a: `${b.bpm} BPM falls under ${mark}. Sources draw the boundaries between Italian terms slightly differently, so treat it as a guide rather than a rule.` },
        ],
      },
    };
  });
}

/* ───────────── tuner variants ───────────── */

function tunerVariants(): VariantDef[] {
  return INSTRUMENT_TEXTS.map((it) => ({
    slug: it.id,
    name: it.name,
    title: it.title,
    h1: it.h1,
    description: it.description,
    lead: it.lead,
    props: { instrument: it.id },
    keywords: { ru: [`тюнер для ${it.name.ru.toLowerCase().replace("гитара", "гитары").replace("бас-гитара", "бас-гитары").replace("скрипка", "скрипки").replace("балалайка", "балалайки").replace("домбра", "домбры")}`, `настроить ${it.name.ru.toLowerCase()}`, `строй ${it.name.ru.toLowerCase()}`], en: [`${it.name.en.toLowerCase()} tuner`, `tune ${it.name.en.toLowerCase()}`, `${it.name.en.toLowerCase()} tuning`] },
    blocks: (locale) => {
      const ru = locale === "ru";
      const strings = INSTRUMENTS[it.id].strings;
      return [
        {
          type: "table",
          title: ru ? `Строй: ${it.name.ru.toLowerCase()}` : `${it.name.en} tuning`,
          head: [ru ? "Струна" : "String", ru ? "Нота" : "Note", ru ? "Частота (A4 = 440 Гц)" : "Frequency (A4 = 440 Hz)"],
          rows: strings.map((s, i) => [it.stringNames[locale][i] ?? String(i + 1), s, `${fmt(locale, midiToFreq(parseNote(s)!), 2)} ${ru ? "Гц" : "Hz"}`]),
        },
        { type: "text", title: ru ? "Как настроить" : "How to tune", paragraphs: [it.about[locale]] },
      ];
    },
    faq: { ru: [{ q: it.faq.q.ru, a: it.faq.a.ru }], en: [{ q: it.faq.q.en, a: it.faq.a.en }] },
  }));
}

/* ───────────── tools ───────────── */

const micNote = (locale: Locale): Block => ({
  type: "text",
  title: locale === "ru" ? "Микрофон и приватность" : "Microphone and privacy",
  paragraphs: [
    locale === "ru"
      ? "Звук с микрофона анализируется прямо в браузере и никуда не передаётся и не сохраняется. Доступ к микрофону браузер запрашивает только после нажатия кнопки и отключает его, когда вы выключаете инструмент или закрываете вкладку."
      : "Microphone audio is analysed right in the browser and is never sent or stored. The browser asks for microphone access only after you press the button and releases it when you turn the tool off or close the tab.",
  ],
});

/** Sound generators and microphone tools (tone, noise, metronome, tuner, …). */
export const generatorTools: ToolDef[] = [
  {
    slug: "tone-generator",
    component: "audio/tone",
    icon: "AudioWaveform",
    popular: true,
    name: { ru: "Генератор тона", en: "Tone generator" },
    title: { ru: "Генератор звуковой частоты онлайн — тон от 1 Гц до 22 кГц", en: "Tone generator online — any frequency from 1 Hz to 22 kHz" },
    h1: { ru: "Генератор звуковой частоты", en: "Online tone generator" },
    description: {
      ru: "Генератор тона онлайн: синус, меандр, треугольник или пила от 1 Гц до 22 кГц, свип, левый или правый канал. Частота меняется на лету без щелчков.",
      en: "Online tone generator: sine, square, triangle or sawtooth from 1 Hz to 22 kHz, sweeps, left or right channel. Change the frequency on the fly without clicks.",
    },
    lead: { ru: "Воспроизведите звук любой частоты — для проверки колонок, наушников, слуха или настройки инструмента.", en: "Play a sound of any frequency — to test speakers, headphones, hearing or to tune an instrument." },
    keywords: { ru: ["генератор частоты", "генератор тона", "звук определённой частоты", "генератор звука онлайн"], en: ["tone generator", "frequency generator", "online tone generator", "sine wave generator"] },
    props: { freq: 440 },
    variants: { title: { ru: "Популярные частоты", en: "Popular frequencies" }, list: toneVariants },
    howTo: {
      ru: ["Введите частоту или двигайте ползунок (шкала логарифмическая, как у слуха).", "Выберите форму волны и канал.", "Нажмите «Воспроизвести», начиная с малой громкости.", "Меняйте частоту и громкость во время звучания — звук не прерывается."],
      en: ["Type a frequency or drag the slider (it's logarithmic, like hearing).", "Choose the waveform and channel.", "Press Play, starting at a low volume.", "Change frequency and volume while it plays — the sound doesn't stop."],
    },
    about: {
      ru: [
        "Тон создаётся осциллятором Web Audio прямо в браузере, поэтому частота точная и не зависит от сжатия, как у роликов на видеохостингах. Кнопки ± меняют частоту ровно на полутон, а под числом показана ближайшая нота и отклонение в центах.",
        "Свип плавно проводит частоту по экспоненте от начальной до конечной — удобно, чтобы найти резонансы и «дребезг» в колонках или границу своего слуха.",
      ],
      en: [
        "The tone comes from a Web Audio oscillator right in the browser, so the frequency is exact and unaffected by compression, unlike video-hosting clips. The ± buttons move by exactly one semitone, and the nearest note with its cents offset is shown below.",
        "A sweep glides exponentially from the start to the end frequency — handy for finding rattles and resonances in speakers or the limit of your hearing.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему я не слышу очень низкие или очень высокие частоты?", a: "Ниже 100–200 Гц большинство динамиков телефонов и ноутбуков почти не звучат, а выше 15–17 кГц многие взрослые уже не слышат. Проверяйте в хороших наушниках." },
        { q: "Чем синус отличается от меандра?", a: "Синус — чистый тон без обертонов. Меандр (прямоугольник), треугольник и пила содержат обертоны и звучат ярче, «жужжаще»." },
        { q: "Можно ли проверить левый и правый каналы?", a: "Да, выберите канал «Левый» или «Правый» — тон будет звучать только в нём." },
      ],
      en: [
        { q: "Why can't I hear very low or very high frequencies?", a: "Below 100–200 Hz most phone and laptop speakers barely sound, and above 15–17 kHz many adults can't hear any more. Test with good headphones." },
        { q: "How is a sine different from a square wave?", a: "A sine is a pure tone without overtones. Square, triangle and sawtooth waves contain overtones and sound brighter and buzzier." },
        { q: "Can I test the left and right channels?", a: "Yes: choose the Left or Right channel and the tone plays only there." },
      ],
    },
    related: ["noise-generator", "speaker-cleaner", "tuner", "decibel-meter"],
  },
  {
    slug: "noise-generator",
    component: "audio/noise",
    icon: "Waves",
    popular: true,
    name: { ru: "Генератор шума", en: "Noise generator" },
    title: { ru: "Белый, розовый и коричневый шум онлайн — генератор", en: "White, pink and brown noise online — noise generator" },
    h1: { ru: "Генератор шума: белый, розовый, коричневый", en: "Noise generator: white, pink, brown" },
    description: {
      ru: "Белый, розовый, коричневый, синий и фиолетовый шум онлайн: непрерывно, без щелчков и повторов, смена цвета на лету, таймер сна до 8 часов с плавным затуханием.",
      en: "White, pink, brown, blue and violet noise online: continuous, no clicks or loops, change colour on the fly, sleep timer up to 8 hours with a gentle fade.",
    },
    lead: { ru: "Включите шум для сна, работы или проверки акустики — без рекламы и повторяющейся петли.", en: "Play noise for sleep, focus or speaker testing — no ads and no repeating loop." },
    keywords: { ru: ["белый шум", "розовый шум", "коричневый шум", "шум для сна"], en: ["white noise", "pink noise", "brown noise", "noise for sleep"] },
    props: { color: "white" },
    variants: { title: { ru: "Цвета шума", en: "Noise colours" }, list: noiseVariants },
    howTo: {
      ru: ["Выберите цвет шума.", "Нажмите «Включить» — звук плавно нарастёт.", "Настройте громкость и при желании таймер выключения.", "Меняйте цвет, не выключая звук."],
      en: ["Choose a noise colour.", "Press Play — the sound fades in.", "Adjust the volume and, if you like, the sleep timer.", "Switch colours without stopping."],
    },
    about: {
      ru: [
        "Шум генерируется в реальном времени в AudioWorklet — отдельном аудиопотоке браузера, а не зацикленным файлом. Поэтому в нём нет стыков и щелчков, а левый и правый каналы независимы, что звучит объёмнее.",
        "Цвета отличаются наклоном спектра: белый ровный по частотам, розовый теряет 3 дБ на октаву, коричневый — 6 дБ, синий и фиолетовый, наоборот, набирают 3 и 6 дБ. Чем «теплее» цвет, тем ниже и мягче звучит шум.",
      ],
      en: [
        "The noise is generated in real time in an AudioWorklet — the browser's dedicated audio thread — rather than a looped file. So there are no seams or clicks, and the left and right channels are independent, which sounds wider.",
        "Colours differ in spectral slope: white is flat, pink loses 3 dB per octave, brown 6 dB, while blue and violet gain 3 and 6 dB. The warmer the colour, the lower and softer the noise.",
      ],
    },
    faq: {
      ru: [
        { q: "Какой шум лучше для сна?", a: "Это дело вкуса: многим приятнее мягкий розовый или коричневый, белый кажется резче. Выбирайте тихую громкость — достаточно, чтобы заглушить посторонние звуки." },
        { q: "Будет ли шум играть при заблокированном экране телефона?", a: "Зависит от браузера и системы: обычно звук продолжается, если вкладка активна, но энергосбережение может его остановить. Для ночи удобнее компьютер или отдельная колонка." },
        { q: "Безопасно ли слушать шум всю ночь?", a: "На тихой громкости — да. Рекомендации для сна — не громче примерно 50 дБ; в наушниках всю ночь лучше не слушать." },
      ],
      en: [
        { q: "Which noise is best for sleep?", a: "It's a matter of taste: many prefer soft pink or brown noise, while white feels harsher. Keep it quiet — just enough to mask other sounds." },
        { q: "Will it keep playing with the phone screen locked?", a: "It depends on the browser and OS: usually sound continues while the tab is active, but power saving may stop it. A computer or a separate speaker is more reliable overnight." },
        { q: "Is it safe to listen all night?", a: "At a low volume, yes. Guidance for sleep is roughly no louder than 50 dB; avoid headphones all night." },
      ],
    },
    related: ["tone-generator", "metronome", "decibel-meter", "speaker-cleaner"],
  },
  {
    slug: "metronome",
    component: "audio/metronome",
    icon: "Timer",
    popular: true,
    name: { ru: "Метроном онлайн", en: "Online metronome" },
    title: { ru: "Метроном онлайн — точный, от 20 до 300 BPM", en: "Online metronome — accurate, 20 to 300 BPM" },
    h1: { ru: "Метроном онлайн", en: "Online metronome" },
    description: {
      ru: "Точный метроном онлайн: 20–300 ударов в минуту, размеры 2/4–7/8, восьмые, триоли и шестнадцатые, акцент на сильную долю, три звука и темп по нажатиям.",
      en: "Accurate online metronome: 20–300 BPM, time signatures 2/4 to 7/8, eighths, triplets and sixteenths, downbeat accent, three sounds and tap tempo.",
    },
    lead: { ru: "Точный метроном для занятий музыкой: темп, размер, доли и акцент.", en: "An accurate metronome for practice: tempo, time signature, subdivisions and accent." },
    keywords: { ru: ["метроном онлайн", "метроном", "метроном для гитары", "метроном bpm"], en: ["online metronome", "metronome", "metronome bpm", "click track"] },
    props: { bpm: 120 },
    variants: { title: { ru: "Популярный темп", en: "Popular tempos" }, list: bpmVariants },
    howTo: {
      ru: ["Задайте темп кнопками ±, ползунком или нажатиями «Задать темп».", "Выберите размер и доли.", "Нажмите «Старт».", "Меняйте темп на ходу — метроном не собьётся."],
      en: ["Set the tempo with ±, the slider or by tapping.", "Choose the time signature and subdivision.", "Press Start.", "Change the tempo on the fly — it won't lose the beat."],
    },
    about: {
      ru: [
        "Щелчки планируются по часам звуковой карты с опережением на 0,12 секунды, а не таймерами страницы, поэтому ритм остаётся ровным даже при нагрузке на компьютер и в фоновой вкладке.",
        "Сильная доля звучит выше и громче, слабые — обычным щелчком, а дробления (восьмые, триоли, шестнадцатые) — тише. Точки над кнопками показывают текущую долю.",
      ],
      en: [
        "Clicks are scheduled on the sound card's clock 0.12 seconds ahead rather than with page timers, so the rhythm stays even under load and in a background tab.",
        "The downbeat is higher and louder, other beats are a normal click, and subdivisions (eighths, triplets, sixteenths) are quieter. The dots show the current beat.",
      ],
    },
    faq: {
      ru: [
        { q: "Какой темп выбрать для занятий?", a: "Начинайте на 60–70 % от целевого темпа, пока фраза не получится без ошибок, затем повышайте на 4–5 BPM." },
        { q: "Почему щелчок иногда запаздывает в Bluetooth-наушниках?", a: "Беспроводные наушники добавляют задержку 100–300 мс. Метроном при этом остаётся ровным, но сдвинут — для игры в ансамбле используйте проводные наушники или колонки." },
        { q: "Как узнать темп песни?", a: "Нажмите «Задать темп нажатиями» несколько раз в такт — метроном сам установит темп. Отдельный инструмент для этого — «Определить BPM»." },
      ],
      en: [
        { q: "What tempo should I practise at?", a: "Start at 60–70% of the target tempo until the phrase is clean, then raise it by 4–5 BPM." },
        { q: "Why does the click lag in Bluetooth headphones?", a: "Wireless headphones add 100–300 ms of latency. The metronome stays even but shifted — use wired headphones or speakers when playing along." },
        { q: "How do I find a song's tempo?", a: "Press “Tap to set tempo” a few times in time — the metronome sets itself. There's also a dedicated “Tap BPM” tool." },
      ],
    },
    related: ["tap-bpm", "tuner", "tone-generator", "change-audio-speed"],
  },
  {
    slug: "tuner",
    component: "audio/tuner",
    icon: "Guitar",
    popular: true,
    name: { ru: "Тюнер онлайн", en: "Online tuner" },
    title: { ru: "Тюнер онлайн через микрофон — гитара, укулеле, скрипка", en: "Online tuner with microphone — guitar, ukulele, violin" },
    h1: { ru: "Тюнер онлайн через микрофон", en: "Online tuner with microphone" },
    description: {
      ru: "Хроматический тюнер онлайн: нота через микрофон и отклонение в центах. Строи для гитары, баса, укулеле, скрипки, балалайки и домбры, эталон A4 от 430 до 446 Гц.",
      en: "Chromatic online tuner: notes via your microphone with cents. Tunings for guitar, bass, ukulele, violin, balalaika and dombra; A4 from 430 to 446 Hz.",
    },
    lead: { ru: "Сыграйте ноту — тюнер покажет, какая она и насколько её подтянуть.", en: "Play a note — the tuner shows which it is and how far to adjust it." },
    keywords: { ru: ["тюнер онлайн", "тюнер для гитары", "настроить гитару", "тюнер через микрофон"], en: ["online tuner", "guitar tuner", "tune guitar online", "chromatic tuner"] },
    props: { instrument: "chromatic" },
    variants: { title: { ru: "Инструменты", en: "Instruments" }, list: tunerVariants },
    howTo: {
      ru: ["Нажмите «Включить микрофон» и разрешите доступ.", "Выберите инструмент или оставьте хроматический режим.", "Сыграйте открытую струну и дайте ей прозвучать.", "Подтягивайте или ослабляйте струну, пока индикатор не станет зелёным."],
      en: ["Press “Turn on microphone” and allow access.", "Choose an instrument or keep chromatic mode.", "Play an open string and let it ring.", "Tighten or loosen until the indicator turns green."],
    },
    about: {
      ru: [
        "Высота определяется методом нормированной автокорреляции (McLeod): программа ищет период повторения волны, поэтому уверенно находит основной тон даже у звука с яркими обертонами. Показания сглаживаются медианой последних измерений, чтобы стрелка не дрожала.",
        "В режиме инструмента тюнер сам выбирает ближайшую струну и показывает отклонение от неё; эталонные тоны струн можно послушать кнопками под шкалой.",
      ],
      en: [
        "Pitch is detected with normalised autocorrelation (the McLeod method): it finds the period of the waveform, so it locks onto the fundamental even with bright overtones. Readings are smoothed with a median of the latest measurements so the needle doesn't jitter.",
        "In instrument mode the tuner picks the nearest string and shows the deviation from it; you can play each string's reference tone with the buttons below the scale.",
      ],
    },
    faq: {
      ru: [
        { q: "Насколько точен онлайн-тюнер?", a: "На чистом звуке — до 1–2 центов, чего с запасом хватает для настройки: зелёная зона — ±5 центов. Точность падает при шуме вокруг и на очень низких нотах во встроенном микрофоне." },
        { q: "Нужен ли интернет после открытия страницы?", a: "Нет: анализ идёт в браузере. Страница лишь должна быть открыта." },
        { q: "Как настроиться на 432 Гц или 442 Гц?", a: "Выберите нужное значение в поле «Ля первой октавы» — все ноты и струны пересчитаются." },
      ],
      en: [
        { q: "How accurate is an online tuner?", a: "On a clean sound, within 1–2 cents, which is plenty for tuning: the green zone is ±5 cents. Accuracy drops with background noise and very low notes on built-in microphones." },
        { q: "Does it need the internet once the page is open?", a: "No: analysis runs in the browser. The page just needs to stay open." },
        { q: "How do I tune to 432 Hz or 442 Hz?", a: "Choose the value in the “Concert A” field — every note and string is recalculated." },
      ],
    },
    related: ["metronome", "tone-generator/440-hz", "tap-bpm", "change-audio-speed"],
    blocks: (locale) => [micNote(locale)],
  },
  {
    slug: "tap-bpm",
    component: "audio/tap-bpm",
    icon: "Hand",
    name: { ru: "Определить BPM", en: "Tap BPM" },
    title: { ru: "Определить BPM песни онлайн — нажимайте в такт", en: "Tap BPM online — find a song's tempo by tapping" },
    h1: { ru: "Определить темп (BPM) нажатиями", en: "Tap tempo — find BPM by tapping" },
    description: {
      ru: "Узнайте темп песни: нажимайте в такт мышью, пальцем или клавишей — BPM считается по последним 16 нажатиям, сбои отбрасываются. Показывает интервал в мс.",
      en: "Find a song's tempo: tap along with a mouse, finger or any key — BPM is computed from the last 16 taps and stray taps are ignored. Shows the interval in ms.",
    },
    lead: { ru: "Постучите в ритм музыки — темп в BPM появится после второго нажатия.", en: "Tap along to the music — the BPM appears after the second tap." },
    keywords: { ru: ["определить bpm", "узнать темп песни", "bpm счетчик", "tap tempo"], en: ["tap bpm", "bpm counter", "find song tempo", "tap tempo"] },
    howTo: {
      ru: ["Включите музыку.", "Нажимайте на круг, пробел или любую клавишу на каждый удар.", "После 6–8 нажатий темп стабилизируется.", "Сделайте паузу больше 2 секунд, чтобы начать заново."],
      en: ["Play the music.", "Tap the circle, the space bar or any key on every beat.", "After 6–8 taps the tempo settles.", "Pause for more than 2 seconds to start over."],
    },
    about: {
      ru: [
        "Темп считается по интервалам между нажатиями: берётся медиана, интервалы, отличающиеся от неё больше чем на 15 %, отбрасываются как пропуск или двойное нажатие, а остальные усредняются.",
        "Учитываются только последние 16 нажатий, поэтому можно следить за песней, где темп меняется. Время нажатия считается от момента касания, а не отпускания, — так точнее.",
      ],
      en: [
        "Tempo comes from the intervals between taps: the median is taken, intervals more than 15% away from it are dropped as missed or double taps, and the rest are averaged.",
        "Only the last 16 taps count, so you can follow songs whose tempo changes. Taps are timed from the moment of touch rather than release, which is more precise.",
      ],
    },
    faq: {
      ru: [
        { q: "Сколько раз нужно нажать?", a: "Результат появится после двух нажатий, но надёжным станет после 6–8 — индикатор покажет «Темп стабилен»." },
        { q: "Почему BPM получился вдвое больше или меньше?", a: "Вы могли стучать в восьмые или в половинные ноты. Для танцевальной музыки обычно считают удары бочки: хаус около 120–128, драм-н-бейс около 170." },
        { q: "Как проверить результат?", a: "Откройте метроном, выставьте полученный темп и включите вместе с песней — щелчки должны совпадать с ударами." },
      ],
      en: [
        { q: "How many times should I tap?", a: "A result appears after two taps but becomes reliable after 6–8 — the indicator shows “Tempo is steady”." },
        { q: "Why is the BPM double or half what I expected?", a: "You may have tapped eighth or half notes. For dance music, count the kick drum: house is about 120–128, drum and bass about 170." },
        { q: "How can I check the result?", a: "Open the metronome, set the tempo and play it along with the song — the clicks should match the beats." },
      ],
    },
    related: ["metronome", "change-audio-speed", "tuner", "trim-audio"],
  },
  {
    slug: "decibel-meter",
    component: "audio/db-meter",
    icon: "Activity",
    name: { ru: "Шумомер онлайн", en: "Decibel meter" },
    title: { ru: "Шумомер онлайн — измерить уровень звука микрофоном", en: "Decibel meter online — measure sound with your mic" },
    h1: { ru: "Шумомер онлайн", en: "Online decibel meter" },
    description: {
      ru: "Уровень звука с микрофона в dBFS: текущий, пик, минимум, максимум и Leq, график за 30 секунд. Без калибровки это не децибелы SPL, но поправку можно ввести.",
      en: "Microphone sound level in dBFS: current, peak, min, max and Leq with a 30-second graph. Without calibration it isn't dB SPL, but you can enter an offset.",
    },
    lead: { ru: "Смотрите уровень звука с микрофона в реальном времени — и сравнивайте, где тише.", en: "Watch the microphone sound level in real time — and compare where it's quieter." },
    keywords: { ru: ["шумомер онлайн", "измерить шум", "децибелометр", "уровень шума микрофоном"], en: ["decibel meter", "sound level meter", "noise meter online", "measure noise"] },
    howTo: {
      ru: ["Нажмите «Включить микрофон» и разрешите доступ.", "Держите устройство неподвижно, микрофоном к источнику звука.", "Смотрите текущий уровень, пик и среднее; «Сбросить» начинает замер заново.", "Если есть настоящий шумомер, введите поправку для примерных дБ."],
      en: ["Press “Turn on microphone” and allow access.", "Keep the device still with the microphone facing the source.", "Watch the current level, peak and average; Reset starts a new measurement.", "If you have a real sound level meter, enter the offset for approximate dB."],
    },
    about: {
      ru: [
        "Браузер выдаёт цифровой сигнал без сведений о чувствительности микрофона, поэтому измерения — в dBFS, где 0 соответствует максимуму цифровой шкалы, а тишина — большим отрицательным значениям. Сравнивать уровни «тише-громче» на одном устройстве можно, абсолютные децибелы — нет.",
        "Инструмент просит браузер отключить автоусиление, шумо- и эхоподавление, но некоторые телефоны всё равно обрабатывают звук. Взвешивание A (dBA), как у настоящих шумомеров, не применяется.",
      ],
      en: [
        "Browsers deliver a digital signal without the microphone's sensitivity, so readings are in dBFS, where 0 is digital full scale and silence is a large negative number. Comparing louder and quieter on the same device works; absolute decibels don't.",
        "The tool asks the browser to disable auto gain, noise and echo suppression, but some phones process audio anyway. A-weighting (dBA), as used by real meters, isn't applied.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему показывает отрицательные числа?", a: "dBFS отсчитываются от максимума цифровой шкалы: 0 dBFS — самый громкий возможный сигнал, всё тише — меньше нуля. Это нормально." },
        { q: "Как получить примерные децибелы SPL?", a: "Включите рядом настоящий шумомер (или откалиброванное приложение) при ровном шуме, посмотрите разницу и введите её в поле «Калибровка». Поправка верна только для этого устройства и микрофона." },
        { q: "Можно ли по этим данным жаловаться на соседей?", a: "Нет: для официальных замеров нужен поверенный шумомер. Этот инструмент подходит для сравнения и оценки." },
      ],
      en: [
        { q: "Why are the numbers negative?", a: "dBFS is measured from digital full scale: 0 dBFS is the loudest possible signal and anything quieter is below zero. That's normal." },
        { q: "How do I get approximate dB SPL?", a: "Run a real sound level meter (or a calibrated app) next to it with steady noise, note the difference and enter it as the calibration offset. The offset is valid only for this device and microphone." },
        { q: "Can I use this for a noise complaint?", a: "No: official measurements need a certified meter. This tool is for comparison and rough estimates." },
      ],
    },
    related: ["tone-generator", "noise-generator", "voice-recorder", "increase-audio-volume"],
    blocks: (locale) => [
      micNote(locale),
      {
        type: "table",
        title: locale === "ru" ? "Типичные уровни шума (dB SPL, для ориентира)" : "Typical sound levels (dB SPL, for reference)",
        head: [locale === "ru" ? "Источник" : "Source", "dB SPL"],
        rows:
          locale === "ru"
            ? [["Шёпот рядом", "около 30"], ["Тихая комната ночью", "30–35"], ["Обычный разговор", "около 60"], ["Оживлённая улица", "70–80"], ["Метро в вагоне", "80–90"], ["Концерт, клуб", "100–110"]]
            : [["Whisper nearby", "about 30"], ["Quiet room at night", "30–35"], ["Normal conversation", "about 60"], ["Busy street", "70–80"], ["Inside a subway train", "80–90"], ["Concert, club", "100–110"]],
      },
    ],
  },
  {
    slug: "speaker-cleaner",
    component: "audio/speaker-cleaner",
    icon: "Droplets",
    name: { ru: "Очистка динамика", en: "Speaker cleaner" },
    title: { ru: "Очистка динамика от воды — звук 165 Гц онлайн", en: "Speaker cleaner — 165 Hz tone to eject water" },
    h1: { ru: "Очистка динамика телефона звуком", en: "Clean phone speaker with sound" },
    description: {
      ru: "Тон 165 Гц для динамика, в который попала вода: колебания мембраны помогают вытолкнуть капли из решётки. Непрерывно или импульсами, 15–120 с. Не ремонт.",
      en: "A 165 Hz tone for a wet speaker: the vibrating diaphragm helps push droplets out of the grille. Continuous or pulsed, 15–120 s. Not a repair or a guarantee.",
    },
    lead: { ru: "Низкий тон 165 Гц может помочь выгнать воду из динамика телефона — честно о том, как это работает.", en: "A low 165 Hz tone can help drive water out of a phone speaker — honestly, here's how it works." },
    keywords: { ru: ["очистка динамика", "вода в динамике", "звук для удаления воды из динамика", "165 гц"], en: ["speaker cleaner", "water eject sound", "clean phone speaker", "165 hz tone"] },
    howTo: {
      ru: ["Снимите чехол и отключите наушники и Bluetooth-колонки.", "Положите телефон динамиком вниз на ткань.", "Выставьте громкость телефона на максимум и запустите тон.", "Повторите 2–3 раза и дайте телефону высохнуть."],
      en: ["Remove the case and disconnect headphones and Bluetooth speakers.", "Place the phone speaker-down on a cloth.", "Turn the phone volume to maximum and start the tone.", "Repeat 2–3 times and let the phone dry."],
    },
    about: {
      ru: [
        "Низкочастотный звук заставляет мембрану динамика колебаться с большой амплитудой, и капли воды в решётке и перед мембраной постепенно выталкиваются наружу. Так же работает функция выброса воды в часах Apple Watch.",
        "Это не ремонт: если после высыхания звук остаётся хриплым или тихим, динамик мог пострадать, и нужен сервис. Не используйте тон в наушниках и не подносите динамик к уху — звук громкий. Высушивание в рисе не рекомендуется: частицы могут попасть в разъёмы.",
      ],
      en: [
        "Low-frequency sound makes the speaker diaphragm move with a large amplitude, gradually pushing water droplets out of the grille and away from the diaphragm. Apple Watch's water-eject feature works the same way.",
        "It isn't a repair: if the sound stays rough or quiet after drying, the speaker may be damaged and needs service. Don't use the tone in headphones or hold the speaker to your ear — it's loud. Drying in rice isn't recommended: particles can get into ports.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему именно 165 Гц?", a: "Это низкая частота, которую небольшие динамики телефонов ещё воспроизводят с заметным ходом мембраны, — её используют популярные приложения для удаления воды. Строгих исследований, что 165 Гц лучше соседних частот, нет." },
        { q: "Поможет ли, если телефон упал в воду целиком?", a: "Звук помогает только с каплями в решётке динамика. Если вода попала внутрь корпуса, выключите телефон и обратитесь в сервис — тон здесь не поможет." },
        { q: "Не повредит ли громкий тон динамику?", a: "Кратковременный тон на полной громкости для исправного динамика безопасен — это обычный режим работы. Не держите его часами и остановите, если слышите сильный хрип." },
      ],
      en: [
        { q: "Why 165 Hz?", a: "It's a low frequency that small phone speakers can still reproduce with noticeable diaphragm movement, and popular water-eject apps use it. There's no rigorous research showing 165 Hz beats nearby frequencies." },
        { q: "Will it help if the whole phone fell into water?", a: "Sound only helps with droplets in the speaker grille. If water got inside the body, turn the phone off and take it to a repair shop — the tone won't help." },
        { q: "Can a loud tone damage the speaker?", a: "A short tone at full volume is safe for a working speaker — it's normal operation. Don't run it for hours, and stop if you hear heavy distortion." },
      ],
    },
    related: ["tone-generator", "decibel-meter", "noise-generator", "tone-generator/100-hz"],
  },
];
