import type { ToolDef, VariantDef } from "@/registry/types";
import { convertCase, type CaseId } from "../lib/case";
import { FAQ, facts, L, LL } from "./util";

interface CasePage {
  slug: string;
  id: CaseId;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  example: [string, string];
  use: [string, string];
  faq: { ru: [string, string][]; en: [string, string][] };
  keywords: [string[], string[]];
}

const PAGES: CasePage[] = [
  {
    slug: "uppercase",
    id: "upper",
    name: ["ВСЕ ЗАГЛАВНЫЕ", "UPPERCASE"],
    title: ["Сделать все буквы заглавными онлайн — ВЕРХНИЙ РЕГИСТР", "Uppercase converter — make text ALL CAPS online"],
    h1: ["Перевести текст в заглавные буквы", "Convert text to uppercase"],
    description: [
      "Переведите текст в верхний регистр: все буквы станут заглавными, включая ё и казахские Ә, Ғ, Қ, Ң. Цифры и знаки не меняются, результат можно скопировать.",
      "Convert any text to uppercase: every letter becomes a capital, including accented and Cyrillic letters. Digits and punctuation stay as they are.",
    ],
    lead: ["Вставьте текст — все буквы сразу станут ПРОПИСНЫМИ.", "Paste your text — every letter becomes a CAPITAL instantly."],
    example: ["привет, мир и ёлка", "hello, world"],
    use: ["Заголовки, аббревиатуры, надписи на табличках и в документах, где нужен капс.", "Headings, acronyms, signs and forms that require capital letters."],
    faq: {
      ru: [
        ["Как сделать все буквы заглавными без Caps Lock?", "Вставьте текст в поле — он сразу перепишется прописными буквами. Скопируйте результат кнопкой «Копировать»."],
        ["Работает ли с буквой ё и казахскими буквами?", "Да: ё → Ё, ә → Ә, қ → Қ, і → І. Регистр меняется по правилам Юникода для любого алфавита."],
      ],
      en: [
        ["How do I make everything uppercase without Caps Lock?", "Paste the text into the box — it’s rewritten in capitals at once. Copy the result with the Copy button."],
        ["Does it work with accented and non-Latin letters?", "Yes: é → É, ß → SS, я → Я. Case is changed by Unicode rules for any alphabet."],
      ],
    },
    keywords: [["капс", "прописные буквы", "верхний регистр", "большие буквы"], ["all caps", "capital letters", "upper case"]],
  },
  {
    slug: "lowercase",
    id: "lower",
    name: ["все строчные", "lowercase"],
    title: ["Сделать все буквы строчными онлайн — нижний регистр", "Lowercase converter — make text lowercase online"],
    h1: ["Перевести текст в строчные буквы", "Convert text to lowercase"],
    description: [
      "Переведите текст в нижний регистр: все заглавные буквы станут строчными. Удобно, если текст набран капсом — исправьте его за секунду и скопируйте результат.",
      "Convert text to lowercase: every capital letter becomes small. Handy when a text was typed with Caps Lock — fix it in a second and copy the result.",
    ],
    lead: ["Вставьте текст — все буквы сразу станут строчными.", "Paste your text — every letter becomes lowercase instantly."],
    example: ["ТЕКСТ, НАБРАННЫЙ КАПСОМ", "TEXT TYPED IN CAPS"],
    use: ["Исправление текста, набранного капсом, подготовка e-mail адресов, тегов и ключевых слов.", "Fixing text typed in caps, preparing e-mail addresses, tags and keywords."],
    faq: {
      ru: [
        ["Как убрать капс из текста?", "Вставьте текст — все буквы станут строчными. Если нужно, чтобы предложения начинались с заглавной, выберите «Как в предложении»."],
        ["Изменятся ли цифры и знаки?", "Нет, меняется только регистр букв."],
      ],
      en: [
        ["How do I remove all caps from a text?", "Paste it — every letter becomes lowercase. If sentences should start with a capital, choose “Sentence case”."],
        ["Are digits and symbols changed?", "No, only the case of letters changes."],
      ],
    },
    keywords: [["строчные буквы", "маленькие буквы", "нижний регистр", "убрать капс"], ["lower case", "small letters", "remove caps"]],
  },
  {
    slug: "title-case",
    id: "title",
    name: ["Каждое Слово С Заглавной", "Title Case"],
    title: ["Каждое слово с заглавной буквы онлайн — Title Case", "Title Case converter — capitalize each word online"],
    h1: ["Каждое слово с заглавной буквы", "Title Case converter"],
    description: [
      "Сделайте первую букву каждого слова заглавной. Аббревиатуры вроде NASA и США остаются как есть, для английских заголовков можно оставить строчными the, of, and.",
      "Capitalize the first letter of every word. Acronyms like NASA stay intact, and small words such as the, of and and can stay lowercase in English titles.",
    ],
    lead: ["Каждое слово начнётся с заглавной буквы, аббревиатуры не пострадают.", "Every word starts with a capital; acronyms are preserved."],
    example: ["новости NASA и США за неделю", "the lord of the rings"],
    use: ["Названия книг, фильмов и статей на английском, имена и названия, заголовки в презентациях.", "Titles of books, films and articles, names, presentation headings."],
    faq: {
      ru: [
        ["Сохранятся ли аббревиатуры?", "Да. Короткие слова, написанные заглавными (NASA, США, HTML), остаются как есть. Если весь текст набран капсом, он считается обычным текстом и приводится к виду «Каждое Слово»."],
        ["Нужно ли в русских заголовках писать каждое слово с заглавной?", "Нет, по правилам русского языка с заглавной пишется только первое слово и имена собственные. Вариант «Каждое Слово С Заглавной» нужен для английских заголовков, названий и оформления."],
        ["Что делает опция для предлогов и артиклей?", "В английских заголовках по стилям AP и Chicago артикли и короткие предлоги (a, the, of, in, on, and…) пишутся строчными, кроме первого и последнего слова."],
      ],
      en: [
        ["Are acronyms preserved?", "Yes. Short words written in capitals (NASA, USA, HTML) stay as they are. If the whole text is in caps, it is treated as normal text and converted to Title Case."],
        ["What does the small-words option do?", "In AP and Chicago style, articles and short prepositions (a, the, of, in, on, and…) stay lowercase unless they are the first or last word."],
        ["How are hyphenated words handled?", "Each part is capitalized: well-known → Well-Known. Apostrophes are respected: don’t → Don’t."],
      ],
    },
    keywords: [["каждое слово с большой буквы", "заглавная буква", "title case"], ["capitalize words", "title case", "headline case"]],
  },
  {
    slug: "sentence-case",
    id: "sentence",
    name: ["Как в предложении", "Sentence case"],
    title: ["Как в предложении — первая буква заглавная онлайн", "Sentence case converter — capitalize sentences online"],
    h1: ["Регистр как в предложении", "Sentence case converter"],
    description: [
      "Приведите текст к обычному виду: заглавная буква только в начале каждого предложения, остальное — строчными. Аббревиатуры сохраняются, капс исправляется.",
      "Turn any text into normal sentence case: a capital at the start of each sentence, the rest lowercase. Acronyms are kept and all-caps text is fixed.",
    ],
    lead: ["Каждое предложение начнётся с заглавной, остальные буквы станут строчными.", "Each sentence starts with a capital, the rest becomes lowercase."],
    example: ["ПРИВЕТ. КАК ДЕЛА? всё хорошо!", "HELLO. HOW ARE YOU? i'm fine!"],
    use: ["Исправление текста, набранного капсом или без заглавных; подготовка описаний и сообщений.", "Fixing text typed in caps or without capitals; preparing descriptions and messages."],
    faq: {
      ru: [
        ["Как исправить текст, набранный капсом?", "Выберите «Как в предложении»: все буквы станут строчными, а первые буквы предложений — заглавными. Имена собственные после этого нужно поправить вручную."],
        ["Как определяется начало предложения?", "После точки, восклицательного и вопросительного знака, многоточия и в начале каждой строки."],
      ],
      en: [
        ["How do I fix text typed in caps?", "Choose Sentence case: everything becomes lowercase and each sentence starts with a capital. The pronoun “I” is capitalized; other proper nouns need a manual touch."],
        ["How is the start of a sentence detected?", "After a full stop, question or exclamation mark, an ellipsis and at the beginning of every line."],
      ],
    },
    keywords: [["первая буква заглавная", "с большой буквы предложение"], ["sentence case", "capitalize first letter"]],
  },
  {
    slug: "camel-case",
    id: "camel",
    name: ["camelCase", "camelCase"],
    title: ["camelCase конвертер онлайн — текст в верблюжий регистр", "camelCase converter — convert text to camelCase"],
    h1: ["Конвертер в camelCase", "camelCase converter"],
    description: [
      "Преобразуйте фразу в camelCase: слова склеиваются, каждое следующее начинается с заглавной — userFirstName. Понимает пробелы, дефисы, подчёркивания и XMLHttpRequest.",
      "Convert phrases to camelCase: words are joined and each one after the first starts with a capital — userFirstName. Handles spaces, dashes, underscores.",
    ],
    lead: ["«first name» → firstName: первое слово строчными, остальные с заглавной.", "“first name” → firstName: first word lowercase, the rest capitalized."],
    example: ["user first name", "XMLHttpRequest handler"],
    use: ["Имена переменных и функций в JavaScript, Java, Kotlin, Swift; ключи JSON.", "Variable and function names in JavaScript, Java, Kotlin and Swift; JSON keys."],
    faq: {
      ru: [
        ["Как camelCase делит слова?", "По пробелам, знакам препинания, дефисам и подчёркиваниям, а также по смене регистра: XMLHttpRequest делится на XML · Http · Request, поэтому получится xmlHttpRequest."],
        ["Можно ли конвертировать список?", "Да, каждая строка обрабатывается отдельно — удобно для списка полей."],
      ],
      en: [
        ["How does camelCase split words?", "On spaces, punctuation, dashes and underscores, and on case changes: XMLHttpRequest splits into XML · Http · Request, giving xmlHttpRequest."],
        ["Can I convert a list?", "Yes, every line is converted separately — handy for a list of field names."],
      ],
    },
    keywords: [["camel case", "верблюжий регистр", "имя переменной"], ["camel case", "lower camel case"]],
  },
  {
    slug: "pascal-case",
    id: "pascal",
    name: ["PascalCase", "PascalCase"],
    title: ["PascalCase конвертер онлайн — каждое слово с заглавной слитно", "PascalCase converter — convert text to PascalCase"],
    h1: ["Конвертер в PascalCase", "PascalCase converter"],
    description: [
      "Преобразуйте фразу в PascalCase: слова пишутся слитно, каждое с заглавной буквы — UserProfileCard. Подходит для имён классов, типов и компонентов React.",
      "Convert phrases to PascalCase: words are joined and each starts with a capital — UserProfileCard. Suits class, type and React component names.",
    ],
    lead: ["«user profile card» → UserProfileCard.", "“user profile card” → UserProfileCard."],
    example: ["user profile card", "http request handler"],
    use: ["Имена классов и типов в C#, Java, TypeScript; компоненты React; имена файлов.", "Class and type names in C#, Java and TypeScript; React components; file names."],
    faq: {
      ru: [
        ["Чем PascalCase отличается от camelCase?", "В PascalCase с заглавной начинается и первое слово (UserName), в camelCase — нет (userName)."],
        ["Что будет с аббревиатурами?", "Они приводятся к виду «первая заглавная»: HTTP request → HttpRequest — так рекомендуют руководства по стилю .NET и Google."],
      ],
      en: [
        ["What’s the difference from camelCase?", "In PascalCase the first word is capitalized too (UserName); in camelCase it isn’t (userName)."],
        ["What happens to acronyms?", "They become capitalized words: HTTP request → HttpRequest, as the .NET and Google style guides recommend."],
      ],
    },
    keywords: [["pascal case", "upper camel case", "имя класса"], ["pascal case", "upper camel case"]],
  },
  {
    slug: "snake-case",
    id: "snake",
    name: ["snake_case", "snake_case"],
    title: ["snake_case конвертер онлайн — слова через подчёркивание", "snake_case converter — words joined with underscores"],
    h1: ["Конвертер в snake_case", "snake_case converter"],
    description: [
      "Преобразуйте текст в snake_case: строчные слова через подчёркивание — user_first_name. Разбирает camelCase, пробелы и дефисы, каждую строку отдельно.",
      "Convert text to snake_case: lowercase words joined with underscores — user_first_name. Parses camelCase, spaces and dashes, line by line.",
    ],
    lead: ["«User First Name» → user_first_name.", "“User First Name” → user_first_name."],
    example: ["User First Name", "getHTTPResponse"],
    use: ["Переменные и функции в Python, Ruby, Rust; имена столбцов в SQL; файлы.", "Variables and functions in Python, Ruby and Rust; SQL column names; file names."],
    faq: {
      ru: [
        ["Где используется snake_case?", "В Python (PEP 8), Ruby, Rust, в именах столбцов баз данных и в названиях файлов."],
        ["Как перевести camelCase в snake_case?", "Вставьте идентификаторы — getHTTPResponse станет get_http_response: слова отделяются по смене регистра."],
      ],
      en: [
        ["Where is snake_case used?", "In Python (PEP 8), Ruby and Rust, database column names and file names."],
        ["How do I convert camelCase to snake_case?", "Paste the identifiers — getHTTPResponse becomes get_http_response; words are split on case changes."],
      ],
    },
    keywords: [["snake case", "нижнее подчёркивание", "python"], ["snake case", "underscore case"]],
  },
  {
    slug: "kebab-case",
    id: "kebab",
    name: ["kebab-case", "kebab-case"],
    title: ["kebab-case конвертер онлайн — слова через дефис", "kebab-case converter — words joined with hyphens"],
    h1: ["Конвертер в kebab-case", "kebab-case converter"],
    description: [
      "Преобразуйте текст в kebab-case: строчные слова через дефис — main-menu-item. Подходит для CSS-классов, адресов страниц и имён файлов; кириллица сохраняется.",
      "Convert text to kebab-case: lowercase words joined with hyphens — main-menu-item. Suits CSS classes, URLs and file names.",
    ],
    lead: ["«Main Menu Item» → main-menu-item.", "“Main Menu Item” → main-menu-item."],
    example: ["Main Menu Item", "backgroundColor"],
    use: ["CSS-классы и свойства, адреса страниц, имена пакетов npm и файлов.", "CSS classes and properties, URLs, npm package and file names."],
    faq: {
      ru: [
        ["Как сделать адрес страницы из русского заголовка?", "kebab-case сохраняет кириллицу. Для латинского адреса (ЧПУ) воспользуйтесь транслитерацией в режиме URL — она переведёт буквы в латиницу."],
        ["Чем kebab-case отличается от snake_case?", "Только разделителем: дефис вместо подчёркивания."],
      ],
      en: [
        ["Is kebab-case good for URLs?", "Yes — lowercase words with hyphens are the usual URL format. For non-Latin titles use transliteration in URL mode first."],
        ["How is it different from snake_case?", "Only the separator: a hyphen instead of an underscore."],
      ],
    },
    keywords: [["kebab case", "через дефис", "css класс"], ["kebab case", "dash case", "spinal case"]],
  },
  {
    slug: "constant-case",
    id: "constant",
    name: ["CONSTANT_CASE", "CONSTANT_CASE"],
    title: ["CONSTANT_CASE онлайн — заглавные через подчёркивание", "CONSTANT_CASE converter — SCREAMING_SNAKE_CASE online"],
    h1: ["Конвертер в CONSTANT_CASE", "CONSTANT_CASE converter"],
    description: [
      "Преобразуйте текст в CONSTANT_CASE: заглавные слова через подчёркивание — MAX_RETRY_COUNT. Так пишут константы и переменные окружения; разбирает camelCase.",
      "Convert text to CONSTANT_CASE: uppercase words joined with underscores — MAX_RETRY_COUNT. Used for constants and environment variables.",
    ],
    lead: ["«max retry count» → MAX_RETRY_COUNT.", "“max retry count” → MAX_RETRY_COUNT."],
    example: ["max retry count", "apiBaseUrl"],
    use: ["Константы в JavaScript, Java, C; переменные окружения (.env).", "Constants in JavaScript, Java and C; environment variables (.env)."],
    faq: {
      ru: [
        ["Как ещё называют CONSTANT_CASE?", "SCREAMING_SNAKE_CASE или UPPER_SNAKE_CASE — это snake_case заглавными буквами."],
        ["Подходит ли для переменных окружения?", "Да, имена в файлах .env и в настройках серверов обычно пишут именно так: DATABASE_URL, API_KEY."],
      ],
      en: [
        ["What else is CONSTANT_CASE called?", "SCREAMING_SNAKE_CASE or UPPER_SNAKE_CASE — snake_case in capitals."],
        ["Is it used for environment variables?", "Yes, names in .env files and server settings are usually written this way: DATABASE_URL, API_KEY."],
      ],
    },
    keywords: [["константа", "upper snake case", "env"], ["screaming snake case", "upper snake case"]],
  },
  {
    slug: "dot-case",
    id: "dot",
    name: ["dot.case", "dot.case"],
    title: ["dot.case конвертер онлайн — слова через точку", "dot.case converter — words joined with dots"],
    h1: ["Конвертер в dot.case", "dot.case converter"],
    description: [
      "Преобразуйте текст в dot.case: строчные слова через точку — app.settings.title. Подходит для ключей переводов, конфигов и свойств; каждая строка отдельно.",
      "Convert text to dot.case: lowercase words joined with dots — app.settings.title. Suits translation keys, config and property names, line by line.",
    ],
    lead: ["«App Settings Title» → app.settings.title.", "“App Settings Title” → app.settings.title."],
    example: ["App Settings Title", "userProfileName"],
    use: ["Ключи локализации (i18n), свойства в Java .properties, пути в конфигурациях.", "Localization (i18n) keys, Java .properties entries, config paths."],
    faq: {
      ru: [
        ["Где используют dot.case?", "В ключах переводов (menu.file.open), файлах .properties и в путях настроек."],
        ["Можно ли получить другие разделители?", "Да: kebab-case — через дефис, snake_case — через подчёркивание."],
      ],
      en: [
        ["Where is dot.case used?", "In translation keys (menu.file.open), .properties files and configuration paths."],
        ["Can I get other separators?", "Yes: kebab-case uses hyphens, snake_case uses underscores."],
      ],
    },
    keywords: [["dot case", "через точку", "ключи перевода"], ["dot case", "dot notation"]],
  },
  {
    slug: "alternating-case",
    id: "alternating",
    name: ["чЕрЕдОвАнИе", "aLtErNaTiNg"],
    title: ["ЧеРеДоВаНиЕ регистра онлайн — aLtErNaTiNg CaSe", "Alternating case generator — aLtErNaTiNg text online"],
    h1: ["Чередование регистра букв", "Alternating case generator"],
    description: [
      "Сделайте текст с чередованием регистра: сТрОчНаЯ, зАгЛаВнАя по очереди. Популярно для мемов с насмешливым тоном; знаки и пробелы не сбивают очередь.",
      "Make alternating case text: lower, upper, lower, upper — aLtErNaTiNg. Popular for mocking memes; spaces and punctuation don’t break the pattern.",
    ],
    lead: ["«насмешливый текст» → нАсМеШлИвЫй ТеКсТ.", "“mocking text” → mOcKiNg TeXt."],
    example: ["насмешливый текст", "mocking spongebob"],
    use: ["Мемы, шуточные подписи и комментарии.", "Memes, jokey captions and comments."],
    faq: {
      ru: [
        ["Как называется такой текст?", "В интернете его называют «насмешливым текстом» — по мему со Спанч Бобом (Mocking SpongeBob)."],
        ["Учитываются ли пробелы?", "Нет, чередование идёт только по буквам, поэтому пробелы и знаки препинания не ломают узор."],
      ],
      en: [
        ["What is this style called?", "Mocking text or sarcasm case, after the Mocking SpongeBob meme."],
        ["Do spaces count?", "No, only letters alternate, so spaces and punctuation don’t break the pattern."],
      ],
    },
    keywords: [["чередование букв", "насмешливый текст", "спанч боб"], ["mocking spongebob", "sarcasm text", "alternating caps"]],
  },
  {
    slug: "inverse-case",
    id: "inverse",
    name: ["иНВЕРСИЯ", "iNVERSE"],
    title: ["Инверсия регистра онлайн — исправить текст с Caps Lock", "Inverse case converter — fix text typed with Caps Lock"],
    h1: ["Инверсия регистра", "Inverse case converter"],
    description: [
      "Поменяйте регистр каждой буквы на противоположный: пРИВЕТ → Привет. Исправляет текст, случайно набранный с включённым Caps Lock, без повторного набора.",
      "Swap the case of every letter: hELLO → Hello. Fixes text accidentally typed with Caps Lock on, without retyping it.",
    ],
    lead: ["Заглавные становятся строчными и наоборот: пРИВЕТ → Привет.", "Capitals become small and vice versa: hELLO → Hello."],
    example: ["пРИВЕТ, кАК дЕЛА?", "hELLO, hOW aRE yOU?"],
    use: ["Исправление текста, набранного с нажатым Caps Lock.", "Fixing text typed with Caps Lock on."],
    faq: {
      ru: [
        ["Как исправить текст, набранный с Caps Lock?", "Вставьте его сюда: «пРИВЕТ, кАК дЕЛА?» превратится в «Привет, как дела?»."],
        ["Чем инверсия отличается от строчных букв?", "Строчные делают все буквы маленькими, а инверсия меняет каждую букву на противоположную и сохраняет исходную «форму» слов."],
      ],
      en: [
        ["How do I fix text typed with Caps Lock?", "Paste it here: “hELLO, hOW aRE yOU?” turns into “Hello, How Are You?”."],
        ["How is it different from lowercase?", "Lowercase makes every letter small; inverse flips each letter, keeping the original shape of the words."],
      ],
    },
    keywords: [["caps lock", "обратный регистр", "перевернуть регистр"], ["swap case", "toggle case", "caps lock fix"]],
  },
];

function variant(p: CasePage): VariantDef {
  return {
    slug: p.slug,
    name: L(...p.name),
    title: L(...p.title),
    h1: L(...p.h1),
    description: L(...p.description),
    lead: L(...p.lead),
    keywords: LL(...p.keywords),
    props: { caseId: p.id },
    blocks: (locale) => {
      const i = locale === "ru" ? 0 : 1;
      const ex = p.example[i];
      return [
        facts(locale, L("Пример", "Example"), [
          [L("Было", "Input"), ex],
          [L("Стало", "Output"), convertCase(ex, p.id, { locale, smallWords: locale === "en" })],
          [L("Где используется", "Where it’s used"), p.use[i]],
        ]),
      ];
    },
    faq: FAQ(p.faq.ru, p.faq.en),
  };
}

export const caseConverter: ToolDef = {
  slug: "case-converter",
  component: "text/case",
  icon: "CaseSensitive",
  popular: true,
  name: L("Изменить регистр текста", "Case converter"),
  title: L("Изменить регистр текста онлайн — заглавные и строчные буквы", "Case Converter — change text case online"),
  h1: L("Изменить регистр текста", "Case converter"),
  description: L(
    "Переведите текст в ЗАГЛАВНЫЕ или строчные буквы, «Каждое Слово С Заглавной», как в предложении, а также camelCase, snake_case, kebab-case — 12 вариантов.",
    "Change text to UPPERCASE, lowercase, Title Case or Sentence case, or to camelCase, snake_case, kebab-case and more — 12 case styles, instantly.",
  ),
  lead: L("Вставьте текст и выберите регистр — результат появится сразу.", "Paste your text and pick a case — the result appears instantly."),
  keywords: LL(["заглавные буквы", "строчные буквы", "регистр букв", "caps lock"], ["uppercase", "lowercase", "title case", "text case"]),
  howTo: LL(
    [
      "Вставьте текст в левое поле.",
      "Выберите регистр: заглавные, строчные, как в предложении, каждое слово с заглавной или стиль для программистов.",
      "Скопируйте результат или скачайте его файлом .txt.",
    ],
    ["Paste your text into the left box.", "Pick a case: upper, lower, sentence, title or one of the programmer styles.", "Copy the result or download it as a .txt file."],
  ),
  about: LL(
    [
      "Двенадцать вариантов регистра: привычные заглавные и строчные, «Как в предложении», «Каждое Слово С Заглавной», а также camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE и dot.case для кода, адресов и имён файлов.",
      "Буквы любых алфавитов — кириллица с ё, казахские Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І, латиница с диакритикой — меняют регистр корректно. Для программных стилей слова разделяются по пробелам, знакам и смене регистра: XMLHttpRequest → xml_http_request.",
    ],
    [
      "Twelve case styles: plain upper and lower case, Sentence case, Title Case, plus camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE and dot.case for code, URLs and file names.",
      "Letters of any alphabet — accented Latin, Cyrillic, Greek — change case correctly. For programmer styles words are split on spaces, punctuation and case changes: XMLHttpRequest → xml_http_request.",
    ],
  ),
  faq: FAQ(
    [
      ["Как сделать все буквы заглавными?", "Выберите «ВСЕ ЗАГЛАВНЫЕ» — текст сразу перепишется прописными буквами, включая ё и казахские буквы."],
      ["Что делать, если печатал с включённым Caps Lock?", "Выберите «иНВЕРСИЯ рЕГИСТРА»: строчные станут заглавными и наоборот — «пРИВЕТ» превратится в «Привет»."],
      ["Сохраняются ли аббревиатуры?", "В режимах «Каждое Слово С Заглавной» и «Как в предложении» короткие слова, написанные заглавными (NASA, США, HTML), остаются как есть."],
      ["Как camelCase и snake_case делят слова?", "По пробелам, знакам препинания и смене регистра: XMLHttpRequest → XML · Http · Request, hello,_world → hello · world. Каждая строка конвертируется отдельно."],
    ],
    [
      ["How do I make all letters uppercase?", "Choose UPPER CASE — the text is rewritten in capitals at once, including accented and Cyrillic letters."],
      ["I typed with Caps Lock on — how do I fix it?", "Choose iNVERSE cASE: capitals become small and vice versa — “hELLO” turns into “Hello”."],
      ["Are acronyms preserved?", "In Title Case and Sentence case, short words written in capitals (NASA, USA, HTML) stay as they are."],
      ["How do camelCase and snake_case split words?", "On spaces, punctuation and case changes: XMLHttpRequest → XML · Http · Request, hello,_world → hello · world. Every line is converted separately."],
    ],
  ),
  related: ["word-counter", "transliteration", "keyboard-layout-converter", "text-cleaner"],
  variants: { title: L("Все варианты регистра", "All case styles"), list: () => PAGES.map(variant) },
};
