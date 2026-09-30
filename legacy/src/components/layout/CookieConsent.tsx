"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export const ANALYTICS_CONSENT_KEY = "ut_analytics_consent";
export const OPEN_ANALYTICS_PREFERENCES_EVENT = "ut_open_analytics_preferences";

type AnalyticsConsent = "accepted" | "necessary";

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "accepted" || value === "necessary" ? value : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return getAnalyticsConsent() === "accepted";
}

export function CookieConsent() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const isEn = locale === "en";
  const isToolPage = /\/tools\/[^/]+/.test(pathname);
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getAnalyticsConsent();
      setChoice(stored);
      setVisible(!stored);
    }, 0);
    const openPreferences = () => {
      setChoice(getAnalyticsConsent());
      setVisible(true);
    };
    window.addEventListener(OPEN_ANALYTICS_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        OPEN_ANALYTICS_PREFERENCES_EVENT,
        openPreferences,
      );
    };
  }, []);

  const choose = (value: AnalyticsConsent) => {
    const previousChoice = getAnalyticsConsent();
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value);
    } catch {
      // Private browsing or blocked storage should not break the app shell.
    }
    setChoice(value);
    window.dispatchEvent(
      new CustomEvent("ut_analytics_consent_changed", { detail: value }),
    );
    setVisible(false);
    if (previousChoice === "accepted" && value === "necessary") {
      // Reload after revocation so already-loaded third-party analytics code is
      // removed immediately and cannot send more events in this document.
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="analytics-consent-title"
      className={cn(
        "fixed inset-x-3 z-50 mx-auto grid max-w-lg gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm shadow-[var(--shadow-floating)] lg:bottom-4",
        isToolPage
          ? "bottom-[calc(0.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(5rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="grid gap-1">
        <p
          id="analytics-consent-title"
          className="font-bold text-[var(--color-text)]"
        >
          {isEn ? "Analytics" : "Аналитика"}
        </p>
        <p className="text-[var(--color-text-muted)]">
          {isEn
            ? "It helps us understand which tools are useful. Everything works without it."
            : "Она помогает понять, какие инструменты полезны. Всё работает и без неё."}
        </p>
        {choice ? (
          <p className="text-xs font-semibold text-[var(--color-text-subtle)]">
            {isEn
              ? `Current: ${choice === "accepted" ? "analytics accepted" : "necessary only"}`
              : `Сейчас: ${choice === "accepted" ? "аналитика разрешена" : "только необходимые"}`}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-auto min-h-[44px] whitespace-normal px-2 py-2 text-xs"
          onClick={() => choose("necessary")}
        >
          {isEn ? "Necessary only" : "Только необходимые"}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-auto min-h-[44px] whitespace-normal px-2 py-2 text-xs"
          onClick={() => choose("accepted")}
        >
          {isEn ? "Accept analytics" : "Разрешить аналитику"}
        </Button>
      </div>
    </div>
  );
}

export function AnalyticsPreferencesButton({
  className,
}: {
  className?: string;
}) {
  const { locale } = useLanguage();
  const isEn = locale === "en";

  const openPreferences = () => {
    window.dispatchEvent(new Event(OPEN_ANALYTICS_PREFERENCES_EVENT));
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      aria-label={
        isEn ? "Open analytics preferences" : "Открыть настройки аналитики"
      }
      data-analytics-preferences
      onClick={openPreferences}
    >
      {isEn ? "Analytics preferences" : "Настройки аналитики"}
    </Button>
  );
}
