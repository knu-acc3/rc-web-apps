import type { Locale } from "@/i18n/config";
import { count, formatNumber } from "@/i18n/format";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { PAPER, nupGrid } from "../engine/geometry";
import { IMAGE_LEVELS, RASTER_LEVELS } from "../engine/presets";
import { PRIVACY, PRIVACY_QA, faq } from "./shared";

/* ───────────── compress ───────────── */

function presetTable(locale: Locale): Block {
  const ru = locale === "ru";
  const lv = (k: keyof typeof IMAGE_LEVELS) => `JPEG ${Math.round(IMAGE_LEVELS[k].quality * 100)}%, ≤ ${formatNumber(locale, IMAGE_LEVELS[k].maxSide)} px`;
  return {
    type: "table",
    title: ru ? "Режимы сжатия" : "Compression modes",
    head: ru ? ["Режим", "Что происходит", "Текст"] : ["Mode", "What happens", "Text"],
    rows: [
      [ru ? "Без потерь" : "Lossless", ru ? "удаляются лишние объекты, сжимаются несжатые потоки" : "unused objects removed, raw streams compressed", ru ? "не меняется" : "unchanged"],
      [ru ? "Картинки, слабая" : "Images, light", lv("light"), ru ? "не меняется" : "unchanged"],
      [ru ? "Картинки, средняя" : "Images, medium", lv("medium"), ru ? "не меняется" : "unchanged"],
      [ru ? "Картинки, сильная" : "Images, strong", lv("strong"), ru ? "не меняется" : "unchanged"],
      [ru ? "Страницы в картинки" : "Pages to images", `${RASTER_LEVELS.strong.dpi}–${RASTER_LEVELS.light.dpi} DPI`, ru ? "становится картинкой" : "becomes an image"],
    ],
  };
}

const compressVariants = (): VariantDef[] => [
  {
    slug: "without-losing-quality",
    name: { ru: "Без потери качества", en: "Without losing quality" },
    title: { ru: "Сжать PDF без потери качества онлайн", en: "Compress PDF without losing quality online" },
    description: {
      ru: "Уменьшите PDF, не трогая текст и картинки: удаляются дубли и неиспользуемые объекты, несжатые потоки сжимаются. Если меньше не станет — файл не подменяется.",
      en: "Shrink a PDF without touching text or images: duplicates and unused objects are removed and raw streams compressed. If it can't get smaller, nothing is replaced.",
    },
    lead: { ru: "Оптимизация без потерь: всё, что видно на странице, остаётся байт в байт.", en: "Lossless optimisation: everything visible on the page stays byte for byte." },
    props: { mode: "lossless" },
    blocks: (l) => [
      {
        type: "list",
        title: l === "ru" ? "Что делает режим «Без потерь»" : "What “Lossless” does",
        items:
          l === "ru"
            ? [
                "Удаляет объекты, на которые ничего не ссылается (остатки прошлых правок).",
                "Объединяет одинаковые картинки и шрифты, вставленные несколько раз.",
                "Сжимает потоки, записанные без сжатия (частое дело у генераторов отчётов).",
                "Убирает служебные данные редакторов (PieceInfo) и встроенные миниатюры страниц.",
                "Упаковывает структуру файла в сжатые потоки объектов (PDF 1.5+).",
              ]
            : [
                "Removes objects nothing refers to (leftovers of earlier edits).",
                "Merges identical images and fonts embedded several times.",
                "Compresses streams stored uncompressed (common with report generators).",
                "Drops editor data (PieceInfo) and embedded page thumbnails.",
                "Packs the file structure into compressed object streams (PDF 1.5+).",
              ],
      },
    ],
    faq: faq(
      [
        { q: "Насколько уменьшится файл?", a: "Зависит от того, как он создан: «раздутые» файлы из некоторых программ и после многократных правок теряют 20–60%, аккуратно сохранённые — единицы процентов. Если выигрыша нет, инструмент так и скажет." },
        { q: "Если нужно сильнее?", a: "Большую часть веса обычно занимают фотографии. Режим «Сжать картинки» уменьшает их, не трогая текст." },
      ],
      [
        { q: "How much smaller will it get?", a: "Depends on how the file was made: bloated files from some apps or after many edits lose 20–60%, cleanly saved ones only a few percent. If there's no gain, the tool says so." },
        { q: "What if I need more?", a: "Photos usually carry most of the weight. “Compress images” scales them down without touching text." },
      ],
    ),
  },
  {
    slug: "maximum-compression",
    name: { ru: "Максимальное сжатие", en: "Maximum compression" },
    title: { ru: "Сильно сжать PDF онлайн — максимальное сжатие", en: "Compress PDF to the smallest size online" },
    description: {
      ru: `Максимальное сжатие PDF: картинки пересохраняются в JPEG ${Math.round(IMAGE_LEVELS.strong.quality * 100)}% и уменьшаются до ${IMAGE_LEVELS.strong.maxSide} px, текст остаётся текстом. Для почты и порталов с лимитом размера.`,
      en: `Maximum PDF compression: images are re-saved as ${Math.round(IMAGE_LEVELS.strong.quality * 100)}% JPEG and scaled to ${IMAGE_LEVELS.strong.maxSide} px, text stays text. For email and portals with size limits.`,
    },
    lead: { ru: "Сильнее всего уменьшает фотографии внутри PDF, не превращая текст в картинку.", en: "Shrinks photos inside the PDF the most, without turning text into an image." },
    props: { mode: "images", level: "strong" },
    blocks: (l) => [presetTable(l)],
    faq: faq(
      [
        { q: "Как уложиться в лимит 10 или 25 МБ?", a: "Начните с «Сильной» степени. Если не хватает и в файле сканы — попробуйте «Страницы в картинки»: он пересобирает страницы в JPEG заданного DPI, но текст перестаёт выделяться." },
        { q: "Не станут ли фото «мыльными»?", a: `Длинная сторона картинки ограничивается ${IMAGE_LEVELS.strong.maxSide} px — этого хватает для экрана, но для печати фотографий лучше выбрать «Слабую» степень.` },
      ],
      [
        { q: "How do I get under a 10 or 25 MB limit?", a: "Start with “Strong”. If that's not enough and the file is scanned, try “Pages to images”: it rebuilds pages as JPEG at a set DPI, but text stops being selectable." },
        { q: "Will photos turn blurry?", a: `The long side is limited to ${IMAGE_LEVELS.strong.maxSide} px — enough for screens, but for printing photos choose “Light”.` },
      ],
    ),
  },
  {
    slug: "scanned",
    name: { ru: "Сжать скан", en: "Scanned PDF" },
    title: { ru: "Сжать сканированный PDF онлайн", en: "Compress a scanned PDF online" },
    description: {
      ru: `Сожмите PDF со сканами: страницы-картинки пересохраняются в JPEG ${Math.round(IMAGE_LEVELS.medium.quality * 100)}% с длинной стороной до ${formatNumber("ru", IMAGE_LEVELS.medium.maxSide)} px — это около 190 DPI для A4, текст на скане читается.`,
      en: `Compress a PDF of scans: page images are re-saved as ${Math.round(IMAGE_LEVELS.medium.quality * 100)}% JPEG with the long side up to ${formatNumber("en", IMAGE_LEVELS.medium.maxSide)} px — about 190 DPI for A4, still readable.`,
    },
    lead: { ru: "Скан на 300–600 DPI весит много; для чтения и отправки хватает меньшего.", en: "A 300–600 DPI scan weighs a lot; reading and sending need much less." },
    props: { mode: "images", level: "medium" },
    blocks: (l) => [
      {
        type: "table",
        title: l === "ru" ? "Скан страницы A4" : "A scanned A4 page",
        head: l === "ru" ? ["Разрешение скана", "Пикселей", "После «Средней» степени"] : ["Scan resolution", "Pixels", "After “Medium”"],
        rows: [600, 300, 200].map((dpi) => {
          const w = Math.round((210 / 25.4) * dpi);
          const h = Math.round((297 / 25.4) * dpi);
          const k = Math.min(1, IMAGE_LEVELS.medium.maxSide / Math.max(w, h));
          return [`${dpi} DPI`, `${w} × ${h}`, `${Math.round(w * k)} × ${Math.round(h * k)}`];
        }),
      },
    ],
    faq: faq(
      [
        { q: "Почему скан весит так много?", a: "Сканер часто сохраняет цветную страницу 300 DPI почти без сжатия — это 8–9 миллионов пикселей на лист. Уменьшение до ~190 DPI и JPEG-сжатие дают выигрыш в разы." },
        { q: "Черно-белые сканы тоже сожмутся?", a: "Если они записаны в формате JBIG2 или CCITT (1 бит на пиксель), они уже компактны и инструмент их не трогает — пересжатие в JPEG только увеличило бы их." },
      ],
      [
        { q: "Why is a scan so heavy?", a: "Scanners often save a colour page at 300 DPI with little compression — 8–9 million pixels per sheet. Scaling to ~190 DPI and JPEG compression cut that several times." },
        { q: "Do black-and-white scans shrink too?", a: "If they're stored as JBIG2 or CCITT (1 bit per pixel), they're already compact and are left alone — JPEG would only make them bigger." },
      ],
    ),
  },
];

export const compressTool: ToolDef = {
  slug: "compress-pdf",
  component: "pdf/compress",
  icon: "Minimize2",
  popular: true,
  name: { ru: "Сжать PDF", en: "Compress PDF" },
  title: { ru: "Сжать PDF онлайн — уменьшить размер PDF-файла", en: "Compress PDF online — reduce PDF file size" },
  h1: { ru: "Сжать PDF онлайн", en: "Compress PDF online" },
  description: {
    ru: "Уменьшите PDF тремя честными способами: без потерь, сжатием картинок без трогания текста или переводом страниц в JPEG. Больший файл никогда не подсовывается.",
    en: "Shrink a PDF three honest ways: lossless, compressing images while leaving text alone, or turning pages into JPEG. A bigger file is never handed back.",
  },
  lead: { ru: "Выберите способ сжатия — результат покажет, сколько процентов удалось сэкономить.", en: "Pick a method — the result shows how many percent you saved." },
  keywords: { ru: ["уменьшить размер pdf", "сжать pdf файл", "уменьшить вес pdf", "сжать pdf для почты"], en: ["reduce pdf size", "shrink pdf", "pdf compressor", "make pdf smaller"] },
  howTo: {
    ru: ["Откройте PDF.", "Выберите способ: «Без потерь», «Сжать картинки» или «Страницы в картинки», и степень.", "Нажмите «Сжать PDF».", "Сравните размер «было → стало» и скачайте файл."],
    en: ["Open a PDF.", "Choose a method — “Lossless”, “Compress images” or “Pages to images” — and a strength.", "Click “Compress PDF”.", "Compare the before → after size and download."],
  },
  about: {
    ru: [
      "«Сжать картинки» находит внутри PDF фотографии и растровые изображения (JPEG и 8-битные RGB/серые), уменьшает их до заданного размера и пересохраняет в JPEG. Размеры картинки в файле обновляются, а расположение на странице не меняется, поэтому текст, векторы и шрифты остаются нетронутыми. Каждая картинка заменяется, только если стала меньше.",
      "Режим «Страницы в картинки» — крайняя мера: страница целиком становится JPEG, текст перестаёт выделяться и искаться. Если ни один способ не уменьшил файл, вы увидите это честно — исходник не подменяется большим результатом.",
      PRIVACY.ru,
    ],
    en: [
      "“Compress images” finds photos and raster images inside the PDF (JPEG and 8-bit RGB/grey), scales them to the chosen size and re-saves them as JPEG. The image dimensions in the file are updated while their placement on the page stays put, so text, vectors and fonts are untouched. Each image is replaced only if it got smaller.",
      "“Pages to images” is the last resort: each page becomes a JPEG and text can no longer be selected or searched. If no method made the file smaller, you'll be told so honestly — the original is never swapped for a bigger result.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Какой способ выбрать?", a: "Начните с «Сжать картинки», средняя степень: он даёт основной выигрыш для документов с фото и сканами. «Без потерь» подходит, когда картинки менять нельзя, «Страницы в картинки» — только если остальное не помогло." },
      { q: "Почему файл почти не уменьшился?", a: "В нём, скорее всего, мало картинок: текст и векторы и так занимают немного места. Такой PDF уже компактен, и честного способа заметно его уменьшить нет." },
      { q: "Останется ли текст текстом?", a: "Да, в режимах «Без потерь» и «Сжать картинки» текст, ссылки и шрифты не меняются. Только «Страницы в картинки» превращает текст в изображение, и это явно подписано." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Which method should I choose?", a: "Start with “Compress images”, medium: it gives most of the gain for documents with photos and scans. “Lossless” is for when images must not change, “Pages to images” only when nothing else helps." },
      { q: "Why did the file barely shrink?", a: "It probably has few images: text and vectors take little space anyway. Such a PDF is already compact and there's no honest way to make it much smaller." },
      { q: "Does text stay text?", a: "Yes, with “Lossless” and “Compress images” text, links and fonts don't change. Only “Pages to images” turns text into a picture, and it's clearly labelled." },
      PRIVACY_QA.en,
    ],
  ),
  blocks: (l) => [presetTable(l)],
  variants: { title: { ru: "Варианты сжатия", en: "Compression options" }, list: compressVariants },
};

/* ───────────── watermark ───────────── */

const wmVariant = (slug: "confidential" | "draft" | "sample" | "copy"): VariantDef => {
  const d = {
    confidential: {
      ru: ["КОНФИДЕНЦИАЛЬНО", "Водяной знак «Конфиденциально» на PDF", "договоры, коммерческие предложения, внутренние отчёты и персональные данные, которые передаются за пределы компании", "договоров и внутренних отчётов"],
      en: ["CONFIDENTIAL", "“Confidential” watermark on PDF", "contracts, proposals, internal reports and personal data sent outside the company", "contracts and internal reports"],
    },
    draft: {
      ru: ["ЧЕРНОВИК", "Водяной знак «Черновик» на PDF", "проекты договоров и приказов на согласовании, чтобы черновик не приняли за окончательную версию", "проектов документов на согласовании"],
      en: ["DRAFT", "“Draft” watermark on PDF", "contracts and policies under review, so a draft isn't mistaken for the final version", "documents still under review"],
    },
    sample: {
      ru: ["ОБРАЗЕЦ", "Водяной знак «Образец» на PDF", "шаблоны документов, примеры заполнения бланков, макеты для заказчика и справки, которые нельзя использовать как настоящие", "шаблонов, макетов и примеров заполнения"],
      en: ["SAMPLE", "“Sample” watermark on PDF", "document templates, form-filling examples, client mock-ups and certificates that must not pass as real", "templates, mock-ups and filled-in examples"],
    },
    copy: {
      ru: ["КОПИЯ", "Водяной знак «Копия» на PDF", "сканы паспорта, дипломов и свидетельств, которые отправляют для ознакомления, чтобы их не выдали за оригинал", "копий паспорта и дипломов для ознакомления"],
      en: ["COPY", "“Copy” watermark on PDF", "scans of passports, diplomas and certificates sent for reference, so they can't pass as the original", "passport or diploma copies sent for reference"],
    },
  }[slug];
  return {
    slug,
    name: { ru: `«${d.ru[0][0]}${d.ru[0].slice(1).toLowerCase()}»`, en: `“${d.en[0][0]}${d.en[0].slice(1).toLowerCase()}”` },
    title: { ru: `${d.ru[1]} онлайн`, en: `${d.en[1]} online` },
    description: {
      ru: `Поставьте на PDF водяной знак «${d.ru[0]}» — для ${d.ru[3]}. Векторный текст, прозрачность, наклон 45° или замощение, без загрузки файла.`,
      en: `Stamp “${d.en[0]}” on a PDF — for ${d.en[3]}. Vector text with transparency, a 45° tilt or tiling, and no file upload.`,
    },
    lead: { ru: `Надпись «${d.ru[0]}» уже подставлена — остаётся открыть PDF.`, en: `The text “${d.en[0]}” is already filled in — just open your PDF.` },
    props: { preset: slug },
    blocks: (l) => [
      {
        type: "facts",
        rows:
          l === "ru"
            ? [
                ["Текст", `«${d.ru[0]}» (можно изменить)`],
                ["Где используют", d.ru[2]],
                ["Рекомендуем", "прозрачность 75%, наклон 45°, для сканов — «Замостить всю страницу»"],
                ["Как наносится", "векторным текстом со встроенным шрифтом — не картинкой"],
              ]
            : [
                ["Text", `“${d.en[0]}” (editable)`],
                ["Used for", d.en[2]],
                ["We suggest", "75% transparency, 45° tilt; for scans “Tile the whole page”"],
                ["How it's applied", "as vector text with an embedded font — not an image"],
              ],
      },
    ],
    faq: faq(
      [
        { q: "Можно ли потом убрать такой водяной знак?", a: "Знак записывается поверх содержимого страницы. Специальными программами его можно удалить, поэтому для надёжности замостите страницу и сохраните PDF с паролем от изменения." },
        { q: "Подходит ли это для сканов документов?", a: "Да: знак наносится поверх скана. Для копий паспорта и дипломов лучше дописать назначение, например «КОПИЯ ДЛЯ БАНКА», — так документ сложнее использовать в других целях." },
      ],
      [
        { q: "Can such a watermark be removed later?", a: "It's written on top of the page content. Specialised software can remove it, so for more protection tile the page and save the PDF with an editing password." },
        { q: "Does it work for scanned documents?", a: "Yes: the watermark goes on top of the scan. For passport or diploma copies, add a purpose such as “COPY FOR BANK” — it makes misuse harder." },
      ],
    ),
  };
};

export const watermarkTool: ToolDef = {
  slug: "watermark-pdf",
  component: "pdf/watermark",
  icon: "Stamp",
  name: { ru: "Водяной знак на PDF", en: "Watermark PDF" },
  title: { ru: "Водяной знак на PDF онлайн — текст или логотип", en: "Add watermark to PDF online — text or logo" },
  h1: { ru: "Поставить водяной знак на PDF", en: "Add a watermark to a PDF" },
  description: {
    ru: "Добавьте на PDF водяной знак: векторный текст (в том числе кириллица) или логотип PNG/JPG, прозрачность, наклон, 8 позиций или замощение. С живым предпросмотром.",
    en: "Add a watermark to a PDF: vector text (any language) or a PNG/JPG logo, with opacity, tilt, 8 positions or tiling. Live preview of the real result.",
  },
  lead: { ru: "Впишите текст или добавьте логотип — предпросмотр сразу покажет страницу с водяным знаком.", en: "Type text or add a logo — the preview shows the page with the watermark right away." },
  keywords: { ru: ["добавить водяной знак в pdf", "надпись на pdf", "логотип на pdf", "штамп на pdf"], en: ["add watermark to pdf", "stamp pdf", "pdf watermark text"] },
  howTo: {
    ru: ["Откройте PDF.", "Впишите текст водяного знака или загрузите логотип.", "Настройте размер, прозрачность, наклон и положение — предпросмотр обновляется сам.", "Нажмите «Добавить водяной знак» и скачайте файл."],
    en: ["Open a PDF.", "Type the watermark text or upload a logo.", "Adjust size, opacity, angle and position — the preview updates by itself.", "Click “Add watermark” and download the file."],
  },
  about: {
    ru: [
      "Текстовый водяной знак записывается векторным текстом, а не картинкой: он чёткий при любом увеличении и почти не увеличивает файл. Для кириллицы и казахских букв встраивается подмножество шрифта Noto Sans — только нужные символы, несколько килобайт.",
      "Положение считается от того, как страница выглядит на экране: у повёрнутых страниц знак не ляжет боком и не выйдет за видимую область. Предпросмотр — это настоящая обработка первой страницы, поэтому он совпадает с результатом.",
      PRIVACY.ru,
    ],
    en: [
      "A text watermark is written as vector text, not a picture: it stays sharp at any zoom and barely grows the file. For non-Latin text a subset of Noto Sans is embedded — only the glyphs used, a few kilobytes.",
      "Position is measured from how the page looks on screen: on rotated pages the watermark won't lie sideways or fall outside the visible area. The preview is real processing of the first page, so it matches the result.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Можно ли поставить водяной знак не на все страницы?", a: "Да: впишите страницы в поле «Страницы», например «1, 3-5». Пустое поле — все страницы." },
      { q: "Какой логотип подойдёт?", a: "PNG с прозрачным фоном выглядит лучше всего. JPG тоже подойдёт, но белый фон картинки будет виден — уменьшите непрозрачность." },
      { q: "Будет ли текст знака выделяться и искаться?", a: "Да, это настоящий текст. Если это нежелательно, используйте водяной знак-картинку." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Can I watermark only some pages?", a: "Yes: list them in the “Pages” field, e.g. “1, 3-5”. An empty field means all pages." },
      { q: "What logo works best?", a: "A PNG with a transparent background looks best. JPG works too, but its white background will show — lower the opacity." },
      { q: "Is the watermark text selectable and searchable?", a: "Yes, it's real text. If that's undesirable, use an image watermark." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["compress-pdf", "merge-pdf", "rotate-pdf"],
  variants: { title: { ru: "Готовые надписи", en: "Ready-made texts" }, list: () => (["confidential", "draft", "sample", "copy"] as const).map(wmVariant) },
};

/* ───────────── page numbers ───────────── */

interface NumVariant {
  slug: string;
  props: Record<string, unknown>;
  name: { ru: string; en: string };
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  lead: { ru: string; en: string };
  facts: { ru: [string, string][]; en: [string, string][] };
  qa: { ru: { q: string; a: string }[]; en: { q: string; a: string }[] };
}

const numVariant = (v: NumVariant): VariantDef => ({
  slug: v.slug,
  name: v.name,
  title: v.title,
  description: v.description,
  lead: v.lead,
  props: v.props,
  blocks: (l) => [{ type: "facts", rows: v.facts[l] }],
  faq: faq(v.qa.ru, v.qa.en),
});

const numberVariants = (): VariantDef[] => [
  numVariant({
    slug: "bottom-center",
    props: { position: "bottom-center" },
    name: { ru: "Внизу по центру", en: "Bottom centre" },
    title: { ru: "Нумерация страниц PDF внизу по центру", en: "Add page numbers to PDF at the bottom centre" },
    description: {
      ru: "Пронумеруйте страницы PDF внизу по центру — так требует ГОСТ 7.32-2017 для отчётов, и так оформляют большинство курсовых и дипломов. Номер без точки, 10 мм от края.",
      en: "Number PDF pages at the bottom centre — the most common placement for books, theses and reports. Plain numbers, 10 mm from the edge, no uploads.",
    },
    lead: { ru: "Номер ставится в центре нижнего поля каждой страницы.", en: "The number goes in the middle of each page's bottom margin." },
    facts: {
      ru: [
        ["Положение", "центр нижнего поля, 10 мм от края листа"],
        ["Где требуется", "ГОСТ 7.32-2017 (отчёты о НИР), методички большинства вузов для курсовых и дипломов"],
        ["Формат", "арабские цифры без точки: 1, 2, 3…"],
        ["Титульный лист", "для ГОСТа включите «Не ставить номер на первой странице» и начните с 2"],
      ],
      en: [
        ["Position", "middle of the bottom margin, 10 mm from the edge"],
        ["Common in", "books, theses, academic and technical reports"],
        ["Style", "plain numbers: 1, 2, 3…"],
        ["Title page", "turn on “No number on the first page” and start at 2 to count it silently"],
      ],
    },
    qa: {
      ru: [{ q: "Как пронумеровать курсовую по ГОСТу?", a: "Положение «Снизу по центру», галочка «Не ставить номер на первой странице» и «Начать с» 2: титульный лист считается, но номер на нём не печатается." }],
      en: [{ q: "How do I skip the title page but still count it?", a: "Tick “No number on the first page” and set “Start at” to 2: the title page counts but shows no number." }],
    },
  }),
  numVariant({
    slug: "bottom-right",
    props: { position: "bottom-right" },
    name: { ru: "Внизу справа", en: "Bottom right" },
    title: { ru: "Нумерация страниц PDF внизу справа", en: "Add page numbers to PDF at the bottom right" },
    description: {
      ru: "Поставьте номера страниц PDF в правом нижнем углу — привычно для деловых отчётов, презентаций и распечаток, которые листают, держа за левый край.",
      en: "Put PDF page numbers in the bottom right corner — familiar in business reports, slide handouts and printouts flipped from the left edge.",
    },
    lead: { ru: "Номер ставится в правом нижнем углу.", en: "The number goes in the bottom right corner." },
    facts: {
      ru: [
        ["Положение", "правый нижний угол, 10 мм от краёв"],
        ["Где удобно", "отчёты, презентации, раздаточные материалы, односторонняя печать"],
        ["Вариант", "формат «1 / 10» подскажет, сколько всего страниц"],
      ],
      en: [
        ["Position", "bottom right corner, 10 mm from the edges"],
        ["Handy for", "reports, slide handouts, single-sided printing"],
        ["Tip", "the “1 / 10” style shows the total too"],
      ],
    },
    qa: {
      ru: [{ q: "Номер налезает на текст — что делать?", a: "Уменьшите размер шрифта номера до 9–10 pt или выберите положение сверху: у некоторых документов нижнее поле очень узкое." }],
      en: [{ q: "The number overlaps text — what now?", a: "Lower the number size to 9–10 pt or place it at the top: some documents have a very narrow bottom margin." }],
    },
  }),
  numVariant({
    slug: "top-right",
    props: { position: "top-right" },
    name: { ru: "Вверху справа", en: "Top right" },
    title: { ru: "Нумерация страниц PDF вверху справа", en: "Add page numbers to PDF at the top right" },
    description: {
      ru: "Пронумеруйте страницы PDF в правом верхнем углу — так требуют стили APA и MLA для студенческих работ и научных статей за рубежом. Все страницы или со второй.",
      en: "Number PDF pages in the top right corner — required by APA and MLA styles for student papers and articles. Number every page or start from the second.",
    },
    lead: { ru: "Номер ставится в правом верхнем углу.", en: "The number goes in the top right corner." },
    facts: {
      ru: [
        ["Положение", "правый верхний угол, 10 мм от краёв"],
        ["Стандарты", "APA 7 (номер на каждой странице, включая титульную), MLA 9 (номер рядом с фамилией автора)"],
        ["Для MLA", "фамилию рядом с номером добавьте в исходный документ — этот инструмент ставит только номер"],
      ],
      en: [
        ["Position", "top right corner, 10 mm from the edges"],
        ["Style guides", "APA 7 (number on every page, title page included), MLA 9 (number next to the author's surname)"],
        ["MLA tip", "add the surname in your document before exporting — this tool adds only the number"],
      ],
    },
    qa: {
      ru: [{ q: "Нужно ли нумеровать титульную страницу по APA?", a: "Да, в APA 7 номер стоит на всех страницах, включая титульную, — оставьте галочку «Не ставить номер на первой странице» выключенной." }],
      en: [{ q: "Does APA number the title page?", a: "Yes, APA 7 numbers every page including the title page — leave “No number on the first page” off." }],
    },
  }),
  numVariant({
    slug: "top-center",
    props: { position: "top-center", skipFirst: true, start: 2 },
    name: { ru: "Вверху по центру", en: "Top centre" },
    title: { ru: "Нумерация страниц PDF вверху по центру (ГОСТ Р 7.0.97)", en: "Add page numbers to PDF at the top centre" },
    description: {
      ru: "Номера страниц посередине верхнего поля, начиная со второй страницы, — как требует ГОСТ Р 7.0.97-2016 для приказов, писем и других деловых документов.",
      en: "Page numbers in the middle of the top margin, starting from page two — a common layout for letters, memos and official documents.",
    },
    lead: { ru: "Первая страница без номера, дальше — 2, 3, 4… посередине верхнего поля.", en: "No number on page one, then 2, 3, 4… in the middle of the top margin." },
    facts: {
      ru: [
        ["Положение", "посередине верхнего поля, не ближе 10 мм от края"],
        ["Правило", "ГОСТ Р 7.0.97-2016: нумеруются вторая и следующие страницы документа"],
        ["Где применяется", "приказы, распоряжения, служебные и деловые письма, протоколы"],
        ["Уже настроено", "первая страница без номера, нумерация продолжается с 2"],
      ],
      en: [
        ["Position", "middle of the top margin, at least 10 mm from the edge"],
        ["Rule", "only the second and later pages are numbered"],
        ["Used for", "letters, memos, orders and minutes"],
        ["Preset", "no number on page one, numbering continues from 2"],
      ],
    },
    qa: {
      ru: [{ q: "Почему первая страница без номера?", a: "По ГОСТ Р 7.0.97-2016 номер на первой странице документа не ставится, а вторая получает номер 2. Если нужно иначе — снимите галочку." }],
      en: [{ q: "Why is page one unnumbered?", a: "In this layout the first page carries no number and the second shows 2. Untick the box if you need numbers everywhere." }],
    },
  }),
  numVariant({
    slug: "skip-first-page",
    props: { position: "bottom-center", skipFirst: true, start: 2 },
    name: { ru: "Без титульного листа", en: "Skip the first page" },
    title: { ru: "Пронумеровать PDF без титульного листа", en: "Add page numbers to PDF except the first page" },
    description: {
      ru: "Пронумеруйте PDF так, чтобы на титульном листе номера не было, а вторая страница получила номер 2. Можно начать и с 1 — поменяйте начальный номер.",
      en: "Number a PDF with no number on the title page while page two shows 2. Prefer starting at 1 on page two? Just change the start number.",
    },
    lead: { ru: "Титульный лист считается, но номер на нём не печатается.", en: "The title page counts but carries no number." },
    facts: {
      ru: [
        ["Страница 1", "без номера"],
        ["Страница 2", "номер 2 (или 1, если «Начать с» = 1)"],
        ["Всего в «из N»", "последний напечатанный номер"],
        ["Где нужно", "курсовые и дипломы, отчёты, книги с обложкой"],
      ],
      en: [
        ["Page 1", "no number"],
        ["Page 2", "number 2 (or 1 if “Start at” = 1)"],
        ["Total in “of N”", "the last printed number"],
        ["Where", "theses, reports, books with a cover"],
      ],
    },
    qa: {
      ru: [{ q: "Как начать нумерацию с третьей страницы?", a: "Галочка пропускает только первую страницу. Чтобы начать с третьей, разделите PDF, пронумеруйте вторую часть с нужного номера и объедините части обратно." }],
      en: [{ q: "How do I start numbering on page three?", a: "One checkbox skips only page one: split the PDF, number the right part from the right number, then merge the parts back." }],
    },
  }),
  numVariant({
    slug: "page-x-of-y",
    props: { format: "page-n-of-total", position: "bottom-right" },
    name: { ru: "«Страница 1 из N»", en: "“Page 1 of N”" },
    title: { ru: "Нумерация «Страница 1 из N» в PDF онлайн", en: "Add “Page X of Y” numbers to PDF online" },
    description: {
      ru: "Добавьте в PDF нумерацию вида «Страница 3 из 12»: читатель видит объём документа, а подмену или пропажу листа в договоре сразу заметно. Русский и английский.",
      en: "Add “Page 3 of 12” numbering to a PDF: readers see how long the document is, and a missing or swapped contract page stands out at once.",
    },
    lead: { ru: "На каждой странице — её номер и общее количество.", en: "Each page shows its number and the total count." },
    facts: {
      ru: [
        ["Вид", "«Страница 3 из 12»; есть и краткий «3 / 12»"],
        ["Зачем", "в договорах и актах сразу видно, если лист потерян или заменён"],
        ["Шрифт", "кириллица встраивается подмножеством Noto Sans"],
      ],
      en: [
        ["Style", "“Page 3 of 12”; a short “3 / 12” also exists"],
        ["Why", "in contracts it shows at once if a page is missing or replaced"],
        ["Font", "Helvetica for Latin text, embedded Noto Sans for other scripts"],
      ],
    },
    qa: {
      ru: [{ q: "Как считается «из N», если первая страница без номера?", a: "N — последний напечатанный номер: при 10 страницах, пропуске первой и старте с 2 будет «из 10»." }],
      en: [{ q: "How is “of N” counted when page one is skipped?", a: "N is the last printed number: 10 pages, first skipped, starting at 2 gives “of 10”." }],
    },
  }),
];

export const pageNumbersTool: ToolDef = {
  slug: "add-page-numbers-to-pdf",
  component: "pdf/page-numbers",
  icon: "ListOrdered",
  name: { ru: "Пронумеровать страницы PDF", en: "Add page numbers to PDF" },
  title: { ru: "Пронумеровать страницы PDF онлайн", en: "Add page numbers to PDF online" },
  h1: { ru: "Пронумеровать страницы PDF", en: "Add page numbers to a PDF" },
  description: {
    ru: "Добавьте номера страниц в PDF: 6 положений, форматы «1», «1 / 10», «Страница 1 из 10», начальный номер и пропуск титульного листа. С предпросмотром.",
    en: "Add page numbers to a PDF: 6 positions, styles “1”, “1 / 10”, “Page 1 of 10”, a custom start number and an option to skip the title page. With preview.",
  },
  lead: { ru: "Выберите место и вид номера — предпросмотр покажет страницу с номером.", en: "Choose where and how — the preview shows a numbered page." },
  keywords: { ru: ["нумерация страниц pdf", "проставить номера страниц в pdf", "добавить номера страниц"], en: ["number pdf pages", "pdf page numbering", "bates numbering"] },
  howTo: {
    ru: ["Откройте PDF.", "Выберите положение, вид номера, начальный номер и размер.", "При необходимости отключите номер на титульном листе.", "Нажмите «Пронумеровать страницы» и скачайте файл."],
    en: ["Open a PDF.", "Choose the position, style, start number and size.", "Optionally skip the number on the title page.", "Click “Add page numbers” and download the file."],
  },
  about: {
    ru: [
      "Номера пишутся настоящим текстом: Helvetica для цифр и латиницы, встроенный Noto Sans для «Страница 1 из 10» и других надписей на кириллице. Отступ — 10 мм от края видимой части листа, с учётом поворота страницы.",
      "«Из N» считается по последнему напечатанному номеру, поэтому при пропуске титульного листа и старте с 2 итог совпадает с числом листов. Файл меняется на месте: закладки, ссылки и формы сохраняются.",
      PRIVACY.ru,
    ],
    en: [
      "Numbers are real text: Helvetica for digits and Latin, embedded Noto Sans for other scripts. They sit 10 mm from the edge of the visible page area, honouring page rotation.",
      "“Of N” uses the last printed number, so skipping the title page and starting at 2 gives a total equal to the sheet count. The file is edited in place: bookmarks, links and forms are kept.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как не нумеровать титульный лист?", a: "Включите «Не ставить номер на первой странице». Чтобы титульный считался (как в ГОСТ), оставьте «Начать с» равным 2." },
      { q: "Можно ли начать с произвольного номера?", a: "Да, впишите любое число в «Начать с» — например, 15, если PDF продолжает другой документ." },
      { q: "Номера накладываются на текст колонтитула?", a: "Выберите другое положение или уменьшите размер: номер ставится в 10 мм от края, и в документах с узкими полями может задеть текст." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I skip the title page?", a: "Turn on “No number on the first page”. To still count it, keep “Start at” at 2." },
      { q: "Can I start from any number?", a: "Yes, type any number in “Start at” — say 15 if the PDF continues another document." },
      { q: "Numbers overlap my header or footer?", a: "Pick another position or a smaller size: numbers sit 10 mm from the edge and may touch text in documents with narrow margins." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "split-pdf", "rotate-pdf"],
  variants: { title: { ru: "Где и как нумеровать", en: "Placement and style" }, list: numberVariants },
};

/* ───────────── sign ───────────── */

export const signTool: ToolDef = {
  slug: "sign-pdf",
  component: "pdf/sign",
  icon: "PenLine",
  name: { ru: "Подписать PDF", en: "Sign PDF" },
  title: { ru: "Подписать PDF онлайн — нарисовать или загрузить подпись", en: "Sign PDF online — draw, type or upload a signature" },
  h1: { ru: "Подписать PDF онлайн", en: "Sign a PDF online" },
  description: {
    ru: "Поставьте подпись на PDF: нарисуйте её мышью или пальцем, напечатайте имя или загрузите скан. Перетащите на нужное место, одну или на все страницы.",
    en: "Put your signature on a PDF: draw it with a mouse or finger, type your name or upload a scan. Drag it into place on one page or every page.",
  },
  lead: { ru: "Создайте подпись и перетащите её на страницу — она впишется в PDF.", en: "Create a signature and drag it onto the page — it's written into the PDF." },
  keywords: { ru: ["поставить подпись на pdf", "вставить подпись в pdf", "расписаться в pdf"], en: ["add signature to pdf", "esign pdf", "insert signature in pdf"] },
  howTo: {
    ru: ["Откройте PDF.", "Нарисуйте подпись, напечатайте имя или загрузите фото подписи.", "Выберите страницу, нажмите «Поставить на эту страницу» и перетащите подпись; угол меняет размер.", "Нажмите «Подписать PDF» и скачайте файл."],
    en: ["Open a PDF.", "Draw your signature, type your name or upload a photo of it.", "Pick a page, click “Place on this page” and drag the signature; the corner resizes it.", "Click “Sign PDF” and download the file."],
  },
  about: {
    ru: [
      "Подпись сохраняется картинкой PNG с прозрачным фоном и вписывается прямо в содержимое страницы, поэтому её нельзя случайно сдвинуть в просмотрщике. Положение считается по видимой странице — на повёрнутых страницах подпись не ляжет боком.",
      "Это изображение подписи, а не квалифицированная электронная подпись. Для госуслуг, налоговой и торгов нужна подпись с сертификатом: в Казахстане — ЭЦП НУЦ РК через NCALayer, в России — КЭП аккредитованного удостоверяющего центра.",
      PRIVACY.ru,
    ],
    en: [
      "The signature is saved as a PNG with a transparent background and written into the page content, so it can't be nudged by accident in a viewer. Position follows the visible page — on rotated pages it won't lie sideways.",
      "This is an image of your signature, not a qualified electronic signature. Government portals and tenders need a certificate-based e-signature from an accredited provider.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Имеет ли такая подпись юридическую силу?", a: "Как у подписанного и отсканированного документа: её принимают, когда стороны договорились об обмене сканами. Для госорганов и торгов нужна ЭЦП/КЭП с сертификатом." },
      { q: "Как убрать белый фон у сфотографированной подписи?", a: "Загрузите фото и оставьте включённой галочку «Убрать белый фон» — светлые пиксели станут прозрачными. Лучше всего работает подпись синей или чёрной ручкой на белой бумаге." },
      { q: "Можно ли подписать все страницы сразу?", a: "Да: поставьте подпись на одной странице и нажмите «На все страницы» — она появится в том же месте на каждой." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Is such a signature legally valid?", a: "It carries the weight of a signed and scanned document: accepted where parties agree to exchange scans. Official portals need a certificate-based e-signature." },
      { q: "How do I remove the white background of a photographed signature?", a: "Upload the photo and keep “Remove white background” on — light pixels become transparent. A blue or black pen on white paper works best." },
      { q: "Can I sign every page at once?", a: "Yes: place the signature on one page and click “On every page” — it appears in the same spot on each page." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "compress-pdf", "jpg-to-pdf"],
};

/* ───────────── forms ───────────── */

export const formTool: ToolDef = {
  slug: "fill-pdf-form",
  component: "pdf/form",
  icon: "FileCheck2",
  name: { ru: "Заполнить PDF-форму", en: "Fill PDF form" },
  title: { ru: "Заполнить PDF-форму онлайн и сохранить", en: "Fill a PDF form online and save it" },
  h1: { ru: "Заполнить PDF-форму онлайн", en: "Fill in a PDF form online" },
  description: {
    ru: "Заполните интерактивную PDF-форму в браузере: текстовые поля, флажки, списки — в том числе по-русски и по-казахски. Можно «сплющить» поля, чтобы их не изменили.",
    en: "Fill an interactive PDF form in your browser: text fields, checkboxes, lists — any language. Optionally flatten the fields so nobody can change them.",
  },
  lead: { ru: "Инструмент находит все поля формы и показывает их как обычные поля ввода.", en: "The tool finds every form field and shows it as a normal input." },
  keywords: { ru: ["заполнить pdf", "заполнить бланк pdf", "сплющить форму pdf", "flatten pdf"], en: ["fill pdf", "flatten pdf form", "pdf form filler"] },
  howTo: {
    ru: ["Откройте PDF с интерактивной формой.", "Заполните появившиеся поля.", "Оставьте «Сделать поля нередактируемыми», если форму не нужно будет менять.", "Нажмите «Сохранить заполненный PDF»."],
    en: ["Open a PDF with an interactive form.", "Fill in the fields that appear.", "Keep “Make fields non-editable” on if the form shouldn't change later.", "Click “Save filled PDF”."],
  },
  about: {
    ru: [
      "Поля читаются из формы AcroForm: текст, флажки, переключатели, выпадающие списки и списки выбора. Для кириллицы внешний вид полей перерисовывается встроенным шрифтом Noto Sans, иначе русские буквы в стандартном шрифте формы не отобразятся.",
      "«Сплющивание» превращает значения в обычный текст страницы и удаляет поля: документ выглядит одинаково везде, и его нельзя случайно изменить. Формы XFA (динамические формы Adobe LiveCycle) не поддерживаются — их понимает только Acrobat.",
      PRIVACY.ru,
    ],
    en: [
      "Fields are read from the AcroForm: text, checkboxes, radio buttons, drop-downs and list boxes. For non-Latin text the field appearance is redrawn with embedded Noto Sans, otherwise such letters wouldn't show in the form's standard font.",
      "Flattening turns values into ordinary page text and removes the fields: the document looks the same everywhere and can't be changed by accident. XFA forms (dynamic Adobe LiveCycle forms) aren't supported — only Acrobat handles them.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Почему инструмент не видит поля?", a: "В файле нет интерактивной формы — например, это скан бланка. Такой документ можно подписать или добавить на него надписи водяным знаком, но полей в нём нет." },
      { q: "Зачем «сплющивать» форму?", a: "Чтобы значения нельзя было изменить и чтобы форма одинаково выглядела в любой программе, включая просмотрщики, которые плохо показывают поля." },
      { q: "Можно ли заполнить поле подписи?", a: "Нет: поле цифровой подписи требует сертификата. Изображение подписи можно поставить в «Подписать PDF»." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Why doesn't the tool find any fields?", a: "The file has no interactive form — it may be a scanned blank. You can sign it or add text with a watermark, but it has no fields." },
      { q: "Why flatten a form?", a: "So values can't be changed and the form looks the same in every app, including viewers that render fields poorly." },
      { q: "Can I fill a signature field?", a: "No: a digital signature field needs a certificate. You can place an image of your signature with “Sign PDF”." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "compress-pdf", "split-pdf"],
};

/* ───────────── n-up ───────────── */

const NUP_MARGIN = 18;
const NUP_GAP = 10;

const nupVariant = (n: 2 | 4 | 6 | 9): VariantDef => {
  const g = nupGrid({ n, sheet: PAPER.a4, page: { width: PAPER.a4[0], height: PAPER.a4[1] }, margin: NUP_MARGIN, gap: NUP_GAP });
  const land = g.sheetWidth > g.sheetHeight;
  const pct = Math.round(g.scale * 100);
  const ru = count("ru", n, ["страница", "страницы", "страниц"]);
  const en = `${n} pages`;
  const use = {
    2: { ru: "раздаточные материалы, конспекты, экономная печать книг", en: "handouts, notes, economical book printing" },
    4: { ru: "печать слайдов презентации, черновики для вычитки", en: "printing presentation slides, proof copies" },
    6: { ru: "раздатки со слайдами, обзор длинного документа", en: "slide handouts, overviews of long documents" },
    9: { ru: "контактные листы, обзор макета, шпаргалки", en: "contact sheets, layout overviews, cheat sheets" },
  }[n];
  return {
    slug: `${n}-up`,
    name: { ru: `${n} на листе`, en: `${n} per sheet` },
    title: { ru: `${n} страниц${n === 2 || n === 4 ? "ы" : ""} PDF на одном листе онлайн`, en: `${n} PDF pages per sheet online (${n}-up)` },
    description: {
      ru: `Разместите ${ru} PDF на одном листе A4: лист ${land ? "альбомный" : "книжный"}, сетка ${g.cols} × ${g.rows}, страницы уменьшаются до ${pct}%. 100 страниц уложатся в ${Math.ceil(100 / n)} листов.`,
      en: `Put ${en} of a PDF on one A4 sheet: ${land ? "landscape" : "portrait"} sheet, ${g.cols} × ${g.rows} grid, pages scaled to ${pct}%. 100 pages fit on ${Math.ceil(100 / n)} sheets.`,
    },
    lead: { ru: `Каждые ${n} страниц PDF собираются на одном листе — экономия бумаги в ${n} раз${n >= 2 && n <= 4 ? "а" : ""}.`, en: `Every ${n} PDF pages are laid out on one sheet — ${n}× less paper.` },
    props: { n },
    blocks: (l) => [
      {
        type: "facts",
        rows:
          l === "ru"
            ? [
                ["Лист A4", `${land ? "альбомный" : "книжный"}, сетка ${g.cols} × ${g.rows}`],
                ["Масштаб страниц", `${pct}% от оригинала (текст 12 pt станет ≈ ${formatNumber("ru", Math.round(12 * g.scale * 10) / 10)} pt)`],
                ["100 страниц", `${Math.ceil(100 / n)} листов, с двусторонней печатью — ${Math.ceil(100 / n / 2)}`],
                ["Когда удобно", use.ru],
              ]
            : [
                ["A4 sheet", `${land ? "landscape" : "portrait"}, ${g.cols} × ${g.rows} grid`],
                ["Page scale", `${pct}% of the original (12 pt text becomes ≈ ${formatNumber("en", Math.round(12 * g.scale * 10) / 10)} pt)`],
                ["100 pages", `${Math.ceil(100 / n)} sheets, ${Math.ceil(100 / n / 2)} double-sided`],
                ["Handy for", use.en],
              ],
      },
    ],
    faq: faq(
      [
        {
          q: "Будет ли текст читаемым?",
          a: `Страницы уменьшаются до ${pct}%: текст 12 pt станет около ${formatNumber("ru", Math.round(12 * g.scale * 10) / 10)} pt. ${g.scale >= 0.6 ? "Это как мелкий шрифт в книге — читается без труда." : g.scale >= 0.4 ? "Слайды и крупный текст читаются хорошо, обычный документ — с трудом; для текста лучше 2 страницы на листе." : "Подходит для обзора и слайдов с крупным текстом, но не для чтения документов."}`,
        },
        { q: "Потеряется ли качество?", a: "Нет: страницы вставляются как вектор, а не картинка, поэтому при печати они такие же чёткие, как оригинал, просто меньше." },
      ],
      [
        {
          q: "Will the text be readable?",
          a: `Pages are scaled to ${pct}%: 12 pt text becomes about ${formatNumber("en", Math.round(12 * g.scale * 10) / 10)} pt. ${g.scale >= 0.6 ? "That's like the small print in a book — easy to read." : g.scale >= 0.4 ? "Slides and large text read well, a regular document with effort; for text 2 per sheet is better." : "Good for overviews and slides with large text, not for reading documents."}`,
        },
        { q: "Is quality lost?", a: "No: pages are placed as vectors, not images, so they print as crisp as the original — just smaller." },
      ],
    ),
  };
};

export const nupTool: ToolDef = {
  slug: "n-up-pdf",
  component: "pdf/nup",
  icon: "LayoutDashboard",
  name: { ru: "Несколько страниц PDF на листе", en: "N-up PDF (pages per sheet)" },
  title: { ru: "Несколько страниц PDF на одном листе онлайн", en: "N-up PDF online — multiple pages per sheet" },
  h1: { ru: "Несколько страниц PDF на одном листе", en: "Multiple PDF pages per sheet" },
  description: {
    ru: "Разместите 2, 4, 6, 9 или 16 страниц PDF на одном листе A4, A3 или Letter: ориентация подбирается сама, порядок Z или N, рамки. Страницы остаются векторными.",
    en: "Place 2, 4, 6, 9 or 16 PDF pages on one A4, A3 or Letter sheet: orientation is chosen automatically, Z or N order, optional borders. Pages stay vector.",
  },
  lead: { ru: "Схема листа сразу показывает, как разместятся страницы.", en: "A sheet diagram shows right away how the pages will be laid out." },
  keywords: { ru: ["2 страницы на листе pdf", "4 страницы на листе pdf", "печать нескольких страниц на одном листе"], en: ["2 pages per sheet pdf", "4 up pdf", "pdf imposition"] },
  howTo: {
    ru: ["Откройте PDF.", "Выберите число страниц на листе, формат листа и порядок.", "Проверьте схему: сетка и ориентация подбираются так, чтобы страницы были максимально крупными.", "Нажмите «Создать PDF» и распечатайте результат."],
    en: ["Open a PDF.", "Pick pages per sheet, sheet size and order.", "Check the diagram: the grid and orientation are chosen to keep pages as large as possible.", "Click “Create PDF” and print the result."],
  },
  about: {
    ru: [
      "Сетка и ориентация выбираются перебором: для 2 и 6 страниц на A4 выигрывает альбомный лист, для 4 и 9 — книжный. Страницы уменьшаются пропорционально, по центру ячейки, с учётом их поворота и области обрезки.",
      "Страницы вставляются как вложенные векторные объекты, а не картинки: текст остаётся текстом, а качество печати — как у оригинала. Порядок Z (по строкам) привычен для слайдов, N (по столбцам) — для колонок текста.",
      PRIVACY.ru,
    ],
    en: [
      "Grid and orientation are chosen by trying all options: for 2 and 6 pages on A4 a landscape sheet wins, for 4 and 9 a portrait one. Pages are scaled proportionally, centred in their cells, honouring rotation and crop box.",
      "Pages are placed as embedded vector objects, not images: text stays text and print quality matches the original. Z order (by rows) suits slides, N order (by columns) suits text columns.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Чем это лучше настройки «Несколько страниц на листе» в принтере?", a: "Результат — обычный PDF: его можно отправить в копицентр, распечатать с телефона или открыть на любом компьютере, и раскладка не зависит от драйвера." },
      { q: "Можно ли сделать буклет?", a: "Нет, здесь страницы идут подряд. Для брошюры нужна особая раскладка с переставленными страницами — этой функции здесь нет." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Why not just use the printer's “pages per sheet”?", a: "You get an ordinary PDF: send it to a print shop, print from a phone or open it anywhere, and the layout doesn't depend on a driver." },
      { q: "Can I make a booklet?", a: "No, pages here go in sequence. A booklet needs a special imposition with reordered pages, which this tool doesn't do." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "compress-pdf", "rotate-pdf"],
  variants: { title: { ru: "Страниц на листе", en: "Pages per sheet" }, list: () => ([2, 4, 6, 9] as const).map(nupVariant) },
};

/* ───────────── metadata ───────────── */

export const metadataTool: ToolDef = {
  slug: "edit-pdf-metadata",
  component: "pdf/metadata",
  icon: "Tags",
  name: { ru: "Метаданные PDF", en: "PDF metadata" },
  title: { ru: "Метаданные PDF онлайн — посмотреть и изменить", en: "Edit PDF metadata online — view and change" },
  h1: { ru: "Посмотреть и изменить метаданные PDF", en: "View and edit PDF metadata" },
  description: {
    ru: "Посмотрите и измените метаданные PDF: заголовок, автора, тему, ключевые слова, программу и даты создания. Можно очистить всё, включая XMP, перед отправкой.",
    en: "View and change PDF metadata: title, author, subject, keywords, creator app and dates. Clear everything, XMP included, before sharing a file.",
  },
  lead: { ru: "Метаданные показываются как есть — чтение файла их не меняет.", en: "Metadata is shown as is — reading the file doesn't change it." },
  keywords: { ru: ["свойства pdf", "изменить автора pdf", "удалить метаданные pdf", "заголовок pdf"], en: ["pdf properties", "change pdf author", "remove pdf metadata", "pdf title"] },
  howTo: {
    ru: ["Откройте PDF — поля заполнятся текущими значениями.", "Измените нужные поля или нажмите «Очистить все поля».", "Решите, удалять ли XMP-метаданные.", "Нажмите «Сохранить метаданные» и скачайте файл."],
    en: ["Open a PDF — the fields fill with current values.", "Edit what you need or click “Clear all fields”.", "Decide whether to remove XMP metadata.", "Click “Save metadata” and download the file."],
  },
  about: {
    ru: [
      "Многие библиотеки при открытии PDF сразу подменяют поле Producer и дату изменения. Здесь файл читается без этого, поэтому вы видите настоящие значения: чем создан документ, кто автор, когда он правился.",
      "Заголовок (Title) показывается во вкладке браузера и в поиске, поэтому его стоит заполнить перед публикацией. Кроме словаря Info, в PDF бывает XMP-блок с теми же данными — Acrobat может показывать его значения, поэтому при правке его разумно удалить.",
      PRIVACY.ru,
    ],
    en: [
      "Many libraries silently overwrite the Producer field and modification date when opening a PDF. Here the file is read without that, so you see the real values: what made the document, who wrote it, when it was edited.",
      "The Title appears in browser tabs and search results, so fill it in before publishing. Besides the Info dictionary, a PDF may hold an XMP block with the same data — Acrobat may prefer it, so removing it when editing is sensible.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Как удалить все метаданные перед отправкой?", a: "Нажмите «Очистить все поля», оставьте включённым удаление XMP и сохраните файл — в нём не останется автора, программы и дат." },
      { q: "Почему после сохранения в Acrobat видно старое название?", a: "Acrobat читает XMP-метаданные, если они есть. Включите «Удалить XMP-метаданные» при сохранении." },
      { q: "Меняется ли что-то кроме метаданных?", a: "Нет: страницы, текст и картинки остаются прежними, файл лишь пересобирается с новыми сведениями." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "How do I remove all metadata before sharing?", a: "Click “Clear all fields”, keep XMP removal on and save — no author, app or dates remain." },
      { q: "Why does Acrobat still show the old title?", a: "Acrobat reads XMP metadata when present. Turn on “Remove XMP metadata” when saving." },
      { q: "Does anything else change?", a: "No: pages, text and images stay the same; the file is simply rewritten with the new details." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["compress-pdf", "merge-pdf", "split-pdf"],
};

/* ───────────── protection ───────────── */

export const protectTool: ToolDef = {
  slug: "protect-pdf",
  component: "pdf/protect",
  icon: "Lock",
  name: { ru: "Поставить пароль на PDF", en: "Protect PDF with a password" },
  title: { ru: "Поставить пароль на PDF онлайн — шифрование AES-256", en: "Password protect PDF online — AES-256 encryption" },
  h1: { ru: "Поставить пароль на PDF", en: "Password-protect a PDF" },
  description: {
    ru: "Зашифруйте PDF паролем по стандарту AES-256: без пароля файл не откроется. Можно запретить печать, копирование и изменение. Результат проверяется.",
    en: "Encrypt a PDF with a password using AES-256: it won't open without it. Optionally block printing, copying and editing. The result is verified.",
  },
  lead: { ru: "Файл шифруется в браузере и открывается только с вашим паролем.", en: "The file is encrypted in your browser and opens only with your password." },
  keywords: { ru: ["зашифровать pdf", "защитить pdf паролем", "запаролить pdf"], en: ["encrypt pdf", "lock pdf", "add password to pdf"] },
  howTo: {
    ru: ["Откройте PDF.", "Придумайте пароль (от 6 символов) и повторите его.", "Отметьте, что разрешить: печать, копирование, изменение, комментарии.", "Нажмите «Защитить PDF» и скачайте файл."],
    en: ["Open a PDF.", "Choose a password (6+ characters) and repeat it.", "Tick what to allow: printing, copying, editing, comments.", "Click “Protect PDF” and download the file."],
  },
  about: {
    ru: [
      "Используется шифрование AES-256 (PDF 2.0, ревизия 6) — сильнейший стандартный алгоритм PDF, который открывают Acrobat, браузеры, macOS, iOS и Android. Шифруется всё содержимое: текст, картинки и шрифты, а не только «флажок» защиты.",
      "После шифрования файл сразу перепроверяется: он должен требовать пароль и открываться с ним. Запреты печати и копирования соблюдают добросовестные программы, но надёжно защищает только пароль на открытие.",
      PRIVACY.ru,
    ],
    en: [
      "AES-256 encryption is used (PDF 2.0, revision 6) — the strongest standard PDF algorithm, opened by Acrobat, browsers, macOS, iOS and Android. All content is encrypted — text, images and fonts — not just a “protected” flag.",
      "Right after encryption the file is re-checked: it must ask for the password and open with it. Print and copy restrictions are honoured by well-behaved apps, but only the open password truly protects the content.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Что будет, если я забуду пароль?", a: "Открыть файл не получится — ни у нас, ни у кого-то ещё нет «запасного ключа». Храните пароль в менеджере паролей." },
      { q: "Откроется ли файл на телефоне?", a: "Да: AES-256 поддерживают встроенные просмотрщики iOS и Android, браузеры Chrome, Edge, Firefox, Safari и Adobe Acrobat Reader начиная с версии X (2010)." },
      { q: "Зачем пароль владельца?", a: "Он снимает запреты на печать и изменение. Если его не задать, будет создан случайный — ограничения станут постоянными, но открыть файл всегда можно основным паролем." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "What if I forget the password?", a: "The file won't open — neither we nor anyone else has a spare key. Keep the password in a password manager." },
      { q: "Will it open on a phone?", a: "Yes: AES-256 is supported by the built-in viewers of iOS and Android, by Chrome, Edge, Firefox, Safari and by Adobe Acrobat Reader X (2010) and later." },
      { q: "What is the owner password for?", a: "It lifts print and edit restrictions. Left empty, a random one is generated — restrictions become permanent, but the file always opens with the main password." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["compress-pdf", "merge-pdf", "split-pdf"],
};

export const unlockTool: ToolDef = {
  slug: "unlock-pdf",
  component: "pdf/unlock",
  icon: "LockOpen",
  name: { ru: "Снять пароль с PDF", en: "Unlock PDF" },
  title: { ru: "Снять пароль с PDF онлайн, если вы его знаете", en: "Unlock PDF online — remove a password you know" },
  h1: { ru: "Снять пароль с PDF", en: "Remove a PDF password" },
  description: {
    ru: "Уберите пароль и ограничения из PDF, зная пароль: файл расшифровывается в браузере и дальше открывается без запроса. Поддерживаются AES-256, AES-128 и RC4.",
    en: "Remove the password and restrictions from a PDF you have the password for: it's decrypted in your browser and opens without prompts. AES-256, AES-128 and RC4.",
  },
  lead: { ru: "Введите пароль один раз — сохранённая копия больше не будет его спрашивать.", en: "Enter the password once — the saved copy won't ask for it again." },
  keywords: { ru: ["убрать пароль с pdf", "разблокировать pdf", "расшифровать pdf", "снять защиту pdf"], en: ["remove pdf password", "decrypt pdf", "pdf password remover"] },
  howTo: {
    ru: ["Откройте PDF.", "Если файл просит пароль, введите его.", "Нажмите «Снять пароль».", "Скачайте файл без защиты."],
    en: ["Open a PDF.", "If it asks for a password, enter it.", "Click “Remove password”.", "Download the unprotected file."],
  },
  about: {
    ru: [
      "Инструмент не подбирает и не взламывает пароли: чтобы расшифровать файл с паролем на открытие, его нужно знать. Файлы, которые открываются без пароля, но запрещают печать или копирование (защита паролем владельца), разблокируются сразу.",
      "После расшифровки файл сохраняется заново и проверяется: в нём не должно остаться шифрования. Содержимое, закладки и формы не меняются.",
      PRIVACY.ru,
    ],
    en: [
      "The tool doesn't guess or crack passwords: to decrypt a file with an open password you have to know it. Files that open without a password but block printing or copying (owner-password protection) are unlocked right away.",
      "After decryption the file is saved anew and checked: no encryption may remain. Content, bookmarks and forms stay the same.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Можно ли снять пароль, если я его не знаю?", a: "Нет. Современное шифрование PDF (AES) без пароля не обходится, а подбор паролей мы не предлагаем." },
      { q: "Что за «защита от печати» без пароля на открытие?", a: "Это пароль владельца: файл открывается, но программы запрещают печать или копирование. Такие ограничения снимаются без ввода пароля." },
      { q: "Поддерживается ли защита сертификатом?", a: "Нет: файлы, зашифрованные цифровым сертификатом (Adobe PubSec), открываются только с закрытым ключом — инструмент сообщит об этом." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Can I remove a password I don't know?", a: "No. Modern PDF encryption (AES) can't be bypassed without the password, and we don't offer password guessing." },
      { q: "What is “print protection” without an open password?", a: "That's an owner password: the file opens, but apps block printing or copying. Such restrictions are removed without entering a password." },
      { q: "Is certificate encryption supported?", a: "No: files encrypted with a digital certificate (Adobe PubSec) open only with the private key — the tool will tell you so." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["merge-pdf", "compress-pdf", "split-pdf"],
};
