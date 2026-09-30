"use client";

import { useMemo, useState, useSyncExternalStore, type FocusEvent } from "react";
import { ArrowsLeftRight, Check, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

type Disambiguation = "reject" | "earlier" | "later";

type WallParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type ConversionResult = {
  instantMs: number;
  fromZone: string;
  toZone: string;
  fromOffset: number;
  toOffset: number;
  ambiguous: boolean;
  chosen: Exclude<Disambiguation, "reject"> | null;
};

type TimeZoneFieldProps = {
  id: string;
  label: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

const FALLBACK_TIME_ZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Almaty",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Moscow",
  "Europe/Paris",
  "Pacific/Auckland",
];

const TIMEZONE_PRESETS = [
  { labelRu: "Лондон ↔ Нью-Йорк", labelEn: "London ↔ New York", from: "Europe/London", to: "America/New_York" },
  { labelRu: "Москва ↔ Токио", labelEn: "Moscow ↔ Tokyo", from: "Europe/Moscow", to: "Asia/Tokyo" },
  { labelRu: "UTC ↔ Алматы", labelEn: "UTC ↔ Almaty", from: "UTC", to: "Asia/Almaty" },
  { labelRu: "Париж ↔ Нью-Йорк", labelEn: "Paris ↔ New York", from: "Europe/Paris", to: "America/New_York" },
  { labelRu: "Дубай ↔ Сингапур", labelEn: "Dubai ↔ Singapore", from: "Asia/Dubai", to: "Asia/Singapore" },
];

let cachedTimeZones: string[] | null = null;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatLocalInput(date: Date): string {
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

const CLIENT_DEFAULT_DATETIME = formatLocalInput(new Date());
const SERVER_DEFAULT_DATETIME = "2026-06-18T12:00";

function subscribeStatic(): () => void {
  return () => undefined;
}

function getClientDefaultDateTime(): string {
  return CLIENT_DEFAULT_DATETIME;
}

function getServerDefaultDateTime(): string {
  return SERVER_DEFAULT_DATETIME;
}

function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function getServerTimeZone(): string {
  return "UTC";
}

function getTimeZones(): string[] {
  if (cachedTimeZones) return cachedTimeZones;

  try {
    const supported =
      typeof Intl.supportedValuesOf === "function"
        ? Intl.supportedValuesOf("timeZone")
        : [];
    cachedTimeZones = Array.from(new Set(["UTC", ...supported]));
  } catch {
    cachedTimeZones = FALLBACK_TIME_ZONES;
  }

  return cachedTimeZones;
}

function getTimeZoneSuggestions(query: string): string[] {
  const needle = query.trim().toLowerCase().replaceAll(" ", "_");
  if (!needle) return [];

  return getTimeZones()
    .filter((zone) => zone.toLowerCase().includes(needle))
    .sort((left, right) => {
      const leftStarts = left.toLowerCase().startsWith(needle);
      const rightStarts = right.toLowerCase().startsWith(needle);
      if (leftStarts !== rightStarts) return leftStarts ? -1 : 1;
      return left.localeCompare(right);
    })
    .slice(0, 6);
}

function canonicalTimeZone(value: string): string | null {
  const candidate = value.trim();
  if (!candidate) return null;

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: candidate,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}

function parseLocalDateTime(value: string): WallParts | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const parts: WallParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const verification = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );

  if (
    verification.getUTCFullYear() !== parts.year ||
    verification.getUTCMonth() + 1 !== parts.month ||
    verification.getUTCDate() !== parts.day ||
    verification.getUTCHours() !== parts.hour ||
    verification.getUTCMinutes() !== parts.minute
  ) {
    return null;
  }

  return parts;
}

function getWallParts(timeZone: string, instantMs: number): WallParts {
  const values: Record<string, number> = {};
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instantMs));

  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
  };
}

function wallPartsEqual(left: WallParts, right: WallParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function getOffsetMinutes(timeZone: string, instantMs: number): number {
  const parts = getWallParts(timeZone, instantMs);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return Math.round((wallAsUtc - instantMs) / 60000);
}

function findWallTimeCandidates(wall: WallParts, timeZone: string): number[] {
  const naiveUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
  );
  const offsets = new Set<number>();

  for (let deltaHours = -48; deltaHours <= 48; deltaHours += 6) {
    offsets.add(
      getOffsetMinutes(timeZone, naiveUtc + deltaHours * 60 * 60 * 1000),
    );
  }

  const candidates = new Set<number>();
  for (const offset of offsets) {
    const instantMs = naiveUtc - offset * 60 * 1000;
    if (wallPartsEqual(getWallParts(timeZone, instantMs), wall)) {
      candidates.add(instantMs);
    }
  }

  return [...candidates].sort((left, right) => left - right);
}

function formatOffset(minutes: number): string {
  if (minutes === 0) return "UTC";
  const sign = minutes < 0 ? "−" : "+";
  const absolute = Math.abs(minutes);
  return (
    "UTC" + sign + pad(Math.floor(absolute / 60)) + ":" + pad(absolute % 60)
  );
}

function formatMachineWall(parts: WallParts): string {
  return (
    parts.year +
    "-" +
    pad(parts.month) +
    "-" +
    pad(parts.day) +
    " " +
    pad(parts.hour) +
    ":" +
    pad(parts.minute)
  );
}

function formatWallDate(
  instantMs: number,
  timeZone: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(instantMs));
}


function TimeZoneField({
  id,
  label,
  value,
  invalid,
  onChange,
}: TimeZoneFieldProps) {
  const [open, setOpen] = useState(false);
  const suggestions = open ? getTimeZoneSuggestions(value) : [];

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (
      !(nextTarget instanceof Node) ||
      !event.currentTarget.contains(nextTarget)
    ) {
      setOpen(false);
    }
  };

  return (
    <div className="min-w-0" onBlur={handleBlur}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={id + "-matches"}
        aria-autocomplete="list"
        aria-invalid={invalid}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        autoComplete="off"
        spellCheck={false}
        placeholder="Area/Location"
        className="mt-2 h-12"
      />
      {suggestions.length > 0 ? (
        <div
          id={id + "-matches"}
          role="listbox"
          className="mt-1 max-h-60 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
        >
          {suggestions.map((zone) => (
            <button
              key={zone}
              type="button"
              role="option"
              aria-selected={zone === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(zone);
                setOpen(false);
              }}
              className="min-h-11 w-full rounded-[var(--radius-sm)] px-3 text-left text-sm font-medium hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
            >
              {zone}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function TimezoneConverter() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const localeCode = isEn ? "en-GB" : "ru-RU";
  const defaultDateTime = useSyncExternalStore(
    subscribeStatic,
    getClientDefaultDateTime,
    getServerDefaultDateTime,
  );
  const browserTimeZone = useSyncExternalStore(
    subscribeStatic,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  const [dateTimeOverride, setDateTimeOverride] = useState<string | null>(null);
  const [fromZoneOverride, setFromZoneOverride] = useState<string | null>(null);
  const [toZone, setToZone] = useState("UTC");
  const [disambiguation, setDisambiguation] =
    useState<Disambiguation>("reject");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const localDateTime = dateTimeOverride ?? defaultDateTime;
  const fromZone = fromZoneOverride ?? browserTimeZone;

  const liveConversion = useMemo(() => {
    const wall = parseLocalDateTime(localDateTime);
    if (!wall) {
      return {
        error: isEn
          ? "Choose a valid local date and time."
          : "Выберите корректные местные дату и время.",
        result: null,
      };
    }

    const normalizedFrom = canonicalTimeZone(fromZone);
    const normalizedTo = canonicalTimeZone(toZone);
    if (!normalizedFrom || !normalizedTo) {
      return {
        error: isEn
          ? "Enter valid IANA time zones for both fields."
          : "Введите корректные часовые пояса IANA в обоих полях.",
        result: null,
      };
    }

    const candidates = findWallTimeCandidates(wall, normalizedFrom);
    if (candidates.length === 0) {
      return {
        error: isEn
          ? "This local time does not exist in the source zone because the clock moves forward for daylight saving time."
          : "Этого местного времени нет в исходном поясе: часы переводятся вперёд при переходе на летнее время.",
        result: null,
      };
    }

    if (candidates.length > 1 && disambiguation === "reject") {
      const offsets = candidates
        .map((instant) =>
          formatOffset(getOffsetMinutes(normalizedFrom, instant)),
        )
        .join(" / ");
      return {
        error: isEn
          ? "This local time occurs twice (" +
            offsets +
            "). Choose earlier or later in Advanced settings."
          : "Это местное время встречается дважды (" +
            offsets +
            "). Выберите ранний или поздний вариант в расширенных настройках.",
        result: null,
      };
    }

    const useLater = candidates.length > 1 && disambiguation === "later";
    const instantMs = useLater
      ? candidates[candidates.length - 1]
      : candidates[0];

    return {
      error: "",
      result: {
        instantMs,
        fromZone: normalizedFrom,
        toZone: normalizedTo,
        fromOffset: getOffsetMinutes(normalizedFrom, instantMs),
        toOffset: getOffsetMinutes(normalizedTo, instantMs),
        ambiguous: candidates.length > 1,
        chosen:
          candidates.length > 1 && disambiguation !== "reject"
            ? disambiguation
            : null,
      },
    };
  }, [disambiguation, fromZone, isEn, localDateTime, toZone]);

  const visibleResult = liveConversion.result;
  const activeError = error || liveConversion.error;

  const targetParts = visibleResult
    ? getWallParts(visibleResult.toZone, visibleResult.instantMs)
    : null;
  const sourceParts = visibleResult
    ? getWallParts(visibleResult.fromZone, visibleResult.instantMs)
    : null;

  const swapZones = () => {
    const prevFrom = fromZone;
    const prevTo = toZone;
    setFromZoneOverride(prevTo);
    setToZone(prevFrom);
    setError("");
  };

  const convert = async () => {
    if (activeError || !targetParts || !visibleResult) return;
    const timeStr = `${pad(targetParts.hour)}:${pad(targetParts.minute)} (${visibleResult.toZone})`;
    try {
      await navigator.clipboard.writeText(timeStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      data-datetime-tool="timezone-converter"
      className="mx-auto max-w-3xl space-y-4"
    >
      {/* 1-Click Quick Preset Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]">
          <Sparkle size={14} className="text-[var(--color-primary)]" />
          {isEn ? "Popular pairs:" : "Популярные пары:"}
        </span>
        {TIMEZONE_PRESETS.map((p) => {
          const isActive = fromZone === p.from && toZone === p.to;
          return (
            <button
              key={`${p.from}-${p.to}`}
              type="button"
              onClick={() => {
                setFromZoneOverride(p.from);
                setToZone(p.to);
                setError("");
              }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]",
              )}
            >
              {isEn ? p.labelEn : p.labelRu}
            </button>
          );
        })}
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-2xl">
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn ? "Convert a local time" : "Переведите местное время"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "IANA time zones and daylight-saving rules are applied for the selected date."
              : "Для выбранной даты применяются часовые пояса IANA и правила летнего времени."}
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void convert();
          }}
        >
          <Label
            htmlFor="timezone-local-datetime"
            className="text-sm font-semibold"
          >
            {isEn ? "Local date and time" : "Местные дата и время"}
          </Label>
          <Input
            id="timezone-local-datetime"
            type="datetime-local"
            value={localDateTime}
            onChange={(event) => {
              setDateTimeOverride(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(activeError)}
            className="mt-2 h-12"
          />

          <div className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <TimeZoneField
              id="timezone-from"
              label={isEn ? "From time zone" : "Исходный пояс"}
              value={fromZone}
              invalid={Boolean(activeError)}
              onChange={(value) => {
                setFromZoneOverride(value);
                setError("");
              }}
            />

            <div className="flex justify-center pb-0.5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swapZones}
                aria-label={isEn ? "Swap time zones" : "Поменять пояса местами"}
                className="h-11 w-11 rounded-full border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
              >
                <ArrowsLeftRight size={18} className="text-[var(--color-primary)]" />
              </Button>
            </div>

            <TimeZoneField
              id="timezone-to"
              label={isEn ? "To time zone" : "Целевой пояс"}
              value={toZone}
              invalid={Boolean(activeError)}
              onChange={(value) => {
                setToZone(value);
                setError("");
              }}
            />
          </div>

          {activeError ? (
            <p
              role="alert"
              className="mt-4 text-sm font-medium leading-relaxed text-[var(--color-danger)]"
            >
              {activeError}
            </p>
          ) : null}

          <ToolPrimaryAction
            type="submit"
            fullWidthOnMobile={false}
            className="mt-4 h-11 w-auto min-w-[180px] px-6 shadow-sm"
            leadingIcon={copied ? <Check size={20} /> : <ArrowsLeftRight size={20} weight="bold" />}
          >
            {copied
              ? (isEn ? "Copied!" : "Скопировано!")
              : (isEn ? "Convert time" : "Перевести время")}
          </ToolPrimaryAction>
        </form>
      </section>

      {visibleResult && targetParts && sourceParts ? (
        <section
          aria-live="polite"
          data-timezone-result=""
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
            <CheckCircle size={18} weight="fill" aria-hidden="true" />
            {isEn ? "Converted time" : "Переведённое время"}
          </div>
          <p
            data-converted-local={formatMachineWall(targetParts)}
            className="mt-3 text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl"
          >
            {pad(targetParts.hour)}:{pad(targetParts.minute)}
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
            {formatWallDate(
              visibleResult.instantMs,
              visibleResult.toZone,
              localeCode,
            )}
          </p>
          <p className="mt-1 break-all text-sm text-[var(--color-text-muted)]">
            {visibleResult.toZone} · {formatOffset(visibleResult.toOffset)}
          </p>

          <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 text-sm">
            <p className="font-semibold text-[var(--color-text)]">
              {formatMachineWall(sourceParts)}
            </p>
            <p className="mt-1 break-all text-[var(--color-text-muted)]">
              {visibleResult.fromZone} ·{" "}
              {formatOffset(visibleResult.fromOffset)}
            </p>
          </div>

          {visibleResult.ambiguous && visibleResult.chosen ? (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? visibleResult.chosen === "earlier"
                  ? "The earlier occurrence of the repeated local time was used."
                  : "The later occurrence of the repeated local time was used."
                : visibleResult.chosen === "earlier"
                  ? "Использован ранний вариант повторяющегося местного времени."
                  : "Использован поздний вариант повторяющегося местного времени."}
            </p>
          ) : null}
        </section>
      ) : null}

      <AdvancedSettings
        title={isEn ? "DST ambiguity" : "Неоднозначность DST"}
        description={
          isEn
            ? "How to handle a local time that occurs twice"
            : "Как обрабатывать местное время, которое встречается дважды"
        }
      >
        <Label
          htmlFor="timezone-disambiguation"
          className="text-sm font-semibold"
        >
          {isEn ? "Repeated local time" : "Повторяющееся местное время"}
        </Label>
        <select
          id="timezone-disambiguation"
          value={disambiguation}
          onChange={(event) => {
            setDisambiguation(event.target.value as Disambiguation);
            setError("");
          }}
          className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] sm:text-sm"
        >
          <option value="reject">
            {isEn ? "Ask me to choose" : "Попросить выбрать"}
          </option>
          <option value="earlier">
            {isEn ? "Use earlier occurrence" : "Использовать ранний вариант"}
          </option>
          <option value="later">
            {isEn ? "Use later occurrence" : "Использовать поздний вариант"}
          </option>
        </select>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "A clock-back transition can create two instants with the same local time. A clock-forward gap has no valid instant and is always rejected."
            : "При переводе часов назад одно местное время может соответствовать двум моментам. В пропущенном интервале при переводе вперёд корректного момента нет — он всегда отклоняется."}
        </p>
      </AdvancedSettings>
    </div>
  );
}
