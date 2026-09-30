"use client";

import { Camera, Download, Images } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { runFrames } from "./engine/client";
import { formatTime } from "./engine/time";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { UI } from "./ui/strings";
import { VideoPreview, type PreviewHandle } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const T = {
  ru: {
    every: "Интервал",
    sec: "с",
    format: "Формат",
    width: "Ширина",
    original: "Исходная",
    px: "пикс.",
    will: "Будет сохранено",
    frames: ["кадр", "кадра", "кадров"],
    many: "Очень много кадров — увеличьте интервал или уменьшите ширину, иначе браузеру может не хватить памяти.",
    run: "Сохранить кадры",
    grab: "Сохранить текущий кадр",
    zip: "Скачать ZIP",
    shown: "Показаны первые {n}",
    preview: "Предпросмотр видео",
    unsupported: "Этот формат браузер не декодирует. Сначала сконвертируйте видео в MP4.",
  },
  en: {
    every: "Interval",
    sec: "s",
    format: "Format",
    width: "Width",
    original: "Original",
    px: "px",
    will: "Frames to save",
    frames: ["frame", "frames"],
    many: "That's a lot of frames — increase the interval or reduce the width, or the browser may run out of memory.",
    run: "Save frames",
    grab: "Save current frame",
    zip: "Download ZIP",
    shown: "First {n} shown",
    preview: "Video preview",
    unsupported: "The browser can't decode this format. Convert the video to MP4 first.",
  },
} as const;

type Out = { images: { name: string; blob: Blob; time: number }[]; zip: Blob };
const STEPS = [0.1, 0.5, 1, 2, 5, 10, 30, 60];

function Thumb({ blob, name }: { blob: Blob; name: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    if (ref.current) ref.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} alt={name} className="aspect-video w-full rounded-[8px] bg-surface-2 object-cover" loading="lazy" />;
}

export default function VideoFrames({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<Out>();
  const player = useRef<PreviewHandle>(null);
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState<"jpeg" | "png" | "webp">("jpeg");
  const [width, setWidth] = useState(0);
  const d = probe.info?.duration ?? 0;
  const n = d > 0 ? Math.floor(d / step) + 1 : 0;
  const base = file ? file.name.replace(/\.[^.]+$/, "") : "frame";
  const touch = () => job.status === "done" && job.reset();

  const run = () => {
    if (!file || !n) return;
    const times = Array.from({ length: n }, (_, i) => Math.min(d - 0.001, i * step));
    void job.run((hooks) => runFrames(file, { times, format, quality: 0.92, width: width || undefined, baseName: base }, hooks));
  };

  const grab = () => {
    const v = player.current?.video();
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    c.toBlob((b) => b && downloadBlob(b, `${base}_${formatTime(v.currentTime, 2).replace(/[:.]/g, "-")}.png`), "image/png");
  };

  const out = job.status === "done" ? job.result : null;
  return (
    <Workbench
      locale={locale}
      kind="video"
      accept={VIDEO_ACCEPT}
      file={file}
      onFile={(f) => {
        job.reset();
        setFile(f);
      }}
      probe={probe}
      busy={job.running}
      preview={
        file && (
          <div className="flex flex-col gap-3">
            <VideoPreview ref={player} file={file} label={t.preview} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {n > 0 && (
                <p className="text-fg-2" aria-live="polite">
                  {t.will}: <span className="tabular text-2xl font-semibold text-fg">{count(locale, n, t.frames)}</span>
                </p>
              )}
              <Button variant="outline" onClick={grab}>
                <Camera aria-hidden />
                {t.grab}
              </Button>
            </div>
          </div>
        )
      }
      warning={probe.info && !probe.info.video?.canDecode && !probe.loading ? <Notice tone="warn">{t.unsupported}</Notice> : n > 1500 ? <Notice tone="warn">{t.many}</Notice> : null}
      options={
        <>
          <Field label={t.every} htmlFor={`${id}-s`} className="w-32">
            <Select id={`${id}-s`} size="sm" value={String(step)} onChange={(e) => (setStep(Number(e.target.value)), touch())}>
              {STEPS.map((s) => (
                <option key={s} value={s}>
                  {String(s).replace(".", locale === "ru" ? "," : ".")} {t.sec}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.format} htmlFor={`${id}-f`} className="w-28">
            <Select id={`${id}-f`} size="sm" value={format} onChange={(e) => (setFormat(e.target.value as typeof format), touch())}>
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </Select>
          </Field>
          <Field label={t.width} htmlFor={`${id}-w`} className="w-36">
            <Select id={`${id}-w`} size="sm" value={String(width)} onChange={(e) => (setWidth(Number(e.target.value)), touch())}>
              <option value="0">{t.original}</option>
              {[1920, 1280, 960, 640, 320].map((w) => (
                <option key={w} value={w}>
                  {w} {t.px}
                </option>
              ))}
            </Select>
          </Field>
        </>
      }
      action={{ label: t.run, onClick: run, disabled: !n || !probe.info?.video?.canDecode, icon: <Images aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        out ? (
          <Panel className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-fg-2" aria-live="polite">
                <span className="text-lg font-semibold text-fg">{count(locale, out.images.length, t.frames)}</span> · ZIP {formatBytes(locale, out.zip.size)}
              </p>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => downloadBlob(out.zip, `${base}-frames.zip`)}>
                  <Download aria-hidden />
                  {t.zip}
                </Button>
                <Button variant="outline" onClick={job.reset}>
                  {UI[locale].edit}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {out.images.slice(0, 24).map((im) => (
                <Thumb key={im.name} blob={im.blob} name={im.name} />
              ))}
            </div>
            {out.images.length > 24 && <p className="text-[13px] text-fg-3">{t.shown.replace("{n}", "24")}</p>}
          </Panel>
        ) : null
      }
    />
  );
}
