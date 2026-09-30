"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input } from "@/ui/field";
import { Badge, Notice } from "@/ui/panel";
import { parseAnyV4, type ConvError, type Notation } from "./lib/convert";
import { toBinary, toDotted, toHex } from "./lib/ipv4";
import { compress, expand, mapV4, reverse4 } from "./lib/ipv6";
import { special4 } from "./lib/special";
import { DetailList, ResultCard } from "./shared";

const T = {
  ru: {
    input: "IPv4-адрес в любой записи",
    hint: "192.168.1.10, 3232235786, 0xC0A8010A, двоичная запись или ::ffff:192.168.1.10",
    detected: "Распознано как",
    notation: { dotted: "точечно-десятичная запись", integer: "32-битное целое", hex: "шестнадцатеричное число", binary: "двоичная запись", mapped: "IPv4-mapped IPv6" } as Record<Notation, string>,
    errors: {
      empty: "Введите адрес",
      unknown: "Не удалось распознать адрес ни в одной записи",
      range: "Число больше 4 294 967 295 — это не IPv4-адрес",
      "not-mapped": "Это IPv6-адрес, но не IPv4-mapped (::ffff:a.b.c.d) — в IPv4 его перевести нельзя",
    } as Record<ConvError, string>,
    dotted: "Точечно-десятичная",
    integer: "Целое число (uint32)",
    hex: "Шестнадцатеричная",
    binary: "Двоичная",
    octets: "Октеты в hex",
    mapped: "IPv4-mapped IPv6",
    mappedHex: "IPv4-mapped IPv6 (hex)",
    mappedFull: "IPv4-mapped IPv6 (полная)",
    sixToFour: "Префикс 6to4",
    rdns: "Обратная зона DNS",
    type: "Тип",
    public: "публичный адрес",
  },
  en: {
    input: "IPv4 address in any notation",
    hint: "192.168.1.10, 3232235786, 0xC0A8010A, binary, or ::ffff:192.168.1.10",
    detected: "Detected as",
    notation: { dotted: "dotted decimal", integer: "32-bit integer", hex: "hexadecimal", binary: "binary", mapped: "IPv4-mapped IPv6" } as Record<Notation, string>,
    errors: {
      empty: "Enter an address",
      unknown: "Could not recognise the address in any notation",
      range: "The number is larger than 4,294,967,295 — not an IPv4 address",
      "not-mapped": "This is an IPv6 address but not IPv4-mapped (::ffff:a.b.c.d), so it has no IPv4 form",
    } as Record<ConvError, string>,
    dotted: "Dotted decimal",
    integer: "Integer (uint32)",
    hex: "Hexadecimal",
    binary: "Binary",
    octets: "Octets in hex",
    mapped: "IPv4-mapped IPv6",
    mappedHex: "IPv4-mapped IPv6 (hex)",
    mappedFull: "IPv4-mapped IPv6 (expanded)",
    sixToFour: "6to4 prefix",
    rdns: "Reverse DNS zone",
    type: "Type",
    public: "public address",
  },
} as const;

export default function IpConverter({ locale, value = "192.168.1.10" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const r = parseAnyV4(text);

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.input} htmlFor={`${id}-in`} hint={t.hint}>
        <Input id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} size="lg" className="font-mono" autoComplete="off" spellCheck={false} aria-invalid={!r.ok && text.trim() !== ""} />
      </Field>
      {r.ok ? (
        <>
          <ResultCard
            value={`${toDotted(r.value)} = ${r.value}`}
            sub={`${toHex(r.value)} · ${compress(mapV4(r.value))}`}
            badge={
              <>
                <span className="text-sm text-fg-3">{t.detected}</span>
                <Badge tone="accent">{t.notation[r.from]}</Badge>
                <span className="text-sm text-fg-3">· {special4(r.value)?.[locale] ?? t.public}</span>
              </>
            }
          />
          <DetailList
            locale={locale}
            rows={[
              { label: t.dotted, value: toDotted(r.value) },
              { label: t.integer, value: String(r.value) },
              { label: t.hex, value: toHex(r.value) },
              { label: t.octets, value: toDotted(r.value).split(".").map((o) => Number(o).toString(16).toUpperCase().padStart(2, "0")).join(".") },
              { label: t.binary, value: toBinary(r.value) },
              { label: t.mapped, value: compress(mapV4(r.value)) },
              { label: t.mappedHex, value: compress(mapV4(r.value), false) },
              { label: t.mappedFull, value: expand(mapV4(r.value)) },
              { label: t.sixToFour, value: `${compress((0x2002n << 112n) | (BigInt(r.value) << 80n), false)}/48` },
              { label: t.rdns, value: reverse4(r.value) },
            ]}
          />
        </>
      ) : (
        text.trim() !== "" && <Notice tone="err">{t.errors[r.error]}</Notice>
      )}
    </div>
  );
}
