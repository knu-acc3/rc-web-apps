import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import type { Block, QA, VariantDef } from "@/registry/types";
import { ANIM_PRESETS, animationShorthand, settingsFor } from "../lib/animation";
import { flexCss, gridCss } from "../lib/layout";
import { FLEX_RECIPES, flexRecipe, GRID_RECIPES, gridRecipe, MATERIAL_ELEVATION, SHADOW_PRESETS, TEXT_SHADOW_PRESETS } from "../lib/presets";
import { parseShadow } from "../lib/shadow";
import { CLIP_SHAPES, shapeCss } from "../lib/shapes";
import { fmtLength } from "../lib/tokens";

type L2 = { ru: string; en: string };
const tr = (x: L2, l: Locale) => x[l];
const lines = (css: string): string[][] => css.split("\n").map((l) => [l]);
const yes = (l: Locale, v: boolean) => (v ? (l === "ru" ? "да" : "yes") : l === "ru" ? "нет" : "no");

/**
 * Meta description within 160 characters: the first candidate that fits
 * (candidates go from the most to the least detailed wording).
 */
function desc(...candidates: string[]): string {
  const fit = candidates.find((s) => s.length <= 160);
  if (fit) return fit;
  const last = candidates[candidates.length - 1];
  const cut = last.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/* ───────────── box-shadow ───────────── */

const SHADOW_TEXT: Record<string, { name: L2; about: L2; q?: QA[]; qen?: QA[] }> = {
  subtle: { name: { ru: "Лёгкая тень", en: "Subtle shadow" }, about: { ru: "Едва заметная двухслойная тень для кнопок, полей ввода и мелких карточек.", en: "A barely visible two-layer shadow for buttons, inputs and small cards." } },
  medium: { name: { ru: "Средняя тень", en: "Medium shadow" }, about: { ru: "Мягкая тень средней глубины для карточек и выпадающих меню.", en: "A soft medium-depth shadow for cards and dropdown menus." } },
  large: { name: { ru: "Большая тень", en: "Large shadow" }, about: { ru: "Глубокая тень с отрицательным растяжением для модальных окон и крупных карточек.", en: "A deep shadow with negative spread for modals and large cards." } },
  inner: {
    name: { ru: "Внутренняя тень", en: "Inner shadow" },
    about: { ru: "Тень inset создаёт эффект вдавленной поверхности, как у полей ввода и переключателей.", en: "An inset shadow gives a pressed-in look, like inputs and toggles." },
    q: [{ q: "Можно ли совместить внутреннюю и внешнюю тень?", a: "Да: перечислите слои через запятую, например box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.15), 0 1px 2px rgb(0 0 0 / 0.1). Каждый слой может быть inset или внешним." }],
    qen: [{ q: "Can I combine inner and outer shadows?", a: "Yes: list the layers separated by commas, e.g. box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.15), 0 1px 2px rgb(0 0 0 / 0.1). Each layer can be inset or outer." }],
  },
  "neumorphism-light": {
    name: { ru: "Неоморфизм светлый", en: "Light neumorphism" },
    about: { ru: "Неоморфизм: тёмная тень справа снизу и белая слева сверху, а цвет блока совпадает с фоном страницы.", en: "Neumorphism: a dark shadow bottom-right and a white one top-left, with the element matching the page background." },
    q: [{ q: "Почему неоморфизм критикуют?", a: "Элементы почти сливаются с фоном: контраст границ часто ниже 3:1, которые требует WCAG для элементов интерфейса. Используйте стиль для декоративных блоков, а кнопкам добавляйте контрастные подписи или обводку." }],
    qen: [{ q: "Why is neumorphism criticized?", a: "Elements nearly blend into the background: edge contrast is often below the 3:1 WCAG requires for UI components. Use it for decorative blocks and give buttons contrasting labels or outlines." }],
  },
  "neumorphism-dark": {
    name: { ru: "Неоморфизм тёмный", en: "Dark neumorphism" },
    about: { ru: "Неоморфизм для тёмной темы: те же две тени — темнее и светлее фона — на тёмно-сером фоне.", en: "Neumorphism for dark themes: the same two shadows, darker and lighter than the background, on dark gray." },
  },
  glow: {
    name: { ru: "Свечение", en: "Glow" },
    about: { ru: "Цветное свечение из двух слоёв без смещения — для фокуса, неоновых кнопок и тёмных тем.", en: "A two-layer colored glow without offset — for focus states, neon buttons and dark themes." },
    q: [{ q: "Как сделать свечение другого цвета?", a: "Замените цвет в обоих слоях, сохранив прозрачность: например, rgb(236 72 153 / 0.6) и rgb(236 72 153 / 0.35) дадут розовое свечение." }],
    qen: [{ q: "How do I change the glow color?", a: "Replace the color in both layers and keep the alpha, e.g. rgb(236 72 153 / 0.6) and rgb(236 72 153 / 0.35) give a pink glow." }],
  },
  layered: { name: { ru: "Многослойная тень", en: "Layered shadow" }, about: { ru: "Пять слоёв, в каждом смещение и размытие удваиваются, — так тень выглядит мягкой и реалистичной.", en: "Five layers, each doubling the offset and blur, which makes the shadow soft and realistic." } },
  card: { name: { ru: "Тень карточки", en: "Card shadow" }, about: { ru: "Тень для карточек: тонкий контур вокруг и мягкая глубина снизу.", en: "A card shadow: a thin outline around plus soft depth below." } },
  floating: { name: { ru: "Парящая тень", en: "Floating shadow" }, about: { ru: "Тень «парящего» элемента с лёгким синеватым оттенком, как на лендингах SaaS-сервисов.", en: "A floating-element shadow with a slight blue tint, common on SaaS landing pages." } },
  "material-elevation": {
    name: { ru: "Тени Material Design", en: "Material Design elevation" },
    about: { ru: "Тени Material Design для высоты 1–24 dp (значения как в MUI): umbra, penumbra и ambient.", en: "Material Design shadows for 1–24 dp (MUI values): umbra, penumbra and ambient." },
  },
};
for (const k of ["sm", "md", "lg", "xl", "2xl"]) {
  SHADOW_TEXT[`tailwind-${k}`] = {
    name: { ru: `Tailwind shadow-${k}`, en: `Tailwind shadow-${k}` },
    about: {
      ru: k === "sm" ? "Значение класса shadow-sm из Tailwind CSS v4. В v3 такая же тень была у класса shadow." : `Значение класса shadow-${k} из Tailwind CSS v4; в v3 у этого класса то же значение.`,
      en: k === "sm" ? "The value of shadow-sm in Tailwind CSS v4. In v3 the same shadow belonged to the plain shadow class." : `The value of shadow-${k} in Tailwind CSS v4; v3 uses the same value for this class.`,
    },
  };
}

export function shadowVariants(): VariantDef[] {
  return SHADOW_PRESETS.map((p) => {
    const info = SHADOW_TEXT[p.slug];
    const layers = parseShadow(p.value, "box").layers;
    const table = (l: Locale): Block => ({
      type: "table",
      title: l === "ru" ? "Слои тени" : "Shadow layers",
      head: ["#", "x", "y", l === "ru" ? "размытие" : "blur", l === "ru" ? "растяжение" : "spread", l === "ru" ? "цвет" : "color", "inset"],
      rows: layers.map((x, i) => [String(i + 1), fmtLength(x.x), fmtLength(x.y), fmtLength(x.blur), fmtLength(x.spread), x.color, yes(l, x.inset)]),
      mono: true,
    });
    const extra = (l: Locale): Block[] =>
      p.slug === "material-elevation"
        ? [{ type: "table", title: l === "ru" ? "Все уровни высоты" : "All elevation levels", head: ["dp", "box-shadow"], rows: MATERIAL_ELEVATION.map(([dp, v]) => [String(dp), v]), mono: true }]
        : [];
    const tw = p.slug.startsWith("tailwind-") ? p.slug.replace("tailwind-", "shadow-") : null;
    return {
      slug: p.slug,
      name: info.name,
      title: { ru: `${info.name.ru}: CSS box-shadow с кодом`, en: `${info.name.en} — CSS box-shadow code` },
      h1: { ru: `${info.name.ru} в CSS`, en: `${info.name.en} in CSS` },
      description: {
        ru: desc(`${info.about.ru} ${layers.length > 1 ? `${layers.length} ${plural("ru", layers.length, ["слой", "слоя", "слоёв"])} тени` : "Один слой"} — скопируйте код box-shadow или настройте значения в редакторе.`, `${info.about.ru} Готовый код box-shadow и редактор слоёв.`, `${info.about.ru} Код и редактор.`),
        en: desc(`${info.about.en} ${layers.length > 1 ? `${layers.length} shadow layers` : "A single layer"} — copy the box-shadow code or tweak every value in the editor.`, `${info.about.en} Ready box-shadow code and a layer editor.`, `${info.about.en} Code and editor.`),
      },
      lead: { ru: `box-shadow: ${p.value};`, en: `box-shadow: ${p.value};` },
      props: { value: p.value, surface: p.surface, box: p.box },
      blocks: (l) => [
        {
          type: "facts",
          title: l === "ru" ? "Коротко" : "In brief",
          rows: [
            [l === "ru" ? "Слоёв" : "Layers", String(layers.length)],
            [l === "ru" ? "Внутренняя (inset)" : "Inset", yes(l, layers.some((x) => x.inset))],
            [l === "ru" ? "Для чего" : "Use it for", tr(info.about, l)],
            ...(tw ? ([[l === "ru" ? "Класс Tailwind" : "Tailwind class", tw]] as [string, string][]) : []),
          ],
        },
        table(l),
        ...extra(l),
      ],
      faq: {
        ru: [
          { q: `Как добавить ${info.name.ru.toLowerCase().replace("tailwind", "Tailwind")} на сайт?`, a: `Скопируйте строку box-shadow: ${p.value}; и добавьте её в правило нужного элемента. В редакторе выше можно поменять смещение, размытие и цвет каждого слоя.` },
          ...(info.q ?? [{ q: "Как сделать тень мягче?", a: "Увеличьте размытие и уменьшите непрозрачность цвета, а смещение по Y сделайте примерно вдвое меньше размытия. Ещё мягче выглядят несколько слоёв с нарастающим размытием." }]),
        ],
        en: [
          { q: `How do I add this ${info.name.en.includes("Tailwind") ? info.name.en : info.name.en.toLowerCase()} to my site?`, a: `Copy box-shadow: ${p.value}; into the rule of the element you need. The editor above lets you change the offset, blur and color of every layer.` },
          ...(info.qen ?? [{ q: "How do I make a shadow softer?", a: "Increase the blur, lower the color's opacity and keep the Y offset about half the blur. Several layers with growing blur look softer still." }]),
        ],
      },
    };
  });
}

/* ───────────── text-shadow ───────────── */

const TEXT_SHADOW_TEXT: Record<string, { name: L2; about: L2 }> = {
  neon: { name: { ru: "Неоновый текст", en: "Neon text" }, about: { ru: "Белые буквы с несколькими слоями голубого свечения — эффект неоновой вывески на тёмном фоне.", en: "White letters with several layers of cyan glow — a neon sign on a dark background." } },
  glow: { name: { ru: "Светящийся текст", en: "Glowing text" }, about: { ru: "Один мягкий слой свечения в цвет текста — аккуратный акцент для заголовков на тёмном фоне.", en: "One soft glow layer in the text color — a neat accent for headings on dark backgrounds." } },
  "3d": { name: { ru: "Объёмный 3D-текст", en: "3D text" }, about: { ru: "Четыре слоя по 1 px с постепенно темнеющим цветом и мягкая тень снизу создают объём.", en: "Four 1px layers in gradually darker colors plus a soft drop shadow create depth." } },
  "long-shadow": { name: { ru: "Длинная тень текста", en: "Long text shadow" }, about: { ru: "Двенадцать слоёв без размытия по диагонали — плоская «длинная тень» в стиле flat-дизайна.", en: "Twelve unblurred diagonal layers — the flat-design “long shadow”." } },
  outline: { name: { ru: "Обводка текста", en: "Text outline" }, about: { ru: "Четыре тени по 1 px во все стороны дают контур букв; работает там, где нет -webkit-text-stroke.", en: "Four 1px shadows in every direction outline the letters; works where -webkit-text-stroke doesn't." } },
  retro: { name: { ru: "Ретро-тень текста", en: "Retro text shadow" }, about: { ru: "Два цветных смещённых слоя без размытия — узнаваемый стиль ретро-плакатов.", en: "Two offset colored layers without blur — the recognizable retro poster style." } },
  embossed: { name: { ru: "Тиснёный текст", en: "Embossed text" }, about: { ru: "Светлый блик сверху слева и тень снизу справа при цвете текста, равном фону, — эффект тиснения.", en: "A light highlight top-left and a shadow bottom-right with text matching the background — an embossed look." } },
  letterpress: { name: { ru: "Эффект letterpress", en: "Letterpress text" }, about: { ru: "Тонкий светлый блик под тёмными буквами — будто текст вдавлен в бумагу.", en: "A thin light highlight under dark letters — as if the text were pressed into paper." } },
  fire: { name: { ru: "Огненный текст", en: "Fire text" }, about: { ru: "Шесть слоёв от бледно-жёлтого до тёмно-оранжевого, смещённых вверх, — языки пламени над буквами.", en: "Six layers from pale yellow to dark orange shifted upwards — flames above the letters." } },
  soft: { name: { ru: "Мягкая тень текста", en: "Soft text shadow" }, about: { ru: "Лёгкая тень на 2 px вниз — повышает читаемость текста поверх фотографий и градиентов.", en: "A light 2px drop shadow — improves the readability of text over photos and gradients." } },
};

export function textShadowVariants(): VariantDef[] {
  return TEXT_SHADOW_PRESETS.map((p) => {
    const info = TEXT_SHADOW_TEXT[p.slug];
    const layers = parseShadow(p.value, "text").layers;
    return {
      slug: p.slug,
      name: info.name,
      title: { ru: `${info.name.ru} на CSS — text-shadow`, en: `${info.name.en} with CSS text-shadow` },
      h1: { ru: `${info.name.ru} на CSS`, en: `${info.name.en} in CSS` },
      description: { ru: desc(`${info.about.ru} Готовый код text-shadow, цвета текста и фона.`, `${info.about.ru} Готовый код text-shadow.`, info.about.ru), en: desc(`${info.about.en} Ready text-shadow code with text and background colors.`, `${info.about.en} Ready text-shadow code.`, info.about.en) },
      lead: { ru: `text-shadow: ${p.value};`, en: `text-shadow: ${p.value};` },
      props: { value: p.value, surface: p.surface, color: p.color },
      blocks: (l) => [
        {
          type: "facts",
          title: l === "ru" ? "Коротко" : "In brief",
          rows: [
            [l === "ru" ? "Слоёв" : "Layers", String(layers.length)],
            [l === "ru" ? "Цвет текста" : "Text color", p.color],
            [l === "ru" ? "Фон" : "Background", p.surface],
            [l === "ru" ? "Эффект" : "Effect", tr(info.about, l)],
          ],
        },
        {
          type: "table",
          title: l === "ru" ? "Слои тени" : "Shadow layers",
          head: ["#", "x", "y", l === "ru" ? "размытие" : "blur", l === "ru" ? "цвет" : "color"],
          rows: layers.map((x, i) => [String(i + 1), fmtLength(x.x), fmtLength(x.y), fmtLength(x.blur), x.color]),
          mono: true,
        },
      ],
      faq: {
        ru: [
          { q: `Как сделать ${info.name.ru.toLowerCase()} на сайте?`, a: `Задайте тексту color: ${p.color} и text-shadow: ${p.value}. Эффект рассчитан на фон ${p.surface}; на другом фоне подберите цвета слоёв в редакторе.` },
          { q: "Влияет ли text-shadow на доступность?", a: "Тень не заменяет контраст: проверьте, что сам цвет текста контрастен фону (4,5:1 для обычного текста). Размытые многослойные тени лучше оставлять для крупных заголовков." },
        ],
        en: [
          { q: `How do I create ${info.name.en.toLowerCase()} on a website?`, a: `Give the text color: ${p.color} and text-shadow: ${p.value}. The effect is designed for a ${p.surface} background; on another background tune the layer colors in the editor.` },
          { q: "Does text-shadow affect accessibility?", a: "A shadow doesn't replace contrast: make sure the text color itself contrasts with the background (4.5:1 for normal text). Keep blurred multi-layer shadows for large headings." },
        ],
      },
    };
  });
}

/* ───────────── animations ───────────── */

const ANIM_TEXT: Record<string, { ru: string; en: string; ruName: string; enName: string }> = {
  "fade-in": { ruName: "Плавное появление", enName: "Fade in", ru: "прозрачность плавно растёт от 0 до 1", en: "opacity rises smoothly from 0 to 1" },
  "fade-out": { ruName: "Плавное исчезновение", enName: "Fade out", ru: "прозрачность плавно падает от 1 до 0", en: "opacity drops smoothly from 1 to 0" },
  "slide-in-left": { ruName: "Выезд слева", enName: "Slide in from the left", ru: "элемент выезжает слева на свою ширину и проявляется", en: "the element slides in from the left by its own width while fading in" },
  "slide-in-right": { ruName: "Выезд справа", enName: "Slide in from the right", ru: "элемент выезжает справа на свою ширину и проявляется", en: "the element slides in from the right by its own width while fading in" },
  "slide-in-up": { ruName: "Выезд снизу", enName: "Slide in from the bottom", ru: "элемент поднимается снизу на свою высоту и проявляется", en: "the element rises from below by its own height while fading in" },
  "slide-in-down": { ruName: "Выезд сверху", enName: "Slide in from the top", ru: "элемент опускается сверху на свою высоту и проявляется", en: "the element drops in from above by its own height while fading in" },
  "zoom-in": { ruName: "Увеличение", enName: "Zoom in", ru: "элемент увеличивается с 50 % до 100 % и проявляется", en: "the element scales from 50% to 100% while fading in" },
  "zoom-out": { ruName: "Уменьшение", enName: "Zoom out", ru: "элемент уменьшается до 50 % и исчезает", en: "the element shrinks to 50% and fades out" },
  bounce: { ruName: "Подпрыгивание", enName: "Bounce", ru: "элемент подпрыгивает на 30 px с затухающими отскоками", en: "the element jumps 30px with decaying bounces" },
  shake: { ruName: "Тряска", enName: "Shake", ru: "элемент дрожит влево-вправо на 6 px — привычный сигнал ошибки", en: "the element shakes 6px left and right — a familiar error cue" },
  pulse: { ruName: "Пульсация", enName: "Pulse", ru: "элемент плавно увеличивается на 5 % и возвращается", en: "the element grows by 5% and settles back" },
  spin: { ruName: "Вращение", enName: "Spin", ru: "элемент непрерывно вращается на 360° — как индикатор загрузки", en: "the element rotates 360° continuously — like a loading spinner" },
  flip: { ruName: "Переворот", enName: "Flip", ru: "элемент переворачивается вокруг вертикальной оси в перспективе", en: "the element flips around its vertical axis in perspective" },
  swing: { ruName: "Качание", enName: "Swing", ru: "элемент качается, как вывеска, подвешенная за верхний край", en: "the element swings like a sign hanging from its top edge" },
  heartbeat: { ruName: "Сердцебиение", enName: "Heartbeat", ru: "элемент дважды «ударяет», увеличиваясь на 30 %", en: "the element beats twice, growing by 30%" },
  wobble: { ruName: "Покачивание", enName: "Wobble", ru: "элемент раскачивается из стороны в сторону с наклоном", en: "the element wobbles from side to side with a tilt" },
  jello: { ruName: "Желе", enName: "Jello", ru: "элемент дрожит как желе с затухающим скосом", en: "the element jiggles like jelly with a decaying skew" },
  blink: { ruName: "Мигание", enName: "Blink", ru: "элемент резко мигает раз в секунду", en: "the element blinks sharply once per second" },
  typing: { ruName: "Эффект печати", enName: "Typing effect", ru: "текст появляется по буквам, как на печатной машинке", en: "text appears letter by letter like on a typewriter" },
  "skeleton-shimmer": { ruName: "Скелетон-загрузка", enName: "Skeleton shimmer", ru: "по заглушке пробегает световой блик, пока грузится контент", en: "a highlight sweeps across a placeholder while content loads" },
};

const KIND: Record<string, L2> = {
  entrance: { ru: "появление", en: "entrance" },
  exit: { ru: "исчезновение", en: "exit" },
  attention: { ru: "привлечение внимания", en: "attention seeker" },
  loop: { ru: "бесконечный цикл", en: "loop" },
  text: { ru: "текстовый эффект", en: "text effect" },
  loading: { ru: "индикатор загрузки", en: "loading indicator" },
};

export function animationVariants(): VariantDef[] {
  return ANIM_PRESETS.map((p) => {
    const i = ANIM_TEXT[p.slug];
    const sh = animationShorthand(settingsFor(p));
    return {
      slug: p.slug,
      name: { ru: i.ruName, en: i.enName },
      title: { ru: `${i.ruName} (${p.slug}) — CSS-анимация с кодом`, en: `CSS ${p.slug} animation — keyframes and code` },
      h1: { ru: `Анимация ${p.slug} на CSS`, en: `CSS ${p.slug} animation` },
      description: {
        ru: desc(`CSS-анимация ${p.slug}: ${i.ru}. Готовые @keyframes, класс и блок prefers-reduced-motion, настройка длительности и easing.`, `CSS-анимация ${p.slug}: ${i.ru}. Готовые @keyframes и блок prefers-reduced-motion.`, `CSS-анимация ${p.slug}: ${i.ru}. Готовые @keyframes.`),
        en: desc(`CSS ${p.slug} animation: ${i.en}. Ready @keyframes, a class and a prefers-reduced-motion block, adjustable duration and easing.`, `CSS ${p.slug} animation: ${i.en}. Ready @keyframes with a prefers-reduced-motion block.`, `CSS ${p.slug} animation: ${i.en}. Ready @keyframes.`),
      },
      lead: { ru: `${i.ruName}: ${i.ru}. animation: ${sh};`, en: `${i.enName}: ${i.en}. animation: ${sh};` },
      props: { preset: p.slug },
      blocks: (l) => [
        {
          type: "facts",
          title: l === "ru" ? "Параметры по умолчанию" : "Default settings",
          rows: [
            [l === "ru" ? "Тип" : "Type", tr(KIND[p.kind], l)],
            [l === "ru" ? "Длительность" : "Duration", `${p.duration}s`],
            ["timing-function", p.timing],
            [l === "ru" ? "Повторы" : "Iterations", String(p.iterations)],
            ["fill-mode", p.fill],
            ...(p.extra?.length ? ([[l === "ru" ? "Нужно элементу" : "Element needs", p.extra.join(" ")]] as [string, string][]) : []),
          ],
        },
        { type: "table", title: `@keyframes ${p.slug}`, head: ["CSS"], rows: lines(p.keyframes), mono: true },
      ],
      faq: {
        ru: [
          { q: `Как подключить анимацию ${p.slug}?`, a: `Скопируйте @keyframes ${p.slug} и класс .${p.slug} в свой CSS и добавьте класс элементу. Имя можно заменить на любое — генератор не добавляет префиксов.` },
          { q: "Что увидят пользователи с настройкой «Уменьшить движение»?", a: "Сгенерированный код содержит @media (prefers-reduced-motion: reduce), который отключает анимацию для тех, кто попросил систему уменьшить движение, — элемент просто показывается в конечном виде." },
        ],
        en: [
          { q: `How do I use the ${p.slug} animation?`, a: `Copy @keyframes ${p.slug} and the .${p.slug} class into your CSS and add the class to an element. You can rename it freely — the generator adds no prefixes.` },
          { q: "What do users with reduced motion see?", a: "The generated code includes @media (prefers-reduced-motion: reduce), which turns the animation off for people who asked their system for less motion — the element simply appears in its final state." },
        ],
      },
    };
  });
}

/* ───────────── flexbox recipes ───────────── */

const FLEX_TEXT: Record<string, { name: L2; title: L2; about: L2 }> = {
  "center-div": { name: { ru: "Центрирование div", en: "Center a div" }, title: { ru: "Как отцентрировать div на flexbox", en: "How to center a div with flexbox" }, about: { ru: "Три строки: display: flex, justify-content: center и align-items: center центрируют элемент по горизонтали и вертикали.", en: "Three lines — display: flex, justify-content: center and align-items: center — center an element horizontally and vertically." } },
  "navbar-space-between": { name: { ru: "Навбар: space-between", en: "Navbar with space-between" }, title: { ru: "Навбар на flexbox: логотип и меню по краям", en: "Flexbox navbar with space-between" }, about: { ru: "justify-content: space-between разносит логотип и кнопку по краям, а align-items: center выравнивает всё по средней линии.", en: "justify-content: space-between pushes the logo and the button to the edges, align-items: center aligns everything on the middle line." } },
  "sticky-footer": { name: { ru: "Прижатый футер", en: "Sticky footer" }, title: { ru: "Прижать футер к низу страницы на flexbox", en: "Sticky footer with flexbox" }, about: { ru: "Колонка с min-height: 100vh и flex-grow: 1 у основного блока: подвал всегда внизу, даже если контента мало.", en: "A column with min-height: 100vh and flex-grow: 1 on the main block keeps the footer at the bottom even with little content." } },
  "holy-grail": { name: { ru: "Святой Грааль", en: "Holy grail" }, title: { ru: "Макет «Святой Грааль» на flexbox", en: "Holy grail layout with flexbox" }, about: { ru: "Шапка и подвал на всю ширину (flex-basis: 100% и перенос), между ними навигация, контент и боковая колонка.", en: "Full-width header and footer (flex-basis: 100% with wrapping) around navigation, content and a side column." } },
  "equal-height-cards": { name: { ru: "Карточки одной высоты", en: "Equal-height cards" }, title: { ru: "Карточки одинаковой высоты на flexbox", en: "Equal-height cards with flexbox" }, about: { ru: "По умолчанию align-items: stretch растягивает соседей до самого высокого, а flex: 1 делит ширину поровну.", en: "The default align-items: stretch makes siblings as tall as the tallest one, and flex: 1 splits the width evenly." } },
  "wrap-gallery": { name: { ru: "Галерея с переносом", en: "Wrapping gallery" }, title: { ru: "Галерея на flexbox с переносом строк", en: "Flexbox wrapping gallery" }, about: { ru: "flex-wrap: wrap переносит элементы, а flex: 1 1 120px задаёт минимальную ширину и растягивает их на всю строку.", en: "flex-wrap: wrap moves items to new lines, and flex: 1 1 120px sets a minimum width while stretching them across the row." } },
  sidebar: { name: { ru: "Сайдбар", en: "Sidebar" }, title: { ru: "Сайдбар на flexbox: фиксированная колонка", en: "Flexbox sidebar layout" }, about: { ru: "Сайдбар с flex: 0 0 180px не сжимается, а контент с flex: 1 занимает всё остальное место.", en: "A sidebar with flex: 0 0 180px never shrinks, and the content with flex: 1 takes the rest." } },
  "push-last-right": { name: { ru: "Последний элемент вправо", en: "Push the last item right" }, title: { ru: "Прижать последний элемент вправо — flexbox", en: "Push the last flex item to the right" }, about: { ru: "margin-inline-start: auto у элемента забирает всё свободное место слева от него и прижимает его к правому краю.", en: "margin-inline-start: auto on an item absorbs the free space before it and pushes it to the right edge." } },
  "media-object": { name: { ru: "Медиаобъект", en: "Media object" }, title: { ru: "Медиаобъект на flexbox: картинка и текст", en: "Flexbox media object: image and text" }, about: { ru: "Картинка фиксированной ширины (flex-shrink: 0) и текст, который занимает остаток и переносится рядом с ней.", en: "A fixed-width image (flex-shrink: 0) next to text that takes the remaining space and wraps beside it." } },
  "input-group": { name: { ru: "Поле с кнопкой", en: "Input group" }, title: { ru: "Поле ввода с кнопкой на flexbox", en: "Flexbox input group: field and button" }, about: { ru: "Поле с flex: 1 растягивается, кнопка с flex-shrink: 0 сохраняет ширину — удобно для поиска и подписки.", en: "The field with flex: 1 stretches while the button with flex-shrink: 0 keeps its width — handy for search and subscribe forms." } },
};

export function flexVariants(): VariantDef[] {
  return Object.keys(FLEX_RECIPES).map((slug) => {
    const i = FLEX_TEXT[slug];
    return {
      slug,
      name: i.name,
      title: i.title,
      h1: i.title,
      description: { ru: desc(`${i.about.ru} Готовые HTML и CSS, живое превью.`, `${i.about.ru} Готовый код.`, i.about.ru), en: desc(`${i.about.en} Ready HTML and CSS with a live preview.`, `${i.about.en} Ready code.`, i.about.en) },
      lead: i.about,
      props: { recipe: flexRecipe(slug, "en") },
      blocks: (l) => [{ type: "table", title: l === "ru" ? "CSS рецепта" : "Recipe CSS", head: ["CSS"], rows: lines(flexCss(flexRecipe(slug, l))), mono: true }],
      faq: {
        ru: [
          { q: `Как повторить «${i.name.ru.toLowerCase()}» у себя?`, a: "Скопируйте HTML и CSS из генератора: классы .container и .item-N можно переименовать. В свойства из рецепта можно вносить свои значения — код обновится сразу." },
          { q: "Поддерживается ли flexbox во всех браузерах?", a: "Да, flexbox работает во всех браузерах последних десяти лет; свойство gap для flex — с 2021 года (Safari 14.1)." },
        ],
        en: [
          { q: `How do I reproduce the ${i.name.en.toLowerCase()} recipe?`, a: "Copy the HTML and CSS from the generator; feel free to rename .container and .item-N. Change any property of the recipe and the code updates instantly." },
          { q: "Is flexbox supported in all browsers?", a: "Yes, flexbox has worked in every browser for a decade; gap for flex layouts since 2021 (Safari 14.1)." },
        ],
      },
    };
  });
}

/** Recipe props are localized when the page is rendered (labels inside the preview). */
export function localizeFlexProps(slug: string, locale: Locale) {
  return { recipe: flexRecipe(slug, locale) };
}

/* ───────────── grid recipes ───────────── */

const GRID_TEXT: Record<string, { name: L2; title: L2; about: L2 }> = {
  "12-column": { name: { ru: "12 колонок", en: "12-column grid" }, title: { ru: "12-колоночная сетка на CSS Grid", en: "12-column grid with CSS Grid" }, about: { ru: "repeat(12, 1fr) и grid-column: span N — та же логика, что в Bootstrap, но без классов-обёрток.", en: "repeat(12, 1fr) with grid-column: span N — the Bootstrap logic without wrapper classes." } },
  "auto-fit-cards": { name: { ru: "Карточки auto-fit", en: "Auto-fit cards" }, title: { ru: "Адаптивные карточки на CSS Grid без медиазапросов", en: "Responsive auto-fit card grid without media queries" }, about: { ru: "repeat(auto-fit, minmax(160px, 1fr)) сам подбирает число колонок под ширину экрана.", en: "repeat(auto-fit, minmax(160px, 1fr)) picks the number of columns to fit the screen width." } },
  "holy-grail-areas": { name: { ru: "Святой Грааль (areas)", en: "Holy grail with areas" }, title: { ru: "Макет «Святой Грааль» на grid-template-areas", en: "Holy grail layout with grid-template-areas" }, about: { ru: "Именованные области header, nav, main, aside и footer описывают макет наглядно, прямо «картинкой» в CSS.", en: "Named areas header, nav, main, aside and footer describe the layout visually, right in the CSS." } },
  dashboard: { name: { ru: "Дашборд", en: "Dashboard" }, title: { ru: "Макет дашборда на CSS Grid", en: "Dashboard layout with CSS Grid" }, about: { ru: "Сайдбар на всю высоту, верхняя панель и блоки графиков — всё через grid-template-areas.", en: "A full-height sidebar, a top bar and chart panels — all with grid-template-areas." } },
  sidebar: { name: { ru: "Сайдбар", en: "Sidebar" }, title: { ru: "Сайдбар на CSS Grid с minmax()", en: "Sidebar layout with CSS Grid and minmax()" }, about: { ru: "minmax(160px, 240px) 1fr: колонка сайдбара гибкая в заданных пределах, контент занимает остаток.", en: "minmax(160px, 240px) 1fr: the sidebar flexes within limits and the content takes the rest." } },
  "two-columns": { name: { ru: "Две колонки", en: "Two columns" }, title: { ru: "Две колонки на CSS Grid", en: "Two-column layout with CSS Grid" }, about: { ru: "repeat(2, 1fr) делит ширину на две равные колонки с отступом gap — основа макетов «текст и картинка» и форм в две колонки.", en: "repeat(2, 1fr) splits the width into two equal columns separated by gap — the base for text-and-image layouts and two-column forms." } },
  "three-columns": { name: { ru: "Три колонки", en: "Three columns" }, title: { ru: "Три колонки на CSS Grid", en: "Three-column layout with CSS Grid" }, about: { ru: "repeat(3, 1fr) — три равные колонки; элементы сами переносятся на новые строки.", en: "repeat(3, 1fr) — three equal columns; items wrap to new rows automatically." } },
  "four-columns": { name: { ru: "Четыре колонки", en: "Four columns" }, title: { ru: "Четыре колонки на CSS Grid", en: "Four-column layout with CSS Grid" }, about: { ru: "repeat(4, 1fr) — четыре равные колонки для каталогов товаров, галерей и карточек; на телефонах их обычно сводят к одной-двум.", en: "repeat(4, 1fr) — four equal columns for product catalogs, galleries and cards; on phones they usually collapse to one or two." } },
  "full-bleed": { name: { ru: "Full-bleed", en: "Full-bleed" }, title: { ru: "Full-bleed на CSS Grid: блок на всю ширину", en: "Full-bleed layout with CSS Grid" }, about: { ru: "Три колонки 1fr min(60ch, …) 1fr: текст в центре, а grid-column: 1 / -1 растягивает картинку на всю ширину.", en: "Three columns 1fr min(60ch, …) 1fr: text in the middle, grid-column: 1 / -1 stretches an image edge to edge." } },
  bento: { name: { ru: "Бенто-сетка", en: "Bento grid" }, title: { ru: "Бенто-сетка на CSS Grid", en: "Bento grid layout with CSS Grid" }, about: { ru: "Карточки разного размера через span по строкам и колонкам — популярная «бенто»-подача фич.", en: "Cards of different sizes via row and column spans — the popular bento feature layout." } },
  "pancake-stack": { name: { ru: "Pancake stack", en: "Pancake stack" }, title: { ru: "Pancake stack на CSS Grid: шапка, контент, подвал", en: "Pancake stack with CSS Grid" }, about: { ru: "grid-template-rows: auto 1fr auto — шапка и подвал по содержимому, середина растягивается.", en: "grid-template-rows: auto 1fr auto — header and footer size to content, the middle stretches." } },
};

export function gridVariants(): VariantDef[] {
  return Object.keys(GRID_RECIPES).map((slug) => {
    const i = GRID_TEXT[slug];
    return {
      slug,
      name: i.name,
      title: i.title,
      h1: i.title,
      description: { ru: desc(`${i.about.ru} Готовые HTML и CSS и живое превью.`, `${i.about.ru} Готовый код.`, i.about.ru), en: desc(`${i.about.en} Ready HTML and CSS with a live preview.`, `${i.about.en} Ready code.`, i.about.en) },
      lead: i.about,
      props: { recipe: gridRecipe(slug, "en") },
      blocks: (l) => [{ type: "table", title: l === "ru" ? "CSS рецепта" : "Recipe CSS", head: ["CSS"], rows: lines(gridCss(gridRecipe(slug, l))), mono: true }],
      faq: {
        ru: [
          { q: `Как адаптировать «${i.name.ru.toLowerCase()}» под телефон?`, a: "Оберните шаблон в медиазапрос: на узких экранах задайте grid-template-columns: 1fr (и одну колонку в grid-template-areas), на широких — шаблон из рецепта." },
          { q: "Чем Grid отличается от flexbox?", a: "Grid управляет двумя осями сразу — колонками и строками, flexbox — одной. Для раскладки страницы удобнее Grid, для ряда кнопок или меню — flexbox." },
        ],
        en: [
          { q: `How do I adapt the ${i.name.en.toLowerCase()} recipe for phones?`, a: "Wrap the template in a media query: on narrow screens use grid-template-columns: 1fr (and a single column in grid-template-areas), on wide screens the recipe's template." },
          { q: "How is Grid different from flexbox?", a: "Grid controls two axes at once — columns and rows — while flexbox handles one. Grid suits page layouts, flexbox suits rows of buttons or menus." },
        ],
      },
    };
  });
}

export function localizeGridProps(slug: string, locale: Locale) {
  return { recipe: gridRecipe(slug, locale) };
}

/* ───────────── clip-path shapes ───────────── */

const CLIP_TEXT: Record<string, L2> = {
  triangle: { ru: "Треугольник", en: "Triangle" },
  trapezoid: { ru: "Трапеция", en: "Trapezoid" },
  parallelogram: { ru: "Параллелограмм", en: "Parallelogram" },
  rhombus: { ru: "Ромб", en: "Rhombus" },
  pentagon: { ru: "Пятиугольник", en: "Pentagon" },
  hexagon: { ru: "Шестиугольник", en: "Hexagon" },
  octagon: { ru: "Восьмиугольник", en: "Octagon" },
  star: { ru: "Звезда", en: "Star" },
  arrow: { ru: "Стрелка", en: "Arrow" },
  chevron: { ru: "Шеврон", en: "Chevron" },
  cross: { ru: "Крест", en: "Cross" },
  message: { ru: "Облачко сообщения", en: "Message bubble" },
  circle: { ru: "Круг", en: "Circle" },
  ellipse: { ru: "Эллипс", en: "Ellipse" },
  inset: { ru: "Скруглённый прямоугольник", en: "Rounded rectangle" },
};

export function clipVariants(): VariantDef[] {
  return CLIP_SHAPES.map((s) => {
    const name = CLIP_TEXT[s.slug];
    const css = shapeCss(s);
    const n = s.points?.length ?? 0;
    return {
      slug: s.slug,
      name,
      title: { ru: `${name.ru} на CSS clip-path — готовый код`, en: `CSS clip-path ${name.en.toLowerCase()} — ready code` },
      h1: { ru: `${name.ru} на clip-path`, en: `${name.en} with CSS clip-path` },
      description: {
        ru: desc(`${name.ru} на CSS clip-path: ${s.points ? `polygon() из ${n} точек` : css.split("(")[0] + "()"}, координаты в процентах — фигура масштабируется вместе с блоком. Код и редактор точек.`),
        en: desc(`${name.en} with CSS clip-path: ${s.points ? `polygon() with ${n} points` : `${css.split("(")[0]}()`}, coordinates in percent so the shape scales with the element. Code and a point editor.`),
      },
      lead: { ru: `clip-path: ${css};`, en: `clip-path: ${css};` },
      props: { shape: s.slug },
      blocks: (l) => [
        {
          type: "facts",
          title: l === "ru" ? "Коротко" : "In brief",
          rows: [
            [l === "ru" ? "Функция" : "Function", css.split("(")[0] + "()"],
            ...(s.points ? ([[l === "ru" ? "Вершин" : "Vertices", String(n)]] as [string, string][]) : []),
            [l === "ru" ? "Единицы" : "Units", l === "ru" ? "проценты от размера блока" : "percent of the element's box"],
          ],
        },
        ...(s.points
          ? [{ type: "table" as const, title: l === "ru" ? "Координаты вершин" : "Vertex coordinates", head: ["#", "x", "y"], rows: s.points.map(([x, y], i) => [String(i + 1), `${x}%`, `${y}%`]), mono: true }]
          : []),
      ],
      faq: {
        ru: [
          { q: `Как вырезать ${name.ru.toLowerCase()} из картинки?`, a: `Добавьте изображению или блоку clip-path: ${css}. Всё, что вне фигуры, станет невидимым и перестанет реагировать на клики.` },
          { q: "Можно ли добавить обводку или тень к фигуре?", a: "border и box-shadow обрезаются вместе с элементом. Для тени оберните блок и задайте обёртке filter: drop-shadow(…), а обводку сделайте вторым слоем той же формы чуть большего размера." },
        ],
        en: [
          { q: `How do I cut a ${name.en.toLowerCase()} out of an image?`, a: `Give the image or block clip-path: ${css}. Everything outside the shape becomes invisible and stops receiving clicks.` },
          { q: "Can I add a border or shadow to the shape?", a: "border and box-shadow are clipped with the element. For a shadow, wrap it and apply filter: drop-shadow(…) to the wrapper; for an outline, stack a slightly larger copy of the shape behind it." },
        ],
      },
    };
  });
}
