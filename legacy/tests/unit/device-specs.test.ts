import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { DeviceSpecSchema } from '@/src/types/actual-size';

describe('База габаритов устройств Actual-Size 1:1', () => {
  it('файл devices.json должен содержать валидные модели', () => {
    expect(existsSync('src/data/actual-size/devices.json')).toBe(true);
    const data = JSON.parse(readFileSync('src/data/actual-size/devices.json', 'utf8'));
    expect(data.length).toBeGreaterThanOrEqual(100);

    for (const d of data) {
      const res = DeviceSpecSchema.safeParse(d);
      expect(res.success, `Невалидные габариты устройства: ${d.slug}`).toBe(true);
      expect(d.widthMm).toBeGreaterThan(20);
      expect(d.heightMm).toBeGreaterThan(20);
    }
  });
});
