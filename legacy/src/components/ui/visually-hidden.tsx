import React from 'react';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly children: React.ReactNode;
  readonly as?: 'span' | 'div';
}

export function VisuallyHidden({
  children,
  as: Component = 'span',
  className = '',
  style,
  ...props
}: VisuallyHiddenProps) {
  return (
    <Component
      style={{
        position: 'absolute',
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
        ...style,
      }}
      className={`sr-only ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
