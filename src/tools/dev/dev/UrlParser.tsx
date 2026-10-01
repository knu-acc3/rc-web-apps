"use client";

import { Plus, X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { domainToUnicode } from "@/tools/dev/encode/lib/punycode";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Field, Input } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";

const T = {
  ru: {
    url: "URL",
    bad: "Это не полный URL — добавьте схему, например https://",
    parts: { protocol: "Протокол", username: "Пользователь", password: "Пароль", hostname: "Хост", idn: "Хост (Unicode)", port: "Порт", pathname: "Путь", search: "Строка запроса", hash: "Якорь (#)", origin: "Origin" },
    defaultPort: (p: string) => `по умолчанию (${p})`,
    params: "Параметры запроса",
    key: "Ключ",
    value: "Значение",
    add: "Добавить параметр",
    remove: "Удалить",
    segments: "Сегменты пути",
    empty: "—",
  },
  en: {
    url: "URL",
    bad: "Not a full URL — add a scheme such as https://",
    parts: { protocol: "Protocol", username: "Username", password: "Password", hostname: "Host", idn: "Host (Unicode)", port: "Port", pathname: "Path", search: "Query string", hash: "Fragment (#)", origin: "Origin" },
    defaultPort: (p: string) => `default (${p})`,
    params: "Query parameters",
    key: "Key",
    value: "Value",
    add: "Add parameter",
    remove: "Remove",
    segments: "Path segments",
    empty: "—",
  },
} as const;

const DEFAULT_PORT: Record<string, string> = { "http:": "80", "https:": "443", "ftp:": "21", "ws:": "80", "wss:": "443" };

function tryUrl(s: string): URL | null {
  try {
    return new URL(s.trim());
  } catch {
    return null;
  }
}

export default function UrlParser({ locale, sample }: { locale: Locale; sample: string }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(sample);
  const url = useMemo(() => tryUrl(text), [text]);
  const params = useMemo(() => (url ? [...url.searchParams.entries()] : []), [url]);

  const setParams = (rows: [string, string][]) => {
    if (!url) return;
    const u = new URL(url.href);
    u.search = new URLSearchParams(rows).toString();
    setText(u.href);
  };

  let idn = "";
  if (url?.hostname.includes("xn--")) {
    try {
      idn = domainToUnicode(url.hostname);
    } catch {
      idn = "";
    }
  }

  const rows: [string, string][] = url
    ? [
        [t.parts.protocol, url.protocol],
        ...(url.username ? [[t.parts.username, decodeURIComponent(url.username)] as [string, string]] : []),
        ...(url.password ? [[t.parts.password, "•".repeat(Math.min(12, url.password.length))] as [string, string]] : []),
        [t.parts.hostname, url.hostname],
        ...(idn ? [[t.parts.idn, idn] as [string, string]] : []),
        [t.parts.port, url.port || (DEFAULT_PORT[url.protocol] ? t.defaultPort(DEFAULT_PORT[url.protocol]) : t.empty)],
        [t.parts.pathname, safeDecode(url.pathname)],
        [t.parts.search, url.search || t.empty],
        [t.parts.hash, url.hash ? safeDecode(url.hash) : t.empty],
        [t.parts.origin, url.origin],
      ]
    : [];
  const segments = url ? url.pathname.split("/").filter(Boolean).map(safeDecode) : [];

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-4 sm:p-6">
        <Field label={t.url} htmlFor={`${id}-u`}>
          <Input id={`${id}-u`} size="lg" value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-base!" spellCheck={false} autoComplete="off" aria-invalid={!!text.trim() && !url} />
        </Field>
        {text.trim() && !url && (
          <Notice tone="err" className="mt-3">
            {t.bad}
          </Notice>
        )}
        {url && (
          <dl className="mt-4 grid gap-x-4 gap-y-2 sm:grid-cols-[10rem_1fr]" aria-live="polite">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-sm text-fg-3">{k}</dt>
                <dd className="min-w-0 font-mono text-[0.9375rem] break-all text-fg">{v}</dd>
              </div>
            ))}
            {segments.length > 1 && (
              <div className="contents">
                <dt className="text-sm text-fg-3">{t.segments}</dt>
                <dd className="flex min-w-0 flex-wrap gap-1.5">
                  {segments.map((s, i) => (
                    <code key={i} className="rounded-[0.375rem] bg-surface-2 px-1.5 py-0.5 font-mono text-[0.8125rem] text-fg">
                      {s}
                    </code>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        )}
      </Panel>

      {url && (
        <Panel className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-fg">{t.params}</h2>
            <CopyButton value={url.href} size="sm" variant="ghost" />
          </div>
          <div className="flex flex-col gap-2">
            {params.map(([k, v], i) => (
              <div key={i} className="grid grid-cols-[1fr_1.5fr_auto] gap-2">
                <Input size="sm" aria-label={`${t.key} ${i + 1}`} value={k} className="font-mono" onChange={(e) => setParams(params.map((p, j) => (j === i ? [e.target.value, p[1]] : p)))} />
                <Input size="sm" aria-label={`${t.value} ${i + 1}`} value={v} className="font-mono" onChange={(e) => setParams(params.map((p, j) => (j === i ? [p[0], e.target.value] : p)))} />
                <Button size="icon-sm" variant="ghost" aria-label={t.remove} title={t.remove} onClick={() => setParams(params.filter((_, j) => j !== i))}>
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setParams([...params, ["", ""]])}>
            <Plus aria-hidden />
            {t.add}
          </Button>
        </Panel>
      )}
    </div>
  );
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
