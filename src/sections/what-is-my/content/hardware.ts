import type { Locale } from "@/i18n/config";
import type { ToolDef } from "@/registry/types";

const L = <T>(locale: Locale, ru: T, en: T): T => (locale === "ru" ? ru : en);

export const cpu: ToolDef = {
  slug: "cpu-cores",
  component: "what-is-my/cpu",
  icon: "Cpu",
  name: { ru: "Сколько ядер у процессора", en: "CPU cores" },
  title: { ru: "Сколько ядер у процессора — проверить онлайн", en: "How many CPU cores do I have? Check online" },
  h1: { ru: "Сколько ядер у моего процессора", en: "How many CPU cores do I have?" },
  description: {
    ru: "Число логических процессоров (потоков) через navigator.hardwareConcurrency, архитектура x86-64 или ARM64 и почему Safari и Firefox показывают меньше.",
    en: "Logical processors (threads) via navigator.hardwareConcurrency, x86-64 or ARM64 architecture, and why Safari and Firefox may report fewer than you have.",
  },
  lead: {
    ru: "Число логических процессоров, которое браузер сообщает сайтам, и как узнать точное число ядер.",
    en: "The number of logical processors your browser reports to websites, and how to find the exact core count.",
  },
  keywords: {
    ru: ["ядра процессора", "количество потоков", "hardwareconcurrency", "сколько ядер", "логические процессоры"],
    en: ["cpu cores", "threads", "hardwareconcurrency", "logical processors", "how many cores"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху число логических процессоров (потоков).",
      "Если у процессора есть Hyper-Threading или SMT, физических ядер обычно вдвое меньше; у Apple M и большинства ARM-чипов потоков столько же, сколько ядер.",
      "Для точных данных о ядрах воспользуйтесь способами из таблицы ниже.",
    ],
    en: [
      "Open the page — the number of logical processors (threads) is at the top.",
      "With Hyper-Threading or SMT there are usually half as many physical cores; Apple M and most ARM chips have as many threads as cores.",
      "For exact core counts, use the methods in the table below.",
    ],
  },
  about: {
    ru: [
      "navigator.hardwareConcurrency — число логических процессоров, которые система выделяет браузеру. У процессоров Intel с Hyper-Threading и AMD с SMT на каждое физическое ядро приходится два потока, поэтому 8-ядерный Ryzen показывает 16. У гибридных Intel с производительными и энергоэффективными ядрами потоков меньше, чем «ядра × 2»: E-ядра однопоточные. Apple M-серии и мобильные ARM-процессоры сообщают число ядер без удвоения.",
      "Сайты используют это значение, чтобы решить, сколько фоновых потоков (Web Workers) запускать для тяжёлых вычислений. Но точное число — ещё и признак для «отпечатка» браузера, поэтому Safari ограничивает сообщаемое значение, а Firefox в режиме защиты от отпечатков и Tor Browser подставляют фиксированное.",
    ],
    en: [
      "navigator.hardwareConcurrency is the number of logical processors the system gives the browser. Intel CPUs with Hyper-Threading and AMD with SMT run two threads per physical core, so an 8-core Ryzen reports 16. Hybrid Intel chips with performance and efficiency cores have fewer than “cores × 2”, because E-cores are single-threaded. Apple M-series and mobile ARM chips report their core count without doubling.",
      "Websites use the value to decide how many background threads (Web Workers) to start for heavy work. But an exact number is also a browser-fingerprinting signal, so Safari caps what it reports, and Firefox with fingerprinting protection and Tor Browser report a fixed value.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему число меньше, чем в характеристиках процессора?",
        a: "Возможны три причины: браузер ограничивает значение (так делает Safari), включена защита от отпечатков (Firefox с privacy.resistFingerprinting, Tor Browser) или браузер запущен в виртуальной машине, которой выделено меньше ядер.",
      },
      {
        q: "Как узнать точное число ядер в Windows?",
        a: "Диспетчер задач (Ctrl + Shift + Esc) → «Производительность» → «ЦП»: справа указаны «Ядра» и «Логические процессоры». Или в PowerShell: Get-CimInstance Win32_Processor | Select NumberOfCores, NumberOfLogicalProcessors.",
      },
      {
        q: "А на Mac и в Linux?",
        a: "macOS: в Терминале sysctl -n hw.physicalcpu (ядра) и sysctl -n hw.logicalcpu (потоки). Linux: lscpu — строки «Core(s) per socket» и «CPU(s)», или nproc для числа потоков.",
      },
      {
        q: "Больше ядер — быстрее браузер?",
        a: "Отчасти: браузер раскладывает вкладки и тяжёлые задачи по разным потокам, но скорость отдельной страницы чаще зависит от частоты и архитектуры ядра, чем от их числа.",
      },
    ],
    en: [
      {
        q: "Why is the number lower than my CPU's spec?",
        a: "Three likely reasons: the browser caps the value (Safari does), fingerprinting protection is on (Firefox with privacy.resistFingerprinting, Tor Browser), or the browser runs in a virtual machine with fewer cores assigned.",
      },
      {
        q: "How do I see the exact core count on Windows?",
        a: "Task Manager (Ctrl + Shift + Esc) → Performance → CPU: “Cores” and “Logical processors” are on the right. Or in PowerShell: Get-CimInstance Win32_Processor | Select NumberOfCores, NumberOfLogicalProcessors.",
      },
      {
        q: "And on a Mac or Linux?",
        a: "macOS: run sysctl -n hw.physicalcpu (cores) and sysctl -n hw.logicalcpu (threads) in Terminal. Linux: lscpu — see “Core(s) per socket” and “CPU(s)” — or nproc for the thread count.",
      },
      {
        q: "Do more cores make the browser faster?",
        a: "Partly: the browser spreads tabs and heavy tasks across threads, but the speed of a single page depends more on core clock speed and architecture than on the number of cores.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Как узнать точное число ядер", "How to find the exact core count"),
      head: L(locale, ["Система", "Где посмотреть"], ["System", "Where to look"]),
      rows: L(
        locale,
        [
          ["Windows", "Диспетчер задач → Производительность → ЦП: «Ядра» и «Логические процессоры»"],
          ["macOS", "Терминал: sysctl -n hw.physicalcpu и sysctl -n hw.logicalcpu"],
          ["Linux", "Команды lscpu и nproc"],
          ["Android", "Характеристики модели или приложения-анализаторы вроде CPU-Z"],
          ["iPhone, iPad", "Характеристики модели на сайте Apple"],
        ],
        [
          ["Windows", "Task Manager → Performance → CPU: “Cores” and “Logical processors”"],
          ["macOS", "Terminal: sysctl -n hw.physicalcpu and sysctl -n hw.logicalcpu"],
          ["Linux", "The lscpu and nproc commands"],
          ["Android", "The model's specs or analyser apps such as CPU-Z"],
          ["iPhone, iPad", "The model's specs on Apple's website"],
        ],
      ),
    },
  ],
};

export const memory: ToolDef = {
  slug: "how-much-ram",
  component: "what-is-my/memory",
  icon: "MemoryStick",
  name: { ru: "Сколько оперативной памяти", en: "How much RAM" },
  title: { ru: "Сколько оперативной памяти на компьютере — узнать онлайн", en: "How much RAM do I have? Check device memory online" },
  h1: { ru: "Сколько оперативной памяти на моём устройстве", en: "How much RAM do I have?" },
  description: {
    ru: "Объём ОЗУ по данным navigator.deviceMemory: от 0,25 до 8 ГБ, округление до степени двойки. Работает в Chrome, Edge, Opera; Firefox и Safari его скрывают.",
    en: "RAM reported by navigator.deviceMemory: 0.25 to 8 GB, rounded to a power of two. Works in Chrome, Edge and Opera, while Firefox and Safari hide it.",
  },
  lead: {
    ru: "Приблизительный объём оперативной памяти по данным браузера — и как узнать точный.",
    en: "Your approximate RAM as reported by the browser — and how to find the exact amount.",
  },
  keywords: {
    ru: ["оперативная память", "озу", "объём памяти", "devicememory", "сколько гб памяти"],
    en: ["ram", "device memory", "memory size", "devicememory", "how many gb of ram"],
  },
  howTo: {
    ru: [
      "Откройте страницу в Chrome, Edge, Opera или Яндекс Браузере — вверху появится объём памяти.",
      "Учтите, что значение округлено и ограничено сверху: 8 ГБ означает «8 ГБ или больше».",
      "В Firefox и Safari значение недоступно — используйте способы из ответов ниже.",
    ],
    en: [
      "Open the page in Chrome, Edge or Opera — the memory size appears at the top.",
      "Note that the value is rounded and capped: 8 GB means “8 GB or more”.",
      "Firefox and Safari don't expose it — use the methods in the answers below.",
    ],
  },
  about: {
    ru: [
      "navigator.deviceMemory — часть Device Memory API. Чтобы число нельзя было использовать для слежки, браузер округляет объём до степени двойки и ограничивает диапазон: спецификация допускает значения 0,25, 0,5, 1, 2, 4 и 8 ГБ. Поэтому ноутбук с 16 или 32 ГБ обычно показывает 8; новые версии Chrome для компьютеров могут сообщать и больше — до 32 ГБ.",
      "API есть только в браузерах на Chromium: Firefox и Safari его не реализуют, и сайт там объёма памяти не знает. Дополнительно Chrome показывает лимит памяти JavaScript на вкладку (performance.memory) — это не объём ОЗУ, а потолок для одной страницы.",
    ],
    en: [
      "navigator.deviceMemory is part of the Device Memory API. To keep the number from being used for tracking, the browser rounds it to a power of two and limits the range: the spec allows 0.25, 0.5, 1, 2, 4 and 8 GB. So a laptop with 16 or 32 GB usually shows 8; newer desktop versions of Chrome may report more, up to 32 GB.",
      "Only Chromium browsers implement the API: Firefox and Safari don't, so websites can't see your memory there. Chrome also exposes the per-tab JavaScript memory limit (performance.memory) — that's not your RAM but a ceiling for one page.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Почему показывается 8 ГБ, хотя у меня 16 или 32 ГБ?",
        a: "8 ГБ — верхняя граница Device Memory API во многих версиях Chrome: всё, что больше, сообщается как 8. Реальный объём смотрите в системе.",
      },
      {
        q: "Как узнать объём памяти в Windows?",
        a: "Диспетчер задач → «Производительность» → «Память»: общий объём указан вверху справа. Или «Параметры → Система → О системе» — строка «Оперативная память».",
      },
      {
        q: "Как узнать объём памяти на Mac, iPhone и Android?",
        a: "Mac: меню Apple → «Об этом Mac», строка «Память». iPhone: объём ОЗУ в настройках не показывается — он указан в характеристиках модели. Android: «Настройки → О телефоне» или раздел «Память» — зависит от производителя.",
      },
      {
        q: "Что такое «лимит памяти JavaScript на вкладку»?",
        a: "Это performance.memory.jsHeapSizeLimit — максимальный объём памяти для скриптов, который Chrome выделит одной вкладке (обычно 2–4 ГБ). К объёму ОЗУ он напрямую не относится.",
      },
    ],
    en: [
      {
        q: "Why does it say 8 GB when I have 16 or 32 GB?",
        a: "8 GB is the Device Memory API's upper limit in many Chrome versions: anything larger is reported as 8. Check the real amount in your OS.",
      },
      {
        q: "How do I check RAM on Windows?",
        a: "Task Manager → Performance → Memory: the total is at the top right. Or Settings → System → About → Installed RAM.",
      },
      {
        q: "How do I check RAM on a Mac, iPhone or Android?",
        a: "Mac: Apple menu → About This Mac, the Memory line. iPhone: RAM isn't shown in Settings — it's in the model's specs. Android: Settings → About phone or a Memory section, depending on the manufacturer.",
      },
      {
        q: "What is the “JavaScript memory limit per tab”?",
        a: "It's performance.memory.jsHeapSizeLimit — the most script memory Chrome will give one tab (typically 2–4 GB). It isn't directly related to your RAM.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Какие браузеры сообщают объём памяти", "Which browsers report device memory"),
      head: L(locale, ["Браузер", "navigator.deviceMemory"], ["Browser", "navigator.deviceMemory"]),
      rows: L(
        locale,
        [
          ["Google Chrome", "да, с версии 63"],
          ["Microsoft Edge", "да, с версии 79"],
          ["Opera, Яндекс Браузер, Samsung Internet", "да (движок Chromium)"],
          ["Mozilla Firefox", "нет"],
          ["Safari (Mac, iPhone, iPad)", "нет"],
        ],
        [
          ["Google Chrome", "yes, since version 63"],
          ["Microsoft Edge", "yes, since version 79"],
          ["Opera, Samsung Internet, Brave", "yes (Chromium engine)"],
          ["Mozilla Firefox", "no"],
          ["Safari (Mac, iPhone, iPad)", "no"],
        ],
      ),
    },
  ],
};

export const gpu: ToolDef = {
  slug: "what-is-my-gpu",
  component: "what-is-my/gpu",
  icon: "CircuitBoard",
  name: { ru: "Моя видеокарта", en: "My graphics card" },
  title: { ru: "Какая у меня видеокарта — узнать модель GPU онлайн", en: "What graphics card do I have? Check your GPU online" },
  h1: { ru: "Какая у меня видеокарта", en: "What graphics card do I have?" },
  description: {
    ru: "Модель видеокарты по данным WebGL (NVIDIA, AMD, Intel, Apple M), графический API браузера, поддержка WebGPU и проверка, включено ли аппаратное ускорение.",
    en: "Your GPU model from WebGL (NVIDIA, AMD, Intel, Apple M-series), the browser's graphics API, WebGPU support and a check that hardware acceleration is on.",
  },
  lead: {
    ru: "Модель видеокарты, которую браузер использует для графики, — без установки программ.",
    en: "The graphics card your browser uses for rendering — no software to install.",
  },
  keywords: {
    ru: ["видеокарта", "модель gpu", "графический процессор", "webgl", "аппаратное ускорение"],
    en: ["graphics card", "gpu model", "webgl renderer", "hardware acceleration", "webgpu"],
  },
  howTo: {
    ru: [
      "Откройте страницу — вверху модель видеокарты, ниже производитель и графический API (Direct3D, Metal, Vulkan, OpenGL).",
      "Если в строке рендерера SwiftShader, llvmpipe или Basic Render — включите аппаратное ускорение в настройках браузера и перезапустите его.",
      "На ноутбуке с двумя видеокартами браузер может работать на встроенной; дискретную назначают в «Параметры → Система → Дисплей → Графика».",
      "Нажмите «Копировать», чтобы отправить полную строку рендерера в техподдержку.",
    ],
    en: [
      "Open the page — the GPU model is at the top, with the vendor and graphics API (Direct3D, Metal, Vulkan, OpenGL) below.",
      "If the renderer string says SwiftShader, llvmpipe or Basic Render, turn on hardware acceleration in the browser settings and restart it.",
      "On a laptop with two GPUs the browser may use the integrated one; assign the discrete GPU in Windows Settings → System → Display → Graphics.",
      "Click Copy to send the full renderer string to a support team.",
    ],
  },
  about: {
    ru: [
      "Браузер рисует страницы и 3D-графику через WebGL и WebGPU, а название видеокарты берёт из драйвера. Chrome, Edge и Opera отдают его через расширение WEBGL_debug_renderer_info в виде «ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 … Direct3D11 …)» — инструмент вырезает из этой строки модель и графический API.",
      "Firefox показывает обобщённое название из того же семейства, а Safari всегда пишет «Apple GPU» — так браузеры защищают пользователей от отпечатков. Если в строке SwiftShader, llvmpipe или Microsoft Basic Render Driver, графику считает процессор: аппаратное ускорение выключено или нет драйвера, и сайты с 3D, картами и видеоредакторами будут тормозить.",
    ],
    en: [
      "Browsers draw pages and 3D graphics through WebGL and WebGPU and take the GPU name from the driver. Chrome, Edge and Opera expose it through the WEBGL_debug_renderer_info extension as “ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 … Direct3D11 …)” — the tool extracts the model and graphics API from that string.",
      "Firefox reports a generalised name from the same family, and Safari always says “Apple GPU”, to protect users from fingerprinting. If the string mentions SwiftShader, llvmpipe or Microsoft Basic Render Driver, the CPU is doing the graphics: hardware acceleration is off or the driver is missing, and 3D sites, maps and video editors will be slow.",
    ],
  },
  faq: {
    ru: [
      {
        q: "Как узнать видеокарту в Windows без браузера?",
        a: "Диспетчер задач → «Производительность» → «Графический процессор». Или Win + R → dxdiag → вкладка «Экран»: там модель, производитель и версия драйвера.",
      },
      {
        q: "Как узнать видеокарту на Mac?",
        a: "Меню Apple → «Об этом Mac». У Mac на Apple Silicon графика встроена в чип (например, Apple M2), у моделей с Intel видеокарта указана в строке «Графика».",
      },
      {
        q: "Как включить аппаратное ускорение?",
        a: "Chrome и Edge: «Настройки → Система → Использовать графическое ускорение, если оно доступно», затем перезапуск. Firefox: «Настройки → Основные → Производительность» — снимите «Использовать рекомендуемые настройки производительности» и включите ускорение.",
      },
      {
        q: "Почему показана встроенная видеокарта, хотя есть дискретная?",
        a: "Windows по умолчанию запускает браузер на энергоэффективном GPU. Назначьте браузеру режим «Высокая производительность» в «Параметры → Система → Дисплей → Графика» и перезапустите его.",
      },
    ],
    en: [
      {
        q: "How do I check my GPU on Windows without a browser?",
        a: "Task Manager → Performance → GPU. Or Win + R → dxdiag → Display tab, which shows the model, vendor and driver version.",
      },
      {
        q: "How do I check my GPU on a Mac?",
        a: "Apple menu → About This Mac. On Apple Silicon Macs graphics are built into the chip (for example Apple M2); Intel Macs list the GPU under Graphics.",
      },
      {
        q: "How do I turn on hardware acceleration?",
        a: "Chrome and Edge: Settings → System → “Use graphics acceleration when available”, then restart. Firefox: Settings → General → Performance — untick “Use recommended performance settings” and enable acceleration.",
      },
      {
        q: "Why is the integrated GPU shown when I have a discrete one?",
        a: "Windows runs browsers on the power-saving GPU by default. Set the browser to “High performance” in Settings → System → Display → Graphics and restart it.",
      },
    ],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: L(locale, "Что разные браузеры сообщают о видеокарте", "What each browser reveals about the GPU"),
      head: L(locale, ["Браузер", "Что видит сайт"], ["Browser", "What a website sees"]),
      rows: L(
        locale,
        [
          ["Chrome, Edge, Opera, Яндекс Браузер", "Полную строку ANGLE: производитель, модель и графический API"],
          ["Firefox", "Модель из того же семейства, иногда с пометкой «or similar»"],
          ["Safari", "Всегда «Apple GPU»"],
          ["Tor Browser", "Модель скрыта"],
        ],
        [
          ["Chrome, Edge, Opera", "The full ANGLE string: vendor, model and graphics API"],
          ["Firefox", "A model from the same family, sometimes marked “or similar”"],
          ["Safari", "Always “Apple GPU”"],
          ["Tor Browser", "The model is hidden"],
        ],
      ),
    },
  ],
};
