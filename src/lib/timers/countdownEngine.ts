import { formatPluralRu } from '@/src/data/toolLocalization';

export interface TimeRemaining {
  totalMs: number;
  isPassed: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
}

export interface TargetDateConfig {
  fixedMonth?: number;
  fixedDay?: number;
  targetYear?: number;
}

/**
 * Calculates the exact next occurrence of an event.
 * If targetYear is provided, it targets that specific year.
 * Otherwise, it targets the current year if the date is still in the future,
 * or rolls over to the next year if the date has already passed.
 */
export function calculateNextTargetDate(
  config: TargetDateConfig,
  now = new Date()
): Date {
  const currentYear = now.getFullYear();
  const month = (config.fixedMonth ?? 1) - 1;
  const day = config.fixedDay ?? 1;

  if (config.targetYear) {
    return new Date(config.targetYear, month, day, 0, 0, 0, 0);
  }

  const targetThisYear = new Date(currentYear, month, day, 0, 0, 0, 0);
  if (targetThisYear.getTime() > now.getTime()) {
    return targetThisYear;
  }

  return new Date(currentYear + 1, month, day, 0, 0, 0, 0);
}

/**
 * Computes remaining time breakdown in days, hours, minutes, and seconds.
 */
export function calculateTimeRemaining(
  targetDate: Date,
  now = new Date()
): TimeRemaining {
  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const isPassed = diffMs <= 0;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalSeconds = Math.floor(diffMs / 1000);

  return {
    totalMs: diffMs,
    isPassed,
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    totalMinutes,
    totalSeconds,
  };
}

/**
 * Localized unit labels with grammatical pluralization.
 */
export function getUnitLabel(
  value: number,
  unit: 'days' | 'hours' | 'minutes' | 'seconds',
  locale: string
): string {
  const isRu = locale === 'ru';

  switch (unit) {
    case 'days':
      return isRu
        ? formatPluralRu(value, 'день', 'дня', 'дней').replace(/^\d+\s*/, '')
        : value === 1 ? 'day' : 'days';
    case 'hours':
      return isRu
        ? formatPluralRu(value, 'час', 'часа', 'часов').replace(/^\d+\s*/, '')
        : value === 1 ? 'hour' : 'hours';
    case 'minutes':
      return isRu
        ? formatPluralRu(value, 'минута', 'минуты', 'минут').replace(/^\d+\s*/, '')
        : value === 1 ? 'minute' : 'minutes';
    case 'seconds':
      return isRu
        ? formatPluralRu(value, 'секунда', 'секунды', 'секунд').replace(/^\d+\s*/, '')
        : value === 1 ? 'second' : 'seconds';
  }
}
