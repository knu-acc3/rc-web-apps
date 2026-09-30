/**
 * Canvas transforms. The same code runs in the worker (OffscreenCanvas) at
 * full resolution and on the main thread for downscaled live previews
 * (`env.scale` < 1 scales every pixel-sized parameter).
 */
import { applyFilter, gaussianBlur, pixelate } from "./filters";
import { largestInscribed, planResize, rotatedBounds, type Rect, type ResizeSpec } from "./geometry";
import type { AnyCanvas, Ctx2D, Fill, Op, Pos9, TextBlock, WatermarkSpec } from "./types";

export interface Env {
  create(w: number, h: number): AnyCanvas;
  /** preview size / full size */
  scale: number;
  assets?: Record<string, ImageBitmap>;
  /** High-quality resample of a whole canvas to dw×dh (pica). */
  resample?(src: AnyCanvas, dw: number, dh: number): Promise<AnyCanvas>;
}

export const MAX_SIDE = 32767;
export const MAX_AREA = 268_000_000;

export function ctx2d(c: AnyCanvas): Ctx2D {
  const ctx = c.getContext("2d") as Ctx2D | null;
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  return ctx;
}

/** Create a canvas, rejecting sizes the browser can't allocate. */
export function makeCanvas(env: Env, w: number, h: number): AnyCanvas {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  if (W > MAX_SIDE || H > MAX_SIDE || W * H > MAX_AREA) throw new Error("TOO_LARGE");
  return env.create(W, H);
}

function fillBg(ctx: Ctx2D, w: number, h: number, fill: Fill | undefined, src?: AnyCanvas, env?: Env) {
  if (!fill || fill.kind === "transparent") return;
  if (fill.kind === "color") {
    ctx.fillStyle = fill.color;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  if (fill.kind === "blur" && src && env) {
    // cover-fit a small copy, blur it, scale it up: cheap and smooth
    const k = Math.min(1, 160 / Math.max(w, h));
    const sw = Math.max(1, Math.round(w * k));
    const sh = Math.max(1, Math.round(h * k));
    const small = env.create(sw, sh);
    const sc = ctx2d(small);
    const cover = Math.max(sw / src.width, sh / src.height);
    const dw = src.width * cover;
    const dh = src.height * cover;
    sc.imageSmoothingQuality = "high";
    sc.drawImage(src, (sw - dw) / 2, (sh - dh) / 2, dw, dh);
    const img = sc.getImageData(0, 0, sw, sh);
    gaussianBlur({ data: img.data, width: sw, height: sh }, Math.max(2, Math.min(sw, sh) / 14));
    sc.putImageData(img, 0, 0);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small, 0, 0, w, h);
    // slightly darken so the photo stands out
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, w, h);
  }
}

/** Downscale with repeated halving (fallback when pica is unavailable). */
function steppedDraw(env: Env, src: AnyCanvas, dw: number, dh: number): AnyCanvas {
  let cur: AnyCanvas = src;
  while (cur.width / 2 >= dw && cur.height / 2 >= dh) {
    const half = env.create(Math.max(1, Math.round(cur.width / 2)), Math.max(1, Math.round(cur.height / 2)));
    const hc = ctx2d(half);
    hc.imageSmoothingQuality = "high";
    hc.drawImage(cur, 0, 0, half.width, half.height);
    if (cur !== src) releaseCanvas(cur);
    cur = half;
  }
  const out = env.create(dw, dh);
  const oc = ctx2d(out);
  oc.imageSmoothingQuality = "high";
  oc.drawImage(cur, 0, 0, dw, dh);
  if (cur !== src) releaseCanvas(cur);
  return out;
}

export async function resampleCanvas(env: Env, src: AnyCanvas, dw: number, dh: number): Promise<AnyCanvas> {
  dw = Math.max(1, Math.round(dw));
  dh = Math.max(1, Math.round(dh));
  if (dw === src.width && dh === src.height) return src;
  if (env.resample) {
    try {
      return await env.resample(src, dw, dh);
    } catch {
      /* fall back to canvas smoothing */
    }
  }
  return steppedDraw(env, src, dw, dh);
}

/** Free canvas memory early (important for 50 MP images). */
export function releaseCanvas(c: AnyCanvas) {
  c.width = 1;
  c.height = 1;
}

function cropCanvas(env: Env, src: AnyCanvas, r: Rect): AnyCanvas {
  const x = Math.max(0, Math.round(r.x));
  const y = Math.max(0, Math.round(r.y));
  const w = Math.max(1, Math.min(src.width - x, Math.round(r.w)));
  const h = Math.max(1, Math.min(src.height - y, Math.round(r.h)));
  if (x === 0 && y === 0 && w === src.width && h === src.height) return src;
  const out = makeCanvas(env, w, h);
  ctx2d(out).drawImage(src, x, y, w, h, 0, 0, w, h);
  return out;
}

function scaleSpec(spec: ResizeSpec, s: number): ResizeSpec {
  if (s === 1) return spec;
  return {
    ...spec,
    width: spec.width ? spec.width * s : spec.width,
    height: spec.height ? spec.height * s : spec.height,
    long: spec.long ? spec.long * s : spec.long,
  };
}

const scaleRect = (r: Rect, s: number): Rect => ({ x: r.x * s, y: r.y * s, w: r.w * s, h: r.h * s });

/** Result metadata collected while running ops. */
export interface RunInfo {
  limited: boolean;
}

export async function runOps(env: Env, input: AnyCanvas, ops: Op[], info: RunInfo = { limited: false }): Promise<AnyCanvas> {
  let c = input;
  for (const op of ops) {
    const next = await runOp(env, c, op, info);
    if (next !== c && c !== input) releaseCanvas(c);
    c = next;
  }
  return c;
}

async function runOp(env: Env, c: AnyCanvas, op: Op, info: RunInfo): Promise<AnyCanvas> {
  const s = env.scale;
  switch (op.t) {
    case "crop":
      return cropCanvas(env, c, scaleRect(op.rect, s));

    case "resize": {
      const p = planResize(c.width, c.height, scaleSpec(op.spec, s));
      if (p.limited) info.limited = true;
      if (!p.changed) return c;
      const region = p.sx !== 0 || p.sy !== 0 || p.sw !== c.width || p.sh !== c.height ? cropCanvas(env, c, { x: p.sx, y: p.sy, w: p.sw, h: p.sh }) : c;
      const scaled = await resampleCanvas(env, region, p.dw, p.dh);
      if (region !== c && region !== scaled) releaseCanvas(region);
      if (p.w === p.dw && p.h === p.dh && p.dx === 0 && p.dy === 0) return scaled;
      const out = makeCanvas(env, p.w, p.h);
      const oc = ctx2d(out);
      fillBg(oc, p.w, p.h, op.fill ?? { kind: "transparent" }, c, env);
      oc.drawImage(scaled, p.dx, p.dy);
      if (scaled !== c) releaseCanvas(scaled);
      return out;
    }

    case "size": {
      const w = Math.max(1, Math.round(op.w * s));
      const h = Math.max(1, Math.round(op.h * s));
      return resampleCanvas(env, c, w, h);
    }

    case "orient": {
      const k = ((op.rot % 4) + 4) % 4;
      if (!op.flip && k === 0) return c;
      const swap = k % 2 === 1;
      const out = makeCanvas(env, swap ? c.height : c.width, swap ? c.width : c.height);
      const oc = ctx2d(out);
      oc.translate(out.width / 2, out.height / 2);
      oc.rotate((k * Math.PI) / 2);
      if (op.flip) oc.scale(-1, 1);
      oc.drawImage(c, -c.width / 2, -c.height / 2);
      return out;
    }

    case "flip": {
      if (!op.h && !op.v) return c;
      const out = makeCanvas(env, c.width, c.height);
      const oc = ctx2d(out);
      oc.translate(op.h ? c.width : 0, op.v ? c.height : 0);
      oc.scale(op.h ? -1 : 1, op.v ? -1 : 1);
      oc.drawImage(c, 0, 0);
      return out;
    }

    case "rotate": {
      const deg = ((op.deg % 360) + 360) % 360;
      if (deg === 0) return c;
      const b = op.mode === "expand" ? rotatedBounds(c.width, c.height, deg) : largestInscribed(c.width, c.height, deg);
      const w = Math.max(1, op.mode === "expand" ? Math.ceil(b.w - 1e-6) : Math.floor(b.w + 1e-6));
      const h = Math.max(1, op.mode === "expand" ? Math.ceil(b.h - 1e-6) : Math.floor(b.h + 1e-6));
      const out = makeCanvas(env, w, h);
      const oc = ctx2d(out);
      if (op.mode === "expand") fillBg(oc, w, h, op.fill);
      oc.imageSmoothingQuality = "high";
      oc.translate(w / 2, h / 2);
      oc.rotate((deg * Math.PI) / 180);
      oc.drawImage(c, -c.width / 2, -c.height / 2);
      return out;
    }

    case "filter": {
      const ctx = ctx2d(c);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      applyFilter(img, op.id, op.params, s);
      ctx.putImageData(img, 0, 0);
      return c;
    }

    case "censor":
      censorOn(ctx2d(c), c.width, c.height, op, s);
      return c;

    case "round":
    case "circle": {
      const out = makeCanvas(env, c.width, c.height);
      const oc = ctx2d(out);
      fillBg(oc, c.width, c.height, op.fill);
      oc.save();
      oc.beginPath();
      if (op.t === "circle") {
        oc.ellipse(c.width / 2, c.height / 2, c.width / 2, c.height / 2, 0, 0, Math.PI * 2);
      } else {
        const half = Math.min(c.width, c.height) / 2;
        const rad = op.unit === "%" ? (half * op.radius) / 100 : Math.min(half, op.radius * s);
        roundRectPath(oc, 0, 0, c.width, c.height, rad);
      }
      oc.clip();
      oc.drawImage(c, 0, 0);
      oc.restore();
      return out;
    }

    case "border": {
      const short = Math.min(c.width, c.height);
      const bw = Math.max(0, op.unit === "%" ? (short * op.width) / 100 : op.width * s);
      if (bw <= 0) return c;
      if (op.inside) {
        const ctx = ctx2d(c);
        const b = Math.min(bw, short / 2);
        ctx.fillStyle = op.color;
        ctx.fillRect(0, 0, c.width, b);
        ctx.fillRect(0, c.height - b, c.width, b);
        ctx.fillRect(0, 0, b, c.height);
        ctx.fillRect(c.width - b, 0, b, c.height);
        return c;
      }
      const b = Math.round(bw);
      const out = makeCanvas(env, c.width + 2 * b, c.height + 2 * b);
      const oc = ctx2d(out);
      oc.fillStyle = op.color;
      oc.fillRect(0, 0, out.width, out.height);
      oc.drawImage(c, b, b);
      return out;
    }

    case "pad": {
      const [rw, rh] = op.ratio;
      const target = rw / rh;
      const cur = c.width / c.height;
      if (Math.abs(cur - target) < 1e-3) return c;
      const w = cur < target ? Math.round(c.height * target) : c.width;
      const h = cur < target ? c.height : Math.round(c.width / target);
      const out = makeCanvas(env, w, h);
      const oc = ctx2d(out);
      fillBg(oc, w, h, op.fill, c, env);
      oc.drawImage(c, Math.round((w - c.width) / 2), Math.round((h - c.height) / 2));
      return out;
    }

    case "watermark":
      drawWatermark(ctx2d(c), c.width, c.height, op.wm, env);
      return c;

    case "text":
      for (const b of op.blocks) drawTextBlock(ctx2d(c), c.width, c.height, b);
      return c;
  }
}

/** Blur / pixelate / black-box rectangles (source px × scale) in place. */
export function censorOn(ctx: Ctx2D, cw: number, ch: number, op: Extract<Op, { t: "censor" }>, s: number) {
  for (const a of op.areas) {
    const r = scaleRect(a, s);
    const x = Math.max(0, Math.floor(r.x));
    const y = Math.max(0, Math.floor(r.y));
    const w = Math.min(cw - x, Math.ceil(r.w + (r.x - x)));
    const h = Math.min(ch - y, Math.ceil(r.h + (r.y - y)));
    if (w < 1 || h < 1) continue;
    if (op.mode === "box") {
      ctx.fillStyle = op.color ?? "#000000";
      ctx.fillRect(x, y, w, h);
      continue;
    }
    const k = Math.max(0, Math.min(100, op.strength)) / 100;
    const short = Math.min(w, h);
    const img = ctx.getImageData(x, y, w, h);
    if (op.mode === "pixelate") pixelate(img, Math.max(3, short * (0.04 + 0.26 * k)));
    else {
      gaussianBlur(img, Math.max(2, short * (0.03 + 0.17 * k)));
      // second pass removes residual structure
      gaussianBlur(img, Math.max(1, short * 0.02));
    }
    ctx.putImageData(img, x, y);
  }
}

export function roundRectPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

/* ───────────── watermark ───────────── */

function posXY(pos: Pos9, W: number, H: number, w: number, h: number, m: number): [number, number] {
  const col = pos[1];
  const row = pos[0];
  const x = col === "l" ? m : col === "r" ? W - m - w : (W - w) / 2;
  const y = row === "t" ? m : row === "b" ? H - m - h : (H - h) / 2;
  return [x, y];
}

function drawWatermark(ctx: Ctx2D, W: number, H: number, wm: WatermarkSpec, env: Env) {
  const margin = (Math.min(W, H) * wm.margin) / 100;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, wm.opacity / 100));
  let draw: (x: number, y: number) => void;
  let w: number;
  let h: number;
  if (wm.kind === "image") {
    const logo = wm.asset ? env.assets?.[wm.asset] : undefined;
    if (!logo) {
      ctx.restore();
      return;
    }
    w = Math.max(1, (W * wm.size) / 100);
    h = (w * logo.height) / logo.width;
    ctx.imageSmoothingQuality = "high";
    draw = (x, y) => ctx.drawImage(logo, x, y, w, h);
  } else {
    const text = (wm.text ?? "").trim();
    if (!text) {
      ctx.restore();
      return;
    }
    const px = Math.max(4, (W * wm.size) / 100);
    ctx.font = `${wm.bold ? "700 " : ""}${px}px ${wm.font ?? "Arial, sans-serif"}`;
    ctx.textBaseline = "top";
    const m = ctx.measureText(text);
    w = m.width;
    h = px * 1.15;
    ctx.fillStyle = wm.color ?? "#ffffff";
    if (wm.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = px * 0.12;
      ctx.shadowOffsetX = px * 0.04;
      ctx.shadowOffsetY = px * 0.04;
    }
    draw = (x, y) => ctx.fillText(text, x, y + px * 0.05);
  }
  const rot = (wm.rotate * Math.PI) / 180;
  if (wm.position === "tile") {
    const gap = Math.max(0.2, (wm.gap ?? 60) / 100);
    const stepX = w * (1 + gap);
    const stepY = h * (1 + gap) + h;
    const diag = Math.sqrt(W * W + H * H);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(rot);
    let row = 0;
    for (let y = -diag / 2; y < diag / 2; y += stepY, row++) {
      const offset = row % 2 ? stepX / 2 : 0;
      for (let x = -diag / 2 - offset; x < diag / 2; x += stepX) draw(x, y);
    }
  } else {
    const [x, y] = posXY(wm.position, W, H, w, h, margin);
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(rot);
    draw(-w / 2, -h / 2);
  }
  ctx.restore();
}

/* ───────────── text ───────────── */

/** Split text into lines that fit `maxWidth` (words; very long words are broken). */
export function wrapLines(ctx: Ctx2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const tryLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(tryLine).width <= maxWidth || !line) {
        if (!line && ctx.measureText(word).width > maxWidth) {
          // break an over-long word by characters
          let chunk = "";
          for (const ch of Array.from(word)) {
            if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
              out.push(chunk);
              chunk = ch;
            } else chunk += ch;
          }
          line = chunk;
        } else line = tryLine;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export function drawTextBlock(ctx: Ctx2D, W: number, H: number, b: TextBlock) {
  const raw = b.uppercase ? b.text.toLocaleUpperCase() : b.text;
  if (!raw.trim()) return;
  const px = Math.max(4, (H * b.size) / 100);
  ctx.save();
  ctx.font = `${b.italic ? "italic " : ""}${b.bold ? "700 " : ""}${px}px ${b.font}`;
  ctx.textBaseline = "alphabetic";
  const maxW = Math.max(px, (W * b.maxWidth) / 100);
  const lines = wrapLines(ctx, raw, maxW);
  const lh = px * (b.lineHeight ?? 1.18);
  const blockH = lh * lines.length;
  const cx = b.x * W;
  const ay = b.y * H;
  const top = b.anchor === "top" ? ay : b.anchor === "bottom" ? ay - blockH : ay - blockH / 2;
  ctx.textAlign = b.align;
  const x = b.align === "left" ? cx - maxW / 2 : b.align === "right" ? cx + maxW / 2 : cx;
  const sw = (px * b.strokeWidth) / 100;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  if (b.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = px * 0.15;
    ctx.shadowOffsetY = px * 0.05;
  }
  lines.forEach((line, i) => {
    const y = top + lh * i + px * 0.92;
    if (sw > 0) {
      ctx.strokeStyle = b.stroke;
      ctx.lineWidth = sw * 2;
      ctx.strokeText(line, x, y);
      if (b.shadow) ctx.shadowColor = "transparent";
    }
    ctx.fillStyle = b.color;
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}

/** Draw a blank background (colour or linear gradient at `angle` degrees). */
export function paintBlank(ctx: Ctx2D, w: number, h: number, color: string, gradient?: [string, string, number]) {
  if (gradient) {
    const a = (gradient[2] * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2;
    const dx = Math.sin(a) * len;
    const dy = -Math.cos(a) * len;
    const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    g.addColorStop(0, gradient[0]);
    g.addColorStop(1, gradient[1]);
    ctx.fillStyle = g;
  } else ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
}
