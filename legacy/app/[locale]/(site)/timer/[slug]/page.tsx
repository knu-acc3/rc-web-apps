import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import presetsData from '@/src/data/timers/presets.json';
import eventsData from '@/src/data/timers/events.json';
import { UniversalTimerEngine } from '@/src/components/timers/UniversalTimerEngine';
import { EventCountdownEngine } from '@/src/components/timers/EventCountdownEngine';
import { calculateNextTargetDate } from '@/src/lib/timers/countdownEngine';
import { generateUniqueMetadata } from '@/src/lib/seo/uniqueMetaEngine';
import { buildBreadcrumbSchema, buildWebApplicationSchema } from '@/src/lib/seo/schemaGenerator';
import { siteConfig } from '@/src/config/site.config';
import { LOCALES, type Locale } from '@/src/i18n/index';
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

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of LOCALES) {
    for (const evt of rawEvents) {
      params.push({ locale, slug: evt.slug });
    }
    for (const p of normalizedPresets) {
      params.push({ locale, slug: p.slug });
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

  let titleRu = slug;
  let titleEn = slug;
  let descRu = '';
  let descEn = '';

  const evt = rawEvents.find((e) => e.slug === slug);
  if (evt) {
    titleRu = evt.nameRu;
    titleEn = evt.nameEn;
    descRu = evt.descriptionRu || '';
    descEn = evt.descriptionEn || '';
  } else {
    const preset = normalizedPresets.find((p) => p.slug === slug);
    if (preset) {
      titleRu = preset.labelRu;
      titleEn = preset.labelEn;
      const mins = Math.round(preset.durationSeconds / 60);
      descRu = `${preset.labelRu}: точный таймер на ${mins} мин с громким звуковым сигналом.`;
      descEn = `${preset.labelEn}: accurate countdown timer for ${mins} minutes with audio alert.`;
    }
  }

  return generateUniqueMetadata({
    canonicalPath: `/${locale}/timer/${slug}`,
    category: 'timers',
    entityRu: titleRu,
    entityEn: titleEn,
    locale: locale as Locale,
    extraDetails: {
      descRu,
      descEn,
    },
  });
}

export default async function TimerSlugPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isEn = locale === 'en';

  const evt = rawEvents.find((e) => e.slug === slug);
  const preset = normalizedPresets.find((p) => p.slug === slug);

  const title = evt ? (isEn ? evt.nameEn : evt.nameRu) : (preset ? (isEn ? preset.labelEn : preset.labelRu) : slug);
  const breadcrumbsSchema = buildBreadcrumbSchema([
    { name: isEn ? 'Home' : 'Главная', url: `${siteConfig.baseUrl}/${locale}` },
    { name: isEn ? 'Timers' : 'Таймеры', url: `${siteConfig.baseUrl}/${locale}/timer` },
    { name: title, url: `${siteConfig.baseUrl}/${locale}/timer/${slug}` },
  ]);

  const webAppSchema = buildWebApplicationSchema({
    name: title,
    description: isEn
      ? `Online timer and countdown clock for ${title}.`
      : `Онлайн таймер и обратный отсчет для: ${title}.`,
    url: `${siteConfig.baseUrl}/${locale}/timer/${slug}`,
    category: 'TimerApplication',
  });

  const schemaScripts = (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
    </>
  );

  if (evt) {
    const isPomodoro = evt.calculationType === 'pomodoro';
    const isStopwatch = evt.calculationType === 'stopwatch';
    const isAlarm = evt.calculationType === 'alarm';
    const isCountdown = evt.calculationType === 'countdown';

    if (isPomodoro || isStopwatch || isAlarm || isCountdown) {
      return (
        <div className="container mx-auto px-4 py-8">
          <UniversalTimerEngine
            defaultSeconds={isPomodoro ? 1500 : isAlarm ? 300 : isCountdown ? 600 : 0}
            mode={isStopwatch ? 'stopwatch' : 'timer'}
            title={isEn ? evt.nameEn : evt.nameRu}
            locale={locale}
          />
          {schemaScripts}
        </div>
      );
    }

    // Calendar & event countdowns (summer, spring, autumn, winter, new-year, christmas, olympics, etc.)
    const now = new Date();
    const targetDate = calculateNextTargetDate(
      {
        fixedMonth: evt.fixedMonth,
        fixedDay: evt.fixedDay,
        targetYear: evt.targetYear,
      },
      now
    );

    return (
      <div className="container mx-auto px-4 py-8">
        <EventCountdownEngine
          event={evt}
          locale={locale}
          initialTargetIso={targetDate.toISOString()}
          initialNowIso={now.toISOString()}
          allEvents={rawEvents.filter(
            (e) => e.calculationType === 'fixed' || e.calculationType === 'custom-date'
          )}
        />
        {schemaScripts}
      </div>
    );
  }

  if (preset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <UniversalTimerEngine
          defaultSeconds={preset.durationSeconds}
          title={isEn ? preset.labelEn : preset.labelRu}
          locale={locale}
        />
        {schemaScripts}
      </div>
    );
  }

  notFound();
}
