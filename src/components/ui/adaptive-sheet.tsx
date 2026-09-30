'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useMediaQuery } from '@/src/hooks/useMediaQuery';

export interface AdaptiveSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly trigger?: React.ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function AdaptiveSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className = '',
}: AdaptiveSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          className={
            isDesktop
              ? `fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-card p-6 shadow-2xl border ${className}`
              : `fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl border-t ${className}`
          }
        >
          {/* Mobile Drag Indicator Handle */}
          {!isDesktop && (
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          )}

          {title && (
            <DialogPrimitive.Title className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </DialogPrimitive.Title>
          )}

          {description && (
            <DialogPrimitive.Description className="text-xs text-muted-foreground mt-1 mb-4">
              {description}
            </DialogPrimitive.Description>
          )}

          <div className="min-w-0 max-w-full">{children}</div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary focus:outline-none">
            ✕
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
