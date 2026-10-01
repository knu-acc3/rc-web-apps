import type { L10nList, Locale } from "@/i18n/config";
import type { PageText } from "./content-styles";
import type { PlatformId } from "../data/names";
import { stylize as f } from "../lib/styles";

/* ───────────── the generator itself (/font-generator) ───────────── */

export const GENERATOR_TEXT: Record<Locale, PageText> = {
  ru: {
    title: "Генератор шрифтов онлайн: красивый текст для ника и соцсетей",
    h1: "Генератор шрифтов онлайн",
    lead: "Напишите текст — он сразу появится в 32 стилях: жирный, курсив, готический, зачёркнутый, перевёрнутый. Нажмите на строку, чтобы скопировать.",
    description:
      "Генератор шрифтов онлайн: 32 стиля Unicode — жирный, курсив, готический, зачёркнутый, перевёрнутый. Для ников, Инстаграма и Telegram, копирование в 1 клик.",
    about: [
      `Красивые шрифты здесь — не настоящие шрифты, а отдельные символы Unicode, похожие на обычные буквы: жирные ${f("bold", "Bold")} и рукописные ${f("script", "Script")} буквы из математического блока, буквы в кружках, капитель, надстрочные знаки. Поэтому текст сохраняет стиль в любом поле, где нет кнопок форматирования: в описании профиля, нике в игре, имени в Telegram или Discord.`,
      "У такого подхода есть пределы. Математические алфавиты Unicode не содержат кириллицы, поэтому большинство стилей не меняет русские буквы — таблица выше показывает, какие стили с ними работают. Зачёркивание, подчёркивание, залго, глитч и кружки для любых букв добавляют к символам комбинируемые знаки и подходят для любого языка, включая казахский.",
      `Поиск внутри соцсетей и хештеги обычно не считают ${f("bold", "text")} и text одним словом, а программы экранного доступа могут читать такие символы неправильно. Используйте стили для ников и акцентов, а важную информацию пишите обычным текстом. Всё работает в браузере: введённый текст никуда не отправляется.`,
    ],
    faq: [
      {
        q: "Почему русские буквы не меняются в некоторых стилях?",
        a: "Жирные, курсивные, готические, рукописные и другие «математические» буквы есть в Unicode для латиницы и цифр, но не для кириллицы. Поэтому такие стили оставляют русский текст как есть. С кириллицей работают зачёркнутый, подчёркнутый, черта сверху, залго, глитч и кружки для любых букв, а капитель, перевёрнутый и зеркальный текст — частично.",
      },
      {
        q: "Почему вместо букв видны квадратики?",
        a: "Значит, в шрифте устройства или приложения нет этих символов. Современные iOS, Android, Windows и macOS показывают большинство стилей, но у редких символов и у встроенных шрифтов игр поддержка хуже. Попробуйте другой стиль.",
      },
      {
        q: "Можно ли использовать красивый шрифт в логине?",
        a: "В отображаемом имени — обычно да. В логинах большинство сервисов разрешает только латиницу, цифры и пару знаков: например, в Инстаграме допустимы буквы, цифры, точка и подчёркивание. Стилизованные символы туда не пройдут.",
      },
      {
        q: "Как сделать жирный текст без символов Unicode?",
        a: "В Telegram, WhatsApp и Discord есть встроенное форматирование, и оно работает с кириллицей: в WhatsApp *текст* становится жирным, в Discord — **текст**, в Telegram — через меню «Форматирование» или Ctrl+B.",
      },
      {
        q: "Сохраняется ли где-то мой текст?",
        a: "Нет. Преобразование выполняется в браузере на вашем устройстве, текст не отправляется на сервер.",
      },
    ],
  },
  en: {
    title: "Font Generator — Fancy Text Copy and Paste",
    h1: "Font generator — fancy text",
    lead: "Type your text and see it in 32 styles at once — bold, italic, gothic, strikethrough, upside down. Click a row to copy it.",
    description:
      "Font generator: turn text into 32 Unicode styles — bold, italic, gothic, strikethrough, upside down — for nicknames, Instagram and bios. One-click copy.",
    about: [
      `These fancy fonts aren't real fonts but separate Unicode characters that look like letters: bold ${f("bold", "Bold")} and script ${f("script", "Script")} letters from the math block, circled letters, small caps, superscripts. That's why the style survives in any field without formatting buttons — a profile bio, a game nickname, a Telegram or Discord name.`,
      "There are limits. Unicode's math alphabets contain no Cyrillic, so most styles leave Cyrillic letters unchanged — the table above shows which styles handle them. Strikethrough, underline, zalgo, glitch and bubble add combining marks and work with any language.",
      `In-app search and hashtags usually don't treat ${f("bold", "text")} and text as the same word, and screen readers may announce these characters incorrectly. Use styles for names and accents, and keep important information in plain text. Everything runs in your browser; nothing you type is sent anywhere.`,
    ],
    faq: [
      {
        q: "Why don't some styles change Cyrillic letters?",
        a: "Bold, italic, gothic, script and the other “mathematical” letters exist in Unicode for Latin letters and digits, not for Cyrillic, so those styles leave Cyrillic as it is. Strikethrough, underline, overline, zalgo, glitch and bubble work with any alphabet; small caps, upside down and mirror handle Cyrillic partly.",
      },
      {
        q: "Why do I see boxes instead of letters?",
        a: "The font on the device or in the app doesn't contain those characters. Current iOS, Android, Windows and macOS show most styles, but rare characters and built-in game fonts are less reliable. Try another style.",
      },
      {
        q: "Can I use fancy fonts in a username?",
        a: "In a display name, usually yes. Usernames on most services allow only Latin letters, digits and a couple of symbols — Instagram, for example, accepts letters, numbers, periods and underscores — so styled characters won't pass.",
      },
      {
        q: "How do I make bold text without Unicode characters?",
        a: "Telegram, WhatsApp and Discord have built-in formatting that works with any alphabet: *text* is bold in WhatsApp, **text** in Discord, and Telegram has a Formatting menu and Ctrl+B.",
      },
      {
        q: "Is my text stored anywhere?",
        a: "No. The conversion happens in your browser on your device; the text is never sent to a server.",
      },
    ],
  },
};

export const GENERATOR_HOWTO: L10nList = {
  ru: [
    "Напишите или вставьте текст в поле — латиницей, кириллицей, с цифрами и эмодзи.",
    "Выбранный стиль показан крупно под полем, остальные — списком ниже; всё обновляется сразу.",
    "Нажмите на строку со стилем — текст скопируется и станет выбранным. Кнопка «Копировать» копирует выбранный стиль.",
    "Вставьте текст в описание профиля, ник, пост или сообщение. Если вместо букв квадратики, выберите другой стиль.",
  ],
  en: [
    "Type or paste your text — Latin, Cyrillic, digits and emoji are all fine.",
    "The selected style is shown large under the box and every other style is listed below; everything updates as you type.",
    "Click a style row to copy it and make it the selected one. The Copy button copies the selected style.",
    "Paste the text into a bio, nickname, post or message. If you see boxes instead of letters, pick another style.",
  ],
};

/* ───────────── platforms ───────────── */

interface PlatformText extends PageText {
  facts: [string, string][];
}

export const PLATFORM_TEXT: Record<PlatformId, Record<Locale, PlatformText>> = {
  instagram: {
    ru: {
      title: "Шрифты для Инстаграма — красивый текст для био",
      h1: "Шрифты для Инстаграма",
      lead: "Инстаграм не умеет форматировать текст, поэтому жирный, курсив и другие стили вставляют готовыми символами Unicode.",
      description: "Шрифты для Инстаграма: жирный, курсив, рукописный и ещё 29 стилей для био (до 150 символов), имени и подписей. В логине стили не работают.",
      facts: [
        ["Описание профиля (био)", "до 150 символов"],
        ["Подпись к публикации", "до 2200 символов"],
        ["Имя пользователя", "только латинские буквы, цифры, точка и подчёркивание, до 30 символов — стили не подходят"],
        ["Встроенное форматирование", "нет: жирный и курсив делают символами Unicode"],
        ["Хештеги", `пишите обычным текстом — #${f("bold", "text")} и #text считаются разными`],
      ],
      about: [
        `В Инстаграме нет кнопок «Жирный» или «Курсив» ни в описании профиля, ни в подписях, ни в комментариях. Поэтому стилизованный текст вставляют готовыми символами: ${f("bold", "A")} — не буква A с форматированием, а отдельный символ Unicode U+1D400, и он выглядит жирным в любом поле.`,
        "Лучше всего в Инстаграме смотрятся жирный без засечек, жирный курсив и рукописные стили для имени и первой строки био. Для русских слов подойдут капитель, зачёркнутый и подчёркнутый — большинство остальных стилей меняет только латиницу. Помните, что такие символы хуже находятся поиском, а программы экранного доступа могут читать их неправильно.",
      ],
      faq: [
        {
          q: "Как поменять шрифт в био Инстаграма?",
          a: "Напишите текст в поле выше, выберите стиль и скопируйте его. Затем откройте редактирование профиля и вставьте текст в поле «О себе». Лимит описания — 150 символов.",
        },
        {
          q: "Можно ли сделать жирный шрифт на русском в Инстаграме?",
          a: "Нет: жирных кириллических символов в Unicode нет, а своего форматирования в Инстаграме нет. Русский текст можно выделить капителью, зачёркиванием, подчёркиванием или эмодзи.",
        },
        {
          q: "Можно ли использовать красивый шрифт в имени пользователя?",
          a: "Нет. Имя пользователя (логин после @) может содержать только латинские буквы, цифры, точку и подчёркивание. Стили работают в поле «Имя», описании, подписях и комментариях.",
        },
      ],
    },
    en: {
      title: "Instagram Fonts — Fancy Text for Bio and Captions",
      h1: "Fonts for Instagram",
      lead: "Instagram has no text formatting, so bold, italic and other styles are pasted in as ready-made Unicode characters.",
      description: "Instagram fonts: bold, italic, script and 29 more styles for your bio (150 characters), name and captions. They don't work in usernames.",
      facts: [
        ["Profile bio", "up to 150 characters"],
        ["Post caption", "up to 2,200 characters"],
        ["Username", "Latin letters, numbers, periods and underscores only, up to 30 characters — no styles"],
        ["Built-in formatting", "none: bold and italic are made with Unicode characters"],
        ["Hashtags", `keep them plain — #${f("bold", "text")} and #text are different tags`],
      ],
      about: [
        `Instagram has no Bold or Italic button in the bio, captions or comments. Styled text is therefore pasted as ready-made characters: ${f("bold", "A")} isn't a formatted A but a separate Unicode character, U+1D400, that looks bold in any field.`,
        "Sans-serif bold, bold italic and the script styles look best in a name and the first line of a bio. Keep in mind that styled characters are harder to find through search and screen readers may read them incorrectly.",
      ],
      faq: [
        {
          q: "How do I change the font in my Instagram bio?",
          a: "Type your text above, pick a style and copy it. Then open Edit profile and paste it into the Bio field. The bio limit is 150 characters.",
        },
        {
          q: "Can I use a fancy font in my username?",
          a: "No. The username (the handle after @) can contain only Latin letters, numbers, periods and underscores. Styles work in the Name field, bio, captions and comments.",
        },
      ],
    },
  },

  telegram: {
    ru: {
      title: "Шрифты для Телеграма — красивый ник и текст",
      h1: "Шрифты для Телеграма",
      lead: "В сообщениях Telegram есть своё форматирование, а символы Unicode нужны для имени, описания профиля и названий каналов.",
      description: "Шрифты для Телеграма: красивое имя, описание (до 70 символов, с Premium — 140) и название канала. В сообщениях жирный и курсив есть встроенные.",
      facts: [
        ["Форматирование в сообщениях", "жирный, курсив, подчёркнутый, зачёркнутый, моноширинный, спойлер, цитата — через меню «Форматирование»"],
        ["Горячие клавиши в Telegram Desktop", "Ctrl+B — жирный, Ctrl+I — курсив, Ctrl+U — подчёркнутый, Ctrl+Shift+X — зачёркнутый, Ctrl+Shift+M — моноширинный"],
        ["Описание профиля", "до 70 символов, с Telegram Premium — до 140"],
        ["Имя пользователя (@username)", "5–32 символа: латиница, цифры и подчёркивание — стили не подходят"],
        ["Где пригодятся стили", "имя и фамилия, описание профиля, название и описание канала или группы"],
      ],
      about: [
        "Для обычных сообщений в Telegram символы Unicode не нужны: выделите слово и выберите «Форматирование» в контекстном меню — там есть жирный, курсив, подчёркнутый, зачёркнутый, моноширинный и спойлер. Встроенное форматирование работает с русскими буквами и не мешает поиску по чату.",
        "А вот имя, описание профиля и название канала форматирования не поддерживают — здесь и пригодятся стили Unicode. Для русских имён подойдут капитель, зачёркнутый, подчёркнутый и залго; рукописные, готические и двойные стили меняют только латиницу.",
      ],
      faq: [
        {
          q: "Как сделать жирный шрифт в Телеграме?",
          a: "Выделите текст в поле ввода и выберите «Форматирование» → «Жирный» (на компьютере — Ctrl+B). Это работает и с кириллицей. Символы Unicode нужны только там, где форматирования нет: в имени, описании профиля и названии канала.",
        },
        {
          q: "Можно ли поставить красивый шрифт в @username?",
          a: "Нет, в имени пользователя допустимы только латинские буквы, цифры и подчёркивание, от 5 до 32 символов. Стили можно использовать в отображаемом имени и фамилии.",
        },
        {
          q: "Почему в названии канала часть букв обычная?",
          a: "Скорее всего, это русские буквы: большинство стилей Unicode существует только для латиницы и цифр. Для кириллицы выбирайте капитель, зачёркнутый, подчёркнутый или кружки для любых букв.",
        },
      ],
    },
    en: {
      title: "Telegram Fonts — Fancy Text for Names and Bios",
      h1: "Fonts for Telegram",
      lead: "Telegram messages have built-in formatting; Unicode styles are for your name, bio and channel titles.",
      description: "Telegram fonts: styles for your name, bio (70 characters, 140 with Premium) and channel title. Messages already have bold, italic and strikethrough.",
      facts: [
        ["Message formatting", "bold, italic, underline, strikethrough, monospace, spoiler, quote — via the Formatting menu"],
        ["Telegram Desktop shortcuts", "Ctrl+B bold, Ctrl+I italic, Ctrl+U underline, Ctrl+Shift+X strikethrough, Ctrl+Shift+M monospace"],
        ["Profile bio", "up to 70 characters, 140 with Telegram Premium"],
        ["Username (@username)", "5–32 characters: Latin letters, digits and underscores — no styles"],
        ["Where styles help", "first and last name, bio, channel or group title and description"],
      ],
      about: [
        "Plain messages don't need Unicode styles: select a word and choose Formatting in the context menu to get bold, italic, underline, strikethrough, monospace or spoiler. Built-in formatting works with every alphabet and doesn't break chat search.",
        "Names, bios and channel titles have no formatting, and that's where Unicode styles help. Script, gothic and double-struck change Latin letters only; strikethrough, underline and zalgo work with any alphabet.",
      ],
      faq: [
        {
          q: "How do I make bold text in Telegram?",
          a: "Select the text in the message box and choose Formatting → Bold (Ctrl+B on desktop). Unicode styles are only needed where formatting isn't available: your name, bio and channel title.",
        },
        {
          q: "Can I use a fancy font in my @username?",
          a: "No, usernames allow only Latin letters, digits and underscores, 5 to 32 characters. Use styles in your display name instead.",
        },
      ],
    },
  },

  vk: {
    ru: {
      title: "Шрифты для ВК — жирный и зачёркнутый текст",
      h1: "Шрифты для ВК",
      lead: "В постах и комментариях ВКонтакте нет кнопок форматирования — жирный, курсив и зачёркивание вставляют символами Unicode.",
      description: "Шрифты для ВК: жирный, курсив, зачёркнутый и подчёркнутый текст для постов, комментариев и статуса. Зачёркивание и подчёркивание работают и с русскими буквами.",
      facts: [
        ["Форматирование в постах и комментариях", "нет — оно есть только в редакторе статей"],
        ["С кириллицей работают", "зачёркнутый, подчёркнутый, двойное подчёркивание, залго, кружки для любых букв; капитель — частично"],
        ["Только для латиницы", "жирный, курсив, рукописный, готический и другие математические стили"],
        ["Имя и фамилия", "меняются через заявку, которую проверяет модерация, — декоративные символы могут не пройти"],
      ],
      about: [
        "ВКонтакте не поддерживает жирный или курсивный текст в обычных записях и комментариях (форматирование есть только в редакторе статей), поэтому акценты делают символами Unicode. Самые полезные стили здесь — зачёркнутый и подчёркнутый: они работают с русскими буквами, потому что добавляют к каждому символу комбинируемую линию.",
        "Жирный, курсивный и рукописный стили меняют только латиницу и цифры, поэтому подходят для английских слов, названий брендов и акцентов в конце поста. Важный русский текст лучше оставлять обычным шрифтом — его проще найти поиском.",
      ],
      faq: [
        {
          q: "Как написать зачёркнутым текстом в ВК?",
          a: `Напишите фразу в поле выше и скопируйте строку «Зачёркнутый» — например, ${f("strikethrough", "зачёркнуто")}. Вставьте её в пост или комментарий: линия — часть символов, поэтому она сохранится.`,
        },
        {
          q: "Почему жирный шрифт в ВК не работает с русскими буквами?",
          a: "Жирные символы Unicode существуют для латиницы и цифр, но не для кириллицы, а своего форматирования в постах ВК нет. Поэтому русский текст жирным не сделать — выделяйте его подчёркиванием или зачёркиванием.",
        },
      ],
    },
    en: {
      title: "VK Fonts — Bold and Strikethrough Text for VKontakte",
      h1: "Fonts for VK (VKontakte)",
      lead: "VK posts and comments have no formatting buttons, so bold, italic and strikethrough are pasted as Unicode characters.",
      description: "VK fonts: bold, italic, strikethrough and underlined text for VKontakte posts, comments and status. Strikethrough and underline also work with Cyrillic text.",
      facts: [
        ["Formatting in posts and comments", "none — only the article editor has it"],
        ["Works with Cyrillic", "strikethrough, underline, double underline, zalgo, bubble; small caps partly"],
        ["Latin only", "bold, italic, script, gothic and the other math styles"],
        ["First and last name", "changed through a request reviewed by moderators — decorative characters may be rejected"],
      ],
      about: [
        "VK doesn't support bold or italic in regular posts and comments (only the article editor has formatting), so emphasis is done with Unicode characters. Strikethrough and underline are the most useful here because they work with Cyrillic.",
        "Bold, italic and script change only Latin letters and digits, which suits English words and brand names. Keep important Russian text plain — it's easier to find through search.",
      ],
      faq: [
        {
          q: "How do I write strikethrough text on VK?",
          a: `Type your phrase above and copy the Strikethrough row, e.g. ${f("strikethrough", "crossed out")}. Paste it into a post or comment — the line is part of the characters, so it stays.`,
        },
        {
          q: "Why doesn't bold work with Cyrillic on VK?",
          a: "Unicode bold characters exist for Latin letters and digits but not for Cyrillic, and VK posts have no formatting of their own, so Cyrillic can't be made bold. Use underline or strikethrough instead.",
        },
      ],
    },
  },

  tiktok: {
    ru: {
      title: "Шрифты для ТикТока — красивый текст для профиля",
      h1: "Шрифты для ТикТока",
      lead: "Стили Unicode для имени и описания профиля в ТикТоке вставляются как обычный текст, без сторонних приложений.",
      description: "Шрифты для ТикТока: жирный, рукописный, капитель и ещё 29 стилей для имени и описания профиля (до 80 символов). В @нике стили не работают.",
      facts: [
        ["Описание профиля", "до 80 символов"],
        ["Имя пользователя (@)", "латинские буквы, цифры, подчёркивание и точка — стили не подходят"],
        ["Где пригодятся стили", "имя в профиле, описание, подписи к видео и комментарии"],
        ["Встроенное форматирование", "нет"],
      ],
      about: [
        `ТикТок показывает текст системным шрифтом телефона и не даёт выбрать жирный или курсив в описании профиля и подписях. Символы Unicode обходят это ограничение: ${f("sans-bold", "bold")} или ${f("bold-script", "script")} — отдельные буквы, и они остаются стилизованными на любом устройстве, где их поддерживает шрифт.`,
        "Описание профиля ограничено 80 символами, так что стилизуйте главное: имя, ник или короткую фразу. Для русских слов выбирайте капитель, подчёркивание или зачёркивание — большинство остальных стилей меняет только латиницу.",
      ],
      faq: [
        {
          q: "Как поставить красивый шрифт в описание ТикТока?",
          a: "Скопируйте нужную строку выше, откройте редактирование профиля и вставьте текст в описание. Если вместо букв видны квадратики, выберите другой стиль.",
        },
        {
          q: "Можно ли изменить шрифт в нике после @?",
          a: "Нет, имя пользователя может содержать только латинские буквы, цифры, подчёркивание и точку. Стили подходят для отображаемого имени — оно показывается в профиле над ником.",
        },
      ],
    },
    en: {
      title: "TikTok Fonts — Fancy Text for Your TikTok Bio",
      h1: "Fonts for TikTok",
      lead: "Unicode styles for your TikTok name and bio — they paste like regular text, no extra apps needed.",
      description: "TikTok fonts: bold, script, small caps and 29 more styles for your name and bio (up to 80 characters). Styles don't work in your @username.",
      facts: [
        ["Profile bio", "up to 80 characters"],
        ["Username (@)", "letters, numbers, underscores and periods — no styles"],
        ["Where styles help", "profile name, bio, video captions and comments"],
        ["Built-in formatting", "none"],
      ],
      about: [
        `TikTok renders text in the phone's system font and offers no bold or italic in bios or captions. Unicode characters get around that: ${f("sans-bold", "bold")} or ${f("bold-script", "script")} are separate letters that stay styled on any device whose font supports them.`,
        "The bio is limited to 80 characters, so style what matters: your name, handle or a short phrase.",
      ],
      faq: [
        {
          q: "How do I put a fancy font in my TikTok bio?",
          a: "Copy the row you like above, open Edit profile and paste the text into your bio. If you see boxes instead of letters, pick another style.",
        },
        {
          q: "Can I change the font of my @username?",
          a: "No, usernames allow only letters, numbers, underscores and periods. Styles work in the display name shown on your profile.",
        },
      ],
    },
  },

  discord: {
    ru: {
      title: "Шрифты для Discord — красивый ник и текст",
      h1: "Шрифты для Discord",
      lead: "В сообщениях Discord работает разметка **жирный**, *курсив*, ~~зачёркнутый~~, а символы Unicode нужны для ника и названий каналов.",
      description: "Шрифты для Discord: капитель, готика, двойной контур и ещё 29 стилей для имени и ника на сервере (до 32 символов). В чате есть своя разметка **жирный**.",
      facts: [
        ["Разметка в сообщениях", "**жирный**, *курсив*, __подчёркнутый__, ~~зачёркнутый~~, `код`, ||спойлер||, # заголовок, > цитата"],
        ["Имя пользователя", "2–32 символа: строчные латинские буквы, цифры, подчёркивание и точка — стили не подходят"],
        ["Отображаемое имя и ник на сервере", "любые символы Unicode; ник на сервере — до 32 символов"],
        ["Где ещё пригодятся стили", "названия каналов и ролей, статус, раздел «Обо мне»"],
      ],
      about: [
        "Для сообщений в Discord стили Unicode почти не нужны: встроенная разметка делает текст жирным, курсивным, подчёркнутым или зачёркнутым, работает с кириллицей и не ломает поиск. Достаточно обернуть слово звёздочками, подчёркиваниями или тильдами.",
        "Зато имя, ник на сервере, названия каналов и ролей разметку не поддерживают — здесь в ход идут символы Unicode. Популярны капитель, жирная фрактура, двойной контур и буквы в чёрных квадратах. Учтите, что упоминать участника со стилизованным ником неудобно: его сложно набрать с клавиатуры.",
      ],
      faq: [
        {
          q: "Как сделать жирный текст в Discord?",
          a: "Оберните слово двумя звёздочками: **текст**. Одна звёздочка — курсив, два подчёркивания — подчёркнутый, две тильды — зачёркнутый. Эта разметка работает с любыми буквами.",
        },
        {
          q: "Можно ли поставить красивый шрифт в имя пользователя?",
          a: "Нет. С 2023 года имена пользователей Discord состоят из строчных латинских букв, цифр, подчёркивания и точки. Стили используйте в отображаемом имени и нике на сервере.",
        },
        {
          q: "Почему в названии канала пропали заглавные буквы?",
          a: `Discord приводит названия текстовых каналов к нижнему регистру. Математические символы Unicode регистра не имеют, поэтому, например, ${f("bold", "BOLD")} останется жирным и заглавным.`,
        },
      ],
    },
    en: {
      title: "Discord Fonts — Fancy Text for Names and Nicknames",
      h1: "Fonts for Discord",
      lead: "Discord messages support **bold**, *italic* and ~~strikethrough~~ markdown; Unicode styles are for display names and channel names.",
      description: "Discord fonts: small caps, fraktur, double-struck and 29 more styles for display names and server nicknames (up to 32 characters). Chat has **markdown**.",
      facts: [
        ["Message markdown", "**bold**, *italic*, __underline__, ~~strikethrough~~, `code`, ||spoiler||, # heading, > quote"],
        ["Username", "2–32 characters: lowercase Latin letters, digits, underscores and periods — no styles"],
        ["Display name and server nickname", "any Unicode characters; server nicknames up to 32 characters"],
        ["Other places for styles", "channel and role names, status, About Me"],
      ],
      about: [
        "Messages rarely need Unicode styles: Discord's markdown makes text bold, italic, underlined or struck through, works with any alphabet and keeps search working.",
        "Display names, server nicknames, channel and role names don't support markdown, so Unicode styles come in handy there. Small caps, bold fraktur, double-struck and black squares are popular. Note that mentioning someone with a styled nickname is awkward because it's hard to type.",
      ],
      faq: [
        {
          q: "How do I make bold text in Discord?",
          a: "Wrap the word in double asterisks: **text**. One asterisk gives italic, double underscores underline, double tildes strikethrough. It works with any letters.",
        },
        {
          q: "Why did my channel name lose its capitals?",
          a: `Discord lowercases text channel names. Unicode math characters have no case, so ${f("bold", "BOLD")}, for example, stays bold and uppercase.`,
        },
      ],
    },
  },

  "x-twitter": {
    ru: {
      title: "Шрифты для X (Твиттера) — жирный и курсив для постов",
      h1: "Шрифты для X (Твиттера)",
      lead: "Жирный и курсив для постов в X символами Unicode — со счётчиком: стилизованная буква считается за два символа.",
      description: `Шрифты для X (Твиттера): жирный, курсив и ещё 30 стилей со счётчиком по правилам X — буквы ${f("bold", "Bold")} считаются за 2, и в 280 символов их влезает вдвое меньше.`,
      facts: [
        ["Лимит поста без подписки", "280 символов"],
        ["Обычные буквы, цифры, кириллица", "1 символ"],
        [`Буквы ${f("bold", "A")}, ${f("italic", "A")}, ᴀ, Ⓐ, Ａ и эмодзи`, "2 символа"],
        ["Зачёркнутые и подчёркнутые буквы", "буква + линия = 2 символа"],
        ["Как считает счётчик", "по весам из открытой библиотеки twitter-text (конфигурация v3)"],
      ],
      about: [
        `X считает длину поста не по буквам, а по «весу» символов. Символы из диапазона U+0000–U+10FF (латиница, кириллица, большинство алфавитов) и часть типографских знаков весят 1, всё остальное — 2. Математические буквы вроде ${f("bold", "A")} лежат за этим диапазоном, поэтому жирное слово занимает вдвое больше места. Счётчик у каждого стиля показывает длину по этим правилам.`,
        "Используйте стили точечно: одно-два жирных слова в начале поста привлекают внимание, а целиком стилизованный пост хуже читается и может неправильно озвучиваться программами экранного доступа. Хештеги пишите обычными буквами, иначе они не совпадут с популярными.",
      ],
      faq: [
        {
          q: "Почему в X жирный текст «съедает» лимит?",
          a: `По правилам подсчёта X символы за пределами основных диапазонов весят 2. Жирная буква ${f("bold", "A")} (U+1D400) — как раз такой символ, поэтому слово из 5 жирных букв занимает 10 символов из 280.`,
        },
        {
          q: "Есть ли в X встроенный жирный шрифт?",
          a: "В обычных постах без подписки — нет, поэтому жирный и курсив вставляют символами Unicode. Счётчик выше поможет уложиться в лимит.",
        },
      ],
    },
    en: {
      title: "X (Twitter) Fonts — Bold and Italic Text for Posts",
      h1: "Fonts for X (Twitter)",
      lead: "Bold and italic for X posts via Unicode — with a counter, because each styled letter counts as two characters.",
      description: `X (Twitter) fonts: bold, italic and 30 more styles with a live counter using X's weighting — ${f("bold", "Bold")} letters count as 2, so half as many fit in 280 characters.`,
      facts: [
        ["Post limit without a subscription", "280 characters"],
        ["Regular letters, digits, Cyrillic", "1 character"],
        [`${f("bold", "A")}, ${f("italic", "A")}, ᴀ, Ⓐ, Ａ and emoji`, "2 characters"],
        ["Struck-through and underlined letters", "letter + line = 2 characters"],
        ["How the counter works", "weights from the open-source twitter-text library (v3 config)"],
      ],
      about: [
        `X measures a post by character weight, not by letters. Code points in U+0000–U+10FF (Latin, Cyrillic and most alphabets) and some punctuation weigh 1; everything else weighs 2. Math letters like ${f("bold", "A")} lie outside that range, so a bold word takes twice the space. The counter next to each style shows the length under these rules.`,
        "Use styles sparingly: one or two bold words at the start of a post catch the eye, while a fully styled post is harder to read and may be misread by screen readers. Keep hashtags plain so they match the popular ones.",
      ],
      faq: [
        {
          q: "Why does bold text eat my X character limit?",
          a: `Under X's counting rules, characters outside the basic ranges weigh 2. Bold ${f("bold", "A")} (U+1D400) is one of them, so a five-letter bold word uses 10 of your 280 characters.`,
        },
        {
          q: "Does X have built-in bold?",
          a: "Not in regular posts without a subscription, which is why bold and italic are pasted as Unicode characters. The counter above helps you stay within the limit.",
        },
      ],
    },
  },

  steam: {
    ru: {
      title: "Шрифты для Steam — красивый ник и описание профиля",
      h1: "Шрифты для Steam",
      lead: "Красивый ник для Steam из символов Unicode, а для описаний и обзоров — встроенные теги [b], [i], [u], [strike].",
      description: "Шрифты для Steam: готика, капитель, чёрные квадраты и ещё 29 стилей для ника (до 32 символов). В описаниях и обзорах работают теги [b], [i], [u], [strike].",
      facts: [
        ["Ник (имя профиля)", "до 32 символов, можно менять в любое время"],
        ["Теги в описании профиля, обзорах и обсуждениях", "[b]жирный[/b], [i]курсив[/i], [u]подчёркнутый[/u], [strike]зачёркнутый[/strike], [spoiler]спойлер[/spoiler], [h1]заголовок[/h1]"],
        ["Где пригодятся стили", "ник и сообщения в чате"],
      ],
      about: [
        "Ник в Steam поддерживает почти любые символы Unicode, поэтому здесь популярны готические буквы, капитель, двойной контур и буквы в чёрных квадратах. Ник можно поменять в любой момент, так что стили легко попробовать, — но друзьям будет сложнее найти вас поиском по имени.",
        "Для описания профиля, обзоров и руководств символы Unicode не обязательны: Steam понимает собственную разметку в квадратных скобках — [b], [i], [u], [strike], [spoiler], [h1], — и она работает с русским текстом. Стили Unicode пригодятся там, где теги не действуют: в нике и сообщениях чата.",
      ],
      faq: [
        {
          q: "Как сделать жирный текст в описании Steam?",
          a: "Используйте теги: [b]текст[/b] — жирный, [i]текст[/i] — курсив, [u]текст[/u] — подчёркнутый, [strike]текст[/strike] — зачёркнутый. Они работают в описании профиля, обзорах, руководствах и обсуждениях.",
        },
        {
          q: "Какой стиль выбрать для ника в Steam?",
          a: "Капитель, жирная фрактура и буквы в квадратах хорошо читаются даже мелко. Сильный залго лучше не использовать: знаки выходят за пределы строки и перекрывают соседние имена.",
        },
      ],
    },
    en: {
      title: "Steam Fonts — Fancy Nickname and Profile Text",
      h1: "Fonts for Steam",
      lead: "A fancy Steam nickname from Unicode characters; for descriptions and reviews, Steam's own [b], [i], [u] and [strike] tags.",
      description: "Steam fonts: fraktur, small caps, black squares and 29 more styles for your profile name (up to 32 characters). Reviews support [b], [i], [u], [strike] tags.",
      facts: [
        ["Nickname (profile name)", "up to 32 characters, can be changed at any time"],
        ["Tags in profile summary, reviews and discussions", "[b]bold[/b], [i]italic[/i], [u]underline[/u], [strike]strikethrough[/strike], [spoiler]spoiler[/spoiler], [h1]heading[/h1]"],
        ["Where styles help", "your nickname and chat messages"],
      ],
      about: [
        "Steam nicknames accept almost any Unicode character, so gothic letters, small caps, double-struck and black squares are popular. You can change the name at any time, which makes experimenting easy — though friends will find you less easily by name.",
        "Profile summaries, reviews and guides don't need Unicode styles: Steam understands its own bracket tags — [b], [i], [u], [strike], [spoiler], [h1] — which work with any language. Unicode styles are for places where tags don't work: your nickname and chat.",
      ],
      faq: [
        {
          q: "How do I make bold text in a Steam profile summary?",
          a: "Use tags: [b]text[/b] for bold, [i]text[/i] for italic, [u]text[/u] for underline, [strike]text[/strike] for strikethrough. They work in profile summaries, reviews, guides and discussions.",
        },
        {
          q: "Which style suits a Steam nickname?",
          a: "Small caps, bold fraktur and squared letters stay readable even at small sizes. Avoid heavy zalgo: its marks spill out of the line and cover neighbouring names.",
        },
      ],
    },
  },

  whatsapp: {
    ru: {
      title: "Шрифты для WhatsApp — подчёркнутый и красивый текст",
      h1: "Шрифты для WhatsApp",
      lead: "WhatsApp сам делает *жирный*, _курсив_ и ~зачёркнутый~ текст, а подчёркивание и декоративные стили добавляются символами Unicode.",
      description: "Шрифты для WhatsApp: подчёркнутый, рукописный, двойной и ещё 29 стилей для имени (до 25 символов) и сообщений. Жирный, курсив и зачёркнутый в нём есть и так.",
      facts: [
        ["Жирный", "*текст*"],
        ["Курсив", "_текст_"],
        ["Зачёркнутый", "~текст~"],
        ["Моноширинный", "```текст```"],
        ["Подчёркнутый", "встроенного нет — используйте стиль «Подчёркнутый» выше"],
        ["Имя профиля", "до 25 символов"],
        ["Сведения (о себе)", "до 139 символов"],
      ],
      about: [
        "Для обычного выделения в WhatsApp символы не нужны: оберните слово звёздочками, подчёркиваниями или тильдами — *жирный*, _курсив_, ~зачёркнутый~ — или выделите текст и выберите стиль в меню. Такое форматирование работает с русскими буквами.",
        "Подчёркивания в WhatsApp нет, поэтому стиль «Подчёркнутый» (знак U+0332 после каждой буквы) здесь самый полезный. Декоративные стили вроде рукописного или двойного пригодятся для имени профиля и сведений, но помните, что они меняют только латиницу.",
      ],
      faq: [
        {
          q: "Как писать жирным в WhatsApp?",
          a: "Поставьте звёздочки с двух сторон: *текст*. Для курсива — подчёркивания _текст_, для зачёркивания — тильды ~текст~, для моноширинного — три обратных апострофа с каждой стороны.",
        },
        {
          q: "Как подчеркнуть текст в WhatsApp?",
          a: "Встроенного подчёркивания нет. Напишите текст в поле выше, скопируйте строку «Подчёркнутый» и вставьте в сообщение — линия сохранится, в том числе под русскими буквами.",
        },
      ],
    },
    en: {
      title: "WhatsApp Fonts — Underline and Fancy Text Styles",
      h1: "Fonts for WhatsApp",
      lead: "WhatsApp already does *bold*, _italic_ and ~strikethrough~; underline and decorative styles come from Unicode characters.",
      description: "WhatsApp fonts: underline, script, double-struck and 29 more styles for your name (up to 25 characters) and chats. Bold, italic and strikethrough are built in.",
      facts: [
        ["Bold", "*text*"],
        ["Italic", "_text_"],
        ["Strikethrough", "~text~"],
        ["Monospace", "```text```"],
        ["Underline", "not built in — use the Underlined style above"],
        ["Profile name", "up to 25 characters"],
        ["About", "up to 139 characters"],
      ],
      about: [
        "Plain emphasis in WhatsApp doesn't need symbols: wrap a word in asterisks, underscores or tildes — *bold*, _italic_, ~strikethrough~ — or select text and pick a style from the menu. It works with any alphabet.",
        "WhatsApp has no underline, so the Underlined style (U+0332 after every letter) is the most useful one here. Decorative styles like script or double-struck suit your profile name and About, but they change only Latin letters.",
      ],
      faq: [
        {
          q: "How do I write in bold on WhatsApp?",
          a: "Put asterisks on both sides: *text*. Underscores give italic (_text_), tildes strikethrough (~text~) and three backticks on each side monospace.",
        },
        {
          q: "How do I underline text on WhatsApp?",
          a: "There's no built-in underline. Type your text above, copy the Underlined row and paste it into the chat — the line stays, whatever the alphabet.",
        },
      ],
    },
  },

  youtube: {
    ru: {
      title: "Шрифты для YouTube — красивый текст для комментариев",
      h1: "Шрифты для YouTube",
      lead: "В комментариях YouTube работает *жирный*, _курсив_ и -зачёркнутый-, а подчёркивание и декоративные стили вставляются символами Unicode.",
      description: "Шрифты для YouTube: подчёркнутый, рукописный, капитель и ещё 29 стилей для комментариев и описаний. Жирный *текст* и курсив _текст_ в комментариях есть и так.",
      facts: [
        ["Жирный в комментариях", "*текст*"],
        ["Курсив", "_текст_"],
        ["Зачёркнутый", "-текст-"],
        ["Подчёркнутый", "встроенного нет — используйте символы Unicode"],
        ["Где пригодятся стили", "комментарии, описание канала и видео, названия плейлистов"],
      ],
      about: [
        "YouTube понимает простую разметку в комментариях: звёздочки дают жирный текст, подчёркивания — курсив, дефисы — зачёркивание. Она работает с кириллицей, поэтому для выделения слов в комментариях символы Unicode не нужны.",
        "Стили Unicode пригодятся там, где разметки нет: в описании канала и видео, в названиях плейлистов, а также для подчёркнутого текста, которого у YouTube нет вовсе. Не злоупотребляйте ими в названиях видео: стилизованные слова могут хуже находиться поиском.",
      ],
      faq: [
        {
          q: "Как сделать жирный текст в комментарии YouTube?",
          a: "Оберните слово звёздочками: *текст*. Курсив — _текст_, зачёркивание — -текст-. Между знаками и словом не должно быть пробела.",
        },
        {
          q: "Можно ли подчеркнуть текст на YouTube?",
          a: "Встроенного подчёркивания нет. Скопируйте строку «Подчёркнутый» или «Двойное подчёркивание» выше — линия является частью символов и работает с русскими буквами.",
        },
      ],
    },
    en: {
      title: "YouTube Fonts — Fancy Text for Comments and Names",
      h1: "Fonts for YouTube",
      lead: "YouTube comments support *bold*, _italic_ and -strikethrough-; underline and decorative styles come from Unicode characters.",
      description: "YouTube fonts: underline, script, small caps and 29 more styles for comments and descriptions. Comments already support *bold*, _italic_ and -strikethrough-.",
      facts: [
        ["Bold in comments", "*text*"],
        ["Italic", "_text_"],
        ["Strikethrough", "-text-"],
        ["Underline", "not built in — use Unicode characters"],
        ["Where styles help", "comments, channel and video descriptions, playlist titles"],
      ],
      about: [
        "YouTube comments understand simple markup: asterisks for bold, underscores for italic, hyphens for strikethrough. It works with any alphabet, so comments rarely need Unicode styles.",
        "Unicode styles help where there's no markup — channel and video descriptions, playlist titles — and for underlined text, which YouTube doesn't have at all. Don't overuse them in video titles: styled words may be harder to find through search.",
      ],
      faq: [
        {
          q: "How do I make bold text in a YouTube comment?",
          a: "Wrap the word in asterisks: *text*. Italic is _text_ and strikethrough -text-. There must be no space between the symbols and the word.",
        },
        {
          q: "Can I underline text on YouTube?",
          a: "Not with built-in markup. Copy the Underlined or Double underline row above — the line is part of the characters and works with any alphabet.",
        },
      ],
    },
  },

  "pubg-free-fire": {
    ru: {
      title: "Красивые ники для PUBG и Free Fire — символы и шрифты",
      h1: "Красивые ники для PUBG и Free Fire",
      lead: "Стили и невидимые символы для ника в PUBG Mobile и Free Fire — проверьте результат в игре до того, как подтвердить смену имени.",
      description: "Ники для PUBG и Free Fire: капитель, надстрочные буквы, широкий шрифт, буквы в кружках и невидимые символы. Смена имени платная — проверяйте ник заранее.",
      facts: [
        ["Смена ника в PUBG Mobile", "нужна карточка переименования"],
        ["Смена ника во Free Fire", "за алмазы или карточку смены имени"],
        ["Что отображается в игре", "только символы, которые есть во встроенном шрифте игры; остальные превращаются в квадратики или не принимаются"],
        ["Пробел в нике", "если обычный пробел не принимается, пробуют невидимые символы, например U+3164"],
      ],
      about: [
        "Игры рисуют ники своими встроенными шрифтами, а не шрифтами телефона, поэтому часть стилей Unicode может не отобразиться: вместо букв появятся квадратики, или игра не примет имя. Какие именно символы поддерживаются, заранее сказать нельзя — это зависит от шрифта и фильтров игры, которые меняются с обновлениями.",
        "Смена ника в обеих играх стоит внутриигровых ресурсов: в PUBG Mobile нужна карточка переименования, во Free Fire — алмазы или карточка. Поэтому сначала вставьте ник в поле смены имени и посмотрите, как он выглядит, и только потом подтверждайте. Для «пустых» пробелов попробуйте невидимые символы — они собраны на отдельной странице.",
      ],
      faq: [
        {
          q: "Почему в игре вместо ника квадратики?",
          a: "В шрифте игры нет этих символов. Выберите другой стиль — например, капитель или широкий шрифт — и проверьте снова. Поддержка зависит от игры и может меняться с обновлениями.",
        },
        {
          q: "Как сделать пробел в нике PUBG или Free Fire?",
          a: "Если обычный пробел не принимается, попробуйте невидимый символ U+3164 (хангыль-заполнитель) или U+2800 — их можно скопировать на странице «Невидимый символ». Гарантий нет: игры время от времени обновляют фильтры имён.",
        },
      ],
    },
    en: {
      title: "PUBG & Free Fire Nicknames — Fancy Fonts and Symbols",
      h1: "Fancy nicknames for PUBG & Free Fire",
      lead: "Styles and blank characters for PUBG Mobile and Free Fire names — check the result in the game before you confirm the rename.",
      description: "PUBG & Free Fire nicknames: small caps, superscript, wide letters, circled text and blank characters. Renaming costs in-game items, so test your name first.",
      facts: [
        ["Renaming in PUBG Mobile", "requires a Rename Card"],
        ["Renaming in Free Fire", "costs diamonds or a name change card"],
        ["What the game shows", "only characters present in the game's built-in font; others turn into boxes or are rejected"],
        ["Spaces in a name", "if a regular space is rejected, players try blank characters such as U+3164"],
      ],
      about: [
        "Games draw names with their own built-in fonts rather than the phone's, so some Unicode styles may not display: you'll see boxes, or the game will reject the name. Which characters work can't be known in advance — it depends on the game's font and filters, which change with updates.",
        "Renaming costs in-game resources in both games, so paste the name into the rename field and check how it looks before confirming. For blank spaces try the invisible characters collected on a separate page.",
      ],
      faq: [
        {
          q: "Why does my name show boxes in the game?",
          a: "The game's font lacks those characters. Pick another style, such as small caps or wide text, and check again. Support depends on the game and may change with updates.",
        },
        {
          q: "How do I add a space to a PUBG or Free Fire name?",
          a: "If a regular space is rejected, try the blank character U+3164 (Hangul Filler) or U+2800 from the Invisible character page. There's no guarantee: games update their name filters from time to time.",
        },
      ],
    },
  },
};

/* ───────────── invisible character ───────────── */

interface InvisibleText extends PageText {
  tips: string[];
}

export const INVISIBLE_TEXT: Record<Locale, InvisibleText> = {
  ru: {
    title: "Невидимый символ для ника — скопировать пустой символ",
    h1: "Невидимый символ для ника",
    lead: "15 пустых и невидимых символов Unicode с копированием в один клик: для пустого ника, пустого сообщения или отступа в описании.",
    description: "Невидимый символ для ника и пустого сообщения: хангыль-заполнитель U+3164, пустой Брайль U+2800, пробел нулевой ширины U+200B и ещё 12 вариантов.",
    tips: [
      "Пустой ник в игре или соцсети — U+3164, затем U+115F, U+FFA0 или U+2800.",
      "Пустое сообщение в мессенджере — U+2800 или U+3164.",
      "Пустая строка или отступ в описании профиля — U+2800.",
      "Разбить ссылку или слово, чтобы оно не стало кликабельным, — U+200B.",
      "Не дать разорвать «10 000 ₸» при переносе строки — неразрывный пробел U+00A0.",
    ],
    about: [
      "Невидимые символы делятся на две группы. Пробелы (U+00A0, U+2003, U+3000 и другие) по стандарту Unicode считаются пробельными символами, и многие формы обрезают их по краям, как обычный пробел. Хангыль-заполнители U+3164, U+115F, U+1160, U+FFA0 считаются буквами, а пустой символ Брайля U+2800 — знаком, поэтому именно их используют для пустых ников и сообщений.",
      "Никаких гарантий здесь нет: соцсети, мессенджеры и игры регулярно меняют фильтры и начинают вырезать или запрещать такие символы. Если один символ не прошёл, попробуйте другой из таблицы. Ширина в списке выше показана так, как символ рисует ваш браузер, — в другом приложении она может отличаться.",
    ],
    faq: [
      {
        q: "Как сделать пустой ник?",
        a: "Скопируйте хангыль-заполнитель U+3164 кнопкой выше и вставьте в поле имени. Если сервис требует несколько символов, выберите «×3» или «×5». Если символ не принимается, попробуйте U+115F, U+FFA0 или U+2800.",
      },
      {
        q: "Как отправить пустое сообщение?",
        a: "Скопируйте пустой символ Брайля U+2800 и отправьте его как сообщение: он выглядит как пробел, но пробелом не считается, поэтому многие мессенджеры его не обрезают.",
      },
      {
        q: "Почему невидимый символ не работает?",
        a: "Площадка вырезает его или считает поле пустым. Фильтры меняются, поэтому универсального невидимого символа нет — пробуйте варианты из таблицы по очереди.",
      },
    ],
  },
  en: {
    title: "Invisible Character — Copy Blank Text for Names",
    h1: "Invisible character to copy",
    lead: "15 blank and invisible Unicode characters with one-click copy — for an empty nickname, a blank message or spacing in a bio.",
    description: "Invisible characters for blank names and empty messages: Hangul Filler U+3164, Braille Blank U+2800, Zero Width Space U+200B and 12 more to copy.",
    tips: [
      "Blank nickname in a game or social app — U+3164, then U+115F, U+FFA0 or U+2800.",
      "Empty chat message — U+2800 or U+3164.",
      "Blank line or indent in a profile bio — U+2800.",
      "Break a link or word so it doesn't become clickable — U+200B.",
      "Keep “10 000” from breaking across lines — no-break space U+00A0.",
    ],
    about: [
      "Invisible characters fall into two groups. Spaces (U+00A0, U+2003, U+3000 and others) are whitespace under the Unicode standard, and many forms trim them at the edges like a regular space. The Hangul fillers U+3164, U+115F, U+1160, U+FFA0 count as letters and the Braille blank U+2800 as a symbol, which is why they're used for blank names and messages.",
      "There are no guarantees: social networks, messengers and games keep changing their filters and start stripping or banning these characters. If one doesn't pass, try another from the table. The width in the list above is how your browser draws the character; another app may differ.",
    ],
    faq: [
      {
        q: "How do I make a blank nickname?",
        a: "Copy the Hangul Filler U+3164 with the button above and paste it into the name field. If the service needs several characters, choose ×3 or ×5. If it's rejected, try U+115F, U+FFA0 or U+2800.",
      },
      {
        q: "How do I send an empty message?",
        a: "Copy the Braille Pattern Blank U+2800 and send it: it looks like a space but isn't one, so many messengers don't trim it.",
      },
      {
        q: "Why doesn't the invisible character work?",
        a: "The platform strips it or treats the field as empty. Filters change, so there's no universal invisible character — try the options in the table one by one.",
      },
    ],
  },
};

