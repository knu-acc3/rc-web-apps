import type { L10n } from "@/i18n/config";
import type { NoiseColor } from "../lib/noise";
import type { InstrumentId } from "./instruments";

/* ───────────── noise colours ───────────── */

export interface NoiseInfo {
  color: NoiseColor;
  name: L10n;
  title: L10n;
  description: L10n;
  lead: L10n;
  sounds: L10n;
  uses: L10n;
  about: L10n;
  faq: { q: L10n; a: L10n };
}

export const NOISES: NoiseInfo[] = [
  {
    color: "white",
    name: { ru: "Белый шум", en: "White noise" },
    title: { ru: "Белый шум онлайн — слушать без рекламы и петель", en: "White noise online — no ads, no loops" },
    description: {
      ru: "Белый шум онлайн: одинаковая мощность на всех частотах, звучит как шипение ненастроенного радио. Непрерывная генерация без щелчков, таймер сна до 8 часов.",
      en: "White noise online: equal power at every frequency, like the hiss of an untuned radio. Generated continuously without clicks, with a sleep timer up to 8 hours.",
    },
    lead: { ru: "Белый шум — ровное шипение, которое маскирует посторонние звуки.", en: "White noise is an even hiss that masks distracting sounds." },
    sounds: { ru: "шипение ненастроенного радио или телевизора", en: "the hiss of an untuned radio or TV" },
    uses: { ru: "маскировка шума в офисе и дома, проверка акустики, сон", en: "masking office and home noise, testing audio gear, sleep" },
    about: {
      ru: "У белого шума одинаковая спектральная плотность на всех частотах, а значит, каждая следующая октава содержит вдвое больше энергии, чем предыдущая, — поэтому на слух он яркий и «шипящий». Его используют для маскировки разговоров и как тестовый сигнал в звукотехнике.",
      en: "White noise has the same spectral density at every frequency, so each octave carries twice the energy of the one below — which is why it sounds bright and hissy. It's used to mask conversations and as a test signal in audio engineering.",
    },
    faq: {
      q: { ru: "Помогает ли белый шум заснуть?", en: "Does white noise help you sleep?" },
      a: {
        ru: "Многим — да: ровный звук маскирует резкие шумы (соседи, машины), которые будят. Если белый шум кажется слишком резким, попробуйте розовый или коричневый — они мягче.",
        en: "For many people, yes: a steady sound masks sudden noises (neighbours, traffic) that wake you. If white noise feels too harsh, try pink or brown — they're softer.",
      },
    },
  },
  {
    color: "pink",
    name: { ru: "Розовый шум", en: "Pink noise" },
    title: { ru: "Розовый шум онлайн — мягкий шум для сна и работы", en: "Pink noise online — a soft noise for sleep and focus" },
    description: {
      ru: "Розовый шум онлайн: мощность падает на 3 дБ на октаву, поэтому он мягче белого и похож на ровный дождь. Эталонный сигнал для настройки акустики, таймер сна.",
      en: "Pink noise online: power falls 3 dB per octave, so it's softer than white noise and sounds like steady rain. Used to tune speakers; has a sleep timer.",
    },
    lead: { ru: "Розовый шум — равная энергия в каждой октаве, звучит как ровный дождь.", en: "Pink noise has equal energy in every octave and sounds like steady rain." },
    sounds: { ru: "ровный дождь или шелест листвы", en: "steady rain or rustling leaves" },
    uses: { ru: "сон и концентрация, настройка эквалайзера и акустики зала", en: "sleep and focus, tuning EQ and room acoustics" },
    about: {
      ru: "Спектральная плотность розового шума обратно пропорциональна частоте (1/f), поэтому в каждой октаве одинаковая энергия — примерно так слух и воспринимает звук. Инженеры используют розовый шум для настройки эквалайзеров и выравнивания колонок в зале.",
      en: "Pink noise's spectral density is inversely proportional to frequency (1/f), so every octave holds the same energy — close to how hearing perceives sound. Engineers use it to tune equalisers and align speakers in a room.",
    },
    faq: {
      q: { ru: "Правда ли, что розовый шум улучшает сон?", en: "Is it true that pink noise improves sleep?" },
      a: {
        ru: "Есть небольшие исследования, где розовый шум во время сна усиливал медленноволновую фазу, но данных пока мало. Точно известно другое: ровный фоновый шум маскирует резкие звуки.",
        en: "A few small studies found pink noise during sleep enhanced slow-wave sleep, but the evidence is limited. What's certain is that steady background noise masks sudden sounds.",
      },
    },
  },
  {
    color: "brown",
    name: { ru: "Коричневый шум", en: "Brown noise" },
    title: { ru: "Коричневый шум онлайн — глубокий гул без щелчков", en: "Brown noise online — a deep rumble without clicks" },
    description: {
      ru: "Коричневый шум онлайн: −6 дБ на октаву, низкий гул как у водопада или прибоя. Непрерывная генерация без петли и щелчков, таймер сна и регулировка громкости.",
      en: "Brown noise online: −6 dB per octave, a low rumble like a waterfall or surf. Generated continuously with no loop or clicks, with a sleep timer and live volume.",
    },
    lead: { ru: "Коричневый шум — глубокий низкий гул, мягче белого и розового.", en: "Brown noise is a deep, low rumble — softer than white or pink." },
    sounds: { ru: "водопад, прибой, гул в салоне самолёта", en: "a waterfall, surf, an aircraft cabin" },
    uses: { ru: "сон, концентрация, маскировка низкого гула", en: "sleep, focus, masking low rumble" },
    about: {
      ru: "Коричневый (броуновский) шум назван в честь броуновского движения: его спектральная плотность падает как 1/f², то есть на 6 дБ на октаву. Здесь он получается интегрированием белого шума с небольшой «утечкой», чтобы сигнал не уходил в постоянный сдвиг.",
      en: "Brown (Brownian) noise is named after Brownian motion: its spectral density falls as 1/f², i.e. 6 dB per octave. Here it's made by integrating white noise with a small “leak” so the signal doesn't drift into a DC offset.",
    },
    faq: {
      q: { ru: "Почему в других генераторах коричневый шум щёлкает?", en: "Why does brown noise click in other generators?" },
      a: {
        ru: "Многие генераторы зацикливают короткий фрагмент на пару секунд: на стыке сигнал скачет, и слышен щелчок. Здесь шум генерируется непрерывно в AudioWorklet, поэтому стыков нет.",
        en: "Many generators loop a short clip of a couple of seconds: the signal jumps at the seam and you hear a click. Here the noise is generated continuously in an AudioWorklet, so there are no seams.",
      },
    },
  },
  {
    color: "blue",
    name: { ru: "Синий шум", en: "Blue noise" },
    title: { ru: "Синий шум онлайн — высокочастотный шум +3 дБ на октаву", en: "Blue noise online — high-frequency noise, +3 dB/octave" },
    description: {
      ru: "Синий шум онлайн: мощность растёт на 3 дБ на октаву, звучит как шипение струи воды. Используется для маскировки тиннитуса, в дизеринге звука и изображений.",
      en: "Blue noise online: power rises by 3 dB per octave and it sounds like a hissing water jet. Used to mask tinnitus and for dithering audio and images.",
    },
    lead: { ru: "Синий шум — яркое шипение с упором на высокие частоты.", en: "Blue noise is a bright hiss weighted towards high frequencies." },
    sounds: { ru: "шипение струи воды или пара", en: "a hissing jet of water or steam" },
    uses: { ru: "маскировка высокочастотного звона в ушах, дизеринг", en: "masking high-pitched tinnitus, dithering" },
    about: {
      ru: "Спектральная плотность синего шума растёт пропорционально частоте (+3 дБ на октаву) — это «зеркало» розового. Здесь он получается дифференцированием розового шума. В цифровой обработке похожий по спектру шум применяют для дизеринга: он менее заметен, чем белый.",
      en: "Blue noise's spectral density rises in proportion to frequency (+3 dB per octave) — the mirror image of pink. Here it's made by differentiating pink noise. In digital processing, noise with a similar spectrum is used for dithering because it's less noticeable than white.",
    },
    faq: {
      q: { ru: "Помогает ли синий шум при звоне в ушах?", en: "Does blue noise help with tinnitus?" },
      a: {
        ru: "Некоторым людям с высокочастотным звоном в ушах шум в той же области помогает его замаскировать. Это не лечение; если звон постоянный, обратитесь к оториноларингологу.",
        en: "Some people with high-pitched tinnitus find noise in the same range masks it. It isn't a treatment; if the ringing is constant, see an ENT doctor.",
      },
    },
  },
  {
    color: "violet",
    name: { ru: "Фиолетовый шум", en: "Violet noise" },
    title: { ru: "Фиолетовый шум онлайн — самый «яркий» шум, +6 дБ", en: "Violet noise online — the brightest noise, +6 dB" },
    description: {
      ru: "Фиолетовый шум онлайн: мощность растёт на 6 дБ на октаву, почти вся энергия — в самых высоких частотах. Тонкое шипение для маскировки звона в ушах и тестов.",
      en: "Violet noise online: power rises by 6 dB per octave, so nearly all the energy is in the highest frequencies. A thin hiss for masking high tinnitus and tests.",
    },
    lead: { ru: "Фиолетовый шум — тонкое высокое шипение, противоположность коричневому.", en: "Violet noise is a thin, high hiss — the opposite of brown noise." },
    sounds: { ru: "очень тонкое высокое шипение", en: "a very thin, high hiss" },
    uses: { ru: "маскировка высокочастотного тиннитуса, проверка твитеров", en: "masking high-frequency tinnitus, tweeter tests" },
    about: {
      ru: "Фиолетовый (пурпурный) шум — дифференцированный белый шум: его спектральная плотность растёт как f², на 6 дБ на октаву. Низких частот в нём почти нет, поэтому на слух он тише белого при той же амплитуде.",
      en: "Violet (purple) noise is differentiated white noise: its spectral density grows as f², 6 dB per octave. It has almost no low frequencies, so it sounds quieter than white noise at the same amplitude.",
    },
    faq: {
      q: { ru: "Чем фиолетовый шум отличается от синего?", en: "How is violet noise different from blue?" },
      a: {
        ru: "Наклоном спектра: у синего +3 дБ на октаву, у фиолетового +6 дБ. Фиолетовый ещё сильнее сдвинут в высокие частоты и звучит тоньше.",
        en: "In spectral slope: blue is +3 dB per octave, violet +6 dB. Violet is shifted even further into the treble and sounds thinner.",
      },
    },
  },
];

/* ───────────── metronome tempos ───────────── */

export interface BpmInfo {
  bpm: number;
  style: L10n;
}

export const BPMS: BpmInfo[] = [
  { bpm: 40, style: { ru: "Очень медленно: разбор сложных пассажей, медленные медитативные пьесы.", en: "Very slow: working through hard passages, slow meditative pieces." } },
  { bpm: 50, style: { ru: "Медленная практика и разучивание гамм, похоронные марши.", en: "Slow practice and learning scales, funeral marches." } },
  { bpm: 60, style: { ru: "Один удар в секунду — как тиканье часов. Медленные баллады, колыбельные.", en: "One beat per second — like a ticking clock. Slow ballads and lullabies." } },
  { bpm: 70, style: { ru: "Спокойные баллады, соул, медленный R&B.", en: "Relaxed ballads, soul, slow R&B." } },
  { bpm: 80, style: { ru: "Хип-хоп старой школы (около 80–95), реггей, медленный рок.", en: "Old-school hip-hop (about 80–95), reggae, slow rock." } },
  { bpm: 90, style: { ru: "Хип-хоп, реггетон (около 90–100), неспешный поп.", en: "Hip-hop, reggaeton (about 90–100), laid-back pop." } },
  { bpm: 100, style: { ru: "Поп, фанк, энергичная ходьба.", en: "Pop, funk, brisk walking." } },
  { bpm: 110, style: { ru: "Поп-рок, диско; близко к строевому шагу.", en: "Pop-rock, disco; close to a marching step." } },
  { bpm: 120, style: { ru: "Самый популярный темп в поп-музыке и хаусе (118–128), маршевый шаг.", en: "The most common tempo in pop and house (118–128), a marching pace." } },
  { bpm: 128, style: { ru: "Классический темп электронной танцевальной музыки — хаус и EDM.", en: "The classic tempo of electronic dance music — house and EDM." } },
  { bpm: 140, style: { ru: "Трэп и дабстеп (часто ощущаются вдвое медленнее — 70), транс.", en: "Trap and dubstep (often felt at half time — 70), trance." } },
  { bpm: 150, style: { ru: "Быстрый рок, хардстайл, бег трусцой.", en: "Fast rock, hardstyle, jogging." } },
  { bpm: 160, style: { ru: "Панк-рок, драм-н-бейс в нижнем диапазоне (160–180).", en: "Punk rock, lower drum and bass range (160–180)." } },
  { bpm: 180, style: { ru: "Очень быстро: хардкор-панк, быстрые пассажи, беговой каденс.", en: "Very fast: hardcore punk, fast passages, running cadence." } },
];

/* ───────────── tuner instruments ───────────── */

export interface InstrumentText {
  id: Exclude<InstrumentId, "chromatic">;
  name: L10n;
  title: L10n;
  h1: L10n;
  description: L10n;
  lead: L10n;
  about: L10n;
  stringNames: { ru: string[]; en: string[] };
  faq: { q: L10n; a: L10n };
}

export const INSTRUMENT_TEXTS: InstrumentText[] = [
  {
    id: "guitar",
    name: { ru: "Гитара", en: "Guitar" },
    title: { ru: "Тюнер для гитары онлайн — через микрофон", en: "Guitar tuner online — using your microphone" },
    h1: { ru: "Тюнер для гитары", en: "Guitar tuner" },
    description: {
      ru: "Тюнер для шестиструнной гитары онлайн: строй E-A-D-G-B-E (ми-ля-ре-соль-си-ми), определение ноты через микрофон, отклонение в центах и эталонные тоны.",
      en: "Online tuner for a six-string guitar: standard E-A-D-G-B-E tuning, note detection through the microphone, cents deviation and reference tones for each string.",
    },
    lead: { ru: "Сыграйте открытую струну — тюнер покажет ноту и насколько её подтянуть или ослабить.", en: "Play an open string — the tuner shows the note and whether to tighten or loosen it." },
    about: {
      ru: "Стандартный строй гитары от шестой (толстой) струны к первой: E2 82,4 Гц — A2 110 Гц — D3 146,8 Гц — G3 196 Гц — B3 246,9 Гц — E4 329,6 Гц. Настраивайте струну, пока стрелка не окажется в зелёной зоне ±5 центов.",
      en: "Standard tuning from the sixth (thickest) string to the first: E2 82.4 Hz — A2 110 Hz — D3 146.8 Hz — G3 196 Hz — B3 246.9 Hz — E4 329.6 Hz. Tune each string until the needle sits in the green ±5 cent zone.",
    },
    stringNames: { ru: ["6-я (ми большой октавы)", "5-я (ля большой октавы)", "4-я (ре малой октавы)", "3-я (соль малой октавы)", "2-я (си малой октавы)", "1-я (ми первой октавы)"], en: ["6th (low E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (high E)"] },
    faq: {
      q: { ru: "Почему тюнер показывает не ту ноту на толстой струне?", en: "Why does the tuner show the wrong note on the low string?" },
      a: {
        ru: "Встроенный микрофон ноутбука плохо ловит низкие частоты, и тюнер может «слышать» обертон на октаву выше. Поднесите гитару ближе, играйте мягче и дайте струне прозвучать секунду.",
        en: "A laptop's built-in microphone picks up low frequencies poorly, so the tuner may hear an overtone an octave up. Bring the guitar closer, pluck gently and let the string ring for a second.",
      },
    },
  },
  {
    id: "bass",
    name: { ru: "Бас-гитара", en: "Bass guitar" },
    title: { ru: "Тюнер для бас-гитары онлайн — строй E-A-D-G", en: "Bass tuner online — E-A-D-G tuning" },
    h1: { ru: "Тюнер для бас-гитары", en: "Bass guitar tuner" },
    description: {
      ru: "Тюнер для четырёхструнной бас-гитары онлайн: строй E-A-D-G от 41,2 Гц, определение ноты через микрофон, отклонение в центах и эталонные тоны каждой струны.",
      en: "Online tuner for a four-string bass: E-A-D-G tuning from 41.2 Hz, note detection through the microphone, cents deviation and reference tones for each string.",
    },
    lead: { ru: "Бас-гитара строится на октаву ниже четырёх нижних струн гитары.", en: "A bass is tuned an octave below a guitar's four lowest strings." },
    about: {
      ru: "Стандартный строй баса: E1 41,2 Гц — A1 55 Гц — D2 73,4 Гц — G2 98 Гц. Эти частоты очень низкие, поэтому лучше подключить наушники или поднести инструмент к микрофону: встроенные микрофоны ноутбуков слышат их плохо.",
      en: "Standard bass tuning: E1 41.2 Hz — A1 55 Hz — D2 73.4 Hz — G2 98 Hz. These frequencies are very low, so bring the instrument close to the microphone — laptop microphones hear them poorly.",
    },
    stringNames: { ru: ["4-я (ми контроктавы)", "3-я (ля контроктавы)", "2-я (ре большой октавы)", "1-я (соль большой октавы)"], en: ["4th (low E)", "3rd (A)", "2nd (D)", "1st (G)"] },
    faq: {
      q: { ru: "Тюнер не реагирует на струну ми — что делать?", en: "The tuner doesn't react to the E string — what now?" },
      a: {
        ru: "41 Гц — ниже того, что уверенно записывают многие встроенные микрофоны. Сыграйте флажолет на 12-м ладу: он звучит на октаву выше (82,4 Гц), и тюнер покажет E2 — строй при этом тот же.",
        en: "41 Hz is below what many built-in microphones capture reliably. Play the 12th-fret harmonic: it sounds an octave higher (82.4 Hz) and the tuner shows E2 — the tuning is the same.",
      },
    },
  },
  {
    id: "ukulele",
    name: { ru: "Укулеле", en: "Ukulele" },
    title: { ru: "Тюнер для укулеле онлайн — строй G-C-E-A", en: "Ukulele tuner online — G-C-E-A tuning" },
    h1: { ru: "Тюнер для укулеле", en: "Ukulele tuner" },
    description: {
      ru: "Тюнер для укулеле онлайн: строй G-C-E-A (соль-до-ми-ля) с высокой четвёртой струной, нота через микрофон и эталонные тоны для сопрано, концерта и тенора.",
      en: "Online ukulele tuner: G-C-E-A tuning with a high fourth string, note detection through the microphone and reference tones for soprano, concert and tenor.",
    },
    lead: { ru: "Строй укулеле G-C-E-A: четвёртая струна соль выше третьей — это «возвратный» строй.", en: "Ukulele tuning is G-C-E-A: the fourth string, G, is higher than the third — a re-entrant tuning." },
    about: {
      ru: "Сопрано, концертное и теноровое укулеле строятся одинаково: G4 392 Гц — C4 261,6 Гц — E4 329,6 Гц — A4 440 Гц. Четвёртая струна соль звучит выше третьей — поэтому аккорды укулеле такие звонкие. Баритон строится иначе (D-G-B-E), как четыре верхние струны гитары.",
      en: "Soprano, concert and tenor ukuleles share one tuning: G4 392 Hz — C4 261.6 Hz — E4 329.6 Hz — A4 440 Hz. The fourth string, G, is higher than the third, which is why ukulele chords sound so bright. Baritone ukuleles use D-G-B-E, like a guitar's top four strings.",
    },
    stringNames: { ru: ["4-я (соль первой октавы)", "3-я (до первой октавы)", "2-я (ми первой октавы)", "1-я (ля первой октавы)"], en: ["4th (G)", "3rd (C)", "2nd (E)", "1st (A)"] },
    faq: {
      q: { ru: "Как настроить укулеле с низкой соль?", en: "How do I tune a low-G ukulele?" },
      a: {
        ru: "При строе с «низкой соль» четвёртая струна настраивается на октаву ниже — G3 (196 Гц). Используйте хроматический режим тюнера: он покажет G3 вместо G4.",
        en: "With low-G tuning the fourth string is an octave lower — G3 (196 Hz). Use the chromatic mode: it shows G3 instead of G4.",
      },
    },
  },
  {
    id: "violin",
    name: { ru: "Скрипка", en: "Violin" },
    title: { ru: "Тюнер для скрипки онлайн — строй G-D-A-E", en: "Violin tuner online — G-D-A-E tuning" },
    h1: { ru: "Тюнер для скрипки", en: "Violin tuner" },
    description: {
      ru: "Тюнер для скрипки онлайн: квинтовый строй G-D-A-E (соль-ре-ля-ми), настройка ноты ля от 440 Гц или 442–443 Гц как в оркестре, определение ноты через микрофон.",
      en: "Online violin tuner: G-D-A-E tuning in fifths, concert A at 440 Hz or 442–443 Hz as in orchestras, and note detection through the microphone.",
    },
    lead: { ru: "Скрипка строится по квинтам: соль, ре, ля, ми — начните с ноты ля.", en: "A violin is tuned in fifths — G, D, A, E; start with the A." },
    about: {
      ru: "Строй скрипки: G3 196 Гц — D4 293,7 Гц — A4 440 Гц — E5 659,3 Гц. Обычно сначала настраивают ля, затем остальные струны по квинтам. Многие оркестры строят чуть выше, на 442–443 Гц — выберите нужное значение в поле «Ля первой октавы».",
      en: "Violin tuning: G3 196 Hz — D4 293.7 Hz — A4 440 Hz — E5 659.3 Hz. Usually the A is tuned first, then the others in fifths. Many orchestras tune slightly higher, at 442–443 Hz — choose that value in the “Concert A” field.",
    },
    stringNames: { ru: ["4-я (соль малой октавы)", "3-я (ре первой октавы)", "2-я (ля первой октавы)", "1-я (ми второй октавы)"], en: ["4th (G)", "3rd (D)", "2nd (A)", "1st (E)"] },
    faq: {
      q: { ru: "Этот тюнер подойдёт для альта и виолончели?", en: "Does this tuner work for viola and cello?" },
      a: {
        ru: "Да, в хроматическом режиме. Альт: C3-G3-D4-A4, виолончель: C2-G2-D3-A3 — тюнер покажет любую из этих нот и отклонение в центах.",
        en: "Yes, in chromatic mode. Viola: C3-G3-D4-A4; cello: C2-G2-D3-A3 — the tuner shows any of these notes and the deviation in cents.",
      },
    },
  },
  {
    id: "balalaika",
    name: { ru: "Балалайка", en: "Balalaika" },
    title: { ru: "Тюнер для балалайки онлайн — академический строй ми-ми-ля", en: "Balalaika tuner online — E-E-A academic tuning" },
    h1: { ru: "Тюнер для балалайки", en: "Balalaika tuner" },
    description: {
      ru: "Тюнер для балалайки прима онлайн: академический строй ми-ми-ля (E4-E4-A4), две нижние струны в унисон. Определение ноты через микрофон и эталонные тоны струн.",
      en: "Online tuner for the prima balalaika: academic E-E-A tuning (E4-E4-A4) with the two lower strings in unison, microphone note detection and reference tones.",
    },
    lead: { ru: "Балалайка прима строится ми-ми-ля: две струны в унисон и третья на кварту выше.", en: "The prima balalaika is tuned E-E-A: two strings in unison and the third a fourth higher." },
    about: {
      ru: "Академический строй балалайки примы: третья и вторая струны — ми первой октавы (E4, 329,6 Гц) в унисон, первая — ля первой октавы (A4, 440 Гц). Сначала настройте ля, затем подтяните обе ми до точного унисона: при точной настройке пропадают «биения».",
      en: "Academic tuning of the prima balalaika: the third and second strings are E4 (329.6 Hz) in unison and the first string is A4 (440 Hz). Tune the A first, then bring both E strings into exact unison — when they match, the beating disappears.",
    },
    stringNames: { ru: ["3-я (ми первой октавы)", "2-я (ми первой октавы)", "1-я (ля первой октавы)"], en: ["3rd (E)", "2nd (E)", "1st (A)"] },
    faq: {
      q: { ru: "Что такое народный строй балалайки?", en: "What is the folk balalaika tuning?" },
      a: {
        ru: "Народный строй — соль-си-ре (G-B-D, мажорное трезвучие), его используют при игре по слуху. Для него используйте хроматический режим тюнера.",
        en: "The folk tuning is G-B-D (a major triad), used when playing by ear. Use the chromatic mode for it.",
      },
    },
  },
  {
    id: "dombra",
    name: { ru: "Домбра", en: "Dombra" },
    title: { ru: "Тюнер для домбры онлайн — строй ре-соль", en: "Dombra tuner online — D-G tuning" },
    h1: { ru: "Тюнер для домбры", en: "Dombra tuner" },
    description: {
      ru: "Тюнер для казахской домбры онлайн: основной квартовый строй ре-соль (D3-G3), определение ноты через микрофон, отклонение в центах и эталонные тоны двух струн.",
      en: "Online tuner for the Kazakh dombra: the main D-G tuning in fourths (D3-G3), microphone note detection, cents deviation and reference tones for both strings.",
    },
    lead: { ru: "Домбру чаще всего строят в кварту: ре и соль малой октавы.", en: "The dombra is most often tuned in fourths: D3 and G3." },
    about: {
      ru: "Основной строй двухструнной казахской домбры — кварта: нижняя струна ре малой октавы (D3, 146,8 Гц), верхняя — соль малой октавы (G3, 196 Гц). Для некоторых кюев используют квинтовый строй ре-ля (D3-A3); его удобно настраивать в хроматическом режиме.",
      en: "The main tuning of the two-string Kazakh dombra is a fourth: the lower string D3 (146.8 Hz) and the upper G3 (196 Hz). Some kuis use the fifth tuning D-A (D3-A3), which is easy to set in chromatic mode.",
    },
    stringNames: { ru: ["нижняя (ре малой октавы)", "верхняя (соль малой октавы)"], en: ["lower (D)", "upper (G)"] },
    faq: {
      q: { ru: "Можно ли строить домбру выше или ниже?", en: "Can the dombra be tuned higher or lower?" },
      a: {
        ru: "Да: многие домбристы подстраивают инструмент под голос, сохраняя интервал кварты между струнами. Главное — точная кварта (5 полутонов), а абсолютная высота может отличаться.",
        en: "Yes: many players tune to suit their voice while keeping a fourth between the strings. The exact fourth (5 semitones) matters more than the absolute pitch.",
      },
    },
  },
];
