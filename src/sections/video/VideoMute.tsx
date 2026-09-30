"use client";

import { VolumeX } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Notice } from "@/ui/panel";
import { runJob } from "./engine/client";
import { outputName, type JobResult, type VideoTarget } from "./engine/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { VideoPreview } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const T = {
  ru: {
    run: "Убрать звук",
    silent: "В этом видео уже нет звуковой дорожки.",
    note: "Видеодорожка копируется без перекодирования, поэтому качество не меняется, а обработка занимает секунды.",
    preview: "Предпросмотр видео",
  },
  en: {
    run: "Remove audio",
    silent: "This video already has no audio track.",
    note: "The video track is copied without re-encoding, so quality is unchanged and it takes seconds.",
    preview: "Video preview",
  },
} as const;

const CONTAINER: Record<string, VideoTarget> = { mp4: "mp4", m4v: "mp4", mov: "mov", mkv: "mkv", webm: "webm" };

export default function VideoMute({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const target: VideoTarget = CONTAINER[probe.detected?.ext ?? ""] ?? "mp4";
  const silent = !!probe.info?.readable && !probe.info.audio;

  const run = () => {
    if (!file) return;
    void job.run((hooks) => runJob(file, { target, audio: { discard: true } }, hooks, probe.info));
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
      preview={file && <VideoPreview file={file} label={t.preview} />}
      warning={silent ? <Notice>{t.silent}</Notice> : !probe.loading && file ? <p className="text-sm text-fg-3">{t.note}</p> : null}
      action={{ label: t.run, onClick: run, disabled: silent || probe.loading, icon: <VolumeX aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, target, "-muted")} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={() => { job.reset(); setFile(null); }} />
        ) : null
      }
    />
  );
}
