"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Field, Select } from "@/ui/field";
import { Panel } from "@/ui/panel";
import { AudioSession } from "@/tools/files/shared/client";
import type { AudioTarget, JobResult } from "@/tools/files/shared/spec";
import { MEDIA_ACCEPT } from "@/tools/files/video/ui/FilePicker";
import { useJob } from "@/tools/files/video/ui/hooks";
import { JobProgress } from "@/tools/files/video/ui/Progress";
import { ResultCard } from "@/tools/files/video/ui/ResultCard";
import { UI } from "@/tools/files/video/ui/strings";

const T = {
  ru: {
    add: "Перетащите аудиофайлы сюда или нажмите, чтобы добавить (в порядке склейки)",
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
    add: "Drop audio files here or click to add (in joining order)",
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
const LABEL: Record<string, string> = { mp3: "MP3", wav: "WAV", m4a: "M4A", ogg: "OGG", opus: "Opus", flac: "FLAC" };
let seq = 0;

export default function AudioMerge({ locale }: { locale: Locale }) {
  const t = T[locale];
  const u = UI[locale];
  const id = useId();
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
    <div className="flex flex-col gap-4">
      <Dropzone
        onFiles={(fs) => {
          touch();
          setItems((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
        }}
        accept={MEDIA_ACCEPT}
        multiple
        title={t.add}
        hint={u.localNote}
        compact={items.length > 0}
      />
      {items.length > 0 && (
        <Panel>
          <ol className="divide-y divide-line">
            {items.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 px-4 py-2.5">
                <span className="tabular w-6 shrink-0 text-sm text-fg-3">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg" title={c.file.name}>
                    {c.file.name}
                  </span>
                  <span className="text-[0.8125rem] text-fg-3">{formatBytes(locale, c.file.size)}</span>
                </span>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0 || job.running} aria-label={`${t.up}: ${c.file.name}`} title={t.up}>
                  <ArrowUp aria-hidden />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1 || job.running} aria-label={`${t.down}: ${c.file.name}`} title={t.down}>
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    touch();
                    session.current?.drop(`f${c.id}`);
                    setItems((l) => l.filter((x) => x.id !== c.id));
                  }}
                  disabled={job.running}
                  aria-label={`${u.remove}: ${c.file.name}`}
                  title={u.remove}
                >
                  <X aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
          <p className="border-t border-line px-4 py-3 text-sm text-fg-2">
            {count(locale, items.length, t.files)} · {formatBytes(locale, total)}
          </p>
        </Panel>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t.crossfade} htmlFor={`${id}-x`} className="w-44">
            <Select id={`${id}-x`} size="sm" value={String(crossfade)} onChange={(e) => (setCrossfade(Number(e.target.value)), touch())}>
              {[0, 0.5, 1, 2, 3, 5, 8].map((x) => (
                <option key={x} value={x}>
                  {x ? `${formatNumber(locale, x)} ${t.sec}` : t.none}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.format} htmlFor={`${id}-t`} className="w-32">
            <Select id={`${id}-t`} size="sm" value={target} onChange={(e) => (setTarget(e.target.value as AudioTarget), touch())}>
              {TARGETS.map((x) => (
                <option key={x} value={x}>
                  {LABEL[x]}
                </option>
              ))}
            </Select>
          </Field>
          {target !== "wav" && target !== "flac" && (
            <Field label={t.bitrate} htmlFor={`${id}-b`} className="w-36">
              <Select id={`${id}-b`} size="sm" value={String(bitrate)} onChange={(e) => (setBitrate(Number(e.target.value)), touch())}>
                {[128, 160, 192, 256, 320].filter((k) => target !== "opus" || k <= 256).map((k) => (
                  <option key={k} value={k * 1000}>
                    {k} {t.kbps}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}
      {!job.result && items.length > 0 && (
        <Button variant="primary" size="lg" onClick={run} disabled={job.running || items.length < 2} className="w-full sm:w-auto sm:self-start">
          <Combine aria-hidden />
          {items.length < 2 ? t.need : t.run}
        </Button>
      )}
      <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
      {job.status === "done" && job.result && (
        <ResultCard blob={job.result.blob} name={`merged.${target}`} locale={locale} kind="audio" result={job.result} onReset={job.reset} resetLabel={u.edit} />
      )}
    </div>
  );
}
