import { tools, toolGroups } from '@/src/data/tools';
import type { GlobalSearchIndexItem } from '@/src/types/search';

export function buildGlobalSearchIndex(): GlobalSearchIndexItem[] {
  const index: GlobalSearchIndexItem[] = [];

  // 1. Все 183 утилиты UltiTools
  for (const tool of tools) {
    index.push({
      id: `tool-${tool.slug}`,
      slug: tool.slug,
      titleRu: tool.name,
      titleEn: tool.nameEn || tool.name,
      descriptionRu: tool.description,
      descriptionEn: tool.descriptionEn || tool.description,
      category: 'tool',
      urlRu: `/ru/tools/${tool.slug}`,
      urlEn: `/en/tools/${tool.slug}`,
      keywords: tool.keywords || [],
      iconName: tool.icon || 'Wrench',
      isPopular: tool.featured,
    });
  }

  // 2. Группы инструментов
  for (const group of toolGroups) {
    index.push({
      id: `group-${group.slug}`,
      slug: group.slug,
      titleRu: group.name,
      titleEn: group.nameEn || group.name,
      descriptionRu: group.description,
      descriptionEn: group.descriptionEn || group.description,
      category: 'tool',
      urlRu: `/ru/group/${group.slug}`,
      urlEn: `/en/group/${group.slug}`,
      keywords: [group.name, group.nameEn || '', 'категория', 'раздел', 'группа'],
      iconName: group.icon || 'SquaresFour',
    });
  }

  // 3. Каталоги PilliApp
  const catalogs: Array<{
    id: string;
    slug: string;
    titleRu: string;
    titleEn: string;
    descriptionRu: string;
    descriptionEn: string;
    category: GlobalSearchIndexItem['category'];
    urlRu: string;
    urlEn: string;
    keywords: string[];
    iconName: string;
  }> = [
    {
      id: 'catalog-time-now',
      slug: 'time-now',
      titleRu: 'Мировое время и часовые пояса',
      titleEn: 'World Time & Time Zones',
      descriptionRu: 'Точное местное время в городах мира, фазы солнца, разница во времени',
      descriptionEn: 'Accurate local time across world cities, solar cycles and time differences',
      category: 'time-now',
      urlRu: '/ru/time-now',
      urlEn: '/en/time-now',
      keywords: ['время', 'часы', 'таймзона', 'часовой пояс', 'time', 'clock', 'timezone'],
      iconName: 'Clock',
    },
    {
      id: 'catalog-actual-size',
      slug: 'actual-size',
      titleRu: 'Реальные размеры 1:1 и Экранная линейка',
      titleEn: 'Actual Size 1:1 & Screen Ruler',
      descriptionRu: 'Отображение смартфонов, планшетов и предметов в натуральную величину на мониторе',
      descriptionEn: 'Display smartphones, tablets and objects in real physical 1:1 scale on display',
      category: 'actual-size',
      urlRu: '/ru/actual-size',
      urlEn: '/en/actual-size',
      keywords: ['размер', 'линейка', 'калибровка', 'ppi', 'экран', 'ruler', 'scale'],
      iconName: 'Ruler',
    },
    {
      id: 'catalog-emojis',
      slug: 'emojis',
      titleRu: 'Каталог Эмодзи Unicode',
      titleEn: 'Unicode Emoji Catalog',
      descriptionRu: 'Коллекция эмодзи со смайликами, жестами, копированием в буфер в один клик',
      descriptionEn: 'Comprehensive emoji directory with fast copy-paste and categories',
      category: 'emoji',
      urlRu: '/ru/emojis',
      urlEn: '/en/emojis',
      keywords: ['эмодзи', 'смайлы', 'иконки', 'emoji', 'smileys', 'copy'],
      iconName: 'Smiley',
    },
    {
      id: 'catalog-symbols',
      slug: 'symbols',
      titleRu: 'Спецсимволы, каомодзи и Unicode знаки',
      titleEn: 'Special Symbols & Kaomoji',
      descriptionRu: 'Стрелки, математические символы, звездочки, валюты и текстовые каомодзи',
      descriptionEn: 'Arrows, math symbols, currency signs, stars and cute text kaomoji',
      category: 'symbol',
      urlRu: '/ru/symbols',
      urlEn: '/en/symbols',
      keywords: ['символы', 'знаки', 'стрелки', 'каомодзи', 'symbols', 'unicode'],
      iconName: 'Asterisk',
    },
    {
      id: 'catalog-timer',
      slug: 'timer',
      titleRu: 'Универсальный таймер и секундомер',
      titleEn: 'Universal Timer & Stopwatch',
      descriptionRu: 'Таймеры обратного отсчета к праздникам, помодоро, секундомер с кругами и звуком',
      descriptionEn: 'Countdown timers to holidays, pomodoro, lap stopwatch with synthetic sound',
      category: 'timer',
      urlRu: '/ru/timer',
      urlEn: '/en/timer',
      keywords: ['таймер', 'секундомер', 'обратный отсчет', 'помодоро', 'timer', 'stopwatch'],
      iconName: 'Timer',
    },
    {
      id: 'catalog-what-is-my',
      slug: 'what-is-my',
      titleRu: 'Диагностика системы и устройства',
      titleEn: 'System & Device Diagnostics',
      descriptionRu: 'Определение IP-адреса, разрешения экрана, WebGL, батареи, процессора',
      descriptionEn: 'Detect client IP, screen resolution, WebGL renderer, battery and CPU specs',
      category: 'diagnostic',
      urlRu: '/ru/what-is-my',
      urlEn: '/en/what-is-my',
      keywords: ['ip', 'экран', 'диагностика', 'видеокарта', 'процессор', 'diagnostics'],
      iconName: 'Monitor',
    },
  ];

  for (const cat of catalogs) {
    index.push({
      ...cat,
      isPopular: true,
    });
  }

  return index;
}
