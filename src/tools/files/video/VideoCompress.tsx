"use client";

import { Minimize2 } from "lucide-react";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber, parseNumber } from "@/i18n/format";
import { Field, Select } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { SliderField } from "@/ui/slider-field";
import { runJob } from "../shared/client";
import { bitrateForSize, estimateBytes, even, outputName, suggestedBitrate, type JobResult, type QualityLevel } from "../shared/spec";
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
    mode: "Способ",
    byQuality: "По качеству",
    bySize: "До размера",
    quality: "Качество",
    high: "Высокое",
    medium: "Среднее",
    low: "Низкое",
    resolution: "Разрешение",
    original: "Как в исходнике",
    target: "Нужный размер",
    mb: "МБ",
    estimate: "Получится примерно",
    estimateNote: "{v} видео + {a} звук · точность ±15 %",
    tooSmall: "Для такой длительности это слишком мало: видео получится неразборчивым. Увеличьте размер или обрежьте видео.",
    noGain: "Исходный битрейт уже ниже выбранного — сильного уменьшения не будет. Выберите качество ниже или меньшее разрешение.",
    already: "Файл уже меньше этого размера — укажите размер поменьше.",
    run: "Сжать видео",
    preview: "Предпросмотр видео",
    presets: "Частые ограничения",
  },
  en: {
    mode: "Method",
    byQuality: "By quality",
    bySize: "To a size",
    quality: "Quality",
    high: "High",
    medium: "Medium",
    low: "Low",
    resolution: "Resolution",
    original: "Same as source",
    target: "Target size",
    mb: "MB",
    estimate: "Expected size",
    estimateNote: "{v} video + {a} audio · accurate to ±15%",
    tooSmall: "Too small for this duration — the video would be unwatchable. Increase the size or trim the video.",
    noGain: "The source bitrate is already below this setting, so the file won't shrink much. Pick lower quality or a smaller resolution.",
    already: "The file is already smaller than this — choose a smaller size.",
    run: "Compress video",
    preview: "Video preview",
    presets: "Common limits",
  },
} as const;

const HEIGHTS = [1080, 720, 540, 480, 360];
/** Size limits people compress for: Discord without Nitro, a Gmail attachment. */
const PRESETS: { mb: number; where: string }[] = [
  { mb: 10, where: "Discord" },
  { mb: 25, where: "Gmail" },
];

function rate(locale: Locale, bps: number): string {
  const u = UI[locale];
  return bps >= 1e6 ? `${formatNumber(locale, bps / 1e6, { maximumFractionDigits: 1 })} ${u.mbps}` : `${formatNumber(locale, Math.round(bps / 1000))} ${u.kbps}`;
}

export default function VideoCompress({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const [mode, setMode] = useState<"quality" | "size">("quality");
  const [quality, setQuality] = useState<QualityLevel>("medium");
  const [height, setHeight] = useState(0);
  const [sizeText, setSizeText] = useState("25");

  const info = probe.info;
  const v = info?.video;
  const dur = info?.duration ?? 0;
  const audioBps = info?.audio ? 128_000 : 0;

  // Output dimensions (never upscale, even numbers).
  let outH = v ? v.height : 0;
  let outW = v ? v.width : 0;
  let videoBps = 0;
  let error: string | null = null;
  if (v && dur > 0) {
    const fps = v.fps ?? 30;
    if (mode === "quality") {
      if (height && height < v.height) {
        outH = even(height);
        outW = even((v.width * height) / v.height);
      }
      videoBps = suggestedBitrate(outW, outH, fps, quality);
    } else {
      const mb = parseNumber(sizeText);
      const aBps = mb && mb < 5 ? 64_000 : audioBps;
      const br = mb && mb > 0 ? bitrateForSize(mb * 1024 * 1024, dur, info?.audio ? aBps : 0) : null;
      if (!br) error = t.tooSmall;
      else {
        videoBps = br;
        // Pick the largest resolution that still gets at least "low" quality bits per pixel.
        for (const h of [v.height, ...HEIGHTS.filter((x) => x < v.height)]) {
          const w = even((v.width * h) / v.height);
          outH = even(h);
          outW = w;
          if (br >= suggestedBitrate(w, h, fps, "low")) break;
        }
      }
    }
  }
  const estimate = videoBps ? estimateBytes(videoBps, audioBps, dur) : 0;
  // The size slider ends at the file's own size (smaller is the point), but never below 10 MB.
  const sizeMax = Math.max(10, Math.ceil((file?.size ?? 0) / 1024 / 1024));
  const noGain = !!(v?.bitrate && videoBps && videoBps >= v.bitrate * 0.9);
  // "Compress to 25 MB" a file that already weighs less: nothing to gain (the bitrate may be unknown, e.g. WebM).
  const already = mode === "size" && !!file && (parseNumber(sizeText) ?? 0) * 1024 * 1024 >= file.size;
  const reset = () => job.status === "done" && job.reset();

  const run = () => {
    if (!file || !videoBps) return;
    void job.run((hooks) =>
      runJob(
        file,
        {
          target: "mp4",
          video: { width: outW !== v?.width || outH !== v?.height ? outW : undefined, height: outW !== v?.width || outH !== v?.height ? outH : undefined, bitrate: videoBps, forceTranscode: true },
          audio: info?.audio ? { bitrate: mode === "size" && (parseNumber(sizeText) ?? 99) < 5 ? 64_000 : 128_000 } : undefined,
        },
        hooks,
        info,
      ),
    );
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
      warning={error ? <Notice tone="warn">{error}</Notice> : already ? <Notice>{t.already}</Notice> : noGain ? <Notice>{t.noGain}</Notice> : null}
      options={
        <>
          <Segmented
            label={t.mode}
            value={mode}
            fill
            onChange={(x) => {
              setMode(x);
              reset();
            }}
            options={[
              { value: "quality", label: t.byQuality },
              { value: "size", label: t.bySize },
            ]}
          />
          {mode === "quality" ? (
            <>
              <Setting label={t.quality}>
                <Segmented
                  label={t.quality}
                  value={quality}
                  onChange={(x) => {
                    setQuality(x);
                    reset();
                  }}
                  options={[
                    { value: "high", label: t.high },
                    { value: "medium", label: t.medium },
                    { value: "low", label: t.low },
                  ]}
                />
              </Setting>
              <Field label={t.resolution} htmlFor={`${id}-h`}>
                <Select
                  id={`${id}-h`}
                  value={String(height)}
                  onChange={(e) => {
                    setHeight(Number(e.target.value));
                    reset();
                  }}
                >
                  <option value="0">{t.original}</option>
                  {HEIGHTS.map((h) => (
                    <option key={h} value={h}>
                      {h}p
                    </option>
                  ))}
                </Select>
              </Field>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <SliderField
                id={`${id}-s`}
                label={t.target}
                value={sizeText}
                onChange={(x) => {
                  setSizeText(x);
                  reset();
                }}
                parse={parseNumber}
                format={(n) => formatNumber(locale, n, { maximumFractionDigits: n < 10 ? 1 : 0 })}
                min={1}
                max={sizeMax}
                step={sizeMax > 100 ? undefined : 1}
                scale={sizeMax > 100 ? "log" : "linear"}
                suffix={t.mb}
              />
              <div className="flex flex-wrap gap-2" role="group" aria-label={t.presets}>
                {PRESETS.map((p) => (
                  <button
                    key={p.mb}
                    type="button"
                    className="chip tabular"
                    aria-pressed={parseNumber(sizeText) === p.mb}
                    onClick={() => {
                      setSizeText(String(p.mb));
                      reset();
                    }}
                  >
                    {p.mb} {t.mb}
                    <span className="font-normal opacity-70">{p.where}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {estimate > 0 && !error && (
            <div className="rounded-[1rem] bg-surface-2 px-4 py-3" aria-live="polite">
              <div className="text-sm text-fg-2">{t.estimate}</div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="tabular text-3xl font-bold tracking-tight text-fg">≈ {formatBytes(locale, estimate)}</span>
                <span className="tabular text-fg-2">
                  {outW}×{outH}
                </span>
              </div>
              <p className="mt-0.5 text-[0.8125rem] text-fg-3">{t.estimateNote.replace("{v}", rate(locale, videoBps)).replace("{a}", rate(locale, audioBps))}</p>
            </div>
          )}
        </>
      }
      action={{ label: t.run, onClick: run, disabled: !videoBps || !!error, icon: <Minimize2 aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, "mp4", "-compressed")} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}
