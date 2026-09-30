import { describe, it, expect } from 'vitest';
import { calculateEasterDate } from '@/src/lib/timers/holidayMath';

describe('Математический расчет плавающих праздников', () => {
  it('алгоритм Гаусса должен точно вычислять дату Пасхи', () => {
    // 2026: 12 апреля (Католическая) / 12 апреля (Православная)
    const easter2026 = calculateEasterDate(2026);
    expect(easter2026.getMonth()).toBe(3); // Апрель (0-индексированный)
    expect(easter2026.getDate()).toBe(12);
  });
});
