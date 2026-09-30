/** Compression presets, shared by the tool and the page texts (plain module: safe on the server). */
export type CompressMode = "lossless" | "images" | "raster";
export type CompressLevel = "light" | "medium" | "strong";

/** Image re-encoding: JPEG quality and the longest image side in pixels. */
export const IMAGE_LEVELS: Record<CompressLevel, { quality: number; maxSide: number }> = {
  light: { quality: 0.8, maxSide: 2400 },
  medium: { quality: 0.65, maxSide: 1600 },
  strong: { quality: 0.45, maxSide: 1100 },
};

/** Page rasterisation: DPI and JPEG quality. */
export const RASTER_LEVELS: Record<CompressLevel, { dpi: number; quality: number }> = {
  light: { dpi: 150, quality: 0.75 },
  medium: { dpi: 110, quality: 0.6 },
  strong: { dpi: 80, quality: 0.5 },
};
