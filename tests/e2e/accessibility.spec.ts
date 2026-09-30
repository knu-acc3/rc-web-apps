import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { useNecessaryConsent, waitForAppReady } from "./helpers";

const AUDIT_ROUTES = [
  "/en",
  "/ru/tools/random-name",
  "/en/tools/json-formatter",
  "/en/kz",
] as const;

test.describe("representative accessibility @a11y", () => {
  for (const route of AUDIT_ROUTES) {
    test(`${route} has no automated WCAG A/AA violations`, async ({ page }) => {
      await useNecessaryConsent(page);
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await waitForAppReady(page);
      await expect(page.locator("main")).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = results.violations.map((violation) => ({
        id: violation.id,
        help: violation.help,
        nodes: violation.nodes.map((node) => node.target.join(" ")),
      }));

      expect(
        violations,
        violations
          .map(
            (violation) =>
              `${violation.id}: ${violation.help} (${violation.nodes.join(", ")})`,
          )
          .join("\n"),
      ).toEqual([]);
    });
  }

  test("/en dark theme has no automated WCAG A/AA violations", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("ut_analytics_consent", "necessary");
      window.localStorage.setItem("theme", "dark");
    });
    const response = await page.goto("/en");
    expect(response?.status()).toBe(200);
    await waitForAppReady(page);
    await expect(page.locator("html")).toHaveClass(/dark/);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    }));

    expect(
      violations,
      violations
        .map(
          (violation) =>
            `${violation.id}: ${violation.help} (${violation.nodes.join(", ")})`,
        )
        .join("\n"),
    ).toEqual([]);
  });
});
