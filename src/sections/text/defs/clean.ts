import type { Block, ToolDef } from "@/registry/types";
import { INVISIBLE_CHARS } from "../lib/clean";
import { typograph } from "../lib/typograph";
import { FAQ, facts, L, LL, moreTools } from "./util";

export const textCleaner: ToolDef = {
  slug: "text-cleaner",
  component: "text/clean",
  icon: "Sparkles",
  props: { preset: "default" },
  name: L("Очистка текста", "Text cleaner"),
  title: L("Очистка текста онлайн — убрать лишние пробелы и символы", "Text Cleaner — clean up messy text online"),
  h1: L("Очистка текста", "Text cleaner"),
  description: L(
    "Очистите текст за один проход: лишние пробелы и пустые строки, табуляция, HTML-теги, невидимые символы, кавычки, ё на е. Эмодзи и буквы любых алфавитов сохраняются.",
    "Clean up text in one pass: extra spaces and blank lines, tabs, HTML tags, invisible characters, quotes and dashes. Emoji and letters of every alphabet survive.",
  ),
  lead: L("Вставьте текст — лишние пробелы, пустые строки и невидимые символы исчезнут.", "Paste text — extra spaces, blank lines and invisible characters disappear."),
  keywords: LL(["почистить текст", "форматирование текста", "убрать форматирование", "исправить текст"], ["clean text", "text formatter", "remove formatting"]),
  howTo: LL(
    [
      "Вставьте текст, скопированный из PDF, Word, сайта или мессенджера.",
      "Основные операции уже включены: лишние пробелы, края строк, повторные пустые строки и невидимые символы.",
      "В дополнительных настройках — переносы строк, табуляция, HTML, кавычки, тире, ё, эмодзи и диакритика.",
      "Скопируйте чистый текст или скачайте файлом .txt.",
    ],
    [
      "Paste text copied from a PDF, Word, a website or a messenger.",
      "The main operations are on: extra spaces, line edges, repeated blank lines and invisible characters.",
      "More options cover line breaks, tabs, HTML, quotes, dashes, emoji and accents.",
      "Copy the clean text or download it as a .txt file.",
    ],
  ),
  about: LL(
    [
      "В отличие от многих «чистильщиков», здесь удаление знаков препинания и спецсимволов не трогает буквы: кириллица, казахские Ә, Ғ, Қ, Ң, латиница с диакритикой и греческий остаются. Невидимые символы удаляются, но ZWJ внутри эмодзи вроде 👨‍👩‍👧 сохраняется — иначе семья распалась бы на три смайлика.",
      "Табуляция заменяется пробелами до ближайшей позиции табуляции — ширину (2, 3, 4 или 8) можно выбрать. Все операции выполняются в браузере, текст никуда не отправляется.",
    ],
    [
      "Unlike many cleaners, removing punctuation and symbols never touches letters: accented Latin, Cyrillic and Greek stay. Invisible characters are removed, but the ZWJ inside emoji like 👨‍👩‍👧 is kept — otherwise the family would fall apart into three emoji.",
      "Tabs are expanded to the next tab stop with a width you choose (2, 3, 4 or 8). Everything runs in your browser; the text is never uploaded.",
    ],
  ),
  faq: FAQ(
    [
      ["Как убрать форматирование текста из Word или сайта?", "Вставьте текст сюда и скопируйте результат — получится простой текст без стилей. Если в тексте остались HTML-теги, включите их удаление в дополнительных настройках."],
      ["Удалятся ли русские или казахские буквы при удалении спецсимволов?", "Нет. Удаляются только знаки препинания и символы; буквы любых алфавитов и цифры сохраняются."],
      ["Что такое невидимые символы?", "Пробел нулевой ширины, мягкий перенос, метки направления текста, BOM и заполнители вроде U+3164. Их не видно, но они ломают поиск, сравнение строк и подсчёт символов."],
      ["Можно ли заменить ё на е?", "Да, отметьте «Заменить ё на е» в дополнительных настройках — заменятся и строчные, и заглавные буквы."],
    ],
    [
      ["How do I strip formatting from Word or a website?", "Paste the text here and copy the result — you get plain text without styles. If HTML tags remain, turn on HTML stripping in More options."],
      ["Will accented or non-Latin letters be removed with symbols?", "No. Only punctuation and symbols are removed; letters of every alphabet and digits stay."],
      ["What are invisible characters?", "Zero-width spaces, soft hyphens, direction marks, BOM and fillers like U+3164. You can’t see them, but they break search, string comparison and character counts."],
      ["Can it convert curly quotes to straight ones?", "Yes, set Quotes to “straight” in More options; curly and «guillemet» quotes become \" and '."],
    ],
  ),
  related: ["remove-line-breaks", "remove-extra-spaces", "remove-invisible-characters", "remove-html-tags", "typograph"],
};

function cleanTool(o: {
  slug: string;
  preset: string;
  icon: string;
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  keywords: [string[], string[]];
  howTo: [string[], string[]];
  about: [string[], string[]];
  faq: { ru: [string, string][]; en: [string, string][] };
  related: string[];
  blocks?: ToolDef["blocks"];
}): ToolDef {
  return {
    slug: o.slug,
    component: "text/clean",
    icon: o.icon,
    props: { preset: o.preset },
    name: L(...o.name),
    title: L(...o.title),
    h1: L(...o.h1),
    description: L(...o.description),
    lead: L(...o.lead),
    keywords: LL(...o.keywords),
    howTo: LL(...o.howTo),
    about: LL(...o.about),
    faq: FAQ(o.faq.ru, o.faq.en),
    related: o.related,
    blocks: o.blocks,
  };
}

export const removeLineBreaks = cleanTool({
  slug: "remove-line-breaks",
  preset: "line-breaks",
  icon: "Pilcrow",
  name: ["Удалить переносы строк", "Remove line breaks"],
  title: ["Удалить переносы строк онлайн — склеить текст из PDF", "Remove Line Breaks Online — fix text copied from PDF"],
  h1: ["Удалить переносы строк", "Remove line breaks"],
  description: [
    "Уберите лишние переносы строк из текста, скопированного из PDF или письма: строки внутри абзацев склеятся, абзацы останутся. Можно удалить и все переносы.",
    "Remove unwanted line breaks from text copied from a PDF or an email: lines inside paragraphs are joined while paragraphs stay. Or remove every break.",
  ],
  lead: ["Строки внутри абзаца склеятся, пустая строка между абзацами сохранится.", "Lines inside a paragraph are joined; the blank line between paragraphs stays."],
  keywords: [["убрать переносы", "текст из pdf", "склеить строки", "разрывы строк"], ["remove newlines", "pdf text fix", "unwrap text"]],
  howTo: [
    ["Вставьте текст, который разбит на короткие строки.", "Режим «склеить строки внутри абзацев» уже выбран; для одной сплошной строки выберите «удалить все».", "Скопируйте текст."],
    ["Paste text broken into short lines.", "“Join lines within paragraphs” is already selected; choose “remove all” for a single line.", "Copy the text."],
  ],
  about: [
    [
      "При копировании из PDF каждая строка страницы заканчивается переносом. Инструмент заменяет такие переносы пробелом, но сохраняет абзацы — пустую строку между ними.",
      "Перенос слова со знаком дефиса («обры-\\nвается») склеивается без дефиса, а настоящий дефис в «PDF-\\nфайла» остаётся: если перед дефисом строчная буква и после переноса тоже строчная, это считается переносом слова.",
    ],
    [
      "When you copy from a PDF, every line of the page ends with a line break. The tool replaces those breaks with spaces but keeps paragraphs — the blank line between them.",
      "A word hyphenated across lines (“hyphen-\\nation”) is joined without the hyphen, while a real hyphen like “PDF-\\nfile” stays: a lowercase letter before the hyphen and after the break means a hyphenated word.",
    ],
  ],
  faq: {
    ru: [
      ["Как склеить текст из PDF в абзацы?", "Вставьте его сюда: переносы внутри абзацев заменятся пробелами, пустые строки между абзацами останутся."],
      ["Как сделать весь текст одной строкой?", "Выберите «удалить все» — все переносы и пустые строки заменятся одним пробелом."],
      ["Что будет с переносами слов через дефис?", "Если слово было разорвано переносом («обры-/вается»), оно склеится без дефиса. Дефис после заглавных букв и цифр («PDF-файл») сохраняется."],
    ],
    en: [
      ["How do I rejoin PDF text into paragraphs?", "Paste it here: breaks inside paragraphs become spaces while blank lines between paragraphs stay."],
      ["How do I make the whole text one line?", "Choose “remove all” — every break and blank line becomes a single space."],
      ["What about words hyphenated across lines?", "A word split by hyphenation is joined without the hyphen; a hyphen after capitals or digits (“PDF-file”) is kept."],
    ],
  },
  related: ["join-lines", "remove-extra-spaces", "remove-empty-lines", "text-cleaner"],
});

export const removeExtraSpaces = cleanTool({
  slug: "remove-extra-spaces",
  preset: "spaces",
  icon: "Space",
  name: ["Удалить лишние пробелы", "Remove extra spaces"],
  title: ["Удалить лишние пробелы в тексте онлайн", "Remove Extra Spaces Online — fix double spaces"],
  h1: ["Удалить лишние пробелы", "Remove extra spaces"],
  description: [
    "Уберите двойные и лишние пробелы: между словами останется один, по краям строк — ни одного. Неразрывные и узкие пробелы заменятся обычными, табуляция — пробелом.",
    "Remove double and extra spaces: one space between words and none at line edges. Non-breaking and thin spaces become regular ones, tabs become a space.",
  ],
  lead: ["Между словами останется ровно один пробел.", "Exactly one space is left between words."],
  keywords: [["двойные пробелы", "убрать пробелы", "много пробелов"], ["double spaces", "trim spaces", "collapse whitespace"]],
  howTo: [
    ["Вставьте текст.", "Проверьте опции: лишние пробелы, края строк, неразрывные пробелы, табуляция.", "Скопируйте результат."],
    ["Paste your text.", "Check the options: extra spaces, line edges, non-breaking spaces, tabs.", "Copy the result."],
  ],
  about: [
    [
      "Несколько пробелов подряд сжимаются в один, пробелы в начале и конце строк удаляются. Переносы строк при этом не трогаются — структура текста сохраняется.",
      "Неразрывные (U+00A0), узкие (U+202F, U+2009) и другие «особые» пробелы часто попадают в текст из Word и с сайтов — они выглядят как обычные, но мешают поиску и заменам. Инструмент превращает их в обычный пробел.",
    ],
    [
      "Runs of spaces collapse into one and spaces at line starts and ends are removed. Line breaks are left alone, so the structure of the text stays.",
      "Non-breaking (U+00A0), narrow (U+202F, U+2009) and other special spaces often come from Word and websites — they look normal but break search and replace. The tool turns them into regular spaces.",
    ],
  ],
  faq: {
    ru: [
      ["Удаляются ли переносы строк?", "Нет, только пробелы. Чтобы убрать переносы, воспользуйтесь «Удалить переносы строк»."],
      ["Что происходит с табуляцией?", "По умолчанию каждая табуляция заменяется одним пробелом. Её можно оставить или развернуть в пробелы до позиции табуляции нужной ширины."],
      ["Почему после замены в Word двойные пробелы остались?", "Скорее всего, часть из них — неразрывные пробелы. Здесь они тоже заменяются обычными и схлопываются."],
    ],
    en: [
      ["Are line breaks removed?", "No, only spaces. Use Remove line breaks for that."],
      ["What happens to tabs?", "By default every tab becomes one space. You can keep tabs or expand them to spaces up to the next tab stop of a chosen width."],
      ["Why did double spaces survive Find & Replace in Word?", "Some of them are probably non-breaking spaces. Here they are converted to regular spaces and collapsed too."],
    ],
  },
  related: ["remove-line-breaks", "text-cleaner", "remove-invisible-characters", "find-and-replace"],
});

export const removeHtmlTags = cleanTool({
  slug: "remove-html-tags",
  preset: "html",
  icon: "CodeXml",
  name: ["Удалить HTML-теги", "Strip HTML tags"],
  title: ["Удалить HTML-теги из текста онлайн — HTML в текст", "Strip HTML Tags Online — convert HTML to plain text"],
  h1: ["Удалить HTML-теги из текста", "Strip HTML tags"],
  description: [
    "Превратите HTML в простой текст: теги удаляются, абзацы и <br> становятся переносами, пункты списка — строками с «•», а &nbsp; и &laquo; — обычными символами.",
    "Turn HTML into plain text: tags are removed, paragraphs and <br> become line breaks, list items become “•” lines, and entities like &nbsp; are decoded.",
  ],
  lead: ["Вставьте HTML — останется только текст.", "Paste HTML — only the text remains."],
  keywords: [["html в текст", "убрать теги", "очистить от html"], ["html to text", "remove html", "strip tags"]],
  howTo: [
    ["Вставьте HTML-код или текст с тегами.", "Теги удалятся сразу; повторные пустые строки сожмутся.", "Скопируйте простой текст."],
    ["Paste HTML code or text with tags.", "Tags are removed at once; repeated blank lines are collapsed.", "Copy the plain text."],
  ],
  about: [
    [
      "Содержимое <script>, <style> и комментарии удаляются целиком, а не превращаются в мусор в тексте. Закрывающие теги абзацев, заголовков, строк таблиц и <br> превращаются в переносы строк, чтобы текст не слипся.",
      "Именованные и числовые HTML-мнемоники (&amp;, &laquo;, &#1071;, &#x44F;) декодируются в символы. HTML не выполняется и не загружается — это безопасная обработка строки в браузере.",
    ],
    [
      "The contents of <script>, <style> and comments are dropped entirely instead of leaking into the text. Closing tags of paragraphs, headings, table rows and <br> turn into line breaks so the text doesn’t run together.",
      "Named and numeric HTML entities (&amp;, &ldquo;, &#8212;, &#x2014;) are decoded. The HTML is never executed or loaded — it’s a safe string transformation in your browser.",
    ],
  ],
  faq: {
    ru: [
      ["Выполняются ли скрипты из вставленного HTML?", "Нет. Код обрабатывается как строка и не вставляется на страницу, поэтому ничего не выполняется и не загружается."],
      ["Что происходит со списками и таблицами?", "Пункты списков становятся строками с «•», ячейки таблицы разделяются табуляцией, а строки таблицы — переносами, чтобы текст оставался читаемым."],
      ["Сохранятся ли ссылки?", "Останется текст ссылки, а сам адрес удалится вместе с тегом <a>. Чтобы достать адреса, воспользуйтесь «Извлечь ссылки»."],
    ],
    en: [
      ["Are scripts in the pasted HTML executed?", "No. The code is processed as a string and never inserted into the page, so nothing runs or loads."],
      ["What happens to lists and tables?", "List items become lines starting with “•”, table cells are separated by tabs and table rows by line breaks, so the text stays readable."],
      ["Are links kept?", "The link text stays; the address is removed with the <a> tag. Use URL extractor to pull out the addresses."],
    ],
  },
  related: ["url-extractor", "text-cleaner", "markdown-editor", "remove-extra-spaces"],
});

export const removeInvisibleCharacters = cleanTool({
  slug: "remove-invisible-characters",
  preset: "invisible",
  icon: "EyeOff",
  name: ["Удалить невидимые символы", "Remove invisible characters"],
  title: ["Удалить невидимые символы из текста онлайн", "Remove Invisible Characters — zero-width space cleaner"],
  h1: ["Удалить невидимые символы", "Remove invisible characters"],
  description: [
    "Найдите и удалите невидимые символы: пробел нулевой ширины, мягкий перенос, BOM, метки направления, заполнители U+3164 и U+2800. Эмодзи не пострадают.",
    "Find and remove invisible characters: zero-width spaces, soft hyphens, BOM, direction marks and fillers like U+3164 and U+2800. Emoji stay intact.",
  ],
  lead: ["Покажем, сколько невидимых символов в тексте, и уберём их.", "See how many invisible characters a text has and remove them."],
  keywords: [["zero width space", "пробел нулевой ширины", "скрытые символы", "мягкий перенос"], ["zero width space", "hidden characters", "zwsp remover"]],
  howTo: [
    ["Вставьте текст — под полем появится число найденных невидимых символов.", "Результат справа уже очищен; неразрывные пробелы тоже можно заменить обычными.", "Скопируйте очищенный текст."],
    ["Paste text — the number of invisible characters found appears below.", "The result on the right is already clean; non-breaking spaces can be replaced as well.", "Copy the clean text."],
  ],
  about: [
    [
      "Невидимые символы попадают в текст из мессенджеров, PDF, сайтов и нейросетей. Они мешают поиску, ломают сравнение строк, пароли и адреса, увеличивают счётчики символов. Удаляются только символы из таблицы ниже.",
      "Соединитель нулевой ширины (ZWJ, U+200D) внутри эмодзи-последовательностей — 👨‍👩‍👧, 🏳️‍🌈 — сохраняется, а вне эмодзи удаляется.",
    ],
    [
      "Invisible characters sneak in from messengers, PDFs, websites and AI tools. They break search, string comparison, passwords and addresses and inflate character counts. Only the characters listed in the table below are removed.",
      "The zero-width joiner (ZWJ, U+200D) inside emoji sequences — 👨‍👩‍👧, 🏳️‍🌈 — is kept; outside emoji it is removed.",
    ],
  ],
  faq: {
    ru: [
      ["Как понять, есть ли в тексте невидимые символы?", "Вставьте текст: под полями появится их количество. Если оно больше нуля, скопируйте очищенный результат."],
      ["Удалятся ли эмодзи-семьи и флаги?", "Нет. Соединитель внутри эмодзи — часть символа, он сохраняется; удаляются только одиночные невидимые символы."],
      ["Какие символы удаляются?", "Перечислены в таблице ниже: пробелы и соединители нулевой ширины, мягкий перенос, метки и изоляторы направления текста, BOM, заполнители хангыля и пустой символ Брайля."],
    ],
    en: [
      ["How can I tell if a text has invisible characters?", "Paste it: the count appears below the boxes. If it’s above zero, copy the cleaned result."],
      ["Are emoji families and flags affected?", "No. The joiner inside an emoji is part of the character and is kept; only stray invisible characters are removed."],
      ["Which characters are removed?", "They are listed in the table below: zero-width spaces and joiners, soft hyphen, direction marks and isolates, BOM, Hangul fillers and the blank Braille pattern."],
    ],
  },
  related: ["remove-extra-spaces", "text-cleaner", "font-generator/invisible-character", "word-counter"],
  blocks: (locale) => [
    {
      type: "table",
      title: locale === "ru" ? "Какие символы удаляются" : "Characters that are removed",
      head: locale === "ru" ? ["Код", "Название"] : ["Code point", "Name"],
      rows: INVISIBLE_CHARS.map((c) => [`U+${c.cp.toString(16).toUpperCase().padStart(4, "0")}`, c.name]),
      mono: true,
      split: true,
    },
  ],
});

export const findAndReplace: ToolDef = {
  slug: "find-and-replace",
  component: "text/replace",
  icon: "Replace",
  popular: true,
  name: L("Найти и заменить", "Find and replace"),
  title: L("Найти и заменить текст онлайн — с регулярными выражениями", "Find and Replace Text Online — with regex support"),
  h1: L("Найти и заменить текст", "Find and replace text"),
  description: L(
    "Замените слово или фразу во всём тексте: с учётом регистра, целыми словами (работает и для кириллицы) или регулярным выражением с группами $1 и флагом m.",
    "Replace a word or phrase throughout a text: case-sensitive, whole words only, or with a regular expression using groups like $1 and the m flag.",
  ),
  lead: L("Введите, что найти и на что заменить — результат и число замен видны сразу.", "Type what to find and what to replace it with — see the result and count at once."),
  keywords: LL(["замена текста", "заменить слово", "регулярные выражения", "regex"], ["replace text", "regex replace", "search and replace"]),
  howTo: LL(
    [
      "Вставьте текст.",
      "Введите, что найти и на что заменить.",
      "При необходимости включите учёт регистра, поиск целых слов или регулярные выражения.",
      "Скопируйте результат — под полями видно число совпадений.",
    ],
    [
      "Paste your text.",
      "Type what to find and what to replace it with.",
      "Turn on case sensitivity, whole words or regular expressions if needed.",
      "Copy the result — the number of matches is shown below.",
    ],
  ),
  about: LL(
    [
      "Режим «Слово целиком» работает для любого алфавита: вместо \\b, который в JavaScript понимает только латиницу, используются проверки на букву Юникода (\\p{L}) до и после совпадения. Поэтому «кот» заменится, а «котёнок» и «скот» — нет.",
      "Регулярные выражения выполняются в отдельном потоке (Web Worker) с ограничением в 2 секунды: неудачное выражение вроде (a+)+ не подвесит страницу. Флаг m включён по умолчанию, поэтому ^ и $ означают начало и конец каждой строки.",
    ],
    [
      "“Whole word” works for every alphabet: instead of \\b, which JavaScript understands only for ASCII letters, the pattern checks for Unicode letters (\\p{L}) before and after the match. So “cat” is replaced but “category” and “bobcat” are not.",
      "Regular expressions run in a separate thread (Web Worker) with a 2-second limit, so a bad expression like (a+)+ won’t freeze the page. The m flag is on by default, so ^ and $ match at every line.",
    ],
  ),
  faq: FAQ(
    [
      ["Как заменить слово только целиком?", "Включите «Слово целиком» — замена сработает только там, где до и после нет букв и цифр. Это работает и для русских, и для казахских слов."],
      ["Как использовать группы в замене?", "Включите регулярные выражения и сошлитесь на группы как $1, $2 или $<имя>; $& — всё совпадение. Например, (\\d+)-(\\d+)-(\\d+) → $3.$2.$1 превращает 2025-09-30 в 30.09.2025."],
      ["Как заменить перенос строки?", "С регулярными выражениями найдите \\n. В замене включите «Понимать \\n и \\t», чтобы вставить перенос или табуляцию."],
      ["Что делать, если выражение зависло?", "Через 2 секунды выполнение останавливается и появляется предупреждение. Обычно причина — вложенные квантификаторы вроде (a+)+."],
    ],
    [
      ["How do I replace whole words only?", "Turn on “Whole word” — replacement happens only where there’s no letter or digit before or after. It works for accented and non-Latin words too."],
      ["How do I use groups in the replacement?", "Enable regular expressions and refer to groups as $1, $2 or $<name>; $& is the whole match. E.g. (\\d+)-(\\d+)-(\\d+) → $3.$2.$1 turns 2025-09-30 into 30.09.2025."],
      ["How do I replace a line break?", "With regex on, search for \\n. Turn on “Interpret \\n and \\t” to insert a line break or tab in the replacement."],
      ["What if the expression hangs?", "It is stopped after 2 seconds with a warning. The usual cause is nested quantifiers like (a+)+."],
    ],
  ),
  related: ["text-cleaner", "remove-extra-spaces", "remove-line-breaks", "text-compare"],
};

const TYPO_EXAMPLE_RU = 'Он сказал - "Это "лучший" вариант"... Тираж 1500000 экз., площадь 45 м2.';
const TYPO_EXAMPLE_EN = `She said "it's the 'best' option" - really... (c) 2025`;
const visible = (s: string) => s.replace(/ /g, "·").replace(/ /g, "⸱");

export const typographTool: ToolDef = {
  slug: "typograph",
  component: "text/typograph",
  icon: "Quote",
  props: { lang: "ru" },
  name: L("Типограф", "Typographer"),
  title: L("Типограф онлайн — кавычки «ёлочки», тире и неразрывные пробелы", "Online Typographer — Russian quotes, dashes, non-breaking spaces"),
  h1: L("Типограф онлайн", "Online typographer"),
  description: L(
    "Подготовьте текст к публикации по правилам русской типографики: «ёлочки» и „лапки“, тире с неразрывным пробелом, пробелы после предлогов, разряды в числах.",
    "Prepare Russian text for publishing: «guillemets» with „inner quotes“, em dashes with non-breaking spaces, spaces after short prepositions and digit grouping.",
  ),
  lead: L("Вставьте текст — кавычки, тире и пробелы расставятся по правилам.", "Paste text — quotes, dashes and spaces are fixed by the rules."),
  keywords: LL(["типографика", "ёлочки", "неразрывный пробел", "длинное тире", "кавычки"], ["typograph", "russian quotes", "non-breaking space"]),
  howTo: LL(
    [
      "Вставьте текст.",
      "Справа появится оттипографированный текст, а ниже — предпросмотр, где неразрывные пробелы отмечены точками.",
      "При необходимости отключите отдельные правила или включите HTML-мнемоники в дополнительных настройках.",
      "Скопируйте результат в CMS, документ или вёрстку.",
    ],
    [
      "Paste your text.",
      "The typeset text appears on the right; the preview below marks non-breaking spaces with dots.",
      "Turn individual rules off or switch to HTML entities in More options.",
      "Copy the result into your CMS, document or layout.",
    ],
  ),
  about: LL(
    [
      "Правила: прямые кавычки становятся «ёлочками», вложенные — „лапками“; дефис между словами — длинным тире с неразрывным пробелом перед ним; в диапазонах чисел ставится короткое тире (2020–2023); после коротких предлогов, союзов и местоимений (в, к, и, на, по, для…) — неразрывный пробел, чтобы они не оставались в конце строки; частицы же, ли, бы привязываются к предыдущему слову; инициалы — к фамилии.",
      "Числа от пяти знаков делятся на разряды узким неразрывным пробелом (1 500 000), четырёхзначные и годы не трогаются. Три точки становятся многоточием, (c) — знаком ©, м2 — м². Результат можно получить обычными символами Юникода или HTML-мнемониками (&nbsp;, &laquo;, &mdash;).",
    ],
    [
      "Rules: straight quotes become «guillemets» with „low-high“ quotes inside; a hyphen between words becomes an em dash with a non-breaking space before it; number ranges get an en dash (2020–2023); short prepositions, conjunctions and pronouns are tied to the next word with a non-breaking space; the particles же, ли, бы attach to the previous word; initials stay with the surname.",
      "Numbers of five or more digits are grouped with a narrow no-break space (1 500 000); four-digit numbers and years stay as they are. Three dots become an ellipsis, (c) a ©, м2 an м². Output can be plain Unicode or HTML entities (&nbsp;, &laquo;, &mdash;).",
    ],
  ),
  faq: FAQ(
    [
      ["Какие кавычки правильные в русском тексте?", "Основные — «ёлочки», вложенные — „лапки“: «Он сказал: „Привет“». Прямые кавычки \" — это знак дюйма и программистский символ, в тексте их лучше заменить."],
      ["Зачем нужен неразрывный пробел?", "Он не даёт строке оборваться в неудачном месте: предлог «в» не останется в конце строки, а тире не перенесётся в начало следующей. На экране он выглядит как обычный пробел."],
      ["Чем тире отличается от дефиса?", "Дефис (-) соединяет части слова: «кто-то». Длинное тире (—) разделяет части предложения и отбивается пробелами. Короткое (–) ставят в диапазонах: 10–20."],
      ["Будет ли результат работать на сайте?", "Да. Символы Юникода отображаются везде; если CMS портит неразрывные пробелы, включите HTML-мнемоники."],
    ],
    [
      ["What quotes does Russian typography use?", "«Guillemets» outside and „low-high quotes“ inside: «Он сказал: „Привет“». For English text use the English typographer page."],
      ["Why use a non-breaking space?", "It keeps a line from breaking in an awkward place: a one-letter preposition won’t hang at the end of a line and a dash won’t start the next one. It looks like a normal space."],
      ["What’s the difference between a dash and a hyphen?", "A hyphen (-) joins parts of a word; an em dash (—) separates parts of a sentence; an en dash (–) marks ranges: 10–20."],
      ["Will the result work on a website?", "Yes. Unicode characters display everywhere; if your CMS mangles non-breaking spaces, switch to HTML entities."],
    ],
  ),
  blocks: (locale): Block[] => [
    facts(locale, L("Пример", "Example"), [
      [L("Было", "Input"), TYPO_EXAMPLE_RU],
      [L("Стало (· — неразрывный пробел)", "Output (· = non-breaking space)"), visible(typograph(TYPO_EXAMPLE_RU))],
    ]),
  ],
  related: ["text-cleaner", "find-and-replace", "word-counter", "case-converter"],
  variants: {
    title: L("Другие языки", "Other languages"),
    list: () => [
      {
        slug: "english",
        name: L("Английский типограф", "English typographer"),
        title: L("Английский типограф — “кавычки”, апострофы и тире", "Smart quotes converter — curly quotes, apostrophes, dashes"),
        h1: L("Английский типограф", "Smart quotes converter"),
        description: L(
          "Оформите английский текст: “двойные” и ‘одинарные’ кавычки, апостроф в don’t и ’90s, длинное тире, многоточие, знак дюйма 15″ и © вместо (c).",
          "Fix English typography: “curly” and ‘single’ quotes, apostrophes in don’t and ’90s, em dashes, ellipses, the inch mark in 15″ and © instead of (c).",
        ),
        lead: L("Прямые кавычки станут “типографскими”, дефисы — тире.", "Straight quotes become “curly”, hyphens become dashes."),
        props: { lang: "en" },
        blocks: (locale) => [
          facts(locale, L("Пример", "Example"), [
            [L("Было", "Input"), TYPO_EXAMPLE_EN],
            [L("Стало", "Output"), typograph(TYPO_EXAMPLE_EN, { lang: "en", nbsp: false })],
          ]),
          moreTools(locale, "typograph"),
        ],
        faq: FAQ(
          [
            ["Какие кавычки в английском?", "Двойные “ ” снаружи и одинарные ‘ ’ внутри (американский стиль). Апостроф — тот же знак, что и закрывающая одинарная кавычка: don’t, ’90s."],
            ["Как отличается тире в английском?", "В американском стиле длинное тире пишут без пробелов, в британском — короткое с пробелами. Типограф ставит длинное тире с пробелами, как в стиле AP."],
          ],
          [
            ["What quotes does English use?", "Double “ ” outside and single ‘ ’ inside (American style). The apostrophe is the same mark as the closing single quote: don’t, ’90s."],
            ["How are dashes handled?", "American style writes an em dash without spaces, British style a spaced en dash. The converter uses a spaced em dash, as in AP style."],
          ],
        ),
      },
    ],
  },
};
