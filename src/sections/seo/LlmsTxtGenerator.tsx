"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Field, Input, Textarea } from "@/ui/field";
import { buildLlmsTxt } from "./lib/outline";
import { Issues, More, Output } from "./ui";

const T = {
  ru: {
    name: "Название сайта или проекта",
    summary: "Краткое описание — одна-две фразы",
    links: "Разделы и ссылки",
    linksHint: "«## Раздел» начинает раздел; ссылка — «Название | URL | пояснение». Раздел «## Optional» можно пропустить при нехватке контекста.",
    details: "Подробности (Markdown, необязательно)",
    more: "Подробный текст",
    bad: (n: number) => `Строка ${n}: не найден адрес — формат «Название | https://… | пояснение»`,
    out: "llms.txt",
    where: "Положите файл в корень сайта: https://ваш-сайт/llms.txt. Это предложенный стандарт (llmstxt.org): его читают некоторые AI-ассистенты и инструменты разработчиков, поисковики на него не опираются.",
    sampleName: "Мой сервис",
    sampleSummary: "Онлайн-сервис для учёта заказов малого бизнеса.",
    sampleLinks: "## Документация\nНачало работы | https://example.com/docs/start | установка и первый заказ\nAPI | https://example.com/docs/api\n\n## Optional\nИстория изменений | https://example.com/changelog",
  },
  en: {
    name: "Site or project name",
    summary: "Short summary — a sentence or two",
    links: "Sections and links",
    linksHint: "“## Section” starts a section; a link is “Title | URL | notes”. The “## Optional” section can be skipped when context is short.",
    details: "Details (Markdown, optional)",
    more: "Detailed text",
    bad: (n: number) => `Line ${n}: no URL found — use “Title | https://… | notes”`,
    out: "llms.txt",
    where: "Put the file at the site root: https://your-site/llms.txt. It's a proposed standard (llmstxt.org) read by some AI assistants and developer tools; search engines don't rely on it.",
    sampleName: "My service",
    sampleSummary: "An online order tracker for small businesses.",
    sampleLinks: "## Docs\nQuickstart | https://example.com/docs/start | install and create your first order\nAPI | https://example.com/docs/api\n\n## Optional\nChangelog | https://example.com/changelog",
  },
} as const;

export default function LlmsTxtGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [name, setName] = useState<string>(t.sampleName);
  const [summary, setSummary] = useState<string>(t.sampleSummary);
  const [details, setDetails] = useState("");
  const [links, setLinks] = useState<string>(t.sampleLinks);
  const r = buildLlmsTxt({ name, summary, details, links });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} htmlFor={`${id}-n`}>
          <Input id={`${id}-n`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label={t.summary} htmlFor={`${id}-s`}>
          <Input id={`${id}-s`} value={summary} onChange={(e) => setSummary(e.target.value)} autoComplete="off" />
        </Field>
      </div>
      <Field label={t.links} htmlFor={`${id}-l`} hint={t.linksHint}>
        <Textarea id={`${id}-l`} value={links} onChange={(e) => setLinks(e.target.value)} rows={8} className="font-mono text-sm" spellCheck={false} />
      </Field>
      <More label={t.more}>
        <Field label={t.details} htmlFor={`${id}-d`}>
          <Textarea id={`${id}-d`} value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
        </Field>
      </More>
      <div aria-live="polite">
        <Issues items={r.bad.map(t.bad)} />
      </div>
      <Output locale={locale} value={r.text} title={t.out} filename="llms.txt" mime="text/markdown;charset=utf-8" rows={12} />
      <p className="text-sm text-fg-3">{t.where}</p>
    </div>
  );
}
