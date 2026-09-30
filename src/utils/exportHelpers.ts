export type RasterExportFormat = 'png' | 'jpeg' | 'webp';

export function getExportMime(format: RasterExportFormat): string {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

export function getExportExtension(format: RasterExportFormat): string {
  if (format === 'jpeg') return 'jpg';
  return format;
}

export function buildExportFileName(baseName: string, format: RasterExportFormat): string {
  return `${baseName}.${getExportExtension(format)}`;
}

export function sanitizeDownloadFileName(fileName: string): string {
  const cleaned = fileName
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 180);
  if (!cleaned) return 'download';
  return /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(cleaned)
    ? `_${cleaned}`
    : cleaned;
}

export function triggerDownload(href: string, fileName: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = sanitizeDownloadFileName(fileName);
  link.rel = 'noopener';
  link.click();
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, fileName);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function escapeCsvCellForSpreadsheet(
  value: unknown,
  delimiter = ',',
): string {
  const raw = value === null || value === undefined ? '' : String(value);
  // Spreadsheet applications can execute cells beginning with formula sigils.
  // Prefixing a single quote keeps exported user data inert when opened.
  const safe = /^(?:[\t\r]|\s*[=+@-])/.test(raw) ? `'${raw}` : raw;
  return safe.includes(delimiter) || /["\r\n]/.test(safe) || /^\s|\s$/.test(safe)
    ? `"${safe.replace(/"/g, '""')}"`
    : safe;
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas export returned an empty blob.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  options: { baseName: string; format: RasterExportFormat; quality?: number },
): void {
  const { baseName, format, quality } = options;
  const mime = getExportMime(format);
  const fileName = buildExportFileName(baseName, format);
  const dataUrl = canvas.toDataURL(mime, quality);
  triggerDownload(dataUrl, fileName);
}
