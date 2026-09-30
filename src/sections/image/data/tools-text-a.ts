import type { ToolText } from "./types";

/** SEO and content texts of the main image tool pages (/image/<slug>), part A. */
export const TOOL_TEXTS_A: Record<string, ToolText> = {
  compress: {
    name: { ru: "Сжать фото", en: "Compress images" },
    title: {
      ru: "Сжать фото онлайн — JPG, PNG, WebP и AVIF до нужного веса",
      en: "Compress Images Online — Reduce JPG, PNG & WebP Size",
    },
    h1: { ru: "Сжать фото онлайн", en: "Compress Images Online" },
    description: {
      ru: "Сжатие JPG, PNG, WebP и AVIF по качеству 1–100 или до точного веса в КБ. MozJPEG, OxiPNG, пакетная обработка и ZIP; если файл не уменьшился, остаётся оригинал.",
      en: "Compress JPG, PNG, WebP and AVIF by quality 1–100 or to an exact size in KB. MozJPEG, OxiPNG, batch mode and ZIP download; files are never made bigger.",
    },
    lead: {
      ru: "Задайте качество или нужный вес в килобайтах — фото станут легче, а файл, который не удалось уменьшить, останется как был.",
      en: "Set a quality level or a target size in kilobytes — images get lighter, and any file that can’t be made smaller is kept as it was.",
    },
    keywords: {
      ru: [
        "сжать фото",
        "сжать фото онлайн",
        "уменьшить вес фото",
        "сжать jpg",
        "сжать png без потери качества",
        "сжать фото до 100 кб",
        "сжатие изображений онлайн",
        "уменьшить размер файла фото",
      ],
      en: [
        "compress image",
        "compress images online",
        "reduce image file size",
        "compress jpeg",
        "compress png",
        "image compressor",
        "compress photo to 100kb",
        "bulk image compression",
      ],
    },
    howTo: {
      ru: [
        "Добавьте фото: перетащите файлы в окно, вставьте из буфера через Ctrl+V или нажмите и выберите — можно сразу много.",
        "Выберите способ: ползунок «Качество» (для фото обычно хватает 75–85) или режим «Сжать до размера» с лимитом в КБ.",
        "При желании включите «Максимальное сжатие», смените формат или ограничьте ширину и высоту — изображения при этом только уменьшаются.",
        "Нажмите «Сравнить», чтобы проверить результат ползунком «до/после», и посмотрите вес каждого файла до и после сжатия.",
        "Скачайте файлы по одному или все сразу кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add images: drag them into the window, paste with Ctrl+V or click to choose — many files at once are fine.",
        "Choose a method: the Quality slider (75–85 is usually enough for photos) or “Target size” with a limit in KB.",
        "Optionally turn on “Maximum compression”, change the output format or cap the width and height — images are only ever scaled down.",
        "Click Compare to check the result with a before/after slider, and see each file’s size before and after.",
        "Download files one by one or all at once with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Сжатие JPG, WebP и AVIF — это сжатие с потерями: кодировщик отбрасывает мелкие детали, которые глаз почти не замечает. При качестве 75–85 большинство фотографий на экране не отличить от оригинала, а вес заметно падает — особенно у снимков, которые камера сохранила с максимальным качеством. Строго без потерь уменьшается только PNG: OxiPNG перепаковывает данные, не меняя ни одного пикселя.",
        "Режим «Сжать до размера» ищет самое высокое качество, при котором файл укладывается в лимит, — это удобно для анкет, порталов госуслуг России и Казахстана, маркетплейсов и почты. Если не хватает даже минимального качества, изображение постепенно уменьшается в пикселях, пока не впишется. Файлы, которые не стали меньше, остаются без изменений, так что экономия никогда не бывает отрицательной.",
        "«Максимальное сжатие» включает MozJPEG для JPG (обычно на 5–15 % меньше при том же качестве, но медленнее) и OxiPNG для PNG. Для скриншотов и графики попробуйте уменьшить число цветов PNG: как в TinyPNG, файл часто становится в разы легче, но это уже сжатие с потерями. Всё выполняется в браузере, в Web Worker, поэтому страница не зависает даже на фото 20–50 Мп.",
      ],
      en: [
        "JPG, WebP and AVIF compression is lossy: the encoder discards fine detail the eye barely notices. At quality 75–85 most photos look identical to the original on screen while the file gets much lighter — especially shots a camera saved at maximum quality. Only PNG can be shrunk strictly without loss: OxiPNG repacks the data without changing a single pixel.",
        "“Target size” looks for the highest quality that still fits your limit — handy for application forms, government portals, marketplaces and email. If even the lowest quality is too big, the image is scaled down step by step until it fits. Files that don’t get smaller are left untouched, so savings never go negative.",
        "“Maximum compression” switches to MozJPEG for JPG (usually 5–15% smaller at the same quality, but slower) and OxiPNG for PNG. For screenshots and graphics, try reducing the number of PNG colours: as with TinyPNG, files often become several times smaller, though this is lossy. Everything runs in your browser in a Web Worker, so the page stays responsive even with 20–50 MP photos.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли сжать фото без потери качества?",
          a: "Строго без потерь сжимается только PNG: OxiPNG в режиме «Максимальное сжатие» перепаковывает файл, не меняя пикселей. JPG, WebP и AVIF сжимаются с потерями, но при качестве 75–85 разница на обычной фотографии практически незаметна. Проверьте результат ползунком сравнения и, если видите артефакты, поднимите качество.",
        },
        {
          q: "Как сжать фото до 100 КБ, 200 КБ или 1 МБ?",
          a: "Выберите «Сжать до размера» и введите лимит в килобайтах (1 МБ = 1024 КБ). Инструмент подберёт самое высокое качество, при котором файл укладывается в лимит, а если не хватает и минимального — уменьшит изображение в пикселях. Если уложиться всё же не удалось, вы увидите предупреждение.",
        },
        {
          q: "Почему файл после сжатия не стал меньше?",
          a: "Значит, исходник уже хорошо оптимизирован или сохранён с более низким качеством, чем вы выбрали. В этом случае инструмент оставляет оригинал и сообщает об этом. Попробуйте снизить качество, выбрать WebP или AVIF, а для PNG — уменьшить число цветов.",
        },
        {
          q: "Сохраняются ли EXIF и геолокация после сжатия?",
          a: "По умолчанию нет: при перекодировании метаданные, включая GPS-координаты, удаляются — это ещё и немного уменьшает вес. Для JPG можно включить сохранение EXIF: данные камеры (и координаты, если они есть) перенесутся в сжатый файл, а ориентация сбросится на нормальную, потому что пиксели уже повёрнуты правильно.",
        },
        {
          q: "Какой формат даёт самый маленький файл?",
          a: "Обычно AVIF, затем WebP, затем JPG. AVIF кодируется заметно медленнее, особенно на больших фото. WebP и AVIF создаются кодировщиками на WebAssembly, поэтому работают и в Safari, а JPG остаётся самым совместимым вариантом для почты, документов и старых программ.",
        },
      ],
      en: [
        {
          q: "Can I compress a photo without losing quality?",
          a: "Only PNG is compressed strictly losslessly: OxiPNG in “Maximum compression” mode repacks the file without touching the pixels. JPG, WebP and AVIF are lossy, but at quality 75–85 the difference on a typical photo is practically invisible. Check the result with the compare slider and raise the quality if you spot artefacts.",
        },
        {
          q: "How do I compress an image to 100 KB, 200 KB or 1 MB?",
          a: "Choose “Target size” and enter the limit in kilobytes (1 MB = 1024 KB). The tool finds the highest quality that fits, and if even the minimum quality is too big, it scales the image down in pixels. If the limit still can’t be reached, you’ll see a warning.",
        },
        {
          q: "Why didn’t my file get smaller?",
          a: "The original is already well optimised or was saved at a lower quality than the one you picked. In that case the tool keeps the original and tells you so. Try a lower quality, switch to WebP or AVIF, or reduce the number of colours for a PNG.",
        },
        {
          q: "Is EXIF data, including location, kept after compression?",
          a: "Not by default: re-encoding removes metadata, GPS coordinates included, which also saves a little space. For JPG you can turn on keeping EXIF: the camera data (and coordinates, if present) is copied into the compressed file, and the orientation is reset to normal because the pixels are already upright.",
        },
        {
          q: "Which format gives the smallest files?",
          a: "Usually AVIF, then WebP, then JPG. AVIF is noticeably slower to encode, especially for large photos. WebP and AVIF are produced by WebAssembly encoders, so they work in Safari too, while JPG remains the most compatible choice for email, documents and older software.",
        },
      ],
    },
  },

  resize: {
    name: { ru: "Изменить размер", en: "Resize images" },
    title: {
      ru: "Изменить размер фото онлайн — в пикселях и процентах",
      en: "Resize Image Online — By Pixels, Percent or Long Side",
    },
    h1: { ru: "Изменить размер фото онлайн", en: "Resize Images Online" },
    description: {
      ru: "Размер фото в пикселях, процентах или по длинной стороне: вписать, заполнить с обрезкой или добавить поля. Пресеты для соцсетей и документов, пакетно, ZIP.",
      en: "Resize photos by pixels, percent or long side: fit inside, fill and crop, or pad. Presets for social media, documents and prints; batch processing and ZIP.",
    },
    lead: {
      ru: "Задайте ширину и высоту, процент или готовый пресет — изображения пересчитаются с высоким качеством, а пропорции останутся под вашим контролем.",
      en: "Enter a width and height, a percentage or pick a preset — images are resampled in high quality, and you decide how the proportions are handled.",
    },
    keywords: {
      ru: [
        "изменить размер фото",
        "изменить размер фото онлайн",
        "уменьшить размер фото в пикселях",
        "изменить разрешение фото",
        "уменьшить фото онлайн",
        "ресайз фото",
        "изменить размер картинки",
        "изменить размер нескольких фото сразу",
      ],
      en: [
        "resize image",
        "resize image online",
        "change image dimensions",
        "resize photo in pixels",
        "bulk image resizer",
        "reduce image resolution",
        "resize picture",
        "resize image by percentage",
      ],
    },
    howTo: {
      ru: [
        "Добавьте одно или несколько изображений.",
        "Выберите способ: ширина и высота в px (с замком пропорций), проценты, длинная сторона или пресет для соцсетей, документов, печати или экрана.",
        "Если пропорции не совпадают, выберите режим: «Вписать без обрезки», «Заполнить и обрезать по центру», «Вписать с полями» (цвет или размытый фон) или «Растянуть».",
        "Выберите формат результата и скачайте файлы по одному или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add one or more images.",
        "Choose a method: width and height in px (with an aspect lock), percent, long side, or a preset for social media, documents, prints or screens.",
        "If the proportions differ, pick a mode: “Fit inside”, “Fill and crop centre”, “Fit with padding” (colour or blurred background) or “Stretch”.",
        "Choose the output format and download files one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Пиксели пересчитываются библиотекой pica — фильтром типа Ланцош с лёгким повышением резкости, поэтому уменьшенные фото остаются чёткими, без «лесенки» и мыла. Обработка идёт в браузере, в Web Worker, так что даже десятки больших снимков не подвешивают вкладку.",
        "По умолчанию изображения только уменьшаются: если фото меньше заданного размера, оно не растягивается. Увеличение включается галочкой «Разрешить увеличение», но новых деталей оно не добавит — пиксели просто интерполируются, и снимок становится мягче.",
        "Для пресетов документов и печати — фото 3×4, 35×45 мм, A4, 10×15 — в файл записывается разрешение 300 dpi (в JPG через JFIF, в PNG через pHYs), чтобы при печати получился нужный физический размер. Режим по длинной стороне удобен для пачки снимков разной ориентации: и вертикальные, и горизонтальные получат одинаковую большую сторону.",
      ],
      en: [
        "Pixels are resampled with the pica library — a Lanczos-type filter plus light sharpening — so downsized photos stay crisp, without jagged edges or mush. Processing runs in your browser in a Web Worker, so even dozens of large photos won’t freeze the tab.",
        "By default images are only ever made smaller: a photo that is already below the requested size isn’t stretched. You can tick “Allow enlarging”, but it won’t add detail — pixels are interpolated and the image gets softer.",
        "Document and print presets (passport and ID photos, A4, 4×6 prints) write 300 dpi into the file (JFIF in JPG, pHYs in PNG) so it prints at the intended physical size. Long-side mode suits batches with mixed orientation: portrait and landscape photos get the same longest edge.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем «Вписать без обрезки» отличается от «Заполнить и обрезать по центру»?",
          a: "В первом режиме фото целиком помещается в заданную рамку, и одна из сторон может получиться меньше указанной. Во втором кадр заполняет рамку точно, а лишнее срезается по краям относительно центра. «Вписать с полями» даёт точный размер без обрезки: свободное место заливается цветом или размытой копией фото.",
        },
        {
          q: "Почему фото не увеличилось до указанного размера?",
          a: "Увеличение по умолчанию выключено, чтобы не ухудшать качество, — инструмент подскажет, что изображение меньше заданного размера. Включите «Разрешить увеличение», если вам действительно нужно больше пикселей, но учтите: резче снимок от этого не станет.",
        },
        {
          q: "Как уменьшить сразу много фото?",
          a: "Добавьте все файлы, один раз задайте размер — например, 1920 px по длинной стороне — и скачайте результат одним ZIP-архивом. Настройки применяются к каждому файлу, а вертикальные и горизонтальные снимки обрабатываются правильно.",
        },
        {
          q: "Уменьшится ли вес файла после изменения размера?",
          a: "Как правило, да, и заметно: если уменьшить обе стороны вдвое, пикселей станет в четыре раза меньше. Если нужен конкретный вес в килобайтах, воспользуйтесь сжатием в режиме «Сжать до размера».",
        },
      ],
      en: [
        {
          q: "What’s the difference between “Fit inside” and “Fill and crop centre”?",
          a: "“Fit inside” places the whole photo within the box, so one side may end up smaller than requested. “Fill and crop centre” fills the box exactly and trims the overflow evenly from the centre. “Fit with padding” gives the exact size without cropping by filling the empty space with a colour or a blurred copy of the photo.",
        },
        {
          q: "Why wasn’t my photo enlarged to the size I entered?",
          a: "Enlarging is off by default to avoid degrading quality — the tool tells you the image is smaller than the requested size. Tick “Allow enlarging” if you really need more pixels, but keep in mind it won’t make the photo any sharper.",
        },
        {
          q: "How do I resize many photos at once?",
          a: "Add all the files, set the size once — say, 1920 px on the long side — and download the results as a single ZIP. The settings are applied to every file, and portrait and landscape shots are handled correctly.",
        },
        {
          q: "Does resizing reduce the file size?",
          a: "Usually by a lot: halving both sides leaves a quarter of the pixels. If you need a specific size in kilobytes, use the compressor’s “Target size” mode instead.",
        },
      ],
    },
  },

  crop: {
    name: { ru: "Обрезать фото", en: "Crop image" },
    title: {
      ru: "Обрезать фото онлайн — свободная рамка или пропорции",
      en: "Crop Image Online — Free or Fixed Aspect Ratio",
    },
    h1: { ru: "Обрезать фото онлайн", en: "Crop Images Online" },
    description: {
      ru: "Обрезка фото свободной рамкой или в пропорциях 1:1, 4:3, 16:9, 9:16, 4:5; точные X, Y, ширина и высота в px, сетка третей, управление с клавиатуры.",
      en: "Crop photos with a free frame or a fixed ratio such as 1:1, 4:3, 16:9, 9:16 or 4:5; exact X, Y, width and height in px, thirds grid, keyboard control.",
    },
    lead: {
      ru: "Выделите рамкой нужную часть снимка — всё, что окажется за её пределами, будет отрезано.",
      en: "Frame the part of the picture you want to keep — everything outside the frame is cut away.",
    },
    keywords: {
      ru: [
        "обрезать фото",
        "обрезать фото онлайн",
        "кадрировать фото",
        "обрезать картинку",
        "обрезать края фото",
        "обрезать изображение по размеру",
        "вырезать часть фото",
      ],
      en: [
        "crop image",
        "crop image online",
        "crop photo",
        "crop picture to size",
        "image cropper",
        "cut out part of an image",
        "crop image to exact pixels",
      ],
    },
    howTo: {
      ru: [
        "Загрузите изображение — поверх него появится рамка обрезки.",
        "Выберите пропорции: свободные или фиксированные — 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:3 и другие.",
        "Перетащите рамку или её 8 маркеров мышью или пальцем; с клавиатуры стрелки сдвигают рамку, а Shift+стрелки меняют её размер. Для точности введите X, Y, ширину и высоту в px.",
        "Выберите формат результата — как у исходного, JPG, PNG или WebP — и скачайте файл.",
      ],
      en: [
        "Open an image — a crop frame appears on top of it.",
        "Choose the proportions: free or fixed — 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:3 and more.",
        "Drag the frame or its 8 handles with the mouse or a finger; on the keyboard, arrow keys move the frame and Shift+arrows resize it. For precision, type X, Y, width and height in px.",
        "Pick the output format — same as source, JPG, PNG or WebP — and download the file.",
      ],
    },
    about: {
      ru: [
        "Обрезка убирает лишнее по краям и меняет композицию, но не масштабирует снимок: оставшиеся пиксели сохраняются как были. Если нужен конкретный итоговый размер вроде 1080×1350 px, обрежьте фото в нужных пропорциях, а затем уменьшите его в инструменте изменения размера.",
        "Рамкой можно управлять без мыши: когда она в фокусе, стрелки двигают её, а Shift+стрелки меняют размер. Сетка по правилу третей помогает поставить горизонт и главный объект на линии, а увеличение масштаба — точно подогнать край на больших снимках.",
        "Обрезать можно и фото с iPhone в HEIC, и TIFF, BMP, AVIF — результат сохраняется в JPG, PNG или WebP. Для скриншотов и графики удобнее PNG: он записывает пиксели без потерь. Обрезка выполняется прямо в браузере.",
      ],
      en: [
        "Cropping trims the edges and changes the composition but doesn’t scale the picture: the remaining pixels are kept as they were. If you need an exact final size such as 1080×1350 px, crop to the right proportions first and then downsize with the resize tool.",
        "The frame works without a mouse: once it has focus, arrow keys move it and Shift+arrows resize it. The rule-of-thirds grid helps you place the horizon and the main subject on the lines, and zooming in lets you position an edge precisely on large photos.",
        "You can crop iPhone HEIC photos as well as TIFF, BMP and AVIF — the result is saved as JPG, PNG or WebP. For screenshots and graphics PNG is the better choice, since it stores pixels losslessly. Cropping happens right in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как обрезать фото до точного размера в пикселях?",
          a: "Есть два пути. Можно ввести ширину и высоту рамки в px — тогда вырезается фрагмент ровно такого размера, без масштабирования. Или обрезать фото в нужных пропорциях (например, 4:5), а затем уменьшить результат до 1080×1350 в инструменте изменения размера — так в кадре останется больше сцены.",
        },
        {
          q: "Какие пропорции выбрать для Instagram, сторис и YouTube?",
          a: "Для ленты Instagram — 4:5 (вертикальный пост) или 1:1, для сторис, Reels и Shorts — 9:16, для превью YouTube и широких экранов — 16:9. Для печати фото 10×15 подходят 3:2 или 2:3 в зависимости от ориентации.",
        },
        {
          q: "Можно ли одинаково обрезать много фото?",
          a: "Рамку удобнее выставлять для каждого снимка отдельно — у каждого своя композиция. Если нужно быстро привести пачку фото к одним пропорциям, воспользуйтесь изменением размера в режиме «Заполнить и обрезать по центру»: он обрежет каждое изображение по центру и отдаст всё одним ZIP-архивом.",
        },
        {
          q: "Можно ли обрезать фото на телефоне?",
          a: "Да, рамка и маркеры работают касанием: тяните рамку пальцем, чтобы сдвинуть её, а маркеры — чтобы изменить размер. Фото с iPhone в формате HEIC тоже открываются, даже если браузер сам этот формат не поддерживает.",
        },
      ],
      en: [
        {
          q: "How do I crop a photo to an exact size in pixels?",
          a: "There are two ways. Type the frame’s width and height in px to cut out a piece of exactly that size with no scaling. Or crop to the proportions you need (say, 4:5) and then downsize the result to 1080×1350 with the resize tool — this keeps more of the scene in the frame.",
        },
        {
          q: "Which aspect ratio should I use for Instagram, Stories and YouTube?",
          a: "For the Instagram feed use 4:5 (portrait post) or 1:1; for Stories, Reels and Shorts use 9:16; for YouTube thumbnails and widescreen displays use 16:9. For 4×6 prints, 3:2 or 2:3 fits depending on orientation.",
        },
        {
          q: "Can I crop many photos the same way?",
          a: "The frame is best set for each photo individually, since every shot has its own composition. To bring a batch to the same proportions quickly, use the resize tool in “Fill and crop centre” mode: it crops each image around its centre and gives you everything in one ZIP.",
        },
        {
          q: "Can I crop photos on my phone?",
          a: "Yes — the frame and handles respond to touch: drag the frame with a finger to move it and drag a handle to resize it. iPhone HEIC photos open too, even in browsers that can’t display the format on their own.",
        },
      ],
    },
  },

  "crop-circle": {
    name: { ru: "Фото по кругу", en: "Circle crop" },
    title: {
      ru: "Обрезать фото по кругу — круглая аватарка в PNG",
      en: "Crop Image to a Circle — Round Profile Picture PNG",
    },
    h1: { ru: "Обрезать фото по кругу", en: "Crop an Image into a Circle" },
    description: {
      ru: "Круглая аватарка из любого фото: двигайте и масштабируйте круг, сохраняйте PNG или WebP с прозрачным фоном либо JPG с цветным фоном, например 512×512 px.",
      en: "Make a round avatar from any photo: move and resize the circle, then save a PNG or WebP with transparent corners or a JPG on a colour, e.g. 512×512 px.",
    },
    lead: {
      ru: "Наведите круг на лицо или логотип — всё за его пределами станет прозрачным, и получится круглая картинка для аватарки или сайта.",
      en: "Place the circle over a face or logo — everything outside it becomes transparent, leaving a round picture for an avatar or a website.",
    },
    keywords: {
      ru: [
        "обрезать фото по кругу",
        "круглое фото онлайн",
        "сделать аватарку круглой",
        "обрезать картинку кругом",
        "круглая аватарка png",
        "вырезать круг из фото",
        "фото в круге на прозрачном фоне",
      ],
      en: [
        "crop image in circle",
        "circle crop online",
        "round profile picture maker",
        "make image round",
        "circle png from photo",
        "circular crop tool",
      ],
    },
    howTo: {
      ru: [
        "Загрузите фото или логотип.",
        "Перетащите круг на нужное место и измените его размер так, чтобы в него попало всё важное.",
        "Выберите формат: PNG или WebP с прозрачными углами либо JPG с заливкой фона выбранным цветом.",
        "При необходимости задайте итоговый размер, например 512×512 px, и скачайте картинку.",
      ],
      en: [
        "Open a photo or a logo.",
        "Drag the circle into place and resize it so everything important is inside.",
        "Choose the format: PNG or WebP with transparent corners, or JPG with the background filled in a colour of your choice.",
        "Optionally set the output size, such as 512×512 px, and download the picture.",
      ],
    },
    about: {
      ru: [
        "Круглая картинка — это квадрат, у которого всё вне круга прозрачно. Поэтому для прозрачного фона нужен PNG или WebP; JPG прозрачность не поддерживает, и углы в нём заливаются цветом — выберите его под фон сайта, презентации или документа.",
        "Telegram, WhatsApp, VK и большинство соцсетей сами показывают аватар кругом, поэтому туда лучше загружать обычное квадратное фото — маска наложится автоматически. Круглый PNG пригодится там, где форму задаёте вы: на сайте, в презентации, в подписи письма, на визитке или в превью видео.",
        "Для аватарок обычно хватает 256–1024 px по стороне — больший размер лишь увеличит вес файла. Обрезка выполняется прямо в браузере.",
      ],
      en: [
        "A round picture is really a square with everything outside the circle made transparent. That’s why a transparent background needs PNG or WebP; JPG has no transparency, so its corners are filled with a colour — pick one that matches your website, slides or document.",
        "Telegram, WhatsApp and most social networks show avatars as circles on their own, so upload a regular square photo there and the mask is applied automatically. A round PNG is useful where you control the shape: on a website, in slides, an email signature, a business card or a video thumbnail.",
        "For avatars, 256–1024 px per side is usually plenty — anything larger just adds file weight. Cropping happens right in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему углы круглой картинки белые или чёрные?",
          a: "Скорее всего, файл сохранён в JPG — тогда углы заливаются выбранным цветом. Сохраните картинку в PNG или WebP. Кроме того, некоторые просмотрщики показывают прозрачность белым или чёрным фоном, хотя в самом файле углы прозрачные.",
        },
        {
          q: "Нужно ли обрезать фото по кругу для аватарки в Telegram или WhatsApp?",
          a: "Нет: мессенджеры сами обрезают аватар кругом при показе. Загрузите квадратное фото, в котором лицо находится в центре, — края квадрата всё равно будут скрыты. Круглый PNG с прозрачными углами там не нужен.",
        },
        {
          q: "Какой размер выбрать для круглой аватарки?",
          a: "Универсальный вариант — 512×512 px: этого хватает для чёткого показа даже на экранах с высокой плотностью пикселей. Для сайта ориентируйтесь на размер показа, умноженный на два: например, 240×240 px для аватарки шириной 120 px.",
        },
        {
          q: "Можно ли вырезать овал вместо круга?",
          a: "Нет, инструмент вырезает только ровный круг. Если нужен прямоугольник со скруглёнными углами, воспользуйтесь инструментом скругления углов — радиус там задаётся в процентах или пикселях.",
        },
      ],
      en: [
        {
          q: "Why are the corners of my round picture white or black?",
          a: "Most likely the file was saved as JPG, so the corners were filled with the chosen colour. Save it as PNG or WebP instead. Also, some image viewers display transparency as a white or black background even though the corners in the file are transparent.",
        },
        {
          q: "Do I need a circle crop for a Telegram or WhatsApp profile picture?",
          a: "No — messengers crop the avatar to a circle when displaying it. Upload a square photo with the face in the centre; the corners of the square will be hidden anyway. A round PNG with transparent corners isn’t needed there.",
        },
        {
          q: "What size should a round avatar be?",
          a: "512×512 px is a safe all-round choice: it stays sharp even on high-density screens. For a website, aim for twice the display size — for example, 240×240 px for an avatar shown at 120 px.",
        },
        {
          q: "Can I crop an oval instead of a circle?",
          a: "No, the tool only cuts a perfect circle. If you need a rectangle with rounded corners, use the round corners tool, where the radius is set in percent or pixels.",
        },
      ],
    },
  },

  rotate: {
    name: { ru: "Повернуть фото", en: "Rotate image" },
    title: {
      ru: "Повернуть фото онлайн — на 90°, 180° или любой угол",
      en: "Rotate Image Online — 90°, 180° or Any Angle",
    },
    h1: { ru: "Повернуть фото онлайн", en: "Rotate Images Online" },
    description: {
      ru: "Поворот фото на 90° влево и вправо, 180° или любой угол с шагом 0,1°. JPG поворачивается без потерь через EXIF; автообрезка углов, пакетная обработка.",
      en: "Rotate photos 90° left or right, 180° or any angle in 0.1° steps. JPGs rotate losslessly via EXIF; auto-crop or expanded canvas, batch processing.",
    },
    lead: {
      ru: "Поверните снимок на 90° или 180° одним нажатием либо выровняйте горизонт точным углом — JPG можно повернуть вовсе без перекодирования.",
      en: "Turn a photo 90° or 180° in one click or straighten the horizon with an exact angle — JPGs can even be rotated without re-encoding.",
    },
    keywords: {
      ru: [
        "повернуть фото",
        "повернуть фото онлайн",
        "перевернуть фото на 90 градусов",
        "повернуть картинку",
        "выровнять горизонт на фото",
        "повернуть jpg без потери качества",
        "повернуть фото на 180 градусов",
      ],
      en: [
        "rotate image",
        "rotate image online",
        "rotate photo 90 degrees",
        "rotate jpg without losing quality",
        "straighten photo",
        "rotate picture by angle",
      ],
    },
    howTo: {
      ru: [
        "Добавьте одно или несколько изображений.",
        "Поверните на 90° влево или вправо либо на 180° — или задайте точный угол от −180° до 180° с шагом 0,1°.",
        "Для произвольного угла выберите, что делать с пустыми углами: обрезать их автоматически или расширить холст с прозрачным либо цветным фоном.",
        "Для JPG выберите «Без потерь (EXIF)» или «Повернуть пиксели», затем скачайте файлы по одному или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add one or more images.",
        "Rotate 90° left or right or 180° — or enter an exact angle from −180° to 180° in 0.1° steps.",
        "For a custom angle, choose how to handle the empty corners: crop them away automatically or expand the canvas with a transparent or coloured background.",
        "For JPGs choose “Lossless (EXIF)” or “Rotate pixels”, then download files one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "В режиме «Без потерь (EXIF)» поворот JPG на 90°, 180° и 270° не трогает сжатые данные: в файл записывается только флаг ориентации, а просмотрщики сами показывают снимок повёрнутым. Качество не меняется ни на один пиксель, и даже большое фото обрабатывается мгновенно.",
        "Этот флаг понимают современные браузеры, телефоны и операционные системы, но некоторые старые программы и формы загрузки на сайтах его игнорируют или удаляют — и фото снова оказывается «на боку». В таком случае выберите «Повернуть пиксели»: изображение будет перерисовано и пересохранено, а флаг ориентации сброшен.",
        "Произвольный угол нужен, чтобы выровнять заваленный горизонт или криво отсканированный документ. При повороте, скажем, на 2° по краям появляются пустые треугольники: автообрезка убирает их, немного уменьшая кадр, а расширенный холст сохраняет всё изображение. PNG, WebP, HEIC, TIFF и другие форматы поворачиваются перерисовкой пикселей в браузере, в Web Worker.",
      ],
      en: [
        "In “Lossless (EXIF)” mode, rotating a JPG by 90°, 180° or 270° leaves the compressed data untouched: only the orientation flag is written, and viewers display the photo rotated. Not a single pixel changes, and even a large photo is done instantly.",
        "Modern browsers, phones and operating systems honour this flag, but some older programs and website upload forms ignore or strip it — and the photo is lying on its side again. In that case choose “Rotate pixels”: the image is redrawn and re-saved, and the orientation flag is reset.",
        "A custom angle is for straightening a tilted horizon or a crooked scan. Rotating by, say, 2° leaves empty triangles at the edges: auto-crop removes them by slightly shrinking the frame, while an expanded canvas keeps the whole image. PNG, WebP, HEIC, TIFF and other formats are rotated by redrawing the pixels in your browser, in a Web Worker.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему фото на компьютере стоит правильно, а после загрузки на сайт лежит на боку?",
          a: "Скорее всего, ориентация задана только флагом EXIF, а сайт его не учитывает или удаляет при загрузке. Поверните фото в режиме «Повернуть пиксели» — тогда изображение будет повёрнуто в самих пикселях и отобразится правильно везде.",
        },
        {
          q: "Теряется ли качество при повороте JPG?",
          a: "В режиме «Без потерь (EXIF)» — нет: меняется только флаг ориентации, сжатые данные остаются прежними. При повороте пикселей и на произвольный угол файл пересохраняется, но при высоком качестве разницу заметить трудно.",
        },
        {
          q: "Как повернуть фото на несколько градусов, чтобы выровнять горизонт?",
          a: "Введите угол в поле — например, −1,5° — и проверьте результат на превью; шаг — 0,1°. Включите автообрезку, чтобы по краям не остались пустые углы, или расширьте холст, если важно сохранить весь кадр.",
        },
        {
          q: "Можно ли повернуть анимированный GIF?",
          a: "Используется только первый кадр — инструмент предупредит об этом, и результат будет статичной картинкой. Кадры анимации можно извлечь отдельным инструментом разбивки GIF на кадры.",
        },
      ],
      en: [
        {
          q: "Why does my photo look fine on my computer but appear sideways after uploading?",
          a: "Its orientation is most likely stored only as an EXIF flag, which the website ignores or strips on upload. Rotate the photo with “Rotate pixels” — the pixels themselves are turned, so it displays correctly everywhere.",
        },
        {
          q: "Does rotating a JPG reduce quality?",
          a: "Not in “Lossless (EXIF)” mode: only the orientation flag changes and the compressed data stays the same. Rotating pixels or rotating by a custom angle re-saves the file, but at high quality the difference is hard to spot.",
        },
        {
          q: "How do I rotate a photo by a few degrees to straighten the horizon?",
          a: "Type the angle — for example −1.5° — and check the preview; the step is 0.1°. Turn on auto-crop so no empty corners remain, or expand the canvas if you need to keep the entire frame.",
        },
        {
          q: "Can I rotate an animated GIF?",
          a: "Only the first frame is used — the tool warns you about it, and the result is a still image. You can extract the animation frames with the separate GIF-to-frames tool.",
        },
      ],
    },
  },

  flip: {
    name: { ru: "Отразить фото", en: "Flip image" },
    title: {
      ru: "Отразить фото зеркально — по горизонтали и вертикали",
      en: "Flip Image Online — Mirror Horizontally or Vertically",
    },
    h1: { ru: "Отразить фото зеркально", en: "Flip an Image (Mirror a Photo)" },
    description: {
      ru: "Зеркальное отражение фото по горизонтали, вертикали или сразу в обе стороны. JPG отражается без потерь через флаг EXIF; пакетная обработка и скачивание ZIP.",
      en: "Mirror a photo horizontally, vertically or both ways. JPGs can be flipped losslessly via the EXIF orientation flag; batch processing and ZIP download.",
    },
    lead: {
      ru: "Одним нажатием получите зеркальную копию снимка — например, чтобы исправить отражённое селфи с фронтальной камеры.",
      en: "Get a mirror image of a photo in one click — for example, to un-mirror a selfie from the front camera.",
    },
    keywords: {
      ru: [
        "отразить фото зеркально",
        "зеркальное отражение фото онлайн",
        "отзеркалить фото",
        "отразить картинку по горизонтали",
        "перевернуть фото зеркально",
        "отразить фото по вертикали",
      ],
      en: [
        "flip image",
        "mirror image online",
        "flip photo horizontally",
        "flip image vertically",
        "mirror a picture",
        "unmirror selfie",
      ],
    },
    howTo: {
      ru: [
        "Добавьте фото — одно или сразу несколько.",
        "Выберите направление: по горизонтали (левая и правая стороны меняются местами), по вертикали (верх и низ) или в обе стороны.",
        "Для JPG оставьте отражение без перекодирования через флаг EXIF или выберите перерисовку пикселей.",
        "Скачайте результат по одному файлу или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add a photo — or several at once.",
        "Choose the direction: horizontal (left and right swap), vertical (top and bottom swap) or both.",
        "For JPGs, keep the lossless flip via the EXIF flag or choose to redraw the pixels.",
        "Download the results one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Горизонтальное отражение меняет левую и правую стороны местами — так исправляют «зеркальные» селфи и надписи, читающиеся наоборот, или разворачивают объект в другую сторону для макета. Вертикальное переворачивает кадр вверх ногами, а отражение в обе стороны равносильно повороту на 180°.",
        "JPG можно отразить без перекодирования: в файл записывается флаг ориентации EXIF, а сжатые данные не меняются. Некоторые старые программы и формы загрузки на сайтах этот флаг не учитывают — тогда выберите перерисовку пикселей, и отражение станет частью самого изображения.",
        "PNG, WebP, HEIC и другие форматы отражаются перерисовкой в браузере, в Web Worker; прозрачность в PNG и WebP сохраняется. У анимированного GIF используется только первый кадр.",
      ],
      en: [
        "A horizontal flip swaps left and right — it fixes mirrored selfies and back-to-front lettering, or turns an object to face the other way in a layout. A vertical flip turns the frame upside down, and flipping both ways is the same as rotating by 180°.",
        "A JPG can be flipped without re-encoding: an EXIF orientation flag is written and the compressed data stays the same. Some older programs and website upload forms ignore that flag — in that case choose to redraw the pixels so the flip becomes part of the image itself.",
        "PNG, WebP, HEIC and other formats are flipped by redrawing them in your browser, in a Web Worker; transparency in PNG and WebP is preserved. For an animated GIF only the first frame is used.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему селфи получаются зеркальными?",
          a: "Фронтальная камера показывает превью как зеркало, и многие телефоны так же сохраняют снимок. Из-за этого надписи на одежде или вывесках читаются наоборот. Отразите фото по горизонтали — и всё встанет на свои места.",
        },
        {
          q: "Чем отражение отличается от поворота?",
          a: "Поворот вращает изображение, не меняя стороны местами: надписи остаются читаемыми, только наклонёнными. Отражение даёт зеркальную копию, в которой текст читается наоборот. Отражение по горизонтали и вертикали одновременно совпадает с поворотом на 180°.",
        },
        {
          q: "Теряется ли качество при отражении?",
          a: "Для JPG в режиме через флаг EXIF — нет, пиксели не пересжимаются. При перерисовке JPG и WebP пересохраняются с небольшими потерями, а PNG остаётся без потерь.",
        },
      ],
      en: [
        {
          q: "Why do my selfies come out mirrored?",
          a: "The front camera shows its preview like a mirror, and many phones save the photo that way too. That’s why text on clothing or signs reads backwards. Flip the photo horizontally and everything is the right way round.",
        },
        {
          q: "What’s the difference between flipping and rotating?",
          a: "Rotating turns the image without swapping sides: text stays readable, just tilted. Flipping produces a mirror copy in which text reads backwards. Flipping both horizontally and vertically is the same as rotating by 180°.",
        },
        {
          q: "Does flipping reduce quality?",
          a: "Not for JPGs flipped via the EXIF flag — the pixels aren’t re-compressed. When pixels are redrawn, JPG and WebP are re-saved with a slight loss, while PNG stays lossless.",
        },
      ],
    },
  },

  convert: {
    name: { ru: "Конвертер", en: "Image converter" },
    title: {
      ru: "Конвертер изображений онлайн — JPG, PNG, WebP, AVIF, ICO",
      en: "Image Converter Online — JPG, PNG, WebP, AVIF, GIF, ICO",
    },
    h1: { ru: "Конвертер изображений онлайн", en: "Online Image Converter" },
    description: {
      ru: "Конвертация HEIC, WebP, AVIF, PNG, JPG, TIFF, BMP, SVG и GIF в JPG, PNG, WebP, AVIF, GIF или ICO. Качество, фон для JPG, размеры ICO, пакетно и в ZIP.",
      en: "Convert HEIC, WebP, AVIF, PNG, JPG, TIFF, BMP, SVG and GIF to JPG, PNG, WebP, AVIF, GIF or ICO. Quality control, JPG background, ICO sizes, batch ZIP.",
    },
    lead: {
      ru: "Добавьте картинки в любом распространённом формате, выберите нужный — и получите готовые файлы без установки программ.",
      en: "Drop in images in any common format, choose the one you need and get the converted files without installing anything.",
    },
    keywords: {
      ru: [
        "конвертер изображений",
        "конвертер изображений онлайн",
        "конвертировать фото в jpg",
        "изменить формат фото",
        "конвертер картинок",
        "перевести картинку в png",
        "поменять формат изображения онлайн",
      ],
      en: [
        "image converter",
        "convert image online",
        "convert image to jpg",
        "change image format",
        "picture converter",
        "convert to png",
        "photo format converter",
      ],
    },
    howTo: {
      ru: [
        "Добавьте изображения: JPG, PNG, WebP, AVIF, HEIC, GIF, BMP, TIFF, SVG или ICO — можно вперемешку.",
        "Выберите формат результата: JPG, PNG, WebP, AVIF, GIF или ICO.",
        "Настройте параметры: качество для JPG, WebP и AVIF, цвет фона вместо прозрачности для JPG, размеры иконок для ICO, размер растра для SVG.",
        "Скачайте файлы по одному или все сразу кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add images: JPG, PNG, WebP, AVIF, HEIC, GIF, BMP, TIFF, SVG or ICO — mixed formats are fine.",
        "Choose the output format: JPG, PNG, WebP, AVIF, GIF or ICO.",
        "Adjust the settings: quality for JPG, WebP and AVIF, a background colour to replace transparency in JPG, icon sizes for ICO, raster size for SVG.",
        "Download files one by one or all at once with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "JPG — самый совместимый формат для фото, PNG хранит пиксели без потерь и поддерживает прозрачность, WebP и AVIF дают меньший вес при том же качестве. AVIF самый компактный, но кодируется медленнее. Кодировщики WebP и AVIF работают на WebAssembly, поэтому эти форматы сохраняются и в Safari, который сам их создавать не умеет.",
        "У JPG нет прозрачности: прозрачные области PNG, WebP или SVG заливаются выбранным цветом, по умолчанию белым. Из анимированных GIF, WebP и AVIF берётся только первый кадр — инструмент предупредит об этом; все кадры GIF можно извлечь отдельным инструментом. Из многостраничного TIFF конвертируется первая страница.",
        "Фото с iPhone в HEIC открываются в любом современном браузере: там, где нет встроенной поддержки, их декодирует libheif на WebAssembly. Файлы .jfif и .jpeg при переводе в JPG копируются байт в байт, без перекодирования, если больше ничего не меняется. Конвертация идёт в браузере, в Web Worker.",
      ],
      en: [
        "JPG is the most compatible format for photos, PNG stores pixels losslessly and supports transparency, and WebP and AVIF give smaller files at the same quality. AVIF is the most compact but slower to encode. The WebP and AVIF encoders run on WebAssembly, so these formats can be saved even in Safari, which can’t create them natively.",
        "JPG has no transparency: transparent areas of a PNG, WebP or SVG are filled with the colour you choose, white by default. Animated GIF, WebP and AVIF files contribute only their first frame — the tool warns you, and all GIF frames can be extracted with a separate tool. For multi-page TIFFs, the first page is converted.",
        "iPhone HEIC photos open in any modern browser: where there’s no built-in support, libheif compiled to WebAssembly decodes them. Converting .jfif or .jpeg files to JPG copies them byte for byte, with no re-encoding, when nothing else changes. Conversion runs in your browser, in a Web Worker.",
      ],
    },
    faq: {
      ru: [
        {
          q: "В какой формат лучше конвертировать фото?",
          a: "Для отправки по почте, в документы и на любые сайты — JPG. Для публикации на своём сайте — WebP или AVIF: они легче при том же качестве. Для графики, скриншотов и логотипов с прозрачностью — PNG, для иконок — ICO.",
        },
        {
          q: "Почему после конвертации в JPG пропал прозрачный фон?",
          a: "Формат JPG не поддерживает прозрачность, поэтому прозрачные области заливаются цветом фона — его можно выбрать в настройках. Если прозрачность нужна, сохраняйте в PNG, WebP или AVIF.",
        },
        {
          q: "Сохраняется ли анимация GIF при конвертации?",
          a: "Нет, конвертер берёт только первый кадр. Анимированные WebP и AVIF создавать нельзя, а все кадры GIF можно сохранить по отдельности в инструменте разбивки GIF на кадры.",
        },
        {
          q: "Можно ли конвертировать RAW или PSD?",
          a: "Нет. RAW-файлы камер (CR2, NEF, ARW) и PSD из Photoshop не поддерживаются. Сохраните их в JPG, PNG или TIFF в программе камеры или в редакторе, а затем конвертируйте дальше.",
        },
      ],
      en: [
        {
          q: "Which format should I convert my photos to?",
          a: "For email, documents and uploads to other sites, JPG. For publishing on your own website, WebP or AVIF — they’re lighter at the same quality. For graphics, screenshots and logos with transparency, PNG; for icons, ICO.",
        },
        {
          q: "Why did the transparent background disappear after converting to JPG?",
          a: "JPG doesn’t support transparency, so transparent areas are filled with a background colour, which you can pick in the settings. If you need transparency, save as PNG, WebP or AVIF.",
        },
        {
          q: "Is GIF animation kept after conversion?",
          a: "No, the converter takes only the first frame. Animated WebP and AVIF output isn’t available, but you can save every GIF frame separately with the GIF-to-frames tool.",
        },
        {
          q: "Can I convert RAW or PSD files?",
          a: "No. Camera RAW files (CR2, NEF, ARW) and Photoshop PSDs aren’t supported. Export them to JPG, PNG or TIFF in your camera software or editor first, then convert further.",
        },
      ],
    },
  },

  filters: {
    name: { ru: "Фильтры", en: "Photo filters" },
    title: {
      ru: "Фильтры для фото онлайн — 20 эффектов с настройкой силы",
      en: "Photo Filters Online — 20 Effects with Adjustable Strength",
    },
    h1: { ru: "Фильтры для фото онлайн", en: "Online Photo Filters" },
    description: {
      ru: "20 фильтров для фото: ч/б, сепия, винтаж, размытие, резкость, пикселизация, дуотон, виньетка, скетч, зерно. Регулировка силы, пакетная обработка.",
      en: "20 photo filters: black & white, sepia, vintage, blur, sharpen, pixelate, duotone, vignette, pencil sketch, film grain. Adjustable strength, batch mode.",
    },
    lead: {
      ru: "Выберите фильтр и его силу — превью обновляется сразу, а итоговый файл сохраняется в полном разрешении.",
      en: "Pick a filter and set its strength — the preview updates instantly and the final file is saved at full resolution.",
    },
    keywords: {
      ru: [
        "фильтры для фото онлайн",
        "наложить фильтр на фото",
        "эффекты для фото онлайн",
        "сделать фото черно-белым",
        "фото в сепию",
        "винтажный фильтр для фото",
        "обработать фото онлайн",
      ],
      en: [
        "photo filters online",
        "apply filter to photo",
        "photo effects online",
        "black and white photo filter",
        "vintage photo filter",
        "image filters",
      ],
    },
    howTo: {
      ru: [
        "Загрузите одно или несколько фото.",
        "Выберите один из 20 фильтров — от чёрно-белого и сепии до карандашного скетча, дуотона и зерна плёнки.",
        "Настройте силу эффекта и сравните результат с оригиналом кнопкой «Сравнить».",
        "Скачайте готовые файлы — фильтр применяется в полном разрешении ко всем добавленным фото.",
      ],
      en: [
        "Add one or more photos.",
        "Pick one of 20 filters — from black & white and sepia to pencil sketch, duotone and film grain.",
        "Set the strength and compare the result with the original using the Compare button.",
        "Download the finished files — the filter is applied at full resolution to every photo you added.",
      ],
    },
    about: {
      ru: [
        "Цвет и тон: оттенки серого, сепия, негатив, яркость, контраст, насыщенность, сдвиг оттенка, тёплый и холодный тон. Стилизация: винтаж, дуотон, постеризация, чёрно-белый порог, карандашный скетч, тиснение. Детали и текстура: размытие, резкость, пикселизация, виньетка и зерно плёнки.",
        "Фильтры считаются попиксельно в Web Worker, а не встроенными фильтрами canvas, поэтому результат одинаков во всех браузерах, включая Safari. Превью строится по уменьшенной копии, чтобы ползунок откликался без задержек, а при сохранении эффект применяется к каждому пикселю исходного изображения.",
        "В пакетном режиме один и тот же фильтр с одинаковой силой применяется ко всем файлам — так серия снимков для ленты, каталога или презентации выглядит единообразно.",
      ],
      en: [
        "Colour and tone: grayscale, sepia, invert, brightness, contrast, saturation, hue rotation, warm and cool. Stylised looks: vintage, duotone, posterize, black & white threshold, pencil sketch and emboss. Detail and texture: blur, sharpen, pixelate, vignette and film grain.",
        "Filters are computed pixel by pixel in a Web Worker rather than with the browser’s built-in canvas filters, so the result is identical in every browser, Safari included. The preview uses a scaled-down copy so the slider responds instantly, and on export the effect is applied to every pixel of the original image.",
        "In batch mode the same filter at the same strength is applied to every file, so a series of photos for a feed, catalogue or presentation looks consistent.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем оттенки серого отличаются от чёрно-белого порога?",
          a: "Оттенки серого убирают цвет, но сохраняют все полутона — получается классическое ч/б фото. Порог превращает каждый пиксель в чисто чёрный или чисто белый: это подходит для подписей, печатей, чертежей и графики, но не для портретов.",
        },
        {
          q: "Можно ли наложить несколько фильтров подряд?",
          a: "За один проход применяется один фильтр. Чтобы совместить эффекты, например винтаж и виньетку, сохраните результат, загрузите его снова и примените следующий фильтр.",
        },
        {
          q: "Подойдёт ли пикселизация, чтобы скрыть лицо или номер?",
          a: "Фильтр пикселизации действует на всё изображение целиком. Чтобы скрыть только отдельные участки — лицо, номер машины, данные документа, — используйте инструмент размытия части фото: там можно выделить нужные области.",
        },
        {
          q: "Работают ли фильтры на телефоне и в Safari?",
          a: "Да. Все эффекты рассчитываются собственным кодом по пикселям, а не встроенными фильтрами canvas, которые поддерживаются не во всех браузерах, поэтому результат одинаков на iPhone, Android и компьютере.",
        },
      ],
      en: [
        {
          q: "What’s the difference between grayscale and black & white threshold?",
          a: "Grayscale removes colour but keeps every midtone — a classic black-and-white photo. Threshold turns each pixel into pure black or pure white, which suits signatures, stamps, drawings and graphics but not portraits.",
        },
        {
          q: "Can I apply several filters one after another?",
          a: "One filter is applied per pass. To combine effects such as vintage and vignette, save the result, load it again and apply the next filter.",
        },
        {
          q: "Can I use pixelate to hide a face or a number plate?",
          a: "The pixelate filter affects the whole image. To hide only certain areas — a face, a number plate, document details — use the blur-part-of-an-image tool, where you can select the regions to cover.",
        },
        {
          q: "Do the filters work on phones and in Safari?",
          a: "Yes. Every effect is calculated pixel by pixel in the tool’s own code rather than with built-in canvas filters, which not every browser supports, so the result is the same on iPhone, Android and desktop.",
        },
      ],
    },
  },

  censor: {
    name: { ru: "Размыть часть фото", en: "Blur part of image" },
    title: {
      ru: "Размыть часть фото онлайн — скрыть лицо или номер",
      en: "Blur Part of an Image — Hide Faces, Plates & Text",
    },
    h1: { ru: "Размыть часть фото или замазать лицо", en: "Blur or Pixelate Part of an Image" },
    description: {
      ru: "Размытие, пикселизация или чёрный прямоугольник на выбранных участках фото: лица, номера машин, данные документов. Несколько областей, регулировка силы.",
      en: "Blur, pixelate or black out selected areas of a photo: faces, number plates, document details. Several areas per image and adjustable strength.",
    },
    lead: {
      ru: "Выделите прямоугольником лицо, номер или текст — эта область будет размыта, пикселизирована или закрашена, а остальное фото останется прежним.",
      en: "Draw a rectangle over a face, number plate or text — that area is blurred, pixelated or blacked out while the rest of the photo stays as it was.",
    },
    keywords: {
      ru: [
        "размыть часть фото",
        "замазать лицо на фото",
        "замазать номер на фото",
        "размыть лицо на фото онлайн",
        "пикселизация лица онлайн",
        "скрыть данные на фото",
        "закрасить часть фото",
        "заблюрить фото онлайн",
      ],
      en: [
        "blur part of image",
        "blur face in photo",
        "pixelate image online",
        "censor image",
        "hide license plate in photo",
        "black out text in image",
        "redact image",
      ],
    },
    howTo: {
      ru: [
        "Загрузите фото или скриншот.",
        "Выделите область мышью или пальцем; областей может быть сколько угодно. С клавиатуры их можно добавлять, двигать и менять размер стрелками.",
        "Выберите способ — размытие, пикселизация или сплошная заливка — и настройте силу.",
        "Проверьте результат и скачайте файл: эффект применяется в полном разрешении.",
      ],
      en: [
        "Open a photo or screenshot.",
        "Draw an area with the mouse or a finger; you can add as many as you need. From the keyboard, areas can be added, moved and resized with the arrow keys.",
        "Choose the method — blur, pixelate or solid box — and set the strength.",
        "Check the result and download the file: the effect is applied at full resolution.",
      ],
    },
    about: {
      ru: [
        "Для текста — номеров телефонов и карт, паспортных данных, адресов — надёжнее всего сплошной прямоугольник или крупная пикселизация. Слабое размытие иногда удаётся частично восстановить или «угадать» по очертаниям букв, особенно если известен шрифт. Для лиц обычно достаточно сильного размытия или пикселизации.",
        "Эффект вшивается в пиксели итогового изображения — это не слой поверх картинки, и под закрытой областью исходные данные в сохранённом файле не остаются. Метаданные EXIF при сохранении удаляются, но проверьте и остальной кадр: отражения, бейджи, экраны и документы на заднем плане.",
        "Фото обрабатывается в браузере и никуда не отправляется — это важно, когда на снимке личные данные. Исходный файл на вашем устройстве остаётся без изменений.",
      ],
      en: [
        "For text — phone and card numbers, passport details, addresses — a solid box or coarse pixelation is the safest choice. A weak blur can sometimes be partially reversed or “guessed” from the shapes of the letters, especially if the font is known. For faces, a strong blur or pixelation is usually enough.",
        "The effect is baked into the pixels of the output image — it’s not a layer on top, and the covered data doesn’t survive in the saved file. EXIF metadata is removed on save, but check the rest of the frame too: reflections, badges, screens and documents in the background.",
        "The photo is processed in your browser and never sent anywhere, which matters when it contains personal data. The original file on your device stays unchanged.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Что надёжнее скрывает текст: размытие или пикселизация?",
          a: "Надёжнее всего сплошной прямоугольник — под ним не остаётся никакой информации. Пикселизация с крупными блоками тоже безопасна. Слабое размытие для текста не подходит: по форме размытых букв их иногда удаётся восстановить.",
        },
        {
          q: "Можно ли потом убрать размытие с фото?",
          a: "Из сохранённого файла — нет, это не отдельный слой: пиксели под областью заменены. Однако слабое размытие или мелкую пикселизацию иногда удаётся частично «прочитать», поэтому для важных данных выбирайте сильный эффект или заливку.",
        },
        {
          q: "Как замазать номер машины на фото для объявления?",
          a: "Выделите номерной знак прямоугольником и выберите сплошную заливку или сильную пикселизацию — например, перед публикацией на Авито, Авто.ру или Kolesa.kz. Если в кадре несколько машин, добавьте область для каждого номера.",
        },
        {
          q: "Можно ли скрыть несколько лиц на одном фото?",
          a: "Да, добавьте прямоугольник для каждого лица — количество областей не ограничено, а их размер и положение можно менять в любой момент до сохранения.",
        },
      ],
      en: [
        {
          q: "Which hides text better: blur or pixelation?",
          a: "A solid box is safest — no information remains under it. Pixelation with large blocks is also secure. A weak blur isn’t suitable for text: the letters can sometimes be reconstructed from their blurred shapes.",
        },
        {
          q: "Can the blur be removed from the photo later?",
          a: "Not from the saved file — it isn’t a separate layer, and the pixels under the area are replaced. However, a weak blur or fine pixelation can sometimes be partially “read”, so use a strong effect or a solid box for sensitive data.",
        },
        {
          q: "How do I hide a number plate for a car listing?",
          a: "Draw a rectangle over the plate and choose a solid box or strong pixelation before posting the listing. If several cars are in the shot, add an area for each plate.",
        },
        {
          q: "Can I hide several faces in one photo?",
          a: "Yes — add a rectangle for each face. There’s no limit on the number of areas, and you can change their size and position at any time before saving.",
        },
      ],
    },
  },

  watermark: {
    name: { ru: "Водяной знак", en: "Watermark" },
    title: {
      ru: "Наложить водяной знак на фото онлайн — текст или логотип",
      en: "Add Watermark to Photos Online — Text or Logo, Batch",
    },
    h1: { ru: "Наложить водяной знак на фото", en: "Add a Watermark to Photos" },
    description: {
      ru: "Водяной знак из текста или логотипа PNG: прозрачность, поворот, 9 позиций или узор на всё фото. Размер в % от ширины, поэтому на пачке фото знак одинаков.",
      en: "Text or PNG logo watermark with opacity, rotation, 9 positions or a tiled pattern. Sized in % of image width, so every photo in a batch matches.",
    },
    lead: {
      ru: "Добавьте надпись или логотип на одно фото или сразу на целую пачку — знак подстраивается под ширину каждого снимка.",
      en: "Add text or a logo to one photo or a whole batch — the mark scales to the width of each image.",
    },
    keywords: {
      ru: [
        "наложить водяной знак на фото",
        "водяной знак онлайн",
        "добавить логотип на фото",
        "водяной знак на несколько фото сразу",
        "защитить фото водяным знаком",
        "сделать вотермарк",
        "полупрозрачная надпись на фото",
      ],
      en: [
        "add watermark to photo",
        "watermark images online",
        "batch watermark photos",
        "add logo to photo",
        "text watermark",
        "watermark maker",
      ],
    },
    howTo: {
      ru: [
        "Загрузите фотографии — одну или несколько.",
        "Выберите тип знака: текст (шрифт, цвет, прозрачность, размер, поворот, тень) или изображение — логотип в PNG с прозрачностью.",
        "Укажите положение: одна из 9 позиций (углы, края, центр) с отступом от края или повторяющийся по диагонали узор на всё фото.",
        "Проверьте превью и скачайте результат по одному файлу или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add your photos — one or many.",
        "Choose the watermark type: text (font, colour, opacity, size, rotation, shadow) or an image — a PNG logo with transparency.",
        "Set the position: one of 9 spots (corners, edges, centre) with a margin, or a pattern repeated diagonally across the whole photo.",
        "Check the preview and download the results one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "Размер знака задаётся в процентах от ширины изображения, а не в пикселях. Поэтому на снимке шириной 6000 px и на картинке шириной 800 px надпись занимает одинаковую долю кадра, и пачка фото разного разрешения выглядит единообразно.",
        "Знак в углу легко отрезать при кадрировании. Если нужно защитить фото от копирования — например, снимки товаров для маркетплейса или портфолио, — выберите узор: знак повторяется по диагонали через всё изображение. Полупрозрачный знак заметен, но не мешает рассмотреть фото.",
        "Для логотипа используйте PNG с прозрачным фоном — иначе вокруг него будет виден прямоугольник. Знак вшивается в пиксели итогового файла, а оригиналы на устройстве остаются без изменений; обработка идёт в браузере, в Web Worker.",
      ],
      en: [
        "The watermark size is set as a percentage of the image width, not in pixels. So on a 6000 px wide photo and an 800 px wide picture the text takes up the same share of the frame, and a batch of photos with different resolutions looks consistent.",
        "A corner watermark is easy to crop out. If you need to protect photos from copying — product shots for a marketplace or a portfolio, for example — choose the tiled pattern: the mark repeats diagonally across the whole image. A semi-transparent mark stays visible without getting in the way of the photo.",
        "For a logo, use a PNG with a transparent background — otherwise a rectangle will show around it. The watermark is baked into the pixels of the output file while the originals on your device stay unchanged; processing runs in your browser, in a Web Worker.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как наложить водяной знак сразу на много фото?",
          a: "Добавьте все снимки, один раз настройте знак и скачайте результат одним ZIP-архивом. Размер знака считается от ширины каждого фото, так что на больших и маленьких изображениях он будет выглядеть одинаково.",
        },
        {
          q: "Почему вокруг логотипа виден белый прямоугольник?",
          a: "У файла логотипа непрозрачный фон — например, это JPG или PNG, сохранённый без прозрачности. Нужен PNG с прозрачным фоном; если его нет, попросите у дизайнера версию логотипа «на прозрачном фоне».",
        },
        {
          q: "Какой размер и прозрачность выбрать?",
          a: "Для знака в углу обычно хватает 15–25 % ширины фото при непрозрачности 50–70 %. Для узора на всё фото делайте знак мельче и прозрачнее — около 20–40 % непрозрачности, — чтобы он защищал снимок, но не мешал его рассмотреть.",
        },
        {
          q: "Можно ли потом убрать водяной знак?",
          a: "Из сохранённого файла — нет: знак становится частью изображения. Поэтому храните оригиналы отдельно — сам инструмент их не изменяет, а создаёт новые файлы.",
        },
      ],
      en: [
        {
          q: "How do I watermark many photos at once?",
          a: "Add all the photos, set up the watermark once and download the results as a single ZIP. The mark is sized relative to each photo’s width, so it looks the same on large and small images.",
        },
        {
          q: "Why is there a white box around my logo?",
          a: "The logo file has an opaque background — for example, it’s a JPG or a PNG saved without transparency. You need a PNG with a transparent background; if you don’t have one, ask your designer for a transparent version of the logo.",
        },
        {
          q: "What size and opacity should I use?",
          a: "For a corner mark, 15–25% of the photo width at 50–70% opacity usually works. For a tiled pattern, make the mark smaller and more transparent — around 20–40% opacity — so it protects the photo without obscuring it.",
        },
        {
          q: "Can the watermark be removed later?",
          a: "Not from the saved file — the mark becomes part of the image. That’s why you should keep your originals: the tool never changes them, it creates new files.",
        },
      ],
    },
  },

  "add-text": {
    name: { ru: "Текст на фото", en: "Add text" },
    title: {
      ru: "Добавить текст на фото онлайн — надпись, мем, цитата",
      en: "Add Text to Photo Online — Captions, Memes, Quote Cards",
    },
    h1: { ru: "Добавить текст на фото", en: "Add Text to a Photo" },
    description: {
      ru: "Надпись на фото с обводкой: 9 шрифтов, включая Impact, цвет, размер, выравнивание, заглавные. Мем с текстом сверху и снизу, карточка-цитата для поста и сторис.",
      en: "Outlined text on a photo: 9 fonts including Impact, colour, size, alignment, caps. Meme-style top and bottom text, plus quote cards for posts and stories.",
    },
    lead: {
      ru: "Напишите подпись, мемную фразу или цитату — текст с обводкой ляжет поверх фото, кириллица поддерживается.",
      en: "Type a caption, a meme line or a quote — outlined text is placed over the photo, and Cyrillic works too.",
    },
    keywords: {
      ru: [
        "добавить текст на фото",
        "написать на фото онлайн",
        "надпись на фото",
        "сделать мем онлайн",
        "наложить текст на картинку",
        "подпись к фото онлайн",
        "цитата на картинке",
        "сделать мем с надписью",
      ],
      en: [
        "add text to photo",
        "add text to image online",
        "meme generator",
        "caption photo",
        "put words on a picture",
        "quote image maker",
      ],
    },
    howTo: {
      ru: [
        "Загрузите фото — или выберите режим карточки-цитаты, если нужен текст на цветном фоне.",
        "Введите текст сверху и снизу в стиле мема или добавьте сколько угодно отдельных текстовых блоков.",
        "Настройте для каждого блока шрифт, размер, цвет, цвет и толщину обводки, выравнивание, заглавные буквы и положение.",
        "Скачайте готовую картинку.",
      ],
      en: [
        "Open a photo — or switch to quote card mode if you want text on a coloured background.",
        "Enter meme-style top and bottom text, or add as many separate text blocks as you like.",
        "For each block set the font, size, colour, outline colour and width, alignment, capitals and position.",
        "Download the finished picture.",
      ],
    },
    about: {
      ru: [
        "Классический мем — белый Impact заглавными буквами с чёрной обводкой сверху и снизу кадра. Обводка делает текст читаемым на любом фоне, поэтому для подписей на пёстрых фото она пригодится и с другими шрифтами.",
        "Доступны шрифты, которые есть почти на любом устройстве: Arial, Helvetica, Verdana, Georgia, Times New Roman, Trebuchet MS, Courier New, Impact и Comic Sans MS. Если какого-то из них нет в системе — например, на Android, — браузер подставит похожий, и надпись будет выглядеть немного иначе.",
        "Режим карточки-цитаты создаёт картинку с текстом и автором на однотонном или градиентном фоне в размерах 1080×1080, 1080×1350 или 1080×1920 — под квадратный пост, вертикальный пост и сторис. Всё рисуется прямо в браузере.",
      ],
      en: [
        "The classic meme is white Impact in capitals with a black outline at the top and bottom of the frame. The outline keeps text readable on any background, so it’s useful for captions on busy photos in other fonts too.",
        "The fonts are ones found on almost every device: Arial, Helvetica, Verdana, Georgia, Times New Roman, Trebuchet MS, Courier New, Impact and Comic Sans MS. If one of them is missing from the system — on Android, for instance — the browser substitutes a similar font and the text looks slightly different.",
        "Quote card mode creates a picture with the text and its author on a solid or gradient background at 1080×1080, 1080×1350 or 1080×1920 — for a square post, a portrait post or a story. Everything is drawn right in your browser.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать мем с надписью сверху и снизу?",
          a: "Загрузите картинку, впишите верхнюю и нижнюю фразы и оставьте шрифт Impact с белым цветом, чёрной обводкой и заглавными буквами — это классический вид мема. Затем подберите размер текста и скачайте результат.",
        },
        {
          q: "Можно ли писать по-русски и по-казахски?",
          a: "Да, кириллица поддерживается. Специфические казахские буквы (ә, ғ, қ, ң, ө, ұ, ү, һ, і) есть не во всех шрифтах — надёжнее всего Arial и Times New Roman. Если в выбранном шрифте символа нет, браузер возьмёт его из другого шрифта, и буква может немного выделяться.",
        },
        {
          q: "Почему на телефоне шрифт выглядит иначе, чем на компьютере?",
          a: "Используются системные шрифты устройства. Если шрифта нет — Impact и Comic Sans MS, например, обычно отсутствуют на Android, — браузер подставит похожий. Для одинакового результата делайте картинку на том устройстве, где выбранный шрифт установлен.",
        },
        {
          q: "Какого размера получается карточка с цитатой?",
          a: "На выбор 1080×1080 (квадрат для ленты), 1080×1350 (вертикальный пост 4:5) и 1080×1920 (сторис и Reels 9:16). Фон может быть однотонным или градиентным, а под цитатой указывается автор.",
        },
      ],
      en: [
        {
          q: "How do I make a meme with top and bottom text?",
          a: "Open the picture, type the top and bottom lines and keep Impact in white with a black outline and capitals — the classic meme look. Then adjust the text size and download the result.",
        },
        {
          q: "Does it work with Cyrillic and other non-Latin text?",
          a: "Cyrillic works. Coverage of other scripts depends on the font: widely used fonts such as Arial and Times New Roman cover the most characters. If the chosen font lacks a character, the browser takes it from another font, so that letter may look slightly different.",
        },
        {
          q: "Why does the font look different on my phone?",
          a: "The tool uses the fonts installed on your device. If a font is missing — Impact and Comic Sans MS, for example, usually aren’t on Android — the browser substitutes a similar one. For consistent results, create the image on a device that has the chosen font.",
        },
        {
          q: "What size is a quote card?",
          a: "Choose 1080×1080 (square feed post), 1080×1350 (4:5 portrait post) or 1080×1920 (9:16 story or Reel). The background can be a solid colour or a gradient, and the author is shown under the quote.",
        },
      ],
    },
  },

  "to-base64": {
    name: { ru: "Картинка в Base64", en: "Image to Base64" },
    title: {
      ru: "Картинка в Base64 онлайн — data URI, CSS и HTML-код",
      en: "Image to Base64 Converter — Data URI, CSS, HTML",
    },
    h1: { ru: "Картинка в Base64", en: "Image to Base64" },
    description: {
      ru: "Перевод изображения в Base64: data URI, чистая строка, CSS background-image, тег <img> и Markdown. Формат определяется по байтам файла, объём +33 %.",
      en: "Convert an image to Base64: data URI, raw string, CSS background-image, HTML <img> tag or Markdown. The format is read from the file bytes; size +33%.",
    },
    lead: {
      ru: "Перетащите картинку — и получите её Base64-код в готовом для вставки виде: data URI, CSS, HTML или Markdown.",
      en: "Drop in an image and get its Base64 code ready to paste: data URI, CSS, HTML or Markdown.",
    },
    keywords: {
      ru: [
        "картинка в base64",
        "изображение в base64 онлайн",
        "конвертировать картинку в base64",
        "data uri из картинки",
        "base64 изображения для css",
        "png в base64",
        "jpg в base64",
      ],
      en: [
        "image to base64",
        "convert image to base64",
        "base64 image encoder",
        "png to base64",
        "image to data uri",
        "base64 css background",
      ],
    },
    howTo: {
      ru: [
        "Добавьте изображение: перетащите его, вставьте через Ctrl+V или выберите файл.",
        "Выберите вид результата: data URI, чистый Base64, CSS background-image, HTML-тег <img> или Markdown.",
        "Скопируйте строку в буфер обмена или скачайте её текстовым файлом.",
      ],
      en: [
        "Add an image: drag it in, paste with Ctrl+V or choose a file.",
        "Pick the output: data URI, raw Base64, CSS background-image, HTML <img> tag or Markdown.",
        "Copy the string to the clipboard or download it as a text file.",
      ],
    },
    about: {
      ru: [
        "Base64 записывает двоичный файл печатными символами: каждые 3 байта превращаются в 4 символа, поэтому строка примерно на 33 % больше самого файла. Встраивать так имеет смысл иконки и маленькие картинки до нескольких килобайт — большие изображения лучше подключать отдельным файлом, чтобы браузер их кэшировал.",
        "Тип в data URI (например, data:image/webp;base64,…) определяется по сигнатуре — первым байтам файла, а не по расширению или заявленному MIME-типу. Если PNG сохранён с расширением .jpg, в коде всё равно будет верный image/png.",
        "Длинные строки не выводятся в текстовое поле целиком, чтобы не подвешивать страницу: вы видите начало, а копирование и скачивание дают полную строку. Кодирование выполняется в браузере — файл никуда не отправляется.",
      ],
      en: [
        "Base64 writes a binary file as printable characters: every 3 bytes become 4 characters, so the string is about 33% larger than the file itself. It makes sense to embed icons and small images up to a few kilobytes this way — larger images are better served as separate files so the browser can cache them.",
        "The type in the data URI (for example data:image/webp;base64,…) is detected from the file signature — its first bytes — rather than the extension or declared MIME type. If a PNG was saved with a .jpg extension, the code will still say image/png.",
        "Long strings aren’t dumped into the text box in full, so the page doesn’t freeze: you see the beginning, while copy and download give you the complete string. Encoding happens in your browser — the file isn’t sent anywhere.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Насколько увеличивается размер картинки в Base64?",
          a: "Примерно на треть: 3 байта превращаются в 4 символа, плюс короткий префикс data URI. Картинка весом 30 КБ даст строку около 40 КБ. Инструмент показывает оба размера.",
        },
        {
          q: "Когда стоит встраивать картинку в Base64?",
          a: "Когда картинка маленькая и нужна сразу: иконки в CSS, небольшие изображения в одностраничном HTML, JSON для API. Для крупных фото это невыгодно — строка тяжелее файла и не кэшируется отдельно. В письмах тоже осторожно: многие почтовые клиенты, включая Gmail, не показывают картинки в data URI.",
        },
        {
          q: "Чем data URI отличается от чистого Base64?",
          a: "Data URI — это Base64 с префиксом, например data:image/png;base64,…: такую строку можно сразу подставить в src тега <img> или в url() в CSS. Чистый Base64 без префикса обычно нужен для API и JSON, где тип файла передаётся отдельно.",
        },
      ],
      en: [
        {
          q: "How much bigger does an image get in Base64?",
          a: "About a third: every 3 bytes become 4 characters, plus a short data URI prefix. A 30 KB image turns into a string of roughly 40 KB. The tool shows both sizes.",
        },
        {
          q: "When should I embed an image as Base64?",
          a: "When the image is small and needed immediately: icons in CSS, small images in a single-file HTML page, JSON for an API. For large photos it doesn’t pay off — the string is heavier than the file and isn’t cached separately. Be careful in emails too: many mail clients, including Gmail, don’t display data URI images.",
        },
        {
          q: "What’s the difference between a data URI and raw Base64?",
          a: "A data URI is Base64 with a prefix such as data:image/png;base64,…, so it can go straight into an <img> src or a CSS url(). Raw Base64 without the prefix is usually what APIs and JSON expect, with the file type passed separately.",
        },
      ],
    },
  },

  "base64-to-image": {
    name: { ru: "Base64 в картинку", en: "Base64 to image" },
    title: {
      ru: "Base64 в картинку онлайн — декодировать и скачать",
      en: "Base64 to Image Converter — Decode and Download",
    },
    h1: { ru: "Base64 в картинку", en: "Base64 to Image" },
    description: {
      ru: "Вставьте data URI или строку Base64 — картинка декодируется, формат определяется по байтам (PNG, JPEG, WebP, AVIF, SVG и др.), видны размеры и вес.",
      en: "Paste a data URI or raw Base64 string to decode the image: format detected from bytes (PNG, JPEG, WebP, AVIF, SVG…), dimensions, size and download.",
    },
    lead: {
      ru: "Вставьте строку Base64 или data URI — увидите картинку, её формат и размеры и сможете скачать файл с правильным расширением.",
      en: "Paste a Base64 string or data URI to see the image, its format and dimensions, and download it with the right extension.",
    },
    keywords: {
      ru: [
        "base64 в картинку",
        "base64 в изображение онлайн",
        "декодировать base64 картинку",
        "base64 в png",
        "base64 в jpg",
        "data uri в картинку",
        "преобразовать base64 в фото",
      ],
      en: [
        "base64 to image",
        "decode base64 image",
        "base64 to png",
        "base64 to jpg",
        "data uri to image",
        "base64 image viewer",
      ],
    },
    howTo: {
      ru: [
        "Вставьте строку в поле: подойдёт и полный data URI (data:image/png;base64,…), и чистый Base64 без префикса.",
        "Посмотрите превью, формат, ширину×высоту и вес файла.",
        "Скачайте картинку — расширение подставится по реальному формату.",
      ],
      en: [
        "Paste the string into the field: a full data URI (data:image/png;base64,…) or raw Base64 without the prefix both work.",
        "Check the preview, format, width×height and file size.",
        "Download the image — the extension matches the real format.",
      ],
    },
    about: {
      ru: [
        "Формат определяется по сигнатуре декодированных байтов: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, SVG, TIFF и HEIC. Если в data URI указан неверный тип — например, image/png у JPEG-файла, — скачанный файл всё равно получит правильное расширение.",
        "Если строка повреждена — обрезана при копировании, содержит лишние символы или вовсе не является изображением, — инструмент прямо скажет, в чём проблема. Частые причины: потерянный конец строки, кавычки по краям или экранирование из JSON (\\/ вместо /).",
        "Декодирование выполняется в браузере, строку никуда не нужно отправлять — это важно, если в ней скан документа или скриншот с личными данными.",
      ],
      en: [
        "The format is detected from the signature of the decoded bytes: PNG, JPEG, GIF, WebP, AVIF, BMP, ICO, SVG, TIFF and HEIC. If the data URI declares the wrong type — image/png for a JPEG file, say — the downloaded file still gets the correct extension.",
        "If the string is damaged — truncated when copying, containing stray characters or not an image at all — the tool tells you exactly what’s wrong. Common causes are a missing end of the string, quotes around it or JSON escaping (\\/ instead of /).",
        "Decoding happens in your browser, so the string never has to be sent anywhere — which matters if it holds a scanned document or a screenshot with personal data.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Нужен ли префикс data:image/…;base64?",
          a: "Нет. Инструмент принимает и полный data URI, и чистую строку Base64 — формат в любом случае определяется по содержимому, а не по префиксу.",
        },
        {
          q: "Почему появляется ошибка при декодировании?",
          a: "Чаще всего строка скопирована не полностью, в неё попали кавычки, пробелы из кода или экранирование вроде \\/. Бывает и так, что Base64 корректен, но внутри не картинка, а другой файл. Проверьте начало и конец строки и вставьте её заново.",
        },
        {
          q: "Как по строке понять, что в ней за картинка?",
          a: "По первым символам: iVBORw0KGgo — это PNG, /9j/ — JPEG, R0lGOD — GIF, UklGR — контейнер RIFF, в котором хранится WebP. Инструмент определяет формат автоматически и показывает его вместе с размерами.",
        },
      ],
      en: [
        {
          q: "Do I need the data:image/…;base64 prefix?",
          a: "No. The tool accepts both a full data URI and a raw Base64 string — the format is determined from the content either way, not from the prefix.",
        },
        {
          q: "Why do I get a decoding error?",
          a: "Most often the string wasn’t copied completely, or it picked up quotes, whitespace from code or escaping like \\/. Sometimes the Base64 is valid but contains a file that isn’t an image. Check the start and end of the string and paste it again.",
        },
        {
          q: "How can I tell what kind of image a string contains?",
          a: "From the first characters: iVBORw0KGgo is PNG, /9j/ is JPEG, R0lGOD is GIF, and UklGR is a RIFF container, which is how WebP is stored. The tool detects the format automatically and shows it along with the dimensions.",
        },
      ],
    },
  },

  exif: {
    name: { ru: "EXIF-данные", en: "EXIF viewer" },
    title: {
      ru: "Посмотреть и удалить EXIF-данные фото онлайн",
      en: "EXIF Viewer & Remover — See and Strip Photo Metadata",
    },
    h1: { ru: "Посмотреть и удалить EXIF-данные фото", en: "View and Remove EXIF Data from Photos" },
    description: {
      ru: "Все метаданные фото: камера, объектив, выдержка, дата, GPS, IPTC, XMP. Удаление EXIF из JPG, PNG и WebP без перекодирования, цветовой профиль сохраняется.",
      en: "See all photo metadata: camera, lens, exposure, date, GPS, IPTC, XMP. Strip EXIF from JPG, PNG and WebP without re-encoding; the colour profile stays.",
    },
    lead: {
      ru: "Узнайте, что хранится в фото — модель камеры, дата, координаты съёмки, — и удалите эти данные без потери качества.",
      en: "See what a photo carries — camera model, date, shooting location — and strip that data without losing quality.",
    },
    keywords: {
      ru: [
        "посмотреть exif онлайн",
        "удалить exif из фото",
        "метаданные фото онлайн",
        "удалить геолокацию с фото",
        "как узнать где сделано фото",
        "exif данные фото",
        "очистить метаданные фото",
        "узнать дату съемки фото",
      ],
      en: [
        "exif viewer",
        "remove exif data",
        "view photo metadata",
        "remove gps from photo",
        "strip metadata from image",
        "check photo location",
        "exif remover online",
      ],
    },
    howTo: {
      ru: [
        "Добавьте фото — одно или несколько.",
        "Просмотрите метаданные по группам: камера и объектив, параметры съёмки, дата, GPS, IPTC, XMP, цветовой профиль.",
        "Удалите метаданные — у JPG, PNG и WebP это происходит без перекодирования.",
        "Скачайте очищенные файлы по одному или кнопкой «Скачать всё (ZIP)».",
      ],
      en: [
        "Add a photo — or several.",
        "Browse the metadata by group: camera and lens, exposure settings, date, GPS, IPTC, XMP, colour profile.",
        "Remove the metadata — for JPG, PNG and WebP this happens without re-encoding.",
        "Download the cleaned files one by one or with “Download all (ZIP)”.",
      ],
    },
    about: {
      ru: [
        "В EXIF камера или телефон записывают модель устройства, объектив, выдержку, диафрагму, ISO, дату и время съёмки, а при включённой геолокации — точные координаты. Координаты показаны текстом, в десятичных градусах и в формате «градусы, минуты, секунды», без карты и без сетевых запросов: фото анализируется в браузере и никуда не отправляется.",
        "Очистка JPG выполняется без перекодирования: вырезаются блоки EXIF, XMP, IPTC и комментарии, а сжатые данные изображения копируются байт в байт. Цветовой профиль ICC остаётся, поэтому цвета не меняются. PNG и WebP очищаются так же — удаляются текстовые, EXIF- и XMP-блоки; файлы других форматов при очистке пересохраняются.",
        "Многие соцсети и мессенджеры стирают метаданные при загрузке, но при отправке фото файлом, по почте, в облако или на сайт объявлений они часто сохраняются. Перед публикацией снимков из дома или с детьми стоит проверить, нет ли в них GPS.",
      ],
      en: [
        "A camera or phone writes the device model, lens, shutter speed, aperture, ISO, date and time into EXIF — and, with location turned on, the exact coordinates. Coordinates are shown as text, in decimal degrees and in degrees-minutes-seconds, with no map and no network requests: the photo is analysed in your browser and never uploaded.",
        "JPG cleaning happens without re-encoding: EXIF, XMP and IPTC blocks and comments are cut out, while the compressed image data is copied byte for byte. The ICC colour profile stays, so colours don’t shift. PNG and WebP are cleaned the same way by removing text, EXIF and XMP chunks; files in other formats are re-saved.",
        "Many social networks and messengers wipe metadata on upload, but it often survives when a photo is sent as a file, by email, to cloud storage or to a classifieds site. Before posting pictures taken at home or of your children, it’s worth checking them for GPS data.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как узнать, где было сделано фото?",
          a: "Откройте фото и посмотрите группу GPS: там будут широта и долгота, которые можно скопировать в любое картографическое приложение. Если группы нет, геолокация при съёмке была выключена или данные уже удалены — например, мессенджером.",
        },
        {
          q: "Как удалить геолокацию с фото?",
          a: "Координаты хранятся в EXIF, поэтому достаточно удалить метаданные и скачать очищенный файл. Чтобы новые снимки сохранялись без GPS, отключите доступ камеры к геолокации в настройках телефона.",
        },
        {
          q: "Ухудшится ли качество после удаления EXIF?",
          a: "Для JPG, PNG и WebP — нет: удаляются только блоки метаданных, пиксели и сжатые данные не меняются, цветовой профиль сохраняется. Другие форматы при очистке пересохраняются.",
        },
        {
          q: "Почему в фото нет EXIF-данных?",
          a: "Их нет у скриншотов и у большинства картинок из мессенджеров и соцсетей — сервисы стирают метаданные при загрузке. Их также теряют файлы, которые были пересохранены в редакторе без метаданных или сконвертированы в другой формат.",
        },
        {
          q: "Что такое IPTC и XMP?",
          a: "IPTC — стандарт подписей для фотографий: автор, заголовок, описание, авторские права, ключевые слова; им пользуются фотоагентства и СМИ. XMP — формат метаданных на основе XML от Adobe, в нём хранятся те же сведения, рейтинги и история обработки в Lightroom или Photoshop.",
        },
      ],
      en: [
        {
          q: "How can I find out where a photo was taken?",
          a: "Open the photo and look at the GPS group: it lists the latitude and longitude, which you can copy into any map app. If there’s no GPS group, location was off when the photo was taken or the data has already been removed — by a messenger, for example.",
        },
        {
          q: "How do I remove the location from a photo?",
          a: "Coordinates are stored in EXIF, so removing the metadata and downloading the cleaned file is enough. To keep new photos free of GPS, turn off the camera’s location access in your phone settings.",
        },
        {
          q: "Does removing EXIF reduce quality?",
          a: "Not for JPG, PNG and WebP: only the metadata blocks are removed, the pixels and compressed data stay the same, and the colour profile is kept. Other formats are re-saved during cleaning.",
        },
        {
          q: "Why does my photo have no EXIF data?",
          a: "Screenshots don’t have it, nor do most images from messengers and social networks — those services strip metadata on upload. It’s also lost when a file is re-saved in an editor without metadata or converted to another format.",
        },
        {
          q: "What are IPTC and XMP?",
          a: "IPTC is a captioning standard for photos — author, headline, description, copyright, keywords — used by photo agencies and the media. XMP is Adobe’s XML-based metadata format that holds the same kind of information plus ratings and editing history from Lightroom or Photoshop.",
        },
      ],
    },
  },
};
