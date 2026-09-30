'use client';

import { memo, useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart } from '@phosphor-icons/react';
import type { Tool } from '@/src/data/tools';
import { toolGroups } from '@/src/data/tools';
import { Icon } from './Icon';
import { cn } from '@/src/lib/cn';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { getGroupName, getToolDescription, getToolDisplayName } from '@/src/data/toolLocalization';
import { useFavorites } from '@/src/hooks/useFavorites';

type Variant = 'default' | 'compact' | 'horizontal';

interface Props {
  tool: Tool;
  showGroup?: boolean;
  variant?: Variant;
  hideFavorite?: boolean;
}

const groupMap = new Map(toolGroups.map(g => [g.id, g]));

const ToolFavoriteButton = memo(function ToolFavoriteButton({
  slug,
  toolName,
  locale,
}: {
  slug: string;
  toolName: string;
  locale: string;
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(slug);
  const [confirmUnlike, setConfirmUnlike] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFavClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!fav) {
        toggleFavorite(slug);
        return;
      }
      if (confirmUnlike) {
        toggleFavorite(slug);
        setConfirmUnlike(false);
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
      } else {
        setConfirmUnlike(true);
        confirmTimer.current = setTimeout(() => setConfirmUnlike(false), 2500);
      }
    },
    [fav, confirmUnlike, toggleFavorite, slug],
  );

  return (
    <button
      type="button"
      onClick={handleFavClick}
      aria-label={
        fav
          ? locale === 'en'
            ? `Remove ${toolName} from favorites`
            : `Убрать «${toolName}» из избранного`
          : locale === 'en'
            ? `Add ${toolName} to favorites`
            : `Добавить «${toolName}» в избранное`
      }
      className={cn(
        'hit-area-44 absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface)]/85 backdrop-blur transition-colors',
        confirmUnlike
          ? 'text-[var(--color-warning)] ring-1 ring-[var(--color-warning)]/40'
          : fav
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-text-subtle)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--color-text)]',
      )}
    >
      <Heart size={16} weight={fav ? 'fill' : 'regular'} />
    </button>
  );
});

export default memo(function ToolCard({ tool, showGroup = false, variant = 'default', hideFavorite = false }: Props) {
  const { lHref, locale } = useLanguage();
  const group = groupMap.get(tool.groupId);
  const toolName = getToolDisplayName(tool, locale);
  const toolDesc = getToolDescription(tool, locale);
  const groupName = group ? getGroupName(group, locale) : '';

  if (variant === 'compact') {
    return (
      <Link
        href={lHref(`/tools/${tool.slug}`)}
        className="group flex min-h-[4.25rem] min-w-0 items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-surface)] group-hover:text-[var(--color-primary)]">
          <Icon name={tool.icon} size={20} weight="regular" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-[13px] font-bold leading-snug text-[var(--color-text)] sm:text-sm">{toolName}</span>
          {showGroup && group && <span className="mt-0.5 block truncate text-[11px] text-[var(--color-text-subtle)]">{groupName}</span>}
        </span>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link
        href={lHref(`/tools/${tool.slug}`)}
        className="group flex min-w-0 items-center gap-3 rounded-[var(--radius-md)] p-3 transition-colors hover:bg-[var(--color-surface-muted)]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors group-hover:bg-[var(--color-surface-soft)] group-hover:text-[var(--color-text)]">
          <Icon name={tool.icon} size={20} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[var(--color-text)]">{toolName}</div>
          <div className="truncate text-xs text-[var(--color-text-muted)]">{toolDesc}</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative flex h-full">
      {!hideFavorite && (
        <ToolFavoriteButton
          slug={tool.slug}
          toolName={toolName}
          locale={locale}
        />
      )}
      <Link
        href={lHref(`/tools/${tool.slug}`)}
        className="group/card flex h-full min-w-0 w-full flex-col gap-3 rounded-[calc(var(--radius-lg)+0.25rem)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)] active:translate-y-0 sm:gap-3 sm:p-4"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors group-hover/card:bg-[var(--color-surface-soft)] group-hover/card:text-[var(--color-text)] sm:h-12 sm:w-12">
          <Icon name={tool.icon} size={24} weight="duotone" />
        </span>
        <div className="flex min-h-[2.5rem] flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[var(--color-text)]">{toolName}</h3>
          {showGroup && group && (
            <span className="text-[11px] font-semibold text-[var(--color-text-subtle)]">{groupName}</span>
          )}
        </div>
        <p className="line-clamp-2 mt-auto min-h-[2.25rem] text-xs leading-relaxed text-[var(--color-text-muted)]">{toolDesc}</p>
      </Link>
    </div>
  );
});
