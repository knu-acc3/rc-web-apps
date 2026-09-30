"use client";

import { useState, useSyncExternalStore } from "react";
import { Calculator, Check } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { hydrationSafeDateString } from "@/src/lib/hydrationTime";

type CountMode = "calendar" | "business";

type DateParts = {
  year: number;
  month: number;
  day: number;
  epochDay: number;
};

type DifferenceResult = {
  calendarDays: number;
  businessDays: number;
  wholeWeeks: number;
  remainingWeekDays: number;
  years: number;
  months: number;
  days: number;
  direction: "after" | "before" | "same";
};

const DAY_MS = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function localToday(): string {
  const now = new Date();
  return (
    now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate())
  );
}

const CLIENT_TODAY = localToday();
const SERVER_TODAY = hydrationSafeDateString();

function subscribeStatic(): () => void {
  return () => undefined;
}

function getClientToday(): string {
  return CLIENT_TODAY;
}

function getServerToday(): string {
  return SERVER_TODAY;
}

function epochDayFromParts(year: number, month: number, day: number): number {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return Math.floor(date.getTime() / DAY_MS);
}

function parseIsoDate(value: string): DateParts | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const epochDay = epochDayFromParts(year, month, day);
  const verification = new Date(epochDay * DAY_MS);

  if (
    verification.getUTCFullYear() !== year ||
    verification.getUTCMonth() + 1 !== month ||
    verification.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, epochDay };
}

function partsFromEpochDay(epochDay: number): DateParts {
  const date = new Date(epochDay * DAY_MS);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    epochDay,
  };
}

function formatIsoDate(parts: DateParts): string {
  return parts.year + "-" + pad(parts.month) + "-" + pad(parts.day);
}

function addDaysToIso(value: string, days: number): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return value;
  return formatIsoDate(partsFromEpochDay(parsed.epochDay + days));
}

function daysInMonth(year: number, month: number): number {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, 0);
  return date.getUTCDate();
}

function addMonthsClamped(start: DateParts, months: number): DateParts {
  const absoluteMonth = start.year * 12 + (start.month - 1) + months;
  const year = Math.floor(absoluteMonth / 12);
  const monthIndex = absoluteMonth - year * 12;
  const month = monthIndex + 1;
  const day = Math.min(start.day, daysInMonth(year, month));
  return {
    year,
    month,
    day,
    epochDay: epochDayFromParts(year, month, day),
  };
}

function calendarBreakdown(
  start: DateParts,
  endExclusive: DateParts,
): { years: number; months: number; days: number } {
  let totalMonths =
    (endExclusive.year - start.year) * 12 + (endExclusive.month - start.month);
  let anchor = addMonthsClamped(start, totalMonths);

  if (anchor.epochDay > endExclusive.epochDay) {
    totalMonths -= 1;
    anchor = addMonthsClamped(start, totalMonths);
  }

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days: endExclusive.epochDay - anchor.epochDay,
  };
}

function countBusinessDays(
  startEpochDay: number,
  endExclusiveEpochDay: number,
): number {
  const totalDays = Math.max(0, endExclusiveEpochDay - startEpochDay);
  const fullWeeks = Math.floor(totalDays / 7);
  let count = fullWeeks * 5;
  let cursor = startEpochDay + fullWeeks * 7;

  while (cursor < endExclusiveEpochDay) {
    const dayOfWeek = new Date(cursor * DAY_MS).getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count += 1;
    cursor += 1;
  }

  return count;
}

function differenceSignature(
  start: string,
  end: string,
  includeEnd: boolean,
  mode: CountMode,
): string {
  return JSON.stringify([start, end, includeEnd, mode]);
}

export default function DateDifference() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const today = useSyncExternalStore(
    subscribeStatic,
    getClientToday,
    getServerToday,
  );
  const [startOverride, setStartOverride] = useState<string | null>(null);
  const [endOverride, setEndOverride] = useState<string | null>(null);
  const [includeEnd, setIncludeEnd] = useState(false);
  const [mode, setMode] = useState<CountMode>("calendar");
  const [result, setResult] = useState<DifferenceResult | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [error, setError] = useState("");

  const startValue = startOverride ?? today;
  const endValue = endOverride ?? addDaysToIso(today, 7);
  const currentSignature = differenceSignature(
    startValue,
    endValue,
    includeEnd,
    mode,
  );
  const visibleResult = resultSignature === currentSignature ? result : null;

  const calculate = () => {
    const start = parseIsoDate(startValue);
    const end = parseIsoDate(endValue);

    if (!start || !end) {
      setError(
        isEn
          ? "Choose valid start and end dates."
          : "Выберите корректные начальную и конечную даты.",
      );
      setResult(null);
      setResultSignature(null);
      return;
    }

    const earlier = start.epochDay <= end.epochDay ? start : end;
    const later = start.epochDay <= end.epochDay ? end : start;
    const endExclusiveEpochDay = later.epochDay + (includeEnd ? 1 : 0);
    const endExclusive = partsFromEpochDay(endExclusiveEpochDay);
    const calendarDays = endExclusiveEpochDay - earlier.epochDay;
    const breakdown = calendarBreakdown(earlier, endExclusive);

    setResult({
      calendarDays,
      businessDays: countBusinessDays(earlier.epochDay, endExclusiveEpochDay),
      wholeWeeks: Math.floor(calendarDays / 7),
      remainingWeekDays: calendarDays % 7,
      years: breakdown.years,
      months: breakdown.months,
      days: breakdown.days,
      direction:
        end.epochDay > start.epochDay
          ? "after"
          : end.epochDay < start.epochDay
            ? "before"
            : "same",
    });
    setResultSignature(currentSignature);
    setError("");
  };

  const primaryTotal =
    mode === "business"
      ? visibleResult?.businessDays
      : visibleResult?.calendarDays;

  return (
    <div
      data-datetime-tool="date-difference"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn
              ? "Calculate the time between dates"
              : "Рассчитайте период между датами"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Dates are treated as calendar dates in UTC, without time-zone shifts."
              : "Даты считаются календарными датами в UTC без сдвигов часового пояса."}
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            calculate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label
                htmlFor="date-difference-start"
                className="text-sm font-semibold"
              >
                {isEn ? "Start date" : "Начальная дата"}
              </Label>
              <Input
                id="date-difference-start"
                type="date"
                value={startValue}
                onChange={(event) => {
                  setStartOverride(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
                className="mt-2 h-12"
              />
            </div>
            <div>
              <Label
                htmlFor="date-difference-end"
                className="text-sm font-semibold"
              >
                {isEn ? "End date" : "Конечная дата"}
              </Label>
              <Input
                id="date-difference-end"
                type="date"
                value={endValue}
                onChange={(event) => {
                  setEndOverride(event.target.value);
                  setError("");
                }}
                aria-invalid={Boolean(error)}
                className="mt-2 h-12"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 text-sm font-medium text-[var(--color-danger)]"
            >
              {error}
            </p>
          ) : null}

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Calculator size={20} weight="bold" />}
          >
            {isEn ? "Calculate difference" : "Рассчитать разницу"}
          </ToolPrimaryAction>
        </form>
      </section>

      {visibleResult && primaryTotal !== undefined ? (
        <section
          aria-live="polite"
          data-date-difference-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
            {mode === "business"
              ? isEn
                ? "Business days"
                : "Рабочих дней"
              : isEn
                ? "Calendar days"
                : "Календарных дней"}
          </p>
          <p
            data-total-days={visibleResult.calendarDays}
            data-business-days={visibleResult.businessDays}
            className="mt-2 text-5xl font-black tracking-tight text-[var(--color-text)]"
          >
            {primaryTotal}
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]">
            {visibleResult.direction === "after"
              ? isEn
                ? "The end date is after the start date."
                : "Конечная дата позже начальной."
              : visibleResult.direction === "before"
                ? isEn
                  ? "The end date is before the start date."
                  : "Конечная дата раньше начальной."
                : isEn
                  ? "The dates are the same."
                  : "Даты совпадают."}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {isEn ? "Weeks and days" : "Недели и дни"}
              </h3>
              <p className="mt-2 text-xl font-black text-[var(--color-text)]">
                {visibleResult.wholeWeeks}{" "}
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  {isEn ? "weeks" : "нед."}
                </span>
                {" · "}
                {visibleResult.remainingWeekDays}{" "}
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  {isEn ? "days" : "дн."}
                </span>
              </p>
            </article>

            <article
              data-ymd={
                visibleResult.years +
                "-" +
                visibleResult.months +
                "-" +
                visibleResult.days
              }
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
            >
              <h3 className="text-sm font-bold text-[var(--color-text)]">
                {isEn ? "Calendar breakdown" : "Календарный период"}
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xl font-black text-[var(--color-text)]">
                    {visibleResult.years}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "years" : "лет"}
                  </p>
                </div>
                <div>
                  <p className="text-xl font-black text-[var(--color-text)]">
                    {visibleResult.months}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "months" : "мес."}
                  </p>
                </div>
                <div>
                  <p className="text-xl font-black text-[var(--color-text)]">
                    {visibleResult.days}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {isEn ? "days" : "дн."}
                  </p>
                </div>
              </div>
            </article>
          </div>

          {mode === "business" ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "Calendar span: " +
                  visibleResult.calendarDays +
                  " days. Business-day mode excludes Saturdays and Sundays only."
                : "Календарный период: " +
                  visibleResult.calendarDays +
                  " дн. Режим рабочих дней исключает только субботы и воскресенья."}
            </p>
          ) : null}
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "Counting rules" : "Правила подсчёта"}
        description={
          isEn
            ? "Include the end date or count weekdays"
            : "Включить конечную дату или считать будни"
        }
      >
        <Label htmlFor="date-difference-mode" className="text-sm font-semibold">
          {isEn ? "Counting mode" : "Режим подсчёта"}
        </Label>
        <select
          id="date-difference-mode"
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as CountMode);
            setError("");
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
        >
          <option value="calendar">
            {isEn ? "Calendar days" : "Календарные дни"}
          </option>
          <option value="business">
            {isEn ? "Business days (Mon–Fri)" : "Рабочие дни (пн–пт)"}
          </option>
        </select>

        <Button
          type="button"
          variant={includeEnd ? "soft" : "outline"}
          aria-pressed={includeEnd}
          onClick={() => {
            setIncludeEnd((current) => !current);
            setError("");
          }}
          className="mt-4 min-h-11"
        >
          {includeEnd ? (
            <Check size={18} weight="bold" aria-hidden="true" />
          ) : (
            <span
              aria-hidden="true"
              className="size-[18px] rounded-sm border border-[var(--color-border-strong)]"
            />
          )}
          {isEn ? "Include end date" : "Включить конечную дату"}
        </Button>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "Business-day mode has no holiday calendar; public holidays are not subtracted."
            : "В режиме рабочих дней нет календаря праздников: государственные праздники не вычитаются."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
