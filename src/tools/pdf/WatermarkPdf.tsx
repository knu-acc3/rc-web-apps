'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  Drop,
  FileText,
  X,
} from '@phosphor-icons/react';
import { PDFDocument, degrees } from 'pdf-lib';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { PdfDropzone } from '@/src/components/ui/pdf-dropzone';
import { cn } from '@/src/lib/cn';
import {
  downloadPdfBlob,
  formatFileSize,
  loadPdfDocument,
  readFileAsArrayBuffer,
  renderPageToCanvas,
} from '@/src/utils/pdfHelpers';

type WatermarkPosition = 'center' | 'diagonal' | 'tile';

interface TextStamp {
  bytes: Uint8Array;
  aspect: number;
}

function parsePageRange(input: string, total: number): number[] {
  if (!input.trim()) return Array.from({ length: total }, (_, index) => index + 1);
  const result = new Set<number>();
  for (const token of input.split(',').map((part) => part.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Math.max(1, Number(range[1]));
      const end = Math.min(total, Number(range[2]));
      for (let page = start; page <= end; page += 1) result.add(page);
    } else if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page >= 1 && page <= total) result.add(page);
    }
  }
  return [...result].sort((a, b) => a - b);
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG encoding failed'));
        return;
      }
      blob.arrayBuffer()
        .then((buffer) => resolve(new Uint8Array(buffer)))
        .catch(reject);
    }, 'image/png');
  });
}

async function createUnicodeTextStamp(text: string, color: string, fontSize: number): Promise<TextStamp> {
  const scale = 2;
  const logicalSize = Math.max(18, fontSize);
  const font = `700 ${logicalSize}px Arial, "Helvetica Neue", sans-serif`;
  const measurementCanvas = document.createElement('canvas');
  const measurementContext = measurementCanvas.getContext('2d');
  if (!measurementContext) throw new Error('Canvas is unavailable');
  measurementContext.font = font;
  const textWidth = Math.ceil(measurementContext.measureText(text).width);
  const paddingX = Math.ceil(logicalSize * 0.5);
  const logicalWidth = Math.max(80, textWidth + paddingX * 2);
  const logicalHeight = Math.ceil(logicalSize * 1.65);

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  context.scale(scale, scale);
  context.font = font;
  context.fillStyle = /^#[0-9a-f]{6}$/i.test(color) ? color : '#6b7280';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, logicalWidth / 2, logicalHeight / 2);
  return {
    bytes: await canvasToPng(canvas),
    aspect: logicalWidth / logicalHeight,
  };
}

function centeredOrigin(
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number,
  angle: number
): { x: number; y: number } {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const xs = [0, imageWidth * cos, -imageHeight * sin, imageWidth * cos - imageHeight * sin];
  const ys = [0, imageWidth * sin, imageHeight * cos, imageWidth * sin + imageHeight * cos];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    x: (pageWidth - (maxX - minX)) / 2 - minX,
    y: (pageHeight - (maxY - minY)) / 2 - minY,
  };
}

export default function WatermarkPdf() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const previewAbortRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [previewImage, setPreviewImage] = useState('');
  const [watermarkText, setWatermarkText] = useState('');
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [color, setColor] = useState('#dc2626');
  const [opacity, setOpacity] = useState(0.22);
  const [fontSize, setFontSize] = useState(52);
  const [pageRange, setPageRange] = useState('');
  const [outputName, setOutputName] = useState('watermarked');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => () => {
    previewAbortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    previewAbortRef.current = true;
    setFile(null);
    setPdfData(null);
    setPageCount(0);
    setPreviewImage('');
    setPageRange('');
    setOutputName('watermarked');
    setError('');
    setSuccess('');
    window.setTimeout(() => {
      previewAbortRef.current = false;
    }, 0);
  }, []);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;
    previewAbortRef.current = false;
    setFile(nextFile);
    setPdfData(null);
    setPreviewImage('');
    setError('');
    setSuccess('');
    setOutputName(`${nextFile.name.replace(/\.pdf$/i, '')}_watermarked`);

    try {
      const buffer = await readFileAsArrayBuffer(nextFile);
      const document = await PDFDocument.load(buffer);
      setPdfData(buffer);
      setPageCount(document.getPageCount());

      try {
        const previewDocument = await loadPdfDocument(buffer.slice(0));
        try {
          const canvas = await renderPageToCanvas(previewDocument, 1, 0.72);
          if (!previewAbortRef.current) setPreviewImage(canvas.toDataURL('image/jpeg', 0.82));
        } finally {
          previewDocument.destroy();
        }
      } catch {
        // The PDF can still be watermarked when only the visual preview fails.
      }
    } catch (caughtError) {
      const encrypted = caughtError instanceof Error && /encrypt|password/i.test(caughtError.message);
      setFile(null);
      setPdfData(null);
      setError(encrypted
        ? isEn
          ? 'Password-protected PDFs cannot be edited in the browser.'
          : 'PDF с паролем нельзя изменить в браузере.'
        : isEn
          ? 'The PDF could not be opened.'
          : 'Не удалось открыть PDF.');
    }
  }, [isEn]);

  const addWatermark = useCallback(async () => {
    if (!pdfData || !file || !watermarkText.trim()) return;
    const selectedPages = parsePageRange(pageRange, pageCount);
    if (selectedPages.length === 0) {
      setError(isEn ? 'The page range is empty or invalid.' : 'Диапазон страниц пуст или указан неверно.');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const document = await PDFDocument.load(pdfData);
      const stamp = await createUnicodeTextStamp(watermarkText.trim(), color, fontSize);
      const image = await document.embedPng(stamp.bytes);
      const selected = new Set(selectedPages);

      document.getPages().forEach((page, index) => {
        if (!selected.has(index + 1)) return;
        const { width: pageWidth, height: pageHeight } = page.getSize();

        if (position === 'tile') {
          const imageWidth = Math.min(pageWidth * 0.34, fontSize * stamp.aspect * 1.25);
          const imageHeight = imageWidth / stamp.aspect;
          const stepX = Math.max(imageWidth * 1.45, pageWidth * 0.42);
          const stepY = Math.max(imageHeight * 3.2, pageHeight * 0.2);
          for (let y = -imageHeight; y < pageHeight + stepY; y += stepY) {
            for (let x = -imageWidth * 0.4; x < pageWidth + stepX; x += stepX) {
              page.drawImage(image, {
                x,
                y,
                width: imageWidth,
                height: imageHeight,
                opacity,
                rotate: degrees(-30),
              });
            }
          }
          return;
        }

        const imageWidth = Math.min(pageWidth * 0.78, fontSize * stamp.aspect * 1.35);
        const imageHeight = imageWidth / stamp.aspect;
        const angle = position === 'diagonal' ? -45 : 0;
        const origin = centeredOrigin(pageWidth, pageHeight, imageWidth, imageHeight, angle);
        page.drawImage(image, {
          ...origin,
          width: imageWidth,
          height: imageHeight,
          opacity,
          rotate: degrees(angle),
        });
      });

      document.setModificationDate(new Date());
      const bytes = await document.save();
      const filename = `${(outputName.trim() || `${file.name.replace(/\.pdf$/i, '')}_watermarked`).replace(/\.pdf$/i, '')}.pdf`;
      downloadPdfBlob(bytes, filename);
      setSuccess(isEn ? 'Watermarked PDF saved.' : 'PDF с водяным знаком сохранён.');
    } catch (caughtError) {
      const encrypted = caughtError instanceof Error && /encrypt|password/i.test(caughtError.message);
      setError(encrypted
        ? isEn
          ? 'Password-protected PDFs cannot be edited.'
          : 'PDF с паролем нельзя изменить.'
        : isEn
          ? 'The watermark could not be added.'
          : 'Не удалось добавить водяной знак.');
    } finally {
      setProcessing(false);
    }
  }, [color, file, fontSize, isEn, opacity, outputName, pageCount, pageRange, pdfData, position, watermarkText]);

  const positionOptions: Array<{ value: WatermarkPosition; en: string; ru: string }> = [
    { value: 'center', en: 'Center', ru: 'По центру' },
    { value: 'diagonal', en: 'Diagonal', ru: 'Диагональ' },
    { value: 'tile', en: 'Repeat', ru: 'Повтор' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      {!file ? (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={75}
          label="Перетащите PDF или нажмите для загрузки"
          labelEn="Drag & drop a PDF or click to upload"
        />
      ) : null}

      {error ? (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span className="flex-1">{error}</span>
          <button type="button" className="min-h-11 min-w-11" onClick={() => setError('')} aria-label={isEn ? 'Dismiss' : 'Закрыть'}>
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      {file && !pdfData && !error ? (
        <Card role="status" className="mt-4 p-4 text-sm text-[var(--color-text-muted)]">
          {isEn ? 'Opening PDF…' : 'Открываем PDF…'}
        </Card>
      ) : null}

      {file && pdfData ? (
        <div className="mt-4 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <FileText size={26} className="shrink-0 text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold" title={file.name}>{file.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(file.size, isEn)} · {pageCount} {isEn ? (pageCount === 1 ? 'page' : 'pages') : 'стр.'}
                </div>
              </div>
              <Button variant="outline" size="sm" className="min-h-11 min-w-11" onClick={reset}>
                <ArrowCounterClockwise size={17} />
                <span className="hidden sm:inline">{isEn ? 'New file' : 'Другой файл'}</span>
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <Label htmlFor="watermark-text">{isEn ? 'Watermark text' : 'Текст водяного знака'}</Label>
            <Input
              id="watermark-text"
              className="mt-1.5 h-12 text-base"
              value={watermarkText}
              maxLength={120}
              onChange={(event) => {
                setWatermarkText(event.target.value);
                setSuccess('');
              }}
              placeholder={isEn ? 'Enter watermark text' : 'Введите текст водяного знака'}
              autoFocus
            />

            <div className="mt-4">
              <div className="mb-1.5 text-sm font-medium">{isEn ? 'Position' : 'Позиция'}</div>
              <div role="radiogroup" className="grid grid-cols-3 gap-2">
                {positionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={position === option.value}
                    onClick={() => {
                      setPosition(option.value);
                      setSuccess('');
                    }}
                    className={cn(
                      'min-h-11 rounded-[var(--radius-md)] border px-2 text-sm font-semibold transition-colors',
                      position === option.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]'
                    )}
                  >
                    {isEn ? option.en : option.ru}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-sm font-medium">{isEn ? 'Live preview' : 'Живой предпросмотр'}</div>
              <div className="relative mx-auto max-w-[430px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImage} alt={isEn ? 'First PDF page' : 'Первая страница PDF'} className="block h-auto w-full" />
                ) : (
                  <div className="aspect-[3/4] animate-pulse bg-[var(--color-surface-muted)]" />
                )}
                {position === 'tile' ? (
                  <div className="pointer-events-none absolute inset-0 grid grid-cols-2 place-items-center overflow-hidden p-3">
                    {Array.from({ length: 6 }, (_, index) => (
                      <span
                        key={index}
                        className="max-w-full -rotate-[30deg] truncate whitespace-nowrap font-bold"
                        style={{ color, opacity, fontSize: `${Math.max(12, fontSize * 0.34)}px` }}
                      >
                        {watermarkText || ' '}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-[88%] truncate whitespace-nowrap font-bold"
                    style={{
                      color,
                      opacity,
                      fontSize: `${Math.max(15, fontSize * 0.46)}px`,
                      transform: `translate(-50%, -50%) rotate(${position === 'diagonal' ? -45 : 0}deg)`,
                    }}
                  >
                    {watermarkText || ' '}
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-center text-xs text-[var(--color-text-muted)]">
                {isEn ? 'Preview uses page 1. Cyrillic and other Unicode text is embedded as a transparent image.' : 'Показана страница 1. Кириллица и другой Unicode встраиваются как прозрачное изображение.'}
              </div>
            </div>

            <Button
              size="lg"
              className="tool-primary-action mt-5 min-h-12 w-full"
              onClick={addWatermark}
              disabled={processing || !watermarkText.trim()}
            >
              <Drop size={20} weight="fill" />
              {processing
                ? isEn ? 'Adding…' : 'Добавление…'
                : isEn ? 'Add watermark' : 'Добавить водяной знак'}
            </Button>
          </Card>

          <AdvancedSettings
            title={isEn ? 'Appearance and pages' : 'Внешний вид и страницы'}
            description={isEn ? 'Color, opacity, size, page range and filename' : 'Цвет, прозрачность, размер, диапазон и имя файла'}
          >
            <div className="space-y-4">
              <div>
                <Label>{isEn ? 'Color' : 'Цвет'}</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    className="h-11 w-16 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-transparent p-1"
                    value={/^#[\da-f]{6}$/i.test(color) ? color : '#dc2626'}
                    onChange={(event) => setColor(event.target.value)}
                    aria-label={isEn ? 'Watermark color' : 'Цвет знака'}
                  />
                  <Input className="max-w-36 font-mono" value={color} onChange={(event) => setColor(event.target.value)} />
                </div>
              </div>
              <label className="block text-sm">
                <span className="font-medium">{isEn ? 'Opacity' : 'Прозрачность'}: {Math.round(opacity * 100)}%</span>
                <input className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0.05} max={0.75} step={0.05} value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{isEn ? 'Text size' : 'Размер текста'}: {fontSize} pt</span>
                <input className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={20} max={100} step={2} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
              </label>
              <div>
                <Label htmlFor="watermark-range">{isEn ? 'Pages' : 'Страницы'}</Label>
                <Input
                  id="watermark-range"
                  className="mt-1.5"
                  value={pageRange}
                  onChange={(event) => setPageRange(event.target.value)}
                  placeholder={isEn ? `All pages, or 1, 3-5 (1–${pageCount})` : `Все страницы или 1, 3-5 (1–${pageCount})`}
                />
              </div>
              <div>
                <Label htmlFor="watermark-output">{isEn ? 'Output filename' : 'Имя результата'}</Label>
                <Input id="watermark-output" className="mt-1.5" value={outputName} onChange={(event) => setOutputName(event.target.value)} />
              </div>
            </div>
          </AdvancedSettings>

          {success ? (
            <div role="status" className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]">
              <CheckCircle size={20} weight="fill" /> {success}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
