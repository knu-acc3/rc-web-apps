import { test, expect } from '@playwright/test';

const TEST_ROUTES = [
  '/',
  '/ru/tools/pdf-studio',
  '/ru/time-now/moscow',
  '/ru/actual-size/ruler',
  '/ru/emojis',
  '/ru/symbols',
  '/ru/timer',
  '/ru/what-is-my/ip',
  '/ru/catalog',
];

const MICRO_VIEWPORT_WIDTHS = [240, 260, 280, 300, 320, 360, 400, 480];
const MACRO_VIEWPORT_WIDTHS = [768, 1024, 1440, 1920];

test.describe('Матричный стресс-тест адаптивности (Zero Horizontal Overflow)', () => {
  for (const width of MICRO_VIEWPORT_WIDTHS) {
    test(`Ширина ${width}px: документ не имеет горизонтального переполнения`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });

      for (const route of TEST_ROUTES.slice(0, 3)) {
        await page.goto(route);
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(isOverflowing, `Горизонтальное переполнение на ${route} при ширине ${width}px`).toBe(false);
      }
    });
  }

  for (const width of MACRO_VIEWPORT_WIDTHS) {
    test(`Ширина ${width}px (планшет/десктоп): документ без переполнения`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto('/');
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    });
  }
});
