import type { Locale } from "@/i18n/config";
import type { Block, QA, VariantDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerLink, registerTools, withRelated } from "@/sections/code/kit/related";
import { exportRegex, jsLiteralBody } from "./lib/exporters";
import { LIBRARY, testerFlags, testerText, type LibPattern } from "./lib/library";

const HUE = 245;

/** Russian genitive for "регулярное выражение для …". */
const RU_GEN: Record<string, string> = {
  email: "email",
  url: "URL",
  domain: "доменного имени",
  ipv4: "IPv4-адреса",
  ipv6: "IPv6-адреса",
  "ipv4-cidr": "подсети IPv4 (CIDR)",
  "mac-address": "MAC-адреса",
  "port-number": "номера порта",
  "hex-color": "HEX-цвета",
  "rgb-color": "цвета rgb()",
  slug: "slug (ЧПУ)",
  "url-query-param": "параметров URL",
  "youtube-video-id": "ID видео YouTube",
  uuid: "UUID",
  username: "логина",
  "telegram-username": "username в Telegram",
  mention: "упоминаний @username",
  hashtag: "хэштегов",
  jwt: "JWT-токена",
  base64: "строки Base64",
  semver: "версии SemVer",
  "html-tag": "HTML-тегов",
  "html-attribute": "HTML-атрибутов",
  "html-comment": "HTML-комментариев",
  "markdown-link": "ссылок Markdown",
  emoji: "эмодзи",
  "cyrillic-only": "кириллицы",
  "kazakh-cyrillic": "казахских букв",
  "latin-only": "латиницы",
  "digits-only": "цифр",
  integer: "целого числа",
  "decimal-number": "десятичного числа",
  "whitespace-trim": "пробелов в начале и конце",
  "multiple-spaces": "двойных пробелов",
  "empty-lines": "пустых строк",
  "duplicate-words": "повторяющихся слов",
  "file-extension": "расширения файла",
  "windows-path": "пути Windows",
  "unix-path": "пути Linux",
  "date-yyyy-mm-dd": "даты ГГГГ-ММ-ДД",
  "date-dd-mm-yyyy": "даты ДД.ММ.ГГГГ",
  "time-24h": "времени ЧЧ:ММ",
  "time-12h": "времени AM/PM",
  "iso-8601": "даты ISO 8601",
  "phone-ru": "номера телефона РФ",
  "phone-kz": "номера телефона Казахстана",
  "phone-us": "номера телефона США",
  e164: "номера в формате E.164",
  "postal-code-ru": "почтового индекса России",
  "postal-code-kz": "почтового индекса Казахстана",
  "postal-code-us": "ZIP-кода США",
  "credit-card": "номера банковской карты",
  iban: "IBAN",
  "inn-ru": "ИНН",
  snils: "СНИЛС",
  "iin-kz": "ИИН",
  "passport-ru": "паспорта РФ",
  "car-number-ru": "госномера автомобиля",
  "strong-password": "сложного пароля",
  "latitude-longitude": "координат",
  isbn: "ISBN",
};

const fit = (c: string[]) => c.find((x) => x.length <= 160) ?? c[c.length - 1];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function variant(p: LibPattern): VariantDef {
  const gen = RU_GEN[p.slug] ?? p.name.ru;
  const literal = `/${jsLiteralBody(p.pattern)}/${p.flags}`;
  const short = literal.length <= 70;
  const js = exportRegex("js", p.pattern, p.flags.replace("g", "")).code.split("\n")[0];
  const n = p.match.length + p.noMatch.length;
  const faq = (locale: Locale): QA[] => {
    const ru = locale === "ru";
    const test = p.mode === "full" ? (ru ? "re.test(value) вернёт true, если строка целиком подходит" : "re.test(value) returns true when the whole string matches") : ru ? "text.match(re) вернёт все найденные фрагменты" : "text.match(re) returns every match";
    return [
      { q: ru ? `Как проверить ${gen} в JavaScript?` : `How do I use the ${p.name.en.toLowerCase()} regex in JavaScript?`, a: `${exportRegex("js", p.pattern, p.flags).code.split("\n")[0]} — ${test}.` },
      { q: ru ? "Что это выражение не проверяет?" : "What doesn't this regex check?", a: p.limits[locale] },
      { q: ru ? "Как использовать его в Python?" : "How do I use it in Python?", a: `${exportRegex("python", p.pattern, p.flags).code.split("\n")[2]}${ru ? " — затем pattern." : " — then pattern."}${p.mode === "full" ? "fullmatch(value)" : "findall(text)"}.` },
    ];
  };
  return {
    slug: p.slug,
    name: p.name,
    h1: { ru: `Регулярное выражение для ${gen}`, en: `${p.name.en} regex` },
    title: {
      ru: [`Регулярное выражение для ${gen} — regex с примерами`, `Регулярное выражение для ${gen}`].find((x) => x.length <= 64)!,
      en: [`${p.name.en} regex — pattern with examples`, `${p.name.en} regex`].find((x) => x.length <= 64)!,
    },
    description: {
      ru: fit([
        `Регулярное выражение для ${gen}: ${p.what.ru}. ${n} примеров, тестер и код для JavaScript, Python и PHP.`,
        `Регулярное выражение для ${gen}: ${p.what.ru}. Примеры и код.`,
        `Готовое регулярное выражение для ${gen}: ${n} примеров совпадений и несовпадений, онлайн-тестер и код для JavaScript, Python и PHP.`,
        `Регулярное выражение для ${gen} с примерами, тестером и кодом для JavaScript, Python и PHP.`,
      ]),
      en: fit([
        `${p.name.en} regex: ${p.what.en}. ${n} examples, a live tester and code for JavaScript, Python and PHP.`,
        `${p.name.en} regex: ${p.what.en}. Examples and code.`,
        `A ready ${p.name.en.toLowerCase()} regex with ${n} matching and non-matching examples, a live tester and code for JavaScript, Python and PHP.`,
        `${p.name.en} regex with examples, a live tester and code for JavaScript, Python and PHP.`,
      ]),
    },
    lead: short ? { ru: `${literal} — ${p.what.ru}.`, en: `${literal} — ${p.what.en}.` } : { ru: `${cap(p.what.ru)}.`, en: `${cap(p.what.en)}.` },
    props: { pattern: p.pattern, flags: testerFlags(p), text: testerText(p) },
    keywords: { ru: [`регулярное выражение ${p.name.ru.toLowerCase()}`, `regex ${p.name.ru.toLowerCase()}`, `регулярка ${p.name.ru.toLowerCase()}`], en: [`${p.name.en.toLowerCase()} regex`, `regex for ${p.name.en.toLowerCase()}`, `${p.name.en.toLowerCase()} regular expression`] },
    faq: { ru: faq("ru"), en: faq("en") },
    blocks: (locale) => {
      const ru = locale === "ru";
      const blocks: Block[] = [
        {
          type: "facts",
          title: ru ? "Коротко" : "At a glance",
          rows: [
            [ru ? "Выражение" : "Pattern", literal],
            [ru ? "Что проверяет" : "What it matches", cap(p.what[locale])],
            [ru ? "Режим" : "Mode", p.mode === "full" ? (ru ? "проверка строки целиком (^…$)" : "whole-string validation (^…$)") : ru ? "поиск в тексте" : "search in text"],
            [ru ? "Ограничения" : "Limits", p.limits[locale]],
          ],
        },
        {
          type: "table",
          title: ru ? "Примеры" : "Examples",
          head: ru ? ["Строка", "Результат"] : ["String", "Result"],
          rows: [...p.match.map((s) => [JSON.stringify(s).slice(1, -1), ru ? "✓ совпадает" : "✓ matches"]), ...p.noMatch.map((s) => [JSON.stringify(s).slice(1, -1) || '""', ru ? "✗ не совпадает" : "✗ no match"])],
          mono: true,
        },
        {
          type: "list",
          title: ru ? "Код" : "Code",
          items: [`JavaScript: ${js}`, `Python: ${exportRegex("python", p.pattern, p.flags).code.split("\n")[2]}`, `PHP: ${exportRegex("php", p.pattern, p.flags.replace("g", "")).code.split("\n")[0]}`],
        },
      ];
      return blocks;
    },
  };
}

const variants = LIBRARY.map(variant);

const CHEATS: [string, string, string][] = [
  [".", "любой символ, кроме перевода строки (с флагом s — любой)", "any character except a newline (any with s)"],
  ["\\d \\w \\s", "цифра, буква/цифра/_, пробельный символ", "digit, word character, whitespace"],
  ["[abc] [^abc] [а-яё]", "один из символов, любой кроме, диапазон", "one of, none of, a range"],
  ["^ $", "начало и конец строки (с m — каждой строки)", "start and end of input (of each line with m)"],
  ["\\b", "граница слова (в JS только для латиницы)", "word boundary (ASCII-only in JS)"],
  ["* + ? {2,5}", "0+, 1+, 0–1, от 2 до 5 повторов", "0+, 1+, 0–1, 2 to 5 repeats"],
  ["*? +?", "ленивые (минимальные) повторы", "lazy (minimal) repeats"],
  ["(abc) (?:abc)", "захватывающая и незахватывающая группа", "capturing and non-capturing group"],
  ["(?<name>…) \\k<name>", "именованная группа и ссылка на неё", "named group and its backreference"],
  ["a|b", "альтернатива: a или b", "alternation: a or b"],
  ["(?=…) (?!…)", "опережающая проверка: дальше идёт / не идёт", "lookahead: followed / not followed by"],
  ["(?<=…) (?<!…)", "ретроспективная проверка: перед этим есть / нет", "lookbehind: preceded / not preceded by"],
  ["\\p{L} \\p{Lu} \\p{N}", "любая буква, заглавная буква, цифра (нужен флаг u)", "any letter, uppercase letter, number (needs u)"],
];

export const regexSection = withRelated(
  defineToolSection({
    id: "regex",
    name: { ru: "Регулярные выражения", en: "Regex" },
    description: { ru: "Онлайн-тестер регулярных выражений и библиотека готовых шаблонов с примерами", en: "Online regular expression tester and a library of ready-made patterns with examples" },
    icon: "Regex",
    hue: HUE,
    category: "dev",
    order: 3,
    tools: [
      {
        slug: "",
        seoAlt: { ru: "готовый regex с примерами", en: "ready-made regex with examples" },
        component: "regex/tester",
        icon: "Regex",
        popular: true,
        name: { ru: "Тестер регулярных выражений", en: "Regex tester" },
        h1: { ru: "Регулярные выражения онлайн: тестер", en: "Regex tester online" },
        title: { ru: "Регулярные выражения онлайн — тестер regex", en: "Regex tester online — test regular expressions" },
        description: {
          ru: "Тестер регулярных выражений онлайн: подсветка совпадений, группы и именованные группы, замена с $1, флаги gimsuydv и код для Python, PHP, Java, Go и C#.",
          en: "Online regex tester: highlighted matches, groups and named groups, replace with $1, all JavaScript flags (gimsuydv) and code for Python, PHP, Java, Go and C#.",
        },
        lead: { ru: "Введите выражение и текст — совпадения подсветятся сразу, а группы появятся в таблице.", en: "Type a pattern and some text — matches are highlighted instantly and groups appear in a table." },
        keywords: { ru: ["регулярные выражения", "regex онлайн", "тестер регулярок", "проверить регулярное выражение", "regexp"], en: ["regex tester", "regex online", "regular expression tester", "regexp", "regex101"] },
        howTo: {
          ru: ["Введите выражение без косых черт и включите нужные флаги: g — все совпадения, i — без учёта регистра, m — построчно.", "Вставьте текст — совпадения подсветятся, а таблица покажет позиции и группы.", "На вкладке «Замена» проверьте подстановку с $1 и $<имя>.", "На вкладке «Код» получите готовый код для JavaScript, Python, PHP, Java, Go или C#."],
          en: ["Type the pattern without slashes and toggle flags: g for all matches, i for case-insensitive, m for per-line anchors.", "Paste text — matches are highlighted and the table lists positions and groups.", "Use the Replace tab to test substitutions with $1 and $<name>.", "The Code tab gives ready code for JavaScript, Python, PHP, Java, Go or C#."],
        },
        faq: {
          ru: [
            { q: "Какой движок регулярных выражений используется?", a: "Движок JavaScript вашего браузера — со всеми флагами, включая d (позиции групп) и v (Unicode-множества), если браузер их поддерживает. Для других языков синтаксис может отличаться — вкладка «Код» подскажет, что изменить." },
            { q: "Что будет, если выражение «зависнет»?", a: "Поиск идёт в фоновом потоке с ограничением 1,5 секунды. Выражения с катастрофическим перебором вроде (a+)+$ останавливаются, а страница продолжает работать." },
            { q: "Почему \\b и \\w не работают с русскими буквами?", a: "В JavaScript \\w и \\b знают только латиницу. Для кириллицы используйте класс [а-яё] или \\p{L} с флагом u." },
            { q: "Сохраняется ли мой текст?", a: "Нет: выражение и текст обрабатываются только в браузере, не попадают в адресную строку и не отправляются на сервер." },
          ],
          en: [
            { q: "Which regex engine is used?", a: "Your browser's JavaScript engine — with every flag, including d (group indices) and v (Unicode sets) where supported. Other languages may differ; the Code tab tells you what to change." },
            { q: "What if a pattern hangs?", a: "Matching runs in a background thread with a 1.5-second limit. Catastrophic patterns like (a+)+$ are stopped and the page stays responsive." },
            { q: "Why don't \\b and \\w work with non-Latin letters?", a: "In JavaScript \\w and \\b are ASCII-only. Use \\p{L} with the u flag for any script." },
            { q: "Is my text stored?", a: "No: the pattern and text stay in your browser, never go into the URL and are never sent to a server." },
          ],
        },
        about: {
          ru: [
            "Тестер показывает каждое совпадение прямо в тексте, а в таблице — позицию, нумерованные и именованные группы; с флагом d видны и позиции групп. Пустые совпадения отмечаются тонкой чертой.",
            `Ниже — библиотека из ${LIBRARY.length} проверенных выражений: e-mail, телефоны России и Казахстана, ИИН, ИНН, СНИЛС, IPv4 и IPv6, даты и другие. Каждое открывается в тестере с примерами, которые должны и не должны совпадать.`,
          ],
          en: [
            "The tester highlights every match in the text and lists positions, numbered and named groups in a table; with the d flag group positions are shown too. Empty matches are marked with a thin bar.",
            `Below is a library of ${LIBRARY.length} tested patterns: email, phone numbers, IPv4 and IPv6, dates, UUIDs and more. Each opens in the tester with examples that should and shouldn't match.`,
          ],
        },
        blocks: (locale) => [{ type: "table", title: locale === "ru" ? "Шпаргалка по синтаксису" : "Syntax cheat sheet", head: locale === "ru" ? ["Запись", "Значение"] : ["Syntax", "Meaning"], rows: CHEATS.map(([s, ru, en]) => [s, locale === "ru" ? ru : en]) }],
        // every pattern page is linked from the tester and from each sibling (no orphans)
        variants: { title: { ru: "Готовые регулярные выражения", en: "Ready-made patterns" }, list: () => variants, limit: LIBRARY.length },
      },
    ],
  }),
  (segs) => (segs.length > 1 ? ["regex"] : []),
);

registerTools("regex", HUE, [{ slug: "", component: "regex/tester", icon: "Regex", name: { ru: "Тестер регулярных выражений", en: "Regex tester" }, title: { ru: "Regex", en: "Regex" }, description: { ru: "Тестер регулярных выражений", en: "Regex tester" } }]);
for (const p of LIBRARY) registerLink(`regex/${p.slug}`, { label: { ru: `Регулярное выражение для ${RU_GEN[p.slug] ?? p.name.ru}`, en: `${p.name.en} regex` }, icon: "Regex", hue: HUE });
