import type { ConvertPair, FormatId, FormatInfo } from "./types";

/* ───────────── Image formats ───────────── */

export const FORMATS: Record<FormatId, FormatInfo> = {
  jpg: {
    id: "jpg",
    label: "JPG",
    full: "Joint Photographic Experts Group",
    exts: ["jpg", "jpeg", "jpe"],
    mime: "image/jpeg",
    year: 1992,
    by: {
      ru: "Joint Photographic Experts Group (комитет ISO/IEC и ITU-T)",
      en: "Joint Photographic Experts Group (ISO/IEC and ITU-T committee)",
    },
    compression: { ru: "с потерями (DCT)", en: "lossy (DCT)" },
    alpha: false,
    animation: false,
    colors: {
      ru: "24 бита, 16,7 млн цветов (8 бит на канал)",
      en: "24-bit, 16.7 million colors (8 bits per channel)",
    },
    support: {
      ru: "Открывается везде: во всех браузерах, на Windows, macOS, Android и iOS, в любых редакторах и формах загрузки.",
      en: "Opens everywhere: every browser, Windows, macOS, Android and iOS, every image editor and upload form.",
    },
    about: {
      ru: "Стандарт ISO/IEC 10918-1 утверждён в 1992 году и до сих пор остаётся главным форматом для фотографий. Сжатие отбрасывает мелкие детали, которые глаз замечает хуже всего, поэтому снимок весит примерно в 10 раз меньше несжатого почти без видимой разницы. Каждое пересохранение добавляет немного новых артефактов.",
      en: "The ISO/IEC 10918-1 standard was approved in 1992 and is still the default format for photos. Compression discards fine detail the eye notices least, so a photo takes roughly a tenth of its uncompressed size with little visible difference. Every re-save adds a few more artifacts.",
    },
    bestFor: {
      ru: "Фотографии для отправки, печати и публикации, когда важна совместимость.",
      en: "Photos to share, print or publish when compatibility matters most.",
    },
  },
  png: {
    id: "png",
    label: "PNG",
    full: "Portable Network Graphics",
    exts: ["png"],
    mime: "image/png",
    year: 1996,
    by: { ru: "PNG Development Group, стандарт W3C", en: "PNG Development Group, W3C standard" },
    compression: { ru: "без потерь (Deflate)", en: "lossless (Deflate)" },
    alpha: true,
    animation: "limited",
    colors: {
      ru: "до 48 бит + альфа-канал; режим палитры до 256 цветов",
      en: "up to 48-bit + alpha channel; palette mode up to 256 colors",
    },
    support: {
      ru: "Открывается во всех браузерах, системах и редакторах; анимированный вариант APNG показывают современные браузеры.",
      en: "Opens in every browser, OS and editor; the animated APNG variant plays in modern browsers.",
    },
    about: {
      ru: "PNG появился в 1996 году как свободная от патентов замена GIF и в том же году стал рекомендацией W3C. Сжатие без потерь сохраняет каждый пиксель, а альфа-канал даёт плавную полупрозрачность — тени и сглаженные края. Фотографии в PNG весят в разы больше, чем в JPG.",
      en: "PNG appeared in 1996 as a patent-free replacement for GIF and became a W3C Recommendation the same year. Lossless compression keeps every pixel, and the alpha channel allows smooth semi-transparency such as shadows and anti-aliased edges. Photos saved as PNG are several times larger than JPGs.",
    },
    bestFor: {
      ru: "Скриншоты, логотипы, графика с текстом и всё, где нужна прозрачность.",
      en: "Screenshots, logos, graphics with text and anything that needs transparency.",
    },
  },
  webp: {
    id: "webp",
    label: "WebP",
    full: "WebP (Google image format)",
    exts: ["webp"],
    mime: "image/webp",
    year: 2010,
    by: { ru: "Google", en: "Google" },
    compression: { ru: "с потерями (VP8) или без потерь (VP8L)", en: "lossy (VP8) or lossless (VP8L)" },
    alpha: true,
    animation: true,
    colors: { ru: "24 бита + 8-битный альфа-канал", en: "24-bit color + 8-bit alpha" },
    support: {
      ru: "Chrome, Edge, Firefox 65+ и Safari 14+, системные просмотрщики Windows 11 и macOS; часть старых программ и сайтов WebP не принимает.",
      en: "Chrome, Edge, Firefox 65+ and Safari 14+, plus the built-in viewers of Windows 11 and macOS; some older programs and sites still reject it.",
    },
    about: {
      ru: "Google представил WebP в 2010 году на основе видеокодека VP8, позже добавив режим без потерь, прозрачность и анимацию. По данным Google, WebP с потерями на 25–34 % меньше JPG при сопоставимом качестве, а WebP без потерь — на 26 % меньше PNG. Сегодня это самый распространённый «современный» формат в интернете.",
      en: "Google introduced WebP in 2010, based on the VP8 video codec, and later added lossless mode, transparency and animation. According to Google, lossy WebP is 25–34% smaller than JPG at comparable quality and lossless WebP is 26% smaller than PNG. It is now the most widely used next-gen format on the web.",
    },
    bestFor: {
      ru: "Фото и графика на сайтах, где нужны малый вес и прозрачность.",
      en: "Photos and graphics on websites that need small files and transparency.",
    },
  },
  avif: {
    id: "avif",
    label: "AVIF",
    full: "AV1 Image File Format",
    exts: ["avif"],
    mime: "image/avif",
    year: 2019,
    by: { ru: "Alliance for Open Media (AOMedia)", en: "Alliance for Open Media (AOMedia)" },
    compression: { ru: "с потерями или без потерь (AV1)", en: "lossy or lossless (AV1)" },
    alpha: true,
    animation: true,
    colors: {
      ru: "8, 10 или 12 бит на канал, HDR и широкий цветовой охват",
      en: "8, 10 or 12 bits per channel, HDR and wide color gamut",
    },
    support: {
      ru: "Chrome 85+, Firefox 93+, Safari 16.4+ и Edge 121+; в Windows может понадобиться расширение AV1, старые редакторы и формы его не открывают.",
      en: "Chrome 85+, Firefox 93+, Safari 16.4+ and Edge 121+; Windows may need the AV1 extension, and older editors and forms can't open it.",
    },
    about: {
      ru: "AVIF — это кадр, сжатый видеокодеком AV1 и упакованный в контейнер HEIF; спецификацию AOMedia выпустил в 2019 году. На фотографиях AVIF нередко в 1,5–2 раза легче JPG при сопоставимом качестве и обычно обгоняет WebP. Плата за это — медленное кодирование.",
      en: "AVIF is an image compressed with the AV1 video codec and stored in a HEIF container; AOMedia published the specification in 2019. On photos it is often 1.5–2 times smaller than JPG at comparable quality and usually beats WebP. The trade-off is slow encoding.",
    },
    bestFor: {
      ru: "Фото и графика для современных сайтов, где важен каждый килобайт.",
      en: "Photos and graphics on modern websites where every kilobyte counts.",
    },
  },
  heic: {
    id: "heic",
    label: "HEIC",
    full: "High Efficiency Image File Format (HEVC)",
    exts: ["heic", "heif"],
    mime: "image/heic",
    year: 2015,
    by: { ru: "MPEG (ISO/IEC); популярность — благодаря Apple", en: "MPEG (ISO/IEC); popularized by Apple" },
    compression: { ru: "с потерями (HEVC/H.265)", en: "lossy (HEVC/H.265)" },
    alpha: true,
    animation: "limited",
    colors: {
      ru: "8–10 бит на канал, широкий охват (Display P3 на iPhone)",
      en: "8–10 bits per channel, wide gamut (Display P3 on iPhone)",
    },
    support: {
      ru: "Из браузеров HEIC показывает только Safari; Chrome и Firefox его не открывают, а Windows 10/11 — только после установки расширений HEIF и HEVC.",
      en: "Among browsers only Safari displays HEIC; Chrome and Firefox don't, and Windows 10/11 needs the HEIF and HEVC extensions installed.",
    },
    about: {
      ru: "HEIF — стандарт MPEG 2015 года, а HEIC — его вариант с изображением, сжатым кодеком HEVC (H.265). С iOS 11 (2017) это формат съёмки iPhone по умолчанию: при сравнимом качестве файл до двух раз меньше JPG. В один файл можно упаковать несколько изображений, карту глубины и HDR-данные.",
      en: "HEIF is a 2015 MPEG standard, and HEIC is its flavor with the image compressed by HEVC (H.265). Since iOS 11 (2017) it has been the iPhone's default capture format: at similar quality a file is up to half the size of a JPG. One file can hold several images, a depth map and HDR data.",
    },
    bestFor: {
      ru: "Хранение снимков на iPhone и в экосистеме Apple; для обмена удобнее JPG.",
      en: "Storing photos on an iPhone and across Apple devices; JPG is easier for sharing.",
    },
  },
  gif: {
    id: "gif",
    label: "GIF",
    full: "Graphics Interchange Format",
    exts: ["gif"],
    mime: "image/gif",
    year: 1987,
    by: { ru: "CompuServe", en: "CompuServe" },
    compression: { ru: "без потерь (LZW) на палитре до 256 цветов", en: "lossless (LZW) on a palette of up to 256 colors" },
    alpha: false,
    animation: true,
    colors: {
      ru: "до 256 цветов на кадр; прозрачность только 1-битная (без полупрозрачности)",
      en: "up to 256 colors per frame; 1-bit transparency only (no semi-transparency)",
    },
    support: {
      ru: "Открывается во всех браузерах, мессенджерах и системах, анимация проигрывается практически везде.",
      en: "Opens in every browser, messenger and OS, and the animation plays almost everywhere.",
    },
    about: {
      ru: "CompuServe выпустил GIF в 1987 году, а версия 89a (1989) добавила анимацию и прозрачный цвет. Палитра ограничена 256 цветами, поэтому фотографии в GIF выглядят полосатыми. Зато короткие анимации и простая графика открываются где угодно.",
      en: "CompuServe released GIF in 1987, and version 89a (1989) added animation and a transparent color. The palette is limited to 256 colors, so photos look banded. Short animations and simple graphics, however, open anywhere.",
    },
    bestFor: {
      ru: "Короткие анимации и простая графика с небольшим числом цветов.",
      en: "Short animations and simple graphics with few colors.",
    },
  },
  bmp: {
    id: "bmp",
    label: "BMP",
    full: "Bitmap Image File (Device-Independent Bitmap)",
    exts: ["bmp", "dib"],
    mime: "image/bmp",
    year: 1990,
    by: { ru: "Microsoft", en: "Microsoft" },
    compression: { ru: "обычно без сжатия (иногда RLE)", en: "usually uncompressed (sometimes RLE)" },
    alpha: false,
    animation: false,
    colors: {
      ru: "1–32 бита на пиксель; чаще всего 24 бита, 16,7 млн цветов",
      en: "1–32 bits per pixel; most often 24-bit, 16.7 million colors",
    },
    support: {
      ru: "Открывается в Windows, браузерах и большинстве редакторов, но многие сайты и формы загрузки BMP не принимают.",
      en: "Opens in Windows, browsers and most editors, but many websites and upload forms don't accept it.",
    },
    about: {
      ru: "BMP — родной растровый формат Windows; в нынешнем виде (DIB) он используется со времён Windows 3.0 (1990). Пиксели хранятся почти как есть, поэтому кадр 1920×1080 весит около 6 МБ. 32-битные BMP формально могут содержать альфа-канал, но многие программы его игнорируют.",
      en: "BMP is the native raster format of Windows; its current form (DIB) dates back to Windows 3.0 (1990). Pixels are stored almost raw, so a 1920×1080 frame takes about 6 MB. 32-bit BMPs can formally carry an alpha channel, but many programs ignore it.",
    },
    bestFor: {
      ru: "Обмен со старыми программами и устройствами, которые понимают только BMP.",
      en: "Exchanging files with legacy software and devices that only understand BMP.",
    },
  },
  tiff: {
    id: "tiff",
    label: "TIFF",
    full: "Tagged Image File Format",
    exts: ["tiff", "tif"],
    mime: "image/tiff",
    year: 1986,
    by: { ru: "Aldus (сейчас Adobe)", en: "Aldus (now Adobe)" },
    compression: {
      ru: "без сжатия, LZW, Deflate, PackBits или JPEG",
      en: "uncompressed, LZW, Deflate, PackBits or JPEG",
    },
    alpha: true,
    animation: false,
    colors: {
      ru: "8 или 16 бит на канал; RGB, CMYK, оттенки серого",
      en: "8 or 16 bits per channel; RGB, CMYK, grayscale",
    },
    support: {
      ru: "Из браузеров TIFF показывает только Safari — Chrome, Firefox и Edge его не отображают; открывается в «Фотографиях» Windows, «Просмотре» macOS и редакторах.",
      en: "Among browsers only Safari displays TIFF — Chrome, Firefox and Edge don't; it opens in Windows Photos, macOS Preview and image editors.",
    },
    about: {
      ru: "TIFF создала компания Aldus в 1986 году для сканеров и настольной вёрстки; после слияния с Adobe в 1994 году формат перешёл к ней. TIFF хранит несколько страниц в одном файле, 16 бит на канал и разные виды сжатия, поэтому его используют сканеры, фотографы и типографии. Файлы большие и для интернета не предназначены.",
      en: "Aldus created TIFF in 1986 for scanners and desktop publishing; the format passed to Adobe after the 1994 merger. TIFF stores multiple pages in one file, 16 bits per channel and several compression methods, which is why scanners, photographers and print shops use it. Files are large and not meant for the web.",
    },
    bestFor: {
      ru: "Сканы, архивы и файлы для печати, где нужно максимальное качество.",
      en: "Scans, archives and print files where maximum quality matters.",
    },
  },
  svg: {
    id: "svg",
    label: "SVG",
    full: "Scalable Vector Graphics",
    exts: ["svg", "svgz"],
    mime: "image/svg+xml",
    year: 2001,
    by: { ru: "W3C", en: "W3C" },
    compression: { ru: "вектор, текст XML (SVGZ — сжатие gzip)", en: "vector XML text (SVGZ is gzip-compressed)" },
    alpha: true,
    animation: true,
    colors: {
      ru: "любые цвета sRGB, градиенты и прозрачность; не зависит от разрешения",
      en: "any sRGB color, gradients and opacity; resolution-independent",
    },
    support: {
      ru: "Отображается во всех браузерах и векторных редакторах, но соцсети, мессенджеры и многие формы загрузки SVG не принимают.",
      en: "Displays in every browser and vector editor, but social networks, messengers and many upload forms don't accept it.",
    },
    about: {
      ru: "SVG описывает картинку фигурами и кривыми в XML-коде: работа над форматом в W3C началась в 1999 году, версия 1.0 стала рекомендацией в 2001-м. Векторное изображение остаётся чётким при любом увеличении и часто весит несколько килобайт. Внутри SVG могут быть скрипты и ссылки на внешние файлы, поэтому многие сайты его не принимают.",
      en: "SVG describes a picture as shapes and curves in XML: W3C started work on it in 1999, and version 1.0 became a Recommendation in 2001. Vector images stay sharp at any zoom and often weigh a few kilobytes. An SVG can contain scripts and links to external files, which is why many sites refuse it.",
    },
    bestFor: {
      ru: "Логотипы, иконки, схемы и интерфейсная графика на сайтах.",
      en: "Logos, icons, diagrams and interface graphics on websites.",
    },
  },
  ico: {
    id: "ico",
    label: "ICO",
    full: "Windows Icon",
    exts: ["ico"],
    mime: "image/x-icon",
    year: 1990,
    by: { ru: "Microsoft", en: "Microsoft" },
    compression: {
      ru: "контейнер: изображения PNG или BMP без сжатия",
      en: "container of PNG or uncompressed BMP images",
    },
    alpha: true,
    animation: false,
    colors: {
      ru: "до 32 бит (24 бита + альфа), несколько размеров до 256×256 px",
      en: "up to 32-bit (24-bit + alpha), several sizes up to 256×256 px",
    },
    support: {
      ru: "Понимают Windows, все браузеры (как favicon) и редакторы иконок; для обычных картинок формат не используется.",
      en: "Understood by Windows, every browser (as a favicon) and icon editors; it isn't used for regular pictures.",
    },
    about: {
      ru: "ICO — контейнер Windows, в котором лежит сразу несколько версий одной иконки: 16×16, 32×32, 48×48 и до 256×256 px. С Windows Vista (2007) изображения внутри могут храниться в PNG, раньше — только в BMP. В 1999 году Internet Explorer 5 начал искать на сайтах файл favicon.ico, и формат стал стандартом для значков сайтов.",
      en: "ICO is a Windows container that holds several versions of one icon: 16×16, 32×32, 48×48 and up to 256×256 px. Since Windows Vista (2007) the images inside can be stored as PNG; before that only BMP was allowed. In 1999 Internet Explorer 5 began looking for favicon.ico on websites, and the format became the standard for site icons.",
    },
    bestFor: {
      ru: "Favicon сайта и значки программ, папок и ярлыков Windows.",
      en: "Website favicons and icons for Windows programs, folders and shortcuts.",
    },
  },
  jfif: {
    id: "jfif",
    label: "JFIF",
    full: "JPEG File Interchange Format",
    exts: ["jfif"],
    mime: "image/jpeg",
    year: 1992,
    by: {
      ru: "C-Cube Microsystems (Эрик Гамильтон); сейчас стандарт ITU-T T.871",
      en: "C-Cube Microsystems (Eric Hamilton); now ITU-T T.871",
    },
    compression: { ru: "с потерями (DCT) — это обычный JPEG", en: "lossy (DCT), exactly like JPEG" },
    alpha: false,
    animation: false,
    colors: {
      ru: "24 бита, 16,7 млн цветов (8 бит на канал)",
      en: "24-bit, 16.7 million colors (8 bits per channel)",
    },
    support: {
      ru: "Открывается везде, где открывается JPG, но некоторые сайты и формы не принимают файлы с расширением .jfif.",
      en: "Opens wherever JPG opens, but some websites and forms reject files with the .jfif extension.",
    },
    about: {
      ru: "JFIF — не отдельный формат, а стандартная обёртка, в которой хранится почти любой JPEG: она задаёт цветовое пространство, плотность пикселей и миниатюру. Файлы с расширением .jfif появляются, когда Windows или Chrome сохраняют обычный JPEG под этим именем, — внутри те же байты. Достаточно сменить расширение на .jpg.",
      en: "JFIF is not a separate format but the standard wrapper almost every JPEG is stored in: it defines the color space, pixel density and thumbnail. Files ending in .jfif appear when Windows or Chrome save an ordinary JPEG under that extension — the bytes inside are the same. Changing the extension to .jpg is enough.",
    },
    bestFor: {
      ru: "Ни для чего особенного — такие файлы лучше просто сохранить как .jpg.",
      en: "Nothing in particular — such files are best simply saved as .jpg.",
    },
  },
};

/* ───────────── Conversion pairs ───────────── */

export const CONVERT_PAIRS: ConvertPair[] = [
  /* ── HEIC ── */
  {
    slug: "heic-to-jpg",
    from: "heic",
    to: "jpg",
    name: { ru: "HEIC → JPG", en: "HEIC → JPG" },
    title: {
      ru: "HEIC в JPG — конвертер фото с iPhone онлайн",
      en: "HEIC to JPG Converter — iPhone Photos to JPG",
    },
    h1: { ru: "Конвертировать HEIC в JPG", en: "Convert HEIC to JPG" },
    description: {
      ru: "Фото с iPhone из HEIC в JPG, который откроется в Windows и любой форме загрузки: пакетно, качество 1–100, ZIP-архив. Видео Live Photo не сохраняется.",
      en: "Turn iPhone HEIC photos into JPGs that open on Windows and in any upload form. Batch mode, quality 1–100, ZIP download; Live Photo video is dropped.",
    },
    lead: {
      ru: "Фото с айфона в формате HEIC превращаются в обычные JPG прямо в браузере — без загрузки на сервер.",
      en: "iPhone photos in HEIC format become ordinary JPGs right in your browser — nothing is uploaded to a server.",
    },
    keywords: {
      ru: [
        "heic в jpg",
        "конвертер heic в jpg",
        "heic в jpeg онлайн",
        "как открыть heic на windows",
        "перевести фото с айфона в jpg",
        "конвертировать heic в jpg пакетно",
      ],
      en: [
        "heic to jpg",
        "heic to jpg converter",
        "convert heic to jpeg",
        "open heic on windows",
        "iphone photo to jpg",
        "batch heic to jpg",
      ],
    },
    paragraphs: {
      ru: [
        "С iOS 11 айфон снимает в HEIC: файл до двух раз легче JPG при том же качестве, но Chrome, Firefox и Windows без расширений HEIF и HEVC его не открывают. Порталы госуслуг в России и Казахстане, маркетплейсы и CRM обычно принимают JPG или PNG, поэтому HEIC приходится переводить.",
        "Из HEIC берётся только основной снимок: видео Live Photo, карта глубины портретного режима и HDR-данные отбрасываются, цвета Display P3 приводятся к sRGB. В Safari 17+ файл расшифровывает сам браузер, в остальных при первом HEIC подгружается декодер libheif, поэтому первый файл обрабатывается чуть дольше. JPG обычно получается в 1,5–2 раза тяжелее исходника.",
        "Для отправки и печати хватает качества 85–90; если важен вес, включите максимальное сжатие MozJPEG — оно обычно даёт ещё 5–15 % экономии. Чтобы айфон сразу снимал в JPG, откройте «Настройки» → «Камера» → «Форматы» и выберите режим максимальной совместимости.",
      ],
      en: [
        "Since iOS 11, iPhones shoot in HEIC: a file is up to half the size of a JPG at the same quality, but Chrome, Firefox and Windows without the HEIF and HEVC extensions can't open it. Government portals, marketplaces and CRMs usually accept JPG or PNG, so HEIC has to be converted first.",
        "Only the primary image is taken from the HEIC: the Live Photo video, the Portrait-mode depth map and HDR data are dropped, and Display P3 colors are mapped to sRGB. Safari 17+ decodes HEIC itself; other browsers load the libheif decoder with the first file, so that one takes a little longer. Expect the JPG to be roughly 1.5–2 times larger than the original.",
        "Quality 85–90 is plenty for sharing and printing; if size matters, switch on maximum compression (MozJPEG), which usually saves another 5–15%. To make the iPhone shoot JPG in the first place, go to Settings → Camera → Formats and choose Most Compatible.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранятся ли дата съёмки и геометка?",
          a: "Нет. При перекодировании метаданные EXIF — дата, модель телефона, GPS-координаты — в JPG не переносятся. Если они нужны, сначала откройте исходный HEIC в просмотрщике EXIF и сохраните данные. Для публикации это даже плюс: по файлу нельзя узнать, где сделан снимок.",
        },
        {
          q: "Можно ли сконвертировать сразу всю папку с айфона?",
          a: "Да. Перетащите десятки файлов разом: у каждого свой статус обработки, а результат скачивается одним ZIP-архивом. Снимки на 12–48 Мп обрабатываются без проблем, большие серии просто занимают больше времени.",
        },
        {
          q: "Почему JPG выглядит чуть бледнее, чем на айфоне?",
          a: "iPhone снимает в расширенном цветовом охвате Display P3 и добавляет HDR-карту яркости, а JPG сохраняется в стандартном sRGB без HDR. Самые насыщенные красные, оранжевые и бирюзовые оттенки немного приглушаются, яркие блики теряют HDR-подсветку. На большинстве мониторов разница едва заметна.",
        },
      ],
      en: [
        {
          q: "Will the capture date and location be kept?",
          a: "No. Re-encoding drops the EXIF metadata, so the date, phone model and GPS coordinates are not copied into the JPG. If you need them, open the original HEIC in the EXIF viewer first and note them down. For publishing it is actually a plus: the file no longer reveals where the photo was taken.",
        },
        {
          q: "Can I convert a whole folder of iPhone photos at once?",
          a: "Yes. Drop dozens of files together: each one gets its own status, and the results download as a single ZIP. 12–48 MP shots are handled fine; large batches simply take longer.",
        },
        {
          q: "Why does the JPG look slightly duller than on my iPhone?",
          a: "The iPhone captures in the wide Display P3 gamut and adds an HDR gain map, while the JPG is standard sRGB without HDR. The most saturated reds, oranges and teals are pulled in a little, and bright highlights lose their extra HDR glow. On most monitors the difference is barely visible.",
        },
      ],
    },
  },
  {
    slug: "heic-to-png",
    from: "heic",
    to: "png",
    name: { ru: "HEIC → PNG", en: "HEIC → PNG" },
    title: {
      ru: "HEIC в PNG — фото с айфона без повторного сжатия",
      en: "HEIC to PNG — Lossless Copies of iPhone Photos",
    },
    h1: { ru: "Конвертировать HEIC в PNG", en: "Convert HEIC to PNG" },
    description: {
      ru: "HEIC в PNG для ретуши и монтажа: снимок сохраняется без новых потерь. Учтите размер — PNG с 12-мегапиксельного фото обычно весит больше 10 МБ.",
      en: "Save HEIC photos as PNG for retouching and editing with no further loss. Mind the size: a PNG of a 12 MP iPhone shot usually weighs more than 10 MB.",
    },
    lead: {
      ru: "Основное изображение из HEIC сохраняется в PNG без потерь — удобно, если фото ещё будут редактировать.",
      en: "The main image from a HEIC file is saved as a lossless PNG — handy when the photo will be edited further.",
    },
    keywords: {
      ru: [
        "heic в png",
        "конвертер heic в png",
        "heic в png онлайн",
        "перевести heic в png",
        "фото с айфона в png",
        "heic в png без потери качества",
      ],
      en: [
        "heic to png",
        "heic to png converter",
        "convert heic to png",
        "heic to png lossless",
        "iphone photo to png",
      ],
    },
    paragraphs: {
      ru: [
        "PNG выбирают, когда снимок с айфона дальше пойдёт в работу: ретушь, коллаж, вёрстка, подготовка к печати. Каждое пересохранение JPG добавляет артефакты, а PNG хранит пиксели без изменений, сколько бы раз вы его ни открывали и сохраняли. К тому же PNG откроет любой редактор, даже без поддержки HEIC.",
        "Из файла берётся только основной кадр: Live Photo, карта глубины и HDR-данные не переносятся, цвета приводятся к sRGB с 8 битами на канал. «Без потерь» относится только к самому PNG — сжатие HEVC уже было с потерями, и вернуть отброшенные им детали нельзя.",
        "Главный минус — вес: 12-мегапиксельное фото в PNG обычно занимает больше 10 МБ, что в несколько раз больше HEIC. Если нужно просто открыть снимок на Windows или отправить его, лучше выбрать JPG, а для сайта — WebP.",
      ],
      en: [
        "PNG makes sense when an iPhone shot is going to be worked on: retouching, collages, layouts or print preparation. Every JPG re-save adds artifacts, while PNG keeps the pixels unchanged no matter how many times you open and save it. And any editor opens PNG, even one without HEIC support.",
        "Only the primary image is taken: Live Photo, depth map and HDR data are not carried over, and colors are converted to sRGB at 8 bits per channel. “Lossless” applies to the PNG itself — HEVC compression was already lossy, and the detail it discarded can't be brought back.",
        "The main downside is size: a 12 MP photo as PNG usually takes more than 10 MB, several times the HEIC. If you only need to open the photo on Windows or send it, JPG is the better choice, and for a website use WebP.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Станет ли фото качественнее, чем в HEIC?",
          a: "Нет. PNG сохраняет ровно то, что получилось при расшифровке HEIC, и не добавляет деталей. Его плюс в другом: дальнейшие правки и пересохранения больше не ухудшают картинку.",
        },
        {
          q: "Почему PNG весит 15 МБ, а HEIC — 2 МБ?",
          a: "HEVC сжимает с потерями и очень эффективно, а PNG хранит каждый пиксель точно. Шум и мелкие текстуры фотографии почти не сжимаются без потерь, поэтому PNG получается в несколько раз тяжелее. Для графики и скриншотов разница была бы меньше.",
        },
        {
          q: "Будет ли у PNG прозрачный фон?",
          a: "Нет. Снимки iPhone не содержат прозрачности, поэтому PNG будет непрозрачным. Автоматически вырезать объект с фона этот конвертер не умеет — он только меняет формат.",
        },
      ],
      en: [
        {
          q: "Will the photo look better than the HEIC?",
          a: "No. The PNG stores exactly what was decoded from the HEIC and adds no detail. Its advantage is different: further edits and re-saves no longer degrade the image.",
        },
        {
          q: "Why is the PNG 15 MB when the HEIC was 2 MB?",
          a: "HEVC is a very efficient lossy codec, while PNG stores every pixel exactly. Photo noise and fine texture barely compress without loss, so the PNG ends up several times larger. For graphics and screenshots the gap would be much smaller.",
        },
        {
          q: "Will the PNG have a transparent background?",
          a: "No. iPhone photos contain no transparency, so the PNG will be opaque. This converter only changes the format; it can't cut a subject out of its background.",
        },
      ],
    },
  },
  {
    slug: "heic-to-webp",
    from: "heic",
    to: "webp",
    name: { ru: "HEIC → WebP", en: "HEIC → WebP" },
    title: {
      ru: "HEIC в WebP — лёгкие фото с iPhone для сайта",
      en: "HEIC to WebP — Lightweight iPhone Photos for the Web",
    },
    h1: { ru: "Конвертировать HEIC в WebP", en: "Convert HEIC to WebP" },
    description: {
      ru: "HEIC с iPhone в WebP для сайта или блога: формат открывается в Chrome, Firefox, Edge и Safari 14+ и весит меньше JPG. Качество 1–100, пакетно, ZIP.",
      en: "Convert iPhone HEIC photos to WebP for a website or blog: it opens in Chrome, Firefox, Edge and Safari 14+ and is lighter than JPG. Quality 1–100, batch, ZIP.",
    },
    lead: {
      ru: "Фото с айфона перекодируются в WebP — формат, который показывают все современные браузеры, в отличие от HEIC.",
      en: "iPhone photos are re-encoded to WebP, a format every modern browser displays — unlike HEIC.",
    },
    keywords: {
      ru: [
        "heic в webp",
        "конвертер heic в webp",
        "heic в webp онлайн",
        "фото с айфона для сайта",
        "перевести heic в webp",
      ],
      en: [
        "heic to webp",
        "heic to webp converter",
        "convert heic to webp",
        "iphone photos for website",
        "heic to webp online",
      ],
    },
    paragraphs: {
      ru: [
        "HEIC компактен, но на сайте бесполезен: из браузеров его показывает только Safari. WebP — ближайшая замена с широкой поддержкой: по данным Google, он на 25–34 % легче JPG при сопоставимом качестве, поэтому страницы со снимками с айфона грузятся быстрее.",
        "Из HEIC берётся основной кадр, Live Photo и карта глубины отбрасываются, цвета приводятся к sRGB. WebP кодирует встроенный кодировщик браузера, а в Safari, который сам WebP не записывает, — библиотека libwebp, так что результат одинаков в любом браузере.",
        "Снимок iPhone 4032×3024 px для страницы слишком велик: сначала уменьшите его до 1600–2000 px по длинной стороне в инструменте изменения размера, а потом конвертируйте с качеством 75–85. Так фото обычно весит несколько сотен килобайт.",
      ],
      en: [
        "HEIC is compact but useless on a website: Safari is the only browser that displays it. WebP is the closest widely supported substitute — according to Google it is 25–34% lighter than JPG at comparable quality, so pages with iPhone photos load faster.",
        "The primary image is taken from the HEIC, the Live Photo and depth map are dropped, and colors are mapped to sRGB. WebP is written by the browser's own encoder, and in Safari, which can't encode WebP, by libwebp, so the result is the same in any browser.",
        "A 4032×3024 px iPhone shot is too big for a web page: first scale it to 1600–2000 px on the long side with the resize tool, then convert at quality 75–85. That usually brings a photo down to a few hundred kilobytes.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему нельзя просто выложить HEIC на сайт?",
          a: "Chrome, Firefox и Edge не отображают HEIC, поэтому большинство посетителей увидят пустое место вместо фото. WebP показывают все современные браузеры, включая Safari 14 и новее.",
        },
        {
          q: "Какое качество WebP выбрать для фото?",
          a: "Для страниц сайта обычно хватает 75–85: отличия от оригинала почти не видны, а вес минимален. Для портфолио и фото, где важны мелкие детали, ставьте 85–90.",
        },
        {
          q: "Откроется ли WebP на телефоне и компьютере?",
          a: "Да: Android, iOS 14+, macOS и Windows 11 показывают WebP стандартными средствами. Сложности бывают только со старыми программами и некоторыми формами загрузки — для них лучше подойдёт JPG.",
        },
      ],
      en: [
        {
          q: "Why can't I just put HEIC on my website?",
          a: "Chrome, Firefox and Edge don't display HEIC, so most visitors would see an empty box instead of the photo. WebP is shown by every modern browser, including Safari 14 and later.",
        },
        {
          q: "What WebP quality should I use for photos?",
          a: "For web pages 75–85 is usually enough: differences from the original are hard to see and the file stays small. For portfolios and shots where fine detail matters, use 85–90.",
        },
        {
          q: "Will WebP open on phones and computers?",
          a: "Yes: Android, iOS 14+, macOS and Windows 11 display WebP out of the box. Problems only come from older programs and some upload forms — JPG is the safer choice there.",
        },
      ],
    },
  },

  /* ── WebP ── */
  {
    slug: "webp-to-jpg",
    from: "webp",
    to: "jpg",
    name: { ru: "WebP → JPG", en: "WebP → JPG" },
    title: {
      ru: "WebP в JPG — картинки с сайтов для любых программ",
      en: "WebP to JPG — Make Web Images Open in Any Program",
    },
    h1: { ru: "Конвертировать WebP в JPG", en: "Convert WebP to JPG" },
    description: {
      ru: "Картинки WebP, сохранённые с сайтов, в JPG для старых программ, печати и форм загрузки. Прозрачность заливается цветом, у анимации берётся 1-й кадр.",
      en: "Convert WebP images saved from websites to JPG for older software, printing and upload forms. Transparency gets a fill color; animations keep frame 1.",
    },
    lead: {
      ru: "Файлы WebP, которые браузер сохраняет с сайтов, превращаются в JPG, понятный любой программе и форме.",
      en: "WebP files your browser saves from websites become JPGs that any program or form will accept.",
    },
    keywords: {
      ru: [
        "webp в jpg",
        "конвертер webp в jpg",
        "webp в jpeg онлайн",
        "как сохранить webp в jpg",
        "перевести webp в jpg",
        "чем открыть webp",
      ],
      en: [
        "webp to jpg",
        "webp to jpg converter",
        "convert webp to jpeg",
        "save webp as jpg",
        "open webp file",
        "batch webp to jpg",
      ],
    },
    paragraphs: {
      ru: [
        "Многие сайты отдают картинки в WebP, поэтому «Сохранить изображение как…» даёт файл .webp. Старые версии редакторов, классическое «Средство просмотра фотографий Windows», фотокиоски и часть форм загрузки его не принимают — JPG откроется везде.",
        "WebP чаще всего уже сжат с потерями, и перекодирование в JPG — второе поколение сжатия. Ставьте качество 90 и выше, чтобы не добавить заметных артефактов. JPG обычно получается на треть–половину тяжелее исходного WebP — это нормально.",
        "Прозрачные области заливаются выбранным цветом (по умолчанию белым). У анимированного WebP сохраняется только первый кадр, о чём конвертер предупреждает; анимированный WebP в анимацию он не переводит.",
      ],
      en: [
        "Many sites serve images as WebP, so “Save image as…” gives you a .webp file. Older editor versions, the classic Windows Photo Viewer, photo kiosks and some upload forms won't take it — a JPG opens everywhere.",
        "WebP is usually already lossy, so re-encoding to JPG is a second generation of compression. Use quality 90 or higher to avoid adding visible artifacts. Expect the JPG to be a third to a half larger than the WebP — that is normal.",
        "Transparent areas are filled with the color you choose (white by default). From an animated WebP only the first frame is kept, and the converter warns you about it; it does not turn animated WebP into another animation.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему браузер сохраняет картинки в WebP?",
          a: "Браузер сохраняет файл ровно в том формате, в котором его прислал сайт. Если сервер отдаёт WebP ради скорости загрузки, на диске окажется .webp — переименование в .jpg не поможет, нужна конвертация.",
        },
        {
          q: "Что станет с прозрачным фоном?",
          a: "В JPG прозрачности нет, поэтому фон зальётся выбранным цветом — белым или любым другим. Если прозрачность нужно сохранить, конвертируйте WebP в PNG.",
        },
        {
          q: "Можно ли сохранить анимацию из WebP?",
          a: "Нет. Из анимированного WebP берётся только первый кадр, и конвертер показывает предупреждение. Анимированный WebP или AVIF на выходе здесь не создаются.",
        },
      ],
      en: [
        {
          q: "Why does my browser save images as WebP?",
          a: "A browser saves the file in exactly the format the site sent. If the server delivers WebP for faster loading, you get a .webp file — renaming it to .jpg won't help; it needs converting.",
        },
        {
          q: "What happens to a transparent background?",
          a: "JPG has no transparency, so the background is filled with the color you pick — white or anything else. To keep transparency, convert WebP to PNG instead.",
        },
        {
          q: "Can I keep the animation from a WebP?",
          a: "No. Only the first frame of an animated WebP is used, and the converter shows a warning. Animated WebP or AVIF output is not supported here.",
        },
      ],
    },
  },
  {
    slug: "webp-to-png",
    from: "webp",
    to: "png",
    name: { ru: "WebP → PNG", en: "WebP → PNG" },
    title: {
      ru: "WebP в PNG — конвертер с сохранением прозрачности",
      en: "WebP to PNG Converter — Transparency Preserved",
    },
    h1: { ru: "Конвертировать WebP в PNG", en: "Convert WebP to PNG" },
    description: {
      ru: "WebP в PNG с альфа-каналом: прозрачный фон и мягкие тени остаются как были. PNG без потерь и откроется в любом редакторе; из анимации берётся 1-й кадр.",
      en: "Convert WebP to PNG with the alpha channel intact: transparent backgrounds and soft shadows stay put. Lossless PNG for any editor; animations keep frame 1.",
    },
    lead: {
      ru: "WebP превращается в PNG с сохранением прозрачности — для редакторов, презентаций и программ, которые не читают WebP.",
      en: "WebP becomes PNG with its transparency intact — for editors, presentations and programs that can't read WebP.",
    },
    keywords: {
      ru: [
        "webp в png",
        "конвертер webp в png",
        "webp в png с прозрачным фоном",
        "перевести webp в png",
        "webp в png онлайн",
      ],
      en: [
        "webp to png",
        "webp to png converter",
        "webp to png transparent",
        "convert webp to png",
        "webp to png online",
      ],
    },
    paragraphs: {
      ru: [
        "Логотипы, стикеры и товары на прозрачном фоне с сайтов часто скачиваются в WebP. Чтобы вставить их в старые версии Office, отдать в типографию или открыть в редакторе без поддержки WebP, нужен PNG — и только он сохранит прозрачность, в отличие от JPG.",
        "Альфа-канал переносится полностью, включая полупрозрачные пиксели: тени, сглаженные края, стеклянные эффекты. PNG записывается без потерь, поэтому новых артефактов не появится, но и уже имеющиеся от сжатия WebP никуда не денутся.",
        "PNG обычно в разы тяжелее WebP. Если картинка нужна для сайта, оставьте WebP; если PNG нужен, но слишком велик, уменьшите число цветов в инструменте сжатия — для плоской графики это почти незаметно.",
      ],
      en: [
        "Logos, stickers and product cut-outs on transparent backgrounds often download from sites as WebP. To put them into older Office versions, send them to a print shop or open them in an editor without WebP support, you need PNG — and unlike JPG it keeps the transparency.",
        "The alpha channel is carried over completely, including semi-transparent pixels: shadows, anti-aliased edges, glass effects. PNG is written losslessly, so no new artifacts appear, but any left by the WebP compression stay.",
        "A PNG is usually several times larger than the WebP. If the image is for a website, keep the WebP; if you need a PNG but it's too heavy, reduce the number of colors in the image compressor — on flat graphics this is barely noticeable.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Станет ли PNG качественнее исходного WebP?",
          a: "Нет. PNG сохраняет пиксели WebP точь-в-точь, но не восстанавливает детали, потерянные при сжатии. Выигрыш в том, что дальнейшие правки не будут ухудшать картинку.",
        },
        {
          q: "Сохранится ли полупрозрачная тень под логотипом?",
          a: "Да. PNG, как и WebP, поддерживает полноценный 8-битный альфа-канал, поэтому полупрозрачные пиксели переносятся без изменений. Тень будет выглядеть так же на любом фоне.",
        },
        {
          q: "Что будет с анимированным WebP?",
          a: "В PNG попадёт только первый кадр — конвертер предупредит об этом. Анимацию из WebP этот инструмент не извлекает и не пересобирает.",
        },
      ],
      en: [
        {
          q: "Will the PNG look better than the original WebP?",
          a: "No. The PNG keeps the WebP pixels exactly but can't restore detail lost to compression. The benefit is that further edits won't degrade the image.",
        },
        {
          q: "Will the soft shadow under my logo survive?",
          a: "Yes. PNG, like WebP, supports a full 8-bit alpha channel, so semi-transparent pixels are carried over unchanged. The shadow will look the same on any background.",
        },
        {
          q: "What happens to an animated WebP?",
          a: "Only the first frame goes into the PNG, and the converter warns you. This tool neither extracts nor rebuilds WebP animations.",
        },
      ],
    },
  },
  /* ── AVIF ── */
  {
    slug: "avif-to-jpg",
    from: "avif",
    to: "jpg",
    name: { ru: "AVIF → JPG", en: "AVIF → JPG" },
    title: {
      ru: "AVIF в JPG — картинка, которая откроется везде",
      en: "AVIF to JPG — Make AVIF Images Open Anywhere",
    },
    h1: { ru: "Конвертировать AVIF в JPG", en: "Convert AVIF to JPG" },
    description: {
      ru: "AVIF в JPG для программ и сайтов без поддержки AV1: качество 1–100, цвет фона вместо прозрачности. HDR и 10-битный цвет сводятся к обычному 8-битному sRGB.",
      en: "Convert AVIF to JPG for apps and sites without AV1 support: quality 1–100, a background color instead of transparency. HDR and 10-bit color become 8-bit sRGB.",
    },
    lead: {
      ru: "Изображения AVIF перекодируются в JPG — формат, который откроют любые редакторы, телефоны и формы загрузки.",
      en: "AVIF images are re-encoded to JPG, a format every editor, phone and upload form can open.",
    },
    keywords: {
      ru: [
        "avif в jpg",
        "конвертер avif в jpg",
        "avif в jpeg онлайн",
        "чем открыть avif",
        "перевести avif в jpg",
        "avif в jpg без потери качества",
      ],
      en: [
        "avif to jpg",
        "avif to jpg converter",
        "convert avif to jpeg",
        "open avif file",
        "avif to jpg online",
      ],
    },
    paragraphs: {
      ru: [
        "Сайты всё чаще отдают картинки в AVIF, и скачанный файл оказывается .avif. Браузеры показывают его с Chrome 85, Firefox 93 и Safari 16.4, но Windows без расширения AV1, старые версии Photoshop и Office, фотопечать и многие формы загрузки его не понимают.",
        "AVIF может хранить 10 или 12 бит на канал и HDR, а JPG — только 8-битный sRGB: при конвертации яркость HDR и расширенный охват не сохраняются. У анимированного AVIF берётся первый кадр, прозрачность заливается выбранным цветом.",
        "AV1 сжимает эффективнее JPEG, поэтому JPG почти всегда получается тяжелее исходника — нередко в 1,5–2 раза. Качества 85–90 достаточно, чтобы не добавить заметных артефактов поверх уже сжатого AVIF.",
      ],
      en: [
        "More and more sites serve images as AVIF, so a downloaded file often ends in .avif. Browsers display it since Chrome 85, Firefox 93 and Safari 16.4, but Windows without the AV1 extension, older Photoshop and Office versions, photo printing services and many upload forms don't understand it.",
        "AVIF can hold 10 or 12 bits per channel and HDR, while JPG is 8-bit sRGB only: HDR brightness and wide gamut are not preserved in the conversion. From an animated AVIF the first frame is taken, and transparency is filled with the color you choose.",
        "AV1 compresses better than JPEG, so the JPG is almost always larger than the source — often 1.5–2 times. Quality 85–90 is enough to avoid stacking visible artifacts on top of the already compressed AVIF.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему JPG получился заметно больше AVIF?",
          a: "Кодек AV1 намного эффективнее JPEG: та же картинка в AVIF весит меньше. После перекодирования рост в 1,5–2 раза — обычное дело. Уменьшить JPG можно режимом максимального сжатия MozJPEG или снижением качества до 80–85.",
        },
        {
          q: "Почему пропала яркость HDR?",
          a: "JPG хранит 8 бит на канал в sRGB и не поддерживает HDR. При декодировании цвета приводятся к sRGB, поэтому сверхъяркие блики становятся обычными белыми. Для HDR-снимков AVIF лучше хранить оригинал.",
        },
        {
          q: "Как открыть AVIF без конвертации?",
          a: "Перетащите файл в окно Chrome, Firefox или Safari 16.4+ — браузер покажет картинку. В Windows можно установить расширение AV1 Video Extension из Microsoft Store. Но если файл нужно куда-то загрузить или отредактировать, надёжнее JPG.",
        },
      ],
      en: [
        {
          q: "Why is the JPG so much larger than the AVIF?",
          a: "The AV1 codec is far more efficient than JPEG, so the same picture takes fewer bytes as AVIF. Growth of 1.5–2 times after re-encoding is normal. You can shrink the JPG with maximum compression (MozJPEG) or by lowering quality to 80–85.",
        },
        {
          q: "Why did the HDR brightness disappear?",
          a: "JPG stores 8 bits per channel in sRGB and has no HDR. Colors are mapped to sRGB during decoding, so extra-bright highlights become plain white. Keep the original AVIF for HDR shots.",
        },
        {
          q: "How can I open an AVIF without converting it?",
          a: "Drag the file into Chrome, Firefox or Safari 16.4+ and the browser will display it. On Windows you can install the AV1 Video Extension from the Microsoft Store. But if the file has to be uploaded or edited somewhere, JPG is the safer bet.",
        },
      ],
    },
  },
  {
    slug: "avif-to-png",
    from: "avif",
    to: "png",
    name: { ru: "AVIF → PNG", en: "AVIF → PNG" },
    title: {
      ru: "AVIF в PNG — без новых потерь и с прозрачностью",
      en: "AVIF to PNG — Lossless PNG with Transparency",
    },
    h1: { ru: "Конвертировать AVIF в PNG", en: "Convert AVIF to PNG" },
    description: {
      ru: "Переведите AVIF в PNG с сохранением прозрачности — для редакторов, Office и печати. PNG записывается без потерь, но весит в разы больше; HDR сводится к 8 битам.",
      en: "Turn AVIF into PNG and keep its transparency — for editors, Office and printing. PNG is lossless but several times larger; HDR is reduced to 8-bit sRGB.",
    },
    lead: {
      ru: "Картинка AVIF сохраняется в PNG пиксель в пиксель, вместе с прозрачным фоном.",
      en: "An AVIF image is saved to PNG pixel for pixel, transparent background included.",
    },
    keywords: {
      ru: [
        "avif в png",
        "конвертер avif в png",
        "avif в png онлайн",
        "перевести avif в png",
        "avif в png с прозрачностью",
      ],
      en: [
        "avif to png",
        "avif to png converter",
        "convert avif to png",
        "avif to png transparent",
        "avif to png online",
      ],
    },
    paragraphs: {
      ru: [
        "PNG нужен, когда картинку из AVIF предстоит редактировать или вставлять туда, где AVIF не читается: в презентацию, макет, документ. В отличие от JPG, PNG сохраняет альфа-канал, так что иконки, стикеры и товары на прозрачном фоне остаются без подложки.",
        "PNG записывается без потерь: каждый расшифрованный пиксель AVIF переходит в файл без изменений, и дальнейшие правки не будут добавлять артефактов. При этом 10- и 12-битный цвет и HDR сводятся к 8 битам на канал в sRGB, а у анимированного AVIF берётся только первый кадр.",
        "Вес PNG обычно в разы больше исходного AVIF, особенно на фотографиях. Для отправки фото удобнее JPG; PNG оставьте для графики, прозрачности и дальнейшей работы в редакторе.",
      ],
      en: [
        "PNG is what you need when an AVIF image is going to be edited or placed somewhere AVIF isn't read: a presentation, a layout, a document. Unlike JPG, PNG keeps the alpha channel, so icons, stickers and product cut-outs stay on a transparent background.",
        "PNG is lossless: every decoded AVIF pixel goes into the file unchanged, and later edits won't add artifacts. However, 10- and 12-bit color and HDR are reduced to 8 bits per channel in sRGB, and an animated AVIF contributes only its first frame.",
        "The PNG is usually several times larger than the AVIF, especially for photos. For sending photos JPG is more practical; keep PNG for graphics, transparency and further editing.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Зачем PNG, если AVIF намного меньше?",
          a: "AVIF хорош для показа на сайте, но его не открывают многие редакторы, Office и сервисы печати. PNG читается везде, хранит прозрачность и не теряет качество при повторных сохранениях — удобный рабочий формат.",
        },
        {
          q: "Сохранятся ли 10 или 12 бит цвета?",
          a: "Нет. Картинка декодируется в 8-битный sRGB, и PNG сохраняется с 8 битами на канал. Для экрана и печати этого достаточно, но HDR-эффект и плавность сверхшироких градиентов не сохранятся.",
        },
        {
          q: "Как уменьшить получившийся PNG?",
          a: "Откройте его в инструменте сжатия: оптимизация OxiPNG уменьшит файл без потерь, а сокращение палитры до 256 цветов и меньше даст заметно более лёгкий PNG для графики. Для фотографий меньший вес даст только переход на JPG или WebP.",
        },
      ],
      en: [
        {
          q: "Why convert to PNG when AVIF is much smaller?",
          a: "AVIF is great for displaying on websites, but many editors, Office and print services can't open it. PNG works everywhere, keeps transparency and doesn't lose quality on repeated saves — a convenient working format.",
        },
        {
          q: "Will 10- or 12-bit color be preserved?",
          a: "No. The image is decoded to 8-bit sRGB and the PNG is saved at 8 bits per channel. That's fine for screens and print, but the HDR effect and ultra-smooth wide-gamut gradients are lost.",
        },
        {
          q: "How can I make the resulting PNG smaller?",
          a: "Run it through the image compressor: OxiPNG optimization shrinks the file losslessly, and reducing the palette to 256 colors or fewer gives a much lighter PNG for graphics. For photos, only JPG or WebP will make a real difference.",
        },
      ],
    },
  },

  /* ── PNG ⇄ JPG ── */
  {
    slug: "png-to-jpg",
    from: "png",
    to: "jpg",
    name: { ru: "PNG → JPG", en: "PNG → JPG" },
    title: {
      ru: "PNG в JPG — уменьшить вес картинки в разы",
      en: "PNG to JPG — Shrink Images, Pick a Background Color",
    },
    h1: { ru: "Конвертировать PNG в JPG", en: "Convert PNG to JPG" },
    description: {
      ru: "PNG в JPG: фото становятся в несколько раз легче, прозрачный фон заливается белым или любым цветом. Качество 1–100, режим MozJPEG, пакетная обработка и ZIP.",
      en: "PNG to JPG: photos become several times lighter, and transparency is filled with white or any color you pick. Quality 1–100, MozJPEG mode, batch and ZIP.",
    },
    lead: {
      ru: "PNG превращается в компактный JPG, а прозрачные области заливаются выбранным цветом фона.",
      en: "A PNG becomes a compact JPG, and transparent areas are filled with the background color you choose.",
    },
    keywords: {
      ru: [
        "png в jpg",
        "конвертер png в jpg",
        "png в jpeg онлайн",
        "перевести png в jpg",
        "png в jpg с белым фоном",
        "конвертировать png в jpg пакетно",
      ],
      en: [
        "png to jpg",
        "png to jpg converter",
        "convert png to jpeg",
        "png to jpg white background",
        "batch png to jpg",
        "reduce png file size",
      ],
    },
    paragraphs: {
      ru: [
        "Фотографии, сохранённые в PNG — экспорт из редактора, скриншот снимка, картинка с сайта, — весят очень много: PNG хранит каждый пиксель без потерь. Тот же снимок в JPG обычно легче в 5–10 раз, поэтому его проще отправить по почте и загрузить в форму с лимитом размера.",
        "В JPG нет прозрачности: прозрачные участки заливаются цветом фона, по умолчанию белым. Полупрозрачные края смешиваются с этим цветом, поэтому выбирайте тот, на котором картинка будет показана, — иначе вокруг объекта появится светлая или тёмная кайма.",
        "Для фото ставьте качество 80–85, режим максимального сжатия MozJPEG уберёт ещё 5–15 %. Скриншоты с текстом, схемы и логотипы в JPG получают «грязные» пиксели у резких краёв — для них лучше оставить PNG или поднять качество до 90–95.",
      ],
      en: [
        "Photos saved as PNG — editor exports, screenshots of pictures, images from websites — are very heavy because PNG keeps every pixel losslessly. The same photo as JPG is usually 5–10 times smaller, which makes it easy to email or upload to a form with a size limit.",
        "JPG has no transparency: transparent areas are filled with the background color, white by default. Semi-transparent edges are blended with that color, so pick the one the image will sit on — otherwise a light or dark fringe appears around the object.",
        "Use quality 80–85 for photos; maximum compression (MozJPEG) trims another 5–15%. Screenshots with text, diagrams and logos get “dirty” pixels around sharp edges in JPG — keep them as PNG or raise quality to 90–95.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему после конвертации появился белый фон?",
          a: "JPG не умеет хранить прозрачность, поэтому прозрачные области заливаются цветом. По умолчанию это белый, но перед конвертацией можно выбрать любой — например, цвет страницы, где будет картинка. Если прозрачность нужна, конвертируйте PNG в WebP.",
        },
        {
          q: "Какое качество JPG выбрать?",
          a: "Для фото на сайт и в мессенджеры хватает 75–85, для печати и архива — 90–95. Выше 95 файл сильно растёт, а разница на глаз почти не видна.",
        },
        {
          q: "Почему скриншот с текстом стал «грязным»?",
          a: "Сжатие JPEG рассчитано на плавные переходы фотографий, а у букв резкие края — вокруг них появляются ореолы и шум. Для скриншотов и схем лучше оставить PNG или ставить качество 90–95.",
        },
      ],
      en: [
        {
          q: "Why did a white background appear after conversion?",
          a: "JPG can't store transparency, so transparent areas are filled with a color. White is the default, but you can choose any color before converting — for example, the color of the page the image will sit on. If you need transparency, convert PNG to WebP instead.",
        },
        {
          q: "What JPG quality should I choose?",
          a: "For photos on websites and in messengers 75–85 is enough; for print and archiving use 90–95. Above 95 the file grows a lot with almost no visible difference.",
        },
        {
          q: "Why does my screenshot with text look “dirty”?",
          a: "JPEG compression is designed for smooth photographic gradients, while letters have sharp edges, so halos and noise appear around them. Keep screenshots and diagrams as PNG or use quality 90–95.",
        },
      ],
    },
  },
  {
    slug: "jpg-to-png",
    from: "jpg",
    to: "png",
    name: { ru: "JPG → PNG", en: "JPG → PNG" },
    title: {
      ru: "JPG в PNG — конвертер без дальнейшей потери качества",
      en: "JPG to PNG Converter — Stop Further Quality Loss",
    },
    h1: { ru: "Конвертировать JPG в PNG", en: "Convert JPG to PNG" },
    description: {
      ru: "JPG в PNG, чтобы правки и пересохранения больше не портили картинку. Потерянное качество не вернётся, файл вырастет в 3–10 раз, а прозрачный фон не появится.",
      en: "JPG to PNG so that edits and re-saves no longer degrade the image. Lost quality won't return, the file grows 3–10 times, and no transparency appears by itself.",
    },
    lead: {
      ru: "JPG сохраняется в PNG без потерь — дальнейшее редактирование больше не будет добавлять артефактов сжатия.",
      en: "A JPG is saved as a lossless PNG, so further editing stops adding compression artifacts.",
    },
    keywords: {
      ru: [
        "jpg в png",
        "конвертер jpg в png",
        "jpeg в png онлайн",
        "перевести jpg в png",
        "сохранить фото в png",
        "jpg в png без потери качества",
      ],
      en: [
        "jpg to png",
        "jpg to png converter",
        "convert jpeg to png",
        "jpg to png online",
        "save jpg as png",
      ],
    },
    paragraphs: {
      ru: [
        "PNG из JPG делают по трём причинам: форма или редактор требует именно PNG, картинка пойдёт в многократную правку или нужен исходник для дизайна. Каждое пересохранение JPG добавляет артефакты, а PNG хранит пиксели без изменений.",
        "Чуда не будет: артефакты, которые уже есть в JPG, — квадраты, ореолы у краёв, полосы на градиентах — переходят в PNG как есть. Файл при этом растёт, у фотографий обычно в 3–10 раз, потому что сжатие без потерь плохо справляется с шумом и текстурами.",
        "Фон останется непрозрачным: в JPG нет альфа-канала, и конвертер не вырезает объекты. Круглую аватарку с прозрачными углами можно сделать круглой обрезкой, а скругление углов — отдельным инструментом; оба сохраняют результат в PNG.",
      ],
      en: [
        "People turn JPG into PNG for three reasons: a form or editor requires PNG, the image will go through many rounds of edits, or a design source file is needed. Every JPG re-save adds artifacts, while PNG keeps the pixels unchanged.",
        "Don't expect miracles: artifacts already in the JPG — blocks, halos around edges, banding in gradients — carry over to the PNG as they are. The file also grows, usually 3–10 times for photos, because lossless compression copes poorly with noise and texture.",
        "The background stays opaque: JPG has no alpha channel, and the converter doesn't cut out objects. A round avatar with transparent corners can be made with the circle crop tool, and rounded corners with their own tool; both save the result as PNG.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Улучшится ли качество фото в PNG?",
          a: "Нет. PNG сохраняет ровно те пиксели, что были в JPG, вместе с артефактами сжатия. Он лишь гарантирует, что следующие сохранения не сделают картинку хуже.",
        },
        {
          q: "Почему PNG весит намного больше JPG?",
          a: "JPG отбрасывает мелкие детали, а PNG сохраняет каждый пиксель, включая шум матрицы. Для фотографии это означает рост в несколько раз. Для чертежей, скриншотов и плоской графики разница меньше.",
        },
        {
          q: "Как сделать у картинки прозрачный фон?",
          a: "Простая смена формата прозрачности не добавит — фон JPG останется в PNG. Удалить фон вокруг объекта нужно в графическом редакторе. Для аватарки подойдёт круглая обрезка: углы вне круга станут прозрачными.",
        },
      ],
      en: [
        {
          q: "Will the photo quality improve in PNG?",
          a: "No. The PNG stores exactly the pixels that were in the JPG, compression artifacts included. It only guarantees that later saves won't make the image worse.",
        },
        {
          q: "Why is the PNG so much larger than the JPG?",
          a: "JPG discards fine detail, while PNG keeps every pixel, sensor noise included. For a photo that means a several-fold increase. For drawings, screenshots and flat graphics the gap is smaller.",
        },
        {
          q: "How do I give the image a transparent background?",
          a: "Changing the format alone won't add transparency — the JPG's background stays in the PNG. Removing the background around an object has to be done in an image editor. For an avatar, the circle crop tool works: everything outside the circle becomes transparent.",
        },
      ],
    },
  },

  /* ── To WebP / AVIF ── */
  {
    slug: "jpg-to-webp",
    from: "jpg",
    to: "webp",
    name: { ru: "JPG → WebP", en: "JPG → WebP" },
    title: {
      ru: "JPG в WebP — фото на 25–34 % легче для сайта",
      en: "JPG to WebP — 25–34% Smaller Photos for Your Site",
    },
    h1: { ru: "Конвертировать JPG в WebP", en: "Convert JPG to WebP" },
    description: {
      ru: "JPG в WebP для быстрой загрузки сайта: по данным Google файл на 25–34 % меньше при сопоставимом качестве. Качество 1–100, пакетная обработка, скачивание ZIP.",
      en: "JPG to WebP for faster pages: per Google, files are 25–34% smaller at comparable quality. Quality slider 1–100, batch conversion and ZIP download.",
    },
    lead: {
      ru: "Фотографии JPG перекодируются в WebP — страницы с ними грузятся быстрее за счёт меньшего веса.",
      en: "JPG photos are re-encoded to WebP, so pages that use them load faster thanks to smaller files.",
    },
    keywords: {
      ru: [
        "jpg в webp",
        "конвертер jpg в webp",
        "jpeg в webp онлайн",
        "перевести jpg в webp",
        "webp для сайта",
        "конвертировать фото в webp пакетно",
      ],
      en: [
        "jpg to webp",
        "jpg to webp converter",
        "convert jpeg to webp",
        "webp for website",
        "batch jpg to webp",
        "serve images in next-gen formats",
      ],
    },
    paragraphs: {
      ru: [
        "Картинки — обычно самая тяжёлая часть страницы, и Lighthouse в PageSpeed Insights прямо советует отдавать их в современных форматах. WebP показывают все актуальные браузеры, включая Safari с 14-й версии, так что замена JPG на WebP почти ничем не рискует.",
        "Для фото ставьте качество 75–85; цифры шкалы WebP не совпадают с JPG, поэтому сравните результат с оригиналом при увеличении. Перекодирование — второе поколение сжатия с потерями: чем лучше исходный JPG, тем чище WebP, а из сильно пережатого JPG выигрыш будет меньше.",
        "WebP кодирует браузер, а в Safari, который сам WebP не записывает, — библиотека libwebp, так что результат одинаков везде. EXIF-данные при этом удаляются, что дополнительно экономит килобайты. Для e-mail-рассылок оставьте JPG: часть почтовых клиентов, например Outlook для Windows, WebP не показывает.",
      ],
      en: [
        "Images are usually the heaviest part of a page, and Lighthouse in PageSpeed Insights explicitly recommends serving them in modern formats. Every current browser displays WebP, including Safari since version 14, so swapping JPG for WebP carries almost no risk.",
        "Use quality 75–85 for photos; WebP's scale doesn't match JPG's, so compare the result with the original zoomed in. Re-encoding is a second generation of lossy compression: the better the source JPG, the cleaner the WebP, and a heavily compressed JPG gains less.",
        "WebP is encoded by the browser, and in Safari, which can't write WebP, by libwebp, so the result is the same everywhere. EXIF data is removed along the way, saving a few more kilobytes. Keep JPG for email newsletters: some mail clients, such as Outlook for Windows, don't display WebP.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Насколько уменьшится файл?",
          a: "Google оценивает выигрыш WebP в 25–34 % при сопоставимом качестве, но на практике всё зависит от снимка и выбранного качества. Если WebP не получился меньше исходника, разумнее оставить JPG.",
        },
        {
          q: "Все ли браузеры поддерживают WebP?",
          a: "Да, все актуальные: Chrome, Edge, Firefox с 65-й версии и Safari с 14-й (2020 год). Проблемы возможны только в очень старых браузерах и некоторых почтовых клиентах.",
        },
        {
          q: "Сохранятся ли EXIF-данные фотографии?",
          a: "Нет, при перекодировании в WebP метаданные — камера, дата, GPS — удаляются. Для сайта это плюс: файл легче и не раскрывает место съёмки. Если EXIF нужен, храните исходный JPG.",
        },
      ],
      en: [
        {
          q: "How much smaller will the file get?",
          a: "Google estimates WebP saves 25–34% at comparable quality, but in practice it depends on the photo and the quality you choose. If the WebP doesn't come out smaller than the source, keep the JPG.",
        },
        {
          q: "Do all browsers support WebP?",
          a: "Yes, all current ones: Chrome, Edge, Firefox since version 65 and Safari since version 14 (2020). Problems only arise in very old browsers and some email clients.",
        },
        {
          q: "Is the photo's EXIF data kept?",
          a: "No, re-encoding to WebP removes the metadata — camera, date, GPS. For a website that's a plus: a lighter file that doesn't reveal where the photo was taken. If you need the EXIF, keep the original JPG.",
        },
      ],
    },
  },
  {
    slug: "png-to-webp",
    from: "png",
    to: "webp",
    name: { ru: "PNG → WebP", en: "PNG → WebP" },
    title: {
      ru: "PNG в WebP — меньше вес, прозрачность на месте",
      en: "PNG to WebP — Smaller Files, Transparency Kept",
    },
    h1: { ru: "Конвертировать PNG в WebP", en: "Convert PNG to WebP" },
    description: {
      ru: "PNG в WebP с сохранением альфа-канала: товары, иконки и иллюстрации на прозрачном фоне весят в разы меньше. Качество 1–100, пакетная обработка и ZIP-архив.",
      en: "PNG to WebP with the alpha channel kept: product shots, icons and illustrations on transparent backgrounds get several times lighter. Quality 1–100, batch, ZIP.",
    },
    lead: {
      ru: "PNG-картинки с прозрачностью перекодируются в WebP — фон остаётся прозрачным, а файл становится легче.",
      en: "Transparent PNGs are re-encoded to WebP — the background stays transparent while the file gets lighter.",
    },
    keywords: {
      ru: [
        "png в webp",
        "конвертер png в webp",
        "png в webp с прозрачностью",
        "перевести png в webp",
        "png в webp онлайн",
      ],
      en: [
        "png to webp",
        "png to webp converter",
        "png to webp transparent",
        "convert png to webp",
        "batch png to webp",
      ],
    },
    paragraphs: {
      ru: [
        "Самые тяжёлые PNG на сайтах — фотографии с прозрачным фоном: вырезанные товары, портреты, иллюстрации. JPG здесь не подходит из-за отсутствия альфа-канала, а WebP сохраняет прозрачность и при этом весит в разы меньше PNG.",
        "Для фото с прозрачностью хватает качества 80–85. Логотипы, текст и тонкие линии на сжатии с потерями могут «поплыть» по краям — для них ставьте 90–100 и проверяйте результат при увеличении.",
        "Выигрыш сильнее всего на фотографических PNG; у маленьких иконок и пиксель-арта разница невелика, а векторные логотипы лучше держать в SVG. Если площадка не принимает WebP, например некоторые рекламные сети или маркетплейсы, оставьте PNG.",
      ],
      en: [
        "The heaviest PNGs on websites are photos with transparent backgrounds: product cut-outs, portraits, illustrations. JPG won't do because it has no alpha channel, while WebP keeps the transparency and is several times smaller than PNG.",
        "Quality 80–85 is enough for photos with transparency. Logos, text and thin lines can blur at the edges under lossy compression — use 90–100 for them and check the result zoomed in.",
        "Savings are biggest on photographic PNGs; small icons and pixel art gain little, and vector logos are better kept as SVG. If a platform doesn't accept WebP, as some ad networks and marketplaces don't, stay with PNG.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранится ли прозрачный фон?",
          a: "Да. WebP поддерживает полноценный альфа-канал, поэтому прозрачные и полупрозрачные пиксели — тени, сглаженные края — переносятся из PNG как есть.",
        },
        {
          q: "Почему края логотипа стали размытыми?",
          a: "WebP с потерями усредняет цвета мелкими блоками, и на резких контрастных краях это заметно. Поднимите качество до 90–100 или оставьте логотип в PNG или SVG.",
        },
        {
          q: "Когда лучше не переводить PNG в WebP?",
          a: "Когда важна каждая точка: пиксель-арт, скриншоты интерфейсов для документации, иконки 16–32 px. А также если сервис, куда вы загружаете картинку, принимает только PNG и JPG.",
        },
      ],
      en: [
        {
          q: "Will the transparent background be kept?",
          a: "Yes. WebP supports a full alpha channel, so transparent and semi-transparent pixels — shadows, anti-aliased edges — carry over from the PNG as they are.",
        },
        {
          q: "Why did my logo's edges get blurry?",
          a: "Lossy WebP averages colors in small blocks, which shows on sharp, high-contrast edges. Raise quality to 90–100 or keep the logo as PNG or SVG.",
        },
        {
          q: "When should I not convert PNG to WebP?",
          a: "When every pixel matters: pixel art, UI screenshots for documentation, 16–32 px icons. Also when the service you're uploading to only accepts PNG and JPG.",
        },
      ],
    },
  },
  {
    slug: "jpg-to-avif",
    from: "jpg",
    to: "avif",
    name: { ru: "JPG → AVIF", en: "JPG → AVIF" },
    title: {
      ru: "JPG в AVIF — сжатие нового поколения для фото",
      en: "JPG to AVIF — Next-Generation Compression for Photos",
    },
    h1: { ru: "Конвертировать JPG в AVIF", en: "Convert JPG to AVIF" },
    description: {
      ru: "JPG в AVIF: фото нередко в 1,5–2 раза легче при сопоставимом качестве. Кодек libavif прямо в браузере; AVIF открывают Chrome 85+, Firefox 93+ и Safari 16.4+.",
      en: "JPG to AVIF: photos are often 1.5–2 times lighter at comparable quality. Encoded by libavif in-browser; AVIF opens in Chrome 85+, Firefox 93+, Safari 16.4+.",
    },
    lead: {
      ru: "Фотографии JPG перекодируются в AVIF — самый компактный из форматов, которые понимают современные браузеры.",
      en: "JPG photos are re-encoded to AVIF, the most compact format modern browsers understand.",
    },
    keywords: {
      ru: [
        "jpg в avif",
        "конвертер jpg в avif",
        "jpeg в avif онлайн",
        "перевести фото в avif",
        "avif для сайта",
      ],
      en: [
        "jpg to avif",
        "jpg to avif converter",
        "convert jpeg to avif",
        "avif for website",
        "jpg to avif online",
      ],
    },
    paragraphs: {
      ru: [
        "AVIF сжимает фотографии кодеком AV1 и обычно обгоняет не только JPG, но и WebP, особенно на плавных градиентах неба и кожи. Это хороший выбор для сайтов с большими фото: галерей, лендингов, каталогов.",
        "Браузеры пока не умеют записывать AVIF сами, поэтому кодирует библиотека libavif, скомпилированная в WebAssembly. Это медленно: фото на 20+ Мп может обрабатываться заметно дольше, чем в JPG или WebP, — прогресс виден, а задачу можно отменить. Перед пакетной конвертацией стоит уменьшить размеры снимков.",
        "Шкала качества AVIF не совпадает с JPG: начните с 60–70 и сравните с оригиналом при увеличении. На сайте отдавайте AVIF через тег <picture> с запасным JPG или WebP — для старых браузеров, почты и соцсетей, которые AVIF принимают не всегда.",
      ],
      en: [
        "AVIF compresses photos with the AV1 codec and usually beats not only JPG but also WebP, especially on smooth sky and skin gradients. It's a good choice for sites with large photos: galleries, landing pages, catalogs.",
        "Browsers can't encode AVIF themselves yet, so the encoding is done by libavif compiled to WebAssembly. It's slow: a 20+ MP photo can take noticeably longer than JPG or WebP — progress is shown and the job can be cancelled. Scale photos down before a large batch.",
        "AVIF's quality scale doesn't match JPG's: start at 60–70 and compare with the original zoomed in. On a website, serve AVIF through a <picture> element with a JPG or WebP fallback for old browsers, email and social networks, which don't always accept AVIF.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему кодирование в AVIF такое долгое?",
          a: "Кодек AV1 перебирает гораздо больше вариантов сжатия, чем JPEG, и работает не встроенным кодировщиком браузера, а через WebAssembly. Большие снимки кодируются дольше, поэтому сначала уменьшите их до нужного на сайте размера.",
        },
        {
          q: "Какое качество AVIF ставить?",
          a: "Для большинства фото начинайте с 60–70: из-за другой шкалы это обычно выглядит не хуже JPG с качеством 80–85. Если на увеличении видно размытие мелких деталей, поднимите значение на 5–10.",
        },
        {
          q: "Нужен ли на сайте запасной JPG?",
          a: "Желательно. Современные браузеры AVIF показывают, но Safari до 16.4 и старые устройства — нет. Тег <picture> с источником AVIF и запасным JPG или WebP решает проблему без JavaScript.",
        },
      ],
      en: [
        {
          q: "Why is AVIF encoding so slow?",
          a: "The AV1 codec searches far more compression options than JPEG, and it runs through WebAssembly rather than the browser's built-in encoder. Large photos take longer, so scale them down to the size your site actually needs first.",
        },
        {
          q: "What AVIF quality should I use?",
          a: "For most photos start at 60–70: because the scale differs, that usually looks no worse than JPG at 80–85. If fine detail looks smeared when zoomed in, raise the value by 5–10.",
        },
        {
          q: "Do I need a fallback JPG on my site?",
          a: "It's advisable. Modern browsers display AVIF, but Safari before 16.4 and older devices don't. A <picture> element with an AVIF source and a JPG or WebP fallback solves it without JavaScript.",
        },
      ],
    },
  },
  {
    slug: "png-to-avif",
    from: "png",
    to: "avif",
    name: { ru: "PNG → AVIF", en: "PNG → AVIF" },
    title: {
      ru: "PNG в AVIF — компактные картинки с прозрачностью",
      en: "PNG to AVIF — Compact Images with Transparency",
    },
    h1: { ru: "Конвертировать PNG в AVIF", en: "Convert PNG to AVIF" },
    description: {
      ru: "PNG в AVIF с альфа-каналом: прозрачный фон сохраняется, а вес падает в разы. Кодирование libavif в браузере, качество 1–100, пакетная обработка и ZIP-архив.",
      en: "PNG to AVIF with the alpha channel intact: transparency stays while file size drops several times. libavif encoding in-browser, quality 1–100, batch and ZIP.",
    },
    lead: {
      ru: "PNG с прозрачностью перекодируется в AVIF — фон остаётся прозрачным, файл становится в разы меньше.",
      en: "A transparent PNG is re-encoded to AVIF — the background stays transparent and the file gets several times smaller.",
    },
    keywords: {
      ru: [
        "png в avif",
        "конвертер png в avif",
        "png в avif с прозрачностью",
        "перевести png в avif",
        "png в avif онлайн",
      ],
      en: [
        "png to avif",
        "png to avif converter",
        "png to avif transparent",
        "convert png to avif",
        "png to avif online",
      ],
    },
    paragraphs: {
      ru: [
        "AVIF поддерживает полноценный альфа-канал, поэтому им можно заменить тяжёлые PNG с прозрачностью: товары без фона, иллюстрации, крупные декоративные картинки на лендингах. Фотографическое содержимое сжимается особенно сильно.",
        "Кодирует библиотека libavif в WebAssembly — браузеры сами AVIF не записывают. На больших картинках это занимает заметное время, зато прогресс виден и задачу можно отменить.",
        "Плоская графика с тонкими линиями и мелким текстом на сжатии с потерями может потерять резкость — для неё ставьте качество 80+ или оставляйте PNG и SVG. AVIF открывают Chrome 85+, Firefox 93+, Safari 16.4+ и Edge 121+; для остальных держите запасной PNG или WebP.",
      ],
      en: [
        "AVIF supports a full alpha channel, so it can replace heavy transparent PNGs: product cut-outs, illustrations, large decorative images on landing pages. Photographic content compresses especially well.",
        "Encoding is done by libavif in WebAssembly, since browsers can't write AVIF themselves. Large images take noticeable time, but progress is shown and the job can be cancelled.",
        "Flat graphics with thin lines and small text can lose sharpness under lossy compression — use quality 80+ for them or stick with PNG and SVG. AVIF opens in Chrome 85+, Firefox 93+, Safari 16.4+ and Edge 121+; keep a PNG or WebP fallback for everything else.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранится ли полупрозрачность?",
          a: "Да. AVIF хранит альфа-канал, поэтому мягкие тени, сглаженные края и полупрозрачные элементы переносятся из PNG. Проверьте края при увеличении, если качество выставлено низкое.",
        },
        {
          q: "Что выбрать для прозрачных картинок — WebP или AVIF?",
          a: "AVIF обычно даёт файл меньше, но кодируется медленнее и поддерживается чуть уже: Safari только с 16.4, а WebP — с 14. Если нужна максимальная совместимость, берите WebP; если важен каждый килобайт, AVIF.",
        },
        {
          q: "Подойдёт ли AVIF для скриншотов и схем?",
          a: "На высоком качестве — да, но сжатие с потерями может смягчить тонкие линии и мелкий текст. Для документации и интерфейсов надёжнее PNG, а для схем, нарисованных в векторе, — SVG.",
        },
      ],
      en: [
        {
          q: "Will semi-transparency be preserved?",
          a: "Yes. AVIF stores an alpha channel, so soft shadows, anti-aliased edges and semi-transparent elements carry over from the PNG. Check the edges zoomed in if you set a low quality.",
        },
        {
          q: "Which is better for transparent images — WebP or AVIF?",
          a: "AVIF usually gives a smaller file but encodes more slowly and has slightly narrower support: Safari only from 16.4, versus 14 for WebP. For maximum compatibility choose WebP; when every kilobyte counts, AVIF.",
        },
        {
          q: "Is AVIF good for screenshots and diagrams?",
          a: "At high quality, yes, but lossy compression can soften thin lines and small text. PNG is safer for documentation and UI, and SVG for diagrams drawn as vectors.",
        },
      ],
    },
  },
  /* ── SVG ── */
  {
    slug: "svg-to-png",
    from: "svg",
    to: "png",
    name: { ru: "SVG → PNG", en: "SVG → PNG" },
    title: {
      ru: "SVG в PNG — растровая картинка нужного размера",
      en: "SVG to PNG — Render Vector Graphics at Any Size",
    },
    h1: { ru: "Конвертировать SVG в PNG", en: "Convert SVG to PNG" },
    description: {
      ru: "SVG в PNG любого размера: по умолчанию берутся ширина и высота из файла или 1024 px по viewBox. Прозрачный фон сохраняется, скрипты внутри SVG не выполняются.",
      en: "SVG to PNG at any size: by default the file's own width and height, or 1024 px wide for viewBox-only SVGs. Transparency is kept; scripts inside never run.",
    },
    lead: {
      ru: "Векторный SVG отрисовывается в PNG с тем размером в пикселях, который вы зададите, — с прозрачным фоном.",
      en: "A vector SVG is rendered to a PNG at the pixel size you set, with a transparent background.",
    },
    keywords: {
      ru: [
        "svg в png",
        "конвертер svg в png",
        "svg в png онлайн",
        "перевести svg в png",
        "svg в png с прозрачным фоном",
        "svg в png высокого разрешения",
      ],
      en: [
        "svg to png",
        "svg to png converter",
        "convert svg to png",
        "svg to png transparent",
        "svg to png high resolution",
        "svg to png online",
      ],
    },
    paragraphs: {
      ru: [
        "Соцсети, мессенджеры, маркетплейсы, почтовые клиенты и многие редакторы документов SVG не принимают, поэтому логотипы и иконки приходится отдавать растровой копией. PNG — лучший вариант: он без потерь и сохраняет прозрачность.",
        "Вектор можно отрисовать в любом размере без потери чёткости. По умолчанию берутся width и height из самого SVG, а если задан только viewBox — ширина 1024 px. Для ретина-экранов берите удвоенный размер показа, для печати считайте пиксели по формуле «сантиметры × dpi ÷ 2,54»: 10 см при 300 dpi ≈ 1181 px.",
        "SVG рисуется безопасно: скрипты не выполняются, внешние картинки и шрифты по ссылкам не загружаются. Поэтому текст, набранный веб-шрифтом, может замениться системным — перед экспортом переведите надписи в кривые или встройте картинки в сам SVG.",
      ],
      en: [
        "Social networks, messengers, marketplaces, email clients and many document editors don't accept SVG, so logos and icons have to be shared as raster copies. PNG is the best choice: it's lossless and keeps transparency.",
        "A vector can be rendered at any size without losing sharpness. By default the SVG's own width and height are used, or 1024 px wide if only a viewBox is set. For Retina screens use twice the display size; for print, calculate pixels as “inches × dpi” or “cm × dpi ÷ 2.54”: 4 in at 300 dpi = 1,200 px.",
        "The SVG is rendered safely: scripts don't run, and external images and fonts referenced by URL are not loaded. So text set in a web font may fall back to a system font — convert text to outlines before exporting or embed images inside the SVG.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер PNG выбрать?",
          a: "Для сайта — фактический размер показа, умноженный на 2 для ретина-экранов: логотип шириной 200 px сохраняйте в 400 px. Для печати умножьте сантиметры на dpi и разделите на 2,54. Вектор не теряет чёткости при увеличении, так что с запасом можно не стесняться.",
        },
        {
          q: "Почему шрифт в PNG отличается от оригинала?",
          a: "SVG ссылается на шрифт, который не встроен в файл, а внешние ресурсы при отрисовке не загружаются. Браузер подставляет системный шрифт. Решение — перевести текст в кривые в редакторе (Illustrator, Inkscape, Figma) и конвертировать заново.",
        },
        {
          q: "Почему часть картинки пропала?",
          a: "Скорее всего, SVG подключает растровые изображения по внешней ссылке — такие файлы не загружаются. Встройте их в SVG как data URI или экспортируйте из редактора с опцией внедрения изображений.",
        },
      ],
      en: [
        {
          q: "What PNG size should I choose?",
          a: "For a website, use the actual display size multiplied by 2 for Retina screens: a 200 px wide logo should be saved at 400 px. For print, multiply inches by the dpi. Vectors don't lose sharpness when scaled up, so a generous size is fine.",
        },
        {
          q: "Why does the font in the PNG differ from the original?",
          a: "The SVG references a font that isn't embedded in the file, and external resources aren't loaded during rendering, so the browser substitutes a system font. Convert the text to outlines in your editor (Illustrator, Inkscape, Figma) and convert again.",
        },
        {
          q: "Why is part of the image missing?",
          a: "Most likely the SVG links raster images by external URL, and such files aren't loaded. Embed them in the SVG as data URIs or export from your editor with the embed-images option.",
        },
      ],
    },
  },
  {
    slug: "svg-to-jpg",
    from: "svg",
    to: "jpg",
    name: { ru: "SVG → JPG", en: "SVG → JPG" },
    title: {
      ru: "SVG в JPG — вектор в картинку на сплошном фоне",
      en: "SVG to JPG — Vector Art on a Solid Background",
    },
    h1: { ru: "Конвертировать SVG в JPG", en: "Convert SVG to JPG" },
    description: {
      ru: "SVG в JPG для соцсетей, почты и документов: прозрачность заливается белым или любым цветом, размер в px вы задаёте сами. Качество 1–100, пакетная обработка.",
      en: "SVG to JPG for social media, email and documents: transparency is filled with white or any color, and you set the pixel size. Quality 1–100, batch processing.",
    },
    lead: {
      ru: "SVG отрисовывается в выбранном размере и сохраняется как JPG на сплошном фоне.",
      en: "An SVG is rendered at the size you choose and saved as a JPG on a solid background.",
    },
    keywords: {
      ru: [
        "svg в jpg",
        "конвертер svg в jpg",
        "svg в jpeg онлайн",
        "перевести svg в jpg",
        "svg в jpg с белым фоном",
      ],
      en: [
        "svg to jpg",
        "svg to jpg converter",
        "convert svg to jpeg",
        "svg to jpg white background",
        "svg to jpg online",
      ],
    },
    paragraphs: {
      ru: [
        "JPG вместо PNG нужен, когда сервис принимает только его: некоторые формы загрузки, фотопечать, старые CMS. Для сложных иллюстраций с градиентами и фотографическими элементами JPG к тому же заметно легче PNG.",
        "У большинства SVG прозрачный фон, а в JPG прозрачности нет: пустые области заливаются выбранным цветом, по умолчанию белым. Полупрозрачные элементы смешиваются с этим цветом, так что для тёмной темы или фирменной подложки выберите его заранее.",
        "Логотипы и схемы с резкими краями в JPG обрастают «грязными» пикселями — ставьте качество 90–100. Размер задаётся в пикселях; как и при любом растрировании, внешние шрифты и картинки по ссылкам не загружаются.",
      ],
      en: [
        "You need JPG rather than PNG when a service accepts nothing else: some upload forms, photo printing, old CMSs. For complex illustrations with gradients and photographic elements, JPG is also noticeably lighter than PNG.",
        "Most SVGs have a transparent background, and JPG has no transparency: empty areas are filled with the color you choose, white by default. Semi-transparent elements blend with that color, so pick it beforehand for a dark theme or a brand-colored backdrop.",
        "Logos and diagrams with sharp edges collect “dirty” pixels in JPG — use quality 90–100. The size is set in pixels; as with any rasterization, external fonts and linked images are not loaded.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему вокруг линий появились «грязные» пиксели?",
          a: "Сжатие JPEG плохо переносит резкие границы между заливками, которых в векторной графике много. Поднимите качество до 90–100 или сохраните в PNG — он без потерь.",
        },
        {
          q: "Можно ли сделать фон не белым?",
          a: "Да. Перед конвертацией выберите любой цвет фона — им зальются все прозрачные и полупрозрачные участки SVG. Если прозрачность нужно сохранить, конвертируйте SVG в PNG или WebP.",
        },
        {
          q: "Какой размер нужен для печати?",
          a: "Умножьте размер отпечатка в сантиметрах на 300 и разделите на 2,54: для 10 × 15 см это примерно 1181 × 1772 px. После конвертации пропишите 300 dpi в инструменте изменения DPI — он меняет только заголовок файла, не пересжимая пиксели.",
        },
      ],
      en: [
        {
          q: "Why are there “dirty” pixels around the lines?",
          a: "JPEG compression handles sharp boundaries between flat fills poorly, and vector art is full of them. Raise quality to 90–100 or save as PNG, which is lossless.",
        },
        {
          q: "Can the background be something other than white?",
          a: "Yes. Pick any background color before converting — it fills every transparent and semi-transparent area of the SVG. To keep transparency, convert SVG to PNG or WebP instead.",
        },
        {
          q: "What size do I need for printing?",
          a: "Multiply the print size in inches by 300: a 4 × 6 in print needs 1,200 × 1,800 px. After converting, set 300 dpi with the DPI changer — it only edits the file header without re-compressing the pixels.",
        },
      ],
    },
  },
  {
    slug: "svg-to-webp",
    from: "svg",
    to: "webp",
    name: { ru: "SVG → WebP", en: "SVG → WebP" },
    title: {
      ru: "SVG в WebP — растровая копия логотипа для сайта",
      en: "SVG to WebP — Rasterize Vector Art for the Web",
    },
    h1: { ru: "Конвертировать SVG в WebP", en: "Convert SVG to WebP" },
    description: {
      ru: "SVG в WebP с прозрачным фоном: растровая копия нужного размера для WordPress и других CMS, где загрузка SVG запрещена. Легче PNG, качество 1–100, пакетно.",
      en: "SVG to WebP with a transparent background: a raster copy at any size for WordPress and other CMSs that block SVG uploads. Lighter than PNG, quality 1–100.",
    },
    lead: {
      ru: "SVG превращается в WebP заданного размера — легче PNG и с сохранением прозрачности.",
      en: "An SVG becomes a WebP at the size you set — lighter than PNG, with transparency kept.",
    },
    keywords: {
      ru: [
        "svg в webp",
        "конвертер svg в webp",
        "svg в webp онлайн",
        "перевести svg в webp",
        "svg в растр",
      ],
      en: [
        "svg to webp",
        "svg to webp converter",
        "convert svg to webp",
        "rasterize svg",
        "svg to webp online",
      ],
    },
    paragraphs: {
      ru: [
        "WordPress по умолчанию не даёт загружать SVG, и многие другие CMS и конструкторы тоже: внутри SVG может быть скрипт. Растровая копия в WebP решает проблему и весит меньше PNG, сохраняя прозрачный фон.",
        "Растрировать имеет смысл и тяжёлые иллюстрации: SVG с тысячами узлов, фильтрами и размытием браузер рисует медленно, а готовая картинка WebP показывается мгновенно. Простые иконки и логотипы, наоборот, выгоднее оставить в SVG — они легче и чётче на любом экране.",
        "Задавайте ширину вдвое больше размера показа, чтобы на ретина-экранах не было мыла. Для плоской графики и текста ставьте качество 90–100, иначе резкие края могут размыться.",
      ],
      en: [
        "WordPress blocks SVG uploads by default, as do many other CMSs and site builders, because an SVG can contain scripts. A WebP raster copy solves that and is lighter than PNG while keeping a transparent background.",
        "Heavy illustrations are also worth rasterizing: an SVG with thousands of nodes, filters and blurs renders slowly, while a finished WebP displays instantly. Simple icons and logos, on the other hand, are better left as SVG — they're lighter and sharper on any screen.",
        "Set the width to twice the display size so the image isn't soft on Retina screens. Use quality 90–100 for flat graphics and text, or sharp edges may blur.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Зачем растрировать SVG, если браузеры его показывают?",
          a: "Браузеры показывают, но загрузить SVG часто не дают CMS, соцсети и маркетплейсы — из-за возможных скриптов внутри. Кроме того, сложные SVG с фильтрами отрисовываются медленнее готовой картинки.",
        },
        {
          q: "Какую ширину выбрать для ретина-экранов?",
          a: "Удвойте ширину, в которой картинка показывается на странице: для блока 600 px сохраняйте 1200 px. Браузер уменьшит изображение, и оно останется чётким на экранах с высокой плотностью пикселей.",
        },
        {
          q: "Сохранится ли анимация SVG?",
          a: "Нет. Получится статичная картинка — один момент анимации. Анимированный WebP этот конвертер не создаёт.",
        },
      ],
      en: [
        {
          q: "Why rasterize an SVG if browsers can display it?",
          a: "Browsers display it, but CMSs, social networks and marketplaces often refuse SVG uploads because of possible scripts inside. Complex SVGs with filters also render more slowly than a ready-made image.",
        },
        {
          q: "What width should I use for Retina screens?",
          a: "Double the width the image is displayed at: for a 600 px block, save 1,200 px. The browser scales it down, and it stays crisp on high-density screens.",
        },
        {
          q: "Will the SVG animation be preserved?",
          a: "No. You get a static image — a single moment of the animation. This converter doesn't produce animated WebP.",
        },
      ],
    },
  },
  {
    slug: "svg-to-ico",
    from: "svg",
    to: "ico",
    name: { ru: "SVG → ICO", en: "SVG → ICO" },
    title: {
      ru: "SVG в ICO — иконка для сайта и Windows из вектора",
      en: "SVG to ICO — Favicon and Windows Icon from Vector",
    },
    h1: { ru: "Конвертировать SVG в ICO", en: "Convert SVG to ICO" },
    description: {
      ru: "SVG в ICO: один файл с размерами 16, 24, 32, 48, 64, 128 и 256 px на выбор, изображения внутри хранятся в PNG с прозрачностью. Для favicon хватит 16, 32 и 48.",
      en: "SVG to ICO: one file with your choice of 16, 24, 32, 48, 64, 128 and 256 px sizes, stored as transparent PNG entries. For a favicon, 16, 32 and 48 are enough.",
    },
    lead: {
      ru: "Векторный логотип превращается в файл .ico с набором размеров — для favicon или значка программы.",
      en: "A vector logo becomes an .ico file with a set of sizes, ready for a favicon or an app icon.",
    },
    keywords: {
      ru: [
        "svg в ico",
        "конвертер svg в ico",
        "svg в favicon",
        "создать favicon из svg",
        "svg в ico онлайн",
      ],
      en: [
        "svg to ico",
        "svg to ico converter",
        "svg to favicon",
        "convert svg to ico",
        "svg to ico online",
      ],
    },
    paragraphs: {
      ru: [
        "Вектор — лучший исходник для иконки: SVG растрируется без потерь чёткости, и каждый размер в ICO получается резким. Изображения внутри файла хранятся в PNG с прозрачностью — такой ICO понимают все браузеры и Windows начиная с Vista.",
        "Для favicon.ico обычно включают 16, 32 и 48 px, для значков программ и ярлыков Windows — 16, 24, 32, 48 и 256 px. Лишние размеры увеличивают файл, а браузеру для вкладки нужны только самые маленькие.",
        "На 16×16 детали логотипа сливаются: для маленьких размеров лучше упрощённый знак — буква, символ, толстые линии — и квадратный viewBox. Полный набор для сайта (apple-touch-icon 180 px, иконки 192 и 512 px и site.webmanifest) собирает генератор favicon.",
      ],
      en: [
        "A vector is the best source for an icon: the SVG is rasterized without losing sharpness, so every size in the ICO comes out crisp. The images inside are stored as transparent PNGs, which every browser and Windows since Vista understand.",
        "A favicon.ico usually contains 16, 32 and 48 px; Windows program and shortcut icons use 16, 24, 32, 48 and 256 px. Extra sizes only enlarge the file, and a browser tab needs just the smallest ones.",
        "At 16×16 logo details merge together: small sizes look better with a simplified mark — a letter, a symbol, thick lines — and a square viewBox. The full website set (180 px apple-touch-icon, 192 and 512 px icons and site.webmanifest) is built by the favicon generator.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какие размеры включить в favicon.ico?",
          a: "Стандартный набор — 16, 32 и 48 px: 16 — для вкладки браузера, 32 — для закладок и экранов с высокой плотностью, 48 — для ярлыков Windows. Большие размеры для сайта задаются отдельными PNG.",
        },
        {
          q: "Почему значок 16×16 выглядит кашей?",
          a: "В 256 пикселях не помещаются мелкий текст и тонкие линии логотипа. Сделайте для маленьких размеров упрощённую версию — первую букву или символ бренда — и сконвертируйте её отдельно.",
        },
        {
          q: "Откроется ли такой ICO в старых Windows?",
          a: "Иконки хранятся в PNG, что поддерживается начиная с Windows Vista и во всех браузерах. Windows XP изображения PNG внутри ICO не читает, но для современных систем и сайтов это не важно.",
        },
      ],
      en: [
        {
          q: "Which sizes should go into favicon.ico?",
          a: "The standard set is 16, 32 and 48 px: 16 for the browser tab, 32 for bookmarks and high-density screens, 48 for Windows shortcuts. Larger sizes for a website are provided as separate PNGs.",
        },
        {
          q: "Why does the 16×16 icon look like mush?",
          a: "Small text and thin logo lines don't fit into 256 pixels. Make a simplified version for small sizes — the first letter or the brand symbol — and convert it separately.",
        },
        {
          q: "Will this ICO work on old Windows versions?",
          a: "The icons are stored as PNG, which is supported since Windows Vista and in every browser. Windows XP can't read PNG images inside an ICO, but that doesn't matter for modern systems and websites.",
        },
      ],
    },
  },

  /* ── ICO ── */
  {
    slug: "png-to-ico",
    from: "png",
    to: "ico",
    name: { ru: "PNG → ICO", en: "PNG → ICO" },
    title: {
      ru: "PNG в ICO — favicon и иконка Windows до 256×256",
      en: "PNG to ICO — Favicon and Windows Icons up to 256×256",
    },
    h1: { ru: "Конвертировать PNG в ICO", en: "Convert PNG to ICO" },
    description: {
      ru: "PNG в ICO с прозрачностью: выберите размеры от 16 до 256 px, и они соберутся в один файл .ico для favicon сайта, ярлыка, папки или программы Windows.",
      en: "PNG to ICO with transparency: pick sizes from 16 to 256 px and they're packed into one .ico file for a site favicon or a Windows shortcut, folder or program.",
    },
    lead: {
      ru: "Картинка PNG превращается в файл .ico с несколькими размерами иконки внутри — прозрачность сохраняется.",
      en: "A PNG image becomes an .ico file with several icon sizes inside, transparency preserved.",
    },
    keywords: {
      ru: [
        "png в ico",
        "конвертер png в ico",
        "png в ico онлайн",
        "сделать иконку ico из png",
        "png в favicon.ico",
        "иконка для папки windows",
      ],
      en: [
        "png to ico",
        "png to ico converter",
        "convert png to ico",
        "png to favicon.ico",
        "make ico from png",
        "windows folder icon",
      ],
    },
    paragraphs: {
      ru: [
        "Формат ICO нужен в двух местах: в корне сайта как favicon.ico, который браузеры запрашивают автоматически, и в Windows — для значков ярлыков, папок и программ. Обычный PNG туда не подставить, а ICO хранит сразу несколько размеров, и система выбирает подходящий.",
        "Лучший исходник — квадратный PNG не меньше 256×256 px с прозрачным фоном: из него получаются все выбранные размеры (16, 24, 32, 48, 64, 128, 256 px). Внутри ICO изображения хранятся в PNG, поэтому полупрозрачные края и тени остаются мягкими.",
        "Проверьте, как иконка читается в 16 px: тонкие линии и мелкий текст на таком размере пропадают. Если нужен полный набор для сайта — PNG-иконки, apple-touch-icon и манифест — воспользуйтесь генератором favicon.",
      ],
      en: [
        "ICO is needed in two places: at the site root as favicon.ico, which browsers request automatically, and in Windows for shortcut, folder and program icons. A plain PNG won't work there, while an ICO holds several sizes and the system picks the right one.",
        "The best source is a square PNG of at least 256×256 px with a transparent background: all chosen sizes (16, 24, 32, 48, 64, 128, 256 px) are made from it. The images inside the ICO are stored as PNG, so semi-transparent edges and shadows stay smooth.",
        "Check how the icon reads at 16 px: thin lines and small text disappear at that size. If you need the complete website set — PNG icons, apple-touch-icon and a manifest — use the favicon generator.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какого размера должен быть исходный PNG?",
          a: "Квадратный, не меньше 256×256 px — это максимальный размер иконки в ICO. Из большего исходника уменьшенные версии получаются чётче, а маленький PNG при растягивании до 256 px станет размытым.",
        },
        {
          q: "Как поставить свою иконку на папку в Windows?",
          a: "Щёлкните по папке правой кнопкой → «Свойства» → вкладка «Настройка» → «Сменить значок…» → «Обзор» и выберите получившийся .ico. Для ярлыка то же делается во вкладке «Ярлык».",
        },
        {
          q: "Нужен ли favicon.ico, если на сайте уже есть PNG-иконки?",
          a: "Желательно. Браузеры и многие сервисы — RSS-читалки, поисковые роботы — по умолчанию ищут /favicon.ico в корне сайта. Файл с размерами 16, 32 и 48 px весит немного и закрывает этот случай.",
        },
      ],
      en: [
        {
          q: "How big should the source PNG be?",
          a: "Square and at least 256×256 px, the largest icon size in an ICO. Downscaled versions come out sharper from a bigger source, while a small PNG stretched to 256 px will look blurry.",
        },
        {
          q: "How do I set a custom icon on a Windows folder?",
          a: "Right-click the folder → Properties → Customize tab → Change Icon… → Browse, and pick the new .ico. For a shortcut, the same button is on the Shortcut tab.",
        },
        {
          q: "Do I need favicon.ico if my site already has PNG icons?",
          a: "It's recommended. Browsers and many services, such as RSS readers and crawlers, look for /favicon.ico at the site root by default. A file with 16, 32 and 48 px sizes is small and covers that case.",
        },
      ],
    },
  },
  {
    slug: "jpg-to-ico",
    from: "jpg",
    to: "ico",
    name: { ru: "JPG → ICO", en: "JPG → ICO" },
    title: {
      ru: "JPG в ICO — иконка из фото или логотипа",
      en: "JPG to ICO — Make an Icon from a Photo or Logo",
    },
    h1: { ru: "Конвертировать JPG в ICO", en: "Convert JPG to ICO" },
    description: {
      ru: "JPG в ICO для ярлыков Windows и favicon: размеры от 16 до 256 px в одном файле. У JPG нет прозрачности, поэтому фон иконки останется сплошным квадратом.",
      en: "JPG to ICO for Windows shortcuts and favicons: sizes from 16 to 256 px in one file. JPG has no transparency, so the icon keeps a solid square background.",
    },
    lead: {
      ru: "Фото или логотип в JPG превращается в файл .ico с набором размеров для Windows и сайтов.",
      en: "A JPG photo or logo becomes an .ico file with a set of sizes for Windows and websites.",
    },
    keywords: {
      ru: [
        "jpg в ico",
        "конвертер jpg в ico",
        "jpeg в ico онлайн",
        "иконка из фото",
        "сделать ico из картинки",
      ],
      en: [
        "jpg to ico",
        "jpg to ico converter",
        "convert jpeg to ico",
        "make icon from photo",
        "image to ico",
      ],
    },
    paragraphs: {
      ru: [
        "Логотип часто есть только в JPG, а иногда хочется поставить на папку или ярлык собственное фото. Конвертер соберёт из картинки ICO с нужными размерами — от 16 до 256 px.",
        "JPG не хранит прозрачность, поэтому иконка будет квадратной с фоном исходной картинки. Если нужен круглый значок или значок со скруглёнными углами, сначала сделайте круглую обрезку или скруглите углы — эти инструменты сохранят PNG с прозрачностью, а его уже переводите в ICO.",
        "В 16 и 32 px целое фото превращается в пятно. Заранее обрежьте картинку до квадрата 1:1 вокруг главного — лица, символа, первой буквы названия, — тогда значок останется узнаваемым.",
      ],
      en: [
        "A logo often exists only as a JPG, and sometimes you want your own photo on a folder or shortcut. The converter builds an ICO from the picture with the sizes you need, from 16 to 256 px.",
        "JPG doesn't store transparency, so the icon will be a square with the original background. For a round or rounded-corner icon, first use the circle crop or rounded corners tool — they save a transparent PNG, which you then convert to ICO.",
        "At 16 and 32 px a whole photo turns into a blob. Crop the image to a 1:1 square around the key element — a face, a symbol, the first letter of a name — so the icon stays recognizable.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли сделать иконку с прозрачным фоном из JPG?",
          a: "Напрямую нет: в JPG прозрачности не существует. Сделайте круглую обрезку или скруглите углы — результат сохранится в PNG с прозрачными углами — и конвертируйте его в ICO. Произвольный фон вокруг объекта удаляется только в графическом редакторе.",
        },
        {
          q: "Какие размеры выбрать для ярлыка Windows?",
          a: "Windows использует 16, 32 и 48 px в списках и меню, а 256 px — для крупных значков в проводнике. Набор 16, 24, 32, 48 и 256 px покрывает все режимы просмотра.",
        },
        {
          q: "На иконке 16×16 ничего не разобрать — что делать?",
          a: "Обрежьте фото до квадрата вокруг одной крупной детали и уберите лишнее. На маленьких размерах лучше всего читаются контрастные простые формы, а не пейзажи или групповые снимки.",
        },
      ],
      en: [
        {
          q: "Can I make a transparent icon from a JPG?",
          a: "Not directly — JPG has no transparency. Use the circle crop or rounded corners tool, which saves a PNG with transparent corners, then convert that to ICO. Removing an arbitrary background around an object requires an image editor.",
        },
        {
          q: "Which sizes should I pick for a Windows shortcut?",
          a: "Windows uses 16, 32 and 48 px in lists and menus and 256 px for large icons in File Explorer. A set of 16, 24, 32, 48 and 256 px covers every view mode.",
        },
        {
          q: "Nothing is recognizable at 16×16 — what can I do?",
          a: "Crop the photo to a square around one large detail and remove the rest. Simple, high-contrast shapes read best at small sizes, not landscapes or group shots.",
        },
      ],
    },
  },
  {
    slug: "ico-to-png",
    from: "ico",
    to: "png",
    name: { ru: "ICO → PNG", en: "ICO → PNG" },
    title: {
      ru: "ICO в PNG — достать картинку из иконки",
      en: "ICO to PNG — Extract the Image from an Icon File",
    },
    h1: { ru: "Конвертировать ICO в PNG", en: "Convert ICO to PNG" },
    description: {
      ru: "ICO в PNG: значок или favicon.ico сохраняется как обычная картинка PNG с прозрачным фоном — для презентаций, сайтов и редакторов, которые не открывают .ico.",
      en: "ICO to PNG: an icon or favicon.ico is saved as a regular PNG with a transparent background — for slides, websites and editors that can't open .ico files.",
    },
    lead: {
      ru: "Файл .ico — favicon сайта или значок программы — превращается в обычный PNG с прозрачностью.",
      en: "An .ico file, whether a site favicon or a program icon, becomes a regular PNG with transparency.",
    },
    keywords: {
      ru: [
        "ico в png",
        "конвертер ico в png",
        "ico в png онлайн",
        "favicon в png",
        "перевести иконку в png",
      ],
      en: [
        "ico to png",
        "ico to png converter",
        "convert ico to png",
        "favicon to png",
        "icon to png",
      ],
    },
    paragraphs: {
      ru: [
        "Редакторы презентаций и документов, дизайн-программы и многие CMS не принимают .ico. Если нужно вставить favicon в каталог сайтов, отчёт или макет, его проще всего перевести в PNG — формат, который открывается везде.",
        "ICO хранит несколько размеров одной иконки, а в PNG попадает одно изображение. Его разрешение ограничено тем, что есть в файле: в favicon.ico это часто 16–48 px, в значках программ — до 256 px. Растягивание такой картинки даст размытие — добавить деталей конвертер не может.",
        "Прозрачность переносится в PNG, так что значок можно положить на любой фон. Если нужен другой размер, после конвертации измените его в инструменте изменения размера.",
      ],
      en: [
        "Presentation and document editors, design tools and many CMSs don't accept .ico. If you need a favicon in a site directory, a report or a mockup, converting it to PNG — a format that opens everywhere — is the easiest route.",
        "An ICO stores several sizes of one icon, while the PNG receives a single image. Its resolution is limited by what's in the file: a favicon.ico often holds 16–48 px, program icons up to 256 px. Stretching such an image makes it blurry — the converter can't add detail.",
        "Transparency is carried over into the PNG, so the icon can sit on any background. If you need a different size, change it with the resize tool after converting.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему PNG получился совсем маленьким?",
          a: "В самом ICO нет изображения крупнее: favicon.ico многих сайтов содержит только 16, 32 или 48 px. Качественную большую версию можно найти в apple-touch-icon (180 px) или иконках манифеста сайта (192 и 512 px).",
        },
        {
          q: "Где взять favicon сайта для конвертации?",
          a: "Откройте в браузере адрес вида example.com/favicon.ico и сохраните файл. Если его там нет, путь к иконке указан в коде страницы в теге <link rel=\"icon\">.",
        },
        {
          q: "Сохранится ли прозрачность?",
          a: "Да. Прозрачные и полупрозрачные пиксели иконки переходят в PNG без изменений, фон остаётся прозрачным.",
        },
      ],
      en: [
        {
          q: "Why is the PNG so small?",
          a: "The ICO simply has no bigger image: many sites' favicon.ico contains only 16, 32 or 48 px. A good large version can often be found in the site's apple-touch-icon (180 px) or manifest icons (192 and 512 px).",
        },
        {
          q: "Where can I get a website's favicon to convert?",
          a: "Open an address like example.com/favicon.ico in your browser and save the file. If it isn't there, the icon path is listed in the page's code in a <link rel=\"icon\"> tag.",
        },
        {
          q: "Is transparency preserved?",
          a: "Yes. Transparent and semi-transparent icon pixels move to the PNG unchanged, and the background stays transparent.",
        },
      ],
    },
  },
  /* ── GIF ── */
  {
    slug: "gif-to-png",
    from: "gif",
    to: "png",
    name: { ru: "GIF → PNG", en: "GIF → PNG" },
    title: {
      ru: "GIF в PNG — кадр без потерь и с прозрачностью",
      en: "GIF to PNG — Lossless Frame with Transparency",
    },
    h1: { ru: "Конвертировать GIF в PNG", en: "Convert GIF to PNG" },
    description: {
      ru: "GIF в PNG без потерь: цвета палитры и прозрачность сохраняются точно. Из анимации берётся первый кадр — все кадры разом выгрузит инструмент раскадровки GIF.",
      en: "GIF to PNG without loss: palette colors and transparency are kept exactly. Animations give their first frame — the GIF to frames tool exports every frame.",
    },
    lead: {
      ru: "Статичный GIF или первый кадр анимации сохраняется в PNG пиксель в пиксель.",
      en: "A static GIF, or the first frame of an animated one, is saved to PNG pixel for pixel.",
    },
    keywords: {
      ru: [
        "gif в png",
        "конвертер gif в png",
        "gif в png онлайн",
        "перевести gif в png",
        "сохранить кадр из gif",
      ],
      en: [
        "gif to png",
        "gif to png converter",
        "convert gif to png",
        "gif frame to png",
        "gif to png transparent",
      ],
    },
    paragraphs: {
      ru: [
        "PNG — современная замена GIF для статичной графики: его без вопросов принимают редакторы, сайты и документы. Конвертация проходит без потерь: каждый пиксель из палитры GIF попадает в PNG без изменений, а прозрачный цвет становится прозрачным фоном.",
        "Из анимированного GIF берётся только первый кадр, и конвертер об этом предупреждает. Чтобы получить все кадры с правильной склейкой, их задержками и общей длительностью, используйте отдельный инструмент раскадровки GIF — он скачает кадры в PNG одним ZIP-архивом.",
        "PNG иногда получается тяжелее исходного GIF. В таком случае пропустите его через сжатие PNG: оптимизация без потерь и сокращение палитры до 256 цветов обычно возвращают компактный размер.",
      ],
      en: [
        "PNG is the modern replacement for GIF in static graphics: editors, websites and documents accept it without question. The conversion is lossless: every pixel from the GIF palette lands in the PNG unchanged, and the transparent color becomes a transparent background.",
        "From an animated GIF only the first frame is taken, and the converter warns you about it. To get every frame with correct compositing, per-frame delays and total duration, use the separate GIF to frames tool — it downloads the frames as PNGs in one ZIP.",
        "The PNG sometimes ends up larger than the source GIF. If so, run it through the image compressor: lossless optimization and reducing the palette to 256 colors usually bring the size back down.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сохранить все кадры GIF в PNG?",
          a: "Этот конвертер берёт только первый кадр. Все кадры сразу выгружает инструмент раскадровки GIF: он правильно склеивает кадры с учётом способа их наложения, показывает задержку каждого и отдаёт PNG в ZIP-архиве.",
        },
        {
          q: "Станет ли картинка качественнее?",
          a: "Нет. PNG сохраняет те же не более 256 цветов, что были в GIF, со всеми полосами и растровым шумом. Меняется только формат — теперь файл можно править без ограничений палитры.",
        },
        {
          q: "Сохранится ли прозрачность GIF?",
          a: "Да, прозрачный цвет GIF становится прозрачным фоном PNG. Но края останутся «ступенчатыми»: в GIF прозрачность 1-битная, и мягких полупрозрачных краёв в исходнике просто нет.",
        },
      ],
      en: [
        {
          q: "How do I save every GIF frame as PNG?",
          a: "This converter takes only the first frame. The GIF to frames tool exports them all: it composites frames correctly according to their disposal method, shows each frame's delay and gives you the PNGs in a ZIP.",
        },
        {
          q: "Will the image quality improve?",
          a: "No. The PNG keeps the same 256 or fewer colors the GIF had, with all the banding and dithering noise. Only the format changes — the file can now be edited without palette limits.",
        },
        {
          q: "Is the GIF's transparency preserved?",
          a: "Yes, the GIF's transparent color becomes a transparent PNG background. The edges stay jagged, though: GIF transparency is 1-bit, so the source simply has no soft semi-transparent edges.",
        },
      ],
    },
  },
  {
    slug: "gif-to-jpg",
    from: "gif",
    to: "jpg",
    name: { ru: "GIF → JPG", en: "GIF → JPG" },
    title: {
      ru: "GIF в JPG — первый кадр анимации как картинка",
      en: "GIF to JPG — Save a GIF Frame as a JPG Image",
    },
    h1: { ru: "Конвертировать GIF в JPG", en: "Convert GIF to JPG" },
    description: {
      ru: "GIF в JPG: статичный GIF или первый кадр анимации — в JPG для форм, документов и обложек. Прозрачность заливается выбранным цветом, качество 1–100.",
      en: "GIF to JPG: a static GIF or the first frame of an animation, saved as JPG for forms, documents and covers. Transparency gets a fill color; quality 1–100.",
    },
    lead: {
      ru: "Из GIF берётся первый кадр и сохраняется как JPG на сплошном фоне.",
      en: "The first frame of a GIF is taken and saved as a JPG on a solid background.",
    },
    keywords: {
      ru: [
        "gif в jpg",
        "конвертер gif в jpg",
        "gif в jpeg онлайн",
        "перевести gif в jpg",
        "кадр из gif в jpg",
      ],
      en: [
        "gif to jpg",
        "gif to jpg converter",
        "convert gif to jpeg",
        "gif frame to jpg",
        "gif to jpg online",
      ],
    },
    paragraphs: {
      ru: [
        "JPG из GIF нужен для превью и обложки анимации, для форм, которые принимают только JPG, и для печати. Берётся первый кадр, конвертер предупредит, если GIF анимированный.",
        "GIF с плоскими заливками и текстом в JPG может обрасти артефактами у резких краёв, а файл иногда даже вырастет — для простой графики PNG почти всегда лучше. Если JPG всё же нужен, ставьте качество 90 и выше. Прозрачный цвет GIF заливается выбранным фоном, по умолчанию белым.",
        "Нужен не первый, а другой кадр? Выгрузите все кадры в инструменте раскадровки GIF, выберите подходящий PNG и переведите его в JPG.",
      ],
      en: [
        "A JPG from a GIF is useful as a preview or cover for an animation, for forms that only accept JPG, and for printing. The first frame is used, and the converter warns you if the GIF is animated.",
        "A GIF with flat fills and text can pick up artifacts around sharp edges in JPG, and the file may even grow — for simple graphics PNG is almost always better. If you do need JPG, use quality 90 or higher. The GIF's transparent color is filled with the background you choose, white by default.",
        "Need a frame other than the first? Export all frames with the GIF to frames tool, pick the PNG you want and convert it to JPG.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли выбрать не первый кадр?",
          a: "В конвертере — нет, он всегда берёт первый. Откройте GIF в инструменте раскадровки, скачайте нужный кадр в PNG и сконвертируйте его в JPG.",
        },
        {
          q: "Почему JPG весит больше GIF?",
          a: "GIF с малым числом цветов и большими однотонными областями сжимается очень эффективно, а JPEG рассчитан на фотографии. Для такой графики выберите PNG — он без потерь и обычно легче.",
        },
        {
          q: "Что будет с прозрачными участками?",
          a: "В JPG прозрачности нет, поэтому они зальются выбранным цветом. Подберите его под фон, на котором картинка будет показана, — например, белый для документа.",
        },
      ],
      en: [
        {
          q: "Can I choose a frame other than the first?",
          a: "Not in the converter — it always takes the first one. Open the GIF in the GIF to frames tool, download the frame you need as PNG and convert that to JPG.",
        },
        {
          q: "Why is the JPG larger than the GIF?",
          a: "A GIF with few colors and large flat areas compresses very efficiently, while JPEG is designed for photos. For such graphics choose PNG — it's lossless and usually lighter.",
        },
        {
          q: "What happens to transparent areas?",
          a: "JPG has no transparency, so they are filled with the color you choose. Match it to the background the image will be shown on — white for a document, for example.",
        },
      ],
    },
  },

  /* ── BMP ── */
  {
    slug: "bmp-to-jpg",
    from: "bmp",
    to: "jpg",
    name: { ru: "BMP → JPG", en: "BMP → JPG" },
    title: {
      ru: "BMP в JPG — из тяжёлого BMP в компактное фото",
      en: "BMP to JPG — Turn Bulky Bitmaps into Compact JPGs",
    },
    h1: { ru: "Конвертировать BMP в JPG", en: "Convert BMP to JPG" },
    description: {
      ru: "BMP в JPG: несжатый кадр 1920×1080 весит около 6 МБ, а в JPG обычно укладывается в сотни килобайт. Качество 1–100, режим MozJPEG, пакетная обработка и ZIP.",
      en: "BMP to JPG: an uncompressed 1920×1080 frame takes about 6 MB, while as JPG it usually fits in a few hundred KB. Quality 1–100, MozJPEG mode, batch and ZIP.",
    },
    lead: {
      ru: "Несжатые BMP перекодируются в JPG и становятся во много раз легче.",
      en: "Uncompressed BMP files are re-encoded to JPG and become many times smaller.",
    },
    keywords: {
      ru: [
        "bmp в jpg",
        "конвертер bmp в jpg",
        "bmp в jpeg онлайн",
        "перевести bmp в jpg",
        "уменьшить размер bmp",
      ],
      en: [
        "bmp to jpg",
        "bmp to jpg converter",
        "convert bmp to jpeg",
        "bmp to jpg online",
        "reduce bmp file size",
      ],
    },
    paragraphs: {
      ru: [
        "BMP до сих пор выдают старые версии Paint, сканеры, промышленные и медицинские программы. Пиксели в нём хранятся почти без сжатия — по 3 байта на пиксель, — поэтому 12-мегапиксельный снимок занимает больше 30 МБ, а многие сайты и почтовые формы BMP вообще не принимают.",
        "Для фотографий JPG с качеством 85 обычно в 10 раз и более легче BMP без заметной разницы; режим MozJPEG уменьшит файл ещё на 5–15 %. Пакетный режим с ZIP-архивом удобен, когда нужно перевести целую папку старых сканов.",
        "Скриншоты, схемы и картинки с текстом лучше переводить не в JPG, а в PNG: он тоже намного легче BMP, но сохраняет резкие края без артефактов.",
      ],
      en: [
        "BMP still comes out of old Paint versions, scanners, industrial and medical software. Pixels are stored almost uncompressed — 3 bytes per pixel — so a 12 MP image takes over 30 MB, and many websites and email forms don't accept BMP at all.",
        "For photos, a JPG at quality 85 is usually 10 or more times smaller than the BMP with no visible difference; MozJPEG mode trims another 5–15%. Batch mode with a ZIP download is handy for converting a whole folder of old scans.",
        "Screenshots, diagrams and images with text are better converted to PNG rather than JPG: it's also much smaller than BMP but keeps sharp edges free of artifacts.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему BMP такой тяжёлый?",
          a: "Обычный 24-битный BMP хранит каждый пиксель тремя байтами почти без сжатия: 1920 × 1080 × 3 ≈ 6 МБ. JPG отбрасывает незаметные глазу детали и сжимает ту же картинку во много раз.",
        },
        {
          q: "Какое качество ставить для фото из BMP?",
          a: "Для архива и печати — 90, для отправки и сайта — 80–85. Ниже 70 на фотографиях становятся заметны квадраты и размытость мелких деталей.",
        },
        {
          q: "Скриншот в BMP — переводить в JPG или PNG?",
          a: "В PNG. Он сохраняет текст и линии идеально чёткими и при этом весит в разы меньше BMP. JPG выгоден только для фотографий.",
        },
      ],
      en: [
        {
          q: "Why are BMP files so big?",
          a: "A typical 24-bit BMP stores each pixel in three bytes, almost uncompressed: 1920 × 1080 × 3 ≈ 6 MB. JPG discards detail the eye doesn't notice and compresses the same picture many times over.",
        },
        {
          q: "What JPG quality should I pick?",
          a: "90 for archiving and print, 80–85 for sharing and websites. Below 70, blocks and smeared fine detail become visible in photos.",
        },
        {
          q: "A screenshot in BMP — JPG or PNG?",
          a: "PNG. It keeps text and lines perfectly crisp and is still several times smaller than the BMP. JPG only pays off for photos.",
        },
      ],
    },
  },
  {
    slug: "bmp-to-png",
    from: "bmp",
    to: "png",
    name: { ru: "BMP → PNG", en: "BMP → PNG" },
    title: {
      ru: "BMP в PNG — меньше вес без потери качества",
      en: "BMP to PNG — Smaller Files with Zero Quality Loss",
    },
    h1: { ru: "Конвертировать BMP в PNG", en: "Convert BMP to PNG" },
    description: {
      ru: "BMP в PNG без потерь: каждый пиксель сохраняется, а вес падает — у скриншотов и схем в разы. PNG принимают все сайты, редакторы и мессенджеры.",
      en: "BMP to PNG without any loss: every pixel is kept while the size drops — several-fold for screenshots and diagrams. Every site, editor and messenger accepts PNG.",
    },
    lead: {
      ru: "BMP пересохраняется в PNG без единой потери — файл становится компактнее и открывается везде.",
      en: "A BMP is re-saved as PNG with zero loss, so the file gets smaller and opens everywhere.",
    },
    keywords: {
      ru: [
        "bmp в png",
        "конвертер bmp в png",
        "bmp в png онлайн",
        "перевести bmp в png",
        "bmp в png без потери качества",
      ],
      en: [
        "bmp to png",
        "bmp to png converter",
        "convert bmp to png",
        "bmp to png lossless",
        "bmp to png online",
      ],
    },
    paragraphs: {
      ru: [
        "PNG — идеальная замена BMP: оба формата хранят картинку без потерь, но PNG сжимает данные алгоритмом Deflate, поддерживается везде и хранит прозрачность. Результат совпадает с исходником пиксель в пиксель.",
        "Насколько уменьшится файл, зависит от содержимого. Скриншоты, схемы, чертежи и пиксельная графика с большими однотонными областями сжимаются в разы, фотографии — заметно скромнее, потому что шум матрицы без потерь почти не сжимается.",
        "Если PNG всё ещё велик, прогоните его через инструмент сжатия: оптимизация OxiPNG уберёт лишнее без потерь, а сокращение палитры до 256 цветов и меньше сильно уменьшит файл для графики. Для фотографий больше подойдёт JPG.",
      ],
      en: [
        "PNG is the perfect replacement for BMP: both store the image losslessly, but PNG compresses the data with Deflate, works everywhere and supports transparency. The result matches the source pixel for pixel.",
        "How much smaller the file gets depends on the content. Screenshots, diagrams, drawings and pixel art with large flat areas shrink several times over; photos much less, because sensor noise barely compresses without loss.",
        "If the PNG is still large, run it through the image compressor: OxiPNG optimization strips waste losslessly, and reducing the palette to 256 colors or fewer shrinks graphics a lot. For photos, JPG is the better fit.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Потеряется ли качество?",
          a: "Нет. И BMP, и PNG хранят изображение без потерь, поэтому каждый пиксель переходит в PNG точно. Меняется только способ упаковки данных.",
        },
        {
          q: "Во сколько раз уменьшится файл?",
          a: "Для скриншотов и схем — обычно в разы, для фотографий — заметно меньше. Точную цифру конвертер покажет сразу: у каждого файла выводятся размеры до и после.",
        },
        {
          q: "Почему фото из BMP в PNG всё ещё тяжёлое?",
          a: "Сжатие без потерь плохо справляется с шумом и мелкими текстурами фотографий. Если не нужна точность до пикселя, переведите фото в JPG — он будет в несколько раз легче.",
        },
      ],
      en: [
        {
          q: "Will any quality be lost?",
          a: "No. Both BMP and PNG store the image losslessly, so every pixel moves to the PNG exactly. Only the way the data is packed changes.",
        },
        {
          q: "How much smaller will the file be?",
          a: "For screenshots and diagrams, usually several times; for photos, noticeably less. The converter shows the exact figure right away: every file lists its size before and after.",
        },
        {
          q: "Why is a photo converted from BMP to PNG still heavy?",
          a: "Lossless compression copes poorly with photo noise and fine texture. If you don't need pixel-exact accuracy, convert the photo to JPG instead — it will be several times smaller.",
        },
      ],
    },
  },

  /* ── TIFF ── */
  {
    slug: "tiff-to-jpg",
    from: "tiff",
    to: "jpg",
    name: { ru: "TIFF → JPG", en: "TIFF → JPG" },
    title: {
      ru: "TIFF в JPG — скан или макет для почты и сайта",
      en: "TIFF to JPG — Scans and Print Files for Email and Web",
    },
    h1: { ru: "Конвертировать TIFF в JPG", en: "Convert TIFF to JPG" },
    description: {
      ru: "TIFF в JPG для почты и загрузки на сайт: TIFF без сжатия и со сжатием LZW, Deflate, PackBits или JPEG. Берётся первая страница, 16 бит сводятся к 8.",
      en: "TIFF to JPG for email and web uploads: uncompressed, LZW, Deflate, PackBits and JPEG-compressed TIFFs. The first page is used; 16-bit color becomes 8-bit.",
    },
    lead: {
      ru: "Тяжёлые TIFF со сканера или из типографии превращаются в компактные JPG, которые откроет любой браузер.",
      en: "Heavy TIFFs from a scanner or print shop become compact JPGs that any browser can open.",
    },
    keywords: {
      ru: [
        "tiff в jpg",
        "конвертер tiff в jpg",
        "tif в jpg онлайн",
        "перевести tiff в jpeg",
        "скан tiff в jpg",
        "чем открыть tiff",
      ],
      en: [
        "tiff to jpg",
        "tiff to jpg converter",
        "tif to jpg",
        "convert tiff to jpeg",
        "scan tiff to jpg",
        "open tiff file",
      ],
    },
    paragraphs: {
      ru: [
        "Сканеры, фотолаборатории и типографии часто отдают файлы в TIFF, но Chrome, Firefox и Edge его не показывают, почта ограничивает размер вложений (в Gmail — 25 МБ), а порталы госуслуг в России и Казахстане, как правило, ждут JPG, PNG или PDF. JPG решает все три проблемы.",
        "Поддерживаются TIFF без сжатия и со сжатием LZW, Deflate, PackBits и JPEG. Из многостраничного файла берётся только первая страница, 16 бит на канал сводятся к 8, цвета приводятся к sRGB. Отметка 300 dpi при перекодировании может сброситься — выставьте её заново в инструменте изменения DPI, он не пересжимает пиксели.",
        "Для сканов документов хватает качества 85–90. Если на скане мелкий текст или чертёж, сравните с переводом в PNG — он без потерь. Для печати в типографии лучше отправить исходный TIFF.",
      ],
      en: [
        "Scanners, photo labs and print shops often deliver TIFF files, but Chrome, Firefox and Edge don't display them, email limits attachment size (25 MB in Gmail), and government portals usually expect JPG, PNG or PDF. JPG solves all three problems.",
        "Uncompressed TIFFs and those using LZW, Deflate, PackBits and JPEG compression are supported. From a multi-page file only the first page is taken, 16 bits per channel become 8, and colors are mapped to sRGB. The 300 dpi tag may be reset on re-encoding — set it again with the DPI changer, which doesn't re-compress the pixels.",
        "Quality 85–90 is enough for document scans. If a scan contains small text or a technical drawing, compare with a PNG conversion, which is lossless. For professional printing, send the original TIFF.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранится ли разрешение 300 dpi?",
          a: "Количество пикселей не меняется, но отметка dpi в заголовке JPG может сброситься. Её можно вернуть в инструменте изменения DPI: он записывает 300 dpi без повторного сжатия и считает размер отпечатка в сантиметрах.",
        },
        {
          q: "Что будет с многостраничным TIFF?",
          a: "Конвертер берёт только первую страницу. Если в файле несколько листов документа, сохраните их в сканере отдельными файлами или сразу в PDF.",
        },
        {
          q: "Почему TIFF не открывается?",
          a: "Поддерживаются TIFF без сжатия и со сжатием LZW, Deflate, PackBits и JPEG. Если файл использует другой метод сжатия, он может не прочитаться — пересохраните его в программе сканера с одним из этих вариантов.",
        },
      ],
      en: [
        {
          q: "Will the 300 dpi resolution be kept?",
          a: "The pixel count doesn't change, but the dpi tag in the JPG header may be reset. You can restore it with the DPI changer: it writes 300 dpi without re-compressing and calculates the print size in inches or centimeters.",
        },
        {
          q: "What happens to a multi-page TIFF?",
          a: "The converter takes only the first page. If the file holds several document pages, save them from the scanner as separate files or straight to PDF.",
        },
        {
          q: "Why won't my TIFF open?",
          a: "Uncompressed TIFFs and those compressed with LZW, Deflate, PackBits and JPEG are supported. A file using another compression method may fail to decode — re-save it from the scanner software with one of these options.",
        },
      ],
    },
  },
  {
    slug: "tiff-to-png",
    from: "tiff",
    to: "png",
    name: { ru: "TIFF → PNG", en: "TIFF → PNG" },
    title: {
      ru: "TIFF в PNG — конвертер сканов без потерь",
      en: "TIFF to PNG — Lossless Conversion for Scans",
    },
    h1: { ru: "Конвертировать TIFF в PNG", en: "Convert TIFF to PNG" },
    description: {
      ru: "TIFF в PNG без потерь: прозрачность сохраняется, цвета приводятся к 8-битному sRGB. Первая страница многостраничного TIFF, пакетная обработка и ZIP-архив.",
      en: "TIFF to PNG with no loss: transparency is kept and colors become 8-bit sRGB. First page of multi-page TIFFs, batch processing and ZIP download.",
    },
    lead: {
      ru: "TIFF пересохраняется в PNG без потерь — картинка открывается в браузере и на любом сайте.",
      en: "A TIFF is re-saved as a lossless PNG that opens in any browser and on any website.",
    },
    keywords: {
      ru: [
        "tiff в png",
        "конвертер tiff в png",
        "tif в png онлайн",
        "перевести tiff в png",
        "tiff в png без потерь",
      ],
      en: [
        "tiff to png",
        "tiff to png converter",
        "tif to png",
        "convert tiff to png",
        "tiff to png lossless",
      ],
    },
    paragraphs: {
      ru: [
        "PNG вместо JPG выбирают, когда важна каждая линия: сканы с мелким текстом, чертежи, карты, скриншоты и графика с прозрачностью. Сжатие без потерь не добавит артефактов, а PNG в отличие от TIFF показывают все браузеры.",
        "По весу PNG обычно заметно легче TIFF без сжатия и сопоставим с TIFF в LZW. Цветные фотосканы в PNG остаются тяжёлыми — для отправки их лучше перевести в JPG.",
        "Из многостраничного TIFF берётся первая страница, 16 бит на канал сводятся к 8, цвета приводятся к sRGB. Для экрана и обычной печати этого достаточно, а для профессиональной ретуши храните исходный TIFF.",
      ],
      en: [
        "PNG is chosen over JPG when every line matters: scans with small text, technical drawings, maps, screenshots and graphics with transparency. Lossless compression adds no artifacts, and unlike TIFF, PNG displays in every browser.",
        "PNG is usually much lighter than an uncompressed TIFF and comparable to an LZW-compressed one. Color photo scans stay heavy as PNG — convert them to JPG for sending.",
        "From a multi-page TIFF the first page is taken, 16 bits per channel become 8, and colors are mapped to sRGB. That's enough for screens and everyday printing; keep the original TIFF for professional retouching.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранятся ли прозрачность и слои из Photoshop?",
          a: "Если в TIFF есть альфа-канал, он перейдёт в PNG. Слои не сохраняются: PNG получает одно сведённое изображение.",
        },
        {
          q: "Почему PNG из скана такой тяжёлый?",
          a: "Скан фотографии содержит зерно и шум, которые почти не сжимаются без потерь. Для документов с текстом PNG обычно компактен, а цветные фотосканы выгоднее переводить в JPG.",
        },
        {
          q: "Потеряю ли я 16 бит на канал?",
          a: "Да, PNG сохраняется с 8 битами на канал. На экране и при обычной печати разница не видна, но для сложной цветокоррекции лучше работать с исходным 16-битным TIFF.",
        },
      ],
      en: [
        {
          q: "Are transparency and Photoshop layers preserved?",
          a: "If the TIFF has an alpha channel, it carries over to the PNG. Layers are not kept: the PNG receives a single flattened image.",
        },
        {
          q: "Why is the PNG of my scan so heavy?",
          a: "A photo scan contains grain and noise that barely compress without loss. For text documents PNG is usually compact, while color photo scans are better converted to JPG.",
        },
        {
          q: "Will I lose 16 bits per channel?",
          a: "Yes, the PNG is saved at 8 bits per channel. You won't see the difference on screen or in everyday prints, but for heavy color grading work from the original 16-bit TIFF.",
        },
      ],
    },
  },

  /* ── JFIF ── */
  {
    slug: "jfif-to-jpg",
    from: "jfif",
    to: "jpg",
    name: { ru: "JFIF → JPG", en: "JFIF → JPG" },
    title: {
      ru: "JFIF в JPG — сменить расширение без потерь",
      en: "JFIF to JPG — Rename to .jpg Without Re-Encoding",
    },
    h1: { ru: "Конвертировать JFIF в JPG", en: "Convert JFIF to JPG" },
    description: {
      ru: "JFIF в JPG без перекодирования: .jfif — это обычный JPEG, поэтому байты копируются как есть, а меняется только расширение. Качество и EXIF сохраняются.",
      en: "JFIF to JPG without re-encoding: a .jfif file is an ordinary JPEG, so the bytes are copied as-is and only the extension changes. Quality and EXIF stay intact.",
    },
    lead: {
      ru: "Файл .jfif сохраняется как .jpg побайтно — качество, размер и метаданные не меняются.",
      en: "A .jfif file is saved as .jpg byte for byte — quality, size and metadata stay the same.",
    },
    keywords: {
      ru: [
        "jfif в jpg",
        "конвертер jfif в jpg",
        "jfif в jpeg",
        "что такое jfif",
        "как открыть jfif",
        "почему картинки сохраняются в jfif",
      ],
      en: [
        "jfif to jpg",
        "jfif to jpg converter",
        "jfif to jpeg",
        "what is jfif",
        "open jfif file",
        "why do images save as jfif",
      ],
    },
    paragraphs: {
      ru: [
        "JFIF — стандартная обёртка, в которой хранится почти любой JPEG, а не отдельный формат. Расширение .jfif появляется, когда Windows связывает тип image/jpeg с этим расширением, — тогда Chrome и другие программы сохраняют картинки из интернета как .jfif. Внутри обычный JPEG, но формы загрузки нередко отклоняют файл по расширению.",
        "Поэтому конвертер ничего не перекодирует: если вы не меняете другие параметры, байты файла копируются без изменений, и у копии просто расширение .jpg. Качество, размер, EXIF-данные и цветовой профиль остаются прежними, а даже большая пачка файлов обрабатывается мгновенно.",
        "Один файл можно переименовать и вручную: включите в «Проводнике» показ расширений («Вид» → «Показать» → «Расширения имён файлов» в Windows 11) и замените .jfif на .jpg. Для десятков файлов удобнее пакетная конвертация с ZIP-архивом.",
      ],
      en: [
        "JFIF is the standard wrapper almost every JPEG is stored in, not a separate format. The .jfif extension appears when Windows associates the image/jpeg type with it — Chrome and other programs then save web images as .jfif. Inside is an ordinary JPEG, but upload forms often reject the file because of its extension.",
        "That's why the converter re-encodes nothing: unless you change other settings, the file's bytes are copied unchanged and the copy simply gets a .jpg extension. Quality, size, EXIF data and color profile remain the same, and even a large batch is processed instantly.",
        "A single file can also be renamed by hand: turn on file extensions in File Explorer (View → Show → File name extensions in Windows 11) and replace .jfif with .jpg. For dozens of files, batch conversion with a ZIP download is more convenient.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем JFIF отличается от JPG?",
          a: "Ничем, кроме расширения. JFIF (JPEG File Interchange Format) — стандартный контейнер JPEG-файлов, и обычные .jpg-фото внутри устроены точно так же. Любая программа, открывающая JPG, откроет и .jfif, если убедить её не смотреть на расширение.",
        },
        {
          q: "Можно ли просто переименовать файл?",
          a: "Да, и результат будет тем же: сменить .jfif на .jpg достаточно. Конвертер делает то же самое, но сразу для многих файлов и без ручной работы с расширениями.",
        },
        {
          q: "Почему Windows сохраняет картинки в .jfif?",
          a: "Обычно виновата настройка реестра Windows, в которой для типа image/jpeg указано расширение .jfif; её иногда меняют сторонние программы. Браузер берёт расширение оттуда, поэтому обычные JPEG получают имя .jfif.",
        },
      ],
      en: [
        {
          q: "How is JFIF different from JPG?",
          a: "Only by the extension. JFIF (JPEG File Interchange Format) is the standard container for JPEG files, and regular .jpg photos are built exactly the same way inside. Any program that opens JPG will open a .jfif once it stops looking at the extension.",
        },
        {
          q: "Can I just rename the file?",
          a: "Yes, and the result is identical: changing .jfif to .jpg is enough. The converter does the same thing, but for many files at once and without fiddling with extensions.",
        },
        {
          q: "Why does Windows save images as .jfif?",
          a: "Usually a Windows registry setting maps the image/jpeg type to the .jfif extension; third-party programs sometimes change it. The browser takes the extension from there, so ordinary JPEGs get named .jfif.",
        },
      ],
    },
  },
  {
    slug: "jfif-to-png",
    from: "jfif",
    to: "png",
    name: { ru: "JFIF → PNG", en: "JFIF → PNG" },
    title: {
      ru: "JFIF в PNG — для форм, где .jfif не принимают",
      en: "JFIF to PNG — Convert .jfif Images to PNG",
    },
    h1: { ru: "Конвертировать JFIF в PNG", en: "Convert JFIF to PNG" },
    description: {
      ru: "JFIF в PNG: JPEG-файл с расширением .jfif декодируется и сохраняется в PNG без новых потерь. PNG будет в несколько раз тяжелее — для отправки лучше JPG.",
      en: "JFIF to PNG: a JPEG with the .jfif extension is decoded and saved losslessly as PNG. The PNG will be several times larger — for sending, JPG is better.",
    },
    lead: {
      ru: "Картинка .jfif пересохраняется в PNG — формат без потерь, который принимают любые редакторы и сайты.",
      en: "A .jfif image is re-saved as PNG, a lossless format every editor and website accepts.",
    },
    keywords: {
      ru: [
        "jfif в png",
        "конвертер jfif в png",
        "jfif в png онлайн",
        "перевести jfif в png",
        "открыть jfif",
      ],
      en: [
        "jfif to png",
        "jfif to png converter",
        "convert jfif to png",
        "jfif to png online",
        "jfif file to png",
      ],
    },
    paragraphs: {
      ru: [
        "PNG из .jfif нужен, когда сервис или редактор требует именно PNG, либо когда картинку предстоит много раз править: PNG не добавляет артефактов при каждом сохранении.",
        "Файл .jfif — обычный JPEG, поэтому он декодируется и записывается в PNG без потерь; ориентация из EXIF применяется, а сами метаданные удаляются. Артефакты исходного сжатия остаются, а PNG с фотографией обычно в несколько раз тяжелее JPEG.",
        "Если вам просто нужно, чтобы файл приняли на сайте, выгоднее вариант JFIF в JPG: там байты копируются без перекодирования, и файл не растёт.",
      ],
      en: [
        "A PNG from a .jfif is needed when a service or editor insists on PNG, or when the image will be edited many times: PNG adds no artifacts on each save.",
        "A .jfif file is an ordinary JPEG, so it is decoded and written to PNG losslessly; the EXIF orientation is applied, and the metadata itself is removed. Artifacts from the original compression remain, and a photo as PNG is usually several times heavier than the JPEG.",
        "If you just need a website to accept the file, JFIF to JPG is the better option: the bytes are copied without re-encoding and the file doesn't grow.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Что лучше — JFIF в JPG или в PNG?",
          a: "Если нужно просто сменить расширение, выбирайте JPG: это мгновенно, без потерь и без роста файла. PNG имеет смысл, только если его явно требуют или картинку будут многократно редактировать.",
        },
        {
          q: "Появится ли у картинки прозрачный фон?",
          a: "Нет. В JPEG нет прозрачности, и PNG получит тот же непрозрачный фон. Прозрачность появится только после удаления фона в графическом редакторе.",
        },
        {
          q: "Почему PNG весит больше исходного файла?",
          a: "JPEG сжимает с потерями и очень компактно, а PNG хранит каждый пиксель точно. Для фотографий это означает рост в несколько раз — качество от этого не улучшается.",
        },
      ],
      en: [
        {
          q: "Which is better — JFIF to JPG or to PNG?",
          a: "If you only need a different extension, choose JPG: it's instant, lossless and the file doesn't grow. PNG only makes sense when it's explicitly required or the image will be edited repeatedly.",
        },
        {
          q: "Does converting to PNG add transparency?",
          a: "No. JPEG has no transparency, so the PNG gets the same opaque background. Transparency only appears after removing the background in an image editor.",
        },
        {
          q: "Why is the PNG larger than the original file?",
          a: "JPEG uses very compact lossy compression, while PNG stores every pixel exactly. For photos that means a several-fold increase — with no gain in quality.",
        },
      ],
    },
  },

  /* ── To GIF ── */
  {
    slug: "jpg-to-gif",
    from: "jpg",
    to: "gif",
    name: { ru: "JPG → GIF", en: "JPG → GIF" },
    title: {
      ru: "JPG в GIF — статичный GIF из фото, 256 цветов",
      en: "JPG to GIF — Static GIF with a 256-Color Palette",
    },
    h1: { ru: "Конвертировать JPG в GIF", en: "Convert JPG to GIF" },
    description: {
      ru: "JPG в GIF для старых сайтов, форумов и систем, где нужен именно GIF. Палитра ограничена 256 цветами, поэтому градиенты на фото станут полосатыми.",
      en: "JPG to GIF for old websites, forums and systems that require GIF. The palette is limited to 256 colors, so gradients in photos will show visible banding.",
    },
    lead: {
      ru: "Фото JPG перекодируется в статичный GIF с палитрой до 256 цветов.",
      en: "A JPG photo is re-encoded into a static GIF with a palette of up to 256 colors.",
    },
    keywords: {
      ru: [
        "jpg в gif",
        "конвертер jpg в gif",
        "jpeg в gif онлайн",
        "перевести фото в gif",
        "картинку jpg в gif",
      ],
      en: [
        "jpg to gif",
        "jpg to gif converter",
        "convert jpeg to gif",
        "photo to gif",
        "jpg to gif online",
      ],
    },
    paragraphs: {
      ru: [
        "Статичный GIF из JPG нужен редко: для старых форумов и аватарок, устаревших CMS и оборудования, которые понимают только GIF. Если вы хотите анимацию из нескольких фотографий, воспользуйтесь инструментом создания GIF — там можно задать порядок кадров, задержки и число повторов.",
        "Главная потеря — цвет: из 16,7 млн оттенков JPG остаётся палитра максимум из 256. Плавные переходы неба, кожи и теней превращаются в заметные полосы, а файл нередко получается тяжелее исходного JPG.",
        "Лучше всего в GIF переходят простые картинки: логотипы, рисунки, схемы с небольшим числом цветов. Для фотографий GIF — крайний вариант; если площадка принимает JPG или PNG, оставьте их.",
      ],
      en: [
        "A static GIF from a JPG is rarely needed: for old forums and avatars, legacy CMSs and devices that only understand GIF. If you want an animation from several photos, use the GIF maker — it lets you set frame order, delays and loop count.",
        "The main loss is color: from JPG's 16.7 million shades, a palette of at most 256 remains. Smooth gradients in skies, skin and shadows turn into visible bands, and the file often ends up larger than the original JPG.",
        "Simple pictures convert best: logos, drawings, diagrams with few colors. For photos GIF is a last resort; if the platform accepts JPG or PNG, stick with those.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему фото в GIF стало полосатым?",
          a: "GIF хранит не больше 256 цветов на кадр, а в фотографии их десятки тысяч. Близкие оттенки сливаются в один, и плавный градиент становится ступенчатым. Это ограничение формата, а не настройки.",
        },
        {
          q: "Как сделать анимированный GIF из нескольких JPG?",
          a: "Конвертер создаёт только статичный GIF. Для анимации откройте инструмент создания GIF: добавьте фото, расставьте их по порядку, задайте задержку каждого кадра и число повторов.",
        },
        {
          q: "Почему GIF весит больше JPG?",
          a: "Сжатие GIF (LZW) эффективно на однотонных областях, а на фотографиях с шумом и мелкими деталями проигрывает JPEG. Поэтому фото в GIF часто получается и хуже, и тяжелее.",
        },
      ],
      en: [
        {
          q: "Why does my photo look banded as a GIF?",
          a: "GIF stores at most 256 colors per frame, while a photo contains tens of thousands. Similar shades merge into one, and a smooth gradient becomes stepped. That's a limit of the format, not a setting.",
        },
        {
          q: "How do I make an animated GIF from several JPGs?",
          a: "The converter only creates static GIFs. For animation, open the GIF maker: add the photos, put them in order, and set each frame's delay and the loop count.",
        },
        {
          q: "Why is the GIF larger than the JPG?",
          a: "GIF's LZW compression works well on flat areas but loses to JPEG on photos full of noise and fine detail. So a photo as GIF often looks worse and weighs more.",
        },
      ],
    },
  },
  {
    slug: "png-to-gif",
    from: "png",
    to: "gif",
    name: { ru: "PNG → GIF", en: "PNG → GIF" },
    title: {
      ru: "PNG в GIF — графика для старых сайтов и форумов",
      en: "PNG to GIF — Graphics with 1-Bit Transparency",
    },
    h1: { ru: "Конвертировать PNG в GIF", en: "Convert PNG to GIF" },
    description: {
      ru: "PNG в GIF: палитра до 256 цветов и 1-битная прозрачность — пиксель либо виден, либо нет. Подходит для иконок и простой графики; мягкие тени станут рваными.",
      en: "PNG to GIF: up to 256 colors and 1-bit transparency, where a pixel is either visible or not. Fine for icons and simple graphics; soft shadows turn ragged.",
    },
    lead: {
      ru: "PNG-картинка сохраняется как GIF: цвета сводятся к палитре из 256, прозрачность становится 1-битной.",
      en: "A PNG is saved as a GIF: colors are reduced to a 256-color palette and transparency becomes 1-bit.",
    },
    keywords: {
      ru: [
        "png в gif",
        "конвертер png в gif",
        "png в gif онлайн",
        "перевести png в gif",
        "png в gif с прозрачностью",
      ],
      en: [
        "png to gif",
        "png to gif converter",
        "convert png to gif",
        "png to gif transparent",
        "png to gif online",
      ],
    },
    paragraphs: {
      ru: [
        "GIF из PNG нужен для систем, которые принимают только его: старых форумов, подписей в некоторых почтовых программах, устаревших CMS. Простые иконки, смайлики и логотипы с небольшим числом цветов переходят в GIF почти без изменений.",
        "Прозрачность в GIF 1-битная: каждый пиксель либо полностью прозрачен, либо полностью непрозрачен. Полупрозрачные тени и сглаженные края PNG при этом превращаются в «лесенку». Если известен фон, на котором будет картинка, заранее положите её на этот фон в графическом редакторе — края останутся гладкими.",
        "Палитра ограничена 256 цветами: градиенты и фотографии в ней полосят. Анимацию из нескольких PNG соберёт инструмент создания GIF — этот конвертер делает только статичные файлы.",
      ],
      en: [
        "A GIF from a PNG is needed for systems that accept nothing else: old forums, signatures in some email programs, legacy CMSs. Simple icons, emoticons and logos with few colors convert to GIF almost unchanged.",
        "GIF transparency is 1-bit: each pixel is either fully transparent or fully opaque. The PNG's semi-transparent shadows and anti-aliased edges turn into jagged steps. If you know the background the image will sit on, place it on that background in an image editor first — the edges will stay smooth.",
        "The palette is limited to 256 colors, so gradients and photos show banding. An animation from several PNGs can be built with the GIF maker; this converter only makes static files.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему края логотипа стали зубчатыми?",
          a: "В PNG края сглажены полупрозрачными пикселями, а GIF знает только «прозрачно» и «непрозрачно». Каждый полупрозрачный пиксель становится одним из двух, отсюда лесенка. Помогает заранее залить прозрачность цветом фона страницы.",
        },
        {
          q: "Как сделать анимированный GIF из нескольких PNG?",
          a: "Откройте инструмент создания GIF: загрузите PNG-кадры, выберите порядок, задержку и число повторов. Он же правильно подберёт палитру из 256 цветов для каждого кадра.",
        },
        {
          q: "Когда GIF меньше PNG?",
          a: "Редко: сжатие PNG обычно эффективнее LZW в GIF. Выигрыш возможен на очень маленьких картинках с несколькими цветами, но в большинстве случаев GIF выбирают из-за совместимости, а не ради веса.",
        },
      ],
      en: [
        {
          q: "Why did my logo's edges turn jagged?",
          a: "In a PNG, edges are smoothed with semi-transparent pixels, while GIF knows only “transparent” and “opaque”. Each semi-transparent pixel becomes one or the other, hence the steps. Filling the transparency with the page's background color beforehand helps.",
        },
        {
          q: "How do I make an animated GIF from several PNGs?",
          a: "Open the GIF maker: upload the PNG frames, set their order, delay and loop count. It also builds a proper 256-color palette for each frame.",
        },
        {
          q: "When is a GIF smaller than a PNG?",
          a: "Rarely: PNG compression is usually more efficient than GIF's LZW. Tiny images with just a few colors may come out smaller, but GIF is mostly chosen for compatibility, not file size.",
        },
      ],
    },
  },
];
