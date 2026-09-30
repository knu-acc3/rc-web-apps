"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { getFeaturedTools, toolGroups } from "@/src/data/tools";
import { getGroupName, getToolName } from "@/src/data/toolLocalization";
import { OPEN_ANALYTICS_PREFERENCES_EVENT } from "./CookieConsent";
import { siteConfig } from "@/src/config/site.config";

export function Footer() {
  const { locale, lHref } = useLanguage();
  const isEn = locale === "en";
  const [year, setYear] = useState(2026);
  useEffect(() => {
    const id = window.setTimeout(() => setYear(new Date().getFullYear()), 0);
    return () => window.clearTimeout(id);
  }, []);
  const columns = [0, 1, 2, 3].map((idx) =>
    toolGroups.filter((_, i) => i % 4 === idx),
  );
  const topTools = getFeaturedTools().slice(0, 10);
  const openAnalyticsPreferences = () => {
    window.dispatchEvent(new Event(OPEN_ANALYTICS_PREFERENCES_EVENT));
  };

  return (
    <footer className="mt-12 border-t border-[var(--color-border)] bg-[var(--color-surface)] sm:mt-16">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_3fr] lg:gap-10">
          <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Free browser tools with no installs, no signups, and local-first processing."
                : "Бесплатные браузерные инструменты без установок, регистрации и лишней отправки данных."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 min-[320px]:grid-cols-2 sm:grid-cols-4 sm:gap-6">
            {columns.map((col, i) => (
              <div key={i} className="flex flex-col gap-2">
                {col.map((group) => (
                  <Link
                    key={group.id}
                    href={lHref(`/group/${group.slug}`)}
                    className="text-balance text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
                  >
                    {getGroupName(group, locale)}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Справочники и каталоги PilliApp */}
        <div className="mt-8 border-t border-[var(--color-border)] pt-6">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text)]">
            {isEn ? "Catalogs & Directories" : "Справочники и каталоги"}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href={lHref("/time-now")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "World Time" : "Мировое время"}
            </Link>
            <Link
              href={lHref("/actual-size")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "Actual Size 1:1" : "Реальные размеры 1:1"}
            </Link>
            <Link
              href={lHref("/emojis")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "Emoji Directory" : "Каталог эмодзи"}
            </Link>
            <Link
              href={lHref("/symbols")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "Special Symbols" : "Спецсимволы"}
            </Link>
            <Link
              href={lHref("/timer")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "Timers & Stopwatch" : "Таймеры и секундомер"}
            </Link>
            <Link
              href={lHref("/what-is-my")}
              className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              {isEn ? "System Diagnostics" : "Диагностика системы"}
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--color-border)] pt-6">
          <h2 className="mb-3 text-sm font-bold text-[var(--color-text)]">
            {isEn ? "Popular tools" : "Популярные инструменты"}
          </h2>
          <div className="flex flex-wrap gap-2">
            {topTools.map((tool) => (
              <Link
                key={tool.slug}
                href={lHref(`/tools/${tool.slug}`)}
                className="inline-flex min-h-9 items-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
              >
                {getToolName(tool, locale)}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6 text-center text-xs text-[var(--color-text-subtle)] sm:flex-row sm:text-left">
          <p>
            © {year} {siteConfig.brandName}.{" "}
            {isEn ? "All rights reserved." : "Все права защищены."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={lHref("/favorites")}
              className="hover:text-[var(--color-text)]"
            >
              {isEn ? "Favorites" : "Избранное"}
            </Link>
            <Link
              href={lHref("/kz")}
              className="hover:text-[var(--color-text)]"
            >
              {isEn ? "Kazakhstan" : "Казахстан"}
            </Link>
            <Link
              href={lHref("/privacy")}
              className="hover:text-[var(--color-text)]"
            >
              {isEn ? "Privacy" : "Приватность"}
            </Link>
            <Link
              href={lHref("/terms")}
              className="hover:text-[var(--color-text)]"
            >
              {isEn ? "Terms" : "Условия"}
            </Link>
            <button
              type="button"
              onClick={openAnalyticsPreferences}
              className="hover:text-[var(--color-text)]"
            >
              {isEn ? "Analytics" : "Аналитика"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center sm:justify-start">
          <a
            href="https://rc-web.kz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-semibold text-[var(--color-brand-link)] transition-opacity hover:opacity-80"
          >
            {isEn ? "Made in rc-web.kz" : "Made in rc-web.kz"}
          </a>
        </div>
      </div>
    </footer>
  );
}
