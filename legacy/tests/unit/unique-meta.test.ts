import { describe, it, expect } from 'vitest';
import { generateUniqueMeta } from '@/src/lib/seo/uniqueMetaEngine';

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateDifferenceRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return levenshteinDistance(a, b) / maxLen;
}

describe('Комбинаторный SEO-движок уникализации метаданных', () => {
  it('должен генерировать 100% идентичный результат при одном и том же пути (детерминированность)', () => {
    const meta1 = generateUniqueMeta({
      path: '/ru/time-now/moscow',
      category: 'time-now',
      entityRu: 'Москва',
      entityEn: 'Moscow',
      locale: 'ru',
    });
    const meta2 = generateUniqueMeta({
      path: '/ru/time-now/moscow',
      category: 'time-now',
      entityRu: 'Москва',
      entityEn: 'Moscow',
      locale: 'ru',
    });

    expect(meta1.title).toBe(meta2.title);
    expect(meta1.description).toBe(meta2.description);
  });

  it('должен гарантировать различие по Левенштейну > 40% между разными городами', () => {
    const metaMoscow = generateUniqueMeta({
      path: '/ru/time-now/moscow',
      category: 'time-now',
      entityRu: 'Москва',
      entityEn: 'Moscow',
      locale: 'ru',
    });
    const metaLondon = generateUniqueMeta({
      path: '/ru/time-now/london',
      category: 'time-now',
      entityRu: 'Лондон',
      entityEn: 'London',
      locale: 'ru',
    });

    const diff = calculateDifferenceRatio(metaMoscow.description, metaLondon.description);
    expect(diff).toBeGreaterThanOrEqual(0.40);
  });
});
