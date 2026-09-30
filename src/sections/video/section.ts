import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { videoPairVariants, VIDEO_CONVERT_TARGETS } from "./data/pair-pages";

/* ───────────── aspect-ratio variants of "Resize video" ───────────── */

const ASPECTS: { slug: string; ratio: string; size: string; name: { ru: string; en: string }; title: { ru: string; en: string }; h1: { ru: string; en: string }; description: { ru: string; en: string }; lead: { ru: string; en: string }; where: { ru: string[]; en: string[] }; faq: { q: { ru: string; en: string }; a: { ru: string; en: string } } }[] = [
  {
    slug: "9-16",
    ratio: "9:16",
    size: "1080 × 1920",
    name: { ru: "9:16 — вертикальное", en: "9:16 — vertical" },
    title: { ru: "Видео 9:16 онлайн — для Reels, TikTok и Shorts", en: "Make a 9:16 video online — Reels, TikTok, Shorts" },
    h1: { ru: "Сделать видео 9:16", en: "Make a 9:16 video" },
    description: {
      ru: "Переделайте горизонтальное видео в вертикальное 9:16 (1080×1920): обрезка центра или вписывание с полями. Для Reels, TikTok, Shorts и сторис, прямо в браузере.",
      en: "Turn a landscape video into vertical 9:16 (1080×1920): crop the centre or fit it with bars. For Reels, TikTok, Shorts and Stories, right in your browser.",
    },
    lead: { ru: "Вертикальный формат 9:16 — 1080×1920 пикселей, стандарт для коротких видео в телефоне.", en: "Vertical 9:16 is 1080×1920 pixels — the standard for short phone videos." },
    where: { ru: ["TikTok", "Instagram Reels и Stories", "YouTube Shorts", "VK Клипы", "Stories в Telegram"], en: ["TikTok", "Instagram Reels and Stories", "YouTube Shorts", "Snapchat Spotlight", "Telegram Stories"] },
    faq: {
      q: { ru: "Как сделать вертикальное видео из горизонтального без потери людей в кадре?", en: "How do I make a vertical video from a landscape one without cutting people out?" },
      a: {
        ru: "«Обрезать края» оставляет центральную треть кадра — подходит, если действие в центре. Если важен весь кадр, выберите «Вписать с полями»: видео останется целиком, сверху и снизу появятся чёрные поля.",
        en: "“Crop edges” keeps the central third of the frame — fine when the action is centred. If the whole frame matters, choose “Fit with bars”: the full video stays, with black bars above and below.",
      },
    },
  },
  {
    slug: "1-1",
    ratio: "1:1",
    size: "1080 × 1080",
    name: { ru: "1:1 — квадрат", en: "1:1 — square" },
    title: { ru: "Квадратное видео 1:1 онлайн — обрезать до квадрата", en: "Square 1:1 video online — crop a video to square" },
    h1: { ru: "Сделать квадратное видео 1:1", en: "Make a square 1:1 video" },
    description: {
      ru: "Квадратное видео 1:1 (1080×1080) из горизонтального или вертикального: обрезка по центру или поля по краям. Для постов в соцсетях и рекламы, без загрузки.",
      en: "A square 1:1 video (1080×1080) from landscape or portrait: centre crop or bars at the sides. For social posts and ads, with nothing uploaded.",
    },
    lead: { ru: "Квадрат 1:1 — 1080×1080 пикселей, одинаково хорошо смотрится в ленте на телефоне и компьютере.", en: "Square 1:1 is 1080×1080 pixels and looks equally good in feeds on phones and desktops." },
    where: { ru: ["посты в ленте Instagram и Facebook", "реклама в соцсетях", "превью товаров в маркетплейсах", "посты ВКонтакте"], en: ["Instagram and Facebook feed posts", "social media ads", "product previews on marketplaces", "LinkedIn and X posts"] },
    faq: {
      q: { ru: "Какой размер выбрать для квадратного видео?", en: "What size should a square video be?" },
      a: {
        ru: "1080×1080 — стандарт для соцсетей. Если исходник меньше, видео не растягивается: размер останется исходным, чтобы не терять чёткость.",
        en: "1080×1080 is the social media standard. If the source is smaller, it isn't upscaled: the size stays original so sharpness isn't lost.",
      },
    },
  },
  {
    slug: "4-5",
    ratio: "4:5",
    size: "1080 × 1350",
    name: { ru: "4:5 — портрет для ленты", en: "4:5 — feed portrait" },
    title: { ru: "Видео 4:5 онлайн — вертикальный пост в ленту", en: "4:5 video online — portrait posts for the feed" },
    h1: { ru: "Сделать видео 4:5", en: "Make a 4:5 video" },
    description: {
      ru: "Видео 4:5 (1080×1350) — самый высокий формат для поста в ленте Instagram и Facebook: занимает больше экрана, чем квадрат. Обрезка или поля, всё в браузере.",
      en: "4:5 video (1080×1350) is the tallest format for Instagram and Facebook feed posts and fills more of the screen than a square. Crop or bars, all in the browser.",
    },
    lead: { ru: "Формат 4:5 — 1080×1350 пикселей: занимает больше места в ленте, чем квадрат.", en: "4:5 is 1080×1350 pixels — it takes more room in the feed than a square." },
    where: { ru: ["посты в ленте Instagram", "посты Facebook", "реклама в ленте"], en: ["Instagram feed posts", "Facebook posts", "in-feed ads"] },
    faq: {
      q: { ru: "Чем 4:5 лучше квадрата для ленты?", en: "Why is 4:5 better than square for the feed?" },
      a: {
        ru: "Вертикальный кадр 4:5 на 25 % выше квадрата при той же ширине, поэтому на экране телефона он заметнее. Для полноэкранных Reels и сторис используйте 9:16.",
        en: "A 4:5 frame is 25% taller than a square at the same width, so it stands out more on a phone screen. For full-screen Reels and Stories use 9:16.",
      },
    },
  },
  {
    slug: "16-9",
    ratio: "16:9",
    size: "1920 × 1080",
    name: { ru: "16:9 — горизонтальное", en: "16:9 — landscape" },
    title: { ru: "Видео 16:9 онлайн — из вертикального в горизонтальное", en: "16:9 video online — vertical to landscape" },
    h1: { ru: "Сделать видео 16:9", en: "Make a 16:9 video" },
    description: {
      ru: "Видео 16:9 (1920×1080) из вертикального ролика с телефона: вписать с чёрными полями по бокам или обрезать. Для YouTube, телевизора и презентаций, в браузере.",
      en: "16:9 video (1920×1080) from a vertical phone clip: fit it with side bars or crop it. For YouTube, TVs and presentations, in your browser.",
    },
    lead: { ru: "16:9 — 1920×1080 пикселей, формат YouTube, телевизоров и презентаций.", en: "16:9 is 1920×1080 pixels — the format of YouTube, TVs and presentations." },
    where: { ru: ["YouTube", "телевизоры и мониторы", "презентации и видеоуроки", "RuTube и VK Видео"], en: ["YouTube", "TVs and monitors", "presentations and tutorials", "Vimeo"] },
    faq: {
      q: { ru: "Как вставить вертикальное видео в горизонтальный ролик?", en: "How do I put a vertical video into a landscape one?" },
      a: {
        ru: "Выберите «Вписать с полями»: видео 9:16 окажется в центре кадра 16:9 с чёрными полями по бокам — так его можно без искажений вставить в монтаж или показать на ТВ.",
        en: "Choose “Fit with bars”: the 9:16 video sits in the centre of a 16:9 frame with black bars at the sides, ready for an edit or a TV without distortion.",
      },
    },
  },
];

function aspectVariants(): VariantDef[] {
  return ASPECTS.map((a) => ({
    slug: a.slug,
    name: a.name,
    title: a.title,
    h1: a.h1,
    description: a.description,
    lead: a.lead,
    props: { aspect: a.ratio },
    keywords: { ru: [`видео ${a.ratio}`, `обрезать видео ${a.ratio.replace(":", " на ")}`, `формат ${a.ratio}`], en: [`${a.ratio} video`, `crop video to ${a.ratio}`, `${a.ratio} aspect ratio`] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? `Формат ${a.ratio}` : `The ${a.ratio} format`,
        rows: [
          [locale === "ru" ? "Соотношение сторон" : "Aspect ratio", a.ratio],
          [locale === "ru" ? "Размер в Full HD" : "Full HD size", a.size],
          [locale === "ru" ? "Размер в 720p" : "720p size", a.ratio === "16:9" ? "1280 × 720" : a.ratio === "9:16" ? "720 × 1280" : a.ratio === "1:1" ? "720 × 720" : "720 × 900"],
          [locale === "ru" ? "Где используется" : "Where it's used", a.where[locale].join(", ")],
        ],
      },
    ],
    faq: { ru: [{ q: a.faq.q.ru, a: a.faq.a.ru }], en: [{ q: a.faq.q.en, a: a.faq.a.en }] },
  }));
}

/* ───────────── tools ───────────── */

const privacy = (locale: "ru" | "en"): Block => ({
  type: "text",
  title: locale === "ru" ? "Файлы остаются у вас" : "Your files stay with you",
  paragraphs: [
    locale === "ru"
      ? "Видео обрабатывается прямо в браузере: основной движок — WebCodecs с аппаратным ускорением, для редких форматов на странице запускается модуль ffmpeg. Файлы не загружаются на сервер, поэтому нет ограничений по размеру, кроме памяти вашего устройства."
      : "Video is processed right in your browser: the main engine is hardware-accelerated WebCodecs, and for rare formats the page runs an ffmpeg module. Files are never uploaded, so the only size limit is your device's memory.",
  ],
});

const tools: ToolDef[] = [
  {
    slug: "video-converter",
    component: "video/convert",
    icon: "Film",
    popular: true,
    name: { ru: "Конвертер видео", en: "Video converter" },
    title: { ru: "Конвертер видео онлайн — MP4, MOV, MKV, WebM, AVI", en: "Video converter online — MP4, MOV, MKV, WebM, AVI" },
    h1: { ru: "Конвертер видео онлайн", en: "Online video converter" },
    description: {
      ru: "Конвертер видео в браузере: MOV, MKV, AVI, WebM, WMV, FLV в MP4, WebM, MOV или GIF. Смена контейнера без перекодирования, пакетная обработка, без загрузки.",
      en: "Video converter in your browser: MOV, MKV, AVI, WebM, WMV, FLV and more to MP4, WebM, MOV or GIF. Container changes without re-encoding, batches, no uploads.",
    },
    lead: { ru: "Переведите видео в MP4, WebM, MOV, MKV или GIF — когда можно, без перекодирования и потери качества.", en: "Convert video to MP4, WebM, MOV, MKV or GIF — without re-encoding or quality loss whenever possible." },
    keywords: { ru: ["конвертер видео", "конвертировать видео", "перевести видео в mp4", "видео конвертер онлайн"], en: ["video converter", "convert video", "convert to mp4", "online video converter"] },
    props: { kind: "video", to: "mp4", targets: VIDEO_CONVERT_TARGETS },
    variants: { title: { ru: "Популярные конвертации", en: "Popular conversions" }, list: videoPairVariants },
    howTo: {
      ru: ["Выберите формат на выходе: MP4 подходит почти всегда.", "Перетащите одно или несколько видео в область загрузки.", "Посмотрите план: «без перекодирования» — значит быстро и без потерь.", "Нажмите «Конвертировать» и скачайте файлы по одному или ZIP-архивом."],
      en: ["Choose the output format: MP4 fits almost every case.", "Drop one or more videos into the upload area.", "Check the plan: “no re-encoding” means fast and lossless.", "Click Convert and download the files one by one or as a ZIP."],
    },
    about: {
      ru: [
        "Если кодеки исходного файла подходят новому контейнеру (например, H.264 и AAC из MKV или MOV в MP4), видео не перекодируется, а переупаковывается — за секунды и без потери качества. Иначе видео кодируется встроенным в браузер кодировщиком WebCodecs, который использует видеокарту.",
        "Форматы, которые браузер не читает (AVI, WMV, FLV, MPEG, VOB), обрабатывает модуль ffmpeg прямо на странице. Он загружается с этого сайта только при первой необходимости и работает медленнее, зато поддерживает старые кодеки.",
      ],
      en: [
        "When the source codecs fit the new container (say, H.264 and AAC from MKV or MOV to MP4), the video isn't re-encoded but repackaged — in seconds and without quality loss. Otherwise it's encoded by the browser's WebCodecs encoder, which uses the GPU.",
        "Formats the browser can't read (AVI, WMV, FLV, MPEG, VOB) are handled by an ffmpeg module right on the page. It's downloaded from this site only when first needed and is slower, but it supports old codecs.",
      ],
    },
    faq: {
      ru: [
        { q: "Есть ли ограничение на размер файла?", a: "Жёсткого лимита нет: файл обрабатывается на вашем устройстве. Практический предел — память браузера; для файлов больше 2 ГБ появится предупреждение." },
        { q: "Почему некоторые файлы конвертируются мгновенно, а другие долго?", a: "Смена контейнера без перекодирования занимает секунды. Перекодирование зависит от длины видео и мощности устройства, а через модуль ffmpeg (AVI, WMV) идёт заметно медленнее." },
        { q: "Как получить видео, которое точно откроется везде?", a: "Выберите MP4 и включите в настройках «Максимальная совместимость»: видео будет в H.264, звук — в AAC. Такой файл открывается на iPhone, Android, Windows, Mac и телевизорах." },
        { q: "Как извлечь звук из видео?", a: "Для этого есть «Аудиоконвертер»: загрузите видео и выберите MP3, M4A или WAV — возьмётся только звуковая дорожка." },
      ],
      en: [
        { q: "Is there a file size limit?", a: "There's no hard limit: files are processed on your device. The practical limit is browser memory; files over 2 GB show a warning." },
        { q: "Why do some files convert instantly and others slowly?", a: "A container change without re-encoding takes seconds. Re-encoding depends on the video length and your device, and the ffmpeg module (AVI, WMV) is noticeably slower." },
        { q: "How do I get a video that plays everywhere?", a: "Choose MP4 and turn on “Maximum compatibility” in the settings: video becomes H.264 and audio AAC, which plays on iPhone, Android, Windows, Mac and TVs." },
        { q: "How do I extract audio from a video?", a: "Use the audio converter: load the video and choose MP3, M4A or WAV — only the soundtrack is taken." },
      ],
    },
    related: ["compress-video", "video-to-gif", "trim-video", "audio-converter/mp4-to-mp3", "merge-videos"],
    blocks: (locale) => [privacy(locale)],
    wide: false,
  },
  {
    slug: "compress-video",
    component: "video/compress",
    icon: "Minimize2",
    popular: true,
    name: { ru: "Сжать видео", en: "Compress video" },
    title: { ru: "Сжать видео онлайн — уменьшить размер MP4 без регистрации", en: "Compress video online — reduce MP4 file size" },
    description: {
      ru: "Сжать видео в браузере: выберите качество и разрешение или нужный размер в МБ — битрейт рассчитается сам. Оценка размера заранее, H.264 MP4, без загрузки.",
      en: "Compress video in your browser: pick quality and resolution or a target size in MB and the bitrate is set for you. Size estimate first, H.264 MP4, no uploads.",
    },
    lead: { ru: "Уменьшите видео до нужного размера — например, чтобы отправить в мессенджер или по почте.", en: "Shrink a video to the size you need — e.g. to send it by messenger or email." },
    keywords: { ru: ["сжать видео", "уменьшить размер видео", "сжать mp4", "уменьшить вес видео"], en: ["compress video", "reduce video size", "compress mp4", "make video smaller"] },
    howTo: {
      ru: ["Загрузите видео.", "Выберите «По качеству» (качество и разрешение) или «До размера» (сколько мегабайт нужно).", "Посмотрите ожидаемый размер: он рассчитан по битрейту и длительности.", "Нажмите «Сжать видео» и скачайте результат."],
      en: ["Load a video.", "Choose “By quality” (quality and resolution) or “To a size” (how many megabytes you need).", "Check the expected size, calculated from bitrate and duration.", "Click Compress video and download the result."],
    },
    about: {
      ru: [
        "Размер видео почти целиком определяется битрейтом: размер ≈ (битрейт видео + битрейт звука) × длительность. В режиме «До размера» инструмент решает эту формулу наоборот и оставляет около 4 % запаса на служебные данные и неточность кодировщика.",
        "Если битрейта мало для исходного разрешения, разрешение автоматически снижается (1080p → 720p → 480p): на меньшем кадре тот же битрейт выглядит заметно чище. Видео кодируется в H.264 — такой MP4 открывается где угодно.",
      ],
      en: [
        "Video size is almost entirely determined by bitrate: size ≈ (video bitrate + audio bitrate) × duration. In “To a size” mode the tool solves this formula backwards and leaves about 4% headroom for container overhead and encoder variance.",
        "If the bitrate is too low for the source resolution, the resolution is lowered automatically (1080p → 720p → 480p): the same bitrate looks much cleaner on a smaller frame. The video is encoded to H.264, an MP4 that opens anywhere.",
      ],
    },
    faq: {
      ru: [
        { q: "Насколько точно получится нужный размер?", a: "Обычно в пределах 10–15 %: кодировщик держит битрейт приблизительно. Если результат чуть больше лимита, повторите сжатие с меньшим размером." },
        { q: "Почему сжатое видео стало больше исходного?", a: "Если исходник уже закодирован с низким битрейтом, выбор «Высокого» качества его увеличит. В таком случае инструмент предупредит — выберите качество ниже или меньшее разрешение." },
        { q: "Как сжать видео сильнее всего?", a: "Уменьшите разрешение до 720p или 480p и выберите «Низкое» качество. Ещё сильнее помогает обрезка: вдвое короче — вдвое меньше." },
      ],
      en: [
        { q: "How exact is the target size?", a: "Usually within 10–15%: encoders follow the bitrate approximately. If the result is slightly over the limit, compress again with a smaller size." },
        { q: "Why did the compressed video get bigger?", a: "If the source already has a low bitrate, “High” quality will enlarge it. The tool warns you in that case — choose lower quality or a smaller resolution." },
        { q: "How do I compress a video the most?", a: "Lower the resolution to 720p or 480p and choose “Low” quality. Trimming helps even more: half as long, half the size." },
      ],
    },
    related: ["trim-video", "video-converter", "resize-video", "remove-audio-from-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "trim-video",
    component: "video/trim",
    icon: "Scissors",
    popular: true,
    name: { ru: "Обрезать видео", en: "Trim video" },
    title: { ru: "Обрезать видео онлайн — вырезать фрагмент без потерь", en: "Trim video online — cut a clip without quality loss" },
    description: {
      ru: "Обрезать видео онлайн: выберите начало и конец на шкале с кадрами или введите время вида 1:05,5. Быстрый режим без перекодирования или точный до кадра.",
      en: "Trim a video online: set the start and end on a filmstrip timeline or type times like 1:05.5. A fast mode without re-encoding or a frame-accurate one.",
    },
    lead: { ru: "Оставьте из видео только нужный фрагмент — без перекодирования и потери качества.", en: "Keep only the part of the video you need — without re-encoding or quality loss." },
    keywords: { ru: ["обрезать видео", "вырезать фрагмент из видео", "обрезать видео по времени", "укоротить видео"], en: ["trim video", "cut video", "cut a clip from video", "shorten video"] },
    howTo: {
      ru: ["Загрузите видео — появится шкала с кадрами.", "Перетащите маркеры начала и конца или введите время вручную.", "Проверьте фрагмент кнопкой «Проиграть фрагмент».", "Выберите режим и нажмите «Обрезать видео»."],
      en: ["Load a video — a filmstrip timeline appears.", "Drag the start and end handles or type the times.", "Check the clip with “Play selection”.", "Pick a mode and click Trim video."],
    },
    about: {
      ru: [
        "Быстрый режим копирует видео без перекодирования, поэтому качество не меняется, а обработка занимает секунды. Разрез в этом случае приходится на ближайший ключевой кадр — начало может сдвинуться на долю секунды или пару секунд, в зависимости от того, как часто в видео расставлены ключевые кадры.",
        "Точный режим перекодирует видео и режет ровно по выбранным кадрам. Маркеры можно двигать мышью, пальцем или стрелками клавиатуры (с Shift — шаг в 10 раз больше).",
      ],
      en: [
        "Fast mode copies the video without re-encoding, so quality is unchanged and it takes seconds. The cut lands on the nearest key frame, so the start may shift by a fraction of a second or a couple of seconds, depending on how often the video has key frames.",
        "Precise mode re-encodes the video and cuts exactly at the chosen frames. Handles can be moved with a mouse, a finger or the arrow keys (Shift makes steps 10 times larger).",
      ],
    },
    faq: {
      ru: [
        { q: "Почему в быстром режиме начало немного сдвинулось?", a: "Без перекодирования видео можно начать только с ключевого кадра. Если нужна точность до кадра, выберите режим «Точно до кадра»." },
        { q: "Можно ли вырезать середину и склеить края?", a: "Обрежьте видео дважды — до вырезаемого места и после него, — затем соедините части в «Склеить видео». Одинаковые по параметрам части склеятся без перекодирования." },
        { q: "В каком формате сохранится результат?", a: "В том же контейнере, что и исходник (MP4, MOV, MKV или WebM); для других форматов — в MP4." },
      ],
      en: [
        { q: "Why did the start shift a little in fast mode?", a: "Without re-encoding a video can only start on a key frame. For frame accuracy choose the “Frame-accurate” mode." },
        { q: "Can I cut out the middle and join the ends?", a: "Trim twice — before and after the part you don't want — then join the pieces in “Merge videos”. Matching pieces are joined without re-encoding." },
        { q: "What format is the result?", a: "The same container as the source (MP4, MOV, MKV or WebM); other formats are saved as MP4." },
      ],
    },
    related: ["merge-videos", "video-to-gif", "compress-video", "trim-audio"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "video-to-gif",
    component: "video/to-gif",
    icon: "ImagePlay",
    popular: true,
    name: { ru: "Видео в GIF", en: "Video to GIF" },
    title: { ru: "Видео в GIF онлайн — сделать гифку из видео", en: "Video to GIF online — make a GIF from a video" },
    description: {
      ru: "Сделайте GIF из видео: выберите фрагмент, частоту кадров (5–30) и ширину, палитру общую или для каждого кадра. Без водяных знаков, работает в браузере.",
      en: "Make a GIF from a video: pick the clip, frame rate (5–30) and width, and a global or per-frame palette. No watermarks, runs in your browser.",
    },
    lead: { ru: "Выберите несколько секунд видео — получите GIF с подобранной палитрой, без водяных знаков.", en: "Pick a few seconds of video and get a GIF with a proper palette — no watermarks." },
    keywords: { ru: ["видео в gif", "сделать гифку из видео", "mp4 в gif", "конвертер gif"], en: ["video to gif", "make a gif from video", "mp4 to gif", "gif maker"] },
    howTo: {
      ru: ["Загрузите видео (MP4, MOV, WebM и другие).", "Выберите фрагмент на шкале — для GIF обычно хватает 2–10 секунд.", "Задайте частоту кадров, ширину и палитру.", "Нажмите «Сделать GIF» и скачайте анимацию."],
      en: ["Load a video (MP4, MOV, WebM and more).", "Select the clip on the timeline — 2–10 seconds is usually enough for a GIF.", "Set the frame rate, width and palette.", "Click Make GIF and download the animation."],
    },
    about: {
      ru: [
        "В GIF не больше 256 цветов на кадр, поэтому главное для качества — палитра. Общая палитра подбирается по нескольким кадрам сразу: цвета не мерцают, файл меньше. Палитра на каждый кадр точнее передаёт цвета, но весит больше.",
        "Браузеры округляют задержку кадра GIF до сотых долей секунды и показывают кадры короче 0,02 с как 0,1 с, поэтому частота выше 50 кадров в секунду не имеет смысла. Задержки считаются с накоплением, чтобы общая длительность не «уплывала».",
      ],
      en: [
        "A GIF has at most 256 colours per frame, so the palette decides the quality. A global palette is built from several frames at once: colours don't flicker and the file is smaller. A per-frame palette renders colours more accurately but weighs more.",
        "Browsers store GIF delays in hundredths of a second and show frames shorter than 0.02 s as 0.1 s, so more than 50 frames per second makes no sense. Delays are accumulated so the total duration doesn't drift.",
      ],
    },
    faq: {
      ru: [
        { q: "Как уменьшить размер GIF?", a: "Сократите фрагмент, уменьшите ширину (320–480 пикселей) и частоту кадров (8–12). Общая палитра тоже даёт файл меньше." },
        { q: "Есть ли водяной знак?", a: "Нет. GIF создаётся на вашем устройстве, мы ничего не добавляем." },
        { q: "Можно ли сделать GIF, который проигрывается один раз?", a: "Да: снимите галочку «Повторять по кругу» — анимация остановится на последнем кадре." },
      ],
      en: [
        { q: "How do I make the GIF smaller?", a: "Shorten the clip, reduce the width (320–480 pixels) and the frame rate (8–12). A global palette also gives a smaller file." },
        { q: "Is there a watermark?", a: "No. The GIF is created on your device and nothing is added." },
        { q: "Can the GIF play only once?", a: "Yes: untick “Loop forever” and the animation stops on the last frame." },
      ],
    },
    related: ["video-converter/gif-to-mp4", "trim-video", "screen-recorder", "extract-frames-from-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "merge-videos",
    component: "video/merge",
    icon: "Combine",
    name: { ru: "Склеить видео", en: "Merge videos" },
    title: { ru: "Склеить видео онлайн — соединить несколько роликов в один", en: "Merge videos online — join clips into one" },
    description: {
      ru: "Склеить видео онлайн: соедините несколько роликов в один в любом порядке. Клипы одного формата склеиваются без перекодирования, разные — кодируются в H.264.",
      en: "Merge videos online: join several clips into one in any order. Clips of the same format are joined without re-encoding; different ones are re-encoded to H.264.",
    },
    lead: { ru: "Соедините несколько видео в одно — клипы с одной камеры склеятся без потери качества.", en: "Join several videos into one — clips from the same camera are merged without quality loss." },
    keywords: { ru: ["склеить видео", "соединить видео", "объединить видео", "склеить несколько видео в одно"], en: ["merge videos", "join videos", "combine videos", "concatenate video"] },
    howTo: {
      ru: ["Добавьте видео в том порядке, в котором их нужно склеить.", "При необходимости поменяйте порядок стрелками.", "Посмотрите, получится ли склеить без перекодирования.", "Нажмите «Склеить видео» и скачайте результат."],
      en: ["Add the videos in the order they should be joined.", "Reorder with the arrows if needed.", "See whether they can be joined without re-encoding.", "Click Merge videos and download the result."],
    },
    about: {
      ru: [
        "Если у всех клипов одинаковые кодек, разрешение, ориентация и параметры звука — например, записи одной камеры или части одного файла, — они соединяются копированием: быстро и без потерь.",
        "Если клипы разные, каждый декодируется и кодируется заново в H.264 и AAC с размером первого клипа; кадры другой формы вписываются с полями. Для клипов без звука добавляется тишина, чтобы звук и картинка не разъезжались.",
      ],
      en: [
        "If all clips share the codec, resolution, orientation and audio settings — for example, recordings from one camera or parts of one file — they are joined by copying: fast and lossless.",
        "If the clips differ, each is decoded and re-encoded to H.264 and AAC at the first clip's size; frames of a different shape are fitted with bars. Silence is added for clips without sound so audio and video stay in sync.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли склеить видео с телефона и с камеры?", a: "Да, но у них разные параметры, поэтому видео будет перекодировано в размер первого клипа. Поставьте первым клип с нужным разрешением." },
        { q: "Как добавить переход между клипами?", a: "Переходы и музыка не поддерживаются — это инструмент для быстрой склейки. Для монтажа используйте видеоредактор." },
        { q: "Почему не принимается AVI или WMV?", a: "Склейка работает с форматами, которые читает браузер (MP4, MOV, MKV, WebM, TS). Сначала сконвертируйте файлы в MP4 в «Конвертере видео»." },
      ],
      en: [
        { q: "Can I merge phone and camera videos?", a: "Yes, but their settings differ, so the video is re-encoded to the first clip's size. Put the clip with the resolution you want first." },
        { q: "How do I add transitions between clips?", a: "Transitions and music aren't supported — this tool is for quick joining. Use a video editor for editing." },
        { q: "Why aren't AVI or WMV accepted?", a: "Merging works with formats the browser can read (MP4, MOV, MKV, WebM, TS). Convert the files to MP4 in the video converter first." },
      ],
    },
    related: ["trim-video", "video-converter", "merge-audio", "compress-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "resize-video",
    component: "video/resize",
    icon: "Crop",
    name: { ru: "Изменить размер видео", en: "Resize video" },
    title: { ru: "Изменить размер видео онлайн — 9:16, 1:1, 16:9, 4:5", en: "Resize video online — 9:16, 1:1, 16:9, 4:5" },
    description: {
      ru: "Изменить формат видео онлайн: 9:16 для Reels и TikTok, 1:1, 4:5, 16:9. Обрезка краёв по центру или вписывание с полями, 1080p/720p/480p, предпросмотр рамки.",
      en: "Change a video's aspect ratio online: 9:16 for Reels and TikTok, 1:1, 4:5, 16:9. Centre crop or fit with bars, 1080p/720p/480p, with a live crop preview.",
    },
    lead: { ru: "Переделайте видео под нужное соотношение сторон — обрезкой краёв или с полями.", en: "Reshape a video to the aspect ratio you need — by cropping the edges or adding bars." },
    keywords: { ru: ["изменить размер видео", "обрезать видео по размеру", "изменить формат видео", "кадрировать видео"], en: ["resize video", "crop video", "change aspect ratio", "video aspect ratio"] },
    props: { aspect: "9:16" },
    variants: { title: { ru: "Форматы", en: "Formats" }, list: aspectVariants },
    howTo: {
      ru: ["Загрузите видео.", "Выберите соотношение сторон — на превью появится рамка.", "Выберите «Обрезать края» или «Вписать с полями» и качество.", "Нажмите «Изменить размер» и скачайте MP4."],
      en: ["Load a video.", "Choose the aspect ratio — a frame appears on the preview.", "Choose “Crop edges” or “Fit with bars” and the quality.", "Click Resize video and download the MP4."],
    },
    about: {
      ru: [
        "«Обрезать края» вырезает центральную часть кадра нужной формы — картинка заполняет весь экран, но края теряются. «Вписать с полями» сохраняет кадр целиком и добавляет чёрные поля.",
        "Размеры всегда чётные (этого требует H.264), а видео никогда не растягивается больше исходного разрешения — так не теряется чёткость.",
      ],
      en: [
        "“Crop edges” cuts out the centre of the frame in the new shape — the picture fills the screen but the edges are lost. “Fit with bars” keeps the whole frame and adds black bars.",
        "Dimensions are always even (H.264 requires it), and the video is never enlarged beyond its original resolution, so no sharpness is lost.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли сдвинуть рамку обрезки?", a: "Сейчас обрезка всегда по центру кадра. Если объект у края, выберите «Вписать с полями»." },
        { q: "Какое качество выбрать?", a: "1080p — стандарт для соцсетей. 720p даёт файл заметно меньше и подходит для мессенджеров." },
        { q: "Изменится ли звук?", a: "Нет, звук сохраняется, а если он в AAC — копируется без перекодирования." },
      ],
      en: [
        { q: "Can I move the crop frame?", a: "The crop is currently always centred. If the subject is near the edge, choose “Fit with bars”." },
        { q: "Which quality should I choose?", a: "1080p is the social media standard. 720p gives a noticeably smaller file and suits messengers." },
        { q: "Does the audio change?", a: "No, the audio is kept, and AAC audio is copied without re-encoding." },
      ],
    },
    related: ["rotate-video", "compress-video", "trim-video", "video-converter"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "rotate-video",
    component: "video/rotate",
    icon: "RotateCw",
    name: { ru: "Повернуть видео", en: "Rotate video" },
    title: { ru: "Повернуть видео онлайн — на 90°, 180° или отразить", en: "Rotate video online — 90°, 180° or flip" },
    description: {
      ru: "Повернуть видео на 90° или 180°, отразить по горизонтали или вертикали. Поворот метаданными — мгновенно и без потерь, или перекодирование для любых плееров.",
      en: "Rotate a video by 90 or 180 degrees and flip it horizontally or vertically. Rotate via metadata — instant and lossless — or re-encode for any player.",
    },
    lead: { ru: "Исправьте видео, снятое боком или вверх ногами, — часто мгновенно и без потери качества.", en: "Fix a video shot sideways or upside down — often instantly and without quality loss." },
    keywords: { ru: ["повернуть видео", "перевернуть видео", "отразить видео", "повернуть видео на 90 градусов"], en: ["rotate video", "flip video", "mirror video", "rotate video 90 degrees"] },
    howTo: {
      ru: ["Загрузите видео.", "Поворачивайте кнопками ±90° и отражайте — превью меняется сразу.", "Если видео будет открываться в старых плеерах, включите перекодирование.", "Нажмите «Сохранить видео»."],
      en: ["Load a video.", "Rotate with the ±90° buttons and flip — the preview updates immediately.", "If old players will open it, turn on re-encoding.", "Click Save video."],
    },
    about: {
      ru: [
        "MP4 и MOV хранят ориентацию видео в метаданных — так делают сами телефоны. Поэтому поворот без перекодирования занимает секунды и не трогает картинку.",
        "Отражение и режим «Перекодировать» меняют сами пиксели: видео кодируется заново в H.264 и корректно отображается даже в плеерах, которые игнорируют метаданные поворота.",
      ],
      en: [
        "MP4 and MOV store the video orientation in metadata — that's what phones do themselves. So rotating without re-encoding takes seconds and doesn't touch the picture.",
        "Flipping and the “Re-encode” option change the pixels themselves: the video is re-encoded to H.264 and displays correctly even in players that ignore rotation metadata.",
      ],
    },
    faq: {
      ru: [
        { q: "Видео повернулось на телефоне, но не в программе на компьютере — почему?", a: "Программа игнорирует метаданные поворота. Повторите поворот с включённым «Перекодировать» — поворот будет «вшит» в кадры." },
        { q: "Как отразить видео, как в зеркале?", a: "Нажмите кнопку «Отразить по горизонтали». Это полезно для записей с фронтальной камеры." },
        { q: "Как перевернуть видео вверх ногами?", a: "Нажмите «+90°» дважды — получится поворот на 180°." },
      ],
      en: [
        { q: "It rotated on my phone but not in a desktop app — why?", a: "That app ignores rotation metadata. Rotate again with “Re-encode” on so the rotation is baked into the frames." },
        { q: "How do I mirror a video?", a: "Click “Flip horizontally”. It's useful for front-camera recordings." },
        { q: "How do I turn a video upside down?", a: "Click “+90°” twice for a 180° rotation." },
      ],
    },
    related: ["resize-video", "trim-video", "video-converter", "compress-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "remove-audio-from-video",
    component: "video/mute",
    icon: "VolumeX",
    name: { ru: "Убрать звук из видео", en: "Remove audio from video" },
    title: { ru: "Убрать звук из видео онлайн — без перекодирования", en: "Remove audio from video online — no re-encoding" },
    description: {
      ru: "Убрать звук из видео онлайн: дорожка звука удаляется, а видео копируется без перекодирования — качество прежнее, это занимает секунды. MP4, MOV, MKV, WebM.",
      en: "Remove audio from a video online: the soundtrack is dropped and the video copied without re-encoding — same quality, done in seconds. MP4, MOV, MKV, WebM.",
    },
    lead: { ru: "Получите то же видео без звука — за секунды и без потери качества.", en: "Get the same video without sound — in seconds, with no quality loss." },
    keywords: { ru: ["убрать звук из видео", "удалить звук из видео", "видео без звука", "выключить звук в видео"], en: ["remove audio from video", "mute video", "video without sound", "delete sound from video"] },
    howTo: {
      ru: ["Загрузите видео.", "Нажмите «Убрать звук».", "Скачайте видео без звуковой дорожки."],
      en: ["Load a video.", "Click Remove audio.", "Download the video without its soundtrack."],
    },
    about: {
      ru: [
        "Видеодорожка копируется как есть, а звуковая просто не записывается в новый файл. Поэтому картинка остаётся бит в бит исходной, а файл становится немного меньше.",
        "Звук удаляется полностью, а не приглушается: в файле не остаётся звуковой дорожки. Если нужно сохранить звук отдельно, используйте «Аудиоконвертер».",
      ],
      en: [
        "The video track is copied as is and the audio track is simply not written to the new file, so the picture stays bit-for-bit original and the file gets a little smaller.",
        "The audio is removed completely rather than muted: the file has no audio track at all. To keep the sound separately, use the audio converter.",
      ],
    },
    faq: {
      ru: [
        { q: "Можно ли убрать только музыку и оставить голос?", a: "Нет, инструмент удаляет всю звуковую дорожку. Разделение голоса и музыки требует нейросетей и здесь не выполняется." },
        { q: "Уменьшится ли файл?", a: "Да, на объём звука — обычно на 5–10 % для видео со звуком 128–192 кбит/с." },
        { q: "Как сохранить звук из видео отдельно?", a: "Откройте «Аудиоконвертер», загрузите то же видео и выберите MP3 или M4A." },
      ],
      en: [
        { q: "Can I remove just the music and keep the voice?", a: "No, the tool removes the whole audio track. Separating voice from music needs neural networks and isn't done here." },
        { q: "Will the file get smaller?", a: "Yes, by the size of the audio — typically 5–10% for video with 128–192 kbit/s sound." },
        { q: "How do I keep the audio separately?", a: "Open the audio converter, load the same video and choose MP3 or M4A." },
      ],
    },
    related: ["audio-converter/mp4-to-mp3", "compress-video", "trim-video", "video-converter"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "change-video-speed",
    component: "video/speed",
    icon: "Gauge",
    name: { ru: "Изменить скорость видео", en: "Change video speed" },
    title: { ru: "Ускорить или замедлить видео онлайн — от 0,25× до 4×", en: "Speed up or slow down video online — 0.25× to 4×" },
    description: {
      ru: "Ускорить или замедлить видео в 0,25–4 раза, с сохранением высоты голоса или без. Скорость сразу применяется в превью, результат — MP4 или исходный формат.",
      en: "Speed up or slow down a video from 0.25× to 4×, with or without keeping the voice pitch. The preview plays at the new speed; output is MP4 or the source format.",
    },
    lead: { ru: "Ускорьте видео для таймлапса или замедлите для slow motion — звук подстроится.", en: "Speed a video up for a timelapse or slow it down for slow motion — the audio follows." },
    keywords: { ru: ["ускорить видео", "замедлить видео", "изменить скорость видео", "ускорить видео в 2 раза"], en: ["speed up video", "slow down video", "change video speed", "video speed changer"] },
    props: { speed: 2 },
    howTo: {
      ru: ["Загрузите видео.", "Выберите скорость — превью сразу проигрывается с ней.", "Решите, сохранять ли высоту голоса.", "Нажмите «Изменить скорость» и скачайте результат."],
      en: ["Load a video.", "Choose a speed — the preview plays at it right away.", "Decide whether to keep the voice pitch.", "Click Change speed and download the result."],
    },
    about: {
      ru: [
        "Скорость видео меняется пересчётом времени кадров, поэтому кадры не теряются и не дублируются. При ускорении частота кадров ограничивается 60 в секунду — лишние кадры отбрасываются, чтобы файл не рос.",
        "Звук можно ускорить с сохранением высоты голоса (алгоритм WSOLA) или как на магнитофоне — тогда голос становится выше или ниже.",
      ],
      en: [
        "Video speed is changed by retiming frames, so frames are neither lost nor duplicated. When speeding up, the frame rate is capped at 60 per second — extra frames are dropped so the file doesn't grow.",
        "Audio can be sped up keeping the voice pitch (the WSOLA algorithm) or like a tape — then the voice gets higher or lower.",
      ],
    },
    faq: {
      ru: [
        { q: "Будет ли замедление плавным, как slow motion на телефоне?", a: "Замедление растягивает существующие кадры. Плавный slow motion получится, если видео снято с высокой частотой (60–240 кадров в секунду)." },
        { q: "Можно ли ускорить видео в 10 раз?", a: "Здесь максимум 4×. Для большего ускорения обработайте результат ещё раз: 4× и потом 2,5× дадут 10×." },
        { q: "Что значит «сохранить высоту голоса»?", a: "Голос звучит в обычном тоне, но быстрее или медленнее. Без этой опции ускоренный голос становится «мультяшным», а замедленный — низким." },
      ],
      en: [
        { q: "Will slowing down be smooth like phone slow motion?", a: "Slowing down stretches existing frames. It's smooth when the video was shot at a high frame rate (60–240 frames per second)." },
        { q: "Can I speed a video up 10×?", a: "The maximum here is 4×. For more, process the result again: 4× then 2.5× gives 10×." },
        { q: "What does “keep voice pitch” mean?", a: "The voice keeps its normal tone but plays faster or slower. Without it a sped-up voice sounds cartoonish and a slowed one sounds deep." },
      ],
    },
    related: ["change-audio-speed", "trim-video", "video-to-gif", "compress-video"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "extract-frames-from-video",
    component: "video/frames",
    icon: "Images",
    name: { ru: "Кадры из видео", en: "Extract frames from video" },
    title: { ru: "Кадры из видео онлайн — сохранить в JPG или PNG", en: "Extract frames from video online — JPG or PNG" },
    description: {
      ru: "Извлечь кадры из видео: текущий кадр в PNG одним нажатием или кадры через каждые 0,1–60 секунд в JPG, PNG или WebP одним ZIP-архивом. В браузере, без загрузки.",
      en: "Extract frames from a video: the current frame as PNG in one click, or frames every 0.1–60 seconds as JPG, PNG or WebP in one ZIP. In your browser, no uploads.",
    },
    lead: { ru: "Сохраните стоп-кадр или серию кадров из видео в виде картинок.", en: "Save a still or a series of frames from a video as images." },
    keywords: { ru: ["кадры из видео", "сохранить кадр из видео", "видео в jpg", "раскадровка видео"], en: ["extract frames from video", "save frame from video", "video to jpg", "video to images"] },
    howTo: {
      ru: ["Загрузите видео.", "Для одного кадра поставьте видео на паузу и нажмите «Сохранить текущий кадр».", "Для серии выберите интервал, формат и ширину.", "Нажмите «Сохранить кадры» и скачайте ZIP."],
      en: ["Load a video.", "For one frame, pause the video and click “Save current frame”.", "For a series, choose the interval, format and width.", "Click Save frames and download the ZIP."],
    },
    about: {
      ru: [
        "Кадры декодируются браузером и сохраняются в исходном разрешении или уменьшенными. В имени каждого файла есть его время в видео, поэтому серию удобно сортировать.",
        "PNG сохраняет кадр без потерь, JPG и WebP весят в несколько раз меньше. Архив собирается без сжатия — картинки уже сжаты, поэтому так быстрее.",
      ],
      en: [
        "Frames are decoded by the browser and saved at the original resolution or scaled down. Each file name contains its time in the video, so the series sorts nicely.",
        "PNG keeps the frame lossless; JPG and WebP are several times smaller. The archive is built without compression — the images are already compressed, so it's faster.",
      ],
    },
    faq: {
      ru: [
        { q: "Как сохранить конкретный кадр?", a: "Поставьте видео на паузу на нужном месте (стрелками плеера можно двигаться точнее) и нажмите «Сохранить текущий кадр» — скачается PNG в исходном разрешении." },
        { q: "Можно ли извлечь все кадры подряд?", a: "Выберите интервал 0,1 с — это 10 кадров в секунду видео. Для длинных роликов это тысячи файлов, поэтому инструмент предупредит о нагрузке." },
        { q: "Почему для AVI кнопка неактивна?", a: "Покадровая выгрузка работает с форматами, которые декодирует браузер. Сначала сконвертируйте AVI в MP4." },
      ],
      en: [
        { q: "How do I save one specific frame?", a: "Pause the video at the spot (the player's arrow keys give finer steps) and click “Save current frame” — a full-resolution PNG downloads." },
        { q: "Can I extract every frame?", a: "Choose the 0.1 s interval — 10 frames per second of video. Long videos produce thousands of files, so the tool warns you about the load." },
        { q: "Why is the button disabled for AVI?", a: "Frame export works with formats the browser can decode. Convert the AVI to MP4 first." },
      ],
    },
    related: ["video-to-gif", "trim-video", "screen-recorder", "video-converter"],
    blocks: (locale) => [privacy(locale)],
  },
  {
    slug: "screen-recorder",
    component: "video/recorder",
    props: { mode: "screen" },
    icon: "MonitorPlay",
    popular: true,
    name: { ru: "Запись экрана", en: "Screen recorder" },
    title: { ru: "Запись экрана онлайн — со звуком, без программ", en: "Screen recorder online — with audio, no install" },
    description: {
      ru: "Запись экрана в браузере без программ: весь экран, окно или вкладка, звук вкладки и микрофон, пауза. Сохранение в MP4 или WebM, без водяных знаков и лимита.",
      en: "Record your screen in the browser, nothing to install: full screen, window or tab, tab audio and microphone, pause. MP4 or WebM, no watermark, no time limit.",
    },
    lead: { ru: "Запишите экран со звуком прямо в браузере — без регистрации, программ и водяных знаков.", en: "Record your screen with sound right in the browser — no sign-up, software or watermark." },
    keywords: { ru: ["запись экрана", "записать экран", "запись экрана со звуком", "запись экрана онлайн"], en: ["screen recorder", "record screen", "screen recording with audio", "online screen recorder"] },
    howTo: {
      ru: ["Отметьте, нужен ли звук вкладки и микрофон.", "Нажмите «Начать запись экрана» и выберите экран, окно или вкладку.", "Ставьте на паузу при необходимости; остановите кнопкой «Остановить» или в панели браузера.", "Скачайте запись или сохраните её в MP4."],
      en: ["Choose whether to capture tab audio and the microphone.", "Click “Start screen recording” and pick a screen, window or tab.", "Pause when needed; stop with the Stop button or the browser's sharing bar.", "Download the recording or save it as MP4."],
    },
    about: {
      ru: [
        "Запись идёт средствами браузера (Screen Capture и MediaRecorder) и хранится только в памяти вкладки. Chrome и Edge могут записывать звук вкладки или всей системы (в Windows), Firefox и Safari — только картинку и микрофон.",
        "Браузер пишет в MP4 (H.264), если умеет, иначе в WebM. Запись WebM после остановки переупаковывается, чтобы в плеере работала перемотка, а кнопка «Сохранить в MP4» перекодирует её в H.264.",
      ],
      en: [
        "Recording uses the browser's own Screen Capture and MediaRecorder APIs and stays in the tab's memory. Chrome and Edge can capture tab audio or, on Windows, system audio; Firefox and Safari capture video and the microphone only.",
        "The browser records MP4 (H.264) when it can, otherwise WebM. A WebM recording is remuxed after you stop so seeking works in players, and “Save as MP4” re-encodes it to H.264.",
      ],
    },
    faq: {
      ru: [
        { q: "Как записать экран со звуком?", a: "Отметьте «Звук вкладки или системы» и в окне выбора Chrome включите «Поделиться звуком». Для голоса отметьте «Микрофон» — оба звука смешаются в одну дорожку." },
        { q: "Есть ли ограничение по длительности?", a: "Нет, но запись хранится в памяти браузера: час Full HD — это несколько гигабайт. Для длинных записей делайте паузы и сохраняйте частями." },
        { q: "Работает ли запись экрана на телефоне?", a: "Нет: мобильные браузеры не дают сайтам записывать экран. Используйте встроенную запись экрана телефона." },
      ],
      en: [
        { q: "How do I record the screen with sound?", a: "Tick “Tab or system audio” and enable “Share audio” in Chrome's picker. Tick “Microphone” for your voice — both are mixed into one track." },
        { q: "Is there a length limit?", a: "No, but the recording is kept in browser memory: an hour of Full HD is several gigabytes. For long sessions, record in parts." },
        { q: "Does screen recording work on phones?", a: "No: mobile browsers don't let websites capture the screen. Use your phone's built-in screen recorder." },
      ],
    },
    related: ["webcam-recorder", "voice-recorder", "video-to-gif", "trim-video"],
  },
  {
    slug: "webcam-recorder",
    component: "video/recorder",
    props: { mode: "webcam" },
    icon: "Webcam",
    name: { ru: "Запись с веб-камеры", en: "Webcam recorder" },
    title: { ru: "Запись видео с веб-камеры онлайн — со звуком", en: "Webcam recorder online — record video with sound" },
    description: {
      ru: "Записать видео с веб-камеры в браузере: 480p, 720p или 1080p, звук с микрофона, зеркальное превью и пауза. MP4 или WebM, запись никуда не отправляется.",
      en: "Record webcam video in the browser: 480p, 720p or 1080p, microphone sound, mirrored preview and pause. Save as MP4 or WebM; nothing is sent anywhere.",
    },
    lead: { ru: "Запишите видео с веб-камеры и микрофона — без программ и регистрации.", en: "Record video from your webcam and microphone — no software or sign-up." },
    keywords: { ru: ["запись с веб-камеры", "записать видео с камеры", "запись с вебки", "видео с веб-камеры онлайн"], en: ["webcam recorder", "record webcam video", "webcam video online", "record from camera"] },
    howTo: {
      ru: ["Выберите качество и отметьте микрофон.", "Нажмите «Начать запись с камеры» и разрешите доступ.", "Остановите запись, когда закончите.", "Скачайте видео или сохраните его в MP4."],
      en: ["Choose the quality and tick the microphone.", "Click “Start webcam recording” and allow access.", "Stop when you're done.", "Download the video or save it as MP4."],
    },
    about: {
      ru: [
        "Видео записывается средствами браузера (MediaRecorder) и хранится только на вашем устройстве. Зеркальный предпросмотр влияет лишь на изображение на экране — в файле видео не отражено.",
        "Если камера не поддерживает выбранное разрешение, браузер возьмёт ближайшее доступное. Запись WebM после остановки переупаковывается, чтобы работала перемотка.",
      ],
      en: [
        "Video is recorded with the browser's MediaRecorder and stays on your device. The mirrored preview only affects what you see — the file isn't mirrored.",
        "If the camera doesn't support the chosen resolution, the browser uses the closest one. WebM recordings are remuxed after stopping so seeking works.",
      ],
    },
    faq: {
      ru: [
        { q: "Почему камера не включается?", a: "Проверьте, что доступ к камере разрешён в настройках сайта, и что камеру не занимает другая программа — например, видеозвонок." },
        { q: "Видео в файле отражено?", a: "Нет. Зеркалится только предпросмотр, чтобы было привычно, как в зеркале; запись сохраняется так, как вас видят собеседники." },
        { q: "Как проверить камеру без записи?", a: "Нажмите «Начать запись» и сразу «Остановить» — или просто смотрите превью во время записи и удалите файл." },
      ],
      en: [
        { q: "Why won't the camera start?", a: "Make sure camera access is allowed in the site settings and that no other app — a video call, say — is using the camera." },
        { q: "Is the saved video mirrored?", a: "No. Only the preview is mirrored so it feels natural; the recording is saved the way others see you." },
        { q: "How can I test the camera without recording?", a: "Click Start and then Stop — or just watch the preview while recording and discard the file." },
      ],
    },
    related: ["screen-recorder", "voice-recorder", "trim-video", "video-converter"],
  },
];

export const videoSection = defineToolSection({
  id: "video",
  name: { ru: "Видео", en: "Video" },
  description: {
    ru: "Конвертация, сжатие и обрезка видео, GIF, запись экрана и веб-камеры — в браузере",
    en: "Convert, compress and trim video, make GIFs, record the screen and webcam — in your browser",
  },
  icon: "Film",
  hue: 280,
  category: "files",
  order: 3,
  tools,
});
