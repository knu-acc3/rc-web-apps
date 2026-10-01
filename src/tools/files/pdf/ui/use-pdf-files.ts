"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";

type PdfjsModule = typeof import("../lib/pdfjs");
type Thumbnailer = import("../lib/pdfjs").Thumbnailer;

export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "loading" | "password" | "ready" | "error";
  /** Why it failed: a damaged file, or pdf.js didn't start (worth a retry). */
  error?: "invalid" | "engine";
  wrongPassword?: boolean;
  password?: string;
  bytes: ArrayBuffer | null;
  pages: number;
  doc: PDFDocumentProxy | null;
  thumbs: Thumbnailer | null;
}

let seq = 0;
const nextId = () => `f${++seq}`;

let modPromise: Promise<PdfjsModule> | null = null;
const pdfjsModule = () => (modPromise ??= import("../lib/pdfjs"));

/**
 * The list of opened PDF files. Every file gets its own pdf.js document and
 * thumbnailer; results of a load that finishes after the file was removed or
 * replaced are discarded, and everything is destroyed on removal/unmount.
 */
export function usePdfFiles(opts: { multiple?: boolean; thumbnails?: boolean; thumbWidth?: number; jobWorker?: boolean } = {}) {
  const { multiple = false, thumbnails = true, thumbWidth = 160, jobWorker = true } = opts;
  const [files, setFiles] = useState<PdfFile[]>([]);
  const alive = useRef(new Set<string>());
  const resources = useRef(new Map<string, { doc: PDFDocumentProxy; thumbs: Thumbnailer | null }>());

  const dispose = useCallback((id: string) => {
    alive.current.delete(id);
    const r = resources.current.get(id);
    if (r) {
      r.thumbs?.dispose();
      void r.doc.loadingTask.destroy().catch(() => {});
      resources.current.delete(id);
    }
  }, []);

  useEffect(() => {
    let released = false;
    void pdfjsModule()
      .then((m) => {
        if (!released) m.acquirePdfjs();
      })
      .catch(() => {
        modPromise = null;
      });
    const res = resources.current;
    const ids = alive.current;
    return () => {
      released = true;
      for (const id of [...ids]) {
        ids.delete(id);
        const r = res.get(id);
        r?.thumbs?.dispose();
        void r?.doc.loadingTask.destroy().catch(() => {});
      }
      res.clear();
      void pdfjsModule()
        .then((m) => m.releasePdfjs())
        .catch(() => {});
    };
  }, []);

  const update = useCallback((id: string, patch: Partial<PdfFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const load = useCallback(
    async (id: string, file: File, bytesIn: ArrayBuffer | null, password?: string) => {
      let bytes = bytesIn;
      try {
        bytes ??= await file.arrayBuffer();
      } catch {
        if (alive.current.has(id)) update(id, { status: "error", error: "invalid" });
        return;
      }
      if (!alive.current.has(id)) return;
      let m: PdfjsModule;
      try {
        m = await pdfjsModule();
      } catch {
        modPromise = null;
        if (alive.current.has(id)) update(id, { status: "error", error: "engine", bytes });
        return;
      }
      try {
        const doc = await m.openDocument(bytes, password);
        if (!alive.current.has(id)) {
          void doc.loadingTask.destroy();
          return;
        }
        const thumbs = thumbnails ? new m.Thumbnailer(doc, thumbWidth) : null;
        resources.current.set(id, { doc, thumbs });
        update(id, { status: "ready", error: undefined, doc, thumbs, pages: doc.numPages, bytes, password, wrongPassword: false });
      } catch (e) {
        if (!alive.current.has(id)) return;
        if (process.env.NODE_ENV !== "production") console.error(e);
        if (e instanceof m.PasswordNeeded) update(id, { status: "password", wrongPassword: e.incorrect, bytes });
        else update(id, { status: "error", error: e instanceof m.PdfOpenError ? e.kind : "invalid", bytes });
      }
    },
    [thumbnails, thumbWidth, update],
  );

  const add = useCallback(
    (list: File[]) => {
      const accepted = multiple ? list : list.slice(0, 1);
      const entries: PdfFile[] = accepted.map((file) => ({
        id: nextId(),
        file,
        name: file.name,
        size: file.size,
        status: "loading",
        bytes: null,
        pages: 0,
        doc: null,
        thumbs: null,
      }));
      if (!multiple) for (const id of [...alive.current]) dispose(id);
      for (const e of entries) alive.current.add(e.id);
      setFiles((prev) => (multiple ? [...prev, ...entries] : entries));
      for (const e of entries) void load(e.id, e.file, null);
    },
    [dispose, load, multiple],
  );

  const unlock = useCallback(
    (id: string, password: string) => {
      const f = files.find((x) => x.id === id);
      if (!f) return;
      update(id, { status: "loading" });
      void load(id, f.file, f.bytes, password);
    },
    [files, load, update],
  );

  /** Try a file again after pdf.js failed to start. */
  const retry = useCallback(
    (id: string) => {
      const f = files.find((x) => x.id === id);
      if (!f) return;
      update(id, { status: "loading", error: undefined });
      void load(id, f.file, f.bytes, f.password);
    },
    [files, load, update],
  );

  /**
   * Start fetching pdf.js (and the pdf-lib worker most tools end with) before a
   * file is chosen: the file picker takes a few seconds anyway.
   */
  const warm = useCallback(() => {
    void pdfjsModule()
      .then((m) => m.warmUp())
      .catch(() => {
        modPromise = null;
      });
    if (jobWorker)
      void import("../lib/client")
        .then((c) => c.warmPdfWorker())
        .catch(() => {});
  }, [jobWorker]);

  const remove = useCallback(
    (id: string) => {
      dispose(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [dispose],
  );

  const move = useCallback((id: string, delta: number) => {
    setFiles((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    for (const id of [...alive.current]) dispose(id);
    setFiles([]);
  }, [dispose]);

  const ready = files.filter((f) => f.status === "ready");
  return { files, ready, add, unlock, retry, warm, remove, move, clear, allReady: files.length > 0 && ready.length === files.length };
}

export type PdfFiles = ReturnType<typeof usePdfFiles>;
