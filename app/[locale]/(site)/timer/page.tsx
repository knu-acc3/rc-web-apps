import Link from 'next/link';
import { Metadata } from 'next';
import presetsData from '@/src/data/timers/presets.json';
import eventsData from '@/src/data/timers/events.json';
import { UniversalTimerEngine } from '@/src/components/timers/UniversalTimerEngine';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { type Locale } from '@/src/i18n/index';
import type { EventItem, PresetItem } from '@/src/types/timers';

const rawEvents = eventsData as EventItem[];
const rawPresets = presetsData as PresetItem[];

const normalizedPresets = rawPresets.map((p) => {
  const duration = (p.minutes || p.workMinutes || 5) * 60;
  const slug = p.id.replace('preset-', '');
  return {
    ...p,
    slug,
    durationSeconds: duration,
    labelRu: p.name,
    labelEn: p.name,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateUniqueMetadata({
    canonicalPath: `/${locale}/timer`,
    category: 'timers',
    entityName: locale === 'en' ? 'Online Timer & Stopwatch' : 'Онлайн таймер и секундомер',
    locale: locale as Locale,
  });
}

export default async function TimerIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === 'en';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col gap-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
          {isEn ? 'Universal Online Timer & Stopwatch' : 'Универсальный онлайн таймер и секундомер'}
        </h1>
        <p className="text-muted-foreground">
          {isEn
            ? 'Accurate countdown timer with sound notifications, stopwatch with lap recording, and holiday countdowns.'
            : 'Точный таймер обратного отсчета со звуковым сигналом, секундомер с записью кругов и отсчет до праздников.'}
        </p>
      </div>

      <UniversalTimerEngine defaultSeconds={1500} locale={locale} />

      {/* Events / Holiday Countdowns */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {isEn ? 'Holiday & Event Countdowns' : 'Обратный отсчет до праздников и событий'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {rawEvents.map((evt) => (
            <Link
              key={evt.slug}
              href={`/${locale}/timer/${evt.slug}`}
              className="p-3 border rounded-xl hover:border-primary transition-colors bg-card flex flex-col justify-between"
            >
              <div className="font-semibold text-sm truncate">
                {isEn ? evt.nameEn : evt.nameRu}
              </div>
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {evt.category}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Timer Presets */}
      <div>
        <h2 className="text-xl font-bold mb-4">
          {isEn ? 'Popular Timers' : 'Популярные таймеры'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {normalizedPresets.slice(0, 24).map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/timer/${p.slug}`}
              className="p-3 border rounded-xl hover:border-primary transition-colors bg-card flex flex-col justify-between"
            >
              <div className="font-semibold text-sm truncate">
                {isEn ? p.labelEn : p.labelRu}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(p.durationSeconds / 60)} {isEn ? 'min' : 'мин'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
