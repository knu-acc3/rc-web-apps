"use client";

import { ImageIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Field, Input, Textarea } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { attr } from "./lib/serp";
import { FieldGrid, Issues, More, Output, type FieldSpec, type Fields } from "./ui";

type Platform = "telegram" | "whatsapp" | "facebook" | "x" | "vk";

const T = {
  ru: {
    title: "Заголовок (og:title)",
    desc: "Описание (og:description)",
    url: "Адрес страницы (og:url)",
    image: "Ссылка на картинку (og:image)",
    pick: "Картинка для превью",
    pickHint: "Файл не загружается на сервер — он нужен только для предпросмотра и проверки размеров",
    platform: "Где смотреть",
    more: "Тип, язык, Twitter/X",
    code: "Мета-теги для <head>",
    noImage: "Без картинки",
    size: (w: number, h: number, kb: number) => `${w}×${h} px · ${kb} КБ`,
    issues: {
      relImage: "og:image должен быть полным адресом с https:// — относительные пути соцсети не загружают",
      relUrl: "og:url должен быть полным адресом с https://",
      noImage: "Без og:image ссылка будет выглядеть как простой текст — добавьте картинку 1200×630",
      small: "Картинка меньше 1200×630: на больших превью она будет размытой или показана маленькой",
      ratio: "Пропорции далеки от 1,91:1 — края картинки обрежутся в ленте",
      heavy: "Файл больше 5 МБ: X (Twitter) его не покажет, а мессенджеры могут не дождаться загрузки",
    },
    phTitle: "Заголовок ссылки",
    phDesc: "Короткое описание страницы, которое увидят в соцсетях и мессенджерах.",
  },
  en: {
    title: "Title (og:title)",
    desc: "Description (og:description)",
    url: "Page URL (og:url)",
    image: "Image URL (og:image)",
    pick: "Image for the preview",
    pickHint: "The file isn't uploaded — it's only used for the preview and a size check",
    platform: "Preview in",
    more: "Type, locale, Twitter/X",
    code: "Meta tags for <head>",
    noImage: "No image",
    size: (w: number, h: number, kb: number) => `${w}×${h} px · ${kb} KB`,
    issues: {
      relImage: "og:image must be a full URL with https:// — social networks don't load relative paths",
      relUrl: "og:url must be a full URL with https://",
      noImage: "Without og:image the link shows as plain text — add a 1200×630 image",
      small: "The image is smaller than 1200×630: large previews will look blurry or small",
      ratio: "The aspect ratio is far from 1.91:1 — edges will be cropped in feeds",
      heavy: "The file is over 5 MB: X (Twitter) won't show it and messengers may time out",
    },
    phTitle: "Link title",
    phDesc: "A short page description people see in social feeds and messengers.",
  },
} as const;

const MORE: FieldSpec[] = [
  { key: "siteName", kind: "text", label: { ru: "Название сайта (og:site_name)", en: "Site name (og:site_name)" }, half: true },
  { key: "type", kind: "select", label: { ru: "Тип (og:type)", en: "Type (og:type)" }, options: [["website", "website"], ["article", "article"], ["product", "product"], ["profile", "profile"], ["video.other", "video.other"]], half: true },
  { key: "locale", kind: "select", label: { ru: "Язык (og:locale)", en: "Locale (og:locale)" }, options: [["ru_RU", "ru_RU"], ["en_US", "en_US"], ["en_GB", "en_GB"], ["kk_KZ", "kk_KZ"], ["uk_UA", "uk_UA"], ["de_DE", "de_DE"]], half: true },
  { key: "card", kind: "select", label: { ru: "Карточка X (twitter:card)", en: "X card (twitter:card)" }, options: [["summary_large_image", "summary_large_image"], ["summary", "summary"]], half: true },
  { key: "twitter", kind: "text", label: { ru: "Аккаунт X (twitter:site)", en: "X account (twitter:site)" }, placeholder: "@username", half: true, mono: true },
  { key: "alt", kind: "text", label: { ru: "Описание картинки (og:image:alt)", en: "Image alt (og:image:alt)" }, half: true },
];

interface Img {
  src: string;
  w: number;
  h: number;
  bytes: number;
}

export default function OpenGraphGenerator({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");
  const [more, setMore] = useState<Fields>({ type: "website", locale: locale === "ru" ? "ru_RU" : "en_US", card: "summary_large_image" });
  const [img, setImg] = useState<Img | null>(null);
  const [platform, setPlatform] = useState<Platform>("telegram");

  useEffect(() => () => {
    if (img) URL.revokeObjectURL(img.src);
  }, [img]);

  function pick(f: File | undefined) {
    if (!f || !f.type.startsWith("image/")) return;
    const src = URL.createObjectURL(f);
    const el = new Image();
    el.onload = () => setImg({ src, w: el.naturalWidth, h: el.naturalHeight, bytes: f.size });
    el.src = src;
  }

  const abs = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());
  let host = "example.com";
  try {
    if (url.trim()) host = new URL(url.trim()).hostname.replace(/^www\./, "");
  } catch {
    /* keep default */
  }

  const issues: string[] = [];
  if (title || desc || url || image) {
    if (image.trim() && !abs(image)) issues.push(t.issues.relImage);
    if (url.trim() && !abs(url)) issues.push(t.issues.relUrl);
    if (!image.trim()) issues.push(t.issues.noImage);
  }
  if (img) {
    if (img.w < 1200 || img.h < 630) issues.push(t.issues.small);
    const r = img.w / img.h;
    if (more.card !== "summary" && (r < 1.6 || r > 2.2)) issues.push(t.issues.ratio);
    if (img.bytes > 5 * 1024 * 1024) issues.push(t.issues.heavy);
  }

  const m = (p: string, c: string, name = false) => (c.trim() ? `<meta ${name ? "name" : "property"}="${p}" content="${attr(c.trim())}">` : "");
  const code = [
    m("og:type", more.type || "website"),
    m("og:title", title),
    m("og:description", desc),
    m("og:url", url),
    m("og:image", image),
    img && image.trim() ? m("og:image:width", String(img.w)) : "",
    img && image.trim() ? m("og:image:height", String(img.h)) : "",
    image.trim() ? m("og:image:alt", more.alt ?? "") : "",
    m("og:site_name", more.siteName ?? ""),
    m("og:locale", more.locale ?? ""),
    m("twitter:card", more.card || "summary_large_image", true),
    m("twitter:site", more.twitter ?? "", true),
  ]
    .filter(Boolean)
    .join("\n");

  const shownTitle = title.trim() || t.phTitle;
  const shownDesc = desc.trim() || t.phDesc;
  const picture = img ? (
    // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
    <img src={img.src} alt="" className="size-full object-cover" />
  ) : (
    <div className="flex size-full items-center justify-center text-fg-3">
      <ImageIcon className="size-8" aria-hidden />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <Segmented<Platform>
          label={t.platform}
          value={platform}
          onChange={setPlatform}
          wrap
          options={[
            { value: "telegram", label: "Telegram" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "facebook", label: "Facebook" },
            { value: "x", label: "X" },
            { value: "vk", label: "VK" },
          ]}
        />
        <div className="w-full max-w-[27.5rem]">
          {platform === "telegram" && (
            <div className="rounded-[0.75rem] bg-surface-2 p-3">
              <div className="border-l-[3px] border-accent pl-2.5">
                <div className="text-sm font-semibold text-accent">{more.siteName?.trim() || host}</div>
                <div className="text-sm font-semibold text-fg">{shownTitle}</div>
                <div className="line-clamp-3 text-sm text-fg-2">{shownDesc}</div>
                <div className="mt-2 aspect-[1.91/1] overflow-hidden rounded-[0.5rem] bg-surface">{picture}</div>
              </div>
            </div>
          )}
          {platform === "whatsapp" && (
            <div className="overflow-hidden rounded-[0.75rem] bg-surface-2">
              <div className="aspect-[1.91/1] bg-surface">{picture}</div>
              <div className="px-3 py-2">
                <div className="line-clamp-2 text-sm font-semibold text-fg">{shownTitle}</div>
                <div className="line-clamp-1 text-[0.8125rem] text-fg-2">{shownDesc}</div>
                <div className="text-[0.8125rem] text-fg-3">{host}</div>
              </div>
            </div>
          )}
          {platform === "facebook" && (
            <div className="overflow-hidden rounded-[0.5rem] border border-line">
              <div className="aspect-[1.91/1] bg-surface-2">{picture}</div>
              <div className="bg-surface-2 px-3 py-2.5">
                <div className="text-xs text-fg-3 uppercase">{host}</div>
                <div className="line-clamp-2 text-[0.9375rem] font-semibold text-fg">{shownTitle}</div>
                <div className="line-clamp-1 text-sm text-fg-2">{shownDesc}</div>
              </div>
            </div>
          )}
          {platform === "x" && (
            <div className={cn("relative overflow-hidden rounded-[1rem] border border-line", more.card === "summary" && "flex items-center gap-3 p-0")}>
              {more.card === "summary" ? (
                <>
                  <div className="size-[7.5rem] shrink-0 bg-surface-2">{picture}</div>
                  <div className="min-w-0 py-2 pr-3">
                    <div className="text-sm text-fg-3">{host}</div>
                    <div className="line-clamp-1 text-[0.9375rem] text-fg">{shownTitle}</div>
                    <div className="line-clamp-2 text-sm text-fg-2">{shownDesc}</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="aspect-[1.91/1] bg-surface-2">{picture}</div>
                  <span className="absolute bottom-2.5 left-2.5 rounded-[0.25rem] bg-black/60 px-1.5 py-0.5 text-[0.8125rem] text-white">{host}</span>
                </>
              )}
            </div>
          )}
          {platform === "vk" && (
            <div className="overflow-hidden rounded-[0.625rem] border border-line">
              <div className="aspect-[1.91/1] bg-surface-2">{picture}</div>
              <div className="px-3 py-2.5">
                <div className="line-clamp-2 text-[0.9375rem] font-medium text-fg">{shownTitle}</div>
                <div className="text-[0.8125rem] text-fg-3">{host}</div>
              </div>
            </div>
          )}
        </div>
        {img && <p className="text-[0.8125rem] text-fg-3">{t.size(img.w, img.h, Math.round(img.bytes / 1024))}</p>}
      </div>

      <Field label={t.title} htmlFor={`${id}-t`}>
        <Input id={`${id}-t`} value={title} onChange={(e) => setTitle(e.target.value)} size="lg" autoComplete="off" />
      </Field>
      <Field label={t.desc} htmlFor={`${id}-d`}>
        <Textarea id={`${id}-d`} value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.url} htmlFor={`${id}-u`}>
          <Input id={`${id}-u`} value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://example.com/page" className="font-mono" spellCheck={false} autoComplete="off" />
        </Field>
        <Field label={t.image} htmlFor={`${id}-i`}>
          <Input id={`${id}-i`} value={image} onChange={(e) => setImage(e.target.value)} inputMode="url" placeholder="https://example.com/og.jpg" className="font-mono" spellCheck={false} autoComplete="off" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button variant="outline" size="sm" onClick={() => file.current?.click()}>
          <ImageIcon className="size-4" aria-hidden />
          {t.pick}
        </Button>
        <span className="text-[0.8125rem] text-fg-3">{t.pickHint}</span>
      </div>

      <div aria-live="polite">
        <Issues items={issues} />
      </div>

      <More label={t.more}>
        <FieldGrid specs={MORE} f={more} set={(k, v) => setMore((o) => ({ ...o, [k]: v }))} locale={locale} id={`${id}-m`} />
      </More>

      <Output locale={locale} value={code} title={t.code} rows={8} />
    </div>
  );
}
