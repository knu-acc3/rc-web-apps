"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, formatNumber } from "@/i18n/format";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Panel } from "@/ui/panel";
import { AudioSession } from "@/tools/files/shared/client";
import type { AudioTarget, JobResult } from "@/tools/files/shared/spec";
import { MEDIA_ACCEPT } from "@/tools/files/video/ui/FilePicker";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { ResultCard } from "@/tools/files/video/ui/ResultCard";
import { ChoiceChips, Setting, StepSlider } from "@/tools/files/video/ui/options";
import { UI } from "@/tools/files/video/ui/strings";

const T = {
  ru: {
    add: "Перетащите аудиофайлы сюда или нажмите, чтобы добавить",
    files: ["файл", "файла", "файлов"],
    up: "Выше",
    down: "Ниже",
    crossfade: "Переход между треками",
    none: "Встык",
    sec: "с",
    format: "Формат",
    bitrate: "Битрейт",
    kbps: "кбит/с",
    run: "Склеить аудио",
    need: "Добавьте хотя бы два файла",
  },
  en: {
    add: "Drop audio files here or click to add",
    files: ["file", "files"],
    up: "Move up",
    down: "Move down",
    crossfade: "Transition",
    none: "Back to back",
    sec: "s",
    format: "Format",
    bitrate: "Bitrate",
    kbps: "kbit/s",
    run: "Merge audio",
    need: "Add at least two files",
  },
} as const;

const TARGETS: AudioTarget[] = ["mp3", "wav", "m4a", "ogg", "opus", "flac"];
const CROSSFADES = [0, 0.5, 1, 2, 3, 5, 8];
const BITRATES = [128, 160, 192, 256, 320].map((k) => k * 1000);
const LABEL: Record<string, string> = { mp3: "MP3", wav: "WAV", m4a: "M4A", ogg: "OGG", opus: "Opus", flac: "FLAC" };
let seq = 0;

export default function AudioMerge({ locale }: { locale: Locale }) {
  const t = T[locale];
  const u = UI[locale];
  const [items, setItems] = useState<{ id: number; file: File }[]>([]);
  const [crossfade, setCrossfade] = useState(0);
  const [target, setTarget] = useState<AudioTarget>("mp3");
  const [bitrate, setBitrate] = useState(192_000);
  const job = useJob<JobResult>();
  const session = useRef<AudioSession | null>(null);

  useEffect(() => () => session.current?.dispose(), []);

  const touch = () => job.status === "done" && job.reset();
  const move = (i: number, d: number) => {
    touch();
    setItems((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };

  const run = () => {
    if (items.length < 2) return;
    session.current ??= new AudioSession();
    const s = session.current;
    void job.run(async (hooks) => {
      const keys: string[] = [];
      for (let i = 0; i < items.length; i++) {
        const key = `f${items[i].id}`;
        await s.load(key, items[i].file, { signal: hooks.signal, onProgress: (p) => hooks.onProgress?.(((i + p) / items.length) * 0.5) });
        keys.push(key);
      }
      return s.render(keys, {}, target, bitrate, { ...hooks, onProgress: (p) => hooks.onProgress?.(0.5 + p * 0.5) }, crossfade);
    });
  };
  const total = items.reduce((a, b) => a + b.file.size, 0);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
        <Dropzone
          onFiles={(fs) => {
            touch();
            setItems((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
          }}
          accept={MEDIA_ACCEPT}
          multiple
          locale={locale}
          title={t.add}
          hint={u.audioFormats}
          compact={items.length > 0}
        />
        {items.length > 0 && (
          <Panel>
            <ol className="divide-y divide-line">
              {items.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1 py-2 pl-4 pr-2 motion-safe:animate-[menu-in_200ms_var(--ease-emph)]">
                  <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-container text-[0.8125rem] font-semibold text-on-accent-container">{i + 1}</span>
                  <span className="ml-2 min-w-0 flex-1">
                    <span className="block truncate text-fg" title={c.file.name}>
                      {c.file.name}
                    </span>
                    <span className="tabular text-[0.8125rem] text-fg-3">{formatBytes(locale, c.file.size)}</span>
                  </span>
                  <IconButton size="sm" label={`${t.up}: ${c.file.name}`} title={t.up} icon={<ArrowUp aria-hidden />} onClick={() => move(i, -1)} disabled={i === 0 || job.running} />
                  <IconButton size="sm" label={`${t.down}: ${c.file.name}`} title={t.down} icon={<ArrowDown aria-hidden />} onClick={() => move(i, 1)} disabled={i === items.length - 1 || job.running} />
                  <IconButton
                    size="sm"
                    label={`${u.remove}: ${c.file.name}`}
                    title={u.remove}
                    icon={<X aria-hidden />}
                    onClick={() => {
                      touch();
                      session.current?.drop(`f${c.id}`);
                      setItems((l) => l.filter((x) => x.id !== c.id));
                    }}
                    disabled={job.running}
                  />
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <Panel className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-2xl font-bold tracking-tight text-fg">{count(locale, items.length, t.files)}</span>
            {items.length > 0 && <span className="tabular text-fg-2">{formatBytes(locale, total)}</span>}
          </div>
          <StepSlider label={t.crossfade} value={crossfade} steps={CROSSFADES} format={(x) => (x ? `${formatNumber(locale, x)} ${t.sec}` : t.none)} onChange={(x) => (setCrossfade(x), touch())} />
          <Setting label={t.format}>
            <ChoiceChips label={t.format} value={target} onChange={(x) => (setTarget(x), touch())} options={TARGETS.map((x) => ({ value: x, label: LABEL[x] }))} />
          </Setting>
          {target !== "wav" && target !== "flac" && (
            <StepSlider label={t.bitrate} value={bitrate} steps={BITRATES.filter((k) => target !== "opus" || k <= 256000)} format={(k) => `${k / 1000} ${t.kbps}`} onChange={(x) => (setBitrate(x), touch())} />
          )}
          {!job.result && !job.running && (
            <Button variant="filled" size="xl" fullWidth onClick={run} disabled={items.length < 2}>
              <Combine aria-hidden />
              <span className="truncate">{items.length < 2 ? t.need : t.run}</span>
            </Button>
          )}
          <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
        </Panel>
        {job.status === "done" && job.result && (
          <ResultCard blob={job.result.blob} name={`merged.${target}`} locale={locale} kind="audio" result={job.result} onReset={job.reset} resetLabel={u.edit} />
        )}
      </div>
    </div>
  );
}
