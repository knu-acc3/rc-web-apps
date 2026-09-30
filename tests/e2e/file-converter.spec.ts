import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import {
  collectRuntimeErrors,
  expectNoRuntimeErrors,
  useNecessaryConsent,
  waitForAppReady,
} from "./helpers";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVR4nGNQSX79H4QZYAwAUcQJxYLTrswAAAAASUVORK5CYII=",
  "base64",
);

function signatureFile(prefix: string, size = 64) {
  const buffer = Buffer.alloc(size);
  buffer.write(prefix, 0, "ascii");
  return buffer;
}

function isoMediaFile(brand: string) {
  const buffer = Buffer.alloc(64);
  buffer.writeUInt32BE(24, 0);
  buffer.write("ftyp", 4, "ascii");
  buffer.write(brand, 8, "ascii");
  return buffer;
}

function shortPcmWav() {
  const sampleRate = 8_000;
  const sampleCount = 800;
  const dataSize = sampleCount * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.round(
      Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 8_000,
    );
    buffer.writeInt16LE(sample, 44 + index * 2);
  }
  return buffer;
}

async function singlePagePdf() {
  const document = await PDFDocument.create();
  document.addPage([96, 96]);
  return Buffer.from(await document.save());
}

async function openConverter(page: Page) {
  const response = await page.goto("/en/tools/file-converter");
  expect(response?.status()).toBe(200);
  await waitForAppReady(page);
  await expect(
    page.getByRole("heading", { level: 1, name: "Universal File Converter" }),
  ).toBeVisible();
  await expect(page.locator('[data-file-converter-ready="true"]')).toBeVisible();
}

test("accepts a mixed queue from file selection and Ctrl+V", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await useNecessaryConsent(page);
  await openConverter(page);

  const input = page.locator('input[type="file"]');
  await expect(input).toHaveAttribute("data-file-paste-raw", "true");
  await expect(input).toHaveAttribute("accept", /\.heic/);
  await expect(input).toHaveAttribute("accept", /\.tiff/);
  await expect(input).toHaveAttribute("accept", /\.dng/);
  await expect(input).toHaveAttribute("accept", /\.wav/);
  await expect(input).toHaveAttribute("accept", /\.mov/);
  await expect(input).toHaveAttribute("accept", /\.pdf/);

  const wav = signatureFile("RIFF");
  wav.write("WAVE", 8, "ascii");
  await input.setInputFiles([
    { name: "photo.png", mimeType: "image/png", buffer: PNG },
    {
      name: "IMG_4821.HEIC",
      mimeType: "image/heic",
      buffer: isoMediaFile("heic"),
    },
    { name: "interview.wav", mimeType: "audio/wav", buffer: wav },
    {
      name: "vacation.mov",
      mimeType: "video/quicktime",
      buffer: isoMediaFile("qt  "),
    },
    {
      name: "scan.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7\n%%EOF", "ascii"),
    },
  ]);

  for (const name of [
    "photo.png",
    "IMG_4821.HEIC",
    "interview.wav",
    "vacation.mov",
    "scan.pdf",
  ]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(page.getByText("5 file(s)")).toBeVisible();
  await expect(
    page.getByLabel("Output format for IMG_4821.HEIC"),
  ).toContainText("JPEG");
  await expect(
    page.getByLabel("Output format for interview.wav"),
  ).toContainText("MP3");
  await expect(
    page.getByLabel("Output format for vacation.mov"),
  ).toContainText("MP4");

  await page.evaluate((pngBytes) => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([Uint8Array.from(pngBytes)], "pasted.png", {
        type: "image/png",
      }),
    );
    document.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: transfer,
      }),
    );
  }, [...PNG]);
  await expect(page.getByText("pasted.png", { exact: true })).toBeVisible();
  await expect(page.getByText("6 file(s)")).toBeVisible();

  await page.getByLabel("Change output format in bulk").click();
  await page.getByRole("option", { name: "Audio → WAV" }).click();
  await expect(
    page.getByLabel("Output format for interview.wav"),
  ).toContainText("WAV");

  expectNoRuntimeErrors(runtimeErrors);
});

test("converts a browser-native image and exposes the result", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const runtimeErrors = collectRuntimeErrors(page);
  await useNecessaryConsent(page);
  await openConverter(page);

  await page.locator('input[type="file"]').setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByText("pixel.png", { exact: true })).toBeVisible();
  await page.getByLabel("Output format for pixel.png").click();
  await page.getByRole("option", { name: "TIFF" }).click();
  await expect(page.getByLabel("Output format for pixel.png")).toContainText(
    "TIFF",
  );
  await page.getByRole("button", { name: "Convert all (1)" }).click();
  await expect(page.getByText("Ready", { exact: true }).last()).toBeVisible({
    timeout: 90_000,
  });
  await expect(
    page.getByRole("button", { name: "Download result" }),
  ).toBeEnabled();

  expectNoRuntimeErrors(runtimeErrors);
});

test("ordinary text paste remains available in text fields", async ({
  page,
}) => {
  await useNecessaryConsent(page);
  await page.goto("/en/tools/base64-encoder");
  await waitForAppReady(page);

  const input = page.getByLabel("UTF-8 text");
  await input.focus();
  const wasPrevented = await input.evaluate((element) => {
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "normal text paste");
    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: transfer,
    });
    element.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(wasPrevented).toBe(false);
});

test("converts audio and PDF locally in a sequential queue", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const runtimeErrors = collectRuntimeErrors(page);
  await useNecessaryConsent(page);
  await openConverter(page);

  await page.locator('input[type="file"]').setInputFiles([
    {
      name: "tone.wav",
      mimeType: "audio/wav",
      buffer: shortPcmWav(),
    },
    {
      name: "page.pdf",
      mimeType: "application/pdf",
      buffer: await singlePagePdf(),
    },
  ]);
  await expect(page.getByText("tone.wav", { exact: true })).toBeVisible();
  await expect(page.getByText("page.pdf", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Output format for tone.wav")).toContainText(
    "MP3",
  );
  await expect(page.getByLabel("Output format for page.pdf")).toContainText(
    "JPEG",
  );

  await page.getByRole("button", { name: "Convert all (2)" }).click();
  await expect(page.getByText("Ready", { exact: true })).toHaveCount(2, {
    timeout: 150_000,
  });
  await expect(page.getByRole("button", { name: "Download ZIP (2)" })).toBeEnabled();

  expectNoRuntimeErrors(runtimeErrors);
});

test("image compression accepts extended formats and estimates JPEG output", async ({
  page,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await useNecessaryConsent(page);
  await page.goto("/en/tools/image-compressor");
  await waitForAppReady(page);
  await expect(page.locator('[data-image-compressor-ready="true"]')).toBeVisible();

  const input = page.locator('input[type="file"]');
  await expect(input).toHaveAttribute("accept", /\.heic/);
  await expect(input).toHaveAttribute("accept", /\.tiff/);
  await expect(input).toHaveAttribute("accept", /\.dng/);
  await input.setInputFiles({
    name: "compress-me.png",
    mimeType: "image/png",
    buffer: PNG,
  });

  await expect(page.getByLabel("Output format")).toContainText("JPEG");
  await expect(page.getByText("Estimated after compression")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByRole("button", { name: "Compress image" })).toBeEnabled();

  expectNoRuntimeErrors(runtimeErrors);
});

test("converter fits a 270px viewport without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 270, height: 800 });
  await useNecessaryConsent(page);
  await openConverter(page);
  await expect(page.getByRole("button", { name: "Add files to converter" })).toBeInViewport();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true);
});
