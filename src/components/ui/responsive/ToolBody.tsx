import * as React from 'react';
import { cn } from '@/src/lib/cn';

type Variant = 'card' | 'bare';
type Padding = 'fluid' | 'compact' | 'none';

export interface ToolBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
}

const PADDING: Record<Padding, string> = {
  fluid: 'px-[var(--space-tool-x)] py-[var(--space-tool-y)]',
  compact: 'p-3 sm:p-4 md:p-6',
  none: '',
};

export const ToolBody = React.forwardRef<HTMLDivElement, ToolBodyProps>(
  ({ className, variant = 'card', padding = 'fluid', ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'tool-body',
        variant === 'card' &&
          'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  ),
);
ToolBody.displayName = 'ToolBody';
