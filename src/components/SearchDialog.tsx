'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog';
import { Icon } from './Icon';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/cn';
import { Button } from '@/src/components/ui/button';
import { type Tool, getFeaturedTools, getToolBySlug, tools, toolGroups } from '@/src/data/tools';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { getGroupName, getToolDescription, getToolName } from '@/src/data/toolLocalization';
import { useRecentTools } from '@/src/hooks/useRecentTools';

interface Props {
  open: boolean;
  onClose: () => void;
}

const publicTools = tools.filter(t => t.implemented && !t.hidden);
const groupMap = new Map(toolGroups.map(g => [g.id, g]));
const featuredResults = getFeaturedTools().slice(0, 8);
const quickSlugFallback = [
  'json-formatter',
  'pdf-studio',
  'image-compressor',
  'password-generator',
  'color-picker',
  'qr-code-gen',
  'case-converter',
  'url-encoder',
];
const quickTools = quickSlugFallback
  .map(slug => getToolBySlug(slug))
  .filter((tool): tool is Tool => Boolean(tool?.implemented && !tool.hidden));

let fuseInstance: Fuse<Tool> | null = null;
function getFuse(): Fuse<Tool> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(publicTools, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'nameEn', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'descriptionEn', weight: 1 },
        { name: 'keywords', weight: 1.5 },
      ],
      threshold: 0.3,
      includeScore: true,
    });
  }
  return fuseInstance;
}

export default memo(function SearchDialog({ open, onClose }: Props) {
  const router = useRouter();
  const { lHref, locale, t } = useLanguage();
  const { recentSlugs } = useRecentTools();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEn = locale === 'en';
  const recentTools = useMemo(
    () => recentSlugs
      .map(slug => getToolBySlug(slug))
      .filter((tool): tool is Tool => Boolean(tool?.implemented && !tool.hidden)),
    [recentSlugs],
  );

  const defaultResults = useMemo(() => {
    const merged = [...recentTools, ...featuredResults];
    return merged.filter((tool, index, all) => all.findIndex(item => item.slug === tool.slug) === index).slice(0, 10);
  }, [recentTools]);

  const trendingSearches = useMemo(() => (
    isEn
      ? ['json', 'pdf', 'image', 'password', 'color', 'qr']
      : ['json', 'pdf', 'изображение', 'пароль', 'цвет', 'qr']
  ), [isEn]);

  useEffect(() => {
    if (!open) return;
    const tm = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(tm);
  }, [open]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(0);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(val), 150);
  }, []);

  const setSearchTerm = useCallback((value: string) => {
    setQuery(value);
    setDebouncedQuery(value);
    setSelectedIndex(0);
  }, []);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return defaultResults;
    return getFuse().search(debouncedQuery).slice(0, 12).map(r => r.item);
  }, [debouncedQuery, defaultResults]);

  const resetSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(0);
  }, []);

  const handleSelect = useCallback(
    (tool: Tool) => {
      router.push(lHref(`/tools/${tool.slug}`));
      resetSearch();
      onClose();
    },
    [router, onClose, lHref, resetSearch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setSelectedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setSelectedIndex(Math.max(results.length - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    },
    [results, selectedIndex, handleSelect],
  );

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) { resetSearch(); onClose(); } }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0" showClose={false}>
        <DialogTitle className="sr-only">{t('nav.searchPlaceholder') || (isEn ? 'Search' : 'Поиск')}</DialogTitle>
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
          <MagnifyingGlass size={18} className="shrink-0 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder={t('nav.searchPlaceholder') || (isEn ? 'Search tools...' : 'Поиск инструментов...')}
            role="combobox"
            aria-label={isEn ? 'Search tools' : 'Поиск инструментов'}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="tool-search-results"
            aria-activedescendant={results[selectedIndex] ? `tool-search-option-${results[selectedIndex].id}` : undefined}
            className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--color-text-subtle)]"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={resetSearch}
              aria-label={isEn ? 'Clear search' : 'Очистить поиск'}
            >
              <X size={16} />
            </Button>
          )}
          <kbd className="hidden h-6 items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 font-mono text-[10px] text-[var(--color-text-muted)] sm:inline-flex">
            ESC
          </kbd>
        </div>
        {!debouncedQuery.trim() && (
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--color-text-subtle)]">
              {recentTools.length > 0 ? (isEn ? 'Recent and popular' : 'Недавние и популярные') : (isEn ? 'Popular searches' : 'Популярные запросы')}
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map(term => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchTerm(term)}
                  className="inline-flex min-h-8 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
        <ul id="tool-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {results.map((tool, index) => {
            const group = groupMap.get(tool.groupId);
            const active = index === selectedIndex;
            return (
              <li key={tool.id}>
                <button
                  id={`tool-search-option-${tool.id}`}
                  role="option"
                  aria-selected={active}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => handleSelect(tool)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left transition-colors',
                    active && 'bg-[var(--color-surface-muted)]',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                    <Icon name={tool.icon} size={18} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--color-text)]">{getToolName(tool, locale)}</div>
                    <div className="truncate text-xs text-[var(--color-text-muted)]">{getToolDescription(tool, locale)}</div>
                  </div>
                  {group && (
                    <Badge variant="neutral" className="hidden shrink-0 sm:inline-flex">
                      {getGroupName(group, locale)}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
          {results.length === 0 && query && (
            <li className="grid gap-4 px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              <div className="mx-auto max-w-md">
                <p className="font-semibold text-[var(--color-text)]">
                  {isEn ? `Nothing found for "${query}"` : `Ничего не найдено по запросу «${query}»`}
                </p>
                <p className="mt-1 text-xs">
                  {isEn ? 'Try a task name, file type, or one of the shortcuts below.' : 'Попробуйте название задачи, формат файла или быстрый запрос ниже.'}
                </p>
              </div>
              <div className="mx-auto flex max-w-md flex-wrap justify-center gap-2">
                {quickTools.slice(0, 6).map(tool => (
                  <button
                    key={tool.slug}
                    type="button"
                    onClick={() => handleSelect(tool)}
                    className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-border-strong)]"
                  >
                    {getToolName(tool, locale)}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <Button type="button" variant="soft" size="sm" onClick={() => setSearchTerm('')}>
                  {isEn ? 'Show popular tools' : 'Показать популярные'} <ArrowRight size={14} />
                </Button>
              </div>
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
});
