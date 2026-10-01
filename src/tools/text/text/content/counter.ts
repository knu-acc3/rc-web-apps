import type { Locale } from "@/i18n/config";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { FAQ, facts, L, LL } from "./util";

interface PlatformPage {
  slug: string;
  platform: string;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  facts: [[string, string], [string, string]][];
  faq: { ru: [string, string][]; en: [string, string][] };
  keywords: [string[], string[]];
  table?: (locale: Locale) => Block;
}

const PAGES: PlatformPage[] = [
  {
    slug: "x-twitter",
    platform: "x-twitter",
    name: ["X (Twitter)", "X (Twitter)"],
    title: ["Счётчик символов для Twitter (X) — лимит 280", "Twitter (X) character counter — 280 limit"],
    h1: ["Счётчик символов для Twitter (X)", "Twitter (X) character counter"],
    description: [
      "Проверьте, уложится ли пост в 280 знаков X: кириллица и латиница весят 1, эмодзи и иероглифы — 2, любая ссылка — 23 символа, как в подсчёте самого X.",
      "Check whether a post fits X’s 280 limit: Latin and Cyrillic weigh 1, emoji and CJK 2, and every link counts as 23 characters — just like X counts.",
    ],
    lead: ["Лимит поста — 280 взвешенных символов; каждая ссылка считается как 23.", "A post holds 280 weighted characters; every link counts as 23."],
    facts: [
      [["Лимит поста", "280 взвешенных символов"], ["Post limit", "280 weighted characters"]],
      [["Латиница, кириллица, цифры", "1 символ"], ["Latin, Cyrillic, digits", "1 character"]],
      [["Эмодзи, китайские и японские знаки", "2 символа"], ["Emoji, Chinese and Japanese characters", "2 characters"]],
      [["Любая ссылка", "23 символа (сокращается через t.co)"], ["Any link", "23 characters (shortened via t.co)"]],
    ],
    faq: {
      ru: [
        ["Почему эмодзи считается за 2 символа?", "X взвешивает символы: буквы основных алфавитов (латиница, кириллица, греческий) весят 1, остальные — 2. Любой эмодзи, даже составной вроде 👨‍👩‍👧, всегда считается как 2."],
        ["Сколько символов занимает ссылка?", "Ровно 23: X сокращает любую ссылку через t.co, поэтому длина адреса не важна."],
        ["Можно ли написать больше 280 символов?", "Подписчики X Premium могут публиковать длинные посты. Для обычного аккаунта лимит — 280 взвешенных символов, счётчик покажет превышение красным."],
      ],
      en: [
        ["Why does an emoji count as 2?", "X weights characters: letters of the main alphabets (Latin, Cyrillic, Greek) weigh 1, everything else 2. Any emoji, even a combined one like 👨‍👩‍👧, counts as 2."],
        ["How many characters does a link take?", "Exactly 23: X shortens every link with t.co, so the length of the address doesn’t matter."],
        ["Can I post more than 280 characters?", "X Premium subscribers can publish longer posts. For a regular account the limit is 280 weighted characters; the counter shows any overflow in red."],
      ],
    },
    keywords: [["твиттер", "x", "280 символов", "лимит твита"], ["tweet length", "tweet counter", "280"]],
  },
  {
    slug: "sms",
    platform: "sms",
    name: ["СМС", "SMS"],
    title: ["Счётчик символов СМС — сколько частей займёт сообщение", "SMS character counter — how many parts a message takes"],
    h1: ["Счётчик символов СМС", "SMS character counter"],
    description: [
      "Длина СМС: латиница — 160 символов (153 в каждой части длинного сообщения), кириллица и эмодзи — 70 (67). Покажем символы, из-за которых СМС стало дороже.",
      "SMS length: Latin text fits 160 characters (153 per part when split), Cyrillic or emoji 70 (67). See which characters switched your message to UCS-2.",
    ],
    lead: ["Одно СМС на кириллице — 70 символов, на латинице — 160.", "One SMS holds 160 Latin characters or 70 in Cyrillic or with emoji."],
    facts: [
      [["Латиница (GSM-7)", "160 символов; в длинном СМС — 153 на часть"], ["Latin (GSM-7)", "160 characters; 153 per part when split"]],
      [["Кириллица, эмодзи (UCS-2)", "70 символов; в длинном СМС — 67 на часть"], ["Cyrillic, emoji (UCS-2)", "70 characters; 67 per part when split"]],
      [["^ { } [ ] ~ \\ | €", "по 2 места в GSM-7"], ["^ { } [ ] ~ \\ | €", "2 places each in GSM-7"]],
      [["Одна буква кириллицы или «ёлочки»", "переводят всё СМС в UCS-2"], ["One Cyrillic letter or curly quote", "switches the whole SMS to UCS-2"]],
    ],
    table: (locale) => ({
      type: "table",
      title: locale === "ru" ? "Сколько символов помещается в N частей СМС" : "How many characters fit into N SMS parts",
      head: locale === "ru" ? ["Частей", "Латиница (GSM-7)", "Кириллица (UCS-2)"] : ["Parts", "Latin (GSM-7)", "Cyrillic (UCS-2)"],
      rows: [1, 2, 3, 4, 5, 6].map((n) => [String(n), String(n === 1 ? 160 : 153 * n), String(n === 1 ? 70 : 67 * n)]),
    }),
    faq: {
      ru: [
        ["Сколько символов в одном СМС на русском?", "70. Если текст длиннее, он делится на части по 67 символов: 2 СМС вмещают 134 символа, 3 СМС — 201. Оператор берёт плату за каждую часть."],
        ["Почему СМС на латинице посчиталось по 70 символов?", "Хватает одного символа вне кодировки GSM-7 — буквы кириллицы, эмодзи, «ёлочек» или кавычек “ ” — и всё сообщение кодируется в UCS-2. Счётчик перечисляет такие символы."],
        ["Считаются ли пробелы и переносы строк?", "Да, они занимают место так же, как буквы. Символы ^ { } [ ] ~ \\ | € в кодировке GSM-7 занимают по два места."],
      ],
      en: [
        ["How many characters fit into one SMS?", "160 in plain Latin text (GSM-7) and 70 if the message contains Cyrillic, emoji or other characters outside GSM-7. Longer messages are split into parts of 153 or 67 characters."],
        ["Why did my English SMS drop to 70 characters?", "One character outside GSM-7 — an emoji, a curly quote “ ” or an accented letter not in the set — switches the whole message to UCS-2. The counter lists those characters."],
        ["Do spaces and line breaks count?", "Yes, they take space like letters. In GSM-7 the characters ^ { } [ ] ~ \\ | € take two places each."],
      ],
    },
    keywords: [["смс", "sms", "70 символов", "160 символов", "длина смс"], ["sms length", "gsm-7", "ucs-2", "sms segments"]],
  },
  {
    slug: "meta-title",
    platform: "meta-title",
    name: ["Title", "Meta title"],
    title: ["Проверка длины title — сколько символов в заголовке", "Meta title length checker — characters in a title tag"],
    h1: ["Проверка длины title", "Meta title length checker"],
    description: [
      "Проверьте длину тега title: оптимально 30–60 символов, чтобы заголовок не обрезался в поисковой выдаче. Символы и слова считаются прямо при вводе.",
      "Check your title tag length: 30–60 characters keeps it from being cut off in search results. Characters and words are counted as you type.",
    ],
    lead: ["Оптимальная длина title — 30–60 символов, главное слово — в начале.", "Keep a title tag at 30–60 characters with the key phrase first."],
    facts: [
      [["Рекомендуемая длина", "30–60 символов"], ["Recommended length", "30–60 characters"]],
      [["Как обрезает Google", "по ширине строки, около 600 пикселей"], ["How Google truncates", "by width, about 600 pixels"]],
      [["Широкие буквы", "Ш, Щ, Ж, М, W занимают больше места"], ["Wide letters", "W, M and capitals take more room"]],
    ],
    faq: {
      ru: [
        ["Какая оптимальная длина title?", "30–60 символов. Google обрезает заголовок по ширине в пикселях (около 600 px на компьютере), поэтому в среднем помещается 50–60 знаков, а заголовок из заглавных или широких букв обрежется раньше."],
        ["Что будет, если title длиннее?", "Страница проиндексируется, но в выдаче заголовок обрежется многоточием, а поисковик может заменить его своим вариантом. Главную фразу ставьте в начало."],
        ["Нужно ли писать название сайта в title?", "Можно в конце через тире или вертикальную черту, если хватает места. Уникальная часть заголовка важнее бренда."],
      ],
      en: [
        ["What is the ideal title length?", "30–60 characters. Google truncates titles by pixel width (about 600 px on desktop), so 50–60 characters usually fit; titles in capitals or wide letters are cut earlier."],
        ["What happens if the title is longer?", "The page is still indexed, but the title is cut with an ellipsis in results and the search engine may rewrite it. Put the main phrase first."],
        ["Should the site name be in the title?", "At the end, after a dash or a pipe, if there is room. The unique part of the title matters more than the brand."],
      ],
    },
    keywords: [["тайтл", "title", "длина заголовка", "seo"], ["title tag", "seo title length"]],
  },
  {
    slug: "meta-description",
    platform: "meta-description",
    name: ["Description", "Meta description"],
    title: ["Проверка длины description — счётчик символов для SEO", "Meta description length checker — SEO character count"],
    h1: ["Проверка длины meta description", "Meta description length checker"],
    description: [
      "Счётчик символов для meta description: оптимально 120–160 знаков. Индикатор покажет, если описание слишком короткое или обрежется в поисковой выдаче.",
      "Character counter for meta descriptions: aim for 120–160 characters. The meter warns when a description is too short or will be cut in search results.",
    ],
    lead: ["Оптимальная длина meta description — 120–160 символов.", "Aim for a meta description of 120–160 characters."],
    facts: [
      [["Рекомендуемая длина", "120–160 символов"], ["Recommended length", "120–160 characters"]],
      [["На мобильных", "обычно видно около 120 символов"], ["On mobile", "about 120 characters are usually visible"]],
      [["Поисковик может", "заменить описание фрагментом страницы"], ["Search engines may", "replace it with a snippet from the page"]],
    ],
    faq: {
      ru: [
        ["Какой длины должен быть meta description?", "120–160 символов. Короче — описание выглядит пустым и поисковик чаще подставляет свой фрагмент текста, длиннее — обрежется многоточием."],
        ["Влияет ли description на позиции?", "Напрямую почти нет, но хорошее описание повышает кликабельность сниппета: в нём стоит коротко ответить на запрос и дать конкретику — цифры, сроки, цены."],
      ],
      en: [
        ["How long should a meta description be?", "120–160 characters. Shorter ones look empty and are more often replaced with a page snippet; longer ones are cut with an ellipsis."],
        ["Does the description affect rankings?", "Hardly directly, but a good description raises the click-through rate: answer the query briefly and add specifics such as numbers, dates or prices."],
      ],
    },
    keywords: [["дескрипшн", "мета описание", "description", "seo"], ["meta description length", "seo description"]],
  },
  {
    slug: "instagram",
    platform: "instagram-caption",
    name: ["Инстаграм", "Instagram"],
    title: ["Счётчик символов для Инстаграма — лимит 2200", "Instagram character counter — 2,200 caption limit"],
    h1: ["Счётчик символов для Инстаграма", "Instagram character counter"],
    description: [
      "Проверьте подпись к посту в Инстаграме: лимит 2200 символов, описание профиля — 150. В ленте без «ещё» видно около 125 знаков, хештеги считаются отдельно.",
      "Check an Instagram caption: 2,200 characters max, 150 for the bio. Only about 125 characters show in the feed before “more”; hashtags are counted separately.",
    ],
    lead: ["Подпись к посту — до 2200 символов, описание профиля — до 150.", "A caption holds up to 2,200 characters, the bio up to 150."],
    facts: [
      [["Подпись к посту", "2200 символов"], ["Post caption", "2,200 characters"]],
      [["Описание профиля", "150 символов"], ["Profile bio", "150 characters"]],
      [["Видно в ленте до «ещё»", "около 125 символов"], ["Visible in the feed before “more”", "about 125 characters"]],
    ],
    faq: {
      ru: [
        ["Сколько символов можно написать под постом в Инстаграме?", "До 2200 символов вместе с пробелами, эмодзи и хештегами. В ленте без нажатия «ещё» видно примерно первые 125 символов — туда стоит поставить главное."],
        ["Считаются ли хештеги и эмодзи?", "Да, они входят в те же 2200 символов. Число хештегов счётчик показывает отдельно — Инстаграм ограничивает и их количество, поэтому лучше оставить несколько самых точных."],
        ["Сколько символов в описании профиля?", "150 символов. Красивые шрифты из Юникода тоже считаются символами."],
      ],
      en: [
        ["How long can an Instagram caption be?", "Up to 2,200 characters including spaces, emoji and hashtags. Only about the first 125 characters show in the feed before “more”, so put the key message there."],
        ["Do hashtags and emoji count?", "Yes, they’re part of the same 2,200 characters. The counter also shows the number of hashtags — Instagram limits how many you can use, so keep a few precise ones."],
        ["How long can the bio be?", "150 characters. Fancy Unicode fonts count as characters too."],
      ],
    },
    keywords: [["инстаграм", "instagram", "подпись", "2200", "хештеги"], ["instagram caption length", "bio length"]],
  },
  {
    slug: "telegram",
    platform: "telegram-message",
    name: ["Телеграм", "Telegram"],
    title: ["Счётчик символов для Телеграма — лимит 4096", "Telegram character counter — 4,096 message limit"],
    h1: ["Счётчик символов для Телеграма", "Telegram character counter"],
    description: [
      "Сколько символов влезет в сообщение Телеграма: до 4096 в тексте и 1024 в подписи к фото или видео. Счётчик покажет остаток и превышение при вводе.",
      "How much fits into a Telegram message: up to 4,096 characters in text and 1,024 in a photo or video caption. See what’s left or over as you type.",
    ],
    lead: ["Сообщение — до 4096 символов, подпись к медиа — до 1024.", "A message holds up to 4,096 characters, a media caption up to 1,024."],
    facts: [
      [["Текстовое сообщение", "4096 символов"], ["Text message", "4,096 characters"]],
      [["Подпись к фото или видео", "1024 символа (у Premium — больше)"], ["Photo or video caption", "1,024 characters (more with Premium)"]],
      [["Текст длиннее 4096", "отправляется несколькими сообщениями"], ["Text over 4,096", "goes out as several messages"]],
    ],
    faq: {
      ru: [
        ["Сколько символов в одном сообщении Телеграма?", "4096 символов. Более длинный текст уходит несколькими сообщениями — удобнее заранее разбить его по смыслу."],
        ["Какой лимит подписи к фото в Телеграме?", "1024 символа для обычного аккаунта; подписчикам Telegram Premium доступны более длинные подписи. Для длинного поста в канале удобнее отправить текст отдельным сообщением."],
      ],
      en: [
        ["How many characters fit into one Telegram message?", "4,096. Longer text goes out as several messages, so it’s better to split it at sensible points yourself."],
        ["What is the photo caption limit?", "1,024 characters for a regular account; Telegram Premium subscribers get longer captions. For a long channel post, send the text as a separate message."],
      ],
    },
    keywords: [["телеграм", "telegram", "4096", "подпись", "канал"], ["telegram message limit", "telegram caption length"]],
  },
  {
    slug: "youtube-title",
    platform: "youtube-title",
    name: ["Название YouTube", "YouTube title"],
    title: ["Длина названия видео на YouTube — лимит 100 символов", "YouTube title length checker — 100 characters"],
    h1: ["Длина названия видео YouTube", "YouTube title length checker"],
    description: [
      "Проверьте название видео для YouTube: максимум 100 символов. В поиске и рекомендациях видна только начальная часть, поэтому ключевые слова ставьте в начало.",
      "Check a YouTube video title: 100 characters max. Search results and recommendations show only the beginning, so lead with the key words.",
    ],
    lead: ["Название видео на YouTube — до 100 символов.", "A YouTube video title can be up to 100 characters."],
    facts: [
      [["Максимум", "100 символов"], ["Maximum", "100 characters"]],
      [["Символы < и >", "в названии запрещены"], ["< and > characters", "not allowed in titles"]],
    ],
    faq: {
      ru: [
        ["Сколько символов может быть в названии видео на YouTube?", "До 100, включая пробелы и эмодзи. В поиске и на мобильных видна только начальная часть, поэтому главное стоит уместить в первые 60–70 символов."],
        ["Можно ли использовать эмодзи в названии?", "Да, эмодзи считаются символами. Угловые скобки < и > YouTube в названиях не принимает."],
      ],
      en: [
        ["How many characters can a YouTube title have?", "Up to 100, including spaces and emoji. Search results and mobile show only the beginning, so fit the essentials into the first 60–70 characters."],
        ["Can I use emoji in the title?", "Yes, emoji count as characters. YouTube doesn’t accept angle brackets < and > in titles."],
      ],
    },
    keywords: [["ютуб", "youtube", "название видео", "100 символов"], ["youtube title length"]],
  },
  {
    slug: "youtube-description",
    platform: "youtube-description",
    name: ["Описание YouTube", "YouTube description"],
    title: ["Длина описания видео на YouTube — лимит 5000 символов", "YouTube description length — 5,000 character limit"],
    h1: ["Счётчик символов описания YouTube", "YouTube description character counter"],
    description: [
      "Проверьте описание видео на YouTube: лимит 5000 символов. Счётчик покажет остаток, количество слов и строк — удобно для тайм-кодов и ссылок.",
      "Check a YouTube video description: the limit is 5,000 characters. The counter shows what’s left plus words and lines — handy for timestamps and links.",
    ],
    lead: ["Описание видео на YouTube — до 5000 символов.", "A YouTube description can be up to 5,000 characters."],
    facts: [
      [["Максимум", "5000 символов"], ["Maximum", "5,000 characters"]],
      [["Тайм-коды", "первая метка 0:00, минимум три главы"], ["Timestamps", "first one at 0:00, at least three chapters"]],
    ],
    faq: {
      ru: [
        ["Какой максимальный размер описания на YouTube?", "5000 символов вместе с пробелами, ссылками и тайм-кодами. Под видео без раскрытия видны только первые строки — туда ставьте главное."],
        ["Как сделать главы (тайм-коды)?", "Добавьте в описание список с метками времени: первая — 0:00, всего не меньше трёх глав. Каждая строка тоже считается в лимит 5000 символов."],
      ],
      en: [
        ["What is the maximum YouTube description length?", "5,000 characters including spaces, links and timestamps. Only the first lines are visible without expanding, so put the key information there."],
        ["How do I add chapters?", "List timestamps in the description: the first must be 0:00 and there must be at least three chapters. Each line counts toward the 5,000-character limit."],
      ],
    },
    keywords: [["ютуб", "описание видео", "5000 символов", "тайм-коды"], ["youtube description limit", "chapters"]],
  },
  {
    slug: "tiktok",
    platform: "tiktok",
    name: ["ТикТок", "TikTok"],
    title: ["Счётчик символов для ТикТока — подпись до 4000", "TikTok character counter — 4,000 caption limit"],
    h1: ["Счётчик символов для ТикТока", "TikTok character counter"],
    description: [
      "Проверьте подпись к видео в ТикТоке: до 4000 символов вместе с хештегами, описание профиля — до 80. Счётчик покажет остаток и превышение при вводе.",
      "Check a TikTok caption: up to 4,000 characters including hashtags, and 80 characters for the profile bio. See what’s left or over as you type.",
    ],
    lead: ["Подпись к видео — до 4000 символов, описание профиля — до 80.", "A video caption holds up to 4,000 characters, the bio up to 80."],
    facts: [
      [["Подпись к видео", "4000 символов с хештегами"], ["Video caption", "4,000 characters incl. hashtags"]],
      [["Описание профиля", "80 символов"], ["Profile bio", "80 characters"]],
    ],
    faq: {
      ru: [
        ["Сколько символов можно написать в описании видео в ТикТоке?", "До 4000 символов вместе с хештегами и упоминаниями. В ленте видна только первая строка, поэтому начинайте с главного."],
        ["Сколько символов в описании профиля ТикТок?", "80 символов. Эмодзи и символы из красивых шрифтов тоже расходуют лимит."],
      ],
      en: [
        ["How long can a TikTok caption be?", "Up to 4,000 characters including hashtags and mentions. Only the first line shows in the feed, so start with the main point."],
        ["How long can a TikTok bio be?", "80 characters. Emoji and fancy-font characters count toward the limit too."],
      ],
    },
    keywords: [["тикток", "tiktok", "описание видео", "4000"], ["tiktok caption length", "tiktok bio"]],
  },
  {
    slug: "vk",
    platform: "vk-post",
    name: ["ВКонтакте", "VK"],
    title: ["Счётчик символов для ВКонтакте — длина поста", "VK character counter — post length"],
    h1: ["Счётчик символов для поста ВКонтакте", "VK post character counter"],
    description: [
      "Проверьте длину поста ВКонтакте: на стене помещается около 16 тысяч символов. Счётчик покажет символы, слова, абзацы и время чтения поста прямо при вводе.",
      "Check the length of a VK post: a wall post holds about 16 thousand characters. The counter shows characters, words, paragraphs and reading time as you type.",
    ],
    lead: ["Пост на стене ВКонтакте вмещает около 16 тысяч символов.", "A VK wall post holds about 16 thousand characters."],
    facts: [
      [["Пост на стене", "около 16 тысяч символов (16 384)"], ["Wall post", "about 16 thousand characters (16,384)"]],
      [["Длинный пост", "в ленте сворачивается под «Показать ещё»"], ["Long posts", "collapse under “Show more” in the feed"]],
    ],
    faq: {
      ru: [
        ["Сколько символов можно написать в посте ВКонтакте?", "ВКонтакте не публикует точный лимит в справке; на практике пост на стене вмещает около 16 тысяч символов (16 384). Для длинных материалов удобнее редактор статей, а в посте оставить анонс и ссылку."],
        ["Сколько текста видно в ленте без раскрытия?", "Только первые несколько строк — остальное прячется под «Показать ещё», поэтому главную мысль пишите в начале."],
      ],
      en: [
        ["How many characters can a VK post have?", "VK doesn’t state an exact limit in its help pages; in practice a wall post holds about 16 thousand characters (16,384). For long reads the article editor is more convenient; keep a teaser and a link in the post."],
        ["How much text shows in the feed?", "Only the first few lines; the rest hides under “Show more”, so put the main point first."],
      ],
    },
    keywords: [["вк", "вконтакте", "vk", "пост", "длина поста"], ["vk post length", "vkontakte"]],
  },
];

function variant(p: PlatformPage): VariantDef {
  return {
    slug: p.slug,
    name: L(...p.name),
    title: L(...p.title),
    h1: L(...p.h1),
    description: L(...p.description),
    lead: L(...p.lead),
    keywords: LL(...p.keywords),
    props: { platform: p.platform },
    blocks: (locale) => {
      const i = locale === "ru" ? 0 : 1;
      const out: Block[] = [facts(locale, L("Лимиты", "Limits"), p.facts.map((row) => row[i] as [string, string]))];
      if (p.table) out.push(p.table(locale));
      return out;
    },
    faq: FAQ(p.faq.ru, p.faq.en),
  };
}

export const wordCounter: ToolDef = {
  slug: "word-counter",
  component: "text/word-counter",
  icon: "LetterText",
  popular: true,
  name: L("Счётчик символов и слов", "Word counter"),
  title: L("Счётчик символов онлайн — посчитать символы и слова", "Word Counter — count words and characters online"),
  h1: L("Счётчик символов и слов", "Word and character counter"),
  description: L(
    "Посчитайте символы с пробелами и без, слова, предложения и абзацы. Время чтения, частые слова и лимиты соцсетей — сразу при вводе, без отправки текста.",
    "Count characters with and without spaces, words, sentences and paragraphs. Reading time, top words and social media limits update as you type.",
  ),
  lead: L("Вставьте текст — символы, слова и предложения считаются мгновенно.", "Paste your text — characters, words and sentences are counted instantly."),
  keywords: LL(
    ["количество символов", "подсчёт слов", "сколько символов", "знаков с пробелами", "счетчик знаков"],
    ["character count", "letter counter", "count words", "characters without spaces"],
  ),
  howTo: LL(
    [
      "Вставьте или напечатайте текст в поле — можно открыть и файл .txt.",
      "Сразу под полем — символы с пробелами и без, слова и предложения.",
      "Ниже — абзацы, строки, время чтения и речи, буквы, цифры, эмодзи и размер в байтах.",
      "Для постов откройте страницу нужной платформы — счётчик покажет остаток до лимита.",
    ],
    [
      "Paste or type your text — you can also open a .txt file.",
      "Right below: characters with and without spaces, words and sentences.",
      "Further down: paragraphs, lines, reading and speaking time, letters, digits, emoji and size in bytes.",
      "For posts, open the page for your platform — the counter shows how much room is left.",
    ],
  ),
  about: LL(
    [
      "Слова и предложения выделяются по правилам Юникода, встроенным в браузер (Intl.Segmenter), поэтому счётчик одинаково работает с русским, казахским, английским и другими языками, а составной эмодзи вроде 👨‍👩‍👧 или флаг 🇰🇿 считается одним символом — так, как его видит человек.",
      "Для копирайтеров, SMM и SEO есть отдельные страницы с лимитами: title и description, Инстаграм, Телеграм, ТикТок, ВКонтакте, YouTube, СМС на кириллице и латинице и взвешенный подсчёт X (Twitter). Текст обрабатывается только на вашем устройстве.",
    ],
    [
      "Words and sentences are detected with the Unicode rules built into your browser (Intl.Segmenter), so the counter works the same for English, Russian, Kazakh and other languages, and a combined emoji like 👨‍👩‍👧 or a flag 🇰🇿 counts as one character — the way people see it.",
      "Writers, SMM and SEO specialists get dedicated pages with limits: title and description, Instagram, Telegram, TikTok, VK, YouTube, SMS in Latin and Cyrillic, and X (Twitter) weighted counting. The text is processed on your device only.",
    ],
  ),
  faq: FAQ(
    [
      ["Как считаются символы: с пробелами или без?", "Показаны оба числа. «Символы» — все знаки вместе с пробелами и переносами строк, «без пробелов» — только видимые знаки. Эмодзи, флаг или буква с ударением считаются одним символом."],
      ["Что считается словом?", "Непрерывная последовательность букв или цифр на любом языке, включая казахский. Числа тоже считаются словами, знаки препинания и эмодзи — нет. Китайский и японский текст делится на слова по словарю браузера."],
      ["Как рассчитывается время чтения?", "По средней скорости чтения про себя — 200 слов в минуту, время речи — 130 слов в минуту. Реальная скорость зависит от сложности текста, поэтому это ориентир."],
      ["Почему Word показывает другое число символов?", "Редакторы по-разному считают переносы строк, а некоторые сервисы считают эмодзи за 2 символа (кодовые единицы UTF-16). Это число тоже есть в блоке «Подробно»."],
      ["Текст куда-то отправляется?", "Нет. Подсчёт выполняется в браузере на вашем устройстве; текст не передаётся на сервер и не сохраняется."],
    ],
    [
      ["Are characters counted with or without spaces?", "Both numbers are shown. “Characters” includes spaces and line breaks, “no spaces” counts only visible characters. An emoji, a flag or an accented letter counts as one character."],
      ["What counts as a word?", "An unbroken run of letters or digits in any language. Numbers count as words, punctuation and emoji don’t. Chinese and Japanese text is split into words with the browser’s dictionary."],
      ["How is reading time calculated?", "At an average silent reading speed of 200 words per minute; speaking time uses 130 words per minute. Real speed depends on the text, so treat it as an estimate."],
      ["Why does Word show a different character count?", "Editors treat line breaks differently, and some services count an emoji as 2 characters (UTF-16 code units). That number is also shown under “Details”."],
      ["Is my text sent anywhere?", "No. Counting happens in your browser; the text is not uploaded or stored."],
    ],
  ),
  related: ["word-frequency", "case-converter", "remove-extra-spaces", "text-cleaner", "typograph"],
  variants: { title: L("Лимиты символов в соцсетях и SEO", "Character limits for social media and SEO"), list: () => PAGES.map(variant) },
};
