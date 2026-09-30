"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Badge, Notice, Panel, PanelHeader, Stat } from "@/ui/panel";
import { adjacent, cidr4, maskOf, parseV4Input, supernets, toBinary, toDotted, toHex, v4Info } from "./lib/ipv4";
import { compress, expand, isV4Mapped, parseV6Input, reverse4, reverse6, v6Info } from "./lib/ipv6";
import { MULTICAST_SCOPE, special4, special6 } from "./lib/special";
import { bigFmt, err4, err6, ValueRows, type ValueRow } from "./shared";

const T = {
  ru: {
    input: "IP-адрес и маска",
    inputHint: "Например 192.168.1.10/24, 10.0.0.5 255.255.0.0 или 2001:db8::1/64",
    prefix: "Маска подсети",
    network: "Сеть",
    hosts: "Узлов (хостов)",
    address: "Адрес",
    mask: "Маска",
    wildcard: "Wildcard (обратная маска)",
    netAddr: "Адрес сети",
    broadcast: "Широковещательный (broadcast)",
    first: "Первый хост",
    last: "Последний хост",
    total: "Всего адресов",
    usable: "Доступно для хостов",
    cls: "Класс (исторический)",
    type: "Тип адреса",
    public: "Публичный (глобально маршрутизируемый)",
    binAddr: "Адрес в двоичном виде",
    binMask: "Маска в двоичном виде",
    hex: "Шестнадцатеричный",
    int: "Целое число",
    rdns: "Обратная зона DNS",
    supernets: "Объемлющие сети",
    neighbours: "Соседние подсети того же размера",
    prev: "Предыдущая",
    next: "Следующая",
    p2p: "/31 — канал «точка-точка» (RFC 3021): оба адреса используются хостами, broadcast нет.",
    host: "/32 — маршрут к одному хосту: сеть состоит из одного адреса.",
    compressed: "Сокращённая запись",
    expanded: "Полная запись",
    v6prefix: "Префикс",
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
    inputHint: "E.g. 192.168.1.10/24, 10.0.0.5 255.255.0.0 or 2001:db8::1/64",
    prefix: "Subnet mask",
    network: "Network",
    hosts: "Usable hosts",
    address: "Address",
    mask: "Netmask",
    wildcard: "Wildcard (inverse mask)",
    netAddr: "Network address",
    broadcast: "Broadcast address",
    first: "First host",
    last: "Last host",
    total: "Total addresses",
    usable: "Usable hosts",
    cls: "Class (historical)",
    type: "Address type",
    public: "Public (globally routable)",
    binAddr: "Address in binary",
    binMask: "Mask in binary",
    hex: "Hexadecimal",
    int: "Integer",
    rdns: "Reverse DNS zone",
    supernets: "Containing networks",
    neighbours: "Adjacent subnets of the same size",
    prev: "Previous",
    next: "Next",
    p2p: "/31 is a point-to-point link (RFC 3021): both addresses are usable, there is no broadcast.",
    host: "/32 is a host route: the network is a single address.",
    compressed: "Compressed form",
    expanded: "Expanded form",
    v6prefix: "Prefix",
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

export interface IpCalculatorProps {
  locale: Locale;
  value?: string;
}

export default function IpCalculator({ locale, value = "192.168.1.10/24" }: IpCalculatorProps) {
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

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_16rem]">
          <Field label={t.input} htmlFor={`${id}-ip`} hint={t.inputHint}>
            <Input
              id={`${id}-ip`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              size="lg"
              className="font-mono"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-invalid={!!((v4 && !v4.ok) || (v6 && !v6.ok))}
            />
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
        </div>
      </Panel>
      {v4 && (v4.ok ? <V4Result locale={locale} ip={v4.value.ip} prefix={v4.value.prefix} /> : <Notice tone="err">{err4(locale, v4.error)}</Notice>)}
      {v6 && (v6.ok ? <V6Result locale={locale} value={v6.value.value} prefix={v6.value.prefix} zone={v6.value.zone} /> : <Notice tone="err">{err6(locale, v6.error)}</Notice>)}
    </div>
  );
}

function V4Result({ locale, ip, prefix }: { locale: Locale; ip: number; prefix: number }) {
  const t = T[locale];
  const i = v4Info(ip, prefix);
  const sp = special4(ip);
  const fmt = (n: number) => bigFmt(locale, n);
  const rows: ValueRow[] = [
    { label: t.address, value: toDotted(ip) },
    { label: t.mask, value: `${toDotted(i.mask)} (/${prefix})` },
    { label: t.wildcard, value: toDotted(i.wildcard) },
    { label: t.netAddr, value: toDotted(i.network) },
    { label: t.broadcast, value: prefix >= 31 ? "—" : toDotted(i.broadcast), noCopy: prefix >= 31 },
    { label: t.first, value: toDotted(i.first) },
    { label: t.last, value: toDotted(i.last) },
    { label: t.total, value: fmt(i.total), mono: false },
    { label: t.usable, value: fmt(i.usable), mono: false },
    { label: t.cls, value: i.cls, mono: false, noCopy: true },
    { label: t.binAddr, value: toBinary(ip) },
    { label: t.binMask, value: toBinary(i.mask) },
    { label: t.hex, value: toHex(ip) },
    { label: t.int, value: String(ip) },
    { label: t.rdns, value: reverse4(ip) },
  ];
  const sups = supernets(ip, prefix);
  const prev = adjacent(i.network, prefix, -1);
  const next = adjacent(i.network, prefix, 1);
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label={t.network} value={<span className="font-mono">{cidr4({ network: i.network, prefix })}</span>} sub={`${toDotted(i.first)} – ${toDotted(i.last)}`} />
        <Stat
          label={t.hosts}
          value={<span aria-live="polite">{fmt(i.usable)}</span>}
          sub={`${fmt(i.total)} ${plural(locale, i.total, t.addrForms)} · ${t.wildcard.split(" ")[0]} ${toDotted(i.wildcard)}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={sp && !sp.global ? "warn" : "ok"}>{sp ? sp[locale] : t.public}</Badge>
        {sp && <span className="text-sm text-fg-3">{sp.cidr} · {sp.rfc}</span>}
      </div>
      {prefix === 31 && <Notice>{t.p2p}</Notice>}
      {prefix === 32 && <Notice>{t.host}</Notice>}
      <Panel>
        <ValueRows rows={rows} locale={locale} />
      </Panel>
      {(sups.length > 0 || prev || next) && (
        <div className="grid gap-4 md:grid-cols-2">
          {sups.length > 0 && (
            <Panel>
              <PanelHeader title={t.supernets} />
              <ul className="divide-y divide-line">
                {sups.map((s) => (
                  <li key={s.prefix} className="flex justify-between gap-3 px-4 py-2 font-mono text-sm">
                    <span className="text-fg">{cidr4(s)}</span>
                    <span className="text-fg-3">{toDotted(maskOf(s.prefix))}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          <Panel>
            <PanelHeader title={t.neighbours} />
            <ul className="divide-y divide-line">
              {prev && (
                <li className="flex justify-between gap-3 px-4 py-2 text-sm">
                  <span className="text-fg-3">{t.prev}</span>
                  <span className="font-mono text-fg">{cidr4(prev)}</span>
                </li>
              )}
              {next && (
                <li className="flex justify-between gap-3 px-4 py-2 text-sm">
                  <span className="text-fg-3">{t.next}</span>
                  <span className="font-mono text-fg">{cidr4(next)}</span>
                </li>
              )}
            </ul>
          </Panel>
        </div>
      )}
    </>
  );
}

function V6Result({ locale, value, prefix, zone }: { locale: Locale; value: bigint; prefix: number; zone?: string }) {
  const t = T[locale];
  const i = v6Info(value, prefix);
  const sp = special6(value);
  const rows: ValueRow[] = [
    { label: t.compressed, value: compress(value) },
    { label: t.expanded, value: expand(value) },
    { label: t.v6prefix, value: `${compress(i.network)}/${prefix}` },
    { label: t.v6first, value: compress(i.network) },
    { label: t.v6last, value: compress(i.last) },
    { label: t.v6count, value: prefix >= 64 ? bigFmt(locale, i.total) : `2^${128 - prefix}`, mono: false },
    { label: t.rdns, value: reverse6(value) },
  ];
  if (isV4Mapped(value)) rows.splice(2, 0, { label: t.mapped, value: toDotted(Number(value & 0xffffffffn)) });
  if (sp?.kind === "multicast") {
    const scope = MULTICAST_SCOPE[Number((value >> 112n) & 0xfn)];
    if (scope) rows.push({ label: t.scope, value: scope[locale], mono: false, noCopy: true });
  }
  if (zone) rows.push({ label: t.zone, value: zone });
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label={t.network} value={<span className="font-mono text-xl sm:text-2xl">{`${compress(i.network)}/${prefix}`}</span>} />
        <Stat label={t.v6count} value={<span aria-live="polite">{`2^${128 - prefix}`}</span>} sub={prefix >= 64 ? bigFmt(locale, i.total) : undefined} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={sp && !sp.global ? "warn" : "ok"}>{sp ? sp[locale] : t.public}</Badge>
        {sp && <span className="text-sm text-fg-3">{sp.cidr} · {sp.rfc}</span>}
      </div>
      <Panel>
        <ValueRows rows={rows} locale={locale} />
      </Panel>
    </>
  );
}
