import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";
import { MACOS_NAMES } from "../lib/ua";

const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);

const MACOS_YEARS: Record<number, number> = { 11: 2020, 12: 2021, 13: 2022, 14: 2023, 15: 2024, 26: 2025 };

export const browser: ToolDef = {
  slug: "what-is-my-browser",
  component: "what-is-my/browser",
  icon: "Globe",
  popular: true,
  name: { ru: "Мой браузер", en: "My browser" },
  title: { ru: "Какой у меня браузер — узнать версию браузера онлайн", en: "What browser am I using? Check your browser version" },
  h1: { ru: "Какой у меня браузер", en: "What browser am I using?" },
  description: {
    ru: "Узнайте свой браузер и его точную версию: Chrome, Яндекс Браузер, Firefox, Safari, Edge или Opera. Плюс движок, ОС и полная версия из Client Hints.",
    en: "Find out which browser you use and its exact version: Chrome, Firefox, Safari, Edge, Opera or Brave — plus the engine, OS and full version from Client Hints.",
  },
  lead: {
    ru: "Название и точная версия вашего браузера определяются сразу при открытии страницы.",
    en: "Your browser's name and exact version are detected as soon as the page opens.",
  },
  keywords: {
    ru: ["версия браузера", "узнать браузер", "какой браузер", "мой браузер", "версия chrome"],
    en: ["browser version", "which browser", "my browser", "chrome version", "what browser do i have"],
  },
  howTo: {
    ru: [
      "Откройте страницу — название браузера и основная версия появятся вверху.",
      "Полная версия (например, 138.0.7204.50) показана под названием: именно её обычно спрашивает техподдержка.",
      "Нажмите «Копировать», чтобы вставить строку «браузер, версия, движок, ОС» в письмо или чат.",
      "Чтобы обновиться, откройте в браузере страницу «О браузере» из таблицы выше — проверка обновлений запустится сама.",
    ],
    en: [
      "Open the page — the browser name and major version appear at the top.",
      "The full version (for example 138.0.7204.50) is shown below the name — that's what support teams usually ask for.",
      "Click Copy to paste a “browser, version, engine, OS” line into an email or chat.",
      "To update, open the browser's About page from the table above — the update check starts automatically.",
    ],
  },
  about: {
    ru: [
      "Сайты узнают браузер двумя способами. Старый — строка User-Agent, которую браузер отправляет с каждым запросом. Chrome, Edge и другие браузеры на Chromium её «заморозили»: минорная часть версии всегда 0.0.0, а система указана приблизительно. Новый способ — User-Agent Client Hints: по запросу браузер сообщает точную версию, платформу и архитектуру.",
      "Инструмент сначала спрашивает Client Hints и только если их нет (Firefox, Safari) разбирает строку User-Agent библиотекой ua-parser-js. Поэтому для Chrome показана полная версия, а не 138.0.0.0. Браузеры на одном движке различаются по «брендам» в Client Hints: у Edge это Microsoft Edge, у Яндекс Браузера — YaBrowser.",
      "Почти все браузеры на iPhone и iPad работают на движке WebKit, даже если называются Chrome или Firefox: так долго требовала Apple, а другие движки разрешены только в ЕС начиная с iOS 17.4.",
    ],
    en: [
      "Websites identify your browser in two ways. The old one is the User-Agent string sent with every request. Chrome, Edge and other Chromium browsers have frozen it: the minor version is always 0.0.0 and the OS is approximate. The new one is User-Agent Client Hints: on request the browser reports its exact version, platform and architecture.",
      "This tool asks for Client Hints first and only falls back to parsing the User-Agent with ua-parser-js when they're missing (Firefox, Safari). That's why Chrome shows its full version rather than 138.0.0.0. Browsers sharing an engine are told apart by Client Hints “brands”: Microsoft Edge, Opera, Brave, YaBrowser.",
      "Almost every browser on iPhone and iPad runs on Apple's WebKit engine, even when it's called Chrome or Firefox — Apple long required it, and other engines are allowed only in the EU since iOS 17.4.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как узнать версию браузера вручную?",
        a: "Chrome: меню ⋮ → «Справка» → «О браузере Google Chrome» (chrome://settings/help). Яндекс Браузер: адрес browser://help. Firefox: меню ☰ → «Справка» → «О Firefox». Edge: edge://settings/help. Safari: меню Safari → «О Safari».",
      },
      {
        q: "Почему Chrome в User-Agent пишет версию 138.0.0.0?",
        a: "Это «сокращённый» User-Agent: начиная с Chrome 101 Google поэтапно заморозила строку, чтобы сайтам было труднее отслеживать пользователей. Точная версия доступна через Client Hints — её и показывает этот инструмент.",
      },
      {
        q: "У меня другой браузер, а определился Chrome. Почему?",
        a: "Многие браузеры на Chromium (например, Vivaldi и Arc) намеренно представляются как Chrome, чтобы сайты работали без ошибок. Если браузер не добавляет своё имя ни в User-Agent, ни в Client Hints, отличить его от Chrome невозможно.",
      },
      {
        q: "Как обновить браузер?",
        a: "Chrome, Edge, Яндекс Браузер, Opera и Firefox обновляются автоматически — достаточно открыть страницу «О браузере» и перезапустить его. Safari обновляется вместе с macOS или iOS через «Обновление ПО».",
      },
      {
        q: "Данные о браузере куда-то отправляются?",
        a: "Нет. Определение выполняется скриптом в вашем браузере, ничего не отправляется на сервер и не сохраняется.",
      },
    ],
    en: [
      {
        q: "How do I check my browser version manually?",
        a: "Chrome: menu ⋮ → Help → About Google Chrome (chrome://settings/help). Firefox: menu ☰ → Help → About Firefox. Edge: edge://settings/help. Opera: opera://about. Safari: Safari menu → About Safari.",
      },
      {
        q: "Why does Chrome's User-Agent say 138.0.0.0?",
        a: "That's the reduced User-Agent: starting with Chrome 101 Google froze the string step by step to make tracking harder. The exact version is available through Client Hints, which is what this tool shows.",
      },
      {
        q: "I use a different browser but it was detected as Chrome. Why?",
        a: "Many Chromium browsers (Vivaldi and Arc, for example) deliberately present themselves as Chrome so websites don't break. If a browser adds its name neither to the User-Agent nor to Client Hints, it can't be told apart from Chrome.",
      },
      {
        q: "How do I update my browser?",
        a: "Chrome, Edge, Opera, Brave and Firefox update automatically — open the About page and restart the browser. Safari updates together with macOS or iOS via Software Update.",
      },
      {
        q: "Is my browser data sent anywhere?",
        a: "No. Detection runs as a script in your browser; nothing is sent to a server or stored.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Где посмотреть версию в разных браузерах", "Where to find the version in each browser"),
      head: L(locale, ["Браузер", "Путь в меню", "Адрес"], ["Browser", "Menu path", "Address"]),
      rows: L(
        locale,
        [
          ["Google Chrome", "⋮ → Справка → О браузере Google Chrome", "chrome://settings/help"],
          ["Яндекс Браузер", "☰ → Дополнительно → О браузере", "browser://help"],
          ["Microsoft Edge", "… → Справка и отзывы → О Microsoft Edge", "edge://settings/help"],
          ["Mozilla Firefox", "☰ → Справка → О Firefox", "about:support"],
          ["Opera", "Меню → Обновление и восстановление", "opera://about"],
          ["Safari", "Safari → О Safari", "—"],
        ],
        [
          ["Google Chrome", "⋮ → Help → About Google Chrome", "chrome://settings/help"],
          ["Microsoft Edge", "… → Help and feedback → About Microsoft Edge", "edge://settings/help"],
          ["Mozilla Firefox", "☰ → Help → About Firefox", "about:support"],
          ["Opera", "Menu → Update & Recovery", "opera://about"],
          ["Brave", "☰ → About Brave", "brave://settings/help"],
          ["Safari", "Safari → About Safari", "—"],
        ],
      ),
    },
  ],
};

export const os: ToolDef = {
  slug: "what-is-my-os",
  component: "what-is-my/os",
  icon: "Laptop",
  popular: true,
  name: { ru: "Моя операционная система", en: "My operating system" },
  title: { ru: "Какая у меня операционная система — узнать ОС и версию", en: "What OS do I have? Check your operating system version" },
  h1: { ru: "Какая у меня операционная система", en: "What operating system do I have?" },
  description: {
    ru: "Определяем ОС и версию: Windows 10 или 11, macOS с названием, Android, iOS, Linux. Windows 11 распознаётся по Client Hints — строка User-Agent её не отличает.",
    en: "Your operating system and version: Windows 10 or 11, macOS with its name, Android, iOS, Linux. Windows 11 is found via Client Hints — the UA can't tell.",
  },
  lead: {
    ru: "Версия системы берётся из Client Hints, а если их нет — из строки User-Agent, с честной пометкой о точности.",
    en: "The OS version comes from Client Hints, or from the User-Agent string when they're missing — with an honest note on accuracy.",
  },
  keywords: {
    ru: ["версия windows", "windows 10 или 11", "какая ос", "версия macos", "версия android", "узнать систему"],
    en: ["windows version", "windows 10 or 11", "which os", "macos version", "android version", "my os"],
  },
  howTo: {
    ru: [
      "Откройте страницу — система и её версия появятся вверху.",
      "Если видите «Windows 10 / 11», откройте страницу в Chrome или Edge: они сообщают точную версию. Или выполните winver (Win + R).",
      "Архитектура и разрядность показаны в подробностях; ещё больше — на странице «32 или 64 бит».",
      "Нажмите «Копировать», чтобы отправить версию системы в техподдержку.",
    ],
    en: [
      "Open the page — the OS and its version appear at the top.",
      "If you see “Windows 10 / 11”, open the page in Chrome or Edge — they report the exact version. Or run winver (Win + R).",
      "Architecture and bitness are in the details; there's more on the “32 or 64-bit” page.",
      "Click Copy to send the OS version to a support team.",
    ],
  },
  about: {
    ru: [
      "Строка User-Agent плохо подходит для определения системы: Windows 11 в ней выглядит как «Windows NT 10.0», любая macOS — как 10.15.7, а Chrome на Android пишет «Android 10; K» независимо от реальной версии. Поэтому сначала запрашиваются Client Hints: Chrome, Edge, Opera и Яндекс Браузер сообщают через них точную версию платформы.",
      "Microsoft рекомендует отличать Windows 11 так: значение Sec-CH-UA-Platform-Version 13 и выше — Windows 11, от 1 до 10 — Windows 10. Для macOS инструмент добавляет название версии (Sonoma, Sequoia, Tahoe), а для iOS 26 берёт версию из версии Safari: с этого выпуска Safari замораживает версию iOS в User-Agent на 18.6.",
      "Если точную версию узнать невозможно, инструмент так и пишет — вместо того чтобы угадывать.",
    ],
    en: [
      "The User-Agent string is a poor way to detect the OS: Windows 11 appears as “Windows NT 10.0”, every macOS as 10.15.7, and Chrome on Android says “Android 10; K” whatever the real version. So Client Hints are queried first: Chrome, Edge, Opera and other Chromium browsers report the exact platform version through them.",
      "Microsoft's guidance for spotting Windows 11: a Sec-CH-UA-Platform-Version of 13 or higher means Windows 11, 1 to 10 means Windows 10. For macOS the tool adds the release name (Sonoma, Sequoia, Tahoe); for iOS 26 it takes the version from Safari's own version, because since that release Safari freezes the iOS version in the User-Agent at 18.6.",
      "When the exact version can't be known, the tool says so instead of guessing.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как узнать версию Windows без браузера?",
        a: "Нажмите Win + R, введите winver и нажмите Enter — откроется окно с версией и номером сборки. Другой путь: «Параметры → Система → О системе» — там указаны выпуск и версия.",
      },
      {
        q: "Почему Firefox не отличает Windows 11 от Windows 10?",
        a: "Firefox и Safari не поддерживают Client Hints, а в строке User-Agent обе системы записаны как Windows NT 10.0 — Microsoft оставила этот номер ради совместимости со старыми программами.",
      },
      {
        q: "Почему на Mac написано просто «macOS» без версии?",
        a: "Safari и Firefox всегда сообщают macOS 10.15.7, какая бы версия ни стояла. Точная версия — в меню Apple → «Об этом Mac». В Chrome инструмент увидит её через Client Hints.",
      },
      {
        q: "Как узнать версию Android или iOS?",
        a: "Android: «Настройки → О телефоне → Версия Android» (названия пунктов зависят от производителя). iPhone и iPad: «Настройки → Основные → Об этом устройстве».",
      },
    ],
    en: [
      {
        q: "How do I check my Windows version without a browser?",
        a: "Press Win + R, type winver and press Enter — a window shows the version and build number. Or open Settings → System → About, which lists the edition and version.",
      },
      {
        q: "Why can't Firefox tell Windows 11 from Windows 10?",
        a: "Firefox and Safari don't support Client Hints, and in the User-Agent string both systems are “Windows NT 10.0” — Microsoft kept that number for compatibility with old software.",
      },
      {
        q: "Why does my Mac show just “macOS” without a version?",
        a: "Safari and Firefox always report macOS 10.15.7, whatever version you run. The exact one is in Apple menu → About This Mac. In Chrome the tool reads it from Client Hints.",
      },
      {
        q: "How do I check my Android or iOS version?",
        a: "Android: Settings → About phone → Android version (menu names vary by manufacturer). iPhone and iPad: Settings → General → About.",
      },
    ],
  },
  blocks: (locale): Block[] => [
    {
      type: "table",
      title: L(locale, "Версии macOS и их названия", "macOS versions and names"),
      head: L(locale, ["Версия", "Название", "Год выхода"], ["Version", "Name", "Released"]),
      rows: MACOS_NAMES.map(([v, n]) => [`macOS ${v}`, n, String(MACOS_YEARS[v] ?? "")]),
    },
    {
      type: "table",
      title: L(locale, "Как Client Hints сообщают версию Windows", "How Client Hints report the Windows version"),
      head: L(locale, ["Sec-CH-UA-Platform-Version", "Система"], ["Sec-CH-UA-Platform-Version", "System"]),
      rows: [
        ["0.1.0", "Windows 7"],
        ["0.2.0", "Windows 8"],
        ["0.3.0", "Windows 8.1"],
        ["1.0.0 – 10.0.0", "Windows 10"],
        [L(locale, "13.0.0 и выше", "13.0.0 and higher"), "Windows 11"],
      ],
      mono: true,
    },
  ],
};

export const device: ToolDef = {
  slug: "what-is-my-device",
  related: ["touch-screen-test", "webcam-test", "microphone-test", "keyboard-test"],
  component: "what-is-my/device",
  icon: "Smartphone",
  name: { ru: "Моё устройство", en: "My device" },
  title: { ru: "Какое у меня устройство — тип, модель и сенсорный экран", en: "What device am I using? Type, model and touch screen" },
  h1: { ru: "Какое у меня устройство", en: "What device am I using?" },
  description: {
    ru: "Тип устройства (смартфон, планшет, компьютер), производитель и модель, сенсорный экран и число точек касания, основной указатель — мышь или палец.",
    en: "Your device type (phone, tablet or computer), vendor and model, touch screen and touch points, and whether your primary pointer is a mouse or a finger.",
  },
  lead: {
    ru: "Тип устройства, модель и способы ввода — по данным браузера, без установки приложений.",
    en: "Device type, model and input methods as reported by the browser — no apps to install.",
  },
  keywords: {
    ru: ["модель телефона", "тип устройства", "сенсорный экран", "мультитач", "какой у меня телефон"],
    en: ["phone model", "device type", "touch screen", "multitouch", "what phone do i have"],
  },
  howTo: {
    ru: [
      "Откройте страницу на устройстве, которое хотите проверить.",
      "Вверху — тип устройства и, если браузер её сообщает, модель.",
      "В подробностях — сенсорный экран, число точек касания, основной указатель и поддержка наведения курсора.",
      "Нажмите «Копировать», чтобы отправить тип и модель в чат поддержки.",
    ],
    en: [
      "Open the page on the device you want to check.",
      "The device type and, if the browser reports it, the model are shown at the top.",
      "The details list the touch screen, touch points, primary pointer and hover support.",
      "Click Copy to send the type and model to a support chat.",
    ],
  },
  about: {
    ru: [
      "Тип устройства определяется по User-Agent и признаку mobile из Client Hints, а iPad, который представляется компьютером Mac, — по сенсорному экрану. Модель браузеры раскрывают только на Android: Chrome передаёт её через Client Hints (например, SM-S918B). iPhone сообщает лишь «iPhone» без поколения, а компьютеры не сообщают ни производителя, ни модель.",
      "Способ ввода берётся из медиазапросов CSS: pointer: fine — точный указатель (мышь, тачпад, стилус), pointer: coarse — палец, hover — можно ли навести курсор. По ним сайты решают, увеличивать ли кнопки. Число точек касания — navigator.maxTouchPoints: у современных телефонов обычно от 5 до 10.",
    ],
    en: [
      "The device type comes from the User-Agent and the Client Hints mobile flag; an iPad that presents itself as a Mac is recognised by its touch screen. Browsers reveal the model only on Android: Chrome sends it through Client Hints (for example SM-S918B). iPhone says just “iPhone” with no generation, and computers report neither vendor nor model.",
      "Input capabilities come from CSS media queries: pointer: fine is a precise pointer (mouse, touchpad, stylus), pointer: coarse is a finger, hover tells whether you can hover. Websites use them to decide whether to enlarge buttons. Touch points are navigator.maxTouchPoints — typically 5 to 10 on modern phones.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему не показывается модель моего телефона?",
        a: "Safari на iPhone модель не сообщает. На Android модель скрыта в сокращённом User-Agent (там стоит «K»), но Chrome отдаёт её через Client Hints; Firefox для Android — нет. Модель всегда можно посмотреть в «Настройки → О телефоне».",
      },
      {
        q: "Ноутбук с сенсорным экраном определился как компьютер — это ошибка?",
        a: "Нет: тип определяется по системе, а сенсорный экран показан отдельной строкой. Основной указатель у такого ноутбука — тачпад (fine), а палец — дополнительный, он виден в строке «Все указатели».",
      },
      {
        q: "Можно ли узнать серийный номер, IMEI или MAC-адрес?",
        a: "Нет. Браузеры не дают сайтам доступ к серийным номерам, IMEI и MAC-адресам — это защищает от слежки.",
      },
      {
        q: "Как проверить экран, клавиатуру или мышь?",
        a: "Для этого есть отдельные тесты устройств: там можно нажать клавиши, провести пальцем по экрану и проверить мультитач.",
      },
    ],
    en: [
      {
        q: "Why isn't my phone model shown?",
        a: "Safari on iPhone never reports the model. On Android the model is hidden in the reduced User-Agent (it says “K”), but Chrome sends it through Client Hints; Firefox for Android doesn't. You can always find it in Settings → About phone.",
      },
      {
        q: "My touch-screen laptop is detected as a computer — is that wrong?",
        a: "No: the type follows the operating system, and the touch screen is listed separately. Such a laptop's primary pointer is the touchpad (fine); the finger is an additional one, shown under “All pointers”.",
      },
      {
        q: "Can a website see my serial number, IMEI or MAC address?",
        a: "No. Browsers don't expose serial numbers, IMEI or MAC addresses to websites — that protects you from tracking.",
      },
      {
        q: "How do I test my screen, keyboard or mouse?",
        a: "There are separate device tests for that: press keys, swipe across the screen and check multitouch.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Медиазапросы, по которым сайты узнают способ ввода", "Media queries websites use to detect input"),
      head: L(locale, ["Запрос", "Что означает"], ["Query", "Meaning"]),
      rows: L(
        locale,
        [
          ["pointer: fine", "Основной указатель точный: мышь, тачпад или стилус"],
          ["pointer: coarse", "Основной указатель — палец на сенсорном экране"],
          ["pointer: none", "Указателя нет (например, телевизор с пультом)"],
          ["hover: hover", "Можно навести курсор, не нажимая"],
          ["any-pointer: coarse", "Среди всех указателей есть сенсорный"],
        ],
        [
          ["pointer: fine", "The primary pointer is precise: mouse, touchpad or stylus"],
          ["pointer: coarse", "The primary pointer is a finger on a touch screen"],
          ["pointer: none", "No pointer at all (for example a TV with a remote)"],
          ["hover: hover", "You can hover without clicking"],
          ["any-pointer: coarse", "At least one of the pointers is touch"],
        ],
      ),
    },
  ],
};

export const userAgent: ToolDef = {
  slug: "what-is-my-user-agent",
  component: "what-is-my/user-agent",
  icon: "Fingerprint",
  popular: true,
  name: { ru: "Мой User-Agent", en: "My user agent" },
  title: { ru: "Мой User-Agent — посмотреть и скопировать строку онлайн", en: "What is my user agent? View and copy your UA string" },
  h1: { ru: "Какой у меня User-Agent", en: "What is my user agent?" },
  description: {
    ru: "Строка User-Agent вашего браузера с расшифровкой: браузер, движок, ОС, устройство, архитектура. Плюс данные Client Hints — копирование одним нажатием.",
    en: "Your browser's User-Agent string decoded: browser, engine, OS, device and architecture. Plus the User-Agent Client Hints data — copy it with one click.",
  },
  lead: {
    ru: "Строка User-Agent, которую ваш браузер отправляет каждому сайту, и её расшифровка.",
    en: "The User-Agent string your browser sends to every website, decoded.",
  },
  keywords: {
    ru: ["user agent", "юзер агент", "строка браузера", "client hints", "useragent"],
    en: ["user agent string", "ua string", "client hints", "useragent", "my user agent"],
  },
  howTo: {
    ru: [
      "Строка User-Agent появится вверху — нажмите «Копировать», чтобы отправить её разработчику или в поддержку.",
      "Ниже — что из неё извлекается: браузер, движок, ОС, устройство и архитектура.",
      "Если браузер поддерживает Client Hints, внизу можно раскрыть блок с точной версией, платформой и архитектурой в формате JSON.",
    ],
    en: [
      "The User-Agent string appears at the top — click Copy to send it to a developer or support team.",
      "Below is what can be read from it: browser, engine, OS, device and architecture.",
      "If your browser supports Client Hints, expand the block at the bottom to see the exact version, platform and architecture as JSON.",
    ],
  },
  about: {
    ru: [
      "User-Agent — строка, которую браузер отправляет в заголовке каждого HTTP-запроса и отдаёт скриптам через navigator.userAgent. Исторически она обросла «масками»: почти каждая начинается с Mozilla/5.0, Chrome упоминает AppleWebKit и Safari, а Edge — ещё и Chrome. Так браузеры добивались, чтобы сайты не отдавали им упрощённые версии.",
      "Строка раскрывает много данных о пользователе, поэтому Chrome начиная с версии 101 постепенно её сократил: версия превратилась в 138.0.0.0, модель Android-телефона — в «K», а Windows 11 и новые macOS не отличаются от старых. Точные сведения теперь выдаются по запросу через User-Agent Client Hints (navigator.userAgentData).",
    ],
    en: [
      "The User-Agent is a string the browser sends in the header of every HTTP request and exposes to scripts as navigator.userAgent. Over the years it collected “disguises”: nearly all start with Mozilla/5.0, Chrome mentions AppleWebKit and Safari, and Edge mentions Chrome too — so that websites wouldn't serve them stripped-down pages.",
      "Because the string reveals a lot about the user, Chrome gradually reduced it from version 101: the version became 138.0.0.0, the Android phone model became “K”, and Windows 11 and new macOS releases look like old ones. Precise details are now given on request through User-Agent Client Hints (navigator.userAgentData).",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как изменить User-Agent?",
        a: "Chrome и Edge: инструменты разработчика (F12) → меню ⋮ → More tools → Network conditions → снимите «Use browser default» и выберите строку. Firefox: параметр general.useragent.override в about:config. Safari: меню «Разработка» → «User Agent». Для постоянной подмены есть расширения.",
      },
      {
        q: "Можно ли по User-Agent меня отследить?",
        a: "Сама строка одинакова у миллионов людей с тем же браузером и системой, но вместе с разрешением экрана, шрифтами и часовым поясом она входит в «отпечаток» браузера. Поэтому браузеры её и сокращают.",
      },
      {
        q: "Что такое Client Hints?",
        a: "Замена User-Agent: по умолчанию браузер сообщает минимум (бренд, основную версию, платформу, мобильный ли), а полную версию, версию ОС, архитектуру и модель — только по запросу сайта. Поддерживаются в Chrome, Edge, Opera и Яндекс Браузере, но не в Firefox и Safari.",
      },
      {
        q: "Почему в строке Chrome написано Safari и Mozilla?",
        a: "Ради совместимости: когда-то сайты проверяли эти слова, чтобы отдавать полноценную версию. Браузеры продолжают их писать, чтобы старые сайты не ломались.",
      },
    ],
    en: [
      {
        q: "How do I change my User-Agent?",
        a: "Chrome and Edge: DevTools (F12) → ⋮ menu → More tools → Network conditions → untick “Use browser default” and pick a string. Firefox: set general.useragent.override in about:config. Safari: Develop menu → User Agent. Extensions can change it permanently.",
      },
      {
        q: "Can I be tracked by my User-Agent?",
        a: "The string itself is shared by millions of people with the same browser and OS, but combined with screen size, fonts and time zone it becomes part of a browser fingerprint. That's why browsers are reducing it.",
      },
      {
        q: "What are Client Hints?",
        a: "The User-Agent's replacement: by default the browser sends the minimum (brand, major version, platform, mobile or not), and the full version, OS version, architecture and model only when a site asks. Supported by Chrome, Edge and Opera, but not Firefox or Safari.",
      },
      {
        q: "Why does Chrome's string mention Safari and Mozilla?",
        a: "Compatibility: long ago websites checked for those words before serving full pages. Browsers keep them so old sites don't break.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Из чего состоит строка User-Agent (пример Chrome на Windows)", "Anatomy of a User-Agent string (Chrome on Windows)"),
      head: L(locale, ["Фрагмент", "Что означает"], ["Token", "Meaning"]),
      rows: L(
        locale,
        [
          ["Mozilla/5.0", "Исторический маркер совместимости — есть у всех браузеров"],
          ["Windows NT 10.0", "Windows 10 или Windows 11 — по строке их не отличить"],
          ["Win64; x64", "64-битный браузер на 64-битной Windows"],
          ["AppleWebKit/537.36 (KHTML, like Gecko)", "Движок Blink (наследник WebKit), версия заморожена"],
          ["Chrome/138.0.0.0", "Chrome 138; минорная часть версии заморожена"],
          ["Safari/537.36", "Ещё один маркер совместимости"],
        ],
        [
          ["Mozilla/5.0", "Historical compatibility token — every browser has it"],
          ["Windows NT 10.0", "Windows 10 or Windows 11 — the string can't tell them apart"],
          ["Win64; x64", "64-bit browser on 64-bit Windows"],
          ["AppleWebKit/537.36 (KHTML, like Gecko)", "The Blink engine (a WebKit fork), frozen version"],
          ["Chrome/138.0.0.0", "Chrome 138; the minor version is frozen"],
          ["Safari/537.36", "Another compatibility token"],
        ],
      ),
    },
  ],
};

export const bitness: ToolDef = {
  slug: "32-or-64-bit",
  component: "what-is-my/bitness",
  icon: "Binary",
  popular: true,
  name: { ru: "32 или 64 бит", en: "32 or 64-bit" },
  title: { ru: "32 или 64 бит — узнать разрядность системы онлайн", en: "Is my system 32 or 64-bit? Check bitness online" },
  h1: { ru: "Какая у меня разрядность: 32 или 64 бит", en: "Is my computer 32-bit or 64-bit?" },
  description: {
    ru: "Разрядность системы и браузера: 32 или 64 бит, x86-64 или ARM64. Определяем по Client Hints или по признакам Win64, WOW64, x86_64 и aarch64 в User-Agent.",
    en: "Is your system and browser 32 or 64-bit, and is the CPU x86-64 or ARM64? Detected via Client Hints or the Win64, WOW64, x86_64 and aarch64 UA tokens.",
  },
  lead: {
    ru: "Разрядность системы и браузера — по Client Hints или по признакам в строке User-Agent.",
    en: "System and browser bitness from Client Hints or from tokens in the User-Agent string.",
  },
  keywords: {
    ru: ["разрядность системы", "32 или 64", "x64 или x86", "разрядность windows", "битность"],
    en: ["32 or 64 bit", "system bitness", "x64 or x86", "windows bitness", "arm64"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху разрядность системы, ниже — разрядность браузера и архитектура процессора.",
      "Если браузер 32-битный, а система 64-битная, скачайте 64-битную версию браузера с официального сайта.",
      "Если браузер не сообщает разрядность, проверьте её в системе — способы описаны в ответах ниже.",
    ],
    en: [
      "Open the page — the system bitness is at the top, the browser bitness and CPU architecture below.",
      "If the browser is 32-bit on a 64-bit system, download the 64-bit build from the official site.",
      "If the browser doesn't reveal bitness, check it in the OS — see the answers below.",
    ],
  },
  about: {
    ru: [
      "Chrome, Edge и другие браузеры на Chromium сообщают архитектуру (x86 или ARM), разрядность и признак WoW64 через Client Hints — это самый надёжный способ. WoW64 означает, что 32-битный браузер запущен на 64-битной Windows.",
      "Firefox и Safari Client Hints не поддерживают, поэтому разрядность определяется по строке User-Agent и navigator.platform: «Win64; x64» — 64-битный браузер на 64-битной Windows, «WOW64» — 32-битный на 64-битной, «x86_64» и «aarch64» — 64-битный Linux или Android, «i686» и «armv7l» — 32-битные системы. macOS начиная с 10.15 и iOS начиная с 11 бывают только 64-битными.",
      "Если признаков нет, инструмент честно пишет, что разрядность неизвестна, а не угадывает.",
    ],
    en: [
      "Chrome, Edge and other Chromium browsers report the architecture (x86 or ARM), bitness and a WoW64 flag through Client Hints — the most reliable source. WoW64 means a 32-bit browser running on 64-bit Windows.",
      "Firefox and Safari don't support Client Hints, so bitness comes from the User-Agent string and navigator.platform: “Win64; x64” is a 64-bit browser on 64-bit Windows, “WOW64” a 32-bit one on 64-bit Windows, “x86_64” and “aarch64” mean 64-bit Linux or Android, “i686” and “armv7l” 32-bit systems. macOS since 10.15 and iOS since 11 are 64-bit only.",
      "When there are no clues, the tool says bitness is unknown instead of guessing.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как узнать разрядность Windows?",
        a: "«Параметры → Система → О системе» → строка «Тип системы», например «64-разрядная операционная система, процессор x64». Windows 11 выпускается только в 64-битной версии.",
      },
      {
        q: "Можно ли поставить 64-битный браузер на 32-битную систему?",
        a: "Нет, 64-битным программам нужна 64-битная ОС. Наоборот можно: 32-битные программы работают на 64-битной Windows через WoW64, но им доступно меньше памяти.",
      },
      {
        q: "Что такое x86-64 и ARM64?",
        a: "Две основные архитектуры процессоров. x86-64 (AMD64, Intel 64) — процессоры Intel и AMD в большинстве ПК и ноутбуков. ARM64 (AArch64) — Apple M-серии, Snapdragon X в ноутбуках на Windows и почти все смартфоны.",
      },
      {
        q: "Почему Mac на Apple M пишет «Intel» в User-Agent?",
        a: "Ради совместимости браузеры на Mac всегда пишут «Intel Mac OS X». Настоящую архитектуру Chrome сообщает через Client Hints, а Safari не сообщает никак.",
      },
    ],
    en: [
      {
        q: "How do I check whether Windows is 32 or 64-bit?",
        a: "Settings → System → About → System type, for example “64-bit operating system, x64-based processor”. Windows 11 exists only as a 64-bit system.",
      },
      {
        q: "Can I install a 64-bit browser on a 32-bit system?",
        a: "No, 64-bit programs need a 64-bit OS. The reverse works: 32-bit programs run on 64-bit Windows through WoW64, but get less memory.",
      },
      {
        q: "What are x86-64 and ARM64?",
        a: "The two main CPU architectures. x86-64 (AMD64, Intel 64) powers Intel and AMD processors in most PCs and laptops. ARM64 (AArch64) is used by Apple M-series, Snapdragon X Windows laptops and almost all smartphones.",
      },
      {
        q: "Why does my Apple Silicon Mac say “Intel” in the User-Agent?",
        a: "For compatibility, Mac browsers always say “Intel Mac OS X”. Chrome reports the real architecture through Client Hints; Safari doesn't report it at all.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Признаки разрядности в User-Agent и navigator.platform", "Bitness tokens in the User-Agent and navigator.platform"),
      head: L(locale, ["Признак", "Что означает"], ["Token", "Meaning"]),
      rows: L(
        locale,
        [
          ["Win64; x64", "64-битный браузер на 64-битной Windows"],
          ["WOW64", "32-битный браузер на 64-битной Windows"],
          ["Windows NT без Win64/WOW64", "32-битный браузер на 32-битной Windows"],
          ["x86_64, amd64", "64-битная система на процессоре Intel/AMD (Linux)"],
          ["aarch64, arm64", "64-битная система на ARM (Linux, Android)"],
          ["armv8l", "32-битный браузер на 64-битном ARM-процессоре"],
          ["i686, i386", "32-битная система x86"],
          ["armv7l", "32-битная система ARM"],
        ],
        [
          ["Win64; x64", "64-bit browser on 64-bit Windows"],
          ["WOW64", "32-bit browser on 64-bit Windows"],
          ["Windows NT without Win64/WOW64", "32-bit browser on 32-bit Windows"],
          ["x86_64, amd64", "64-bit system on an Intel/AMD CPU (Linux)"],
          ["aarch64, arm64", "64-bit system on ARM (Linux, Android)"],
          ["armv8l", "32-bit browser on a 64-bit ARM CPU"],
          ["i686, i386", "32-bit x86 system"],
          ["armv7l", "32-bit ARM system"],
        ],
      ),
      mono: false,
    },
  ],
};
