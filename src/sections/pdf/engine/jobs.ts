/** Messages exchanged with the pdf-lib worker. Types only — safe to import anywhere. */
import type { EditItem, TransformOp } from "./transform";
import type { ImagesLayout, MetaFields, NupOptions, PageNumberOptions, PageRef, Placement, ProtectOptions, TextWatermark, ImageStamp, DocInfo, FormFieldInfo, PdfErrorCode } from "./pdf-ops";

export interface SourceFile {
  bytes: ArrayBuffer;
  password?: string;
}

export interface OutputSpec {
  name: string;
  pages: PageRef[];
}

export interface ImageInput {
  bytes: ArrayBuffer;
  name: string;
}

export type Job =
  | { type: "assemble"; sources: SourceFile[]; outputs: OutputSpec[]; keepInfo?: boolean }
  | { type: "rotate"; source: SourceFile; rotations: { index: number; delta: number }[] }
  | { type: "compress"; source: SourceFile; mode: "lossless" | "images"; quality?: number; maxSide?: number }
  | { type: "raster"; pages: { jpeg: ArrayBuffer; width: number; height: number }[] }
  | { type: "images"; images: ImageInput[]; layout: ImagesLayout }
  | { type: "watermark"; source: SourceFile; pages: number[]; text?: TextWatermark; image?: { bytes: ArrayBuffer; stamp: ImageStamp }; font?: ArrayBuffer | null; preview?: number }
  | { type: "page-numbers"; source: SourceFile; options: PageNumberOptions; font?: ArrayBuffer | null; preview?: number }
  | { type: "nup"; source: SourceFile; options: NupOptions }
  | { type: "info"; source: SourceFile }
  | { type: "set-info"; source: SourceFile; meta: MetaFields; removeXmp: boolean }
  | { type: "fill-form"; source: SourceFile; values: Record<string, string | boolean | string[]>; flatten: boolean; font?: ArrayBuffer | null }
  | { type: "sign"; source: SourceFile; image: ArrayBuffer; placements: Placement[] }
  | { type: "protect"; source: SourceFile; options: ProtectOptions }
  | { type: "unlock"; source: SourceFile }
  /** In-place page transforms (mirror, grayscale, crop, paper size); `pages` = 0-based indices, all when omitted. */
  | { type: "transform"; source: SourceFile; op: TransformOp; pages?: number[]; preview?: number }
  /** Text and white-out boxes from the editor; `font` = Noto Sans bytes (the editor shows the same font). */
  | { type: "edit"; source: SourceFile; items: EditItem[]; font: ArrayBuffer };

export interface OutputFile {
  name: string;
  bytes: Uint8Array;
}

export interface JobResult {
  files: OutputFile[];
  info?: DocInfo;
  fields?: FormFieldInfo[];
  stats?: Record<string, number>;
}

export type WorkerMessage =
  | { type: "progress"; value: number }
  | { type: "codec"; id: number; request: import("./main-codec").CodecRequest }
  | { type: "done"; result: JobResult }
  | { type: "error"; code: PdfErrorCode | "generic"; message: string };
