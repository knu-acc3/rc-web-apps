"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { hreflangHeader, hreflangHtml, hreflangIssues, hreflangSitemap, normalizeCode, type HreflangIssue, type HreflangRow } from "./lib/hreflang";
import { Issues, Output } from "./ui";

type Format = "html" | "header" | "sitemap";

const SAMPLE = `ru https://example.com/ru/
en https://example.com/en/
kk-KZ https://example.com/kz/
x-default https://example.com/`;

const T = {
  ru: {
    input: "Версии страницы: код языка и адрес через пробел, по одной на строку",
    hint: "Код — язык ISO 639-1 (ru, en, kk) и, если нужно, регион ISO 3166-1 (en-GB, ru-KZ); x-default — версия по умолчанию",
    format: "Формат",
    html: "HTML <link>",
    header: "HTTP-заголовок",
    sitemap: "sitemap.xml",
    bad: (n: number) => `Строка ${n}: не удалось разобрать — нужен код и адрес через пробел`,
    issue: {
      format: "код записан неверно: используйте дефис, а не подчёркивание (en-US, а не en_US)",
      language: "первым идёт код языка ISO 639-1, а не страны (например, uk — украинский, а не Великобритания)",
      region: "регион должен быть кодом страны ISO 3166-1 alpha-2 (US, GB, KZ); коды вроде 419 Google не поддерживает",
      uk: "Великобритания — GB, а не UK: пишите en-GB",
      eu: "EU не страна — hreflang не поддерживает регион «Европа»; укажите страны или только язык",
      url: "нужен полный адрес с https://",
      duplicate: "этот код уже встречался — у каждого языка/региона должен быть один адрес",
      noDefault: "",
    } as Record<HreflangIssue, string>,
    noDefault: "Добавьте x-default — страницу для пользователей, чей язык не подошёл ни к одной версии",
    line: (n: number) => `Строка ${n}`,
    note: "Разметка должна быть взаимной: каждая версия ссылается на все остальные и на себя. Разместите один и тот же блок на всех страницах набора.",
  },
  en: {
    input: "Page versions: language code and URL separated by a space, one per line",
    hint: "The code is an ISO 639-1 language (en, de, ru) and optionally an ISO 3166-1 region (en-GB, es-MX); x-default is the fallback",
    format: "Format",
    html: "HTML <link>",
    header: "HTTP header",
    sitemap: "sitemap.xml",
    bad: (n: number) => `Line ${n}: couldn't parse — expected a code and a URL separated by a space`,
    issue: {
      format: "wrong format: use a hyphen, not an underscore (en-US, not en_US)",
      language: "the first part must be an ISO 639-1 language code, not a country (e.g. uk is Ukrainian, not the United Kingdom)",
      region: "the region must be an ISO 3166-1 alpha-2 country code (US, GB, DE); codes like 419 aren't supported by Google",
      uk: "The United Kingdom is GB, not UK: write en-GB",
      eu: "EU isn't a country — hreflang has no “Europe” region; list countries or use the language only",
      url: "use a full URL with https://",
      duplicate: "this code is already used — each language/region needs exactly one URL",
      noDefault: "",
    } as Record<HreflangIssue, string>,
    noDefault: "Add x-default — the page for users whose language matches none of the versions",
    line: (n: number) => `Line ${n}`,
    note: "Annotations must be reciprocal: every version links to all others and to itself. Put the same block on every page of the set.",
  },
} as const;

export default function HreflangGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(SAMPLE);
  const [format, setFormat] = useState<Format>("html");

  const rows: HreflangRow[] = [];
  const lineOf: number[] = [];
  const bad: number[] = [];
  text.split(/\r?\n/).forEach((l, i) => {
    const s = l.trim();
    if (!s) return;
    const m = s.match(/^(\S+)\s*[\s,;|=]\s*(\S+)$/);
    if (!m) {
      bad.push(i + 1);
      return;
    }
    rows.push({ code: m[1], url: m[2] });
    lineOf.push(i + 1);
  });
  const issues = hreflangIssues(rows);
  const messages = [
    ...bad.map(t.bad),
    ...issues.map((x) => (x.issue === "noDefault" ? t.noDefault : `${t.line(lineOf[x.row])} (${normalizeCode(rows[x.row].code)}): ${t.issue[x.issue]}`)),
  ];
  const out = format === "html" ? hreflangHtml(rows) : format === "header" ? hreflangHeader(rows) : hreflangSitemap(rows);

  return (
    <div className="flex flex-col gap-5">
      <Field label={t.input} htmlFor={`${id}-i`} hint={t.hint}>
        <Textarea id={`${id}-i`} value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-mono text-sm" spellCheck={false} />
      </Field>
      <div aria-live="polite">
        <Issues items={messages} />
      </div>
      <Segmented<Format>
        label={t.format}
        value={format}
        onChange={setFormat}
        options={[
          { value: "html", label: t.html },
          { value: "header", label: t.header },
          { value: "sitemap", label: t.sitemap },
        ]}
      />
      <Output locale={locale} value={out} title={format === "html" ? t.html : format === "header" ? t.header : t.sitemap} filename={format === "sitemap" ? "sitemap.xml" : undefined} mime="application/xml" rows={8} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
