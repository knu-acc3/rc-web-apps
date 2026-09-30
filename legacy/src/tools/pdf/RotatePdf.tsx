'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowClockwise,
  CheckCircle,
  FileText,
  ImageSquare,
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

interface PagePreview {
  pageNumber: number;
  thumbnail: string | null;
}

function normalizeRotation(value: number): number {
  return ((value % 360) + 360) % 360;
}

function parseRange(value: string, total: number): number[] {
  const pages = new Set<number>();
  for (const token of value.split(',').map((part) => part.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Math.max(1, Number(range[1]));
      const end = Math.min(total, Number(range[2]));
      for (let page = start; page <= end; page += 1) pages.add(page);
      continue;
    }
    if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page >= 1 && page <= total) pages.add(page);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export default function RotatePdf() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const abortRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [rangeInput, setRangeInput] = useState('');
  const [outputName, setOutputName] = useState('rotated');
  const [renderedCount, setRenderedCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => () => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setFile(null);
    setPdfData(null);
    setPages([]);
    setSelectedPages(new Set());
    setRotations({});
    setRangeInput('');
    setOutputName('rotated');
    setRenderedCount(0);
    setError('');
    setSuccess('');
    window.setTimeout(() => {
      abortRef.current = false;
    }, 0);
  }, []);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const nextFile = files[0];
    if (!nextFile) return;

    abortRef.current = false;
    setFile(nextFile);
    setPdfData(null);
    setPages([]);
    setRotations({});
    setRenderedCount(0);
    setError('');
    setSuccess('');
    setOutputName(`${nextFile.name.replace(/\.pdf$/i, '')}_rotated`);

    try {
      const buffer = await readFileAsArrayBuffer(nextFile);
      const document = await PDFDocument.load(buffer);
      const pageCount = document.getPageCount();
      const initialPages = Array.from({ length: pageCount }, (_, index) => ({
        pageNumber: index + 1,
        thumbnail: null,
      }));
      setPdfData(buffer);
      setPages(initialPages);
      setSelectedPages(new Set(initialPages.map((page) => page.pageNumber)));

      try {
        const previewDocument = await loadPdfDocument(buffer.slice(0));
        try {
          for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
            if (abortRef.current) break;
            try {
              const canvas = await renderPageToCanvas(previewDocument, pageNumber, 0.34);
              const thumbnail = canvas.toDataURL('image/jpeg', 0.72);
              setPages((current) => current.map((page) =>
                page.pageNumber === pageNumber ? { ...page, thumbnail } : page
              ));
            } catch {
              // Keep the page selectable even when a thumbnail cannot be rendered.
            } finally {
              setRenderedCount(pageNumber);
            }
          }
        } finally {
          previewDocument.destroy();
        }
      } catch {
        setRenderedCount(pageCount);
      }
    } catch (caughtError) {
      const encrypted = caughtError instanceof Error && /encrypt|password/i.test(caughtError.message);
      setFile(null);
      setPdfData(null);
      setError(encrypted
        ? isEn
          ? 'Password-protected PDFs cannot be rotated in the browser.'
          : 'PDF с паролем нельзя повернуть в браузере.'
        : isEn
          ? 'The PDF could not be opened.'
          : 'Не удалось открыть PDF.');
    }
  }, [isEn]);

  const selectedCount = selectedPages.size;
  const changedCount = useMemo(
    () => Object.values(rotations).filter((rotation) => rotation !== 0).length,
    [rotations]
  );

  const togglePage = useCallback((pageNumber: number) => {
    setSuccess('');
    setSelectedPages((current) => {
      const next = new Set(current);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  }, []);

  const rotateSelected = useCallback((delta: -90 | 90) => {
    if (selectedPages.size === 0) {
      setError(isEn ? 'Select at least one page.' : 'Выберите хотя бы одну страницу.');
      return;
    }
    setError('');
    setSuccess('');
    setRotations((current) => {
      const next = { ...current };
      for (const pageNumber of selectedPages) {
        next[pageNumber] = normalizeRotation((next[pageNumber] ?? 0) + delta);
      }
      return next;
    });
  }, [isEn, selectedPages]);

  const selectPreset = useCallback((kind: 'all' | 'none' | 'odd' | 'even' | 'range') => {
    const pageNumbers = pages.map((page) => page.pageNumber);
    if (kind === 'none') {
      setSelectedPages(new Set());
      return;
    }
    if (kind === 'range') {
      setSelectedPages(new Set(parseRange(rangeInput, pages.length)));
      return;
    }
    setSelectedPages(new Set(pageNumbers.filter((pageNumber) =>
      kind === 'all' || (kind === 'odd' ? pageNumber % 2 === 1 : pageNumber % 2 === 0)
    )));
  }, [pages, rangeInput]);

  const savePdf = useCallback(async () => {
    if (!pdfData || !file) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const document = await PDFDocument.load(pdfData);
      document.getPages().forEach((page, index) => {
        const addedRotation = rotations[index + 1] ?? 0;
        if (addedRotation === 0) return;
        page.setRotation(degrees(normalizeRotation(page.getRotation().angle + addedRotation)));
      });
      const bytes = await document.save();
      const filename = `${(outputName.trim() || `${file.name.replace(/\.pdf$/i, '')}_rotated`).replace(/\.pdf$/i, '')}.pdf`;
      downloadPdfBlob(bytes, filename);
      setSuccess(isEn ? 'Rotated PDF saved.' : 'Повёрнутый PDF сохранён.');
    } catch {
      setError(isEn ? 'The rotated PDF could not be saved.' : 'Не удалось сохранить PDF.');
    } finally {
      setProcessing(false);
    }
  }, [file, isEn, outputName, pdfData, rotations]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      {!file ? (
        <PdfDropzone
          accept="application/pdf,.pdf"
          onFilesSelected={handleFileSelected}
          maxSizeMB={100}
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
                  {formatFileSize(file.size, isEn)} · {pages.length} {isEn ? (pages.length === 1 ? 'page' : 'pages') : 'стр.'}
                </div>
              </div>
              <Button variant="outline" size="sm" className="min-h-11" onClick={reset}>
                {isEn ? 'New file' : 'Другой файл'}
              </Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="font-semibold">{isEn ? 'Choose pages' : 'Выберите страницы'}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {isEn
                    ? `${selectedCount} selected · tap a thumbnail to include or exclude it`
                    : `Выбрано: ${selectedCount} · нажмите на превью, чтобы включить или исключить страницу`}
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">
                {renderedCount < pages.length
                  ? `${isEn ? 'Loading previews' : 'Загрузка превью'} ${renderedCount}/${pages.length}`
                  : isEn ? 'Previews ready' : 'Превью готовы'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {pages.map((page) => {
                const selected = selectedPages.has(page.pageNumber);
                const rotation = rotations[page.pageNumber] ?? 0;
                return (
                  <button
                    key={page.pageNumber}
                    type="button"
                    onClick={() => togglePage(page.pageNumber)}
                    aria-pressed={selected}
                    aria-label={isEn ? `Page ${page.pageNumber}` : `Страница ${page.pageNumber}`}
                    className={cn(
                      'relative min-h-11 overflow-hidden rounded-[var(--radius-md)] border-2 bg-[var(--color-surface-muted)] p-2 text-left transition-colors',
                      selected
                        ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-ring)]'
                        : 'border-[var(--color-border)] opacity-55'
                    )}
                  >
                    <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-white">
                      {page.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={page.thumbnail}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-contain transition-transform"
                          style={{ transform: `rotate(${rotation}deg) scale(${rotation % 180 === 0 ? 1 : 0.74})` }}
                        />
                      ) : (
                        <ImageSquare size={28} className="text-slate-300" />
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold">{isEn ? 'Page' : 'Стр.'} {page.pageNumber}</span>
                      <span className="font-mono text-[var(--color-text-muted)]">{rotation}°</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="sticky bottom-3 z-10 p-3 shadow-[var(--shadow-elevated)] sm:static sm:p-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.35fr]">
              <Button variant="outline" className="min-h-11" onClick={() => rotateSelected(-90)}>
                <ArrowCounterClockwise size={20} /> −90°
              </Button>
              <Button variant="outline" className="min-h-11" onClick={() => rotateSelected(90)}>
                <ArrowClockwise size={20} /> +90°
              </Button>
              <Button size="lg" className="tool-primary-action col-span-2 min-h-12 sm:col-span-1" onClick={savePdf} disabled={processing || changedCount === 0}>
                {processing
                  ? isEn ? 'Saving…' : 'Сохранение…'
                  : isEn ? 'Save PDF' : 'Сохранить PDF'}
              </Button>
            </div>
            {changedCount === 0 ? (
              <div className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
                {isEn ? 'Rotate at least one selected page to save.' : 'Поверните хотя бы одну выбранную страницу.'}
              </div>
            ) : null}
          </Card>

          <AdvancedSettings
            title={isEn ? 'Page selection and filename' : 'Выбор страниц и имя файла'}
            description={isEn ? 'All, odd, even, range and reset' : 'Все, нечётные, чётные, диапазон и сброс'}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {([
                  ['all', isEn ? 'All' : 'Все'],
                  ['none', isEn ? 'None' : 'Ничего'],
                  ['odd', isEn ? 'Odd' : 'Нечётные'],
                  ['even', isEn ? 'Even' : 'Чётные'],
                ] as const).map(([kind, label]) => (
                  <Button key={kind} type="button" variant="outline" size="sm" className="min-h-11" onClick={() => selectPreset(kind)}>
                    {label}
                  </Button>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  value={rangeInput}
                  onChange={(event) => setRangeInput(event.target.value)}
                  placeholder={isEn ? 'Range: 1, 3-5, 8' : 'Диапазон: 1, 3-5, 8'}
                  aria-label={isEn ? 'Page range' : 'Диапазон страниц'}
                />
                <Button type="button" variant="outline" className="min-h-11" onClick={() => selectPreset('range')} disabled={!rangeInput.trim()}>
                  {isEn ? 'Select range' : 'Выбрать диапазон'}
                </Button>
              </div>
              <div>
                <Label htmlFor="rotate-output-name">{isEn ? 'Output filename' : 'Имя результата'}</Label>
                <Input id="rotate-output-name" className="mt-1.5" value={outputName} onChange={(event) => setOutputName(event.target.value)} />
              </div>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => {
                setRotations({});
                setSuccess('');
              }} disabled={changedCount === 0}>
                <ArrowCounterClockwise size={18} /> {isEn ? 'Reset rotations' : 'Сбросить повороты'}
              </Button>
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
