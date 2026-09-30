import type { CatalogCardItem } from '@/src/components/catalogs/CatalogCardGrid';

import c21 from '@/src/data/catalogs/catalog-21.json';
import c22 from '@/src/data/catalogs/catalog-22.json';
import c23 from '@/src/data/catalogs/catalog-23.json';
import c24 from '@/src/data/catalogs/catalog-24.json';
import c25 from '@/src/data/catalogs/catalog-25.json';
import c26 from '@/src/data/catalogs/catalog-26.json';
import c27 from '@/src/data/catalogs/catalog-27.json';

const catalogsMap: Record<string, CatalogCardItem[]> = {
  '21': c21 as CatalogCardItem[],
  '22': c22 as CatalogCardItem[],
  '23': c23 as CatalogCardItem[],
  '24': c24 as CatalogCardItem[],
  '25': c25 as CatalogCardItem[],
  '26': c26 as CatalogCardItem[],
  '27': c27 as CatalogCardItem[],
};

export const AVAILABLE_CATALOG_IDS = ['21', '22', '23', '24', '25', '26', '27'] as const;

export const CATALOG_INFO: Record<string, { titleRu: string; titleEn: string; descRu: string; descEn: string }> = {
  '21': {
    titleRu: 'Символы и знаки',
    titleEn: 'Symbols & Glyphs',
    descRu: 'Специальные типографические символы, знаки и пиктограммы.',
    descEn: 'Special typographic symbols, glyphs, and pictograms.',
  },
  '22': {
    titleRu: 'Тематические коллекции знаков',
    titleEn: 'Thematic Symbol Collections',
    descRu: 'Группированные подборки Unicode-символов по темам.',
    descEn: 'Grouped Unicode collections categorized by domain.',
  },
  '23': {
    titleRu: 'Реестр эмодзи',
    titleEn: 'Emoji Registry',
    descRu: 'Справочные карточки эмодзи и метаданные категорий.',
    descEn: 'Emoji specification dossiers and category metadata.',
  },
  '24': {
    titleRu: 'Гаджеты 1:1 в реальном размере',
    titleEn: 'Actual Size 1:1 Gadgets',
    descRu: 'Точные физические габариты смартфонов и планшетов.',
    descEn: 'Calibrated 1:1 physical specs for devices and gadgets.',
  },
  '25': {
    titleRu: 'База знаний времени и зон',
    titleEn: 'Time Zones Knowledge Base',
    descRu: 'Энциклопедические справочные статьи и сравнения часовых поясов.',
    descEn: 'Encyclopedic reference entries and timezone comparison guides.',
  },
  '26': {
    titleRu: 'Диагностические профили',
    titleEn: 'Diagnostics Profiles',
    descRu: 'Параметры окружения, сенсоры и стандарты браузера.',
    descEn: 'Environment benchmarks, sensor profiles, and standards.',
  },
  '27': {
    titleRu: 'Интерактивные справочники',
    titleEn: 'Interactive Compendiums',
    descRu: 'Калькуляторы, таблицы соответствий и конвертеры.',
    descEn: 'Interactive tables, converters, and computational dossiers.',
  },
};

export function getCatalogItems(catalogId: string): CatalogCardItem[] {
  return catalogsMap[catalogId] || [];
}

export function getCatalogItem(catalogId: string, slug: string): CatalogCardItem | undefined {
  const items = getCatalogItems(catalogId);
  return items.find((i) => i.slug === slug);
}
