"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { Dropzone } from "@/ui/dropzone";
import { Field } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { IMAGE_ACCEPT } from "./lib/detect";
import { previewFile } from "./lib/run";
import { prepareFile, type Prepared } from "./lib/source";
import { CompareSlider } from "./ui/CompareSlider";
import { checker, RangeField } from "./ui/controls";
import { useEngine } from "./ui/hooks";
import { errorText } from "./ui/strings";

const T = {
  ru: {
    a: "Первое изображение (A)",
    b: "Второе изображение (B)",
    dropA: "Перетащите первое изображение или нажмите",
    dropB: "Перетащите второе изображение или нажмите",
    replace: "Заменить",
    mode: "Режим",
    slider: "Шторка",
    side: "Рядом",
    diff: "Разница",
    threshold: "Порог чувствительности",
    changed: "пикселей отличаются",
    same: "Изображения совпадают пиксель в пиксель",
    scaled: "Размеры отличаются — B масштабировано под A для сравнения",
    diffHint: "Красным отмечены пиксели, которые отличаются сильнее порога",
  },
  en: {
    a: "First image (A)",
    b: "Second image (B)",
    dropA: "Drop the first image or click",
    dropB: "Drop the second image or click",
    replace: "Replace",
    mode: "Mode",
    slider: "Slider",
    side: "Side by side",
    diff: "Difference",
    threshold: "Sensitivity threshold",
    changed: "of pixels differ",
    same: "The images are identical pixel for pixel",
    scaled: "Sizes differ — B is scaled to A for comparison",
    diffHint: "Pixels that differ more than the threshold are marked red",
  },
} as const;

interface Side {
  prepared: Prepared;
  url: string;
  w: number;
  h: number;
  canvas: HTMLCanvasElement;
}

const MAX = 1600;

export default function Compare({ locale }: { locale: Locale }) {
  const t = T[locale];
  const getEngine = useEngine();
  const [a, setA] = useState<Side | null>(null);
  const [b, setB] = useState<Side | null>(null);
  const [mode, setMode] = useState<"slider" | "side" | "diff">("slider");
  const [threshold, setThreshold] = useState(16);
  const [diff, setDiff] = useState<{ url: string; share: number } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(
    () => () => {
      for (const u of urlsRef.current) URL.revokeObjectURL(u);
    },
    [],
  );

  const load = (set: (s: Side | null) => void) => async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const prepared = await prepareFile(f);
      const r = await previewFile(getEngine(), prepared, MAX);
      const canvas = document.createElement("canvas");
      canvas.width = r.bitmap.width;
      canvas.height = r.bitmap.height;
      canvas.getContext("2d")!.drawImage(r.bitmap, 0, 0);
      r.bitmap.close();
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("ENCODE_FAILED");
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      set({ prepared, url, w: r.srcWidth, h: r.srcHeight, canvas });
    } catch (e) {
      setError(e);
    }
  };

  // difference map: B scaled to A's preview size, per-pixel max channel delta
  useEffect(() => {
    if (!a || !b || mode !== "diff") return;
    const W = a.canvas.width;
    const H = a.canvas.height;
    const bc = document.createElement("canvas");
    bc.width = W;
    bc.height = H;
    const bctx = bc.getContext("2d")!;
    bctx.imageSmoothingQuality = "high";
    bctx.drawImage(b.canvas, 0, 0, W, H);
    const da = a.canvas.getContext("2d")!.getImageData(0, 0, W, H).data;
    const db = bctx.getImageData(0, 0, W, H).data;
    const out = new ImageData(W, H);
    const o = out.data;
    let changed = 0;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
      const y = (0.2126 * da[i] + 0.7152 * da[i + 1] + 0.0722 * da[i + 2]) * 0.35 + 150;
      if (d > threshold) {
        changed++;
        o[i] = 255;
        o[i + 1] = 30;
        o[i + 2] = 60;
      } else {
        o[i] = o[i + 1] = o[i + 2] = y;
      }
      o[i + 3] = 255;
    }
    bctx.putImageData(out, 0, 0);
    let alive = true;
    let made: string | null = null;
    bc.toBlob((blob) => {
      if (!alive || !blob) return;
      made = URL.createObjectURL(blob);
      setDiff({ url: made, share: changed / (W * H) });
      bc.width = bc.height = 1;
    }, "image/png");
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [a, b, mode, threshold]);

  const pick = (label: string, drop: string, side: Side | null, set: (s: Side | null) => void) =>
    side ? (
      <Dropzone
        onFiles={load(set)}
        accept={IMAGE_ACCEPT}
        compact
        title={`${label}: ${side.prepared.file.name}`}
        hint={`${side.w}×${side.h} · ${formatBytes(locale, side.prepared.file.size)} · ${t.replace}`}
      />
    ) : (
      <Dropzone onFiles={load(set)} accept={IMAGE_ACCEPT} title={drop} hint={label} className="min-h-40" />
    );

  const ready = a && b;
  const sizeDiffers = ready && (a.w !== b.w || a.h !== b.h);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {pick(t.a, t.dropA, a, setA)}
        {pick(t.b, t.dropB, b, setB)}
      </div>
      {ready && (
        <>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3 rounded-[0.75rem] border border-line bg-surface px-4 py-3">
            <Field label={t.mode}>
              <Segmented
                wrap
                label={t.mode}
                value={mode}
                onChange={setMode}
                options={[
                  { value: "slider", label: t.slider },
                  { value: "side", label: t.side },
                  { value: "diff", label: t.diff },
                ]}
              />
            </Field>
            {mode === "diff" && (
              <div className="w-56">
                <RangeField label={t.threshold} value={threshold} onChange={setThreshold} min={0} max={128} locale={locale} />
              </div>
            )}
          </div>
          <Panel className="overflow-hidden">
            <div className="p-3 sm:p-4">
              {mode === "diff" ? (
                diff ? (
                  <div className={`flex justify-center overflow-auto rounded-[0.625rem] border border-line ${checker}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL */}
                    <img src={diff.url} alt={t.diffHint} className="block h-auto max-h-[70vh] max-w-full" />
                  </div>
                ) : null
              ) : (
                <CompareSlider before={a.url} after={b.url} locale={locale} beforeLabel="A" afterLabel="B" mode={mode === "side" ? "side" : "slider"} />
              )}
            </div>
            <div className="border-t border-line px-4 py-3" aria-live="polite">
              {mode === "diff" && diff ? (
                <p className="tabular text-2xl font-semibold tracking-tight text-fg">
                  {diff.share === 0 ? t.same : `${formatNumber(locale, diff.share * 100, { maximumFractionDigits: diff.share < 0.01 ? 3 : 1 })} % ${t.changed}`}
                </p>
              ) : (
                <p className="tabular text-lg font-semibold text-fg">
                  A {a.w}×{a.h} · {formatBytes(locale, a.prepared.file.size)} — B {b.w}×{b.h} · {formatBytes(locale, b.prepared.file.size)}
                </p>
              )}
              {sizeDiffers && <p className="text-sm text-warn">{t.scaled}</p>}
              {mode === "diff" && <p className="text-sm text-fg-3">{t.diffHint}</p>}
            </div>
          </Panel>
        </>
      )}
      {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
    </div>
  );
}
