"use client";

import { Circle, Download, Mic, MicOff, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button, IconButton } from "@/ui/button";
import { Field, Select, Switch } from "@/ui/field";
import { Badge, Notice, Panel } from "@/ui/panel";
import { isClipping, meterFraction, noiseFloor, noiseRating, rmsPeak, toDbfs, type NoiseRating } from "./lib/audio-level";
import { useClientValue } from "./lib/client";
import { cssVar, extFromMime, hasGetUserMedia, listDevices, mediaErrorStatus, pickRecorderMime, stopStream, type DeviceOption, type MediaStatus } from "./lib/media";
import { MediaStatusNotice, PermissionHelp } from "./ui/PermissionHelp";

const REC_SECONDS = 10;

const T = {
  ru: {
    start: "Включить микрофон",
    starting: "Запрашиваем доступ…",
    stop: "Выключить",
    retry: "Попробовать снова",
    intro: "Браузер спросит разрешение на доступ к микрофону. Звук анализируется только на этом устройстве и никуда не отправляется.",
    device: "Микрофон",
    deviceN: (n: number) => `Микрофон ${n}`,
    level: "Уровень сигнала",
    rms: "Средний уровень (RMS)",
    peak: "Пик",
    floor: "Шумовой фон",
    floorWait: "Помолчите пару секунд…",
    clip: "Перегрузка! Отодвиньтесь или уменьшите усиление",
    silent: "Сигнала нет — скажите что-нибудь или проверьте, не выключен ли микрофон",
    rating: { excellent: "очень тихо", good: "тихо", fair: "заметный шум", noisy: "шумно" } satisfies Record<NoiseRating, string>,
    spectrum: "Спектр",
    processing: "Обработка звука браузером",
    ec: "Эхоподавление",
    ns: "Шумоподавление",
    agc: "Автоусиление",
    procHint: "Переключение перезапускает микрофон. Выключите всё, чтобы услышать «сырой» сигнал.",
    record: `Записать ${REC_SECONDS} секунд`,
    recording: "Идёт запись",
    stopRec: "Остановить",
    recHint: "Запись хранится только в этой вкладке. Прослушайте её в наушниках, чтобы услышать себя так, как слышат собеседники.",
    recUnsupported: "Этот браузер не умеет записывать звук (MediaRecorder недоступен), но уровень сигнала проверить можно.",
    yourRec: "Ваша запись",
    download: "Скачать",
    settings: "Параметры потока",
    sampleRate: "Частота дискретизации",
    channels: "Каналов",
    on: "вкл.",
    off: "выкл.",
    hz: "Гц",
    sec: "с",
  },
  en: {
    start: "Start microphone",
    starting: "Requesting access…",
    stop: "Turn off",
    retry: "Try again",
    intro: "Your browser will ask for microphone permission. Audio is analysed on this device only and is never uploaded.",
    device: "Microphone",
    deviceN: (n: number) => `Microphone ${n}`,
    level: "Signal level",
    rms: "Average level (RMS)",
    peak: "Peak",
    floor: "Noise floor",
    floorWait: "Stay quiet for a couple of seconds…",
    clip: "Clipping! Move back or lower the gain",
    silent: "No signal — say something or check that the mic isn't muted",
    rating: { excellent: "very quiet", good: "quiet", fair: "noticeable noise", noisy: "noisy" } satisfies Record<NoiseRating, string>,
    spectrum: "Spectrum",
    processing: "Browser audio processing",
    ec: "Echo cancellation",
    ns: "Noise suppression",
    agc: "Auto gain",
    procHint: "Switching restarts the microphone. Turn everything off to hear the raw signal.",
    record: `Record ${REC_SECONDS} seconds`,
    recording: "Recording",
    stopRec: "Stop",
    recHint: "The recording stays in this tab only. Listen with headphones to hear yourself the way others do.",
    recUnsupported: "This browser can't record audio (MediaRecorder is unavailable), but you can still check the level.",
    yourRec: "Your recording",
    download: "Download",
    settings: "Stream settings",
    sampleRate: "Sample rate",
    channels: "Channels",
    on: "on",
    off: "off",
    hz: "Hz",
    sec: "s",
  },
} as const;

type ProcKey = "echoCancellation" | "noiseSuppression" | "autoGainControl";
type Proc = Record<ProcKey, boolean>;
const PROC_KEYS: ProcKey[] = ["echoCancellation", "noiseSuppression", "autoGainControl"];

interface Levels {
  rms: number;
  peak: number;
  floor: number | null;
  clip: boolean;
}

interface Rec {
  url: string;
  blob: Blob;
  seconds: number;
}

/** Mutable, non-rendered resources of one mounted instance. */
interface Res {
  disposed: boolean;
  /** Incremented by every start(); stale getUserMedia results are discarded. */
  gen: number;
  stream: MediaStream | null;
  ctx: AudioContext | null;
  raf: number;
  recorder: MediaRecorder | null;
  recTimer: number;
  url: string | null;
}

function releaseAudio(r: Res) {
  cancelAnimationFrame(r.raf);
  r.raf = 0;
  window.clearInterval(r.recTimer);
  if (r.recorder) {
    r.recorder.ondataavailable = null;
    r.recorder.onstop = null;
    if (r.recorder.state !== "inactive") {
      try {
        r.recorder.stop();
      } catch {
        // already stopped
      }
    }
    r.recorder = null;
  }
  stopStream(r.stream);
  r.stream = null;
  if (r.ctx) {
    r.ctx.close().catch(() => {});
    r.ctx = null;
  }
}

function drawSpectrum(canvas: HTMLCanvasElement | null, an: AnalyserNode, data: Uint8Array<ArrayBuffer>, color: string) {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const g = canvas.getContext("2d");
  if (!g) return;
  an.getByteFrequencyData(data);
  g.clearRect(0, 0, w, h);
  g.fillStyle = color;
  const bars = Math.max(16, Math.min(96, Math.floor(w / (6 * dpr))));
  const nyquist = an.context.sampleRate / 2;
  const fMin = 40;
  const fMax = Math.min(16000, nyquist);
  const gap = Math.max(1, dpr);
  const bw = w / bars;
  for (let i = 0; i < bars; i++) {
    const f0 = fMin * (fMax / fMin) ** (i / bars);
    const f1 = fMin * (fMax / fMin) ** ((i + 1) / bars);
    const b0 = Math.floor((f0 / nyquist) * data.length);
    const b1 = Math.max(b0 + 1, Math.floor((f1 / nyquist) * data.length));
    let v = 0;
    for (let b = b0; b < b1 && b < data.length; b++) v = Math.max(v, data[b]);
    const bh = (v / 255) * h;
    g.fillRect(i * bw, h - bh, Math.max(1, bw - gap), bh);
  }
}

const TICKS = [-60, -48, -36, -24, -12, -6, 0];

export default function MicrophoneTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const supported = useClientValue(hasGetUserMedia, true);
  const canRecord = useClientValue(() => typeof MediaRecorder !== "undefined", true);
  const [status, setStatus] = useState<MediaStatus>("idle");
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [proc, setProc] = useState<Proc>({ echoCancellation: true, noiseSuppression: true, autoGainControl: true });
  const [procSupported, setProcSupported] = useState<Record<ProcKey, boolean>>({ echoCancellation: false, noiseSuppression: false, autoGainControl: false });
  const [settings, setSettings] = useState<MediaTrackSettings | null>(null);
  const [label, setLabel] = useState("");
  const [levels, setLevels] = useState<Levels | null>(null);
  const [recElapsed, setRecElapsed] = useState<number | null>(null);
  const [rec, setRec] = useState<Rec | null>(null);

  const resRef = useRef<Res | null>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const r: Res = { disposed: false, gen: 0, stream: null, ctx: null, raf: 0, recorder: null, recTimer: 0, url: null };
    resRef.current = r;
    return () => {
      r.disposed = true;
      releaseAudio(r);
      if (r.url) URL.revokeObjectURL(r.url);
      r.url = null;
    };
  }, []);

  // Keep the device list current while the microphone is on.
  useEffect(() => {
    if (status !== "live" || !navigator.mediaDevices?.addEventListener) return;
    const onChange = () => {
      listDevices("audioinput", t.deviceN).then(setDevices);
    };
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", onChange);
  }, [status, t]);

  async function start(nextDevice: string, nextProc: Proc) {
    const r = resRef.current;
    if (!r) return;
    releaseAudio(r);
    setRecElapsed(null);
    setLevels(null);
    if (!hasGetUserMedia()) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    const supportedC = navigator.mediaDevices.getSupportedConstraints?.() ?? {};
    const audio: MediaTrackConstraints = {};
    if (nextDevice) audio.deviceId = { exact: nextDevice };
    for (const k of PROC_KEYS) if (supportedC[k]) audio[k] = nextProc[k];
    const gen = ++r.gen;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
    } catch (e) {
      if (!r.disposed && gen === r.gen) setStatus(mediaErrorStatus(e));
      return;
    }
    // unmounted, or a newer start() superseded this one while we waited
    if (r.disposed || gen !== r.gen) {
      stopStream(stream);
      return;
    }
    r.stream = stream;
    const track = stream.getAudioTracks()[0];
    const s = track?.getSettings() ?? {};
    track?.addEventListener("ended", () => {
      if (r.stream === stream) {
        releaseAudio(r);
        setStatus("ended");
      }
    });
    setSettings(s);
    setLabel(track?.label ?? "");
    setProcSupported({
      echoCancellation: !!supportedC.echoCancellation,
      noiseSuppression: !!supportedC.noiseSuppression,
      autoGainControl: !!supportedC.autoGainControl,
    });
    setProc({
      echoCancellation: s.echoCancellation ?? nextProc.echoCancellation,
      noiseSuppression: s.noiseSuppression ?? nextProc.noiseSuppression,
      autoGainControl: s.autoGainControl ?? nextProc.autoGainControl,
    });
    setDeviceId(s.deviceId ?? nextDevice);
    listDevices("audioinput", t.deviceN).then((list) => {
      if (!r.disposed) setDevices(list);
    });

    const ctx = new AudioContext();
    r.ctx = ctx;
    ctx.resume().catch(() => {});
    const an = ctx.createAnalyser();
    an.fftSize = 2048;
    an.smoothingTimeConstant = 0.7;
    ctx.createMediaStreamSource(stream).connect(an); // not connected to the speakers — no feedback
    const buf = new Float32Array(an.fftSize);
    const freq = new Uint8Array(an.frequencyBinCount);
    const history: number[] = [];
    let hold = -100;
    let holdAt = 0;
    let clipUntil = 0;
    let lastUi = 0;
    let color = cssVar("--accent", "#2952ff");
    const loop = (now: number) => {
      an.getFloatTimeDomainData(buf);
      const { rms, peak } = rmsPeak(buf);
      const rmsDb = toDbfs(rms);
      const peakDb = toDbfs(peak);
      history.push(rmsDb);
      if (history.length > 360) history.shift();
      if (peakDb >= hold || now - holdAt > 1500) {
        hold = peakDb;
        holdAt = now;
      }
      if (isClipping(peak)) clipUntil = now + 1500;
      if (coverRef.current) coverRef.current.style.width = `${(1 - meterFraction(rmsDb)) * 100}%`;
      if (peakRef.current) peakRef.current.style.left = `calc(${meterFraction(hold) * 100}% - 1px)`;
      if (now - lastUi > 150) {
        lastUi = now;
        color = cssVar("--accent", color);
        setLevels({ rms: rmsDb, peak: hold, floor: noiseFloor(history), clip: now < clipUntil });
      }
      drawSpectrum(canvasRef.current, an, freq, color);
      r.raf = requestAnimationFrame(loop);
    };
    r.raf = requestAnimationFrame(loop);
    setStatus("live");
  }

  function stop() {
    const r = resRef.current;
    if (r) {
      r.gen++;
      releaseAudio(r);
    }
    setRecElapsed(null);
    setLevels(null);
    setStatus("idle");
  }

  function record() {
    const r = resRef.current;
    if (!r?.stream || typeof MediaRecorder === "undefined") return;
    const mime = pickRecorderMime();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(r.stream, mime ? { mimeType: mime } : undefined);
    } catch {
      return;
    }
    const chunks: Blob[] = [];
    const t0 = performance.now();
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      window.clearInterval(r.recTimer);
      r.recorder = null;
      setRecElapsed(null);
      if (r.disposed || !chunks.length) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || mime || "audio/webm" });
      if (r.url) URL.revokeObjectURL(r.url);
      r.url = URL.createObjectURL(blob);
      setRec({ url: r.url, blob, seconds: Math.min(REC_SECONDS, (performance.now() - t0) / 1000) });
    };
    recorder.start();
    r.recorder = recorder;
    setRecElapsed(0);
    r.recTimer = window.setInterval(() => {
      const el = (performance.now() - t0) / 1000;
      if (el >= REC_SECONDS && recorder.state === "recording") recorder.stop();
      else setRecElapsed(el);
    }, 100);
  }

  function stopRecording() {
    const rec = resRef.current?.recorder;
    if (rec && rec.state === "recording") rec.stop();
  }

  const live = status === "live";
  const fmtDb = (db: number) => (db <= -99 ? "−∞" : formatNumber(locale, db, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).replace("-", "−"));
  const specTicks: [number, string][] = [
    [40, `40 ${t.hz}`],
    [100, "100"],
    [250, "250"],
    [1000, "1k"],
    [4000, "4k"],
    [16000, "16k"],
  ];

  if (!live)
    return (
      <div className="flex flex-col gap-4">
        <Panel className="flex flex-col items-center gap-4 px-4 py-10 text-center sm:py-14">
          <span className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden>
            <Mic className="size-10" />
          </span>
          <Button variant="filled" size="xl" onClick={() => start(deviceId, proc)} disabled={!supported} loading={status === "requesting"}>
            {status !== "requesting" && <Mic aria-hidden />}
            {status === "requesting" ? t.starting : status === "idle" ? t.start : t.retry}
          </Button>
          <p className="max-w-md text-sm text-fg-3">{t.intro}</p>
          <MediaStatusNotice locale={locale} kind="microphone" status={supported ? status : "unsupported"} />
        </Panel>
        <PermissionHelp locale={locale} kind="microphone" open={status === "denied"} />
      </div>
    );

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-6">
      <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t.device} htmlFor={`${id}-dev`} className="min-w-0 flex-1 basis-60">
            <Select
              id={`${id}-dev`}
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                start(e.target.value, proc);
              }}
            >
              {devices.length === 0 && <option value={deviceId}>{label || t.deviceN(1)}</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="tonal" onClick={stop}>
            <MicOff aria-hidden />
            {t.stop}
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div>
              <div className="tabular text-5xl font-bold tracking-tight text-fg sm:text-6xl">
                {levels ? fmtDb(levels.rms) : "—"} <span className="text-2xl font-semibold text-fg-3">dBFS</span>
              </div>
              <div className="text-sm text-fg-2">{t.rms}</div>
            </div>
            {levels?.clip ? <Badge tone="err">{t.clip}</Badge> : levels && levels.peak < -70 ? <span className="text-sm text-fg-3">{t.silent}</span> : null}
          </div>
          <div className="relative mt-1 h-6 overflow-hidden rounded-full bg-[linear-gradient(to_right,var(--ok)_0%,var(--ok)_70%,var(--warn)_80%,var(--err)_95%)]" role="img" aria-label={t.level}>
            <div ref={coverRef} className="absolute inset-y-0 right-0 w-full bg-surface-2" />
            <div ref={peakRef} className="absolute inset-y-0 left-0 w-0.5 bg-fg" />
          </div>
          <div className="relative h-4 text-[0.6875rem] text-fg-3 tabular" aria-hidden>
            {TICKS.map((d) => (
              <span key={d} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${meterFraction(d) * 100}%` }}>
                {d === 0 ? "0" : `−${-d}`}
              </span>
            ))}
          </div>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-2">
            <span>
              {t.peak}: <span className="tabular font-semibold text-fg">{levels ? `${fmtDb(levels.peak)} dBFS` : "—"}</span>
            </span>
            <span>
              {t.floor}:{" "}
              {levels?.floor != null ? (
                <>
                  <span className="tabular font-semibold text-fg">{fmtDb(levels.floor)} dBFS</span> — {t.rating[noiseRating(levels.floor)]}
                </>
              ) : (
                <span className="text-fg-3">{t.floorWait}</span>
              )}
            </span>
          </p>
        </div>

        <div>
          <canvas ref={canvasRef} className="block h-20 w-full rounded-[1rem] bg-surface-2" role="img" aria-label={t.spectrum} />
          <div className="relative mt-1 h-4 text-[0.6875rem] text-fg-3 tabular" aria-hidden>
            {specTicks.map(([f, l]) => (
              <span key={f} className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" style={{ left: `${(Math.log(f / 40) / Math.log(16000 / 40)) * 100}%` }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex flex-col gap-3 p-4 sm:p-6">
          {!canRecord ? (
            <Notice>{t.recUnsupported}</Notice>
          ) : recElapsed === null ? (
            <>
              <Button variant="filled" size="lg" onClick={record} className="w-fit">
                <Circle aria-hidden className="fill-current" />
                {t.record}
              </Button>
              <p className="text-sm text-fg-3">{t.recHint}</p>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" size="lg" onClick={stopRecording}>
                <Square aria-hidden className="fill-current" />
                {t.stopRec}
              </Button>
              <span className="text-sm font-medium text-err">● {t.recording}</span>
              <div className="h-2 min-w-32 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                <div className="h-full bg-err transition-[width] duration-100" style={{ width: `${Math.min(100, (recElapsed / REC_SECONDS) * 100)}%` }} />
              </div>
              <span className="tabular text-sm text-fg-2">
                {formatNumber(locale, Math.floor(recElapsed))} / {REC_SECONDS} {t.sec}
              </span>
            </div>
          )}
          {rec && (
            <div className="mt-1 flex flex-col gap-2 rounded-[1rem] bg-surface-2 p-3 motion-safe:animate-[menu-in_200ms_ease-out]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-fg">
                  {t.yourRec} · {formatNumber(locale, rec.seconds, { maximumFractionDigits: 1 })} {t.sec}
                </h2>
                <IconButton variant="tonal" size="sm" label={t.download} icon={<Download aria-hidden />} onClick={() => downloadBlob(rec.blob, `microphone-test.${extFromMime(rec.blob.type)}`)} />
              </div>
              <audio controls src={rec.url} className="w-full" aria-label={t.yourRec} />
            </div>
          )}
        </Panel>

        {PROC_KEYS.some((k) => procSupported[k]) && (
          <Panel className="p-4 sm:p-6">
            <fieldset className="flex flex-col">
              <legend className="mb-1 text-sm font-semibold text-fg">{t.processing}</legend>
              {PROC_KEYS.filter((k) => procSupported[k]).map((k) => (
                <Switch
                  key={k}
                  label={k === "echoCancellation" ? t.ec : k === "noiseSuppression" ? t.ns : t.agc}
                  checked={proc[k]}
                  onChange={(e) => {
                    const next = { ...proc, [k]: e.target.checked };
                    setProc(next);
                    start(deviceId, next);
                  }}
                />
              ))}
              <p className="mt-1 text-[0.8125rem] text-fg-3">{t.procHint}</p>
            </fieldset>
          </Panel>
        )}

        {settings && (
          <dl className="facts">
            <div>
              <dt>{t.device}</dt>
              <dd>{label || "—"}</dd>
            </div>
            <div>
              <dt>{t.sampleRate}</dt>
              <dd>{settings.sampleRate ? `${formatNumber(locale, settings.sampleRate)} ${t.hz}` : "—"}</dd>
            </div>
            <div>
              <dt>{t.channels}</dt>
              <dd>{settings.channelCount ?? "—"}</dd>
            </div>
            <div>
              <dt>{t.processing}</dt>
              <dd>{PROC_KEYS.map((k) => `${k === "echoCancellation" ? t.ec : k === "noiseSuppression" ? t.ns : t.agc}: ${settings[k] === undefined ? "—" : settings[k] ? t.on : t.off}`).join(" · ")}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
