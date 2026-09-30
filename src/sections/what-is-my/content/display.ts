import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { ToolDef } from "@/registry/types";
import { aspectRatio, breakpointTable, logicalDpi, ppiFromDiagonal, RESOLUTIONS } from "../lib/screen";

const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);
const n = (locale: Locale, x: number, d = 0) => formatNumber(locale, x, { maximumFractionDigits: d });
const pct = (locale: Locale, x: number) => `${n(locale, x)}${locale === "ru" ? " %" : "%"}`;

const SCALES = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];

export const screenResolution: ToolDef = {
  slug: "screen-resolution",
  related: ["screen-resolutions", "aspect-ratio-calculator", "ppi-calculator"],
  component: "what-is-my/screen-resolution",
  icon: "Monitor",
  popular: true,
  name: { ru: "Разрешение экрана", en: "Screen resolution" },
  title: { ru: "Разрешение экрана онлайн — узнать разрешение монитора", en: "What is my screen resolution? Check it online" },
  h1: { ru: "Какое у меня разрешение экрана", en: "What is my screen resolution?" },
  description: {
    ru: "Реальное разрешение экрана в физических пикселях с учётом масштаба Windows и Retina: 1920×1080, 2560×1440, 3840×2160. Плюс DPR и соотношение сторон.",
    en: "Your real screen resolution in physical pixels, accounting for Windows scaling and Retina: 1920×1080, 2560×1440, 3840×2160. Plus DPR and aspect ratio.",
  },
  lead: {
    ru: "Показываем физическое разрешение матрицы, а не «логическое», которое искажает масштабирование.",
    en: "We show the panel's physical resolution, not the “logical” one distorted by display scaling.",
  },
  keywords: {
    ru: ["разрешение монитора", "узнать разрешение экрана", "размер экрана в пикселях", "dpr", "масштаб экрана"],
    en: ["monitor resolution", "screen size in pixels", "display resolution", "device pixel ratio", "4k or 1080p"],
  },
  howTo: {
    ru: [
      "Откройте страницу на экране, который хотите проверить; при нескольких мониторах перетащите окно на нужный.",
      "Сбросьте масштаб страницы: Ctrl+0 (⌘+0 на Mac), иначе браузер исказит Device Pixel Ratio.",
      "Вверху — физическое разрешение и его название (Full HD, QHD, 4K UHD), ниже — CSS-разрешение и масштаб системы.",
      "Нажмите «Копировать», чтобы получить значение вида 3840x2160.",
    ],
    en: [
      "Open the page on the screen you want to check; with several monitors, drag the window onto the right one.",
      "Reset page zoom with Ctrl+0 (⌘+0 on a Mac) — otherwise the browser distorts the Device Pixel Ratio.",
      "The top shows the physical resolution and its name (Full HD, QHD, 4K UHD); below are the CSS resolution and system scaling.",
      "Click Copy to get a value like 3840x2160.",
    ],
  },
  about: {
    ru: [
      "Браузер сообщает размер экрана в CSS-пикселях — это физическое разрешение, делённое на масштаб системы (Device Pixel Ratio). 4K-монитор 3840×2160 с масштабом 150 % в Windows выглядит для сайтов как 2560×1440, поэтому многие сервисы ошибочно называют такой экран QHD.",
      "Инструмент умножает CSS-размер на DPR и сверяет результат с известными разрешениями: при дробном масштабе вроде 175 % браузер отдаёт размер целым числом, и произведение может отличаться на пиксель. Название (Full HD, QHD, 4K UHD) даётся по физическим пикселям.",
      "Доступная область — экран без панели задач Windows или Dock и строки меню macOS. Глубина цвета 24 бита означает 16,7 млн оттенков; 30 бит браузер обычно сообщает в HDR-режиме.",
    ],
    en: [
      "Browsers report the screen size in CSS pixels: the physical resolution divided by the system scale (Device Pixel Ratio). A 3840×2160 4K monitor at 150% Windows scaling looks like 2560×1440 to websites, which is why many services wrongly call it QHD.",
      "This tool multiplies the CSS size by the DPR and matches the result against known resolutions: with fractional scaling such as 175% the browser rounds the size to whole pixels, so the product can be a pixel off. The name (Full HD, QHD, 4K UHD) is based on physical pixels.",
      "The available area is the screen minus the Windows taskbar or the macOS Dock and menu bar. A 24-bit color depth means 16.7 million colors; browsers usually report 30 bits in HDR mode.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему здесь другое разрешение, чем на других сайтах?",
        a: "Большинство сайтов показывают screen.width × screen.height — размер в CSS-пикселях. При масштабе 125–200 % он меньше реального. Мы умножаем его на Device Pixel Ratio и получаем физические пиксели матрицы.",
      },
      {
        q: "Как посмотреть разрешение в Windows?",
        a: "«Параметры → Система → Дисплей» — строка «Разрешение экрана». Там же «Масштаб»: 150 % означает Device Pixel Ratio 1,5.",
      },
      {
        q: "Почему на Mac получилось больше родного разрешения?",
        a: "В режимах «Больше места» macOS рисует рабочий стол в увеличенном размере и уменьшает его до матрицы. Браузер видит именно этот рабочий стол, поэтому результат может превышать родное разрешение. Родное указано в характеристиках модели и в «Информации о системе» → «Графика/Мониторы».",
      },
      {
        q: "Что такое Device Pixel Ratio?",
        a: "Сколько физических пикселей приходится на один CSS-пиксель: 1 — обычный монитор без масштабирования, 2 — Retina и многие телефоны, 3 — флагманские смартфоны. Масштаб страницы в браузере тоже меняет это число.",
      },
      {
        q: "Разрешение экрана и размер окна — одно и то же?",
        a: "Нет. Разрешение — весь экран, а размер окна (viewport) — видимая область страницы внутри браузера; её показывает отдельный инструмент.",
      },
    ],
    en: [
      {
        q: "Why is the resolution here different from other sites?",
        a: "Most sites show screen.width × screen.height, which is the size in CSS pixels. At 125–200% scaling it's smaller than the real one. We multiply it by the Device Pixel Ratio to get the panel's physical pixels.",
      },
      {
        q: "How do I check the resolution in Windows?",
        a: "Settings → System → Display → Display resolution. The Scale setting is there too: 150% means a Device Pixel Ratio of 1.5.",
      },
      {
        q: "Why is the result on my Mac higher than the native resolution?",
        a: "In “More Space” modes macOS renders the desktop larger and scales it down to the panel. The browser sees that larger desktop, so the result can exceed the native resolution. The native one is in the model specs and in System Information → Graphics/Displays.",
      },
      {
        q: "What is the Device Pixel Ratio?",
        a: "How many physical pixels make up one CSS pixel: 1 for a regular unscaled monitor, 2 for Retina and many phones, 3 for flagship smartphones. Browser page zoom changes it too.",
      },
      {
        q: "Is screen resolution the same as window size?",
        a: "No. The resolution covers the whole screen; the window size (viewport) is the visible page area inside the browser — there's a separate tool for it.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Как 4K-экран 3840×2160 выглядит для сайтов при масштабе", "How a 3840×2160 4K screen looks to websites at each scale"),
      head: L(locale, ["Масштаб Windows", "Device Pixel Ratio", "Браузер сообщает"], ["Windows scale", "Device Pixel Ratio", "Browser reports"]),
      rows: SCALES.slice(0, 5).map((d) => [pct(locale, d * 100), n(locale, d, 2), `${Math.round(3840 / d)} × ${Math.round(2160 / d)}`]),
    },
    {
      type: "table",
      title: L(locale, "Названия разрешений", "Resolution names"),
      head: L(locale, ["Название", "Пиксели", "Соотношение", "Мегапиксели"], ["Name", "Pixels", "Aspect ratio", "Megapixels"]),
      rows: [...RESOLUTIONS].reverse().map((r) => {
        const ar = aspectRatio(r.w, r.h);
        return [r.alias && !r.alias.includes(":") ? `${r.name} (${r.alias})` : r.name, `${r.w} × ${r.h}`, ar.common ?? ar.exact, n(locale, (r.w * r.h) / 1e6, 1)];
      }),
    },
  ],
};

export const viewport: ToolDef = {
  slug: "viewport-size",
  related: ["screen-resolutions", "aspect-ratio-calculator"],
  component: "what-is-my/viewport",
  icon: "AppWindow",
  name: { ru: "Размер окна браузера", en: "Viewport size" },
  title: { ru: "Размер окна браузера онлайн — viewport в пикселях", en: "Viewport size — what is my browser window size?" },
  h1: { ru: "Размер окна браузера", en: "What is my viewport size?" },
  description: {
    ru: "Размер окна браузера в CSS-пикселях: innerWidth × innerHeight, область без полос прокрутки и брейкпоинты Tailwind и Bootstrap. Обновляется вживую.",
    en: "Your browser window size in CSS pixels: innerWidth × innerHeight, the area without scrollbars and Tailwind/Bootstrap breakpoints. Updates live as you resize.",
  },
  lead: {
    ru: "Размер видимой области страницы в CSS-пикселях — меняется, пока вы тянете окно.",
    en: "The visible page area in CSS pixels — it changes as you resize the window.",
  },
  keywords: {
    ru: ["viewport", "размер окна", "ширина окна браузера", "брейкпоинт", "innerwidth"],
    en: ["viewport", "window size", "browser width", "breakpoint", "innerwidth"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху ширина и высота окна в CSS-пикселях.",
      "Потяните край окна или поверните телефон — значения обновятся сразу.",
      "Ниже — активные брейкпоинты Tailwind CSS и Bootstrap: удобно при вёрстке адаптивных сайтов.",
      "Скопируйте размер в формате 1280x720 кнопкой «Копировать».",
    ],
    en: [
      "Open the page — the window width and height in CSS pixels are at the top.",
      "Drag the window edge or rotate your phone — the values update instantly.",
      "Below are the active Tailwind CSS and Bootstrap breakpoints — handy for responsive layouts.",
      "Click Copy to get the size as 1280x720.",
    ],
  },
  about: {
    ru: [
      "Viewport — область, в которой браузер показывает страницу. Её ширина window.innerWidth включает полосу прокрутки, а document.documentElement.clientWidth — нет; разница равна ширине полосы (обычно 15–17 px в Windows и 0 на Mac и телефонах с «плавающими» полосами).",
      "На телефонах есть ещё visual viewport — часть страницы, видимая при увеличении щипком; её масштаб показан отдельно. Медиазапросы CSS вроде @media (min-width: 768px) и брейкпоинты фреймворков считаются по innerWidth.",
    ],
    en: [
      "The viewport is the area where the browser shows the page. Its width window.innerWidth includes the scrollbar, document.documentElement.clientWidth doesn't; the difference is the scrollbar width (usually 15–17 px on Windows and 0 on Macs and phones with overlay scrollbars).",
      "Phones also have a visual viewport — the part of the page visible when you pinch-zoom; its scale is shown separately. CSS media queries such as @media (min-width: 768px) and framework breakpoints use innerWidth.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Чем размер окна отличается от разрешения экрана?",
        a: "Разрешение — весь экран, а viewport — только область страницы внутри окна: без вкладок, адресной строки и панели задач. Если окно не развёрнуто, viewport ещё меньше.",
      },
      {
        q: "Почему ширина окна на телефоне 390 или 412, а не 1080?",
        a: "Размеры указаны в CSS-пикселях. На телефоне с Device Pixel Ratio 2,625–3 один CSS-пиксель — это несколько физических: 412 × 2,625 ≈ 1080.",
      },
      {
        q: "Какие брейкпоинты у Tailwind и Bootstrap?",
        a: "Tailwind CSS: sm — 640, md — 768, lg — 1024, xl — 1280, 2xl — 1536 px. Bootstrap 5: sm — 576, md — 768, lg — 992, xl — 1200, xxl — 1400 px. Брейкпоинт активен, когда ширина окна не меньше указанной.",
      },
      {
        q: "Меняется ли viewport при масштабировании страницы?",
        a: "Да: при увеличении страницы до 200 % ширина в CSS-пикселях уменьшается вдвое, поэтому сайт может переключиться на мобильную раскладку.",
      },
    ],
    en: [
      {
        q: "How is window size different from screen resolution?",
        a: "The resolution is the whole screen; the viewport is only the page area inside the window — without tabs, the address bar or the taskbar. If the window isn't maximised, the viewport is even smaller.",
      },
      {
        q: "Why is my phone's width 390 or 412 instead of 1080?",
        a: "Sizes are in CSS pixels. On a phone with a Device Pixel Ratio of 2.625–3, one CSS pixel is several physical ones: 412 × 2.625 ≈ 1080.",
      },
      {
        q: "What are the Tailwind and Bootstrap breakpoints?",
        a: "Tailwind CSS: sm 640, md 768, lg 1024, xl 1280, 2xl 1536 px. Bootstrap 5: sm 576, md 768, lg 992, xl 1200, xxl 1400 px. A breakpoint is active when the window is at least that wide.",
      },
      {
        q: "Does zooming the page change the viewport?",
        a: "Yes: at 200% zoom the width in CSS pixels halves, so a site may switch to its mobile layout.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Брейкпоинты популярных CSS-фреймворков", "Breakpoints of popular CSS frameworks"),
      head: L(locale, ["Фреймворк", "Брейкпоинт", "Минимальная ширина"], ["Framework", "Breakpoint", "Min width"]),
      rows: [
        ...[...breakpointTable("tailwind")].reverse().map(([k, w]) => ["Tailwind CSS", k, `${w} px`]),
        ...[...breakpointTable("bootstrap")].reverse().map(([k, w]) => ["Bootstrap 5", k, `${w} px`]),
      ],
    },
  ],
};

const PPI_SAMPLES: [number, number, number, { ru: string; en: string }][] = [
  [1920, 1080, 24, { ru: "монитор", en: "monitor" }],
  [2560, 1440, 27, { ru: "монитор", en: "monitor" }],
  [3840, 2160, 27, { ru: "монитор", en: "monitor" }],
  [3840, 2160, 32, { ru: "монитор", en: "monitor" }],
  [3440, 1440, 34, { ru: "ультраширокий монитор", en: "ultrawide monitor" }],
  [1920, 1080, 15.6, { ru: "ноутбук", en: "laptop" }],
  [2560, 1600, 14, { ru: "ноутбук", en: "laptop" }],
  [1170, 2532, 6.1, { ru: "смартфон", en: "smartphone" }],
];

export const dpi: ToolDef = {
  slug: "screen-dpi",
  related: ["screen-calibration", "ppi-calculator", "online-ruler"],
  component: "what-is-my/dpi",
  icon: "Ruler",
  name: { ru: "DPI и PPI экрана", en: "Screen DPI / PPI" },
  title: { ru: "DPI экрана онлайн — узнать PPI и плотность пикселей", en: "What is my screen DPI? Calculate pixel density (PPI)" },
  h1: { ru: "Какой DPI у моего экрана", en: "What is my screen DPI?" },
  description: {
    ru: "Логический DPI (96 × масштаб) и физический PPI по калибровке или диагонали: 24″ Full HD — 92 PPI, 27″ 4K — 163 PPI. Введите диагональ — PPI посчитается сразу.",
    en: "Logical DPI (96 × scaling) and physical PPI from calibration or diagonal: 24″ Full HD is 92 PPI, 27″ 4K is 163 PPI. Enter a diagonal to get the density.",
  },
  lead: {
    ru: "Браузер знает только логический DPI; настоящую плотность пикселей дают калибровка или диагональ экрана.",
    en: "The browser only knows the logical DPI; the real pixel density comes from calibration or the screen diagonal.",
  },
  keywords: {
    ru: ["ppi экрана", "плотность пикселей", "dpi монитора", "пикселей на дюйм", "калькулятор ppi"],
    en: ["screen ppi", "pixel density", "monitor dpi", "pixels per inch", "ppi calculator"],
  },
  howTo: {
    ru: [
      "Посмотрите логический DPI вверху: это 96 × масштаб системы (150 % = 144 dpi).",
      "Введите диагональ экрана в дюймах — PPI посчитается по физическому разрешению.",
      "Для точного результата без знания диагонали откалибруйте экран банковской картой в инструменте «Реальный размер» — PPI и диагональ появятся здесь автоматически.",
      "Скопируйте результат кнопкой «Копировать».",
    ],
    en: [
      "Check the logical DPI at the top: it's 96 × the system scale (150% = 144 dpi).",
      "Enter the screen diagonal in inches — PPI is calculated from the physical resolution.",
      "For an exact result without knowing the diagonal, calibrate the screen with a bank card in the Actual size tool — PPI and the diagonal then appear here automatically.",
      "Click Copy to copy the result.",
    ],
  },
  about: {
    ru: [
      "DPI (dots per inch) и PPI (pixels per inch) для экранов означают одно — сколько пикселей помещается в дюйме. Физическую плотность браузер не знает: CSS считает, что в дюйме 96 пикселей, а Device Pixel Ratio говорит лишь, во сколько раз система увеличила интерфейс. Поэтому «96 × DPR» — логический DPI, по которому Windows масштабирует интерфейс, а не свойство матрицы.",
      "Настоящий PPI считается как √(ширина² + высота²) / диагональ: у 27-дюймового монитора 2560×1440 это 109 PPI, у 4K на 27″ — 163. Если вы уже откалибровали экран в инструменте «Реальный размер» на этом сайте, страница возьмёт сохранённый масштаб и посчитает PPI и диагональ без ввода.",
    ],
    en: [
      "For screens, DPI (dots per inch) and PPI (pixels per inch) mean the same thing: how many pixels fit in an inch. The browser doesn't know the physical density: CSS assumes 96 pixels per inch, and the Device Pixel Ratio only says how much the system enlarged the interface. So “96 × DPR” is the logical DPI Windows uses for scaling, not a property of the panel.",
      "Real PPI is √(width² + height²) / diagonal: 109 PPI for a 27-inch 2560×1440 monitor, 163 for 4K at 27″. If you've already calibrated the screen in this site's Actual size tool, the page reads the saved scale and calculates PPI and the diagonal without any input.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Чем DPI отличается от PPI?",
        a: "PPI — плотность пикселей экрана, DPI — точки печати у принтера или чувствительность мыши. Про экраны говорят и так и так, имея в виду PPI.",
      },
      {
        q: "Почему браузер показывает 96 или 144 dpi?",
        a: "Это логические значения: 96 dpi — масштаб 100 %, 120 — 125 %, 144 — 150 %, 192 — 200 %. Они описывают настройку системы, а не экран.",
      },
      {
        q: "Какой PPI считается хорошим?",
        a: "С расстояния 60–70 см пиксели монитора почти не заметны начиная примерно со 110 PPI; ноутбуки смотрят ближе, им нужно 140–160 и больше. У Retina-экранов Mac около 220 PPI, у iPhone — 326 и выше.",
      },
      {
        q: "Как измерить PPI, если диагональ неизвестна?",
        a: "Откалибруйте экран: приложите к нему банковскую карту (85,6 мм) в инструменте «Реальный размер» и подгоните рамку. Масштаб сохранится в браузере, и здесь появится физический PPI.",
      },
    ],
    en: [
      {
        q: "What's the difference between DPI and PPI?",
        a: "PPI is a screen's pixel density; DPI is printer dots or mouse sensitivity. People use both for screens, meaning PPI.",
      },
      {
        q: "Why does the browser say 96 or 144 dpi?",
        a: "Those are logical values: 96 dpi is 100% scaling, 120 is 125%, 144 is 150%, 192 is 200%. They describe the system setting, not the screen.",
      },
      {
        q: "What PPI is good?",
        a: "From 60–70 cm away, monitor pixels become hard to see from about 110 PPI; laptops are viewed closer and need 140–160 or more. Retina Mac displays are about 220 PPI, iPhones 326 and up.",
      },
      {
        q: "How do I measure PPI without knowing the diagonal?",
        a: "Calibrate the screen: hold a bank card (85.6 mm) against it in the Actual size tool and match the frame. The scale is saved in your browser and the physical PPI appears here.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Логический DPI при масштабе системы", "Logical DPI at each system scale"),
      head: L(locale, ["Масштаб", "Device Pixel Ratio", "Логический DPI"], ["Scale", "Device Pixel Ratio", "Logical DPI"]),
      rows: SCALES.map((d) => [pct(locale, d * 100), n(locale, d, 2), n(locale, logicalDpi(d))]),
    },
    {
      type: "table",
      title: L(locale, "Плотность пикселей популярных экранов", "Pixel density of popular screens"),
      head: L(locale, ["Экран", "Разрешение", "Диагональ", "PPI"], ["Screen", "Resolution", "Diagonal", "PPI"]),
      rows: PPI_SAMPLES.map(([w, h, d, kind]) => [kind[locale], `${w} × ${h}`, `${n(locale, d, 1)}″`, n(locale, ppiFromDiagonal(w, h, d))]),
    },
  ],
};
