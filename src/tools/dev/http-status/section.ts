import { tr, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import type { CodeRow } from "./CodeSearch";
import { HEADERS } from "./data/headers";
import { CLASS_BY_ID, CLASSES, CODE_BY_NUM, CODES, classOf, codesOf, displayName, type CodeClass, type HttpCode } from "./data";

const ID = "http-status";
const HUE = 200;
const ICON = "Server";
const NAME = { ru: "HTTP-коды", en: "HTTP status codes" };
const DESC = {
  ru: "Справочник кодов ответа HTTP: что означает каждый статус, почему возникают ошибки 4xx и 5xx и как их исправить.",
  en: "HTTP status code reference: what each status means, why 4xx and 5xx errors happen and how to fix them.",
};

const EN_WORDS = /\b(the|and|with|for|your)\b/i;
const isError = (c: number) => c >= 400;
const spec = (c: HttpCode, l: Locale) => (typeof c.spec === "string" ? c.spec : c.spec[l]);

/** Pick the longest title variant that fits in `max` characters. */
function fit(variants: string[], max = 60): string {
  return variants.find((v) => v.length <= max) ?? variants[variants.length - 1];
}

/** Compose a meta description of ≤160 characters: base + the longest alternative tail that fits. */
function describe(base: string, tails: string[]): string {
  const tail = tails.find((t) => `${base} ${t}`.length <= 160);
  const out = tail ? `${base} ${tail}` : base;
  return out.length > 160 ? out.slice(0, 157).replace(/[\s,;:—-]+\S*$/, "") + "…" : out;
}

/** Lowercase the first letter after a colon unless it starts an acronym ("HTTP", "AWS"). */
const lc = (s: string) => (/^\p{Lu}(\p{Ll}|\s)/u.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

const STATUS_LABEL: Record<HttpCode["status"], { ru: string; en: string }> = {
  standard: { ru: "Стандартный (IANA)", en: "Standard (IANA)" },
  deprecated: { ru: "Устаревший", en: "Deprecated" },
  unused: { ru: "Зарезервирован", en: "Reserved (unused)" },
  temporary: { ru: "Временная регистрация", en: "Temporary registration" },
  unofficial: { ru: "Нестандартный", en: "Non-standard" },
};

function codeTitle(c: HttpCode, l: Locale): string {
  const n = displayName(c);
  if (l === "ru") {
    return isError(c.code)
      ? fit([`Ошибка ${c.code} ${n} | что значит и как исправить`, `Ошибка ${c.code} ${n} | причины и решение`, `Ошибка ${c.code} ${n} | что значит`, `Ошибка ${c.code} | ${n}`])
      : fit([`Код ${c.code} ${n} | что означает ответ сервера`, `Код ответа ${c.code} ${n} | что означает`, `Код ${c.code} ${n} | что означает`, `HTTP ${c.code} | ${n}`]);
  }
  return isError(c.code)
    ? fit([`HTTP ${c.code} ${n} | Meaning, Causes and Fixes`, `HTTP ${c.code} ${n} | Causes and Fixes`, `HTTP ${c.code} ${n} | Error Explained`, `HTTP ${c.code} | ${n}`])
    : fit([`HTTP ${c.code} ${n} | Meaning and Examples`, `HTTP ${c.code} ${n} | Status Code Explained`, `HTTP ${c.code} ${n} | Explained`, `HTTP ${c.code} | ${n}`]);
}

function codeH1(c: HttpCode, l: Locale): string {
  const n = displayName(c);
  if (l === "en") return `HTTP ${c.code} ${n}`;
  if (EN_WORDS.test(n)) return `${isError(c.code) ? "Ошибка" : "Код"} ${c.code}: ${c.ru.n.toLowerCase()}`;
  return isError(c.code) ? `Ошибка ${c.code} ${n}` : `Код ответа ${c.code} ${n}`;
}

function codeLink(c: HttpCode, l: Locale): LinkItem {
  return { path: [ID, String(c.code)], label: `${c.code} ${displayName(c)}`, hint: c[l].n };
}

function classLink(id: CodeClass, l: Locale): LinkItem {
  const k = CLASS_BY_ID.get(id)!;
  return { path: [ID, id], label: `${k.range} — ${l === "ru" ? k.ru : k.en}`, hint: codesOf(id).slice(0, 5).map((c) => c.code).join(", "), icon: ICON, hue: HUE };
}

function rows(list: HttpCode[], l: Locale): CodeRow[] {
  return list.map((c) => {
    const r: CodeRow = { c: c.code, n: displayName(c), t: c[l].n, k: CLASS_BY_ID.get(classOf(c.code))!.range };
    if (c.status === "unofficial" || c.status === "unused") r.u = 1;
    return r;
  });
}

const home = (l: Locale): Crumb => ({ name: ui(l).home, path: [] });
const hubCrumb = (l: Locale): Crumb => ({ name: l === "ru" ? "Коды ответов HTTP" : "HTTP status codes", path: [ID] });

/* ───────────── hub ───────────── */

const POPULAR = [200, 301, 302, 304, 400, 401, 403, 404, 405, 409, 413, 422, 429, 500, 502, 503, 504, 520, 522, 524, 499, 418];

function hubPage(l: Locale): PageModel {
  const ru = l === "ru";
  const faq: QA[] = ru
    ? [
        { q: "Сколько всего кодов ответа HTTP?", a: `В реестре IANA зарегистрировано около 60 кодов от 100 до 511. Здесь собран${CODES.length % 10 === 1 && CODES.length % 100 !== 11 ? "" : "о"} ${CODES.length} ${plural("ru", CODES.length, ["код", "кода", "кодов"])}: все зарегистрированные плюс нестандартные, которые реально встречаются — nginx (444, 499), Cloudflare (520–530), Laravel (419), AWS (460, 463, 561).` },
        { q: "Чем отличаются ошибки 4xx от 5xx?", a: "4xx — ошибка на стороне клиента: неверный запрос, нет доступа, страница не найдена. Повторять тот же запрос бессмысленно. 5xx — проблема на сервере: запрос может быть корректным, и повтор позже может сработать." },
        { q: "Какой редирект выбрать: 301, 302, 307 или 308?", a: "Для постоянного переезда — 301 (или 308, если важно сохранить метод POST). Для временного — 302 (или 307 с сохранением метода). После отправки формы — 303 See Other." },
        { q: "Что делать с кодом, которого нет в стандарте?", a: "Нестандартные коды придумывают конкретные продукты: 499 и 444 — только в логах nginx, 520–527 — страницы ошибок Cloudflare. Ищите причину в документации того продукта, который стоит перед сайтом." },
      ]
    : [
        { q: "How many HTTP status codes are there?", a: `The IANA registry holds about 60 codes from 100 to 511. This reference lists ${CODES.length}: every registered code plus the non-standard ones you actually meet — nginx (444, 499), Cloudflare (520–530), Laravel (419), AWS (460, 463, 561).` },
        { q: "What's the difference between 4xx and 5xx errors?", a: "4xx means a client-side problem: a bad request, no access, a missing page. Repeating the same request won't help. 5xx means a server-side problem: the request may be fine and a later retry may succeed." },
        { q: "Which redirect should I use: 301, 302, 307 or 308?", a: "For a permanent move use 301 (or 308 to keep a POST method). For a temporary one use 302 (or 307 to keep the method). After a form submission use 303 See Other." },
        { q: "What about codes that aren't in the standard?", a: "Non-standard codes come from specific products: 499 and 444 appear only in nginx logs, 520–527 are Cloudflare error pages. Look up the product in front of the site." },
      ];
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? "Коды ответов HTTP — полный список статусов с описанием" : "HTTP Status Codes — Full List with Meanings",
    h1: ru ? "Коды ответов HTTP" : "HTTP status codes",
    description: ru
      ? `Все коды состояния HTTP от 100 до 599 с описанием на русском: ${CODES.length} ${plural("ru", CODES.length, ["код", "кода", "кодов"])}, включая nginx 499 и Cloudflare 520–526. Причины ошибок 4xx и 5xx и решения.`
      : `Every HTTP status code from 100 to 599 explained: ${CODES.length} codes, including nginx 499 and Cloudflare 520–526. Causes and fixes for 4xx and 5xx errors.`,
    lead: ru
      ? "Найдите код по номеру или названию — у каждого есть страница с причинами, решениями и примером ответа."
      : "Find a code by number or name — each one has a page with causes, fixes and a sample response.",
    breadcrumbs: [home(l)],
    tool: { id: "http-status/search", props: { items: rows(CODES, l) } },
    topBlocks: [
      { type: "links", title: ru ? "Классы кодов" : "Code classes", style: "cards", items: CLASSES.map((k) => classLink(k.id, l)) },
      { type: "links", title: ru ? "Частые коды" : "Common codes", style: "chips", items: POPULAR.map((n) => codeLink(CODE_BY_NUM.get(n)!, l)) },
    ],
    blocks: [
      {
        type: "text",
        title: ru ? "Как устроены коды ответа" : "How status codes work",
        paragraphs: ru
          ? [
              "Код состояния — трёхзначное число в первой строке ответа сервера. Первая цифра задаёт класс: 1xx — промежуточные ответы, 2xx — успех, 3xx — перенаправление, 4xx — ошибка клиента, 5xx — ошибка сервера. Названия кодов здесь даны по актуальному стандарту RFC 9110 (2022): например, 413 теперь называется Content Too Large, а 422 — Unprocessable Content.",
              "Клиент, который не знает конкретный код, обязан обрабатывать его как x00 своего класса: неизвестный 4xx — как 400, неизвестный 5xx — как 500. Поэтому нестандартные коды вроде 499 или 520 не ломают браузеры, но и ничего им не объясняют.",
            ]
          : [
              "A status code is the three-digit number on the first line of a server's response. The first digit is the class: 1xx interim, 2xx success, 3xx redirection, 4xx client error, 5xx server error. Names here follow the current standard, RFC 9110 (2022): 413 is now Content Too Large and 422 is Unprocessable Content.",
              "A client that doesn't recognise a code must treat it as the x00 of its class: an unknown 4xx as 400, an unknown 5xx as 500. That's why non-standard codes like 499 or 520 don't break browsers — but they don't explain anything to them either.",
            ],
      },
    ],
    faq,
    schemaType: "CollectionPage",
    icon: ICON,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── class pages ───────────── */

const CLASS_TEXT: Record<CodeClass, { ru: { title: string; lead: string; desc: string; p: string[] }; en: { title: string; lead: string; desc: string; p: string[] } }> = {
  informational: {
    ru: {
      title: "Коды 1xx — информационные ответы HTTP: 100, 101, 103",
      lead: "Промежуточные ответы: сервер сообщает о ходе обработки, а окончательный ответ придёт следом.",
      desc: "Информационные коды HTTP 1xx: 100 Continue, 101 Switching Protocols (WebSocket), 102 Processing, 103 Early Hints и 104. Что означают и когда отправляются.",
      p: [
        "Коды 1xx никогда не бывают окончательными: после них сервер обязательно присылает ещё один ответ с кодом 2xx–5xx. Браузер обрабатывает их сам, а в fetch() они не видны.",
        "На практике встречаются 101 — при открытии WebSocket, 100 — при загрузке больших файлов с «Expect: 100-continue» и 103 Early Hints — для ускорения загрузки страниц через предзагрузку ресурсов.",
      ],
    },
    en: {
      title: "HTTP 1xx Informational Status Codes: 100, 101, 103",
      lead: "Interim responses: the server reports progress and the final response follows.",
      desc: "HTTP 1xx informational codes: 100 Continue, 101 Switching Protocols (WebSocket), 102 Processing, 103 Early Hints and 104. Meanings and when they are sent.",
      p: [
        "1xx codes are never final: the server always sends another response with a 2xx–5xx code afterwards. Browsers handle them internally and fetch() doesn't expose them.",
        "In practice you'll meet 101 when opening a WebSocket, 100 for large uploads with “Expect: 100-continue”, and 103 Early Hints for faster page loads through resource preloading.",
      ],
    },
  },
  success: {
    ru: {
      title: "Коды 2xx — успешные ответы HTTP: 200, 201, 204",
      lead: "Запрос успешно получен, понят и выполнен.",
      desc: "Успешные коды HTTP 2xx: 200 OK, 201 Created, 202 Accepted, 204 No Content, 206 Partial Content и WebDAV-коды 207, 208, 226. Когда какой отправлять.",
      p: [
        "Правильный код успеха помогает клиентам: 201 сообщает, что создан новый ресурс, и даёт его адрес в Location; 204 — что тела нет и разбирать нечего; 202 — что задача принята, но ещё выполняется.",
        "Ответы 200, 203, 204 и 206 кешируются по умолчанию, если заголовки не запрещают этого. Отвечать 200 на страницы ошибок («soft 404») — плохая практика: поисковики и клиенты не поймут, что что-то пошло не так.",
      ],
    },
    en: {
      title: "HTTP 2xx Success Status Codes: 200, 201, 204",
      lead: "The request was received, understood and fulfilled.",
      desc: "HTTP 2xx success codes: 200 OK, 201 Created, 202 Accepted, 204 No Content, 206 Partial Content and WebDAV's 207, 208, 226. When to send each one.",
      p: [
        "The right success code helps clients: 201 says a resource was created and gives its URL in Location; 204 says there's no body to parse; 202 says the job was accepted but is still running.",
        "200, 203, 204 and 206 responses are cacheable by default unless headers forbid it. Answering error pages with 200 (“soft 404”) is bad practice: search engines and clients won't notice anything went wrong.",
      ],
    },
  },
  redirection: {
    ru: {
      title: "Коды 3xx — редиректы HTTP: 301, 302, 307, 308",
      lead: "Перенаправления: ресурс находится по другому адресу или не изменился с прошлого раза.",
      desc: "Коды перенаправления HTTP 3xx: 301 и 308 — постоянный редирект, 302 и 307 — временный, 303 после POST, 304 Not Modified. Как выбрать нужный код.",
      p: [
        "Постоянные редиректы (301, 308) браузер запоминает, а поисковики переносят на новый адрес вес старой страницы. Временные (302, 307) оставляют основным исходный URL.",
        "Главное отличие пар 301/308 и 302/307 — метод запроса: при 301 и 302 клиенты исторически превращают POST в GET, а 307 и 308 обязывают повторить запрос тем же методом и с тем же телом. 304 — не редирект, а ответ на условный запрос: берите копию из кеша.",
      ],
    },
    en: {
      title: "HTTP 3xx Redirect Status Codes: 301, 302, 307, 308",
      lead: "Redirection: the resource lives elsewhere or hasn't changed since last time.",
      desc: "HTTP 3xx redirection codes: 301 and 308 permanent, 302 and 307 temporary, 303 after a POST, 304 Not Modified. How to choose the right redirect code.",
      p: [
        "Browsers remember permanent redirects (301, 308) and search engines move the old page's signals to the new URL. Temporary ones (302, 307) keep the original URL canonical.",
        "The key difference between 301/308 and 302/307 is the method: on 301 and 302 clients historically switch POST to GET, while 307 and 308 require repeating the request with the same method and body. 304 isn't a redirect but an answer to a conditional request: use the cached copy.",
      ],
    },
  },
  "client-error": {
    ru: {
      title: "Ошибки 4xx — ошибки клиента HTTP: список и решения",
      lead: "Проблема в запросе: неверные данные, нет доступа, ресурс не найден или слишком много запросов.",
      desc: "Все ошибки клиента HTTP 4xx: 400, 401, 403, 404, 405, 409, 413, 422, 429, а также 419 Laravel и 499 nginx. Причины каждой ошибки и способы исправления.",
      p: [
        "Ошибки 4xx означают, что сервер не станет выполнять запрос в таком виде. Повторять его без изменений бессмысленно — нужно исправить данные, авторизоваться, изменить адрес или подождать (для 429).",
        "Самые частые ошибки: 404 — нет страницы, 403 — нет прав, 401 — нужна авторизация, 400 и 422 — неверные данные, 429 — превышен лимит запросов. Коды 444, 494–499 встречаются только в логах nginx: пользователь их не видит.",
      ],
    },
    en: {
      title: "HTTP 4xx Client Error Codes — List and Fixes",
      lead: "The request is the problem: bad data, no access, a missing resource or too many requests.",
      desc: "Every HTTP 4xx client error: 400, 401, 403, 404, 405, 409, 413, 422, 429, plus Laravel 419 and nginx 499. The causes of each error and how to fix it.",
      p: [
        "4xx errors mean the server won't process the request as sent. Repeating it unchanged is pointless — fix the data, authenticate, change the URL or wait (for 429).",
        "The most common: 404 missing page, 403 no permission, 401 authentication needed, 400 and 422 invalid data, 429 rate limit exceeded. Codes 444 and 494–499 appear only in nginx logs; users never see them.",
      ],
    },
  },
  "server-error": {
    ru: {
      title: "Ошибки 5xx — ошибки сервера HTTP: список и решения",
      lead: "Проблема на стороне сервера: запрос может быть верным, но сервер не смог его выполнить.",
      desc: "Все ошибки сервера HTTP 5xx: 500, 502, 503, 504, 507, 511 и ошибки Cloudflare 520–530. Что означает каждая и как её найти и исправить на сервере.",
      p: [
        "Ошибки 5xx говорят, что сервер или цепочка серверов перед ним не справились. Пользователь исправить их не может — только подождать; разработчику нужно смотреть логи сервера.",
        "502 и 504 выдаёт прокси (nginx, балансировщик, CDN), когда приложение за ним упало или отвечает слишком долго. 503 — временная недоступность, часто с Retry-After. Коды 520–530 — страницы ошибок Cloudflare о проблемах связи с исходным сервером.",
      ],
    },
    en: {
      title: "HTTP 5xx Server Error Codes — List and Fixes",
      lead: "The server is the problem: the request may be fine, but the server couldn't fulfil it.",
      desc: "Every HTTP 5xx server error: 500, 502, 503, 504, 507, 511 and Cloudflare 520–530. What each one means and how to track it down and fix it on the server.",
      p: [
        "5xx errors mean the server, or the chain of servers in front of it, failed. Users can't fix them — only wait; developers need to read the server logs.",
        "502 and 504 come from a proxy (nginx, load balancer, CDN) when the app behind it crashed or is too slow. 503 is temporary unavailability, often with Retry-After. 520–530 are Cloudflare error pages about trouble reaching the origin.",
      ],
    },
  },
};

function classPage(id: CodeClass, l: Locale): PageModel {
  const k = CLASS_BY_ID.get(id)!;
  const tx = CLASS_TEXT[id][l];
  const ru = l === "ru";
  const list = codesOf(id);
  const std = list.filter((c) => c.status !== "unofficial");
  const unoff = list.filter((c) => c.status === "unofficial");
  const faq: QA[] = ru
    ? [
        { q: `Какие коды относятся к классу ${k.range}?`, a: `${list.length} ${plural("ru", list.length, ["код", "кода", "кодов"])}: ${list.map((c) => c.code).join(", ")}. Из них ${std.length} зарегистрированы в IANA${unoff.length ? `, остальные (${unoff.map((c) => c.code).join(", ")}) — нестандартные` : ""}.` },
        { q: `Что означает первая цифра ${k.range[0]}?`, a: `${tx.lead} Клиент, не знающий конкретный код, обрабатывает его как ${k.range[0]}00.` },
      ]
    : [
        { q: `Which codes belong to the ${k.range} class?`, a: `${list.length} codes: ${list.map((c) => c.code).join(", ")}. ${std.length} of them are IANA-registered${unoff.length ? `; the rest (${unoff.map((c) => c.code).join(", ")}) are non-standard` : ""}.` },
        { q: `What does the leading ${k.range[0]} mean?`, a: `${tx.lead} A client that doesn't know a specific code treats it as ${k.range[0]}00.` },
      ];
  return {
    path: [ID, id],
    sectionId: ID,
    kind: "hub",
    title: tx.title,
    h1: ru ? `Коды ${k.range}: ${k.ru.toLowerCase()}` : `HTTP ${k.range} ${k.enShort.toLowerCase()} codes`,
    description: tx.desc,
    lead: tx.lead,
    breadcrumbs: [home(l), hubCrumb(l)],
    tool: { id: "http-status/search", props: { items: rows(list, l), only: k.range } },
    topBlocks: [
      { type: "links", title: ru ? `Все коды ${k.range}` : `All ${k.range} codes`, style: "chips", items: list.map((c) => codeLink(c, l)) },
      { type: "links", title: ru ? "Другие классы" : "Other classes", style: "chips", items: CLASSES.filter((x) => x.id !== id).map((x) => ({ ...classLink(x.id, l), icon: undefined, hue: undefined })) },
    ],
    blocks: [{ type: "text", title: ru ? `Что такое коды ${k.range}` : `About ${k.range} codes`, paragraphs: tx.p }],
    faq,
    schemaType: "CollectionPage",
    icon: ICON,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── code pages ───────────── */

function codeFaq(c: HttpCode, l: Locale): QA[] {
  const t = c[l];
  const n = displayName(c);
  const ru = l === "ru";
  const out: QA[] = [];
  if (ru) {
    out.push({ q: isError(c.code) ? `Что означает ошибка ${c.code}?` : `Что означает код ${c.code} ${n}?`, a: `${t.s} ${t.m}` });
    if (isError(c.code)) out.push({ q: `Как исправить ошибку ${c.code}?`, a: `Пользователю: ${t.fc[0].replace(/\.$/, "")}. Владельцу сайта: ${t.fs[0].replace(/\.$/, "")}.` });
    else out.push({ q: `Когда сервер отвечает ${c.code}?`, a: t.w });
    if (c.status === "unofficial") out.push({ q: `Код ${c.code} — стандартный?`, a: `Нет, его нет в реестре IANA: это код ${spec(c, l)}. Браузеры и клиенты, не знающие его, обрабатывают ответ как ${Math.floor(c.code / 100)}00.` });
    else out.push({ q: `Кешируется ли ответ ${c.code}?`, a: c.cacheable ? `Да: по RFC 9110 ответ ${c.code} кешируется эвристически, если Cache-Control или Expires не говорят иного.` : `Не по умолчанию: ответ ${c.code} кешируется, только если это явно разрешено заголовками Cache-Control или Expires.` });
  } else {
    out.push({ q: isError(c.code) ? `What does a ${c.code} error mean?` : `What does ${c.code} ${n} mean?`, a: `${t.s} ${t.m}` });
    if (isError(c.code)) out.push({ q: `How do I fix a ${c.code} error?`, a: `As a user: ${t.fc[0].replace(/\.$/, "")}. As the site owner: ${t.fs[0].replace(/\.$/, "")}.` });
    else out.push({ q: `When does a server return ${c.code}?`, a: t.w });
    if (c.status === "unofficial") out.push({ q: `Is ${c.code} a standard status code?`, a: `No, it isn't in the IANA registry: it comes from ${spec(c, l)}. Clients that don't know it treat the response as ${Math.floor(c.code / 100)}00.` });
    else out.push({ q: `Is a ${c.code} response cacheable?`, a: c.cacheable ? `Yes: per RFC 9110 a ${c.code} is heuristically cacheable unless Cache-Control or Expires say otherwise.` : `Not by default: a ${c.code} is cached only when Cache-Control or Expires explicitly allow it.` });
  }
  return out;
}

function codePage(c: HttpCode, l: Locale): PageModel {
  const ru = l === "ru";
  const t = c[l];
  const n = displayName(c);
  const cls = classOf(c.code);
  const k = CLASS_BY_ID.get(cls)!;
  const err = isError(c.code);

  const facts: [string, string][] = [
    [ru ? "Код и название" : "Code and name", `${c.code} ${c.name}`],
    [ru ? "Класс" : "Class", `${k.range} — ${ru ? k.ru.toLowerCase() : k.en.toLowerCase()}`],
    [ru ? "Статус" : "Status", STATUS_LABEL[c.status][l]],
    [ru ? "Где определён" : "Defined in", spec(c, l)],
    [ru ? "Кешируется по умолчанию" : "Cacheable by default", c.cacheable ? (ru ? "да (эвристически, RFC 9110)" : "yes (heuristically, RFC 9110)") : ru ? "нет" : "no"],
  ];
  if (ru) facts.splice(1, 0, ["Перевод", t.n]);

  const blocks: Block[] = [
    { type: "facts", title: ru ? `Код ${c.code} коротко` : `${c.code} at a glance`, rows: facts },
    { type: "text", title: ru ? `Что означает ${c.code} ${n}` : `What ${c.code} ${n} means`, paragraphs: [t.m, t.w] },
    { type: "list", title: err ? (ru ? "Частые причины" : "Common causes") : ru ? "Когда используется" : "Typical uses", items: t.c },
    { type: "list", title: err ? (ru ? "Что сделать пользователю или клиенту" : "What the user or client can do") : ru ? "Что делает клиент" : "What the client does", items: t.fc },
    { type: "list", title: err ? (ru ? "Как исправить на сервере" : "How to fix it on the server") : ru ? "На стороне сервера" : "On the server side", items: t.fs },
  ];
  if (t.r) blocks.push({ type: "text", title: ru ? "Повтор запроса и идемпотентность" : "Retries and idempotency", paragraphs: [t.r] });
  const hdrs = (c.headers ?? []).filter((h) => HEADERS[h]);
  if (hdrs.length)
    blocks.push({
      type: "table",
      title: ru ? `Заголовки, связанные с ${c.code}` : `Headers related to ${c.code}`,
      head: ru ? ["Заголовок", "Зачем нужен"] : ["Header", "Purpose"],
      rows: hdrs.map((h) => [h, HEADERS[h][l]]),
    });

  // chips: related first, then same class, then neighbouring classes
  const seen = new Set<number>([c.code]);
  const chips: HttpCode[] = [];
  const push = (x?: HttpCode) => {
    if (x && !seen.has(x.code)) {
      seen.add(x.code);
      chips.push(x);
    }
  };
  c.related.forEach((r) => push(CODE_BY_NUM.get(r)));
  codesOf(cls).forEach(push);
  POPULAR.forEach((p) => push(CODE_BY_NUM.get(p)));

  const title = codeTitle(c, l);
  const base = `${c.code} ${n} — ${lc(t.s)}`;
  const tails = ru
    ? err
      ? ["Частые причины, как исправить на стороне клиента и сервера, пример ответа.", "Причины, решение и пример ответа.", "Причины и решение."]
      : ["Когда сервер его отправляет, что делать клиенту, заголовки и пример ответа.", "Когда отправляется, заголовки и пример ответа.", "Примеры и заголовки."]
    : err
      ? ["Common causes, client- and server-side fixes and an example response.", "Causes, fixes and an example response.", "Causes and fixes."]
      : ["When servers send it, what clients should do, headers and an example.", "When it is sent, headers and an example.", "Examples and headers."];
  const description = describe(base, tails);

  return {
    path: [ID, String(c.code)],
    sectionId: ID,
    kind: "entity",
    title,
    h1: codeH1(c, l),
    description,
    lead: t.s,
    breadcrumbs: [home(l), hubCrumb(l), { name: `${k.range} — ${ru ? k.ruShort : k.enShort}`, path: [ID, cls] }],
    tool: {
      id: "http-status/code",
      props: {
        code: c.code,
        name: n,
        label: t.n,
        classLabel: `${k.range} · ${ru ? k.ruShort : k.enShort}`,
        statusLabel: STATUS_LABEL[c.status][l],
        official: c.status === "standard",
        example: c.example,
        exampleTitle: ru ? "Пример ответа" : "Example response",
      },
    },
    topBlocks: [{ type: "links", title: ru ? "Похожие и соседние коды" : "Related and nearby codes", style: "chips", items: chips.slice(0, 32).map((x) => codeLink(x, l)) }],
    blocks,
    faq: codeFaq(c, l),
    related: [classLink(cls, l), { path: [ID], label: ru ? "Все коды ответов HTTP" : "All HTTP status codes", hint: tr(DESC, l), icon: ICON, hue: HUE }],
    schemaType: "DefinedTerm",
    icon: ICON,
    hue: HUE,
  };
}

/* ───────────── section ───────────── */

export const httpStatusSection: SectionDef = {
  id: ID,
  name: NAME,
  description: DESC,
  icon: ICON,
  hue: HUE,
  category: "dev",
  order: 9,
  paths() {
    return [[], ...CLASSES.map((k) => [k.id]), ...CODES.map((c) => [String(c.code)])];
  },
  resolve(locale, rest) {
    if (rest.length === 0) return hubPage(locale);
    if (rest.length !== 1) return null;
    const [s] = rest;
    if (CLASS_BY_ID.has(s as CodeClass)) return classPage(s as CodeClass, locale);
    if (!/^\d{3}$/.test(s)) return null;
    const c = CODE_BY_NUM.get(Number(s));
    return c ? codePage(c, locale) : null;
  },
  search(locale) {
    const ru = locale === "ru";
    const out: SearchEntry[] = [
      { path: [ID], title: ru ? "Коды ответов HTTP" : "HTTP status codes", hint: tr(NAME, locale), keywords: "http status code коды ответа ошибки сервера статус", weight: 3 },
      ...CLASSES.map((k) => ({ path: [ID, k.id], title: `${k.range} — ${ru ? k.ru : k.en}`, hint: tr(NAME, locale), keywords: `${k.range} ${k.ru} ${k.en}`, weight: 2 })),
    ];
    for (const c of CODES)
      out.push({
        path: [ID, String(c.code)],
        title: `${c.code} ${displayName(c)}`,
        hint: c[locale].n,
        keywords: `${c.code} ${ru ? `ошибка ${c.code} код ${c.code}` : `error ${c.code} http ${c.code}`} ${c.ru.n} ${c.en.n}`,
        weight: POPULAR.includes(c.code) ? 3 : 2,
      });
    return out;
  },
  featured(locale) {
    return [
      { path: [ID], label: locale === "ru" ? "Коды ответов HTTP" : "HTTP status codes", hint: tr(DESC, locale), icon: ICON, hue: HUE },
      ...[404, 500, 502, 403].map((n) => codeLink(CODE_BY_NUM.get(n)!, locale)),
    ];
  },
  tools(locale) {
    return [{ path: [ID], label: locale === "ru" ? "Коды ответов HTTP" : "HTTP status codes", hint: tr(DESC, locale), icon: ICON, hue: HUE }];
  },
};
