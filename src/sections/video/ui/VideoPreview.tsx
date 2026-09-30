"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Filmstrip } from "./Filmstrip";
import { useBlobSrc } from "./hooks";

export interface PreviewHandle {
  seek(t: number): void;
  /** Play [start, end) once. */
  playRange(start: number, end: number): void;
  pause(): void;
  video(): HTMLVideoElement | null;
}

/**
 * Native <video> preview of a local file. When the browser can't play the format
 * (AVI, WMV, MKV in Safari…) it shows decoded thumbnails instead.
 */
export const VideoPreview = forwardRef<
  PreviewHandle,
  { file: File; className?: string; onTime?: (t: number) => void; onPlayable?: (ok: boolean) => void; style?: React.CSSProperties; label: string }
>(function VideoPreview({ file, className, onTime, onPlayable, style, label }, ref) {
  const el = useBlobSrc<HTMLVideoElement>(file);
  const stopAt = useRef<number | null>(null);
  const [failed, setFailed] = useState<File | null>(null);
  const cbs = useRef({ onTime, onPlayable });
  useEffect(() => {
    cbs.current = { onTime, onPlayable };
  }, [onTime, onPlayable]);

  useImperativeHandle(ref, () => ({
    seek(t) {
      const v = el.current;
      if (v) v.currentTime = t;
    },
    playRange(start, end) {
      const v = el.current;
      if (!v) return;
      stopAt.current = end;
      v.currentTime = start;
      void v.play().catch(() => undefined);
    },
    pause() {
      el.current?.pause();
    },
    video: () => el.current,
  }));

  useEffect(() => {
    const v = el.current;
    if (!v) return;
    let raf = 0;
    const tick = () => {
      const t = v.currentTime;
      if (stopAt.current !== null && t >= stopAt.current) {
        v.pause();
        stopAt.current = null;
      }
      cbs.current.onTime?.(t);
      if (!v.paused) raf = requestAnimationFrame(tick);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onSeek = () => cbs.current.onTime?.(v.currentTime);
    const onPause = () => {
      cancelAnimationFrame(raf);
      cbs.current.onTime?.(v.currentTime);
    };
    const onError = () => {
      setFailed(file);
      cbs.current.onPlayable?.(false);
    };
    const onMeta = () => cbs.current.onPlayable?.(v.videoWidth > 0);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", onSeek);
    v.addEventListener("error", onError);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeked", onSeek);
      v.removeEventListener("error", onError);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [el, file]);

  const broken = failed === file;
  return (
    <div className={cn("relative overflow-hidden rounded-[0.75rem] bg-black", className)}>
      <video ref={el} controls playsInline preload="metadata" aria-label={label} className={cn("block max-h-[55vh] w-full", broken && "hidden")} style={style} />
      {broken && (
        <div className="aspect-video w-full">
          <Filmstrip file={file} count={6} />
        </div>
      )}
    </div>
  );
});
