"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { CodeOutput } from "@/ui/code-output";
import { Field, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { compress, expand, parseV6Input, reverse6 } from "./lib/ipv6";
import { special6 } from "./lib/special";
import { err6, Split } from "./ui/shared";

type Out = "compress" | "expand" | "reverse" | "type";

const T = {
  ru: {
    input: "IPv6-адреса — по одному в строке",
    hint: "Можно с префиксом (/64), зоной (%eth0) и встроенным IPv4 (::ffff:192.0.2.1)",
    mode: "Что показать",
    compress: "Сокращённая",
    expand: "Полная",
    reverse: "ip6.arpa",
    type: "Тип адреса",
    copy: "Копировать",
    copied: "Скопировано",
    download: "Скачать",
    line: "строка",
    public: "глобальный юникаст",
  },
  en: {
    input: "IPv6 addresses — one per line",
    hint: "Prefixes (/64), zone IDs (%eth0) and embedded IPv4 (::ffff:192.0.2.1) are accepted",
    mode: "Output",
    compress: "Compressed",
    expand: "Expanded",
    reverse: "ip6.arpa",
    type: "Address type",
    copy: "Copy",
    copied: "Copied",
    download: "Download",
    line: "line",
    public: "global unicast",
  },
} as const;

export default function Ipv6Tool({
  locale,
  mode: m0 = "compress",
  value = "2001:0db8:0000:0000:0000:ff00:0042:8329\nfe80::1%eth0\n::ffff:192.0.2.1\n2001:db8:0:0:1:0:0:1/64",
}: {
  locale: Locale;
  mode?: Out;
  value?: string;
}) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(value);
  const [mode, setMode] = useState<Out>(m0);

  const out = text
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l, i) => {
      const r = parseV6Input(l.trim(), 128);
      if (!r.ok) return `# ${t.line} ${i + 1}: ${err6(locale, r.error)}`;
      const { value: v, prefix, explicit, zone } = r.value;
      const suffix = (zone ? `%${zone}` : "") + (explicit ? `/${prefix}` : "");
      if (mode === "compress") return compress(v) + suffix;
      if (mode === "expand") return expand(v) + suffix;
      if (mode === "reverse") return reverse6(v);
      const sp = special6(v);
      return `${compress(v)} — ${sp ? `${sp[locale]} (${sp.cidr}, ${sp.rfc})` : t.public}`;
    })
    .join("\n");

  return (
    <Split
      input={
        <>
          <Field label={t.input} htmlFor={`${id}-in`} hint={t.hint}>
            <Textarea id={`${id}-in`} value={text} onChange={(e) => setText(e.target.value)} rows={5} autoComplete="off" />
          </Field>
          <Segmented
            label={t.mode}
            value={mode}
            onChange={setMode}
            options={[
              { value: "compress", label: t.compress },
              { value: "expand", label: t.expand },
              { value: "reverse", label: t.reverse },
              { value: "type", label: t.type },
            ]}
          />
        </>
      }
    >
      <CodeOutput title={t[mode]} value={out} labels={{ copy: t.copy, copied: t.copied, download: t.download }} filename="ipv6.txt" minRows={5} />
    </Split>
  );
}
