'use client';

import { DownloadSimple } from '@phosphor-icons/react';
import { useCallback } from 'react';
import { CopyWithToast } from '@/src/components/tool/CopyWithToast';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/cn';
import { downloadBlob } from '@/src/utils/exportHelpers';

interface CalculationSummaryActionsProps {
  summary: string;
  fileBaseName: string;
  isEn: boolean;
  className?: string;
}

export function CalculationSummaryActions({
  summary,
  fileBaseName,
  isEn,
  className,
}: CalculationSummaryActionsProps) {
  const disabled = summary.trim().length === 0;

  const downloadSummary = useCallback(() => {
    if (disabled) return;
    downloadBlob(new Blob([summary], { type: 'text/plain;charset=utf-8' }), `${fileBaseName}.txt`);
  }, [disabled, fileBaseName, summary]);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <CopyWithToast
        text={() => summary}
        variant="inline"
        size="sm"
        label={isEn ? 'Copy summary' : 'Копировать сводку'}
        ariaLabel={isEn ? 'Copy calculation summary' : 'Копировать сводку расчёта'}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={downloadSummary}
        disabled={disabled}
        aria-label={isEn ? 'Download calculation summary' : 'Скачать сводку расчёта'}
      >
        <DownloadSimple size={14} />
        TXT
      </Button>
    </div>
  );
}
