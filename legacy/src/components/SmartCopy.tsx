'use client';

import { useState } from 'react';
import { Copy, Check, DownloadSimple } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { copyText } from './CopyButton';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/cn';

interface SmartCopyProps {
  text: string;
  threshold?: number;
  fileName?: string;
  variant?: 'icon' | 'button';
  size?: 'small' | 'medium';
}

export default function SmartCopy({
  text,
  threshold = 50000,
  fileName = 'output.txt',
  variant = 'icon',
  size = 'small',
}: SmartCopyProps) {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const [copied, setCopied] = useState(false);

  const textBytes = new Blob([text]).size;
  const isLarge = textBytes > threshold;

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (variant === 'button') {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        {!isLarge && (
          <Button
            size={size === 'small' ? 'sm' : 'md'}
            variant={copied ? 'soft' : 'outline'}
            onClick={handleCopy}
            className={cn(copied && 'text-[var(--color-success)]')}
          >
            {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
            {copied ? (isEn ? 'Copied!' : 'Скопировано!') : isEn ? 'Copy' : 'Копировать'}
          </Button>
        )}
        {isLarge && (
          <Button
            size={size === 'small' ? 'sm' : 'md'}
            variant="outline"
            onClick={handleDownload}
          >
            <DownloadSimple size={16} />
            {isEn ? 'Download as .txt' : 'Скачать как .txt'}
          </Button>
        )}
        {isLarge && (
          <Button
            size={size === 'small' ? 'sm' : 'md'}
            variant="ghost"
            onClick={handleCopy}
            className={cn(copied && 'text-[var(--color-success)]')}
          >
            {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
            {copied ? (isEn ? 'Copied!' : 'Скопировано!') : isEn ? 'Try copy' : 'Копировать'}
          </Button>
        )}
      </div>
    );
  }

  const iconSize = size === 'small' ? 16 : 20;

  return (
    <div className="inline-flex items-center gap-1">
      {isLarge && (
        <Button
          size={size === 'small' ? 'icon-sm' : 'icon'}
          variant="ghost"
          onClick={handleDownload}
          title={isEn ? 'Download as .txt' : 'Скачать как .txt'}
          aria-label={isEn ? 'Download as .txt' : 'Скачать как .txt'}
        >
          <DownloadSimple size={iconSize} />
        </Button>
      )}
      <Button
        size={size === 'small' ? 'icon-sm' : 'icon'}
        variant={copied ? 'soft' : 'ghost'}
        onClick={handleCopy}
        title={copied ? (isEn ? 'Copied!' : 'Скопировано!') : isEn ? 'Copy' : 'Копировать'}
        aria-label={copied ? (isEn ? 'Copied!' : 'Скопировано!') : isEn ? 'Copy' : 'Копировать'}
        className={cn(copied && 'text-[var(--color-success)]')}
      >
        {copied ? <Check size={iconSize} weight="bold" /> : <Copy size={iconSize} />}
      </Button>
    </div>
  );
}
