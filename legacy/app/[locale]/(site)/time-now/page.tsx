import Link from 'next/link';
import { Metadata } from 'next';
import locationsData from '@/src/data/time-now/locations.json';
import type { TimeLocation } from '@/src/types/time-now';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';

const locations = locationsData as TimeLocation[];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/time-now`,
    category: 'time-now',
    entityName: locale === 'en' ? 'World Time' : 'Точное мировое время',
    locale: locale as Locale,
  });
}

export default async function TimeNowIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
        {isEn ? 'World Clock & Time Zones' : 'Точное мировое время по городам и странам'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {isEn
          ? 'Live accurate local time, sunrise & sunset phases, and time zone offsets for major world cities.'
          : 'Текущее точное время с секундами, время восхода и захода солнца, часовые пояса и разница во времени.'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {locations.map((loc) => (
          <Link
            key={loc.slug}
            href={`/${locale}/time-now/${loc.slug}`}
            className="p-3 border rounded-xl hover:border-primary transition-colors bg-card hover:bg-secondary/40 flex flex-col justify-between"
          >
            <div className="font-semibold text-sm truncate">
              {isEn ? loc.nameEn : loc.nameRu}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">
              {isEn ? loc.countryEn : loc.countryRu} · {loc.utcOffsetMinutes ? `UTC${loc.utcOffsetMinutes >= 0 ? '+' : ''}${loc.utcOffsetMinutes / 60}` : 'UTC'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
