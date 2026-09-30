import type { Metadata } from "next";
import { ArrowRight, Lock, Smartphone, UserX } from "lucide-react";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL } from "@/config/brand";
import { href, isLocale, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import { toneVars } from "@/lib/tone";
import { catalog, linkFor } from "@/registry";
import type { LinkItem } from "@/registry/types";
import { IconTile } from "@/ui/icon";
import { SearchBox } from "@/site/search";
import { MyTools } from "@/site/my-tools";
import { alternates, JsonLd, ogImage } from "@/site/seo";

const HOME = {
  ru: {
    title: "Онлайн-инструменты | PDF, фото, конвертеры, таймеры и калькуляторы",
    h1: "Онлайн-инструменты на каждый день",
    lead: "PDF, фото, таймеры, конвертеры и калькуляторы прямо в браузере. Файлы остаются на вашем устройстве.",
    description:
      "480+ онлайн-инструментов без регистрации: объединить и сжать PDF, уменьшить фото, таймер, конвертер величин, калькуляторы, эмодзи и символы. Файлы не загружаются.",
    popular: "Популярные инструменты",
    categories: "Все разделы",
    all: "Весь каталог",
    tools: ["инструмент", "инструмента", "инструментов"],
    trust: ["Файлы не загружаются на сервер", "Без регистрации и лимитов", "Удобно на телефоне"],
  },
  en: {
    title: "Online tools | PDF, photos, converters, timers and calculators",
    h1: "Everyday online tools",
    lead: "PDF, photos, timers, converters and calculators right in your browser. Your files stay on your device.",
    description:
      "480+ free online tools with no sign-up: merge and compress PDF, shrink photos, timer, unit converter, calculators, emoji and symbols. Files are never uploaded.",
    popular: "Popular tools",
    categories: "All categories",
    all: "Full catalogue",
    tools: ["tool", "tools"],
    trust: ["Files are never uploaded", "No sign-up, no limits", "Works great on phones"],
  },
} as const;

/** Hand-picked: what people come for most, as app-style icon tiles with a two-word label. */
const TASKS: [string, string, string][] = [
  ["merge-pdf", "Склеить PDF", "Merge PDF"],
  ["compress-pdf", "Сжать PDF", "Compress PDF"],
  ["jpg-to-pdf", "Фото в PDF", "JPG to PDF"],
  ["compress-image", "Сжать фото", "Compress photo"],
  ["resize-image", "Размер фото", "Resize photo"],
  ["crop-image", "Обрезать фото", "Crop photo"],
  ["timer", "Таймер", "Timer"],
  ["stopwatch", "Секундомер", "Stopwatch"],
  ["alarm-clock", "Будильник", "Alarm clock"],
  ["percentage-calculator", "Проценты", "Percentages"],
  ["scientific-calculator", "Калькулятор", "Calculator"],
  ["unit-converter", "Конвертер", "Converter"],
  ["word-counter", "Счётчик слов", "Word counter"],
  ["qr-code-generator", "QR-код", "QR code"],
  ["password-generator", "Пароль", "Password"],
  ["spin-the-wheel", "Колесо", "Spin wheel"],
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: { absolute: HOME[locale].title },
    description: HOME[locale].description,
    alternates: alternates([], locale),
    openGraph: { type: "website", title: HOME[locale].title, description: HOME[locale].description, siteName: BRAND.name, url: SITE_URL + href(locale), images: [ogImage(locale, "home")] },
    twitter: { card: "summary_large_image", title: HOME[locale].title, description: HOME[locale].description, images: [ogImage(locale, "home").url] },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = ui(locale);
  const h = HOME[locale];
  const groups = catalog(locale);
  const tasks = TASKS.map(([slug, ru, en]) => ({ item: linkFor(locale, [slug]), short: locale === "ru" ? ru : en })).filter((x): x is { item: LinkItem; short: string } => !!x.item);
  const catalogue = href(locale, ["all"]);

  return (
    <div className="tone" style={toneVars(225) as React.CSSProperties}>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: BRAND.name, url: SITE_URL + href(locale), inLanguage: locale, description: h.description },
          { "@context": "https://schema.org", "@type": "Organization", name: BRAND.name, url: SITE_URL, email: BRAND.email, logo: `${SITE_URL}/web-app-manifest-512x512.png` },
        ]}
      />
      <section className="stage">
        <div className="container-page pb-6 pt-6 sm:pb-10 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[1.625rem] leading-[1.1] font-bold tracking-tight text-fg min-[400px]:text-[1.875rem] sm:text-[3rem]">{h.h1}</h1>
            <p className="mx-auto mt-2.5 max-w-2xl text-[0.9375rem] leading-snug text-fg-2 sm:mt-4 sm:text-lg">{h.lead}</p>
            <div className="mx-auto mt-6 max-w-2xl sm:mt-7">
              <SearchBox locale={locale} variant="hero" labels={{ search: t.search, placeholder: t.searchPlaceholder, empty: t.searchEmpty, hint: t.searchHint, close: t.close }} />
            </div>
          </div>
          <nav aria-label={h.popular} className="mx-auto mt-7 max-w-5xl sm:mt-10">
            <ul className="grid grid-cols-3 gap-1.5 min-[400px]:grid-cols-4 sm:gap-2 md:grid-cols-8">
              {tasks.map(({ item, short }, i) => (
                // 16 tiles: 4 or 8 per row; on the narrowest phones (3 per row) the last one is dropped to keep rows full.
                <li key={item.path.join("/")} className={cn("min-w-0", i === 15 && "max-[399px]:hidden")}>
                  <a href={href(locale, item.path)} className="app-tile" title={item.label}>
                    <IconTile name={item.icon} hue={item.hue} size="xl" />
                    <span className="app-tile-label">{short}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div className="container-page flex flex-col gap-12 pb-16 pt-9 sm:gap-14 sm:pt-12">
        <MyTools locale={locale} labels={{ favorites: t.favorites, recent: t.recent }} />

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{h.categories}</h2>
            <a href={catalogue} className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-accent hover:underline">
              {h.all}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {groups.map((g) => (
              <li key={g.id} className="min-w-0">
                <a href={`${catalogue}#cat-${g.id}`} className="cat-tile" title={g.blurb}>
                  <IconTile name={g.icon} hue={g.hue} />
                  <span className="min-w-0">
                    <span className="cat-tile-t">{g.label}</span>
                    <span className="block text-[0.8125rem] text-fg-3">
                      {g.count} {plural(locale, g.count, h.tools)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <ul className="grid gap-3 border-t border-line pt-8 text-[0.9375rem] text-fg-2 sm:grid-cols-3">
          {[Lock, UserX, Smartphone].map((Icon, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon className="size-[1.125rem]" aria-hidden />
              </span>
              {h.trust[i]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
