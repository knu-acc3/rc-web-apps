"use client";

import { CheckCircle2, ChevronDown, Download, FileArchive, Loader2, Play, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { sniffFile, type Detected } from "@/sections/file/lib/magic";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Checkbox, Field, Select } from "@/ui/field";
import { Badge, Notice, Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { probeMedia, runGifToVideo, runJob, type Hooks } from "./engine/client";
import { isAbort } from "./engine/ffmpeg";
import { even, FFMPEG_ENCODED, isAudioTarget, isVideoTarget, outputName, planFor, type AudioSpec, type GifSpec, type JobResult, type JobSpec, type MediaInfo, type Plan, type Target, type VideoTarget } from "./engine/spec";
import { useWebCodecs } from "./ui/hooks";
import { AudioOptions, FORMAT_LABEL, GIF_DEFAULT, GifOptions } from "./ui/options";
import { MEDIA_ACCEPT, VIDEO_ACCEPT } from "./ui/FilePicker";
import { ProgressBar } from "./ui/Progress";
import { sizeChange } from "./ui/ResultCard";
import { errorText, UI } from "./ui/strings";

export interface MediaConverterProps {
  locale: Locale;
  kind: "video" | "audio";
  /** Default output format. */
  to: Target;
  /** Source format of a pair page (only used for hints). */
  from?: string;
  targets: Target[];
}

const T = {
  ru: {
    format: "Формат на выходе",
    resolution: "Разрешение",
    original: "Как в исходнике",
    mute: "Убрать звук",
    convert: "Конвертировать",
    convertAll: "Конвертировать все",
    queue: "Файлы",
    files: ["файл", "файла", "файлов"],
    zip: "Скачать всё (ZIP)",
    clear: "Очистить готовые",
    plan: {
      copy: "Без перекодирования — только смена контейнера",
      encode: "Перекодирование через WebCodecs",
      ffmpeg: "Через ffmpeg.wasm (запасной модуль)",
      unknown: "",
    } as Record<Plan, string>,
    waiting: "В очереди",
    ffmpegNote: "Для MP3, FLAC и OGG (Vorbis), а также для форматов, которые браузер не читает (AVI, WMV, FLV…), используется модуль ffmpeg: при первом запуске он загружается с этого сайта (до 31 МБ), затем берётся из кэша.",
    gifIn: "GIF-анимация",
    settings: "Настройки",
    compat: "Максимальная совместимость (H.264)",
    lossless: "без потерь",
    palGlobal: "общая палитра",
    palFrame: "палитра на кадр",
    inputsAudio: "MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, AMR, а также видео MP4, MOV, MKV, WEBM, AVI",
    inputsVideo: "MP4, MOV, MKV, WEBM, AVI, WMV, FLV, 3GP, TS, MPEG и GIF",
  },
  en: {
    format: "Output format",
    resolution: "Resolution",
    original: "Same as source",
    mute: "Remove audio",
    convert: "Convert",
    convertAll: "Convert all",
    queue: "Files",
    files: ["file", "files"],
    zip: "Download all (ZIP)",
    clear: "Clear finished",
    plan: {
      copy: "No re-encoding — container change only",
      encode: "Re-encoding with WebCodecs",
      ffmpeg: "With ffmpeg.wasm (fallback module)",
      unknown: "",
    } as Record<Plan, string>,
    waiting: "Queued",
    ffmpegNote: "MP3, FLAC and OGG (Vorbis) output, and formats the browser can't read (AVI, WMV, FLV…), use the ffmpeg module: it is downloaded from this site on first use (up to 31 MB) and cached afterwards.",
    gifIn: "GIF animation",
    settings: "Settings",
    compat: "Maximum compatibility (H.264)",
    lossless: "lossless",
    palGlobal: "global palette",
    palFrame: "per-frame palette",
    inputsAudio: "MP3, WAV, M4A, AAC, FLAC, OGG, OPUS, WMA, AIFF, AMR, plus video MP4, MOV, MKV, WEBM, AVI",
    inputsVideo: "MP4, MOV, MKV, WEBM, AVI, WMV, FLV, 3GP, TS, MPEG and GIF",
  },
} as const;

type Status = "probing" | "ready" | "running" | "done" | "error" | "cancelled";

interface Item {
  id: number;
  file: File;
  info: MediaInfo | null;
  detected: Detected | null;
  status: Status;
  progress: number;
  stage: "prepare" | "download" | "work";
  engine: "webcodecs" | "ffmpeg";
  result: JobResult | null;
  name: string;
  error: unknown;
}

const RESOLUTIONS = [2160, 1440, 1080, 720, 480, 360];

function isAnimatedImage(item: Item): boolean {
  const d = item.detected;
  return !!d && (d.ext === "gif" || (d.animated === true && (d.ext === "webp" || d.ext === "png")));
}

function MediaConverterInner({ locale, kind, to, targets }: MediaConverterProps) {
  const t = T[locale];
  const u = UI[locale];
  const id = useId();
  const webcodecs = useWebCodecs();
  const [target, setTarget] = useState<Target>(to);
  const [audio, setAudio] = useState<AudioSpec>({});
  const [gif, setGif] = useState<GifSpec>(GIF_DEFAULT);
  const [height, setHeight] = useState(0);
  const [mute, setMute] = useState(false);
  const [compat, setCompat] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const itemsRef = useRef<Item[]>([]);
  const ctrls = useRef(new Map<number, AbortController>());
  const seq = useRef(0);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    const map = ctrls.current;
    return () => map.forEach((c) => c.abort());
  }, []);

  const patch = useCallback((itemId: number, p: Partial<Item>) => {
    setItems((list) => list.map((x) => (x.id === itemId ? { ...x, ...p } : x)));
  }, []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const added = files.map<Item>((file) => ({ id: ++seq.current, file, info: null, detected: null, status: "probing", progress: 0, stage: "prepare", engine: "webcodecs", result: null, name: "", error: null }));
      setItems((list) => [...list, ...added]);
      // Probe one by one (each probe runs in its own short-lived worker).
      for (const it of added) {
        const c = new AbortController();
        ctrls.current.set(it.id, c);
        const [info, detected] = await Promise.all([probeMedia(it.file, c.signal).catch(() => null), sniffFile(it.file).catch(() => null)]);
        ctrls.current.delete(it.id);
        if (c.signal.aborted) continue;
        patch(it.id, { info, detected, status: "ready" });
      }
    },
    [patch],
  );

  const specFor = useCallback(
    (item: Item): JobSpec => {
      const spec: JobSpec = { target };
      if (target === "gif") spec.gif = gif;
      else if (isAudioTarget(target)) spec.audio = { ...audio };
      else {
        spec.audio = mute ? { discard: true } : {};
        const v = item.info?.video;
        if (height && (!v || v.height > height)) {
          spec.video = v ? { height: even(height), width: even((v.width * height) / v.height) } : { height: even(height) };
        }
        // H.264 plays everywhere; HEVC/VP9/AV1 sources are re-encoded when asked.
        if (compat && target !== "webm" && v?.codec && v.codec !== "avc") spec.video = { ...spec.video, forceTranscode: true };
      }
      return spec;
    },
    [target, gif, audio, mute, height, compat],
  );

  const runOne = useCallback(
    async (item: Item) => {
      const c = new AbortController();
      ctrls.current.set(item.id, c);
      patch(item.id, { status: "running", progress: 0, stage: "prepare", error: null, result: null });
      let last = 0;
      const hooks: Hooks = {
        signal: c.signal,
        onProgress: (p) => {
          const now = performance.now();
          if (now - last < 120 && p < 1) return;
          last = now;
          patch(item.id, { progress: p });
        },
        onStage: (stage, engine) => patch(item.id, { stage, engine }),
        onDownload: (d) => patch(item.id, { progress: d }),
      };
      const spec = specFor(item);
      try {
        const result =
          isAnimatedImage(item) && isVideoTarget(target)
            ? await runGifToVideo(item.file, target as VideoTarget, height || 1280, hooks)
            : await runJob(item.file, spec, hooks, item.info);
        if (c.signal.aborted) return;
        patch(item.id, { status: "done", progress: 1, result, name: outputName(item.file.name, target) });
      } catch (error) {
        if (c.signal.aborted || isAbort(error)) patch(item.id, { status: "cancelled" });
        else {
          console.error(error);
          patch(item.id, { status: "error", error });
        }
      } finally {
        ctrls.current.delete(item.id);
      }
    },
    [patch, specFor, target, height],
  );

  const runAll = useCallback(async () => {
    setBusy(true);
    const ids = itemsRef.current.filter((x) => x.status === "ready" || x.status === "cancelled" || x.status === "error").map((x) => x.id);
    try {
      for (const itemId of ids) {
        const item = itemsRef.current.find((x) => x.id === itemId);
        if (!item) continue; // removed meanwhile
        await runOne(item);
        await new Promise((r) => setTimeout(r, 0));
        // Stop the batch when the user cancelled the current file.
        if (itemsRef.current.find((x) => x.id === itemId)?.status === "cancelled") break;
      }
    } finally {
      setBusy(false);
    }
  }, [runOne]);

  const remove = (itemId: number) => {
    ctrls.current.get(itemId)?.abort();
    setItems((list) => list.filter((x) => x.id !== itemId));
  };
  const cancel = (itemId: number) => ctrls.current.get(itemId)?.abort();

  // Reset finished items when the output settings change, so the list never shows stale results.
  const settingsKey = JSON.stringify([target, audio, gif, height, mute, compat]);
  const prevKey = useRef(settingsKey);
  useEffect(() => {
    if (prevKey.current === settingsKey) return;
    prevKey.current = settingsKey;
    setItems((list) => list.map((x) => (x.status === "done" || x.status === "error" || x.status === "cancelled" ? { ...x, status: "ready", result: null, error: null, progress: 0 } : x)));
  }, [settingsKey]);

  const done = items.filter((x) => x.status === "done" && x.result);
  const pending = items.filter((x) => x.status === "ready" || x.status === "cancelled" || x.status === "error");
  const needsFfmpeg = items.some((x) => x.info && planFor(x.info, specFor(x)) === "ffmpeg") || (FFMPEG_ENCODED.includes(target) && items.length > 0);

  const zipAll = async () => {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const used = new Set<string>();
    for (const it of done) {
      let n = it.name;
      for (let k = 2; used.has(n); k++) n = outputName(it.file.name, target, `-${k}`);
      used.add(n);
      zip.file(n, it.result!.blob);
    }
    downloadBlob(await zip.generateAsync({ type: "blob", compression: "STORE" }), `converted-${target}.zip`);
  };

  const settingsSummary =
    target === "gif"
      ? `${gif.fps} ${u.fps} · ${gif.width} px · ${gif.palette === "global" ? t.palGlobal : t.palFrame}`
      : isAudioTarget(target)
        ? [target === "wav" || target === "flac" ? t.lossless : `${Math.round((audio.bitrate ?? 192000) / 1000)} ${u.kbps}`, audio.sampleRate ? `${formatNumber(locale, audio.sampleRate)} ${u.hz}` : null, audio.channels === 1 ? u.mono : audio.channels === 2 ? u.stereo : null].filter(Boolean).join(" · ")
        : [height ? `${height}p` : t.original.toLowerCase(), compat ? "H.264" : null, mute ? t.mute.toLowerCase() : null].filter(Boolean).join(" · ");

  const accept = kind === "audio" ? MEDIA_ACCEPT : `${VIDEO_ACCEPT},.gif,image/gif,image/webp,image/apng`;
  const inputs = kind === "audio" ? t.inputsAudio : t.inputsVideo;
  const options = useMemo(() => targets.map((x) => ({ value: x, label: FORMAT_LABEL[x] })), [targets]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-sm font-medium text-fg-2">{t.format}</span>
          <Segmented label={t.format} value={target} onChange={setTarget} options={options} wrap />
        </div>
        <details className="group">
          <summary className="inline-flex cursor-pointer items-center gap-1 text-sm text-fg-3 hover:text-fg">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            {t.settings}: {settingsSummary}
          </summary>
          <div className="mt-3">
            {target === "gif" ? (
              <GifOptions locale={locale} value={gif} onChange={setGif} disabled={busy} />
            ) : isAudioTarget(target) ? (
              <AudioOptions locale={locale} target={target} value={audio} onChange={setAudio} disabled={busy} />
            ) : (
              <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                <Field label={t.resolution} htmlFor={`${id}-res`} className="w-48">
                  <Select id={`${id}-res`} size="sm" value={String(height)} disabled={busy} onChange={(e) => setHeight(Number(e.target.value))}>
                    <option value="0">{t.original}</option>
                    {RESOLUTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r === 2160 ? "4K (2160p)" : `${r}p`}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Checkbox label={t.compat} checked={compat} disabled={busy} onChange={(e) => setCompat(e.target.checked)} className="pb-1.5" />
                <Checkbox label={t.mute} checked={mute} disabled={busy} onChange={(e) => setMute(e.target.checked)} className="pb-1.5" />
              </div>
            )}
          </div>
        </details>
      </div>

      <Dropzone onFiles={addFiles} accept={accept} multiple title={u.chooseFiles} hint={`${inputs}. ${u.localNote}.`} compact={items.length > 0} />

      {webcodecs === false && <Notice tone="warn">{u.noWebCodecs}</Notice>}
      {needsFfmpeg && <Notice>{t.ffmpegNote}</Notice>}

      {items.length > 0 && (
        <Panel>
          <PanelHeader
            title={`${t.queue}: ${count(locale, items.length, t.files)}`}
            actions={
              <>
                {done.length > 1 && (
                  <Button size="sm" variant="ghost" onClick={zipAll}>
                    <FileArchive aria-hidden />
                    <span className="max-sm:sr-only">{t.zip}</span>
                  </Button>
                )}
                {done.length > 0 && !busy && (
                  <Button size="sm" variant="ghost" onClick={() => setItems((l) => l.filter((x) => x.status !== "done"))}>
                    {t.clear}
                  </Button>
                )}
              </>
            }
          />
          <ul className="divide-y divide-line">
            {items.map((it) => (
              <QueueRow key={it.id} item={it} locale={locale} plan={it.info ? planFor(it.info, specFor(it)) : "unknown"} onRemove={() => remove(it.id)} onCancel={() => cancel(it.id)} gifIn={isAnimatedImage(it) ? t.gifIn : null} planText={t.plan} waiting={t.waiting} />
            ))}
          </ul>
        </Panel>
      )}
      {pending.length > 0 && (
        <Button variant="primary" size="lg" onClick={runAll} disabled={busy} className="w-full sm:w-auto sm:self-start">
          {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
          {pending.length > 1 ? `${t.convertAll} (${pending.length})` : t.convert} → {FORMAT_LABEL[target]}
        </Button>
      )}
    </div>
  );
}

function QueueRow({
  item,
  locale,
  plan,
  planText,
  waiting,
  gifIn,
  onRemove,
  onCancel,
}: {
  item: Item;
  locale: Locale;
  plan: Plan;
  planText: Record<Plan, string>;
  waiting: string;
  gifIn: string | null;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const u = UI[locale];
  const running = item.status === "running";
  const stageText = item.stage === "download" ? u.downloadingEngine : item.engine === "ffmpeg" ? u.ffmpegWork : u.processing;
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-fg" title={item.file.name}>
            {item.file.name}
          </div>
          <div className="text-sm text-fg-3">
            {formatBytes(locale, item.file.size)}
            {item.detected ? ` · ${gifIn ?? item.detected.name}` : ""}
            {item.status === "probing" ? ` · ${u.probing}` : ""}
          </div>
        </div>
        {item.status === "done" && item.result ? (
          <Button size="sm" variant="ghost" className="text-accent" onClick={() => downloadBlob(item.result!.blob, item.name)}>
            <Download aria-hidden />
            <span className="max-sm:sr-only">{u.download}</span>
          </Button>
        ) : running ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {u.cancel}
          </Button>
        ) : null}
        <Button size="icon-sm" variant="ghost" onClick={onRemove} aria-label={`${u.remove}: ${item.file.name}`} title={u.remove}>
          <X aria-hidden />
        </Button>
      </div>
      {running && (
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-fg-3">{item.stage === "prepare" ? u.preparing : stageText}</span>
          <ProgressBar value={item.progress} label={`${u.progress}: ${item.file.name}`} />
        </div>
      )}
      {item.status === "ready" && plan !== "unknown" && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-fg-3">
          <Badge tone={plan === "copy" ? "ok" : "neutral"}>{planText[plan]}</Badge>
          <span>{waiting}</span>
        </div>
      )}
      {item.status === "done" && item.result && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-2" aria-live="polite">
          <CheckCircle2 className="size-4 text-ok" aria-hidden />
          <span className="tabular">
            {item.name} · {formatBytes(locale, item.result.blob.size)} · {sizeChange(locale, item.result.blob.size, item.file.size)}
          </span>
          {item.result.mode === "copy" && <Badge tone="ok">{u.copyMode}</Badge>}
          {item.result.engine === "ffmpeg" && <Badge>{u.engineFfmpeg}</Badge>}
        </p>
      )}
      {item.status === "error" && <Notice tone="err">{errorText(locale, item.error)}</Notice>}
      {item.status === "cancelled" && <p className="text-sm text-fg-3">{u.cancelled}</p>}
    </li>
  );
}

/** Remount when the page preset changes (client-side navigation between variant pages). */
export default function MediaConverter(props: MediaConverterProps) {
  return <MediaConverterInner key={`${props.kind}-${props.to}`} {...props} />;
}
