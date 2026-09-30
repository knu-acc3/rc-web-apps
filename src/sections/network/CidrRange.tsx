"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { CodeOutput } from "@/ui/code-output";
import { Field, Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { cidrRange, rangeToCidrs } from "./lib/cidr";
import { parseIPv4, toDotted } from "./lib/ipv4";
import { compress, parseIPv6 } from "./lib/ipv6";
import { bigFmt } from "./shared";

type Mode = "cidr-to-range" | "range-to-cidr";

const T = {
  ru: {
    inCidr: "Сети CIDR — по одной в строке",
    inRange: "Диапазоны — по одному в строке",
    hintCidr: "Например 10.0.0.0/22 или 2001:db8::/48",
    hintRange: "Формат: начало - конец, например 10.0.0.1 - 10.0.0.10",
    out: "Результат",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    line: "Строка",
    badCidr: "не похоже на сеть CIDR (адрес/префикс)",
    badRange: "нужен диапазон «начало - конец» из двух адресов одной версии IP",
    blocks: ["блок", "блока", "блоков"],
    addrs: ["адрес", "адреса", "адресов"],
    summary: (b: string, a: string) => `Итого: ${b}, ${a}`,
    limit: "Показаны первые 4096 блоков",
  },
  en: {
    inCidr: "CIDR networks — one per line",
    inRange: "Ranges — one per line",
    hintCidr: "E.g. 10.0.0.0/22 or 2001:db8::/48",
    hintRange: "Format: start - end, e.g. 10.0.0.1 - 10.0.0.10",
    out: "Result",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    line: "Line",
    badCidr: "is not a CIDR network (address/prefix)",
    badRange: "needs “start - end” with two addresses of the same IP version",
    blocks: ["block", "blocks"],
    addrs: ["address", "addresses"],
    summary: (b: string, a: string) => `Total: ${b}, ${a}`,
    limit: "Showing the first 4096 blocks",
  },
} as const;

type Parsed = { v: bigint; bits: 32 | 128 } | null;

function parseAny(s: string): Parsed {
  const a = s.trim();
  if (a.includes(":")) {
    const r = parseIPv6(a);
    return r.ok ? { v: r.value.value, bits: 128 } : null;
  }
  const r = parseIPv4(a);
  return r.ok ? { v: BigInt(r.value), bits: 32 } : null;
}

const fmtAddr = (v: bigint, bits: 32 | 128) => (bits === 32 ? toDotted(Number(v)) : compress(v, false));

export default function CidrRange({ locale, mode = "cidr-to-range", sample }: { locale: Locale; mode?: Mode; sample?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(sample ?? (mode === "cidr-to-range" ? "192.168.0.0/22\n10.8.0.0/29\n2001:db8:1::/64" : "10.0.0.1 - 10.0.0.10\n192.168.1.0 - 192.168.2.255"));

  const res = useMemo(() => {
    const out: string[] = [];
    const errors: string[] = [];
    let blocks = 0;
    let addrs = 0n;
    let truncated = false;
    text.split(/\r?\n/).forEach((raw, idx) => {
      const line = raw.trim();
      if (!line) return;
      if (mode === "cidr-to-range") {
        const [a, p] = line.split("/");
        const ip = parseAny(a ?? "");
        const pn = Number(p);
        if (!ip || p === undefined || !/^\d{1,3}$/.test(p.trim()) || pn > ip.bits) {
          errors.push(`${t.line} ${idx + 1}: «${line}» ${t.badCidr}`);
          return;
        }
        const r = cidrRange(ip.v, pn, ip.bits);
        out.push(`${fmtAddr(r.first, ip.bits)} - ${fmtAddr(r.last, ip.bits)}`);
        blocks++;
        addrs += r.count;
      } else {
        // IP addresses never contain dashes, so any dash (or whitespace) separates the two ends
        const parts = line.split(/\s*[-–—]\s*|\s+/).filter(Boolean);
        const a = parts.length === 2 ? parseAny(parts[0]) : null;
        const b = parts.length === 2 ? parseAny(parts[1]) : null;
        if (!a || !b || a.bits !== b.bits) {
          errors.push(`${t.line} ${idx + 1}: «${line}» ${t.badRange}`);
          return;
        }
        const list = rangeToCidrs(a.v, b.v, a.bits);
        if (list.length >= 4096) truncated = true;
        for (const c of list) {
          out.push(`${fmtAddr(c.start, a.bits)}/${c.prefix}`);
          addrs += 1n << BigInt(a.bits - c.prefix);
        }
        blocks += list.length;
      }
    });
    return { out: out.join("\n"), errors, blocks, addrs, truncated };
  }, [text, mode, t]);

  // plural rules only look at the last two digits (ru) or n === 1 (en), so reduce the BigInt safely
  const addrsForPlural = Number(res.addrs % 100n) + (res.addrs >= 100n ? 100 : 0);
  const summary = t.summary(`${bigFmt(locale, res.blocks)} ${plural(locale, res.blocks, t.blocks)}`, `${bigFmt(locale, res.addrs)} ${plural(locale, addrsForPlural, t.addrs)}`);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-4">
        <Field label={mode === "cidr-to-range" ? t.inCidr : t.inRange} htmlFor={`${id}-in`} hint={mode === "cidr-to-range" ? t.hintCidr : t.hintRange}>
          <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} rows={8} autoComplete="off" />
        </Field>
      </Panel>
      <div className="flex min-w-0 flex-col gap-3">
        <CodeOutput value={res.out} title={t.out} filename={mode === "cidr-to-range" ? "ranges.txt" : "cidr.txt"} labels={{ copy: t.copy, copied: t.copied, download: t.download }} minRows={8} />
        <p className="text-sm text-fg-2" aria-live="polite">
          {summary}
        </p>
        {res.truncated && <Notice tone="warn">{t.limit}</Notice>}
        {res.errors.length > 0 && (
          <Notice tone="err">
            {res.errors.slice(0, 5).map((e) => (
              <div key={e}>{e}</div>
            ))}
          </Notice>
        )}
      </div>
    </div>
  );
}
