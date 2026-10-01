"use client";

import { Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Checkbox } from "@/ui/field";
import { Segmented } from "@/ui/segmented";
import { runJob } from "../shared/client";
import { outputName, type JobResult, type VideoTarget } from "../shared/spec";
import { formatTime } from "../shared/time";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";
import { VideoPreview, type PreviewHandle } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const SPEEDS = ["0.25", "0.5", "0.75", "1.25", "1.5", "2", "3", "4"] as const;

const T = {
  ru: {
    speed: "Скорость",
    keepPitch: "Сохранить высоту голоса (без эффекта «бурундука»)",
    length: "Длительность",
    run: "Изменить скорость",
    preview: "Предпросмотр видео (скорость применяется сразу)",
    slow: "Замедление",
    fast: "Ускорение",
  },
  en: {
    speed: "Speed",
    keepPitch: "Keep voice pitch (no chipmunk effect)",
    length: "Duration",
    run: "Change speed",
    preview: "Video preview (speed applies live)",
    slow: "Slow motion",
    fast: "Fast forward",
  },
} as const;

const CONTAINER: Record<string, VideoTarget> = { mp4: "mp4", m4v: "mp4", mov: "mov", mkv: "mkv", webm: "webm" };

function VideoSpeedInner({ locale, speed: speed0 = 2 }: { locale: Locale; speed?: number }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const player = useRef<PreviewHandle>(null);
  const [speed, setSpeed] = useState<string>(String(speed0));
  const [keepPitch, setKeepPitch] = useState(true);
  const factor = Number(speed);
  const target: VideoTarget = CONTAINER[probe.detected?.ext ?? ""] ?? "mp4";
  const d = probe.info?.duration ?? null;

  // Live preview: the browser applies playbackRate (and keeps pitch if asked).
  useEffect(() => {
    const v = player.current?.video();
    if (!v) return;
    v.playbackRate = factor;
    v.preservesPitch = keepPitch;
  }, [factor, keepPitch, file]);

  const touch = () => job.status === "done" && job.reset();
  const run = () => {
    if (!file) return;
    player.current?.pause();
    void job.run((hooks) => runJob(file, { target, speed: { factor, keepPitch } }, hooks, probe.info));
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
          <div className="flex flex-col gap-3">
            <VideoPreview ref={player} file={file} label={t.preview} />
            {d ? (
              <p className="text-fg-2" aria-live="polite">
                {t.length}:{" "}
                <span className="tabular text-2xl font-semibold text-fg">
                  {formatTime(d, 1)} → {formatTime(d / factor, 1)}
                </span>{" "}
                <span className="text-sm text-fg-3">({factor < 1 ? t.slow : t.fast} ×{formatNumber(locale, factor)})</span>
              </p>
            ) : null}
          </div>
        )
      }
      options={
        <div className="flex flex-col gap-3">
          <Segmented
            label={t.speed}
            value={speed as (typeof SPEEDS)[number]}
            onChange={(x) => {
              setSpeed(x);
              touch();
            }}
            options={SPEEDS.map((s) => ({ value: s, label: `×${formatNumber(locale, Number(s))}` }))}
            wrap
          />
          {probe.info?.audio !== null && (
            <Checkbox
              label={t.keepPitch}
              checked={keepPitch}
              onChange={(e) => {
                setKeepPitch(e.target.checked);
                touch();
              }}
            />
          )}
        </div>
      }
      action={{ label: t.run, onClick: run, icon: <Gauge aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, target, `-x${speed}`)} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function VideoSpeed(props: { locale: Locale; speed?: number }) {
  return <VideoSpeedInner key={String(props.speed ?? "")} {...props} />;
}
