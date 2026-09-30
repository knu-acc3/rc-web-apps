'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CaretLeft,
  CaretRight,
  ArrowCounterClockwise,
  FileText,
  Eye,
  Scribble,
  TextT,
  HighlighterCircle,
  FloppyDisk,
  Eraser,
  Warning,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { PdfDropzone } from '@/src/components/ui/pdf-dropzone';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import {
  readFileAsArrayBuffer,
  downloadPdfBlob,
  formatFileSize,
  loadPdfDocument,
  renderPageToCanvas,
  initPdfjs,
  loadUnicodeFontBytes,
} from '@/src/utils/pdfHelpers';
import { cn } from '@/src/lib/cn';
import type { PDFFont } from 'pdf-lib';

type AnnotationMode = 'view' | 'draw' | 'text' | 'highlight';
type LineWidth = 'thin' | 'medium' | 'thick';

interface TextAnnotation {
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

const LINE_WIDTHS: Record<LineWidth, number> = { thin: 2, medium: 4, thick: 8 };

const DRAW_COLORS = [
  '#000000', '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
];

const HIGHLIGHT_COLOR = 'rgba(255, 235, 59, 0.35)';

export default function PdfStudio() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfDoc, setPdfDoc] = useState<Awaited<ReturnType<typeof loadPdfDocument>> | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<AnnotationMode>('view');

  const [drawColor, setDrawColor] = useState('#E53935');
  const [drawWidth, setDrawWidth] = useState<LineWidth>('medium');

  const drawingDataRef = useRef<Map<number, ImageData>>(new Map());
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);

  const [textInput, setTextInput] = useState('');
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
  const [textFontSize, setTextFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');

  const highlightStartRef = useRef<{ x: number; y: number } | null>(null);

  const [processing, setProcessing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pageInput, setPageInput] = useState('');

  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const pageRendering = useRef(false);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    try {
      const buf = await readFileAsArrayBuffer(f);
      setPdfData(buf);
      await initPdfjs();
      const doc = await loadPdfDocument(buf.slice(0));
      setPdfDoc(doc);
      const count = doc.numPages;
      setPageCount(count);
      setCurrentPage(1);
      setZoom(100);
      setMode('view');
      setTextAnnotations([]);
      drawingDataRef.current = new Map();
    } catch {
      setFile(null);
      setPdfData(null);
    }
  }, []);

  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !pdfCanvasRef.current || pageRendering.current) return;
    pageRendering.current = true;

    try {
      const scale = (zoom / 100) * 1.5;
      const rendered = await renderPageToCanvas(pdfDoc, currentPage, scale);

      const pdfCanvas = pdfCanvasRef.current;
      pdfCanvas.width = rendered.width;
      pdfCanvas.height = rendered.height;
      const ctx = pdfCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(rendered, 0, 0);
      }

      const overlay = overlayCanvasRef.current;
      if (overlay) {
        if (overlay.width > 0 && overlay.height > 0) {
          const overlayCtx = overlay.getContext('2d');
          if (overlayCtx) {
            try {
              const imgData = overlayCtx.getImageData(0, 0, overlay.width, overlay.height);
              drawingDataRef.current.set(currentPage, imgData);
            } catch { /* empty canvas */ }
          }
        }

        overlay.width = rendered.width;
        overlay.height = rendered.height;

        const saved = drawingDataRef.current.get(currentPage);
        if (saved) {
          const overlayCtx = overlay.getContext('2d');
          if (overlayCtx) {
            if (saved.width === overlay.width && saved.height === overlay.height) {
              overlayCtx.putImageData(saved, 0, 0);
            }
          }
        }
      }
    } finally {
      pageRendering.current = false;
    }
  }, [pdfDoc, currentPage, zoom]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  const saveCurrentOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay || overlay.width === 0) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    try {
      const imgData = ctx.getImageData(0, 0, overlay.width, overlay.height);
      drawingDataRef.current.set(currentPage, imgData);
    } catch { /* ignore */ }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > pageCount || page === currentPage) return;
    saveCurrentOverlay();
    setTextInputPos(null);
    setCurrentPage(page);
  }, [pageCount, currentPage, saveCurrentOverlay]);

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(z - 25, 50));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDoc) return;
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'v' || e.key === 'V') {
        setMode('view'); setTextInputPos(null);
      } else if (e.key === 'd' || e.key === 'D') {
        setMode('draw'); setTextInputPos(null);
      } else if (e.key === 't' || e.key === 'T') {
        setMode('text'); setTextInputPos(null);
      } else if (e.key === 'h' || e.key === 'H') {
        setMode('highlight'); setTextInputPos(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, currentPage, goToPage]);

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'draw' && mode !== 'highlight') return;
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    e.preventDefault();

    const { x, y } = getCanvasPos(e, overlay);

    if (mode === 'draw') {
      drawingRef.current = true;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = LINE_WIDTHS[drawWidth];
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    } else if (mode === 'highlight') {
      drawingRef.current = true;
      highlightStartRef.current = { x, y };
    }
  }, [mode, drawColor, drawWidth, getCanvasPos]);

  const continueDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    e.preventDefault();

    const { x, y } = getCanvasPos(e, overlay);

    if (mode === 'draw') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [mode, getCanvasPos]);

  const stopDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;

    if (mode === 'highlight' && highlightStartRef.current) {
      const overlay = overlayCanvasRef.current;
      if (!overlay) return;
      const ctx = overlay.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCanvasPos(e, overlay);
      const start = highlightStartRef.current;
      const rectX = Math.min(start.x, x);
      const rectY = Math.min(start.y, y);
      const rectW = Math.abs(x - start.x);
      const rectH = Math.abs(y - start.y);

      if (rectW > 2 && rectH > 2) {
        ctx.fillStyle = HIGHLIGHT_COLOR;
        ctx.fillRect(rectX, rectY, rectW, rectH);
      }
      highlightStartRef.current = null;
    }
  }, [mode, getCanvasPos]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'text') return;
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const { x, y } = getCanvasPos(e, overlay);
    setTextInputPos({ x, y });
    setTextInput('');
  }, [mode, getCanvasPos]);

  const commitTextAnnotation = useCallback(() => {
    if (!textInputPos || !textInput.trim()) {
      setTextInputPos(null);
      setTextInput('');
      return;
    }
    setTextAnnotations(prev => [...prev, {
      page: currentPage,
      x: textInputPos.x,
      y: textInputPos.y,
      text: textInput.trim(),
      fontSize: textFontSize,
      color: textColor,
    }]);

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) {
        ctx.font = `${textFontSize * (zoom / 100) * 1.5}px sans-serif`;
        ctx.fillStyle = textColor;
        ctx.fillText(textInput.trim(), textInputPos.x, textInputPos.y);
      }
    }

    setTextInputPos(null);
    setTextInput('');
  }, [textInputPos, textInput, currentPage, textFontSize, textColor, zoom]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commitTextAnnotation();
    } else if (e.key === 'Escape') {
      setTextInputPos(null);
      setTextInput('');
    }
  }, [commitTextAnnotation]);

  const handleSave = useCallback(async () => {
    if (!pdfData || !file) return;
    setProcessing(true);

    try {
      saveCurrentOverlay();

      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(pdfData, { ignoreEncryption: true });

      const pageEntries = Array.from(drawingDataRef.current.entries());
      for (const [pageNum, imgData] of pageEntries) {
        let hasContent = false;
        for (let i = 3; i < imgData.data.length; i += 4) {
          if (imgData.data[i] > 0) { hasContent = true; break; }
        }
        if (!hasContent) continue;

        const offscreen = document.createElement('canvas');
        offscreen.width = imgData.width;
        offscreen.height = imgData.height;
        const offCtx = offscreen.getContext('2d')!;
        offCtx.putImageData(imgData, 0, 0);

        const blob = await new Promise<Blob>((resolve) => {
          offscreen.toBlob((b) => resolve(b!), 'image/png');
        });
        const arrBuf = await blob.arrayBuffer();
        const pngImage = await doc.embedPng(new Uint8Array(arrBuf));

        const pageIdx = pageNum - 1;
        if (pageIdx >= 0 && pageIdx < doc.getPageCount()) {
          const page = doc.getPage(pageIdx);
          const { width: pageWidth, height: pageHeight } = page.getSize();
          page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
          });
        }
      }

      let unicodeFont: PDFFont | null = null;
      try {
        const fontkitModule = await import('@pdf-lib/fontkit');
        const fontkit = fontkitModule.default || fontkitModule;
        doc.registerFontkit(fontkit);
        const fontBytes = await loadUnicodeFontBytes();
        unicodeFont = await doc.embedFont(fontBytes, { subset: true });
      } catch {
        unicodeFont = null;
      }

      for (const ann of textAnnotations) {
        const pageIdx = ann.page - 1;
        if (pageIdx < 0 || pageIdx >= doc.getPageCount()) continue;
        const page = doc.getPage(pageIdx);
        const { height: pageHeight, width: pageWidth } = page.getSize();

        const renderScale = (zoom / 100) * 1.5;
        const pdfX = ann.x / renderScale;
        const pdfY = pageHeight - (ann.y / renderScale);

        let drew = false;
        if (unicodeFont) {
          try {
            const { rgb } = await import('pdf-lib');
            const hex = ann.color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            page.drawText(ann.text, {
              x: Math.max(0, Math.min(pdfX, pageWidth - 10)),
              y: Math.max(10, Math.min(pdfY, pageHeight - 10)),
              size: ann.fontSize,
              font: unicodeFont,
              color: rgb(r, g, b),
            });
            drew = true;
          } catch {
            drew = false;
          }
        }

        if (!drew) {
          // Robust Canvas stamp fallback - supports ANY unicode text, cyrillic, emojis
          const textCanvas = document.createElement('canvas');
          const scale = 2;
          const ctx = textCanvas.getContext('2d')!;
          const fontStr = `${ann.fontSize * scale}px Arial, "Helvetica Neue", sans-serif`;
          ctx.font = fontStr;
          const metrics = ctx.measureText(ann.text);
          const w = Math.max(20, Math.ceil(metrics.width) + 12);
          const h = Math.max(20, Math.ceil(ann.fontSize * scale * 1.4));
          textCanvas.width = w;
          textCanvas.height = h;
          ctx.font = fontStr;
          ctx.fillStyle = ann.color;
          ctx.textBaseline = 'top';
          ctx.fillText(ann.text, 6, 2);

          const blob = await new Promise<Blob>((resolve) => textCanvas.toBlob((b) => resolve(b!), 'image/png'));
          const imgBuf = await blob.arrayBuffer();
          const embeddedImg = await doc.embedPng(new Uint8Array(imgBuf));
          page.drawImage(embeddedImg, {
            x: Math.max(0, Math.min(pdfX, pageWidth - 10)),
            y: Math.max(10, Math.min(pdfY - (h / scale), pageHeight - 10)),
            width: w / scale,
            height: h / scale,
          });
        }
      }

      const savedBytes = await doc.save();
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadPdfBlob(savedBytes, `${baseName}_annotated.pdf`);
      setSaveError('');
    } catch (err) {
      setSaveError(
        isEn
          ? `Failed to save: ${(err as Error).message || 'unknown error'}`
          : `Не удалось сохранить: ${(err as Error).message || 'неизвестная ошибка'}`
      );
    } finally {
      setProcessing(false);
    }
  }, [pdfData, file, textAnnotations, zoom, saveCurrentOverlay, isEn]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPdfData(null);
    setPdfDoc(null);
    setPageCount(0);
    setCurrentPage(1);
    setZoom(100);
    setMode('view');
    setTextAnnotations([]);
    setTextInputPos(null);
    setTextInput('');
    setSaveError('');
    setPageInput('');
    drawingDataRef.current = new Map();
  }, []);

  const handleClearCurrentPage = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const ctx = overlay.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
    drawingDataRef.current.delete(currentPage);
    setTextAnnotations((prev) => prev.filter((a) => a.page !== currentPage));
    setTextInputPos(null);
  }, [currentPage]);

  const handlePageJump = useCallback(() => {
    const n = parseInt(pageInput, 10);
    if (Number.isFinite(n) && n >= 1 && n <= pageCount) {
      goToPage(n);
      setPageInput('');
    }
  }, [pageInput, pageCount, goToPage]);

  const annotationStats = useMemo(() => {
    const textOnPage = textAnnotations.filter((a) => a.page === currentPage).length;
    let strokeOnPage = 0;
    const saved = drawingDataRef.current.get(currentPage);
    if (saved) {
      for (let i = 3; i < saved.data.length; i += 4) {
        if (saved.data[i] > 0) { strokeOnPage = 1; break; }
      }
    } else {
      const overlay = overlayCanvasRef.current;
      if (overlay && overlay.width > 0) {
        try {
          const ctx = overlay.getContext('2d');
          if (ctx) {
            const img = ctx.getImageData(0, 0, overlay.width, overlay.height);
            for (let i = 3; i < img.data.length; i += 4) {
              if (img.data[i] > 0) { strokeOnPage = 1; break; }
            }
          }
        } catch { /* ignore */ }
      }
    }
    return {
      textOnPage,
      hasStrokesOnPage: strokeOnPage > 0,
      textTotal: textAnnotations.length,
    };
  }, [textAnnotations, currentPage]);

  const pagesLabel = (count: number) => {
    if (isEn) return count === 1 ? 'page' : 'pages';
    if (count === 1) return 'страница';
    if (count >= 2 && count <= 4) return 'страницы';
    return 'страниц';
  };

  const modeOptions: { value: AnnotationMode; labelEn: string; labelRu: string; icon: React.ReactNode }[] = [
    { value: 'view', labelEn: 'View', labelRu: 'Просмотр', icon: <Eye size={14} /> },
    { value: 'draw', labelEn: 'Draw', labelRu: 'Рисование', icon: <Scribble size={14} /> },
    { value: 'text', labelEn: 'Text', labelRu: 'Текст', icon: <TextT size={14} /> },
    { value: 'highlight', labelEn: 'Highlight', labelRu: 'Выделение', icon: <HighlighterCircle size={14} /> },
  ];

  const lineWidthOptions: { value: LineWidth; labelEn: string; labelRu: string }[] = [
    { value: 'thin', labelEn: 'Thin', labelRu: 'Тонкая' },
    { value: 'medium', labelEn: 'Medium', labelRu: 'Средняя' },
    { value: 'thick', labelEn: 'Thick', labelRu: 'Толстая' },
  ];

  const getCursorStyle = (): string => {
    switch (mode) {
      case 'draw': return 'crosshair';
      case 'text': return 'text';
      case 'highlight': return 'crosshair';
      default: return 'default';
    }
  };

  const getTextInputScreenPos = useCallback(() => {
    if (!textInputPos || !overlayCanvasRef.current || !containerRef.current) return null;
    const overlay = overlayCanvasRef.current;
    const rect = overlay.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / overlay.width;
    const scaleY = rect.height / overlay.height;
    return {
      left: (textInputPos.x * scaleX) + (rect.left - containerRect.left),
      top: (textInputPos.y * scaleY) + (rect.top - containerRect.top),
    };
  }, [textInputPos]);

  const chipBase = 'inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-2 text-xs font-semibold transition-colors';
  const chipActive = 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]';
  const chipInactive = 'border-[var(--color-border-strong)] text-[var(--color-text-muted)]';

  return (
    <div className="mx-auto max-w-5xl">
      {!file && (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={100}
          supportPaste={false}
        />
      )}

      {file && pdfDoc && (
        <>
          <Card className="mt-3 p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-3">
              <FileText size={20} className="shrink-0 text-[var(--color-primary)]" />
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold">
                  {file.name}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {formatFileSize(file.size, isEn)} &bull; {pageCount} {pagesLabel(pageCount)}
                </div>
              </div>
              <Button variant="outline" onClick={handleReset}>
                <ArrowCounterClockwise size={16} />
                {isEn ? 'New file' : 'Новый файл'}
              </Button>
            </div>
          </Card>

          <Card className="mt-2 p-3 sm:p-4">
            <div className={cn('flex flex-wrap items-center gap-2', (mode === 'draw' || mode === 'text') && 'mb-3')}>
              <span className="mr-1 text-xs text-[var(--color-text-muted)]">
                {isEn ? 'Mode:' : 'Режим:'}
              </span>
              {modeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setMode(opt.value); setTextInputPos(null); }}
                  className={cn(chipBase, mode === opt.value ? chipActive : chipInactive)}
                >
                  {opt.icon}
                  {isEn ? opt.labelEn : opt.labelRu}
                </button>
              ))}
            </div>

            {mode === 'draw' && (
              <>
                <div className="my-3 h-px bg-[var(--color-border)]" />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="mr-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'Color:' : 'Цвет:'}
                    </span>
                    {DRAW_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDrawColor(color)}
                        className="h-11 w-11 rounded-full transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: color,
                          border: drawColor === color
                            ? '2.5px solid var(--color-primary)'
                            : '2px solid color-mix(in oklab, var(--color-border) 30%, transparent)',
                        }}
                        aria-label={color}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="mr-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'Width:' : 'Толщина:'}
                    </span>
                    {lineWidthOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDrawWidth(opt.value)}
                        className={cn(chipBase, drawWidth === opt.value ? chipActive : chipInactive)}
                      >
                        {isEn ? opt.labelEn : opt.labelRu}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {mode === 'text' && (
              <>
                <div className="my-3 h-px bg-[var(--color-border)]" />
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="mr-1 text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'Color:' : 'Цвет:'}
                    </span>
                    {DRAW_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTextColor(color)}
                        className="h-11 w-11 rounded-full transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: color,
                          border: textColor === color
                            ? '2.5px solid var(--color-primary)'
                            : '2px solid color-mix(in oklab, var(--color-border) 30%, transparent)',
                        }}
                        aria-label={color}
                      />
                    ))}
                  </div>

                  <div className="flex min-w-[140px] items-center gap-2">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {isEn ? 'Size:' : 'Размер:'} {textFontSize}px
                    </span>
                    <input
                      type="range"
                      value={textFontSize}
                      onChange={(e) => setTextFontSize(parseInt(e.target.value, 10))}
                      min={10}
                      max={48}
                      step={2}
                      className="max-w-[120px] flex-1 accent-[var(--color-primary)]"
                    />
                  </div>

                  <span className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? 'Click on the page to place text' : 'Нажмите на страницу для размещения текста'}
                  </span>
                </div>
              </>
            )}

            {mode === 'highlight' && (
              <>
                <div className="my-3 h-px bg-[var(--color-border)]" />
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? 'Click and drag to highlight an area'
                    : 'Нажмите и потяните для выделения области'}
                </div>
              </>
            )}
          </Card>

          <Card className="mt-2 p-2 sm:p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  aria-label={isEn ? 'Previous page' : 'Предыдущая страница'}
                >
                  <CaretLeft size={18} />
                </Button>
                <span className="px-2 text-sm font-medium">
                  {isEn
                    ? `Page ${currentPage} of ${pageCount}`
                    : `Стр. ${currentPage} из ${pageCount}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  aria-label={isEn ? 'Next page' : 'Следующая страница'}
                >
                  <CaretRight size={18} />
                </Button>
              </div>
              <Button
                size="lg"
                onClick={handleSave}
                disabled={processing}
                className="tool-primary-action w-full sm:w-auto"
              >
                <FloppyDisk size={16} />
                {processing
                  ? (isEn ? 'Saving...' : 'Сохранение...')
                  : (isEn ? 'Save PDF' : 'Сохранить PDF')}
              </Button>
            </div>

            <AdvancedSettings
              title={isEn ? 'View and page tools' : 'Просмотр и страницы'}
              description={isEn ? 'Zoom, page jump and clearing annotations' : 'Масштаб, переход и очистка аннотаций'}
              className="mt-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                {pageCount > 5 ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handlePageJump(); }}
                    className="flex items-center gap-1"
                  >
                    <Input
                      type="number"
                      min={1}
                      max={pageCount}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      placeholder={isEn ? 'Page' : 'Страница'}
                      className="h-11 w-20 text-xs"
                      aria-label={isEn ? 'Jump to page' : 'Перейти на страницу'}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="md"
                      disabled={!pageInput.trim() || parseInt(pageInput, 10) < 1 || parseInt(pageInput, 10) > pageCount}
                      className="h-11 px-3 text-xs"
                    >
                      {isEn ? 'Go' : 'Перейти'}
                    </Button>
                  </form>
                ) : <span />}

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 50} aria-label={isEn ? 'Zoom out' : 'Уменьшить масштаб'}>
                    <MagnifyingGlassMinus size={18} />
                  </Button>
                  <span className="min-w-12 text-center text-sm font-medium">{zoom}%</span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 300} aria-label={isEn ? 'Zoom in' : 'Увеличить масштаб'}>
                    <MagnifyingGlassPlus size={18} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {(annotationStats.textOnPage > 0 || annotationStats.hasStrokesOnPage) && (
                    <span className="rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                      {isEn
                        ? `${annotationStats.textOnPage} text${annotationStats.hasStrokesOnPage ? ' · ✎' : ''}`
                        : `${annotationStats.textOnPage} текст${annotationStats.hasStrokesOnPage ? ' · ✎' : ''}`}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleClearCurrentPage}
                    disabled={!annotationStats.textOnPage && !annotationStats.hasStrokesOnPage}
                    className="text-[var(--color-danger)]"
                  >
                    <Eraser size={14} />
                    {isEn ? 'Clear page' : 'Очистить'}
                  </Button>
                </div>
              </div>
            </AdvancedSettings>
            {saveError && (
              <div
                className="mt-2 flex items-start gap-2 rounded-[var(--radius-md)] border p-2 text-xs"
                role="alert"
                style={{
                  background: 'var(--color-danger-soft)',
                  color: 'var(--color-danger)',
                  borderColor: 'color-mix(in oklab, var(--color-danger) 30%, transparent)',
                }}
              >
                <Warning size={14} weight="fill" className="mt-0.5 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}
          </Card>

          <Card className="mt-2 overflow-hidden bg-[var(--color-surface-muted)]">
            <div
              ref={containerRef}
              className="relative flex max-h-[70vh] justify-center overflow-auto p-2 sm:p-4"
            >
              <div className="relative inline-block">
                <canvas
                  ref={pdfCanvasRef}
                  style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />

                <canvas
                  ref={overlayCanvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={startDrawing}
                  onMouseMove={continueDrawing}
                  onMouseUp={stopDrawing}
                  onMouseLeave={(e) => { if (drawingRef.current) stopDrawing(e); }}
                  onTouchStart={startDrawing}
                  onTouchMove={continueDrawing}
                  onTouchEnd={stopDrawing}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: getCursorStyle(),
                    touchAction: mode !== 'view' ? 'none' : 'auto',
                  }}
                />

                {textInputPos && mode === 'text' && (() => {
                  const screenPos = getTextInputScreenPos();
                  if (!screenPos) return null;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: screenPos.left,
                        top: screenPos.top,
                        zIndex: 10,
                        transform: 'translate(0, -100%)',
                      }}
                    >
                      <div className="flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-pop)]">
                        <Input
                          autoFocus
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          onKeyDown={handleTextKeyDown}
                          onBlur={commitTextAnnotation}
                          placeholder={isEn ? 'Type text...' : 'Введите текст...'}
                          className="h-11 min-w-[180px]"
                          style={{ fontSize: textFontSize, color: textColor }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>

        </>
      )}
    </div>
  );
}
