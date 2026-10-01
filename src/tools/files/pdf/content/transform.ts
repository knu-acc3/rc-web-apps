import type { Locale } from "@/i18n/config";
import type { ToolDef, VariantDef } from "@/registry/types";
import { PAPER, ptToMm, type PaperId } from "../lib/geometry";
import { faq, PRIVACY, PRIVACY_QA } from "./shared";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);
const mm = (pt: number) => Math.round(ptToMm(pt));

/* ───────────── mirror ───────────── */

export const flipTool: ToolDef = {
  slug: "flip-pdf",
  component: "pdf/transform",
  icon: "FlipVertical2",
  props: { kind: "flip", axis: "h" },
  name: { ru: "Отразить PDF", en: "Flip PDF" },
  title: { ru: "Отразить PDF зеркально онлайн | зеркальное отображение страниц", en: "Flip PDF Online — Mirror PDF Pages" },
  h1: { ru: "Отразить PDF зеркально", en: "Flip a PDF (mirror image)" },
  description: {
    ru: "Зеркальное отражение страниц PDF слева направо или сверху вниз — для печати на термотрансферной бумаге, плёнке и стекле. Текст остаётся текстом, качество то же.",
    en: "Mirror PDF pages left to right or top to bottom — for printing on iron-on transfer paper, film or glass. Text stays text and quality isn't lost.",
  },
  lead: { ru: "Страницы отразятся как в зеркале. Предпросмотр покажет результат до сохранения.", en: "Pages are mirrored. The preview shows the result before you save." },
  keywords: { ru: ["зеркальное отражение pdf", "отзеркалить pdf", "перевернуть pdf зеркально", "зеркально отобразить pdf"], en: ["mirror pdf", "flip pdf horizontally", "reverse image pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "Выберите направление: слева направо или сверху вниз; при необходимости укажите страницы.", "Проверьте предпросмотр и нажмите «Отразить PDF»."],
    en: ["Open a PDF file.", "Choose the direction: left to right or top to bottom; set pages if needed.", "Check the preview and press Mirror PDF."],
  },
  about: {
    ru: [
      "Зеркальная печать нужна для термопереноса на футболки и кружки, печати на прозрачной плёнке, которую клеят изнутри стекла, и для фотошаблонов плат. Страница отражается целиком, вместе с текстом, картинками и векторной графикой.",
      "Отражение делается преобразованием координат, а не перерисовкой, поэтому качество остаётся исходным, а размер файла почти не меняется.",
      PRIVACY.ru,
    ],
    en: [
      "Mirror printing is used for iron-on transfers on T-shirts and mugs, film stuck inside glass and PCB photo masks. The whole page is mirrored — text, images and vector graphics.",
      "Mirroring is a coordinate transform rather than a redraw, so quality stays original and the file size barely changes.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Чем отражение отличается от поворота?", a: "Поворот разворачивает страницу на 90° или 180°, а текст остаётся читаемым. Отражение меняет лево и право местами — текст читается только в зеркале." },
      { q: "Можно ли отразить только одну страницу?", a: "Да, укажите её номер в поле «Страницы», например «3» или «2-4». Остальные страницы останутся как были." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How is flipping different from rotating?", a: "Rotation turns a page by 90° or 180° and text stays readable. Flipping swaps left and right — text reads correctly only in a mirror." },
      { q: "Can I flip just one page?", a: "Yes, type its number in the Pages field, e.g. “3” or “2-4”. Other pages stay as they were." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["rotate-pdf", "organize-pdf", "crop-pdf"],
  variants: {
    title: { ru: "Направление", en: "Direction" },
    list: (): VariantDef[] => [
      {
        slug: "vertical",
        name: { ru: "Сверху вниз", en: "Vertically" },
        title: { ru: "Отразить PDF по вертикали | перевернуть страницы сверху вниз", en: "Flip PDF Vertically — Mirror Pages Top to Bottom" },
        h1: { ru: "Отразить PDF по вертикали", en: "Flip a PDF vertically" },
        description: {
          ru: "Отражение страниц PDF сверху вниз: верх страницы становится низом, как отражение в воде. Для печати на плёнке и особых макетов; текст остаётся текстом.",
          en: "Mirror PDF pages top to bottom: the top becomes the bottom, like a reflection in water. For film printing and special layouts; text stays text.",
        },
        lead: { ru: "Верх и низ страницы поменяются местами, лево и право — нет.", en: "Top and bottom swap; left and right stay." },
        props: { kind: "flip", axis: "v" },
        blocks: (l) => [
          {
            type: "facts",
            title: tt(l, "Отражение и поворот", "Flip versus rotate"),
            rows: [
              [tt(l, "Отразить сверху вниз", "Flip vertically"), tt(l, "верх ↔ низ, текст зеркальный", "top ↔ bottom, text mirrored")],
              [tt(l, "Повернуть на 180°", "Rotate 180°"), tt(l, "верх ↔ низ и лево ↔ право, текст вверх ногами", "top ↔ bottom and left ↔ right, text upside down")],
              [tt(l, "Отразить + повернуть на 180°", "Flip + rotate 180°"), tt(l, "то же, что отражение слева направо", "same as flipping left to right")],
            ],
          },
        ],
      },
    ],
  },
};

/* ───────────── colours ───────────── */

export const grayscaleTool: ToolDef = {
  slug: "grayscale-pdf",
  component: "pdf/transform",
  icon: "Contrast",
  props: { kind: "gray" },
  name: { ru: "PDF в чёрно-белый", en: "Grayscale PDF" },
  title: { ru: "Сделать PDF чёрно-белым онлайн | перевести PDF в оттенки серого", en: "Grayscale PDF Online — Convert PDF to Black and White" },
  h1: { ru: "Сделать PDF чёрно-белым", en: "Convert a PDF to grayscale" },
  description: {
    ru: "Переведите цветной PDF в оттенки серого для печати на чёрно-белом принтере или экономии цветных чернил. Текст остаётся текстом, файл почти не растёт.",
    en: "Convert a colour PDF to grayscale to print on a black-and-white printer or save colour ink. Text stays text and the file barely grows.",
  },
  lead: { ru: "Все цвета станут оттенками серого той же яркости. Предпросмотр покажет результат.", en: "Every colour becomes a grey of the same lightness. The preview shows the result." },
  keywords: { ru: ["pdf в черно белый", "pdf в оттенки серого", "обесцветить pdf", "черно-белый pdf"], en: ["pdf to black and white", "grayscale pdf", "remove color from pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "При необходимости укажите страницы — по умолчанию обработаются все.", "Нажмите «Сделать чёрно-белым» и скачайте файл."],
    en: ["Open a PDF file.", "Set pages if needed — all pages are processed by default.", "Press Make black and white and download the file."],
  },
  about: {
    ru: [
      "Цвет убирается наложением режима смешивания «Насыщенность» поверх страницы: каждый пиксель сохраняет яркость, но теряет цвет. Страница не превращается в картинку, поэтому текст можно выделять и искать, а размер файла почти не меняется.",
      "Такой файл одинаково выглядит в Adobe Acrobat, браузерах и на принтере. Если нужна именно растровая копия, переведите PDF в JPG.",
      PRIVACY.ru,
    ],
    en: [
      "Colour is removed with a Saturation blend overlay: every pixel keeps its lightness but loses its colour. The page isn't turned into an image, so text stays selectable and searchable and the file size barely changes.",
      "The file looks the same in Adobe Acrobat, browsers and on a printer. If you need a raster copy, convert the PDF to JPG instead.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Станет ли файл меньше?", a: "Почти нет: изображения остаются внутри файла, меняется только отображение. Чтобы уменьшить размер, сожмите PDF отдельно." },
      { q: "Сохранятся ли ссылки и закладки?", a: "Да, документ меняется на месте: ссылки, оглавление и поля форм остаются." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Will the file get smaller?", a: "Hardly: images stay in the file and only how they're shown changes. Compress the PDF separately to reduce its size." },
      { q: "Are links and bookmarks kept?", a: "Yes, the document is changed in place: links, the outline and form fields remain." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["invert-pdf", "compress-pdf", "pdf-to-jpg"],
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Как цвета становятся серыми", "How colours turn grey"),
      head: [tt(l, "Цвет", "Colour"), tt(l, "Яркость серого", "Grey lightness")],
      rows: (
        [
          ["#ff0000", tt(l, "Красный", "Red"), [255, 0, 0]],
          ["#00a000", tt(l, "Зелёный", "Green"), [0, 160, 0]],
          ["#0000ff", tt(l, "Синий", "Blue"), [0, 0, 255]],
          ["#ffd800", tt(l, "Жёлтый", "Yellow"), [255, 216, 0]],
        ] as [string, string, [number, number, number]][]
      ).map(([hex, name, [r, g, b]]) => [`${name} ${hex}`, `${Math.round((0.3 * r + 0.59 * g + 0.11 * b) / 2.55)} %`]),
    },
  ],
};

export const invertTool: ToolDef = {
  slug: "invert-pdf",
  component: "pdf/transform",
  icon: "SunMoon",
  props: { kind: "invert" },
  name: { ru: "Инвертировать цвета PDF", en: "Invert PDF colours" },
  title: { ru: "Инвертировать цвета PDF онлайн | тёмный режим для PDF", en: "Invert PDF Colors Online — Dark Mode PDF" },
  h1: { ru: "Инвертировать цвета PDF", en: "Invert PDF colours" },
  description: {
    ru: "Инверсия цветов PDF: белый фон станет чёрным, чёрный текст — белым. Удобно читать документы ночью и на OLED-экранах. Текст остаётся текстом.",
    en: "Invert PDF colours: the white background turns black and black text white. Easier reading at night and on OLED screens. Text stays text.",
  },
  lead: { ru: "Получится «ночная» версия документа: светлый текст на тёмном фоне.", en: "You get a night version of the document: light text on a dark background." },
  keywords: { ru: ["инвертировать pdf", "темный pdf", "негатив pdf", "черный фон pdf"], en: ["invert pdf", "dark mode pdf", "negative pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "При необходимости укажите страницы.", "Нажмите «Инвертировать цвета» и скачайте файл."],
    en: ["Open a PDF file.", "Set pages if needed.", "Press Invert colours and download the file."],
  },
  about: {
    ru: [
      "Цвета переворачиваются наложением режима «Разница» с белым цветом: белый становится чёрным, жёлтый — синим, красный — бирюзовым. Текст остаётся векторным и выделяемым.",
      "Для печати такой файл не годится — он израсходует много тонера. Чтобы вернуть обычный вид, инвертируйте файл ещё раз.",
      PRIVACY.ru,
    ],
    en: [
      "Colours are flipped with a Difference blend overlay in white: white becomes black, yellow blue and red cyan. Text stays vector and selectable.",
      "Don't print such a file — it would use a lot of toner. Invert it again to get the normal look back.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как вернуть исходные цвета?", a: "Инвертируйте получившийся файл ещё раз — двойная инверсия возвращает исходные цвета." },
      { q: "Почему фотографии выглядят как негатив?", a: "Инверсия меняет все цвета, включая фотографии. Если нужно затемнить только фон, лучше включить тёмную тему в программе для чтения PDF." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I get the original colours back?", a: "Invert the result again — a double inversion restores the original colours." },
      { q: "Why do photos look like negatives?", a: "Inversion changes every colour, photos included. To darken only the background, use the dark theme of your PDF reader instead." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["grayscale-pdf", "pdf-to-jpg", "flip-pdf"],
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Во что превращаются цвета", "What colours become"),
      head: [tt(l, "Было", "Before"), tt(l, "Стало", "After")],
      rows: [
        [tt(l, "Белый #ffffff", "White #ffffff"), tt(l, "Чёрный #000000", "Black #000000")],
        [tt(l, "Красный #ff0000", "Red #ff0000"), tt(l, "Бирюзовый #00ffff", "Cyan #00ffff")],
        [tt(l, "Жёлтый #ffff00", "Yellow #ffff00"), tt(l, "Синий #0000ff", "Blue #0000ff")],
        [tt(l, "Серый #808080", "Grey #808080"), tt(l, "Серый #7f7f7f", "Grey #7f7f7f")],
      ],
    },
  ],
};

/* ───────────── crop ───────────── */

export const cropTool: ToolDef = {
  slug: "crop-pdf",
  component: "pdf/transform",
  icon: "Crop",
  props: { kind: "crop" },
  name: { ru: "Обрезать PDF", en: "Crop PDF" },
  title: { ru: "Обрезать PDF онлайн | убрать белые поля в PDF", en: "Crop PDF Online — Trim White Margins" },
  h1: { ru: "Обрезать PDF онлайн", en: "Crop PDF online" },
  description: {
    ru: "Обрежьте поля страниц PDF: задайте отступы в миллиметрах или уберите белые поля автоматически. Удобно для чтения на телефоне и электронной книге.",
    en: "Crop the margins of PDF pages: set them in millimetres or trim white margins automatically. Handy for reading on a phone or e-reader.",
  },
  lead: { ru: "Укажите, сколько отрезать с каждого края, или нажмите «Обрезать белые поля».", en: "Set how much to cut from each edge, or press Trim white margins." },
  keywords: { ru: ["обрезать pdf", "обрезать поля pdf", "убрать поля pdf", "кадрировать pdf"], en: ["crop pdf", "trim pdf margins", "remove white margins pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "Задайте поля в миллиметрах или нажмите «Обрезать белые поля» — каждая страница обрежется по своему содержимому.", "Проверьте предпросмотр и нажмите «Обрезать PDF»."],
    en: ["Open a PDF file.", "Set the margins in millimetres or press Trim white margins — each page is trimmed to its own content.", "Check the preview and press Crop PDF."],
  },
  about: {
    ru: [
      "Обрезка меняет видимую область страницы: всё, что за её пределами, не показывается и не печатается. Содержимое страницы не удаляется, поэтому при необходимости область можно расширить обратно в любом редакторе PDF.",
      "Автоматический режим рисует каждую страницу и находит прямоугольник, где есть хоть что-то, кроме белого, а затем добавляет небольшой отступ.",
      PRIVACY.ru,
    ],
    en: [
      "Cropping changes the visible area of the page: anything outside it isn't shown or printed. The content isn't deleted, so the area can be enlarged again in any PDF editor.",
      "Automatic mode renders each page, finds the rectangle with anything other than white and adds a small padding.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Уменьшится ли размер файла?", a: "Нет: обрезанная часть скрывается, но остаётся в файле. Чтобы уменьшить размер, сожмите PDF." },
      { q: "Можно ли обрезать только некоторые страницы?", a: "Да, укажите их в поле «Страницы», например «1, 3-5»." },
      { q: "Как обрезать PDF для электронной книги?", a: "Нажмите «Обрезать белые поля»: текст займёт весь экран и станет крупнее." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Will the file get smaller?", a: "No: the cut-off part is hidden but stays in the file. Compress the PDF to reduce its size." },
      { q: "Can I crop only some pages?", a: "Yes, list them in the Pages field, e.g. “1, 3-5”." },
      { q: "How do I crop a PDF for an e-reader?", a: "Press Trim white margins: text fills the screen and looks bigger." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["resize-pdf", "n-up-pdf", "compress-pdf"],
  blocks: (l) => [
    {
      type: "facts",
      title: tt(l, "Поля стандартных документов", "Margins of standard documents"),
      rows:
        l === "ru"
          ? [
              ["ГОСТ Р 7.0.97 (деловые письма)", "слева 20 мм, справа 10 мм, сверху и снизу 20 мм"],
              ["Курсовые и дипломы (обычно)", "слева 30 мм, справа 10–15 мм, сверху и снизу 20 мм"],
              ["Word по умолчанию", "слева 30 мм, справа 15 мм, сверху и снизу 20 мм"],
            ]
          : [
              ["US Letter (Word default)", "1 inch (25.4 mm) on every side"],
              ["A4 (Word default, Europe)", "25.4 mm on every side"],
              ["Academic papers (APA)", "1 inch (25.4 mm) on every side"],
            ],
    },
  ],
};

/* ───────────── resize ───────────── */

const RESIZE: { paper: PaperId; ru: string; en: string }[] = [
  { paper: "a5", ru: "A5", en: "A5" },
  { paper: "a3", ru: "A3", en: "A3" },
];

const paperRows = (l: Locale): [string, string][] =>
  (Object.keys(PAPER) as PaperId[]).map((p) => [p.length === 2 ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1), `${mm(PAPER[p][0])} × ${mm(PAPER[p][1])} ${tt(l, "мм", "mm")}`]);

export const resizeTool: ToolDef = {
  slug: "resize-pdf",
  component: "pdf/transform",
  icon: "Maximize2",
  props: { kind: "resize", paper: "a4" },
  name: { ru: "Изменить размер страниц PDF", en: "Resize PDF pages" },
  title: { ru: "Изменить размер страниц PDF | привести PDF к формату A4", en: "Resize PDF Pages Online — Convert PDF to A4" },
  h1: { ru: "Изменить размер страниц PDF", en: "Resize PDF pages" },
  description: {
    ru: "Приведите все страницы PDF к одному формату: A4, A5, A3, Letter или Legal. Содержимое аккуратно вписывается в лист с полями, текст остаётся текстом.",
    en: "Make every PDF page the same size: A4, A5, A3, Letter or Legal. Content is fitted neatly onto the sheet with margins; text stays text.",
  },
  lead: { ru: "Страницы любых размеров станут одного формата — удобно печатать и отправлять.", en: "Pages of any size become one format — easy to print and send." },
  keywords: { ru: ["изменить размер pdf", "pdf в а4", "привести pdf к а4", "масштабировать pdf", "размер страницы pdf"], en: ["resize pdf", "pdf to a4", "scale pdf pages", "change pdf page size"] },
  howTo: {
    ru: ["Откройте PDF-файл.", "Выберите формат листа, ориентацию и поля.", "Нажмите «Изменить размер» и скачайте файл."],
    en: ["Open a PDF file.", "Choose the paper size, orientation and margins.", "Press Resize pages and download the file."],
  },
  about: {
    ru: [
      "Каждая страница масштабируется так, чтобы целиком поместиться на новый лист, и выравнивается по центру. Пропорции не искажаются. Если выключить «Вписать содержимое», меняется только размер листа, а содержимое остаётся в натуральную величину.",
      "Ориентация «Как у страницы» сохраняет альбомные страницы альбомными, а книжные — книжными.",
      PRIVACY.ru,
    ],
    en: [
      "Each page is scaled to fit the new sheet entirely and centred. Proportions are kept. Turn off Fit the content to change only the sheet size and keep the content at actual size.",
      "Orientation “Same as page” keeps landscape pages landscape and portrait pages portrait.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Почему PDF печатается не на весь лист?", a: "Скорее всего, страницы в файле другого формата, например Letter. Приведите их к A4 — и принтер не будет добавлять поля или обрезать края." },
      { q: "Станет ли текст размытым?", a: "Нет. Масштабирование векторное: текст и линии остаются чёткими при любом размере." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Why doesn't my PDF print on the whole sheet?", a: "The pages are probably another size, such as A4 on a Letter printer. Resize them to your paper and the printer won't add margins or cut edges." },
      { q: "Will text get blurry?", a: "No. Scaling is vector-based: text and lines stay sharp at any size." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["crop-pdf", "n-up-pdf", "paper-sizes"],
  blocks: (l) => [{ type: "facts", title: tt(l, "Размеры листов", "Paper sizes"), rows: paperRows(l) }],
  variants: {
    title: { ru: "Форматы", en: "Formats" },
    list: (): VariantDef[] =>
      RESIZE.map((r) => ({
        slug: r.paper,
        name: { ru: `В формат ${r.ru}`, en: `To ${r.en}` },
        title: { ru: `PDF в формат ${r.ru} онлайн | изменить размер страниц на ${r.ru}`, en: `Resize PDF to ${r.en} Online — Change Page Size to ${r.en}` },
        h1: { ru: `Привести PDF к формату ${r.ru}`, en: `Resize a PDF to ${r.en}` },
        description: {
          ru: `Все страницы PDF станут формата ${r.ru} (${mm(PAPER[r.paper][0])} × ${mm(PAPER[r.paper][1])} мм): содержимое впишется в лист с сохранением пропорций, текст останется текстом.`,
          en: `Every page of your PDF becomes ${r.en} (${mm(PAPER[r.paper][0])} × ${mm(PAPER[r.paper][1])} mm): content is fitted onto the sheet with its proportions kept, and text stays text.`,
        },
        lead: { ru: `Страницы любых размеров станут листами ${r.ru}.`, en: `Pages of any size become ${r.en} sheets.` },
        props: { kind: "resize", paper: r.paper },
        blocks: (l) => [
          {
            type: "facts",
            title: tt(l, `Формат ${r.ru}`, `${r.en} format`),
            rows: [
              [tt(l, "Размер", "Size"), `${mm(PAPER[r.paper][0])} × ${mm(PAPER[r.paper][1])} ${tt(l, "мм", "mm")}`],
              [tt(l, "В пунктах", "In points"), `${Math.round(PAPER[r.paper][0])} × ${Math.round(PAPER[r.paper][1])} pt`],
              [tt(l, "Масштаб с A4", "Scale from A4"), `${Math.round((PAPER[r.paper][0] / PAPER.a4[0]) * 100)} %`],
            ],
          },
        ],
      })),
  },
};

/* ───────────── page order ───────────── */

export const reverseTool: ToolDef = {
  slug: "reverse-pdf",
  component: "pdf/pages",
  icon: "ArrowDownUp",
  props: { mode: "reverse" },
  name: { ru: "Обратный порядок страниц PDF", en: "Reverse PDF pages" },
  title: { ru: "Перевернуть порядок страниц PDF | страницы в обратном порядке", en: "Reverse PDF Page Order Online — Last Page First" },
  h1: { ru: "Обратный порядок страниц PDF", en: "Reverse the page order of a PDF" },
  description: {
    ru: "Переставьте страницы PDF в обратном порядке одним нажатием: последняя станет первой. Нужно после сканирования стопки снизу вверх и для печати.",
    en: "Reverse PDF pages in one click: the last page becomes the first. Useful after scanning a stack bottom-up and for printing.",
  },
  lead: { ru: "Откройте файл — страницы сразу покажутся в обратном порядке. Останется сохранить.", en: "Open the file — pages appear in reverse order right away. Then just save." },
  keywords: { ru: ["обратный порядок страниц pdf", "перевернуть порядок страниц pdf", "развернуть pdf"], en: ["reverse pdf", "reverse page order pdf", "flip page order"] },
  howTo: {
    ru: ["Откройте PDF-файл — миниатюры появятся в обратном порядке.", "Нажмите «Сохранить в обратном порядке».", "Скачайте файл."],
    en: ["Open a PDF file — thumbnails appear in reverse order.", "Press Save in reverse order.", "Download the file."],
  },
  about: {
    ru: [
      "Сканер с автоподатчиком часто выдаёт страницы с конца, а при ручной двусторонней печати вторую сторону нужно печатать в обратном порядке. Здесь это делается за секунду, без пересжатия: страницы копируются как есть.",
      "Чтобы переставить страницы вручную, откройте «Упорядочить страницы PDF».",
      PRIVACY.ru,
    ],
    en: [
      "Scanners with document feeders often produce pages from the end, and manual double-sided printing needs the back sides reversed. Here it takes a second with no re-compression: pages are copied as is.",
      "To arrange pages by hand, open Organize PDF pages.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Сохранятся ли закладки и ссылки?", a: "Ссылки на страницы внутри документа сохраняются. Оглавление (закладки) в новый файл не переносится." },
      { q: "Как распечатать PDF в обратном порядке?", a: "Сохраните файл в обратном порядке и печатайте как обычно: первым выйдет последний лист, и стопка соберётся по порядку лицом вверх." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Are bookmarks and links kept?", a: "Links to pages inside the document are kept. The outline (bookmarks) isn't copied to the new file." },
      { q: "How do I print a PDF in reverse order?", a: "Save the file reversed and print as usual: the last sheet comes out first and the stack ends up in order, face up." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["organize-pdf", "split-pdf/even-pages", "remove-blank-pages-pdf"],
};

export const blankPagesTool: ToolDef = {
  slug: "remove-blank-pages-pdf",
  component: "pdf/pages",
  icon: "FileX2",
  props: { mode: "blank" },
  name: { ru: "Удалить пустые страницы из PDF", en: "Remove blank pages from PDF" },
  title: { ru: "Удалить пустые страницы из PDF онлайн | найти белые листы", en: "Remove Blank Pages from PDF Online — Find Empty Pages" },
  h1: { ru: "Удалить пустые страницы из PDF", en: "Remove blank pages from a PDF" },
  description: {
    ru: "Найдите и удалите пустые страницы PDF автоматически: белые листы после двустороннего сканирования, пустые развороты. Перед удалением можно проверить каждую.",
    en: "Find and remove blank PDF pages automatically: white sheets after duplex scanning, empty spreads. Check each one before removing.",
  },
  lead: { ru: "Откройте файл — пустые страницы отметятся сами. Проверьте и удалите.", en: "Open the file — blank pages get marked automatically. Check and remove them." },
  keywords: { ru: ["удалить пустые страницы pdf", "убрать пустые листы pdf", "пустые страницы в pdf"], en: ["remove blank pages pdf", "delete empty pages pdf"] },
  howTo: {
    ru: ["Откройте PDF-файл и дождитесь проверки страниц.", "Пустые страницы будут отмечены. Нажмите на страницу, чтобы оставить или убрать её; для сканов выберите «Скан с пятнами».", "Нажмите «Удалить пустые» и скачайте файл."],
    en: ["Open a PDF file and wait for the pages to be checked.", "Blank pages are marked. Tap a page to keep or remove it; for scans choose Scan with specks.", "Press Remove blank and download the file."],
  },
  about: {
    ru: [
      "Каждая страница рисуется в уменьшенном виде, и считается доля тёмных точек. Совсем белая страница — это 0 %, номер страницы или колонтитул дают десятые доли процента, а скан пустого листа с пылью — до процента.",
      "Найденные страницы только отмечаются: вы видите миниатюры и решаете сами. Остальные страницы копируются без пересжатия.",
      PRIVACY.ru,
    ],
    en: [
      "Each page is rendered small and the share of dark pixels is measured. A pure white page is 0%, a page number or header adds a few tenths of a percent, and a scan of an empty sheet with dust reaches about one percent.",
      "Found pages are only marked: you see the thumbnails and decide. The other pages are copied without re-compression.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Удалится ли страница с номером внизу?", a: "В режимах «Почти белую» и «Скан с пятнами» — да, если кроме номера на ней ничего нет. В режиме «Совсем белую» удаляются только полностью белые страницы." },
      { q: "Почему не нашлась пустая страница скана?", a: "Сканы часто имеют серый фон или тень от края листа. Выберите «Скан с пятнами» или отметьте страницу вручную." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Is a page with just a page number removed?", a: "With Nearly white and Scan with specks, yes, if there's nothing else on it. Pure white removes only completely white pages." },
      { q: "Why wasn't a blank scanned page found?", a: "Scans often have a grey background or an edge shadow. Choose Scan with specks or mark the page by hand." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["delete-pdf-pages", "compress-pdf", "reverse-pdf"],
  blocks: (l) => [
    {
      type: "table",
      title: tt(l, "Что считается пустой страницей", "What counts as blank"),
      head: [tt(l, "Режим", "Mode"), tt(l, "Тёмных точек не больше", "Dark pixels at most"), tt(l, "Подходит для", "Good for")],
      rows: [
        [tt(l, "Совсем белую", "Pure white"), "0,02 %".replace(",", l === "ru" ? "," : "."), tt(l, "PDF из Word и других программ", "PDFs from Word and other apps")],
        [tt(l, "Почти белую", "Nearly white"), "0,2 %".replace(",", l === "ru" ? "," : "."), tt(l, "страницы только с номером или колонтитулом", "pages with only a number or header")],
        [tt(l, "Скан с пятнами", "Scan with specks"), "1,2 %".replace(",", l === "ru" ? "," : "."), tt(l, "сканы с пылью и тенью от края", "scans with dust and edge shadows")],
      ],
    },
  ],
};

/* ───────────── add text ───────────── */

export const addTextTool: ToolDef = {
  slug: "add-text-to-pdf",
  component: "pdf/edit",
  icon: "Type",
  popular: true,
  name: { ru: "Добавить текст в PDF", en: "Add text to PDF" },
  title: { ru: "Добавить текст в PDF онлайн | вписать текст в PDF-файл", en: "Add Text to PDF Online — Type on a PDF" },
  h1: { ru: "Добавить текст в PDF онлайн", en: "Add text to a PDF online" },
  description: {
    ru: "Впишите текст в PDF: нажмите на место на странице и печатайте. Кириллица, размер и цвет, перенос мышью, закрашивание лишнего. Без регистрации.",
    en: "Type on a PDF: tap a spot on the page and start typing. Any language, size and colour, drag to move, white-out for mistakes. No sign-up.",
  },
  lead: { ru: "Нажмите на страницу там, где нужен текст, и печатайте — как в обычном редакторе.", en: "Tap the page where you want text and type — just like in a normal editor." },
  keywords: { ru: ["добавить текст в pdf", "вписать текст в pdf", "редактировать pdf", "написать в pdf", "заполнить pdf"], en: ["add text to pdf", "type on pdf", "write on pdf", "pdf editor"] },
  props: { tool: "text" },
  howTo: {
    ru: ["Откройте PDF-файл.", "Нажмите на страницу в нужном месте и введите текст; размер и цвет — над страницей.", "Передвиньте надпись за значок ⋮, затем нажмите «Сохранить PDF»."],
    en: ["Open a PDF file.", "Tap the page where you need text and type; size and colour are above the page.", "Drag the text by its ⋮ handle, then press Save PDF."],
  },
  about: {
    ru: [
      "Текст встраивается в страницу шрифтом Noto Sans — тем же, что вы видите при наборе, поэтому результат совпадает с экраном. Поддерживаются кириллица, казахские буквы, латиница и большинство других алфавитов.",
      "Так удобно вписать данные в бланк без полей формы, подписать фото в документе или поставить дату. Если в PDF есть настоящие поля, быстрее заполнить их в «Заполнить PDF-форму».",
      PRIVACY.ru,
    ],
    en: [
      "Text is embedded with Noto Sans — the same font you see while typing — so the result matches the screen. Cyrillic, Latin and most other scripts are supported.",
      "It's handy for filling in a form that has no fields, labelling a picture or adding a date. If the PDF has real form fields, Fill in a PDF form is quicker.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Можно ли изменить существующий текст в PDF?", a: "Исправить буквы в готовом тексте нельзя: PDF хранит текст как набор знаков на позициях. Закрасьте старое слово белым прямоугольником и впишите новое поверх." },
      { q: "Сохранится ли кириллица?", a: "Да. В файл встраивается шрифт Noto Sans с нужными буквами, поэтому текст правильно отображается на любом устройстве." },
      { q: "Как добавить подпись?", a: "Для рукописной подписи откройте «Подписать PDF»: там можно нарисовать подпись или загрузить её фото." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Can I change existing text in a PDF?", a: "Not letter by letter: a PDF stores text as glyphs at fixed positions. Cover the old word with a white box and type the new one on top." },
      { q: "Will non-Latin text work?", a: "Yes. Noto Sans with the needed glyphs is embedded, so the text shows correctly on any device." },
      { q: "How do I add a signature?", a: "For a handwritten signature open Sign PDF: draw it or upload a photo of it." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["sign-pdf", "fill-pdf-form", "watermark-pdf"],
  variants: {
    title: { ru: "Ещё", en: "More" },
    list: (): VariantDef[] => [
      {
        slug: "white-out",
        name: { ru: "Замазать текст", en: "White-out" },
        title: { ru: "Замазать текст в PDF онлайн | закрасить белым", en: "White-Out PDF Online — Cover Text with White" },
        h1: { ru: "Замазать текст в PDF", en: "White-out text in a PDF" },
        description: {
          ru: "Закрасьте лишнее в PDF белым или цветным прямоугольником и при необходимости впишите новый текст поверх. Работает в браузере, файл не загружается.",
          en: "Cover parts of a PDF with a white or coloured box and type new text on top if needed. Runs in your browser; the file isn't uploaded.",
        },
        lead: { ru: "Проведите по странице — выделенное место закрасится белым прямоугольником.", en: "Drag across the page to cover that spot with a white rectangle." },
        props: { tool: "box" },
        blocks: (l) => [
          {
            type: "facts",
            title: tt(l, "Закрасить или удалить", "Cover or remove"),
            rows: [
              [tt(l, "Закрашивание", "White-out"), tt(l, "скрывает визуально, текст под ним остаётся в файле", "hides visually; the text stays in the file underneath")],
              [tt(l, "Перевод в картинку", "Convert to image"), tt(l, "убирает скрытый текст: PDF → JPG → PDF", "removes hidden text: PDF → JPG → PDF")],
              [tt(l, "Удаление страницы", "Delete the page"), tt(l, "если лишнее занимает всю страницу", "if the whole page must go")],
            ],
          },
        ],
        faq: faq(
          [{ q: "Можно ли так скрыть паспортные данные?", a: "Нет: текст под прямоугольником можно скопировать. Чтобы убрать его совсем, после закрашивания переведите PDF в JPG и обратно в PDF." }],
          [{ q: "Can I hide passport details this way?", a: "No: text under the box can still be copied. To remove it for good, convert the PDF to JPG and back to PDF after covering it." }],
        ),
      },
    ],
  },
};
