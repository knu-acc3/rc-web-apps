"use client";

import { Play, Scissors } from "lucide-react";
import { useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { Button } from "@/ui/button";
import { Segmented } from "@/ui/segmented";
import { runJob } from "../shared/client";
import { outputName, type JobResult, type VideoTarget } from "../shared/spec";
import { formatTime } from "../shared/time";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { Filmstrip } from "./ui/Filmstrip";
import { useJob, useProbe } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { RangeSelector, TimeInput } from "./ui/RangeSelector";
import { ResultCard } from "./ui/ResultCard";
import { VideoPreview, type PreviewHandle } from "./ui/VideoPreview";
import { UI } from "./ui/strings";
import { Workbench } from "./ui/Workbench";

const T = {
  ru: {
    start: "Начало",
    end: "Конец",
    selection: "Фрагмент",
    length: "Длина фрагмента",
    playSel: "Проиграть фрагмент",
    mode: "Режим",
    fast: "Быстро, без перекодирования",
    precise: "Точно до кадра",
    fastHint: "Разрез по ближайшим ключевым кадрам: начало может сдвинуться на долю секунды, качество не меняется.",
    preciseHint: "Видео перекодируется, поэтому границы совпадут до кадра. Занимает больше времени.",
    trim: "Обрезать видео",
    preview: "Предпросмотр видео",
  },
  en: {
    start: "Start",
    end: "End",
    selection: "Selection",
    length: "Clip length",
    playSel: "Play selection",
    mode: "Mode",
    fast: "Fast, no re-encoding",
    precise: "Frame-accurate",
    fastHint: "Cuts at the nearest key frames: the start may shift by a fraction of a second, quality is untouched.",
    preciseHint: "The video is re-encoded so the cut lands on the exact frame. Takes longer.",
    trim: "Trim video",
    preview: "Video preview",
  },
} as const;

const CONTAINER: Record<string, VideoTarget> = { mp4: "mp4", m4v: "mp4", mov: "mov", mkv: "mkv", webm: "webm" };

export default function VideoTrim({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const job = useJob<JobResult>();
  const player = useRef<PreviewHandle>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [mediaDuration, setMediaDuration] = useState<{ file: File; d: number } | null>(null);
  const [sel, setSel] = useState<{ file: File; start: number; end: number } | null>(null);
  const [precise, setPrecise] = useState(false);

  const duration = probe.info?.duration ?? (mediaDuration?.file === file ? mediaDuration.d : null);
  const range = sel && sel.file === file ? sel : { file, start: 0, end: duration ?? 0 };
  const target: VideoTarget = CONTAINER[probe.detected?.ext ?? ""] ?? "mp4";
  const length = Math.max(0, range.end - range.start);

  const choose = (f: File) => {
    job.reset();
    setFile(f);
    setSel(null);
    setPlayhead(null);
  };
  const setRange = (start: number, end: number) => {
    if (!file) return;
    if (job.status === "done") job.reset();
    setSel({ file, start, end });
  };

  const run = () => {
    if (!file || !(length > 0)) return;
    player.current?.pause();
    void job.run((hooks) => runJob(file, { target, trim: { start: range.start, end: range.end }, video: precise ? { forceTranscode: true } : undefined }, hooks, probe.info));
  };

  return (
    <Workbench
      locale={locale}
      kind="video"
      accept={VIDEO_ACCEPT}
      file={file}
      onFile={choose}
      probe={probe}
      busy={job.running}
      preview={
        file && (
          <div className="flex flex-col gap-3">
            <VideoPreview
              ref={player}
              file={file}
              label={t.preview}
              onTime={setPlayhead}
              onPlayable={() => {
                const d = player.current?.video()?.duration;
                if (d && Number.isFinite(d)) setMediaDuration({ file, d });
              }}
            />
            {duration ? (
              <>
                <RangeSelector
                  duration={duration}
                  start={range.start}
                  end={range.end}
                  onChange={setRange}
                  playhead={playhead}
                  onSeek={(tt) => player.current?.seek(tt)}
                  labels={{ start: t.start, end: t.end, selection: t.selection }}
                  background={<Filmstrip file={file} count={10} />}
                />
                <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <TimeInput label={t.start} value={range.start} max={duration} onCommit={(v) => setRange(Math.min(v, range.end - 0.1), range.end)} />
                  <TimeInput label={t.end} value={range.end} max={duration} onCommit={(v) => setRange(range.start, Math.max(v, range.start + 0.1))} />
                  <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-start sm:gap-0.5">
                    <span className="text-sm text-fg-3">{t.length}</span>
                    <span className="tabular text-2xl font-semibold text-fg">{formatTime(length, 2)}</span>
                  </div>
                  <Button variant="outline" onClick={() => player.current?.playRange(range.start, range.end)} className="col-span-2 sm:col-span-1">
                    <Play aria-hidden />
                    {t.playSel}
                  </Button>
                </div>
              </>
            ) : probe.loading ? null : (
              <div className="grid grid-cols-2 gap-3">
                <TimeInput label={t.start} value={range.start} onCommit={(v) => setRange(v, Math.max(range.end, v + 0.1))} />
                <TimeInput label={t.end} value={range.end} onCommit={(v) => setRange(Math.min(range.start, v - 0.1) < 0 ? 0 : range.start, v)} />
              </div>
            )}
          </div>
        )
      }
      options={
        <div className="flex flex-col gap-1.5">
          <Segmented
            label={t.mode}
            value={precise ? "precise" : "fast"}
            onChange={(v) => {
              setPrecise(v === "precise");
              if (job.status === "done") job.reset();
            }}
            options={[
              { value: "fast", label: t.fast },
              { value: "precise", label: t.precise },
            ]}
            size="sm"
          />
          <p className="text-[0.8125rem] text-fg-3">{precise ? t.preciseHint : t.fastHint}</p>
        </div>
      }
      action={{ label: t.trim, onClick: run, disabled: !(length > 0), icon: <Scissors aria-hidden /> }}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard blob={job.result.blob} name={outputName(file.name, target, "-trim")} locale={locale} kind="video" result={job.result} inputSize={file.size} onReset={job.reset} resetLabel={UI[locale].edit} />
        ) : null
      }
    />
  );
}
