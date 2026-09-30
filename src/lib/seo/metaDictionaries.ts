export interface CategoryDictionary {
  ru: {
    titles: readonly string[];
    descriptions: readonly string[];
  };
  en: {
    titles: readonly string[];
    descriptions: readonly string[];
  };
}

export const CATEGORY_DICTIONARIES: Record<string, CategoryDictionary> = {
  'time-now': {
    ru: {
      titles: [
        'Точное время в {entity}: часы, минуты, секунды',
        'Сколько сейчас времени в {entity} — точные часы',
        'Время в {entity} сейчас — часовой пояс и секунды',
        '{entity} — точное текущее время и разница UTC',
        'Местное время в {entity}: дата, секунды и часовой пояс',
      ],
      descriptions: [
        'Узнайте точное время в {entity} в реальном времени. Синхронизация по атомным часам, смещение от UTC, восход и закат без задержек прямо в браузере.',
        'Текущее местное время в {entity} с отображением секунд. Официальный часовой пояс, летнее время и быстрый расчет разницы во времени онлайн.',
        'Сверяйте точное зональное время в {entity} онлайн. Атомная синхронизация, индикатор часового пояса и удобные цифровые часы для звонков и поездок.',
        'Точные секунды и официальное время в {entity} прямо сейчас. Проверьте разницу с мировыми столицами и отклонение системных часов на любом устройстве.',
        'Интерактивные часы для {entity}: точное текущее время с секундами, параметры часового пояса и астрономические фазы дня онлайн без регистрации.',
      ],
    },
    en: {
      titles: [
        'Current Time in {entity} — Live Accurate Clock',
        'Exact Time in {entity} Now — Local Timezone & Seconds',
        'What Time is It in {entity}? Live World Clock',
        '{entity} Local Time — Live Clock & UTC Offset',
        'Live Time in {entity} — Official Timezone & Seconds',
      ],
      descriptions: [
        'Check live local time in {entity} with atomic-grade accuracy. Includes real-time seconds, UTC offset, daylight saving status, and day length in browser.',
        'Exact current time in {entity} right now. View live digital clock with seconds, official IANA timezone offset, and sunrise/sunset times online.',
        'What time is it in {entity}? Verify live local time with second-by-second precision, timezone boundaries, and international time difference tools.',
        'Real-time local clock for {entity}. Synchronized with atomic time servers, showing current date, UTC difference, and time zone details on any screen.',
        'Track official local time in {entity} with live seconds. Free digital world clock with accurate timezone offset for international calls and travel.',
      ],
    },
  },
  'actual-size': {
    ru: {
      titles: [
        '{entity} в реальном масштабе 1:1 на экране',
        'Реальный размер: {entity} — масштаб 1:1 на мониторе',
        '{entity}: физические размеры 1:1 и калибровка',
        'Точные размеры {entity} в натуральную величину',
      ],
      descriptions: [
        'Сравните реальный физический размер {entity} в масштабе 1:1 прямо на экране. Быстрая калибровка по банковской карте для абсолютной точности.',
        'Точные габариты {entity} в натуральную величину на мониторе. Проверка физических размеров в миллиметрах и дюймах с точностью до десятых долей.',
        'Отображение {entity} в масштабе 1 к 1 на дисплее. Откалибруйте экран по банковской карте или монете и приложите реальный предмет для замера.',
        'Интерактивная визуализация {entity} в реальном размере. Проверьте физические пропорции устройства на экране смартфона или ноутбука онлайн.',
      ],
    },
    en: {
      titles: [
        '{entity} Actual Size 1:1 on Screen — True Scale',
        'Real Size: {entity} 1:1 Scale Display Calibrator',
        '{entity} Physical Dimensions 1:1 on Any Screen',
        'Exact 1:1 Scale: {entity} Calibrated Dimensions',
      ],
      descriptions: [
        'View true-to-life physical 1:1 scale for {entity} directly on your screen. Quick calibration using a standard bank card for millimeter precision.',
        'Exact real-world dimensions of {entity} in 1:1 scale on your monitor. Measure physical sizes in millimeters and inches with zero distortion.',
        'Calibrate your display to view {entity} in actual physical size. Compare true dimensions by placing a reference card against your screen.',
        'Interactive 1:1 scale viewer for {entity}. Inspect calibrated physical dimensions and aspect ratios across desktop and mobile screens.',
      ],
    },
  },
  emoji: {
    ru: {
      titles: [
        'Эмодзи {entity}: скопировать символ и значение',
        '{entity} — скопировать эмодзи, код Юникод и смысл',
        'Смайлик {entity}: быстрый клик-копирование и Юникод',
        'Значение эмодзи {entity} — скопировать знак Unicode',
      ],
      descriptions: [
        'Скопируйте эмодзи {entity} в буфер обмена в один клик. Узнайте значение, шестнадцатеричный код Unicode, HTML-сущность и варианты для соцсетей.',
        'Каталог эмодзи: {entity}. Быстрое копирование символа, начертания для iOS и Android, перевод значения и шорткоды для чатов и публикаций.',
        'Все о знаке {entity}: официальное описание Unicode, сочетания клавиш, HTML-код и копирование в буфер обмена на смартфонах и компьютерах.',
        'Копируйте смайлик {entity} в один клик для переписки и постов. Полная информация о символе, кодировки и совместимость со всеми платформами.',
      ],
    },
    en: {
      titles: [
        '{entity} Emoji — One-Click Copy & Unicode Codepoint',
        'Copy {entity} Emoji — Meaning, Shortcodes & Unicode',
        '{entity} Emoji Meaning — Copy Symbol & Details',
        'Unicode Emoji: {entity} — Instant Copy & Meanings',
      ],
      descriptions: [
        'Copy {entity} emoji to clipboard in one click. Detailed meaning, hexadecimal Unicode values, HTML entities, and cross-platform artwork preview.',
        'Official {entity} emoji dossier: fast symbol copy, shortcodes for Slack and Discord, platform rendering differences, and Unicode standard data.',
        'Looking for {entity} emoji? Copy the character with a single tap, inspect hex codepoints, and explore related emoticons for messages and posts.',
        'Instant copy and lookup for {entity} emoji. Explore codepoints, HTML entities, and cross-platform rendering styles for chat and web design.',
      ],
    },
  },
  symbol: {
    ru: {
      titles: [
        'Символы: {entity} — скопировать знак и код HTML',
        'Знак «{entity}» — специальный символ Unicode и код',
        'Спецсимволы: {entity} — быстрый поиск и вставка',
        'Таблица знаков: {entity} — код Юникод и HTML сущность',
      ],
      descriptions: [
        'Скопируйте специальный символ {entity} в один клик. Полные коды Unicode, HTML-сущности, шестнадцатеричные значения Alt и CSS-escapes для верстки.',
        'Справочник типографических знаков: {entity}. Проверенное начертание в системных шрифтах, коды для программирования и быстрая вставка в текст.',
        'Каталог спецсимволов {entity}: удобный поиск, копирование в буфер обмена без кракозябр, поддержка стандартов UTF-8 и UTF-16 онлайн.',
        'Специальный типографический символ {entity}. Копируйте знак в один клик, смотрите HTML-код, Alt-коды и шестнадцатеричные значения для верстки.',
      ],
    },
    en: {
      titles: [
        '{entity} Symbols — Copy Unicode Glyphs & HTML Code',
        'Special Symbol: {entity} — Unicode & HTML Entity',
        '{entity} Glyphs — One-Click Character & CSS Copy',
        'Unicode Characters: {entity} — Symbol Directory',
      ],
      descriptions: [
        'Copy special {entity} symbols to your clipboard with one click. Includes Unicode hex codepoints, HTML entities, and CSS escape sequences.',
        'Typographical glyph directory for {entity}. Verified cross-platform system font rendering, Alt codes, and instant copying for web and code.',
        'Lookup and copy {entity} characters online. Clean UTF-8 and UTF-16 representation, HTML tags, and typographical standards for designers.',
        'Special character reference for {entity}. Copy glyphs in one click, inspect character encodings, and copy ready-to-use HTML and CSS entities.',
      ],
    },
  },
  timer: {
    ru: {
      titles: [
        'Таймер: {entity} онлайн — обратный отсчёт со звуком',
        'Обратный отсчёт: {entity} — дни, часы и секунды',
        '{entity}: онлайн таймер обратного отсчёта',
        'Счётчик времени: {entity} онлайн в браузере',
      ],
      descriptions: [
        'Онлайн таймер обратного отсчёта для {entity} с отображением дней, часов и секунд. Звуковой сигнал по завершении и полноэкранный режим работы.',
        'Узнайте точно, сколько времени осталось до события: {entity}. Высокоточный тикер в реальном времени со звуковым оповещением и тёмной темой.',
        'Точный счётчик обратного отсчёта: {entity}. Работает непрерывно прямо в браузере, сохраняет настройки и предупреждает звуком об окончании времени.',
        'Интерактивный таймер: {entity} онлайн. Запустите обратный отсчёт со звуковым сигналом, отслеживайте оставшиеся секунды и открывайте на весь экран.',
      ],
    },
    en: {
      titles: [
        '{entity} Countdown Timer — Live Days, Hours & Seconds',
        'Timer for {entity} Online — Real-Time Ticker & Alarm',
        '{entity} Countdown — Live Ticker & Time Remaining',
        'Online Timer: {entity} — Accurate Fullscreen Clock',
      ],
      descriptions: [
        'Live countdown timer for {entity} tracking remaining days, hours, minutes, and seconds. Includes customizable sound alerts and full-screen view.',
        'Find out exactly how much time is left until {entity}. High-precision real-time ticker with audio chime alerts and responsive display.',
        'Accurate countdown ticker and stopwatch for {entity}. Runs client-side in your web browser with zero latency and customizable alert settings.',
        'Interactive countdown timer for {entity}. Monitor live seconds remaining, configure audible alerts, and share custom timers effortlessly.',
      ],
    },
  },
  diagnostic: {
    ru: {
      titles: [
        'Узнать свой {entity} онлайн — мгновенная проверка',
        'Проверка: {entity} в браузере без установки программ',
        'Диагностика: {entity} — параметры системы и экрана',
        'Тест {entity} онлайн — точные клиентские параметры',
      ],
      descriptions: [
        'Мгновенно определите свой {entity} онлайн прямо в браузере. Точные технические показатели системы, оборудования и экрана без установки программ.',
        'Конфиденциальная диагностика: {entity}. Детальный срез характеристик вашего браузера и устройства с нулевой передачей данных на сервер.',
        'Проверьте параметры: {entity} в один клик. Показывает точные аппаратные и сетевые спецификации с возможностью быстро скопировать данные.',
        'Точный онлайн-тест: {entity}. Проверьте параметры экрана, видеокарты, сети и браузера с гарантией полной конфиденциальности без сторонней слежки.',
      ],
    },
    en: {
      titles: [
        'What is My {entity}? Instant Online Test & Specs',
        'Check My {entity} Online — Fast Browser Diagnostics',
        'Inspect {entity} — Accurate Device & Client Metrics',
        'My {entity} Test — Instant Hardware & Network Specs',
      ],
      descriptions: [
        'Instantly detect your {entity} online directly in your browser. Inspect hardware, screen, and network parameters without installing software.',
        'Confidential client-side diagnostics for {entity}. Detailed device and browser snapshot with strict zero-telemetry privacy guarantees.',
        'Test and inspect your {entity} in one click. Accurate real-time telemetry for web developers, designers, and privacy-conscious users.',
        'Online diagnostics for {entity}. Real-time inspection of display metrics, client attributes, and network connection with zero telemetry.',
      ],
    },
  },
  catalog: {
    ru: {
      titles: [
        'Справочник: {entity} — параметры, таблица и поиск',
        'База данных: {entity} — характеристики и спецификации',
        '{entity} — справочные данные и быстрый поиск онлайн',
        'Таблица параметров: {entity} — онлайн спецификации',
      ],
      descriptions: [
        'Структурированный справочник по категории «{entity}». Сводные таблицы параметров, фильтрация по строкам и копирование значений в один клик.',
        'Техническая база данных: {entity}. Проверенные характеристики, сравнительные таблицы и быстрый поиск спецификаций онлайн без ограничений.',
        'Официальные справочные данные: {entity}. Регулярно верифицируемые параметры и удобная таблица для специалистов, инженеров и пользователей.',
        'Справочные материалы и стандарты для {entity}. Быстрый поиск по реестру, табличное представление и моментальное копирование в браузере.',
      ],
    },
    en: {
      titles: [
        '{entity} Reference Guide — Specs & Lookup Directory',
        'Catalog: {entity} — Technical Details & Fast Search',
        '{entity} Reference — Data Tables & Specifications',
        'Lookup Directory: {entity} — Verified Online Specs',
      ],
      descriptions: [
        'Structured reference compendium for "{entity}". Searchable data matrices, verified technical attributes, and one-click value copying.',
        'Technical reference guide: {entity}. Audited specifications, comparative tables, and fast keyword lookup running client-side in browser.',
        'Official technical dossier for {entity}. Verified data points, dimension matrices, and comprehensive guidelines accessible anytime.',
        'Comprehensive reference registry for {entity}. Search verified metrics, copy values to clipboard, and inspect technical specifications.',
      ],
    },
  },
  interactive: {
    ru: {
      titles: [
        '{entity} онлайн — интерактивный инструмент',
        '{entity}: удобный веб-сервис прямо в браузере',
        '{entity} — бесплатный онлайн инструмент с предпросмотром',
        'Инструмент: {entity} онлайн с мгновенным откликом',
      ],
      descriptions: [
        'Интерактивный веб-инструмент {entity} с мгновенным откликом. Работает полностью локально в вашем браузере без регистрации и передачи данных.',
        'Удобный визуальный сервис {entity} для быстрого решения задач. Плавный интерфейс, настраиваемые параметры и моментальный экспорт результата.',
        'Используйте {entity} онлайн бесплатно на смартфонах и ПК. Все вычисления производятся прямо на устройстве с гарантией конфиденциальности.',
        'Онлайн инструмент {entity} с честным алгоритмом и моментальным результатом. Настройте параметры под свои задачи и сохраните результат в один клик.',
      ],
    },
    en: {
      titles: [
        '{entity} Online — Interactive Web Utility',
        '{entity}: Convenient Browser Tool with Live Preview',
        '{entity} — Free Online Utility with Instant Results',
        'Digital Tool: {entity} Online with Zero Latency',
      ],
      descriptions: [
        'Interactive web utility "{entity}" with instant feedback. Runs 100% locally in your browser with zero data collection and no accounts.',
        'Visual tool "{entity}" designed for precision and productivity. Responsive interface, flexible parameters, and instant result export.',
        'Use {entity} free online across mobile and desktop devices. All processing occurs client-side on your device for absolute privacy.',
        'Online utility "{entity}" engineered for seamless performance and immediate output. Customize settings and export results in one click.',
      ],
    },
  },
};
