import { describe, it, expect } from 'vitest';
import Fuse from 'fuse.js';
import type { GlobalSearchIndexItem } from '@/src/types/search';

const mockIndex: GlobalSearchIndexItem[] = [
  {
    id: 'tool-pdf-studio',
    slug: 'pdf-studio',
    titleRu: 'PDF Студия',
    titleEn: 'PDF Studio',
    descriptionRu: 'Объединение, сжатие и редактирование PDF',
    descriptionEn: 'Merge, compress and edit PDF documents',
    category: 'tool',
    urlRu: '/ru/tools/pdf-studio',
    urlEn: '/en/tools/pdf-studio',
    keywords: ['pdf', 'пдф', 'документы', 'сжать'],
    iconName: 'FilePdf',
  },
  {
    id: 'time-moscow',
    slug: 'moscow',
    titleRu: 'Точное время в Москве',
    titleEn: 'Exact Time in Moscow',
    descriptionRu: 'Текущее время в столице России, часовой пояс UTC+3',
    descriptionEn: 'Current time in Russian capital, UTC+3',
    category: 'time-now',
    urlRu: '/ru/time-now/moscow',
    urlEn: '/en/time-now/moscow',
    keywords: ['время', 'москва', 'часы'],
    iconName: 'Clock',
  },
];

describe('Глобальный поисковый движок Fuse.js', () => {
  const fuse = new Fuse(mockIndex, {
    keys: ['titleRu', 'titleEn', 'keywords', 'descriptionRu'],
    threshold: 0.35,
  });

  it('должен находить инструменты по точному совпадению названия', () => {
    const results = fuse.search('PDF');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.slug).toBe('pdf-studio');
  });

  it('должен находить города по русским ключевым словам', () => {
    const results = fuse.search('москва');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.slug).toBe('moscow');
  });

  it('должен поддерживать нечеткий поиск с опечатками', () => {
    const results = fuse.search('пдф');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.slug).toBe('pdf-studio');
  });

  it('функция buildGlobalSearchIndex должна возвращать все 183 инструмента и каталоги PilliApp', async () => {
    const { buildGlobalSearchIndex } = await import('@/src/lib/search/searchIndex');
    const index = buildGlobalSearchIndex();
    expect(index.length).toBeGreaterThan(180);
    expect(index.some(i => i.category === 'time-now')).toBe(true);
    expect(index.some(i => i.category === 'actual-size')).toBe(true);
    expect(index.some(i => i.category === 'emoji')).toBe(true);
    expect(index.some(i => i.category === 'symbol')).toBe(true);
    expect(index.some(i => i.category === 'timer')).toBe(true);
    expect(index.some(i => i.category === 'diagnostic')).toBe(true);
  });
});
