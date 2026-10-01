import type { Locale } from "@/i18n/config";
import { defineToolSection } from "@/registry/tool-section";
import type { Block } from "@/registry/types";
import { CAPACITY } from "./lib/qr";
import { QR_VARIANTS, variant } from "./content/texts";
import { BARCODE_VARIANTS, CHECK_VARIANTS } from "./content/texts-barcode";

function eccTable(l: Locale): Block {
  const ru = l === "ru";
  const rows: [string, string, string][] = [
    ["L", "≈7%", ru ? "чистые экраны и дисплеи, максимум данных" : "clean screens, maximum data"],
    ["M", "≈15%", ru ? "универсальный выбор для печати" : "the all-round choice for print"],
    ["Q", "≈25%", ru ? "уличные вывески, упаковка, риск потёртостей" : "outdoor signs, packaging, scuffs"],
    ["H", "≈30%", ru ? "код с логотипом, жёсткие условия" : "codes with a logo, harsh conditions"],
  ];
  return {
    type: "table",
    title: ru ? "Уровни коррекции ошибок" : "Error-correction levels",
    head: ru ? ["Уровень", "Восстановит", "Когда выбирать"] : ["Level", "Recovers", "When to use"],
    rows,
  };
}

function capacityTable(l: Locale): Block {
  const ru = l === "ru";
  const f = (n: number) => n.toLocaleString(ru ? "ru-RU" : "en-US");
  return {
    type: "table",
    title: ru ? "Сколько данных вмещает QR-код (версия 40)" : "QR code capacity (version 40)",
    head: ru ? ["Уровень", "Цифры", "A–Z, 0–9 и знаки", "Байты (UTF-8)"] : ["Level", "Digits", "A–Z, 0–9, symbols", "Bytes (UTF-8)"],
    rows: (["L", "M", "Q", "H"] as const).map((e) => [e, f(CAPACITY.numeric[e]), f(CAPACITY.alphanumeric[e]), f(CAPACITY.byte[e])]),
  };
}

export const qrSection = defineToolSection({
  id: "qr",
  name: { ru: "QR-коды и штрихкоды", en: "QR codes & barcodes" },
  description: {
    ru: "Создание и сканирование QR-кодов и штрихкодов прямо в браузере",
    en: "Create and scan QR codes and barcodes right in your browser",
  },
  icon: "QrCode",
  hue: 0,
  category: "web",
  order: 2,
  tools: [
    {
      slug: "qr-code-generator",
      component: "qr/generator",
      icon: "QrCode",
      popular: true,
      wide: true,
      props: { type: "url" },
      name: { ru: "Генератор QR-кодов", en: "QR code generator" },
      title: { ru: "Генератор QR-кодов — создать QR-код онлайн", en: "QR Code Generator — Create a QR Code Online" },
      h1: { ru: "Генератор QR-кодов", en: "QR code generator" },
      description: {
        ru: "Создайте QR-код для ссылки, Wi-Fi, визитки, оплаты или текста. PNG до 4096 px и векторный SVG для печати, свой цвет и логотип. Всё создаётся в браузере.",
        en: "Create a QR code for a link, Wi-Fi, contact card, payment or text. PNG up to 4096 px and vector SVG for print, custom colours and a logo — all made in your browser.",
      },
      lead: {
        ru: "Вставьте ссылку или выберите тип данных — код появится сразу, скачайте его в PNG или SVG.",
        en: "Paste a link or pick a data type — the code appears instantly; download it as PNG or SVG.",
      },
      keywords: {
        ru: ["qr код", "создать qr код", "генератор qr", "сделать qr код", "qr код онлайн"],
        en: ["qr code generator", "create qr code", "make a qr code", "qr code maker"],
      },
      howTo: {
        ru: ["Вставьте ссылку или выберите в списке, что закодировать: Wi-Fi, визитку, платёж и другое.", "Заполните поля — код обновляется сразу.", "При желании смените цвета, добавьте логотип или уровень коррекции.", "Скачайте PNG для сайта и мессенджеров или SVG для печати."],
        en: ["Paste a link or choose what to encode: Wi-Fi, contact, payment and more.", "Fill in the fields — the code updates instantly.", "Optionally change colours, add a logo or pick an error-correction level.", "Download a PNG for the web and chats or an SVG for print."],
      },
      about: {
        ru: [
          "Коды создаются прямо в браузере: ссылки, пароли Wi-Fi и реквизиты не отправляются на сервер. У кода нет срока действия и промежуточных переходов — ссылка записана в нём напрямую и будет работать, пока работает ваш сайт.",
          "Модули рисуются целыми пикселями, вокруг кода остаётся белое поле шириной в четыре модуля, как требует стандарт ISO/IEC 18004. Цвет кода должен быть заметно темнее фона: светлый код на тёмном фоне многие сканеры не читают, поэтому генератор предупреждает о таком сочетании.",
        ],
        en: [
          "Codes are generated in your browser: links, Wi-Fi passwords and bank details never reach a server. The code has no expiry and no redirect — the link is stored in it directly and works as long as your site does.",
          "Modules are drawn on whole pixels and a quiet zone four modules wide surrounds the code, as ISO/IEC 18004 requires. The code must be clearly darker than the background: many scanners can't read a light code on a dark background, so the generator warns about it.",
        ],
      },
      faq: {
        ru: [
          { q: "QR-код будет работать всегда?", a: "Да. Это статический код: данные записаны в нём самом, без сервиса-посредника, поэтому он не «истечёт» и не перестанет работать из-за подписки." },
          { q: "Какой формат скачать для печати?", a: "SVG — векторный, его можно увеличить до любого размера без потери качества. PNG подходит для сайтов, презентаций и мессенджеров." },
          { q: "Какой минимальный размер при печати?", a: "Для короткой ссылки — около 2×2 см при сканировании с 20–30 см. Правило: расстояние сканирования примерно в 10 раз больше стороны кода." },
          { q: "Можно ли изменить ссылку после печати?", a: "Нет, у статического кода содержимое фиксировано. Если ссылка может поменяться, закодируйте адрес своей страницы с редиректом, которую сможете перенастроить." },
        ],
        en: [
          { q: "Will the QR code work forever?", a: "Yes. It's a static code: the data is stored in the code itself without an intermediary service, so it can't expire or stop working when a subscription ends." },
          { q: "Which format should I use for print?", a: "SVG is vector and scales to any size without losing quality. PNG suits websites, slides and chats." },
          { q: "What's the minimum print size?", a: "About 2×2 cm for a short link scanned from 20–30 cm. Rule of thumb: the scanning distance is about 10 times the code's side." },
          { q: "Can I change the link after printing?", a: "No, a static code's content is fixed. If the link may change, encode the address of your own redirect page that you can reconfigure." },
        ],
      },
      variants: {
        title: { ru: "Типы QR-кодов", en: "QR code types" },
        list: () => QR_VARIANTS,
      },
      blocks: (l) => [eccTable(l), capacityTable(l)],
    },
    {
      slug: "qr-code-scanner",
      component: "qr/scanner",
      icon: "ScanLine",
      popular: true,
      name: { ru: "Сканер QR-кодов", en: "QR code scanner" },
      title: { ru: "Сканер QR-кодов онлайн — считать QR-код камерой", en: "QR Code Scanner Online — Scan with Camera or Image" },
      h1: { ru: "Сканер QR-кодов", en: "QR code scanner" },
      description: {
        ru: "Считайте QR-код камерой телефона или ноутбука либо загрузите фото и скриншот. Покажем ссылку, пароль Wi-Fi, контакт или платёж до перехода. Всё на вашем устройстве.",
        en: "Scan a QR code with your phone or laptop camera, or upload a photo or screenshot. See the link, Wi-Fi password or contact before opening anything. All on-device.",
      },
      lead: {
        ru: "Включите камеру и наведите её на код — содержимое появится ниже, ссылку можно проверить до перехода.",
        en: "Start the camera and point it at the code — the contents appear below so you can check a link before opening it.",
      },
      keywords: { ru: ["сканер qr кода", "считать qr код", "распознать qr код онлайн"], en: ["qr code scanner", "scan qr code online", "qr reader"] },
      howTo: {
        ru: ["Нажмите «Включить камеру» и разрешите доступ.", "Наведите камеру на код так, чтобы он целиком попал в рамку.", "Проверьте содержимое: адрес ссылки, данные Wi-Fi или платежа.", "Скопируйте результат или откройте ссылку."],
        en: ["Click “Start camera” and allow access.", "Point the camera so the whole code is inside the frame.", "Check the contents: link address, Wi-Fi or payment details.", "Copy the result or open the link."],
      },
      about: {
        ru: [
          "Распознавание работает в браузере: встроенный BarcodeDetector, если браузер его поддерживает, иначе — модуль ZXing, который загружается с этого же сайта. Кадры с камеры и загруженные изображения никуда не отправляются.",
          "Перед переходом по ссылке посмотрите на домен: мошенники наклеивают поддельные QR-коды на парковочные автоматы и объявления. Сканер показывает адрес целиком и не открывает его без вашего нажатия.",
        ],
        en: [
          "Recognition runs in the browser: the built-in BarcodeDetector where supported, otherwise the ZXing module served from this same site. Camera frames and uploaded images are never sent anywhere.",
          "Look at the domain before opening a link: scammers stick fake QR codes on parking meters and posters. The scanner shows the full address and never opens it without your click.",
        ],
      },
      faq: {
        ru: [
          { q: "Почему камера не включается?", a: "Браузер даёт доступ к камере только на защищённых страницах и после вашего разрешения. Если доступ запрещён, разрешите его в настройках сайта или загрузите фото кода." },
          { q: "Можно ли отсканировать код с экрана этого же телефона?", a: "Да: сделайте скриншот и загрузите его во вкладке «Картинка» или вставьте из буфера обмена." },
          { q: "Что делать, если код не распознаётся?", a: "Добавьте света, держите телефон ровно и не слишком близко, протрите камеру. На фото код должен быть резким и занимать заметную часть кадра." },
        ],
        en: [
          { q: "Why won't the camera start?", a: "Browsers allow camera access only on secure pages and after your permission. If access was blocked, allow it in the site settings or upload a photo of the code." },
          { q: "Can I scan a code shown on this same phone?", a: "Yes: take a screenshot and upload it in the “Image” tab or paste it from the clipboard." },
          { q: "What if the code isn't recognised?", a: "Add light, hold the phone steady and not too close, wipe the lens. In a photo the code should be sharp and fill a good part of the frame." },
        ],
      },
      variants: {
        title: { ru: "Другие способы", en: "Other ways" },
        list: () => [
          variant(
            "from-image",
            { source: "image" },
            {
              name: "С картинки",
              title: "Распознать QR-код с картинки или скриншота онлайн",
              h1: "Распознать QR-код с картинки",
              description: "Загрузите фото, скриншот или вставьте картинку из буфера обмена — сервис найдёт на ней QR-код и покажет содержимое. Изображение не покидает ваше устройство.",
              lead: "Перетащите изображение или нажмите Ctrl+V — содержимое кода появится сразу.",
              keywords: ["распознать qr код с картинки", "qr код со скриншота", "прочитать qr код с фото"],
              about: {
                title: "Когда это нужно",
                paragraphs: [
                  "QR-код пришёл в мессенджере или письме, висит на сайте или в PDF — навести на него камеру того же устройства не получится. Сделайте скриншот и загрузите его: распознавание выполняется в браузере, поэтому даже коды с реквизитами и паролями Wi-Fi не покидают устройство.",
                ],
              },
              faq: [
                { q: "Какие форматы изображений подходят?", a: "PNG, JPEG, WebP, GIF и другие форматы, которые открывает браузер. Большие фото тоже подойдут." },
                { q: "Найдутся ли несколько кодов на одной картинке?", a: "Сканер показывает первый найденный код. Если кодов несколько, обрежьте изображение до нужного." },
              ],
            },
            {
              name: "From an image",
              title: "Scan a QR Code from an Image or Screenshot",
              h1: "Scan a QR code from an image",
              description: "Upload a photo or screenshot, or paste an image from the clipboard — the scanner finds the QR code and shows what's inside. The image never leaves your device.",
              lead: "Drop an image or press Ctrl+V — the code's contents appear instantly.",
              keywords: ["scan qr code from image", "qr code from screenshot", "read qr code from photo"],
              about: {
                title: "When you need it",
                paragraphs: [
                  "A QR code arrived in a chat or email, sits on a web page or in a PDF — you can't point the same device's camera at it. Take a screenshot and upload it: recognition runs in the browser, so even codes with bank details or Wi-Fi passwords stay on your device.",
                ],
              },
              faq: [
                { q: "Which image formats work?", a: "PNG, JPEG, WebP, GIF and any other format your browser opens. Large photos are fine." },
                { q: "Will it find several codes in one image?", a: "The scanner shows the first code found. If there are several, crop the image to the one you need." },
              ],
            },
          ),
        ],
      },
    },
    {
      slug: "barcode-scanner",
      component: "qr/scanner",
      icon: "ScanBarcode",
      props: { all: true },
      name: { ru: "Сканер штрихкодов", en: "Barcode scanner" },
      title: { ru: "Сканер штрихкодов онлайн — EAN-13, Code 128, QR", en: "Barcode Scanner Online — EAN, UPC, Code 128, QR" },
      h1: { ru: "Сканер штрихкодов", en: "Barcode scanner" },
      description: {
        ru: "Считайте штрихкод камерой или с фото: EAN-13, EAN-8, UPC, Code 128, Code 39, ITF, Data Matrix, PDF417 и QR. Распознавание в браузере, данные никуда не отправляются.",
        en: "Read a barcode with your camera or from a photo: EAN-13, EAN-8, UPC, Code 128, Code 39, ITF, Data Matrix, PDF417 and QR. Runs in the browser; nothing is uploaded.",
      },
      lead: {
        ru: "Наведите камеру на штрихкод товара, коробки или документа — номер и тип кода появятся ниже.",
        en: "Point the camera at a product, carton or document barcode — the number and symbology appear below.",
      },
      keywords: { ru: ["сканер штрихкодов онлайн", "считать штрихкод", "распознать штрихкод"], en: ["barcode scanner online", "scan barcode", "barcode reader"] },
      howTo: {
        ru: ["Включите камеру или загрузите фото штрихкода.", "Держите штрихкод горизонтально, чтобы он целиком попал в кадр.", "Скопируйте распознанный номер."],
        en: ["Start the camera or upload a photo of the barcode.", "Hold the barcode horizontally so it fits in the frame.", "Copy the recognised number."],
      },
      faq: {
        ru: [
          { q: "Покажет ли сканер название товара?", a: "Нет: в штрихкоде записан только номер. Название хранится в базах магазинов и GS1, а сканер работает без интернета и никуда номер не отправляет." },
          { q: "Почему не читается мелкий штрихкод?", a: "Камере ноутбука не хватает резкости на близком расстоянии. Сфотографируйте штрихкод телефоном и загрузите снимок." },
        ],
        en: [
          { q: "Will it show the product name?", a: "No: a barcode stores only a number. Names live in retailer and GS1 databases, while this scanner works offline and never sends the number anywhere." },
          { q: "Why won't a small barcode scan?", a: "Laptop cameras can't focus up close. Photograph the barcode with a phone and upload the picture." },
        ],
      },
    },
    {
      slug: "barcode-generator",
      seoAlt: { ru: ["создать штрихкод онлайн", "создать штрихкод", "PNG и SVG"], en: ["create a barcode online", "create a barcode", "PNG and SVG"] },
      component: "qr/barcode",
      icon: "Barcode",
      popular: true,
      name: { ru: "Генератор штрихкодов", en: "Barcode generator" },
      title: { ru: "Генератор штрихкодов — EAN-13, Code 128, UPC онлайн", en: "Barcode Generator — EAN-13, UPC, Code 128 Online" },
      h1: { ru: "Генератор штрихкодов", en: "Barcode generator" },
      description: {
        ru: "Создайте штрихкод EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF-14, Codabar или MSI. Контрольная цифра считается сама; скачайте PNG или векторный SVG.",
        en: "Create EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF-14, Codabar or MSI barcodes. The check digit is calculated for you; download a PNG or a vector SVG.",
      },
      lead: {
        ru: "Выберите тип штрихкода и введите номер — изображение готово к печати, контрольная цифра проверена.",
        en: "Pick a symbology and enter the number — the image is print-ready and the check digit verified.",
      },
      keywords: { ru: ["генератор штрихкодов", "создать штрихкод", "штрихкод онлайн"], en: ["barcode generator", "create barcode", "barcode maker"] },
      howTo: {
        ru: ["Выберите тип штрихкода: для товаров — EAN-13, для склада — Code 128.", "Введите номер: контрольная цифра добавится или проверится автоматически.", "Скачайте PNG или SVG и проверьте печать сканером."],
        en: ["Choose the symbology: EAN-13 for retail, Code 128 for warehouses.", "Enter the number — the check digit is added or verified automatically.", "Download a PNG or SVG and test the print with a scanner."],
      },
      faq: {
        ru: [
          { q: "Какой штрихкод выбрать?", a: "Для товаров в рознице — EAN-13 (в США — UPC-A), для коробов — ITF-14, для внутреннего учёта, складов и документов — Code 128. Если нужно закодировать ссылку или текст, выберите QR-код." },
          { q: "Как печатать, чтобы сканировалось?", a: "Чёрные штрихи на белом фоне, без растяжения по ширине и с пустыми полями слева и справа. SVG сохраняет точную геометрию при любом масштабе." },
        ],
        en: [
          { q: "Which barcode should I choose?", a: "EAN-13 for retail products (UPC-A in the US), ITF-14 for cartons, Code 128 for internal tracking, warehouses and documents. To encode a link or text, use a QR code." },
          { q: "How do I print it so it scans?", a: "Black bars on white, no horizontal stretching, and empty margins on both sides. SVG keeps exact geometry at any scale." },
        ],
      },
      variants: {
        title: { ru: "Типы штрихкодов", en: "Barcode types" },
        list: () => BARCODE_VARIANTS,
      },
    },
    {
      slug: "check-digit-calculator",
      seoAlt: { ru: ["контрольная цифра штрихкода", "контрольная цифра"], en: ["barcode check digit", "check digit", "online"] },
      component: "qr/check-digit",
      icon: "Calculator",
      name: { ru: "Калькулятор контрольной цифры", en: "Check digit calculator" },
      title: { ru: "Калькулятор контрольной цифры штрихкода EAN, UPC, GTIN", en: "Check Digit Calculator — EAN-13, UPC, GTIN, SSCC" },
      h1: { ru: "Калькулятор контрольной цифры штрихкода", en: "Barcode check digit calculator" },
      description: {
        ru: "Рассчитайте контрольную цифру EAN-13, EAN-8, UPC-A, UPC-E, GTIN-14, SSCC или ISBN-10 и проверьте готовый код. Пошаговый расчёт по алгоритму GS1 mod 10.",
        en: "Calculate the check digit of EAN-13, EAN-8, UPC-A, UPC-E, GTIN-14, SSCC or ISBN-10, or verify a full code. Step-by-step calculation with the GS1 mod 10 algorithm.",
      },
      lead: {
        ru: "Введите цифры без последней — калькулятор допишет контрольную и покажет расчёт; полный код он проверит.",
        en: "Enter the digits without the last one — the calculator appends the check digit and shows the maths; a full code gets verified.",
      },
      keywords: { ru: ["контрольная цифра штрихкода", "расчет контрольной цифры", "проверка штрихкода"], en: ["check digit calculator", "gs1 check digit", "barcode check digit"] },
      howTo: {
        ru: ["Выберите тип кода.", "Введите цифры без контрольной — или весь код, чтобы проверить его.", "Скопируйте полный номер или откройте расчёт по шагам."],
        en: ["Choose the code type.", "Enter the digits without the check digit — or the full code to verify it.", "Copy the full number or open the step-by-step calculation."],
      },
      faq: {
        ru: [
          { q: "Зачем нужна контрольная цифра?", a: "Она ловит опечатки: любая одна неверная цифра и большинство перестановок соседних цифр меняют сумму, и сканер отвергает код." },
          { q: "Как считается GS1 mod 10?", a: "Справа налево цифры умножаются попеременно на 3 и 1, произведения складываются, контрольная цифра дополняет сумму до ближайшего кратного 10." },
        ],
        en: [
          { q: "Why is there a check digit?", a: "It catches typos: any single wrong digit and most swaps of adjacent digits change the sum, so the scanner rejects the code." },
          { q: "How does GS1 mod 10 work?", a: "From the right, digits are multiplied alternately by 3 and 1, the products are summed, and the check digit rounds the sum up to the next multiple of 10." },
        ],
      },
      related: ["isbn-validator"],
      variants: {
        title: { ru: "Типы кодов", en: "Code types" },
        list: () => CHECK_VARIANTS,
      },
    },
  ],
});
