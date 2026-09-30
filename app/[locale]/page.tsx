import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL } from "@/config/brand";
import { href, isLocale, tr, type Locale } from "@/i18n/config";
import { count } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import { allPaths, sectionsByCategory } from "@/registry";
import type { LinkItem } from "@/registry/types";
import { IconTile } from "@/ui/icon";
import { LinkCards } from "@/site/links";
import { SearchButton } from "@/site/search";
import { RecentList } from "@/site/recent-list";
import { alternates, JsonLd } from "@/site/seo";

const HOME = {
  ru: {
    title: `${BRAND.name} — бесплатные онлайн-инструменты в браузере`,
    h1: "Онлайн-инструменты, которые работают прямо в браузере",
    description:
      "Бесплатные онлайн-инструменты без регистрации: PDF и изображения, конвертеры, калькуляторы, таймеры, мировое время, символы и эмодзи. Файлы не покидают ваше устройство.",
  },
  en: {
    title: `${BRAND.name} — free online tools that run in your browser`,
    h1: "Online tools that work right in your browser",
    description:
      "Free online tools with no sign-up: PDF and images, converters, calculators, timers, world time, symbols and emoji. Your files never leave your device.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: { absolute: HOME[locale].title },
    description: HOME[locale].description,
    alternates: alternates([], locale),
    openGraph: { type: "website", title: HOME[locale].title, description: HOME[locale].description, siteName: BRAND.name, url: SITE_URL + href(locale) },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = ui(locale);
  const groups = sectionsByCategory(locale);
  const popular: LinkItem[] = groups.flatMap((g) => g.sections.flatMap((s) => s.featured(locale).slice(0, 2))).slice(0, 12);
  const toolCount = allPaths().length;

  return (
    <div className="container-page pb-16">
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebSite", name: BRAND.name, url: SITE_URL + href(locale), inLanguage: locale, description: HOME[locale].description },
          { "@context": "https://schema.org", "@type": "Organization", name: BRAND.name, url: SITE_URL, email: BRAND.email, logo: `${SITE_URL}/web-app-manifest-512x512.png` },
        ]}
      />
      <section className="mx-auto max-w-3xl py-10 text-center sm:py-14">
        <h1 className="text-[30px] leading-tight font-bold tracking-tight text-fg sm:text-[44px]">{HOME[locale].h1}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-fg-2 sm:text-lg">{t.privacyNote}</p>
        <div className="mx-auto mt-7 max-w-xl">
          <SearchButton
            locale={locale}
            variant="hero"
            labels={{ search: t.search, placeholder: t.searchPlaceholder, empty: t.searchEmpty, hint: t.searchHint, close: t.close }}
          />
        </div>
        <p className="mt-4 text-sm text-fg-3">
          {count(locale, toolCount, t.pages)} · {t.free} · {t.noSignup}
        </p>
      </section>

      <RecentList locale={locale} title={t.recent} />

      {popular.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-fg">{t.popular}</h2>
          <LinkCards items={popular} locale={locale} />
        </section>
      )}

      <div className="flex flex-col gap-12">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`cat-${g.id}`}>
            <h2 id={`cat-${g.id}`} className="mb-4 text-xl font-semibold text-fg">
              {g.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.sections.map((s) => (
                <div key={s.id} className="flex flex-col rounded-[12px] border border-line bg-surface p-4">
                  <Link href={href(locale, [s.id])} className="group flex items-center gap-3">
                    <IconTile name={s.icon} hue={s.hue} />
                    <span className="min-w-0">
                      <span className="block font-semibold text-fg group-hover:text-accent">{tr(s.name, locale)}</span>
                      <span className="line-clamp-1 block text-sm text-fg-3">{tr(s.description, locale)}</span>
                    </span>
                  </Link>
                  <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line pt-3">
                    {s.featured(locale).slice(0, 6).map((f) => (
                      <li key={f.path.join("/")}>
                        <Link href={href(locale, f.path)} className="text-sm text-fg-2 hover:text-accent">
                          {f.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
