import type { Locale } from "@/i18n/config";
import type { Block, QA, ToolDef, VariantDef } from "@/registry/types";
import { defineToolSection } from "@/registry/tool-section";
import { utf8Encode } from "@/tools/dev/shared/bytes";
import { registerLink, registerTools, withRelated } from "@/tools/dev/shared/related";
import { notes, parseOctal, rights, toChmodSymbolic, toOctal, toSymbolic, type Who } from "./lib/chmod";
import { NOTE_TEXT } from "./content/chmod-text";
import { b64url, hmacSign } from "./lib/jwt";
import { UA_EXAMPLES } from "./data/ua-examples";

const HUE = 215;
type L = { ru: string; en: string };

/* ───────────── chmod variants ───────────── */

const MODES: { mode: string; use: L }[] = [
  { mode: "755", use: { ru: "каталоги, скрипты и программы: владелец меняет, остальные читают и запускают; стандарт для папок сайта", en: "directories, scripts and programs: the owner edits, everyone else reads and runs; the standard for web directories" } },
  { mode: "644", use: { ru: "обычные файлы: HTML, CSS, картинки, конфигурации — владелец редактирует, остальные только читают", en: "regular files: HTML, CSS, images, configs — the owner edits, everyone else only reads" } },
  { mode: "600", use: { ru: "секреты: закрытый ключ SSH (~/.ssh/id_ed25519), файл .env, пароли — доступ только у владельца", en: "secrets: a private SSH key (~/.ssh/id_ed25519), .env files, passwords — owner only" } },
  { mode: "777", use: { ru: "полный доступ для всех — допустимо разве что для временных тестов; в рабочей системе это дыра в безопасности", en: "full access for everyone — at most for a quick test; on a real system it's a security hole" } },
  { mode: "700", use: { ru: "личные каталоги и ~/.ssh: владелец делает всё, остальные не могут даже посмотреть содержимое", en: "private directories and ~/.ssh: the owner can do anything, others can't even list it" } },
  { mode: "775", use: { ru: "общие каталоги команды: владелец и группа (например, www-data) пишут, остальные читают", en: "shared team directories: owner and group (e.g. www-data) write, others read" } },
  { mode: "664", use: { ru: "файлы, которые редактирует группа: общие документы, файлы сайта при деплое от группы", en: "files edited by a group: shared documents, site files deployed by a group" } },
  { mode: "666", use: { ru: "чтение и запись для всех; так устроены устройства вроде /dev/null, но для обычных файлов это небезопасно", en: "read and write for everyone; devices like /dev/null use it, but it's unsafe for regular files" } },
  { mode: "750", use: { ru: "каталоги и программы только для владельца и его группы; остальным доступ закрыт", en: "directories and programs for the owner and group only; others have no access" } },
  { mode: "640", use: { ru: "конфигурации с паролями, которые должна читать группа службы (например, ssl-cert или adm)", en: "configs with secrets that a service group must read (e.g. ssl-cert or adm)" } },
  { mode: "444", use: { ru: "файлы только для чтения всем, включая владельца — защита от случайного изменения", en: "read-only for everyone, owner included — protection from accidental edits" } },
  { mode: "400", use: { ru: "ключи, которые нужно только читать: например, AWS требует chmod 400 для ключа .pem перед подключением по SSH", en: "keys that are only read: AWS, for example, asks for chmod 400 on a .pem key before SSH" } },
  { mode: "555", use: { ru: "программы и каталоги только для чтения и запуска, без записи даже для владельца", en: "programs and directories that can be read and run but not written, even by the owner" } },
  { mode: "711", use: { ru: "домашний каталог, через который можно пройти к ~/public_html, но нельзя увидеть список файлов", en: "a home directory others can pass through to ~/public_html without listing its files" } },
  { mode: "751", use: { ru: "каталог: группа видит содержимое, остальные могут только пройти внутрь по известному пути", en: "a directory: the group can list it, others can only enter a known path" } },
  { mode: "740", use: { ru: "файлы, которые владелец меняет и запускает, а группа только читает (логи, отчёты)", en: "files the owner edits and runs while the group only reads (logs, reports)" } },
  { mode: "660", use: { ru: "данные владельца и группы: общие файлы проекта, сокеты служб", en: "owner-and-group data: shared project files, service sockets" } },
  { mode: "770", use: { ru: "рабочие каталоги группы: полный доступ владельцу и группе, остальным — ничего", en: "group working directories: full access for owner and group, nothing for others" } },
  { mode: "1777", use: { ru: "общие временные каталоги (/tmp, /var/tmp): писать могут все, удалять — только владельцы файлов", en: "shared temp directories (/tmp, /var/tmp): anyone writes, only owners delete" } },
  { mode: "1755", use: { ru: "sticky-бит при 755: писать может только владелец, поэтому бит почти ничего не меняет", en: "sticky bit on 755: only the owner can write anyway, so the bit changes almost nothing" } },
  { mode: "2755", use: { ru: "каталог, где новые файлы получают группу каталога, или программа, запускаемая с правами группы", en: "a directory whose new files get its group, or a program that runs with its group's privileges" } },
  { mode: "2775", use: { ru: "общая папка команды: группа пишет, а новые файлы автоматически получают группу каталога", en: "a team folder: the group writes and new files automatically inherit the directory's group" } },
  { mode: "4755", use: { ru: "программы с SUID, запускаемые от имени владельца, — как /usr/bin/passwd, который меняет /etc/shadow", en: "SUID programs that run as their owner — like /usr/bin/passwd, which edits /etc/shadow" } },
  { mode: "6755", use: { ru: "программы с SUID и SGID одновременно — запускаются с правами владельца и группы файла", en: "programs with both SUID and SGID — run with the file owner's and group's privileges" } },
  { mode: "000", use: { ru: "полный запрет для всех, кроме root: временно «заморозить» файл", en: "no access for anyone except root: temporarily lock a file away" } },
];

const WHO_L: Record<Who, L> = { u: { ru: "Владелец", en: "Owner" }, g: { ru: "Группа", en: "Group" }, o: { ru: "Остальные", en: "Others" } };

function rightsText(m: number, w: Who, locale: Locale, dir: boolean): string {
  const r = rights(m, w);
  const list: string[] = [];
  if (locale === "ru") {
    if (dir) {
      if (r.read) list.push("видит список файлов");
      if (r.write && r.exec) list.push("создаёт и удаляет файлы");
      if (r.exec) list.push("входит в каталог");
    } else {
      if (r.read) list.push("читает");
      if (r.write) list.push("изменяет");
      if (r.exec) list.push("запускает");
    }
    return list.length ? list.join(", ") : "нет доступа";
  }
  if (dir) {
    if (r.read) list.push("lists files");
    if (r.write && r.exec) list.push("creates and deletes files");
    if (r.exec) list.push("enters the directory");
  } else {
    if (r.read) list.push("reads");
    if (r.write) list.push("modifies");
    if (r.exec) list.push("runs");
  }
  return list.length ? list.join(", ") : "no access";
}

function summary(m: number, locale: Locale): string {
  const who = (["u", "g", "o"] as Who[]).map((w) => {
    const r = rights(m, w);
    const parts = locale === "ru" ? [r.read && "чтение", r.write && "запись", r.exec && "выполнение"] : [r.read && "read", r.write && "write", r.exec && "execute"];
    const p = parts.filter(Boolean).join(locale === "ru" ? ", " : ", ");
    return [w, p || (locale === "ru" ? "нет прав" : "nothing")] as const;
  });
  const [u, g, o] = who;
  const name = (w: Who) => WHO_L[w][locale].toLowerCase();
  const special = [m & 0o4000 && "SUID", m & 0o2000 && "SGID", m & 0o1000 && (locale === "ru" ? "sticky-бит" : "sticky bit")].filter(Boolean).join(", ");
  const tail = special ? (locale === "ru" ? `; плюс ${special}` : `; plus ${special}`) : "";
  if (g[1] === o[1]) return (locale === "ru" ? `${name("u")} — ${u[1]}; группа и остальные — ${g[1]}` : `${name("u")}: ${u[1]}; group and others: ${g[1]}`) + tail;
  return (locale === "ru" ? `${name("u")} — ${u[1]}; группа — ${g[1]}; остальные — ${o[1]}` : `${name("u")}: ${u[1]}; group: ${g[1]}; others: ${o[1]}`) + tail;
}

function chmodVariant({ mode, use }: (typeof MODES)[number]): VariantDef {
  const m = parseOctal(mode)!;
  const sym = toSymbolic(m);
  const digits = mode.length as 3 | 4;
  const cmdSym = toChmodSymbolic(m);
  const sumRu = summary(m, "ru");
  const sumEn = summary(m, "en");
  const faq = (locale: Locale): QA[] => {
    const ns = notes(m);
    if (locale === "ru")
      return [
        { q: `Что означает chmod ${mode}?`, a: `${mode} = ${sym}: ${sumRu}. ${use.ru[0].toUpperCase()}${use.ru.slice(1)}.` },
        { q: `Как поставить права ${mode} на все каталоги?`, a: `Рекурсивно только для каталогов: find /path -type d -exec chmod ${mode} {} +. Команда chmod -R ${mode} применит одинаковые права и к файлам, а это обычно нежелательно.` },
        { q: `Как записать ${mode} в символьном виде?`, a: `chmod ${cmdSym} файл. В выводе ls -l такие права выглядят как -${sym} у файла и d${sym} у каталога.` },
        ...(ns.length ? [{ q: `Безопасно ли ${mode}?`, a: ns.map((n) => NOTE_TEXT[n.code].ru).join(" ") }] : []),
      ];
    return [
      { q: `What does chmod ${mode} mean?`, a: `${mode} = ${sym}: ${sumEn}. Typical use: ${use.en}.` },
      { q: `How do I set ${mode} on all directories?`, a: `Recursively for directories only: find /path -type d -exec chmod ${mode} {} +. chmod -R ${mode} would give files the same mode, which is rarely what you want.` },
      { q: `What is ${mode} in symbolic form?`, a: `chmod ${cmdSym} file. In ls -l output it shows as -${sym} for a file and d${sym} for a directory.` },
      ...(ns.length ? [{ q: `Is ${mode} safe?`, a: ns.map((n) => NOTE_TEXT[n.code].en).join(" ") }] : []),
    ];
  };
  const trimTo = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(" ", n - 1))}…`);
  return {
    slug: mode,
    name: { ru: `chmod ${mode}`, en: `chmod ${mode}` },
    glyph: sym,
    title: { ru: `chmod ${mode} — права ${sym}, что они значат`, en: `chmod ${mode} — ${sym} permissions explained` },
    h1: { ru: `chmod ${mode}`, en: `chmod ${mode}` },
    description: {
      ru: trimTo(`chmod ${mode} = ${sym}: ${sumRu}. Для чего: ${use.ru}.`, 158).replace(/…$/, "."),
      en: trimTo(`chmod ${mode} = ${sym}: ${sumEn}. Use: ${use.en}.`, 158).replace(/…$/, "."),
    },
    lead: { ru: `${sym}: ${sumRu}.`, en: `${sym}: ${sumEn}.` },
    props: { mode },
    keywords: { ru: [`chmod ${mode}`, `права ${mode}`, `${mode} права доступа`, sym], en: [`chmod ${mode}`, `${mode} permissions`, sym] },
    faq: { ru: faq("ru"), en: faq("en") },
    blocks: (locale) => {
      const blocks: Block[] = [
        {
          type: "facts",
          title: locale === "ru" ? `chmod ${mode} коротко` : `chmod ${mode} at a glance`,
          rows: [
            [locale === "ru" ? "Восьмерично" : "Octal", toOctal(m, digits)],
            [locale === "ru" ? "Символьно" : "Symbolic", sym],
            ["ls -l", `-${sym} / d${sym}`],
            [locale === "ru" ? "Команды" : "Commands", `chmod ${mode} file · chmod ${cmdSym} file`],
            [locale === "ru" ? "Для чего" : "Typical use", use[locale]],
          ],
        },
        {
          type: "table",
          title: locale === "ru" ? "Кто что может" : "Who can do what",
          head: locale === "ru" ? ["", "Файл", "Каталог"] : ["", "File", "Directory"],
          rows: (["u", "g", "o"] as Who[]).map((w) => [WHO_L[w][locale], rightsText(m, w, locale, false), rightsText(m, w, locale, true)]),
        },
      ];
      const ns = notes(m);
      if (ns.length) blocks.push({ type: "list", title: locale === "ru" ? "Важно" : "Notes", items: ns.map((n) => NOTE_TEXT[n.code][locale]) });
      return blocks;
    },
  };
}

/* ───────────── sample JWT (HS256, secret "secret") ───────────── */

const sampleJwt = (() => {
  const h = b64url(utf8Encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const p = b64url(utf8Encode(JSON.stringify({ sub: "1234567890", name: "Алия Нұрланқызы", role: "admin", iat: 1735689600, exp: 2051222400 })));
  return `${h}.${p}.${hmacSign("HS256", `${h}.${p}`, utf8Encode("secret"))}`;
})();

const tools: ToolDef[] = [
  {
    slug: "chmod-calculator",
    component: "dev/chmod",
    icon: "ShieldCheck",
    popular: true,
    props: { mode: "755" },
    name: { ru: "Калькулятор chmod", en: "Chmod calculator" },
    h1: { ru: "Калькулятор chmod", en: "Chmod calculator" },
    title: { ru: "Калькулятор chmod онлайн — права доступа 755, 644, 777", en: "Chmod calculator online — Unix permissions 755, 644, 777" },
    description: {
      ru: "Калькулятор прав chmod: перевод 755 ↔ rwxr-xr-x в обе стороны, биты SUID, SGID и sticky, выражения u+x и g-w, расчёт umask и понятные предупреждения.",
      en: "Chmod calculator: convert 755 ↔ rwxr-xr-x both ways, SUID, SGID and sticky bits, symbolic expressions like u+x and g-w, a umask calculator and clear warnings.",
    },
    lead: { ru: "Отметьте права галочками или введите 755 / rwxr-xr-x — получите обе записи и готовые команды chmod.", en: "Tick the permissions or type 755 / rwxr-xr-x to get both notations and ready chmod commands." },
    keywords: { ru: ["chmod", "калькулятор chmod", "права доступа linux", "rwxr-xr-x", "umask"], en: ["chmod calculator", "chmod", "unix permissions", "rwxr-xr-x", "umask calculator"] },
    howTo: {
      ru: ["Введите права числом (755) или символами (rwxr-xr-x) либо отметьте галочки в таблице.", "Проверьте предупреждения: например, 777 даёт всем право менять и удалять файлы.", "Скопируйте команду chmod в числовой или символьной записи.", "Чтобы изменить права выражением, введите его в поле «Применить» — например, g+w или o-rwx."],
      en: ["Type the mode as a number (755) or symbols (rwxr-xr-x), or tick the boxes.", "Read the notes: 777, for instance, lets anyone modify and delete files.", "Copy the chmod command in numeric or symbolic form.", "To change the mode with an expression, type it into Apply — e.g. g+w or o-rwx."],
    },
    faq: {
      ru: [
        { q: "Как читать цифры 755?", a: "Каждая цифра — сумма прав для владельца, группы и остальных: чтение = 4, запись = 2, выполнение = 1. 7 = 4 + 2 + 1 (rwx), 5 = 4 + 1 (r-x)." },
        { q: "Что значит четвёртая цифра, например 1777 или 4755?", a: "Она задаёт специальные биты: 4 — SUID, 2 — SGID, 1 — sticky. 1777 — sticky-бит для общих каталогов вроде /tmp, 4755 — SUID-программа." },
        { q: "Что означает x у каталога?", a: "Право войти в каталог и обращаться к файлам по имени. Без x даже чтение (r) не позволит открыть файлы внутри, а без r нельзя увидеть список файлов." },
        { q: "Как umask влияет на новые файлы?", a: "umask вычитает права из 666 для файлов и из 777 для каталогов. umask 022 даёт файлам 644, каталогам 755; umask 027 — 640 и 750." },
      ],
      en: [
        { q: "How do I read 755?", a: "Each digit sums the permissions of owner, group and others: read = 4, write = 2, execute = 1. 7 = 4 + 2 + 1 (rwx), 5 = 4 + 1 (r-x)." },
        { q: "What does a fourth digit like 1777 or 4755 mean?", a: "It sets the special bits: 4 is SUID, 2 SGID, 1 sticky. 1777 is the sticky bit for shared directories like /tmp; 4755 is a SUID program." },
        { q: "What does x mean on a directory?", a: "Permission to enter it and access files by name. Without x even r won't let you open files inside, and without r you can't list them." },
        { q: "How does umask affect new files?", a: "umask removes bits from 666 for files and 777 for directories. umask 022 gives files 644 and directories 755; umask 027 gives 640 and 750." },
      ],
    },
    about: {
      ru: ["Права в Unix, Linux и macOS задаются для трёх категорий — владельца, группы и остальных — и трёх действий: чтение, запись, выполнение. Калькулятор переводит их между числовой и символьной записью, учитывает SUID, SGID и sticky и объясняет, что права означают для файла и для каталога.", "Предупреждения точные: 777 и 666 помечаются как опасные, а 1777 — как обычная настройка общего каталога вроде /tmp."],
      en: ["Unix, Linux and macOS permissions are set for three classes — owner, group and others — and three actions: read, write, execute. The calculator converts between numeric and symbolic forms, handles SUID, SGID and sticky, and explains what the mode means for files and directories.", "Warnings are precise: 777 and 666 are flagged as dangerous, while 1777 is explained as the normal setting of shared directories like /tmp."],
    },
    variants: { title: { ru: "Популярные права", en: "Common modes" }, list: () => MODES.map(chmodVariant) },
  },
  {
    slug: "jwt-decoder",
    component: "dev/jwt",
    icon: "KeySquare",
    popular: true,
    props: { sample: sampleJwt },
    name: { ru: "JWT-декодер", en: "JWT decoder" },
    h1: { ru: "Декодер JWT онлайн", en: "JWT decoder" },
    title: { ru: "JWT декодер онлайн — расшифровка и проверка подписи", en: "JWT decoder online — decode and verify tokens" },
    description: {
      ru: "Расшифровка JWT онлайн: заголовок и payload, сроки exp, nbf и iat в реальном времени, проверка подписи HS256, RS256, PS256 и ES256 прямо в браузере.",
      en: "Decode JWTs online: header and payload, live exp, nbf and iat times, and signature checks for HS256, RS256, PS256 and ES256 right in your browser.",
    },
    lead: { ru: "Вставьте токен — увидите заголовок, данные и срок действия; «подпись верна» появится только после проверки ключом.", en: "Paste a token to see its header, payload and expiry; “signature valid” appears only after a key check." },
    keywords: { ru: ["jwt декодер", "расшифровать jwt", "jwt онлайн", "проверить jwt", "jwt decode"], en: ["jwt decoder", "decode jwt", "jwt debugger", "verify jwt", "jwt online"] },
    howTo: {
      ru: ["Вставьте токен — префикс «Bearer » и кавычки уберутся сами.", "Посмотрите заголовок, payload и таблицу полей: даты exp, nbf и iat показаны в UTC и относительно текущего момента.", "Чтобы проверить подпись, откройте «Проверить подпись» и введите секрет (HS256) или открытый ключ PEM/JWK (RS256, ES256).", "Настройте допуск часов, если серверы расходятся во времени."],
      en: ["Paste the token — a “Bearer ” prefix and quotes are removed automatically.", "Read the header, payload and claims table: exp, nbf and iat are shown in UTC and relative to now.", "To check the signature open “Verify signature” and enter the secret (HS256) or a PEM/JWK public key (RS256, ES256).", "Set a clock skew if servers disagree on time."],
    },
    faq: {
      ru: [
        { q: "Безопасно ли вставлять сюда рабочий токен?", a: "Токен разбирается прямо в браузере, страница не делает сетевых запросов и ничего не сохраняет. Но действующий токен — это доступ к аккаунту, поэтому после отладки его лучше отозвать." },
        { q: "Почему токен «не проверен», хотя он расшифровался?", a: "Payload JWT не зашифрован, а только подписан — прочитать его может кто угодно. Доверять данным можно лишь после проверки подписи ключом; без ключа статус честно остаётся «не проверена»." },
        { q: "Что значит alg: none?", a: "Токен без подписи. Библиотеки должны отвергать такие токены; если сервер их принимает, это серьёзная уязвимость." },
        { q: "Как проверить RS256?", a: "Нужен открытый ключ: PEM (-----BEGIN PUBLIC KEY-----), сертификат или JWK из адреса вида /.well-known/jwks.json. Ключ выбирается по kid из заголовка токена." },
      ],
      en: [
        { q: "Is it safe to paste a real token?", a: "The token is parsed in your browser; the page makes no network requests and stores nothing. A live token still grants access, so revoke it after debugging." },
        { q: "Why is the signature “not verified” even though it decoded?", a: "A JWT payload isn't encrypted, only signed — anyone can read it. You can trust the data only after checking the signature with a key; without one the status honestly stays “not verified”." },
        { q: "What does alg: none mean?", a: "An unsigned token. Libraries must reject it; a server that accepts it has a serious vulnerability." },
        { q: "How do I verify RS256?", a: "You need the public key: a PEM (-----BEGIN PUBLIC KEY-----), a certificate, or a JWK from a /.well-known/jwks.json URL. The key is picked by the token's kid." },
      ],
    },
    about: {
      ru: ["JWT (RFC 7519) состоит из трёх частей в Base64url: заголовок, данные и подпись. Декодер показывает первые две в виде JSON, проверяет сроки exp и nbf по часам вашего устройства и проверяет подпись: HS256/384/512 — везде, RS/PS/ES — через WebCrypto (нужен HTTPS).", "Статус «подпись верна» появляется только после настоящей криптографической проверки — срок действия сам по себе ничего не говорит о подлинности токена."],
      en: ["A JWT (RFC 7519) has three Base64url parts: header, payload and signature. The decoder shows the first two as JSON, checks exp and nbf against your device clock and verifies the signature: HS256/384/512 everywhere, RS/PS/ES via WebCrypto (HTTPS required).", "“Signature valid” appears only after a real cryptographic check — expiry alone says nothing about whether a token is genuine."],
    },
  },
  {
    slug: "jwt-encoder",
    component: "dev/jwt-encoder",
    icon: "PenLine",
    name: { ru: "Генератор JWT", en: "JWT encoder" },
    h1: { ru: "Генератор JWT — подписать токен", en: "JWT encoder — sign a token" },
    title: { ru: "Генератор JWT онлайн — создать и подписать токен", en: "JWT encoder online — create and sign a token" },
    description: {
      ru: "Создание JWT онлайн: payload в JSON, подпись HS256/384/512 секретом или RS256, PS256, ES256 закрытым ключом, генерация ключей и кнопки iat и exp.",
      en: "Create a JWT online: JSON payload, HS256/384/512 with a secret or RS256, PS256, ES256 with a private key, key-pair generation and iat/exp helpers.",
    },
    lead: { ru: "Введите payload и секрет — подписанный токен обновляется сразу; для RS256 и ES256 можно создать пару ключей прямо здесь.", en: "Enter a payload and secret and the signed token updates instantly; for RS256 and ES256 generate a key pair right here." },
    keywords: { ru: ["генератор jwt", "создать jwt", "подписать jwt", "jwt encode"], en: ["jwt encoder", "jwt generator", "create jwt", "sign jwt"] },
    howTo: {
      ru: ["Отредактируйте payload в JSON; кнопки добавят iat (сейчас) и exp (через час).", "Выберите алгоритм и введите секрет для HS256 или закрытый ключ для RS/PS/ES.", "Скопируйте токен и проверьте его в JWT-декодере."],
      en: ["Edit the JSON payload; the buttons add iat (now) and exp (in an hour).", "Pick an algorithm and enter a secret for HS256 or a private key for RS/PS/ES.", "Copy the token and check it in the JWT decoder."],
    },
    faq: {
      ru: [
        { q: "Какой длины должен быть секрет для HS256?", a: "Не меньше 256 бит — 32 случайных байта. Короткие словарные секреты подбираются перебором по одному перехваченному токену." },
        { q: "Когда выбирать RS256 или ES256 вместо HS256?", a: "Когда токен проверяют другие сервисы: они получают только открытый ключ и не могут выпускать токены сами. ES256 даёт более короткие подписи, чем RS256." },
        { q: "Отправляется ли ключ куда-нибудь?", a: "Нет, подпись вычисляется в браузере. Сгенерированные ключи существуют только на этой странице, пока вы её не закроете." },
      ],
      en: [
        { q: "How long should an HS256 secret be?", a: "At least 256 bits — 32 random bytes. Short dictionary secrets can be brute-forced from a single captured token." },
        { q: "When should I pick RS256 or ES256 over HS256?", a: "When other services verify the token: they get only the public key and can't issue tokens themselves. ES256 signatures are shorter than RS256." },
        { q: "Is my key sent anywhere?", a: "No, signing happens in your browser. Generated keys exist only on this page until you close it." },
      ],
    },
    about: {
      ru: ["Генератор собирает заголовок {alg, typ: \"JWT\"}, кодирует его и payload в Base64url и подписывает: HMAC — библиотекой @noble/hashes (работает везде), RSA и ECDSA — через WebCrypto, которому нужен HTTPS."],
      en: ["The encoder builds the header {alg, typ: \"JWT\"}, Base64url-encodes it with the payload and signs: HMAC with @noble/hashes (works everywhere), RSA and ECDSA via WebCrypto, which needs HTTPS."],
    },
  },
  {
    slug: "url-parser",
    component: "dev/url",
    icon: "Link2",
    popular: true,
    props: { sample: "https://user@пример.рф:8443/каталог/товар?id=42&utm_source=yandex&q=кофе+и+чай#отзывы" },
    name: { ru: "Разбор URL", en: "URL parser" },
    h1: { ru: "Разбор URL онлайн", en: "URL parser" },
    title: { ru: "Разбор URL онлайн — параметры, хост, путь и порт", en: "URL parser online — query parameters, host, path, port" },
    description: {
      ru: "Разбор ссылки на части: протокол, хост (и его Unicode-вид для .рф), порт, путь, параметры запроса и якорь. Параметры можно править в таблице — URL пересоберётся.",
      en: "Split a URL into protocol, host (with the Unicode form of IDNs), port, path, query parameters and fragment. Edit parameters in the table and the URL is rebuilt.",
    },
    lead: { ru: "Вставьте ссылку — увидите каждую часть по отдельности и таблицу параметров, которую можно редактировать.", en: "Paste a link to see every part separately plus an editable table of query parameters." },
    keywords: { ru: ["разбор url", "парсер url", "параметры ссылки", "utm метки из ссылки"], en: ["url parser", "parse url", "query string parser", "url decoder"] },
    howTo: {
      ru: ["Вставьте полный адрес со схемой (https://…).", "Посмотрите части адреса: хост, порт, путь, якорь; кириллический домен показан и в Punycode, и в Unicode.", "Измените, добавьте или удалите параметры — ссылка пересоберётся, скопируйте её кнопкой."],
      en: ["Paste a full address with a scheme (https://…).", "Check the parts: host, port, path, fragment; internationalized domains show both Punycode and Unicode.", "Edit, add or remove parameters — the link is rebuilt; copy it with the button."],
    },
    faq: {
      ru: [
        { q: "Как убрать UTM-метки из ссылки?", a: "Удалите параметры utm_source, utm_medium, utm_campaign и другие строки в таблице — адрес пересоберётся без них." },
        { q: "Почему домен .рф показан как xn--p1ai?", a: "Браузеры и DNS работают с доменами в Punycode. Инструмент показывает обе формы: техническую и читаемую." },
        { q: "Сохраняются ли повторяющиеся параметры?", a: "Да, например ?tag=a&tag=b останутся двумя строками в исходном порядке." },
      ],
      en: [
        { q: "How do I strip UTM tags from a link?", a: "Delete utm_source, utm_medium, utm_campaign and similar rows in the table — the address is rebuilt without them." },
        { q: "Why is an IDN shown as xn--…?", a: "Browsers and DNS work with Punycode domains. The tool shows both the technical and the readable form." },
        { q: "Are repeated parameters kept?", a: "Yes, ?tag=a&tag=b stays as two rows in the original order." },
      ],
    },
    about: {
      ru: ["Разбор выполняется стандартным API URL браузера (стандарт WHATWG), поэтому результат совпадает с тем, как ссылку поймёт браузер. Пароль в адресе маскируется точками."],
      en: ["Parsing uses the browser's standard URL API (WHATWG URL), so the result matches how browsers read the link. A password in the address is masked."],
    },
  },
  {
    slug: "user-agent-parser",
    component: "dev/ua",
    icon: "MonitorSmartphone",
    props: { sample: UA_EXAMPLES[0][1] },
    name: { ru: "Разбор User-Agent", en: "User-Agent parser" },
    h1: { ru: "Разбор User-Agent онлайн", en: "User-Agent parser" },
    title: { ru: "Разбор User-Agent онлайн — браузер, ОС, устройство, бот", en: "User-Agent parser online — browser, OS, device, bot" },
    description: {
      ru: "Разбор User-Agent: браузер, движок, ОС, устройство и процессор; распознавание ботов — Googlebot, YandexBot, GPTBot, HeadlessChrome, curl.",
      en: "Parse a User-Agent: browser, engine, OS, device and CPU, plus bot detection for Googlebot, YandexBot, GPTBot, HeadlessChrome and curl.",
    },
    lead: { ru: "Вставьте строку User-Agent — увидите браузер, систему и устройство, а если это бот — какой именно.", en: "Paste a User-Agent string to see the browser, system and device — and which bot it is, if any." },
    keywords: { ru: ["user agent", "разбор user agent", "определить бота", "юзер агент"], en: ["user agent parser", "user agent", "detect bot", "ua string"] },
    howTo: {
      ru: ["Вставьте строку User-Agent из логов сервера или выберите пример.", "Посмотрите браузер, движок, ОС и тип устройства, а также отметку о боте.", "Ниже показан ваш собственный браузер вместе с Client Hints — он не смешивается со вставленной строкой."],
      en: ["Paste a User-Agent from server logs or pick an example.", "See the browser, engine, OS and device type, plus the bot flag.", "Your own browser with its Client Hints is shown below — never mixed with the pasted string."],
    },
    faq: {
      ru: [
        { q: "Как понять, что заходил настоящий Googlebot или YandexBot?", a: "User-Agent может подделать кто угодно. Настоящих роботов проверяют обратным DNS: IP Googlebot разрешается в *.googlebot.com, YandexBot — в *.yandex.ru, *.yandex.net или *.yandex.com." },
        { q: "Почему Windows 11 определяется как Windows 10?", a: "Браузеры давно «заморозили» строку User-Agent: Windows 11 пишет Windows NT 10.0. Точную версию сообщают только Client Hints — они показаны в блоке вашего браузера." },
        { q: "Что такое Client Hints?", a: "Новый способ сообщать данные о браузере (Sec-CH-UA). Chrome и Edge отдают их по запросу, Firefox и Safari пока нет." },
      ],
      en: [
        { q: "How do I know it was the real Googlebot?", a: "Anyone can fake a User-Agent. Real crawlers are verified by reverse DNS: Googlebot IPs resolve to *.googlebot.com, YandexBot to *.yandex.ru, *.yandex.net or *.yandex.com." },
        { q: "Why is Windows 11 shown as Windows 10?", a: "Browsers froze the User-Agent string: Windows 11 still says Windows NT 10.0. Only Client Hints report the exact version — they are shown in your browser's block." },
        { q: "What are Client Hints?", a: "A newer way for browsers to report details (Sec-CH-UA). Chrome and Edge send them on request; Firefox and Safari don't yet." },
      ],
    },
    about: {
      ru: ["Строка разбирается библиотекой ua-parser-js (версия 1) прямо в браузере; для ботов используется собственный список правил: поисковые роботы, превью соцсетей, SEO-сервисы, ИИ-краулеры, автоматизированные браузеры и HTTP-клиенты."],
      en: ["The string is parsed with ua-parser-js (v1) in your browser; bots are detected with our own rule list: search crawlers, social previews, SEO services, AI crawlers, automated browsers and HTTP clients."],
    },
  },
  {
    slug: "html-to-jsx",
    component: "dev/html-jsx",
    icon: "Atom",
    name: { ru: "HTML в JSX", en: "HTML to JSX" },
    h1: { ru: "HTML в JSX онлайн", en: "HTML to JSX converter" },
    title: { ru: "HTML в JSX онлайн — конвертер для React", en: "HTML to JSX converter online — for React" },
    description: {
      ru: "Перевод HTML в JSX для React: class → className, for → htmlFor, style в объект, закрытые пустые теги, SVG-атрибуты в camelCase, комментарии {/* */} и фрагменты.",
      en: "Convert HTML to JSX for React: class → className, for → htmlFor, style strings to objects, self-closed void tags, camelCase SVG attributes and fragments.",
    },
    lead: { ru: "Вставьте HTML — получите JSX, готовый для компонента React, с исправленными атрибутами и стилями.", en: "Paste HTML and get JSX ready for a React component, with attributes and styles fixed." },
    keywords: { ru: ["html в jsx", "конвертер html в react", "html to jsx"], en: ["html to jsx", "html to react", "jsx converter"] },
    howTo: {
      ru: ["Вставьте разметку HTML или SVG.", "Задайте имя компонента, чтобы получить готовую функцию.", "Скопируйте JSX; предупреждения подскажут, что проверить вручную."],
      en: ["Paste HTML or SVG markup.", "Give a component name to get a ready function.", "Copy the JSX; warnings tell you what to review by hand."],
    },
    faq: {
      ru: [
        { q: "Почему value превращается в defaultValue?", a: "В React поле с value без onChange становится только для чтения. defaultValue задаёт начальное значение неуправляемого поля; опцию можно выключить." },
        { q: "Что происходит со style?", a: "Строка style=\"font-size: 12px\" становится объектом {{ fontSize: \"12px\" }}; префиксы -webkit- превращаются в Webkit…, числа остаются числами." },
        { q: "Как обрабатываются onclick и другие события?", a: "Они становятся стрелочными функциями с исходным кодом, но переменной event в React нет — такие места нужно проверить." },
      ],
      en: [
        { q: "Why does value become defaultValue?", a: "In React a field with value and no onChange is read-only. defaultValue sets the initial value of an uncontrolled field; the option can be turned off." },
        { q: "What happens to style?", a: "style=\"font-size: 12px\" becomes {{ fontSize: \"12px\" }}; -webkit- prefixes become Webkit…, numbers stay numbers." },
        { q: "How are onclick and other events handled?", a: "They become arrow functions with the original code, but there's no implicit event variable in React — review them." },
      ],
    },
    about: {
      ru: ["Конвертер использует собственный разборщик HTML, поэтому работает даже с неполной разметкой. Фигурные скобки в тексте экранируются, содержимое <pre> и <textarea> сохраняется как есть."],
      en: ["The converter uses its own HTML parser, so it copes with partial markup. Braces in text are escaped, and <pre> and <textarea> content is preserved."],
    },
  },
  {
    slug: "curl-to-fetch",
    component: "dev/curl",
    icon: "TerminalSquare",
    popular: true,
    props: { target: "fetch" },
    name: { ru: "cURL в fetch", en: "cURL to fetch" },
    h1: { ru: "cURL в fetch и axios онлайн", en: "cURL to fetch converter" },
    title: { ru: "cURL в fetch онлайн — конвертер в JavaScript и axios", en: "cURL to fetch online — convert to JavaScript and axios" },
    description: {
      ru: "Перевод команды cURL в код JavaScript fetch, axios или Python requests: заголовки, JSON, формы -F, -u, cookies и -G. Понимает «Copy as cURL» из DevTools браузера.",
      en: "Convert a cURL command to JavaScript fetch, axios or Python requests: headers, JSON, -F forms, -u auth, cookies and -G. Works with DevTools “Copy as cURL”.",
    },
    lead: { ru: "Вставьте команду curl — получите готовый вызов fetch с заголовками и телом запроса.", en: "Paste a curl command and get a ready fetch call with headers and body." },
    keywords: { ru: ["curl в fetch", "curl to fetch", "конвертер curl", "curl в javascript"], en: ["curl to fetch", "curl to javascript", "curl converter", "curl to axios"] },
    howTo: {
      ru: ["В DevTools откройте вкладку «Сеть», щёлкните запрос правой кнопкой и выберите Copy → Copy as cURL (bash).", "Вставьте команду — код появится сразу.", "Переключите язык: fetch, axios или Python requests."],
      en: ["In DevTools open Network, right-click a request and choose Copy → Copy as cURL (bash).", "Paste the command — the code appears instantly.", "Switch the language: fetch, axios or Python requests."],
    },
    faq: {
      ru: [
        { q: "Какие опции curl поддерживаются?", a: "-X, -H, -d / --data-raw / --data-binary / --data-urlencode, --json, -F, -u, -b, -A, -e, -G, -I, -L, -k, --compressed и --url. Неизвестные опции перечисляются под результатом." },
        { q: "Почему -k нельзя перенести в fetch?", a: "Браузер не позволяет отключить проверку TLS-сертификата. В Python requests эквивалент — verify=False." },
        { q: "Поддерживается ли формат Windows cmd?", a: "Да, переносы строк через ^ понимаются. Надёжнее всего копировать запрос как cURL (bash)." },
      ],
      en: [
        { q: "Which curl options are supported?", a: "-X, -H, -d / --data-raw / --data-binary / --data-urlencode, --json, -F, -u, -b, -A, -e, -G, -I, -L, -k, --compressed and --url. Unknown options are listed below the result." },
        { q: "Why can't -k be carried into fetch?", a: "Browsers don't allow disabling TLS certificate checks. The Python requests equivalent is verify=False." },
        { q: "Is Windows cmd syntax supported?", a: "Yes, ^ line continuations are understood. Copy as cURL (bash) is the most reliable." },
      ],
    },
    about: {
      ru: ["Команда разбирается по правилам bash: одинарные и двойные кавычки, $'…' и переносы через обратную косую черту. JSON-тело оформляется как JSON.stringify({…}), формы -F — через FormData, логин и пароль -u — заголовком Authorization: Basic."],
      en: ["The command is parsed with bash rules: single and double quotes, $'…' and backslash line continuations. JSON bodies become JSON.stringify({…}), -F forms use FormData, and -u credentials become an Authorization: Basic header."],
    },
  },
  {
    slug: "curl-to-python",
    component: "dev/curl",
    icon: "TerminalSquare",
    props: { target: "python" },
    name: { ru: "cURL в Python", en: "cURL to Python" },
    h1: { ru: "cURL в Python requests", en: "cURL to Python requests" },
    title: { ru: "cURL в Python онлайн — конвертер в requests", en: "cURL to Python online — convert to requests" },
    description: {
      ru: "Перевод команды cURL в код Python requests: headers, json=, data=, files= для -F, auth через Basic, verify=False для -k. Работает с «Copy as cURL» из браузера.",
      en: "Convert cURL to Python requests: headers, json=, data=, files= for -F, Basic auth and verify=False for -k. Works with “Copy as cURL” from the browser.",
    },
    lead: { ru: "Вставьте команду curl — получите код на Python с библиотекой requests.", en: "Paste a curl command and get Python code using the requests library." },
    keywords: { ru: ["curl в python", "curl to python", "curl в requests"], en: ["curl to python", "curl to requests", "convert curl to python"] },
    howTo: {
      ru: ["Скопируйте запрос как cURL из DevTools или документации API.", "Вставьте команду — появится код для requests.", "Установите библиотеку командой pip install requests и запустите код."],
      en: ["Copy the request as cURL from DevTools or API docs.", "Paste the command — requests code appears.", "Install the library with pip install requests and run it."],
    },
    faq: {
      ru: [
        { q: "Почему JSON передаётся через json=, а не data=?", a: "Параметр json= сам сериализует словарь и ставит Content-Type: application/json. Для обычных строк и форм используется data=." },
        { q: "Как передаются файлы из -F file=@photo.jpg?", a: "Через files={'file': open('photo.jpg', 'rb')} — requests сам соберёт multipart/form-data." },
        { q: "Что делать с -k?", a: "В коде появится verify=False: это отключает проверку сертификата, используйте только для отладки." },
      ],
      en: [
        { q: "Why json= instead of data=?", a: "json= serializes the dict and sets Content-Type: application/json. data= is used for plain strings and forms." },
        { q: "How are -F file=@photo.jpg uploads handled?", a: "With files={'file': open('photo.jpg', 'rb')} — requests builds the multipart/form-data body." },
        { q: "What about -k?", a: "verify=False is added: it disables certificate checks, so use it only for debugging." },
      ],
    },
    about: {
      ru: ["JSON-тело переводится в словарь Python (true → True, null → None), заголовки — в словарь headers, а метод выбирается функцией requests.get/post/put/delete."],
      en: ["JSON bodies become Python dicts (true → True, null → None), headers go into a headers dict, and the method maps to requests.get/post/put/delete."],
    },
  },
  {
    slug: "string-escape",
    component: "dev/escape",
    icon: "Quote",
    name: { ru: "Экранирование строк", en: "String escape" },
    h1: { ru: "Экранирование строк онлайн", en: "String escape and unescape" },
    title: { ru: "Экранирование строк онлайн — JS, JSON, SQL, RegExp, shell", en: "String escape online — JS, JSON, SQL, regex, shell" },
    description: {
      ru: "Экранирование и обратное преобразование строк для JavaScript, JSON, SQL, регулярных выражений, HTML, XML, bash и CSV: кавычки, обратные слэши и переносы — правильно.",
      en: "Escape and unescape strings for JavaScript, JSON, SQL, regular expressions, HTML, XML, bash and CSV: quotes, backslashes and newlines handled correctly.",
    },
    lead: { ru: "Выберите формат — строка экранируется так, чтобы её можно было вставить в код без ошибок.", en: "Pick a format and the string is escaped so it can go into code without errors." },
    keywords: { ru: ["экранирование строк", "экранировать кавычки", "escape string", "экранирование sql"], en: ["string escape", "escape quotes", "unescape string", "escape regex"] },
    howTo: {
      ru: ["Введите текст с кавычками, обратными слэшами или переносами.", "Выберите формат: строка JavaScript, JSON, SQL, RegExp, HTML, shell или CSV.", "Переключитесь на «Убрать экранирование», чтобы получить исходный текст обратно."],
      en: ["Enter text with quotes, backslashes or newlines.", "Pick the target: JavaScript string, JSON, SQL, RegExp, HTML, shell or CSV.", "Switch to Unescape to get the original text back."],
    },
    faq: {
      ru: [
        { q: "Как экранировать апостроф в SQL?", a: "Удвоить его: 'O''Brien'. Обратный слэш в стандартном SQL не нужен, но MySQL по умолчанию его понимает — для этого есть режим «MySQL»." },
        { q: "Как вставить строку в команду bash?", a: "Надёжнее всего одинарные кавычки: внутри них ничего не раскрывается. Сам апостроф записывается как '\\''." },
        { q: "Зачем экранировать текст для регулярного выражения?", a: "Символы . * + ? ( ) [ ] { } | ^ $ имеют особый смысл. После экранирования выражение ищет строку буквально." },
      ],
      en: [
        { q: "How do I escape an apostrophe in SQL?", a: "Double it: 'O''Brien'. Standard SQL doesn't use backslashes, but MySQL does by default — that's what the MySQL mode is for." },
        { q: "How do I put a string into a bash command?", a: "Single quotes are safest: nothing expands inside them. An apostrophe itself is written as '\\''." },
        { q: "Why escape text for a regex?", a: "Characters . * + ? ( ) [ ] { } | ^ $ have special meaning. Escaped, the pattern matches the text literally." },
      ],
    },
    about: {
      ru: ["Для каждого формата применяются его собственные правила: JavaScript экранирует кавычку выбранного типа и управляющие символы, CSV заключает поле в кавычки и удваивает их, shell использует одинарные кавычки POSIX."],
      en: ["Each format uses its own rules: JavaScript escapes the chosen quote and control characters, CSV quotes fields and doubles quotes, shell uses POSIX single quotes."],
    },
  },
];

const RELATED: Record<string, string[]> = {
  "jwt-decoder": ["jwt-encoder", "base64-decode", "hmac-sha256-generator"],
  "jwt-encoder": ["jwt-decoder", "hmac-sha256-generator", "base64-encode"],
  "chmod-calculator": ["string-escape", "curl-to-fetch"],
  "url-parser": ["url-decode", "url-encode", "punycode-converter"],
  "user-agent-parser": ["url-parser", "curl-to-fetch"],
  "html-to-jsx": ["html-encode", "string-escape"],
  "curl-to-fetch": ["curl-to-python", "url-parser", "json-escape"],
  "curl-to-python": ["curl-to-fetch", "url-parser"],
  "string-escape": ["json-escape", "html-encode", "url-encode", "unicode-escape"],
};

export const devSection = withRelated(
  defineToolSection({
    id: "dev",
    name: { ru: "Утилиты разработчика", en: "Developer utilities" },
    description: {
      ru: "JWT-декодер и генератор, калькулятор chmod, разбор URL и User-Agent, cURL в код, HTML в JSX",
      en: "JWT decoder and encoder, chmod calculator, URL and User-Agent parsers, cURL to code, HTML to JSX",
    },
    icon: "Terminal",
    hue: HUE,
    category: "dev",
    order: 8,
    tools,
  }),
  (segs) => (segs[0] === "chmod-calculator" && segs[1] ? ["chmod-calculator"] : (RELATED[segs[0]] ?? [])),
);

registerTools("dev", HUE, tools);
for (const m of MODES) registerLink(`chmod-calculator/${m.mode}`, { label: { ru: `chmod ${m.mode}`, en: `chmod ${m.mode}` }, icon: "ShieldCheck", hue: HUE });
