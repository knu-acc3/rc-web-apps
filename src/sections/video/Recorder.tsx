"use client";

import { Circle, Download, Pause, Play, Square } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { cssColor, getAudioContext, mediaErrorKind, openMicrophone, stopStream } from "@/sections/audio/lib/audio";
import { Button } from "@/ui/button";
import { Checkbox, Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { runJob } from "./engine/client";
import type { JobResult, Target } from "./engine/spec";
import { formatTime } from "./engine/time";
import { useJob } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";

type Mode = "screen" | "webcam" | "voice";

const T = {
  ru: {
    start: { screen: "Начать запись экрана", webcam: "Начать запись с камеры", voice: "Начать запись" },
    stop: "Остановить",
    pause: "Пауза",
    resume: "Продолжить",
    again: "Записать заново",
    systemAudio: "Звук вкладки или системы",
    mic: "Микрофон",
    quality: "Качество",
    mirror: "Зеркальный предпросмотр",
    clean: "Шумоподавление и эхо­подавление",
    format: "Формат записи",
    recording: "Идёт запись",
    paused: "Пауза",
    toMp4: "Сохранить в MP4",
    toMp3: "Сохранить в MP3",
    toWav: "Сохранить в WAV",
    live: "Живое изображение",
    errors: {
      denied: "Доступ запрещён. Разрешите его в настройках сайта в браузере и попробуйте снова.",
      notfound: "Устройство не найдено. Проверьте, что камера или микрофон подключены.",
      busy: "Устройство занято другой программой (например, видеозвонком). Закройте её и повторите.",
      insecure: "Запись работает только на защищённой странице (HTTPS).",
      unsupported: "Этот браузер не поддерживает такую запись.",
      other: "Не удалось начать запись.",
    },
    noScreen: "Запись экрана в этом браузере недоступна: мобильные браузеры её не поддерживают. Откройте страницу на компьютере в Chrome, Edge, Firefox или Safari.",
    finalizing: "Подготавливаем файл…",
    note: { screen: "Браузер спросит, что записывать: весь экран, окно или вкладку.", webcam: "Браузер попросит доступ к камере и микрофону.", voice: "Браузер попросит доступ к микрофону." },
  },
  en: {
    start: { screen: "Start screen recording", webcam: "Start webcam recording", voice: "Start recording" },
    stop: "Stop",
    pause: "Pause",
    resume: "Resume",
    again: "Record again",
    systemAudio: "Tab or system audio",
    mic: "Microphone",
    quality: "Quality",
    mirror: "Mirror preview",
    clean: "Noise and echo suppression",
    format: "Recording format",
    recording: "Recording",
    paused: "Paused",
    toMp4: "Save as MP4",
    toMp3: "Save as MP3",
    toWav: "Save as WAV",
    live: "Live view",
    errors: {
      denied: "Access was denied. Allow it in the browser's site settings and try again.",
      notfound: "No device found. Check that the camera or microphone is connected.",
      busy: "The device is used by another app (e.g. a video call). Close it and retry.",
      insecure: "Recording only works on a secure (HTTPS) page.",
      unsupported: "This browser doesn't support this kind of recording.",
      other: "Could not start recording.",
    },
    noScreen: "Screen recording isn't available in this browser: mobile browsers don't support it. Open the page on a computer in Chrome, Edge, Firefox or Safari.",
    finalizing: "Preparing the file…",
    note: { screen: "The browser will ask what to record: the whole screen, a window or a tab.", webcam: "The browser will ask for camera and microphone access.", voice: "The browser will ask for microphone access." },
  },
} as const;

const VIDEO_TYPES = ["video/mp4;codecs=avc1.42E01F,mp4a.40.2", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
const AUDIO_TYPES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm"];

function pickType(list: string[]): string {
  if (typeof MediaRecorder === "undefined") return "";
  return list.find((x) => MediaRecorder.isTypeSupported(x)) ?? "";
}
function extOf(type: string): string {
  if (type.includes("mp4")) return type.startsWith("audio") ? "m4a" : "mp4";
  if (type.includes("ogg")) return "ogg";
  return "webm";
}

const noop = () => () => {};

type State = { phase: "idle" } | { phase: "starting" } | { phase: "recording"; paused: boolean } | { phase: "finalizing" } | { phase: "done"; blob: Blob; name: string };

function RecorderInner({ locale, mode }: { locale: Locale; mode: Mode }) {
  const t = T[locale];
  const u = UI[locale];
  const id = useId();
  const canScreen = useSyncExternalStore(noop, () => !!navigator.mediaDevices?.getDisplayMedia, () => true);
  const fmt = useSyncExternalStore(noop, () => pickTypeLabel(mode), () => "");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [sysAudio, setSysAudio] = useState(true);
  const [mic, setMic] = useState(mode !== "screen");
  const [height, setHeight] = useState(720);
  const [mirror, setMirror] = useState(true);
  const [clean, setClean] = useState(true);
  const convert = useJob<JobResult>();
  const [converted, setConverted] = useState<{ blob: Blob; name: string; result: JobResult } | null>(null);

  const rec = useRef<MediaRecorder | null>(null);
  const streams = useRef<MediaStream[]>([]);
  const nodes = useRef<AudioNode[]>([]);
  const chunks = useRef<Blob[]>([]);
  const clock = useRef({ start: 0, paused: 0, pausedAt: 0 });
  const live = useRef<HTMLVideoElement>(null);
  const scope = useRef<HTMLCanvasElement>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const finalizer = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    streams.current.forEach(stopStream);
    streams.current = [];
    nodes.current.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        /* ignore */
      }
    });
    nodes.current = [];
    analyser.current = null;
    if (live.current) live.current.srcObject = null;
  }, []);

  useEffect(
    () => () => {
      finalizer.current?.abort();
      if (rec.current && rec.current.state !== "inactive") {
        rec.current.ondataavailable = null;
        rec.current.onstop = null;
        rec.current.stop();
      }
      cleanup();
    },
    [cleanup],
  );

  // Timer and voice oscilloscope while recording.
  const recording = state.phase === "recording";
  const paused = state.phase === "recording" && state.paused;
  useEffect(() => {
    if (!recording) return;
    let raf = 0;
    const buf = new Uint8Array(2048);
    const tick = () => {
      const c = clock.current;
      setElapsed(((c.pausedAt || performance.now()) - c.start - c.paused) / 1000);
      const cv = scope.current;
      const an = analyser.current;
      if (cv && an) {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.round(cv.clientWidth * dpr);
        const h = Math.round(cv.clientHeight * dpr);
        if (cv.width !== w) cv.width = w;
        if (cv.height !== h) cv.height = h;
        const g = cv.getContext("2d");
        if (g) {
          an.getByteTimeDomainData(buf);
          g.clearRect(0, 0, w, h);
          g.lineWidth = 2 * dpr;
          g.strokeStyle = cssColor("--accent", "#2952ff");
          g.beginPath();
          for (let i = 0; i < buf.length; i++) {
            const x = (i / (buf.length - 1)) * w;
            const y = (buf[i] / 255) * h;
            if (i) g.lineTo(x, y);
            else g.moveTo(x, y);
          }
          g.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording]);

  async function start() {
    setError(null);
    setConverted(null);
    convert.reset();
    setState({ phase: "starting" });
    try {
      const tracks: MediaStreamTrack[] = [];
      const audioSources: MediaStream[] = [];
      if (mode === "screen") {
        const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: sysAudio });
        streams.current.push(display);
        tracks.push(...display.getVideoTracks());
        if (display.getAudioTracks().length) audioSources.push(display);
        display.getVideoTracks()[0]?.addEventListener("ended", () => stop());
        if (mic) {
          const m = await openMicrophone({ raw: false });
          streams.current.push(m);
          audioSources.push(m);
        }
      } else if (mode === "webcam") {
        const cam = await navigator.mediaDevices.getUserMedia({ video: { height: { ideal: height }, frameRate: { ideal: 30 } }, audio: mic });
        streams.current.push(cam);
        tracks.push(...cam.getVideoTracks());
        if (mic) audioSources.push(cam);
      } else {
        const m = await openMicrophone({ raw: !clean });
        streams.current.push(m);
        audioSources.push(m);
      }

      // Mix several audio sources (screen audio + microphone) into one track.
      const ctx = audioSources.length ? getAudioContext() : null;
      if (ctx && ctx.state !== "running") await ctx.resume().catch(() => undefined);
      if (ctx && (audioSources.length > 1 || mode === "voice")) {
        const dest = ctx.createMediaStreamDestination();
        const an = ctx.createAnalyser();
        an.fftSize = 2048;
        for (const s of audioSources) {
          const src = ctx.createMediaStreamSource(s);
          src.connect(dest);
          src.connect(an);
          nodes.current.push(src);
        }
        nodes.current.push(dest, an);
        analyser.current = an;
        tracks.push(...dest.stream.getAudioTracks());
      } else {
        for (const s of audioSources) tracks.push(...s.getAudioTracks());
      }

      const stream = new MediaStream(tracks);
      if (live.current && mode !== "voice") {
        live.current.srcObject = new MediaStream(tracks.filter((x) => x.kind === "video"));
        void live.current.play().catch(() => undefined);
      }
      const type = pickType(mode === "voice" ? AUDIO_TYPES : VIDEO_TYPES);
      const r = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        const mime = r.mimeType || type || (mode === "voice" ? "audio/webm" : "video/webm");
        const blob = new Blob(chunks.current, { type: mime });
        chunks.current = [];
        cleanup();
        const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
        const prefix = mode === "screen" ? "screen" : mode === "webcam" ? "webcam" : "voice";
        const name = `${prefix}-${stamp}.${extOf(mime)}`;
        if (mode === "voice" || !mime.includes("webm")) {
          setState({ phase: "done", blob, name });
          return;
        }
        // MediaRecorder WebM files have no duration/seek index: remux once (stream copy) to fix that.
        setState({ phase: "finalizing" });
        const ctrl = new AbortController();
        finalizer.current = ctrl;
        runJob(new File([blob], name, { type: mime }), { target: "webm" }, { signal: ctrl.signal })
          .then((res) => !ctrl.signal.aborted && setState({ phase: "done", blob: res.blob, name }))
          .catch(() => !ctrl.signal.aborted && setState({ phase: "done", blob, name }));
      };
      r.start(1000);
      rec.current = r;
      clock.current = { start: performance.now(), paused: 0, pausedAt: 0 };
      setElapsed(0);
      setState({ phase: "recording", paused: false });
    } catch (e) {
      cleanup();
      setState({ phase: "idle" });
      const kind = mediaErrorKind(e);
      // Cancelling the screen picker is not an error worth shouting about.
      if (mode === "screen" && kind === "denied") return;
      setError(t.errors[kind]);
    }
  }

  function stop() {
    const r = rec.current;
    if (r && r.state !== "inactive") r.stop();
  }
  function togglePause() {
    const r = rec.current;
    if (!r) return;
    const c = clock.current;
    if (r.state === "recording") {
      r.pause();
      c.pausedAt = performance.now();
      setState({ phase: "recording", paused: true });
    } else if (r.state === "paused") {
      r.resume();
      c.paused += performance.now() - c.pausedAt;
      c.pausedAt = 0;
      setState({ phase: "recording", paused: false });
    }
  }

  const saveAs = (target: Target) => {
    if (state.phase !== "done") return;
    const blob = state.blob;
    const name = state.name.replace(/\.[^.]+$/, `.${target}`);
    void convert.run(async (hooks) => {
      const result = await runJob(new File([blob], state.name, { type: blob.type }), { target }, hooks);
      setConverted({ blob: result.blob, name, result });
      return result;
    });
  };

  if (mode === "screen" && !canScreen) return <Notice tone="warn">{t.noScreen}</Notice>;
  const idle = state.phase === "idle" || state.phase === "starting";

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex flex-col items-center gap-4 p-5">
        {mode !== "voice" ? (
          <div className="w-full overflow-hidden rounded-[10px] bg-black">
            <video ref={live} muted playsInline aria-label={t.live} className={`aspect-video w-full object-contain ${mode === "webcam" && mirror ? "-scale-x-100" : ""} ${recording ? "" : "hidden"}`} />
            {!recording && <div className="flex aspect-video w-full items-center justify-center text-sm text-white/70">{t.note[mode]}</div>}
          </div>
        ) : (
          <canvas ref={scope} className="h-24 w-full rounded-[10px] bg-surface-2" aria-hidden />
        )}
        <div className="flex flex-col items-center gap-1" aria-live="polite">
          <span className="tabular text-5xl font-semibold tracking-tight text-fg">{formatTime(recording ? elapsed : 0, 1)}</span>
          {recording && (
            <span className={`inline-flex items-center gap-1.5 text-sm ${paused ? "text-fg-3" : "text-err"}`}>
              <Circle className="size-2.5 fill-current" aria-hidden />
              {paused ? t.paused : t.recording}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {state.phase === "finalizing" ? (
            <p className="text-sm text-fg-3">{t.finalizing}</p>
          ) : idle ? (
            <Button variant="primary" size="lg" onClick={start} disabled={state.phase === "starting"}>
              <Circle className="fill-current" aria-hidden />
              {t.start[mode]}
            </Button>
          ) : recording ? (
            <>
              <Button variant="danger" size="lg" onClick={stop}>
                <Square className="fill-current" aria-hidden />
                {t.stop}
              </Button>
              <Button variant="outline" size="lg" onClick={togglePause}>
                {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
                {paused ? t.resume : t.pause}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="lg" onClick={() => setState({ phase: "idle" })}>
              <Circle aria-hidden />
              {t.again}
            </Button>
          )}
        </div>
        {idle && (
          <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-3">
            {mode === "screen" && <Checkbox label={t.systemAudio} checked={sysAudio} onChange={(e) => setSysAudio(e.target.checked)} />}
            {mode !== "voice" && <Checkbox label={t.mic} checked={mic} onChange={(e) => setMic(e.target.checked)} />}
            {mode === "webcam" && (
              <>
                <Checkbox label={t.mirror} checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
                <Field label={t.quality} htmlFor={`${id}-q`} className="w-28">
                  <Select id={`${id}-q`} size="sm" value={String(height)} onChange={(e) => setHeight(Number(e.target.value))}>
                    <option value="480">480p</option>
                    <option value="720">720p</option>
                    <option value="1080">1080p</option>
                  </Select>
                </Field>
              </>
            )}
            {mode === "voice" && <Checkbox label={t.clean} checked={clean} onChange={(e) => setClean(e.target.checked)} />}
          </div>
        )}
        {fmt && idle && (
          <p className="text-[13px] text-fg-3">
            {t.format}: {fmt} · {u.localNote}
          </p>
        )}
      </Panel>

      {error && <Notice tone="err">{error}</Notice>}

      {state.phase === "done" && (
        <ResultCard blob={state.blob} name={state.name} locale={locale} kind={mode === "voice" ? "audio" : "video"}>
          <div className="flex flex-wrap gap-2">
            {mode === "voice" ? (
              <>
                <Button variant="outline" size="sm" onClick={() => saveAs("mp3")} disabled={convert.running}>
                  {t.toMp3}
                </Button>
                <Button variant="outline" size="sm" onClick={() => saveAs("wav")} disabled={convert.running}>
                  {t.toWav}
                </Button>
              </>
            ) : (
              !state.blob.type.includes("mp4") && (
                <Button variant="outline" size="sm" onClick={() => saveAs("mp4")} disabled={convert.running}>
                  {t.toMp4}
                </Button>
              )
            )}
          </div>
          <JobProgress job={convert} locale={locale} onCancel={convert.cancel} />
          {converted && convert.status === "done" && (
            <Button variant="primary" onClick={() => downloadBlob(converted.blob, converted.name)} className="self-start">
              <Download aria-hidden />
              {converted.name} · {formatBytes(locale, converted.blob.size)}
            </Button>
          )}
        </ResultCard>
      )}
    </div>
  );
}

function pickTypeLabel(mode: Mode): string {
  const type = pickType(mode === "voice" ? AUDIO_TYPES : VIDEO_TYPES);
  if (!type) return "";
  const ext = extOf(type).toUpperCase();
  return type.includes("opus") ? `${ext} (Opus)` : type.includes("avc1") ? `${ext} (H.264)` : ext;
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function Recorder(props: { locale: Locale; mode: Mode }) {
  return <RecorderInner key={props.mode} {...props} />;
}
