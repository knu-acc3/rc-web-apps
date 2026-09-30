import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  AVAILABLE_CATALOG_IDS,
  getCatalogItems,
  CATALOG_INFO,
} from '@/src/lib/catalogs/loadCatalog';
import { CatalogCardGrid } from '@/src/components/catalogs/CatalogCardGrid';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

export async function generateStaticParams() {
  const params: { locale: string; catalogId: string }[] = [];
  for (const locale of LOCALES) {
    for (const id of AVAILABLE_CATALOG_IDS) {
      params.push({ locale, catalogId: id });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; catalogId: string }>;
}): Promise<Metadata> {
  const { locale, catalogId } = await params;
  const info = CATALOG_INFO[catalogId];

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/catalog/${catalogId}`,
    category: 'catalogs',
    entityRu: info ? info.titleRu : `Каталог ${catalogId}`,
    entityEn: info ? info.titleEn : `Catalog ${catalogId}`,
    locale: locale as Locale,
  });
}

export default async function CatalogSubHubPage({
  params,
}: {
  params: Promise<{ locale: string; catalogId: string }>;
}) {
  const { locale, catalogId } = await params;
  if (!AVAILABLE_CATALOG_IDS.includes(catalogId as (typeof AVAILABLE_CATALOG_IDS)[number])) notFound();

  const isEn = locale === 'en';
  const info = CATALOG_INFO[catalogId];
  const items = getCatalogItems(catalogId);
  const title = isEn ? (info?.titleEn || `Catalog ${catalogId}`) : (info?.titleRu || `Каталог ${catalogId}`);

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Catalogs' : 'Каталоги', url: `${siteConfig.baseUrl}/${locale}/catalog` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/catalog/${catalogId}` },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        {title} ({items.length} {isEn ? 'entries' : 'записей'})
      </h1>
      <CatalogCardGrid
        catalogId={catalogId}
        locale={locale}
        items={items}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
    </div>
  );
}
