/* Flashing-light patterns: what colour the screen shows at time t. Pure, unit-tested. */

export type FlashMode = "blink" | "strobe" | "police" | "sos" | "party" | "two";

export const FLASH_MODES: FlashMode[] = ["blink", "strobe", "police", "sos", "party", "two"];

const BLACK = "#000000";
const PARTY = ["#ff0040", "#ff8000", "#ffee00", "#00ff60", "#00c8ff", "#3d5aff", "#c000ff", "#ff00b0", "#ffffff"];

/** S O S in Morse: dot = 1 unit on, dash = 3, gaps 1 / 3 (letters) / 7 (word). true = light on. */
const SOS: boolean[] = (() => {
  const out: boolean[] = [];
  const on = (n: number) => out.push(...Array<boolean>(n).fill(true));
  const off = (n: number) => out.push(...Array<boolean>(n).fill(false));
  const letter = (marks: number[]) =>
    marks.forEach((m, i) => {
      on(m);
      if (i < marks.length - 1) off(1);
    });
  letter([1, 1, 1]);
  off(3);
  letter([3, 3, 3]);
  off(3);
  letter([1, 1, 1]);
  off(7);
  return out;
})();

const SOS_UNIT_S = 0.2;
/** Seconds one SOS signal takes, gaps included. */
export const SOS_SECONDS = SOS.length * SOS_UNIT_S;

/** Cheap deterministic hash so the "party" colours don't repeat in a visible pattern. */
const hash = (k: number) => {
  let x = (k + 0x9e3779b9) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return (x ^ (x >>> 16)) >>> 0;
};

/**
 * Colour at time `t` (seconds since start). `hz` = flashes per second (ignored by SOS, which has fixed Morse timing).
 * `a` / `b` are the two colours of the "two" mode and the colour of blink/strobe.
 */
export function flashColor(mode: FlashMode, t: number, hz: number, a = "#ffffff", b = BLACK): string {
  const x = t * hz;
  const k = Math.floor(x);
  const phase = x - k;
  switch (mode) {
    case "blink":
      return phase < 0.5 ? a : BLACK;
    case "strobe":
      return phase < 0.18 ? a : BLACK;
    case "police":
      // Two red flashes, then two blue ones.
      if (phase >= 0.6) return BLACK;
      return Math.floor(k / 2) % 2 === 0 ? "#ff1a1a" : "#1a3dff";
    case "sos":
      return SOS[Math.floor(t / SOS_UNIT_S) % SOS.length] ? a : BLACK;
    case "party":
      // Jumps of 2–6 places through 9 colours: varied, and never the same colour twice in a row
      // (that would look like a dropped flash).
      return PARTY[(((k * 4 + (hash(k) % 3)) % PARTY.length) + PARTY.length) % PARTY.length];
    case "two":
      return phase < 0.5 ? a : b;
  }
}

/** How many light changes per second a setting produces (for the photosensitivity warning). */
export function flashesPerSecond(mode: FlashMode, hz: number): number {
  if (mode === "sos") return 1 / SOS_UNIT_S / 2; // at most one dot per two units
  return hz;
}
