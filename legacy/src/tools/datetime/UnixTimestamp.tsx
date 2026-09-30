"use client";

import { useState } from "react";
import { copyText } from "@/src/components/CopyButton";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type Direction = "timestamp-to-date" | "date-to-timestamp";
type TimestampUnit = "seconds" | "milliseconds";
type TimeZoneMode = "utc" | "local";

interface ConversionResult {
  date: Date;
  milliseconds: bigint;
}

const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000n;

function parseTimestamp(
  value: string,
  unit: TimestampUnit,
): ConversionResult | null {
  const normalized = value.trim();
  if (!/^[+-]?\d+$/.test(normalized)) return null;

  try {
    const timestamp = BigInt(normalized);
    const milliseconds = unit === "seconds" ? timestamp * 1000n : timestamp;
    if (
      milliseconds < -MAX_DATE_MILLISECONDS ||
      milliseconds > MAX_DATE_MILLISECONDS
    ) {
      return null;
    }

    const date = new Date(Number(milliseconds));
    if (Number.isNaN(date.getTime())) return null;
    return { date, milliseconds };
  } catch {
    return null;
  }
}

function parseDateTime(
  value: string,
  timeZone: TimeZoneMode,
): ConversionResult | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value,
  );
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? "0");
  if (
    year < 1 ||
    year > 9999 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }

  const date = new Date(0);
  if (timeZone === "utc") {
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(hour, minute, second, 0);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day ||
      date.getUTCHours() !== hour ||
      date.getUTCMinutes() !== minute ||
      date.getUTCSeconds() !== second
    ) {
      return null;
    }
  } else {
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, minute, second, 0);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day ||
      date.getHours() !== hour ||
      date.getMinutes() !== minute ||
      date.getSeconds() !== second
    ) {
      return null;
    }
  }

  return { date, milliseconds: BigInt(date.getTime()) };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateTimeInputValue(date: Date, timeZone: TimeZoneMode) {
  const year = timeZone === "utc" ? date.getUTCFullYear() : date.getFullYear();
  const month = (timeZone === "utc" ? date.getUTCMonth() : date.getMonth()) + 1;
  const day = timeZone === "utc" ? date.getUTCDate() : date.getDate();
  const hour = timeZone === "utc" ? date.getUTCHours() : date.getHours();
  const minute = timeZone === "utc" ? date.getUTCMinutes() : date.getMinutes();
  const second = timeZone === "utc" ? date.getUTCSeconds() : date.getSeconds();
  return (
    String(year).padStart(4, "0") +
    "-" +
    pad(month) +
    "-" +
    pad(day) +
    "T" +
    pad(hour) +
    ":" +
    pad(minute) +
    ":" +
    pad(second)
  );
}

function displayDate(date: Date, timeZone: TimeZoneMode, isEn: boolean) {
  try {
    const formatted = new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
      dateStyle: "long",
      timeStyle: "medium",
      ...(timeZone === "utc" ? { timeZone: "UTC" } : {}),
    }).format(date);
    return timeZone === "utc" ? formatted + " UTC" : formatted;
  } catch {
    return date.toISOString();
  }
}

export default function UnixTimestamp() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [direction, setDirection] = useState<Direction>("timestamp-to-date");
  const [unit, setUnit] = useState<TimestampUnit>("seconds");
  const [timeZone, setTimeZone] = useState<TimeZoneMode>("utc");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const invalidate = () => {
    setResult(null);
    setError("");
    setCopied(false);
  };

  const convert = () => {
    const nextResult =
      direction === "timestamp-to-date"
        ? parseTimestamp(value, unit)
        : parseDateTime(value, timeZone);

    if (!nextResult) {
      setResult(null);
      setError(
        direction === "timestamp-to-date"
          ? isEn
            ? "Enter a whole Unix timestamp within the JavaScript Date range."
            : "Введите целый Unix timestamp в пределах диапазона JavaScript Date."
          : isEn
            ? "Enter a valid date and time from year 0001 to 9999."
            : "Введите корректные дату и время с 0001 по 9999 год.",
      );
      return;
    }

    setResult(nextResult);
    setError("");
    setCopied(false);
  };

  const useCurrentTime = () => {
    const now = new Date();
    setValue(
      direction === "timestamp-to-date"
        ? unit === "seconds"
          ? String(Math.floor(now.getTime() / 1000))
          : String(now.getTime())
        : dateTimeInputValue(now, timeZone),
    );
    invalidate();
  };

  const timestampOutput = result
    ? unit === "seconds"
      ? (result.milliseconds / 1000n).toString()
      : result.milliseconds.toString()
    : "";
  const dateOutput = result ? displayDate(result.date, timeZone, isEn) : "";
  const copyValue =
    direction === "timestamp-to-date"
      ? (result?.date.toISOString() ?? "")
      : timestampOutput;

  const copyResult = async () => {
    const success = await copyText(copyValue);
    if (!success) {
      setError(
        isEn
          ? "Clipboard access was denied."
          : "Браузер запретил доступ к буферу обмена.",
      );
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <Label htmlFor="unix-value">
          {direction === "timestamp-to-date"
            ? isEn
              ? "Unix timestamp (" + unit + ")"
              : "Unix timestamp (" +
                (unit === "seconds" ? "секунды" : "миллисекунды") +
                ")"
            : isEn
              ? "Date and time interpreted as " +
                (timeZone === "utc" ? "UTC" : "browser local time")
              : "Дата и время в " +
                (timeZone === "utc" ? "UTC" : "локальном времени браузера")}
        </Label>
        <Input
          id="unix-value"
          type={direction === "timestamp-to-date" ? "text" : "datetime-local"}
          inputMode={direction === "timestamp-to-date" ? "text" : undefined}
          step={direction === "date-to-timestamp" ? 1 : undefined}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            invalidate();
          }}
          autoComplete="off"
          className="mt-1.5 h-12 font-mono text-base"
        />

        <ToolPrimaryAction type="button" className="mt-4" onClick={convert}>
          {direction === "timestamp-to-date"
            ? isEn
              ? "Convert to date"
              : "Преобразовать в дату"
            : isEn
              ? "Convert to timestamp"
              : "Преобразовать в timestamp"}
        </ToolPrimaryAction>

        <Button
          type="button"
          variant="ghost"
          size="md"
          className="mt-2 px-2 text-[var(--color-text-muted)]"
          onClick={useCurrentTime}
        >
          {isEn ? "Use current time" : "Использовать текущее время"}
        </Button>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Check the value" : "Проверьте значение"}
            description={error}
            className="mt-5"
          />
        ) : result ? (
          <ToolResult
            status="success"
            title={
              direction === "timestamp-to-date"
                ? isEn
                  ? "Converted date"
                  : "Готовая дата"
                : isEn
                  ? "Unix timestamp"
                  : "Unix timestamp"
            }
            className="mt-5"
            actions={
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => void copyResult()}
              >
                {copied
                  ? isEn
                    ? "Copied"
                    : "Скопировано"
                  : direction === "timestamp-to-date"
                    ? isEn
                      ? "Copy ISO"
                      : "Копировать ISO"
                    : isEn
                      ? "Copy"
                      : "Копировать"}
              </Button>
            }
          >
            {direction === "timestamp-to-date" ? (
              <>
                <p className="break-words text-2xl font-black leading-tight text-[var(--color-text)] sm:text-3xl">
                  {dateOutput}
                </p>
                <p className="mt-3 break-all font-mono text-sm text-[var(--color-text-muted)]">
                  {result.date.toISOString()}
                </p>
              </>
            ) : (
              <>
                <p className="break-all font-mono text-4xl font-black leading-none text-[var(--color-text)] sm:text-5xl">
                  {timestampOutput}
                </p>
                <p className="mt-3 break-all font-mono text-sm text-[var(--color-text-muted)]">
                  {result.date.toISOString()}
                </p>
              </>
            )}
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The converted value will appear here."
                : "Преобразованное значение появится здесь."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Conversion settings" : "Настройки преобразования"}
          description={
            isEn
              ? "Direction, timestamp unit and time-zone display"
              : "Направление, единицы timestamp и часовой пояс"
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="min-w-0">
              <Label htmlFor="unix-direction">
                {isEn ? "Direction" : "Направление"}
              </Label>
              <select
                id="unix-direction"
                value={direction}
                onChange={(event) => {
                  setDirection(event.target.value as Direction);
                  setValue("");
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="timestamp-to-date">
                  {isEn ? "Timestamp → date" : "Timestamp → дата"}
                </option>
                <option value="date-to-timestamp">
                  {isEn ? "Date → timestamp" : "Дата → timestamp"}
                </option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="unix-unit">
                {isEn ? "Timestamp unit" : "Единицы timestamp"}
              </Label>
              <select
                id="unix-unit"
                value={unit}
                onChange={(event) => {
                  setUnit(event.target.value as TimestampUnit);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="seconds">{isEn ? "Seconds" : "Секунды"}</option>
                <option value="milliseconds">
                  {isEn ? "Milliseconds" : "Миллисекунды"}
                </option>
              </select>
            </div>

            <div className="min-w-0">
              <Label htmlFor="unix-timezone">
                {isEn ? "Time zone" : "Часовой пояс"}
              </Label>
              <select
                id="unix-timezone"
                value={timeZone}
                onChange={(event) => {
                  setTimeZone(event.target.value as TimeZoneMode);
                  invalidate();
                }}
                className="mt-1.5 h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
              >
                <option value="utc">UTC</option>
                <option value="local">
                  {isEn ? "Browser local time" : "Локальное время браузера"}
                </option>
              </select>
            </div>
          </div>
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "Integer timestamps are parsed with BigInt, including negative values before 1970. Supported limits are ±8,640,000,000,000 seconds or ±8,640,000,000,000,000 milliseconds. Local date input follows the browser time zone and daylight-saving rules."
            : "Целые timestamp разбираются через BigInt, включая отрицательные значения до 1970 года. Поддерживаемые границы: ±8 640 000 000 000 секунд или ±8 640 000 000 000 000 миллисекунд. Локальная дата использует часовой пояс и правила летнего времени браузера."}
        </p>
      </section>
    </div>
  );
}
