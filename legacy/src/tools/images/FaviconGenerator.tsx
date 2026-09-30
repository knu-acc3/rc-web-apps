'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Download,
  FileImage,
  TextT,
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
import { canvasToBlob, downloadBlob } from '@/src/utils/exportHelpers';

type SourceMode = 'text' | 'image';
type ImageFit = 'contain' | 'cover';

interface PackageOptions {
  web: boolean;
  apple: boolean;
  pwa: boolean;
  manifest: boolean;
  html: boolean;
}

interface PackageEntry {
  size: number;
  filename: string;
}

const DEFAULT_PACKAGE_OPTIONS: PackageOptions = {
  web: true,
  apple: true,
  pwa: true,
  manifest: true,
  html: true,
};

function roundedRect(context: CanvasRenderingContext2D, size: number, radius: number): void {
  const r = Math.min(size / 2, Math.max(0, radius));
  context.beginPath();
  context.moveTo(r, 0);
  context.lineTo(size - r, 0);
  context.quadraticCurveTo(size, 0, size, r);
  context.lineTo(size, size - r);
  context.quadraticCurveTo(size, size, size - r, size);
  context.lineTo(r, size);
  context.quadraticCurveTo(0, size, 0, size - r);
  context.lineTo(0, r);
  context.quadraticCurveTo(0, 0, r, 0);
  context.closePath();
}

async function createIcoBlob(canvases: HTMLCanvasElement[]): Promise<Blob> {
  const pngBuffers = await Promise.all(canvases.map(async (canvas) =>
    (await canvasToBlob(canvas, 'image/png')).arrayBuffer()
  ));
  const headerSize = 6 + canvases.length * 16;
  const totalSize = headerSize + pngBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const bytes = new Uint8Array(totalSize);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, canvases.length, true);

  let offset = headerSize;
  canvases.forEach((canvas, index) => {
    const entryOffset = 6 + index * 16;
    const buffer = pngBuffers[index];
    bytes[entryOffset] = canvas.width >= 256 ? 0 : canvas.width;
    bytes[entryOffset + 1] = canvas.height >= 256 ? 0 : canvas.height;
    bytes[entryOffset + 2] = 0;
    bytes[entryOffset + 3] = 0;
    view.setUint16(entryOffset + 4, 1, true);
    view.setUint16(entryOffset + 6, 32, true);
    view.setUint32(entryOffset + 8, buffer.byteLength, true);
    view.setUint32(entryOffset + 12, offset, true);
    bytes.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });
  return new Blob([bytes], { type: 'image/x-icon' });
}

function normalizePath(value: string): string {
  const trimmed = value.trim() || '/';
  return `${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}${trimmed.endsWith('/') ? '' : '/'}`;
}

export default function FaviconGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef('');

  const [sourceMode, setSourceMode] = useState<SourceMode>('text');
  const [text, setText] = useState('U');
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [symbolSize, setSymbolSize] = useState(72);
  const [backgroundColor, setBackgroundColor] = useState('#262B31');
  const [foregroundColor, setForegroundColor] = useState('#FFFFFF');
  const [cornerRadius, setCornerRadius] = useState(20);
  const [imageFit, setImageFit] = useState<ImageFit>('contain');
  const [packageOptions, setPackageOptions] = useState<PackageOptions>(DEFAULT_PACKAGE_OPTIONS);
  const [appName, setAppName] = useState('My App');
  const [shortName, setShortName] = useState('App');
  const [themeColor, setThemeColor] = useState('#262B31');
  const [faviconPath, setFaviconPath] = useState('/');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const renderIcon = useCallback((size: number): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return canvas;

    roundedRect(context, size, size * cornerRadius / 100);
    context.clip();
    context.fillStyle = /^#[\da-f]{6}$/i.test(backgroundColor) ? backgroundColor : '#262B31';
    context.fillRect(0, 0, size, size);

    const contentSize = size * symbolSize / 100;
    if (sourceMode === 'image' && sourceImage) {
      const sourceRatio = sourceImage.naturalWidth / sourceImage.naturalHeight;
      let width = contentSize;
      let height = contentSize;
      if (imageFit === 'contain') {
        if (sourceRatio > 1) height = width / sourceRatio;
        else width = height * sourceRatio;
      } else if (sourceRatio > 1) {
        width = height * sourceRatio;
      } else {
        height = width / sourceRatio;
      }
      context.save();
      context.beginPath();
      context.rect((size - contentSize) / 2, (size - contentSize) / 2, contentSize, contentSize);
      context.clip();
      context.drawImage(sourceImage, (size - width) / 2, (size - height) / 2, width, height);
      context.restore();
    } else if (sourceMode === 'text') {
      context.fillStyle = /^#[\da-f]{6}$/i.test(foregroundColor) ? foregroundColor : '#FFFFFF';
      context.font = `700 ${contentSize * 0.82}px Arial, "Helvetica Neue", sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text.trim() || 'U', size / 2, size / 2 + contentSize * 0.03, contentSize);
    }
    return canvas;
  }, [backgroundColor, cornerRadius, foregroundColor, imageFit, sourceImage, sourceMode, symbolSize, text]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const rendered = renderIcon(256);
    preview.width = 256;
    preview.height = 256;
    preview.getContext('2d')?.drawImage(rendered, 0, 0);
  }, [renderIcon]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const loadImageFile = useCallback(async (rawFile: File) => {
    setError('');
    setSuccess('');
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
      setSourceImage(image);
      setSourceFileName(file.name);
    };
    image.onerror = () => {
      setError(isEn ? 'The image could not be opened.' : 'Не удалось открыть изображение.');
      URL.revokeObjectURL(url);
      if (objectUrlRef.current === url) objectUrlRef.current = '';
    };
    image.src = url;
  }, [isEn]);

  const updatePackageOption = useCallback((key: keyof PackageOptions, checked: boolean) => {
    setPackageOptions((current) => ({ ...current, [key]: checked }));
    setSuccess('');
  }, []);

  const downloadPackage = useCallback(async () => {
    if (sourceMode === 'image' && !sourceImage) {
      setError(isEn ? 'Upload an image first.' : 'Сначала загрузите изображение.');
      return;
    }
    if (!packageOptions.web && !packageOptions.apple && !packageOptions.pwa) {
      setError(isEn ? 'Select at least one package variant in Advanced.' : 'Выберите хотя бы один вариант пакета в дополнительных настройках.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const entries: PackageEntry[] = [];
      if (packageOptions.web) {
        entries.push(
          { size: 16, filename: 'favicon-16x16.png' },
          { size: 32, filename: 'favicon-32x32.png' },
          { size: 48, filename: 'favicon-48x48.png' },
        );
      }
      if (packageOptions.apple) entries.push({ size: 180, filename: 'apple-touch-icon.png' });
      if (packageOptions.pwa) {
        entries.push(
          { size: 192, filename: 'icon-192.png' },
          { size: 512, filename: 'icon-512.png' },
        );
      }

      const renderedEntries = entries.map((entry) => ({ ...entry, canvas: renderIcon(entry.size) }));
      const pngBlobs = await Promise.all(renderedEntries.map(({ canvas }) => canvasToBlob(canvas, 'image/png')));
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      renderedEntries.forEach((entry, index) => zip.file(entry.filename, pngBlobs[index]));

      if (packageOptions.web) {
        const icoCanvases = [16, 32, 48].map((size) => renderIcon(size));
        zip.file('favicon.ico', await createIcoBlob(icoCanvases));
      }

      if (packageOptions.pwa && packageOptions.manifest) {
        zip.file('manifest.webmanifest', JSON.stringify({
          name: appName.trim() || 'My App',
          short_name: shortName.trim() || 'App',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
          theme_color: themeColor,
          background_color: backgroundColor,
          display: 'standalone',
        }, null, 2));
      }

      if (packageOptions.html) {
        const path = normalizePath(faviconPath);
        const lines: string[] = [];
        if (packageOptions.web) {
          lines.push(`<link rel="icon" href="${path}favicon.ico" sizes="any">`);
          lines.push(`<link rel="icon" type="image/png" sizes="32x32" href="${path}favicon-32x32.png">`);
        }
        if (packageOptions.apple) lines.push(`<link rel="apple-touch-icon" href="${path}apple-touch-icon.png">`);
        if (packageOptions.pwa && packageOptions.manifest) lines.push(`<link rel="manifest" href="${path}manifest.webmanifest">`);
        lines.push(`<meta name="theme-color" content="${themeColor}">`);
        zip.file('favicon.html', `${lines.join('\n')}\n`);
      }

      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      downloadBlob(blob, 'favicon-package.zip');
      setSuccess(isEn ? 'Favicon package downloaded.' : 'Пакет favicon скачан.');
    } catch {
      setError(isEn ? 'The favicon package could not be created.' : 'Не удалось создать пакет favicon.');
    } finally {
      setGenerating(false);
    }
  }, [appName, backgroundColor, faviconPath, isEn, packageOptions, renderIcon, shortName, sourceImage, sourceMode, themeColor]);

  const packageChoices: Array<{ key: keyof PackageOptions; en: string; ru: string }> = [
    { key: 'web', en: 'Web icons + ICO', ru: 'Web-иконки + ICO' },
    { key: 'apple', en: 'Apple touch icon', ru: 'Apple touch icon' },
    { key: 'pwa', en: 'PWA 192 / 512', ru: 'PWA 192 / 512' },
    { key: 'manifest', en: 'Web manifest', ru: 'Web manifest' },
    { key: 'html', en: 'HTML snippet', ru: 'HTML-фрагмент' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={EXTENDED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void loadImageFile(file);
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

      <Card className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={isEn ? 'Icon source' : 'Источник иконки'}>
          {([
            ['text', TextT, isEn ? 'Text / emoji' : 'Текст / эмодзи'],
            ['image', FileImage, isEn ? 'Image' : 'Изображение'],
          ] as const).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={sourceMode === value}
              onClick={() => {
                setSourceMode(value);
                setSuccess('');
              }}
              className={cn(
                'flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-2 text-sm font-semibold',
                sourceMode === value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]',
              )}
            >
              <Icon size={19} /> {label}
            </button>
          ))}
        </div>

        {sourceMode === 'text' ? (
          <div className="mt-4">
            <Label htmlFor="favicon-text">{isEn ? 'Text or emoji' : 'Текст или эмодзи'}</Label>
            <Input id="favicon-text" className="mt-1.5 h-12 text-center text-xl" value={text} maxLength={4} onChange={(event) => setText(event.target.value)} />
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-3 text-sm font-semibold hover:border-[var(--color-primary)]">
            <UploadSimple size={20} />
            {sourceFileName || (isEn ? 'Upload source image' : 'Загрузить исходное изображение')}
          </button>
        )}

        <label className="mt-4 block text-sm">
          <span className="font-medium">{isEn ? 'Symbol size' : 'Размер символа'}: {symbolSize}%</span>
          <input className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={40} max={100} value={symbolSize} onChange={(event) => setSymbolSize(Number(event.target.value))} />
        </label>
      </Card>

      <Card className="mt-4 p-4 sm:p-5">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-5">
            <canvas ref={previewRef} className="size-44 shadow-[var(--shadow-elevated)] sm:size-52" aria-label={isEn ? 'Live favicon preview' : 'Предпросмотр favicon'} />
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">{isEn ? 'Live icon preview' : 'Живой предпросмотр иконки'}</div>
        </div>

        <div className="mt-5 flex justify-center">
          <Button size="lg" className="h-11 w-full sm:w-auto min-w-[240px] px-6 shadow-sm" onClick={downloadPackage} disabled={generating || (sourceMode === 'image' && !sourceImage)}>
            <Download size={20} weight="bold" />
            {generating
              ? isEn ? 'Creating package…' : 'Создание пакета…'
              : isEn ? 'Download favicon package' : 'Скачать пакет favicon'}
          </Button>
        </div>
      </Card>

      <AdvancedSettings
        className="mt-4"
        title={isEn ? 'Variants, appearance and metadata' : 'Варианты, оформление и метаданные'}
        description={isEn ? 'ICO, Apple, PWA, colors, manifest and HTML' : 'ICO, Apple, PWA, цвета, manifest и HTML'}
      >
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{isEn ? 'Package contents' : 'Содержимое пакета'}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {packageChoices.map((choice) => (
                <label key={choice.key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm">
                  <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={packageOptions[choice.key]} onChange={(event) => updatePackageOption(choice.key, event.target.checked)} />
                  {isEn ? choice.en : choice.ru}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-2">
            <div>
              <Label>{isEn ? 'Background' : 'Фон'}</Label>
              <div className="mt-1.5 flex gap-2">
                <input type="color" className="h-11 w-16 rounded border border-[var(--color-border)] bg-transparent p-1" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} aria-label={isEn ? 'Background color' : 'Цвет фона'} />
                <Input className="h-11 font-mono" value={backgroundColor} onChange={(event) => setBackgroundColor(event.target.value)} />
              </div>
            </div>
            {sourceMode === 'text' ? (
              <div>
                <Label>{isEn ? 'Text color' : 'Цвет текста'}</Label>
                <div className="mt-1.5 flex gap-2">
                  <input type="color" className="h-11 w-16 rounded border border-[var(--color-border)] bg-transparent p-1" value={foregroundColor} onChange={(event) => setForegroundColor(event.target.value)} aria-label={isEn ? 'Text color' : 'Цвет текста'} />
                  <Input className="h-11 font-mono" value={foregroundColor} onChange={(event) => setForegroundColor(event.target.value)} />
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="favicon-fit">{isEn ? 'Image fit' : 'Размещение изображения'}</Label>
                <select id="favicon-fit" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={imageFit} onChange={(event) => setImageFit(event.target.value as ImageFit)}>
                  <option value="contain">{isEn ? 'Fit inside' : 'Вместить'}</option>
                  <option value="cover">{isEn ? 'Fill square' : 'Заполнить квадрат'}</option>
                </select>
              </div>
            )}
          </div>

          <label className="block text-sm">
            <span className="font-medium">{isEn ? 'Corner radius' : 'Скругление'}: {cornerRadius}%</span>
            <input className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0} max={50} value={cornerRadius} onChange={(event) => setCornerRadius(Number(event.target.value))} />
          </label>

          <div className="grid gap-4 border-t border-[var(--color-border-subtle)] pt-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="favicon-app-name">{isEn ? 'App name' : 'Название приложения'}</Label>
              <Input id="favicon-app-name" className="mt-1.5 h-11" value={appName} onChange={(event) => setAppName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="favicon-short-name">{isEn ? 'Short name' : 'Короткое название'}</Label>
              <Input id="favicon-short-name" className="mt-1.5 h-11" value={shortName} onChange={(event) => setShortName(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="favicon-theme">{isEn ? 'Theme color' : 'Цвет темы'}</Label>
              <Input id="favicon-theme" className="mt-1.5 h-11 font-mono" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="favicon-path">{isEn ? 'Public path' : 'Публичный путь'}</Label>
              <Input id="favicon-path" className="mt-1.5 h-11 font-mono" value={faviconPath} onChange={(event) => setFaviconPath(event.target.value)} />
            </div>
          </div>
        </div>
      </AdvancedSettings>

      {success ? (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-success)]/30 bg-[var(--color-success-soft)] p-3 text-sm text-[var(--color-success)]">
          <CheckCircle size={20} weight="fill" /> {success}
        </div>
      ) : null}
    </div>
  );
}
