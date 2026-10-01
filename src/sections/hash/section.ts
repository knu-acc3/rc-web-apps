import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import type { Block, QA, ToolDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { registerTools, withRelated } from "@/sections/code/kit/related";
import { ALGOS, HMACS, type AlgoDef, type KdfId } from "./lib/algorithms";
import { ABOUT, COMMANDS } from "./content/content";
import VECTORS from "./data/vectors.json";

const HUE = 280;
const DIGESTS = VECTORS.digests as Record<string, string[]>;

const algoSlug = (a: AlgoDef) => (a.family === "crc" ? `${a.id}-calculator` : `${a.id}-hash-generator`);
const b64len = (bits: number) => Math.ceil(bits / 8 / 3) * 4;

const STATUS: Record<AlgoDef["status"], { ru: string; en: string }> = {
  broken: { ru: "взломан: известны практические коллизии", en: "broken: practical collisions are known" },
  legacy: { ru: "устаревший, для новых систем не рекомендуется", en: "legacy, not recommended for new systems" },
  secure: { ru: "криптостойкий, практических атак нет", en: "secure, no practical attacks" },
  checksum: { ru: "некриптографическая контрольная сумма", en: "non-cryptographic checksum" },
};

const HOWTO = {
  ru: [
    "Введите или вставьте текст — хэш пересчитывается при каждом изменении.",
    "Для файлов переключитесь на «Файлы» и перетащите один или несколько файлов: они читаются частями и никуда не загружаются.",
    "Выберите формат результата: hex, HEX, Base64 или Base64url.",
    "Чтобы проверить загрузку, вставьте ожидаемый хэш в поле «Сверить с» — совпадение подсветится зелёным.",
  ],
  en: [
    "Type or paste text — the hash is recalculated on every change.",
    "For files switch to Files and drop one or more: they are read in chunks and never uploaded.",
    "Pick the output format: hex, HEX, Base64 or Base64url.",
    "To verify a download, paste the expected hash into Compare with — a match turns green.",
  ],
};

function vectorsBlock(a: AlgoDef, locale: Locale, keyNote?: string): Block {
  const inputs = VECTORS.inputs.map((s) => (s === "" ? (locale === "ru" ? "(пустая строка)" : "(empty string)") : `"${s}"`));
  return {
    type: "table",
    title: locale === "ru" ? `Контрольные значения ${a.name}` : `${a.name} test vectors`,
    head: [locale === "ru" ? "Вход (UTF-8)" : "Input (UTF-8)", a.name],
    rows: inputs.map((inp, i) => [inp, DIGESTS[a.id][i]]),
    mono: true,
    caption: keyNote,
  };
}

function algoFaq(a: AlgoDef, locale: Locale): QA[] {
  const hex = a.bits / 4;
  const len =
    locale === "ru"
      ? `${a.name} всегда даёт ${a.bits} бит: ${hex} шестнадцатеричных символов или ${b64len(a.bits)} символов в Base64 — независимо от размера входных данных.`
      : `${a.name} always produces ${a.bits} bits: ${hex} hex characters or ${b64len(a.bits)} Base64 characters, whatever the input size.`;
  const safety: Record<AlgoDef["status"], { ru: string; en: string }> = {
    broken: {
      ru: `Для защиты — нет: для ${a.name} известны практические коллизии, поэтому его нельзя использовать для подписей, сертификатов и паролей. Для проверки целостности файлов от случайных повреждений он по-прежнему годится.`,
      en: `Not for security: practical ${a.name} collisions are known, so never use it for signatures, certificates or passwords. It is still fine for detecting accidental file corruption.`,
    },
    legacy: {
      ru: `${a.name} не взломан на практике, но его 160 бит считаются недостаточными для новых систем. Выбирайте SHA-256, SHA-3 или BLAKE3.`,
      en: `${a.name} isn't practically broken, but 160 bits are considered too short for new systems. Choose SHA-256, SHA-3 or BLAKE3.`,
    },
    secure: {
      ru: `Да, практических атак на ${a.name} нет. Но для хранения паролей обычный хэш не подходит — он слишком быстрый; используйте bcrypt, Argon2id или scrypt.`,
      en: `Yes, there are no practical attacks on ${a.name}. But plain hashes are too fast for storing passwords — use bcrypt, Argon2id or scrypt.`,
    },
    checksum: {
      ru: `${a.name} — не криптографический хэш: он ловит случайные ошибки, но злоумышленник легко подберёт данные с нужным значением. Для защиты от подмены используйте SHA-256.`,
      en: `${a.name} isn't a cryptographic hash: it catches accidental errors, but an attacker can easily craft data with any value. Use SHA-256 to protect against tampering.`,
    },
  };
  return locale === "ru"
    ? [
        { q: `Какой длины хэш ${a.name}?`, a: len },
        { q: `Безопасен ли ${a.name}?`, a: safety[a.status].ru },
        { q: `Можно ли расшифровать ${a.name}?`, a: `Нет: хэш — это отпечаток, а не шифр, исходные данные из него не восстановить. Короткие и популярные строки иногда находят перебором по словарям, поэтому хэш пароля без соли ничего не скрывает.` },
        { q: "Почему в другой программе получается другой хэш?", a: "Обычно из-за невидимых символов: команда echo добавляет перевод строки (используйте echo -n или printf), а Windows может сохранить текст с \\r\\n или в другой кодировке. Здесь текст хэшируется в UTF-8 ровно в том виде, в каком он введён." },
      ]
    : [
        { q: `How long is a ${a.name} hash?`, a: len },
        { q: `Is ${a.name} secure?`, a: safety[a.status].en },
        { q: `Can ${a.name} be decrypted?`, a: "No: a hash is a fingerprint, not a cipher, so the input can't be recovered from it. Short, common strings are sometimes found by dictionary attacks, which is why an unsalted password hash hides nothing." },
        { q: "Why does another program give a different hash?", a: "Usually invisible characters: echo appends a newline (use echo -n or printf), and Windows may save text with \\r\\n or a different encoding. Here text is hashed as UTF-8 exactly as typed." },
      ];
}

function algoTool(a: AlgoDef): ToolDef {
  const hex = a.bits / 4;
  const isCrc = a.family === "crc";
  const st = STATUS[a.status];
  const cmds = COMMANDS[a.id];
  const ru = {
    h1: isCrc ? `Калькулятор ${a.name}` : `${a.name} хэш онлайн`,
    title: isCrc ? `${a.name} онлайн — калькулятор контрольной суммы` : `${a.name} хэш онлайн — генератор ${a.name}`,
  };
  const en = {
    h1: isCrc ? `${a.name} calculator` : `${a.name} hash generator`,
    title: isCrc ? `${a.name} calculator online — checksum of text and files` : `${a.name} hash generator online`,
  };
  return {
    slug: algoSlug(a),
    component: "hash/tool",
    icon: isCrc ? "ShieldCheck" : "Fingerprint",
    popular: a.popular,
    props: { algo: a.id },
    wide: false,
    name: { ru: a.name, en: a.name },
    h1: { ru: ru.h1, en: en.h1 },
    title: { ru: ru.title, en: en.title },
    description: {
      ru: `${isCrc ? "Контрольная сумма" : "Хэш"} ${a.name} онлайн для текста и файлов любого размера: ${a.bits} бит, ${hex} hex-символов. ${a.standard}, ${a.year}. Сверка с ожидаемым значением.`,
      en: `${a.name} ${isCrc ? "checksum" : "hash"} of text and files of any size: ${a.bits} bits, ${hex} hex characters. ${a.standard}, ${a.year}. Compare with an expected value.`,
    },
    lead: {
      ru: `${a.name} — ${a.bits}-битн${isCrc ? "ая контрольная сумма" : "ый хэш"} (${hex} hex-символов); считается сразу, по мере ввода.`,
      en: `${a.name} gives a ${a.bits}-bit ${isCrc ? "checksum" : "digest"} (${hex} hex characters), computed as you type.`,
    },
    keywords: {
      ru: [a.name.toLowerCase(), `${a.id} онлайн`, `хэш ${a.name}`, `${a.id} генератор`, `${a.id} файла`],
      en: [a.name.toLowerCase(), `${a.id} online`, `${a.id} hash`, `${a.id} generator`, `${a.id} checksum`],
    },
    howTo: HOWTO,
    faq: { ru: algoFaq(a, "ru"), en: algoFaq(a, "en") },
    about: {
      ru: [ABOUT[a.id].ru, "Хэш считается в вашем браузере библиотеками hash-wasm и @noble/hashes — без crypto.subtle, поэтому работает и по обычному http. Файлы читаются частями по 8 МБ, так что память не переполняется даже на образах дисков."],
      en: [ABOUT[a.id].en, "Hashing runs in your browser with hash-wasm and @noble/hashes — no crypto.subtle, so it works over plain http too. Files are read in 8 MB chunks, so even disk images don't exhaust memory."],
    },
    blocks: (locale) => {
      const blocks: Block[] = [
        {
          type: "facts",
          title: locale === "ru" ? `${a.name} коротко` : `${a.name} at a glance`,
          rows: [
            [locale === "ru" ? "Длина" : "Length", locale === "ru" ? `${a.bits} бит · ${hex} hex · ${b64len(a.bits)} Base64` : `${a.bits} bits · ${hex} hex · ${b64len(a.bits)} Base64`],
            ...(a.block ? [[locale === "ru" ? "Размер блока" : "Block size", locale === "ru" ? `${a.block} бит` : `${a.block} bits`] as [string, string]] : []),
            [locale === "ru" ? "Стандарт" : "Standard", `${a.standard}, ${a.year}`],
            [locale === "ru" ? "Статус" : "Status", st[locale]],
          ],
        },
        vectorsBlock(a, locale),
      ];
      if (cmds) blocks.push({ type: "list", title: locale === "ru" ? `${a.name} в командной строке` : `${a.name} from the command line`, items: cmds });
      return blocks;
    },
  };
}

function hmacTool(h: (typeof HMACS)[number]): ToolDef {
  const a = ALGOS.find((x) => x.id === h.algo)!;
  const hex = a.bits / 4;
  return {
    slug: `${h.id}-generator`,
    component: "hash/tool",
    icon: "KeySquare",
    popular: h.id === "hmac-sha256",
    props: { algo: h.algo, hmac: true, sample: "message" },
    name: { ru: h.name, en: h.name },
    h1: { ru: `${h.name} онлайн`, en: `${h.name} generator` },
    title: { ru: `${h.name} онлайн — генератор подписи HMAC`, en: `${h.name} generator online — HMAC signature` },
    description: {
      ru: `${h.name} онлайн: подпись сообщения секретным ключом (${h.standard}), ${a.bits} бит = ${hex} hex-символов. Ключ и текст в UTF-8, hex или Base64.`,
      en: `${h.name} online: sign a message with a secret key (${h.standard}), ${a.bits} bits = ${hex} hex characters. Key and message as UTF-8, hex or Base64.`,
    },
    lead: {
      ru: `${h.name} = ${a.name} от ключа и сообщения по схеме HMAC; без ключа подпись не повторить.`,
      en: `${h.name} is ${a.name} of the key and message in the HMAC construction; it can't be reproduced without the key.`,
    },
    keywords: { ru: [h.name.toLowerCase(), "hmac онлайн", "подпись hmac", "hmac генератор"], en: [h.name.toLowerCase(), "hmac online", "hmac generator", "hmac signature"] },
    howTo: {
      ru: ["Введите секретный ключ и выберите его кодировку: текст, hex или Base64.", "Введите сообщение — подпись появится сразу.", "Сравните результат с подписью из заголовка запроса, вставив её в поле «Сверить с».", "Для файлов переключитесь на «Файлы»: они подписываются тем же ключом."],
      en: ["Enter the secret key and choose its encoding: text, hex or Base64.", "Type the message — the signature appears instantly.", "Compare with the signature from a request header by pasting it into Compare with.", "For files switch to Files: they are signed with the same key."],
    },
    faq: {
      ru: [
        { q: "Чем HMAC отличается от обычного хэша?", a: `Обычный ${a.name} может посчитать любой, а HMAC зависит от секретного ключа: только владелец ключа может создать правильную подпись. Поэтому HMAC защищает от подмены сообщения.` },
        { q: "Где используется HMAC?", a: "Для подписи вебхуков (GitHub, Stripe, Telegram передают подпись HMAC-SHA256 в заголовке), JWT с алгоритмами HS256/HS512, подписи запросов AWS (SigV4) и одноразовых кодов TOTP (HMAC-SHA1)." },
        { q: "Какой длины должен быть ключ?", a: `Не короче длины результата — ${a.bits / 8} байт для ${h.name}. Ключ длиннее блока хэш-функции сначала хэшируется, поэтому очень длинный ключ стойкости не добавляет.` },
      ],
      en: [
        { q: "How is HMAC different from a plain hash?", a: `Anyone can compute a plain ${a.name}, but HMAC depends on a secret key: only the key holder can produce a valid signature. That's why HMAC protects messages from tampering.` },
        { q: "Where is HMAC used?", a: "Signing webhooks (GitHub, Stripe and Telegram send an HMAC-SHA256 signature in a header), JWTs with HS256/HS512, AWS request signing (SigV4) and TOTP one-time codes (HMAC-SHA1)." },
        { q: "How long should the key be?", a: `At least the output length — ${a.bits / 8} bytes for ${h.name}. Keys longer than the hash block are hashed first, so a very long key adds no strength.` },
      ],
    },
    about: {
      ru: [`HMAC (RFC 2104) вычисляет хэш дважды: ${a.name}((K ⊕ opad) ‖ ${a.name}((K ⊕ ipad) ‖ сообщение)). Такая схема устойчива к атаке удлинения сообщения, которой подвержен наивный вариант ${a.name}(ключ ‖ сообщение).`, "Ключ и сообщение не покидают браузер — страница не делает сетевых запросов."],
      en: [`HMAC (RFC 2104) hashes twice: ${a.name}((K ⊕ opad) ‖ ${a.name}((K ⊕ ipad) ‖ message)). This resists the length-extension attack that the naive ${a.name}(key ‖ message) is vulnerable to.`, "The key and message never leave your browser — the page makes no network requests."],
    },
  };
}

const KDF: Record<KdfId, { name: string; ru: { title: string; h1: string; desc: string; lead: string; about: string[]; faq: QA[] }; en: { title: string; h1: string; desc: string; lead: string; about: string[]; faq: QA[] } }> = {
  bcrypt: {
    name: "bcrypt",
    ru: {
      title: "Bcrypt генератор онлайн — хэш и проверка пароля",
      h1: "Bcrypt генератор и проверка",
      desc: "Bcrypt онлайн: хэш пароля с солью и cost от 4 до 15 в формате $2b$ и проверка пароля по готовому хэшу $2a$/$2b$/$2y$. Всё считается в браузере.",
      lead: "Создайте bcrypt-хэш пароля ($2b$, cost 10 по умолчанию) или проверьте, подходит ли пароль к хэшу.",
      about: [
        "Bcrypt (1999) — медленная функция хэширования паролей на основе шифра Blowfish. Параметр cost задаёт 2^cost раундов: каждый +1 удваивает время. Формат $2b$10$ + 22 символа соли + 31 символ хэша хранит всё нужное для проверки.",
        "Bcrypt использует только первые 72 байта пароля — длинные парольные фразы обрезаются. Его выдают password_hash() в PHP, Spring Security, Devise и bcrypt для Node.js.",
      ],
      faq: [
        { q: "Какой cost выбрать?", a: "Столько, чтобы хэширование на сервере занимало около 100–250 мс. Сегодня это обычно 10–12. Время на этой странице покажет, сколько занимает выбранный cost в вашем браузере." },
        { q: "Чем $2a$, $2b$ и $2y$ отличаются?", a: "Это одна и та же функция; $2b$ исправляет ошибку обработки паролей длиннее 255 байт в старых реализациях, $2y$ — метка PHP для исправленной версии. Проверка здесь принимает все три." },
        { q: "Почему хэш одного пароля каждый раз разный?", a: "Каждый раз генерируется новая случайная соль из 16 байт. Она записана в самом хэше, поэтому проверка всё равно работает." },
      ],
    },
    en: {
      title: "Bcrypt generator online — hash and verify passwords",
      h1: "Bcrypt generator and checker",
      desc: "Bcrypt online: hash a password with a random salt and cost 4 to 15 in $2b$ format, and verify a password against a $2a$/$2b$/$2y$ hash. Runs in your browser.",
      lead: "Create a bcrypt password hash ($2b$, cost 10 by default) or check whether a password matches a hash.",
      about: [
        "Bcrypt (1999) is a slow password-hashing function built on the Blowfish cipher. The cost parameter sets 2^cost rounds: each +1 doubles the time. The format $2b$10$ + 22 salt characters + 31 hash characters stores everything needed to verify.",
        "Bcrypt only uses the first 72 bytes of a password — longer passphrases are truncated. It is what PHP password_hash(), Spring Security, Devise and bcrypt for Node.js produce.",
      ],
      faq: [
        { q: "Which cost should I use?", a: "Enough for hashing to take about 100–250 ms on your server — typically 10–12 today. The timing on this page shows how long the chosen cost takes in your browser." },
        { q: "What's the difference between $2a$, $2b$ and $2y$?", a: "They're the same function; $2b$ fixes a bug with passwords over 255 bytes in old implementations and $2y$ is PHP's tag for the fixed version. Verification here accepts all three." },
        { q: "Why is the hash different every time?", a: "A fresh random 16-byte salt is generated each time. It is stored inside the hash, so verification still works." },
      ],
    },
  },
  argon2: {
    name: "Argon2id",
    ru: {
      title: "Argon2 генератор онлайн — Argon2id хэш пароля",
      h1: "Argon2id хэш онлайн",
      desc: "Argon2id онлайн: хэш пароля в формате PHC ($argon2id$v=19$m=19456,t=2,p=1$…) с настройкой памяти, итераций и потоков, плюс проверка пароля по хэшу.",
      lead: "Argon2id — рекомендуемая OWASP функция для паролей: создайте PHC-строку или проверьте пароль по ней.",
      about: [
        "Argon2 победил в конкурсе Password Hashing Competition (2015), стандарт — RFC 9106. Вариант Argon2id сочетает защиту от атак по сторонним каналам и от перебора на видеокартах: каждая попытка требует заданный объём памяти.",
        "По умолчанию здесь стоят параметры из рекомендаций OWASP: 19 МиБ памяти, 2 итерации, 1 поток. Строка PHC хранит алгоритм, версию, параметры, соль и хэш.",
      ],
      faq: [
        { q: "Какие параметры Argon2id выбрать?", a: "OWASP рекомендует минимум m=19 МиБ, t=2, p=1 или m=46 МиБ, t=1, p=1. RFC 9106 предлагает 2 ГиБ памяти для серверов с запасом ресурсов. Главное — чтобы проверка занимала десятки–сотни миллисекунд." },
        { q: "Чем Argon2id лучше bcrypt?", a: "Argon2id требует много памяти, поэтому перебор на GPU и ASIC обходится дороже, и у него нет ограничения bcrypt в 72 байта. Для новых проектов OWASP советует Argon2id." },
        { q: "Как проверить пароль по хэшу Argon2?", a: "Переключитесь на «Проверить пароль», вставьте строку $argon2id$… и пароль. Все параметры берутся из самой строки." },
      ],
    },
    en: {
      title: "Argon2 hash generator online — Argon2id password hash",
      h1: "Argon2id hash generator",
      desc: "Argon2id online: hash a password as a PHC string ($argon2id$v=19$m=19456,t=2,p=1$…) with memory, iterations and lanes, and verify passwords against it.",
      lead: "Argon2id is OWASP's recommended password hash: create a PHC string or verify a password against one.",
      about: [
        "Argon2 won the Password Hashing Competition (2015) and is standardized in RFC 9106. Argon2id combines resistance to side-channel attacks and to GPU cracking: every guess needs the configured amount of memory.",
        "Defaults follow OWASP guidance: 19 MiB of memory, 2 iterations, 1 lane. The PHC string stores the algorithm, version, parameters, salt and hash.",
      ],
      faq: [
        { q: "Which Argon2id parameters should I use?", a: "OWASP recommends at least m=19 MiB, t=2, p=1 or m=46 MiB, t=1, p=1. RFC 9106 suggests 2 GiB of memory on servers that can afford it. Aim for tens to hundreds of milliseconds per check." },
        { q: "Why is Argon2id better than bcrypt?", a: "Argon2id is memory-hard, so GPU and ASIC cracking costs more, and it has no 72-byte password limit. OWASP recommends it for new projects." },
        { q: "How do I verify a password against an Argon2 hash?", a: "Switch to Verify password, paste the $argon2id$… string and the password. All parameters are read from the string itself." },
      ],
    },
  },
  scrypt: {
    name: "scrypt",
    ru: {
      title: "Scrypt генератор онлайн — хэш пароля scrypt",
      h1: "Scrypt хэш онлайн",
      desc: "Scrypt онлайн (RFC 7914): хэш пароля с параметрами N, r, p и случайной солью в формате $scrypt$ln=17,r=8,p=1$…, а также проверка пароля по такой строке.",
      lead: "Scrypt требует N × r × 128 байт памяти на каждую попытку: создайте хэш или проверьте пароль.",
      about: [
        "Scrypt придумал Колин Персиваль в 2009 году для Tarsnap, стандарт — RFC 7914. Параметр N (здесь задаётся как степень двойки) определяет объём памяти и время, r — размер блока, p — параллелизм. При N = 2^17 и r = 8 нужно 128 МиБ памяти.",
        "Результат записывается строкой $scrypt$ln=…,r=…,p=…$соль$хэш (соль и хэш в Base64 без дополнения) — по ней пароль можно проверить на этой же странице.",
      ],
      faq: [
        { q: "Какие параметры scrypt безопасны?", a: "OWASP рекомендует минимум N = 2^17, r = 8, p = 1 (128 МиБ памяти). Меньшие значения подойдут только для экспериментов." },
        { q: "Где используется scrypt?", a: "В Tarsnap, криптовалюте Litecoin (как proof-of-work), в Node.js (crypto.scrypt), Django (ScryptPasswordHasher) и для получения ключей шифрования из паролей." },
        { q: "Почему хэширование занимает время?", a: "Так задумано: медленная функция делает перебор паролей дорогим. При ln = 17 каждая проверка требует 128 МиБ памяти и заметного времени." },
      ],
    },
    en: {
      title: "Scrypt hash generator online — scrypt password hash",
      h1: "Scrypt hash generator",
      desc: "Scrypt online (RFC 7914): hash a password with N, r, p parameters and a random salt as $scrypt$ln=17,r=8,p=1$…, and verify passwords against such a string.",
      lead: "Scrypt needs N × r × 128 bytes of memory per guess: create a hash or verify a password.",
      about: [
        "Scrypt was designed by Colin Percival in 2009 for Tarsnap and standardized in RFC 7914. N (set here as a power of two) controls memory and time, r the block size, p parallelism. With N = 2^17 and r = 8 each hash needs 128 MiB of memory.",
        "The result is written as $scrypt$ln=…,r=…,p=…$salt$hash (salt and hash in unpadded Base64) and can be verified on this page.",
      ],
      faq: [
        { q: "Which scrypt parameters are safe?", a: "OWASP recommends at least N = 2^17, r = 8, p = 1 (128 MiB of memory). Smaller values are only for experiments." },
        { q: "Where is scrypt used?", a: "In Tarsnap, Litecoin (as proof-of-work), Node.js (crypto.scrypt), Django (ScryptPasswordHasher) and for deriving encryption keys from passwords." },
        { q: "Why does hashing take time?", a: "By design: a slow function makes password guessing expensive. With ln = 17 each check needs 128 MiB of memory and noticeable time." },
      ],
    },
  },
  pbkdf2: {
    name: "PBKDF2",
    ru: {
      title: "PBKDF2 генератор онлайн — хэш пароля PBKDF2-SHA256",
      h1: "PBKDF2 хэш онлайн",
      desc: "PBKDF2 онлайн (RFC 8018): HMAC-SHA256, SHA-512 или SHA-1, 600 000 итераций по умолчанию, случайная соль. Хэш пароля в формате PHC и проверка пароля.",
      lead: "PBKDF2 повторяет HMAC тысячи раз: создайте хэш пароля (600 000 итераций SHA-256) или проверьте пароль.",
      about: [
        "PBKDF2 (RFC 8018, ранее PKCS #5) многократно применяет HMAC к паролю и соли. Он не требует много памяти, поэтому хуже Argon2 и scrypt защищает от перебора на видеокартах, но разрешён стандартами FIPS 140 и встроен почти во все платформы.",
        "Результат записывается строкой $pbkdf2-sha256$i=…,l=…$соль$хэш. PBKDF2 используют Django (по умолчанию), WPA2 для ключа Wi-Fi, менеджеры паролей и шифрование архивов.",
      ],
      faq: [
        { q: "Сколько итераций PBKDF2 нужно?", a: "OWASP рекомендует 600 000 итераций для PBKDF2-HMAC-SHA256, 210 000 для SHA-512 и 1 300 000 для SHA-1." },
        { q: "PBKDF2 или bcrypt?", a: "Если нет требований FIPS, для паролей лучше Argon2id или bcrypt. PBKDF2 выбирают, когда нужен сертифицированный алгоритм или ключ шифрования из пароля." },
        { q: "Можно ли получить ключ шифрования через PBKDF2?", a: "Да, это его основное назначение: ключ заданной длины из пароля и соли. Здесь длина результата — 32 байта (256 бит), как для ключа AES-256." },
      ],
    },
    en: {
      title: "PBKDF2 hash generator online — PBKDF2-SHA256 password hash",
      h1: "PBKDF2 hash generator",
      desc: "PBKDF2 online (RFC 8018): HMAC-SHA256, SHA-512 or SHA-1, 600,000 iterations by default and a random salt. Password hash as a PHC string plus verification.",
      lead: "PBKDF2 repeats HMAC thousands of times: create a password hash (600,000 SHA-256 iterations) or verify a password.",
      about: [
        "PBKDF2 (RFC 8018, formerly PKCS #5) applies HMAC to the password and salt many times. It needs little memory, so it resists GPU cracking worse than Argon2 or scrypt, but it is FIPS 140 approved and built into almost every platform.",
        "The result is written as $pbkdf2-sha256$i=…,l=…$salt$hash. PBKDF2 is used by Django (by default), WPA2 Wi-Fi keys, password managers and archive encryption.",
      ],
      faq: [
        { q: "How many PBKDF2 iterations do I need?", a: "OWASP recommends 600,000 iterations for PBKDF2-HMAC-SHA256, 210,000 for SHA-512 and 1,300,000 for SHA-1." },
        { q: "PBKDF2 or bcrypt?", a: "Without FIPS requirements, Argon2id or bcrypt is better for passwords. PBKDF2 is chosen when a certified algorithm or an encryption key from a password is needed." },
        { q: "Can PBKDF2 derive an encryption key?", a: "Yes, that's its main purpose: a key of a given length from a password and salt. Here the output is 32 bytes (256 bits), the size of an AES-256 key." },
      ],
    },
  },
};

function kdfTool(kind: KdfId): ToolDef {
  const k = KDF[kind];
  return {
    slug: `${kind}-generator`,
    component: "hash/password",
    icon: "LockKeyhole",
    popular: kind === "bcrypt",
    props: { kind },
    name: { ru: k.name, en: k.name },
    h1: { ru: k.ru.h1, en: k.en.h1 },
    title: { ru: k.ru.title, en: k.en.title },
    description: { ru: k.ru.desc, en: k.en.desc },
    lead: { ru: k.ru.lead, en: k.en.lead },
    keywords: { ru: [k.name.toLowerCase(), `${kind} онлайн`, `${kind} хэш`, "хэш пароля"], en: [k.name.toLowerCase(), `${kind} online`, `${kind} hash`, "password hash"] },
    howTo: {
      ru: ["Введите пароль и при необходимости измените параметры в строке под кнопкой.", "Нажмите «Создать хэш» — вычисление идёт в фоновом потоке, страница не зависает.", "Скопируйте хэш. Чтобы проверить пароль, переключитесь на «Проверить пароль» и вставьте готовый хэш."],
      en: ["Enter a password and adjust the parameters below the button if needed.", "Click Create hash — it runs in a background thread, so the page stays responsive.", "Copy the hash. To check a password, switch to Verify password and paste an existing hash."],
    },
    faq: { ru: k.ru.faq, en: k.en.faq },
    about: { ru: k.ru.about, en: k.en.about },
  };
}

const multiTool: ToolDef = {
  slug: "hash-generator",
  component: "hash/multi",
  icon: "Hash",
  popular: true,
  props: { sample: "" },
  name: { ru: "Хэш-генератор", en: "Hash generator" },
  h1: { ru: "Хэш-генератор онлайн", en: "Hash generator" },
  title: { ru: "Хэш-генератор онлайн — MD5, SHA-256, SHA-3 и ещё 19", en: "Hash generator online — MD5, SHA-256, SHA-3 and 19 more" },
  description: {
    ru: "Хэш-генератор онлайн: 22 алгоритма сразу — MD5, SHA-1, SHA-256, SHA-512, SHA-3, Keccak-256, BLAKE2, BLAKE3, RIPEMD-160, CRC32, xxHash. Hex и Base64.",
    en: "Online hash generator: 22 algorithms at once — MD5, SHA-1, SHA-256, SHA-512, SHA-3, Keccak-256, BLAKE2, BLAKE3, RIPEMD-160, CRC32, xxHash. Hex or Base64.",
  },
  lead: { ru: "Введите текст — хэши всех 22 алгоритмов появятся сразу; нажмите на любой, чтобы скопировать.", en: "Type text and see digests from all 22 algorithms at once; click any to copy it." },
  keywords: { ru: ["хэш онлайн", "хэш генератор", "вычислить хэш", "hash"], en: ["hash generator", "online hash", "hash calculator", "checksum"] },
  howTo: {
    ru: ["Введите или вставьте текст.", "Если данные в hex или Base64, выберите это в поле «Ввод».", "Нажмите на нужный хэш в списке — он скопируется."],
    en: ["Type or paste text.", "If the data is hex or Base64, choose it in the Input field.", "Click the hash you need — it is copied."],
  },
  faq: {
    ru: [
      { q: "Какой алгоритм выбрать?", a: "Для контрольных сумм и подписей — SHA-256 (или BLAKE3, если важна скорость). MD5 и SHA-1 годятся только для совместимости со старыми системами. Для паролей нужны bcrypt или Argon2id." },
      { q: "Почему хэши у всех алгоритмов разной длины?", a: "Длина результата — свойство алгоритма: от 32 бит у CRC32 до 512 бит у SHA-512. Чем длиннее криптографический хэш, тем меньше шанс совпадения." },
      { q: "Можно ли посчитать хэш файла?", a: "Да — откройте страницу нужного алгоритма и переключитесь на «Файлы». Файлы читаются частями, поэтому подойдут и гигабайтные образы." },
    ],
    en: [
      { q: "Which algorithm should I use?", a: "For checksums and signatures, SHA-256 (or BLAKE3 when speed matters). MD5 and SHA-1 are only for compatibility with old systems. Passwords need bcrypt or Argon2id." },
      { q: "Why are the digests different lengths?", a: "Output length is a property of each algorithm: from 32 bits for CRC32 to 512 bits for SHA-512. Longer cryptographic hashes have lower collision chances." },
      { q: "Can I hash a file?", a: "Yes — open the page of the algorithm you need and switch to Files. Files are read in chunks, so multi-gigabyte images work." },
    ],
  },
  about: {
    ru: ["Хэш-функция превращает данные любого размера в строку фиксированной длины; малейшее изменение входа полностью меняет результат. Здесь можно сравнить 22 алгоритма — от криптографических SHA-2, SHA-3 и BLAKE3 до быстрых контрольных сумм CRC32 и xxHash.", "Все вычисления идут в браузере, без сетевых запросов и без crypto.subtle — поэтому генератор работает даже по http."],
    en: ["A hash function turns data of any size into a fixed-length string; the smallest change to the input changes the result completely. Here you can compare 22 algorithms — from cryptographic SHA-2, SHA-3 and BLAKE3 to fast CRC32 and xxHash checksums.", "Everything runs in your browser with no network requests and no crypto.subtle, so it works even over http."],
  },
  blocks: (locale) => [
    {
      type: "table",
      title: locale === "ru" ? "Алгоритмы и длина хэша" : "Algorithms and digest length",
      head: locale === "ru" ? ["Алгоритм", "Бит", "Hex-символов", "Статус"] : ["Algorithm", "Bits", "Hex chars", "Status"],
      rows: ALGOS.map((a) => [a.name, formatNumber(locale, a.bits), formatNumber(locale, a.bits / 4), STATUS[a.status][locale]]),
    },
  ],
};

const checksumTool: ToolDef = {
  slug: "file-checksum",
  component: "hash/checksum",
  icon: "FileCheck2",
  popular: true,
  name: { ru: "Проверка контрольной суммы", en: "File checksum" },
  h1: { ru: "Проверка контрольной суммы файла", en: "File checksum verification" },
  title: { ru: "Проверка контрольной суммы файла онлайн — SHA256, MD5", en: "File checksum verification online — SHA-256, MD5" },
  description: {
    ru: "Проверка контрольной суммы файла: вставьте ожидаемый SHA-256, MD5 или файл SHA256SUMS и перетащите файлы — совпадение покажется для каждого. Без загрузки.",
    en: "Verify file checksums: paste an expected SHA-256 or MD5, or a SHA256SUMS file, and drop your files — each gets a match or mismatch. Nothing is uploaded.",
  },
  lead: { ru: "Вставьте ожидаемый хэш или список SHA256SUMS и перетащите скачанные файлы — каждый получит отметку «совпадает» или «не совпадает».", en: "Paste the expected hash or a SHA256SUMS list and drop the downloaded files — each gets a match or mismatch." },
  keywords: { ru: ["контрольная сумма", "проверить хэш файла", "sha256sums", "проверка iso"], en: ["checksum", "verify file hash", "sha256sums", "verify iso"] },
  howTo: {
    ru: ["Скопируйте хэш со страницы загрузки или откройте файл SHA256SUMS / *.sha256.", "Алгоритм определится по длине хэша: 32 символа — MD5, 40 — SHA-1, 64 — SHA-256, 128 — SHA-512. При необходимости выберите его вручную.", "Перетащите скачанные файлы — для каждого появится результат проверки."],
    en: ["Copy the hash from the download page or open a SHA256SUMS / *.sha256 file.", "The algorithm is detected by length: 32 characters — MD5, 40 — SHA-1, 64 — SHA-256, 128 — SHA-512. Choose it manually if needed.", "Drop the downloaded files — each gets a verification result."],
  },
  faq: {
    ru: [
      { q: "Зачем проверять контрольную сумму?", a: "Чтобы убедиться, что файл скачался целиком и не был подменён. Совпадение SHA-256 с опубликованным значением гарантирует, что у вас в точности тот же файл." },
      { q: "Какие форматы списков поддерживаются?", a: "Формат GNU coreutils («хэш  имя_файла» или «хэш *имя_файла») и BSD-формат («SHA256 (имя) = хэш»), как в файлах SHA256SUMS, MD5SUMS и *.sha256. Файлы сопоставляются по имени." },
      { q: "Если 64 символа — это точно SHA-256?", a: "Почти всегда, но такую длину дают и SHA3-256, BLAKE2s, BLAKE3. Если сумма не совпала, а источник указывает другой алгоритм, выберите его вручную." },
    ],
    en: [
      { q: "Why verify a checksum?", a: "To make sure the file downloaded completely and wasn't replaced. A SHA-256 matching the published value guarantees you have exactly the same file." },
      { q: "Which list formats are supported?", a: "GNU coreutils (\"hash  filename\" or \"hash *filename\") and BSD style (\"SHA256 (name) = hash\"), as in SHA256SUMS, MD5SUMS and *.sha256 files. Files are matched by name." },
      { q: "Is 64 characters always SHA-256?", a: "Almost always, but SHA3-256, BLAKE2s and BLAKE3 have the same length. If it doesn't match and the source names another algorithm, choose it manually." },
    ],
  },
  about: {
    ru: ["Проверка выполняется в браузере: файлы читаются частями по 8 МБ, поэтому можно проверить даже образ диска на несколько гигабайт. Хэш каждого файла вычисляется тем алгоритмом, который указан в списке или определён по длине значения."],
    en: ["Verification runs in your browser: files are read in 8 MB chunks, so even multi-gigabyte disk images work. Each file is hashed with the algorithm given in the list or detected from the value's length."],
  },
};

const tools: ToolDef[] = [multiTool, ...ALGOS.map(algoTool), ...HMACS.map(hmacTool), ...(["bcrypt", "argon2", "scrypt", "pbkdf2"] as KdfId[]).map(kdfTool), checksumTool];

const RELATED: Record<string, string[]> = {
  "hash-generator": ["sha256-hash-generator", "md5-hash-generator", "file-checksum", "bcrypt-generator"],
  "file-checksum": ["sha256-hash-generator", "md5-hash-generator", "hash-generator"],
  "md5-hash-generator": ["sha256-hash-generator", "file-checksum", "hmac-md5-generator"],
  "sha1-hash-generator": ["sha256-hash-generator", "hmac-sha1-generator"],
  "sha256-hash-generator": ["file-checksum", "hmac-sha256-generator", "sha512-hash-generator", "sha3-256-hash-generator"],
  "sha512-hash-generator": ["hmac-sha512-generator", "sha512-256-hash-generator"],
  "sha3-256-hash-generator": ["keccak-256-hash-generator", "hmac-sha3-256-generator"],
  "keccak-256-hash-generator": ["sha3-256-hash-generator"],
  "bcrypt-generator": ["argon2-generator", "scrypt-generator", "pbkdf2-generator"],
  "argon2-generator": ["bcrypt-generator", "scrypt-generator"],
  "scrypt-generator": ["argon2-generator", "bcrypt-generator"],
  "pbkdf2-generator": ["argon2-generator", "bcrypt-generator"],
};

export const hashSection = withRelated(
  defineToolSection({
    id: "hash",
    name: { ru: "Хэши", en: "Hashes" },
    description: {
      ru: "MD5, SHA-256, SHA-3, BLAKE3, CRC32, HMAC, bcrypt и Argon2 — для текста и файлов прямо в браузере",
      en: "MD5, SHA-256, SHA-3, BLAKE3, CRC32, HMAC, bcrypt and Argon2 — for text and files in your browser",
    },
    icon: "Fingerprint",
    hue: HUE,
    category: "dev",
    order: 6,
    tools,
  }),
  (segs) => RELATED[segs[0]] ?? ["hash-generator", "file-checksum"],
);

registerTools("hash", HUE, tools);
