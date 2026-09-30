import type { ConversionFormat } from "./types";
import {
  EXTENDED_IMAGE_ACCEPT,
  getFileExtension,
  isExtendedImageFile,
} from "./formats";

export { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile };

type ImageOutputFormat = Extract<
  ConversionFormat,
  "jpeg" | "png" | "webp" | "avif" | "gif" | "tiff" | "bmp" | "ico" | "heic"
>;

export interface ImageConversionOptions {
  format: ImageOutputFormat;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ImageConversionOutput {
  blob: Blob;
  width: number;
  height: number;
  sourceFormat: string;
  outputFormat: string;
  usedAdvancedDecoder: boolean;
  animated: boolean;
}

const browserReadableExtensions = new Set([
  "jpg", "jpeg", "jpe", "png", "webp", "gif", "svg", "bmp", "avif",
]);

const mimeByOutput: Record<ImageOutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  tiff: "image/tiff",
  bmp: "image/bmp",
  ico: "image/x-icon",
  heic: "image/heic",
};

let magickPromise: Promise<typeof import("@imagemagick/magick-wasm")> | null = null;

async function getImageMagick() {
  if (!magickPromise) {
    magickPromise = import("@imagemagick/magick-wasm").then(async (module) => {
      await module.initializeImageMagick(
        new URL("/vendor/imagemagick/magick.wasm", window.location.origin),
      );
      return module;
    });
  }
  return magickPromise;
}

export async function getAdvancedImageFormatSupport() {
  const { Magick } = await getImageMagick();
  return Magick.supportedFormats.map((format) => ({
    format: String(format.format).toLowerCase(),
    description: format.description,
    canRead: format.supportsReading,
    canWrite: format.supportsWriting,
    animated: format.supportsMultipleFrames,
  }));
}

function loadBrowserImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Browser image decoder could not read this file."));
    };
    image.src = url;
  });
}

function getTargetSize(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
) {
  if (!maxWidth && !maxHeight) return { width, height };
  const ratio = Math.min(
    maxWidth ? maxWidth / width : 1,
    maxHeight ? maxHeight / height : 1,
    1,
  );
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function canvasConvert(
  file: File,
  options: ImageConversionOptions,
): Promise<ImageConversionOutput> {
  const image = await loadBrowserImage(file);
  const size = getTargetSize(
    image.naturalWidth,
    image.naturalHeight,
    options.maxWidth,
    options.maxHeight,
  );
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable in this browser.");
  if (options.format === "jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
  }
  context.drawImage(image, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("This browser cannot encode the selected output format.")),
      mimeByOutput[options.format],
      options.format === "png" ? undefined : (options.quality ?? 86) / 100,
    );
  });
  return {
    blob,
    width: size.width,
    height: size.height,
    sourceFormat: getFileExtension(file.name),
    outputFormat: options.format,
    usedAdvancedDecoder: false,
    animated: getFileExtension(file.name) === "gif",
  };
}

async function magickConvert(
  file: File,
  options: ImageConversionOptions,
): Promise<ImageConversionOutput> {
  const magick = await getImageMagick();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const formatMap: Record<ImageOutputFormat, typeof magick.MagickFormat[keyof typeof magick.MagickFormat]> = {
    jpeg: magick.MagickFormat.Jpeg,
    png: magick.MagickFormat.Png,
    webp: magick.MagickFormat.WebP,
    avif: magick.MagickFormat.Avif,
    gif: magick.MagickFormat.Gif,
    tiff: magick.MagickFormat.Tiff,
    bmp: magick.MagickFormat.Bmp,
    ico: magick.MagickFormat.Ico,
    heic: magick.MagickFormat.Heic,
  };
  const outputFormat = formatMap[options.format];
  const outputInfo = magick.Magick.supportedFormats.find((item) => item.format === outputFormat);
  if (!outputInfo?.supportsWriting) {
    throw new Error(`${options.format.toUpperCase()} encoding is not available in this browser build.`);
  }

  let frameCount = 1;
  let width = 0;
  let height = 0;
  const data = await magick.ImageMagick.readCollection(bytes, (images) => {
    if (images.length === 0) throw new Error("ImageMagick could not decode this image.");
    frameCount = images.length;
    const preserveAnimation = images.length > 1 && (options.format === "gif" || options.format === "webp");
    if (preserveAnimation) images.coalesce();
    const selectedImages = preserveAnimation ? Array.from(images) : [images[0]];
    for (const image of selectedImages) {
      image.autoOrient();
      const target = getTargetSize(
        image.width,
        image.height,
        options.maxWidth,
        options.maxHeight,
      );
      if (target.width !== image.width || target.height !== image.height) {
        image.resize(target.width, target.height);
      }
      image.quality = options.quality ?? 86;
      image.strip();
      if (options.format === "jpeg" && image.hasAlpha) {
        image.backgroundColor = magick.MagickColors.White;
        image.alpha(magick.AlphaAction.Remove);
      }
    }
    width = images[0].width;
    height = images[0].height;
    return preserveAnimation
      ? images.write(outputFormat, (written) => new Uint8Array(written))
      : images[0].write(outputFormat, (written) => new Uint8Array(written));
  });
  return {
    blob: new Blob([data], { type: mimeByOutput[options.format] }),
    width,
    height,
    sourceFormat: getFileExtension(file.name),
    outputFormat: options.format,
    usedAdvancedDecoder: true,
    animated: frameCount > 1,
  };
}

export async function convertImage(
  file: File,
  options: ImageConversionOptions,
): Promise<ImageConversionOutput> {
  const extension = getFileExtension(file.name);
  const canvasOutput = options.format === "jpeg" || options.format === "png" || options.format === "webp";
  if (browserReadableExtensions.has(extension) && canvasOutput && extension !== "gif") {
    try {
      return await canvasConvert(file, options);
    } catch {
      // Fall through to ImageMagick when the browser advertises but cannot
      // actually decode or encode the file (common with AVIF on older builds).
    }
  }
  return magickConvert(file, options);
}

export async function normalizeImageForBrowser(file: File): Promise<File> {
  const extension = getFileExtension(file.name);
  if (browserReadableExtensions.has(extension) && extension !== "avif") return file;
  const converted = await convertImage(file, { format: "png", quality: 92 });
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([converted.blob], `${baseName}.png`, {
    type: "image/png",
    lastModified: file.lastModified,
  });
}

export async function normalizeImagesForBrowser(files: File[]): Promise<File[]> {
  const results: File[] = [];
  for (const file of files) {
    if (!isExtendedImageFile(file)) continue;
    results.push(await normalizeImageForBrowser(file));
  }
  return results;
}
