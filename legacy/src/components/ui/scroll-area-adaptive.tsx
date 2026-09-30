'use client';

import React from 'react';

export interface ScrollAreaAdaptiveProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly maxHeight?: string | number;
  readonly orientation?: 'vertical' | 'horizontal' | 'both';
  readonly className?: string;
}

export function ScrollAreaAdaptive({
  children,
  maxHeight,
  orientation = 'vertical',
  className = '',
  style,
  ...props
}: ScrollAreaAdaptiveProps) {
  const overflowStyle: React.CSSProperties = {
    overflowY: orientation === 'vertical' || orientation === 'both' ? 'auto' : 'hidden',
    overflowX: orientation === 'horizontal' || orientation === 'both' ? 'auto' : 'hidden',
    maxHeight: maxHeight ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
    WebkitOverflowScrolling: 'touch',
    ...style,
  };

  return (
    <div
      style={overflowStyle}
      className={`w-full max-w-full min-w-0 overscroll-contain ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
