/**
 * All pdf-lib document operations of the PDF section. Runs in a Web Worker in
 * the browser (see pdf.worker.ts) and in Node in unit tests — no DOM here.
 */
import {
  PDFArray,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFDropdown,
  PDFName,
  PDFOptionList,
  PDFRadioGroup,
  PDFSignature,
  PDFTextField,
  PDFButton,
  StandardFonts,
  concatTransformationMatrix,
  degrees,
  drawObject,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  setGraphicsState,
  setLineWidth,
  setStrokingGrayscaleColor,
  stroke,
  type PDFFont,
  type PDFPage,
} from "@cantoo/pdf-lib";
import { copyPagesInto, duplicatePage } from "./copy";
import {
  PAPER,
  anchorPosition,
  clean,
  fitInto,
  imageLayout,
  imageMatrix,
  normRotation,
  nupCells,
  nupGrid,
  placePageMatrix,
  visualSize,
  visualToPage,
  type Anchor,
  type Box,
  type ImageLayoutInput,
  type Matrix,
  type PaperId,
} from "./geometry";

/* ───────────── errors ───────────── */

export type PdfErrorCode = "password-required" | "password-incorrect" | "encryption-unsupported" | "invalid-pdf" | "font-required" | "no-pages" | "no-form" | "not-encrypted" | "bad-image";

export class PdfError extends Error {
  constructor(
    public code: PdfErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "PdfError";
  }
}

/* ───────────── open / save ───────────── */

/**
 * Open a PDF. Encrypted files need their password; files protected only by
 * an owner password (restrictions without an open password) open with "".
 */
export async function openPdf(bytes: Uint8Array | ArrayBuffer, password?: string): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(bytes, { password: password ?? "", updateMetadata: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/password/i.test(msg)) throw new PdfError(password ? "password-incorrect" : "password-required");
    if (/encryption (method|algorithm)|unsupported encryption/i.test(msg)) throw new PdfError("encryption-unsupported");
    throw new PdfError("invalid-pdf", msg);
  }
}

export async function saveDoc(doc: PDFDocument, opts: { updateFieldAppearances?: boolean } = {}): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: opts.updateFieldAppearances ?? true });
}

/* ───────────── page geometry ───────────── */

export interface PageGeometry {
  /** Visible area (CropBox clipped to MediaBox) in user space. */
  crop: Box;
  rotate: 0 | 90 | 180 | 270;
  /** Size as displayed (after /Rotate). */
  width: number;
  height: number;
  /** Maps visual coordinates to user space. */
  toPage: Matrix;
}

export function pageGeometry(page: PDFPage): PageGeometry {
  const m = page.getMediaBox();
  const c = page.getCropBox();
  const x0 = Math.max(m.x, c.x);
  const y0 = Math.max(m.y, c.y);
  const x1 = Math.min(m.x + m.width, c.x + c.width);
  const y1 = Math.min(m.y + m.height, c.y + c.height);
  const crop = x1 > x0 && y1 > y0 ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : { x: m.x, y: m.y, width: m.width, height: m.height };
  const rotate = normRotation(page.getRotation().angle);
  const vs = visualSize(crop, rotate);
  return { crop, rotate, width: vs.width, height: vs.height, toPage: clean(visualToPage(crop, rotate)) };
}

/** Run drawing callbacks in visual coordinates (respects /Rotate and CropBox). */
export function inVisualSpace(page: PDFPage, geo: PageGeometry, draw: () => void) {
  page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...geo.toPage));
  draw();
  page.pushOperators(popGraphicsState());
}

function opacityState(page: PDFPage, opacity: number) {
  const gs = page.doc.context.obj({ Type: "ExtGState", ca: opacity, CA: opacity });
  return page.node.newExtGState("GS", page.doc.context.register(gs));
}

/* ───────────── assemble: merge / split / extract / organize ───────────── */

export interface PageRef {
  /** Index of the source document. */
  src: number;
  /** 0-based page index in that source. */
  index: number;
  /** Extra clockwise rotation in degrees (multiple of 90). */
  rotate?: number;
}

const INFO_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"];

/** Build a new document from pages of one or more sources, in the given order. */
export async function assemble(sources: PDFDocument[], pages: readonly PageRef[], opts: { infoFrom?: PDFDocument } = {}): Promise<PDFDocument> {
  if (!pages.length) throw new PdfError("no-pages");
  const out = await PDFDocument.create({ updateMetadata: false });
  const bySrc = new Map<number, number[]>();
  for (const p of pages) {
    const list = bySrc.get(p.src) ?? [];
    list.push(p.index);
    bySrc.set(p.src, list);
  }
  // Copy each source once (shared fonts/images stay shared), then place pages in order.
  const copied = new Map<number, Map<number, import("@cantoo/pdf-lib").PDFPage[]>>();
  for (const [src, indices] of bySrc) {
    const list = await copyPagesInto(out, sources[src], indices);
    const byIndex = new Map<number, import("@cantoo/pdf-lib").PDFPage[]>();
    indices.forEach((idx, k) => {
      const arr = byIndex.get(idx) ?? [];
      arr.push(list[k]);
      byIndex.set(idx, arr);
    });
    copied.set(src, byIndex);
  }
  for (const p of pages) {
    const page = copied.get(p.src)!.get(p.index)!.shift()!;
    out.addPage(page);
    if (p.rotate) page.setRotation(degrees(normRotation(page.getRotation().angle + p.rotate)));
  }
  if (opts.infoFrom) copyInfo(opts.infoFrom, out);
  return out;
}

function copyInfo(from: PDFDocument, to: PDFDocument) {
  const src = from.context.lookup(from.context.trailerInfo.Info);
  if (!(src instanceof PDFDict)) return;
  const dst = to.context.obj({});
  for (const k of INFO_KEYS) {
    const v = src.lookup(PDFName.of(k));
    if (v) dst.set(PDFName.of(k), v.clone(to.context));
  }
  to.context.trailerInfo.Info = to.context.register(dst);
  const lang = from.catalog.lookup(PDFName.of("Lang"));
  if (lang) to.catalog.set(PDFName.of("Lang"), lang.clone(to.context));
}

/** Rotate pages in place (keeps bookmarks, links, forms and metadata). */
export function rotatePages(doc: PDFDocument, rotations: readonly { index: number; delta: number }[]) {
  const pages = doc.getPages();
  for (const { index, delta } of rotations) {
    const page = pages[index];
    if (!page) continue;
    page.setRotation(degrees(normRotation(page.getRotation().angle + delta)));
  }
}

export { duplicatePage };

/* ───────────── fonts ───────────── */

/** Characters Helvetica (WinAnsi) can draw; anything else needs an embedded font. */
const WIN_ANSI = /^[\x20-\x7e -ÿ–—‘’‚“”„†‡•…‰‹›€™ŒœŠšŸŽžƒˆ˜]*$/;
export const isWinAnsi = (text: string) => WIN_ANSI.test(text);

type Fontkit = Parameters<PDFDocument["registerFontkit"]>[0];
let fontkitPromise: Promise<Fontkit> | null = null;

/**
 * @pdf-lib/fontkit wrapped for @cantoo/pdf-lib: the fork calls `subset.encode()`
 * with no arguments whenever it exists, but @pdf-lib/fontkit's `encode(stream)`
 * needs a stream (and crashes). Exposing only `encodeStream()` makes the fork
 * take its stream path, which subsets correctly.
 */
function loadFontkit(): Promise<Fontkit> {
  fontkitPromise ??= import("@pdf-lib/fontkit").then(({ default: fk }) => {
    type AnyFont = { createSubset: () => { includeGlyph: (g: unknown) => number; encodeStream: () => unknown; cff?: unknown } };
    return {
      create(buf: Uint8Array, name?: string) {
        const font = fk.create(buf, name) as unknown as AnyFont;
        const create = font.createSubset.bind(font);
        font.createSubset = () => {
          const subset = create();
          return { includeGlyph: (g: unknown) => subset.includeGlyph(g), encodeStream: () => subset.encodeStream(), cff: subset.cff };
        };
        return font;
      },
    } as unknown as Fontkit;
  });
  return fontkitPromise;
}

/** Embed a TrueType font (subset) — e.g. Noto Sans, so the PDF matches what the editor showed. */
export async function embedTtf(doc: PDFDocument, fontBytes: Uint8Array | ArrayBuffer): Promise<PDFFont> {
  doc.registerFontkit(await loadFontkit());
  return doc.embedFont(fontBytes, { subset: true });
}

export async function textFont(doc: PDFDocument, text: string, fontBytes?: Uint8Array | ArrayBuffer | null): Promise<PDFFont> {
  if (isWinAnsi(text)) return doc.embedFont(StandardFonts.Helvetica);
  if (!fontBytes) throw new PdfError("font-required");
  doc.registerFontkit(await loadFontkit());
  return doc.embedFont(fontBytes, { subset: true });
}

/* ───────────── text stamps: watermark & page numbers ───────────── */

export type RGB = [number, number, number];

export interface TextStampStyle {
  size: number;
  color: RGB;
  opacity: number;
  /** Counter-clockwise rotation in degrees, as seen on the page. */
  angle: number;
}

/** Share of the font size used as cap height when centring text. */
const CAP = 0.7;

function rotatedBox(w: number, h: number, angle: number) {
  const r = (angle * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { w: w * c + h * s, h: w * s + h * c };
}

/** Draw text centred at (cx, cy) in the current (visual) coordinate system. */
function drawCentered(page: PDFPage, font: PDFFont, text: string, cx: number, cy: number, st: TextStampStyle) {
  const w = font.widthOfTextAtSize(text, st.size);
  const h = st.size * CAP;
  const r = (st.angle * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const x = cx - (w / 2) * cos + (h / 2) * sin;
  const y = cy - (w / 2) * sin - (h / 2) * cos;
  page.drawText(text, { x, y, size: st.size, font, color: rgb(...st.color), rotate: degrees(st.angle) });
}

export interface TextWatermark extends TextStampStyle {
  text: string;
  position: Anchor;
  /** Distance from the page edge for non-centred positions (points). */
  margin: number;
  /** Repeat over the whole page. */
  tile: boolean;
  /** Extra space between tiles as a share of the text box (0.5 = 50%). */
  tileGap?: number;
}

export function stampTextWatermark(page: PDFPage, font: PDFFont, wm: TextWatermark) {
  const text = wm.text.replace(/\s+/g, " ").trim();
  if (!text) return;
  const geo = pageGeometry(page);
  const w = font.widthOfTextAtSize(text, wm.size);
  const box = rotatedBox(w, wm.size * CAP, wm.angle);
  inVisualSpace(page, geo, () => {
    if (wm.opacity < 1) page.pushOperators(setGraphicsState(opacityState(page, wm.opacity)));
    if (wm.tile) {
      const gap = wm.tileGap ?? 0.6;
      const stepX = box.w * (1 + gap);
      const stepY = Math.max(box.h * (1 + gap), wm.size * 2);
      const cols = Math.ceil(geo.width / stepX) + 1;
      const rows = Math.ceil(geo.height / stepY) + 1;
      const ox = (geo.width - (cols - 1) * stepX) / 2;
      const oy = (geo.height - (rows - 1) * stepY) / 2;
      for (let r = 0; r < rows; r++) {
        // Stagger every other row so tiles don't form rigid columns.
        const shift = r % 2 ? stepX / 2 : 0;
        for (let c = -1; c < cols; c++) drawCentered(page, font, text, ox + c * stepX + shift, oy + r * stepY, wm);
      }
    } else {
      const p = anchorPosition(wm.position, geo.width, geo.height, box.w, box.h, wm.margin);
      drawCentered(page, font, text, p.x + box.w / 2, p.y + box.h / 2, wm);
    }
  });
}

export interface ImageStamp {
  /** Width as a share of the visual page width (0–1). */
  widthRatio: number;
  opacity: number;
  angle: number;
  position: Anchor;
  margin: number;
  tile: boolean;
}

export function stampImage(page: PDFPage, image: import("@cantoo/pdf-lib").PDFImage, st: ImageStamp) {
  const geo = pageGeometry(page);
  const w = Math.max(1, geo.width * st.widthRatio);
  const h = (w * image.height) / image.width;
  const box = rotatedBox(w, h, st.angle);
  const draw = (cx: number, cy: number) => {
    const r = (st.angle * Math.PI) / 180;
    const x = cx - (w / 2) * Math.cos(r) + (h / 2) * Math.sin(r);
    const y = cy - (w / 2) * Math.sin(r) - (h / 2) * Math.cos(r);
    page.drawImage(image, { x, y, width: w, height: h, rotate: degrees(st.angle) });
  };
  inVisualSpace(page, geo, () => {
    if (st.opacity < 1) page.pushOperators(setGraphicsState(opacityState(page, st.opacity)));
    if (st.tile) {
      const stepX = box.w * 1.5;
      const stepY = box.h * 1.5;
      const cols = Math.ceil(geo.width / stepX) + 1;
      const rows = Math.ceil(geo.height / stepY) + 1;
      const ox = (geo.width - (cols - 1) * stepX) / 2;
      const oy = (geo.height - (rows - 1) * stepY) / 2;
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) draw(ox + c * stepX, oy + rr * stepY);
    } else {
      const p = anchorPosition(st.position, geo.width, geo.height, box.w, box.h, st.margin);
      draw(p.x + box.w / 2, p.y + box.h / 2);
    }
  });
}

/* ───────────── page numbers ───────────── */

import { pageNumberPlan, type NumberFormat } from "./labels";
export { pageLabel, pageNumberPlan, type NumberFormat } from "./labels";

export interface PageNumberOptions {
  position: Anchor;
  format: NumberFormat;
  locale: "ru" | "en";
  /** Number printed on the first numbered page. */
  start: number;
  /** Leave the first page without a number (it still counts if start is adjusted). */
  skipFirst: boolean;
  size: number;
  /** Distance from the page edge, points. */
  margin: number;
  color: RGB;
}

/**
 * Stamp page numbers. `labels` overrides the plan (used by the one-page
 * preview, which must show the label of that page within the whole file).
 */
export async function addPageNumbers(doc: PDFDocument, o: PageNumberOptions, fontBytes?: Uint8Array | ArrayBuffer | null, labels?: (string | null)[]) {
  const pages = doc.getPages();
  const plan = labels ?? pageNumberPlan(pages.length, o);
  const text = plan.filter(Boolean).join(" ");
  if (!text) return;
  const font = await textFont(doc, text, fontBytes);
  pages.forEach((page, i) => {
    const label = plan[i];
    if (!label) return;
    stampTextWatermark(page, font, { text: label, size: o.size, color: o.color, opacity: 1, angle: 0, position: o.position, margin: o.margin, tile: false });
  });
}

/* ───────────── n-up ───────────── */

export interface NupOptions {
  n: number;
  sheet: PaperId | "source";
  orientation: "auto" | "portrait" | "landscape";
  /** Points. */
  margin: number;
  gap: number;
  order: "rows" | "columns";
  border: boolean;
}

export async function nup(src: PDFDocument, o: NupOptions): Promise<PDFDocument> {
  const pages = src.getPages();
  if (!pages.length) throw new PdfError("no-pages");
  const out = await PDFDocument.create({ updateMetadata: false });
  const geos = pages.map(pageGeometry);
  // Blank pages (no content stream) can't be embedded — they just stay empty cells.
  const drawable = pages.map((p, i) => (p.node.Contents() ? i : -1)).filter((i) => i >= 0);
  const embeddedList = await out.embedPages(
    drawable.map((i) => pages[i]),
    drawable.map((i) => {
      const c = geos[i].crop;
      return { left: c.x, bottom: c.y, right: c.x + c.width, top: c.y + c.height };
    }),
  );
  const embedded = new Map(drawable.map((i, k) => [i, embeddedList[k]]));
  const ref = geos[0];
  const sheet: readonly [number, number] = o.sheet === "source" ? [ref.width, ref.height] : PAPER[o.sheet];
  const grid = nupGrid({ n: o.n, sheet, orientation: o.orientation, page: { width: ref.width, height: ref.height }, margin: o.margin, gap: o.gap });
  const cells = nupCells(grid, o.margin, o.gap, o.order);
  for (let start = 0; start < pages.length; start += o.n) {
    const sheetPage = out.addPage([grid.sheetWidth, grid.sheetHeight]);
    for (let k = 0; k < o.n && start + k < pages.length; k++) {
      const i = start + k;
      const g = geos[i];
      const fit = fitInto(cells[k], g.width, g.height);
      const e = embedded.get(i);
      if (e) {
        const m = clean(placePageMatrix(g.crop.width, g.crop.height, g.rotate, fit.x, fit.y, fit.scale));
        const name = sheetPage.node.newXObject("EmbeddedPdfPage", e.ref);
        sheetPage.pushOperators(pushGraphicsState(), concatTransformationMatrix(...m), drawObject(name), popGraphicsState());
      }
      if (o.border) {
        sheetPage.pushOperators(
          pushGraphicsState(),
          setLineWidth(0.5),
          setStrokingGrayscaleColor(0.6),
          rectangle(fit.x, fit.y, g.width * fit.scale, g.height * fit.scale),
          stroke(),
          popGraphicsState(),
        );
      }
    }
  }
  return out;
}

/* ───────────── images → PDF ───────────── */

export interface PreparedImage {
  kind: "jpeg" | "png";
  bytes: Uint8Array;
  pxWidth: number;
  pxHeight: number;
  dpiX: number | null;
  dpiY: number | null;
  /** EXIF orientation to apply (1 when the pixels are already upright). */
  orientation: number;
}

export type ImagesLayout = Pick<ImageLayoutInput, "page" | "pageOrientation" | "margin" | "scaleMode">;

export async function imagesToPdf(images: readonly PreparedImage[], layout: ImagesLayout, onProgress?: (p: number) => void): Promise<PDFDocument> {
  if (!images.length) throw new PdfError("no-pages");
  const doc = await PDFDocument.create({ updateMetadata: false });
  for (let i = 0; i < images.length; i++) {
    const im = images[i];
    const embedded = im.kind === "jpeg" ? await doc.embedJpg(im.bytes) : await doc.embedPng(im.bytes);
    const l = imageLayout({ ...layout, pxWidth: im.pxWidth, pxHeight: im.pxHeight, dpiX: im.dpiX, dpiY: im.dpiY, orientation: im.orientation });
    const page = doc.addPage([l.pageWidth, l.pageHeight]);
    const name = page.node.newXObject("Image", embedded.ref);
    const m = clean(imageMatrix(im.orientation, l.x, l.y, l.width, l.height));
    page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...m), drawObject(name), popGraphicsState());
    onProgress?.((i + 1) / images.length);
  }
  return doc;
}

/** Pages rendered to JPEG → a PDF with the same page sizes (lossy "flatten to images"). */
export async function rasterToPdf(pages: readonly { jpeg: Uint8Array; width: number; height: number }[]): Promise<PDFDocument> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  for (const p of pages) {
    const img = await doc.embedJpg(p.jpeg);
    const page = doc.addPage([p.width, p.height]);
    page.drawImage(img, { x: 0, y: 0, width: p.width, height: p.height });
  }
  return doc;
}

/* ───────────── signature ───────────── */

export interface Placement {
  /** 0-based page index. */
  page: number;
  /** Box relative to the page as displayed, 0–1, origin at the TOP-left (screen coordinates). */
  x: number;
  y: number;
  width: number;
  height: number;
}

export function placeImage(doc: PDFDocument, image: import("@cantoo/pdf-lib").PDFImage, placements: readonly Placement[]) {
  const pages = doc.getPages();
  for (const pl of placements) {
    const page = pages[pl.page];
    if (!page) continue;
    const geo = pageGeometry(page);
    const w = pl.width * geo.width;
    const h = pl.height * geo.height;
    const x = pl.x * geo.width;
    const y = geo.height - (pl.y + pl.height) * geo.height;
    inVisualSpace(page, geo, () => page.drawImage(image, { x, y, width: w, height: h }));
  }
}

/* ───────────── metadata ───────────── */

export interface MetaFields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  /** ISO strings or "" */
  created: string;
  modified: string;
}

export interface DocInfo extends MetaFields {
  pageCount: number;
  version: string;
  hasXmp: boolean;
  hasForm: boolean;
  firstPage?: { width: number; height: number };
}

const iso = (d: Date | undefined) => (d && !Number.isNaN(d.getTime()) ? d.toISOString() : "");

export function readInfo(doc: PDFDocument): DocInfo {
  const safe = <T>(fn: () => T | undefined): T | undefined => {
    try {
      return fn();
    } catch {
      return undefined;
    }
  };
  const pages = doc.getPages();
  const g = pages[0] ? pageGeometry(pages[0]) : null;
  const acro = doc.catalog.lookup(PDFName.of("AcroForm"));
  const fields = acro instanceof PDFDict ? acro.lookup(PDFName.of("Fields")) : undefined;
  return {
    title: safe(() => doc.getTitle()) ?? "",
    author: safe(() => doc.getAuthor()) ?? "",
    subject: safe(() => doc.getSubject()) ?? "",
    keywords: safe(() => doc.getKeywords()) ?? "",
    creator: safe(() => doc.getCreator()) ?? "",
    producer: safe(() => doc.getProducer()) ?? "",
    created: iso(safe(() => doc.getCreationDate())),
    modified: iso(safe(() => doc.getModificationDate())),
    pageCount: pages.length,
    version: doc.context.header.getVersionString(),
    hasXmp: !!doc.catalog.get(PDFName.of("Metadata")),
    hasForm: fields instanceof PDFArray && fields.size() > 0,
    firstPage: g ? { width: g.width, height: g.height } : undefined,
  };
}

export function writeInfo(doc: PDFDocument, meta: MetaFields, opts: { removeXmp: boolean }) {
  let info = doc.context.lookup(doc.context.trailerInfo.Info);
  if (!(info instanceof PDFDict)) {
    info = doc.context.obj({});
    doc.context.trailerInfo.Info = doc.context.register(info);
  }
  const dict = info as PDFDict;
  const setText = (key: string, value: string, set: (v: string) => void) => {
    if (value.trim()) set(value.trim());
    else dict.delete(PDFName.of(key));
  };
  setText("Title", meta.title, (v) => doc.setTitle(v));
  setText("Author", meta.author, (v) => doc.setAuthor(v));
  setText("Subject", meta.subject, (v) => doc.setSubject(v));
  setText("Keywords", meta.keywords, (v) => doc.setKeywords([v]));
  setText("Creator", meta.creator, (v) => doc.setCreator(v));
  setText("Producer", meta.producer, (v) => doc.setProducer(v));
  const setDate = (key: string, value: string, set: (d: Date) => void) => {
    const d = value ? new Date(value) : null;
    if (d && !Number.isNaN(d.getTime())) set(d);
    else dict.delete(PDFName.of(key));
  };
  setDate("CreationDate", meta.created, (d) => doc.setCreationDate(d));
  setDate("ModDate", meta.modified, (d) => doc.setModificationDate(d));
  if (opts.removeXmp) doc.catalog.delete(PDFName.of("Metadata"));
}

/* ───────────── forms ───────────── */

export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "optionlist" | "button" | "signature" | "unknown";
  value: string | boolean | string[];
  options?: string[];
  multiline?: boolean;
  multiSelect?: boolean;
  readOnly: boolean;
  maxLength?: number;
}

export function readForm(doc: PDFDocument): FormFieldInfo[] {
  const acro = doc.catalog.lookup(PDFName.of("AcroForm"));
  if (!(acro instanceof PDFDict)) return [];
  const form = doc.getForm();
  const out: FormFieldInfo[] = [];
  for (const f of form.getFields()) {
    const base = { name: f.getName(), readOnly: f.isReadOnly() };
    try {
      if (f instanceof PDFTextField) {
        out.push({ ...base, type: "text", value: f.getText() ?? "", multiline: f.isMultiline(), maxLength: f.getMaxLength() });
      } else if (f instanceof PDFCheckBox) {
        out.push({ ...base, type: "checkbox", value: f.isChecked() });
      } else if (f instanceof PDFRadioGroup) {
        out.push({ ...base, type: "radio", value: f.getSelected() ?? "", options: f.getOptions() });
      } else if (f instanceof PDFDropdown) {
        out.push({ ...base, type: "dropdown", value: f.getSelected()[0] ?? "", options: f.getOptions() });
      } else if (f instanceof PDFOptionList) {
        out.push({ ...base, type: "optionlist", value: f.getSelected(), options: f.getOptions(), multiSelect: f.isMultiselect() });
      } else if (f instanceof PDFButton) {
        out.push({ ...base, type: "button", value: "" });
      } else if (f instanceof PDFSignature) {
        out.push({ ...base, type: "signature", value: "" });
      } else {
        out.push({ ...base, type: "unknown", value: "" });
      }
    } catch {
      out.push({ ...base, type: "unknown", value: "" });
    }
  }
  return out;
}

export async function fillForm(
  doc: PDFDocument,
  values: Record<string, string | boolean | string[]>,
  opts: { flatten: boolean; fontBytes?: Uint8Array | ArrayBuffer | null },
): Promise<{ updateFieldAppearances: boolean }> {
  const form = doc.getForm();
  const texts: string[] = [];
  for (const f of form.getFields()) {
    const name = f.getName();
    if (!(name in values) || f.isReadOnly()) continue;
    const v = values[name];
    if (f instanceof PDFTextField && typeof v === "string") {
      const max = f.getMaxLength();
      f.setText(max !== undefined ? v.slice(0, max) : v);
      texts.push(v);
    } else if (f instanceof PDFCheckBox && typeof v === "boolean") {
      if (v) f.check();
      else f.uncheck();
    } else if (f instanceof PDFRadioGroup && typeof v === "string") {
      if (v) f.select(v);
      else f.clear();
      texts.push(v);
    } else if (f instanceof PDFDropdown && typeof v === "string") {
      if (v) f.select(v);
      else f.clear();
      texts.push(v);
    } else if (f instanceof PDFOptionList && Array.isArray(v)) {
      if (v.length) f.select(v);
      else f.clear();
      texts.push(...v);
    }
  }
  const all = texts.join(" ");
  if (!isWinAnsi(all)) {
    const font = await textFont(doc, all, opts.fontBytes);
    form.updateFieldAppearances(font);
    if (opts.flatten) form.flatten({ updateFieldAppearances: false });
    return { updateFieldAppearances: false };
  }
  if (opts.flatten) form.flatten();
  return { updateFieldAppearances: true };
}

/* ───────────── protection ───────────── */

export interface ProtectOptions {
  userPassword: string;
  ownerPassword: string;
  allowPrinting: boolean;
  allowCopying: boolean;
  allowModifying: boolean;
  allowAnnotating: boolean;
}

export function protect(doc: PDFDocument, o: ProtectOptions) {
  doc.encrypt({
    userPassword: o.userPassword,
    ownerPassword: o.ownerPassword,
    algorithm: "AES-256",
    permissions: {
      printing: o.allowPrinting ? "highResolution" : false,
      copying: o.allowCopying,
      contentAccessibility: true,
      modifying: o.allowModifying,
      documentAssembly: o.allowModifying,
      annotating: o.allowAnnotating,
      fillingForms: o.allowAnnotating || o.allowModifying,
    },
  });
}

/** True if the bytes carry an /Encrypt dictionary. */
export async function isEncrypted(bytes: Uint8Array): Promise<boolean> {
  const d = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  return d.isEncrypted;
}

