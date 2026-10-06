import { tr, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import { CAT_BY_ID, CAT_BY_SLUG, CATS, compressibleOf, ENTRIES, ENTRY_BY_EXT, isTextual, MIME_DB_SOURCE, type MimeEntry } from "./data";
import type { TypeSource } from "./data/types";
import type { MimeRow } from "./MimeSearch";

const ID = "mime";
const HUE = 220;
const ICON = "FileCode";
const NAME = { ru: "MIME-типы", en: "MIME types" };
const DESC = {
  ru: "Справочник MIME-типов: какой Content-Type у файла по расширению, как настроить его на сервере и как определить формат файла по содержимому.",
  en: "MIME type reference: the Content-Type of a file by extension, how to configure it on a server and how to detect a file's format by content.",
};
const DETECT = "detect";

const L = (l: Locale) => (l === "ru" ? 0 : 1);
const fit = (variants: string[], max = 60) => variants.find((v) => v.length <= max) ?? variants[variants.length - 1];
const describe = (base: string, tails: string[]) => {
  const tail = tails.find((t) => `${base} ${t}`.length <= 160);
  const out = tail ? `${base} ${tail}` : base;
  return out.length > 160 ? out.slice(0, 157).replace(/[\s,;:—-]+\S*$/, "") + "…" : out;
};
/** Leading sentences of a text, at least `min` characters long. */
function leadText(s: string, min = 70): string {
  const parts = s.split(/(?<=[.!?])\s+(?=[«"(]?[\p{Lu}\d])/u);
  let out = "";
  for (const p of parts) {
    out = out ? `${out} ${p}` : p;
    if (out.length >= min) break;
  }
  return out;
}
const lower1 = (s: string) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

const SRC_LABEL: Record<TypeSource | "", { ru: string; en: string }> = {
  iana: { ru: "реестр IANA", en: "IANA registry" },
  apache: { ru: "mime.types Apache (не IANA)", en: "Apache mime.types (not IANA)" },
  nginx: { ru: "mime.types nginx (не IANA)", en: "nginx mime.types (not IANA)" },
  fd: { ru: "freedesktop shared-mime-info (не IANA)", en: "freedesktop shared-mime-info (not IANA)" },
  common: { ru: "распространённый, не зарегистрирован", en: "common, not registered" },
  "": { ru: "распространённый, не зарегистрирован", en: "common, not registered" },
};

const home = (l: Locale): Crumb => ({ name: ui(l).home, path: [] });
const hubCrumb = (l: Locale): Crumb => ({ name: l === "ru" ? "MIME-типы" : "MIME types", path: [ID] });

function extLink(e: MimeEntry, l: Locale): LinkItem {
  return { path: [ID, e.ext], label: `.${e.ext}`, hint: `${e.name[L(l)]} — ${e.primary.type}` };
}
function catLink(slug: string, l: Locale): LinkItem {
  const c = CAT_BY_SLUG.get(slug)!;
  return { path: [ID, c.slug], label: c[l].name, hint: ENTRIES.filter((e) => e.cat === c.id).slice(0, 6).map((e) => `.${e.ext}`).join(" "), icon: c.icon, hue: HUE };
}
const detectLink = (l: Locale): LinkItem => ({ path: [ID, DETECT], label: l === "ru" ? "Определить тип файла по содержимому" : "Detect file type by content", hint: l === "ru" ? "Проверка по сигнатуре прямо в браузере" : "Checks the signature right in your browser", icon: "FileSearch", hue: HUE });
const rows = (list: MimeEntry[]): MimeRow[] => list.map((e) => ({ e: e.ext, t: e.primary.type, c: CAT_BY_ID.get(e.cat)!.slug }));

const POPULAR = ["json", "js", "mjs", "css", "html", "svg", "webp", "avif", "png", "jpg", "pdf", "docx", "xlsx", "zip", "mp4", "webm", "mp3", "woff2", "wasm", "csv", "xml", "yaml", "apk", "heic"];

/* ───────────── hub ───────────── */

const MISTAKES: [string, string, { ru: string; en: string }][] = [
  ["image/jpg", "image/jpeg", { ru: "Типа image/jpg не существует", en: "image/jpg doesn't exist" }],
  ["application/javascript", "text/javascript", { ru: "RFC 9239 (2022) вернул text/javascript", en: "RFC 9239 (2022) made text/javascript official" }],
  ["text/json", "application/json", { ru: "JSON — application/json, без charset", en: "JSON is application/json, no charset" }],
  ["audio/mp3", "audio/mpeg", { ru: "Зарегистрирован только audio/mpeg", en: "Only audio/mpeg is registered" }],
  ["image/svg", "image/svg+xml", { ru: "Без +xml браузер не покажет SVG", en: "Without +xml browsers won't render SVG" }],
  ["application/x-zip-compressed", "application/zip", { ru: "x-zip-compressed присылает старая Windows", en: "Old Windows sends x-zip-compressed" }],
  ["font/x-woff", "font/woff2", { ru: "С 2017 года есть официальные font/*", en: "Official font/* types exist since 2017" }],
  ["text/xml", "application/xml", { ru: "text/xml без charset считается ASCII", en: "text/xml without charset defaults to ASCII" }],
];

function hubPage(l: Locale): PageModel {
  const ru = l === "ru";
  const n = ENTRIES.length;
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? "MIME-типы файлов — таблица Content-Type по расширению" : "MIME Types List — Content-Type by File Extension",
    h1: ru ? "MIME-типы файлов" : "MIME types",
    description: ru
      ? `Справочник MIME-типов для ${n} ${plural("ru", n, ["расширения", "расширений", "расширений"])}: image/webp, application/json, DOCX и другие. Поиск по расширению и типу, сигнатуры файлов, настройка серверов.`
      : `MIME type reference for ${n} extensions: image/webp, application/json, DOCX and more. Search by extension or type, file signatures and server configuration.`,
    lead: ru ? "Введите расширение или MIME-тип — поиск работает в обе стороны, у каждого формата есть страница с настройкой сервера." : "Type an extension or a MIME type — search works both ways, and every format has a page with server setup.",
    breadcrumbs: [home(l)],
    tool: { id: "mime/search", props: { items: rows(ENTRIES), cats: CATS.map((c) => [c.slug, c[l].name]) } },
    topBlocks: [
      { type: "links", title: ru ? "Категории" : "Categories", style: "cards", items: [...CATS.map((c) => catLink(c.slug, l)), detectLink(l)] },
      { type: "links", title: ru ? "Популярные расширения" : "Popular extensions", style: "chips", items: POPULAR.map((e) => extLink(ENTRY_BY_EXT.get(e)!, l)) },
    ],
    blocks: [
      {
        type: "text",
        title: ru ? "Что такое MIME-тип" : "What a MIME type is",
        paragraphs: ru
          ? [
              "MIME-тип (media type) — метка формата вида тип/подтип: image/png, application/json, text/html. Сервер передаёт её в заголовке Content-Type, и именно по ней браузер решает, показать файл, выполнить скрипт или предложить скачивание, — расширение в адресе браузер не учитывает.",
              `Типы регистрирует IANA; веб-серверы и фреймворки берут соответствие «расширение → тип» из своих таблиц. Здесь используется база mime-db (${MIME_DB_SOURCE.replace("mime-db ", "версия ")}) — на ней работают Express и множество других Node.js-пакетов, — дополненная пометками, какие типы официальные, а какие нет.`,
            ]
          : [
              "A MIME type (media type) is a format label of the form type/subtype: image/png, application/json, text/html. Servers send it in the Content-Type header, and that's what browsers use to decide whether to display a file, run a script or offer a download — the URL's extension doesn't matter.",
              `IANA registers the types; web servers and frameworks map extensions to types using their own tables. This reference uses the mime-db database (${MIME_DB_SOURCE.replace("mime-db ", "version ")}) behind Express and many other Node.js packages, annotated with which types are official and which aren't.`,
            ],
      },
      {
        type: "table",
        title: ru ? "Частые ошибки в Content-Type" : "Common Content-Type mistakes",
        head: ru ? ["Неправильно", "Правильно", "Почему"] : ["Wrong", "Right", "Why"],
        mono: false,
        rows: MISTAKES.map(([w, r, why]) => [w, r, why[l]]),
      },
    ],
    faq: ru
      ? [
          { q: "Как узнать MIME-тип файла?", a: "По расширению — через поиск выше. По содержимому — загрузите файл в инструмент «Определить тип файла»: он прочитает сигнатуру (первые байты) прямо в браузере. В Linux и macOS то же делает команда file --mime-type имя_файла." },
          { q: "Что будет, если отдать неверный Content-Type?", a: "Браузер может не применить CSS, не выполнить JavaScript-модуль, показать картинку как текст или скачать страницу вместо показа. С заголовком X-Content-Type-Options: nosniff браузер строго следует типу и не пытается угадать." },
          { q: "Какой тип использовать для неизвестных двоичных файлов?", a: "application/octet-stream — «просто байты». Браузер предложит сохранить такой файл, не пытаясь его открыть." },
          { q: "Нужен ли charset в Content-Type?", a: "Для текстовых типов — да: text/html; charset=utf-8, иначе браузер может неверно угадать кодировку и кириллица превратится в «кракозябры». Для JSON и двоичных форматов charset не указывают." },
        ]
      : [
          { q: "How do I find a file's MIME type?", a: "By extension — use the search above. By content — drop the file into the “Detect file type” tool, which reads its signature (first bytes) in your browser. On Linux and macOS, file --mime-type filename does the same." },
          { q: "What happens with a wrong Content-Type?", a: "Browsers may skip CSS, refuse to run a JavaScript module, show an image as text or download a page instead of displaying it. With X-Content-Type-Options: nosniff the browser follows the type strictly and doesn't guess." },
          { q: "Which type should unknown binary files use?", a: "application/octet-stream — “just bytes”. The browser offers to save such a file instead of opening it." },
          { q: "Do I need a charset in Content-Type?", a: "For text types, yes: text/html; charset=utf-8, or the browser may guess the encoding wrong. JSON and binary formats don't take a charset." },
        ],
    related: [detectLink(l)],
    schemaType: "CollectionPage",
    icon: ICON,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── detect tool ───────────── */

function detectPage(l: Locale): PageModel {
  const ru = l === "ru";
  return {
    path: [ID, DETECT],
    sectionId: ID,
    kind: "tool",
    title: ru ? "Определить тип файла по содержимому онлайн" : "File Type Checker — Detect Format by Magic Bytes",
    h1: ru ? "Определить тип файла по содержимому" : "Detect file type by content",
    description: ru
      ? "Узнайте настоящий формат файла по сигнатуре: PNG, JPEG, PDF, DOCX, ZIP, MP4, HEIC и ещё 100+ форматов. Проверка в браузере, файл никуда не загружается."
      : "Find a file's real format from its signature: PNG, JPEG, PDF, DOCX, ZIP, MP4, HEIC and 100+ more. The check runs in your browser; nothing is uploaded.",
    lead: ru ? "Перетащите файл — формат определится по первым байтам, даже если расширение неправильное или его нет." : "Drop a file — its format is detected from the first bytes, even if the extension is wrong or missing.",
    breadcrumbs: [home(l), hubCrumb(l)],
    tool: { id: "mime/detect", props: { known: ENTRIES.map((e) => e.ext) } },
    howTo: ru
      ? [
          "Перетащите один или несколько файлов в область выше или нажмите на неё, чтобы выбрать.",
          "Инструмент прочитает первые и последние 64 КБ каждого файла прямо в браузере.",
          "Сравните определённый формат с расширением: зелёная метка — всё совпадает, жёлтая — расширение неверное.",
          "Перейдите на страницу формата, чтобы узнать его MIME-тип и настройку сервера.",
        ]
      : [
          "Drop one or more files onto the area above, or click it to choose.",
          "The tool reads the first and last 64 KB of each file in your browser.",
          "Compare the detected format with the extension: green means they match, yellow means the extension is wrong.",
          "Open the format's page to see its MIME type and server setup.",
        ],
    faq: ru
      ? [
          { q: "Файл загружается на сервер?", a: "Нет. Файл читается локально через File API браузера, сетевых запросов инструмент не делает — можно проверять и конфиденциальные документы." },
          { q: "Как работает определение по сигнатуре?", a: "Большинство форматов начинается с фиксированных байтов — «магического числа»: PNG — 89 50 4E 47, PDF — %PDF, ZIP — PK. Для контейнеров инструмент смотрит глубже: внутри ZIP ищет word/ или xl/, чтобы отличить DOCX от XLSX, а в MP4 читает бренд ftyp, чтобы распознать HEIC, AVIF или MOV." },
          { q: "Почему формат определён «по контейнеру»?", a: "Некоторые форматы нельзя различить по началу файла: старые DOC, XLS, PPT и MSI — это один и тот же контейнер OLE2. В таких случаях инструмент честно показывает общий контейнер." },
          { q: "Что делать, если формат не распознан?", a: "Файл может быть зашифрован, повреждён или записан в редком формате. Посмотрите первые байты (они показаны в карточке) — по ним формат иногда можно найти в списке сигнатур." },
        ]
      : [
          { q: "Is the file uploaded?", a: "No. It's read locally through the browser File API and the tool makes no network requests, so confidential documents are safe to check." },
          { q: "How does signature detection work?", a: "Most formats start with fixed bytes, a “magic number”: PNG is 89 50 4E 47, PDF is %PDF, ZIP is PK. For containers the tool looks deeper: inside a ZIP it looks for word/ or xl/ to tell DOCX from XLSX, and in MP4 it reads the ftyp brand to recognise HEIC, AVIF or MOV." },
          { q: "Why is a format detected “by container”?", a: "Some formats can't be told apart by their first bytes: old DOC, XLS, PPT and MSI all share the OLE2 container. In such cases the tool honestly reports the container." },
          { q: "What if the format isn't recognised?", a: "The file may be encrypted, damaged or in a rare format. Look at the first bytes shown on the card — they can help identify it from signature lists." },
        ],
    blocks: [
      {
        type: "text",
        title: ui(l).about,
        paragraphs: ru
          ? [
              "Расширение файла — всего лишь часть имени, его легко изменить. Настоящий формат записан в самих данных: у большинства форматов первые байты фиксированы. Инструмент проверяет более 100 сигнатур и распознаёт контейнеры — документы Office, APK, EPUB, HEIC, AVIF, MOV.",
              "Пригодится, когда файл пришёл без расширения, картинка «не открывается», вложение выглядит подозрительно (например, «документ» на самом деле программа) или нужно проверить, что сервер отдаёт то, что заявлено.",
            ]
          : [
              "A file extension is just part of the name and easy to change. The real format is in the data itself: most formats start with fixed bytes. The tool checks over 100 signatures and understands containers — Office documents, APK, EPUB, HEIC, AVIF, MOV.",
              "Useful when a file arrives without an extension, an image “won't open”, an attachment looks suspicious (a “document” that's really a program) or you need to verify what a server delivers.",
            ],
      },
    ],
    related: [{ path: [ID], label: ru ? "MIME-типы файлов" : "MIME types", hint: tr(DESC, l), icon: ICON, hue: HUE }],
    schemaType: "WebApplication",
    icon: "FileSearch",
    hue: HUE,
  };
}

/* ───────────── category pages ───────────── */

function catPage(slug: string, l: Locale): PageModel {
  const c = CAT_BY_SLUG.get(slug)!;
  const tx = c[l];
  const ru = l === "ru";
  const list = ENTRIES.filter((e) => e.cat === c.id);
  const unreg = list.filter((e) => e.primary.src !== "iana");
  return {
    path: [ID, slug],
    sectionId: ID,
    kind: "hub",
    title: tx.title,
    h1: tx.h1,
    description: tx.desc,
    lead: tx.lead,
    breadcrumbs: [home(l), hubCrumb(l)],
    tool: { id: "mime/search", props: { items: rows(list), only: slug } },
    topBlocks: [
      { type: "links", title: ru ? "Все форматы категории" : "All formats in this category", style: "chips", items: list.map((e) => extLink(e, l)) },
      { type: "links", title: ru ? "Другие категории" : "Other categories", style: "chips", items: CATS.filter((x) => x.slug !== slug).map((x) => ({ ...catLink(x.slug, l), icon: undefined, hue: undefined })) },
    ],
    faq: ru
      ? [
          { q: `Сколько форматов в категории «${tx.name}»?`, a: `${list.length} ${plural("ru", list.length, ["формат", "формата", "форматов"])}. Для ${list.length - unreg.length} из них рекомендуемый тип зарегистрирован в IANA${unreg.length ? `, для остальных (${unreg.slice(0, 8).map((e) => `.${e.ext}`).join(", ")}${unreg.length > 8 ? "…" : ""}) используются распространённые незарегистрированные типы` : ""}.` },
          { q: "Как проверить, какой тип отдаёт сервер?", a: "Выполните curl -sI https://сайт/файл и посмотрите заголовок Content-Type, или откройте вкладку «Сеть» в инструментах разработчика браузера." },
        ]
      : [
          { q: `How many formats are in “${tx.name}”?`, a: `${list.length}. For ${list.length - unreg.length} of them the recommended type is IANA-registered${unreg.length ? `; the rest (${unreg.slice(0, 8).map((e) => `.${e.ext}`).join(", ")}${unreg.length > 8 ? "…" : ""}) use common unregistered types` : ""}.` },
          { q: "How do I check which type a server sends?", a: "Run curl -sI https://site/file and look at the Content-Type header, or open the Network tab in your browser's developer tools." },
        ],
    related: [detectLink(l)],
    schemaType: "CollectionPage",
    icon: c.icon,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── extension pages ───────────── */

function extPage(e: MimeEntry, l: Locale): PageModel {
  const ru = l === "ru";
  const i = L(l);
  const c = CAT_BY_ID.get(e.cat)!;
  const type = e.primary.type;
  const alts = e.types.filter((t) => t.type !== type).map((t) => t.type);
  const textual = isTextual(type);
  const comp = compressibleOf(e.primary);
  const name = e.name[i];

  const facts: [string, string][] = [
    [ru ? "Расширение" : "Extension", `.${e.ext}`],
    [ru ? "MIME-тип" : "MIME type", type],
    [ru ? "Формат" : "Format", name],
    [ru ? "Где определён тип" : "Type source", SRC_LABEL[e.primary.src][l]],
    [ru ? "Категория" : "Category", c[l].name],
    [ru ? "Сжимать gzip/brotli при отдаче" : "Compress with gzip/brotli", comp ? (ru ? "да" : "yes") : ru ? "нет — данные уже сжаты или двоичные" : "no — already compressed or binary"],
  ];
  if (alts.length) facts.splice(2, 0, [ru ? "Другие типы" : "Other types", alts.join(", ")]);
  if (textual) facts.push([ru ? "Кодировка" : "Charset", ru ? "указывайте charset=utf-8" : "send charset=utf-8"]);
  if (e.magic.length) facts.push([ru ? "Сигнатура" : "Signature", `${e.magic[0].hex}${e.magic[0].offset ? (ru ? ` (смещение ${e.magic[0].offset})` : ` (offset ${e.magic[0].offset})`) : ""}`]);

  const blocks: Block[] = [
    { type: "facts", title: ru ? `Формат .${e.ext} коротко` : `.${e.ext} at a glance`, rows: facts },
    { type: "text", title: ru ? `Что за формат .${e.ext}` : `What .${e.ext} is`, paragraphs: [e.d[i]] },
  ];
  if (e.types.length > 1)
    blocks.push({
      type: "table",
      title: ru ? `Все MIME-типы для .${e.ext}` : `All MIME types for .${e.ext}`,
      head: ru ? ["Тип", "Источник"] : ["Type", "Source"],
      rows: e.types.map((t) => [t.type + (t.type === type ? (ru ? " — рекомендуется" : " — recommended") : ""), SRC_LABEL[t.src][l]]),
    });
  if (e.magic.length)
    blocks.push({
      type: "table",
      title: ru ? "Сигнатура файла (магические байты)" : "File signature (magic bytes)",
      head: ru ? ["Байты (hex)", "Смещение", "Примечание"] : ["Bytes (hex)", "Offset", "Note"],
      rows: e.magic.map((m) => [m.hex, m.offset < 0 ? (ru ? `${-m.offset} байт до конца` : `${-m.offset} bytes from end`) : String(m.offset), m.note ? m.note[i] : ""]),
    });

  const seen = new Set<string>([e.ext]);
  const chips: MimeEntry[] = [];
  const push = (x?: MimeEntry) => {
    if (x && !seen.has(x.ext)) {
      seen.add(x.ext);
      chips.push(x);
    }
  };
  (e.related ?? []).forEach((r) => push(ENTRY_BY_EXT.get(r)));
  ENTRIES.filter((x) => x.cat === e.cat).forEach(push);
  POPULAR.forEach((p) => push(ENTRY_BY_EXT.get(p)));

  const faq: QA[] = ru
    ? [
        { q: `Какой MIME-тип у файлов .${e.ext}?`, a: `${type}.${alts.length ? ` Также встречаются: ${alts.join(", ")} — но для отдачи с сервера лучше использовать ${type}.` : ""}` },
        { q: `Как настроить Content-Type для .${e.ext} в nginx?`, a: `Добавьте в /etc/nginx/mime.types внутри блока types { } строку «${type} ${e.ext};» и перезагрузите конфигурацию: nginx -s reload. В Apache то же делает директива AddType ${type} .${e.ext}.` },
        { q: `Нужно ли сжимать .${e.ext} при отдаче?`, a: comp ? `Да: ${type} хорошо сжимается gzip и brotli — включите сжатие для этого типа на сервере или CDN.` : `Нет: данные ${name.toLowerCase().startsWith("архив") ? "архива" : `.${e.ext}`} уже сжаты или двоичные, повторное сжатие только тратит процессорное время.` },
      ]
    : [
        { q: `What is the MIME type of .${e.ext} files?`, a: `${type}.${alts.length ? ` You may also see ${alts.join(", ")}, but serve ${type}.` : ""}` },
        { q: `How do I set the Content-Type for .${e.ext} in nginx?`, a: `Add “${type} ${e.ext};” inside types { } in /etc/nginx/mime.types and reload: nginx -s reload. In Apache use AddType ${type} .${e.ext}.` },
        { q: `Should .${e.ext} be compressed when served?`, a: comp ? `Yes: ${type} compresses well with gzip and brotli — enable compression for it on your server or CDN.` : `No: .${e.ext} data is already compressed or binary, so recompressing just wastes CPU.` },
      ];
  if (e.magic.length)
    faq.push(
      ru
        ? { q: `Как определить файл .${e.ext} по содержимому?`, a: `По сигнатуре: ${e.magic[0].hex}${e.magic[0].offset > 0 ? ` на смещении ${e.magic[0].offset}` : e.magic[0].offset < 0 ? " в конце файла" : " в начале файла"}${e.magic[0].note ? ` (${lower1(e.magic[0].note[0])})` : ""}. Проверить файл можно инструментом «Определить тип файла по содержимому».` }
        : { q: `How can I identify a .${e.ext} file by content?`, a: `By its signature: ${e.magic[0].hex}${e.magic[0].offset > 0 ? ` at offset ${e.magic[0].offset}` : e.magic[0].offset < 0 ? " near the end of the file" : " at the start of the file"}${e.magic[0].note ? ` (${lower1(e.magic[0].note[1])})` : ""}. The “Detect file type by content” tool checks it for you.` },
    );

  const shortName = name.replace(/\s*\([^)]*\)$/, "");
  const title = ru
    ? fit([`MIME-тип .${e.ext} — ${type}`, `MIME-тип .${e.ext} (${lower1(shortName)}) — Content-Type`, `MIME-тип .${e.ext}: Content-Type и настройка`])
    : fit([`.${e.ext} MIME Type — ${type}`, `.${e.ext} MIME Type (${shortName}) — Content-Type`, `.${e.ext} MIME Type and Content-Type`]);
  const base = ru ? `MIME-тип .${e.ext} — ${type}. ${leadText(e.d[0])}` : `The .${e.ext} MIME type is ${type}. ${leadText(e.d[1])}`;
  const sig = e.magic.length > 0;
  const description = describe(
    base,
    ru
      ? [sig ? "Настройка nginx, Apache, IIS и S3, сигнатура файла." : "Как настроить Content-Type в nginx, Apache, IIS и S3.", "Настройка nginx, Apache и S3.", "Настройка сервера."]
      : [sig ? "Server setup for nginx, Apache, IIS and S3, file signature." : "How to set the Content-Type in nginx, Apache, IIS and S3.", "Setup for nginx, Apache and S3.", "Server setup."],
  );

  return {
    path: [ID, e.ext],
    sectionId: ID,
    kind: "entity",
    title,
    h1: ru ? `MIME-тип .${e.ext}` : `.${e.ext} MIME type`,
    description,
    lead: ru ? `MIME-тип файлов .${e.ext} — ${type}${alts.length ? ` (также встречается ${alts[0]})` : ""}.` : `The MIME type of .${e.ext} files is ${type}${alts.length ? ` (${alts[0]} is also seen)` : ""}.`,
    breadcrumbs: [home(l), hubCrumb(l), { name: c[l].name, path: [ID, c.slug] }],
    tool: { id: "mime/serve", props: { ext: e.ext, type, alts, textual, compressible: comp } },
    topBlocks: [{ type: "links", title: ru ? "Похожие форматы" : "Related formats", style: "chips", items: chips.slice(0, 36).map((x) => extLink(x, l)) }],
    blocks,
    faq,
    related: [catLink(c.slug, l), detectLink(l), { path: [ID], label: ru ? "Все MIME-типы" : "All MIME types", hint: tr(DESC, l), icon: ICON, hue: HUE }],
    schemaType: "DefinedTerm",
    icon: c.icon,
    hue: HUE,
  };
}

/* ───────────── section ───────────── */

export const mimeSection: SectionDef = {
  id: ID,
  name: NAME,
  description: DESC,
  icon: ICON,
  hue: HUE,
  category: "dev",
  order: 10,
  paths() {
    return [[], [DETECT], ...CATS.map((c) => [c.slug]), ...ENTRIES.map((e) => [e.ext])];
  },
  prebuild() {
    return [[], [DETECT], ...CATS.map((c) => [c.slug]), ...POPULAR.map((ext) => [ext])];
  },
  resolve(locale, rest) {
    if (rest.length === 0) return hubPage(locale);
    if (rest.length !== 1) return null;
    const [s] = rest;
    if (s === DETECT) return detectPage(locale);
    if (CAT_BY_SLUG.has(s)) return catPage(s, locale);
    const e = ENTRY_BY_EXT.get(s);
    return e ? extPage(e, locale) : null;
  },
  search(locale) {
    const ru = locale === "ru";
    const out: SearchEntry[] = [
      { path: [ID], title: ru ? "MIME-типы файлов" : "MIME types", hint: tr(NAME, locale), keywords: "mime content-type тип файла media type расширение", weight: 3 },
      { path: [ID, DETECT], title: ru ? "Определить тип файла" : "Detect file type", hint: tr(NAME, locale), keywords: ru ? "определить формат файла сигнатура magic bytes расширение" : "file type checker magic bytes signature identify format", weight: 3 },
      ...CATS.map((c) => ({ path: [ID, c.slug], title: c[locale].h1, hint: tr(NAME, locale), keywords: c[locale].name, weight: 2 })),
    ];
    for (const e of ENTRIES)
      out.push({
        path: [ID, e.ext],
        title: ru ? `MIME-тип .${e.ext}` : `.${e.ext} MIME type`,
        hint: e.primary.type,
        keywords: `${e.ext} .${e.ext} ${e.types.map((t) => t.type).join(" ")} ${e.name[0]} ${e.name[1]}`,
        weight: POPULAR.includes(e.ext) ? 3 : 2,
      });
    return out;
  },
  featured(locale) {
    return [
      { path: [ID], label: locale === "ru" ? "MIME-типы файлов" : "MIME types", hint: tr(DESC, locale), icon: ICON, hue: HUE },
      detectLink(locale),
      ...["json", "webp", "docx"].map((e) => extLink(ENTRY_BY_EXT.get(e)!, locale)),
    ];
  },
  tools(locale) {
    return [{ path: [ID], label: locale === "ru" ? "MIME-типы файлов" : "MIME types", hint: tr(DESC, locale), icon: ICON, hue: HUE }, detectLink(locale)];
  },
};
