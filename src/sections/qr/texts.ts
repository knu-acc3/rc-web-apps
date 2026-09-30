/* Variant page texts for the QR and barcode tools. */

import type { Locale } from "@/i18n/config";
import type { Block, QA, VariantDef } from "@/registry/types";
import { appStorePayload, eventPayload, geoPayload, mailtoPayload, smsPayload, telPayload, whatsappPayload } from "./payloads";

export interface VT {
  name: string;
  title: string;
  h1: string;
  description: string;
  lead: string;
  keywords: string[];
  about?: { title: string; paragraphs: string[] };
  table?: { title: string; head: string[]; rows: string[][] };
  faq: QA[];
}

type Row = [string, string];

/** What exactly goes into the code for each QR type: a real payload built by the same functions the generator uses. */
const PAYLOAD: Record<string, { ru: Row[]; en: Row[]; example: { ru: string; en: string } }> = {
  email: {
    example: { ru: mailtoPayload({ to: "info@example.com", subject: "Отзыв", body: "Здравствуйте!" }), en: mailtoPayload({ to: "info@example.com", subject: "Feedback", body: "Hello!" }) },
    ru: [["Формат", "ссылка mailto: с полями subject и body"], ["Открывается в", "почтовом приложении по умолчанию: Почта, Gmail, Outlook"], ["Кириллица", "кодируется как %D0%9E… — это нормально"]],
    en: [["Format", "a mailto: link with subject and body"], ["Opens in", "the default mail app: Mail, Gmail, Outlook"], ["Special characters", "percent-encoded, e.g. a space becomes %20"]],
  },
  sms: {
    example: { ru: smsPayload({ phone: "+7 700 123-45-67", message: "Запись на 15:00" }), en: smsPayload({ phone: "+1 555 010 0199", message: "Book me for 3 pm" }) },
    ru: [["Формат", "SMSTO:номер:текст (или sms:номер?body=…)"], ["Открывается в", "«Сообщениях» на iPhone и Android"], ["Отправка", "только после нажатия «Отправить»"]],
    en: [["Format", "SMSTO:number:text (or sms:number?body=…)"], ["Opens in", "Messages on iPhone and Android"], ["Sending", "only after the person taps Send"]],
  },
  phone: {
    example: { ru: telPayload("+7 (700) 123-45-67"), en: telPayload("+1 (555) 010-0199") },
    ru: [["Формат", "tel:+номер без пробелов и скобок"], ["Действие", "телефон предлагает позвонить"], ["Номер", "в международном виде с +, чтобы работал из любой страны"]],
    en: [["Format", "tel:+number without spaces or brackets"], ["Action", "the phone offers to call"], ["Number", "in international form with +, so it works from any country"]],
  },
  whatsapp: {
    example: { ru: whatsappPayload({ phone: "+7 700 123 45 67", message: "Здравствуйте!" }), en: whatsappPayload({ phone: "+1 555 010 0199", message: "Hi!" }) },
    ru: [["Формат", "ссылка wa.me/номер?text=…"], ["Номер", "только цифры с кодом страны, без + и нулей"], ["Без WhatsApp", "ссылка откроется в браузере с кнопкой установки"]],
    en: [["Format", "a wa.me/number?text=… link"], ["Number", "digits only with the country code, no + or leading zeros"], ["Without WhatsApp", "the link opens in a browser with an install button"]],
  },
  telegram: {
    example: { ru: "https://t.me/durov", en: "https://t.me/durov" },
    ru: [["Формат", "ссылка t.me/имя"], ["Подходит для", "профиля, канала, группы или бота"], ["Имя", "5–32 символа: латиница, цифры и _"]],
    en: [["Format", "a t.me/username link"], ["Works for", "a profile, channel, group or bot"], ["Username", "5–32 characters: Latin letters, digits and _"]],
  },
  location: {
    example: { ru: geoPayload(51.128207, 71.430411, "Астана"), en: geoPayload(51.507351, -0.127758, "London") },
    ru: [["Формат", "geo:широта,долгота или ссылка Google Maps / Яндекс Карт"], ["Точность", "6 знаков после запятой — около 10 см"], ["Открывается в", "картах по умолчанию или в выбранном сервисе"]],
    en: [["Format", "geo:latitude,longitude or a Google Maps link"], ["Precision", "6 decimal places — about 10 cm"], ["Opens in", "the default maps app or the chosen service"]],
  },
  event: {
    example: {
      ru: eventPayload({ title: "Встреча выпускников", start: "2026-10-15T19:00", end: "2026-10-15T22:00", location: "Кафе «Уют»" }),
      en: eventPayload({ title: "Reunion", start: "2026-10-15T19:00", end: "2026-10-15T22:00", location: "Main Hall" }),
    },
    ru: [["Формат", "iCalendar VEVENT (RFC 5545)"], ["Время", "местное: у гостя встреча будет на те же часы"], ["Открывается в", "Календаре iPhone, Google Календаре и Outlook"]],
    en: [["Format", "iCalendar VEVENT (RFC 5545)"], ["Time", "floating local time: guests see the same clock time"], ["Opens in", "iPhone Calendar, Google Calendar and Outlook"]],
  },
  "app-store": {
    example: { ru: appStorePayload({ store: "apple", id: "id284882215" }), en: appStorePayload({ store: "google", id: "com.whatsapp" }) },
    ru: [["App Store", "apps.apple.com/app/id…"], ["Google Play", "play.google.com/store/apps/details?id=…"], ["Где взять ID", "в адресе страницы приложения в магазине"]],
    en: [["App Store", "apps.apple.com/app/id…"], ["Google Play", "play.google.com/store/apps/details?id=…"], ["Where to find the ID", "in the address of the app's store page"]],
  },
};

function payloadBlock(slug: string, l: Locale): Block | null {
  const p = PAYLOAD[slug];
  if (!p) return null;
  return {
    type: "facts",
    title: l === "ru" ? "Что записано в коде" : "What the code contains",
    rows: [...p[l], [l === "ru" ? "Пример" : "Example", p.example[l]]],
  };
}

export function variant(slug: string, props: Record<string, unknown>, ru: VT, en: VT): VariantDef {
  const t = { ru, en };
  return {
    slug,
    name: { ru: ru.name, en: en.name },
    title: { ru: ru.title, en: en.title },
    h1: { ru: ru.h1, en: en.h1 },
    description: { ru: ru.description, en: en.description },
    lead: { ru: ru.lead, en: en.lead },
    props,
    keywords: { ru: ru.keywords, en: en.keywords },
    blocks: (l: Locale) => {
      const v = t[l];
      const out: Block[] = [];
      if (v.about) out.push({ type: "text", title: v.about.title, paragraphs: v.about.paragraphs });
      if (v.table) out.push({ type: "table", title: v.table.title, head: v.table.head, rows: v.table.rows });
      const payload = payloadBlock(slug, l);
      if (payload) out.push(payload);
      return out;
    },
    faq: { ru: ru.faq, en: en.faq },
  };
}

/* ───────────── QR generator ───────────── */

export const QR_VARIANTS: VariantDef[] = [
  variant(
    "wifi",
    { type: "wifi" },
    {
      name: "Wi-Fi",
      title: "QR-код для Wi-Fi — подключение без ввода пароля",
      h1: "QR-код для Wi-Fi",
      description: "Создайте QR-код Wi-Fi: гости наведут камеру и подключатся к сети без ввода пароля. WPA/WPA2/WPA3, WEP, открытые и скрытые сети. Пароль не покидает браузер.",
      lead: "Введите имя сети и пароль — телефон подключится, как только камера увидит код.",
      keywords: ["qr код wifi", "qr код для вай фай", "поделиться wifi qr"],
      about: {
        title: "Как работает QR-код Wi-Fi",
        paragraphs: [
          "В коде записана строка вида WIFI:T:WPA;S:ИмяСети;P:пароль;; — её понимают встроенные камеры iPhone (с iOS 11) и Android (с версии 10), отдельное приложение не нужно. Спецсимволы ; , : \\ и кавычки в имени сети и пароле генератор экранирует обратной косой чертой, как требует формат, поэтому сложный пароль не сломает код.",
          "Распечатайте код на табличке у входа или в меню — гостям не придётся диктовать пароль. Для WPA3 выбирайте тот же пункт WPA: тип шифрования телефон определит сам при подключении.",
        ],
      },
      faq: [
        { q: "Безопасно ли выкладывать такой код?", a: "Пароль хранится в коде открытым текстом: любой, кто его отсканирует, увидит пароль. Для гостей лучше завести отдельную гостевую сеть на роутере и печатать код именно от неё." },
        { q: "Что делать со скрытой сетью?", a: "Отметьте «Скрытая сеть» в дополнительных полях — в код добавится H:true, и телефон будет искать сеть по имени, даже если она не транслирует SSID." },
      ],
    },
    {
      name: "Wi-Fi",
      title: "Wi-Fi QR Code Generator — Connect Without a Password",
      h1: "Wi-Fi QR code generator",
      description: "Create a Wi-Fi QR code: guests join your network by pointing the camera, no typing. WPA/WPA2/WPA3, WEP, open and hidden networks. The password stays in your browser.",
      lead: "Enter the network name and password — phones join as soon as the camera sees the code.",
      keywords: ["wifi qr code", "wifi qr code generator", "share wifi qr"],
      about: {
        title: "How a Wi-Fi QR code works",
        paragraphs: [
          "The code holds a string like WIFI:T:WPA;S:NetworkName;P:password;; which the built-in cameras of iPhone (iOS 11+) and Android (10+) understand without an app. Special characters ; , : \\ and quotes in the name or password are backslash-escaped as the format requires, so a complex password won't break the code.",
          "Print it on a card by the door or in the menu so nobody has to spell the password. For WPA3 pick the same WPA option: the phone negotiates the exact security type when it connects.",
        ],
      },
      faq: [
        { q: "Is it safe to display this code?", a: "The password is stored in plain text: anyone who scans the code can read it. For visitors, set up a separate guest network on your router and print the code for that one." },
        { q: "What about a hidden network?", a: "Tick “Hidden network” under more fields — the code gets H:true and the phone looks for the network by name even though it doesn't broadcast its SSID." },
      ],
    },
  ),
  variant(
    "vcard",
    { type: "vcard" },
    {
      name: "Визитка vCard",
      title: "QR-код визитки vCard — контакт в телефон одним сканом",
      h1: "QR-код для визитки",
      description: "QR-код с контактом в формате vCard 3.0 или MECARD: имя, телефон, email, компания и адрес. После сканирования телефон предложит сохранить контакт. SVG для печати.",
      lead: "Заполните имя и телефон — отсканировав код, человек сохранит ваш контакт одним нажатием.",
      keywords: ["qr код визитка", "vcard qr код", "qr код контакта"],
      about: {
        title: "vCard или MECARD",
        paragraphs: [
          "vCard 3.0 — универсальный формат контактов: его понимают iPhone, Android и почтовые программы, он хранит несколько телефонов, должность, адрес и заметку. Генератор соблюдает спецификацию RFC 2426: экранирует запятые и точки с запятой, переносит длинные строки и разделяет их CRLF.",
          "MECARD короче, поэтому код получается менее плотным — это удобно для маленьких визиток. Зато в нём меньше полей. Если код получается слишком плотным, уберите необязательные поля или переключитесь на MECARD.",
        ],
      },
      faq: [
        { q: "Какого размера печатать код на визитке?", a: "Не меньше 2×2 см, а для vCard со многими полями — 2,5–3 см. Оставьте вокруг белое поле шириной в четыре модуля кода и проверьте печать сканером." },
        { q: "Можно ли добавить фото?", a: "Нет: фотография не поместится в QR-код. Добавьте ссылку на сайт или профиль — там может быть и фото." },
      ],
    },
    {
      name: "vCard contact",
      title: "vCard QR Code Generator — Save a Contact in One Scan",
      h1: "vCard QR code generator",
      description: "A QR code with a contact card in vCard 3.0 or MECARD: name, phone, email, company and address. Scanning offers to save the contact. Vector SVG for business cards.",
      lead: "Fill in a name and phone — whoever scans the code saves your contact with one tap.",
      keywords: ["vcard qr code", "business card qr code", "contact qr code"],
      about: {
        title: "vCard or MECARD",
        paragraphs: [
          "vCard 3.0 is the universal contact format: iPhone, Android and mail apps read it, and it holds several phones, job title, address and a note. The generator follows RFC 2426: it escapes commas and semicolons, folds long lines and separates them with CRLF.",
          "MECARD is shorter, so the code is less dense — handy on small cards — but it has fewer fields. If the code gets too dense, drop optional fields or switch to MECARD.",
        ],
      },
      faq: [
        { q: "How big should the code be on a business card?", a: "At least 2×2 cm, and 2.5–3 cm for a vCard with many fields. Keep a white margin four modules wide around it and test the print with a scanner." },
        { q: "Can I add a photo?", a: "No: a photo won't fit in a QR code. Add a link to your website or profile instead." },
      ],
    },
  ),
  variant(
    "text",
    { type: "text" },
    {
      name: "Текст",
      title: "QR-код с текстом — закодировать текст онлайн",
      h1: "QR-код с текстом",
      description: "Закодируйте любой текст в QR-код: кириллица в UTF-8, до 2 953 байт — это почти 1 500 русских букв. Размер кода подбирается автоматически, скачайте PNG или SVG.",
      lead: "Вставьте текст — код появится сразу; кириллица сохраняется в UTF-8 и читается любым сканером.",
      keywords: ["qr код с текстом", "текст в qr код", "зашифровать текст в qr"],
      about: {
        title: "Сколько текста помещается",
        paragraphs: [
          "Максимальный QR-код (версия 40) вмещает 2 953 байта при уровне коррекции L. Латиница занимает байт на символ, кириллица — два, поэтому русского текста помещается почти вдвое меньше. Цифры и заглавные латинские буквы кодируются плотнее: до 7 089 цифр или 4 296 символов.",
          "Чем больше текста, тем мельче модули и тем крупнее код нужно печатать. Для длинного текста удобнее выложить его на страницу и закодировать ссылку.",
        ],
      },
      faq: [
        { q: "Почему сканер показывает «кракозябры»?", a: "Некоторые старые сканеры читают байты как Latin-1. Генератор кодирует текст в UTF-8 — так его правильно показывают камеры iPhone и Android и большинство приложений." },
        { q: "Можно ли спрятать текст от посторонних?", a: "Нет, QR-код не шифрует данные: любой сканер покажет текст. Если нужна тайна, зашифруйте текст отдельно." },
      ],
    },
    {
      name: "Text",
      title: "Text to QR Code — Encode Any Text Online",
      h1: "Text to QR code",
      description: "Encode any text in a QR code: UTF-8 for every language, up to 2,953 bytes. Version and size are chosen automatically; download a PNG or a scalable SVG.",
      lead: "Paste your text — the code appears instantly and any scanner reads it back in UTF-8.",
      keywords: ["text to qr code", "qr code with text", "plain text qr"],
      about: {
        title: "How much text fits",
        paragraphs: [
          "The largest QR code (version 40) holds 2,953 bytes at error-correction level L. Latin letters take one byte each, Cyrillic two, most Asian scripts three. Digits and upper-case Latin letters pack tighter: up to 7,089 digits or 4,296 characters.",
          "The more text, the smaller the modules and the larger you must print the code. For long text, put it on a web page and encode the link instead.",
        ],
      },
      faq: [
        { q: "Why does a scanner show garbled characters?", a: "Some old scanners read bytes as Latin-1. This generator encodes UTF-8, which iPhone and Android cameras and most apps display correctly." },
        { q: "Can I hide the text from others?", a: "No, a QR code doesn't encrypt anything: any scanner shows the text. Encrypt it separately if it's secret." },
      ],
    },
  ),
  variant(
    "email",
    { type: "email" },
    {
      name: "Email",
      title: "QR-код для email — письмо с готовой темой и текстом",
      h1: "QR-код для электронной почты",
      description: "QR-код, который открывает новое письмо: адрес, тема и текст уже заполнены (ссылка mailto:). Удобно для обратной связи на листовках, упаковке и стендах.",
      lead: "Укажите адрес, тему и текст — после сканирования откроется готовое письмо.",
      keywords: ["qr код email", "qr код почта", "mailto qr"],
      faq: [
        { q: "Письмо отправится само?", a: "Нет: код только открывает почтовое приложение с заполненными полями, отправляет письмо сам человек." },
        { q: "Можно указать несколько адресов?", a: "Да, через запятую без пробелов: a@example.com,b@example.com. Не все почтовые клиенты это поддерживают, так что проверьте на своём телефоне." },
      ],
    },
    {
      name: "Email",
      title: "Email QR Code Generator — Pre-filled Subject and Body",
      h1: "Email QR code generator",
      description: "A QR code that opens a new email with the address, subject and body already filled in (a mailto: link). Handy for feedback on flyers, packaging and stands.",
      lead: "Enter the address, subject and text — scanning opens a ready-to-send email.",
      keywords: ["email qr code", "mailto qr code"],
      faq: [
        { q: "Is the email sent automatically?", a: "No: the code only opens the mail app with the fields filled in; the person still taps Send." },
        { q: "Can I add several addresses?", a: "Yes, comma-separated without spaces: a@example.com,b@example.com. Not every mail client supports it, so test on your phone." },
      ],
    },
  ),
  variant(
    "sms",
    { type: "sms" },
    {
      name: "SMS",
      title: "QR-код для SMS — готовое сообщение на номер",
      h1: "QR-код для SMS",
      description: "QR-код открывает SMS с заполненным номером и текстом сообщения. Подходит для голосований, подписок и заявок по SMS: человеку остаётся нажать «Отправить».",
      lead: "Введите номер и текст — после сканирования откроется SMS, готовое к отправке.",
      keywords: ["qr код sms", "qr код смс сообщение"],
      faq: [
        { q: "Какой формат используется?", a: "SMSTO:номер:текст — его понимают камеры смартфонов и популярные сканеры. Номер лучше писать в международном формате, с плюсом и кодом страны." },
        { q: "Сколько символов можно добавить?", a: "Сам код вместит много, но длинные сообщения делятся на части и дороже стоят: кириллицей в одно SMS помещается 70 символов, латиницей — 160." },
      ],
    },
    {
      name: "SMS",
      title: "SMS QR Code Generator — Pre-filled Text Message",
      h1: "SMS QR code generator",
      description: "A QR code that opens a text message with the number and text pre-filled. Great for SMS votes, sign-ups and requests — the person only has to tap Send.",
      lead: "Enter the number and message — scanning opens an SMS ready to send.",
      keywords: ["sms qr code", "text message qr code"],
      faq: [
        { q: "Which format is used?", a: "SMSTO:number:text, understood by phone cameras and popular scanner apps. Write the number in international format with a plus and country code." },
        { q: "How long can the message be?", a: "The code can hold a lot, but long messages split into parts: one SMS carries 160 Latin characters or 70 in Cyrillic and other non-Latin scripts." },
      ],
    },
  ),
  variant(
    "phone",
    { type: "phone" },
    {
      name: "Телефон",
      title: "QR-код с номером телефона — звонок одним касанием",
      h1: "QR-код с номером телефона",
      description: "QR-код с номером телефона (ссылка tel:): после сканирования смартфон предложит позвонить. Укажите номер в международном формате, с кодом страны.",
      lead: "Введите номер — отсканировав код, человек позвонит без набора цифр.",
      keywords: ["qr код номер телефона", "qr код позвонить"],
      faq: [
        { q: "Нужно ли писать +7?", a: "Да, лучше в международном формате: +7 701 234 56 78. Так номер сработает и у туристов с иностранными SIM-картами." },
        { q: "Можно ли добавить добавочный номер?", a: "Формально можно через запятую (пауза), но не все телефоны это поддерживают. Надёжнее указать добавочный рядом с кодом текстом." },
      ],
    },
    {
      name: "Phone",
      title: "Phone Number QR Code — Call with One Tap",
      h1: "Phone number QR code",
      description: "A QR code with a phone number (a tel: link): scanning offers to call it. Write the number in international format with the country code so it works everywhere.",
      lead: "Enter the number — whoever scans the code can call without dialling.",
      keywords: ["phone number qr code", "call qr code"],
      faq: [
        { q: "Should I include the country code?", a: "Yes, use the international format, e.g. +44 20 7946 0958. That way it also works for visitors with foreign SIM cards." },
        { q: "Can I add an extension?", a: "Technically with a comma (pause), but not all phones support it. It's safer to print the extension as text next to the code." },
      ],
    },
  ),
  variant(
    "whatsapp",
    { type: "whatsapp" },
    {
      name: "WhatsApp",
      title: "QR-код WhatsApp — ссылка на чат с готовым текстом",
      h1: "QR-код для WhatsApp",
      description: "QR-код открывает чат WhatsApp с вашим номером и заранее набранным сообщением (ссылка wa.me). Для визиток, витрин и доставки: клиенту не нужно сохранять номер.",
      lead: "Укажите номер WhatsApp и, если нужно, текст — код откроет чат с вами.",
      keywords: ["qr код whatsapp", "qr код ватсап", "ссылка wa.me"],
      faq: [
        { q: "В каком формате указывать номер?", a: "С кодом страны, без 8 в начале: +7 701 234 56 78, а не 8 701… Ссылка wa.me принимает только цифры международного номера." },
        { q: "Сработает ли, если WhatsApp не установлен?", a: "Откроется веб-страница WhatsApp с предложением установить приложение или открыть чат в WhatsApp Web." },
      ],
    },
    {
      name: "WhatsApp",
      title: "WhatsApp QR Code Generator — Chat Link with Message",
      h1: "WhatsApp QR code generator",
      description: "A QR code that opens a WhatsApp chat with your number and a pre-typed message (a wa.me link). For business cards, shop windows and deliveries.",
      lead: "Enter your WhatsApp number and an optional message — the code opens a chat with you.",
      keywords: ["whatsapp qr code", "wa.me qr code"],
      faq: [
        { q: "What number format should I use?", a: "The full international number with country code and no leading zeros or trunk prefix: wa.me links accept digits only." },
        { q: "What if WhatsApp isn't installed?", a: "A WhatsApp web page opens, offering to install the app or continue in WhatsApp Web." },
      ],
    },
  ),
  variant(
    "telegram",
    { type: "telegram" },
    {
      name: "Telegram",
      title: "QR-код Telegram — на канал, бота или профиль",
      h1: "QR-код для Telegram",
      description: "QR-код со ссылкой t.me на канал, группу, бота или профиль в Telegram. Вставьте @username или ссылку целиком — код откроет Telegram сразу после сканирования.",
      lead: "Укажите @username или ссылку t.me — код приведёт прямо в ваш канал, чат или бот.",
      keywords: ["qr код telegram", "qr код телеграм канала", "qr код на бота"],
      faq: [
        { q: "Подойдёт ли пригласительная ссылка в закрытую группу?", a: "Да, вставьте ссылку вида https://t.me/+AbCdEf целиком. Помните, что любой, кто отсканирует код, сможет вступить." },
        { q: "В самом Telegram есть QR-код профиля — зачем генератор?", a: "Здесь можно скачать код в SVG для печати, выбрать цвета, добавить логотип и сделать код для бота или чужого канала." },
      ],
    },
    {
      name: "Telegram",
      title: "Telegram QR Code — Channel, Bot or Profile Link",
      h1: "Telegram QR code generator",
      description: "A QR code with a t.me link to a Telegram channel, group, bot or profile. Paste a @username or the full link — scanning opens Telegram straight away.",
      lead: "Enter a @username or t.me link — the code leads straight to your channel, chat or bot.",
      keywords: ["telegram qr code", "t.me qr code"],
      faq: [
        { q: "Does an invite link to a private group work?", a: "Yes, paste the full https://t.me/+AbCdEf link. Remember that anyone who scans the code can join." },
        { q: "Telegram has its own profile QR — why use this?", a: "Here you get a print-ready SVG, custom colours and a logo, and you can make codes for bots or any channel." },
      ],
    },
  ),
  variant(
    "location",
    { type: "geo" },
    {
      name: "Геолокация",
      title: "QR-код с геолокацией — точка на Google или Яндекс Картах",
      h1: "QR-код с геолокацией",
      description: "QR-код с координатами: откроет точку в Google Картах, Яндекс Картах или приложении карт по умолчанию. Понимает десятичные градусы и формат 43°14′20″N.",
      lead: "Вставьте координаты или ссылку из карт — код откроет точное место на карте.",
      keywords: ["qr код геолокации", "qr код координаты", "qr код на карту"],
      faq: [
        { q: "Где взять координаты?", a: "В Google Картах нажмите на точку и скопируйте числа из карточки места, в Яндекс Картах — кликните по месту, координаты появятся внизу. Можно вставить и ссылку Google Карт с @широта,долгота." },
        { q: "Какой формат выбрать?", a: "Ссылка на Google или Яндекс Карты открывается на любом телефоне. Формат geo: откроет приложение карт по умолчанию, но на iPhone его понимают не все сканеры." },
      ],
    },
    {
      name: "Location",
      title: "Location QR Code — Open a Point in Google Maps",
      h1: "Location QR code generator",
      description: "A QR code with coordinates that opens the exact point in Google Maps, Yandex Maps or the default maps app. Accepts decimal degrees and 43°14′20″N notation.",
      lead: "Paste coordinates or a maps link — the code opens the exact spot on a map.",
      keywords: ["location qr code", "google maps qr code", "gps coordinates qr"],
      faq: [
        { q: "Where do I get the coordinates?", a: "In Google Maps, tap a spot and copy the numbers from the place card. You can also paste a Google Maps link containing @latitude,longitude." },
        { q: "Which format should I choose?", a: "A Google or Yandex Maps link works on any phone. The geo: format opens the default maps app, but not every iPhone scanner supports it." },
      ],
    },
  ),
  variant(
    "event",
    { type: "event" },
    {
      name: "Событие",
      title: "QR-код события — добавить встречу в календарь",
      h1: "QR-код события для календаря",
      description: "QR-код с событием в формате iCalendar (VEVENT): название, начало, окончание и место. Сканер предложит добавить встречу в календарь — для приглашений и афиш.",
      lead: "Укажите название и время — отсканировав код, гость добавит событие в свой календарь.",
      keywords: ["qr код события", "qr код календарь", "qr код приглашение"],
      faq: [
        { q: "В каком часовом поясе будет время?", a: "Время записывается «плавающим» — без пояса, поэтому календарь покажет его в поясе телефона. Для местных событий это как раз то, что нужно." },
        { q: "Все ли телефоны это понимают?", a: "Android и большинство сканеров предлагают добавить событие. Если камера телефона показывает только текст, подойдёт любое приложение-сканер." },
      ],
    },
    {
      name: "Event",
      title: "Calendar Event QR Code — Add to Calendar by Scan",
      h1: "Calendar event QR code",
      description: "A QR code with an iCalendar event (VEVENT): title, start, end and location. Scanners offer to add it to the calendar — ideal for invitations and posters.",
      lead: "Enter a title and time — guests scan the code and add the event to their calendar.",
      keywords: ["event qr code", "calendar qr code", "ical qr code"],
      faq: [
        { q: "Which time zone is used?", a: "Times are written as floating local time without a zone, so the calendar shows them in the phone's time zone — right for local events." },
        { q: "Does every phone support it?", a: "Android and most scanner apps offer to add the event. If a phone camera only shows text, any scanner app will do." },
      ],
    },
  ),
  variant(
    "payment",
    { type: "gost" },
    {
      name: "Оплата по реквизитам",
      title: "QR-код для оплаты по реквизитам — ГОСТ Р 56042-2014",
      h1: "Платёжный QR-код по ГОСТ Р 56042-2014",
      description: "Платёжный QR-код ST00012 по ГОСТ Р 56042-2014: получатель, счёт, БИК, сумма и назначение. Банковские приложения заполнят платёж по скану. Проверка ключа счёта.",
      lead: "Заполните реквизиты — клиент отсканирует код в приложении банка и увидит готовый платёж.",
      keywords: ["qr код для оплаты по реквизитам", "гост р 56042-2014", "платежный qr код st00012"],
      about: {
        title: "Как устроен платёжный QR-код",
        paragraphs: [
          "Код начинается со служебного заголовка ST00012 (формат, версия 0001, кодировка UTF-8), затем идут поля «ключ=значение», разделённые вертикальной чертой. Обязательные поля — Name, PersonalAcc, BankName, BIC и CorrespAcc; сумма Sum указывается в копейках: 1 500,50 ₽ → 150050.",
          "Генератор проверяет длины полей и контрольный ключ расчётного и корреспондентского счёта по БИК — так ловятся опечатки в реквизитах до печати квитанции.",
        ],
      },
      table: {
        title: "Поля платёжного кода",
        head: ["Поле", "Что означает", "Формат"],
        rows: [
          ["Name", "Наименование получателя", "до 160 символов"],
          ["PersonalAcc", "Расчётный счёт получателя", "20 цифр"],
          ["BankName", "Банк получателя", "до 45 символов"],
          ["BIC", "БИК банка", "9 цифр"],
          ["CorrespAcc", "Корреспондентский счёт банка", "20 цифр или 0"],
          ["Sum", "Сумма", "в копейках"],
          ["Purpose", "Назначение платежа", "до 210 символов"],
          ["PayeeINN / KPP", "ИНН и КПП получателя", "10–12 и 9 цифр"],
        ],
      },
      faq: [
        { q: "Какие банки понимают такой код?", a: "Сканер платёжных QR-кодов есть в приложениях большинства российских банков: платёж открывается с заполненными реквизитами, человеку остаётся проверить и подтвердить." },
        { q: "Чем это отличается от QR-кода СБП?", a: "QR-код СБП создаёт банк продавца, и оплата идёт через Систему быстрых платежей. Код по ГОСТ Р 56042 — это просто реквизиты для обычного перевода, его можно сделать самому без договора с банком." },
      ],
    },
    {
      name: "Russian bank payment",
      title: "Russian Payment QR Code — GOST R 56042-2014 (ST00012)",
      h1: "Russian payment QR code (GOST R 56042-2014)",
      description: "Build an ST00012 payment QR code per GOST R 56042-2014: payee, account, BIK, amount and purpose. Banking apps pre-fill the transfer; account keys are checked.",
      lead: "Fill in the bank details — the payer scans the code in their banking app and sees a ready transfer.",
      keywords: ["gost r 56042-2014", "st00012 qr code", "russian payment qr"],
      about: {
        title: "How the payment code is built",
        paragraphs: [
          "The code starts with the ST00012 header (format, version 0001, UTF-8 encoding) followed by key=value fields separated by a vertical bar. Name, PersonalAcc, BankName, BIC and CorrespAcc are required; Sum is in kopecks: 1,500.50 RUB → 150050.",
          "The generator checks field lengths and the control key of the account and correspondent account against the BIK, catching typos before you print an invoice.",
        ],
      },
      table: {
        title: "Payment code fields",
        head: ["Field", "Meaning", "Format"],
        rows: [
          ["Name", "Payee name", "up to 160 characters"],
          ["PersonalAcc", "Payee account", "20 digits"],
          ["BankName", "Payee bank", "up to 45 characters"],
          ["BIC", "Bank BIK", "9 digits"],
          ["CorrespAcc", "Bank correspondent account", "20 digits or 0"],
          ["Sum", "Amount", "in kopecks"],
          ["Purpose", "Payment purpose", "up to 210 characters"],
          ["PayeeINN / KPP", "Payee INN and KPP", "10–12 and 9 digits"],
        ],
      },
      faq: [
        { q: "Which banks read this code?", a: "Most Russian banking apps have a payment QR scanner: the transfer opens with the details filled in and the payer only checks and confirms it." },
        { q: "How is it different from an SBP QR code?", a: "An SBP (Faster Payments System) code is issued by the merchant's bank. A GOST R 56042 code is just bank details for a regular transfer — you can make one yourself without a bank contract." },
      ],
    },
  ),
  variant(
    "sepa",
    { type: "epc" },
    {
      name: "Платёж SEPA (EPC)",
      title: "QR-код EPC для платежа SEPA (GiroCode)",
      h1: "QR-код EPC для перевода SEPA",
      description: "QR-код для перевода в евро по стандарту EPC069-12 (GiroCode): получатель, IBAN, сумма и назначение. Его понимают банки Германии, Австрии и других стран.",
      lead: "Введите получателя, IBAN и сумму — плательщик отсканирует код в приложении банка.",
      keywords: ["epc qr код", "girocode", "sepa qr код"],
      about: {
        title: "Формат EPC069-12",
        paragraphs: [
          "Код состоит из строк: BCD, версия 002, кодировка UTF-8, SCT, BIC, получатель, IBAN, сумма вида EUR12.30, код цели, структурированная ссылка или текст назначения. Весь блок не должен превышать 331 байт, а уровень коррекции по стандарту — M; генератор выставляет его сам.",
          "BIC в версии 002 необязателен для переводов внутри SEPA. Назначение платежа и структурированную ссылку (RF…) нельзя заполнять одновременно — генератор это проверяет.",
        ],
      },
      faq: [
        { q: "Можно ли указать сумму в других валютах?", a: "Нет, стандарт EPC описывает только переводы SEPA в евро: от 0,01 до 999 999 999,99 €." },
        { q: "Сумма обязательна?", a: "Нет. Без суммы плательщик введёт её сам — удобно для пожертвований." },
      ],
    },
    {
      name: "SEPA payment (EPC)",
      title: "EPC QR Code Generator — SEPA Transfer (GiroCode)",
      h1: "EPC QR code for SEPA transfers",
      description: "Create an EPC069-12 QR code (GiroCode) for a euro transfer: beneficiary, IBAN, amount and remittance text. Banking apps in Germany, Austria and beyond scan it.",
      lead: "Enter the beneficiary, IBAN and amount — the payer scans the code in their banking app.",
      keywords: ["epc qr code", "girocode generator", "sepa qr code"],
      about: {
        title: "The EPC069-12 format",
        paragraphs: [
          "The code is a series of lines: BCD, version 002, UTF-8 charset, SCT, BIC, name, IBAN, an amount like EUR12.30, purpose code, then a structured reference or remittance text. The whole block must stay under 331 bytes and the standard requires error-correction level M, which the generator sets for you.",
          "In version 002 the BIC is optional within SEPA. The remittance text and the structured RF reference can't both be filled in — the generator checks that.",
        ],
      },
      faq: [
        { q: "Can I use other currencies?", a: "No, the EPC standard covers SEPA credit transfers in euro only: from €0.01 to €999,999,999.99." },
        { q: "Is the amount required?", a: "No. Without it the payer types the amount — handy for donations." },
      ],
    },
  ),
  variant(
    "app-store",
    { type: "app" },
    {
      name: "Приложение",
      title: "QR-код на приложение — App Store и Google Play",
      h1: "QR-код для скачивания приложения",
      description: "QR-код со ссылкой на приложение в App Store или Google Play. Вставьте ссылку из магазина — генератор возьмёт ID приложения и соберёт чистую ссылку.",
      lead: "Вставьте ссылку на приложение — код откроет его страницу в магазине.",
      keywords: ["qr код на приложение", "qr код app store", "qr код google play"],
      faq: [
        { q: "Можно ли сделать один код для iPhone и Android?", a: "Для этого нужна страница на вашем сайте, которая определяет систему и перенаправляет в нужный магазин. Без сервера проще разместить два кода рядом с подписями." },
        { q: "Где найти ID приложения?", a: "В App Store это число после id в ссылке (id284882215), в Google Play — параметр id=com.example.app. Можно вставить ссылку целиком." },
      ],
    },
    {
      name: "App",
      title: "App Store QR Code — Link to App Store or Google Play",
      h1: "App download QR code",
      description: "A QR code linking to your app in the App Store or Google Play. Paste the store link — the generator extracts the app ID and builds a clean link.",
      lead: "Paste your app's store link — the code opens its store page.",
      keywords: ["app store qr code", "google play qr code", "app download qr"],
      faq: [
        { q: "Can one code serve both iPhone and Android?", a: "That needs a page on your site that detects the OS and redirects to the right store. Without a server, print two labelled codes side by side." },
        { q: "Where do I find the app ID?", a: "In the App Store it's the number after id in the link (id284882215); in Google Play it's the id=com.example.app parameter. You can paste the whole link." },
      ],
    },
  ),
  variant(
    "bulk",
    { type: "bulk" },
    {
      name: "Пакетно из CSV",
      title: "Массовая генерация QR-кодов из CSV — архив ZIP",
      h1: "Массовая генерация QR-кодов",
      description: "Создайте сотни QR-кодов за раз: вставьте список ссылок или загрузите CSV, выберите столбцы для содержимого и имён файлов и получите ZIP с PNG или SVG.",
      lead: "Одна строка — один код: вставьте список или CSV и скачайте все коды одним архивом.",
      keywords: ["массовая генерация qr кодов", "qr коды из csv", "много qr кодов"],
      about: {
        title: "Как подготовить файл",
        paragraphs: [
          "Подойдёт простой список (одна ссылка на строку) или таблица CSV из Excel и Google Таблиц. Разделитель — запятая, точка с запятой или табуляция — определяется сам, кавычки и BOM учитываются. Если столбцов несколько, выберите, какой кодировать и какой использовать как имя файла; повторяющиеся имена получат номера.",
          "Коды создаются прямо в браузере, поэтому списки клиентов и внутренние ссылки никуда не загружаются. Строки, которые не помещаются в QR-код, попадут в errors.txt внутри архива.",
        ],
      },
      faq: [
        { q: "Сколько кодов можно сделать за раз?", a: "До 2 000 строк за один архив. Для большего количества разбейте файл на части." },
        { q: "Применяются ли цвета и логотип?", a: "Да: уровень коррекции, цвета и логотип из настроек ниже действуют на все коды архива." },
      ],
    },
    {
      name: "Batch from CSV",
      title: "Bulk QR Code Generator — From CSV to ZIP",
      h1: "Bulk QR code generator",
      description: "Make hundreds of QR codes at once: paste a list of links or upload a CSV, pick the content and file-name columns, and download a ZIP of PNG or SVG files.",
      lead: "One line, one code: paste a list or CSV and download every code in a single archive.",
      keywords: ["bulk qr code generator", "qr codes from csv", "batch qr codes"],
      about: {
        title: "Preparing the file",
        paragraphs: [
          "A plain list (one link per line) or a CSV from Excel or Google Sheets works. The delimiter — comma, semicolon or tab — is detected automatically, and quotes and BOM are handled. With several columns, choose which to encode and which to use as the file name; duplicate names get numbers.",
          "Codes are made in your browser, so customer lists and internal links are never uploaded. Rows too long for a QR code are listed in errors.txt inside the archive.",
        ],
      },
      faq: [
        { q: "How many codes can I make at once?", a: "Up to 2,000 rows per archive. Split larger files into parts." },
        { q: "Do colours and the logo apply?", a: "Yes: the error-correction level, colours and logo from the settings below apply to every code in the archive." },
      ],
    },
  ),
  variant(
    "with-logo",
    { type: "url" },
    {
      name: "С логотипом",
      title: "QR-код с логотипом — логотип в центре кода",
      h1: "QR-код с логотипом",
      description: "Добавьте логотип в центр QR-кода: генератор включит уровень коррекции H (до 30% повреждений) и ограничит логотип 20% стороны, чтобы код оставался читаемым.",
      lead: "Вставьте ссылку и нажмите «Логотип» под кодом — картинка встанет в центр, коррекция станет H.",
      keywords: ["qr код с логотипом", "логотип в qr коде", "брендированный qr код"],
      about: {
        title: "Почему код с логотипом сканируется",
        paragraphs: [
          "Логотип закрывает часть модулей, и сканер восстанавливает их за счёт избыточности. На уровне H код выдерживает потерю до 30% данных, поэтому логотип стороной не больше 20% ширины кода (около 4% площади) оставляет большой запас.",
          "Логотип ставится на подложку цвета фона, выровненную по сетке модулей. После печати обязательно проверьте код разными телефонами — особенно если меняли цвета.",
        ],
      },
      faq: [
        { q: "Какой логотип подойдёт?", a: "Простой знак без мелких деталей, лучше квадратный, в PNG с прозрачным фоном или SVG. Текстовый логотип в маленьком размере станет нечитаемым." },
        { q: "Можно ли сделать логотип больше?", a: "Мы ограничиваем его 20% стороны: больший логотип может сделать код нечитаемым для части сканеров." },
      ],
    },
    {
      name: "With logo",
      title: "QR Code with Logo — Add a Logo to the Center",
      h1: "QR code with logo",
      description: "Put your logo in the centre of a QR code: the generator switches to error correction H (up to 30% damage) and caps the logo at 20% of the side to stay scannable.",
      lead: "Paste a link and click “Logo” under the code — the image goes in the centre and correction switches to H.",
      keywords: ["qr code with logo", "logo qr code generator", "branded qr code"],
      about: {
        title: "Why a code with a logo still scans",
        paragraphs: [
          "The logo covers some modules and the scanner restores them from redundancy. At level H a code survives losing up to 30% of its data, so a logo no wider than 20% of the code (about 4% of the area) leaves plenty of margin.",
          "The logo sits on a background-coloured pad aligned to the module grid. After printing, test the code with several phones — especially if you changed the colours.",
        ],
      },
      faq: [
        { q: "What logo works best?", a: "A simple mark without fine detail, ideally square, as a transparent PNG or SVG. A text logo at that size becomes unreadable." },
        { q: "Can the logo be bigger?", a: "We cap it at 20% of the side: a larger logo can make the code unreadable for some scanners." },
      ],
    },
  ),
];
