import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import symbolsData from '@/src/data/symbols/symbols.json';
import kaomojiData from '@/src/data/symbols/kaomoji.json';
import type { SymbolItem, KaomojiItem } from '@/src/types/symbols';
import { SymbolExplorer } from '@/src/components/symbols/SymbolExplorer';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

const symbols = symbolsData as SymbolItem[];
const kaomoji = kaomojiData as KaomojiItem[];

const symbolCategoryNames: Record<string, { ru: string; en: string }> = {
  math: { ru: 'Математические знаки', en: 'Math Symbols' },
  arrows: { ru: 'Стрелки', en: 'Arrows' },
  currency: { ru: 'Знаки валют', en: 'Currency Signs' },
  stars: { ru: 'Звезды и значки', en: 'Stars & Icons' },
  kaomoji: { ru: 'Японские каомодзи', en: 'Japanese Kaomoji' },
};

const validCategories = Object.keys(symbolCategoryNames);

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const slug of validCategories) {
      params.push({ locale, slug });
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
  const names = symbolCategoryNames[slug];

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/symbols/${slug}`,
    category: 'symbols',
    entityRu: names ? names.ru : slug,
    entityEn: names ? names.en : slug,
    locale: locale as Locale,
  });
}

export default async function SymbolCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!validCategories.includes(slug)) notFound();

  const isEn = locale === 'en';
  const names = symbolCategoryNames[slug];
  const title = isEn ? (names?.en || slug) : (names?.ru || slug);

  const filteredSymbols = symbols.filter((s) => s.category.toLowerCase().includes(slug));
  const filteredKaomoji = slug === 'kaomoji' ? kaomoji : [];

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Symbols' : 'Символы', url: `${siteConfig.baseUrl}/${locale}/symbols` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/symbols/${slug}` },
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SymbolExplorer
        symbols={filteredSymbols}
        kaomoji={filteredKaomoji}
        categoryName={title}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
    </div>
  );
}
