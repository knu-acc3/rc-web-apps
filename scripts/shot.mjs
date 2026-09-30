// Dev helper: take screenshots of pages.
// Usage: node scripts/shot.mjs <outDir> <baseUrl> <path> [path…]  (env: WIDTH, HEIGHT, DARK=1, FULL=1)
import { chromium } from "@playwright/test";

const [outDir, base, ...paths] = process.argv.slice(2);
const width = Number(process.env.WIDTH || 1280);
const height = Number(process.env.HEIGHT || 900);
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: process.env.DARK ? "dark" : "light", deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()}: console ${m.text()}`));
for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const name = (p.replace(/\//g, "_") || "root") + (process.env.DARK ? "-dark" : "") + `-${width}.png`;
  await page.screenshot({ path: `${outDir}/${name}`, fullPage: !!process.env.FULL });
  console.log("saved", name);
}
if (errors.length) console.log("ERRORS:\n" + errors.join("\n"));
await browser.close();
