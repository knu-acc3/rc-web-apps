export type FileCategory = "image" | "audio" | "video" | "pdf" | "unknown";

export type ConversionStatus =
  | "ready"
  | "processing"
  | "done"
  | "error"
  | "cancelled";

export type ImageConversionFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "avif"
  | "gif"
  | "tiff"
  | "bmp"
  | "ico"
  | "heic"
  | "pdf";

export type AudioConversionFormat =
  | "mp3"
  | "wav"
  | "m4a"
  | "flac"
  | "ogg"
  | "opus";

export type VideoConversionFormat =
  | "mp4"
  | "webm"
  | "mkv"
  | "mov"
  | "avi"
  | "gif";

export type PdfConversionFormat = "jpeg" | "png" | "webp";

export type ConversionFormat =
  | ImageConversionFormat
  | AudioConversionFormat
  | VideoConversionFormat
  | PdfConversionFormat;

export interface DetectedFile {
  file: File;
  category: FileCategory;
  mime: string;
  extension: string;
  animated: boolean;
  transparent: boolean | null;
  detection: "signature" | "mime" | "extension" | "unknown";
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  additionalFiles?: Array<{ blob: Blob; fileName: string }>;
}

export interface ConversionJob {
  id: string;
  detected: DetectedFile;
  outputFormat: ConversionFormat;
  status: ConversionStatus;
  progress: number;
  estimatedSize: number | null;
  result: ConversionResult | null;
  error: string | null;
  warning: string | null;
}

export interface FilePasteTarget {
  id: string;
  accept: string;
  multiple: boolean;
  disabled: boolean;
}

