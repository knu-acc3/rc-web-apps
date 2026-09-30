import { describe, it, expect } from 'vitest';
import { calculateSolarTimes } from '@/src/lib/time-now/solarMath';

describe('Астрономический калькулятор фаз солнца', () => {
  it('должен рассчитывать восход и закат для Москвы (55.75° N, 37.61° E)', () => {
    const res = calculateSolarTimes(55.75, 37.61, 'Europe/Moscow', new Date('2026-06-21T12:00:00Z'));
    expect(res.dayLengthMinutes).toBeGreaterThan(1000); // Летнее солнцестояние > 16 часов
    expect(res.sunriseTimeString).toMatch(/^\d{2}:\d{2}$/);
    expect(res.sunsetTimeString).toMatch(/^\d{2}:\d{2}$/);
  });
});
