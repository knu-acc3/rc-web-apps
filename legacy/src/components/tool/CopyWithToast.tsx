'use client';

import * as React from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/cn';
import { useCopyWithToast } from '@/src/hooks/useCopyWithToast';

export interface CopyWithToastProps {
  /** Text to copy. If a function, called at click time (useful for stale closures). */
  text: string | (() => string);
  /** Toast message shown on success. */
  successMessage?: string;
  /** Visual variant: 'icon' = icon-only button, 'inline' = icon + label */
  variant?: 'icon' | 'inline';
  /** Button size */
  size?: 'sm' | 'md' | 'icon-sm' | 'icon';
  /** Hide toast (only show inline check icon flip) */
  silent?: boolean;
  /** Label when variant=inline */
  label?: string;
  className?: string;
  disabled?: boolean;
  /** Aria-label for icon-only variant */
  ariaLabel?: string;
}

/**
 * Drop-in copy-to-clipboard control with unified feedback.
 * Replaces the dozen ad-hoc `useState<boolean>(false)` + setTimeout patterns
 * scattered across tools.
 */
export function CopyWithToast({
  text,
  successMessage,
  variant = 'icon',
  size,
  silent = false,
  label,
  className,
  disabled,
  ariaLabel,
}: CopyWithToastProps) {
  const { copied, copy } = useCopyWithToast();
  const onClick = React.useCallback(() => {
    const value = typeof text === 'function' ? text() : text;
    void copy(value, { successMessage, showToast: !silent });
  }, [text, successMessage, silent, copy]);

  if (variant === 'inline') {
    return (
      <Button
        type="button"
        variant={copied ? 'soft' : 'outline'}
        size={size ?? 'sm'}
        onClick={onClick}
        disabled={disabled}
        className={cn('gap-1.5 transition-colors', className)}
        aria-label={ariaLabel ?? label}
      >
        {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
        {label ?? (copied ? 'Скопировано' : 'Копировать')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size ?? 'icon-sm'}
      onClick={onClick}
      disabled={disabled}
      className={cn(copied && 'text-[var(--color-success)]', className)}
      aria-label={ariaLabel ?? 'Копировать'}
    >
      {copied ? <Check size={14} weight="bold" /> : <Copy size={14} />}
    </Button>
  );
}
