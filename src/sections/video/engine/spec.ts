/**
 * Job description shared by the WebCodecs engine (mediabunny, in a worker) and the
 * ffmpeg.wasm fallback. Everything here is JSON/structured-clone friendly.
 */

export type VideoTarget = "mp4" | "webm" | "mov" | "mkv";
export type AudioTarget = "mp3" | "wav" | "m4a" | "aac" | "ogg" | "opus" | "flac";
export type Target = VideoTarget | AudioTarget | "gif";

export const VIDEO_TARGETS: readonly VideoTarget[] = ["mp4", "webm", "mov", "mkv"];
export const AUDIO_TARGETS: readonly AudioTarget[] = ["mp3", "wav", "m4a", "aac", "ogg", "opus", "flac"];

export const isVideoTarget = (t: string): t is VideoTarget => (VIDEO_TARGETS as readonly string[]).includes(t);
export const isAudioTarget = (t: string): t is AudioTarget => (AUDIO_TARGETS as readonly string[]).includes(t);

export const TARGET_MIME: Record<Target, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  gif: "image/gif",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  flac: "audio/flac",
};

export type Rotation = 0 | 90 | 180 | 270;
export type Fit = "contain" | "cover" | "fill";
export type QualityLevel = "high" | "medium" | "low";

export interface Crop {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface VideoSpec {
  /** Output width/height in pixels (made even for H.264). Omit to keep. */
  width?: number;
  height?: number;
  fit?: Fit;
  /** Crop rectangle in display pixels (after rotation). */
  crop?: Crop;
  rotate?: Rotation;
  /** Horizontal mirror (applied after rotation). Vertical flip = rotate 180 + flip. */
  flip?: boolean;
  /** Output frame rate. */
  fps?: number;
  /** Target video bitrate, bits per second (overrides quality). */
  bitrate?: number;
  quality?: QualityLevel;
  /** Rotate/flip pixels instead of writing rotation metadata. */
  bake?: boolean;
  /** Always re-encode (e.g. precise trim). */
  forceTranscode?: boolean;
}

export interface AudioSpec {
  discard?: boolean;
  /** Bits per second for lossy codecs. */
  bitrate?: number;
  sampleRate?: number;
  channels?: 1 | 2;
  forceTranscode?: boolean;
}

export interface GifSpec {
  fps: number;
  width: number;
  /** "global" = one palette for the whole GIF (smaller, stable colours); "frame" = palette per frame (better colours). */
  palette: "global" | "frame";
  loop: boolean;
}

export interface SpeedSpec {
  factor: number;
  /** Keep the audio pitch (time-stretch) instead of the tape-style pitch change. */
  keepPitch: boolean;
}

export interface JobSpec {
  target: Target;
  trim?: { start: number; end: number };
  video?: VideoSpec;
  audio?: AudioSpec;
  gif?: GifSpec;
  speed?: SpeedSpec;
}

/** Why the WebCodecs engine could not do the job (triggers the ffmpeg fallback). */
export type FallbackReason = "container" | "decode" | "encode" | "webcodecs" | "gif-input";

export interface JobResult {
  blob: Blob;
  /** "copy" = stream copy (remux, no quality loss), "transcode", "mixed". */
  mode: "copy" | "transcode" | "mixed";
  engine: "webcodecs" | "ffmpeg";
  /** Codecs actually written, e.g. ["avc", "aac"]. */
  codecs?: string[];
  width?: number;
  height?: number;
  duration?: number;
}

export interface TrackInfo {
  codec: string | null;
  canDecode: boolean;
  bitrate: number | null;
}

export interface VideoTrackInfo extends TrackInfo {
  width: number;
  height: number;
  rotation: Rotation;
  fps: number | null;
}

export interface AudioTrackInfo extends TrackInfo {
  sampleRate: number;
  channels: number;
}

export interface MediaInfo {
  /** mediabunny could read the container. */
  readable: boolean;
  /** Container name as reported by the demuxer (e.g. "MP4", "Matroska"). */
  container: string | null;
  mime: string | null;
  duration: number | null;
  video: VideoTrackInfo | null;
  audio: AudioTrackInfo | null;
}

/** Codec label for UI. */
export function codecLabel(codec: string | null | undefined): string {
  if (!codec) return "—";
  const map: Record<string, string> = {
    avc: "H.264 (AVC)",
    hevc: "H.265 (HEVC)",
    vp8: "VP8",
    vp9: "VP9",
    av1: "AV1",
    prores: "ProRes",
    aac: "AAC",
    opus: "Opus",
    mp3: "MP3",
    vorbis: "Vorbis",
    flac: "FLAC",
    ac3: "AC-3",
    eac3: "E-AC-3",
    dts: "DTS",
    ulaw: "μ-law",
    alaw: "A-law",
  };
  if (map[codec]) return map[codec];
  if (codec.startsWith("pcm")) return `PCM (${codec.replace("pcm-", "")})`;
  return codec.toUpperCase();
}

/** Output file name: "clip.mov" → "clip.mp4", with an optional suffix ("clip-trimmed.mp4"). */
export function outputName(inputName: string, target: string, suffix = ""): string {
  const base = inputName.replace(/\.[^./\\]+$/, "") || "output";
  return `${base}${suffix}.${target}`;
}

/** Round to the nearest even integer ≥ 2 (H.264/H.265 need even dimensions for 4:2:0). */
export function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * Estimated output size in bytes for a target bitrate: (video + audio) × duration / 8,
 * plus ~2 % container overhead. Only meaningful when the bitrate is actually targeted.
 */
export function estimateBytes(videoBps: number, audioBps: number, seconds: number): number {
  return Math.round(((videoBps + audioBps) * seconds * 1.02) / 8);
}

/**
 * Video bitrate that makes a file of `targetBytes` for `seconds`, leaving room for
 * audio and ~4 % overhead/encoder overshoot. Returns null when the target is too small.
 */
export function bitrateForSize(targetBytes: number, seconds: number, audioBps: number, minVideoBps = 100_000): number | null {
  if (!(seconds > 0) || !(targetBytes > 0)) return null;
  const total = (targetBytes * 8 * 0.96) / seconds;
  const video = Math.floor(total - audioBps);
  return video >= minVideoBps ? video : null;
}

/**
 * Typical H.264 bitrate for a resolution and quality level (bits per pixel per frame ×
 * pixels × fps). 1080p30 "medium" ≈ 5 Mbit/s, in line with common streaming ladders.
 */
export function suggestedBitrate(width: number, height: number, fps: number, quality: QualityLevel): number {
  const bpp = quality === "high" ? 0.12 : quality === "medium" ? 0.08 : 0.05;
  const f = Math.min(Math.max(fps || 30, 1), 60);
  // Higher frame rates need less than linear extra bitrate.
  const fpsFactor = f <= 30 ? f : 30 + (f - 30) * 0.5;
  return Math.round(width * height * fpsFactor * bpp);
}

/* ───────────── stream-copy rules (shared by worker and UI) ───────────── */

/** Codecs a video container may hold without re-encoding (mediabunny codec ids). */
const VIDEO_COPY: Record<VideoTarget, string[]> = {
  mp4: ["avc", "hevc", "av1", "vp9"],
  mov: ["avc", "hevc", "prores"],
  mkv: ["avc", "hevc", "vp8", "vp9", "av1"],
  webm: ["vp8", "vp9", "av1"],
};
// AC-3/DTS/FLAC/Opus are allowed in MP4/MOV by the spec but Safari, QuickTime and many
// TVs can't play them there, so they are re-encoded to AAC for these containers.
const AUDIO_COPY: Record<VideoTarget, string[]> = {
  mp4: ["aac", "mp3"],
  mov: ["aac", "mp3", "pcm-s16", "pcm-s24"],
  mkv: ["aac", "mp3", "opus", "vorbis", "flac", "ac3", "eac3", "dts"],
  webm: ["opus", "vorbis"],
};

export function canCopyVideo(target: VideoTarget, codec: string | null | undefined): boolean {
  return !!codec && VIDEO_COPY[target].includes(codec);
}
export function canCopyAudio(target: VideoTarget, codec: string | null | undefined): boolean {
  return !!codec && AUDIO_COPY[target].includes(codec);
}

/** Codec each audio-only target is written with. */
export const AUDIO_CODEC_OF: Record<AudioTarget, string> = {
  mp3: "mp3",
  wav: "pcm-s16",
  m4a: "aac",
  aac: "aac",
  ogg: "vorbis",
  opus: "opus",
  flac: "flac",
};

/** Targets whose encoder is not part of WebCodecs: they need the ffmpeg module unless the stream is copied. */
export const FFMPEG_ENCODED: readonly Target[] = ["mp3", "flac", "ogg"];

export type Plan = "copy" | "encode" | "ffmpeg" | "unknown";

/** What will most likely happen for a file (shown before starting). */
export function planFor(info: MediaInfo | null, spec: JobSpec): Plan {
  if (!info) return "unknown";
  if (!info.readable) return "ffmpeg";
  const t = spec.target;
  if (t === "gif") return info.video?.canDecode ? "encode" : "ffmpeg";
  if (isAudioTarget(t)) {
    if (!info.audio) return "unknown";
    const same = info.audio.codec === AUDIO_CODEC_OF[t] && !spec.audio?.bitrate && !spec.audio?.sampleRate && !spec.audio?.channels && !spec.speed;
    if (same) return "copy";
    if (!info.audio.canDecode || FFMPEG_ENCODED.includes(t)) return "ffmpeg";
    return "encode";
  }
  const v = spec.video ?? {};
  const changes = !!(v.width || v.height || v.crop || v.fps || v.bitrate || v.forceTranscode || spec.speed || ((v.rotate || v.flip) && v.bake));
  const vOk = canCopyVideo(t as VideoTarget, info.video?.codec);
  const aOk = !info.audio || spec.audio?.discard || canCopyAudio(t as VideoTarget, info.audio.codec);
  if (!changes && vOk && aOk) return "copy";
  if (info.video && !info.video.canDecode && !(vOk && !changes)) return "ffmpeg";
  return "encode";
}
