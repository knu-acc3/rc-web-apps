"use client";

import { useState, useSyncExternalStore } from "react";
import { Plus, Trash, Sun, Moon } from "@phosphor-icons/react";
import { ToolPrimaryAction } from "@/src/components/tool/workspace";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { HYDRATION_SAFE_NOW_MS } from "@/src/lib/hydrationTime";

type SortMode = "added" | "name" | "offset";

const POPULAR_CITIES = [
  { name: "Москва", nameEn: "Moscow", zone: "Europe/Moscow" },
  { name: "Лондон", nameEn: "London", zone: "Europe/London" },
  { name: "Нью-Йорк", nameEn: "New York", zone: "America/New_York" },
  { name: "Токио", nameEn: "Tokyo", zone: "Asia/Tokyo" },
  { name: "Дубай", nameEn: "Dubai", zone: "Asia/Dubai" },
  { name: "Алматы", nameEn: "Almaty", zone: "Asia/Almaty" },
  { name: "Париж", nameEn: "Paris", zone: "Europe/Paris" },
  { name: "Пекин", nameEn: "Beijing", zone: "Asia/Shanghai" },
];

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

let cachedTimeZones: string[] | null = null;
let clockSnapshot = Date.now();
let clockInterval: ReturnType<typeof setInterval> | null = null;
const clockListeners = new Set<() => void>();

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

function subscribeClock(listener: () => void): () => void {
  clockListeners.add(listener);

  if (!clockInterval) {
    clockInterval = setInterval(() => {
      clockSnapshot = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 1000);
  }

  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0 && clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

function getClockSnapshot(): number {
  return clockSnapshot;
}

function getServerClockSnapshot(): number {
  return HYDRATION_SAFE_NOW_MS;
}

function subscribeStatic(): () => void {
  return () => undefined;
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

function getWallParts(timeZone: string, instant: Date) {
  const values: Record<string, number> = {};
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = Number(part.value);
  }

  return values;
}

function getOffsetMinutes(timeZone: string, instant: Date): number {
  const parts = getWallParts(timeZone, instant);
  const wallAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return Math.round((wallAsUtc - instant.getTime()) / 60000);
}

function formatOffset(minutes: number): string {
  if (minutes === 0) return "UTC";
  const sign = minutes < 0 ? "−" : "+";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60);
  const remainder = absolute % 60;
  return (
    "UTC" +
    sign +
    String(hours).padStart(2, "0") +
    ":" +
    String(remainder).padStart(2, "0")
  );
}

function formatTime(
  instant: Date,
  timeZone: string,
  locale: string,
  use12Hour: boolean,
  showSeconds: boolean,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: use12Hour,
  }).format(instant);
}

function formatDate(instant: Date, timeZone: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(instant);
}

function isDaytime(instant: Date, timeZone: string): boolean {
  try {
    const parts = getWallParts(timeZone, instant);
    return parts.hour >= 6 && parts.hour < 20;
  } catch {
    return true;
  }
}

export default function WorldClock() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const localeCode = isEn ? "en-US" : "ru-RU";
  const nowMs = useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );
  const browserTimeZone = useSyncExternalStore(
    subscribeStatic,
    getBrowserTimeZone,
    getServerTimeZone,
  );
  const now = new Date(nowMs);
  const [query, setQuery] = useState("");
  const [zones, setZones] = useState<string[]>(() => [
    "Europe/London",
    "America/New_York",
    "Asia/Tokyo",
    "Asia/Dubai",
  ]);
  const [use12Hour, setUse12Hour] = useState(false);
  const [showSeconds, setShowSeconds] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("added");
  const [error, setError] = useState("");

  const suggestions = getTimeZoneSuggestions(query);
  const sortedZones = [...zones].sort((left, right) => {
    if (sortMode === "added") return 0;
    if (sortMode === "name") return left.localeCompare(right);
    return (
      getOffsetMinutes(left, now) - getOffsetMinutes(right, now) ||
      left.localeCompare(right)
    );
  });

  const addTimeZone = () => {
    const normalized = canonicalTimeZone(query);
    if (!normalized) {
      setError(
        isEn
          ? "Enter a valid IANA time zone."
          : "Введите корректный часовой пояс IANA.",
      );
      return;
    }

    if (normalized === browserTimeZone || zones.includes(normalized)) {
      setError(
        isEn
          ? "That time zone is already visible."
          : "Этот часовой пояс уже показан.",
      );
      return;
    }

    setZones((current) => [...current, normalized]);
    setQuery("");
    setError("");
  };

  return (
    <div
      data-datetime-tool="world-clock"
      className="mx-auto max-w-3xl space-y-4"
    >
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          {isEn ? "Your local time" : "Ваше местное время"}
        </p>
        <time
          dateTime={now.toISOString()}
          className="mt-2 block text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl"
        >
          {formatTime(now, browserTimeZone, localeCode, use12Hour, showSeconds)}
        </time>
        <p className="mt-2 text-sm font-medium text-[var(--color-text-muted)]">
          {formatDate(now, browserTimeZone, localeCode)}
        </p>
        <p className="mt-1 break-all text-sm text-[var(--color-text-muted)]">
          {browserTimeZone} ·{" "}
          {formatOffset(getOffsetMinutes(browserTimeZone, now))}
        </p>

        <form
          className="mt-6 border-t border-[var(--color-border-subtle)] pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            addTimeZone();
          }}
        >
          <Label htmlFor="world-clock-zone" className="text-sm font-semibold">
            {isEn ? "IANA time zone" : "Часовой пояс IANA"}
          </Label>
          <Input
            id="world-clock-zone"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setError("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="Area/Location"
            aria-invalid={Boolean(error)}
            aria-describedby="world-clock-zone-help"
            className="mt-2 h-12"
          />

          {suggestions.length > 0 ? (
            <div
              role="listbox"
              aria-label={isEn ? "Time zone matches" : "Найденные пояса"}
              className="mt-2 grid gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
            >
              {suggestions.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  role="option"
                  aria-selected={query === zone}
                  onClick={() => {
                    setQuery(zone);
                    setError("");
                  }}
                  className="min-h-11 rounded-[var(--radius-sm)] px-3 text-left text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]"
                >
                  {zone}
                </button>
              ))}
            </div>
          ) : null}

          <p
            id="world-clock-zone-help"
            role={error ? "alert" : undefined}
            className={
              "mt-2 text-sm " +
              (error
                ? "font-medium text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]")
            }
          >
            {error ||
              (isEn
                ? "Search by an IANA area and location."
                : "Ищите по области и названию IANA.")}
          </p>

          <div className="mt-3">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] block mb-1.5">
              {isEn ? "Popular cities:" : "Популярные города:"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((city) => {
                const isAdded = zones.includes(city.zone) || city.zone === browserTimeZone;
                return (
                  <button
                    key={city.zone}
                    type="button"
                    onClick={() => {
                      if (!isAdded) {
                        setZones((curr) => [...curr, city.zone]);
                        setError("");
                      }
                    }}
                    disabled={isAdded}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isAdded
                        ? "bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)] border-transparent cursor-default"
                        : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
                    }`}
                  >
                    {isAdded ? "✓" : "+"} {isEn ? city.nameEn : city.name}
                  </button>
                );
              })}
            </div>
          </div>

          <ToolPrimaryAction
            type="submit"
            className="mt-4"
            leadingIcon={<Plus size={20} weight="bold" />}
          >
            {isEn ? "Add time zone" : "Добавить часовой пояс"}
          </ToolPrimaryAction>
        </form>
      </section>

      <AdvancedSettings
        className="mt-4"
        defaultOpen={true}
        title={isEn ? "Display options" : "Параметры отображения"}
        description={isEn ? "Time format, seconds and order" : "Формат времени, секунды и порядок"}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                {isEn ? "Format:" : "Формат:"}
              </span>
              <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-muted)]">
                <button
                  type="button"
                  onClick={() => setUse12Hour(false)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors ${
                    !use12Hour
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  24ч
                </button>
                <button
                  type="button"
                  onClick={() => setUse12Hour(true)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors ${
                    use12Hour
                      ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  12ч
                </button>
              </div>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[var(--color-text-muted)]">
              <input
                type="checkbox"
                checked={showSeconds}
                onChange={(e) => setShowSeconds(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              {isEn ? "Seconds" : "Секунды"}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {isEn ? "Sort:" : "Сортировка:"}
            </span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-8 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text)]"
            >
              <option value="added">{isEn ? "By added" : "По добавлению"}</option>
              <option value="name">{isEn ? "By name" : "По названию"}</option>
              <option value="offset">{isEn ? "By UTC offset" : "По смещению"}</option>
            </select>
          </div>
        </div>
      </AdvancedSettings>

      {sortedZones.length > 0 ? (
        <section
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
        >
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            {isEn ? "Added time zones" : "Добавленные часовые пояса"}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sortedZones.map((zone) => {
              const day = isDaytime(now, zone);
              return (
                <article
                  key={zone}
                  className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {day ? (
                          <Sun size={16} className="text-amber-500 shrink-0" weight="fill" />
                        ) : (
                          <Moon size={16} className="text-indigo-400 shrink-0" weight="fill" />
                        )}
                        <h3 className="break-all text-sm font-bold text-[var(--color-text)]">
                          {zone}
                        </h3>
                      </div>
                      <time
                        dateTime={now.toISOString()}
                        className="mt-2 block text-2xl font-black tabular-nums text-[var(--color-text)]"
                      >
                        {formatTime(
                          now,
                          zone,
                          localeCode,
                          use12Hour,
                          showSeconds,
                        )}
                      </time>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setZones((current) =>
                          current.filter((item) => item !== zone),
                        )
                      }
                      aria-label={
                        isEn ? "Remove time zone" : "Удалить часовой пояс"
                      }
                      className="shrink-0 text-[var(--color-danger)]"
                    >
                      <Trash size={18} aria-hidden="true" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {formatDate(now, zone, localeCode)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[var(--color-text-muted)]">
                    {formatOffset(getOffsetMinutes(zone, now))}
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <p className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
          {isEn
            ? "Add an IANA time zone to compare it with your local time."
            : "Добавьте часовой пояс IANA для сравнения с местным временем."}
        </p>
      )}
    </div>
  );
}
