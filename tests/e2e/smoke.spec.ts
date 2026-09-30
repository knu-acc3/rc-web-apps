import { expect, test } from "@playwright/test";
import {
  collectRuntimeErrors,
  expectNoRuntimeErrors,
  useNecessaryConsent,
  waitForAppReady,
} from "./helpers";

test("random-name generates a visible synthetic result", async ({ page }) => {
  await useNecessaryConsent(page);
  const runtimeErrors = collectRuntimeErrors(page);

  const response = await page.goto("/ru/tools/random-name");
  expect(response?.status()).toBe(200);
  await waitForAppReady(page);
  await expect(
    page.locator('[data-tool-hydrated="random-name"]'),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Случайные имена" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Создать синтетическое имя" })
    .click();
  const result = page.getByRole("status");
  await expect(result).toContainText("Готовый результат");
  await expect(result).not.toContainText("Созданное имя появится здесь");
  await expect(result).toContainText(/\p{L}{2,}\s+\p{L}{2,}/u);

  expectNoRuntimeErrors(runtimeErrors);
});

test("keyboard search opens a tool route", async ({ page }) => {
  await useNecessaryConsent(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto("/en");
  await waitForAppReady(page);
  await expect(
    page
      .getByRole("banner")
      .getByRole("button", { name: "Search tools..." }),
  ).toBeVisible();
  await expect(
    page.locator('[data-search-shortcut-ready="true"]'),
  ).toHaveCount(1);
  await page.keyboard.press("/");
  const search = page.getByRole("combobox", { name: "Search tools" });
  await expect(search).toBeFocused();
  await search.fill("json formatter");
  await expect(
    page.getByRole("option").filter({ hasText: "JSON Formatter" }),
  ).toBeVisible();
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    /json-formatter/,
  );
  await search.press("Enter");
  await expect(page).toHaveURL(/\/en\/tools\/json-formatter$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  expectNoRuntimeErrors(runtimeErrors);
});

test("mobile shell keeps the primary tool action usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await useNecessaryConsent(page);
  const runtimeErrors = collectRuntimeErrors(page);

  await page.goto("/ru/tools/random-name");
  await waitForAppReady(page);
  await expect(
    page.locator('[data-tool-hydrated="random-name"]'),
  ).toBeVisible();
  const action = page.getByRole("button", {
    name: "Создать синтетическое имя",
  });
  await expect(action).toBeVisible();
  await expect(action).toBeInViewport();
  await expect(page.getByRole("button", { name: "Меню" })).toBeVisible();

  expectNoRuntimeErrors(runtimeErrors);
});

test("necessary-only consent persists without analytics scripts", async ({
  page,
}) => {
  await page.goto("/en");
  await waitForAppReady(page);
  await expect(
    page.getByRole("dialog", { name: "Analytics" }),
  ).toBeVisible();
  await expect(
    page.locator(
      'script[src*="mc.yandex"], script[src*="/_vercel/insights"]',
    ),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Necessary only" }).click();
  await expect(page.getByRole("dialog", { name: "Analytics" })).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("ut_analytics_consent")),
    )
    .toBe("necessary");
  await expect(
    page.locator(
      'script[src*="mc.yandex"], script[src*="/_vercel/insights"]',
    ),
  ).toHaveCount(0);
});

test("a previously opened tool remains available offline", async ({
  context,
  page,
}) => {
  await useNecessaryConsent(page);
  await page.goto("/en/tools/random-name");
  await waitForAppReady(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => resolve(),
        { once: true },
      );
    });
  });

  // The controlled online reload lets the worker cache both the document and
  // its versioned Next.js assets before the network disappears.
  await page.reload();
  await waitForAppReady(page);
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Random names" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate synthetic name" }),
    ).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
