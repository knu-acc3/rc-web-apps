/**
 * Time-code helpers shared by the video and audio editors.
 * Accepts "65.5", "1:05.5", "00:01:05.5", "1:02:03,25" (decimal comma), "1h2m3.5s".
 */

/** Parse a time code into seconds. Returns null for invalid input. */
export function parseTime(input: string): number | null {
  const s = input.trim().replace(/\s+/g, "").replace(",", ".");
  if (!s) return null;

  // 1h2m3.5s / 2m / 45s
  const unit = /^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m(?!s))?(?:(\d+(?:\.\d+)?)s)?$/i.exec(s);
  if (unit && (unit[1] || unit[2] || unit[3])) {
    return (Number(unit[1] ?? 0) * 3600 + Number(unit[2] ?? 0) * 60 + Number(unit[3] ?? 0));
  }

  const parts = s.split(":");
  if (parts.length > 3) return null;
  if (!parts.every((p, i) => (i === parts.length - 1 ? /^\d+(\.\d+)?$|^\.\d+$/.test(p) : /^\d+$/.test(p)))) return null;
  const nums = parts.map(Number);
  // minutes/seconds fields after the first must be < 60
  for (let i = 1; i < nums.length; i++) if (nums[i] >= 60) return null;
  let total = 0;
  for (const n of nums) total = total * 60 + n;
  return Number.isFinite(total) ? total : null;
}

/**
 * Format seconds as a time code.
 * - `digits` = fraction digits (0–3)
 * - `forceHours` always prints the hour field
 * Examples: 65.5 → "1:05.5" (digits 1), 3725 → "1:02:05".
 */
export function formatTime(seconds: number, digits = 1, forceHours = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const scale = Math.pow(10, digits);
  // Round once on the smallest unit to avoid "1:60.0".
  const totalUnits = Math.round(seconds * scale);
  const whole = Math.floor(totalUnits / scale);
  const frac = totalUnits - whole * scale;
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const sec = whole % 60;
  const ss = String(sec).padStart(2, "0");
  const fs = digits > 0 ? "." + String(frac).padStart(digits, "0") : "";
  if (h > 0 || forceHours) return `${h}:${String(m).padStart(2, "0")}:${ss}${fs}`;
  return `${m}:${ss}${fs}`;
}

/** "HH:MM:SS.mmm" for ffmpeg `-ss`/`-to` arguments. */
export function ffTime(seconds: number): string {
  return formatTime(Math.max(0, seconds), 3, true).padStart(12, "0");
}

interface TimeRange {
  start: number;
  end: number;
}

/**
 * Validate a start/end pair against a media duration.
 * Returns an error key or the normalised range.
 */
export function checkRange(start: number | null, end: number | null, duration: number, minLength = 0.05): { ok: true; range: TimeRange } | { ok: false; error: "start" | "end" | "order" | "short" } {
  if (start === null || start < 0 || start > duration) return { ok: false, error: "start" };
  if (end === null || end < 0 || end > duration + 0.001) return { ok: false, error: "end" };
  if (end <= start) return { ok: false, error: "order" };
  if (end - start < minLength) return { ok: false, error: "short" };
  return { ok: true, range: { start, end: Math.min(end, duration) } };
}

/**
 * Parse ffmpeg log lines: "Duration: 00:01:05.50" and "time=00:00:12.34".
 * Returns seconds or null.
 */
export function parseFfmpegTime(line: string, key: "Duration" | "time"): number | null {
  const re = key === "Duration" ? /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/ : /time=\s*(-?\d+):(\d{2}):(\d{2}(?:\.\d+)?)/;
  const m = re.exec(line);
  if (!m) return null;
  const v = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return Number.isFinite(v) && v >= 0 ? v : null;
}
