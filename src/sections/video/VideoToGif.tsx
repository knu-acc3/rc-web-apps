"use client";

import { ImagePlay } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatNumber } from "@/i18n/format";
import { Notice } from "@/ui/panel";
import { runJob } from "./engine/client";
import { GIF_HEAVY_PIXELS, gifFrameCount, gifSize, gifWorkload } from "./engine/gif";
import { outputName, type GifSpec, type JobResult } from "./engine/spec";
import { formatTime } from "./engine/time";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { Filmstrip } from "./ui/Filmstrip";
import { useJob, useProbe } from "./ui/hooks";
import { GIF_DEFAULT, GifOptions } from "./ui/options";
import { JobProgress } from "./ui/Progress";
import { RangeSelector, TimeInput } from "./ui/RangeSelector";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";
import { VideoPreview, type PreviewHandle } from "./ui/VideoPreview";
import { Workbench } from "./ui/Workbench";

const T = {
  ru: {
    start: "Начало",
    end: "Конец",
    selection: "Фрагмент",
    frames: ["кадр", "кадра", "кадров"],
    summary: "GIF {w}×{h}, {n}, {d}",
    heavy: "Получится очень большой GIF: попробуйте меньше ширину, меньше кадров в секунду или короткий фрагмент. Для длинных роликов MP4 или WebM весят в разы меньше.",
    run: "Сделать GIF",
    preview: "Предпросмотр видео",
    maxHint: "Для GIF обычно берут 2–10 секунд",
  },
  en: {
    start: "Start",
    end: "End",
    selection: "Selection",
    frames: ["frame", "frames"],
    summary: "GIF {w}×{h}, {n}, {d}",
    heavy: "This GIF will be very large: try a smaller width, fewer frames per second or a shorter clip. For long clips MP4 or WebM are many times smaller.",
    run: "Make GIF",
    preview: "Video preview",
    maxHint: "GIFs are usually 2–10 seconds long",
  },
} as const;

export default function VideoToGif({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const player = useRef<PreviewHandle>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [gif, setGif] = useState<GifSpec>(GIF_DEFAULT);
  const [sel, setSel] = useState<{ file: File; start: number; end: number } | null>(null);

  const duration = probe.info?.duration ?? null;
  const range = sel && sel.file === file ? sel : { file, start: 0, end: Math.min(duration ?? 0, 5) };
  const v = probe.info?.video;
  const size = v ? gifSize(v.width, v.height, gif.width) : null;
  const frames = gifFrameCount(range.end - range.start, gif.fps);
  const heavy = size ? gifWorkload(size.width, size.height, frames) > GIF_HEAVY_PIXELS : false;
  const reset = () => job.status === "done" && job.reset();
  const setRange = (start: number, end: number) => {
    if (!file) return;
    reset();
    setSel({ file, start, end });
  };

  const run = () => {
    if (!file || !(range.end > range.start)) return;
    player.current?.pause();
    void job.run((hooks) => runJob(file, { target: "gif", gif, trim: { start: range.start, end: range.end } }, hooks, probe.info));
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
        setSel(null);
      }}
      probe={probe}
      busy={job.running}
      preview={
        file && (
          <div className="flex flex-col gap-3">
            <VideoPreview ref={player} file={file} label={t.preview} onTime={setPlayhead} />
            {duration ? (
              <>
                <RangeSelector
                  duration={duration}
                  start={range.start}
                  end={range.end}
                  onChange={setRange}
                  playhead={playhead}
                  onSeek={(x) => player.current?.seek(x)}
                  labels={{ start: t.start, end: t.end, selection: t.selection }}
                  background={<Filmstrip file={file} count={10} />}
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_2fr] sm:items-end">
                  <TimeInput label={t.start} value={range.start} max={duration} onCommit={(x) => setRange(Math.min(x, range.end - 0.1), range.end)} />
                  <TimeInput label={t.end} value={range.end} max={duration} onCommit={(x) => setRange(range.start, Math.max(x, range.start + 0.1))} />
                  {size && (
                    <p className="col-span-2 text-lg font-semibold text-fg sm:col-span-1" aria-live="polite">
                      {t.summary
                        .replace("{w}", String(size.width))
                        .replace("{h}", String(size.height))
                        .replace("{n}", count(locale, frames, t.frames))
                        .replace("{d}", formatTime(range.end - range.start, 1))}
                      <span className="block text-[0.8125rem] font-normal text-fg-3">
                        {t.maxHint} · {formatNumber(locale, gif.fps)} fps
                      </span>
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )
      }
      warning={heavy ? <Notice tone="warn">{t.heavy}</Notice> : null}
      options={
        <GifOptions
          locale={locale}
          value={gif}
          onChange={(g) => {
            setGif(g);
            reset();
          }}
          disabled={job.running}
        />
      }
      action={{ label: t.run, onClick: run, disabled: !(range.end > range.start), icon: <ImagePlay aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, "gif")} locale={locale} kind="image" result={job.result} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}
