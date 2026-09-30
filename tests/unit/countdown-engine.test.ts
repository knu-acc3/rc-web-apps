import { describe, it, expect } from 'vitest';
import {
  calculateNextTargetDate,
  calculateTimeRemaining,
  getUnitLabel,
} from '@/src/lib/timers/countdownEngine';

describe('countdownEngine', () => {
  describe('calculateNextTargetDate', () => {
    it('целевая дата лета (1 июня) выбирается в текущем году, если еще не прошла', () => {
      const now = new Date(2026, 4, 15); // 15 мая 2026
      const target = calculateNextTargetDate({ fixedMonth: 6, fixedDay: 1 }, now);
      expect(target.getFullYear()).toBe(2026);
      expect(target.getMonth()).toBe(5); // Июнь (0-индекс)
      expect(target.getDate()).toBe(1);
    });

    it('целевая дата лета переносится на следующий год, если в текущем уже прошла', () => {
      const now = new Date(2026, 8, 20); // 20 сентября 2026
      const target = calculateNextTargetDate({ fixedMonth: 6, fixedDay: 1 }, now);
      expect(target.getFullYear()).toBe(2027);
      expect(target.getMonth()).toBe(5);
      expect(target.getDate()).toBe(1);
    });

    it('событие с фиксированным годом (Олимпиада 2028) всегда указывает на указанный год', () => {
      const now = new Date(2026, 8, 20);
      const target = calculateNextTargetDate(
        { fixedMonth: 7, fixedDay: 14, targetYear: 2028 },
        now
      );
      expect(target.getFullYear()).toBe(2028);
      expect(target.getMonth()).toBe(6); // Июль
      expect(target.getDate()).toBe(14);
    });
  });

  describe('calculateTimeRemaining', () => {
    it('корректно раскладывает разницу во времени на дни, часы, минуты и секунды', () => {
      const now = new Date(2026, 0, 1, 0, 0, 0); // 1 января 2026 00:00:00
      const target = new Date(2026, 0, 3, 4, 15, 30); // Через 2 дня, 4 часа, 15 мин, 30 сек
      const res = calculateTimeRemaining(target, now);

      expect(res.days).toBe(2);
      expect(res.hours).toBe(4);
      expect(res.minutes).toBe(15);
      expect(res.seconds).toBe(30);
      expect(res.isPassed).toBe(false);
    });

    it('возвращает isPassed=true для прошедшей даты', () => {
      const now = new Date(2026, 5, 1);
      const past = new Date(2026, 4, 1);
      const res = calculateTimeRemaining(past, now);

      expect(res.isPassed).toBe(true);
      expect(res.days).toBe(0);
      expect(res.hours).toBe(0);
    });
  });

  describe('getUnitLabel', () => {
    it('корректно склоняет русские единицы времени', () => {
      expect(getUnitLabel(1, 'days', 'ru')).toBe('день');
      expect(getUnitLabel(2, 'days', 'ru')).toBe('дня');
      expect(getUnitLabel(5, 'days', 'ru')).toBe('дней');
      expect(getUnitLabel(21, 'days', 'ru')).toBe('день');
      expect(getUnitLabel(22, 'days', 'ru')).toBe('дня');

      expect(getUnitLabel(1, 'hours', 'ru')).toBe('час');
      expect(getUnitLabel(3, 'hours', 'ru')).toBe('часа');
      expect(getUnitLabel(11, 'hours', 'ru')).toBe('часов');

      expect(getUnitLabel(1, 'minutes', 'ru')).toBe('минута');
      expect(getUnitLabel(4, 'minutes', 'ru')).toBe('минуты');
      expect(getUnitLabel(10, 'minutes', 'ru')).toBe('минут');

      expect(getUnitLabel(1, 'seconds', 'ru')).toBe('секунда');
      expect(getUnitLabel(2, 'seconds', 'ru')).toBe('секунды');
      expect(getUnitLabel(5, 'seconds', 'ru')).toBe('секунд');
    });

    it('корректно формирует английские единицы времени', () => {
      expect(getUnitLabel(1, 'days', 'en')).toBe('day');
      expect(getUnitLabel(5, 'days', 'en')).toBe('days');
      expect(getUnitLabel(1, 'hours', 'en')).toBe('hour');
      expect(getUnitLabel(2, 'hours', 'en')).toBe('hours');
    });
  });
});
