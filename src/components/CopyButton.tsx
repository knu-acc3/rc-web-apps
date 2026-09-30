'use client';

import { Copy, Check } from '@phosphor-icons/react';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Button } from '@/src/components/ui/button';
import { useCopyWithToast } from '@/src/hooks/useCopyWithToast';
import { cn } from '@/src/lib/cn';
import { writeClipboardText } from '@/src/utils/clipboard';

/**
 * Imperative clipboard copy with fallback for older browsers.
 * Retained as a public helper because tools call it directly outside the
 * <CopyButton> component.
 */
export async function copyText(text: string): Promise<boolean> {
  return writeClipboardText(text);
}

interface CopyButtonProps {
  text: string;
  size?: 'small' | 'medium';
  tooltip?: string;
  className?: string;
  /** Silence sonner toast (inline icon only) */
  silent?: boolean;
}

/**
 * Drop-in copy button used across 30+ tools. Internally delegates to
 * `useCopyWithToast` so all uses share unified behaviour:
 *  - sonner toast notification on success
 *  - 1.5s inline check-icon flip
 *  - graceful fallback for permission-denied / non-HTTPS contexts
 */
export function CopyButton({ text, size = 'small', tooltip, className, silent }: CopyButtonProps) {
  const { locale } = useLanguage();
  const { copied, copy } = useCopyWithToast();
  const defaultTooltip = locale === 'en' ? 'Copy' : 'Копировать';
  const copiedLabel = locale === 'en' ? 'Copied!' : 'Скопировано!';
  const successMessage = locale === 'en' ? 'Copied' : 'Скопировано';

  return (
    <Button
      type="button"
      variant={copied ? 'soft' : 'ghost'}
      size={size === 'small' ? 'icon-sm' : 'icon'}
      onClick={() => void copy(text, { successMessage, showToast: !silent })}
      title={copied ? copiedLabel : tooltip || defaultTooltip}
      aria-label={copied ? copiedLabel : tooltip || defaultTooltip}
      className={cn(copied && 'text-[var(--color-success)]', className)}
    >
      {copied ? (
        <Check size={size === 'small' ? 16 : 20} weight="bold" />
      ) : (
        <Copy size={size === 'small' ? 16 : 20} />
      )}
    </Button>
  );
}
