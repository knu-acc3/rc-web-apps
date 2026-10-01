"use client";

/* eslint-disable @next/next/no-img-element -- blob: URL of the generated GIF */
import { Download, Loader2, Play } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber, plural } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { IMAGE_ACCEPT } from "./lib/detect";
import { checker, ColorField, NumberField } from "./ui/controls";
import { ChipChoice } from "@/ui/chip-choice";
import { useEngine, useObjectUrls } from "./ui/hooks";
import { FrameStrip } from "./ui/FrameStrip";
import { OptionsBar, ToolColumns } from "./ui/OptionsBar";
import { errorText, S } from "./ui/strings";
import { useImageList } from "./ui/useImageList";
import { RestoringPlaceholder, WorkspaceBar } from "./ui/Workspace";

const T = {
  ru: {
    frames: ["кадр", "кадра", "кадров"],
    delay: "Задержка кадров",
    ms: "мс",
    ownDelay: (n: number) => `Задержка кадра ${n} (пусто — общая)`,
    loop: "Повтор",
    forever: "Бесконечно",
    once: "Один раз",
    times: (n: number) => `${n} ${plural("ru", n, ["раз", "раза", "раз"])}`,
    width: "Ширина",
    fit: "Кадры",
    contain: "Вписать",
    cover: "Заполнить",
    bg: "Фон",
    transparent: "Прозрачный",
    color: "Цвет",
    bgColor: "Цвет фона",
    make: "Создать GIF",
    download: "Скачать GIF",
    making: "Кодирование GIF…",
    frameList: "Кадры анимации",
    need: "Добавьте хотя бы 2 картинки",
    duration: "длительность",
    fps: "кадр/с",
    note: "GIF хранит до 256 цветов на кадр — для фото возможна лёгкая «зернистость»",
    result: "Готовый GIF",
  },
  en: {
    frames: ["frame", "frames"],
    delay: "Frame delay (all)",
    ms: "ms",
    ownDelay: (n: number) => `Frame ${n} delay (empty = common)`,
    loop: "Loop",
    forever: "Forever",
    once: "Once",
    times: (n: number) => `${n} ${plural("en", n, ["time", "times"])}`,
    width: "Width",
    fit: "Frames",
    contain: "Fit",
    cover: "Fill",
    bg: "Background",
    transparent: "Transparent",
    color: "Colour",
    bgColor: "Background colour",
    make: "Create GIF",
    download: "Download GIF",
    making: "Encoding GIF…",
    frameList: "Animation frames",
    need: "Add at least 2 images",
    duration: "duration",
    fps: "fps",
    note: "GIF stores up to 256 colours per frame — photos may look slightly grainy",
    result: "Your GIF",
  },
} as const;

const WIDTHS = [240, 320, 480, 640, 800, 1080];

export default function GifMaker({ locale }: { locale: Locale }) {
  const t = T[locale];
  const s = S(locale);
  const id = useId();
  const getEngine = useEngine();
  const urls = useObjectUrls();
  const list = useImageList(1080, 150);
  const [delay, setDelay] = useState<number | null>(500);
  const [loop, setLoop] = useState<"0" | "-1" | "2" | "3" | "5">("0");
  const [width, setWidth] = useState(480);
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [bgKind, setBgKind] = useState<"color" | "transparent">("color");
  const [bg, setBg] = useState("#FFFFFF");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [frame, setFrame] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ac = useRef<AbortController | null>(null);
  useEffect(() => () => ac.current?.abort(), []);

  const items = list.items;
  const first = items[0];
  const height = first ? Math.max(1, Math.round((width * first.srcHeight) / first.srcWidth)) : width;
  const d = Math.max(20, delay ?? 500);
  // per-frame overrides (empty = the common delay)
  const [own, setOwn] = useState<Record<string, number>>({});
  const delays = items.map((i) => Math.max(20, own[i.key] ?? d));

  // any change invalidates the finished GIF
  const settingsKey = JSON.stringify({ keys: items.map((i) => i.key), delays, loop, width, fit, bgKind, bg });
  const [madeFor, setMadeFor] = useState("");
  const stale = result && madeFor !== settingsKey;

  // live preview (plays the frames with their delays)
  const cur = items.length ? frame % items.length : 0;
  const curDelay = delays[cur] ?? d;
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setTimeout(() => setFrame((f) => (f + 1) % items.length), curDelay);
    return () => clearTimeout(timer);
  }, [items.length, frame, curDelay]);
  useEffect(() => {
    const c = canvasRef.current;
    const it = items[frame % Math.max(1, items.length)];
    if (!c || !it?.bitmap) return;
    c.width = width;
    c.height = height;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    if (bgKind === "color") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
    }
    const b = it.bitmap;
    const k = fit === "cover" ? Math.max(width / b.width, height / b.height) : Math.min(width / b.width, height / b.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(b, (width - b.width * k) / 2, (height - b.height * k) / 2, b.width * k, b.height * k);
  }, [frame, items, width, height, fit, bg, bgKind]);

  async function make() {
    if (items.length < 2) return;
    ac.current?.abort();
    const c = new AbortController();
    ac.current = c;
    setBusy(true);
    setError(null);
    setProgress(0);
    try {
      // clones (not transfers) so the previews stay usable
      const frames = await Promise.all(items.map((i) => createImageBitmap(i.bitmap!)));
      const buf = await getEngine().run<ArrayBuffer>(
        {
          type: "gif-encode",
          frames,
          width,
          height,
          fit,
          background: bgKind === "transparent" ? "transparent" : bg,
          delay: d,
          delays,
          loop: loop === "-1" ? -1 : loop === "0" ? 0 : Number(loop) - 1,
        },
        { signal: c.signal, onProgress: setProgress, transfer: frames },
      );
      const blob = new Blob([buf], { type: "image/gif" });
      if (result) urls.revoke(result.url);
      setResult({ blob, url: urls.make(blob) });
      setMadeFor(settingsKey);
    } catch (e) {
      if (!c.signal.aborted) setError(e);
    } finally {
      if (ac.current === c) setBusy(false);
    }
  }

  if (!items.length) {
    return (
      <div className="flex flex-col gap-3">
        {list.ws.restoring || list.loading ? (
          <RestoringPlaceholder locale={locale} text={list.ws.restoring ? undefined : s.reading} />
        ) : (
          <Dropzone onFiles={list.add} accept={IMAGE_ACCEPT} multiple title={s.dropMany} hint={t.need} locale={locale} />
        )}
      </div>
    );
  }

  const total = delays.reduce((a, b) => a + b, 0);
  const side = (
    <OptionsBar locale={locale}>
      <NumberField label={t.delay} value={delay} onChange={setDelay} min={20} max={10000} step={50} suffix={t.ms} stepper locale={locale} />
      <Field label={t.loop} htmlFor={`${id}-loop`}>
        <Select id={`${id}-loop`} value={loop} onChange={(e) => setLoop(e.target.value as typeof loop)}>
          <option value="0">{t.forever}</option>
          <option value="-1">{t.once}</option>
          <option value="2">{t.times(2)}</option>
          <option value="3">{t.times(3)}</option>
          <option value="5">{t.times(5)}</option>
        </Select>
      </Field>
      <Field label={t.width}>
        <ChipChoice layout="wrap" label={t.width} value={width} onChange={setWidth} options={WIDTHS.map((w) => ({ value: w, label: `${w} px` }))} />
      </Field>
      <Field label={t.fit}>
        <Segmented
          label={t.fit}
          value={fit}
          onChange={setFit}
          options={[
            { value: "contain", label: t.contain },
            { value: "cover", label: t.cover },
          ]}
        />
      </Field>
      <Field label={t.bg}>
        <Segmented
          label={t.bg}
          value={bgKind}
          onChange={setBgKind}
          options={[
            { value: "color", label: t.color },
            { value: "transparent", label: t.transparent },
          ]}
        />
      </Field>
      {bgKind === "color" && <ColorField label={t.bgColor} value={bg} onChange={setBg} locale={locale} />}
    </OptionsBar>
  );

  return (
    <div className="flex flex-col gap-4">
      <WorkspaceBar
        locale={locale}
        count={list.ws.restored}
        onStartOver={() => {
          list.ws.startOver();
          list.clear();
        }}
      />
      <ToolColumns
        side={side}
        rest={
          <>
            <FrameStrip
              items={items}
              onMove={list.move}
              onRemove={list.remove}
              onAdd={list.add}
              locale={locale}
              label={t.frameList}
              selected={cur}
              onSelect={setFrame}
            />
            {items[cur] && (
              <NumberField
                label={t.ownDelay(cur + 1)}
                value={own[items[cur].key] ?? null}
                onChange={(v) =>
                  setOwn((o) => {
                    const next = { ...o };
                    if (v === null) delete next[items[cur].key];
                    else next[items[cur].key] = v;
                    return next;
                  })
                }
                min={20}
                max={10000}
                step={50}
                suffix={t.ms}
                placeholder={String(d)}
                stepper
                locale={locale}
                className="max-w-xs"
              />
            )}
            {error ? <Notice tone="err">{errorText(locale, error)}</Notice> : null}
            {list.errors.length > 0 && <Notice tone="warn">{errorText(locale, list.errors[list.errors.length - 1])}</Notice>}
          </>
        }
      >
        <Panel className="flex min-w-0 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
          <div className={`flex justify-center rounded-[1rem] p-3 sm:p-4 ${checker}`}>
            {result && !stale ? (
              <img src={result.url} alt={t.result} className="block h-auto max-h-[60vh] max-w-full" />
            ) : (
              <canvas ref={canvasRef} role="img" aria-label={t.frameList} className="block h-auto max-h-[60vh] max-w-full" />
            )}
          </div>
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite">
              <p className="tabular text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
                {result && !stale ? formatBytes(locale, result.blob.size) : `${items.length} ${plural(locale, items.length, t.frames)}`}
              </p>
              <p className="tabular text-sm text-fg-3">
                {width}×{height} px · {t.duration} {formatNumber(locale, total / 1000, { maximumFractionDigits: 2 })} {locale === "ru" ? "с" : "s"} ·{" "}
                {formatNumber(locale, 1000 / d, { maximumFractionDigits: 1 })} {t.fps}
              </p>
            </div>
            {result && !stale ? (
              <Button variant="filled" size="lg" onClick={() => downloadBlob(result.blob, `animation-${width}x${height}.gif`)}>
                <Download aria-hidden />
                {t.download}
              </Button>
            ) : (
              <Button variant="filled" size="lg" onClick={make} disabled={busy || items.length < 2}>
                {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
                {busy ? `${t.making} ${Math.round(progress * 100)} %` : t.make}
              </Button>
            )}
          </div>
          <p className="px-1 text-[0.8125rem] text-fg-3">{items.length < 2 ? t.need : t.note}</p>
        </Panel>
      </ToolColumns>
    </div>
  );
}
