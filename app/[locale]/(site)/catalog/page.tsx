import Link from 'next/link';
import { Metadata } from 'next';
import { AVAILABLE_CATALOG_IDS, getCatalogItems, CATALOG_INFO } from '@/src/lib/catalogs/loadCatalog';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/catalog`,
    category: 'catalogs',
    entityRu: 'Базы знаний и каталоги',
    entityEn: 'Knowledge Base & Catalogs',
    locale: locale as Locale,
  });
}

export default async function CatalogHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {isEn ? 'Structured Catalogs' : 'Каталоги и справочники'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {AVAILABLE_CATALOG_IDS.map((id) => {
          const meta = CATALOG_INFO[id];
          const count = getCatalogItems(id).length;
          return (
            <Link
              key={id}
              href={`/${locale}/catalog/${id}`}
              className="p-4 border rounded-xl bg-card hover:border-primary transition-all flex items-center justify-between group"
            >
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                {isEn ? meta?.titleEn : meta?.titleRu}
              </h3>
              <span className="text-xs px-2.5 py-1 bg-secondary rounded-md font-mono text-muted-foreground shrink-0">
                {count} {isEn ? 'entries' : 'записей'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
