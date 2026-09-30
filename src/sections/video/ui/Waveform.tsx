"use client";

import { useEffect, useRef } from "react";
import { cssColor } from "@/sections/audio/lib/audio";

/** Static waveform from min/max peak pairs ([min0, max0, min1, max1, …]). */
export function Waveform({ peaks, className }: { peaks: Float32Array | null; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
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
      ctx.clearRect(0, 0, w, h);
      if (!peaks || peaks.length < 2) return;
      const n = peaks.length / 2;
      const mid = h / 2;
      ctx.fillStyle = cssColor("--accent", "#2952ff");
      for (let x = 0; x < w; x++) {
        const a = Math.floor((x / w) * n);
        const b = Math.max(a + 1, Math.floor(((x + 1) / w) * n));
        let mn = 0;
        let mx = 0;
        for (let i = a; i < b && i < n; i++) {
          if (peaks[i * 2] < mn) mn = peaks[i * 2];
          if (peaks[i * 2 + 1] > mx) mx = peaks[i * 2 + 1];
        }
        const top = mid - mx * mid * 0.95;
        const bottom = mid - mn * mid * 0.95;
        ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    return () => ro.disconnect();
  }, [peaks]);
  return <canvas ref={canvas} className={className ?? "block h-full w-full"} aria-hidden />;
}
