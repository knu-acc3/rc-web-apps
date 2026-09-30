import type { ResizePreset } from "./types";

export const RESIZE_PRESETS: ResizePreset[] = [
  /* ───────────── Social ───────────── */
  {
    slug: "instagram-post",
    group: "social",
    w: 1080,
    h: 1080,
    fit: "cover",
    name: { ru: "Пост Instagram", en: "Instagram post" },
    title: {
      ru: "Размер фото для Instagram — 1080×1080 онлайн",
      en: "Instagram Post Size 1080×1080 — Resize Photo",
    },
    h1: {
      ru: "Изменить размер фото для поста Instagram — 1080×1080",
      en: "Resize a Photo for an Instagram Post (1080×1080)",
    },
    description: {
      ru: "Квадрат 1080×1080 px для ленты Instagram: обрезка по центру или вписывание с полями. Фото шире 1080 px Instagram всё равно уменьшает до этой ширины.",
      en: "Make a 1080×1080 px square for the Instagram feed: crop from the centre or fit with padding. Instagram scales anything wider than 1080 px down anyway.",
    },
    lead: {
      ru: "Фото приводится к квадрату 1080×1080 px — максимальной ширине, в которой Instagram хранит посты в ленте.",
      en: "Your photo becomes a 1080×1080 px square — the largest width Instagram keeps for feed posts.",
    },
    keywords: {
      ru: [
        "размер фото для инстаграм",
        "1080 на 1080 онлайн",
        "квадратное фото для инстаграма",
        "размер поста в инстаграм",
        "изменить размер фото для instagram",
        "фото 1:1 для инстаграм",
      ],
      en: [
        "instagram post size",
        "resize photo for instagram",
        "1080x1080 image resizer",
        "instagram square photo size",
        "make photo 1080x1080",
        "instagram picture size",
      ],
    },
    paragraphs: {
      ru: [
        "Instagram хранит фото в ленте шириной до 1080 px: всё, что крупнее, сервис уменьшает сам, а слишком маленькие снимки растягивает. Подготовив файл 1080×1080 заранее, вы сами решаете, как обрезать и масштабировать кадр, а не оставляете это алгоритму Instagram.",
        "По умолчанию выбран режим «Заполнить и обрезать по центру» — лишнее по краям отрезается. Если в кадре важно всё, переключитесь на «Вписать с полями» и заполните края цветом или размытой копией фото. Можно обработать сразу пачку снимков и скачать их ZIP-архивом.",
        "В сетке профиля превью постов теперь показываются вертикальными прямоугольниками, поэтому у квадрата там срезаются бока. Держите главное ближе к центру кадра.",
      ],
      en: [
        "Instagram stores feed photos at up to 1080 px wide: larger images are scaled down by Instagram itself, and very small ones are stretched. Preparing a 1080×1080 file yourself means you decide how the frame is cropped and scaled instead of leaving it to Instagram’s algorithm.",
        "The default mode is “Fill and crop centre”, which trims whatever sticks out. If everything in the frame matters, switch to “Fit with padding” and fill the edges with a colour or a blurred copy of the photo. You can process a whole batch at once and download a ZIP.",
        "Profile grid thumbnails are now shown as vertical rectangles, so the sides of a square post are trimmed in the grid. Keep the subject close to the centre.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему Instagram ухудшает качество фото?",
          a: "Instagram всегда пережимает загруженные снимки, а фото шире 1080 px ещё и уменьшает своим алгоритмом. Если загрузить готовый JPG 1080×1080, масштабировать его сервису не придётся, и снимок обычно остаётся резче.",
        },
        {
          q: "Как выложить фото в Instagram целиком, без обрезки?",
          a: "Выберите режим «Вписать с полями»: фото целиком поместится в квадрат, а пустые края заполнятся выбранным цветом или размытым фоном из того же снимка. Другой вариант — вертикаль 4:5 (1080×1350) или горизонталь 1080×566.",
        },
        {
          q: "Что будет, если фото меньше 1080 px?",
          a: "По умолчанию инструмент не увеличивает изображения, и маленькое фото останется маленьким. Включите «Разрешить увеличение», если нужен именно 1080×1080, — но деталей от увеличения не прибавится, картинка может стать мягче.",
        },
      ],
      en: [
        {
          q: "Why does Instagram lower the quality of my photos?",
          a: "Instagram always re-compresses uploads and also downscales anything wider than 1080 px with its own algorithm. If you upload a ready 1080×1080 JPG, there is nothing left to rescale, and the photo usually stays sharper.",
        },
        {
          q: "How do I post a whole photo on Instagram without cropping?",
          a: "Choose “Fit with padding”: the entire photo fits inside the square and the empty edges are filled with a colour or a blurred background taken from the same shot. Alternatively, use 4:5 (1080×1350) for vertical shots or 1080×566 for landscape ones.",
        },
        {
          q: "What happens if my photo is smaller than 1080 px?",
          a: "By default the tool never enlarges images, so a small photo stays small. Turn on “Allow enlarging” if you need exactly 1080×1080 — but upscaling adds no detail and the result may look softer.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "1:1"],
        ["Что Instagram делает с крупными фото", "уменьшает до 1080 px по ширине"],
        ["Допустимые пропорции поста", "от 1,91:1 до 4:5"],
        ["Превью в сетке профиля", "вертикальное — бока квадрата срезаются"],
        ["Формат файла", "JPG или PNG"],
      ],
      en: [
        ["Aspect ratio", "1:1"],
        ["What Instagram does with large photos", "scales them down to 1080 px wide"],
        ["Allowed feed post ratios", "from 1.91:1 to 4:5"],
        ["Profile grid thumbnail", "vertical — the sides of a square are trimmed"],
        ["File format", "JPG or PNG"],
      ],
    },
  },
  {
    slug: "instagram-portrait",
    group: "social",
    w: 1080,
    h: 1350,
    fit: "cover",
    name: { ru: "Instagram 4:5", en: "Instagram 4:5" },
    title: {
      ru: "Фото 4:5 для Instagram — размер 1080×1350 онлайн",
      en: "Instagram Portrait Size 1080×1350 (4:5) — Resize",
    },
    h1: {
      ru: "Размер фото 1080×1350 для Instagram (4:5)",
      en: "Resize a Photo to 1080×1350 for Instagram (4:5)",
    },
    description: {
      ru: "Вертикальный пост 4:5 — 1080×1350 px — занимает в ленте Instagram больше места, чем квадрат. Обрезка по центру или поля цветом и размытием, пакетно.",
      en: "A 4:5 portrait post — 1080×1350 px — takes up more of the Instagram feed than a square. Crop from the centre or pad with colour or blur, in batches.",
    },
    lead: {
      ru: "Фото приводится к 1080×1350 px — самому высокому формату, который Instagram разрешает для постов в ленте.",
      en: "Your photo becomes 1080×1350 px — the tallest format Instagram allows for feed posts.",
    },
    keywords: {
      ru: [
        "1080 на 1350",
        "фото 4:5 для инстаграм",
        "вертикальное фото для инстаграм размер",
        "размер вертикального поста в инстаграм",
        "формат 4 5 онлайн",
        "размер фото для карусели инстаграм",
      ],
      en: [
        "instagram portrait size",
        "1080x1350 resize",
        "4:5 instagram photo",
        "instagram vertical post size",
        "resize photo to 4:5",
        "instagram carousel size",
      ],
    },
    paragraphs: {
      ru: [
        "Для постов в ленте Instagram допускает пропорции от 1,91:1 до 4:5. Вертикаль 4:5 — предел: на экране телефона такой пост занимает заметно больше места, чем квадрат, поэтому его часто выбирают для портретов, фото товаров и инфографики.",
        "Более вытянутые снимки — например 9:16 с телефона или 2:3 с фотоаппарата — Instagram при публикации в ленту обрежет до 4:5. Лучше сделать это самому: «Заполнить и обрезать по центру» срежет верх и низ, а «Вписать с полями» сохранит кадр целиком.",
        "В карусели Instagram все слайды приводятся к одному соотношению сторон. Загрузите сразу все фото — каждое получит размер 1080×1350, а результат скачается одним ZIP-архивом.",
      ],
      en: [
        "Instagram allows feed posts from 1.91:1 to 4:5. A 4:5 portrait is the limit: on a phone screen it fills noticeably more space than a square, which is why it’s a common choice for portraits, product shots and infographics.",
        "Taller images — 9:16 from a phone or 2:3 from a camera — are cropped to 4:5 when posted to the feed. It’s better to do it yourself: “Fill and crop centre” trims the top and bottom, while “Fit with padding” keeps the whole frame.",
        "In an Instagram carousel all slides share one aspect ratio. Add all your photos at once — each becomes 1080×1350 and the results download as a single ZIP.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой формат лучше для Instagram: 1:1 или 4:5?",
          a: "Для ленты обычно выгоднее 4:5: пост выше и занимает больше места на экране телефона. Квадрат удобен, если снимок изначально близок к квадрату или вы хотите единообразную сетку.",
        },
        {
          q: "Можно ли выложить фото 9:16 в ленту без обрезки?",
          a: "В ленту — нет: для постов предел 4:5, всё более вытянутое будет обрезано. Обрежьте до 4:5 сами или выберите «Вписать с полями» — тогда кадр поместится целиком, а по бокам появятся поля. Без обрезки 9:16 подходит для Stories и Reels.",
        },
        {
          q: "Как сделать карусель из фото разного размера?",
          a: "Загрузите все фото сразу и примените пресет 1080×1350: каждое будет обрезано по центру или вписано с полями в один и тот же размер. Готовые файлы скачиваются одним ZIP-архивом.",
        },
      ],
      en: [
        {
          q: "Which is better for Instagram: 1:1 or 4:5?",
          a: "For the feed, 4:5 usually wins: the post is taller and takes up more of the phone screen. A square works well when the shot is already close to square or you want a uniform look.",
        },
        {
          q: "Can I post a 9:16 photo to the feed without cropping?",
          a: "Not in the feed: 4:5 is the limit for posts, and anything taller gets cropped. Crop it to 4:5 yourself or choose “Fit with padding” so the whole frame fits with bars at the sides. Uncropped 9:16 is meant for Stories and Reels.",
        },
        {
          q: "How do I make a carousel from photos of different sizes?",
          a: "Add all the photos at once and apply the 1080×1350 preset: each one is cropped from the centre or fitted with padding to exactly the same size. The finished files download as one ZIP.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "4:5"],
        ["Место в ленте", "наибольшее среди форматов постов"],
        ["Где используется", "посты и карусели в ленте"],
        ["Более вытянутые фото", "Instagram обрежет до 4:5"],
      ],
      en: [
        ["Aspect ratio", "4:5"],
        ["Space in the feed", "the most of any post format"],
        ["Used for", "feed posts and carousels"],
        ["Taller photos", "cropped to 4:5 by Instagram"],
      ],
    },
  },
  {
    slug: "instagram-story",
    group: "social",
    w: 1080,
    h: 1920,
    fit: "cover",
    name: { ru: "Сторис Instagram", en: "Instagram story" },
    title: {
      ru: "Размер для сторис Instagram — 1080×1920 онлайн",
      en: "Instagram Story Size 1080×1920 — Resize Photo",
    },
    h1: {
      ru: "Изменить размер фото для сторис Instagram — 1080×1920",
      en: "Resize a Photo for Instagram Stories (1080×1920)",
    },
    description: {
      ru: "Формат 9:16 — 1080×1920 px для Stories, Reels и обложки Reels. Горизонтальное фото можно вписать с размытым фоном вместо обрезки. Пакетно, ZIP.",
      en: "A 9:16 frame — 1080×1920 px for Stories, Reels and Reels covers. Landscape photos can be fitted over a blurred background instead of cropped.",
    },
    lead: {
      ru: "Фото приводится к вертикали 9:16 — 1080×1920 px, во весь экран телефона в Stories и Reels.",
      en: "Your photo becomes a 9:16 vertical, 1080×1920 px — full screen on a phone in Stories and Reels.",
    },
    keywords: {
      ru: [
        "размер сторис инстаграм",
        "1080 на 1920 онлайн",
        "фото для сторис размер",
        "размер обложки reels",
        "формат 9:16 для сторис",
        "горизонтальное фото в сторис",
      ],
      en: [
        "instagram story size",
        "1080x1920 resize",
        "resize photo for instagram story",
        "reels cover size",
        "9:16 photo resizer",
        "instagram story dimensions",
      ],
    },
    paragraphs: {
      ru: [
        "Stories и Reels показываются во весь экран, поэтому пропорции 9:16 — единственный вариант без полей и без обрезки со стороны Instagram. Тот же размер подходит для обложки Reels, а также для Shorts, TikTok, VK Клипов и статусов WhatsApp.",
        "Сверху поверх истории выводятся аватар и полоса прогресса, снизу — поле ответа и кнопки. Текст, лица и логотипы лучше держать не ближе примерно 250 px к верхнему и нижнему краю.",
        "Горизонтальный снимок в 9:16 без потерь не превратить: при обрезке уходит больше половины ширины. Альтернатива — «Вписать с полями» с размытой копией фото на фоне: кадр целиком окажется в центре экрана.",
      ],
      en: [
        "Stories and Reels are shown full screen, so 9:16 is the only ratio that gets neither bars nor cropping on Instagram’s side. The same size works for a Reels cover and for Shorts, TikTok and WhatsApp Status.",
        "The profile picture and progress bar sit on top of a story, and the reply field and buttons at the bottom. Keep text, faces and logos roughly 250 px away from the top and bottom edges.",
        "A landscape shot can’t become 9:16 without losing something: cropping removes more than half the width. The alternative is “Fit with padding” with a blurred copy of the photo behind it, which keeps the whole frame in the middle of the screen.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему Instagram обрезает фото в сторис?",
          a: "Если снимок не 9:16, Instagram либо увеличивает его и срезает края, либо добавляет фон на своё усмотрение. Подготовьте файл 1080×1920 заранее — тогда в историю попадёт ровно тот кадр, который вы выбрали.",
        },
        {
          q: "Где безопасная зона в сторис Instagram?",
          a: "Официальной разметки Instagram не публикует, но на практике верхние и нижние ≈250 px перекрываются аватаром, полосой прогресса и полем ответа. Важный текст и лица держите в средней части кадра — примерно 1080×1420 px.",
        },
        {
          q: "Какой размер обложки для Reels?",
          a: "Обложку Reels готовьте в том же размере 1080×1920. В сетке профиля Instagram показывает только центральную часть кадра, поэтому заголовок размещайте посередине.",
        },
      ],
      en: [
        {
          q: "Why does Instagram crop my photo in Stories?",
          a: "If the image isn’t 9:16, Instagram either zooms in and cuts off the edges or adds a background of its own choosing. Prepare a 1080×1920 file beforehand and the story shows exactly the frame you picked.",
        },
        {
          q: "Where is the safe zone in an Instagram story?",
          a: "Instagram doesn’t publish an official template, but in practice the top and bottom ≈250 px are covered by the profile picture, progress bar and reply field. Keep important text and faces in the middle area — roughly 1080×1420 px.",
        },
        {
          q: "What size is a Reels cover?",
          a: "Make the Reels cover 1080×1920 as well. The profile grid shows only the central part of it, so put any title in the middle.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "9:16"],
        ["Где используется", "Stories, Reels, обложка Reels"],
        ["Безопасная зона", "≈250 px сверху и снизу без текста — рекомендация"],
        ["Подходит также для", "Shorts, TikTok, VK Клипов, статусов WhatsApp"],
      ],
      en: [
        ["Aspect ratio", "9:16"],
        ["Used for", "Stories, Reels, Reels covers"],
        ["Safe zone", "keep ≈250 px at the top and bottom clear — guidance"],
        ["Also fits", "Shorts, TikTok, WhatsApp Status"],
      ],
    },
  },
  {
    slug: "instagram-landscape",
    group: "social",
    w: 1080,
    h: 566,
    fit: "cover",
    name: { ru: "Instagram горизонт", en: "Instagram landscape" },
    title: {
      ru: "Горизонтальное фото для Instagram — 1080×566",
      en: "Instagram Landscape Size 1080×566 — Resize Photo",
    },
    h1: {
      ru: "Горизонтальное фото для Instagram: размер 1080×566",
      en: "Resize a Landscape Photo for Instagram (1080×566)",
    },
    description: {
      ru: "Пропорции 1,91:1 — 1080×566 px, самый широкий формат поста в ленте Instagram. Панорамы и кадры 16:9 обрезаются по центру или вписываются с полями.",
      en: "A 1.91:1 frame — 1080×566 px, the widest post format in the Instagram feed. Panoramas and 16:9 shots are cropped from the centre or fitted with padding.",
    },
    lead: {
      ru: "Фото приводится к 1080×566 px — самому широкому формату, который Instagram показывает в ленте без обрезки.",
      en: "Your photo becomes 1080×566 px — the widest format Instagram shows in the feed without cropping.",
    },
    keywords: {
      ru: [
        "горизонтальное фото в инстаграм",
        "1080 на 566",
        "размер горизонтального поста инстаграм",
        "как выложить горизонтальное фото в инстаграм",
        "формат 1,91:1",
        "панорама в инстаграм размер",
      ],
      en: [
        "instagram landscape size",
        "1080x566",
        "horizontal instagram post size",
        "1.91:1 image resize",
        "post landscape photo on instagram",
        "instagram panorama size",
      ],
    },
    paragraphs: {
      ru: [
        "Самые широкие пропорции поста в Instagram — 1,91:1. Всё, что шире, например панорамы, при публикации обрезается по бокам. Кадры 16:9 почти совпадают с этим форматом, поэтому потери у них минимальны.",
        "Горизонтальный пост в ленте более чем в два раза ниже вертикального 4:5 и занимает меньше места на экране. Если важнее заметность, чем полный горизонтальный кадр, рассмотрите квадрат или 4:5 с полями.",
      ],
      en: [
        "The widest ratio Instagram allows for a post is 1.91:1. Anything wider, such as a panorama, is cropped at the sides when posted. 16:9 shots are very close to this format, so they lose almost nothing.",
        "A landscape post is less than half as tall as a 4:5 portrait and takes up less of the screen. If visibility matters more than showing the full wide frame, consider a square or 4:5 with padding.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как выложить панораму в Instagram?",
          a: "Одним постом — только обрезав до 1,91:1 или вписав с полями. Чтобы показать панораму целиком, её разрезают на несколько кадров 1:1 или 4:5 и публикуют каруселью — для этого есть отдельный инструмент разрезки изображения на части.",
        },
        {
          q: "Почему 566 px, а не 565 или 567?",
          a: "1080 / 1,91 ≈ 565,4, поэтому в разных источниках встречаются и 565, и 566 px. Instagram в своих рекомендациях называет 1080×566; разница в один пиксель на результат не влияет.",
        },
      ],
      en: [
        {
          q: "How do I post a panorama on Instagram?",
          a: "As a single post, only by cropping it to 1.91:1 or fitting it with padding. To show the full panorama, split it into several 1:1 or 4:5 slides and post them as a carousel — there’s a separate image-splitting tool for that.",
        },
        {
          q: "Why 566 px and not 565 or 567?",
          a: "1080 / 1.91 ≈ 565.4, so you’ll see both 565 and 566 px quoted. Instagram’s own guidance says 1080×566; a one-pixel difference has no visible effect.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "≈1,91:1"],
        ["Самый широкий формат поста", "да — более широкие фото обрезаются"],
        ["Высота в ленте", "более чем вдвое меньше, чем у 4:5"],
        ["Подходит для", "пейзажей, групповых фото, скриншотов 16:9"],
      ],
      en: [
        ["Aspect ratio", "≈1.91:1"],
        ["Widest post format", "yes — wider photos are cropped"],
        ["Height in the feed", "less than half of a 4:5 post"],
        ["Good for", "landscapes, group shots, 16:9 screenshots"],
      ],
    },
  },
  {
    slug: "facebook-cover",
    group: "social",
    w: 851,
    h: 315,
    fit: "cover",
    name: { ru: "Обложка Facebook", en: "Facebook cover" },
    title: {
      ru: "Обложка Facebook — размер 851×315 онлайн",
      en: "Facebook Cover Photo Size 851×315 — Resize Image",
    },
    h1: {
      ru: "Размер обложки Facebook — 851×315",
      en: "Resize an Image for a Facebook Cover (851×315)",
    },
    description: {
      ru: "851×315 px — рекомендуемый размер обложки страницы Facebook. На компьютере она видна как 820×312, на телефоне — 640×360 с обрезкой по бокам.",
      en: "851×315 px is the recommended Facebook Page cover size. It displays at 820×312 on computers and 640×360 on phones, where the sides are cut off.",
    },
    lead: {
      ru: "Изображение приводится к 851×315 px — этот размер Facebook рекомендует для загрузки обложки страницы.",
      en: "Your image becomes 851×315 px — the size Facebook recommends for uploading a Page cover.",
    },
    keywords: {
      ru: [
        "размер обложки facebook",
        "обложка фейсбук размер",
        "851 на 315",
        "обложка для страницы facebook",
        "размер обложки фейсбук для телефона",
      ],
      en: [
        "facebook cover photo size",
        "facebook cover size",
        "851x315",
        "facebook page cover dimensions",
        "resize image for facebook cover",
        "facebook cover mobile size",
      ],
    },
    paragraphs: {
      ru: [
        "Facebook показывает обложку по-разному: на компьютере — примерно 820×312 px, на смартфоне — 640×360 px. У мобильной версии пропорции ближе к 16:9, поэтому левый и правый края обложки на телефоне не видны.",
        "Отсюда правило: текст, логотип и лица размещайте в центральной части. Для быстрой загрузки Facebook советует JPG в sRGB весом до 100 КБ — после изменения размера файл можно дожать инструментом сжатия с целевым размером.",
      ],
      en: [
        "Facebook displays the cover differently depending on the device: about 820×312 px on computers and 640×360 px on smartphones. The mobile view is closer to 16:9, so the left and right edges of the cover aren’t visible on phones.",
        "Hence the rule: keep text, logos and faces in the central area. For fast loading Facebook suggests an sRGB JPG under 100 KB — after resizing you can squeeze the file with the compression tool’s target-size mode.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему обложка Facebook на телефоне обрезана?",
          a: "На смартфоне область обложки выше и уже, чем на компьютере, — около 640×360 px. Facebook подгоняет картинку по высоте и срезает края: по расчёту из этих размеров пропадает примерно по 150 px с каждой стороны. Держите важное по центру.",
        },
        {
          q: "Как сделать обложку Facebook без потери качества?",
          a: "Загружайте уже готовый файл 851×315 px — тогда Facebook не придётся масштабировать его самому. Для логотипов и надписей выбирайте PNG: JPG даёт ореолы вокруг мелких контрастных деталей.",
        },
        {
          q: "Можно ли сделать обложку из вертикального фото?",
          a: "Можно, но из вертикального кадра в полосу ≈2,7:1 попадёт лишь узкая часть. В режиме «Заполнить и обрезать по центру» останется середина снимка; если нужен весь кадр, выберите «Вписать с полями» с размытым фоном.",
        },
      ],
      en: [
        {
          q: "Why is my Facebook cover cropped on phones?",
          a: "On a smartphone the cover area is taller and narrower than on a computer — about 640×360 px. Facebook fits the image to that height and cuts off the sides; from these numbers, roughly 150 px are lost on each side. Keep the important parts in the centre.",
        },
        {
          q: "How do I make a Facebook cover without losing quality?",
          a: "Upload a file that is already 851×315 px so Facebook doesn’t have to rescale it. For logos and text use PNG: JPG creates halos around small high-contrast details.",
        },
        {
          q: "Can I make a cover from a vertical photo?",
          a: "Yes, but only a narrow strip of a vertical shot fits into a ≈2.7:1 banner. “Fill and crop centre” keeps the middle of the photo; if you need the whole frame, choose “Fit with padding” with a blurred background.",
        },
      ],
    },
    facts: {
      ru: [
        ["На компьютере", "≈820×312 px"],
        ["На смартфоне", "≈640×360 px, бока обрезаются"],
        ["Минимальный размер", "400×150 px"],
        ["Рекомендуемый файл", "JPG, sRGB, до 100 КБ"],
        ["Соотношение сторон", "≈2,7:1"],
      ],
      en: [
        ["On computers", "≈820×312 px"],
        ["On smartphones", "≈640×360 px, sides cut off"],
        ["Minimum size", "400×150 px"],
        ["Recommended file", "JPG, sRGB, under 100 KB"],
        ["Aspect ratio", "≈2.7:1"],
      ],
    },
  },
  {
    slug: "facebook-post",
    group: "social",
    w: 1200,
    h: 630,
    fit: "cover",
    name: { ru: "Пост Facebook", en: "Facebook post" },
    title: {
      ru: "Картинка для поста Facebook — 1200×630 онлайн",
      en: "Facebook Post & Link Image Size 1200×630 — Resize",
    },
    h1: {
      ru: "Размер картинки для Facebook и превью ссылок — 1200×630",
      en: "Resize an Image to 1200×630 for Facebook and Link Previews",
    },
    description: {
      ru: "1200×630 px (1,91:1) — размер картинки к посту Facebook и превью ссылки Open Graph (og:image). Минимум для крупного превью — 600×315 px.",
      en: "1200×630 px (1.91:1) is the image size for Facebook posts and Open Graph link previews (og:image). The minimum for a large preview is 600×315 px.",
    },
    lead: {
      ru: "Изображение приводится к 1200×630 px — стандартному размеру картинки для постов и превью ссылок (og:image).",
      en: "Your image becomes 1200×630 px — the standard size for post images and link previews (og:image).",
    },
    keywords: {
      ru: [
        "размер картинки для поста facebook",
        "1200 на 630",
        "размер og:image",
        "картинка для превью ссылки размер",
        "open graph размер изображения",
        "размер картинки для репоста",
      ],
      en: [
        "facebook post image size",
        "1200x630",
        "og image size",
        "open graph image size",
        "link preview image size",
        "facebook shared link image size",
      ],
    },
    paragraphs: {
      ru: [
        "Когда вы делитесь ссылкой, Facebook берёт картинку из метатега og:image. Для крупного превью он рекомендует не меньше 1200×630 px, а если изображение меньше 600×315 px, ссылка может показаться с маленькой миниатюрой сбоку.",
        "Тот же формат ≈1,91:1 используют ВКонтакте, Telegram, LinkedIn и мессенджеры, поэтому одна картинка 1200×630 подходит для превью почти везде. Текст на ней делайте крупным: в ленте телефона превью заметно уменьшается.",
      ],
      en: [
        "When you share a link, Facebook takes the picture from the og:image meta tag. For a large preview it recommends at least 1200×630 px; below 600×315 px the link may appear with a small thumbnail at the side instead.",
        "VK, Telegram, LinkedIn and messaging apps use the same ≈1.91:1 shape, so a single 1200×630 image works as a preview almost everywhere. Make any text on it large: on a phone the preview is shown quite small.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему Facebook показывает старую картинку у ссылки?",
          a: "Facebook кэширует превью. После замены og:image откройте Sharing Debugger (отладчик репостов) и нажмите «Scrape Again», чтобы данные обновились. Новую картинку надёжнее загрузить на сайт под новым именем файла.",
        },
        {
          q: "Какой формат файла выбрать для og:image?",
          a: "JPG — для фотографий, PNG — для картинок с текстом и графикой. WebP понимают не все сервисы, которые строят превью ссылок, поэтому для og:image надёжнее JPG или PNG.",
        },
        {
          q: "Подойдёт ли 1200×630 для обычного поста с фото?",
          a: "Да, горизонтальное фото 1,91:1 Facebook покажет без обрезки. Но в ленте телефона квадрат или вертикаль 4:5 занимают больше места, так что для обычных фото этот формат не обязателен.",
        },
      ],
      en: [
        {
          q: "Why does Facebook still show the old image for my link?",
          a: "Facebook caches previews. After replacing og:image, open the Sharing Debugger and click “Scrape Again” to refresh it. It’s also safer to upload the new image under a new file name.",
        },
        {
          q: "Which file format should I use for og:image?",
          a: "JPG for photos, PNG for images with text and graphics. Not every service that builds link previews understands WebP, so JPG or PNG is the safer choice for og:image.",
        },
        {
          q: "Is 1200×630 good for a regular photo post?",
          a: "Yes, Facebook shows a 1.91:1 landscape photo uncropped. On a phone, though, a square or 4:5 portrait takes up more of the feed, so this format isn’t required for ordinary photos.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "≈1,91:1"],
        ["Метатег для превью ссылки", "og:image"],
        ["Минимум для крупного превью", "600×315 px"],
        ["Максимальный вес og:image", "8 МБ"],
        ["Где ещё подходит", "VK, Telegram, LinkedIn, мессенджеры"],
      ],
      en: [
        ["Aspect ratio", "≈1.91:1"],
        ["Meta tag for link previews", "og:image"],
        ["Minimum for a large preview", "600×315 px"],
        ["Maximum og:image file size", "8 MB"],
        ["Also works for", "VK, Telegram, LinkedIn, messaging apps"],
      ],
    },
  },
  {
    slug: "youtube-thumbnail",
    group: "social",
    w: 1280,
    h: 720,
    fit: "cover",
    name: { ru: "Превью YouTube", en: "YouTube thumbnail" },
    title: {
      ru: "Превью для YouTube — размер 1280×720 онлайн",
      en: "YouTube Thumbnail Size 1280×720 — Resize Image",
    },
    h1: {
      ru: "Размер превью для YouTube — 1280×720",
      en: "Resize an Image for a YouTube Thumbnail (1280×720)",
    },
    description: {
      ru: "Значок видео YouTube: 1280×720 px, 16:9, минимум 640 px по ширине, файл до 2 МБ в JPG, PNG или GIF. Кадр обрезается по центру или вписывается.",
      en: "YouTube thumbnail: 1280×720 px, 16:9, at least 640 px wide, a JPG, PNG or GIF file up to 2 MB. The frame is cropped from the centre or fitted inside.",
    },
    lead: {
      ru: "Картинка приводится к 1280×720 px — размеру, который YouTube рекомендует для значка (превью) видео.",
      en: "Your image becomes 1280×720 px — the size YouTube recommends for a video thumbnail.",
    },
    keywords: {
      ru: [
        "размер превью для youtube",
        "обложка для видео youtube размер",
        "1280 на 720",
        "размер значка youtube",
        "превью для ютуба онлайн",
        "размер картинки для ютуба",
      ],
      en: [
        "youtube thumbnail size",
        "1280x720 resize",
        "youtube thumbnail dimensions",
        "resize image for youtube thumbnail",
        "youtube thumbnail maker size",
        "youtube thumbnail 2mb",
      ],
    },
    paragraphs: {
      ru: [
        "YouTube называет превью «значком видео» и рекомендует разрешение 1280×720 при минимальной ширине 640 px. Файл — JPG, PNG или GIF весом до 2 МБ, пропорции 16:9: они совпадают с плеером, поэтому значок не обрезается.",
        "Фото сохраняйте в JPG — при 1280×720 он почти всегда весит намного меньше 2 МБ. PNG с фотографией может не пройти по весу; тогда уменьшите файл инструментом сжатия с целевым размером.",
        "В правом нижнем углу значка YouTube выводит длительность ролика — не ставьте туда важный текст.",
      ],
      en: [
        "YouTube recommends 1280×720 for custom thumbnails, with a minimum width of 640 px. The file must be JPG, PNG or GIF up to 2 MB, and the 16:9 shape matches the player, so the thumbnail isn’t cropped.",
        "Save photos as JPG — at 1280×720 it’s almost always far below 2 MB. A PNG of a photo can exceed the limit; if so, shrink it with the compression tool’s target-size mode.",
        "YouTube shows the video length in the bottom-right corner of the thumbnail, so keep important text out of that spot.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему не получается загрузить свой значок на YouTube?",
          a: "Свои значки доступны только подтверждённым аккаунтам — подтвердить канал можно по номеру телефона. Также проверьте вес файла: больше 2 МБ YouTube не примет, и формат — нужен JPG, PNG или GIF.",
        },
        {
          q: "Нужно ли делать превью больше 1280×720?",
          a: "Необязательно: YouTube рекомендует именно 1280×720, а более крупный файл сложнее уложить в 2 МБ. Главное — пропорции 16:9 и ширина не меньше 640 px.",
        },
        {
          q: "Как сделать превью из вертикального кадра?",
          a: "Выберите «Вписать с полями» и размытый фон: весь кадр останется в центре, а по бокам появится его размытая копия. В режиме обрезки из вертикального снимка останется только средняя полоса.",
        },
      ],
      en: [
        {
          q: "Why can’t I upload a custom thumbnail to YouTube?",
          a: "Custom thumbnails are available only to verified accounts — you can verify your channel with a phone number. Also check the file: YouTube rejects anything over 2 MB and accepts only JPG, PNG or GIF.",
        },
        {
          q: "Should a thumbnail be larger than 1280×720?",
          a: "It doesn’t need to be: YouTube recommends exactly 1280×720, and a bigger file is harder to keep under 2 MB. What matters is the 16:9 shape and a width of at least 640 px.",
        },
        {
          q: "How do I make a thumbnail from a vertical shot?",
          a: "Choose “Fit with padding” with a blurred background: the whole frame stays in the centre with a blurred copy on either side. In crop mode only a middle strip of the vertical shot would remain.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Минимальная ширина", "640 px"],
        ["Максимальный размер файла", "2 МБ"],
        ["Форматы", "JPG, PNG, GIF"],
        ["Перекрывается", "длительностью ролика в правом нижнем углу"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Minimum width", "640 px"],
        ["Maximum file size", "2 MB"],
        ["Formats", "JPG, PNG, GIF"],
        ["Covered by", "the video length in the bottom-right corner"],
      ],
    },
  },
  {
    slug: "youtube-banner",
    group: "social",
    w: 2048,
    h: 1152,
    fit: "cover",
    name: { ru: "Шапка YouTube", en: "YouTube banner" },
    title: {
      ru: "Шапка YouTube-канала — размер 2048×1152 онлайн",
      en: "YouTube Banner Size 2048×1152 — Channel Art Resizer",
    },
    h1: {
      ru: "Размер шапки YouTube-канала — 2048×1152",
      en: "Resize an Image for a YouTube Banner (2048×1152)",
    },
    description: {
      ru: "Баннер канала YouTube: от 2048×1152 px, 16:9, до 6 МБ. Текст и логотип — в безопасной зоне 1235×338 px по центру: только она видна на всех устройствах.",
      en: "YouTube channel banner: at least 2048×1152 px, 16:9, up to 6 MB. Put text and logos in the 1235×338 px safe area in the centre — it’s visible everywhere.",
    },
    lead: {
      ru: "Изображение приводится к 2048×1152 px — минимальному размеру, который YouTube рекомендует для баннера канала.",
      en: "Your image becomes 2048×1152 px — the minimum size YouTube recommends for a channel banner.",
    },
    keywords: {
      ru: [
        "размер шапки youtube",
        "шапка для ютуб канала размер",
        "2048 на 1152",
        "баннер youtube размер",
        "безопасная зона шапки youtube",
        "оформление канала youtube размер",
      ],
      en: [
        "youtube banner size",
        "youtube channel art size",
        "2048x1152",
        "youtube banner safe area",
        "resize image for youtube banner",
        "youtube header size",
      ],
    },
    paragraphs: {
      ru: [
        "Баннер канала загружается как картинка 16:9, но целиком её видно только на телевизоре. На компьютере показывается широкая полоса из середины, а на телефоне — ещё более узкая. Поэтому название, логотип и расписание выпусков должны поместиться в центральную область 1235×338 px.",
        "Фото меньше 2048 px по ширине инструмент по умолчанию не увеличивает. Если исходник меньше, включите «Разрешить увеличение», но учтите, что на больших экранах мягкость будет заметна. Вес готового файла — до 6 МБ; JPG такого размера обычно укладывается с запасом.",
      ],
      en: [
        "The channel banner is uploaded as a 16:9 image, but only TVs show all of it. Computers display a wide strip from the middle, and phones an even narrower one. That’s why the channel name, logo and upload schedule must fit into the central 1235×338 px area.",
        "By default the tool doesn’t enlarge photos narrower than 2048 px. If your source is smaller, turn on “Allow enlarging”, but expect some softness on big screens. The finished file must be 6 MB or less — a JPG this size usually fits easily.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему шапка YouTube обрезается на телефоне?",
          a: "YouTube подстраивает баннер под экран: на телефоне остаётся лишь центральная полоса. Гарантированно видна только безопасная зона 1235×338 px в середине — туда и помещайте надписи.",
        },
        {
          q: "Как сделать шапку YouTube из обычной горизонтальной фотографии?",
          a: "Фото 3:2 или 4:3 при подгонке к 16:9 теряет немного сверху и снизу — режим «Заполнить и обрезать по центру» справится. Но на компьютере будет видна только середина кадра, так что выбирайте снимок с главным объектом по центру.",
        },
        {
          q: "Можно ли загрузить шапку больше 2048×1152?",
          a: "Можно: 2048×1152 — это рекомендуемый минимум, и, например, 2560×1440 тоже подходит. Главное — пропорции 16:9 и вес до 6 МБ.",
        },
      ],
      en: [
        {
          q: "Why is my YouTube banner cropped on phones?",
          a: "YouTube adapts the banner to each screen, and phones show only a central strip. The only part guaranteed to be visible is the 1235×338 px safe area in the middle — put your text there.",
        },
        {
          q: "How do I make a YouTube banner from an ordinary landscape photo?",
          a: "A 3:2 or 4:3 photo loses a little at the top and bottom when fitted to 16:9, which “Fill and crop centre” handles fine. Computers, however, show only the middle band, so pick a shot with the subject in the centre.",
        },
        {
          q: "Can I upload a banner larger than 2048×1152?",
          a: "Yes: 2048×1152 is the recommended minimum, and 2560×1440, for example, works too. What matters is the 16:9 ratio and a file size of 6 MB or less.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Максимальный размер файла", "6 МБ"],
        ["Безопасная зона для текста и логотипа", "1235×338 px в центре"],
        ["На телевизоре", "видно всё изображение"],
        ["На компьютере и телефоне", "только полоса по центру"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Maximum file size", "6 MB"],
        ["Safe area for text and logos", "1235×338 px in the centre"],
        ["On TVs", "the whole image is visible"],
        ["On computers and phones", "only a central strip"],
      ],
    },
  },
  {
    slug: "x-header",
    group: "social",
    w: 1500,
    h: 500,
    fit: "cover",
    name: { ru: "Шапка X", en: "X header" },
    title: {
      ru: "Шапка профиля X (Twitter) — размер 1500×500",
      en: "X (Twitter) Header Size 1500×500 — Resize Image",
    },
    h1: {
      ru: "Размер шапки профиля X (Twitter) — 1500×500",
      en: "Resize an Image for an X (Twitter) Header (1500×500)",
    },
    description: {
      ru: "Шапка профиля X (Twitter): 1500×500 px, пропорции 3:1. Фото обрезается по центру; учтите, что аватар закрывает часть картинки слева внизу.",
      en: "X (Twitter) profile header: 1500×500 px, a 3:1 strip. The photo is cropped from the centre; remember that your avatar covers the lower-left part.",
    },
    lead: {
      ru: "Изображение приводится к 1500×500 px — рекомендуемому размеру шапки (header) профиля в X.",
      en: "Your image becomes 1500×500 px — the recommended size for an X profile header.",
    },
    keywords: {
      ru: [
        "размер шапки твиттер",
        "шапка для x размер",
        "1500 на 500",
        "обложка профиля twitter размер",
        "header twitter размер",
      ],
      en: [
        "twitter header size",
        "x header size",
        "1500x500",
        "twitter banner size",
        "resize image for twitter header",
        "x profile banner dimensions",
      ],
    },
    paragraphs: {
      ru: [
        "X рекомендует для шапки профиля 1500×500 px — вытянутую полосу 3:1. Из обычного горизонтального фото 3:2 при этом остаётся ровно половина высоты, из 4:3 — ещё меньше, поэтому выбирайте снимок с главным объектом в середине.",
        "Слева внизу шапку перекрывает круглый аватар, а на разных устройствах картинка может дополнительно обрезаться по краям. Держите текст и логотип в центральной части полосы, подальше от краёв.",
      ],
      en: [
        "X recommends 1500×500 px for the profile header — a long 3:1 strip. From an ordinary 3:2 landscape photo exactly half the height remains, and even less from a 4:3 one, so choose a shot with the subject in the middle.",
        "The round avatar overlaps the lower-left corner, and some devices trim the edges a little more. Keep text and logos in the central part of the strip, away from the edges.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему шапка в X выглядит размытой?",
          a: "Чаще всего загружено слишком маленькое изображение, и X растягивает его до ширины экрана. Подготовьте файл ровно 1500×500 из снимка шириной не меньше 1500 px — тогда увеличивать ничего не придётся.",
        },
        {
          q: "Какое фото лучше подходит для шапки X?",
          a: "Широкие пейзажи, панорамы, фактурные фоны и снимки, где главное находится в середине. Портрет крупным планом в полосу 3:1 вписывается плохо: останется лишь часть лица.",
        },
      ],
      en: [
        {
          q: "Why does my X header look blurry?",
          a: "Usually the uploaded image was too small and X stretched it to the screen width. Prepare an exact 1500×500 file from a photo at least 1500 px wide, so nothing needs to be enlarged.",
        },
        {
          q: "What kind of photo works best for an X header?",
          a: "Wide landscapes, panoramas, textured backgrounds and shots with the subject in the middle. A close-up portrait fits a 3:1 strip badly — only part of the face would remain.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "3:1"],
        ["Где используется", "шапка профиля X (бывший Twitter)"],
        ["Перекрывается", "аватаром в левом нижнем углу"],
        ["Форматы", "JPG, PNG"],
      ],
      en: [
        ["Aspect ratio", "3:1"],
        ["Used for", "X (formerly Twitter) profile header"],
        ["Covered by", "the avatar in the lower-left corner"],
        ["Formats", "JPG, PNG"],
      ],
    },
  },
  {
    slug: "x-post",
    group: "social",
    w: 1600,
    h: 900,
    fit: "cover",
    name: { ru: "Пост X", en: "X post" },
    title: {
      ru: "Картинка для поста X (Twitter) — 1600×900",
      en: "X (Twitter) Post Image Size 1600×900 — Resize",
    },
    h1: {
      ru: "Размер картинки для поста в X (Twitter) — 1600×900",
      en: "Resize an Image for an X (Twitter) Post (1600×900)",
    },
    description: {
      ru: "Горизонтальная картинка 16:9 — 1600×900 px для ленты X (Twitter): одиночное фото показывается целиком. До 4 изображений в посте, фото до 5 МБ.",
      en: "A 16:9 landscape image — 1600×900 px for the X (Twitter) feed, where a single photo is shown in full. Up to 4 images per post, photos up to 5 MB.",
    },
    lead: {
      ru: "Изображение приводится к 1600×900 px — горизонтальному формату 16:9, который X показывает в ленте без обрезки.",
      en: "Your image becomes 1600×900 px — a 16:9 landscape that X shows in the feed without cropping.",
    },
    keywords: {
      ru: [
        "размер картинки для твиттера",
        "размер фото для поста в x",
        "1600 на 900",
        "картинка 16:9 для twitter",
        "изображение для твита размер",
      ],
      en: [
        "twitter image size",
        "x post image size",
        "1600x900",
        "twitter photo dimensions",
        "resize image for twitter post",
        "16:9 image for x",
      ],
    },
    paragraphs: {
      ru: [
        "В ленте X одиночные изображения 16:9 показываются полностью, без кадрирования. 1600×900 — распространённый рекомендуемый размер: он достаточно чёткий для экранов с высокой плотностью пикселей и легко укладывается в ограничение 5 МБ.",
        "Если в посте несколько картинок, X раскладывает их в сетку и каждую обрезает до превью. Подготовьте их в одном формате — так сетка выглядит ровнее, а по нажатию изображение всё равно откроется целиком.",
      ],
      en: [
        "In the X feed a single 16:9 image is shown in full, without cropping. 1600×900 is a widely recommended size: sharp enough for high-density screens and comfortably under the 5 MB limit.",
        "When a post has several images, X arranges them in a grid and crops each one into a preview. Prepare them in the same format so the grid looks even — tapping an image still opens it in full.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер лучше для поста в Twitter: 1600×900 или 1200×675?",
          a: "Оба — 16:9 и показываются без обрезки. 1600×900 чётче на современных экранах, 1200×675 весит меньше. Ограничение для фото — 5 МБ, и JPG такого размера укладывается в него с большим запасом.",
        },
        {
          q: "Как выложить в X скриншот с текстом, чтобы он остался читаемым?",
          a: "Сохраните скриншот в PNG — в исходном файле текст останется резким, без артефактов JPG. Если скриншот шире 1600 px, уменьшите его этим пресетом: качественный фильтр масштабирования сохраняет буквы чёткими.",
        },
      ],
      en: [
        {
          q: "Which is better for a Twitter post: 1600×900 or 1200×675?",
          a: "Both are 16:9 and appear uncropped. 1600×900 looks sharper on modern screens, while 1200×675 is lighter. The photo limit is 5 MB, and a JPG of either size stays far below it.",
        },
        {
          q: "How do I post a screenshot with text on X and keep it readable?",
          a: "Save the screenshot as PNG so the text stays crisp in your file, with no JPG artefacts. If it’s wider than 1600 px, shrink it with this preset — the high-quality resampling filter keeps letters sharp.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Изображений в посте", "до 4"],
        ["Максимальный вес фото", "5 МБ"],
        ["Одиночное фото в ленте", "показывается целиком"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Images per post", "up to 4"],
        ["Maximum photo size", "5 MB"],
        ["Single image in the feed", "shown in full"],
      ],
    },
  },
  {
    slug: "linkedin-banner",
    group: "social",
    w: 1584,
    h: 396,
    fit: "cover",
    name: { ru: "Фон LinkedIn", en: "LinkedIn banner" },
    title: {
      ru: "Фон профиля LinkedIn — размер 1584×396 онлайн",
      en: "LinkedIn Banner Size 1584×396 — Resize Background",
    },
    h1: {
      ru: "Размер фона профиля LinkedIn — 1584×396",
      en: "Resize an Image for a LinkedIn Banner (1584×396)",
    },
    description: {
      ru: "Фон личного профиля LinkedIn: 1584×396 px, пропорции 4:1, JPG, PNG или GIF до 8 МБ. Фото профиля перекрывает левую нижнюю часть баннера.",
      en: "LinkedIn personal profile background: 1584×396 px, a 4:1 strip, JPG, PNG or GIF up to 8 MB. Your profile photo covers the lower-left part of the banner.",
    },
    lead: {
      ru: "Изображение приводится к 1584×396 px — рекомендуемому размеру фонового изображения личного профиля LinkedIn.",
      en: "Your image becomes 1584×396 px — the recommended size for a LinkedIn personal profile background.",
    },
    keywords: {
      ru: [
        "размер фона linkedin",
        "баннер linkedin размер",
        "1584 на 396",
        "обложка профиля линкедин",
        "фоновое изображение linkedin",
      ],
      en: [
        "linkedin banner size",
        "linkedin background photo size",
        "1584x396",
        "linkedin cover photo dimensions",
        "resize image for linkedin banner",
        "linkedin header image size",
      ],
    },
    paragraphs: {
      ru: [
        "LinkedIn рекомендует для фона профиля 1584×396 px — полосу 4:1, вчетверо шире своей высоты. Из обычного горизонтального фото в неё попадает лишь около трети высоты, поэтому снимок с главным объектом по центру подходит лучше всего.",
        "Слева на фон накладывается круглое фото профиля, а на телефонах баннер показывается мельче. Надписи и логотип компании лучше размещать в центральной или правой части.",
      ],
      en: [
        "LinkedIn recommends 1584×396 px for the profile background — a 4:1 strip, four times wider than it is tall. Only about a third of the height of an ordinary landscape photo fits, so a shot with the subject in the centre works best.",
        "The round profile photo overlaps the left side, and on phones the banner appears smaller. Place text and a company logo in the centre or on the right.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Что поставить на фон профиля LinkedIn?",
          a: "Нейтральный фон, панораму города, рабочее пространство или простой баннер с должностью и контактами. Мелкий текст на телефоне не читается — используйте крупный шрифт и не больше одной-двух строк.",
        },
        {
          q: "Подходит ли 1584×396 для страницы компании в LinkedIn?",
          a: "У страниц компаний своя обложка с другими пропорциями — часто указывают 1128×191 px. Этот пресет рассчитан на личный профиль; для страницы компании задайте нужный размер вручную в пикселях.",
        },
      ],
      en: [
        {
          q: "What should I put in my LinkedIn background?",
          a: "A neutral backdrop, a city panorama, your workspace or a simple banner with your role and contacts. Small text is unreadable on phones — use a large font and no more than one or two lines.",
        },
        {
          q: "Does 1584×396 work for a LinkedIn company page?",
          a: "Company pages have their own cover with different proportions — 1128×191 px is the size usually quoted. This preset is for personal profiles; for a company page, enter the size manually in pixels.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "4:1"],
        ["Где используется", "фон личного профиля"],
        ["Максимальный размер файла", "8 МБ"],
        ["Форматы", "JPG, PNG, GIF"],
        ["Перекрывается", "фото профиля слева"],
      ],
      en: [
        ["Aspect ratio", "4:1"],
        ["Used for", "personal profile background"],
        ["Maximum file size", "8 MB"],
        ["Formats", "JPG, PNG, GIF"],
        ["Covered by", "the profile photo on the left"],
      ],
    },
  },
  {
    slug: "linkedin-post",
    group: "social",
    w: 1200,
    h: 627,
    fit: "cover",
    name: { ru: "Пост LinkedIn", en: "LinkedIn post" },
    title: {
      ru: "Изображение для поста LinkedIn — 1200×627",
      en: "LinkedIn Post Image Size 1200×627 — Resize Photo",
    },
    h1: {
      ru: "Размер картинки для публикации в LinkedIn — 1200×627",
      en: "Resize an Image for a LinkedIn Post (1200×627)",
    },
    description: {
      ru: "1200×627 px (≈1,91:1) — рекомендуемый размер картинки к публикации или ссылке в LinkedIn. Горизонтальный кадр без обрезки в ленте и в превью ссылки.",
      en: "1200×627 px (≈1.91:1) is the recommended size for images in LinkedIn posts and shared links. A landscape frame shown uncropped in the feed and in previews.",
    },
    lead: {
      ru: "Изображение приводится к 1200×627 px — горизонтальному формату, который LinkedIn рекомендует для публикаций с картинкой или ссылкой.",
      en: "Your image becomes 1200×627 px — the landscape format LinkedIn recommends for posts with an image or a link.",
    },
    keywords: {
      ru: [
        "размер картинки для linkedin",
        "1200 на 627",
        "изображение для поста линкедин",
        "размер превью ссылки linkedin",
        "картинка для публикации linkedin",
      ],
      en: [
        "linkedin post image size",
        "1200x627",
        "linkedin shared image size",
        "linkedin link preview image size",
        "resize image for linkedin",
        "linkedin image dimensions",
      ],
    },
    paragraphs: {
      ru: [
        "LinkedIn использует 1200×627 px и для картинки, прикреплённой к публикации, и для превью ссылки из og:image. По пропорциям это почти те же ≈1,91:1, что у Facebook (1200×630), так что одна картинка подойдёт для обеих сетей.",
        "Для ленты LinkedIn подходят также квадрат и вертикаль — они занимают больше места на экране телефона. Горизонталь выбирайте для схем, графиков и скриншотов, которые плохо переносят обрезку.",
      ],
      en: [
        "LinkedIn uses 1200×627 px both for images attached to posts and for link previews taken from og:image. The shape is practically the same ≈1.91:1 as Facebook’s 1200×630, so one image serves both networks.",
        "Squares and portraits also work in the LinkedIn feed and take up more space on a phone. Choose landscape for diagrams, charts and screenshots that don’t survive cropping well.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему LinkedIn не показывает картинку у ссылки?",
          a: "LinkedIn берёт превью из тега og:image страницы; если тега нет или картинка слишком мала, превью может не появиться. Проверьте ссылку в LinkedIn Post Inspector — он показывает, что увидит сеть, и обновляет кэш.",
        },
        {
          q: "Чем 1200×627 отличается от 1200×630?",
          a: "Всего тремя пикселями по высоте: это одни и те же пропорции ≈1,91:1. LinkedIn называет 1200×627, Facebook — 1200×630, и обе сети покажут любой из вариантов без заметной обрезки.",
        },
      ],
      en: [
        {
          q: "Why doesn’t LinkedIn show an image for my link?",
          a: "LinkedIn takes the preview from the page’s og:image tag; if the tag is missing or the image is too small, no preview may appear. Check the link in LinkedIn Post Inspector — it shows what LinkedIn sees and refreshes its cache.",
        },
        {
          q: "What’s the difference between 1200×627 and 1200×630?",
          a: "Just three pixels of height — both are the same ≈1.91:1 shape. LinkedIn quotes 1200×627 and Facebook 1200×630, and either network shows both without noticeable cropping.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "≈1,91:1"],
        ["Где используется", "картинка к публикации и превью ссылки"],
        ["Похожий формат", "Facebook и Open Graph — 1200×630"],
        ["Текст на картинке", "крупный: превью в ленте уменьшается"],
      ],
      en: [
        ["Aspect ratio", "≈1.91:1"],
        ["Used for", "post images and link previews"],
        ["Similar format", "Facebook and Open Graph — 1200×630"],
        ["Text on the image", "keep it large: feed previews are small"],
      ],
    },
  },
  {
    slug: "whatsapp-dp",
    group: "social",
    w: 500,
    h: 500,
    fit: "cover",
    name: { ru: "Аватар WhatsApp", en: "WhatsApp DP" },
    title: {
      ru: "Аватарка для WhatsApp — размер фото 500×500",
      en: "WhatsApp DP Size 500×500 — Resize Profile Photo",
    },
    h1: {
      ru: "Фото на аватарку WhatsApp — размер 500×500",
      en: "Resize a Photo for a WhatsApp Profile Picture (500×500)",
    },
    description: {
      ru: "Квадрат 500×500 px для фото профиля WhatsApp: аватар показывается кругом, поэтому лицо держите в центре. Можно вписать фото целиком с цветными полями.",
      en: "A 500×500 px square for your WhatsApp profile photo. It’s shown as a circle, so keep your face centred — or fit the whole photo inside with coloured padding.",
    },
    lead: {
      ru: "Фото приводится к квадрату 500×500 px — распространённому рекомендуемому размеру аватарки WhatsApp.",
      en: "Your photo becomes a 500×500 px square — a commonly recommended size for a WhatsApp profile picture.",
    },
    keywords: {
      ru: [
        "аватарка для ватсапа размер",
        "фото профиля whatsapp размер",
        "как поставить фото на аву в ватсапе целиком",
        "аватарка ватсап без обрезки",
        "размер фото для whatsapp",
      ],
      en: [
        "whatsapp dp size",
        "whatsapp profile picture size",
        "whatsapp dp full size without crop",
        "resize photo for whatsapp dp",
        "whatsapp profile photo dimensions",
      ],
    },
    paragraphs: {
      ru: [
        "Официально WhatsApp не публикует размер фото профиля, а загруженные снимки уменьшает и пережимает сам. Квадрат 500×500 px — частая рекомендация: он чёткий на экране телефона, и WhatsApp почти не приходится его масштабировать.",
        "Аватарка отображается в кружке, поэтому углы квадрата не видны. Держите лицо в центре, а если хотите поставить фото целиком, без обрезки, выберите «Вписать с полями»: снимок встанет в квадрат, а пустые места заполнятся цветом или размытием.",
      ],
      en: [
        "WhatsApp doesn’t publish an official profile photo size and scales and re-compresses uploads itself. A 500×500 px square is a common recommendation: it looks sharp on a phone and leaves WhatsApp little to rescale.",
        "The picture is displayed in a circle, so the corners of the square are hidden. Keep your face in the centre — or, to use the whole photo without cropping, pick “Fit with padding”: the shot fits into the square and the empty space is filled with a colour or blur.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как поставить фото на аватарку WhatsApp целиком, без обрезки?",
          a: "Выберите режим «Вписать с полями»: горизонтальное или вертикальное фото полностью поместится в квадрат, а поля заполнятся белым, другим цветом или размытой копией снимка. WhatsApp всё равно покажет круг, так что углы кадра могут немного срезаться.",
        },
        {
          q: "Почему аватарка в WhatsApp получается размытой?",
          a: "Обычно причина — маленький исходник или скриншот, который WhatsApp растягивает. Берите оригинал снимка из галереи, а не копию, пересланную в чате: мессенджеры сжимают отправляемые фото.",
        },
        {
          q: "Подойдёт ли этот размер для аватарки в других мессенджерах?",
          a: "Да, квадрат 500×500 подходит для большинства сервисов, где аватар показывается кругом. Для Telegram можно взять 640×640 — это самая крупная версия аватара, которую он хранит.",
        },
      ],
      en: [
        {
          q: "How do I set a full photo as my WhatsApp DP without cropping?",
          a: "Choose “Fit with padding”: a landscape or portrait photo fits completely inside the square, and the bars are filled with white, another colour or a blurred copy of the shot. WhatsApp still shows a circle, so the very corners may be trimmed slightly.",
        },
        {
          q: "Why does my WhatsApp profile picture look blurry?",
          a: "Usually the source is too small — often a screenshot that WhatsApp has to stretch. Use the original photo from your gallery rather than a copy forwarded in a chat, because messengers compress photos they send.",
        },
        {
          q: "Will this size work for avatars in other messengers?",
          a: "Yes, a 500×500 square suits most services that show avatars as circles. For Telegram you can use 640×640 — the largest avatar version it stores.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "1:1"],
        ["Отображение", "круг — углы квадрата не видны"],
        ["Официальный размер", "не опубликован — это рекомендация"],
        ["Что делает WhatsApp", "сам уменьшает и пережимает фото"],
      ],
      en: [
        ["Aspect ratio", "1:1"],
        ["Display", "circle — the corners are hidden"],
        ["Official size", "not published — this is a recommendation"],
        ["What WhatsApp does", "scales and re-compresses the photo itself"],
      ],
    },
  },
  {
    slug: "telegram-avatar",
    group: "social",
    w: 640,
    h: 640,
    fit: "cover",
    name: { ru: "Аватар Telegram", en: "Telegram avatar" },
    title: {
      ru: "Аватарка для Telegram — размер 640×640 онлайн",
      en: "Telegram Avatar Size 640×640 — Resize Profile Photo",
    },
    h1: {
      ru: "Фото на аватарку Telegram — размер 640×640",
      en: "Resize a Photo for a Telegram Avatar (640×640)",
    },
    description: {
      ru: "Квадрат 640×640 px — самая крупная версия аватара, которую хранит Telegram. Подходит для профиля, канала, группы и бота; аватар показывается кругом.",
      en: "A 640×640 px square — the largest avatar version Telegram stores. Works for profiles, channels, groups and bots; the avatar is displayed as a circle.",
    },
    lead: {
      ru: "Фото приводится к 640×640 px — максимальному размеру, в котором Telegram хранит аватарки.",
      en: "Your photo becomes 640×640 px — the largest size Telegram keeps for avatars.",
    },
    keywords: {
      ru: [
        "размер аватарки телеграм",
        "аватарка для телеграм канала размер",
        "640 на 640",
        "фото профиля telegram размер",
        "аватар для группы телеграм",
      ],
      en: [
        "telegram avatar size",
        "telegram profile picture size",
        "640x640",
        "telegram channel avatar size",
        "resize photo for telegram",
      ],
    },
    paragraphs: {
      ru: [
        "Telegram хранит фото профиля в нескольких размерах, и самый крупный из них — 640×640 px. Загружать снимок больше нет смысла: мессенджер всё равно уменьшит его до этого размера.",
        "Аватар показывается в кружке — у пользователей, каналов, групп и ботов. Лицо или логотип размещайте в центре, а для логотипа с мелкими деталями оставьте поля: в режиме «Вписать с полями» знак целиком встанет в квадрат на фоне нужного цвета.",
      ],
      en: [
        "Telegram stores profile photos in several sizes, and the largest is 640×640 px. There’s no point uploading anything bigger: the app will scale it down to that size anyway.",
        "Avatars are displayed in a circle for users, channels, groups and bots alike. Keep a face or logo in the centre, and give a detailed logo some breathing room: “Fit with padding” places the whole mark inside the square on a background colour of your choice.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер аватарки для Telegram-канала?",
          a: "Такой же, как для профиля: квадрат, крупнейшая хранимая версия — 640×640 px. В списке чатов аватар совсем маленький, поэтому для канала лучше работает простой логотип или крупный символ, чем детальная фотография.",
        },
        {
          q: "Почему Telegram обрезает аватарку?",
          a: "При загрузке Telegram предлагает выделить квадратную область, а показывает её кругом. Если исходник не квадратный, подготовьте квадрат 640×640 заранее — так вы сами решите, что попадёт в кадр.",
        },
        {
          q: "Можно ли поставить аватарку с прозрачным фоном?",
          a: "Рассчитывать на прозрачность не стоит: Telegram хранит аватары как обычные фото в JPG. Надёжнее сразу залить фон нужным цветом — в режиме «Вписать с полями» можно выбрать цвет подложки.",
        },
      ],
      en: [
        {
          q: "What size should a Telegram channel avatar be?",
          a: "The same as a profile photo: a square, with 640×640 px as the largest stored version. In the chat list avatars are tiny, so a simple logo or bold symbol works better for a channel than a detailed photo.",
        },
        {
          q: "Why does Telegram crop my avatar?",
          a: "When uploading, Telegram asks you to select a square area and then displays it as a circle. If your source isn’t square, prepare a 640×640 square beforehand so you decide what stays in the frame.",
        },
        {
          q: "Can a Telegram avatar have a transparent background?",
          a: "Don’t count on it: Telegram stores avatars as regular JPG photos. It’s safer to fill the background with a colour yourself — “Fit with padding” lets you pick the backdrop colour.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "1:1"],
        ["Отображение", "круг"],
        ["Для чего", "профиль, канал, группа, бот"],
        ["Если загрузить крупнее", "Telegram уменьшит до 640 px"],
      ],
      en: [
        ["Aspect ratio", "1:1"],
        ["Display", "circle"],
        ["Used for", "profiles, channels, groups, bots"],
        ["If you upload a larger image", "Telegram scales it down to 640 px"],
      ],
    },
  },
  {
    slug: "vk-cover",
    group: "social",
    w: 1920,
    h: 768,
    fit: "cover",
    name: { ru: "Обложка ВК", en: "VK cover" },
    title: {
      ru: "Обложка сообщества ВК — размер 1920×768 онлайн",
      en: "VK Community Cover Size 1920×768 — Resize Image",
    },
    h1: {
      ru: "Размер обложки сообщества ВКонтакте — 1920×768",
      en: "Resize an Image for a VK Community Cover (1920×768)",
    },
    description: {
      ru: "Обложка группы ВКонтакте: рекомендуемый размер 1920×768 px, пропорции 2,5:1. На телефонах бока обрезаются — текст и логотип держите по центру.",
      en: "VK (VKontakte) community cover: recommended size 1920×768 px, a 2.5:1 strip. On phones the sides are cut off, so keep text and logos in the centre.",
    },
    lead: {
      ru: "Изображение приводится к 1920×768 px — рекомендуемому размеру обложки сообщества ВКонтакте.",
      en: "Your image becomes 1920×768 px — the recommended size for a VK community cover.",
    },
    keywords: {
      ru: [
        "размер обложки вк",
        "обложка для группы вк размер",
        "1920 на 768",
        "обложка сообщества вконтакте",
        "размер обложки вк для мобильной версии",
        "шапка группы вк размер",
      ],
      en: [
        "vk cover size",
        "vkontakte community cover size",
        "1920x768",
        "vk group cover dimensions",
        "resize image for vk cover",
      ],
    },
    paragraphs: {
      ru: [
        "ВКонтакте рекомендует для обложки сообщества 1920×768 px — полосу с пропорциями 2,5:1. В полной версии сайта обложка видна почти целиком, а в мобильном приложении по бокам срезаются заметные части.",
        "Поэтому название, логотип и призыв к действию размещайте в центральной части, а по краям оставляйте фон. В режиме «Заполнить и обрезать по центру» из горизонтального фото сохранится середина кадра — проверьте, что главное туда попало.",
      ],
      en: [
        "VK recommends 1920×768 px for a community cover — a 2.5:1 strip. The desktop site shows almost all of it, while the mobile app cuts off noticeable parts on both sides.",
        "So place the name, logo and call to action in the centre and leave plain background at the edges. “Fill and crop centre” keeps the middle of a landscape photo — check that the important part ends up there.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Почему обложка группы ВК на телефоне обрезана?",
          a: "Мобильное приложение показывает обложку в других пропорциях, чем сайт, и срезает её по бокам. Видимая область зависит от экрана, поэтому держите текст в середине с запасом от левого и правого краёв.",
        },
        {
          q: "Какой размер был у обложки ВК раньше?",
          a: "Раньше рекомендовали 1590×400 px. Сейчас ВКонтакте рекомендует 1920×768 — обложка стала заметно выше, поэтому старую обложку лучше переделать под новые пропорции, иначе она растянется или обрежется.",
        },
        {
          q: "Можно ли сделать обложку ВК из квадратного фото?",
          a: "Можно, но из квадрата в полосу 2,5:1 попадёт только 40 % высоты. Если нужен весь снимок, выберите «Вписать с полями» с размытым фоном — фото встанет в центр, а края заполнятся его размытой копией.",
        },
      ],
      en: [
        {
          q: "Why is my VK community cover cropped on phones?",
          a: "The mobile app displays the cover with different proportions than the website and cuts it off at the sides. The visible area depends on the screen, so keep text in the middle with a margin from the left and right edges.",
        },
        {
          q: "What was the old VK cover size?",
          a: "It used to be 1590×400 px. VK now recommends 1920×768, a much taller cover, so an old one should be redone for the new proportions — otherwise it gets stretched or cropped.",
        },
        {
          q: "Can I make a VK cover from a square photo?",
          a: "Yes, but only 40% of the square’s height fits into a 2.5:1 strip. To keep the whole shot, choose “Fit with padding” with a blurred background — the photo sits in the centre and the sides are filled with a blurred copy.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "2,5:1"],
        ["Где используется", "обложка сообщества (группы или паблика)"],
        ["На телефонах", "бока обрезаются — важное по центру"],
        ["Форматы", "JPG, PNG, GIF"],
      ],
      en: [
        ["Aspect ratio", "2.5:1"],
        ["Used for", "community (group or public page) cover"],
        ["On phones", "sides are cut off — keep key content centred"],
        ["Formats", "JPG, PNG, GIF"],
      ],
    },
  },
  {
    slug: "pinterest-pin",
    group: "social",
    w: 1000,
    h: 1500,
    fit: "cover",
    name: { ru: "Пин Pinterest", en: "Pinterest pin" },
    title: {
      ru: "Размер пина Pinterest — фото 1000×1500 онлайн",
      en: "Pinterest Pin Size 1000×1500 (2:3) — Resize Photo",
    },
    h1: {
      ru: "Размер фото для пина Pinterest — 1000×1500",
      en: "Resize a Photo for a Pinterest Pin (1000×1500)",
    },
    description: {
      ru: "Pinterest рекомендует пины 2:3 — 1000×1500 px. Более вытянутые изображения в ленте могут обрезаться. Форматы JPG и PNG, файл до 20 МБ.",
      en: "Pinterest recommends 2:3 pins — 1000×1500 px. Taller images may be cut off in the feed. JPG and PNG formats, files up to 20 MB. Crop or pad in batches.",
    },
    lead: {
      ru: "Фото приводится к вертикали 1000×1500 px — пропорциям 2:3, которые Pinterest рекомендует для пинов.",
      en: "Your photo becomes a 1000×1500 px vertical — the 2:3 ratio Pinterest recommends for pins.",
    },
    keywords: {
      ru: [
        "размер пина pinterest",
        "размер фото для пинтерест",
        "1000 на 1500",
        "формат 2:3 для pinterest",
        "размер картинки для пинтереста",
      ],
      en: [
        "pinterest pin size",
        "pinterest image size",
        "1000x1500",
        "2:3 pin dimensions",
        "resize image for pinterest",
        "pinterest pin aspect ratio",
      ],
    },
    paragraphs: {
      ru: [
        "Pinterest рекомендует для обычных пинов соотношение сторон 2:3, например 1000×1500 px. Такие пины показываются в ленте целиком, а заметно более длинные изображения могут обрезаться снизу.",
        "Вертикальные снимки с фотоаппарата уже имеют пропорции 2:3 и подгоняются без обрезки, а у вертикальных фото со смартфона (3:4) срезаются узкие полосы по бокам. Если края важны, выберите «Вписать с полями».",
      ],
      en: [
        "Pinterest recommends a 2:3 ratio for standard pins, such as 1000×1500 px. Pins like this appear in full in the feed, while noticeably longer images may be cut off at the bottom.",
        "Vertical camera shots are already 2:3 and fit without cropping, whereas vertical smartphone photos (3:4) lose thin strips at the sides. If the edges matter, choose “Fit with padding”.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер пина лучше для Pinterest?",
          a: "Рекомендуемый — 2:3, например 1000×1500 px. Квадрат и горизонталь тоже допускаются, но среди вертикальных пинов в ленте они выглядят мельче.",
        },
        {
          q: "Почему Pinterest обрезает длинные пины?",
          a: "Пины, которые заметно длиннее 2:3, Pinterest может показывать в ленте не полностью. Длинную инфографику лучше разделить на несколько изображений 2:3 — для этого есть инструмент разрезки на части.",
        },
      ],
      en: [
        {
          q: "What’s the best pin size for Pinterest?",
          a: "The recommended ratio is 2:3, for example 1000×1500 px. Squares and landscapes are allowed too, but they look smaller among vertical pins in the feed.",
        },
        {
          q: "Why does Pinterest cut off long pins?",
          a: "Pins much taller than 2:3 may not be shown in full in the feed. Split a long infographic into several 2:3 images instead — the image-splitting tool can do that.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "2:3"],
        ["Форматы", "JPG, PNG"],
        ["Максимальный размер файла", "20 МБ"],
        ["Более вытянутые пины", "могут обрезаться в ленте"],
      ],
      en: [
        ["Aspect ratio", "2:3"],
        ["Formats", "JPG, PNG"],
        ["Maximum file size", "20 MB"],
        ["Taller pins", "may be cut off in the feed"],
      ],
    },
  },

  /* ───────────── Documents ───────────── */
  {
    slug: "passport-35x45",
    group: "document",
    w: 413,
    h: 531,
    mm: [35, 45],
    dpi: 300,
    fit: "cover",
    name: { ru: "Паспорт 35×45", en: "Passport 35×45" },
    title: {
      ru: "Фото на паспорт 35×45 мм — 413×531 px, 300 dpi",
      en: "Passport Photo 35×45 mm — 413×531 px at 300 dpi",
    },
    h1: {
      ru: "Фото на паспорт 35×45 мм онлайн",
      en: "Resize a Photo to Passport Size 35×45 mm",
    },
    description: {
      ru: "Фото 35×45 мм для паспорта РФ, шенгенской визы и документов Казахстана: 413×531 px, 300 dpi записываются в файл. Фон и размер головы — на вас.",
      en: "A 35×45 mm photo for Russian passports, Schengen visas and Kazakh documents: 413×531 px with 300 dpi saved in the file. Background and head size are up to you.",
    },
    lead: {
      ru: "Фото приводится к 413×531 px с разрешением 300 dpi — при печати это ровно 35×45 мм.",
      en: "Your photo becomes 413×531 px at 300 dpi — exactly 35×45 mm when printed.",
    },
    keywords: {
      ru: [
        "фото на паспорт онлайн",
        "фото 35х45 онлайн",
        "размер фото на паспорт в пикселях",
        "фото на загранпаспорт 35 на 45",
        "фото на шенгенскую визу размер",
        "фото на документы 3,5х4,5",
      ],
      en: [
        "passport photo 35x45",
        "35x45 mm photo online",
        "passport photo size in pixels",
        "schengen visa photo size",
        "resize photo for passport",
        "3.5x4.5 cm photo",
      ],
    },
    paragraphs: {
      ru: [
        "Размер 35×45 мм используют для паспорта гражданина России и загранпаспорта, шенгенской и многих других виз, а также для ряда документов в Казахстане. При 300 dpi это 413×531 px; разрешение записывается в сам файл JPG или PNG, поэтому фотосалон или программа печати сразу выведет снимок в нужном размере.",
        "Инструмент отвечает только за размер: он обрезает кадр по центру до пропорций 35:45 и масштабирует его. Требования к фону, освещению, выражению лица и размеру головы у каждого документа свои — их нужно соблюсти при съёмке. Если голова не по центру, сначала обрежьте фото вручную с запасом вокруг, а затем примените пресет.",
        "Для электронных заявлений — например, на Госуслугах или eGov.kz — требования к файлу (размер в пикселях, вес, формат) могут отличаться от печатных. Сверьтесь с ними на портале перед загрузкой.",
      ],
      en: [
        "The 35×45 mm size is used for Russian internal and international passports, Schengen and many other visas, and a number of documents in Kazakhstan. At 300 dpi it equals 413×531 px; the resolution is written into the JPG or PNG itself, so a photo lab or print dialog outputs the photo at the right size straight away.",
        "The tool only takes care of the size: it crops the frame from the centre to 35:45 proportions and scales it. Each document has its own rules for background, lighting, expression and head size, and those are down to how the photo is taken. If the head isn’t centred, crop the photo manually first with some margin around it, then apply the preset.",
        "For online applications — on Gosuslugi or eGov.kz, for example — file requirements (pixel size, weight, format) may differ from printed ones. Check them on the portal before uploading.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Можно ли сделать фото на паспорт РФ онлайн?",
          a: "Инструмент подготовит файл точного размера 35×45 мм при 300 dpi, но сам снимок должен соответствовать требованиям: однотонный светлый фон, ровный свет, взгляд в камеру, голова нужного размера. За это отвечаете вы. Многие фотосалоны и киоски печати принимают такие файлы и печатают их на фотобумаге.",
        },
        {
          q: "Как распечатать фото 35×45, чтобы размер совпал?",
          a: "В файле уже записано 300 dpi, поэтому при печати в реальном размере снимок займёт ровно 35×45 мм. В настройках печати отключите подгонку «по размеру бумаги» — иначе фото растянется на весь лист.",
        },
        {
          q: "Подходит ли 35×45 мм для документов Казахстана?",
          a: "Этот размер используют для многих документов и виз, которые оформляют граждане Казахстана. При этом для удостоверения личности и паспорта РК фото часто делают прямо в ЦОНе — уточните порядок заранее.",
        },
      ],
      en: [
        {
          q: "Can I make a Russian passport photo online?",
          a: "The tool produces a file of exactly 35×45 mm at 300 dpi, but the photo itself must meet the rules: a plain light background, even lighting, eyes to the camera and the right head size. That part is up to you. Many photo studios and print kiosks accept such files and print them on photo paper.",
        },
        {
          q: "How do I print a 35×45 photo at the right size?",
          a: "The file already contains 300 dpi, so printing at actual size gives exactly 35×45 mm. In the print settings, turn off “fit to page” — otherwise the photo is stretched across the whole sheet.",
        },
        {
          q: "Is 35×45 mm right for Kazakhstan documents?",
          a: "This size is used for many documents and visas that citizens of Kazakhstan apply for. For a Kazakh ID card or passport, though, the photo is often taken on site at a public service centre (TsON) — check the procedure in advance.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер при печати", "35×45 мм"],
        ["Разрешение в файле", "300 dpi"],
        ["Соотношение сторон", "7:9"],
        ["Где используется", "паспорт РФ, загранпаспорт, шенгенская виза, документы РК"],
      ],
      en: [
        ["Print size", "35×45 mm"],
        ["Resolution in the file", "300 dpi"],
        ["Aspect ratio", "7:9"],
        ["Used for", "Russian passports, Schengen visas, Kazakh documents"],
      ],
    },
  },
  {
    slug: "photo-3x4",
    group: "document",
    w: 354,
    h: 472,
    mm: [30, 40],
    dpi: 300,
    fit: "cover",
    name: { ru: "Фото 3×4", en: "3×4 cm photo" },
    title: {
      ru: "Фото 3×4 онлайн — 354×472 px для документов",
      en: "3×4 cm Photo — Resize to 354×472 px at 300 dpi",
    },
    h1: {
      ru: "Фото 3×4 см онлайн",
      en: "Resize a Photo to 3×4 cm (30×40 mm)",
    },
    description: {
      ru: "Фото 3×4 см для пропуска, студенческого, зачётки, медкнижки и личного дела: 354×472 px при 300 dpi, разрешение записывается в JPG или PNG.",
      en: "A 3×4 cm photo for pass cards, student IDs, record books and personnel files: 354×472 px at 300 dpi, with the resolution saved in the JPG or PNG.",
    },
    lead: {
      ru: "Фото приводится к 354×472 px с разрешением 300 dpi — при печати это ровно 30×40 мм.",
      en: "Your photo becomes 354×472 px at 300 dpi — exactly 30×40 mm when printed.",
    },
    keywords: {
      ru: [
        "фото 3х4 онлайн",
        "фото 3 на 4 размер в пикселях",
        "сделать фото 3х4",
        "фото на пропуск 3х4",
        "фото 3х4 на студенческий",
        "фото на документы 3х4",
      ],
      en: [
        "3x4 photo",
        "3x4 cm photo size in pixels",
        "30x40 mm photo",
        "resize photo to 3x4",
        "id photo 3x4",
      ],
    },
    paragraphs: {
      ru: [
        "Классическое «фото 3×4» нужно для пропусков, студенческих билетов и зачёток, личных дел, медицинских книжек и многих удостоверений. При 300 dpi это 354×472 px; значение dpi записывается в файл, поэтому при печати без масштабирования снимок получается ровно 30×40 мм.",
        "Единых требований к фото 3×4 нет: одни организации просят цветное, другие — чёрно-белое, где-то нужен светлый фон, где-то — уголок. Чёрно-белый вариант можно сделать фильтром «Оттенки серого» после изменения размера.",
      ],
      en: [
        "The classic 3×4 cm photo is needed for pass cards, student IDs and record books, personnel files, medical record books and many work IDs in Russia and neighbouring countries. At 300 dpi it’s 354×472 px; the dpi value is written into the file, so printing without scaling gives exactly 30×40 mm.",
        "There’s no single standard for 3×4 photos: some organisations want colour, others black and white, some a light background or a white corner. For black and white, apply the grayscale filter after resizing.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем фото 3×4 отличается от фото на паспорт?",
          a: "Размером и строгостью: 3×4 — это 30×40 мм, а паспортное фото — 35×45 мм с чёткими требованиями к размеру головы и фону. Для паспорта фото 3×4 не подойдёт, как и паспортное — туда, где просят именно 3×4.",
        },
        {
          q: "Нужен ли уголок на фото 3×4?",
          a: "Зависит от организации: для некоторых удостоверений до сих пор просят белый уголок, но чаще он не нужен. Инструмент уголок не добавляет — уточните требование там, где сдаёте фото.",
        },
        {
          q: "Хватит ли качества фото с телефона для печати 3×4?",
          a: "Да, с большим запасом: для 30×40 мм при 300 dpi нужно всего 354×472 px, а камера любого смартфона даёт в десятки раз больше. Важнее хороший свет и ровный фон при съёмке.",
        },
      ],
      en: [
        {
          q: "How is a 3×4 photo different from a passport photo?",
          a: "In size and strictness: 3×4 is 30×40 mm, while a passport photo is 35×45 mm with firm rules for head size and background. A 3×4 photo won’t do for a passport, and a passport photo won’t do where 3×4 is required.",
        },
        {
          q: "Does a 3×4 photo need a white corner?",
          a: "It depends on the organisation: a few IDs still ask for a white corner, but most don’t. The tool doesn’t add one — check the requirement where you’re submitting the photo.",
        },
        {
          q: "Is a phone photo good enough for a 3×4 print?",
          a: "Easily: 30×40 mm at 300 dpi needs only 354×472 px, and any smartphone camera captures many times more. Good light and a plain background matter far more.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер при печати", "30×40 мм"],
        ["Разрешение в файле", "300 dpi"],
        ["Соотношение сторон", "3:4"],
        ["Где требуется", "пропуска, студенческий, зачётка, медкнижка, личное дело"],
      ],
      en: [
        ["Print size", "30×40 mm"],
        ["Resolution in the file", "300 dpi"],
        ["Aspect ratio", "3:4"],
        ["Required for", "pass cards, student IDs, record books, personnel files"],
      ],
    },
  },
  {
    slug: "us-passport-2x2",
    group: "document",
    w: 600,
    h: 600,
    mm: [51, 51],
    dpi: 300,
    fit: "cover",
    name: { ru: "Паспорт США 2×2", en: "US passport 2×2" },
    title: {
      ru: "Фото 2×2 дюйма на паспорт и визу США — 600×600",
      en: "US Passport Photo 2×2 in — Resize to 600×600 px",
    },
    h1: {
      ru: "Фото 2×2 дюйма на паспорт и визу США",
      en: "Resize a Photo to 2×2 Inches for a US Passport or Visa",
    },
    description: {
      ru: "Квадрат 2×2 дюйма (≈51×51 мм) для паспорта и визы США: 600×600 px при 300 dpi. Онлайн-инструмент Госдепа принимает фото от 600×600 px.",
      en: "A 2×2 inch (≈51×51 mm) square for US passports and visas: 600×600 px at 300 dpi. The State Department’s online photo tool accepts 600×600 px and up.",
    },
    lead: {
      ru: "Фото приводится к квадрату 600×600 px с разрешением 300 dpi — при печати это ровно 2×2 дюйма.",
      en: "Your photo becomes a 600×600 px square at 300 dpi — exactly 2×2 inches when printed.",
    },
    keywords: {
      ru: [
        "фото на визу сша размер",
        "фото 2х2 дюйма",
        "фото 5х5 на визу сша",
        "фото для ds-160 размер",
        "фото на грин карту размер",
        "фото 600х600 онлайн",
      ],
      en: [
        "us passport photo size",
        "2x2 photo",
        "600x600 photo",
        "us visa photo size",
        "ds-160 photo requirements size",
        "green card lottery photo size",
      ],
    },
    paragraphs: {
      ru: [
        "Для паспорта и визы США нужно квадратное фото 2×2 дюйма (≈51×51 мм, в России его часто называют «5×5»). При 300 dpi это 600×600 px — ровно тот минимальный размер, который принимает онлайн-инструмент Госдепартамента для загрузки фото.",
        "Голова от подбородка до макушки должна занимать от 1 до 1⅜ дюйма (25–35 мм), фон — белый или почти белый, без теней. Инструмент обрезает кадр по центру и задаёт точный размер, но положение и размер головы нужно проверить вам.",
        "Для анкеты DS-160 и лотереи Green Card (DV) фото загружают файлом JPG весом до 240 КБ. Если файл получился тяжелее, уменьшите вес инструментом сжатия с целевым размером.",
      ],
      en: [
        "US passports and visas require a square 2×2 inch photo (≈51×51 mm). At 300 dpi that’s 600×600 px — exactly the minimum the State Department’s online photo tool accepts for uploads.",
        "The head, from chin to top, must measure 1 to 1⅜ inches (25–35 mm), and the background must be white or off-white with no shadows. The tool crops from the centre and sets the exact size, but checking the head position and size is up to you.",
        "For the DS-160 form and the Green Card lottery (DV) the photo is uploaded as a JPG of up to 240 KB. If your file is heavier, reduce it with the compression tool’s target-size mode.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер фото нужен для визы США в пикселях?",
          a: "Для анкеты DS-160 — квадрат от 600×600 до 1200×1200 px в JPEG весом до 240 КБ. Пресет даёт 600×600 px: это минимум, и такой файл обычно легко укладывается в ограничение по весу.",
        },
        {
          q: "Можно ли использовать это фото для лотереи Green Card?",
          a: "Для DV-лотереи тоже нужен квадрат 600×600 px в JPEG до 240 КБ, так что размер подойдёт. Но требования к позе, фону и свежести снимка строгие, а фото с нарушениями ведёт к дисквалификации заявки — сверьтесь с официальной инструкцией.",
        },
        {
          q: "Почему 2×2 дюйма — это 51 мм, а не 50?",
          a: "Дюйм равен 25,4 мм, поэтому 2 дюйма — это 50,8 мм, округлённо 51 мм. В пикселях при 300 dpi получается ровно 600 px.",
        },
      ],
      en: [
        {
          q: "What pixel size does a US visa photo need?",
          a: "For the DS-160 form: a square from 600×600 to 1200×1200 px, as a JPEG up to 240 KB. This preset gives 600×600 px — the minimum — and such a file usually fits the size limit easily.",
        },
        {
          q: "Can I use this photo for the Green Card lottery?",
          a: "The DV lottery also requires a 600×600 px JPEG of up to 240 KB, so the size fits. The rules on pose, background and how recent the photo is are strict, and a non-compliant photo disqualifies the entry — check the official instructions.",
        },
        {
          q: "Why is 2×2 inches 51 mm and not 50?",
          a: "An inch is 25.4 mm, so 2 inches is 50.8 mm, rounded to 51 mm. At 300 dpi that’s exactly 600 px.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер при печати", "2×2 дюйма (≈51×51 мм)"],
        ["Голова на фото", "25–35 мм от подбородка до макушки"],
        ["Разрешение в файле", "300 dpi"],
        ["Для загрузки (DS-160, DV)", "JPEG до 240 КБ"],
      ],
      en: [
        ["Print size", "2×2 inches (≈51×51 mm)"],
        ["Head size", "1–1⅜ in (25–35 mm) from chin to top of head"],
        ["Resolution in the file", "300 dpi"],
        ["For uploads (DS-160, DV)", "JPEG up to 240 KB"],
      ],
    },
  },

  /* ───────────── Prints ───────────── */
  {
    slug: "print-10x15",
    group: "print",
    w: 1200,
    h: 1800,
    mm: [102, 152],
    dpi: 300,
    fit: "cover",
    name: { ru: "Печать 10×15", en: "4×6 print" },
    title: {
      ru: "Фото для печати 10×15 — 1200×1800 px, 300 dpi",
      en: "4×6 Print Size (10×15 cm) — 1200×1800 px at 300 dpi",
    },
    h1: {
      ru: "Подготовить фото к печати 10×15 см",
      en: "Resize a Photo for a 4×6 in (10×15 cm) Print",
    },
    description: {
      ru: "Фото 10×15 см (4×6 дюймов) для печати: 1200×1800 px при 300 dpi, пропорции 2:3. Снимки со смартфона 4:3 обрезаются по центру или получают поля.",
      en: "A 4×6 in (10×15 cm) print: 1200×1800 px at 300 dpi, 2:3 proportions. 4:3 smartphone shots are cropped from the centre or fitted with white borders.",
    },
    lead: {
      ru: "Фото приводится к 1200×1800 px с разрешением 300 dpi — этого достаточно для чёткого отпечатка 10×15 см.",
      en: "Your photo becomes 1200×1800 px at 300 dpi — enough for a sharp 4×6 inch print.",
    },
    keywords: {
      ru: [
        "фото 10х15 размер в пикселях",
        "подготовить фото к печати 10х15",
        "1200 на 1800",
        "разрешение для печати фото 10х15",
        "фото 10 на 15 онлайн",
      ],
      en: [
        "4x6 photo size in pixels",
        "1200x1800",
        "resize photo for 4x6 print",
        "10x15 photo size",
        "4x6 print resolution",
      ],
    },
    paragraphs: {
      ru: [
        "Формат 10×15 см — это на самом деле 4×6 дюймов (102×152 мм) с пропорциями 2:3. Такие же пропорции у кадра 35-мм плёнки и у большинства зеркальных и беззеркальных камер, поэтому их снимки печатаются на 10×15 без обрезки.",
        "Фото со смартфона обычно имеют пропорции 4:3 — при печати на 10×15 часть кадра срезается по краям или остаются белые поля. Решите сами заранее: «Заполнить и обрезать по центру» даст отпечаток без полей, «Вписать с полями» сохранит весь кадр.",
        "300 dpi записываются в файл, так что лаборатория или программа печати сразу видит размер отпечатка. Если исходное фото меньше 1200×1800, по умолчанию оно не увеличивается — включите «Разрешить увеличение», чтобы получить точный размер.",
      ],
      en: [
        "A “10×15 cm” print is really 4×6 inches (102×152 mm) with 2:3 proportions. 35 mm film frames and most DSLR and mirrorless cameras share the same shape, so their shots print on 4×6 without cropping.",
        "Smartphone photos are usually 4:3, so on a 4×6 print part of the frame is trimmed or white borders remain. Decide in advance: “Fill and crop centre” gives a borderless print, while “Fit with padding” keeps the whole frame.",
        "300 dpi is written into the file, so the lab or print software knows the print size right away. If your photo is smaller than 1200×1800, it isn’t enlarged by default — turn on “Allow enlarging” to get the exact size.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какое разрешение нужно для печати фото 10×15?",
          a: "Для качественного отпечатка — 300 dpi, то есть 1200×1800 px. Почти любое фото со смартфона или камеры крупнее этого размера, так что для печати его можно смело уменьшить.",
        },
        {
          q: "Почему при печати 10×15 обрезаются края фото?",
          a: "Потому что у большинства смартфонов кадр 4:3, а у бумаги 10×15 — 2:3. Лаборатория подгоняет снимок и срезает лишнее. Подготовив файл 1200×1800 заранее, вы сами выберете, что обрезать, — или впишете кадр целиком с белыми полями.",
        },
        {
          q: "Чем 10×15 отличается от 4×6 дюймов?",
          a: "Это один и тот же формат: 4×6 дюймов — это 101,6×152,4 мм, а «10×15» — округлённое название в сантиметрах. Поэтому пресет рассчитан на 102×152 мм, а не ровно на 100×150.",
        },
      ],
      en: [
        {
          q: "What resolution do I need for a 4×6 print?",
          a: "For a quality print, 300 dpi — that is, 1200×1800 px. Almost any phone or camera photo is larger than that, so you can safely scale it down for printing.",
        },
        {
          q: "Why are the edges cut off when I print 4×6?",
          a: "Because most smartphones shoot 4:3, while 4×6 paper is 2:3. The lab fits the photo and trims the excess. With a ready 1200×1800 file you choose what gets cropped — or fit the whole frame with white borders.",
        },
        {
          q: "Is 10×15 cm the same as 4×6 inches?",
          a: "Yes: 4×6 inches is 101.6×152.4 mm, and “10×15” is just the rounded metric name used in Europe and Russia. That’s why the preset targets 102×152 mm rather than exactly 100×150.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер отпечатка", "10×15 см (4×6 дюймов, 102×152 мм)"],
        ["Соотношение сторон", "2:3"],
        ["Разрешение в файле", "300 dpi"],
        ["Без обрезки печатаются", "кадры зеркальных и беззеркальных камер (3:2)"],
      ],
      en: [
        ["Print size", "4×6 in (10×15 cm, 102×152 mm)"],
        ["Aspect ratio", "2:3"],
        ["Resolution in the file", "300 dpi"],
        ["Prints without cropping", "DSLR and mirrorless shots (3:2)"],
      ],
    },
  },
  {
    slug: "print-13x18",
    group: "print",
    w: 1500,
    h: 2100,
    mm: [127, 178],
    dpi: 300,
    fit: "cover",
    name: { ru: "Печать 13×18", en: "5×7 print" },
    title: {
      ru: "Фото для печати 13×18 — 1500×2100 px, 300 dpi",
      en: "5×7 Print Size (13×18 cm) — 1500×2100 px at 300 dpi",
    },
    h1: {
      ru: "Подготовить фото к печати 13×18 см",
      en: "Resize a Photo for a 5×7 in (13×18 cm) Print",
    },
    description: {
      ru: "Фото 13×18 см (5×7 дюймов) для печати: 1500×2100 px при 300 dpi, пропорции 5:7. Формат для рамок и открыток; кадры 2:3 и 3:4 слегка подрезаются.",
      en: "A 5×7 in (13×18 cm) print: 1500×2100 px at 300 dpi, 5:7 proportions. A popular size for frames and cards; 2:3 and 3:4 shots get trimmed slightly.",
    },
    lead: {
      ru: "Фото приводится к 1500×2100 px с разрешением 300 dpi — для чёткого отпечатка 13×18 см.",
      en: "Your photo becomes 1500×2100 px at 300 dpi — for a sharp 5×7 inch print.",
    },
    keywords: {
      ru: [
        "фото 13х18 размер в пикселях",
        "1500 на 2100",
        "печать фото 13х18",
        "подготовить фото к печати 13 на 18",
        "фото для рамки 13х18",
      ],
      en: [
        "5x7 photo size in pixels",
        "1500x2100",
        "resize photo for 5x7 print",
        "13x18 photo size",
        "5x7 print resolution",
      ],
    },
    paragraphs: {
      ru: [
        "Формат 13×18 см соответствует 5×7 дюймам (127×178 мм). Пропорции 5:7 ≈ 1:1,4 — чуть «квадратнее», чем у 10×15, поэтому при печати немного подрезаются и кадры фотоаппаратов (2:3), и снимки смартфонов (3:4).",
        "13×18 часто выбирают для настольных рамок, открыток и подарочных отпечатков. 300 dpi записываются в файл, так что при печати без масштабирования размер получится точным. Чтобы кадр не обрезался, используйте «Вписать с полями» — белые поля будут выглядеть как паспарту.",
      ],
      en: [
        "A 13×18 cm print corresponds to 5×7 inches (127×178 mm). The 5:7 ≈ 1:1.4 shape is a little “squarer” than 4×6, so both camera frames (2:3) and smartphone shots (3:4) get trimmed slightly when printed.",
        "5×7 is a popular choice for desk frames, greeting cards and gift prints. 300 dpi is written into the file, so printing without scaling gives the exact size. To avoid cropping, use “Fit with padding” — white borders look like a mat.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сколько пикселей нужно для печати 13×18?",
          a: "При 300 dpi — 1500×2100 px, это примерно 3,2 мегапикселя. Такое разрешение даёт любая современная камера и любой смартфон.",
        },
        {
          q: "Почему фото 13×18 обрезается сверху и снизу?",
          a: "Кадр фотоаппарата вытянут сильнее (2:3), чем бумага 13×18 (5:7), поэтому при подгонке по ширине по длинной стороне остаётся лишнее. Если обрезать нельзя, выберите «Вписать с полями».",
        },
      ],
      en: [
        {
          q: "How many pixels do I need for a 5×7 print?",
          a: "At 300 dpi, 1500×2100 px — about 3.2 megapixels. Any modern camera or smartphone captures more than that.",
        },
        {
          q: "Why is my 5×7 print cropped at the top and bottom?",
          a: "A camera frame (2:3) is longer than 5×7 paper (5:7), so when it’s fitted to the width there’s excess along the long side. If nothing may be cut, choose “Fit with padding”.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер отпечатка", "13×18 см (5×7 дюймов, 127×178 мм)"],
        ["Соотношение сторон", "5:7 (≈1:1,4)"],
        ["Разрешение в файле", "300 dpi"],
        ["Подходит для", "рамок, открыток, подарочной печати"],
      ],
      en: [
        ["Print size", "5×7 in (13×18 cm, 127×178 mm)"],
        ["Aspect ratio", "5:7 (≈1:1.4)"],
        ["Resolution in the file", "300 dpi"],
        ["Good for", "frames, greeting cards, gift prints"],
      ],
    },
  },
  {
    slug: "print-a4",
    group: "print",
    w: 2480,
    h: 3508,
    mm: [210, 297],
    dpi: 300,
    fit: "cover",
    name: { ru: "A4 300 dpi", en: "A4 at 300 dpi" },
    title: {
      ru: "Размер A4 в пикселях — 2480×3508 при 300 dpi",
      en: "A4 Size in Pixels — 2480×3508 at 300 dpi",
    },
    h1: {
      ru: "Изменить размер изображения под A4 (300 dpi)",
      en: "Resize an Image to A4 at 300 dpi",
    },
    description: {
      ru: "Лист A4 (210×297 мм) при 300 dpi — 2480×3508 px, пропорции 1:√2 ≈ 1:1,414. Для печати плакатов, грамот и фото на весь лист; dpi записывается в файл.",
      en: "An A4 sheet (210×297 mm) at 300 dpi is 2480×3508 px, a 1:√2 ≈ 1:1.414 ratio. For posters, certificates and full-page photos; the dpi is saved in the file.",
    },
    lead: {
      ru: "Изображение приводится к 2480×3508 px с разрешением 300 dpi — это ровно лист A4 при печати.",
      en: "Your image becomes 2480×3508 px at 300 dpi — exactly one A4 sheet when printed.",
    },
    keywords: {
      ru: [
        "размер а4 в пикселях",
        "а4 300 dpi",
        "2480 на 3508",
        "фото на весь лист а4",
        "изменить размер картинки под а4",
      ],
      en: [
        "a4 size in pixels",
        "a4 300 dpi",
        "2480x3508",
        "resize image to a4",
        "a4 print resolution",
      ],
    },
    paragraphs: {
      ru: [
        "A4 — это 210×297 мм, при 300 dpi — 2480×3508 px (около 8,7 Мп). Пропорции всех листов серии A одинаковые — 1:√2 ≈ 1:1,414: если сложить A4 пополам, получится A5 с тем же соотношением сторон.",
        "Фото 3:2 или 4:3 на лист A4 целиком не ложится: при заполнении края обрежутся, при вписывании останутся поля. Многие домашние принтеры не печатают без полей, поэтому важные детали не стоит ставить вплотную к краю.",
        "Для A4 нужен довольно крупный исходник. Если фото меньше 2480×3508, по умолчанию оно не увеличивается; с включённым «Разрешить увеличение» размер будет точным, но мелкие детали станут мягче.",
      ],
      en: [
        "A4 is 210×297 mm, which at 300 dpi means 2480×3508 px (about 8.7 MP). All A-series sheets share the 1:√2 ≈ 1:1.414 ratio: fold an A4 in half and you get an A5 with the same proportions.",
        "A 3:2 or 4:3 photo doesn’t fill an A4 sheet exactly: filling crops the edges, fitting leaves borders. Many home printers can’t print borderless anyway, so don’t place important details right at the edge.",
        "A4 needs a fairly large source image. If your photo is smaller than 2480×3508, it isn’t enlarged by default; with “Allow enlarging” on you get the exact size, but fine details become softer.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Сколько пикселей в формате A4?",
          a: "Зависит от разрешения: при 300 dpi — 2480×3508 px, при 150 dpi — 1240×1754 px, при 72 dpi — 595×842 px. Для печати фото и текста используют 300 dpi.",
        },
        {
          q: "Как распечатать фото на весь лист A4?",
          a: "Подготовьте файл 2480×3508 px в режиме «Заполнить и обрезать по центру», а при печати выберите печать без полей, если принтер её поддерживает. Если нет — останется узкая белая рамка, а края изображения могут немного срезаться.",
        },
        {
          q: "Чем отличаются A4 и Letter?",
          a: "Letter (8,5×11 дюйма, 216×279 мм) — стандарт США и Канады: он шире и короче A4. В России, Казахстане и Европе используется A4, поэтому для печати здесь выбирайте его.",
        },
      ],
      en: [
        {
          q: "How many pixels is A4?",
          a: "It depends on the resolution: 2480×3508 px at 300 dpi, 1240×1754 px at 150 dpi, 595×842 px at 72 dpi. Photos and text are printed at 300 dpi.",
        },
        {
          q: "How do I print a photo on a full A4 sheet?",
          a: "Prepare a 2480×3508 px file with “Fill and crop centre”, then choose borderless printing if your printer supports it. If it doesn’t, a thin white margin remains and the edges of the image may be trimmed slightly.",
        },
        {
          q: "What’s the difference between A4 and Letter?",
          a: "Letter (8.5×11 in, 216×279 mm) is the US and Canadian standard — wider and shorter than A4. Most of the rest of the world, including Europe, uses A4.",
        },
      ],
    },
    facts: {
      ru: [
        ["Размер листа", "210×297 мм"],
        ["Соотношение сторон", "1:√2 ≈ 1:1,414"],
        ["Разрешение в файле", "300 dpi"],
        ["Мегапикселей", "≈8,7 Мп"],
        ["То же при 150 dpi", "1240×1754 px"],
      ],
      en: [
        ["Sheet size", "210×297 mm"],
        ["Aspect ratio", "1:√2 ≈ 1:1.414"],
        ["Resolution in the file", "300 dpi"],
        ["Megapixels", "≈8.7 MP"],
        ["Same sheet at 150 dpi", "1240×1754 px"],
      ],
    },
  },

  /* ───────────── Screens ───────────── */
  {
    slug: "full-hd",
    group: "screen",
    w: 1920,
    h: 1080,
    fit: "cover",
    name: { ru: "Full HD", en: "Full HD" },
    title: {
      ru: "Изменить размер фото до Full HD 1920×1080",
      en: "Resize Image to Full HD 1920×1080 (1080p)",
    },
    h1: {
      ru: "Изменить размер изображения до Full HD (1920×1080)",
      en: "Resize an Image to Full HD (1920×1080)",
    },
    description: {
      ru: "Full HD — 1920×1080 px, 16:9, около 2,1 Мп: обои для монитора и ноутбука, слайды, кадры для видео. Обрезка по центру, поля или растяжение.",
      en: "Full HD is 1920×1080 px, 16:9, about 2.1 MP: wallpapers for monitors and laptops, slides and video frames. Crop from the centre, pad or stretch.",
    },
    lead: {
      ru: "Изображение приводится к 1920×1080 px — разрешению Full HD (1080p) с пропорциями 16:9.",
      en: "Your image becomes 1920×1080 px — Full HD (1080p) resolution with a 16:9 shape.",
    },
    keywords: {
      ru: [
        "изменить размер фото 1920х1080",
        "1920 на 1080 онлайн",
        "обои 1920х1080 из фото",
        "сделать картинку full hd",
        "размер 1080p",
      ],
      en: [
        "resize image to 1920x1080",
        "1920x1080 image resizer",
        "full hd image size",
        "1080p wallpaper resize",
        "make image 1920x1080",
      ],
    },
    paragraphs: {
      ru: [
        "Full HD, или 1080p, — это 1920×1080 px, около 2,1 мегапикселя. Одно из самых распространённых разрешений мониторов, ноутбуков и телевизоров, а также стандарт для видео, презентаций 16:9 и обоев рабочего стола.",
        "Фото с камеры (3:2) или смартфона (4:3) уже, чем экран 16:9, поэтому при заполнении срезаются полосы сверху и снизу. Если нужен весь кадр — «Вписать с полями» с чёрными полями или размытым фоном, как в видео.",
      ],
      en: [
        "Full HD, or 1080p, is 1920×1080 px — about 2.1 megapixels. It’s one of the most common resolutions for monitors, laptops and TVs, and the standard for video, 16:9 slides and desktop wallpapers.",
        "Camera (3:2) and smartphone (4:3) photos are narrower than a 16:9 screen, so filling it trims strips at the top and bottom. To keep the whole frame, use “Fit with padding” with black bars or a blurred background, as in videos.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Как сделать обои на рабочий стол 1920×1080?",
          a: "Выберите фото и оставьте режим «Заполнить и обрезать по центру» — картинка заполнит экран без полей. Для экранов с другим разрешением, например 2560×1440 или 3840×2160, есть отдельные пресеты.",
        },
        {
          q: "Можно ли растянуть фото до 1920×1080 без обрезки?",
          a: "Можно, режимом «Растянуть», но если пропорции исходника не 16:9, люди и предметы станут шире или уже. Без искажений работают только обрезка или вписывание с полями.",
        },
      ],
      en: [
        {
          q: "How do I make a 1920×1080 desktop wallpaper?",
          a: "Pick a photo and keep “Fill and crop centre” — the image fills the screen with no bars. For other screens, such as 2560×1440 or 3840×2160, there are separate presets.",
        },
        {
          q: "Can I stretch a photo to 1920×1080 without cropping?",
          a: "Yes, with “Stretch”, but if the source isn’t 16:9, people and objects become wider or narrower. Only cropping or fitting with padding avoid distortion.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Другие названия", "1080p, FHD"],
        ["Число пикселей", "≈2,1 Мп"],
        ["Где используется", "мониторы, ноутбуки, ТВ, видео, обои"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Also called", "1080p, FHD"],
        ["Pixel count", "≈2.1 MP"],
        ["Used for", "monitors, laptops, TVs, video, wallpapers"],
      ],
    },
  },
  {
    slug: "2k",
    group: "screen",
    w: 2560,
    h: 1440,
    fit: "cover",
    name: { ru: "2K QHD", en: "2K QHD" },
    title: {
      ru: "Размер 2K (2560×1440) — изменить фото онлайн",
      en: "Resize Image to 2K / QHD 2560×1440",
    },
    h1: {
      ru: "Изменить размер изображения до 2K (2560×1440)",
      en: "Resize an Image to 2K QHD (2560×1440)",
    },
    description: {
      ru: "2560×1440 px — QHD, или 1440p, который в быту называют 2K: 16:9, около 3,7 Мп. Кинотеатральный 2K по стандарту DCI другой — 2048×1080 px.",
      en: "2560×1440 px is QHD, or 1440p, often marketed as 2K: 16:9, about 3.7 MP. Note that cinema 2K under the DCI standard is different — 2048×1080 px.",
    },
    lead: {
      ru: "Изображение приводится к 2560×1440 px — разрешению QHD (1440p), которое продавцы мониторов обычно называют 2K.",
      en: "Your image becomes 2560×1440 px — QHD (1440p) resolution, which monitor makers usually call 2K.",
    },
    keywords: {
      ru: [
        "2k разрешение",
        "2560 на 1440",
        "обои 2560х1440",
        "изменить размер фото до 2k",
        "размер qhd",
      ],
      en: [
        "2k resolution",
        "2560x1440",
        "qhd image size",
        "1440p wallpaper resize",
        "resize image to 2k",
      ],
    },
    paragraphs: {
      ru: [
        "Названием «2K» обозначают разные вещи. В мониторах и смартфонах так обычно называют QHD — 2560×1440 px (1440p). В кинопроизводстве 2K по стандарту DCI — 2048×1080 px с пропорциями ≈1,9:1. Этот пресет рассчитан на экранное разрешение 2560×1440.",
        "QHD содержит около 3,7 Мп — в 1,78 раза больше, чем Full HD. Для обоев на 27-дюймовый монитор 1440p это точный размер, который системе не придётся масштабировать.",
      ],
      en: [
        "“2K” means different things. For monitors and phones it usually refers to QHD — 2560×1440 px (1440p). In film production, DCI 2K is 2048×1080 px with a ≈1.9:1 shape. This preset targets the 2560×1440 screen resolution.",
        "QHD has about 3.7 MP — 1.78 times as many pixels as Full HD. For a wallpaper on a 27-inch 1440p monitor it’s the exact size, so the system doesn’t need to rescale anything.",
      ],
    },
    faq: {
      ru: [
        {
          q: "2K — это 2560×1440 или 2048×1080?",
          a: "Встречаются оба варианта. Производители мониторов и телефонов называют 2K разрешение 2560×1440 (QHD), а в кино 2K — это 2048×1080 по стандарту DCI. Если нужен кинотеатральный вариант, задайте 2048×1080 вручную в пикселях.",
        },
        {
          q: "Можно ли получить 2K из фото Full HD?",
          a: "Только увеличением: включите «Разрешить увеличение». Размер станет 2560×1440, но новых деталей не появится — масштабирование лишь сгладит пиксели, и картинка будет мягче оригинала.",
        },
      ],
      en: [
        {
          q: "Is 2K 2560×1440 or 2048×1080?",
          a: "Both are used. Monitor and phone makers call 2560×1440 (QHD) “2K”, while in cinema 2K means 2048×1080 under the DCI standard. If you need the cinema version, enter 2048×1080 manually in pixels.",
        },
        {
          q: "Can I turn a Full HD image into 2K?",
          a: "Only by upscaling: turn on “Allow enlarging”. The size becomes 2560×1440, but no new detail appears — resampling just smooths the pixels, so the image looks softer than the original.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Другие названия", "QHD, WQHD, 1440p"],
        ["Число пикселей", "≈3,7 Мп — в 1,78 раза больше Full HD"],
        ["Кинотеатральный 2K (DCI)", "2048×1080 px"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Also called", "QHD, WQHD, 1440p"],
        ["Pixel count", "≈3.7 MP — 1.78× Full HD"],
        ["Cinema 2K (DCI)", "2048×1080 px"],
      ],
    },
  },
  {
    slug: "4k",
    group: "screen",
    w: 3840,
    h: 2160,
    fit: "cover",
    name: { ru: "4K UHD", en: "4K UHD" },
    title: {
      ru: "Изменить размер фото до 4K — 3840×2160 онлайн",
      en: "Resize Image to 4K UHD 3840×2160",
    },
    h1: {
      ru: "Изменить размер изображения до 4K (3840×2160)",
      en: "Resize an Image to 4K UHD (3840×2160)",
    },
    description: {
      ru: "4K UHD — 3840×2160 px, 16:9, около 8,3 Мп — ровно в 4 раза больше Full HD. Обои для 4K-монитора и телевизора. Кинотеатральный 4K — 4096×2160 px.",
      en: "4K UHD is 3840×2160 px, 16:9, about 8.3 MP — exactly 4× Full HD. Wallpapers for 4K monitors and TVs. Cinema (DCI) 4K is slightly wider at 4096×2160 px.",
    },
    lead: {
      ru: "Изображение приводится к 3840×2160 px — разрешению 4K UHD для телевизоров и мониторов.",
      en: "Your image becomes 3840×2160 px — 4K UHD resolution for TVs and monitors.",
    },
    keywords: {
      ru: [
        "4k разрешение в пикселях",
        "3840 на 2160",
        "обои 4k из фото",
        "изменить размер фото до 4k",
        "размер картинки 4k",
      ],
      en: [
        "4k resolution",
        "3840x2160",
        "resize image to 4k",
        "4k wallpaper size",
        "uhd image size",
      ],
    },
    paragraphs: {
      ru: [
        "Бытовой 4K, или Ultra HD, — это 3840×2160 px: ровно вдвое больше Full HD по каждой стороне и вчетверо по площади. Кинотеатральный стандарт DCI 4K немного шире — 4096×2160 px.",
        "Для 4K нужен исходник не меньше 8,3 Мп — снимки современных смартфонов и камер обычно крупнее. Если фото меньше, инструмент по умолчанию не станет его увеличивать; «Разрешить увеличение» даст точный размер, но без новых деталей.",
        "Фотография 4K в PNG может весить больше 10 МБ. Для обоев и публикации выбирайте JPG или WebP — файл получится в разы легче при незаметной на глаз разнице.",
      ],
      en: [
        "Consumer 4K, or Ultra HD, is 3840×2160 px: exactly twice Full HD on each side and four times the area. The DCI 4K cinema standard is slightly wider — 4096×2160 px.",
        "4K needs a source of at least 8.3 MP — modern phone and camera photos are usually larger. If yours is smaller, the tool won’t enlarge it by default; “Allow enlarging” gives the exact size but no new detail.",
        "A 4K photo saved as PNG can exceed 10 MB. For wallpapers and publishing choose JPG or WebP — the file is several times lighter with no visible difference.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Чем 4K UHD отличается от DCI 4K?",
          a: "UHD — 3840×2160 (16:9), это разрешение телевизоров, мониторов и видео на YouTube. DCI 4K — 4096×2160 (≈1,9:1), стандарт цифрового кино. Для обоев и экранов нужен UHD; 4096×2160 можно задать вручную.",
        },
        {
          q: "Можно ли сделать 4K из обычного фото?",
          a: "Из фото на 12 Мп и больше — да: это уменьшение, и качество сохранится. Из маленького снимка — только увеличением, при котором картинка станет мягче: инструмент не дорисовывает детали.",
        },
      ],
      en: [
        {
          q: "What’s the difference between 4K UHD and DCI 4K?",
          a: "UHD is 3840×2160 (16:9), the resolution of TVs, monitors and YouTube video. DCI 4K is 4096×2160 (≈1.9:1), the digital cinema standard. Screens and wallpapers need UHD; you can enter 4096×2160 manually.",
        },
        {
          q: "Can I make a 4K image from an ordinary photo?",
          a: "From a 12 MP or larger photo, yes — that’s downscaling, so quality is preserved. From a small image only by upscaling, which makes it softer: the tool doesn’t invent missing detail.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "16:9"],
        ["Другие названия", "4K UHD, Ultra HD, 2160p"],
        ["Число пикселей", "≈8,3 Мп — в 4 раза больше Full HD"],
        ["Кинотеатральный 4K (DCI)", "4096×2160 px"],
      ],
      en: [
        ["Aspect ratio", "16:9"],
        ["Also called", "4K UHD, Ultra HD, 2160p"],
        ["Pixel count", "≈8.3 MP — 4× Full HD"],
        ["Cinema 4K (DCI)", "4096×2160 px"],
      ],
    },
  },

  /* ───────────── Marketplaces ───────────── */
  {
    slug: "wildberries",
    group: "marketplace",
    w: 900,
    h: 1200,
    fit: "contain",
    name: { ru: "Wildberries", en: "Wildberries" },
    title: {
      ru: "Фото для Wildberries 3:4 — размер 900×1200",
      en: "Wildberries Photo Size 900×1200 (3:4) — Resize",
    },
    h1: {
      ru: "Размер фото для Wildberries — 900×1200 (3:4)",
      en: "Resize Product Photos for Wildberries (900×1200)",
    },
    description: {
      ru: "Фото товара для Wildberries: вертикаль 3:4, от 900×1200 px. Режим «Вписать с полями» сохраняет товар целиком. Пакетная обработка и скачивание ZIP.",
      en: "Product photos for Wildberries: 3:4 vertical, from 900×1200 px. “Fit with padding” keeps the whole product in frame. Batch processing and ZIP download.",
    },
    lead: {
      ru: "Фото товара приводится к 900×1200 px — вертикальному формату 3:4, который требуется для карточек Wildberries.",
      en: "Your product photo becomes 900×1200 px — the 3:4 vertical format Wildberries requires for product cards.",
    },
    keywords: {
      ru: [
        "размер фото для вайлдберриз",
        "фото для wildberries 900х1200",
        "формат 3:4 для wb",
        "требования к фото wildberries",
        "фото товара для маркетплейса размер",
        "как сделать фото 3 на 4 для вб",
      ],
      en: [
        "wildberries photo size",
        "wildberries image requirements",
        "900x1200",
        "3:4 product photo",
        "resize product photos for marketplace",
      ],
    },
    paragraphs: {
      ru: [
        "Для карточек товара Wildberries используется вертикальный формат 3:4; минимальный размер, который обычно называют в требованиях, — 900×1200 px. Пресет подходит и продавцам из Казахстана и других стран, где работает Wildberries.",
        "По умолчанию здесь выбран режим «Вписать с полями»: товар целиком помещается в кадр, а свободное место заполняется белым или другим цветом. Так не обрежутся углы коробки или рукава одежды. Если товар должен занимать весь кадр, переключитесь на «Заполнить и обрезать по центру».",
        "Товар должен занимать большую часть кадра: маленький предмет посреди большого белого поля в каталоге теряется. Перед изменением размера обрежьте лишний фон инструментом обрезки с пропорциями 3:4.",
      ],
      en: [
        "Wildberries product cards use a vertical 3:4 format, and 900×1200 px is the minimum size usually stated in the requirements. The preset works equally for sellers in Kazakhstan and other countries where Wildberries operates.",
        "The default mode here is “Fit with padding”: the whole product fits in the frame and the spare space is filled with white or another colour, so box corners or sleeves aren’t cut off. If the product should fill the frame, switch to “Fill and crop centre”.",
        "The product should take up most of the frame — a small item in the middle of a big white field gets lost in the catalogue. Before resizing, trim excess background with the crop tool set to 3:4.",
      ],
    },
    faq: {
      ru: [
        {
          q: "Какой размер фото нужен для Wildberries?",
          a: "Вертикальный 3:4, минимум обычно называют 900×1200 px. Можно загружать и крупнее — главное сохранить пропорции 3:4. Актуальные требования уточняйте в справке для продавцов: они время от времени меняются.",
        },
        {
          q: "Как сделать фото товара 3:4 без обрезки?",
          a: "Режим «Вписать с полями» уже выбран: фото любой формы встанет в кадр 900×1200 целиком, а пустые области заполнятся цветом. Белый — самый универсальный вариант для карточки.",
        },
        {
          q: "Можно ли обработать сразу все фото карточки?",
          a: "Да: добавьте все снимки разом — каждый будет приведён к 900×1200 px с одинаковыми настройками, а результат скачается одним ZIP-архивом.",
        },
      ],
      en: [
        {
          q: "What photo size does Wildberries require?",
          a: "A 3:4 vertical, with 900×1200 px usually cited as the minimum. Larger images are fine as long as the 3:4 ratio is kept. Check the current rules in the seller help centre, as they change from time to time.",
        },
        {
          q: "How do I make a 3:4 product photo without cropping?",
          a: "“Fit with padding” is already selected: a photo of any shape fits entirely into the 900×1200 frame and the empty areas are filled with a colour. White is the most versatile choice for a product card.",
        },
        {
          q: "Can I process all the photos for a product card at once?",
          a: "Yes: add all the shots together — each is brought to 900×1200 px with the same settings, and the results download as one ZIP.",
        },
      ],
    },
    facts: {
      ru: [
        ["Соотношение сторон", "3:4 (вертикаль)"],
        ["Требование площадки", "3:4, не меньше 900×1200 px"],
        ["Режим по умолчанию", "вписать с полями — товар целиком"],
        ["Цвет полей", "белый или любой другой"],
        ["Пакетная обработка", "все фото карточки за раз, ZIP"],
      ],
      en: [
        ["Aspect ratio", "3:4 (vertical)"],
        ["Marketplace requirement", "3:4, at least 900×1200 px"],
        ["Default mode", "fit with padding — whole product visible"],
        ["Padding colour", "white or any other"],
        ["Batch processing", "all card photos at once, ZIP"],
      ],
    },
  },
];
