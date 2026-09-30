import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { Block, ToolDef, VariantDef } from "@/registry/types";
import { extractEmails, extractNumbers, extractUrls } from "../lib/extract";
import { generateLorem, loremToText, type LoremLang, type LoremUnit } from "../lib/lorem";
import { textStats } from "../lib/textOps";
import { FAQ, facts, L, LL, moreTools } from "./util";

export const textCompare: ToolDef = {
  slug: "text-compare",
  component: "text/compare",
  icon: "GitCompareArrows",
  popular: true,
  wide: true,
  name: L("Сравнить тексты", "Text compare"),
  title: L("Сравнить два текста онлайн — найти различия", "Text Compare — find differences between two texts online"),
  h1: L("Сравнение двух текстов", "Compare two texts"),
  description: L(
    "Найдите различия между двумя версиями текста: по строкам, словам или символам, в одну или две колонки. Можно игнорировать регистр и пробелы, скачать .diff.",
    "Find the differences between two versions of a text by lines, words or characters, unified or side by side. Ignore case or whitespace and download a .diff.",
  ),
  lead: L("Вставьте исходный и изменённый текст — отличия подсветятся.", "Paste the original and the changed text — differences are highlighted."),
  keywords: LL(["сравнение текстов", "найти отличия", "diff", "сравнить версии"], ["diff checker", "compare text", "text difference"]),
  howTo: LL(
    [
      "Вставьте исходный текст слева и изменённый справа.",
      "Выберите, как сравнивать: по строкам, словам или символам.",
      "Удалённое подсвечивается красным, добавленное — зелёным; для строк есть вид в две колонки.",
      "Скачайте изменения в формате .diff, если они нужны для кода или документации.",
    ],
    [
      "Paste the original text on the left and the changed one on the right.",
      "Choose how to compare: by lines, words or characters.",
      "Removed parts are red and added parts green; line mode also has a side-by-side view.",
      "Download a .diff patch if you need it for code or documentation.",
    ],
  ),
  about: LL(
    [
      "Сравнение по словам учитывает правила Юникода (Intl.Segmenter), поэтому русские, казахские и английские слова выделяются целиком, а не по буквам. Сравнение по символам работает с графемами: эмодзи и буквы с ударениями не разбиваются на части.",
      "Вычисления идут в отдельном потоке (Web Worker) с помощью библиотеки jsdiff — даже длинные документы не подвешивают страницу, а тексты не покидают браузер.",
    ],
    [
      "Word mode follows Unicode rules (Intl.Segmenter), so words in any language are highlighted whole, not letter by letter. Character mode works with graphemes: emoji and accented letters are never split.",
      "The diff is computed in a separate thread (Web Worker) with the jsdiff library, so even long documents don’t freeze the page, and your texts never leave the browser.",
    ],
  ),
  faq: FAQ(
    [
      ["Какой режим выбрать?", "Для кода и списков — по строкам, для статей и договоров — по словам, для поиска опечаток — по символам."],
      ["Можно ли не учитывать пробелы и регистр?", "Да: «Без учёта регистра» работает во всех режимах, «Игнорировать пробелы» — при сравнении по строкам: строки, которые отличаются только пробелами, считаются одинаковыми."],
      ["Что за файл .diff?", "Это стандартный формат изменений (unified diff), который понимают Git, редакторы кода и системы ревью."],
      ["Отправляются ли тексты на сервер?", "Нет, сравнение выполняется в вашем браузере."],
    ],
    [
      ["Which mode should I use?", "Lines for code and lists, words for articles and contracts, characters for spotting typos."],
      ["Can case and whitespace be ignored?", "Yes: “Ignore case” works in every mode; “Ignore whitespace” applies to line mode, treating lines that differ only in spaces as equal."],
      ["What is the .diff file?", "The standard unified diff format understood by Git, code editors and review tools."],
      ["Are the texts uploaded?", "No, the comparison runs in your browser."],
    ],
  ),
  related: ["remove-duplicate-lines", "word-counter", "find-and-replace"],
};

/* ───────────── lorem ipsum ───────────── */

function loremSample(lang: LoremLang, unit: LoremUnit, count: number): string {
  return loremToText(generateLorem({ lang, unit, count, seed: 7, classicStart: true }), unit);
}

interface LoremPage {
  slug: string;
  props: { lang?: LoremLang; unit?: LoremUnit; count?: number; html?: boolean };
  name: [string, string];
  title: [string, string];
  h1: [string, string];
  description: [string, string];
  lead: [string, string];
  keywords: [string[], string[]];
  faq: { ru: [string, string][]; en: [string, string][] };
  info: (locale: Locale) => [string, string][];
}

const words = (locale: Locale, n: number) => formatNumber(locale, n);

const LOREM_PAGES: LoremPage[] = [
  {
    slug: "russian",
    props: { lang: "russian" },
    name: ["Рыба на русском", "Russian placeholder"],
    title: ["Рыба-текст на русском — генератор текста-заполнителя", "Russian placeholder text generator (fish text)"],
    h1: ["Рыба-текст на русском", "Russian placeholder text"],
    description: [
      "Сгенерируйте «рыбу» на русском: грамматически связные предложения из настоящих русских слов без бессмыслицы. Абзацы, предложения, слова или список, текст или HTML.",
      "Generate Russian placeholder text: grammatical sentences made of real Russian words, no gibberish. Paragraphs, sentences, words or a list, as text or HTML.",
    ],
    lead: ["Настоящие русские слова в связных предложениях — для макетов и вёрстки.", "Real Russian words in grammatical sentences — for mockups and layouts."],
    keywords: [["рыба текст", "рыбатекст", "текст заглушка", "генератор рыбы"], ["russian lorem ipsum", "fish text"]],
    faq: {
      ru: [
        ["Что такое «рыба» в дизайне?", "Временный текст, который вставляют в макет, пока нет настоящего: он показывает, как будут выглядеть абзацы, заголовки и переносы."],
        ["Почему русская рыба лучше латинского Lorem ipsum?", "У русского текста другая длина слов, буквы и переносы. Макет с кириллической рыбой точнее покажет, как ляжет реальный русский текст."],
        ["Из чего составлен текст?", "Из словаря реальных существительных, прилагательных и глаголов, собранных в предложения с правильным согласованием: «Гибкая стратегия определяет устойчивый рост»."],
      ],
      en: [
        ["What is Russian “fish” text?", "Russian designers call placeholder text “рыба” (fish). It fills a layout until the real copy is ready."],
        ["Why not use Latin lorem ipsum?", "Russian has different word lengths, letters and hyphenation. Cyrillic placeholder text shows more accurately how real Russian copy will fit."],
        ["What is it made of?", "A vocabulary of real nouns, adjectives and verbs combined into grammatically agreeing sentences."],
      ],
    },
    info: (locale) => [[locale === "ru" ? "Пример" : "Sample", loremSample("russian", "sentences", 2)]],
  },
  {
    slug: "cyrillic",
    props: { lang: "cyrillic" },
    name: ["Лорем ипсум кириллицей", "Cyrillic lorem ipsum"],
    title: ["Лорем ипсум на кириллице — классическая рыба русскими буквами", "Cyrillic lorem ipsum generator"],
    h1: ["Лорем ипсум на кириллице", "Cyrillic lorem ipsum"],
    description: [
      "Классический Lorem ipsum, записанный русскими буквами: «Лорем ипсум долор сит амет…». Нейтральный текст без смысла, но с кириллическими буквами и переносами.",
      "Classic Lorem ipsum written in Cyrillic letters: “Лорем ипсум долор сит амет…”. Meaningless, neutral text that still exercises Cyrillic glyphs.",
    ],
    lead: ["«Лорем ипсум долор сит амет» — латынь, записанная кириллицей.", "“Лорем ипсум долор сит амет” — Latin spelled in Cyrillic."],
    keywords: [["лорем ипсум", "лорем ипсум долор", "рыба кириллица"], ["cyrillic lorem", "lorem in russian letters"]],
    faq: {
      ru: [
        ["Зачем лорем ипсум на кириллице?", "Он не отвлекает смыслом, как латинский Lorem ipsum, но проверяет кириллические буквы шрифта и ширину русского текста."],
        ["Чем он отличается от русской рыбы?", "Русская рыба состоит из настоящих слов, а кириллический лорем — бессмысленная латынь русскими буквами."],
      ],
      en: [
        ["Why use Cyrillic lorem ipsum?", "Like Latin lorem ipsum it has no meaning to distract, but it tests the Cyrillic glyphs of a font and the width of Russian-looking text."],
        ["How is it different from Russian placeholder text?", "Russian placeholder text uses real words; Cyrillic lorem is meaningless Latin spelled with Russian letters."],
      ],
    },
    info: (locale) => [[locale === "ru" ? "Пример" : "Sample", loremSample("cyrillic", "sentences", 2)]],
  },
  {
    slug: "english",
    props: { lang: "english" },
    name: ["На английском", "English"],
    title: ["Рыба-текст на английском — генератор английского текста", "English placeholder text generator — readable dummy text"],
    h1: ["Текст-заполнитель на английском", "English placeholder text"],
    description: [
      "Сгенерируйте текст-заполнитель на английском из настоящих слов: связные предложения для макетов англоязычных сайтов и приложений. Абзацы, слова, списки, HTML.",
      "Generate English placeholder text from real words: grammatical sentences for mockups of English websites and apps. Paragraphs, words, lists or HTML.",
    ],
    lead: ["Английская рыба из настоящих слов — видно реальную длину строк.", "English dummy text from real words — you see realistic line lengths."],
    keywords: [["английская рыба", "english dummy text", "текст на английском"], ["english dummy text", "placeholder text", "random english text"]],
    faq: {
      ru: [["Чем английская рыба лучше Lorem ipsum?", "Длина слов и частота букв как в настоящем английском тексте, поэтому макет выглядит реалистичнее."]],
      en: [["Why not just use lorem ipsum?", "Word lengths and letter frequencies match real English, so the mockup looks more realistic and nobody mistakes it for a bug in the language."]],
    },
    info: (locale) => [[locale === "ru" ? "Пример" : "Sample", loremSample("english", "sentences", 2)]],
  },
  {
    slug: "html",
    props: { html: true },
    name: ["В HTML-разметке", "HTML"],
    title: ["Lorem ipsum в HTML — рыба с тегами <p> и <ul>", "Lorem ipsum HTML generator — <p> and list markup"],
    h1: ["Lorem ipsum в HTML", "Lorem ipsum HTML"],
    description: [
      "Получите Lorem ipsum сразу с разметкой: абзацы в тегах <p>, списки в <ul> или <ol>. Можно выбрать латынь, русскую рыбу или английский текст и количество.",
      "Get lorem ipsum with markup: paragraphs wrapped in <p>, lists in <ul> or <ol>. Choose Latin, Russian or English placeholder text and how much you need.",
    ],
    lead: ["Каждый абзац уже обёрнут в <p> — вставляйте прямо в вёрстку.", "Every paragraph is already wrapped in <p> — paste straight into your markup."],
    keywords: [["lorem ipsum html", "рыба html", "текст с тегами"], ["lorem ipsum html", "html placeholder"]],
    faq: {
      ru: [["Какие теги используются?", "Абзацы — <p>, списки — <ul> с <li> или <ol> для нумерованного. Спецсимволы экранируются."]],
      en: [["Which tags are used?", "Paragraphs use <p>, lists use <ul> with <li> or <ol> for numbered lists. Special characters are escaped."]],
    },
    info: () => [["HTML", "<p>Lorem ipsum dolor sit amet…</p>"]],
  },
  {
    slug: "list",
    props: { unit: "list", count: 7 },
    name: ["Списком", "List"],
    title: ["Lorem ipsum списком — генератор пунктов списка", "Lorem ipsum list generator — dummy list items"],
    h1: ["Lorem ipsum списком", "Lorem ipsum list items"],
    description: [
      "Сгенерируйте пункты списка для макета: короткие фразы на латыни, русском или английском, маркированный или нумерованный список, текстом или в HTML.",
      "Generate list items for a mockup: short phrases in Latin, Russian or English, bulleted or numbered, as plain text or HTML.",
    ],
    lead: ["Короткие пункты для меню, списков и карточек.", "Short items for menus, lists and cards."],
    keywords: [["список рыба", "пункты списка"], ["dummy list", "placeholder list items"]],
    faq: {
      ru: [["Можно ли сделать нумерованный список?", "Да, отметьте «Нумерованный список» — пункты получат номера, а в HTML будет <ol>."]],
      en: [["Can I get a numbered list?", "Yes, tick “Numbered list” — items get numbers and HTML output uses <ol>."]],
    },
    info: (locale) => [[locale === "ru" ? "Пример" : "Sample", loremSample("latin", "list", 3).replace(/\n/g, " ")]],
  },
  {
    slug: "100-words",
    props: { unit: "words", count: 100 },
    name: ["100 слов", "100 words"],
    title: ["Lorem ipsum 100 слов — текст ровно на 100 слов", "Lorem ipsum 100 words — exactly 100 words of dummy text"],
    h1: ["Lorem ipsum на 100 слов", "100 words of lorem ipsum"],
    description: [
      "Текст-рыба ровно из 100 слов — около 650–700 символов. Удобно для карточек, анонсов и проверки полей с ограничением длины. Латынь, русский или английский.",
      "Placeholder text of exactly 100 words — roughly 650–700 characters. Handy for cards, teasers and testing length-limited fields. Latin, Russian or English.",
    ],
    lead: ["Ровно 100 слов текста-заполнителя.", "Exactly 100 words of placeholder text."],
    keywords: [["100 слов", "текст на 100 слов"], ["100 words", "100 word text"]],
    faq: {
      ru: [["Сколько символов в 100 словах?", "Для латинского lorem ipsum — примерно 650–700 символов с пробелами; точное число показывается над текстом."]],
      en: [["How many characters are 100 words?", "For Latin lorem ipsum roughly 650–700 characters with spaces; the exact count is shown above the text."]],
    },
    info: (locale) => {
      const s = textStats(loremSample("latin", "words", 100), "en");
      return [
        [locale === "ru" ? "Слов" : "Words", words(locale, s.words)],
        [locale === "ru" ? "Символов с пробелами" : "Characters with spaces", words(locale, s.chars)],
      ];
    },
  },
  {
    slug: "500-words",
    props: { unit: "words", count: 500 },
    name: ["500 слов", "500 words"],
    title: ["Lorem ipsum 500 слов — рыба на пол-страницы и больше", "Lorem ipsum 500 words — dummy text for a full page"],
    h1: ["Lorem ipsum на 500 слов", "500 words of lorem ipsum"],
    description: [
      "Текст-рыба ровно из 500 слов — около 3300–3500 символов, примерно страница А4. Для статей-заглушек, проверки вёрстки длинных текстов и шаблонов документов.",
      "Placeholder text of exactly 500 words — about 3,300–3,500 characters, roughly one A4 page. For article stubs, long-text layout tests and document templates.",
    ],
    lead: ["Ровно 500 слов — примерно одна страница текста.", "Exactly 500 words — about one page of text."],
    keywords: [["500 слов", "рыба на страницу"], ["500 words", "one page of text"]],
    faq: {
      ru: [["Сколько это страниц?", "500 слов — примерно одна страница А4 шрифтом 12 пт с одинарным интервалом."]],
      en: [["How many pages is that?", "500 words is roughly one A4 or Letter page in 12 pt type with single spacing."]],
    },
    info: (locale) => {
      const s = textStats(loremSample("latin", "words", 500), "en");
      return [
        [locale === "ru" ? "Слов" : "Words", words(locale, s.words)],
        [locale === "ru" ? "Символов с пробелами" : "Characters with spaces", words(locale, s.chars)],
      ];
    },
  },
];

function loremVariant(p: LoremPage): VariantDef {
  return {
    slug: p.slug,
    name: L(...p.name),
    title: L(...p.title),
    h1: L(...p.h1),
    description: L(...p.description),
    lead: L(...p.lead),
    keywords: LL(...p.keywords),
    props: p.props,
    blocks: (locale): Block[] => [facts(locale, L("Коротко", "Quick facts"), p.info(locale)), moreTools(locale, "lorem-ipsum")],
    faq: FAQ(p.faq.ru, p.faq.en),
  };
}

export const loremIpsum: ToolDef = {
  slug: "lorem-ipsum",
  component: "text/lorem",
  icon: "Pilcrow",
  popular: true,
  name: L("Lorem ipsum", "Lorem ipsum generator"),
  title: L("Lorem ipsum — генератор текста-рыбы онлайн", "Lorem Ipsum Generator — placeholder text online"),
  h1: L("Генератор Lorem ipsum и текста-рыбы", "Lorem ipsum generator"),
  description: L(
    "Сгенерируйте Lorem ipsum или рыбу на русском и английском: нужное число абзацев, предложений, слов или пунктов списка, простым текстом или в HTML-тегах.",
    "Generate lorem ipsum or Russian and English placeholder text: any number of paragraphs, sentences, words or list items, as plain text or HTML.",
  ),
  lead: L("Выберите язык и объём — текст уже сгенерирован, осталось скопировать.", "Pick a language and length — the text is ready to copy."),
  keywords: LL(["лорем ипсум", "рыба", "текст заглушка", "dummy text"], ["lorem ipsum", "dummy text", "filler text"]),
  howTo: LL(
    [
      "Выберите язык: классическая латынь, русская рыба, лорем ипсум кириллицей или английский.",
      "Выберите единицу — абзацы, предложения, слова или список — и количество.",
      "Включите HTML, если нужны теги <p> или <ul>.",
      "Скопируйте текст; кнопка «Сгенерировать заново» даст новый вариант.",
    ],
    [
      "Choose a language: classic Latin, Russian, Cyrillic lorem or English.",
      "Choose the unit — paragraphs, sentences, words or list — and the amount.",
      "Turn on HTML if you need <p> or <ul> tags.",
      "Copy the text; “Generate again” gives a new variant.",
    ],
  ),
  about: LL(
    [
      "Lorem ipsum — искажённый отрывок трактата Цицерона «О пределах добра и зла» (45 год до н. э.), который давно стал стандартным текстом-заполнителем в типографике и дизайне. Классический вариант начинается со слов «Lorem ipsum dolor sit amet, consectetur adipiscing elit».",
      "Русская рыба здесь — не случайный набор букв, а предложения из настоящих слов с правильным согласованием: так макет покажет реальную длину слов и переносы. Текст генерируется в браузере, в режиме «Слова» — ровно столько слов, сколько указано.",
    ],
    [
      "Lorem ipsum is a scrambled passage from Cicero’s “On the Ends of Good and Evil” (45 BC) that has long been the standard filler text in typesetting and design. The classic version starts with “Lorem ipsum dolor sit amet, consectetur adipiscing elit”.",
      "The Russian and English placeholder texts are not random letters but sentences of real words with correct agreement, so a mockup shows realistic word lengths and line breaks. Text is generated in your browser; in Words mode you get exactly the number you asked for.",
    ],
  ),
  faq: FAQ(
    [
      ["Что означает Lorem ipsum?", "Это искажённая латынь из трактата Цицерона. Фраза «Neque porro quisquam est qui dolorem ipsum…» превратилась в бессмысленное «Lorem ipsum dolor sit amet», поэтому текст не отвлекает смыслом."],
      ["Можно ли получить рыбу на русском?", "Да, выберите «Рыба на русском» — это связные предложения из реальных русских слов. Есть и «Лорем ипсум» кириллицей."],
      ["Сколько текста можно сгенерировать?", "До 100 абзацев, 500 предложений, 10 000 слов или 200 пунктов списка за раз."],
      ["Можно ли использовать текст в коммерческих проектах?", "Да. Классический Lorem ipsum — общественное достояние, а словари для русского и английского текста составлены для этого сайта и свободны для использования."],
    ],
    [
      ["What does lorem ipsum mean?", "It’s scrambled Latin from Cicero. “Neque porro quisquam est qui dolorem ipsum…” turned into the meaningless “Lorem ipsum dolor sit amet”, so the text doesn’t distract with meaning."],
      ["Can I get Russian placeholder text?", "Yes, choose “Russian placeholder” — grammatical sentences of real Russian words. Cyrillic lorem ipsum is available too."],
      ["How much text can I generate?", "Up to 100 paragraphs, 500 sentences, 10,000 words or 200 list items at a time."],
      ["Can I use it in commercial projects?", "Yes. Classic lorem ipsum is in the public domain, and the Russian and English word lists were written for this site and are free to use."],
    ],
  ),
  related: ["word-counter", "repeat-text", "markdown-editor"],
  variants: { title: L("Варианты текста-рыбы", "Placeholder text variants"), list: () => LOREM_PAGES.map(loremVariant) },
};

export const textToSpeech: ToolDef = {
  slug: "text-to-speech",
  component: "text/tts",
  icon: "AudioLines",
  popular: true,
  name: L("Озвучка текста", "Text to speech"),
  title: L("Озвучка текста онлайн — синтез речи голосом", "Text to Speech Online — read text aloud"),
  h1: L("Озвучить текст голосом", "Text to speech"),
  description: L(
    "Озвучьте текст голосами, установленными на вашем устройстве: выбор голоса, скорость, высота и громкость, пауза и стоп. Локальные голоса не передают текст в сеть.",
    "Read text aloud with the voices installed on your device: pick a voice, speed, pitch and volume, pause and stop. Local voices never send your text online.",
  ),
  lead: L("Вставьте текст и нажмите «Озвучить» — браузер прочитает его вслух.", "Paste text and press “Speak” — your browser reads it aloud."),
  keywords: LL(["синтез речи", "читать вслух", "голосом", "tts"], ["read aloud", "speech synthesis", "tts"]),
  howTo: LL(
    [
      "Вставьте текст.",
      "Выберите голос — по умолчанию показаны голоса, которые работают на устройстве.",
      "Нажмите «Озвучить»; паузой и стопом управляйте кнопками рядом.",
      "Скорость, высоту и громкость можно изменить в дополнительных настройках.",
    ],
    [
      "Paste your text.",
      "Choose a voice — voices that run on your device are shown by default.",
      "Press “Speak”; use the buttons next to it to pause and stop.",
      "Adjust speed, pitch and volume in More options.",
    ],
  ),
  about: LL(
    [
      "Озвучка использует встроенный в браузер синтез речи (Web Speech API). Набор голосов зависит от системы: в Windows, macOS, iOS и Android есть русские и английские голоса, другие языки можно установить в настройках системы.",
      "Голоса с пометкой «онлайн» синтезируют речь на серверах поставщика (например, Google или Microsoft) — браузер отправляет им текст. Поэтому по умолчанию они скрыты, а при выборе такого голоса появляется предупреждение. Сохранить озвучку в аудиофайл средствами браузера нельзя.",
    ],
    [
      "It uses the speech synthesis built into your browser (Web Speech API). The available voices depend on the system: Windows, macOS, iOS and Android include English and many other languages; more can be installed in system settings.",
      "Voices marked “online” synthesize speech on the provider’s servers (e.g. Google or Microsoft), so the browser sends them your text. They are hidden by default and a warning appears when you pick one. The browser API can’t save speech to an audio file.",
    ],
  ),
  faq: FAQ(
    [
      ["Почему нет русского голоса?", "Голоса предоставляет операционная система. Установите русский голос в настройках (в Windows — «Время и язык» → «Речь») и перезагрузите страницу, либо включите онлайн-голоса."],
      ["Отправляется ли текст в интернет?", "С локальными голосами — нет, речь синтезируется на устройстве. С онлайн-голосами текст уходит поставщику голоса, об этом предупреждает сообщение под выбором голоса."],
      ["Можно ли скачать озвучку в MP3?", "Нет: встроенный синтез речи браузера воспроизводит звук, но не отдаёт его в виде файла, поэтому мы не предлагаем такую функцию."],
      ["Почему озвучка обрывается на длинном тексте?", "Некоторые браузеры прерывают длинные фразы, поэтому текст делится на предложения и читается по очереди — под кнопками видно номер текущей фразы."],
    ],
    [
      ["Why isn’t there a voice for my language?", "Voices come from your operating system. Install one in system settings (Windows: Time & Language → Speech) and reload the page, or enable online voices."],
      ["Is my text sent over the internet?", "Not with local voices — speech is synthesized on your device. With online voices the text goes to the voice provider, and a warning says so."],
      ["Can I download the speech as MP3?", "No: the browser’s speech synthesis plays audio but doesn’t expose it as a file, so we don’t offer that."],
      ["Why does speech stop on long texts?", "Some browsers cut off long utterances, so the text is split into sentences read one after another — the current phrase number is shown."],
    ],
  ),
  related: ["word-counter", "typograph", "markdown-editor"],
};

/* ───────────── extractors ───────────── */

const EXTRACT_SAMPLE_RU =
  "Пишите на info@example.kz, копия — sales@пример.рф. Сайт https://example.kz/contacts, телефон +7 (701) 123-45-67, цена 1 250 000 ₸, дата 12.03.2024.";
const EXTRACT_SAMPLE_EN =
  "Email info@example.com, cc sales@example.co.uk. Site https://example.com/contacts, phone +1 650-253-0000, price $1,250,000, date 12/03/2024.";

function extractorTool(o: {
  slug: string;
  kind: string;
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
  example?: (s: string) => string[];
}): ToolDef {
  return {
    slug: o.slug,
    component: "text/extract",
    icon: o.icon,
    props: { kind: o.kind },
    name: L(...o.name),
    title: L(...o.title),
    h1: L(...o.h1),
    description: L(...o.description),
    lead: L(...o.lead),
    keywords: LL(...o.keywords),
    howTo: LL(...o.howTo),
    about: LL(...o.about),
    faq: FAQ(o.faq.ru, o.faq.en),
    related: ["email-extractor", "url-extractor", "phone-number-extractor", "number-extractor", "remove-duplicate-lines"].filter((s) => s !== o.slug),
    blocks: o.example
      ? (locale) => {
          const src = locale === "ru" ? EXTRACT_SAMPLE_RU : EXTRACT_SAMPLE_EN;
          return [facts(locale, L("Пример", "Example"), [[L("Текст", "Text"), src], [L("Найдено", "Found"), o.example!(src).join(", ")]])];
        }
      : undefined,
  };
}

export const emailExtractor = extractorTool({
  slug: "email-extractor",
  kind: "emails",
  icon: "AtSign",
  name: ["Извлечь email из текста", "Email extractor"],
  title: ["Извлечь email из текста онлайн — список адресов почты", "Email Extractor — pull email addresses from text"],
  h1: ["Извлечь email-адреса из текста", "Extract email addresses from text"],
  description: [
    "Найдите все адреса электронной почты в тексте, письме или HTML и получите чистый список без повторов. Кириллические домены вроде пример.рф поддерживаются.",
    "Find every email address in a text, email thread or HTML and get a clean list without duplicates. Internationalized domains are supported too.",
  ],
  lead: ["Вставьте текст — все e-mail адреса окажутся в списке справа.", "Paste text — every email address ends up in the list on the right."],
  keywords: [["email из текста", "собрать почты", "адреса электронной почты"], ["extract emails", "email finder", "email list"]],
  howTo: [
    ["Вставьте текст, письмо, таблицу или HTML-код.", "Адреса появятся списком справа; повторы убираются автоматически.", "Скопируйте список или скачайте файлом; разделитель можно сменить в дополнительных настройках."],
    ["Paste text, an email, a table or HTML code.", "Addresses appear in a list on the right; duplicates are removed automatically.", "Copy the list or download it; change the separator in More options."],
  ],
  about: [
    [
      "Адрес распознаётся по формату имя@домен.зона, где имя и домен могут содержать буквы любых алфавитов, цифры, точки, дефисы и знаки + и %. Повторы сравниваются без учёта регистра.",
      "Если вставить HTML, адреса из ссылок mailto: тоже найдутся. Текст обрабатывается в браузере и никуда не отправляется.",
    ],
    [
      "An address is recognized as name@domain.tld, where name and domain may contain letters of any alphabet, digits, dots, hyphens, + and %. Duplicates are compared case-insensitively.",
      "When you paste HTML, addresses in mailto: links are found as well. The text is processed in your browser and never uploaded.",
    ],
  ],
  faq: {
    ru: [
      ["Найдутся ли адреса с кириллическим доменом?", "Да, например info@пример.рф или почта@домен.қаз."],
      ["Как получить адреса через запятую?", "В дополнительных настройках выберите разделитель «запятая» — удобно для поля «Кому» в почте."],
      ["Упоминания @name тоже попадут в список?", "Нет, нужен полный адрес с доменом. Для упоминаний выберите «Упоминания @» в списке «Что извлечь»."],
    ],
    en: [
      ["Are internationalized domains found?", "Yes, addresses with non-Latin domains like info@пример.рф are recognized."],
      ["How do I get a comma-separated list?", "Choose “comma” as the separator in More options — handy for the To field of an email."],
      ["Will @mentions be included?", "No, a full address with a domain is required. Choose “@mentions” in the Extract list for those."],
    ],
  },
  example: (s) => extractEmails(s),
});

export const urlExtractor = extractorTool({
  slug: "url-extractor",
  kind: "urls",
  icon: "Link",
  name: ["Извлечь ссылки из текста", "URL extractor"],
  title: ["Извлечь ссылки из текста онлайн — список URL", "URL Extractor — extract links from text"],
  h1: ["Извлечь ссылки из текста", "Extract links from text"],
  description: [
    "Соберите все ссылки из текста или HTML: http, https, www и адреса вроде example.kz. Точка или скобка в конце предложения не попадёт в ссылку, повторы уберутся.",
    "Collect every link from text or HTML: http, https, www and bare addresses like example.com. A trailing period or bracket isn’t included, duplicates go.",
  ],
  lead: ["Все URL из текста — чистым списком без повторов.", "Every URL in the text — as a clean list without duplicates."],
  keywords: [["ссылки из текста", "собрать url", "вытащить ссылки"], ["extract links", "link extractor", "find urls"]],
  howTo: [
    ["Вставьте текст, сообщение или HTML-код страницы.", "Ссылки появятся списком справа.", "Скопируйте или скачайте список; адреса без http:// можно отключить в дополнительных настройках."],
    ["Paste text, a message or page HTML.", "Links appear in a list on the right.", "Copy or download the list; turn off bare addresses without http:// in More options."],
  ],
  about: [
    [
      "Распознаются адреса с http://, https://, ftp:// и www., а также адреса без протокола на распространённых доменных зонах (.kz, .ru, .com, .org и других). Домен почтового адреса ссылкой не считается.",
      "Знаки препинания в конце предложения отрезаются, а скобки остаются, если они парные — поэтому ссылки на Википедию вида …/Алматы_(город) не ломаются.",
    ],
    [
      "Addresses with http://, https://, ftp:// and www. are recognized, plus bare addresses on common domains (.com, .org, .net, .io and more). The domain of an email address is not treated as a link.",
      "Sentence punctuation at the end is trimmed, while brackets stay when balanced — so Wikipedia links like …/Mercury_(planet) don’t break.",
    ],
  ],
  faq: {
    ru: [
      ["Найдутся ли ссылки без http://?", "Да, если включена опция «Адреса без http://»: example.kz или site.com/page тоже попадут в список."],
      ["Можно ли достать ссылки из HTML-кода страницы?", "Да, вставьте исходный код: найдутся все абсолютные адреса — с http, https или www, в том числе в атрибутах href и src."],
      ["Попадёт ли в ссылку точка в конце предложения?", "Нет, точки, запятые и закрывающие кавычки в конце отрезаются."],
    ],
    en: [
      ["Are links without http:// found?", "Yes, while “Addresses without http://” is on: example.com or site.org/page are listed too."],
      ["Can I pull links out of a page’s HTML?", "Yes, paste the source code: every absolute address — with http, https or www — is found, including those in href and src attributes."],
      ["Is the period at the end of a sentence included?", "No, trailing periods, commas and closing quotes are trimmed."],
    ],
  },
  example: (s) => extractUrls(s, true),
});

export const phoneNumberExtractor = extractorTool({
  slug: "phone-number-extractor",
  kind: "phones",
  icon: "Phone",
  name: ["Извлечь номера телефонов", "Phone number extractor"],
  title: ["Извлечь номера телефонов из текста онлайн", "Phone Number Extractor — find phone numbers in text"],
  h1: ["Извлечь номера телефонов из текста", "Extract phone numbers from text"],
  description: [
    "Найдите телефоны в тексте и приведите их к одному формату: +7 701 123 4567 или +77011234567. Номера проверяются по базе libphonenumber — даты и IP не попадут.",
    "Find phone numbers in a text and normalize them to one format: +1 650-253-0000 or +16502530000. Numbers are validated, so dates and IP addresses are skipped.",
  ],
  lead: ["Телефоны из текста — единым списком в международном формате.", "Phone numbers from a text — as one list in international format."],
  keywords: [["номера телефонов", "телефоны из текста", "собрать телефоны"], ["extract phone numbers", "phone finder"]],
  howTo: [
    ["Вставьте текст, объявление или таблицу с контактами.", "Номера появятся справа в международном формате; повторы убираются.", "В дополнительных настройках выберите страну по умолчанию (для номеров без +) и формат вывода."],
    ["Paste text, an ad or a contact table.", "Numbers appear on the right in international format; duplicates are removed.", "In More options choose the default country (for numbers without +) and the output format."],
  ],
  about: [
    [
      "Номера распознаются и проверяются библиотекой libphonenumber (той же базой правил, что использует Android): учитываются коды стран, длина номера и допустимые диапазоны. Поэтому 12.03.2024, 192.168.1.1 и номера счетов не принимаются за телефоны.",
      "Номера без кода страны («8 (727) 355-00-00») читаются по выбранной стране по умолчанию — по умолчанию Казахстан. База номеров загружается в браузер при первом использовании, текст никуда не отправляется.",
    ],
    [
      "Numbers are detected and validated with libphonenumber (the same rules Android uses): country codes, number length and valid ranges are checked. So 12/03/2024, 192.168.1.1 and account numbers are not mistaken for phones.",
      "Numbers without a country code are read using the default country you choose. The number metadata loads in your browser on first use; the text is never uploaded.",
    ],
  ],
  faq: {
    ru: [
      ["Почему дата не определилась как телефон?", "Каждый кандидат проверяется по правилам нумерации страны: у дат и IP-адресов неподходящая длина и формат, поэтому они отбрасываются."],
      ["Как распознаются номера, начинающиеся с 8?", "Для России и Казахстана 8 — префикс внутренней связи, поэтому 8 701 … превратится в +7 701 …. Выберите правильную страну по умолчанию."],
      ["Можно ли получить номера без пробелов?", "Да, выберите формат +77011234567 (E.164) в дополнительных настройках."],
    ],
    en: [
      ["Why wasn’t a date detected as a phone?", "Every candidate is validated against the numbering rules of its country; dates and IP addresses have the wrong length and format, so they are dropped."],
      ["How are numbers without a country code read?", "Using the default country you choose, e.g. (650) 253-0000 with US becomes +1 650-253-0000."],
      ["Can I get numbers without spaces?", "Yes, choose the +16502530000 (E.164) format in More options."],
    ],
  },
});

export const numberExtractor = extractorTool({
  slug: "number-extractor",
  kind: "numbers",
  icon: "Hash",
  name: ["Извлечь числа из текста", "Number extractor"],
  title: ["Извлечь числа из текста онлайн — все цифры списком", "Number Extractor — extract numbers from text"],
  h1: ["Извлечь числа из текста", "Extract numbers from text"],
  description: [
    "Вытащите все числа из текста списком: целые, дробные, отрицательные, с разделителями разрядов — 1 250 000 и 1,000,000 не разобьются на части. Можно отсортировать.",
    "Pull every number out of a text as a list: integers, decimals, negatives and numbers with thousands separators — 1,000,000 isn’t split into pieces.",
  ],
  lead: ["Все числа из текста — по одному в строке.", "Every number in the text — one per line."],
  keywords: [["цифры из текста", "числа из строки", "вытащить числа"], ["extract numbers", "get digits from text"]],
  howTo: [
    ["Вставьте текст с числами — отчёт, прайс, таблицу.", "Числа появятся списком справа; отметьте «Сортировать», чтобы упорядочить их.", "Скопируйте список, например, чтобы вставить в столбец Excel."],
    ["Paste text containing numbers — a report, price list or table.", "Numbers appear in a list on the right; tick Sort to order them.", "Copy the list, for example into an Excel column."],
  ],
  about: [
    [
      "Число с разделителями разрядов остаётся целым: «1 250 000», «1,000,000» и «1.000.000» — одно число, а не три. Десятичная часть через точку или запятую сохраняется, как и минус.",
      "Цифры внутри слов и кодов (v2, x1) не извлекаются — только отдельные числа.",
    ],
    [
      "A number with thousands separators stays whole: “1,000,000”, “1 250 000” and “1.000.000” are one number each, not three. Decimal parts with a point or comma and minus signs are kept.",
      "Digits inside words and codes (v2, x1) are not extracted — only standalone numbers.",
    ],
  ],
  faq: {
    ru: [
      ["Не разобьётся ли 1 000 000 на три числа?", "Нет. Группы по три цифры через пробел, запятую или точку считаются одним числом."],
      ["Извлекаются ли отрицательные и дробные числа?", "Да: −3, 15,5 и 2.75 извлекаются вместе со знаком минус и дробной частью."],
      ["Как получить сумму чисел?", "Скопируйте список и вставьте в столбец таблицы — Excel и Google Таблицы посчитают сумму функцией СУММ."],
    ],
    en: [
      ["Will 1,000,000 be split into three numbers?", "No. Groups of three digits separated by commas, spaces or dots are treated as one number."],
      ["Are negative and decimal numbers extracted?", "Yes: −3, 15.5 and 2,75 come out with their minus sign and fractional part."],
      ["How do I sum the numbers?", "Copy the list into a spreadsheet column — Excel or Google Sheets will add them with SUM."],
    ],
  },
  example: (s) => extractNumbers(s),
});

export const markdownEditor: ToolDef = {
  slug: "markdown-editor",
  component: "text/markdown",
  icon: "FileCode2",
  popular: true,
  wide: true,
  name: L("Markdown-редактор", "Markdown editor"),
  title: L("Markdown редактор онлайн с предпросмотром", "Markdown Editor Online with Live Preview"),
  h1: L("Markdown-редактор онлайн", "Online Markdown editor"),
  description: L(
    "Пишите в Markdown и сразу видьте результат: таблицы, списки задач, код, зачёркивание. Черновик сохраняется в браузере, экспорт в .md и .html, копирование HTML.",
    "Write Markdown and see the result instantly: tables, task lists, code and strikethrough. The draft is saved in your browser; export to .md or .html.",
  ),
  lead: L("Слева — Markdown, справа — готовый текст; черновик не пропадёт при закрытии вкладки.", "Markdown on the left, the rendered text on the right; the draft survives closing the tab."),
  keywords: LL(["md редактор", "маркдаун", "markdown в html", "предпросмотр markdown"], ["markdown preview", "md editor", "markdown to html"]),
  howTo: LL(
    [
      "Пишите текст в левом поле или откройте файл .md.",
      "Форматируйте кнопками панели или синтаксисом Markdown: **жирный**, # заголовок, - [ ] задача.",
      "Смотрите предпросмотр справа; вид можно переключить на одну колонку.",
      "Скачайте документ в .md или .html либо скопируйте готовый HTML.",
    ],
    [
      "Write in the left pane or open a .md file.",
      "Format with the toolbar or Markdown syntax: **bold**, # heading, - [ ] task.",
      "Watch the preview on the right; switch to a single-column view if you like.",
      "Download the document as .md or .html or copy the ready HTML.",
    ],
  ),
  about: LL(
    [
      "Поддерживается GitHub Flavored Markdown: таблицы, списки задач с галочками, ~~зачёркивание~~, блоки кода с указанием языка и автоссылки. HTML проходит очистку DOMPurify, поэтому вставленные скрипты не выполняются.",
      "Черновик автоматически сохраняется в памяти этого браузера (localStorage) и никуда не отправляется. Внешние картинки в предпросмотре заменяются подписью — страница не делает сетевых запросов, а в экспортированном HTML ссылки на изображения сохраняются.",
    ],
    [
      "GitHub Flavored Markdown is supported: tables, task lists with checkboxes, ~~strikethrough~~, fenced code with a language and autolinks. The HTML is sanitized with DOMPurify, so pasted scripts never run.",
      "The draft is saved automatically in this browser’s storage (localStorage) and never uploaded. Remote images show as a caption in the preview so the page makes no network requests; exported HTML keeps the image links.",
    ],
  ),
  faq: FAQ(
    [
      ["Где хранится мой текст?", "Только в этом браузере (localStorage). Если очистить данные сайта или открыть другой браузер, черновика там не будет — скачайте .md, чтобы сохранить копию."],
      ["Как сделать таблицу?", "Нажмите кнопку таблицы или напишите строки вида | A | B |, а под заголовком — |---|---|."],
      ["Как вставить список задач?", "Строка «- [ ] задача» — пустой флажок, «- [x] задача» — отмеченный."],
      ["Почему не показываются картинки?", "Чтобы страница не загружала ничего из интернета, внешние изображения в предпросмотре заменены подписью. В скачанном HTML они отобразятся."],
    ],
    [
      ["Where is my text stored?", "Only in this browser (localStorage). Clearing site data or switching browsers loses the draft — download a .md to keep a copy."],
      ["How do I make a table?", "Press the table button or write rows like | A | B | with |---|---| under the header."],
      ["How do I add a task list?", "“- [ ] task” is an empty checkbox, “- [x] task” a checked one."],
      ["Why don’t images show?", "To avoid loading anything from the internet, remote images appear as a caption in the preview. They display in the downloaded HTML."],
    ],
  ),
  related: ["word-counter", "remove-html-tags", "typograph"],
};
