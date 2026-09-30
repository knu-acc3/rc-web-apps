import { defineToolSection } from "@/registry/tool-section";
import type { Locale } from "@/i18n/config";
import type { Block } from "@/registry/types";
import { IBAN_COUNTRIES } from "./data/iban-countries";
import { cardVariants, countryName, ibanLayout, ibanVariants, PHONE_COUNTRIES, phoneVariants } from "./variants";

const phoneCountries = (l: Locale): [string, string][] => PHONE_COUNTRIES.map((c) => [c, countryName(c, l)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1], l));

function ibanTable(l: Locale): Block {
  const ru = l === "ru";
  return {
    type: "table",
    title: ru ? `Длина IBAN по странам (${IBAN_COUNTRIES.length})` : `IBAN length by country (${IBAN_COUNTRIES.length})`,
    head: ru ? ["Страна", "Код", "Длина", "Формат"] : ["Country", "Code", "Length", "Layout"],
    rows: IBAN_COUNTRIES.map((c) => [ru ? c.ru : c.en, c.code, String(c.length), ibanLayout(c)]),
  };
}

export const validateSection = defineToolSection({
  id: "validate",
  name: { ru: "Проверка данных", en: "Validators" },
  description: {
    ru: "Проверка IBAN, номеров карт и телефонов, email, ИИН и БИН Казахстана, ИНН, СНИЛС, ОГРН, ISBN и VIN — по контрольным суммам, прямо в браузере.",
    en: "Validate IBANs, card and phone numbers, email, Kazakh IIN/BIN, Russian INN, SNILS and OGRN, ISBN and VIN by their checksums, right in your browser.",
  },
  icon: "BadgeCheck",
  hue: 140,
  category: "web",
  order: 3,
  tools: [
    {
      slug: "iban-validator",
      component: "validate/iban",
      icon: "Landmark",
      popular: true,
      name: { ru: "Проверка IBAN", en: "IBAN validator" },
      title: { ru: "Проверка IBAN онлайн — формат и контрольная сумма", en: "IBAN Validator — Check Format and Checksum Online" },
      h1: { ru: "Проверка IBAN", en: "IBAN validator" },
      description: {
        ru: `Проверка IBAN для ${IBAN_COUNTRIES.length} стран, включая Казахстан (KZ, 20 символов): длина, структура и контрольная сумма mod-97, код банка. Без отправки данных.`,
        en: `Validate IBANs for ${IBAN_COUNTRIES.length} countries including Kazakhstan (KZ, 20 characters): length, structure, mod-97 checksum and bank code. Nothing is sent.`,
      },
      lead: { ru: "Вставьте IBAN — проверка длины, формата страны и контрольной суммы займёт мгновение.", en: "Paste an IBAN to check the length, country format and checksum instantly." },
      keywords: { ru: ["проверка iban", "iban казахстан", "валидатор iban", "iban kz"], en: ["iban validator", "iban checker", "check iban"] },
      howTo: {
        ru: [
          "Вставьте IBAN целиком — пробелы, дефисы и строчные буквы не мешают.",
          "Смотрите вердикт: корректен ли номер, а если нет — что именно не так (длина, символы, контрольная сумма).",
          "Ниже — код банка, код отделения и номер счёта в разбивке по формату страны.",
          "Если ошиблись в одной цифре, инструмент подскажет, какими должны быть контрольные цифры.",
        ],
        en: [
          "Paste the whole IBAN — spaces, hyphens and lower case are fine.",
          "Read the verdict: whether it's valid and, if not, exactly what's wrong (length, characters, checksum).",
          "Below you'll see the bank code, branch code and account number split by the country format.",
          "For a single mistyped digit the tool shows what the check digits should be.",
        ],
      },
      faq: {
        ru: [
          { q: "Что проверяет валидатор IBAN?", a: "Что код страны использует IBAN, длина совпадает с форматом этой страны, буквы и цифры стоят на своих местах, а контрольная сумма по модулю 97 (ISO 13616) равна 1. Одна опечатка или перестановка соседних символов почти всегда ломает контрольную сумму." },
          { q: "Какой длины IBAN в Казахстане?", a: "20 символов: KZ, две контрольные цифры, трёхзначный код банка и 13 символов номера счёта. Пример: KZ86 125K ZT50 0410 0100." },
          { q: "Есть ли IBAN в России?", a: "Формально да: с 2023 года Россия есть в реестре IBAN, номер из 33 символов включает БИК и 20-значный счёт — такой номер здесь тоже проверяется. Но на практике российские банки IBAN клиентам почти не выдают: для перевода в Россию указывают БИК, корреспондентский счёт и номер счёта, а из-за рубежа — ещё SWIFT-код банка." },
          { q: "Можно ли узнать, что счёт существует?", a: "Нет. Корректный IBAN означает только, что номер записан без ошибок. Существует ли счёт и чей он, знает только банк." },
          { q: "Номер куда-нибудь отправляется?", a: "Нет, проверка идёт в браузере, сетевых запросов инструмент не делает." },
        ],
        en: [
          { q: "What does the IBAN validator check?", a: "That the country uses IBAN, the length matches that country's format, letters and digits are in the right places and the mod-97 checksum (ISO 13616) equals 1. A single typo or swapped pair almost always breaks the checksum." },
          { q: "How long is a Kazakhstan IBAN?", a: "20 characters: KZ, two check digits, a 3-digit bank code and a 13-character account number, e.g. KZ86 125K ZT50 0410 0100." },
          { q: "Does Russia use IBAN?", a: "Formally yes: Russia joined the IBAN registry in 2023 with a 33-character format holding the BIK and the 20-digit account, and such numbers are validated here too. In practice Russian banks rarely issue IBANs: payments to Russia use the BIK, the correspondent account and the account number, plus the bank's SWIFT code from abroad." },
          { q: "Can it tell whether the account exists?", a: "No. A valid IBAN only means the number is well-formed. Only the bank knows whether the account exists and whose it is." },
          { q: "Is the number sent anywhere?", a: "No, the check runs in your browser and makes no network requests." },
        ],
      },
      about: {
        ru: [
          "IBAN (International Bank Account Number) — международный номер банковского счёта: код страны, две контрольные цифры и национальный номер счёта (BBAN) по формату, который утвердила страна. Длина — от 15 символов в Норвегии до 33 в России.",
          "Инструмент знает форматы всех стран из реестра SWIFT, поэтому находит не только неверную контрольную сумму, но и лишний символ, букву на месте цифры или код страны, где IBAN не используют. Для каждой страны есть страница со структурой номера и примером.",
        ],
        en: [
          "An IBAN (International Bank Account Number) is a country code, two check digits and the national account number (BBAN) in that country's format — from 15 characters in Norway to 33 in Russia.",
          "The tool knows every country format in the SWIFT registry, so it catches not just a bad checksum but an extra character, a letter where a digit belongs or a country that doesn't use IBAN. Each country has a page with the number structure and an example.",
        ],
      },
      blocks: (l) => [ibanTable(l)],
      variants: { title: { ru: "IBAN по странам", en: "IBAN by country" }, list: ibanVariants, limit: 100 },
    },
    {
      slug: "credit-card-validator",
      component: "validate/card",
      icon: "CreditCard",
      popular: true,
      name: { ru: "Проверка номера карты", en: "Card number validator" },
      title: { ru: "Проверка номера банковской карты — алгоритм Луна", en: "Credit Card Number Validator — Luhn Check Online" },
      h1: { ru: "Проверка номера банковской карты", en: "Credit card number validator" },
      description: {
        ru: "Проверка номера карты по алгоритму Луна и определение платёжной системы: Visa, Mastercard, Мир (2200–2204), UnionPay, Amex, JCB. Номер не отправляется на сервер.",
        en: "Check a card number with the Luhn algorithm and detect the network: Visa, Mastercard (incl. 2221–2720), Mir, UnionPay, Amex, JCB. Nothing leaves your browser.",
      },
      lead: { ru: "Введите номер карты — сразу видно, прошёл ли он проверку Луна и к какой платёжной системе относится.", en: "Type a card number to see whether it passes the Luhn check and which network it belongs to." },
      keywords: { ru: ["проверка номера карты", "алгоритм луна", "проверить карту мир"], en: ["credit card validator", "luhn check", "card number checker"] },
      howTo: {
        ru: ["Введите номер карты с пробелами или без.", "Посмотрите вердикт: проходит ли номер проверку Луна и подходит ли длина для платёжной системы.", "Ниже — платёжная система, допустимые длины и длина кода безопасности."],
        en: ["Type the card number with or without spaces.", "Read the verdict: whether it passes the Luhn check and the length fits the network.", "Below you'll see the network, allowed lengths and security code length."],
      },
      faq: {
        ru: [
          { q: "Что такое алгоритм Луна?", a: "Простая контрольная сумма: каждая вторая цифра справа удваивается (если получилось больше 9, вычитается 9), всё складывается, и сумма должна делиться на 10. Так ловятся опечатки в одной цифре и большинство перестановок соседних." },
          { q: "Как отличить карту «Мир» от Mastercard?", a: "«Мир» начинается с 2200–2204, а Mastercard использует 51–55 и 2221–2720. Диапазоны не пересекаются, поэтому по первым четырём цифрам система определяется однозначно." },
          { q: "Можно ли по номеру узнать банк?", a: "Мы этого не делаем: таблицы BIN платёжные системы не публикуют, а бесплатные базы устаревают и ошибаются. Инструмент честно показывает только платёжную систему." },
          { q: "Безопасно ли вводить номер карты?", a: "Проверка идёт в браузере, номер никуда не отправляется и не сохраняется. Но никогда не вводите CVC/CVV и срок действия на сторонних сайтах — для проверки номера они не нужны." },
        ],
        en: [
          { q: "What is the Luhn algorithm?", a: "A simple checksum: every second digit from the right is doubled (subtracting 9 if over 9), everything is summed and the total must be divisible by 10. It catches single-digit typos and most adjacent swaps." },
          { q: "How do I tell Mir from Mastercard?", a: "Mir starts with 2200–2204, while Mastercard uses 51–55 and 2221–2720. The ranges don't overlap, so the first four digits identify the network unambiguously." },
          { q: "Can it find the bank?", a: "We don't do that: networks don't publish BIN tables and free databases are stale and error-prone. The tool honestly shows only the network." },
          { q: "Is it safe to type a card number?", a: "The check runs in your browser and nothing is sent or stored. Still, never enter a CVC/CVV or expiry date on third-party sites — they aren't needed to check a number." },
        ],
      },
      about: {
        ru: ["Номер карты содержит от 12 до 19 цифр: первые 6–8 — BIN банка-эмитента (первая цифра указывает на отрасль и платёжную систему), дальше — номер счёта и последняя контрольная цифра по алгоритму Луна.", "Проверка полезна разработчикам платёжных форм, чтобы ловить опечатки до отправки, и всем, кто хочет убедиться, что номер переписан без ошибок."],
        en: ["A card number has 12 to 19 digits: the first 6–8 are the issuer's BIN (the first digit indicates the industry and network), then the account number and a final Luhn check digit.", "It's useful for developers of payment forms to catch typos before submission, and for anyone making sure a number was copied correctly."],
      },
      variants: { title: { ru: "Платёжные системы", en: "Card networks" }, list: cardVariants },
    },
    {
      slug: "phone-number-validator",
      seoAlt: { ru: ["проверка формата номера", "проверка номера"], en: ["check a phone number format", "phone number check", "format check"] },
      component: "validate/phone",
      icon: "Phone",
      popular: true,
      name: { ru: "Проверка номера телефона", en: "Phone number validator" },
      title: { ru: "Проверка номера телефона онлайн — формат и страна", en: "Phone Number Validator — Format, Country, Type" },
      h1: { ru: "Проверка номера телефона", en: "Phone number validator" },
      description: {
        ru: "Проверка и форматирование номеров телефонов любой страны: E.164, международный и национальный формат, мобильный или городской. Отличает +7 Казахстана от России.",
        en: "Validate and format phone numbers for any country: E.164, international and national formats, number type (mobile or landline). Tells Kazakh +7 from Russian +7.",
      },
      lead: { ru: "Введите номер — узнаете страну, тип и получите его в формате E.164 для баз данных.", en: "Type a number to get its country, type and E.164 form for databases." },
      props: { countries: { ru: phoneCountries("ru"), en: phoneCountries("en") } },
      keywords: { ru: ["проверка номера телефона", "формат номера телефона", "e164"], en: ["phone number validator", "phone format", "e164 format"] },
      howTo: {
        ru: ["Выберите страну по умолчанию — она нужна для номеров без кода, например 8 701 …", "Введите номер в любом виде: со скобками, дефисами, пробелами.", "Проверьте вердикт и тип номера.", "Скопируйте нужный формат: E.164 для баз и API, международный — для визиток и сайтов."],
        en: ["Choose the default country — it's used for numbers without a code.", "Type the number in any form: with brackets, hyphens or spaces.", "Check the verdict and number type.", "Copy the format you need: E.164 for databases and APIs, international for business cards and websites."],
      },
      faq: {
        ru: [
          { q: "Что такое формат E.164?", a: "Международный стандарт записи номера: плюс, код страны и номер без пробелов и скобок, до 15 цифр — например +77012345678. В нём номера хранят CRM, SMS-шлюзы и мессенджеры." },
          { q: "Как отличить номер Казахстана от России, если у обоих +7?", a: "По цифре после +7: 6 и 7 — Казахстан, 3, 4, 8 и 9 — Россия. Валидатор определяет страну автоматически." },
          { q: "Проверяется ли, что номер существует?", a: "Нет: проверяется соответствие правилам нумерации страны (длина, коды операторов и регионов). Подключён ли номер и чей он, так узнать нельзя." },
        ],
        en: [
          { q: "What is E.164?", a: "The international number format: a plus, the country code and the number without spaces or brackets, up to 15 digits — e.g. +14155550123. CRMs, SMS gateways and messengers store numbers this way." },
          { q: "How do you tell Kazakh +7 numbers from Russian ones?", a: "By the digit after +7: 6 and 7 mean Kazakhstan; 3, 4, 8 and 9 mean Russia. The validator detects the country automatically." },
          { q: "Does it check that the number exists?", a: "No: it checks the country's numbering rules (length, operator and area codes). Whether the number is in service and whose it is can't be known this way." },
        ],
      },
      about: {
        ru: ["Валидатор использует библиотеку libphonenumber-js — порт правил нумерации Google libphonenumber, на которых работают Android и Gmail. Правила загружаются в браузер и применяются локально.", "Для 44 стран есть отдельные страницы с примерами номеров, кодом страны и особенностями набора — от Казахстана и России до США и Китая."],
        en: ["The validator uses libphonenumber-js, a port of Google's libphonenumber numbering rules behind Android and Gmail. The rules are loaded into your browser and applied locally.", "44 countries have their own pages with number examples, the calling code and dialling notes — from Kazakhstan and Russia to the US and China."],
      },
      variants: { title: { ru: "Номера по странам", en: "Numbers by country" }, list: phoneVariants },
    },
    {
      slug: "email-validator",
      component: "validate/email",
      icon: "Mail",
      name: { ru: "Проверка email", en: "Email validator" },
      title: { ru: "Проверка email-адреса онлайн — синтаксис и опечатки", en: "Email Address Validator — Syntax and Typo Check" },
      h1: { ru: "Проверка email-адреса", en: "Email address validator" },
      description: {
        ru: "Проверка написания email по RFC 5322: точки, длина, недопустимые символы, кириллические домены (punycode) и частые опечатки вроде gmial.com. Без DNS-запросов.",
        en: "Check email syntax per RFC 5322: dots, length, illegal characters, internationalised domains (punycode) and common typos like gmial.com. No DNS lookups.",
      },
      lead: { ru: "Введите адрес — увидите, записан ли он правильно, и что именно не так, если нет.", en: "Type an address to see whether it's written correctly — and exactly what's wrong if not." },
      keywords: { ru: ["проверка email", "валидация email", "проверить почту"], en: ["email validator", "email syntax check"] },
      howTo: {
        ru: ["Введите или вставьте адрес электронной почты.", "Прочитайте вердикт и список замечаний.", "Если в домене опечатка, нажмите «Исправить» — подставится популярный домен."],
        en: ["Type or paste an email address.", "Read the verdict and the list of remarks.", "If the domain has a typo, click Fix to use the popular domain."],
      },
      faq: {
        ru: [
          { q: "Почему a@1.2.3 — неверный адрес?", a: "Зона домена не может состоять только из цифр. IP-адрес вместо домена по стандарту пишут в квадратных скобках — user@[192.0.2.1], — но такие адреса почти нигде не принимаются." },
          { q: "Можно ли использовать кириллицу?", a: "Кириллические домены (почта.рф) работают: при отправке домен переводится в punycode (xn--80a1acny.xn--p1ai). Кириллица в имени до @ допустима по RFC 6531, но поддерживается не всеми серверами." },
          { q: "Проверяет ли инструмент, что ящик существует?", a: "Нет. Для этого нужно обращаться к почтовому серверу или отправлять письмо — инструмент сетевых запросов не делает. Он проверяет только, что адрес записан правильно." },
          { q: "Разрешён ли плюс в адресе?", a: "Да: user+tag@gmail.com — корректный адрес. Gmail и многие другие сервисы доставляют такие письма в основной ящик, это удобно для фильтров." },
        ],
        en: [
          { q: "Why is a@1.2.3 invalid?", a: "A top-level domain can't be all digits. An IP address instead of a domain must be written in brackets — user@[192.0.2.1] — and is rarely accepted anyway." },
          { q: "Can I use non-Latin characters?", a: "Internationalised domains work: they're converted to punycode when sending. Non-Latin local parts are allowed by RFC 6531 but not every server supports them." },
          { q: "Does it check that the mailbox exists?", a: "No. That requires contacting the mail server or sending a message, and the tool makes no network requests. It only checks the address is written correctly." },
          { q: "Is a plus sign allowed?", a: "Yes: user+tag@gmail.com is valid. Gmail and many others deliver such mail to the main inbox, handy for filters." },
        ],
      },
      about: {
        ru: ["Правила записи адреса описаны в RFC 5321 и 5322 и допускают экзотику вроде имён в кавычках. Инструмент применяет практичную версию правил: принимает всё, что реально работает, отмечает редкие допустимые формы и объясняет каждую ошибку по-человечески.", "Отдельно ловятся опечатки в популярных доменах: gmial.com, yandex.r, mail.ry — частая причина недошедших писем с подтверждением регистрации."],
        en: ["Address syntax is defined by RFC 5321 and 5322, which allow oddities like quoted names. The tool applies a practical version of the rules: it accepts everything that really works, flags rare valid forms and explains each error in plain words.", "It also catches typos in popular domains — gmial.com, hotmial.com, yaho.com — a common reason sign-up confirmations never arrive."],
      },
    },
    {
      slug: "iin-validator",
      component: "validate/iin",
      icon: "IdCard",
      popular: true,
      name: { ru: "Проверка ИИН и БИН", en: "IIN and BIN checker" },
      title: { ru: "Проверка ИИН онлайн — дата рождения, пол, контрольная цифра", en: "Kazakhstan IIN Checker — Date of Birth, Sex, Check Digit" },
      h1: { ru: "Проверка ИИН и БИН Казахстана", en: "Kazakhstan IIN and BIN checker" },
      description: {
        ru: "Проверка ИИН Казахстана: контрольная цифра, дата рождения, век и пол. Для БИН — дата регистрации, вид юрлица и признак филиала. Всё в браузере, без запросов в базы.",
        en: "Check a Kazakhstan IIN: check digit, date of birth, century and sex. For a BIN: registration date, entity type and branch sign. Runs in your browser.",
      },
      lead: { ru: "Введите 12 цифр — инструмент сам определит ИИН или БИН и расшифрует номер.", en: "Type 12 digits — the tool detects IIN or BIN and decodes the number." },
      keywords: { ru: ["проверка иин", "иин казахстан", "проверить иин", "бин казахстан"], en: ["kazakhstan iin", "iin check", "bin kazakhstan"] },
      howTo: {
        ru: ["Введите 12 цифр ИИН или БИН.", "Проверьте вердикт: сходится ли контрольная цифра и правильна ли дата.", "Посмотрите расшифровку: дату рождения и пол для ИИН, дату регистрации и вид организации для БИН."],
        en: ["Type the 12 digits of an IIN or BIN.", "Check the verdict: whether the check digit matches and the date is real.", "Read the decoding: birth date and sex for an IIN, registration date and entity type for a BIN."],
      },
      faq: {
        ru: [
          { q: "Как устроен ИИН?", a: "Первые 6 цифр — дата рождения ГГММДД, 7-я — век и пол (1–2 — XIX век, 3–4 — XX, 5–6 — XXI; нечётная — мужской, чётная — женский), 8–11-я — порядковый номер, 12-я — контрольная." },
          { q: "Как считается контрольная цифра?", a: "Первые 11 цифр умножают на веса 1…11 и берут остаток от деления суммы на 11. Если получилось 10, считают заново с весами 3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2; если снова 10 — такой номер не выдаётся." },
          { q: "Чем БИН отличается от ИИН?", a: "БИН выдаётся юридическим лицам и их филиалам: первые 4 цифры — год и месяц регистрации, 5-я — вид (4 — резидент, 5 — нерезидент, 6 — ИП(С)), 6-я — признак головной организации, филиала или представительства. Контрольная цифра считается так же." },
          { q: "Можно ли узнать, кому принадлежит ИИН?", a: "Нет, и инструмент этого не делает: он только проверяет корректность номера. Сведения о владельце есть в государственных базах и выдаются по установленным правилам." },
        ],
        en: [
          { q: "How is an IIN built?", a: "The first 6 digits are the birth date YYMMDD, the 7th is century and sex (1–2 = 19th century, 3–4 = 20th, 5–6 = 21st; odd = male, even = female), digits 8–11 are a serial and the 12th is the check digit." },
          { q: "How is the check digit computed?", a: "Multiply the first 11 digits by weights 1…11 and take the sum mod 11. If that's 10, redo it with weights 3, 4, 5, 6, 7, 8, 9, 10, 11, 1, 2; if it's 10 again the number is never issued." },
          { q: "How does a BIN differ from an IIN?", a: "A BIN is issued to legal entities and their branches: digits 1–4 are the registration year and month, the 5th the type (4 resident, 5 non-resident, 6 joint entrepreneurship), the 6th whether it's a head office, branch or representative office. The check digit works the same way." },
          { q: "Can I find out whose IIN it is?", a: "No, and the tool doesn't try: it only checks that the number is well-formed. Owner details live in government databases and are released under their own rules." },
        ],
      },
      about: {
        ru: ["ИИН — индивидуальный идентификационный номер гражданина Казахстана, БИН — бизнес-идентификационный номер организации. Оба состоят из 12 цифр и проверяются одним алгоритмом, поэтому инструмент различает их автоматически: в ИИН 5-я цифра — десятки дня рождения (0–3), в БИН — вид юрлица (4–6).", "Проверка полезна бухгалтерам, кадровикам и разработчикам форм: опечатка в одной цифре почти всегда ломает контрольную цифру."],
        en: ["The IIN is a Kazakh citizen's individual identification number and the BIN is an organisation's business identification number. Both have 12 digits and share one check algorithm, so the tool tells them apart automatically: in an IIN the 5th digit is the tens of the birth day (0–3), in a BIN it's the entity type (4–6).", "It's useful for accountants, HR and form developers: a single mistyped digit almost always breaks the check digit."],
      },
      variants: {
        title: { ru: "Варианты проверки", en: "Variants" },
        list: () => [
          {
            slug: "bin",
            name: { ru: "Проверка БИН", en: "BIN check" },
            title: { ru: "Проверка БИН Казахстана — вид юрлица и дата регистрации", en: "Kazakhstan BIN Checker — Entity Type and Registration Date" },
            h1: { ru: "Проверка БИН Казахстана", en: "Kazakhstan BIN checker" },
            description: {
              ru: "Проверка БИН организации в Казахстане: контрольная цифра, месяц и год регистрации, резидент или нерезидент, головная организация, филиал или представительство.",
              en: "Check a Kazakhstan business identification number: check digit, registration month and year, resident or non-resident, head office, branch or representative office.",
            },
            lead: { ru: "БИН — 12 цифр: ГГММ регистрации, вид юрлица, признак подразделения, порядковый номер и контрольная цифра.", en: "A BIN is 12 digits: registration YYMM, entity type, unit sign, serial and a check digit." },
            props: { value: "040540123456" },
            blocks: (l: Locale) => [
              {
                type: "table",
                title: l === "ru" ? "Структура БИН" : "BIN structure",
                head: l === "ru" ? ["Цифры", "Значение"] : ["Digits", "Meaning"],
                rows:
                  l === "ru"
                    ? [
                        ["1–2", "Год регистрации (ГГ)"],
                        ["3–4", "Месяц регистрации (ММ)"],
                        ["5", "Вид: 4 — юрлицо-резидент, 5 — юрлицо-нерезидент, 6 — ИП, осуществляющий совместное предпринимательство"],
                        ["6", "Признак: 0 — головное подразделение, 1 — филиал, 2 — представительство, 3 — крестьянское хозяйство на основе совместного предпринимательства"],
                        ["7–11", "Порядковый номер"],
                        ["12", "Контрольная цифра"],
                      ]
                    : [
                        ["1–2", "Registration year (YY)"],
                        ["3–4", "Registration month (MM)"],
                        ["5", "Type: 4 resident legal entity, 5 non-resident legal entity, 6 joint entrepreneurship"],
                        ["6", "Unit: 0 head office, 1 branch, 2 representative office, 3 peasant farm in joint entrepreneurship"],
                        ["7–11", "Serial number"],
                        ["12", "Check digit"],
                      ],
              },
            ],
            faq: {
              ru: [
                { q: "Где взять БИН организации?", a: "Он указан в свидетельстве или справке о регистрации, в договорах и счетах-фактурах, а также в публичных сервисах поиска по БИН. Инструмент проверяет только правильность самого номера." },
                { q: "Совпадает ли БИН с ИИН у ИП?", a: "Индивидуальные предприниматели работают по своему ИИН. БИН с цифрой 6 на пятом месте выдаётся ИП, осуществляющим совместное предпринимательство." },
              ],
              en: [
                { q: "Where do I find a company's BIN?", a: "It's on the registration certificate, contracts and invoices, and in public BIN lookup services. The tool only checks that the number itself is valid." },
                { q: "Do sole proprietors have a BIN?", a: "Individual entrepreneurs operate under their IIN. BINs with 6 in the fifth position are issued to joint entrepreneurship arrangements." },
              ],
            },
          },
        ],
      },
    },
    {
      slug: "inn-validator",
      component: "validate/ru-id",
      icon: "FileCheck",
      name: { ru: "Проверка ИНН", en: "Russian INN checker" },
      title: { ru: "Проверка ИНН онлайн — контрольные цифры", en: "Russian INN Checker — Taxpayer Number Check Digits" },
      h1: { ru: "Проверка ИНН", en: "Russian INN checker" },
      description: {
        ru: "Проверка ИНН организации (10 цифр) и физлица или ИП (12 цифр) по алгоритму ФНС: контрольные цифры и код региона. Подсказка правильного варианта при опечатке.",
        en: "Check a Russian taxpayer number: 10 digits for companies, 12 for individuals, using the Federal Tax Service algorithm — check digits and region code.",
      },
      lead: { ru: "Введите ИНН — проверка контрольных цифр по алгоритму ФНС займёт мгновение.", en: "Type an INN to verify its check digits with the tax service algorithm." },
      props: { kind: "inn" },
      keywords: { ru: ["проверка инн", "проверить инн", "контрольная сумма инн"], en: ["inn check", "russian tax number"] },
      howTo: {
        ru: ["Введите 10 или 12 цифр ИНН.", "Посмотрите вердикт и тип ИНН — организации или физического лица.", "Если контрольная цифра не сошлась, инструмент покажет правильный вариант с теми же первыми цифрами."],
        en: ["Type the 10 or 12 INN digits.", "Check the verdict and the INN type — company or individual.", "If the check digit doesn't match, the tool shows the correct variant with the same leading digits."],
      },
      faq: {
        ru: [
          { q: "Как проверяется ИНН?", a: "У 10-значного ИНН последняя цифра — контрольная: первые 9 цифр умножают на веса 2, 4, 10, 3, 5, 9, 4, 6, 8, сумму делят на 11, остаток — на 10. У 12-значного две контрольные цифры, считаются похожим образом с весами 7, 2, 4, 10, 3, 5, 9, 4, 6, 8 и 3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8." },
          { q: "Что означают первые цифры ИНН?", a: "Первые две — код региона, где ИНН присвоен, следующие две — номер налоговой инспекции. Название инспекции инструмент не показывает." },
          { q: "Значит ли корректный ИНН, что организация существует?", a: "Нет, только что номер записан без ошибок. Действует ли организация, проверяют по ЕГРЮЛ/ЕГРИП на сайте ФНС." },
        ],
        en: [
          { q: "How is an INN checked?", a: "In a 10-digit INN the last digit is a check digit: multiply the first 9 by weights 2, 4, 10, 3, 5, 9, 4, 6, 8, take the sum mod 11, then mod 10. A 12-digit INN has two check digits computed similarly with weights 7, 2, 4, 10, 3, 5, 9, 4, 6, 8 and 3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8." },
          { q: "What do the first digits mean?", a: "The first two are the region code where the INN was assigned, the next two the tax office number. The tool doesn't show office names." },
          { q: "Does a valid INN mean the company exists?", a: "No, only that the number is well-formed. Whether a company is active is checked in the official EGRUL/EGRIP registries." },
        ],
      },
      about: {
        ru: ["ИНН — идентификационный номер налогоплательщика в России: 10 цифр у организаций, 12 — у физических лиц и индивидуальных предпринимателей. Контрольные цифры защищают от опечаток при заполнении платёжек, договоров и форм на сайтах.", "Инструмент удобен для проверки реквизитов перед оплатой и для разработчиков, которым нужна та же проверка в форме."],
        en: ["The INN is Russia's taxpayer identification number: 10 digits for companies, 12 for individuals and sole proprietors. Its check digits catch typos in payment orders, contracts and web forms.", "Handy for checking payment details before paying and for developers who need the same check in a form."],
      },
    },
    {
      slug: "snils-validator",
      component: "validate/ru-id",
      icon: "IdCard",
      name: { ru: "Проверка СНИЛС", en: "SNILS checker" },
      title: { ru: "Проверка СНИЛС онлайн — контрольное число", en: "SNILS Checker — Russian Insurance Number Check" },
      h1: { ru: "Проверка СНИЛС", en: "SNILS checker" },
      description: {
        ru: "Проверка контрольного числа СНИЛС (11 цифр) по алгоритму Социального фонда России и приведение к формату XXX-XXX-XXX YY. Номер никуда не отправляется.",
        en: "Verify the check number of a Russian SNILS (11 digits) using the Social Fund algorithm and format it as XXX-XXX-XXX YY. Nothing is sent anywhere.",
      },
      lead: { ru: "Введите СНИЛС — узнаете, сходится ли контрольное число, и получите номер в стандартной записи.", en: "Type a SNILS to see whether its check number matches and get it in the standard format." },
      props: { kind: "snils" },
      keywords: { ru: ["проверка снилс", "контрольное число снилс"], en: ["snils check"] },
      howTo: {
        ru: ["Введите 11 цифр СНИЛС — с дефисами или без.", "Посмотрите вердикт и номер в формате XXX-XXX-XXX YY.", "При ошибке увидите правильное контрольное число для этих 9 цифр."],
        en: ["Type the 11 SNILS digits, with or without hyphens.", "Read the verdict and the number in XXX-XXX-XXX YY format.", "On an error you'll see the correct check number for those 9 digits."],
      },
      faq: {
        ru: [
          { q: "Как считается контрольное число СНИЛС?", a: "Каждую из первых 9 цифр умножают на её позицию с конца (9, 8, …, 1) и складывают. Если сумма меньше 100 — это и есть контрольное число; 100 и 101 дают 00; больше 101 — берут остаток от деления на 101 (остаток 100 тоже даёт 00)." },
          { q: "Почему у старых номеров нет проверки?", a: "Контрольное число определено только для номеров больше 001-001-998. У первых выданных номеров оно не рассчитывается, поэтому такие номера считаются корректными по формату." },
        ],
        en: [
          { q: "How is the SNILS check number computed?", a: "Multiply each of the first 9 digits by its position from the end (9, 8, …, 1) and add them up. Below 100 the sum is the check number; 100 and 101 give 00; above 101 take it mod 101 (a remainder of 100 also gives 00)." },
          { q: "Why do some old numbers have no check?", a: "The check number is defined only for numbers above 001-001-998; the earliest numbers are accepted by format alone." },
        ],
      },
      about: {
        ru: ["СНИЛС — страховой номер индивидуального лицевого счёта в системе обязательного пенсионного страхования России. Его запрашивают работодатели, Госуслуги и медицинские организации.", "Проверка контрольного числа помогает поймать опечатку до отправки документов."],
        en: ["SNILS is the individual insurance account number in Russia's mandatory pension system, requested by employers, the Gosuslugi portal and healthcare providers.", "Checking the control number catches typos before documents are submitted."],
      },
    },
    {
      slug: "ogrn-validator",
      component: "validate/ru-id",
      icon: "Building2",
      name: { ru: "Проверка ОГРН", en: "OGRN checker" },
      title: { ru: "Проверка ОГРН и ОГРНИП онлайн — контрольная цифра", en: "OGRN and OGRNIP Checker — Russian Registration Number" },
      h1: { ru: "Проверка ОГРН и ОГРНИП", en: "OGRN and OGRNIP checker" },
      description: {
        ru: "Проверка ОГРН (13 цифр) и ОГРНИП (15 цифр): контрольная цифра, признак записи, год присвоения и код региона. Расчёт идёт в браузере, данные никуда не уходят.",
        en: "Check a Russian OGRN (13 digits) or OGRNIP (15 digits): check digit, record sign, year of assignment and region code. Everything runs in your browser.",
      },
      lead: { ru: "Введите ОГРН или ОГРНИП — узнаете, сходится ли контрольная цифра, и расшифруете номер.", en: "Type an OGRN or OGRNIP to verify its check digit and decode it." },
      props: { kind: "ogrn" },
      keywords: { ru: ["проверка огрн", "проверка огрнип"], en: ["ogrn check", "ogrnip"] },
      howTo: {
        ru: ["Введите 13 цифр ОГРН или 15 цифр ОГРНИП.", "Посмотрите вердикт.", "Ниже — расшифровка: признак, год присвоения номера и код региона."],
        en: ["Type the 13 OGRN or 15 OGRNIP digits.", "Read the verdict.", "Below is the decoding: sign, year of assignment and region code."],
      },
      faq: {
        ru: [
          { q: "Как проверяется ОГРН?", a: "Число из первых 12 цифр делят на 11, остаток делят на 10 — результат должен совпасть с 13-й цифрой. Для ОГРНИП берут первые 14 цифр и делят на 13." },
          { q: "Что означают цифры ОГРН?", a: "1-я — признак (1 и 5 — ОГРН юрлица, 3 — ОГРНИП), 2–3-я — две последние цифры года присвоения, 4–5-я — код региона, дальше — код инспекции и номер записи в реестре." },
        ],
        en: [
          { q: "How is an OGRN checked?", a: "Take the number formed by the first 12 digits mod 11, then mod 10 — it must equal the 13th digit. For an OGRNIP use the first 14 digits mod 13." },
          { q: "What do the digits mean?", a: "The 1st is the sign (1 and 5 company OGRN, 3 OGRNIP), the 2nd–3rd the last two digits of the year assigned, the 4th–5th the region code, then the tax office and record number." },
        ],
      },
      about: {
        ru: ["ОГРН — основной государственный регистрационный номер юридического лица в России, ОГРНИП — индивидуального предпринимателя. Номера присваиваются при внесении записи в ЕГРЮЛ или ЕГРИП.", "Инструмент проверяет только корректность номера; сведения об организации ищите в официальных реестрах ФНС."],
        en: ["OGRN is the primary state registration number of a Russian legal entity; OGRNIP is that of a sole proprietor. They're assigned when the entry is made in the EGRUL or EGRIP registry.", "The tool only checks the number; look up the company itself in the official tax service registries."],
      },
      variants: {
        title: { ru: "Варианты", en: "Variants" },
        list: () => [
          {
            slug: "ogrnip",
            name: { ru: "ОГРНИП", en: "OGRNIP" },
            title: { ru: "Проверка ОГРНИП индивидуального предпринимателя", en: "OGRNIP Checker for Russian Sole Proprietors" },
            h1: { ru: "Проверка ОГРНИП", en: "OGRNIP checker" },
            description: {
              ru: "Проверка ОГРНИП индивидуального предпринимателя: 15 цифр, контрольная цифра по остатку от деления на 13, год присвоения номера и код региона.",
              en: "Check a Russian sole proprietor's OGRNIP: 15 digits, check digit from the remainder mod 13, year of assignment and region code.",
            },
            lead: { ru: "ОГРНИП — 15 цифр, начинается с 3; последняя цифра — контрольная (остаток от деления на 13).", en: "An OGRNIP has 15 digits and starts with 3; the last digit is a check digit (mod 13)." },
            props: { value: "304500116000157" },
            blocks: (l: Locale) => [
              {
                type: "table",
                title: l === "ru" ? "Структура ОГРНИП" : "OGRNIP structure",
                head: l === "ru" ? ["Цифры", "Значение"] : ["Digits", "Meaning"],
                rows:
                  l === "ru"
                    ? [["1", "Признак: 3 — ОГРНИП"], ["2–3", "Год присвоения номера"], ["4–5", "Код региона"], ["6–14", "Номер записи в ЕГРИП"], ["15", "Контрольная цифра"]]
                    : [["1", "Sign: 3 — OGRNIP"], ["2–3", "Year assigned"], ["4–5", "Region code"], ["6–14", "Record number in EGRIP"], ["15", "Check digit"]],
              },
            ],
            faq: {
              ru: [{ q: "Чем ОГРНИП отличается от ОГРН?", a: "ОГРНИП выдаётся индивидуальным предпринимателям и состоит из 15 цифр (контроль — деление на 13), ОГРН — юрлицам, 13 цифр (контроль — деление на 11)." }, { q: "Меняется ли ОГРНИП?", a: "При закрытии и повторной регистрации ИП получает новый ОГРНИП." }],
              en: [{ q: "How does OGRNIP differ from OGRN?", a: "OGRNIP is issued to sole proprietors and has 15 digits (checked mod 13); OGRN is for legal entities, 13 digits (mod 11)." }, { q: "Does an OGRNIP change?", a: "A sole proprietor who closes and re-registers gets a new OGRNIP." }],
            },
          },
        ],
      },
    },
    {
      slug: "isbn-validator",
      component: "validate/isbn",
      icon: "BookOpen",
      name: { ru: "Проверка ISBN", en: "ISBN validator" },
      title: { ru: "Проверка ISBN онлайн и перевод ISBN-10 ↔ ISBN-13", en: "ISBN Validator and ISBN-10 ↔ ISBN-13 Converter" },
      h1: { ru: "Проверка ISBN", en: "ISBN validator" },
      description: {
        ru: "Проверка контрольной цифры ISBN-10 и ISBN-13 и перевод между ними: 0-306-40615-2 ↔ 978-0-306-40615-7. Понимает дефисы, пробелы и префикс «ISBN».",
        en: "Check ISBN-10 and ISBN-13 check digits and convert between them: 0-306-40615-2 ↔ 978-0-306-40615-7. Accepts hyphens, spaces and an “ISBN” prefix.",
      },
      lead: { ru: "Введите ISBN — проверим контрольную цифру и покажем номер в обоих форматах.", en: "Type an ISBN to verify the check digit and see both formats." },
      keywords: { ru: ["проверка isbn", "isbn 10 в isbn 13"], en: ["isbn validator", "isbn 10 to 13"] },
      howTo: {
        ru: ["Вставьте ISBN с дефисами или без.", "Посмотрите вердикт.", "Скопируйте номер в нужном формате: ISBN-13 или ISBN-10."],
        en: ["Paste the ISBN with or without hyphens.", "Read the verdict.", "Copy the number in the format you need: ISBN-13 or ISBN-10."],
      },
      faq: {
        ru: [
          { q: "Как перевести ISBN-10 в ISBN-13?", a: "Добавьте спереди 978, отбросьте старую контрольную цифру и пересчитайте новую по правилам EAN-13. Инструмент делает это автоматически." },
          { q: "Почему у ISBN-10 бывает X в конце?", a: "Контрольная цифра ISBN-10 считается по модулю 11 и может равняться 10 — тогда её записывают римской X." },
        ],
        en: [
          { q: "How do I convert ISBN-10 to ISBN-13?", a: "Prefix 978, drop the old check digit and compute a new one with the EAN-13 rule. The tool does it automatically." },
          { q: "Why do some ISBN-10s end with X?", a: "The ISBN-10 check digit is computed mod 11 and can equal 10, written as the Roman numeral X." },
        ],
      },
      about: {
        ru: ["ISBN — международный стандартный книжный номер. С 2007 года используется 13-значная форма, совпадающая со штрихкодом EAN-13 на обложке (префикс 978 или 979); старые книги несут 10-значный ISBN.", "Инструмент проверяет контрольную цифру и переводит номера между форматами — удобно для библиотек, книжных магазинов и каталогов."],
        en: ["The ISBN is the International Standard Book Number. Since 2007 the 13-digit form is used, matching the EAN-13 barcode on the cover (prefix 978 or 979); older books carry a 10-digit ISBN.", "The tool verifies the check digit and converts between formats — handy for libraries, bookshops and catalogues."],
      },
    },
    {
      slug: "vin-validator",
      component: "validate/vin",
      icon: "Car",
      name: { ru: "Проверка VIN-кода", en: "VIN validator" },
      title: { ru: "Проверка VIN-кода — контрольная цифра, регион, год", en: "VIN Validator — Check Digit, Region, Model Year" },
      h1: { ru: "Проверка VIN-кода автомобиля", en: "VIN validator" },
      description: {
        ru: "Проверка VIN (17 символов): контрольная цифра на 9-й позиции, регион сборки по первому символу, модельный год и структура WMI/VDS/VIS. Без запросов в базы.",
        en: "Check a 17-character VIN: the 9th-position check digit, region by the first character, model year and the WMI/VDS/VIS structure. No database queries.",
      },
      lead: { ru: "Введите VIN — проверим структуру и контрольную цифру и расшифруем регион и модельный год.", en: "Type a VIN to check its structure and check digit and decode the region and model year." },
      keywords: { ru: ["проверка vin", "vin код расшифровка", "контрольная цифра vin"], en: ["vin check digit", "vin validator"] },
      howTo: {
        ru: ["Введите 17 символов VIN — из СТС, ПТС или с кузова.", "Проверьте вердикт: нет ли запрещённых букв I, O, Q и сходится ли контрольная цифра.", "Посмотрите регион сборки и возможные модельные годы."],
        en: ["Type the 17-character VIN from the registration or the car body.", "Check the verdict: no forbidden I, O, Q and whether the check digit matches.", "See the region and the possible model years."],
      },
      faq: {
        ru: [
          { q: "Что значит, если контрольная цифра не сошлась?", a: "Для автомобилей рынка Северной Америки это почти наверняка опечатка или поддельный номер. У европейских и многих азиатских машин 9-й символ часто не контрольный, и несовпадение — норма." },
          { q: "Почему модельный год показан двумя вариантами?", a: "Коды года повторяются каждые 30 лет: «A» — это 1980 или 2010. Выбирайте по здравому смыслу — возрасту машины." },
          { q: "Можно ли узнать историю автомобиля?", a: "Нет, инструмент не обращается к базам. Для истории, ограничений и ДТП используйте официальные сервисы (например, проверку на сайте ГИБДД) или сервисы истории авто." },
        ],
        en: [
          { q: "What if the check digit doesn't match?", a: "For vehicles built for North America it's almost certainly a typo or a fake. Many European and Asian vehicles don't use position 9 as a check digit, so a mismatch is normal there." },
          { q: "Why are two model years shown?", a: "Year codes repeat every 30 years: “A” means 1980 or 2010. Pick the one that fits the car's age." },
          { q: "Can I get the vehicle's history?", a: "No, the tool doesn't query databases. Use official services or vehicle history providers for accidents and liens." },
        ],
      },
      about: {
        ru: ["VIN — 17-значный идентификационный номер транспортного средства по ISO 3779: WMI (производитель), VDS (описание модели) и VIS (год, завод, серийный номер). Буквы I, O и Q не используются, чтобы их не путали с цифрами.", "Проверка контрольной цифры по стандарту Северной Америки быстро выявляет опечатки при переписывании номера."],
        en: ["A VIN is the 17-character vehicle identification number under ISO 3779: WMI (manufacturer), VDS (vehicle attributes) and VIS (year, plant, serial). The letters I, O and Q are never used to avoid confusion with digits.", "The North American check-digit rule quickly exposes typos when a number is copied."],
      },
    },
  ],
});
