"use client";

import { ArrowDown, ArrowUp, Combine, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { count, formatBytes } from "@/i18n/format";
import { Button, IconButton } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Notice, Panel } from "@/ui/panel";
import { checkMerge, runMerge } from "../shared/client";
import type { ClipCheck } from "../shared/ops-video";
import type { JobResult } from "../shared/spec";
import { VIDEO_ACCEPT } from "./ui/FilePicker";
import { useJob, useWebCodecs } from "./ui/hooks";
import { JobProgress } from "./ui/Progress";
import { ResultCard } from "./ui/ResultCard";
import { UI } from "./ui/strings";

const T = {
  ru: {
    add: "Перетащите видео сюда или нажмите, чтобы добавить",
    clips: ["клип", "клипа", "клипов"],
    up: "Выше",
    down: "Ниже",
    copy: "Формат одинаковый — склеим без перекодирования и потери качества",
    reencode: "Клипы отличаются ({why}) — перекодируем в H.264 по размеру первого клипа",
    why: { codec: "кодек", size: "разрешение", audio: "звук", rotation: "ориентация", config: "параметры кодирования", unreadable: "формат" } as Record<string, string>,
    unreadable: "Один из файлов браузер прочитать не может (например, AVI или WMV). Сначала сконвертируйте его в MP4.",
    checking: "Проверяем совместимость…",
    run: "Склеить видео",
    need: "Добавьте хотя бы два видео",
  },
  en: {
    add: "Drop videos here or click to add",
    clips: ["clip", "clips"],
    up: "Move up",
    down: "Move down",
    copy: "Same format — joined without re-encoding or quality loss",
    reencode: "The clips differ ({why}) — re-encoded to H.264 at the first clip's size",
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

  const canRun = clips.length >= 2 && !!current && current.reason !== "unreadable";
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
        <Dropzone
          onFiles={(fs) => {
            job.reset();
            setClips((l) => [...l, ...fs.map((file) => ({ id: ++seq, file }))]);
          }}
          accept={VIDEO_ACCEPT}
          multiple
          locale={locale}
          title={t.add}
          hint={u.videoFormats}
          compact={clips.length > 0}
        />
        {clips.length > 0 && (
          <Panel>
            <ol className="divide-y divide-line">
              {clips.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1 py-2 pl-4 pr-2 motion-safe:animate-[menu-in_200ms_var(--ease-emph)]">
                  <span className="tabular flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-container text-[0.8125rem] font-semibold text-on-accent-container">{i + 1}</span>
                  <span className="ml-2 min-w-0 flex-1">
                    <span className="block truncate text-fg" title={c.file.name}>
                      {c.file.name}
                    </span>
                    <span className="tabular text-[0.8125rem] text-fg-3">{formatBytes(locale, c.file.size)}</span>
                  </span>
                  <IconButton size="sm" label={`${t.up}: ${c.file.name}`} title={t.up} icon={<ArrowUp aria-hidden />} onClick={() => move(i, -1)} disabled={i === 0 || job.running} />
                  <IconButton size="sm" label={`${t.down}: ${c.file.name}`} title={t.down} icon={<ArrowDown aria-hidden />} onClick={() => move(i, 1)} disabled={i === clips.length - 1 || job.running} />
                  <IconButton
                    size="sm"
                    label={`${u.remove}: ${c.file.name}`}
                    title={u.remove}
                    icon={<X aria-hidden />}
                    onClick={() => {
                      job.reset();
                      setClips((l) => l.filter((x) => x.id !== c.id));
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
        <Panel className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-2xl font-bold tracking-tight text-fg">{count(locale, clips.length, t.clips)}</span>
            {clips.length > 0 && <span className="tabular text-fg-2">{formatBytes(locale, total)}</span>}
          </div>
          {clips.length >= 2 &&
            (current ? (
              current.reason === "unreadable" ? (
                <Notice tone="warn">{t.unreadable}</Notice>
              ) : (
                <p className={current.compatible ? "text-sm text-ok" : "text-sm text-fg-2"}>{current.compatible ? t.copy : t.reencode.replace("{why}", t.why[current.reason ?? "codec"])}</p>
              )
            ) : (
              <p className="text-sm text-fg-3">{t.checking}</p>
            ))}
          {webcodecs === false && <Notice tone="warn">{u.noWebCodecs}</Notice>}
          {!job.result && !job.running && (
            <Button variant="filled" size="xl" fullWidth onClick={run} disabled={!canRun}>
              <Combine aria-hidden />
              <span className="truncate">{clips.length < 2 ? t.need : t.run}</span>
            </Button>
          )}
          <JobProgress job={job} locale={locale} onCancel={job.cancel} onRetry={run} />
        </Panel>
        {job.status === "done" && job.result && (
          <ResultCard blob={job.result.blob} name={`merged.${ext}`} locale={locale} kind="video" result={job.result} inputSize={total} onReset={job.reset} resetLabel={u.edit} />
        )}
      </div>
    </div>
  );
}
