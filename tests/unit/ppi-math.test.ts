import { describe, it, expect } from 'vitest';

describe('Математика калибровки экранов PPI', () => {
  it('должна точно вычислять PPI по ширине банковской карты 85.60 мм', () => {
    // Если на экране карта 85.60 мм занимает 324 пикселя:
    const cardPx = 324;
    const cardMm = 85.60;
    const ppi = (cardPx / cardMm) * 25.4;

    expect(Math.round(ppi)).toBe(96); // Стандартный дисплей 96 DPI
  });

  it('должна пересчитывать миллиметры в экранные пиксели при заданном PPI', () => {
    const ppi = 96;
    const deviceWidthMm = 71.5; // iPhone 14
    const pixels = (deviceWidthMm / 25.4) * ppi;

    expect(Math.round(pixels)).toBe(270);
  });
});
