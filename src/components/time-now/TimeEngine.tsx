'use client';

import React, { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { CalendarPlus, SlidersHorizontal, ArrowClockwise } from '@phosphor-icons/react';
import { AnalogClockCanvas } from './AnalogClockCanvas';
import { SunCycleChart } from './SunCycleChart';
import { calculateSolarTimes, type SolarCalculationResult } from '@/src/lib/time-now/solarMath';
import type { TimeLocation } from '@/src/types/time-now';
import { useLanguage } from '@/src/i18n/LanguageContext';
import { Button } from '@/src/components/ui/button';
import { downloadBlob } from '@/src/utils/exportHelpers';

const emptySubscribe = () => () => {};

export interface TimeEngineProps {
  readonly location: TimeLocation;
}

export function TimeEngine({ location }: TimeEngineProps) {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const intlLocale = isEn ? 'en-US' : 'ru-RU';

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [is24Hour, setIs24Hour] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [sliderOffsetHours, setSliderOffsetHours] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentTime(new Date());
    });

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Effective time taking interactive slider into account
  const effectiveTime = useMemo(() => {
    const base = currentTime || new Date();
    if (sliderOffsetHours === 0) return base;
    return new Date(base.getTime() + sliderOffsetHours * 3600 * 1000);
  }, [currentTime, sliderOffsetHours]);

  const solarData: SolarCalculationResult = useMemo(() => {
    return calculateSolarTimes(
      location.latitude,
      location.longitude,
      location.timezoneIana,
      effectiveTime,
    );
  }, [location, effectiveTime]);

  const formattedTime = useMemo(() => {
    if (!effectiveTime) return '--:--:--';
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        timeZone: location.timezoneIana,
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds && sliderOffsetHours === 0 ? '2-digit' : undefined,
        hour12: !is24Hour,
      }).format(effectiveTime);
    } catch {
      return effectiveTime.toTimeString().split(' ')[0];
    }
  }, [effectiveTime, intlLocale, location.timezoneIana, is24Hour, showSeconds, sliderOffsetHours]);

  const formattedDate = useMemo(() => {
    if (!effectiveTime) return '';
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        timeZone: location.timezoneIana,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(effectiveTime);
    } catch {
      return effectiveTime.toDateString();
    }
  }, [effectiveTime, intlLocale, location.timezoneIana]);

  // Local user time for side-by-side comparison
  const formattedUserLocalTime = useMemo(() => {
    if (!effectiveTime) return '';
    try {
      return new Intl.DateTimeFormat(intlLocale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour,
      }).format(effectiveTime);
    } catch {
      return '';
    }
  }, [effectiveTime, intlLocale, is24Hour]);

  // Determine target city hour to check if inside working hours (9:00 - 18:00)
  const targetCityHour = useMemo(() => {
    if (!effectiveTime) return 12;
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: location.timezoneIana,
        hour: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(effectiveTime);
      const hourPart = parts.find((p) => p.type === 'hour');
      return hourPart ? parseInt(hourPart.value, 10) : 12;
    } catch {
      return 12;
    }
  }, [effectiveTime, location.timezoneIana]);

  const isWorkingHours = targetCityHour >= 9 && targetCityHour < 18;

  const cityName = isEn ? location.nameEn || location.nameRu : location.nameRu;
  const countryName = isEn ? location.countryEn || location.countryRu : location.countryRu;

  const offsetHours = location.utcOffsetMinutes ? location.utcOffsetMinutes / 60 : 0;
  const offsetString = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

  // Export .ics calendar event
  const exportIcs = () => {
    const start = effectiveTime;
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, '0');
    const toIcsDate = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RC Web App//World Time Meeting//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:meet-${Date.now()}@rcwebapp.com`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${isEn ? `Meeting in ${cityName}` : `Встреча в ${cityName}`}`,
      `DESCRIPTION:${isEn ? `Time in ${cityName}: ${formattedTime} (${location.timezoneIana})` : `Время в ${cityName}: ${formattedTime} (${location.timezoneIana})`}`,
      `LOCATION:${cityName}, ${countryName}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    downloadBlob(new Blob([icsData], { type: 'text/calendar;charset=utf-8' }), `meeting_${location.slug}.ics`);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4 sm:p-6 border rounded-3xl bg-card shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {cityName} ({countryName})
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-mono">
          {location.timezoneIana} · {offsetString}
        </p>
      </div>

      {/* Analog Clock */}
      <AnalogClockCanvas timezoneIana={location.timezoneIana} size={240} showSeconds={showSeconds && sliderOffsetHours === 0} />

      {/* Digital Clock Display */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-4xl sm:text-6xl font-mono font-bold tracking-tight text-primary tabular-nums">
          {mounted ? formattedTime : '--:--:--'}
        </div>
        <div className="text-sm font-medium text-muted-foreground capitalize">
          {mounted ? formattedDate : ''}
        </div>
      </div>

      {/* Working hours indicator */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            isWorkingHours
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {isWorkingHours
            ? isEn ? '🟢 Working Hours (09:00 - 18:00)' : '🟢 Рабочее время (09:00 - 18:00)'
            : isEn ? '🌙 Outside Working Hours' : '🌙 Нерабочее время'}
        </span>
      </div>

      {/* Time Difference Slider */}
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold flex items-center gap-1.5 text-[var(--color-text)]">
            <SlidersHorizontal size={14} className="text-[var(--color-primary)]" />
            {isEn ? 'Time Difference Slider' : 'Интерактивный ползунок времени'}
          </span>
          {sliderOffsetHours !== 0 && (
            <button
              type="button"
              onClick={() => setSliderOffsetHours(0)}
              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
            >
              <ArrowClockwise size={12} />
              {isEn ? 'Reset' : 'Сбросить'}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-1">
          <span>{isEn ? 'Your local time:' : 'Ваше местное время:'} <strong>{formattedUserLocalTime}</strong></span>
          <span>{sliderOffsetHours >= 0 ? `+${sliderOffsetHours}` : sliderOffsetHours} h</span>
        </div>

        <input
          type="range"
          min={-12}
          max={12}
          step={1}
          value={sliderOffsetHours}
          onChange={(e) => setSliderOffsetHours(Number(e.target.value))}
          className="w-full min-h-[36px] accent-[var(--color-primary)] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-[var(--color-text-subtle)] mt-0.5">
          <span>-12h</span>
          <span>{isEn ? 'Now' : 'Сейчас'}</span>
          <span>+12h</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center w-full">
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="min-h-[44px] px-4 py-2 border rounded-xl hover:bg-secondary text-xs font-semibold"
        >
          {is24Hour ? (isEn ? 'Format: 24h' : 'Формат: 24h') : (isEn ? 'Format: 12h' : 'Формат: 12h')}
        </button>
        <button
          onClick={() => setShowSeconds(!showSeconds)}
          className="min-h-[44px] px-4 py-2 border rounded-xl hover:bg-secondary text-xs font-semibold"
        >
          {showSeconds ? (isEn ? 'Hide seconds' : 'Скрыть секунды') : (isEn ? 'Show seconds' : 'Показать секунды')}
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={exportIcs}
          className="min-h-[44px] gap-1.5 text-xs font-semibold"
        >
          <CalendarPlus size={16} />
          {isEn ? 'Export meeting (.ics)' : 'Экспорт встречи (.ics)'}
        </Button>
      </div>

      {/* Sun Phase Cycle */}
      <SunCycleChart solarData={solarData} />
    </div>
  );
}
