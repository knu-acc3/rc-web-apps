import type { Locale } from "@/i18n/config";
import type { Block, ToolDef } from "@/registry/types";

const tt = (l: Locale, ru: string, en: string) => (l === "ru" ? ru : en);

const howItWorks = (l: Locale): Block => ({
  type: "facts",
  title: tt(l, "Как защищён файл", "How the file is protected"),
  rows: [
    [tt(l, "Шифр", "Cipher"), tt(l, "AES-256-GCM — тот же, что в HTTPS и мессенджерах", "AES-256-GCM — the same as in HTTPS and messengers")],
    [tt(l, "Ключ из пароля", "Key from the password"), tt(l, "PBKDF2-SHA-256, 600 000 повторов: подбор пароля очень медленный", "PBKDF2-SHA-256, 600,000 rounds: guessing passwords is very slow")],
    [tt(l, "Проверка целостности", "Integrity"), tt(l, "любое изменение файла обнаруживается при расшифровке", "any change to the file is detected on decryption")],
    [tt(l, "Где выполняется", "Where it runs"), tt(l, "в вашем браузере, файл и пароль никуда не отправляются", "in your browser; the file and password are sent nowhere")],
  ],
});

export const encryptFileTool: ToolDef = {
  slug: "encrypt-file",
  component: "file/encrypt",
  icon: "FileLock2",
  props: { kind: "file" },
  name: { ru: "Зашифровать файл паролем", en: "Encrypt a file with a password" },
  title: { ru: "Зашифровать файл паролем онлайн | шифрование AES-256", en: "Encrypt a File with a Password — AES-256 Online" },
  h1: { ru: "Зашифровать файл паролем", en: "Encrypt a file with a password" },
  description: {
    ru: "Поставьте пароль на любой файл: шифрование AES-256 прямо в браузере, файл не загружается на сервер. Расшифровать можно здесь же, зная пароль.",
    en: "Put a password on any file: AES-256 encryption right in your browser, nothing is uploaded. Decrypt it here with the same password.",
  },
  lead: { ru: "Выберите файл, придумайте пароль — получите зашифрованную копию, которую без пароля не открыть.", en: "Choose a file and a password — you get an encrypted copy nobody can open without the password." },
  keywords: { ru: ["зашифровать файл", "поставить пароль на файл", "шифрование файлов онлайн", "расшифровать файл"], en: ["encrypt file", "password protect file", "file encryption online", "decrypt file"] },
  howTo: {
    ru: ["Выберите файл — фото, документ, архив, что угодно.", "Придумайте надёжный пароль или нажмите «Придумать пароль» и запишите его.", "Нажмите «Зашифровать файл» и сохраните файл .enc. Чтобы открыть его, загрузите сюда же и введите пароль."],
    en: ["Choose a file — a photo, document, archive, anything.", "Make up a strong password or press Suggest a password and write it down.", "Press Encrypt file and save the .enc file. To open it, load it here and enter the password."],
  },
  about: {
    ru: [
      "Зашифрованный файл можно спокойно хранить в облаке, отправить почтой или на флешке: без пароля его содержимое — случайный набор байтов. Даже имя исходного файла спрятано внутри.",
      "Надёжность зависит от пароля. Фраза из 5–6 случайных слов надёжнее короткого пароля с символами и при этом легко запоминается. Восстановить забытый пароль невозможно — ни нам, ни кому-либо ещё.",
    ],
    en: [
      "You can keep the encrypted file in the cloud, email it or carry it on a flash drive: without the password its contents are random bytes. Even the original file name is hidden inside.",
      "Strength depends on the password. A phrase of 5–6 random words beats a short password with symbols and is easy to remember. A forgotten password can't be recovered by us or anyone else.",
    ],
  },
  faq: {
    ru: [
      { q: "Чем открыть зашифрованный файл?", a: "Этой же страницей: выберите файл .enc и введите пароль. Страница работает и без интернета, если вы уже открывали её раньше." },
      { q: "Есть ли ограничение по размеру?", a: "Файл шифруется частями по 1 МБ, поэтому подходят и большие файлы — до нескольких гигабайт, сколько позволит память устройства." },
      { q: "Можно ли подобрать пароль?", a: "Каждая попытка требует 600 000 вычислений хеша, поэтому перебор очень медленный. Пароль из 5–6 случайных слов подобрать практически невозможно, а «123456» — легко." },
    ],
    en: [
      { q: "How do I open an encrypted file?", a: "With this page: choose the .enc file and enter the password. It works offline too if you've opened it before." },
      { q: "Is there a size limit?", a: "Files are encrypted in 1 MB chunks, so large files work too — up to several gigabytes, as memory allows." },
      { q: "Can the password be guessed?", a: "Each attempt costs 600,000 hash rounds, so brute force is very slow. A phrase of 5–6 random words is practically unguessable; “123456” is not." },
    ],
  },
  related: ["encrypt-text", "password-generator", "create-zip", "file-checksum"],
  blocks: (l) => [howItWorks(l)],
};

export const encryptTextTool: ToolDef = {
  slug: "encrypt-text",
  component: "file/encrypt",
  icon: "LockKeyhole",
  props: { kind: "text" },
  name: { ru: "Зашифровать текст паролем", en: "Encrypt text with a password" },
  title: { ru: "Зашифровать текст паролем онлайн | шифрование сообщений", en: "Encrypt Text with a Password — Secret Message Online" },
  h1: { ru: "Зашифровать текст паролем", en: "Encrypt text with a password" },
  description: {
    ru: "Зашифруйте сообщение паролем и отправьте его в любом мессенджере: получатель расшифрует текст здесь же. AES-256 в браузере, текст не отправляется на сервер.",
    en: "Encrypt a message with a password and send it in any messenger: the recipient decrypts it here. AES-256 in your browser; the text isn't sent anywhere.",
  },
  lead: { ru: "Введите текст и пароль — получите зашифрованную строку. Пароль сообщите получателю отдельно.", en: "Enter text and a password to get an encrypted string. Tell the recipient the password separately." },
  keywords: { ru: ["зашифровать текст", "шифрование текста", "зашифровать сообщение", "расшифровать текст"], en: ["encrypt text", "encrypt message", "secret message", "decrypt text"] },
  howTo: {
    ru: ["Вставьте текст и придумайте пароль.", "Нажмите «Зашифровать текст» и скопируйте результат.", "Получатель выбирает «Расшифровать», вставляет строку и вводит пароль."],
    en: ["Paste the text and make up a password.", "Press Encrypt text and copy the result.", "The recipient chooses Decrypt, pastes the string and enters the password."],
  },
  about: {
    ru: [
      "Результат — строка в Base64: её можно отправить в чате, письмом или сохранить в заметках. Каждый раз она разная, даже для одного и того же текста и пароля, — по ней нельзя понять, что сообщения совпадают.",
      "Пароль лучше передать другим способом: если отправить его в том же чате, шифрование теряет смысл.",
    ],
    en: [
      "The result is a Base64 string: send it in a chat or email or keep it in notes. It is different every time, even for the same text and password, so nobody can tell that two messages match.",
      "Share the password another way: sending it in the same chat defeats the purpose.",
    ],
  },
  faq: {
    ru: [
      { q: "Это шифр Цезаря?", a: "Нет. Используется AES-256-GCM — современный стандарт шифрования. Шифр Цезаря взламывается за секунды, AES без пароля — нет." },
      { q: "Почему зашифрованный текст длиннее исходного?", a: "К нему добавляются соль, служебные данные и код проверки целостности (около 60 байт), а Base64 увеличивает размер ещё на треть." },
      { q: "Что будет, если в строке изменить один символ?", a: "Расшифровка не удастся: проверка целостности сразу обнаружит изменение." },
    ],
    en: [
      { q: "Is this a Caesar cipher?", a: "No. It's AES-256-GCM, a modern encryption standard. A Caesar cipher breaks in seconds; AES without the password doesn't." },
      { q: "Why is the encrypted text longer?", a: "Salt, settings and an integrity code (about 60 bytes) are added, and Base64 adds another third." },
      { q: "What if one character of the string changes?", a: "Decryption fails: the integrity check detects the change immediately." },
    ],
  },
  related: ["encrypt-file", "password-generator", "base64-encode", "hash-generator"],
  blocks: (l) => [howItWorks(l)],
};
