import * as React from 'react';
import { cn } from '@/src/lib/cn';

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_MAP: Record<Size, string> = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
  full: 'max-w-none',
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Size;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mx-auto w-full px-3 sm:px-6 lg:px-8', SIZE_MAP[size], className)}
      {...props}
    />
  )
);
Container.displayName = 'Container';
