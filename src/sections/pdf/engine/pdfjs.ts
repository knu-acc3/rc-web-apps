/**
 * pdf.js on the main thread: lazy loading, one shared (bundled) worker,
 * self-hosted CMaps/fonts/wasm, password handling, page rendering and a
 * cancellable thumbnail queue. Never import this module at the top level of a
 * tool component that renders on the server — call its functions from effects
 * or handlers only.
 */
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";

type PdfjsLib = typeof import("pdfjs-dist");

const ASSETS = "/vendor/pdf/";
let libPromise: Promise<PdfjsLib> | null = null;
let worker: Worker | null = null;
let users = 0;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

async function lib(): Promise<PdfjsLib> {
  libPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs") as unknown as Promise<PdfjsLib>;
  const pdfjs = await libPromise;
  if (!worker) {
    worker = new Worker(new URL("./pdfjs.worker.ts", import.meta.url), { type: "module" });
    pdfjs.GlobalWorkerOptions.workerPort = worker;
  }
  return pdfjs;
}

/** Components that use pdf.js call acquire on mount and release on unmount; the worker stops when nobody needs it. */
export function acquirePdfjs(): void {
  users++;
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
}

export function releasePdfjs(): void {
  users = Math.max(0, users - 1);
  if (users || !worker) return;
  // Give pending document.destroy() calls a moment to reach the worker.
  stopTimer = setTimeout(() => {
    stopTimer = null;
    if (users || !worker) return;
    worker.terminate();
    worker = null;
    libPromise?.then((p) => {
      p.GlobalWorkerOptions.workerPort = null;
    });
  }, 1000);
}

/** @public — read through a dynamic import() in use-pdf-files.ts */
export class PasswordNeeded extends Error {
  constructor(public incorrect: boolean) {
    super(incorrect ? "incorrect-password" : "password-required");
    this.name = "PasswordNeeded";
  }
}

/** Open a PDF for rendering/reading. The caller's buffer is not detached. */
export async function openDocument(bytes: ArrayBuffer, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await lib();
  const task = pdfjs.getDocument({
    data: new Uint8Array(bytes.slice(0)),
    password,
    cMapUrl: `${ASSETS}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${ASSETS}standard_fonts/`,
    wasmUrl: `${ASSETS}wasm/`,
    iccUrl: `${ASSETS}iccs/`,
    enableXfa: false,
  });
  try {
    return await task.promise;
  } catch (e) {
    const err = e as { name?: string; code?: number };
    if (err?.name === "PasswordException") {
      void task.destroy();
      throw new PasswordNeeded(err.code === pdfjs.PasswordResponses.INCORRECT_PASSWORD);
    }
    void task.destroy();
    throw e;
  }
}

interface RenderOptions {
  /** Extra clockwise rotation on top of the page's own /Rotate. */
  rotate?: number;
  /** Fill colour behind the page (default white). */
  background?: string;
  onTask?: (task: RenderTask | null) => void;
}

/** Render a page to a new canvas at the given scale (1 = 72 DPI). Call `releaseCanvas` when done. */
export async function renderPage(page: PDFPageProxy, scale: number, opts: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale, rotation: (((page.rotate + (opts.rotate ?? 0)) % 360) + 360) % 360 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const task = page.render({ canvas, viewport, background: opts.background ?? "#ffffff" });
  opts.onTask?.(task);
  try {
    await task.promise;
  } catch (e) {
    releaseCanvas(canvas);
    throw e;
  } finally {
    opts.onTask?.(null);
  }
  return canvas;
}

/** Free a canvas' backing store immediately (browsers keep it until GC otherwise). */
export function releaseCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | null | undefined) {
  if (!canvas) return;
  canvas.width = 1;
  canvas.height = 1;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality));
}

/** Size of a page as displayed (after /Rotate), in points. */
export async function pageSize(doc: PDFDocumentProxy, index: number): Promise<{ width: number; height: number }> {
  const page = await doc.getPage(index + 1);
  const vp = page.getViewport({ scale: 1 });
  return { width: vp.width, height: vp.height };
}

/**
 * Renders thumbnails one at a time, most recently requested first (what is on
 * screen now), caches them as small JPEG object URLs and cleans everything up
 * on dispose(). One instance per opened document, so thumbnails of a previous
 * file can never land on a new one.
 */
export class Thumbnailer {
  private cache = new Map<number, string>();
  private waiting = new Map<number, { resolve: (u: string) => void; reject: (e: unknown) => void }[]>();
  private queue: number[] = [];
  private running = false;
  private disposed = false;
  private task: RenderTask | null = null;

  constructor(
    private doc: PDFDocumentProxy,
    private cssWidth = 160,
  ) {}

  peek(index: number): string | undefined {
    return this.cache.get(index);
  }

  get(index: number): Promise<string> {
    const hit = this.cache.get(index);
    if (hit) return Promise.resolve(hit);
    if (this.disposed) return Promise.reject(new Error("disposed"));
    return new Promise((resolve, reject) => {
      const list = this.waiting.get(index) ?? [];
      list.push({ resolve, reject });
      this.waiting.set(index, list);
      this.queue = this.queue.filter((i) => i !== index);
      this.queue.push(index);
      void this.pump();
    });
  }

  /** Forget a request that scrolled out of view before it started. */
  cancel(index: number) {
    if (!this.waiting.has(index)) return;
    this.queue = this.queue.filter((i) => i !== index);
    const list = this.waiting.get(index)!;
    this.waiting.delete(index);
    for (const w of list) w.reject(new Error("cancelled"));
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length && !this.disposed) {
        const index = this.queue.pop()!;
        let url: string | null = null;
        let error: unknown = null;
        let page: PDFPageProxy | null = null;
        let canvas: HTMLCanvasElement | null = null;
        try {
          page = await this.doc.getPage(index + 1);
          const vp = page.getViewport({ scale: 1 });
          const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
          const scale = (this.cssWidth * dpr) / Math.max(vp.width, vp.height * 0.75);
          canvas = await renderPage(page, scale, { onTask: (t) => (this.task = t) });
          const blob = await canvasToBlob(canvas, "image/jpeg", 0.8);
          if (!this.disposed) {
            url = URL.createObjectURL(blob);
            this.cache.set(index, url);
          }
        } catch (e) {
          error = e;
        } finally {
          releaseCanvas(canvas);
          page?.cleanup();
        }
        const list = this.waiting.get(index) ?? [];
        this.waiting.delete(index);
        for (const w of list) {
          if (url) w.resolve(url);
          else w.reject(error ?? new Error("disposed"));
        }
      }
    } finally {
      this.running = false;
    }
  }

  dispose() {
    this.disposed = true;
    this.task?.cancel();
    for (const url of this.cache.values()) URL.revokeObjectURL(url);
    this.cache.clear();
    for (const list of this.waiting.values()) for (const w of list) w.reject(new Error("disposed"));
    this.waiting.clear();
    this.queue = [];
  }
}
