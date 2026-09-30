import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, VariantDef } from "@/registry/types";
import { averageCrackSeconds, memorableEntropy, passwordEntropy } from "./engine";
import { humanDuration } from "./time";

const EN_WORDS = 1303;
const RU_WORDS = 1359;
const FAST = 1e10;
const SLOW = 1e4;

const bitsFmt = (l: Locale, b: number) => formatNumber(l, Math.round(b * 10) / 10);
/** "из 24 символов" — genitive after «из». */
const charsFrom = (n: number) => `${n} ${plural("ru", n, ["символа", "символов", "символов"])}`;

const SETS: { ru: string; en: string; size: number }[] = [
  { ru: "только цифры", en: "digits only", size: 10 },
  { ru: "строчные буквы", en: "lower-case letters", size: 26 },
  { ru: "строчные + цифры", en: "lower case + digits", size: 36 },
  { ru: "строчные + заглавные", en: "lower + upper case", size: 52 },
  { ru: "буквы + цифры", en: "letters + digits", size: 62 },
  { ru: "буквы, цифры и символы", en: "letters, digits and symbols", size: 94 },
];

function lengthTable(n: number, l: Locale): Block {
  const ru = l === "ru";
  return {
    type: "table",
    title: ru ? `Надёжность пароля из ${charsFrom(n)} по наборам символов` : `Strength of a ${n}-character password by character set`,
    head: ru ? ["Набор символов", "Энтропия, бит", "Быстрый хеш, 10 млрд/с", "Медленный хеш, 10 тыс./с"] : ["Character set", "Entropy, bits", "Fast hash, 10 billion/s", "Slow hash, 10k/s"],
    rows: SETS.map((s) => {
      const b = n * Math.log2(s.size);
      return [ru ? s.ru : s.en, bitsFmt(l, b), humanDuration(averageCrackSeconds(b, FAST), l), humanDuration(averageCrackSeconds(b, SLOW), l)];
    }),
  };
}

const LENGTHS = [8, 10, 12, 14, 16, 20, 24, 32, 64];

const LENGTH_NOTES: Record<number, { ru: string; en: string }> = {
  8: { ru: "8 символов — минимум, который до сих пор требуют многие сайты, но для паролей из утёкших баз этого мало: полный перебор 94^8 комбинаций на современных видеокартах занимает часы. Используйте 8 символов только там, где число попыток входа жёстко ограничено.", en: "8 characters is the minimum many sites still ask for, but it's too short for passwords that could leak: all 94^8 combinations can be brute-forced on modern GPUs in hours. Use 8 characters only where login attempts are strictly limited." },
  10: { ru: "10 случайных символов из всех наборов дают около 65 бит — заметно лучше восьми, но для важных учётных записей стоит взять 12–16.", en: "10 random characters from all sets give about 65 bits — much better than eight, but important accounts deserve 12–16." },
  12: { ru: "12 символов — разумный минимум для обычных аккаунтов: около 79 бит при всех наборах символов. Столько рекомендуют многие руководства по безопасности.", en: "12 characters is a sensible minimum for everyday accounts: about 79 bits with all character sets, as many security guides recommend." },
  14: { ru: "14 символов — хороший выбор для почты и соцсетей: около 92 бит, перебор нереален даже при утечке базы с быстрым хешем.", en: "14 characters suits email and social accounts: about 92 bits, infeasible to brute-force even from a leaked fast-hash database." },
  16: { ru: "16 символов — популярный стандарт менеджеров паролей: около 105 бит. Такой пароль не подобрать перебором, если он уникален для каждого сайта.", en: "16 characters is the password-manager favourite: about 105 bits. It can't be brute-forced as long as it's unique per site." },
  20: { ru: "20 символов — с запасом для банков, почты администратора и мастер-доступов: около 131 бита.", en: "20 characters gives headroom for banking, admin mail and master access: about 131 bits." },
  24: { ru: "24 символа — около 157 бит: подходит для сервисных учётных записей и паролей, которые хранятся в менеджере паролей и никогда не вводятся вручную.", en: "24 characters — about 157 bits: good for service accounts and passwords that live in a manager and are never typed." },
  32: { ru: "32 символа — около 210 бит, больше, чем у ключа AES-128 или AES-192. Удобно для секретов приложений и токенов.", en: "32 characters — about 210 bits, more than an AES-128 or AES-192 key. Handy for application secrets and tokens." },
  64: { ru: "64 символа — максимальная длина пароля Wi-Fi WPA2 и предел многих форм. Около 420 бит — это уже далеко за пределами любых возможностей перебора.", en: "64 characters is the WPA2 Wi-Fi passphrase maximum and many forms' limit. About 420 bits — far beyond any brute-force capability." },
};

function lengthVariant(n: number): VariantDef {
  const bits = passwordEntropy({ length: n, lower: true, upper: true, digits: true, symbols: true, excludeAmbiguous: false, requireEach: true });
  return {
    slug: `${n}-characters`,
    name: { ru: `${n} символов`, en: `${n} characters` },
    title: { ru: `Генератор паролей на ${n} ${plural("ru", n, ["символ", "символа", "символов"])} онлайн`, en: `${n}-Character Password Generator — Strong Random Password` },
    h1: { ru: `Пароль из ${n} ${plural("ru", n, ["символа", "символов", "символов"])}`, en: `${n}-character password generator` },
    description: {
      ru: `Случайный пароль из ${charsFrom(n)}: буквы, цифры и спецсимволы, ≈ ${bitsFmt("ru", bits)} бит энтропии. Сколько займёт перебор и какие наборы символов выбрать.`,
      en: `A random ${n}-character password with letters, digits and symbols, ≈ ${bitsFmt("en", bits)} bits of entropy. How long cracking takes and which character sets to use.`,
    },
    lead: { ru: `Случайный пароль из ${charsFrom(n)} — примерно ${bitsFmt("ru", bits)} бит энтропии при всех наборах символов.`, en: `A random ${n}-character password has about ${bitsFmt("en", bits)} bits of entropy with all character sets.` },
    props: { mode: "password", length: n },
    keywords: { ru: [`пароль ${n} символов`, `генератор пароля ${n}`], en: [`${n} character password`, `${n} char password generator`] },
    blocks: (l: Locale) => [{ type: "text", title: l === "ru" ? `Когда достаточно ${n} символов` : `When ${n} characters are enough`, paragraphs: [LENGTH_NOTES[n][l]] }, lengthTable(n, l)],
    faq: {
      ru: [
        { q: `Насколько надёжен пароль из ${charsFrom(n)}?`, a: `При случайном выборе из 94 печатных символов — около ${bitsFmt("ru", n * Math.log2(94))} бит. Если база с быстрым хешем утечёт, перебор займёт в среднем ${humanDuration(averageCrackSeconds(n * Math.log2(94), FAST), "ru")}.` },
        { q: "Нужно ли запоминать такой пароль?", a: "Нет: храните случайные пароли в менеджере паролей (встроенном в браузер, Bitwarden, KeePass). Запоминать стоит только мастер-пароль — для него удобнее парольная фраза из слов." },
      ],
      en: [
        { q: `How strong is a ${n}-character password?`, a: `Chosen randomly from 94 printable characters it has about ${bitsFmt("en", n * Math.log2(94))} bits. If a fast-hash database leaks, cracking takes on average ${humanDuration(averageCrackSeconds(n * Math.log2(94), FAST), "en")}.` },
        { q: "Do I need to memorise it?", a: "No: keep random passwords in a password manager (your browser's, Bitwarden, KeePass). Only the master password needs memorising — a passphrase of words is easier for that." },
      ],
    },
  };
}

const WEAK_PINS = ["1234", "1111", "0000", "1212", "7777", "1004", "2000", "4444", "2222", "1122"];

function pinVariant(n: number): VariantDef {
  const bits = n * Math.log2(10);
  const combos = 10 ** n;
  return {
    slug: `pin-${n}`,
    name: { ru: `PIN из ${n} цифр`, en: `${n}-digit PIN` },
    title: { ru: `Генератор PIN-кода из ${n} цифр — случайный ПИН`, en: `${n}-Digit PIN Generator — Random PIN Code` },
    h1: { ru: `Случайный PIN-код из ${n} цифр`, en: `Random ${n}-digit PIN generator` },
    description: {
      ru: `Случайный PIN из ${n} цифр: ${formatNumber("ru", combos)} комбинаций (${bitsFmt("ru", bits)} бит). Генерируется криптостойко, без предсказуемых 1234 и дат рождения.`,
      en: `A random ${n}-digit PIN: ${formatNumber("en", combos)} combinations (${bitsFmt("en", bits)} bits). Cryptographically random, no predictable 1234 or birthdays.`,
    },
    lead: { ru: `PIN из ${n} цифр — это ${formatNumber("ru", combos)} вариантов; безопасность держится на ограничении числа попыток.`, en: `A ${n}-digit PIN has ${formatNumber("en", combos)} possibilities; its security relies on attempt limits.` },
    props: { mode: "pin", length: n },
    keywords: { ru: [`пин код ${n} цифр`, "случайный пин"], en: [`${n} digit pin`, "random pin"] },
    blocks: (l: Locale) => [
      {
        type: "facts",
        title: l === "ru" ? `PIN из ${n} цифр коротко` : `${n}-digit PIN at a glance`,
        rows: [
          [l === "ru" ? "Комбинаций" : "Combinations", formatNumber(l, combos)],
          [l === "ru" ? "Энтропия" : "Entropy", `${bitsFmt(l, bits)} ${l === "ru" ? "бит" : "bits"}`],
          [l === "ru" ? "Шанс угадать с 3 попыток" : "Chance to guess in 3 tries", `1 ${l === "ru" ? "из" : "in"} ${formatNumber(l, Math.round(combos / 3))}`],
          [l === "ru" ? "Где используется" : "Used for", n === 4 ? (l === "ru" ? "банковские карты, SIM-карты" : "bank cards, SIM cards") : n === 6 ? (l === "ru" ? "смартфоны, коды приложений банков" : "smartphones, banking apps") : l === "ru" ? "сейфы, домофоны, коды доступа" : "safes, door entry, access codes"],
        ],
      },
      {
        type: "text",
        title: l === "ru" ? "Каких PIN-кодов избегать" : "PINs to avoid",
        paragraphs: [
          l === "ru"
            ? `Люди выбирают PIN предсказуемо: по исследованиям утечек, около 10% четырёхзначных кодов — это 1234, а среди самых популярных — ${WEAK_PINS.join(", ")}, а также годы и даты рождения. Случайный PIN такой уязвимости лишён.`
            : `People pick PINs predictably: studies of leaked codes show about 10% of 4-digit PINs are 1234, and the top list includes ${WEAK_PINS.join(", ")}, years and birthdays. A random PIN has no such weakness.`,
        ],
      },
    ],
    faq: {
      ru: [
        { q: `Насколько надёжен PIN из ${n} цифр?`, a: `Всего ${formatNumber("ru", combos)} комбинаций — перебрать их компьютер может мгновенно. Поэтому PIN защищает только вместе с ограничением попыток: карта блокируется после трёх ошибок, телефон — вводит задержки.` },
        { q: "Можно ли использовать дату рождения?", a: "Лучше нет: её легко узнать из соцсетей и документов, а даты — первое, что пробуют при подборе." },
      ],
      en: [
        { q: `How secure is a ${n}-digit PIN?`, a: `There are only ${formatNumber("en", combos)} combinations — trivial for a computer. A PIN only protects together with attempt limits: cards lock after three errors, phones add delays.` },
        { q: "Can I use my birthday?", a: "Better not: it's easy to find on social media and documents, and dates are the first thing attackers try." },
      ],
    },
  };
}

function passphraseBlocks(l: Locale): Block[] {
  const ru = l === "ru";
  return [
    {
      type: "table",
      title: ru ? "Энтропия парольной фразы по числу слов" : "Passphrase entropy by word count",
      head: ru ? ["Слов", `Английский список (${formatNumber(l, EN_WORDS)} слов)`, `Русский список (${formatNumber(l, RU_WORDS)} слов)`, "Перебор (быстрый хеш)"] : ["Words", `English list (${formatNumber(l, EN_WORDS)} words)`, `Russian list (${formatNumber(l, RU_WORDS)} words)`, "Cracking (fast hash)"],
      rows: [3, 4, 5, 6, 7, 8].map((k) => {
        const b = k * Math.log2(EN_WORDS);
        return [String(k), `${bitsFmt(l, b)} ${ru ? "бит" : "bits"}`, `${bitsFmt(l, k * Math.log2(RU_WORDS))} ${ru ? "бит" : "bits"}`, humanDuration(averageCrackSeconds(b, FAST), l)];
      }),
    },
    {
      type: "text",
      title: ru ? "Почему слова, а не символы" : "Why words instead of symbols",
      paragraphs: ru
        ? [
            "Парольная фраза вроде «лодка-маяк-кедр-вальс-арбуз» запоминается легче, чем «k#8Qz!r2», а надёжнее: каждое слово из списка в 1 300+ слов даёт около 10,3 бита, пять слов — больше 51 бита, шесть — почти 62. Главное — слова выбирает генератор случайно, а не человек.",
            "Русские слова можно получить латиницей (lodka-mayak-kedr-valts-arbuz): так фразу удобно вводить на любой раскладке, а энтропия не меняется, потому что транслитерация однозначна.",
          ]
        : [
            "A passphrase like “lantern-otter-maple-bingo-quartz” is easier to remember than “k#8Qz!r2” and stronger: each word from a 1,300+ word list adds about 10.3 bits, five words give over 51 bits, six nearly 62. The key is that the generator picks words at random, not a person.",
            "Russian words can be output in Latin letters (lodka-mayak-kedr-valts-arbuz), so the phrase is easy to type on any layout; entropy stays the same because the transliteration is one-to-one.",
          ],
    },
  ];
}

function keyTable(l: Locale, kind: "hex" | "base64"): Block {
  const ru = l === "ru";
  const rows = [128, 192, 256, 384, 512].map((b) => [String(b), String(b / 8), kind === "hex" ? String(b / 4) : `${Math.ceil(b / 6)} / ${4 * Math.ceil(b / 24)}`]);
  return {
    type: "table",
    title: ru ? "Длина ключа в символах" : "Key length in characters",
    head: ru ? ["Бит", "Байт", kind === "hex" ? "Символов hex" : "Символов base64url / base64"] : ["Bits", "Bytes", kind === "hex" ? "Hex characters" : "base64url / base64 characters"],
    rows,
  };
}

function simpleVariant(slug: string, props: Record<string, unknown>, v: { ru: Omit<VariantTexts, "blocks">; en: Omit<VariantTexts, "blocks"> }, blocks?: (l: Locale) => Block[]): VariantDef {
  return {
    slug,
    name: { ru: v.ru.name, en: v.en.name },
    title: { ru: v.ru.title, en: v.en.title },
    h1: { ru: v.ru.h1, en: v.en.h1 },
    description: { ru: v.ru.description, en: v.en.description },
    lead: { ru: v.ru.lead, en: v.en.lead },
    props,
    keywords: { ru: v.ru.keywords, en: v.en.keywords },
    blocks,
    faq: { ru: v.ru.faq, en: v.en.faq },
  };
}

interface VariantTexts {
  name: string;
  title: string;
  h1: string;
  description: string;
  lead: string;
  keywords: string[];
  faq: QA[];
}

function variants(): VariantDef[] {
  const memo = memorableEntropy({ words: 3, syllables: 3, digits: 2, separator: "-", capitalize: true });
  return [
    ...LENGTHS.map(lengthVariant),
    ...[4, 6, 8].map(pinVariant),
    simpleVariant(
      "passphrase",
      { mode: "passphrase" },
      {
        ru: {
          name: "Парольная фраза",
          title: "Генератор парольных фраз из слов — русские и английские",
          h1: "Генератор парольной фразы",
          description: `Парольная фраза из случайных слов: русский (${formatNumber("ru", RU_WORDS)}) или английский (${formatNumber("ru", EN_WORDS)}) словарь, латиница для русских слов. 5 слов ≈ 51 бит.`,
          lead: "Несколько случайных слов подряд — пароль, который легко запомнить и трудно подобрать.",
          keywords: ["парольная фраза", "пароль из слов", "diceware"],
          faq: [
            { q: "Сколько слов нужно?", a: "Для обычных аккаунтов — 4–5 слов (41–51 бит), для мастер-пароля менеджера паролей — 6–7 слов (62–72 бита)." },
            { q: "Можно ли придумать фразу самому?", a: "Лучше нет: люди выбирают связные и предсказуемые сочетания. Надёжность фразы гарантирует только случайный выбор слов из большого списка." },
          ],
        },
        en: {
          name: "Passphrase",
          title: "Passphrase Generator — Random Words in English or Russian",
          h1: "Passphrase generator",
          description: `A passphrase of random words from an English (${formatNumber("en", EN_WORDS)}) or Russian (${formatNumber("en", RU_WORDS)}) list, with Latin transliteration. 5 words ≈ 51 bits.`,
          lead: "A few random words in a row — a password that's easy to remember and hard to crack.",
          keywords: ["passphrase generator", "diceware", "random words password"],
          faq: [
            { q: "How many words do I need?", a: "4–5 words (41–51 bits) for everyday accounts, 6–7 words (62–72 bits) for a password manager's master password." },
            { q: "Can I make up my own phrase?", a: "Better not: people pick meaningful, predictable combinations. Only random selection from a large list guarantees strength." },
          ],
        },
      },
      passphraseBlocks,
    ),
    simpleVariant(
      "wifi",
      { mode: "wifi", length: 63 },
      {
        ru: {
          name: "Пароль для Wi-Fi",
          title: "Генератор пароля для Wi-Fi (WPA2/WPA3) до 63 символов",
          h1: "Пароль для Wi-Fi",
          description: "Надёжный пароль для Wi-Fi WPA2 и WPA3: от 8 до 63 символов, по умолчанию 63 буквы и цифры (≈ 375 бит) — без символов, которые трудно вводить на телевизоре.",
          lead: "Пароль Wi-Fi WPA2/WPA3 — от 8 до 63 печатных символов; длинный случайный пароль защищает от перебора перехваченного рукопожатия.",
          keywords: ["пароль для wifi", "пароль wpa2", "сгенерировать пароль wifi"],
          faq: [
            { q: "Почему пароль Wi-Fi должен быть длинным?", a: "Для WPA2-Personal злоумышленник может записать рукопожатие при подключении и перебирать пароль офлайн без ограничений. Длинный случайный пароль делает это невозможным." },
            { q: "Как делиться длинным паролем?", a: "Покажите гостям QR-код Wi-Fi: телефон подключится после сканирования, вводить пароль вручную не придётся." },
            { q: "WPA3 безопаснее?", a: "Да: в WPA3-Personal (SAE) офлайн-перебор перехваченного рукопожатия невозможен. Но многие устройства работают в смешанном режиме WPA2/WPA3, поэтому длинный пароль всё равно нужен." },
          ],
        },
        en: {
          name: "Wi-Fi password",
          title: "Wi-Fi Password Generator (WPA2/WPA3) up to 63 Characters",
          h1: "Wi-Fi password generator",
          description: "A strong WPA2/WPA3 Wi-Fi password: 8 to 63 characters, 63 letters and digits by default (≈ 375 bits) — no symbols that are awkward to type on a TV.",
          lead: "A WPA2/WPA3 Wi-Fi passphrase is 8 to 63 printable characters; a long random one defeats offline cracking of a captured handshake.",
          keywords: ["wifi password generator", "wpa2 password"],
          faq: [
            { q: "Why should a Wi-Fi password be long?", a: "With WPA2-Personal an attacker can record the handshake when a device connects and guess offline without limits. A long random password makes that impossible." },
            { q: "How do I share a long password?", a: "Show guests a Wi-Fi QR code: their phone connects after scanning, no typing needed." },
            { q: "Is WPA3 safer?", a: "Yes: WPA3-Personal (SAE) prevents offline guessing from a captured handshake. But many devices run in mixed WPA2/WPA3 mode, so a long password is still wise." },
          ],
        },
      },
      (l) => [
        {
          type: "facts",
          title: l === "ru" ? "Требования Wi-Fi к паролю" : "Wi-Fi password rules",
          rows: [
            [l === "ru" ? "Длина" : "Length", l === "ru" ? "8–63 печатных символа ASCII" : "8–63 printable ASCII characters"],
            [l === "ru" ? "64 символа" : "64 characters", l === "ru" ? "воспринимаются как готовый ключ PSK в hex" : "treated as a raw hex PSK"],
            [l === "ru" ? "Кириллица" : "Non-ASCII", l === "ru" ? "не допускается стандартом" : "not allowed by the standard"],
            [l === "ru" ? "63 буквы и цифры" : "63 letters and digits", `≈ ${bitsFmt(l, 63 * Math.log2(62))} ${l === "ru" ? "бит" : "bits"}`],
          ],
        },
      ],
    ),
    simpleVariant(
      "memorable",
      { mode: "memorable" },
      {
        ru: {
          name: "Запоминающийся пароль",
          title: "Генератор запоминающихся паролей — произносимые слоги",
          h1: "Запоминающийся пароль",
          description: `Произносимый пароль из слогов вроде Tuvome-Kaletri-42: легче запомнить и продиктовать. 3 слова по 3 слога и 2 цифры ≈ ${bitsFmt("ru", memo)} бита — честно считаем энтропию.`,
          lead: "Пароль из выдуманных, но произносимых слов — компромисс между надёжностью и удобством.",
          keywords: ["запоминающийся пароль", "произносимый пароль"],
          faq: [
            { q: "Насколько он надёжен?", a: `Каждый слог — одна из 80 комбинаций согласной и гласной (≈ 6,3 бита). Три слова по три слога и две цифры дают ≈ ${bitsFmt("ru", memo)} бита — меньше, чем у случайного пароля той же длины, но достаточно для большинства аккаунтов.` },
            { q: "Чем он лучше парольной фразы?", a: "Он короче и не содержит словарных слов, но парольную фразу из настоящих слов обычно запомнить проще. Выбирайте то, что удобнее вам." },
          ],
        },
        en: {
          name: "Memorable password",
          title: "Memorable Password Generator — Pronounceable Syllables",
          h1: "Memorable password generator",
          description: `A pronounceable password like Tuvome-Kaletri-42: easier to remember and dictate. 3 words of 3 syllables plus 2 digits ≈ ${bitsFmt("en", memo)} bits — entropy stated honestly.`,
          lead: "A password of made-up but pronounceable words — a trade-off between strength and convenience.",
          keywords: ["memorable password", "pronounceable password"],
          faq: [
            { q: "How strong is it?", a: `Each syllable is one of 80 consonant-vowel pairs (≈ 6.3 bits). Three 3-syllable words plus two digits give ≈ ${bitsFmt("en", memo)} bits — less than a random password of the same length, but enough for most accounts.` },
            { q: "Is it better than a passphrase?", a: "It's shorter and has no dictionary words, but a passphrase of real words is usually easier to remember. Pick whichever suits you." },
          ],
        },
      },
    ),
    simpleVariant(
      "hex-key",
      { mode: "hex", bits: 256 },
      {
        ru: {
          name: "Ключ hex",
          title: "Генератор случайного ключа hex — 128, 256, 512 бит",
          h1: "Случайный ключ в hex",
          description: "Криптостойкий случайный ключ в шестнадцатеричном виде: 128, 192, 256 или 512 бит (32–128 символов hex). Для AES, HMAC, секретов приложений и токенов.",
          lead: "Случайные байты в hex: 256-битный ключ — это 64 шестнадцатеричных символа.",
          keywords: ["hex ключ", "256 bit key", "случайный ключ"],
          faq: [
            { q: "Какой длины ключ нужен?", a: "Для AES-256 и HMAC-SHA256 — 256 бит (64 символа hex). 128 бит тоже стойкие, но 256 дают запас на будущее." },
            { q: "Можно ли использовать ключ из браузера?", a: "Ключ генерируется через crypto.getRandomValues — криптографически стойкий генератор ОС. Для продакшен-секретов всё же удобнее генерировать их там же, где они хранятся (в менеджере секретов)." },
          ],
        },
        en: {
          name: "Hex key",
          title: "Random Hex Key Generator — 128, 256, 512 Bit",
          h1: "Random hex key generator",
          description: "A cryptographically random key in hexadecimal: 128, 192, 256 or 512 bits (32–128 hex characters). For AES, HMAC, app secrets and tokens.",
          lead: "Random bytes as hex: a 256-bit key is 64 hexadecimal characters.",
          keywords: ["hex key generator", "256 bit key", "random key"],
          faq: [
            { q: "How long should the key be?", a: "256 bits (64 hex characters) for AES-256 and HMAC-SHA256. 128 bits is also strong, but 256 leaves headroom." },
            { q: "Is a browser-generated key OK?", a: "It comes from crypto.getRandomValues, the OS's cryptographic generator. For production secrets it's still handier to generate them where they're stored (a secrets manager)." },
          ],
        },
      },
      (l) => [keyTable(l, "hex")],
    ),
    simpleVariant(
      "base64-key",
      { mode: "base64", bytes: 32 },
      {
        ru: {
          name: "Ключ base64",
          title: "Генератор ключа base64 — 256 бит для JWT и секретов",
          h1: "Случайный ключ в base64",
          description: "Случайный ключ 128–512 бит в base64 или base64url: подходит для секрета JWT HS256 (≥ 256 бит), ключей сессий и переменных окружения. Генерация в браузере.",
          lead: "32 случайных байта в base64 — 44 символа (43 в base64url без =).",
          keywords: ["base64 ключ", "jwt secret", "секретный ключ"],
          faq: [
            { q: "Какой ключ нужен для JWT HS256?", a: "Не короче 256 бит (32 байта), как требует RFC 7518 для HMAC-SHA256. Генератор по умолчанию выдаёт именно 32 байта." },
            { q: "Чем base64url отличается от base64?", a: "Вместо + и / используются - и _, а знаки = в конце убираются — такую строку можно вставлять в URL и имена файлов без экранирования." },
          ],
        },
        en: {
          name: "Base64 key",
          title: "Base64 Key Generator — 256-Bit Secret for JWT and Apps",
          h1: "Random base64 key generator",
          description: "A random 128–512-bit key in base64 or base64url: fits a JWT HS256 secret (≥ 256 bits), session keys and environment variables. Generated in your browser.",
          lead: "32 random bytes in base64 are 44 characters (43 in base64url without =).",
          keywords: ["base64 key generator", "jwt secret generator"],
          faq: [
            { q: "What key does JWT HS256 need?", a: "At least 256 bits (32 bytes), as RFC 7518 requires for HMAC-SHA256. The generator defaults to 32 bytes." },
            { q: "How does base64url differ from base64?", a: "It uses - and _ instead of + and / and drops the trailing = padding, so it's safe in URLs and file names." },
          ],
        },
      },
      (l) => [keyTable(l, "base64")],
    ),
    simpleVariant(
      "api-key",
      { mode: "apikey", length: 32 },
      {
        ru: {
          name: "API-ключ",
          title: "Генератор API-ключей — префикс и 32 символа base62",
          h1: "Генератор API-ключа",
          description: `Случайный API-ключ: свой префикс (например key_) и 32 символа из букв и цифр — ≈ ${bitsFmt("ru", 32 * Math.log2(62))} бит. Можно сгенерировать сразу 5–50 ключей.`,
          lead: "API-ключ = узнаваемый префикс + длинная случайная строка из букв и цифр.",
          keywords: ["api ключ", "генератор api key", "токен"],
          faq: [
            { q: "Зачем префикс?", a: "По префиксу ключ легко найти в логах и настроить сканеры утечек (так делают GitHub и Stripe). Энтропию он не добавляет — её даёт случайная часть." },
            { q: "Как хранить API-ключи на сервере?", a: "Храните не сами ключи, а их хеш (например, SHA-256): при утечке базы ключи нельзя будет использовать. Показывайте ключ пользователю один раз при создании." },
          ],
        },
        en: {
          name: "API key",
          title: "API Key Generator — Custom Prefix and 32 Base62 Characters",
          h1: "API key generator",
          description: `A random API key: your own prefix (e.g. key_) plus 32 letters and digits — ≈ ${bitsFmt("en", 32 * Math.log2(62))} bits. Generate 5–50 keys at once.`,
          lead: "An API key is a recognisable prefix plus a long random string of letters and digits.",
          keywords: ["api key generator", "random token"],
          faq: [
            { q: "Why a prefix?", a: "A prefix makes keys easy to spot in logs and lets leak scanners find them (GitHub and Stripe do this). It adds no entropy — the random part does." },
            { q: "How should a server store API keys?", a: "Store a hash (e.g. SHA-256), not the key itself, so a database leak doesn't expose usable keys. Show the key to the user once at creation." },
          ],
        },
      },
    ),
    simpleVariant(
      "random-string",
      { mode: "string", length: 24 },
      {
        ru: {
          name: "Случайная строка",
          title: "Генератор случайных строк — свой алфавит и длина",
          h1: "Генератор случайной строки",
          description: "Случайная строка нужной длины из любого алфавита: буквы, цифры, свои символы. Равномерный выбор без смещения, от 1 до 256 символов, сразу до 50 строк.",
          lead: "Задайте алфавит и длину — каждый символ выбирается равновероятно и независимо.",
          keywords: ["случайная строка", "генератор строки", "random string"],
          faq: [
            { q: "Что значит «без смещения»?", a: "Индекс символа выбирается методом отбраковки: случайные числа, которые дали бы перекос в пользу первых символов алфавита, отбрасываются. Поэтому все символы равновероятны." },
            { q: "Сколько бит в строке?", a: "Длина × log₂(размер алфавита): 24 символа из 62 букв и цифр — около 143 бит." },
          ],
        },
        en: {
          name: "Random string",
          title: "Random String Generator — Any Alphabet and Length",
          h1: "Random string generator",
          description: "A random string of any length from any alphabet: letters, digits, your own symbols. Unbiased selection, 1 to 256 characters, up to 50 strings at once.",
          lead: "Set the alphabet and length — every character is chosen independently and uniformly.",
          keywords: ["random string generator", "random characters"],
          faq: [
            { q: "What does “unbiased” mean?", a: "Character indices use rejection sampling: random values that would favour the first characters of the alphabet are discarded, so every character is equally likely." },
            { q: "How many bits does a string have?", a: "Length × log₂(alphabet size): 24 characters from 62 letters and digits give about 143 bits." },
          ],
        },
      },
    ),
  ];
}

export const passwordSection = defineToolSection({
  id: "password",
  name: { ru: "Пароли", en: "Passwords" },
  description: {
    ru: "Генератор надёжных паролей, парольных фраз, PIN-кодов и ключей, проверка надёжности пароля — всё в браузере, без отправки данных.",
    en: "Generate strong passwords, passphrases, PINs and keys and check password strength — all in your browser, nothing sent anywhere.",
  },
  icon: "Lock",
  hue: 120,
  category: "web",
  order: 1,
  tools: [
    {
      slug: "password-generator",
      component: "password/generator",
      icon: "KeyRound",
      popular: true,
      related: ["qr-code-generator/wifi"],
      name: { ru: "Генератор паролей", en: "Password generator" },
      title: { ru: "Генератор паролей онлайн — надёжный случайный пароль", en: "Password Generator — Strong Random Passwords Online" },
      h1: { ru: "Генератор паролей", en: "Password generator" },
      description: {
        ru: "Надёжный случайный пароль за секунду: длина 4–128, буквы, цифры, спецсимволы, без похожих символов. Энтропия в битах и время перебора. Работает в браузере.",
        en: "A strong random password in a second: 4–128 characters, letters, digits, symbols, no look-alikes. Entropy in bits and time to crack. Runs in your browser.",
      },
      lead: { ru: "Пароль уже сгенерирован — скопируйте его или настройте длину и наборы символов.", en: "Your password is ready — copy it or adjust the length and character sets." },
      props: { mode: "password" },
      keywords: { ru: ["генератор паролей", "сгенерировать пароль", "придумать пароль", "надежный пароль"], en: ["password generator", "random password", "strong password"] },
      howTo: {
        ru: [
          "Скопируйте готовый пароль кнопкой рядом с ним или нажмите «Сгенерировать заново».",
          "Выберите длину: 12–16 символов для обычных сайтов, 20+ для важных аккаунтов.",
          "Отметьте наборы символов; в «Дополнительно» можно убрать похожие символы или задать свои спецсимволы.",
          "Ориентируйтесь на энтропию и время перебора под паролем.",
          "Сохраните пароль в менеджере паролей — запоминать его не нужно.",
        ],
        en: [
          "Copy the ready password with the button next to it or click Generate again.",
          "Pick a length: 12–16 characters for everyday sites, 20+ for important accounts.",
          "Choose character sets; More options lets you drop look-alikes or set custom symbols.",
          "Use the entropy and time-to-crack estimates as a guide.",
          "Save the password in a password manager — no need to memorise it.",
        ],
      },
      faq: {
        ru: [
          { q: "Насколько случайны пароли?", a: "Используется crypto.getRandomValues — криптографически стойкий генератор операционной системы. Символы выбираются методом отбраковки, поэтому все равновероятны, без перекоса к началу алфавита." },
          { q: "Пароль где-то сохраняется?", a: "Нет. Он создаётся в вашем браузере и существует только на этой странице — сервер его не видит, а после закрытия вкладки он исчезает." },
          { q: "Как считается энтропия?", a: "Как log₂ от числа возможных паролей с выбранными настройками. Если включено «хотя бы один символ из каждого набора», учитывается, что пароли без какого-то набора не выдаются, — значение получается точным." },
          { q: "Какой длины нужен пароль?", a: "Для обычных сайтов — не меньше 12–14 случайных символов, для почты, банков и мастер-паролей — 16–20 и больше. Главное — уникальный пароль для каждого сайта." },
        ],
        en: [
          { q: "How random are the passwords?", a: "They use crypto.getRandomValues, the OS's cryptographically secure generator. Characters are chosen by rejection sampling, so all are equally likely with no bias toward the start of the alphabet." },
          { q: "Is the password stored anywhere?", a: "No. It's created in your browser and exists only on this page — the server never sees it, and it's gone when you close the tab." },
          { q: "How is entropy computed?", a: "As log₂ of the number of possible passwords with your settings. With “at least one of every set” enabled, passwords missing a set are excluded, so the value is exact." },
          { q: "How long should a password be?", a: "At least 12–14 random characters for everyday sites, 16–20+ for email, banking and master passwords. Above all, use a unique password per site." },
        ],
      },
      about: {
        ru: [
          "Надёжность пароля определяется не «сложностью на вид», а числом вариантов, которые придётся перебрать. Генератор показывает это число в битах энтропии и переводит его во время перебора для четырёх сценариев атаки — от онлайн-подбора с блокировкой до утечки базы с быстрым хешем.",
          "Кроме обычных паролей, здесь есть PIN-коды, парольные фразы из русских и английских слов, пароли для Wi-Fi и ключи для разработчиков — у каждого варианта своя страница с настройками по умолчанию.",
        ],
        en: [
          "Password strength isn't about looking complex but about how many possibilities an attacker must try. The generator shows that number as bits of entropy and converts it into time to crack for four attack scenarios — from rate-limited online guessing to a leaked fast-hash database.",
          "Besides regular passwords there are PINs, passphrases from English and Russian words, Wi-Fi passwords and developer keys — each variant has its own page with suitable defaults.",
        ],
      },
      variants: { title: { ru: "Виды паролей и ключей", en: "Password and key types" }, list: variants },
    },
    {
      slug: "password-strength-checker",
      component: "password/strength",
      icon: "ShieldCheck",
      popular: true,
      name: { ru: "Проверка надёжности пароля", en: "Password strength checker" },
      title: { ru: "Проверка надёжности пароля онлайн — оценка и советы", en: "Password Strength Checker — Rating and Tips" },
      h1: { ru: "Проверка надёжности пароля", en: "Password strength checker" },
      description: {
        ru: "Оценка пароля по словарям утёкших паролей, слов и имён (zxcvbn): балл от 0 до 4, время подбора и советы. Проверка в браузере, пароль не отправляется.",
        en: "Rate a password against lists of leaked passwords, words and names (zxcvbn): a 0–4 score, time to crack and tips. Checked in your browser; nothing is sent.",
      },
      lead: { ru: "Введите пароль — узнаете, насколько его легко подобрать и что улучшить.", en: "Type a password to see how easily it could be guessed and what to improve." },
      keywords: { ru: ["проверка пароля", "надежность пароля", "проверить пароль"], en: ["password strength checker", "how strong is my password"] },
      howTo: {
        ru: ["Введите пароль в поле — по умолчанию он скрыт звёздочками.", "Смотрите оценку от «очень слабого» до «очень надёжного».", "Прочитайте, почему пароль слабый: словарное слово, повторы, узор на клавиатуре.", "Оцените время подбора для разных атак."],
        en: ["Type the password — it's masked by default.", "Read the rating from very weak to very strong.", "See why a password is weak: a dictionary word, repeats, a keyboard pattern.", "Check the time to crack for different attacks."],
      },
      faq: {
        ru: [
          { q: "Почему «passwordpasswordpassword» — слабый, хотя длинный?", a: "Оценщик видит повтор словарного слова «password» и считает, сколько попыток нужно атакующему, который это знает: всего несколько сотен. Длина сама по себе не делает пароль надёжным." },
          { q: "Безопасно ли вводить сюда настоящий пароль?", a: "Проверка идёт в вашем браузере, сетевых запросов нет, пароль не сохраняется. Но хорошая привычка — проверять похожий пароль, а не тот, которым вы реально пользуетесь." },
          { q: "Как работает оценка?", a: "Используется zxcvbn-ts: он ищет в пароле слова из словарей популярных паролей и имён, даты, последовательности, повторы и узоры на клавиатуре и оценивает число попыток для самого выгодного атакующему разбора." },
          { q: "Учитываются ли русские пароли?", a: "Да, добавлен словарь популярных у русскоязычных пользователей паролей — «йцукен», «пароль», qwerty123, parol и другие." },
        ],
        en: [
          { q: "Why is “passwordpasswordpassword” weak despite its length?", a: "The estimator sees the dictionary word “password” repeated and counts the guesses an attacker who knows this needs: only a few hundred. Length alone doesn't make a password strong." },
          { q: "Is it safe to type a real password here?", a: "The check runs in your browser with no network requests and nothing is stored. Still, a good habit is to test a similar password rather than the one you actually use." },
          { q: "How does the rating work?", a: "It uses zxcvbn-ts, which finds dictionary words, names, dates, sequences, repeats and keyboard patterns and estimates the guesses needed for the attacker's best decomposition." },
          { q: "Are Russian passwords covered?", a: "Yes, a list of passwords popular with Russian speakers is added — йцукен, пароль, qwerty123, parol and more." },
        ],
      },
      about: {
        ru: ["Простые правила вроде «8 символов, цифра и заглавная буква» пропускают пароли типа Password1, которые подбираются мгновенно. Оценщик zxcvbn смотрит на пароль глазами атакующего: ищет известные пароли, слова, имена, даты и узоры и считает реальное число попыток.", "Если пароль получился слабым, воспользуйтесь генератором: случайный пароль или парольная фраза из 5–6 слов надёжнее любого придуманного вручную."],
        en: ["Simple rules like “8 characters, a digit and a capital” pass passwords like Password1 that fall instantly. The zxcvbn estimator looks at a password the way an attacker does: it finds known passwords, words, names, dates and patterns and counts the real number of guesses.", "If your password turns out weak, use the generator: a random password or a 5–6 word passphrase beats anything made up by hand."],
      },
    },
  ],
});
