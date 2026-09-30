import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import categoriesData from '@/src/data/emojis/categories.json';
import emojisData from '@/src/data/emojis/emojis.json';
import type { EmojiCategory, EmojiItem } from '@/src/types/emojis';
import { EmojiExplorer } from '@/src/components/emojis/EmojiExplorer';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';

const categories = categoriesData as EmojiCategory[];
const emojis = emojisData as EmojiItem[];

export async function generateStaticParams() {
  const params: { locale: string; slug: string[] }[] = [];
  for (const locale of LOCALES) {
    for (const cat of categories) {
      params.push({ locale, slug: [cat.id] });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const categoryId = slug[0];
  const cat = categories.find((c) => c.id === categoryId);
  const nameRu = cat ? `${cat.nameRu} Эмодзи` : categoryId;
  const nameEn = cat ? `${cat.nameEn} Emojis` : categoryId;

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/emojis/${slug.join('/')}`,
    category: 'emojis',
    entityRu: nameRu,
    entityEn: nameEn,
    locale: locale as Locale,
  });
}

export default async function EmojisCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const categoryId = slug[0];
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) notFound();

  const isEn = locale === 'en';
  const categoryEmojis = emojis.filter((e) => e.group === categoryId);
  const title = `${cat.icon} ${isEn ? cat.nameEn : cat.nameRu}`;

  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Emojis' : 'Эмодзи', url: `${siteConfig.baseUrl}/${locale}/emojis` },
    { name: isEn ? cat.nameEn : cat.nameRu, url: `${siteConfig.baseUrl}/${locale}/emojis/${categoryId}` },
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <EmojiExplorer
        initialEmojis={categoryEmojis}
        categoryName={title}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
    </div>
  );
}
