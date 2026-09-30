"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeOutput } from "@/ui/code-output";
import { Field, Textarea } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { compress, expand, parseV6Input, reverse6 } from "./lib/ipv6";
import { special6 } from "./lib/special";
import { err6 } from "./shared";

type Out = "compress" | "expand" | "reverse" | "type";

const T = {
  ru: {
    input: "IPv6-адреса — по одному в строке",
    hint: "Можно с префиксом (/64), зоной (%eth0) и встроенным IPv4 (::ffff:192.0.2.1)",
    compress: "Сокращённая запись (RFC 5952)",
    expand: "Полная запись",
    reverse: "Обратная зона (ip6.arpa)",
    type: "Тип адреса",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    line: "строка",
    invalid: "ошибка",
    public: "Глобальный юникаст",
  },
  en: {
    input: "IPv6 addresses — one per line",
    hint: "Prefixes (/64), zone IDs (%eth0) and embedded IPv4 (::ffff:192.0.2.1) are accepted",
    compress: "Compressed (RFC 5952)",
    expand: "Expanded",
    reverse: "Reverse DNS (ip6.arpa)",
    type: "Address type",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    line: "line",
    invalid: "error",
    public: "Global unicast",
  },
} as const;

export default function Ipv6Tool({ locale, value = "2001:0db8:0000:0000:0000:ff00:0042:8329\nfe80::1%eth0\n::ffff:192.0.2.1\n2001:db8:0:0:1:0:0:1/64" }: { locale: Locale; value?: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const outs: Record<Out, string[]> = { compress: [], expand: [], reverse: [], type: [] };
  lines.forEach((l, i) => {
    const r = parseV6Input(l.trim(), 128);
    if (!r.ok) {
      const msg = `# ${t.line} ${i + 1}: ${t.invalid} — ${err6(locale, r.error)}`;
      for (const k of Object.keys(outs) as Out[]) outs[k].push(msg);
      return;
    }
    const { value: v, prefix, explicit, zone } = r.value;
    const suffix = explicit ? `/${prefix}` : "";
    const z = zone ? `%${zone}` : "";
    outs.compress.push(compress(v) + z + suffix);
    outs.expand.push(expand(v) + z + suffix);
    outs.reverse.push(reverse6(v));
    const sp = special6(v);
    outs.type.push(`${compress(v)} — ${sp ? `${sp[locale]} (${sp.cidr}, ${sp.rfc})` : t.public}`);
  });
  const labels = { copy: t.copy, copied: t.copied, download: t.download };
  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4">
        <Field label={t.input} htmlFor={`${id}-in`} hint={t.hint}>
          <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} rows={5} autoComplete="off" />
        </Field>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        <CodeOutput title={t.compress} value={outs.compress.join("\n")} labels={labels} minRows={4} />
        <CodeOutput title={t.expand} value={outs.expand.join("\n")} labels={labels} minRows={4} />
        <CodeOutput title={t.reverse} value={outs.reverse.join("\n")} labels={labels} minRows={4} />
        <CodeOutput title={t.type} value={outs.type.join("\n")} labels={labels} minRows={4} />
      </div>
    </div>
  );
}
