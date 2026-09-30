import type { CompressVariant } from "./types";

/*
 * Compression variant pages: /image/compress/<slug>.
 * Resolution estimates for target sizes use a rule of thumb: a typical JPEG
 * photo at quality ~75–80 takes roughly 0.15–0.25 bytes per pixel.
 */

export const COMPRESS_VARIANTS: CompressVariant[] = [
  /* ───────────── By format ───────────── */
  {
    slug: "jpg",
    format: "jpg",
    name: { ru: "Сжать JPG", en: "Compress JPG" },
    title: {
      ru: "Сжать JPG онлайн — уменьшить вес фото без потери вида",
      en: "Compress JPG Online — Smaller Photos, Same Look",
    },
    h1: { ru: "Сжать JPG", en: "Compress JPG Images" },
    description: {
      ru: "Сжатие JPG с качеством 1–100 (по умолчанию 82) или до нужного размера в КБ; режим MozJPEG обычно даёт ещё 5–15 %. Пакетно, ZIP, сравнение до/после.",
      en: "Compress JPG at quality 1–100 (default 82) or to a target size in KB; MozJPEG mode usually saves another 5–15%. Batch mode, ZIP, before/after slider.",
    },
    lead: {
      ru: "JPG пересжимается с подобранным качеством и становится заметно легче, а на глаз почти не меняется.",
      en: "Your JPGs are re-encoded at a well-chosen quality and get noticeably lighter while looking almost the same.",
    },
    keywords: {
      ru: [
        "сжать jpg",
        "сжать jpg онлайн",
        "уменьшить размер jpg",
        "сжать фото jpeg",
        "уменьшить вес фото",
        "сжатие jpg без потери качества",
        "mozjpeg онлайн",
      ],
      en: ["compress jpg", "compress jpeg online", "reduce jpg file size", "jpg compressor", "shrink photo file size", "mozjpeg online"],
    },
    paragraphs: {
      ru: [
        "Фото с телефона и фотоаппарата обычно сохранены с высоким качеством и весят несколько мегабайт. Пересжатие с качеством около 80 чаще всего уменьшает файл в 1,5–3 раза, а разницу видно только при сильном увеличении. Если сжатый файл не выходит меньше исходного, сохраняется оригинал — экономия не бывает отрицательной.",
        "Режим «Максимальное сжатие» кодирует через MozJPEG (WebAssembly): прогрессивный JPG с оптимизированными таблицами Хаффмана при том же качестве обычно на 5–15 % меньше, но кодируется медленнее. Ещё сильнее вес снижает ограничение ширины и высоты: снимок 4000×3000, уменьшенный до 2000×1500, весит примерно вчетверо меньше.",
        "EXIF по умолчанию удаляется вместе с GPS-координатами. Если нужны дата съёмки и параметры камеры, включите «Сохранить EXIF»: блок копируется в сжатый JPG, а ориентация сбрасывается на обычную.",
      ],
      en: [
        "Photos from phones and cameras are usually saved at high quality and weigh several megabytes. Re-encoding at about 80 typically makes the file 1.5–3 times smaller, and the difference shows only under heavy zoom. If the compressed file isn’t smaller than the original, the original is kept — savings never go negative.",
        "Maximum compression mode encodes with MozJPEG (WebAssembly): a progressive JPG with optimized Huffman tables that is usually 5–15% smaller at the same quality, though slower to produce. Limiting width and height cuts size even more: a 4000×3000 photo scaled to 2000×1500 weighs roughly a quarter as much.",
        "EXIF is removed by default, GPS coordinates included. If you need the capture date and camera settings, turn on Keep EXIF: the block is copied into the compressed JPG and the orientation is reset to normal.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какое качество JPG выбрать?",
          a: "Для сайтов и мессенджеров — 75–85, для печати и архива — 88–92. Ниже 60 появляются заметные квадраты 8×8 и ореолы у контрастных краёв. По умолчанию стоит 82 — хороший баланс веса и качества для большинства фото.",
        },
        {
          q: "Можно ли сжать JPG совсем без потерь?",
          a: "Пересжатие всегда немного теряет. Без потерь можно только убрать метаданные — это делает просмотрщик EXIF, не трогая пиксели, — но экономия там обычно невелика. Поэтому исходники лучше хранить, а сжимать копии.",
        },
        {
          q: "Почему после сжатия файл не уменьшился?",
          a: "Скорее всего, он уже был сжат с качеством ниже выбранного — например, картинка с сайта или из мессенджера. В таком случае инструмент возвращает оригинал. Уменьшите качество до 60–70 или ограничьте размер в пикселях.",
        },
      ],
      en: [
        {
          q: "What JPG quality should I choose?",
          a: "For websites and messengers 75–85, for printing and archiving 88–92. Below 60, visible 8×8 blocks and halos around contrasty edges appear. The default is 82, a good balance of size and quality for most photos.",
        },
        {
          q: "Can a JPG be compressed with no loss at all?",
          a: "Re-encoding always loses a little. The only lossless option is stripping metadata, which the EXIF viewer does without touching the pixels — but the savings there are usually small. Keep your originals and compress copies.",
        },
        {
          q: "Why didn’t the file get smaller?",
          a: "Most likely it was already compressed at a lower quality than you chose — an image from a website or a messenger, for example. In that case the tool returns the original. Lower the quality to 60–70 or limit the pixel dimensions.",
        },
      ],
    },
    facts: {
      ru: [
        ["Кодировщик", "браузерный; в режиме «Максимальное сжатие» — MozJPEG (WebAssembly)"],
        ["Качество по умолчанию", "82 из 100"],
        ["Выигрыш MozJPEG", "обычно на 5–15 % меньше при том же качестве"],
        ["Типичная экономия", "фото с телефона обычно уменьшаются в 1,5–3 раза"],
        ["Метаданные", "EXIF удаляется; по желанию копируется в JPG"],
        ["Если результат больше", "сохраняется исходный файл"],
      ],
      en: [
        ["Encoder", "browser built-in; MozJPEG (WebAssembly) in maximum compression mode"],
        ["Default quality", "82 out of 100"],
        ["MozJPEG gain", "usually 5–15% smaller at the same quality"],
        ["Typical savings", "phone photos usually shrink 1.5–3×"],
        ["Metadata", "EXIF removed; optionally copied into the JPG"],
        ["If the result is bigger", "the original file is kept"],
      ],
    },
  },
  {
    slug: "png",
    format: "png",
    name: { ru: "Сжать PNG", en: "Compress PNG" },
    title: {
      ru: "Сжать PNG онлайн — без потерь (OxiPNG) или палитрой",
      en: "Compress PNG Online — Lossless OxiPNG or Fewer Colors",
    },
    h1: { ru: "Сжать PNG", en: "Compress PNG Images" },
    description: {
      ru: "Два режима: OxiPNG без потерь (пиксели не меняются) и сокращение палитры от 256 до 16 цветов, как в TinyPNG. Прозрачность сохраняется, пакетно, ZIP.",
      en: "Two modes: lossless OxiPNG (pixels unchanged) and palette reduction from 256 down to 16 colors, like TinyPNG. Transparency is kept; batch mode and ZIP.",
    },
    lead: {
      ru: "PNG уменьшается либо без единого изменённого пикселя, либо — гораздо сильнее — за счёт сокращения количества цветов.",
      en: "Your PNG gets smaller either with not a single pixel changed or — much more — by reducing the number of colors.",
    },
    keywords: {
      ru: ["сжать png", "сжать png онлайн", "уменьшить размер png", "сжать png без потери качества", "оптимизация png", "аналог tinypng", "сжать картинку png"],
      en: ["compress png", "compress png online", "reduce png file size", "lossless png compression", "png optimizer", "tinypng alternative", "oxipng online"],
    },
    paragraphs: {
      ru: [
        "Без потерь работает OxiPNG: он заново упаковывает данные PNG с более удачными фильтрами и настройками Deflate, а если цветов мало — переводит файл в более компактный тип, например в палитровый. Картинка остаётся точной до пикселя; экономия — от нескольких процентов до заметной доли, смотря чем файл был сохранён.",
        "Сокращение цветов — сжатие с потерями, как у TinyPNG и pngquant: изображение перерисовывается палитрой от 256 до 16 цветов и затем упаковывается OxiPNG. Для иконок, логотипов, схем и скриншотов интерфейса вес, как правило, падает в разы почти без видимой разницы. На фото и плавных градиентах возможны полосы — дизеринга нет.",
        "Прозрачность сохраняется в обоих режимах; при сокращении цветов полупрозрачные края передаются приближённо. Для фотографий PNG вообще неудачный выбор — их выгоднее перевести в JPG или WebP.",
      ],
      en: [
        "Lossless mode uses OxiPNG: it repacks the PNG data with better filters and Deflate settings and, when there are few colors, switches the file to a more compact type such as a palette. The image stays pixel-exact; savings range from a few percent to a sizeable share depending on what saved the file originally.",
        "Color reduction is lossy compression like TinyPNG and pngquant: the image is redrawn with a palette of 256 down to 16 colors, then packed by OxiPNG. Icons, logos, diagrams and UI screenshots typically shrink several times with hardly any visible difference. Photos and smooth gradients may show banding, as there is no dithering.",
        "Transparency is kept in both modes; with color reduction, semi-transparent edges are approximated. PNG is a poor choice for photos anyway — converting them to JPG or WebP saves far more.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой режим сжатия PNG выбрать?",
          a: "Без потерь — когда важна точность: исходники для дальнейшей правки, пиксель-арт, скриншоты кода и документов. Сокращение цветов — для графики на сайт, иконок и схем: вес падает сильнее, а 64–256 цветов на простой картинке на глаз не отличить от оригинала.",
        },
        {
          q: "Почему фото в PNG почти не сжимается?",
          a: "Сжатие без потерь не может выбросить детали, а у фотографии их много: шум, текстуры, плавные переходы. OxiPNG выжмет лишь несколько процентов. Для фото переведите файл в JPG или WebP — он станет в разы легче.",
        },
        {
          q: "Останется ли прозрачный фон?",
          a: "Да. OxiPNG сохраняет альфа-канал без изменений, а при сокращении цветов прозрачные пиксели остаются прозрачными, полупрозрачные — сохраняются приближённо. Если на краях логотипа появилась ступенька, увеличьте число цветов.",
        },
      ],
      en: [
        {
          q: "Which PNG compression mode should I use?",
          a: "Lossless when exactness matters: source files for further editing, pixel art, screenshots of code and documents. Color reduction for web graphics, icons and diagrams: size drops much more, and 64–256 colors on a simple image are indistinguishable from the original.",
        },
        {
          q: "Why does a PNG photo barely compress?",
          a: "Lossless compression can’t discard detail, and photos are full of it: noise, textures, smooth gradients. OxiPNG will squeeze out only a few percent. Convert photos to JPG or WebP instead — they become several times lighter.",
        },
        {
          q: "Will the transparent background survive?",
          a: "Yes. OxiPNG keeps the alpha channel untouched, and with color reduction transparent pixels stay transparent while semi-transparent ones are approximated. If a logo’s edge looks stepped, increase the number of colors.",
        },
      ],
    },
    facts: {
      ru: [
        ["Без потерь", "OxiPNG — пиксели не меняются"],
        ["С потерями", "сокращение палитры от 256 до 16 цветов + OxiPNG"],
        ["Экономия без потерь", "обычно от нескольких процентов"],
        ["Экономия с палитрой", "как правило, в разы для графики и скриншотов"],
        ["Прозрачность", "сохраняется в обоих режимах"],
        ["Дизеринг", "нет — на градиентах возможны полосы"],
      ],
      en: [
        ["Lossless", "OxiPNG — pixels unchanged"],
        ["Lossy", "palette reduction from 256 to 16 colors + OxiPNG"],
        ["Lossless savings", "usually from a few percent"],
        ["Palette savings", "typically several times for graphics and screenshots"],
        ["Transparency", "kept in both modes"],
        ["Dithering", "none — gradients may show banding"],
      ],
    },
  },
  {
    slug: "webp",
    format: "webp",
    name: { ru: "Сжать WebP", en: "Compress WebP" },
    title: {
      ru: "Сжать WebP онлайн — меньше вес, прозрачность на месте",
      en: "Compress WebP Online — Smaller Files, Alpha Kept",
    },
    h1: { ru: "Сжать WebP", en: "Compress WebP Images" },
    description: {
      ru: "Сжатие WebP с качеством 1–100 (по умолчанию 80) или до размера в КБ. Прозрачность сохраняется, в Safari работает libwebp. JPG и PNG тоже можно сжать в WebP.",
      en: "Compress WebP at quality 1–100 (default 80) or to a target size in KB. Transparency is kept, Safari uses libwebp, and JPG or PNG can be saved as WebP too.",
    },
    lead: {
      ru: "WebP пересжимается с нужным качеством, а JPG и PNG можно сразу сохранить в WebP — формат, который открывают все современные браузеры.",
      en: "WebP files are re-encoded at the quality you need, and JPG or PNG can go straight to WebP, a format every modern browser opens.",
    },
    keywords: {
      ru: ["сжать webp", "сжать webp онлайн", "уменьшить размер webp", "сжать картинку в webp", "оптимизировать webp", "webp компрессор"],
      en: ["compress webp", "compress webp online", "reduce webp file size", "webp compressor", "compress images to webp", "optimize webp images"],
    },
    paragraphs: {
      ru: [
        "WebP с потерями основан на видеокодеке VP8 и, по данным Google, на 25–34 % легче JPG при сопоставимом качестве, при этом поддерживает прозрачность. Поэтому его выбирают для сайтов: фото, баннеры и картинки с прозрачным фоном хранятся в одном формате.",
        "В Chrome, Edge и Firefox кодирует встроенный кодировщик браузера. Safari WebP не кодирует — вместо него молча вернул бы PNG, — поэтому там подключается libwebp, скомпилированный в WebAssembly: результат тот же, только чуть медленнее.",
        "WebP, скачанный с сайта, уже сжат, и повторное сжатие снова теряет качество: для заметной экономии обычно приходится опускать его до 60–75. Если результат не меньше исходника, остаётся оригинал.",
      ],
      en: [
        "Lossy WebP is based on the VP8 video codec and, according to Google, is 25–34% smaller than JPG at comparable quality while also supporting transparency. That is why websites use it: photos, banners and cut-out graphics all fit one format.",
        "In Chrome, Edge and Firefox the browser’s built-in encoder does the work. Safari can’t encode WebP — it would silently return a PNG — so there libwebp compiled to WebAssembly takes over: same result, slightly slower.",
        "A WebP downloaded from a website is already compressed, and compressing it again loses quality again; noticeable savings usually need a quality of 60–75. If the result isn’t smaller, the original is kept.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какое качество WebP выбрать?",
          a: "По умолчанию стоит 80 — для сайтов это хороший баланс. Для крупных фото на главной можно 70–75, для графики с текстом лучше 85–90. Числа качества у разных кодеков не равны: WebP 80 и JPG 80 дают разный вес и разную картинку.",
        },
        {
          q: "Все ли сайты принимают WebP?",
          a: "Браузеры — да, а вот формы загрузки — не всегда: порталы госуслуг, банковские и кадровые сервисы, старые CMS часто принимают только JPG и PNG. Для таких мест сохраняйте в JPG, а WebP оставьте для своего сайта.",
        },
        {
          q: "Сохранится ли анимация в WebP?",
          a: "Нет. Из анимированного WebP берётся только первый кадр — инструмент об этом предупреждает, — а анимированный WebP на выходе не создаётся. Для анимации используйте GIF-инструменты.",
        },
      ],
      en: [
        {
          q: "What WebP quality should I choose?",
          a: "The default of 80 is a good balance for websites. Large hero photos can go to 70–75; graphics with text look better at 85–90. Quality numbers differ between codecs: WebP 80 and JPG 80 produce different sizes and different images.",
        },
        {
          q: "Do all sites accept WebP?",
          a: "Browsers do, upload forms don’t always: government portals, banking and HR services and old CMSs often accept only JPG and PNG. Save as JPG for those, and keep WebP for your own website.",
        },
        {
          q: "Will WebP animation be kept?",
          a: "No. Only the first frame of an animated WebP is used — the tool warns you — and animated WebP output isn’t produced. Use the GIF tools for animation.",
        },
      ],
    },
    facts: {
      ru: [
        ["Кодировщик", "браузерный (Chrome, Edge, Firefox) или libwebp в WebAssembly (Safari)"],
        ["Качество по умолчанию", "80 из 100"],
        ["Прозрачность", "сохраняется"],
        ["Сравнение с JPG", "по данным Google, на 25–34 % меньше при сопоставимом качестве"],
        ["Анимация", "используется только первый кадр"],
      ],
      en: [
        ["Encoder", "browser built-in (Chrome, Edge, Firefox) or libwebp in WebAssembly (Safari)"],
        ["Default quality", "80 out of 100"],
        ["Transparency", "kept"],
        ["Versus JPG", "25–34% smaller at comparable quality, according to Google"],
        ["Animation", "only the first frame is used"],
      ],
    },
  },
  {
    slug: "avif",
    format: "avif",
    name: { ru: "Сжать в AVIF", en: "Compress to AVIF" },
    title: {
      ru: "Сжать фото в AVIF онлайн — самое сильное сжатие",
      en: "Compress Images to AVIF Online — Maximum Savings",
    },
    h1: { ru: "Сжать фото в формат AVIF", en: "Compress Images to AVIF" },
    description: {
      ru: "Сжатие в AVIF через libavif (WebAssembly): качество 1–100, по умолчанию 55. Обычно легче JPG и WebP при том же виде, но кодируется медленнее. Пакетно, ZIP.",
      en: "Compress to AVIF with libavif (WebAssembly): quality 1–100, default 55. Usually lighter than JPG and WebP at the same look, but slower to encode. Batch, ZIP.",
    },
    lead: {
      ru: "JPG, PNG, WebP и другие изображения сохраняются в AVIF — формат с самым сильным сжатием из доступных здесь.",
      en: "JPG, PNG, WebP and other images are saved as AVIF, the most efficient format available here.",
    },
    keywords: {
      ru: ["сжать в avif", "конвертировать в avif онлайн", "avif сжатие", "сжать фото avif", "avif компрессор", "перевести картинки в avif"],
      en: ["compress to avif", "avif compressor online", "convert images to avif", "avif image compression", "reduce avif file size", "make avif images"],
    },
    paragraphs: {
      ru: [
        "AVIF — кадр видеокодека AV1 в контейнере HEIF. На фотографиях он нередко в 1,5–2 раза легче JPG при сопоставимом качестве и обычно обгоняет WebP, особенно на небе, коже и плавных градиентах, где у JPG проступают блоки.",
        "Большинство браузеров умеют показывать AVIF, но не сохранять его, поэтому кодирует libavif, скомпилированный в WebAssembly. Это медленно: большой снимок кодируется заметно дольше, чем в JPG, а для фото больше 8 Мп включается более быстрый режим кодировщика.",
        "Проверьте, принимает ли AVIF место, куда вы загружаете файл: Chrome 85+, Firefox 93+ и Safari 16.4+ его показывают, а многие формы и старые программы — нет. Для сайта удобно отдавать AVIF с запасным JPG через тег <picture>.",
      ],
      en: [
        "AVIF is an AV1 video frame in a HEIF container. On photos it is often 1.5–2 times smaller than JPG at comparable quality and usually beats WebP, especially on skies, skin and smooth gradients where JPG shows blocks.",
        "Most browsers can display AVIF but not save it, so libavif compiled to WebAssembly does the encoding. It is slow: a large photo takes noticeably longer than a JPG, and photos over 8 MP use a faster encoder preset.",
        "Check that the destination accepts AVIF: Chrome 85+, Firefox 93+ and Safari 16.4+ display it, but many upload forms and older programs don’t. On a website, serve AVIF with a JPG fallback via the <picture> element.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какое качество AVIF выбрать?",
          a: "Шкала у AVIF своя: 55 по умолчанию обычно выглядит сопоставимо с хорошим JPG при гораздо меньшем весе. Для фото на сайте часто хватает 40–50, для графики с мелким текстом лучше 60–70. Сравнивайте результат с оригиналом ползунком до/после.",
        },
        {
          q: "Где можно использовать AVIF?",
          a: "На своём сайте, в блоге, в веб-приложениях — везде, где картинку показывает современный браузер. Для загрузки на порталы, маркетплейсы, в почту и мессенджеры надёжнее JPG: AVIF там часто не принимают или не показывают превью.",
        },
        {
          q: "Сохраняет ли AVIF прозрачность?",
          a: "Да, AVIF поддерживает альфа-канал, так что PNG с прозрачным фоном можно перевести в AVIF без заливки. Обычно такой файл в разы легче исходного PNG.",
        },
      ],
      en: [
        {
          q: "What AVIF quality should I choose?",
          a: "AVIF has its own scale: the default 55 usually looks comparable to a good JPG at a much smaller size. Website photos often need only 40–50; graphics with small text look better at 60–70. Compare with the original using the before/after slider.",
        },
        {
          q: "Where can I use AVIF?",
          a: "On your own website, blog or web app — anywhere a modern browser displays the image. For portals, marketplaces, email and messengers JPG is safer: AVIF is often rejected there or shown without a preview.",
        },
        {
          q: "Does AVIF keep transparency?",
          a: "Yes, AVIF supports an alpha channel, so a PNG with a transparent background can become AVIF without a fill color. Such a file is usually several times lighter than the source PNG.",
        },
      ],
    },
    facts: {
      ru: [
        ["Кодировщик", "libavif в WebAssembly (или встроенный, если браузер умеет кодировать AVIF)"],
        ["Качество по умолчанию", "55 из 100"],
        ["Сравнение с JPG", "нередко в 1,5–2 раза меньше при сопоставимом качестве"],
        ["Скорость", "медленно; для фото больше 8 Мп — ускоренный режим"],
        ["Прозрачность", "сохраняется"],
        ["Показывают браузеры", "Chrome 85+, Firefox 93+, Safari 16.4+"],
      ],
      en: [
        ["Encoder", "libavif in WebAssembly (or built-in, if the browser can encode AVIF)"],
        ["Default quality", "55 out of 100"],
        ["Versus JPG", "often 1.5–2× smaller at comparable quality"],
        ["Speed", "slow; photos over 8 MP use a faster preset"],
        ["Transparency", "kept"],
        ["Displayed by", "Chrome 85+, Firefox 93+, Safari 16.4+"],
      ],
    },
  },

  /* ───────────── By target size ───────────── */
  {
    slug: "to-20kb",
    targetKb: 20,
    name: { ru: "До 20 КБ", en: "Under 20 KB" },
    title: {
      ru: "Сжать фото до 20 КБ онлайн — для анкет и заявлений",
      en: "Compress Image to 20 KB Online — For Forms and IDs",
    },
    h1: { ru: "Сжать фото до 20 КБ", en: "Compress an Image to 20 KB" },
    description: {
      ru: "Фото весом не больше 20 КБ (20 480 байт): подбор качества JPG, при необходимости — уменьшение размера. Обычно выходит около 400×300 px. Можно WebP и AVIF.",
      en: "Get a photo under 20 KB (20,480 bytes): JPG quality is searched automatically, then the image is scaled down if needed — usually to about 400×300 px.",
    },
    lead: {
      ru: "Фото автоматически ужимается так, чтобы файл весил не больше 20 КБ — ни байтом больше.",
      en: "Your photo is squeezed automatically so the file weighs no more than 20 KB — not a byte over.",
    },
    keywords: {
      ru: [
        "сжать фото до 20 кб",
        "уменьшить фото до 20 кб",
        "фото 20 кб онлайн",
        "сжать jpg до 20 кб",
        "фото на документы 20 кб",
        "как уменьшить вес фото до 20 кб",
      ],
      en: ["compress image to 20kb", "resize photo to 20kb", "reduce jpg to 20kb", "photo under 20kb", "20kb photo for form", "compress picture to 20 kb"],
    },
    paragraphs: {
      ru: [
        "20 КБ — один из самых жёстких лимитов: так часто ограничивают фото в электронных заявлениях, анкетах, пропусках и старых личных кабинетах. JPG с качеством около 75–80 вмещает в такой вес примерно 0,08–0,14 Мп — картинку порядка 400×300 px. Для лица на экране этого достаточно, для печати нет.",
        "Сначала подбирается качество: двоичный поиск пробует значения от 92 до 40 и оставляет самое высокое, при котором файл укладывается в лимит. Если даже при 40 фото больше 20 КБ — а с телефонным снимком на 12 Мп так будет почти всегда, — изображение пропорционально уменьшается шаг за шагом. Итоговый файл не превышает 20 480 байт.",
        "Чтобы в эти килобайты поместилось больше деталей лица, сначала обрежьте фото по плечи: лишний фон тоже расходует байты.",
      ],
      en: [
        "20 KB is one of the strictest limits, common for photos in online applications, questionnaires, access passes and older account portals. A JPG at quality 75–80 fits roughly 0.08–0.14 MP into that size — a picture of about 400×300 px. Enough for a face on screen, not enough for print.",
        "Quality is searched first: a binary search tries values from 92 down to 40 and keeps the highest one that fits the limit. If the photo is still over 20 KB at 40 — and a 12 MP phone shot almost always is — the image is scaled down proportionally, step by step. The final file never exceeds 20,480 bytes.",
        "To fit more facial detail into those kilobytes, crop the photo to head and shoulders first: background eats bytes too.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Хватит ли 20 КБ для фото на документы?",
          a: "Для электронной заявки — обычно да: если сервис просит файл до 20 КБ, он рассчитан на небольшое изображение. Если заданы ещё и размеры в пикселях, сначала приведите фото к ним инструментом изменения размера, а затем сожмите. Для печати фото на документы такого веса мало — там нужно исходное изображение высокого качества.",
        },
        {
          q: "Почему после сжатия фото стало таким маленьким в пикселях?",
          a: "Снимок с телефона весит 2–5 МБ, то есть в 100–250 раз больше лимита. Одним снижением качества такую разницу не покрыть, поэтому инструмент уменьшает разрешение — примерно до 0,1 Мп. Иначе в 20 КБ не уложиться.",
        },
      ],
      en: [
        {
          q: "Is 20 KB enough for an ID or document photo?",
          a: "For an online application, usually yes: a service that asks for a file under 20 KB expects a small image. If pixel dimensions are specified too, resize the photo to them first with the resize tool, then compress. For printed document photos 20 KB is far too little — use a high-quality original there.",
        },
        {
          q: "Why did the photo become so small in pixels?",
          a: "A phone photo weighs 2–5 MB, 100–250 times the limit. Lowering quality alone can’t cover that gap, so the tool reduces resolution to around 0.1 MP. There is no other way to fit into 20 KB.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "20 480 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,08–0,14 Мп (около 400×300 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Если не помещается", "пропорциональное уменьшение разрешения"],
      ],
      en: [
        ["Limit in bytes", "20,480 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.08–0.14 MP (about 400×300 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["If it still doesn’t fit", "proportional downscaling"],
      ],
    },
  },
  {
    slug: "to-30kb",
    targetKb: 30,
    name: { ru: "До 30 КБ", en: "Under 30 KB" },
    title: {
      ru: "Сжать фото до 30 КБ онлайн — JPG точно в лимит",
      en: "Compress Image to 30 KB — A JPG That Fits the Limit",
    },
    h1: { ru: "Сжать фото до 30 КБ", en: "Compress an Image to 30 KB" },
    description: {
      ru: "Уменьшить фото до 30 КБ (30 720 байт): качество JPG и при необходимости размер подбираются сами — обычно около 480×360 px. Пакетная обработка, без загрузки.",
      en: "Shrink a photo to 30 KB (30,720 bytes): JPG quality and, if needed, dimensions are chosen for you — typically around 480×360 px. Batch mode, no upload.",
    },
    lead: {
      ru: "Фото пересжимается с максимально возможным качеством, при котором файл весит не больше 30 КБ.",
      en: "The photo is re-encoded at the highest quality that still keeps the file at or under 30 KB.",
    },
    keywords: {
      ru: ["сжать фото до 30 кб", "уменьшить фото до 30 кб", "фото до 30 кб онлайн", "сжать картинку до 30 кб", "сжать jpg до 30 кб", "фото для анкеты 30 кб"],
      en: ["compress image to 30kb", "reduce photo to 30kb", "photo under 30kb", "compress jpg to 30kb", "resize image to 30 kb", "30kb image converter"],
    },
    paragraphs: {
      ru: [
        "Лимит около 30 КБ встречается в анкетах, на школьных и вузовских порталах, в формах конкурсов и заявок — там, где фото показывается мелко. JPG при качестве 75–80 вмещает в 30 КБ примерно 0,12–0,2 Мп, это картинка порядка 480×360 px.",
        "Инструмент не угадывает качество, а проверяет его: кодирует фото с качеством 92, затем с 40 и делит диапазон пополам, пока не найдёт наибольшее значение, проходящее по весу, — обычно за 6–8 попыток. Ниже 40 качество не опускается: дальше JPG распадается на квадраты, и выгоднее немного уменьшить разрешение.",
      ],
      en: [
        "A limit of about 30 KB shows up in questionnaires, school and university portals, contest and application forms — anywhere the photo is displayed small. A JPG at quality 75–80 fits roughly 0.12–0.2 MP into 30 KB, a picture of about 480×360 px.",
        "The tool doesn’t guess the quality, it tests it: it encodes at 92, then at 40, and halves the range until it finds the highest value that fits — usually in 6–8 tries. Quality never goes below 40: beyond that a JPG falls apart into blocks, and reducing resolution a little is the better trade.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Что делать, если нужны и 30 КБ, и точный размер в пикселях?",
          a: "Сначала задайте размер инструментом изменения размера — например, 480×640 px, если форма требует портретное фото, — и только потом сожмите до 30 КБ. Тогда подбирается одно лишь качество, и размер в пикселях сохраняется, если файл помещается при качестве не ниже 40.",
        },
        {
          q: "Почему файл весит 28 КБ, а не ровно 30?",
          a: "Качество подбирается целыми шагами, и вес меняется скачками. Выбирается наибольшее качество, при котором файл ещё не больше 30 КБ; следующий шаг уже превысил бы лимит. Несколько килобайт запаса — нормальный результат.",
        },
      ],
      en: [
        {
          q: "What if I need both 30 KB and exact pixel dimensions?",
          a: "Set the dimensions first with the resize tool — say 480×640 px if the form wants a portrait photo — and only then compress to 30 KB. Then only quality is searched, and the pixel size is kept as long as the file fits at a quality of 40 or higher.",
        },
        {
          q: "Why is the file 28 KB rather than exactly 30?",
          a: "Quality is searched in whole steps, so file size jumps. The tool picks the highest quality that keeps the file at or under 30 KB; the next step would already exceed the limit. A few kilobytes of headroom is a normal result.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "30 720 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,12–0,2 Мп (около 480×360 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40, обычно 6–8 попыток"],
        ["Если не помещается", "пропорциональное уменьшение разрешения"],
      ],
      en: [
        ["Limit in bytes", "30,720 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.12–0.2 MP (about 480×360 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40, usually 6–8 tries"],
        ["If it still doesn’t fit", "proportional downscaling"],
      ],
    },
  },
  {
    slug: "to-50kb",
    targetKb: 50,
    name: { ru: "До 50 КБ", en: "Under 50 KB" },
    title: {
      ru: "Сжать фото до 50 КБ онлайн — для аватара и форм",
      en: "Compress Image to 50 KB Online — Avatars and Forms",
    },
    h1: { ru: "Сжать фото до 50 КБ", en: "Compress an Image to 50 KB" },
    description: {
      ru: "Фото до 50 КБ (51 200 байт) для аватаров, профилей и форм: подбор качества JPG, затем при необходимости уменьшение — обычно около 640×480 px. WebP и AVIF.",
      en: "Get a photo under 50 KB (51,200 bytes) for avatars, profiles and forms: JPG quality search, then downscaling if needed — typically about 640×480 px.",
    },
    lead: {
      ru: "Снимок укладывается в 50 КБ при самом высоком качестве, какое позволяет лимит.",
      en: "Your picture fits into 50 KB at the highest quality the limit allows.",
    },
    keywords: {
      ru: ["сжать фото до 50 кб", "уменьшить фото до 50 кб", "фото 50 кб онлайн", "сжать jpg до 50 кб", "аватарка до 50 кб", "уменьшить вес картинки до 50 кб"],
      en: ["compress image to 50kb", "reduce image size to 50kb", "photo under 50kb", "compress jpg to 50kb", "50kb avatar", "resize photo to 50 kb"],
    },
    paragraphs: {
      ru: [
        "50 КБ — типичный потолок для аватаров, фото профиля, подписи на форуме и приложений к заявлениям. JPG при качестве 75–80 вмещает в этот вес примерно 0,2–0,34 Мп — около 640×480 px, чего хватает для чёткой картинки в карточке профиля или на половину экрана телефона.",
        "Порядок всегда один: сначала двоичный поиск качества между 92 и 40, и только если это не помогает — поэтапное уменьшение разрешения с сохранением пропорций. Фото с телефона обычно проходит оба этапа, а небольшие картинки из мессенджеров часто укладываются уже на первом.",
        "Для аватара выгодно сначала обрезать фото до квадрата: фон вокруг лица тоже занимает килобайты, а на круглой аватарке его всё равно не видно.",
      ],
      en: [
        "50 KB is a typical ceiling for avatars, profile photos, forum signatures and attachments to applications. A JPG at quality 75–80 fits roughly 0.2–0.34 MP into it — about 640×480 px, enough for a crisp profile card or half a phone screen.",
        "The order is always the same: a binary search for quality between 92 and 40 first, and only if that isn’t enough, step-by-step proportional downscaling. A phone photo usually goes through both stages; small images from messengers often fit at the first.",
        "For an avatar, crop to a square first: the background around the face costs kilobytes too, and a round avatar hides it anyway.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Подойдёт ли 50 КБ для аватарки?",
          a: "Да, с запасом. Аватары показываются в размере от 100 до 400 px, и квадратное фото 400×400 в JPG обычно укладывается в 50 КБ при высоком качестве, без уменьшения. Обрежьте снимок до квадрата — и лимит почти не повлияет на вид.",
        },
        {
          q: "Можно ли сжать до 50 КБ PNG с прозрачным фоном?",
          a: "В режиме целевого размера PNG не предлагается: он сжимает без потерь, и его вес нельзя подогнать качеством. Выберите WebP — он сохраняет прозрачность. В JPG прозрачные области будут залиты фоном, по умолчанию белым.",
        },
      ],
      en: [
        {
          q: "Is 50 KB enough for an avatar?",
          a: "Yes, with room to spare. Avatars are displayed at 100–400 px, and a 400×400 square JPG usually fits into 50 KB at high quality without downscaling. Crop to a square and the limit will barely affect the look.",
        },
        {
          q: "Can I get a transparent PNG under 50 KB?",
          a: "PNG isn’t offered in target-size mode: it is lossless, so its size can’t be tuned with quality. Choose WebP, which keeps transparency. In a JPG, transparent areas are filled with a background color, white by default.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "51 200 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,2–0,34 Мп (около 640×480 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP (с прозрачностью) или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Если не помещается", "пропорциональное уменьшение разрешения"],
      ],
      en: [
        ["Limit in bytes", "51,200 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.2–0.34 MP (about 640×480 px)"],
        ["Output format", "JPG by default; WebP (with transparency) or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["If it still doesn’t fit", "proportional downscaling"],
      ],
    },
  },
  {
    slug: "to-100kb",
    targetKb: 100,
    name: { ru: "До 100 КБ", en: "Under 100 KB" },
    title: {
      ru: "Сжать фото до 100 КБ онлайн — подбор качества JPG",
      en: "Compress Image to 100 KB Online — Auto JPG Quality",
    },
    h1: { ru: "Сжать фото до 100 КБ", en: "Compress an Image to 100 KB" },
    description: {
      ru: "Сжать фото до 100 КБ (102 400 байт): качество JPG подбирается само, крупное фото уменьшается примерно до 0,4–0,7 Мп. Пакетно, ZIP-архив, можно WebP и AVIF.",
      en: "Compress a photo to 100 KB (102,400 bytes): JPG quality is picked automatically and large photos are scaled to roughly 0.4–0.7 MP. Batch, ZIP, WebP, AVIF.",
    },
    lead: {
      ru: "Любое фото превращается в файл не больше 100 КБ с наилучшим качеством, которое позволяет лимит.",
      en: "Any photo becomes a file of 100 KB or less at the best quality the limit allows.",
    },
    keywords: {
      ru: [
        "сжать фото до 100 кб",
        "уменьшить фото до 100 кб",
        "сжать jpg до 100 кб",
        "фото до 100 кб онлайн",
        "как уменьшить размер фото до 100 кб",
        "сжать картинку до 100 кб",
      ],
      en: [
        "compress image to 100kb",
        "reduce photo size to 100kb",
        "compress jpg to 100kb",
        "photo under 100kb",
        "resize image to 100kb",
        "100kb image compressor",
      ],
    },
    paragraphs: {
      ru: [
        "100 КБ — один из самых частых лимитов: сайты вакансий, электронные заявления, личные кабинеты, а также порталы вроде Госуслуг и eGov.kz часто ограничивают размер загружаемого файла. JPG при качестве 75–80 вмещает в 100 КБ примерно 0,4–0,7 Мп — около 900×600 px, для экрана этого хватает с запасом.",
        "Сначала подбирается качество JPG — двоичным поиском между 92 и 40, за 6–8 пробных сжатий. Если фото и при 40 тяжелее лимита — а снимок с телефона на 12 Мп обычно тяжелее, — оно пошагово уменьшается с сохранением пропорций. Файл никогда не превышает 102 400 байт.",
        "По умолчанию результат — JPG. WebP и AVIF при том же лимите обычно сохраняют больше деталей, но их принимают не все сайты. PNG здесь недоступен: он сжимает без потерь, и подогнать его вес качеством нельзя.",
      ],
      en: [
        "100 KB is one of the most common limits: job sites, online applications, account portals and government services often cap the size of uploaded files. A JPG at quality 75–80 fits roughly 0.4–0.7 MP into 100 KB — about 900×600 px, plenty for a screen.",
        "JPG quality is searched first — a binary search between 92 and 40 taking 6–8 trial encodes. If the photo is still over the limit at 40 — and a 12 MP phone shot usually is — it is scaled down step by step, keeping proportions. The file never exceeds 102,400 bytes.",
        "The default output is JPG. WebP and AVIF usually keep more detail at the same limit, but not every site accepts them. PNG isn’t available here: it is lossless, and its size can’t be tuned with quality.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сжать фото до 100 КБ без потери качества?",
          a: "Совсем без потерь — никак: снимок с телефона весит в 20–50 раз больше. Но при 0,4–0,7 Мп и качестве 75+ разницу на экране почти не видно. Лучше всего результат, если сначала обрезать лишнее: тогда меньше пикселей уходит на фон и больше — на главное.",
        },
        {
          q: "Сайт пишет, что файл больше 100 КБ, хотя он укладывается. Почему?",
          a: "Здесь 1 КБ = 1024 байта, и лимит 100 КБ — это 102 400 байт. Некоторые сайты считают 1 КБ = 1000 байт, и для них предел — 100 000 байт. Задайте целевой размер 97 КБ (99 328 байт) — такой файл пройдёт при любом способе подсчёта.",
        },
      ],
      en: [
        {
          q: "How do I compress a photo to 100 KB without losing quality?",
          a: "Not entirely: a phone photo is 20–50 times larger than that. But at 0.4–0.7 MP and quality 75+ the difference is hard to see on screen. Crop away what you don’t need first, so fewer pixels go to the background and more to the subject.",
        },
        {
          q: "The site says my file is over 100 KB, but it fits. Why?",
          a: "Here 1 KB = 1,024 bytes, so 100 KB means 102,400 bytes. Some sites count 1 KB as 1,000 bytes, making their limit 100,000 bytes. Set the target to 97 KB (99,328 bytes) and the file passes either way.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "102 400 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,4–0,7 Мп (около 900×600 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Если сайт считает 1 КБ = 1000 байт", "задайте 97 КБ для запаса"],
      ],
      en: [
        ["Limit in bytes", "102,400 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.4–0.7 MP (about 900×600 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["If a site counts 1 KB = 1,000 bytes", "set 97 KB for headroom"],
      ],
    },
  },
  {
    slug: "to-150kb",
    targetKb: 150,
    name: { ru: "До 150 КБ", en: "Under 150 KB" },
    title: {
      ru: "Сжать фото до 150 КБ онлайн — для резюме и сайтов",
      en: "Compress Image to 150 KB — For Resumes and Websites",
    },
    h1: { ru: "Сжать фото до 150 КБ", en: "Compress an Image to 150 KB" },
    description: {
      ru: "Фото до 150 КБ (153 600 байт) для резюме, профилей и сайтов: качество JPG подбирается само, крупный снимок уменьшается примерно до 1024×768. Пакетно, ZIP.",
      en: "Photos under 150 KB (153,600 bytes) for resumes, profiles and websites: JPG quality is found automatically and large shots shrink to about 1024×768.",
    },
    lead: {
      ru: "Фото сжимается до 150 КБ и остаётся достаточно крупным и чётким для экрана компьютера.",
      en: "The photo is compressed to 150 KB and stays large and sharp enough for a computer screen.",
    },
    keywords: {
      ru: ["сжать фото до 150 кб", "уменьшить фото до 150 кб", "фото до 150 кб", "сжать jpg до 150 кб", "фото для резюме вес", "сжать картинку до 150 кб"],
      en: ["compress image to 150kb", "reduce photo to 150kb", "photo under 150kb", "compress jpg to 150kb", "resume photo file size", "150kb image"],
    },
    paragraphs: {
      ru: [
        "150 КБ встречается в требованиях к фото для резюме, личных кабинетов, каталогов и форумов. JPG при качестве 75–80 вмещает в этот вес примерно 0,6–1 Мп — порядка 1024×768 px, достаточно для чёткой фотографии на экране компьютера.",
        "Первым шагом ищется максимальное качество от 92 до 40, при котором файл не больше 153 600 байт. Вторым, если без этого не обойтись, фото уменьшается: инструмент смотрит, во сколько раз файл тяжелее лимита, и сокращает стороны примерно на корень из этого отношения, а затем снова подбирает качество.",
        "Сжимать можно сразу пачку файлов: каждый подгоняется под 150 КБ отдельно, а результат скачивается ZIP-архивом.",
      ],
      en: [
        "150 KB appears in photo requirements for resumes, account portals, catalogs and forums. A JPG at quality 75–80 fits roughly 0.6–1 MP into that size — about 1024×768 px, enough for a sharp photo on a computer screen.",
        "Step one finds the highest quality between 92 and 40 that keeps the file at or under 153,600 bytes. Step two, only if necessary, scales the photo down: the tool checks how many times the file exceeds the limit, shrinks the sides by roughly the square root of that ratio and searches quality again.",
        "You can compress a whole batch at once: each file is fitted under 150 KB individually, and the results download as a ZIP.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Подойдёт ли 150 КБ для фото в резюме?",
          a: "Да. В резюме фото показывается небольшим, и 0,6–1 Мп с запасом хватает даже для печати на листе A4 в размере 3×4 см. Обрежьте снимок до портретного формата 3:4 или 4:5 — ровный однотонный фон к тому же сжимается лучше пёстрого.",
        },
        {
          q: "Что будет, если фото уже меньше 150 КБ?",
          a: "Оно кодируется с верхним значением качества 92 и укладывается в лимит без уменьшения. Если исходный JPG того же размера в пикселях при этом легче результата, возвращается оригинал — файл не станет тяжелее.",
        },
      ],
      en: [
        {
          q: "Is 150 KB enough for a resume photo?",
          a: "Yes. A resume shows the photo small, and 0.6–1 MP is more than enough even for a 3×4 cm print on an A4 page. Crop to a 3:4 or 4:5 portrait; a plain, even background also compresses better than a busy one.",
        },
        {
          q: "What happens if the photo is already under 150 KB?",
          a: "It is encoded at the top quality of 92 and fits without downscaling. If the original JPG of the same pixel size is lighter than that result, the original is returned — the file never gets heavier.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "153 600 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,6–1 Мп (около 1024×768 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Пакетный режим", "каждый файл подгоняется отдельно, ZIP-архив"],
      ],
      en: [
        ["Limit in bytes", "153,600 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.6–1 MP (about 1024×768 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["Batch mode", "each file fitted individually, ZIP download"],
      ],
    },
  },
  {
    slug: "to-200kb",
    targetKb: 200,
    name: { ru: "До 200 КБ", en: "Under 200 KB" },
    title: {
      ru: "Сжать фото до 200 КБ онлайн — JPG, WebP или AVIF",
      en: "Compress Image to 200 KB Online — JPG, WebP or AVIF",
    },
    h1: { ru: "Сжать фото до 200 КБ", en: "Compress an Image to 200 KB" },
    description: {
      ru: "Фото до 200 КБ (204 800 байт): автоматический подбор качества и размера, обычно около 1200×900 px в JPG. В WebP и AVIF при том же весе больше деталей.",
      en: "Photos under 200 KB (204,800 bytes): quality and size are chosen automatically, usually about 1200×900 px as JPG. WebP and AVIF keep more detail per byte.",
    },
    lead: {
      ru: "Фото сжимается до 200 КБ в выбранном формате — JPG, WebP или AVIF — с наибольшим качеством, которое помещается в лимит.",
      en: "The photo is compressed to 200 KB in the format you pick — JPG, WebP or AVIF — at the highest quality that fits.",
    },
    keywords: {
      ru: [
        "сжать фото до 200 кб",
        "уменьшить фото до 200 кб",
        "фото до 200 кб онлайн",
        "сжать jpg до 200 кб",
        "сжать картинку до 200 кб",
        "уменьшить вес фото до 200 кб",
      ],
      en: [
        "compress image to 200kb",
        "reduce photo to 200kb",
        "photo under 200kb",
        "compress jpg to 200kb",
        "200kb image compressor",
        "shrink picture to 200 kb",
      ],
    },
    paragraphs: {
      ru: [
        "200 КБ — частый лимит для вложений в формах обратной связи, отзывов с фото, объявлений и загрузок на порталы услуг. JPG при качестве 75–80 вмещает в этот вес примерно 0,8–1,4 Мп — около 1200×900 px, достаточно, чтобы рассмотреть фото на большей части экрана ноутбука.",
        "Формат выбирается перед сжатием. JPG открывается везде; WebP при том же весе обычно даёт более чистую картинку и сохраняет прозрачность; AVIF сжимает ещё лучше, но кодируется медленно, а в режиме подбора фото кодируется несколько раз подряд.",
        "Если даже при качестве 40 файл тяжелее лимита, фото уменьшается ступенями, каждый раз с новым подбором качества, — пока файл не станет не больше 204 800 байт.",
      ],
      en: [
        "200 KB is a common limit for attachments in feedback forms, photo reviews, classified ads and service portal uploads. A JPG at quality 75–80 fits roughly 0.8–1.4 MP into that size — about 1200×900 px, enough to view the photo across most of a laptop screen.",
        "You choose the format before compressing. JPG opens everywhere; WebP usually gives a cleaner picture at the same size and keeps transparency; AVIF compresses better still but encodes slowly, and target-size mode encodes the photo several times in a row.",
        "If the file is still over the limit at quality 40, the photo is scaled down in steps, with a fresh quality search each time, until it is 204,800 bytes or less.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой формат выбрать: JPG, WebP или AVIF?",
          a: "Если файл загружается в чужую форму — JPG: его принимают везде. Для своего сайта — WebP или AVIF: при тех же 200 КБ они позволяют оставить фото крупнее или чище. AVIF выигрывает сильнее всего, но показывают его только современные браузеры.",
        },
        {
          q: "Почему подбор размера в AVIF идёт дольше, чем в JPG?",
          a: "Чтобы найти качество, фото кодируется около 6–8 раз, а если нужно уменьшение — ещё столько же на каждом шаге. Кодировщик AVIF в WebAssembly в разы медленнее JPG, и это умножается на число попыток. За ходом работы следит индикатор, процесс можно отменить.",
        },
      ],
      en: [
        {
          q: "Which format should I pick: JPG, WebP or AVIF?",
          a: "If the file goes into someone else’s form, JPG — it is accepted everywhere. For your own website, WebP or AVIF: at the same 200 KB they let the photo stay larger or cleaner. AVIF gains the most, but only modern browsers display it.",
        },
        {
          q: "Why is target-size mode slower with AVIF than with JPG?",
          a: "Finding the quality takes about 6–8 encodes, plus as many again for every downscaling step. The WebAssembly AVIF encoder is several times slower than JPG, and that multiplies by the number of tries. A progress bar shows the work, and you can cancel at any time.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "204 800 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 0,8–1,4 Мп (около 1200×900 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Если не помещается", "уменьшение ступенями с новым подбором качества"],
      ],
      en: [
        ["Limit in bytes", "204,800 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 0.8–1.4 MP (about 1200×900 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["If it still doesn’t fit", "stepwise downscaling with a new quality search"],
      ],
    },
  },
  {
    slug: "to-300kb",
    targetKb: 300,
    name: { ru: "До 300 КБ", en: "Under 300 KB" },
    title: {
      ru: "Сжать фото до 300 КБ онлайн — для сайта и почты",
      en: "Compress Image to 300 KB Online — For Web and Email",
    },
    h1: { ru: "Сжать фото до 300 КБ", en: "Compress an Image to 300 KB" },
    description: {
      ru: "Фото до 300 КБ (307 200 байт) для сайтов, блогов и почты: JPG с подобранным качеством, крупные снимки уменьшаются примерно до 1,2–2 Мп. Пакетно, ZIP.",
      en: "Photos under 300 KB (307,200 bytes) for websites, blogs and email: JPG with auto-picked quality; big shots are scaled to about 1.2–2 MP. Batch mode and ZIP.",
    },
    lead: {
      ru: "Фото ужимается до 300 КБ и сохраняет размер, достаточный для иллюстрации в статье или письме.",
      en: "Your photo is squeezed to 300 KB while staying large enough to illustrate an article or an email.",
    },
    keywords: {
      ru: ["сжать фото до 300 кб", "уменьшить фото до 300 кб", "фото до 300 кб", "сжать jpg до 300 кб", "сжать фото для сайта", "уменьшить картинку до 300 кб"],
      en: ["compress image to 300kb", "reduce photo to 300kb", "photo under 300kb", "compress jpg to 300kb", "compress image for website", "300kb photo"],
    },
    paragraphs: {
      ru: [
        "300 КБ — удобный вес для иллюстраций в статьях, карточек товаров, фото в письмах и на форумах. JPG при качестве 75–80 вмещает в него примерно 1,2–2 Мп — около 1440×1080 px: этого хватает на всю ширину колонки текста даже на экранах с высокой плотностью пикселей.",
        "Для сайта лимит — ещё и вопрос скорости: фото в 300 КБ вместо 3 МБ передаётся примерно в 10 раз быстрее. Если на странице много снимков, стоит взять 150–200 КБ или перейти на WebP.",
        "Скриншоты и картинки с мелким текстом плохо переносят JPG: вокруг букв появляется «грязь». PNG в режиме подбора размера не предлагается, поэтому для них лучше режим качества с сокращением цветов PNG.",
      ],
      en: [
        "300 KB is a comfortable size for article illustrations, product cards, photos in emails and on forums. A JPG at quality 75–80 fits roughly 1.2–2 MP into it — about 1440×1080 px, enough for the full width of a text column even on high-density screens.",
        "On a website the limit is also about speed: a 300 KB photo instead of 3 MB transfers about 10 times faster. If a page has many photos, consider 150–200 KB or switch to WebP.",
        "Screenshots and images with small text don’t take JPG well: letters get smudgy artifacts around them. PNG isn’t offered in target-size mode, so for those use quality mode with PNG color reduction.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сжать скриншот до 300 КБ?",
          a: "Для скриншота интерфейса или документа лучше подходит PNG с сокращением цветов в обычном режиме сжатия: 128–256 цветов сохраняют текст чётким, а вес обычно падает в разы. Если нужен именно JPG до 300 КБ, текст останется читаемым, но с артефактами вокруг букв.",
        },
        {
          q: "Хватит ли 300 КБ для фото на весь экран?",
          a: "Для Full HD (1920×1080, около 2 Мп) — на границе: JPG уложится, но с качеством пониже 75–80. WebP и AVIF при том же весе справляются заметно лучше. Для экранов 4K 300 КБ мало, там нужен вес от 1 МБ.",
        },
      ],
      en: [
        {
          q: "How do I compress a screenshot to 300 KB?",
          a: "For a UI or document screenshot, PNG with color reduction in the regular compression mode works better: 128–256 colors keep text crisp, and the size usually drops several times. If you specifically need a JPG under 300 KB, text stays readable but with artifacts around the letters.",
        },
        {
          q: "Is 300 KB enough for a full-screen photo?",
          a: "For Full HD (1920×1080, about 2 MP) it is borderline: a JPG will fit, but below quality 75–80. WebP and AVIF do noticeably better at the same size. For 4K screens 300 KB is too little; think 1 MB or more.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "307 200 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 1,2–2 Мп (около 1440×1080 px)"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
        ["Скриншоты с текстом", "лучше PNG с сокращением цветов в режиме качества"],
      ],
      en: [
        ["Limit in bytes", "307,200 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 1.2–2 MP (about 1440×1080 px)"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
        ["Screenshots with text", "better as PNG with color reduction in quality mode"],
      ],
    },
  },
  {
    slug: "to-500kb",
    targetKb: 500,
    name: { ru: "До 500 КБ", en: "Under 500 KB" },
    title: {
      ru: "Сжать фото до 500 КБ онлайн — почти без потери вида",
      en: "Compress Image to 500 KB Online — Near-Original Look",
    },
    h1: { ru: "Сжать фото до 500 КБ", en: "Compress an Image to 500 KB" },
    description: {
      ru: "Фото до 500 КБ (512 000 байт): около 2–3,4 Мп в JPG при качестве 75–80, этого хватает для печати 10×15 см. Автоподбор качества и размера, пакетно, ZIP.",
      en: "Photos under 500 KB (512,000 bytes): about 2–3.4 MP as a JPG at quality 75–80, enough for a 10×15 cm print. Automatic quality and size, batch and ZIP.",
    },
    lead: {
      ru: "Снимок уменьшается до 500 КБ, но остаётся достаточно крупным для полноэкранного просмотра и небольшой печати.",
      en: "Your photo drops to 500 KB yet stays large enough for full-screen viewing and small prints.",
    },
    keywords: {
      ru: [
        "сжать фото до 500 кб",
        "уменьшить фото до 500 кб",
        "фото до 500 кб онлайн",
        "сжать jpg до 500 кб",
        "уменьшить вес фото до 500 кб",
        "сжать фото для загрузки",
      ],
      en: [
        "compress image to 500kb",
        "reduce photo to 500kb",
        "photo under 500kb",
        "compress jpg to 500kb",
        "500kb image compressor",
        "shrink photo to 500 kb",
      ],
    },
    paragraphs: {
      ru: [
        "Лимит в 500 КБ часто ставят на загрузку фото в объявления, заявки, отчёты и личные кабинеты. JPG при качестве 75–80 вмещает в такой вес примерно 2–3,4 Мп — около 1920×1440 px. На экране такое фото почти не отличить от оригинала.",
        "Снимку с телефона на 12 Мп одного снижения качества обычно не хватает — он весит в несколько раз больше, — поэтому разрешение тоже уменьшается, примерно вдвое по каждой стороне. Порядок всегда одинаков: сначала наибольшее подходящее качество от 92 до 40, затем, если нужно, пропорциональное уменьшение.",
        "Если важно сохранить как можно больше пикселей, выберите WebP или AVIF — при том же лимите они обычно позволяют оставить фото крупнее.",
      ],
      en: [
        "A 500 KB limit is common for photo uploads to classifieds, applications, reports and account portals. A JPG at quality 75–80 fits roughly 2–3.4 MP into that size — about 1920×1440 px. On screen it is hard to tell from the original.",
        "For a 12 MP phone shot, lowering quality alone is usually not enough — the file is several times too big — so resolution is reduced too, roughly by half on each side. The order never changes: first the highest fitting quality between 92 and 40, then proportional downscaling if needed.",
        "If keeping as many pixels as possible matters, choose WebP or AVIF — at the same limit they usually let the photo stay larger.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли печатать фото после сжатия до 500 КБ?",
          a: "Небольшого формата — да. 1920×1440 px при 300 dpi — это примерно 16×12 см, так что снимок 10×15 см печатается с полной чёткостью. Для A4 и больших форматов лучше исходник или хотя бы лимит 2 МБ.",
        },
        {
          q: "Можно ли сжать до 500 КБ сразу много фото?",
          a: "Да. Добавьте хоть целую папку: каждый файл подгоняется под лимит отдельно, у каждого свой статус и размер до/после, а результат скачивается одним ZIP-архивом. Снимки на 20–50 Мп обрабатываются в фоновом потоке, вкладка не зависает.",
        },
      ],
      en: [
        {
          q: "Can I print a photo after compressing it to 500 KB?",
          a: "At small sizes, yes. 1920×1440 px at 300 dpi is about 16×12 cm, so a 10×15 cm (4×6 in) print comes out fully sharp. For A4 and larger, use the original or at least a 2 MB limit.",
        },
        {
          q: "Can I compress many photos to 500 KB at once?",
          a: "Yes. Drop in a whole folder: each file is fitted to the limit separately with its own status and before/after size, and the results download as one ZIP. 20–50 MP photos are processed in a background worker, so the tab doesn’t freeze.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "512 000 байт (1 КБ = 1024 байта)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 2–3,4 Мп (около 1920×1440 px)"],
        ["Печать при 300 dpi", "около 16×12 см — хватает на фото 10×15"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40, затем уменьшение"],
      ],
      en: [
        ["Limit in bytes", "512,000 bytes (1 KB = 1,024 bytes)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 2–3.4 MP (about 1920×1440 px)"],
        ["Print at 300 dpi", "about 16×12 cm — enough for a 10×15 cm photo"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40, then downscaling"],
      ],
    },
  },
  {
    slug: "to-1mb",
    targetKb: 1024,
    name: { ru: "До 1 МБ", en: "Under 1 MB" },
    title: {
      ru: "Сжать фото до 1 МБ онлайн — лёгкие снимки с телефона",
      en: "Compress Image to 1 MB Online — Lighter Phone Photos",
    },
    h1: { ru: "Сжать фото до 1 МБ", en: "Compress an Image to 1 MB" },
    description: {
      ru: "Фото до 1 МБ (1 048 576 байт): снимки с телефона на 3–5 МБ сжимаются с сохранением примерно 4–7 Мп. Подбор качества JPG, WebP или AVIF, пакетно, ZIP.",
      en: "Photos under 1 MB (1,048,576 bytes): 3–5 MB phone shots shrink while keeping roughly 4–7 MP. Auto quality for JPG, WebP or AVIF, batch mode and ZIP.",
    },
    lead: {
      ru: "Тяжёлые фото с телефона и фотоаппарата укладываются в 1 МБ и сохраняют высокое разрешение.",
      en: "Heavy photos from phones and cameras fit into 1 MB and keep a high resolution.",
    },
    keywords: {
      ru: [
        "сжать фото до 1 мб",
        "уменьшить фото до 1 мб",
        "фото до 1 мб онлайн",
        "сжать jpg до 1 мб",
        "уменьшить размер фото до 1 мегабайта",
        "сжать фото с телефона",
      ],
      en: ["compress image to 1mb", "reduce photo to 1mb", "photo under 1mb", "compress jpg to 1mb", "shrink phone photo size", "1mb image compressor"],
    },
    paragraphs: {
      ru: [
        "1 МБ — популярный лимит у форм загрузки документов, сайтов объявлений, CMS и сервисов с ограничением на вложения. JPG при качестве 75–80 вмещает в этот вес примерно 4,2–7 Мп — около 2800×2100 px, так что фото остаётся крупным и годится даже для небольшой печати.",
        "Здесь 1 МБ = 1024 КБ = 1 048 576 байт. Снимку на 12 Мп для этого, как правило, нужно заметно снизить качество, а иногда и немного уменьшить размер; фото с камер на 48–50 Мп уменьшаются сильнее.",
        "Обработка идёт в фоновом потоке с индикатором прогресса и кнопкой отмены, поэтому даже пачка больших фото не подвешивает вкладку, а сами файлы не покидают устройство.",
      ],
      en: [
        "1 MB is a popular limit in document upload forms, classifieds, CMSs and services that cap attachments. A JPG at quality 75–80 fits roughly 4.2–7 MP into it — about 2800×2100 px, so the photo stays large and still works for small prints.",
        "Here 1 MB = 1,024 KB = 1,048,576 bytes. A 12 MP shot typically needs a noticeable quality reduction and sometimes a slight downscale; photos from 48–50 MP cameras are scaled down more.",
        "Processing runs in a background worker with a progress bar and a Cancel button, so even a batch of large photos doesn’t freeze the tab, and the files never leave your device.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему фото с телефона весит 3–5 МБ?",
          a: "Смартфоны снимают на 12–50 Мп и сохраняют JPG с высоким качеством, с запасом для редактирования: на пиксель уходит заметно больше байтов, чем нужно для просмотра на экране. К этому добавляются EXIF и превью. Для отправки и публикации такой запас не нужен.",
        },
        {
          q: "Будет ли заметна разница после сжатия до 1 МБ?",
          a: "При просмотре на экране — почти никогда: 4–7 Мп больше, чем пикселей у монитора 2560×1440. При увеличении до 100 % можно заметить небольшую мягкость в мелких текстурах — листве, волосах, траве. Для архива оригиналов лучше оставить исходники.",
        },
      ],
      en: [
        {
          q: "Why does a phone photo weigh 3–5 MB?",
          a: "Smartphones shoot at 12–50 MP and save high-quality JPGs with headroom for editing, spending far more bytes per pixel than on-screen viewing needs. EXIF data and an embedded preview add to that. For sending and publishing, the headroom is unnecessary.",
        },
        {
          q: "Will the difference be visible after compressing to 1 MB?",
          a: "On screen, almost never: 4–7 MP is more pixels than a 2560×1440 monitor has. At 100% zoom you may notice slight softness in fine textures — foliage, hair, grass. For your archive, keep the originals.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "1 048 576 байт (1 МБ = 1024 КБ)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 4,2–7 Мп (около 2800×2100 px)"],
        ["Фото с телефона на 12 Мп", "обычно укладывается за счёт качества, иногда с лёгким уменьшением"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["Подбор качества", "двоичный поиск от 92 до 40"],
      ],
      en: [
        ["Limit in bytes", "1,048,576 bytes (1 MB = 1,024 KB)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 4.2–7 MP (about 2800×2100 px)"],
        ["12 MP phone photo", "usually fits through quality alone, sometimes with a slight downscale"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["Quality search", "binary search from 92 down to 40"],
      ],
    },
  },
  {
    slug: "to-2mb",
    targetKb: 2048,
    name: { ru: "До 2 МБ", en: "Under 2 MB" },
    title: {
      ru: "Сжать фото до 2 МБ онлайн — без уменьшения разрешения",
      en: "Compress Image to 2 MB Online — Keep High Resolution",
    },
    h1: { ru: "Сжать фото до 2 МБ", en: "Compress an Image to 2 MB" },
    description: {
      ru: "Фото до 2 МБ (2 097 152 байт): при качестве 75–80 это примерно 8–14 Мп, так что снимок на 12 Мп обычно сохраняет полный размер. JPG, WebP, AVIF, пакетно.",
      en: "Photos under 2 MB (2,097,152 bytes): at quality 75–80 that is roughly 8–14 MP, so a 12 MP shot usually keeps its full size. JPG, WebP, AVIF, batch mode.",
    },
    lead: {
      ru: "Фото укладывается в 2 МБ, и чаще всего без уменьшения разрешения — только за счёт подбора качества.",
      en: "Your photo fits into 2 MB, most often without any downscaling — through quality alone.",
    },
    keywords: {
      ru: [
        "сжать фото до 2 мб",
        "уменьшить фото до 2 мб",
        "фото до 2 мб онлайн",
        "сжать jpg до 2 мб",
        "уменьшить размер фото до 2 мегабайт",
        "сжать фото для загрузки на сайт",
      ],
      en: ["compress image to 2mb", "reduce photo to 2mb", "photo under 2mb", "compress jpg to 2mb", "2mb image compressor", "shrink image under 2 mb"],
    },
    paragraphs: {
      ru: [
        "2 МБ — частое ограничение для вложений на порталах, в CRM, онлайн-школах и формах заявок, где фото документа или снимок должны оставаться чёткими. JPG при качестве 75–80 вмещает в этот вес примерно 8,4–14 Мп — около 4000×3000 px, то есть обычную 12-мегапиксельную фотографию с телефона.",
        "Поиск качества начинается с 92: если фото помещается уже при нём, оно так и сохраняется, иначе двоичный поиск находит наибольшее подходящее значение не ниже 40. Уменьшать размер для 2 МБ приходится в основном снимкам с камер на 48–50 Мп и панорамам.",
        "Для фото документов, где важен мелкий текст, 2 МБ — хороший запас: качество остаётся высоким, и буквы не обрастают артефактами.",
      ],
      en: [
        "2 MB is a frequent attachment limit on portals, CRMs, online schools and application forms where a document photo or picture must stay sharp. A JPG at quality 75–80 fits roughly 8.4–14 MP into it — about 4000×3000 px, an ordinary 12-megapixel phone photo.",
        "The quality search starts at 92: if the photo already fits there, it is saved that way; otherwise the binary search finds the highest fitting value, never below 40. At 2 MB, downscaling is mostly needed for shots from 48–50 MP cameras and panoramas.",
        "For document photos with small print, 2 MB leaves a comfortable margin: quality stays high and letters don’t pick up artifacts.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сохранятся ли дата съёмки и геометка?",
          a: "По умолчанию нет: при сжатии EXIF удаляется вместе с GPS-координатами. Для JPG можно включить «Сохранить EXIF» — блок камеры скопируется в результат, а его размер учитывается в лимите 2 МБ. Ориентация при этом сбрасывается на обычную, фото не перевернётся.",
        },
        {
          q: "Можно ли сжать до 2 МБ скан документа в PNG?",
          a: "В режиме целевого размера PNG недоступен, поэтому выберите JPG: скан сохранится с высоким качеством, а прозрачные области, если они есть, зальются белым. Если нужен именно PNG, используйте режим качества с сокращением цветов — для чёрно-белых сканов это обычно даёт маленький файл.",
        },
      ],
      en: [
        {
          q: "Will the capture date and location be kept?",
          a: "Not by default: compression removes EXIF along with GPS coordinates. For JPG you can turn on Keep EXIF — the camera block is copied into the result and counts toward the 2 MB limit. The orientation is reset to normal, so the photo won’t appear rotated.",
        },
        {
          q: "Can I compress a PNG document scan to 2 MB?",
          a: "PNG isn’t available in target-size mode, so choose JPG: the scan is saved at high quality and any transparent areas are filled with white. If you really need PNG, use quality mode with color reduction — for black-and-white scans it usually produces a small file.",
        },
      ],
    },
    facts: {
      ru: [
        ["Лимит в байтах", "2 097 152 байт (2 МБ = 2048 КБ)"],
        ["Примерное разрешение фото JPG при качестве 75–80", "≈ 8,4–14 Мп (около 4000×3000 px — это 12 Мп)"],
        ["Уменьшение размера", "обычно нужно только снимкам на 48–50 Мп и панорамам"],
        ["Формат результата", "JPG по умолчанию; можно WebP или AVIF"],
        ["EXIF", "удаляется; «Сохранить EXIF» учитывается в лимите"],
      ],
      en: [
        ["Limit in bytes", "2,097,152 bytes (2 MB = 2,048 KB)"],
        ["Approx. JPG photo resolution at quality 75–80", "≈ 8.4–14 MP (about 4000×3000 px — that is 12 MP)"],
        ["Downscaling", "usually needed only for 48–50 MP shots and panoramas"],
        ["Output format", "JPG by default; WebP or AVIF optional"],
        ["EXIF", "removed; Keep EXIF counts toward the limit"],
      ],
    },
  },
];
