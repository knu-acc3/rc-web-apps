import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { daysInMonth, isoWeek, isoWeekday, monthName, WEEKDAYS, type Ymd } from "../lib/dates";

export interface DayMark {
  /** Tailwind classes for the cell. */
  cls?: string;
  /** Tooltip / accessible description (holiday name, "shortened day"). */
  title?: string;
}

/** One month as a Monday-first table. Pure and server-safe. */
export function MonthGrid({
  locale,
  year,
  month,
  mark,
  today,
  weekNumbers = false,
  size = "sm",
  showTitle = true,
  className,
}: {
  locale: Locale;
  year: number;
  month: number;
  mark?: (d: Ymd) => DayMark | undefined;
  today?: Ymd | null;
  weekNumbers?: boolean;
  size?: "sm" | "lg";
  showTitle?: boolean;
  className?: string;
}) {
  const first = isoWeekday(year, month, 1);
  const n = daysInMonth(year, month);
  const cells: (number | null)[] = [...Array(first - 1).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const heads = locale === "ru" ? WEEKDAYS.ruShort : WEEKDAYS.enShort;
  const lg = size === "lg";

  return (
    <table className={cn("w-full self-start border-separate border-spacing-0.5 text-center", lg ? "text-base" : "text-[0.8125rem]", className)}>
      {showTitle && <caption className={cn("pb-1.5 text-left font-semibold text-fg", lg ? "text-lg" : "text-sm")}>{monthName(locale, month)}</caption>}
      <thead>
        <tr>
          {weekNumbers && (
            <th scope="col" className="w-7 font-normal text-fg-3" title={locale === "ru" ? "Номер недели" : "Week number"}>
              {locale === "ru" ? "Н" : "W"}
            </th>
          )}
          {heads.map((h, i) => (
            <th key={h} scope="col" className={cn("font-medium", i >= 5 ? "text-err" : "text-fg-3", lg ? "py-1.5" : "py-0.5")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((w, wi) => {
          const firstDay = w.find((d) => d !== null)!;
          return (
            <tr key={wi}>
              {weekNumbers && <td className="text-[0.6875rem] text-fg-3">{isoWeek({ y: year, m: month, d: firstDay }).week}</td>}
              {w.map((d, i) => {
                if (d === null) return <td key={i} />;
                const ymd = { y: year, m: month, d };
                const m = mark?.(ymd);
                const isToday = !!today && today.y === year && today.m === month && today.d === d;
                return (
                  <td
                    key={i}
                    title={m?.title}
                    className={cn(
                      "tabular",
                      lg ? "h-12 rounded-[0.75rem] sm:h-14 2xl:h-20 2xl:text-xl" : "h-7 rounded-[0.375rem]",
                      m?.cls ?? (i >= 5 ? "text-err" : "text-fg"),
                      isToday && "font-bold ring-2 ring-accent ring-inset",
                    )}
                  >
                    {d}
                    {m?.title && <span className="sr-only">, {m.title}</span>}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
