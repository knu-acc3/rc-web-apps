"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input, Switch } from "@/ui/field";
import { Badge, Notice } from "@/ui/panel";
import { eui64, linkLocalFromMac, macBits, macFormats, parseMac, type MacError } from "./lib/mac";
import { DetailList, ResultCard } from "./ui/shared";

const T = {
  ru: {
    input: "MAC-адрес",
    hint: "Любой формат: 00:1A:2B:3C:4D:5E, 00-1a-2b-3c-4d-5e, 001a.2b3c.4d5e, 001A2B3C4D5E",
    upper: "Заглавные буквы",
    errors: { empty: "Введите MAC-адрес", chars: "Допустимы только шестнадцатеричные цифры и разделители : - .", length: "MAC-адрес — это 12 шестнадцатеричных цифр (6 байт) в одном из стандартных форматов" } as Record<MacError, string>,
    formats: "Форматы записи",
    colon: "Через двоеточие (Linux, macOS)",
    hyphen: "Через дефис (Windows)",
    cisco: "Cisco (точки)",
    bare: "Без разделителей",
    oui: "Первые 3 байта (OUI)",
    eui: "Идентификатор интерфейса EUI-64",
    ll: "IPv6 link-local из MAC (SLAAC)",
    unicast: "Юникаст (I/G = 0)",
    multicast: "Мультикаст (I/G = 1)",
    global: "Глобально уникальный (U/L = 0)",
    local: "Локально администрируемый (U/L = 1)",
    broadcast: "Широковещательный адрес",
    zero: "Нулевой адрес — обычно «не задан»",
    localNote: "Бит U/L = 1: адрес назначен программно — так выглядят случайные «частные» MAC-адреса Wi-Fi в iOS, Android и Windows, адреса виртуальных машин и контейнеров.",
    noVendor: "Производителя по MAC мы не определяем: база OUI большая и постоянно меняется, а у случайных MAC производителя нет вовсе.",
  },
  en: {
    input: "MAC address",
    hint: "Any format: 00:1A:2B:3C:4D:5E, 00-1a-2b-3c-4d-5e, 001a.2b3c.4d5e, 001A2B3C4D5E",
    upper: "Uppercase",
    errors: { empty: "Enter a MAC address", chars: "Only hex digits and : - . separators are allowed", length: "A MAC address is 12 hex digits (6 bytes) in one of the standard layouts" } as Record<MacError, string>,
    formats: "Notations",
    colon: "Colon-separated (Linux, macOS)",
    hyphen: "Hyphen-separated (Windows)",
    cisco: "Cisco (dotted)",
    bare: "No separators",
    oui: "First 3 bytes (OUI)",
    eui: "EUI-64 interface ID",
    ll: "IPv6 link-local from MAC (SLAAC)",
    unicast: "Unicast (I/G = 0)",
    multicast: "Multicast (I/G = 1)",
    global: "Universally administered (U/L = 0)",
    local: "Locally administered (U/L = 1)",
    broadcast: "Broadcast address",
    zero: "All-zero address — usually “not set”",
    localNote: "U/L bit = 1: the address was assigned by software — this is what randomised “private” Wi-Fi MACs on iOS, Android and Windows, VMs and containers look like.",
    noVendor: "We do not look up the manufacturer: the OUI registry is large and changes constantly, and randomised MACs have no vendor at all.",
  },
} as const;

export default function MacTool({ locale, value = "00:1A:2B:3C:4D:5E" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const [upper, setUpper] = useState(false);
  const r = parseMac(text);

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.input} htmlFor={`${id}-in`} hint={t.hint} aside={<Switch label={t.upper} checked={upper} onChange={(e) => setUpper(e.target.checked)} className="text-sm" />}>
        <Input id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} size="lg" className="font-mono" autoComplete="off" spellCheck={false} aria-invalid={!r.ok && text.trim() !== ""} />
      </Field>
      {r.ok ? <MacResult locale={locale} bytes={r.bytes} upper={upper} /> : text.trim() !== "" && <Notice tone="err">{t.errors[r.error]}</Notice>}
    </div>
  );
}

function MacResult({ locale, bytes, upper }: { locale: Locale; bytes: number[]; upper: boolean }) {
  const t = T[locale];
  const f = macFormats(bytes, upper);
  const b = macBits(bytes);
  const badges = b.broadcast ? (
    <Badge tone="warn">{t.broadcast}</Badge>
  ) : b.zero ? (
    <Badge tone="warn">{t.zero}</Badge>
  ) : (
    <>
      <Badge tone={b.multicast ? "warn" : "ok"}>{b.multicast ? t.multicast : t.unicast}</Badge>
      <Badge tone={b.local ? "accent" : "neutral"}>{b.local ? t.local : t.global}</Badge>
    </>
  );
  return (
    <>
      <ResultCard value={f.colon} sub={`${f.hyphen} · ${f.cisco}`} badge={badges} />
      <DetailList
        locale={locale}
        title={t.formats}
        rows={[
          { label: t.colon, value: f.colon },
          { label: t.hyphen, value: f.hyphen },
          { label: t.cisco, value: f.cisco },
          { label: t.bare, value: f.bare },
          { label: t.oui, value: upper ? b.oui : b.oui.toLowerCase() },
          ...(!b.multicast ? [{ label: t.eui, value: eui64(bytes) }, { label: t.ll, value: linkLocalFromMac(bytes) }] : []),
        ]}
      />
      {b.local && !b.multicast && <p className="text-sm text-fg-2">{t.localNote}</p>}
      <p className="text-sm text-fg-3">{t.noVendor}</p>
    </>
  );
}
