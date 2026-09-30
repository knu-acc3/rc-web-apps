import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { withRelated } from "@/sections/code/kit/related";
import { NAMESPACES, uuidNameBased } from "./engine";

type Row = [string, string, string];
const layout = (locale: Locale, rows: { ru: Row[]; en: Row[] }, title: { ru: string; en: string }): Block => ({
  type: "table",
  title: title[locale],
  head: locale === "ru" ? ["Поле", "Бит", "Содержимое"] : ["Field", "Bits", "Contents"],
  rows: rows[locale],
});

const VARIANT_ROW = { ru: ["variant", "2", "10 — вариант RFC 9562"] as Row, en: ["variant", "2", "10 — RFC 9562 variant"] as Row };

const RELATED = ["random", "password", "hash", "date"];

const tools: ToolDef[] = [
  {
    slug: "",
    component: "uuid/generator",
    icon: "KeyRound",
    popular: true,
    props: { kind: "v4", count: 10 },
    name: { ru: "Генератор UUID v4", en: "UUID v4 generator" },
    h1: { ru: "Генератор UUID", en: "UUID generator" },
    title: { ru: "Генератор UUID онлайн — случайный UUID v4", en: "UUID generator online — random UUID v4" },
    description: {
      ru: "Генератор UUID v4 онлайн: 122 случайных бита из crypto.getRandomValues, до 10 000 штук за раз, заглавные буквы, скобки, URN. Всё создаётся в браузере.",
      en: "Online UUID v4 generator: 122 random bits from crypto.getRandomValues, up to 10,000 at once, uppercase, braces or URN format. Generated in your browser.",
    },
    lead: {
      ru: "Случайный UUID версии 4 — 36 символов вида xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx; новый при каждом нажатии.",
      en: "A random version 4 UUID — 36 characters like xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx; a new one on every click.",
    },
    keywords: { ru: ["uuid", "guid", "генератор uuid", "uuid v4", "случайный uuid", "уникальный идентификатор"], en: ["uuid", "guid", "uuid generator", "uuid v4", "random uuid"] },
    howTo: {
      ru: [
        "UUID создаётся сразу при открытии страницы — скопируйте его кнопкой «Копировать».",
        "Нажмите «Сгенерировать», чтобы получить новый набор.",
        "Укажите количество (до 10 000), чтобы получить список, и скачайте его в TXT или JSON.",
        "При необходимости включите заглавные буквы, фигурные скобки, формат без дефисов или префикс urn:uuid:.",
      ],
      en: [
        "A UUID is created as soon as the page opens — copy it with the Copy button.",
        "Click Generate to get a fresh set.",
        "Set how many you need (up to 10,000) to get a list, then download it as TXT or JSON.",
        "Switch on uppercase, braces, no dashes or the urn:uuid: prefix if your system expects them.",
      ],
    },
    faq: {
      ru: [
        { q: "Может ли UUID v4 повториться?", a: "Теоретически да, практически нет: в UUID v4 122 случайных бита. Чтобы вероятность хотя бы одного совпадения достигла 50 %, нужно сгенерировать около 2,7×10¹⁸ идентификаторов." },
        { q: "Насколько случайны эти UUID?", a: "Байты берутся из crypto.getRandomValues — криптографически стойкого генератора браузера. Затем выставляются 4 бита версии и 2 бита варианта, как требует RFC 9562." },
        { q: "Чем UUID отличается от GUID?", a: "Это одно и то же: GUID — название UUID в мире Microsoft. В .NET GUID обычно пишут заглавными буквами и иногда в фигурных скобках — эти форматы включаются галочками." },
        { q: "Какую версию UUID выбрать для базы данных?", a: "Для первичных ключей в PostgreSQL и MySQL лучше UUID v7: он растёт со временем, и индекс B-дерева не фрагментируется. UUID v4 подходит, когда порядок не важен или время создания нужно скрыть." },
      ],
      en: [
        { q: "Can a UUID v4 repeat?", a: "In theory yes, in practice no: a v4 UUID has 122 random bits. You would need about 2.7×10¹⁸ IDs before the chance of a single collision reaches 50%." },
        { q: "How random are these UUIDs?", a: "The bytes come from crypto.getRandomValues, the browser's cryptographically secure generator. Then 4 version bits and 2 variant bits are set as RFC 9562 requires." },
        { q: "What is the difference between UUID and GUID?", a: "None: GUID is Microsoft's name for a UUID. In .NET GUIDs are usually written in uppercase and sometimes in braces — enable those formats with the checkboxes." },
        { q: "Which UUID version is best for a database key?", a: "For primary keys in PostgreSQL or MySQL prefer UUID v7: it grows with time, so B-tree indexes don't fragment. UUID v4 is fine when order doesn't matter or the creation time must stay hidden." },
      ],
    },
    about: {
      ru: [
        "UUID (Universally Unique Identifier) — 128-битный идентификатор, который можно создавать без центрального сервера и без риска совпадения. Версия 4 целиком случайна, поэтому это самый распространённый вариант: gen_random_uuid() в PostgreSQL, crypto.randomUUID() в JavaScript и Guid.NewGuid() в .NET выдают именно v4.",
        "Генератор работает только в браузере: идентификаторы не отправляются на сервер и не сохраняются. На этой же странице можно получить до 10 000 UUID одним списком и скачать их файлом.",
      ],
      en: [
        "A UUID (Universally Unique Identifier) is a 128-bit identifier that can be created without a central server and without realistic risk of collision. Version 4 is fully random, which makes it the most common kind: PostgreSQL's gen_random_uuid(), JavaScript's crypto.randomUUID() and .NET's Guid.NewGuid() all return v4.",
        "The generator runs only in your browser: IDs are never sent anywhere or stored. You can also get up to 10,000 UUIDs as one list and download them as a file.",
      ],
    },
    blocks: (locale) => [
      layout(
        locale,
        {
          ru: [["random_a", "48", "случайные биты"], ["ver", "4", "0100 — версия 4"], ["random_b", "12", "случайные биты"], VARIANT_ROW.ru, ["random_c", "62", "случайные биты"]],
          en: [["random_a", "48", "random bits"], ["ver", "4", "0100 — version 4"], ["random_b", "12", "random bits"], VARIANT_ROW.en, ["random_c", "62", "random bits"]],
        },
        { ru: "Структура UUID v4", en: "UUID v4 layout" },
      ),
    ],
  },
  {
    slug: "v7",
    component: "uuid/generator",
    icon: "Clock",
    popular: true,
    props: { kind: "v7", count: 10 },
    name: { ru: "UUID v7", en: "UUID v7" },
    h1: { ru: "Генератор UUID v7", en: "UUID v7 generator" },
    title: { ru: "UUID v7 генератор онлайн — UUID с меткой времени", en: "UUID v7 generator online — time-ordered UUIDs" },
    description: {
      ru: "Генератор UUID v7 (RFC 9562): 48 бит времени Unix в миллисекундах и 74 случайных бита. Идентификаторы сортируются по времени создания, до 10 000 за раз.",
      en: "UUID v7 generator (RFC 9562): a 48-bit Unix timestamp in milliseconds plus 74 random bits. IDs sort by creation time; generate up to 10,000 at once.",
    },
    lead: {
      ru: "UUID v7 = 48 бит времени в миллисекундах + 74 случайных бита: идентификаторы упорядочены по времени создания.",
      en: "UUID v7 = 48-bit millisecond timestamp + 74 random bits, so IDs sort by creation time.",
    },
    keywords: { ru: ["uuid v7", "uuidv7", "uuid с временем", "сортируемый uuid"], en: ["uuid v7", "uuidv7", "time ordered uuid", "sortable uuid"] },
    howTo: {
      ru: [
        "Скопируйте готовый UUID v7 или нажмите «Сгенерировать» для нового набора.",
        "Задайте количество — в пределах одной миллисекунды идентификаторы всё равно идут строго по возрастанию.",
        "Чтобы узнать время создания любого UUID v7, откройте проверку UUID.",
      ],
      en: [
        "Copy the ready UUID v7 or click Generate for a new set.",
        "Set the count — even within one millisecond the IDs stay strictly increasing.",
        "To see when any UUID v7 was created, open the UUID decoder.",
      ],
    },
    faq: {
      ru: [
        { q: "Чем UUID v7 лучше v4 для первичного ключа?", a: "Новые значения v7 всегда больше старых, поэтому вставки идут в конец индекса B-дерева: меньше расщеплений страниц и фрагментации, чем со случайным v4, и записи можно сортировать по ключу как по времени." },
        { q: "Раскрывает ли UUID v7 время создания?", a: "Да, первые 48 бит — время Unix в миллисекундах, и его может прочитать любой. Если время создания записи нужно скрыть, используйте UUID v4." },
        { q: "Как обеспечена уникальность в одну миллисекунду?", a: "Используется метод 1 из RFC 9562: 12 бит rand_a работают как счётчик, который начинается со случайного значения и растёт в пределах миллисекунды. Остальные 62 бита случайны." },
        { q: "Где поддерживается UUID v7?", a: "Формат описан в RFC 9562 (2024). В PostgreSQL 18 есть функция uuidv7(), в Java, Go, Python и .NET 9 (Guid.CreateVersion7) — встроенные или популярные библиотеки." },
      ],
      en: [
        { q: "Why is UUID v7 better than v4 as a primary key?", a: "New v7 values are always larger than old ones, so inserts go to the end of a B-tree index: fewer page splits and less fragmentation than random v4, and rows sort by key in creation order." },
        { q: "Does UUID v7 reveal the creation time?", a: "Yes, the first 48 bits are a Unix timestamp in milliseconds that anyone can read. If creation time must stay private, use UUID v4." },
        { q: "How is uniqueness kept within one millisecond?", a: "This generator uses RFC 9562 method 1: the 12 rand_a bits act as a counter seeded randomly and incremented within the millisecond. The other 62 bits are random." },
        { q: "Where is UUID v7 supported?", a: "It is defined in RFC 9562 (2024). PostgreSQL 18 has uuidv7(); .NET 9 has Guid.CreateVersion7(); Java, Go and Python have popular libraries." },
      ],
    },
    about: {
      ru: [
        "UUID версии 7 появился в RFC 9562 в 2024 году как замена v1 и v6: время хранится в привычном формате Unix (миллисекунды с 1970 года), а вместо MAC-адреса — случайные биты. Благодаря времени в старших битах такие UUID сортируются по дате создания даже как обычные строки.",
        "Генератор создаёт UUID v7 прямо в браузере. При массовой генерации в пределах одной миллисекунды счётчик rand_a гарантирует строгое возрастание значений.",
      ],
      en: [
        "UUID version 7 was introduced in RFC 9562 in 2024 as a replacement for v1 and v6: time is stored as a plain Unix timestamp (milliseconds since 1970), and random bits replace the MAC address. Because time sits in the top bits, these UUIDs sort by creation date even as plain strings.",
        "This generator creates UUID v7 in your browser. In bulk generation within one millisecond the rand_a counter keeps values strictly increasing.",
      ],
    },
    blocks: (locale) => [
      layout(
        locale,
        {
          ru: [["unix_ts_ms", "48", "время Unix в миллисекундах"], ["ver", "4", "0111 — версия 7"], ["rand_a", "12", "счётчик внутри миллисекунды"], VARIANT_ROW.ru, ["rand_b", "62", "случайные биты"]],
          en: [["unix_ts_ms", "48", "Unix time in milliseconds"], ["ver", "4", "0111 — version 7"], ["rand_a", "12", "counter within the millisecond"], VARIANT_ROW.en, ["rand_b", "62", "random bits"]],
        },
        { ru: "Структура UUID v7", en: "UUID v7 layout" },
      ),
    ],
  },
  {
    slug: "v1",
    component: "uuid/generator",
    icon: "History",
    props: { kind: "v1", count: 10 },
    name: { ru: "UUID v1", en: "UUID v1" },
    h1: { ru: "Генератор UUID v1", en: "UUID v1 generator" },
    title: { ru: "UUID v1 генератор онлайн — UUID на основе времени", en: "UUID v1 generator online — time-based UUIDs" },
    description: {
      ru: "Генератор UUID v1: 60-битное время в интервалах по 100 нс с 15 октября 1582 года, clock sequence и случайный узел вместо MAC-адреса. До 10 000 за раз.",
      en: "UUID v1 generator: a 60-bit timestamp in 100 ns intervals since 15 October 1582, a clock sequence and a random node instead of a MAC address. Up to 10,000.",
    },
    lead: {
      ru: "UUID v1 хранит время создания с точностью 100 нс и 48-битный узел; здесь узел случайный, а не MAC-адрес компьютера.",
      en: "UUID v1 stores the creation time with 100 ns precision and a 48-bit node; here the node is random, never your MAC address.",
    },
    keywords: { ru: ["uuid v1", "uuid1", "uuid по времени"], en: ["uuid v1", "uuid1", "time based uuid"] },
    howTo: {
      ru: ["Скопируйте UUID v1 или нажмите «Сгенерировать».", "Укажите количество, чтобы получить список.", "Проверьте время внутри UUID на странице расшифровки."],
      en: ["Copy the UUID v1 or click Generate.", "Set a count to get a list.", "Check the time inside a UUID with the decoder."],
    },
    faq: {
      ru: [
        { q: "Почему узел не совпадает с MAC-адресом?", a: "Классический v1 содержит MAC-адрес сетевой карты, что раскрывает компьютер-источник. Браузер не даёт доступа к MAC, а RFC 9562 разрешает случайный узел с установленным битом multicast — так и сделано здесь." },
        { q: "Почему UUID v1 плохо сортируются?", a: "Младшие биты времени (time_low) стоят в начале строки, поэтому строковая сортировка не совпадает с хронологической. Эту проблему решают UUID v6 и v7." },
        { q: "Какая точность времени у UUID v1?", a: "Единица — 100 наносекунд. Браузер знает время с точностью до миллисекунды, поэтому младшие разряды заполняются счётчиком, чтобы идентификаторы в одну миллисекунду не совпадали." },
      ],
      en: [
        { q: "Why isn't the node my MAC address?", a: "Classic v1 embeds the network card's MAC address, which identifies the source machine. Browsers don't expose the MAC, and RFC 9562 allows a random node with the multicast bit set — which is what this tool does." },
        { q: "Why don't UUID v1 values sort well?", a: "The low bits of time (time_low) come first in the string, so string order differs from time order. UUID v6 and v7 fix this." },
        { q: "What is the time precision of UUID v1?", a: "One unit is 100 nanoseconds. The browser clock has millisecond precision, so the lower digits are filled by a counter to keep IDs within one millisecond unique." },
      ],
    },
    about: {
      ru: [
        "UUID версии 1 — самый старый формат из RFC 4122: время в интервалах по 100 нс с момента введения григорианского календаря (15.10.1582), 14-битная clock sequence и 48-битный узел. Его до сих пор используют Cassandra (timeuuid) и старые системы.",
        "Для новых проектов RFC 9562 рекомендует UUID v7: он тоже основан на времени, но сортируется правильно и не содержит данных об оборудовании.",
      ],
      en: [
        "UUID version 1 is the oldest format from RFC 4122: time in 100 ns intervals since the Gregorian calendar reform (15 Oct 1582), a 14-bit clock sequence and a 48-bit node. Cassandra (timeuuid) and older systems still use it.",
        "For new projects RFC 9562 recommends UUID v7: it is also time-based but sorts correctly and carries no hardware data.",
      ],
    },
    blocks: (locale) => [
      layout(
        locale,
        {
          ru: [["time_low", "32", "младшие 32 бита времени"], ["time_mid", "16", "средние 16 бит времени"], ["ver", "4", "0001 — версия 1"], ["time_high", "12", "старшие 12 бит времени"], VARIANT_ROW.ru, ["clock_seq", "14", "clock sequence"], ["node", "48", "узел (здесь случайный)"]],
          en: [["time_low", "32", "low 32 bits of time"], ["time_mid", "16", "middle 16 bits of time"], ["ver", "4", "0001 — version 1"], ["time_high", "12", "high 12 bits of time"], VARIANT_ROW.en, ["clock_seq", "14", "clock sequence"], ["node", "48", "node (random here)"]],
        },
        { ru: "Структура UUID v1", en: "UUID v1 layout" },
      ),
    ],
  },
  nameTool(3),
  nameTool(5),
  {
    slug: "nil",
    component: "uuid/nil",
    icon: "CircleSlash",
    name: { ru: "Nil и Max UUID", en: "Nil & Max UUID" },
    h1: { ru: "Nil UUID и Max UUID", en: "Nil UUID and Max UUID" },
    title: { ru: "Nil UUID и Max UUID — нулевой и максимальный UUID", en: "Nil UUID and Max UUID — all zeros and all ones" },
    description: {
      ru: "Nil UUID 00000000-0000-0000-0000-000000000000 и Max UUID ffffffff-ffff-ffff-ffff-ffffffffffff из RFC 9562: значения, форматы и когда их использовать.",
      en: "Nil UUID 00000000-0000-0000-0000-000000000000 and Max UUID ffffffff-ffff-ffff-ffff-ffffffffffff from RFC 9562: values, formats and when to use them.",
    },
    lead: { ru: "Nil UUID — 32 нуля, Max UUID — 32 символа f; оба определены в RFC 9562.", en: "Nil UUID is 32 zeros, Max UUID is 32 f characters; both are defined in RFC 9562." },
    keywords: { ru: ["nil uuid", "пустой uuid", "нулевой uuid", "max uuid"], en: ["nil uuid", "empty uuid", "zero uuid", "max uuid", "guid empty"] },
    howTo: {
      ru: ["Скопируйте Nil или Max UUID кнопкой рядом со значением.", "Включите заглавные буквы, скобки или префикс urn:uuid:, если нужно.", "Используйте Nil UUID как «пустое» значение вместо NULL, если схема этого требует."],
      en: ["Copy the Nil or Max UUID with the button next to it.", "Switch on uppercase, braces or the urn:uuid: prefix if needed.", "Use the Nil UUID as an 'empty' value instead of NULL when your schema requires one."],
    },
    faq: {
      ru: [
        { q: "Что такое Guid.Empty?", a: "В .NET Guid.Empty — это Nil UUID: {00000000-0000-0000-0000-000000000000}. Он удобен как значение по умолчанию, но не должен использоваться как реальный идентификатор." },
        { q: "Зачем нужен Max UUID?", a: "Max UUID появился в RFC 9562 как верхняя граница: например, для диапазонов в запросах или как маркер «больше любого возможного UUID»." },
        { q: "Какая версия у Nil UUID?", a: "Никакая: все биты равны нулю, поэтому поля версии и варианта не заданы. Это специальное значение, а не UUID какой-либо версии." },
      ],
      en: [
        { q: "What is Guid.Empty?", a: "In .NET, Guid.Empty is the Nil UUID: {00000000-0000-0000-0000-000000000000}. It works as a default value but must never be used as a real identifier." },
        { q: "What is the Max UUID for?", a: "The Max UUID was added in RFC 9562 as an upper bound: for range queries or as a marker greater than any possible UUID." },
        { q: "What version is the Nil UUID?", a: "None: all bits are zero, so the version and variant fields are not set. It is a special value, not a UUID of any version." },
      ],
    },
    about: {
      ru: ["Nil UUID (все 128 бит равны нулю) и Max UUID (все биты равны единице) — два специальных значения стандарта. Их часто используют как значения по умолчанию, границы диапазонов и заглушки в тестах."],
      en: ["The Nil UUID (all 128 bits zero) and the Max UUID (all bits one) are the two special values of the standard. They are common as defaults, range bounds and placeholders in tests."],
    },
  },
  {
    slug: "bulk",
    component: "uuid/generator",
    icon: "ListOrdered",
    props: { kind: "v4", count: 100, kinds: ["v4", "v7", "v1", "v6", "ulid", "objectid"] },
    name: { ru: "Массовая генерация UUID", en: "Bulk UUID generator" },
    h1: { ru: "Массовая генерация UUID", en: "Bulk UUID generator" },
    title: { ru: "Массовая генерация UUID — до 10 000 штук за раз", en: "Bulk UUID generator — up to 10,000 at once" },
    description: {
      ru: "Сгенерируйте до 10 000 UUID v4, v7, v1, v6, ULID или ObjectId одним списком. Форматы: заглавные, скобки, без дефисов, URN. Скачивание в TXT и JSON.",
      en: "Generate up to 10,000 UUID v4, v7, v1, v6, ULID or ObjectId values in one list. Uppercase, braces, no dashes or URN; download as TXT or JSON.",
    },
    lead: { ru: "Список до 10 000 идентификаторов любого типа за одно нажатие — с выбором формата и скачиванием файлом.", en: "A list of up to 10,000 IDs of any type in one click — with format options and file download." },
    keywords: { ru: ["массовая генерация uuid", "список uuid", "много uuid"], en: ["bulk uuid", "uuid list", "multiple uuids"] },
    howTo: {
      ru: ["Выберите тип идентификатора: UUID v4, v7, v1, v6, ULID или ObjectId.", "Укажите количество от 1 до 10 000 и нажмите Enter.", "Настройте формат и скачайте список в TXT или JSON либо скопируйте его."],
      en: ["Pick the ID type: UUID v4, v7, v1, v6, ULID or ObjectId.", "Enter a count from 1 to 10,000 and press Enter.", "Adjust the format, then download the list as TXT or JSON or copy it."],
    },
    faq: {
      ru: [
        { q: "Будут ли в списке дубликаты?", a: "Нет. Для v4 вероятность совпадения ничтожна, а для v1, v6, v7, ULID и ObjectId в одну миллисекунду работает счётчик, поэтому значения гарантированно различны и идут по возрастанию." },
        { q: "Как вставить список в SQL?", a: "Скачайте JSON или скопируйте список и оберните строки в кавычки через поиск и замену. Для PostgreSQL значения можно сразу привести к типу uuid: '…'::uuid." },
        { q: "Почему максимум 10 000?", a: "Этого хватает для тестовых данных и миграций, а страница остаётся быстрой. Если нужно больше, сгенерируйте несколько списков." },
      ],
      en: [
        { q: "Can the list contain duplicates?", a: "No. For v4 the collision chance is negligible, and v1, v6, v7, ULID and ObjectId use a counter within the same millisecond, so values are distinct and increasing." },
        { q: "How do I use the list in SQL?", a: "Download the JSON or copy the list and wrap lines in quotes with find-and-replace. In PostgreSQL you can cast them directly: '…'::uuid." },
        { q: "Why is the limit 10,000?", a: "It covers test data and migrations while keeping the page fast. If you need more, generate several lists." },
      ],
    },
    about: {
      ru: ["Массовая генерация пригодится для тестовых данных, фикстур и миграций. Все идентификаторы создаются в браузере за доли секунды и никуда не передаются."],
      en: ["Bulk generation is handy for test data, fixtures and migrations. All IDs are created in your browser in a fraction of a second and are never sent anywhere."],
    },
  },
  {
    slug: "guid",
    component: "uuid/generator",
    icon: "Braces",
    props: { kind: "v4", count: 10, upper: true, braces: true },
    name: { ru: "Генератор GUID", en: "GUID generator" },
    h1: { ru: "Генератор GUID", en: "GUID generator" },
    title: { ru: "Генератор GUID онлайн — GUID для C# и .NET", en: "GUID generator online — GUIDs for C# and .NET" },
    description: {
      ru: "Генератор GUID онлайн: случайные GUID (UUID v4) в формате Microsoft — заглавные буквы и фигурные скобки {…}, как в реестре Windows и Visual Studio.",
      en: "Online GUID generator: random GUIDs (UUID v4) in Microsoft style — uppercase and wrapped in braces {…}, as in the Windows registry and Visual Studio.",
    },
    lead: { ru: "GUID — это UUID v4 в записи Microsoft: {XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX}.", en: "A GUID is a UUID v4 written the Microsoft way: {XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX}." },
    keywords: { ru: ["guid", "генератор guid", "guid c#", "guid .net"], en: ["guid", "guid generator", "c# guid", "new guid"] },
    howTo: {
      ru: ["Скопируйте готовый GUID — он уже в заглавных буквах и фигурных скобках.", "Снимите галочки, если нужен формат без скобок, как у Guid.ToString().", "Укажите количество, чтобы получить список GUID."],
      en: ["Copy the ready GUID — it is already uppercase and in braces.", "Clear the checkboxes for the brace-less format of Guid.ToString().", "Set a count to get a list of GUIDs."],
    },
    faq: {
      ru: [
        { q: "Как создать GUID в C#?", a: "Вызовите Guid.NewGuid() — он возвращает случайный GUID версии 4. Метод ToString() выводит его строчными буквами без скобок, ToString(\"B\") — в фигурных скобках." },
        { q: "GUID и UUID — одно и то же?", a: "Да. GUID — термин Microsoft для UUID. Разница только в записи: в Windows принято писать заглавными буквами и в скобках." },
        { q: "Как создать GUID в PowerShell?", a: "Командой [guid]::NewGuid() или New-Guid. Результат — тот же UUID версии 4." },
      ],
      en: [
        { q: "How do I create a GUID in C#?", a: "Call Guid.NewGuid() — it returns a random version 4 GUID. ToString() prints it in lowercase without braces; ToString(\"B\") adds braces." },
        { q: "Are GUID and UUID the same?", a: "Yes. GUID is Microsoft's term for a UUID. Only the notation differs: Windows usually shows uppercase letters in braces." },
        { q: "How do I create a GUID in PowerShell?", a: "Use [guid]::NewGuid() or New-Guid. The result is the same version 4 UUID." },
      ],
    },
    about: {
      ru: ["GUID (Globally Unique Identifier) используется в COM, реестре Windows, проектах Visual Studio и SQL Server (uniqueidentifier). По устройству это UUID версии 4, поэтому GUID из этого генератора подходит везде, где ожидается UUID."],
      en: ["GUIDs (Globally Unique Identifiers) are used in COM, the Windows registry, Visual Studio projects and SQL Server (uniqueidentifier). Structurally they are version 4 UUIDs, so a GUID from this generator works anywhere a UUID is expected."],
    },
  },
  {
    slug: "ulid",
    component: "uuid/generator",
    icon: "ArrowDownNarrowWide",
    popular: true,
    props: { kind: "ulid", count: 10 },
    name: { ru: "Генератор ULID", en: "ULID generator" },
    title: { ru: "Генератор ULID онлайн — сортируемые уникальные ID", en: "ULID generator online — sortable unique IDs" },
    description: {
      ru: "Генератор ULID: 26 символов Crockford Base32 — 48 бит времени в миллисекундах и 80 случайных бит. Монотонный режим, до 10 000 штук, расшифровка времени.",
      en: "ULID generator: 26 Crockford Base32 characters — a 48-bit millisecond timestamp and 80 random bits. Monotonic mode, up to 10,000 at once, time decoding.",
    },
    lead: { ru: "ULID — 26 символов: первые 10 кодируют время в миллисекундах, остальные 16 — случайность; сортируется как строка.", en: "A ULID has 26 characters: the first 10 encode the time in milliseconds, the last 16 are random; it sorts as a string." },
    keywords: { ru: ["ulid", "генератор ulid", "ulid vs uuid"], en: ["ulid", "ulid generator", "ulid vs uuid"] },
    howTo: {
      ru: ["Скопируйте готовый ULID или нажмите «Сгенерировать».", "Оставьте монотонный режим включённым, чтобы ULID в одну миллисекунду шли по возрастанию.", "Узнайте время создания ULID на странице расшифровки."],
      en: ["Copy the ready ULID or click Generate.", "Keep monotonic mode on so ULIDs within one millisecond keep increasing.", "Read the creation time of any ULID in the decoder."],
    },
    faq: {
      ru: [
        { q: "Чем ULID отличается от UUID v7?", a: "По смыслу почти ничем: оба хранят 48 бит времени и случайность. ULID короче в записи (26 символов против 36) и не содержит полей версии, а UUID v7 совместим с типом uuid в базах данных." },
        { q: "Какие символы используются в ULID?", a: "Crockford Base32: цифры и заглавные латинские буквы без I, L, O и U, чтобы их нельзя было перепутать. Регистр не важен." },
        { q: "Что делает монотонный режим?", a: "Если несколько ULID создаются в одну миллисекунду, случайная часть следующего равна предыдущей плюс один. Так порядок сохраняется даже внутри миллисекунды." },
      ],
      en: [
        { q: "How does ULID differ from UUID v7?", a: "Barely: both store 48 bits of time plus randomness. A ULID is shorter as text (26 characters vs 36) and has no version fields, while UUID v7 fits the uuid column type in databases." },
        { q: "Which characters does a ULID use?", a: "Crockford Base32: digits and uppercase Latin letters except I, L, O and U, so they can't be confused. Case doesn't matter." },
        { q: "What does monotonic mode do?", a: "When several ULIDs are created in the same millisecond, the random part of the next one is the previous plus one, so order is kept even within a millisecond." },
      ],
    },
    about: {
      ru: ["ULID (Universally Unique Lexicographically Sortable Identifier) придуман как короткая и сортируемая альтернатива UUID. Максимальное время, которое помещается в 48 бит, — 10889 год, поэтому первый символ ULID всегда от 0 до 7."],
      en: ["ULID (Universally Unique Lexicographically Sortable Identifier) was designed as a short, sortable alternative to UUID. The largest time that fits in 48 bits is in the year 10889, so the first ULID character is always 0–7."],
    },
    blocks: (locale) => [
      layout(
        locale,
        {
          ru: [["timestamp", "48", "время Unix в мс — 10 символов"], ["randomness", "80", "случайные биты — 16 символов"]],
          en: [["timestamp", "48", "Unix time in ms — 10 characters"], ["randomness", "80", "random bits — 16 characters"]],
        },
        { ru: "Структура ULID", en: "ULID layout" },
      ),
    ],
  },
  {
    slug: "nanoid",
    component: "uuid/nanoid",
    icon: "Hash",
    popular: true,
    name: { ru: "Генератор NanoID", en: "NanoID generator" },
    title: { ru: "Генератор NanoID — короткие уникальные ID онлайн", en: "NanoID generator — short unique IDs online" },
    description: {
      ru: "Генератор NanoID: 21 символ A–Z, a–z, 0–9, _ и - (126 бит энтропии), свой алфавит и длина от 2 до 64, расчёт вероятности коллизий для вашей нагрузки.",
      en: "NanoID generator: 21 characters from A–Z, a–z, 0–9, _ and - (126 bits of entropy), custom alphabet and length 2–64, collision probability for your load.",
    },
    lead: { ru: "NanoID по умолчанию — 21 символ URL-безопасного алфавита из 64 знаков: 126 бит случайности, как у UUID v4, но короче.", en: "A default NanoID is 21 characters of a URL-safe 64-symbol alphabet: 126 random bits, like UUID v4 but shorter." },
    keywords: { ru: ["nanoid", "генератор nanoid", "короткий id", "случайная строка id"], en: ["nanoid", "nanoid generator", "short id", "nano id collision"] },
    howTo: {
      ru: ["Выберите алфавит или задайте свой набор символов.", "Настройте длину ползунком — ниже сразу пересчитается риск коллизий.", "Укажите, сколько ID в час вы создаёте, чтобы оценить, когда вероятность совпадения достигнет 1 %.", "Скопируйте ID или список."],
      en: ["Pick an alphabet or enter your own set of characters.", "Adjust the length with the slider — the collision risk updates below.", "Enter how many IDs per hour you create to see when the collision chance reaches 1%.", "Copy the ID or the list."],
    },
    faq: {
      ru: [
        { q: "Насколько безопасен NanoID?", a: "Стандартный NanoID из 21 символа содержит 126 случайных бит — почти как UUID v4 (122 бита). Здесь символы выбираются через crypto.getRandomValues с отбраковкой лишних значений, поэтому распределение равномерное." },
        { q: "Как рассчитывается вероятность коллизии?", a: "По формуле парадокса дней рождения: p ≈ 1 − e^(−n²/2N), где N — число возможных ID (размер алфавита в степени длины), n — число созданных ID." },
        { q: "Можно ли использовать свой алфавит?", a: "Да, от 2 до 256 различных символов, включая кириллицу. Чем меньше алфавит, тем длиннее должен быть ID для той же надёжности — калькулятор ниже это покажет." },
      ],
      en: [
        { q: "How secure is NanoID?", a: "A default 21-character NanoID holds 126 random bits — about the same as UUID v4 (122 bits). Here characters come from crypto.getRandomValues with rejection sampling, so the distribution is uniform." },
        { q: "How is the collision probability calculated?", a: "With the birthday bound: p ≈ 1 − e^(−n²/2N), where N is the number of possible IDs (alphabet size to the power of length) and n is how many IDs you create." },
        { q: "Can I use a custom alphabet?", a: "Yes, 2 to 256 distinct characters, even non-Latin ones. The smaller the alphabet, the longer the ID must be for the same safety — the calculator below shows how much." },
      ],
    },
    about: {
      ru: ["NanoID — популярная библиотека JavaScript для коротких случайных идентификаторов: ссылок, кодов приглашений, ключей в URL. Этот генератор повторяет её алгоритм (маска битов и отбраковка), поэтому результат не смещён даже для алфавитов нестандартного размера."],
      en: ["NanoID is a popular JavaScript library for short random IDs: links, invite codes, URL keys. This generator follows the same algorithm (bit mask plus rejection), so output is unbiased even for alphabets of unusual size."],
    },
  },
  {
    slug: "objectid",
    component: "uuid/generator",
    icon: "Database",
    props: { kind: "objectid", count: 10 },
    name: { ru: "MongoDB ObjectId", en: "MongoDB ObjectId" },
    h1: { ru: "Генератор MongoDB ObjectId", en: "MongoDB ObjectId generator" },
    title: { ru: "Генератор MongoDB ObjectId онлайн", en: "MongoDB ObjectId generator online" },
    description: {
      ru: "Генератор MongoDB ObjectId: 12 байт (24 hex-символа) — 4 байта времени в секундах, 5 случайных байт и 3-байтовый счётчик. До 10 000 штук и расшифровка.",
      en: "MongoDB ObjectId generator: 12 bytes (24 hex characters) — a 4-byte timestamp in seconds, 5 random bytes and a 3-byte counter. Up to 10,000 plus decoding.",
    },
    lead: { ru: "ObjectId — 24 шестнадцатеричных символа; первые 8 — время создания в секундах Unix.", en: "An ObjectId is 24 hex characters; the first 8 are the creation time in Unix seconds." },
    keywords: { ru: ["objectid", "mongodb objectid", "генератор objectid"], en: ["objectid", "mongodb objectid", "objectid generator"] },
    howTo: {
      ru: ["Скопируйте готовый ObjectId или нажмите «Сгенерировать».", "Укажите количество для списка.", "Время создания любого ObjectId покажет страница расшифровки."],
      en: ["Copy the ready ObjectId or click Generate.", "Set a count to get a list.", "The decoder shows the creation time of any ObjectId."],
    },
    faq: {
      ru: [
        { q: "Как узнать время создания документа по ObjectId?", a: "Первые 4 байта — секунды Unix. В mongosh это ObjectId(\"…\").getTimestamp(), а здесь достаточно вставить ID в расшифровку." },
        { q: "Уникален ли ObjectId глобально?", a: "Практически да: 5 случайных байт выбираются один раз на процесс, а 3-байтовый счётчик растёт с каждым ID, поэтому в одну секунду один процесс может создать 16,7 млн разных значений." },
        { q: "Можно ли вставлять такие ObjectId в MongoDB?", a: "Да, формат совпадает с драйверами MongoDB 3.4+. Передайте строку в конструктор ObjectId(\"…\")." },
      ],
      en: [
        { q: "How do I get a document's creation time from its ObjectId?", a: "The first 4 bytes are Unix seconds. In mongosh use ObjectId(\"…\").getTimestamp(); here, paste the ID into the decoder." },
        { q: "Is an ObjectId globally unique?", a: "Practically yes: 5 random bytes are chosen once per process and a 3-byte counter increases with every ID, so one process can create 16.7 million distinct values per second." },
        { q: "Can I insert these ObjectIds into MongoDB?", a: "Yes, the format matches MongoDB drivers 3.4+. Pass the string to the ObjectId(\"…\") constructor." },
      ],
    },
    about: {
      ru: ["ObjectId — стандартный тип поля _id в MongoDB. В отличие от UUID он короче (12 байт) и хранит время создания с точностью до секунды, поэтому документы с такими ключами примерно упорядочены по времени."],
      en: ["ObjectId is the default _id type in MongoDB. Compared with a UUID it is shorter (12 bytes) and stores the creation time to the second, so documents keyed by it are roughly ordered by time."],
    },
    blocks: (locale) => [
      layout(
        locale,
        {
          ru: [["timestamp", "32", "секунды Unix"], ["random", "40", "случайное значение процесса"], ["counter", "24", "счётчик со случайным началом"]],
          en: [["timestamp", "32", "Unix seconds"], ["random", "40", "per-process random value"], ["counter", "24", "counter with a random start"]],
        },
        { ru: "Структура ObjectId", en: "ObjectId layout" },
      ),
    ],
  },
  {
    slug: "validator",
    component: "uuid/decoder",
    icon: "ScanSearch",
    popular: true,
    name: { ru: "Проверка и расшифровка UUID", en: "UUID validator & decoder" },
    h1: { ru: "Проверка и расшифровка UUID", en: "UUID validator and decoder" },
    title: { ru: "Проверка UUID онлайн — версия, вариант и время", en: "UUID validator online — version, variant and time" },
    description: {
      ru: "Проверка UUID, ULID и ObjectId: версия (v1–v8), вариант, время создания для v1, v6, v7, ULID и ObjectId, clock sequence и узел. Сразу для списка ID.",
      en: "Validate UUID, ULID and ObjectId values: version (v1–v8), variant, creation time for v1, v6, v7, ULID and ObjectId, clock sequence and node — for a whole list.",
    },
    lead: { ru: "Вставьте один или несколько идентификаторов — тип, версия и время создания появятся сразу.", en: "Paste one or more IDs — type, version and creation time appear instantly." },
    keywords: { ru: ["проверить uuid", "валидация uuid", "версия uuid", "декодер uuid", "время из uuid"], en: ["uuid validator", "validate uuid", "uuid version", "uuid decoder", "uuid timestamp"] },
    howTo: {
      ru: ["Вставьте UUID, ULID или ObjectId — по одному в строке.", "Посмотрите тип, версию и вариант каждого значения.", "Для v1, v6, v7, ULID и ObjectId прочитайте время создания в UTC и в вашем часовом поясе."],
      en: ["Paste UUIDs, ULIDs or ObjectIds, one per line.", "See the type, version and variant of each value.", "For v1, v6, v7, ULID and ObjectId read the creation time in UTC and in your time zone."],
    },
    faq: {
      ru: [
        { q: "Как определить версию UUID?", a: "Это первая цифра третьей группы: в xxxxxxxx-xxxx-7xxx-… версия 7. Первая цифра четвёртой группы (8, 9, a или b) означает стандартный вариант RFC 9562." },
        { q: "Какие форматы записи принимаются?", a: "Любой регистр, с дефисами и без, в фигурных скобках и с префиксом urn:uuid:. Лишние пробелы по краям игнорируются." },
        { q: "Можно ли узнать время из UUID v4?", a: "Нет: v4 полностью случайный, как и v3/v5 (хэши имени). Время хранят только v1, v6 и v7, а также ULID и ObjectId." },
        { q: "Почему NanoID помечен знаком вопроса?", a: "У NanoID нет структуры, по которой его можно однозначно узнать: строка из 21 символа алфавита NanoID лишь похожа на него и не содержит данных." },
      ],
      en: [
        { q: "How do I tell the UUID version?", a: "It is the first digit of the third group: xxxxxxxx-xxxx-7xxx-… is version 7. The first digit of the fourth group (8, 9, a or b) means the standard RFC 9562 variant." },
        { q: "Which notations are accepted?", a: "Any case, with or without dashes, in braces and with the urn:uuid: prefix. Surrounding spaces are ignored." },
        { q: "Can I get a time from a UUID v4?", a: "No: v4 is fully random, and v3/v5 are name hashes. Only v1, v6 and v7 store time, as do ULID and ObjectId." },
        { q: "Why is NanoID marked with a question mark?", a: "A NanoID has no structure to identify it reliably: a 21-character string of the NanoID alphabet only looks like one and carries no data." },
      ],
    },
    about: {
      ru: ["Расшифровка работает по структуре из RFC 9562: для UUID v1 и v6 время восстанавливается из 60-битного счётчика интервалов по 100 нс с 1582 года, для v7 — из 48 бит миллисекунд Unix. Для каждого значения видно, похож ли узел v1 на настоящий MAC-адрес или он случайный."],
      en: ["Decoding follows the RFC 9562 layouts: for UUID v1 and v6 the time comes from the 60-bit count of 100 ns intervals since 1582, for v7 from 48 bits of Unix milliseconds. For v1 you can also see whether the node looks like a real MAC address or is random."],
    },
  },
];

function nameTool(version: 3 | 5): ToolDef {
  const hash = version === 3 ? "MD5" : "SHA-1";
  const example = uuidNameBased(version, NAMESPACES.dns, "example.com");
  return {
    slug: `v${version}`,
    component: "uuid/name",
    icon: "Fingerprint",
    props: { version, name: "example.com", namespace: "dns" },
    name: { ru: `UUID v${version}`, en: `UUID v${version}` },
    h1: { ru: `Генератор UUID v${version}`, en: `UUID v${version} generator` },
    title: {
      ru: `UUID v${version} генератор — UUID из имени (${hash})`,
      en: `UUID v${version} generator — name-based UUID (${hash})`,
    },
    description: {
      ru: `UUID v${version} из пространства имён и имени по ${hash} (RFC 9562): одинаковые входные данные всегда дают одинаковый UUID. Пространства DNS, URL, OID, X.500 и свои.`,
      en: `Name-based UUID v${version} using ${hash} (RFC 9562): the same namespace and name always give the same UUID. DNS, URL, OID and X.500 namespaces or your own.`,
    },
    lead: {
      ru: `UUID v${version} для «example.com» в пространстве DNS — ${example}; результат зависит только от пространства и имени.`,
      en: `UUID v${version} for "example.com" in the DNS namespace is ${example}; the result depends only on the namespace and name.`,
    },
    keywords: { ru: [`uuid v${version}`, `uuid${version}`, "uuid из строки", "детерминированный uuid"], en: [`uuid v${version}`, `uuid${version}`, "name based uuid", "deterministic uuid"] },
    howTo: {
      ru: ["Выберите пространство имён: DNS для доменов, URL для адресов или свой UUID.", "Введите имя — UUID пересчитается сразу.", "Включите режим нескольких имён, чтобы получить UUID для каждой строки списка."],
      en: ["Choose a namespace: DNS for domain names, URL for addresses, or your own UUID.", "Type the name — the UUID updates instantly.", "Turn on several names to get a UUID for each line of a list."],
    },
    faq:
      version === 5
        ? {
            ru: [
              { q: "Чем UUID v5 отличается от v3?", a: "Только хэш-функцией: v5 использует SHA-1, v3 — MD5. RFC 9562 рекомендует v5, если нет требования совместимости со старыми системами." },
              { q: "Зачем нужен детерминированный UUID?", a: "Чтобы разные системы независимо получали один и тот же идентификатор для одной сущности — например, для URL или e-mail — без общей базы данных." },
              { q: "Можно ли восстановить имя по UUID v5?", a: "Нет, хэш необратим. Но если имя угадываемое (например, домен), его можно подобрать, поэтому не используйте v5 для секретных данных." },
            ],
            en: [
              { q: "How does UUID v5 differ from v3?", a: "Only by the hash: v5 uses SHA-1, v3 uses MD5. RFC 9562 recommends v5 unless you need compatibility with older systems." },
              { q: "Why use a deterministic UUID?", a: "So that different systems independently derive the same ID for the same entity — a URL or an e-mail, say — without a shared database." },
              { q: "Can the name be recovered from a UUID v5?", a: "No, the hash is one-way. But guessable names (like domains) can be brute-forced, so don't use v5 for secret data." },
            ],
          }
        : {
            ru: [
              { q: "Стоит ли использовать UUID v3?", a: "Только для совместимости: v3 основан на MD5. Для новых проектов RFC 9562 рекомендует UUID v5 на SHA-1." },
              { q: "Одинаковое имя всегда даёт одинаковый UUID?", a: "Да, если совпадают и пространство имён, и имя (с учётом регистра и пробелов). Имя кодируется в UTF-8." },
              { q: "Что такое пространство имён?", a: "Это UUID, который отделяет разные виды имён: стандартные DNS, URL, OID и X.500 описаны в RFC 9562, но можно взять любой свой UUID." },
            ],
            en: [
              { q: "Should I use UUID v3?", a: "Only for compatibility: v3 is based on MD5. For new projects RFC 9562 recommends SHA-1-based UUID v5." },
              { q: "Does the same name always give the same UUID?", a: "Yes, as long as both the namespace and the name match exactly (case and spaces included). The name is encoded as UTF-8." },
              { q: "What is a namespace?", a: "A UUID that separates kinds of names: the standard DNS, URL, OID and X.500 namespaces are listed in RFC 9562, but any UUID of your own works." },
            ],
          },
    about: {
      ru: [
        `UUID версии ${version} вычисляется как ${hash} от байтов UUID пространства имён и имени в UTF-8; из результата берутся первые 16 байт и выставляются биты версии и варианта. Поэтому он воспроизводим: те же входные данные дают тот же UUID в любом языке программирования.`,
      ],
      en: [
        `A version ${version} UUID is the ${hash} of the namespace UUID bytes followed by the UTF-8 name; the first 16 bytes are kept and the version and variant bits are set. That makes it reproducible: the same input gives the same UUID in any programming language.`,
      ],
    },
  };
}

export const uuidSection = withRelated(defineToolSection({
  id: "uuid",
  name: { ru: "UUID и ID", en: "UUID & IDs" },
  title: { ru: "Генератор UUID онлайн — UUID v4, v7, ULID, NanoID", en: "UUID generator online — UUID v4, v7, ULID, NanoID" },
  description: {
    ru: "Генерация и расшифровка уникальных идентификаторов: UUID v4, v7, v1, v3, v5, GUID, ULID, NanoID и MongoDB ObjectId — в браузере, до 10 000 штук за раз.",
    en: "Generate and decode unique identifiers: UUID v4, v7, v1, v3, v5, GUID, ULID, NanoID and MongoDB ObjectId — in your browser, up to 10,000 at a time.",
  },
  icon: "KeyRound",
  hue: 170,
  category: "dev",
  order: 7,
  tools,
}), () => RELATED);
