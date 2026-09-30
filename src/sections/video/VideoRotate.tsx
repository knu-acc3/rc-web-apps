"use client";

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/field";
import { runJob } from "./engine/client";
import { outputName, type JobResult, type Rotation, type VideoTarget } from "./engine/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";
import { VideoPreview } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const T = {
  ru: {
    left: "Повернуть влево на 90°",
    right: "Повернуть вправо на 90°",
    flipH: "Отразить по горизонтали",
    flipV: "Отразить по вертикали",
    angle: "Поворот",
    bake: "Перекодировать (поворот в пикселях, для любых плееров)",
    bakeHint: "Без перекодирования поворот записывается в метаданные: это мгновенно и без потери качества, но редкие старые плееры метаданные игнорируют.",
    run: "Сохранить видео",
    preview: "Предпросмотр видео",
    none: "Выберите поворот или отражение",
  },
  en: {
    left: "Rotate left 90°",
    right: "Rotate right 90°",
    flipH: "Flip horizontally",
    flipV: "Flip vertically",
    angle: "Rotation",
    bake: "Re-encode (rotate the pixels, works in every player)",
    bakeHint: "Without re-encoding the rotation is written as metadata: instant and lossless, but a few old players ignore it.",
    run: "Save video",
    preview: "Video preview",
    none: "Choose a rotation or flip",
  },
} as const;

const CONTAINER: Record<string, VideoTarget> = { mp4: "mp4", m4v: "mp4", mov: "mov", mkv: "mkv", webm: "webm" };

export default function VideoRotate({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const [rot, setRot] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [bake, setBake] = useState(false);

  const target: VideoTarget = CONTAINER[probe.detected?.ext ?? ""] ?? "mp4";
  // Vertical flip = 180° rotation + horizontal flip.
  const rotation = ((rot + (flipV ? 180 : 0)) % 360) as Rotation;
  const flip = flipH !== flipV;
  const nothing = rotation === 0 && !flip;
  const v = probe.info?.video;
  const scale = v && rot % 180 !== 0 ? Math.min(v.width, v.height) / Math.max(v.width, v.height) : 1;
  const touch = () => job.status === "done" && job.reset();

  const run = () => {
    if (!file || nothing) return;
    void job.run((hooks) => runJob(file, { target, video: { rotate: rotation, flip, bake: bake || flip } }, hooks, probe.info));
  };

  const iconBtn = "min-w-10";
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
          <div className="overflow-hidden rounded-[12px] bg-black">
            <div className="transition-transform duration-200" style={{ transform: `rotate(${rot}deg) scale(${flipH ? -scale : scale}, ${flipV ? -scale : scale})` }}>
              <VideoPreview file={file} label={t.preview} />
            </div>
          </div>
        )
      }
      options={
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.angle}>
            <Button variant="outline" className={iconBtn} onClick={() => (setRot((r) => (r + 270) % 360), touch())} aria-label={t.left} title={t.left}>
              <RotateCcw aria-hidden />
              <span className="tabular">−90°</span>
            </Button>
            <Button variant="outline" className={iconBtn} onClick={() => (setRot((r) => (r + 90) % 360), touch())} aria-label={t.right} title={t.right}>
              <RotateCw aria-hidden />
              <span className="tabular">+90°</span>
            </Button>
            <Button variant="outline" aria-pressed={flipH} className={cn(iconBtn, flipH && "border-accent! text-accent")} onClick={() => (setFlipH((x) => !x), touch())} aria-label={t.flipH} title={t.flipH}>
              <FlipHorizontal2 aria-hidden />
            </Button>
            <Button variant="outline" aria-pressed={flipV} className={cn(iconBtn, flipV && "border-accent! text-accent")} onClick={() => (setFlipV((x) => !x), touch())} aria-label={t.flipV} title={t.flipV}>
              <FlipVertical2 aria-hidden />
            </Button>
            <span className="tabular ml-1 text-2xl font-semibold text-fg" aria-live="polite">
              {rot}°{flipH ? " ⇋" : ""}
              {flipV ? " ⇅" : ""}
            </span>
          </div>
          {!flip && (
            <div className="flex flex-col gap-1">
              <Checkbox label={t.bake} checked={bake} onChange={(e) => (setBake(e.target.checked), touch())} />
              <p className="text-[13px] text-fg-3">{t.bakeHint}</p>
            </div>
          )}
        </div>
      }
      action={{ label: nothing ? t.none : t.run, onClick: run, disabled: nothing }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, target, "-rotated")} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}
