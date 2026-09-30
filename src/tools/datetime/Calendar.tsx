"use client";

import { Fragment, useState, type FormEvent } from "react";
import { CalendarBlank, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";

interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface CalendarCell {
  date: DateParts;
  inMonth: boolean;
}

type WeekStart = "monday" | "sunday";

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS = {
  en: {
    monday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    sunday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
  ru: {
    monday: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
    sunday: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  },
} as const;

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  const days = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return days[month - 1] ?? 0;
}

function parseDateOnly(value: string): DateParts | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1000 || year > 9999 || month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month)) return null;
  return { year, month, day };
}

function formatDateOnly(date: DateParts): string {
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

function toUtcDate(date: DateParts): Date {
  return new Date(Date.UTC(date.year, date.month - 1, date.day));
}

function fromUtcDate(date: Date): DateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function addDays(date: DateParts, amount: number): DateParts {
  return fromUtcDate(new Date(toUtcDate(date).getTime() + amount * DAY_MS));
}

function getWeekday(date: DateParts): number {
  return toUtcDate(date).getUTCDay();
}

function sameDate(first: DateParts, second: DateParts): boolean {
  return (
    first.year === second.year &&
    first.month === second.month &&
    first.day === second.day
  );
}

function getIsoWeek(date: DateParts): number {
  const utc = toUtcDate(date);
  const isoDay = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - isoDay);
  const yearStart = Date.UTC(utc.getUTCFullYear(), 0, 1);
  return Math.ceil((utc.getTime() - yearStart + DAY_MS) / (7 * DAY_MS));
}

function getToday(): DateParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function getCalendarWeeks(
  year: number,
  month: number,
  weekStart: WeekStart,
): CalendarCell[][] {
  const firstDay = { year, month, day: 1 };
  const weekday = getWeekday(firstDay);
  const offset = weekStart === "monday" ? (weekday + 6) % 7 : weekday;
  const gridStart = addDays(firstDay, -offset);
  const cellCount = Math.ceil((offset + getDaysInMonth(year, month)) / 7) * 7;

  return Array.from({ length: cellCount / 7 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = addDays(gridStart, weekIndex * 7 + dayIndex);
      return { date, inMonth: date.year === year && date.month === month };
    }),
  );
}

function formatMonth(year: number, month: number, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatLongDate(date: DateParts, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

export default function Calendar() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [today] = useState(getToday);
  const [dateInput, setDateInput] = useState(() => formatDateOnly(getToday()));
  const [selectedDate, setSelectedDate] = useState<DateParts>(getToday);
  const [viewYear, setViewYear] = useState(() => getToday().year);
  const [viewMonth, setViewMonth] = useState(() => getToday().month);
  const [weekStart, setWeekStart] = useState<WeekStart>("monday");
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);

  const parsedInput = parseDateOnly(dateInput);
  const weeks = getCalendarWeeks(viewYear, viewMonth, weekStart);
  const weekdayLabels = WEEKDAYS[isEn ? "en" : "ru"][weekStart];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedInput) return;
    setSelectedDate(parsedInput);
    setViewYear(parsedInput.year);
    setViewMonth(parsedInput.month);
  };

  const moveMonth = (amount: number) => {
    const index = viewYear * 12 + (viewMonth - 1) + amount;
    const nextYear = Math.floor(index / 12);
    const nextMonth = (((index % 12) + 12) % 12) + 1;
    if (nextYear < 1000 || nextYear > 9999) return;
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <Label htmlFor="calendar-date">
            {isEn ? "Go to date" : "Перейти к дате"}
          </Label>
          <Input
            id="calendar-date"
            type="date"
            min="1000-01-01"
            max="9999-12-31"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            aria-invalid={!parsedInput}
            aria-describedby="calendar-date-help"
            className={cn(
              "mt-1.5 h-12",
              !parsedInput && "border-[var(--color-danger)]",
            )}
          />
          <p
            id="calendar-date-help"
            className={cn(
              "mt-1 text-xs text-[var(--color-text-muted)]",
              !parsedInput && "text-[var(--color-danger)]",
            )}
          >
            {parsedInput
              ? isEn
                ? `Today: ${formatLongDate(today, true)}`
                : `Сегодня: ${formatLongDate(today, false)}`
              : isEn
                ? "Choose a valid date."
                : "Выберите корректную дату."}
          </p>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!parsedInput}
          leadingIcon={<CalendarBlank size={20} />}
        >
          {isEn ? "Go to date" : "Перейти к дате"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={isEn ? "Calendar display" : "Отображение календаря"}
          description={
            isEn
              ? "Week start and ISO week numbers"
              : "Начало недели и номера недель ISO"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="calendar-week-start">
                {isEn ? "Week starts on" : "Первый день недели"}
              </Label>
              <Select
                value={weekStart}
                onValueChange={(value) => setWeekStart(value as WeekStart)}
              >
                <SelectTrigger id="calendar-week-start" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">
                    {isEn ? "Monday" : "Понедельник"}
                  </SelectItem>
                  <SelectItem value="sunday">
                    {isEn ? "Sunday" : "Воскресенье"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showWeekNumbers}
                onChange={(event) => setShowWeekNumbers(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Show ISO week numbers" : "Показывать недели ISO"}
            </label>
          </div>
        </AdvancedSettings>
      </form>

      <Card className="overflow-hidden p-0" aria-live="polite">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] p-3 sm:p-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => moveMonth(-1)}
            aria-label={isEn ? "Previous month" : "Предыдущий месяц"}
          >
            <CaretLeft size={18} />
          </Button>
          <h2 className="min-w-0 text-center text-base font-bold capitalize sm:text-lg">
            {formatMonth(viewYear, viewMonth, isEn)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => moveMonth(1)}
            aria-label={isEn ? "Next month" : "Следующий месяц"}
          >
            <CaretRight size={18} />
          </Button>
        </div>

        <div
          className={cn(
            "grid p-2 sm:p-3",
            showWeekNumbers
              ? "grid-cols-[2rem_repeat(7,minmax(0,1fr))]"
              : "grid-cols-7",
          )}
        >
          {showWeekNumbers ? (
            <div className="flex min-h-9 items-center justify-center text-[0.65rem] font-semibold text-[var(--color-text-subtle)]">
              #
            </div>
          ) : null}
          {weekdayLabels.map((weekday) => (
            <div
              key={weekday}
              className="flex min-h-9 items-center justify-center text-[0.65rem] font-semibold uppercase text-[var(--color-text-muted)] sm:text-xs"
            >
              {weekday}
            </div>
          ))}

          {weeks.map((week) => {
            const isoAnchor =
              weekStart === "sunday" ? addDays(week[0].date, 1) : week[0].date;
            return (
              <Fragment key={formatDateOnly(week[0].date)}>
                {showWeekNumbers ? (
                  <div className="flex min-h-11 items-center justify-center font-mono text-[0.65rem] text-[var(--color-text-subtle)]">
                    {getIsoWeek(isoAnchor)}
                  </div>
                ) : null}
                {week.map((cell) => {
                  const isToday = sameDate(cell.date, today);
                  const isSelected = sameDate(cell.date, selectedDate);
                  return (
                    <div
                      key={formatDateOnly(cell.date)}
                      aria-current={isToday ? "date" : undefined}
                      className={cn(
                        "m-0.5 flex min-h-11 min-w-0 items-center justify-center rounded-[var(--radius-sm)] text-sm tabular-nums",
                        !cell.inMonth &&
                          "text-[var(--color-text-subtle)] opacity-55",
                        isSelected &&
                          !isToday &&
                          "ring-2 ring-inset ring-[var(--color-primary-ring)]",
                        isToday &&
                          "bg-[var(--color-primary)] font-bold text-[var(--color-primary-foreground)]",
                      )}
                    >
                      {cell.date.day}
                    </div>
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
