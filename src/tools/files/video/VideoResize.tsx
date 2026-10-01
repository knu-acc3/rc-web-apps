"use client";

import { Crop } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { Segmented } from "@/ui/segmented";
import { aspectPlan, longSideFor, parseAspect, type AspectMode } from "../shared/aspect";
import { runJob } from "../shared/client";
import { outputName, type JobResult } from "../shared/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useProbe } from "./ui/hooks";
import { Setting } from "./ui/options";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";
import { VideoPreview } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const ASPECTS = ["9:16", "1:1", "4:5", "16:9", "4:3"] as const;

const T = {
  ru: {
    aspect: "Соотношение сторон",
    mode: "Как подогнать",
    crop: "Обрезать края",
    fit: "Вписать с полями",
    size: "Качество",
    keep: "Макс.",
    keepTitle: "Максимальное: без уменьшения",
    out: "Размер на выходе",
    run: "Изменить размер",
    preview: "Предпросмотр видео",
  },
  en: {
    aspect: "Aspect ratio",
    mode: "Fit",
    crop: "Crop edges",
    fit: "Fit with bars",
    size: "Quality",
    keep: "Max",
    keepTitle: "Maximum: no downscaling",
    out: "Output size",
    run: "Resize video",
    preview: "Video preview",
  },
} as const;

function VideoResizeInner({ locale, aspect: aspect0 = "9:16" }: { locale: Locale; aspect?: string }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const [aspect, setAspect] = useState<string>(aspect0);
  const [mode, setMode] = useState<AspectMode>("crop");
  const [preset, setPreset] = useState(1080);

  const v = probe.info?.video;
  const [aw, ah] = parseAspect(aspect) ?? [9, 16];
  const plan = v ? aspectPlan(v.width, v.height, aw, ah, mode, preset ? longSideFor(preset, aw, ah) : Infinity) : null;
  const changed = () => job.status === "done" && job.reset();

  const run = () => {
    if (!file || !plan) return;
    void job.run((hooks) =>
      runJob(file, { target: "mp4", video: { width: plan.width, height: plan.height, crop: plan.crop, fit: plan.fit ?? "fill", quality: "high" } }, hooks, probe.info),
    );
  };

  // Crop frame overlay in percent of the source picture.
  const overlay =
    v && plan?.crop ? { left: (plan.crop.left / v.width) * 100, top: (plan.crop.top / v.height) * 100, width: (plan.crop.width / v.width) * 100, height: (plan.crop.height / v.height) * 100 } : null;

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
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-full overflow-hidden rounded-[0.75rem]" style={v ? { maxWidth: `calc(55vh * ${v.width} / ${v.height})`, aspectRatio: `${v.width} / ${v.height}` } : undefined}>
              <VideoPreview file={file} label={t.preview} className="h-full w-full" style={{ width: "100%", height: "100%", maxHeight: "none" }} />
              {overlay && (
                <div
                  className="pointer-events-none absolute border-2 border-accent shadow-[0_0_0_100vmax_rgb(0_0_0/0.55)]"
                  style={{ left: `${overlay.left}%`, top: `${overlay.top}%`, width: `${overlay.width}%`, height: `${overlay.height}%` }}
                  aria-hidden
                />
              )}
            </div>
            {plan && (
              <p className="flex flex-wrap items-baseline justify-center gap-x-2 text-fg-2" aria-live="polite">
                <span className="text-sm text-fg-3">{t.out}</span>
                <span className="tabular text-2xl font-bold tracking-tight text-fg">
                  {plan.width}×{plan.height}
                </span>
              </p>
            )}
          </div>
        )
      }
      options={
        <>
          <Setting label={t.aspect}>
            <Segmented
              label={t.aspect}
              value={aspect as (typeof ASPECTS)[number]}
              onChange={(x) => {
                setAspect(x);
                changed();
              }}
              options={ASPECTS.map((a) => ({ value: a, label: a }))}
            />
          </Setting>
          <Setting label={t.mode}>
            <Segmented
              label={t.mode}
              value={mode}
              onChange={(x) => {
                setMode(x);
                changed();
              }}
              options={[
                { value: "crop", label: t.crop },
                { value: "fit", label: t.fit },
              ]}
            />
          </Setting>
          <Setting label={t.size}>
            <Segmented
              label={t.size}
              value={String(preset) as "1080" | "720" | "480" | "0"}
              onChange={(x) => {
                setPreset(Number(x));
                changed();
              }}
              options={[
                { value: "1080", label: "1080p" },
                { value: "720", label: "720p" },
                { value: "480", label: "480p" },
                { value: "0", label: t.keep, title: t.keepTitle },
              ]}
            />
          </Setting>
        </>
      }
      action={{ label: t.run, onClick: run, disabled: !plan, icon: <Crop aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard
            blob={job.result.blob}
            name={outputName(file.name, "mp4", `-${aspect.replace(":", "x")}`)}
            locale={locale}
            kind="video"
            result={job.result}
            inputSize={file.size}
            onReset={job.reset}
            resetLabel={UI[locale].edit}
          />
        ) : null
      }
    />
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function VideoResize(props: { locale: Locale; aspect?: string }) {
  return <VideoResizeInner key={props.aspect ?? ""} {...props} />;
}
