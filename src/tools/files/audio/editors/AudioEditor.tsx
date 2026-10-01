"use client";

import { Gauge, Play, Scissors, Square, Undo2, Volume2 } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Slider, Switch } from "@/ui/field";
import { Notice } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { AudioSession, runJob } from "@/tools/files/shared/client";
import type { AudioOps, LoadedInfo } from "@/tools/files/shared/ops-audio";
import { AUDIO_CODEC_OF, outputName, type AudioTarget, type JobResult } from "@/tools/files/shared/spec";
import { formatTime } from "@/tools/files/shared/time";
import { MEDIA_ACCEPT } from "@/tools/files/video/ui/FilePicker";
import { useAttachBlob, useJob, useProbe } from "@/tools/files/video/ui/hooks";
import { JobProgress, ProgressBar } from "@/tools/files/video/ui/Progress";
import { RangeSelector, TimeInput } from "@/tools/files/video/ui/RangeSelector";
import { ResultCard } from "@/tools/files/video/ui/ResultCard";
import { UI } from "@/tools/files/video/ui/strings";
import { Setting, StepSlider } from "@/tools/files/video/ui/options";
import { ChipChoice } from "@/ui/chip-choice";
import { Waveform } from "@/tools/files/video/ui/Waveform";
import { Workbench } from "@/tools/files/video/ui/Workbench";
import { fromDb, getAudioContext, toDb } from "../lib/audio";

export type EditorMode = "trim" | "volume" | "speed" | "reverse";

const TARGETS: AudioTarget[] = ["mp3", "wav", "m4a", "ogg", "opus", "flac"];
const LABEL: Record<AudioTarget, string> = { mp3: "MP3", wav: "WAV", m4a: "M4A", aac: "AAC", ogg: "OGG", opus: "Opus", flac: "FLAC" };

const T = {
  ru: {
    decoding: "Распаковываем звук…",
    start: "Начало",
    end: "Конец",
    selection: "Фрагмент",
    length: "Длина",
    fadeIn: "Плавное начало",
    fadeOut: "Плавный конец",
    none: "нет",
    sec: "с",
    play: "Прослушать",
    stop: "Стоп",
    format: "Формат",
    bitrate: "Битрейт",
    kbps: "кбит/с",
    gain: "Громкость",
    normalize: "Нормализовать",
    adjust: "Вручную",
    target: "Уровень пика",
    peakNow: "Пик сейчас",
    peakAfter: "после",
    clip: "Часть сигнала превысит 0 dBFS и будет ограничена — возможны искажения. Уменьшите усиление или выберите нормализацию.",
    speed: "Скорость",
    pitch: "Тональность",
    semis: "полутонов",
    keepPitch: "Сохранить высоту голоса",
    pitchNote: "Тональность слышна только в готовом файле",
    duration: "Длительность",
    run: { trim: "Обрезать", volume: "Применить громкость", speed: "Изменить скорость", reverse: "Развернуть задом наперёд" } as Record<EditorMode, string>,
    lossless: "Без перекодирования и потери качества",
    reverseNote: "Звук будет развёрнут целиком: конец станет началом.",
  },
  en: {
    decoding: "Decoding audio…",
    start: "Start",
    end: "End",
    selection: "Selection",
    length: "Length",
    fadeIn: "Fade in",
    fadeOut: "Fade out",
    none: "none",
    sec: "s",
    play: "Listen",
    stop: "Stop",
    format: "Format",
    bitrate: "Bitrate",
    kbps: "kbit/s",
    gain: "Volume",
    normalize: "Normalize",
    adjust: "Manual",
    target: "Peak level",
    peakNow: "Peak now",
    peakAfter: "after",
    clip: "Part of the signal will exceed 0 dBFS and be limited — this may distort. Lower the gain or use normalization.",
    speed: "Speed",
    pitch: "Pitch",
    semis: "semitones",
    keepPitch: "Keep voice pitch",
    pitchNote: "Pitch is only heard in the saved file",
    duration: "Duration",
    run: { trim: "Trim audio", volume: "Apply volume", speed: "Change speed", reverse: "Reverse audio" } as Record<EditorMode, string>,
    lossless: "No re-encoding, no quality loss",
    reverseNote: "The whole track is reversed: the end becomes the beginning.",
  },
} as const;

const FADES = [0, 0.5, 1, 2, 3, 5, 10];
const NORMS = [-6, -3, -2, -1, -0.1];
const SEMIS = Array.from({ length: 25 }, (_, i) => i - 12);
const BITRATES = [96, 128, 160, 192, 256, 320].map((k) => k * 1000);
const SPEEDS = ["0.5", "0.75", "0.9", "1", "1.1", "1.25", "1.5", "2"] as const;
const RUN_ICON: Record<EditorMode, ReactNode> = {
  trim: <Scissors aria-hidden />,
  volume: <Volume2 aria-hidden />,
  speed: <Gauge aria-hidden />,
  reverse: <Undo2 aria-hidden />,
};

function AudioEditorInner({ locale, mode }: { locale: Locale; mode: EditorMode }) {
  const t = T[locale];
  const u = UI[locale];
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const probe = useProbe(file);
  const session = useRef<AudioSession | null>(null);
  const load = useJob<LoadedInfo>();
  const job = useJob<JobResult>();
  const audio = useRef<HTMLAudioElement>(null);
  useAttachBlob(audio, file);
  const gainNode = useRef<GainNode | null>(null);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const stopAt = useRef<number | null>(null);

  const [sel, setSel] = useState<{ file: File; start: number; end: number } | null>(null);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [volMode, setVolMode] = useState<"gain" | "normalize">("gain");
  const [gainDb, setGainDb] = useState(6);
  const [normDb, setNormDb] = useState(-1);
  const [speed, setSpeed] = useState<string>("1.25");
  const [semis, setSemis] = useState(0);
  const [keepPitch, setKeepPitch] = useState(true);
  const [target, setTarget] = useState<AudioTarget | null>(null);
  const [bitrate, setBitrate] = useState(192_000);

  useEffect(
    () => () => {
      session.current?.dispose();
      gainNode.current?.disconnect();
    },
    [],
  );

  const info = load.status === "done" ? load.result : null;
  const duration = info?.duration ?? 0;
  const range = sel && sel.file === file ? sel : { file, start: 0, end: duration };
  const srcExt = probe.detected?.ext ?? "";
  const defTarget: AudioTarget = (TARGETS as string[]).includes(srcExt) ? (srcExt as AudioTarget) : srcExt === "m4a" || srcExt === "aac" ? "m4a" : "mp3";
  const out = target ?? defTarget;
  const lossy = out !== "wav" && out !== "flac";

  function choose(f: File) {
    job.reset();
    setFile(f);
    setSel(null);
    setTarget(null);
    session.current?.dispose();
    const s = new AudioSession();
    session.current = s;
    void load.run((hooks) => s.load("main", f, hooks));
  }

  // Playback: position tracking and stop at selection end.
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    let raf = 0;
    const tick = () => {
      if (stopAt.current !== null && a.currentTime >= stopAt.current) {
        a.pause();
        stopAt.current = null;
      }
      setPlayhead(a.currentTime);
      if (!a.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      setPlaying(true);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onPause);
    return () => {
      cancelAnimationFrame(raf);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onPause);
    };
  }, [audio, file]);

  // Live preview of speed and volume.
  const factor = Number(speed);
  const previewGain = mode === "volume" ? (volMode === "gain" ? fromDb(gainDb) : info && info.peak > 0 ? fromDb(normDb) / info.peak : 1) : 1;
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.playbackRate = mode === "speed" ? factor : 1;
    a.preservesPitch = keepPitch;
    if (gainNode.current) gainNode.current.gain.value = previewGain;
  }, [audio, mode, factor, keepPitch, previewGain, file]);

  function listen() {
    const a = audio.current;
    if (!a) return;
    if (!a.paused) {
      a.pause();
      return;
    }
    if (mode === "volume" && !gainNode.current) {
      // Route the element through a GainNode so the preview can be louder than 100 %.
      const ctx = getAudioContext();
      if (ctx) {
        const src = ctx.createMediaElementSource(a);
        const g = ctx.createGain();
        g.gain.value = previewGain;
        src.connect(g).connect(ctx.destination);
        gainNode.current = g;
        void ctx.resume();
      }
    }
    if (mode === "trim") {
      stopAt.current = range.end;
      a.currentTime = range.start;
    }
    void a.play().catch(() => undefined);
  }

  const touch = () => job.status === "done" && job.reset();
  const setRange = (start: number, end: number) => {
    if (!file) return;
    touch();
    setSel({ file, start, end });
  };

  // Trim without fades into the same codec → stream copy (lossless, instant).
  const sameCodec = !!probe.info?.audio && probe.info.audio.codec === AUDIO_CODEC_OF[out];
  const copyTrim = mode === "trim" && fadeIn === 0 && fadeOut === 0 && sameCodec && !probe.info?.video;

  function ops(): AudioOps {
    switch (mode) {
      case "trim":
        return { trim: { start: range.start, end: range.end }, fadeIn, fadeOut };
      case "volume":
        return volMode === "gain" ? { gainDb } : { normalize: { mode: "peak", targetDb: normDb } };
      case "speed":
        return { speed: { factor, keepPitch }, semitones: semis };
      case "reverse":
        return { reverse: true };
    }
  }

  const run = () => {
    const s = session.current;
    if (!file || !s) return;
    audio.current?.pause();
    if (copyTrim) {
      void job.run((hooks) => runJob(file, { target: out, trim: { start: range.start, end: range.end } }, hooks, probe.info));
      return;
    }
    void job.run((hooks) => s.render(["main"], ops(), out, bitrate, hooks));
  };

  const peakDb = info ? toDb(info.peak) : null;
  const afterDb = peakDb !== null && Number.isFinite(peakDb) ? (volMode === "gain" ? peakDb + gainDb : normDb) : null;
  const clipping = mode === "volume" && afterDb !== null && afterDb > 0.05;
  const decodedMb = info ? (info.duration * info.sampleRate * info.channels * 4) / 1048576 : 0;
  const ready = !!info;

  const fmtDb = (x: number) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${formatNumber(locale, Math.abs(x), { maximumFractionDigits: 1 })} dB`;

  const fmtFade = (f: number) => (f ? `${formatNumber(locale, f)} ${t.sec}` : t.none);
  const controls = (() => {
    switch (mode) {
      case "trim":
        return (
          <>
            <StepSlider label={t.fadeIn} value={fadeIn} steps={FADES} format={fmtFade} onChange={(x) => (setFadeIn(x), touch())} />
            <StepSlider label={t.fadeOut} value={fadeOut} steps={FADES} format={fmtFade} onChange={(x) => (setFadeOut(x), touch())} />
          </>
        );
      case "volume":
        return (
          <>
            <Segmented
              label={t.gain}
              value={volMode}
              onChange={(x) => (setVolMode(x), touch())}
              options={[
                { value: "gain", label: t.adjust },
                { value: "normalize", label: t.normalize },
              ]}
            />
            {volMode === "gain" ? (
              <div className="flex min-w-0 flex-col">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={`${id}-g`} className="text-sm font-medium text-fg-2">
                    {t.gain}
                  </label>
                  <output htmlFor={`${id}-g`} className="tabular text-3xl font-bold tracking-tight text-fg">
                    {fmtDb(gainDb)}
                  </output>
                </div>
                <Slider id={`${id}-g`} min={-20} max={20} step={0.5} value={gainDb} format={fmtDb} aria-valuetext={fmtDb(gainDb)} onChange={(e) => (setGainDb(Number(e.target.value)), touch())} />
                <div className="flex justify-between text-xs text-fg-3">
                  <span>{fmtDb(-20)}</span>
                  <span>{fmtDb(20)}</span>
                </div>
              </div>
            ) : (
              <StepSlider label={t.target} value={normDb} steps={NORMS} format={(x) => `${fmtDb(x)}FS`} onChange={(x) => (setNormDb(x), touch())} />
            )}
            {peakDb !== null && Number.isFinite(peakDb) && afterDb !== null && (
              <p className="tabular rounded-[1rem] bg-surface-2 px-4 py-3 text-sm text-fg-2" aria-live="polite">
                {t.peakNow}: {fmtDb(peakDb)}FS → {t.peakAfter}: <span className="font-semibold text-fg">{fmtDb(Math.min(afterDb, 0))}FS</span>
              </p>
            )}
          </>
        );
      case "speed":
        return (
          <>
            <Setting label={t.speed}>
              <ChipChoice label={t.speed} value={speed} onChange={(x) => (setSpeed(x), touch())} options={SPEEDS.map((x) => ({ value: x, label: `×${formatNumber(locale, Number(x))}` }))} />
            </Setting>
            <StepSlider label={t.pitch} value={semis} steps={SEMIS} format={(x) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x)} ${t.semis}`} onChange={(x) => (setSemis(x), touch())} />
            <Switch label={t.keepPitch} checked={keepPitch} onChange={(e) => (setKeepPitch(e.target.checked), touch())} />
            {semis !== 0 && <p className="-mt-3 text-[0.8125rem] text-fg-3">{t.pitchNote}</p>}
          </>
        );
      case "reverse":
        return <p className="text-sm text-fg-2">{t.reverseNote}</p>;
    }
  })();

  return (
    <Workbench
      locale={locale}
      kind="audio"
      accept={MEDIA_ACCEPT}
      file={file}
      onFile={choose}
      probe={probe}
      busy={job.running || load.running}
      preview={
        file && (
          <div className="flex flex-col gap-3">
            <audio ref={audio} preload="auto" className="hidden" />
            {load.running ? (
              <div className="flex flex-col gap-2 rounded-[1rem] bg-surface-2 px-4 py-3">
                <span className="text-sm text-fg-2">
                  {t.decoding} {Math.round(load.progress * 100)}%
                </span>
                <ProgressBar value={load.progress} label={t.decoding} className="bg-surface!" />
              </div>
            ) : load.status === "error" || load.status === "cancelled" ? (
              <JobProgress job={load} locale={locale} onCancel={load.cancel} onRetry={() => choose(file)} />
            ) : info ? (
              mode === "trim" ? (
                <>
                  <RangeSelector
                    duration={duration}
                    start={range.start}
                    end={range.end}
                    onChange={setRange}
                    playhead={playing ? playhead : null}
                    labels={{ start: t.start, end: t.end, selection: t.selection }}
                    background={<Waveform peaks={info.peaks} />}
                    step={0.05}
                    minLength={0.05}
                  />
                  <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                    <TimeInput label={t.start} value={range.start} max={duration} onCommit={(x) => setRange(Math.min(x, range.end - 0.05), range.end)} />
                    <TimeInput label={t.end} value={range.end} max={duration} onCommit={(x) => setRange(range.start, Math.max(x, range.start + 0.05))} />
                    <div className="flex flex-col sm:items-start">
                      <span className="text-sm text-fg-3">{t.length}</span>
                      <span className="tabular text-2xl font-bold tracking-tight text-fg">{formatTime(range.end - range.start, 2)}</span>
                    </div>
                    <Button variant="tonal" onClick={listen}>
                      {playing ? <Square aria-hidden /> : <Play aria-hidden />}
                      {playing ? t.stop : t.play}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative h-24 overflow-hidden rounded-[1rem] bg-surface-2 sm:h-28">
                    <Waveform peaks={info.peaks} />
                    {playing && playhead !== null && <div className="absolute inset-y-0 w-0.5 bg-fg" style={{ left: `${(playhead / duration) * 100}%` }} aria-hidden />}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="flex flex-col">
                      <span className="text-sm text-fg-3">{t.duration}</span>
                      <span className="tabular text-2xl font-bold tracking-tight text-fg" aria-live="polite">
                        {formatTime(duration, 1)}
                        {mode === "speed" && factor !== 1 ? ` → ${formatTime(duration / factor, 1)}` : ""}
                      </span>
                    </span>
                    {mode !== "reverse" && (
                      <Button variant="tonal" onClick={listen}>
                        {playing ? <Square aria-hidden /> : <Play aria-hidden />}
                        {playing ? t.stop : t.play}
                      </Button>
                    )}
                  </div>
                </>
              )
            ) : null}
          </div>
        )
      }
      warning={
        <>
          {decodedMb > 800 && <Notice tone="warn">{u.bigAudio.replace("{mb}", formatNumber(locale, Math.round(decodedMb)))}</Notice>}
          {clipping && <Notice tone="warn">{t.clip}</Notice>}
        </>
      }
      options={
        ready ? (
          <>
            {controls}
            <Setting label={t.format}>
              <ChipChoice label={t.format} value={out} onChange={(x) => (setTarget(x), touch())} options={TARGETS.map((x) => ({ value: x, label: LABEL[x] }))} />
            </Setting>
            {lossy && !copyTrim && <StepSlider label={t.bitrate} value={bitrate} steps={BITRATES.filter((k) => out !== "opus" || k <= 256000)} format={(k) => `${k / 1000} ${t.kbps}`} onChange={(x) => (setBitrate(x), touch())} />}
            {copyTrim && <p className="-mt-2 text-[0.8125rem] text-ok">{t.lossless}</p>}
          </>
        ) : null
      }
      action={ready ? { label: t.run[mode], onClick: run, disabled: mode === "trim" && !(range.end > range.start), icon: RUN_ICON[mode] } : undefined}
      status={<JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />}
      result={
        job.status === "done" && job.result && file ? (
          <ResultCard
            blob={job.result.blob}
            name={outputName(file.name, out, mode === "trim" ? "-trim" : mode === "reverse" ? "-reversed" : mode === "speed" ? `-x${speed}` : "-volume")}
            locale={locale}
            kind="audio"
            result={job.result}
            inputSize={file.size}
            onReset={job.reset}
            resetLabel={u.edit}
          />
        ) : null
      }
    />
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function AudioEditor(props: { locale: Locale; mode: EditorMode }) {
  return <AudioEditorInner key={props.mode} {...props} />;
}
