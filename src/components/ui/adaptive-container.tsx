import React from 'react';

export interface AdaptiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly as?: 'div' | 'section' | 'article' | 'main';
}

export function AdaptiveContainer({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: AdaptiveContainerProps) {
  return (
    <Component
      style={{ containerType: 'inline-size' }}
      className={`w-full max-w-full min-w-0 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
