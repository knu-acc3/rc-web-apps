import { expect, type Page } from "@playwright/test";

const CONSENT_KEY = "ut_analytics_consent";

export async function useNecessaryConsent(page: Page) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, "necessary");
  }, CONSENT_KEY);
}

export async function waitForAppReady(page: Page) {
  await expect(page.locator("html")).toHaveAttribute(
    "data-app-hydrated",
    "true",
  );
}

export function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

export function expectNoRuntimeErrors(errors: string[]) {
  expect(errors, errors.join("\n")).toEqual([]);
}
