import type { QA, ToolDef } from "@/registry/types";

/** One page per screen colour: /white-screen, /black-screen, /red-screen… */
interface ColorPage {
  id: string;
  slug: string;
  icon: string;
  ru: { name: string; title: string; alt: string; desc: string; lead: string; uses: string[]; faq: QA[]; kw: string[] };
  en: { name: string; title: string; alt: string; desc: string; lead: string; uses: string[]; faq: QA[]; kw: string[] };
}

const COMMON_FAQ = {
  ru: [
    { q: "Экран не погаснет сам?", a: "Нет: пока открыт полноэкранный режим, сайт просит браузер не выключать экран (Screen Wake Lock). Если браузер это не поддерживает, увеличьте время до отключения экрана в настройках." },
    { q: "Как выйти из полноэкранного режима?", a: "Нажмите Esc на компьютере или коснитесь экрана и нажмите крестик вверху. На iPhone полноэкранный режим заменяет заливка всего окна — поверните телефон горизонтально, чтобы скрыть панели." },
  ],
  en: [
    { q: "Will the screen turn off by itself?", a: "No: while full screen is open, the site asks the browser to keep the screen on (Screen Wake Lock). If your browser doesn't support it, increase the screen timeout in your settings." },
    { q: "How do I leave full screen?", a: "Press Esc on a computer, or tap the screen and press the cross at the top. On iPhone the colour fills the whole window instead — turn the phone sideways to hide the bars." },
  ],
};

const PAGES: ColorPage[] = [
  {
    id: "white",
    slug: "white-screen",
    icon: "Sun",
    ru: {
      name: "Белый экран",
      title: "Белый экран на весь экран | белый фон онлайн",
      alt: "белый фон на весь экран",
      desc: "Белый экран на весь экран одним нажатием: подсветка лица для звонков и селфи, фонарик, проверка пыли. Тёплый или холодный оттенок, регулировка яркости.",
      lead: "Нажмите на белый прямоугольник — экран станет полностью белым. Оттенок можно сделать тёплым, как лампа, или холодным.",
      uses: [
        "Подсветка лица для видеозвонка или селфи вечером: поставьте ноутбук или планшет перед собой — это мягкая «кольцевая лампа».",
        "Фонарик: телефон с белым экраном светит мягче вспышки и не слепит.",
        "Проверка экрана на пыль, разводы и тёмные битые пиксели.",
        "Подсветка снизу для перерисовки рисунка через тонкую бумагу.",
      ],
      faq: [
        { q: "Можно ли сделать белый свет теплее?", a: "Да: ползунок «Оттенок белого» меняет цветовую температуру от 1900 K (как свеча) до 10 000 K (холодный голубоватый). Для лица на видео обычно приятнее 4000–5000 K." },
        { q: "Чем это лучше вспышки телефона?", a: "Экран светит ровно и мягко, не слепит и не даёт резких теней — поэтому его используют вместо кольцевой лампы для звонков и селфи." },
      ],
      kw: ["белый экран", "белый фон на весь экран", "белый экран для подсветки", "белый экран фонарик", "white screen"],
    },
    en: {
      name: "White screen",
      title: "White Screen — Full-Screen White Light Online",
      alt: "full screen white light",
      desc: "A full white screen in one tap: face light for calls and selfies, a soft flashlight, dust checks. Warm or cool white and adjustable brightness.",
      lead: "Tap the white rectangle and your screen turns completely white. Make it warm like a bulb or cool like daylight.",
      uses: [
        "Face light for an evening video call or selfie: put a laptop or tablet in front of you as a soft ring light.",
        "A flashlight that's softer than the camera flash.",
        "Checking the screen for dust, smudges and dark dead pixels.",
        "Back light for tracing a drawing through thin paper.",
      ],
      faq: [
        { q: "Can I make the white warmer?", a: "Yes: the White tone slider changes the colour temperature from 1900 K (candle) to 10,000 K (cold bluish). For faces on video, 4000–5000 K usually looks best." },
        { q: "Why use this instead of the phone flash?", a: "A screen gives even, soft light without glare or harsh shadows, which is why people use it as a ring light for calls and selfies." },
      ],
      kw: ["white screen", "full white screen", "white light screen", "white screen flashlight"],
    },
  },
  {
    id: "black",
    slug: "black-screen",
    icon: "Moon",
    ru: {
      name: "Чёрный экран",
      title: "Чёрный экран на весь экран | чёрный фон онлайн",
      alt: "чёрный фон на весь экран",
      desc: "Полностью чёрный экран на весь экран: проверка засветов и светящихся пикселей, «выключенный» экран без выключения, экономия заряда на OLED.",
      lead: "Экран становится полностью чёрным — удобно проверить засветы по краям и застрявшие пиксели, или просто «погасить» экран, не выключая компьютер.",
      uses: [
        "Проверка засветов: в тёмной комнате светлые пятна по краям чёрного экрана — дефект подсветки.",
        "Поиск застрявших пикселей — они светятся точками на чёрном.",
        "«Выключенный» экран, когда компьютер должен продолжать работу: музыка, загрузка, трансляция.",
        "На OLED-экранах чёрный цвет не расходует энергию — экран фактически выключен.",
      ],
      faq: [
        { q: "Почему на чёрном видны светлые пятна по краям?", a: "Это засветы — свет подсветки ЖК-матрицы проходит у краёв рамки. Небольшие засветы есть почти у всех ЖК-мониторов; заметные при обычной яркости — повод для гарантийной проверки." },
        { q: "Экономит ли чёрный экран заряд?", a: "На OLED и AMOLED (большинство современных смартфонов) — да: чёрные пиксели не светятся. На ЖК-экранах подсветка работает всегда, поэтому экономия минимальна." },
      ],
      kw: ["черный экран", "черный фон на весь экран", "черный экран онлайн", "black screen"],
    },
    en: {
      name: "Black screen",
      title: "Black Screen — Full-Screen Black Online",
      alt: "full screen black background",
      desc: "A completely black full screen: check backlight bleed and lit stuck pixels, blank the display without turning it off, save battery on OLED.",
      lead: "The screen goes completely black — handy for checking edge backlight bleed and stuck pixels, or for blanking the display while the computer keeps working.",
      uses: [
        "Backlight bleed check: in a dark room, bright patches along the edges of a black screen are a backlight defect.",
        "Finding stuck pixels — they show as lit dots on black.",
        "Blanking the screen while music, a download or a stream keeps running.",
        "On OLED screens black pixels are off and use no power.",
      ],
      faq: [
        { q: "Why are there bright patches at the edges?", a: "That's backlight bleed — light from the LCD backlight leaking at the bezel. Most LCDs have a little; bleed visible at normal brightness is worth a warranty check." },
        { q: "Does a black screen save battery?", a: "On OLED and AMOLED screens (most modern phones) yes: black pixels are off. On LCDs the backlight is always on, so the saving is tiny." },
      ],
      kw: ["black screen", "full black screen", "black screen online", "blank screen"],
    },
  },
  {
    id: "red",
    slug: "red-screen",
    icon: "Square",
    ru: {
      name: "Красный экран",
      title: "Красный экран на весь экран | красный фон онлайн",
      alt: "красный фон на весь экран",
      desc: "Красный экран на весь экран: свет, который не сбивает ночное зрение (астрономия, походы), проверка красных субпикселей, фон для фото и видео.",
      lead: "Экран заливается чистым красным. Тусклый красный свет не сбивает привыкание глаз к темноте — им пользуются астрономы и туристы.",
      uses: [
        "Ночной свет, который не сбивает темновую адаптацию глаз: звёздные карты, ночная рыбалка, поход.",
        "Проверка экрана: на красном видны точки, где не работает красный субпиксель.",
        "Цветной фон или подсветка для фото и видео.",
      ],
      faq: [
        { q: "Почему для ночного зрения нужен именно красный?", a: "Палочки сетчатки, отвечающие за зрение в темноте, почти не чувствительны к красному свету. Поэтому тусклый красный не «сбивает» привыкание глаз к темноте. Убавьте яркость до 10–20 %." },
      ],
      kw: ["красный экран", "красный фон на весь экран", "красный экран онлайн", "red screen"],
    },
    en: {
      name: "Red screen",
      title: "Red Screen — Full-Screen Red Online",
      alt: "full screen red background",
      desc: "A full red screen: light that keeps your night vision (stargazing, camping), red subpixel checks, a colour backdrop for photos and video.",
      lead: "The screen fills with pure red. Dim red light doesn't ruin dark adaptation — astronomers and campers use it.",
      uses: ["Night light that keeps dark adaptation: star charts, night fishing, camping.", "Screen check: red reveals dots where the red subpixel is dead.", "A colour backdrop or light for photos and video."],
      faq: [{ q: "Why red for night vision?", a: "The rod cells we use in the dark are almost insensitive to red, so dim red light doesn't undo dark adaptation. Turn brightness down to 10–20%." }],
      kw: ["red screen", "full red screen", "red light screen"],
    },
  },
  {
    id: "green",
    slug: "green-screen",
    icon: "Square",
    ru: {
      name: "Зелёный экран",
      title: "Зелёный экран на весь экран | зелёный фон (хромакей)",
      alt: "зелёный фон хромакей",
      desc: "Зелёный экран на весь экран: фон-хромакей для съёмки предметов с заменой фона, проверка зелёных субпикселей, яркий зелёный свет.",
      lead: "Экран заливается чистым зелёным — это готовый хромакей для съёмки небольших предметов на телефон с последующей заменой фона.",
      uses: [
        "Хромакей для небольших предметов: поставьте предмет перед планшетом или монитором и замените зелёный фон в видеоредакторе.",
        "Проверка экрана: на зелёном видны точки, где не работает зелёный субпиксель.",
        "Цветная подсветка для фото.",
      ],
      faq: [
        { q: "Подойдёт ли экран как хромакей?", a: "Для небольших предметов и крупных планов — да: экран светится ровным зелёным. Снимайте под углом, чтобы не было бликов, и не ставьте предмет вплотную — иначе на нём появится зелёный отсвет." },
      ],
      kw: ["зеленый экран", "зеленый фон", "хромакей онлайн", "green screen", "зеленый экран для видео"],
    },
    en: {
      name: "Green screen",
      title: "Green Screen — Full-Screen Green (Chroma Key)",
      alt: "full screen chroma key green",
      desc: "A full green screen: a chroma key backdrop for filming small objects and replacing the background, green subpixel checks, bright green light.",
      lead: "The screen fills with pure green — a ready chroma key for filming small objects on your phone and replacing the background later.",
      uses: ["Chroma key for small objects: place the object in front of a tablet or monitor and key out the green in your editor.", "Screen check: green reveals dots where the green subpixel is dead.", "Colour light for photos."],
      faq: [{ q: "Does a screen work as a chroma key?", a: "For small objects and close-ups, yes: the screen glows evenly green. Film at a slight angle to avoid reflections and keep the object away from the screen so it doesn't pick up a green cast." }],
      kw: ["green screen", "chroma key green", "full green screen"],
    },
  },
  {
    id: "blue",
    slug: "blue-screen",
    icon: "Square",
    ru: {
      name: "Синий экран",
      title: "Синий экран на весь экран | синий фон онлайн",
      alt: "синий фон на весь экран",
      desc: "Синий экран на весь экран: синий хромакей для съёмки, проверка синих субпикселей, цветной фон и подсветка. Яркость регулируется.",
      lead: "Экран заливается чистым синим — для хромакея, проверки субпикселей или цветной подсветки.",
      uses: ["Синий хромакей, если в кадре есть зелёные детали.", "Проверка экрана: на синем видны точки, где не работает синий субпиксель.", "Цветной фон и подсветка для фото и видео."],
      faq: [{ q: "Это тот самый «синий экран смерти»?", a: "Нет, это просто синяя заливка в браузере — с компьютером всё в порядке. Выйти можно клавишей Esc или крестиком вверху." }],
      kw: ["синий экран", "синий фон на весь экран", "синий экран онлайн", "blue screen"],
    },
    en: {
      name: "Blue screen",
      title: "Blue Screen — Full-Screen Blue Online",
      alt: "full screen blue background",
      desc: "A full blue screen: a blue chroma key for filming, blue subpixel checks, a colour backdrop and light. Brightness is adjustable.",
      lead: "The screen fills with pure blue — for chroma key, subpixel checks or colour light.",
      uses: ["Blue chroma key when the shot has green in it.", "Screen check: blue reveals dots where the blue subpixel is dead.", "A colour backdrop and light for photos and video."],
      faq: [{ q: "Is this the “blue screen of death”?", a: "No, it's just a blue fill in your browser — your computer is fine. Leave with Esc or the cross at the top." }],
      kw: ["blue screen", "full blue screen", "blue background"],
    },
  },
  {
    id: "yellow",
    slug: "yellow-screen",
    icon: "Square",
    ru: {
      name: "Жёлтый экран",
      title: "Жёлтый экран на весь экран | жёлтый фон онлайн",
      alt: "жёлтый фон на весь экран",
      desc: "Жёлтый экран на весь экран: тёплая цветная подсветка, проверка экрана на жёлтом фоне, яркий фон для фото и видео. Регулировка яркости.",
      lead: "Экран заливается чистым жёлтым — для подсветки, яркого фона или проверки равномерности цвета.",
      uses: ["Тёплая яркая подсветка для фото и видео.", "Проверка экрана: на жёлтом (красный + зелёный) заметны точки, где не работает один из субпикселей.", "Яркий фон для презентации или сигнал."],
      faq: [{ q: "Чем жёлтый полезен для проверки экрана?", a: "Жёлтый — это одновременно горящие красный и зелёный субпиксели. Если один из них не работает, точка будет красной или зелёной на жёлтом фоне." }],
      kw: ["желтый экран", "желтый фон на весь экран", "yellow screen"],
    },
    en: {
      name: "Yellow screen",
      title: "Yellow Screen — Full-Screen Yellow Online",
      alt: "full screen yellow background",
      desc: "A full yellow screen: warm colour light, screen checks on yellow, a bright backdrop for photos and video. Adjustable brightness.",
      lead: "The screen fills with pure yellow — for light, a bright backdrop or checking colour uniformity.",
      uses: ["Warm bright light for photos and video.", "Screen check: on yellow (red + green) a dot with a dead subpixel shows red or green.", "A bright backdrop or signal."],
      faq: [{ q: "Why is yellow useful for screen checks?", a: "Yellow lights the red and green subpixels together. If one is dead, the dot shows red or green on the yellow." }],
      kw: ["yellow screen", "full yellow screen"],
    },
  },
  {
    id: "orange",
    slug: "orange-screen",
    icon: "Square",
    ru: {
      name: "Оранжевый экран",
      title: "Оранжевый экран на весь экран | оранжевый фон онлайн",
      alt: "оранжевый фон на весь экран",
      desc: "Оранжевый экран на весь экран: тёплый ночник почти без синего света, уютная подсветка, цветной фон для фото и видео. Яркость регулируется.",
      lead: "Экран светит тёплым оранжевым — как ночник: почти без синего света, который мешает уснуть.",
      uses: ["Ночник у кровати или для кормления ребёнка: убавьте яркость до 10–20 %.", "Тёплая подсветка для фото и видео.", "Уютный фон."],
      faq: [{ q: "Правда ли оранжевый свет лучше перед сном?", a: "Оранжевый почти не содержит синих волн, которые сильнее всего подавляют выработку мелатонина. Поэтому тусклый тёплый свет вечером предпочтительнее яркого белого." }],
      kw: ["оранжевый экран", "оранжевый фон", "ночник онлайн", "orange screen"],
    },
    en: {
      name: "Orange screen",
      title: "Orange Screen — Full-Screen Orange Online",
      alt: "full screen orange light",
      desc: "A full orange screen: a warm night light with almost no blue light, cosy light, a colour backdrop for photos and video. Adjustable brightness.",
      lead: "The screen glows warm orange — like a night light, with almost none of the blue light that keeps you awake.",
      uses: ["A bedside or nursing night light: dim it to 10–20%.", "Warm light for photos and video.", "A cosy backdrop."],
      faq: [{ q: "Is orange light better before sleep?", a: "Orange has very little of the blue light that suppresses melatonin the most, so dim warm light in the evening is preferable to bright white." }],
      kw: ["orange screen", "night light online", "full orange screen"],
    },
  },
  {
    id: "pink",
    slug: "pink-screen",
    icon: "Square",
    ru: {
      name: "Розовый экран",
      title: "Розовый экран на весь экран | розовый фон онлайн",
      alt: "розовый фон на весь экран",
      desc: "Розовый экран на весь экран: мягкая подсветка лица для селфи и видео, розовый фон для фото, атмосферный свет. Регулировка яркости.",
      lead: "Экран светит мягким розовым — тёплая подсветка лица для селфи и видео или атмосферный фон.",
      uses: ["Мягкая подсветка лица для селфи: розовый свет даёт тёплый оттенок коже.", "Розовый фон для фото предметов.", "Атмосферный свет для вечеринки или стрима."],
      faq: [{ q: "Можно ли сделать розовый светлее или насыщеннее?", a: "Яркость меняется ползунком, а в выборе цвета есть кнопка «Свой цвет» — там можно подобрать любой оттенок розового." }],
      kw: ["розовый экран", "розовый фон на весь экран", "pink screen"],
    },
    en: {
      name: "Pink screen",
      title: "Pink Screen — Full-Screen Pink Light Online",
      alt: "full screen pink background",
      desc: "A full pink screen: soft face light for selfies and video, a pink backdrop for photos, mood light. Adjustable brightness.",
      lead: "The screen glows soft pink — a warm face light for selfies and video or a mood backdrop.",
      uses: ["Soft face light for selfies: pink adds warmth to skin tones.", "A pink backdrop for product photos.", "Mood light for a party or stream."],
      faq: [{ q: "Can I pick a different pink?", a: "Brightness has a slider, and the colour row has a Custom colour button where you can choose any shade." }],
      kw: ["pink screen", "pink light screen", "full pink screen"],
    },
  },
  {
    id: "purple",
    slug: "purple-screen",
    icon: "Square",
    ru: {
      name: "Фиолетовый экран",
      title: "Фиолетовый экран на весь экран | фиолетовый фон онлайн",
      alt: "фиолетовый фон на весь экран",
      desc: "Фиолетовый экран на весь экран: атмосферная подсветка для вечеринки и стрима, цветной фон для фото и видео. Регулировка яркости.",
      lead: "Экран заливается фиолетовым — атмосферный свет для вечеринки, стрима или фото.",
      uses: ["Атмосферная подсветка комнаты или стрима.", "Цветной фон для фото и видео.", "Проверка экрана на сочетании красного и синего субпикселей."],
      faq: [{ q: "Это ультрафиолет?", a: "Нет. Экран не излучает ультрафиолет — это обычный видимый фиолетовый цвет из красного и синего субпикселей. Проявлять невидимые чернила или проверять купюры им нельзя." }],
      kw: ["фиолетовый экран", "фиолетовый фон", "purple screen"],
    },
    en: {
      name: "Purple screen",
      title: "Purple Screen — Full-Screen Purple Online",
      alt: "full screen purple background",
      desc: "A full purple screen: mood light for a party or stream, a colour backdrop for photos and video. Adjustable brightness.",
      lead: "The screen fills with purple — mood light for a party, a stream or photos.",
      uses: ["Mood lighting for a room or stream.", "A colour backdrop for photos and video.", "A screen check with red and blue subpixels lit together."],
      faq: [{ q: "Is this UV light?", a: "No. A screen emits no ultraviolet — this is ordinary visible purple from the red and blue subpixels. It can't reveal invisible ink or check banknotes." }],
      kw: ["purple screen", "full purple screen"],
    },
  },
  {
    id: "gray",
    slug: "gray-screen",
    icon: "Square",
    ru: {
      name: "Серый экран",
      title: "Серый экран на весь экран | серый фон для проверки",
      alt: "серый фон на весь экран",
      desc: "Серый экран на весь экран: проверка равномерности подсветки, «грязного экрана» и полос, выгорания OLED. Регулировка яркости серого.",
      lead: "Ровный серый — лучший фон, чтобы увидеть пятна, тёмные углы, полосы и следы выгорания на экране.",
      uses: [
        "Равномерность подсветки: тёмные углы и светлые пятна видны на сером лучше всего.",
        "«Грязный экран» (DSE) у телевизоров: полосы и разводы при движении камеры по ровному фону.",
        "Выгорание OLED: на сером проявляются тени от значков и панелей.",
      ],
      faq: [{ q: "Какую яркость серого выбрать?", a: "Проверьте несколько: 50 % хорошо показывает неравномерность подсветки, 20–30 % — пятна и выгорание на OLED. Яркость меняется ползунком или стрелками ↑/↓." }],
      kw: ["серый экран", "серый фон", "проверка равномерности подсветки", "gray screen"],
    },
    en: {
      name: "Gray screen",
      title: "Gray Screen — Full-Screen Gray for Screen Checks",
      alt: "full screen gray background",
      desc: "A full gray screen: check backlight uniformity, the dirty screen effect and banding, and OLED burn-in. Adjustable gray level.",
      lead: "Even gray is the best background for spotting blotches, dark corners, bands and burn-in shadows.",
      uses: ["Backlight uniformity: dark corners and bright patches show best on gray.", "Dirty screen effect on TVs: bands and smudges on an even background.", "OLED burn-in: shadows of icons and bars show on gray."],
      faq: [{ q: "Which gray level should I use?", a: "Try several: 50% shows uneven backlight well, 20–30% reveals blotches and OLED burn-in. Change it with the slider or the ↑/↓ keys." }],
      kw: ["gray screen", "grey screen", "backlight uniformity test"],
    },
  },
];

function colorTool(p: ColorPage): ToolDef {
  const others = PAGES.filter((x) => x.slug !== p.slug).slice(0, 3).map((x) => x.slug);
  return {
    slug: p.slug,
    component: "screen/color",
    icon: p.icon,
    popular: p.id === "white" || p.id === "black",
    name: { ru: p.ru.name, en: p.en.name },
    title: { ru: p.ru.title, en: p.en.title },
    seoAlt: { ru: p.ru.alt, en: p.en.alt },
    h1: { ru: p.ru.name, en: p.en.name },
    description: { ru: p.ru.desc, en: p.en.desc },
    lead: { ru: p.ru.lead, en: p.en.lead },
    keywords: { ru: p.ru.kw, en: p.en.kw },
    props: { color: p.id },
    howTo: {
      ru: [
        "Нажмите на цветной прямоугольник или клавишу F — экран заполнится цветом.",
        "Стрелками ↑/↓ или кнопками −/+ настройте яркость, стрелками ←/→ смените цвет.",
        "Чтобы выйти, нажмите Esc или коснитесь экрана и нажмите крестик.",
      ],
      en: [
        "Tap the coloured rectangle or press F — the screen fills with colour.",
        "Use ↑/↓ or the −/+ buttons for brightness and ←/→ to change the colour.",
        "To leave, press Esc or tap the screen and press the cross.",
      ],
    },
    about: {
      ru: [
        "Цвет заливает весь экран: на компьютере и Android — в полноэкранном режиме, на iPhone — всё окно браузера. Яркость меняется от 5 до 100 % поверх яркости самого экрана, у белого можно выбрать тёплый или холодный оттенок, а через «Свой цвет» — любой другой.",
        "Пока цвет открыт, экран не гаснет, а курсор и панель управления прячутся через пару секунд. Настройки яркости и оттенка запоминаются в браузере.",
      ],
      en: [
        "The colour fills the whole screen: full screen on computers and Android, the whole browser window on iPhone. Brightness goes from 5 to 100% on top of the display's own brightness; white can be warm or cool, and Custom colour gives any other shade.",
        "While the colour is open the display stays on, and the cursor and control bar hide after a couple of seconds. Brightness and tone are remembered in your browser.",
      ],
    },
    faq: { ru: [...p.ru.faq, ...COMMON_FAQ.ru], en: [...p.en.faq, ...COMMON_FAQ.en] },
    related: [...others, "dead-pixel-test", "monitor-test"],
    blocks: (l) => [
      {
        type: "list",
        title: l === "ru" ? `Зачем нужен ${p.ru.name.toLowerCase()}` : `What a ${p.en.name.toLowerCase()} is for`,
        items: l === "ru" ? p.ru.uses : p.en.uses,
      },
    ],
  };
}

export const COLOR_TOOLS: ToolDef[] = PAGES.map(colorTool);
