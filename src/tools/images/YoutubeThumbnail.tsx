'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ClipboardText,
  Copy,
  Download,
  YoutubeLogo,
  MagnifyingGlass,
  Image as ImageIcon,
  X,
  ArrowSquareOut,
} from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Card } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { useClipboardPaste } from '@/src/hooks/useClipboardPaste';
import { useCopyWithToast } from '@/src/hooks/useCopyWithToast';
import { downloadBlob } from '@/src/utils/exportHelpers';
import { cn } from '@/src/lib/cn';
import { AdvancedSettings } from '@/src/components/tool/AdvancedSettings';

interface ThumbnailVariant {
  key: string;
  filename: string;
  width: number;
  height: number;
  label: string;
}

const THUMBNAIL_VARIANTS: ThumbnailVariant[] = [
  { key: 'maxres', filename: 'maxresdefault.jpg', width: 1280, height: 720, label: 'Max Resolution' },
  { key: 'sd', filename: 'sddefault.jpg', width: 640, height: 480, label: 'Standard' },
  { key: 'hq', filename: 'hqdefault.jpg', width: 480, height: 360, label: 'High Quality' },
  { key: 'mq', filename: 'mqdefault.jpg', width: 320, height: 180, label: 'Medium Quality' },
  { key: 'default', filename: 'default.jpg', width: 120, height: 90, label: 'Default' },
];

const FRAME_VARIANTS: ThumbnailVariant[] = [
  { key: 'frame1', filename: '1.jpg', width: 120, height: 90, label: 'Frame 1 (Start)' },
  { key: 'frame2', filename: '2.jpg', width: 120, height: 90, label: 'Frame 2 (Middle)' },
  { key: 'frame3', filename: '3.jpg', width: 120, height: 90, label: 'Frame 3 (End)' },
];

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function getThumbnailUrl(videoId: string, filename: string): string {
  return `https://img.youtube.com/vi/${videoId}/${filename}`;
}

async function downloadViaCanvas(url: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(false); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(false); return; }
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        resolve(true);
      }, 'image/jpeg');
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function downloadImage(url: string, filename: string) {
  const ok = await downloadViaCanvas(url, filename);
  if (!ok) {
    window.open(url, '_blank');
  }
}

export default function YoutubeThumbnail() {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const { pasteText, pasting } = useClipboardPaste();
  const { copied, copy } = useCopyWithToast({
    successMessage: isEn ? 'Copied thumbnail URL' : 'URL миниатюры скопирован',
  });

  const [inputUrl, setInputUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableThumbnails, setAvailableThumbnails] = useState<Set<string>>(new Set());

  const availableVariants = useMemo(() => {
    if (!videoId) return [];
    return [...THUMBNAIL_VARIANTS, ...FRAME_VARIANTS]
      .filter((variant) => availableThumbnails.has(variant.key))
      .map((variant) => ({
        ...variant,
        url: getThumbnailUrl(videoId, variant.filename),
      }));
  }, [availableThumbnails, videoId]);

  const bestVariant = availableVariants[0] ?? null;
  const bestThumbnailUrl = bestVariant?.url ?? '';

  const checkThumbnailAvailability = useCallback(async (vid: string) => {
    const available = new Set<string>();
    const checks = [...THUMBNAIL_VARIANTS, ...FRAME_VARIANTS].map((variant) => {
      const url = getThumbnailUrl(vid, variant.filename);
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          // YouTube returns 120×90 placeholder for missing variants — filter them out
          if ((variant.key === 'maxres' || variant.key === 'sd') && img.naturalWidth <= 120) {
            resolve();
            return;
          }
          available.add(variant.key);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    });
    await Promise.all(checks);
    return available;
  }, []);

  const fetchVideoTitle = useCallback(async (vid: string) => {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${vid}`;
      const resp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.title) return data.title as string;
      }
    } catch {
      // Title fetch optional
    }
    return '';
  }, []);

  const handleExtract = useCallback(async () => {
    setError('');
    setVideoId(null);
    setVideoTitle('');
    setAvailableThumbnails(new Set());

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setError(isEn ? 'Please enter a YouTube URL' : 'Введите ссылку на YouTube');
      return;
    }

    const vid = extractVideoId(trimmed);
    if (!vid) {
      setError(isEn ? 'Could not extract video ID. Check the URL format.' : 'Не удалось извлечь ID видео. Проверьте формат ссылки.');
      return;
    }

    setLoading(true);
    try {
      const [available, title] = await Promise.all([
        checkThumbnailAvailability(vid),
        fetchVideoTitle(vid),
      ]);

      if (available.size === 0) {
        setError(isEn ? 'No thumbnails found. The video may not exist or is private.' : 'Миниатюры не найдены. Видео может не существовать или быть приватным.');
        setLoading(false);
        return;
      }

      setVideoId(vid);
      setVideoTitle(title);
      setAvailableThumbnails(available);
    } catch {
      setError(isEn ? 'Something went wrong. Please try again.' : 'Что-то пошло не так. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  }, [inputUrl, isEn, checkThumbnailAvailability, fetchVideoTitle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleExtract();
  }, [handleExtract]);

  const handlePaste = useCallback(async () => {
    const text = await pasteText();
    if (!text) return;
    setInputUrl(text.trim());
    setError('');
  }, [pasteText]);

  const handleDownloadBest = useCallback(async () => {
    if (!videoId || !bestVariant) return;
    await downloadImage(bestVariant.url, `${videoId}-${bestVariant.filename}`);
  }, [bestVariant, videoId]);

  const handleCopyBestUrl = useCallback(() => {
    if (!bestThumbnailUrl) return;
    void copy(bestThumbnailUrl);
  }, [bestThumbnailUrl, copy]);

  const handleDownloadUrlList = useCallback(() => {
    if (!videoId || availableVariants.length === 0) return;

    const lines = [
      videoTitle || (isEn ? 'YouTube thumbnail report' : 'Отчёт по миниатюрам YouTube'),
      `Video ID: ${videoId}`,
      `Video URL: https://www.youtube.com/watch?v=${videoId}`,
      '',
      ...availableVariants.map((variant) => (
        `${variant.label} (${variant.width}x${variant.height}): ${variant.url}`
      )),
    ];

    downloadBlob(
      new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }),
      `${videoId}-thumbnail-urls.txt`,
    );
  }, [availableVariants, isEn, videoId, videoTitle]);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="mb-3 p-4 sm:p-6">
        <div className="mb-2 flex items-center gap-2">
          <YoutubeLogo size={20} weight="fill" style={{ color: '#FF0000' }} />
          <span className="text-sm font-semibold">
            {isEn ? 'YouTube Thumbnail Extractor' : 'Извлечение миниатюр YouTube'}
          </span>
        </div>

        <div className="grid gap-2 min-[460px]:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            placeholder={isEn
              ? 'Paste YouTube URL (watch, shorts, embed, youtu.be)'
              : 'Вставьте ссылку YouTube (watch, shorts, embed, youtu.be)'}
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              setVideoId(null);
              setVideoTitle('');
              setAvailableThumbnails(new Set());
            }}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleExtract} disabled={loading} variant={videoId ? 'outline' : 'primary'} className="tool-primary-action whitespace-nowrap">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <MagnifyingGlass size={16} />
            )}
            {loading ? (isEn ? 'Loading...' : 'Загрузка...') : (isEn ? 'Extract' : 'Извлечь')}
          </Button>
        </div>

        <AdvancedSettings title={isEn ? 'Input options' : 'Дополнительно'} className="mt-3">
          <Button type="button" variant="outline" onClick={handlePaste} disabled={pasting || loading}>
            <ClipboardText size={16} />
            {pasting ? (isEn ? 'Pasting...' : 'Вставка...') : (isEn ? 'Paste from clipboard' : 'Вставить из буфера')}
          </Button>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {isEn ? 'Watch, Shorts, Embed, youtu.be links and plain video IDs are supported.' : 'Поддерживаются ссылки Watch, Shorts, Embed, youtu.be и обычный ID видео.'}
          </p>
        </AdvancedSettings>

      </Card>

      {error && (
        <div className="mb-3 flex items-start justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      )}

      {videoId && (
        <>
          <Card className="mb-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                {videoTitle && (
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold">
                    {videoTitle}
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">ID: {videoId}</Badge>
                  <Badge variant="outline">{availableThumbnails.size} {isEn ? 'resolutions' : 'разрешений'}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownloadBest} className="whitespace-nowrap">
                  <Download size={16} />
                  {isEn ? 'Download best quality' : 'Скачать лучшее качество'}
                </Button>
              </div>
            </div>
            {bestThumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bestThumbnailUrl} alt={isEn ? 'Best thumbnail' : 'Лучшее превью'} className="mt-4 w-full rounded-[var(--radius-md)] border border-[var(--color-border)]" />
            )}
          </Card>

          <AdvancedSettings
            title={isEn ? 'All resolutions and links' : 'Все размеры и ссылки'}
            className="mb-3"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener')}>
                <ArrowSquareOut size={16} /> {isEn ? 'Open video' : 'Открыть видео'}
              </Button>
              <Button variant="outline" onClick={handleCopyBestUrl} disabled={!bestThumbnailUrl}>
                <Copy size={16} /> {copied ? (isEn ? 'Copied' : 'Скопировано') : (isEn ? 'Copy URL' : 'Копировать URL')}
              </Button>
              <Button variant="outline" onClick={handleDownloadUrlList} disabled={availableVariants.length === 0}>
                <Download size={16} /> {isEn ? 'Download URL list' : 'Скачать список URL'}
              </Button>
            </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...THUMBNAIL_VARIANTS, ...FRAME_VARIANTS].map((variant) => {
              const isAvailable = availableThumbnails.has(variant.key);
              const thumbUrl = getThumbnailUrl(videoId, variant.filename);
              return (
                <Card
                  key={variant.key}
                  className={cn('p-3 sm:p-4 transition-opacity', !isAvailable && 'opacity-50')}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <ImageIcon
                      size={16}
                      className={isAvailable ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}
                    />
                    <span className="flex-1 text-sm font-semibold">{variant.label}</span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {variant.width}x{variant.height}
                    </Badge>
                  </div>

                  <div
                    className="relative mb-2 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]"
                    style={{ aspectRatio: `${variant.width}/${variant.height}` }}
                  >
                    {isAvailable ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- remote thumbnail URLs are user-provided previews, not app assets. */
                      <img
                        src={thumbUrl}
                        alt={`${variant.label} thumbnail`}
                        className="block h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {isEn ? 'Not available' : 'Недоступно'}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={!isAvailable}
                    onClick={() => downloadImage(thumbUrl, `${videoId}-${variant.filename}`)}
                  >
                    <Download size={14} />
                    {isEn ? 'Download' : 'Скачать'} {variant.filename}
                  </Button>
                </Card>
              );
            })}
          </div>
          </AdvancedSettings>
        </>
      )}

    </div>
  );
}
