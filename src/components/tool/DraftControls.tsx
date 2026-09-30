'use client';

import React from 'react';
import { ArrowCounterClockwise, Trash, Check } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';

export interface DraftControlsProps {
  hasDraft: boolean;
  isDirty: boolean;
  onRestore?: () => void;
  onClear: () => void;
  locale?: string;
}

export function DraftControls({
  hasDraft,
  isDirty,
  onRestore,
  onClear,
  locale = 'ru',
}: DraftControlsProps) {
  const isEn = locale === 'en';

  if (!hasDraft && !isDirty) return null;

  return (
    <div
      data-tool-draft-controls=""
      className="flex items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/50 px-3 py-1.5 text-xs text-[var(--color-text-muted)]"
    >
      <span className="inline-flex items-center gap-1 font-medium">
        <Check size={14} className="text-[var(--color-success)]" />
        {isEn ? 'Draft saved' : 'Черновик сохранён'}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        {onRestore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRestore}
            className="h-7 px-2 text-xs"
            title={isEn ? 'Restore saved draft' : 'Восстановить черновик'}
          >
            <ArrowCounterClockwise size={13} />
            {isEn ? 'Restore' : 'Восстановить'}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
          title={isEn ? 'Clear draft' : 'Очистить черновик'}
        >
          <Trash size={13} />
          {isEn ? 'Clear' : 'Очистить'}
        </Button>
      </div>
    </div>
  );
}
