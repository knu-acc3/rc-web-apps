import * as React from 'react';
import { cn } from '@/src/lib/cn';

export const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <kbd
      ref={ref}
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 font-mono text-[10px] font-semibold text-[var(--color-text-muted)] shadow-[0_1px_0_var(--color-border-strong)]',
        className
      )}
      {...props}
    />
  )
);
Kbd.displayName = 'Kbd';
