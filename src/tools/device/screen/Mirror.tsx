"use client";

import { Camera, FlipHorizontal2, Maximize, Pause, Play, SwitchCamera } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { Slider, Switch } from "@/ui/field";
import { Kbd, Panel } from "@/ui/panel";
import { StageLayer, typingTarget, useStage } from "@/ui/stage";
import { hasGetUserMedia, mediaErrorStatus, stopStream, type MediaStatus } from "../test/lib/media";
import { MediaStatusNotice, PermissionHelp } from "../test/ui/PermissionHelp";
import { whiteAt, rgbToHex } from "./lib/color";
import { BarButton } from "./ui/BarButton";

const T = {
  ru: {
    start: "Включить зеркало",
    hint: "Видео не записывается и никуда не отправляется — это просто изображение с камеры на вашем экране.",
    mirror: "Отражать как в зеркале",
    zoom: "Приближение",
    bright: "Яркость",
    light: "Подсветка лица",
    lightHint: "Белая рамка вокруг изображения освещает лицо, как кольцевая лампа.",
    warmth: "Оттенок подсветки",
    freeze: "Стоп-кадр",
    live: "Продолжить",
    flip: "Другая камера",
    full: "На весь экран",
    close: "Закрыть",
    stage: "Зеркало",
    keys: "Клавиши",
    keyFreeze: "стоп-кадр",
    keyFlip: "отразить",
    exit: "выход",
  },
  en: {
    start: "Turn on the mirror",
    hint: "Nothing is recorded or sent anywhere — it's just the camera image on your screen.",
    mirror: "Mirror image",
    zoom: "Zoom",
    bright: "Brightness",
    light: "Face light",
    lightHint: "A white frame around the picture lights your face like a ring light.",
    warmth: "Light tone",
    freeze: "Freeze",
    live: "Resume",
    flip: "Switch camera",
    full: "Full screen",
    close: "Close",
    stage: "Mirror",
    keys: "Keys",
    keyFreeze: "freeze",
    keyFlip: "flip",
    exit: "exit",
  },
} as const;

export default function Mirror({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [status, setStatus] = useState<MediaStatus>("idle");
  const [mirror, setMirror] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [bright, setBright] = useState(100);
  const [light, setLight] = useState(0);
  const [kelvin, setKelvin] = useState(5000);
  const [frozen, setFrozen] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [cameras, setCameras] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stage = useStage();

  const start = useCallback(async (face: "user" | "environment") => {
    if (!hasGetUserMedia()) return setStatus("unsupported");
    stopStream(streamRef.current);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      for (const v of [videoRef.current, stageVideoRef.current]) if (v) v.srcObject = stream;
      setFrozen(false);
      setStatus("live");
      stream.getVideoTracks()[0]?.addEventListener("ended", () => setStatus("ended"));
      const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
      setCameras(devices.filter((d) => d.kind === "videoinput").length);
    } catch (e) {
      setStatus(mediaErrorStatus(e));
    }
  }, []);

  useEffect(() => () => stopStream(streamRef.current), []);

  // Freeze = pause the <video> elements: the last frame stays on screen, the camera keeps running.
  useEffect(() => {
    for (const v of [videoRef.current, stageVideoRef.current]) {
      if (!v || !v.srcObject) continue;
      if (frozen) v.pause();
      else void v.play().catch(() => {});
    }
  }, [frozen, stage.open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage.open || status !== "live" || e.ctrlKey || e.metaKey || e.altKey || typingTarget(e)) return;
      if (e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") {
        e.preventDefault();
        stage.enter();
      } else if (e.key === " ") {
        e.preventDefault();
        setFrozen((f) => !f);
      } else if (e.key === "m" || e.key === "M" || e.key === "ь" || e.key === "Ь") {
        setMirror((m) => !m);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, status]);

  const live = status === "live";
  const ring = rgbToHex(whiteAt(kelvin));
  const videoStyle = {
    transform: `scale(${mirror ? -zoom : zoom}, ${zoom})`,
    filter: bright === 100 ? undefined : `brightness(${bright}%)`,
  };
  const frame = (big: boolean) => ({
    background: light > 0 ? ring : "#000",
    padding: light > 0 ? `${light * (big ? 0.6 : 0.4)}vmin` : 0,
  });

  return (
    <div className={cn("grid items-start gap-4 lg:gap-6", live && "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="overflow-hidden rounded-[1.25rem] shadow-[var(--shadow-card)]" style={frame(false)}>
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-black sm:aspect-[16/9]">
            <video ref={videoRef} autoPlay playsInline muted className={cn("size-full object-cover transition-transform", !live && "hidden")} style={videoStyle} />
            {!live && (
              <div className="flex flex-col items-center gap-4 p-6 text-center text-white">
                <span aria-hidden className="flex size-16 items-center justify-center rounded-full bg-white/12">
                  <Camera className="size-8" />
                </span>
                <Button variant="filled" size="xl" onClick={() => void start(facing)} loading={status === "requesting"}>
                  {status !== "requesting" && <Camera aria-hidden />}
                  {t.start}
                </Button>
                <p className="max-w-md text-sm opacity-80">{t.hint}</p>
              </div>
            )}
          </div>
        </div>
        {live && (
          <div className="flex flex-wrap gap-2">
            <Button variant="filled" size="lg" onClick={stage.enter}>
              <Maximize aria-hidden />
              {t.full}
            </Button>
            <Button variant="tonal" size="lg" onClick={() => setFrozen((f) => !f)} aria-pressed={frozen}>
              {frozen ? <Play aria-hidden /> : <Pause aria-hidden />}
              {frozen ? t.live : t.freeze}
            </Button>
            {cameras > 1 && (
              <Button
                variant="tonal"
                size="lg"
                onClick={() => {
                  const next = facing === "user" ? "environment" : "user";
                  setFacing(next);
                  setMirror(next === "user");
                  void start(next);
                }}
              >
                <SwitchCamera aria-hidden />
                {t.flip}
              </Button>
            )}
          </div>
        )}
        {status !== "idle" && status !== "live" && status !== "requesting" && <MediaStatusNotice locale={locale} kind="camera" status={status} />}
        <PermissionHelp locale={locale} kind="camera" open={status === "denied"} />
      </div>

      {live && (
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <Switch
            label={
              <span className="inline-flex items-center gap-1.5">
                <FlipHorizontal2 className="size-4" aria-hidden />
                {t.mirror}
              </span>
            }
            checked={mirror}
            onChange={(e) => setMirror(e.target.checked)}
          />
          <SliderRow label={t.zoom} value={`×${zoom.toFixed(1)}`}>
            <Slider min={1} max={4} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} format={(v) => `×${v.toFixed(1)}`} />
          </SliderRow>
          <SliderRow label={t.bright} value={`${bright}%`}>
            <Slider min={50} max={200} step={5} value={bright} onChange={(e) => setBright(Number(e.target.value))} format={(v) => `${v}%`} />
          </SliderRow>
          <SliderRow label={t.light} value={String(light)} hint={t.lightHint}>
            <Slider min={0} max={20} step={1} value={light} onChange={(e) => setLight(Number(e.target.value))} />
          </SliderRow>
          {light > 0 && (
            <SliderRow label={t.warmth} value={`${kelvin} K`}>
              <Slider min={2700} max={7500} step={100} value={kelvin} onChange={(e) => setKelvin(Number(e.target.value))} format={(v) => `${v} K`} />
            </SliderRow>
          )}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-3 pointer-coarse:hidden">
            <span>
              <Kbd>F</Kbd> {t.full.toLowerCase()}
            </span>
            <span>
              <Kbd>Space</Kbd> {t.keyFreeze}
            </span>
            <span>
              <Kbd>M</Kbd> {t.keyFlip}
            </span>
            <span>
              <Kbd>Esc</Kbd> {t.exit}
            </span>
          </p>
        </Panel>
      )}

      <StageLayer
        stage={stage}
        label={t.stage}
        closeLabel={t.close}
        style={frame(true)}
        onKey={(e) => {
          if (e.key === " ") {
            e.preventDefault();
            setFrozen((f) => !f);
          } else if (e.key === "m" || e.key === "M" || e.key === "ь" || e.key === "Ь") {
            setMirror((m) => !m);
          }
        }}
        bar={
          <>
            <span className="font-semibold">{t.stage}</span>
            <BarButton label={frozen ? t.live : t.freeze} icon={frozen ? <Play aria-hidden /> : <Pause aria-hidden />} onClick={() => setFrozen((f) => !f)} />
            <BarButton label={t.mirror} icon={<FlipHorizontal2 aria-hidden />} onClick={() => setMirror((m) => !m)} />
          </>
        }
      >
        <div className="size-full overflow-hidden bg-black">
          <video
            ref={(v) => {
              stageVideoRef.current = v;
              if (v && streamRef.current && v.srcObject !== streamRef.current) v.srcObject = streamRef.current;
            }}
            autoPlay
            playsInline
            muted
            className="size-full object-cover"
            style={videoStyle}
          />
        </div>
      </StageLayer>
    </div>
  );
}

function SliderRow({ label, value, hint, children }: { label: string; value: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg-2">
        {label}
        <span className="text-lg font-bold text-fg tabular-nums">{value}</span>
      </span>
      {children}
      {hint && <span className="text-xs text-fg-3">{hint}</span>}
    </label>
  );
}
