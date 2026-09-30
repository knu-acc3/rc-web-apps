import { tr, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import type { Block, Crumb, LinkItem, PageModel, QA, SearchEntry, SectionDef } from "@/registry/types";
import { CAT_BY_ID, CATS } from "./data/categories";
import { PORT_BY_NUM, PORTS, rangeOf, type PortDef } from "./data";
import type { PortCat } from "./data/types";
import type { PortRow } from "./PortSearch";

const ID = "port";
const HUE = 185;
const ICON = "Network";
const NAME = { ru: "Сетевые порты", en: "Network ports" };
const DESC = {
  ru: "Справочник TCP- и UDP-портов: какая служба использует порт, чем опасно открывать его в интернет и как проверить, открыт ли он.",
  en: "TCP and UDP port reference: which service uses a port, the risks of exposing it and how to check whether it's open.",
};

const L = (l: Locale) => (l === "ru" ? 0 : 1);
const protoText = (p: PortDef) => p.proto.map((x) => x.toUpperCase()).join("/");
const ABBR = /(?:e\.g|i\.e|т\. ?[едп]|напр|др|см|vs|etc)\.$/i;
/** Split text into sentences without breaking on "e.g.", "т. е." and similar abbreviations. */
function sentences(s: string): string[] {
  const out: string[] = [];
  let start = 0;
  const re = /[.!?](?=\s+[«"(]?[\p{Lu}\d])/gu;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    const piece = s.slice(start, m.index + 1);
    if (ABBR.test(piece)) continue;
    out.push(piece.trim());
    start = m.index + 1;
  }
  const rest = s.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}
const firstSentence = (s: string) => sentences(s)[0] ?? s;
/** Leading sentences until the text is long enough for a meta description. */
const leadText = (s: string, min = 90) => {
  let out = "";
  for (const x of sentences(s)) {
    out = out ? `${out} ${x}` : x;
    if (out.length >= min) break;
  }
  return out;
};
const fit = (variants: string[], max = 60) => variants.find((v) => v.length <= max) ?? variants[variants.length - 1];
const describe = (base: string, tails: string[]) => {
  const tail = tails.find((t) => `${base} ${t}`.length <= 160);
  const out = tail ? `${base} ${tail}` : base;
  return out.length > 160 ? out.slice(0, 157).replace(/[\s,;:—-]+\S*$/, "") + "…" : out;
};

const RANGE: Record<ReturnType<typeof rangeOf>, { ru: string; en: string }> = {
  system: { ru: "системный (0–1023)", en: "system / well-known (0–1023)" },
  registered: { ru: "зарегистрированный (1024–49151)", en: "registered (1024–49151)" },
  dynamic: { ru: "динамический (49152–65535)", en: "dynamic / ephemeral (49152–65535)" },
};

function statusText(p: PortDef, l: Locale): string {
  const ru = l === "ru";
  if (p.official) return ru ? `назначен IANA («${p.iana}»)` : `IANA-assigned (“${p.iana}”)`;
  if (p.iana) return ru ? `неофициально; в реестре IANA номер закреплён за «${p.iana}»` : `unofficial; IANA lists the number for “${p.iana}”`;
  return ru ? "неофициальный (де-факто)" : "unofficial (de facto)";
}
const statusShort = (p: PortDef, l: Locale) => (p.official ? (l === "ru" ? "IANA" : "IANA") : l === "ru" ? "неофициальный" : "unofficial");

function portLink(p: PortDef, l: Locale): LinkItem {
  return { path: [ID, String(p.port)], label: `${p.port} ${p.s[L(l)]}`, hint: protoText(p) };
}
function catLink(c: PortCat, l: Locale): LinkItem {
  const d = CAT_BY_ID.get(c)!;
  return { path: [ID, c], label: d[l].name, hint: PORTS.filter((p) => p.cat === c).slice(0, 5).map((p) => p.port).join(", "), icon: d.icon, hue: HUE };
}
function rows(list: PortDef[], l: Locale): PortRow[] {
  return list.map((p) => ({ p: p.port, t: protoText(p), s: p.s[L(l)], c: p.cat }));
}
const home = (l: Locale): Crumb => ({ name: ui(l).home, path: [] });
const hubCrumb = (l: Locale): Crumb => ({ name: l === "ru" ? "Список портов" : "Port list", path: [ID] });

const POPULAR = [22, 80, 443, 21, 25, 53, 3389, 3306, 5432, 8080, 8443, 445, 587, 993, 1194, 51820, 6379, 27017, 25565, 5173, 3000, 9200, 2375, 6443];

/* ───────────── hub ───────────── */

function hubPage(l: Locale): PageModel {
  const ru = l === "ru";
  const n = PORTS.length;
  const cats: [string, string][] = CATS.map((c) => [c.id, c[l].name]);
  return {
    path: [ID],
    sectionId: ID,
    kind: "hub",
    title: ru ? "Список портов TCP и UDP — какая служба использует порт" : "TCP and UDP Port List — Which Service Uses a Port",
    h1: ru ? "Список портов TCP и UDP" : "TCP and UDP port list",
    description: ru
      ? `Справочник ${n} ${plural("ru", n, ["сетевого порта", "сетевых портов", "сетевых портов"])}: 22 SSH, 80 и 443 HTTP(S), 3389 RDP, 3306 MySQL, 25565 Minecraft. Служба, протокол, риски и команды проверки.`
      : `A reference of ${n} network ports: 22 SSH, 80 and 443 HTTP(S), 3389 RDP, 3306 MySQL, 25565 Minecraft. Service, protocol, risks and commands to check each port.`,
    lead: ru ? "Введите номер порта или название службы — у каждого порта есть страница с описанием, рисками и командами проверки." : "Type a port number or service name — each port has a page with its purpose, risks and check commands.",
    breadcrumbs: [home(l)],
    tool: { id: "port/search", props: { items: rows(PORTS, l), cats } },
    topBlocks: [
      { type: "links", title: ru ? "Порты по категориям" : "Ports by category", style: "cards", items: CATS.map((c) => catLink(c.id, l)) },
      { type: "links", title: ru ? "Популярные порты" : "Popular ports", style: "chips", items: POPULAR.map((p) => portLink(PORT_BY_NUM.get(p)!, l)) },
    ],
    blocks: [
      {
        type: "table",
        title: ru ? "Диапазоны портов (RFC 6335)" : "Port ranges (RFC 6335)",
        head: ru ? ["Диапазон", "Название", "Для чего"] : ["Range", "Name", "Used for"],
        rows: ru
          ? [
              ["0–1023", "Системные (well-known)", "Стандартные службы: HTTP, SSH, DNS, почта. В Linux и macOS открыть такой порт может только root"],
              ["1024–49151", "Зарегистрированные", "Службы, зарегистрированные в IANA, и порты по умолчанию у программ: СУБД, dev-серверы, игры"],
              ["49152–65535", "Динамические (эфемерные)", "Временные порты клиента для исходящих соединений; за службами не закрепляются"],
            ]
          : [
              ["0–1023", "System (well-known)", "Standard services: HTTP, SSH, DNS, mail. On Linux and macOS only root can bind them"],
              ["1024–49151", "Registered", "IANA-registered services and program defaults: databases, dev servers, games"],
              ["49152–65535", "Dynamic (ephemeral)", "Temporary client ports for outgoing connections; never assigned to services"],
            ],
      },
      {
        type: "text",
        title: ru ? "Что такое порт" : "What a port is",
        paragraphs: ru
          ? [
              "IP-адрес указывает компьютер, а порт — конкретную программу на нём. Номер порта — число от 0 до 65535; TCP и UDP нумеруют порты независимо, поэтому TCP 53 и UDP 53 — разные «двери», хотя обе обычно отдают DNS.",
              "Номера из справочника — это значения по умолчанию. Любую службу можно перенастроить на другой порт, а за одним номером у разных программ бывают совсем разные службы, поэтому надёжнее проверить, какой процесс слушает порт, — команды есть на странице каждого порта.",
            ]
          : [
              "An IP address points to a computer; a port points to a specific program on it. A port number is 0 to 65535, and TCP and UDP number ports independently, so TCP 53 and UDP 53 are different “doors”, even though both usually serve DNS.",
              "The numbers here are defaults. Any service can be moved to another port, and different programs reuse the same number, so it's safer to check which process is actually listening — every port page has the commands.",
            ],
      },
    ],
    faq: ru
      ? [
          { q: "Сколько всего портов?", a: "65 536 для TCP и столько же для UDP: номера от 0 до 65535, потому что под номер порта в заголовке отведено 16 бит." },
          { q: "Как узнать, какая программа занимает порт?", a: "В Linux — sudo ss -ltnp 'sport = :ПОРТ', в macOS — sudo lsof -nP -iTCP:ПОРТ -sTCP:LISTEN, в Windows — netstat -ano | findstr :ПОРТ (последняя колонка — PID процесса)." },
          { q: "Какие порты нельзя открывать в интернет?", a: "Базы данных (3306, 5432, 27017, 6379, 9200), общие папки (445, 139, 2049), удалённый доступ без VPN (3389, 5900, 23), управляющие API (2375, 10250, 6443). Их массово сканируют и взламывают." },
          { q: "Чем TCP отличается от UDP?", a: "TCP устанавливает соединение и гарантирует доставку по порядку — для веба, почты, SSH. UDP отправляет датаграммы без гарантий — быстрее, для DNS, голоса, видео, игр и VPN вроде WireGuard." },
        ]
      : [
          { q: "How many ports are there?", a: "65,536 for TCP and as many for UDP: numbers 0 to 65535, because the port field in the header is 16 bits." },
          { q: "How do I find which program uses a port?", a: "On Linux run sudo ss -ltnp 'sport = :PORT', on macOS sudo lsof -nP -iTCP:PORT -sTCP:LISTEN, on Windows netstat -ano | findstr :PORT (the last column is the PID)." },
          { q: "Which ports should never face the Internet?", a: "Databases (3306, 5432, 27017, 6379, 9200), file shares (445, 139, 2049), remote access without a VPN (3389, 5900, 23) and control APIs (2375, 10250, 6443). They are scanned and attacked en masse." },
          { q: "What's the difference between TCP and UDP?", a: "TCP sets up a connection and guarantees ordered delivery — for web, mail, SSH. UDP sends datagrams without guarantees — faster, for DNS, voice, video, games and VPNs like WireGuard." },
        ],
    schemaType: "CollectionPage",
    icon: ICON,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── category pages ───────────── */

function catPage(c: PortCat, l: Locale): PageModel {
  const d = CAT_BY_ID.get(c)!;
  const tx = d[l];
  const ru = l === "ru";
  const list = PORTS.filter((p) => p.cat === c);
  return {
    path: [ID, c],
    sectionId: ID,
    kind: "hub",
    title: tx.title,
    h1: tx.h1,
    description: tx.desc,
    lead: tx.lead,
    breadcrumbs: [home(l), hubCrumb(l)],
    tool: { id: "port/search", props: { items: rows(list, l), only: c } },
    topBlocks: [
      { type: "links", title: ru ? "Порты этой категории" : "Ports in this category", style: "chips", items: list.map((p) => portLink(p, l)) },
      { type: "links", title: ru ? "Другие категории" : "Other categories", style: "chips", items: CATS.filter((x) => x.id !== c).map((x) => ({ ...catLink(x.id, l), icon: undefined, hue: undefined })) },
    ],
    blocks: [{ type: "text", title: ru ? "Безопасность" : "Security", paragraphs: [tx.sec] }],
    faq: ru
      ? [
          { q: `Какие порты относятся к категории «${tx.name}»?`, a: list.map((p) => `${p.port} — ${p.s[0]}`).slice(0, 14).join("; ") + (list.length > 14 ? " и другие." : ".") },
          { q: "Можно ли сменить порт службы?", a: "Да, почти любую службу можно перенастроить на другой номер в её конфигурации. Тогда клиентам нужно явно указывать новый порт, а правила файрвола — обновить." },
        ]
      : [
          { q: `Which ports belong to “${tx.name}”?`, a: list.map((p) => `${p.port} — ${p.s[1]}`).slice(0, 14).join("; ") + (list.length > 14 ? " and more." : ".") },
          { q: "Can I change a service's port?", a: "Yes, almost any service can be moved to another number in its configuration. Clients then need the new port explicitly, and firewall rules must be updated." },
        ],
    schemaType: "CollectionPage",
    icon: d.icon,
    hue: HUE,
    wide: true,
  };
}

/* ───────────── port pages ───────────── */

function portPage(p: PortDef, l: Locale): PageModel {
  const ru = l === "ru";
  const i = L(l);
  const s = p.s[i];
  const d = p.d[i];
  const cat = CAT_BY_ID.get(p.cat)!;
  const sec = p.sec ? p.sec[i] : cat[l].sec;
  const proto = protoText(p);

  const facts: [string, string][] = [
    [ru ? "Служба" : "Service", s],
    [ru ? "Транспорт" : "Transport", proto],
    [ru ? "Статус" : "Status", statusText(p, l)],
    [ru ? "Диапазон" : "Range", RANGE[rangeOf(p.port)][l]],
    [ru ? "Категория" : "Category", cat[l].name],
  ];
  if (p.sw) facts.push([ru ? "Типичное ПО" : "Typical software", p.sw]);

  const seen = new Set<number>([p.port]);
  const chips: PortDef[] = [];
  const push = (x?: PortDef) => {
    if (x && !seen.has(x.port)) {
      seen.add(x.port);
      chips.push(x);
    }
  };
  (p.related ?? []).forEach((r) => push(PORT_BY_NUM.get(r)));
  PORTS.filter((x) => x.cat === p.cat).forEach(push);
  const idx = PORTS.findIndex((x) => x.port === p.port);
  PORTS.slice(Math.max(0, idx - 6), idx + 7).forEach(push);
  POPULAR.forEach((n) => push(PORT_BY_NUM.get(n)));

  const blocks: Block[] = [
    { type: "facts", title: ru ? `Порт ${p.port} коротко` : `Port ${p.port} at a glance`, rows: facts },
    { type: "text", title: ru ? `Для чего нужен порт ${p.port}` : `What port ${p.port} is used for`, paragraphs: [d] },
    { type: "text", title: ru ? "Безопасность" : "Security", paragraphs: [sec] },
  ];

  const faq: QA[] = ru
    ? [
        { q: `Для чего используется порт ${p.port}?`, a: d },
        {
          q: `Как проверить, открыт ли порт ${p.port}?`,
          a: `Чтобы узнать, какая программа слушает порт локально, в Linux выполните sudo ss -l${p.proto.includes("tcp") ? "t" : "u"}np 'sport = :${p.port}', в Windows — netstat -ano | findstr :${p.port}. С другого компьютера: ${p.proto.includes("tcp") ? `nc -zv адрес ${p.port} или Test-NetConnection адрес -Port ${p.port}` : `sudo nmap -sU -p ${p.port} адрес`}.`,
        },
        { q: `Опасно ли открывать порт ${p.port} в интернет?`, a: sec },
      ]
    : [
        { q: `What is port ${p.port} used for?`, a: d },
        {
          q: `How do I check if port ${p.port} is open?`,
          a: `To see which program listens locally, run sudo ss -l${p.proto.includes("tcp") ? "t" : "u"}np 'sport = :${p.port}' on Linux or netstat -ano | findstr :${p.port} on Windows. From another machine: ${p.proto.includes("tcp") ? `nc -zv host ${p.port} or Test-NetConnection host -Port ${p.port}` : `sudo nmap -sU -p ${p.port} host`}.`,
        },
        { q: `Is it safe to open port ${p.port} to the Internet?`, a: sec },
      ];
  if (p.proto.length > 1)
    faq.push(
      ru
        ? { q: `Порт ${p.port} — TCP или UDP?`, a: `Оба: служба использует ${proto}. Открывая порт на роутере или в файрволе, разрешайте только тот протокол, который действительно нужен вашей программе.` }
        : { q: `Is port ${p.port} TCP or UDP?`, a: `Both: the service uses ${proto}. When opening it on a router or firewall, allow only the protocol your program actually needs.` },
    );

  const title = ru
    ? fit([`Порт ${p.port} — ${s}: для чего нужен и как проверить`, `Порт ${p.port} — ${s}: для чего нужен`, `Порт ${p.port} (${s})`, `Порт ${p.port} — для чего нужен и как проверить`])
    : fit([`Port ${p.port} — ${s}: What It Is and How to Check`, `Port ${p.port} — ${s}: What It Is Used For`, `Port ${p.port} (${s})`, `Port ${p.port} — What It Is and How to Check`]);
  const intro = leadText(d);
  const ruIntro = intro.replace(/^Порт \d+ — /, "").replace(/^Порты? [\d–]+ /, "").replace(/^[А-ЯЁ](?=[а-яё])/, (c) => c.toLowerCase());
  const base = ru ? `Порт ${p.port} (${proto}) — ${ruIntro}` : `Port ${p.port} (${proto}) — ${intro.replace(/^Port \d+ is /, "").replace(/^Ports? [\d–]+ (is |are )?/, "")}`;
  const description = describe(base, ru ? ["Как проверить, открыт ли порт, и чем опасно открывать его в интернет.", "Как проверить порт и риски.", "Проверка и риски."] : ["How to check whether it's open and the risks of exposing it.", "How to check it and the risks.", "Checks and risks."]);

  return {
    path: [ID, String(p.port)],
    sectionId: ID,
    kind: "entity",
    title,
    h1: ru ? `Порт ${p.port} (${s})` : `Port ${p.port} (${s})`,
    description,
    lead: firstSentence(d),
    breadcrumbs: [home(l), hubCrumb(l), { name: cat[l].name, path: [ID, p.cat] }],
    tool: { id: "port/check", props: { port: p.port, protos: p.proto, service: s, status: statusShort(p, l), official: p.official } },
    topBlocks: [{ type: "links", title: ru ? "Связанные и соседние порты" : "Related and nearby ports", style: "chips", items: chips.slice(0, 36).map((x) => portLink(x, l)) }],
    blocks,
    faq,
    related: [catLink(p.cat, l), { path: [ID], label: ru ? "Список портов TCP и UDP" : "TCP and UDP port list", hint: tr(DESC, l), icon: ICON, hue: HUE }],
    schemaType: "DefinedTerm",
    icon: cat.icon,
    hue: HUE,
  };
}

/* ───────────── section ───────────── */

export const portSection: SectionDef = {
  id: ID,
  name: NAME,
  description: DESC,
  icon: ICON,
  hue: HUE,
  category: "dev",
  order: 11,
  paths() {
    return [[], ...CATS.map((c) => [c.id]), ...PORTS.map((p) => [String(p.port)])];
  },
  resolve(locale, rest) {
    if (rest.length === 0) return hubPage(locale);
    if (rest.length !== 1) return null;
    const [s] = rest;
    if (CAT_BY_ID.has(s as PortCat)) return catPage(s as PortCat, locale);
    if (!/^(0|[1-9]\d{0,4})$/.test(s)) return null;
    const p = PORT_BY_NUM.get(Number(s));
    return p ? portPage(p, locale) : null;
  },
  search(locale) {
    const ru = locale === "ru";
    const out: SearchEntry[] = [
      { path: [ID], title: ru ? "Список портов TCP и UDP" : "TCP and UDP port list", hint: tr(NAME, locale), keywords: "порт порты port ports tcp udp список", weight: 3 },
      ...CATS.map((c) => ({ path: [ID, c.id], title: c[locale].h1, hint: tr(NAME, locale), keywords: c[locale].name, weight: 2 })),
    ];
    for (const p of PORTS)
      out.push({
        path: [ID, String(p.port)],
        title: ru ? `Порт ${p.port} — ${p.s[0]}` : `Port ${p.port} — ${p.s[1]}`,
        hint: protoText(p),
        keywords: `${p.port} ${ru ? "порт" : "port"} ${p.s[0]} ${p.s[1]} ${p.iana} ${p.sw ?? ""}`,
        weight: POPULAR.includes(p.port) ? 3 : 2,
      });
    return out;
  },
  featured(locale) {
    return [
      { path: [ID], label: locale === "ru" ? "Список портов" : "Port list", hint: tr(DESC, locale), icon: ICON, hue: HUE },
      ...[22, 443, 3389].map((n) => portLink(PORT_BY_NUM.get(n)!, locale)),
    ];
  },
  tools(locale) {
    return [{ path: [ID], label: locale === "ru" ? "Список портов TCP и UDP" : "TCP and UDP port list", hint: tr(DESC, locale), icon: ICON, hue: HUE }];
  },
};

