"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Thumbnailer } from "../lib/pdfjs";

/* Two shared IntersectionObservers for all thumbnails: "near" (start rendering) and "on screen" (render first). */
type Seen = { near: boolean; visible: boolean };
const listeners = new Map<Element, (patch: Partial<Seen>) => void>();
let nearObs: IntersectionObserver | null = null;
let seenObs: IntersectionObserver | null = null;

function observe(el: Element, cb: (patch: Partial<Seen>) => void) {
  if (typeof IntersectionObserver === "undefined") {
    cb({ near: true, visible: true });
    return () => {};
  }
  nearObs ??= new IntersectionObserver((entries) => entries.forEach((e) => listeners.get(e.target)?.({ near: e.isIntersecting })), { rootMargin: "400px 0px" });
  seenObs ??= new IntersectionObserver((entries) => entries.forEach((e) => listeners.get(e.target)?.({ visible: e.isIntersecting })));
  listeners.set(el, cb);
  nearObs.observe(el);
  seenObs.observe(el);
  return () => {
    listeners.delete(el);
    nearObs?.unobserve(el);
    seenObs?.unobserve(el);
  };
}

/** Lazily rendered page thumbnail. `rotate` is an extra clockwise rotation shown with CSS. */
export function Thumb({ thumbs, index, rotate = 0, className, dim }: { thumbs: Thumbnailer | null; index: number; rotate?: number; className?: string; dim?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState<Seen>({ near: false, visible: false });
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ thumbs: Thumbnailer; index: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, (patch) => {
      setSeen((s) => ({ ...s, ...patch }));
      // A failed thumbnail is tried again the next time it scrolls into view.
      if (patch.near === false) setFailed(null);
    });
  }, []);

  const cached = thumbs?.peek(index) ?? null;
  const isFailed = !!failed && failed.thumbs === thumbs && failed.index === index;
  const want = seen.near || seen.visible;
  useEffect(() => {
    if (!want || !thumbs || cached || isFailed) return;
    let live = true;
    thumbs
      .get(index, seen.visible)
      .then((u) => {
        if (live) setUrl(u);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "";
        if (live && msg !== "cancelled" && msg !== "disposed") setFailed({ thumbs, index });
      });
    return () => {
      live = false;
      thumbs.cancel(index);
    };
  }, [want, seen.visible, thumbs, index, cached, isFailed]);

  const src = cached ?? url;
  return (
    <div ref={ref} className={cn("relative flex aspect-square items-center justify-center overflow-hidden rounded-[0.5rem] bg-surface-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL of a rendered page
        <img
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          className={cn("max-h-full max-w-full bg-white object-contain shadow-[0_1px_3px_rgb(0_0_0/0.18)] transition-transform duration-150", dim && "opacity-35 grayscale")}
          style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        />
      ) : isFailed ? (
        <ImageOff className="size-5 text-fg-3" aria-hidden />
      ) : (
        <span className="h-3/4 w-1/2 rounded-[0.25rem] bg-line motion-safe:animate-pulse" aria-hidden />
      )}
    </div>
  );
}
