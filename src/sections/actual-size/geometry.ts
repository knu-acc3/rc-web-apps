/* Pure geometry for the ruler and the protractor (unit-tested). */

export const MM_PER_IN = 25.4;
export type RulerUnit = "cm" | "in";

interface Tick {
  /** Position from zero, mm. */
  mm: number;
  /** 0 = major (labelled) … larger = finer. */
  level: number;
  label?: string;
}

/**
 * Ticks of a ruler `length` units long.
 * cm: every millimetre (levels: cm 0, half-cm 1, mm 2).
 * in: every 1/16 inch (levels: inch 0, 1/2 1, 1/4 2, 1/8 3, 1/16 4).
 */
export function rulerTicks(unit: RulerUnit, length: number): Tick[] {
  const out: Tick[] = [];
  if (unit === "cm") {
    for (let i = 0; i <= length * 10; i++) {
      out.push({ mm: i, level: i % 10 === 0 ? 0 : i % 5 === 0 ? 1 : 2, label: i % 10 === 0 ? String(i / 10) : undefined });
    }
  } else {
    for (let i = 0; i <= length * 16; i++) {
      const level = i % 16 === 0 ? 0 : i % 8 === 0 ? 1 : i % 4 === 0 ? 2 : i % 2 === 0 ? 3 : 4;
      out.push({ mm: (i * MM_PER_IN) / 16, level, label: level === 0 ? String(i / 16) : undefined });
    }
  }
  return out;
}

/** Snap a position (mm) to the ruler resolution: 0.5 mm or 1/16 inch. */
export function snapRuler(mm: number, unit: RulerUnit): number {
  if (unit === "cm") return Math.round(mm * 2) / 2;
  return (Math.round((mm / MM_PER_IN) * 16) * MM_PER_IN) / 16;
}

/** Whole inches and a reduced fraction of sixteenths: 69/16 → { whole: 4, num: 5, den: 16 }. */
export function inchFraction(sixteenths: number): { whole: number; num: number; den: number } {
  const n = Math.round(sixteenths);
  const whole = Math.floor(n / 16);
  let num = n - whole * 16;
  let den = 16;
  while (num > 0 && num % 2 === 0) {
    num /= 2;
    den /= 2;
  }
  return { whole, num, den: num === 0 ? 1 : den };
}

/** "4 5/16" / "1/2" / "3" */
export function formatInchFraction(sixteenths: number): string {
  const { whole, num, den } = inchFraction(sixteenths);
  if (num === 0) return String(whole);
  return whole ? `${whole} ${num}/${den}` : `${num}/${den}`;
}

/**
 * Protractor angle (degrees, 0…180) of point (x, y) around centre (cx, cy) in screen
 * coordinates (y grows downwards). 0° points right, 90° up, 180° left.
 * Points below the baseline snap to the nearest end (0° or 180°).
 */
export function angleAt(cx: number, cy: number, x: number, y: number): number {
  const dx = x - cx;
  const dy = cy - y;
  if (dy <= 0) return dx >= 0 ? 0 : 180;
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  return Math.min(180, Math.max(0, a));
}

export function snapAngle(deg: number, step: number): number {
  const v = Math.round(deg / step) * step;
  return Math.min(180, Math.max(0, Math.round(v * 1000) / 1000));
}

/** Point on the protractor arc. */
export function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const t = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(t), y: cy - r * Math.sin(t) };
}

/** Angle between two arms, 0…180. */
export function armsAngle(a: number, b: number): number {
  return Math.abs(a - b);
}
