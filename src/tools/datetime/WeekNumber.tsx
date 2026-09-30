"use client";

import { useState, type FormEvent } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
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

interface WeekResult {
  date: DateParts;
  system: WeekSystem;
  weekYear: number;
  week: number;
  weekday: number;
  start: DateParts;
  end: DateParts;
  showDetails: boolean;
}

type WeekSystem = "iso" | "sunday";

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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

function getToday(): DateParts {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function getIsoWeekInfo(
  date: DateParts,
): Omit<WeekResult, "date" | "system" | "showDetails"> {
  const utc = toUtcDate(date);
  const weekday = utc.getUTCDay() || 7;
  const start = addDays(date, 1 - weekday);
  const end = addDays(start, 6);
  const thursday = new Date(utc);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - weekday);
  const weekYear = thursday.getUTCFullYear();
  const yearStart = Date.UTC(weekYear, 0, 1);
  const week = Math.ceil(
    (thursday.getTime() - yearStart + DAY_MS) / (7 * DAY_MS),
  );
  return { weekYear, week, weekday, start, end };
}

function getSundayWeekInfo(
  date: DateParts,
): Omit<WeekResult, "date" | "system" | "showDetails"> {
  const utc = toUtcDate(date);
  const weekdayIndex = utc.getUTCDay();
  const yearStart = new Date(Date.UTC(date.year, 0, 1));
  const dayOfYear =
    Math.floor((utc.getTime() - yearStart.getTime()) / DAY_MS) + 1;
  const week = Math.floor((dayOfYear + yearStart.getUTCDay() - 1) / 7) + 1;
  const start = addDays(date, -weekdayIndex);
  return {
    weekYear: date.year,
    week,
    weekday: weekdayIndex + 1,
    start,
    end: addDays(start, 6),
  };
}

function formatWeekLabel(result: WeekResult): string {
  return `${result.weekYear}-W${String(result.week).padStart(2, "0")}`;
}

function formatLongDate(date: DateParts, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

function formatWeekday(date: DateParts, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    weekday: "long",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

export default function WeekNumber() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [dateInput, setDateInput] = useState(() => formatDateOnly(getToday()));
  const [weekSystem, setWeekSystem] = useState<WeekSystem>("iso");
  const [showDetails, setShowDetails] = useState(true);
  const [result, setResult] = useState<WeekResult | null>(null);

  const parsedDate = parseDateOnly(dateInput);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!parsedDate) return;
    const info =
      weekSystem === "iso"
        ? getIsoWeekInfo(parsedDate)
        : getSundayWeekInfo(parsedDate);
    setResult({
      date: parsedDate,
      system: weekSystem,
      showDetails,
      ...info,
    });
  };

  const resetResult = () => setResult(null);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Card className="p-4 sm:p-5">
          <Label htmlFor="week-number-date">{isEn ? "Date" : "Дата"}</Label>
          <Input
            id="week-number-date"
            type="date"
            min="1000-01-01"
            max="9999-12-31"
            value={dateInput}
            onChange={(event) => {
              setDateInput(event.target.value);
              resetResult();
            }}
            aria-invalid={!parsedDate}
            aria-describedby="week-number-date-help"
            className={cn(
              "mt-1.5 h-12",
              !parsedDate && "border-[var(--color-danger)]",
            )}
          />
          <p
            id="week-number-date-help"
            className={cn(
              "mt-1 text-xs text-[var(--color-text-muted)]",
              !parsedDate && "text-[var(--color-danger)]",
            )}
          >
            {parsedDate
              ? isEn
                ? "ISO 8601 is used by default."
                : "По умолчанию используется ISO 8601."
              : isEn
                ? "Choose a valid date."
                : "Выберите корректную дату."}
          </p>
        </Card>

        <ToolPrimaryAction
          type="submit"
          disabled={!parsedDate}
          leadingIcon={<CalendarBlank size={20} />}
        >
          {isEn ? "Find week number" : "Определить неделю"}
        </ToolPrimaryAction>

        <AdvancedSettings
          title={isEn ? "Week system and details" : "Система недели и детали"}
          description={
            isEn
              ? "ISO or Sunday-start numbering and the week range"
              : "Нумерация ISO или с воскресенья и диапазон недели"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="week-number-system">
                {isEn ? "Week system" : "Система недели"}
              </Label>
              <Select
                value={weekSystem}
                onValueChange={(value) => {
                  setWeekSystem(value as WeekSystem);
                  resetResult();
                }}
              >
                <SelectTrigger id="week-number-system" className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iso">ISO 8601 · Monday</SelectItem>
                  <SelectItem value="sunday">
                    {isEn
                      ? "Sunday-start · Jan 1 in week 1"
                      : "С воскресенья · 1 января в неделе 1"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={(event) => {
                  setShowDetails(event.target.checked);
                  resetResult();
                }}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Show week range" : "Показать диапазон недели"}
            </label>
          </div>
        </AdvancedSettings>
      </form>

      {result ? (
        <Card className="overflow-hidden p-0" aria-live="polite">
          <div className="border-b border-[var(--color-border)] p-4 text-center sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {result.system === "iso"
                ? "ISO 8601"
                : isEn
                  ? "Sunday-start"
                  : "Неделя с воскресенья"}
            </p>
            <p className="mt-1 font-mono text-3xl font-extrabold sm:text-4xl">
              {formatWeekLabel(result)}
            </p>
            <p className="mt-1 text-sm capitalize text-[var(--color-text-muted)]">
              {formatLongDate(result.date, isEn)}
            </p>
          </div>

          <div className="grid divide-y divide-[var(--color-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Week-year" : "Год недели"}
              </p>
              <p className="mt-1 font-mono text-xl font-bold">
                {result.weekYear}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Week" : "Неделя"}
              </p>
              <p className="mt-1 font-mono text-xl font-bold">{result.week}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">
                {isEn ? "Day" : "День"}
              </p>
              <p className="mt-1 text-sm font-bold capitalize">
                {formatWeekday(result.date, isEn)} · {result.weekday}
              </p>
            </div>
          </div>

          {result.showDetails ? (
            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
              <p>
                <span className="font-semibold">
                  {isEn ? "Week range:" : "Диапазон недели:"}
                </span>{" "}
                <span className="font-mono">
                  {formatDateOnly(result.start)} – {formatDateOnly(result.end)}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {result.system === "iso"
                  ? isEn
                    ? "ISO weeks start Monday; week 1 contains the year's first Thursday."
                    : "Неделя ISO начинается в понедельник; неделя 1 содержит первый четверг года."
                  : isEn
                    ? "Weeks start Sunday; the week containing January 1 is week 1."
                    : "Неделя начинается в воскресенье; неделя с 1 января считается первой."}
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
