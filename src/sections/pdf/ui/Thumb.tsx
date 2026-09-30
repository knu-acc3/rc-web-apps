"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Thumbnailer } from "../engine/pdfjs";

/* One shared IntersectionObserver for all thumbnails on the page. */
type Cb = (visible: boolean) => void;
let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, Cb>();

function observe(el: Element, cb: Cb) {
  if (typeof IntersectionObserver === "undefined") {
    cb(true);
    return () => {};
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) callbacks.get(e.target)?.(e.isIntersecting);
    },
    { rootMargin: "300px 0px" },
  );
  callbacks.set(el, cb);
  observer.observe(el);
  return () => {
    callbacks.delete(el);
    observer?.unobserve(el);
  };
}

/** Lazily rendered page thumbnail. `rotate` is an extra clockwise rotation shown with CSS. */
export function Thumb({ thumbs, index, rotate = 0, className, dim }: { thumbs: Thumbnailer | null; index: number; rotate?: number; className?: string; dim?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observe(el, setVisible);
  }, []);

  const cached = thumbs?.peek(index) ?? null;
  useEffect(() => {
    if (!visible || !thumbs || cached) return;
    let live = true;
    thumbs
      .get(index)
      .then((u) => {
        if (live) setUrl(u);
      })
      .catch(() => {});
    return () => {
      live = false;
      thumbs.cancel(index);
    };
  }, [visible, thumbs, index, cached]);

  const src = cached ?? url;
  return (
    <div ref={ref} className={cn("relative flex aspect-square items-center justify-center overflow-hidden rounded-[0.5rem] bg-surface-2", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL of a rendered page
        <img
          src={src}
          alt=""
          draggable={false}
          className={cn("max-h-full max-w-full border border-line bg-white object-contain shadow-[0_1px_2px_rgb(0_0_0/0.08)] transition-transform duration-150", dim && "opacity-35 grayscale")}
          style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        />
      ) : (
        <span className="h-3/4 w-1/2 animate-pulse rounded-[0.25rem] bg-line" aria-hidden />
      )}
    </div>
  );
}
