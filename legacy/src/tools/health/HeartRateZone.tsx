"use client";

import { useCallback, useState } from "react";
import { Heart, XCircle } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

interface HeartRateRange {
  min: number;
  max: number;
}

interface HeartRateSuccess {
  ok: true;
  age: number;
  estimatedMaximum: number;
  moderate: HeartRateRange;
  vigorous: HeartRateRange;
}

interface HeartRateError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type HeartRateResult = HeartRateSuccess | HeartRateError;

function parseWholeNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function calculateHeartRateZones(ageInput: string): HeartRateResult {
  const age = parseWholeNumber(ageInput);

  if (age === null || age < 18 || age > 100) {
    return {
      ok: false,
      messageEn: "Age must be a whole number from 18 to 100.",
      messageRu: "Возраст должен быть целым числом от 18 до 100.",
    };
  }

  const estimatedMaximum = 220 - age;
  const moderate = {
    min: Math.round(estimatedMaximum * 0.5),
    max: Math.round(estimatedMaximum * 0.7),
  };
  const vigorous = {
    min: Math.round(estimatedMaximum * 0.7),
    max: Math.round(estimatedMaximum * 0.85),
  };

  return {
    ok: true,
    age,
    estimatedMaximum,
    moderate,
    vigorous,
  };
}

export default function HeartRateZone() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [age, setAge] = useState("");
  const [result, setResult] = useState<HeartRateResult | null>(null);

  const clearResult = useCallback(() => setResult(null), []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Heart size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn
                ? "Exercise heart-rate estimate"
                : "Расчёт пульса для нагрузки"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Enter your age to see two general intensity ranges."
                : "Укажите возраст, чтобы увидеть два общих диапазона интенсивности."}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="heart-rate-age">
            {isEn ? "Age, years" : "Возраст, лет"}
          </Label>
          <Input
            id="heart-rate-age"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={18}
            max={100}
            step={1}
            value={age}
            onChange={(event) => {
              setAge(event.target.value);
              clearResult();
            }}
            placeholder={isEn ? "18–100" : "18–100"}
            className="mt-2 h-12 font-mono text-base"
          />
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!age.trim()}
          onClick={() => setResult(calculateHeartRateZones(age))}
          leadingIcon={<Heart size={20} aria-hidden="true" />}
        >
          {isEn ? "Calculate heart-rate ranges" : "Рассчитать диапазоны пульса"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Formula and limits" : "Формула и ограничения"}
          description={
            isEn
              ? "220 − age · percentage of estimated maximum"
              : "220 − возраст · доля от расчётного максимума"
          }
        >
          <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            <p>
              {isEn
                ? "The calculation uses estimated maximum ≈ 220 − age, then 50–70% for moderate activity and 70–85% for vigorous activity. Values are rounded to whole beats per minute."
                : "Расчёт использует оценку максимального пульса ≈ 220 − возраст, затем 50–70% для умеренной и 70–85% для высокой интенсивности. Значения округляются до целых ударов в минуту."}
            </p>
            <p>
              {isEn
                ? "Resting heart rate and the Karvonen method are not used in this focused estimate."
                : "Пульс в покое и метод Карвонена в этом упрощённом расчёте не используются."}
            </p>
          </div>
          <a
            href="https://www.heart.org/en/healthy-living/exercise-and-physical-activity/fitness-basics/target-heart-rates"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
          >
            {isEn
              ? "Source: American Heart Association"
              : "Источник: American Heart Association"}
          </a>
        </AdvancedSettings>
      </Card>

      {result ? (
        result.ok ? (
          <Card
            className="p-4 sm:p-5"
            aria-live="polite"
            aria-labelledby="heart-rate-result-title"
          >
            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-4 text-center">
              <h2
                id="heart-rate-result-title"
                className="text-sm font-semibold text-[var(--color-text-muted)]"
              >
                {isEn
                  ? "Age-estimated maximum"
                  : "Расчётный максимальный пульс"}
              </h2>
              <p className="mt-1 font-mono text-4xl font-bold text-[var(--color-primary)]">
                {result.estimatedMaximum}
                <span className="ml-2 text-base font-semibold text-[var(--color-text-muted)]">
                  {isEn ? "bpm" : "уд/мин"}
                </span>
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? `220 − ${result.age} = ${result.estimatedMaximum}`
                  : `220 − ${result.age} = ${result.estimatedMaximum}`}
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <p className="font-semibold">
                  {isEn ? "Moderate · 50–70%" : "Умеренная · 50–70%"}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold">
                  {result.moderate.min}–{result.moderate.max}
                  <span className="ml-2 text-sm font-semibold text-[var(--color-text-muted)]">
                    {isEn ? "bpm" : "уд/мин"}
                  </span>
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
                <p className="font-semibold">
                  {isEn ? "Vigorous · 70–85%" : "Высокая · 70–85%"}
                </p>
                <p className="mt-2 font-mono text-2xl font-bold">
                  {result.vigorous.min}–{result.vigorous.max}
                  <span className="ml-2 text-sm font-semibold text-[var(--color-text-muted)]">
                    {isEn ? "bpm" : "уд/мин"}
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isEn
                ? "These figures are averages and a general guide, not a personal safety limit. Medication, health conditions, fitness and other factors can change your actual range. Not medical advice."
                : "Это средние ориентировочные значения, а не персональный безопасный предел. Лекарства, состояние здоровья, тренированность и другие факторы могут менять ваш фактический диапазон. Не является медицинской рекомендацией."}
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
                    ? "Cannot calculate ranges"
                    : "Не удалось рассчитать диапазоны"}
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
