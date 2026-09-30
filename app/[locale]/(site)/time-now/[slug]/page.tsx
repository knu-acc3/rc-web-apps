import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import locationsData from '@/src/data/time-now/locations.json';
import type { TimeLocation } from '@/src/types/time-now';
import { TimeEngine } from '@/src/components/time-now/TimeEngine';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema, buildPlaceTimeSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

const locations = locationsData as TimeLocation[];

function findLocation(slug: string): TimeLocation | undefined {
  const exact = locations.find((l) => l.slug === slug);
  if (exact) return exact;
  const bySuffix = locations.find((l) => l.slug.replace(/^[a-z]{2}-/, '') === slug);
  if (bySuffix) return bySuffix;
  const lower = slug.toLowerCase();
  return locations.find(
    (l) => l.nameEn.toLowerCase() === lower || l.nameRu.toLowerCase() === lower
  );
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  const seen = new Set<string>();

  for (const locale of LOCALES) {
    for (const loc of locations) {
      if (!seen.has(`${locale}:${loc.slug}`)) {
        seen.add(`${locale}:${loc.slug}`);
        params.push({ locale, slug: loc.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = findLocation(slug);
  if (!loc) return {};

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/time-now/${loc.slug}`,
    category: 'time-now',
    entityRu: `${loc.nameRu} (${loc.countryRu})`,
    entityEn: `${loc.nameEn} (${loc.countryEn})`,
    locale: locale as Locale,
  });
}

export default async function TimeLocationPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = findLocation(slug);
  if (!loc) notFound();

  if (slug !== loc.slug) {
    redirect(`/${locale}/time-now/${loc.slug}`);
  }

  const isEn = locale === 'en';
  const name = isEn ? loc.nameEn : loc.nameRu;
  const country = isEn ? loc.countryEn : loc.countryRu;
  const title = `${name} (${country})`;

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'World Time' : 'Мировое время', url: `${siteConfig.baseUrl}/${locale}/time-now` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/time-now/${loc.slug}` },
  ]);

  const placeSchema = buildPlaceTimeSchema({
    cityName: name,
    countryName: country,
    url: `${siteConfig.baseUrl}/${locale}/time-now/${loc.slug}`,
    latitude: loc.latitude || 0,
    longitude: loc.longitude || 0,
    timezoneIana: loc.timezoneIana || 'UTC',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <TimeEngine location={loc} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeSchema) }}
      />
    </div>
  );
}
