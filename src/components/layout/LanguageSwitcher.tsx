'use client';

import { Globe } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { LOCALE_NAMES, type Locale } from '@/src/i18n/index';

interface LanguageSwitcherProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const LANGUAGE_OPTIONS: Array<{ locale: Locale; flag: string }> = [
  { locale: 'ru', flag: '🇷🇺' },
  { locale: 'en', flag: '🇬🇧' },
];

export function LanguageSwitcher({ open, onOpenChange }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();
  const triggerLabel = locale === 'en' ? 'Change language' : 'Сменить язык';

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={triggerLabel}
          aria-label={triggerLabel}
          className="text-[var(--color-text-muted)]"
        >
          <Globe size={18} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGE_OPTIONS.map(option => (
          <DropdownMenuItem
            key={option.locale}
            aria-label={LOCALE_NAMES[option.locale]}
            onSelect={() => {
              setLocale(option.locale);
              onOpenChange?.(false);
            }}
            className={locale === option.locale ? 'font-semibold text-[var(--color-primary)]' : undefined}
          >
            <span aria-hidden="true" className="text-base leading-none">{option.flag}</span>
            <span>{LOCALE_NAMES[option.locale]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
