"use client";

import { Camera, CameraOff, ListChecks } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Field, Select, Switch } from "@/ui/field";
import { Panel } from "@/ui/panel";

import { useClientValue } from "./lib/client";
import { hasGetUserMedia, listDevices, mediaErrorStatus, stopStream, type DeviceOption, type MediaStatus } from "./lib/media";
import { MediaStatusNotice, PermissionHelp } from "./ui/PermissionHelp";

const PRESETS = [
  { id: "max", w: 4096, h: 2160 },
  { id: "2160", w: 3840, h: 2160 },
  { id: "1440", w: 2560, h: 1440 },
  { id: "1080", w: 1920, h: 1080 },
  { id: "720", w: 1280, h: 720 },
  { id: "480", w: 640, h: 480 },
] as const;
type PresetId = (typeof PRESETS)[number]["id"];

const PROBES: [number, number][] = [
  [320, 240],
  [640, 360],
  [640, 480],
  [800, 600],
  [1024, 768],
  [1280, 720],
  [1280, 960],
  [1600, 1200],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160],
];

const T = {
  ru: {
    start: "Включить камеру",
    starting: "Запрашиваем доступ…",
    stop: "Выключить",
    retry: "Попробовать снова",
    intro: "Браузер спросит разрешение на доступ к камере. Видео показывается только на этой странице и никуда не отправляется.",
    camera: "Камера",
    cameraN: (n: number) => `Камера ${n}`,
    preset: "Запрошенное разрешение",
    presetMax: "Максимальное",
    mirror: "Зеркально",
    snapshot: "Снимок PNG",
    resolution: "Разрешение",
    fps: "Частота кадров",
    measured: (n: string) => `измерено: ${n} к/с`,
    aspect: "Соотношение сторон",
    caps: "Возможности камеры",
    capsNone: "Браузер не сообщает диапазоны возможностей камеры.",
    width: "Ширина",
    height: "Высота",
    frameRate: "Частота кадров",
    facing: "Направление",
    facingMap: { user: "фронтальная", environment: "основная", left: "слева", right: "справа" } as Record<string, string>,
    probe: "Проверить разрешения",
    probing: "Проверяем…",
    probeTitle: "Поддерживаемые разрешения",
    probeHint: "Камера по очереди переключается в каждый режим. Браузер может масштабировать картинку, поэтому ориентируйтесь и на максимум из возможностей камеры.",
    requested: "Режим",
    result: "Результат",
    yes: "поддерживается",
    no: "нет",
    got: (w: number, h: number) => `выдаёт ${w}×${h}`,
    fpsUnit: "к/с",
    px: "пикс.",
  },
  en: {
    start: "Start camera",
    starting: "Requesting access…",
    stop: "Turn off",
    retry: "Try again",
    intro: "Your browser will ask for camera permission. The video is shown on this page only and never uploaded.",
    camera: "Camera",
    cameraN: (n: number) => `Camera ${n}`,
    preset: "Requested resolution",
    presetMax: "Maximum",
    mirror: "Mirror",
    snapshot: "PNG snapshot",
    resolution: "Resolution",
    fps: "Frame rate",
    measured: (n: string) => `measured: ${n} fps`,
    aspect: "Aspect ratio",
    caps: "Camera capabilities",
    capsNone: "The browser doesn't report the camera's capability ranges.",
    width: "Width",
    height: "Height",
    frameRate: "Frame rate",
    facing: "Facing",
    facingMap: { user: "front", environment: "back", left: "left", right: "right" } as Record<string, string>,
    probe: "Test resolutions",
    probing: "Testing…",
    probeTitle: "Supported resolutions",
    probeHint: "The camera switches to each mode in turn. Browsers may scale the picture, so also check the maximum in the camera capabilities.",
    requested: "Mode",
    result: "Result",
    yes: "supported",
    no: "no",
    got: (w: number, h: number) => `delivers ${w}×${h}`,
    fpsUnit: "fps",
    px: "px",
  },
} as const;

interface Res {
  disposed: boolean;
  /** Incremented by every start()/stop(); stale getUserMedia results are discarded. */
  gen: number;
  stream: MediaStream | null;
  vfc: number;
  fpsTimer: number;
}

interface Caps {
  width?: { min?: number; max?: number };
  height?: { min?: number; max?: number };
  frameRate?: { min?: number; max?: number };
  facingMode?: string[];
  resizeMode?: string[];
}

type ProbeRow = { w: number; h: number; ok: boolean; got?: [number, number] };

function release(r: Res, video: HTMLVideoElement | null) {
  window.clearInterval(r.fpsTimer);
  if (r.vfc && video && "cancelVideoFrameCallback" in video) video.cancelVideoFrameCallback(r.vfc);
  r.vfc = 0;
  stopStream(r.stream);
  r.stream = null;
  if (video) video.srcObject = null;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

function aspectLabel(w: number, h: number): string {
  const known: [number, string][] = [
    [16 / 9, "16:9"],
    [4 / 3, "4:3"],
    [16 / 10, "16:10"],
    [3 / 2, "3:2"],
    [1, "1:1"],
    [21 / 9, "21:9"],
  ];
  const r = w / h;
  for (const [v, s] of known) if (Math.abs(r - v) < 0.01) return s;
  for (const [v, s] of known) if (Math.abs(1 / r - v) < 0.01) return s.split(":").reverse().join(":");
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

export default function WebcamTest({ locale }: { locale: Locale }) {
  const t = T[locale];
  const id = useId();
  const supported = useClientValue(hasGetUserMedia, true);
  const [status, setStatus] = useState<MediaStatus>("idle");
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [preset, setPreset] = useState<PresetId>("720");
  const [mirror, setMirror] = useState(true);
  const [settings, setSettings] = useState<MediaTrackSettings | null>(null);
  const [caps, setCaps] = useState<Caps | null>(null);
  const [label, setLabel] = useState("");
  const [fps, setFps] = useState<number | null>(null);
  const [probe, setProbe] = useState<ProbeRow[] | null>(null);
  const [probing, setProbing] = useState(false);

  const resRef = useRef<Res | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const r: Res = { disposed: false, gen: 0, stream: null, vfc: 0, fpsTimer: 0 };
    resRef.current = r;
    const video = videoRef.current;
    return () => {
      r.disposed = true;
      release(r, video);
    };
  }, []);

  useEffect(() => {
    if (status !== "live" || !navigator.mediaDevices?.addEventListener) return;
    const onChange = () => {
      listDevices("videoinput", t.cameraN).then(setDevices);
    };
    navigator.mediaDevices.addEventListener("devicechange", onChange);
    return () => navigator.mediaDevices.removeEventListener("devicechange", onChange);
  }, [status, t]);

  function measureFps(r: Res, video: HTMLVideoElement) {
    if (!("requestVideoFrameCallback" in video)) return;
    let frames = 0;
    let since = performance.now();
    const onFrame = () => {
      frames++;
      r.vfc = video.requestVideoFrameCallback(onFrame);
    };
    r.vfc = video.requestVideoFrameCallback(onFrame);
    r.fpsTimer = window.setInterval(() => {
      const now = performance.now();
      setFps((frames * 1000) / (now - since));
      frames = 0;
      since = now;
    }, 1000);
  }

  function readTrack(track: MediaStreamTrack) {
    setSettings(track.getSettings());
    setLabel(track.label);
    setCaps(typeof track.getCapabilities === "function" ? (track.getCapabilities() as Caps) : null);
  }

  async function start(nextDevice: string, nextPreset: PresetId) {
    const r = resRef.current;
    const video = videoRef.current;
    if (!r || !video) return;
    release(r, video);
    setFps(null);
    if (!hasGetUserMedia()) {
      setStatus("unsupported");
      return;
    }
    // switching camera/mode keeps the live layout; only the first start shows "requesting"
    setStatus((s) => (s === "live" ? s : "requesting"));
    const p = PRESETS.find((x) => x.id === nextPreset) ?? PRESETS[4];
    const constraints: MediaTrackConstraints = { width: { ideal: p.w }, height: { ideal: p.h } };
    if (nextDevice) constraints.deviceId = { exact: nextDevice };
    const gen = ++r.gen;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });
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
    const track = stream.getVideoTracks()[0];
    track.addEventListener("ended", () => {
      if (r.stream === stream) {
        release(r, video);
        setStatus("ended");
      }
    });
    video.srcObject = stream;
    video.play().catch(() => {});
    readTrack(track);
    setDeviceId(track.getSettings().deviceId ?? nextDevice);
    listDevices("videoinput", t.cameraN).then((list) => {
      if (!r.disposed) setDevices(list);
    });
    // the real size is known once metadata arrives
    video.addEventListener("loadedmetadata", () => readTrack(track), { once: true });
    measureFps(r, video);
    setStatus("live");
  }

  function stop() {
    const r = resRef.current;
    if (r) {
      r.gen++;
      release(r, videoRef.current);
    }
    setStatus("idle");
    setFps(null);
  }

  async function runProbe() {
    const r = resRef.current;
    const track = r?.stream?.getVideoTracks()[0];
    if (!r || !track || typeof track.applyConstraints !== "function") return;
    setProbing(true);
    const rows: ProbeRow[] = [];
    const noResize = !!(navigator.mediaDevices.getSupportedConstraints?.() as Record<string, boolean> | undefined)?.resizeMode;
    const maxW = caps?.width?.max ?? Infinity;
    const maxH = caps?.height?.max ?? Infinity;
    for (const [w, h] of PROBES) {
      if (r.disposed || r.stream?.getVideoTracks()[0] !== track) {
        setProbing(false);
        return;
      }
      if (w > Math.max(maxW, maxH) || h > Math.max(maxW, maxH)) {
        rows.push({ w, h, ok: false });
        continue;
      }
      try {
        const c: MediaTrackConstraints & { resizeMode?: string } = { width: { exact: w }, height: { exact: h } };
        if (noResize) c.resizeMode = "none";
        await track.applyConstraints(c);
        await new Promise((res) => setTimeout(res, 120));
        const s = track.getSettings();
        const got: [number, number] = [s.width ?? 0, s.height ?? 0];
        rows.push({ w, h, ok: got[0] === w && got[1] === h, got });
      } catch {
        rows.push({ w, h, ok: false });
      }
      setProbe([...rows]);
    }
    setProbe(rows);
    setProbing(false);
    // restore the selected mode
    await start(deviceId, preset);
  }

  function snapshot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const g = c.getContext("2d");
    if (!g) return;
    if (mirror) {
      g.translate(c.width, 0);
      g.scale(-1, 1);
    }
    g.drawImage(video, 0, 0);
    c.toBlob((b) => {
      if (b) downloadBlob(b, `webcam-${c.width}x${c.height}.png`);
    }, "image/png");
  }

  const live = status === "live";
  const w = settings?.width;
  const h = settings?.height;
  const nf = (n: number, d = 0) => formatNumber(locale, n, { maximumFractionDigits: d });
  const range = (x?: { min?: number; max?: number }, unit = "") => (x && x.max ? `${x.min != null ? nf(x.min, 1) : "?"} – ${nf(x.max, 1)}${unit ? ` ${unit}` : ""}` : "—");

  return (
    <div className={cn("grid items-start gap-4 lg:gap-6", live && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
      <div className="flex min-w-0 flex-col gap-3">
        <div className={cn("relative overflow-hidden rounded-[1.25rem]", live ? "bg-black shadow-[var(--shadow-card)]" : "panel")}>
          <video ref={videoRef} playsInline muted autoPlay className={cn("mx-auto block max-h-[75vh] w-full object-contain", mirror && "-scale-x-100", !live && "hidden")} />
          {live && settings && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 text-sm font-semibold text-white tabular">
              <span className="rounded-full bg-black/60 px-3 py-1">{w && h ? `${w}×${h}` : "—"}</span>
              <span className="rounded-full bg-black/60 px-3 py-1">
                {fps != null ? nf(fps, 0) : settings.frameRate ? nf(settings.frameRate, 0) : "—"} {t.fpsUnit}
              </span>
            </div>
          )}
          {!live && (
            <div className="flex flex-col items-center gap-4 px-4 py-12 text-center sm:py-16">
              <span className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden>
                <Camera className="size-10" />
              </span>
              <Button variant="filled" size="xl" onClick={() => start(deviceId, preset)} disabled={!supported} loading={status === "requesting"}>
                {status !== "requesting" && <Camera aria-hidden />}
                {status === "requesting" ? t.starting : status === "idle" ? t.start : t.retry}
              </Button>
              <p className="max-w-md text-sm text-fg-3">{t.intro}</p>
              <MediaStatusNotice locale={locale} kind="camera" status={supported ? status : "unsupported"} />
            </div>
          )}
        </div>
        {live && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="filled" size="lg" onClick={snapshot}>
              <Camera aria-hidden />
              {t.snapshot}
            </Button>
            <Button variant="tonal" size="lg" onClick={stop}>
              <CameraOff aria-hidden />
              {t.stop}
            </Button>
          </div>
        )}
        <PermissionHelp locale={locale} kind="camera" open={status === "denied"} />
      </div>

      {live && (
        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="flex flex-col gap-4 p-4 sm:p-6">
            <Field label={t.camera} htmlFor={`${id}-dev`}>
              <Select
                id={`${id}-dev`}
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  setProbe(null);
                  start(e.target.value, preset);
                }}
              >
                {devices.length === 0 && <option value={deviceId}>{label || t.cameraN(1)}</option>}
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.preset} htmlFor={`${id}-res`}>
              <Select
                id={`${id}-res`}
                value={preset}
                onChange={(e) => {
                  const v = e.target.value as PresetId;
                  setPreset(v);
                  start(deviceId, v);
                }}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id === "max" ? t.presetMax : `${p.w}×${p.h}`}
                  </option>
                ))}
              </Select>
            </Field>
            <Switch label={t.mirror} checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
            <Button variant="outlined" onClick={runProbe} loading={probing} className="w-fit">
              {!probing && <ListChecks aria-hidden />}
              {probing ? t.probing : t.probe}
            </Button>
          </Panel>
          {settings && (
            <dl className="facts">
              <div>
                <dt>{t.resolution}</dt>
                <dd className="tabular">{w && h ? `${w}×${h} · ${formatNumber(locale, (w * h) / 1e6, { maximumFractionDigits: 1 })} MP · ${aspectLabel(w, h)}` : "—"}</dd>
              </div>
              <div>
                <dt>{t.fps}</dt>
                <dd className="tabular">
                  {settings.frameRate ? `${nf(settings.frameRate, 1)} ${t.fpsUnit}` : "—"}
                  {fps != null && <span className="text-fg-3"> · {t.measured(nf(fps, 1))}</span>}
                </dd>
              </div>
              <div>
                <dt>{t.camera}</dt>
                <dd>{label || "—"}</dd>
              </div>
              {caps && (caps.width || caps.frameRate) ? (
                <>
                  <div>
                    <dt>
                      {t.caps}: {t.width.toLowerCase()} × {t.height.toLowerCase()}
                    </dt>
                    <dd className="tabular">
                      {range(caps.width)} × {range(caps.height, t.px)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      {t.caps}: {t.frameRate.toLowerCase()}
                    </dt>
                    <dd className="tabular">{range(caps.frameRate, t.fpsUnit)}</dd>
                  </div>
                  {caps.facingMode && caps.facingMode.length > 0 && (
                    <div>
                      <dt>{t.facing}</dt>
                      <dd>{caps.facingMode.map((f) => t.facingMap[f] ?? f).join(", ")}</dd>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <dt>{t.caps}</dt>
                  <dd className="text-fg-3">{t.capsNone}</dd>
                </div>
              )}
            </dl>
          )}
          {probe && (
            <Panel className="flex flex-col gap-2 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-fg">{t.probeTitle}</h2>
              <p className="text-sm text-fg-3">{t.probeHint}</p>
              <div tabIndex={0} className="tbl">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">{t.requested}</th>
                      <th scope="col">{t.result}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {probe.map((p) => (
                      <tr key={`${p.w}x${p.h}`}>
                        <td className="tabular">
                          {p.w}×{p.h}
                        </td>
                        <td className={p.ok ? "text-ok" : "text-fg-3"}>{p.ok ? `✓ ${t.yes}` : p.got && p.got[0] ? `✗ ${t.got(p.got[0], p.got[1])}` : `✗ ${t.no}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
