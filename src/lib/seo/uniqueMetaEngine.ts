import type { Metadata } from 'next';
import { siteConfig } from '@/src/config/site.config';
import locationsData from '@/src/data/time-now/locations.json';
import devicesData from '@/src/data/actual-size/devices.json';
import { DIAGNOSTIC_METRICS, type DiagnosticMetric } from '@/src/lib/diagnostics/metrics';

export type MetaCategoryType = 
  | 'tool' 
  | 'time-now' 
  | 'actual-size' 
  | 'emoji' 
  | 'emojis'
  | 'symbol' 
  | 'symbols'
  | 'timer' 
  | 'timers' 
  | 'diagnostic' 
  | 'what-is-my'
  | 'catalog'
  | 'catalogs'
  | 'interactive';

export interface MetaEngineInput {
  readonly path: string;
  readonly category: MetaCategoryType;
  readonly entityRu: string;
  readonly entityEn: string;
  readonly locale: 'ru' | 'en';
  readonly extraDetails?: Record<string, string | number>;
}

export interface UniqueMetadataOutput {
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly canonical: string;
  readonly keywords: readonly string[];
}

export function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeCategory(cat: string): string {
  if (cat === 'timers') return 'timer';
  if (cat === 'emojis') return 'emoji';
  if (cat === 'symbols') return 'symbol';
  if (cat === 'catalogs') return 'catalog';
  if (cat === 'what-is-my') return 'diagnostic';
  return cat;
}

// ── Timezone Data Helpers ──
interface TimeLocationItem {
  slug: string;
  nameRu: string;
  nameEn: string;
  countryRu: string;
  countryEn: string;
  timezoneIana: string;
  continent?: string;
  hasDst?: boolean;
}

const locations = locationsData as TimeLocationItem[];
const locationBySlug = new Map<string, TimeLocationItem>();
const locationByName = new Map<string, TimeLocationItem>();

for (const loc of locations) {
  locationBySlug.set(loc.slug, loc);
  locationBySlug.set(loc.slug.replace(/^[a-z]{2}-/, ''), loc);
  locationByName.set(loc.nameRu.toLowerCase(), loc);
  locationByName.set(loc.nameEn.toLowerCase(), loc);
}

function findLocationData(slug: string, entityRu: string, entityEn: string): TimeLocationItem | undefined {
  const bySlug = locationBySlug.get(slug);
  if (bySlug) return bySlug;
  const cleanRu = entityRu.replace(/\s*\([^)]*\)$/, '').trim().toLowerCase();
  const cleanEn = entityEn.replace(/\s*\([^)]*\)$/, '').trim().toLowerCase();
  return locationByName.get(cleanRu) || locationByName.get(cleanEn);
}

// ── Device Specs Helpers ──
interface DeviceItem {
  slug: string;
  modelRu: string;
  modelEn: string;
  brand: string;
  releaseYear: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
}

const devices = devicesData as DeviceItem[];
const deviceBySlug = new Map<string, DeviceItem>();
for (const dev of devices) {
  deviceBySlug.set(dev.slug, dev);
}

// ── Diagnostics Helpers ──
const diagnosticBySlug = new Map<string, DiagnosticMetric>();
for (const m of DIAGNOSTIC_METRICS) {
  diagnosticBySlug.set(m.slug, m);
}

export function generateUniqueMeta(input: MetaEngineInput): UniqueMetadataOutput {
  const hash = fnv1a(input.path);
  const brand = siteConfig.brandName;
  const isRu = input.locale === 'ru';
  const entity = isRu ? input.entityRu : input.entityEn;
  const normCat = normalizeCategory(input.category);
  const path = input.path.toLowerCase();
  const slug = path.split('/').filter(Boolean).pop() || '';

  let title = '';
  let description = '';
  const h1 = entity;

  // 1. Bespoke overrides for dedicated interactive tools (strict prefix matching)
  if (path.includes('/tools/fortune-wheel')) {
    title = isRu
      ? `Колесо фортуны онлайн — генератор случайного выбора | ${brand}`
      : `Wheel of Fortune Online — Random Decision Maker Wheel | ${brand}`;
    description = isRu
      ? 'Интерактивное колесо фортуны онлайн: настраивайте список вариантов, крутите рулетку со звуком и делайте случайный выбор честно и бесплатно.'
      : 'Interactive wheel of fortune and random decision picker. Add custom options, spin the wheel with sound effects, and pick winners fairly online.';
  } else if (path.includes('/tools/id-photo')) {
    title = isRu
      ? `Фото на документы онлайн — подготовка 3x4, паспорт и виза | ${brand}`
      : `Passport & ID Photo Maker Online — Crop 2x2, Visa & ID Free | ${brand}`;
    description = isRu
      ? 'Подготовка фото на документы онлайн: форматы 3x4, 35x45 мм, визы и паспорта с разрешением 300 DPI. Точная разметка и печать без загрузки на сервер.'
      : 'Prepare passport, visa, and ID photos online with 300 DPI resolution. Standard 2x2 inch and 35x45 mm templates with zero server file uploads.';
  } else if (path.includes('/tools/kana-flashcards')) {
    title = isRu
      ? `Японские карточки Хирагана и Катакана онлайн — тренажёр | ${brand}`
      : `Japanese Kana Flashcards Online — Master Hiragana & Katakana | ${brand}`;
    description = isRu
      ? 'Интерактивный тренажёр японской азбуки: карточки Хирагана и Катакана с ромадзи, проверкой ответов и отслеживанием прогресса прямо в браузере.'
      : 'Interactive Japanese kana flashcards. Practice Hiragana and Katakana with romaji hints, answer verification, and progress tracking in browser.';
  } else if (normCat === 'time-now') {
    // 2. High-precision dynamic metadata for time-now
    const loc = findLocationData(slug, input.entityRu, input.entityEn);
    const cityRu = loc ? loc.nameRu : input.entityRu.replace(/\s*\([^)]*\)$/, '').trim();
    const cityEn = loc ? loc.nameEn : input.entityEn.replace(/\s*\([^)]*\)$/, '').trim();
    const countryRu = loc ? loc.countryRu : 'Мир';
    const countryEn = loc ? loc.countryEn : 'World';
    const tz = loc ? loc.timezoneIana : 'UTC';

    if (isRu) {
      const ruTitleTemplates = [
        `Точное время: ${cityRu} (${countryRu}) — пояс ${tz}`,
        `Время в ${cityRu} сейчас: пояс ${tz} и секунды онлайн`,
        `Сколько времени в ${cityRu} (${countryRu}) — часы онлайн`,
        `${cityRu} (${countryRu}) — официальное точное время`,
        `Местное время: ${cityRu} — секунды и часовой пояс ${tz}`,
        `Часы ${cityRu} (${countryRu}): время и смещение UTC онлайн`,
      ];
      title = `${ruTitleTemplates[hash % ruTitleTemplates.length]} | ${brand}`;
      if (title.length > 70) {
        const compacts = [
          `Время в ${cityRu} сейчас — пояс ${tz} | ${brand}`,
          `${cityRu} (${countryRu}) — точное время онлайн | ${brand}`,
          `Точное время в ${cityRu}: пояс ${tz} | ${brand}`,
          `${cityRu} — текущее местное время с секундами | ${brand}`,
        ];
        title = compacts[(hash >>> 3) % compacts.length];
        if (title.length > 70) {
          title = `${cityRu} (${countryRu}) — точные часы | ${brand}`;
          if (title.length > 70) title = `${cityRu} — точное время | ${brand}`;
        }
      }

      const ruOpeners = [
        `Точное время в городе ${cityRu} (${countryRu}) онлайн.`,
        `Официальное время в ${cityRu} (${countryRu}) с секундами.`,
        `Онлайн-часы для ${cityRu} (${countryRu}) в реальном времени.`,
        `Текущее поясное время в городе ${cityRu} (${countryRu}).`,
      ];
      const ruMiddles = [
        `Часовой пояс: ${tz}.`,
        `Пояс региона: ${tz}.`,
        `Атомная синхронизация секунд для зоны ${tz}.`,
        `Точный хронометраж для пояса ${tz}.`,
      ];
      const ruClosers = [
        `Быстрый расчет разницы во времени, восход и закат солнца онлайн.`,
        `Сверка системных часов на компьютере и телефоне прямо в браузере.`,
        `Цифровой циферблат с датой, днем недели и индикатором смещения UTC.`,
        `Удобный инструмент для планирования звонков и международных поездок.`,
      ];

      description = `${ruOpeners[hash % ruOpeners.length]} ${ruMiddles[(hash >>> 2) % ruMiddles.length]} ${ruClosers[(hash >>> 4) % ruClosers.length]}`;
      if (description.length > 165) {
        const shortClosers = [
          `Расчет разницы во времени, восход и закат солнца.`,
          `Сверка системных часов прямо в браузере без задержек.`,
          `Индикатор смещения UTC, дата и точные секунды онлайн.`,
          `Планирование звонков и международных поездок онлайн.`,
        ];
        description = `${ruOpeners[hash % ruOpeners.length]} Часовой пояс ${tz}. ${shortClosers[(hash >>> 4) % shortClosers.length]}`;
      }
      if (description.length < 115) {
        description += ' Доступно бесплатно 24/7.';
      }
    } else {
      const enTitleTemplates = [
        `Current Time in ${cityEn}, ${countryEn} — Live Clock & ${tz}`,
        `Exact Time in ${cityEn} Now — Timezone ${tz} & Seconds`,
        `What Time is It in ${cityEn}, ${countryEn}? Live Clock`,
        `${cityEn} Local Time — Live Digital Clock in ${countryEn}`,
        `Live Time in ${cityEn} (${countryEn}) — Official ${tz} Clock`,
        `Official Time in ${cityEn} (${tz}): Live Seconds & Date`,
      ];
      title = `${enTitleTemplates[hash % enTitleTemplates.length]} | ${brand}`;
      if (title.length > 70) {
        const compacts = [
          `Live Time in ${cityEn}, ${countryEn} — World Clock | ${brand}`,
          `${cityEn} Local Time — Exact Seconds & ${tz} | ${brand}`,
          `Exact Time in ${cityEn} Now — Live Digital Clock | ${brand}`,
          `Current Time: ${cityEn} (${countryEn}) | ${brand}`,
        ];
        title = compacts[(hash >>> 3) % compacts.length];
        if (title.length > 70) {
          title = `${cityEn} (${countryEn}) — Live Clock | ${brand}`;
          if (title.length > 70) title = `${cityEn} — Current Time | ${brand}`;
        }
      }

      const enOpeners = [
        `Current exact local time in ${cityEn}, ${countryEn} online.`,
        `Accurate official time for ${cityEn}, ${countryEn} right now.`,
        `Real-time digital clock with seconds for ${cityEn}, ${countryEn}.`,
        `Track exact local time in ${cityEn} (${countryEn}) online.`,
      ];
      const enMiddles = [
        `Official timezone: ${tz}.`,
        `IANA timezone identifier is ${tz}.`,
        `Synchronized with atomic time servers for ${tz}.`,
        `Standard time reference for the ${tz} zone.`,
      ];
      const enClosers = [
        `View sunrise, sunset, UTC offset, and time difference for travel.`,
        `Compare time differences and check system clock accuracy easily.`,
        `Displays calendar date, daylight saving status, and live seconds.`,
        `Reliable world clock for scheduling calls and international meetings.`,
      ];

      description = `${enOpeners[hash % enOpeners.length]} ${enMiddles[(hash >>> 2) % enMiddles.length]} ${enClosers[(hash >>> 4) % enClosers.length]}`;
      if (description.length > 165) {
        const shortEnClosers = [
          `Check sunrise, sunset, and time difference for travel.`,
          `Compare time differences and verify device clock accuracy.`,
          `Includes calendar date, timezone offset, and live seconds.`,
          `Accurate world clock for scheduling international calls.`,
        ];
        description = `${enOpeners[hash % enOpeners.length]} Timezone ${tz}. ${shortEnClosers[(hash >>> 4) % shortEnClosers.length]}`;
      }
      if (description.length < 115) {
        description += ' Free world clock tool.';
      }
    }
  } else if (normCat === 'actual-size') {
    // 3. Exact physical dimension metadata for actual-size
    if (slug === 'ruler') {
      title = isRu
        ? `Экранная линейка 1:1 онлайн — точный замер в мм и см | ${brand}`
        : `Screen Ruler 1:1 Online — Measure in MM & CM on Display | ${brand}`;
      description = isRu
        ? 'Интерактивная линейка 1:1 на экране монитора и смартфона. Точная калибровка по банковской карте или монете для замера предметов в миллиметрах.'
        : 'Accurate 1:1 online screen ruler for desktop and mobile displays. Calibrate with a credit card for millimeter-precise physical measurement in browser.';
    } else if (slug === 'credit-card') {
      title = isRu
        ? `Размер банковской карты 1:1 — реальный масштаб на экране | ${brand}`
        : `Credit Card Actual Size 1:1 — True Physical Scale on Screen | ${brand}`;
      description = isRu
        ? 'Стандартные физические размеры банковской карты (85.60 × 53.98 мм) в масштабе 1:1 на мониторе. Эталон для быстрой калибровки дисплея онлайн.'
        : 'Standard credit card dimensions (85.60 × 53.98 mm) in exact 1:1 scale on screen. Perfect reference standard to calibrate any monitor or display.';
    } else {
      const dev = deviceBySlug.get(slug);
      const modelRu = dev ? dev.modelRu : input.entityRu;
      const modelEn = dev ? dev.modelEn : input.entityEn;
      const w = dev ? dev.widthMm : (input.extraDetails?.widthMm ?? 70);
      const h = dev ? dev.heightMm : (input.extraDetails?.heightMm ?? 140);
      const t = dev ? dev.thicknessMm : (input.extraDetails?.thicknessMm ?? 8);
      const year = dev ? dev.releaseYear : (input.extraDetails?.releaseYear ?? 2024);

      if (isRu) {
        title = `Реальный размер: ${modelRu} 1:1 на экране (${w}×${h} мм) | ${brand}`;
        if (title.length > 70) {
          title = `${modelRu} — масштаб 1:1 (${w}×${h} мм) | ${brand}`;
          if (title.length > 70) {
            title = `Реальный размер: ${modelRu} 1:1 на экране | ${brand}`;
            if (title.length > 70) title = `${modelRu} в масштабе 1:1 | ${brand}`;
          }
        }

        const ruVariants = [
          `Масштаб 1:1 для ${modelRu} на экране. Физические размеры: ${w} × ${h} × ${t} мм (${year} г.). Откалибруйте монитор по карте для точной примерки и замеров онлайн.`,
          `Точные габариты ${modelRu} в натуральную величину: ${w} × ${h} × ${t} мм (${year} г.). Быстрая калибровка дисплея по банковской карте без искажений масштаба.`,
          `Сравните реальный физический размер ${modelRu} на мониторе: ${w} × ${h} × ${t} мм (${year} г.). Приложите банковскую карту для миллиметровой калибровки 1:1.`,
          `Визуализация ${modelRu} в реальном масштабе 1 к 1. Размеры корпуса: ${w} × ${h} × ${t} мм (${year} г.). Удобная экранная калибровка для примерки чехлов.`,
        ];
        const vIdxRu = (hash + (dev?.brand?.charCodeAt(0) || 0) + (modelRu.charCodeAt(modelRu.length - 1) || 0)) % ruVariants.length;
        description = ruVariants[vIdxRu];
        if (description.length > 165) {
          description = `Масштаб 1:1 для ${modelRu} на экране. Габариты: ${w} × ${h} × ${t} мм (${year}). Откалибруйте монитор по карте для точной примерки и замеров онлайн.`;
        }
        if (description.length < 115) description += ' Проверка размеров онлайн.';
      } else {
        title = `Real Size: ${modelEn} 1:1 Scale (${w}×${h} mm) | ${brand}`;
        if (title.length > 70) {
          title = `${modelEn} — True 1:1 Scale (${w}×${h} mm) | ${brand}`;
          if (title.length > 70) {
            title = `Real Size: ${modelEn} 1:1 on Screen | ${brand}`;
            if (title.length > 70) title = `${modelEn} 1:1 Scale | ${brand}`;
          }
        }

        const enVariants = [
          `True 1:1 physical scale of ${modelEn} on screen. Exact dimensions: ${w} × ${h} × ${t} mm (${year}). Calibrate display with a bank card for millimeter precision.`,
          `Exact real-world dimensions for ${modelEn}: ${w} × ${h} × ${t} mm (${year}). Interactive 1:1 screen calibrator using a standard credit card reference.`,
          `Inspect ${modelEn} in actual physical size on your monitor. Hardware dimensions: ${w} × ${h} × ${t} mm (${year}). Calibrate in seconds for zero visual distortion.`,
          `Real-life 1:1 scale display for ${modelEn}. True case measurements: ${w} × ${h} × ${t} mm (${year}). Perfect for case fitting and physical device comparison.`,
        ];
        const vIdxEn = (hash + (dev?.brand?.charCodeAt(0) || 0) + (modelEn.charCodeAt(modelEn.length - 1) || 0)) % enVariants.length;
        description = enVariants[vIdxEn];
        if (description.length > 165) {
          description = `True 1:1 scale for ${modelEn} on screen. Dimensions: ${w} × ${h} × ${t} mm (${year}). Calibrate display with a card for millimeter precision online.`;
        }
        if (description.length < 115) description += ' Accurate screen scale.';
      }
    }
  } else if (normCat === 'diagnostic') {
    // 4. Bespoke technical specifications for what-is-my
    const metric = diagnosticBySlug.get(slug);
    const nameRu = metric ? metric.nameRu : input.entityRu;
    const nameEn = metric ? metric.nameEn : input.entityEn;
    const descRuBase = metric ? metric.descriptionRu : 'Диагностика параметров системы и устройства.';
    const descEnBase = metric ? metric.descriptionEn : 'Real-time diagnostic check for system and device specifications.';

    if (isRu) {
      title = `Мой ${nameRu} — диагностика системы онлайн | ${brand}`;
      if (title.length > 70) {
        title = `${nameRu} — диагностика онлайн | ${brand}`;
        if (title.length > 70) {
          title = `Проверить ${nameRu} онлайн | ${brand}`;
          if (title.length > 70) title = `${nameRu} | ${brand}`;
        }
      }

      const ruSuff = [
        'Быстрая онлайн-проверка характеристик устройства, экрана и браузера с копированием данных.',
        'Мгновенная диагностика параметров системы и сетевого подключения без сторонних программ.',
        'Точные аппаратные и системные спецификации оборудования в реальном времени в браузере.',
        'Проверка конфигурации компьютера и смартфона онлайн с быстрым сохранением результатов.',
      ];
      description = `${descRuBase} ${ruSuff[hash % ruSuff.length]}`;
      if (description.length > 165) {
        const compactSuff = [
          'Быстрая проверка характеристик системы онлайн.',
          'Мгновенная диагностика параметров в браузере.',
          'Точные системные спецификации в реальном времени.',
          'Проверка конфигурации оборудования в один клик.',
        ];
        description = `${descRuBase} ${compactSuff[hash % compactSuff.length]}`;
      }
      if (description.length < 115) description += ' Результаты проверки доступны онлайн бесплатно.';
    } else {
      title = `What is My ${nameEn}? System Diagnostics Online | ${brand}`;
      if (title.length > 70) {
        title = `Check My ${nameEn} Online | ${brand}`;
        if (title.length > 70) {
          title = `${nameEn} Online Diagnostics | ${brand}`;
          if (title.length > 70) title = `${nameEn} | ${brand}`;
        }
      }

      const enSuff = [
        'Fast online inspection of device, screen, and browser specifications with instant export.',
        'Instant system and network diagnostics without installing third-party utilities online.',
        'Accurate real-time hardware and environment specifications directly in your web browser.',
        'Verify host device and browser configuration online with quick clipboard data export.',
      ];
      description = `${descEnBase} ${enSuff[hash % enSuff.length]}`;
      if (description.length > 165) {
        const compactEnSuff = [
          'Fast online inspection of system specs with instant export.',
          'Instant system and network diagnostics directly in browser.',
          'Accurate real-time hardware specifications in one click.',
          'Verify host device configuration with quick clipboard export.',
        ];
        description = `${descEnBase} ${compactEnSuff[hash % compactEnSuff.length]}`;
      }
      if (description.length < 115) description += ' Available free online in browser.';
    }
  } else if (normCat === 'catalog') {
    // 5. Rich item metadata for catalog items
    const rawDesc = (input.extraDetails?.description as string) || (input.extraDetails?.intro as string) || 'Параметры и справочные данные онлайн';
    const catId = input.extraDetails?.catalogId ? String(input.extraDetails.catalogId) : '';

    if (isRu) {
      title = `${input.entityRu} — справочник и параметры онлайн | ${brand}`;
      if (title.length > 70) {
        title = `${input.entityRu} — таблица параметров онлайн | ${brand}`;
        if (title.length > 70) {
          title = `${input.entityRu} — справочник онлайн | ${brand}`;
          if (title.length > 70) {
            title = `${input.entityRu} | ${brand}`;
            if (title.length > 70) {
              title = `${input.entityRu.slice(0, 70 - brand.length - 3)}... | ${brand}`;
            }
          }
        }
      }

      description = `${input.entityRu}: ${rawDesc}. Справочные спецификации, параметры и копирование данных онлайн без регистрации.`;
      if (description.length > 165) {
        description = `${input.entityRu}: ${rawDesc.slice(0, 80)}... Таблица параметров и спецификаций онлайн без регистрации.`;
        if (description.length > 165) {
          description = `${input.entityRu}: справочные спецификации, параметры и быстрый поиск по каталогу онлайн без регистрации.`;
        }
      }
      if (description.length < 115) description += ' Доступно бесплатно в браузере.';
    } else {
      const catSuffix = catId ? ` (Cat ${catId})` : '';
      title = `${input.entityEn}${catSuffix} — Specs & Reference Guide | ${brand}`;
      if (title.length > 70) {
        title = `${input.entityEn}${catSuffix} — Reference Guide | ${brand}`;
        if (title.length > 70) {
          title = `${input.entityEn} Online Directory | ${brand}`;
          if (title.length > 70) {
            title = `${input.entityEn} | ${brand}`;
            if (title.length > 70) {
              title = `${input.entityEn.slice(0, 70 - brand.length - 3)}... | ${brand}`;
            }
          }
        }
      }

      const catDomainEn: Record<string, string> = {
        '21': 'special typographical symbols and Unicode characters',
        '22': 'thematic symbol collections and categorized glyphs',
        '23': 'standardized emoji registry and category metadata',
        '24': 'creative Japanese kaomoji emoticons and text faces',
        '25': 'interactive online calculation and conversion utilities',
        '26': 'Unicode character dossiers and typographic codepoints',
        '27': 'digital utilities and quick web tool specifications',
      };
      const domainDesc = catDomainEn[catId] || 'verified technical directory parameters';

      const catPrefix = catId ? ` (Cat ${catId})` : '';
      const enCatVariants = [
        `${input.entityEn}${catPrefix}: explore ${domainDesc}. Verified codepoints, HTML entities, and instant copy tools in browser.`,
        `${input.entityEn}${catPrefix} guide: comprehensive reference for ${domainDesc}. View parameters and copy data online free.`,
        `Technical specs for ${input.entityEn}${catPrefix}: curated collection of ${domainDesc}. Fast online lookup without registration.`,
        `Online dossier for ${input.entityEn}${catPrefix}: detailed parameters and reference data for ${domainDesc} in browser.`,
      ];
      description = enCatVariants[hash % enCatVariants.length];
      if (description.length > 165) {
        description = `${input.entityEn}${catPrefix}: verified reference for ${domainDesc}. View specs and copy data online.`;
      }
      if (description.length < 115) description += ' Available free online in browser.';
    }
  } else if (normCat === 'timer') {
    // 6. Countdown and interval timing for timers
    const rawDescRu = (input.extraDetails?.descRu as string) || 'Точный онлайн-таймер обратного отсчета.';
    const rawDescEn = (input.extraDetails?.descEn as string) || 'Accurate online countdown timer.';

    if (isRu) {
      title = `Таймер: ${input.entityRu} онлайн — обратный отсчет со звуком | ${brand}`;
      if (title.length > 70) {
        title = `${input.entityRu} — таймер обратного отсчета со звуком | ${brand}`;
        if (title.length > 70) title = `${input.entityRu} — таймер онлайн | ${brand}`;
      }

      const ruTimerClosers = [
        'Полноэкранный режим, звуковое оповещение и пауза прямо в браузере.',
        'Громкий аудиосигнал по окончании, пауза и автоматический сброс онлайн.',
        'Удобный цифровой дисплей для концентрации, работы и тренировок.',
        'Работает в фоновой вкладке со звуковым уведомлением без сторонних программ.',
        'Точный хронометраж времени с кнопками паузы, сброса и звуком.',
        'Интуитивный секундомер и обратный таймер для работы и спорта.',
      ];
      const timerHashRu = (hash + (input.entityRu.length * 7) + (input.entityRu.charCodeAt(0) || 0));
      description = `${rawDescRu} ${ruTimerClosers[timerHashRu % ruTimerClosers.length]}`;
      if (description.length > 165) {
        description = `${rawDescRu} Точный онлайн-таймер со звуковым сигналом и полноэкранным режимом.`;
      }
      if (description.length < 115) description += ' Бесплатно онлайн.';
    } else {
      title = `${input.entityEn} Timer Online — Countdown with Sound Alert | ${brand}`;
      if (title.length > 70) {
        title = `${input.entityEn} Online Timer with Audio Alert | ${brand}`;
        if (title.length > 70) title = `${input.entityEn} Timer Online | ${brand}`;
      }

      const enTimerClosers = [
        'Fullscreen display, audio alert, and pause controls in browser.',
        'Loud audio notification, interval pause, and online reset.',
        'Clear digital display for focus, cooking, workouts, and study.',
        'Runs in background tab with sound notification without software.',
        'Precise interval chronometer with audio chime and pause button.',
        'Reliable browser stopwatch and countdown ticker for everyday tasks.',
      ];
      const timerHashEn = (hash + (input.entityEn.length * 7) + (input.entityEn.charCodeAt(0) || 0));
      description = `${rawDescEn} ${enTimerClosers[timerHashEn % enTimerClosers.length]}`;
      if (description.length > 165) {
        description = `${rawDescEn} Free online countdown timer with loud audio alert and fullscreen mode.`;
      }
      if (description.length < 115) description += ' Available free online.';
    }
  } else if (normCat === 'emoji') {
    const slugKey = slug.toLowerCase();
    const emojiDetailsRu: Record<string, string> = {
      smileys: 'Смайлики и эмоции: лица, жесты, улыбки и реакции для сообщений.',
      people: 'Люди и тело: жесты руками, персонажи, профессии и образы Unicode.',
      animals: 'Животные и природа: млекопитающие, птицы, растения и погодные явления.',
      food: 'Еда и напитки: фрукты, овощи, готовые блюда, напитки и десерты.',
      travel: 'Путешествия и транспорт: автомобили, самолеты, поезда и достопримечательности.',
      activities: 'Активности и спорт: спортивные игры, инвентарь, хобби и награды.',
      objects: 'Предметы и канцелярия: гаджеты, инструменты, книги и бытовые вещи.',
      symbols: 'Символы и знаки: геометрические фигуры, стрелки, зодиак и предупреждения.',
      flags: 'Флаги государств и территорий: официальные флаги стран мира Unicode.',
    };
    const emojiDetailsEn: Record<string, string> = {
      smileys: 'Smiley faces, gestures, emotions, and expressive icons for messaging.',
      people: 'People, human body, gestures, professions, and fantasy characters.',
      animals: 'Animals, nature, mammals, birds, plants, and meteorological icons.',
      food: 'Food and drink: fruits, vegetables, prepared meals, and confectionery.',
      travel: 'Travel and transport: vehicles, aircraft, places, and world landmarks.',
      activities: 'Activities and sports: competitive games, awards, and hobby items.',
      objects: 'Objects and tools: technology, household appliances, and stationery.',
      symbols: 'Symbols, zodiac signs, punctuation, arrows, and warning badges.',
      flags: 'Country and territory flags: international standardized Unicode flags.',
    };

    if (isRu) {
      title = `Эмодзи: ${input.entityRu} — скопировать смайлики и символы | ${brand}`;
      if (title.length > 70) title = `Эмодзи ${input.entityRu} — копировать символы | ${brand}`;
      const detailRu = emojiDetailsRu[slugKey] || 'Удобная коллекция смайликов и символов для сообщений.';
      description = `Коллекция «${input.entityRu}»: ${detailRu} Быстрый поиск и копирование символов в буфер обмена онлайн в один клик.`;
    } else {
      title = `${input.entityEn} Emojis — Copy Unicode Emoticons & Icons | ${brand}`;
      if (title.length > 70) title = `${input.entityEn} Emojis — Copy Emoticons | ${brand}`;
      const detailEn = emojiDetailsEn[slugKey] || 'Complete collection of Unicode emoticons and glyphs.';
      description = `${input.entityEn} collection: ${detailEn} Instant one-click copy to clipboard and Unicode codepoints lookup.`;
    }
  } else if (normCat === 'symbol') {
    const slugKey = slug.toLowerCase();
    const symbolDetailsRu: Record<string, string> = {
      math: 'Математические знаки: интегралы, корни, дроби, греческие буквы и операторы.',
      arrows: 'Стрелки Unicode всех типов: одинарные, двойные, круговые и диагональные.',
      currency: 'Символы мировых валют: доллар, евро, фунт, иена, тенге, юань и криптознаки.',
      stars: 'Звезды, снежинки, искры и декоративные символы для оформления текста.',
      kaomoji: 'Японские текстовые смайлики каомдзи для выражения эмоций в сообщениях.',
    };
    const symbolDetailsEn: Record<string, string> = {
      math: 'Mathematical symbols: integrals, square roots, fractions, and logic operators.',
      arrows: 'Unicode arrows: directional, double, circular, block, and harpoon indicators.',
      currency: 'World currency signs: Dollar, Euro, Pound, Yen, Tenge, Yuan, and crypto tokens.',
      stars: 'Stars, sparkles, snowflakes, and decorative typographic ornaments.',
      kaomoji: 'Japanese kaomoji emoticons and text faces for creative online messaging.',
    };

    if (isRu) {
      title = `Символы: ${input.entityRu} — таблица знаков для копирования | ${brand}`;
      if (title.length > 70) title = `Символы ${input.entityRu} — копировать знаки | ${brand}`;
      const detailRu = symbolDetailsRu[slugKey] || 'Таблица типографических знаков для текста.';
      description = `Спецсимволы «${input.entityRu}»: ${detailRu} HTML-коды, Alt-коды и мгновенное копирование в буфер обмена онлайн.`;
    } else {
      title = `${input.entityEn} Symbols — Copy Special Unicode Characters | ${brand}`;
      if (title.length > 70) title = `${input.entityEn} Symbols — Copy Characters | ${brand}`;
      const detailEn = symbolDetailsEn[slugKey] || 'Special typography characters and Unicode glyphs.';
      description = `${input.entityEn} symbols: ${detailEn} HTML entities, Alt codes, and instant one-click copying in browser.`;
    }
  } else {
    // 7. General fallback
    if (isRu) {
      title = `${entity} онлайн — точные данные и спецификации | ${brand}`;
      if (title.length > 70) title = `${entity} онлайн — данные | ${brand}`;
      description = `Интерактивный справочник и инструмент ${entity} онлайн. Просмотр параметров, характеристик и спецификаций бесплатно в браузере.`;
    } else {
      title = `${entity} Online — Guide, Specs & Data | ${brand}`;
      if (title.length > 70) title = `${entity} Online — Specs | ${brand}`;
      description = `Interactive online directory and tool for ${entity}. Inspect parameters, technical specifications, and reference data free in browser.`;
    }
  }

  const canonical = `${siteConfig.baseUrl}${input.path}`;

  const categoryKeywords: Record<string, string[]> = {
    'time-now': isRu
      ? ['точное время', 'часовой пояс', 'мировое время', 'секунды', 'utc смещение', 'разница во времени']
      : ['current time', 'exact timezone', 'world clock', 'live seconds', 'utc offset', 'local time'],
    'actual-size': isRu
      ? ['реальный размер', '1:1 на экране', 'масштаб монитора', 'калибровка экрана', 'размеры в мм']
      : ['actual size', '1:1 scale', 'screen ruler', 'display calibration', 'physical dimensions'],
    emoji: isRu
      ? ['скопировать эмодзи', 'значение эмодзи', 'юникод', 'смайлики', 'шорткод', 'символ']
      : ['copy emoji', 'emoji meaning', 'unicode codepoint', 'emoticons', 'shortcodes', 'symbol'],
    symbol: isRu
      ? ['спецсимволы', 'символ unicode', 'html сущность', 'знак для копирования', 'alt код']
      : ['special symbols', 'unicode character', 'html entity', 'copy symbol', 'alt code'],
    timer: isRu
      ? ['обратный отсчёт', 'таймер онлайн', 'сколько осталось', 'секунды со звуком', 'секундомер']
      : ['countdown timer', 'timer online', 'time remaining', 'stopwatch with sound', 'ticker'],
    diagnostic: isRu
      ? ['узнать свой', 'параметры браузера', 'разрешение экрана', 'система', 'характеристики железа']
      : ['what is my', 'browser detection', 'screen resolution', 'system specs', 'hardware info'],
    catalog: isRu
      ? ['справочник', 'таблица параметров', 'характеристики', 'поиск по реестру', 'спецификации']
      : ['reference guide', 'specs table', 'lookup directory', 'technical data', 'database'],
    interactive: isRu
      ? ['интерактивный инструмент', 'онлайн генератор', 'сервис в браузере', 'бесплатно']
      : ['interactive tool', 'online generator', 'web utility', 'free browser app'],
  };

  const extraKeywords = categoryKeywords[normCat] || (isRu ? ['онлайн', 'бесплатно'] : ['online', 'free']);

  return {
    title,
    description,
    h1,
    canonical,
    keywords: [entity, input.category, brand, ...extraKeywords],
  };
}

export function generateUniqueMetadata(opts: {
  canonicalPath: string;
  category: string;
  entityName?: string;
  entityRu?: string;
  entityEn?: string;
  locale: 'ru' | 'en';
  extraDetails?: Record<string, string | number>;
}): Metadata {
  const isRu = opts.locale === 'ru';
  const ruName = opts.entityRu || opts.entityName || '';
  const enName = opts.entityEn || opts.entityName || '';

  const meta = generateUniqueMeta({
    path: opts.canonicalPath,
    category: opts.category as MetaCategoryType,
    entityRu: ruName,
    entityEn: enName,
    locale: opts.locale,
    extraDetails: opts.extraDetails,
  });

  const cleanPath = opts.canonicalPath.replace(/^\/(ru|en)/, '');
  const BASE = siteConfig.baseUrl;

  return {
    metadataBase: new URL(BASE),
    title: { absolute: meta.title },
    description: meta.description,
    keywords: [...meta.keywords],
    alternates: {
      canonical: meta.canonical,
      languages: {
        ru: `${BASE}/ru${cleanPath}`,
        en: `${BASE}/en${cleanPath}`,
        'x-default': `${BASE}/ru${cleanPath}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
      type: 'website',
      siteName: siteConfig.brandName,
      locale: isRu ? 'ru_RU' : 'en_US',
      images: [
        {
          url: `${BASE}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${BASE}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large' as const,
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    other: {
      'og:locale:alternate': isRu ? 'en_US' : 'ru_RU',
    },
  };
}
