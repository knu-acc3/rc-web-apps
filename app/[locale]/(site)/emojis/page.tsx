import Link from 'next/link';
import { Metadata } from 'next';
import categoriesData from '@/src/data/emojis/categories.json';
import emojisData from '@/src/data/emojis/emojis.json';
import type { EmojiCategory, EmojiItem } from '@/src/types/emojis';
import { EmojiExplorer } from '@/src/components/emojis/EmojiExplorer';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';

const categories = categoriesData as EmojiCategory[];
const emojis = emojisData as EmojiItem[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/emojis`,
    category: 'emojis',
    entityName: locale === 'en' ? 'Emoji Catalog & Copy' : 'Каталог эмодзи онлайн',
    locale: locale as Locale,
  });
}

export default async function EmojisIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          {isEn ? 'Unicode Emoji Catalog' : 'Полный каталог Unicode Эмодзи'}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? 'Instant search and one-click copy for thousands of emojis, smileys, and symbols.'
            : 'Мгновенный поиск и копирование эмодзи в один клик. Все категории Unicode 15.1.'}
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/${locale}/emojis/${cat.id}`}
            className="px-3 py-1.5 border rounded-xl bg-card hover:bg-secondary text-xs sm:text-sm font-semibold flex items-center gap-1.5"
          >
            <span>{cat.icon}</span>
            <span>{isEn ? cat.nameEn : cat.nameRu}</span>
          </Link>
        ))}
      </div>

      <EmojiExplorer initialEmojis={emojis} />
    </div>
  );
}
