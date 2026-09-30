"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { List, House, Heart, MapPin, SquaresFour, Clock, Ruler, Smiley, Asterisk, Timer, Monitor, CaretDown, BookOpen, FolderSimple } from "@phosphor-icons/react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchTrigger } from "./SearchTrigger";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { toolGroups } from "@/src/data/tools";
import { getGroupName } from "@/src/data/toolLocalization";
import { Icon } from "@/src/components/Icon";
import { getStats } from "@/src/data/tools";

const stats = getStats();

export function Header() {
  const { lHref, locale } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const isEn = locale === "en";

  const releaseStalePointerLock = useCallback(() => {
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }
  }, []);

  const closeHeaderDropdowns = useCallback(() => {
    setLanguageOpen(false);
    setThemeOpen(false);
    releaseStalePointerLock();
  }, [releaseStalePointerLock]);

  const handleMobileOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        closeHeaderDropdowns();
      }
      setMobileOpen(open);
      if (!open) {
        window.requestAnimationFrame(releaseStalePointerLock);
      }
    },
    [closeHeaderDropdowns, releaseStalePointerLock],
  );

  useEffect(() => {
    if (mobileOpen || languageOpen || themeOpen) return;

    const timeoutId = window.setTimeout(releaseStalePointerLock, 80);
    return () => window.clearTimeout(timeoutId);
  }, [languageOpen, mobileOpen, releaseStalePointerLock, themeOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-overlay)] pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="site-header-inner mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <Logo href={lHref("/")} />

        <nav className="hidden md:flex items-center gap-1">
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <SquaresFour size={18} />
                {isEn ? "Categories" : "Категории"}
                <CaretDown size={14} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60 p-1.5 grid gap-0.5 max-h-[70vh] overflow-y-auto">
              {toolGroups.map((g) => (
                <DropdownMenuItem key={g.id} asChild>
                  <Link
                    href={lHref(`/group/${g.slug}`)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-[var(--radius-sm)]"
                  >
                    <Icon name={g.icon} size={16} />
                    <span className="truncate">{getGroupName(g, locale)}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Reference & Services Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-1.5 px-2.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                <BookOpen size={18} />
                {isEn ? "Directories" : "Справочники"}
                <CaretDown size={14} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52 p-1.5">
              <DropdownMenuItem asChild>
                <Link href={lHref("/time-now")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <Clock size={16} /> {isEn ? "World Time" : "Мировое время"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={lHref("/actual-size")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <Ruler size={16} /> {isEn ? "1:1 Scale" : "Размеры 1:1"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={lHref("/emojis")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <Smiley size={16} /> {isEn ? "Emojis" : "Эмодзи"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={lHref("/symbols")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <Asterisk size={16} /> {isEn ? "Symbols" : "Символы"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={lHref("/timer")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <Timer size={16} /> {isEn ? "Timers" : "Таймеры"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={lHref("/catalog")} className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer">
                  <FolderSimple size={16} /> {isEn ? "Knowledge Base" : "Базы знаний"}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link
            href={lHref("/favorites")}
            className="h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] inline-flex"
          >
            <Heart size={18} />
            {isEn ? "Favorites" : "Избранное"}
          </Link>

          <Link
            href={lHref("/kz")}
            className="h-9 items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] inline-flex"
          >
            <MapPin size={18} />
            {isEn ? "Kazakhstan" : "Казахстан"}
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:flex-1 sm:gap-2">
          <div className="ml-auto hidden w-full max-w-[23rem] sm:block lg:mx-auto">
            <SearchTrigger
              enableShortcut
              placeholder={isEn ? "Search tools..." : "Поиск инструментов..."}
            />
          </div>
          <div className="hidden items-center gap-0.5 sm:flex">
            <LanguageSwitcher
              open={languageOpen}
              onOpenChange={(open) => {
                if (open) setThemeOpen(false);
                setLanguageOpen(open);
                if (!open)
                  window.requestAnimationFrame(releaseStalePointerLock);
              }}
            />
            <ThemeToggle
              open={themeOpen}
              onOpenChange={(open) => {
                if (open) setLanguageOpen(false);
                setThemeOpen(open);
                if (!open)
                  window.requestAnimationFrame(releaseStalePointerLock);
              }}
            />
          </div>

          <Sheet open={mobileOpen} onOpenChange={handleMobileOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-[var(--color-text-muted)]"
                onPointerDown={closeHeaderDropdowns}
                onClick={() => handleMobileOpenChange(true)}
                title={isEn ? "Menu" : "Menu"}
                aria-label={isEn ? "Menu" : "Меню"}
              >
                <List size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[min(92%,22rem)] flex-col gap-0 p-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]"
              showClose={true}
            >
              <SheetTitle className="sr-only">
                {isEn ? "Menu" : "Меню"}
              </SheetTitle>
              <div className="flex flex-col gap-1 border-b border-[var(--color-border)] px-4 py-3 pr-12">
                <div className="flex items-center justify-between gap-2">
                  <Logo />
                  <span className="text-xs text-[var(--color-text-subtle)] whitespace-nowrap">
                    {stats.totalTools} tools
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                <SearchTrigger
                  placeholder={isEn ? "Search tools…" : "Поиск инструментов…"}
                  className="mb-3"
                />
                <nav
                  aria-label={isEn ? "All categories" : "Все категории"}
                  className="grid gap-0.5"
                >
                  <Link
                    href={lHref("/")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
                  >
                    <House size={20} /> {isEn ? "Home" : "Главная"}
                  </Link>
                  <Link
                    href={lHref("/favorites")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
                  >
                    <Heart size={20} /> {isEn ? "Favorites" : "Избранное"}
                  </Link>
                  <Link
                    href={lHref("/kz")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-muted)]"
                  >
                    <MapPin size={20} />{" "}
                    {isEn ? "Kazakhstan tools" : "Инструменты Казахстана"}
                  </Link>
                  <div className="my-2 h-px bg-[var(--color-border)]" />
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                    {isEn ? "Catalogs & Directories" : "Справочники и каталоги"}
                  </p>
                  <Link
                    href={lHref("/time-now")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Clock size={20} />
                    {isEn ? "World Time" : "Мировое время"}
                  </Link>
                  <Link
                    href={lHref("/actual-size")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Ruler size={20} />
                    {isEn ? "Actual Size 1:1" : "Реальные размеры 1:1"}
                  </Link>
                  <Link
                    href={lHref("/emojis")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Smiley size={20} />
                    {isEn ? "Emoji Directory" : "Каталог эмодзи"}
                  </Link>
                  <Link
                    href={lHref("/symbols")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Asterisk size={20} />
                    {isEn ? "Special Symbols" : "Спецсимволы"}
                  </Link>
                  <Link
                    href={lHref("/timer")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Timer size={20} />
                    {isEn ? "Timers & Stopwatch" : "Таймеры и секундомер"}
                  </Link>
                  <Link
                    href={lHref("/what-is-my")}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                  >
                    <Monitor size={20} />
                    {isEn ? "System Diagnostics" : "Диагностика системы"}
                  </Link>
                  <div className="my-2 h-px bg-[var(--color-border)]" />
                  <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-subtle)]">
                    {isEn ? "Tool Categories" : "Категории инструментов"}
                  </p>
                  {toolGroups.map((g) => (
                    <Link
                      key={g.id}
                      href={lHref(`/group/${g.slug}`)}
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                    >
                      <Icon name={g.icon} size={20} weight="duotone" />
                      {getGroupName(g, locale)}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
