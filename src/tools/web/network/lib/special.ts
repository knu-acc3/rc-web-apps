/* IANA special-purpose address registries (IPv4 & IPv6) plus multicast/reserved blocks. */
import { maskOf, parseIPv4 } from "./ipv4";
import { mask6, parseIPv6 } from "./ipv6";

export type SpecialKind =
  | "public"
  | "private"
  | "cgnat"
  | "loopback"
  | "link-local"
  | "documentation"
  | "benchmark"
  | "multicast"
  | "reserved"
  | "this-network"
  | "broadcast"
  | "protocol"
  | "deprecated"
  | "ula"
  | "mapped"
  | "translation"
  | "tunnel"
  | "discard"
  | "unspecified";

export interface SpecialRange {
  cidr: string;
  kind: SpecialKind;
  ru: string;
  en: string;
  rfc: string;
  /** Routable on the public Internet? */
  global: boolean;
}

export const SPECIAL_V4: SpecialRange[] = [
  { cidr: "0.0.0.0/8", kind: "this-network", ru: "«Эта сеть» (источник при загрузке)", en: "“This network” (source only)", rfc: "RFC 791, RFC 1122", global: false },
  { cidr: "10.0.0.0/8", kind: "private", ru: "Частная сеть", en: "Private network", rfc: "RFC 1918", global: false },
  { cidr: "100.64.0.0/10", kind: "cgnat", ru: "Общее адресное пространство провайдера (CGNAT)", en: "Shared address space (carrier-grade NAT)", rfc: "RFC 6598", global: false },
  { cidr: "127.0.0.0/8", kind: "loopback", ru: "Loopback (сам компьютер)", en: "Loopback (this host)", rfc: "RFC 1122", global: false },
  { cidr: "169.254.0.0/16", kind: "link-local", ru: "Link-local (APIPA, автоадрес без DHCP)", en: "Link-local (APIPA, no DHCP)", rfc: "RFC 3927", global: false },
  { cidr: "172.16.0.0/12", kind: "private", ru: "Частная сеть", en: "Private network", rfc: "RFC 1918", global: false },
  { cidr: "192.0.0.0/24", kind: "protocol", ru: "Служебные назначения IETF", en: "IETF protocol assignments", rfc: "RFC 6890", global: false },
  { cidr: "192.0.2.0/24", kind: "documentation", ru: "Для документации (TEST-NET-1)", en: "Documentation (TEST-NET-1)", rfc: "RFC 5737", global: false },
  { cidr: "192.31.196.0/24", kind: "protocol", ru: "AS112-v4 (обратные зоны частных сетей)", en: "AS112-v4", rfc: "RFC 7535", global: true },
  { cidr: "192.52.193.0/24", kind: "protocol", ru: "AMT (туннелирование мультикаста)", en: "AMT (multicast tunnelling)", rfc: "RFC 7450", global: true },
  { cidr: "192.88.99.0/24", kind: "deprecated", ru: "Бывший anycast ретрансляторов 6to4 (устарел)", en: "Former 6to4 relay anycast (deprecated)", rfc: "RFC 7526", global: false },
  { cidr: "192.168.0.0/16", kind: "private", ru: "Частная сеть", en: "Private network", rfc: "RFC 1918", global: false },
  { cidr: "192.175.48.0/24", kind: "protocol", ru: "Прямое делегирование AS112", en: "Direct delegation AS112 service", rfc: "RFC 7534", global: true },
  { cidr: "198.18.0.0/15", kind: "benchmark", ru: "Тестирование производительности сетевого оборудования", en: "Network device benchmarking", rfc: "RFC 2544", global: false },
  { cidr: "198.51.100.0/24", kind: "documentation", ru: "Для документации (TEST-NET-2)", en: "Documentation (TEST-NET-2)", rfc: "RFC 5737", global: false },
  { cidr: "203.0.113.0/24", kind: "documentation", ru: "Для документации (TEST-NET-3)", en: "Documentation (TEST-NET-3)", rfc: "RFC 5737", global: false },
  { cidr: "224.0.0.0/4", kind: "multicast", ru: "Мультикаст (класс D)", en: "Multicast (class D)", rfc: "RFC 5771", global: false },
  { cidr: "224.0.0.0/24", kind: "multicast", ru: "Мультикаст: локальный управляющий блок", en: "Multicast: local network control block", rfc: "RFC 5771", global: false },
  { cidr: "233.252.0.0/24", kind: "documentation", ru: "Мультикаст для документации (MCAST-TEST-NET)", en: "Multicast documentation (MCAST-TEST-NET)", rfc: "RFC 6676", global: false },
  { cidr: "240.0.0.0/4", kind: "reserved", ru: "Зарезервировано (класс E)", en: "Reserved (class E)", rfc: "RFC 1112", global: false },
  { cidr: "255.255.255.255/32", kind: "broadcast", ru: "Ограниченный широковещательный адрес", en: "Limited broadcast", rfc: "RFC 919, RFC 8190", global: false },
];

export const SPECIAL_V6: SpecialRange[] = [
  { cidr: "::/128", kind: "unspecified", ru: "Неопределённый адрес", en: "Unspecified address", rfc: "RFC 4291", global: false },
  { cidr: "::1/128", kind: "loopback", ru: "Loopback (сам компьютер)", en: "Loopback", rfc: "RFC 4291", global: false },
  { cidr: "::/96", kind: "deprecated", ru: "IPv4-совместимый адрес (устарел)", en: "IPv4-compatible address (deprecated)", rfc: "RFC 4291", global: false },
  { cidr: "::ffff:0:0/96", kind: "mapped", ru: "IPv4-mapped (IPv4 внутри IPv6)", en: "IPv4-mapped address", rfc: "RFC 4291", global: false },
  { cidr: "64:ff9b::/96", kind: "translation", ru: "NAT64, общеизвестный префикс", en: "NAT64 well-known prefix", rfc: "RFC 6052", global: true },
  { cidr: "64:ff9b:1::/48", kind: "translation", ru: "NAT64 для локального использования", en: "Local-use NAT64 prefix", rfc: "RFC 8215", global: false },
  { cidr: "100::/64", kind: "discard", ru: "Discard-only (для чёрных дыр маршрутизации)", en: "Discard-only block", rfc: "RFC 6666", global: false },
  { cidr: "2001::/32", kind: "tunnel", ru: "Teredo (туннель IPv6 через UDP/IPv4)", en: "Teredo tunnelling", rfc: "RFC 4380", global: true },
  { cidr: "2001:2::/48", kind: "benchmark", ru: "Тестирование производительности", en: "Benchmarking", rfc: "RFC 5180", global: false },
  { cidr: "2001:20::/28", kind: "protocol", ru: "ORCHIDv2 (криптографические идентификаторы)", en: "ORCHIDv2", rfc: "RFC 7343", global: true },
  { cidr: "2001:db8::/32", kind: "documentation", ru: "Для документации", en: "Documentation", rfc: "RFC 3849", global: false },
  { cidr: "2002::/16", kind: "tunnel", ru: "6to4 (устаревший механизм туннелирования)", en: "6to4 (legacy tunnelling)", rfc: "RFC 3056", global: true },
  { cidr: "3fff::/20", kind: "documentation", ru: "Для документации (новый блок)", en: "Documentation (new block)", rfc: "RFC 9637", global: false },
  { cidr: "5f00::/16", kind: "protocol", ru: "SRv6 SID", en: "SRv6 SIDs", rfc: "RFC 9602", global: false },
  { cidr: "fc00::/7", kind: "ula", ru: "Уникальный локальный адрес (ULA, аналог частных сетей)", en: "Unique local address (ULA)", rfc: "RFC 4193", global: false },
  { cidr: "fe80::/10", kind: "link-local", ru: "Link-local (в пределах одного сегмента)", en: "Link-local unicast", rfc: "RFC 4291", global: false },
  { cidr: "ff00::/8", kind: "multicast", ru: "Мультикаст", en: "Multicast", rfc: "RFC 4291", global: false },
  { cidr: "2000::/3", kind: "public", ru: "Глобальный юникаст (публичный интернет)", en: "Global unicast (public Internet)", rfc: "RFC 4291", global: true },
];

interface Compiled4 {
  r: SpecialRange;
  net: number;
  mask: number;
  prefix: number;
}
interface Compiled6 {
  r: SpecialRange;
  net: bigint;
  mask: bigint;
  prefix: number;
}

const C4: Compiled4[] = SPECIAL_V4.map((r) => {
  const [a, p] = r.cidr.split("/");
  const prefix = Number(p);
  const ip = parseIPv4(a);
  if (!ip.ok) throw new Error(r.cidr);
  return { r, net: ip.value, mask: maskOf(prefix), prefix };
}).sort((a, b) => b.prefix - a.prefix);

const C6: Compiled6[] = SPECIAL_V6.map((r) => {
  const [a, p] = r.cidr.split("/");
  const prefix = Number(p);
  const ip = parseIPv6(a);
  if (!ip.ok) throw new Error(r.cidr);
  return { r, net: ip.value.value, mask: mask6(prefix), prefix };
}).sort((a, b) => b.prefix - a.prefix);

/** Most specific special-purpose block containing the address (null → ordinary public IPv4). */
export function special4(ip: number): SpecialRange | null {
  for (const c of C4) if (((ip & c.mask) >>> 0) === c.net) return c.r;
  return null;
}

export function special6(v: bigint): SpecialRange | null {
  for (const c of C6) if ((v & c.mask) === c.net) return c.r;
  return null;
}

export const MULTICAST_SCOPE: Record<number, { ru: string; en: string }> = {
  1: { ru: "интерфейс", en: "interface-local" },
  2: { ru: "канал (link-local)", en: "link-local" },
  3: { ru: "realm-local", en: "realm-local" },
  4: { ru: "административная", en: "admin-local" },
  5: { ru: "площадка (site-local)", en: "site-local" },
  8: { ru: "организация", en: "organization-local" },
  14: { ru: "глобальная", en: "global" },
};
