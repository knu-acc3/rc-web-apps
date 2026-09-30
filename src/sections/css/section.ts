import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, SectionDef, ToolDef } from "@/registry/types";
import { convertUnit } from "./lib/units";
import { SHADOW_PRESETS } from "./lib/presets";
import { animationVariants, clipVariants, flexVariants, gridVariants, localizeFlexProps, localizeGridProps, shadowVariants, textShadowVariants } from "./variants";

const BOX_SHADOW: ToolDef = {
  slug: "box-shadow-generator",
  component: "css/shadow",
  icon: "Square",
  popular: true,
  wide: true,
  name: { ru: "Генератор box-shadow", en: "Box-shadow generator" },
  title: { ru: "Генератор box-shadow онлайн — тени CSS с кодом", en: "CSS box-shadow generator — layered shadows with code" },
  h1: { ru: "Генератор теней box-shadow", en: "CSS box-shadow generator" },
  description: {
    ru: "Соберите CSS-тень из нескольких слоёв: смещение, размытие, растяжение, inset и цвет с прозрачностью. Вставка готового CSS в любых единицах и 16 пресетов.",
    en: "Build a CSS shadow from several layers: offset, blur, spread, inset and a translucent color. Paste existing CSS in any units and start from 16 presets.",
  },
  lead: { ru: "Настройте слои тени — превью и код box-shadow обновляются сразу.", en: "Tweak the shadow layers — the preview and box-shadow code update instantly." },
  keywords: { ru: ["box-shadow", "тень css", "генератор теней", "неоморфизм"], en: ["box-shadow", "css shadow", "shadow generator", "neumorphism"] },
  props: { kind: "box", value: SHADOW_PRESETS.find((p) => p.slug === "card")!.value },
  howTo: {
    ru: [
      "Выберите слой и двигайте ползунки: смещение по X и Y, размытие и растяжение.",
      "Задайте цвет тени в любом формате — например, rgb(0 0 0 / 0.15) или #00000026 — и при необходимости включите inset.",
      "Добавьте ещё слои: несколько мягких теней выглядят естественнее одной резкой.",
      "Скопируйте CSS или класс Tailwind; уже готовую тень можно вставить в поле ниже и доработать.",
    ],
    en: [
      "Pick a layer and move the sliders: X and Y offset, blur and spread.",
      "Set the shadow color in any format — e.g. rgb(0 0 0 / 0.15) or #00000026 — and turn on inset if needed.",
      "Add more layers: several soft shadows look more natural than a single hard one.",
      "Copy the CSS or the Tailwind class; paste an existing shadow into the field below to keep editing it.",
    ],
  },
  faq: {
    ru: [
      { q: "Что означают четыре числа в box-shadow?", a: "Смещение по горизонтали, смещение по вертикали, радиус размытия и растяжение. Отрицательное растяжение уменьшает тень — так делают мягкие тени, которые не выглядывают по бокам." },
      { q: "Можно ли задать тень в em или rem?", a: "Да, любые единицы длины: px, em, rem, %, vw и другие. Парсер понимает их при вставке, а в редакторе единица слоя сохраняется." },
      { q: "Почему тень с rgba() теряла прозрачность в других генераторах?", a: "Часть генераторов разбирала только HEX и ломалась на запятых внутри rgb(). Здесь цвет разбирается полноценно — rgb(), hsl(), oklch(), названия и восьмизначный HEX сохраняют прозрачность." },
      { q: "Сколько слоёв можно добавить?", a: "Сколько угодно — CSS не ограничивает их число. Но каждый слой отрисовывается отдельно, поэтому на анимируемых элементах лучше 2–3 слоя." },
    ],
    en: [
      { q: "What do the four numbers in box-shadow mean?", a: "Horizontal offset, vertical offset, blur radius and spread. A negative spread shrinks the shadow — that's how soft shadows avoid peeking out at the sides." },
      { q: "Can I use em or rem for shadows?", a: "Yes, any length unit: px, em, rem, %, vw and more. The parser accepts them when pasting and the editor keeps each layer's unit." },
      { q: "Why did rgba() shadows lose transparency in other generators?", a: "Some generators only parsed HEX and broke on the commas inside rgb(). Here colors are parsed properly — rgb(), hsl(), oklch(), names and 8-digit HEX keep their alpha." },
      { q: "How many layers can I add?", a: "As many as you like — CSS has no limit. Each layer is painted separately, though, so keep animated elements to 2–3 layers." },
    ],
  },
  about: {
    ru: [
      "box-shadow рисует тень от рамки элемента: снаружи или внутри (inset), с любым количеством слоёв через запятую. Генератор показывает результат на блоке, цвет которого можно поменять, на светлом, тёмном или шахматном фоне.",
      "Поле «Вставить свой CSS» разбирает готовые тени: единицы px, em, rem, %, vw, отрицательные значения, inset в начале или конце и цвет до или после чисел.",
    ],
    en: [
      "box-shadow paints a shadow from the element's border box, outside or inside (inset), with any number of comma-separated layers. The generator shows it on a box whose color you can change, on a light, dark or checkered background.",
      "The “Paste your CSS” field parses existing shadows: px, em, rem, %, vw, negative values, inset at the start or end and the color before or after the numbers.",
    ],
  },
  variants: { title: { ru: "Готовые тени", en: "Shadow presets" }, list: shadowVariants },
};

const TEXT_SHADOW: ToolDef = {
  slug: "text-shadow-generator",
  seoAlt: { ru: ["генератор text-shadow", "text-shadow"], en: ["text-shadow generator", "CSS text-shadow", "code"] },
  component: "css/shadow",
  icon: "Type",
  wide: true,
  name: { ru: "Генератор text-shadow", en: "Text-shadow generator" },
  title: { ru: "Генератор text-shadow — тень текста CSS онлайн", en: "CSS text-shadow generator — text effects with code" },
  h1: { ru: "Генератор тени текста text-shadow", en: "CSS text-shadow generator" },
  description: {
    ru: "Тень текста на CSS: слои со смещением, размытием и цветом, вставка готового кода и 10 эффектов — неон, 3D, обводка, огонь, тиснение, длинная тень.",
    en: "CSS text shadow with layers of offset, blur and color, paste-in parsing and 10 effects — neon, 3D, outline, fire, embossed and long shadow.",
  },
  lead: { ru: "Настройте слои — заголовок в превью и код text-shadow меняются сразу.", en: "Adjust the layers — the preview heading and text-shadow code change instantly." },
  keywords: { ru: ["text-shadow", "тень текста", "неоновый текст css"], en: ["text-shadow", "text shadow css", "neon text css"] },
  props: { kind: "text", value: "0 2px 4px rgb(0 0 0 / 0.25)", color: "#111827" },
  howTo: {
    ru: ["Выберите слой и задайте смещение и размытие.", "Подберите цвет тени и цвет текста — эффекты вроде неона строятся из нескольких слоёв одного цвета.", "Скопируйте CSS или начните с готового эффекта из списка."],
    en: ["Pick a layer and set its offset and blur.", "Choose the shadow and text colors — effects like neon are built from several layers of one color.", "Copy the CSS or start from one of the effects below."],
  },
  faq: {
    ru: [
      { q: "Чем text-shadow отличается от box-shadow?", a: "text-shadow повторяет форму букв и не поддерживает растяжение и inset; box-shadow рисует тень от прямоугольника элемента." },
      { q: "Как сделать обводку текста?", a: "Четыре тени по 1 px во все стороны без размытия дают контур. Есть и -webkit-text-stroke, но он рисует обводку внутрь букв и в старых браузерах работает не везде." },
      { q: "Не замедлит ли много слоёв страницу?", a: "На статичном тексте — нет. Если текст анимируется, размытые слои пересчитываются на каждом кадре, поэтому держите их число небольшим." },
    ],
    en: [
      { q: "How is text-shadow different from box-shadow?", a: "text-shadow follows the letter shapes and has no spread or inset; box-shadow paints from the element's rectangle." },
      { q: "How do I outline text?", a: "Four unblurred 1px shadows in every direction make an outline. -webkit-text-stroke exists too, but it strokes inwards and isn't equally supported everywhere." },
      { q: "Will many layers slow the page down?", a: "Not on static text. If the text animates, blurred layers are repainted every frame, so keep their number small." },
    ],
  },
  about: {
    ru: [
      "text-shadow принимает список теней через запятую: смещение по X, по Y, размытие и цвет. Первый слой рисуется поверх остальных, поэтому свечение обычно строят от узкого к широкому.",
      "Редактор понимает вставленный код с любыми единицами и цветами, а эффекты из списка открываются с подобранными цветами текста и фона.",
    ],
    en: [
      "text-shadow takes a comma-separated list: X offset, Y offset, blur and color. The first layer is painted on top, so glows usually go from narrow to wide.",
      "The editor parses pasted code in any units and colors, and the effects below open with matching text and background colors.",
    ],
  },
  variants: { title: { ru: "Эффекты текста", en: "Text effects" }, list: textShadowVariants },
};

const BORDER_RADIUS: ToolDef = {
  slug: "border-radius-generator",
  component: "css/radius",
  icon: "SquareRoundCorner",
  wide: true,
  name: { ru: "Генератор border-radius", en: "Border-radius generator" },
  title: { ru: "Генератор border-radius — скругление углов CSS", en: "CSS border-radius generator — corners and blobs" },
  h1: { ru: "Генератор border-radius", en: "Border-radius generator" },
  description: {
    ru: "Скругление углов на CSS: общий радиус или каждый угол отдельно, эллиптические углы через /, единицы px, % и rem, плюс генератор органичных «блобов».",
    en: "Round corners in CSS: one radius or each corner separately, elliptical corners with /, px, % and rem units, plus a generator of organic blobs.",
  },
  lead: { ru: "Настройте углы — форма и код border-radius меняются сразу.", en: "Adjust the corners — the shape and border-radius code update instantly." },
  keywords: { ru: ["border-radius", "скругление углов css", "blob css"], en: ["border-radius", "rounded corners css", "css blob"] },
  props: { mode: "corners" },
  howTo: {
    ru: ["Задайте общий радиус или снимите «Одинаковые углы» и настройте каждый угол.", "Для эллиптических углов включите соответствующий режим — появятся отдельные радиусы по горизонтали и вертикали.", "В режиме «Блоб» нажимайте «Новая форма», пока не понравится, и копируйте код."],
    en: ["Set one radius, or untick “Same radius” and tune each corner.", "Turn on elliptical corners to get separate horizontal and vertical radii.", "In Blob mode press “New shape” until you like it, then copy the code."],
  },
  faq: {
    ru: [
      { q: "Как сделать круг или «таблетку»?", a: "Круг — border-radius: 50% у квадратного блока. Для кнопки-таблетки задайте радиус больше половины высоты, например 9999px: углы станут полукругами при любой ширине." },
      { q: "Что значит запись с косой чертой?", a: "Значения до / — горизонтальные радиусы углов, после — вертикальные. Так углы становятся эллиптическими, а из восьми значений получаются «блобы»." },
      { q: "Почему радиус в процентах выглядит по-разному?", a: "Проценты считаются от ширины для горизонтального радиуса и от высоты для вертикального, поэтому у прямоугольника 50% даёт эллипс, а не круг." },
    ],
    en: [
      { q: "How do I make a circle or a pill?", a: "A circle is border-radius: 50% on a square. For a pill button use a radius larger than half the height, e.g. 9999px — the ends stay semicircles at any width." },
      { q: "What does the slash syntax mean?", a: "Values before / are horizontal radii, values after it are vertical. That makes corners elliptical, and eight values produce blob shapes." },
      { q: "Why do percentage radii look different?", a: "Percentages refer to the width for horizontal radii and to the height for vertical ones, so 50% on a rectangle gives an ellipse, not a circle." },
    ],
  },
  about: {
    ru: [
      "border-radius принимает от одного до четырёх значений по часовой стрелке от левого верхнего угла, а после косой черты — ещё до четырёх вертикальных. Генератор записывает результат в самой короткой форме.",
      "Режим «Блоб» создаёт восемь процентов так, чтобы противоположные стороны давали в сумме 100 %: форма остаётся плавной и не ломается. Случайность берётся из криптографического генератора браузера.",
    ],
    en: [
      "border-radius takes one to four values clockwise from the top-left corner, and after a slash up to four vertical ones. The generator writes the result in its shortest form.",
      "Blob mode creates eight percentages where opposite sides add up to 100%, which keeps the shape smooth. Randomness comes from the browser's cryptographic generator.",
    ],
  },
  variants: {
    title: { ru: "Режимы", en: "Modes" },
    list: () => [
      {
        slug: "blob",
        name: { ru: "Блоб", en: "Blob" },
        title: { ru: "Генератор блобов на CSS — border-radius из 8 значений", en: "CSS blob generator — 8-value border-radius" },
        h1: { ru: "Генератор CSS-блобов", en: "CSS blob generator" },
        description: {
          ru: "Органичные формы-блобы без SVG: border-radius из восьми процентов через косую черту. Случайная форма одним нажатием, превью с градиентом и готовый код.",
          en: "Organic blob shapes without SVG: an eight-percentage border-radius with a slash. A random shape in one click, a gradient preview and ready code.",
        },
        lead: { ru: "border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; — блоб из восьми значений.", en: "border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; — a blob from eight values." },
        props: { mode: "blob" },
        blocks: (l: Locale): Block[] => [
          {
            type: "facts",
            title: l === "ru" ? "Как устроен блоб" : "How a blob works",
            rows: [
              [l === "ru" ? "Значений" : "Values", "8 (4 / 4)"],
              [l === "ru" ? "Правило" : "Rule", l === "ru" ? "противоположные стороны в сумме дают 100 %" : "opposite sides add up to 100%"],
              [l === "ru" ? "Анимация" : "Animation", l === "ru" ? "border-radius можно плавно анимировать через transition" : "border-radius animates smoothly with a transition"],
            ],
          },
        ],
        faq: {
          ru: [
            { q: "Как анимировать блоб?", a: "Задайте transition: border-radius 1s или @keyframes с несколькими наборами из восьми значений — браузер плавно переходит между формами." },
            { q: "Блоб или SVG?", a: "border-radius проще и легче, но даёт только выпуклые формы. Для вогнутых и сложных контуров используйте SVG или clip-path: path()." },
          ],
          en: [
            { q: "How do I animate a blob?", a: "Use transition: border-radius 1s or @keyframes with several eight-value sets — the browser morphs smoothly between them." },
            { q: "Blob or SVG?", a: "border-radius is simpler and lighter but only gives convex shapes. For concave or complex outlines use SVG or clip-path: path()." },
          ],
        },
      },
    ],
  },
};

const ANIMATION: ToolDef = {
  slug: "css-animation-generator",
  component: "css/animation",
  icon: "Clapperboard",
  popular: true,
  wide: true,
  name: { ru: "Генератор CSS-анимаций", en: "CSS animation generator" },
  title: { ru: "Генератор CSS-анимаций — keyframes онлайн", en: "CSS animation generator — keyframes with code" },
  h1: { ru: "Генератор CSS-анимаций", en: "CSS animation generator" },
  description: {
    ru: "20 готовых CSS-анимаций: fade, slide, zoom, bounce, shake, pulse, spin и другие. Своя длительность, cubic-bezier() и steps(), код с prefers-reduced-motion.",
    en: "20 ready CSS animations: fade, slide, zoom, bounce, shake, pulse, spin and more. Custom duration, cubic-bezier() and steps(), code with prefers-reduced-motion.",
  },
  lead: { ru: "Выберите анимацию и настройте её — код @keyframes готов сразу.", en: "Pick an animation and tune it — the @keyframes code is ready instantly." },
  keywords: { ru: ["css анимация", "keyframes", "анимация появления css"], en: ["css animation", "keyframes generator", "fade in css"] },
  props: { preset: "fade-in" },
  howTo: {
    ru: ["Выберите анимацию из списка — превью проиграет её.", "Задайте имя, длительность, задержку, повторы и функцию времени, включая свою cubic-bezier() или steps().", "Скопируйте CSS и добавьте класс нужному элементу."],
    en: ["Choose an animation from the list — the preview plays it.", "Set the name, duration, delay, iterations and timing function, including a custom cubic-bezier() or steps().", "Copy the CSS and add the class to your element."],
  },
  faq: {
    ru: [
      { q: "Зачем в коде блок prefers-reduced-motion?", a: "Часть людей включает в системе «Уменьшить движение» из-за укачивания, мигрени или вестибулярных нарушений. Блок @media (prefers-reduced-motion: reduce) отключает для них анимацию — это требование WCAG 2.3.3." },
      { q: "Почему превью не запускается само?", a: "Если в вашей системе включено «Уменьшить движение», превью уважает настройку и ждёт нажатия «Всё равно воспроизвести»." },
      { q: "Можно ли назвать анимацию по-своему?", a: "Да, имя задаётся полностью вами — генератор не добавляет никаких префиксов. Имя должно быть корректным идентификатором CSS: латиница, цифры, дефис, без цифры в начале." },
      { q: "Что анимировать, чтобы было плавно?", a: "transform и opacity — их браузер анимирует на видеокарте. Изменение width, top или margin вызывает перерасчёт раскладки на каждом кадре." },
    ],
    en: [
      { q: "Why is there a prefers-reduced-motion block?", a: "Some people turn on “Reduce motion” because of motion sickness, migraines or vestibular disorders. @media (prefers-reduced-motion: reduce) turns the animation off for them — WCAG 2.3.3 asks for this." },
      { q: "Why doesn't the preview start by itself?", a: "If your system has “Reduce motion” on, the preview respects it and waits for you to press “Play anyway”." },
      { q: "Can I use my own animation name?", a: "Yes, the name is entirely yours — no prefixes are added. It must be a valid CSS identifier: Latin letters, digits and hyphens, not starting with a digit." },
      { q: "What should I animate for smooth motion?", a: "transform and opacity — browsers animate them on the GPU. Changing width, top or margin forces a layout recalculation every frame." },
    ],
  },
  about: {
    ru: [
      "Каждая анимация — это @keyframes и класс с сокращённым свойством animation: имя, длительность, функция времени, задержка, число повторов, направление и fill-mode. Меняйте параметры — код пересобирается сразу.",
      "Анимации появления используют fill-mode: both, поэтому элемент не мигает до старта; бесконечные анимации вроде spin и pulse подходят для индикаторов загрузки.",
    ],
    en: [
      "Each animation is @keyframes plus a class with the animation shorthand: name, duration, timing function, delay, iteration count, direction and fill mode. Change any parameter and the code rebuilds instantly.",
      "Entrance animations use fill-mode: both so the element doesn't flash before starting; infinite ones like spin and pulse work as loading indicators.",
    ],
  },
  variants: { title: { ru: "Готовые анимации", en: "Animation presets" }, list: animationVariants },
};

const FLEXBOX: ToolDef = {
  slug: "flexbox-generator",
  seoAlt: { ru: ["генератор flexbox с кодом CSS", "flexbox-генератор", "CSS flexbox"], en: ["flexbox generator with CSS code", "flexbox generator", "CSS flexbox"] },
  component: "css/flexbox",
  icon: "Columns3",
  popular: true,
  wide: true,
  name: { ru: "Генератор flexbox", en: "Flexbox generator" },
  title: { ru: "Генератор flexbox онлайн — песочница с кодом", en: "Flexbox generator — playground with HTML and CSS" },
  h1: { ru: "Генератор flexbox", en: "Flexbox generator" },
  description: {
    ru: "Песочница flexbox: направление, перенос, justify-content, align-items, gap и настройки каждого элемента. Готовые HTML и CSS и 10 рецептов раскладок.",
    en: "A flexbox playground: direction, wrap, justify-content, align-items, gap and per-item settings. Ready HTML and CSS plus 10 layout recipes.",
  },
  lead: { ru: "Меняйте свойства контейнера и элементов — раскладка и код обновляются сразу.", en: "Change the container and item properties — the layout and code update instantly." },
  keywords: { ru: ["flexbox", "генератор flexbox", "flex css"], en: ["flexbox", "flexbox generator", "flexbox playground"] },
  howTo: {
    ru: ["Настройте контейнер: направление, перенос, выравнивание и отступ gap.", "Нажмите на элемент в превью, чтобы задать ему flex-grow, flex-shrink, flex-basis, order и align-self.", "Добавляйте и удаляйте элементы — в код попадают только свойства тех, что остались.", "Скопируйте HTML и CSS или начните с готового рецепта."],
    en: ["Set up the container: direction, wrap, alignment and gap.", "Click an item in the preview to set its flex-grow, flex-shrink, flex-basis, order and align-self.", "Add and remove items — only the remaining items' properties reach the code.", "Copy the HTML and CSS, or start from a recipe."],
  },
  faq: {
    ru: [
      { q: "Чем justify-content отличается от align-items?", a: "justify-content распределяет элементы вдоль главной оси (по умолчанию — горизонтали), align-items выравнивает их поперёк неё. При flex-direction: column оси меняются местами." },
      { q: "Что значит flex: 1?", a: "Это flex: 1 1 0%: элемент может расти и сжиматься, а стартовый размер — ноль. Несколько элементов с flex: 1 делят свободное место поровну." },
      { q: "Почему в код не попадают удалённые элементы?", a: "Настройки хранятся вместе с элементом и удаляются вместе с ним. В код выводятся только свойства, отличные от значений по умолчанию." },
    ],
    en: [
      { q: "How is justify-content different from align-items?", a: "justify-content distributes items along the main axis (horizontal by default); align-items aligns them across it. With flex-direction: column the axes swap." },
      { q: "What does flex: 1 mean?", a: "It is flex: 1 1 0%: the item can grow and shrink from a zero starting size. Several items with flex: 1 share the free space equally." },
      { q: "Why don't removed items show up in the code?", a: "Settings live with each item and are deleted with it. Only properties that differ from the defaults are written to the code." },
    ],
  },
  about: {
    ru: [
      "Flexbox раскладывает элементы в одну линию — строку или колонку — и распределяет между ними свободное место. Это основа навбаров, карточек, форм и центрирования.",
      "Генератор показывает раскладку вживую и выдаёт минимальный CSS: только свойства, отличающиеся от значений по умолчанию, и классы только для тех элементов, у которых есть свои настройки.",
    ],
    en: [
      "Flexbox lays items out in one line — a row or a column — and distributes free space between them. It powers navbars, cards, forms and centering.",
      "The generator shows the layout live and outputs minimal CSS: only non-default properties, and classes only for items that have their own settings.",
    ],
  },
  variants: { title: { ru: "Рецепты flexbox", en: "Flexbox recipes" }, list: flexVariants },
};

const GRID: ToolDef = {
  slug: "css-grid-generator",
  seoAlt: { ru: ["генератор CSS Grid с кодом", "генератор CSS Grid", "CSS Grid"], en: ["CSS Grid generator with code", "CSS Grid generator", "CSS Grid code"] },
  component: "css/grid",
  icon: "LayoutGrid",
  popular: true,
  wide: true,
  name: { ru: "Генератор CSS Grid", en: "CSS Grid generator" },
  title: { ru: "Генератор CSS Grid онлайн — grid-template-areas", en: "CSS Grid generator — template areas and code" },
  h1: { ru: "Генератор CSS Grid", en: "CSS Grid generator" },
  description: {
    ru: "Песочница CSS Grid: колонки, строки, gap, именованные области grid-template-areas с проверкой, размещение элементов и 11 готовых раскладок с HTML и CSS.",
    en: "A CSS Grid playground: columns, rows, gap, validated grid-template-areas, item placement and 11 ready layouts with HTML and CSS.",
  },
  lead: { ru: "Задайте колонки, строки и области — сетка и код обновляются сразу.", en: "Define columns, rows and areas — the grid and code update instantly." },
  keywords: { ru: ["css grid", "генератор grid", "grid-template-areas"], en: ["css grid generator", "grid-template-areas", "grid layout"] },
  howTo: {
    ru: ["Задайте grid-template-columns и grid-template-rows — например, repeat(3, 1fr) или 200px 1fr.", "Нарисуйте области: каждая строка текста — ряд сетки, одинаковые имена образуют область, точка — пустая ячейка.", "Выберите элемент в превью и назначьте ему область или grid-column / grid-row.", "Скопируйте HTML и CSS или откройте готовую раскладку."],
    en: ["Set grid-template-columns and grid-template-rows — e.g. repeat(3, 1fr) or 200px 1fr.", "Draw the areas: each text line is a grid row, repeated names form an area, a dot is an empty cell.", "Select an item in the preview and assign it an area or grid-column / grid-row.", "Copy the HTML and CSS or open a ready layout."],
  },
  faq: {
    ru: [
      { q: "Почему область в grid-template-areas не работает?", a: "Каждая область должна быть прямоугольником, а во всех строках — одинаковое число ячеек. Иначе браузер отбросит всё свойство; генератор подсвечивает такие ошибки." },
      { q: "Что такое fr?", a: "Доля свободного места: 1fr 2fr делит его в пропорции 1:2 после того, как учтены колонки фиксированной ширины." },
      { q: "auto-fit или auto-fill?", a: "Обе создают столько колонок, сколько помещается. auto-fit схлопывает пустые колонки, и элементы растягиваются; auto-fill оставляет пустые места." },
    ],
    en: [
      { q: "Why doesn't my grid-template-areas work?", a: "Each area must be a rectangle and every row must have the same number of cells; otherwise the browser drops the whole property. The generator highlights such errors." },
      { q: "What is fr?", a: "A fraction of the free space: 1fr 2fr splits it 1:2 after fixed-width columns are placed." },
      { q: "auto-fit or auto-fill?", a: "Both create as many columns as fit. auto-fit collapses empty columns so items stretch; auto-fill keeps the empty tracks." },
    ],
  },
  about: {
    ru: [
      "CSS Grid управляет сразу двумя осями — колонками и строками. Именованные области позволяют описать макет страницы наглядно, а на мобильных — просто переписать шаблон в медиазапросе.",
      "Генератор проверяет, что каждая область прямоугольная, и выдаёт только те свойства, которые отличаются от значений по умолчанию; настройки удалённых элементов в код не попадают.",
    ],
    en: [
      "CSS Grid controls two axes at once — columns and rows. Named areas describe a page layout visually, and on mobile you simply rewrite the template in a media query.",
      "The generator checks that every area is rectangular and outputs only non-default properties; settings of removed items never reach the code.",
    ],
  },
  variants: { title: { ru: "Готовые раскладки", en: "Layout recipes" }, list: gridVariants },
};

const CUBIC: ToolDef = {
  slug: "cubic-bezier-generator",
  component: "css/bezier",
  icon: "Spline",
  wide: true,
  name: { ru: "Редактор cubic-bezier", en: "Cubic-bezier editor" },
  title: { ru: "Cubic-bezier онлайн — редактор кривых анимации CSS", en: "Cubic-bezier generator — CSS easing curve editor" },
  h1: { ru: "Редактор cubic-bezier", en: "Cubic-bezier editor" },
  description: {
    ru: "Постройте кривую cubic-bezier() для transition и animation: две контрольные точки мышью или клавиатурой, 16 пресетов (ease, easeOutBack…) и сравнение с linear.",
    en: "Build a cubic-bezier() curve for transitions and animations: two control points by mouse or keyboard, 16 presets (ease, easeOutBack…) and a comparison with linear.",
  },
  lead: { ru: "Перетащите точки — значение cubic-bezier() и превью движения меняются сразу.", en: "Drag the points — the cubic-bezier() value and the motion preview change instantly." },
  keywords: { ru: ["cubic-bezier", "easing css", "кривая анимации"], en: ["cubic-bezier", "css easing", "easing generator"] },
  howTo: {
    ru: ["Перетащите контрольные точки или выберите их клавишей Tab и двигайте стрелками.", "Сравните движение с linear на двух дорожках ниже.", "Скопируйте значение cubic-bezier() в transition или animation."],
    en: ["Drag the control points, or Tab to them and move them with the arrow keys.", "Compare the motion with linear on the two tracks.", "Copy the cubic-bezier() value into a transition or animation."],
  },
  faq: {
    ru: [
      { q: "Почему y может быть меньше 0 или больше 1?", a: "Так получаются эффекты «отскока»: анимация ненадолго выходит за начальное или конечное значение. x должен оставаться в пределах 0–1, иначе функция некорректна." },
      { q: "Какие значения у ease, ease-in и ease-out?", a: "ease = cubic-bezier(0.25, 0.1, 0.25, 1), ease-in = (0.42, 0, 1, 1), ease-out = (0, 0, 0.58, 1), ease-in-out = (0.42, 0, 0.58, 1)." },
      { q: "Чем cubic-bezier отличается от steps()?", a: "cubic-bezier задаёт плавное ускорение и замедление, steps() — скачкообразную смену кадров, как в спрайтовой анимации или эффекте печати." },
    ],
    en: [
      { q: "Why can y go below 0 or above 1?", a: "That creates overshoot effects: the animation briefly passes its start or end value. x must stay within 0–1, otherwise the function is invalid." },
      { q: "What are ease, ease-in and ease-out?", a: "ease = cubic-bezier(0.25, 0.1, 0.25, 1), ease-in = (0.42, 0, 1, 1), ease-out = (0, 0, 0.58, 1), ease-in-out = (0.42, 0, 0.58, 1)." },
      { q: "How is cubic-bezier different from steps()?", a: "cubic-bezier gives smooth acceleration and deceleration; steps() jumps between frames, as in sprite animation or a typing effect." },
    ],
  },
  about: {
    ru: ["Функция cubic-bezier(x1, y1, x2, y2) задаёт кривую Безье с концами в (0, 0) и (1, 1): по горизонтали — время, по вертикали — прогресс анимации.", "Превью уважает системную настройку «Уменьшить движение»: в этом случае движение запускается только по кнопке."],
    en: ["cubic-bezier(x1, y1, x2, y2) defines a Bézier curve from (0, 0) to (1, 1): time runs horizontally and animation progress vertically.", "The preview respects the system “Reduce motion” setting: in that case the motion only starts when you press the button."],
  },
};

const CLIP: ToolDef = {
  slug: "clip-path-generator",
  component: "css/clip",
  icon: "Hexagon",
  wide: true,
  name: { ru: "Генератор clip-path", en: "Clip-path generator" },
  title: { ru: "Генератор clip-path онлайн — фигуры и polygon()", en: "CSS clip-path generator — shapes and polygon()" },
  h1: { ru: "Генератор clip-path", en: "Clip-path generator" },
  description: {
    ru: "Обрежьте элемент по фигуре: треугольник, шестиугольник, звезда, стрелка и ещё 11 форм. Редактор точек polygon() мышью и клавиатурой, circle(), ellipse(), inset().",
    en: "Clip an element to a shape: triangle, hexagon, star, arrow and 11 more. A polygon() point editor for mouse and keyboard, plus circle(), ellipse() and inset().",
  },
  lead: { ru: "Выберите фигуру и двигайте точки — код clip-path готов сразу.", en: "Pick a shape and move the points — the clip-path code is ready instantly." },
  keywords: { ru: ["clip-path", "обрезка css", "polygon css"], en: ["clip-path", "css shapes", "polygon generator"] },
  howTo: {
    ru: ["Выберите фигуру из списка.", "Перетащите вершины или выберите их клавишей Tab и двигайте стрелками; можно добавлять и удалять точки.", "Скопируйте clip-path и примените к картинке или блоку."],
    en: ["Choose a shape from the list.", "Drag the vertices or Tab to them and use the arrow keys; add and remove points as needed.", "Copy the clip-path and apply it to an image or block."],
  },
  faq: {
    ru: [
      { q: "Поддерживается ли clip-path в браузерах?", a: "Базовые фигуры polygon(), circle(), ellipse() и inset() работают во всех современных браузерах без префиксов." },
      { q: "Почему координаты в процентах?", a: "Проценты считаются от размеров элемента, поэтому фигура масштабируется вместе с ним и работает в адаптивной вёрстке." },
      { q: "Можно ли анимировать clip-path?", a: "Да, если у начальной и конечной фигуры одинаковое число точек polygon() — браузер плавно переместит каждую вершину." },
    ],
    en: [
      { q: "Is clip-path supported?", a: "The basic shapes polygon(), circle(), ellipse() and inset() work in all modern browsers without prefixes." },
      { q: "Why are the coordinates in percent?", a: "Percentages refer to the element's size, so the shape scales with it and works in responsive layouts." },
      { q: "Can clip-path be animated?", a: "Yes, when the start and end polygon() have the same number of points — the browser moves each vertex smoothly." },
    ],
  },
  about: {
    ru: ["clip-path показывает только часть элемента внутри фигуры; остальное скрыто и не реагирует на клики. В отличие от масок, фигура задаётся прямо в CSS.", "Полигоны задаются списком вершин в процентах, круг и эллипс — радиусом и центром, inset() — отступами от краёв и скруглением."],
    en: ["clip-path shows only the part of the element inside the shape; the rest is hidden and ignores clicks. Unlike masks, the shape is defined right in CSS.", "Polygons are lists of vertices in percent, circles and ellipses take a radius and center, inset() takes edge offsets and a rounding."],
  },
  variants: { title: { ru: "Фигуры clip-path", en: "Clip-path shapes" }, list: clipVariants },
};

const PX_REM: ToolDef = {
  slug: "px-to-rem",
  component: "css/pxrem",
  icon: "Ruler",
  popular: true,
  name: { ru: "Px в rem", en: "PX to REM" },
  title: { ru: "Px в rem — конвертер CSS-единиц онлайн", en: "PX to REM converter — CSS units online" },
  h1: { ru: "Конвертер px в rem", en: "PX to REM converter" },
  description: {
    ru: "Переведите пиксели в rem, em, pt, vw и % и обратно: 24px = 1.5rem при базовом шрифте 16px. Настраиваемый размер шрифта и ширина экрана, таблица значений.",
    en: "Convert pixels to rem, em, pt, vw and % and back: 24px = 1.5rem with a 16px root font. Adjustable font size and viewport width, plus a value table.",
  },
  lead: { ru: "При базовом шрифте 16px: 1rem = 16px, 24px = 1.5rem, 12pt = 16px.", en: "With a 16px root font: 1rem = 16px, 24px = 1.5rem, 12pt = 16px." },
  keywords: { ru: ["px в rem", "rem в px", "пиксели в rem", "конвертер единиц css"], en: ["px to rem", "rem to px", "css unit converter"] },
  props: { from: "px", to: "rem", value: 24 },
  howTo: {
    ru: ["Введите значение и выберите единицу — px, rem, em, pt, vw или %.", "Выберите, во что перевести: результат появится сразу и крупно.", "При необходимости поменяйте базовый размер шрифта, шрифт родителя и ширину экрана."],
    en: ["Enter a value and pick its unit — px, rem, em, pt, vw or %.", "Choose the target unit: the result appears instantly in large type.", "Change the root font size, parent font size and viewport width if needed."],
  },
  faq: {
    ru: [
      { q: "Сколько пикселей в 1rem?", a: "Столько, сколько размер шрифта элемента html. По умолчанию в браузерах это 16px, поэтому 1rem = 16px, но пользователь может увеличить его в настройках." },
      { q: "Чем rem отличается от em?", a: "rem считается от корневого шрифта (html), em — от шрифта родителя. Вложенные em накапливаются, rem — нет, поэтому для размеров шрифта чаще выбирают rem." },
      { q: "Почему лучше писать шрифты в rem, а не в px?", a: "Если пользователь увеличит базовый шрифт в браузере, размеры в rem вырастут вместе с ним, а в px останутся прежними. Это важно для доступности." },
      { q: "Сколько px в 1pt?", a: "1pt = 1/72 дюйма, а CSS-пиксель = 1/96 дюйма, поэтому 1pt = 1,333px, а 12pt = 16px." },
    ],
    en: [
      { q: "How many pixels is 1rem?", a: "The font size of the html element. Browsers default to 16px, so 1rem = 16px, but users can increase it in their settings." },
      { q: "How is rem different from em?", a: "rem refers to the root (html) font, em to the parent's font. Nested ems compound, rems don't, which is why rem is preferred for font sizes." },
      { q: "Why use rem instead of px for fonts?", a: "If a user increases the browser's base font, rem sizes grow with it while px sizes stay fixed. That matters for accessibility." },
      { q: "How many px is 1pt?", a: "1pt is 1/72 of an inch and a CSS pixel is 1/96, so 1pt = 1.333px and 12pt = 16px." },
    ],
  },
  about: {
    ru: ["Конвертер переводит значения между абсолютными (px, pt) и относительными (rem, em, %, vw) единицами CSS. Относительные зависят от контекста, поэтому базовый шрифт, шрифт родителя и ширину экрана можно задать.", "Ниже — таблица самых ходовых размеров при базовом шрифте 16px."],
    en: ["The converter translates values between absolute (px, pt) and relative (rem, em, %, vw) CSS units. Relative units depend on context, so you can set the root font, the parent font and the viewport width.", "Below is a table of the most common sizes with a 16px root font."],
  },
  blocks: (l) => [
    {
      type: "table",
      title: l === "ru" ? "Px в rem при базовом шрифте 16px" : "PX to REM with a 16px root font",
      head: ["px", "rem", "pt"],
      rows: [1, 2, 4, 8, 10, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 30, 32, 36, 40, 48, 56, 64, 72, 80, 96].map((px) => [`${px}px`, `${Math.round(convertUnit(px, "px", "rem") * 10000) / 10000}rem`, `${Math.round(convertUnit(px, "px", "pt") * 100) / 100}pt`]),
      mono: true,
    },
  ],
};

const CLAMP: ToolDef = {
  slug: "css-clamp-generator",
  component: "css/clamp",
  icon: "MoveHorizontal",
  name: { ru: "Генератор clamp()", en: "Clamp() generator" },
  title: { ru: "Генератор clamp() — адаптивный размер шрифта CSS", en: "CSS clamp() generator — fluid typography" },
  h1: { ru: "Генератор clamp() для адаптивной типографики", en: "Fluid typography clamp() generator" },
  description: {
    ru: "Плавный размер шрифта без медиазапросов: задайте размеры на узком и широком экране и получите clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem) с превью и таблицей.",
    en: "Fluid font size without media queries: set the size on narrow and wide screens and get clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem) with a preview and a table.",
  },
  lead: { ru: "16px на экране 360px и 24px на 1280px = clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem).", en: "16px at 360px and 24px at 1280px = clamp(1rem, 0.8043rem + 0.8696vw, 1.5rem)." },
  keywords: { ru: ["clamp css", "адаптивный шрифт", "fluid typography"], en: ["css clamp", "fluid typography", "clamp calculator"] },
  howTo: {
    ru: ["Введите размер шрифта на узком и на широком экране.", "Укажите ширины этих экранов — например, 360 и 1280 пикселей.", "Скопируйте clamp() и проверьте размер на разных ширинах ползунком и в таблице."],
    en: ["Enter the font size for a narrow and a wide screen.", "Set those screen widths — e.g. 360 and 1280 pixels.", "Copy the clamp() and check the size at different widths with the slider and table."],
  },
  faq: {
    ru: [
      { q: "Как работает clamp()?", a: "clamp(MIN, ЖЕЛАЕМОЕ, MAX) возвращает желаемое значение, но не меньше MIN и не больше MAX. Желаемое — линейная функция ширины экрана: rem + vw." },
      { q: "Зачем в формуле rem, а не только vw?", a: "Чистые vw не реагируют на масштабирование страницы, и текст нельзя увеличить. Слагаемое в rem сохраняет эту возможность, что важно для WCAG 1.4.4." },
      { q: "Можно ли так же задавать отступы?", a: "Да, clamp() работает для любых длин: padding, gap, margin — формула та же." },
    ],
    en: [
      { q: "How does clamp() work?", a: "clamp(MIN, PREFERRED, MAX) returns the preferred value but never below MIN or above MAX. The preferred value is a linear function of the viewport: rem + vw." },
      { q: "Why rem in the formula, not just vw?", a: "Pure vw ignores page zoom, so text can't be enlarged. The rem term keeps zoom working, which WCAG 1.4.4 requires." },
      { q: "Can I use it for spacing too?", a: "Yes, clamp() works for any length: padding, gap, margin — same formula." },
    ],
  },
  about: {
    ru: ["Генератор решает линейное уравнение: наклон = (макс. размер − мин. размер) / (широкий экран − узкий экран), а свободный член переводится в rem. Результат — одна строка CSS вместо набора медиазапросов.", "Превью показывает, каким будет размер на выбранной ширине, а таблица — значения на типичных экранах от 360 до 1920 пикселей."],
    en: ["The generator solves a linear equation: slope = (max size − min size) / (wide screen − narrow screen), with the intercept converted to rem. The result is one line of CSS instead of several media queries.", "The preview shows the size at the chosen width, and the table lists typical screens from 360 to 1920 pixels."],
  },
};

const TRIANGLE: ToolDef = {
  slug: "css-triangle-generator",
  component: "css/triangle",
  icon: "Triangle",
  name: { ru: "Треугольник на CSS", en: "CSS triangle generator" },
  title: { ru: "Треугольник на CSS — генератор кода border и clip-path", en: "CSS triangle generator — border and clip-path code" },
  h1: { ru: "Генератор CSS-треугольников", en: "CSS triangle generator" },
  description: {
    ru: "Треугольник на чистом CSS в 8 направлениях: классический способ через border и современный через clip-path. Размеры, цвет и готовый код для стрелок и подсказок.",
    en: "A pure-CSS triangle in 8 directions: the classic border technique and the modern clip-path way. Size, color and ready code for arrows and tooltips.",
  },
  lead: { ru: "Выберите направление, размер и цвет — код треугольника готов сразу.", en: "Choose the direction, size and color — the triangle code is ready instantly." },
  keywords: { ru: ["треугольник css", "стрелка css", "border triangle"], en: ["css triangle", "css arrow", "tooltip arrow"] },
  howTo: {
    ru: ["Выберите направление стрелкой.", "Задайте ширину, высоту и цвет.", "Скопируйте код: через border — для старых браузеров и псевдоэлементов, через clip-path — если нужны градиент или картинка внутри."],
    en: ["Pick a direction with the arrow buttons.", "Set the width, height and color.", "Copy the code: borders for old browsers and pseudo-elements, clip-path if you need a gradient or image inside."],
  },
  faq: {
    ru: [
      { q: "Как работает треугольник через border?", a: "У элемента нулевого размера рамки сходятся под углом. Если три стороны сделать прозрачными, а одну — цветной, остаётся треугольник." },
      { q: "Как сделать стрелку у подсказки?", a: "Добавьте тултипу ::after с кодом треугольника, position: absolute и сдвиньте его за край, например top: 100% для стрелки вниз." },
      { q: "Какой способ лучше?", a: "clip-path проще читать и позволяет заливать фигуру градиентом; border-техника работает даже в очень старых браузерах и в псевдоэлементах без размеров." },
    ],
    en: [
      { q: "How does the border triangle work?", a: "On a zero-size element the borders meet at an angle. Make three sides transparent and one colored, and a triangle remains." },
      { q: "How do I add an arrow to a tooltip?", a: "Give the tooltip an ::after with the triangle code and position: absolute, then move it past the edge, e.g. top: 100% for a down arrow." },
      { q: "Which technique is better?", a: "clip-path is easier to read and can be filled with a gradient; the border trick works even in very old browsers and in size-less pseudo-elements." },
    ],
  },
  about: {
    ru: ["Генератор выдаёт оба варианта кода: классический треугольник из рамок и прямоугольник, обрезанный clip-path: polygon(). Размеры указываются в пикселях, цвет — в любом формате CSS."],
    en: ["The generator outputs both versions: the classic border triangle and a rectangle clipped with clip-path: polygon(). Sizes are in pixels, the color in any CSS format."],
  },
};

const GLASS: ToolDef = {
  slug: "glassmorphism-generator",
  component: "css/glass",
  icon: "GlassWater",
  name: { ru: "Генератор glassmorphism", en: "Glassmorphism generator" },
  title: { ru: "Генератор glassmorphism — эффект стекла CSS", en: "Glassmorphism generator — CSS frosted glass" },
  h1: { ru: "Генератор эффекта стекла (glassmorphism)", en: "Glassmorphism CSS generator" },
  description: {
    ru: "Эффект матового стекла на CSS: размытие backdrop-filter, прозрачность и цвет подложки, насыщенность, рамка и тень. Код с -webkit- для Safari и запасной фон.",
    en: "Frosted glass in CSS: backdrop-filter blur, tint color and opacity, saturation, border and shadow. Code with the -webkit- line for Safari and a fallback background.",
  },
  lead: { ru: "Двигайте ползунки — карточка на цветном фоне и CSS меняются сразу.", en: "Move the sliders — the card on a colorful background and the CSS change instantly." },
  keywords: { ru: ["glassmorphism", "эффект стекла css", "backdrop-filter"], en: ["glassmorphism", "frosted glass css", "backdrop-filter"] },
  howTo: {
    ru: ["Настройте размытие фона и непрозрачность подложки — это основа эффекта.", "Добавьте насыщенность, рамку, скругление и тень.", "Скопируйте CSS: он включает строку для старого Safari и фон на случай, если backdrop-filter не поддерживается."],
    en: ["Tune the background blur and tint opacity — they create the effect.", "Add saturation, a border, rounding and a shadow.", "Copy the CSS: it includes a line for older Safari and a fallback background for browsers without backdrop-filter."],
  },
  faq: {
    ru: [
      { q: "Зачем строка -webkit-backdrop-filter?", a: "Safari до версии 18 понимал свойство только с префиксом. Современные Chrome, Firefox и Safari 18+ поддерживают backdrop-filter без него." },
      { q: "Почему эффект не виден?", a: "Стекло размывает то, что находится позади элемента. На однотонном фоне размытие незаметно — нужен контрастный или пёстрый фон." },
      { q: "Не пострадает ли читаемость текста?", a: "Может: проверьте контраст текста с самой светлой и самой тёмной частью фона. Увеличьте непрозрачность подложки, если контраст ниже 4,5:1." },
    ],
    en: [
      { q: "Why the -webkit-backdrop-filter line?", a: "Safari before version 18 only understood the prefixed property. Current Chrome, Firefox and Safari 18+ support backdrop-filter without it." },
      { q: "Why can't I see the effect?", a: "Glass blurs what is behind the element. On a plain background the blur is invisible — you need a contrasting or busy backdrop." },
      { q: "Will text stay readable?", a: "It may not: check text contrast against the lightest and darkest parts of the backdrop, and raise the tint opacity if it drops below 4.5:1." },
    ],
  },
  about: {
    ru: ["Glassmorphism — полупрозрачная подложка плюс backdrop-filter: blur(), который размывает содержимое позади элемента. Лёгкая светлая рамка и тень подчёркивают край «стекла».", "Код содержит блок @supports not (…) с более плотным фоном: если браузер не умеет размывать, текст останется читаемым."],
    en: ["Glassmorphism is a translucent tint plus backdrop-filter: blur(), which blurs whatever is behind the element. A light border and a shadow emphasize the glass edge.", "The code includes an @supports not (…) block with a denser background, so text stays readable where blurring isn't supported."],
  },
};

const SPECIFICITY: ToolDef = {
  slug: "css-specificity-calculator",
  component: "css/specificity",
  icon: "Scale",
  name: { ru: "Калькулятор специфичности", en: "Specificity calculator" },
  title: { ru: "Калькулятор специфичности CSS-селекторов онлайн", en: "CSS specificity calculator — compare selectors" },
  h1: { ru: "Калькулятор специфичности CSS", en: "CSS specificity calculator" },
  description: {
    ru: "Посчитайте специфичность селекторов по Selectors Level 4: (a, b, c) с разбором по частям, :is(), :not(), :has(), :where() и nth-child(… of S). Сравнение списка.",
    en: "Calculate selector specificity per Selectors Level 4: (a, b, c) with a part-by-part breakdown, :is(), :not(), :has(), :where() and nth-child(… of S). Compare a list.",
  },
  lead: { ru: "#nav .menu > li:hover a = (1, 2, 2): один ID, два класса-псевдокласса, два тега.", en: "#nav .menu > li:hover a = (1, 2, 2): one ID, two classes/pseudo-classes, two types." },
  keywords: { ru: ["специфичность css", "specificity", "вес селектора"], en: ["css specificity", "specificity calculator", "selector weight"] },
  howTo: {
    ru: ["Введите селекторы — по одному на строку или через запятую; можно вставить CSS с правилами.", "Посмотрите (a, b, c) и разбор каждого селектора по частям.", "Победитель подсвечен: при равной специфичности побеждает правило, объявленное позже."],
    en: ["Enter selectors — one per line or comma-separated; pasted CSS rules work too.", "See (a, b, c) and each selector's breakdown.", "The winner is highlighted: with equal specificity the rule declared later wins."],
  },
  faq: {
    ru: [
      { q: "Как считается специфичность?", a: "a — число ID, b — классов, атрибутов и псевдоклассов, c — тегов и псевдоэлементов. Сравнение идёт слева направо: один ID сильнее любого числа классов." },
      { q: "Как считаются :is(), :not() и :has()?", a: "Они берут специфичность самого «тяжёлого» аргумента: :is(#a, .b) = (1, 0, 0). А :where() всегда даёт ноль — удобно для сбросов и библиотек." },
      { q: "Что сильнее специфичности?", a: "Порядок каскада: !important, каскадные слои (@layer) и стили в атрибуте style. Специфичность сравнивается только между правилами одного уровня." },
    ],
    en: [
      { q: "How is specificity calculated?", a: "a counts IDs, b classes, attributes and pseudo-classes, c types and pseudo-elements. They compare left to right: one ID beats any number of classes." },
      { q: "How do :is(), :not() and :has() count?", a: "They take the specificity of their most specific argument: :is(#a, .b) = (1, 0, 0). :where() always counts zero — handy for resets and libraries." },
      { q: "What beats specificity?", a: "The cascade order: !important, cascade layers (@layer) and inline style attributes. Specificity only compares rules at the same level." },
    ],
  },
  about: {
    ru: ["Калькулятор разбирает селектор по правилам Selectors Level 4: учитывает :is(), :not(), :has(), :where(), :nth-child(An+B of S), ::slotted(), пространства имён и экранированные символы; комбинаторы и * не влияют на вес.", "Старые псевдоэлементы с одним двоеточием (:before, :after, :first-line, :first-letter) считаются как псевдоэлементы, как и в браузерах."],
    en: ["The calculator parses selectors per Selectors Level 4: it handles :is(), :not(), :has(), :where(), :nth-child(An+B of S), ::slotted(), namespaces and escaped characters; combinators and * add no weight.", "Legacy single-colon pseudo-elements (:before, :after, :first-line, :first-letter) count as pseudo-elements, just as browsers treat them."],
  },
};

const base = defineToolSection({
  id: "css",
  name: { ru: "CSS-генераторы", en: "CSS generators" },
  description: {
    ru: "Тени, анимации, flexbox, grid, clip-path и другие CSS-генераторы с готовым кодом",
    en: "Shadows, animations, flexbox, grid, clip-path and other CSS generators with ready code",
  },
  title: { ru: "CSS-генераторы онлайн — тени, анимации, flexbox, grid", en: "CSS generators — shadows, animations, flexbox and grid" },
  h1: { ru: "CSS-генераторы", en: "CSS generators" },
  hubDescription: {
    ru: "13 CSS-генераторов в браузере: box-shadow, text-shadow, анимации, flexbox, grid, clip-path, clamp(), px в rem, cubic-bezier и специфичность — с живым превью и кодом.",
    en: "13 CSS generators: box-shadow, text-shadow, animations, flexbox, grid, clip-path, clamp(), px to rem, cubic-bezier and specificity, with live preview and code.",
  },
  icon: "Paintbrush",
  hue: 270,
  category: "design",
  order: 2,
  tools: [BOX_SHADOW, FLEXBOX, GRID, ANIMATION, PX_REM, TEXT_SHADOW, BORDER_RADIUS, CLIP, CUBIC, CLAMP, GLASS, TRIANGLE, SPECIFICITY],
  hubBlocks: (l) => [
    {
      type: "links",
      title: l === "ru" ? "Цвета для CSS" : "Colors for CSS",
      style: "cards",
      items: [
        { path: ["css-gradient-generator"], label: l === "ru" ? "Генератор CSS-градиентов" : "CSS gradient generator", hint: l === "ru" ? "linear, radial и conic с кодом" : "linear, radial and conic with code", icon: "Blend", hue: 330 },
        { path: ["color-picker"], label: l === "ru" ? "Палитра цветов" : "Color picker", hint: l === "ru" ? "HEX, RGB, HSL и OKLCH" : "HEX, RGB, HSL and OKLCH", icon: "Pipette", hue: 330 },
        { path: ["contrast-checker"], label: l === "ru" ? "Проверка контраста" : "Contrast checker", hint: "WCAG 2.2 · APCA", icon: "Contrast", hue: 330 },
      ],
    },
  ],
});

/** Recipe labels inside the playground preview follow the page language. */
export const cssSection: SectionDef = {
  ...base,
  resolve(locale, segs) {
    const page = base.resolve(locale, segs);
    if (page?.kind === "variant" && page.tool && segs.length === 2) {
      if (segs[0] === "flexbox-generator") page.tool = { ...page.tool, props: localizeFlexProps(segs[1], locale) };
      if (segs[0] === "css-grid-generator") page.tool = { ...page.tool, props: localizeGridProps(segs[1], locale) };
    }
    return page;
  },
};
