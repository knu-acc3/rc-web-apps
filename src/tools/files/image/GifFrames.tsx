"use client";

/* eslint-disable @next/next/no-img-element -- blob: URLs of extracted frames */
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber, plural } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Notice, Panel } from "@/ui/panel";
import { isAbort } from "./lib/client";
import { detectFormat } from "./lib/detect";
import { gifInfo } from "./lib/gif-decode";
import { baseName, readHead } from "./lib/source";
import type { GifFramesResult } from "./lib/types";
import { checker, ProgressBar, replaceDrop } from "./ui/controls";
import { useEngine } from "./ui/hooks";
import { errorText, S } from "./ui/strings";
import { downloadZip } from "./ui/useBatch";

const T = {
  ru: {
    drop: "Перетащите GIF сюда, вставьте Ctrl+V или нажмите, чтобы выбрать",
    hint: "Анимированный GIF · файл не покидает устройство",
    frames: ["кадр", "кадра", "кадров"],
    duration: "длительность",
    loop: "повтор",
    forever: "бесконечно",
    once: "один раз",
    times: (n: number) => `${n + 1} ${plural("ru", n + 1, ["раз", "раза", "раз"])}`,
    all: "Скачать все кадры (ZIP)",
    frame: (i: number, ms: number) => `Кадр ${i}, ${ms} мс — скачать PNG`,
    notGif: "Это не GIF-файл",
    extracting: "Извлечение кадров…",
    zeroDelay: "У некоторых кадров задержка 0–10 мс: браузеры показывают их по 100 мс",
    clickHint: "Нажмите на кадр, чтобы скачать его отдельно",
  },
  en: {
    drop: "Drop a GIF here, paste with Ctrl+V or click to choose",
    hint: "Animated GIF · the file never leaves your device",
    frames: ["frame", "frames"],
    duration: "duration",
    loop: "loop",
    forever: "forever",
    once: "once",
    times: (n: number) => `${n + 1} times`,
    all: "Download all frames (ZIP)",
    frame: (i: number, ms: number) => `Frame ${i}, ${ms} ms — download PNG`,
    notGif: "This isn't a GIF file",
    extracting: "Extracting frames…",
    zeroDelay: "Some frames have a 0–10 ms delay: browsers show them for 100 ms",
    clickHint: "Click a frame to download it on its own",
  },
} as const;

interface Frame {
  index: number;
  delay: number;
  shownDelay: number;
  blob: Blob;
  url: string;
}

export default function GifFrames({ locale }: { locale: Locale }) {
  const t = T[locale];
  const getEngine = useEngine();
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<ReturnType<typeof gifInfo> | null>(null);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!file) return;
    const ac = new AbortController();
    let made: Frame[] = [];
    (async () => {
      setError(null);
      setFrames([]);
      setInfo(null);
      try {
        if (detectFormat(await readHead(file, 16)) !== "gif") throw new Error("NOT_GIF");
        const buf = await file.arrayBuffer();
        setInfo(gifInfo(new Uint8Array(buf)));
        setBusy(true);
        setProgress(0);
        const res = await getEngine().run<GifFramesResult>({ type: "gif-frames", bytes: buf }, { signal: ac.signal, onProgress: setProgress, transfer: [buf] });
        made = res.frames.map((f) => {
          const blob = new Blob([f.png], { type: "image/png" });
          return { index: f.index, delay: f.delay, shownDelay: f.shownDelay, blob, url: URL.createObjectURL(blob) };
        });
        if (!ac.signal.aborted) setFrames(made);
      } catch (e) {
        if (!isAbort(e) && !ac.signal.aborted) setError(e);
      } finally {
        if (!ac.signal.aborted) setBusy(false);
      }
    })();
    return () => {
      ac.abort();
      for (const f of made) URL.revokeObjectURL(f.url);
    };
  }, [file, getEngine]);

  const name = file ? baseName(file.name) : "gif";
  const pad = String(frames.length).length;
  const fname = (i: number) => `${name}-frame-${String(i + 1).padStart(Math.max(3, pad), "0")}.png`;

  if (!file) {
    return <Dropzone onFiles={(f) => setFile(f[0] ?? null)} accept="image/gif,.gif" title={t.drop} hint={t.hint} locale={locale} />;
  }

  const loopText = info ? (info.loop === null ? t.once : info.loop === 0 ? t.forever : t.times(info.loop)) : "";
  const zeroDelay = info?.delays.some((d) => d <= 10);
  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite">
            <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {info ? `${info.frames} ${plural(locale, info.frames, t.frames)}` : "—"}
            </p>
            {info && (
              <p className="tabular text-sm text-fg-3">
                {info.width}×{info.height} px · {t.duration} {formatNumber(locale, info.duration / 1000, { maximumFractionDigits: 2 })}{" "}
                {locale === "ru" ? "с" : "s"} · {t.loop}: {loopText}
              </p>
            )}
          </div>
          <Button
            variant="filled"
            size="lg"
            disabled={!frames.length}
            onClick={() =>
              downloadZip(
                frames.map((f, i) => ({ name: fname(i), blob: f.blob })),
                `${name}-frames.zip`,
              )
            }
          >
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
            {busy ? `${t.extracting} ${Math.round(progress * 100)} %` : t.all}
          </Button>
        </div>
        {busy && <ProgressBar value={progress} />}
        {zeroDelay && <p className="text-[0.8125rem] text-warn">{t.zeroDelay}</p>}
      </Panel>

      {frames.length > 0 && (
        <section>
          <p className="mb-2 text-[0.8125rem] text-fg-3">{t.clickHint}</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {frames.map((f, i) => (
              <li key={f.index}>
                <button
                  type="button"
                  onClick={() => downloadBlob(f.blob, fname(i))}
                  aria-label={t.frame(i + 1, f.delay)}
                  className={`group flex w-full flex-col overflow-hidden rounded-[0.875rem] text-left shadow-elev-1 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-elev-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${checker}`}
                >
                  <img src={f.url} alt="" loading="lazy" className="aspect-square w-full object-contain" />
                  <span className="tabular flex justify-between bg-surface px-2 py-1 text-[0.75rem] text-fg-2">
                    <span>#{i + 1}</span>
                    <span>
                      {f.delay} {locale === "ru" ? "мс" : "ms"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error ? <Notice tone="err">{error instanceof Error && error.message === "NOT_GIF" ? t.notGif : errorText(locale, error)}</Notice> : null}
      <Dropzone onFiles={(f) => setFile(f[0] ?? null)} accept="image/gif,.gif" title={t.drop} locale={locale} className={replaceDrop} />
      <p className="sr-only">{S(locale).processingIn}</p>
    </div>
  );
}
