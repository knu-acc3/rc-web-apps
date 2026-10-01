/**
 * The one small Web Audio helper shared by every audio/video tool
 * (tone generator, noise, metronome, tuner, recorders, editors).
 * Browser-only: call these from effects or event handlers, never during render.
 */

type AudioContextCtor = typeof AudioContext;

let shared: AudioContext | null = null;

function ctor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext ?? null;
}

/**
 * Shared AudioContext for the page (created on first use). Browsers allow only a
 * few contexts, so all tools reuse this one. Returns null when unsupported.
 */
export function getAudioContext(): AudioContext | null {
  if (shared && shared.state !== "closed") return shared;
  const C = ctor();
  if (!C) return null;
  try {
    shared = new C({ latencyHint: "interactive" });
  } catch {
    shared = null;
  }
  return shared;
}

/**
 * Resume the shared context (must be called from a user gesture on first use).
 * Rejects after `timeoutMs` if the browser keeps it suspended.
 */
export async function resumeAudio(timeoutMs = 4000): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (!ctx) throw new Error("NO_WEB_AUDIO");
  if (ctx.state === "running") return ctx;
  await Promise.race([
    ctx.resume(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("AUDIO_RESUME_TIMEOUT")), timeoutMs)),
  ]);
  return ctx;
}

/** Smoothly move an AudioParam to `value` (exponential approach, no clicks). */
export function smoothSet(param: AudioParam, value: number, ctx: BaseAudioContext, timeConstant = 0.015): void {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.setTargetAtTime(value, now, timeConstant);
}

/** Linear fade of a gain param from its current value to `to` over `seconds`. */
export function fadeGain(gain: AudioParam, to: number, ctx: BaseAudioContext, seconds = 0.05): number {
  const now = ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(to, now + seconds);
  return now + seconds;
}

/**
 * Fade a source out and stop/disconnect it afterwards. Returns a promise that
 * resolves when the fade is over.
 */
export function fadeOutAndStop(
  source: AudioScheduledSourceNode | AudioNode,
  gain: GainNode,
  ctx: BaseAudioContext,
  seconds = 0.08,
): Promise<void> {
  const end = fadeGain(gain.gain, 0, ctx, seconds);
  if ("stop" in source && typeof source.stop === "function") {
    try {
      (source as AudioScheduledSourceNode).stop(end + 0.01);
    } catch {
      /* already stopped */
    }
  }
  return new Promise((resolve) =>
    setTimeout(() => {
      try {
        source.disconnect();
        gain.disconnect();
      } catch {
        /* already disconnected */
      }
      resolve();
    }, (seconds + 0.05) * 1000),
  );
}

/** Convert a linear amplitude (0…1) to decibels relative to full scale. */
export function toDb(amplitude: number): number {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : -Infinity;
}

/** Convert decibels to a linear gain factor. */
export function fromDb(db: number): number {
  return Math.pow(10, db / 20);
}

interface MicOptions {
  /**
   * Disable echo cancellation, noise suppression and automatic gain control.
   * Needed for measurements (dB meter, tuner); voice recording keeps them on.
   */
  raw?: boolean;
  deviceId?: string;
}

/** Ask for the microphone. Throws the browser's DOMException (NotAllowedError, NotFoundError …). */
export async function openMicrophone(opts: MicOptions = {}): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error("NO_GET_USER_MEDIA");
  const processing = !opts.raw;
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: processing,
      noiseSuppression: processing,
      autoGainControl: processing,
      ...(opts.deviceId ? { deviceId: { exact: opts.deviceId } } : {}),
    },
    video: false,
  });
}

/** Stop every track of a stream. */
export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Classify a getUserMedia / MediaRecorder error for user-facing messages. */
export function mediaErrorKind(err: unknown): "denied" | "notfound" | "busy" | "insecure" | "unsupported" | "other" {
  const name = (err as { name?: string })?.name ?? "";
  const msg = (err as { message?: string })?.message ?? "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "notfound";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "busy";
  if (msg === "NO_GET_USER_MEDIA" || msg === "NO_WEB_AUDIO") return typeof window !== "undefined" && !window.isSecureContext ? "insecure" : "unsupported";
  return "other";
}

/** Read a design-token colour (CSS custom property) for drawing on canvases. */
export function cssColor(name: string, fallback = "#888"): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
