"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
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

type Workweek = "five" | "six";
type CalendarEntryKind = "holiday" | "religious" | "observed";

interface CalendarEntry {
  id: string;
  date: string;
  nameRu: string;
  nameEn: string;
  kind: CalendarEntryKind;
  noteRu?: string;
  noteEn?: string;
}

const OFFICIAL_SOURCE = "https://www.gov.kz/article/16887?lang=ru";

const HOLIDAYS_2026: CalendarEntry[] = [
  {
    id: "new-year-1",
    date: "2026-01-01",
    nameRu: "Новый год — день 1",
    nameEn: "New Year — day 1",
    kind: "holiday",
  },
  {
    id: "new-year-2",
    date: "2026-01-02",
    nameRu: "Новый год — день 2",
    nameEn: "New Year — day 2",
    kind: "holiday",
  },
  {
    id: "orthodox-christmas",
    date: "2026-01-07",
    nameRu: "Православное Рождество",
    nameEn: "Orthodox Christmas",
    kind: "religious",
  },
  {
    id: "womens-day",
    date: "2026-03-08",
    nameRu: "Международный женский день",
    nameEn: "International Women's Day",
    kind: "holiday",
  },
  {
    id: "constitution-day",
    date: "2026-03-15",
    nameRu: "День Конституции Республики Казахстан",
    nameEn: "Constitution Day of the Republic of Kazakhstan",
    kind: "holiday",
  },
  {
    id: "nauryz-1",
    date: "2026-03-21",
    nameRu: "Наурыз мейрамы — день 1",
    nameEn: "Nauryz Meyramy — day 1",
    kind: "holiday",
  },
  {
    id: "nauryz-2",
    date: "2026-03-22",
    nameRu: "Наурыз мейрамы — день 2",
    nameEn: "Nauryz Meyramy — day 2",
    kind: "holiday",
  },
  {
    id: "nauryz-3",
    date: "2026-03-23",
    nameRu: "Наурыз мейрамы — день 3",
    nameEn: "Nauryz Meyramy — day 3",
    kind: "holiday",
  },
  {
    id: "unity-day",
    date: "2026-05-01",
    nameRu: "Праздник единства народа Казахстана",
    nameEn: "Unity Day of the People of Kazakhstan",
    kind: "holiday",
  },
  {
    id: "defender-day",
    date: "2026-05-07",
    nameRu: "День защитника Отечества",
    nameEn: "Defender of the Fatherland Day",
    kind: "holiday",
  },
  {
    id: "victory-day",
    date: "2026-05-09",
    nameRu: "День Победы",
    nameEn: "Victory Day",
    kind: "holiday",
  },
  {
    id: "kurban-ait",
    date: "2026-05-27",
    nameRu: "Первый день Курбан-айта",
    nameEn: "First day of Kurban Ait",
    kind: "religious",
  },
  {
    id: "capital-day",
    date: "2026-07-06",
    nameRu: "День Столицы",
    nameEn: "Capital Day",
    kind: "holiday",
  },
  {
    id: "republic-day",
    date: "2026-10-25",
    nameRu: "День Республики",
    nameEn: "Republic Day",
    kind: "holiday",
  },
  {
    id: "independence-day",
    date: "2026-12-16",
    nameRu: "День Независимости",
    nameEn: "Independence Day",
    kind: "holiday",
  },
];

const FIVE_DAY_TRANSFERS: CalendarEntry[] = [
  {
    id: "five-womens-day",
    date: "2026-03-09",
    nameRu: "Перенесённый выходной за 8 марта",
    nameEn: "Observed day off for 8 March",
    kind: "observed",
    noteRu: "Опубликованный перенос: 8 марта → 9 марта.",
    noteEn: "Published transfer: 8 March → 9 March.",
  },
  {
    id: "five-nauryz-21",
    date: "2026-03-24",
    nameRu: "Перенесённый выходной за 21 марта",
    nameEn: "Observed day off for 21 March",
    kind: "observed",
    noteRu: "Опубликованный перенос: 21 марта → 24 марта.",
    noteEn: "Published transfer: 21 March → 24 March.",
  },
  {
    id: "five-nauryz-22",
    date: "2026-03-25",
    nameRu: "Перенесённый выходной за 22 марта",
    nameEn: "Observed day off for 22 March",
    kind: "observed",
    noteRu: "Опубликованный перенос: 22 марта → 25 марта.",
    noteEn: "Published transfer: 22 March → 25 March.",
  },
  {
    id: "five-victory-day",
    date: "2026-05-11",
    nameRu: "Перенесённый выходной за 9 мая",
    nameEn: "Observed day off for 9 May",
    kind: "observed",
    noteRu: "Опубликованный перенос: 9 мая → 11 мая.",
    noteEn: "Published transfer: 9 May → 11 May.",
  },
  {
    id: "five-republic-day",
    date: "2026-10-26",
    nameRu: "Перенесённый выходной за 25 октября",
    nameEn: "Observed day off for 25 October",
    kind: "observed",
    noteRu: "Опубликованный перенос: 25 октября → 26 октября.",
    noteEn: "Published transfer: 25 October → 26 October.",
  },
];

const SIX_DAY_TRANSFERS: CalendarEntry[] = [
  {
    id: "six-womens-day",
    date: "2026-03-09",
    nameRu: "Перенесённый выходной за 8 марта",
    nameEn: "Observed day off for 8 March",
    kind: "observed",
    noteRu: "Опубликованный перенос: 8 марта → 9 марта.",
    noteEn: "Published transfer: 8 March → 9 March.",
  },
  {
    id: "six-nauryz-22",
    date: "2026-03-24",
    nameRu: "Перенесённый выходной за 22 марта",
    nameEn: "Observed day off for 22 March",
    kind: "observed",
    noteRu: "Опубликованный перенос: 22 марта → 24 марта.",
    noteEn: "Published transfer: 22 March → 24 March.",
  },
  {
    id: "six-republic-day",
    date: "2026-10-26",
    nameRu: "Перенесённый выходной за 25 октября",
    nameEn: "Observed day off for 25 October",
    kind: "observed",
    noteRu: "Опубликованный перенос: 25 октября → 26 октября.",
    noteEn: "Published transfer: 25 October → 26 October.",
  },
];

function toUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: string, isEn: boolean): string {
  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(toUtcDate(date));
}

function getKindLabel(kind: CalendarEntryKind, isEn: boolean): string {
  if (kind === "observed")
    return isEn ? "Published day off" : "Опубликованный перенос";
  if (kind === "religious")
    return isEn ? "Religious non-working day" : "Религиозный выходной";
  return isEn ? "Public holiday" : "Праздничный день";
}

export default function KzHolidays() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [query, setQuery] = useState("");
  const [workweek, setWorkweek] = useState<Workweek>("five");
  const [showObserved, setShowObserved] = useState(true);

  const rows = useMemo(() => {
    const transfers =
      workweek === "five" ? FIVE_DAY_TRANSFERS : SIX_DAY_TRANSFERS;
    return [...HOLIDAYS_2026, ...(showObserved ? transfers : [])].sort(
      (first, second) => first.date.localeCompare(second.date),
    );
  }, [showObserved, workweek]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return rows;
    return rows.filter((row) => {
      const searchable = [
        row.date,
        row.nameRu,
        row.nameEn,
        row.noteRu ?? "",
        row.noteEn ?? "",
        formatDate(row.date, false),
        formatDate(row.date, true),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [query, rows]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold">
            {isEn
              ? "Official Kazakhstan calendar · 2026 snapshot"
              : "Официальный календарь Казахстана · снимок 2026"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "Public holidays, religious non-working days and published transfers for 2026 only."
              : "Праздничные, религиозные выходные и опубликованные переносы только на 2026 год."}
          </p>
        </div>

        <Label htmlFor="kz-holidays-search">
          {isEn ? "Search calendar" : "Поиск по календарю"}
        </Label>
        <div className="relative mt-1.5">
          <MagnifyingGlass
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            id="kz-holidays-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isEn ? "Name or date" : "Название или дата"}
            autoComplete="off"
            aria-controls="kz-holidays-results"
            className="h-12 pl-10"
          />
        </div>
        <p
          className="mt-2 text-xs text-[var(--color-text-muted)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {isEn
            ? `${filteredRows.length} calendar entries`
            : `Записей в календаре: ${filteredRows.length}`}
        </p>
      </Card>

      <AdvancedSettings
        title={
          isEn ? "Workweek and observed days" : "Рабочая неделя и переносы"
        }
        description={
          isEn
            ? "Choose the published five-day or six-day schedule"
            : "Выберите опубликованный график пятидневки или шестидневки"
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="kz-holidays-workweek">
              {isEn ? "Workweek" : "Рабочая неделя"}
            </Label>
            <Select
              value={workweek}
              onValueChange={(value) => setWorkweek(value as Workweek)}
            >
              <SelectTrigger id="kz-holidays-workweek" className="mt-1.5 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="five">
                  {isEn ? "Five-day week" : "Пятидневная"}
                </SelectItem>
                <SelectItem value="six">
                  {isEn ? "Six-day week" : "Шестидневная"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 self-end rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showObserved}
              onChange={(event) => setShowObserved(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            {isEn ? "Show published transfers" : "Показывать переносы"}
          </label>
        </div>
      </AdvancedSettings>

      <div
        id="kz-holidays-results"
        aria-live="polite"
        aria-label={isEn ? "Calendar results" : "Результаты календаря"}
      >
        {filteredRows.length > 0 ? (
          <Card className="overflow-hidden p-0">
            {filteredRows.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  "grid gap-2 p-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-4 sm:p-4",
                  index > 0 && "border-t border-[var(--color-border)]",
                  row.kind === "observed" && "bg-[var(--color-surface-muted)]",
                )}
              >
                <div className="min-w-0">
                  <time
                    dateTime={row.date}
                    className="font-mono text-sm font-bold"
                  >
                    {row.date}
                  </time>
                  <p className="mt-0.5 text-xs capitalize text-[var(--color-text-muted)]">
                    {formatDate(row.date, isEn)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {isEn ? row.nameEn : row.nameRu}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {getKindLabel(row.kind, isEn)}
                  </p>
                  {row.noteRu || row.noteEn ? (
                    <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-subtle)]">
                      {isEn ? row.noteEn : row.noteRu}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-5 text-center text-sm text-[var(--color-text-muted)]">
            {isEn ? "No matching calendar entries." : "Совпадений не найдено."}
          </Card>
        )}
      </div>

      <Card className="p-4 text-xs leading-relaxed text-[var(--color-text-muted)] sm:p-5">
        <p>
          <span className="font-semibold text-[var(--color-text)]">
            {isEn ? "Official source:" : "Официальный источник:"}
          </span>{" "}
          <a
            href={OFFICIAL_SOURCE}
            target="_blank"
            rel="noreferrer noopener"
            className="font-semibold text-[var(--color-primary)] underline underline-offset-2"
          >
            {isEn
              ? "Production calendar for 2026 on gov.kz"
              : "Производственный календарь на 2026 год на gov.kz"}
          </a>
        </p>
        <p className="mt-1">
          {isEn
            ? "Source checked: 11 July 2026."
            : "Источник проверен: 11 июля 2026 года."}
        </p>
        <p className="mt-2">
          {isEn
            ? "Reference snapshot, not legal advice. Check the official source before employment or payroll decisions."
            : "Справочный снимок, не юридическая консультация. Перед кадровыми или расчётными решениями проверьте официальный источник."}
        </p>
      </Card>
    </div>
  );
}
