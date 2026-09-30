'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/src/lib/cn';
import { Kbd } from '@/src/components/ui/kbd';

const SearchDialog = dynamic(
  () => import('@/src/components/SearchDialog'),
  { ssr: false }
);

interface Props {
  variant?: 'header' | 'hero';
  placeholder?: string;
  className?: string;
  enableShortcut?: boolean;
}

export function SearchTrigger({
  variant = 'header',
  placeholder = 'Поиск инструментов…',
  className,
  enableShortcut = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enableShortcut) return;
    const trigger = triggerRef.current;
    trigger?.setAttribute('data-search-shortcut-ready', 'true');
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (!inEditable && e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      trigger?.removeAttribute('data-search-shortcut-ready');
    };
  }, [enableShortcut]);

  const isHero = variant === 'hero';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={placeholder}
        title={placeholder}
        className={cn(
          isHero
            ? 'flex h-12 w-full max-w-2xl items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] sm:h-14 sm:gap-3 sm:px-5 sm:text-base'
            : 'flex h-10 w-full max-w-72 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-left text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)]',
          className
        )}
      >
        <MagnifyingGlass size={isHero ? 20 : 16} className="shrink-0" />
        <span className="flex-1 truncate">{placeholder}</span>
        <Kbd className={cn('hidden sm:inline-flex', isHero ? 'h-7 px-2 text-xs' : '')}>Ctrl K</Kbd>
      </button>
      {open ? <SearchDialog open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
