import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PDFDocument, StandardFonts } from "@cantoo/pdf-lib";

/** One representative page per section (tools, variants, catalogues) + home and static pages. */
const SAMPLE = [
  "pdf", "merge-pdf", "compress-image", "resize-image/instagram-post", "video-converter", "audio-converter", "metronome/120-bpm",
  "create-zip", "word-counter", "font-generator", "notes", "emoji", "emoji/red-heart", "symbols", "symbols/hearts", "kaomoji",
  "time/almaty", "world-clock", "timer/5-minutes", "stopwatch", "countdown/new-year", "calendar", "age-calculator",
  "percentage-calculator", "finance", "mortgage-calculator", "bmi-calculator", "roman-numerals", "number-to-words",
  "unit-converter", "length-converter", "kilometers-to-miles", "all", "paper-sizes/a4", "actual-size", "random", "spin-the-wheel",
  "color", "color-picker", "css", "box-shadow-generator", "json-formatter", "json-to-csv", "regex", "cron", "base64-encode",
  "hash-generator", "uuid-generator", "jwt-decoder", "http-status", "http-status/404", "mime", "port", "password-generator",
  "qr-code-generator", "iban-validator", "subnet-calculator", "meta-tag-generator", "microphone-test", "keyboard-test",
  "what-is-my-browser", "about/privacy", "scoreboard/basketball", "counter", "draw-lots", "crop-image", "retirement-calculator",
];
const PAGES = ["/ru", "/en", ...SAMPLE.map((p) => `/ru/${p}`), "/en/celsius-to-fahrenheit", "/en/merge-pdf", "/en/emoji"];

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
  await page.goto("/ru/kilometers-to-miles");
  const input = page.getByLabel("Значение", { exact: true });
  await input.fill("10");
  await expect(page.getByLabel("Результат", { exact: true })).toHaveValue("6,213712");
});

/** A small PDF with one form field, made on the fly. */
async function samplePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText("Sample", { x: 60, y: 760, size: 32, font });
  doc.getForm().createTextField("name").addToPage(page, { x: 60, y: 300, width: 200, height: 24 });
  return Buffer.from(await doc.save());
}

// The service worker once answered Web Worker scripts from its cache, which dropped Turbopack's "#params" and left
// every PDF/photo/video worker empty ("Не удалось обработать файл"). Check a PDF tool with the worker in control.
test("PDF tools work under the service worker", async ({ page }) => {
  await page.goto("/ru/fill-pdf-form");
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.locator('input[type="file"]').first().setInputFiles({ name: "form.pdf", mimeType: "application/pdf", buffer: await samplePdf() });
  await expect(page.getByLabel("name")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Не удалось обработать файл")).toHaveCount(0);
});

test("a Select keeps working as a native list", async ({ page }) => {
  await page.goto("/ru/kilometers-to-miles");
  const unit = page.getByLabel("Единица результата");
  await unit.selectOption({ index: 0 });
  await expect(unit).toBeVisible();
});

test("live search finds a page", async ({ page }) => {
  await page.goto("/ru");
  await page.getByRole("combobox").first().fill("мили");
  await expect(page.getByRole("option").first()).toBeVisible();
});

test("unknown pages get the site's 404 page", async ({ page }) => {
  const res = await page.goto("/ru/no-such-tool");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toHaveText("Страница не найдена");
});

const AXE_PAGES = ["/ru", "/ru/merge-pdf", "/ru/word-counter", "/ru/emoji", "/ru/timer/5-minutes", "/ru/percentage-calculator", "/ru/color-picker", "/ru/json-formatter", "/ru/password-generator", "/ru/microphone-test", "/ru/kilometers-to-miles", "/ru/spin-the-wheel", "/ru/compress-image", "/ru/scoreboard", "/ru/retirement-calculator", "/ru/counter"];
for (const path of AXE_PAGES) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

test("legacy URLs redirect permanently", async ({ request }) => {
  for (const [from, to] of [
    ["/ru/tools/merge-pdf", "/ru/merge-pdf"],
    ["/en/tools/percentage-calc", "/en/percentage-calculator"],
    ["/ru/time-now/kz-almaty", "/ru/time/almaty"],
    ["/ru/timer/countdown-5m", "/ru/timer/5-minutes"],
    ["/tools/word-counter", "/ru/word-counter"],
    ["/ru/privacy", "/ru/about/privacy"],
    ["/ru/convert/length", "/ru/length-converter"],
    ["/ru/km-to-miles", "/ru/kilometers-to-miles"],
    ["/merge-pdf", "/ru/merge-pdf"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), from).toBe(301);
    expect(new URL(res.headers()["location"], "http://x").pathname, from).toBe(to);
  }
});

test("unknown pages return 404", async ({ request }) => {
  for (const path of ["/ru/no-such-tool", "/ru/merge-pdf/nope", "/xx/merge-pdf", "/ru/emoji/no-such-emoji"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
