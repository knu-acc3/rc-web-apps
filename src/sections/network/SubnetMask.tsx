"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { Field, Input, Select } from "@/ui/field";
import { Notice, Panel, Stat } from "@/ui/panel";
import { maskOf, parseIPv4, prefixOfMask, toBinary, toDotted, toHex, usableHosts } from "./lib/ipv4";
import { bigFmt, ValueRows } from "./shared";

const T = {
  ru: {
    prefix: "Префикс (CIDR)",
    mask: "Маска подсети",
    maskInput: "Или введите маску",
    maskHint: "Например 255.255.240.0 — префикс определится сам",
    notMask: "Это не маска подсети: единицы должны идти подряд слева",
    wildcard: "Wildcard (обратная маска)",
    hex: "Маска в hex",
    bin: "Маска в двоичном виде",
    total: "Всего адресов",
    usable: "Доступно для хостов",
    hosts: "хостов в подсети",
    inParent: "Сколько таких подсетей помещается",
    in24: "в /24",
    in16: "в /16",
    in8: "в /8",
    hostsForms: ["хост", "хоста", "хостов"],
    netForms: ["подсеть", "подсети", "подсетей"],
    invalid: "Неверный адрес маски",
  },
  en: {
    prefix: "Prefix (CIDR)",
    mask: "Subnet mask",
    maskInput: "Or type a mask",
    maskHint: "E.g. 255.255.240.0 — the prefix is detected automatically",
    notMask: "Not a subnet mask: the one-bits must be contiguous from the left",
    wildcard: "Wildcard (inverse mask)",
    hex: "Mask in hex",
    bin: "Mask in binary",
    total: "Total addresses",
    usable: "Usable hosts",
    hosts: "hosts per subnet",
    inParent: "How many fit",
    in24: "in a /24",
    in16: "in a /16",
    in8: "in a /8",
    hostsForms: ["host", "hosts"],
    netForms: ["subnet", "subnets"],
    invalid: "Invalid mask address",
  },
} as const;

export default function SubnetMask({ locale, prefix: p0 = 24 }: { locale: Locale; prefix?: number }) {
  const t = T[locale];
  const id = useId();
  const [prefix, setPrefix] = useState(p0);
  const [maskText, setMaskText] = useState("");
  const [maskErr, setMaskErr] = useState<string | null>(null);

  function onMask(v: string) {
    setMaskText(v);
    if (!v.trim()) return setMaskErr(null);
    const m = parseIPv4(v);
    if (!m.ok) return setMaskErr(t.invalid);
    const p = prefixOfMask(m.value);
    if (p === null) return setMaskErr(t.notMask);
    setMaskErr(null);
    setPrefix(p);
  }

  const mask = maskOf(prefix);
  const usable = usableHosts(prefix);
  const total = 2 ** (32 - prefix);
  const fit = (parent: number) => (prefix >= parent ? 2 ** (prefix - parent) : null);
  const fits = ([
    [24, t.in24],
    [16, t.in16],
    [8, t.in8],
  ] as const)
    .map(([p, l]) => [fit(p), l] as const)
    .filter(([n]) => n !== null)
    .map(([n, l]) => `${bigFmt(locale, n!)} ${plural(locale, n!, t.netForms)} ${l}`);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <Field label={t.prefix} htmlFor={`${id}-p`}>
          <Select
            id={`${id}-p`}
            value={prefix}
            onChange={(e) => {
              setPrefix(Number(e.target.value));
              setMaskText("");
              setMaskErr(null);
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
        <Field label={t.maskInput} htmlFor={`${id}-m`} hint={t.maskHint} error={maskErr}>
          <Input id={`${id}-m`} value={maskText} onChange={(e) => onMask(e.target.value)} placeholder="255.255.255.0" size="lg" className="font-mono" autoComplete="off" spellCheck={false} aria-invalid={!!maskErr} />
        </Field>
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label={t.mask} value={<span className="font-mono" aria-live="polite">{`${toDotted(mask)} = /${prefix}`}</span>} />
        <Stat label={t.usable} value={bigFmt(locale, usable)} sub={`${bigFmt(locale, total)} ${locale === "ru" ? "адресов всего" : "addresses in total"}`} />
      </div>
      <Panel>
        <ValueRows
          locale={locale}
          rows={[
            { label: t.mask, value: toDotted(mask) },
            { label: t.wildcard, value: toDotted(~mask >>> 0) },
            { label: t.hex, value: toHex(mask) },
            { label: t.bin, value: toBinary(mask) },
            { label: t.total, value: bigFmt(locale, total), mono: false },
            { label: t.usable, value: bigFmt(locale, usable), mono: false },
          ]}
        />
      </Panel>
      {fits.length > 0 && <Notice>{`${t.inParent}: ${fits.join(" · ")}`}</Notice>}
    </div>
  );
}
