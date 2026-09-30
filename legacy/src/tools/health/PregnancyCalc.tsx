"use client";

import { useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

const MS_PER_DAY = 86_400_000;

export const PREGNANCY_ESTIMATE_LIMITS = {
  standardPregnancyDays: 280,
  standardCycleDays: 28,
  minimumCycleDays: 21,
  maximumCycleDays: 35,
  maximumCurrentTermDays: 300,
} as const;

const ACOG_SOURCES = [
  {
    href: "https://www.acog.org/womens-health/faqs/when-pregnancy-goes-past-your-due-date",
    ru: "ACOG: как определяется предполагаемая дата родов",
    en: "ACOG: how the estimated due date is determined",
  },
  {
    href: "https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2017/05/methods-for-estimating-the-due-date",
    ru: "ACOG: методы определения предполагаемой даты родов",
    en: "ACOG: methods for estimating the due date",
  },
] as const;

interface DateOnly {
  year: number;
  month: number;
  day: number;
  epochDay: number;
}

export interface PregnancyEstimate {
  lmpDate: string;
  todayDate: string;
  baseEstimatedDueDate: string;
  estimatedDueDate: string;
  gestationalDays: number;
  gestationalWeeks: number;
  remainingGestationalDays: number;
  trimester: 1 | 2 | 3;
  cycleLengthDays: number;
  cycleAdjustmentDays: number;
}

function parseDateOnly(value: string): DateOnly | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    epochDay: Math.trunc(timestamp / MS_PER_DAY),
  };
}

function epochDayToIso(epochDay: number): string {
  const date = new Date(epochDay * MS_PER_DAY);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftDateOnly(value: string, days: number): string | null {
  const parsed = parseDateOnly(value);
  return parsed ? epochDayToIso(parsed.epochDay + days) : null;
}

export function getLocalTodayDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function estimatePregnancy(
  lmpValue: string,
  todayValue: string,
  cycleLengthDays: number = PREGNANCY_ESTIMATE_LIMITS.standardCycleDays,
): PregnancyEstimate | null {
  const lmp = parseDateOnly(lmpValue);
  const today = parseDateOnly(todayValue);
  if (!lmp || !today) return null;
  if (
    !Number.isInteger(cycleLengthDays) ||
    cycleLengthDays < PREGNANCY_ESTIMATE_LIMITS.minimumCycleDays ||
    cycleLengthDays > PREGNANCY_ESTIMATE_LIMITS.maximumCycleDays
  ) {
    return null;
  }

  const gestationalDays = today.epochDay - lmp.epochDay;
  if (
    gestationalDays < 0 ||
    gestationalDays > PREGNANCY_ESTIMATE_LIMITS.maximumCurrentTermDays
  ) {
    return null;
  }

  const cycleAdjustmentDays =
    cycleLengthDays - PREGNANCY_ESTIMATE_LIMITS.standardCycleDays;
  const baseEstimatedDueEpochDay =
    lmp.epochDay + PREGNANCY_ESTIMATE_LIMITS.standardPregnancyDays;
  const estimatedDueEpochDay = baseEstimatedDueEpochDay + cycleAdjustmentDays;
  const gestationalWeeks = Math.floor(gestationalDays / 7);
  const remainingGestationalDays = gestationalDays % 7;
  const trimester: 1 | 2 | 3 =
    gestationalDays < 14 * 7 ? 1 : gestationalDays < 28 * 7 ? 2 : 3;

  return {
    lmpDate: lmpValue,
    todayDate: todayValue,
    baseEstimatedDueDate: epochDayToIso(baseEstimatedDueEpochDay),
    estimatedDueDate: epochDayToIso(estimatedDueEpochDay),
    gestationalDays,
    gestationalWeeks,
    remainingGestationalDays,
    trimester,
    cycleLengthDays,
    cycleAdjustmentDays,
  };
}

function formatDate(value: string, isEn: boolean): string {
  const parsed = parseDateOnly(value);
  if (!parsed) return value;

  return new Intl.DateTimeFormat(isEn ? "en-US" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed.epochDay * MS_PER_DAY));
}

function trimesterLabel(trimester: 1 | 2 | 3, isEn: boolean): string {
  if (isEn) {
    return ["First trimester", "Second trimester", "Third trimester"][
      trimester - 1
    ];
  }

  return ["Первый триместр", "Второй триместр", "Третий триместр"][
    trimester - 1
  ];
}

export default function PregnancyCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const todayValue = getLocalTodayDate();
  const minimumLmpValue =
    shiftDateOnly(
      todayValue,
      -PREGNANCY_ESTIMATE_LIMITS.maximumCurrentTermDays,
    ) ?? todayValue;

  const [lmpValue, setLmpValue] = useState("");
  const [cycleLength, setCycleLength] = useState(
    String(PREGNANCY_ESTIMATE_LIMITS.standardCycleDays),
  );
  const [result, setResult] = useState<PregnancyEstimate | null>(null);
  const [error, setError] = useState("");

  const invalidate = () => {
    setResult(null);
    setError("");
  };

  const calculate = () => {
    const lmp = parseDateOnly(lmpValue);
    const today = parseDateOnly(getLocalTodayDate());
    const parsedCycleLength = Number(cycleLength);

    if (!lmp || !today) {
      setResult(null);
      setError(
        isEn
          ? "Enter the first day of the last menstrual period."
          : "Укажите первый день последней менструации.",
      );
      return;
    }
    if (lmp.epochDay > today.epochDay) {
      setResult(null);
      setError(
        isEn
          ? "The last menstrual period date cannot be in the future."
          : "Дата последней менструации не может быть в будущем.",
      );
      return;
    }
    if (
      today.epochDay - lmp.epochDay >
      PREGNANCY_ESTIMATE_LIMITS.maximumCurrentTermDays
    ) {
      setResult(null);
      setError(
        isEn
          ? "For a current term, choose a date no more than 300 days ago."
          : "Для текущего срока выберите дату не более 300 дней назад.",
      );
      return;
    }
    if (
      !Number.isInteger(parsedCycleLength) ||
      parsedCycleLength < PREGNANCY_ESTIMATE_LIMITS.minimumCycleDays ||
      parsedCycleLength > PREGNANCY_ESTIMATE_LIMITS.maximumCycleDays
    ) {
      setResult(null);
      setError(
        isEn
          ? "Enter a whole cycle length from 21 to 35 days in Advanced settings."
          : "В расширенных настройках укажите целую длину цикла от 21 до 35 дней.",
      );
      return;
    }

    const nextResult = estimatePregnancy(
      lmpValue,
      getLocalTodayDate(),
      parsedCycleLength,
    );
    if (!nextResult) {
      setResult(null);
      setError(
        isEn
          ? "Check the entered date and cycle length."
          : "Проверьте дату и длину цикла.",
      );
      return;
    }

    setResult(nextResult);
    setError("");
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-sm">
          <Label htmlFor="pregnancy-lmp-date">
            {isEn
              ? "First day of the last menstrual period"
              : "Первый день последней менструации"}
          </Label>
          <Input
            id="pregnancy-lmp-date"
            type="date"
            min={minimumLmpValue}
            max={todayValue}
            value={lmpValue}
            onChange={(event) => {
              setLmpValue(event.target.value);
              invalidate();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") calculate();
            }}
            aria-describedby="pregnancy-lmp-hint"
            className="mt-1.5 h-12"
          />
          <p
            id="pregnancy-lmp-hint"
            className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]"
          >
            {isEn
              ? "Use the date the bleeding started, not the date it ended."
              : "Укажите дату начала, а не окончания менструации."}
          </p>
        </div>

        <ToolPrimaryAction type="button" className="mt-4" onClick={calculate}>
          {isEn ? "Estimate due date" : "Рассчитать предполагаемую дату"}
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
            title={isEn ? "Estimated due date" : "Предполагаемая дата родов"}
            className="mt-5"
          >
            <p
              data-pregnancy-edd=""
              className="text-3xl font-black leading-tight tracking-tight text-[var(--color-text)] sm:text-4xl"
            >
              {formatDate(result.estimatedDueDate, isEn)}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  {isEn
                    ? `Gestational age on ${formatDate(result.todayDate, true)}`
                    : `Срок на ${formatDate(result.todayDate, false)}`}
                </p>
                <p
                  data-pregnancy-gestational-age=""
                  className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text)]"
                >
                  {isEn
                    ? `${result.gestationalWeeks} wk ${result.remainingGestationalDays} d`
                    : `${result.gestationalWeeks} нед. ${result.remainingGestationalDays} дн.`}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3">
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  {isEn ? "Trimester" : "Триместр"}
                </p>
                <p
                  data-pregnancy-trimester=""
                  className="mt-1 text-xl font-bold text-[var(--color-text)]"
                >
                  {trimesterLabel(result.trimester, isEn)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              <p className="font-mono">
                {isEn
                  ? "Base formula: EDD = LMP + 280 days"
                  : "Базовая формула: ПДР = ПДПМ + 280 дней"}
              </p>
              {result.cycleAdjustmentDays !== 0 ? (
                <p>
                  {isEn
                    ? `Cycle adjustment: ${result.cycleAdjustmentDays > 0 ? "+" : ""}${result.cycleAdjustmentDays} days versus a 28-day cycle; base date ${formatDate(result.baseEstimatedDueDate, true)}.`
                    : `Поправка на цикл: ${result.cycleAdjustmentDays > 0 ? "+" : ""}${result.cycleAdjustmentDays} дн. относительно 28 дней; базовая дата ${formatDate(result.baseEstimatedDueDate, false)}.`}
                </p>
              ) : null}
              <p>
                {isEn
                  ? "This is an estimate that assumes a regular cycle and a known LMP. A clinician and an early ultrasound can refine the date. It is not a diagnosis or medical advice."
                  : "Это оценка при регулярном цикле и известной дате последней менструации. Врач и раннее УЗИ могут уточнить дату. Это не диагноз и не медицинская рекомендация."}
              </p>
            </div>
          </ToolResult>
        ) : (
          <ToolResult
            status="idle"
            description={
              isEn
                ? "The estimated due date, gestational age and trimester will appear here."
                : "Здесь появятся предполагаемая дата родов, текущий срок и триместр."
            }
            className="mt-5"
          />
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Cycle-length adjustment and official methodology"
              : "Поправка на длину цикла и официальная методика"
          }
        >
          <div className="max-w-xs">
            <Label htmlFor="pregnancy-cycle-length">
              {isEn ? "Cycle length, days" : "Длина цикла, дней"}
            </Label>
            <Input
              id="pregnancy-cycle-length"
              type="number"
              min={PREGNANCY_ESTIMATE_LIMITS.minimumCycleDays}
              max={PREGNANCY_ESTIMATE_LIMITS.maximumCycleDays}
              step="1"
              inputMode="numeric"
              value={cycleLength}
              onChange={(event) => {
                setCycleLength(event.target.value);
                invalidate();
              }}
              className="mt-1.5 h-11"
            />
            <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? "Default: 28 days. This setting only shifts the estimated due date by the difference from 28 days."
                : "По умолчанию: 28 дней. Настройка только сдвигает предполагаемую дату на разницу с 28 днями."}
            </p>
          </div>

          <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-xs leading-5 text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "The calculator does not reinterpret ultrasound measurements. Clinical dating uses the LMP, an early accurate ultrasound, or both, with changes documented by a clinician."
                : "Калькулятор не интерпретирует измерения УЗИ. Клиническую дату определяют по последней менструации, раннему точному УЗИ или обоим данным; изменения фиксирует врач."}
            </p>
            <p className="mt-3 font-semibold text-[var(--color-text)]">
              {isEn ? "Official ACOG sources" : "Официальные источники ACOG"}
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {ACOG_SOURCES.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--color-primary)] underline decoration-[var(--color-primary)]/35 underline-offset-2 hover:decoration-current"
                  >
                    {isEn ? source.en : source.ru}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              {isEn
                ? "Sources checked July 11, 2026."
                : "Источники проверены 11 июля 2026 года."}
            </p>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
