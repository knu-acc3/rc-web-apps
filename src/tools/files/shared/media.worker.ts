/**
 * Media worker: runs mediabunny (WebCodecs) jobs off the main thread.
 * Protocol: { id, op, args } → progress/item messages → done | error.
 * Cancellation = the page terminates this worker.
 */
import { FallbackError, JobError, mediabunny, probe } from "./mb";
import { applyOps, decodePcm, describe, encodePcm, type AudioOps, type Pcm } from "./ops-audio";
import { framesOp, frameOp, gifOp, gifToVideoOp, thumbsOp, type FramesSpec } from "./ops-image";
import { convertOp, mergeCheckOp, mergeOp, speedOp } from "./ops-video";
import { concatChannels, remix, resample, waveformPeaks } from "@/tools/files/audio/lib/dsp";
import { encodeWav } from "@/tools/files/audio/lib/wav";
import type { AudioTarget, GifSpec, JobSpec, VideoTarget } from "./spec";

interface WorkerScope {
  postMessage(msg: unknown, transfer: Transferable[]): void;
  onmessage: ((e: MessageEvent<Req>) => void) | null;
}
const scope = self as unknown as WorkerScope;

type Req = { id: number; op: string; args: Record<string, unknown> };

const store = new Map<string, Pcm>();

function post(msg: unknown, transfer: Transferable[] = []) {
  scope.postMessage(msg, transfer);
}

async function handle({ id, op, args }: Req) {
  const progress = (value: number) => post({ id, kind: "progress", value });
  switch (op) {
    case "probe":
      return probe(await mediabunny(), args.file as Blob);
    case "convert":
      return convertOp(args.file as Blob, args.spec as JobSpec, progress);
    case "speed":
      return speedOp(args.file as Blob, args.spec as JobSpec, progress);
    case "mergeCheck":
      return mergeCheckOp(args.files as Blob[]);
    case "merge":
      return mergeOp(args.files as Blob[], !!args.reencode, progress);
    case "gif":
      return gifOp(args.file as Blob, args.gif as GifSpec, args.range as { start: number; end: number } | undefined, progress);
    case "gifToVideo":
      return gifToVideoOp(args.file as Blob, args.target as VideoTarget, args.maxWidth as number, progress);
    case "frames":
      return framesOp(args.file as Blob, args.spec as FramesSpec, progress);
    case "frame": {
      const bmp = await frameOp(args.file as Blob, args.time as number, args.height as number);
      return { value: bmp, transfer: bmp ? [bmp] : [] };
    }
    case "thumbs":
      return thumbsOp(args.file as Blob, args.count as number, args.height as number, (index, bmp, time) => post({ id, kind: "item", index, data: { bmp, time } }, [bmp]));

    /* PCM store for the audio editors */
    case "pcmLoad": {
      const pcm = await decodePcm(args.file as Blob, progress);
      store.set(args.key as string, pcm);
      const info = describe(pcm);
      return { value: info, transfer: [info.peaks.buffer] };
    }
    case "pcmPut": {
      const pcm = { channels: (args.channels as Float32Array[]).slice(0, 2), sampleRate: args.sampleRate as number };
      store.set(args.key as string, pcm);
      const info = describe(pcm);
      return { value: info, transfer: [info.peaks.buffer] };
    }
    case "pcmDrop":
      store.delete(args.key as string);
      return true;
    case "pcmPeaks": {
      const pcm = store.get(args.key as string);
      if (!pcm) throw new JobError("NO_SESSION");
      const sr = pcm.sampleRate;
      const peaks = waveformPeaks(pcm.channels, args.buckets as number, Math.round((args.from as number) * sr), Math.round((args.to as number) * sr));
      return { value: peaks, transfer: [peaks.buffer] };
    }
    case "pcmRender": {
      const keys = args.keys as string[];
      const list = keys.map((k) => {
        const p = store.get(k);
        if (!p) throw new JobError("NO_SESSION");
        return p;
      });
      let pcm: Pcm;
      if (list.length === 1) pcm = list[0];
      else {
        const sr = list[0].sampleRate;
        const count = Math.max(...list.map((p) => p.channels.length));
        const clips = list.map((p) => remix(resample(p.channels, p.sampleRate, sr), count));
        pcm = { channels: concatChannels(clips, Math.round(((args.crossfade as number) ?? 0) * sr)), sampleRate: sr };
      }
      progress(0.05);
      const edited = applyOps(pcm, (args.ops as AudioOps) ?? {});
      progress(0.4);
      const target = args.target as AudioTarget;
      try {
        const blob = await encodePcm(edited, target, (args.bitrate as number) ?? 192_000, (p) => progress(0.4 + p * 0.59));
        return { blob, duration: edited.channels[0].length / edited.sampleRate };
      } catch (e) {
        if (e instanceof FallbackError) {
          // No encoder for this format in the browser: hand back a WAV for ffmpeg.
          const wav = new Blob([encodeWav(edited.channels, edited.sampleRate, 16) as BlobPart], { type: "audio/wav" });
          return { wav, duration: edited.channels[0].length / edited.sampleRate };
        }
        throw e;
      }
    }
    default:
      throw new JobError("BAD_OP");
  }
}

scope.onmessage = async (e: MessageEvent<Req>) => {
  const { id } = e.data;
  try {
    const res = await handle(e.data);
    if (res && typeof res === "object" && "transfer" in res && "value" in res) {
      const r = res as { value: unknown; transfer: Transferable[] };
      post({ id, kind: "done", value: r.value }, r.transfer);
    } else {
      post({ id, kind: "done", value: res });
    }
  } catch (err) {
    const fallback = err instanceof FallbackError ? err.reason : undefined;
    const code = err instanceof JobError ? err.code : fallback ? `FALLBACK_${fallback}` : "FAILED";
    post({ id, kind: "error", code, fallback, message: String((err as Error)?.message ?? err) });
  }
};
