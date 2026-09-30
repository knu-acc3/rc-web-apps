import { convertImage } from "./image-engine";
import { convertMedia } from "./media-engine";
import { convertImageToPdf, convertPdfToImages } from "./pdf-engine";
import type {
  ConversionFormat,
  ConversionResult,
  DetectedFile,
  ImageConversionFormat,
  PdfConversionFormat,
} from "./types";

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "converted-file";
}

function extensionFor(format: ConversionFormat) {
  return format === "jpeg" ? "jpg" : format;
}

export async function convertDetectedFile(
  detected: DetectedFile,
  format: ConversionFormat,
  options: { signal?: AbortSignal; onProgress?: (progress: number) => void } = {},
): Promise<ConversionResult> {
  const fileName = `${baseName(detected.file.name)}.${extensionFor(format)}`;
  if (detected.category === "image") {
    if (format === "pdf") {
      return {
        blob: await convertImageToPdf(detected.file, options.onProgress),
        fileName,
      };
    }
    const result = await convertImage(detected.file, {
      format: format as Exclude<ImageConversionFormat, "pdf">,
      quality: 86,
    });
    options.onProgress?.(1);
    return { blob: result.blob, fileName };
  }
  if (detected.category === "pdf") {
    const result = await convertPdfToImages(
      detected.file,
      format as PdfConversionFormat,
      options.onProgress,
    );
    return {
      blob: result.blob,
      fileName: result.fileName,
      additionalFiles: result.files.length > 1 ? result.files : undefined,
    };
  }
  if (detected.category === "audio" || detected.category === "video") {
    return {
      blob: await convertMedia(detected.file, format as Parameters<typeof convertMedia>[1], options),
      fileName,
    };
  }
  throw new Error("Unsupported file type.");
}

