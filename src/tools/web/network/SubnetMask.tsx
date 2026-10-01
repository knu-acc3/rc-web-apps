"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { maskOf, parseIPv4, prefixOfMask, toBinary, toDotted, toHex, usableHosts } from "./lib/ipv4";
import { bigFmt, DetailList, ResultCard, Split } from "./ui/shared";

const T = {
  ru: {
    prefix: "Префикс (CIDR)",
    maskInput: "Или введите маску",
    notMask: "Это не маска подсети: единицы должны идти подряд слева",
    invalid: "Неверная запись маски",
    wildcard: "Wildcard (обратная маска)",
    hex: "Маска в hex",
    bin: "Маска в двоичном виде",
    total: "Всего адресов",
    usable: "Адресов для хостов",
    bits: "Бит сети / бит хоста",
    fits: (n: string, forms: string, p: number) => `${n} ${forms} в /${p}`,
    fitTitle: "Помещается",
    hostsForms: ["хост", "хоста", "хостов"],
    addrForms: ["адрес", "адреса", "адресов"],
    netForms: ["подсеть", "подсети", "подсетей"],
  },
  en: {
    prefix: "Prefix (CIDR)",
    maskInput: "Or type a mask",
    notMask: "Not a subnet mask: the one-bits must be contiguous from the left",
    invalid: "Invalid mask",
    wildcard: "Wildcard (inverse mask)",
    hex: "Mask in hex",
    bin: "Mask in binary",
    total: "Total addresses",
    usable: "Usable hosts",
    bits: "Network / host bits",
    fits: (n: string, forms: string, p: number) => `${n} ${forms} per /${p}`,
    fitTitle: "Fits",
    hostsForms: ["host", "hosts"],
    addrForms: ["address", "addresses"],
    netForms: ["subnet", "subnets"],
  },
} as const;

export default function SubnetMask({ locale, prefix: p0 = 24 }: { locale: Locale; prefix?: number }) {
  const t = T[locale];
  const id = useId();
  const [prefix, setPrefix] = useState(p0);
  const [maskText, setMaskText] = useState("");

  // A typed mask (when valid) drives the prefix; otherwise the select does.
  let maskErr: string | null = null;
  let effective = prefix;
  if (maskText.trim()) {
    const m = parseIPv4(maskText);
    const p = m.ok ? prefixOfMask(m.value) : null;
    if (!m.ok) maskErr = t.invalid;
    else if (p === null) maskErr = t.notMask;
    else effective = p;
  }

  const mask = maskOf(effective);
  const usable = usableHosts(effective);
  const total = 2 ** (32 - effective);
  const parent = [24, 16, 8].find((x) => effective > x);
  const fitsText = parent !== undefined ? t.fits(bigFmt(locale, 2 ** (effective - parent)), plural(locale, 2 ** (effective - parent), t.netForms), parent) : null;

  return (
    <Split
      input={
        <>
          <Field label={t.prefix} htmlFor={`${id}-p`}>
            <Select
              id={`${id}-p`}
              value={effective}
              onChange={(e) => {
                setPrefix(Number(e.target.value));
                setMaskText("");
              }}
              size="lg"
            >
              {Array.from({ length: 33 }, (_, i) => 32 - i).map((p) => (
                <option key={p} value={p}>
                  /{p} — {toDotted(maskOf(p))}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.maskInput} htmlFor={`${id}-m`} error={maskErr}>
            <Input
              id={`${id}-m`}
              value={maskText}
              onChange={(e) => setMaskText(e.target.value)}
              placeholder="255.255.255.0"
              size="lg"
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!maskErr}
            />
          </Field>
        </>
      }
    >
      <ResultCard
        value={`${toDotted(mask)} = /${effective}`}
        sub={`${bigFmt(locale, usable)} ${plural(locale, usable, t.hostsForms)} · ${bigFmt(locale, total)} ${plural(locale, total, t.addrForms)} · wildcard ${toDotted(~mask >>> 0)}`}
      />
      <DetailList
        locale={locale}
        rows={[
          { label: t.wildcard, value: toDotted(~mask >>> 0) },
          { label: t.hex, value: toHex(mask) },
          { label: t.bin, value: toBinary(mask) },
          { label: t.bits, value: `${effective} / ${32 - effective}`, plain: true },
          { label: t.total, value: bigFmt(locale, total), plain: true },
          { label: t.usable, value: bigFmt(locale, usable), plain: true },
          ...(fitsText ? [{ label: t.fitTitle, value: fitsText, plain: true }] : []),
        ]}
      />
    </Split>
  );
}
