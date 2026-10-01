"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Badge, Notice } from "@/ui/panel";
import { adjacent, cidr4, maskOf, parseV4Input, supernets, toBinary, toDotted, toHex, v4Info } from "./lib/ipv4";
import { compress, expand, isV4Mapped, parseV6Input, reverse4, reverse6, v6Info } from "./lib/ipv6";
import { MULTICAST_SCOPE, special4, special6, type SpecialRange } from "./lib/special";
import { bigFmt, DetailList, err4, err6, ResultCard, Split, type ValueRow } from "./ui/shared";

const T = {
  ru: {
    input: "IP-адрес и маска",
    inputHint: "192.168.1.10/24, 10.0.0.5 255.255.0.0 или 2001:db8::1/64",
    prefix: "Маска",
    hostsLine: "Хосты",
    mask: "Маска",
    wildcard: "Wildcard (обратная маска)",
    wc: "wildcard",
    netAddr: "Адрес сети",
    broadcast: "Broadcast",
    first: "Первый хост",
    last: "Последний хост",
    total: "Всего адресов",
    usable: "Адресов для хостов",
    cls: "Класс (исторический)",
    binAddr: "Адрес в двоичном виде",
    binMask: "Маска в двоичном виде",
    hex: "Адрес в hex",
    int: "Адрес целым числом",
    rdns: "Обратная зона DNS",
    supernets: "Объемлющие сети",
    neighbours: "Соседние подсети",
    public: "Публичный адрес",
    noBroadcast: "нет",
    p2p: "/31 — канал «точка-точка» (RFC 3021): оба адреса используются хостами, broadcast нет.",
    host: "/32 — маршрут к одному хосту: сеть из одного адреса.",
    compressed: "Сокращённая запись",
    expanded: "Полная запись",
    v6first: "Первый адрес",
    v6last: "Последний адрес",
    v6count: "Адресов в сети",
    mapped: "Встроенный IPv4",
    scope: "Область мультикаста",
    zone: "Идентификатор зоны",
    hostsForms: ["хост", "хоста", "хостов"],
    addrForms: ["адрес", "адреса", "адресов"],
  },
  en: {
    input: "IP address and mask",
    inputHint: "192.168.1.10/24, 10.0.0.5 255.255.0.0 or 2001:db8::1/64",
    prefix: "Mask",
    hostsLine: "Hosts",
    mask: "Netmask",
    wildcard: "Wildcard (inverse mask)",
    wc: "wildcard",
    netAddr: "Network address",
    broadcast: "Broadcast",
    first: "First host",
    last: "Last host",
    total: "Total addresses",
    usable: "Usable hosts",
    cls: "Class (historical)",
    binAddr: "Address in binary",
    binMask: "Mask in binary",
    hex: "Address in hex",
    int: "Address as integer",
    rdns: "Reverse DNS zone",
    supernets: "Containing networks",
    neighbours: "Adjacent subnets",
    public: "Public address",
    noBroadcast: "none",
    p2p: "/31 is a point-to-point link (RFC 3021): both addresses are usable, there is no broadcast.",
    host: "/32 is a host route: a network of one address.",
    compressed: "Compressed form",
    expanded: "Expanded form",
    v6first: "First address",
    v6last: "Last address",
    v6count: "Addresses in network",
    mapped: "Embedded IPv4",
    scope: "Multicast scope",
    zone: "Zone ID",
    hostsForms: ["host", "hosts"],
    addrForms: ["address", "addresses"],
  },
} as const;

function TypeBadge({ sp, locale }: { sp: SpecialRange | null; locale: Locale }) {
  return (
    <>
      <Badge tone={sp && !sp.global ? "warn" : "ok"}>{sp ? sp[locale] : T[locale].public}</Badge>
      {sp && <span className="text-sm text-fg-3">{`${sp.cidr} · ${sp.rfc}`}</span>}
    </>
  );
}

export default function IpCalculator({ locale, value = "192.168.1.10/24" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const [fallbackPrefix, setFallbackPrefix] = useState(24);
  const isV6 = text.includes(":");

  const v4 = useMemo(() => (isV6 ? null : parseV4Input(text, fallbackPrefix)), [isV6, text, fallbackPrefix]);
  const v6 = useMemo(() => (isV6 ? parseV6Input(text, 64) : null), [isV6, text]);
  const prefixShown = v4?.ok ? v4.value.prefix : fallbackPrefix;

  function onPrefix(p: number) {
    setFallbackPrefix(p);
    if (v4?.ok && v4.value.explicit) setText(`${toDotted(v4.value.ip)}/${p}`);
  }

  const error = v4 && !v4.ok ? err4(locale, v4.error) : v6 && !v6.ok ? err6(locale, v6.error) : null;

  return (
    <Split
      input={
        <>
          <Field label={t.input} htmlFor={`${id}-ip`} hint={t.inputHint}>
            <Input id={`${id}-ip`} value={text} onChange={(e) => setText(e.target.value)} size="lg" className="font-mono" spellCheck={false} autoComplete="off" autoCapitalize="off" aria-invalid={!!error} />
          </Field>
          {!isV6 && (
            <Field label={t.prefix} htmlFor={`${id}-p`}>
              <Select id={`${id}-p`} value={prefixShown} onChange={(e) => onPrefix(Number(e.target.value))} size="lg">
                {Array.from({ length: 33 }, (_, p) => 32 - p).map((p) => (
                  <option key={p} value={p}>
                    /{p} — {toDotted(maskOf(p))}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </>
      }
    >
      {error && <Notice tone="err">{error}</Notice>}
      {v4?.ok && <V4Result locale={locale} ip={v4.value.ip} prefix={v4.value.prefix} />}
      {v6?.ok && <V6Result locale={locale} value={v6.value.value} prefix={v6.value.prefix} zone={v6.value.zone} />}
    </Split>
  );
}

function V4Result({ locale, ip, prefix }: { locale: Locale; ip: number; prefix: number }) {
  const t = T[locale];
  const i = v4Info(ip, prefix);
  const fmt = (n: number) => bigFmt(locale, n);
  const rows: ValueRow[] = [
    { label: t.netAddr, value: toDotted(i.network) },
    { label: t.broadcast, value: prefix >= 31 ? t.noBroadcast : toDotted(i.broadcast), plain: prefix >= 31 },
    { label: t.first, value: toDotted(i.first) },
    { label: t.last, value: toDotted(i.last) },
    { label: t.mask, value: `${toDotted(i.mask)} = /${prefix}` },
    { label: t.wildcard, value: toDotted(i.wildcard) },
    { label: t.total, value: fmt(i.total), plain: true },
    { label: t.usable, value: fmt(i.usable), plain: true },
    { label: t.cls, value: i.cls, plain: true },
    { label: t.rdns, value: reverse4(ip) },
    { label: t.int, value: String(ip) },
    { label: t.hex, value: toHex(ip) },
    { label: t.binAddr, value: toBinary(ip) },
    { label: t.binMask, value: toBinary(i.mask) },
  ];
  const sups = supernets(ip, prefix);
  const near = [adjacent(i.network, prefix, -1), adjacent(i.network, prefix, 1)].filter((x) => x !== null);
  return (
    <>
      <ResultCard
        value={cidr4({ network: i.network, prefix })}
        sub={
          <>
            {`${t.hostsLine}: `}
            <span className="font-mono">{`${toDotted(i.first)} – ${toDotted(i.last)}`}</span>
            {` · ${fmt(i.usable)} ${plural(locale, i.usable, t.hostsForms)} · ${t.wc} `}
            <span className="font-mono">{toDotted(i.wildcard)}</span>
          </>
        }
        badge={<TypeBadge sp={special4(ip)} locale={locale} />}
      />
      {prefix >= 31 && <p className="text-sm text-fg-2">{prefix === 31 ? t.p2p : t.host}</p>}
      <DetailList rows={rows} locale={locale} />
      <div className="grid gap-1 text-sm text-fg-2">
        {sups.length > 0 && (
          <p>
            <span className="text-fg-3">{t.supernets}: </span>
            <span className="font-mono">{sups.map(cidr4).join(", ")}</span>
          </p>
        )}
        {near.length > 0 && (
          <p>
            <span className="text-fg-3">{t.neighbours}: </span>
            <span className="font-mono">{near.map(cidr4).join(", ")}</span>
          </p>
        )}
      </div>
    </>
  );
}

function V6Result({ locale, value, prefix, zone }: { locale: Locale; value: bigint; prefix: number; zone?: string }) {
  const t = T[locale];
  const i = v6Info(value, prefix);
  const sp = special6(value);
  const count = prefix >= 64 ? bigFmt(locale, i.total) : `2^${128 - prefix}`;
  const rows: ValueRow[] = [
    { label: t.compressed, value: compress(value) },
    { label: t.expanded, value: expand(value) },
    { label: t.v6first, value: compress(i.network) },
    { label: t.v6last, value: compress(i.last) },
    { label: t.v6count, value: count, plain: true },
    { label: t.rdns, value: reverse6(value) },
  ];
  if (isV4Mapped(value)) rows.splice(2, 0, { label: t.mapped, value: toDotted(Number(value & 0xffffffffn)) });
  if (sp?.kind === "multicast") {
    const scope = MULTICAST_SCOPE[Number((value >> 112n) & 0xfn)];
    if (scope) rows.push({ label: t.scope, value: scope[locale], plain: true });
  }
  if (zone) rows.push({ label: t.zone, value: zone });
  return (
    <>
      <ResultCard value={`${compress(i.network)}/${prefix}`} sub={`${t.v6count}: ${count}`} badge={<TypeBadge sp={sp} locale={locale} />} />
      <DetailList rows={rows} locale={locale} />
    </>
  );
}
