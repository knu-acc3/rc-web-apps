import type { AudioConversionFormat, VideoConversionFormat } from "./types";

export type MediaOutputFormat = AudioConversionFormat | VideoConversionFormat;

const outputMime: Record<MediaOutputFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  flac: "audio/flac",
  ogg: "audio/ogg",
  opus: "audio/opus",
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  gif: "image/gif",
};

export function buildFfmpegArgs(
  inputName: string,
  outputName: string,
  format: MediaOutputFormat,
): string[] {
  const codecs: Record<MediaOutputFormat, string[]> = {
    mp3: ["-vn", "-c:a", "libmp3lame", "-b:a", "192k"],
    wav: ["-vn", "-c:a", "pcm_s16le"],
    m4a: ["-vn", "-c:a", "aac", "-b:a", "192k"],
    flac: ["-vn", "-c:a", "flac"],
    ogg: ["-vn", "-c:a", "libvorbis", "-q:a", "5"],
    opus: ["-vn", "-c:a", "libopus", "-b:a", "128k"],
    mp4: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart"],
    webm: ["-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus", "-b:a", "128k"],
    mkv: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "160k"],
    mov: ["-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-b:a", "160k"],
    avi: ["-c:v", "mpeg4", "-q:v", "5", "-c:a", "libmp3lame", "-b:a", "192k"],
    gif: ["-vf", "fps=12,scale='min(960,iw)':-1:flags=lanczos", "-loop", "0"],
  };
  return ["-i", inputName, ...codecs[format], outputName];
}

let activeFfmpeg: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let ffmpegLoadPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function loadFfmpeg(signal?: AbortSignal) {
  if (activeFfmpeg?.loaded) return activeFfmpeg;
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = import("@ffmpeg/ffmpeg").then(async ({ FFmpeg }) => {
      const instance = new FFmpeg();
      await instance.load(
        {
          coreURL: "/vendor/ffmpeg/ffmpeg-core.js",
          wasmURL: "/vendor/ffmpeg/ffmpeg-core.wasm",
        },
        { signal },
      );
      activeFfmpeg = instance;
      return instance;
    }).catch((error) => {
      ffmpegLoadPromise = null;
      throw error;
    });
  }
  return ffmpegLoadPromise;
}

export function cancelMediaConversion() {
  activeFfmpeg?.terminate();
  activeFfmpeg = null;
  ffmpegLoadPromise = null;
}

export async function convertMedia(
  file: File,
  format: MediaOutputFormat,
  options: { signal?: AbortSignal; onProgress?: (progress: number) => void } = {},
): Promise<Blob> {
  if (options.signal?.aborted) throw new DOMException("Conversion cancelled", "AbortError");
  const ffmpeg = await loadFfmpeg(options.signal);
  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const token = Math.random().toString(36).slice(2, 10);
  const inputName = `input-${token}.${extension.replace(/[^a-z0-9]/g, "") || "bin"}`;
  const outputName = `output-${token}.${format}`;
  const onProgress = ({ progress }: { progress: number }) => {
    options.onProgress?.(Math.min(0.98, Math.max(0, progress)));
  };
  ffmpeg.on("progress", onProgress);
  try {
    const { fetchFile } = await import("@ffmpeg/util");
    await ffmpeg.writeFile(inputName, await fetchFile(file), { signal: options.signal });
    const exitCode = await ffmpeg.exec(
      buildFfmpegArgs(inputName, outputName, format),
      -1,
      { signal: options.signal },
    );
    if (exitCode !== 0) throw new Error(`FFmpeg stopped with code ${exitCode}.`);
    const result = await ffmpeg.readFile(outputName, undefined, { signal: options.signal });
    if (typeof result === "string") throw new Error("FFmpeg returned an invalid binary result.");
    options.onProgress?.(1);
    const copied = new Uint8Array(result.byteLength);
    copied.set(result);
    return new Blob([copied.buffer], {
      type: outputMime[format],
    });
  } finally {
    ffmpeg.off("progress", onProgress);
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)]);
  }
}
