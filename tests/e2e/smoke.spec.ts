import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** One representative page per section (+ home). Kept in sync with the registry by the unit tests. */
const PAGES = ["/ru", "/en", "/ru/convert", "/ru/convert/length", "/ru/convert/kilometers-to-miles", "/en/convert/celsius-to-fahrenheit", "/ru/about/privacy"];

for (const path of PAGES) {
  test(`renders ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(scrollWidth, "no horizontal scroll").toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test("unit converter computes live", async ({ page }) => {
  await page.goto("/ru/convert/kilometers-to-miles");
  const input = page.getByLabel("Значение");
  await input.fill("10");
  await expect(page.getByLabel("Результат")).toHaveValue("6,213712");
});

test("search palette finds a page", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop shortcut");
  await page.goto("/ru");
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox").fill("мили");
  await expect(page.getByRole("option").first()).toBeVisible();
});

test("home has no critical accessibility violations", async ({ page }) => {
  await page.goto("/ru");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
  expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});
