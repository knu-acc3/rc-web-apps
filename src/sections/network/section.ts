import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { defineToolSection } from "@/registry/tool-section";
import type { Block, QA, VariantDef } from "@/registry/types";
import { cidr4, maskOf, parseIPv4, subnetsOf, toBinary, toDotted, toHex, usableHosts, type Cidr4 } from "./lib/ipv4";
import { SPECIAL_V4, SPECIAL_V6 } from "./lib/special";

const fmt = (locale: Locale, n: number) => formatNumber(locale, n);
const HOSTS = { ru: ["хост", "хоста", "хостов"], en: ["host", "hosts"] } as const;
const ADDRS = { ru: ["адрес", "адреса", "адресов"], en: ["address", "addresses"] } as const;
const NETS = { ru: ["подсеть", "подсети", "подсетей"], en: ["subnet", "subnets"] } as const;
const hostsN = (l: Locale, n: number) => `${fmt(l, n)} ${plural(l, n, HOSTS[l])}`;
const addrsN = (l: Locale, n: number) => `${fmt(l, n)} ${plural(l, n, ADDRS[l])}`;
const netsN = (l: Locale, n: number) => `${fmt(l, n)} ${plural(l, n, NETS[l])}`;

const ip = (s: string) => {
  const r = parseIPv4(s);
  if (!r.ok) throw new Error(s);
  return r.value;
};

/* ───────────── subnet prefix pages ───────────── */

const PREFIX_NOTES: Record<number, { ru: string; en: string }> = {
  0: {
    ru: "/0 охватывает всё пространство IPv4. На практике встречается только как маршрут по умолчанию 0.0.0.0/0 — «всё, для чего нет более точного маршрута» — и в правилах файрвола «любой адрес».",
    en: "/0 covers the entire IPv4 space. In practice it only appears as the default route 0.0.0.0/0 — “everything without a more specific route” — and as “any address” in firewall rules.",
  },
  8: {
    ru: "/8 соответствует бывшему классу A. Целиком такие блоки выдавались в 1980-х крупным организациям; сегодня самый известный /8 — частная сеть 10.0.0.0/8 (RFC 1918), которую удобно делить на подсети для больших корпоративных сетей и облаков.",
    en: "/8 matches the old class A. Whole blocks like this were handed to large organisations in the 1980s; today the best-known /8 is the private network 10.0.0.0/8 (RFC 1918), convenient to carve up for large corporate networks and clouds.",
  },
  10: {
    ru: "/10 — размер блока 100.64.0.0/10, выделенного провайдерам под CGNAT (RFC 6598). Если ваш роутер получил адрес из этого диапазона, вы за NAT провайдера и «белого» IP у вас нет.",
    en: "/10 is the size of 100.64.0.0/10, reserved for carrier-grade NAT (RFC 6598). If your router's WAN address is in this range, you are behind your ISP's NAT and have no public IP.",
  },
  12: {
    ru: "/12 — это частный диапазон 172.16.0.0/12 (172.16.0.0–172.31.255.255) из RFC 1918. Его по умолчанию использует Docker для своих сетей (172.17.0.0/16 и далее).",
    en: "/12 is the private range 172.16.0.0/12 (172.16.0.0–172.31.255.255) from RFC 1918. Docker allocates its default networks from it (172.17.0.0/16 and up).",
  },
  16: {
    ru: "/16 соответствует бывшему классу B: 65 534 хоста. Частный блок 192.168.0.0/16 — это /16, а облачные VPC (AWS, Yandex Cloud и др.) часто создают именно размером /16 и делят на подсети /24.",
    en: "/16 matches the old class B: 65,534 hosts. The private 192.168.0.0/16 block is a /16, and cloud VPCs (AWS and others) are often created as a /16 and split into /24 subnets.",
  },
  20: {
    ru: "/20 — 4 096 адресов (16 сетей /24). Такой размер часто выбирают для подсетей Kubernetes-узлов и крупных VLAN; в AWS это типичный размер подсети в VPC по умолчанию.",
    en: "/20 is 4,096 addresses (16 × /24). It is a common size for Kubernetes node subnets and large VLANs; default VPC subnets in AWS are /20.",
  },
  22: {
    ru: "/22 объединяет четыре сети /24 — 1 022 хоста. Удобно для большого офиса или кампуса, когда одной /24 уже мало. До исчерпания свободного пула RIPE NCC в 2019 году именно /22 выдавали новым LIR.",
    en: "/22 joins four /24 networks — 1,022 hosts. Handy for a large office or campus when one /24 is too small. It is also the allocation size RIPE NCC handed to new LIRs before its free pool ran out.",
  },
  23: {
    ru: "/23 — две соседние сети /24 (например 192.168.0.0–192.168.1.255), 510 хостов. Помогает, когда в /24 закончились адреса, а перенумеровывать сеть не хочется.",
    en: "/23 is two adjacent /24 networks (e.g. 192.168.0.0–192.168.1.255), 510 hosts. Useful when a /24 has run out of addresses and you don't want to renumber.",
  },
  24: {
    ru: "/24 (255.255.255.0) — самая распространённая маска: так настроены почти все домашние роутеры (192.168.0.0/24, 192.168.1.0/24) и большинство офисных VLAN. Последний октет адреса — номер хоста от 1 до 254. /24 — также минимальный префикс, который принимают в глобальной таблице BGP.",
    en: "/24 (255.255.255.0) is the most common mask: nearly every home router (192.168.0.0/24, 192.168.1.0/24) and most office VLANs use it. The last octet is the host number, 1 to 254. /24 is also the longest prefix generally accepted in the global BGP table.",
  },
  25: {
    ru: "/25 делит /24 пополам: .0–.127 и .128–.255, по 126 хостов. Так разделяют, например, проводную сеть и Wi-Fi в одном /24.",
    en: "/25 splits a /24 in half: .0–.127 and .128–.255, 126 hosts each — e.g. wired and Wi-Fi within a single /24.",
  },
  26: {
    ru: "/26 — четверть /24: 64 адреса, 62 хоста. Границы подсетей: .0, .64, .128, .192. Типичный размер для небольшого отдела или сегмента серверов.",
    en: "/26 is a quarter of a /24: 64 addresses, 62 hosts. Subnet boundaries are .0, .64, .128 and .192. A typical size for a small department or a server segment.",
  },
  27: {
    ru: "/27 — 32 адреса и 30 хостов, восемь подсетей в /24 (.0, .32, .64 … .224). Подходит для сегмента видеонаблюдения, принтеров или небольшого филиала.",
    en: "/27 gives 32 addresses and 30 hosts, eight subnets per /24 (.0, .32, .64 … .224). Good for a CCTV segment, printers or a small branch.",
  },
  28: {
    ru: "/28 — 16 адресов и 14 хостов. Провайдеры часто выдают бизнес-клиентам блок «белых» адресов именно /28 или /29.",
    en: "/28 is 16 addresses and 14 hosts. ISPs often assign business customers a public block of /28 or /29.",
  },
  29: {
    ru: "/29 — 8 адресов, 6 хостов: обычно один уходит на шлюз провайдера, остальные 5 — ваши. Популярный размер блока статических IP для офиса.",
    en: "/29 is 8 addresses, 6 hosts: usually one goes to the ISP gateway, leaving 5 for you. A popular static IP block for an office.",
  },
  30: {
    ru: "/30 — 4 адреса и 2 хоста. Классический выбор для соединения «точка-точка» между двумя маршрутизаторами; сейчас его всё чаще заменяют на /31, который экономит два адреса.",
    en: "/30 gives 4 addresses and 2 hosts — the classic choice for a point-to-point link between two routers, increasingly replaced by /31, which saves two addresses.",
  },
  31: {
    ru: "/31 — особый случай (RFC 3021): 2 адреса, и оба используются хостами, потому что на канале «точка-точка» адрес сети и broadcast не нужны. Поддерживается Cisco, Juniper, MikroTik, Linux.",
    en: "/31 is a special case (RFC 3021): 2 addresses, both usable, because a point-to-point link needs neither a network nor a broadcast address. Supported by Cisco, Juniper, MikroTik and Linux.",
  },
  32: {
    ru: "/32 — один адрес: маршрут к конкретному хосту, адрес loopback-интерфейса маршрутизатора или запись в списке доступа «только этот IP».",
    en: "/32 is a single address: a host route, a router's loopback address or an access-list entry meaning “only this IP”.",
  },
};

function parentFor(p: number): Cidr4 {
  if (p >= 24) return { network: ip("192.168.1.0"), prefix: 24 };
  if (p >= 16) return { network: ip("172.16.0.0"), prefix: 16 };
  if (p >= 8) return { network: ip("10.0.0.0"), prefix: 8 };
  return { network: 0, prefix: 0 };
}

function hostsShort(l: Locale, p: number): string {
  if (p === 32) return l === "ru" ? "1 хост" : "1 host";
  if (p === 31) return l === "ru" ? "2 адреса (RFC 3021)" : "2 addresses (RFC 3021)";
  return hostsN(l, usableHosts(p));
}

function prefixBlocks(p: number, l: Locale): Block[] {
  const mask = maskOf(p);
  const total = 2 ** (32 - p);
  const ru = l === "ru";
  const rows: [string, string][] = [
    ["CIDR", `/${p}`],
    [ru ? "Маска" : "Netmask", toDotted(mask)],
    [ru ? "Wildcard (обратная маска)" : "Wildcard (inverse mask)", toDotted(~mask >>> 0)],
    [ru ? "Маска в hex" : "Mask in hex", toHex(mask)],
    [ru ? "Маска в двоичном виде" : "Mask in binary", toBinary(mask)],
    [ru ? "Всего адресов" : "Total addresses", fmt(l, total)],
    [ru ? "Доступно для хостов" : "Usable hosts", fmt(l, usableHosts(p))],
    [ru ? "Бит сети / бит хоста" : "Network / host bits", `${p} / ${32 - p}`],
  ];
  if (p === 8 || p === 16 || p === 24) rows.push([ru ? "Классовый эквивалент" : "Classful equivalent", ru ? `класс ${p === 8 ? "A" : p === 16 ? "B" : "C"}` : `class ${p === 8 ? "A" : p === 16 ? "B" : "C"}`]);
  for (const parent of [24, 16, 8]) {
    if (p > parent) {
      rows.push([ru ? `Таких подсетей в /${parent}` : `Subnets per /${parent}`, fmt(l, 2 ** (p - parent))]);
      break;
    }
  }
  if (p < 24) rows.push([ru ? "Сетей /24 внутри" : "/24 networks inside", fmt(l, 2 ** (24 - p))]);

  const parent = parentFor(p);
  const list = subnetsOf(parent, p, 64);
  const tableTitle = ru
    ? `Подсети /${p} в сети ${cidr4(parent)}: ${netsN(l, list.total)}${list.total > list.items.length ? `, показаны первые ${list.items.length}` : ""}`
    : `/${p} subnets of ${cidr4(parent)}: ${netsN(l, list.total)}${list.total > list.items.length ? `, first ${list.items.length} shown` : ""}`;
  const table: Block = {
    type: "table",
    title: tableTitle,
    head: ru ? ["Подсеть", "Адрес сети", "Диапазон хостов", "Broadcast"] : ["Subnet", "Network", "Host range", "Broadcast"],
    mono: true,
    rows: list.items.map((c) => {
      const last = c.network + total - 1;
      const range = p >= 31 ? `${toDotted(c.network)} – ${toDotted(last)}` : `${toDotted(c.network + 1)} – ${toDotted(last - 1)}`;
      return [cidr4(c), toDotted(c.network), range, p >= 31 ? "—" : toDotted(last)];
    }),
  };
  const note = PREFIX_NOTES[p];
  const blocks: Block[] = [{ type: "facts", title: ru ? `Маска /${p} коротко` : `/${p} at a glance`, rows }, table];
  blocks.push({
    type: "text",
    title: ru ? `Когда используют /${p}` : `When /${p} is used`,
    paragraphs: [
      note
        ? note[l]
        : ru
          ? `В сети /${p} под адрес сети отведено ${p} бит, под номер хоста — ${32 - p}. Это ${addrsN(l, total)}, из которых ${hostsN(l, usableHosts(p))} можно назначить устройствам: первый адрес — адрес сети, последний — широковещательный.`
          : `A /${p} network uses ${p} bits for the network and ${32 - p} for the host number: ${addrsN(l, total)}, of which ${hostsN(l, usableHosts(p))} can be assigned to devices — the first is the network address and the last is the broadcast.`,
      ru
        ? `Wildcard-маска ${toDotted(~mask >>> 0)} — это инверсия маски; её пишут в ACL Cisco и в OSPF (network … wildcard).`
        : `The wildcard ${toDotted(~mask >>> 0)} is the inverted mask used in Cisco ACLs and OSPF network statements.`,
    ],
  });
  return blocks;
}

function prefixFaq(p: number, l: Locale): QA[] {
  const mask = toDotted(maskOf(p));
  const wc = toDotted(~maskOf(p) >>> 0);
  const total = 2 ** (32 - p);
  if (l === "ru")
    return [
      {
        q: `Сколько хостов в подсети /${p}?`,
        a:
          p === 32
            ? "Один: /32 описывает ровно один адрес."
            : p === 31
              ? "Два: по RFC 3021 в сети /31 оба адреса назначаются интерфейсам, адреса сети и broadcast нет."
              : `${hostsN(l, usableHosts(p))}: всего в /${p} ${addrsN(l, total)}, минус адрес сети и широковещательный.`,
      },
      { q: `Какая маска соответствует /${p}?`, a: `/${p} = ${mask}, обратная (wildcard) маска — ${wc}, в шестнадцатеричном виде ${toHex(maskOf(p))}.` },
      { q: `Как записать маску /${p} в двоичном виде?`, a: `${toBinary(maskOf(p))} — ${p} единиц слева и ${32 - p} нулей справа.` },
    ];
  return [
    {
      q: `How many hosts are in a /${p} subnet?`,
      a:
        p === 32
          ? "One: a /32 describes exactly one address."
          : p === 31
            ? "Two: per RFC 3021 both addresses of a /31 are assigned to interfaces; there is no network or broadcast address."
            : `${hostsN(l, usableHosts(p))}: a /${p} has ${addrsN(l, total)}, minus the network and broadcast addresses.`,
    },
    { q: `What subnet mask is /${p}?`, a: `/${p} = ${mask}; the wildcard (inverse) mask is ${wc}, and in hex it is ${toHex(maskOf(p))}.` },
    { q: `What is /${p} in binary?`, a: `${toBinary(maskOf(p))} — ${p} ones followed by ${32 - p} zeros.` },
  ];
}

function prefixVariants(): VariantDef[] {
  return Array.from({ length: 33 }, (_, p) => {
    const mask = toDotted(maskOf(p));
    const wc = toDotted(~maskOf(p) >>> 0);
    const total = 2 ** (32 - p);
    return {
      slug: String(p),
      name: { ru: `/${p}`, en: `/${p}` },
      title: { ru: `Маска подсети /${p} — ${mask}, ${hostsShort("ru", p)}`, en: `/${p} subnet mask — ${mask}, ${hostsShort("en", p)}` },
      h1: { ru: `Маска подсети /${p} (${mask})`, en: `/${p} subnet mask (${mask})` },
      description: {
        ru: `Маска /${p} — это ${mask} (${toHex(maskOf(p))}): ${addrsN("ru", total)}, ${p === 31 ? "оба для хостов по RFC 3021" : hostsShort("ru", p)}, wildcard ${wc}. Таблица подсетей /${p}, двоичная запись и калькулятор.`,
        en: `The /${p} mask is ${mask} (${toHex(maskOf(p))}): ${addrsN("en", total)}, ${p === 31 ? "both usable per RFC 3021" : hostsShort("en", p)}, wildcard ${wc}. Table of /${p} subnets, binary form and a calculator.`,
      },
      lead: {
        ru: `/${p} = ${mask}: ${addrsN("ru", total)}, ${p === 31 ? "оба для хостов (RFC 3021)" : hostsShort("ru", p)}, обратная маска ${wc}.`,
        en: `/${p} = ${mask}: ${addrsN("en", total)}, ${p === 31 ? "both usable (RFC 3021)" : hostsShort("en", p)}, wildcard ${wc}.`,
      },
      props: { prefix: p },
      keywords: { ru: [`маска ${mask}`, `/${p}`, `префикс ${p}`], en: [`${mask} mask`, `/${p} cidr`, `prefix ${p}`] },
      blocks: (l: Locale) => prefixBlocks(p, l),
      faq: { ru: prefixFaq(p, "ru"), en: prefixFaq(p, "en") },
    };
  });
}

function maskTable(l: Locale): Block {
  const ru = l === "ru";
  return {
    type: "table",
    title: ru ? "Таблица масок подсети IPv4: от /0 до /32" : "IPv4 subnet mask table: /0 to /32",
    head: ru ? ["CIDR", "Маска", "Wildcard", "Адресов", "Хостов"] : ["CIDR", "Netmask", "Wildcard", "Addresses", "Hosts"],
    mono: true,
    rows: Array.from({ length: 33 }, (_, i) => 32 - i).map((p) => [`/${p}`, toDotted(maskOf(p)), toDotted(~maskOf(p) >>> 0), fmt(l, 2 ** (32 - p)), fmt(l, usableHosts(p))]),
  };
}

function specialTable(l: Locale): Block[] {
  const ru = l === "ru";
  return [
    {
      type: "table",
      title: ru ? "Специальные диапазоны IPv4" : "Special-purpose IPv4 ranges",
      head: ru ? ["Диапазон", "Назначение", "Стандарт"] : ["Range", "Purpose", "Standard"],
      rows: SPECIAL_V4.filter((r) => r.cidr !== "224.0.0.0/24").map((r) => [r.cidr, r[l], r.rfc]),
    },
    {
      type: "table",
      title: ru ? "Специальные диапазоны IPv6" : "Special-purpose IPv6 ranges",
      head: ru ? ["Префикс", "Назначение", "Стандарт"] : ["Prefix", "Purpose", "Standard"],
      rows: SPECIAL_V6.map((r) => [r.cidr, r[l], r.rfc]),
    },
  ];
}

/* ───────────── section ───────────── */

export const networkSection = defineToolSection({
  id: "network",
  name: { ru: "IP и сети", en: "IP & networks" },
  title: { ru: "IP-калькулятор и сетевые инструменты онлайн", en: "IP calculator & subnet tools online" },
  h1: { ru: "IP-калькулятор и сетевые инструменты", en: "IP calculator and network tools" },
  description: {
    ru: "IP-калькулятор подсетей IPv4 и IPv6: маска, wildcard, broadcast, диапазон хостов, CIDR ↔ диапазон, деление сети (VLSM), конвертер IP и MAC-адресов.",
    en: "IPv4 and IPv6 subnet calculator: netmask, wildcard, broadcast, host range, CIDR ↔ range, network splitting (VLSM), IP and MAC address converters.",
  },
  icon: "Router",
  hue: 200,
  category: "web",
  order: 4,
  hubBlocks: (l) => [
    {
      type: "text",
      title: l === "ru" ? "Всё считается в браузере" : "Everything runs in your browser",
      paragraphs:
        l === "ru"
          ? [
              "Калькуляторы работают без сервера: введённые адреса никуда не отправляются. Поддерживаются IPv4 (маски, wildcard, /31 и /32, специальные диапазоны вроде CGNAT 100.64.0.0/10) и IPv6 (сокращение по RFC 5952, обратные зоны ip6.arpa).",
              "Для каждой маски от /0 до /32 есть отдельная страница с таблицей подсетей — удобно, когда нужно быстро вспомнить, сколько хостов в /27 или какая маска у /22.",
            ]
          : [
              "The calculators work without a server: the addresses you type never leave the page. IPv4 (masks, wildcard, /31 and /32, special ranges such as CGNAT 100.64.0.0/10) and IPv6 (RFC 5952 compression, ip6.arpa reverse zones) are supported.",
              "Every mask from /0 to /32 has its own page with a subnet table — handy when you need to recall how many hosts a /27 has or what mask a /22 is.",
            ],
    },
    ...specialTable(l),
  ],
  tools: [
    {
      slug: "ip-calculator",
      component: "network/ip-calculator",
      icon: "Calculator",
      popular: true,
      name: { ru: "IP-калькулятор", en: "IP subnet calculator" },
      title: { ru: "IP-калькулятор подсетей IPv4 и IPv6 онлайн", en: "IP Subnet Calculator (IPv4 & IPv6) — CIDR, Mask" },
      h1: { ru: "IP-калькулятор подсетей", en: "IP subnet calculator" },
      description: {
        ru: "Калькулятор IP-подсетей: маска, wildcard, адрес сети и broadcast, первый и последний хост, число хостов (/31, /32), тип адреса (частный, CGNAT), IPv6.",
        en: "IP subnet calculator: netmask, wildcard, network and broadcast, first and last host, host count (/31, /32 rules), address type (private, CGNAT) and IPv6.",
      },
      lead: {
        ru: "Введите адрес с маской — сеть, broadcast, wildcard и диапазон хостов посчитаются сразу.",
        en: "Type an address with a mask — network, broadcast, wildcard and host range appear instantly.",
      },
      keywords: {
        ru: ["калькулятор подсетей", "ip калькулятор", "маска подсети", "wildcard", "broadcast", "cidr калькулятор"],
        en: ["subnet calculator", "ip calculator", "cidr calculator", "netmask", "wildcard mask", "broadcast address"],
      },
      howTo: {
        ru: [
          "Введите IP-адрес с префиксом (192.168.1.10/24) или с маской через пробел (10.0.0.5 255.255.0.0).",
          "Если префикса в строке нет, выберите маску в списке справа.",
          "Смотрите адрес сети, broadcast, wildcard, первый и последний хост и число доступных адресов.",
          "Ниже — объемлющие сети и соседние подсети того же размера; любое значение копируется кнопкой.",
          "Для IPv6 просто вставьте адрес с префиксом, например 2001:db8::1/64.",
        ],
        en: [
          "Type an IP address with a prefix (192.168.1.10/24) or with a mask after a space (10.0.0.5 255.255.0.0).",
          "If the line has no prefix, pick the mask from the list on the right.",
          "Read the network, broadcast, wildcard, first and last host and the number of usable addresses.",
          "Below are the containing networks and the adjacent subnets; every value has a copy button.",
          "For IPv6 just paste an address with a prefix, e.g. 2001:db8::1/64.",
        ],
      },
      faq: {
        ru: [
          { q: "Что такое wildcard-маска?", a: "Это маска, инвертированная побитно: для 255.255.255.0 wildcard равна 0.0.0.255. Её используют в ACL Cisco и в командах OSPF: единичные биты wildcard означают «любое значение»." },
          { q: "Почему в /31 два хоста, а не ноль?", a: "RFC 3021 разрешает использовать оба адреса /31 на каналах «точка-точка», где адрес сети и broadcast не нужны. Калькулятор учитывает это правило, а для /32 показывает один адрес — маршрут к хосту." },
          { q: "Как узнать, частный это адрес или публичный?", a: "Калькулятор сверяет адрес с реестром IANA: частные сети RFC 1918 (10/8, 172.16/12, 192.168/16), CGNAT 100.64.0.0/10, диапазоны для документации, тестирования (198.18.0.0/15), loopback, link-local и мультикаст." },
          { q: "Можно ли ввести маску вместо префикса?", a: "Да: 192.168.1.10/255.255.255.0 и «192.168.1.10 255.255.255.0» тоже работают. Маска должна быть непрерывной, иначе калькулятор покажет ошибку." },
          { q: "Адрес куда-нибудь отправляется?", a: "Нет. Все вычисления выполняются в вашем браузере, сетевых запросов инструмент не делает." },
        ],
        en: [
          { q: "What is a wildcard mask?", a: "The bitwise inverse of the netmask: for 255.255.255.0 it is 0.0.0.255. Cisco ACLs and OSPF network statements use it — one-bits in a wildcard mean “any value”." },
          { q: "Why does /31 have two hosts, not zero?", a: "RFC 3021 allows both addresses of a /31 to be used on point-to-point links, where no network or broadcast address is needed. The calculator applies that rule and shows a /32 as a single-host route." },
          { q: "How do I know whether an address is private or public?", a: "The calculator checks the IANA special-purpose registry: RFC 1918 private networks (10/8, 172.16/12, 192.168/16), CGNAT 100.64.0.0/10, documentation and benchmarking (198.18.0.0/15) ranges, loopback, link-local and multicast." },
          { q: "Can I type a mask instead of a prefix?", a: "Yes: 192.168.1.10/255.255.255.0 and “192.168.1.10 255.255.255.0” both work. The mask must be contiguous, otherwise you'll see an error." },
          { q: "Is my address sent anywhere?", a: "No. All calculations run in your browser; the tool makes no network requests." },
        ],
      },
      about: {
        ru: [
          "Калькулятор разбирает адрес и маску и показывает всё, что обычно нужно при настройке сети: адрес сети, broadcast, wildcard, диапазон хостов, число адресов, класс, двоичную и шестнадцатеричную запись, обратную зону DNS.",
          "Отдельно подсвечивается тип адреса: частный, CGNAT провайдера, loopback, link-local, мультикаст, диапазоны для документации и тестирования оборудования. Объемлющие сети считаются от самого адреса — например, для 10.1.2.0/24 это 10.1.2.0/23, 10.1.0.0/22 и так далее.",
        ],
        en: [
          "The calculator parses an address and mask and shows everything you usually need when configuring a network: network, broadcast, wildcard, host range, address count, class, binary and hex forms, and the reverse DNS zone.",
          "The address type is highlighted too: private, ISP CGNAT, loopback, link-local, multicast, documentation and benchmarking ranges. Containing networks are computed from the address itself — for 10.1.2.0/24 they are 10.1.2.0/23, 10.1.0.0/22 and so on.",
        ],
      },
      related: ["port"],
    },
    {
      slug: "subnet",
      component: "network/subnet-mask",
      icon: "Table",
      popular: true,
      name: { ru: "Маски подсети", en: "Subnet masks" },
      title: { ru: "Таблица масок подсети /0–/32 и калькулятор", en: "Subnet Mask Table /0–/32 & Mask Calculator" },
      h1: { ru: "Маски подсети: таблица CIDR", en: "Subnet mask cheat sheet (CIDR table)" },
      description: {
        ru: "Таблица масок подсети IPv4 от /0 до /32: маска, wildcard, число адресов и хостов. Перевод маски 255.255.255.0 в префикс /24 и обратно онлайн.",
        en: "IPv4 subnet mask table from /0 to /32: netmask, wildcard, addresses and hosts. Convert 255.255.255.0 to /24 and back online.",
      },
      lead: {
        ru: "Выберите префикс или введите маску — увидите wildcard, hex, двоичную запись и число хостов.",
        en: "Pick a prefix or type a mask to see the wildcard, hex and binary forms and the host count.",
      },
      keywords: { ru: ["таблица масок", "маска подсети", "cidr таблица", "255.255.255.0"], en: ["subnet mask table", "cidr cheat sheet", "netmask", "255.255.255.0"] },
      howTo: {
        ru: [
          "Выберите префикс в списке — например /26.",
          "Или введите маску в точечной записи (255.255.255.192), и префикс определится автоматически.",
          "Смотрите wildcard, маску в hex и двоичном виде, число адресов и хостов.",
          "Нужны все маски сразу — таблица ниже, а у каждого префикса есть своя страница с подсетями.",
        ],
        en: [
          "Pick a prefix from the list — for example /26.",
          "Or type a dotted mask (255.255.255.192) and the prefix is detected automatically.",
          "Read the wildcard, the hex and binary forms and the number of addresses and hosts.",
          "Need every mask at once? Use the table below; each prefix also has its own page with subnets.",
        ],
      },
      faq: {
        ru: [
          { q: "Как перевести маску в префикс?", a: "Посчитайте единичные биты: в 255.255.255.0 три октета по 8 единиц — это /24. Для 255.255.240.0: 8 + 8 + 4 = /20. Калькулятор выше делает это сам и проверяет, что маска непрерывная." },
          { q: "Почему хостов на 2 меньше, чем адресов?", a: "Первый адрес подсети — адрес самой сети, последний — широковещательный. Их нельзя назначить устройствам, поэтому в /24 256 адресов, но 254 хоста. Исключения — /31 (2 хоста, RFC 3021) и /32 (один адрес)." },
          { q: "Что значит wildcard 0.0.0.255?", a: "Это обратная маска к 255.255.255.0: биты, равные 1, могут быть любыми. Её пишут в ACL и OSPF на оборудовании Cisco." },
          { q: "Какая маска у домашней сети?", a: "Почти всегда 255.255.255.0 (/24): роутер раздаёт адреса вида 192.168.0.x или 192.168.1.x, где x — от 1 до 254." },
        ],
        en: [
          { q: "How do I convert a mask to a prefix?", a: "Count the one-bits: 255.255.255.0 has three octets of 8 ones, so /24. For 255.255.240.0 it's 8 + 8 + 4 = /20. The calculator above does it for you and checks that the mask is contiguous." },
          { q: "Why are there 2 fewer hosts than addresses?", a: "The first address is the network itself and the last is the broadcast, so neither can be assigned to a device: a /24 has 256 addresses but 254 hosts. Exceptions: /31 (2 hosts, RFC 3021) and /32 (one address)." },
          { q: "What does wildcard 0.0.0.255 mean?", a: "It is the inverse of 255.255.255.0: bits set to 1 may be anything. Cisco ACLs and OSPF use this notation." },
          { q: "What mask does a home network use?", a: "Almost always 255.255.255.0 (/24): the router hands out 192.168.0.x or 192.168.1.x, where x is 1 to 254." },
        ],
      },
      about: {
        ru: [
          "Маска подсети делит IPv4-адрес на номер сети и номер хоста. Запись /24 (CIDR) и 255.255.255.0 означают одно и то же: первые 24 бита — сеть, оставшиеся 8 — хосты.",
          "Таблица ниже покрывает все 33 префикса. Для каждого есть страница с фактами и перечнем подсетей — например, какие подсети /27 помещаются в 192.168.1.0/24.",
        ],
        en: [
          "A subnet mask splits an IPv4 address into a network number and a host number. /24 (CIDR) and 255.255.255.0 mean the same thing: the first 24 bits are the network, the remaining 8 the host.",
          "The table below covers all 33 prefixes. Each one has a page with facts and the list of subnets — for example, which /27 subnets fit in 192.168.1.0/24.",
        ],
      },
      blocks: (l) => [maskTable(l)],
      variants: { title: { ru: "Маска по префиксу", en: "Mask by prefix" }, list: prefixVariants, limit: 33 },
    },
    {
      slug: "cidr-to-range",
      component: "network/cidr-range",
      icon: "ArrowRightLeft",
      name: { ru: "CIDR в диапазон IP", en: "CIDR to IP range" },
      title: { ru: "CIDR в диапазон IP-адресов онлайн", en: "CIDR to IP Range Converter (IPv4 & IPv6)" },
      description: {
        ru: "Перевод сетей CIDR в диапазоны IP-адресов: 10.0.0.0/22 → 10.0.0.0 - 10.0.3.255. Пакетно, IPv4 и IPv6, с подсчётом числа адресов.",
        en: "Convert CIDR networks to IP ranges: 10.0.0.0/22 → 10.0.0.0 - 10.0.3.255. Batch mode, IPv4 and IPv6, with address counts.",
      },
      lead: { ru: "Вставьте сети CIDR по одной в строке — получите первый и последний адрес каждой.", en: "Paste CIDR networks one per line to get the first and last address of each." },
      props: { mode: "cidr-to-range" },
      keywords: { ru: ["cidr в диапазон", "диапазон ip по маске"], en: ["cidr to range", "cidr to ip list"] },
      howTo: {
        ru: ["Вставьте одну или несколько сетей в формате адрес/префикс.", "Справа сразу появятся диапазоны «начало - конец».", "Скопируйте результат или скачайте его текстовым файлом."],
        en: ["Paste one or more networks as address/prefix.", "The start - end ranges appear on the right instantly.", "Copy the result or download it as a text file."],
      },
      faq: {
        ru: [
          { q: "Адрес не выровнен по префиксу — это ошибка?", a: "Нет: для 10.0.0.7/24 будет показан диапазон всей сети 10.0.0.0 - 10.0.0.255, как это делают маршрутизаторы." },
          { q: "Поддерживается IPv6?", a: "Да, например 2001:db8::/48 → 2001:db8:: - 2001:db8:0:ffff:ffff:ffff:ffff:ffff." },
          { q: "Сколько строк можно обработать?", a: "Тысячи — всё считается локально в браузере, ограничение только в памяти устройства." },
        ],
        en: [
          { q: "The address isn't aligned to the prefix — is that an error?", a: "No: for 10.0.0.7/24 you get the whole network range 10.0.0.0 - 10.0.0.255, just like a router would compute." },
          { q: "Is IPv6 supported?", a: "Yes, e.g. 2001:db8::/48 → 2001:db8:: - 2001:db8:0:ffff:ffff:ffff:ffff:ffff." },
          { q: "How many lines can it handle?", a: "Thousands — everything is computed locally in your browser." },
        ],
      },
      about: {
        ru: ["Инструмент переводит запись CIDR в явный диапазон адресов — это нужно для правил файрвола, геофильтров и систем, которые не понимают префиксы. Для обратной задачи есть конвертер «диапазон в CIDR»."],
        en: ["The tool expands CIDR notation into explicit address ranges — useful for firewall rules, geo filters and systems that don't understand prefixes. For the reverse task use the range to CIDR converter."],
      },
    },
    {
      slug: "range-to-cidr",
      component: "network/cidr-range",
      icon: "ArrowLeftRight",
      name: { ru: "Диапазон IP в CIDR", en: "IP range to CIDR" },
      title: { ru: "Диапазон IP-адресов в CIDR онлайн", en: "IP Range to CIDR Converter — Minimal Blocks" },
      description: {
        ru: "Перевод произвольного диапазона IP в минимальный набор сетей CIDR: 10.0.0.1 - 10.0.0.10 → 5 блоков. Пакетная обработка, IPv4 и IPv6, в браузере.",
        en: "Convert any IP range into the minimal set of CIDR blocks: 10.0.0.1 - 10.0.0.10 → 5 blocks. Batch processing, IPv4 and IPv6, in your browser.",
      },
      lead: { ru: "Введите диапазоны «начало - конец» — получите минимальный список сетей CIDR.", en: "Enter start - end ranges to get the minimal list of CIDR networks." },
      props: { mode: "range-to-cidr" },
      keywords: { ru: ["диапазон в cidr", "ip range to cidr"], en: ["range to cidr", "ip range to subnet"] },
      howTo: {
        ru: ["Введите диапазоны по одному в строке: 192.168.1.0 - 192.168.2.255.", "Инструмент разобьёт каждый на выровненные блоки CIDR минимального количества.", "Скопируйте список или скачайте файл cidr.txt."],
        en: ["Enter ranges one per line: 192.168.1.0 - 192.168.2.255.", "Each range is split into the fewest aligned CIDR blocks.", "Copy the list or download cidr.txt."],
      },
      faq: {
        ru: [
          { q: "Почему получилось несколько сетей?", a: "Префикс описывает только блоки размером 2ⁿ, выровненные по своей границе. Диапазон 10.0.0.1 - 10.0.0.10 не выровнен, поэтому покрывается пятью блоками: /32, /31, /30, /31 и /32." },
          { q: "Список точно минимальный?", a: "Да: на каждом шаге берётся самый большой выровненный блок, который не выходит за конец диапазона, — такой жадный алгоритм даёт минимальное покрытие." },
          { q: "Можно ли писать диапазон через тире без пробелов?", a: "Да: «10.0.0.1-10.0.0.10», «10.0.0.1 - 10.0.0.10» и два адреса через пробел работают одинаково." },
        ],
        en: [
          { q: "Why did I get several networks?", a: "A prefix can only describe blocks of 2ⁿ addresses aligned to their size. 10.0.0.1 - 10.0.0.10 isn't aligned, so it takes five blocks: /32, /31, /30, /31 and /32." },
          { q: "Is the list really minimal?", a: "Yes: each step takes the largest aligned block that doesn't pass the end of the range; this greedy algorithm yields the minimal cover." },
          { q: "Can I write the range with a dash and no spaces?", a: "Yes: “10.0.0.1-10.0.0.10”, “10.0.0.1 - 10.0.0.10” and two addresses separated by a space all work." },
        ],
      },
      about: {
        ru: ["Многие системы — маршрутизаторы, файрволы, облачные группы безопасности — принимают только сети CIDR. Конвертер превращает произвольный диапазон, например из выписки провайдера или базы геолокации, в минимальный набор префиксов."],
        en: ["Many systems — routers, firewalls, cloud security groups — accept only CIDR networks. The converter turns an arbitrary range, e.g. from an ISP notice or a geolocation database, into the minimal set of prefixes."],
      },
    },
    {
      slug: "ip-converter",
      component: "network/ip-converter",
      icon: "Binary",
      name: { ru: "Конвертер IP-адресов", en: "IP address converter" },
      title: { ru: "Конвертер IP: в число, hex, двоичный вид", en: "IP Address Converter — Decimal, Hex, Binary" },
      description: {
        ru: "Перевод IPv4-адреса в 32-битное число, hex и двоичный вид и обратно: 192.168.1.10 = 3232235786 = 0xC0A8010A. Плюс IPv4-mapped IPv6 и обратная зона.",
        en: "Convert an IPv4 address to a 32-bit integer, hex and binary and back: 192.168.1.10 = 3232235786 = 0xC0A8010A. Plus IPv4-mapped IPv6 and reverse DNS.",
      },
      lead: { ru: "Введите адрес в любой записи — остальные формы появятся сразу.", en: "Type an address in any notation to see all other forms instantly." },
      keywords: { ru: ["ip в число", "ip в двоичный", "ip hex"], en: ["ip to decimal", "ip to binary", "ip to hex", "integer to ip"] },
      howTo: {
        ru: ["Введите адрес: 192.168.1.10, 3232235786, 0xC0A8010A, двоичную строку или ::ffff:192.168.1.10.", "Инструмент сам определит формат записи.", "Скопируйте нужное представление кнопкой рядом со значением."],
        en: ["Type an address: 192.168.1.10, 3232235786, 0xC0A8010A, a binary string or ::ffff:192.168.1.10.", "The tool detects the notation automatically.", "Copy any representation with the button next to it."],
      },
      faq: {
        ru: [
          { q: "Зачем хранить IP как число?", a: "В базах данных адрес в виде 32-битного целого занимает 4 байта и позволяет искать по диапазонам через BETWEEN. В MySQL для этого есть INET_ATON() и INET_NTOA()." },
          { q: "Что такое IPv4-mapped IPv6?", a: "Это запись IPv4-адреса внутри IPv6: ::ffff:192.168.1.10. Так IPv4-клиенты видны приложениям, которые слушают IPv6-сокет в режиме dual-stack." },
          { q: "Почему 010.0.0.1 не принимается?", a: "Ведущие нули неоднозначны: часть программ читает 010 как восьмеричное число 8. Чтобы избежать ошибок, конвертер требует запись без ведущих нулей." },
        ],
        en: [
          { q: "Why store an IP as an integer?", a: "As a 32-bit integer an address takes 4 bytes in a database and supports range queries with BETWEEN. MySQL has INET_ATON() and INET_NTOA() for this." },
          { q: "What is an IPv4-mapped IPv6 address?", a: "It is an IPv4 address embedded in IPv6: ::ffff:192.168.1.10. That's how IPv4 clients appear to applications listening on a dual-stack IPv6 socket." },
          { q: "Why is 010.0.0.1 rejected?", a: "Leading zeros are ambiguous: some software reads 010 as octal 8. To avoid surprises the converter requires addresses without leading zeros." },
        ],
      },
      about: {
        ru: ["IPv4-адрес — это просто 32-битное число, а точечная запись — удобная форма для людей. Конвертер показывает адрес во всех распространённых представлениях, включая IPv4-mapped IPv6 в смешанной и шестнадцатеричной записи и префикс 6to4."],
        en: ["An IPv4 address is just a 32-bit number; dotted decimal is a human-friendly form. The converter shows the address in all common notations, including IPv4-mapped IPv6 in mixed and hex form and the 6to4 prefix."],
      },
    },
    {
      slug: "ipv6",
      component: "network/ipv6",
      icon: "Globe",
      name: { ru: "Сокращение и развёртывание IPv6", en: "IPv6 compress & expand" },
      title: { ru: "IPv6: сокращение и полная запись адреса онлайн", en: "IPv6 Compress & Expand Tool (RFC 5952)" },
      h1: { ru: "Сокращение и полная запись IPv6", en: "IPv6 address compress and expand" },
      description: {
        ru: "Сокращение IPv6 по RFC 5952 и полная запись: 2001:0db8:0000:0000:0000:ff00:0042:8329 ↔ 2001:db8::ff00:42:8329. Тип адреса и обратная зона ip6.arpa.",
        en: "Compress IPv6 per RFC 5952 and expand it: 2001:0db8:0000:0000:0000:ff00:0042:8329 ↔ 2001:db8::ff00:42:8329. Address type and ip6.arpa reverse zone.",
      },
      lead: { ru: "Вставьте IPv6-адреса — получите каноническую короткую и полную запись, тип и ip6.arpa.", en: "Paste IPv6 addresses to get the canonical short and full forms, type and ip6.arpa name." },
      keywords: { ru: ["ipv6 сокращение", "ipv6 полная запись", "ip6.arpa"], en: ["ipv6 compress", "ipv6 expand", "ipv6 shortener", "ip6.arpa"] },
      howTo: {
        ru: ["Вставьте один или несколько IPv6-адресов, по одному в строке.", "Сверху — каноническая короткая запись, рядом — полная из 32 шестнадцатеричных цифр.", "Для настройки DNS скопируйте имя обратной зоны ip6.arpa."],
        en: ["Paste one or more IPv6 addresses, one per line.", "You get the canonical compressed form and the full 32-hex-digit form.", "For DNS setup copy the ip6.arpa reverse name."],
      },
      faq: {
        ru: [
          { q: "Какие правила сокращения IPv6?", a: "RFC 5952: ведущие нули в группах убираются, самая длинная серия из двух и более нулевых групп заменяется на «::» (при равенстве — левая), одиночная нулевая группа не сокращается, буквы пишутся строчными." },
          { q: "Почему :: можно написать только один раз?", a: "Иначе адрес станет неоднозначным: непонятно, сколько нулевых групп скрыто в каждом «::»." },
          { q: "Как записывается IPv4 внутри IPv6?", a: "Для IPv4-mapped адресов RFC 5952 рекомендует смешанную запись: ::ffff:192.0.2.1 вместо ::ffff:c000:201." },
        ],
        en: [
          { q: "What are the IPv6 compression rules?", a: "RFC 5952: drop leading zeros in each group, replace the longest run of two or more zero groups with “::” (the leftmost on a tie), never shorten a single zero group, use lowercase letters." },
          { q: "Why can “::” appear only once?", a: "Otherwise the address is ambiguous: you couldn't tell how many zero groups each “::” hides." },
          { q: "How is IPv4 written inside IPv6?", a: "For IPv4-mapped addresses RFC 5952 recommends mixed notation: ::ffff:192.0.2.1 rather than ::ffff:c000:201." },
        ],
      },
      about: {
        ru: ["Один и тот же IPv6-адрес можно записать десятками способов, поэтому для логов, конфигов и сравнения адресов удобна каноническая форма из RFC 5952. Инструмент приводит адреса к ней, показывает полную запись и определяет тип: link-local, ULA, документационный, мультикаст и другие."],
        en: ["The same IPv6 address can be written in dozens of ways, so logs, configs and comparisons benefit from the RFC 5952 canonical form. The tool normalises addresses, shows the full form and detects the type: link-local, ULA, documentation, multicast and more."],
      },
    },
    {
      slug: "mac",
      component: "network/mac",
      icon: "Cpu",
      name: { ru: "Форматирование MAC-адреса", en: "MAC address formatter" },
      title: { ru: "MAC-адрес: форматы, биты I/G и U/L, EUI-64", en: "MAC Address Formatter — Formats, I/G & U/L, EUI-64" },
      h1: { ru: "Форматирование и разбор MAC-адреса", en: "MAC address formatter and analyser" },
      description: {
        ru: "Перевод MAC-адреса между форматами 00:1A:2B…, 00-1A-2B…, 001a.2b3c.4d5e. Показывает юникаст/мультикаст, локально администрируемый бит и EUI-64 для IPv6.",
        en: "Convert a MAC address between 00:1A:2B…, 00-1A-2B… and 001a.2b3c.4d5e formats. Shows unicast/multicast, the locally administered bit and IPv6 EUI-64.",
      },
      lead: { ru: "Вставьте MAC в любом формате — получите все варианты записи и разбор служебных битов.", en: "Paste a MAC in any format to get every notation and the special bits decoded." },
      keywords: { ru: ["mac адрес формат", "mac cisco формат", "eui-64"], en: ["mac address format", "mac converter", "eui-64", "locally administered mac"] },
      howTo: {
        ru: ["Вставьте MAC-адрес в любом формате — с двоеточиями, дефисами, точками или без разделителей.", "Выберите регистр букв.", "Скопируйте нужный формат: для Linux, Windows или оборудования Cisco.", "Проверьте биты: мультикаст ли это адрес и не случайный ли он (локально администрируемый)."],
        en: ["Paste a MAC address in any format — with colons, hyphens, dots or no separators.", "Choose the letter case.", "Copy the format you need: Linux, Windows or Cisco.", "Check the bits: is it multicast, and is it randomised (locally administered)?"],
      },
      faq: {
        ru: [
          { q: "Как понять, что MAC-адрес случайный?", a: "У случайных «частных» MAC, которые используют iOS, Android и Windows для Wi-Fi, установлен бит U/L — второй младший бит первого байта. Вторая шестнадцатеричная цифра такого адреса — 2, 6, A или E." },
          { q: "Можно узнать производителя по MAC?", a: "Первые три байта (OUI) выдаёт IEEE производителю, но мы намеренно не делаем поиск: база постоянно меняется, а у случайных MAC производителя нет. Для локально администрируемых адресов OUI ничего не значит." },
          { q: "Что такое EUI-64?", a: "Способ получить 64-битный идентификатор интерфейса IPv6 из MAC: в середину вставляется FFFE и инвертируется бит U/L. Так формируются link-local-адреса fe80:: при SLAAC без расширений приватности." },
        ],
        en: [
          { q: "How can I tell a MAC address is randomised?", a: "Randomised “private” Wi-Fi MACs on iOS, Android and Windows have the U/L bit set — the second-lowest bit of the first byte. The second hex digit of such an address is 2, 6, A or E." },
          { q: "Can I find the manufacturer from a MAC?", a: "The first three bytes (OUI) are assigned by the IEEE to a vendor, but we deliberately don't look them up: the registry changes constantly and randomised MACs have no vendor at all." },
          { q: "What is EUI-64?", a: "A way to derive a 64-bit IPv6 interface ID from a MAC: insert FFFE in the middle and flip the U/L bit. SLAAC without privacy extensions builds fe80:: link-local addresses this way." },
        ],
      },
      about: {
        ru: ["Разные системы пишут MAC-адрес по-разному: Linux и macOS — через двоеточие, Windows — через дефис, Cisco — группами по четыре цифры через точку. Инструмент приводит адрес к любому из этих форматов и разбирает служебные биты первого байта."],
        en: ["Different systems write MAC addresses differently: Linux and macOS use colons, Windows uses hyphens, Cisco uses dotted groups of four. The tool converts between these formats and decodes the special bits of the first byte."],
      },
    },
    {
      slug: "subnet-divider",
      component: "network/subnet-divider",
      icon: "Split",
      name: { ru: "Деление сети на подсети", en: "Subnet divider (VLSM)" },
      title: { ru: "Разделить сеть на подсети онлайн (VLSM)", en: "Subnet Divider — Split a Network into Subnets (VLSM)" },
      h1: { ru: "Деление сети на подсети", en: "Split a network into subnets" },
      description: {
        ru: "Разбиение IPv4-сети на N равных подсетей или по числу хостов (VLSM): маски, диапазоны, broadcast и свободный остаток. Экспорт таблицы в CSV.",
        en: "Split an IPv4 network into N equal subnets or by required host counts (VLSM): masks, ranges, broadcast and leftover space. Export the table to CSV.",
      },
      lead: { ru: "Укажите сеть и сколько подсетей нужно или сколько хостов в каждой — план адресации готов сразу.", en: "Enter a network and how many subnets or hosts you need — the addressing plan is ready instantly." },
      keywords: { ru: ["разбить сеть на подсети", "vlsm калькулятор", "деление подсети"], en: ["subnet divider", "vlsm calculator", "split subnet"] },
      howTo: {
        ru: [
          "Введите исходную сеть, например 192.168.0.0/24.",
          "Выберите способ: на N равных частей или по числу хостов (VLSM).",
          "Для VLSM перечислите подсети с числом хостов — «Офис 100», «Склад 50».",
          "Проверьте таблицу: маски, диапазоны хостов и свободный остаток.",
          "Скопируйте таблицу или скачайте её в CSV.",
        ],
        en: [
          "Enter the network to divide, e.g. 192.168.0.0/24.",
          "Choose the method: N equal parts or by host count (VLSM).",
          "For VLSM list the subnets with host counts — “Office 100”, “Warehouse 50”.",
          "Review the table: masks, host ranges and leftover space.",
          "Copy the table or download it as CSV.",
        ],
      },
      faq: {
        ru: [
          { q: "Почему нельзя разделить сеть ровно на 3 части?", a: "Префикс описывает блоки размером 2ⁿ, поэтому равных частей может быть 2, 4, 8… При запросе трёх подсетей инструмент создаст четыре и сообщит об этом. Если нужны подсети разного размера — используйте VLSM." },
          { q: "Как работает VLSM?", a: "Для каждой подсети берётся минимальный блок, вмещающий нужное число хостов плюс адрес сети и broadcast. Блоки размещаются от большего к меньшему — так они всегда выровнены и не пересекаются." },
          { q: "Что делать, если не помещается?", a: "Возьмите сеть побольше (например /23 вместо /24) или уменьшите требования. Инструмент покажет, какая подсеть не поместилась." },
          { q: "Можно ли использовать /31 для каналов?", a: "Да, включите соответствующую опцию: подсеть на 2 хоста получит /31 (RFC 3021) вместо /30 и сэкономит два адреса." },
        ],
        en: [
          { q: "Why can't I split a network into exactly 3 parts?", a: "Prefixes describe blocks of 2ⁿ addresses, so equal parts come in 2, 4, 8… Ask for three and you get four, with a note. For different sizes use VLSM." },
          { q: "How does VLSM work?", a: "Each subnet gets the smallest block that fits the requested hosts plus the network and broadcast addresses. Blocks are placed largest first, so they are always aligned and never overlap." },
          { q: "What if it doesn't fit?", a: "Use a bigger network (e.g. /23 instead of /24) or reduce the requirements. The tool tells you which subnet didn't fit." },
          { q: "Can I use /31 for links?", a: "Yes, enable the option: a 2-host subnet then gets a /31 (RFC 3021) instead of a /30, saving two addresses." },
        ],
      },
      about: {
        ru: [
          "Планирование адресации — первая задача при проектировании сети: офис, Wi-Fi для гостей, серверы, камеры и каналы между маршрутизаторами обычно живут в разных подсетях.",
          "Инструмент делит сеть поровну или по методу VLSM (маски переменной длины) и показывает свободное место в виде минимального набора сетей CIDR — его можно оставить под рост.",
        ],
        en: [
          "Address planning is the first step in network design: office, guest Wi-Fi, servers, cameras and router links usually live in separate subnets.",
          "The tool splits a network equally or with VLSM (variable-length subnet masks) and shows the free space as a minimal set of CIDR networks you can keep for growth.",
        ],
      },
    },
  ],
});
