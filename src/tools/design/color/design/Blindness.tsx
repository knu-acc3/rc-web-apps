"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Dropzone } from "@/ui/dropzone";
import { Textarea } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { Tabs } from "@/ui/tabs";
import { parseColor, readableTextColor, toHex, type Color } from "../lib/color";
import { CVD_TYPES, cvdMatrix, simulate, type CvdType } from "./lib/cvd";
import { NumberSlider } from "@/tools/design/css/ui/kit";

const T = {
  ru: {
    type: "Тип нарушения",
    types: { protanopia: "Протанопия", deuteranopia: "Дейтеранопия", tritanopia: "Тританопия", achromatopsia: "Ахроматопсия" } as Record<CvdType, string>,
    severity: "Выраженность",
    mode: "Что проверять",
    palette: "Палитра",
    image: "Изображение",
    colors: "Цвета — по одному на строку или через запятую",
    normal: "Обычное зрение",
    invalid: (n: number) => `Не распознано строк: ${n}`,
    drop: "Перетащите картинку или нажмите, чтобы выбрать",
    dropHint: "PNG, JPG, WebP, GIF — файл обрабатывается только в браузере",
    original: "Оригинал",
    scaled: (w: number, h: number) => `Изображение уменьшено до ${w}×${h} для быстрой обработки.`,
    error: "Не удалось открыть изображение",
    approx: "Симуляция приближённая: восприятие цвета у людей с одним и тем же диагнозом различается.",
  },
  en: {
    type: "Deficiency type",
    types: { protanopia: "Protanopia", deuteranopia: "Deuteranopia", tritanopia: "Tritanopia", achromatopsia: "Achromatopsia" } as Record<CvdType, string>,
    severity: "Severity",
    mode: "What to check",
    palette: "Palette",
    image: "Image",
    colors: "Colors — one per line or comma-separated",
    normal: "Normal vision",
    invalid: (n: number) => `Unrecognized lines: ${n}`,
    drop: "Drop an image or click to choose",
    dropHint: "PNG, JPG, WebP, GIF — processed only in your browser",
    original: "Original",
    scaled: (w: number, h: number) => `The image was scaled down to ${w}×${h} for fast processing.`,
    error: "Couldn't open this image",
    approx: "The simulation is an approximation: people with the same diagnosis perceive color differently.",
  },
} as const;

const MAX_SIDE = 1600;

function parseList(text: string): { colors: Color[]; bad: number } {
  const tokens = text
    .split(/\n/)
    .flatMap((line) => (line.includes("(") ? [line] : line.split(/[,;]/)))
    .map((s) => s.trim())
    .filter(Boolean);
  const colors: Color[] = [];
  let bad = 0;
  for (const tok of tokens) {
    const c = parseColor(tok);
    if (c) colors.push(c);
    else bad++;
  }
  return { colors, bad };
}

export default function BlindnessSimulator({ locale, type: type0 = "deuteranopia" }: { locale: Locale; type?: CvdType }) {
  const t = T[locale];
  const id = useId();
  const [type, setType] = useState<CvdType>(type0);
  const [severity, setSeverity] = useState(100);
  const [mode, setMode] = useState<"palette" | "image">("palette");
  const [text, setText] = useState("#E53935\n#43A047\n#1E88E5\n#FDD835\n#8E24AA\n#FB8C00");
  const { colors, bad } = parseList(text);
  const sev = type === "achromatopsia" ? 1 : severity / 100;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="grid items-end gap-x-8 gap-y-4 lg:grid-cols-[auto_minmax(0,1fr)]">
          <Segmented label={t.type} value={type} onChange={setType} options={CVD_TYPES.map((x) => ({ value: x, label: t.types[x] }))} />
          {type !== "achromatopsia" && <NumberSlider label={t.severity} value={severity} min={10} max={100} step={10} unit="%" onChange={(v) => setSeverity(Math.min(100, Math.max(0, v)))} />}
        </div>
      </Panel>

      <Tabs
        label={t.mode}
        value={mode}
        onChange={setMode}
        items={[
          { value: "palette", label: t.palette },
          { value: "image", label: t.image },
        ]}
      />

      {mode === "palette" ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-list`} className="text-sm font-medium text-fg-2">
              {t.colors}
            </label>
            <Textarea id={`${id}-list`} value={text} onChange={(e) => setText(e.target.value)} rows={8} className="max-sm:text-base" />
            {bad > 0 && <p className="text-sm text-warn">{t.invalid(bad)}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Strip title={t.normal} colors={colors} />
            <Strip title={`${t.types[type]}${type !== "achromatopsia" && severity < 100 ? ` · ${severity} %` : ""}`} colors={colors.map((c) => simulate(c, type, sev))} big />
          </div>
        </div>
      ) : (
        <ImageMode type={type} severity={sev} t={t} />
      )}
      <p className="text-sm text-fg-3">{t.approx}</p>
    </div>
  );
}

function Strip({ title, colors, big = false }: { title: string; colors: Color[]; big?: boolean }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-fg-2">{title}</h2>
      <ul className="grid overflow-hidden rounded-[1rem] shadow-card" style={{ gridTemplateColumns: `repeat(${Math.max(1, colors.length)}, minmax(0, 1fr))` }}>
        {colors.map((c, i) => (
          <li key={i} className={big ? "flex h-28 items-end justify-center pb-2" : "flex h-16 items-end justify-center pb-1.5"} style={{ background: toHex(c), color: readableTextColor(c) }}>
            <span className="font-mono text-[0.6875rem] font-medium">{toHex(c).slice(1, 7)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Dict = (typeof T)[Locale];

function ImageMode({ type, severity, t }: { type: CvdType; severity: number; t: Dict }) {
  const origRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<ImageData | null>(null);
  const worker = useRef<Worker | null>(null);
  const jobId = useRef(0);
  const [size, setSize] = useState<{ w: number; h: number; scaled: boolean } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const w = new Worker(new URL("./blindness.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<{ id: number; buf: ArrayBuffer }>) => {
      if (e.data.id !== jobId.current || !pixels.current || !simRef.current) return;
      const { width, height } = pixels.current;
      simRef.current.width = width;
      simRef.current.height = height;
      simRef.current.getContext("2d")?.putImageData(new ImageData(new Uint8ClampedArray(e.data.buf), width, height), 0, 0);
    };
    worker.current = w;
    return () => {
      w.terminate();
      worker.current = null;
    };
  }, []);

  function run() {
    const src = pixels.current;
    if (!src || !worker.current) return;
    const copy = new Uint8ClampedArray(src.data);
    jobId.current += 1;
    worker.current.postMessage({ id: jobId.current, buf: copy.buffer, m: cvdMatrix(type, severity) }, [copy.buffer]);
  }

  // Re-run the simulation when the type or severity changes.
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  useEffect(() => {
    runRef.current();
  }, [type, severity]);

  async function load(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(false);
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * k));
      const h = Math.max(1, Math.round(bmp.height * k));
      const canvas = origRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(bmp, 0, 0, w, h);
      bmp.close();
      pixels.current = ctx.getImageData(0, 0, w, h);
      setSize({ w, h, scaled: k < 1 });
      run();
    } catch {
      setError(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Dropzone onFiles={load} accept="image/*" title={t.drop} hint={t.dropHint} compact={!!size} />
      {error && <Notice tone="err">{t.error}</Notice>}
      {size?.scaled && <p className="text-sm text-fg-3">{t.scaled(size.w, size.h)}</p>}
      <div className={size ? "grid gap-3 md:grid-cols-2" : "hidden"}>
        <figure className="min-w-0">
          <figcaption className="mb-1.5 text-sm font-semibold text-fg-2">{t.original}</figcaption>
          <canvas ref={origRef} className="h-auto w-full rounded-[1rem] shadow-card" aria-label={t.original} role="img" />
        </figure>
        <figure className="min-w-0">
          <figcaption className="mb-1.5 text-sm font-semibold text-fg-2">{t.types[type]}</figcaption>
          <canvas ref={simRef} className="h-auto w-full rounded-[1rem] shadow-card" aria-label={t.types[type]} role="img" />
        </figure>
      </div>
    </div>
  );
}
