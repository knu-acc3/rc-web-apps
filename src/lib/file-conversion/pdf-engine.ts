import { PDFDocument } from "pdf-lib";
import { convertImage } from "./image-engine";
import type { PdfConversionFormat } from "./types";
import { canvasToBlob } from "@/src/utils/exportHelpers";
import { loadPdfDocument, renderPageToCanvas } from "@/src/utils/pdfHelpers";

const pdfOutputMime: Record<PdfConversionFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const pdfOutputExtension: Record<PdfConversionFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

export async function convertPdfToImages(
  file: File,
  format: PdfConversionFormat,
  onProgress?: (progress: number) => void,
): Promise<{ blob: Blob; fileName: string; files: Array<{ blob: Blob; fileName: string }> }> {
  const document = await loadPdfDocument(await file.arrayBuffer());
  const baseName = file.name.replace(/\.pdf$/i, "") || "pdf";
  const files: Array<{ blob: Blob; fileName: string }> = [];
  try {
    for (let page = 1; page <= document.numPages; page += 1) {
      const canvas = await renderPageToCanvas(document, page, 1.75);
      const blob = await canvasToBlob(
        canvas,
        pdfOutputMime[format],
        format === "png" ? undefined : 0.9,
      );
      files.push({
        blob,
        fileName: `${baseName}-${String(page).padStart(3, "0")}.${pdfOutputExtension[format]}`,
      });
      onProgress?.(page / document.numPages);
    }
  } finally {
    await document.destroy();
  }
  if (files.length === 1) return { ...files[0], files };
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach((entry) => zip.file(entry.fileName, entry.blob));
  return {
    blob: await zip.generateAsync({ type: "blob", compression: "DEFLATE" }),
    fileName: `${baseName}-${pdfOutputExtension[format]}.zip`,
    files,
  };
}

export async function convertImageToPdf(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const converted = await convertImage(file, { format: "jpeg", quality: 92 });
  onProgress?.(0.65);
  const pdf = await PDFDocument.create();
  const image = await pdf.embedJpg(await converted.blob.arrayBuffer());
  const page = pdf.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  const bytes = await pdf.save();
  onProgress?.(1);
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
}

