"use client";

import { Download, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Badge, Panel } from "@/ui/panel";
import { codecLabel, type JobResult } from "../engine/spec";
import { formatTime } from "../engine/time";
import { useBlobSrc } from "./hooks";
import { UI } from "./strings";

export function sizeChange(locale: Locale, out: number, input: number): string {
  const t = UI[locale];
  if (!input) return "";
  const pct = Math.round((1 - out / input) * 100);
  if (pct === 0) return `≈ ${t.was} ${formatBytes(locale, input)}`;
  return pct > 0
    ? `${formatNumber(locale, pct)} % ${t.smaller} (${t.was} ${formatBytes(locale, input)})`
    : `${formatNumber(locale, -pct)} % ${t.larger} (${t.was} ${formatBytes(locale, input)})`;
}

/** Finished file: preview, real size, how it was made, download. */
export function ResultCard({
  blob,
  name,
  locale,
  kind,
  result,
  inputSize,
  onReset,
  resetLabel,
  children,
}: {
  blob: Blob;
  name: string;
  locale: Locale;
  kind: "video" | "audio" | "image" | "file";
  result?: JobResult | null;
  inputSize?: number;
  onReset?: () => void;
  resetLabel?: string;
  children?: ReactNode;
}) {
  const t = UI[locale];
  const video = useBlobSrc<HTMLVideoElement>(kind === "video" ? blob : null);
  const audio = useBlobSrc<HTMLAudioElement>(kind === "audio" ? blob : null);
  const img = useBlobSrc<HTMLImageElement>(kind === "image" ? blob : null);
  const modeLabel = result?.mode === "copy" ? t.copyMode : result?.mode === "mixed" ? t.mixedMode : result ? t.transcodeMode : null;
  return (
    <Panel className="overflow-hidden">
      {kind === "video" && <video ref={video} controls playsInline preload="metadata" className="max-h-[60vh] w-full bg-black" aria-label={name} />}
      {kind === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} alt={name} className="mx-auto max-h-[60vh] w-auto max-w-full bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px]" />
      )}
      <div className="flex flex-col gap-3 p-4">
        {kind === "audio" && <audio ref={audio} controls preload="metadata" className="w-full" aria-label={name} />}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg" title={name}>
              {name}
            </div>
            <p className="tabular text-sm text-fg-2" aria-live="polite">
              {t.done}: {formatBytes(locale, blob.size)}
              {inputSize ? ` · ${sizeChange(locale, blob.size, inputSize)}` : ""}
              {result?.duration ? ` · ${formatTime(result.duration, 1)}` : ""}
              {result?.width && result?.height ? ` · ${result.width}×${result.height}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => downloadBlob(blob, name)}>
              <Download aria-hidden />
              {t.download}
            </Button>
            {onReset && (
              <Button variant="outline" onClick={onReset}>
                <RotateCcw aria-hidden />
                {resetLabel ?? t.again}
              </Button>
            )}
          </div>
        </div>
        {(modeLabel || result?.codecs?.length) && (
          <div className="flex flex-wrap gap-1.5">
            {modeLabel && (
              <Badge tone={result?.mode === "copy" ? "ok" : "neutral"} title={result?.mode === "copy" ? t.copyModeHint : undefined}>
                {modeLabel}
              </Badge>
            )}
            {result?.codecs?.filter((c) => c && c !== "?").map((c) => <Badge key={c}>{codecLabel(c)}</Badge>)}
            {result && <Badge>{result.engine === "ffmpeg" ? t.engineFfmpeg : t.engineWebCodecs}</Badge>}
          </div>
        )}
        {children}
      </div>
    </Panel>
  );
}
