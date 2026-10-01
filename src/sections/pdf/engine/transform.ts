/**
 * Page-level transforms done in place with pdf-lib (text stays text, links and bookmarks stay):
 * mirror, grayscale / inverted colours (a blend-mode overlay), crop and change the paper size.
 * Runs in the worker and in Node unit tests — no DOM.
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, concatTransformationMatrix, degrees, fill, popGraphicsState, pushGraphicsState, rectangle, setFillingGrayscaleColor, setGraphicsState, type PDFDocument, type PDFPage } from "@cantoo/pdf-lib";
import { PAPER, apply, clean, compose, invert, scaleM, translate, type Box, type Matrix, type PaperId } from "./geometry";
import { pageGeometry } from "./pdf-ops";

/** Crop in visual space as fractions of the page: left, top, right, bottom edges (0–1, from the top-left). */
export type FracBox = [number, number, number, number];

export type TransformOp =
  | { kind: "flip"; axis: "h" | "v" }
  | { kind: "gray" }
  | { kind: "invert" }
  /** Margins to cut, in points, as the page is displayed: top, right, bottom, left. `boxes` (auto-crop) win per page. */
  | { kind: "crop"; margins: [number, number, number, number]; boxes?: (FracBox | null)[] }
  | { kind: "resize"; paper: PaperId; orientation: "auto" | "portrait" | "landscape"; margin: number; scale: boolean };

/** Wrap the page's existing content in `q <m> cm … Q`. */
function wrapContent(doc: PDFDocument, page: PDFPage, m: Matrix) {
  page.node.normalize();
  const start = doc.context.register(doc.context.contentStream([pushGraphicsState(), concatTransformationMatrix(...clean(m))]));
  const end = doc.context.register(doc.context.contentStream([popGraphicsState()]));
  page.node.wrapContentStreams(start, end);
}

function setBox(page: PDFPage, b: Box) {
  page.setMediaBox(b.x, b.y, b.width, b.height);
  page.setCropBox(b.x, b.y, b.width, b.height);
  for (const k of ["TrimBox", "BleedBox", "ArtBox"]) page.node.delete(PDFName.of(k));
}

/** Bounding box of a rectangle after a matrix. */
function mapBox(m: Matrix, x0: number, y0: number, x1: number, y1: number): Box {
  const pts = [apply(m, x0, y0), apply(m, x1, y0), apply(m, x0, y1), apply(m, x1, y1)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Move annotation rectangles (links, form fields) along with resized content. */
function mapAnnotations(page: PDFPage, m: Matrix) {
  const annots = page.node.Annots();
  if (!annots) return;
  for (let i = 0; i < annots.size(); i++) {
    const a = annots.lookup(i);
    if (!(a instanceof PDFDict)) continue;
    const rect = a.lookup(PDFName.of("Rect"));
    if (!(rect instanceof PDFArray) || rect.size() !== 4) continue;
    const n = [0, 1, 2, 3].map((k) => rect.lookup(k));
    if (!n.every((v) => v instanceof PDFNumber)) continue;
    const [x0, y0, x1, y1] = n.map((v) => (v as PDFNumber).asNumber());
    const b = mapBox(m, x0, y0, x1, y1);
    a.set(PDFName.of("Rect"), page.doc.context.obj([b.x, b.y, b.x + b.width, b.y + b.height]));
  }
}

/** Target page size (visual) for the resize op. */
export function targetSize(paper: PaperId, orientation: "auto" | "portrait" | "landscape", visual: { width: number; height: number }): { width: number; height: number } {
  const [w, h] = PAPER[paper];
  const landscape = orientation === "landscape" || (orientation === "auto" && visual.width > visual.height);
  return landscape ? { width: h, height: w } : { width: w, height: h };
}

/** Where the old page lands on the new sheet: scale and offset in visual points. */
export function resizePlacement(from: { width: number; height: number }, to: { width: number; height: number }, margin: number, scale: boolean): { s: number; tx: number; ty: number } {
  const aw = Math.max(1, to.width - 2 * margin);
  const ah = Math.max(1, to.height - 2 * margin);
  const s = scale ? Math.min(aw / from.width, ah / from.height) : 1;
  return { s, tx: (to.width - from.width * s) / 2, ty: (to.height - from.height * s) / 2 };
}

/** Visual crop rectangle (origin bottom-left) for margins or a fractional box. */
export function cropRect(W: number, H: number, margins: [number, number, number, number], box?: FracBox | null): Box {
  if (box) {
    const [l, t, r, b] = box;
    return { x: l * W, y: (1 - b) * H, width: Math.max(1, (r - l) * W), height: Math.max(1, (b - t) * H) };
  }
  const [top, right, bottom, left] = margins;
  return { x: left, y: bottom, width: Math.max(1, W - left - right), height: Math.max(1, H - top - bottom) };
}

export function transformPages(doc: PDFDocument, op: TransformOp, indices?: readonly number[]) {
  const pages = doc.getPages();
  const list = indices ?? pages.map((_, i) => i);
  for (const i of list) {
    const page = pages[i];
    if (!page) continue;
    const geo = pageGeometry(page);
    const toVisual = invert(geo.toPage);
    switch (op.kind) {
      case "flip": {
        const v: Matrix = op.axis === "h" ? [-1, 0, 0, 1, geo.width, 0] : [1, 0, 0, -1, 0, geo.height];
        wrapContent(doc, page, compose(compose(toVisual, v), geo.toPage));
        break;
      }
      case "gray":
      case "invert": {
        // A full-page rectangle blended over the content: "Saturation" with a neutral grey removes colour while
        // keeping lightness; "Difference" with white inverts. Text stays selectable.
        const c = geo.crop;
        page.node.normalize(); // the existing content gets its own q … Q, so the overlay starts from a clean state
        // An opaque white sheet under the content: blending needs a backdrop, and renderers that draw pages on a
        // transparent canvas (pdf.js previews, some apps) would otherwise turn the empty background grey or white.
        const under = doc.context.register(doc.context.contentStream([pushGraphicsState(), setFillingGrayscaleColor(1), rectangle(c.x, c.y, c.width, c.height), fill(), popGraphicsState()]));
        page.node.wrapContentStreams(under, doc.context.register(doc.context.contentStream([])));
        const gs = page.node.newExtGState("BM", doc.context.register(doc.context.obj({ Type: "ExtGState", BM: op.kind === "gray" ? "Saturation" : "Difference" })));
        page.pushOperators(pushGraphicsState(), setGraphicsState(gs), op.kind === "gray" ? setFillingGrayscaleColor(0.5) : setFillingGrayscaleColor(1), rectangle(c.x, c.y, c.width, c.height), fill(), popGraphicsState());
        break;
      }
      case "crop": {
        const r = cropRect(geo.width, geo.height, op.margins, op.boxes?.[i]);
        setBox(page, mapBox(geo.toPage, r.x, r.y, r.x + r.width, r.y + r.height));
        break;
      }
      case "resize": {
        const to = targetSize(op.paper, op.orientation, geo);
        const { s, tx, ty } = resizePlacement(geo, to, op.margin, op.scale);
        // Old user space → old visual → scaled and centred on the new sheet, which has no /Rotate.
        const m = compose(compose(toVisual, scaleM(s)), translate(tx, ty));
        wrapContent(doc, page, m);
        mapAnnotations(page, m);
        page.setRotation(degrees(0));
        setBox(page, { x: 0, y: 0, width: to.width, height: to.height });
        break;
      }
    }
  }
}
