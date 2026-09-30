import type { FilterText } from "./types";

/* ───────────── Filter pages: /image/filters/<id> ───────────── */

export const FILTER_TEXTS: FilterText[] = [
  /* ── Grayscale ── */
  {
    id: "grayscale",
    name: { ru: "Оттенки серого", en: "Grayscale" },
    title: {
      ru: "Чёрно-белое фото онлайн — фильтр оттенков серого",
      en: "Grayscale Image Online — Make a Photo Black and White",
    },
    h1: {
      ru: "Сделать фото чёрно-белым (оттенки серого)",
      en: "Make a Photo Black and White (Grayscale)",
    },
    description: {
      ru: "Перевод фото в оттенки серого по формуле яркости Rec. 709: сила 0–100 %, пакетная обработка, экспорт в полном разрешении в JPG, PNG или WebP.",
      en: "Convert photos to grayscale with Rec. 709 luminance weights. Strength 0–100%, batch processing and full-resolution export to JPG, PNG or WebP.",
    },
    lead: {
      ru: "Цветное фото превращается в чёрно-белое с плавными переходами серого — прямо в браузере, без загрузки на сервер.",
      en: "A color photo becomes black and white with smooth shades of grey — right in your browser, nothing is uploaded.",
    },
    math: {
      ru: "Яркость пикселя Y = 0,2126 R + 0,7152 G + 0,0722 B (веса Rec. 709) записывается во все три канала; сила 0–100 % смешивает результат с оригиналом.",
      en: "Each pixel’s luminance Y = 0.2126 R + 0.7152 G + 0.0722 B (Rec. 709 weights) is written to all three channels; strength 0–100% blends the result with the original.",
    },
    keywords: {
      ru: [
        "сделать фото черно-белым",
        "черно-белое фото онлайн",
        "оттенки серого онлайн",
        "обесцветить фото",
        "перевести картинку в серый",
        "grayscale фото",
      ],
      en: [
        "make photo black and white",
        "grayscale image online",
        "convert image to grayscale",
        "desaturate photo",
        "black and white photo converter",
        "gray scale picture",
      ],
    },
    paragraphs: {
      ru: [
        "Фильтр не усредняет каналы поровну: зелёный даёт около 72 % яркости, красный — 21 %, синий — всего 7 %, примерно так же, как чувствителен к цветам глаз. Поэтому насыщенный синий становится почти чёрным, зелёная листва — светлой, а снимок не выглядит плоским.",
        "Сила меньше 100 % оставляет часть цвета — получается приглушённый, «выцветший» кадр. Обработка идёт пиксельными операциями, поэтому результат одинаков во всех браузерах, включая Safari; можно обработать сразу пачку фото и скачать их ZIP-архивом.",
        "Если нужен чисто чёрно-белый результат без полутонов — как у печати, подписи или скана текста, — выбирайте фильтр «Чёрно-белое (порог)»: там каждый пиксель становится либо чёрным, либо белым.",
      ],
      en: [
        "The filter does not simply average the channels: green contributes about 72% of the brightness, red 21% and blue only 7%, roughly matching how sensitive the eye is to each color. Saturated blue therefore turns almost black, green foliage turns light, and the picture does not look flat.",
        "A strength below 100% keeps some of the color for a muted, faded look. The filter is plain pixel math, so the result is identical in every browser including Safari, and you can process a whole batch and download it as a ZIP.",
        "If you need pure black and white with no grey at all — for a stamp, a signature or a text scan — use the Black & White (Threshold) filter instead: it turns every pixel either black or white.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем оттенки серого отличаются от чёрно-белого фильтра с порогом?",
          a: "В оттенках серого остаются 256 градаций яркости, как на классической чёрно-белой фотографии. Фильтр с порогом оставляет только два цвета — чёрный и белый; это 1-битная графика для подписей, печатей и трафаретов. Для портретов и пейзажей нужны оттенки серого.",
        },
        {
          q: "Станет ли файл легче?",
          a: "В JPG — обычно немного: цветовые составляющие становятся однородными и сжимаются лучше. Но файл остаётся обычным RGB-изображением с серыми пикселями, поэтому большой экономии не ждите. Если важен вес, пропустите результат через сжатие.",
        },
        {
          q: "Можно ли потом вернуть фото цвет?",
          a: "Нет: при переводе в серый информация о цвете теряется, и восстановить её можно только вручную или нейросетью — такого инструмента здесь нет. Исходный файл при этом не меняется, фильтр создаёт новую копию.",
        },
      ],
      en: [
        {
          q: "How is grayscale different from the black & white threshold filter?",
          a: "Grayscale keeps 256 levels of brightness, like a classic black-and-white photograph. The threshold filter leaves only two colors, black and white — 1-bit graphics for signatures, stamps and stencils. For portraits and landscapes you want grayscale.",
        },
        {
          q: "Will the file get smaller?",
          a: "As a JPG, usually a little: the color components become uniform and compress better. The file is still an ordinary RGB image with grey pixels, though, so don’t expect big savings. If size matters, run the result through the compressor.",
        },
        {
          q: "Can I bring the color back later?",
          a: "No. Converting to grey throws the color information away, and only manual coloring or an AI tool could recreate it — there is no such tool here. Your original file is not touched; the filter always produces a new copy.",
        },
      ],
    },
  },

  /* ── Sepia ── */
  {
    id: "sepia",
    name: { ru: "Сепия", en: "Sepia" },
    title: {
      ru: "Эффект сепии онлайн — старое фото в коричневых тонах",
      en: "Sepia Filter Online — Old-Style Brown-Toned Photos",
    },
    h1: { ru: "Наложить эффект сепии на фото", en: "Apply a Sepia Effect to a Photo" },
    description: {
      ru: "Сепия для фото: классическая матрица тонирования, сила 0–100 %, сравнение до/после, пакетная обработка и экспорт в полном разрешении в JPG, PNG, WebP.",
      en: "Give photos a warm brown tone with the classic sepia matrix. Strength 0–100%, before/after preview, batch mode and full-resolution JPG, PNG or WebP.",
    },
    lead: {
      ru: "Фото получает тёплый коричневатый тон, как у снимков конца XIX — начала XX века.",
      en: "Your photo takes on the warm brownish tone of prints from the late 19th and early 20th centuries.",
    },
    math: {
      ru: "Стандартная матрица сепии: R' = 0,393R + 0,769G + 0,189B; G' = 0,349R + 0,686G + 0,168B; B' = 0,272R + 0,534G + 0,131B. Сила 0–100 % плавно ведёт от исходных цветов к полной сепии.",
      en: "The standard sepia matrix: R' = 0.393R + 0.769G + 0.189B; G' = 0.349R + 0.686G + 0.168B; B' = 0.272R + 0.534G + 0.131B. Strength 0–100% moves smoothly from the original colors to full sepia.",
    },
    keywords: {
      ru: [
        "эффект сепии онлайн",
        "сепия фото",
        "фильтр сепия",
        "состарить фото онлайн",
        "фото в коричневых тонах",
        "сделать фото как старое",
      ],
      en: [
        "sepia filter online",
        "sepia effect photo",
        "sepia tone converter",
        "make photo look old",
        "brown tone photo",
        "old photo effect",
      ],
    },
    paragraphs: {
      ru: [
        "Название цвета пришло от чернил каракатицы (лат. sepia): коричневый пигмент из них веками использовали художники. В фотографии похожий тон давало сепиевое вирирование, поэтому старые отпечатки чаще коричневатые, а не серые.",
        "Матрица смешивает все три канала, поэтому яркие цвета не остаются отдельными пятнами — всё изображение переходит в единую коричневую гамму, а светлота сохраняется. При силе 30–60 % цвет остаётся частично: получается мягкий тёплый снимок, а не музейный отпечаток.",
        "Для более заметного «старого» вида с выцветшими тенями и затемнёнными краями есть отдельный фильтр «Винтаж».",
      ],
      en: [
        "The color is named after cuttlefish ink (Latin sepia), a brown pigment artists used for centuries. In photography a similar tone came from sepia toning, which is why old prints tend to look brownish rather than grey.",
        "The matrix mixes all three channels, so bright colors don’t survive as isolated spots — the whole image moves into one brown palette while keeping its lightness. At 30–60% strength some of the original color remains, giving a soft warm photo rather than a museum print.",
        "For a stronger aged look with faded shadows and darkened edges, use the separate Vintage filter.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Откуда у старых фотографий коричневый оттенок?",
          a: "Чаще всего от сепиевого вирирования: отпечаток обрабатывали сернистыми растворами, и металлическое серебро изображения превращалось в сульфид серебра коричневого цвета. Такие снимки к тому же лучше сохранялись. Отчасти тон добавляет и естественное старение бумаги.",
        },
        {
          q: "Чем сепия отличается от фильтра «Тёплый»?",
          a: "Сепия заменяет все цвета одной коричневой гаммой — фото становится по сути монохромным. «Тёплый» лишь сдвигает баланс белого: добавляет красного и убирает синего, а зелёная трава и голубое небо остаются зелёной и голубым.",
        },
        {
          q: "Сохранится ли прозрачный фон PNG?",
          a: "Да, если сохранять в PNG или WebP: фильтр меняет только цвет, альфа-канал не трогает. В JPG прозрачности нет, поэтому прозрачные области заливаются фоном — по умолчанию белым.",
        },
      ],
      en: [
        {
          q: "Why are old photographs brown?",
          a: "Mostly because of sepia toning: prints were treated with sulfide solutions that turned the metallic silver of the image into brown silver sulfide. Toned prints also lasted longer. Natural aging of the paper adds to the tint as well.",
        },
        {
          q: "How is sepia different from the Warm filter?",
          a: "Sepia replaces every color with one brown palette, so the photo becomes essentially monochrome. Warm only shifts the white balance — more red, less blue — while green grass and a blue sky stay green and blue.",
        },
        {
          q: "Will a transparent PNG background survive?",
          a: "Yes, if you save as PNG or WebP: the filter changes color only and leaves the alpha channel alone. JPG has no transparency, so transparent areas are filled with a background color, white by default.",
        },
      ],
    },
  },

  /* ── Invert ── */
  {
    id: "invert",
    name: { ru: "Негатив", en: "Invert" },
    title: {
      ru: "Инвертировать цвета фото — негатив онлайн",
      en: "Invert Image Colors Online — Photo Negative Effect",
    },
    h1: { ru: "Инвертировать цвета изображения", en: "Invert Image Colors" },
    description: {
      ru: "Инверсия цветов: каждый канал превращается в 255 − значение, прозрачность не меняется. Сила 0–100 %, пакетная обработка, экспорт в JPG, PNG или WebP.",
      en: "Invert image colors: every channel becomes 255 minus its value while transparency stays untouched. Strength 0–100%, batch mode, JPG, PNG or WebP.",
    },
    lead: {
      ru: "Светлое становится тёмным, а каждый цвет — противоположным: белый превращается в чёрный, жёлтый — в синий.",
      en: "Light becomes dark and every color flips to its opposite: white turns black and yellow turns blue.",
    },
    math: {
      ru: "Каждый цветовой канал заменяется на 255 − значение, альфа-канал не трогается; сила 0–100 % смешивает инверсию с оригиналом.",
      en: "Each color channel is replaced with 255 − value, the alpha channel is left untouched; strength 0–100% blends the inversion with the original.",
    },
    keywords: {
      ru: [
        "инвертировать цвета фото",
        "негатив фото онлайн",
        "сделать негатив из фото",
        "инверсия цвета картинки",
        "обратить цвета изображения",
        "инвертировать картинку онлайн",
      ],
      en: [
        "invert image colors",
        "photo negative online",
        "invert colors of picture",
        "negative image effect",
        "color inversion tool",
        "invert png online",
      ],
    },
    paragraphs: {
      ru: [
        "Инверсия пригодится, чтобы получить эффект негатива, сделать тёмную версию схемы или скриншота либо превратить чёрный логотип в белый для тёмного фона. Прозрачные участки PNG и WebP остаются прозрачными — меняются только цвета.",
        "Частичная сила ведёт себя неожиданно: на 50 % каждый пиксель сходится к одному и тому же серому (127,5), и изображение превращается в ровный серый прямоугольник. Осмысленные результаты получаются ближе к 100 %; значения 70–90 % дают приглушённый «полунегатив».",
      ],
      en: [
        "Inversion is handy for a negative effect, a dark version of a diagram or screenshot, or turning a black logo white for a dark background. Transparent areas of PNG and WebP stay transparent — only the colors change.",
        "Partial strength behaves in a surprising way: at 50% every pixel converges to the same grey (127.5) and the image becomes a flat grey rectangle. Meaningful results live close to 100%; values of 70–90% give a washed-out “half negative”.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать негатив фото?",
          a: "Загрузите снимок и оставьте силу 100 %: каждый цвет заменится противоположным. Для классического чёрно-белого негатива сначала примените фильтр «Оттенки серого», скачайте результат и затем инвертируйте его.",
        },
        {
          q: "Можно ли так оцифровать отсканированный плёночный негатив?",
          a: "Чёрно-белый — да: после инверсии получится нормальный позитив, при необходимости поправьте контраст. С цветным хуже: у цветной плёнки оранжевая маска, и после простой инверсии кадр уйдёт в синеву. Для него нужна коррекция баланса по каждому каналу в графическом редакторе.",
        },
        {
          q: "Почему при силе 50 % картинка стала просто серой?",
          a: "Потому что смесь 50 на 50 значения v и 255 − v всегда даёт 127,5, какой бы ни была исходная яркость. Все пиксели становятся одинаковыми, и изображение исчезает. Это не ошибка, а арифметика инверсии.",
        },
      ],
      en: [
        {
          q: "How do I make a photo negative?",
          a: "Upload the picture and keep the strength at 100%: every color is replaced by its opposite. For a classic black-and-white negative, apply the Grayscale filter first, download the result and then invert it.",
        },
        {
          q: "Can I digitize a scanned film negative this way?",
          a: "Black-and-white film, yes: inverting gives a normal positive; adjust contrast if needed. Color film is harder — it has an orange mask, so a plain inversion leaves the frame strongly blue. That needs per-channel balance correction in a photo editor.",
        },
        {
          q: "Why did the picture turn plain grey at 50%?",
          a: "Because a 50/50 mix of v and 255 − v is always 127.5, whatever the original brightness. Every pixel becomes the same value and the image disappears. It is not a bug, just the arithmetic of inversion.",
        },
      ],
    },
  },

  /* ── Blur ── */
  {
    id: "blur",
    name: { ru: "Размытие", en: "Blur" },
    title: {
      ru: "Размыть фото онлайн — размытие по Гауссу до 100 px",
      en: "Blur Image Online — Gaussian Blur up to 100 px",
    },
    h1: { ru: "Размыть фото", en: "Blur a Photo" },
    description: {
      ru: "Размытие по Гауссу с радиусом 1–100 px в полном разрешении, без тёмных ореолов на прозрачных краях PNG. Пакетная обработка, экспорт JPG, PNG, WebP.",
      en: "Gaussian blur with a 1–100 px radius at full resolution and no dark halos around transparent PNG edges. Batch processing, JPG, PNG and WebP export.",
    },
    lead: {
      ru: "Всё изображение мягко размывается — от лёгкой расфокусировки до цветного пятна, на котором хорошо читается текст.",
      en: "The whole image is softly blurred — from a slight defocus to a wash of color that text reads well on.",
    },
    math: {
      ru: "Размытие по Гауссу, приближённое тремя проходами box-размытия; радиус (сигма) 1–100 px отсчитывается в пикселях полного разрешения, поэтому превью и итоговый файл совпадают.",
      en: "Gaussian blur approximated by three box-blur passes; the radius (sigma) of 1–100 px is measured in full-resolution pixels, so the preview matches the exported file.",
    },
    keywords: {
      ru: [
        "размыть фото онлайн",
        "размытие изображения",
        "размытие по гауссу онлайн",
        "размыть картинку",
        "размытый фон для текста",
        "blur фото онлайн",
      ],
      en: [
        "blur image online",
        "gaussian blur online",
        "blur photo",
        "blur picture",
        "blurred background image",
        "soften image",
      ],
    },
    paragraphs: {
      ru: [
        "Размытое фото часто нужно как фон — для обложки, заставки, слайда или подложки под текст. Радиус 5–15 px даёт мягкую расфокусировку, 40–100 px — почти однотонное цветовое пятно, повторяющее палитру снимка.",
        "Три прохода box-фильтра дают результат, практически неотличимый от точного Гаусса, но работают быстро даже на снимках в 20–50 Мп. Радиус задаётся для полного размера, поэтому на уменьшенном превью размытие выглядит так же, как в итоговом файле. У PNG с прозрачностью края размываются без тёмной каймы.",
      ],
      en: [
        "A blurred photo is often needed as a background — for a cover, a slide, a lock screen or a panel behind text. A 5–15 px radius gives a gentle defocus; 40–100 px turns the picture into a near-uniform wash of its own colors.",
        "Three box-filter passes are practically indistinguishable from a true Gaussian yet stay fast even on 20–50 MP photos. The radius refers to the full-size image, so the downscaled preview looks exactly like the exported file. Transparent PNG edges blur without a dark fringe.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли размыть только часть фото — лицо или номер машины?",
          a: "Этот фильтр размывает изображение целиком. Для отдельных областей используйте инструмент цензуры: там можно выделить один или несколько прямоугольников и размыть, пикселизировать или закрасить их. Для текста и номеров надёжнее пикселизация или сплошная плашка — слабое размытие иногда удаётся частично обратить.",
        },
        {
          q: "Можно ли размыть фон, оставив человека резким?",
          a: "Автоматически — нет: для этого нужно отделить человека от фона, а нейросетей здесь нет. Можно размыть копию фото и совместить её с оригиналом по маске в графическом редакторе.",
        },
      ],
      en: [
        {
          q: "Can I blur only part of a photo, like a face or a license plate?",
          a: "This filter blurs the whole image. For selected areas use the censor tool: draw one or more rectangles and blur, pixelate or black them out. For text and plates, pixelation or a solid box is safer — a weak blur can sometimes be partially reversed.",
        },
        {
          q: "Can I blur the background and keep the person sharp?",
          a: "Not automatically: that requires separating the person from the background, and there is no AI here. You can blur a copy of the photo and combine it with the original through a mask in a photo editor.",
        },
      ],
    },
  },

  /* ── Sharpen ── */
  {
    id: "sharpen",
    name: { ru: "Резкость", en: "Sharpen" },
    title: {
      ru: "Повысить резкость фото онлайн — нерезкая маска",
      en: "Sharpen Image Online — Unsharp Mask up to 300%",
    },
    h1: { ru: "Повысить резкость фото", en: "Sharpen a Photo" },
    description: {
      ru: "Резкость методом нерезкой маски: сила 0–300 %, радиус ≈1,2 px для мелких деталей, сравнение до/после, экспорт в полном разрешении, пакетная обработка.",
      en: "Sharpen photos with an unsharp mask: amount 0–300%, a ≈1.2 px radius for fine detail, before/after preview, full-resolution export and batch mode.",
    },
    lead: {
      ru: "Мелкие детали и края становятся чётче — это помогает слегка мягким снимкам и фото после уменьшения.",
      en: "Fine detail and edges get crisper, which helps slightly soft shots and photos after downscaling.",
    },
    math: {
      ru: "Нерезкая маска: результат = оригинал + сила × (оригинал − размытая копия); сила 0–300 %, радиус размытия ≈1,2 px в полном разрешении.",
      en: "Unsharp mask: result = original + amount × (original − blurred copy); amount 0–300%, blur radius ≈1.2 px at full resolution.",
    },
    keywords: {
      ru: [
        "повысить резкость фото",
        "увеличить резкость онлайн",
        "сделать фото четче онлайн",
        "резкость изображения",
        "нерезкая маска онлайн",
        "улучшить четкость фото",
      ],
      en: [
        "sharpen image online",
        "sharpen photo",
        "make picture clearer",
        "unsharp mask online",
        "increase image sharpness",
        "fix slightly blurry photo",
      ],
    },
    paragraphs: {
      ru: [
        "Нерезкая маска — классический приём из фотолаборатории: из снимка вычитается его размытая копия, и разница усиливает контраст на границах. Небольшой радиус ≈1,2 px подчёркивает мелкие детали — ресницы, текстуру ткани, текст — и не создаёт широких ореолов.",
        "Для большинства фото хватает 50–120 %. Выше 200 % у контрастных краёв появляются светлые обводки и заметнее становится шум — оценивайте результат на сравнении до/после. Резкость лучше добавлять последним шагом, после изменения размера и перед публикацией.",
      ],
      en: [
        "The unsharp mask is a classic darkroom technique: a blurred copy is subtracted from the image and the difference boosts contrast along edges. The small ≈1.2 px radius emphasizes fine detail — eyelashes, fabric texture, text — without wide halos.",
        "Most photos need 50–120%. Above 200% bright outlines appear along contrasty edges and noise becomes more visible, so check the before/after comparison. Sharpening works best as the last step, after resizing and just before publishing.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли исправить размытое или смазанное фото?",
          a: "Нет. Фильтр усиливает уже существующие края, но не восстанавливает деталей, которых на снимке нет: сильная расфокусировка или смаз от движения останутся. Слегка мягкий кадр станет заметно лучше, сильно размытый — только шумнее.",
        },
        {
          q: "Почему после повышения резкости появились светлые контуры?",
          a: "Это ореолы — побочный эффект нерезкой маски при большой силе: светлая сторона края высветляется, тёмная затемняется. Уменьшите силу до 60–120 %, особенно на портретах и фото с небом.",
        },
        {
          q: "Нужно ли повышать резкость после уменьшения фото?",
          a: "Инструмент изменения размера уже добавляет лёгкую резкость после пересчёта пикселей. Дополнительную применяйте, только если снимок всё ещё выглядит мягким, — обычно хватает 30–60 %.",
        },
      ],
      en: [
        {
          q: "Can this fix a blurry or motion-blurred photo?",
          a: "No. The filter strengthens edges that already exist; it cannot recreate detail the photo never captured. Heavy defocus or motion blur will remain. A slightly soft shot improves noticeably, a very blurry one only gets noisier.",
        },
        {
          q: "Why are there bright outlines after sharpening?",
          a: "Those are halos, a side effect of a strong unsharp mask: the light side of an edge gets lighter and the dark side darker. Lower the amount to 60–120%, especially on portraits and photos with sky.",
        },
        {
          q: "Should I sharpen after downscaling?",
          a: "The resize tool already adds light sharpening after resampling. Add more only if the picture still looks soft — 30–60% is usually enough.",
        },
      ],
    },
  },

  /* ── Brightness ── */
  {
    id: "brightness",
    name: { ru: "Яркость", en: "Brightness" },
    title: {
      ru: "Изменить яркость фото онлайн — осветлить или затемнить",
      en: "Adjust Image Brightness Online — Lighten or Darken",
    },
    h1: { ru: "Изменить яркость фото", en: "Adjust Photo Brightness" },
    description: {
      ru: "Осветлить или затемнить фото: яркость 0–300 %, где 100 % — без изменений. Сравнение до/после, пакетная обработка, экспорт в JPG, PNG или WebP.",
      en: "Lighten or darken photos: brightness 0–300%, where 100% leaves the image unchanged. Before/after preview, batch processing, JPG, PNG or WebP export.",
    },
    lead: {
      ru: "Тёмный снимок становится светлее, пересвеченный — темнее; ползунок работает как brightness() в CSS.",
      en: "A dark shot gets lighter, an overexposed one darker; the slider works like CSS brightness().",
    },
    math: {
      ru: "Каждый канал умножается на коэффициент 0–300 % (100 % — без изменений), как в CSS-функции brightness(); значения выше 255 обрезаются.",
      en: "Each channel is multiplied by a factor of 0–300% (100% = unchanged), like the CSS brightness() function; values above 255 are clipped.",
    },
    keywords: {
      ru: [
        "осветлить фото онлайн",
        "изменить яркость фото",
        "затемнить фото",
        "сделать фото светлее",
        "осветлить темное фото",
        "яркость картинки онлайн",
      ],
      en: [
        "brighten image online",
        "adjust photo brightness",
        "darken image",
        "make photo lighter",
        "lighten dark photo",
        "image brightness editor",
      ],
    },
    paragraphs: {
      ru: [
        "Яркость — простое умножение: при 150 % пиксель со значением 100 становится 150, а всё, что было светлее 170, упирается в 255 и становится белым. Поэтому сильное осветление «выжигает» небо и блики — следите за светлыми участками на сравнении до/после.",
        "При затемнении (меньше 100 %) белый превращается в серый, а 0 % даёт полностью чёрное изображение. Если фото не тёмное, а тусклое и «серое», чаще помогает фильтр «Контраст».",
      ],
      en: [
        "Brightness is plain multiplication: at 150% a pixel value of 100 becomes 150, and anything brighter than 170 hits 255 and turns white. That is why strong brightening blows out skies and highlights — watch the light areas in the before/after view.",
        "Darkening (below 100%) turns white into grey, and 0% makes the image completely black. If the photo is dull and greyish rather than dark, the Contrast filter usually helps more.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему после осветления пропали детали в облаках?",
          a: "Светлые пиксели при умножении выходят за 255 и обрезаются до чистого белого, а вместе с ними исчезают оттенки облаков. Уменьшите яркость до 110–130 % или осветлите фото меньше и добавьте немного контраста.",
        },
        {
          q: "Можно ли осветлить только тени?",
          a: "Этим фильтром — нет: он меняет все тона пропорционально. Для раздельной работы с тенями нужны кривые или уровни в графическом редакторе. Отчасти помогает снижение контраста: тени становятся светлее, а света — чуть темнее.",
        },
      ],
      en: [
        {
          q: "Why did the cloud detail disappear after brightening?",
          a: "When multiplied, light pixels exceed 255 and are clipped to pure white, taking the cloud tones with them. Lower the brightness to 110–130%, or brighten less and add a little contrast.",
        },
        {
          q: "Can I lighten only the shadows?",
          a: "Not with this filter: it scales all tones proportionally. Separate shadow control needs curves or levels in a photo editor. Reducing contrast helps partly — shadows get lighter while highlights get slightly darker.",
        },
      ],
    },
  },

  /* ── Contrast ── */
  {
    id: "contrast",
    name: { ru: "Контраст", en: "Contrast" },
    title: {
      ru: "Контрастность фото онлайн — увеличить или уменьшить",
      en: "Adjust Image Contrast Online — Increase or Reduce",
    },
    h1: { ru: "Изменить контрастность фото", en: "Adjust Photo Contrast" },
    description: {
      ru: "Контраст 0–300 %: тёмные тона темнеют, светлые светлеют относительно середины 127,5. Сравнение до/после, пакетная обработка, экспорт JPG, PNG, WebP.",
      en: "Contrast 0–300%: darks get darker and lights get lighter around the 127.5 midpoint. Before/after preview, batch processing and JPG, PNG or WebP export.",
    },
    lead: {
      ru: "Тусклое, «серое» фото становится сочнее, а слишком жёсткое — мягче.",
      en: "A dull, greyish photo gets punchier, and a harsh one gets softer.",
    },
    math: {
      ru: "Каждый канал пересчитывается по формуле (v − 127,5) × k + 127,5, где k = 0–300 %; значения за пределами 0–255 обрезаются.",
      en: "Each channel is recalculated as (v − 127.5) × k + 127.5 with k = 0–300%; values outside 0–255 are clipped.",
    },
    keywords: {
      ru: [
        "увеличить контрастность фото",
        "контраст фото онлайн",
        "сделать фото контрастнее",
        "уменьшить контраст фото",
        "изменить контрастность картинки",
        "исправить тусклое фото",
      ],
      en: [
        "increase image contrast",
        "adjust contrast online",
        "make photo more contrasty",
        "reduce photo contrast",
        "image contrast editor",
        "fix dull photo",
      ],
    },
    paragraphs: {
      ru: [
        "Формула растягивает или сжимает тона вокруг среднего серого 127,5: при 130 % тёмно-серый 80 становится ≈66, а светлый 180 — ≈196. При 0 % изображение превращается в ровный серый, при 200–300 % — в плакатную картинку почти из чистых цветов.",
        "Для блёклых снимков — сделанных в туман, через стекло, отсканированных — обычно хватает 115–140 %. Снижение до 70–90 % смягчает жёсткий полуденный свет и даёт спокойный, «плёночный» вид.",
      ],
      en: [
        "The formula stretches or squeezes tones around the 127.5 mid-grey: at 130% a dark grey of 80 becomes ≈66 and a light 180 becomes ≈196. At 0% the image turns flat grey; at 200–300% it becomes a poster of nearly pure colors.",
        "Washed-out shots — taken in fog, through glass or scanned — usually need 115–140%. Lowering it to 70–90% softens harsh midday light and gives a calm, film-like look.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему при сильном контрасте цвета становятся кислотными?",
          a: "Формула применяется к каналам R, G и B по отдельности, поэтому разница между ними тоже растёт — а вместе с ней насыщенность. Если нужен контраст без лишнего цвета, после него уменьшите насыщенность одноимённым фильтром.",
        },
        {
          q: "Чем контраст отличается от яркости?",
          a: "Яркость умножает все тона и сдвигает их в одну сторону. Контраст раздвигает тона от середины: тени темнеют, света светлеют, а средний серый 127,5 остаётся на месте.",
        },
      ],
      en: [
        {
          q: "Why do colors look garish at high contrast?",
          a: "The formula is applied to R, G and B separately, so the differences between channels grow too — and saturation grows with them. If you want contrast without extra color, reduce saturation with the Saturation filter afterwards.",
        },
        {
          q: "How is contrast different from brightness?",
          a: "Brightness multiplies every tone and moves them all in one direction. Contrast pushes tones away from the middle: shadows get darker, highlights lighter, while the 127.5 mid-grey stays put.",
        },
      ],
    },
  },

  /* ── Saturation ── */
  {
    id: "saturation",
    name: { ru: "Насыщенность", en: "Saturation" },
    title: {
      ru: "Насыщенность фото онлайн — сделать цвета ярче",
      en: "Adjust Image Saturation Online — Boost or Mute Colors",
    },
    h1: { ru: "Изменить насыщенность цветов на фото", en: "Adjust Color Saturation" },
    description: {
      ru: "Насыщенность 0–300 %: 0 % — серое фото, 100 % — без изменений, выше — сочнее. Цветовая матрица W3C saturate(), пакетная обработка, JPG, PNG, WebP.",
      en: "Saturation 0–300%: 0% is grey, 100% keeps colors as they are, higher values make them bolder. W3C saturate() color matrix, batch mode, JPG, PNG, WebP.",
    },
    lead: {
      ru: "Цвета становятся ярче и сочнее или, наоборот, приглушённее, а светлота снимка почти не меняется.",
      en: "Colors get richer or more muted while the overall lightness of the photo barely changes.",
    },
    math: {
      ru: "Цветовая матрица saturate() из спецификации W3C Filter Effects с коэффициентом 0–300 %: 0 даёт оттенки серого, 100 % — исходные цвета.",
      en: "The saturate() color matrix from the W3C Filter Effects spec with a factor of 0–300%: 0 gives grayscale, 100% keeps the original colors.",
    },
    keywords: {
      ru: [
        "увеличить насыщенность фото",
        "сделать цвета ярче онлайн",
        "насыщенность картинки",
        "сделать фото сочнее",
        "приглушить цвета на фото",
        "яркие цвета на фото онлайн",
      ],
      en: [
        "increase saturation online",
        "make colors more vibrant",
        "saturate image",
        "desaturate photo online",
        "boost photo colors",
        "image saturation editor",
      ],
    },
    paragraphs: {
      ru: [
        "Матрица W3C сохраняет яркость пикселя по весам 0,213 / 0,715 / 0,072, поэтому при изменении насыщенности фото почти не темнеет и не светлеет — меняется только цветность. Это та же формула, что у CSS-фильтра saturate().",
        "Для еды, природы и товаров обычно хватает 115–140 %. Выше 180 % кожа на портретах уходит в оранжевый, а цвета «выгорают» в чистые красные и синие. Значения 30–70 % дают приглушённый, «киношный» вид.",
      ],
      en: [
        "The W3C matrix preserves each pixel’s luminance using the 0.213 / 0.715 / 0.072 weights, so changing saturation hardly darkens or lightens the photo — only the colorfulness changes. It is the same formula as the CSS saturate() filter.",
        "Food, nature and product shots usually need 115–140%. Above 180% skin in portraits turns orange and colors clip into pure reds and blues. Values of 30–70% give a muted, cinematic look.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем 0 % насыщенности отличается от фильтра «Оттенки серого»?",
          a: "Результат практически тот же: оба оставляют только яркость, веса каналов отличаются в четвёртом знаке (0,213 против 0,2126), и на глаз разницы нет. «Насыщенность» удобнее, когда цвет нужно приглушить частично, «Оттенки серого» — для полностью чёрно-белого фото.",
        },
        {
          q: "Почему кожа на портрете стала оранжевой?",
          a: "Тон кожи — тёплый, и повышение насыщенности усиливает в нём красно-жёлтую составляющую. Для портретов держите 105–125 % или усиливайте цвет только на пейзажах и предметной съёмке.",
        },
      ],
      en: [
        {
          q: "How is 0% saturation different from the Grayscale filter?",
          a: "The result is practically the same: both keep only luminance, and the channel weights differ in the fourth decimal (0.213 vs 0.2126), which is invisible. Saturation is handier when you want to mute color partially; Grayscale is for a fully black-and-white photo.",
        },
        {
          q: "Why did skin in my portrait turn orange?",
          a: "Skin tones are warm, and raising saturation amplifies their red-yellow component. Keep portraits at 105–125%, or save strong saturation for landscapes and product shots.",
        },
      ],
    },
  },

  /* ── Hue rotate ── */
  {
    id: "hue-rotate",
    name: { ru: "Сдвиг оттенка", en: "Hue Rotate" },
    title: {
      ru: "Изменить оттенок фото онлайн — поворот цветового тона",
      en: "Hue Rotate Image Online — Shift All Colors by Degrees",
    },
    h1: { ru: "Сдвинуть оттенок цветов на фото", en: "Shift the Hue of an Image" },
    description: {
      ru: "Поворот цветового тона на −180…180°: при 120° красный становится зелёным, зелёный — синим. Матрица W3C hueRotate, пакетная обработка, JPG, PNG, WebP.",
      en: "Rotate every color’s hue by −180…180°: at 120° red turns green and green turns blue. W3C hueRotate matrix, batch processing, JPG, PNG and WebP export.",
    },
    lead: {
      ru: "Все цвета фото одновременно смещаются по цветовому кругу на выбранный угол, а серые тона остаются серыми.",
      en: "All colors in the photo move around the color wheel by the chosen angle at once, while neutral greys stay grey.",
    },
    math: {
      ru: "Цветовая матрица hueRotate из спецификации W3C Filter Effects: поворот оттенка на угол −180…180° вокруг оси серого с приближённым сохранением яркости (веса 0,213 / 0,715 / 0,072).",
      en: "The hueRotate color matrix from the W3C Filter Effects spec: the hue is rotated by −180…180° around the grey axis with approximate luminance preservation (weights 0.213 / 0.715 / 0.072).",
    },
    keywords: {
      ru: [
        "изменить цвет на фото онлайн",
        "поменять оттенок картинки",
        "сдвиг цвета изображения",
        "перекрасить фото онлайн",
        "изменить тон фото",
        "hue rotate онлайн",
      ],
      en: [
        "hue rotate image",
        "change hue of image online",
        "shift colors in photo",
        "recolor image online",
        "change image color",
        "hue shift tool",
      ],
    },
    paragraphs: {
      ru: [
        "Угол — это поворот по цветовому кругу. 180° переводит оттенки в противоположные: красный уходит в бирюзовый, синий — в желтоватый, но, в отличие от инверсии, тёмное остаётся тёмным. Небольшие сдвиги на 10–30° помогают подогнать цвет иконки, фона или иллюстрации под палитру сайта.",
        "Серые, чёрные и белые пиксели от поворота не меняются, поэтому текст и нейтральный фон остаются как были. Матрица W3C — приближение: на больших углах очень насыщенные цвета могут немного менять яркость, так же ведёт себя и CSS-фильтр hue-rotate().",
      ],
      en: [
        "The angle is a turn around the color wheel. 180° moves hues to their opposites — red goes teal, blue goes yellowish — but unlike inversion, dark stays dark. Small shifts of 10–30° help match an icon, background or illustration to a site’s palette.",
        "Grey, black and white pixels are not affected, so text and neutral backgrounds stay as they are. The W3C matrix is an approximation: at large angles very saturated colors may shift in brightness a little, exactly as with the CSS hue-rotate() filter.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли перекрасить только один предмет, например платье?",
          a: "Нет, фильтр сдвигает все цвета изображения сразу. Выборочная перекраска требует выделения области — это задача графического редактора. Если предмет — единственное цветное пятно на нейтральном фоне, сдвиг всего кадра даст почти тот же результат.",
        },
        {
          q: "Почему нельзя выбрать 360°?",
          a: "Поворот на 360° возвращает исходные цвета, а −180° и 180° дают одно и то же. Диапазона −180…180° хватает на весь круг: отрицательные углы просто сдвигают цвета в обратную сторону.",
        },
      ],
      en: [
        {
          q: "Can I recolor just one object, like a dress?",
          a: "No, the filter shifts every color in the image at once. Selective recoloring needs a selection, which is a job for a photo editor. If the object is the only colorful thing on a neutral background, rotating the whole frame gives almost the same result.",
        },
        {
          q: "Why can’t I choose 360°?",
          a: "A 360° turn returns the original colors, and −180° and 180° produce the same result. The −180…180° range covers the whole wheel; negative angles simply rotate colors the other way.",
        },
      ],
    },
  },

  /* ── Vintage ── */
  {
    id: "vintage",
    name: { ru: "Винтаж", en: "Vintage" },
    title: {
      ru: "Винтажный фильтр для фото онлайн — эффект старой плёнки",
      en: "Vintage Photo Filter Online — Faded Retro Film Look",
    },
    h1: { ru: "Винтажный эффект для фото", en: "Vintage Photo Effect" },
    description: {
      ru: "Ретро-эффект одним фильтром: лёгкая сепия, выцветшие тени, тёплый оттенок и мягкая виньетка. Сила 0–100 %, пакетная обработка, экспорт JPG, PNG, WebP.",
      en: "A retro look in one filter: light sepia, faded shadows, a warm tint and a soft vignette. Strength 0–100%, batch processing and JPG, PNG or WebP export.",
    },
    lead: {
      ru: "Снимок становится похож на старую цветную фотографию: тёплые приглушённые цвета, выцветшие тени и затемнённые края.",
      en: "Your shot starts to look like an old color print: warm muted colors, faded shadows and darker edges.",
    },
    math: {
      ru: "Комбинация: сепия 35 %, контраст ниже на 15 % с подъёмом чёрного (тени выцветают), тёплый сдвиг — красный +12, синий −12 — и мягкая виньетка; все части пропорциональны силе 0–100 %.",
      en: "A combination: 35% sepia, contrast lowered by 15% with lifted blacks (faded shadows), a warm shift of red +12 and blue −12, and a soft vignette; every part scales with strength 0–100%.",
    },
    keywords: {
      ru: [
        "винтажный фильтр онлайн",
        "ретро эффект для фото",
        "эффект старой пленки",
        "сделать фото в стиле ретро",
        "эффект выцветшего фото",
        "винтажное фото онлайн",
      ],
      en: [
        "vintage photo filter",
        "retro photo effect online",
        "old film look",
        "faded photo effect",
        "make photo look vintage",
        "vintage filter online",
      ],
    },
    paragraphs: {
      ru: [
        "Фильтр собирает сразу несколько приёмов «плёночного» вида: немного сепии для общего тёплого тона, приподнятый чёрный, как у выцветших отпечатков, мягкий контраст и лёгкое затемнение углов. На 100 % эффект заметный, на 40–60 % — деликатный, цвета почти сохраняются.",
        "Чёрный после фильтра становится тёмно-серым с тёплым оттенком — так и задумано: именно так выглядят поблёкшие тени. Если нужна ещё и зернистость, обработайте результат фильтром «Шум».",
      ],
      en: [
        "The filter bundles several film-look techniques: a little sepia for an overall warm tone, lifted blacks like a faded print, gentle contrast and slightly darker corners. At 100% the effect is obvious; at 40–60% it is subtle and most of the color remains.",
        "Black becomes a warm dark grey after the filter — that is intentional, it is how faded shadows look. If you also want grain, run the result through the Film Grain filter.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем «Винтаж» отличается от сепии?",
          a: "Сепия превращает фото в монохром коричневых тонов. «Винтаж» использует сепию примерно на треть, поэтому цвета остаются, но становятся тёплыми и приглушёнными, а к ним добавляются выцветшие тени и виньетка.",
        },
        {
          q: "Можно ли отдельно настроить виньетку или выцветание?",
          a: "В этом фильтре все составляющие связаны с одним ползунком силы. Для точной настройки примените по очереди сепию, контраст и виньетку: скачайте результат одного фильтра и обработайте его следующим.",
        },
      ],
      en: [
        {
          q: "How is Vintage different from Sepia?",
          a: "Sepia turns the photo into a brown monochrome. Vintage uses only about a third of the sepia effect, so colors survive but become warm and muted, and it adds faded shadows and a vignette on top.",
        },
        {
          q: "Can I adjust the vignette or the fade separately?",
          a: "In this filter every component is tied to one strength slider. For fine control, apply Sepia, Contrast and Vignette one after another: download the result of one filter and process it with the next.",
        },
      ],
    },
  },

  /* ── Pixelate ── */
  {
    id: "pixelate",
    name: { ru: "Пикселизация", en: "Pixelate" },
    title: {
      ru: "Пикселизация фото онлайн — эффект крупных пикселей",
      en: "Pixelate Image Online — Mosaic Effect, 2–100 px Blocks",
    },
    h1: { ru: "Пикселизировать изображение", en: "Pixelate an Image" },
    description: {
      ru: "Эффект мозаики: фото делится на квадраты от 2 до 100 px, каждый закрашивается средним цветом. Полное разрешение, пакетная обработка, JPG, PNG, WebP.",
      en: "Mosaic effect: the image is split into 2–100 px squares, each filled with its average color. Full-resolution export, batch mode, JPG, PNG and WebP.",
    },
    lead: {
      ru: "Изображение превращается в мозаику из крупных квадратов, как в ретро-играх.",
      en: "The image turns into a mosaic of large squares, like a retro video game.",
    },
    math: {
      ru: "Изображение делится на квадратные блоки 2–100 px (в пикселях полного разрешения), и каждый блок заливается средним цветом своих пикселей с учётом прозрачности.",
      en: "The image is divided into square blocks of 2–100 px (in full-resolution pixels), and each block is filled with the average color of its pixels, weighted by transparency.",
    },
    keywords: {
      ru: [
        "пикселизация фото онлайн",
        "сделать фото в пикселях",
        "эффект мозаики на фото",
        "пиксельный эффект картинки",
        "запикселить фото",
        "пикселизировать изображение",
      ],
      en: [
        "pixelate image online",
        "pixelate photo",
        "mosaic effect",
        "pixel effect picture",
        "make image pixelated",
        "8-bit photo effect",
      ],
    },
    paragraphs: {
      ru: [
        "Размер блока задаётся в пикселях исходного фото: на снимке 4000×3000 блок 20 px даёт сетку 200×150 квадратов, а на картинке 800×600 — всего 40×30. Для узнаваемого «пиксельного» портрета начните с 40–80 блоков по ширине.",
        "Чтобы получить настоящий пиксель-арт с ограниченной палитрой, после пикселизации обработайте результат фильтром «Постеризация». Для ручной доработки по клеткам есть отдельный редактор пиксель-арта.",
      ],
      en: [
        "The block size is measured in pixels of the original photo: on a 4000×3000 shot a 20 px block gives a 200×150 grid, on an 800×600 picture only 40×30. For a recognizable pixelated portrait, start with 40–80 blocks across.",
        "For genuine pixel art with a limited palette, run the pixelated result through the Posterize filter. For hand-editing cell by cell there is a separate pixel art editor.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как запикселить только лицо или номер?",
          a: "Этот фильтр обрабатывает весь кадр. Для отдельных областей откройте инструмент цензуры: нарисуйте прямоугольник поверх лица, номера или адреса и выберите пикселизацию — остальная часть фото останется нетронутой.",
        },
        {
          q: "Надёжно ли пикселизация скрывает текст?",
          a: "Крупная — да, мелкая — не всегда: если блок сравним с высотой букв, короткий текст или номер иногда угадывают по сочетанию оттенков. Берите блок заметно крупнее букв, а для паролей и номеров документов надёжнее сплошная плашка.",
        },
      ],
      en: [
        {
          q: "How do I pixelate only a face or a license plate?",
          a: "This filter processes the whole frame. For selected areas open the censor tool: draw a rectangle over the face, plate or address and choose pixelation — the rest of the photo stays untouched.",
        },
        {
          q: "Does pixelation reliably hide text?",
          a: "Coarse pixelation does; fine pixelation not always. If a block is about the height of the letters, short text or a number can sometimes be guessed from the pattern of shades. Use blocks much larger than the letters, and a solid box for passwords or ID numbers.",
        },
      ],
    },
  },

  /* ── Posterize ── */
  {
    id: "posterize",
    name: { ru: "Постеризация", en: "Posterize" },
    title: {
      ru: "Постеризация фото онлайн — плакатный эффект",
      en: "Posterize Image Online — Poster Effect, 2–16 Levels",
    },
    h1: { ru: "Постеризовать изображение", en: "Posterize an Image" },
    description: {
      ru: "Плакатный эффект: каждый канал сокращается до 2–16 уровней, всего от 8 до 4096 цветов. Чёткие цветовые пятна вместо градиентов; пакетно, JPG, PNG, WebP.",
      en: "Poster effect: each channel is cut to 2–16 levels, 8 to 4,096 colors in total. Flat color areas replace smooth gradients; batch mode, JPG, PNG, WebP.",
    },
    lead: {
      ru: "Плавные переходы превращаются в чёткие цветовые пятна, как на шелкографии или афише.",
      en: "Smooth gradients turn into flat patches of color, like a screen print or a gig poster.",
    },
    math: {
      ru: "Каждый канал R, G, B округляется до одного из N уровней (N = 2–16) с равным шагом 255 / (N − 1); всего получается N³ цветов.",
      en: "Each R, G, B channel is rounded to one of N evenly spaced levels (N = 2–16, step 255 / (N − 1)), giving N³ colors in total.",
    },
    keywords: {
      ru: [
        "постеризация онлайн",
        "эффект плаката для фото",
        "уменьшить количество цветов на фото",
        "постеризация изображения",
        "поп-арт эффект фото",
        "фото в стиле плаката",
      ],
      en: [
        "posterize image online",
        "poster effect photo",
        "reduce colors in image",
        "posterize filter",
        "pop art photo effect",
        "color levels effect",
      ],
    },
    paragraphs: {
      ru: [
        "При 2 уровнях остаются только 8 цветов — чёрный, белый, красный, зелёный, синий и их чистые смеси: получается резкий поп-арт. 4–6 уровней дают узнаваемое фото со «ступеньками» на небе и коже, 12–16 — едва заметный эффект.",
        "Постеризация не делает файл палитровым: браузер сохраняет PNG в полноцветном режиме, а JPG вокруг резких границ может даже подрасти. Если цель — лёгкий PNG, используйте сокращение цветов в инструменте сжатия.",
      ],
      en: [
        "At 2 levels only 8 colors remain — black, white, red, green, blue and their pure mixes — for a harsh pop-art look. 4–6 levels keep the photo recognizable with visible steps in skies and skin; 12–16 levels are barely noticeable.",
        "Posterizing does not make the file palette-based: the browser saves PNG in full color, and a JPG may even grow around the new hard edges. If the goal is a small PNG, use color reduction in the compressor instead.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем постеризация отличается от сокращения цветов PNG?",
          a: "Постеризация режет каждый канал на одинаковые ступени, не глядя на картинку, поэтому цвета получаются «плакатными». Сокращение цветов в сжатии подбирает 16–256 цветов, лучше всего описывающих конкретное изображение, и результат ближе к оригиналу.",
        },
        {
          q: "Почему на небе появились полосы?",
          a: "Плавный градиент неба при малом числе уровней распадается на отдельные ступени — это и есть эффект постеризации. Если полосы мешают, увеличьте число уровней до 8–12.",
        },
      ],
      en: [
        {
          q: "How is posterizing different from PNG color reduction?",
          a: "Posterize cuts every channel into equal steps without looking at the picture, so the colors feel poster-like. Color reduction in the compressor picks the 16–256 colors that best describe that particular image, so the result stays closer to the original.",
        },
        {
          q: "Why are there bands in the sky?",
          a: "With few levels a smooth sky gradient breaks into separate steps — that is the posterize effect itself. If the bands bother you, raise the number of levels to 8–12.",
        },
      ],
    },
  },

  /* ── Black & white (threshold) ── */
  {
    id: "black-and-white",
    name: { ru: "Чёрно-белое (порог)", en: "Black & White (Threshold)" },
    title: {
      ru: "Чисто чёрно-белая картинка без серого — порог, 1 бит",
      en: "Pure Black and White Image — 1-Bit Threshold Filter",
    },
    h1: {
      ru: "Сделать картинку чисто чёрно-белой, без серого",
      en: "Make an Image Pure Black and White (1-Bit Look)",
    },
    description: {
      ru: "Только чёрный и белый: порог яркости 0–255, по желанию дизеринг Флойда — Стейнберга. Для подписей, печатей, трафаретов и сканов текста. JPG, PNG, WebP.",
      en: "Only black and white pixels: luminance threshold 0–255 with optional Floyd–Steinberg dithering. For signatures, stamps, stencils and text scans.",
    },
    lead: {
      ru: "Каждый пиксель становится либо чёрным, либо белым — без полутонов, как у штампа, трафарета или факса.",
      en: "Every pixel becomes either black or white — no grey at all, like a stamp, a stencil or a fax.",
    },
    math: {
      ru: "Яркость Y = 0,2126 R + 0,7152 G + 0,0722 B сравнивается с порогом 0–255: ниже порога — чёрный, иначе белый. Дизеринг Флойда — Стейнберга переносит ошибку округления на соседние пиксели и передаёт полутона точками.",
      en: "Luminance Y = 0.2126 R + 0.7152 G + 0.0722 B is compared with a 0–255 threshold: below it the pixel turns black, otherwise white. Floyd–Steinberg dithering spreads the rounding error to neighboring pixels and renders midtones as dot patterns.",
    },
    keywords: {
      ru: [
        "сделать картинку черно-белой без серого",
        "1 бит изображение онлайн",
        "порог яркости изображения",
        "черно-белая подпись для документа",
        "дизеринг онлайн",
        "бинаризация изображения",
      ],
      en: [
        "pure black and white image",
        "1-bit image converter",
        "image threshold online",
        "dithering online",
        "black and white signature",
        "binarize image",
      ],
    },
    paragraphs: {
      ru: [
        "Это не обычное чёрно-белое фото, а графика из двух цветов. Она нужна для скана подписи или печати, трафарета, гравировки и лазерной резки, стилизации под 1-битные экраны. Для фотографий с плавными переходами серого выбирайте фильтр «Оттенки серого».",
        "Порог 128 — середина шкалы: пиксели темнее него становятся чёрными. Если серый фон или тень от листа превращаются в чёрные пятна — уменьшите порог; если тонкие светлые линии пропадают — увеличьте его.",
        "Дизеринг передаёт полутона плотностью точек: фото остаётся узнаваемым даже в двух цветах, как на экранах ранних компьютеров. Для текста и подписей его лучше выключить — он добавляет лишние точки на фоне.",
      ],
      en: [
        "This is not an ordinary black-and-white photo but two-color graphics. It is what you need for a scanned signature or stamp, a stencil, engraving or laser cutting, or a 1-bit screen look. For photos with smooth shades of grey, choose the Grayscale filter.",
        "A threshold of 128 is mid-scale: pixels darker than it turn black. If a grey background or the shadow of the page turns into black blotches, lower the threshold; if thin light lines vanish, raise it.",
        "Dithering renders midtones through dot density, so a photo stays recognizable even in two colors, like on early computer screens. Switch it off for text and signatures — it sprinkles stray dots over the background.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать подпись для документа без серого фона?",
          a: "Сфотографируйте или отсканируйте подпись на белом листе, подберите порог так, чтобы фон стал чисто белым, а линии остались сплошными, и сохраните в PNG. Прозрачный фон этот фильтр не делает — белый остаётся белым.",
        },
        {
          q: "Станет ли файл действительно 1-битным?",
          a: "Нет: пиксели будут только чёрными и белыми, но PNG, JPG и WebP сохраняются в обычном полноцветном формате. Зато двухцветный PNG хорошо сжимается, а в инструменте сжатия его можно дополнительно упаковать с сокращением палитры.",
        },
        {
          q: "Когда включать дизеринг?",
          a: "Для фотографий, портретов и градиентов — чтобы сохранить объём. Для текста, чертежей, подписей и трафаретов — нет: там нужны чистые линии без шума из точек.",
        },
      ],
      en: [
        {
          q: "How do I get a signature without a grey background?",
          a: "Photograph or scan the signature on white paper, pick a threshold at which the background becomes pure white while the strokes stay solid, and save as PNG. This filter does not make the background transparent — white stays white.",
        },
        {
          q: "Will the file really be 1-bit?",
          a: "No: the pixels are only black and white, but PNG, JPG and WebP are saved in their usual full-color form. A two-color PNG compresses very well, though, and the compressor can pack it further with palette reduction.",
        },
        {
          q: "When should I turn on dithering?",
          a: "For photos, portraits and gradients, to keep a sense of depth. Not for text, drawings, signatures or stencils — those need clean lines without dot noise.",
        },
      ],
    },
  },

  /* ── Duotone ── */
  {
    id: "duotone",
    name: { ru: "Дуотон", en: "Duotone" },
    title: {
      ru: "Эффект дуотона онлайн — фото в двух цветах",
      en: "Duotone Effect Online — Two-Color Photo Filter",
    },
    h1: { ru: "Сделать фото в стиле дуотон", en: "Create a Duotone Photo" },
    description: {
      ru: "Дуотон: тени окрашиваются в один выбранный цвет, света — в другой, полутона — в их смесь. Два любых цвета, сила 0–100 %, пакетно, экспорт JPG, PNG, WebP.",
      en: "Duotone: shadows take one color you pick, highlights another, midtones a blend of both. Any two colors, strength 0–100%, batch mode, JPG, PNG, WebP.",
    },
    lead: {
      ru: "Фото перекрашивается в градиент из двух цветов — приём, знакомый по афишам, обложкам и баннерам.",
      en: "The photo is recolored as a two-color gradient, a look familiar from posters, album covers and banners.",
    },
    math: {
      ru: "Яркость пикселя (веса Rec. 709) задаёт позицию на градиенте от цвета теней к цвету светов: чёрный получает первый цвет, белый — второй, промежуточные тона — линейную смесь.",
      en: "Pixel luminance (Rec. 709 weights) sets a position on a gradient from the shadow color to the highlight color: black gets the first color, white the second, midtones a linear mix.",
    },
    keywords: {
      ru: [
        "дуотон онлайн",
        "эффект дуотон для фото",
        "фото в двух цветах",
        "двухцветный фильтр для фото",
        "градиентная карта онлайн",
        "duotone эффект",
      ],
      en: [
        "duotone effect online",
        "duotone photo",
        "two color photo filter",
        "gradient map online",
        "duotone generator",
        "two tone image",
      ],
    },
    paragraphs: {
      ru: [
        "По умолчанию тени тёмно-синие (#1E1A50), а света тёпло-жёлтые (#FFC45A). Лучше всего работают пары из тёмного и светлого цвета: тёмно-синий и розовый, чёрный и фирменный цвет, бордовый и кремовый. Если оба цвета одинаково яркие, фото теряет объём.",
        "Дуотон хорошо сводит разнородные снимки к одному стилю — фото команды, обложки статей, баннеры. В пакетном режиме одна и та же пара цветов применяется ко всем файлам.",
      ],
      en: [
        "By default shadows are dark indigo (#1E1A50) and highlights warm yellow (#FFC45A). Pairs of a dark and a light color work best: navy and pink, black and a brand color, burgundy and cream. If both colors are equally bright, the photo loses depth.",
        "Duotone is a neat way to give mismatched photos one style — team photos, article covers, banners. In batch mode the same color pair is applied to every file.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем дуотон отличается от сепии?",
          a: "Сепия — это фиксированная коричневая тонировка. В дуотоне оба цвета выбираете вы, и они могут быть любыми, даже контрастными по оттенку: например, фиолетовые тени и оранжевые света.",
        },
        {
          q: "Подойдёт ли результат для двухкрасочной печати в типографии?",
          a: "Нет, фильтр только имитирует вид дуотона в RGB. Файлов с двумя плашечными красками для типографии он не создаёт — такие макеты готовят в издательских программах.",
        },
      ],
      en: [
        {
          q: "How is duotone different from sepia?",
          a: "Sepia is a fixed brown tint. In duotone you choose both colors, and they can be anything, even contrasting hues — purple shadows with orange highlights, for example.",
        },
        {
          q: "Can I use the result for two-ink offset printing?",
          a: "No, the filter only imitates the duotone look in RGB. It does not create files with two spot-color plates for a print shop; those are prepared in desktop publishing software.",
        },
      ],
    },
  },

  /* ── Vignette ── */
  {
    id: "vignette",
    name: { ru: "Виньетка", en: "Vignette" },
    title: {
      ru: "Виньетка на фото онлайн — затемнить края снимка",
      en: "Add a Vignette Online — Darken Photo Edges",
    },
    h1: { ru: "Добавить виньетку на фото", en: "Add a Vignette to a Photo" },
    description: {
      ru: "Затемнение краёв с плавным радиальным переходом: сила 0–100 % и размер нетронутой середины. Акцент на центре кадра; пакетно, экспорт JPG, PNG, WebP.",
      en: "Darken photo edges with a smooth radial falloff: strength 0–100% and the size of the untouched center. Draws the eye to the middle; batch, JPG, PNG, WebP.",
    },
    lead: {
      ru: "Края и углы кадра мягко темнеют, и взгляд сам останавливается на центре снимка.",
      en: "The edges and corners darken softly, so the eye settles on the center of the picture.",
    },
    math: {
      ru: "Затемнение зависит от расстояния до центра: внутри заданной середины пиксели не меняются, дальше яркость плавно (по кривой smoothstep) снижается к углам на величину силы.",
      en: "Darkening depends on the distance from the center: pixels inside the chosen middle area stay untouched, beyond it brightness falls off smoothly (smoothstep curve) toward the corners by the strength amount.",
    },
    keywords: {
      ru: [
        "виньетка онлайн",
        "затемнить края фото",
        "эффект виньетки",
        "затемнение по краям фото",
        "виньетирование фото",
        "темные углы на фото",
      ],
      en: [
        "vignette effect online",
        "add vignette to photo",
        "darken edges of photo",
        "vignette filter",
        "dark corners photo",
        "photo vignette maker",
      ],
    },
    paragraphs: {
      ru: [
        "Виньетка — след старых объективов, которые давали меньше света по краям кадра. Сегодня её добавляют намеренно: затемнённые углы уводят внимание от фона и делают портрет или предметное фото собраннее.",
        "Расстояние считается по диагонали, поэтому сильнее всего темнеют углы, а середины сторон — меньше. Для естественного вида хватает силы 30–50 %; при 100 % углы становятся полностью чёрными.",
      ],
      en: [
        "A vignette is the legacy of old lenses that delivered less light to the edges of the frame. Today it is added on purpose: darker corners pull attention away from the background and make a portrait or product shot feel more focused.",
        "Distance is measured along the diagonal, so the corners darken most and the middles of the sides less. 30–50% strength looks natural; at 100% the corners turn completely black.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать белую виньетку вместо чёрной?",
          a: "Фильтр только затемняет края, но есть приём в три шага: инвертируйте фото, наложите на него виньетку и инвертируйте результат ещё раз. Края, которые затемнились в негативе, после обратной инверсии станут светлыми.",
        },
        {
          q: "За что отвечает ползунок размера?",
          a: "Он задаёт размер центральной области, которую виньетка не трогает. При малом значении затемнение начинается почти от центра и получается «туннель», при большом — темнеют только самые углы.",
        },
      ],
      en: [
        {
          q: "How do I make a white vignette instead of a black one?",
          a: "The filter only darkens, but there is a three-step trick: invert the photo, apply the vignette, then invert the result again. The edges that were darkened in the negative become light after the second inversion.",
        },
        {
          q: "What does the size slider do?",
          a: "It sets the size of the central area the vignette leaves alone. A small value starts the darkening almost at the center for a tunnel look; a large value darkens only the very corners.",
        },
      ],
    },
  },

  /* ── Emboss ── */
  {
    id: "emboss",
    name: { ru: "Тиснение", en: "Emboss" },
    title: {
      ru: "Эффект тиснения онлайн — рельеф из фото",
      en: "Emboss Effect Online — Turn a Photo into Relief",
    },
    h1: { ru: "Эффект тиснения для фото", en: "Emboss a Photo" },
    description: {
      ru: "Тиснение: ядро свёртки 3×3 выделяет края, и изображение выглядит выпуклым, а ровные участки сохраняют цвет. Сила 0–100 %, пакетно, экспорт JPG, PNG, WebP.",
      en: "Emboss: a 3×3 convolution kernel lifts edges so the picture looks raised, while flat areas keep their color. Strength 0–100%, batch mode, JPG, PNG, WebP.",
    },
    lead: {
      ru: "Контуры на фото становятся объёмными, словно изображение выдавлено на поверхности.",
      en: "Outlines in the photo become three-dimensional, as if the picture were pressed into a surface.",
    },
    math: {
      ru: "Свёртка с ядром 3×3 [−2 −1 0; −1 1 1; 0 1 2]: сумма коэффициентов равна 1, поэтому ровные участки сохраняют цвет, а края по диагонали светлеют или темнеют. Сила 0–100 % смешивает результат с оригиналом.",
      en: "Convolution with the 3×3 kernel [−2 −1 0; −1 1 1; 0 1 2]: its coefficients sum to 1, so flat areas keep their color while diagonal edges get lighter or darker. Strength 0–100% blends the result with the original.",
    },
    keywords: {
      ru: [
        "эффект тиснения онлайн",
        "рельеф из фото",
        "тиснение изображения",
        "объемный эффект для фото",
        "барельеф из фото",
        "emboss эффект",
      ],
      en: [
        "emboss effect online",
        "emboss image",
        "relief effect photo",
        "embossed picture",
        "3d relief from photo",
        "emboss filter",
      ],
    },
    paragraphs: {
      ru: [
        "В отличие от серого тиснения, привычного по некоторым редакторам, здесь сумма ядра равна единице: однотонные участки сохраняют исходный цвет, а рельеф появляется только на границах. Фото остаётся цветным и узнаваемым, а контуры будто подсвечены сбоку.",
        "Эффект сильно зависит от деталей: на текстурах, архитектуре и крупных надписях рельеф выразительный, на гладкой коже почти незаметен. Ядро 3×3 смотрит только на соседние пиксели, поэтому на снимке в 20+ Мп рельеф тоньше — уменьшите фото перед тиснением, если нужен более грубый эффект.",
      ],
      en: [
        "Unlike the grey emboss familiar from some editors, this kernel sums to one: flat areas keep their original color and relief appears only along edges. The photo stays colorful and recognizable, with outlines that look lit from the side.",
        "The effect depends heavily on detail: textures, architecture and large lettering get strong relief, smooth skin almost none. A 3×3 kernel only looks at neighboring pixels, so on a 20+ MP shot the relief is finer — downscale the photo first if you want a coarser effect.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как получить серое тиснение, как на металле?",
          a: "Сначала переведите фото в оттенки серого, скачайте результат и примените к нему тиснение. Получится монохромный рельеф, похожий на чеканку.",
        },
        {
          q: "Почему на большом фото эффект почти не виден?",
          a: "Ядро свёртки захватывает всего 3×3 пикселя, и на снимке 6000×4000 это крошечные детали. Уменьшите изображение до 1200–2000 px по длинной стороне, а затем примените тиснение — рельеф станет крупнее и заметнее.",
        },
      ],
      en: [
        {
          q: "How do I get a grey, metal-like emboss?",
          a: "Convert the photo to grayscale first, download it and then apply Emboss. You get a monochrome relief that resembles embossed metal.",
        },
        {
          q: "Why is the effect barely visible on a large photo?",
          a: "The kernel covers only 3×3 pixels, which is tiny detail on a 6000×4000 image. Downscale to 1200–2000 px on the long side, then emboss — the relief becomes bolder and easier to see.",
        },
      ],
    },
  },

  /* ── Pencil sketch ── */
  {
    id: "sketch",
    name: { ru: "Карандашный рисунок", en: "Pencil Sketch" },
    title: {
      ru: "Фото в карандашный рисунок онлайн — эффект эскиза",
      en: "Photo to Pencil Sketch Online — Drawing Effect",
    },
    h1: { ru: "Превратить фото в карандашный рисунок", en: "Turn a Photo into a Pencil Sketch" },
    description: {
      ru: "Фото в карандашный набросок: инверсия, размытие и смешивание «осветление основы». Радиус 1–60 px задаёт толщину линий. Без нейросетей; JPG, PNG, WebP.",
      en: "Turn photos into pencil sketches via inversion, blur and color-dodge blending. A 1–60 px radius sets line thickness. No AI involved; JPG, PNG, WebP export.",
    },
    lead: {
      ru: "Из снимка получается серый набросок, похожий на рисунок простым карандашом.",
      en: "Your photo becomes a grey sketch that looks drawn with a graphite pencil.",
    },
    math: {
      ru: "Фото переводится в серый, инвертированная копия размывается по Гауссу и смешивается с серым в режиме «осветление основы» (color dodge); радиус 1–60 px управляет мягкостью и толщиной линий.",
      en: "The photo is converted to grey, an inverted copy is Gaussian-blurred and blended back in color-dodge mode; the 1–60 px radius controls line softness and thickness.",
    },
    keywords: {
      ru: [
        "фото в рисунок карандашом онлайн",
        "эффект карандашного рисунка",
        "сделать из фото рисунок",
        "фото в эскиз",
        "скетч из фото онлайн",
        "фото как нарисованное",
      ],
      en: [
        "photo to pencil sketch",
        "pencil drawing effect online",
        "turn photo into drawing",
        "sketch effect photo",
        "photo to sketch converter",
        "make picture look drawn",
      ],
    },
    paragraphs: {
      ru: [
        "Там, где яркость резко меняется, режим color dodge оставляет тёмные штрихи, а ровные участки уходят в белый, как чистая бумага. Малый радиус (2–5 px) даёт тонкие, графичные линии; 15–30 px — мягкий, растушёванный рисунок с тенями.",
        "Лучше всего получаются снимки с чёткими контурами: портреты при хорошем свете, архитектура, животные. Шумные ночные фото дают много лишних штрихов — перед обработкой их полезно слегка размыть. Результат всегда в оттенках серого.",
      ],
      en: [
        "Wherever brightness changes sharply, color dodge leaves dark strokes, while flat areas go white like blank paper. A small radius (2–5 px) gives thin, graphic lines; 15–30 px gives a soft, smudged drawing with shading.",
        "Photos with clear outlines work best: well-lit portraits, architecture, animals. Noisy night shots produce lots of stray strokes, so blur them slightly first. The result is always grayscale.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Это делает нейросеть?",
          a: "Нет, это обычная математика над пикселями: перевод в серый, инверсия, размытие и смешивание слоёв. Результат предсказуем и повторяем, но это не «нарисованная от руки» картинка — фильтр подчёркивает контуры, которые уже есть на фото.",
        },
        {
          q: "Как сделать линии темнее и заметнее?",
          a: "Увеличьте радиус — штрихи станут шире и плотнее. Если рисунок всё равно бледный, обработайте результат фильтром «Контраст» на 130–160 % или немного уменьшите яркость.",
        },
      ],
      en: [
        {
          q: "Is this done by AI?",
          a: "No, it is ordinary pixel math: grayscale, inversion, blur and layer blending. The result is predictable and repeatable, but it is not a hand-drawn picture — the filter emphasizes outlines that already exist in the photo.",
        },
        {
          q: "How do I make the lines darker?",
          a: "Increase the radius — strokes get wider and denser. If the drawing is still pale, run it through the Contrast filter at 130–160% or lower the brightness a little.",
        },
      ],
    },
  },

  /* ── Film grain (noise) ── */
  {
    id: "noise",
    name: { ru: "Зерно (шум)", en: "Film Grain" },
    title: {
      ru: "Добавить шум на фото онлайн — эффект плёночного зерна",
      en: "Add Noise to Image Online — Film Grain Effect",
    },
    h1: { ru: "Добавить зерно на фото", en: "Add Film Grain to a Photo" },
    description: {
      ru: "Плёночное зерно: монохромный шум силой 0–100, одинаковый при каждом экспорте. Маскирует полосы на градиентах и добавляет аналоговый вид. JPG, PNG, WebP.",
      en: "Film grain: monochrome noise with an amount of 0–100 that comes out identical on every export. Masks gradient banding and adds an analog look.",
    },
    lead: {
      ru: "На снимок ложится мелкое монохромное зерно, как на фотографиях, снятых на плёнку.",
      en: "Fine monochrome grain is laid over the picture, like on photos shot on film.",
    },
    math: {
      ru: "К каждому пикселю добавляется одно и то же псевдослучайное число во всех трёх каналах (монохромный шум, близкий к нормальному распределению); генератор с фиксированным начальным значением даёт одинаковый результат при каждом экспорте.",
      en: "The same pseudo-random value is added to all three channels of each pixel (monochrome, roughly normally distributed noise); a generator with a fixed seed gives the same result on every export.",
    },
    keywords: {
      ru: [
        "добавить шум на фото",
        "эффект зерна онлайн",
        "пленочное зерно на фото",
        "зернистость фото онлайн",
        "шум на картинку",
        "film grain эффект",
      ],
      en: [
        "add noise to image",
        "film grain effect online",
        "grain filter photo",
        "add grain to photo",
        "noise effect picture",
        "analog film look",
      ],
    },
    paragraphs: {
      ru: [
        "Шум монохромный: цветных пятнышек нет, меняется только яркость отдельных пикселей — так выглядит плёночное зерно. Значения 10–25 дают еле заметную фактуру, 40–60 — отчётливое зерно, выше — грубый шум.",
        "Небольшое зерно полезно и практически: оно маскирует ступенчатые полосы на небе и гладких градиентах. Шум накладывается на каждый пиксель полного разрешения, поэтому на большом снимке, уменьшенном до размера экрана, он выглядит мельче, чем в превью.",
      ],
      en: [
        "The noise is monochrome: there are no colored specks, only the brightness of individual pixels changes, which is how film grain looks. Values of 10–25 give a barely visible texture, 40–60 clear grain, higher values coarse noise.",
        "A little grain is practical too: it masks the stepped bands in skies and smooth gradients. Noise is added to every full-resolution pixel, so on a large photo viewed at screen size it looks finer than in the preview.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему в скачанном файле зерно мельче, чем в превью?",
          a: "Превью считается в уменьшенном размере, и одно «зерно» там занимает больше площади кадра. В итоговом файле шум ложится на каждый пиксель полного разрешения, поэтому при просмотре целиком он выглядит тоньше. Если нужен крупный заметный эффект, добавьте силы.",
        },
        {
          q: "Зачем зерну быть одинаковым при каждом экспорте?",
          a: "Чтобы результат был воспроизводимым: тот же файл с теми же настройками всегда даёт тот же рисунок шума, и превью не «мигает» при каждом движении ползунка. Следствие — у снимков одинакового размера в пакете рисунок зерна совпадает.",
        },
        {
          q: "Увеличится ли размер файла?",
          a: "Да, и иногда заметно: случайный шум плохо сжимается, поэтому JPG и особенно PNG с зерном весят больше исходника. Если вес важен, держите силу пониже или сохраняйте в JPG с качеством 80–85.",
        },
      ],
      en: [
        {
          q: "Why is the grain finer in the downloaded file than in the preview?",
          a: "The preview is computed at a reduced size, where one grain covers a larger share of the frame. In the exported file noise is added to every full-resolution pixel, so it looks finer when you view the whole image. Increase the amount if you want a bolder effect.",
        },
        {
          q: "Why is the grain identical on every export?",
          a: "So the result is reproducible: the same file with the same settings always gets the same noise pattern, and the preview doesn’t flicker as you move the slider. A side effect is that photos of the same size in a batch share the same grain pattern.",
        },
        {
          q: "Will the file get bigger?",
          a: "Yes, sometimes noticeably: random noise compresses poorly, so a JPG and especially a PNG with grain weigh more than the original. If size matters, keep the amount low or save as JPG at quality 80–85.",
        },
      ],
    },
  },

  /* ── Warm ── */
  {
    id: "warm",
    name: { ru: "Тёплый", en: "Warm" },
    title: {
      ru: "Тёплый фильтр для фото онлайн — теплее баланс белого",
      en: "Warm Photo Filter Online — Warmer White Balance",
    },
    h1: { ru: "Сделать фото теплее", en: "Make a Photo Warmer" },
    description: {
      ru: "Тёплый фильтр сдвигает баланс белого: больше красного, чуть больше зелёного, меньше синего. Сила 0–100 убирает синеву снимков в тени и в пасмурную погоду.",
      en: "The warm filter shifts white balance: more red, a touch more green, less blue. Strength 0–100 fixes bluish shots taken in shade or on overcast days.",
    },
    lead: {
      ru: "Снимок получает золотистый, «закатный» оттенок, а холодная синева уходит.",
      en: "Your photo gets a golden, sunset-like tint and the cold blue cast goes away.",
    },
    math: {
      ru: "К каждому пикселю добавляется до +28 к красному и до +6 к зелёному и вычитается до 28 из синего (по шкале 0–255) — пропорционально силе 0–100.",
      en: "Each pixel gets up to +28 red and +6 green and loses up to 28 blue (on the 0–255 scale), in proportion to the strength 0–100.",
    },
    keywords: {
      ru: [
        "сделать фото теплее",
        "теплый фильтр для фото",
        "изменить баланс белого онлайн",
        "убрать синеву с фото",
        "теплые тона на фото",
        "золотистый оттенок фото",
      ],
      en: [
        "warm photo filter",
        "make photo warmer",
        "warm tone photo online",
        "fix blue photo",
        "warm white balance",
        "golden hour filter",
      ],
    },
    paragraphs: {
      ru: [
        "Камеры телефонов нередко ошибаются с балансом белого в тени, в пасмурную погоду и на снегу: кадр выходит синеватым. Сила 30–50 возвращает естественные тёплые тона коже и дереву, 70–100 даёт выраженный эффект «золотого часа».",
        "Сдвиг одинаков для всех пикселей, поэтому белый фон тоже станет кремовым. Для товарных фото, где важен точный цвет, используйте малые значения и сверяйтесь со сравнением до/после.",
      ],
      en: [
        "Phone cameras often get white balance wrong in shade, on overcast days and in snow, leaving the frame bluish. A strength of 30–50 brings back natural warm tones in skin and wood; 70–100 gives a strong golden-hour effect.",
        "The shift is the same for every pixel, so a white background turns creamy too. For product photos where exact color matters, use small values and check the before/after comparison.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как убрать синеву с фото?",
          a: "Это как раз задача тёплого фильтра: он добавляет красного и вычитает синий. Начните с 30–40 и увеличивайте, пока белые и серые предметы в кадре не станут нейтральными. Если снимок ещё и тусклый, дополнительно поднимите контраст.",
        },
        {
          q: "Почему белый фон стал желтоватым?",
          a: "Фильтр сдвигает все пиксели одинаково: у чисто белого красный уже на максимуме, а синий уменьшается, и белый уходит в кремовый. Если фон должен остаться белым, уменьшите силу.",
        },
      ],
      en: [
        {
          q: "How do I remove a blue cast from a photo?",
          a: "That is exactly what the warm filter is for: it adds red and subtracts blue. Start at 30–40 and increase until white and grey objects in the frame look neutral. If the shot is also dull, add some contrast afterwards.",
        },
        {
          q: "Why did the white background turn yellowish?",
          a: "The filter shifts every pixel equally: pure white already has maximum red, so only blue drops and white drifts toward cream. If the background must stay white, lower the strength.",
        },
      ],
    },
  },

  /* ── Cool ── */
  {
    id: "cool",
    name: { ru: "Холодный", en: "Cool" },
    title: {
      ru: "Холодный фильтр для фото онлайн — голубые тона",
      en: "Cool Photo Filter Online — Bluer White Balance",
    },
    h1: { ru: "Сделать фото холоднее", en: "Make a Photo Cooler" },
    description: {
      ru: "Холодный фильтр сдвигает баланс белого: больше синего, меньше красного и чуть меньше зелёного. Сила 0–100 убирает желтизну от ламп накаливания. JPG, PNG, WebP.",
      en: "The cool filter shifts white balance: more blue, less red and a touch less green. Strength 0–100 removes the yellow cast of warm indoor light. JPG, PNG, WebP.",
    },
    lead: {
      ru: "Снимок становится прохладнее: желтизна от ламп уходит, появляются голубые, «зимние» оттенки.",
      en: "Your photo gets cooler: the yellow cast from lamps fades and blue, wintry tones appear.",
    },
    math: {
      ru: "К каждому пикселю добавляется до +28 к синему, а из красного вычитается до 28 и из зелёного до 6 (по шкале 0–255) — пропорционально силе 0–100.",
      en: "Each pixel gets up to +28 blue and loses up to 28 red and 6 green (on the 0–255 scale), in proportion to the strength 0–100.",
    },
    keywords: {
      ru: [
        "сделать фото холоднее",
        "холодный фильтр для фото",
        "убрать желтизну с фото",
        "голубой оттенок фото",
        "холодные тона онлайн",
        "исправить желтое фото",
      ],
      en: [
        "cool photo filter",
        "make photo cooler",
        "remove yellow tint from photo",
        "blue tone photo",
        "cold color filter",
        "fix yellow photo",
      ],
    },
    paragraphs: {
      ru: [
        "Под лампами накаливания и тёплыми светодиодами фото часто выходит жёлто-оранжевым. Холодный фильтр это компенсирует: при 30–50 кожа и стены возвращаются к нейтральным цветам, при 70–100 появляется заметный голубой тон для зимних, ночных и «технологичных» кадров.",
        "Это обратная операция к тёплому фильтру: если вы перестарались с теплом, холодный фильтр той же силы почти полностью его отменит — кроме участков, которые уже упёрлись в белый.",
      ],
      en: [
        "Under incandescent bulbs and warm LEDs photos often come out yellow-orange. The cool filter compensates: at 30–50 skin and walls return to neutral colors, and at 70–100 a clear blue tone appears for winter, night or high-tech shots.",
        "It is the exact opposite of the warm filter: if you overdid the warmth, a cool filter of the same strength cancels it almost completely — except for areas that were already clipped to white.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как убрать желтизну с фото, снятого дома вечером?",
          a: "Начните с 40–60 и смотрите на предметы, которые должны быть белыми или серыми: стены, бумагу, рубашку. Как только они перестанут быть жёлтыми, остановитесь — дальше кадр начнёт синеть.",
        },
        {
          q: "Можно ли сделать холодный «киношный» стиль?",
          a: "Частично: холодный фильтр на 60–80 и затем снижение насыщенности дают сдержанный голубоватый тон. Раздельной тонировки теней и светов — например, бирюзовые тени при тёплой коже — здесь нет, для неё нужен графический редактор.",
        },
      ],
      en: [
        {
          q: "How do I remove the yellow cast from an evening photo at home?",
          a: "Start at 40–60 and watch things that should be white or grey — walls, paper, a shirt. Once they stop looking yellow, stop; beyond that the frame turns blue.",
        },
        {
          q: "Can I get a cold cinematic look?",
          a: "Partly: the cool filter at 60–80 followed by lower saturation gives a restrained bluish tone. Split toning of shadows and highlights — teal shadows with warm skin, for example — is not available here and needs a photo editor.",
        },
      ],
    },
  },
];
