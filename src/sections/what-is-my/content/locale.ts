import type { Locale } from "@/i18n/config";
import type { ToolDef } from "@/registry/types";
import { dstInfo, utcLabel } from "../lib/tz";

const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);

/** Rules are shown for a fixed year so the build output is deterministic. */
const TABLE_YEAR = 2026;

const ZONES_RU: [string, string][] = [
  ["Asia/Almaty", "Алматы, Астана"],
  ["Asia/Qostanay", "Костанай"],
  ["Asia/Aqtau", "Актау"],
  ["Asia/Oral", "Уральск"],
  ["Asia/Tashkent", "Ташкент"],
  ["Asia/Bishkek", "Бишкек"],
  ["Europe/Kaliningrad", "Калининград"],
  ["Europe/Moscow", "Москва, Санкт-Петербург"],
  ["Europe/Samara", "Самара"],
  ["Asia/Yekaterinburg", "Екатеринбург"],
  ["Asia/Omsk", "Омск"],
  ["Asia/Novosibirsk", "Новосибирск"],
  ["Asia/Krasnoyarsk", "Красноярск"],
  ["Asia/Irkutsk", "Иркутск"],
  ["Asia/Yakutsk", "Якутск"],
  ["Asia/Vladivostok", "Владивосток"],
  ["Asia/Magadan", "Магадан"],
  ["Asia/Kamchatka", "Петропавловск-Камчатский"],
  ["Europe/Minsk", "Минск"],
];

const ZONES_EN: [string, string][] = [
  ["America/Los_Angeles", "Los Angeles"],
  ["America/Denver", "Denver"],
  ["America/Chicago", "Chicago"],
  ["America/New_York", "New York, Toronto"],
  ["America/Sao_Paulo", "São Paulo"],
  ["Europe/London", "London, Dublin"],
  ["Europe/Berlin", "Berlin, Paris, Madrid"],
  ["Europe/Kyiv", "Kyiv"],
  ["Europe/Moscow", "Moscow"],
  ["Asia/Dubai", "Dubai"],
  ["Asia/Kolkata", "Mumbai, Delhi"],
  ["Asia/Almaty", "Almaty, Astana"],
  ["Asia/Shanghai", "Beijing, Shanghai"],
  ["Asia/Tokyo", "Tokyo"],
  ["Australia/Sydney", "Sydney"],
];

export const timezone: ToolDef = {
  slug: "what-is-my-timezone",
  component: "what-is-my/timezone",
  icon: "Clock",
  popular: true,
  name: { ru: "Мой часовой пояс", en: "My time zone" },
  title: { ru: "Какой у меня часовой пояс — UTC-смещение онлайн", en: "What is my time zone? UTC offset and DST" },
  h1: { ru: "Какой у меня часовой пояс", en: "What is my time zone?" },
  description: {
    ru: "Ваш часовой пояс по настройкам устройства: идентификатор IANA (Asia/Almaty, Europe/Moscow), смещение от UTC, летнее время и дата следующего перевода часов.",
    en: "Your time zone from device settings: IANA name (Europe/London, America/New_York), UTC offset, daylight saving time and the date of the next clock change.",
  },
  lead: {
    ru: "Часовой пояс и смещение от UTC — из настроек вашего устройства, без геолокации и IP-адреса.",
    en: "Time zone and UTC offset from your device settings — no geolocation, no IP address.",
  },
  keywords: {
    ru: ["часовой пояс", "utc смещение", "gmt", "летнее время", "iana"],
    en: ["time zone", "utc offset", "gmt offset", "daylight saving", "iana"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху идентификатор пояса и смещение от UTC.",
      "В подробностях — есть ли летнее время и когда следующий перевод часов.",
      "Если пояс неверный, исправьте его в настройках даты и времени системы и обновите страницу.",
      "Нажмите «Копировать», чтобы получить строку вида «Asia/Almaty (UTC+05:00)».",
    ],
    en: [
      "Open the page — the zone name and UTC offset are at the top.",
      "The details show whether daylight saving applies and when the next clock change is.",
      "If the zone is wrong, fix it in your system's date & time settings and reload the page.",
      "Click Copy to get a line like “Europe/London (UTC+00:00)”.",
    ],
  },
  about: {
    ru: [
      "Браузер берёт часовой пояс из настроек операционной системы и сообщает его через Intl.DateTimeFormat().resolvedOptions().timeZone в формате базы IANA: «Регион/Город». Смещение и правила перехода на летнее время вычисляются по той же встроенной базе, поэтому интернет для этого не нужен.",
      "С 1 марта 2024 года весь Казахстан живёт в едином поясе UTC+5: Алматы, Астана и другие восточные регионы перешли с UTC+6. В России часы не переводятся с 2011 года, а с 2014 года Москва живёт по UTC+3.",
      "Метод getTimezoneOffset() возвращает смещение в минутах с обратным знаком: для UTC+5 это −300. Это частая ошибка в коде, поэтому здесь показаны оба значения.",
    ],
    en: [
      "The browser takes the time zone from your OS settings and reports it through Intl.DateTimeFormat().resolvedOptions().timeZone as an IANA name, “Region/City”. Offsets and daylight-saving rules come from the same built-in database, so no internet access is needed.",
      "Daylight saving time moves clocks by an hour twice a year in the US, Canada, Europe and parts of Australia, on different dates: the US switches on the second Sunday of March and the first Sunday of November, the EU on the last Sundays of March and October. The tool finds your next change to the minute.",
      "getTimezoneOffset() returns the offset in minutes with the opposite sign: −300 for UTC+5. It's a common bug in code, so both values are shown here.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как изменить часовой пояс?",
        a: "Windows: «Параметры → Время и язык → Дата и время» — выберите пояс или включите автоматическую установку. macOS: «Системные настройки → Основные → Дата и время». Android и iPhone: «Настройки → Дата и время». После смены обновите страницу.",
      },
      {
        q: "Почему пояс показан как UTC?",
        a: "Либо в системе действительно выставлен UTC, либо браузер скрывает пояс для защиты от отпечатков: так делают Tor Browser и Firefox с privacy.resistFingerprinting.",
      },
      {
        q: "Пояс определяется по IP-адресу?",
        a: "Нет. Инструмент ничего не запрашивает из сети: пояс берётся из настроек устройства, поэтому с VPN он не меняется.",
      },
      {
        q: "Что такое идентификатор IANA?",
        a: "Название пояса в международной базе tz (IANA Time Zone Database): Europe/Moscow, Asia/Almaty, America/New_York. В отличие от записи «UTC+3» оно учитывает историю изменений и летнее время.",
      },
    ],
    en: [
      {
        q: "How do I change my time zone?",
        a: "Windows: Settings → Time & language → Date & time — pick a zone or turn on automatic setting. macOS: System Settings → General → Date & Time. Android and iPhone: Settings → Date & time. Reload the page afterwards.",
      },
      {
        q: "Why is my time zone shown as UTC?",
        a: "Either your system really is set to UTC, or the browser hides the zone to resist fingerprinting — Tor Browser and Firefox with privacy.resistFingerprinting do this.",
      },
      {
        q: "Is the time zone detected from my IP address?",
        a: "No. The tool makes no network requests: the zone comes from your device settings, so a VPN doesn't change it.",
      },
      {
        q: "What is an IANA time zone name?",
        a: "The zone's name in the international tz database (IANA Time Zone Database): Europe/London, America/New_York, Asia/Tokyo. Unlike “UTC-5” it carries the zone's history and daylight-saving rules.",
      },
    ],
  },
  blocks: (locale) => {
    const zones = L(locale, ZONES_RU, ZONES_EN);
    return [
      {
        type: "table",
        title: L(locale, `Часовые пояса Казахстана, России и соседей в ${TABLE_YEAR} году`, `Time zones of major cities in ${TABLE_YEAR} (local winter and summer)`),
        head: L(locale, ["Город", "Идентификатор IANA", "Зимой", "Летом"], ["City", "IANA name", "Winter", "Summer"]),
        rows: zones.map(([zone, city]) => {
          // Local seasons: standard time in the local winter, daylight time in the local summer.
          const d = dstInfo(zone, TABLE_YEAR);
          return [city, zone, utcLabel(d.standard), d.daylight !== null ? utcLabel(d.daylight) : L(locale, "без перевода", "no DST")];
        }),
      },
    ];
  },
};

const LANG_SAMPLES = ["ru-RU", "kk-KZ", "uz-UZ", "uk-UA", "be-BY", "en-US", "en-GB", "de-DE", "tr-TR", "zh-CN"];
const SAMPLE_DATE = new Date(Date.UTC(2026, 0, 15, 12));

export const language: ToolDef = {
  slug: "browser-language",
  component: "what-is-my/language",
  icon: "Languages",
  name: { ru: "Язык браузера", en: "Browser language" },
  title: { ru: "Язык браузера — узнать язык и локаль онлайн", en: "What is my browser language? Check language & locale" },
  h1: { ru: "Какой язык установлен в браузере", en: "What is my browser language?" },
  description: {
    ru: "Узнайте основной язык браузера (navigator.language), список предпочитаемых языков, локаль форматирования, формат чисел и дат, 12/24 часа и первый день недели.",
    en: "Your browser's primary language (navigator.language), preferred languages, formatting locale, number and date formats, 12/24-hour clock and first weekday.",
  },
  lead: {
    ru: "Языки, которые браузер сообщает сайтам, и то, как он форматирует числа и даты.",
    en: "The languages your browser tells websites, and how it formats numbers and dates.",
  },
  keywords: {
    ru: ["язык браузера", "navigator.language", "accept-language", "локаль", "сменить язык браузера"],
    en: ["browser language", "navigator.language", "accept-language", "locale", "change browser language"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху основной язык браузера и его код, например ru-RU.",
      "Ниже — все предпочитаемые языки по порядку: в этом порядке сайты выбирают перевод.",
      "Проверьте формат чисел и дат: он зависит от локали и влияет на то, как сайты показывают суммы и даты.",
      "Чтобы изменить язык, откройте настройки браузера (см. ответы ниже) и обновите страницу.",
    ],
    en: [
      "Open the page — your browser's primary language and its code, such as en-US, are at the top.",
      "Below is the full preferred-language list in order; websites pick a translation in that order.",
      "Check the number and date formats: they depend on the locale and change how sites display amounts and dates.",
      "To change the language, open the browser settings (see the answers below) and reload the page.",
    ],
  },
  about: {
    ru: [
      "navigator.language — первый язык из списка предпочтений браузера, navigator.languages — весь список. Тот же список браузер отправляет сайтам в заголовке Accept-Language, и по нему сайты выбирают язык интерфейса. Коды записываются по стандарту BCP 47: ru-RU — русский (Россия), kk-KZ — казахский (Казахстан), en-US — английский (США).",
      "Локаль форматирования (Intl) определяет, как выглядят числа (1 234 567,89 или 1,234,567.89), даты, 12- или 24-часовой формат и первый день недели. Обычно она совпадает с языком браузера, но Safari и некоторые системы берут её из региональных настроек ОС.",
    ],
    en: [
      "navigator.language is the first language in your browser's preference list; navigator.languages is the whole list. The browser sends the same list to websites in the Accept-Language header, and they use it to choose the interface language. Codes follow BCP 47: en-US is English (United States), en-GB English (United Kingdom), de-DE German (Germany).",
      "The formatting locale (Intl) decides how numbers (1,234,567.89 or 1 234 567,89), dates, the 12- or 24-hour clock and the first day of the week look. It usually matches the browser language, but Safari and some systems take it from the OS region settings.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как изменить язык в Chrome?",
        a: "«Настройки → Языки» (chrome://settings/languages): добавьте язык и перетащите его наверх списка предпочитаемых. В Windows там же можно выбрать язык интерфейса самого Chrome.",
      },
      {
        q: "Как изменить язык в Firefox, Edge и Safari?",
        a: "Firefox: «Настройки → Основные → Язык» → «Выбрать» для языков веб-страниц. Edge: «Настройки → Языки». Safari берёт язык из системы: на Mac — «Системные настройки → Основные → Язык и регион», на iPhone — «Настройки → Основные → Язык и регион».",
      },
      {
        q: "Почему сайт открывается не на том языке?",
        a: "Сайт выбирает первый подходящий язык из заголовка Accept-Language или определяет страну по IP. Проверьте порядок языков в браузере; если сайт ориентируется на IP, поможет только переключатель языка на самом сайте.",
      },
      {
        q: "Откуда берётся первый день недели?",
        a: "Из региональных данных Unicode CLDR для вашей локали: в России и Казахстане неделя начинается с понедельника, в США — с воскресенья. Календари на сайтах используют это значение.",
      },
    ],
    en: [
      {
        q: "How do I change the language in Chrome?",
        a: "Settings → Languages (chrome://settings/languages): add a language and move it to the top of the preferred list. On Windows you can also choose Chrome's own interface language there.",
      },
      {
        q: "How do I change it in Firefox, Edge and Safari?",
        a: "Firefox: Settings → General → Language → Choose, for web-page languages. Edge: Settings → Languages. Safari follows the system: on a Mac, System Settings → General → Language & Region; on iPhone, Settings → General → Language & Region.",
      },
      {
        q: "Why does a site open in the wrong language?",
        a: "Sites pick the first matching language from the Accept-Language header, or guess your country from your IP address. Check the language order in your browser; if the site uses IP, only its own language switcher helps.",
      },
      {
        q: "Where does the first day of the week come from?",
        a: "From Unicode CLDR regional data for your locale: in the US the week starts on Sunday, in the UK and most of Europe on Monday. Calendars on websites use this value.",
      },
    ],
  },
  blocks: (locale) => {
    const names = new Intl.DisplayNames([L(locale, "ru-RU", "en-US")], { type: "language" });
    return [
      {
        type: "table",
        title: L(locale, "Как разные локали форматируют числа и даты", "How different locales format numbers and dates"),
        head: L(locale, ["Код", "Язык", "Число", "Дата"], ["Code", "Language", "Number", "Date"]),
        rows: LANG_SAMPLES.map((tag) => [
          tag,
          names.of(tag) ?? tag,
          new Intl.NumberFormat(tag).format(1234567.89),
          new Intl.DateTimeFormat(tag, { dateStyle: "short", timeZone: "UTC" }).format(SAMPLE_DATE),
        ]),
      },
    ];
  },
};
