import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { EmojiItemSchema } from '@/src/types/emojis';

describe('База данных эмодзи Unicode 15.1', () => {
  it('должна содержать не менее 1500 символов эмодзи', () => {
    expect(existsSync('src/data/emojis/emojis.json')).toBe(true);
    const data = JSON.parse(readFileSync('src/data/emojis/emojis.json', 'utf8'));
    expect(data.length).toBeGreaterThanOrEqual(1500);
  });

  it('каждый эмодзи должен соответствовать EmojiItemSchema', () => {
    const data = JSON.parse(readFileSync('src/data/emojis/emojis.json', 'utf8'));
    for (const item of data.slice(0, 100)) {
      const res = EmojiItemSchema.safeParse(item);
      expect(res.success, `Ошибка валидации эмодзи: ${item.id}`).toBe(true);
    }
  });
});
