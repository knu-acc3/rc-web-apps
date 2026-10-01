"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import { INTL_LOCALE } from "@/i18n/config";
import { useHydrated, useNow } from "@/tools/dev/shared/hooks";
import { KIT_T } from "@/tools/dev/shared/labels";
import { Opt, OptionsRow } from "@/tools/dev/shared/Pane";
import { CopyButton } from "@/ui/copy-button";
import { Input, Select } from "@/ui/field";
import { Notice, Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { describe, fieldRows } from "./lib/describe";
import { CronError, MACROS, nextRuns, parseCron, type CronExpr, type Dialect } from "./lib/engine";
import { CronBuilder } from "./ui/CronBuilder";
import { isValidZone } from "./lib/tz";

const T = {
  ru: {
    expr: "Cron-выражение",
    dialect: "Формат",
    dialects: { auto: "Авто", unix: "Unix (5 полей)", seconds: "С секундами (6)", quartz: "Quartz" },
    tz: "Часовой пояс",
    count: "Запусков",
    next: "Ближайшие запуски",
    none: "В ближайшие 30 лет запусков нет — проверьте дату (например, 30 февраля не существует).",
    reboot: "@reboot выполняется один раз при старте системы — расписания нет.",
    gap: "время сдвинуто: переход на летнее время",
    overlap: "час повторяется: запуск один раз",
    loading: "Считаем по вашим часам…",
    fields: "Поля выражения",
    field: "Поле",
    value: "Значение",
    meaning: "Что означает",
    errors: {
      "empty-expr": "Введите выражение",
      "field-count": "Нужно 5 полей (6 с секундами, 6–7 в Quartz), а введено {d}",
      "out-of-range": "Значение «{d}» вне допустимого диапазона",
      "bad-value": "Непонятное значение «{d}»",
      syntax: "Ошибка в записи «{d}»",
      step: "Шаг после / должен быть больше нуля",
      reversed: "Начало диапазона «{d}» больше конца",
      "quartz-only": "«{d}» — расширение Quartz: выберите формат Quartz и поставьте ? в дне месяца или недели",
      "quartz-question": "В Quartz одно из полей — день месяца или день недели — должно быть ?",
      question: "Знак ? допустим только в днях месяца и недели",
      "unknown-macro": "Неизвестный макрос {d}",
      empty: "Пустое поле",
      "empty-item": "Пустой элемент списка (лишняя запятая)",
    } as Record<string, string>,
    inField: "поле",
  },
  en: {
    expr: "Cron expression",
    dialect: "Format",
    dialects: { auto: "Auto", unix: "Unix (5 fields)", seconds: "With seconds (6)", quartz: "Quartz" },
    tz: "Time zone",
    count: "Runs",
    next: "Next runs",
    none: "No runs in the next 30 years — check the date (30 February doesn't exist, for example).",
    reboot: "@reboot runs once at system startup — there is no schedule.",
    gap: "shifted: daylight saving time starts",
    overlap: "hour repeats: runs once",
    loading: "Calculating with your clock…",
    fields: "Expression fields",
    field: "Field",
    value: "Value",
    meaning: "Meaning",
    errors: {
      "empty-expr": "Enter an expression",
      "field-count": "Expected 5 fields (6 with seconds, 6–7 for Quartz), got {d}",
      "out-of-range": "Value “{d}” is out of range",
      "bad-value": "Unknown value “{d}”",
      syntax: "Syntax error in “{d}”",
      step: "The step after / must be greater than zero",
      reversed: "Range start in “{d}” is greater than its end",
      "quartz-only": "“{d}” is a Quartz extension: choose Quartz and put ? in day-of-month or day-of-week",
      "quartz-question": "In Quartz one of day-of-month or day-of-week must be ?",
      question: "? is only allowed in day-of-month and day-of-week",
      "unknown-macro": "Unknown macro {d}",
      empty: "Empty field",
      "empty-item": "Empty list item (extra comma)",
    } as Record<string, string>,
    inField: "field",
  },
} as const;

const FIELD_RU: Record<string, string> = { second: "секунды", minute: "минуты", hour: "часы", dom: "день месяца", month: "месяц", dow: "день недели", year: "год" };
const FIELD_EN: Record<string, string> = { second: "seconds", minute: "minutes", hour: "hours", dom: "day of month", month: "month", dow: "day of week", year: "year" };

export const ZONES = [
  "UTC",
  "Asia/Almaty",
  "Asia/Aqtobe",
  "Asia/Aqtau",
  "Asia/Oral",
  "Europe/Moscow",
  "Europe/Kaliningrad",
  "Europe/Samara",
  "Asia/Yekaterinburg",
  "Asia/Omsk",
  "Asia/Novosibirsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Yakutsk",
  "Asia/Vladivostok",
  "Asia/Magadan",
  "Asia/Kamchatka",
  "Europe/Minsk",
  "Europe/Kyiv",
  "Asia/Tashkent",
  "Asia/Bishkek",
  "Asia/Tbilisi",
  "Asia/Baku",
  "Asia/Yerevan",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

type DialectSel = Dialect | "auto";

export default function CronTool({ locale, expr: expr0 = "*/5 * * * *", dialect: d0 = "auto" }: { locale: Locale; expr?: string; dialect?: DialectSel }) {
  const t = T[locale];
  const id = useId();
  const [text, setText] = useState(expr0);
  const [dialect, setDialect] = useState<DialectSel>(d0);
  const [tzSel, setTzSel] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const hydrated = useHydrated();
  const now = useNow();

  const browserTz = hydrated ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
  const tz = tzSel ?? (isValidZone(browserTz) ? browserTz : "UTC");
  const zones = ZONES.includes(tz) ? ZONES : [tz, ...ZONES];

  const parsed = useMemo((): { e: CronExpr } | { err: CronError } => {
    try {
      return { e: parseCron(text, dialect) };
    } catch (err) {
      return { err: err instanceof CronError ? err : new CronError("syntax", undefined, text) };
    }
  }, [text, dialect]);

  const minute = now === null ? null : Math.floor(now / 60000) * 60000;
  const runs = useMemo(() => ("e" in parsed && minute !== null ? nextRuns(parsed.e, minute, count, tz) : null), [parsed, minute, count, tz]);

  const dateFmt = useMemo(() => new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: tz, weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "e" in parsed && parsed.e.dialect !== "unix" ? "2-digit" : undefined }), [locale, tz, parsed]);

  const errText = "err" in parsed ? `${(t.errors[parsed.err.code] ?? parsed.err.code).replace("{d}", parsed.err.detail ?? "")}${parsed.err.field ? ` (${t.inField}: ${(locale === "ru" ? FIELD_RU : FIELD_EN)[parsed.err.field]})` : ""}` : "";

  const unixParts = "e" in parsed ? (parsed.e.macro && MACROS[parsed.e.macro] ? MACROS[parsed.e.macro] : parsed.e.source) : null;

  return (
    <div className="flex flex-col gap-4">
      <Panel className="grid gap-6 p-4 sm:p-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-e`} className="text-sm font-medium text-fg-2">
              {t.expr}
            </label>
            <div className="flex gap-2">
              <Input id={`${id}-e`} size="lg" value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-2xl! tracking-wide" spellCheck={false} autoComplete="off" autoCapitalize="off" aria-invalid={"err" in parsed} />
              <CopyButton value={text} label={KIT_T[locale].copy} copiedLabel={KIT_T[locale].copied} size="icon" variant="secondary" className="size-12! shrink-0" />
            </div>
          </div>
          <p className="min-h-8 text-2xl font-bold tracking-tight text-fg sm:text-3xl" aria-live="polite">
            {"e" in parsed ? describe(parsed.e, locale) : <span className="text-base font-medium text-err">{errText}</span>}
          </p>
          <OptionsRow>
            <Opt label={t.dialect} group>
              <Segmented size="sm" label={t.dialect} value={dialect} onChange={setDialect} options={(Object.keys(t.dialects) as DialectSel[]).map((k) => ({ value: k, label: t.dialects[k] }))} />
            </Opt>
          </OptionsRow>
        </div>

        <section className="flex min-w-0 flex-col gap-3 rounded-[1rem] bg-surface-2 p-4" aria-labelledby={`${id}-next`}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 id={`${id}-next`} className="text-base font-semibold text-fg">
              {t.next}
            </h2>
            <Segmented size="sm" label={t.count} value={String(count)} onChange={(v) => setCount(Number(v))} options={[5, 10, 20, 50].map((n) => ({ value: String(n), label: String(n) }))} />
          </div>
          <OptionsRow>
            <Opt label={t.tz}>
              <Select value={tz} size="sm" onChange={(e) => setTzSel(e.target.value)}>
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </Select>
            </Opt>
          </OptionsRow>
          {"e" in parsed && parsed.e.reboot ? (
            <p className="text-sm text-fg-2">{t.reboot}</p>
          ) : runs === null ? (
            <p className="text-sm text-fg-3">{"e" in parsed ? t.loading : ""}</p>
          ) : runs.length === 0 ? (
            <Notice tone="warn">{t.none}</Notice>
          ) : (
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-x-6 gap-y-1 font-mono text-[0.875rem]">
              {runs.map((r, i) => (
                <li key={r.ms} className="flex min-w-0 gap-3">
                  <span className="w-6 shrink-0 text-right text-fg-3">{i + 1}</span>
                  <span className="min-w-0 text-fg">
                    {dateFmt.format(r.ms)}
                    {(r.gap || r.overlap) && <span className="ml-2 font-sans text-[0.75rem] text-warn">{r.gap ? t.gap : t.overlap}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </Panel>

      {"e" in parsed && (
        <div tabIndex={0} className="tbl">
          <table>
            <thead>
              <tr>
                <th scope="col">{t.field}</th>
                <th scope="col">{t.value}</th>
                <th scope="col">{t.meaning}</th>
              </tr>
            </thead>
            <tbody>
              {fieldRows(parsed.e, locale).map(([f, raw, m]) => (
                <tr key={f}>
                  <td>{f}</td>
                  <td className="font-mono">{raw}</td>
                  <td className="text-fg-2">{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unixParts && !("e" in parsed && parsed.e.reboot) && <CronBuilder locale={locale} expr={unixParts} onChange={setText} />}
    </div>
  );
}
