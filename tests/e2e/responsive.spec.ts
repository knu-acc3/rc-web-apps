import { expect, test, type Page } from "@playwright/test";
import { useNecessaryConsent as setNecessaryConsent } from "./helpers";

const TOOL_SLUGS = [
  "github-readme",
  "js-beautifier",
  "scientific-calc",
  "pixel-art",
  "markdown-preview",
  "color-picker",
] as const;

const RESPONSIVE_VIEWPORTS = [
  { name: "portrait", width: 390, height: 844 },
  { name: "landscape", width: 844, height: 390 },
] as const;

test.use({ screenshot: "off" });

async function openTool(page: Page, slug: (typeof TOOL_SLUGS)[number]) {
  await setNecessaryConsent(page);

  const response = await page.goto(`/en/tools/${slug}`);
  expect(response?.status(), `${slug} should return HTTP 200`).toBe(200);

  const workspace = page.locator("[data-tool-workspace]");
  await expect(workspace).toBeVisible();
  return workspace;
}

async function expectNoDocumentOverflow(page: Page, label: string) {
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      { message: `${label} should not overflow the document horizontally` },
    )
    .toBeLessThanOrEqual(0);
}

test.describe("responsive tool pages", () => {
  for (const viewport of RESPONSIVE_VIEWPORTS) {
    for (const slug of TOOL_SLUGS) {
      test(`${slug} fits the ${viewport.width}x${viewport.height} ${viewport.name} viewport`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await openTool(page, slug);
        await expectNoDocumentOverflow(page, `${slug} at ${viewport.width}x${viewport.height}`);
      });
    }
  }
});

test.describe("wide desktop tool layouts", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("github-readme tool root is wider than 1200px", async ({ page }) => {
    const workspace = await openTool(page, "github-readme");

    await expect
      .poll(
        () =>
          workspace.evaluate(
            (element) =>
              element.firstElementChild?.getBoundingClientRect().width ?? 0,
          ),
        { message: "github-readme tool root should use the wide desktop workspace" },
      )
      .toBeGreaterThan(1200);
  });

  test("js-beautifier input and result textareas start on the same row", async ({
    page,
  }) => {
    const workspace = await openTool(page, "js-beautifier");
    const textareas = workspace.locator("textarea");

    await expect.poll(() => textareas.count()).toBeGreaterThanOrEqual(2);
    await expect(textareas.nth(0)).toBeVisible();
    await expect(textareas.nth(1)).toBeVisible();

    const [inputTop, resultTop] = await Promise.all([
      textareas.nth(0).evaluate((element) => element.getBoundingClientRect().top),
      textareas.nth(1).evaluate((element) => element.getBoundingClientRect().top),
    ]);

    expect(Math.abs(inputTop - resultTop)).toBeLessThanOrEqual(1);
  });
});
