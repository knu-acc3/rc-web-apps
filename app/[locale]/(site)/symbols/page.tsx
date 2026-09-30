import Link from 'next/link';
import { Metadata } from 'next';
import symbolsData from '@/src/data/symbols/symbols.json';
import kaomojiData from '@/src/data/symbols/kaomoji.json';
import type { SymbolItem, KaomojiItem } from '@/src/types/symbols';
import { SymbolExplorer } from '@/src/components/symbols/SymbolExplorer';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';

const symbols = symbolsData as SymbolItem[];
const kaomoji = kaomojiData as KaomojiItem[];

const symbolCategories = [
  { id: 'math', nameRu: 'Математические знаки', nameEn: 'Math Symbols' },
  { id: 'arrows', nameRu: 'Стрелки', nameEn: 'Arrows' },
  { id: 'currency', nameRu: 'Знаки валют', nameEn: 'Currency Signs' },
  { id: 'stars', nameRu: 'Звезды и значки', nameEn: 'Stars & Icons' },
  { id: 'kaomoji', nameRu: 'Японские каомодзи', nameEn: 'Japanese Kaomoji' },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/symbols`,
    category: 'symbols',
    entityName: locale === 'en' ? 'Unicode Symbols & Kaomoji' : 'Таблица спецсимволов и каомодзи',
    locale: locale as Locale,
  });
}

export default async function SymbolsIndexPage({
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
          {isEn ? 'Unicode Symbols & Kaomoji' : 'Спецсимволы Unicode и японские каомодзи'}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? 'Copy text symbols, math characters, arrows, currency signs, and kaomoji faces in one click.'
            : 'Мгновенное копирование редких символов, знаков валют, стрелок и текстовых смайликов-каомодзи.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {symbolCategories.map((c) => (
          <Link
            key={c.id}
            href={`/${locale}/symbols/${c.id}`}
            className="px-3 py-1.5 border rounded-xl bg-card hover:bg-secondary text-xs sm:text-sm font-semibold"
          >
            {isEn ? c.nameEn : c.nameRu}
          </Link>
        ))}
      </div>

      <SymbolExplorer symbols={symbols} kaomoji={kaomoji} />
    </div>
  );
}
