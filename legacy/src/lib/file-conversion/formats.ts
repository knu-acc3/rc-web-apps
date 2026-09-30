import type {
  ConversionFormat,
  DetectedFile,
  FileCategory,
} from "./types";

export const FILE_LIMITS: Record<Exclude<FileCategory, "unknown">, number> = {
  image: 250 * 1024 * 1024,
  pdf: 250 * 1024 * 1024,
  audio: 500 * 1024 * 1024,
  video: 1024 * 1024 * 1024,
};

export const ZIP_RESULT_LIMIT = 500 * 1024 * 1024;

export const EXTENDED_IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "jpe", "png", "webp", "avif", "gif", "apng", "svg",
  "heic", "heif", "heics", "heifs", "tif", "tiff", "bmp", "dib", "ico",
  "cur", "jxl", "jp2", "j2k", "jpf", "jpx", "psd", "psb", "tga", "dds",
  "exr", "hdr", "qoi", "cr2", "cr3", "crw", "dng", "nef", "nrw", "arw",
  "orf", "rw2", "raf", "pef", "sr2", "srf", "srw", "erf", "3fr", "fff",
  "iiq", "k25", "kdc", "mef", "mos", "mrw", "rwl",
] as const;

export const AUDIO_EXTENSIONS = [
  "mp3", "wav", "aac", "m4a", "flac", "ogg", "oga", "opus", "aiff", "aif",
  "wma", "amr", "ac3", "caf", "mka",
] as const;

export const VIDEO_EXTENSIONS = [
  "mp4", "mov", "mkv", "avi", "webm", "mpeg", "mpg", "mpe", "wmv", "flv",
  "m4v", "3gp", "3g2", "ts", "mts", "m2ts", "ogv", "vob", "mxf",
] as const;

export const UNIVERSAL_ACCEPT = [
  ...EXTENDED_IMAGE_EXTENSIONS,
  ...AUDIO_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  "pdf",
].map((extension) => `.${extension}`).join(",");

export const EXTENDED_IMAGE_ACCEPT = [
  "image/*",
  ...EXTENDED_IMAGE_EXTENSIONS.map((extension) => `.${extension}`),
].join(",");

const extensionCategory = new Map<string, FileCategory>([
  ...EXTENDED_IMAGE_EXTENSIONS.map((value) => [value, "image"] as const),
  ...AUDIO_EXTENSIONS.map((value) => [value, "audio"] as const),
  ...VIDEO_EXTENSIONS.map((value) => [value, "video"] as const),
  ["pdf", "pdf"],
]);

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif", gif: "image/gif", apng: "image/apng",
  svg: "image/svg+xml", heic: "image/heic", heif: "image/heif", tif: "image/tiff",
  tiff: "image/tiff", bmp: "image/bmp", ico: "image/x-icon", jxl: "image/jxl",
  jp2: "image/jp2", psd: "image/vnd.adobe.photoshop", tga: "image/x-tga",
  mp3: "audio/mpeg", wav: "audio/wav", aac: "audio/aac", m4a: "audio/mp4",
  flac: "audio/flac", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/opus",
  aiff: "audio/aiff", aif: "audio/aiff", wma: "audio/x-ms-wma",
  mp4: "video/mp4", mov: "video/quicktime", mkv: "video/x-matroska",
  avi: "video/x-msvideo", webm: "video/webm", mpeg: "video/mpeg", mpg: "video/mpeg",
  wmv: "video/x-ms-wmv", flv: "video/x-flv", m4v: "video/x-m4v",
  "3gp": "video/3gpp", ts: "video/mp2t", pdf: "application/pdf",
};

export const OUTPUT_FORMATS: Record<Exclude<FileCategory, "unknown">, ConversionFormat[]> = {
  image: ["jpeg", "png", "webp", "avif", "gif", "tiff", "bmp", "ico", "heic", "pdf"],
  audio: ["mp3", "wav", "m4a", "flac", "ogg", "opus"],
  video: ["mp4", "webm", "mkv", "mov", "avi", "gif"],
  pdf: ["jpeg", "png", "webp"],
};

export const OUTPUT_LABELS: Record<ConversionFormat, string> = {
  jpeg: "JPEG", png: "PNG", webp: "WebP", avif: "AVIF", gif: "GIF",
  tiff: "TIFF", bmp: "BMP", ico: "ICO", heic: "HEIC", pdf: "PDF",
  mp3: "MP3", wav: "WAV", m4a: "M4A / AAC", flac: "FLAC", ogg: "OGG",
  opus: "Opus", mp4: "MP4", webm: "WebM", mkv: "MKV", mov: "MOV", avi: "AVI",
};

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > -1 ? fileName.slice(lastDot + 1).toLowerCase() : "";
}

function categoryFromMime(mime: string): FileCategory {
  const lower = mime.toLowerCase();
  if (lower === "application/pdf") return "pdf";
  if (lower.startsWith("image/")) return "image";
  if (lower.startsWith("audio/")) return "audio";
  if (lower.startsWith("video/")) return "video";
  return "unknown";
}

export function sniffFileSignature(bytes: Uint8Array): { extension: string; mime: string } | null {
  const text = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  if (text(0, 5) === "%PDF-") return { extension: "pdf", mime: "application/pdf" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", mime: "image/jpeg" };
  if (bytes[0] === 0x89 && text(1, 3) === "PNG") return { extension: "png", mime: "image/png" };
  if (text(0, 6) === "GIF87a" || text(0, 6) === "GIF89a") return { extension: "gif", mime: "image/gif" };
  if (text(0, 4) === "RIFF" && text(8, 4) === "WEBP") return { extension: "webp", mime: "image/webp" };
  if (text(0, 4) === "RIFF" && text(8, 4) === "WAVE") return { extension: "wav", mime: "audio/wav" };
  if (text(0, 4) === "RIFF" && text(8, 4) === "AVI ") return { extension: "avi", mime: "video/x-msvideo" };
  if (text(0, 4) === "fLaC") return { extension: "flac", mime: "audio/flac" };
  if (text(0, 4) === "OggS") return { extension: "ogg", mime: "audio/ogg" };
  if (text(0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return { extension: "mp3", mime: "audio/mpeg" };
  if (text(0, 2) === "BM") return { extension: "bmp", mime: "image/bmp" };
  if ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0) ||
      (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0 && bytes[3] === 0x2a)) {
    return { extension: "tiff", mime: "image/tiff" };
  }
  if (text(0, 4) === "8BPS") return { extension: "psd", mime: "image/vnd.adobe.photoshop" };
  if (text(4, 4) === "ftyp") {
    const brand = text(8, 12).toLowerCase();
    if (/avif|avis/.test(brand)) return { extension: "avif", mime: "image/avif" };
    if (/heic|heix|hevc|hevx|heim|heis|mif1|msf1/.test(brand)) return { extension: "heic", mime: "image/heic" };
    if (/qt\s\s/.test(brand)) return { extension: "mov", mime: "video/quicktime" };
    if (/m4a|m4b/.test(brand)) return { extension: "m4a", mime: "audio/mp4" };
    return { extension: "mp4", mime: "video/mp4" };
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return { extension: "mkv", mime: "video/x-matroska" };
  }
  return null;
}

export async function detectFile(file: File): Promise<DetectedFile> {
  const sample = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const signature = sniffFileSignature(sample);
  const namedExtension = getFileExtension(file.name);
  const mimeCategory = categoryFromMime(file.type);
  const extension = signature?.extension || namedExtension;
  const extensionDetectedCategory = extensionCategory.get(extension) ?? "unknown";
  const category = signature
    ? categoryFromMime(signature.mime)
    : mimeCategory !== "unknown"
      ? mimeCategory
      : extensionDetectedCategory;
  const mime = signature?.mime || file.type || mimeByExtension[extension] || "application/octet-stream";
  return {
    file,
    category,
    mime,
    extension,
    animated: extension === "gif" || extension === "apng",
    transparent: ["png", "webp", "avif", "gif", "apng", "svg"].includes(extension) ? null : false,
    detection: signature ? "signature" : mimeCategory !== "unknown" ? "mime" : extensionDetectedCategory !== "unknown" ? "extension" : "unknown",
  };
}

export function recommendedFormat(file: DetectedFile): ConversionFormat | null {
  if (file.category === "image") {
    if (file.animated) return "webp";
    if (file.transparent !== false) return "png";
    return "jpeg";
  }
  if (file.category === "audio") return "mp3";
  if (file.category === "video") return "mp4";
  if (file.category === "pdf") return "jpeg";
  return null;
}

export function estimateOutputSize(file: DetectedFile, format: ConversionFormat): number {
  const ratios: Partial<Record<ConversionFormat, number>> = {
    jpeg: 0.55, png: 0.9, webp: 0.42, avif: 0.32, gif: 0.8,
    tiff: 1.35, bmp: 1.8, ico: 0.35, heic: 0.4, pdf: 0.85,
    mp3: 0.18, wav: 1.2, m4a: 0.16, flac: 0.65, ogg: 0.17, opus: 0.13,
    mp4: 0.65, mkv: 0.7, mov: 0.72, avi: 0.9,
  };
  const categoryFloor = file.category === "video" ? 128 * 1024 : 16 * 1024;
  return Math.max(categoryFloor, Math.round(file.file.size * (ratios[format] ?? 0.75)));
}

export function getLimitError(file: DetectedFile, isEn: boolean): string | null {
  if (file.category === "unknown") return isEn ? "The file type could not be recognized." : "Не удалось распознать тип файла.";
  const limit = FILE_LIMITS[file.category];
  if (file.file.size <= limit) return null;
  const megabytes = Math.round(limit / 1024 / 1024);
  return isEn
    ? `${file.file.name} is larger than the ${megabytes} MB limit for ${file.category} files.`
    : `${file.file.name}: превышен лимит ${megabytes} МБ для этого типа файлов.`;
}

function acceptTokenMatches(file: File, token: string): boolean {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "*/*") return true;
  if (normalized.startsWith(".")) return file.name.toLowerCase().endsWith(normalized);
  if (normalized.endsWith("/*")) return file.type.toLowerCase().startsWith(normalized.slice(0, -1));
  return file.type.toLowerCase() === normalized;
}

export function fileMatchesAccept(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  return accept.split(",").some((token) => acceptTokenMatches(file, token));
}

export function isExtendedImageFile(file: File): boolean {
  return file.type.startsWith("image/") || extensionCategory.get(getFileExtension(file.name)) === "image";
}
