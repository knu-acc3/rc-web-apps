'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, MagnifyingGlass, GridFour, Heart } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/src/lib/cn';
import { useLanguage } from '@/src/i18n/LanguageContext';

const SearchDialog = dynamic(() => import('@/src/components/SearchDialog'), { ssr: false });

type BottomTab =
  | {
      href: string;
      label: string;
      icon: PhosphorIcon;
      match: (pathname: string) => boolean;
    }
  | {
      onClick: () => void;
      label: string;
      icon: PhosphorIcon;
      match: (pathname: string) => boolean;
    };

export function BottomTabBar() {
  const { locale, lHref } = useLanguage();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const isEn = locale === 'en';

  // Strip locale prefix for active-state check.
  const stripped = pathname.replace(/^\/(ru|en)(?=\/|$)/, '') || '/';

  // Tool pages need the full mobile viewport for the task itself. The global
  // header still provides search and navigation without covering controls.
  if (stripped.startsWith('/tools/')) return null;

  const tabs: BottomTab[] = [
    { href: lHref('/'), label: isEn ? 'Home' : 'Главная', icon: House, match: (p: string) => p === '/' },
    { href: lHref('/group/converters'), label: isEn ? 'Categories' : 'Категории', icon: GridFour, match: (p: string) => p.startsWith('/group') },
    { onClick: () => setSearchOpen(true), label: isEn ? 'Search' : 'Поиск', icon: MagnifyingGlass, match: () => false },
    { href: lHref('/favorites'), label: isEn ? 'Favorites' : 'Избранное', icon: Heart, match: (p: string) => p.startsWith('/favorites') },
  ];

  return (
    <>
      <div aria-hidden="true" className="h-[calc(5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <div
        className={cn(
          'pointer-events-none fixed bottom-0 left-0 right-auto z-40 w-[100vw] max-w-[100vw] overflow-hidden px-1.5 lg:hidden',
          'pb-[env(safe-area-inset-bottom)]',
        )}
      >
        <nav
          aria-label={isEn ? 'Bottom navigation' : 'Нижняя навигация'}
          data-glass="true"
          className={cn(
            'pointer-events-auto mx-auto w-full max-w-md md:max-w-lg',
            'mb-0.5',
            'rounded-[calc(var(--radius-lg)+0.25rem)] border border-[var(--color-border)]',
            'bg-[var(--color-surface-translucent)] backdrop-blur-xl',
            'shadow-[var(--shadow-floating)]',
            'supports-[backdrop-filter]:bg-[var(--color-surface-translucent)]',
          )}
        >
          <ul className="flex h-16 min-w-0 items-stretch justify-around md:h-[72px]">
            {tabs.map((tab, i) => {
              const active = tab.match(stripped);
              const className = cn(
                'relative flex h-full w-full flex-col items-center justify-center gap-0.5',
                'min-h-[44px] rounded-[var(--radius-md)]',
                'min-w-0 overflow-hidden text-[9px] font-semibold tracking-wide transition-colors min-[290px]:text-[10px] 2xs:text-[11px]',
                active
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:ring-inset',
              );
              const content = (
                <>
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full transition-colors md:h-10 md:w-10',
                      active && 'bg-[var(--color-primary-soft)]',
                    )}
                  >
                    <tab.icon size={22} weight={active ? 'fill' : 'regular'} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{tab.label}</span>
                </>
              );
              return (
                <li key={i} className="min-w-0 flex-1">
                  {'href' in tab ? (
                    <Link
                      href={tab.href}
                      aria-current={active ? 'page' : undefined}
                      aria-label={tab.label}
                      className={className}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={tab.onClick}
                      aria-label={tab.label}
                      className={className}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {searchOpen ? <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
