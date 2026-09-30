"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { previewFile } from "../engine/run";
import { prepareFile, type Prepared } from "../engine/source";
import { useEngine } from "./hooks";

export interface ListImage {
  key: string;
  name: string;
  prepared: Prepared;
  bitmap: ImageBitmap | null;
  srcWidth: number;
  srcHeight: number;
}

let seq = 0;

/**
 * Ordered list of images with decoded preview bitmaps (≤ maxSide), for
 * editors that compose several images (collage, GIF). Bitmaps are closed on
 * removal and unmount.
 */
export function useImageList(maxSide: number, limit = 100) {
  const getEngine = useEngine();
  const [items, setItems] = useState<ListImage[]>([]);
  const [errors, setErrors] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(0);
  const ref = useRef<ListImage[]>([]);
  useEffect(() => {
    ref.current = items;
  }, [items]);

  useEffect(
    () => () => {
      for (const it of ref.current) it.bitmap?.close();
    },
    [],
  );

  const add = useCallback(
    async (files: File[]) => {
      const room = Math.max(0, limit - ref.current.length);
      const list = files.slice(0, room);
      setLoading((n) => n + list.length);
      for (const f of list) {
        try {
          const prepared = await prepareFile(f);
          const r = await previewFile(getEngine(), prepared, maxSide);
          const item: ListImage = { key: `i${seq++}`, name: f.name, prepared, bitmap: r.bitmap, srcWidth: r.srcWidth, srcHeight: r.srcHeight };
          setItems((xs) => [...xs, item]);
        } catch (e) {
          setErrors((xs) => [...xs, e]);
        } finally {
          setLoading((n) => n - 1);
        }
      }
    },
    [getEngine, maxSide, limit],
  );

  const remove = useCallback((i: number) => {
    setItems((xs) => {
      xs[i]?.bitmap?.close();
      return xs.filter((_, j) => j !== i);
    });
  }, []);

  const move = useCallback((from: number, to: number) => {
    setItems((xs) => {
      const next = [...xs];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems((xs) => {
      for (const it of xs) it.bitmap?.close();
      return [];
    });
    setErrors([]);
  }, []);

  return { items, add, remove, move, clear, errors, loading: loading > 0 };
}
