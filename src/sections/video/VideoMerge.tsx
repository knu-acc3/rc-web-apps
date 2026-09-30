"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Badge, Notice, Panel } from "@/ui/panel";
import { checkMerge, runMerge } from "./engine/client";
import type { ClipCheck } from "./engine/ops-video";
import type { JobResult } from "./engine/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useWebCodecs } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";

const T = {
  ru: {
    add: "Перетащите видео сюда или нажмите, чтобы добавить (в порядке склейки)",
    clips: ["клип", "клипа", "клипов"],
    up: "Выше",
    down: "Ниже",
    copy: "Клипы одинакового формата — склеим без перекодирования, быстро и без потери качества",
    reencode: "Клипы отличаются ({why}) — видео будет перекодировано в H.264 с размером первого клипа",
    why: { codec: "кодек", size: "разрешение", audio: "звук", rotation: "ориентация", config: "параметры кодирования", unreadable: "формат" } as Record<string, string>,
    unreadable: "Один из файлов браузер прочитать не может (например, AVI или WMV). Сначала сконвертируйте его в MP4.",
    checking: "Проверяем совместимость…",
    run: "Склеить видео",
    need: "Добавьте хотя бы два видео",
  },
  en: {
    add: "Drop videos here or click to add (in joining order)",
    clips: ["clip", "clips"],
    up: "Move up",
    down: "Move down",
    copy: "The clips share one format — they'll be joined without re-encoding, fast and lossless",
    reencode: "The clips differ ({why}) — the video will be re-encoded to H.264 at the first clip's size",
    why: { codec: "codec", size: "resolution", audio: "audio", rotation: "orientation", config: "encoder settings", unreadable: "format" } as Record<string, string>,
    unreadable: "The browser can't read one of the files (e.g. AVI or WMV). Convert it to MP4 first.",
    checking: "Checking compatibility…",
    run: "Merge videos",
    need: "Add at least two videos",
  },
} as const;

let seq = 0;

export default function VideoMerge({ locale }: { locale: Locale }) {
  const t = T[locale];
  const u = UI[locale];
  const webcodecs = useWebCodecs();
  const [clips, setClips] = useState<{ id: number; file: File }[]>([]);
  const [check, setCheck] = useState<{ key: string; res: ClipCheck } | null>(null);
  const job = useJob<JobResult>();
  const key = clips.map((c) => c.id).join(",");

  useEffect(() => {
    if (clips.length < 2) return;
    const c = new AbortController();
    checkMerge(
      clips.map((x) => x.file),
      c.signal,
    )
      .then((res) => !c.signal.aborted && setCheck({ key, res }))
      .catch(() => undefined);
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = check?.key === key ? check.res : null;
  const move = (i: number, d: number) => {
    job.reset();
    setClips((l) => {
      const n = [...l];
      const j = i + d;
      if (j < 0 || j >= n.length) return l;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  };
  const run = () => {
    if (clips.length < 2 || !current || current.reason === "unreadable") return;
    void job.run((hooks) =>
      runMerge(
        clips.map((c) => c.file),
        !current.compatible,
        hooks,
      ),
    );
  };
  const total = clips.reduce((s, c) => s + c.file.size, 0);
  const ext = job.result?.blob.type.includes("webm") ? "webm" : job.result?.blob.type.includes("matroska") ? "mkv" : "mp4";

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onFiles={(fs) => {
          job.reset();
          setClips((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
        }}
        accept={VIDEO_ACCEPT}
        multiple
        title={t.add}
        hint={u.localNote}
        compact={clips.length > 0}
      />
      {webcodecs === false && <Notice tone="warn">{u.noWebCodecs}</Notice>}
      {clips.length > 0 && (
        <Panel>
          <ol className="divide-y divide-line">
            {clips.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 px-4 py-2.5">
                <span className="tabular w-6 shrink-0 text-sm text-fg-3">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg" title={c.file.name}>
                    {c.file.name}
                  </span>
                  <span className="text-[13px] text-fg-3">{formatBytes(locale, c.file.size)}</span>
                </span>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0 || job.running} aria-label={`${t.up}: ${c.file.name}`} title={t.up}>
                  <ArrowUp aria-hidden />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === clips.length - 1 || job.running} aria-label={`${t.down}: ${c.file.name}`} title={t.down}>
                  <ArrowDown aria-hidden />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => {
                    job.reset();
                    setClips((l) => l.filter((x) => x.id !== c.id));
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
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3 text-sm text-fg-2">
            {count(locale, clips.length, t.clips)} · {formatBytes(locale, total)}
            {clips.length >= 2 &&
              (current ? (
                current.reason === "unreadable" ? null : <Badge tone={current.compatible ? "ok" : "neutral"}>{current.compatible ? t.copy : t.reencode.replace("{why}", t.why[current.reason ?? "codec"])}</Badge>
              ) : (
                <span className="text-fg-3">{t.checking}</span>
              ))}
          </div>
        </Panel>
      )}
      {current?.reason === "unreadable" && <Notice tone="warn">{t.unreadable}</Notice>}
      {!job.result && clips.length > 0 && (
        <Button variant="primary" size="lg" onClick={run} disabled={job.running || clips.length < 2 || !current || current.reason === "unreadable"} className="w-full sm:w-auto sm:self-start">
          <Combine aria-hidden />
          {clips.length < 2 ? t.need : t.run}
        </Button>
      )}
      <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
      {job.status === "done" && job.result && (
        <ResultCard blob={job.result.blob} name={`merged.${ext}`} locale={locale} kind="video" result={job.result} inputSize={total} onReset={job.reset} resetLabel={u.edit} />
      )}
    </div>
  );
}
