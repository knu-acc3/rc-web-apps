"use client";

import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Checkbox, Field, Input, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { attr, breadcrumbUrl, FONTS, html, LIMITS, truncateToWidth } from "./lib/serp";
import { measurer, useClient } from "./measure";
import { Issues, Meter, More, Output } from "./ui";

const T = {
  ru: {
    title: "Title — заголовок страницы",
    desc: "Meta description — описание",
    url: "Адрес страницы",
    device: "Устройство",
    desktop: "Компьютер",
    mobile: "Телефон",
    titleW: "Ширина title",
    descW: "Ширина описания",
    px: "px",
    chars: (n: number) => `${n} симв.`,
    more: "Canonical и индексация",
    canonical: "Canonical URL (если отличается от адреса)",
    noindex: "Не индексировать страницу (noindex)",
    nofollow: "Не переходить по ссылкам (nofollow)",
    code: "HTML для <head>",
    phTitle: "Заголовок страницы — так он будет выглядеть в Google",
    phDesc: "Описание страницы: одно-два предложения о том, что пользователь найдёт на странице и почему стоит перейти.",
    issues: {
      noTitle: "Добавьте title — без него поисковик придумает заголовок сам",
      longTitle: "Title длиннее ~600 px: Google обрежет его многоточием",
      shortTitle: "Title очень короткий — добавьте ключевую фразу и уточнение",
      longDesc: "Описание длиннее ~920 px: на компьютере оно будет обрезано",
      shortDesc: "Описание короче 70 символов — Google чаще заменяет такие фрагментом текста страницы",
    },
    note: "Ширина измеряется шрифтом Arial, как в выдаче Google. Лимиты приблизительные: Google может показать другой фрагмент или переписать заголовок.",
  },
  en: {
    title: "Title tag",
    desc: "Meta description",
    url: "Page URL",
    device: "Device",
    desktop: "Desktop",
    mobile: "Mobile",
    titleW: "Title width",
    descW: "Description width",
    px: "px",
    chars: (n: number) => `${n} chars`,
    more: "Canonical and indexing",
    canonical: "Canonical URL (if different from the page URL)",
    noindex: "Don't index this page (noindex)",
    nofollow: "Don't follow links (nofollow)",
    code: "HTML for <head>",
    phTitle: "Page title — this is how it looks in Google",
    phDesc: "Page description: a sentence or two on what people will find on the page and why they should click.",
    issues: {
      noTitle: "Add a title — otherwise the search engine makes one up",
      longTitle: "The title is wider than ~600 px: Google will cut it with an ellipsis",
      shortTitle: "The title is very short — add the key phrase and a qualifier",
      longDesc: "The description is wider than ~920 px: it will be cut on desktop",
      shortDesc: "Descriptions under 70 characters are often replaced by page text in Google",
    },
    note: "Widths are measured in Arial, as in Google results. Limits are approximate: Google may show another snippet or rewrite the title.",
  },
} as const;

type Device = "desktop" | "mobile";

export default function MetaTagGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const client = useClient();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [canonical, setCanonical] = useState("");
  const [noindex, setNoindex] = useState(false);
  const [nofollow, setNofollow] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  const mTitle = measurer(FONTS.desktopTitle);
  const mDesc = measurer(FONTS.description);
  const lim = LIMITS[device];
  const shownTitle = title.trim() || t.phTitle;
  const shownDesc = desc.trim() || t.phDesc;
  const tt = client ? truncateToWidth(shownTitle, lim.title, mTitle) : { text: shownTitle, truncated: false, width: 0 };
  const dd = client ? truncateToWidth(shownDesc, lim.description, mDesc) : { text: shownDesc, truncated: false, width: 0 };
  const titleW = client && title.trim() ? mTitle(title.trim()) : 0;
  const descW = client && desc.trim() ? mDesc(desc.trim()) : 0;
  const crumb = breadcrumbUrl(url.trim() || "https://example.com/page");

  const issues: string[] = [];
  if (title || desc) {
    if (!title.trim()) issues.push(t.issues.noTitle);
    else if (titleW > LIMITS.desktop.title) issues.push(t.issues.longTitle);
    else if (title.trim().length < 15) issues.push(t.issues.shortTitle);
    if (descW > LIMITS.desktop.description) issues.push(t.issues.longDesc);
    else if (desc.trim() && desc.trim().length < 70) issues.push(t.issues.shortDesc);
  }

  const robots = [noindex ? "noindex" : "", nofollow ? "nofollow" : ""].filter(Boolean);
  const code = [
    title.trim() && `<title>${html(title.trim())}</title>`,
    desc.trim() && `<meta name="description" content="${attr(desc.trim())}">`,
    (canonical.trim() || url.trim()) && `<link rel="canonical" href="${attr(canonical.trim() || url.trim())}">`,
    robots.length && `<meta name="robots" content="${robots.join(", ")}">`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex flex-col gap-5">
      <div className={cn("w-full rounded-[0.75rem] border border-line bg-surface p-4 sm:p-5", device === "mobile" ? "mx-auto max-w-[25rem]" : "max-w-[40.75rem]")}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-fg-2" aria-hidden>
            {crumb.site.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm text-fg">{crumb.site}</div>
            <div className="truncate text-xs text-fg-3">
              {crumb.site}
              {crumb.path}
            </div>
          </div>
        </div>
        <div className={cn("mt-2 text-xl leading-snug break-words [font-family:Arial,sans-serif]", title.trim() ? "text-accent" : "text-fg-3")}>{tt.text}</div>
        <p className={cn("mt-1 text-sm leading-[1.375rem] [font-family:Arial,sans-serif]", desc.trim() ? "text-fg-2" : "text-fg-3")}>{dd.text}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Meter label={t.titleW} value={titleW} max={LIMITS.desktop.title} unit={t.px} />
        <Meter label={t.descW} value={descW} max={LIMITS.desktop.description} unit={t.px} />
      </div>

      <Field label={t.title} htmlFor={`${id}-t`} aside={<span className="text-[0.8125rem] text-fg-3 tabular-nums">{t.chars(title.trim().length)}</span>}>
        <Input id={`${id}-t`} value={title} onChange={(e) => setTitle(e.target.value)} size="lg" autoComplete="off" />
      </Field>
      <Field label={t.desc} htmlFor={`${id}-d`} aside={<span className="text-[0.8125rem] text-fg-3 tabular-nums">{t.chars(desc.trim().length)}</span>}>
        <Textarea id={`${id}-d`} value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
      </Field>

      <div className="flex flex-wrap items-end gap-4">
        <Field label={t.url} htmlFor={`${id}-u`} className="min-w-0 flex-1 basis-64">
          <Input id={`${id}-u`} value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://example.com/page" className="font-mono" spellCheck={false} autoComplete="off" />
        </Field>
        <Segmented<Device>
          label={t.device}
          value={device}
          onChange={setDevice}
          options={[
            { value: "desktop", label: t.desktop },
            { value: "mobile", label: t.mobile },
          ]}
        />
      </div>

      <div aria-live="polite">
        <Issues items={issues} />
      </div>

      <More label={t.more}>
        <div className="flex flex-col gap-3">
          <Field label={t.canonical} htmlFor={`${id}-c`}>
            <Input id={`${id}-c`} value={canonical} onChange={(e) => setCanonical(e.target.value)} inputMode="url" className="font-mono" spellCheck={false} autoComplete="off" />
          </Field>
          <Checkbox label={t.noindex} checked={noindex} onChange={(e) => setNoindex(e.target.checked)} />
          <Checkbox label={t.nofollow} checked={nofollow} onChange={(e) => setNofollow(e.target.checked)} />
        </div>
      </More>

      <Output locale={locale} value={code} title={t.code} rows={5} />
      <p className="text-sm text-fg-3">{t.note}</p>
    </div>
  );
}
