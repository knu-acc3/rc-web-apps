import type { Locale } from "@/i18n/config";
import type { QA } from "@/registry/types";
import { stylize as f, type StyleId } from "./styles";

/** SEO texts of one page in one locale. */
export interface PageText {
  title: string;
  h1: string;
  description: string;
  lead: string;
  about: string[];
  faq: QA[];
  /** "жирные буквы" — used in the generated Cyrillic FAQ ("none" styles). */
  what?: string;
  /** Answer about Cyrillic for "partial" styles. */
  cyrNote?: string;
  /** The page's own FAQ already covers Cyrillic — don't add the generated one. */
  noCyrFaq?: boolean;
}

export const STYLE_TEXT: Record<StyleId, Record<Locale, PageText>> = {
  bold: {
    ru: {
      title: "Жирный шрифт онлайн — для Инстаграма, ВК и ников",
      h1: "Жирный шрифт для Инстаграма",
      lead: `Жирные буквы ${f("bold", "ABC")} и цифры ${f("bold", "123")} из Unicode вставляются в био, посты и ники без кнопки форматирования.`,
      description: `Жирный шрифт онлайн: латиница и цифры превращаются в символы Unicode ${f("bold", "Bold 123")} (U+1D400–U+1D433). Для Инстаграма, ВК и Telegram, копирование в один клик.`,
      what: "жирных букв",
      about: [
        "Жирный текст здесь — не форматирование, а отдельные символы из блока Unicode «Математические буквенно-цифровые символы». Их можно вставить туда, где кнопки «Жирный» нет: в описание профиля Инстаграма, подпись к фото, пост или комментарий ВКонтакте, имя в Telegram.",
      ],
      faq: [
        {
          q: "Как сделать жирный шрифт в Инстаграме?",
          a: "Напишите текст латиницей в поле выше, скопируйте строку «Жирный» и вставьте в био, подпись или комментарий. Встроенной кнопки жирного шрифта в Инстаграме нет, поэтому пользуются такими символами.",
        },
        {
          q: "Найдут ли пост по жирным словам?",
          a: `Скорее всего нет: ${f("bold", "text")} и text — разные символы, поэтому поиск и хештеги с жирными буквами обычно не совпадают с обычными. Ключевые слова и хештеги лучше оставлять обычным шрифтом.`,
        },
      ],
    },
    en: {
      title: "Bold Text Generator: Unicode Bold Letters to Copy",
      h1: "Bold text generator",
      lead: `Bold letters ${f("bold", "ABC")} and digits ${f("bold", "123")} from Unicode that paste into bios, posts and nicknames — no formatting button needed.`,
      description: `Make bold text for Instagram, X and Discord: Latin letters and digits turn into Unicode math bold ${f("bold", "Bold 123")} (U+1D400–U+1D433). One-click copy.`,
      what: "bold letters",
      about: [
        "The bold text here isn't formatting — it's a separate set of characters from Unicode's Mathematical Alphanumeric Symbols block. That's why it survives where there's no bold button: an Instagram bio, a photo caption, a comment, a Telegram display name.",
      ],
      faq: [
        {
          q: "How do I get bold text on Instagram?",
          a: "Type your text above, copy the Bold row and paste it into your bio, caption or comment. Instagram has no bold button, so people use these Unicode characters instead.",
        },
        {
          q: "Will hashtags and search work with bold letters?",
          a: `Usually not: ${f("bold", "text")} and text are different characters, so bold hashtags and keywords generally don't match the plain ones. Keep keywords and hashtags in regular text.`,
        },
      ],
    },
  },

  italic: {
    ru: {
      title: "Курсив онлайн — наклонный шрифт для соцсетей",
      h1: "Курсивный шрифт онлайн",
      lead: `Наклонные буквы ${f("italic", "ABC")} из Unicode для постов, био и комментариев — там, где нет кнопки курсива.`,
      description: `Курсив онлайн: латинские буквы превращаются в математический курсив Unicode ${f("italic", "Italic")} (U+1D434–U+1D467), буква h — в символ ℎ U+210E. Копируйте в один клик.`,
      what: "курсивных букв",
      about: [
        "Курсив собран из математического блока Unicode. Курсивных цифр в нём нет — они остаются обычными, а строчная h взята из более старого символа ℎ (U+210E, «постоянная Планка»), потому что её место в блоке зарезервировано пустым.",
      ],
      faq: [
        {
          q: "Почему буква h в курсиве выглядит иначе?",
          a: "В математическом блоке место курсивной h (U+1D455) пустое: она была закодирована раньше как ℎ (U+210E, постоянная Планка). Генератор подставляет именно её, поэтому в некоторых шрифтах h чуть отличается от соседних букв.",
        },
        {
          q: "Есть ли курсивные цифры?",
          a: "Нет, в Unicode нет курсивных цифр, поэтому 123 останутся прямыми. Если нужны стилизованные цифры, возьмите жирный, моноширинный или двойной стиль.",
        },
      ],
    },
    en: {
      title: "Italic Text Generator: Copy and Paste Italic Font",
      h1: "Italic text generator",
      lead: `Slanted Unicode letters ${f("italic", "ABC")} for posts, bios and comments — wherever there's no italic button.`,
      description: `Italic text generator: Latin letters become Unicode math italic ${f("italic", "Italic")} (U+1D434–U+1D467), and h comes from ℎ U+210E. Paste into bios, posts and names.`,
      what: "italic letters",
      about: [
        "The italic letters come from Unicode's mathematical block. There are no italic digits, so numbers stay upright, and small h is taken from the older character ℎ (U+210E, the Planck constant) because its slot in the block is reserved and empty.",
      ],
      faq: [
        {
          q: "Why does the italic h look slightly different?",
          a: "The slot for math italic h (U+1D455) is empty because the letter was encoded earlier as ℎ (U+210E, the Planck constant). The generator uses that character, so in some fonts h differs a little from its neighbours.",
        },
        {
          q: "Are there italic digits?",
          a: "No, Unicode has no italic digits, so 123 stays upright. For styled digits use bold, monospace or double-struck.",
        },
      ],
    },
  },

  "bold-italic": {
    ru: {
      title: "Жирный курсив онлайн — копировать для соцсетей",
      h1: "Жирный курсив онлайн",
      lead: `Жирные наклонные буквы ${f("bold-italic", "ABC")} из Unicode — самый заметный акцент там, где нет встроенного форматирования.`,
      description: `Жирный курсив онлайн: латиница превращается в символы Unicode ${f("bold-italic", "Bold Italic")} (U+1D468–U+1D49B). Для заголовков постов, био и ников, копирование в один клик.`,
      what: "жирных курсивных букв",
      about: [
        "У жирного курсива полный алфавит без пропусков: все 52 латинские буквы стоят в блоке подряд, начиная с U+1D468. Цифр в этом стиле нет, поэтому числа остаются обычными; жирные цифры можно взять из стиля «Жирный».",
      ],
      faq: [
        {
          q: "Чем жирный курсив отличается от курсива без засечек?",
          a: `Это разные наборы символов: жирный курсив (${f("bold-italic", "Abc")}) — с засечками, как книжный шрифт, а жирный курсив без засечек (${f("sans-bold-italic", "Abc")}) выглядит современнее. Кириллических версий нет ни у одного из них.`,
        },
        {
          q: "Где уместен жирный курсив?",
          a: "В коротких акцентах: первая строка поста, название рубрики, ник. Длинный текст таким шрифтом читать тяжело, а программы экранного доступа могут читать эти символы неправильно.",
        },
      ],
    },
    en: {
      title: "Bold Italic Text Generator — Copy and Paste",
      h1: "Bold italic text generator",
      lead: `Bold slanted Unicode letters ${f("bold-italic", "ABC")} — the strongest emphasis you can paste where formatting isn't available.`,
      description: `Bold italic generator: Latin letters become Unicode math bold italic ${f("bold-italic", "Bold Italic")} (U+1D468–U+1D49B) for post headlines, bios and names. One-click copy.`,
      what: "bold italic letters",
      about: [
        "Bold italic is a complete alphabet with no gaps: all 52 Latin letters sit in a row starting at U+1D468. It has no digits, so numbers stay plain; take bold digits from the Bold style if you need them.",
      ],
      faq: [
        {
          q: "How is bold italic different from sans-serif bold italic?",
          a: `They are separate character sets: bold italic (${f("bold-italic", "Abc")}) has serifs like a book face, while sans-serif bold italic (${f("sans-bold-italic", "Abc")}) looks more modern. Neither has Cyrillic letters.`,
        },
        {
          q: "Where does bold italic work best?",
          a: "In short accents: the first line of a post, a section label, a nickname. Long passages are tiring to read, and screen readers may announce these characters incorrectly.",
        },
      ],
    },
  },

  script: {
    ru: {
      title: "Рукописный шрифт онлайн — каллиграфия для ников",
      h1: "Рукописный шрифт онлайн",
      lead: `Каллиграфические буквы ${f("script", "ABC")} из Unicode — для красивых ников, подписей и описаний профиля.`,
      description: `Рукописный шрифт онлайн: латиница превращается в каллиграфию Unicode ${f("script", "Script")} (U+1D49C–U+1D4CF), 11 букв вроде ℬ и ℯ берутся из блока U+2100. Для ников и био.`,
      what: "рукописных букв",
      about: [
        "В рукописном алфавите Unicode 11 «дыр»: заглавные B, E, F, H, I, L, M, R и строчные e, g, o появились раньше в блоке «Буквоподобные символы», поэтому их места в математическом блоке пусты. Генератор подставляет эти старые символы (ℬ, ℰ, ℱ, ℋ, ℐ, ℒ, ℳ, ℛ, ℯ, ℊ, ℴ); в некоторых шрифтах они немного отличаются по стилю от остальных букв.",
      ],
      faq: [
        {
          q: "Почему некоторые рукописные буквы выглядят иначе?",
          a: "Одиннадцать букв (например, ℬ, ℰ, ℋ, ℯ) взяты из блока «Буквоподобные символы», а не из математического, — так устроен Unicode. Шрифты рисуют эти блоки по-разному, поэтому буквы могут отличаться наклоном или толщиной.",
        },
        {
          q: "Чем рукописный отличается от жирного рукописного?",
          a: `Жирный рукописный (${f("bold-script", "ABC")}) — отдельный набор с U+1D4D0. У него нет пропусков, и в большинстве шрифтов он выглядит ровнее и заметнее.`,
        },
      ],
    },
    en: {
      title: "Script Font Generator — Cursive Text to Copy",
      h1: "Cursive script text generator",
      lead: `Calligraphic Unicode letters ${f("script", "ABC")} for pretty nicknames, captions and profile bios.`,
      description: `Cursive script generator: Latin letters become Unicode math script ${f("script", "Script")} (U+1D49C–U+1D4CF); 11 letters such as ℬ and ℯ come from U+2100–U+214F.`,
      what: "script letters",
      about: [
        "Unicode's script alphabet has 11 holes: capitals B, E, F, H, I, L, M, R and small e, g, o were encoded earlier in the Letterlike Symbols block, so their slots in the math block are empty. The generator uses those older characters (ℬ, ℰ, ℱ, ℋ, ℐ, ℒ, ℳ, ℛ, ℯ, ℊ, ℴ); in some fonts they differ slightly in style from the rest.",
      ],
      faq: [
        {
          q: "Why do some script letters look different?",
          a: "Eleven letters (such as ℬ, ℰ, ℋ, ℯ) come from Letterlike Symbols rather than the math block — that's how Unicode is organised. Fonts draw these blocks differently, so slant or weight can vary.",
        },
        {
          q: "What's the difference between script and bold script?",
          a: `Bold script (${f("bold-script", "ABC")}) is a separate set starting at U+1D4D0. It has no gaps and in most fonts looks more even and more visible.`,
        },
      ],
    },
  },

  "bold-script": {
    ru: {
      title: "Жирный рукописный шрифт — красивые буквы онлайн",
      h1: "Жирный рукописный шрифт",
      lead: `Заметные каллиграфические буквы ${f("bold-script", "ABC")} из Unicode — полный алфавит без пропусков для ников и шапки профиля.`,
      description: `Жирный рукописный шрифт онлайн: латиница превращается в ${f("bold-script", "Bold Script")} из блока Unicode U+1D4D0–U+1D503. Все 52 буквы без пропусков — для ников, био и постов.`,
      what: "жирных рукописных букв",
      about: [
        "Жирный рукописный — один из самых популярных стилей для ников: он читается лучше тонкого рукописного, и в нём нет «дыр» — все 52 буквы стоят в блоке подряд. Цифр в этом наборе нет.",
      ],
      faq: [
        {
          q: "Какой рукописный стиль лучше для ника?",
          a: "Обычно жирный рукописный: он заметнее, и все его буквы из одного блока, поэтому выглядят одинаково. В тонком рукописном 11 букв взяты из другого блока и в некоторых шрифтах выбиваются из строки.",
        },
        {
          q: "Будут ли работать цифры?",
          a: "Рукописных цифр в Unicode нет, поэтому 2024 останется обычным числом. Для стилизованных цифр подойдут жирный, двойной или моноширинный стиль.",
        },
      ],
    },
    en: {
      title: "Bold Script Text Generator — Fancy Cursive Letters",
      h1: "Bold script text generator",
      lead: `Bold calligraphic Unicode letters ${f("bold-script", "ABC")} — a complete alphabet with no gaps, for nicknames and profile headers.`,
      description: `Bold script generator: Latin letters become Unicode math bold script ${f("bold-script", "Bold Script")} (U+1D4D0–U+1D503), all 52 letters with no gaps. For names and bios.`,
      what: "bold script letters",
      about: [
        "Bold script is one of the most popular nickname styles: it reads better than the thin script and has no holes — all 52 letters sit in a row. There are no digits in this set.",
      ],
      faq: [
        {
          q: "Which script style is best for a nickname?",
          a: "Usually bold script: it stands out more and every letter comes from one block, so they match. In the thin script 11 letters come from another block and can look off in some fonts.",
        },
        {
          q: "Do digits work?",
          a: "Unicode has no script digits, so 2024 stays a plain number. For styled digits use bold, double-struck or monospace.",
        },
      ],
    },
  },

  fraktur: {
    ru: {
      title: "Готический шрифт онлайн — буквы фрактура для ников",
      h1: "Готический шрифт онлайн",
      lead: `Буквы фрактура ${f("fraktur", "ABC")} из Unicode — готический стиль для ников в играх, Discord и Steam.`,
      description: `Готический шрифт онлайн: латиница превращается во фрактуру Unicode ${f("fraktur", "Gothic")} (U+1D504–U+1D537), буквы C, H, I, R, Z — из блока U+2100. Для ников и Discord.`,
      what: "готических букв",
      about: [
        "Фрактура — немецкий готический шрифт; в Unicode он попал как набор математических символов. Пять заглавных букв (ℭ, ℌ, ℑ, ℜ, ℨ) существовали раньше в блоке «Буквоподобные символы», поэтому генератор берёт их оттуда. Готических цифр нет.",
      ],
      faq: [
        {
          q: "Почему заглавные C, H, I, R, Z взяты из другого блока?",
          a: "Эти буквы добавили в Unicode раньше как математические обозначения (например, ℜ — действительная часть числа), поэтому в новом блоке их места оставили пустыми. Генератор подставляет исходные символы.",
        },
        {
          q: "Легко ли читать готический шрифт?",
          a: `Строчные буквы фрактуры трудно читать, особенно мелко. Для ника или заголовка это не страшно, а для длинной фразы лучше жирный готический ${f("bold-fraktur", "Bold")} — он контрастнее.`,
        },
      ],
    },
    en: {
      title: "Gothic Fraktur Text Generator — Old English Font",
      h1: "Gothic fraktur text generator",
      lead: `Fraktur letters ${f("fraktur", "ABC")} from Unicode — a gothic, blackletter look for gamer tags, Discord and Steam.`,
      description: `Fraktur generator: Latin letters become Unicode math fraktur ${f("fraktur", "Gothic")} (U+1D504–U+1D537); C, H, I, R and Z come from Letterlike Symbols. Ideal for gamer tags.`,
      what: "fraktur letters",
      about: [
        "Fraktur is the German blackletter script; it entered Unicode as a set of mathematical symbols. Five capitals (ℭ, ℌ, ℑ, ℜ, ℨ) already existed in Letterlike Symbols, so the generator takes them from there. There are no fraktur digits.",
      ],
      faq: [
        {
          q: "Why do capital C, H, I, R, Z come from another block?",
          a: "They were added to Unicode earlier as math notation (ℜ, for example, is the real part of a number), so their slots in the newer block were left empty. The generator substitutes the original characters.",
        },
        {
          q: "Is fraktur easy to read?",
          a: `Small fraktur letters are hard to read, especially at small sizes. That's fine for a nickname or title; for a longer phrase bold fraktur ${f("bold-fraktur", "Bold")} has more contrast.`,
        },
      ],
    },
  },

  "bold-fraktur": {
    ru: {
      title: "Жирный готический шрифт онлайн — копировать",
      h1: "Жирный готический шрифт",
      lead: `Жирная фрактура ${f("bold-fraktur", "ABC")} из Unicode — контрастный готический стиль для ников и названий.`,
      description: `Жирный готический шрифт онлайн: латиница превращается в ${f("bold-fraktur", "Bold Fraktur")} из блока U+1D56C–U+1D59F. Все 52 буквы без пропусков — для ников в играх, Steam и Discord.`,
      what: "жирных готических букв",
      about: [
        "В отличие от обычной фрактуры, у жирной нет пропусков: все буквы стоят подряд, начиная с U+1D56C, поэтому набор выглядит однородно в любом шрифте. Цифр в этом стиле нет.",
      ],
      faq: [
        {
          q: "Какой готический стиль выбрать для ника?",
          a: "Жирный: он лучше читается на маленьком размере, и все его буквы из одного блока. Обычная фрактура тоньше, а пять её заглавных взяты из другого блока.",
        },
        {
          q: "Покажется ли такой ник в игре?",
          a: "Зависит от шрифта игры: если в нём нет символов U+1D56C–U+1D59F, вместо букв будут квадратики. Проверьте ник в поле смены имени, прежде чем подтверждать изменение.",
        },
      ],
    },
    en: {
      title: "Bold Fraktur Generator — Bold Gothic Letters",
      h1: "Bold fraktur text generator",
      lead: `Bold fraktur ${f("bold-fraktur", "ABC")} from Unicode — a high-contrast gothic style for nicknames and titles.`,
      description: `Bold fraktur generator: Latin letters become Unicode math bold fraktur ${f("bold-fraktur", "Bold Fraktur")} (U+1D56C–U+1D59F), all 52 letters — for game, Steam and Discord names.`,
      what: "bold fraktur letters",
      about: [
        "Unlike regular fraktur, the bold set has no gaps: every letter sits in a row from U+1D56C, so the style looks consistent in any font. There are no digits.",
      ],
      faq: [
        {
          q: "Which gothic style should I pick for a nickname?",
          a: "Bold: it reads better at small sizes and all its letters come from one block. Regular fraktur is thinner, and five of its capitals come from another block.",
        },
        {
          q: "Will the name show up in a game?",
          a: "It depends on the game's font: if it lacks U+1D56C–U+1D59F, you'll see boxes instead of letters. Check the name in the rename field before confirming.",
        },
      ],
    },
  },

  "double-struck": {
    ru: {
      title: "Двойной шрифт онлайн — буквы с двойным контуром",
      h1: "Шрифт с двойным контуром",
      lead: `Буквы и цифры с двойной линией ${f("double-struck", "ABC 123")} из Unicode — «ажурный» стиль для ников и заголовков.`,
      description: `Шрифт с двойным контуром: латиница и цифры превращаются в ${f("double-struck", "Double 123")} (U+1D538–U+1D56B, U+1D7D8–U+1D7E1); ℂ ℍ ℕ ℙ ℚ ℝ ℤ — из блока U+2100.`,
      what: "букв с двойным контуром",
      about: [
        "Двойной шрифт пришёл из математики: ℕ, ℤ, ℚ, ℝ и ℂ обозначают натуральные, целые, рациональные, действительные и комплексные числа. Эти пять заглавных вместе с ℍ и ℙ закодированы в Unicode отдельно, в блоке «Буквоподобные символы»; остальные буквы и цифры — в математическом блоке.",
      ],
      faq: [
        {
          q: "Что значат ℕ, ℤ, ℝ?",
          a: "В математике это множества чисел: ℕ — натуральные, ℤ — целые, ℚ — рациональные, ℝ — действительные, ℂ — комплексные. Поэтому эти буквы есть почти в любом шрифте.",
        },
        {
          q: "Есть ли двойные цифры?",
          a: `Да: ${f("double-struck", "0123456789")} (U+1D7D8–U+1D7E1). Генератор заменяет цифры автоматически.`,
        },
      ],
    },
    en: {
      title: "Double-Struck Text Generator — Blackboard Bold",
      h1: "Double-struck (blackboard bold) text generator",
      lead: `Letters and digits with a doubled stroke ${f("double-struck", "ABC 123")} — Unicode's blackboard bold for names and headers.`,
      description: `Double-struck generator: letters and digits become Unicode blackboard bold ${f("double-struck", "Double 123")} (U+1D538–U+1D56B); ℂ ℍ ℕ ℙ ℚ ℝ ℤ come from Letterlike Symbols.`,
      what: "double-struck letters",
      about: [
        "Blackboard bold comes from mathematics: ℕ, ℤ, ℚ, ℝ and ℂ denote the natural, integer, rational, real and complex numbers. Those five capitals, together with ℍ and ℙ, are encoded separately in Letterlike Symbols; the other letters and all digits live in the math block.",
      ],
      faq: [
        {
          q: "What do ℕ, ℤ and ℝ mean?",
          a: "In maths they are number sets: ℕ natural, ℤ integers, ℚ rationals, ℝ reals, ℂ complex numbers. That's why almost every font has them.",
        },
        {
          q: "Are there double-struck digits?",
          a: `Yes: ${f("double-struck", "0123456789")} (U+1D7D8–U+1D7E1). The generator replaces digits automatically.`,
        },
      ],
    },
  },

  monospace: {
    ru: {
      title: "Моноширинный шрифт онлайн — текст как на машинке",
      h1: "Моноширинный шрифт онлайн",
      lead: `Буквы одинаковой ширины ${f("monospace", "ABC 123")} из Unicode — «шрифт пишущей машинки» для ников и подписей.`,
      description: `Моноширинный шрифт онлайн: латиница и цифры превращаются в ${f("monospace", "Mono 123")} из блоков U+1D670–U+1D6A3 и U+1D7F6–U+1D7FF. Для ников, био и подписей, без разметки.`,
      what: "моноширинных букв",
      about: [
        "Моноширинные символы Unicode похожи на код, но это обычный текст: он не превращается в блок кода и не требует разметки. В мессенджерах с форматированием (Telegram, Discord, WhatsApp) для кода лучше встроенный моноширинный режим — он работает и с кириллицей.",
      ],
      faq: [
        {
          q: "Чем это отличается от форматирования кода?",
          a: "Форматирование кода (`текст` в Telegram или Discord) меняет только отображение и поддерживает любые буквы. Моноширинные символы Unicode — другие символы: они сохраняют вид там, где форматирования нет, но работают только для латиницы и цифр.",
        },
        {
          q: "Будет ли текст ровным, как в редакторе кода?",
          a: "Сами моноширинные буквы одинаковой ширины, но пробелы и знаки препинания остаются обычными, поэтому идеального выравнивания, как в редакторе кода, не получится.",
        },
      ],
    },
    en: {
      title: "Monospace Text Generator — Typewriter Font to Copy",
      h1: "Monospace text generator",
      lead: `Fixed-width Unicode letters ${f("monospace", "ABC 123")} — a typewriter look for nicknames and captions.`,
      description: `Monospace generator: letters and digits become Unicode math monospace ${f("monospace", "Mono 123")} (U+1D670–U+1D6A3, U+1D7F6–U+1D7FF) — a typewriter look without code formatting.`,
      what: "monospace letters",
      about: [
        "Monospace Unicode characters look like code but are plain text: nothing turns into a code block and no markup is needed. In apps with formatting (Telegram, Discord, WhatsApp) the built-in monospace mode is better for code — it works with every alphabet.",
      ],
      faq: [
        {
          q: "How is this different from code formatting?",
          a: "Code formatting (`text` in Telegram or Discord) only changes the display and supports any letters. Monospace Unicode characters are different characters: they keep their look where no formatting exists, but cover Latin letters and digits only.",
        },
        {
          q: "Will the text line up like in a code editor?",
          a: "The monospace letters share one width, but spaces and punctuation stay regular characters, so perfect alignment like in a code editor isn't possible.",
        },
      ],
    },
  },

  sans: {
    ru: {
      title: "Шрифт без засечек онлайн — простые буквы Unicode",
      h1: "Шрифт без засечек онлайн",
      lead: `Строгие буквы ${f("sans", "ABC 123")} без засечек из Unicode — выглядят как обычный шрифт, но сохраняют вид в любом приложении.`,
      description: `Шрифт без засечек онлайн: латиница и цифры превращаются в ${f("sans", "Sans 123")} из блока U+1D5A0–U+1D5D3. Удобно, если приложение показывает текст шрифтом с засечками.`,
      what: "букв без засечек",
      about: [
        "Обычный стиль без засечек почти не отличается от текста в большинстве приложений. Его выбирают, когда нужен единый рубленый вид независимо от шрифта площадки, или чтобы сочетать с жирным и курсивом без засечек.",
      ],
      faq: [
        {
          q: "Зачем шрифт без засечек, если текст и так без засечек?",
          a: "На сайтах и в приложениях со шрифтом с засечками эти символы всё равно останутся рублеными. Ещё их берут, чтобы жирные и курсивные слова без засечек сочетались с остальным текстом.",
        },
        {
          q: "Есть ли цифры без засечек?",
          a: `Да, ${f("sans", "0123456789")} (U+1D7E2–U+1D7EB) — генератор подставляет их автоматически.`,
        },
      ],
    },
    en: {
      title: "Sans-Serif Text Generator — Unicode Sans Letters",
      h1: "Sans-serif text generator",
      lead: `Plain sans-serif Unicode letters ${f("sans", "ABC 123")} that keep their look in any app, even next to a serif font.`,
      description: `Sans-serif generator: Latin letters and digits become Unicode math sans-serif ${f("sans", "Sans 123")} (U+1D5A0–U+1D5D3) — useful where an app renders text in a serif font.`,
      what: "sans-serif letters",
      about: [
        "Plain sans-serif looks almost like regular text in most apps. People pick it for a consistent sans look regardless of a site's font, or to match sans-serif bold and italic words.",
      ],
      faq: [
        {
          q: "Why use sans-serif if text is already sans-serif?",
          a: "On sites and apps that use a serif font these characters still render sans-serif. They also make sans-serif bold and italic words blend with the rest of the line.",
        },
        {
          q: "Are there sans-serif digits?",
          a: `Yes, ${f("sans", "0123456789")} (U+1D7E2–U+1D7EB) — the generator uses them automatically.`,
        },
      ],
    },
  },

  "sans-bold": {
    ru: {
      title: "Жирный шрифт без засечек — копировать для соцсетей",
      h1: "Жирный шрифт без засечек",
      lead: `Жирные рубленые буквы ${f("sans-bold", "ABC 123")} из Unicode — самый читаемый жирный стиль для постов и заголовков.`,
      description: `Жирный без засечек онлайн: латиница и цифры превращаются в ${f("sans-bold", "Bold Sans 123")} из блока U+1D5D4–U+1D607. Хорошо читается на телефоне — для заголовков и био.`,
      what: "жирных букв без засечек",
      about: [
        `Жирный без засечек ближе всего к тому, как выглядит жирный текст в интерфейсах соцсетей, поэтому его часто выбирают для первой строки поста и заголовков в био. Есть и жирные цифры ${f("sans-bold", "0–9")} (U+1D7EC–U+1D7F5).`,
      ],
      faq: [
        {
          q: "Чем жирный без засечек отличается от просто жирного?",
          a: `Просто жирный (${f("bold", "Bold")}) — с засечками, как в книжных шрифтах. Жирный без засечек (${f("sans-bold", "Bold")}) — рубленый, лучше сочетается с интерфейсом Инстаграма, ВК и X и легче читается на маленьком экране.`,
        },
        {
          q: "Сколько символов займёт такой текст?",
          a: "Каждая такая буква лежит за пределами основной плоскости Unicode и в UTF-16 занимает два кодовых блока. Поэтому некоторые площадки считают её за два символа: например, X по правилам twitter-text засчитывает её как 2.",
        },
      ],
    },
    en: {
      title: "Sans-Serif Bold Text Generator — Copy and Paste",
      h1: "Sans-serif bold text generator",
      lead: `Bold sans-serif Unicode letters ${f("sans-bold", "ABC 123")} — the most readable bold style for posts and headings.`,
      description: `Sans-serif bold generator: letters and digits become Unicode math bold sans ${f("sans-bold", "Bold Sans 123")} (U+1D5D4–U+1D607). Easy to read on phones — for headlines and bios.`,
      what: "bold sans-serif letters",
      about: [
        `Sans-serif bold is the closest match to how bold text looks in social apps, so it's a favourite for the first line of a post and bio headings. Bold sans digits ${f("sans-bold", "0–9")} (U+1D7EC–U+1D7F5) are included.`,
      ],
      faq: [
        {
          q: "How is sans-serif bold different from bold?",
          a: `Bold (${f("bold", "Bold")}) has serifs, like a book face. Sans-serif bold (${f("sans-bold", "Bold")}) is cleaner, matches the Instagram, VK and X interfaces and reads better on small screens.`,
        },
        {
          q: "How many characters does it use?",
          a: "Each of these letters lies outside Unicode's Basic Multilingual Plane and takes two UTF-16 code units, so some platforms count it as two characters — X, following twitter-text rules, counts it as 2.",
        },
      ],
    },
  },

  "sans-italic": {
    ru: {
      title: "Курсив без засечек онлайн — наклонный текст",
      h1: "Курсив без засечек онлайн",
      lead: `Лёгкий наклонный шрифт ${f("sans-italic", "ABC")} без засечек из Unicode — для цитат, подписей и мягких акцентов.`,
      description: `Курсив без засечек онлайн: латинские буквы превращаются в ${f("sans-italic", "Italic Sans")} из блока Unicode U+1D608–U+1D63B. Для цитат и подписей; цифры остаются обычными.`,
      what: "курсивных букв без засечек",
      about: [
        "Курсив без засечек смотрится в интерфейсах аккуратнее книжного курсива и не выделяется так сильно, как жирный. В отличие от курсива с засечками, у него нет пропуска на месте h — все буквы из одного блока.",
      ],
      faq: [
        {
          q: "Для чего подходит курсив без засечек?",
          a: "Для цитат, подписей к фото, пометок в скобках — там, где нужен акцент без крика. Для заголовков лучше жирный или жирный курсив.",
        },
        {
          q: "Почему цифры не наклоняются?",
          a: "В Unicode нет курсивных цифр ни с засечками, ни без, поэтому числа остаются прямыми.",
        },
      ],
    },
    en: {
      title: "Sans-Serif Italic Text Generator — Copy & Paste",
      h1: "Sans-serif italic text generator",
      lead: `Light slanted sans-serif Unicode letters ${f("sans-italic", "ABC")} for quotes, captions and soft emphasis.`,
      description: `Sans-serif italic generator: Latin letters become Unicode math sans italic ${f("sans-italic", "Italic Sans")} (U+1D608–U+1D63B) for quotes and captions; digits stay plain.`,
      what: "sans-serif italic letters",
      about: [
        "Sans-serif italic looks tidier than the bookish italic in app interfaces and is less loud than bold. Unlike serif italic, it has no hole at h — every letter comes from one block.",
      ],
      faq: [
        {
          q: "What is sans-serif italic good for?",
          a: "Quotes, photo captions, side notes — emphasis without shouting. For headings bold or bold italic works better.",
        },
        {
          q: "Why don't the digits slant?",
          a: "Unicode has no italic digits, with or without serifs, so numbers stay upright.",
        },
      ],
    },
  },

  "sans-bold-italic": {
    ru: {
      title: "Жирный курсив без засечек — генератор текста",
      h1: "Жирный курсив без засечек",
      lead: `Жирные наклонные рубленые буквы ${f("sans-bold-italic", "ABC")} из Unicode — динамичный стиль для заголовков и ников.`,
      description: `Жирный курсив без засечек: латиница превращается в ${f("sans-bold-italic", "Bold Italic")} из блока Unicode U+1D63C–U+1D66F. Динамичный стиль для заголовков, ников и спортивных постов.`,
      what: "жирных курсивных букв без засечек",
      about: [
        "Это последний из рубленых математических алфавитов Unicode: все 52 буквы без пропусков, но без цифр. Стиль напоминает спортивные и игровые логотипы, поэтому его любят для ников и названий команд.",
      ],
      faq: [
        {
          q: "Можно ли так написать название команды?",
          a: `Да, если оно на латинице: например, ${f("sans-bold-italic", "TEAM X")}. Русские буквы и цифры останутся обычными, так что смешанное название будет выглядеть неоднородно.`,
        },
        {
          q: "Чем он отличается от жирного курсива?",
          a: `Жирный курсив (${f("bold-italic", "Bold")}) — с засечками, более «книжный». Этот вариант рубленый и выглядит современнее.`,
        },
      ],
    },
    en: {
      title: "Sans-Serif Bold Italic Generator — Copy Text",
      h1: "Sans-serif bold italic text generator",
      lead: `Bold slanted sans-serif Unicode letters ${f("sans-bold-italic", "ABC")} — a dynamic style for headlines and nicknames.`,
      description: `Sans-serif bold italic generator: Latin letters become Unicode ${f("sans-bold-italic", "Bold Italic")} sans (U+1D63C–U+1D66F) — a dynamic look for headlines, gamer tags and sports posts.`,
      what: "bold italic sans-serif letters",
      about: [
        "This is the last of Unicode's sans-serif math alphabets: all 52 letters with no gaps, but no digits. It resembles sports and gaming logos, which makes it popular for nicknames and team names.",
      ],
      faq: [
        {
          q: "Can I write a team name like this?",
          a: `Yes, if it's in Latin letters: ${f("sans-bold-italic", "TEAM X")}, for example. Digits and non-Latin letters stay plain, so a mixed name will look uneven.`,
        },
        {
          q: "How is it different from bold italic?",
          a: `Bold italic (${f("bold-italic", "Bold")}) has serifs and feels bookish. This one is sans-serif and looks more modern.`,
        },
      ],
    },
  },

  "small-caps": {
    ru: {
      title: "Капитель онлайн — текст маленькими заглавными",
      h1: "Капитель онлайн — маленькие заглавные буквы",
      lead: `Маленькие заглавные буквы ${f("small-caps", "abc")} из фонетических символов Unicode — работают и с частью русских букв.`,
      description: `Капитель онлайн: латиница превращается в маленькие заглавные ${f("small-caps", "small caps")}, а русский текст — в похожую строчную запись с буквами ᴀ ᴇ ᴏ ᴘ ᴄ. Для ников и Discord.`,
      cyrNote:
        "Частично. Большинство строчных русских букв (в, к, м, н, т, п, л…) и так выглядят как маленькие заглавные, поэтому генератор делает все буквы строчными, а а, е, о, р, с заменяет латинскими ᴀ, ᴇ, ᴏ, ᴘ, ᴄ. У б, д, у, ф, ц, щ остаются выносные элементы, так что полностью капительного русского текста не получится.",
      about: [
        "Генератор использует 24 символа капители из фонетических блоков Unicode (ᴀ U+1D00, ʙ U+0299, ꜰ U+A730 и другие). Для q берётся похожая ǫ (U+01EB): настоящая капитель ꞯ (U+A7AF) есть далеко не во всех шрифтах. Для x отдельного символа нет — остаётся обычная x, по высоте она совпадает.",
      ],
      faq: [
        {
          q: "Что такое капитель?",
          a: `Капитель — заглавные буквы высотой со строчные. В типографике ей набирают аббревиатуры и имена, а в соцсетях — ники и подписи в стиле ${f("small-caps", "hello")}.`,
        },
        {
          q: "Почему x и q выглядят иначе?",
          a: "Для x в Unicode нет капительной формы, поэтому остаётся обычная строчная x — по высоте она совпадает с капителью. Для q используется похожая буква ǫ (U+01EB).",
        },
      ],
    },
    en: {
      title: "Small Caps Generator — Tiny Capital Letters to Copy",
      h1: "Small caps text generator",
      lead: `Tiny capital letters ${f("small-caps", "abc")} from Unicode's phonetic blocks — a subtle style for names and bios.`,
      description: `Small caps generator: Latin letters turn into tiny capitals ${f("small-caps", "small caps")} (U+1D00, U+0299, U+A730…). Cyrillic is partly supported. Great for Discord and nicknames.`,
      cyrNote:
        "Partly. Most lowercase Cyrillic letters (в, к, м, н, т, п, л…) already look like small capitals, so the generator lowercases everything and replaces а, е, о, р, с with Latin ᴀ, ᴇ, ᴏ, ᴘ, ᴄ. б, д, у, ф, ц, щ keep their ascenders and descenders, so the result isn't pure small caps.",
      about: [
        "The generator uses 24 small capitals from Unicode's phonetic blocks (ᴀ U+1D00, ʙ U+0299, ꜰ U+A730 and others). For q it uses the look-alike ǫ (U+01EB), because the true small capital ꞯ (U+A7AF) is missing from many fonts. There is no small capital x at all, so a regular x is kept — it has the same height.",
      ],
      faq: [
        {
          q: "What are small caps?",
          a: `Small caps are capital letters at lowercase height. Typographers use them for acronyms and names; on social media they're used for nicknames and captions like ${f("small-caps", "hello")}.`,
        },
        {
          q: "Why do x and q look different?",
          a: "Unicode has no small capital x, so a regular lowercase x is kept — it matches the height. For q the look-alike ǫ (U+01EB) is used.",
        },
      ],
    },
  },

  superscript: {
    ru: {
      title: "Надстрочный текст онлайн — маленькие буквы сверху",
      h1: "Надстрочные буквы и цифры онлайн",
      lead: `Маленькие буквы и цифры над строкой ${f("superscript", "abc 123")} из Unicode — для «тихого» текста, степеней и сносок.`,
      description: `Надстрочный текст онлайн: латиница, цифры и + − = ( ) превращаются в ${f("superscript", "super 123")}. Формы нет только у q; вместо заглавных C F S X Y Z — строчные.`,
      cyrNote: "Нет. Надстрочные кириллические буквы появились только в Unicode 15.0 (2022, блок U+1E030–U+1E08F) и пока почти не поддерживаются шрифтами — вместо них были бы квадратики. Поэтому генератор оставляет русские буквы обычными, а поднимает латиницу и цифры.",
      about: [
        "Надстрочные символы собраны из разных блоков Unicode: цифры и знаки ⁺⁻⁼⁽⁾ — из «Надстрочных и подстрочных» (U+2070–U+209F) и Latin-1 (¹ ² ³), буквы — из модификаторов фонетического алфавита (ᵃ U+1D43, ʰ U+02B0 и другие). Для q есть только редкий символ 𐞥 (U+107A5), которого нет в большинстве шрифтов, поэтому q остаётся обычной. Надстрочные заглавные C, F и Q появились в Unicode лишь в 2021 году и пока редки в шрифтах, а для S, X, Y, Z их нет вовсе — вместо них генератор берёт строчные надстрочные.",
      ],
      faq: [
        {
          q: "Как написать степень, например м²?",
          a: "Напишите «м2» и скопируйте надстрочную строку или возьмите готовые символы ² (U+00B2) и ³ (U+00B3) — они есть почти в любом шрифте. Русская «м» останется обычной, а цифра поднимется.",
        },
        {
          q: "Какие буквы не поднимаются?",
          a: `Только q: для неё есть лишь редкий символ 𐞥, поэтому генератор оставляет её обычной. Заглавные C, F, S, X, Y, Z заменяются строчными надстрочными ${f("superscript", "cfsxyz")}.`,
        },
      ],
    },
    en: {
      title: "Superscript Generator — Tiny Text Above the Line",
      h1: "Superscript text generator",
      lead: `Tiny letters and digits above the line ${f("superscript", "abc 123")} — for whisper text, exponents and footnotes.`,
      description: `Superscript generator: letters, digits and + − = ( ) become ${f("superscript", "super 123")}. Only q has no form; capitals C F S X Y Z use small ones. For exponents and names.`,
      cyrNote: "No. Superscript Cyrillic letters were added only in Unicode 15.0 (2022, block U+1E030–U+1E08F) and most fonts still lack them, so you would see boxes. The generator therefore leaves Cyrillic plain and raises Latin letters and digits.",
      about: [
        "Superscripts come from several Unicode blocks: digits and ⁺⁻⁼⁽⁾ from Superscripts and Subscripts (U+2070–U+209F) and Latin-1 (¹ ² ³), letters from phonetic modifier letters (ᵃ U+1D43, ʰ U+02B0 and others). For q there is only the rare 𐞥 (U+107A5), missing from most fonts, so q stays plain. Superscript capitals C, F and Q arrived only in 2021 and are still rare in fonts, and S, X, Y, Z have none — the generator uses small superscripts for them.",
      ],
      faq: [
        {
          q: "How do I write an exponent like m²?",
          a: "Type “m2” and copy the superscript row, or grab the ready-made ² (U+00B2) and ³ (U+00B3), which almost every font has.",
        },
        {
          q: "Which letters don't go up?",
          a: `Only q: it has just the rare 𐞥, so the generator leaves it plain. Capitals C, F, S, X, Y, Z become the small superscripts ${f("superscript", "cfsxyz")}.`,
        },
      ],
    },
  },

  subscript: {
    ru: {
      title: "Подстрочный текст онлайн — индексы и маленькие буквы",
      h1: "Подстрочные буквы и цифры онлайн",
      lead: `Цифры и буквы под строкой ${f("subscript", "123 aeo")} из Unicode — для химических формул H₂O и индексов.`,
      description: `Подстрочный текст онлайн: цифры 0–9, знаки + − = ( ) и 17 латинских букв превращаются в индексы ${f("subscript", "123 aeo")}. Пишите формулы H₂O и CO₂ прямо в сообщениях.`,
      cyrNote: "Нет. Подстрочные кириллические буквы появились только в Unicode 15.0 (2022) и пока почти не поддерживаются шрифтами, поэтому генератор их не использует: русские буквы остаются обычными, а цифры и 17 латинских букв опускаются.",
      about: [
        "Подстрочные цифры и знаки есть в Unicode полностью (U+2080–U+208E), а букв всего 17: a, e, h, i, j, k, l, m, n, o, p, r, s, t, u, v, x. Для b, c, d, f, g, q, w, y, z подстрочных форм нет — эти буквы остаются обычными. Заглавные заменяются строчными индексами.",
      ],
      faq: [
        {
          q: "Как написать H₂O или CO₂?",
          a: "Введите H2O — подстрочная строка превратит цифру в индекс, а заглавные H и O станут маленькими ₕ и ₒ. Если буквы должны остаться большими, скопируйте только цифру ₂ и вставьте её между обычными буквами.",
        },
        {
          q: "Почему часть букв не опускается?",
          a: "В Unicode есть подстрочные формы только для 17 латинских букв. Для b, c, d, f, g, q, w, y, z их нет, поэтому генератор оставляет эти буквы как есть.",
        },
      ],
    },
    en: {
      title: "Subscript Generator — Small Text Below the Line",
      h1: "Subscript text generator",
      lead: `Digits and letters below the line ${f("subscript", "123 aeo")} — for chemical formulas like H₂O and indices.`,
      description: `Subscript generator: digits 0–9, + − = ( ) and the 17 Latin letters that have subscript forms become ${f("subscript", "123 aeo")}. Write H₂O and CO₂ right in your messages.`,
      cyrNote: "No. Subscript Cyrillic letters were added only in Unicode 15.0 (2022) and most fonts still lack them, so the generator does not use them: Cyrillic stays plain while digits and 17 Latin letters are lowered.",
      about: [
        "Subscript digits and signs are complete in Unicode (U+2080–U+208E), but only 17 letters exist: a, e, h, i, j, k, l, m, n, o, p, r, s, t, u, v, x. b, c, d, f, g, q, w, y, z have no subscript form and stay plain. Capitals use the small subscripts.",
      ],
      faq: [
        {
          q: "How do I write H₂O or CO₂?",
          a: "Type H2O — the subscript row turns the digit into an index, while capital H and O become the small ₕ and ₒ. To keep full-size letters, copy just ₂ and paste it between regular letters.",
        },
        {
          q: "Why don't some letters go down?",
          a: "Unicode has subscript forms for only 17 Latin letters. b, c, d, f, g, q, w, y, z have none, so the generator leaves them as they are.",
        },
      ],
    },
  },

  circled: {
    ru: {
      title: "Буквы в кружочках онлайн — текст в кругах",
      h1: "Буквы в кружочках",
      lead: `Латинские буквы и цифры в кружках ${f("circled", "Abc 123")} из Unicode — для ников, списков и оформления.`,
      description: `Буквы в кружочках онлайн: латиница и цифры 0–9 превращаются в ${f("circled", "Circle 123")} (U+24B6–U+24EA, U+2460). Для ников и списков; для русских букв — отдельный стиль.`,
      noCyrFaq: true,
      about: [
        `Символы в кружках живут в блоке «Вложенные буквы и цифры» (U+2460–U+24FF): 26 заглавных, 26 строчных, цифры ⓪ и ①–⑨. Они есть практически во всех системных шрифтах. Для кириллицы готовых символов нет — для русских букв используйте стиль «Кружки для любых букв»: ${f("bubble", "Мир")}.`,
      ],
      faq: [
        {
          q: "Как сделать русские буквы в кружочках?",
          a: `Готовых символов для кириллицы в Unicode нет. Стиль «Кружки для любых букв» добавляет к каждой букве комбинируемый кружок U+20DD — получается ${f("bubble", "Привет")}, но вид зависит от шрифта.`,
        },
        {
          q: "Есть ли числа больше 9 в кружках?",
          a: "Да, в Unicode есть ⑩–⑳ и даже ㉑–㊿, но генератор заменяет цифры по одной, чтобы любое число выглядело одинаково: 12 → ①②.",
        },
        {
          q: "Это то же самое, что «пузырчатый текст»?",
          a: "Да, буквы в кружках часто называют пузырчатым текстом (bubble text). Белые кружки — этот стиль, а с заливкой — «В чёрных кружках».",
        },
      ],
    },
    en: {
      title: "Circled Text Generator — Letters in Circles",
      h1: "Circled text generator",
      lead: `Latin letters and digits in circles ${f("circled", "Abc 123")} — for nicknames, lists and decoration.`,
      description: `Circled text generator: Latin letters and digits 0–9 become ${f("circled", "Circle 123")} from Enclosed Alphanumerics (U+2460–U+24FF). Also known as bubble letters.`,
      noCyrFaq: true,
      about: [
        `Circled characters live in the Enclosed Alphanumerics block (U+2460–U+24FF): 26 capitals, 26 small letters, ⓪ and ①–⑨. Practically every system font has them. There are none for Cyrillic — for other alphabets use “Bubble (any letters)”: ${f("bubble", "Мир")}.`,
      ],
      faq: [
        {
          q: "Can I circle Cyrillic or other letters?",
          a: `Unicode has no ready-made circled Cyrillic. The “Bubble (any letters)” style adds a combining circle U+20DD to every letter — ${f("bubble", "Привет")} — but the look depends on the font.`,
        },
        {
          q: "Are there circled numbers above 9?",
          a: "Yes, Unicode has ⑩–⑳ and even ㉑–㊿, but the generator replaces digits one by one so every number looks the same: 12 → ①②.",
        },
        {
          q: "Is this the same as bubble text?",
          a: "Yes, circled letters are often called bubble text. Hollow circles are this style; filled ones are “Black circled”.",
        },
      ],
    },
  },

  "circled-negative": {
    ru: {
      title: "Буквы в чёрных кружках онлайн — белые на тёмном",
      h1: "Буквы в чёрных кружочках",
      lead: `Белые буквы в чёрных кругах ${f("circled-negative", "ABC")} и цифры ${f("circled-negative", "123")} из Unicode — заметный стиль для ников.`,
      description: `Буквы в чёрных кружках: латиница превращается в ${f("circled-negative", "Black")} (U+1F150–U+1F169), цифры — в ${f("circled-negative", "123")} (U+2776–U+277E) и ⓿. Только заглавные.`,
      what: "букв в чёрных кружках",
      about: [
        "Буквы в чёрных кругах есть в Unicode только заглавные (блок «Дополнительные вложенные буквы и цифры», U+1F150–U+1F169), поэтому генератор превращает строчные в заглавные. Цифры взяты из «Дингбатов» ❶–❾ и символа ⓿ (U+24FF).",
      ],
      faq: [
        {
          q: "Почему все буквы стали заглавными?",
          a: `Строчных букв в чёрных кружках в Unicode нет, есть только 26 заглавных ${f("circled-negative", "A")}–${f("circled-negative", "Z")}. Генератор подставляет их для любого регистра.`,
        },
        {
          q: "Покажутся ли символы на всех устройствах?",
          a: "Они есть в системных шрифтах современных телефонов и компьютеров, но в играх и старых приложениях вместо них могут появиться квадратики.",
        },
      ],
    },
    en: {
      title: "Black Circled Letters Generator — Negative Circles",
      h1: "Black circled text generator",
      lead: `White letters on black circles ${f("circled-negative", "ABC")} and digits ${f("circled-negative", "123")} — an eye-catching style for nicknames.`,
      description: `Black circled generator: Latin letters become ${f("circled-negative", "Black")} (U+1F150–U+1F169), digits ${f("circled-negative", "123")} (U+2776–U+277E) plus ⓿. Capitals only — lowercase is converted.`,
      what: "negative circled letters",
      about: [
        "Unicode has only capital letters in black circles (Enclosed Alphanumeric Supplement, U+1F150–U+1F169), so the generator converts lowercase to capitals. Digits come from the Dingbats ❶–❾ and ⓿ (U+24FF).",
      ],
      faq: [
        {
          q: "Why did everything become uppercase?",
          a: `There are no lowercase black circled letters in Unicode, only the 26 capitals ${f("circled-negative", "A")}–${f("circled-negative", "Z")}. The generator uses them for both cases.`,
        },
        {
          q: "Will they show up on every device?",
          a: "Current phone and desktop system fonts include them, but games and older apps may show boxes instead.",
        },
      ],
    },
  },

  bubble: {
    ru: {
      title: "Русские буквы в кружочках — кружки для любого текста",
      h1: "Русские буквы в кружочках",
      lead: `Обводит кружком U+20DD любую букву — русскую, казахскую, латинскую — и цифру: ${f("bubble", "Привет")}.`,
      description: "Русские буквы в кружочках онлайн: к каждой букве и цифре добавляется комбинируемый кружок U+20DD, поэтому работает любой алфавит. Вид зависит от шрифта.",
      about: [
        "В отличие от стиля «В кружках», здесь нет готовых символов: к каждой букве добавляется комбинируемый знак U+20DD COMBINING ENCLOSING CIRCLE, который рисуется вокруг предыдущего символа. Поэтому стиль работает с кириллицей, но его вид сильно зависит от шрифта: где-то кружок ровно обводит букву, а где-то смещён или слишком велик. Пробелы и знаки препинания генератор не обводит.",
      ],
      faq: [
        {
          q: "Чем это отличается от стиля «В кружках»?",
          a: "«В кружках» использует готовые символы вроде Ⓐ и ⓐ — они аккуратнее, но для кириллицы таких символов нет. Этот стиль обводит любой символ комбинируемым кружком, поэтому подходит для русского текста, но выглядит по-разному в разных шрифтах.",
        },
        {
          q: "Почему кружок съехал в сторону?",
          a: "Комбинируемые знаки размещает шрифт. Если в нём нет хорошей поддержки U+20DD, кружок может оказаться рядом с буквой. Попробуйте другое приложение или готовые символы в кружках для латиницы.",
        },
      ],
    },
    en: {
      title: "Bubble Text for Any Alphabet — Enclosing Circles",
      h1: "Bubble text for any alphabet",
      lead: `Wraps any letter or digit in a combining circle U+20DD — Latin, Cyrillic or Greek: ${f("bubble", "Bubble")}.`,
      description: "Bubble text for any script: a combining circle (U+20DD) is added after every letter and digit, so Cyrillic and Greek work too. Looks depend on the font.",
      about: [
        "Unlike the Circled style, there are no ready-made characters here: every letter gets the combining mark U+20DD COMBINING ENCLOSING CIRCLE, drawn around the preceding character. That makes it work for any alphabet, but the look depends heavily on the font — sometimes the circle fits neatly, sometimes it's offset or oversized. Spaces and punctuation are left alone.",
      ],
      faq: [
        {
          q: "How is this different from the Circled style?",
          a: "Circled uses ready-made characters like Ⓐ and ⓐ — neater, but there are none for Cyrillic. This style wraps any character in a combining circle, so it works for other alphabets but looks different from font to font.",
        },
        {
          q: "Why is the circle misaligned?",
          a: "The font positions combining marks. Without good U+20DD support the circle can land next to the letter. Try another app, or use the ready-made circled characters for Latin text.",
        },
      ],
    },
  },

  squared: {
    ru: {
      title: "Буквы в квадратах онлайн — текст в рамках",
      h1: "Буквы в квадратиках",
      lead: `Латинские буквы в квадратных рамках ${f("squared", "ABC")} из Unicode — строгий стиль для ников и заголовков.`,
      description: `Буквы в квадратах онлайн: латиница превращается в ${f("squared", "Square")} из блока U+1F130–U+1F149. Только заглавные, цифр в квадратах нет — для ников, заголовков и оформления.`,
      what: "букв в квадратах",
      about: [
        "Буквы в квадратах находятся в блоке «Дополнительные вложенные буквы и цифры» (U+1F130–U+1F149). В нём только 26 заглавных, поэтому строчные превращаются в заглавные, а цифры остаются обычными: квадратных цифр в Unicode нет.",
      ],
      faq: [
        {
          q: "Почему нет цифр в квадратах?",
          a: "Unicode не содержит набора цифр в квадратах, поэтому генератор оставляет 0–9 без изменений. Для оформленных цифр подойдут стили «В кружках» или «В чёрных кружках».",
        },
        {
          q: "Чем отличаются белые и чёрные квадраты?",
          a: `Белые (${f("squared", "A")}) — буква в рамке, чёрные (${f("squared-negative", "A")}) — белая буква на заливке. Четыре чёрные буквы (A, B, O, P) одновременно являются эмодзи и на некоторых устройствах рисуются цветными значками.`,
        },
      ],
    },
    en: {
      title: "Squared Letters Generator — Text in Boxes",
      h1: "Squared text generator",
      lead: `Latin letters in square frames ${f("squared", "ABC")} from Unicode — a clean boxed style for names and titles.`,
      description: `Squared text generator: Latin letters become boxed ${f("squared", "Square")} from U+1F130–U+1F149. Capitals only, no squared digits — for nicknames, headings and decoration.`,
      what: "squared letters",
      about: [
        "Squared letters live in the Enclosed Alphanumeric Supplement block (U+1F130–U+1F149). It holds only 26 capitals, so lowercase becomes uppercase, and digits stay plain because Unicode has no squared digits.",
      ],
      faq: [
        {
          q: "Why are there no squared digits?",
          a: "Unicode has no set of squared digits, so the generator leaves 0–9 unchanged. For decorated digits use Circled or Black circled.",
        },
        {
          q: "What's the difference between white and black squares?",
          a: `White (${f("squared", "A")}) is a letter in a frame; black (${f("squared-negative", "A")}) is a white letter on a filled square. Four black letters (A, B, O, P) are also emoji and may render as colour icons on some devices.`,
        },
      ],
    },
  },

  "squared-negative": {
    ru: {
      title: "Буквы в чёрных квадратах — текст как на табличках",
      h1: "Буквы в чёрных квадратах",
      lead: `Белые буквы на чёрных квадратах ${f("squared-negative", "ABC")} из Unicode — выглядят как таблички или клавиши.`,
      description: `Буквы в чёрных квадратах онлайн: латиница превращается в ${f("squared-negative", "Black")} из блока U+1F170–U+1F189. Только заглавные; A, B, O, P — ещё и эмодзи и бывают цветными.`,
      what: "букв в чёрных квадратах",
      about: [
        `Чёрные квадраты с буквами — блок U+1F170–U+1F189, только заглавные. Четыре из них — ${f("squared-negative", "ABOP")} — входят в набор эмодзи (группы крови и знак парковки), поэтому на некоторых устройствах выглядят как цветные значки и выбиваются из строки.`,
      ],
      faq: [
        {
          q: "Почему буквы A, B, O, P выглядят как эмодзи?",
          a: "Символы U+1F170, U+1F171, U+1F17E и U+1F17F одновременно являются эмодзи (группы крови и знак парковки). Некоторые системы рисуют их цветными, даже если остальные буквы чёрно-белые.",
        },
        {
          q: "Можно ли так написать цифры?",
          a: `Нет, цифр в чёрных квадратах в Unicode нет — они останутся обычными. Если нужны тёмные цифры, возьмите стиль «В чёрных кружках»: ${f("circled-negative", "123")}.`,
        },
      ],
    },
    en: {
      title: "Black Squared Letters Generator — Negative Squares",
      h1: "Black squared text generator",
      lead: `White letters on black squares ${f("squared-negative", "ABC")} — they look like signs or keyboard keys.`,
      description: `Black squared generator: Latin letters become ${f("squared-negative", "Black")} from U+1F170–U+1F189. Capitals only; A, B, O and P are also emoji and may show in colour on some devices.`,
      what: "negative squared letters",
      about: [
        `Black squared letters occupy U+1F170–U+1F189, capitals only. Four of them — ${f("squared-negative", "ABOP")} — are also emoji (blood types and the parking sign), so some devices draw them as colour icons that stand out from the line.`,
      ],
      faq: [
        {
          q: "Why do A, B, O and P look like emoji?",
          a: "U+1F170, U+1F171, U+1F17E and U+1F17F are also emoji (blood types and parking). Some systems render them in colour even when the other letters stay black and white.",
        },
        {
          q: "Can I write digits this way?",
          a: `No, Unicode has no digits in black squares, so they stay plain. For dark digits use Black circled: ${f("circled-negative", "123")}.`,
        },
      ],
    },
  },

  parenthesized: {
    ru: {
      title: "Буквы в скобках онлайн — символы для списков",
      h1: "Буквы и цифры в скобках",
      lead: `Готовые символы ${f("parenthesized", "abc")} и ${f("parenthesized", "123")}: буква или цифра в скобках занимает одно место — удобно для списков.`,
      description: `Буквы в скобках онлайн: строчные превращаются в ${f("parenthesized", "abc")} (U+249C–U+24B5), заглавные — в ${f("parenthesized", "ABC")} (U+1F110), цифры 1–9 — в ${f("parenthesized", "123")}. Ноля в скобках в Unicode нет.`,
      what: "букв в скобках",
      about: [
        `Буква в скобках здесь — один символ, а не три: ${f("parenthesized", "a")} (U+249C) — это «(a)», слитое в один знак. Такие символы пришли из старых восточноазиатских кодировок и удобны для нумерации пунктов. Строчные и цифры находятся в блоке U+2460–U+24FF, заглавные — в U+1F110–U+1F129; ноля в скобках нет, он остаётся обычным.`,
      ],
      faq: [
        {
          q: "Зачем нужны буквы в скобках одним символом?",
          a: "Чтобы пункт списка не разрывался при переносе строки и занимал одно место. В соцсетях их используют и просто как украшение.",
        },
        {
          q: "Почему 0 не в скобках?",
          a: "В Unicode есть ⑴–⒇ (от 1 до 20 в скобках), но нет ноля в скобках. Генератор оставляет 0 обычным.",
        },
      ],
    },
    en: {
      title: "Parenthesized Text Generator — Letters in Brackets",
      h1: "Parenthesized text generator",
      lead: `Single characters like ${f("parenthesized", "abc")} and ${f("parenthesized", "123")} — a letter or digit in parentheses that takes one slot, handy for lists.`,
      description: `Parenthesized generator: small letters become ${f("parenthesized", "abc")} (U+249C–U+24B5), capitals ${f("parenthesized", "ABC")} (U+1F110–U+1F129), digits 1–9 ${f("parenthesized", "123")}. There is no parenthesized zero.`,
      what: "parenthesized letters",
      about: [
        `Each letter in parentheses is one character, not three: ${f("parenthesized", "a")} (U+249C) is “(a)” fused into a single sign. They come from legacy East Asian encodings and are handy for numbering items. Small letters and digits live in U+2460–U+24FF, capitals in U+1F110–U+1F129; there's no parenthesized zero, so 0 stays plain.`,
      ],
      faq: [
        {
          q: "Why use a letter in parentheses as one character?",
          a: "So a list marker never breaks across lines and takes a single slot. On social media they're also used simply as decoration.",
        },
        {
          q: "Why isn't 0 in parentheses?",
          a: "Unicode has ⑴–⒇ (1 to 20 in parentheses) but no parenthesized zero, so the generator leaves 0 as is.",
        },
      ],
    },
  },

  fullwidth: {
    ru: {
      title: "Широкий шрифт онлайн — текст в стиле вейпорвейв",
      h1: "Широкий текст в стиле вейпорвейв",
      lead: `Полноширинные символы ${f("fullwidth", "ABC")} из Unicode — растянутый «эстетичный» текст в стиле вейпорвейв.`,
      description: `Широкий шрифт онлайн: латиница, цифры и знаки превращаются в полноширинные ${f("fullwidth", "Wide 123")} (U+FF01–U+FF5E), пробел — в U+3000. Эстетика вейпорвейв для ников и постов.`,
      what: "широких (полноширинных) букв",
      about: [
        "Полноширинные формы созданы для японского, китайского и корейского текста, где латинская буква должна занимать столько же места, сколько иероглиф. Блок U+FF01–U+FF5E повторяет все видимые символы ASCII, а пробел заменяется идеографическим U+3000. Для кириллицы полноширинных форм нет.",
      ],
      faq: [
        {
          q: "Что такое вейпорвейв-текст?",
          a: `Это стиль интернет-эстетики 2010-х: растянутые полноширинные буквы (${f("fullwidth", "aesthetic")}), часто вместе с японскими словами и ретро-картинками.`,
        },
        {
          q: "Можно ли просто поставить пробелы между буквами?",
          a: "Можно, но результат другой: «т е к с т» разрывается при переносе строки, а полноширинные символы остаются словом и выглядят ровнее. Для русского текста пробелы между буквами — единственный вариант.",
        },
      ],
    },
    en: {
      title: "Vaporwave Text Generator — Fullwidth Aesthetic Font",
      h1: "Vaporwave fullwidth text generator",
      lead: `Fullwidth Unicode characters ${f("fullwidth", "ABC")} — the stretched ${f("fullwidth", "aesthetic")} vaporwave look.`,
      description: `Vaporwave text generator: letters, digits and punctuation become fullwidth ${f("fullwidth", "Wide 123")} (U+FF01–U+FF5E), and spaces turn into U+3000. The aesthetic look for posts.`,
      what: "fullwidth letters",
      about: [
        "Fullwidth forms exist for Japanese, Chinese and Korean text, where a Latin letter has to take as much room as an ideograph. The block U+FF01–U+FF5E mirrors every visible ASCII character, and the space becomes the ideographic space U+3000. There are no fullwidth forms for Cyrillic.",
      ],
      faq: [
        {
          q: "What is vaporwave text?",
          a: `A 2010s internet aesthetic: stretched fullwidth letters (${f("fullwidth", "aesthetic")}), often paired with Japanese words and retro images.`,
        },
        {
          q: "Can't I just put spaces between letters?",
          a: "You can, but it's not the same: “t e x t” breaks across lines, while fullwidth characters stay one word and look more even.",
        },
      ],
    },
  },

  "upside-down": {
    ru: {
      title: "Перевёрнутый текст онлайн — вверх ногами",
      h1: "Перевёрнутый текст онлайн",
      lead: "Переворачивает текст на 180°: буквы заменяются похожими символами ɐ, ǝ, ʇ, а порядок — задом наперёд. Работает и с частью русских букв.",
      description: `Перевёрнутый текст онлайн: буквы заменяются похожими символами, порядок меняется — Hello → ${f("upside-down", "Hello")}, Привет → ${f("upside-down", "Привет")}. Латиница полностью, кириллица частично.`,
      cyrNote:
        "Частично. Для а, г, е, з, к, м, п, р, с, т, у, ч, ш, э, і и заглавных А, В, Г, Е, З, К, Л, М, П, Р, С, Т, У, Ч, Э подобраны перевёрнутые двойники; о, х, ж, и, н, ф при повороте выглядят так же. У б, в, д, й, л, ц, щ, ъ, ы, ь, ю, я хороших двойников нет — они остаются как есть, но меняют место.",
      about: [
        "Отдельного перевёрнутого алфавита в Unicode нет, поэтому генератор подбирает похожие символы из разных блоков: фонетические ɐ, ǝ, ɥ, ʇ, ʎ, математические ∀ и ⊥, буквы-двойники из других письменностей. Затем порядок символов меняется на обратный, чтобы текст читался «вверх ногами». Эмодзи не переворачиваются, но сохраняются целыми.",
      ],
      faq: [
        {
          q: "Как перевернуть текст вверх ногами?",
          a: "Напишите текст в поле выше — перевёрнутая строка появится сразу. Скопируйте её и вставьте в сообщение: символы остаются перевёрнутыми в любом приложении.",
        },
        {
          q: "Можно ли перевернуть текст обратно?",
          a: "Для латиницы — да: вставьте перевёрнутый текст в поле, и генератор снова развернёт его, потому что таблица замен обратима. Для кириллицы обратное преобразование работает не для всех букв.",
        },
      ],
    },
    en: {
      title: "Upside Down Text Generator — Flip Your Text",
      h1: "Upside down text generator",
      lead: "Flips text 180°: letters become look-alikes such as ɐ, ǝ and ʇ, and the order is reversed.",
      description: `Upside down text generator: letters swap for turned look-alikes and the order reverses — Hello → ${f("upside-down", "Hello")}. All Latin letters and digits, plus some Cyrillic.`,
      cyrNote:
        "Partly. а, г, е, з, к, м, п, р, с, т, у, ч, ш, э, і and capitals А, В, Г, Е, З, К, Л, М, П, Р, С, Т, У, Ч, Э have turned look-alikes; о, х, ж, и, н, ф look the same when turned. б, в, д, й, л, ц, щ, ъ, ы, ь, ю, я have no good look-alikes — they stay as they are but still change position.",
      about: [
        "Unicode has no dedicated upside-down alphabet, so the generator picks look-alikes from several blocks: phonetic ɐ, ǝ, ɥ, ʇ, ʎ, mathematical ∀ and ⊥, and twin letters from other scripts. Then the character order is reversed so the text reads upside down. Emoji aren't flipped but stay intact.",
      ],
      faq: [
        {
          q: "How do I turn text upside down?",
          a: "Type in the box above — the flipped line appears instantly. Copy it and paste it anywhere; the characters stay upside down in every app.",
        },
        {
          q: "Can I flip it back?",
          a: "For Latin text, yes: paste the flipped text into the box and the generator turns it back, because the substitution table is reversible.",
        },
      ],
    },
  },

  mirror: {
    ru: {
      title: "Зеркальный текст онлайн — отражённые буквы",
      h1: "Зеркальный текст онлайн",
      lead: "Отражает текст по горизонтали: строка идёт справа налево, а буквы заменяются зеркальными двойниками Я, И, Ǝ, ɘ.",
      description: "Зеркальный текст онлайн: строка переворачивается справа налево, а буквы с зеркальными двойниками меняются — R → Я, N → И, Я → R. Кириллица — частично.",
      cyrNote:
        "Частично. Я, И, Е, С, З, Э, Р (заглавные и строчные) и заглавные Г и К заменяются зеркальными двойниками (R, N, Ǝ, Ɔ, Ɛ, Є…), а симметричные А, Д, Ж, Н, О, П, Т, Ф, Х, Ш и так выглядят одинаково. Остальные буквы (Б, В, Ч, Ь, Ю…) не отражаются — подходящих символов для них нет.",
      about: [
        "Зеркального алфавита в Unicode нет, поэтому генератор делает две вещи: переставляет символы каждой строки в обратном порядке и заменяет буквы, у которых есть зеркальные двойники. Для латиницы это b ↔ d, p ↔ q, E → Ǝ, R → Я, N → И и другие; скобки и косые черты тоже разворачиваются. Симметричные буквы вроде A, H, O, T, V, W, X остаются как есть.",
      ],
      faq: [
        {
          q: "Чем зеркальный текст отличается от перевёрнутого?",
          a: "Зеркальный отражается слева направо — строки остаются на месте, меняется направление. Перевёрнутый поворачивается на 180°: буквы ещё и встают вверх ногами, а строки меняются местами.",
        },
        {
          q: "Прочитается ли текст в зеркале?",
          a: "Примерно: симметричные и отражённые буквы будут выглядеть правильно, но у части букв нет зеркальных двойников, поэтому в зеркале они окажутся развёрнутыми.",
        },
      ],
    },
    en: {
      title: "Mirror Text Generator — Reversed, Mirrored Letters",
      h1: "Mirror text generator",
      lead: "Mirrors text horizontally: each line runs right to left and letters swap for mirrored look-alikes like Я, И, Ǝ and ɘ.",
      description: "Mirror text generator: every line is reversed and letters with mirrored twins are swapped — R → Я, N → И, E → Ǝ, b ↔ d. Symmetric letters stay as they are.",
      cyrNote:
        "Partly. Я, И, Е, С, З, Э, Р (both cases) and capitals Г and К get mirrored look-alikes (R, N, Ǝ, Ɔ, Ɛ, Є…), while symmetric А, Д, Ж, Н, О, П, Т, Ф, Х, Ш look the same anyway. Other letters (Б, В, Ч, Ь, Ю…) aren't mirrored — there are no suitable characters.",
      about: [
        "Unicode has no mirrored alphabet, so the generator does two things: it reverses the characters of each line and swaps letters that have mirrored twins — b ↔ d, p ↔ q, E → Ǝ, R → Я, N → И and more; brackets and slashes turn around too. Symmetric letters such as A, H, O, T, V, W, X stay as they are.",
      ],
      faq: [
        {
          q: "How is mirror text different from upside-down text?",
          a: "Mirror text is flipped left to right: lines stay in place and only the direction changes. Upside-down text is rotated 180°: letters also turn over and the line order reverses.",
        },
        {
          q: "Will it read correctly in a mirror?",
          a: "Roughly: symmetric and mirrored letters will look right, but some letters have no mirrored twin, so they'll appear reversed in the mirror.",
        },
      ],
    },
  },

  strikethrough: {
    ru: {
      title: "Зачёркнутый текст онлайн — для ВК, Инстаграма и ников",
      h1: "Зачёркнутый текст онлайн",
      lead: "Добавляет к каждому символу линию U+0336 — зачёркивание работает с русскими буквами и вставляется туда, где его нет.",
      description: `Зачёркнутый текст онлайн: после каждого символа добавляется знак U+0336: ${f("strikethrough", "текст")}. Работает с кириллицей — для ВК, Инстаграма и ников.`,
      about: [
        "Зачёркивание получается из комбинируемого знака U+0336 COMBINING LONG STROKE OVERLAY: он рисуется поверх предыдущего символа. Генератор добавляет его к каждой букве, цифре и пробелу, чтобы линия была сплошной, и не трогает эмодзи. Поэтому стиль работает с русским, казахским и любым другим алфавитом.",
      ],
      faq: [
        {
          q: "Как сделать зачёркнутый текст в ВК?",
          a: "В обычных постах и комментариях ВКонтакте кнопки зачёркивания нет. Напишите текст выше, скопируйте строку «Зачёркнутый» и вставьте — линия сохранится, потому что она часть символов.",
        },
        {
          q: "Почему текст стал длиннее?",
          a: "Каждая буква теперь состоит из двух символов: самой буквы и линии. Поэтому зачёркнутый текст занимает вдвое больше места в лимитах знаков, например в X или в описании профиля.",
        },
        {
          q: "В каких мессенджерах зачёркивание есть и так?",
          a: "В Telegram (через меню форматирования), в WhatsApp (~текст~) и в Discord (~~текст~~). Там встроенное зачёркивание удобнее: оно не увеличивает длину текста и не мешает поиску.",
        },
      ],
    },
    en: {
      title: "Strikethrough Text Generator — Cross Out Text",
      h1: "Strikethrough text generator",
      lead: "Adds a U+0336 line to every character — strikethrough that works with any alphabet and pastes anywhere.",
      description: `Strikethrough text generator: a combining long stroke (U+0336) goes after every character: ${f("strikethrough", "text")}. Works in any language — for bios, posts and names.`,
      about: [
        "Strikethrough comes from the combining mark U+0336 COMBINING LONG STROKE OVERLAY, drawn over the preceding character. The generator adds it after every letter, digit and space so the line is continuous, and leaves emoji untouched. That's why it works with any alphabet.",
      ],
      faq: [
        {
          q: "How do I cross out text where there's no button?",
          a: "Type your text above, copy the Strikethrough row and paste it — the line survives because it's part of the characters.",
        },
        {
          q: "Why is the text longer now?",
          a: "Every letter is now two characters: the letter and the line. Struck text takes twice as much of a character limit, for example on X or in a profile bio.",
        },
        {
          q: "Which apps already have strikethrough?",
          a: "Telegram (formatting menu), WhatsApp (~text~) and Discord (~~text~~). Built-in strikethrough is better there: it doesn't add length and doesn't break search.",
        },
      ],
    },
  },

  "slash-through": {
    ru: {
      title: "Текст, зачёркнутый косой чертой — генератор",
      h1: "Зачёркнутый косой чертой текст",
      lead: `Перечёркивает каждую букву косой линией U+0338: ${f("slash-through", "текст")} — для иронии, «отменённых» слов и ников.`,
      description: `Зачёркнутый косой чертой текст: к каждой букве добавляется знак U+0338, получается ${f("slash-through", "текст")}. Работает с кириллицей и цифрами, пробелы не перечёркиваются.`,
      about: [
        "Знак U+0338 COMBINING LONG SOLIDUS OVERLAY в математике превращает = в ≠, а в тексте перечёркивает любую букву наискось. В отличие от обычного зачёркивания, генератор не ставит его на пробелы, поэтому каждая буква перечёркнута отдельно.",
      ],
      faq: [
        {
          q: "Чем это отличается от обычного зачёркнутого текста?",
          a: "Обычное зачёркивание (U+0336) — сплошная горизонтальная линия через всю строку. Здесь каждая буква перечёркнута косой чертой отдельно, а пробелы остаются чистыми.",
        },
        {
          q: "Почему в некоторых приложениях черта съезжает?",
          a: "Положение комбинируемого знака определяет шрифт. В большинстве шрифтов черта проходит через центр буквы, но в некоторых может быть сдвинута или короче.",
        },
      ],
    },
    en: {
      title: "Slash Through Text Generator — Slashed Letters",
      h1: "Slash-through text generator",
      lead: `Crosses every letter with a slash U+0338: ${f("slash-through", "text")} — for irony, “cancelled” words and names.`,
      description: `Slash-through generator: a combining long solidus (U+0338) is added to each letter, giving ${f("slash-through", "text")}. Works with any alphabet and digits; spaces stay clean.`,
      about: [
        "U+0338 COMBINING LONG SOLIDUS OVERLAY is what turns = into ≠ in maths; in text it slashes through any letter. Unlike regular strikethrough, the generator doesn't put it on spaces, so each letter is crossed separately.",
      ],
      faq: [
        {
          q: "How is this different from strikethrough?",
          a: "Regular strikethrough (U+0336) is one continuous horizontal line. Here every letter gets its own diagonal slash and spaces stay clean.",
        },
        {
          q: "Why is the slash off-centre in some apps?",
          a: "The font positions combining marks. Most fonts run the slash through the middle of the letter, but some shift or shorten it.",
        },
      ],
    },
  },

  underline: {
    ru: {
      title: "Подчёркнутый текст онлайн — для Инстаграма и WhatsApp",
      h1: "Подчёркнутый текст онлайн",
      lead: "Добавляет линию снизу U+0332 к каждому символу — подчёркивание для любого алфавита там, где его нет.",
      description: "Подчёркнутый текст онлайн: к каждому символу добавляется знак U+0332, линия идёт сплошной. Работает с кириллицей — для Инстаграма, WhatsApp и ВК.",
      about: [
        "Подчёркивания нет во встроенном форматировании Инстаграма, ВК, X и WhatsApp. Генератор добавляет к каждому символу знак U+0332 COMBINING LOW LINE, и линия сохраняется при копировании в любое поле. В Discord и Telegram подчёркивание есть и так: __текст__ и Ctrl+U соответственно.",
      ],
      faq: [
        {
          q: "Как подчеркнуть текст в WhatsApp?",
          a: "Встроенного подчёркивания в WhatsApp нет — есть только *жирный*, _курсив_, ~зачёркнутый~ и моноширинный. Скопируйте подчёркнутую строку отсюда: линия — часть символов, она сохранится.",
        },
        {
          q: "Почему линия прерывается?",
          a: "В некоторых шрифтах линии соседних букв не смыкаются, особенно у букв с хвостиками (р, у, g). Попробуйте двойное подчёркивание — оно заметнее.",
        },
      ],
    },
    en: {
      title: "Underline Text Generator — Underlined Unicode Text",
      h1: "Underline text generator",
      lead: "Adds a low line U+0332 under every character — underlining for any alphabet where apps have none.",
      description: "Underline text generator: a combining low line (U+0332) follows every character, spaces included. Works in any language — for bios, posts and chats.",
      about: [
        "Instagram, VK, X and WhatsApp offer no underline. The generator adds U+0332 COMBINING LOW LINE after every character, so the line survives copying into any field. Discord and Telegram already have underline: __text__ and Ctrl+U respectively.",
      ],
      faq: [
        {
          q: "How do I underline text in WhatsApp?",
          a: "WhatsApp has no underline — only *bold*, _italic_, ~strikethrough~ and monospace. Copy the underlined row from here: the line is part of the characters, so it stays.",
        },
        {
          q: "Why is the line broken?",
          a: "In some fonts the lines of neighbouring letters don't join, especially under letters with descenders (g, p, y). Try double underline — it's more visible.",
        },
      ],
    },
  },

  "double-underline": {
    ru: {
      title: "Двойное подчёркивание текста онлайн — генератор",
      h1: "Текст с двойным подчёркиванием",
      lead: "Две линии под каждым символом (знак U+0333) — заметное подчёркивание для любого алфавита.",
      description: `Двойное подчёркивание онлайн: к каждой букве, цифре и пробелу добавляется знак U+0333, получается ${f("double-underline", "текст")}. Работает с кириллицей, копируется в любое поле.`,
      about: [
        "Двойная линия — это знак U+0333 COMBINING DOUBLE LOW LINE. Как и одинарная, она ставится после каждого символа, включая пробелы, поэтому под всей фразой получается сплошная линия. Эмодзи генератор не подчёркивает, чтобы не сломать их.",
      ],
      faq: [
        {
          q: "Когда лучше двойное подчёркивание?",
          a: "Когда одинарная линия теряется на фоне или прерывается у букв с хвостиками. Двойная заметнее и хорошо подходит для заголовков в описаниях.",
        },
        {
          q: "Можно ли совместить с жирным шрифтом?",
          a: "Да: сначала сделайте жирный текст, затем вставьте результат в поле и скопируйте строку «Двойное подчёркивание». Для латиницы получится жирный подчёркнутый текст.",
        },
      ],
    },
    en: {
      title: "Double Underline Text Generator — Copy and Paste",
      h1: "Double underline text generator",
      lead: "Two lines under every character (U+0333) — a bolder underline that works with any alphabet.",
      description: `Double underline generator: the combining double low line (U+0333) goes after every character: ${f("double-underline", "text")}. Works with any alphabet and pastes anywhere.`,
      about: [
        "The double line is U+0333 COMBINING DOUBLE LOW LINE. Like the single one it goes after every character, spaces included, so a continuous line runs under the whole phrase. Emoji are skipped so they don't break.",
      ],
      faq: [
        {
          q: "When is a double underline better?",
          a: "When a single line gets lost on the background or breaks under letters with descenders. The double line is more visible and suits headings in bios.",
        },
        {
          q: "Can I combine it with bold?",
          a: "Yes: make the text bold first, paste the result into the box and copy the Double underline row. Latin text becomes bold and underlined.",
        },
      ],
    },
  },

  overline: {
    ru: {
      title: "Текст с чертой сверху онлайн — надчёркивание",
      h1: "Текст с чертой сверху",
      lead: "Проводит линию над каждым символом (знак U+0305) — надчёркивание для любого алфавита и цифр.",
      description: `Текст с чертой сверху: к каждому символу добавляется знак U+0305, и линия идёт над всей фразой: ${f("overline", "текст")}. Подходит для кириллицы и обозначений вроде X̅.`,
      about: [
        "Черта сверху встречается в математике (среднее значение x̅, отрицание в логике) и в римских цифрах, где V̅ означает 5000. Генератор ставит знак U+0305 COMBINING OVERLINE после каждого символа, включая пробелы, поэтому линия получается сплошной.",
      ],
      faq: [
        {
          q: "Как написать среднее значение x̅?",
          a: "Введите x в поле и скопируйте строку «Черта сверху» — получится x с комбинируемой чертой U+0305. Для одной буквы можно также использовать макрон U+0304 (x̄), он чуть короче.",
        },
        {
          q: "Работают ли римские цифры с чертой?",
          a: "Да: введите V или X — получится V̅ или X̅, как в записи тысяч римскими цифрами. Положение черты зависит от шрифта.",
        },
      ],
    },
    en: {
      title: "Overline Text Generator — Line Above Text",
      h1: "Overline text generator",
      lead: "Draws a line above every character (U+0305) — overlining for any alphabet and digits.",
      description: `Overline generator: the combining overline (U+0305) goes after every character, so a line runs above the phrase: ${f("overline", "text")}. Any alphabet, plus notation like X̅.`,
      about: [
        "Overlines appear in maths (the mean x̅, negation in logic) and in Roman numerals, where V̅ means 5,000. The generator adds U+0305 COMBINING OVERLINE after every character, spaces included, so the line is continuous.",
      ],
      faq: [
        {
          q: "How do I write the mean x̅?",
          a: "Type x in the box and copy the Overline row — you get x with the combining overline U+0305. For a single letter the macron U+0304 (x̄) also works; it's slightly shorter.",
        },
        {
          q: "Does it work for Roman numerals?",
          a: "Yes: type V or X to get V̅ or X̅, as in writing thousands in Roman numerals. The exact position of the line depends on the font.",
        },
      ],
    },
  },

  zalgo: {
    ru: {
      title: "Залго-текст онлайн — генератор «проклятого» текста",
      h1: "Генератор залго-текста",
      lead: "Накладывает на каждую букву десятки диакритических знаков сверху и снизу — жуткий «проклятый» текст трёх уровней силы.",
      description: "Залго-текст онлайн: к каждой букве добавляются случайные знаки U+0300–U+036F сверху, по центру и снизу. Три уровня силы, кнопка «заново», работает с кириллицей.",
      about: [
        "Залго — интернет-мем о существе, от которого «разваливается» текст. Эффект строится на комбинируемых диакритических знаках (U+0300–U+036F): их можно поставить на одну букву сколько угодно, и они громоздятся друг на друга. Слабый уровень добавляет на букву от 2 до 4 знаков, средний — от 4 до 11, сильный — от 13 до 26.",
      ],
      faq: [
        {
          q: "Не сломает ли залго чат?",
          a: "Сильный залго выходит за пределы строки и перекрывает соседние сообщения, поэтому некоторые площадки обрезают такие знаки или ограничивают их количество. Для ников и коротких фраз лучше слабый или средний уровень.",
        },
        {
          q: "Почему результат меняется?",
          a: "Знаки выбираются случайно. Кнопка «Сгенерировать заново» создаёт новый вариант с помощью криптографического генератора случайных чисел браузера; сам текст остаётся тем же, меняются только знаки.",
        },
      ],
    },
    en: {
      title: "Zalgo Text Generator — Creepy Glitch Text",
      h1: "Zalgo text generator",
      lead: "Stacks combining marks above and below every letter — creepy “cursed” text in three intensities.",
      description: "Zalgo text generator: random combining marks from U+0300–U+036F pile up above and below every letter. Three intensities, a regenerate button, any alphabet.",
      about: [
        "Zalgo is an internet meme about a creature that makes text fall apart. The effect relies on combining diacritical marks (U+0300–U+036F): any number of them can sit on one letter, stacking on top of each other. Light adds 2 to 4 marks per letter, medium 4 to 11, heavy 13 to 26.",
      ],
      faq: [
        {
          q: "Will zalgo break a chat?",
          a: "Heavy zalgo spills beyond its line and covers neighbouring messages, so some platforms strip or limit these marks. For nicknames and short phrases light or medium works better.",
        },
        {
          q: "Why does the result change?",
          a: "The marks are picked at random. The Regenerate button makes a new variant using the browser's cryptographic random number generator; the text stays the same, only the marks change.",
        },
      ],
    },
  },

  glitch: {
    ru: {
      title: "Глитч-текст онлайн — эффект сбоя для ников",
      h1: "Глитч-текст онлайн",
      lead: "Эффект «сломанного» текста: поверх части букв появляются штрихи и косые линии, как при сбое экрана.",
      description: "Глитч-текст онлайн: поверх случайных букв ставятся штрихи и косые черты (U+0334–U+0338, U+20D2), иногда знаки сверху и снизу. Работает с кириллицей и цифрами.",
      about: [
        "Глитч спокойнее залго: перечёркивающий штрих — тильду, короткую или длинную черту, косую линию — получают примерно три буквы из пяти, а знаки сверху и снизу — лишь некоторые. Текст выглядит повреждённым, но остаётся читаемым и почти не выходит за пределы строки.",
      ],
      faq: [
        {
          q: "Чем глитч отличается от залго?",
          a: "Залго нагромождает знаки сверху и снизу каждой буквы, и текст «течёт» за пределы строки. Глитч в основном перечёркивает буквы штрихами, поэтому остаётся компактным и читаемым.",
        },
        {
          q: "Можно ли получить другой вариант?",
          a: "Да, нажмите «Сгенерировать заново»: знаки выберутся заново случайным образом, текст останется прежним.",
        },
      ],
    },
    en: {
      title: "Glitch Text Generator — Corrupted Text Effect",
      h1: "Glitch text generator",
      lead: "A “corrupted” text effect: strokes, slashes and bars appear over some letters, like a screen glitch.",
      description: "Glitch text generator: random letters get overlay strokes and slashes (U+0334–U+0338, U+20D2) and a few marks above or below. Works with any alphabet.",
      about: [
        "Glitch is calmer than zalgo: about three letters in five get an overlay — a tilde, a short or long stroke, a slash — and only a few get marks above or below. The text looks damaged but stays readable and barely leaves its line.",
      ],
      faq: [
        {
          q: "How is glitch different from zalgo?",
          a: "Zalgo piles marks above and below every letter until the text spills out of its line. Glitch mostly strikes letters with overlays, so it stays compact and readable.",
        },
        {
          q: "Can I get another variant?",
          a: "Yes, press Regenerate: the marks are picked again at random while the text stays the same.",
        },
      ],
    },
  },
};
