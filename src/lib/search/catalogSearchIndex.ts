/**
 * Extended catalog search index for deep lazy loading in Ctrl+K search.
 * Indexes all 308 cities from time-now, 103 gadgets from actual-size,
 * diagnostic metrics from what-is-my, and holiday countdowns.
 */

import type { GlobalSearchIndexItem } from '@/src/types/search';
import timeLocations from '@/src/data/time-now/locations.json';
import devicesData from '@/src/data/actual-size/devices.json';
import timerEvents from '@/src/data/timers/events.json';
import { DIAGNOSTIC_METRICS } from '@/src/lib/diagnostics/metrics';

interface LocationItem {
  slug: string;
  nameRu: string;
  nameEn: string;
  countryRu: string;
  countryEn: string;
  timezoneIana: string;
}

interface DeviceItem {
  slug: string;
  brand?: string;
  modelRu?: string;
  modelEn?: string;
  screenDiagonalInches?: number | string;
  widthMm: number | string;
  heightMm: number | string;
  category?: string;
}

interface TimerItem {
  slug: string;
  nameRu: string;
  nameEn: string;
}

export function buildDeepCatalogSearchIndex(): GlobalSearchIndexItem[] {
  const index: GlobalSearchIndexItem[] = [];

  // 1. 308 Cities in time-now
  for (const loc of timeLocations as unknown as LocationItem[]) {
    index.push({
      id: `time-${loc.slug}`,
      slug: loc.slug,
      titleRu: `${loc.nameRu} (${loc.countryRu})`,
      titleEn: `${loc.nameEn} (${loc.countryEn})`,
      descriptionRu: `Точное время в ${loc.nameRu}, часовой пояс ${loc.timezoneIana}`,
      descriptionEn: `Current exact local time in ${loc.nameEn}, ${loc.timezoneIana}`,
      category: 'time-now',
      urlRu: `/ru/time-now/${loc.slug}`,
      urlEn: `/en/time-now/${loc.slug}`,
      keywords: [
        loc.nameRu,
        loc.nameEn,
        loc.countryRu,
        loc.countryEn,
        loc.timezoneIana,
        'время',
        'часы',
        'таймзона',
        'time',
        'clock',
      ],
      iconName: 'Clock',
    });
  }

  // 2. 103 Devices in actual-size
  for (const dev of devicesData as unknown as DeviceItem[]) {
    const brand = dev.brand || 'Device';
    index.push({
      id: `device-${dev.slug}`,
      slug: dev.slug,
      titleRu: `${dev.modelRu || dev.modelEn} — Реальный размер 1:1`,
      titleEn: `${dev.modelEn || dev.modelRu} — Actual Size 1:1`,
      descriptionRu: `${brand}, экран ${dev.screenDiagonalInches || ''}″, габариты ${dev.widthMm}×${dev.heightMm} мм`,
      descriptionEn: `${brand}, display ${dev.screenDiagonalInches || ''}″, dimensions ${dev.widthMm}×${dev.heightMm} mm`,
      category: 'actual-size',
      urlRu: `/ru/actual-size/${dev.slug}`,
      urlEn: `/en/actual-size/${dev.slug}`,
      keywords: [
        dev.modelRu || '',
        dev.modelEn || '',
        brand,
        dev.category || '',
        'размер',
        'экран',
        'гаджет',
        'scale',
        '1:1',
      ],
      iconName: 'Ruler',
    });
  }

  // 3. Diagnostics in what-is-my
  for (const metric of DIAGNOSTIC_METRICS) {
    index.push({
      id: `diag-${metric.slug}`,
      slug: metric.slug,
      titleRu: metric.nameRu,
      titleEn: metric.nameEn,
      descriptionRu: metric.descriptionRu,
      descriptionEn: metric.descriptionEn,
      category: 'diagnostic',
      urlRu: `/ru/what-is-my/${metric.slug}`,
      urlEn: `/en/what-is-my/${metric.slug}`,
      keywords: [
        metric.nameRu,
        metric.nameEn,
        metric.category,
        'диагностика',
        'система',
        'инфо',
        'what is my',
        metric.slug,
      ],
      iconName: 'Monitor',
    });
  }

  // 4. Timer events
  for (const evt of timerEvents as unknown as TimerItem[]) {
    index.push({
      id: `timer-${evt.slug}`,
      slug: evt.slug,
      titleRu: `Обратный отсчёт: ${evt.nameRu}`,
      titleEn: `Countdown: ${evt.nameEn}`,
      descriptionRu: `Таймер обратного отсчета до ${evt.nameRu} с секундами`,
      descriptionEn: `Live countdown timer to ${evt.nameEn} with seconds`,
      category: 'timer',
      urlRu: `/ru/timer/${evt.slug}`,
      urlEn: `/en/timer/${evt.slug}`,
      keywords: [evt.nameRu, evt.nameEn, 'таймер', 'праздник', 'отсчет', 'countdown', 'timer'],
      iconName: 'Timer',
    });
  }

  return index;
}
