"use client";

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw, Save } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button, IconButton } from "@/ui/button";
import { Switch } from "@/ui/field";
import { runJob } from "../shared/client";
import { outputName, type JobResult, type Rotation, type VideoTarget } from "../shared/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { Setting } from "./ui/options";
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
    bake: "Перекодировать",
    bakeHint: "Сейчас поворот запишется в метаданные: мгновенно и без потерь, но редкие старые плееры его не видят",
    bakeOn: "Поворот в пикселях — работает в любом плеере, но дольше",
    run: "Сохранить видео",
    preview: "Предпросмотр видео",
    none: "Выберите поворот",
  },
  en: {
    left: "Rotate left 90°",
    right: "Rotate right 90°",
    flipH: "Flip horizontally",
    flipV: "Flip vertically",
    angle: "Rotation",
    bake: "Re-encode",
    bakeHint: "The rotation goes into metadata: instant and lossless, but a few old players ignore it",
    bakeOn: "Rotates the pixels — works in every player, but takes longer",
    run: "Save video",
    preview: "Video preview",
    none: "Choose a rotation",
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
          <div className="overflow-hidden rounded-[1rem] bg-black">
            <div className="transition-transform duration-200" style={{ transform: `rotate(${rot}deg) scale(${flipH ? -scale : scale}, ${flipV ? -scale : scale})` }}>
              <VideoPreview file={file} label={t.preview} />
            </div>
          </div>
        )
      }
      options={
        <>
          <Setting label={t.angle} aside={<span className="tabular text-2xl font-bold tracking-tight text-fg" aria-live="polite">{rot}°{flipH ? " ⇋" : ""}{flipV ? " ⇅" : ""}</span>}>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.angle}>
              <Button variant="tonal" onClick={() => (setRot((r) => (r + 270) % 360), touch())} aria-label={t.left} title={t.left}>
                <RotateCcw aria-hidden />
                <span className="tabular">−90°</span>
              </Button>
              <Button variant="tonal" onClick={() => (setRot((r) => (r + 90) % 360), touch())} aria-label={t.right} title={t.right}>
                <RotateCw aria-hidden />
                <span className="tabular">+90°</span>
              </Button>
              <IconButton variant="outlined" selected={flipH} label={t.flipH} icon={<FlipHorizontal2 aria-hidden />} onClick={() => (setFlipH((x) => !x), touch())} />
              <IconButton variant="outlined" selected={flipV} label={t.flipV} icon={<FlipVertical2 aria-hidden />} onClick={() => (setFlipV((x) => !x), touch())} />
            </div>
          </Setting>
          {!flip && (
            <div className="flex flex-col gap-1">
              <Switch label={t.bake} checked={bake} onChange={(e) => (setBake(e.target.checked), touch())} />
              <p className="text-[0.8125rem] text-fg-3">{bake ? t.bakeOn : t.bakeHint}</p>
            </div>
          )}
        </>
      }
      action={{ label: nothing ? t.none : t.run, onClick: run, disabled: nothing, icon: nothing ? undefined : <Save aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, target, "-rotated")} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}
