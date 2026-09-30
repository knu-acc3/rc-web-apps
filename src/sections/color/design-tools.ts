import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { formatColor, harmony, hex, HARMONY_OFFSETS, toHex, type Harmony } from "./lib/color";
import { MATERIAL } from "./design/data/material";
import { TAILWIND_V3 } from "./design/data/tailwind-v3";
import { mdFamily, mdRows, ratioB, ratioW, rgbOf, TAILWIND_V4_VERSION, TW_FAMILIES, TW_NEUTRALS, twFamily, twRows } from "./design/families";
import { CVD_TYPES, simulate, type CvdType } from "./design/lib/cvd";

/* ───────────── palette generator ───────────── */

const HARMONY_INFO: Record<Harmony, { ru: string; en: string; ruTitle: string; enTitle: string; ruH1: string; enH1: string; ruLead: string; enLead: string; ruUse: string; enUse: string }> = {
  complementary: {
    ru: "Комплементарная",
    en: "Complementary",
    ruTitle: "Комплементарные цвета — подобрать онлайн",
    enTitle: "Complementary colors — find the opposite color",
    ruH1: "Комплементарные цвета",
    enH1: "Complementary colors",
    ruLead: "Комплементарные цвета лежат напротив друг друга на цветовом круге: тон + 180°.",
    enLead: "Complementary colors sit opposite each other on the color wheel: hue + 180°.",
    ruUse: "Максимальный контраст тонов: акцентные кнопки, баннеры, выделение одного элемента на фоне другого.",
    enUse: "Maximum hue contrast: accent buttons, banners, making one element pop against another.",
  },
  analogous: {
    ru: "Аналоговая",
    en: "Analogous",
    ruTitle: "Аналоговые цвета — генератор палитры онлайн",
    enTitle: "Analogous color palette generator",
    ruH1: "Аналоговые цвета",
    enH1: "Analogous colors",
    ruLead: "Аналоговая палитра — соседние тона на цветовом круге: базовый и ±30°.",
    enLead: "An analogous palette uses neighboring hues on the color wheel: the base and ±30°.",
    ruUse: "Спокойные, природные сочетания: фоны, иллюстрации, интерфейсы без резких акцентов.",
    enUse: "Calm, natural combinations: backgrounds, illustrations, interfaces without harsh accents.",
  },
  triadic: {
    ru: "Триада",
    en: "Triadic",
    ruTitle: "Триада цветов — генератор триадной палитры",
    enTitle: "Triadic color scheme generator",
    ruH1: "Триада цветов",
    enH1: "Triadic color scheme",
    ruLead: "Триада — три тона через 120° на цветовом круге: базовый, +120° и +240°.",
    enLead: "A triad is three hues 120° apart on the color wheel: the base, +120° and +240°.",
    ruUse: "Яркие сбалансированные палитры: детские проекты, инфографика, игры.",
    enUse: "Vivid yet balanced palettes: kids' projects, infographics, games.",
  },
  "split-complementary": {
    ru: "Раздельно-комплементарная",
    en: "Split-complementary",
    ruTitle: "Раздельно-комплементарные цвета — генератор",
    enTitle: "Split-complementary color scheme generator",
    ruH1: "Раздельно-комплементарная схема",
    enH1: "Split-complementary color scheme",
    ruLead: "Базовый цвет и два соседа его противоположности: тон + 150° и + 210°.",
    enLead: "The base color plus the two neighbors of its complement: hue + 150° and + 210°.",
    ruUse: "Контраст мягче, чем у комплементарной пары: основной цвет и два акцента.",
    enUse: "Softer contrast than a complementary pair: one main color and two accents.",
  },
  tetradic: {
    ru: "Тетрада",
    en: "Tetradic",
    ruTitle: "Тетрада цветов — генератор прямоугольной схемы",
    enTitle: "Tetradic color scheme generator (rectangle)",
    ruH1: "Тетрада цветов",
    enH1: "Tetradic color scheme",
    ruLead: "Тетрада — две комплементарные пары, образующие прямоугольник: 0°, +60°, +180°, +240°.",
    enLead: "A tetrad is two complementary pairs forming a rectangle: 0°, +60°, +180°, +240°.",
    ruUse: "Богатые палитры для сложных интерфейсов и графиков; один цвет лучше сделать главным.",
    enUse: "Rich palettes for complex interfaces and charts; let one color dominate.",
  },
  square: {
    ru: "Квадрат",
    en: "Square",
    ruTitle: "Квадратная цветовая схема — генератор онлайн",
    enTitle: "Square color scheme generator",
    ruH1: "Квадратная цветовая схема",
    enH1: "Square color scheme",
    ruLead: "Четыре тона через каждые 90° цветового круга: 0°, +90°, +180°, +270°.",
    enLead: "Four hues every 90° around the color wheel: 0°, +90°, +180°, +270°.",
    ruUse: "Максимально разнообразные категории: графики, легенды, метки.",
    enUse: "Maximally distinct categories: charts, legends, tags.",
  },
  monochromatic: {
    ru: "Монохромная",
    en: "Monochromatic",
    ruTitle: "Монохромная палитра — оттенки одного цвета",
    enTitle: "Monochromatic color palette generator",
    ruH1: "Монохромная палитра",
    enH1: "Monochromatic color palette",
    ruLead: "Один тон в разных вариантах светлоты: безопасная и цельная палитра.",
    enLead: "One hue at different lightness levels: a safe, cohesive palette.",
    ruUse: "Минималистичные интерфейсы, фирменный стиль из одного цвета, тёмные темы.",
    enUse: "Minimal interfaces, single-color brand systems, dark themes.",
  },
};

const HARMONY_ORDER: Harmony[] = ["complementary", "analogous", "triadic", "split-complementary", "tetradic", "square", "monochromatic"];
const EXAMPLE_BASES = ["#3B82F6", "#FF6347", "#2E8B57", "#8A2BE2", "#FFD700"];

function offsetsText(k: Harmony, locale: Locale): string {
  if (k === "monochromatic") return locale === "ru" ? "тон не меняется, светлота ±15 и ±30 %" : "same hue, lightness ±15 and ±30%";
  return HARMONY_OFFSETS[k].map((d) => (d === 0 ? "0°" : `${d > 0 ? "+" : "−"}${Math.abs(d)}°`)).join(", ");
}

function harmonyVariant(k: Harmony): VariantDef {
  const info = HARMONY_INFO[k];
  const ex = harmony(hex("#3B82F6"), k).map((c) => toHex(c)).join(", ");
  const ex3 = harmony(hex("#3B82F6"), k).slice(0, 3).map((c) => toHex(c)).join(", ");
  const table = (locale: Locale): Block => ({
    type: "table",
    title: locale === "ru" ? `Примеры: ${info.ru.toLowerCase()} схема` : `Examples: ${info.en.toLowerCase()} scheme`,
    head: [locale === "ru" ? "Базовый цвет" : "Base color", locale === "ru" ? "Палитра (OKLCH)" : "Palette (OKLCH)"],
    rows: EXAMPLE_BASES.map((b) => [b, harmony(hex(b), k).map((c) => toHex(c)).join(", ")]),
    mono: true,
  });
  return {
    slug: k,
    name: { ru: info.ru, en: info.en },
    title: { ru: info.ruTitle, en: info.enTitle },
    h1: { ru: info.ruH1, en: info.enH1 },
    description: {
      ru: `${info.ruH1} в OKLCH (${offsetsText(k, "ru")}): для #3B82F6 — ${ex3}. Генератор палитры с фиксацией цветов и экспортом кода.`,
      en: `${info.enH1} in OKLCH (${offsetsText(k, "en")}): for #3B82F6 — ${ex3}. Palette generator with color locks and code export.`,
    },
    lead: { ru: info.ruLead, en: info.enLead },
    props: { mode: k },
    keywords: { ru: [info.ruH1.toLowerCase(), "цветовая схема", "подбор цветов"], en: [info.enH1.toLowerCase(), "color scheme", "color harmony"] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? "Коротко о схеме" : "The scheme in brief",
        rows: [
          [locale === "ru" ? "Сдвиги тона" : "Hue offsets", offsetsText(k, locale)],
          [locale === "ru" ? "Цветов в схеме" : "Colors in the scheme", String(harmony(hex("#3B82F6"), k).length)],
          [locale === "ru" ? "Где использовать" : "Where to use it", locale === "ru" ? info.ruUse : info.enUse],
          [locale === "ru" ? "Пример для #3B82F6" : "Example for #3B82F6", ex],
        ],
      },
      table(locale),
    ],
    faq: {
      ru: [
        {
          q: k === "monochromatic" ? "Как составить монохромную палитру?" : `Как найти цвета для схемы «${info.ru.toLowerCase()}»?`,
          a:
            k === "monochromatic"
              ? "Оставьте тон и хрому базового цвета и меняйте только светлоту OKLCH. Так оттенки остаются «родственными», а контраст между ними предсказуем."
              : `Переведите цвет в OKLCH и прибавьте к тону ${offsetsText(k, "ru")}, сохранив светлоту и хрому. Для #3B82F6 получится ${ex}. Генератор выше делает это автоматически.`,
        },
        { q: "Почему не HSL-круг, как в старых генераторах?", a: "В HSL при повороте тона сильно меняется видимая яркость: жёлтый при L = 50 % намного светлее синего. OKLCH перцептивно равномерен, поэтому цвета схемы получаются одинакового «веса»." },
        { q: "Где лучше применять такую схему?", a: `${info.ruUse} Оставьте один цвет главным, остальные используйте дозированно.` },
      ],
      en: [
        {
          q: k === "monochromatic" ? "How do I build a monochromatic palette?" : `How do I find ${info.en.toLowerCase()} colors?`,
          a:
            k === "monochromatic"
              ? "Keep the base color's hue and chroma and vary only its OKLCH lightness. The shades stay related and the contrast between them is predictable."
              : `Convert the color to OKLCH and add ${offsetsText(k, "en")} to the hue, keeping lightness and chroma. For #3B82F6 that gives ${ex}. The generator above does it for you.`,
        },
        { q: "Why not the HSL wheel like older generators?", a: "Rotating the hue in HSL changes perceived brightness a lot: a 50% yellow is far lighter than a 50% blue. OKLCH is perceptually uniform, so the scheme's colors carry the same visual weight." },
        { q: "Where does this scheme work best?", a: `${info.enUse} Keep one color dominant and use the others sparingly.` },
      ],
    },
  };
}

const PALETTE_TOOL: ToolDef = {
  slug: "color-palette-generator",
  component: "color/palette",
  icon: "SwatchBook",
  popular: true,
  wide: true,
  name: { ru: "Генератор палитры", en: "Palette generator" },
  title: { ru: "Генератор цветовой палитры онлайн — гармонии в OKLCH", en: "Color palette generator — OKLCH color harmonies" },
  h1: { ru: "Генератор цветовой палитры", en: "Color palette generator" },
  description: {
    ru: "Создайте палитру из 3–10 цветов: комплементарная, триада, аналоговая и другие схемы в OKLCH, фиксация удачных цветов и экспорт в CSS, Tailwind, JSON и PNG.",
    en: "Build a 3–10 color palette: complementary, triadic, analogous and other schemes computed in OKLCH, lock the colors you like, export to CSS, Tailwind, JSON or PNG.",
  },
  lead: { ru: "Выберите базовый цвет и схему — палитра строится сразу, пробел генерирует новую.", en: "Pick a base color and a scheme — the palette appears instantly; Space generates a new one." },
  keywords: { ru: ["палитра цветов", "подбор цветов", "цветовая схема", "генератор палитры"], en: ["color palette", "palette generator", "color scheme", "color harmony"] },
  props: { mode: "analogous" },
  howTo: {
    ru: [
      "Введите базовый цвет или нажмите «Сгенерировать» (или пробел) для случайного.",
      "Выберите схему — аналоговую, комплементарную, триаду, тетраду — и число цветов от 3 до 10.",
      "Нажмите на замок, чтобы зафиксировать удачный цвет: при следующей генерации он останется на месте.",
      "Скопируйте HEX нажатием на подпись или экспортируйте палитру в CSS, Tailwind v4/v3, JSON или PNG.",
    ],
    en: [
      "Enter a base color or press Generate (or Space) for a random one.",
      "Choose a scheme — analogous, complementary, triadic, tetradic — and 3 to 10 colors.",
      "Click the lock to keep a color you like: it stays in place on the next generation.",
      "Copy a HEX by clicking its label, or export the palette to CSS, Tailwind v4/v3, JSON or PNG.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему гармонии считаются в OKLCH, а не в HSL?", a: "При повороте тона в HSL светлота «плывёт»: жёлтый и синий с одинаковым L выглядят совсем по-разному. В OKLCH светлота и насыщенность перцептивно сохраняются, поэтому цвета палитры получаются одного «веса»." },
      { q: "Первый цвет палитры совпадает с моим?", a: "Да, всегда: базовый цвет остаётся ровно тем, что вы ввели. Остальные получаются поворотом тона и сдвигом светлоты, а если цвет не помещается в sRGB, уменьшается только его насыщенность." },
      { q: "Как работает случайная генерация?", a: "Используется криптографический генератор браузера crypto.getRandomValues: тон выбирается по всему кругу, а светлота и хрома — в диапазонах, где цвета не получаются грязными или кислотными." },
      { q: "Как вставить палитру в Tailwind?", a: "Для Tailwind CSS v4 скопируйте блок @theme с переменными --color-palette-1… в OKLCH, для v3 — объект для theme.extend.colors в tailwind.config.js." },
    ],
    en: [
      { q: "Why are harmonies computed in OKLCH, not HSL?", a: "Rotating the hue in HSL makes lightness drift: a yellow and a blue with the same L look completely different. OKLCH keeps perceived lightness and chroma, so the palette's colors carry the same visual weight." },
      { q: "Is the first color exactly mine?", a: "Always: the base color stays exactly what you entered. The others come from hue rotation and lightness shifts; if one doesn't fit into sRGB, only its chroma is reduced." },
      { q: "How does random generation work?", a: "It uses the browser's cryptographic generator crypto.getRandomValues: the hue is picked around the whole wheel, lightness and chroma within ranges that avoid muddy or neon colors." },
      { q: "How do I use the palette in Tailwind?", a: "For Tailwind CSS v4, copy the @theme block with --color-palette-1… variables in OKLCH; for v3, the object for theme.extend.colors in tailwind.config.js." },
    ],
  },
  about: {
    ru: [
      "Генератор строит палитру от одного цвета по классическим схемам цветового круга: комплементарной (+180°), аналоговой (±30°), триаде (+120°, +240°), раздельно-комплементарной (+150°, +210°), тетраде и квадрату. Если схема даёт меньше цветов, чем нужно, добавляются более светлые и тёмные варианты тех же тонов.",
      "Подписи на цветах становятся чёрными или белыми по контрасту WCAG, поэтому их всегда видно. Все расчёты выполняются в браузере — палитра никуда не отправляется.",
    ],
    en: [
      "The generator builds a palette from one color using the classic color-wheel schemes: complementary (+180°), analogous (±30°), triadic (+120°, +240°), split-complementary (+150°, +210°), tetradic and square. When a scheme yields fewer colors than needed, lighter and darker variants of the same hues are added.",
      "Labels on the swatches turn black or white based on WCAG contrast, so they are always readable. Everything runs in your browser — the palette is never sent anywhere.",
    ],
  },
  variants: { title: { ru: "Цветовые схемы", en: "Color schemes" }, list: () => HARMONY_ORDER.map(harmonyVariant) },
};

/* ───────────── shades ───────────── */

const SHADES_TOOL: ToolDef = {
  slug: "color-shades-generator",
  component: "color/shades",
  icon: "Layers",
  wide: true,
  name: { ru: "Генератор оттенков", en: "Shades generator" },
  title: { ru: "Генератор оттенков цвета — шкала 50–950 как в Tailwind", en: "Color shades generator — Tailwind-style 50–950 scale" },
  h1: { ru: "Генератор оттенков цвета", en: "Color shades generator" },
  description: {
    ru: "Постройте шкалу из 11 оттенков 50–950 от одного цвета по кривой светлоты Tailwind CSS v4: значения OKLCH и HEX, код для @theme, CSS-переменных и tailwind.config.",
    en: "Turn one color into an 11-step 50–950 scale following the Tailwind CSS v4 lightness curve: OKLCH and HEX values, code for @theme, CSS variables and tailwind.config.",
  },
  lead: { ru: "Введите фирменный цвет — получите шкалу 50–950 с кодом для Tailwind v4 и CSS.", en: "Enter your brand color to get a 50–950 scale with code for Tailwind v4 and CSS." },
  keywords: { ru: ["оттенки цвета", "шкала цветов", "tailwind палитра", "генератор оттенков"], en: ["color shades", "tint and shade generator", "tailwind color scale", "palette 50-950"] },
  howTo: {
    ru: [
      "Введите цвет — например, фирменный #3B82F6.",
      "Шкала появляется сразу: ваш цвет встаёт на ближайший по светлоте шаг, остальные подбираются вокруг него.",
      "Задайте имя (brand, primary) — оно попадёт в названия переменных.",
      "Скопируйте блок @theme для Tailwind v4, CSS-переменные или объект для Tailwind v3; HEX любого шага копируется нажатием.",
    ],
    en: [
      "Enter a color — for example your brand #3B82F6.",
      "The scale appears instantly: your color lands on the step closest in lightness and the rest are built around it.",
      "Set a name (brand, primary) used in the variable names.",
      "Copy the Tailwind v4 @theme block, CSS variables or a Tailwind v3 object; click any step to copy its HEX.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему мой цвет оказался шагом 600, а не 500?", a: "Шаг выбирается по светлоте с учётом тона: у синих семейств Tailwind v4 шаг 500 имеет светлоту OKLCH около 62 %, у жёлтых — около 80 %. Если ваш цвет заметно темнее типичного 500, честнее поставить его на 600, чем искажать." },
      { q: "Чем это лучше, чем «осветлить на 10 %»?", a: "Шаги идут по перцептивной кривой, снятой с 17 хроматических семейств Tailwind v4, а насыщенность повторяет их профиль: у светлого и тёмного краёв она ниже, в середине — выше. Поэтому 50 не выглядит серым, а 950 — грязным." },
      { q: "Все оттенки помещаются в sRGB?", a: "Да: каждый шаг проходит gamut mapping по CSS Color 4 — если цвет выходит за охват, уменьшается только хрома, а тон и светлота сохраняются." },
    ],
    en: [
      { q: "Why did my color become 600 instead of 500?", a: "The step is chosen by lightness for the given hue: in Tailwind v4 the blue 500 steps sit around 62% OKLCH lightness and the yellow ones around 80%. If your color is clearly darker than a typical 500, placing it at 600 is more honest than distorting it." },
      { q: "Why is this better than “lighten by 10%”?", a: "The steps follow a perceptual curve measured from Tailwind v4's 17 chromatic families, and chroma follows their profile: lower at the light and dark ends, higher in the middle. So 50 doesn't look gray and 950 doesn't look muddy." },
      { q: "Do all shades fit into sRGB?", a: "Yes: each step is gamut-mapped per CSS Color 4 — if a color falls outside, only its chroma is reduced while hue and lightness are kept." },
    ],
  },
  about: {
    ru: [
      "Генератор держит тон исходного цвета и раскладывает светлоту по кривой семейств Tailwind CSS v4 с близким тоном (у жёлтых она выше, у синих ниже): от ≈ 97 % у шага 50 до ≈ 26–30 % у шага 950. Кривая сдвигается так, чтобы исходный цвет попал на свой шаг без изменений.",
      "Результат выводится в формате, который Tailwind v4 использует сам — OKLCH с процентной светлотой, — а для старых проектов есть HEX-объект для tailwind.config.js.",
    ],
    en: [
      "The generator keeps the hue of your color and spreads lightness along the curve of the Tailwind CSS v4 families with a similar hue (higher for yellows, lower for blues): from ≈ 97% at step 50 to ≈ 26–30% at step 950. The curve is shifted so that your color lands on its step unchanged.",
      "Output uses the format Tailwind v4 itself uses — OKLCH with percentage lightness — and older projects get a HEX object for tailwind.config.js.",
    ],
  },
};

/* ───────────── gradient ───────────── */

const GRADIENT_TOOL: ToolDef = {
  slug: "css-gradient-generator",
  component: "color/gradient",
  icon: "Blend",
  popular: true,
  wide: true,
  name: { ru: "Генератор градиентов", en: "Gradient generator" },
  title: { ru: "Генератор CSS-градиентов онлайн — linear, radial, conic", en: "CSS gradient generator — linear, radial and conic" },
  h1: { ru: "Генератор CSS-градиентов", en: "CSS gradient generator" },
  description: {
    ru: "Создайте CSS-градиент: линейный, радиальный или конический, любое число цветов с прозрачностью, углы и to right, интерполяция в OKLCH и готовый код.",
    en: "Create a CSS gradient: linear, radial or conic, any number of color stops with transparency, angles or to-right keywords, OKLCH interpolation and ready code.",
  },
  lead: { ru: "Настройте цвета и направление — превью и CSS-код обновляются сразу.", en: "Set the colors and direction — the preview and CSS update instantly." },
  keywords: { ru: ["градиент css", "генератор градиентов", "linear-gradient", "радиальный градиент"], en: ["css gradient", "gradient generator", "linear-gradient", "radial gradient", "conic gradient"] },
  howTo: {
    ru: [
      "Выберите тип: линейный, радиальный или конический.",
      "Задайте цвета в любом формате CSS, включая прозрачные #RRGGBBAA, и их позиции в процентах — добавлять можно сколько угодно.",
      "Для линейного укажите угол или направление (to right, to bottom left…), для радиального и конического — центр.",
      "Скопируйте CSS-код или начните с готового градиента из списка.",
    ],
    en: [
      "Choose the type: linear, radial or conic.",
      "Set the colors in any CSS format, including translucent #RRGGBBAA, and their positions in percent — add as many as you like.",
      "For linear gradients set an angle or a direction (to right, to bottom left…), for radial and conic ones the center.",
      "Copy the CSS or start from one of the presets.",
    ],
  },
  faq: {
    ru: [
      { q: "Что даёт интерполяция in oklch?", a: "По умолчанию браузер смешивает цвета в sRGB, и середина перехода между яркими цветами сереет. Режимы in oklab и in oklch из CSS Color 4 дают чистые переходы. Их поддерживают Chrome 111+, Safari 16.2+ и Firefox 127+, а для старых браузеров мы добавляем строку-запаску." },
      { q: "Сколько цветов можно добавить?", a: "Сколько угодно — CSS не ограничивает число точек. Позицию можно оставить пустой: браузер распределит такие цвета равномерно." },
      { q: "Как сделать полосы?", a: "Поставьте два цвета в одну позицию — переход станет резким — и включите «Повторять»: получится repeating-linear-gradient." },
      { q: "Чем conic-gradient отличается от radial?", a: "Радиальный градиент меняет цвет от центра к краям, конический — по кругу вокруг центра, как стрелка часов. Конические градиенты используют для круговых диаграмм и цветовых кругов." },
    ],
    en: [
      { q: "What does “in oklch” interpolation do?", a: "By default browsers mix colors in sRGB, so the middle of a transition between vivid colors turns grayish. CSS Color 4's in oklab and in oklch give clean transitions. They work in Chrome 111+, Safari 16.2+ and Firefox 127+, and we add a fallback line for older browsers." },
      { q: "How many colors can I add?", a: "As many as you want — CSS doesn't limit color stops. Leave a position empty and the browser spaces those colors evenly." },
      { q: "How do I make stripes?", a: "Put two colors at the same position for a hard edge and turn on Repeating to get a repeating-linear-gradient." },
      { q: "How is conic-gradient different from radial?", a: "A radial gradient changes from the center outwards, a conic one goes around the center like a clock hand. Conic gradients are used for pie charts and color wheels." },
    ],
  },
  about: {
    ru: [
      "Генератор собирает значение для свойства background: linear-gradient(), radial-gradient() или conic-gradient(), в том числе повторяющиеся варианты. Цвета нормализуются в HEX, прозрачность сохраняется восьмизначным HEX.",
      "Превью рисует сам браузер тем же CSS, который вы копируете, поэтому результат на сайте будет точно таким же.",
    ],
    en: [
      "The generator builds a value for the background property: linear-gradient(), radial-gradient() or conic-gradient(), including repeating versions. Colors are normalized to HEX, with transparency kept as 8-digit HEX.",
      "The preview is drawn by your browser with exactly the CSS you copy, so it will look the same on your site.",
    ],
  },
};

/* ───────────── mixer ───────────── */

const MIXER_TOOL: ToolDef = {
  slug: "color-mixer",
  component: "color/mixer",
  icon: "Merge",
  wide: true,
  name: { ru: "Смешивание цветов", en: "Color mixer" },
  title: { ru: "Смешать цвета онлайн — смешивание в OKLab и sRGB", en: "Color mixer — blend two colors in OKLab or sRGB" },
  h1: { ru: "Смешать два цвета", en: "Color mixer" },
  description: {
    ru: "Смешайте два цвета и получите промежуточные оттенки: от 2 до 20 шагов в OKLab, OKLCH, линейном sRGB или sRGB, HEX каждого шага и код color-mix() для CSS.",
    en: "Mix two colors and get the in-between shades: 2–20 steps in OKLab, OKLCH, linear sRGB or sRGB, the HEX of each step and CSS color-mix() code.",
  },
  lead: { ru: "Введите два цвета — промежуточные оттенки и середина появятся сразу.", en: "Enter two colors to see the in-between shades and the midpoint instantly." },
  keywords: { ru: ["смешать цвета", "смешивание цветов", "color-mix", "промежуточный цвет"], en: ["color mixer", "mix colors", "blend colors", "color-mix"] },
  howTo: {
    ru: [
      "Введите два цвета в любом формате CSS.",
      "Выберите число шагов и пространство смешивания — по умолчанию OKLab.",
      "Нажмите на любой оттенок, чтобы скопировать его HEX, или скопируйте готовую функцию color-mix().",
    ],
    en: [
      "Enter two colors in any CSS format.",
      "Choose the number of steps and the mixing space — OKLab by default.",
      "Click any shade to copy its HEX, or copy the ready color-mix() function.",
    ],
  },
  faq: {
    ru: [
      { q: "Почему результат зависит от пространства?", a: "sRGB смешивает гамма-кодированные значения, и середина между яркими цветами темнеет; линейный sRGB ведёт себя как смешение света; OKLab даёт перцептивно ровный переход. Серый и синий в OKLab идут прямо к синему, а в HSL переход уходит в пурпурный." },
      { q: "Это то же самое, что режимы наложения в Photoshop?", a: "Нет. Здесь интерполяция между двумя цветами, как в CSS color-mix(). Режимы наложения (multiply, screen и другие) комбинируют слои и дают другие результаты." },
      { q: "Как использовать результат в CSS?", a: "Скопируйте HEX нужного шага или функцию color-mix(in oklab, A, B) — она работает во всех современных браузерах с 2023 года." },
    ],
    en: [
      { q: "Why does the result depend on the space?", a: "sRGB mixes gamma-encoded values, so the middle between vivid colors gets darker; linear sRGB behaves like mixing light; OKLab gives a perceptually even transition. Gray to blue goes straight to blue in OKLab, while in HSL it detours through magenta." },
      { q: "Is this the same as Photoshop blend modes?", a: "No. This is interpolation between two colors, like CSS color-mix(). Blend modes (multiply, screen and others) combine layers and produce different results." },
      { q: "How do I use the result in CSS?", a: "Copy the HEX of the step you need, or the color-mix(in oklab, A, B) function — it works in every modern browser since 2023." },
    ],
  },
  about: {
    ru: [
      "Смешивание — это интерполяция: на шаге t цвет равен A + (B − A) × t в выбранном пространстве, с учётом прозрачности. Итог переводится обратно в sRGB, при необходимости с gamut mapping.",
      "Для интерфейсов обычно лучше OKLab: переход выглядит равномерным по яркости. sRGB совпадает с тем, как смешивают старые браузеры и большинство графических редакторов по умолчанию.",
    ],
    en: [
      "Mixing is interpolation: at step t the color is A + (B − A) × t in the chosen space, with alpha taken into account. The result is converted back to sRGB, gamut-mapped if needed.",
      "For interfaces OKLab usually works best: the transition looks even in brightness. sRGB matches how older browsers and most graphics editors mix by default.",
    ],
  },
};

/* ───────────── Tailwind ───────────── */

function twVariant(family: string): VariantDef {
  const rows = twRows(family);
  const r500 = rows[5];
  const neutral = TW_NEUTRALS.has(family);
  const v3 = !!TAILWIND_V3[family];
  return {
    slug: family,
    name: { ru: family, en: family },
    title: { ru: `Цвета Tailwind ${family}: ${family}-50…${family}-950`, en: `Tailwind ${family} colors — ${family}-50 to ${family}-950` },
    h1: { ru: `Tailwind ${family} — оттенки 50–950`, en: `Tailwind ${family} color palette` },
    description: {
      ru: `Все 11 оттенков ${family} в Tailwind CSS: ${family}-500 = ${r500.oklch} в v4${v3 ? ` и ${r500.v3} в v3` : ""}. Классы bg-${family}-*, переменные --color-${family}-* и контраст.`,
      en: `All 11 ${family} shades in Tailwind CSS: ${family}-500 = ${r500.oklch} in v4${v3 ? `, ${r500.v3} in v3` : ""}. bg-${family}-* classes and --color-${family}-* variables.`,
    },
    lead: {
      ru: `${family}-500 — ${r500.oklch} в Tailwind v4 (≈ ${r500.hex})${v3 ? `, в v3 — ${r500.v3}` : ", в v3 этого семейства нет"}.`,
      en: `${family}-500 is ${r500.oklch} in Tailwind v4 (≈ ${r500.hex})${v3 ? `, ${r500.v3} in v3` : "; the family doesn't exist in v3"}.`,
    },
    props: { families: [twFamily(family)], single: true },
    keywords: { ru: [`tailwind ${family}`, `${family}-500`, "цвета tailwind"], en: [`tailwind ${family}`, `${family}-500`, "tailwind colors"] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? `Семейство ${family}` : `The ${family} family`,
        rows: [
          [locale === "ru" ? "Тип" : "Type", neutral ? (locale === "ru" ? "нейтральный (серый)" : "neutral (gray)") : locale === "ru" ? "хроматический" : "chromatic"],
          [locale === "ru" ? "Основной оттенок" : "Main shade", `${family}-500 · ${r500.oklch}`],
          [locale === "ru" ? "Есть в v3" : "In v3", v3 ? (locale === "ru" ? "да" : "yes") : locale === "ru" ? "нет, только v4" : "no, v4 only"],
          [locale === "ru" ? "Версия данных" : "Data version", `tailwindcss ${TAILWIND_V4_VERSION} / v3.4`],
        ],
      },
      {
        type: "table",
        title: locale === "ru" ? `Все оттенки ${family}` : `All ${family} shades`,
        head: [locale === "ru" ? "Класс" : "Class", "v4 OKLCH", locale === "ru" ? "HEX (из v4)" : "HEX (from v4)", "v3 HEX", locale === "ru" ? "Белый текст" : "White text"],
        rows: rows.map((r) => [`bg-${r.token}`, r.oklch!, r.hex, r.v3 ?? "—", ratioW(r.hex)]),
        mono: true,
      },
    ],
    faq: {
      ru: [
        {
          q: `Какой HEX у ${family}-500 в Tailwind?`,
          a: `${v3 ? `В v3 — ${r500.v3}. ` : ""}В v4 значение задано в OKLCH — ${r500.oklch}; в sRGB это ≈ ${r500.hex}. Цвета v4 немного ярче и местами выходят за sRGB, поэтому HEX — ближайшее приближение.`,
        },
        { q: `Как использовать ${family} без Tailwind?`, a: `В Tailwind v4 цвета — CSS-переменные, например background: var(--color-${family}-500). Без Tailwind скопируйте значение OKLCH или HEX из таблицы.` },
        ...(neutral
          ? [{ q: "Чем отличаются серые семейства Tailwind?", a: "Подтоном: slate — холодный синеватый, gray — слегка синеватый, zinc — почти нейтральный, neutral — чистый серый, stone — тёплый. В текущей версии v4 есть ещё mauve, olive, mist и taupe с более заметным оттенком." }]
          : []),
      ],
      en: [
        {
          q: `What is the HEX of ${family}-500 in Tailwind?`,
          a: `${v3 ? `In v3 it is ${r500.v3}. ` : ""}In v4 the value is OKLCH — ${r500.oklch}; in sRGB that is ≈ ${r500.hex}. v4 colors are slightly more vivid and some fall outside sRGB, so the HEX is the closest approximation.`,
        },
        { q: `How do I use ${family} without Tailwind?`, a: `In Tailwind v4 colors are CSS variables, e.g. background: var(--color-${family}-500). Without Tailwind, copy the OKLCH or HEX value from the table.` },
        ...(neutral
          ? [{ q: "How do Tailwind's gray families differ?", a: "By undertone: slate is cool and bluish, gray slightly bluish, zinc almost neutral, neutral pure gray, stone warm. The current v4 also has mauve, olive, mist and taupe with a more visible tint." }]
          : []),
      ],
    },
  };
}

const TAILWIND_TOOL: ToolDef = {
  slug: "tailwind-colors",
  component: "color/family",
  icon: "Wind",
  popular: true,
  wide: true,
  name: { ru: "Цвета Tailwind", en: "Tailwind colors" },
  title: { ru: "Цвета Tailwind CSS — палитра v4 (OKLCH) и v3 (HEX)", en: "Tailwind CSS colors — v4 OKLCH and v3 HEX palette" },
  h1: { ru: "Цвета Tailwind CSS", en: "Tailwind CSS colors" },
  description: {
    ru: `Палитра Tailwind CSS: ${TW_FAMILIES.length} семейств по 11 оттенков от 50 до 950 — OKLCH из v4, HEX из v3, классы вроде bg-red-500 и переменные --color-red-500 с копированием.`,
    en: `The Tailwind CSS palette: ${TW_FAMILIES.length} families of 11 shades from 50 to 950 — v4 OKLCH, v3 HEX, classes like bg-red-500 and --color-red-500 variables, copy on click.`,
  },
  lead: { ru: "Нажмите на оттенок, чтобы скопировать класс, OKLCH или HEX.", en: "Click a shade to copy its class, OKLCH or HEX value." },
  keywords: { ru: ["цвета tailwind", "палитра tailwind", "tailwind colors"], en: ["tailwind colors", "tailwind palette", "tailwind css colors"] },
  props: { kind: "tailwind", families: TW_FAMILIES.map((f) => twFamily(f)) },
  howTo: {
    ru: [
      "Выберите, что копировать: класс, значение OKLCH из v4, HEX или HEX из v3.",
      "Нажмите на нужный оттенок — значение окажется в буфере обмена.",
      "Откройте страницу семейства, чтобы увидеть таблицу всех значений и контраст с белым.",
    ],
    en: [
      "Choose what to copy: the class, the v4 OKLCH value, HEX or the v3 HEX.",
      "Click a shade and the value is on your clipboard.",
      "Open a family page for a table of all values and white-text contrast.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем цвета Tailwind v4 отличаются от v3?", a: "В v4 палитру пересчитали в OKLCH: оттенки стали равномернее по светлоте и немного ярче, часть цветов выходит за sRGB и на широкоохватных экранах выглядит насыщеннее. Названия и шаги 50–950 остались прежними." },
      { q: "Откуда взяты значения?", a: `v4 — из theme.css пакета tailwindcss ${TAILWIND_V4_VERSION}, v3 — из стандартной палитры версии 3.4. HEX для v4 получен переводом OKLCH в sRGB с gamut mapping по CSS Color 4.` },
      { q: "Как добавить свой цвет в таком же стиле?", a: "Используйте генератор оттенков: он строит шкалу 50–950 от вашего цвета по кривой светлоты палитры Tailwind v4 для этого тона и выдаёт блок @theme." },
    ],
    en: [
      { q: "How do Tailwind v4 colors differ from v3?", a: "v4 recomputed the palette in OKLCH: shades are more even in lightness and a bit more vivid, and some colors exceed sRGB and look richer on wide-gamut screens. Names and the 50–950 steps stayed the same." },
      { q: "Where do the values come from?", a: `v4 from theme.css of the tailwindcss ${TAILWIND_V4_VERSION} package, v3 from the default 3.4 palette. The v4 HEX values are OKLCH converted to sRGB with CSS Color 4 gamut mapping.` },
      { q: "How do I add my own color in the same style?", a: "Use the shades generator: it builds a 50–950 scale from your color along the Tailwind v4 lightness curve for its hue and outputs an @theme block." },
    ],
  },
  about: {
    ru: [
      "Здесь собрана стандартная палитра Tailwind CSS: хроматические семейства от red до rose и нейтральные серые. Каждый оттенок — это класс (bg-sky-400, text-sky-400, border-sky-400) и, начиная с v4, CSS-переменная --color-sky-400.",
      "Значения v4 записаны в OKLCH, как в исходниках Tailwind; рядом дан HEX — удобен для Figma и других программ, которые пока не понимают OKLCH.",
    ],
    en: [
      "This is the default Tailwind CSS palette: chromatic families from red to rose plus the neutral grays. Each shade is a class (bg-sky-400, text-sky-400, border-sky-400) and, since v4, a CSS variable --color-sky-400.",
      "v4 values are OKLCH, exactly as in the Tailwind source; the HEX next to them is handy for Figma and other tools that don't read OKLCH yet.",
    ],
  },
  variants: { title: { ru: "Семейства цветов", en: "Color families" }, list: () => TW_FAMILIES.map(twVariant) },
};

/* ───────────── Material ───────────── */

function mdVariant(slug: string): VariantDef {
  const fam = MATERIAL.find((f) => f.slug === slug)!;
  const rows = mdRows(slug);
  const main = fam.shades["500"].toUpperCase();
  const accents = Object.keys(fam.shades).filter((s) => s.startsWith("A"));
  const range = accents.length ? "50–900, A100–A700" : "50–900";
  return {
    slug,
    name: { ru: fam.name, en: fam.name },
    title: { ru: `Material Design ${fam.name} — оттенки ${range}`, en: `Material Design ${fam.name} — shades ${range}` },
    h1: { ru: `${fam.name} в палитре Material Design`, en: `Material Design ${fam.name} palette` },
    description: {
      ru: `Цвет ${fam.name} из палитры Material Design: основной ${fam.name} 500 = ${main}, всего ${rows.length} оттенков (${range}) с HEX, RGB и контрастом с белым и чёрным.`,
      en: `${fam.name} from the Material Design palette: the primary ${fam.name} 500 is ${main}, ${rows.length} shades in total (${range}) with HEX, RGB and contrast values.`,
    },
    lead: { ru: `${fam.name} 500 — ${main}, основной цвет семейства.`, en: `${fam.name} 500 is ${main}, the family's primary shade.` },
    props: { kind: "material", families: [mdFamily(slug)], single: true },
    keywords: { ru: [`material ${fam.name.toLowerCase()}`, "material design цвета"], en: [`material ${fam.name.toLowerCase()}`, "material design colors"] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? `Оттенки ${fam.name}` : `${fam.name} shades`,
        head: [locale === "ru" ? "Оттенок" : "Shade", "HEX", "RGB", locale === "ru" ? "С белым" : "On white", locale === "ru" ? "С чёрным" : "On black"],
        rows: rows.map((r) => [r.step, r.hex, rgbOf(r.hex), ratioW(r.hex), ratioB(r.hex)]),
        mono: true,
      },
    ],
    faq: {
      ru: [
        { q: `Какой HEX у Material ${fam.name} 500?`, a: `${main}. Это основной (primary) цвет семейства; 700 обычно берут для тёмного варианта, а ${accents.length ? "A200 — для акцентов." : "акцентных оттенков у этого семейства нет."}` },
        { q: "Что такое оттенки A100–A700?", a: "Акцентные (accent) цвета — более насыщенные версии тона для кнопок, переключателей и выделения. Они есть у 16 хроматических семейств, а у Brown, Grey и Blue Grey их нет." },
        { q: "Это палитра Material 3?", a: "Нет, это классическая палитра Material Design 2014 года. В Material 3 цветовая схема строится из исходного цвета по алгоритму HCT, но эта палитра по-прежнему популярна в Android- и веб-проектах." },
      ],
      en: [
        { q: `What is the HEX of Material ${fam.name} 500?`, a: `${main}. It is the family's primary color; 700 is typically used for the dark variant, and ${accents.length ? "A200 for accents." : "this family has no accent shades."}` },
        { q: "What are the A100–A700 shades?", a: "Accent colors — more saturated versions of the hue for buttons, switches and highlights. The 16 chromatic families have them; Brown, Grey and Blue Grey don't." },
        { q: "Is this the Material 3 palette?", a: "No, it is the classic 2014 Material Design palette. Material 3 derives its color scheme from a source color with the HCT algorithm, but this palette remains popular in Android and web projects." },
      ],
    },
  };
}

const MATERIAL_TOOL: ToolDef = {
  slug: "material-colors",
  component: "color/family",
  icon: "Layers3",
  wide: true,
  name: { ru: "Цвета Material Design", en: "Material Design colors" },
  title: { ru: "Цвета Material Design — палитра с HEX-кодами", en: "Material Design colors — the color palette with HEX codes" },
  h1: { ru: "Палитра Material Design", en: "Material Design color palette" },
  description: {
    ru: "Классическая палитра Material Design: 19 семейств, оттенки 50–900 и акценты A100–A700 с HEX-кодами, RGB и контрастом — копирование одним нажатием.",
    en: "The classic Material Design palette: 19 families, shades 50–900 and A100–A700 accents with HEX codes, RGB and contrast — copy with one click.",
  },
  lead: { ru: "Нажмите на оттенок, чтобы скопировать его HEX или CSS-переменную.", en: "Click a shade to copy its HEX or CSS variable." },
  keywords: { ru: ["material design цвета", "палитра material", "material colors"], en: ["material design colors", "material palette", "material color codes"] },
  props: { kind: "material", families: MATERIAL.map((f) => mdFamily(f.slug)) },
  howTo: {
    ru: ["Выберите, что копировать: HEX или CSS-переменную.", "Нажмите на оттенок — значение окажется в буфере обмена.", "Откройте страницу семейства, чтобы увидеть RGB и контраст каждого оттенка."],
    en: ["Choose what to copy: HEX or a CSS variable.", "Click a shade and the value is on your clipboard.", "Open a family page to see RGB and contrast for every shade."],
  },
  faq: {
    ru: [
      { q: "Сколько цветов в палитре Material Design?", a: "19 семейств: 16 хроматических по 14 оттенков (50–900 и A100–A700) и три нейтральных — Brown, Grey, Blue Grey — по 10 оттенков. Всего 254 цвета." },
      { q: "Какой оттенок брать основным?", a: "По гайдлайнам основной цвет — 500, тёмный вариант — 700, акцент — A200 другого семейства. Для текста на цвете проверяйте контраст: он указан на странице каждого семейства." },
      { q: "Актуальна ли палитра сейчас?", a: "Это палитра Material Design 2014–2018. Material 3 генерирует цвета из исходного, но эта палитра остаётся стандартом во многих библиотеках и старых проектах." },
    ],
    en: [
      { q: "How many colors does the Material Design palette have?", a: "19 families: 16 chromatic ones with 14 shades each (50–900 and A100–A700) and three neutrals — Brown, Grey, Blue Grey — with 10 shades each. 254 colors in total." },
      { q: "Which shade should be the primary?", a: "Per the guidelines the primary is 500, the dark variant 700 and the accent an A200 from another family. For text on color, check contrast — it's listed on every family page." },
      { q: "Is the palette still relevant?", a: "It's the Material Design palette of 2014–2018. Material 3 generates colors from a source color, but this palette is still standard in many libraries and older projects." },
    ],
  },
  about: {
    ru: [
      "Палитра Material Design появилась в 2014 году вместе с первыми гайдлайнами Google. Каждое семейство — это шкала от светлого 50 до тёмного 900 и насыщенные акценты A100–A700.",
      "Инструмент использует тот же интерфейс, что и страница цветов Tailwind: одна сетка семейств, копирование одним нажатием и отдельная страница с таблицей для каждого семейства.",
    ],
    en: [
      "The Material Design palette appeared in 2014 with Google's first guidelines. Each family is a scale from the light 50 to the dark 900 plus saturated A100–A700 accents.",
      "It uses the same interface as the Tailwind colors page: one grid of families, copy on click and a page with a full table for every family.",
    ],
  },
  variants: { title: { ru: "Семейства Material", en: "Material families" }, list: () => MATERIAL.map((f) => mdVariant(f.slug)) },
};

/* ───────────── color blindness ───────────── */

const CVD_INFO: Record<CvdType, { ru: string; en: string; ruCones: string; enCones: string; ruPrev: string; enPrev: string; ruConf: string; enConf: string }> = {
  protanopia: {
    ru: "Протанопия",
    en: "Protanopia",
    ruCones: "не работают L-колбочки («красные»)",
    enCones: "the L (“red”) cones are missing",
    ruPrev: "около 1 % мужчин; ещё около 1 % — ослабленная форма, протаномалия",
    enPrev: "about 1% of men, plus about 1% with the milder protanomaly",
    ruConf: "красный и зелёный, красный кажется тёмным",
    enConf: "red and green; red looks dark",
  },
  deuteranopia: {
    ru: "Дейтеранопия",
    en: "Deuteranopia",
    ruCones: "не работают M-колбочки («зелёные»)",
    enCones: "the M (“green”) cones are missing",
    ruPrev: "около 1 % мужчин; ослабленная форма, дейтераномалия, — около 5 %, это самое частое нарушение",
    enPrev: "about 1% of men; the milder deuteranomaly affects about 5%, the most common deficiency",
    ruConf: "красный, зелёный, коричневый и оранжевый",
    enConf: "red, green, brown and orange",
  },
  tritanopia: {
    ru: "Тританопия",
    en: "Tritanopia",
    ruCones: "не работают S-колбочки («синие»)",
    enCones: "the S (“blue”) cones are missing",
    ruPrev: "редко — порядка 1 на 10 000 человек, одинаково у мужчин и женщин",
    enPrev: "rare — on the order of 1 in 10,000 people, equally in men and women",
    ruConf: "синий и зелёный, жёлтый и розовый",
    enConf: "blue and green, yellow and pink",
  },
  achromatopsia: {
    ru: "Ахроматопсия",
    en: "Achromatopsia",
    ruCones: "колбочки не работают, мир виден в оттенках серого",
    enCones: "no working cones — the world looks gray",
    ruPrev: "очень редко — около 1 на 30 000 человек",
    enPrev: "very rare — about 1 in 30,000 people",
    ruConf: "любые цвета одинаковой яркости",
    enConf: "any colors of the same brightness",
  },
};

const CVD_SAMPLE = ["#E53935", "#43A047", "#1E88E5", "#FDD835", "#8E24AA", "#FB8C00", "#795548", "#EC407A"];

function cvdVariant(type: CvdType): VariantDef {
  const i = CVD_INFO[type];
  return {
    slug: type,
    name: { ru: i.ru, en: i.en },
    title: { ru: `${i.ru} — симуляция зрения онлайн`, en: `${i.en} simulator — how people with it see colors` },
    h1: { ru: `${i.ru}: как видят цвета`, en: `${i.en}: how colors look` },
    description: {
      ru: type === "achromatopsia" ? `${i.ru}: ${i.ruCones}. Проверьте, различаются ли цвета палитры или скриншота по яркости, — расчёт прямо в браузере.` : `${i.ru}: ${i.ruCones}. Посмотрите на палитру или скриншот так, как их видят люди с ${i.ru.toLowerCase().replace(/ия$/, "ией")}: модель Machado 2009, всё в браузере.`,
      en: type === "achromatopsia" ? `${i.en}: ${i.enCones}. Check whether the colors of a palette or screenshot differ in brightness — computed in your browser.` : `${i.en}: ${i.enCones}. See a palette or screenshot the way people with ${i.en.toLowerCase()} do — Machado 2009 model, computed in your browser.`,
    },
    lead: { ru: `${i.ru}: ${i.ruCones}. Путаются ${i.ruConf}.`, en: `${i.en}: ${i.enCones}. Commonly confused: ${i.enConf}.` },
    props: { type },
    keywords: { ru: [i.ru.toLowerCase(), "дальтонизм", "симуляция"], en: [i.en.toLowerCase(), "color blindness", "simulator"] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? `Коротко о нарушении` : "In brief",
        rows: [
          [locale === "ru" ? "Что происходит" : "What happens", locale === "ru" ? i.ruCones : i.enCones],
          [locale === "ru" ? "Распространённость" : "Prevalence", locale === "ru" ? i.ruPrev : i.enPrev],
          [locale === "ru" ? "Что путается" : "Confused colors", locale === "ru" ? i.ruConf : i.enConf],
          [locale === "ru" ? "Модель" : "Model", type === "achromatopsia" ? (locale === "ru" ? "яркость по Rec. 709 в линейном sRGB" : "Rec. 709 luminance in linear sRGB") : "Machado, Oliveira & Fernandes (2009)"],
        ],
      },
      {
        type: "table",
        title: locale === "ru" ? "Как меняются типичные цвета" : "How common colors change",
        head: [locale === "ru" ? "Исходный" : "Original", locale === "ru" ? "Как видится" : "Perceived as"],
        rows: CVD_SAMPLE.map((h) => [h, formatColor(simulate(hex(h), type), "hex")]),
        mono: true,
      },
    ],
    faq: {
      ru: [
        { q: `Насколько точна симуляция ${i.ru.toLowerCase().replace(/ия$/, "ии")}?`, a: "Это усреднённая модель для полной формы нарушения. Реальное восприятие у разных людей отличается, поэтому используйте симуляцию как проверку, а не как точную картину." },
        { q: "Как сделать интерфейс понятным для людей с нарушениями цветового зрения?", a: "Не передавайте смысл только цветом: добавляйте подписи, иконки, узоры, толщину линий. Проверяйте, что важные пары цветов различаются по светлоте, а контраст текста соответствует WCAG." },
      ],
      en: [
        { q: `How accurate is the ${i.en.toLowerCase()} simulation?`, a: "It is an averaged model of the full form of the deficiency. Real perception varies between people, so use it as a check rather than an exact picture." },
        { q: "How do I make an interface work for color-blind users?", a: "Never convey meaning by color alone: add labels, icons, patterns or line widths. Make sure important color pairs differ in lightness and text contrast meets WCAG." },
      ],
    },
  };
}

const BLINDNESS_TOOL: ToolDef = {
  slug: "color-blindness-simulator",
  component: "color/blindness",
  icon: "EyeOff",
  wide: true,
  name: { ru: "Симулятор дальтонизма", en: "Color blindness simulator" },
  title: { ru: "Симулятор дальтонизма онлайн — как видят дальтоники", en: "Color blindness simulator — how color-blind people see" },
  h1: { ru: "Симулятор дальтонизма", en: "Color blindness simulator" },
  description: {
    ru: "Посмотрите на палитру или картинку глазами людей с протанопией, дейтеранопией, тританопией и ахроматопсией: модель Machado 2009, всё в браузере.",
    en: "See a palette or image as people with protanopia, deuteranopia, tritanopia or achromatopsia do: Machado 2009 model, adjustable severity, all in your browser.",
  },
  lead: { ru: "Вставьте цвета или загрузите картинку — симуляция появится сразу.", en: "Paste colors or upload an image to see the simulation instantly." },
  keywords: { ru: ["дальтонизм", "симулятор дальтонизма", "как видят дальтоники", "протанопия", "дейтеранопия"], en: ["color blindness simulator", "colorblind", "protanopia", "deuteranopia", "tritanopia"] },
  howTo: {
    ru: [
      "Выберите тип нарушения и, если нужно, его выраженность.",
      "Вставьте цвета палитры — по одному на строку — и сравните две полосы.",
      "Или загрузите скриншот интерфейса: оригинал и симуляция появятся рядом.",
      "Если важные цвета слились, измените их светлоту или добавьте подписи и значки.",
    ],
    en: [
      "Choose the deficiency type and, if needed, its severity.",
      "Paste the palette colors — one per line — and compare the two strips.",
      "Or upload a screenshot of your interface: the original and the simulation appear side by side.",
      "If important colors merge, change their lightness or add labels and icons.",
    ],
  },
  faq: {
    ru: [
      { q: "Какая модель используется?", a: "Матрицы Machado, Oliveira и Fernandes (2009) для полной формы протанопии, дейтеранопии и тританопии, применённые в линейном sRGB; ахроматопсия — яркость по Rec. 709. Промежуточная выраженность — линейное смешение с нормальным зрением, это приближение." },
      { q: "Картинка загружается на сервер?", a: "Нет. Изображение декодируется и обрабатывается в вашем браузере, в фоновом потоке (Web Worker); большие картинки уменьшаются до 1600 пикселей по длинной стороне для скорости." },
      { q: "Сколько людей с нарушениями цветового зрения?", a: "Нарушения красно-зелёного восприятия есть примерно у 8 % мужчин с североевропейскими корнями и около 0,5 % женщин. Тританопия и ахроматопсия встречаются гораздо реже." },
    ],
    en: [
      { q: "Which model is used?", a: "The Machado, Oliveira and Fernandes (2009) matrices for full protanopia, deuteranopia and tritanopia, applied in linear sRGB; achromatopsia uses Rec. 709 luminance. Partial severity is a linear blend with normal vision — an approximation." },
      { q: "Is my image uploaded?", a: "No. The image is decoded and processed in your browser in a background thread (Web Worker); large images are scaled to 1600 px on the long side for speed." },
      { q: "How common is color blindness?", a: "Red–green deficiencies affect about 8% of men of Northern European descent and about 0.5% of women. Tritanopia and achromatopsia are much rarer." },
    ],
  },
  about: {
    ru: [
      "Симулятор показывает, как палитра или изображение выглядят при разных нарушениях цветового зрения. Это быстрый способ проверить графики, карты, статусы и кнопки, где смысл передаётся цветом.",
      "Расчёт физиологически обоснован: цвет переводится в линейный sRGB, умножается на матрицу модели Machado и возвращается в sRGB. Всё выполняется локально, без загрузки файлов.",
    ],
    en: [
      "The simulator shows how a palette or image looks with different color vision deficiencies. It's a quick way to check charts, maps, statuses and buttons where meaning is carried by color.",
      "The computation is physiologically based: the color is converted to linear sRGB, multiplied by the Machado model matrix and converted back. Everything runs locally without uploading files.",
    ],
  },
  variants: { title: { ru: "Типы дальтонизма", en: "Deficiency types" }, list: () => CVD_TYPES.map(cvdVariant) },
};

/**
 * Design tools of the color section (palette, shades, gradient, mixer,
 * tailwind, material, color-blindness). Composed into the section in section.ts.
 */
export const DESIGN_TOOLS: ToolDef[] = [PALETTE_TOOL, SHADES_TOOL, GRADIENT_TOOL, MIXER_TOOL, TAILWIND_TOOL, MATERIAL_TOOL, BLINDNESS_TOOL];

