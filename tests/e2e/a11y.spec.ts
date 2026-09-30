import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ACCESSIBILITY_TEST_ROUTES = [
  '/',
  '/ru/tools/pdf-studio',
  '/ru/time-now/moscow',
  '/ru/actual-size/iphone-16-pro',
  '/ru/emojis',
];

for (const route of ACCESSIBILITY_TEST_ROUTES) {
  test(`Страница ${route} должна соответствовать WCAG 2.2 AA`, async ({ page }) => {
    await page.goto(route);
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
