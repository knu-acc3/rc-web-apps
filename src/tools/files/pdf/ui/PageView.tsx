"use client";

import { ImageOff, Loader2, RotateCw } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { fitScale, fitWidth } from "../lib/render-math";
import { S } from "./strings";

interface PageSize {
  doc: PDFDocumentProxy;
  index: number;
  /** Page size as displayed (after /Rotate), points. */
  w: number;
  h: number;
}

/** A render that takes longer than this is treated as failed (a stuck worker must not mean an endless spinner). */
const RENDER_TIMEOUT = 45_000;

type Fit = "width" | "contain" | "stage";

/**
 * Height the page may take: "contain" — most of a phone screen, the whole window
 * next to the settings on desktop; "stage" — unlimited on phones (the page is the
 * work surface), the window height (minus the page switcher) on desktop.
 */
function maxBoxHeight(fit: Fit): number {
  if (fit === "width") return Infinity;
  const vh = window.innerHeight || 800;
  const wide = window.matchMedia?.("(min-width: 64rem)").matches;
  if (fit === "stage") return wide ? Math.max(360, vh - 190) : Infinity;
  return Math.max(260, wide ? vh - 136 : vh * 0.62);
}

/**
 * One page of an open pdf.js document, drawn at a size that suits the screen
 * (device pixels up to 2×, at most ~2.5 MP) into a canvas that replaces the
 * previous one only when ready. Shows a skeleton while loading and a retry
 * button when rendering fails — never an endless spinner.
 *  - fit "width": as wide as the container (≤ `maxCssWidth`); `children` get the
 *    exact CSS size for overlays (signature box, text editor);
 *  - fit "contain": the whole page fits the container's width and the screen height;
 *  - fit "stage": like "width" on phones, like "contain" (≤ `maxCssWidth`) on desktop.
 * `keepStale` keeps the previous picture (and its size) on screen while the next
 * document renders — for previews that change with every setting.
 */
export function PageView({
  locale,
  doc,
  index,
  label,
  fit = "width",
  maxCssWidth = 720,
  keepStale = false,
  busy = false,
  className,
  children,
}: {
  locale: Locale;
  doc: PDFDocumentProxy | null;
  index: number;
  label: string;
  fit?: Fit;
  maxCssWidth?: number;
  keepStale?: boolean;
  /** Shows a small spinner over the picture (e.g. while a new preview is computed). */
  busy?: boolean;
  className?: string;
  children?: (size: { width: number; height: number }) => ReactNode;
}) {
  const t = S[locale];
  const wrapRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [page, setPage] = useState<PageSize | null>(null);
  const [drawn, setDrawn] = useState<(PageSize & { cssWidth: number }) | null>(null);
  const [failed, setFailed] = useState<{ doc: PDFDocumentProxy | null; index: number } | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Available space (re-measured on rotation and window resizes).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.clientWidth);
      const h = maxBoxHeight(fit);
      if (w > 0) setBox((b) => (b && b.w === w && (b.h === h || Math.abs(b.h - h) < 2) ? b : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [fit]);

  // Page size first (cheap): the box gets its final shape before the picture arrives.
  useEffect(() => {
    if (!doc) return;
    let live = true;
    doc
      .getPage(index + 1)
      .then((p) => {
        const vp = p.getViewport({ scale: 1 });
        if (live) setPage({ doc, index, w: vp.width, h: vp.height });
      })
      .catch(() => {
        if (live) setFailed({ doc, index });
      });
    return () => {
      live = false;
    };
  }, [doc, index, attempt]);

  const current = page && page.doc === doc && page.index === index ? page : null;
  const cssWidthOf = (p: { w: number; h: number }) => (box ? Math.floor(fitWidth(p.w, p.h, fit === "contain" ? box.w : Math.min(box.w, maxCssWidth), box.h)) : 0);
  const target = current ? cssWidthOf(current) : 0;
  const fresh = !!drawn && drawn.doc === doc && drawn.index === index;
  // Re-render only for a new page or a clearly different size (not for every pixel of a resize).
  const needsRender = !!current && target > 0 && (!fresh || target > drawn.cssWidth * 1.25 || target < drawn.cssWidth * 0.6);
  const isFailed = !!failed && failed.doc === doc && failed.index === index;

  useEffect(() => {
    if (!needsRender || !current || !doc || isFailed) return;
    let live = true;
    let task: { cancel: () => void } | null = null;
    const delay = fresh ? 150 : 0;
    const timer = setTimeout(async () => {
      const m = await import("../lib/pdfjs");
      let p: Awaited<ReturnType<PDFDocumentProxy["getPage"]>> | null = null;
      let canvas: HTMLCanvasElement | null = null;
      const timeout = setTimeout(() => task?.cancel(), RENDER_TIMEOUT);
      try {
        p = await doc.getPage(index + 1);
        if (!live) return;
        canvas = await m.renderPage(p, fitScale(current.w, current.h, target, window.devicePixelRatio), { onTask: (tk) => (task = tk) });
        const host = hostRef.current;
        if (!live || !host) return;
        canvas.className = "block h-full w-full";
        canvas.setAttribute("aria-hidden", "true");
        const old = host.firstElementChild as HTMLCanvasElement | null;
        host.replaceChildren(canvas);
        canvas = null;
        m.releaseCanvas(old);
        setDrawn({ ...current, cssWidth: target });
      } catch {
        if (live) setFailed({ doc, index });
      } finally {
        clearTimeout(timeout);
        m.releaseCanvas(canvas);
        p?.cleanup();
      }
    }, delay);
    return () => {
      live = false;
      clearTimeout(timer);
      task?.cancel();
    };
    // `current` is derived from page/doc/index; `target` covers the size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsRender, doc, index, target, attempt, isFailed]);

  // Free the canvas memory right away on unmount.
  useEffect(() => {
    const host = hostRef.current;
    return () => {
      const c = host?.firstElementChild as HTMLCanvasElement | null;
      if (c) c.width = c.height = 1;
    };
  }, []);

  const showOld = !fresh && keepStale && !!drawn;
  const basis = fresh || showOld ? drawn : current;
  const width = basis ? cssWidthOf(basis) : box ? Math.min(box.w, fit === "contain" ? box.w : maxCssWidth) : 0;
  const height = basis ? (width * basis.h) / basis.w : width * 1.414;
  const size = fresh && drawn ? { width, height } : null;
  const ready = fresh || showOld;

  return (
    <div ref={wrapRef} className={cn("flex w-full min-w-0 justify-center", className)}>
      <div className="relative shrink-0" style={width ? { width, height } : { width: "100%", aspectRatio: "1 / 1.414" }}>
        <div
          ref={hostRef}
          role="img"
          aria-label={label}
          aria-busy={!ready || busy || undefined}
          className={cn("absolute inset-0 overflow-hidden bg-white shadow-[0_1px_4px_rgb(0_0_0/0.18)] transition-opacity duration-200", !ready && "opacity-0")}
        />
        {!ready && !isFailed && (
          <div className="absolute inset-0 flex items-center justify-center rounded-[0.25rem] bg-surface-2 motion-safe:animate-pulse" aria-hidden>
            <Loader2 className="size-6 animate-spin text-fg-3" />
          </div>
        )}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[0.25rem] bg-surface-2 p-4 text-center" role="alert">
            <ImageOff className="size-7 text-fg-3" aria-hidden />
            <p className="text-sm text-fg-2">{t.previewFailed}</p>
            <Button
              size="sm"
              variant="tonal"
              onClick={() => {
                setFailed(null);
                setAttempt((a) => a + 1);
              }}
            >
              <RotateCw aria-hidden />
              {t.retry}
            </Button>
          </div>
        )}
        {(busy || (showOld && !isFailed)) && (
          <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-surface/90 shadow-elev-1" aria-hidden>
            <Loader2 className="size-4 animate-spin text-accent" />
          </span>
        )}
        {size && <div className="absolute inset-0">{children?.(size)}</div>}
      </div>
    </div>
  );
}
