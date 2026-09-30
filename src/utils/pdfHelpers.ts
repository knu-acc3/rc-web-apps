import { downloadBlob } from './exportHelpers';

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadPdfBlob(data: Uint8Array, filename: string): void {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}

export function formatFileSize(bytes: number, isEn: boolean): string {
  if (bytes === 0) return '0 B';
  const units = isEn
    ? ['B', 'KB', 'MB', 'GB']
    : ['Б', 'КБ', 'МБ', 'ГБ'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = (bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
}

let pdfjsWorkerReady = false;

export async function initPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjsWorkerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();
    pdfjsWorkerReady = true;
  }
  return pdfjs;
}

export async function loadPdfDocument(data: ArrayBuffer) {
  const pdfjs = await initPdfjs();
  // Slice to give pdfjs a copy — prevents it from transferring (detaching)
  // the caller's ArrayBuffer to the web worker.
  return pdfjs.getDocument({ data: data.slice(0) }).promise;
}

export async function renderPageToCanvas(
  pdfDoc: Awaited<ReturnType<typeof loadPdfDocument>>,
  pageNum: number,
  scale: number = 1.5,
): Promise<HTMLCanvasElement> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport, canvas } as Parameters<typeof page.render>[0]).promise;
  return canvas;
}

let unicodeFontBytesPromise: Promise<ArrayBuffer> | null = null;

export function loadUnicodeFontBytes(): Promise<ArrayBuffer> {
  unicodeFontBytesPromise ??= fetch('/fonts/NotoSans-Regular.ttf', { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load font (${res.status})`);
      return res.arrayBuffer();
    })
    .catch((err) => {
      unicodeFontBytesPromise = null;
      throw err;
    });
  return unicodeFontBytesPromise;
}

