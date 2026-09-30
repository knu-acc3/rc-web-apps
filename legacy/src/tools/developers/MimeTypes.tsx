'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  Download,
  FileArrowUp,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';
import { Card } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { writeClipboardText } from '@/src/utils/clipboard';

type MimeCategory = 'text' | 'image' | 'audio' | 'video' | 'application' | 'font';

interface MimeEntry {
  ext: string;
  mime: string;
  en: string;
  ru: string;
  category: MimeCategory;
  signature?: string;
}

const MIME_TYPES: MimeEntry[] = [
  { ext: '.txt', mime: 'text/plain', en: 'Plain text', ru: 'Обычный текст', category: 'text' },
  { ext: '.html', mime: 'text/html', en: 'HTML document', ru: 'HTML-документ', category: 'text' },
  { ext: '.css', mime: 'text/css', en: 'CSS stylesheet', ru: 'Таблица стилей CSS', category: 'text' },
  { ext: '.csv', mime: 'text/csv', en: 'CSV table', ru: 'Таблица CSV', category: 'text' },
  { ext: '.xml', mime: 'application/xml', en: 'XML document', ru: 'Документ XML', category: 'application', signature: '<?xml' },
  { ext: '.md', mime: 'text/markdown', en: 'Markdown document', ru: 'Документ Markdown', category: 'text' },
  { ext: '.js', mime: 'text/javascript', en: 'JavaScript source', ru: 'Код JavaScript', category: 'text' },
  { ext: '.mjs', mime: 'text/javascript', en: 'JavaScript module', ru: 'Модуль JavaScript', category: 'text' },
  { ext: '.json', mime: 'application/json', en: 'JSON data', ru: 'Данные JSON', category: 'application', signature: '{ or [' },
  { ext: '.yaml', mime: 'application/yaml', en: 'YAML data', ru: 'Данные YAML', category: 'application' },
  { ext: '.pdf', mime: 'application/pdf', en: 'PDF document', ru: 'Документ PDF', category: 'application', signature: '%PDF-' },
  { ext: '.zip', mime: 'application/zip', en: 'ZIP archive', ru: 'Архив ZIP', category: 'application', signature: 'PK 03 04' },
  { ext: '.gz', mime: 'application/gzip', en: 'GZIP archive', ru: 'Архив GZIP', category: 'application', signature: '1F 8B' },
  { ext: '.tar', mime: 'application/x-tar', en: 'TAR archive', ru: 'Архив TAR', category: 'application' },
  { ext: '.rar', mime: 'application/vnd.rar', en: 'RAR archive', ru: 'Архив RAR', category: 'application', signature: 'Rar!' },
  { ext: '.7z', mime: 'application/x-7z-compressed', en: '7-Zip archive', ru: 'Архив 7-Zip', category: 'application', signature: '37 7A BC AF' },
  { ext: '.wasm', mime: 'application/wasm', en: 'WebAssembly binary', ru: 'Бинарный WebAssembly', category: 'application', signature: '00 61 73 6D' },
  { ext: '.doc', mime: 'application/msword', en: 'Microsoft Word document', ru: 'Документ Microsoft Word', category: 'application' },
  { ext: '.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', en: 'Word Open XML document', ru: 'Документ Word Open XML', category: 'application', signature: 'PK 03 04' },
  { ext: '.xls', mime: 'application/vnd.ms-excel', en: 'Microsoft Excel workbook', ru: 'Книга Microsoft Excel', category: 'application' },
  { ext: '.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', en: 'Excel Open XML workbook', ru: 'Книга Excel Open XML', category: 'application', signature: 'PK 03 04' },
  { ext: '.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', en: 'PowerPoint presentation', ru: 'Презентация PowerPoint', category: 'application', signature: 'PK 03 04' },
  { ext: '.epub', mime: 'application/epub+zip', en: 'EPUB ebook', ru: 'Электронная книга EPUB', category: 'application', signature: 'PK 03 04' },
  { ext: '.apk', mime: 'application/vnd.android.package-archive', en: 'Android application package', ru: 'Пакет приложения Android', category: 'application', signature: 'PK 03 04' },
  { ext: '.bin', mime: 'application/octet-stream', en: 'Generic binary data', ru: 'Произвольные бинарные данные', category: 'application' },
  { ext: '.png', mime: 'image/png', en: 'PNG image', ru: 'Изображение PNG', category: 'image', signature: '89 50 4E 47' },
  { ext: '.jpg', mime: 'image/jpeg', en: 'JPEG image', ru: 'Изображение JPEG', category: 'image', signature: 'FF D8 FF' },
  { ext: '.jpeg', mime: 'image/jpeg', en: 'JPEG image', ru: 'Изображение JPEG', category: 'image', signature: 'FF D8 FF' },
  { ext: '.gif', mime: 'image/gif', en: 'GIF image or animation', ru: 'Изображение или анимация GIF', category: 'image', signature: 'GIF87a / GIF89a' },
  { ext: '.webp', mime: 'image/webp', en: 'WebP image', ru: 'Изображение WebP', category: 'image', signature: 'RIFF...WEBP' },
  { ext: '.svg', mime: 'image/svg+xml', en: 'SVG vector image', ru: 'Векторное изображение SVG', category: 'image', signature: '<svg' },
  { ext: '.avif', mime: 'image/avif', en: 'AVIF image', ru: 'Изображение AVIF', category: 'image' },
  { ext: '.heic', mime: 'image/heic', en: 'HEIC image', ru: 'Изображение HEIC', category: 'image' },
  { ext: '.ico', mime: 'image/x-icon', en: 'Icon file', ru: 'Файл иконки', category: 'image', signature: '00 00 01 00' },
  { ext: '.tiff', mime: 'image/tiff', en: 'TIFF image', ru: 'Изображение TIFF', category: 'image', signature: 'II*. / MM.*' },
  { ext: '.mp3', mime: 'audio/mpeg', en: 'MP3 audio', ru: 'Аудио MP3', category: 'audio', signature: 'ID3 / FF FB' },
  { ext: '.wav', mime: 'audio/wav', en: 'WAV audio', ru: 'Аудио WAV', category: 'audio', signature: 'RIFF...WAVE' },
  { ext: '.ogg', mime: 'audio/ogg', en: 'OGG audio', ru: 'Аудио OGG', category: 'audio', signature: 'OggS' },
  { ext: '.flac', mime: 'audio/flac', en: 'FLAC audio', ru: 'Аудио FLAC', category: 'audio', signature: 'fLaC' },
  { ext: '.m4a', mime: 'audio/mp4', en: 'MPEG-4 audio', ru: 'Аудио MPEG-4', category: 'audio' },
  { ext: '.opus', mime: 'audio/opus', en: 'Opus audio', ru: 'Аудио Opus', category: 'audio' },
  { ext: '.mp4', mime: 'video/mp4', en: 'MP4 video', ru: 'Видео MP4', category: 'video', signature: '...ftyp' },
  { ext: '.webm', mime: 'video/webm', en: 'WebM video', ru: 'Видео WebM', category: 'video', signature: '1A 45 DF A3' },
  { ext: '.avi', mime: 'video/x-msvideo', en: 'AVI video', ru: 'Видео AVI', category: 'video', signature: 'RIFF...AVI' },
  { ext: '.mov', mime: 'video/quicktime', en: 'QuickTime video', ru: 'Видео QuickTime', category: 'video', signature: '...ftypqt' },
  { ext: '.mkv', mime: 'video/x-matroska', en: 'Matroska video', ru: 'Видео Matroska', category: 'video', signature: '1A 45 DF A3' },
  { ext: '.woff', mime: 'font/woff', en: 'WOFF font', ru: 'Шрифт WOFF', category: 'font', signature: 'wOFF' },
  { ext: '.woff2', mime: 'font/woff2', en: 'WOFF2 font', ru: 'Шрифт WOFF2', category: 'font', signature: 'wOF2' },
  { ext: '.ttf', mime: 'font/ttf', en: 'TrueType font', ru: 'Шрифт TrueType', category: 'font', signature: '00 01 00 00' },
  { ext: '.otf', mime: 'font/otf', en: 'OpenType font', ru: 'Шрифт OpenType', category: 'font', signature: 'OTTO' },
];

interface MagicResult {
  mime: string;
  ext: string;
  signature: string;
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((value, index) => bytes[offset + index] === value);
}

function detectMagic(bytes: Uint8Array): MagicResult | null {
  if (startsWith(bytes, [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])) return { mime: 'image/png', ext: '.png', signature: '89 50 4E 47' };
  if (startsWith(bytes, [0xff,0xd8,0xff])) return { mime: 'image/jpeg', ext: '.jpg', signature: 'FF D8 FF' };
  if (startsWith(bytes, [0x47,0x49,0x46,0x38])) return { mime: 'image/gif', ext: '.gif', signature: 'GIF8' };
  if (startsWith(bytes, [0x25,0x50,0x44,0x46,0x2d])) return { mime: 'application/pdf', ext: '.pdf', signature: '%PDF-' };
  if (startsWith(bytes, [0x50,0x4b,0x03,0x04]) || startsWith(bytes, [0x50,0x4b,0x05,0x06])) return { mime: 'application/zip', ext: '.zip', signature: 'PK 03 04' };
  if (startsWith(bytes, [0x1f,0x8b])) return { mime: 'application/gzip', ext: '.gz', signature: '1F 8B' };
  if (startsWith(bytes, [0x37,0x7a,0xbc,0xaf,0x27,0x1c])) return { mime: 'application/x-7z-compressed', ext: '.7z', signature: '37 7A BC AF' };
  if (startsWith(bytes, [0x52,0x61,0x72,0x21])) return { mime: 'application/vnd.rar', ext: '.rar', signature: 'Rar!' };
  if (startsWith(bytes, [0x00,0x61,0x73,0x6d])) return { mime: 'application/wasm', ext: '.wasm', signature: '00 61 73 6D' };
  if (startsWith(bytes, [0x00,0x00,0x01,0x00])) return { mime: 'image/x-icon', ext: '.ico', signature: '00 00 01 00' };
  if (startsWith(bytes, [0x77,0x4f,0x46,0x46])) return { mime: 'font/woff', ext: '.woff', signature: 'wOFF' };
  if (startsWith(bytes, [0x77,0x4f,0x46,0x32])) return { mime: 'font/woff2', ext: '.woff2', signature: 'wOF2' };
  if (startsWith(bytes, [0x4f,0x54,0x54,0x4f])) return { mime: 'font/otf', ext: '.otf', signature: 'OTTO' };
  if (startsWith(bytes, [0x66,0x4c,0x61,0x43])) return { mime: 'audio/flac', ext: '.flac', signature: 'fLaC' };
  if (startsWith(bytes, [0x4f,0x67,0x67,0x53])) return { mime: 'audio/ogg', ext: '.ogg', signature: 'OggS' };
  if (startsWith(bytes, [0x49,0x44,0x33])) return { mime: 'audio/mpeg', ext: '.mp3', signature: 'ID3' };
  if (startsWith(bytes, [0x52,0x49,0x46,0x46]) && startsWith(bytes, [0x57,0x45,0x42,0x50], 8)) return { mime: 'image/webp', ext: '.webp', signature: 'RIFF...WEBP' };
  if (startsWith(bytes, [0x52,0x49,0x46,0x46]) && startsWith(bytes, [0x57,0x41,0x56,0x45], 8)) return { mime: 'audio/wav', ext: '.wav', signature: 'RIFF...WAVE' };
  return null;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export default function MimeTypes() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MimeCategory | 'all'>('all');
  const [copiedMime, setCopiedMime] = useState('');
  const [fileName, setFileName] = useState('');
  const [magic, setMagic] = useState<MagicResult | null | undefined>(undefined);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase().replace(/^\*?/, '');
    return MIME_TYPES.filter((entry) => {
      if (category !== 'all' && entry.category !== category) return false;
      if (!query) return true;
      return entry.ext.toLocaleLowerCase().includes(query)
        || entry.mime.toLocaleLowerCase().includes(query)
        || entry.en.toLocaleLowerCase().includes(query)
        || entry.ru.toLocaleLowerCase().includes(query);
    });
  }, [category, search]);

  const copyMime = useCallback(async (mime: string) => {
    if (await writeClipboardText(mime)) {
      setCopiedMime(mime);
      window.setTimeout(() => setCopiedMime((current) => current === mime ? '' : current), 1400);
    }
  }, []);

  const inspectFile = useCallback(async (file: File) => {
    setFileName(file.name);
    const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    setMagic(detectMagic(bytes));
  }, []);

  const downloadCsv = useCallback(() => {
    const header = 'extension,mime,description,signature,category';
    const rows = filtered.map((entry) => [entry.ext, entry.mime, isEn ? entry.en : entry.ru, entry.signature ?? '', entry.category].map(csvCell).join(','));
    downloadBlob(new Blob(['\uFEFF', [header, ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8' }), 'mime-types.csv');
  }, [filtered, isEn]);

  const categoryLabels: Record<MimeCategory, { en: string; ru: string }> = {
    text: { en: 'Text', ru: 'Текст' },
    image: { en: 'Images', ru: 'Изображения' },
    audio: { en: 'Audio', ru: 'Аудио' },
    video: { en: 'Video', ru: 'Видео' },
    application: { en: 'Documents and data', ru: 'Документы и данные' },
    font: { en: 'Fonts', ru: 'Шрифты' },
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <input ref={fileInputRef} type="file" data-file-paste-target="true" className="hidden" onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void inspectFile(file);
      }} />

      <Card className="p-4 sm:p-5">
        <div className="relative">
          <MagnifyingGlass size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input
            id="mime-search"
            className="h-14 pl-12 text-lg"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={isEn ? 'Search extension or MIME type' : 'Расширение или MIME-тип'}
            aria-label={isEn ? 'Search MIME types' : 'Поиск MIME-типов'}
            autoFocus
          />
        </div>
        <div className="mt-2 text-xs text-[var(--color-text-muted)]">{isEn ? `${filtered.length} matching entries` : `Найдено: ${filtered.length}`}</div>
      </Card>

      <div className="space-y-2" aria-live="polite">
        {filtered.length > 0 ? filtered.map((entry) => (
          <button key={`${entry.ext}-${entry.mime}`} type="button" onClick={() => void copyMime(entry.mime)} className="flex min-h-16 w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/30 sm:p-4">
            <span className="min-w-16 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-2 py-1 text-center font-mono font-bold text-[var(--color-primary)]">{entry.ext}</span>
            <span className="min-w-0 flex-1">
              <span className="block break-all font-mono text-sm font-semibold">{entry.mime}</span>
              <span className="mt-1 block text-sm text-[var(--color-text-muted)]">{isEn ? entry.en : entry.ru}{entry.signature ? ` · ${entry.signature}` : ''}</span>
            </span>
            {copiedMime === entry.mime ? <CheckCircle size={22} weight="fill" className="shrink-0 text-[var(--color-success)]" /> : null}
          </button>
        )) : (
          <Card className="p-6 text-center text-sm text-[var(--color-text-muted)]">{isEn ? 'No matching MIME type.' : 'Подходящий MIME-тип не найден.'}</Card>
        )}
      </div>

      <AdvancedSettings title={isEn ? 'Category, file signature and CSV' : 'Категория, сигнатура файла и CSV'} description={isEn ? 'Optional filters and local file inspection' : 'Дополнительные фильтры и локальная проверка файла'}>
        <div className="space-y-4">
          <div>
            <label htmlFor="mime-category" className="text-sm font-medium">{isEn ? 'Category' : 'Категория'}</label>
            <select id="mime-category" className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" value={category} onChange={(event) => setCategory(event.target.value as MimeCategory | 'all')}>
              <option value="all">{isEn ? 'All categories' : 'Все категории'}</option>
              {(Object.keys(categoryLabels) as MimeCategory[]).map((key) => <option key={key} value={key}>{isEn ? categoryLabels[key].en : categoryLabels[key].ru}</option>)}
            </select>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
            <div className="text-sm font-semibold">{isEn ? 'Inspect file signature' : 'Проверить сигнатуру файла'}</div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{isEn ? 'Only the first 32 bytes are read locally.' : 'Локально читаются только первые 32 байта.'}</p>
            <Button variant="outline" className="mt-3 min-h-11" onClick={() => fileInputRef.current?.click()}>
              <FileArrowUp size={18} /> {fileName || (isEn ? 'Choose file' : 'Выбрать файл')}
            </Button>
            {magic !== undefined ? (
              <div className={cn('mt-3 rounded-[var(--radius-sm)] p-3 text-sm', magic ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]')}>
                {magic ? `${magic.ext} · ${magic.mime} · ${magic.signature}` : (isEn ? 'Signature not recognized. The file may still be valid.' : 'Сигнатура не распознана. Файл всё равно может быть корректным.')}
              </div>
            ) : null}
          </div>

          <Button variant="outline" className="min-h-11" onClick={downloadCsv} disabled={filtered.length === 0}>
            <Download size={18} /> {isEn ? 'Download current CSV' : 'Скачать текущий CSV'}
          </Button>
        </div>
      </AdvancedSettings>
    </div>
  );
}
