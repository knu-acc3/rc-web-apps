"use client";

import { Eye, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { runOps, type Env } from "../lib/pipeline";
import { previewFile } from "../lib/run";
import type { Prepared } from "../lib/source";
import type { AnyCanvas, Op } from "../lib/types";
import { checker } from "./controls";
import { useEngine } from "./hooks";
import { errorText } from "./strings";

const T = {
  ru: { original: "Оригинал", hold: "Показать оригинал", preview: "Предпросмотр (уменьшенная копия)" },
  en: { original: "Original", hold: "Show original", preview: "Preview (reduced copy)" },
} as const;

function mainEnv(scale: number, assets?: Record<string, ImageBitmap>): Env {
  return {
    scale,
    assets,
    create(w, h) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    },
  };
}

/** Load a downscaled preview bitmap of a prepared file (closed on change/unmount). */
export function usePreviewBitmap(p: Prepared | undefined, maxSide = 1280, svgWidth?: number) {
  const getEngine = useEngine();
  const key = p ? `${p.id}:${maxSide}:${svgWidth ?? ""}` : "";
  // results are keyed by the request, so a stale bitmap is never shown
  const [state, setState] = useState<{ key: string; bitmap: ImageBitmap; info: { srcWidth: number; srcHeight: number; scale: number } } | null>(null);
  const [failed, setFailed] = useState<{ key: string; error: unknown } | null>(null);
  const held = useRef<ImageBitmap | null>(null);

  useEffect(() => {
    if (!p) return;
    const ac = new AbortController();
    previewFile(getEngine(), p, maxSide, { signal: ac.signal, svgWidth })
      .then((r) => {
        if (ac.signal.aborted) return r.bitmap.close();
        held.current?.close();
        held.current = r.bitmap;
        setState({ key, bitmap: r.bitmap, info: { srcWidth: r.srcWidth, srcHeight: r.srcHeight, scale: r.scale } });
      })
      .catch((e) => {
        if (!ac.signal.aborted) setFailed({ key, error: e });
      });
    return () => ac.abort();
  }, [p, key, maxSide, svgWidth, getEngine]);

  useEffect(
    () => () => {
      held.current?.close();
      held.current = null;
    },
    [],
  );

  const cur = state && state.key === key ? state : null;
  return { bitmap: cur?.bitmap ?? null, info: cur?.info ?? null, error: failed && failed.key === key ? failed.error : null };
}

/**
 * Instant preview: applies `ops` to a reduced copy on the main thread (the
 * same pipeline code as the full-resolution export in the worker).
 */
export function LiveStage({
  locale,
  prepared,
  ops,
  assets,
  maxSide = 1280,
  className,
}: {
  locale: Locale;
  prepared: Prepared | undefined;
  ops: Op[];
  assets?: Record<string, ImageBitmap>;
  maxSide?: number;
  className?: string;
}) {
  const t = T[locale];
  const { bitmap, info, error } = usePreviewBitmap(prepared, maxSide);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOrig, setShowOrig] = useState(false);
  const opsKey = JSON.stringify(ops);

  useEffect(() => {
    const view = canvasRef.current;
    if (!bitmap || !info || !view) return;
    let cancelled = false;
    const raf = requestAnimationFrame(async () => {
      const env = mainEnv(info.scale, assets);
      const base = env.create(bitmap.width, bitmap.height);
      (base.getContext("2d") as CanvasRenderingContext2D).drawImage(bitmap, 0, 0);
      let out: AnyCanvas = base;
      try {
        if (!showOrig) out = await runOps(env, base, JSON.parse(opsKey) as Op[]);
      } catch {
        out = base;
      }
      if (cancelled) return;
      view.width = out.width;
      view.height = out.height;
      const ctx = view.getContext("2d")!;
      ctx.clearRect(0, 0, out.width, out.height);
      ctx.drawImage(out, 0, 0);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [bitmap, info, opsKey, assets, showOrig]);

  return (
    <div className={cn("relative", className)}>
      <div className={cn("flex min-h-56 items-center justify-center overflow-hidden rounded-[1rem]", checker)}>
        {error ? (
          <p className="max-w-md px-4 py-10 text-center text-sm text-err">{errorText(locale, error)}</p>
        ) : !bitmap ? (
          <Loader2 className="size-6 animate-spin text-accent" aria-hidden />
        ) : null}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={showOrig ? t.original : t.preview}
          className={cn("block max-h-[62vh] max-w-full object-contain", !bitmap && "hidden")}
        />
      </div>
      {bitmap && (
        <Button
          variant="elevated"
          size="sm"
          className="absolute bottom-3 left-3"
          aria-pressed={showOrig}
          onPointerDown={() => setShowOrig(true)}
          onPointerUp={() => setShowOrig(false)}
          onPointerLeave={() => setShowOrig(false)}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") setShowOrig(true);
          }}
          onKeyUp={() => setShowOrig(false)}
          title={t.hold}
        >
          <Eye aria-hidden />
          {t.original}
        </Button>
      )}
    </div>
  );
}
