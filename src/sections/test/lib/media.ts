/** Helpers around getUserMedia used by the microphone and webcam tests (client only). */

export type MediaStatus = "idle" | "requesting" | "live" | "denied" | "notfound" | "busy" | "unsupported" | "ended" | "error";

/** Map a getUserMedia rejection to a status the UI can explain. */
export function mediaErrorStatus(err: unknown): MediaStatus {
  const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "notfound";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "busy";
    case "TypeError":
      return "unsupported";
    default:
      return "error";
  }
}

export function hasGetUserMedia(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

export function stopStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((t) => t.stop());
}

export interface DeviceOption {
  id: string;
  label: string;
}

/** Devices of one kind; labels are only available after permission was granted. */
export async function listDevices(kind: MediaDeviceKind, fallback: (n: number) => string): Promise<DeviceOption[]> {
  try {
    const all = await navigator.mediaDevices.enumerateDevices();
    return all
      .filter((d) => d.kind === kind && d.deviceId)
      .map((d, i) => ({ id: d.deviceId, label: d.label || fallback(i + 1) }));
  } catch {
    return [];
  }
}

/** First MediaRecorder container the browser can produce. */
export function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return "";
  for (const m of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

export function extFromMime(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "webm";
}

/** Colour tokens resolved for canvas drawing. */
export function cssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}
