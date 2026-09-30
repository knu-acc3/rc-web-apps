'use client';

import Link from 'next/link';
import { SearchTrigger } from '@/src/components/layout/SearchTrigger';
import { useLanguage } from '@/src/i18n/LanguageContext';
import {
  SquaresFour,
  Clock,
  Ruler,
  Smiley,
  Asterisk,
  Timer,
  Monitor,
  Sparkle,
} from '@phosphor-icons/react';

interface Props {
  totalTools: number;
  isEn: boolean;
  searchPlaceholder: string;
}

export function HeroSearch({ totalTools, isEn, searchPlaceholder }: Props) {
  const { lHref } = useLanguage();

  const hubs = [
    {
      label: isEn ? `${totalTools} Tools` : `${totalTools} утилиты`,
      href: '#categories',
      icon: SquaresFour,
      highlight: true,
    },
    {
      label: isEn ? 'World Time (300+)' : 'Мировое время (300+)',
      href: lHref('/time-now'),
      icon: Clock,
    },
    {
      label: isEn ? 'Actual Size 1:1' : 'Размеры 1:1',
      href: lHref('/actual-size'),
      icon: Ruler,
    },
    {
      label: isEn ? '1,500+ Emojis' : '1 500+ эмодзи',
      href: lHref('/emojis'),
      icon: Smiley,
    },
    {
      label: isEn ? '1,000+ Symbols' : '1 000+ символов',
      href: lHref('/symbols'),
      icon: Asterisk,
    },
    {
      label: isEn ? '120+ Timers' : '120+ таймеров',
      href: lHref('/timer'),
      icon: Timer,
    },
    {
      label: isEn ? 'Hardware Tests (65)' : 'Диагностика железа (65)',
      href: lHref('/what-is-my'),
      icon: Monitor,
    },
  ];

  return (
    <section className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-5xl flex-col px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        {/* Eyebrow badge */}
        <div className="mb-3.5 inline-flex items-center gap-1.5 self-start rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]">
          <Sparkle size={14} weight="fill" />
          <span>
            {isEn
              ? '3,000+ Online Tools, Clocks & Compendiums'
              : 'Более 3 000 инструментов, сервисов и справочников'}
          </span>
        </div>

        <h1 className="text-balance text-3xl font-extrabold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl md:text-5xl lg:text-[3.15rem] lg:leading-[1.15]">
          {isEn
            ? 'Universal portal for online tools & digital services'
            : 'Универсальный портал онлайн-инструментов и справочников'}
        </h1>

        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base md:text-lg">
          {isEn
            ? `Instant access to ${totalTools} interactive utilities, live world time across 300+ cities, 1:1 screen calibrator, 1,500+ Unicode emojis, precision timers, and 65 system diagnostics. Fast, private, zero installation.`
            : `Мгновенный доступ к ${totalTools} интерактивным утилитам, точному мировому времени в 300+ городах, калибратору экранов 1:1, 1 500+ эмодзи, таймерам и 65 тестам оборудования. Без установки, рекламы и ограничений.`}
        </p>

        <div className="mt-6 w-full max-w-2xl">
          <SearchTrigger variant="hero" placeholder={searchPlaceholder} />
        </div>

        {/* Quick Hub Badges */}
        <div className="mt-5 flex flex-wrap items-center gap-2 pt-1">
          <span className="mr-1 text-xs font-medium text-[var(--color-text-subtle)]">
            {isEn ? 'Quick explore:' : 'Быстрый переход:'}
          </span>
          {hubs.map((hub, idx) => {
            const IconComponent = hub.icon;
            return (
              <Link
                key={idx}
                href={hub.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  hub.highlight
                    ? 'border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
                }`}
              >
                <IconComponent size={14} className="shrink-0" />
                <span>{hub.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

