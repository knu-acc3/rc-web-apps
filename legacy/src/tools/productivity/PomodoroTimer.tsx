"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Play, Stop } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { cn } from "@/src/lib/cn";

export type PomodoroPhase = "focus" | "break";
export type PomodoroStatus = "idle" | "running";

export interface PomodoroDurations {
  focusMinutes: number;
  breakMinutes: number;
}

export interface PomodoroTickResult {
  completed: boolean;
  remainingMs: number;
  nextPhase: PomodoroPhase;
  nextDurationMs: number;
}

export const POMODORO_LIMITS = {
  minimumFocusMinutes: 1,
  maximumFocusMinutes: 120,
  minimumBreakMinutes: 1,
  maximumBreakMinutes: 60,
} as const;

export const DEFAULT_POMODORO_DURATIONS: PomodoroDurations = {
  focusMinutes: 25,
  breakMinutes: 5,
};

export function parsePomodoroMinutes(
  value: string,
  phase: PomodoroPhase,
): number | null {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;

  const parsed = Number(normalized);
  const minimum =
    phase === "focus"
      ? POMODORO_LIMITS.minimumFocusMinutes
      : POMODORO_LIMITS.minimumBreakMinutes;
  const maximum =
    phase === "focus"
      ? POMODORO_LIMITS.maximumFocusMinutes
      : POMODORO_LIMITS.maximumBreakMinutes;

  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

export function pomodoroDurationMs(
  phase: PomodoroPhase,
  durations: PomodoroDurations,
): number {
  const minutes =
    phase === "focus" ? durations.focusMinutes : durations.breakMinutes;
  if (!Number.isSafeInteger(minutes) || minutes <= 0) {
    throw new RangeError("Pomodoro duration must be a positive whole number.");
  }
  return minutes * 60_000;
}

export function nextPomodoroPhase(phase: PomodoroPhase): PomodoroPhase {
  return phase === "focus" ? "break" : "focus";
}

export function remainingFromDeadline(
  deadlineMs: number,
  nowMs: number,
): number {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) {
    throw new RangeError("Timer timestamps must be finite.");
  }
  return Math.max(0, deadlineMs - nowMs);
}

export function resolvePomodoroTick(
  deadlineMs: number,
  nowMs: number,
  phase: PomodoroPhase,
  durations: PomodoroDurations,
): PomodoroTickResult {
  const remainingMs = remainingFromDeadline(deadlineMs, nowMs);
  if (remainingMs > 0) {
    return {
      completed: false,
      remainingMs,
      nextPhase: phase,
      nextDurationMs: pomodoroDurationMs(phase, durations),
    };
  }

  const nextPhase = nextPomodoroPhase(phase);
  return {
    completed: true,
    remainingMs: 0,
    nextPhase,
    nextDurationMs: pomodoroDurationMs(nextPhase, durations),
  };
}

export function formatPomodoroTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function wallClockNow(): number {
  return Date.now();
}

export default function PomodoroTimer() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [focusInput, setFocusInput] = useState("25");
  const [breakInput, setBreakInput] = useState("5");
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [remainingMs, setRemainingMs] = useState(
    DEFAULT_POMODORO_DURATIONS.focusMinutes * 60_000,
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedPhase, setCompletedPhase] = useState<PomodoroPhase | null>(
    null,
  );
  const [wasStopped, setWasStopped] = useState(false);

  const deadlineRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const completionLockRef = useRef(false);
  const lastToggleAtRef = useRef(Number.NEGATIVE_INFINITY);
  const phaseRef = useRef<PomodoroPhase>(phase);
  const durationsRef = useRef<PomodoroDurations>(DEFAULT_POMODORO_DURATIONS);
  const soundEnabledRef = useRef(soundEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const focusMinutes = parsePomodoroMinutes(focusInput, "focus");
  const breakMinutes = parsePomodoroMinutes(breakInput, "break");
  const durationsAreValid = focusMinutes !== null && breakMinutes !== null;
  const durations: PomodoroDurations | null = durationsAreValid
    ? { focusMinutes, breakMinutes }
    : null;

  const clearTicker = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopTone = useCallback(() => {
    const oscillator = oscillatorRef.current;
    const gain = gainRef.current;
    oscillatorRef.current = null;
    gainRef.current = null;

    if (oscillator) {
      oscillator.onended = null;
      try {
        oscillator.stop();
      } catch {
        // It may already have stopped.
      }
      try {
        oscillator.disconnect();
      } catch {
        // It may already be disconnected.
      }
    }
    if (gain) {
      try {
        gain.disconnect();
      } catch {
        // It may already be disconnected.
      }
    }
  }, []);

  const disposeAudio = useCallback(() => {
    stopTone();
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }
  }, [stopTone]);

  const prepareAudio = useCallback(() => {
    if (!soundEnabledRef.current || typeof window === "undefined") return;

    const current = audioContextRef.current;
    if (current && current.state !== "closed") {
      if (current.state === "suspended") {
        void current.resume().catch(() => {
          if (audioContextRef.current === current) disposeAudio();
        });
      }
      return;
    }

    const AudioContextConstructor =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;
    if (!AudioContextConstructor) return;

    try {
      const context = new AudioContextConstructor();
      audioContextRef.current = context;
      if (context.state === "suspended") {
        void context.resume().catch(() => {
          if (audioContextRef.current === context) disposeAudio();
        });
      }
    } catch {
      audioContextRef.current = null;
    }
  }, [disposeAudio]);

  const playCompletionTone = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") {
      disposeAudio();
      return;
    }

    stopTone();
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillatorRef.current = oscillator;
      gainRef.current = gain;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(620, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.22);
      oscillator.onended = () => {
        try {
          oscillator.disconnect();
          gain.disconnect();
        } catch {
          // Reset or unmount may have disconnected the nodes first.
        }
        if (oscillatorRef.current === oscillator) oscillatorRef.current = null;
        if (gainRef.current === gain) gainRef.current = null;
        if (audioContextRef.current === context && !runningRef.current) {
          audioContextRef.current = null;
          void context.close().catch(() => undefined);
        }
      };
    } catch {
      disposeAudio();
    }
  }, [disposeAudio, stopTone]);

  const finishCurrentPhase = useCallback(() => {
    if (!runningRef.current || completionLockRef.current) return;

    completionLockRef.current = true;
    const finishedPhase = phaseRef.current;
    const nextPhase = nextPomodoroPhase(finishedPhase);
    const nextDuration = pomodoroDurationMs(nextPhase, durationsRef.current);

    runningRef.current = false;
    deadlineRef.current = null;
    clearTicker();
    phaseRef.current = nextPhase;
    setRemainingMs(nextDuration);
    setPhase(nextPhase);
    setCompletedPhase(finishedPhase);
    setWasStopped(false);
    setStatus("idle");

    if (soundEnabledRef.current) playCompletionTone();
    else disposeAudio();
    completionLockRef.current = false;
  }, [clearTicker, disposeAudio, playCompletionTone]);

  const tick = useCallback(() => {
    if (!runningRef.current || deadlineRef.current === null) return;

    const result = resolvePomodoroTick(
      deadlineRef.current,
      wallClockNow(),
      phaseRef.current,
      durationsRef.current,
    );
    if (result.completed) {
      finishCurrentPhase();
      return;
    }
    setRemainingMs(result.remainingMs);
  }, [finishCurrentPhase]);

  useEffect(() => {
    if (status !== "running") return;

    clearTicker();
    intervalRef.current = window.setInterval(tick, 250);
    const resync = () => tick();
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("focus", resync);
    tick();

    return () => {
      clearTicker();
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("focus", resync);
    };
  }, [clearTicker, status, tick]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const defaultTitle = document.title;
    if (status === "running") {
      const minutes = Math.floor(remainingMs / 60_000);
      const seconds = Math.floor((remainingMs % 60_000) / 1_000);
      const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      const phaseLabel =
        phase === "focus"
          ? isEn
            ? "Focus"
            : "Фокус"
          : isEn
            ? "Break"
            : "Перерыв";
      document.title = `(${timeStr}) ${phaseLabel} — UltiTools`;
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [isEn, phase, remainingMs, status]);

  useEffect(
    () => () => {
      runningRef.current = false;
      deadlineRef.current = null;
      clearTicker();
      disposeAudio();
    },
    [clearTicker, disposeAudio],
  );

  const setTimerPhase = (nextPhase: PomodoroPhase) => {
    if (runningRef.current || nextPhase === phase || !durations) return;

    disposeAudio();
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    setRemainingMs(pomodoroDurationMs(nextPhase, durations));
    setCompletedPhase(null);
    setWasStopped(false);
  };

  const toggleTimer = (event: MouseEvent<HTMLButtonElement>) => {
    const actionTime = event.timeStamp;
    if (actionTime - lastToggleAtRef.current < 250) return;
    lastToggleAtRef.current = actionTime;

    if (runningRef.current) {
      const deadline = deadlineRef.current;
      const nextRemaining =
        deadline === null
          ? remainingMs
          : remainingFromDeadline(deadline, wallClockNow());
      if (nextRemaining <= 0) {
        finishCurrentPhase();
        return;
      }

      runningRef.current = false;
      clearTicker();
      deadlineRef.current = null;
      setRemainingMs(nextRemaining);
      setStatus("idle");
      setCompletedPhase(null);
      setWasStopped(true);
      disposeAudio();
      return;
    }

    if (!durations) return;
    const fullDuration = pomodoroDurationMs(phase, durations);
    const durationToRun = remainingMs > 0 ? remainingMs : fullDuration;
    completionLockRef.current = false;
    runningRef.current = true;
    deadlineRef.current = wallClockNow() + durationToRun;
    setRemainingMs(durationToRun);
    setCompletedPhase(null);
    setWasStopped(false);
    setStatus("running");
    if (soundEnabled) {
      // A completion tone may still be inside its 220 ms envelope when the
      // user starts the next phase. Detach that tone before reusing its
      // context so its onended callback cannot close the new run's audio.
      stopTone();
      prepareAudio();
    }
  };

  const updateDuration = (nextValue: string, targetPhase: PomodoroPhase) => {
    if (targetPhase === "focus") setFocusInput(nextValue);
    else setBreakInput(nextValue);
    setCompletedPhase(null);
    if (targetPhase === phase) setWasStopped(false);

    const parsed = parsePomodoroMinutes(nextValue, targetPhase);
    const nextFocus = targetPhase === "focus" ? parsed : focusMinutes;
    const nextBreak = targetPhase === "break" ? parsed : breakMinutes;
    if (nextFocus !== null && nextBreak !== null) {
      durationsRef.current = {
        focusMinutes: nextFocus,
        breakMinutes: nextBreak,
      };
    }
    if (runningRef.current || targetPhase !== phase) return;
    if (parsed !== null) setRemainingMs(parsed * 60_000);
  };

  const phaseLabel = (value: PomodoroPhase) =>
    value === "focus" ? (isEn ? "Focus" : "Фокус") : isEn ? "Break" : "Перерыв";

  const statusDescription = completedPhase
    ? isEn
      ? `${phaseLabel(completedPhase)} finished. ${phaseLabel(phase)} is ready.`
      : `${phaseLabel(completedPhase)} завершён. Этап «${phaseLabel(phase)}» готов.`
    : status === "running"
      ? isEn
        ? "Running from an absolute deadline; returning to this tab resyncs the display."
        : "Отсчёт идёт от абсолютного времени; при возврате во вкладку показания синхронизируются."
      : wasStopped
        ? isEn
          ? "Stopped. Start continues from the displayed time."
          : "Остановлено. Следующий запуск продолжит с показанного времени."
        : isEn
          ? "Ready to start."
          : "Готово к запуску.";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="p-4 sm:p-5">
        <div
          className="grid grid-cols-2 gap-2"
          role="group"
          aria-label={isEn ? "Timer phase" : "Этап таймера"}
        >
          {(["focus", "break"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={phase === value}
              disabled={status === "running" || !durationsAreValid}
              onClick={() => setTimerPhase(value)}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                phase === value
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
              )}
            >
              {phaseLabel(value)}
            </button>
          ))}
        </div>

        <ToolResult
          className="mt-5"
          status={
            completedPhase
              ? "success"
              : status === "running"
                ? "loading"
                : "idle"
          }
          title={
            isEn
              ? `${phaseLabel(phase)} interval`
              : `Этап «${phaseLabel(phase)}»`
          }
          description={statusDescription}
          contentClassName="text-center"
        >
          <p className="py-5 font-mono text-6xl font-bold tracking-tight text-[var(--color-text)] tabular-nums sm:text-7xl">
            {formatPomodoroTime(remainingMs)}
          </p>
        </ToolResult>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={!durationsAreValid}
          onClick={toggleTimer}
          leadingIcon={
            status === "running" ? (
              <Stop size={20} weight="fill" aria-hidden="true" />
            ) : (
              <Play size={20} weight="fill" aria-hidden="true" />
            )
          }
        >
          {status === "running"
            ? isEn
              ? "Stop"
              : "Остановить"
            : isEn
              ? "Start"
              : "Запустить"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Interval settings" : "Настройки интервалов"}
          description={
            isEn
              ? `${focusInput} min focus · ${breakInput} min break · ${soundEnabled ? "quiet sound" : "silent"}`
              : `${focusInput} мин фокус · ${breakInput} мин перерыв · ${soundEnabled ? "тихий сигнал" : "без звука"}`
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pomodoro-focus-minutes">
                {isEn ? "Focus, minutes" : "Фокус, минуты"}
              </Label>
              <Input
                id="pomodoro-focus-minutes"
                type="number"
                inputMode="numeric"
                min={POMODORO_LIMITS.minimumFocusMinutes}
                max={POMODORO_LIMITS.maximumFocusMinutes}
                step={1}
                value={focusInput}
                disabled={status === "running"}
                onChange={(event) =>
                  updateDuration(event.target.value, "focus")
                }
                className={cn(
                  "mt-2 min-h-11 font-mono",
                  focusMinutes === null
                    ? "border-[var(--color-danger)]/60"
                    : undefined,
                )}
                aria-invalid={focusMinutes === null}
                aria-describedby="pomodoro-focus-hint"
              />
              <p
                id="pomodoro-focus-hint"
                className={cn(
                  "mt-1.5 text-xs",
                  focusMinutes === null
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {isEn
                  ? "Whole minutes from 1 to 120."
                  : "От 1 до 120 целых минут."}
              </p>
            </div>

            <div>
              <Label htmlFor="pomodoro-break-minutes">
                {isEn ? "Break, minutes" : "Перерыв, минуты"}
              </Label>
              <Input
                id="pomodoro-break-minutes"
                type="number"
                inputMode="numeric"
                min={POMODORO_LIMITS.minimumBreakMinutes}
                max={POMODORO_LIMITS.maximumBreakMinutes}
                step={1}
                value={breakInput}
                disabled={status === "running"}
                onChange={(event) =>
                  updateDuration(event.target.value, "break")
                }
                className={cn(
                  "mt-2 min-h-11 font-mono",
                  breakMinutes === null
                    ? "border-[var(--color-danger)]/60"
                    : undefined,
                )}
                aria-invalid={breakMinutes === null}
                aria-describedby="pomodoro-break-hint"
              />
              <p
                id="pomodoro-break-hint"
                className={cn(
                  "mt-1.5 text-xs",
                  breakMinutes === null
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {isEn
                  ? "Whole minutes from 1 to 60."
                  : "От 1 до 60 целых минут."}
              </p>
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(event) => {
                const nextEnabled = event.target.checked;
                setSoundEnabled(nextEnabled);
                soundEnabledRef.current = nextEnabled;
                if (nextEnabled && runningRef.current) prepareAudio();
                if (!nextEnabled) disposeAudio();
              }}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
            <span>
              <span className="block font-semibold">
                {isEn ? "Quiet completion sound" : "Тихий сигнал завершения"}
              </span>
              <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "Prepared only after Start; browser audio policy may keep it silent."
                  : "Подготавливается только после запуска; политика браузера может оставить сигнал беззвучным."}
              </span>
            </span>
          </label>
        </AdvancedSettings>
      </Card>
    </div>
  );
}
