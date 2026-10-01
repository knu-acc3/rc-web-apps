/** "Nice" axis ticks (1, 2, 2.5, 5 × 10ⁿ steps) covering [min, max]. Pure; used by the SVG charts. */
function niceStep(range: number, target = 5): number {
  if (!(range > 0) || !Number.isFinite(range)) return 1;
  const raw = range / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const f = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return f * mag;
}

interface Ticks {
  min: number;
  max: number;
  step: number;
  values: number[];
}

export function niceTicks(min: number, max: number, target = 5): Ticks {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 1, step: 1, values: [0, 1] };
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    min -= pad;
    max += pad;
  }
  if (min > max) [min, max] = [max, min];
  const step = niceStep(max - min, target);
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const values: number[] = [];
  for (let i = 0, v = lo; v <= hi + step * 1e-9 && i < 100; i++, v = lo + i * step) values.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { min: lo, max: hi, step, values };
}
