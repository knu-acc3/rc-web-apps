'use client';

import React from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { siteConfig } from '@/src/config/site.config';
import { X, Wrench, Clock, DeviceMobile, Smiley, Hash, Timer, Cpu } from '@phosphor-icons/react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  locale: 'ru' | 'en';
}

const navItems = [
  { href: '/tools', icon: Wrench, ru: 'Инструменты', en: 'Tools' },
  { href: '/time-now', icon: Clock, ru: 'Мировое время', en: 'World Time' },
  { href: '/actual-size', icon: DeviceMobile, ru: 'Реальные размеры', en: 'Actual Size' },
  { href: '/emojis', icon: Smiley, ru: 'Эмодзи', en: 'Emojis' },
  { href: '/symbols', icon: Hash, ru: 'Символы', en: 'Symbols' },
  { href: '/timer', icon: Timer, ru: 'Таймеры', en: 'Timers' },
  { href: '/what-is-my', icon: Cpu, ru: 'Диагностика', en: 'Diagnostics' },
];

export function NavigationDrawer({ isOpen, onClose, locale }: NavigationDrawerProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-full max-w-[280px] sm:max-w-xs bg-background p-4 shadow-xl flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <Dialog.Title className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {siteConfig.brandShort}
                </span>
                <span>{siteConfig.brandName}</span>
              </Dialog.Title>
              <button
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    <IconComponent size={20} className="text-primary shrink-0" />
                    <span>{locale === 'ru' ? item.ru : item.en}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} {siteConfig.brandName}</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
