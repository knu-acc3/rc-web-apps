import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
        primary: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
        success: 'bg-[color-mix(in_oklab,var(--color-success)_14%,transparent)] text-[var(--color-success)]',
        warning: 'bg-[color-mix(in_oklab,var(--color-warning)_18%,transparent)] text-[color-mix(in_oklab,var(--color-warning)_70%,black)]',
        danger:  'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
        outline: 'border border-[var(--color-border-strong)] text-[var(--color-text-muted)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
