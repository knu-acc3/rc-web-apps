import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { LocationRecordSchema } from '@/src/types/time-now';

describe('База данных Мирового Времени', () => {
  it('файл locations.json должен существовать и содержать не менее 300 записей', () => {
    expect(existsSync('src/data/time-now/locations.json')).toBe(true);
    const data = JSON.parse(readFileSync('src/data/time-now/locations.json', 'utf8'));
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(300);
  });

  it('каждая запись должна валидироваться через LocationRecordSchema', () => {
    const data = JSON.parse(readFileSync('src/data/time-now/locations.json', 'utf8'));
    for (const item of data) {
      const parsed = LocationRecordSchema.safeParse(item);
      expect(parsed.success, `Ошибка валидации локации: ${item.slug}`).toBe(true);
    }
  });

  it('все часовые пояса IANA должны быть валидными в среде Intl', () => {
    const data = JSON.parse(readFileSync('src/data/time-now/locations.json', 'utf8'));
    for (const item of data) {
      expect(() => {
        new Intl.DateTimeFormat('en-US', { timeZone: item.timezoneIana });
      }, `Невалидная таймзона IANA: ${item.timezoneIana} у города ${item.slug}`).not.toThrow();
    }
  });
});
