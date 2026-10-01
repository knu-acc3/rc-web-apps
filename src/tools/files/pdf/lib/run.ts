/**
 * Executes a Job with pdf-lib. Called by pdf.worker.ts in the browser and
 * directly by unit tests in Node. Browser-only pieces (image decoding and
 * JPEG encoding) are injected through `env`.
 */
import type { PDFDocument } from "@cantoo/pdf-lib";
import { readJpegInfo, readPngInfo, sniffImage } from "./image-info";
import type { ImageInput, Job, JobResult, OutputFile, SourceFile } from "./jobs";
import { drawEdits, transformPages } from "./transform";
import { collectGarbage, optimizeLossless, recompressImages, type Bitmap, type ImageCodec } from "./optimize";
import {
  PdfError,
  addPageNumbers,
  assemble,
  embedTtf,
  fillForm,
  imagesToPdf,
  isEncrypted,
  nup,
  openPdf,
  pageNumberPlan,
  placeImage,
  protect,
  rasterToPdf,
  readForm,
  readInfo,
  rotatePages,
  saveDoc,
  stampImage,
  stampTextWatermark,
  textFont,
  writeInfo,
  type PreparedImage,
} from "./pdf-ops";

interface RunEnv {
  /** Turn any non-JPEG/PNG image (WebP, HEIC, AVIF, GIF, BMP) into an embeddable JPEG/PNG. */
  convertImage?: (bytes: Uint8Array, kind: string) => Promise<PreparedImage>;
  codec?: ImageCodec<Bitmap>;
  isCancelled?: () => boolean;
}

const u8 = (b: ArrayBuffer | Uint8Array) => (b instanceof Uint8Array ? b : new Uint8Array(b));

async function open(src: SourceFile) {
  return openPdf(u8(src.bytes), src.password);
}

/** Save a document that was loaded from a file: drop orphaned objects first. */
async function saveLoaded(doc: PDFDocument, opts?: { updateFieldAppearances?: boolean }) {
  await doc.flush();
  collectGarbage(doc);
  return saveDoc(doc, opts);
}

async function prepareImage(input: ImageInput, env: RunEnv): Promise<PreparedImage> {
  const bytes = u8(input.bytes);
  const kind = sniffImage(bytes);
  if (kind === "jpeg") {
    const info = readJpegInfo(bytes);
    if (info) return { kind: "jpeg", bytes, pxWidth: info.width, pxHeight: info.height, dpiX: info.dpiX, dpiY: info.dpiY, orientation: info.orientation };
  } else if (kind === "png") {
    const info = readPngInfo(bytes);
    if (info) return { kind: "png", bytes, pxWidth: info.width, pxHeight: info.height, dpiX: info.dpiX, dpiY: info.dpiY, orientation: 1 };
  } else if (kind && kind !== "tiff" && env.convertImage) {
    try {
      return await env.convertImage(bytes, kind);
    } catch {
      throw new PdfError("bad-image", input.name);
    }
  }
  throw new PdfError("bad-image", input.name);
}

export async function runJob(job: Job, env: RunEnv = {}, progress: (p: number) => void = () => {}): Promise<JobResult> {
  switch (job.type) {
    case "edit": {
      const doc = await open(job.source);
      const font = await embedTtf(doc, u8(job.font));
      drawEdits(doc, job.items, font);
      return { files: [{ name: "edited.pdf", bytes: await saveLoaded(doc) }] };
    }

    case "transform": {
      const src = await open(job.source);
      if (job.preview !== undefined) {
        const doc = await assemble([src], [{ src: 0, index: job.preview }]);
        const op = job.op.kind === "crop" && job.op.boxes ? { ...job.op, boxes: [job.op.boxes[job.preview] ?? null] } : job.op;
        transformPages(doc, op);
        return { files: [{ name: "preview.pdf", bytes: await saveDoc(doc) }] };
      }
      transformPages(src, job.op, job.pages);
      progress(0.8);
      return { files: [{ name: "transformed.pdf", bytes: await saveLoaded(src) }] };
    }

    case "assemble": {
      const sources: PDFDocument[] = [];
      for (const s of job.sources) sources.push(await open(s));
      const files: OutputFile[] = [];
      for (let i = 0; i < job.outputs.length; i++) {
        if (env.isCancelled?.()) break;
        const o = job.outputs[i];
        const doc = await assemble(sources, o.pages, { infoFrom: job.keepInfo ? sources[0] : undefined });
        files.push({ name: o.name, bytes: await saveDoc(doc) });
        progress((i + 1) / job.outputs.length);
      }
      return { files };
    }

    case "rotate": {
      const doc = await open(job.source);
      rotatePages(doc, job.rotations);
      return { files: [{ name: "rotated.pdf", bytes: await saveLoaded(doc) }] };
    }

    case "compress": {
      const doc = await open(job.source);
      const stats: Record<string, number> = {};
      if (job.mode === "images") {
        if (!env.codec) throw new Error("No image codec");
        const s = await recompressImages(doc, env.codec, { quality: job.quality ?? 0.7, maxSide: job.maxSide ?? 2000 }, (p) => progress(p * 0.8), env.isCancelled);
        Object.assign(stats, s);
      }
      const l = await optimizeLossless(doc, (p) => progress(job.mode === "images" ? 0.8 + p * 0.15 : p * 0.9));
      Object.assign(stats, l);
      return { files: [{ name: "compressed.pdf", bytes: await saveDoc(doc) }], stats };
    }

    case "raster": {
      const doc = await rasterToPdf(job.pages.map((p) => ({ jpeg: u8(p.jpeg), width: p.width, height: p.height })));
      return { files: [{ name: "raster.pdf", bytes: await saveDoc(doc) }] };
    }

    case "images": {
      const prepared: PreparedImage[] = [];
      for (let i = 0; i < job.images.length; i++) {
        if (env.isCancelled?.()) throw new Error("cancelled");
        prepared.push(await prepareImage(job.images[i], env));
        progress((0.6 * (i + 1)) / job.images.length);
      }
      const doc = await imagesToPdf(prepared, job.layout, (p) => progress(0.6 + p * 0.3));
      return { files: [{ name: "images.pdf", bytes: await saveDoc(doc) }] };
    }

    case "watermark": {
      const src = await open(job.source);
      let doc = src;
      let targets = job.pages;
      if (job.preview !== undefined) {
        doc = await assemble([src], [{ src: 0, index: job.preview }]);
        targets = [0];
      }
      const pages = doc.getPages();
      if (job.text && job.text.text.trim()) {
        const font = await textFont(doc, job.text.text, job.font ? u8(job.font) : null);
        for (const i of targets) if (pages[i]) stampTextWatermark(pages[i], font, job.text);
      }
      if (job.image) {
        const b = u8(job.image.bytes);
        const img = sniffImage(b) === "png" ? await doc.embedPng(b) : await doc.embedJpg(b);
        for (const i of targets) if (pages[i]) stampImage(pages[i], img, job.image.stamp);
      }
      return { files: [{ name: "watermarked.pdf", bytes: job.preview !== undefined ? await saveDoc(doc) : await saveLoaded(doc) }] };
    }

    case "page-numbers": {
      const src = await open(job.source);
      const font = job.font ? u8(job.font) : null;
      if (job.preview !== undefined) {
        const plan = pageNumberPlan(src.getPageCount(), job.options);
        const doc = await assemble([src], [{ src: 0, index: job.preview }]);
        await addPageNumbers(doc, job.options, font, [plan[job.preview] ?? null]);
        return { files: [{ name: "preview.pdf", bytes: await saveDoc(doc) }] };
      }
      await addPageNumbers(src, job.options, font);
      return { files: [{ name: "numbered.pdf", bytes: await saveLoaded(src) }] };
    }

    case "nup": {
      const src = await open(job.source);
      const doc = await nup(src, job.options);
      return { files: [{ name: "n-up.pdf", bytes: await saveDoc(doc) }] };
    }

    case "info": {
      const doc = await open(job.source);
      return { files: [], info: readInfo(doc), fields: readForm(doc) };
    }

    case "set-info": {
      const doc = await open(job.source);
      writeInfo(doc, job.meta, { removeXmp: job.removeXmp });
      const bytes = await saveLoaded(doc, { updateFieldAppearances: false });
      const check = await openPdf(bytes, job.source.password);
      return { files: [{ name: "metadata.pdf", bytes }], info: readInfo(check) };
    }

    case "fill-form": {
      const doc = await open(job.source);
      const r = await fillForm(doc, job.values, { flatten: job.flatten, fontBytes: job.font ? u8(job.font) : null });
      return { files: [{ name: "form.pdf", bytes: await saveLoaded(doc, r) }] };
    }

    case "sign": {
      const doc = await open(job.source);
      const img = await doc.embedPng(u8(job.image));
      placeImage(doc, img, job.placements);
      return { files: [{ name: "signed.pdf", bytes: await saveLoaded(doc) }] };
    }

    case "protect": {
      const doc = await open(job.source);
      const count = doc.getPageCount();
      protect(doc, job.options);
      const bytes = await saveLoaded(doc);
      // Verify: the file must be encrypted and open with the user password.
      if (!(await isEncrypted(bytes))) throw new Error("verify: not encrypted");
      const back = await openPdf(bytes, job.options.userPassword);
      if (back.getPageCount() !== count) throw new Error("verify: page count mismatch");
      return { files: [{ name: "protected.pdf", bytes }] };
    }

    case "unlock": {
      if (!(await isEncrypted(u8(job.source.bytes)))) throw new PdfError("not-encrypted");
      const doc = await open(job.source);
      const bytes = await saveLoaded(doc);
      if (await isEncrypted(bytes)) throw new Error("verify: still encrypted");
      return { files: [{ name: "unlocked.pdf", bytes }] };
    }
  }
}
