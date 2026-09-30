import type { ToolDef } from "@/registry/types";

/** The color picker (/color-picker). */
export const PICKER_TOOL: ToolDef = {
  slug: "color-picker",
  component: "color/picker",
  icon: "Pipette",
  popular: true,
  wide: true,
  name: { ru: "Палитра цветов", en: "Color picker" },
  title: { ru: "Палитра цветов онлайн — выбор цвета, HEX, RGB, HSL", en: "Color picker online — HEX, RGB, HSL and OKLCH codes" },
  h1: { ru: "Палитра цветов онлайн", en: "Color picker" },
  description: {
    ru: "Онлайн-палитра: выберите цвет мышью, клавиатурой или пипеткой и скопируйте код HEX, RGB, HSL, OKLCH или CMYK. Плюс 148 цветов CSS, контраст и палитры.",
    en: "Online color picker: choose a color with the mouse, keyboard or eyedropper and copy HEX, RGB, HSL, OKLCH or CMYK. Plus 148 CSS colors, contrast and palettes.",
  },
  lead: {
    ru: "Выберите цвет и скопируйте его код в любом формате — от HEX и RGB до OKLCH и CMYK.",
    en: "Pick a color and copy its code in any format — from HEX and RGB to OKLCH and CMYK.",
  },
  keywords: {
    ru: ["палитра цветов", "выбор цвета", "подобрать цвет", "пипетка", "код цвета", "color picker"],
    en: ["color picker", "colour picker", "hex color picker", "eyedropper", "color code"],
  },
  props: { initial: "#3B82F6" },
  howTo: {
    ru: [
      "Кликните или проведите по квадрату, чтобы выбрать насыщенность и яркость, а ползунком ниже — оттенок.",
      "Или введите готовый цвет: #3B82F6, rgb(59 130 246), hsl(), oklch() или название вроде tomato.",
      "В Chrome и Edge можно взять цвет прямо с экрана кнопкой-пипеткой.",
      "Скопируйте нужный формат: HEX, RGB, HSL, HWB, HSV, CMYK, Lab, LCH, OKLab, OKLCH или Display P3.",
    ],
    en: [
      "Click or drag in the square to set saturation and brightness, and use the slider below for the hue.",
      "Or type a color: #3B82F6, rgb(59 130 246), hsl(), oklch() or a name such as tomato.",
      "In Chrome and Edge you can pick a color from the screen with the eyedropper button.",
      "Copy the format you need: HEX, RGB, HSL, HWB, HSV, CMYK, Lab, LCH, OKLab, OKLCH or Display P3.",
    ],
  },
  faq: {
    ru: [
      { q: "Как управлять палитрой с клавиатуры?", a: "Перейдите клавишей Tab на квадрат: стрелки влево и вправо меняют насыщенность, вверх и вниз — яркость, с Shift шаг в 10 раз больше. Ползунки оттенка и прозрачности тоже работают стрелками, Home и End." },
      { q: "Почему оттенок не сбрасывается, когда цвет уходит в серый?", a: "У серых, чёрного и белого тон не определён, поэтому палитра запоминает последний выбранный оттенок. Вернёте насыщенность — вернётся и ваш цвет, а не красный по умолчанию." },
      { q: "Где работает пипетка?", a: "Кнопка использует EyeDropper API, который есть в Chrome, Edge и Opera на компьютере. В Firefox и Safari его пока нет, поэтому там кнопка не показывается." },
      { q: "Чем OKLCH удобнее HSL?", a: "OKLCH перцептивно равномерен: одинаковая светлота L выглядит одинаково светлой при любом тоне, а в HSL жёлтый при L = 50 % намного светлее синего. Поэтому темы и палитры удобнее строить в OKLCH — так делает и Tailwind CSS v4." },
      { q: "Что за формат Display P3 в списке?", a: "Это координаты цвета в более широком пространстве экранов Apple и многих смартфонов, в CSS — color(display-p3 …). Для цвета из sRGB все три значения лежат в пределах 0–1." },
    ],
    en: [
      { q: "How do I use the picker with a keyboard?", a: "Tab to the square: left and right arrows change saturation, up and down change brightness, and Shift makes the step 10× bigger. The hue and opacity sliders work with the arrow keys, Home and End too." },
      { q: "Why doesn't the hue reset when the color turns gray?", a: "Grays, black and white have no defined hue, so the picker remembers the last hue you used. Bring the saturation back and you get your color back instead of a default red." },
      { q: "Where does the eyedropper work?", a: "The button uses the EyeDropper API available in desktop Chrome, Edge and Opera. Firefox and Safari don't support it yet, so the button is hidden there." },
      { q: "Why use OKLCH instead of HSL?", a: "OKLCH is perceptually uniform: the same lightness L looks equally light for every hue, whereas in HSL a 50% yellow is far lighter than a 50% blue. That makes OKLCH better for themes and palettes — Tailwind CSS v4 uses it." },
      { q: "What is the Display P3 value?", a: "It is the color's coordinates in the wider gamut of Apple displays and many phones, written in CSS as color(display-p3 …). For an sRGB color all three values stay within 0–1." },
    ],
  },
  about: {
    ru: [
      "Палитра работает в модели HSV, как в графических редакторах: квадрат задаёт насыщенность и яркость, один ползунок — тон, другой — прозрачность. Все коды пересчитываются сразу, без кнопки «Применить».",
      "Поле ввода понимает любой цвет CSS: HEX из 3, 4, 6 и 8 цифр, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color() и 148 названий. Рядом показаны ближайшее название CSS и контраст цвета с белым и чёрным по WCAG.",
      "Ниже собраны все инструменты раздела: проверка контраста, генераторы палитр и оттенков, градиенты, смешивание цветов, палитры Tailwind и Material, симуляция дальтонизма и страницы всех именованных цветов.",
    ],
    en: [
      "The picker uses the HSV model like graphics editors do: the square sets saturation and brightness, one slider the hue and another the opacity. Every code updates immediately, with no Apply button.",
      "The input accepts any CSS color: 3-, 4-, 6- and 8-digit HEX, rgb(), hsl(), hwb(), lab(), lch(), oklab(), oklch(), color() and the 148 names. Next to it you see the nearest CSS color name and the WCAG contrast against white and black.",
      "Below are all tools of the section: contrast checker, palette and shade generators, gradients, color mixing, Tailwind and Material palettes, a color-blindness simulator and a page for every named color.",
    ],
  },
};

export const CONTRAST_TOOL: ToolDef = {
  slug: "contrast-checker",
  component: "color/contrast",
  icon: "Contrast",
  popular: true,
  wide: true,
  name: { ru: "Проверка контраста", en: "Contrast checker" },
  title: { ru: "Проверка контраста цветов онлайн — WCAG 2.2 и APCA", en: "Color contrast checker — WCAG 2.2 AA/AAA and APCA" },
  h1: { ru: "Проверка контраста цветов", en: "Color contrast checker" },
  description: {
    ru: "Контраст текста и фона по WCAG 2.2: коэффициент без округления вверх, уровни AA и AAA, APCA Lc, учёт прозрачности и подбор ближайшего цвета, который пройдёт.",
    en: "Check text/background contrast against WCAG 2.2: a ratio that is never rounded up, AA and AAA levels, APCA Lc, alpha compositing and the nearest passing color.",
  },
  lead: {
    ru: "Введите цвет текста и фона — коэффициент контраста и вердикт AA/AAA появятся сразу.",
    en: "Enter the text and background colors to get the contrast ratio and AA/AAA verdict instantly.",
  },
  keywords: {
    ru: ["контраст цветов", "проверка контраста", "wcag", "доступность", "contrast checker", "apca"],
    en: ["contrast checker", "wcag contrast", "color contrast", "accessibility", "apca"],
  },
  howTo: {
    ru: [
      "Введите цвет текста и цвет фона в любом формате CSS — например, #6363F8 и white.",
      "Посмотрите коэффициент и вердикты: AA и AAA для обычного и крупного текста и 3:1 для элементов интерфейса.",
      "Если проверка не пройдена, нажмите «Применить» у предложенного цвета — он ближе всего к исходному и проходит порог.",
      "Сверьтесь с APCA Lc — методом из черновика WCAG 3, который точнее оценивает тёмные темы.",
    ],
    en: [
      "Enter the text color and background color in any CSS format — for example #6363F8 and white.",
      "Read the ratio and verdicts: AA and AAA for normal and large text, and 3:1 for UI components.",
      "If a check fails, press Apply next to a suggested color — it is the closest one that passes.",
      "Compare with APCA Lc, the WCAG 3 draft method that judges dark themes more accurately.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему 4,49:1 не проходит AA?", a: "Порог AA для обычного текста — ровно 4,5:1, и округлять вверх нельзя. Мы отбрасываем лишние знаки, а не округляем: #6363F8 на белом даёт 4,4955…, поэтому показано 4,49:1 и «не проходит». Сервисы, которые показывают здесь 4,50, вводят в заблуждение." },
      { q: "Что считается крупным текстом?", a: "По WCAG — от 18 pt (24 px) обычного начертания или от 14 pt (≈ 18,66 px) жирного. Для него достаточно 3:1 на уровне AA и 4,5:1 на уровне AAA." },
      { q: "Как учитывается прозрачность?", a: "Полупрозрачный фон сначала накладывается на белую страницу, затем текст — на получившийся цвет, и проверяется то, что реально видно. transparent — это полностью прозрачный цвет, а не чёрный." },
      { q: "Нужно ли ориентироваться на APCA?", a: "APCA учитывает полярность и размер шрифта точнее, но это черновик WCAG 3. Обязательными остаются WCAG 2.x, в России — ГОСТ Р 52872-2019, в Евросоюзе — EN 301 549, поэтому APCA — дополнительный ориентир." },
      { q: "Что такое контраст 3:1 для элементов интерфейса?", a: "Критерий 1.4.11 «Нетекстовый контраст»: границы полей ввода, иконки, индикатор фокуса и элементы графиков должны отличаться от соседних цветов минимум в 3 раза." },
    ],
    en: [
      { q: "Why doesn't 4.49:1 pass AA?", a: "The AA threshold for normal text is exactly 4.5:1 and must not be rounded up. We truncate instead of rounding: #6363F8 on white is 4.4955…, so it shows 4.49:1 and fails. Tools that display 4.50 here are misleading." },
      { q: "What counts as large text?", a: "In WCAG, 18 pt (24 px) regular or 14 pt (≈ 18.66 px) bold and above. It needs 3:1 for AA and 4.5:1 for AAA." },
      { q: "How is transparency handled?", a: "A translucent background is first composited over a white page, then the text over the result, and the visible colors are checked. transparent is a fully transparent color, not black." },
      { q: "Should I follow APCA?", a: "APCA handles polarity and font size more accurately, but it is part of the WCAG 3 draft. WCAG 2.x (and EN 301 549 in the EU, Section 508 in the US) remains the requirement, so treat APCA as an extra guide." },
      { q: "What is the 3:1 rule for UI components?", a: "Success criterion 1.4.11 Non-text Contrast: input borders, icons, focus indicators and chart elements need at least 3:1 against adjacent colors." },
    ],
  },
  about: {
    ru: [
      "Контраст WCAG 2 считается по относительной яркости: (L1 + 0,05) / (L2 + 0,05), где L1 и L2 — яркость более светлого и более тёмного цвета после линеаризации sRGB. Результат — от 1:1 (одинаковые цвета) до 21:1 (чёрный на белом).",
      "Мы показываем число, округлённое вниз до сотых, а пороги проверяем по точному значению, поэтому цифра и вердикт никогда не противоречат друг другу. Альфа-канал не отбрасывается: учитывается прозрачность обоих цветов.",
      "Если цвет не проходит, инструмент подбирает ближайший вариант, меняя только светлоту в OKLCH: тон и насыщенность сохраняются, и фирменный цвет остаётся узнаваемым.",
    ],
    en: [
      "WCAG 2 contrast is computed from relative luminance: (L1 + 0.05) / (L2 + 0.05), where L1 and L2 are the luminance of the lighter and darker color after sRGB linearization. It ranges from 1:1 (same color) to 21:1 (black on white).",
      "The ratio is shown truncated to two decimals and the thresholds are checked against the exact value, so the number and the verdict can never contradict each other. Alpha is not dropped: the opacity of both colors is taken into account.",
      "When a color fails, the tool finds the closest variant by changing only its OKLCH lightness: hue and chroma are kept, so a brand color stays recognizable.",
    ],
  },
};

export const NAME_TOOL: ToolDef = {
  slug: "color-name-finder",
  component: "color/name",
  icon: "Tag",
  name: { ru: "Название цвета", en: "Color name finder" },
  title: { ru: "Название цвета по коду HEX — определить онлайн", en: "Color name finder — get the CSS color name from HEX" },
  h1: { ru: "Определить название цвета по коду", en: "Color name finder" },
  description: {
    ru: "Узнайте название цвета по HEX, RGB или HSL: ближайшие из 148 именованных цветов CSS с расстоянием ΔE OK, образцами и ссылками на коды каждого цвета.",
    en: "Find a color's name from HEX, RGB or HSL: the nearest of the 148 CSS named colors with ΔE OK distance, swatches and links to every color's codes.",
  },
  lead: {
    ru: "Введите код — покажем ближайшие именованные цвета CSS и насколько они похожи.",
    en: "Enter a code to see the nearest CSS named colors and how close they are.",
  },
  keywords: { ru: ["название цвета", "как называется цвет", "имя цвета по hex"], en: ["color name", "name that color", "hex to color name"] },
  howTo: {
    ru: [
      "Введите или выберите цвет: HEX, rgb(), hsl(), oklch() или другое название.",
      "Список обновляется сразу: первым идёт самое близкое название CSS.",
      "Откройте страницу найденного цвета, чтобы увидеть его коды, оттенки и контраст.",
    ],
    en: [
      "Enter or pick a color: HEX, rgb(), hsl(), oklch() or another name.",
      "The list updates instantly, with the closest CSS name first.",
      "Open the color's page to see its codes, tints and contrast.",
    ],
  },
  faq: {
    ru: [
      { q: "Как определяется «ближайший» цвет?", a: "По расстоянию в пространстве OKLab (ΔE OK) — оно лучше соответствует восприятию, чем разница RGB. До 0,02 цвета на глаз не отличить, до 0,05 — очень похожи." },
      { q: "Почему среди названий нет «цвета морской волны» для моего оттенка?", a: "Сравнение идёт только со 148 стандартными названиями CSS, которые понимает любой браузер. У стандарта нет тысяч «маркетинговых» имён, зато каждое найденное название можно сразу писать в код." },
      { q: "Можно ли использовать найденное название в CSS?", a: "Да, это ключевые слова CSS: color: tomato; работает во всех браузерах. Если расстояние не нулевое, помните, что название даёт немного другой цвет." },
    ],
    en: [
      { q: "How is the “nearest” color chosen?", a: "By distance in the OKLab space (ΔE OK), which matches perception better than an RGB difference. Below 0.02 the colors look identical, below 0.05 very similar." },
      { q: "Why don't I get a fancy name like “seafoam” for my color?", a: "We compare only with the 148 standard CSS names that every browser understands. The standard has no thousands of marketing names, but every name found can go straight into your code." },
      { q: "Can I use the found name in CSS?", a: "Yes, they are CSS keywords: color: tomato; works in every browser. If the distance isn't zero, remember the name gives a slightly different color." },
    ],
  },
  about: {
    ru: [
      "Инструмент сравнивает ваш цвет со всеми 148 именованными цветами CSS в перцептивном пространстве OKLab и сортирует их по расстоянию. Синонимы вроде grey и gray показываются один раз.",
      "Это удобно, когда нужно назвать цвет в дизайн-системе, подобрать ключевое слово для быстрого прототипа или просто понять, к какой группе относится оттенок.",
    ],
    en: [
      "The tool compares your color with all 148 CSS named colors in the perceptual OKLab space and sorts them by distance. Synonyms such as grey and gray appear once.",
      "It helps when you need to name a color in a design system, pick a keyword for a quick prototype, or just see which family a shade belongs to.",
    ],
  },
};
