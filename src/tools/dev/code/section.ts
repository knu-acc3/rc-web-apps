import type { QA, ToolDef, VariantDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerTools, withRelated } from "@/tools/dev/shared/related";
import { DIALECT_PAGES } from "./content/dialects";
import type { FormatLang, MinifyLang, ValidateLang } from "./lib/langs";

const HUE = 255;
type L = { ru: string; en: string };
type LL = { ru: string[]; en: string[] };

const PRIVATE: L = {
  ru: "Код обрабатывается в вашем браузере в фоновом потоке: ничего не отправляется на сервер, а большой файл не подвешивает вкладку.",
  en: "Code is processed in your browser in a background thread: nothing is sent to a server, and a large file won't freeze the tab.",
};

const howFormat = (label: string, extra: L): LL => ({
  ru: [`Вставьте ${label} в левое поле или откройте файл — отформатированный код появится справа сразу.`, extra.ru, "Скопируйте результат или скачайте файл. При синтаксической ошибке нажмите «Показать в редакторе» — курсор встанет на место ошибки."],
  en: [`Paste ${label} on the left or open a file — the formatted code appears on the right right away.`, extra.en, "Copy the result or download it. On a syntax error, click “Show in editor” to jump to the exact spot."],
});

const howMinify = (label: string): LL => ({
  ru: [`Вставьте ${label} в левое поле или откройте файл.`, "Справа появится сжатый код, ниже — экономия в процентах и размер до и после gzip.", "Скопируйте результат или скачайте файл для продакшена."],
  en: [`Paste ${label} on the left or open a file.`, "The minified code appears on the right, with the savings in percent and the size before and after gzip below.", "Copy the result or download the file for production."],
});

const howValidate = (label: string): LL => ({
  ru: [`Вставьте ${label} или откройте файл — проверка идёт по мере ввода.`, "Если есть ошибка, справа появятся её строка, столбец и фрагмент с указателем ^.", "Нажмите «Показать в редакторе», чтобы перейти к месту ошибки, исправьте её и проверьте предупреждения."],
  en: [`Paste ${label} or open a file — it is checked as you type.`, "If there's an error, its line, column and a snippet with a ^ caret appear on the right.", "Click “Show in editor” to jump to the error, fix it, then review any warnings."],
});

interface Spec {
  slug: string;
  component: "code/json" | "code/format" | "code/minify" | "code/validate";
  props: Record<string, unknown>;
  icon: string;
  popular?: boolean;
  name: L;
  h1: L;
  title: L;
  seoAlt?: ToolDef["seoAlt"];
  description: L;
  lead: L;
  keywords: LL;
  howTo: LL;
  faq: { ru: QA[]; en: QA[] };
  about: L;
  related: string[];
  variants?: ToolDef["variants"];
}

const fmt = (lang: FormatLang) => ({ component: "code/format" as const, props: { lang } });
const min = (lang: MinifyLang) => ({ component: "code/minify" as const, props: { lang } });
const val = (lang: ValidateLang) => ({ component: "code/validate" as const, props: { lang } });

/* ───────────── SQL dialect variants ───────────── */

function dialectVariant(d: (typeof DIALECT_PAGES)[number]): VariantDef {
  const short = d.label.replace(/ \(T-SQL\)$/, "");
  return {
    slug: d.slug,
    name: { ru: short, en: short },
    title: { ru: `Форматирование ${short} запросов онлайн`, en: `${short} Formatter — format ${short} queries online` },
    h1: { ru: `Форматирование ${short} запросов`, en: `${short} formatter` },
    description: fitDescription({
      ru: `Форматирование ${d.label} онлайн с учётом диалекта: ${d.features.ru}. Строки и комментарии не портятся.`,
      en: `Format ${d.label} queries online with dialect-aware parsing: ${d.features.en}. Strings and comments stay intact.`,
    }),
    lead: {
      ru: `Форматтер знает синтаксис ${d.label}: ключевые слова, кавычки для имён и параметры${d.params ? ` вида ${d.params}` : ""}.`,
      en: `The formatter knows ${d.label} syntax: keywords, identifier quoting and${d.params ? ` ${d.params}-style` : ""} parameters.`,
    },
    props: { lang: "sql", dialect: d.id, sample: d.example },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? `Синтаксис ${short}` : `${short} syntax`,
        rows:
          locale === "ru"
            ? [
                ["Диалект", d.label],
                ["Распознаётся", d.features.ru],
                ["Параметры", d.params ? `${d.params} — остаются как есть` : "строки и имена в кавычках не меняются"],
                ["Пример запроса", d.example],
              ]
            : [
                ["Dialect", d.label],
                ["Understands", d.features.en],
                ["Parameters", d.params ? `${d.params} — kept as written` : "strings and quoted names are kept"],
                ["Sample query", d.example],
              ],
      },
    ],
    keywords: { ru: [`${short} форматирование`, `форматирование ${short} запросов`, `${short} formatter`], en: [`${short} formatter`, `format ${short} query`, `${short} beautifier`] },
    faq: {
      ru: [
        { q: `Что учитывается в диалекте ${short}?`, a: `${d.features.ru[0].toUpperCase()}${d.features.ru.slice(1)}. Такие конструкции распознаются как часть языка, а не как ошибки.` },
        {
          q: "Сохранятся ли параметры запроса?",
          a: d.params ? `Да, параметры вида ${d.params} остаются на месте без изменений.` : "Да, текст, который не относится к синтаксису SQL, не меняется; строки и имена в кавычках сохраняются как есть.",
        },
      ],
      en: [
        { q: `What does the ${short} dialect cover?`, a: `${d.features.en[0].toUpperCase()}${d.features.en.slice(1)}. Such constructs are parsed as part of the language, not flagged as errors.` },
        {
          q: "Are query parameters kept?",
          a: d.params ? `Yes, ${d.params}-style parameters stay exactly as written.` : "Yes, strings and quoted identifiers are kept exactly as written.",
        },
      ],
    },
  };
}

/** Trim a generated description to the SEO range by dropping the trailing sentence if needed. */
function fitDescription(d: L): L {
  const fit = (s: string) => (s.length <= 165 ? s : s.slice(0, s.lastIndexOf(". ", 165) + 1) || s.slice(0, 164) + ".");
  return { ru: fit(d.ru), en: fit(d.en) };
}

/* ───────────── tools ───────────── */

const SPECS: Spec[] = [
  {
    slug: "json-formatter",
    component: "code/json",
    props: {},
    icon: "Braces",
    popular: true,
    name: { ru: "Форматирование JSON", en: "JSON formatter" },
    h1: { ru: "Форматирование JSON онлайн", en: "JSON formatter" },
    title: { ru: "Форматирование JSON онлайн — форматтер с деревом и проверкой", en: "JSON Formatter — beautify, validate and view JSON as a tree" },
    description: {
      ru: "Форматирование JSON онлайн: отступы 2/4/табуляция, дерево, сортировка ключей, точная позиция ошибки. Большие числа и дубли ключей не теряются.",
      en: "Format JSON online: 2/4-space or tab indents, a collapsible tree, key sorting and exact error positions. Big numbers and duplicate keys are never lost.",
    },
    lead: { ru: "Вставьте JSON из ответа API или лога — справа появится читаемый JSON с отступами или дерево.", en: "Paste JSON from an API response or a log and get readable, indented JSON or a tree on the right." },
    keywords: { ru: ["json форматтер", "форматирование json", "json в читаемый вид", "json formatter", "json beautifier"], en: ["json formatter", "json beautifier", "pretty print json", "json viewer"] },
    howTo: howFormat("JSON", { ru: "Выберите отступ или «в одну строку», при необходимости включите сортировку ключей и переключитесь на «Дерево».", en: "Choose the indent or “single line”, turn on key sorting if needed and switch to “Tree” to browse." }),
    faq: {
      ru: [
        { q: "Почему число 12345678901234567890 не округляется?", a: "Обычный JSON.parse превращает целые больше 2⁵³ в приближённые значения. Здесь числа хранятся как исходный текст, поэтому ID из баз данных и Twitter копируются цифра в цифру." },
        { q: "Что будет с повторяющимися ключами?", a: "Оба значения сохраняются в выводе, а под редактором появится предупреждение со строкой и столбцом повтора — такие ошибки часто прячутся в больших конфигурациях." },
        { q: "Можно ли вставить JSON с комментариями?", a: "Да: комментарии // и /* */, лишние запятые и строки в одинарных кавычках принимаются, но отмечаются предупреждением, а результат — строгий JSON." },
      ],
      en: [
        { q: "Why isn't 12345678901234567890 rounded?", a: "Plain JSON.parse turns integers above 2⁵³ into approximations. Here numbers are kept as their source text, so database and Twitter IDs are copied digit for digit." },
        { q: "What happens to duplicate keys?", a: "Both values are kept in the output and a warning shows the line and column of the repeat — a common hidden bug in big configs." },
        { q: "Can I paste JSON with comments?", a: "Yes: // and /* */ comments, trailing commas and single-quoted strings are accepted with a warning, and the output is strict JSON." },
      ],
    },
    about: {
      ru: "Дерево раскрывается по требованию: даже у файла на сотни тысяч узлов на экране только открытые ветви. Разбор и форматирование идут в Web Worker, поэтому вкладка не зависает, а новый ввод отменяет старую задачу.",
      en: "The tree expands on demand: even for a file with hundreds of thousands of nodes only open branches are rendered. Parsing and formatting run in a Web Worker, so the tab never freezes and new input cancels the old job.",
    },
    related: ["json-validator", "json-minifier", "json-to-yaml", "json-to-typescript"],
  },
  {
    slug: "json-validator",
    ...val("json"),
    icon: "FileCheck",
    popular: true,
    name: { ru: "Проверка JSON", en: "JSON validator" },
    h1: { ru: "Проверка JSON онлайн", en: "JSON validator" },
    title: { ru: "Проверка JSON онлайн — валидатор с точной позицией ошибки", en: "JSON Validator — find the exact line and column of an error" },
    description: {
      ru: "Проверка JSON онлайн по RFC 8259: строка и столбец ошибки с указателем, предупреждения о дублях ключей и числах больше 2⁵³. Данные не покидают браузер.",
      en: "Validate JSON online against RFC 8259: the error line and column with a caret, warnings for duplicate keys and integers above 2⁵³. Data stays in your browser.",
    },
    lead: { ru: "Строгая проверка JSON: сразу видно, корректен ли документ, а если нет — где именно ошибка.", en: "Strict JSON validation: see at once whether the document is valid and, if not, exactly where it breaks." },
    keywords: { ru: ["проверка json", "json валидатор", "валидация json онлайн", "json validator"], en: ["json validator", "validate json", "json lint", "check json online"] },
    howTo: howValidate("JSON"),
    faq: {
      ru: [
        { q: "Какие ошибки встречаются чаще всего?", a: "Пропущенная запятая между полями, лишняя запятая перед } или ], ключи без двойных кавычек, одинарные кавычки и неэкранированный перенос строки внутри строки." },
        { q: "Почему JSON с комментарием считается ошибкой?", a: "Стандарт JSON не допускает комментариев. Такой текст — JSONC (его понимают VS Code и tsconfig.json), и валидатор подскажет это отдельно." },
        { q: "Зачем предупреждение о больших числах?", a: "JavaScript хранит числа как double: целые больше 9 007 199 254 740 991 после JSON.parse потеряют точность. Передавайте такие ID строками." },
      ],
      en: [
        { q: "What are the most common errors?", a: "A missing comma between fields, a trailing comma before } or ], unquoted keys, single quotes and an unescaped line break inside a string." },
        { q: "Why is JSON with a comment invalid?", a: "The JSON standard has no comments. Such text is JSONC (understood by VS Code and tsconfig.json), and the validator points that out." },
        { q: "Why warn about big numbers?", a: "JavaScript stores numbers as doubles: integers above 9,007,199,254,740,991 lose precision after JSON.parse. Send such IDs as strings." },
      ],
    },
    about: {
      ru: "Позиция считается в символах Юникода, а не в байтах, поэтому совпадает со столбцом в редакторе даже для кириллицы и эмодзи. Повторяющиеся ключи формально допустимы, но разные библиотеки берут разное значение — валидатор показывает каждый повтор.",
      en: "Positions are counted in Unicode characters, not bytes, so they match your editor's column even for non-Latin text and emoji. Duplicate keys are technically allowed, but libraries disagree on which value wins — every repeat is listed.",
    },
    related: ["json-formatter", "yaml-validator", "xml-validator", "json-to-typescript"],
  },
  {
    slug: "json-minifier",
    ...min("json"),
    icon: "Minimize2",
    name: { ru: "Сжатие JSON", en: "JSON minifier" },
    h1: { ru: "Сжатие JSON онлайн", en: "JSON minifier" },
    title: { ru: "Сжатие JSON онлайн — минификатор без потери чисел", en: "JSON Minifier — compact JSON without losing big numbers" },
    description: {
      ru: "Сжатие JSON онлайн: удаляет пробелы и переносы, не трогая значения — длинные числа и 1.10 остаются как были. Показывает экономию и размер после gzip.",
      en: "Minify JSON online: removes whitespace and line breaks without touching values — long numbers and 1.10 stay exact. Shows the savings and the gzip size.",
    },
    lead: { ru: "JSON сворачивается в одну строку без единого лишнего пробела.", en: "JSON collapses to a single line without a single extra space." },
    keywords: { ru: ["сжатие json", "минификация json", "json в одну строку", "json minify"], en: ["json minifier", "minify json", "compact json", "json one line"] },
    howTo: howMinify("JSON"),
    faq: {
      ru: [
        { q: "Меняются ли данные при сжатии?", a: "Нет. Удаляются только пробелы, табуляции и переносы между элементами; строки, числа и порядок ключей остаются байт в байт." },
        { q: "Сколько экономит минификация, если сервер уже сжимает gzip?", a: "Обычно немного: gzip хорошо сжимает повторяющиеся отступы. Сравните обе цифры под результатом — это честная оценка выигрыша." },
        { q: "Принимаются ли комментарии и лишние запятые?", a: "Да, они удаляются: на выходе получается строгий JSON в одну строку." },
      ],
      en: [
        { q: "Does minifying change the data?", a: "No. Only spaces, tabs and line breaks between tokens are removed; strings, numbers and key order stay byte for byte." },
        { q: "Is it worth it if the server already uses gzip?", a: "Usually the gain is small: gzip compresses repeated indentation well. Compare both numbers under the result for an honest estimate." },
        { q: "Are comments and trailing commas accepted?", a: "Yes, they are removed: the output is strict single-line JSON." },
      ],
    },
    about: {
      ru: "Размер gzip считается встроенным в браузер CompressionStream — это тот же алгоритм, которым сжимают ответы веб-серверы.",
      en: "The gzip size is measured with the browser's built-in CompressionStream — the same algorithm web servers use for responses.",
    },
    related: ["json-formatter", "json-validator", "json-escape", "css-minifier"],
  },
  {
    slug: "xml-formatter",
    ...fmt("xml"),
    icon: "CodeXml",
    popular: true,
    name: { ru: "Форматирование XML", en: "XML formatter" },
    h1: { ru: "Форматирование XML онлайн", en: "XML formatter" },
    title: { ru: "Форматирование XML онлайн — красивый XML с отступами", en: "XML Formatter — pretty print XML with DOCTYPE, CDATA and comments" },
    description: {
      ru: "Форматирование XML онлайн: отступы, DOCTYPE, CDATA, комментарии и xml:space=\"preserve\" сохраняются, ошибки — со строкой и столбцом. Работает без сети.",
      en: "Format XML online: indented output that keeps the DOCTYPE, CDATA, comments and xml:space=\"preserve\"; errors show line and column. Works offline.",
    },
    lead: { ru: "XML в одну строку превращается в читаемое дерево тегов с отступами.", en: "Single-line XML becomes a readable, indented tree of tags." },
    keywords: { ru: ["форматирование xml", "xml форматтер", "xml в читаемый вид", "xml formatter"], en: ["xml formatter", "xml pretty print", "xml beautifier", "format xml online"] },
    howTo: howFormat("XML", { ru: "Выберите отступ: 2 или 4 пробела либо табуляцию.", en: "Choose the indent: 2 or 4 spaces or a tab." }),
    faq: {
      ru: [
        { q: "Подходит ли для SOAP, SVG и выгрузок 1С?", a: "Да, форматтер работает с любым корректным XML: SOAP-конвертами, SVG, фидами, CommerceML и конфигурациями." },
        { q: "Что будет с текстом со смешанным содержимым?", a: "Текст рядом с тегами выводится на отдельной строке. Если пробелы значимы, пометьте элемент xml:space=\"preserve\" — его содержимое останется как было." },
        { q: "Можно отформатировать фрагмент без корня?", a: "Да: несколько элементов верхнего уровня форматируются с предупреждением. А вот перепутанные теги считаются ошибкой — вы увидите строку и столбец." },
      ],
      en: [
        { q: "Does it work for SOAP, SVG and data exports?", a: "Yes, any well-formed XML: SOAP envelopes, SVG, feeds and configuration files." },
        { q: "What about mixed content?", a: "Text next to tags goes on its own line. If whitespace matters, mark the element with xml:space=\"preserve\" and its content stays untouched." },
        { q: "Can I format a fragment without a root?", a: "Yes: several top-level elements are formatted with a warning. Mismatched tags, however, are errors shown with line and column." },
      ],
    },
    about: {
      ru: "Перед форматированием XML проверяется собственным парсером: DOCTYPE пропускается без загрузки внешних сущностей, BOM в начале файла убирается, а сообщения об ошибках указывают точное место.",
      en: "Before formatting, the XML is checked by our own parser: the DOCTYPE is skipped without fetching external entities, a leading BOM is removed and errors point to the exact spot.",
    },
    related: ["xml-validator", "xml-minifier", "xml-to-json", "html-formatter"],
  },
  {
    slug: "xml-validator",
    ...val("xml"),
    icon: "FileCheck",
    name: { ru: "Проверка XML", en: "XML validator" },
    h1: { ru: "Проверка XML онлайн", en: "XML validator" },
    title: { ru: "Проверка XML онлайн — валидатор синтаксиса XML", en: "XML Validator — check XML syntax with line and column" },
    description: {
      ru: "Проверка XML онлайн на корректность: незакрытые и перепутанные теги, повторные атрибуты, текст вне корня — с номером строки. DOCTYPE не загружается.",
      en: "Check XML well-formedness online: unclosed or mismatched tags, duplicate attributes, text outside the root — with line numbers. DOCTYPE is never fetched.",
    },
    lead: { ru: "Проверяется синтаксис XML (well-formedness): документ разбирается целиком, как это сделает любой XML-парсер.", en: "Checks XML syntax (well-formedness): the whole document is parsed the way any XML parser would." },
    keywords: { ru: ["проверка xml", "валидатор xml", "xml validator", "проверить xml онлайн"], en: ["xml validator", "validate xml", "xml lint", "check xml online"] },
    howTo: howValidate("XML"),
    faq: {
      ru: [
        { q: "Проверяется ли XML по XSD-схеме?", a: "Нет, только синтаксис: закрытие тегов, кавычки атрибутов, единственный корень, корректные комментарии и CDATA. Проверка по XSD требует самой схемы и выполняется отдельно." },
        { q: "Почему ошибка указывает на закрывающий тег?", a: "Парсер замечает проблему там, где встречает </тег>, не совпадающий с открытым. Сам пропуск чаще всего строкой-двумя выше." },
        { q: "Безопасно ли проверять XML с DOCTYPE?", a: "Да: внешние сущности не загружаются, сеть не используется, поэтому XXE-атаки невозможны." },
      ],
      en: [
        { q: "Is XML validated against an XSD schema?", a: "No, only syntax: closed tags, quoted attributes, a single root, valid comments and CDATA. XSD validation needs the schema itself." },
        { q: "Why does the error point at a closing tag?", a: "The parser notices the problem when it meets a </tag> that doesn't match the open one. The missing tag is usually a line or two above." },
        { q: "Is XML with a DOCTYPE safe to check?", a: "Yes: external entities are never loaded and no network is used, so XXE attacks are impossible." },
      ],
    },
    about: {
      ru: "Под результатом — имя корневого элемента и число элементов, а неизвестные сущности вроде &nbsp; показываются предупреждением: в XML без DTD их нет.",
      en: "Below the result you get the root element and the element count; unknown entities like &nbsp; trigger a warning because XML without a DTD doesn't define them.",
    },
    related: ["xml-formatter", "json-validator", "yaml-validator", "xml-to-json"],
  },
  {
    slug: "xml-minifier",
    ...min("xml"),
    icon: "Minimize2",
    name: { ru: "Сжатие XML", en: "XML minifier" },
    h1: { ru: "Сжатие XML онлайн", en: "XML minifier" },
    title: { ru: "Сжатие XML онлайн — минификатор XML", en: "XML Minifier — remove whitespace and comments from XML" },
    description: {
      ru: "Сжатие XML онлайн: удаляет пробелы между тегами и комментарии, CDATA и текст внутри элементов не трогает. Показывает экономию в байтах и после gzip.",
      en: "Minify XML online: strips whitespace between tags and comments while keeping CDATA and element text intact. Shows byte and gzip savings.",
    },
    lead: { ru: "XML с отступами сворачивается в одну строку для передачи по сети или хранения.", en: "Indented XML collapses to a single line for transfer or storage." },
    keywords: { ru: ["сжатие xml", "минификация xml", "xml в одну строку", "xml minify"], en: ["xml minifier", "minify xml", "compress xml", "xml one line"] },
    howTo: howMinify("XML"),
    faq: {
      ru: [
        { q: "Какие пробелы удаляются?", a: "Только текстовые узлы, целиком состоящие из пробелов и переносов, — то есть отступы между тегами. Текст внутри элементов остаётся как был." },
        { q: "Сохраняются ли объявление <?xml?> и DOCTYPE?", a: "Да, объявление, инструкции обработки, DOCTYPE и CDATA остаются; удаляются только комментарии." },
        { q: "Можно ли сжимать XML со смешанным содержимым?", a: "Осторожно: пробел между двумя тегами внутри абзаца (например, </b> <i>) тоже будет удалён. Для документов с разметкой текста проверьте результат." },
      ],
      en: [
        { q: "Which whitespace is removed?", a: "Only text nodes made entirely of spaces and line breaks — the indentation between tags. Text inside elements is kept as is." },
        { q: "Are the <?xml?> declaration and DOCTYPE kept?", a: "Yes, the declaration, processing instructions, DOCTYPE and CDATA stay; only comments are removed." },
        { q: "Is it safe for mixed content?", a: "Careful: a space between two tags inside a paragraph (like </b> <i>) is removed too. Check the result for text-markup documents." },
      ],
    },
    about: {
      ru: "Перед сжатием XML проверяется парсером, поэтому сломанный документ не превратится в ещё более сломанный — вы увидите ошибку со строкой и столбцом.",
      en: "The XML is parsed before minifying, so a broken document won't silently get worse — you'll see the error with line and column.",
    },
    related: ["xml-formatter", "xml-validator", "html-minifier", "json-minifier"],
  },
  {
    slug: "html-formatter",
    ...fmt("html"),
    icon: "Code",
    popular: true,
    name: { ru: "Форматирование HTML", en: "HTML formatter" },
    h1: { ru: "Форматирование HTML онлайн", en: "HTML formatter" },
    title: { ru: "Форматирование HTML онлайн — HTML beautifier на Prettier", en: "HTML Formatter — beautify HTML with Prettier" },
    description: {
      ru: "Форматирование HTML онлайн на Prettier: отступы, перенос длинных атрибутов, вложенные <style> и <script> тоже форматируются. Ошибки разметки — со строкой.",
      en: "Format HTML online with Prettier: clean indentation, wrapped long attributes, and embedded <style> and <script> formatted too. Markup errors show the line.",
    },
    lead: { ru: "Сжатая или неряшливая разметка превращается в аккуратный HTML с отступами.", en: "Minified or messy markup becomes tidy, indented HTML." },
    keywords: { ru: ["форматирование html", "html beautifier", "html форматтер", "отформатировать html"], en: ["html formatter", "html beautifier", "pretty print html", "format html online"] },
    howTo: howFormat("HTML", { ru: "Выберите отступ и ширину строки — длинные теги переносятся по атрибутам.", en: "Choose the indent and line width — long tags wrap by attribute." }),
    faq: {
      ru: [
        { q: "Не изменится ли внешний вид страницы?", a: "Prettier учитывает CSS-правила пробелов: переносы добавляются только там, где они не влияют на отображение, а рядом со строчными элементами используются хитрые переносы внутри тегов." },
        { q: "Форматируются ли CSS и JavaScript внутри страницы?", a: "Да, содержимое <style> и <script> форматируется по правилам CSS и JavaScript." },
        { q: "Подходит ли для шаблонов Vue, Angular, Blade?", a: "Обычный HTML — да. Синтаксис шаблонизаторов ({{ }}, @if) может форматироваться неточно, так как проверяется как HTML." },
      ],
      en: [
        { q: "Will the page look different?", a: "Prettier respects CSS whitespace rules: line breaks are added only where they don't affect rendering, and next to inline elements breaks go inside tags instead." },
        { q: "Are inline CSS and JavaScript formatted?", a: "Yes, <style> and <script> contents are formatted as CSS and JavaScript." },
        { q: "Does it work for Vue, Angular or Blade templates?", a: "Plain HTML does. Template syntax ({{ }}, @if) may be formatted imperfectly because it is parsed as HTML." },
      ],
    },
    about: {
      ru: "Используется официальная сборка Prettier для браузера — тот же результат, что и у расширения в VS Code с настройками по умолчанию. Prettier и его модули загружаются только при первом форматировании.",
      en: "It uses Prettier's official browser build — the same output as the VS Code extension with default settings. Prettier is loaded only when you first format.",
    },
    related: ["html-minifier", "css-formatter", "javascript-formatter", "html-to-jsx"],
  },
  {
    slug: "html-minifier",
    ...min("html"),
    icon: "Minimize2",
    name: { ru: "Сжатие HTML", en: "HTML minifier" },
    h1: { ru: "Сжатие HTML онлайн", en: "HTML minifier" },
    title: { ru: "Сжатие HTML онлайн — минификатор HTML", en: "HTML Minifier — compress HTML safely" },
    description: {
      ru: "Сжатие HTML онлайн: схлопывает пробелы, удаляет комментарии (кроме условных), сжимает CSS в <style>; <pre>, <textarea> и <script> не портятся.",
      en: "Minify HTML online: collapses whitespace, drops comments (except conditional ones) and minifies <style> CSS; <pre>, <textarea> and <script> stay intact.",
    },
    lead: { ru: "HTML уменьшается без изменения того, как страница выглядит в браузере.", en: "HTML gets smaller without changing how the page looks in the browser." },
    keywords: { ru: ["сжатие html", "минификация html", "html minify", "сжать html онлайн"], en: ["html minifier", "minify html", "compress html", "html compressor"] },
    howTo: howMinify("HTML"),
    faq: {
      ru: [
        { q: "Почему между словами иногда остаётся пробел?", a: "Пробел между строчными элементами (<b>a</b> <i>b</i>) виден на странице, поэтому он сохраняется одним символом. Удаляются пробелы только между блочными тегами." },
        { q: "Что с <pre> и <textarea>?", a: "Их содержимое копируется без изменений: пробелы и переносы в них значимы." },
        { q: "Удаляются ли условные комментарии <!--[if IE]>?", a: "Нет, условные комментарии и комментарии вида <!--! … --> сохраняются всегда. Остальные удаляются, если не включить «Сохранять комментарии»." },
      ],
      en: [
        { q: "Why is a space sometimes kept between words?", a: "A space between inline elements (<b>a</b> <i>b</i>) is visible on the page, so it's kept as one character. Only whitespace between block tags is removed." },
        { q: "What about <pre> and <textarea>?", a: "Their content is copied verbatim: whitespace and line breaks there are significant." },
        { q: "Are <!--[if IE]> conditional comments removed?", a: "No, conditional comments and <!--! … --> comments are always kept. Others are removed unless “Keep comments” is on." },
      ],
    },
    about: {
      ru: "Значения атрибутов не меняются, кавычки не удаляются, а JavaScript внутри <script> не переписывается — только обрезаются пробелы по краям. Это консервативная минификация, которая не ломает страницы.",
      en: "Attribute values are never changed, quotes aren't removed and JavaScript in <script> isn't rewritten — only trimmed. It's conservative minification that won't break pages.",
    },
    related: ["html-formatter", "css-minifier", "javascript-minifier", "html-encode"],
  },
  {
    slug: "css-formatter",
    ...fmt("css"),
    icon: "Paintbrush",
    popular: true,
    name: { ru: "Форматирование CSS", en: "CSS formatter" },
    h1: { ru: "Форматирование CSS онлайн", en: "CSS formatter" },
    title: { ru: "Форматирование CSS онлайн — CSS beautifier на Prettier", en: "CSS Formatter — beautify CSS with Prettier" },
    description: {
      ru: "Форматирование CSS онлайн на Prettier: каждое свойство на своей строке, отступы в @media и вложенных правилах, единые кавычки и пробелы. Ошибки — со строкой.",
      en: "Format CSS online with Prettier: one declaration per line, indented @media and nested rules, consistent quotes and spacing. Syntax errors show the line.",
    },
    lead: { ru: "Минифицированный CSS из продакшена снова становится читаемым.", en: "Minified production CSS becomes readable again." },
    keywords: { ru: ["форматирование css", "css beautifier", "css форматтер", "развернуть css"], en: ["css formatter", "css beautifier", "unminify css", "pretty print css"] },
    howTo: howFormat("CSS", { ru: "Выберите отступ и ширину строки — длинные селекторы и значения переносятся.", en: "Choose the indent and line width — long selectors and values wrap." }),
    faq: {
      ru: [
        { q: "Меняет ли форматтер значения свойств?", a: "Нет, только пробелы и переносы; числа вроде .5 приводятся к 0.5, а цвета и имена остаются как есть." },
        { q: "Поддерживается ли вложенность CSS (&:hover)?", a: "Да, современная вложенность CSS, @container, @layer и :has() форматируются корректно." },
        { q: "Как развернуть минифицированный CSS?", a: "Вставьте его целиком — Prettier разнесёт каждое правило и свойство на отдельные строки." },
      ],
      en: [
        { q: "Does it change property values?", a: "No, only whitespace and line breaks; numbers like .5 become 0.5, while colors and names stay as they are." },
        { q: "Is CSS nesting (&:hover) supported?", a: "Yes, modern CSS nesting, @container, @layer and :has() are formatted correctly." },
        { q: "How do I unminify CSS?", a: "Paste it all — Prettier puts every rule and declaration on its own line." },
      ],
    },
    about: {
      ru: "Prettier для CSS основан на PostCSS: он понимает всё, что понимает браузер, и не пытается «исправлять» код — только оформляет.",
      en: "Prettier's CSS support is built on PostCSS: it understands everything browsers do and never tries to “fix” code — it only lays it out.",
    },
    related: ["css-minifier", "scss-formatter", "less-formatter", "html-formatter"],
  },
  {
    slug: "css-minifier",
    ...min("css"),
    icon: "Minimize2",
    popular: true,
    name: { ru: "Сжатие CSS", en: "CSS minifier" },
    h1: { ru: "Сжатие CSS онлайн", en: "CSS minifier" },
    title: { ru: "Сжатие CSS онлайн — минификатор CSS с размером gzip", en: "CSS Minifier — minify CSS and see the gzip size" },
    description: {
      ru: "Сжатие CSS онлайн без поломок: calc(), строки, url(), :is() и регистр #ID сохраняются, /*! лицензии */ остаются. Показывает размер до и после gzip.",
      en: "Minify CSS online without breaking it: calc(), strings, url(), :is() and #ID case are preserved, /*! licenses */ kept. Shows the size before and after gzip.",
    },
    lead: { ru: "CSS сжимается токенизатором, который понимает синтаксис, а не заменами по шаблону.", en: "CSS is minified by a tokenizer that understands the syntax, not by pattern replacements." },
    keywords: { ru: ["сжатие css", "минификация css", "css minify", "сжать css онлайн"], en: ["css minifier", "minify css", "compress css", "css compressor"] },
    howTo: howMinify("CSS"),
    faq: {
      ru: [
        { q: "Почему в calc() остались пробелы?", a: "В calc(100% - 10px) пробелы вокруг + и - обязательны: без них выражение станет недействительным. Минификатор сохраняет их, а лишние удаляет." },
        { q: "Не сломается ли «a :hover»?", a: "Нет. Пробел перед :hover — это комбинатор потомка, он меняет смысл селектора, поэтому сохраняется. Так же сохраняются строки, url() и значения пользовательских свойств --var." },
        { q: "Добавляет ли минификатор вендорные префиксы?", a: "Нет, код не переписывается: ни префиксов, ни переименований, ни объединения правил. Для префиксов используйте Autoprefixer в сборке." },
      ],
      en: [
        { q: "Why are there spaces left inside calc()?", a: "In calc(100% - 10px) the spaces around + and - are required: without them the expression is invalid. They're kept; everything extra goes." },
        { q: "Will “a :hover” break?", a: "No. The space before :hover is a descendant combinator that changes the selector, so it's kept. Strings, url() and --custom-property values are kept too." },
        { q: "Does it add vendor prefixes?", a: "No, code isn't rewritten: no prefixes, renaming or rule merging. Use Autoprefixer in your build for prefixes." },
      ],
    },
    about: {
      ru: "Регистр не меняется (#MyId и .Class остаются как были), комментарии /*! … */ с лицензиями сохраняются по умолчанию. Размер gzip показывает, сколько реально сэкономит сжатие на сервере.",
      en: "Case is never changed (#MyId and .Class stay as written) and /*! … */ license comments are kept by default. The gzip size shows the real saving over the wire.",
    },
    related: ["css-formatter", "html-minifier", "javascript-minifier", "json-minifier"],
  },
  {
    slug: "scss-formatter",
    ...fmt("scss"),
    icon: "Paintbrush",
    name: { ru: "Форматирование SCSS", en: "SCSS formatter" },
    h1: { ru: "Форматирование SCSS онлайн", en: "SCSS formatter" },
    title: { ru: "Форматирование SCSS онлайн — SCSS beautifier на Prettier", en: "SCSS Formatter — beautify Sass SCSS code" },
    description: {
      ru: "Форматирование SCSS онлайн на Prettier: вложенные правила, миксины @mixin/@include, переменные $ и карты с аккуратными отступами. Ошибки — со строкой.",
      en: "Format SCSS online with Prettier: nested rules, @mixin/@include, $variables and maps with tidy indentation. Syntax errors show the line and column.",
    },
    lead: { ru: "SCSS-стили приводятся к единому стилю: одно свойство — одна строка, вложенность — отступами.", en: "SCSS is brought to one consistent style: one declaration per line, nesting by indentation." },
    keywords: { ru: ["форматирование scss", "scss beautifier", "scss форматтер", "sass formatter"], en: ["scss formatter", "scss beautifier", "sass formatter", "format scss online"] },
    howTo: howFormat("SCSS", { ru: "Выберите отступ и ширину строки.", en: "Choose the indent and line width." }),
    faq: {
      ru: [
        { q: "Поддерживается ли синтаксис .sass с отступами?", a: "Нет, только SCSS с фигурными скобками. Старый синтаксис .sass без скобок Prettier не форматирует." },
        { q: "Сохраняются ли комментарии //?", a: "Да, однострочные и многострочные комментарии остаются на своих местах." },
        { q: "Форматируются ли @each, @if и карты?", a: "Да, управляющие директивы и карты ($map: (key: value)) форматируются с отступами." },
      ],
      en: [
        { q: "Is the indented .sass syntax supported?", a: "No, only SCSS with braces. Prettier doesn't format the older brace-less .sass syntax." },
        { q: "Are // comments kept?", a: "Yes, single-line and block comments stay where they are." },
        { q: "Are @each, @if and maps formatted?", a: "Yes, control directives and maps ($map: (key: value)) are indented properly." },
      ],
    },
    about: {
      ru: "Форматирование выполняет Prettier в браузере: результат совпадает с тем, что даст prettier --write в проекте с настройками по умолчанию.",
      en: "Formatting is done by Prettier in the browser: the output matches prettier --write in a project with default settings.",
    },
    related: ["css-formatter", "less-formatter", "css-minifier"],
  },
  {
    slug: "less-formatter",
    ...fmt("less"),
    icon: "Paintbrush",
    name: { ru: "Форматирование Less", en: "Less formatter" },
    h1: { ru: "Форматирование Less онлайн", en: "Less formatter" },
    title: { ru: "Форматирование Less онлайн — Less beautifier на Prettier", en: "Less Formatter — beautify Less CSS code" },
    description: {
      ru: "Форматирование Less онлайн на Prettier: переменные @, миксины, вложенность и операции выравниваются по единому стилю. Ошибки синтаксиса — со строкой.",
      en: "Format Less online with Prettier: @variables, mixins, nesting and operations laid out in one consistent style. Syntax errors show the line and column.",
    },
    lead: { ru: "Less-стили получают единые отступы и по одному свойству на строку.", en: "Less styles get consistent indentation and one declaration per line." },
    keywords: { ru: ["форматирование less", "less beautifier", "less форматтер"], en: ["less formatter", "less beautifier", "format less online"] },
    howTo: howFormat("Less", { ru: "Выберите отступ и ширину строки.", en: "Choose the indent and line width." }),
    faq: {
      ru: [
        { q: "Поддерживаются ли миксины с параметрами и guards?", a: "Да, .mixin(@a; @b), when-условия и вызовы миксинов форматируются корректно." },
        { q: "Сохраняются ли операции вроде @a * 2?", a: "Да, выражения не вычисляются — меняются только пробелы вокруг операторов." },
        { q: "Нужен ли Node.js?", a: "Нет, Prettier работает прямо в браузере; ничего устанавливать не нужно." },
      ],
      en: [
        { q: "Are parametric mixins and guards supported?", a: "Yes, .mixin(@a; @b), when guards and mixin calls are formatted correctly." },
        { q: "Are operations like @a * 2 kept?", a: "Yes, expressions aren't evaluated — only whitespace around operators changes." },
        { q: "Do I need Node.js?", a: "No, Prettier runs right in the browser; nothing to install." },
      ],
    },
    about: {
      ru: "Less по-прежнему живёт в проектах на Bootstrap 3 и Ant Design — форматтер помогает привести такие стили к порядку перед рефакторингом.",
      en: "Less still lives in Bootstrap 3 and Ant Design projects — the formatter helps tidy such styles before a refactor.",
    },
    related: ["css-formatter", "scss-formatter", "css-minifier"],
  },
  {
    slug: "javascript-formatter",
    ...fmt("javascript"),
    icon: "FileCode",
    popular: true,
    name: { ru: "Форматирование JavaScript", en: "JavaScript formatter" },
    h1: { ru: "Форматирование JavaScript онлайн", en: "JavaScript formatter" },
    title: { ru: "Форматирование JavaScript онлайн — JS beautifier на Prettier", en: "JavaScript Formatter — beautify JS with Prettier" },
    description: {
      ru: "Форматирование JavaScript онлайн на Prettier: ES2024, JSX, async/await; выбор отступа, кавычек и точек с запятой. Ошибки синтаксиса — со строкой и столбцом.",
      en: "Format JavaScript online with Prettier: ES2024, JSX and async/await; choose indentation, quotes and semicolons. Syntax errors show line and column.",
    },
    lead: { ru: "Сжатый или неаккуратный JavaScript превращается в читаемый код в стиле Prettier.", en: "Minified or messy JavaScript becomes readable code in Prettier style." },
    keywords: { ru: ["форматирование javascript", "js beautifier", "форматирование js", "js форматтер"], en: ["javascript formatter", "js beautifier", "js formatter", "prettier online"] },
    howTo: howFormat("JavaScript", { ru: "Выберите отступ, ширину строки, кавычки и точки с запятой — как в вашем .prettierrc.", en: "Choose indentation, line width, quotes and semicolons — like in your .prettierrc." }),
    faq: {
      ru: [
        { q: "Можно ли распаковать минифицированный код?", a: "Отступы и переносы вернутся, но короткие имена вроде a, b, c останутся: восстановить исходные имена без source map невозможно." },
        { q: "Поддерживается ли JSX?", a: "Да, парсер Babel понимает JSX, поэтому компоненты React форматируются без дополнительных настроек." },
        { q: "Что делает опция «Точка с запятой»?", a: "Выключенная — убирает ; в конце инструкций там, где это безопасно, и добавляет ; в начало строки, если без неё код поменял бы смысл." },
      ],
      en: [
        { q: "Can it unminify code?", a: "Indentation and line breaks come back, but short names like a, b, c stay: original names can't be recovered without a source map." },
        { q: "Is JSX supported?", a: "Yes, the Babel parser understands JSX, so React components format without extra settings." },
        { q: "What does the Semicolons option do?", a: "Turned off, it removes ; at statement ends where safe and adds a leading ; where the code would otherwise change meaning." },
      ],
    },
    about: {
      ru: "Работает официальная браузерная сборка Prettier с парсером Babel. Модули загружаются при первом форматировании и выполняются в фоновом потоке, так что даже большие бандлы не подвешивают вкладку.",
      en: "It runs Prettier's official browser build with the Babel parser. Modules load on first use and run in a background thread, so even large bundles don't freeze the tab.",
    },
    related: ["javascript-minifier", "typescript-formatter", "json-formatter", "regex"],
  },
  {
    slug: "javascript-minifier",
    ...min("javascript"),
    icon: "Minimize2",
    name: { ru: "Сжатие JavaScript", en: "JavaScript minifier" },
    h1: { ru: "Сжатие JavaScript онлайн", en: "JavaScript minifier" },
    title: { ru: "Сжатие JavaScript онлайн — удаление пробелов и комментариев", en: "JavaScript Minifier — strip whitespace and comments safely" },
    description: {
      ru: "Сжатие JavaScript онлайн: удаляет комментарии и лишние пробелы с учётом строк, шаблонов, регулярных выражений и ASI. Имена не меняются — код не ломается.",
      en: "Minify JavaScript online: strips comments and extra whitespace while respecting strings, templates, regex literals and ASI. No renaming, so code won't break.",
    },
    lead: { ru: "Безопасная минификация: только пробелы и комментарии, без переименования переменных.", en: "Safe minification: whitespace and comments only, no variable renaming." },
    keywords: { ru: ["сжатие javascript", "минификация js", "js minify", "сжать js онлайн"], en: ["javascript minifier", "minify js", "js minify", "js compressor"] },
    howTo: howMinify("JavaScript"),
    faq: {
      ru: [
        { q: "Почему в результате остались переносы строк?", a: "Там, где перенос завершает инструкцию (код без точек с запятой, return, ++), его удаление изменило бы смысл. Минификатор оставляет такие переносы." },
        { q: "Чем это отличается от Terser или esbuild?", a: "Terser и esbuild ещё переименовывают переменные и удаляют мёртвый код — так получается меньше, но нужна сборка. Здесь только пробелы и комментарии, зато результат гарантированно работает так же." },
        { q: "Поддерживаются ли JSX и TypeScript?", a: "Нет: пробелы в тексте JSX значимы, а TypeScript нужно сначала скомпилировать. Минифицируйте уже собранный JavaScript." },
      ],
      en: [
        { q: "Why are some line breaks left?", a: "Where a line break ends a statement (semicolon-less code, return, ++), removing it would change the meaning, so it's kept." },
        { q: "How is this different from Terser or esbuild?", a: "Terser and esbuild also rename variables and drop dead code — smaller output, but you need a build. This only strips whitespace and comments, so behaviour is guaranteed unchanged." },
        { q: "Are JSX and TypeScript supported?", a: "No: whitespace in JSX text matters and TypeScript must be compiled first. Minify the built JavaScript." },
      ],
    },
    about: {
      ru: "Код разбирается токенизатором: строки, шаблоны `…${…}…`, регулярные выражения и деление различаются так же, как в движке JavaScript. Комментарии /*! … */ и @license сохраняются по умолчанию.",
      en: "Code goes through a tokenizer that tells strings, `…${…}…` templates, regex literals and division apart like a JavaScript engine. /*! … */ and @license comments are kept by default.",
    },
    related: ["javascript-formatter", "css-minifier", "html-minifier", "json-minifier"],
  },
  {
    slug: "typescript-formatter",
    ...fmt("typescript"),
    icon: "FileType",
    name: { ru: "Форматирование TypeScript", en: "TypeScript formatter" },
    h1: { ru: "Форматирование TypeScript онлайн", en: "TypeScript formatter" },
    title: { ru: "Форматирование TypeScript онлайн — Prettier для TS", en: "TypeScript Formatter — format TS code with Prettier" },
    description: {
      ru: "Форматирование TypeScript онлайн на Prettier: интерфейсы, дженерики, декораторы и TSX; выбор отступа, кавычек и точек с запятой. Ошибки — со строкой.",
      en: "Format TypeScript online with Prettier: interfaces, generics, decorators and TSX; choose indentation, quotes and semicolons. Syntax errors show the line.",
    },
    lead: { ru: "TypeScript-код оформляется так же, как это сделает Prettier в вашем редакторе.", en: "TypeScript is laid out exactly as Prettier in your editor would." },
    keywords: { ru: ["форматирование typescript", "ts formatter", "typescript beautifier"], en: ["typescript formatter", "ts formatter", "typescript beautifier", "format ts online"] },
    howTo: howFormat("TypeScript", { ru: "Выберите отступ, ширину строки, кавычки и точки с запятой.", en: "Choose indentation, line width, quotes and semicolons." }),
    faq: {
      ru: [
        { q: "Проверяются ли типы?", a: "Нет, форматтер проверяет только синтаксис. Ошибки типов показывает компилятор tsc или редактор." },
        { q: "Поддерживается ли TSX?", a: "Да, компоненты React на TypeScript форматируются так же, как обычный TS." },
        { q: "Совпадёт ли результат с Prettier в проекте?", a: "Да, если в проекте настройки по умолчанию. Отступ, ширина строки, кавычки и точки с запятой задаются здесь теми же опциями." },
      ],
      en: [
        { q: "Are types checked?", a: "No, only syntax is checked. Type errors come from tsc or your editor." },
        { q: "Is TSX supported?", a: "Yes, React components in TypeScript are formatted like regular TS." },
        { q: "Will it match Prettier in my project?", a: "Yes, with default settings. Indentation, line width, quotes and semicolons map to the same options." },
      ],
    },
    about: {
      ru: "Используется парсер typescript-estree из Prettier, поэтому поддерживаются все современные конструкции: satisfies, enum, abstract-классы и декораторы.",
      en: "It uses Prettier's typescript-estree parser, so every modern construct is supported: satisfies, enums, abstract classes and decorators.",
    },
    related: ["javascript-formatter", "json-to-typescript", "graphql-formatter"],
  },
  {
    slug: "markdown-formatter",
    ...fmt("markdown"),
    icon: "FileText",
    name: { ru: "Форматирование Markdown", en: "Markdown formatter" },
    h1: { ru: "Форматирование Markdown онлайн", en: "Markdown formatter" },
    title: { ru: "Форматирование Markdown онлайн — таблицы, списки, заголовки", en: "Markdown Formatter — tidy lists, headings and tables" },
    description: {
      ru: "Форматирование Markdown онлайн на Prettier: единые маркеры списков, выровненные таблицы, заголовки # и пустые строки по стандарту CommonMark и GFM.",
      en: "Format Markdown online with Prettier: consistent list markers, aligned tables, # headings and blank lines per CommonMark and GitHub Flavored Markdown.",
    },
    lead: { ru: "README и документация приводятся к единому стилю, таблицы выравниваются по колонкам.", en: "READMEs and docs get one consistent style, and tables are aligned by column." },
    keywords: { ru: ["форматирование markdown", "markdown formatter", "выровнять таблицу markdown"], en: ["markdown formatter", "markdown beautifier", "format markdown table"] },
    howTo: howFormat("Markdown", { ru: "Выберите отступ для вложенных списков.", en: "Choose the indent for nested lists." }),
    faq: {
      ru: [
        { q: "Меняется ли текст?", a: "Нет, меняется только разметка: маркеры списков, пустые строки, выравнивание таблиц и экранирование. Переносы внутри абзацев сохраняются." },
        { q: "Выравниваются ли таблицы с кириллицей?", a: "Да, ширина колонок считается по символам, поэтому таблицы с русским текстом выравниваются ровно." },
        { q: "Форматируется ли код в блоках ```?", a: "Нет, содержимое блоков кода остаётся как есть." },
      ],
      en: [
        { q: "Is the text changed?", a: "No, only markup: list markers, blank lines, table alignment and escaping. Line breaks inside paragraphs are kept." },
        { q: "Are tables with wide characters aligned?", a: "Yes, column widths are measured in characters, so tables line up." },
        { q: "Is code inside ``` blocks formatted?", a: "No, code block contents stay as they are." },
      ],
    },
    about: {
      ru: "Prettier следует CommonMark и расширениям GitHub (таблицы, списки задач, зачёркивание), поэтому результат одинаково отображается на GitHub, GitLab и в генераторах документации.",
      en: "Prettier follows CommonMark plus GitHub extensions (tables, task lists, strikethrough), so the result renders the same on GitHub, GitLab and docs generators.",
    },
    related: ["csv-to-markdown", "html-formatter", "yaml-formatter"],
  },
  {
    slug: "yaml-formatter",
    ...fmt("yaml"),
    icon: "FileCog",
    name: { ru: "Форматирование YAML", en: "YAML formatter" },
    h1: { ru: "Форматирование YAML онлайн", en: "YAML formatter" },
    title: { ru: "Форматирование YAML онлайн — отступы и списки", en: "YAML Formatter — fix indentation and tidy YAML" },
    description: {
      ru: "Форматирование YAML онлайн на Prettier: выравнивает отступы, списки и flow-коллекции, сохраняя комментарии, якоря и многодокументные файлы. Ошибки — со строкой.",
      en: "Format YAML online with Prettier: fixes indentation, lists and flow collections while keeping comments, anchors and multi-document files. Errors show the line.",
    },
    lead: { ru: "docker-compose, Kubernetes-манифесты и конфиги CI приводятся к аккуратным отступам.", en: "docker-compose files, Kubernetes manifests and CI configs get clean indentation." },
    keywords: { ru: ["форматирование yaml", "yaml formatter", "выровнять yaml", "yaml beautifier"], en: ["yaml formatter", "yaml beautifier", "format yaml online", "yaml pretty print"] },
    howTo: howFormat("YAML", { ru: "Выберите отступ: 2 или 4 пробела (табуляция в YAML запрещена и заменяется пробелами).", en: "Choose 2 or 4 spaces (tabs aren't allowed in YAML indentation)." }),
    faq: {
      ru: [
        { q: "Сохраняются ли комментарии?", a: "Да, в отличие от конвертации через JSON, Prettier сохраняет комментарии, якоря &, ссылки * и порядок ключей." },
        { q: "Почему нельзя выбрать табуляцию?", a: "Спецификация YAML запрещает табуляцию в отступах. При выборе табуляции отступы всё равно будут пробелами." },
        { q: "Как проверить YAML на ошибки?", a: "Форматтер сообщит о синтаксической ошибке со строкой. Для подробной проверки с предупреждениями о yes/no откройте валидатор YAML." },
      ],
      en: [
        { q: "Are comments kept?", a: "Yes, unlike round-tripping through JSON, Prettier keeps comments, & anchors, * aliases and key order." },
        { q: "Why can't I use tabs?", a: "The YAML spec forbids tabs for indentation. Choosing tab still produces spaces." },
        { q: "How do I check YAML for errors?", a: "The formatter reports syntax errors with the line. For deeper checks, including yes/no warnings, use the YAML validator." },
      ],
    },
    about: {
      ru: "Строки не берутся в кавычки и не переписываются — меняются только отступы, пробелы и оформление списков, поэтому смысл документа остаётся прежним.",
      en: "Strings aren't requoted or rewritten — only indentation, spacing and list layout change, so the document means exactly the same.",
    },
    related: ["yaml-validator", "yaml-to-json", "json-to-yaml"],
  },
  {
    slug: "yaml-validator",
    ...val("yaml"),
    icon: "FileCheck",
    name: { ru: "Проверка YAML", en: "YAML validator" },
    h1: { ru: "Проверка YAML онлайн", en: "YAML validator" },
    title: { ru: "Проверка YAML онлайн — валидатор YAML с номером строки", en: "YAML Validator — check YAML syntax and find errors" },
    description: {
      ru: "Проверка YAML онлайн: синтаксис, отступы, табуляция, дубли ключей — со строкой и столбцом. Предупреждает о yes/no/on/off, которые YAML 1.1 читает как bool.",
      en: "Validate YAML online: syntax, indentation, tabs and duplicate keys with line and column. Warns about yes/no/on/off that YAML 1.1 reads as booleans.",
    },
    lead: { ru: "YAML проверяется полноценным парсером: ошибки отступов и дубли ключей находятся до деплоя.", en: "YAML is checked by a full parser: indentation errors and duplicate keys are caught before deploy." },
    keywords: { ru: ["проверка yaml", "yaml валидатор", "yaml validator", "проверить yaml онлайн"], en: ["yaml validator", "yaml lint", "validate yaml", "check yaml online"] },
    howTo: howValidate("YAML"),
    faq: {
      ru: [
        { q: "Почему «NO» помечено предупреждением?", a: "PyYAML, старые версии Ansible и многие инструменты читают YAML 1.1, где NO, yes, on и off — логические значения. Код страны Норвегии станет false. Возьмите такие строки в кавычки." },
        { q: "Считаются ли дубли ключей ошибкой?", a: "Да: по спецификации ключи в словаре уникальны, и js-yaml, как и большинство парсеров, отвергает повтор." },
        { q: "Проверяется ли схема Kubernetes или docker-compose?", a: "Нет, только синтаксис YAML. Опечатка в имени поля (imagee:) синтаксически корректна." },
      ],
      en: [
        { q: "Why is “NO” flagged?", a: "PyYAML, older Ansible and many tools read YAML 1.1, where NO, yes, on and off are booleans — Norway's country code becomes false. Quote such strings." },
        { q: "Are duplicate keys errors?", a: "Yes: the spec requires unique mapping keys, and js-yaml, like most parsers, rejects repeats." },
        { q: "Is the Kubernetes or docker-compose schema checked?", a: "No, only YAML syntax. A typo in a field name (imagee:) is still valid YAML." },
      ],
    },
    about: {
      ru: "Проверка выполняется библиотекой js-yaml по схеме YAML 1.2; многодокументные файлы с --- проверяются целиком, а под результатом указано число документов.",
      en: "Validation uses js-yaml with the YAML 1.2 schema; multi-document files with --- are checked in full and the document count is shown.",
    },
    related: ["yaml-formatter", "yaml-to-json", "json-validator", "xml-validator"],
  },
  {
    slug: "graphql-formatter",
    ...fmt("graphql"),
    icon: "Network",
    name: { ru: "Форматирование GraphQL", en: "GraphQL formatter" },
    h1: { ru: "Форматирование GraphQL онлайн", en: "GraphQL formatter" },
    title: { ru: "Форматирование GraphQL онлайн — запросы и схемы", en: "GraphQL Formatter — format queries and schemas" },
    description: {
      ru: "Форматирование GraphQL онлайн на Prettier: запросы, мутации, фрагменты, директивы и схемы SDL с аккуратными отступами. Ошибки синтаксиса — со строкой.",
      en: "Format GraphQL online with Prettier: queries, mutations, fragments, directives and SDL schemas with tidy indentation. Syntax errors show the line.",
    },
    lead: { ru: "Запрос в одну строку из логов или DevTools превращается в читаемое дерево полей.", en: "A one-line query from logs or DevTools becomes a readable tree of fields." },
    keywords: { ru: ["форматирование graphql", "graphql formatter", "graphql beautifier"], en: ["graphql formatter", "graphql beautifier", "format graphql query", "graphql prettify"] },
    howTo: howFormat("GraphQL", { ru: "Выберите отступ и ширину строки — длинные списки аргументов переносятся.", en: "Choose the indent and line width — long argument lists wrap." }),
    faq: {
      ru: [
        { q: "Форматируются ли схемы (SDL)?", a: "Да: type, input, enum, interface, union, директивы и описания в тройных кавычках." },
        { q: "Проверяется ли запрос по схеме?", a: "Нет, только синтаксис GraphQL. Существование полей проверяет сервер или IDE со схемой." },
        { q: "Как быть с запросом из JSON-тела?", a: "Скопируйте значение поля query без кавычек и экранирования \\n или сначала раскодируйте JSON-строку." },
      ],
      en: [
        { q: "Are schemas (SDL) formatted?", a: "Yes: type, input, enum, interface, union, directives and triple-quoted descriptions." },
        { q: "Is the query validated against a schema?", a: "No, only GraphQL syntax. Field existence is checked by the server or a schema-aware IDE." },
        { q: "What about a query inside a JSON body?", a: "Copy the query field value without quotes and \\n escapes, or unescape the JSON string first." },
      ],
    },
    about: {
      ru: "Переменные, фрагменты (...on Type) и директивы @include/@skip сохраняются без изменений — меняются только пробелы и переносы.",
      en: "Variables, fragments (...on Type) and @include/@skip directives are kept as is — only whitespace and line breaks change.",
    },
    related: ["typescript-formatter", "json-formatter", "javascript-formatter"],
  },
  {
    slug: "sql-formatter",
    seoAlt: { ru: ["форматтер SQL-запросов", "SQL форматтер", "форматтер"], en: ["SQL query formatter", "SQL formatter", "formatter"] },
    ...fmt("sql"),
    icon: "Database",
    popular: true,
    name: { ru: "Форматирование SQL", en: "SQL formatter" },
    h1: { ru: "Форматирование SQL онлайн", en: "SQL formatter" },
    title: { ru: "Форматирование SQL онлайн — форматтер запросов для 20 диалектов", en: "SQL Formatter — format SQL queries for 20 dialects" },
    description: {
      ru: "Форматирование SQL онлайн: 20 диалектов (PostgreSQL, MySQL, T-SQL, Oracle, BigQuery…), ключевые слова заглавными, строки и комментарии не портятся.",
      en: "Format SQL online for 20 dialects (PostgreSQL, MySQL, T-SQL, Oracle, BigQuery…): uppercase keywords, readable indentation, strings and comments untouched.",
    },
    lead: { ru: "Длинный запрос в одну строку превращается в читаемый SQL: каждое предложение с новой строки, условия — с отступом.", en: "A long one-line query becomes readable SQL: each clause on its own line, conditions indented." },
    keywords: { ru: ["форматирование sql", "sql форматтер", "форматирование sql запроса онлайн", "sql formatter"], en: ["sql formatter", "sql beautifier", "format sql query", "sql pretty print"] },
    howTo: howFormat("SQL", { ru: "Выберите диалект вашей базы, регистр ключевых слов и отступ.", en: "Choose your database dialect, keyword case and indentation." }),
    faq: {
      ru: [
        { q: "Почему важно выбрать диалект?", a: "Диалекты отличаются кавычками (`имя` в MySQL, [имя] в SQL Server), параметрами ($1, :name, @id) и ключевыми словами. С правильным диалектом такие конструкции не считаются ошибками." },
        { q: "Не испортятся ли строки и комментарии?", a: "Нет: пробелы внутри 'строк' сохраняются, комментарии -- и /* */ остаются на своих местах, а имена в кавычках не переводятся в верхний регистр." },
        { q: "Разбивается ли BETWEEN … AND на две строки?", a: "Нет, BETWEEN 1 AND 5 остаётся одним условием, а переносятся только логические AND и OR между условиями." },
      ],
      en: [
        { q: "Why pick a dialect?", a: "Dialects differ in quoting (`name` in MySQL, [name] in SQL Server), parameters ($1, :name, @id) and keywords. With the right dialect such constructs aren't treated as errors." },
        { q: "Are strings and comments safe?", a: "Yes: spaces inside 'strings' are kept, -- and /* */ comments stay in place, and quoted identifiers are never uppercased." },
        { q: "Is BETWEEN … AND split across lines?", a: "No, BETWEEN 1 AND 5 stays one condition; only the logical AND and OR between conditions go to new lines." },
      ],
    },
    about: {
      ru: "Форматирование выполняет библиотека sql-formatter с грамматикой для каждого диалекта. Несколько запросов через ; разделяются пустой строкой, а ошибка разбора показывает строку и столбец.",
      en: "Formatting uses the sql-formatter library with a grammar per dialect. Several statements separated by ; get a blank line between them, and parse errors show line and column.",
    },
    related: ["sql-minifier", "json-formatter", "csv-to-json", "regex"],
    variants: { title: { ru: "Форматирование по диалектам", en: "Formatters by dialect" }, list: () => DIALECT_PAGES.map(dialectVariant), limit: DIALECT_PAGES.length },
  },
  {
    slug: "sql-minifier",
    ...min("sql"),
    icon: "Minimize2",
    name: { ru: "Сжатие SQL", en: "SQL minifier" },
    h1: { ru: "Сжатие SQL онлайн", en: "SQL minifier" },
    title: { ru: "Сжатие SQL онлайн — SQL-запрос в одну строку", en: "SQL Minifier — SQL query to one line" },
    description: {
      ru: "Сжатие SQL онлайн: запрос в одну строку без комментариев и лишних пробелов; строки, идентификаторы в кавычках, хинты /*+ */ и тела $$ … $$ сохраняются.",
      en: "Minify SQL online: a query on one line without comments or extra whitespace; strings, quoted identifiers, /*+ */ hints and $$ … $$ bodies are kept.",
    },
    lead: { ru: "Многострочный запрос сворачивается в одну строку — для кода, логов и конфигов.", en: "A multi-line query collapses to one line — for code, logs and configs." },
    keywords: { ru: ["сжатие sql", "sql в одну строку", "минификация sql", "sql minify"], en: ["sql minifier", "minify sql", "sql one line", "compress sql query"] },
    howTo: howMinify("SQL"),
    faq: {
      ru: [
        { q: "Сохраняются ли пробелы внутри строк?", a: "Да, строки в одинарных кавычках, имена в \"двойных\", `обратных` и [квадратных] скобках копируются как есть." },
        { q: "Что с комментариями?", a: "Комментарии -- и /* */ удаляются. Исключения — подсказки оптимизатора /*+ … */ и исполняемые комментарии MySQL /*! … */: это часть запроса." },
        { q: "Почему после строки с # остался перенос?", a: "В MySQL # начинает комментарий, а в PostgreSQL это оператор. Чтобы не сломать ни один вариант, такая строка сохраняется вместе с переносом." },
      ],
      en: [
        { q: "Are spaces inside strings kept?", a: "Yes, 'single-quoted' strings and \"double\", `backtick` and [bracket] identifiers are copied as is." },
        { q: "What about comments?", a: "-- and /* */ comments are removed, except optimizer hints /*+ … */ and MySQL executable comments /*! … */, which are part of the query." },
        { q: "Why is a line break kept after a # line?", a: "In MySQL # starts a comment, in PostgreSQL it's an operator. To break neither, such a line keeps its line break." },
      ],
    },
    about: {
      ru: "Тела функций PostgreSQL в $$ … $$ не трогаются: внутри них могут быть свои комментарии и значимые переносы.",
      en: "PostgreSQL function bodies in $$ … $$ are left untouched: they may contain their own comments and significant line breaks.",
    },
    related: ["sql-formatter", "json-minifier", "css-minifier"],
  },
];

const tools: ToolDef[] = SPECS.map((s) => ({
  slug: s.slug,
  component: s.component,
  icon: s.icon,
  popular: s.popular,
  wide: true,
  props: s.props,
  name: s.name,
  h1: s.h1,
  title: s.title,
  seoAlt: s.seoAlt,
  description: s.description,
  lead: s.lead,
  keywords: s.keywords,
  howTo: s.howTo,
  faq: s.faq,
  about: { ru: [s.about.ru, PRIVATE.ru], en: [s.about.en, PRIVATE.en] },
  variants: s.variants,
}));

const RELATED = new Map(SPECS.map((s) => [s.slug, s.related]));

export const codeSection = withRelated(
  defineToolSection({
    id: "code",
    name: { ru: "Форматирование кода", en: "Code formatters" },
    description: {
      ru: "Форматирование, проверка и сжатие JSON, SQL, HTML, CSS, JavaScript, XML, YAML",
      en: "Format, validate and minify JSON, SQL, HTML, CSS, JavaScript, XML and YAML",
    },
    icon: "Braces",
    hue: HUE,
    category: "dev",
    order: 1,
    tools,
  }),
  (segs) => (segs[0] === "sql-formatter" && segs[1] ? ["sql-formatter", "sql-minifier"] : (RELATED.get(segs[0]) ?? [])),
);

registerTools("code", HUE, tools);
