'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  ClipboardText,
  Download,
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
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';

type Mode = 'encode' | 'decode';
type OutputMime = 'auto' | 'image/png' | 'image/jpeg' | 'image/webp';
type OutputStyle = 'data-url' | 'base64';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = source;
  });
}

function formatBytes(bytes: number, isEn: boolean): string {
  if (bytes < 1024) return `${bytes} ${isEn ? 'B' : 'Б'}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${isEn ? 'KB' : 'КБ'}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${isEn ? 'MB' : 'МБ'}`;
}

function normalizeBase64Input(value: string, fallbackMime: string): string {
  const trimmed = value.trim();
  if (/^data:image\/[\w.+-]+;base64,/i.test(trimmed)) {
    const comma = trimmed.indexOf(',');
    return `${trimmed.slice(0, comma + 1)}${trimmed.slice(comma + 1).replace(/\s/g, '')}`;
  }
  return `data:${fallbackMime};base64,${trimmed.replace(/\s/g, '')}`;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.*)$/s);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { blob: new Blob([bytes], { type: mime }), mime };
}

function extensionForMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/svg+xml') return 'svg';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/webp') return 'webp';
  return 'png';
}

export default function ImageToBase64() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('encode');
  const [dragging, setDragging] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceDataUrl, setSourceDataUrl] = useState('');
  const [encodedOutput, setEncodedOutput] = useState('');
  const [outputMime, setOutputMime] = useState<OutputMime>('auto');
  const [outputStyle, setOutputStyle] = useState<OutputStyle>('data-url');
  const [maxWidth, setMaxWidth] = useState(0);
  const [quality, setQuality] = useState(0.9);
  const [encoding, setEncoding] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');

  const [base64Input, setBase64Input] = useState('');
  const [decodedPreview, setDecodedPreview] = useState('');
  const [decodedMime, setDecodedMime] = useState('image/png');
  const [decodeMimeFallback, setDecodeMimeFallback] = useState('image/png');
  const [decodeError, setDecodeError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!sourceDataUrl) {
      return;
    }

    void (async () => {
      setEncoding(true);
      setError('');
      try {
        const originalMime = sourceDataUrl.match(/^data:([^;,]+)/i)?.[1] ?? 'image/png';
        let result = sourceDataUrl;
        const needsCanvas = maxWidth > 0 || outputMime !== 'auto';

        if (needsCanvas) {
          const image = await loadImage(sourceDataUrl);
          const scale = maxWidth > 0 && image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas unavailable');
          const targetMime = outputMime === 'auto'
            ? (/^image\/(png|jpeg|webp)$/i.test(originalMime) ? originalMime : 'image/png')
            : outputMime;
          if (targetMime === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          result = canvas.toDataURL(targetMime, targetMime === 'image/png' ? undefined : quality);
        }

        if (!cancelled) {
          setEncodedOutput(outputStyle === 'base64' ? result.slice(result.indexOf(',') + 1) : result);
        }
      } catch {
        if (!cancelled) {
          setEncodedOutput('');
          setError(isEn ? 'The image could not be encoded.' : 'Не удалось преобразовать изображение.');
        }
      } finally {
        if (!cancelled) setEncoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEn, maxWidth, outputMime, outputStyle, quality, sourceDataUrl]);

  useEffect(() => {
    let cancelled = false;
    const value = base64Input.trim();
    if (!value) {
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        const dataUrl = normalizeBase64Input(value, decodeMimeFallback);
        const image = new Image();
        image.onload = () => {
          if (cancelled) return;
          setDecodedPreview(dataUrl);
          setDecodedMime(dataUrl.match(/^data:([^;,]+)/i)?.[1] ?? decodeMimeFallback);
          setDecodeError('');
        };
        image.onerror = () => {
          if (cancelled) return;
          setDecodedPreview('');
          setDecodeError(isEn ? 'This is not a valid image Base64 string.' : 'Строка Base64 не содержит корректное изображение.');
        };
        image.src = dataUrl;
      } catch {
        if (!cancelled) setDecodeError(isEn ? 'The Base64 string is invalid.' : 'Некорректная строка Base64.');
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [base64Input, decodeMimeFallback, isEn]);

  const loadFile = useCallback(async (rawFile: File) => {
    setError('');
    setCopyStatus('');
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

    try {
      setSourceDataUrl(await readFileAsDataUrl(file));
      setSourceFile(file);
    } catch {
      setError(isEn ? 'The image could not be read.' : 'Не удалось прочитать изображение.');
    }
  }, [isEn]);

  const copyOutput = useCallback(async () => {
    if (!encodedOutput) return;
    const copied = await writeClipboardText(encodedOutput);
    setCopyStatus(copied
      ? isEn ? 'Copied' : 'Скопировано'
      : isEn ? 'Could not copy' : 'Не удалось скопировать');
  }, [encodedOutput, isEn]);

  const downloadDecoded = useCallback(() => {
    if (!decodedPreview) return;
    try {
      const { blob, mime } = dataUrlToBlob(decodedPreview);
      downloadBlob(blob, `decoded-image.${extensionForMime(mime)}`);
    } catch {
      setDecodeError(isEn ? 'The image could not be downloaded.' : 'Не удалось скачать изображение.');
    }
  }, [decodedPreview, isEn]);

  const clearSource = useCallback(() => {
    setSourceFile(null);
    setSourceDataUrl('');
    setEncodedOutput('');
    setCopyStatus('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-1">
        {([
          ['encode', isEn ? 'Image → Base64' : 'Изображение → Base64'],
          ['decode', isEn ? 'Base64 → Image' : 'Base64 → изображение'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError('');
            }}
            className={cn(
              'min-h-11 rounded-[var(--radius-sm)] px-2 text-sm font-semibold transition-colors',
              mode === value
                ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span className="flex-1">{error}</span>
          <button type="button" className="min-h-11 min-w-11" onClick={() => setError('')} aria-label={isEn ? 'Dismiss' : 'Закрыть'}>
            <X size={18} className="mx-auto" />
          </button>
        </div>
      ) : null}

      {mode === 'encode' ? (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            data-file-paste-target="true"
            accept={EXTENDED_IMAGE_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadFile(file);
            }}
          />

          {!sourceFile ? (
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
                if (file) void loadFile(file);
              }}
              className={cn(
                'flex min-h-52 w-full flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-6 text-center transition-colors',
                dragging
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]',
              )}
            >
              <UploadSimple size={32} className="text-[var(--color-primary)]" />
              <span className="mt-3 font-semibold">{isEn ? 'Choose one image' : 'Выберите одно изображение'}</span>
              <span className="mt-1 text-sm text-[var(--color-text-muted)]">{isEn ? 'Drop it here or tap to upload' : 'Перетащите сюда или нажмите для загрузки'}</span>
            </button>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sourceDataUrl} alt="" className="size-14 rounded-[var(--radius-sm)] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" title={sourceFile.name}>{sourceFile.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{formatBytes(sourceFile.size, isEn)}</div>
                  </div>
                  <Button variant="outline" size="sm" className="min-h-11 min-w-11" onClick={clearSource}>
                    {isEn ? 'Replace' : 'Заменить'}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <Label htmlFor="base64-output">{isEn ? 'Result' : 'Результат'}</Label>
                <textarea
                  id="base64-output"
                  readOnly
                  value={encoding ? (isEn ? 'Encoding…' : 'Преобразование…') : encodedOutput}
                  className="mt-1.5 min-h-40 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 font-mono text-xs leading-relaxed"
                />
                <div className="mt-3 flex justify-start">
                  <Button data-primary-action="image-base64" data-primary-state="copy-encoded" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" size="lg" onClick={copyOutput} disabled={!encodedOutput || encoding}>
                    {copyStatus === (isEn ? 'Copied' : 'Скопировано') ? <CheckCircle size={20} weight="fill" /> : <ClipboardText size={20} />}
                    {copyStatus || (isEn ? 'Copy Base64' : 'Копировать Base64')}
                  </Button>
                </div>
              </Card>

              <AdvancedSettings
                title={isEn ? 'MIME and Data URL options' : 'Параметры MIME и Data URL'}
                description={isEn ? 'Output type, resize and quality' : 'Тип результата, размер и качество'}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="base64-style">{isEn ? 'Output' : 'Результат'}</Label>
                    <select id="base64-style" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={outputStyle} onChange={(event) => setOutputStyle(event.target.value as OutputStyle)}>
                      <option value="data-url">Data URL</option>
                      <option value="base64">{isEn ? 'Raw Base64' : 'Только Base64'}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="base64-mime">MIME</Label>
                    <select id="base64-mime" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={outputMime} onChange={(event) => setOutputMime(event.target.value as OutputMime)}>
                      <option value="auto">{isEn ? 'Keep original' : 'Сохранить исходный'}</option>
                      <option value="image/png">image/png</option>
                      <option value="image/jpeg">image/jpeg</option>
                      <option value="image/webp">image/webp</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="base64-width">{isEn ? 'Maximum width (0 = original)' : 'Максимальная ширина (0 = исходная)'}</Label>
                    <Input id="base64-width" className="mt-1.5 h-11" type="number" min={0} max={8192} value={maxWidth} onChange={(event) => setMaxWidth(Math.max(0, Number(event.target.value) || 0))} />
                  </div>
                  <label className="block text-sm">
                    <span className="font-medium">{isEn ? 'Quality' : 'Качество'}: {Math.round(quality * 100)}%</span>
                    <input className="mt-2 min-h-11 w-full accent-[var(--color-primary)]" type="range" min={0.35} max={1} step={0.05} value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
                  </label>
                </div>
              </AdvancedSettings>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <Label htmlFor="base64-input">{isEn ? 'Base64 or Data URL' : 'Base64 или Data URL'}</Label>
            <textarea
              id="base64-input"
              value={base64Input}
              onChange={(event) => {
                const value = event.target.value;
                setBase64Input(value);
                if (!value.trim()) {
                  setDecodedPreview('');
                  setDecodeError('');
                }
              }}
              placeholder={isEn ? 'Paste the image string here' : 'Вставьте строку изображения сюда'}
              className="mt-1.5 min-h-44 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-xs leading-relaxed"
              spellCheck={false}
            />

            {decodeError ? <div role="alert" className="mt-2 text-sm text-[var(--color-danger)]">{decodeError}</div> : null}
            {decodedPreview ? (
              <div className="mt-4 flex min-h-48 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)_0_0/20px_20px] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={decodedPreview} alt={isEn ? 'Decoded image' : 'Декодированное изображение'} className="max-h-[48vh] max-w-full object-contain" />
              </div>
            ) : null}

            <div className="mt-4 flex justify-start">
              <Button data-primary-action="image-base64" data-primary-state="download-decoded" className="h-11 w-full sm:w-auto min-w-[200px] px-6 shadow-sm" size="lg" onClick={downloadDecoded} disabled={!decodedPreview}>
                <Download size={20} weight="bold" /> {isEn ? 'Download image' : 'Скачать изображение'}
              </Button>
            </div>
          </Card>

          <AdvancedSettings
            title={isEn ? 'MIME for raw Base64' : 'MIME для строки без Data URL'}
            description={isEn ? 'Used only when the pasted value has no Data URL prefix' : 'Используется, только если в строке нет префикса Data URL'}
          >
            <div>
              <Label htmlFor="decode-mime">MIME</Label>
              <select id="decode-mime" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={decodeMimeFallback} onChange={(event) => setDecodeMimeFallback(event.target.value)}>
                <option value="image/png">image/png</option>
                <option value="image/jpeg">image/jpeg</option>
                <option value="image/webp">image/webp</option>
                <option value="image/gif">image/gif</option>
                <option value="image/svg+xml">image/svg+xml</option>
              </select>
              {decodedPreview ? <div className="mt-2 text-xs text-[var(--color-text-muted)]">{isEn ? 'Detected' : 'Определён'}: {decodedMime}</div> : null}
            </div>
          </AdvancedSettings>
        </div>
      )}
    </div>
  );
}
