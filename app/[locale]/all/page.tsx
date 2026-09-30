import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND, SITE_URL } from "@/config/brand";
import { href, isLocale, LOCALES, type Locale } from "@/i18n/config";
import { plural } from "@/i18n/format";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import { toneVars } from "@/lib/tone";
import { catalog } from "@/registry";
import { IconTile } from "@/ui/icon";
import { Breadcrumbs } from "@/site/breadcrumbs";
import { CatalogFilter } from "@/site/catalog-filter";
import { alternates, JsonLd, ogImage } from "@/site/seo";

const T = {
  ru: {
    title: "Все онлайн-инструменты | каталог по разделам",
    h1: "Все инструменты",
    description: "Каталог всех инструментов сайта по разделам: PDF и фото, текст, символы, время, калькуляторы, конвертеры, генераторы, инструменты для разработчиков и проверки устройства.",
    filter: "Найти в каталоге",
    placeholder: "Например: pdf, таймер, проценты",
    empty: "Ничего не нашлось. Попробуйте другое слово.",
    tools: ["инструмент", "инструмента", "инструментов"],
  },
  en: {
    title: "All online tools | catalogue by category",
    h1: "All tools",
    description: "Every tool on the site by category: PDF and photos, text, symbols, time, calculators, converters, generators, developer tools and device tests.",
    filter: "Find in the catalogue",
    placeholder: "For example: pdf, timer, percent",
    empty: "Nothing found. Try another word.",
    tools: ["tool", "tools"],
  },
} as const;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = T[locale];
  return {
    title: { absolute: t.title },
    description: t.description,
    alternates: alternates(["all"], locale),
    openGraph: { type: "website", title: t.title, description: t.description, siteName: BRAND.name, url: SITE_URL + href(locale, ["all"]), images: [ogImage(locale, "home")] },
  };
}

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е");

export default async function AllTools({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const t = T[locale];
  const u = ui(locale);
  const groups = catalog(locale);
  const total = groups.reduce((n, g) => n + g.count, 0);

  return (
    <div className="tone" style={toneVars(225) as React.CSSProperties}>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: t.h1, description: t.description, url: SITE_URL + href(locale, ["all"]), inLanguage: locale }} />
      <section className="stage">
        <div className="container-page pb-8 pt-3 sm:pb-10 sm:pt-4">
          <Breadcrumbs items={[{ name: u.home, path: [] }]} current={t.h1} locale={locale} />
          <h1 className="text-[1.75rem] font-bold tracking-tight text-fg sm:text-[2.5rem]">{t.h1}</h1>
          <p className="mt-2 text-base text-fg-2 sm:text-lg">
            {total} {plural(locale, total, t.tools)}
          </p>
          <nav aria-label={u.categories} className="mt-5 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a key={g.id} href={`#cat-${g.id}`} className="chip pl-1.5">
                <IconTile name={g.icon} hue={g.hue} size="xs" />
                {g.label}
              </a>
            ))}
          </nav>
          <div className="mt-6 max-w-xl">
            <CatalogFilter label={t.filter} placeholder={t.placeholder} empty={t.empty} />
          </div>
        </div>
      </section>

      <div className="container-page flex flex-col gap-12 pb-16 pt-10">
        {groups.map((g) => (
          <section key={g.id} id={`cat-${g.id}`} aria-labelledby={`cat-${g.id}-h`} className="scroll-mt-20" data-cat-group>
            <h2 id={`cat-${g.id}-h`} className="mb-5 flex items-center gap-3 text-xl font-semibold tracking-tight text-fg sm:text-2xl">
              <IconTile name={g.icon} hue={g.hue} size="sm" />
              {g.label}
              <span className="text-base font-normal text-fg-3">{g.count}</span>
            </h2>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
              {g.sections.map((s) => {
                const single = s.tools.length === 1;
                return (
                  <div key={s.id} className="min-w-0" data-cat-group>
                    {!single && (
                      <h3 className="mb-2 flex items-center gap-2 text-[0.9375rem] font-semibold text-fg">
                        <IconTile name={s.icon} hue={s.hue} size="sm" />
                        {s.hub ? (
                          <a href={href(locale, s.hub)} className="hover:text-accent">
                            {s.name}
                          </a>
                        ) : (
                          s.name
                        )}
                      </h3>
                    )}
                    {single && <IconTile name={s.icon} hue={s.hue} size="sm" className="mb-2" />}
                    <ul className={cn("flex flex-col gap-0.5", !single && "border-l border-line pl-4 ml-4")}>
                      {s.tools.map((tool) => (
                        <li key={tool.path.join("/")} data-cat-item={norm(`${tool.label} ${tool.hint ?? ""} ${s.name}`)}>
                          <a href={href(locale, tool.path)} className="block rounded-[0.5rem] py-1 text-[0.9375rem] text-fg hover:text-accent">
                            {tool.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
