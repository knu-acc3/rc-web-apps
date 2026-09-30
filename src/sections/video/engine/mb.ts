/**
 * mediabunny helpers used inside the media worker (WebCodecs engine).
 */
import type * as MB from "mediabunny";
import type { AudioTarget, FallbackReason, MediaInfo, QualityLevel, Rotation, Target, VideoTarget } from "./spec";
export { canCopyAudio, canCopyVideo } from "./spec";

export type Mediabunny = typeof MB;

let mbPromise: Promise<Mediabunny> | null = null;
export function mediabunny(): Promise<Mediabunny> {
  mbPromise ??= import("mediabunny");
  return mbPromise;
}

/** Error that asks the client to retry the job with ffmpeg. */
export class FallbackError extends Error {
  constructor(public reason: FallbackReason, message?: string) {
    super(message ?? `FALLBACK_${reason}`);
  }
}

/** Error with a stable code for user-facing messages. */
export class JobError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
  }
}

export function hasWebCodecs(): boolean {
  return typeof VideoDecoder !== "undefined" && typeof AudioDecoder !== "undefined";
}

export function openInput(mb: Mediabunny, blob: Blob): MB.Input {
  return new mb.Input({ source: new mb.BlobSource(blob), formats: mb.ALL_FORMATS });
}

export function outputFormat(mb: Mediabunny, target: Target): MB.OutputFormat {
  switch (target) {
    case "mp4":
    case "m4a":
      return new mb.Mp4OutputFormat({ fastStart: "in-memory" });
    case "mov":
      return new mb.MovOutputFormat({ fastStart: "in-memory" });
    case "mkv":
      return new mb.MkvOutputFormat();
    case "webm":
      return new mb.WebMOutputFormat();
    case "mp3":
      return new mb.Mp3OutputFormat();
    case "wav":
      return new mb.WavOutputFormat();
    case "aac":
      return new mb.AdtsOutputFormat();
    case "ogg":
    case "opus":
      return new mb.OggOutputFormat();
    case "flac":
      return new mb.FlacOutputFormat();
    case "gif":
      throw new JobError("BAD_TARGET");
  }
}

/** The audio codec we want for an audio-only target (vorbis for .ogg: games and players expect Vorbis). */
export const AUDIO_TARGET_CODEC: Record<AudioTarget, MB.AudioCodec> = {
  mp3: "mp3",
  wav: "pcm-s16",
  m4a: "aac",
  aac: "aac",
  ogg: "vorbis",
  opus: "opus",
  flac: "flac",
};

/** First encodable video codec for a container, preferring the most compatible one. */
export async function pickVideoCodec(mb: Mediabunny, target: VideoTarget, width?: number, height?: number): Promise<MB.VideoCodec | null> {
  const order: MB.VideoCodec[] = target === "webm" ? ["vp9", "vp8", "av1"] : ["avc", "hevc"];
  return mb.getFirstEncodableVideoCodec(order, width && height ? { width, height } : undefined);
}

/** First encodable audio codec for a video container (AAC for MP4/MOV/MKV, Opus for WebM). */
export async function pickAudioCodec(mb: Mediabunny, target: VideoTarget): Promise<MB.AudioCodec | null> {
  // Opus-in-MP4 is the fallback where the browser has no AAC encoder (e.g. Chrome on Linux).
  const order: MB.AudioCodec[] = target === "webm" ? ["opus", "vorbis"] : target === "mov" ? ["aac"] : ["aac", "opus"];
  return mb.getFirstEncodableAudioCodec(order);
}

export function quality(mb: Mediabunny, level?: QualityLevel, bitrate?: number): MB.Quality {
  if (bitrate) return new mb.Quality({ bitrate, bitrateMode: "variable" });
  return new mb.Quality(level ?? "high");
}

export async function probe(mb: Mediabunny, blob: Blob): Promise<MediaInfo> {
  const input = openInput(mb, blob);
  try {
    if (!(await input.canRead())) return { readable: false, container: null, mime: null, duration: null, video: null, audio: null };
    const format = await input.getFormat();
    const v = await input.getPrimaryVideoTrack();
    const a = await input.getPrimaryAudioTrack();
    let duration: number | null = await input.getDurationFromMetadata().catch(() => null);
    if (!duration || !Number.isFinite(duration)) duration = await input.computeDuration().catch(() => null);
    const info: MediaInfo = {
      readable: true,
      container: format.name,
      mime: await input.getMimeType().catch(() => format.mimeType),
      duration: duration && Number.isFinite(duration) ? duration : null,
      video: null,
      audio: null,
    };
    if (v) {
      let fps: number | null = null;
      try {
        const stats = await v.computePacketStats(120);
        fps = stats.averagePacketRate || null;
      } catch {
        fps = null;
      }
      info.video = {
        codec: await v.getCodec(),
        canDecode: hasWebCodecs() ? await v.canDecode().catch(() => false) : false,
        bitrate: await v.getAverageBitrate().catch(() => null),
        width: await v.getDisplayWidth(),
        height: await v.getDisplayHeight(),
        rotation: (await v.getRotation()) as Rotation,
        fps: fps && Number.isFinite(fps) ? Math.round(fps * 100) / 100 : null,
      };
    }
    if (a) {
      info.audio = {
        codec: await a.getCodec(),
        canDecode: hasWebCodecs() ? await a.canDecode().catch(() => false) : false,
        bitrate: await a.getAverageBitrate().catch(() => null),
        sampleRate: await a.getSampleRate(),
        channels: await a.getNumberOfChannels(),
      };
    }
    return info;
  } finally {
    input.dispose();
  }
}
