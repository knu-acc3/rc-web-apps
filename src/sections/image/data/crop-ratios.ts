import type { CropRatio } from "./types";

export const CROP_RATIOS: CropRatio[] = [
  {
    slug: "1-1",
    ratio: [1, 1],
    name: { ru: "1:1", en: "1:1" },
    title: {
      ru: "Обрезать фото 1:1 онлайн — квадратное кадрирование",
      en: "Crop Image to 1:1 — Square Aspect Ratio",
    },
    h1: {
      ru: "Обрезать фото 1:1 (квадрат)",
      en: "Crop an Image to a 1:1 Square",
    },
    description: {
      ru: "Квадратная рамка 1:1 для аватарок, постов Instagram, фото товаров и иконок: перетащите её, задайте ширину в px и сохраните в JPG, PNG или WebP.",
      en: "A square 1:1 frame for avatars, Instagram posts, product shots and icons: drag it into place, set the width in px and save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 1:1 — вы выбираете, какой квадрат из фото оставить.",
      en: "The crop frame is locked to 1:1 — you choose which square of the photo to keep.",
    },
    keywords: {
      ru: [
        "обрезать фото квадратом",
        "обрезать фото 1:1",
        "квадратное фото онлайн",
        "обрезать фото для аватарки",
        "кадрировать фото в квадрат",
        "фото 1 к 1",
      ],
      en: [
        "crop image to square",
        "crop photo 1:1",
        "square crop online",
        "crop profile picture",
        "1:1 aspect ratio crop",
        "make image square by cropping",
      ],
    },
    paragraphs: {
      ru: [
        "Квадрат — самый универсальный формат для аватарок и фото профиля, карточек товаров, обложек альбомов и подкастов. Большинство сервисов показывают аватар кругом, поэтому при обрезке 1:1 держите лицо в центре рамки.",
        "Рамку можно двигать мышью, пальцем или стрелками на клавиатуре, а размер менять за 8 маркеров или клавишами Shift+стрелки. Сетка по правилу третей помогает выстроить композицию. Для точного результата введите ширину в пикселях — высота подставится сама.",
      ],
      en: [
        "The square is the most versatile format for avatars and profile photos, product cards, album art and podcast covers. Most services show avatars as circles, so keep the face in the centre of a 1:1 crop.",
        "Move the frame with the mouse, a finger or the arrow keys, and resize it with the 8 handles or Shift+arrows. The rule-of-thirds grid helps with composition. For a precise result, type the width in pixels — the height follows automatically.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать квадратное фото, не обрезая его?",
          a: "Обрезка всегда отбрасывает часть кадра. Если нужно сохранить снимок целиком, воспользуйтесь инструментом «Квадратное фото»: он дополняет изображение до квадрата полями цвета или размытым фоном.",
        },
        {
          q: "Какого размера будет квадрат после обрезки?",
          a: "Таким, какой вы задали рамкой: самый большой квадрат равен короткой стороне фото. Для конкретного размера, например 1080×1080, введите ширину в пикселях или уменьшите результат инструментом изменения размера.",
        },
        {
          q: "Ухудшается ли качество при обрезке?",
          a: "Сама обрезка качество не меняет — лишние пиксели просто отбрасываются. Небольшие потери возможны только при повторном сохранении в JPG или WebP; чтобы полностью их исключить, сохраните результат в PNG.",
        },
      ],
      en: [
        {
          q: "How do I make a photo square without cropping it?",
          a: "Cropping always discards part of the frame. To keep the whole shot, use the “Make square” tool instead: it pads the image to a square with a colour or a blurred background.",
        },
        {
          q: "What size will the square be after cropping?",
          a: "Whatever you set with the frame: the largest possible square equals the photo’s shorter side. For a specific size such as 1080×1080, type the width in pixels or downscale the result with the resize tool.",
        },
        {
          q: "Does cropping reduce quality?",
          a: "Cropping itself doesn’t change quality — the extra pixels are simply discarded. Minor losses can only come from re-saving as JPG or WebP; to avoid them entirely, save the result as PNG.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соцсети", "аватарки, фото профиля, пост Instagram 1:1"],
        ["Магазины и маркетплейсы", "фото товаров, каталоги"],
        ["Музыка и подкасты", "обложки альбомов и выпусков"],
        ["Иконки", "favicon, иконки приложений"],
      ],
      en: [
        ["Social media", "avatars, profile photos, 1:1 Instagram posts"],
        ["Shops and marketplaces", "product photos, catalogues"],
        ["Music and podcasts", "album and episode cover art"],
        ["Icons", "favicons, app icons"],
      ],
    },
    sizes: [
      [180, 180, { ru: "apple-touch-icon", en: "apple-touch-icon" }],
      [400, 400, { ru: "фото профиля X (Twitter)", en: "X (Twitter) profile photo" }],
      [500, 500, { ru: "аватар WhatsApp", en: "WhatsApp profile photo" }],
      [640, 640, { ru: "аватар Telegram", en: "Telegram avatar" }],
      [1080, 1080, { ru: "пост Instagram", en: "Instagram post" }],
      [3000, 3000, { ru: "обложка подкаста", en: "podcast cover art" }],
    ],
  },
  {
    slug: "4-3",
    ratio: [4, 3],
    name: { ru: "4:3", en: "4:3" },
    title: {
      ru: "Обрезать фото 4:3 онлайн — формат камеры телефона",
      en: "Crop Image to 4:3 — Standard Photo Aspect Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 4:3",
      en: "Crop an Image to 4:3",
    },
    description: {
      ru: "Рамка 4:3 — стандарт матриц смартфонов и компактных камер, старых мониторов и iPad. Кадрируйте фото, задайте размер в px и сохраните в JPG, PNG или WebP.",
      en: "A 4:3 frame — the native shape of smartphone and compact camera sensors, older monitors and iPads. Crop, set an exact size in px, save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 4:3 — горизонтальный кадр, как у большинства фото со смартфона.",
      en: "The crop frame is locked to 4:3 — a landscape frame like most smartphone photos.",
    },
    keywords: {
      ru: [
        "обрезать фото 4:3",
        "формат 4 3 онлайн",
        "кадрировать фото 4 на 3",
        "соотношение сторон 4:3",
        "обрезать 16:9 в 4:3",
      ],
      en: [
        "crop image 4:3",
        "4:3 aspect ratio crop",
        "crop photo to 4 by 3",
        "convert 16:9 to 4:3 crop",
        "4:3 crop online",
      ],
    },
    paragraphs: {
      ru: [
        "Формат 4:3 — стандарт матриц смартфонов и компактных камер: основная камера телефона по умолчанию снимает именно в этих пропорциях. Он же был стандартом телевизоров и мониторов до перехода на 16:9, а у классических iPad экран 4:3.",
        "Обрезка до 4:3 пригодится, чтобы привести к одному формату фото с разных устройств или подготовить кадр для слайдов 4:3. Для точного размера введите ширину и высоту рамки в пикселях; вертикальный вариант того же формата — 3:4.",
      ],
      en: [
        "4:3 is the native shape of smartphone and compact camera sensors: a phone’s main camera shoots in this ratio by default. It was also the standard for TVs and monitors before 16:9 took over, and classic iPads have 4:3 screens.",
        "Cropping to 4:3 helps bring photos from different devices to one format or prepare a frame for 4:3 slides. For an exact size, type the frame’s width and height in pixels; the vertical version of the format is 3:4.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему фото с телефона 4:3, а экран 16:9?",
          a: "Матрица камеры телефона имеет пропорции 4:3 — так используется вся её площадь. Режим 16:9 в камере — это обрезка того же кадра сверху и снизу, поэтому он даёт меньше пикселей.",
        },
        {
          q: "Как обрезать фото 16:9 до 4:3?",
          a: "Поставьте рамку 4:3 — она займёт всю высоту снимка, а по бокам останутся отрезанные полосы. Сдвиньте рамку влево или вправо, чтобы выбрать нужную часть кадра.",
        },
      ],
      en: [
        {
          q: "Why are phone photos 4:3 when screens are 16:9?",
          a: "Phone camera sensors are 4:3, so shooting in that ratio uses the whole sensor. The 16:9 mode in the camera app crops the same frame at the top and bottom, giving fewer pixels.",
        },
        {
          q: "How do I crop a 16:9 image to 4:3?",
          a: "Set the frame to 4:3 — it takes the full height of the image, leaving strips at the sides to be cut. Slide the frame left or right to choose which part to keep.",
        },
      ],
    },
    facts: {
      ru: [
        ["Камеры", "смартфоны, компактные камеры, Micro Four Thirds"],
        ["Экраны", "старые ТВ и мониторы, классические iPad"],
        ["Презентации", "слайды 4:3"],
        ["Вертикальный вариант", "3:4"],
      ],
      en: [
        ["Cameras", "smartphones, compacts, Micro Four Thirds"],
        ["Screens", "older TVs and monitors, classic iPads"],
        ["Presentations", "4:3 slides"],
        ["Vertical version", "3:4"],
      ],
    },
    sizes: [
      [640, 480, { ru: "VGA", en: "VGA" }],
      [800, 600, { ru: "SVGA", en: "SVGA" }],
      [1024, 768, { ru: "XGA", en: "XGA" }],
      [1600, 1200, { ru: "UXGA", en: "UXGA" }],
      [2048, 1536, { ru: "iPad с экраном Retina", en: "Retina iPad" }],
      [4032, 3024, { ru: "фото смартфона 12 Мп", en: "12 MP smartphone photo" }],
    ],
  },
  {
    slug: "3-4",
    ratio: [3, 4],
    name: { ru: "3:4", en: "3:4" },
    title: {
      ru: "Обрезать фото 3:4 онлайн — вертикальный кадр",
      en: "Crop Image to 3:4 — Portrait Aspect Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 3:4",
      en: "Crop an Image to 3:4 Portrait",
    },
    description: {
      ru: "Вертикальная рамка 3:4 — формат вертикальных фото со смартфона, карточек Wildberries и фото 3×4 см. Кадрируйте и сохраните в JPG, PNG или WebP.",
      en: "A vertical 3:4 frame — the shape of portrait phone photos, Wildberries product cards and 3×4 cm ID photos. Crop and save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 3:4 — вертикальный кадр, как у фото со смартфона, снятого вертикально.",
      en: "The crop frame is locked to 3:4 — a portrait frame like a phone photo taken upright.",
    },
    keywords: {
      ru: [
        "обрезать фото 3:4",
        "вертикальное фото 3 на 4",
        "формат 3:4 онлайн",
        "обрезать фото для вайлдберриз",
        "кадрировать фото 3 к 4",
      ],
      en: [
        "crop image 3:4",
        "3:4 portrait crop",
        "crop photo to 3 by 4",
        "3:4 aspect ratio online",
        "portrait crop for product photos",
      ],
    },
    paragraphs: {
      ru: [
        "3:4 — это повёрнутый формат 4:3: так выглядит фото со смартфона, снятое вертикально. В тех же пропорциях — карточки товаров Wildberries (например, 900×1200 px) и фото на документы 3×4 см.",
        "Обрезка 3:4 удобна, чтобы подготовить фото товара или портрет с нужным запасом над головой, а затем уменьшить его до точного размера. Рамку двигайте мышью или стрелками, а для точности вводите координаты и размер в пикселях.",
      ],
      en: [
        "3:4 is 4:3 turned on its side: it’s what a phone photo taken upright looks like. Wildberries product cards (for example 900×1200 px) and 3×4 cm ID photos use the same shape.",
        "A 3:4 crop is handy for preparing a product shot or a portrait with the right headroom before scaling it to an exact size. Move the frame with the mouse or arrow keys, and type coordinates and size in pixels for precision.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем 3:4 отличается от 4:5?",
          a: "3:4 чуть более вытянутый: при ширине 1080 px высота 1440 против 1350 у 4:5. Для ленты Instagram обычно используют 4:5, а 3:4 чаще нужен для маркетплейсов и вертикальных фото с телефона без обрезки.",
        },
        {
          q: "Как обрезать горизонтальное фото до 3:4?",
          a: "Поставьте рамку 3:4 — она займёт всю высоту снимка, а большая часть ширины будет отрезана. Сдвиньте рамку на главный объект; если края терять нельзя, впишите фото в 3:4 с полями в инструменте изменения размера.",
        },
      ],
      en: [
        {
          q: "How is 3:4 different from 4:5?",
          a: "3:4 is slightly taller: at 1080 px wide it’s 1440 px high versus 1350 for 4:5. Instagram feed posts normally use 4:5, while 3:4 is more common for marketplaces and uncropped vertical phone photos.",
        },
        {
          q: "How do I crop a landscape photo to 3:4?",
          a: "Set the frame to 3:4 — it takes the full height and most of the width is cut away. Slide it onto the subject; if you can’t lose the edges, fit the photo into 3:4 with padding in the resize tool instead.",
        },
      ],
    },
    facts: {
      ru: [
        ["Смартфоны", "вертикальные фото с основной камеры"],
        ["Маркетплейсы", "карточки товаров Wildberries"],
        ["Документы", "фото 3×4 см (30×40 мм)"],
        ["Планшеты", "классические iPad в вертикальной ориентации"],
      ],
      en: [
        ["Smartphones", "vertical photos from the main camera"],
        ["Marketplaces", "Wildberries product cards"],
        ["Documents", "3×4 cm (30×40 mm) ID photos"],
        ["Tablets", "classic iPads held upright"],
      ],
    },
    sizes: [
      [354, 472, { ru: "фото 3×4 см при 300 dpi", en: "3×4 cm photo at 300 dpi" }],
      [768, 1024, { ru: "XGA вертикально", en: "XGA, portrait" }],
      [900, 1200, { ru: "карточка Wildberries", en: "Wildberries product card" }],
      [1080, 1440, { ru: "вертикальный кадр шириной 1080 px", en: "1080 px wide portrait" }],
      [1536, 2048, { ru: "iPad Retina вертикально", en: "Retina iPad, portrait" }],
      [3024, 4032, { ru: "вертикальное фото смартфона 12 Мп", en: "12 MP smartphone photo, portrait" }],
    ],
  },
  {
    slug: "3-2",
    ratio: [3, 2],
    name: { ru: "3:2", en: "3:2" },
    title: {
      ru: "Обрезать фото 3:2 онлайн — формат зеркальных камер",
      en: "Crop Image to 3:2 — DSLR & 35 mm Film Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 3:2",
      en: "Crop an Image to 3:2",
    },
    description: {
      ru: "Рамка 3:2 — пропорции кадра 35-мм плёнки, зеркальных и беззеркальных камер и отпечатка 10×15. Кадрируйте фото и сохраните в JPG, PNG или WebP.",
      en: "A 3:2 frame — the shape of 35 mm film, DSLR and mirrorless cameras and 4×6 prints. Crop your photo precisely and save it as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 3:2 — как у кадра 35-мм плёнки и большинства зеркальных камер.",
      en: "The crop frame is locked to 3:2 — the shape of a 35 mm film frame and most DSLRs.",
    },
    keywords: {
      ru: [
        "обрезать фото 3:2",
        "формат 3 2 онлайн",
        "обрезать фото под печать 10х15",
        "соотношение сторон 3:2",
        "кадрировать фото 3 на 2",
      ],
      en: [
        "crop image 3:2",
        "3:2 aspect ratio crop",
        "crop photo for 4x6 print",
        "crop to 3 by 2",
        "dslr aspect ratio crop",
      ],
    },
    paragraphs: {
      ru: [
        "Соотношение сторон 3:2 пришло из 35-мм плёнки с кадром 36×24 мм. Его унаследовали почти все зеркальные и беззеркальные камеры — и полнокадровые, и с матрицами APS-C, — а также стандартный фотоотпечаток 10×15 см.",
        "Обрезка до 3:2 нужна, чтобы напечатать фото со смартфона (4:3) на 10×15 без неожиданной обрезки в лаборатории или чтобы привести серию снимков с разных камер к одному формату. Вертикальная версия — 2:3.",
      ],
      en: [
        "The 3:2 ratio comes from 35 mm film with its 36×24 mm frame. Almost all DSLR and mirrorless cameras — both full-frame and APS-C — inherited it, as did the standard 4×6 inch photo print.",
        "Cropping to 3:2 lets you print a smartphone photo (4:3) on 4×6 without surprise cropping at the lab, or bring a series of shots from different cameras to one format. The vertical version is 2:3.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как обрезать фото со смартфона под печать 10×15?",
          a: "Выберите рамку 3:2 (или 2:3 для вертикального кадра) — она отрежет узкие полосы сверху и снизу. Разместите рамку так, чтобы ничего важного не попало в срез: лаборатории не придётся подгонять кадр самой.",
        },
        {
          q: "Почему у зеркалок 3:2, а у телефонов 4:3?",
          a: "Зеркальные камеры унаследовали формат кадра 35-мм плёнки, а матрицы компактных камер и смартфонов исторически делали в пропорциях 4:3, как у телевизоров и мониторов своего времени.",
        },
      ],
      en: [
        {
          q: "How do I crop a phone photo for a 4×6 print?",
          a: "Choose the 3:2 frame (or 2:3 for a vertical shot) — it trims thin strips from the top and bottom. Position it so nothing important is cut, and the lab won’t need to fit the frame itself.",
        },
        {
          q: "Why do DSLRs shoot 3:2 while phones shoot 4:3?",
          a: "DSLRs inherited the frame shape of 35 mm film, whereas compact camera and smartphone sensors were historically made 4:3 to match the TVs and monitors of their time.",
        },
      ],
    },
    facts: {
      ru: [
        ["Плёнка", "35-мм кадр 36×24 мм"],
        ["Камеры", "зеркальные и беззеркальные (APS-C, полный кадр)"],
        ["Печать", "10×15 см (4×6 дюймов)"],
        ["Вертикальный вариант", "2:3"],
      ],
      en: [
        ["Film", "35 mm frame, 36×24 mm"],
        ["Cameras", "DSLR and mirrorless (APS-C, full frame)"],
        ["Prints", "4×6 in (10×15 cm)"],
        ["Vertical version", "2:3"],
      ],
    },
    sizes: [
      [1200, 800, { ru: "фото для сайта", en: "web photo" }],
      [1800, 1200, { ru: "печать 10×15 при 300 dpi", en: "4×6 in print at 300 dpi" }],
      [3000, 2000, { ru: "6 Мп", en: "6 MP" }],
      [5472, 3648, { ru: "камера 20 Мп", en: "20 MP camera" }],
      [6000, 4000, { ru: "камера 24 Мп", en: "24 MP camera" }],
    ],
  },
  {
    slug: "2-3",
    ratio: [2, 3],
    name: { ru: "2:3", en: "2:3" },
    title: {
      ru: "Обрезать фото 2:3 онлайн — вертикаль для печати",
      en: "Crop Image to 2:3 — Portrait Print & Pinterest Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 2:3",
      en: "Crop an Image to 2:3 Portrait",
    },
    description: {
      ru: "Вертикальная рамка 2:3 — для пинов Pinterest, постеров и вертикальных отпечатков 10×15. Пропорции вертикального кадра зеркалки. JPG, PNG или WebP.",
      en: "A vertical 2:3 frame for Pinterest pins, posters and portrait 4×6 prints — the shape of a DSLR shot held upright. Save the crop as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 2:3 — вертикальный кадр, как у снимка зеркальной камеры, повёрнутой вертикально.",
      en: "The crop frame is locked to 2:3 — a portrait frame like a DSLR shot taken upright.",
    },
    keywords: {
      ru: [
        "обрезать фото 2:3",
        "формат 2 3 вертикальный",
        "обрезать фото для pinterest",
        "фото для постера 2:3",
        "кадрировать фото 2 на 3",
      ],
      en: [
        "crop image 2:3",
        "2:3 portrait crop",
        "crop photo for pinterest",
        "2:3 poster crop",
        "crop to 2 by 3",
      ],
    },
    paragraphs: {
      ru: [
        "2:3 — повёрнутый формат 3:2: так выглядят вертикальные снимки зеркальных и беззеркальных камер. Эти же пропорции Pinterest рекомендует для пинов (1000×1500 px), а фотолаборатории печатают в них вертикальные 10×15 и постеры 20×30 и 40×60 см.",
        "Вертикальное фото со смартфона (3:4) при обрезке до 2:3 теряет узкие полосы по бокам. Сетка по правилу третей помогает расположить глаза или горизонт на линиях третей.",
      ],
      en: [
        "2:3 is 3:2 turned upright: it’s the shape of vertical DSLR and mirrorless shots. Pinterest recommends the same ratio for pins (1000×1500 px), and photo labs use it for portrait 4×6, 8×12 and 16×24 inch prints.",
        "A vertical smartphone photo (3:4) loses thin strips at the sides when cropped to 2:3. The rule-of-thirds grid helps you place eyes or the horizon on the third lines.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер постера в пропорциях 2:3?",
          a: "Стандартные 2:3 — это 20×30, 40×60 и 60×90 см. При 300 dpi для 20×30 нужно около 2400×3600 px; для больших постеров, которые смотрят издалека, обычно достаточно меньшего разрешения.",
        },
        {
          q: "Как обрезать фото с телефона для Pinterest?",
          a: "Выберите рамку 2:3 — у вертикального снимка 3:4 отрежутся узкие полосы по бокам. Затем при необходимости уменьшите результат до 1000×1500 px пресетом изменения размера.",
        },
      ],
      en: [
        {
          q: "Which poster sizes are 2:3?",
          a: "Common 2:3 sizes are 8×12, 12×18, 16×24 and 24×36 inches. At 300 dpi an 8×12 print needs 2400×3600 px; large posters viewed from a distance usually do fine with lower resolution.",
        },
        {
          q: "How do I crop a phone photo for Pinterest?",
          a: "Choose the 2:3 frame — a vertical 3:4 shot loses thin strips at the sides. Then, if needed, scale the result to 1000×1500 px with the resize preset.",
        },
      ],
    },
    facts: {
      ru: [
        ["Камеры", "вертикальные кадры зеркальных и беззеркальных"],
        ["Pinterest", "рекомендуемые пропорции пина"],
        ["Печать", "10×15, 20×30, 40×60 см вертикально"],
        ["Горизонтальный вариант", "3:2"],
      ],
      en: [
        ["Cameras", "vertical DSLR and mirrorless shots"],
        ["Pinterest", "recommended pin ratio"],
        ["Prints", "4×6, 8×12, 16×24 in portrait"],
        ["Horizontal version", "3:2"],
      ],
    },
    sizes: [
      [800, 1200, { ru: "вертикальное фото для сайта", en: "web portrait image" }],
      [1000, 1500, { ru: "пин Pinterest", en: "Pinterest pin" }],
      [1200, 1800, { ru: "печать 10×15 при 300 dpi", en: "4×6 in print at 300 dpi" }],
      [2400, 3600, { ru: "печать 20×30 см (8×12″) при 300 dpi", en: "8×12 in print at 300 dpi" }],
      [4000, 6000, { ru: "вертикальный кадр 24 Мп", en: "24 MP portrait frame" }],
    ],
  },
  {
    slug: "16-9",
    ratio: [16, 9],
    name: { ru: "16:9", en: "16:9" },
    title: {
      ru: "Обрезать фото 16:9 онлайн — кадрирование под экран",
      en: "Crop Image to 16:9 — Widescreen Aspect Ratio",
    },
    h1: {
      ru: "Обрезать фото 16:9",
      en: "Crop an Image to 16:9",
    },
    description: {
      ru: "Рамка 16:9 — формат экранов, видео, превью YouTube и слайдов. Кадрируйте фото под обои, обложку или кадр видео и сохраните в JPG, PNG или WebP.",
      en: "A 16:9 frame — the shape of screens, video, YouTube thumbnails and slides. Crop a photo for a wallpaper, cover or video frame; save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 16:9 — широкоэкранный формат мониторов, телевизоров и видео.",
      en: "The crop frame is locked to 16:9 — the widescreen format of monitors, TVs and video.",
    },
    keywords: {
      ru: [
        "обрезать фото 16:9",
        "формат 16 9 онлайн",
        "кадрировать фото под экран",
        "обрезать фото для обоев",
        "соотношение сторон 16:9",
        "обрезать вертикальное фото в 16:9",
      ],
      en: [
        "crop image 16:9",
        "16:9 aspect ratio crop",
        "widescreen crop online",
        "crop photo for wallpaper",
        "crop to 16 by 9",
        "crop image for youtube thumbnail",
      ],
    },
    paragraphs: {
      ru: [
        "16:9 — стандарт телевизоров, большинства мониторов и ноутбуков, видео на YouTube и презентаций. В этих пропорциях HD 720p, Full HD 1080p, QHD 1440p и 4K UHD, поэтому кадр 16:9 можно уменьшить до любого из них без повторной обрезки.",
        "Фото с камеры (3:2) и телефона (4:3) уже, чем 16:9, — при обрезке теряются полосы сверху и снизу. Двигайте рамку вверх-вниз, чтобы выбрать, что оставить: небо, передний план или середину.",
      ],
      en: [
        "16:9 is the standard for TVs, most monitors and laptops, YouTube video and presentations. HD 720p, Full HD 1080p, QHD 1440p and 4K UHD all share it, so a 16:9 crop can be scaled to any of them without cropping again.",
        "Camera (3:2) and phone (4:3) photos are narrower than 16:9, so cropping removes strips at the top and bottom. Slide the frame up or down to choose what stays: sky, foreground or the middle.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как обрезать вертикальное фото до 16:9?",
          a: "Рамка 16:9 займёт всю ширину снимка, а сверху и снизу отрежется около двух третей кадра. Если так теряется главное, лучше вписать фото в 16:9 с размытым фоном — это делает инструмент «Квадратное фото» в режиме 16:9.",
        },
        {
          q: "Какой размер у картинки 16:9?",
          a: "Любой, у которого ширина относится к высоте как 16 к 9: 1280×720, 1920×1080, 3840×2160 и так далее. Для точного размера введите ширину рамки в пикселях или уменьшите результат инструментом изменения размера.",
        },
      ],
      en: [
        {
          q: "How do I crop a vertical photo to 16:9?",
          a: "The 16:9 frame spans the full width, and about two-thirds of the height is cut away. If that loses the subject, fit the photo into 16:9 over a blurred background instead — the “Make square” tool does this in 16:9 mode.",
        },
        {
          q: "What size is a 16:9 image?",
          a: "Any size whose width relates to its height as 16 to 9: 1280×720, 1920×1080, 3840×2160 and so on. For an exact size, type the frame width in pixels or downscale the result with the resize tool.",
        },
      ],
    },
    facts: {
      ru: [
        ["Экраны", "ТВ, мониторы, ноутбуки"],
        ["Видео", "YouTube, HD, Full HD, 4K"],
        ["Соцсети", "превью YouTube, пост X (Twitter)"],
        ["Презентации", "стандартные слайды PowerPoint и Google Slides"],
        ["Вертикальный вариант", "9:16"],
      ],
      en: [
        ["Screens", "TVs, monitors, laptops"],
        ["Video", "YouTube, HD, Full HD, 4K"],
        ["Social media", "YouTube thumbnails, X (Twitter) posts"],
        ["Presentations", "default PowerPoint and Google Slides"],
        ["Vertical version", "9:16"],
      ],
    },
    sizes: [
      [1280, 720, { ru: "HD 720p, превью YouTube", en: "HD 720p, YouTube thumbnail" }],
      [1600, 900, { ru: "картинка для поста X", en: "X (Twitter) post image" }],
      [1920, 1080, { ru: "Full HD 1080p", en: "Full HD 1080p" }],
      [2048, 1152, { ru: "шапка YouTube-канала", en: "YouTube channel banner" }],
      [2560, 1440, { ru: "QHD 1440p", en: "QHD 1440p" }],
      [3840, 2160, { ru: "4K UHD", en: "4K UHD" }],
    ],
  },
  {
    slug: "9-16",
    ratio: [9, 16],
    name: { ru: "9:16", en: "9:16" },
    title: {
      ru: "Обрезать фото 9:16 онлайн — для сторис и Reels",
      en: "Crop Image to 9:16 — Vertical Stories & Reels Ratio",
    },
    h1: {
      ru: "Обрезать фото 9:16 (вертикально)",
      en: "Crop an Image to 9:16 Vertical",
    },
    description: {
      ru: "Вертикальная рамка 9:16 для Stories, Reels, Shorts, TikTok и VK Клипов. Выберите часть кадра, задайте размер в px и сохраните в JPG, PNG или WebP.",
      en: "A vertical 9:16 frame for Stories, Reels, Shorts and TikTok. Pick the part of the shot to keep, set the size in px and save it as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 9:16 — вертикальный полноэкранный формат телефона.",
      en: "The crop frame is locked to 9:16 — the full-screen vertical format of phones.",
    },
    keywords: {
      ru: [
        "обрезать фото 9:16",
        "вертикальное фото 9 16",
        "обрезать фото для сторис",
        "формат 9:16 онлайн",
        "кадрировать фото для reels",
        "горизонтальное фото в вертикальное",
      ],
      en: [
        "crop image 9:16",
        "9:16 vertical crop",
        "crop photo for instagram story",
        "crop for tiktok",
        "vertical aspect ratio crop",
        "crop landscape to portrait",
      ],
    },
    paragraphs: {
      ru: [
        "9:16 — повёрнутый 16:9 и основной формат вертикального контента: Stories и Reels в Instagram, Shorts на YouTube, TikTok, VK Клипы, истории в мессенджерах. Кадр в этих пропорциях занимает экран телефона без полей.",
        "Из горизонтального фото в рамку 9:16 попадает меньше половины ширины — обычно это один человек или предмет. Если нужно показать весь кадр, выберите инструмент «Квадратное фото» с форматом 9:16: он добавит поля или размытый фон.",
      ],
      en: [
        "9:16 is 16:9 turned upright and the main format for vertical content: Instagram Stories and Reels, YouTube Shorts, TikTok and messenger stories. A frame in this ratio fills a phone screen without bars.",
        "Less than half the width of a landscape photo fits into a 9:16 frame — usually one person or object. To show the whole shot, use the “Make square” tool in 9:16 mode, which adds padding or a blurred background.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Подойдёт ли 9:16 для обоев на телефон?",
          a: "Не совсем: экраны современных смартфонов вытянуты сильнее — примерно 9:19,5–9:20, поэтому обои 9:16 система обрежет по бокам. Для точной подгонки переключитесь на свободную рамку и введите разрешение своего экрана в пикселях.",
        },
        {
          q: "Как сделать сторис из горизонтального фото?",
          a: "Обрежьте его рамкой 9:16, сдвинув её на главный объект, — останется узкая вертикальная часть. Если нужен весь кадр, вместо обрезки впишите фото в 9:16 с размытым фоном.",
        },
      ],
      en: [
        {
          q: "Is 9:16 right for a phone wallpaper?",
          a: "Not quite: modern smartphone screens are taller, around 9:19.5 to 9:20, so a 9:16 wallpaper gets cropped at the sides. For an exact fit, switch to a free frame and type your screen resolution in pixels.",
        },
        {
          q: "How do I make a story from a landscape photo?",
          a: "Crop it with the 9:16 frame, sliding the frame onto the subject — a narrow vertical slice remains. If you need the whole shot, fit the photo into 9:16 over a blurred background instead of cropping.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соцсети", "Stories, Reels, Shorts, TikTok, VK Клипы"],
        ["Видео", "вертикальные ролики 1080×1920"],
        ["Мессенджеры", "статусы WhatsApp, истории Telegram"],
        ["Горизонтальный вариант", "16:9"],
      ],
      en: [
        ["Social media", "Stories, Reels, Shorts, TikTok"],
        ["Video", "vertical 1080×1920 clips"],
        ["Messengers", "WhatsApp Status, Telegram stories"],
        ["Horizontal version", "16:9"],
      ],
    },
    sizes: [
      [720, 1280, { ru: "HD вертикально", en: "HD, vertical" }],
      [1080, 1920, { ru: "Stories, Reels, Shorts, TikTok", en: "Stories, Reels, Shorts, TikTok" }],
      [1440, 2560, { ru: "QHD вертикально", en: "QHD, vertical" }],
      [2160, 3840, { ru: "4K вертикально", en: "4K, vertical" }],
    ],
  },
  {
    slug: "4-5",
    ratio: [4, 5],
    name: { ru: "4:5", en: "4:5" },
    title: {
      ru: "Обрезать фото 4:5 онлайн — вертикальный пост Instagram",
      en: "Crop Image to 4:5 — Instagram Portrait Ratio",
    },
    h1: {
      ru: "Обрезать фото 4:5 для Instagram",
      en: "Crop an Image to 4:5",
    },
    description: {
      ru: "Рамка 4:5 — самый высокий формат поста в ленте Instagram (1080×1350 px) и пропорции отпечатка 8×10 дюймов. Кадрируйте и сохраните в JPG, PNG, WebP.",
      en: "A 4:5 frame — the tallest Instagram feed format (1080×1350 px) and the shape of an 8×10 inch print. Crop precisely and save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 4:5 — вертикальный формат, который занимает больше всего места в ленте Instagram.",
      en: "The crop frame is locked to 4:5 — the portrait format that takes up the most space in the Instagram feed.",
    },
    keywords: {
      ru: [
        "обрезать фото 4:5",
        "формат 4 5 для инстаграм",
        "обрезать фото для инстаграма вертикально",
        "кадрировать фото 4 на 5",
        "фото 8х10 обрезать",
      ],
      en: [
        "crop image 4:5",
        "4:5 instagram crop",
        "crop photo for instagram portrait",
        "8x10 crop",
        "crop to 4 by 5",
      ],
    },
    paragraphs: {
      ru: [
        "4:5 — предельно вытянутый формат для фото в ленте Instagram: более высокие снимки сервис обрежет сам. Обрезав фото заранее, вы решаете, что останется в кадре. Эти же пропорции подходят для вертикальных постов Facebook.",
        "В печати 4:5 — это отпечаток 8×10 дюймов (20×25 см) и классическая крупноформатная плёнка 4×5 дюймов. Вертикальный снимок с телефона (3:4) при обрезке до 4:5 теряет немного сверху и снизу.",
      ],
      en: [
        "4:5 is the tallest shape Instagram allows for feed photos: anything taller gets cropped by the app. Cropping it yourself means you decide what stays in the frame. The same ratio suits vertical Facebook posts.",
        "In print, 4:5 is the 8×10 inch photo and classic 4×5 inch large-format film. A vertical phone shot (3:4) loses a little at the top and bottom when cropped to 4:5.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как обрезать фото 9:16 до 4:5 для ленты Instagram?",
          a: "Поставьте рамку 4:5 — она займёт всю ширину снимка, а сверху и снизу отрежутся полосы. Сдвиньте рамку так, чтобы лицо или объект оказались ближе к верхней линии третей.",
        },
        {
          q: "Какого размера будет фото 4:5 после обрезки?",
          a: "Размер зависит от исходника: из снимка 3024×4032 получится 3024×3780 px. Instagram всё равно уменьшит его до 1080×1350, поэтому результат можно сразу уменьшить пресетом изменения размера.",
        },
      ],
      en: [
        {
          q: "How do I crop a 9:16 photo to 4:5 for the Instagram feed?",
          a: "Set the frame to 4:5 — it spans the full width and trims strips from the top and bottom. Slide it so the face or subject sits near the upper third line.",
        },
        {
          q: "What size will a 4:5 crop be?",
          a: "It depends on the source: a 3024×4032 photo gives 3024×3780 px. Instagram scales it down to 1080×1350 anyway, so you can shrink the result right away with the resize preset.",
        },
      ],
    },
    facts: {
      ru: [
        ["Instagram", "самый высокий формат поста в ленте"],
        ["Facebook", "вертикальные посты в мобильной ленте"],
        ["Печать", "8×10 дюймов (20×25 см)"],
        ["Горизонтальный вариант", "5:4"],
      ],
      en: [
        ["Instagram", "tallest feed post format"],
        ["Facebook", "vertical posts in the mobile feed"],
        ["Prints", "8×10 in (20×25 cm)"],
        ["Horizontal version", "5:4"],
      ],
    },
    sizes: [
      [800, 1000, { ru: "небольшой вертикальный кадр", en: "small portrait image" }],
      [1080, 1350, { ru: "пост Instagram 4:5", en: "Instagram portrait post" }],
      [1600, 2000, { ru: "крупный вертикальный пост", en: "high-resolution portrait post" }],
      [2400, 3000, { ru: "печать 20×25 см (8×10″) при 300 dpi", en: "8×10 in print at 300 dpi" }],
      [4000, 5000, { ru: "вертикальный кадр 20 Мп", en: "20 MP portrait frame" }],
    ],
  },
  {
    slug: "5-4",
    ratio: [5, 4],
    name: { ru: "5:4", en: "5:4" },
    title: {
      ru: "Обрезать фото 5:4 онлайн — горизонтальный кадр",
      en: "Crop Image to 5:4 — Classic Landscape Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 5:4",
      en: "Crop an Image to 5:4",
    },
    description: {
      ru: "Горизонтальная рамка 5:4 — пропорции отпечатка 10×8 дюймов, крупноформатной плёнки и мониторов 1280×1024. Кадрируйте и сохраните в JPG, PNG, WebP.",
      en: "A landscape 5:4 frame — the shape of 10×8 inch prints, large-format film and 1280×1024 monitors. Crop precisely and save the result as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 5:4 — почти квадратный горизонтальный кадр.",
      en: "The crop frame is locked to 5:4 — a nearly square landscape frame.",
    },
    keywords: {
      ru: [
        "обрезать фото 5:4",
        "формат 5 4 онлайн",
        "кадрировать фото 5 на 4",
        "соотношение сторон 5:4",
        "фото 10х8 обрезать",
      ],
      en: [
        "crop image 5:4",
        "5:4 aspect ratio crop",
        "10x8 print crop",
        "crop to 5 by 4",
        "1280x1024 aspect ratio",
      ],
    },
    paragraphs: {
      ru: [
        "5:4 — самый «квадратный» из распространённых горизонтальных форматов. Его используют отпечатки 10×8 дюймов (25×20 см), листовая плёнка 5×4 дюйма в крупноформатных камерах и мониторы 1280×1024, популярные в 2000-х.",
        "Обрезка до 5:4 хорошо подходит для пейзажей и интерьеров, когда 3:2 кажется слишком вытянутым, а квадрат — слишком тесным. Вертикальная версия этого формата — 4:5.",
      ],
      en: [
        "5:4 is the “squarest” of the common landscape formats. It’s used by 10×8 inch prints, 5×4 inch sheet film in large-format cameras and the 1280×1024 monitors that were popular in the 2000s.",
        "A 5:4 crop suits landscapes and interiors when 3:2 feels too wide and a square too tight. The vertical version of this format is 4:5.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Где используется соотношение сторон 5:4?",
          a: "В фотопечати (10×8 дюймов), в крупноформатной фотографии и на старых мониторах 1280×1024. В соцсетях 5:4 встречается редко, но Instagram примет такой горизонтальный пост без обрезки.",
        },
        {
          q: "Чем 5:4 отличается от 4:3?",
          a: "5:4 ближе к квадрату: 1,25 против 1,33. При одинаковой высоте кадр 5:4 чуть уже, поэтому у фото 4:3 при обрезке до 5:4 отрезаются узкие полосы по бокам.",
        },
      ],
      en: [
        {
          q: "Where is the 5:4 aspect ratio used?",
          a: "In photo printing (10×8 inches), large-format photography and older 1280×1024 monitors. It’s rare on social media, but Instagram accepts a 5:4 landscape post without cropping.",
        },
        {
          q: "How is 5:4 different from 4:3?",
          a: "5:4 is closer to square: 1.25 versus 1.33. At the same height a 5:4 frame is slightly narrower, so cropping a 4:3 photo to 5:4 removes thin strips at the sides.",
        },
      ],
    },
    facts: {
      ru: [
        ["Печать", "10×8 дюймов (25×20 см)"],
        ["Плёнка", "крупноформатная 5×4 дюйма"],
        ["Мониторы", "SXGA 1280×1024"],
        ["Вертикальный вариант", "4:5"],
      ],
      en: [
        ["Prints", "10×8 in (25×20 cm)"],
        ["Film", "5×4 in large format"],
        ["Monitors", "SXGA 1280×1024"],
        ["Vertical version", "4:5"],
      ],
    },
    sizes: [
      [1280, 1024, { ru: "SXGA — мониторы 17–19″", en: "SXGA, 17–19″ monitors" }],
      [1350, 1080, { ru: "горизонталь высотой 1080 px", en: "1080 px tall landscape" }],
      [2560, 2048, { ru: "QSXGA", en: "QSXGA" }],
      [3000, 2400, { ru: "печать 25×20 см (10×8″) при 300 dpi", en: "10×8 in print at 300 dpi" }],
    ],
  },
  {
    slug: "21-9",
    ratio: [21, 9],
    name: { ru: "21:9", en: "21:9" },
    title: {
      ru: "Обрезать фото 21:9 онлайн — сверхширокий формат",
      en: "Crop Image to 21:9 — Ultrawide Cinematic Ratio",
    },
    h1: {
      ru: "Обрезать фото 21:9",
      en: "Crop an Image to 21:9 Ultrawide",
    },
    description: {
      ru: "Сверхширокая рамка 21:9 (≈2,33:1) для обоев ultrawide-мониторов, кинокадров и баннеров. Мониторы «21:9» на деле 2560×1080 и 3440×1440 — чуть шире.",
      en: "An ultrawide 21:9 (≈2.33:1) frame for ultrawide monitor wallpapers, cinematic shots and banners. “21:9” monitors are really 2560×1080 or 3440×1440.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 21:9 (≈2,33:1) — сверхширокий кинематографичный кадр.",
      en: "The crop frame is locked to 21:9 (≈2.33:1) — an ultrawide, cinematic frame.",
    },
    keywords: {
      ru: [
        "обрезать фото 21:9",
        "обои 21:9",
        "формат 21 9 онлайн",
        "обои для широкоформатного монитора",
        "кинематографичный кадр обрезать",
      ],
      en: [
        "crop image 21:9",
        "ultrawide wallpaper crop",
        "21:9 aspect ratio",
        "cinematic crop online",
        "3440x1440 wallpaper",
      ],
    },
    paragraphs: {
      ru: [
        "21:9 — маркетинговое название сверхшироких форматов. Мониторы «21:9» обычно имеют разрешение 2560×1080 (64:27 ≈ 2,37:1) или 3440×1440 (43:18 ≈ 2,39:1), а кинокадр «синемаскоп» — около 2,39:1. Точное 21:9 — это 2,33:1, чуть уже.",
        "Для обоев на ultrawide-монитор разница в пару процентов обычно незаметна: система слегка обрежет края. Если нужен идеально точный размер экрана, переключитесь на свободную рамку и введите ширину и высоту монитора в пикселях.",
        "Обрезка до 21:9 придаёт фото «киношный» вид: из горизонтального снимка 3:2 остаётся около 64 % высоты, поэтому выбирайте кадры с горизонтальной композицией — пейзажи, улицы, панорамы.",
      ],
      en: [
        "21:9 is a marketing name for ultrawide formats. “21:9” monitors usually run at 2560×1080 (64:27 ≈ 2.37:1) or 3440×1440 (43:18 ≈ 2.39:1), and CinemaScope film is about 2.39:1. True 21:9 is 2.33:1, slightly narrower.",
        "For an ultrawide wallpaper the difference of a couple of percent is usually invisible — the system trims the edges a little. If you need the exact screen size, switch to a free frame and type the monitor’s width and height in pixels.",
        "A 21:9 crop gives a photo a cinematic look: about 64% of the height of a 3:2 landscape shot remains, so pick images with horizontal composition — landscapes, streets, panoramas.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какое разрешение у монитора 21:9?",
          a: "Самые распространённые — 2560×1080 и 3440×1440, реже 5120×2160. Ровно 21:9 ни одно из них не является: это округлённое обозначение пропорций ≈2,37–2,39:1.",
        },
        {
          q: "Как сделать обои на ultrawide-монитор?",
          a: "Обрежьте фото рамкой 21:9 или, для точной подгонки, задайте в свободном режиме размер экрана — например, 3440×1440 px. Исходник нужен широкий: из фото 3:2 при этом уходит больше трети высоты.",
        },
      ],
      en: [
        {
          q: "What resolution is a 21:9 monitor?",
          a: "The most common are 2560×1080 and 3440×1440, less often 5120×2160. None of them is exactly 21:9 — it’s a rounded label for ratios of about 2.37–2.39:1.",
        },
        {
          q: "How do I make a wallpaper for an ultrawide monitor?",
          a: "Crop the photo with the 21:9 frame or, for an exact fit, set the screen size in free mode — for example 3440×1440 px. You need a wide source: a 3:2 photo loses more than a third of its height.",
        },
      ],
    },
    facts: {
      ru: [
        ["Мониторы ultrawide", "2560×1080 (≈2,37:1), 3440×1440 (≈2,39:1)"],
        ["Кино", "синемаскоп ≈2,39:1"],
        ["Смартфоны", "отдельные модели с экраном 21:9"],
        ["Точное значение", "21:9 ≈ 2,33:1"],
      ],
      en: [
        ["Ultrawide monitors", "2560×1080 (≈2.37:1), 3440×1440 (≈2.39:1)"],
        ["Cinema", "CinemaScope ≈2.39:1"],
        ["Smartphones", "a few models with 21:9 screens"],
        ["Exact value", "21:9 ≈ 2.33:1"],
      ],
    },
    sizes: [
      [1680, 720, { ru: "ровно 21:9, высота 720 px", en: "exact 21:9, 720 px tall" }],
      [2520, 1080, { ru: "ровно 21:9, близко к мониторам 2560×1080", en: "exact 21:9, close to 2560×1080 monitors" }],
      [3360, 1440, { ru: "ровно 21:9, близко к мониторам 3440×1440", en: "exact 21:9, close to 3440×1440 monitors" }],
      [5040, 2160, { ru: "ровно 21:9, высота 2160 px", en: "exact 21:9, 2160 px tall" }],
    ],
  },
  {
    slug: "3-1",
    ratio: [3, 1],
    name: { ru: "3:1", en: "3:1" },
    title: {
      ru: "Обрезать фото 3:1 онлайн — баннер и шапка профиля",
      en: "Crop Image to 3:1 — Banner & Header Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 3:1",
      en: "Crop an Image to 3:1",
    },
    description: {
      ru: "Вытянутая рамка 3:1 для шапки профиля X (Twitter) 1500×500, баннеров сайта и панорам. Выберите полосу из фото и сохраните её в JPG, PNG или WebP.",
      en: "A long 3:1 frame for X (Twitter) headers (1500×500), website banners and panoramic strips. Pick the band you want from a photo and save as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 3:1 — узкая горизонтальная полоса для баннеров и шапок.",
      en: "The crop frame is locked to 3:1 — a narrow horizontal strip for banners and headers.",
    },
    keywords: {
      ru: [
        "обрезать фото 3:1",
        "обрезать фото для шапки твиттер",
        "баннер 3 к 1",
        "формат 3:1 онлайн",
        "вырезать полосу из фото",
      ],
      en: [
        "crop image 3:1",
        "crop photo for twitter header",
        "3:1 banner crop",
        "crop to 3 by 1",
        "wide banner crop online",
      ],
    },
    paragraphs: {
      ru: [
        "Полоса 3:1 — формат шапки профиля в X (Twitter, 1500×500 px), а также популярная пропорция баннеров на сайтах и в рассылках. Из обычного фото 3:2 в неё попадает ровно половина высоты, из 4:3 — меньше половины.",
        "Двигайте рамку вверх-вниз, чтобы выбрать нужную полосу — горизонт, линию крыш, группу людей. Сетка по правилу третей помогает не разрезать важный объект пополам.",
      ],
      en: [
        "A 3:1 strip is the shape of the X (Twitter) profile header (1500×500 px) and a popular ratio for website and email banners. Exactly half the height of an ordinary 3:2 photo fits into it, and less than half of a 4:3 one.",
        "Slide the frame up or down to pick the band you want — the horizon, a roofline, a group of people. The rule-of-thirds grid helps you avoid slicing an important subject in half.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать шапку для X (Twitter) из фото?",
          a: "Обрежьте фото рамкой 3:1, выбрав нужную полосу, а затем уменьшите результат до 1500×500 px пресетом изменения размера. Учтите, что слева внизу шапку закроет аватар.",
        },
        {
          q: "Можно ли сделать полосу 3:1 из вертикального фото?",
          a: "Можно, но останется очень узкая часть кадра — меньше четверти высоты. Для вертикальных снимков лучше подобрать другой кадр или вписать фото в полосу с полями при изменении размера.",
        },
      ],
      en: [
        {
          q: "How do I make an X (Twitter) header from a photo?",
          a: "Crop the photo with the 3:1 frame, choosing the band you want, then scale the result to 1500×500 px with the resize preset. Remember that the avatar covers the lower-left corner.",
        },
        {
          q: "Can I get a 3:1 strip from a vertical photo?",
          a: "Yes, but only a very thin slice remains — less than a quarter of the height. For vertical shots, pick a different photo or fit it into the strip with padding in the resize tool.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соцсети", "шапка профиля X (Twitter)"],
        ["Сайты", "баннеры и заголовки страниц"],
        ["Фото", "панорамы и пейзажи"],
        ["Из кадра 3:2 остаётся", "половина высоты"],
      ],
      en: [
        ["Social media", "X (Twitter) profile header"],
        ["Websites", "banners and page headers"],
        ["Photography", "panoramas and landscapes"],
        ["Left from a 3:2 frame", "half the height"],
      ],
    },
    sizes: [
      [900, 300, { ru: "небольшой баннер", en: "small banner" }],
      [1200, 400, { ru: "баннер для сайта", en: "website banner" }],
      [1500, 500, { ru: "шапка профиля X (Twitter)", en: "X (Twitter) header" }],
      [1800, 600, { ru: "широкий баннер", en: "wide banner" }],
      [3000, 1000, { ru: "шапка X для экранов Retina (2×)", en: "X header at 2× (Retina)" }],
    ],
  },
  {
    slug: "2-1",
    ratio: [2, 1],
    name: { ru: "2:1", en: "2:1" },
    title: {
      ru: "Обрезать фото 2:1 онлайн — панорама и превью ссылок",
      en: "Crop Image to 2:1 — Panorama Aspect Ratio",
    },
    h1: {
      ru: "Обрезать фото в формате 2:1",
      en: "Crop an Image to 2:1",
    },
    description: {
      ru: "Рамка 2:1 для широких панорам, карточек ссылок X (Twitter) и экранов 18:9. Кадр вдвое шире своей высоты — сохраните его в JPG, PNG или WebP.",
      en: "A 2:1 frame for wide panoramas, X (Twitter) link cards and 18:9 screens. The frame is twice as wide as it is tall — save the crop as JPG, PNG or WebP.",
    },
    lead: {
      ru: "Рамка обрезки зафиксирована в пропорциях 2:1 — горизонтальный кадр вдвое шире своей высоты.",
      en: "The crop frame is locked to 2:1 — a landscape frame twice as wide as it is tall.",
    },
    keywords: {
      ru: [
        "обрезать фото 2:1",
        "формат 2 к 1",
        "панорама 2:1",
        "картинка для карточки twitter размер",
        "соотношение 18:9",
      ],
      en: [
        "crop image 2:1",
        "2:1 aspect ratio crop",
        "2:1 panorama",
        "twitter card image crop",
        "18:9 aspect ratio",
      ],
    },
    paragraphs: {
      ru: [
        "Пропорции 2:1 используют карточки ссылок X с крупной картинкой, экраны смартфонов 18:9 и сферические панорамы 360° в равнопромежуточной проекции. В кино этот формат называют Univisium.",
        "Для обычных фото 2:1 — просто вытянутый горизонтальный кадр: из снимка 3:2 остаётся три четверти высоты. А вот готовую сферическую панораму 360° обрезать не стоит: удалится часть сферы, и просмотрщики покажут её с искажениями.",
      ],
      en: [
        "The 2:1 ratio is used by X link cards with large images, 18:9 smartphone screens and 360° spherical panoramas in equirectangular projection. In cinema the format is known as Univisium.",
        "For ordinary photos 2:1 is simply a wide landscape frame: three-quarters of the height of a 3:2 shot remains. A finished 360° spherical panorama, however, shouldn’t be cropped — part of the sphere would be lost and viewers would show it distorted.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер картинки для карточки ссылки в X (Twitter)?",
          a: "Для карточки с крупной картинкой X использует пропорции 2:1 — например, 1200×600 px. Если на странице указан og:image 1200×630, X покажет его с небольшой обрезкой сверху и снизу.",
        },
        {
          q: "Как сделать панораму 2:1 из обычного фото?",
          a: "Обрежьте широкий снимок рамкой 2:1 — из кадра 3:2 уйдёт четверть высоты, из 4:3 — треть. Панораму из нескольких кадров сначала нужно склеить в отдельной программе: инструмент обрезки снимки не сшивает.",
        },
      ],
      en: [
        {
          q: "What image size does an X (Twitter) link card use?",
          a: "Cards with a large image use a 2:1 ratio — for example 1200×600 px. If your page’s og:image is 1200×630, X shows it with a slight crop at the top and bottom.",
        },
        {
          q: "How do I make a 2:1 panorama from an ordinary photo?",
          a: "Crop a wide shot with the 2:1 frame — a 3:2 frame loses a quarter of its height, a 4:3 one a third. A multi-shot panorama has to be stitched in a separate program first: the crop tool doesn’t stitch images.",
        },
      ],
    },
    facts: {
      ru: [
        ["X (Twitter)", "карточка ссылки с крупной картинкой"],
        ["Смартфоны", "экраны 18:9"],
        ["Панорамы 360°", "равнопромежуточная проекция"],
        ["Кино", "формат Univisium"],
      ],
      en: [
        ["X (Twitter)", "link card with a large image"],
        ["Smartphones", "18:9 screens"],
        ["360° panoramas", "equirectangular projection"],
        ["Cinema", "Univisium format"],
      ],
    },
    sizes: [
      [1200, 600, { ru: "карточка ссылки X (Twitter)", en: "X (Twitter) link card" }],
      [1440, 720, { ru: "экран HD+ 18:9", en: "HD+ 18:9 screen" }],
      [2160, 1080, { ru: "экран FHD+ 18:9", en: "FHD+ 18:9 screen" }],
      [4096, 2048, { ru: "панорама 360° (4K)", en: "360° panorama (4K)" }],
      [8192, 4096, { ru: "панорама 360° (8K)", en: "360° panorama (8K)" }],
    ],
  },
];
