import { defineConfig, devices } from "@playwright/test";

/** PW_CHROMIUM points at an already installed Chromium (e.g. /opt/pw-browsers/chromium-1194/chrome-linux/chrome). */
const launchOptions = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3300", launchOptions },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions } },
    // The smallest supported phone (iPhone 4/SE width): nothing may scroll sideways.
    { name: "small", use: { ...devices["Pixel 7"], viewport: { width: 320, height: 568 }, launchOptions }, testMatch: /smoke/, grep: /renders/ },
  ],
  webServer: { command: "npx next start -p 3300", port: 3300, reuseExistingServer: true, timeout: 120_000 },
});
