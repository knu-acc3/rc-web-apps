"use client";

import { Download } from "lucide-react";
import { useDeferredValue, useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { downloadBlob, downloadText } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Input, Select, Textarea } from "@/ui/field";
import { buildSitemaps, collectUrls, type ChangeFreq } from "./lib/sitemap";
import { Issues, More, Output } from "./ui/kit";

const T = {
  ru: {
    urls: "Адреса страниц — по одному на строку",
    drop: "Или перетащите файл .txt или .csv со ссылками",
    dropHint: "Из CSV берутся все ячейки, похожие на адреса",
    base: "Сайт для относительных путей",
    baseHint: "Нужен, если в списке есть пути вида /page",
    lastmod: "lastmod — дата изменения",
    changefreq: "changefreq",
    priority: "priority",
    none: "не указывать",
    auto: "по глубине URL",
    today: "сегодня",
    more: "lastmod, changefreq, priority",
    moreHint: "Google учитывает только lastmod, и только если дата честная; changefreq и priority он игнорирует.",
    stats: (n: number, files: number) => `${formatNumber("ru", n)} ${plural("ru", n, ["адрес", "адреса", "адресов"])}${files > 1 ? ` · ${files} ${plural("ru", files, ["файл", "файла", "файлов"])} + индекс` : ""}`,
    zip: "Скачать ZIP",
    download: "Скачать sitemap.xml целиком",
    invalid: (n: number, ex: string) => `${formatNumber("ru", n)} ${plural("ru", n, ["строка пропущена", "строки пропущены", "строк пропущено"])} — это не полный адрес http(s): ${ex}`,
    dups: (n: number) => `${formatNumber("ru", n)} ${plural("ru", n, ["дубль удалён", "дубля удалено", "дублей удалено"])}`,
    hosts: (h: string) => `В списке несколько доменов (${h}). Каждый sitemap должен содержать адреса только своего сайта.`,
    split: "Больше 50 000 адресов или 50 МБ — файл разбит на части, добавлен sitemap_index.xml. В robots.txt укажите индекс.",
    out: "sitemap.xml",
  },
  en: {
    urls: "Page URLs — one per line",
    drop: "Or drop a .txt or .csv file with links",
    dropHint: "Every CSV cell that looks like a URL is used",
    base: "Site for relative paths",
    baseHint: "Needed if the list contains paths like /page",
    lastmod: "lastmod — last modified",
    changefreq: "changefreq",
    priority: "priority",
    none: "omit",
    auto: "by URL depth",
    today: "today",
    more: "lastmod, changefreq, priority",
    moreHint: "Google only uses lastmod, and only when it's accurate; it ignores changefreq and priority.",
    stats: (n: number, files: number) => `${formatNumber("en", n)} ${plural("en", n, ["URL", "URLs"])}${files > 1 ? ` · ${files} files + index` : ""}`,
    zip: "Download ZIP",
    download: "Download the full sitemap.xml",
    invalid: (n: number, ex: string) => `${formatNumber("en", n)} ${plural("en", n, ["line", "lines"])} skipped — not a full http(s) URL: ${ex}`,
    dups: (n: number) => `${formatNumber("en", n)} ${plural("en", n, ["duplicate", "duplicates"])} removed`,
    hosts: (h: string) => `The list has several domains (${h}). Each sitemap should only list URLs of its own site.`,
    split: "Over 50,000 URLs or 50 MB — the sitemap is split into parts with a sitemap_index.xml. Point robots.txt at the index.",
    out: "sitemap.xml",
  },
} as const;

const PREVIEW = 200_000;

const FREQ: ChangeFreq[] = ["", "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

export default function SitemapGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState("");
  const [base, setBase] = useState("");
  const [lastmod, setLastmod] = useState("");
  const [freq, setFreq] = useState<ChangeFreq>("");
  const [priority, setPriority] = useState("");
  const [busy, setBusy] = useState(false);

  const deferred = useDeferredValue(text);
  const lines = deferred.split(/\r?\n/);
  const c = collectUrls(lines, base.trim() || undefined);
  const opts = { lastmod: lastmod === "today" ? new Date().toISOString().slice(0, 10) : lastmod, changefreq: freq, priority };
  const origin = (() => {
    try {
      return new URL(base.trim() || c.urls[0]).origin;
    } catch {
      return "";
    }
  })();
  const built = c.urls.length ? buildSitemaps(c.urls, opts, origin) : null;
  const multi = !!built?.index;
  const full = built ? (multi ? built.index! : built.files[0].xml) : "";
  const big = full.length > PREVIEW;
  const preview = big ? `${full.slice(0, full.lastIndexOf("</url>", PREVIEW) + 6)}\n<!-- … -->` : full;

  async function readFile(f: File) {
    const s = await f.text();
    const found = f.name.toLowerCase().endsWith(".csv") ? (s.match(/(?:https?:\/\/|\/)[^\s,;"']+/g) ?? []).join("\n") : s;
    setText(found);
  }

  async function zip() {
    if (!built?.index) return;
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const z = new JSZip();
      z.file("sitemap_index.xml", built.index);
      for (const f of built.files) z.file(f.name, f.xml);
      downloadBlob(await z.generateAsync({ type: "blob", compression: "DEFLATE" }), "sitemaps.zip");
    } finally {
      setBusy(false);
    }
  }

  const warnings: string[] = [];
  if (c.invalid.length) warnings.push(t.invalid(c.invalid.length, c.invalid.slice(0, 3).join(", ")));
  if (c.duplicates) warnings.push(t.dups(c.duplicates));
  if (c.hosts.length > 1) warnings.push(t.hosts(c.hosts.slice(0, 4).join(", ")));

  return (
    <div className="flex flex-col gap-5">
      <Field label={t.urls} htmlFor={`${id}-u`} aside={c.urls.length ? <span className="text-[0.8125rem] text-fg-3">{t.stats(c.urls.length, built?.files.length ?? 0)}</span> : undefined}>
        <Textarea id={`${id}-u`} value={text} onChange={(e) => setText(e.target.value)} rows={8} className="font-mono text-sm" spellCheck={false} placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/blog/post-1"} />
      </Field>
      <Dropzone compact accept=".txt,.csv,text/plain,text/csv" onFiles={(fs) => fs[0] && readFile(fs[0])} title={t.drop} hint={t.dropHint} />

      <div aria-live="polite" className="flex flex-col gap-2 empty:hidden">
        {warnings.length > 0 && <Issues items={warnings} />}
        {multi && <Issues tone="neutral" items={[t.split]} />}
      </div>

      {built &&
        (multi ? (
          <div className="flex flex-col gap-3">
            <Output locale={locale} value={preview} title="sitemap_index.xml" filename="sitemap_index.xml" mime="application/xml" rows={8} />
            <div>
              <Button variant="primary" onClick={zip} disabled={busy}>
                <Download className="size-4" aria-hidden />
                {t.zip}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Output locale={locale} value={preview} title={t.out} filename={big ? undefined : "sitemap.xml"} mime="application/xml" rows={12} />
            {big && (
              <div>
                <Button variant="primary" onClick={() => downloadText(full, "sitemap.xml", "application/xml")}>
                  <Download className="size-4" aria-hidden />
                  {t.download}
                </Button>
              </div>
            )}
          </div>
        ))}

      <More label={t.more}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.lastmod} htmlFor={`${id}-l`}>
              <Select id={`${id}-l`} value={lastmod === "" || lastmod === "today" ? lastmod : "date"} onChange={(e) => setLastmod(e.target.value === "date" ? new Date().toISOString().slice(0, 10) : e.target.value)}>
                <option value="">{t.none}</option>
                <option value="today">{t.today}</option>
                <option value="date">YYYY-MM-DD</option>
              </Select>
            </Field>
            <Field label={t.changefreq} htmlFor={`${id}-f`}>
              <Select id={`${id}-f`} value={freq} onChange={(e) => setFreq(e.target.value as ChangeFreq)}>
                {FREQ.map((f) => (
                  <option key={f} value={f}>
                    {f || t.none}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.priority} htmlFor={`${id}-pr`}>
              <Select id={`${id}-pr`} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">{t.none}</option>
                <option value="auto">{t.auto}</option>
                {["1.0", "0.8", "0.5"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {lastmod !== "" && lastmod !== "today" && <Input type="date" value={lastmod} onChange={(e) => setLastmod(e.target.value)} aria-label={t.lastmod} className="w-48" />}
          <Field label={t.base} htmlFor={`${id}-b`} hint={t.baseHint}>
            <Input id={`${id}-b`} value={base} onChange={(e) => setBase(e.target.value)} placeholder="https://example.com" inputMode="url" className="font-mono" spellCheck={false} autoComplete="off" />
          </Field>
          <p className="text-sm text-fg-3">{t.moreHint}</p>
        </div>
      </More>
    </div>
  );
}
