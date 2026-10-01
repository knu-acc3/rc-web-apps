import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { PAPER, mmToPt } from "../lib/geometry";
import { PRIVACY, PRIVACY_QA, faq } from "./shared";

/* ───────────── images → PDF ───────────── */

/** Physical size of a photo at different resolutions — the numbers behind "fit to image". */
function sizeTable(locale: Locale): Block {
  const rows = [
    [4032, 3024, 72],
    [4032, 3024, 300],
    [2480, 3508, 300],
    [1240, 1754, 150],
    [1920, 1080, 96],
  ].map(([w, h, dpi]) => {
    const cm = (px: number) => ((px / dpi) * 2.54).toFixed(1).replace(".", locale === "ru" ? "," : ".");
    return [`${w} × ${h}`, `${dpi}`, `${cm(w)} × ${cm(h)} ${locale === "ru" ? "см" : "cm"}`];
  });
  return {
    type: "table",
    title: locale === "ru" ? "Пиксели и физический размер страницы" : "Pixels and physical page size",
    head: locale === "ru" ? ["Пикселей", "DPI в файле", "Размер при «По размеру картинки»"] : ["Pixels", "DPI in file", "Size with “Same as image”"],
    rows,
    caption: locale === "ru" ? "Размер = пиксели ÷ DPI × 2,54 см; без DPI в файле берётся 96" : "Size = pixels ÷ DPI × 2.54 cm; 96 DPI when the file has none",
  };
}

const a4mm = `${Math.round(PAPER.a4[0] / mmToPt(1))} × ${Math.round(PAPER.a4[1] / mmToPt(1))}`;

interface ImgFmt {
  slug: string;
  formats: "all" | "jpg" | "png" | "heic" | "webp";
  icon: string;
  popular?: boolean;
  name: { ru: string; en: string };
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  lead: { ru: string; en: string };
  keywords: { ru: string[]; en: string[] };
  how: { ru: string; en: string };
  qa: { ru: { q: string; a: string }[]; en: { q: string; a: string }[] };
  related?: string[];
}

function imageTool(f: ImgFmt): ToolDef {
  return {
    slug: f.slug,
    component: "pdf/images-to-pdf",
    icon: f.icon,
    popular: f.popular,
    props: { formats: f.formats },
    name: f.name,
    title: f.title,
    h1: f.name,
    description: f.description,
    lead: f.lead,
    keywords: f.keywords,
    howTo: {
      ru: ["Перетащите картинки в поле или выберите их — можно сразу много.", "Расставьте их перетаскиванием: каждая картинка станет страницей.", "Выберите размер страницы (A4, Letter или по размеру картинки), поля и масштаб.", "Нажмите «Создать PDF» и скачайте файл."],
      en: ["Drop images into the box or choose them — many at once is fine.", "Drag them into order: each image becomes a page.", "Pick the page size (A4, Letter or same as image), margins and scale.", "Click “Create PDF” and download the file."],
    },
    about: {
      ru: [f.how.ru, `На A4 (${a4mm} мм) картинка вписывается в поля целиком и не выходит за них; ориентация страницы по умолчанию подстраивается под снимок. Режим «По размеру картинки» делает страницу размером с изображение, считая пиксели по DPI из файла (или 96 DPI, если его нет), — большие фото не превращаются в страницы шириной в метр только из-за 72 DPI.`, PRIVACY.ru],
      en: [f.how.en, `On A4 (${a4mm} mm) the image is fitted inside the margins and never crosses them; page orientation follows the picture by default. “Same as image” makes the page as large as the picture, converting pixels with the DPI stored in the file (or 96 DPI if there is none).`, PRIVACY.en],
    },
    faq: faq([...f.qa.ru, PRIVACY_QA.ru], [...f.qa.en, PRIVACY_QA.en]),
    related: f.related,
    blocks: (l) => [sizeTable(l)],
  };
}

export const imageToPdfTool = imageTool({
  slug: "image-to-pdf",
  formats: "all",
  icon: "FileImage",
  name: { ru: "Картинки в PDF", en: "Images to PDF" },
  title: { ru: "Картинки в PDF онлайн — JPG, PNG, HEIC, WebP в один файл", en: "Image to PDF online — JPG, PNG, HEIC, WebP in one file" },
  description: {
    ru: "Соберите фото и картинки в один PDF: JPG, PNG, HEIC с iPhone, WebP, AVIF, GIF, BMP. Порядок перетаскиванием, A4 или размер картинки, поля. Без загрузки.",
    en: "Put photos and pictures into one PDF: JPG, PNG, iPhone HEIC, WebP, AVIF, GIF, BMP. Drag to order, A4 or image size, margins. Nothing is uploaded.",
  },
  lead: { ru: "Каждая картинка становится страницей PDF — в нужном вам порядке.", en: "Every image becomes a PDF page — in the order you choose." },
  keywords: { ru: ["фото в pdf", "изображение в pdf", "сделать pdf из фото", "скан в pdf"], en: ["photo to pdf", "picture to pdf", "images to pdf converter"] },
  how: {
    ru: "JPEG вставляется в PDF байт в байт, без пересжатия, PNG — без потерь. Форматов HEIC, WebP, AVIF, GIF и BMP в PDF нет, поэтому они сохраняются как JPEG с качеством 92% или, если есть прозрачность, как PNG. Поворот фото с телефона (EXIF) учитывается автоматически.",
    en: "JPEG is embedded byte for byte without re-compression, PNG losslessly. PDF has no HEIC, WebP, AVIF, GIF or BMP, so those are stored as 92%-quality JPEG, or PNG when they have transparency. Phone photo rotation (EXIF) is applied automatically.",
  },
  qa: {
    ru: [
      { q: "Сколько картинок можно добавить?", a: "Сколько выдержит память устройства: десятки фото с телефона обрабатываются без проблем. Каждая картинка — отдельная страница." },
      { q: "Почему фото с телефона не лежит на боку?", a: "Телефон хранит поворот в EXIF, а PDF-просмотрщики его не читают. Инструмент сам применяет этот поворот при создании страницы." },
      { q: "Упадёт ли качество?", a: "JPEG и PNG не пересжимаются. Остальные форматы пересохраняются в JPEG 92% или PNG — на глаз разницы нет." },
    ],
    en: [
      { q: "How many images can I add?", a: "As many as your device's memory allows: dozens of phone photos are fine. Each image is its own page." },
      { q: "Why aren't my phone photos lying on their side?", a: "Phones store rotation in EXIF, which PDF viewers ignore. The tool applies that rotation itself when building the page." },
      { q: "Will quality drop?", a: "JPEG and PNG are not re-compressed. Other formats are re-saved as 92% JPEG or PNG — the difference isn't visible." },
    ],
  },
  related: ["jpg-to-pdf", "merge-pdf", "compress-pdf", "image-converter", "compress-image"],
});

export const jpgToPdfTool = imageTool({
  slug: "jpg-to-pdf",
  formats: "jpg",
  icon: "FileImage",
  popular: true,
  name: { ru: "JPG в PDF", en: "JPG to PDF" },
  title: { ru: "JPG в PDF онлайн — фото в PDF без потери качества", en: "JPG to PDF online — photos to PDF without quality loss" },
  description: {
    ru: "Преобразуйте JPG в PDF без пересжатия: снимки вставляются как есть, в исходном качестве. Несколько фото в один файл, A4 или размер фото, поля 0–20 мм.",
    en: "Convert JPG to PDF without re-compression: photos are embedded as they are, at original quality. Several photos in one file, A4 or photo size, 0–20 mm margins.",
  },
  lead: { ru: "Фото в формате JPG вставляются в PDF без пересжатия — качество не теряется.", en: "JPG photos go into the PDF without re-compression — no quality is lost." },
  keywords: { ru: ["jpeg в pdf", "конвертировать jpg в pdf", "фото jpg в pdf", "несколько jpg в один pdf"], en: ["jpeg to pdf", "convert jpg to pdf", "multiple jpg to one pdf"] },
  how: {
    ru: "Формат PDF умеет хранить JPEG напрямую, поэтому файл снимка вставляется в документ байт в байт: никакого повторного сжатия, размер PDF почти равен сумме размеров фото. Поворот из EXIF учитывается, так что вертикальные снимки с телефона не лягут набок.",
    en: "PDF can hold JPEG directly, so each photo file is embedded byte for byte: no second compression, and the PDF weighs about the same as the photos together. EXIF rotation is honoured, so portrait phone shots don't end up sideways.",
  },
  qa: {
    ru: [
      { q: "Почему PDF весит столько же, сколько фото?", a: "Потому что JPEG вставляется без изменений. Чтобы уменьшить файл, после создания PDF воспользуйтесь «Сжать PDF» — там можно уменьшить картинки." },
      { q: "Как сделать страницы формата A4?", a: "Выберите «A4» в размере страницы: фото впишется в поля, а ориентация листа подстроится под снимок." },
      { q: "Можно ли вставить фото без полей?", a: "Да: выберите «Без полей» — на A4 фото займёт всю ширину или высоту листа, а в режиме «По размеру картинки» страница совпадёт со снимком." },
    ],
    en: [
      { q: "Why does the PDF weigh the same as the photos?", a: "Because JPEG is embedded unchanged. To shrink it, use “Compress PDF” afterwards — it can scale images down." },
      { q: "How do I get A4 pages?", a: "Choose “A4” as the page size: the photo is fitted inside the margins and the sheet orientation follows the picture." },
      { q: "Can I place photos without margins?", a: "Yes: choose “None” — on A4 the photo fills the width or height, and with “Same as image” the page matches the photo exactly." },
    ],
  },
});

export const pngToPdfTool = imageTool({
  slug: "png-to-pdf",
  formats: "png",
  icon: "FileImage",
  name: { ru: "PNG в PDF", en: "PNG to PDF" },
  title: { ru: "PNG в PDF онлайн — без потерь и с прозрачностью", en: "PNG to PDF online — lossless, transparency kept" },
  description: {
    ru: "Конвертируйте PNG в PDF без потерь: скриншоты, схемы и сканы остаются чёткими, прозрачность сохраняется. Несколько PNG в один файл, A4 или размер картинки.",
    en: "Convert PNG to PDF losslessly: screenshots, diagrams and scans stay crisp and transparency is kept. Several PNGs in one file, A4 or image size.",
  },
  lead: { ru: "PNG попадает в PDF без потерь — текст на скриншотах остаётся резким.", en: "PNG goes into the PDF losslessly — text in screenshots stays sharp." },
  keywords: { ru: ["png в pdf", "скриншот в pdf", "конвертировать png в pdf"], en: ["convert png to pdf", "screenshot to pdf"] },
  how: {
    ru: "PNG не превращается в JPEG: пиксели сохраняются без потерь, а прозрачный фон становится прозрачным и в PDF (альфа-канал записывается отдельной маской). Поэтому скриншоты, схемы и чертежи выглядят так же чётко, как исходники. DPI из файла (блок pHYs) используется для размера страницы.",
    en: "PNG is not turned into JPEG: pixels are kept losslessly, and a transparent background stays transparent in the PDF (the alpha channel is stored as a separate mask). Screenshots, diagrams and drawings stay as crisp as the originals. The file's DPI (pHYs chunk) sets the page size.",
  },
  qa: {
    ru: [
      { q: "Почему PDF из PNG бывает больше исходника?", a: "PNG внутри PDF сжимается тем же алгоритмом (Deflate), но без некоторых PNG-оптимизаций, поэтому размер может вырасти на несколько процентов. Качество при этом не меняется." },
      { q: "Сохранится ли прозрачность?", a: "Да, прозрачные области остаются прозрачными; на белой странице они выглядят белыми." },
    ],
    en: [
      { q: "Why can a PDF from PNG be larger than the source?", a: "PNG inside PDF uses the same Deflate compression but without some PNG-specific optimizations, so the size can grow a few percent. Quality stays identical." },
      { q: "Is transparency kept?", a: "Yes, transparent areas stay transparent; on a white page they look white." },
    ],
  },
  related: ["jpg-to-pdf", "merge-pdf", "compress-pdf"],
});

export const heicToPdfTool = imageTool({
  slug: "heic-to-pdf",
  formats: "heic",
  icon: "FileImage",
  name: { ru: "HEIC в PDF", en: "HEIC to PDF" },
  title: { ru: "HEIC в PDF онлайн — фото с iPhone в PDF", en: "HEIC to PDF online — iPhone photos to PDF" },
  description: {
    ru: "Сохраните фото с iPhone (HEIC, HEIF) в PDF прямо в браузере: несколько снимков в один файл, A4 или размер фото. Конвертация идёт на устройстве, без загрузки.",
    en: "Turn iPhone photos (HEIC, HEIF) into a PDF right in your browser: several shots in one file, A4 or photo size. Conversion runs on your device — no uploads.",
  },
  lead: { ru: "Фото с iPhone в формате HEIC превращаются в страницы PDF.", en: "iPhone photos in HEIC format become PDF pages." },
  keywords: { ru: ["heic в pdf", "фото с айфона в pdf", "heif в pdf"], en: ["heif to pdf", "iphone photo to pdf"] },
  how: {
    ru: "iPhone с iOS 11 по умолчанию снимает в HEIC — он вдвое компактнее JPEG, но формат PDF его не поддерживает. Инструмент расшифровывает HEIC прямо в браузере (библиотекой libheif, скомпилированной в WebAssembly) и вставляет снимок в PDF как JPEG с качеством 92%.",
    en: "iPhones shoot HEIC by default since iOS 11 — it's half the size of JPEG, but PDF doesn't support it. The tool decodes HEIC right in your browser (libheif compiled to WebAssembly) and embeds the photo in the PDF as a 92%-quality JPEG.",
  },
  qa: {
    ru: [
      { q: "Почему HEIC-фото долго обрабатываются?", a: "Декодер HEIC загружается при первом использовании (около 3 МБ), а каждый 12-мегапиксельный снимок расшифровывается процессором вашего устройства — обычно это 1–2 секунды на фото." },
      { q: "Не видно превью HEIC — это нормально?", a: "Да: большинство браузеров, кроме Safari, не умеют показывать HEIC, поэтому вместо превью стоит значок. В PDF фото попадёт как положено." },
    ],
    en: [
      { q: "Why do HEIC photos take a moment?", a: "The HEIC decoder loads on first use (about 3 MB), and each 12-megapixel shot is decoded by your device's CPU — usually 1–2 seconds per photo." },
      { q: "No HEIC preview — is that normal?", a: "Yes: most browsers except Safari can't display HEIC, so an icon is shown instead. The photo still goes into the PDF properly." },
    ],
  },
  related: ["jpg-to-pdf", "compress-pdf", "merge-pdf"],
});

export const webpToPdfTool = imageTool({
  slug: "webp-to-pdf",
  formats: "webp",
  icon: "FileImage",
  name: { ru: "WebP в PDF", en: "WebP to PDF" },
  title: { ru: "WebP в PDF онлайн — картинки WebP в один PDF", en: "WebP to PDF online — WebP images into one PDF" },
  description: {
    ru: "Конвертируйте картинки WebP в PDF: несколько файлов в один документ, A4 или размер изображения. Прозрачные WebP сохраняются как PNG, обычные — как JPEG 92%.",
    en: "Convert WebP images to PDF: several files into one document, A4 or image size. Transparent WebP is stored as PNG, the rest as 92% JPEG.",
  },
  lead: { ru: "Картинки WebP (например, сохранённые с сайтов) становятся страницами PDF.", en: "WebP images (like ones saved from websites) become PDF pages." },
  keywords: { ru: ["webp в pdf", "конвертировать webp в pdf"], en: ["convert webp to pdf"] },
  how: {
    ru: "WebP — формат веб-картинок от Google; браузеры сохраняют в нём изображения с сайтов, но в PDF его вставить нельзя. Инструмент декодирует WebP средствами браузера и проверяет прозрачность: картинки с прозрачным фоном записываются без потерь в PNG, остальные — в JPEG с качеством 92%.",
    en: "WebP is Google's web image format; browsers save website images in it, but it can't go into a PDF as is. The tool decodes WebP with the browser and checks for transparency: images with a transparent background are stored losslessly as PNG, the rest as 92%-quality JPEG.",
  },
  qa: {
    ru: [
      { q: "Анимированный WebP тоже подойдёт?", a: "В PDF попадёт только первый кадр анимации — формат PDF не хранит анимацию." },
      { q: "Почему PDF из WebP больше исходных картинок?", a: "WebP сжимает лучше JPEG, а PDF хранит картинки в JPEG или PNG. Обычно файл вырастает на 20–40%; если это важно, после создания воспользуйтесь «Сжать PDF»." },
    ],
    en: [
      { q: "Does animated WebP work?", a: "Only the first frame goes into the PDF — the PDF format can't store animation." },
      { q: "Why is the PDF larger than the WebP images?", a: "WebP compresses better than JPEG, while PDF stores images as JPEG or PNG. The file usually grows 20–40%; use “Compress PDF” afterwards if that matters." },
    ],
  },
  related: ["jpg-to-pdf", "merge-pdf", "pdf-to-jpg"],
});

/* ───────────── PDF → images ───────────── */

function dpiTable(locale: Locale, ext: string): Block {
  const a4 = PAPER.a4;
  const rows = [72, 150, 300].map((dpi) => {
    const w = Math.round((a4[0] / 72) * dpi);
    const h = Math.round((a4[1] / 72) * dpi);
    const use = locale === "ru" ? { 72: "просмотр на экране, превью", 150: "документы, отправка в мессенджере", 300: "печать, мелкий текст, OCR" } : { 72: "on-screen viewing, previews", 150: "documents, sending in chats", 300: "printing, small text, OCR" };
    return [`${dpi} DPI`, `${w} × ${h} px`, (use as Record<number, string>)[dpi]];
  });
  return {
    type: "table",
    title: locale === "ru" ? `Размер ${ext} для страницы A4` : `${ext} size for an A4 page`,
    head: locale === "ru" ? ["Качество", "Пикселей", "Для чего"] : ["Quality", "Pixels", "Best for"],
    rows,
  };
}

interface ToImg {
  slug: string;
  format: "jpg" | "png" | "webp";
  choose?: boolean;
  popular?: boolean;
  name: { ru: string; en: string };
  title: { ru: string; en: string };
  description: { ru: string; en: string };
  lead: { ru: string; en: string };
  keywords: { ru: string[]; en: string[] };
  why: { ru: string; en: string };
  qa: { ru: { q: string; a: string }[]; en: { q: string; a: string }[] };
  related?: string[];
}

function toImageTool(f: ToImg): ToolDef {
  const ext = f.choose ? "PNG/JPG" : f.format.toUpperCase();
  return {
    slug: f.slug,
    component: "pdf/to-images",
    icon: "Images",
    popular: f.popular,
    props: { format: f.format, choose: !!f.choose },
    name: f.name,
    title: f.title,
    h1: f.name,
    description: f.description,
    lead: f.lead,
    keywords: f.keywords,
    howTo: {
      ru: ["Откройте PDF.", "Выберите качество: 72, 150 или 300 DPI, и при необходимости страницы — например, «1-3».", `Нажмите «Сохранить как ${ext}».`, "Скачайте картинки по одной или все сразу одним ZIP."],
      en: ["Open a PDF.", "Choose the quality — 72, 150 or 300 DPI — and, if needed, pages such as “1-3”.", `Click “Save as ${ext}”.`, "Download the images one by one or all at once as a ZIP."],
    },
    about: {
      ru: [f.why.ru, "Страницы рисуются движком pdf.js (тот же, что в Firefox) с учётом поворота и области обрезки. Рендер идёт по одной странице с освобождением памяти, а перед запуском проверяется, хватит ли её, — на телефоне большой документ в 300 DPI не «повесит» вкладку.", PRIVACY.ru],
      en: [f.why.en, "Pages are drawn by pdf.js (the engine inside Firefox), honouring rotation and the crop box. Rendering goes one page at a time with memory freed in between, and a budget check stops a huge 300 DPI job before it can crash a phone tab.", PRIVACY.en],
    },
    faq: faq(
      [
        { q: "Какое DPI выбрать?", a: "150 DPI — хороший баланс для документов: страница A4 выходит около 1240 × 1754 пикселей. Для печати и мелкого текста берите 300 DPI, для превью — 72 DPI." },
        ...f.qa.ru,
        PRIVACY_QA.ru,
      ],
      [
        { q: "Which DPI should I pick?", a: "150 DPI is a good balance for documents: an A4 page comes out around 1240 × 1754 pixels. Use 300 DPI for printing and small text, 72 DPI for previews." },
        ...f.qa.en,
        PRIVACY_QA.en,
      ],
    ),
    related: f.related,
    blocks: (l) => [dpiTable(l, f.choose ? (l === "ru" ? "картинки" : "image") : f.format.toUpperCase())],
  };
}

export const pdfToImageTool = toImageTool({
  slug: "pdf-to-image",
  format: "png",
  choose: true,
  name: { ru: "PDF в картинки", en: "PDF to image" },
  title: { ru: "PDF в картинки онлайн — сохранить страницы как PNG или JPG", en: "PDF to image online — save pages as PNG or JPG" },
  description: {
    ru: "Сохраните страницы PDF как картинки PNG, JPG или WebP с качеством 72, 150 или 300 DPI. Все страницы или выбранные, скачивание по одной или ZIP-архивом.",
    en: "Save PDF pages as PNG, JPG or WebP images at 72, 150 or 300 DPI. All pages or selected ones, downloaded one by one or as a ZIP archive.",
  },
  lead: { ru: "Каждая страница PDF превращается в отдельное изображение.", en: "Every PDF page becomes a separate image." },
  keywords: { ru: ["pdf в изображение", "pdf в фото", "конвертировать pdf в картинку"], en: ["pdf to picture", "convert pdf to image"] },
  why: {
    ru: "PNG подходит для документов с текстом и схемами — он без потерь; JPG — для страниц с фотографиями и когда важен размер; WebP даёт файлы меньше JPG при том же качестве, но сохранять его умеют не все браузеры.",
    en: "PNG suits documents with text and diagrams — it's lossless; JPG suits photo-heavy pages and small sizes; WebP is smaller than JPG at the same quality, but not every browser can save it.",
  },
  qa: {
    ru: [{ q: "Какой формат выбрать?", a: "Для текста и чертежей — PNG (чёткие буквы без артефактов), для фото и сканов — JPG, для публикации на сайте — WebP." }],
    en: [{ q: "Which format should I choose?", a: "PNG for text and drawings (crisp letters, no artefacts), JPG for photos and scans, WebP for publishing on the web." }],
  },
  related: ["pdf-to-jpg", "jpg-to-pdf", "compress-pdf"],
});

export const pdfToJpgTool = toImageTool({
  slug: "pdf-to-jpg",
  format: "jpg",
  popular: true,
  name: { ru: "PDF в JPG", en: "PDF to JPG" },
  title: { ru: "PDF в JPG онлайн — каждая страница как фото", en: "PDF to JPG online — every page as a photo" },
  description: {
    ru: "Конвертируйте PDF в JPG: каждая страница — отдельный снимок с качеством 72, 150 или 300 DPI. Можно выбрать страницы и скачать всё одним ZIP. Без загрузки.",
    en: "Convert PDF to JPG: each page becomes a separate image at 72, 150 or 300 DPI. Pick pages and download everything as one ZIP. No uploads.",
  },
  lead: { ru: "Страницы PDF сохраняются как JPG — удобно отправить в мессенджер или вставить в презентацию.", en: "PDF pages are saved as JPG — easy to send in a chat or drop into a presentation." },
  keywords: { ru: ["pdf в jpeg", "pdf в фото", "конвертер pdf в jpg", "сохранить pdf как jpg"], en: ["pdf to jpeg", "convert pdf to jpg", "save pdf as jpg"] },
  why: {
    ru: "JPG — самый совместимый формат картинок: его откроет любой телефон, мессенджер и соцсеть. Страницы сохраняются с качеством 92% на белом фоне, поэтому текст остаётся чётким, а файлы — компактными.",
    en: "JPG is the most compatible image format: any phone, chat app or social network opens it. Pages are saved at 92% quality on a white background, so text stays sharp and files stay compact.",
  },
  qa: {
    ru: [{ q: "Почему текст на JPG немного размыт?", a: "JPG сжимает с потерями, и вокруг букв появляются лёгкие артефакты. Для текста без искажений выберите PDF в PNG или поднимите DPI до 300." }],
    en: [{ q: "Why is the text in the JPG slightly soft?", a: "JPG is lossy and adds faint artefacts around letters. For perfectly crisp text choose PDF to PNG or raise the DPI to 300." }],
  },
});

export const pdfToPngTool = toImageTool({
  slug: "pdf-to-png",
  format: "png",
  name: { ru: "PDF в PNG", en: "PDF to PNG" },
  title: { ru: "PDF в PNG онлайн — страницы без потери качества", en: "PDF to PNG online — pages without quality loss" },
  description: {
    ru: "Сохраните страницы PDF в PNG без потерь: чёткий текст и линии, 72, 150 или 300 DPI. Выберите страницы, скачайте картинки по одной или ZIP-архивом.",
    en: "Save PDF pages as lossless PNG: crisp text and lines at 72, 150 or 300 DPI. Pick pages and download the images one by one or as a ZIP archive.",
  },
  lead: { ru: "PNG сохраняет каждый пиксель страницы — идеально для текста, таблиц и схем.", en: "PNG keeps every pixel of the page — ideal for text, tables and diagrams." },
  keywords: { ru: ["pdf в png", "конвертировать pdf в png", "сохранить страницу pdf как картинку"], en: ["convert pdf to png", "pdf page to png"] },
  why: {
    ru: "PNG сжимает без потерь, поэтому буквы, тонкие линии и таблицы выглядят так же резко, как в PDF. Файлы получаются крупнее JPG — особенно у страниц с фотографиями, — зато подходят для инструкций, скриншотов и дальнейшего редактирования.",
    en: "PNG is lossless, so letters, thin lines and tables look as sharp as in the PDF. Files are larger than JPG — especially for photo pages — but perfect for manuals, screenshots and further editing.",
  },
  qa: {
    ru: [{ q: "Почему PNG весит больше JPG?", a: "PNG хранит изображение без потерь. Для страниц с фотографиями выгоднее JPG, для текста и графики — PNG." }],
    en: [{ q: "Why is PNG larger than JPG?", a: "PNG stores the image losslessly. JPG pays off for photo pages, PNG for text and graphics." }],
  },
  related: ["pdf-to-jpg", "compress-pdf", "split-pdf"],
});

export const pdfToWebpTool = toImageTool({
  slug: "pdf-to-webp",
  format: "webp",
  name: { ru: "PDF в WebP", en: "PDF to WebP" },
  title: { ru: "PDF в WebP онлайн — компактные картинки для сайта", en: "PDF to WebP online — compact images for the web" },
  description: {
    ru: "Сохраните страницы PDF в WebP: файлы меньше JPG при том же качестве, 72, 150 или 300 DPI. Подходит для сайтов и блогов. Работает в Chrome, Edge и Firefox.",
    en: "Save PDF pages as WebP: smaller than JPG at the same quality, at 72, 150 or 300 DPI. Great for websites and blogs. Works in Chrome, Edge and Firefox.",
  },
  lead: { ru: "WebP — лёгкие картинки страниц для публикации в интернете.", en: "WebP gives lightweight page images for publishing online." },
  keywords: { ru: ["pdf в webp", "конвертировать pdf в webp"], en: ["convert pdf to webp"] },
  why: {
    ru: "WebP при том же визуальном качестве обычно на 25–35% легче JPG, поэтому страницы грузятся на сайте быстрее. Сохранять WebP умеют Chrome, Edge, Firefox и браузеры на их основе; если ваш браузер этого не умеет (так бывает в Safari), инструмент сразу скажет об этом, а не подсунет PNG под видом WebP.",
    en: "At the same visual quality WebP is usually 25–35% lighter than JPG, so pages load faster on a website. Chrome, Edge, Firefox and their relatives can save WebP; if your browser can't (this happens in Safari), the tool says so instead of passing off a PNG as WebP.",
  },
  qa: {
    ru: [{ q: "Что делать, если браузер не сохраняет WebP?", a: "Некоторые браузеры (например, Safari) показывают WebP, но не умеют создавать его. Откройте инструмент в Chrome или Firefox либо выберите PNG/JPG." }],
    en: [{ q: "What if my browser can't save WebP?", a: "Some browsers (Safari, for example) display WebP but can't encode it. Use Chrome or Firefox, or pick PNG/JPG." }],
  },
  related: ["pdf-to-jpg", "compress-pdf", "split-pdf"],
});

/* ───────────── PDF → text ───────────── */

const textVariants = (): VariantDef[] => [
  {
    slug: "markdown",
    name: { ru: "PDF в Markdown", en: "PDF to Markdown" },
    title: { ru: "PDF в Markdown онлайн — текст для заметок и ИИ", en: "PDF to Markdown online — text for notes and AI" },
    h1: { ru: "PDF в Markdown", en: "PDF to Markdown" },
    description: {
      ru: "Извлеките текст PDF в Markdown: абзацы, заголовки «## Страница N» и экранирование разметки. Удобно для Obsidian, Notion, GitHub и для вставки в ChatGPT.",
      en: "Extract PDF text as Markdown: paragraphs, “## Page N” headings and escaped markup. Handy for Obsidian, Notion, GitHub and pasting into ChatGPT.",
    },
    lead: { ru: "Текст PDF превращается в аккуратный .md-файл с разбивкой по страницам.", en: "PDF text becomes a tidy .md file split by pages." },
    props: { format: "md" },
    blocks: (l) => [
      {
        type: "facts",
        rows:
          l === "ru"
            ? [
                ["Страницы", "заголовок второго уровня «## Страница 1», «## Страница 2»…"],
                ["Абзацы", "разделены пустой строкой, строки внутри абзаца — жёстким переносом"],
                ["Экранирование", "строки, начинающиеся с #, -, >, 1. и т. п., не превращаются в разметку"],
                ["Не переносится", "таблицы, картинки, шрифты и форматирование"],
              ]
            : [
                ["Pages", "second-level headings “## Page 1”, “## Page 2”…"],
                ["Paragraphs", "separated by a blank line, lines inside a paragraph by hard breaks"],
                ["Escaping", "lines starting with #, -, >, 1. etc. don't turn into markup"],
                ["Not carried over", "tables, images, fonts and formatting"],
              ],
      },
    ],
    faq: faq(
      [{ q: "Распознаются ли заголовки и списки PDF?", a: "Нет: в PDF нет разметки заголовков, только размеры шрифтов. Текст сохраняется абзацами, а структуру удобнее расставить вручную." }],
      [{ q: "Are PDF headings and lists recognised?", a: "No: PDF has no heading markup, only font sizes. Text is kept as paragraphs; add structure by hand if needed." }],
    ),
  },
  {
    slug: "docx",
    name: { ru: "Текст в Word (DOCX)", en: "Text to Word (DOCX)" },
    title: { ru: "Текст из PDF в Word (DOCX) онлайн", en: "PDF text to Word (DOCX) online" },
    h1: { ru: "Текст из PDF в Word", en: "PDF text to Word" },
    description: {
      ru: "Извлеките текст PDF в документ Word (.docx): абзацы и разрывы страниц сохраняются. Вёрстка, таблицы и картинки не переносятся — только текст для правки.",
      en: "Extract PDF text into a Word document (.docx): paragraphs and page breaks are kept. Layout, tables and images are not — just text you can edit.",
    },
    lead: { ru: "Получите редактируемый текст документа в формате Word — без вёрстки оригинала.", en: "Get the document's editable text as a Word file — without the original layout." },
    props: { format: "docx" },
    blocks: (l) => [
      {
        type: "facts",
        title: l === "ru" ? "Что будет в файле Word" : "What the Word file contains",
        rows:
          l === "ru"
            ? [
                ["Сохраняется", "текст, абзацы, разрывы между страницами PDF"],
                ["Не сохраняется", "колонки, таблицы, картинки, шрифты, колонтитулы как объекты"],
                ["Открывается в", "Microsoft Word, LibreOffice, Google Документах, «Мой Офис»"],
                ["Сканы", "без текстового слоя — текст не извлечётся (нужен OCR)"],
              ]
            : [
                ["Kept", "text, paragraphs, breaks between PDF pages"],
                ["Not kept", "columns, tables, images, fonts, headers/footers as objects"],
                ["Opens in", "Microsoft Word, LibreOffice, Google Docs, Pages"],
                ["Scans", "no text layer — nothing to extract (needs OCR)"],
              ],
      },
    ],
    faq: faq(
      [
        { q: "Это полноценная конвертация PDF в Word?", a: "Нет, и мы не делаем вид, что это так: сохраняется только текст по абзацам. Точное воспроизведение вёрстки PDF в Word в браузере без сервера надёжно сделать нельзя." },
        { q: "Почему Word не ругается на файл?", a: "Из текста удаляются управляющие символы, которые встречаются в PDF и недопустимы в XML, — из-за них Word раньше отказывался открывать такие документы." },
      ],
      [
        { q: "Is this a full PDF to Word conversion?", a: "No, and we don't pretend it is: only the text is kept, by paragraph. Faithfully rebuilding PDF layout in Word can't be done reliably in a browser without a server." },
        { q: "Why does Word open the file without complaints?", a: "Control characters that appear in PDFs but are illegal in XML are stripped — they are what used to make Word refuse such files." },
      ],
    ),
  },
];

export const toTextTool: ToolDef = {
  slug: "pdf-to-text",
  component: "pdf/to-text",
  icon: "FileText",
  name: { ru: "PDF в текст", en: "PDF to text" },
  title: { ru: "PDF в текст онлайн — извлечь текст из PDF", en: "PDF to text online — extract text from a PDF" },
  h1: { ru: "Извлечь текст из PDF", en: "Extract text from a PDF" },
  description: {
    ru: "Извлеките текст из PDF по абзацам и скопируйте его или скачайте как TXT, Markdown или Word (DOCX). Слова не рвутся на части, мусорные символы удаляются.",
    en: "Extract PDF text paragraph by paragraph, then copy it or download as TXT, Markdown or Word (DOCX). Words aren't torn apart and junk characters are removed.",
  },
  lead: { ru: "Текст появляется сразу после открытия файла — копируйте или скачивайте.", en: "Text appears as soon as the file opens — copy or download it." },
  keywords: { ru: ["скопировать текст из pdf", "pdf в txt", "вытащить текст из pdf", "pdf в word текст"], en: ["pdf to txt", "copy text from pdf", "pdf text extractor"] },
  howTo: {
    ru: ["Откройте PDF — текст извлекается автоматически.", "Выберите формат: TXT, Markdown или Word.", "Скопируйте текст кнопкой или скачайте файл."],
    en: ["Open a PDF — text is extracted automatically.", "Choose a format: TXT, Markdown or Word.", "Copy the text with the button or download the file."],
  },
  about: {
    ru: [
      "Текст собирается по координатам фрагментов на странице: фрагменты на одной строке склеиваются, пробел ставится только там, где на странице есть промежуток. Поэтому слова, которые PDF-генератор разбил на части, не превращаются в «При вет», а колонки читаются по порядку содержимого.",
      "Это извлечение текстового слоя, а не распознавание: сканы и фото документов текстового слоя не имеют. Вёрстка, таблицы и картинки не сохраняются — только текст по абзацам.",
      PRIVACY.ru,
    ],
    en: [
      "Text is assembled from fragment positions on the page: fragments on one line are joined, and a space is added only where the page shows a gap. Words split into pieces by the PDF generator don't come out as “Hel lo”, and columns follow the content order.",
      "This extracts the text layer; it doesn't recognise images: scans and photos of documents have no text layer. Layout, tables and images are not kept — just text by paragraph.",
      PRIVACY.en,
    ],
  },
  faq: faq(
    [
      { q: "Почему из моего PDF не извлекается текст?", a: "Скорее всего, это скан: страницы — картинки без текстового слоя. Здесь нет OCR, поэтому такой текст не извлечётся." },
      { q: "Почему иногда вместо букв «кракозябры»?", a: "Некоторые PDF хранят шрифты без таблицы соответствия символов (ToUnicode). Глазами такой текст читается, а извлечь его корректно нельзя — это ограничение самого файла." },
      { q: "Сохранится ли форматирование?", a: "Нет: жирный шрифт, таблицы, колонки и картинки не переносятся. Результат — чистый текст по абзацам с разбивкой по страницам." },
      PRIVACY_QA.ru,
    ],
    [
      { q: "Why can't I extract text from my PDF?", a: "Most likely it's a scan: pages are images with no text layer. There's no OCR here, so such text can't be extracted." },
      { q: "Why do I sometimes get gibberish?", a: "Some PDFs store fonts without a character map (ToUnicode). The text reads fine on screen but can't be extracted correctly — a limitation of the file itself." },
      { q: "Is formatting kept?", a: "No: bold, tables, columns and images are not carried over. You get clean text by paragraph, split by page." },
      PRIVACY_QA.en,
    ],
  ),
  related: ["pdf-to-jpg", "split-pdf", "compress-pdf"],
  variants: { title: { ru: "Форматы", en: "Formats" }, list: textVariants },
};
