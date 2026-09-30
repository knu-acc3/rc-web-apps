'use client';

import { useState, useRef, useCallback, useMemo, useId, forwardRef, useImperativeHandle } from 'react';
import { UploadSimple, ClipboardText } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { EXTENDED_IMAGE_ACCEPT, isExtendedImageFile, normalizeImagesForBrowser } from '@/src/lib/file-conversion/image-engine';
import { cn } from '@/src/lib/cn';

const DEFAULT_ACCEPT = EXTENDED_IMAGE_ACCEPT;

export interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  compact?: boolean;
}

export interface ImageUploaderHandle {
  reset: () => void;
  openFileDialog: () => void;
}

const ImageUploader = forwardRef<ImageUploaderHandle, ImageUploaderProps>(function ImageUploader(
  { onFilesSelected, accept = DEFAULT_ACCEPT, multiple = false, maxSizeMB, disabled = false, compact = false },
  ref
) {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [dragging, setDragging] = useState(false);
  const [decodingHeic, setDecodingHeic] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    openFileDialog: () => {
      fileInputRef.current?.click();
    },
  }));

  const acceptMimes = useMemo(() => accept.split(',').map(s => s.trim()), [accept]);

  const filterFiles = useCallback((files: File[]): File[] => {
    let valid = files.filter(f => {
      if (isExtendedImageFile(f)) return true;
      if (acceptMimes.includes(f.type)) return true;
      if (acceptMimes.some(a => a.endsWith('/*') && f.type.startsWith(a.replace('/*', '/')))) return true;
      return f.type.startsWith('image/');
    });
    if (maxSizeMB) {
      valid = valid.filter(f => f.size <= maxSizeMB * 1024 * 1024);
    }
    if (!multiple && valid.length > 1) valid = [valid[0]];
    return valid;
  }, [acceptMimes, maxSizeMB, multiple]);

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return;
    const valid = filterFiles(files);
    if (valid.length === 0) {
      if (files.length > 0) {
        setRejectionMessage(
          maxSizeMB
            ? isEn
              ? `Unsupported image type or file is larger than ${maxSizeMB} MB.`
              : `Неподдерживаемый тип изображения или размер больше ${maxSizeMB} МБ.`
            : isEn
              ? 'Unsupported image type.'
              : 'Неподдерживаемый тип изображения.'
        );
      }
      return;
    }

    setRejectionMessage(
      valid.length < files.length
        ? isEn
          ? `${files.length - valid.length} image(s) skipped because type or size is not supported.`
          : `${files.length - valid.length} изображение(й) пропущено: тип или размер не поддерживается.`
        : ''
    );

    if (valid.some((file) => !/\.(?:jpe?g|png|webp|gif|svg|bmp)$/i.test(file.name))) {
      setDecodingHeic(true);
      try {
        const normalized = await normalizeImagesForBrowser(valid);
        if (normalized.length > 0) onFilesSelected(normalized);
      } finally {
        setDecodingHeic(false);
      }
    } else {
      onFilesSelected(valid);
    }
  }, [disabled, filterFiles, isEn, maxSizeMB, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFiles]);

  const displayLabel = decodingHeic
    ? (isEn ? 'Decoding HEIC...' : 'Декодирование HEIC...')
    : dragging
      ? (isEn ? 'Drop image file here' : 'Отпустите файл изображения')
      : (isEn ? 'Upload image file' : 'Загрузите файл изображения');
  const hintItems = [
    isEn ? 'Images' : 'Изображения',
    maxSizeMB ? (isEn ? `Max ${maxSizeMB} MB` : `Макс. ${maxSizeMB} МБ`) : null,
    'Ctrl+V',
  ].filter((item): item is string => Boolean(item));

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, [disabled]);

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={displayLabel}
      aria-describedby={hintId}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onKeyDown={handleKeyDown}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={cn(
        'min-w-0 max-w-full rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-colors',
        compact ? 'p-3 2xs:p-4' : 'p-4 2xs:p-5 sm:p-8',
        dragging
          ? 'border-[var(--color-primary)] bg-[var(--color-surface-muted)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]/30',
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        data-file-paste-target="true"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      <div className="mb-2 flex justify-center">
        <UploadSimple
          size={compact ? 36 : 48}
          className={dragging ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}
        />
      </div>

      <div className={cn('text-pretty break-words font-medium leading-snug', compact ? 'text-sm' : 'text-sm 2xs:text-base')}>
        {displayLabel}
      </div>

      <div id={hintId} className="mt-2 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        {hintItems.map((item) => (
          <span
            key={item}
            className="inline-flex min-h-6 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2"
          >
            {item === 'Ctrl+V' && <ClipboardText size={13} />}
            {item}
          </span>
        ))}
      </div>

      {rejectionMessage && (
        <div className="mt-2 text-xs font-medium text-[var(--color-danger)]" role="status">
          {rejectionMessage}
        </div>
      )}
    </div>
  );
});

export default ImageUploader;
