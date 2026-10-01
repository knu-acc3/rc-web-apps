/**
 * Video/audio file operations on the WebCodecs engine (run inside media.worker.ts).
 */
import type * as MB from "mediabunny";
import { changeSpeed, frames as frameCount } from "@/tools/files/audio/lib/dsp";
import {
  AUDIO_TARGET_CODEC,
  canCopyAudio,
  canCopyVideo,
  FallbackError,
  JobError,
  mediabunny,
  openInput,
  outputFormat,
  pickAudioCodec,
  pickVideoCodec,
  quality,
  type Mediabunny,
} from "./mb";
import { even, isAudioTarget, isVideoTarget, type JobResult, type JobSpec, type VideoTarget } from "./spec";

type Progress = (p: number) => void;

function checkDiscarded(conv: MB.Conversion): void {
  for (const d of conv.discardedTracks) {
    if (d.reason === "undecodable_source_codec" || d.reason === "unknown_source_codec") throw new FallbackError("decode");
    if (d.reason === "no_encodable_target_codec") throw new FallbackError("encode");
  }
  if (!conv.isValid) throw new FallbackError("encode");
}

function resultBlob(output: MB.Output, type: string): Blob {
  const buf = (output.target as MB.BufferTarget).buffer;
  if (!buf) throw new JobError("EMPTY_OUTPUT");
  return new Blob([buf], { type });
}

/** Container conversion, remux, trim, resize, crop, rotate, mute, compress, audio extraction. */
export async function convertOp(file: Blob, spec: JobSpec, progress: Progress): Promise<JobResult> {
  const mb = await mediabunny();
  const input = openInput(mb, file);
  try {
    if (!(await input.canRead())) throw new FallbackError("container");
    const target = spec.target;
    if (target === "gif") throw new JobError("BAD_TARGET");
    const v = await input.getPrimaryVideoTrack();
    const a = await input.getPrimaryAudioTrack();
    const audioOnly = isAudioTarget(target);
    if (audioOnly && !a) throw new JobError("NO_AUDIO");
    if (!audioOnly && !v) throw new JobError("NO_VIDEO");

    const format = outputFormat(mb, target);
    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const codecs: string[] = [];
    let videoEncode = false;
    let audioEncode = false;
    let outW: number | undefined;
    let outH: number | undefined;

    let video: MB.ConversionVideoOptions = { discard: true };
    if (!audioOnly && v) {
      const vs = spec.video ?? {};
      const vCodec = await v.getCodec();
      const transform = !!(vs.width || vs.height || vs.crop || vs.fps || vs.bitrate);
      const orient = !!(vs.rotate || vs.flip);
      videoEncode = !!vs.forceTranscode || transform || (orient && (!!vs.bake || !format.supportsVideoTransformationMetadata)) || !canCopyVideo(target as VideoTarget, vCodec);
      let codec: MB.VideoCodec | undefined;
      if (videoEncode) {
        const w = vs.width ?? (await v.getDisplayWidth());
        const h = vs.height ?? (await v.getDisplayHeight());
        codec = (await pickVideoCodec(mb, target as VideoTarget, even(w), even(h))) ?? undefined;
        if (!codec) throw new FallbackError("encode");
        outW = vs.width ? even(vs.width) : undefined;
        outH = vs.height ? even(vs.height) : undefined;
      }
      codecs.push(codec ?? vCodec ?? "?");
      video = {
        codec,
        width: outW,
        height: outH,
        fit: outW && outH ? (vs.fit ?? "contain") : undefined,
        crop: vs.crop,
        rotate: vs.rotate || undefined,
        flip: vs.flip || undefined,
        frameRate: vs.fps,
        quality: videoEncode ? quality(mb, vs.quality, vs.bitrate) : undefined,
        allowTransformationMetadata: !vs.bake,
        forceTranscode: vs.forceTranscode || (orient && !!vs.bake) || undefined,
      };
    }

    let audio: MB.ConversionAudioOptions = { discard: true };
    if (a && !spec.audio?.discard) {
      const as = spec.audio ?? {};
      const aCodec = await a.getCodec();
      const change = !!(as.bitrate || as.sampleRate || as.channels || as.forceTranscode);
      let codec: MB.AudioCodec | undefined;
      if (audioOnly) {
        const want = AUDIO_TARGET_CODEC[target as keyof typeof AUDIO_TARGET_CODEC];
        audioEncode = change || aCodec !== want;
        if (audioEncode && want !== "pcm-s16" && !(await mb.canEncodeAudio(want))) throw new FallbackError("encode");
        codec = want;
      } else {
        audioEncode = change || !canCopyAudio(target as VideoTarget, aCodec);
        if (audioEncode) {
          codec = (await pickAudioCodec(mb, target as VideoTarget)) ?? undefined;
          if (!codec) throw new FallbackError("encode");
        }
      }
      codecs.push(codec ?? aCodec ?? "?");
      audio = {
        codec,
        numberOfChannels: as.channels,
        sampleRate: as.sampleRate ?? (codec === "opus" ? 48000 : undefined),
        quality: audioEncode && codec && !codec.startsWith("pcm") ? new mb.Quality({ bitrate: as.bitrate ?? (audioOnly ? 192_000 : 128_000) }) : undefined,
        forceTranscode: as.forceTranscode || undefined,
      };
    }

    const conv = await mb.Conversion.init({
      input,
      output,
      tracks: "primary",
      showWarnings: false,
      trim: spec.trim ? { start: spec.trim.start, end: spec.trim.end } : undefined,
      // Allow shifting the timeline so streams with a negative start (AAC priming, B-frame
      // delay) can still be copied; cross-track sync is preserved either way.
      copy: { shiftTolerance: Infinity },
      video,
      audio,
    });
    checkDiscarded(conv);
    conv.onProgress = (p) => progress(p);
    await conv.execute();
    const encoded = [videoEncode && !audioOnly, audioEncode && !spec.audio?.discard].filter(Boolean).length;
    const tracks = (audioOnly ? 0 : 1) + (a && !spec.audio?.discard ? 1 : 0);
    return {
      blob: resultBlob(output, format.mimeType),
      mode: encoded === 0 ? "copy" : encoded === tracks ? "transcode" : "mixed",
      engine: "webcodecs",
      codecs,
      width: outW,
      height: outH,
    };
  } finally {
    input.dispose();
  }
}

/* ───────────── speed ───────────── */

async function decodeAll(mb: Mediabunny, track: MB.InputAudioTrack, start: number, end: number, progress?: Progress): Promise<{ channels: Float32Array[]; sampleRate: number }> {
  const sampleRate = await track.getSampleRate();
  const count = await track.getNumberOfChannels();
  const parts: Float32Array[][] = Array.from({ length: count }, () => []);
  let total = 0;
  const sink = new mb.AudioSampleSink(track);
  const span = Math.max(0.001, end - start);
  for await (const s of sink.samples(start, end)) {
    // Cut sample edges to the exact range.
    const from = Math.max(0, Math.round((start - s.timestamp) * s.sampleRate));
    const to = Math.min(s.numberOfFrames, Math.round((end - s.timestamp) * s.sampleRate));
    if (to > from) {
      for (let c = 0; c < count; c++) {
        const buf = new Float32Array(s.numberOfFrames);
        s.copyTo(buf, { planeIndex: Math.min(c, s.numberOfChannels - 1), format: "f32-planar" });
        parts[c].push(from === 0 && to === s.numberOfFrames ? buf : buf.slice(from, to));
      }
      total += to - from;
    }
    progress?.(Math.min(1, (s.timestamp + s.duration - start) / span));
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
}

/** Feed planar PCM into an AudioSampleSource in 1-second chunks. */
export async function feedPcm(mb: Mediabunny, source: MB.AudioSampleSource, channels: Float32Array[], sampleRate: number, startTs = 0, progress?: Progress): Promise<void> {
  const n = frameCount(channels);
  const chunk = sampleRate;
  const count = channels.length;
  for (let i = 0; i < n; i += chunk) {
    const len = Math.min(chunk, n - i);
    const data = new Float32Array(len * count);
    for (let c = 0; c < count; c++) data.set(channels[c].subarray(i, i + len), c * len);
    const sample = new mb.AudioSample({ data, format: "f32-planar", numberOfChannels: count, sampleRate, timestamp: startTs + i / sampleRate });
    await source.add(sample);
    sample.close();
    progress?.((i + len) / n);
  }
}

/** Speed up / slow down a video (0.25×–4×), audio time-stretched or tape-style. */
export async function speedOp(file: Blob, spec: JobSpec, progress: Progress): Promise<JobResult> {
  const mb = await mediabunny();
  const input = openInput(mb, file);
  try {
    if (!(await input.canRead())) throw new FallbackError("container");
    const factor = spec.speed?.factor ?? 1;
    const target = (isVideoTarget(spec.target) ? spec.target : "mp4") as VideoTarget;
    const v = await input.getPrimaryVideoTrack();
    if (!v) throw new JobError("NO_VIDEO");
    if (!(await v.canDecode())) throw new FallbackError("decode");
    const a = await input.getPrimaryAudioTrack();
    const format = outputFormat(mb, target);
    const output = new mb.Output({ format, target: new mb.BufferTarget() });

    const w = await v.getDisplayWidth();
    const h = await v.getDisplayHeight();
    const vCodec = await pickVideoCodec(mb, target, even(w), even(h));
    if (!vCodec) throw new FallbackError("encode");
    const codecs: string[] = [vCodec];

    const start = spec.trim?.start ?? 0;
    const end = spec.trim?.end ?? (await input.computeDuration());

    let audioSource: MB.AudioSampleSource | null = null;
    let pcm: { channels: Float32Array[]; sampleRate: number } | null = null;
    if (a && !spec.audio?.discard) {
      if (!(await a.canDecode())) throw new FallbackError("decode");
      const aCodec = await pickAudioCodec(mb, target);
      if (!aCodec) throw new FallbackError("encode");
      codecs.push(aCodec);
      const decoded = await decodeAll(mb, a, start, end, (p) => progress(p * 0.15));
      const stretched = changeSpeed(decoded.channels, decoded.sampleRate, factor, spec.speed?.keepPitch ?? true);
      pcm = { channels: stretched, sampleRate: decoded.sampleRate };
      progress(0.2);
      audioSource = new mb.AudioSampleSource({
        codec: aCodec,
        quality: new mb.Quality({ bitrate: 128_000 }),
        transform: aCodec === "opus" && decoded.sampleRate !== 48000 ? { sampleRate: 48000 } : undefined,
      });
      output.addAudioTrack(audioSource);
    }

    // Keep the output ≤ 60 fps: drop input frames first when speeding up.
    let fps: number | undefined;
    try {
      const stats = await v.computePacketStats(120);
      if (stats.averagePacketRate * factor > 61) fps = 60 / factor;
    } catch {
      fps = undefined;
    }

    const conv = await mb.Conversion.init({
      input,
      output,
      composable: true,
      tracks: "primary",
      showWarnings: false,
      trim: { start, end },
      audio: { discard: true },
      video: {
        codec: vCodec,
        frameRate: fps,
        quality: quality(mb, "high"),
        forceTranscode: true,
        process: (sample) => {
          sample.setTimestamp((sample.timestamp - start) / factor);
          sample.setDuration(sample.duration / factor);
          return sample;
        },
      },
    });
    checkDiscarded(conv);
    const base = pcm ? 0.2 : 0;
    conv.onProgress = (p) => progress(base + p * (1 - base) * 0.98);
    await output.start();
    await Promise.all([
      conv.execute(),
      (async () => {
        if (audioSource && pcm) {
          await feedPcm(mb, audioSource, pcm.channels, pcm.sampleRate);
          audioSource.close();
        }
      })(),
    ]);
    await output.finalize();
    return { blob: resultBlob(output, format.mimeType), mode: "transcode", engine: "webcodecs", codecs, duration: (end - start) / factor };
  } finally {
    input.dispose();
  }
}

/* ───────────── merge ───────────── */

export interface ClipCheck {
  compatible: boolean;
  /** Human-readable reason key when not compatible. */
  reason?: "codec" | "size" | "audio" | "rotation" | "config" | "unreadable";
  target: VideoTarget;
}

function bytesEqual(a?: AllowSharedBufferSource, b?: AllowSharedBufferSource): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const x = ArrayBuffer.isView(a) ? new Uint8Array(a.buffer, a.byteOffset, a.byteLength) : new Uint8Array(a as ArrayBuffer);
  const y = ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b as ArrayBuffer);
  if (x.length !== y.length) return false;
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}

interface OpenClip {
  input: MB.Input;
  v: MB.InputVideoTrack;
  a: MB.InputAudioTrack | null;
  vConfig: VideoDecoderConfig;
  aConfig: AudioDecoderConfig | null;
  rotation: MB.Rotation;
  start: number;
  duration: number;
}

async function openClip(mb: Mediabunny, file: Blob): Promise<OpenClip> {
  const input = openInput(mb, file);
  if (!(await input.canRead())) {
    input.dispose();
    throw new JobError("MERGE_UNREADABLE");
  }
  const v = await input.getPrimaryVideoTrack();
  if (!v) {
    input.dispose();
    throw new JobError("NO_VIDEO");
  }
  const a = await input.getPrimaryAudioTrack();
  const vConfig = await v.getDecoderConfig();
  if (!vConfig) {
    input.dispose();
    throw new JobError("MERGE_UNREADABLE");
  }
  const tracks = a ? [v, a] : [v];
  const start = await input.getFirstTimestamp(tracks);
  const end = await input.computeDuration(tracks);
  return { input, v, a, vConfig, aConfig: a ? await a.getDecoderConfig() : null, rotation: await v.getRotation(), start, duration: Math.max(0, end - start) };
}

function copyCompatible(clips: OpenClip[]): ClipCheck["reason"] | null {
  const f = clips[0];
  for (const c of clips.slice(1)) {
    if (c.vConfig.codec !== f.vConfig.codec) return "codec";
    if (c.vConfig.codedWidth !== f.vConfig.codedWidth || c.vConfig.codedHeight !== f.vConfig.codedHeight) return "size";
    if (c.rotation !== f.rotation) return "rotation";
    if (!bytesEqual(c.vConfig.description, f.vConfig.description)) return "config";
    if (!!c.a !== !!f.a) return "audio";
    if (c.aConfig && f.aConfig) {
      if (c.aConfig.codec !== f.aConfig.codec || c.aConfig.sampleRate !== f.aConfig.sampleRate || c.aConfig.numberOfChannels !== f.aConfig.numberOfChannels) return "audio";
      if (!bytesEqual(c.aConfig.description, f.aConfig.description)) return "audio";
    }
  }
  return null;
}

function containerFor(videoCodec: string, audioCodec: string | null): VideoTarget {
  const v = videoCodec.slice(0, 4);
  if (v.startsWith("avc") || v.startsWith("hvc") || v.startsWith("hev")) return audioCodec && !/^(mp4a|opus|mp3|flac)/.test(audioCodec) ? "mkv" : "mp4";
  if (v.startsWith("vp8") || v.startsWith("vp09") || v.startsWith("av01")) return !audioCodec || /^(opus|vorbis)/.test(audioCodec) ? "webm" : "mkv";
  return "mkv";
}

/** Check whether clips can be joined without re-encoding. */
export async function mergeCheckOp(files: Blob[]): Promise<ClipCheck> {
  const mb = await mediabunny();
  const clips: OpenClip[] = [];
  try {
    for (const f of files) clips.push(await openClip(mb, f));
    const reason = copyCompatible(clips);
    return { compatible: !reason, reason: reason ?? undefined, target: containerFor(clips[0].vConfig.codec, clips[0].aConfig?.codec ?? null) };
  } catch (e) {
    if (e instanceof JobError) return { compatible: false, reason: "unreadable", target: "mp4" };
    throw e;
  } finally {
    clips.forEach((c) => c.input.dispose());
  }
}

/**
 * Join clips. Same codec & parameters → packets are copied (no quality loss, fast).
 * Otherwise every clip is decoded and re-encoded to H.264/AAC MP4 at the first clip's size.
 */
export async function mergeOp(files: Blob[], reencode: boolean, progress: Progress): Promise<JobResult> {
  const mb = await mediabunny();
  const clips: OpenClip[] = [];
  try {
    for (const f of files) clips.push(await openClip(mb, f));
    const totalDur = clips.reduce((s, c) => s + c.duration, 0) || 1;
    const copy = !reencode && !copyCompatible(clips);
    const target: VideoTarget = copy ? containerFor(clips[0].vConfig.codec, clips[0].aConfig?.codec ?? null) : "mp4";
    const format = outputFormat(mb, target);
    const output = new mb.Output({ format, target: new mb.BufferTarget() });
    const anyAudio = clips.some((c) => c.a);
    let done = 0;

    if (copy) {
      const vCodec = (await clips[0].v.getCodec())!;
      const vSrc = new mb.EncodedVideoPacketSource(vCodec);
      output.addVideoTrack(vSrc, { rotation: clips[0].rotation });
      let aSrc: MB.EncodedAudioPacketSource | null = null;
      if (clips[0].a) {
        aSrc = new mb.EncodedAudioPacketSource((await clips[0].a.getCodec())!);
        output.addAudioTrack(aSrc);
      }
      await output.start();
      let offset = 0;
      let firstV = true;
      let firstA = true;
      for (const clip of clips) {
        const shift = offset - clip.start;
        const pumpV = async () => {
          for await (const p of new mb.EncodedPacketSink(clip.v).packets()) {
            await vSrc.add(p.clone({ timestamp: p.timestamp + shift }), firstV ? { decoderConfig: clip.vConfig } : undefined);
            firstV = false;
            progress(Math.min(0.99, (done + Math.max(0, p.timestamp - clip.start)) / totalDur));
          }
        };
        const pumpA = async () => {
          if (!clip.a || !aSrc) return;
          for await (const p of new mb.EncodedPacketSink(clip.a).packets()) {
            if (p.timestamp - clip.start >= clip.duration) break;
            await aSrc.add(p.clone({ timestamp: p.timestamp + shift }), firstA && clip.aConfig ? { decoderConfig: clip.aConfig } : undefined);
            firstA = false;
          }
        };
        await Promise.all([pumpV(), pumpA()]);
        offset += clip.duration;
        done += clip.duration;
      }
      vSrc.close();
      aSrc?.close();
      await output.finalize();
      return { blob: resultBlob(output, format.mimeType), mode: "copy", engine: "webcodecs", codecs: [vCodec, ...(clips[0].a ? [(await clips[0].a.getCodec()) ?? "?"] : [])], duration: totalDur };
    }

    // Re-encode path
    for (const c of clips) {
      if (!(await c.v.canDecode())) throw new JobError("MERGE_UNDECODABLE");
      if (c.a && !(await c.a.canDecode())) throw new JobError("MERGE_UNDECODABLE");
    }
    const W = even(await clips[0].v.getDisplayWidth());
    const H = even(await clips[0].v.getDisplayHeight());
    const vCodec = await pickVideoCodec(mb, target, W, H);
    if (!vCodec) throw new JobError("NO_ENCODER");
    const vSrc = new mb.VideoSampleSource({
      codec: vCodec,
      quality: quality(mb, "high"),
      sizeChangeBehavior: "contain",
      transform: { width: W, height: H, force: true },
    });
    output.addVideoTrack(vSrc);
    let aSrc: MB.AudioSampleSource | null = null;
    const SR = 48000;
    if (anyAudio) {
      const aCodec = await pickAudioCodec(mb, target);
      if (!aCodec) throw new JobError("NO_ENCODER");
      aSrc = new mb.AudioSampleSource({ codec: aCodec, quality: new mb.Quality({ bitrate: 160_000 }), transform: { sampleRate: SR, numberOfChannels: 2 } });
      output.addAudioTrack(aSrc);
    }
    await output.start();
    let offset = 0;
    for (const clip of clips) {
      const shift = offset - clip.start;
      const pumpV = async () => {
        for await (const s of new mb.VideoSampleSink(clip.v).samples()) {
          s.setTimestamp(s.timestamp + shift);
          await vSrc.add(s);
          progress(Math.min(0.99, (done + Math.max(0, s.timestamp - offset)) / totalDur));
          s.close();
        }
      };
      const pumpA = async () => {
        if (!aSrc) return;
        if (!clip.a) {
          // Silence for clips without sound keeps audio and video in sync.
          const silent = [new Float32Array(Math.round(clip.duration * SR)), new Float32Array(Math.round(clip.duration * SR))];
          await feedPcm(mb, aSrc, silent, SR, offset);
          return;
        }
        for await (const s of new mb.AudioSampleSink(clip.a).samples()) {
          if (s.timestamp - clip.start >= clip.duration) {
            s.close();
            break;
          }
          s.setTimestamp(s.timestamp + shift);
          await aSrc.add(s);
          s.close();
        }
      };
      await Promise.all([pumpV(), pumpA()]);
      offset += clip.duration;
      done += clip.duration;
    }
    vSrc.close();
    aSrc?.close();
    await output.finalize();
    return { blob: resultBlob(output, format.mimeType), mode: "transcode", engine: "webcodecs", codecs: [vCodec], width: W, height: H, duration: totalDur };
  } finally {
    clips.forEach((c) => c.input.dispose());
  }
}
