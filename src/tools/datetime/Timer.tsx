"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

type TimerMode = "countdown" | "stopwatch";
type TimerStatus = "idle" | "running" | "paused" | "finished";

function durationFromInputs(minutes: string, seconds: string) {
  const minuteValue = Number(minutes);
  const secondValue = Number(seconds);
  if (
    !Number.isInteger(minuteValue) ||
    !Number.isInteger(secondValue) ||
    minuteValue < 0 ||
    minuteValue > 999 ||
    secondValue < 0 ||
    secondValue > 59
  ) {
    return null;
  }
  return (minuteValue * 60 + secondValue) * 1000;
}

function formatTime(milliseconds: number, stopwatch: boolean) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const base =
    hours > 0
      ? [hours, minutes, seconds]
          .map((value) => String(value).padStart(2, "0"))
          .join(":")
      : [minutes, seconds]
          .map((value) => String(value).padStart(2, "0"))
          .join(":");
  if (!stopwatch) return base;
  return base + "." + Math.floor((safeMilliseconds % 1000) / 100);
}

export default function TimerComponent() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [mode, setMode] = useState<TimerMode>("countdown");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [displayMilliseconds, setDisplayMilliseconds] = useState(300_000);
  const [laps, setLaps] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [error, setError] = useState("");

  const targetEndRef = useRef(0);
  const startedAtRef = useRef(0);
  const stopwatchBaseRef = useRef(0);
  const completionNotifiedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const prepareAudio = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;
      void context.resume().catch(() => undefined);
    } catch {
      audioContextRef.current = null;
    }
  }, [soundEnabled]);

  const notifyCompletion = useCallback(async () => {
    if (vibrationEnabled) {
      try {
        navigator.vibrate?.([140, 80, 140]);
      } catch {
        // Vibration is optional and may be blocked by the browser.
      }
    }

    if (!soundEnabled) return;
    try {
      const context = audioContextRef.current;
      if (!context) return;
      await context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.28,
      );
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    } catch {
      // Audio is an optional enhancement; blocked autoplay stays silent.
    }
  }, [soundEnabled, vibrationEnabled]);

  useEffect(() => {
    if (status !== "running") return;

    const update = () => {
      if (mode === "countdown") {
        const nextValue = Math.max(0, targetEndRef.current - Date.now());
        setDisplayMilliseconds(nextValue);
        if (nextValue === 0) {
          setStatus("finished");
          if (!completionNotifiedRef.current) {
            completionNotifiedRef.current = true;
            void notifyCompletion();
          }
        }
        return;
      }

      setDisplayMilliseconds(
        stopwatchBaseRef.current + Date.now() - startedAtRef.current,
      );
    };

    update();
    const interval = window.setInterval(update, 100);
    return () => window.clearInterval(interval);
  }, [mode, notifyCompletion, status]);

  useEffect(
    () => () => {
      const context = audioContextRef.current;
      if (context) void context.close().catch(() => undefined);
    },
    [],
  );

  const updateCountdownPreview = (nextMinutes: string, nextSeconds: string) => {
    const duration = durationFromInputs(nextMinutes, nextSeconds);
    setDisplayMilliseconds(duration ?? 0);
    setStatus("idle");
    setError("");
  };

  const startOrResume = () => {
    if (status === "running") {
      if (mode === "countdown") {
        setDisplayMilliseconds(Math.max(0, targetEndRef.current - Date.now()));
      } else {
        const elapsed =
          stopwatchBaseRef.current + Date.now() - startedAtRef.current;
        stopwatchBaseRef.current = elapsed;
        setDisplayMilliseconds(elapsed);
      }
      setStatus("paused");
      return;
    }

    prepareAudio();
    completionNotifiedRef.current = false;

    if (mode === "countdown") {
      let nextDuration = displayMilliseconds;
      if (status === "idle" || status === "finished") {
        const configuredDuration = durationFromInputs(minutes, seconds);
        if (configuredDuration === null || configuredDuration <= 0) {
          setError(
            isEn
              ? "Enter 0–999 minutes and 0–59 seconds. Duration must be greater than zero."
              : "Введите 0–999 минут и 0–59 секунд. Длительность должна быть больше нуля.",
          );
          return;
        }
        nextDuration = configuredDuration;
        setDisplayMilliseconds(configuredDuration);
      }
      targetEndRef.current = Date.now() + nextDuration;
    } else {
      if (status === "idle" || status === "finished") {
        stopwatchBaseRef.current = 0;
        setDisplayMilliseconds(0);
        setLaps([]);
      }
      startedAtRef.current = Date.now();
    }

    setError("");
    setStatus("running");
  };

  const reset = (nextMode = mode) => {
    setStatus("idle");
    setError("");
    setLaps([]);
    stopwatchBaseRef.current = 0;
    completionNotifiedRef.current = false;
    if (nextMode === "countdown") {
      setDisplayMilliseconds(durationFromInputs(minutes, seconds) ?? 0);
    } else {
      setDisplayMilliseconds(0);
    }
  };

  const changeMode = (nextMode: TimerMode) => {
    setMode(nextMode);
    reset(nextMode);
  };

  const primaryLabel = (() => {
    if (status === "running") return isEn ? "Pause" : "Пауза";
    if (status === "paused") return isEn ? "Resume" : "Продолжить";
    if (mode === "stopwatch") {
      return isEn ? "Start stopwatch" : "Запустить секундомер";
    }
    if (status === "finished") return isEn ? "Start again" : "Запустить снова";
    return isEn ? "Start countdown" : "Запустить таймер";
  })();

  const statusLabel = (() => {
    if (status === "running") return isEn ? "Running" : "Идёт";
    if (status === "paused") return isEn ? "Paused" : "На паузе";
    if (status === "finished") return isEn ? "Time is up" : "Время вышло";
    return isEn ? "Ready" : "Готов";
  })();

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        {mode === "countdown" ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <Label htmlFor="timer-minutes">
                {isEn ? "Minutes" : "Минуты"}
              </Label>
              <Input
                id="timer-minutes"
                type="number"
                inputMode="numeric"
                min={0}
                max={999}
                step={1}
                value={minutes}
                disabled={status === "running" || status === "paused"}
                onChange={(event) => {
                  const value = event.target.value;
                  setMinutes(value);
                  updateCountdownPreview(value, seconds);
                }}
                className="mt-1.5 h-12 text-center text-lg font-bold"
              />
            </div>
            <div className="min-w-0">
              <Label htmlFor="timer-seconds">
                {isEn ? "Seconds" : "Секунды"}
              </Label>
              <Input
                id="timer-seconds"
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                step={1}
                value={seconds}
                disabled={status === "running" || status === "paused"}
                onChange={(event) => {
                  const value = event.target.value;
                  setSeconds(value);
                  updateCountdownPreview(minutes, value);
                }}
                className="mt-1.5 h-12 text-center text-lg font-bold"
              />
            </div>
          </div>
        ) : null}

        <div
          role="timer"
          aria-label={
            isEn
              ? "Timer: " +
                formatTime(displayMilliseconds, mode === "stopwatch")
              : "Таймер: " +
                formatTime(displayMilliseconds, mode === "stopwatch")
          }
          className="mt-5 min-w-0 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-6 text-center"
        >
          <p className="break-all font-mono text-5xl font-black tabular-nums tracking-tight text-[var(--color-text)] sm:text-6xl">
            {formatTime(displayMilliseconds, mode === "stopwatch")}
          </p>
          <p
            aria-live="polite"
            className="mt-2 text-sm font-semibold text-[var(--color-text-muted)]"
          >
            {statusLabel}
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          onClick={startOrResume}
        >
          {primaryLabel}
        </ToolPrimaryAction>

        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-2 w-full sm:w-auto"
          onClick={() => reset()}
          disabled={status === "idle" && displayMilliseconds === 0}
        >
          {isEn ? "Reset" : "Сбросить"}
        </Button>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Timer settings" : "Настройки таймера"}
          description={
            isEn
              ? "Stopwatch, laps, sound and vibration"
              : "Секундомер, круги, звук и вибрация"
          }
        >
          <Label htmlFor="timer-mode">{isEn ? "Mode" : "Режим"}</Label>
          <select
            id="timer-mode"
            value={mode}
            disabled={status === "running" || status === "paused"}
            onChange={(event) => changeMode(event.target.value as TimerMode)}
            className="mt-1.5 h-11 w-full max-w-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] disabled:opacity-50"
          >
            <option value="countdown">
              {isEn ? "Countdown" : "Обратный отсчёт"}
            </option>
            <option value="stopwatch">
              {isEn ? "Stopwatch" : "Секундомер"}
            </option>
          </select>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(event) => setSoundEnabled(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Sound when finished" : "Звук по завершении"}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium hover:bg-[var(--color-surface-muted)]">
              <input
                type="checkbox"
                checked={vibrationEnabled}
                onChange={(event) => setVibrationEnabled(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-primary)]"
              />
              {isEn ? "Vibrate when finished" : "Вибрация по завершении"}
            </label>
          </div>

          {mode === "stopwatch" ? (
            <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() =>
                  setLaps((current) => [displayMilliseconds, ...current])
                }
                disabled={status !== "running"}
              >
                {isEn ? "Add lap" : "Добавить круг"}
              </Button>
              {laps.length > 0 ? (
                <ol className="mt-3 max-h-52 divide-y divide-[var(--color-border)] overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  {laps.map((lap, index) => (
                    <li
                      key={laps.length - index + "-" + lap}
                      className="flex min-h-11 items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="font-semibold">
                        {isEn ? "Lap " : "Круг "}
                        {laps.length - index}
                      </span>
                      <span className="font-mono tabular-nums">
                        {formatTime(lap, true)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </AdvancedSettings>

        <p className="mt-4 text-xs leading-5 text-[var(--color-text-muted)]">
          {isEn
            ? "The timer uses the target end time, so background-tab throttling does not accumulate drift. Sound and vibration depend on browser permission and may remain silent."
            : "Таймер считает от целевого времени, поэтому замедление фоновой вкладки не накапливает ошибку. Звук и вибрация зависят от разрешений браузера и могут не сработать."}
        </p>
      </section>
    </div>
  );
}
