"use client";

import { useCallback, useState } from "react";
import { Moon, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type SleepMode = "find-bedtime" | "find-wakeup";

interface SleepOption {
  cycles: number;
  time: string;
  sleepMinutes: number;
}

interface SleepSuccess {
  ok: true;
  mode: SleepMode;
  inputTime: string;
  cycleMinutes: number;
  fallAsleepMinutes: number;
  options: SleepOption[];
}

interface SleepError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type SleepResult = SleepSuccess | SleepError;

function parseWholeNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseClockTime(value: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/u.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function formatClockTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function calculateSleepTimes(
  mode: SleepMode,
  inputTime: string,
  cycleInput: string,
  fallAsleepInput: string,
): SleepResult {
  const inputMinutes = parseClockTime(inputTime);
  const cycleMinutes = parseWholeNumber(cycleInput);
  const fallAsleepMinutes = parseWholeNumber(fallAsleepInput);

  if (inputMinutes === null) {
    return {
      ok: false,
      messageEn: "Choose a valid time.",
      messageRu: "Выберите корректное время.",
    };
  }
  if (cycleMinutes === null || cycleMinutes < 80 || cycleMinutes > 100) {
    return {
      ok: false,
      messageEn: "Cycle length must be a whole number from 80 to 100 minutes.",
      messageRu: "Длина цикла должна быть целым числом от 80 до 100 минут.",
    };
  }
  if (
    fallAsleepMinutes === null ||
    fallAsleepMinutes < 0 ||
    fallAsleepMinutes > 120
  ) {
    return {
      ok: false,
      messageEn:
        "Time to fall asleep must be a whole number from 0 to 120 minutes.",
      messageRu:
        "Время на засыпание должно быть целым числом от 0 до 120 минут.",
    };
  }

  const options = [6, 5, 4].map((cycles) => {
    const sleepMinutes = cycles * cycleMinutes;
    const offset = sleepMinutes + fallAsleepMinutes;
    const resultMinutes =
      mode === "find-bedtime" ? inputMinutes - offset : inputMinutes + offset;

    return {
      cycles,
      time: formatClockTime(resultMinutes),
      sleepMinutes,
    };
  });

  return {
    ok: true,
    mode,
    inputTime,
    cycleMinutes,
    fallAsleepMinutes,
    options,
  };
}

function formatDuration(minutes: number, isEn: boolean) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return isEn ? `${hours} h` : `${hours} ч`;
  }
  return isEn
    ? `${hours} h ${remainingMinutes} min`
    : `${hours} ч ${remainingMinutes} мин`;
}

function formatCycles(cycles: number, isEn: boolean) {
  if (isEn) return `${cycles} cycles`;
  return cycles === 4 ? "4 цикла" : `${cycles} циклов`;
}

export default function SleepCalc() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<SleepMode>("find-bedtime");
  const [time, setTime] = useState("");
  const [cycleMinutes, setCycleMinutes] = useState("90");
  const [fallAsleepMinutes, setFallAsleepMinutes] = useState("15");
  const [result, setResult] = useState<SleepResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);
  const inputLabel =
    mode === "find-bedtime"
      ? isEn
        ? "Wake-up time"
        : "Время подъёма"
      : isEn
        ? "Bedtime"
        : "Время, когда ложитесь";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Moon size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Sleep time estimate" : "Расчёт времени сна"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Choose one goal and enter one time."
                : "Выберите одну цель и укажите одно время."}
            </p>
          </div>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">
            {isEn ? "What do you want to find?" : "Что нужно найти?"}
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                [
                  "find-bedtime",
                  isEn ? "When to go to bed" : "Во сколько лечь",
                ],
                [
                  "find-wakeup",
                  isEn ? "When to wake up" : "Во сколько проснуться",
                ],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  clearResult();
                }}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] border px-2 py-2 text-sm font-semibold transition-colors",
                  mode === value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4">
          <Label htmlFor="sleep-time">{inputLabel}</Label>
          <Input
            id="sleep-time"
            type="time"
            step={60}
            value={time}
            onChange={(event) => {
              setTime(event.target.value);
              clearResult();
            }}
            className="mt-2 h-12 font-mono text-base"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!time}
          onClick={() =>
            setResult(
              calculateSleepTimes(mode, time, cycleMinutes, fallAsleepMinutes),
            )
          }
          leadingIcon={<Moon size={20} aria-hidden="true" />}
        >
          {mode === "find-bedtime"
            ? isEn
              ? "Show bedtimes"
              : "Показать время отхода ко сну"
            : isEn
              ? "Show wake-up times"
              : "Показать время подъёма"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Calculation settings" : "Настройки расчёта"}
          description={
            isEn
              ? `${cycleMinutes || "—"} min cycle · ${fallAsleepMinutes || "—"} min to fall asleep`
              : `Цикл ${cycleMinutes || "—"} мин · засыпание ${fallAsleepMinutes || "—"} мин`
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="sleep-cycle-minutes">
                {isEn ? "Cycle estimate, minutes" : "Оценка цикла, минуты"}
              </Label>
              <Input
                id="sleep-cycle-minutes"
                type="number"
                inputMode="numeric"
                min={80}
                max={100}
                step={1}
                value={cycleMinutes}
                onChange={(event) => {
                  setCycleMinutes(event.target.value);
                  clearResult();
                }}
                className="mt-2 h-11 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="sleep-fall-asleep">
                {isEn
                  ? "Time to fall asleep, minutes"
                  : "Время на засыпание, минуты"}
              </Label>
              <Input
                id="sleep-fall-asleep"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={1}
                value={fallAsleepMinutes}
                onChange={(event) => {
                  setFallAsleepMinutes(event.target.value);
                  clearResult();
                }}
                className="mt-2 h-11 font-mono"
              />
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "NHLBI says sleep cycles restart every 80–100 minutes and there are usually four to six per night. This calculator uses the chosen single value only to shift clock times."
              : "По данным NHLBI, цикл сна начинается заново каждые 80–100 минут; обычно за ночь бывает от четырёх до шести циклов. Калькулятор использует одно выбранное значение только для сдвига времени."}
          </p>
          <a
            href="https://www.nhlbi.nih.gov/health/sleep/stages-of-sleep"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isEn ? "Source: NIH / NHLBI" : "Источник: NIH / NHLBI"}
          </a>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="sleep-result-title"
          >
            <h2 id="sleep-result-title" className="font-bold">
              {result.mode === "find-bedtime"
                ? isEn
                  ? `Estimated bedtimes before ${result.inputTime}`
                  : `Расчётное время отхода ко сну до ${result.inputTime}`
                : isEn
                  ? `Estimated wake-up times after ${result.inputTime}`
                  : `Расчётное время подъёма после ${result.inputTime}`}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isEn
                ? `${result.cycleMinutes} minutes per cycle · ${result.fallAsleepMinutes}-minute fall-asleep delay`
                : `По ${result.cycleMinutes} минут на цикл · ${result.fallAsleepMinutes} минут на засыпание`}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {result.options.map((option) => (
                <div
                  key={option.cycles}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center"
                >
                  <p className="font-mono text-3xl font-bold text-[var(--color-primary)]">
                    {option.time}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCycles(option.cycles, isEn)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatDuration(option.sleepMinutes, isEn)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "These are clock-time estimates, not sleep recommendations. Cycle length varies, and this calculation cannot determine how much sleep you need or how you will feel on waking. Not medical advice."
                : "Это расчёт времени, а не рекомендация по длительности сна. Длина циклов меняется, и расчёт не определяет вашу потребность во сне или самочувствие после пробуждения. Не является медицинской рекомендацией."}
            </p>
          </Card>
        ) : (
          <Card className="p-4 sm:p-5" role="alert" aria-live="polite">
            <div className="flex items-start gap-3">
              <XCircle
                size={24}
                weight="fill"
                className="shrink-0 text-[var(--color-danger)]"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-bold">
                  {isEn
                    ? "Cannot calculate times"
                    : "Не удалось рассчитать время"}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {isEn ? result.messageEn : result.messageRu}
                </p>
              </div>
            </div>
          </Card>
        )
      ) : null}
    </div>
  );
}
