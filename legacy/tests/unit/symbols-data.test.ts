import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { SymbolItemSchema } from '@/src/types/symbols';

describe('База данных символов Unicode и Каомодзи', () => {
  it('файл symbols.json должен существовать и содержать валидные символы', () => {
    expect(existsSync('src/data/symbols/symbols.json')).toBe(true);
    const data = JSON.parse(readFileSync('src/data/symbols/symbols.json', 'utf8'));
    expect(data.length).toBeGreaterThanOrEqual(80);

    for (const item of data) {
      const res = SymbolItemSchema.safeParse(item);
      expect(res.success, `Ошибка валидации символа: ${item.char}`).toBe(true);
    }
  });

  it('файл kaomoji.json должен содержать текстовые эмодзи', () => {
    expect(existsSync('src/data/symbols/kaomoji.json')).toBe(true);
    const data = JSON.parse(readFileSync('src/data/symbols/kaomoji.json', 'utf8'));
    expect(data.length).toBeGreaterThan(10);
    expect(data.some((k: { text: string }) => k.text.includes('(◕‿◕)'))).toBe(true);
  });
});
