"use client";

import { FileAudio, FileVideo, FolderOpen } from "lucide-react";
import { useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { Button } from "@/ui/button";
import { Dropzone } from "@/ui/dropzone";
import { Notice } from "@/ui/panel";
import { codecLabel, type MediaInfo } from "../../shared/spec";
import { formatTime } from "../../shared/time";
import type { Probe } from "./hooks";
import { UI } from "./strings";

export const VIDEO_ACCEPT =
  "video/*,.mp4,.m4v,.mov,.qt,.mkv,.webm,.avi,.wmv,.asf,.flv,.f4v,.3gp,.3g2,.ts,.mts,.m2ts,.mpg,.mpeg,.vob,.ogv";
const AUDIO_ACCEPT =
  "audio/*,.mp3,.wav,.m4a,.m4b,.aac,.flac,.ogg,.oga,.opus,.wma,.aif,.aiff,.amr,.ac3,.caf,.mka,.weba";
export const MEDIA_ACCEPT = `${AUDIO_ACCEPT},${VIDEO_ACCEPT}`;

/**
 * Drop area when empty; a compact file row with a "choose another" button when a file is loaded (the row has no
 * card of its own: it sits at the top of the tool's settings card).
 */
export function FilePicker({
  locale,
  file,
  onFile,
  accept,
  kind,
  disabled,
  children,
}: {
  locale: Locale;
  file: File | null;
  onFile: (f: File) => void;
  accept: string;
  kind: "video" | "audio" | "media";
  disabled?: boolean;
  children?: ReactNode;
}) {
  const t = UI[locale];
  const input = useRef<HTMLInputElement>(null);
  if (!file) {
    return (
      <Dropzone
        onFiles={(fs) => fs[0] && onFile(fs[0])}
        accept={accept}
        disabled={disabled}
        locale={locale}
        title={kind === "video" ? t.chooseVideo : kind === "audio" ? t.chooseAudio : t.chooseMedia}
        hint={kind === "video" ? t.videoFormats : t.audioFormats}
      />
    );
  }
  const Icon = kind === "audio" ? FileAudio : FileVideo;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] bg-accent-container text-on-accent-container">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-fg" title={file.name}>
            {file.name}
          </div>
          <div className="tabular text-sm text-fg-3">{formatBytes(locale, file.size)}</div>
        </div>
        <Button variant="tonal" size="sm" onClick={() => input.current?.click()} disabled={disabled}>
          <FolderOpen aria-hidden />
          <span className="max-[22rem]:sr-only">{t.change}</span>
        </Button>
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {children}
    </div>
  );
}

function kbps(locale: Locale, bps: number | null | undefined): string | null {
  if (!bps) return null;
  const t = UI[locale];
  return bps >= 1_000_000 ? `${formatNumber(locale, bps / 1_000_000, { maximumFractionDigits: 1 })} ${t.mbps}` : `${formatNumber(locale, Math.round(bps / 1000))} ${t.kbps}`;
}

/** Technical summary of a media file from the probe. */
export function MediaFacts({ locale, probe }: { locale: Locale; probe: Probe }) {
  const t = UI[locale];
  if (probe.loading) return <p className="text-sm text-fg-3">{t.probing}</p>;
  const info: MediaInfo | null = probe.info;
  const rows: [string, string][] = [];
  const container = probe.detected?.name ?? info?.container;
  if (container) rows.push([t.detected, container]);
  if (info?.duration) rows.push([t.duration, formatTime(info.duration, 1)]);
  if (info?.video) {
    const v = info.video;
    rows.push([t.video, [codecLabel(v.codec), `${v.width}×${v.height}`, v.fps ? `${formatNumber(locale, v.fps, { maximumFractionDigits: 2 })} ${t.fps}` : null, kbps(locale, v.bitrate)].filter(Boolean).join(" · ")]);
  }
  if (info?.audio) {
    const a = info.audio;
    rows.push([t.audio, [codecLabel(a.codec), `${formatNumber(locale, a.sampleRate)} ${t.hz}`, a.channels === 1 ? t.mono : a.channels === 2 ? t.stereo : `${a.channels} ch`, kbps(locale, a.bitrate)].filter(Boolean).join(" · ")]);
  } else if (info?.readable) {
    rows.push([t.audio, t.noTrack]);
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.length > 0 && (
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-fg-3">{k}</dt>
              <dd className="tabular min-w-0 break-words text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {info && !info.readable && <Notice>{t.unreadable}</Notice>}
    </div>
  );
}
