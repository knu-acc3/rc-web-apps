import * as React from 'react';
import { cn } from '@/src/lib/cn';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-base transition-colors placeholder:text-[var(--color-text-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 resize-y sm:text-sm',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
