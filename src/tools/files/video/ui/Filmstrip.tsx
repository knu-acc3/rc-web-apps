"use client";

import { useEffect, useRef } from "react";
import { cssColor } from "@/tools/files/audio/lib/audio";
import { loadThumbs } from "../../shared/client";

/** Row of video thumbnails decoded in a worker, drawn into one canvas. */
export function Filmstrip({ file, count = 12, onReady }: { file: File; count?: number; onReady?: (ok: boolean) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const bitmaps = useRef<(ImageBitmap | null)[]>([]);
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctrl = new AbortController();
    const list: (ImageBitmap | null)[] = new Array(count).fill(null);
    bitmaps.current = list;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(c.clientWidth * dpr));
      const h = Math.max(1, Math.round(c.clientHeight * dpr));
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = cssColor("--surface-2", "#222");
      ctx.fillRect(0, 0, w, h);
      const cell = w / count;
      list.forEach((bmp, i) => {
        if (!bmp) return;
        // cover-fit the thumbnail into its cell
        const s = Math.max(cell / bmp.width, h / bmp.height);
        const sw = cell / s;
        const sh = h / s;
        ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, Math.floor(i * cell), 0, Math.ceil(cell), h);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    loadThumbs(
      file,
      count,
      96,
      (i, bmp) => {
        if (ctrl.signal.aborted) {
          bmp.close();
          return;
        }
        list[i] = bmp;
        draw();
      },
      ctrl.signal,
    )
      .then((r) => !ctrl.signal.aborted && readyRef.current?.(!!r))
      .catch(() => !ctrl.signal.aborted && readyRef.current?.(false));
    return () => {
      ctrl.abort();
      ro.disconnect();
      list.forEach((b) => b?.close());
    };
  }, [file, count]);

  return <canvas ref={canvas} className="block h-full w-full" aria-hidden />;
}
