'use client';

import React, { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Fuse from 'fuse.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, ArrowRight, X, ClockCounterClockwise, Sparkle } from '@phosphor-icons/react';
import type { GlobalSearchIndexItem } from '@/src/types/search';
import { buildGlobalSearchIndex } from '@/src/lib/search/searchIndex';
import { buildDeepCatalogSearchIndex } from '@/src/lib/search/catalogSearchIndex';
import { cn } from '@/src/lib/cn';

let cachedIndex: GlobalSearchIndexItem[] | null = null;
let cachedFuse: Fuse<GlobalSearchIndexItem> | null = null;
let cachedPopular: GlobalSearchIndexItem[] | null = null;
let deepIndexLoaded = false;

function getSearchEngine(): {
  allItems: GlobalSearchIndexItem[];
  fuseInstance: Fuse<GlobalSearchIndexItem>;
  popularItems: GlobalSearchIndexItem[];
} {
  if (!cachedIndex || !cachedFuse || !cachedPopular) {
    const baseIndex = buildGlobalSearchIndex();
    cachedIndex = baseIndex;
    cachedFuse = new Fuse(baseIndex, {
      keys: [
        { name: 'titleRu', weight: 0.4 },
        { name: 'titleEn', weight: 0.4 },
        { name: 'keywords', weight: 0.25 },
        { name: 'descriptionRu', weight: 0.1 },
        { name: 'descriptionEn', weight: 0.1 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
    cachedPopular = baseIndex.filter((item) => item.isPopular).slice(0, 8);
  }
  return { allItems: cachedIndex, fuseInstance: cachedFuse, popularItems: cachedPopular };
}

function loadDeepIndexIntoEngine() {
  if (deepIndexLoaded) return;
  try {
    const deepItems = buildDeepCatalogSearchIndex();
    if (cachedIndex && cachedFuse) {
      cachedIndex.push(...deepItems);
      cachedFuse.setCollection(cachedIndex);
      deepIndexLoaded = true;
    }
  } catch {
    // ignore
  }
}

const RECENT_SEARCHES_KEY = 'rc_recent_searches';

export function GlobalSearchModal({
  isOpen,
  onClose,
  locale = 'ru',
}: {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'ru' | 'en';
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchIndexItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved).slice(0, 5) : [];
    } catch {
      return [];
    }
  });
  const [, startTransition] = useTransition();
  const isEn = locale === 'en';
  const listRef = useRef<HTMLDivElement>(null);

  const { fuseInstance, popularItems } = getSearchEngine();

  // Lazy load deep catalog index upon modal opening
  useEffect(() => {
    if (isOpen) {
      loadDeepIndexIntoEngine();
    }
  }, [isOpen]);

  const saveRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const updated = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(0);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    startTransition(() => {
      const res = fuseInstance.search(val).slice(0, 12);
      setResults(res.map((r) => r.item));
    });
  };

  const displayedItems = query.trim() ? results : popularItems;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < displayedItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayedItems.length - 1));
      } else if (e.key === 'Enter') {
        if (displayedItems[selectedIndex]) {
          e.preventDefault();
          const item = displayedItems[selectedIndex];
          const targetUrl = isEn ? item.urlEn : item.urlRu;
          saveRecentSearch(query || (isEn ? item.titleEn : item.titleRu));
          onClose();
          router.push(targetUrl);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, displayedItems, selectedIndex, query, isEn, onClose, router, saveRecentSearch]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const getCategoryLabel = (category: GlobalSearchIndexItem['category']) => {
    switch (category) {
      case 'tool': return isEn ? 'Tool' : 'Инструмент';
      case 'time-now': return isEn ? 'World Time' : 'Мировое время';
      case 'actual-size': return isEn ? 'Actual Size' : 'Размеры 1:1';
      case 'emoji': return isEn ? 'Emoji' : 'Эмодзи';
      case 'symbol': return isEn ? 'Symbols' : 'Символы';
      case 'timer': return isEn ? 'Timer' : 'Таймер';
      case 'diagnostic': return isEn ? 'Diagnostics' : 'Диагностика';
      default: return isEn ? 'Catalog' : 'Каталог';
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-[12%] -translate-x-1/2 z-50 w-[min(94vw,40rem)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-2xl overflow-hidden focus:outline-none">
          <Dialog.Title className="sr-only">
            {isEn ? 'Global Search' : 'Глобальный поиск'}
          </Dialog.Title>

          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3.5 bg-[var(--color-surface-muted)]">
            <MagnifyingGlass size={20} className="text-[var(--color-text-muted)] shrink-0" />
            <input
              type="text"
              placeholder={isEn ? 'Search all 2,500+ tools, cities, gadgets, emojis…' : 'Поиск среди 2 500+ утилит, городов, гаджетов, эмодзи…'}
              value={query}
              onChange={handleSearch}
              className="w-full bg-transparent text-[var(--color-text)] placeholder-[var(--color-text-subtle)] text-base focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSelectedIndex(0);
                }}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded-md"
                aria-label={isEn ? 'Clear' : 'Очистить'}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {!query.trim() && recentSearches.length > 0 && (
              <div className="mb-3 px-3">
                <div className="flex items-center gap-1.5 py-1 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                  <ClockCounterClockwise size={13} />
                  <span>{isEn ? 'Recent Searches' : 'Недавние запросы'}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        const res = fuseInstance.search(term).slice(0, 12);
                        setResults(res.map((r) => r.item));
                      }}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:border-[var(--color-primary)] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!query.trim() && (
              <div className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
                <Sparkle size={13} />
                <span>{isEn ? 'Popular & Deep Catalogs' : 'Популярное и каталоги'}</span>
              </div>
            )}

            {displayedItems.length === 0 && query.trim() && (
              <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                {isEn ? 'No results found. Try broader keywords.' : 'Ничего не найдено. Попробуйте изменить запрос.'}
              </div>
            )}

            <div className="flex flex-col gap-1">
              {displayedItems.map((item, index) => {
                const targetUrl = isEn ? item.urlEn : item.urlRu;
                const title = isEn ? item.titleEn : item.titleRu;
                const desc = isEn ? item.descriptionEn : item.descriptionRu;
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={item.id}
                    href={targetUrl}
                    onClick={() => {
                      saveRecentSearch(query || title);
                      onClose();
                    }}
                    data-active={isSelected ? 'true' : undefined}
                    className={cn(
                      'group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors',
                      isSelected
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] ring-1 ring-[var(--color-primary)]/40'
                        : 'hover:bg-[var(--color-surface-muted)]',
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate text-[var(--color-text)]">
                          {title}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                        {desc}
                      </span>
                    </div>

                    <ArrowRight
                      size={16}
                      className={cn(
                        'shrink-0 text-[var(--color-text-muted)] transition-transform',
                        isSelected ? 'translate-x-0.5 text-[var(--color-primary)]' : 'group-hover:translate-x-0.5',
                      )}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-2 text-[11px] text-[var(--color-text-muted)]">
            <div className="flex items-center gap-2">
              <span>↑↓ {isEn ? 'to navigate' : 'навигация'}</span>
              <span>↵ {isEn ? 'to select' : 'выбрать'}</span>
              <span>esc {isEn ? 'to close' : 'закрыть'}</span>
            </div>
            <span>2 525 {isEn ? 'items indexed' : 'сущностей'}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
