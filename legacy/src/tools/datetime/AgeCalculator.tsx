"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type LeapDayConvention = "feb28" | "mar1";

interface PlainDate {
  year: number;
  month: number;
  day: number;
}

interface AgeResult {
  birth: PlainDate;
  asOf: PlainDate;
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

const DAY_MS = 86_400_000;

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function parsePlainDate(value: string): PlainDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return null;
  }
  return { year, month, day };
}

function toUtcMilliseconds(date: PlainDate) {
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  return value.getTime();
}

function compareDates(left: PlainDate, right: PlainDate) {
  return toUtcMilliseconds(left) - toUtcMilliseconds(right);
}

function addYears(
  date: PlainDate,
  years: number,
  convention: LeapDayConvention,
): PlainDate {
  const targetYear = date.year + years;
  if (date.month === 2 && date.day === 29 && !isLeapYear(targetYear)) {
    return convention === "feb28"
      ? { year: targetYear, month: 2, day: 28 }
      : { year: targetYear, month: 3, day: 1 };
  }
  return { year: targetYear, month: date.month, day: date.day };
}

function addMonths(date: PlainDate, months: number): PlainDate {
  const monthIndex = date.year * 12 + date.month - 1 + months;
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;
  return {
    year,
    month,
    day: Math.min(date.day, daysInMonth(year, month)),
  };
}

function calculateAge(
  birth: PlainDate,
  asOf: PlainDate,
  convention: LeapDayConvention,
): AgeResult {
  let years = asOf.year - birth.year;
  if (compareDates(addYears(birth, years, convention), asOf) > 0) {
    years -= 1;
  }

  const yearCursor = addYears(birth, years, convention);
  let months = Math.min(
    11,
    (asOf.year - yearCursor.year) * 12 + (asOf.month - yearCursor.month),
  );
  if (compareDates(addMonths(yearCursor, months), asOf) > 0) {
    months -= 1;
  }

  const monthCursor = addMonths(yearCursor, months);
  const days = Math.round(
    (toUtcMilliseconds(asOf) - toUtcMilliseconds(monthCursor)) / DAY_MS,
  );
  const totalDays = Math.round(
    (toUtcMilliseconds(asOf) - toUtcMilliseconds(birth)) / DAY_MS,
  );

  return { birth, asOf, years, months, days, totalDays };
}

function todayAsPlainDate(): PlainDate {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function formatPlainDate(date: PlainDate, isEn: boolean) {
  const value = new Date(0);
  value.setUTCHours(0, 0, 0, 0);
  value.setUTCFullYear(date.year, date.month - 1, date.day);
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(value);
}

export default function AgeCalculator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [birthValue, setBirthValue] = useState("");
  const [asOfValue, setAsOfValue] = useState("");
  const [leapConvention, setLeapConvention] =
    useState<LeapDayConvention>("feb28");
  const [showDetails, setShowDetails] = useState(false);
  const [result, setResult] = useState<AgeResult | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const birth = parsePlainDate(birthValue);
    const asOf = asOfValue ? parsePlainDate(asOfValue) : todayAsPlainDate();

    if (!birth) {
      setError(
        isEn
          ? "Enter a valid birth date from year 0001 to 9999."
          : "Введите корректную дату рождения с 0001 по 9999 год.",
      );
      setResult(null);
      return;
    }
    if (!asOf) {
      setError(
        isEn
          ? "Enter a valid calculation date from year 0001 to 9999."
          : "Введите корректную дату расчёта с 0001 по 9999 год.",
      );
      setResult(null);
      return;
    }
    if (compareDates(birth, asOf) > 0) {
      setError(
        isEn
          ? "Birth date cannot be later than the calculation date."
          : "Дата рождения не может быть позже даты расчёта.",
      );
      setResult(null);
      return;
    }

    setResult(calculateAge(birth, asOf, leapConvention));
    setError("");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-sm">
          <Label htmlFor="age-birth-date">
            {isEn ? "Birth date" : "Дата рождения"}
          </Label>
          <Input
            id="age-birth-date"
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={birthValue}
            onChange={(event) => {
              setBirthValue(event.target.value);
              invalidate();
            }}
            className="mt-1.5 h-12"
          />
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={calculate}>
          {isEn ? "Calculate age" : "Рассчитать возраст"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the date" : "Проверьте дату"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={isEn ? "Exact calendar age" : "Точный календарный возраст"}
            className="mt-5"
          >
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[var(--color-text)]">
              <span className="text-4xl font-black tabular-nums">
                {result.years}
              </span>
              <span className="text-base font-semibold">
                {isEn ? "years" : "лет"}
              </span>
              <span className="text-3xl font-black tabular-nums">
                {result.months}
              </span>
              <span className="text-base font-semibold">
                {isEn ? "months" : "мес."}
              </span>
              <span className="text-3xl font-black tabular-nums">
                {result.days}
              </span>
              <span className="text-base font-semibold">
                {isEn ? "days" : "дн."}
              </span>
            </p>
            <p className="mt-3 text-lg font-bold text-[var(--color-text)]">
              {isEn
                ? result.totalDays.toLocaleString("en-US") + " total days"
                : result.totalDays.toLocaleString("ru-RU") + " дней всего"}
            </p>

            {showDetails ? (
              <div className="mt-4 space-y-1 border-t border-[var(--color-border-subtle)] pt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
                <p>
                  {formatPlainDate(result.birth, isEn)} →{" "}
                  {formatPlainDate(result.asOf, isEn)}
                </p>
                <p>
                  {isEn
                    ? result.years * 12 +
                      result.months +
                      " completed calendar months; " +
                      Math.floor(result.totalDays / 7).toLocaleString("en-US") +
                      " complete weeks."
                    : result.years * 12 +
                      result.months +
                      " полных календарных месяцев; " +
                      Math.floor(result.totalDays / 7).toLocaleString("ru-RU") +
                      " полных недель."}
                </p>
              </div>
            ) : null}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "Your age in years, months, days and total days will appear here."
                : "Здесь появится возраст в годах, месяцах, днях и общее число дней."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Calculation settings" : "Настройки расчёта"}
          description={
            isEn
              ? "Calculation date, leap-day convention and details"
              : "Дата расчёта, правило 29 февраля и детали"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <Label htmlFor="age-as-of-date">
                {isEn ? "Calculate as of" : "Рассчитать на дату"}
              </Label>
              <Input
                id="age-as-of-date"
                type="date"
                min="0001-01-01"
                max="9999-12-31"
                value={asOfValue}
                onChange={(event) => {
                  setAsOfValue(event.target.value);
                  invalidate();
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn ? "Blank means today." : "Пустое поле означает сегодня."}
              </p>
            </div>

            <div className="min-w-0">
              <Label htmlFor="age-leap-convention">
                {isEn ? "Feb 29 anniversary" : "Годовщина 29 февраля"}
              </Label>
              <select
                id="age-leap-convention"
                value={leapConvention}
                onChange={(event) => {
                  setLeapConvention(event.target.value as LeapDayConvention);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="feb28">
                  {isEn ? "Use February 28" : "Считать 28 февраля"}
                </option>
                <option value="mar1">
                  {isEn ? "Use March 1" : "Считать 1 марта"}
                </option>
              </select>
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
            <input
              type="checkbox"
              checked={showDetails}
              onChange={(event) => setShowDetails(event.target.checked)}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            {isEn ? "Show calculation details" : "Показать детали расчёта"}
          </label>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Dates are compared as calendar dates with UTC day arithmetic. Times, daylight-saving changes and time-zone offsets are ignored."
            : "Даты сравниваются как календарные даты с расчётом дней в UTC. Время, переходы на летнее время и часовые пояса не учитываются."}
        </p>
      </section>
    </div>
  );
}
