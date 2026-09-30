'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/cn';
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImageForBrowser } from '@/src/lib/file-conversion/image-engine';
import { downloadCanvas } from '@/src/utils/exportHelpers';

type SizeId = 'square' | 'portrait' | 'landscape';
type TextPosition = 'top' | 'center' | 'bottom';
type TextAlign = 'left' | 'center' | 'right';
type ExportFormat = 'png' | 'jpeg' | 'webp';

interface SizeOption {
  id: SizeId;
  width: number;
  height: number;
  labelEn: string;
  labelRu: string;
}

const SIZE_OPTIONS: SizeOption[] = [
  { id: 'square', width: 1080, height: 1080, labelEn: 'Square · 1080 × 1080', labelRu: 'Квадрат · 1080 × 1080' },
  { id: 'portrait', width: 1080, height: 1920, labelEn: 'Portrait · 1080 × 1920', labelRu: 'Вертикальный · 1080 × 1920' },
  { id: 'landscape', width: 1200, height: 630, labelEn: 'Landscape · 1200 × 630', labelRu: 'Горизонтальный · 1200 × 630' },
];

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of value.split('\n')) {
    if (!paragraph.trim()) {
      result.push('');
      continue;
    }
    const words = paragraph.trim().split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        result.push(line);
        line = word;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export default function MemeGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef('');

  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [backgroundFileName, setBackgroundFileName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#3157D5');
  const [text, setText] = useState('');
  const [sizeId, setSizeId] = useState<SizeId>('square');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(76);
  const [fontFamily, setFontFamily] = useState('Arial, "Helvetica Neue", sans-serif');
  const [fontWeight, setFontWeight] = useState(700);
  const [textPosition, setTextPosition] = useState<TextPosition>('center');
  const [textAlign, setTextAlign] = useState<TextAlign>('center');
  const [padding, setPadding] = useState(9);
  const [overlayOpacity, setOverlayOpacity] = useState(0.25);
  const [uppercase, setUppercase] = useState(false);
  const [textStroke, setTextStroke] = useState(true);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState(0.92);
  const [outputName, setOutputName] = useState('social-image');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const selectedSize = SIZE_OPTIONS.find((option) => option.id === sizeId) ?? SIZE_OPTIONS[0];

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = selectedSize.width;
    canvas.height = selectedSize.height;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = /^#[\da-f]{6}$/i.test(backgroundColor) ? backgroundColor : '#3157D5';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) drawCover(context, backgroundImage, canvas.width, canvas.height);
    if (backgroundImage && overlayOpacity > 0) {
      context.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const renderedText = uppercase ? text.toLocaleUpperCase(locale) : text;
    if (!renderedText.trim()) return;

    const safePadding = canvas.width * padding / 100;
    const maxWidth = canvas.width - safePadding * 2;
    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const lines = wrapText(context, renderedText, maxWidth);
    const lineHeight = fontSize * 1.18;
    const totalHeight = Math.max(lineHeight, lines.length * lineHeight);
    let startY = canvas.height / 2 - totalHeight / 2 + lineHeight * 0.78;
    if (textPosition === 'top') startY = safePadding + lineHeight * 0.78;
    if (textPosition === 'bottom') startY = canvas.height - safePadding - totalHeight + lineHeight * 0.78;

    context.textAlign = textAlign;
    context.textBaseline = 'alphabetic';
    context.lineJoin = 'round';
    const x = textAlign === 'left' ? safePadding : textAlign === 'right' ? canvas.width - safePadding : canvas.width / 2;
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      if (textStroke) {
        context.strokeStyle = 'rgba(0, 0, 0, 0.72)';
        context.lineWidth = Math.max(3, fontSize * 0.075);
        context.strokeText(line, x, y, maxWidth);
      }
      context.fillStyle = /^#[\da-f]{6}$/i.test(textColor) ? textColor : '#FFFFFF';
      context.fillText(line, x, y, maxWidth);
    });
  }, [backgroundColor, backgroundImage, fontFamily, fontSize, fontWeight, locale, overlayOpacity, padding, selectedSize.height, selectedSize.width, text, textAlign, textColor, textPosition, textStroke, uppercase]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(renderCanvas);
    return () => window.cancelAnimationFrame(frame);
  }, [renderCanvas]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const loadBackground = useCallback(async (rawFile: File) => {
    setError('');
    if (!isExtendedImageFile(rawFile)) {
      setError(isEn ? 'Choose an image file.' : 'Выберите файл изображения.');
      return;
    }
    let file: File;
    try {
      file = await normalizeImageForBrowser(rawFile);
    } catch {
      setError(isEn ? 'This image format could not be decoded.' : 'Не удалось декодировать этот формат изображения.');
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      setBackgroundImage(image);
      setBackgroundFileName(file.name);
    };
    image.onerror = () => {
      setError(isEn ? 'The image could not be opened.' : 'Не удалось открыть изображение.');
      URL.revokeObjectURL(url);
      if (objectUrlRef.current === url) objectUrlRef.current = '';
    };
    image.src = url;
  }, [isEn]);

  const clearBackgroundImage = useCallback(() => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = '';
    setBackgroundImage(null);
    setBackgroundFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadImage = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      downloadCanvas(canvasRef.current, {
        baseName: outputName.trim() || 'social-image',
        format,
        quality: format === 'png' ? undefined : quality,
      });
    } catch {
      setError(isEn ? 'The image could not be downloaded.' : 'Не удалось скачать изображение.');
    }
  }, [format, isEn, outputName, quality]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadBackground(file);
        }}
      />

      {error ? (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span className="flex-1">{error}</span>
          <button type="button" className="min-h-11 min-w-11" onClick={() => setError('')} aria-label={isEn ? 'Dismiss' : 'Закрыть'}>
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Card className="order-2 overflow-hidden p-3 sm:p-4 lg:order-1">
          <div className="tool-short-landscape-stage flex min-h-80 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]">
            <canvas ref={canvasRef} className="block max-h-[68vh] w-full object-contain" />
          </div>
          <div className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
            {selectedSize.width} × {selectedSize.height} px
          </div>
        </Card>

        <div className="order-1 space-y-4 lg:order-2">
          <Card className="p-4 sm:p-5">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const file = event.dataTransfer.files[0];
                  if (file) void loadBackground(file);
                }}
                className={cn(
                  'flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed px-3 text-sm font-semibold',
                  dragging
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]',
                )}
              >
                <UploadSimple size={20} />
                <span className="truncate">{backgroundFileName || (isEn ? 'Upload background' : 'Загрузить фон')}</span>
              </button>
              {backgroundImage ? (
                <button type="button" className="min-h-12 min-w-12 rounded-[var(--radius-md)] border border-[var(--color-border)]" onClick={clearBackgroundImage} aria-label={isEn ? 'Remove background image' : 'Удалить фоновое изображение'}>
                  <Trash size={19} className="mx-auto" />
                </button>
              ) : (
                <input type="color" className="h-12 w-14 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent p-1" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} aria-label={isEn ? 'Background color' : 'Цвет фона'} />
              )}
            </div>

            <div className="mt-4">
              <Label htmlFor="social-text">{isEn ? 'Text' : 'Текст'}</Label>
              <textarea id="social-text" className="mt-1.5 min-h-28 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base" value={text} maxLength={500} onChange={(event) => setText(event.target.value)} placeholder={isEn ? 'Write a headline or message' : 'Введите заголовок или сообщение'} />
            </div>

            <div className="mt-4">
              <Label htmlFor="social-size">{isEn ? 'Size' : 'Размер'}</Label>
              <select id="social-size" className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base" value={sizeId} onChange={(event) => setSizeId(event.target.value as SizeId)}>
                {SIZE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{isEn ? option.labelEn : option.labelRu}</option>)}
              </select>
            </div>

          </Card>

          <AdvancedSettings
            title={isEn ? 'Text style and position' : 'Стиль и положение текста'}
            description={isEn ? 'Font, alignment, overlay and export' : 'Шрифт, выравнивание, затемнение и экспорт'}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <Label htmlFor="social-font">{isEn ? 'Font' : 'Шрифт'}</Label>
                  <select id="social-font" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={fontFamily} onChange={(event) => setFontFamily(event.target.value)}>
                    <option value={'Arial, "Helvetica Neue", sans-serif'}>Arial</option>
                    <option value={'Georgia, serif'}>Georgia</option>
                    <option value={'"Courier New", monospace'}>Courier New</option>
                    <option value={'Impact, sans-serif'}>Impact</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="social-position">{isEn ? 'Position' : 'Положение'}</Label>
                  <select id="social-position" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={textPosition} onChange={(event) => setTextPosition(event.target.value as TextPosition)}>
                    <option value="top">{isEn ? 'Top' : 'Сверху'}</option>
                    <option value="center">{isEn ? 'Center' : 'По центру'}</option>
                    <option value="bottom">{isEn ? 'Bottom' : 'Снизу'}</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="social-weight">{isEn ? 'Weight' : 'Начертание'}</Label>
                  <select id="social-weight" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={fontWeight} onChange={(event) => setFontWeight(Number(event.target.value))}>
                    <option value={400}>{isEn ? 'Regular' : 'Обычное'}</option>
                    <option value={600}>{isEn ? 'Semibold' : 'Полужирное'}</option>
                    <option value={700}>{isEn ? 'Bold' : 'Жирное'}</option>
                    <option value={900}>{isEn ? 'Black' : 'Очень жирное'}</option>
                  </select>
                </div>
              </div>

              <label className="block text-sm">
                <span>{isEn ? 'Font size' : 'Размер текста'}: {fontSize}px</span>
                <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={32} max={180} step={2} value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
              </label>
              <label className="block text-sm">
                <span>{isEn ? 'Safe padding' : 'Отступ'}: {padding}%</span>
                <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={3} max={20} value={padding} onChange={(event) => setPadding(Number(event.target.value))} />
              </label>
              <label className="block text-sm">
                <span>{isEn ? 'Background darkening' : 'Затемнение фона'}: {Math.round(overlayOpacity * 100)}%</span>
                <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0} max={0.75} step={0.05} value={overlayOpacity} onChange={(event) => setOverlayOpacity(Number(event.target.value))} />
              </label>

              <div>
                <Label>{isEn ? 'Text color' : 'Цвет текста'}</Label>
                <div className="mt-1.5 flex gap-2">
                  <input type="color" className="h-11 w-16 rounded border border-[var(--color-border)] bg-transparent p-1" value={textColor} onChange={(event) => setTextColor(event.target.value)} aria-label={isEn ? 'Text color' : 'Цвет текста'} />
                  <Input className="h-11 font-mono" value={textColor} onChange={(event) => setTextColor(event.target.value)} />
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-sm font-medium">{isEn ? 'Alignment' : 'Выравнивание'}</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map((value) => (
                    <button key={value} type="button" className={cn('min-h-11 rounded-[var(--radius-md)] border px-2 text-sm', textAlign === value ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'border-[var(--color-border)]')} onClick={() => setTextAlign(value)}>
                      {isEn ? value[0].toUpperCase() + value.slice(1) : value === 'left' ? 'Слева' : value === 'center' ? 'Центр' : 'Справа'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                  <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
                  {isEn ? 'Uppercase' : 'Верхний регистр'}
                </label>
                <label className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                  <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={textStroke} onChange={(event) => setTextStroke(event.target.checked)} />
                  {isEn ? 'Text outline' : 'Обводка текста'}
                </label>
              </div>

              <div className="grid gap-4 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <Label htmlFor="social-format">{isEn ? 'Format' : 'Формат'}</Label>
                  <select id="social-format" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="social-name">{isEn ? 'Filename' : 'Имя файла'}</Label>
                  <Input id="social-name" className="mt-1.5 h-11" value={outputName} onChange={(event) => setOutputName(event.target.value)} />
                </div>
              </div>
              {format !== 'png' ? (
                <label className="block text-sm">
                  <span>{isEn ? 'Quality' : 'Качество'}: {Math.round(quality * 100)}%</span>
                  <input className="mt-1 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0.4} max={1} step={0.05} value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                </label>
              ) : null}
            </div>
          </AdvancedSettings>
        </div>
      </div>
      <div className="mt-4 flex justify-start">
        <Button size="lg" className="h-11 w-full sm:w-auto min-w-[220px] px-6 shadow-sm" onClick={downloadImage}>
          <Download size={20} weight="bold" /> {isEn ? 'Download image' : 'Скачать изображение'}
        </Button>
      </div>
    </div>
  );
}
