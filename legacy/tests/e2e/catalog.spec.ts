import { expect, test } from "@playwright/test";
import {
  collectRuntimeErrors,
  expectNoRuntimeErrors,
  useNecessaryConsent,
  waitForAppReady,
} from "./helpers";

const REPRESENTATIVE_TOOLS = [
  ["converters", "color-converter"],
  ["datetime", "world-clock"],
  ["calculators", "scientific-calc"],
  ["images", "image-compressor"],
  ["text", "case-converter"],
  ["generators", "password-generator"],
  ["developers", "json-formatter"],
  ["math", "equation-solver"],
  ["health", "body-metrics"],
  ["finance", "budget-planner"],
  ["security", "password-strength"],
  ["entertainment", "random-picker"],
  ["encoding", "base64-encoder"],
  ["symbols", "unicode-lookup"],
  ["qrbarcode", "qr-code-gen"],
  ["color", "color-wheel"],
  ["seo", "seo-meta-tool"],
  ["network", "ip-calculator"],
  ["units", "cooking-converter"],
  ["productivity", "pomodoro"],
  ["media", "metronome"],
  ["pdf", "pdf-studio"],
] as const;

test.describe("representative catalog routes", () => {
  for (const [group, slug] of REPRESENTATIVE_TOOLS) {
    test(`${group}: ${slug} renders an interactive tool`, async ({ page }) => {
      await useNecessaryConsent(page);
      const runtimeErrors = collectRuntimeErrors(page);

      const response = await page.goto(`/en/tools/${slug}`);
      expect(response?.status()).toBe(200);
      await waitForAppReady(page);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("main")).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator(
              "main button, main input, main textarea, main select, main canvas",
            )
            .count(),
        )
        .toBeGreaterThan(0);

      expectNoRuntimeErrors(runtimeErrors);
    });
  }
});
