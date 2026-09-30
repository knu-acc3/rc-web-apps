import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerTools, withRelated } from "@/sections/code/kit/related";
import * as C from "./codecs";
import { decodeEntities, encodeEntities, ENTITY_COUNT } from "./html";
import { encodeMorse } from "./morse";
import { NATO, NATO_SAY, RUSSIAN } from "./phonetic";
import { domainToAscii } from "./punycode";
import type { CodecId } from "./registry";
import type { Codec, Opts } from "./types";

const HUE = 190;
type L = { ru: string; en: string };
type LL = { ru: string[]; en: string[] };
type F = { ru: QA[]; en: QA[] };

const SYNC: Partial<Record<CodecId, Codec>> = {
  base64: C.base64,
  url: C.url,
  html: { encode: (s, o) => ({ text: encodeEntities(s, (o.mode as never) || "basic") }), decode: (s) => ({ text: decodeEntities(s) }) },
  binary: C.numberCodec(2),
  hex: C.numberCodec(16),
  base32: C.base32,
  base58: C.base58,
  base85: C.base85,
  unicode: C.unicode,
  json: C.json,
  qp: C.qp,
  rot: C.rot,
  caesar: C.caesarCodec,
  atbash: C.atbashCodec,
  punycode: { encode: (s) => ({ text: s.split("\n").map(domainToAscii).join("\n") }), decode: (s) => ({ text: s }) },
};

const run = (id: CodecId, dir: "encode" | "decode", s: string, o: Opts = {}) => {
  const c = SYNC[id]!;
  const r = dir === "encode" ? c.encode(s, o) : c.decode(s, o);
  return r.error ? "—" : r.text;
};

interface Spec {
  slug: string;
  codec: CodecId;
  dir: "encode" | "decode";
  icon: string;
  popular?: boolean;
  cipher?: boolean;
  options?: Opts;
  samples: L;
  name: L;
  h1: L;
  title: L;
  description: L;
  lead: L;
  keywords: LL;
  howTo: LL;
  faq: F;
  about: LL;
  blocks?: (locale: Locale) => Block[];
}

function codecTool(s: Spec): ToolDef {
  const outputs = { ru: run(s.codec, s.dir, s.samples.ru, s.options), en: run(s.codec, s.dir, s.samples.en, s.options) };
  return {
    slug: s.slug,
    component: "encode/codec",
    icon: s.icon,
    popular: s.popular,
    props: { codec: s.codec, dir: s.dir, samples: s.samples, outputs, options: s.options ?? {}, cipher: !!s.cipher },
    name: s.name,
    h1: s.h1,
    title: s.title,
    description: s.description,
    lead: s.lead,
    keywords: s.keywords,
    howTo: s.howTo,
    faq: s.faq,
    about: s.about,
    blocks: s.blocks,
  };
}

const examples = (locale: Locale, head: L, rows: [string, string][]): Block => ({
  type: "table",
  title: locale === "ru" ? "Примеры" : "Examples",
  head: [head[locale].split("|")[0], head[locale].split("|")[1]],
  rows,
  mono: true,
});

const HOW_ENC = (what: string, extra: string): LL => ({
  ru: [`Введите или вставьте текст — ${what} появится сразу под полем.`, extra, "Скопируйте результат кнопкой «Копировать» или нажмите «Поменять местами», чтобы проверить обратное преобразование."],
  en: [`Type or paste text — the ${what} appears right below.`, extra, "Copy the result, or press Swap to check the reverse conversion."],
});

/* ───────────── Base64 ───────────── */

const B64_EX = ["Man", "Ma", "M", "Привет", "😀"];
const b64Blocks = (locale: Locale): Block[] => [
  {
    type: "facts",
    title: locale === "ru" ? "Base64 коротко" : "Base64 at a glance",
    rows:
      locale === "ru"
        ? [
            ["Алфавит", "A–Z, a–z, 0–9, + и / (URL-safe: - и _)"],
            ["Размер", "каждые 3 байта → 4 символа, +33 %"],
            ["Дополнение", "= или == в конце, если байтов не кратно 3"],
            ["Стандарт", "RFC 4648 (MIME — RFC 2045, строки по 76 символов)"],
          ]
        : [
            ["Alphabet", "A–Z, a–z, 0–9, + and / (URL-safe: - and _)"],
            ["Size", "every 3 bytes → 4 characters, +33%"],
            ["Padding", "= or == at the end when the byte count isn't a multiple of 3"],
            ["Standard", "RFC 4648 (MIME: RFC 2045, 76-character lines)"],
          ],
  },
  examples(locale, { ru: "Текст (UTF-8)|Base64", en: "Text (UTF-8)|Base64" }, B64_EX.map((x) => [x, run("base64", "encode", x)])),
];

const specs: Spec[] = [
  {
    slug: "base64-encode",
    codec: "base64",
    dir: "encode",
    icon: "Binary",
    popular: true,
    samples: { ru: "Привет, мир!", en: "Hello, world!" },
    name: { ru: "Base64 кодирование", en: "Base64 encode" },
    h1: { ru: "Кодирование Base64 онлайн", en: "Base64 encode" },
    title: { ru: "Base64 кодирование онлайн — текст в Base64", en: "Base64 encode online — text to Base64" },
    description: {
      ru: "Кодирование текста в Base64 онлайн: UTF-8 с кириллицей и эмодзи, URL-safe вариант без + и /, переносы по 76 символов для MIME. Результат появляется сразу.",
      en: "Encode text to Base64 online: UTF-8 with any language and emoji, URL-safe variant without + and /, 76-character MIME lines. The result appears instantly.",
    },
    lead: { ru: `«Привет» в Base64 — ${run("base64", "encode", "Привет")}: каждые 3 байта UTF-8 становятся 4 символами.`, en: `"Hello" in Base64 is ${run("base64", "encode", "Hello")}: every 3 bytes become 4 characters.` },
    keywords: { ru: ["base64", "кодировать base64", "текст в base64", "base64 encode"], en: ["base64 encode", "text to base64", "base64 encoder", "encode base64 online"] },
    howTo: HOW_ENC("Base64", "Включите URL-safe, если строка пойдёт в адрес или JWT, и переносы по 76 символов — для писем (MIME)."),
    faq: {
      ru: [
        { q: "Base64 — это шифрование?", a: "Нет. Base64 лишь записывает байты печатными символами, и любой может его раскодировать. Для защиты данных нужно шифрование." },
        { q: "Почему результат длиннее исходного текста?", a: "Base64 кодирует 3 байта четырьмя символами, поэтому размер растёт на треть. Кириллица в UTF-8 занимает 2 байта на букву, так что русский текст вырастает сильнее, чем кажется." },
        { q: "Что такое URL-safe Base64?", a: "Вариант из RFC 4648, где + заменён на -, / на _, а знаки = обычно убирают. Такую строку можно вставлять в URL и имена файлов; его же использует JWT." },
      ],
      en: [
        { q: "Is Base64 encryption?", a: "No. Base64 just writes bytes as printable characters, and anyone can decode it. Protecting data needs encryption." },
        { q: "Why is the result longer than the input?", a: "Base64 turns 3 bytes into 4 characters, so size grows by a third. Non-Latin letters take 2–4 bytes in UTF-8, so they grow even more." },
        { q: "What is URL-safe Base64?", a: "The RFC 4648 variant where + becomes -, / becomes _ and = padding is usually dropped. It fits into URLs and file names; JWT uses it." },
      ],
    },
    about: {
      ru: ["Base64 превращает любые байты в строку из 64 безопасных символов, чтобы передать их там, где допустим только текст: во вложениях писем, data URI, JSON и заголовках HTTP (Authorization: Basic). Текст сначала переводится в байты UTF-8, поэтому кириллица, казахские буквы и эмодзи кодируются правильно."],
      en: ["Base64 turns any bytes into a string of 64 safe characters so they can travel where only text is allowed: e-mail attachments, data URIs, JSON and HTTP headers (Authorization: Basic). Text is converted to UTF-8 bytes first, so every language and emoji encodes correctly."],
    },
    blocks: b64Blocks,
  },
  {
    slug: "base64-decode",
    codec: "base64",
    dir: "decode",
    icon: "Binary",
    popular: true,
    samples: { ru: "0J/RgNC40LLQtdGCLCDQvNC40YAh", en: "SGVsbG8sIHdvcmxkIQ==" },
    name: { ru: "Base64 декодирование", en: "Base64 decode" },
    h1: { ru: "Декодирование Base64 онлайн", en: "Base64 decode" },
    title: { ru: "Base64 декодирование онлайн — Base64 в текст", en: "Base64 decode online — Base64 to text" },
    description: {
      ru: "Декодирование Base64 в текст онлайн: обычный и URL-safe алфавит, строки без знаков =, переносы и data URI. Ошибка покажет точную позицию неверного символа.",
      en: "Decode Base64 to text online: standard and URL-safe alphabets, missing = padding, line breaks and data URIs. Errors point to the exact position of a bad character.",
    },
    lead: { ru: "Вставьте Base64 — текст появится сразу; URL-safe и строки без = тоже принимаются.", en: "Paste Base64 and get the text instantly; URL-safe strings and missing padding are accepted." },
    keywords: { ru: ["base64 декодировать", "base64 в текст", "расшифровать base64", "base64 decode"], en: ["base64 decode", "base64 to text", "decode base64 online", "base64 decoder"] },
    howTo: {
      ru: ["Вставьте строку Base64 или data URI — префикс data:…;base64, отбросится сам.", "Если это текст, он появится ниже. Если внутри файл или двоичные данные, их можно скачать.", "При ошибке смотрите позицию: чаще всего в строку попал лишний символ при копировании."],
      en: ["Paste a Base64 string or a data URI — the data:…;base64, prefix is removed automatically.", "Text appears below. If it's a file or binary data, you can download it.", "On an error check the position: usually a stray character slipped in while copying."],
    },
    faq: {
      ru: [
        { q: "Почему вместо текста «двоичные данные»?", a: "Значит, внутри не текст UTF-8, а файл: картинка, PDF, архив. Скачайте результат или откройте декодер Base64 в изображение — он покажет превью." },
        { q: "Нужны ли знаки = в конце?", a: "Нет: декодер восстанавливает дополнение сам. Его часто убирают в URL-safe Base64 и JWT." },
        { q: "Как декодировать Base64 в консоли?", a: "В Linux и macOS: echo 'SGVsbG8=' | base64 -d (на macOS также base64 -D). В PowerShell: [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('SGVsbG8='))." },
      ],
      en: [
        { q: "Why do I get “binary data” instead of text?", a: "The content isn't UTF-8 text but a file: an image, PDF or archive. Download the result or use the Base64 to image decoder, which shows a preview." },
        { q: "Do I need the = at the end?", a: "No: the decoder restores padding itself. It is often dropped in URL-safe Base64 and JWT." },
        { q: "How do I decode Base64 in a terminal?", a: "On Linux and macOS: echo 'SGVsbG8=' | base64 -d (base64 -D on older macOS). In PowerShell: [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('SGVsbG8='))." },
      ],
    },
    about: {
      ru: ["Декодер понимает оба алфавита RFC 4648 — обычный (+ и /) и URL-safe (- и _), пропускает пробелы и переводы строк и не требует знаков =. Результат читается как UTF-8; если байты не складываются в текст, вы увидите их в hex и сможете сохранить файлом."],
      en: ["The decoder accepts both RFC 4648 alphabets — standard (+ and /) and URL-safe (- and _), skips spaces and line breaks and doesn't require = padding. The result is read as UTF-8; if the bytes aren't text you'll see them in hex and can save them as a file."],
    },
    blocks: b64Blocks,
  },
  /* ───────────── URL ───────────── */
  {
    slug: "url-encode",
    codec: "url",
    dir: "encode",
    icon: "Link",
    popular: true,
    options: { mode: "component" },
    samples: { ru: "поиск=кофе и чай&город=Алматы", en: "q=coffee & tea&city=São Paulo" },
    name: { ru: "URL-кодирование", en: "URL encode" },
    h1: { ru: "URL-кодирование онлайн", en: "URL encode" },
    title: { ru: "URL encode онлайн — кодирование ссылок и параметров", en: "URL encode online — percent-encode text for URLs" },
    description: {
      ru: "Кодирование текста для URL онлайн: encodeURIComponent для параметров, encodeURI для всего адреса и формат форм с + вместо пробела. Кириллица — в %D0%B4.",
      en: "Percent-encode text for URLs online: encodeURIComponent for parameters, encodeURI for whole addresses and form encoding with + for spaces. UTF-8 based.",
    },
    lead: { ru: `Пробел → %20, «д» → ${run("url", "encode", "д")}: символы вне ASCII кодируются байтами UTF-8.`, en: "Space → %20, é → %C3%A9: non-ASCII characters become their UTF-8 bytes." },
    keywords: { ru: ["url encode", "кодировать url", "urlencode онлайн", "percent encoding"], en: ["url encode", "urlencode online", "percent encoding", "encodeURIComponent"] },
    howTo: HOW_ENC("закодированная строка", "Выберите режим: encodeURIComponent — для значения параметра, encodeURI — для всего адреса, «Форма» — как браузер отправляет форму (пробел → +)."),
    faq: {
      ru: [
        { q: "Чем encodeURI отличается от encodeURIComponent?", a: "encodeURI оставляет символы, которые нужны в адресе (: / ? # & =), поэтому годится для целой ссылки. encodeURIComponent кодирует и их — так кодируют значение одного параметра." },
        { q: "Пробел — это %20 или +?", a: "В пути и по RFC 3986 — %20. Знак + означает пробел только в строке запроса формата application/x-www-form-urlencoded, как у HTML-форм." },
        { q: "Почему кириллица превращается в %D0%…?", a: "Каждая русская буква в UTF-8 занимает 2 байта, и каждый байт записывается как %XX. Поэтому «д» становится %D0%B4." },
      ],
      en: [
        { q: "encodeURI vs encodeURIComponent?", a: "encodeURI keeps characters that structure a URL (: / ? # & =), so it suits a whole link. encodeURIComponent encodes them too — use it for a single parameter value." },
        { q: "Is a space %20 or +?", a: "In paths and per RFC 3986 it's %20. A + means space only in application/x-www-form-urlencoded query strings, as HTML forms send them." },
        { q: "Why does é become %C3%A9?", a: "Each non-ASCII character is encoded as its UTF-8 bytes, and each byte is written as %XX." },
      ],
    },
    about: {
      ru: ["URL может содержать только ограниченный набор ASCII-символов, всё остальное записывается процентной кодировкой RFC 3986: байты UTF-8 в виде %XX. Режим «Форма» повторяет алгоритм application/x-www-form-urlencoded из стандарта WHATWG URL."],
      en: ["A URL may only contain a limited set of ASCII characters; everything else is percent-encoded per RFC 3986 as UTF-8 bytes in %XX form. Form mode follows the WHATWG application/x-www-form-urlencoded serializer."],
    },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Как кодируются символы" : "How characters are encoded",
        head: [locale === "ru" ? "Символ" : "Character", "encodeURIComponent", "encodeURI", locale === "ru" ? "Форма" : "Form"],
        rows: [" ", "&", "=", "?", "/", "#", "+", "д", "é", "😀"].map((ch) => [ch === " " ? (locale === "ru" ? "пробел" : "space") : ch, run("url", "encode", ch, { mode: "component" }), run("url", "encode", ch, { mode: "uri" }), run("url", "encode", ch, { mode: "form" })]),
        mono: true,
      },
    ],
  },
  {
    slug: "url-decode",
    codec: "url",
    dir: "decode",
    icon: "Link",
    popular: true,
    options: { plus: true },
    samples: { ru: "%D0%BF%D0%BE%D0%B8%D1%81%D0%BA%3D%D0%BA%D0%BE%D1%84%D0%B5+%D0%B8+%D1%87%D0%B0%D0%B9", en: "q%3Dcoffee+%26+tea%26city%3DS%C3%A3o+Paulo" },
    name: { ru: "URL-декодирование", en: "URL decode" },
    h1: { ru: "URL-декодирование онлайн", en: "URL decode" },
    title: { ru: "URL decode онлайн — раскодировать ссылку", en: "URL decode online — decode percent-encoded URLs" },
    description: {
      ru: "Декодирование URL онлайн: %D0%BF → п, + → пробел (по выбору). Если последовательность %XX неверная или не UTF-8, покажем, где именно, а не просто «ошибка».",
      en: "Decode percent-encoded URLs online: %C3%A3 → ã, + → space (optional). Invalid %XX sequences or broken UTF-8 are reported with their exact position.",
    },
    lead: { ru: "Вставьте ссылку с %D0%… — получите читаемый текст с кириллицей; ошибки указываются с позицией.", en: "Paste a link full of %XX and get readable text; errors come with a position." },
    keywords: { ru: ["url decode", "раскодировать url", "декодировать ссылку", "urldecode"], en: ["url decode", "urldecode online", "decode url", "percent decode"] },
    howTo: {
      ru: ["Вставьте закодированную ссылку или параметр.", "Оставьте «+ как пробел» для строк запроса из форм; выключите для путей, где + — это просто плюс.", "Если есть ошибка, она укажет строку и столбец неверной последовательности."],
      en: ["Paste an encoded link or parameter.", "Keep “+ as space” for form query strings; turn it off for paths where + is a literal plus.", "Errors show the line and column of the bad sequence."],
    },
    faq: {
      ru: [
        { q: "Почему decodeURIComponent выдаёт URIError?", a: "Строка содержит % без двух hex-цифр или байты, которые не складываются в символ UTF-8 (например, текст в Windows-1251). Здесь такая последовательность показывается с позицией." },
        { q: "Ссылка закодирована дважды — что делать?", a: "Если после декодирования остались %25 или %D0, нажмите «Поменять местами» и декодируйте ещё раз: %25 — это закодированный знак %." },
        { q: "Как раскодировать ссылку из Яндекса или Google?", a: "Скопируйте адрес целиком — русские слова из %D0%… превратятся в читаемый текст, а служебные символы останутся на месте." },
      ],
      en: [
        { q: "Why does decodeURIComponent throw URIError?", a: "The string has a % without two hex digits or bytes that aren't valid UTF-8 (e.g. text in a legacy code page). Here such a sequence is shown with its position." },
        { q: "The link was encoded twice — what now?", a: "If %25 or %C3 remain after decoding, press Swap and decode again: %25 is an encoded %." },
        { q: "Does it decode whole links?", a: "Yes — paste the full address; encoded words become readable while structural characters stay in place." },
      ],
    },
    about: {
      ru: ["Декодер собирает подряд идущие %XX в байты и читает их как UTF-8 в строгом режиме, поэтому битая кодировка не превращается молча в «�». Опция «+ как пробел» соответствует формату application/x-www-form-urlencoded."],
      en: ["The decoder collects consecutive %XX into bytes and reads them as strict UTF-8, so broken encodings don't silently turn into “�”. The “+ as space” option matches application/x-www-form-urlencoded."],
    },
  },
  /* ───────────── HTML ───────────── */
  {
    slug: "html-encode",
    codec: "html",
    dir: "encode",
    icon: "Code",
    popular: true,
    options: { mode: "basic" },
    samples: { ru: '<a href="/поиск?q=1&x=2">«Цитата» — © 2025</a>', en: '<a href="/search?q=1&x=2">“Quote” — © 2025</a>' },
    name: { ru: "HTML-кодирование", en: "HTML encode" },
    h1: { ru: "Экранирование HTML онлайн", en: "HTML encode" },
    title: { ru: "HTML encode онлайн — экранирование спецсимволов", en: "HTML encode online — escape special characters" },
    description: {
      ru: "Экранирование HTML онлайн: < > & \" ' → &lt; &gt; &amp; &quot; &#39;, а по желанию — все не-ASCII символы как именованные или числовые сущности.",
      en: "HTML-encode text online: < > & \" ' → &lt; &gt; &amp; &quot; &#39;, and optionally every non-ASCII character as a named or numeric entity.",
    },
    lead: { ru: "Пять символов < > & \" ' превращаются в сущности — так текст безопасно вставляется в HTML.", en: "Five characters < > & \" ' become entities, so text can be safely placed into HTML." },
    keywords: { ru: ["html encode", "экранирование html", "html сущности", "htmlspecialchars онлайн"], en: ["html encode", "html escape", "encode html entities", "htmlspecialchars online"] },
    howTo: HOW_ENC("экранированный HTML", "Выберите режим: только спецсимволы, именованные сущности (&laquo;) или числовые коды для всех не-ASCII символов."),
    faq: {
      ru: [
        { q: "Какие символы обязательно экранировать?", a: "& и < всегда, > — желательно, а внутри атрибутов ещё и кавычки \" и '. Этого достаточно, чтобы пользовательский текст не превратился в разметку." },
        { q: "Нужно ли кодировать кириллицу?", a: "Нет, если страница в UTF-8 (<meta charset=\"utf-8\">). Режимы с сущностями пригодятся для старых систем и писем в других кодировках." },
        { q: "Это защита от XSS?", a: "Экранирование текста — основа защиты при выводе в HTML, но для URL в атрибутах, JavaScript и CSS нужны свои правила. В шаблонизаторах используйте встроенное экранирование." },
      ],
      en: [
        { q: "Which characters must be escaped?", a: "& and < always, > preferably, and quotes \" and ' inside attributes. That's enough to keep user text from becoming markup." },
        { q: "Should I encode non-ASCII letters?", a: "Not if the page is UTF-8 (<meta charset=\"utf-8\">). Entity modes help with legacy systems and e-mails in other encodings." },
        { q: "Does this prevent XSS?", a: "Escaping text is the basis of safe HTML output, but URLs in attributes, JavaScript and CSS need their own rules. Prefer your template engine's built-in escaping." },
      ],
    },
    about: {
      ru: [`В режиме «Именованные сущности» используются имена из стандарта HTML5 (всего ${ENTITY_COUNT} ссылок), например &laquo; для «. Если у символа нет имени, пишется шестнадцатеричный код &#x…;.`],
      en: [`Named mode uses the names from the HTML5 standard (${ENTITY_COUNT} references in total), e.g. &laquo; for «. Characters without a name are written as hex codes &#x…;.`],
    },
    blocks: (locale) => [entityTable(locale)],
  },
  {
    slug: "html-decode",
    codec: "html",
    dir: "decode",
    icon: "Code",
    samples: { ru: "&laquo;Привет&raquo; &mdash; &lt;b&gt;жирный&lt;/b&gt; &copy; 2025 &#8470; 5", en: "&ldquo;Hello&rdquo; &mdash; &lt;b&gt;bold&lt;/b&gt; &copy; 2025 &#8364;5" },
    name: { ru: "HTML-декодирование", en: "HTML decode" },
    h1: { ru: "Декодирование HTML-сущностей онлайн", en: "HTML entity decoder" },
    title: { ru: "HTML decode онлайн — сущности в текст", en: "HTML decode online — entities to text" },
    description: {
      ru: `Декодирование HTML-сущностей онлайн: все ${ENTITY_COUNT} именованных ссылок HTML5 (&laquo; &mdash; &nbsp;…), числовые &#1076; и &#x434; — по правилам браузера.`,
      en: `Decode HTML entities online: all ${ENTITY_COUNT} HTML5 named references (&ldquo; &mdash; &nbsp;…) plus numeric &#1076; and &#x434; — exactly as browsers do.`,
    },
    lead: { ru: "&laquo;текст&raquo; → «текст»: распознаются все именованные и числовые ссылки стандарта HTML5.", en: "&ldquo;text&rdquo; → “text”: every HTML5 named and numeric reference is recognized." },
    keywords: { ru: ["html decode", "декодировать html сущности", "html entities в текст"], en: ["html decode", "decode html entities", "unescape html", "html entity decoder"] },
    howTo: {
      ru: ["Вставьте текст с сущностями — например, скопированный из исходного кода страницы.", "Результат появится сразу; неизвестные сущности останутся как есть.", "Скопируйте текст или нажмите «Поменять местами», чтобы закодировать его обратно."],
      en: ["Paste text with entities, e.g. copied from page source.", "The result appears instantly; unknown entities are left as they are.", "Copy the text or press Swap to encode it back."],
    },
    faq: {
      ru: [
        { q: "Почему &copy2024 тоже раскодировалось?", a: "Около ста старых сущностей (&amp, &lt, &copy, &nbsp…) браузеры понимают и без точки с запятой — декодер следует тому же правилу стандарта HTML5." },
        { q: "Что будет с &#0; или &#xD800;?", a: "По стандарту такие коды недопустимы и заменяются символом U+FFFD «�». Коды 128–159 браузер читает как Windows-1252: &#150; — это тире «–»." },
        { q: "Раскодируется ли двойное экранирование &amp;lt;?", a: "За один проход &amp;lt; превратится в &lt;. Нажмите «Поменять местами» и ещё раз «Декодировать», чтобы получить <." },
      ],
      en: [
        { q: "Why did &copy2024 decode too?", a: "Around a hundred legacy entities (&amp, &lt, &copy, &nbsp…) work without a semicolon in browsers — the decoder follows the same HTML5 rule." },
        { q: "What happens to &#0; or &#xD800;?", a: "They're invalid per the standard and become U+FFFD “�”. Codes 128–159 are read as Windows-1252: &#150; is an en dash “–”." },
        { q: "Does double escaping like &amp;lt; decode?", a: "One pass turns &amp;lt; into &lt;. Decode again to get <." },
      ],
    },
    about: {
      ru: [`Декодер использует полную таблицу WHATWG — ${ENTITY_COUNT} именованных ссылок, включая математические (&NotEqualTilde;) и старые формы без «;». Числовые ссылки обрабатываются по алгоритму браузера, включая замену недопустимых кодов.`],
      en: [`The decoder uses the full WHATWG table — ${ENTITY_COUNT} named references, including mathematical ones (&NotEqualTilde;) and legacy forms without “;”. Numeric references follow the browser algorithm, including replacement of invalid codes.`],
    },
    blocks: (locale) => [entityTable(locale)],
  },
];

function entityTable(locale: Locale): Block {
  const names = ["amp", "lt", "gt", "quot", "apos", "nbsp", "laquo", "raquo", "mdash", "ndash", "hellip", "copy", "reg", "trade", "deg", "plusmn", "times", "divide", "euro", "rarr", "larr", "hearts", "check", "numero"];
  return {
    type: "table",
    title: locale === "ru" ? "Частые HTML-сущности" : "Common HTML entities",
    head: locale === "ru" ? ["Символ", "Имя", "Код"] : ["Character", "Name", "Code"],
    rows: names.map((n) => {
      const ch = decodeEntities(`&${n};`);
      return [ch === "\u00a0" ? "NBSP" : ch, `&${n};`, `&#${ch.codePointAt(0)};`];
    }),
    mono: true,
  };
}

/* ───────────── binary / hex ───────────── */

const NUM_EX = ["A", "a", "0", " ", "Я", "€"];
function numPages(): Spec[] {
  const mk = (codec: "binary" | "hex", dir: "encode" | "decode"): Spec => {
    const bin = codec === "binary";
    const nameRu = bin ? "двоичный код" : "hex";
    const ex = (locale: Locale): Block[] => [
      {
        type: "table",
        title: locale === "ru" ? (bin ? "Символы в двоичном коде (UTF-8)" : "Символы в hex (UTF-8)") : bin ? "Characters in binary (UTF-8)" : "Characters in hex (UTF-8)",
        head: locale === "ru" ? ["Символ", bin ? "Двоичный код" : "Hex", "Байт"] : ["Character", bin ? "Binary" : "Hex", "Bytes"],
        rows: NUM_EX.map((ch) => [ch === " " ? (locale === "ru" ? "пробел" : "space") : ch, C.textToBase(ch, bin ? 2 : 16), String(new TextEncoder().encode(ch).length)]),
        mono: true,
      },
    ];
    const enc = dir === "encode";
    const sampleText = { ru: "Привет", en: "Hello" };
    const samples = enc ? sampleText : { ru: C.textToBase(sampleText.ru, bin ? 2 : 16), en: C.textToBase(sampleText.en, bin ? 2 : 16) };
    const slug = enc ? `text-to-${bin ? "binary" : "hex"}` : `${bin ? "binary" : "hex"}-to-text`;
    const H = {
      ru: enc ? (bin ? "Перевод текста в двоичный код" : "Перевод текста в hex") : bin ? "Перевод двоичного кода в текст" : "Перевод hex в текст",
      en: enc ? (bin ? "Text to binary converter" : "Text to hex converter") : bin ? "Binary to text converter" : "Hex to text converter",
    };
    return {
      slug,
      codec,
      dir,
      icon: bin ? "Binary" : "Hash",
      popular: bin,
      samples,
      name: { ru: enc ? (bin ? "Текст в двоичный код" : "Текст в hex") : bin ? "Двоичный код в текст" : "Hex в текст", en: enc ? (bin ? "Text to binary" : "Text to hex") : bin ? "Binary to text" : "Hex to text" },
      h1: H,
      title: { ru: `${H.ru} онлайн`, en: `${H.en} online` },
      description: enc
        ? {
            ru: `Перевод текста в ${nameRu} онлайн: байты UTF-8, кириллица и эмодзи, группы по 1, 2 или 4 байта, префикс ${bin ? "0b" : "0x"}. «A» = ${C.textToBase("A", bin ? 2 : 16)}, «Я» = ${C.textToBase("Я", bin ? 2 : 16)}.`,
            en: `Convert text to ${bin ? "binary" : "hex"} online: UTF-8 bytes for any language and emoji, groups of 1, 2 or 4 bytes, optional ${bin ? "0b" : "0x"} prefix. “A” = ${C.textToBase("A", bin ? 2 : 16)}.`,
          }
        : {
            ru: `Перевод ${bin ? "двоичного кода" : "hex"} в текст онлайн: с пробелами, запятыми, префиксами ${bin ? "0b" : "0x и \\x"} или слитно; UTF-8, Windows-1251 и KOI8-R. Ошибка покажет неверный символ.`,
            en: `Convert ${bin ? "binary" : "hex"} to text online: with spaces, commas, ${bin ? "0b" : "0x or \\x"} prefixes or packed; UTF-8, Windows-1251 or KOI8-R. Errors point to the bad character.`,
          },
      lead: enc
        ? { ru: `«Привет» в ${bin ? "двоичном коде" : "hex"}: ${C.textToBase("Привет", bin ? 2 : 16).slice(0, 60)}${bin ? "…" : ""} — по ${bin ? "8 бит" : "2 цифры"} на байт UTF-8.`, en: `“Hello” in ${bin ? "binary" : "hex"}: ${C.textToBase("Hello", bin ? 2 : 16).slice(0, 54)}${bin ? "…" : ""} — ${bin ? "8 bits" : "2 digits"} per UTF-8 byte.` }
        : { ru: `Вставьте ${bin ? "нули и единицы" : "hex-байты"} с разделителями или без — текст появится сразу.`, en: `Paste ${bin ? "zeros and ones" : "hex bytes"} with or without separators — the text appears instantly.` },
      keywords: enc ? { ru: [bin ? "текст в двоичный код" : "текст в hex", bin ? "двоичный код онлайн" : "hex онлайн", bin ? "перевод в бинарный код" : "text to hex"], en: [bin ? "text to binary" : "text to hex", bin ? "binary translator" : "ascii to hex", bin ? "string to binary" : "string to hex"] } : { ru: [bin ? "двоичный код в текст" : "hex в текст", bin ? "расшифровать двоичный код" : "hex decoder"], en: [bin ? "binary to text" : "hex to text", bin ? "binary translator" : "hex to ascii", bin ? "binary decoder" : "hex decoder"] },
      howTo: enc
        ? HOW_ENC(bin ? "двоичный код" : "hex", `Настройте группировку (по 1, 2 или 4 байта или без пробелов) и префикс ${bin ? "0b" : "0x"}.`)
        : {
            ru: ["Вставьте байты — через пробел, запятую, с префиксами или одной строкой.", "Если текст в старой кодировке, выберите Windows-1251 или KOI8-R.", "Скопируйте результат или поменяйте направление."],
            en: ["Paste the bytes — separated by spaces or commas, with prefixes or as one string.", "For legacy text choose Windows-1251 or KOI8-R.", "Copy the result or swap the direction."],
          },
      faq: {
        ru: [
          { q: `Почему русская буква занимает ${bin ? "16 бит" : "4 hex-цифры"}?`, a: "В UTF-8 буквы кириллицы кодируются двумя байтами, латиница и цифры — одним, эмодзи — четырьмя. Каждый байт записывается отдельно." },
          { q: "Как указать другую кодировку?", a: "При переводе в текст выберите Windows-1251 или KOI8-R — так раскодируются байты из старых русских программ и файлов." },
          { q: bin ? "Что такое бит и байт?" : "Что такое hex?", a: bin ? "Бит — одна двоичная цифра (0 или 1). Байт — 8 бит, он хранит число от 0 до 255. Буква A — байт 65, то есть 01000001." : "Шестнадцатеричная система: цифры 0–9 и буквы a–f. Один байт (0–255) записывается двумя hex-цифрами, от 00 до ff." },
        ],
        en: [
          { q: `Why does a non-Latin letter take ${bin ? "16 bits" : "4 hex digits"}?`, a: "In UTF-8, Cyrillic, Greek and similar letters take two bytes, ASCII one, emoji four. Each byte is written separately." },
          { q: "Can I use another character set?", a: "When converting to text choose Windows-1251 or KOI8-R to decode bytes from legacy Russian software and files." },
          { q: bin ? "What are bits and bytes?" : "What is hex?", a: bin ? "A bit is one binary digit (0 or 1). A byte is 8 bits and holds a number from 0 to 255. The letter A is byte 65, i.e. 01000001." : "Hexadecimal uses digits 0–9 and letters a–f. One byte (0–255) is written as two hex digits, 00 to ff." },
        ],
      },
      about: {
        ru: [`Текст переводится в байты UTF-8, и каждый байт записывается ${bin ? "восемью двоичными цифрами" : "двумя шестнадцатеричными цифрами"}. Обратный перевод терпим к формату: разделители, префиксы и пропущенные ведущие нули распознаются автоматически. Восьмеричные и десятичные коды доступны в тех же настройках группировки.`],
        en: [`Text is converted to UTF-8 bytes and each byte is written as ${bin ? "eight binary digits" : "two hex digits"}. The reverse direction is tolerant: separators, prefixes and missing leading zeros are detected automatically.`],
      },
      blocks: ex,
    };
  };
  return [mk("binary", "encode"), mk("binary", "decode"), mk("hex", "encode"), mk("hex", "decode")];
}

/* ───────────── Base32 / Base58 / Ascii85 ───────────── */

function basePair(codec: "base32" | "base58" | "base85", slugBase: string, label: string, info: { alphabet: L; use: L; ratio: L }, options: Opts = {}): Spec[] {
  const plain = { ru: "Привет", en: "Hello" };
  const encoded = { ru: run(codec, "encode", plain.ru, options), en: run(codec, "encode", plain.en, options) };
  const facts = (locale: Locale): Block[] => [
    {
      type: "facts",
      title: locale === "ru" ? `${label} коротко` : `${label} at a glance`,
      rows: locale === "ru" ? [["Алфавит", info.alphabet.ru], ["Размер", info.ratio.ru], ["Где используется", info.use.ru]] : [["Alphabet", info.alphabet.en], ["Size", info.ratio.en], ["Used in", info.use.en]],
    },
    examples(locale, { ru: `Текст|${label}`, en: `Text|${label}` }, ["Hello", "Привет", "Hello World", "123"].map((x) => [x, run(codec, "encode", x, options)])),
  ];
  const mk = (dir: "encode" | "decode"): Spec => {
    const enc = dir === "encode";
    return {
      slug: `${slugBase}-${dir}`,
      codec,
      dir,
      icon: "Binary",
      options,
      samples: enc ? plain : encoded,
      name: { ru: `${label} ${enc ? "кодирование" : "декодирование"}`, en: `${label} ${dir}` },
      h1: { ru: `${enc ? "Кодирование" : "Декодирование"} ${label} онлайн`, en: `${label} ${enc ? "encoder" : "decoder"}` },
      title: { ru: `${label} ${enc ? "кодирование" : "декодирование"} онлайн — ${enc ? `текст в ${label}` : `${label} в текст`}`, en: `${label} ${dir} online — ${enc ? `text to ${label}` : `${label} to text`}` },
      description: {
        ru: `${enc ? `Кодирование текста в ${label}` : `Декодирование ${label} в текст`} онлайн: ${info.alphabet.ru}; ${info.ratio.ru}. «Привет» = ${encoded.ru}. Работает в браузере.`.slice(0, 160),
        en: `${enc ? `Encode text to ${label}` : `Decode ${label} to text`} online: ${info.alphabet.en}; ${info.ratio.en}. “Hello” = ${encoded.en}. Runs in your browser.`.slice(0, 160),
      },
      lead: { ru: `«Привет» в ${label} — ${encoded.ru}.`, en: `“Hello” in ${label} is ${encoded.en}.` },
      keywords: { ru: [label.toLowerCase(), `${label.toLowerCase()} ${enc ? "encode" : "decode"}`, `${enc ? "кодировать" : "декодировать"} ${label.toLowerCase()}`], en: [label.toLowerCase(), `${label.toLowerCase()} ${dir}`, `${label.toLowerCase()} ${enc ? "encoder" : "decoder"}`] },
      howTo: enc
        ? HOW_ENC(label, codec === "base32" ? "Выберите вариант алфавита: RFC 4648, base32hex или Crockford." : codec === "base85" ? "Выберите Ascii85 (Adobe, с <~ ~>) или Z85 (ZeroMQ, длина кратна 4 байтам)." : "Base58 использует алфавит Bitcoin — без 0, O, I и l.")
        : {
            ru: [`Вставьте строку ${label}.`, "Текст появится сразу; двоичные данные можно скачать файлом.", "Если символ не из алфавита, ошибка покажет его позицию."],
            en: [`Paste a ${label} string.`, "Text appears instantly; binary data can be downloaded as a file.", "If a character isn't in the alphabet, the error shows its position."],
          },
      faq: FAQ_BASES[codec],
      about: { ru: [ABOUT_BASES[codec].ru], en: [ABOUT_BASES[codec].en] },
      blocks: facts,
    };
  };
  return [mk("encode"), mk("decode")];
}

const FAQ_BASES: Record<"base32" | "base58" | "base85", F> = {
  base32: {
    ru: [
      { q: "Зачем Base32, если есть Base64?", a: "Base32 использует только заглавные буквы и цифры 2–7, поэтому не зависит от регистра и удобен для диктовки и имён файлов. Плата — рост размера на 60 % вместо 33 %." },
      { q: "Где встречается Base32?", a: "В секретных ключах двухфакторной аутентификации (TOTP, Google Authenticator), в onion-адресах Tor и в DNSSEC (base32hex)." },
      { q: "Чем Crockford отличается от RFC 4648?", a: "Алфавит Крокфорда — цифры и буквы без I, L, O, U; при декодировании O читается как 0, I и L — как 1. Его используют ULID и короткие коды." },
    ],
    en: [
      { q: "Why Base32 if there is Base64?", a: "Base32 uses only uppercase letters and digits 2–7, so it's case-insensitive and easy to dictate or use in file names. The cost is +60% size instead of +33%." },
      { q: "Where is Base32 used?", a: "In two-factor authentication secrets (TOTP, Google Authenticator), Tor onion addresses and DNSSEC (base32hex)." },
      { q: "How does Crockford differ from RFC 4648?", a: "Crockford's alphabet is digits and letters without I, L, O, U; when decoding O reads as 0 and I/L as 1. ULID and short codes use it." },
    ],
  },
  base58: {
    ru: [
      { q: "Почему в Base58 нет 0, O, I и l?", a: "Эти символы легко перепутать при чтении. Base58 придуман для адресов Bitcoin, которые люди переписывают вручную." },
      { q: "Что значат единицы в начале?", a: "Каждый нулевой байт в начале данных записывается символом 1 — так они не теряются при переводе в большое число." },
      { q: "Base58 и Base58Check — одно и то же?", a: "Нет: Base58Check добавляет 4 байта контрольной суммы (двойной SHA-256) перед кодированием. Здесь выполняется обычный Base58 без контрольной суммы." },
    ],
    en: [
      { q: "Why does Base58 omit 0, O, I and l?", a: "They are easy to confuse when reading. Base58 was designed for Bitcoin addresses that people copy by hand." },
      { q: "What do leading 1s mean?", a: "Each leading zero byte is written as the character 1, so it isn't lost when the data is treated as a big number." },
      { q: "Is Base58 the same as Base58Check?", a: "No: Base58Check appends a 4-byte checksum (double SHA-256) before encoding. This tool does plain Base58 without a checksum." },
    ],
  },
  base85: {
    ru: [
      { q: "Чем Ascii85 лучше Base64?", a: "4 байта кодируются 5 символами — рост 25 % вместо 33 %. Цена — более широкий набор символов, неудобный в URL и XML." },
      { q: "Где используется Ascii85?", a: "В PostScript и PDF (фильтр ASCII85Decode) и в Git для бинарных патчей (вариант Base85). Z85 применяется в ZeroMQ." },
      { q: "Что означает символ z?", a: "В Ascii85 четыре нулевых байта подряд сокращаются до одного символа z." },
    ],
    en: [
      { q: "Why Ascii85 instead of Base64?", a: "4 bytes become 5 characters — 25% overhead instead of 33%. The trade-off is a wider character set that's awkward in URLs and XML." },
      { q: "Where is Ascii85 used?", a: "In PostScript and PDF (the ASCII85Decode filter) and in Git binary patches (a Base85 variant). Z85 is used by ZeroMQ." },
      { q: "What does z mean?", a: "In Ascii85 four zero bytes in a row are shortened to a single z." },
    ],
  },
};

const ABOUT_BASES: Record<"base32" | "base58" | "base85", L> = {
  base32: {
    ru: "Base32 из RFC 4648 кодирует каждые 5 бит одним из 32 символов (A–Z и 2–7) и дополняет результат знаками = до длины, кратной 8. Здесь доступны три алфавита: стандартный, base32hex (0–9, A–V) и Crockford.",
    en: "RFC 4648 Base32 encodes every 5 bits as one of 32 characters (A–Z and 2–7) and pads the result with = to a multiple of 8. Three alphabets are available: standard, base32hex (0–9, A–V) and Crockford.",
  },
  base58: {
    ru: "Base58 переводит данные в число по основанию 58 с алфавитом Bitcoin (123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz). Его используют адреса Bitcoin, IPFS CID v0 (Qm…) и ключи Solana.",
    en: "Base58 converts data to a base-58 number with the Bitcoin alphabet (123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz). It's used by Bitcoin addresses, IPFS CID v0 (Qm…) and Solana keys.",
  },
  base85: {
    ru: "Ascii85 (вариант Adobe) кодирует группы по 4 байта пятью символами от ! до u и обрамляет результат <~ ~>. Z85 от ZeroMQ использует другой алфавит без кавычек и обратной косой черты и требует длину, кратную 4 байтам.",
    en: "Ascii85 (Adobe's variant) encodes 4-byte groups as five characters from ! to u and wraps the result in <~ ~>. ZeroMQ's Z85 uses a different alphabet without quotes or backslashes and requires a length that is a multiple of 4 bytes.",
  },
};

/* ───────────── escapes ───────────── */

const escapeSpecs: Spec[] = [
  {
    slug: "unicode-escape",
    codec: "unicode",
    dir: "encode",
    icon: "Braces",
    options: { style: "js" },
    samples: { ru: "Привет 👋", en: "Café 👋" },
    name: { ru: "Unicode escape", en: "Unicode escape" },
    h1: { ru: "Unicode escape онлайн — \\uXXXX", en: "Unicode escape — \\uXXXX encoder" },
    title: { ru: "Unicode escape онлайн — текст в \\uXXXX и &#x…;", en: "Unicode escape online — text to \\uXXXX and &#x…;" },
    description: {
      ru: "Перевод текста в escape-последовательности Unicode: \\uXXXX с суррогатными парами (JavaScript, JSON), \\u{…} (ES6), &#x…; (HTML), \\U для Python, CSS и U+XXXX.",
      en: "Convert text to Unicode escapes: \\uXXXX with surrogate pairs (JavaScript, JSON), \\u{…} (ES6), &#x…; (HTML), \\U for Python, CSS escapes and U+XXXX.",
    },
    lead: { ru: `«П» → ${run("unicode", "encode", "П")}, «👋» → ${run("unicode", "encode", "👋")} (суррогатная пара UTF-16).`, en: `“é” → ${run("unicode", "encode", "é")}, “👋” → ${run("unicode", "encode", "👋")} (a UTF-16 surrogate pair).` },
    keywords: { ru: ["unicode escape", "\\u кодировка", "текст в unicode коды", "юникод escape"], en: ["unicode escape", "\\u escape", "text to unicode", "unicode encoder"] },
    howTo: HOW_ENC("escape-последовательности", "Выберите формат под язык: \\uXXXX для JavaScript и JSON, \\u{…} для ES6, &#x…; для HTML, \\U00… для Python."),
    faq: {
      ru: [
        { q: "Почему эмодзи превращается в два \\u?", a: "\\uXXXX вмещает только 16 бит, а у эмодзи код больше U+FFFF. В JavaScript и JSON он записывается суррогатной парой — двумя последовательностями. В ES6 можно писать \\u{1F44B}." },
        { q: "Нужно ли экранировать латиницу?", a: "Обычно нет — по умолчанию экранируются только символы вне ASCII. Включите «Экранировать и ASCII», если нужен код каждого символа." },
        { q: "Как записать Unicode в CSS?", a: "Обратная косая черта и шестнадцатеричный код с пробелом после него: content: \"\\2192 \" для стрелки →." },
      ],
      en: [
        { q: "Why does an emoji become two \\u sequences?", a: "\\uXXXX holds only 16 bits, while emoji are above U+FFFF. JavaScript and JSON write them as a surrogate pair — two sequences. ES6 also allows \\u{1F44B}." },
        { q: "Should ASCII be escaped?", a: "Usually not — by default only non-ASCII characters are escaped. Turn on “Escape ASCII too” to get a code for every character." },
        { q: "How do I write Unicode in CSS?", a: "A backslash and the hex code followed by a space: content: \"\\2192 \" for →." },
      ],
    },
    about: {
      ru: ["Escape-последовательности позволяют записать любой символ Unicode только ASCII-символами — в исходном коде, JSON, CSS или HTML. Обратное преобразование понимает все форматы сразу, даже вперемешку."],
      en: ["Escape sequences let you write any Unicode character using only ASCII — in source code, JSON, CSS or HTML. The reverse tool understands every format at once, even mixed."],
    },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Форматы для «д» и «😀»" : "Formats for “д” and “😀”",
        head: locale === "ru" ? ["Формат", "д", "😀"] : ["Format", "д", "😀"],
        rows: (["js", "es6", "html", "python", "css", "uplus"] as const).map((s) => [s === "js" ? "JavaScript / JSON" : s === "es6" ? "ES6" : s === "html" ? "HTML" : s === "python" ? "Python" : s === "css" ? "CSS" : "Unicode", run("unicode", "encode", "д", { style: s }), run("unicode", "encode", "😀", { style: s })]),
        mono: true,
      },
    ],
  },
  {
    slug: "unicode-unescape",
    codec: "unicode",
    dir: "decode",
    icon: "Braces",
    samples: { ru: "\\u041F\\u0440\\u0438\\u0432\\u0435\\u0442 \\uD83D\\uDC4B", en: "Caf\\u00E9 \\u{1F44B} &#x2764;" },
    name: { ru: "Unicode unescape", en: "Unicode unescape" },
    h1: { ru: "Декодирование \\uXXXX в текст", en: "Unicode unescape — \\uXXXX to text" },
    title: { ru: "Декодер \\uXXXX онлайн — Unicode escape в текст", en: "Unicode unescape online — \\uXXXX to text" },
    description: {
      ru: "Перевод escape-последовательностей в текст: \\u0414, суррогатные пары \\uD83D\\uDE00, \\u{1F600}, \\U0001F600, \\x41, &#x434; и U+0414 — даже вперемешку в одном тексте.",
      en: "Turn escape sequences into text: \\u0414, surrogate pairs \\uD83D\\uDE00, \\u{1F600}, \\U0001F600, \\x41, &#x434; and U+0414 — even mixed in one text.",
    },
    lead: { ru: "\\u041F\\u0440\\u0438 → «При»: вставьте текст с кодами — они заменятся символами.", en: "\\u0048\\u0069 → “Hi”: paste text with codes and they turn into characters." },
    keywords: { ru: ["unicode decode", "\\u в текст", "декодировать unicode", "unicode unescape"], en: ["unicode unescape", "unicode decoder", "\\u to text", "decode unicode escape"] },
    howTo: {
      ru: ["Вставьте строку с последовательностями — например, из JSON-ответа или лога.", "Все поддерживаемые форматы распознаются автоматически; прочий текст остаётся без изменений.", "Скопируйте результат."],
      en: ["Paste a string with escapes, e.g. from a JSON response or a log.", "All supported formats are detected automatically; other text stays unchanged.", "Copy the result."],
    },
    faq: {
      ru: [
        { q: "Почему в логе русские буквы выглядят как \\u0430?", a: "Многие библиотеки (например, json.dumps в Python по умолчанию) экранируют всё, что вне ASCII. Это корректный JSON; декодер вернёт читаемый текст." },
        { q: "Что делать с \\uD83D\\uDE00?", a: "Это суррогатная пара — один эмодзи 😀. Декодер склеивает такие пары в один символ." },
        { q: "Понимает ли декодер &#1076;?", a: "Да, десятичные и шестнадцатеричные HTML-коды тоже распознаются. Для именованных сущностей (&laquo;) используйте HTML-декодер." },
      ],
      en: [
        { q: "Why do logs show letters as \\u00e9?", a: "Many libraries (e.g. Python's json.dumps by default) escape everything outside ASCII. It's valid JSON; the decoder makes it readable." },
        { q: "What about \\uD83D\\uDE00?", a: "That's a surrogate pair — a single emoji 😀. The decoder joins such pairs into one character." },
        { q: "Does it understand &#1076;?", a: "Yes, decimal and hex HTML codes are recognized too. For named entities (&laquo;) use the HTML decoder." },
      ],
    },
    about: { ru: ["Декодер ищет в тексте последовательности \\uXXXX, \\u{…}, \\UXXXXXXXX, \\xXX, &#…; и U+XXXX и заменяет их символами, корректно объединяя суррогатные пары UTF-16."], en: ["The decoder finds \\uXXXX, \\u{…}, \\UXXXXXXXX, \\xXX, &#…; and U+XXXX sequences and replaces them with characters, joining UTF-16 surrogate pairs correctly."] },
  },
  {
    slug: "json-escape",
    codec: "json",
    dir: "encode",
    icon: "Braces",
    samples: { ru: 'Строка с "кавычками",\nпереносом и \\ слэшем', en: 'A string with "quotes",\na newline and a \\ backslash' },
    name: { ru: "JSON escape", en: "JSON escape" },
    h1: { ru: "Экранирование строки для JSON", en: "JSON escape" },
    title: { ru: "JSON escape онлайн — экранировать строку для JSON", en: "JSON escape online — escape a string for JSON" },
    description: {
      ru: "Экранирование текста для JSON онлайн: кавычки \\\", обратная косая черта \\\\, переносы \\n, табуляция \\t и управляющие символы; по желанию — не-ASCII как \\uXXXX.",
      en: "Escape text for JSON online: quotes \\\", backslashes \\\\, newlines \\n, tabs \\t and control characters; optionally non-ASCII as \\uXXXX.",
    },
    lead: { ru: "Кавычки, \\ и переносы строк экранируются так, чтобы текст можно было вставить в JSON как строку.", en: "Quotes, backslashes and line breaks are escaped so the text can go into JSON as a string." },
    keywords: { ru: ["json escape", "экранировать json", "строка в json"], en: ["json escape", "escape json string", "json stringify online"] },
    howTo: HOW_ENC("строка JSON", "Снимите «В кавычках», если нужна только внутренняя часть, и включите «Не-ASCII как \\u» для систем без UTF-8."),
    faq: {
      ru: [
        { q: "Какие символы экранируются в JSON?", a: "Обязательно: кавычка \\\", обратная косая черта \\\\ и управляющие символы U+0000–U+001F (\\n, \\r, \\t, \\b, \\f и \\u00XX). Остальное, включая кириллицу, можно оставить как есть." },
        { q: "Нужно ли экранировать /?", a: "Нет. \\/ допустимо, но не обязательно; его иногда используют, чтобы </script> внутри JSON не закрыл тег в HTML." },
        { q: "Это то же, что JSON.stringify?", a: "Да, результат совпадает с JSON.stringify для строки; дополнительно можно убрать кавычки и экранировать не-ASCII." },
      ],
      en: [
        { q: "Which characters are escaped in JSON?", a: "Required: the quote \\\", backslash \\\\ and control characters U+0000–U+001F (\\n, \\r, \\t, \\b, \\f and \\u00XX). Everything else, including non-Latin text, can stay as is." },
        { q: "Do I need to escape /?", a: "No. \\/ is allowed but optional; it's sometimes used so </script> inside JSON can't close an HTML tag." },
        { q: "Is this the same as JSON.stringify?", a: "Yes, the output matches JSON.stringify for a string; you can also drop the quotes and escape non-ASCII." },
      ],
    },
    about: { ru: ["Экранирование по RFC 8259 превращает произвольный текст — с кавычками, переносами и табуляцией — в корректную строку JSON."], en: ["RFC 8259 escaping turns arbitrary text — with quotes, newlines and tabs — into a valid JSON string."] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Escape-последовательности JSON" : "JSON escape sequences",
        head: locale === "ru" ? ["Символ", "Запись"] : ["Character", "Escape"],
        rows: [
          ['"', '\\"'],
          ["\\", "\\\\"],
          [locale === "ru" ? "перевод строки" : "newline", "\\n"],
          [locale === "ru" ? "возврат каретки" : "carriage return", "\\r"],
          [locale === "ru" ? "табуляция" : "tab", "\\t"],
          ["backspace", "\\b"],
          ["form feed", "\\f"],
          ["U+0000–U+001F", "\\u0000…\\u001F"],
        ],
        mono: true,
      },
    ],
  },
  {
    slug: "json-unescape",
    codec: "json",
    dir: "decode",
    icon: "Braces",
    samples: { ru: '"Строка с \\"кавычками\\",\\nпереносом и \\u2014 тире"', en: '"A string with \\"quotes\\",\\na newline and \\u2014 a dash"' },
    name: { ru: "JSON unescape", en: "JSON unescape" },
    h1: { ru: "Раскодировать строку JSON", en: "JSON unescape" },
    title: { ru: "JSON unescape онлайн — строка JSON в текст", en: "JSON unescape online — JSON string to plain text" },
    description: {
      ru: "Раскодирование строки JSON: \\n становится переносом, \\\" — кавычкой, \\u0414 — буквой. Работает с кавычками вокруг строки и без них, ошибки — с позицией.",
      en: "Unescape a JSON string: \\n becomes a newline, \\\" a quote and \\u00e9 a letter. Works with or without surrounding quotes; errors come with a position.",
    },
    lead: { ru: "Вставьте экранированную строку — получите исходный текст с настоящими переносами и кавычками.", en: "Paste an escaped string and get the original text with real line breaks and quotes." },
    keywords: { ru: ["json unescape", "раскодировать json строку"], en: ["json unescape", "unescape json string", "json string decoder"] },
    howTo: {
      ru: ["Вставьте строку JSON — с кавычками по краям или без них.", "Результат появится сразу; неизвестная последовательность вроде \\q будет показана с позицией.", "Скопируйте текст."],
      en: ["Paste a JSON string — with or without the surrounding quotes.", "The result appears instantly; an unknown sequence like \\q is shown with its position.", "Copy the text."],
    },
    faq: {
      ru: [
        { q: "Откуда берутся строки вроде \"\\u041f…\"?", a: "Из JSON-ответов API и логов: сериализаторы экранируют переносы и иногда всю кириллицу. Раскодирование возвращает читаемый текст." },
        { q: "Почему ошибка «неэкранированная кавычка»?", a: "Внутри строки JSON кавычка должна быть записана как \\\". Если строка обрезана или склеена из частей, такая кавычка ломает формат." },
        { q: "Нужны ли кавычки по краям?", a: "Нет, декодер принимает и строку целиком в кавычках, и только её содержимое." },
      ],
      en: [
        { q: "Where do strings like \"\\u00e9…\" come from?", a: "API responses and logs: serializers escape newlines and sometimes all non-ASCII text. Unescaping makes it readable." },
        { q: "Why “unescaped quote”?", a: "Inside a JSON string a quote must be written as \\\". If the string was cut or glued together, such a quote breaks the format." },
        { q: "Do I need the surrounding quotes?", a: "No, the decoder accepts the whole quoted string or just its content." },
      ],
    },
    about: { ru: ["Декодер разбирает escape-последовательности по грамматике RFC 8259 и сообщает о неверных вместо того, чтобы молча их пропускать."], en: ["The decoder parses escape sequences by the RFC 8259 grammar and reports invalid ones instead of silently skipping them."] },
  },
  {
    slug: "quoted-printable-encode",
    codec: "qp",
    dir: "encode",
    icon: "Mail",
    samples: { ru: "Здравствуйте! Цена = 1 500 ₸", en: "Déjà vu — price = €15 " },
    name: { ru: "Quoted-printable кодирование", en: "Quoted-printable encode" },
    h1: { ru: "Кодирование quoted-printable", en: "Quoted-printable encoder" },
    title: { ru: "Quoted-printable кодирование онлайн (RFC 2045)", en: "Quoted-printable encode online (RFC 2045)" },
    description: {
      ru: "Кодирование quoted-printable для писем онлайн по RFC 2045: байты UTF-8 как =D0=97, знак = как =3D, пробел в конце строки =20, мягкие переносы до 76 символов.",
      en: "Quoted-printable encoding for e-mail per RFC 2045: UTF-8 bytes as =C3=A9, = as =3D, trailing spaces as =20, soft line breaks within 76 characters.",
    },
    lead: { ru: "ASCII-текст остаётся читаемым, а остальные байты записываются как =XX; строки не длиннее 76 символов.", en: "ASCII text stays readable, other bytes become =XX, and lines stay within 76 characters." },
    keywords: { ru: ["quoted-printable", "quoted printable кодировать"], en: ["quoted-printable encode", "quoted printable encoder", "qp encoding"] },
    howTo: HOW_ENC("текст в quoted-printable", "Длинные строки автоматически разбиваются мягкими переносами «=» в конце строки."),
    faq: {
      ru: [
        { q: "Где используется quoted-printable?", a: "В электронной почте (заголовок Content-Transfer-Encoding: quoted-printable) и vCard. Он удобен, когда текст почти весь латинский: в отличие от Base64, он остаётся читаемым." },
        { q: "Что значит знак = в конце строки?", a: "Это мягкий перенос: при декодировании он удаляется вместе с переводом строки, и строки склеиваются." },
        { q: "В какой кодировке байты?", a: "Текст кодируется в UTF-8, поэтому в заголовке письма нужно указать charset=utf-8." },
      ],
      en: [
        { q: "Where is quoted-printable used?", a: "In e-mail (Content-Transfer-Encoding: quoted-printable) and vCard. It suits mostly-ASCII text because, unlike Base64, it stays readable." },
        { q: "What does = at the end of a line mean?", a: "It's a soft line break: when decoding it's removed together with the newline and the lines are joined." },
        { q: "Which charset are the bytes in?", a: "Text is encoded as UTF-8, so declare charset=utf-8 in the e-mail header." },
      ],
    },
    about: { ru: ["Quoted-printable из RFC 2045 записывает печатные ASCII-символы как есть, а все прочие байты — знаком = и двумя hex-цифрами. Для русского текста результат длиннее, чем Base64, зато латиница и цифры читаются без декодирования."], en: ["RFC 2045 quoted-printable writes printable ASCII as is and every other byte as = plus two hex digits. For mostly non-Latin text it's longer than Base64, but Latin letters and digits stay readable."] },
  },
  {
    slug: "quoted-printable-decode",
    codec: "qp",
    dir: "decode",
    icon: "Mail",
    samples: { ru: "=D0=97=D0=B4=D1=80=D0=B0=D0=B2=D1=81=D1=82=D0=B2=D1=83=D0=B9=D1=82=D0=B5!", en: "D=C3=A9j=C3=A0 vu =E2=80=94 price =3D =E2=82=AC15" },
    name: { ru: "Quoted-printable декодирование", en: "Quoted-printable decode" },
    h1: { ru: "Декодирование quoted-printable", en: "Quoted-printable decoder" },
    title: { ru: "Quoted-printable декодер онлайн — UTF-8 и Windows-1251", en: "Quoted-printable decode online — UTF-8 and more" },
    description: {
      ru: "Декодирование quoted-printable онлайн: =D0=9F и мягкие переносы «=». Кодировки UTF-8, Windows-1251, KOI8-R и ISO-8859-1 — для старых писем с «кракозябрами».",
      en: "Decode quoted-printable online: =C3=A9 sequences and soft “=” line breaks. UTF-8, Windows-1251, KOI8-R and ISO-8859-1 charsets for old e-mails.",
    },
    lead: { ru: "=D0=9F=D1=80=D0=B8 → «При»; выберите Windows-1251 или KOI8-R для старых писем.", en: "=C3=A9 → “é”; pick another charset for legacy e-mails." },
    keywords: { ru: ["quoted-printable декодировать", "=D0 раскодировать", "декодер quoted printable"], en: ["quoted-printable decode", "quoted printable decoder", "decode qp"] },
    howTo: {
      ru: ["Вставьте фрагмент исходного текста письма с =XX.", "Если получились «кракозябры», выберите кодировку из заголовка Content-Type (charset=windows-1251 или koi8-r).", "Скопируйте раскодированный текст."],
      en: ["Paste the part of the raw e-mail with =XX sequences.", "If the output is garbled, choose the charset from the Content-Type header.", "Copy the decoded text."],
    },
    faq: {
      ru: [
        { q: "Как понять, какая кодировка у письма?", a: "Посмотрите заголовок Content-Type части письма: charset=utf-8, windows-1251 или koi8-r. Старые русские почтовые клиенты часто использовали KOI8-R." },
        { q: "Что делать со словами вида =?UTF-8?Q?…?= в теме?", a: "Это encoded-word из RFC 2047: уберите =?UTF-8?Q? в начале и ?= в конце, замените _ на пробелы и вставьте середину сюда." },
        { q: "Почему остались знаки =?", a: "Если после = не идут две hex-цифры, по RFC 2045 декодер оставляет символ как есть, чтобы не потерять данные." },
      ],
      en: [
        { q: "How do I know the e-mail charset?", a: "Check the Content-Type header of the message part: charset=utf-8, windows-1251, iso-8859-1 and so on." },
        { q: "What about =?UTF-8?Q?…?= in subjects?", a: "That's an RFC 2047 encoded word: drop =?UTF-8?Q? at the start and ?= at the end, replace _ with spaces and paste the middle here." },
        { q: "Why are some = signs left?", a: "If = isn't followed by two hex digits, RFC 2045 lets decoders keep it as is so no data is lost." },
      ],
    },
    about: { ru: ["Декодер удаляет мягкие переносы, собирает байты =XX и читает их в выбранной кодировке. Windows-1251 и KOI8-R декодируются средствами браузера (TextDecoder)."], en: ["The decoder removes soft line breaks, collects =XX bytes and reads them in the chosen charset using the browser's TextDecoder."] },
  },
];

/* ───────────── ciphers ───────────── */

const cipherSpecs: Spec[] = [
  {
    slug: "rot13",
    codec: "rot",
    dir: "encode",
    icon: "RotateCw",
    samples: { ru: "Hello, World! Привет не меняется", en: "Why did the chicken cross the road?" },
    name: { ru: "ROT13", en: "ROT13" },
    h1: { ru: "ROT13 онлайн", en: "ROT13 encoder and decoder" },
    title: { ru: "ROT13 онлайн — шифр и дешифровка ROT13 и ROT47", en: "ROT13 online — encode and decode ROT13 and ROT47" },
    description: {
      ru: "ROT13 онлайн: каждая латинская буква сдвигается на 13 позиций, поэтому одно действие и шифрует, и расшифровывает. ROT47 сдвигает все печатные ASCII-символы на 47.",
      en: "ROT13 online: every Latin letter shifts by 13 places, so the same operation encodes and decodes. ROT47 rotates all printable ASCII characters by 47.",
    },
    lead: { ru: `«Hello» в ROT13 — «${C.rot13("Hello")}»; повторное применение возвращает исходный текст.`, en: `“Hello” in ROT13 is “${C.rot13("Hello")}”; applying it again restores the text.` },
    keywords: { ru: ["rot13", "rot13 онлайн", "rot47"], en: ["rot13", "rot13 decoder", "rot13 encoder", "rot47"] },
    howTo: {
      ru: ["Вставьте текст — ROT13 применится сразу.", "Чтобы расшифровать, вставьте зашифрованный текст: ROT13 обратим сам себе.", "Выберите ROT47, если нужно сдвигать также цифры и знаки."],
      en: ["Paste text — ROT13 is applied instantly.", "To decode, paste the encoded text: ROT13 is its own inverse.", "Choose ROT47 to rotate digits and punctuation too."],
    },
    faq: {
      ru: [
        { q: "Почему ROT13 одновременно шифрует и расшифровывает?", a: "В латинском алфавите 26 букв, а 13 + 13 = 26: двойной сдвиг возвращает букву на место." },
        { q: "Меняется ли кириллица?", a: "Нет, ROT13 определён только для латиницы. Для русского текста используйте шифр Цезаря со сдвигом по 33 буквам." },
        { q: "Надёжен ли ROT13?", a: "Нет, это не защита, а способ спрятать спойлер или ответ загадки от случайного взгляда." },
      ],
      en: [
        { q: "Why does ROT13 both encode and decode?", a: "The Latin alphabet has 26 letters and 13 + 13 = 26: shifting twice brings each letter back." },
        { q: "Are digits changed?", a: "Not in ROT13 — only letters rotate. ROT47 also rotates digits and punctuation (all ASCII from ! to ~)." },
        { q: "Is ROT13 secure?", a: "No, it only hides spoilers or puzzle answers from a casual glance." },
      ],
    },
    about: { ru: ["ROT13 — частный случай шифра Цезаря со сдвигом 13, популярный с 1980-х годов в Usenet для скрытия спойлеров."], en: ["ROT13 is a Caesar cipher with a shift of 13, popular since the 1980s on Usenet for hiding spoilers."] },
  },
  {
    slug: "caesar-cipher",
    codec: "caesar",
    dir: "encode",
    icon: "KeyRound",
    cipher: true,
    options: { shift: 3, alphabet: "both" },
    samples: { ru: "Привет, мир!", en: "Veni, vidi, vici" },
    name: { ru: "Шифр Цезаря", en: "Caesar cipher" },
    h1: { ru: "Шифр Цезаря онлайн", en: "Caesar cipher" },
    title: { ru: "Шифр Цезаря онлайн — шифровка и расшифровка текста", en: "Caesar cipher online — encrypt and decrypt text" },
    description: {
      ru: "Шифр Цезаря онлайн для русского (33 буквы с Ё) и латинского алфавита: любой сдвиг, шифровка и расшифровка, перебор всех сдвигов для взлома без ключа.",
      en: "Caesar cipher online for the Latin (26 letters) and Russian (33 letters) alphabets: any shift, encrypt and decrypt, plus all shifts at once to crack a message.",
    },
    lead: { ru: `Со сдвигом 3 «Привет» превращается в «${C.caesar("Привет", 3)}», «Veni» — в «${C.caesar("Veni", 3)}».`, en: `With a shift of 3 “Veni” becomes “${C.caesar("Veni", 3)}”.` },
    keywords: { ru: ["шифр цезаря", "шифр цезаря онлайн", "расшифровать шифр цезаря"], en: ["caesar cipher", "caesar cipher decoder", "caesar shift"] },
    howTo: {
      ru: ["Введите текст и задайте сдвиг (классический — 3).", "Выберите алфавит: латиница, кириллица из 33 букв или оба сразу.", "Для расшифровки переключитесь на «Расшифровать»; если сдвиг неизвестен, откройте «Все сдвиги» и найдите осмысленную строку."],
      en: ["Enter text and set the shift (the classic is 3).", "Choose the alphabet: Latin, Cyrillic with 33 letters, or both.", "Switch to Decrypt; if the shift is unknown, open “All shifts” and look for the readable line."],
    },
    faq: {
      ru: [
        { q: "Как взломать шифр Цезаря?", a: "Перебором: у русского алфавита всего 32 возможных сдвига, у латинского — 25. Раздел «Все сдвиги» показывает их сразу — осмысленный вариант видно глазом." },
        { q: "Учитывается ли буква Ё?", a: "Да, русский алфавит здесь из 33 букв, Ё стоит после Е. Поэтому со сдвигом 1 «Е» становится «Ё»." },
        { q: "Что происходит с цифрами и знаками?", a: "Они не меняются, как и регистр букв сохраняется." },
      ],
      en: [
        { q: "How do I crack a Caesar cipher?", a: "By brute force: the Latin alphabet has only 25 possible shifts. “All shifts” shows every one — the readable line stands out." },
        { q: "Does it support Cyrillic?", a: "Yes, the Russian alphabet with 33 letters including Ё." },
        { q: "What happens to digits and punctuation?", a: "They stay unchanged, and letter case is preserved." },
      ],
    },
    about: { ru: ["Шифр Цезаря заменяет каждую букву на ту, что стоит на N позиций дальше по алфавиту. По свидетельству Светония, Цезарь использовал сдвиг 3. Сегодня это учебный пример простейшего шифра подстановки."], en: ["The Caesar cipher replaces each letter with the one N places further along the alphabet. According to Suetonius, Caesar used a shift of 3. Today it's the textbook example of a substitution cipher."] },
  },
  {
    slug: "atbash-cipher",
    codec: "atbash",
    dir: "encode",
    icon: "FlipHorizontal",
    options: { alphabet: "both" },
    samples: { ru: "Атбаш", en: "Atbash" },
    name: { ru: "Шифр Атбаш", en: "Atbash cipher" },
    h1: { ru: "Шифр Атбаш онлайн", en: "Atbash cipher" },
    title: { ru: "Шифр Атбаш онлайн — латиница и кириллица", en: "Atbash cipher online — Latin and Cyrillic" },
    description: {
      ru: "Шифр Атбаш онлайн: алфавит переворачивается (А↔Я, Б↔Ю, A↔Z, B↔Y), поэтому одно действие шифрует и расшифровывает. Русский алфавит из 33 букв и латиница.",
      en: "Atbash cipher online: the alphabet is reversed (A↔Z, B↔Y, А↔Я), so the same action encrypts and decrypts. Latin and the 33-letter Russian alphabet.",
    },
    lead: { ru: `«Атбаш» → «${C.atbash("Атбаш")}»: первая буква алфавита меняется на последнюю, вторая — на предпоследнюю.`, en: `“Atbash” → “${C.atbash("Atbash")}”: the first letter swaps with the last, the second with the second-to-last.` },
    keywords: { ru: ["атбаш", "шифр атбаш"], en: ["atbash cipher", "atbash decoder"] },
    howTo: {
      ru: ["Введите текст — Атбаш применится сразу.", "Чтобы расшифровать, вставьте зашифрованный текст: шифр симметричен.", "Выберите алфавит, если нужно менять только латиницу или только кириллицу."],
      en: ["Type text — Atbash is applied instantly.", "To decrypt, paste the ciphertext: the cipher is symmetric.", "Choose the alphabet to transform only Latin or only Cyrillic."],
    },
    faq: {
      ru: [
        { q: "Откуда взялся Атбаш?", a: "Это древнееврейский шифр: название составлено из букв алеф, тав, бет и шин — первой, последней, второй и предпоследней букв алфавита. Он встречается в Книге Иеремии." },
        { q: "Как работает Атбаш с русским алфавитом?", a: "33 буквы ставятся в обратном порядке: А↔Я, Б↔Ю, В↔Э и так далее; Ё участвует на своём месте после Е." },
        { q: "Можно ли его взломать?", a: "Мгновенно: у Атбаша нет ключа. Это головоломка, а не защита." },
      ],
      en: [
        { q: "Where does Atbash come from?", a: "It's an ancient Hebrew cipher named after aleph, tav, bet and shin — the first, last, second and second-to-last letters. It appears in the Book of Jeremiah." },
        { q: "How does it work with Cyrillic?", a: "The 33 letters are reversed: А↔Я, Б↔Ю, В↔Э and so on; Ё keeps its place after Е." },
        { q: "Can it be broken?", a: "Instantly: Atbash has no key. It's a puzzle, not protection." },
      ],
    },
    about: { ru: ["Атбаш — моноалфавитная подстановка с «зеркальным» алфавитом. Здесь он работает для латиницы (26 букв) и русского алфавита (33 буквы) одновременно, сохраняя регистр."], en: ["Atbash is a monoalphabetic substitution with a mirrored alphabet. Here it works for Latin (26 letters) and Russian (33 letters) at once and keeps letter case."] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Таблица замен" : "Substitution table",
        head: locale === "ru" ? ["Буква", "Атбаш"] : ["Letter", "Atbash"],
        rows: [
          [C.LATIN, C.atbash(C.LATIN)],
          [C.CYRILLIC, C.atbash(C.CYRILLIC)],
        ],
        mono: true,
      },
    ],
  },
  {
    slug: "punycode-converter",
    codec: "punycode",
    dir: "encode",
    icon: "Globe",
    popular: true,
    samples: { ru: "пример.рф\nсайт.қаз", en: "münchen.de\nпример.рф" },
    name: { ru: "Punycode-конвертер", en: "Punycode converter" },
    h1: { ru: "Punycode-конвертер: домены .рф и .қаз", en: "Punycode converter" },
    title: { ru: "Punycode онлайн — конвертер доменов .рф и .қаз", en: "Punycode converter online — IDN to ASCII and back" },
    description: {
      ru: "Punycode онлайн: кириллические домены .рф, .қаз и любые IDN в ASCII (xn--) и обратно. пример.рф = xn--e1afmkfd.xn--p1ai. Можно по списку, в том числе e-mail.",
      en: "Punycode converter: internationalized domains to ASCII (xn--) and back. münchen.de = xn--mnchen-3ya.de, пример.рф = xn--e1afmkfd.xn--p1ai. Lists and e-mails too.",
    },
    lead: { ru: `пример.рф → ${domainToAscii("пример.рф")}, сайт.қаз → ${domainToAscii("сайт.қаз")}.`, en: `münchen.de → ${domainToAscii("münchen.de")}, пример.рф → ${domainToAscii("пример.рф")}.` },
    keywords: { ru: ["punycode", "punycode конвертер", "домен рф в punycode", "xn--p1ai", "қаз punycode"], en: ["punycode", "punycode converter", "idn to ascii", "xn-- decoder"] },
    howTo: {
      ru: ["Введите домен или e-mail на кириллице — по одному в строке.", "Переключитесь на «Декодировать», чтобы превратить xn--… обратно в читаемый адрес.", "Скопируйте результат для DNS, SSL-сертификата или конфигурации сервера."],
      en: ["Enter a domain or e-mail, one per line.", "Switch to Decode to turn xn--… back into a readable address.", "Copy the result for DNS, SSL certificates or server configs."],
    },
    faq: {
      ru: [
        { q: "Что такое xn--p1ai?", a: "Это домен .рф в записи Punycode. Для .қаз это xn--80ao21a, для .москва — xn--80adxhks. DNS работает только с ASCII, поэтому кириллические имена хранятся так." },
        { q: "Где нужен Punycode?", a: "В DNS-записях, конфигурации nginx и Apache, SSL-сертификатах, файле hosts и во многих панелях регистраторов — там, где не принимают кириллицу." },
        { q: "Учитывается ли регистр?", a: "Домены не различают регистр, поэтому буквы приводятся к строчным перед кодированием: ПРИМЕР.РФ и пример.рф дают одно и то же." },
      ],
      en: [
        { q: "What is xn--p1ai?", a: "The Russian .рф TLD in Punycode. Kazakhstan's .қаз is xn--80ao21a. DNS only handles ASCII, so internationalized names are stored this way." },
        { q: "Where is Punycode needed?", a: "In DNS records, nginx and Apache configs, SSL certificates, the hosts file and many registrar panels that don't accept Unicode." },
        { q: "Is case preserved?", a: "Domains are case-insensitive, so letters are lowercased before encoding: MÜNCHEN.DE and münchen.de give the same result." },
      ],
    },
    about: {
      ru: ["Punycode (RFC 3492) записывает Unicode-строку только буквами, цифрами и дефисом; перед меткой ставится префикс xn--. Конвертер обрабатывает каждую часть домена отдельно и понимает e-mail. Полная нормализация UTS #46 (например, ß → ss) не выполняется — только перевод в нижний регистр."],
      en: ["Punycode (RFC 3492) writes a Unicode string using only letters, digits and hyphens, with an xn-- prefix per label. The converter handles each label separately and understands e-mail addresses. Full UTS #46 mapping (e.g. ß → ss) isn't applied — only lowercasing."],
    },
    blocks: (locale) => [
      examples(locale, { ru: "Домен|Punycode", en: "Domain|Punycode" }, ["пример.рф", "сайт.қаз", "москва.рф", "münchen.de", "bücher.example", "日本.jp"].map((d) => [d, domainToAscii(d)])),
    ],
  },
];

/* ───────────── non-codec tools ───────────── */

const MORSE_HOW: LL = {
  ru: ["Введите текст на русском, английском или казахском — код Морзе появится сразу.", "Нажмите «Слушать»: сигналы звучат с выбранной скоростью, а индикатор мигает в такт.", "Чтобы расшифровать, переключитесь на «Морзе → текст» и выберите алфавит.", "Скачайте запись в WAV, если нужен звуковой файл."],
  en: ["Type text — the Morse code appears instantly.", "Press Listen: the signal plays at the chosen speed and the light blinks in time.", "To decode, switch to Morse → text and pick the alphabet.", "Download a WAV if you need an audio file."],
};

const otherTools: ToolDef[] = [
  {
    slug: "image-to-base64",
    component: "encode/file",
    icon: "Image",
    popular: true,
    props: { mode: "encode" },
    name: { ru: "Картинка в Base64", en: "Image to Base64" },
    h1: { ru: "Картинка в Base64 онлайн", en: "Image to Base64 converter" },
    title: { ru: "Картинка в Base64 онлайн — data URI для HTML и CSS", en: "Image to Base64 online — data URI for HTML and CSS" },
    description: {
      ru: "Перевод картинки или любого файла в Base64 и data URI: готовые строки для <img> и CSS url(). Большие файлы кодируются частями в браузере, без загрузки.",
      en: "Convert an image or any file to Base64 and a data URI: ready snippets for <img> and CSS url(). Large files are encoded in chunks in your browser, never uploaded.",
    },
    lead: { ru: "Перетащите PNG, JPG, SVG или любой файл — получите data:image/…;base64,… для вставки в HTML или CSS.", en: "Drop a PNG, JPG, SVG or any file and get data:image/…;base64,… for HTML or CSS." },
    keywords: { ru: ["картинка в base64", "изображение в base64", "data uri", "файл в base64"], en: ["image to base64", "file to base64", "data uri generator", "png to base64"] },
    howTo: {
      ru: ["Перетащите файл или нажмите, чтобы выбрать его.", "Оставьте Data URI включённым для вставки в HTML/CSS или выключите, чтобы получить чистый Base64.", "Скопируйте готовый фрагмент «Для <img>» или «Для CSS» либо скачайте результат в .txt."],
      en: ["Drop a file or click to choose one.", "Keep Data URI on for HTML/CSS or switch it off for plain Base64.", "Copy the “For <img>” or “For CSS” snippet, or download the result as .txt."],
    },
    faq: {
      ru: [
        { q: "Когда стоит встраивать картинку в Base64?", a: "Для мелких иконок и фонов до нескольких килобайт — это экономит HTTP-запрос. Большие изображения лучше отдавать файлами: Base64 на треть тяжелее и не кэшируется отдельно." },
        { q: "Есть ли ограничение по размеру?", a: "Файл кодируется частями в фоновом потоке, поэтому большие файлы не подвешивают страницу. На экране показывается начало результата, целиком его можно скопировать или скачать." },
        { q: "Отправляется ли файл на сервер?", a: "Нет, всё происходит в вашем браузере." },
      ],
      en: [
        { q: "When should I inline an image as Base64?", a: "For small icons and backgrounds of a few kilobytes — it saves an HTTP request. Serve large images as files: Base64 is a third bigger and isn't cached separately." },
        { q: "Is there a size limit?", a: "The file is encoded in chunks in a background thread, so large files don't freeze the page. Only the beginning is shown; copy or download the whole result." },
        { q: "Is the file uploaded?", a: "No, everything happens in your browser." },
      ],
    },
    about: { ru: ["Data URI (RFC 2397) встраивает содержимое файла прямо в адрес: data:image/png;base64,iVBORw0…. Его понимают атрибут src, CSS url() и многие редакторы."], en: ["A data URI (RFC 2397) embeds file content right in the address: data:image/png;base64,iVBORw0…. It works in src attributes, CSS url() and many editors."] },
  },
  {
    slug: "base64-to-image",
    component: "encode/file",
    icon: "ImageDown",
    props: { mode: "decode" },
    name: { ru: "Base64 в картинку", en: "Base64 to image" },
    h1: { ru: "Base64 в картинку онлайн", en: "Base64 to image converter" },
    title: { ru: "Base64 в картинку онлайн — просмотр и скачивание файла", en: "Base64 to image online — preview and download the file" },
    description: {
      ru: "Декодирование Base64 или data URI в картинку или файл: превью PNG, JPG, GIF, WebP, SVG, звука и видео, тип определяется по сигнатуре, скачивание в один клик.",
      en: "Decode Base64 or a data URI into an image or file: preview PNG, JPG, GIF, WebP, SVG, audio and video, type detected from the signature, one-click download.",
    },
    lead: { ru: "Вставьте data:image/…;base64,… или просто Base64 — увидите картинку и сможете её скачать.", en: "Paste data:image/…;base64,… or plain Base64 to see the image and download it." },
    keywords: { ru: ["base64 в картинку", "base64 в изображение", "base64 в файл"], en: ["base64 to image", "base64 to png", "base64 to file", "data uri to image"] },
    howTo: {
      ru: ["Вставьте строку Base64 или data URI либо откройте .txt-файл с ней.", "Тип файла определится по data URI или по первым байтам (PNG, JPEG, PDF, ZIP…).", "Посмотрите превью и нажмите «Скачать»."],
      en: ["Paste a Base64 string or data URI, or open a .txt file with it.", "The file type is detected from the data URI or the first bytes (PNG, JPEG, PDF, ZIP…).", "Check the preview and click Download."],
    },
    faq: {
      ru: [
        { q: "Как узнать, что внутри Base64?", a: "Инструмент читает первые байты: PNG начинается с 89 50 4E 47 (iVBORw0 в Base64), JPEG — с FF D8 FF (/9j/), PDF — с %PDF (JVBERi0)." },
        { q: "Картинка не показывается — почему?", a: "Строка могла обрезаться при копировании или это не изображение. Проверьте размер результата и скачайте файл, чтобы открыть его программой." },
        { q: "Подойдёт ли URL-safe Base64?", a: "Да, символы - и _ и отсутствие знаков = не мешают декодированию." },
      ],
      en: [
        { q: "How do I know what's inside?", a: "The tool reads the first bytes: PNG starts with 89 50 4E 47 (iVBORw0 in Base64), JPEG with FF D8 FF (/9j/), PDF with %PDF (JVBERi0)." },
        { q: "The image doesn't show — why?", a: "The string may have been cut while copying, or it isn't an image. Check the result size and download the file to open it in an app." },
        { q: "Does URL-safe Base64 work?", a: "Yes, - and _ characters and missing = padding are fine." },
      ],
    },
    about: { ru: ["Большие строки декодируются частями в фоновом потоке, а превью создаётся через временный адрес blob:, который освобождается при смене данных."], en: ["Large strings are decoded in chunks in a background thread, and the preview uses a temporary blob: URL that is released when the data changes."] },
  },
  {
    slug: "html-entities",
    component: "encode/entities",
    icon: "Table",
    name: { ru: "Таблица HTML-сущностей", en: "HTML entities list" },
    h1: { ru: "Таблица HTML-сущностей", en: "HTML entities list" },
    title: { ru: "HTML-сущности — полная таблица мнемоник и кодов", en: "HTML entities — full list of names and codes" },
    description: {
      ru: `Полная таблица HTML-сущностей: все ${ENTITY_COUNT} именованных ссылок стандарта HTML5 с символом и кодом. Поиск по имени, символу или коду, копирование в один клик.`,
      en: `The full list of HTML entities: all ${ENTITY_COUNT} HTML5 named references with the character and code. Search by name, character or code, copy with one click.`,
    },
    lead: { ru: "Найдите сущность по имени (nbsp), символу (©) или коду (169) и скопируйте её нажатием.", en: "Find an entity by name (nbsp), character (©) or code (169) and copy it with a click." },
    keywords: { ru: ["html сущности", "таблица html символов", "мнемоники html", "&nbsp;"], en: ["html entities", "html entity list", "html special characters", "html symbols"] },
    howTo: {
      ru: ["Введите имя, символ или код в поиск.", "Нажмите на строку — сущность вида &name; скопируется.", "Для обратного перевода текста используйте HTML-декодер."],
      en: ["Type a name, character or code into search.", "Click a row to copy the &name; entity.", "To convert whole texts use the HTML encoder and decoder."],
    },
    faq: {
      ru: [
        { q: "Сколько всего HTML-сущностей?", a: `В стандарте HTML5 ${ENTITY_COUNT} именованных ссылок, из них около сотни старых можно писать без точки с запятой. Любой символ Unicode также записывается числом: &#169; или &#xA9;.` },
        { q: "Чем &nbsp; отличается от пробела?", a: "Это неразрывный пробел U+00A0: браузер не переносит строку в этом месте и не схлопывает несколько таких пробелов в один." },
        { q: "Нужны ли сущности в UTF-8?", a: "Обязательны только &amp; и &lt; (и кавычки в атрибутах). Остальные символы можно писать напрямую, если страница в UTF-8." },
      ],
      en: [
        { q: "How many HTML entities are there?", a: `HTML5 defines ${ENTITY_COUNT} named references; about a hundred legacy ones may omit the semicolon. Any Unicode character can also be written numerically: &#169; or &#xA9;.` },
        { q: "How is &nbsp; different from a space?", a: "It's a non-breaking space U+00A0: browsers don't break lines there and don't collapse several of them into one." },
        { q: "Do I need entities with UTF-8?", a: "Only &amp; and &lt; (and quotes in attributes) are required. Other characters can be typed directly in a UTF-8 page." },
      ],
    },
    about: { ru: ["Таблица построена по официальному списку WHATWG и загружается только на этой странице."], en: ["The table is built from the official WHATWG list and loads only on this page."] },
    blocks: (locale) => [entityTable(locale)],
  },
  {
    slug: "morse-code-translator",
    component: "encode/morse",
    icon: "Radio",
    popular: true,
    name: { ru: "Азбука Морзе — переводчик", en: "Morse code translator" },
    h1: { ru: "Переводчик азбуки Морзе", en: "Morse code translator" },
    title: { ru: "Азбука Морзе онлайн — переводчик со звуком", en: "Morse code translator — text to Morse with sound" },
    description: {
      ru: "Переводчик азбуки Морзе онлайн: русский, английский и казахский текст в код и обратно, звук со скоростью 5–40 слов в минуту, режим Фарнсворта и скачивание WAV.",
      en: "Morse code translator: text to Morse and back for English and Russian, sound at 5–40 WPM, Farnsworth timing, a blinking light and WAV download.",
    },
    lead: { ru: "SOS = ... --- ...; введите текст на русском или английском — код и звук появятся сразу.", en: "SOS = ... --- ...; type text and get the code and sound instantly." },
    keywords: { ru: ["азбука морзе", "морзе переводчик", "азбука морзе онлайн", "код морзе", "sos морзе"], en: ["morse code translator", "morse code", "text to morse", "morse decoder", "morse sound"] },
    howTo: MORSE_HOW,
    faq: {
      ru: [
        { q: "Как пишется SOS азбукой Морзе?", a: "... --- ... — три точки, три тире, три точки. Как служебный сигнал его передают слитно, без пауз между буквами: ...---...; в поле ввода его можно записать как <SOS>." },
        { q: "Совпадают ли русская и английская азбука Морзе?", a: "Коды общие: русские буквы получили коды похожих латинских (А = A, Б = B, В = W…). Поэтому при расшифровке нужно выбрать алфавит — один и тот же код может означать W или В." },
        { q: "Как передать казахские буквы?", a: "Стандартных кодов для Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ и І нет, поэтому они передаются кодами ближайших русских букв (Қ → К, Ә → А…), о чём переводчик предупреждает." },
        { q: "Что такое режим Фарнсворта?", a: "Буквы звучат на полной скорости, а паузы между ними длиннее. Так учатся принимать на слух: ритм буквы запоминается сразу, а времени на расшифровку больше." },
      ],
      en: [
        { q: "How is SOS written in Morse code?", a: "... --- ... — three dots, three dashes, three dots. As a distress prosign it's sent without letter gaps: ...---...; type <SOS> to get that form." },
        { q: "Do English and Russian Morse match?", a: "They share codes: Russian letters took the codes of similar Latin ones (А = A, Б = B, В = W…). That's why decoding needs an alphabet choice — the same code can mean W or В." },
        { q: "What is Farnsworth timing?", a: "Letters are sent at full speed while the gaps between them are longer. It's how people learn to copy by ear: the rhythm of each letter is learned at speed, with more time to recognise it." },
        { q: "How fast is 20 WPM?", a: "At 20 words per minute a dot lasts 60 ms (the PARIS standard: dot = 1.2 / WPM seconds)." },
      ],
    },
    about: {
      ru: ["Точка — одна единица времени, тире — три, пауза внутри буквы — одна, между буквами — три, между словами — семь. Длительность единицы считается по стандарту PARIS: 1,2 / (слов в минуту) секунды. Звук планируется по часам Web Audio, поэтому ритм точный даже при нагрузке на страницу."],
      en: ["A dot is one time unit, a dash three, the gap inside a letter one, between letters three and between words seven. The unit follows the PARIS standard: 1.2 / WPM seconds. Sound is scheduled on the Web Audio clock, so the rhythm stays exact even when the page is busy."],
    },
    blocks: (locale) => [
      examples(locale, { ru: "Текст|Азбука Морзе", en: "Text|Morse code" }, (locale === "ru" ? ["SOS", "Привет", "Я тебя люблю", "73", "Алматы"] : ["SOS", "Hello", "I love you", "73", "CQ"]).map((x) => [x, encodeMorse(x).text])),
    ],
  },
  {
    slug: "morse-code-chart",
    component: "encode/morse-chart",
    icon: "Table",
    name: { ru: "Таблица азбуки Морзе", en: "Morse code chart" },
    h1: { ru: "Таблица азбуки Морзе", en: "Morse code chart" },
    title: { ru: "Таблица азбуки Морзе — русский и английский алфавит", en: "Morse code chart — letters, numbers and punctuation" },
    description: {
      ru: "Таблица азбуки Морзе: русский и латинский алфавит, цифры 0–9, знаки препинания, служебные сигналы SOS, AR, SK и казахские буквы. Нажмите на знак, чтобы услышать.",
      en: "Morse code chart: the Latin and Russian alphabets, digits 0–9, punctuation and prosigns (SOS, AR, SK). Click any character to hear it.",
    },
    lead: { ru: "Все коды на одной странице: А ·−, Б −···, В ·−− … 0 −−−−−; нажмите, чтобы прослушать.", en: "Every code on one page: A ·−, B −···, C −·−· … 0 −−−−−; click to listen." },
    keywords: { ru: ["таблица азбуки морзе", "азбука морзе алфавит", "азбука морзе цифры"], en: ["morse code chart", "morse code alphabet", "morse code numbers"] },
    howTo: {
      ru: ["Найдите нужную букву в таблице.", "Нажмите на неё, чтобы услышать ритм.", "Для перевода целых фраз откройте переводчик азбуки Морзе."],
      en: ["Find the character in the chart.", "Click it to hear the rhythm.", "To translate whole phrases open the Morse code translator."],
    },
    faq: {
      ru: [
        { q: "Как быстро выучить азбуку Морзе?", a: "Учите на слух, а не по таблице: запоминайте ритм буквы целиком (например, Щ — «щу-ка-жи-вá»). Помогает режим Фарнсворта в переводчике." },
        { q: "Как в азбуке Морзе обозначаются цифры?", a: "Каждая цифра — пять знаков: 1 = ·−−−−, 5 = ·····, 0 = −−−−−. Число точек или тире подсказывает цифру." },
        { q: "Какие у Ъ и Ь коды?", a: "Ь — −··− (как X), Ъ — −−·−−. На практике часто передают Ь вместо Ъ." },
      ],
      en: [
        { q: "How can I learn Morse code quickly?", a: "Learn by ear, not by chart: remember each letter's rhythm as a whole. Farnsworth timing in the translator helps." },
        { q: "How are digits written?", a: "Each digit has five elements: 1 = ·−−−−, 5 = ·····, 0 = −−−−−. The count of dots or dashes gives the digit." },
        { q: "What are prosigns?", a: "Procedural signals sent as one character without gaps: AR (end of message), SK (end of contact), BT (break), SOS (distress)." },
      ],
    },
    about: { ru: ["Латинская часть и знаки препинания соответствуют рекомендации ITU-R M.1677-1, русская — традиционной отечественной таблице. Для казахских букв стандартных кодов нет, поэтому показаны коды ближайших русских букв."], en: ["The Latin letters and punctuation follow ITU-R M.1677-1; the Russian table is the traditional one. Kazakh-specific letters have no standard codes, so the codes of the closest Russian letters are shown."] },
    blocks: (locale) => [
      {
        type: "facts",
        title: locale === "ru" ? "Тайминг" : "Timing",
        rows:
          locale === "ru"
            ? [["Точка", "1 единица"], ["Тире", "3 единицы"], ["Пауза в букве", "1 единица"], ["Между буквами", "3 единицы"], ["Между словами", "7 единиц"], ["Единица при 20 сл/мин", "60 мс"]]
            : [["Dot", "1 unit"], ["Dash", "3 units"], ["Gap inside a letter", "1 unit"], ["Between letters", "3 units"], ["Between words", "7 units"], ["Unit at 20 WPM", "60 ms"]],
      },
    ],
  },
  {
    slug: "nato-phonetic-alphabet",
    component: "encode/spell",
    icon: "Mic",
    props: { alphabet: "nato", sample: { ru: "RC 1507", en: "RC 1507" } },
    name: { ru: "Фонетический алфавит NATO", en: "NATO phonetic alphabet" },
    h1: { ru: "Фонетический алфавит NATO", en: "NATO phonetic alphabet" },
    title: { ru: "Фонетический алфавит NATO — Alfa, Bravo, Charlie", en: "NATO phonetic alphabet — Alfa, Bravo, Charlie converter" },
    description: {
      ru: "Фонетический алфавит NATO (ICAO): Alfa, Bravo, Charlie… Zulu и цифры с произношением. Введите текст — получите его по буквам для диктовки по телефону или рации.",
      en: "The NATO (ICAO) phonetic alphabet: Alfa, Bravo, Charlie… Zulu plus digits with pronunciation. Type text to spell it out for phone or radio.",
    },
    lead: { ru: "A — Alfa, B — Bravo, C — Charlie… Z — Zulu; введите слово, чтобы продиктовать его по буквам.", en: "A — Alfa, B — Bravo, C — Charlie… Z — Zulu; type a word to spell it out." },
    keywords: { ru: ["фонетический алфавит nato", "alfa bravo charlie", "натовский алфавит"], en: ["nato phonetic alphabet", "phonetic alphabet", "alfa bravo charlie", "spelling alphabet"] },
    howTo: {
      ru: ["Введите номер заказа, код бронирования или фамилию латиницей.", "Прочитайте результат вслух: каждое слово — одна буква.", "Цифры произносятся по-английски: Nine иногда говорят как Niner."],
      en: ["Type an order number, booking code or name.", "Read the result aloud: each word is one letter.", "Pilots say Niner for 9, Tree for 3 and Fife for 5."],
    },
    faq: {
      ru: [
        { q: "Почему Alfa и Juliett пишутся так странно?", a: "Так закреплено в стандарте ICAO: Alfa без «ph», чтобы не читали «ф», а Juliett с двумя t, чтобы французы не глотали окончание." },
        { q: "Где используется алфавит NATO?", a: "В авиации, у моряков, военных, в службах поддержки и при диктовке кодов бронирования по телефону." },
        { q: "Есть ли русский вариант?", a: "Да, русский фонетический алфавит с именами: Анна, Борис, Василий… Он на отдельной странице." },
      ],
      en: [
        { q: "Why are Alfa and Juliett spelled that way?", a: "That's the ICAO standard: Alfa without “ph” so it isn't read as “f”, and Juliett with two t's so French speakers don't drop the ending." },
        { q: "Who uses the NATO alphabet?", a: "Aviation, maritime and military radio, support desks and anyone dictating booking codes by phone." },
        { q: "Is there a Russian version?", a: "Yes, the Russian spelling alphabet uses names: Анна, Борис, Василий… It has its own page." },
      ],
    },
    about: { ru: ["Алфавит ICAO принят в 1956 году; он же используется NATO и ITU. Слова подобраны так, чтобы их однозначно понимали носители разных языков даже при плохой связи."], en: ["The ICAO alphabet was adopted in 1956 and is also used by NATO and the ITU. The words were chosen to be understood by speakers of different languages even over a poor line."] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Алфавит NATO" : "NATO alphabet",
        head: locale === "ru" ? ["Знак", "Слово", "Произношение"] : ["Character", "Code word", "Pronunciation"],
        rows: Object.keys(NATO).map((k) => [k, NATO[k], NATO_SAY[k]]),
      },
    ],
  },
  {
    slug: "russian-phonetic-alphabet",
    component: "encode/spell",
    icon: "Mic",
    props: { alphabet: "russian", sample: { ru: "Жуков", en: "Жуков" } },
    name: { ru: "Русский фонетический алфавит", en: "Russian phonetic alphabet" },
    h1: { ru: "Русский фонетический алфавит", en: "Russian phonetic alphabet" },
    title: { ru: "Русский фонетический алфавит — Анна, Борис, Василий", en: "Russian phonetic alphabet — Анна, Борис, Василий" },
    description: {
      ru: "Русский фонетический алфавит для диктовки по буквам: Анна, Борис, Василий, Григорий… Яков. Введите фамилию или адрес — получите диктовку для телефона или рации.",
      en: "The Russian spelling alphabet for dictating letter by letter: Анна, Борис, Василий, Григорий… Яков. Type a name or address to spell it out.",
    },
    lead: { ru: "А — Анна, Б — Борис, В — Василий… Я — Яков; введите слово, чтобы продиктовать его по буквам.", en: "А — Анна, Б — Борис, В — Василий… Я — Яков; type a word to spell it out." },
    keywords: { ru: ["русский фонетический алфавит", "анна борис василий", "диктовка по буквам"], en: ["russian phonetic alphabet", "russian spelling alphabet"] },
    howTo: {
      ru: ["Введите фамилию, название улицы или код.", "Диктуйте: «Жуков — Женя, Ульяна, Константин, Ольга, Василий».", "Латинские буквы автоматически передаются словами NATO."],
      en: ["Type a surname, street name or code.", "Dictate: “Жуков — Женя, Ульяна, Константин, Ольга, Василий”.", "Latin letters are spelled with NATO words automatically."],
    },
    faq: {
      ru: [
        { q: "Откуда этот алфавит?", a: "Это традиционная русская радиотелефонная азбука с личными именами, которой пользуются связисты, диспетчеры и операторы колл-центров." },
        { q: "Как продиктовать Й, Ъ и Ь?", a: "Й — «Иван краткий», Ъ — «твёрдый знак», Ь — «мягкий знак». Ы иногда называют «еры»." },
        { q: "Есть ли варианты слов?", a: "Да: К — «Константин» или «Киловатт», С — «Семён» или «Сергей». Здесь используется самый распространённый вариант." },
      ],
      en: [
        { q: "Where does this alphabet come from?", a: "It's the traditional Russian radiotelephony spelling alphabet based on first names, used by signallers, dispatchers and call centres." },
        { q: "How are Й, Ъ and Ь spelled?", a: "Й is “Иван краткий”, Ъ “твёрдый знак”, Ь “мягкий знак”. Ы is sometimes called “еры”." },
        { q: "Are there variants?", a: "Yes: К can be “Константин” or “Киловатт”, С “Семён” or “Сергей”. The most common option is used here." },
      ],
    },
    about: { ru: ["Буква Ё диктуется как Е («Елена»), если не нужно подчеркнуть разницу. Для смешанного текста латиница передаётся словами алфавита NATO."], en: ["Ё is spelled like Е (“Елена”) unless the difference matters. In mixed text, Latin letters use NATO words."] },
    blocks: (locale) => [
      {
        type: "table",
        title: locale === "ru" ? "Русский фонетический алфавит" : "Russian spelling alphabet",
        head: locale === "ru" ? ["Буква", "Слово"] : ["Letter", "Word"],
        rows: Object.entries(RUSSIAN).map(([k, v]) => [k, v]),
      },
    ],
  },
];

const tools: ToolDef[] = [
  ...specs.map(codecTool),
  ...numPages().map(codecTool),
  ...basePair("base32", "base32", "Base32", { alphabet: { ru: "A–Z и 2–7 (32 символа)", en: "A–Z and 2–7 (32 characters)" }, use: { ru: "ключи TOTP, адреса Tor, DNSSEC", en: "TOTP secrets, Tor addresses, DNSSEC" }, ratio: { ru: "5 байт → 8 символов, +60 %", en: "5 bytes → 8 characters, +60%" } }).map(codecTool),
  ...basePair("base58", "base58", "Base58", { alphabet: { ru: "58 символов без 0, O, I, l", en: "58 characters without 0, O, I, l" }, use: { ru: "адреса Bitcoin, IPFS, Solana", en: "Bitcoin addresses, IPFS, Solana" }, ratio: { ru: "≈ +37 %", en: "≈ +37%" } }).map(codecTool),
  ...basePair("base85", "ascii85", "Ascii85", { alphabet: { ru: "85 символов от ! до u", en: "85 characters from ! to u" }, use: { ru: "PDF, PostScript, Git, ZeroMQ (Z85)", en: "PDF, PostScript, Git, ZeroMQ (Z85)" }, ratio: { ru: "4 байта → 5 символов, +25 %", en: "4 bytes → 5 characters, +25%" } }, { variant: "ascii85", delimiters: true }).map(codecTool),
  ...escapeSpecs.map(codecTool),
  ...cipherSpecs.map(codecTool),
  ...otherTools,
];

const RELATED: Record<string, string[]> = {
  "base64-encode": ["base64-decode", "image-to-base64", "url-encode"],
  "base64-decode": ["base64-encode", "base64-to-image"],
  "image-to-base64": ["base64-to-image", "base64-encode"],
  "base64-to-image": ["image-to-base64", "base64-decode"],
  "url-encode": ["url-decode", "punycode-converter", "base64-encode"],
  "url-decode": ["url-encode", "punycode-converter"],
  "html-encode": ["html-decode", "html-entities"],
  "html-decode": ["html-encode", "html-entities"],
  "html-entities": ["html-encode", "html-decode", "unicode-escape"],
  "text-to-binary": ["binary-to-text", "text-to-hex"],
  "binary-to-text": ["text-to-binary", "hex-to-text"],
  "text-to-hex": ["hex-to-text", "text-to-binary"],
  "hex-to-text": ["text-to-hex", "binary-to-text"],
  "morse-code-translator": ["morse-code-chart", "nato-phonetic-alphabet"],
  "morse-code-chart": ["morse-code-translator", "russian-phonetic-alphabet"],
  "nato-phonetic-alphabet": ["russian-phonetic-alphabet", "morse-code-translator"],
  "russian-phonetic-alphabet": ["nato-phonetic-alphabet", "morse-code-translator"],
  "caesar-cipher": ["rot13", "atbash-cipher"],
  rot13: ["caesar-cipher", "atbash-cipher"],
  "atbash-cipher": ["caesar-cipher", "rot13"],
  "unicode-escape": ["unicode-unescape", "json-escape", "html-entities"],
  "unicode-unescape": ["unicode-escape", "json-unescape"],
  "json-escape": ["json-unescape", "unicode-escape"],
  "json-unescape": ["json-escape", "unicode-unescape"],
  "punycode-converter": ["url-encode", "url-decode"],
};

export const encodeSection = withRelated(
  defineToolSection({
    id: "encode",
    name: { ru: "Кодирование", en: "Encoding" },
    description: {
      ru: "Base64, URL, HTML-сущности, двоичный код, азбука Морзе, Punycode и другие кодировки",
      en: "Base64, URL, HTML entities, binary, Morse code, Punycode and other encodings",
    },
    icon: "Binary",
    hue: HUE,
    category: "dev",
    order: 5,
    tools,
  }),
  (segs) => RELATED[segs[0]] ?? [],
);

registerTools("encode", HUE, tools);
