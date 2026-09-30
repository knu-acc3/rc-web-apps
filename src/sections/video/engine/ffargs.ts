/**
 * ffmpeg command lines for the fallback engine. Each container gets its own codec
 * set (the previous version used identical x264 arguments for every container).
 * Pure: unit-tested without loading ffmpeg.
 */
import { ffTime } from "./time";
import { even, isAudioTarget, type AudioTarget, type JobSpec, type VideoTarget } from "./spec";

export interface FfInput {
  /** Path of the input inside the ffmpeg file system. */
  path: string;
  /** Audio/video codecs of the input when known (enables stream copy). */
  videoCodec?: string | null;
  audioCodec?: string | null;
  /** Input has a video stream (false for audio-only files). */
  hasVideo?: boolean;
  sampleRate?: number;
}

const CRF: Record<string, number> = { high: 20, medium: 23, low: 28 };

/** Codecs a container can hold without re-encoding (ffmpeg names). */
const COPY_OK: Record<VideoTarget, { v: string[]; a: string[] }> = {
  mp4: { v: ["avc", "hevc", "av1", "vp9"], a: ["aac", "mp3", "opus", "flac", "ac3", "eac3"] },
  mov: { v: ["avc", "hevc", "prores"], a: ["aac", "mp3", "pcm-s16", "pcm-s24", "ac3"] },
  mkv: { v: ["avc", "hevc", "vp8", "vp9", "av1"], a: ["aac", "mp3", "opus", "vorbis", "flac", "ac3", "eac3", "dts"] },
  webm: { v: ["vp8", "vp9", "av1"], a: ["opus", "vorbis"] },
};

function videoFilters(spec: JobSpec): string[] {
  const v = spec.video ?? {};
  const f: string[] = [];
  if (v.rotate === 90) f.push("transpose=1");
  else if (v.rotate === 180) f.push("hflip,vflip");
  else if (v.rotate === 270) f.push("transpose=2");
  if (v.flip) f.push("hflip");
  if (v.crop) f.push(`crop=${even(v.crop.width)}:${even(v.crop.height)}:${Math.round(v.crop.left)}:${Math.round(v.crop.top)}`);
  if (v.width || v.height) {
    const W = v.width ? even(v.width) : -2;
    const H = v.height ? even(v.height) : -2;
    if (v.width && v.height && v.fit === "contain") f.push(`scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`);
    else if (v.width && v.height && v.fit === "cover") f.push(`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`);
    else f.push(`scale=${W}:${H}`);
  } else {
    // H.264 4:2:0 needs even dimensions.
    f.push("scale=trunc(iw/2)*2:trunc(ih/2)*2");
  }
  if (spec.speed && spec.speed.factor !== 1) f.push(`setpts=PTS/${spec.speed.factor}`);
  if (v.fps) f.push(`fps=${v.fps}`);
  return f;
}

function audioFilters(spec: JobSpec, sampleRate = 48000): string[] {
  const s = spec.speed;
  if (!s || s.factor === 1) return [];
  if (s.keepPitch) {
    // atempo accepts 0.5–2 per instance in older builds; chain for safety.
    const out: string[] = [];
    let k = s.factor;
    while (k > 2) {
      out.push("atempo=2");
      k /= 2;
    }
    while (k < 0.5) {
      out.push("atempo=0.5");
      k /= 0.5;
    }
    out.push(`atempo=${+k.toFixed(4)}`);
    return out;
  }
  return [`asetrate=${Math.round(sampleRate * s.factor)}`, `aresample=${sampleRate}`];
}

function trimArgs(spec: JobSpec): { pre: string[]; post: string[] } {
  if (!spec.trim) return { pre: [], post: [] };
  // -ss before -i is frame-accurate when re-encoding and fast when copying.
  return { pre: ["-ss", ffTime(spec.trim.start)], post: ["-t", ffTime(spec.trim.end - spec.trim.start)] };
}

function videoCodecArgs(target: VideoTarget, spec: JobSpec): string[] {
  const v = spec.video ?? {};
  const rate = v.bitrate ? ["-b:v", `${Math.round(v.bitrate / 1000)}k`, "-maxrate", `${Math.round((v.bitrate * 1.5) / 1000)}k`, "-bufsize", `${Math.round((v.bitrate * 2) / 1000)}k`] : null;
  switch (target) {
    case "webm":
      // VP8 in realtime mode: VP9 is far too slow in single-threaded WebAssembly.
      return ["-c:v", "libvpx", "-deadline", "realtime", "-cpu-used", "8", ...(rate ?? ["-crf", "10", "-b:v", "3M"]), "-pix_fmt", "yuv420p"];
    case "mp4":
    case "mov":
    case "mkv":
      return ["-c:v", "libx264", "-preset", "veryfast", ...(rate ?? ["-crf", String(CRF[v.quality ?? "medium"])]), "-pix_fmt", "yuv420p"];
  }
}

function audioCodecArgs(target: VideoTarget | AudioTarget, spec: JobSpec): string[] {
  const a = spec.audio ?? {};
  const kbps = (d: number) => `${Math.round((a.bitrate ?? d * 1000) / 1000)}k`;
  const common = [...(a.sampleRate ? ["-ar", String(a.sampleRate)] : []), ...(a.channels ? ["-ac", String(a.channels)] : [])];
  switch (target) {
    case "mp4":
    case "mov":
    case "mkv":
    case "m4a":
      return ["-c:a", "aac", "-b:a", kbps(target === "m4a" ? 192 : 128), ...common];
    case "aac":
      return ["-c:a", "aac", "-b:a", kbps(192), ...common, "-f", "adts"];
    case "webm":
    case "opus":
      return ["-c:a", "libopus", "-b:a", kbps(target === "opus" ? 128 : 96), ...(a.channels ? ["-ac", String(a.channels)] : []), "-ar", "48000"];
    case "mp3":
      return ["-c:a", "libmp3lame", "-b:a", kbps(192), ...common];
    case "ogg":
      return ["-c:a", "libvorbis", "-b:a", kbps(160), ...common];
    case "wav":
      return ["-c:a", "pcm_s16le", ...common];
    case "flac":
      return ["-c:a", "flac", "-compression_level", "5", ...common];
  }
}

const MUXER: Record<string, string[]> = {
  mp4: ["-movflags", "+faststart"],
  mov: ["-movflags", "+faststart"],
  m4a: ["-movflags", "+faststart"],
  mkv: [],
  webm: [],
};

/** Whether the job only changes the container and the codecs fit the target (remux with -c copy). */
export function canStreamCopy(input: FfInput, spec: JobSpec): boolean {
  const t = spec.target;
  if (t === "gif" || isAudioTarget(t)) return false;
  const v = spec.video ?? {};
  if (v.width || v.height || v.crop || v.rotate || v.flip || v.fps || v.bitrate || v.forceTranscode || spec.speed) return false;
  if (spec.audio?.bitrate || spec.audio?.sampleRate || spec.audio?.channels || spec.audio?.forceTranscode) return false;
  const ok = COPY_OK[t];
  const vOk = input.hasVideo === false || (!!input.videoCodec && ok.v.includes(input.videoCodec));
  const aOk = spec.audio?.discard || !input.audioCodec || ok.a.includes(input.audioCodec);
  return vOk && aOk;
}

/** Build the ffmpeg argument list for a job. */
export function buildArgs(input: FfInput, spec: JobSpec, outPath: string): string[] {
  const t = spec.target;
  const { pre, post } = trimArgs(spec);
  const head = ["-hide_banner", ...pre, "-i", input.path, ...post];

  if (t === "gif") {
    const g = spec.gif ?? { fps: 12, width: 480, palette: "global", loop: true };
    const base = `fps=${g.fps},scale=${Math.round(g.width)}:-1:flags=lanczos`;
    const graph =
      g.palette === "frame"
        ? `${base},split[a][b];[a]palettegen=stats_mode=single[p];[b][p]paletteuse=new=1:dither=bayer:bayer_scale=4`
        : `${base},split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
    return [...head, "-filter_complex", graph, "-loop", g.loop ? "0" : "-1", "-an", outPath];
  }

  if (isAudioTarget(t)) {
    const af = audioFilters(spec, input.sampleRate);
    const copyAudio =
      !spec.speed &&
      !spec.audio?.bitrate &&
      !spec.audio?.sampleRate &&
      !spec.audio?.channels &&
      ((t === "m4a" && input.audioCodec === "aac") || (t === "aac" && input.audioCodec === "aac") || (t === "mp3" && input.audioCodec === "mp3") || (t === "opus" && input.audioCodec === "opus") || (t === "flac" && input.audioCodec === "flac"));
    const codec = copyAudio ? ["-c:a", "copy", ...(t === "aac" ? ["-f", "adts"] : [])] : audioCodecArgs(t, spec);
    return [...head, "-map", "0:a:0", "-vn", "-sn", "-dn", ...(af.length ? ["-af", af.join(",")] : []), ...codec, ...(MUXER[t] ?? []), outPath];
  }

  const maps = ["-map", "0:v:0", ...(spec.audio?.discard ? ["-an"] : ["-map", "0:a:0?"]), "-sn", "-dn"];
  if (canStreamCopy(input, spec)) return [...head, ...maps, "-c", "copy", ...MUXER[t], outPath];

  const vf = videoFilters(spec);
  const af = spec.audio?.discard ? [] : audioFilters(spec, input.sampleRate);
  return [
    ...head,
    ...maps,
    "-vf",
    vf.join(","),
    ...videoCodecArgs(t, spec),
    ...(spec.audio?.discard ? [] : [...(af.length ? ["-af", af.join(",")] : []), ...audioCodecArgs(t, spec)]),
    ...MUXER[t],
    outPath,
  ];
}
