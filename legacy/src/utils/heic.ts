/**
 * HEIC/HEIF support helpers.
 *
 * Browsers (except Safari) cannot natively decode HEIC/HEIF, so we transparently
 * convert such files to JPEG before any tool consumes them.
 */

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

const HEIC_EXTENSIONS = /\.(heic|heif|heics|heifs)$/i;

export function isHeicFile(file: File): boolean {
  if (file.type && HEIC_MIME_TYPES.has(file.type.toLowerCase())) return true;
  return HEIC_EXTENSIONS.test(file.name);
}

export function hasAnyHeic(files: File[]): boolean {
  return files.some(isHeicFile);
}

export const HEIC_ACCEPT_FRAGMENT =
  'image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heif,.heics,.heifs';

/**
 * Decode a HEIC/HEIF file into a JPEG-backed File. The new file keeps the
 * original base name with a `.jpg` extension and `image/jpeg` MIME type so the
 * rest of the codebase can treat it as any other image.
 */
export async function heicToJpegFile(file: File, quality = 0.92): Promise<File> {
  const { heicTo } = await import('heic-to');
  const blob = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality,
  });
  const baseName = file.name.replace(HEIC_EXTENSIONS, '') || 'image';
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
}

/**
 * Walk an array of input files and replace any HEIC/HEIF entries with their
 * JPEG-decoded equivalents. Non-HEIC files pass through untouched. If decoding
 * fails for a particular file it is skipped (but other files are kept).
 */
export async function normalizeHeicFiles(files: File[]): Promise<File[]> {
  if (!hasAnyHeic(files)) return files;
  const out: File[] = [];
  for (const f of files) {
    if (!isHeicFile(f)) {
      out.push(f);
      continue;
    }
    try {
      out.push(await heicToJpegFile(f));
    } catch {
      // Skip files we cannot decode rather than aborting the whole batch.
    }
  }
  return out;
}
