/**
 * Audio editing on decoded PCM (run inside media.worker.ts). The decoded audio of
 * the current file stays in the worker ("session"), the page only gets waveform
 * peaks and the final encoded file.
 */
import type * as MB from "mediabunny";
import {
  applyFades,
  applyGain,
  changeSpeed,
  dbToGain,
  frames,
  normalizeGain,
  pitchShift,
  remix,
  resample,
  reverseChannels,
  rmsNormalizeGain,
  sliceChannels,
  waveformPeaks,
  type Channels,
} from "@/tools/files/audio/lib/dsp";
import { encodeWav } from "@/tools/files/audio/lib/wav";
import { AUDIO_TARGET_CODEC, FallbackError, JobError, mediabunny, openInput, outputFormat } from "./mb";
import { feedPcm } from "./ops-video";
import type { AudioTarget } from "./spec";

type Progress = (p: number) => void;

export interface Pcm {
  channels: Channels;
  sampleRate: number;
}

export interface AudioOps {
  trim?: { start: number; end: number };
  fadeIn?: number;
  fadeOut?: number;
  gainDb?: number;
  normalize?: { mode: "peak" | "rms"; targetDb: number };
  speed?: { factor: number; keepPitch: boolean };
  semitones?: number;
  reverse?: boolean;
  channels?: 1 | 2;
  sampleRate?: number;
}

export interface LoadedInfo {
  duration: number;
  sampleRate: number;
  channels: number;
  peaks: Float32Array;
  peak: number;
}

export async function decodePcm(file: Blob, progress?: Progress): Promise<Pcm> {
  const mb = await mediabunny();
  const input = openInput(mb, file);
  try {
    if (!(await input.canRead())) throw new FallbackError("container");
    const track = await input.getPrimaryAudioTrack();
    if (!track) throw new JobError("NO_AUDIO");
    if (typeof AudioDecoder === "undefined" || !(await track.canDecode())) throw new FallbackError("decode");
    const sampleRate = await track.getSampleRate();
    const count = Math.min(2, await track.getNumberOfChannels());
    const duration = (await input.computeDuration([track])) || 1;
    const parts: Float32Array[][] = Array.from({ length: count }, () => []);
    let total = 0;
    for await (const s of new mb.AudioSampleSink(track).samples()) {
      for (let c = 0; c < count; c++) {
        const buf = new Float32Array(s.numberOfFrames);
        s.copyTo(buf, { planeIndex: Math.min(c, s.numberOfChannels - 1), format: "f32-planar" });
        parts[c].push(buf);
      }
      total += s.numberOfFrames;
      progress?.(Math.min(0.99, (s.timestamp + s.duration) / duration));
      s.close();
    }
    const channels = parts.map((list) => {
      const out = new Float32Array(total);
      let o = 0;
      for (const p of list) {
        out.set(p, o);
        o += p.length;
      }
      return out;
    });
    return { channels, sampleRate };
  } finally {
    input.dispose();
  }
}

export function describe(pcm: Pcm, buckets = 1600): LoadedInfo {
  const peaks = waveformPeaks(pcm.channels, buckets);
  let p = 0;
  for (let i = 0; i < peaks.length; i++) p = Math.max(p, Math.abs(peaks[i]));
  return { duration: frames(pcm.channels) / pcm.sampleRate, sampleRate: pcm.sampleRate, channels: pcm.channels.length, peaks, peak: p };
}

/** Apply edit operations; always returns new arrays (the session stays untouched). */
export function applyOps(pcm: Pcm, ops: AudioOps): Pcm {
  let sr = pcm.sampleRate;
  let ch: Channels = ops.trim
    ? sliceChannels(pcm.channels, Math.round(ops.trim.start * sr), Math.round(ops.trim.end * sr))
    : pcm.channels.map((c) => c.slice());
  if (ops.channels) ch = remix(ch, ops.channels);
  if (ops.speed && ops.speed.factor !== 1) ch = changeSpeed(ch, sr, ops.speed.factor, ops.speed.keepPitch);
  if (ops.semitones) ch = pitchShift(ch, sr, ops.semitones);
  if (ops.reverse) reverseChannels(ch);
  if (ops.normalize) {
    const g = ops.normalize.mode === "peak" ? normalizeGain(ch, ops.normalize.targetDb) : rmsNormalizeGain(ch, ops.normalize.targetDb);
    applyGain(ch, g);
  } else if (ops.gainDb) {
    applyGain(ch, dbToGain(ops.gainDb));
  }
  if (ops.fadeIn || ops.fadeOut) applyFades(ch, sr, ops.fadeIn ?? 0, ops.fadeOut ?? 0);
  if (ops.sampleRate && ops.sampleRate !== sr) {
    ch = resample(ch, sr, ops.sampleRate);
    sr = ops.sampleRate;
  }
  return { channels: ch, sampleRate: sr };
}

/**
 * Encode PCM to a target format with WebCodecs/mediabunny. WAV is written directly.
 * Throws FallbackError("encode") when the browser has no encoder (MP3, FLAC, Vorbis…).
 */
export async function encodePcm(pcm: Pcm, target: AudioTarget, bitrate: number, progress?: Progress): Promise<Blob> {
  if (target === "wav") return new Blob([encodeWav(pcm.channels, pcm.sampleRate, 16) as BlobPart], { type: "audio/wav" });
  const mb = await mediabunny();
  const codec = AUDIO_TARGET_CODEC[target] as MB.AudioCodec;
  const sampleRate = codec === "opus" ? 48000 : pcm.sampleRate;
  if (typeof AudioEncoder === "undefined" || !(await mb.canEncodeAudio(codec, { numberOfChannels: pcm.channels.length, sampleRate }))) throw new FallbackError("encode");
  const format = outputFormat(mb, target);
  const output = new mb.Output({ format, target: new mb.BufferTarget() });
  const src = new mb.AudioSampleSource({
    codec,
    quality: new mb.Quality({ bitrate }),
    transform: sampleRate !== pcm.sampleRate ? { sampleRate } : undefined,
  });
  output.addAudioTrack(src);
  await output.start();
  await feedPcm(mb, src, pcm.channels, pcm.sampleRate, 0, progress);
  src.close();
  await output.finalize();
  const buf = (output.target as MB.BufferTarget).buffer;
  if (!buf) throw new JobError("EMPTY_OUTPUT");
  return new Blob([buf], { type: format.mimeType });
}

