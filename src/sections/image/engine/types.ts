/** Serializable job description shared by the UI, the worker and the main-thread fallback. */
import type { FilterId } from "../data/types";
import type { SniffedFormat } from "./detect";
import type { FilterParams } from "./filters";
import type { Rect, ResizeSpec } from "./geometry";

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
export type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/** Background for areas that become empty. */
export type Fill = { kind: "transparent" } | { kind: "color"; color: string } | { kind: "blur" };

export type Pos9 = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

export interface WatermarkSpec {
  kind: "text" | "image";
  text?: string;
  font?: string;
  color?: string;
  bold?: boolean;
  shadow?: boolean;
  /** key of an asset bitmap sent with the job */
  asset?: string;
  /** Text: font size; image: logo width — % of the image width. */
  size: number;
  /** 0–100 */
  opacity: number;
  position: Pos9 | "tile";
  /** % of the shorter side */
  margin: number;
  /** degrees */
  rotate: number;
  /** tile spacing, % of the watermark size */
  gap?: number;
}

export interface TextBlock {
  text: string;
  font: string;
  /** Font size, % of the image height. */
  size: number;
  color: string;
  stroke: string;
  /** Outline width, % of the font size (0 = none). */
  strokeWidth: number;
  align: "left" | "center" | "right";
  /** Anchor point 0–1 (relative to the canvas). */
  x: number;
  y: number;
  /** Which edge of the text box sits on `y`. */
  anchor: "top" | "middle" | "bottom";
  /** Wrap width, % of the image width. */
  maxWidth: number;
  bold?: boolean;
  italic?: boolean;
  uppercase?: boolean;
  shadow?: boolean;
  /** Line height multiplier. */
  lineHeight?: number;
}

export type Op =
  | { t: "crop"; rect: Rect }
  | { t: "resize"; spec: ResizeSpec; fill?: Fill }
  | { t: "orient"; flip: boolean; rot: number }
  | { t: "flip"; h: boolean; v: boolean }
  | { t: "rotate"; deg: number; mode: "crop" | "expand"; fill: Fill }
  | { t: "filter"; id: FilterId; params: FilterParams }
  | { t: "censor"; areas: Rect[]; mode: "blur" | "pixelate" | "box"; strength: number; color?: string }
  | { t: "round"; radius: number; unit: "px" | "%"; fill: Fill }
  | { t: "circle"; fill: Fill }
  | { t: "border"; width: number; unit: "px" | "%"; color: string; inside: boolean }
  | { t: "pad"; ratio: [number, number]; fill: Fill }
  | { t: "watermark"; wm: WatermarkSpec }
  | { t: "text"; blocks: TextBlock[] }
  | { t: "size"; w: number; h: number };

export type OutFormat = "jpg" | "png" | "webp" | "avif" | "gif" | "ico";

export interface OutputSpec {
  format: OutFormat;
  /** 1–100 */
  quality: number;
  /** Background for formats without alpha (JPG). */
  background: string;
  /** MozJPEG for JPG, OxiPNG for PNG (slower, smaller). */
  best?: boolean;
  /** PNG: reduce to N colours (2–256); 0/undefined = lossless. */
  pngColors?: number;
  icoSizes?: number[];
  /** Write DPI into JPG (JFIF) / PNG (pHYs). */
  dpi?: number;
  /** Copy the source EXIF block into JPG output (orientation reset). */
  keepExif?: boolean;
  /** Compress-to-size target in bytes. */
  targetBytes?: number;
  /** When a target can't be met by quality alone, allow scaling down. */
  allowDownscale?: boolean;
  /** If the result is not smaller than the source (same format), return the source bytes. */
  keepSmaller?: boolean;
}

/** Where the pixels come from. */
export type Src =
  | { kind: "blob"; blob: Blob; format: SniffedFormat; id: string }
  | { kind: "bitmap"; bitmap: ImageBitmap; format: SniffedFormat; id: string }
  | { kind: "blank"; w: number; h: number; background: string; gradient?: [string, string, number]; id: string };

export interface ProcessResult {
  bytes: ArrayBuffer;
  mime: string;
  ext: string;
  width: number;
  height: number;
  /** The original file was returned unchanged (it was smaller). */
  keptOriginal?: boolean;
  /** Quality actually used (target-size mode). */
  quality?: number;
  /** Scale applied to fit a target size. */
  scale?: number;
  /** Target size could not be reached. */
  missedTarget?: boolean;
  /** Encoder that produced the file, e.g. "MozJPEG", "browser", "libwebp". */
  encoder?: string;
  /** The requested size was capped because upscaling is off. */
  limited?: boolean;
}

export type JobRequest =
  | { type: "process"; src: Src; ops: Op[]; out: OutputSpec; assets?: Record<string, ImageBitmap> }
  /** Decode (+ optional ops) and return a downscaled bitmap for previews. */
  | { type: "preview"; src: Src; maxSide: number; ops?: Op[]; assets?: Record<string, ImageBitmap> }
  /** Decoded size + alpha info. */
  | { type: "info"; src: Src }
  /** RGBA of a downscaled copy (palette, eyedropper). */
  | { type: "pixels"; src: Src; maxSide: number }
  | { type: "palette"; src: Src; count: number }
  | { type: "gif-encode"; frames: ImageBitmap[]; width: number; height: number; fit: "contain" | "cover"; background: string; delay: number; delays?: number[]; loop: number }
  | { type: "gif-frames"; bytes: ArrayBuffer; indices?: number[] }
  | { type: "encode-rgba"; rgba: ArrayBuffer; width: number; height: number; out: OutputSpec };

export interface PreviewResult {
  bitmap: ImageBitmap;
  /** Size of the decoded source (before ops/downscale). */
  srcWidth: number;
  srcHeight: number;
  /** Size after ops at full resolution. */
  width: number;
  height: number;
  scale: number;
}

export interface InfoResult {
  width: number;
  height: number;
  alpha: boolean;
}

export interface PixelsResult {
  rgba: ArrayBuffer;
  width: number;
  height: number;
  srcWidth: number;
  srcHeight: number;
}

export interface GifFramesResult {
  width: number;
  height: number;
  loop: number | null;
  frames: { index: number; delay: number; shownDelay: number; png: ArrayBuffer }[];
}

export type WorkerIn = { id: number; req: JobRequest };
export type WorkerOut =
  | { id: number; kind: "progress"; value: number }
  | { id: number; kind: "done"; result: unknown }
  | { id: number; kind: "error"; message: string; code?: string }
  | { id: 0; kind: "ready"; offscreen: boolean };
