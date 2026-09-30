import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
  AVAILABLE_CATALOG_IDS,
  getCatalogItems,
  getCatalogItem,
  CATALOG_INFO,
} from '@/src/lib/catalogs/loadCatalog';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

export async function generateStaticParams() {
  const params: { locale: string; catalogId: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const catalogId of AVAILABLE_CATALOG_IDS) {
      const items = getCatalogItems(catalogId);
      for (const item of items) {
        params.push({ locale, catalogId, slug: item.slug });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; catalogId: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, catalogId, slug } = await params;
  const item = getCatalogItem(catalogId, slug);
  const titleRu = item ? (item.heading || item.title) : slug;
  const titleEn = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/catalog/${catalogId}/${slug}`,
    category: 'catalogs',
    entityRu: titleRu,
    entityEn: titleEn,
    locale: locale as Locale,
    extraDetails: {
      catalogId,
      description: item?.description || '',
      title: item?.title || titleRu,
    },
  });
}

export default async function CatalogItemPage({
  params,
}: {
  params: Promise<{ locale: string; catalogId: string; slug: string }>;
}) {
  const { locale, catalogId, slug } = await params;
  const item = getCatalogItem(catalogId, slug);
  if (!item) notFound();

  const isEn = locale === 'en';
  const info = CATALOG_INFO[catalogId];
  const catalogTitle = isEn ? (info?.titleEn || `Catalog ${catalogId}`) : (info?.titleRu || `Каталог ${catalogId}`);
  const itemTitle = isEn
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : (item.heading || item.title);

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Catalogs' : 'Каталоги', url: `${siteConfig.baseUrl}/${locale}/catalog` },
    { name: catalogTitle, url: `${siteConfig.baseUrl}/${locale}/catalog/${catalogId}` },
    { name: itemTitle, url: `${siteConfig.baseUrl}/${locale}/catalog/${catalogId}/${slug}` },
  ]);

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="p-6 sm:p-8 border rounded-3xl bg-card shadow-sm flex flex-col gap-6">
        <div>
          <span className="text-xs uppercase font-mono px-3 py-1 bg-secondary rounded-lg text-muted-foreground">
            {isEn ? `Catalog ${catalogId}` : `Каталог ${catalogId}`}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mt-3 text-foreground">
            {itemTitle}
          </h1>
        </div>

        <div className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {item.description}
        </div>

        {item.category && (
          <div className="text-xs text-muted-foreground">
            {isEn ? 'Category: ' : 'Категория: '}
            <span className="font-semibold text-foreground capitalize">{item.category}</span>
          </div>
        )}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
    </article>
  );
}
