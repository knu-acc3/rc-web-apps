"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowsClockwise, Clock, Play } from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";

export const TYPING_DURATION_LIMITS = {
  minimum: 15,
  maximum: 120,
  defaultValue: 60,
} as const;

export const TYPING_CUSTOM_TEXT_LIMITS = {
  minimum: 40,
  maximum: 5_000,
} as const;

const TARGET_CHARACTERS_PER_SECOND = 12;
const TIMER_REFRESH_MILLISECONDS = 100;
const TYPING_SEGMENTER =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

const DEFAULT_TEXT = {
  en: "At the edge of the city, morning traffic moves at a steady pace while people open shops, wait for buses, and plan the work ahead. A light wind carries the sound of doors, footsteps, and distant trains. By noon, the streets are busier, but the small park remains quiet. Readers share benches, cyclists pass along the path, and clouds drift slowly above the roofs. In the evening, windows begin to glow as the noise fades and the day settles into a calmer rhythm.",
  ru: "На окраине города утренний поток движется ровно: люди открывают магазины, ждут автобусы и планируют дела на день. Лёгкий ветер приносит звуки дверей, шагов и далёких поездов. К полудню улицы становятся оживлённее, но небольшой парк остаётся тихим. Читатели занимают скамейки, велосипедисты проезжают по дорожке, а облака медленно плывут над крышами. Вечером в окнах загорается свет, шум стихает, и день переходит в спокойный ритм.",
} as const;

export interface TypingMetrics {
  typedCharacters: number;
  totalCharacters: number;
  correctCharacters: number;
  errors: number;
  wpm: number;
  accuracy: number;
  elapsedMilliseconds: number;
  completed: boolean;
}

type TestPhase = "idle" | "running" | "finished";
type FinishReason = "deadline" | "target-length";
type SetupError = "duration" | "custom-short" | "custom-long";

interface FinishedRun {
  reason: FinishReason;
  metrics: TypingMetrics;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function normalizeTypingText(value: string): string {
  return value.normalize("NFC");
}

export function splitTypingCharacters(value: string): string[] {
  const normalized = normalizeTypingText(value);
  if (TYPING_SEGMENTER) {
    return Array.from(
      TYPING_SEGMENTER.segment(normalized),
      (part) => part.segment,
    );
  }
  return Array.from(normalized);
}

export function countTypingCharacters(value: string): number {
  return splitTypingCharacters(value).length;
}

export function parseTypingDuration(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < TYPING_DURATION_LIMITS.minimum ||
    parsed > TYPING_DURATION_LIMITS.maximum
  ) {
    return null;
  }

  return parsed;
}

export function buildTypingTarget(
  source: string,
  durationSeconds: number,
): string {
  const normalized = normalizeTypingText(source.trim());
  if (!normalized) {
    return "";
  }

  const minimumCharacters = Math.ceil(
    durationSeconds * TARGET_CHARACTERS_PER_SECOND,
  );
  let target = normalized;

  while (countTypingCharacters(target) < minimumCharacters) {
    target += ` ${normalized}`;
  }

  return target;
}

export function clampTypingInput(value: string, target: string): string {
  return splitTypingCharacters(value)
    .slice(0, countTypingCharacters(target))
    .join("");
}

export function createTypingDeadline(
  startedAtMilliseconds: number,
  durationSeconds: number,
): number {
  return startedAtMilliseconds + durationSeconds * 1_000;
}

export function remainingTypingMilliseconds(
  deadlineMilliseconds: number,
  nowMilliseconds: number,
): number {
  return Math.max(0, deadlineMilliseconds - nowMilliseconds);
}

/**
 * WPM uses correctly matched characters divided by five. Errors are mismatches
 * still present in the current input, so correcting or deleting one removes it.
 */
export function calculateTypingMetrics(
  target: string,
  typed: string,
  elapsedMilliseconds: number,
): TypingMetrics {
  const targetCharacters = splitTypingCharacters(target);
  const typedCharacters = splitTypingCharacters(typed);
  let correctCharacters = 0;

  for (let index = 0; index < typedCharacters.length; index += 1) {
    if (typedCharacters[index] === targetCharacters[index]) {
      correctCharacters += 1;
    }
  }

  const typedCharacterCount = typedCharacters.length;
  const errors = typedCharacterCount - correctCharacters;
  const elapsedMinutes = elapsedMilliseconds / 60_000;
  const wpm =
    elapsedMinutes > 0
      ? roundToOneDecimal(correctCharacters / 5 / elapsedMinutes)
      : 0;
  const accuracy =
    typedCharacterCount > 0
      ? roundToOneDecimal((correctCharacters / typedCharacterCount) * 100)
      : 0;

  return {
    typedCharacters: typedCharacterCount,
    totalCharacters: targetCharacters.length,
    correctCharacters,
    errors,
    wpm,
    accuracy,
    elapsedMilliseconds: Math.max(0, elapsedMilliseconds),
    completed:
      targetCharacters.length > 0 &&
      typedCharacterCount >= targetCharacters.length,
  };
}

function formatDecimal(value: number, isEn: boolean): string {
  return value.toLocaleString(isEn ? "en-US" : "ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function TypingSpeed() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [durationInput, setDurationInput] = useState(
    String(TYPING_DURATION_LIMITS.defaultValue),
  );
  const [customText, setCustomText] = useState("");
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [targetText, setTargetText] = useState("");
  const [typed, setTyped] = useState("");
  const [remainingMilliseconds, setRemainingMilliseconds] = useState(0);
  const [runDurationMilliseconds, setRunDurationMilliseconds] = useState(0);
  const [finishedRun, setFinishedRun] = useState<FinishedRun | null>(null);
  const [setupError, setSetupError] = useState<SetupError | null>(null);

  const timerRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const runTokenRef = useRef(0);
  const startedAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const targetRef = useRef("");
  const typedRef = useRef("");
  const runningRef = useRef(false);
  const composingRef = useRef(false);
  const typingInputRef = useRef<HTMLTextAreaElement>(null);

  const stopScheduledWork = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (focusFrameRef.current !== null) {
      window.cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }
  }, []);

  const finishRun = useCallback(
    (
      finishedAtMilliseconds: number,
      expectedToken: number,
      reason: FinishReason,
    ) => {
      if (!runningRef.current || runTokenRef.current !== expectedToken) {
        return;
      }

      runningRef.current = false;
      composingRef.current = false;
      runTokenRef.current += 1;
      stopScheduledWork();

      const effectiveFinishedAt =
        reason === "deadline" ? deadlineRef.current : finishedAtMilliseconds;
      const elapsedMilliseconds = Math.max(
        0,
        effectiveFinishedAt - startedAtRef.current,
      );
      const metrics = calculateTypingMetrics(
        targetRef.current,
        typedRef.current,
        elapsedMilliseconds,
      );

      setRemainingMilliseconds(0);
      setFinishedRun({ reason, metrics });
      setPhase("finished");
    },
    [stopScheduledWork],
  );

  useEffect(() => {
    return () => {
      runningRef.current = false;
      composingRef.current = false;
      runTokenRef.current += 1;
      stopScheduledWork();
    };
  }, [stopScheduledWork]);

  const handleStart = () => {
    const durationSeconds = parseTypingDuration(durationInput);
    if (durationSeconds === null) {
      setSetupError("duration");
      return;
    }

    const trimmedCustomText = customText.trim();
    const customCharacterCount = countTypingCharacters(trimmedCustomText);

    if (
      trimmedCustomText &&
      customCharacterCount < TYPING_CUSTOM_TEXT_LIMITS.minimum
    ) {
      setSetupError("custom-short");
      return;
    }

    if (customCharacterCount > TYPING_CUSTOM_TEXT_LIMITS.maximum) {
      setSetupError("custom-long");
      return;
    }

    const target = trimmedCustomText
      ? trimmedCustomText
      : buildTypingTarget(
          isEn ? DEFAULT_TEXT.en : DEFAULT_TEXT.ru,
          durationSeconds,
        );
    const durationMilliseconds = durationSeconds * 1_000;

    stopScheduledWork();
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    runningRef.current = true;
    composingRef.current = false;

    const startedAt = performance.now();
    const deadline = createTypingDeadline(startedAt, durationSeconds);
    startedAtRef.current = startedAt;
    deadlineRef.current = deadline;
    targetRef.current = target;
    typedRef.current = "";

    setSetupError(null);
    setTargetText(target);
    setTyped("");
    setRunDurationMilliseconds(durationMilliseconds);
    setRemainingMilliseconds(durationMilliseconds);
    setFinishedRun(null);
    setPhase("running");

    timerRef.current = window.setInterval(() => {
      if (runTokenRef.current !== token) {
        return;
      }

      const now = performance.now();
      const nextRemaining = remainingTypingMilliseconds(deadline, now);

      if (nextRemaining <= 0) {
        finishRun(now, token, "deadline");
        return;
      }

      setRemainingMilliseconds(nextRemaining);
    }, TIMER_REFRESH_MILLISECONDS);

    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = null;
      typingInputRef.current?.focus();
    });
  };

  const updateTypingValue = (value: string, isComposing: boolean) => {
    if (!runningRef.current) {
      return;
    }

    const token = runTokenRef.current;
    const now = performance.now();
    if (remainingTypingMilliseconds(deadlineRef.current, now) <= 0) {
      finishRun(now, token, "deadline");
      return;
    }

    const nextTyped = clampTypingInput(value, targetRef.current);
    typedRef.current = nextTyped;
    setTyped(nextTyped);

    if (
      !isComposing &&
      countTypingCharacters(nextTyped) >=
        countTypingCharacters(targetRef.current)
    ) {
      finishRun(now, token, "target-length");
    }
  };

  const handleTypingChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const nativeIsComposing =
      "isComposing" in event.nativeEvent &&
      event.nativeEvent.isComposing === true;
    updateTypingValue(
      event.target.value,
      composingRef.current || nativeIsComposing,
    );
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };

  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLTextAreaElement>,
  ) => {
    composingRef.current = false;
    updateTypingValue(event.currentTarget.value, false);
  };

  const liveElapsedMilliseconds =
    phase === "running"
      ? Math.max(0, runDurationMilliseconds - remainingMilliseconds)
      : 0;
  const displayedMetrics =
    phase === "running"
      ? calculateTypingMetrics(targetText, typed, liveElapsedMilliseconds)
      : (finishedRun?.metrics ?? null);

  let resultStatus: "idle" | "loading" | "success" | "error";
  let resultTitle: string;
  let resultDescription: string;

  if (setupError) {
    resultStatus = "error";
    resultTitle = isEn ? "Check advanced settings" : "Проверьте настройки";

    if (setupError === "duration") {
      resultDescription = isEn
        ? `Duration must be a whole number from ${TYPING_DURATION_LIMITS.minimum} to ${TYPING_DURATION_LIMITS.maximum} seconds.`
        : `Длительность должна быть целым числом от ${TYPING_DURATION_LIMITS.minimum} до ${TYPING_DURATION_LIMITS.maximum} секунд.`;
    } else if (setupError === "custom-short") {
      resultDescription = isEn
        ? `Custom text must contain at least ${TYPING_CUSTOM_TEXT_LIMITS.minimum} characters, or be left empty.`
        : `Собственный текст должен содержать не менее ${TYPING_CUSTOM_TEXT_LIMITS.minimum} символов либо оставаться пустым.`;
    } else {
      resultDescription = isEn
        ? `Custom text cannot exceed ${TYPING_CUSTOM_TEXT_LIMITS.maximum.toLocaleString("en-US")} characters.`
        : `Собственный текст не может превышать ${TYPING_CUSTOM_TEXT_LIMITS.maximum.toLocaleString("ru-RU")} символов.`;
    }
  } else if (phase === "running") {
    resultStatus = "loading";
    resultTitle = isEn ? "Test in progress" : "Тест идёт";
    resultDescription = isEn
      ? `${Math.ceil(remainingMilliseconds / 1_000)} seconds remaining.`
      : `Осталось ${Math.ceil(remainingMilliseconds / 1_000)} сек.`;
  } else if (finishedRun) {
    resultStatus = "success";
    resultTitle = isEn ? "Test finished" : "Тест завершён";
    const elapsedSeconds = formatDecimal(
      finishedRun.metrics.elapsedMilliseconds / 1_000,
      isEn,
    );
    resultDescription =
      finishedRun.reason === "deadline"
        ? isEn
          ? `Time expired. Metrics use the configured test duration of ${elapsedSeconds} seconds.`
          : `Время истекло. Метрики рассчитаны за заданные ${elapsedSeconds} сек.`
        : isEn
          ? `The target length was reached in ${elapsedSeconds} seconds.`
          : `Весь текст введён за ${elapsedSeconds} сек.`;
  } else {
    resultStatus = "idle";
    resultTitle = isEn ? "Ready to start" : "Можно начинать";
    resultDescription = isEn
      ? "Press Start test, then type the shown text in the active field."
      : "Нажмите «Начать тест», затем печатайте показанный текст в активном поле.";
  }

  const customCharacterCount = countTypingCharacters(customText.trim());

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="p-4 sm:p-6">
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          {isEn
            ? "The timer starts only when you press the button. Corrected or deleted mismatches no longer count as errors."
            : "Таймер запускается только по кнопке. Исправленные или удалённые несовпадения больше не считаются ошибками."}
        </p>

        <ToolPrimaryAction
          type="button"
          onClick={handleStart}
          className="mt-5"
          leadingIcon={
            phase === "running" ? (
              <ArrowsClockwise size={20} weight="bold" aria-hidden="true" />
            ) : (
              <Play size={20} weight="fill" aria-hidden="true" />
            )
          }
        >
          {phase === "running"
            ? isEn
              ? "Restart test"
              : "Начать заново"
            : isEn
              ? "Start test"
              : "Начать тест"}
        </ToolPrimaryAction>

        <ToolResult
          status={resultStatus}
          title={resultTitle}
          description={resultDescription}
          className="mt-5"
        >
          {!setupError && targetText && (phase === "running" || finishedRun) ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--color-text-muted)]">
                  <span>{isEn ? "Target text" : "Текст для ввода"}</span>
                  {displayedMetrics ? (
                    <span className="tabular-nums">
                      {displayedMetrics.typedCharacters.toLocaleString(
                        isEn ? "en-US" : "ru-RU",
                      )}{" "}
                      /{" "}
                      {displayedMetrics.totalCharacters.toLocaleString(
                        isEn ? "en-US" : "ru-RU",
                      )}
                    </span>
                  ) : null}
                </div>
                <div className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/45 p-3 font-mono text-sm leading-relaxed text-[var(--color-text)]">
                  {targetText}
                </div>
              </div>

              {phase === "running" ? (
                <div>
                  <label
                    htmlFor="typing-input"
                    className="text-sm font-semibold text-[var(--color-text)]"
                  >
                    {isEn ? "Typing input" : "Поле ввода"}
                  </label>
                  <Textarea
                    ref={typingInputRef}
                    id="typing-input"
                    value={typed}
                    onChange={handleTypingChange}
                    onCompositionStart={handleCompositionStart}
                    onCompositionEnd={handleCompositionEnd}
                    rows={5}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    placeholder={
                      isEn
                        ? "Type the target text here…"
                        : "Печатайте текст здесь…"
                    }
                    className="mt-1.5 resize-y font-mono text-base leading-relaxed"
                  />
                </div>
              ) : null}

              {displayedMetrics ? (
                <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    <dt className="text-xs text-[var(--color-text-muted)]">
                      WPM
                    </dt>
                    <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">
                      {formatDecimal(displayedMetrics.wpm, isEn)}
                    </dd>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    <dt className="text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Accuracy" : "Точность"}
                    </dt>
                    <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">
                      {formatDecimal(displayedMetrics.accuracy, isEn)}%
                    </dd>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                    <dt className="text-xs text-[var(--color-text-muted)]">
                      {isEn ? "Errors" : "Ошибки"}
                    </dt>
                    <dd className="mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">
                      {displayedMetrics.errors.toLocaleString(
                        isEn ? "en-US" : "ru-RU",
                      )}
                    </dd>
                  </div>
                </dl>
              ) : null}

              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                {isEn
                  ? "WPM uses correctly matched characters ÷ 5 and the scored test time: live elapsed time while running, or the configured duration at timeout. Missing characters are not counted as errors."
                  : "WPM рассчитывается по правильно введённым символам ÷ 5 и зачётному времени: текущему времени во время теста или заданной длительности при тайм-ауте. Невведённые символы не считаются ошибками."}
              </p>
            </div>
          ) : null}
        </ToolResult>

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Bounded duration and optional custom text"
              : "Ограниченная длительность и собственный текст"
          }
        >
          <div className="grid min-w-0 gap-4">
            <div>
              <label
                htmlFor="typing-duration"
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                {isEn ? "Duration, seconds" : "Длительность, секунды"}
              </label>
              <Input
                id="typing-duration"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationInput}
                disabled={phase === "running"}
                aria-invalid={setupError === "duration" || undefined}
                onChange={(event) => {
                  setDurationInput(event.target.value);
                  setSetupError(null);
                }}
                className="mt-1.5 h-12 font-mono text-base tabular-nums"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? `Whole number from ${TYPING_DURATION_LIMITS.minimum} to ${TYPING_DURATION_LIMITS.maximum}.`
                  : `Целое число от ${TYPING_DURATION_LIMITS.minimum} до ${TYPING_DURATION_LIMITS.maximum}.`}
              </p>
            </div>

            <div>
              <label
                htmlFor="typing-custom-text"
                className="text-sm font-semibold text-[var(--color-text)]"
              >
                {isEn ? "Custom text (optional)" : "Свой текст (необязательно)"}
              </label>
              <Textarea
                id="typing-custom-text"
                value={customText}
                disabled={phase === "running"}
                aria-invalid={
                  setupError === "custom-short" ||
                  setupError === "custom-long" ||
                  undefined
                }
                onChange={(event) => {
                  setCustomText(event.target.value);
                  setSetupError(null);
                }}
                rows={4}
                placeholder={
                  isEn
                    ? "Leave empty to use the neutral built-in text."
                    : "Оставьте пустым, чтобы использовать нейтральный встроенный текст."
                }
                className="mt-1.5 resize-y text-sm leading-relaxed"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {customCharacterCount.toLocaleString(isEn ? "en-US" : "ru-RU")}{" "}
                /{" "}
                {TYPING_CUSTOM_TEXT_LIMITS.maximum.toLocaleString(
                  isEn ? "en-US" : "ru-RU",
                )}
                .{" "}
                {isEn
                  ? `If provided, use at least ${TYPING_CUSTOM_TEXT_LIMITS.minimum} characters.`
                  : `Если поле заполнено, нужно не менее ${TYPING_CUSTOM_TEXT_LIMITS.minimum} символов.`}
              </p>
            </div>
          </div>

          {phase === "running" ? (
            <p className="mt-4 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <Clock size={16} aria-hidden="true" />
              {isEn
                ? "Settings are locked until this run finishes or restarts."
                : "Настройки заблокированы до завершения или перезапуска теста."}
            </p>
          ) : null}
        </AdvancedSettings>
      </Card>
    </div>
  );
}
