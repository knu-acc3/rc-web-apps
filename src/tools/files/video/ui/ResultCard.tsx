"use client";

import { Check, Download, RotateCcw } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { formatBytes, formatNumber } from "@/i18n/format";
import { downloadBlob } from "@/lib/clipboard";
import { Button } from "@/ui/button";
import { Badge, Panel } from "@/ui/panel";
import { codecLabel, type JobResult } from "../../shared/spec";
import { formatTime } from "../../shared/time";
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

/** Change of size as a short badge text: "−35 %" / "+12 %" (null when about the same). */
function pctChange(locale: Locale, out: number, input: number): { text: string; smaller: boolean } | null {
  if (!input) return null;
  const pct = Math.round((1 - out / input) * 100);
  if (pct === 0) return null;
  return { text: `${pct > 0 ? "−" : "+"}${formatNumber(locale, Math.abs(pct))} %`, smaller: pct > 0 };
}

/**
 * Finished file: preview, the real size in big type (and how it changed), one big download button, how it was made.
 * Pops in and scrolls itself into view on phones, where it appears below the settings.
 */
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
  const root = useRef<HTMLDivElement>(null);
  const video = useBlobSrc<HTMLVideoElement>(kind === "video" ? blob : null);
  const audio = useBlobSrc<HTMLAudioElement>(kind === "audio" ? blob : null);
  const img = useBlobSrc<HTMLImageElement>(kind === "image" ? blob : null);
  const modeLabel = result?.mode === "copy" ? t.copyMode : result?.mode === "mixed" ? t.mixedMode : result ? t.transcodeMode : null;
  const change = inputSize ? pctChange(locale, blob.size, inputSize) : null;
  const facts = [
    inputSize ? `${t.was} ${formatBytes(locale, inputSize)}` : null,
    result?.duration ? formatTime(result.duration, 1) : null,
    result?.width && result?.height ? `${result.width}×${result.height}` : null,
  ].filter(Boolean);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top > window.innerHeight - 120) {
      const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "nearest" });
    }
  }, []);

  return (
    <Panel ref={root} className="overflow-hidden motion-safe:animate-[menu-in_260ms_var(--ease-emph)]">
      {kind === "video" && <video ref={video} controls playsInline preload="metadata" className="max-h-[60vh] w-full bg-black" aria-label={name} />}
      {kind === "image" && (
        <div className="flex justify-center bg-surface-2 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={img} alt={name} className="max-h-[60vh] w-auto max-w-full rounded-[0.5rem] bg-[repeating-conic-gradient(#8882_0_25%,transparent_0_50%)] bg-[length:16px_16px]" />
        </div>
      )}
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {kind === "audio" && <audio ref={audio} controls preload="metadata" className="w-full" aria-label={name} />}
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
            <Check className="size-6" strokeWidth={2.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1" aria-live="polite">
            <span className="sr-only">{t.done}: </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="tabular text-3xl font-bold tracking-tight text-fg">{formatBytes(locale, blob.size)}</span>
              {change && <Badge tone={change.smaller ? "ok" : "warn"}>{change.text}</Badge>}
            </div>
            {facts.length > 0 && <p className="tabular text-sm text-fg-2">{facts.join(" · ")}</p>}
            <p className="truncate text-sm text-fg-3" title={name}>
              {name}
            </p>
          </div>
        </div>
        <Button variant="filled" size="xl" fullWidth onClick={() => downloadBlob(blob, name)}>
          <Download aria-hidden />
          {t.download}
        </Button>
        {children}
        {(modeLabel || onReset) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {modeLabel && (
                <Badge tone={result?.mode === "copy" ? "ok" : "neutral"} title={result?.mode === "copy" ? t.copyModeHint : undefined}>
                  {modeLabel}
                </Badge>
              )}
              {result?.codecs?.filter((c) => c && c !== "?").map((c) => <Badge key={c}>{codecLabel(c)}</Badge>)}
              {result && <Badge title={result.engine === "ffmpeg" ? t.engineFfmpeg : t.engineWebCodecs}>{result.engine === "ffmpeg" ? "ffmpeg" : "WebCodecs"}</Badge>}
            </div>
            {onReset && (
              <Button variant="text" size="sm" onClick={onReset} className="ml-auto">
                <RotateCcw aria-hidden />
                {resetLabel ?? t.again}
              </Button>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
