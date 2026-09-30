/* QR content types: form fields and payload assembly. Pure and locale-aware. */

import type { Locale } from "@/i18n/config";
import {
  accountKeyOk,
  ANDROID_PACKAGE,
  APPLE_ID,
  appStorePayload,
  cleanPhone,
  epcErrors,
  epcPayload,
  eventPayload,
  geoPayload,
  geoValid,
  gostErrors,
  gostPayload,
  mailtoPayload,
  mecardPayload,
  smsPayload,
  telegramPayload,
  TELEGRAM_USERNAME,
  telPayload,
  vcardPayload,
  whatsappPayload,
  wifiPayload,
  type WifiSecurity,
} from "./payloads";

export type QrType = "text" | "url" | "wifi" | "vcard" | "email" | "sms" | "phone" | "whatsapp" | "telegram" | "geo" | "event" | "gost" | "epc" | "app" | "bulk";

export const QR_TYPES: QrType[] = ["url", "text", "wifi", "vcard", "email", "sms", "phone", "whatsapp", "telegram", "geo", "event", "gost", "epc", "app", "bulk"];

type L = Record<Locale, string>;

export interface FieldSpec {
  key: string;
  kind: "text" | "textarea" | "select" | "checkbox" | "datetime" | "date";
  label: L;
  placeholder?: string;
  hint?: L;
  options?: [string, L][];
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
  mono?: boolean;
  /** Secondary field, shown under "More fields". */
  more?: boolean;
  /** Half width on wide screens. */
  half?: boolean;
  autoComplete?: string;
  /** Hide unless another field has a value. */
  when?: (f: Fields) => boolean;
}

export type Fields = Record<string, string>;

export const TYPE_NAME: Record<QrType, L> = {
  url: { ru: "Ссылка", en: "Link" },
  text: { ru: "Текст", en: "Text" },
  wifi: { ru: "Wi-Fi", en: "Wi-Fi" },
  vcard: { ru: "Визитка", en: "Contact card" },
  email: { ru: "Email", en: "Email" },
  sms: { ru: "SMS", en: "SMS" },
  phone: { ru: "Телефон", en: "Phone" },
  whatsapp: { ru: "WhatsApp", en: "WhatsApp" },
  telegram: { ru: "Telegram", en: "Telegram" },
  geo: { ru: "Геолокация", en: "Location" },
  event: { ru: "Событие", en: "Event" },
  gost: { ru: "Оплата по реквизитам (РФ)", en: "Russian bank payment" },
  epc: { ru: "Платёж SEPA (EPC)", en: "SEPA payment (EPC)" },
  app: { ru: "Приложение", en: "App" },
  bulk: { ru: "Пакетно из CSV", en: "Batch from CSV" },
};

const phoneHint: L = { ru: "В международном формате, например +7 701 234 56 78", en: "International format, e.g. +44 20 7946 0958" };

export const FIELDS: Record<Exclude<QrType, "bulk">, FieldSpec[]> = {
  url: [{ key: "url", kind: "text", label: { ru: "Ссылка", en: "URL" }, placeholder: "https://example.com", inputMode: "url", mono: true }],
  text: [{ key: "text", kind: "textarea", label: { ru: "Текст или ссылка", en: "Text or link" }, placeholder: "https://example.com" }],
  wifi: [
    { key: "ssid", kind: "text", label: { ru: "Имя сети (SSID)", en: "Network name (SSID)" }, half: true, autoComplete: "off" },
    { key: "password", kind: "text", label: { ru: "Пароль", en: "Password" }, half: true, mono: true, autoComplete: "off", when: (f) => f.security !== "nopass" },
    {
      key: "security",
      kind: "select",
      label: { ru: "Шифрование", en: "Security" },
      options: [
        ["WPA", { ru: "WPA / WPA2 / WPA3", en: "WPA / WPA2 / WPA3" }],
        ["WEP", { ru: "WEP (устаревшее)", en: "WEP (legacy)" }],
        ["nopass", { ru: "Без пароля", en: "No password" }],
      ],
      half: true,
      more: true,
    },
    { key: "hidden", kind: "checkbox", label: { ru: "Скрытая сеть", en: "Hidden network" }, half: true, more: true },
  ],
  vcard: [
    { key: "firstName", kind: "text", label: { ru: "Имя", en: "First name" }, half: true, autoComplete: "given-name" },
    { key: "lastName", kind: "text", label: { ru: "Фамилия", en: "Last name" }, half: true, autoComplete: "family-name" },
    { key: "phone", kind: "text", label: { ru: "Мобильный телефон", en: "Mobile phone" }, inputMode: "tel", half: true, autoComplete: "tel" },
    { key: "email", kind: "text", label: { ru: "Email", en: "Email" }, inputMode: "email", half: true, autoComplete: "email" },
    { key: "org", kind: "text", label: { ru: "Компания", en: "Company" }, half: true, more: true, autoComplete: "organization" },
    { key: "title", kind: "text", label: { ru: "Должность", en: "Job title" }, half: true, more: true, autoComplete: "organization-title" },
    { key: "workPhone", kind: "text", label: { ru: "Рабочий телефон", en: "Work phone" }, inputMode: "tel", half: true, more: true },
    { key: "url", kind: "text", label: { ru: "Сайт", en: "Website" }, inputMode: "url", half: true, more: true },
    { key: "street", kind: "text", label: { ru: "Улица, дом, офис", en: "Street address" }, more: true, autoComplete: "street-address" },
    { key: "city", kind: "text", label: { ru: "Город", en: "City" }, half: true, more: true, autoComplete: "address-level2" },
    { key: "zip", kind: "text", label: { ru: "Индекс", en: "Postcode" }, half: true, more: true, autoComplete: "postal-code" },
    { key: "country", kind: "text", label: { ru: "Страна", en: "Country" }, half: true, more: true, autoComplete: "country-name" },
    {
      key: "format",
      kind: "select",
      label: { ru: "Формат", en: "Format" },
      options: [
        ["vcard", { ru: "vCard 3.0 — все поля", en: "vCard 3.0 — all fields" }],
        ["mecard", { ru: "MECARD — короче, код меньше", en: "MECARD — shorter, smaller code" }],
      ],
      half: true,
      more: true,
    },
    { key: "note", kind: "textarea", label: { ru: "Заметка", en: "Note" }, more: true },
  ],
  email: [
    { key: "to", kind: "text", label: { ru: "Адрес получателя", en: "Recipient" }, inputMode: "email", placeholder: "name@example.com" },
    { key: "subject", kind: "text", label: { ru: "Тема", en: "Subject" } },
    { key: "body", kind: "textarea", label: { ru: "Текст письма", en: "Message" }, more: true },
  ],
  sms: [
    { key: "phone", kind: "text", label: { ru: "Номер телефона", en: "Phone number" }, inputMode: "tel", hint: phoneHint },
    { key: "message", kind: "textarea", label: { ru: "Текст сообщения", en: "Message" } },
  ],
  phone: [{ key: "phone", kind: "text", label: { ru: "Номер телефона", en: "Phone number" }, inputMode: "tel", hint: phoneHint }],
  whatsapp: [
    { key: "phone", kind: "text", label: { ru: "Номер WhatsApp", en: "WhatsApp number" }, inputMode: "tel", hint: phoneHint },
    { key: "message", kind: "textarea", label: { ru: "Готовый текст сообщения", en: "Pre-filled message" } },
  ],
  telegram: [{ key: "username", kind: "text", label: { ru: "Имя пользователя, канала или бота", en: "Username, channel or bot" }, placeholder: "@username", mono: true, hint: { ru: "Можно вставить ссылку t.me целиком", en: "You can paste a full t.me link" } }],
  geo: [
    { key: "coords", kind: "text", label: { ru: "Координаты", en: "Coordinates" }, placeholder: "43.238949, 76.889709", mono: true, hint: { ru: "Широта и долгота через запятую; подойдут и градусы с минутами из Google Карт", en: "Latitude and longitude separated by a comma; degrees-minutes from Google Maps work too" } },
    {
      key: "format",
      kind: "select",
      label: { ru: "Что откроется", en: "Opens in" },
      options: [
        ["google", { ru: "Google Карты", en: "Google Maps" }],
        ["yandex", { ru: "Яндекс Карты", en: "Yandex Maps" }],
        ["geo", { ru: "Приложение карт по умолчанию (geo:)", en: "Default maps app (geo:)" }],
      ],
      more: true,
    },
  ],
  event: [
    { key: "title", kind: "text", label: { ru: "Название", en: "Title" } },
    { key: "start", kind: "datetime", label: { ru: "Начало", en: "Starts" }, half: true },
    { key: "end", kind: "datetime", label: { ru: "Окончание", en: "Ends" }, half: true },
    { key: "location", kind: "text", label: { ru: "Место", en: "Location" }, more: true },
    { key: "description", kind: "textarea", label: { ru: "Описание", en: "Description" }, more: true },
  ],
  gost: [
    { key: "Name", kind: "text", label: { ru: "Получатель", en: "Payee name" }, placeholder: "ООО «Ромашка»" },
    { key: "PersonalAcc", kind: "text", label: { ru: "Расчётный счёт (20 цифр)", en: "Account (20 digits)" }, inputMode: "numeric", mono: true, half: true },
    { key: "BIC", kind: "text", label: { ru: "БИК банка", en: "Bank BIK" }, inputMode: "numeric", mono: true, half: true },
    { key: "BankName", kind: "text", label: { ru: "Банк получателя", en: "Payee bank" }, half: true },
    { key: "CorrespAcc", kind: "text", label: { ru: "Корр. счёт банка", en: "Bank correspondent account" }, inputMode: "numeric", mono: true, half: true },
    { key: "sum", kind: "text", label: { ru: "Сумма, ₽", en: "Amount, RUB" }, inputMode: "decimal", half: true },
    { key: "PayeeINN", kind: "text", label: { ru: "ИНН получателя", en: "Payee INN" }, inputMode: "numeric", mono: true, half: true, more: true },
    { key: "KPP", kind: "text", label: { ru: "КПП получателя", en: "Payee KPP" }, inputMode: "numeric", mono: true, half: true, more: true },
    { key: "Purpose", kind: "textarea", label: { ru: "Назначение платежа", en: "Payment purpose" }, more: true },
  ],
  epc: [
    { key: "name", kind: "text", label: { ru: "Получатель", en: "Beneficiary name" } },
    { key: "iban", kind: "text", label: { ru: "IBAN получателя", en: "Beneficiary IBAN" }, mono: true, half: true },
    { key: "amount", kind: "text", label: { ru: "Сумма, €", en: "Amount, €" }, inputMode: "decimal", half: true },
    { key: "text", kind: "text", label: { ru: "Назначение платежа", en: "Remittance information" } },
    { key: "bic", kind: "text", label: { ru: "BIC (необязательно в SEPA)", en: "BIC (optional within SEPA)" }, mono: true, half: true, more: true },
    { key: "reference", kind: "text", label: { ru: "Структурированная ссылка (RF…)", en: "Structured reference (RF…)" }, mono: true, half: true, more: true },
  ],
  app: [
    {
      key: "store",
      kind: "select",
      label: { ru: "Магазин", en: "Store" },
      options: [
        ["apple", { ru: "App Store (iPhone, iPad)", en: "App Store (iPhone, iPad)" }],
        ["google", { ru: "Google Play (Android)", en: "Google Play (Android)" }],
      ],
      half: true,
    },
    { key: "id", kind: "text", label: { ru: "ID приложения или ссылка", en: "App ID or store link" }, mono: true, half: true, placeholder: "id284882215 / com.example.app" },
  ],
};

export const DEFAULTS: Partial<Record<QrType, Fields>> = {
  wifi: { security: "WPA" },
  vcard: { format: "vcard" },
  geo: { format: "google" },
  app: { store: "apple" },
};

export interface Issue {
  level: "error" | "warn";
  text: string;
}

const M = {
  ru: {
    urlSpaces: "В ссылке есть пробелы — замените их на %20 или уберите",
    schemeAdded: "Добавлен протокол https:// — без него телефон распознает код как обычный текст",
    ssid: "Укажите имя сети",
    wifiPass: "Укажите пароль сети или выберите «Без пароля»",
    wpaLength: "Пароль WPA должен быть от 8 до 63 символов — проверьте, что он введён полностью",
    contact: "Заполните хотя бы имя, компанию или телефон",
    email: "Похоже, адрес email введён с ошибкой",
    phone: "Введите номер телефона",
    phoneTrunk: "Номер начинается с 8 — для WhatsApp нужен международный формат: +7…",
    waDigits: "Нужен номер в международном формате с кодом страны: 8–15 цифр",
    telegram: "Имя в Telegram — 5–32 латинские буквы, цифры и подчёркивания, начинается с буквы",
    coords: "Не удалось распознать координаты. Пример: 43.238949, 76.889709",
    event: "Укажите название и время начала",
    eventOrder: "Окончание раньше начала",
    appId: "Нужен ID из ссылки App Store (цифры после id) или имя пакета из Google Play (com.example.app)",
    gost: {
      Name: "Укажите получателя (до 160 символов)",
      PersonalAcc: "Расчётный счёт — 20 цифр",
      BankName: "Укажите банк получателя (до 45 символов)",
      BIC: "БИК — 9 цифр",
      CorrespAcc: "Корр. счёт — 20 цифр (или 0, если его нет)",
      PayeeINN: "ИНН — 10 цифр для организации или 12 для ИП",
      KPP: "КПП — 9 цифр",
      Sum: "Сумма в рублях, например 1500 или 1500,50",
      Purpose: "Назначение платежа — не длиннее 210 символов",
      pipe: "Символ | нельзя использовать — он разделяет поля платёжного кода",
    } as Record<string, string>,
    accKey: "Контрольный ключ расчётного счёта не сходится с БИК — проверьте счёт и БИК",
    corrKey: "Корр. счёт не соответствует БИК — проверьте реквизиты банка",
    epc: {
      name: "Укажите получателя (до 70 символов)",
      iban: "Проверьте IBAN получателя",
      bic: "BIC — 8 или 11 символов",
      amount: "Сумма от 0,01 до 999 999 999,99 €, не больше двух знаков после точки",
      purpose: "Код цели — 4 символа",
      reference: "Ссылка — не длиннее 35 символов",
      text: "Назначение — не длиннее 140 символов",
      both: "Заполните либо назначение платежа, либо структурированную ссылку — не оба поля",
      info: "Комментарий — не длиннее 70 символов",
      size: "Данных больше 331 байта — сократите назначение платежа",
    } as Record<string, string>,
  },
  en: {
    urlSpaces: "The link contains spaces — replace them with %20 or remove them",
    schemeAdded: "Added https:// — without it phones treat the code as plain text",
    ssid: "Enter the network name",
    wifiPass: "Enter the network password or choose “No password”",
    wpaLength: "A WPA password is 8 to 63 characters — check that it's complete",
    contact: "Fill in at least a name, company or phone",
    email: "The email address looks mistyped",
    phone: "Enter a phone number",
    phoneTrunk: "The number starts with 8 — WhatsApp needs the international format: +7…",
    waDigits: "Use the international format with a country code: 8–15 digits",
    telegram: "Telegram usernames are 5–32 Latin letters, digits and underscores, starting with a letter",
    coords: "Couldn't read the coordinates. Example: 43.238949, 76.889709",
    event: "Enter a title and a start time",
    eventOrder: "The end is before the start",
    appId: "Use the App Store ID (digits after id) or the Google Play package name (com.example.app)",
    gost: {
      Name: "Enter the payee (up to 160 characters)",
      PersonalAcc: "The account number is 20 digits",
      BankName: "Enter the payee's bank (up to 45 characters)",
      BIC: "The BIK is 9 digits",
      CorrespAcc: "The correspondent account is 20 digits (or 0 if there is none)",
      PayeeINN: "The INN is 10 digits for a company or 12 for a sole trader",
      KPP: "The KPP is 9 digits",
      Sum: "Amount in roubles, e.g. 1500 or 1500.50",
      Purpose: "The payment purpose is at most 210 characters",
      pipe: "The | character is not allowed — it separates the payment fields",
    } as Record<string, string>,
    accKey: "The account's control key doesn't match the BIK — check both",
    corrKey: "The correspondent account doesn't match the BIK — check the bank details",
    epc: {
      name: "Enter the beneficiary (up to 70 characters)",
      iban: "Check the beneficiary IBAN",
      bic: "The BIC is 8 or 11 characters",
      amount: "Amount from 0.01 to 999,999,999.99 €, at most two decimals",
      purpose: "The purpose code is 4 characters",
      reference: "The reference is at most 35 characters",
      text: "Remittance information is at most 140 characters",
      both: "Fill in either the remittance text or the structured reference, not both",
      info: "The note is at most 70 characters",
      size: "The data exceeds 331 bytes — shorten the remittance text",
    } as Record<string, string>,
  },
};

/** Parse "lat, lon", "lat lon", a Google Maps "@lat,lon" URL or degrees-minutes-seconds with N/S/E/W. */
export function parseCoords(s: string): [number, number] | null {
  const t = s.trim();
  const at = t.match(/@(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (at) return check(Number(at[1]), Number(at[2]));
  const dms = [...t.matchAll(/(\d{1,3})\s*°\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*['′])?\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*(?:"|″|''))?\s*([NSEWСЮВЗ])/gi)];
  if (dms.length === 2) {
    const v = dms.map((m) => {
      const n = Number(m[1]) + Number((m[2] ?? "0").replace(",", ".")) / 60 + Number((m[3] ?? "0").replace(",", ".")) / 3600;
      return /[SWЮЗ]/i.test(m[4]) ? -n : n;
    });
    return check(v[0], v[1]);
  }
  const pair = t.match(/^(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)$/);
  if (pair) return check(Number(pair[1].replace(",", ".")), Number(pair[2].replace(",", ".")));
  return null;
  function check(a: number, b: number): [number, number] | null {
    return geoValid(a, b) ? [a, b] : null;
  }
}

function appId(store: string, raw: string): string | null {
  const s = raw.trim();
  if (store === "apple") {
    const m = s.match(/id(\d{6,12})/) ?? s.match(/^(\d{6,12})$/);
    return m && APPLE_ID.test(m[1]) ? m[1] : null;
  }
  const m = s.match(/[?&]id=([\w.]+)/);
  const id = m ? m[1] : s;
  return ANDROID_PACKAGE.test(id) ? id : null;
}

export function buildPayload(type: QrType, f: Fields, locale: Locale): { payload: string | null; issues: Issue[] } {
  const m = M[locale];
  const issues: Issue[] = [];
  const err = (text: string) => issues.push({ level: "error", text });
  const warn = (text: string) => issues.push({ level: "warn", text });
  const v = (k: string) => (f[k] ?? "").trim();
  const any = (...ks: string[]) => ks.some((k) => v(k));
  let payload: string | null = null;

  switch (type) {
    case "bulk":
      break;
    case "text":
      payload = f.text ? f.text : null;
      break;
    case "url": {
      let u = v("url");
      if (!u) break;
      if (/\s/.test(u)) err(m.urlSpaces);
      if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) {
        u = `https://${u.replace(/^\/+/, "")}`;
        warn(m.schemeAdded);
      }
      payload = u;
      break;
    }
    case "wifi": {
      if (!any("ssid", "password")) break;
      const security = (f.security || "WPA") as WifiSecurity;
      if (!v("ssid")) err(m.ssid);
      if (security !== "nopass" && !f.password) err(m.wifiPass);
      if (security === "WPA" && f.password && (f.password.length < 8 || f.password.length > 63)) warn(m.wpaLength);
      payload = wifiPayload({ ssid: f.ssid ?? "", password: f.password, security, hidden: f.hidden === "true" });
      break;
    }
    case "vcard": {
      if (!any("firstName", "lastName", "org", "phone", "email", "workPhone", "url", "note", "title", "street", "city")) break;
      if (!any("firstName", "lastName", "org", "phone")) err(m.contact);
      if (v("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) warn(m.email);
      payload =
        f.format === "mecard"
          ? mecardPayload({ firstName: f.firstName, lastName: f.lastName, phone: f.phone, email: f.email, url: f.url, address: [f.street, f.city, f.zip, f.country].filter((x) => x?.trim()).join(", "), note: f.note })
          : vcardPayload({ firstName: f.firstName, lastName: f.lastName, org: f.org, title: f.title, phone: f.phone, workPhone: f.workPhone, email: f.email, url: f.url, street: f.street, city: f.city, zip: f.zip, country: f.country, note: f.note });
      break;
    }
    case "email":
      if (!any("to", "subject", "body")) break;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("to"))) warn(m.email);
      payload = mailtoPayload({ to: v("to"), subject: f.subject, body: f.body });
      break;
    case "sms":
    case "phone": {
      if (!any("phone", "message")) break;
      if (cleanPhone(v("phone")).replace("+", "").length < 3) err(m.phone);
      payload = type === "sms" ? smsPayload({ phone: v("phone"), message: f.message }) : telPayload(v("phone"));
      break;
    }
    case "whatsapp": {
      if (!any("phone", "message")) break;
      const d = v("phone").replace(/\D/g, "");
      if (/^8\d{10}$/.test(d) && !v("phone").startsWith("+")) warn(m.phoneTrunk);
      if (d.length < 8 || d.length > 15) err(m.waDigits);
      payload = whatsappPayload({ phone: v("phone"), message: f.message });
      break;
    }
    case "telegram": {
      const raw = v("username");
      if (!raw) break;
      const link = raw.match(/^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(.+)$/i);
      if (link) {
        payload = `https://t.me/${link[1]}`;
        break;
      }
      const name = raw.replace(/^@/, "");
      if (!TELEGRAM_USERNAME.test(name)) err(m.telegram);
      payload = telegramPayload(name);
      break;
    }
    case "geo": {
      if (!v("coords")) break;
      const c = parseCoords(v("coords"));
      if (!c) {
        err(m.coords);
        break;
      }
      const [lat, lon] = c.map((n) => Math.round(n * 1e6) / 1e6);
      payload = f.format === "geo" ? geoPayload(lat, lon) : f.format === "yandex" ? `https://yandex.ru/maps/?pt=${lon},${lat}&z=16&l=map` : `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      break;
    }
    case "event": {
      if (!any("title", "start", "location", "description")) break;
      if (!v("title") || !v("start")) {
        err(m.event);
        break;
      }
      if (v("end") && v("end") < v("start")) err(m.eventOrder);
      payload = eventPayload({ title: v("title"), start: v("start"), end: v("end") || undefined, location: v("location") || undefined, description: v("description") || undefined });
      break;
    }
    case "gost": {
      if (!any("Name", "PersonalAcc", "BIC", "BankName", "CorrespAcc", "sum", "PayeeINN", "Purpose")) break;
      const p = { Name: v("Name"), PersonalAcc: v("PersonalAcc").replace(/\s/g, ""), BankName: v("BankName"), BIC: v("BIC").replace(/\s/g, ""), CorrespAcc: v("CorrespAcc").replace(/\s/g, "") || "0", PayeeINN: v("PayeeINN") || undefined, KPP: v("KPP") || undefined, sum: v("sum") || undefined, Purpose: v("Purpose") || undefined };
      for (const e of gostErrors(p)) err(m.gost[e]);
      if (/^\d{9}$/.test(p.BIC) && /^\d{20}$/.test(p.PersonalAcc) && !accountKeyOk(p.BIC, p.PersonalAcc)) warn(m.accKey);
      if (/^\d{9}$/.test(p.BIC) && /^\d{20}$/.test(p.CorrespAcc) && !accountKeyOk(p.BIC, p.CorrespAcc, true)) warn(m.corrKey);
      payload = gostPayload(p);
      break;
    }
    case "epc": {
      if (!any("name", "iban", "amount", "text")) break;
      const p = { name: v("name"), iban: v("iban"), bic: v("bic") || undefined, amount: v("amount") || undefined, text: v("text") || undefined, reference: v("reference") || undefined };
      for (const e of epcErrors(p)) err(m.epc[e]);
      payload = epcPayload(p);
      break;
    }
    case "app": {
      if (!v("id")) break;
      const store = f.store === "google" ? "google" : "apple";
      const id = appId(store, v("id"));
      if (!id) {
        err(m.appId);
        break;
      }
      payload = appStorePayload({ store, id });
      break;
    }
  }
  return { payload, issues };
}
