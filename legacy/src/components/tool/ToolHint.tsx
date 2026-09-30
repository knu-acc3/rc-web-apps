'use client';

import { Info } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/src/lib/cn';

interface ToolHintProps {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

export function ToolHint({ title, children, className, defaultOpen = false }: ToolHintProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group mt-4 rounded-[var(--radius-md)] border border-[color-mix(in_oklab,var(--color-primary)_12%,transparent)] bg-[color-mix(in_oklab,var(--color-primary)_4%,transparent)] p-3 text-xs',
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-semibold text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
        <Info size={14} weight="fill" />
        <span>{title}</span>
        <span className="ml-auto text-[10px] font-bold uppercase text-[var(--color-text-subtle)] group-open:hidden">
          +
        </span>
        <span className="ml-auto hidden text-[10px] font-bold uppercase text-[var(--color-text-subtle)] group-open:inline">
          -
        </span>
      </summary>
      <div className="mt-2 text-[var(--color-text-muted)]">
        {children}
      </div>
    </details>
  );
}
