'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ShareNetwork,
  Check,
  BellSimple,
  BellSimpleSlash,
  Sparkle,
  Sun,
  Snowflake,
  Trophy,
  Heart,
  HourglassHigh,
  ArrowRight,
} from '@phosphor-icons/react';
import {
  calculateTimeRemaining,
  getUnitLabel,
  type TimeRemaining,
} from '@/src/lib/timers/countdownEngine';
import { playSuccessChime } from '@/src/lib/audio/soundSynthesizer';
import type { EventItem } from '@/src/types/timers';

export interface EventCountdownEngineProps {
  readonly event: EventItem;
  readonly locale: string;
  readonly initialTargetIso: string;
  readonly initialNowIso?: string;
  readonly allEvents?: EventItem[];
}

function getEventIcon(slug: string) {
  switch (slug) {
    case 'summer':
      return <Sun className="w-5 h-5 text-amber-500" weight="fill" />;
    case 'winter':
      return <Snowflake className="w-5 h-5 text-sky-400" weight="fill" />;
    case 'spring':
      return <Sparkle className="w-5 h-5 text-emerald-500" weight="fill" />;
    case 'autumn':
      return <HourglassHigh className="w-5 h-5 text-orange-500" weight="fill" />;
    case 'olympics':
      return <Trophy className="w-5 h-5 text-yellow-500" weight="fill" />;
    case 'valentines':
      return <Heart className="w-5 h-5 text-rose-500" weight="fill" />;
    case 'new-year':
    case 'christmas':
      return <Sparkle className="w-5 h-5 text-indigo-400" weight="fill" />;
    default:
      return <Calendar className="w-5 h-5 text-primary" weight="fill" />;
  }
}

function getCategoryBadge(category: string | undefined, locale: string) {
  const isRu = locale === 'ru';
  switch (category) {
    case 'season':
      return isRu ? 'Времена года' : 'Seasons';
    case 'holiday':
      return isRu ? 'Праздники' : 'Holidays';
    case 'sports':
      return isRu ? 'Спорт' : 'Sports';
    case 'productivity':
      return isRu ? 'Продуктивность' : 'Productivity';
    default:
      return isRu ? 'Событие' : 'Event';
  }
}

export function EventCountdownEngine({
  event,
  locale,
  initialTargetIso,
  initialNowIso,
  allEvents = [],
}: EventCountdownEngineProps) {
  const isRu = locale === 'ru';

  const [targetDate, setTargetDate] = useState<Date>(() => new Date(initialTargetIso));
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => {
    const baseNow = initialNowIso ? new Date(initialNowIso) : new Date();
    return calculateTimeRemaining(new Date(initialTargetIso), baseNow);
  });
  const [isCopied, setIsCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [customDateInput, setCustomDateInput] = useState(() => {
    const d = new Date(initialTargetIso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [showCustomPicker, setShowCustomPicker] = useState(event.slug === 'date');

  const soundPlayedRef = useRef(false);

  // Live countdown ticker
  useEffect(() => {
    const tick = () => {
      const remaining = calculateTimeRemaining(targetDate, new Date());
      setTimeRemaining(remaining);

      if (remaining.isPassed && !soundPlayedRef.current) {
        soundPlayedRef.current = true;
        if (soundEnabled) {
          playSuccessChime();
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, soundEnabled]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  const handleApplyCustomDate = () => {
    if (!customDateInput) return;
    const parsed = new Date(customDateInput);
    if (!isNaN(parsed.getTime())) {
      setTargetDate(parsed);
      soundPlayedRef.current = false;
    }
  };

  const handleResetToDefault = () => {
    const original = new Date(initialTargetIso);
    setTargetDate(original);
    soundPlayedRef.current = false;
    const pad = (n: number) => String(n).padStart(2, '0');
    setCustomDateInput(
      `${original.getFullYear()}-${pad(original.getMonth() + 1)}-${pad(original.getDate())}T${pad(original.getHours())}:${pad(original.getMinutes())}`
    );
  };

  const formattedTargetDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(isRu ? 'ru-RU' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(targetDate);
    } catch {
      return targetDate.toLocaleString();
    }
  }, [targetDate, isRu]);

  const title = isRu ? event.nameRu : event.nameEn;
  const description = isRu ? event.descriptionRu : event.descriptionEn;

  // Filter other events for quick navigation (excluding current)
  const relatedEvents = useMemo(() => {
    return allEvents.filter((e) => e.slug !== event.slug).slice(0, 8);
  }, [allEvents, event.slug]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wide uppercase">
          {getEventIcon(event.slug)}
          <span>{getCategoryBadge(event.category, locale)}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>

        {description && (
          <p className="max-w-2xl text-base sm:text-lg text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Main Countdown Display */}
      <div className="p-6 sm:p-10 rounded-3xl bg-card border shadow-lg flex flex-col items-center gap-8">
        {timeRemaining.isPassed ? (
          <div className="p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center flex flex-col items-center gap-3 w-full">
            <Sparkle className="w-12 h-12 text-primary animate-bounce" weight="fill" />
            <h2 className="text-2xl sm:text-3xl font-black text-primary">
              {isRu ? 'Событие уже наступило!' : 'The event has arrived!'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {isRu
                ? 'Отсчет завершен. Вы можете указать новую дату или выбрать другое событие.'
                : 'Countdown complete. You can select a new date or explore other events.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl">
            {/* Days Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-secondary/50 border border-border/60 shadow-sm transition-transform hover:scale-[1.02]">
              <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-primary tabular-nums">
                {timeRemaining.days}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {getUnitLabel(timeRemaining.days, 'days', locale)}
              </span>
            </div>

            {/* Hours Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-secondary/50 border border-border/60 shadow-sm transition-transform hover:scale-[1.02]">
              <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-primary tabular-nums">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {getUnitLabel(timeRemaining.hours, 'hours', locale)}
              </span>
            </div>

            {/* Minutes Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-secondary/50 border border-border/60 shadow-sm transition-transform hover:scale-[1.02]">
              <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-primary tabular-nums">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {getUnitLabel(timeRemaining.minutes, 'minutes', locale)}
              </span>
            </div>

            {/* Seconds Card */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-secondary/50 border border-border/60 shadow-sm transition-transform hover:scale-[1.02]">
              <span className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-primary tabular-nums animate-pulse">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
              <span className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {getUnitLabel(timeRemaining.seconds, 'seconds', locale)}
              </span>
            </div>
          </div>
        )}

        {/* Target Date Callout & Total Units */}
        <div className="w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-muted/40 border text-xs sm:text-sm">
          <div className="flex items-center gap-2.5 text-foreground font-medium">
            <Calendar className="w-5 h-5 text-primary shrink-0" weight="duotone" />
            <span>
              <strong className="font-semibold text-muted-foreground">
                {isRu ? 'Целевая дата:' : 'Target date:'}
              </strong>{' '}
              {formattedTargetDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={
                soundEnabled
                  ? isRu ? 'Отключить звук' : 'Disable sound'
                  : isRu ? 'Включить звуковой сигнал' : 'Enable sound alert'
              }
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background hover:bg-secondary text-muted-foreground'
              }`}
            >
              {soundEnabled ? (
                <BellSimple className="w-4 h-4" weight="fill" />
              ) : (
                <BellSimpleSlash className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-background hover:bg-secondary text-foreground transition-colors font-semibold"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" weight="bold" />
                  <span className="text-emerald-500">
                    {isRu ? 'Скопировано!' : 'Copied!'}
                  </span>
                </>
              ) : (
                <>
                  <ShareNetwork className="w-4 h-4 text-muted-foreground" />
                  <span>{isRu ? 'Поделиться' : 'Share'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breakdown equivalents banner */}
        {!timeRemaining.isPassed && (
          <div className="text-xs sm:text-sm text-center text-muted-foreground">
            {isRu ? (
              <>
                Это примерно <strong>{timeRemaining.days.toLocaleString('ru-RU')}</strong>{' '}
                {getUnitLabel(timeRemaining.days, 'days', 'ru')}, или{' '}
                <strong>{timeRemaining.totalHours.toLocaleString('ru-RU')}</strong>{' '}
                {getUnitLabel(timeRemaining.totalHours, 'hours', 'ru')}, или{' '}
                <strong>{timeRemaining.totalMinutes.toLocaleString('ru-RU')}</strong>{' '}
                {getUnitLabel(timeRemaining.totalMinutes, 'minutes', 'ru')}.
              </>
            ) : (
              <>
                That is approx <strong>{timeRemaining.days.toLocaleString('en-US')}</strong>{' '}
                {getUnitLabel(timeRemaining.days, 'days', 'en')}, or{' '}
                <strong>{timeRemaining.totalHours.toLocaleString('en-US')}</strong>{' '}
                {getUnitLabel(timeRemaining.totalHours, 'hours', 'en')}, or{' '}
                <strong>{timeRemaining.totalMinutes.toLocaleString('en-US')}</strong>{' '}
                {getUnitLabel(timeRemaining.totalMinutes, 'minutes', 'en')}.
              </>
            )}
          </div>
        )}
      </div>

      {/* Custom Target Date Picker (Toggleable or for 'date' slug) */}
      <div className="p-6 rounded-3xl bg-card border shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" weight="duotone" />
            <h2 className="text-lg font-bold text-foreground">
              {isRu ? 'Настроить целевую дату' : 'Custom Target Date & Time'}
            </h2>
          </div>
          {event.slug !== 'date' && (
            <button
              onClick={() => setShowCustomPicker(!showCustomPicker)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {showCustomPicker
                ? isRu ? 'Скрыть настройки' : 'Hide settings'
                : isRu ? 'Изменить дату' : 'Change date'}
            </button>
          )}
        </div>

        {showCustomPicker && (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <input
              type="datetime-local"
              value={customDateInput}
              onChange={(e) => setCustomDateInput(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleApplyCustomDate}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              {isRu ? 'Применить дату' : 'Apply Date'}
            </button>
            <button
              onClick={handleResetToDefault}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border bg-background hover:bg-secondary font-medium text-sm transition-colors"
            >
              {isRu ? 'Сброс' : 'Reset'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Navigation to Other Popular Countdowns */}
      {relatedEvents.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              {isRu ? 'Другие события и праздники' : 'Other Events & Countdowns'}
            </h2>
            <Link
              href={`/${locale}/timer`}
              className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>{isRu ? 'Все таймеры' : 'All Timers'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {relatedEvents.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/timer/${item.slug}`}
                className="p-4 rounded-2xl border bg-card hover:border-primary transition-all flex flex-col justify-between gap-2 shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  {getEventIcon(item.slug)}
                  <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {isRu ? item.nameRu : item.nameEn}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {getCategoryBadge(item.category, locale)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
