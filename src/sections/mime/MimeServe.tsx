"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Tabs } from "@/ui/tabs";

type Server = "nginx" | "apache" | "iis" | "express" | "s3";

export interface MimeServeProps {
  locale: Locale;
  ext: string;
  type: string;
  alts: string[];
  textual: boolean;
  compressible: boolean;
}

const T = {
  ru: {
    label: "Content-Type для",
    alts: "Также встречается",
    how: "Как отдавать с правильным типом",
    copy: "Копировать",
    copied: "Скопировано",
    nginx: "# /etc/nginx/mime.types — внутри блока types { }, затем nginx -s reload",
    nginxGzip: "# сжатие (в блоке http)",
    apache: "# .htaccess или конфигурация сайта",
    apacheGzip: "# сжатие (mod_deflate)",
    iis: "<!-- web.config в корне сайта -->",
    express: "// Express берёт тип из mime-db автоматически; явно:",
    s3: "# Загрузка в S3 с правильным Content-Type",
    s3Head: "# Проверить заголовки",
  },
  en: {
    label: "Content-Type for",
    alts: "Also seen",
    how: "How to serve it with the right type",
    copy: "Copy",
    copied: "Copied",
    nginx: "# /etc/nginx/mime.types — inside types { }, then nginx -s reload",
    nginxGzip: "# compression (http block)",
    apache: "# .htaccess or site config",
    apacheGzip: "# compression (mod_deflate)",
    iis: "<!-- web.config in the site root -->",
    express: "// Express looks types up in mime-db automatically; explicitly:",
    s3: "# Upload to S3 with the right Content-Type",
    s3Head: "# Check the headers",
  },
} as const;

function snippet(server: Server, p: MimeServeProps): string {
  const t = T[p.locale];
  const ct = p.textual ? `${p.type}; charset=utf-8` : p.type;
  switch (server) {
    case "nginx":
      return [t.nginx, `${p.type}    ${p.ext};`, ...(p.compressible ? ["", t.nginxGzip, `gzip_types ${p.type};`] : [])].join("\n");
    case "apache":
      return [t.apache, `AddType ${p.type} .${p.ext}`, ...(p.textual ? [`AddCharset UTF-8 .${p.ext}`] : []), ...(p.compressible ? ["", t.apacheGzip, `AddOutputFilterByType DEFLATE ${p.type}`] : [])].join("\n");
    case "iis":
      return [t.iis, "<configuration>", "  <system.webServer>", "    <staticContent>", `      <remove fileExtension=".${p.ext}" />`, `      <mimeMap fileExtension=".${p.ext}" mimeType="${p.type}" />`, "    </staticContent>", "  </system.webServer>", "</configuration>"].join("\n");
    case "express":
      return [t.express, `res.type(".${p.ext}");`, `res.set("Content-Type", "${ct}");`, "", "app.use(express.static(\"public\", {", "  setHeaders(res, path) {", `    if (path.endsWith(".${p.ext}")) res.set("Content-Type", "${ct}");`, "  },", "}));"].join("\n");
    case "s3":
      return [t.s3, `aws s3 cp file.${p.ext} s3://my-bucket/file.${p.ext} --content-type "${ct}"`, "", t.s3Head, `curl -sI https://example.com/file.${p.ext} | grep -i content-type`].join("\n");
  }
}

/** Focal card of an extension page: the type itself and copyable server snippets. */
export default function MimeServe(props: MimeServeProps) {
  const { locale, ext, type, alts } = props;
  const t = T[locale];
  const [server, setServer] = useState<Server>("nginx");
  const code = snippet(server, props);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] bg-surface-2 px-4 py-4 sm:px-5">
        <div className="text-sm text-fg-2">
          {t.label} <span className="font-mono font-semibold text-fg">.{ext}</span>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div aria-live="polite" className="min-w-0 font-mono text-xl font-semibold break-all text-fg sm:text-2xl">
            {type}
          </div>
          <CopyButton value={type} label={t.copy} copiedLabel={t.copied} />
        </div>
        {alts.length > 0 && (
          <div className="mt-2 text-sm text-fg-3">
            {t.alts}: <span className="font-mono break-all">{alts.join(", ")}</span>
          </div>
        )}
      </div>
      <section className="flex min-w-0 flex-col overflow-hidden rounded-[12px] border border-line bg-surface">
        <div className="flex items-center justify-between gap-2 px-4 pt-2">
          <h2 className="text-sm font-semibold text-fg-2">{t.how}</h2>
          <CopyButton value={code.split("\n").filter((l) => !/^\s*(#|\/\/|<!--)/.test(l)).join("\n").trim()} label={t.copy} copiedLabel={t.copied} variant="ghost" />
        </div>
        <Tabs
          label={t.how}
          value={server}
          onChange={setServer}
          className="px-2"
          items={[
            { value: "nginx", label: "nginx" },
            { value: "apache", label: "Apache" },
            { value: "iis", label: "IIS" },
            { value: "express", label: "Express" },
            { value: "s3", label: "S3" },
          ]}
        />
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed text-fg">
          <code>{code}</code>
        </pre>
      </section>
    </div>
  );
}
