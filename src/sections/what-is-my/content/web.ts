import { tr, type Locale } from "@/i18n/config";
import type { ToolDef } from "@/registry/types";
import { ES_FEATURES, FEATURE_GROUPS, FEATURES } from "../lib/features";

const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);

export const javascript: ToolDef = {
  slug: "is-javascript-enabled",
  component: "what-is-my/javascript",
  icon: "Braces",
  name: { ru: "Включён ли JavaScript", en: "Is JavaScript enabled?" },
  title: { ru: "Включён ли JavaScript — проверить онлайн", en: "Is JavaScript enabled? Check JavaScript online" },
  h1: { ru: "Включён ли JavaScript в браузере", en: "Is JavaScript enabled in my browser?" },
  description: {
    ru: `Включён ли JavaScript, какой движок (V8, SpiderMonkey, JavaScriptCore) и до какой версии ECMAScript поддерживается язык — таблица из ${ES_FEATURES.length} возможностей.`,
    en: `Check whether JavaScript is enabled, which engine runs it (V8, SpiderMonkey, JavaScriptCore) and which ECMAScript version it supports — a table of ${ES_FEATURES.length} features.`,
  },
  lead: {
    ru: "Если ниже зелёный ответ, JavaScript работает; если он выключен, страница скажет об этом и без скриптов.",
    en: "A green answer below means JavaScript works; if it's off, the page tells you so even without scripts.",
  },
  keywords: {
    ru: ["javascript включен", "включить javascript", "проверка javascript", "версия ecmascript", "js отключен"],
    en: ["javascript enabled", "enable javascript", "javascript test", "ecmascript version", "js disabled"],
  },
  howTo: {
    ru: [
      "Откройте страницу: «Да, JavaScript включён» — всё в порядке; «Нет» — JavaScript отключён.",
      "Посмотрите движок и версию ECMAScript: старые браузеры могут не поддерживать новые возможности языка.",
      "Если JavaScript выключен, включите его по инструкции для вашего браузера в ответах ниже и обновите страницу.",
    ],
    en: [
      "Open the page: “Yes, JavaScript is enabled” means all is well; “No” means it's turned off.",
      "Check the engine and ECMAScript version: older browsers may lack newer language features.",
      "If JavaScript is off, enable it using the instructions for your browser below and reload the page.",
    ],
  },
  about: {
    ru: [
      "Проверка устроена просто: если скрипты работают, страница сама показывает ответ; если нет — браузер выводит блок <noscript> с сообщением, что JavaScript отключён. Никаких запросов на сервер для этого не нужно.",
      "Дополнительно проверяется, какие возможности языка есть в движке: от Array.prototype.includes (ES2016) до Set.prototype.union и Iterator helpers (ES2025) и новейших Temporal и Math.sumPrecise. Версия ECMAScript в ответе — последняя, все проверенные возможности которой браузер поддерживает.",
    ],
    en: [
      "The check is simple: if scripts run, the page shows the answer itself; if not, the browser displays a <noscript> block saying JavaScript is off. No server requests are needed.",
      "The tool also checks which language features the engine has, from Array.prototype.includes (ES2016) to Set.prototype.union and Iterator helpers (ES2025) and the newest Temporal and Math.sumPrecise. The ECMAScript version shown is the latest one whose checked features are all supported.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как включить JavaScript в Chrome?",
        a: "«Настройки → Конфиденциальность и безопасность → Настройки сайтов → JavaScript» → «Сайты могут использовать JavaScript». Быстрый путь — адрес chrome://settings/content/javascript.",
      },
      {
        q: "Как включить JavaScript в Яндекс Браузере и Edge?",
        a: "Яндекс Браузер: «Настройки → Сайты → Расширенные настройки сайтов → JavaScript» → «Разрешён». Edge: «Настройки → Файлы cookie и разрешения сайтов → JavaScript».",
      },
      {
        q: "Как включить JavaScript в Safari и Firefox?",
        a: "iPhone и iPad: «Настройки → Приложения → Safari → Дополнения → JavaScript». Mac: Safari → «Настройки → Безопасность» → «Включить JavaScript». Firefox: откройте about:config и установите javascript.enabled в true — обычного переключателя в настройках нет.",
      },
      {
        q: "Зачем отключают JavaScript?",
        a: "Ради скорости и приватности — например, в Tor Browser в режиме «Наиболее безопасный». Но большинство современных сайтов без JavaScript не работают, в том числе все инструменты этого сайта.",
      },
    ],
    en: [
      {
        q: "How do I enable JavaScript in Chrome?",
        a: "Settings → Privacy and security → Site settings → JavaScript → “Sites can use JavaScript”. Shortcut: chrome://settings/content/javascript.",
      },
      {
        q: "How do I enable JavaScript in Edge?",
        a: "Settings → Cookies and site permissions → JavaScript → turn on “Allowed”.",
      },
      {
        q: "How do I enable JavaScript in Safari and Firefox?",
        a: "iPhone and iPad: Settings → Apps → Safari → Advanced → JavaScript. Mac: Safari → Settings → Security → “Enable JavaScript”. Firefox: open about:config and set javascript.enabled to true — there's no regular switch in Settings.",
      },
      {
        q: "Why do people turn JavaScript off?",
        a: "For speed and privacy — for example in Tor Browser's Safest mode. But most modern sites don't work without JavaScript, including every tool on this site.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "JavaScript-движки браузеров", "Browser JavaScript engines"),
      head: L(locale, ["Движок", "Браузеры"], ["Engine", "Browsers"]),
      rows: L(
        locale,
        [
          ["V8", "Chrome, Edge, Opera, Яндекс Браузер, Brave, Samsung Internet"],
          ["SpiderMonkey", "Firefox, Tor Browser"],
          ["JavaScriptCore", "Safari и почти все браузеры на iPhone и iPad"],
        ],
        [
          ["V8", "Chrome, Edge, Opera, Brave, Samsung Internet"],
          ["SpiderMonkey", "Firefox, Tor Browser"],
          ["JavaScriptCore", "Safari and almost every browser on iPhone and iPad"],
        ],
      ),
    },
  ],
};

export const cookies: ToolDef = {
  slug: "are-cookies-enabled",
  component: "what-is-my/cookies",
  icon: "Cookie",
  name: { ru: "Включены ли cookie", en: "Are cookies enabled?" },
  title: { ru: "Включены ли cookie в браузере — проверить онлайн", en: "Are cookies enabled? Check cookies in your browser" },
  h1: { ru: "Включены ли cookie в браузере", en: "Are cookies enabled in my browser?" },
  description: {
    ru: "Проверка cookie записью и чтением тестового файла, плюс localStorage, sessionStorage, IndexedDB и квота. Как включить cookie в Chrome, Safari и Firefox.",
    en: "Test cookies by writing and reading a real cookie, plus localStorage, sessionStorage, IndexedDB and quota. How to enable cookies in Chrome, Safari, Firefox.",
  },
  lead: {
    ru: "Страница записывает тестовый cookie, читает его и сразу удаляет — так видно, работают ли cookie на самом деле.",
    en: "The page writes a test cookie, reads it back and deletes it at once — so you see whether cookies really work.",
  },
  keywords: {
    ru: ["cookie включены", "включить куки", "проверка cookie", "localstorage", "куки браузера"],
    en: ["cookies enabled", "enable cookies", "cookie test", "localstorage", "browser cookies"],
  },
  howTo: {
    ru: [
      "Откройте страницу — проверка запустится сама.",
      "«Cookie включены» — всё работает; «заблокированы» — включите cookie по инструкции в ответах ниже.",
      "Посмотрите на localStorage и IndexedDB: без них многие сайты не сохраняют настройки и черновики.",
      "После изменения настроек нажмите «Проверить снова».",
    ],
    en: [
      "Open the page — the test runs by itself.",
      "“Cookies are enabled” means all is fine; “blocked” means you should enable them using the instructions below.",
      "Check localStorage and IndexedDB too: many sites can't save settings or drafts without them.",
      "After changing settings, click “Test again”.",
    ],
  },
  about: {
    ru: [
      "navigator.cookieEnabled сообщает лишь, разрешены ли cookie в целом, и не видит блокировку для отдельного сайта. Поэтому инструмент ещё и записывает настоящий cookie wim_cookie_test, читает его и сразу удаляет — это точный ответ для текущего сайта.",
      "Сторонние (third-party) cookie с одного сайта проверить нельзя: для этого нужен второй домен, а инструмент не делает сетевых запросов. Safari и Firefox блокируют сторонние cookie по умолчанию, Chrome — в режиме инкогнито.",
      "Кроме cookie сайты хранят данные в localStorage, sessionStorage и IndexedDB; в приватном режиме всё это удаляется при закрытии окна. Квота показывает, сколько места браузер готов выделить сайту.",
    ],
    en: [
      "navigator.cookieEnabled only says whether cookies are allowed in general and misses per-site blocking. So the tool also writes a real cookie, wim_cookie_test, reads it back and deletes it straight away — an exact answer for the current site.",
      "Third-party cookies can't be tested from a single site: that needs a second domain, and the tool makes no network requests. Safari and Firefox block third-party cookies by default, Chrome does so in Incognito.",
      "Besides cookies, sites store data in localStorage, sessionStorage and IndexedDB; in private mode all of it is wiped when the window closes. The quota shows how much space the browser is willing to give a site.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как включить cookie в Chrome?",
        a: "Откройте «Настройки → Конфиденциальность и безопасность» (быстрый адрес chrome://settings/cookies): разрешите сайтам сохранять данные и проверьте, нет ли нужного сайта в списке блокировки. Сторонние cookie включаются там же.",
      },
      {
        q: "Как включить cookie в Safari?",
        a: "iPhone и iPad: «Настройки → Приложения → Safari» → выключите «Блокировать все cookie». Mac: Safari → «Настройки → Конфиденциальность» → снимите флажок «Блокировать все cookie».",
      },
      {
        q: "Как включить cookie в Firefox и Яндекс Браузере?",
        a: "Firefox: «Настройки → Приватность и защита» → режим «Стандартная» или исключение для сайта в разделе «Куки и данные сайтов». Яндекс Браузер: «Настройки → Сайты → Расширенные настройки сайтов → Cookie-файлы».",
      },
      {
        q: "Что значит «заблокированы для этого сайта»?",
        a: "Браузер в целом разрешает cookie (navigator.cookieEnabled = true), но записать тестовый не удалось. Значит, сайт в списке блокировки браузера или расширения-блокировщика.",
      },
    ],
    en: [
      {
        q: "How do I enable cookies in Chrome?",
        a: "Open Settings → Privacy and security (shortcut: chrome://settings/cookies): allow sites to save data and check that the site isn't on the block list. Third-party cookies are configured there too.",
      },
      {
        q: "How do I enable cookies in Safari?",
        a: "iPhone and iPad: Settings → Apps → Safari → turn off “Block All Cookies”. Mac: Safari → Settings → Privacy → untick “Block all cookies”.",
      },
      {
        q: "How do I enable cookies in Firefox and Edge?",
        a: "Firefox: Settings → Privacy & Security → Standard protection, or add an exception under Cookies and Site Data. Edge: Settings → Cookies and site permissions → Manage and delete cookies and site data → allow sites to save and read cookie data.",
      },
      {
        q: "What does “blocked for this site” mean?",
        a: "The browser allows cookies in general (navigator.cookieEnabled is true), but the test cookie couldn't be written. The site is on the block list of the browser or of a blocker extension.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Где браузер хранит данные сайтов", "Where browsers keep site data"),
      head: L(locale, ["Хранилище", "Сколько живёт", "Объём"], ["Storage", "Lifetime", "Size"]),
      rows: L(
        locale,
        [
          ["Cookie", "до срока, заданного сайтом, или до закрытия браузера", "около 4 КБ на один cookie"],
          ["localStorage", "пока пользователь не очистит данные", "около 5 МБ на сайт"],
          ["sessionStorage", "до закрытия вкладки", "около 5 МБ на сайт"],
          ["IndexedDB", "пока пользователь не очистит данные", "доля свободного места на диске (квота)"],
        ],
        [
          ["Cookie", "until the expiry set by the site, or until the browser closes", "about 4 KB per cookie"],
          ["localStorage", "until the user clears site data", "about 5 MB per site"],
          ["sessionStorage", "until the tab closes", "about 5 MB per site"],
          ["IndexedDB", "until the user clears site data", "a share of free disk space (quota)"],
        ],
      ),
    },
  ],
};

export const doNotTrack: ToolDef = {
  slug: "do-not-track",
  component: "what-is-my/privacy",
  icon: "ShieldCheck",
  name: { ru: "Do Not Track и GPC", en: "Do Not Track & GPC" },
  title: { ru: "Do Not Track и GPC — проверить сигналы приватности", en: "Do Not Track & GPC check — is it on in my browser?" },
  h1: { ru: "Do Not Track и Global Privacy Control: включены ли", en: "Do Not Track and Global Privacy Control: are they on?" },
  description: {
    ru: "Отправляет ли браузер сигналы Do Not Track (DNT) и Global Privacy Control (GPC), чем они отличаются, почему DNT устарел и где GPC имеет юридическую силу.",
    en: "Does your browser send Do Not Track (DNT) or Global Privacy Control (GPC)? How they differ, why DNT is deprecated and where GPC is legally binding.",
  },
  lead: {
    ru: "Показываем значения navigator.doNotTrack и navigator.globalPrivacyControl — ровно то, что видят сайты.",
    en: "We show navigator.doNotTrack and navigator.globalPrivacyControl — exactly what websites see.",
  },
  keywords: {
    ru: ["do not track", "dnt", "global privacy control", "gpc", "не отслеживать"],
    en: ["do not track", "dnt", "global privacy control", "gpc", "sec-gpc"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху состояние GPC и DNT.",
      "Чтобы включить GPC, используйте Firefox (настройка приватности), Brave или DuckDuckGo — или расширение для Chrome и Edge.",
      "После изменения настроек обновите страницу и проверьте ещё раз.",
    ],
    en: [
      "Open the page — the GPC and DNT status is at the top.",
      "To turn on GPC, use Firefox (a privacy setting), Brave or DuckDuckGo — or an extension for Chrome and Edge.",
      "After changing settings, reload the page and check again.",
    ],
  },
  about: {
    ru: [
      "Do Not Track — заголовок DNT: 1, который браузеры начали отправлять около 2010 года. Стандартом он так и не стал: сайты и рекламные сети вправе его игнорировать и почти всегда игнорируют. Safari убрал эту настройку в 2019 году, Firefox — в 2025-м.",
      "Global Privacy Control — заголовок Sec-GPC: 1 и свойство navigator.globalPrivacyControl — более новый сигнал «не продавайте и не передавайте мои данные». В Калифорнии (CCPA) и ряде других штатов США компании обязаны считать его законным отказом от продажи данных. Его поддерживают Firefox, Brave и DuckDuckGo.",
      "Оба сигнала — просьба, а не блокировка: они не удаляют cookie и не скрывают IP-адрес. Для реальной защиты нужны блокировка сторонних cookie и трекеров.",
    ],
    en: [
      "Do Not Track is the DNT: 1 header browsers started sending around 2010. It never became a binding standard: sites and ad networks may ignore it, and almost all do. Safari removed the setting in 2019, Firefox in 2025.",
      "Global Privacy Control — the Sec-GPC: 1 header and navigator.globalPrivacyControl — is a newer “do not sell or share my data” signal. In California (CCPA) and several other US states, businesses must treat it as a valid opt-out of data sales. Firefox, Brave and DuckDuckGo support it.",
      "Both signals are requests, not blockers: they don't delete cookies or hide your IP address. Real protection needs third-party cookie and tracker blocking.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как включить Do Not Track в Chrome?",
        a: "«Настройки → Конфиденциальность и безопасность → Сторонние файлы cookie» → включите отправку запроса «Не отслеживать» (Do Not Track). Настройка есть до сих пор, но большинство сайтов её игнорирует.",
      },
      {
        q: "Как включить Global Privacy Control?",
        a: "Firefox: «Настройки → Приватность и защита» → «Сообщать сайтам, чтобы они не продавали и не передавали мои данные». Brave и DuckDuckGo отправляют GPC по умолчанию. Для Chrome и Edge нужно расширение, например Privacy Badger.",
      },
      {
        q: "Обязаны ли сайты выполнять эти сигналы?",
        a: "DNT — нет. GPC — да, в Калифорнии и ещё нескольких штатах США (например, в Колорадо и Коннектикуте) для компаний, на которые распространяются их законы о приватности. В большинстве других стран прямого требования нет.",
      },
      {
        q: "Почему DNT «не поддерживается»?",
        a: "Safari с 2019 года не сообщает сайтам DNT: свойства navigator.doNotTrack там нет. Другие браузеры возвращают null или «unspecified», если настройка не задана.",
      },
    ],
    en: [
      {
        q: "How do I turn on Do Not Track in Chrome?",
        a: "Settings → Privacy and security → Third-party cookies → “Send a Do Not Track request with your browsing traffic”. The setting still exists, but most sites ignore it.",
      },
      {
        q: "How do I turn on Global Privacy Control?",
        a: "Firefox: Settings → Privacy & Security → “Tell websites not to sell or share my data”. Brave and DuckDuckGo send GPC by default. Chrome and Edge need an extension such as Privacy Badger.",
      },
      {
        q: "Do websites have to honour these signals?",
        a: "DNT — no. GPC — yes, in California and several other US states (Colorado and Connecticut, for example) for businesses covered by their privacy laws. Most other countries have no direct requirement.",
      },
      {
        q: "Why is DNT “not supported”?",
        a: "Since 2019 Safari doesn't send DNT at all: navigator.doNotTrack doesn't exist there. Other browsers return null or “unspecified” when the setting isn't chosen.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Do Not Track и Global Privacy Control", "Do Not Track vs Global Privacy Control"),
      head: ["", "Do Not Track", "Global Privacy Control"],
      rows: L(
        locale,
        [
          ["HTTP-заголовок", "DNT: 1", "Sec-GPC: 1"],
          ["Свойство в JavaScript", "navigator.doNotTrack", "navigator.globalPrivacyControl"],
          ["Статус", "устарел", "действующая спецификация"],
          ["Юридическая сила", "нет", "в Калифорнии и нескольких штатах США"],
          ["Где включается", "Chrome, Edge", "Firefox, Brave, DuckDuckGo, расширения"],
        ],
        [
          ["HTTP header", "DNT: 1", "Sec-GPC: 1"],
          ["JavaScript property", "navigator.doNotTrack", "navigator.globalPrivacyControl"],
          ["Status", "deprecated", "active specification"],
          ["Legal force", "none", "California and several other US states"],
          ["Where to enable", "Chrome, Edge", "Firefox, Brave, DuckDuckGo, extensions"],
        ],
      ),
    },
  ],
};

export const browserFeatures: ToolDef = {
  slug: "browser-feature-detection",
  component: "what-is-my/features",
  icon: "ListChecks",
  name: { ru: "Возможности браузера", en: "Browser features" },
  title: { ru: "Возможности браузера — проверка поддержки API онлайн", en: "Browser feature detection — check supported web APIs" },
  h1: { ru: "Что поддерживает мой браузер", en: "What does my browser support?" },
  description: {
    ru: `Проверка ${FEATURES.length} возможностей браузера: WebGPU, WebGL 2, WebCodecs, WebAssembly SIMD, WebAuthn, Web Bluetooth, WebUSB, CSS :has() и контейнерные запросы.`,
    en: `Test ${FEATURES.length} browser features: WebGPU, WebGL 2, WebCodecs, WebAssembly SIMD, WebAuthn, Web Bluetooth, WebUSB, File System Access, CSS :has() and container queries.`,
  },
  lead: {
    ru: "Таблица поддержки веб-API и возможностей CSS прямо в вашем браузере — без внешних сервисов.",
    en: "A support table of web APIs and CSS features, checked right in your browser — no external services.",
  },
  keywords: {
    ru: ["поддержка браузера", "webgpu", "webassembly", "feature detection", "что умеет браузер"],
    en: ["browser support", "webgpu support", "webassembly", "feature detection", "web api support"],
  },
  howTo: {
    ru: [
      "Откройте страницу — проверка займёт долю секунды.",
      "Переключите фильтр на «Нет», чтобы увидеть только недостающие возможности.",
      "Кнопка «Копировать» сохранит отчёт со всеми пунктами — удобно для баг-репорта.",
      "Если нужной возможности нет, обновите браузер или попробуйте другой: WebUSB, Web Serial и доступ к файлам есть только в Chromium.",
    ],
    en: [
      "Open the page — the check takes a fraction of a second.",
      "Switch the filter to “Missing” to see only the features you lack.",
      "Copy saves a report with every item — handy for bug reports.",
      "If a feature is missing, update the browser or try another: WebUSB, Web Serial and File System Access exist only in Chromium.",
    ],
  },
  about: {
    ru: [
      "Каждая строка — отдельная проверка наличия API: WebGPU определяется по navigator.gpu, WebCodecs — по VideoEncoder, возможности CSS — через CSS.supports(). Поддержка SIMD и потоков WebAssembly проверяется валидацией крошечного встроенного wasm-модуля, без загрузки файлов.",
      "Наличие API ещё не гарантирует доступ: камера, Bluetooth и уведомления спрашивают разрешение, WebGPU может не найти подходящий видеоадаптер, а SharedArrayBuffer полноценно работает только на страницах с изоляцией (crossOriginIsolated).",
    ],
    en: [
      "Each row is a separate presence check: WebGPU is detected via navigator.gpu, WebCodecs via VideoEncoder, CSS features via CSS.supports(). WebAssembly SIMD and threads are checked by validating a tiny built-in wasm module, with no downloads.",
      "Having an API doesn't guarantee access: the camera, Bluetooth and notifications ask for permission, WebGPU may find no suitable adapter, and SharedArrayBuffer fully works only on cross-origin-isolated pages (crossOriginIsolated).",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему в Firefox и Safari меньше возможностей?",
        a: "Часть API — WebUSB, Web Serial, WebHID, Web Bluetooth, File System Access — продвигает Google, а Mozilla и Apple отказались их внедрять из-за рисков для приватности и безопасности. Поэтому они есть только в Chrome, Edge, Opera и других браузерах на Chromium.",
      },
      {
        q: "Что такое WebGPU и где он работает?",
        a: "Новый API для графики и вычислений на видеокарте, преемник WebGL. Работает в Chrome и Edge начиная с версии 113, в Safari 26 и в Firefox 141 на Windows.",
      },
      {
        q: "Как проверять поддержку на своём сайте?",
        a: "Так же, как здесь: проверкой наличия возможности (feature detection), а не версии браузера по User-Agent. Таблицы совместимости есть на caniuse.com и в справочнике MDN.",
      },
    ],
    en: [
      {
        q: "Why do Firefox and Safari show fewer features?",
        a: "Some APIs — WebUSB, Web Serial, WebHID, Web Bluetooth, File System Access — are driven by Google, and Mozilla and Apple declined to ship them over privacy and security concerns. So they exist only in Chrome, Edge, Opera and other Chromium browsers.",
      },
      {
        q: "What is WebGPU and where does it work?",
        a: "A new API for GPU graphics and compute, the successor to WebGL. It works in Chrome and Edge from version 113, in Safari 26 and in Firefox 141 on Windows.",
      },
      {
        q: "How should my own site check support?",
        a: "The same way as here: by checking whether a feature exists (feature detection), not by reading the browser version from the User-Agent. Compatibility tables are on caniuse.com and MDN.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Что проверяется", "What is checked"),
      head: L(locale, ["Группа", "Возможностей"], ["Group", "Features"]),
      rows: FEATURE_GROUPS.map((g) => [tr(g.name, locale), String(FEATURES.filter((f) => f.group === g.id).length)]),
    },
  ],
};

export const systemInfo: ToolDef = {
  slug: "system-info",
  component: "what-is-my/summary",
  icon: "ClipboardList",
  name: { ru: "Информация о системе", en: "System info" },
  title: { ru: "Информация о системе и браузере — отчёт для техподдержки", en: "System info — my browser, OS and screen in one report" },
  h1: { ru: "Информация о моей системе и браузере", en: "My system and browser info" },
  description: {
    ru: "Браузер, ОС, разрешение экрана, окно, часовой пояс, язык, ядра, память, cookie и JavaScript — 12 параметров одним списком и отчёт для техподдержки.",
    en: "Browser, OS, screen resolution, window size, time zone, language, CPU cores, memory, cookies and JavaScript — 12 details in one list, ready to copy for support.",
  },
  lead: {
    ru: "Всё главное о вашем браузере и устройстве на одной странице — и готовый текст для техподдержки.",
    en: "The key facts about your browser and device on one page — plus ready-to-paste text for support.",
  },
  keywords: {
    ru: ["информация о системе", "параметры браузера", "отчёт для поддержки", "данные устройства", "system info"],
    en: ["system info", "browser info", "support report", "device details", "my computer info"],
  },
  howTo: {
    ru: [
      "Откройте страницу — параметры определятся за секунду.",
      "Нажмите «Скопировать отчёт» и вставьте текст в письмо или чат техподдержки.",
      "Нажмите на название любого параметра, чтобы открыть подробную проверку.",
    ],
    en: [
      "Open the page — the details are detected within a second.",
      "Click “Copy report” and paste the text into an email or support chat.",
      "Click any label to open the detailed check for that item.",
    ],
  },
  about: {
    ru: [
      "Техподдержка сайтов и программ почти всегда спрашивает одно и то же: какой браузер и версия, какая система, какой экран. Эта страница собирает ответы в один список и превращает его в текст, который можно вставить в обращение.",
      "Все значения определяются скриптом прямо в браузере — теми же методами, что и на подробных страницах: Client Hints и User-Agent, screen и devicePixelRatio, Intl. Отчёт никуда не отправляется, пока вы сами его не скопируете.",
    ],
    en: [
      "Support teams nearly always ask the same things: which browser and version, which OS, which screen. This page gathers the answers in one list and turns it into text you can paste into a ticket.",
      "Every value is detected by a script right in your browser, using the same methods as the detailed pages: Client Hints and User-Agent, screen and devicePixelRatio, Intl. The report goes nowhere until you copy it yourself.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Что входит в отчёт?",
        a: "Браузер с полной версией, операционная система, тип устройства, разрядность, физическое разрешение экрана и Device Pixel Ratio, размер окна, часовой пояс, язык, число логических процессоров, объём памяти (если браузер его сообщает), состояние cookie и JavaScript.",
      },
      {
        q: "Есть ли в отчёте IP-адрес или личные данные?",
        a: "Нет. Инструмент не делает сетевых запросов и не узнаёт IP-адрес, имя пользователя или местоположение — только параметры браузера и экрана.",
      },
      {
        q: "Почему память «недоступна»?",
        a: "Объём памяти сообщают только браузеры на Chromium (Chrome, Edge, Opera, Яндекс Браузер). Firefox и Safari его скрывают.",
      },
    ],
    en: [
      {
        q: "What does the report include?",
        a: "Browser with full version, operating system, device type, bitness, physical screen resolution and Device Pixel Ratio, window size, time zone, language, logical processor count, memory (if the browser reports it), and cookie and JavaScript status.",
      },
      {
        q: "Does the report contain my IP address or personal data?",
        a: "No. The tool makes no network requests and doesn't learn your IP address, user name or location — only browser and screen parameters.",
      },
      {
        q: "Why is memory “not available”?",
        a: "Only Chromium browsers (Chrome, Edge, Opera) report device memory. Firefox and Safari hide it.",
      },
    ],
  },
};
