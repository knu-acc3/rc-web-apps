import type { QA, ToolDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerTools, withRelated } from "@/sections/code/kit/related";
import type { ConvertOptions, Fmt } from "./convert";
import { FORMAT_META } from "./samples";

const HUE = 235;
type L = { ru: string; en: string };
type LL = { ru: string[]; en: string[] };

interface Pair {
  from: Fmt;
  to: Fmt;
  icon?: string;
  popular?: boolean;
  options?: ConvertOptions;
  h1: L;
  title: L;
  description: L;
  lead: L;
  rules: { ru: [string, string][]; en: [string, string][] };
  faq: { ru: QA[]; en: QA[] };
  about: L;
}

const slugOf = (p: { from: Fmt; to: Fmt }) => `${p.from}-to-${p.to}`;

const HOW = (p: Pair): LL => {
  const a = FORMAT_META[p.from].label;
  const b = FORMAT_META[p.to].label;
  return {
    ru: [`Вставьте ${a} в левое поле или откройте файл — результат ${b} появится справа сразу.`, "Настройте параметры под полями, если нужно: разделитель, отступы, обработку массивов.", `Скопируйте результат или скачайте его файлом .${FORMAT_META[p.to].ext}.`],
    en: [`Paste ${a} on the left or open a file — the ${b} result appears on the right instantly.`, "Adjust the options below the editors if needed: delimiter, indentation, array handling.", `Copy the result or download it as a .${FORMAT_META[p.to].ext} file.`],
  };
};

const PRIVACY: L = {
  ru: "Преобразование выполняется в вашем браузере в фоновом потоке: данные никуда не отправляются, а большие файлы не подвешивают страницу.",
  en: "Conversion runs in your browser in a background thread: data is never uploaded, and large files don't freeze the page.",
};

const PAIRS: Pair[] = [
  {
    from: "json",
    to: "csv",
    icon: "Sheet",
    popular: true,
    h1: { ru: "JSON в CSV онлайн", en: "JSON to CSV converter" },
    title: { ru: "JSON в CSV онлайн — конвертер для Excel", en: "JSON to CSV online — converter for Excel" },
    description: {
      ru: "Перевод JSON в CSV: вложенные объекты — в колонки user.name, массивы — по индексам, кавычки по RFC 4180, BOM и «;» для Excel. Числа не искажаются.",
      en: "Convert JSON to CSV online: nested objects become user.name columns, arrays are indexed, RFC 4180 quoting, BOM for Excel. Big numbers stay exact.",
    },
    lead: { ru: "Массив объектов JSON превращается в таблицу: ключи — в заголовки, вложенные поля — в колонки через точку.", en: "An array of JSON objects becomes a table: keys become headers, nested fields become dot-path columns." },
    rules: {
      ru: [["Строки", "каждый объект массива — строка таблицы"], ["Вложенные объекты", "колонки через точку: user.name, user.city"], ["Массивы", "по индексам (tags.0), через «; » или как JSON"], ["Кавычки", "по RFC 4180: поля с запятыми, кавычками и переносами берутся в кавычки"], ["Excel", "BOM и разделитель «;» — для русской и казахской Excel"]],
      en: [["Rows", "each array element becomes a row"], ["Nested objects", "dot-path columns: user.name, user.city"], ["Arrays", "indexed (tags.0), joined with “; ” or as JSON"], ["Quoting", "RFC 4180: fields with commas, quotes and newlines are quoted"], ["Excel", "BOM and a “;” delimiter for European Excel locales"]],
    },
    faq: {
      ru: [
        { q: "Почему Excel показывает «кракозябры» вместо русских букв?", a: "Excel открывает CSV без BOM в кодировке Windows-1251. Включите «BOM для Excel» — файл получит метку UTF-8, и кириллица отобразится правильно." },
        { q: "Почему Excel не делит данные на колонки?", a: "В русской и казахской версии Excel разделитель списков — точка с запятой. Выберите разделитель «;» — и файл откроется таблицей." },
        { q: "Что такое «Защита от формул»?", a: "Ячейки, начинающиеся с =, +, -, @, Excel может выполнить как формулу. Опция добавляет перед такими текстами апостроф. Числа вроде -5 она не трогает; по умолчанию выключена." },
      ],
      en: [
        { q: "Why does Excel show garbled characters?", a: "Excel may open BOM-less CSV in a legacy code page. Turn on “BOM for Excel” to mark the file as UTF-8." },
        { q: "Why doesn't Excel split the data into columns?", a: "In many European locales Excel's list separator is a semicolon. Choose “;” as the delimiter." },
        { q: "What is the formula guard?", a: "Cells starting with =, +, -, @ may be executed by spreadsheets as formulas. The option prefixes such text with an apostrophe. Numbers like -5 are never touched; it's off by default." },
      ],
    },
    about: {
      ru: "Столбцы — объединение ключей всех объектов в порядке появления, поэтому разнородные записи не теряют поля. Большие целые вроде 12345678901234567890 переносятся цифра в цифру, без округления JavaScript.",
      en: "Columns are the union of keys across all objects in first-seen order, so uneven records keep every field. Big integers like 12345678901234567890 are copied digit for digit, without JavaScript rounding.",
    },
  },
  {
    from: "csv",
    to: "json",
    icon: "Braces",
    popular: true,
    h1: { ru: "CSV в JSON онлайн", en: "CSV to JSON converter" },
    title: { ru: "CSV в JSON онлайн — конвертер таблиц", en: "CSV to JSON online — table converter" },
    description: {
      ru: "Перевод CSV в JSON онлайн: разделитель «,», «;», табуляция или «|» определяется сам, первая строка — ключи, числа и true/false по желанию, кавычки RFC 4180.",
      en: "Convert CSV to JSON online: the delimiter (comma, semicolon, tab or pipe) is detected automatically, the header row gives keys, numbers optional, RFC 4180 quotes.",
    },
    lead: { ru: "Каждая строка CSV становится объектом, где ключи — заголовки из первой строки.", en: "Each CSV row becomes an object keyed by the header row." },
    rules: {
      ru: [["Разделитель", "определяется по первым строкам: , ; табуляция |"], ["Заголовки", "первая строка — ключи объектов (можно выключить)"], ["Типы", "по умолчанию всё — строки; опция превращает числа и true/false"], ["Точность", "длинные числа (больше 2⁵³) сохраняются цифра в цифру"], ["Вложенность", "заголовки вида user.name можно собрать во вложенные объекты"]],
      en: [["Delimiter", "detected from the first lines: , ; tab |"], ["Header", "the first row gives object keys (can be turned off)"], ["Types", "strings by default; the option converts numbers and true/false"], ["Precision", "long numbers (above 2⁵³) are kept digit for digit"], ["Nesting", "headers like user.name can be rebuilt into nested objects"]],
    },
    faq: {
      ru: [
        { q: "Почему числа в кавычках?", a: "По умолчанию значения остаются строками, чтобы не потерять ведущие нули (индексы, ИИН). Включите «Числа и true/false», если нужны числовые типы." },
        { q: "Как CSV из Excel с «;» превратить в JSON?", a: "Просто вставьте его: разделитель определяется автоматически по согласованному числу колонок в первых строках. При необходимости выберите его вручную." },
        { q: "Поддерживаются ли переносы строк внутри ячеек?", a: "Да, по RFC 4180: значение в кавычках может содержать запятые, переносы строк и удвоенные кавычки." },
      ],
      en: [
        { q: "Why are numbers quoted?", a: "Values stay strings by default so leading zeros (ZIP codes, IDs) aren't lost. Turn on “Numbers and true/false” for typed values." },
        { q: "Does it handle semicolon-separated CSV from Excel?", a: "Yes: the delimiter is detected from consistent column counts in the first lines. You can also choose it manually." },
        { q: "Are line breaks inside cells supported?", a: "Yes, per RFC 4180: a quoted value may contain commas, line breaks and doubled quotes." },
      ],
    },
    about: { ru: "BOM в начале файла отбрасывается, пустые строки в конце пропускаются. Числа с запятой (1500,50) остаются строками — их формат зависит от региона.", en: "A leading BOM is removed and trailing empty lines are skipped. Numbers with a decimal comma (1500,50) stay strings — their format depends on the locale." },
  },
  {
    from: "json",
    to: "yaml",
    icon: "FileCode",
    popular: true,
    h1: { ru: "JSON в YAML онлайн", en: "JSON to YAML converter" },
    title: { ru: "JSON в YAML онлайн — конвертер без потерь", en: "JSON to YAML online — lossless converter" },
    description: {
      ru: "JSON в YAML онлайн: строки yes, no, on, off, 012, 12:30 и даты берутся в кавычки, чтобы YAML 1.1 не прочитал их как bool, числа или время.",
      en: "Convert JSON to YAML online: strings like yes, no, on, off, 012, 12:30 and dates are quoted so YAML 1.1 parsers don't turn them into booleans, numbers or times.",
    },
    lead: { ru: "JSON превращается в читаемый YAML с отступами; спорные строки автоматически берутся в кавычки.", en: "JSON becomes readable, indented YAML; ambiguous strings are quoted automatically." },
    rules: {
      ru: [["Объекты", "ключ: значение с отступом"], ["Массивы", "строки, начинающиеся с «- »"], ["Кавычки", "для yes/no/on/off, null, ~, 012, 1e3, 12:30, дат и строк с «: » или «#»"], ["Многострочные строки", "блок | с сохранением переносов"], ["Числа", "без изменений, даже длиннее 2⁵³"]],
      en: [["Objects", "key: value with indentation"], ["Arrays", "lines starting with “- ”"], ["Quotes", "for yes/no/on/off, null, ~, 012, 1e3, 12:30, dates and strings with “: ” or “#”"], ["Multi-line strings", "a | block keeping line breaks"], ["Numbers", "unchanged, even beyond 2⁵³"]],
    },
    faq: {
      ru: [
        { q: "Почему «NO» в кавычках?", a: "В YAML 1.1 (PyYAML, старые версии Ansible и Kubernetes) NO, yes, on и off читаются как логические значения — код страны Норвегии превратился бы в false. Кавычки сохраняют строку." },
        { q: "Совместим ли результат с Kubernetes и Docker Compose?", a: "Да, это обычный YAML с отступом в 2 пробела; все строки, которые парсер мог бы понять иначе, защищены кавычками." },
        { q: "Сохраняется ли порядок ключей?", a: "Да, в точности как в исходном JSON, включая ключи-числа." },
      ],
      en: [
        { q: "Why is “NO” quoted?", a: "In YAML 1.1 (PyYAML, older Ansible and Kubernetes tooling) NO, yes, on and off are booleans — Norway's country code would become false. Quotes keep it a string." },
        { q: "Does it work for Kubernetes and Docker Compose?", a: "Yes, it's plain YAML with 2-space indentation and every string a parser might misread is quoted." },
        { q: "Is key order kept?", a: "Yes, exactly as in the source JSON, including numeric keys." },
      ],
    },
    about: { ru: "YAML-вывод строится собственным генератором, поэтому большие числа не округляются, а правила кавычек учитывают и YAML 1.2, и старый YAML 1.1.", en: "The YAML is produced by our own emitter, so big numbers aren't rounded and quoting covers both YAML 1.2 and legacy YAML 1.1." },
  },
  {
    from: "yaml",
    to: "json",
    icon: "Braces",
    popular: true,
    h1: { ru: "YAML в JSON онлайн", en: "YAML to JSON converter" },
    title: { ru: "YAML в JSON онлайн — якоря, блоки, мультидокументы", en: "YAML to JSON online — anchors, blocks, multi-doc" },
    description: {
      ru: "YAML в JSON онлайн по YAML 1.2: якоря и ссылки (&, *), слияние <<, блоки | и >, несколько документов, числа без округления, ошибки со строкой.",
      en: "YAML to JSON online per YAML 1.2: anchors and aliases (&, *), << merge keys, | and > blocks, multiple documents and exact numbers; errors show the line.",
    },
    lead: { ru: "YAML разбирается полноценным парсером: якоря, слияния и многострочные блоки превращаются в обычный JSON.", en: "YAML is parsed by a full parser: anchors, merges and block scalars become plain JSON." },
    rules: {
      ru: [["Схема", "YAML 1.2 core: yes/no — строки, true/false — логические"], ["Якоря", "&имя и *имя подставляются, << сливает ключи"], ["Блоки", "| сохраняет переносы, > склеивает строки"], ["Документы", "несколько документов через --- собираются в массив"], ["Числа", "0x1F, 0o17 и 1_000 переводятся в десятичные без потерь"]],
      en: [["Schema", "YAML 1.2 core: yes/no are strings, true/false booleans"], ["Anchors", "&name and *name are resolved, << merges keys"], ["Blocks", "| keeps line breaks, > folds lines"], ["Documents", "several --- documents become an array"], ["Numbers", "0x1F, 0o17 and 1_000 become exact decimals"]],
    },
    faq: {
      ru: [
        { q: "Почему yes остался строкой?", a: "По YAML 1.2 логические значения — только true и false. yes/no/on/off — строки. Так ведут себя современные парсеры (js-yaml, go-yaml v3)." },
        { q: "Строка «- http://x» и время «12:30» не испортятся?", a: "Нет: в отличие от самописных парсеров, здесь ссылка остаётся ссылкой, а 12:30 — строкой (в YAML 1.2 это не число в шестидесятеричной системе)." },
        { q: "Что делать с ошибкой отступов?", a: "Сообщение укажет строку и столбец. Чаще всего в YAML смешаны табуляция и пробелы — используйте только пробелы." },
      ],
      en: [
        { q: "Why did yes stay a string?", a: "In YAML 1.2 only true and false are booleans; yes/no/on/off are strings. Modern parsers (js-yaml, go-yaml v3) behave the same." },
        { q: "Are “- http://x” and “12:30” safe?", a: "Yes: unlike naive hand-written parsers, the link stays a link and 12:30 stays a string (it's not a base-60 number in YAML 1.2)." },
        { q: "What about indentation errors?", a: "The message points to the line and column. Most often tabs and spaces are mixed — use spaces only." },
      ],
    },
    about: { ru: "Используется парсер js-yaml 5 с собственными правилами для чисел, поэтому целые больше 2⁵³ не округляются, а порядок ключей сохраняется.", en: "It uses the js-yaml 5 parser with custom number handling, so integers above 2⁵³ aren't rounded and key order is preserved." },
  },
  {
    from: "json",
    to: "xml",
    icon: "Code",
    h1: { ru: "JSON в XML онлайн", en: "JSON to XML converter" },
    title: { ru: "JSON в XML онлайн — атрибуты и массивы", en: "JSON to XML online — attributes and arrays" },
    description: {
      ru: "Перевод JSON в XML онлайн: ключи «@имя» становятся атрибутами, «#text» — текстом, массивы — повторяющимися элементами. Спецсимволы экранируются, имена исправляются.",
      en: "Convert JSON to XML online: “@name” keys become attributes, “#text” becomes text, arrays become repeated elements. Special characters are escaped and names fixed.",
    },
    lead: { ru: "Объект с одним ключом становится корневым элементом, остальное — вложенными тегами.", en: "An object with a single key becomes the root element; everything else becomes nested tags." },
    rules: {
      ru: [["Корень", "единственный ключ верхнего уровня или элемент root"], ["Атрибуты", "ключи, начинающиеся с @"], ["Текст", "ключ #text"], ["Массивы", "повторяются элементом с тем же именем; массив в корне — элементы item"], ["Имена", "недопустимые символы заменяются на _, перед цифрой добавляется _"]],
      en: [["Root", "the single top-level key or a root element"], ["Attributes", "keys starting with @"], ["Text", "the #text key"], ["Arrays", "repeated elements with the same name; a top-level array uses item"], ["Names", "invalid characters become _, a leading digit gets a _ prefix"]],
    },
    faq: {
      ru: [
        { q: "Как задать атрибут?", a: "Добавьте ключ с @: {\"book\": {\"@id\": \"1\", \"title\": \"…\"}} → <book id=\"1\"><title>…</title></book>." },
        { q: "Что будет с массивом?", a: "Каждый элемент массива станет отдельным элементом с именем ключа: {\"book\": [a, b]} → <book>a</book><book>b</book>." },
        { q: "Совпадает ли это с обратным преобразованием XML в JSON?", a: "Да, используется одна и та же схема (@ для атрибутов, #text для текста), поэтому XML → JSON → XML возвращает ту же структуру." },
      ],
      en: [
        { q: "How do I set an attribute?", a: "Add a key starting with @: {\"book\": {\"@id\": \"1\", \"title\": \"…\"}} → <book id=\"1\"><title>…</title></book>." },
        { q: "What happens to arrays?", a: "Each element becomes a separate element named after the key: {\"book\": [a, b]} → <book>a</book><book>b</book>." },
        { q: "Does it match the XML to JSON mapping?", a: "Yes, both use the same convention (@ for attributes, #text for text), so XML → JSON → XML keeps the structure." },
      ],
    },
    about: { ru: "Результат начинается с объявления <?xml version=\"1.0\" encoding=\"UTF-8\"?> и отформатирован отступами; символы &, < и > экранируются.", en: "Output starts with <?xml version=\"1.0\" encoding=\"UTF-8\"?> and is indented; &, < and > are escaped." },
  },
  {
    from: "xml",
    to: "json",
    icon: "Braces",
    popular: true,
    h1: { ru: "XML в JSON онлайн", en: "XML to JSON converter" },
    title: { ru: "XML в JSON онлайн — атрибуты, CDATA, DOCTYPE", en: "XML to JSON online — attributes, CDATA, DOCTYPE" },
    description: {
      ru: "XML в JSON онлайн: атрибуты — ключи «@имя», повторяющиеся теги — массивы, CDATA и сущности раскрываются, DOCTYPE пропускается без загрузки файлов.",
      en: "XML to JSON online: attributes become “@name” keys, repeated tags become arrays, CDATA and entities are decoded, DOCTYPE is skipped, nothing is fetched.",
    },
    lead: { ru: "Каждый элемент становится ключом; текст без атрибутов — строкой, повторы — массивом.", en: "Every element becomes a key; text-only elements become strings and repeats become arrays." },
    rules: {
      ru: [["Атрибуты", "ключи с префиксом @"], ["Повторы", "одноимённые элементы собираются в массив"], ["Текст", "элемент только с текстом — строка; смешанный — ключ #text"], ["CDATA и сущности", "раскрываются: &amp; → &"], ["DOCTYPE", "пропускается; внешние сущности не загружаются"]],
      en: [["Attributes", "keys with an @ prefix"], ["Repeats", "same-named elements become an array"], ["Text", "a text-only element becomes a string; mixed content uses #text"], ["CDATA and entities", "decoded: &amp; → &"], ["DOCTYPE", "skipped; external entities are never fetched"]],
    },
    faq: {
      ru: [
        { q: "Почему один элемент — объект, а два — массив?", a: "Так устроено распространённое соглашение: массив появляется, только когда элемент повторяется. Если нужен массив всегда, обрабатывайте оба случая в коде." },
        { q: "Числа из XML остаются строками?", a: "Да: в XML нет типов, «007» и «7» — разные тексты. Поэтому значения не преобразуются." },
        { q: "Безопасно ли вставлять XML с DOCTYPE?", a: "Да: DOCTYPE пропускается, внешние сущности не загружаются, атаки вроде XXE невозможны — сеть не используется." },
      ],
      en: [
        { q: "Why is one element an object and two an array?", a: "That's the common convention: an array appears only when an element repeats. Handle both cases in code if you always need an array." },
        { q: "Do numbers stay strings?", a: "Yes: XML has no types, and “007” and “7” are different texts, so values aren't converted." },
        { q: "Is XML with a DOCTYPE safe to paste?", a: "Yes: the DOCTYPE is skipped and external entities are never loaded — XXE-style attacks are impossible, no network is used." },
      ],
    },
    about: { ru: "XML разбирается собственным парсером: он работает в фоновом потоке, понимает BOM, комментарии и инструкции обработки и сообщает об ошибках со строкой и столбцом.", en: "XML is parsed by our own parser: it runs in a background thread, handles a BOM, comments and processing instructions, and reports errors with line and column." },
  },
  {
    from: "json",
    to: "toml",
    icon: "FileCode",
    h1: { ru: "JSON в TOML онлайн", en: "JSON to TOML converter" },
    title: { ru: "JSON в TOML онлайн — конвертер конфигов", en: "JSON to TOML online — config converter" },
    description: {
      ru: "JSON в TOML онлайн: объекты — таблицы [section], массивы объектов — [[section]], большие целые сохраняются. null в TOML нет — такие поля пропускаются.",
      en: "JSON to TOML: objects become [section] tables, arrays of objects [[section]], big integers are kept. TOML has no null, so null fields are skipped.",
    },
    lead: { ru: "JSON-объект превращается в TOML-документ с таблицами и массивами таблиц.", en: "A JSON object becomes a TOML document with tables and arrays of tables." },
    rules: {
      ru: [["Корень", "TOML-документ — таблица; массив в корне кладётся в ключ items"], ["Объекты", "[таблица]"], ["Массивы объектов", "[[массив таблиц]]"], ["null", "в TOML нет — поле пропускается с предупреждением"], ["Целые", "64-битные, без округления"]],
      en: [["Root", "a TOML document is a table; a top-level array goes under items"], ["Objects", "[table]"], ["Arrays of objects", "[[array of tables]]"], ["null", "not in TOML — the field is skipped with a warning"], ["Integers", "64-bit, not rounded"]],
    },
    faq: {
      ru: [
        { q: "Где используется TOML?", a: "В Cargo.toml (Rust), pyproject.toml (Python), конфигурации Hugo, Netlify и многих CLI-утилит." },
        { q: "Почему пропало поле со значением null?", a: "В TOML нет null. Такие поля пропускаются, а предупреждение показывает их пути." },
        { q: "Как записываются даты?", a: "Строки остаются строками. Если нужен тип даты TOML, замените кавычки вручную: 1979-05-27T07:32:00Z." },
      ],
      en: [
        { q: "Where is TOML used?", a: "In Cargo.toml (Rust), pyproject.toml (Python), Hugo and Netlify configs and many CLI tools." },
        { q: "Why did a null field disappear?", a: "TOML has no null. Such fields are skipped, and a warning lists their paths." },
        { q: "How are dates written?", a: "Strings stay strings. If you need a TOML datetime, remove the quotes by hand: 1979-05-27T07:32:00Z." },
      ],
    },
    about: { ru: "TOML формируется библиотекой smol-toml; числа больше 2⁵³ передаются ей как BigInt и записываются точно.", en: "TOML is written with smol-toml; numbers beyond 2⁵³ are passed as BigInt and written exactly." },
  },
  {
    from: "toml",
    to: "json",
    icon: "Braces",
    h1: { ru: "TOML в JSON онлайн", en: "TOML to JSON converter" },
    title: { ru: "TOML в JSON онлайн — Cargo.toml, pyproject.toml", en: "TOML to JSON online — Cargo.toml, pyproject.toml" },
    description: {
      ru: "Перевод TOML в JSON онлайн: таблицы, массивы таблиц, встроенные таблицы, даты (в ISO 8601) и 64-битные целые без округления. Ошибки — со строкой и столбцом.",
      en: "Convert TOML to JSON online: tables, arrays of tables, inline tables, datetimes (as ISO 8601) and 64-bit integers without rounding. Errors show line and column.",
    },
    lead: { ru: "Вставьте Cargo.toml или pyproject.toml — получите тот же конфиг в JSON.", en: "Paste a Cargo.toml or pyproject.toml and get the same config as JSON." },
    rules: {
      ru: [["Таблицы", "[a.b] → вложенные объекты"], ["Массивы таблиц", "[[x]] → массив объектов"], ["Даты", "строки ISO 8601 (время со смещением приводится к UTC)"], ["Целые", "до 64 бит, без округления"], ["Стандарт", "TOML 1.0"]],
      en: [["Tables", "[a.b] → nested objects"], ["Arrays of tables", "[[x]] → an array of objects"], ["Datetimes", "ISO 8601 strings (offset times normalized to UTC)"], ["Integers", "up to 64 bits, not rounded"], ["Standard", "TOML 1.0"]],
    },
    faq: {
      ru: [
        { q: "Что происходит с датами?", a: "JSON не знает типа «дата», поэтому значения превращаются в строки ISO 8601; время со смещением приводится к UTC (Z)." },
        { q: "Поддерживаются ли комментарии?", a: "Да, комментарии (#) допустимы в TOML и просто не попадают в JSON." },
        { q: "Какая версия TOML?", a: "TOML 1.0 — её понимают Cargo, pip и Poetry." },
      ],
      en: [
        { q: "What happens to datetimes?", a: "JSON has no date type, so values become ISO 8601 strings; offset times are normalized to UTC (Z)." },
        { q: "Are comments supported?", a: "Yes, # comments are valid TOML and simply don't appear in JSON." },
        { q: "Which TOML version?", a: "TOML 1.0 — what Cargo, pip and Poetry understand." },
      ],
    },
    about: { ru: "Разбор выполняет библиотека smol-toml в режиме BigInt, поэтому большие целые не теряют точность.", en: "Parsing uses smol-toml in BigInt mode, so big integers keep full precision." },
  },
  tsvPair("csv", "tsv"),
  tsvPair("tsv", "csv"),
  {
    from: "csv",
    to: "markdown",
    icon: "Table",
    popular: true,
    h1: { ru: "CSV в Markdown-таблицу", en: "CSV to Markdown table" },
    title: { ru: "CSV в Markdown онлайн — таблица для GitHub", en: "CSV to Markdown table online — for GitHub" },
    description: {
      ru: "Перевод CSV или таблицы из Excel в Markdown-таблицу для GitHub, GitLab и документации: символ | экранируется, переносы строк в ячейках заменяются на <br>.",
      en: "Convert CSV or an Excel range to a Markdown table for GitHub, GitLab and docs: pipes are escaped and line breaks inside cells become <br>.",
    },
    lead: { ru: "Первая строка CSV становится заголовком таблицы Markdown.", en: "The first CSV row becomes the Markdown table header." },
    rules: {
      ru: [["Заголовок", "первая строка и разделитель | --- |"], ["Символ |", "экранируется как \\|"], ["Переносы в ячейках", "заменяются на <br>"], ["Разделитель CSV", "определяется автоматически"]],
      en: [["Header", "the first row plus a | --- | separator"], ["Pipe", "escaped as \\|"], ["Line breaks in cells", "become <br>"], ["CSV delimiter", "detected automatically"]],
    },
    faq: {
      ru: [
        { q: "Как вставить таблицу из Excel?", a: "Скопируйте ячейки в Excel или Google Таблицах и вставьте сюда: они копируются с табуляцией, которая распознается как разделитель." },
        { q: "Где работают такие таблицы?", a: "В GitHub, GitLab, Obsidian, Notion (при импорте), README и большинстве генераторов документации (GFM)." },
        { q: "Можно ли выровнять колонки?", a: "Ширина колонок в Markdown не важна — рендерер выравнивает таблицу сам." },
      ],
      en: [
        { q: "How do I paste from Excel?", a: "Copy cells in Excel or Google Sheets and paste here: they're copied tab-separated, which is detected automatically." },
        { q: "Where do these tables work?", a: "GitHub, GitLab, Obsidian, READMEs and most docs generators (GitHub Flavored Markdown)." },
        { q: "Can columns be aligned?", a: "Column width doesn't matter in Markdown — the renderer lays out the table." },
      ],
    },
    about: { ru: "Таблица строится по синтаксису GitHub Flavored Markdown и корректно отображается даже при разном числе ячеек в строках.", en: "The table follows GitHub Flavored Markdown and renders correctly even if rows have different cell counts." },
  },
  {
    from: "csv",
    to: "html",
    icon: "Table",
    h1: { ru: "CSV в HTML-таблицу", en: "CSV to HTML table" },
    title: { ru: "CSV в HTML-таблицу онлайн — thead и tbody", en: "CSV to HTML table online — thead and tbody" },
    description: {
      ru: "Перевод CSV в HTML-таблицу онлайн: <table> с <thead> и <tbody>, символы < > & экранируются, переносы в ячейках — <br>. Готовый код для сайта или письма.",
      en: "Convert CSV to an HTML table online: <table> with <thead> and <tbody>, < > & escaped and line breaks in cells turned into <br>. Ready code for a site or e-mail.",
    },
    lead: { ru: "CSV превращается в чистую разметку таблицы без стилей — оформите её своим CSS.", en: "CSV becomes clean table markup without styles — style it with your own CSS." },
    rules: {
      ru: [["Заголовок", "первая строка в <thead> из <th> (можно выключить)"], ["Экранирование", "< > & \" заменяются сущностями"], ["Переносы", "внутри ячеек — <br>"], ["Стили", "не добавляются"]],
      en: [["Header", "the first row as <th> in <thead> (can be turned off)"], ["Escaping", "< > & \" become entities"], ["Line breaks", "inside cells become <br>"], ["Styles", "none added"]],
    },
    faq: {
      ru: [
        { q: "Безопасно ли вставлять результат на сайт?", a: "Да, содержимое ячеек экранируется, поэтому HTML-код из CSV не выполнится." },
        { q: "Как сделать таблицу без заголовка?", a: "Выключите «Первая строка — заголовки» — все строки попадут в <tbody>." },
        { q: "Как стилизовать таблицу?", a: "Добавьте класс к <table> и опишите стили в CSS: границы, отступы, чередование строк через tr:nth-child(even)." },
      ],
      en: [
        { q: "Is it safe to paste the result into a site?", a: "Yes, cell contents are escaped, so HTML inside the CSV won't run." },
        { q: "How do I make a table without a header?", a: "Turn off “First row is a header” — every row goes into <tbody>." },
        { q: "How do I style the table?", a: "Add a class to <table> and style it in CSS: borders, padding, zebra rows with tr:nth-child(even)." },
      ],
    },
    about: { ru: "Результат — семантическая таблица, которую поймут программы чтения с экрана.", en: "The result is a semantic table that screen readers understand." },
  },
  {
    from: "json",
    to: "typescript",
    icon: "FileType",
    popular: true,
    h1: { ru: "JSON в TypeScript онлайн", en: "JSON to TypeScript converter" },
    title: { ru: "JSON в TypeScript онлайн — интерфейсы из JSON", en: "JSON to TypeScript online — interfaces from JSON" },
    description: {
      ru: "Интерфейсы TypeScript из JSON: вложенные объекты — отдельные интерфейсы, поля, которых нет в части элементов, — необязательные (?), разные типы — объединения.",
      en: "TypeScript interfaces from JSON: nested objects become separate interfaces, fields missing in some elements become optional (?), mixed types unions.",
    },
    lead: { ru: "Вставьте пример ответа API — получите готовые interface для TypeScript.", en: "Paste a sample API response and get ready TypeScript interfaces." },
    rules: {
      ru: [["Объекты", "отдельные interface с именами по ключам (users → User)"], ["Необязательные поля", "если поле есть не во всех элементах массива"], ["Объединения", "string | number, null | string"], ["Имена полей", "недопустимые идентификаторы берутся в кавычки"]],
      en: [["Objects", "separate interfaces named after keys (users → User)"], ["Optional fields", "when a field is missing in some array elements"], ["Unions", "string | number, null | string"], ["Field names", "invalid identifiers are quoted"]],
    },
    faq: {
      ru: [
        { q: "Как типы определяются для массивов?", a: "Все элементы массива объединяются: поле, которого нет хотя бы в одном объекте, становится необязательным, а разные типы значений — объединением." },
        { q: "Можно получить type вместо interface?", a: "Да, переключите «Объявление» на type." },
        { q: "Как назвать корневой тип?", a: "Введите имя в поле «Имя типа» — по умолчанию Root." },
      ],
      en: [
        { q: "How are array types inferred?", a: "All elements are merged: a field missing in any object becomes optional, and different value types become a union." },
        { q: "Can I get type aliases instead of interfaces?", a: "Yes, switch Declaration to type." },
        { q: "How do I name the root type?", a: "Enter it in Type name — Root by default." },
      ],
    },
    about: { ru: "Генерация идёт по примеру данных, поэтому точность зависит от образца: включите в JSON записи со всеми вариантами полей.", en: "Types are inferred from the sample, so accuracy depends on it: include records with every field variation." },
  },
  {
    from: "json",
    to: "zod",
    icon: "ShieldCheck",
    h1: { ru: "JSON в Zod-схему", en: "JSON to Zod schema" },
    title: { ru: "JSON в Zod онлайн — схема валидации из JSON", en: "JSON to Zod online — validation schema from JSON" },
    description: {
      ru: "Генерация схемы Zod из JSON: z.object, z.array, z.union, .optional() для полей, которых нет во всех элементах, и .nullable() для null. Плюс тип через z.infer.",
      en: "Generate a Zod schema from JSON: z.object, z.array, z.union, .optional() for fields missing in some elements and .nullable() for nulls, plus a z.infer type.",
    },
    lead: { ru: "Вставьте пример данных — получите схему Zod для проверки ответов API.", en: "Paste sample data and get a Zod schema to validate API responses." },
    rules: {
      ru: [["Объекты", "z.object({…}) с вложенными схемами"], ["Массивы", "z.array(…)"], ["Необязательные", ".optional()"], ["null", ".nullable()"], ["Тип", "export type … = z.infer<typeof schema>"]],
      en: [["Objects", "z.object({…}) with nested schemas"], ["Arrays", "z.array(…)"], ["Optional", ".optional()"], ["null", ".nullable()"], ["Type", "export type … = z.infer<typeof schema>"]],
    },
    faq: {
      ru: [
        { q: "Зачем Zod, если есть TypeScript?", a: "Типы TypeScript исчезают при компиляции, а Zod проверяет данные во время выполнения — например, ответ стороннего API." },
        { q: "Как использовать схему?", a: "const data = rootSchema.parse(json) — выбросит ошибку, если данные не совпадают; safeParse вернёт результат без исключения." },
        { q: "Нужно ли дорабатывать схему?", a: "Обычно да: добавьте z.string().email(), .min(), перечисления z.enum — пример данных не знает этих правил." },
      ],
      en: [
        { q: "Why Zod if I have TypeScript?", a: "TypeScript types vanish at compile time, while Zod validates data at runtime — e.g. a third-party API response." },
        { q: "How do I use the schema?", a: "const data = rootSchema.parse(json) throws if data doesn't match; safeParse returns a result without throwing." },
        { q: "Should I refine the schema?", a: "Usually yes: add z.string().email(), .min(), z.enum — the sample doesn't know those rules." },
      ],
    },
    about: { ru: "Схема совместима с Zod 3 и 4; вложенные объекты описываются прямо внутри родительской схемы.", en: "The schema works with Zod 3 and 4; nested objects are described inline." },
  },
  {
    from: "jsonl",
    to: "json",
    icon: "ListTree",
    h1: { ru: "JSONL в JSON онлайн", en: "JSONL to JSON converter" },
    title: { ru: "JSONL в JSON онлайн — JSON Lines в массив", en: "JSONL to JSON online — JSON Lines to an array" },
    description: {
      ru: "Перевод JSON Lines (NDJSON) в JSON-массив: каждая строка — отдельный объект, пустые строки пропускаются, ошибка указывает номер строки. Для логов и выгрузок.",
      en: "Convert JSON Lines (NDJSON) to a JSON array: one object per line, empty lines skipped, errors point to the line number. For logs and exports.",
    },
    lead: { ru: "Каждая строка JSONL становится элементом массива JSON.", en: "Each JSONL line becomes an element of a JSON array." },
    rules: {
      ru: [["Строка", "один JSON-объект на строку"], ["Пустые строки", "пропускаются"], ["Ошибки", "с номером строки"], ["Числа", "без округления"]],
      en: [["Line", "one JSON value per line"], ["Empty lines", "skipped"], ["Errors", "with the line number"], ["Numbers", "not rounded"]],
    },
    faq: {
      ru: [
        { q: "Где встречается JSONL?", a: "В логах (Docker, Elasticsearch bulk API), выгрузках BigQuery и датасетах для обучения моделей — формат удобно дописывать построчно." },
        { q: "Чем JSONL отличается от NDJSON?", a: "Это одно и то же: JSON Lines и Newline-Delimited JSON описывают одинаковый формат." },
        { q: "Что если одна строка сломана?", a: "Преобразование остановится и покажет номер строки с ошибкой." },
      ],
      en: [
        { q: "Where is JSONL used?", a: "In logs (Docker, Elasticsearch bulk API), BigQuery exports and ML datasets — the format is easy to append line by line." },
        { q: "JSONL vs NDJSON?", a: "They're the same: JSON Lines and Newline-Delimited JSON describe one format." },
        { q: "What if a line is broken?", a: "Conversion stops and shows the line number of the error." },
      ],
    },
    about: { ru: "Строки разбираются тем же точным парсером JSON, что и в форматировщике: большие числа и порядок ключей сохраняются.", en: "Lines are parsed with the same exact JSON parser as the formatter: big numbers and key order are kept." },
  },
  {
    from: "json",
    to: "jsonl",
    icon: "ListTree",
    h1: { ru: "JSON в JSONL онлайн", en: "JSON to JSONL converter" },
    title: { ru: "JSON в JSONL онлайн — массив в JSON Lines", en: "JSON to JSONL online — array to JSON Lines" },
    description: {
      ru: "Перевод JSON-массива в JSON Lines (NDJSON): каждый элемент записывается одной строкой без переносов — для импорта в Elasticsearch, BigQuery и датасеты.",
      en: "Convert a JSON array to JSON Lines (NDJSON): each element on its own line with no line breaks — for Elasticsearch, BigQuery imports and datasets.",
    },
    lead: { ru: "Элементы массива записываются по одному в строку в компактном виде.", en: "Array elements are written one per line in compact form." },
    rules: {
      ru: [["Массив", "каждый элемент — отдельная строка"], ["Не массив", "записывается одной строкой"], ["Формат строки", "компактный JSON без пробелов"]],
      en: [["Array", "each element on its own line"], ["Not an array", "written as a single line"], ["Line format", "compact JSON without spaces"]],
    },
    faq: {
      ru: [
        { q: "Зачем JSONL, если есть JSON?", a: "JSONL можно читать и писать построчно, не загружая весь файл в память, и легко дописывать новые записи в конец." },
        { q: "Сохраняются ли переносы строк внутри строк?", a: "Да, как \\n — сама запись остаётся в одной строке." },
        { q: "Подходит ли для OpenAI fine-tuning?", a: "Да, этот формат требуется для файлов обучения: один JSON-объект на строку." },
      ],
      en: [
        { q: "Why JSONL instead of JSON?", a: "JSONL can be streamed line by line without loading the whole file, and new records are easy to append." },
        { q: "Are line breaks inside strings kept?", a: "Yes, as \\n — each record stays on one line." },
        { q: "Does it suit fine-tuning datasets?", a: "Yes, many training APIs require exactly this: one JSON object per line." },
      ],
    },
    about: { ru: "Каждая строка — валидный JSON, поэтому файл можно проверить построчно.", en: "Every line is valid JSON, so the file can be validated line by line." },
  },
  {
    from: "env",
    to: "json",
    icon: "KeyRound",
    h1: { ru: ".env в JSON онлайн", en: ".env to JSON converter" },
    title: { ru: ".env в JSON онлайн — переменные окружения", en: ".env to JSON online — environment variables" },
    description: {
      ru: "Перевод файла .env в JSON: комментарии и export пропускаются, значения в одинарных и двойных кавычках (с \\n и многострочные) разбираются по правилам dotenv.",
      en: "Convert a .env file to JSON: comments and export are skipped, single- and double-quoted values (with \\n and multi-line) are parsed like dotenv.",
    },
    lead: { ru: "Каждая строка KEY=VALUE становится полем JSON-объекта.", en: "Each KEY=VALUE line becomes a field of a JSON object." },
    rules: {
      ru: [["Комментарии", "строки с # и хвосты « # …» у значений без кавычек"], ["export", "префикс отбрасывается"], ["Двойные кавычки", "поддерживают \\n, \\t и многострочные значения"], ["Одинарные кавычки", "значение берётся буквально"]],
      en: [["Comments", "# lines and trailing “ # …” on unquoted values"], ["export", "the prefix is dropped"], ["Double quotes", "support \\n, \\t and multi-line values"], ["Single quotes", "taken literally"]],
    },
    faq: {
      ru: [
        { q: "Безопасно ли вставлять .env с секретами?", a: "Файл разбирается прямо в браузере и никуда не отправляется. Но лучше заменить настоящие пароли и ключи перед тем, как делиться результатом." },
        { q: "Раскрываются ли переменные ${VAR}?", a: "Нет, подстановка переменных не выполняется — значения остаются как написаны." },
        { q: "Все значения — строки?", a: "Да, переменные окружения всегда строки; числа и true/false остаются в кавычках." },
      ],
      en: [
        { q: "Is it safe to paste a .env with secrets?", a: "The file is parsed in your browser and never sent anywhere. Still, replace real passwords and keys before sharing the result." },
        { q: "Are ${VAR} references expanded?", a: "No, variable expansion isn't performed — values stay as written." },
        { q: "Are all values strings?", a: "Yes, environment variables are always strings; numbers and true/false stay quoted." },
      ],
    },
    about: { ru: "Разбор соответствует поведению популярной библиотеки dotenv: ключи из букв, цифр и подчёркиваний, значение после первого знака =.", en: "Parsing follows the popular dotenv library: keys of letters, digits and underscores, the value after the first =." },
  },
  {
    from: "json",
    to: "env",
    icon: "KeyRound",
    h1: { ru: "JSON в .env онлайн", en: "JSON to .env converter" },
    title: { ru: "JSON в .env онлайн — переменные из конфига", en: "JSON to .env online — variables from a config" },
    description: {
      ru: "Перевод JSON в файл .env: вложенные объекты становятся ключами через __ (DB__HOST), ключи — заглавными, значения с пробелами, # и кавычками экранируются.",
      en: "Convert JSON to a .env file: nested objects become __-joined keys (DB__HOST), keys uppercase, values with spaces, # or quotes are quoted and escaped.",
    },
    lead: { ru: "Каждое поле JSON становится строкой KEY=VALUE, вложенность передаётся через __.", en: "Every JSON field becomes a KEY=VALUE line; nesting is expressed with __." },
    rules: {
      ru: [["Вложенность", "ключи через __: {\"db\":{\"host\":…}} → DB__HOST"], ["Регистр", "ключи заглавными (можно выключить)"], ["Кавычки", "для значений с пробелами, #, $ и кавычками"], ["Массивы", "простые — через запятую, объектов — по индексам"]],
      en: [["Nesting", "__-joined keys: {\"db\":{\"host\":…}} → DB__HOST"], ["Case", "uppercase keys (can be turned off)"], ["Quoting", "for values with spaces, #, $ or quotes"], ["Arrays", "simple ones comma-joined, arrays of objects indexed"]],
    },
    faq: {
      ru: [
        { q: "Почему разделитель __?", a: "Двойное подчёркивание понимают ASP.NET Core, Pydantic Settings и многие другие библиотеки: DB__HOST превращается обратно во вложенное поле." },
        { q: "Как записываются массивы?", a: "Массив строк или чисел — одной строкой через запятую; массив объектов — отдельными ключами с индексами: ITEMS__0__NAME." },
        { q: "Экранируются ли спецсимволы?", a: "Да, значения с пробелами, #, $, кавычками и переносами берутся в двойные кавычки с экранированием." },
      ],
      en: [
        { q: "Why the __ separator?", a: "Double underscores are understood by ASP.NET Core, Pydantic Settings and many other libraries: DB__HOST maps back to a nested field." },
        { q: "How are arrays written?", a: "Arrays of strings or numbers are comma-joined; arrays of objects become indexed keys: ITEMS__0__NAME." },
        { q: "Are special characters escaped?", a: "Yes, values with spaces, #, $, quotes or line breaks are double-quoted and escaped." },
      ],
    },
    about: { ru: "Результат готов для docker-compose, Kubernetes ConfigMap через --from-env-file и локальной разработки.", en: "The result is ready for docker-compose, a Kubernetes ConfigMap via --from-env-file and local development." },
  },
  {
    from: "tsv",
    to: "json",
    icon: "Braces",
    h1: { ru: "TSV в JSON онлайн", en: "TSV to JSON converter" },
    title: { ru: "TSV в JSON онлайн — данные из Excel в JSON", en: "TSV to JSON online — Excel data to JSON" },
    description: {
      ru: "Перевод TSV (значений через табуляцию) в JSON: вставьте ячейки прямо из Excel или Google Таблиц — первая строка станет ключами, числа по желанию.",
      en: "Convert TSV (tab-separated values) to JSON: paste cells straight from Excel or Google Sheets — the first row becomes keys, numbers optional.",
    },
    lead: { ru: "Скопированные из таблицы ячейки превращаются в массив JSON-объектов.", en: "Cells copied from a spreadsheet become an array of JSON objects." },
    rules: {
      ru: [["Разделитель", "табуляция"], ["Заголовки", "первая строка — ключи"], ["Типы", "по желанию: числа и true/false"], ["Кавычки", "поля в кавычках с переносами поддерживаются"]],
      en: [["Delimiter", "tab"], ["Header", "the first row gives keys"], ["Types", "optional: numbers and true/false"], ["Quotes", "quoted fields with line breaks are supported"]],
    },
    faq: {
      ru: [
        { q: "Как получить TSV из Excel?", a: "Выделите ячейки и скопируйте (Ctrl+C) — в буфер попадёт TSV. Вставьте его сюда." },
        { q: "Сохранятся ли ведущие нули?", a: "Да, если не включать «Числа и true/false»: значения остаются строками." },
        { q: "Чем TSV лучше CSV?", a: "Табуляция почти не встречается в тексте, поэтому кавычки нужны редко, а запятые в значениях не мешают." },
      ],
      en: [
        { q: "How do I get TSV from Excel?", a: "Select cells and copy (Ctrl+C) — the clipboard holds TSV. Paste it here." },
        { q: "Are leading zeros kept?", a: "Yes, unless “Numbers and true/false” is on: values stay strings." },
        { q: "Why TSV instead of CSV?", a: "Tabs rarely appear in text, so quoting is rarely needed and commas in values don't interfere." },
      ],
    },
    about: { ru: "Используется тот же разборщик, что и для CSV (RFC 4180), только с табуляцией в качестве разделителя.", en: "It uses the same RFC 4180 parser as CSV, with a tab as the delimiter." },
  },
  {
    from: "json",
    to: "markdown",
    icon: "Table",
    h1: { ru: "JSON в Markdown-таблицу", en: "JSON to Markdown table" },
    title: { ru: "JSON в Markdown-таблицу онлайн", en: "JSON to Markdown table online" },
    description: {
      ru: "Перевод массива JSON-объектов в Markdown-таблицу для README и документации: вложенные поля — колонки через точку, массивы по индексам или через «; ».",
      en: "Convert an array of JSON objects to a Markdown table for READMEs and docs: nested fields become dot-path columns, arrays indexed or joined with “; ”.",
    },
    lead: { ru: "Ключи объектов становятся заголовками таблицы, значения — ячейками.", en: "Object keys become table headers and values become cells." },
    rules: {
      ru: [["Колонки", "объединение ключей всех объектов"], ["Вложенность", "user.name"], ["Массивы", "по индексам, через «; » или как JSON"], ["Символ |", "экранируется"]],
      en: [["Columns", "the union of keys of all objects"], ["Nesting", "user.name"], ["Arrays", "indexed, joined with “; ” or as JSON"], ["Pipe", "escaped"]],
    },
    faq: {
      ru: [
        { q: "Что если у объектов разные поля?", a: "Колонки собираются из всех объектов, а отсутствующие значения остаются пустыми ячейками." },
        { q: "Как показать массив в одной ячейке?", a: "Выберите «Массивы: через «; »» — простые массивы сольются в одну ячейку." },
        { q: "Подойдёт ли для GitHub?", a: "Да, таблица соответствует GitHub Flavored Markdown." },
      ],
      en: [
        { q: "What if objects have different fields?", a: "Columns come from all objects and missing values stay empty." },
        { q: "How do I show an array in one cell?", a: "Choose “Arrays: joined with “; ”” — simple arrays merge into one cell." },
        { q: "Does it work on GitHub?", a: "Yes, the table follows GitHub Flavored Markdown." },
      ],
    },
    about: { ru: "Удобно для документирования ответов API и конфигураций в README.", en: "Handy for documenting API responses and configs in a README." },
  },
  {
    from: "csv",
    to: "xml",
    icon: "Code",
    h1: { ru: "CSV в XML онлайн", en: "CSV to XML converter" },
    title: { ru: "CSV в XML онлайн — строки в элементы", en: "CSV to XML online — rows to elements" },
    description: {
      ru: "Перевод CSV в XML онлайн: каждая строка становится элементом item, колонки — вложенными тегами, заголовки приводятся к допустимым именам XML, текст экранируется.",
      en: "Convert CSV to XML online: each row becomes an item element, columns become child tags, headers are turned into valid XML names and text is escaped.",
    },
    lead: { ru: "Таблица превращается в XML: корень root, строки — item, колонки — теги по заголовкам.", en: "The table becomes XML: a root element, item per row and tags named after the headers." },
    rules: {
      ru: [["Корень", "root (имя можно задать)"], ["Строки", "элементы item"], ["Колонки", "теги с именами из заголовков"], ["Имена", "пробелы и недопустимые символы заменяются на _"]],
      en: [["Root", "root (configurable)"], ["Rows", "item elements"], ["Columns", "tags named after the headers"], ["Names", "spaces and invalid characters become _"]],
    },
    faq: {
      ru: [
        { q: "Как назвать элементы по-своему?", a: "Задайте имя корня в поле «Корневой элемент». Если нужно другое имя строк, переименуйте item в редакторе поиском и заменой." },
        { q: "Что с заголовками на русском?", a: "Кириллица допустима в именах XML, поэтому заголовки сохраняются; заменяются только пробелы и спецсимволы." },
        { q: "Можно ли получить атрибуты вместо тегов?", a: "Назовите колонку с @ в начале (например, @id) — она станет атрибутом элемента." },
      ],
      en: [
        { q: "How do I rename elements?", a: "Set the root name in Root element. To rename rows, replace item with find-and-replace in the result." },
        { q: "What about non-ASCII headers?", a: "Unicode letters are valid in XML names, so headers are kept; only spaces and special characters are replaced." },
        { q: "Can columns become attributes?", a: "Name a column with a leading @ (e.g. @id) and it becomes an attribute." },
      ],
    },
    about: { ru: "Строки CSV сначала превращаются в объекты, а затем записываются по той же схеме, что и JSON → XML.", en: "CSV rows become objects first and are then written with the same mapping as JSON → XML." },
  },
  {
    from: "xml",
    to: "csv",
    icon: "Sheet",
    h1: { ru: "XML в CSV онлайн", en: "XML to CSV converter" },
    title: { ru: "XML в CSV онлайн — таблица из XML для Excel", en: "XML to CSV online — a table from XML for Excel" },
    description: {
      ru: "Перевод XML в CSV онлайн: повторяющиеся элементы становятся строками, вложенные теги и атрибуты — колонками через точку. Подходит для выгрузок 1С, фидов и каталогов.",
      en: "Convert XML to CSV online: repeated elements become rows, nested tags and attributes become dot-path columns. Works for data exports, feeds and catalogs.",
    },
    lead: { ru: "Каждый повторяющийся элемент становится строкой таблицы, его поля — колонками.", en: "Each repeated element becomes a row and its fields become columns." },
    rules: {
      ru: [["Строки", "повторяющиеся элементы внутри корня"], ["Колонки", "вложенные теги через точку, атрибуты — @имя"], ["Excel", "BOM и «;» по желанию"]],
      en: [["Rows", "repeated elements inside the root"], ["Columns", "nested tags as dot paths, attributes as @name"], ["Excel", "optional BOM and “;”"]],
    },
    faq: {
      ru: [
        { q: "Что считается строкой таблицы?", a: "Если внутри корня есть повторяющийся элемент (например, <offer> в YML-фиде), каждая его копия становится строкой. Иначе весь документ даёт одну строку." },
        { q: "Как открыть результат в Excel?", a: "Включите «BOM для Excel» и выберите разделитель «;» — так файл откроется с кириллицей и по колонкам." },
        { q: "Сохранятся ли атрибуты?", a: "Да, как колонки с префиксом @, например @id." },
      ],
      en: [
        { q: "What becomes a row?", a: "If the root contains a repeated element (like <offer> in a product feed), each copy is a row. Otherwise the whole document is one row." },
        { q: "How do I open it in Excel?", a: "Turn on “BOM for Excel” and pick the delimiter your locale expects." },
        { q: "Are attributes kept?", a: "Yes, as columns prefixed with @, such as @id." },
      ],
    },
    about: { ru: "XML разбирается собственным парсером без сетевых запросов; затем находится первый массив элементов и разворачивается в таблицу.", en: "XML is parsed by our own parser without network access; the first repeated element list is then flattened into a table." },
  },
];

function tsvPair(from: "csv" | "tsv", to: "csv" | "tsv"): Pair {
  const toTsv = to === "tsv";
  return {
    from,
    to,
    icon: "Sheet",
    h1: { ru: toTsv ? "CSV в TSV онлайн" : "TSV в CSV онлайн", en: toTsv ? "CSV to TSV converter" : "TSV to CSV converter" },
    title: { ru: toTsv ? "CSV в TSV онлайн — запятые в табуляцию" : "TSV в CSV онлайн — табуляцию в запятые", en: toTsv ? "CSV to TSV online — commas to tabs" : "TSV to CSV online — tabs to commas" },
    description: toTsv
      ? {
          ru: "CSV в TSV онлайн: разделитель (запятая, «;» или «|») определяется сам, кавычки RFC 4180 учитываются — запятые и переносы в ячейках не ломают таблицу.",
          en: "CSV to TSV online: the delimiter (comma, semicolon or pipe) is detected and RFC 4180 quotes are respected, so commas and line breaks in cells are safe.",
        }
      : {
          ru: "Перевод TSV в CSV онлайн: табуляция заменяется на запятую или «;», поля с разделителями, кавычками и переносами берутся в кавычки по RFC 4180, BOM для Excel.",
          en: "Convert TSV to CSV online: tabs become commas or semicolons, fields with delimiters, quotes or line breaks are quoted per RFC 4180, optional BOM for Excel.",
        },
    lead: toTsv ? { ru: "Таблица CSV пересобирается с табуляцией — удобно для вставки в Excel и Google Таблицы.", en: "The CSV table is rebuilt with tabs — handy for pasting into spreadsheets." } : { ru: "Данные, скопированные из таблицы, превращаются в корректный CSV.", en: "Data copied from a spreadsheet becomes valid CSV." },
    rules: {
      ru: [["Вход", toTsv ? "CSV с автоопределением разделителя" : "значения через табуляцию"], ["Выход", toTsv ? "значения через табуляцию" : "CSV по RFC 4180"], ["Кавычки", "учитываются при чтении и ставятся при записи"], ["Перевод строк", "CRLF, как требует RFC 4180 и ожидает Excel"]],
      en: [["Input", toTsv ? "CSV with delimiter detection" : "tab-separated values"], ["Output", toTsv ? "tab-separated values" : "RFC 4180 CSV"], ["Quotes", "respected when reading, added when writing"], ["Line endings", "CRLF, as RFC 4180 specifies and Excel expects"]],
    },
    faq: {
      ru: [
        { q: "Почему нельзя просто заменить запятые на табуляцию?", a: "Запятые бывают внутри значений в кавычках — простая замена разрушит таблицу. Здесь каждая ячейка сначала разбирается, а потом записывается заново." },
        { q: "Какой разделитель выбрать для Excel?", a: "Для русской и казахской версии — точку с запятой, для английской — запятую. TSV Excel понимает в любой версии." },
        { q: "Сохранятся ли переносы строк в ячейках?", a: "Да, такие ячейки при записи берутся в кавычки." },
      ],
      en: [
        { q: "Why not just replace commas with tabs?", a: "Commas can appear inside quoted values — a blind replace breaks the table. Here each cell is parsed first and written again." },
        { q: "Which delimiter should I use for Excel?", a: "Comma for English locales, semicolon for many European ones. Excel reads TSV in any locale." },
        { q: "Are line breaks inside cells kept?", a: "Yes, such cells are quoted when written." },
      ],
    },
    about: PRIVACY,
  };
}

const EXISTING = new Set(PAIRS.map(slugOf));

const tools: ToolDef[] = PAIRS.map((p) => {
  const rev = `${p.to}-to-${p.from}`;
  return {
    slug: slugOf(p),
    component: "data/convert",
    icon: p.icon ?? "ArrowLeftRight",
    popular: p.popular,
    wide: true,
    props: { from: p.from, to: p.to, options: p.options ?? {}, reverse: EXISTING.has(rev) ? rev : undefined },
    name: { ru: `${FORMAT_META[p.from].label} в ${FORMAT_META[p.to].label}`, en: `${FORMAT_META[p.from].label} to ${FORMAT_META[p.to].label}` },
    h1: p.h1,
    title: p.title,
    description: p.description,
    lead: p.lead,
    keywords: { ru: [`${p.from} в ${p.to}`, `конвертер ${p.from} в ${p.to}`, `${p.from} to ${p.to}`], en: [`${p.from} to ${p.to}`, `convert ${p.from} to ${p.to}`, `${p.from} to ${p.to} converter`] },
    howTo: HOW(p),
    faq: p.faq,
    about: { ru: [p.about.ru, PRIVACY.ru], en: [p.about.en, PRIVACY.en] },
    blocks: (locale) => [{ type: "facts", title: locale === "ru" ? "Как преобразуются данные" : "How data is mapped", rows: p.rules[locale] }],
  };
});

export const dataSection = withRelated(
  defineToolSection({
    id: "data",
    name: { ru: "Конвертеры данных", en: "Data converters" },
    description: { ru: "JSON, CSV, YAML, XML, TOML, JSONL и .env — перевод между форматами и типы TypeScript", en: "JSON, CSV, YAML, XML, TOML, JSONL and .env — convert between formats and generate TypeScript types" },
    icon: "FileJson",
    hue: HUE,
    category: "dev",
    order: 2,
    tools,
  }),
  (segs) => {
    const [from, to] = segs[0].split("-to-");
    const rev = `${to}-to-${from}`;
    return [...(EXISTING.has(rev) ? [rev] : []), ...[...EXISTING].filter((s) => s !== segs[0] && s !== rev && (s.startsWith(`${from}-`) || s.endsWith(`-${to}`))).slice(0, 3)];
  },
);

registerTools("data", HUE, tools);
