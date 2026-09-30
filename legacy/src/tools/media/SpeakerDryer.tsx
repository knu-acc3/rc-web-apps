"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Stop } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const SPEAKER_DRYER_LIMITS = {
  minimumFrequencyHz: 100,
  maximumFrequencyHz: 250,
  minimumDurationSeconds: 5,
  maximumDurationSeconds: 60,
  minimumVolumePercent: 5,
  maximumVolumePercent: 25,
  fadeInSeconds: 0.35,
  fadeOutSeconds: 0.45,
} as const;

type ToneStatus = "ready" | "running" | "finished";

interface ActiveTone {
  context: AudioContext;
  oscillator: OscillatorNode;
  gain: GainNode;
  endTime: number;
}

type AudioContextWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

const AUDIO_CONTEXT_RESUME_TIMEOUT_MS = 4_000;

export function getRemainingSeconds(
  deadlineSeconds: number,
  currentSeconds: number,
): number {
  return Math.max(0, Math.ceil(deadlineSeconds - currentSeconds));
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as AudioContextWindow).webkitAudioContext ??
    null
  );
}

function resumeAudioContextWithTimeout(
  context: AudioContext,
  signal: AbortSignal,
): Promise<void> {
  if (context.state === "running") return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | null = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      signal.removeEventListener("abort", handleAbort);
    };
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const handleAbort = () => {
      settle(() => reject(new Error("Audio context resume was cancelled.")));
    };

    signal.addEventListener("abort", handleAbort, { once: true });
    if (signal.aborted) {
      handleAbort();
      return;
    }

    timeoutId = window.setTimeout(() => {
      settle(() => reject(new Error("Audio context resume timed out.")));
    }, AUDIO_CONTEXT_RESUME_TIMEOUT_MS);

    try {
      void context.resume().then(
        () => settle(() => resolve()),
        (error: unknown) => settle(() => reject(error)),
      );
    } catch (error) {
      settle(() => reject(error));
    }
  });
}

function releaseTone(tone: ActiveTone) {
  tone.oscillator.onended = null;
  try {
    tone.oscillator.stop();
  } catch {
    // The oscillator may already have reached its scheduled stop time.
  }
  tone.oscillator.disconnect();
  tone.gain.disconnect();
  if (tone.context.state !== "closed") {
    void tone.context.close().catch(() => undefined);
  }
}

export default function SpeakerDryer() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [frequencyValue, setFrequencyValue] = useState("165");
  const [durationValue, setDurationValue] = useState("20");
  const [volumePercent, setVolumePercent] = useState(10);
  const [remainingSeconds, setRemainingSeconds] = useState(20);
  const [status, setStatus] = useState<ToneStatus>("ready");
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");

  const activeToneRef = useRef<ActiveTone | null>(null);
  const pendingContextRef = useRef<AudioContext | null>(null);
  const resumeAbortRef = useRef<AbortController | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const deadlineTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const durationSecondsRef = useRef(20);

  const clearRunTimers = useCallback(() => {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (deadlineTimerRef.current !== null) {
      window.clearTimeout(deadlineTimerRef.current);
      deadlineTimerRef.current = null;
    }
  }, []);

  const finishTone = useCallback(
    (reason: "manual" | "complete" | "unmount") => {
      resumeAbortRef.current?.abort();
      resumeAbortRef.current = null;
      startingRef.current = false;
      runningRef.current = false;
      clearRunTimers();

      const pendingContext = pendingContextRef.current;
      pendingContextRef.current = null;
      if (pendingContext && pendingContext.state !== "closed") {
        void pendingContext.close().catch(() => undefined);
      }

      if (reason === "unmount" && cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }

      const tone = activeToneRef.current;
      if (!tone) {
        if (reason !== "unmount" && mountedRef.current) {
          setIsStarting(false);
          setIsRunning(false);
          setIsStopping(false);
          setStatus(reason === "complete" ? "finished" : "ready");
          setRemainingSeconds(
            reason === "complete" ? 0 : durationSecondsRef.current,
          );
        }
        return;
      }

      if (reason === "manual" && tone.context.state === "running") {
        const now = tone.context.currentTime;
        setIsStopping(true);
        try {
          tone.gain.gain.cancelAndHoldAtTime(now);
        } catch {
          tone.gain.gain.cancelScheduledValues(now);
          tone.gain.gain.setValueAtTime(
            Math.max(0.0001, tone.gain.gain.value),
            now,
          );
        }
        tone.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
        try {
          tone.oscillator.stop(now + 0.2);
        } catch {
          // The automatic stop may already be in progress.
        }

        cleanupTimerRef.current = window.setTimeout(() => {
          cleanupTimerRef.current = null;
          if (activeToneRef.current === tone) activeToneRef.current = null;
          releaseTone(tone);
          if (mountedRef.current) {
            setIsStarting(false);
            setIsRunning(false);
            setIsStopping(false);
            setStatus("ready");
            setRemainingSeconds(durationSecondsRef.current);
          }
        }, 240);
        return;
      }

      activeToneRef.current = null;
      releaseTone(tone);
      if (reason !== "unmount" && mountedRef.current) {
        setIsStarting(false);
        setIsRunning(false);
        setIsStopping(false);
        setStatus(reason === "complete" ? "finished" : "ready");
        setRemainingSeconds(
          reason === "complete" ? 0 : durationSecondsRef.current,
        );
      }
    },
    [clearRunTimers],
  );

  const startTone = async () => {
    if (startingRef.current || runningRef.current) return;

    const frequencyHz = Number(frequencyValue);
    const durationSeconds = Number(durationValue);

    if (
      !Number.isInteger(frequencyHz) ||
      frequencyHz < SPEAKER_DRYER_LIMITS.minimumFrequencyHz ||
      frequencyHz > SPEAKER_DRYER_LIMITS.maximumFrequencyHz
    ) {
      setError(
        isEn
          ? "Enter a whole frequency from 100 to 250 Hz."
          : "Укажите целую частоту от 100 до 250 Гц.",
      );
      return;
    }
    if (
      !Number.isInteger(durationSeconds) ||
      durationSeconds < SPEAKER_DRYER_LIMITS.minimumDurationSeconds ||
      durationSeconds > SPEAKER_DRYER_LIMITS.maximumDurationSeconds
    ) {
      setError(
        isEn
          ? "Enter a whole duration from 5 to 60 seconds."
          : "Укажите целую длительность от 5 до 60 секунд.",
      );
      return;
    }

    const AudioContextConstructor = getAudioContextConstructor();
    if (!AudioContextConstructor) {
      setError(
        isEn
          ? "Web Audio is not supported in this browser."
          : "Этот браузер не поддерживает Web Audio.",
      );
      return;
    }

    startingRef.current = true;
    setIsStarting(true);
    let context: AudioContext | null = null;
    let tone: ActiveTone | null = null;

    try {
      const startedContext = new AudioContextConstructor();
      context = startedContext;
      pendingContextRef.current = startedContext;
      const resumeController = new AbortController();
      resumeAbortRef.current = resumeController;
      if (startedContext.state !== "running") {
        await resumeAudioContextWithTimeout(
          startedContext,
          resumeController.signal,
        );
      }
      if (resumeAbortRef.current === resumeController) {
        resumeAbortRef.current = null;
      }
      if (!mountedRef.current || pendingContextRef.current !== startedContext) {
        if (startedContext.state !== "closed") await startedContext.close();
        return;
      }
      if (startedContext.state !== "running") {
        throw new Error("Audio context did not start");
      }

      const oscillator = startedContext.createOscillator();
      const gain = startedContext.createGain();
      const startTime = startedContext.currentTime + 0.03;
      const endTime = startTime + durationSeconds;
      const targetGain = volumePercent / 100;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequencyHz, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(
        targetGain,
        startTime + SPEAKER_DRYER_LIMITS.fadeInSeconds,
      );
      gain.gain.setValueAtTime(
        targetGain,
        endTime - SPEAKER_DRYER_LIMITS.fadeOutSeconds,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.02);

      const startedTone: ActiveTone = {
        context: startedContext,
        oscillator,
        gain,
        endTime,
      };
      tone = startedTone;
      pendingContextRef.current = null;
      activeToneRef.current = startedTone;
      durationSecondsRef.current = durationSeconds;
      runningRef.current = true;
      setError("");
      setStatus("running");
      setIsRunning(true);
      setIsStopping(false);
      setRemainingSeconds(durationSeconds);

      const updateCountdown = () => {
        if (!runningRef.current || activeToneRef.current !== startedTone)
          return;
        if (mountedRef.current) {
          setRemainingSeconds(
            getRemainingSeconds(
              startedTone.endTime,
              startedTone.context.currentTime,
            ),
          );
        }
        countdownTimerRef.current = window.setTimeout(updateCountdown, 100);
      };
      updateCountdown();

      const deadlineDelayMs = Math.max(
        0,
        (endTime - startedContext.currentTime) * 1000 + 80,
      );
      deadlineTimerRef.current = window.setTimeout(
        () => finishTone("complete"),
        deadlineDelayMs,
      );
    } catch {
      clearRunTimers();
      resumeAbortRef.current?.abort();
      resumeAbortRef.current = null;
      if (tone) releaseTone(tone);
      else if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
      if (pendingContextRef.current === context) {
        pendingContextRef.current = null;
      }
      activeToneRef.current = null;
      runningRef.current = false;
      if (mountedRef.current) {
        setIsRunning(false);
        setIsStopping(false);
        setError(
          isEn
            ? "The browser could not start audio. Check its sound permissions."
            : "Браузер не смог запустить звук. Проверьте разрешение на воспроизведение.",
        );
      }
    } finally {
      if (pendingContextRef.current === context) {
        pendingContextRef.current = null;
      }
      startingRef.current = false;
      if (mountedRef.current) setIsStarting(false);
    }
  };

  const toggle = () => {
    if (startingRef.current) return;
    if (runningRef.current) {
      finishTone("manual");
      return;
    }
    void startTone();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      finishTone("unmount");
    };
  }, [finishTone]);

  const controlsDisabled = isRunning || isStopping || isStarting;
  const frequencyHz = Number(frequencyValue) || 0;

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div
          role="note"
          className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-surface-muted)] p-3 text-sm font-semibold leading-6 text-[var(--color-text)]"
        >
          {isEn
            ? "Remove headphones. Start with low device volume."
            : "Снимите наушники. Начните с низкой громкости устройства."}
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          tone={isRunning ? "danger" : "primary"}
          loading={isStarting || isStopping}
          loadingLabel={
            isStarting
              ? isEn
                ? "Starting…"
                : "Запускаем…"
              : isEn
                ? "Stopping…"
                : "Останавливаем…"
          }
          leadingIcon={
            isRunning ? (
              <Stop size={20} weight="fill" aria-hidden="true" />
            ) : (
              <Play size={20} weight="fill" aria-hidden="true" />
            )
          }
          aria-pressed={isRunning}
          onClick={toggle}
        >
          {isRunning
            ? isEn
              ? "Stop tone"
              : "Остановить тон"
            : isEn
              ? "Start tone"
              : "Запустить тон"}
        </ToolPrimaryAction>

        {error ? (
          <ToolResult
            status="error"
            title={isEn ? "Audio did not start" : "Звук не запущен"}
            description={error}
            className="mt-5"
          />
        ) : (
          <ToolResult
            status={
              status === "running" || status === "finished" ? "success" : "idle"
            }
            title={
              status === "running"
                ? isEn
                  ? "Tone is playing"
                  : "Тон воспроизводится"
                : status === "finished"
                  ? isEn
                    ? "Cycle ended"
                    : "Цикл завершён"
                  : isEn
                    ? "Ready"
                    : "Готово к запуску"
            }
            description={
              status === "running"
                ? isEn
                  ? `${frequencyHz} Hz sine tone`
                  : `Синусоидальный тон ${frequencyHz} Гц`
                : isEn
                  ? "The tone starts only after you press Start."
                  : "Тон включится только после нажатия «Запустить»."
            }
            className="mt-5"
          >
            <p className="flex items-baseline gap-2 text-[var(--color-text)]">
              <span className="text-5xl font-black tabular-nums">
                {remainingSeconds}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-muted)]">
                {isEn ? "seconds left" : "секунд осталось"}
              </span>
            </p>
            <div className="mt-4 space-y-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
              <p>
                {isEn
                  ? "A low tone may help displace small droplets from a speaker grille, but it does not guarantee drying or repair."
                  : "Низкий тон может помочь вытеснить небольшие капли из решётки динамика, но не гарантирует сушку или ремонт."}
              </p>
              <p>
                {isEn
                  ? "Follow the device manufacturer’s instructions. Stop if you hear distortion or the device heats up."
                  : "Следуйте инструкции производителя устройства. Остановите тон при искажении звука или нагреве."}
              </p>
            </div>
          </ToolResult>
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Frequency, duration and limited output level"
              : "Частота, длительность и ограниченный уровень"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="speaker-dryer-frequency">
                {isEn ? "Frequency, Hz" : "Частота, Гц"}
              </Label>
              <Input
                id="speaker-dryer-frequency"
                type="number"
                min={SPEAKER_DRYER_LIMITS.minimumFrequencyHz}
                max={SPEAKER_DRYER_LIMITS.maximumFrequencyHz}
                step="1"
                inputMode="numeric"
                value={frequencyValue}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setFrequencyValue(event.target.value);
                  setStatus("ready");
                  setError("");
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "100–250 Hz; default 165 Hz."
                  : "100–250 Гц; по умолчанию 165 Гц."}
              </p>
            </div>

            <div>
              <Label htmlFor="speaker-dryer-duration">
                {isEn ? "Duration, seconds" : "Длительность, секунд"}
              </Label>
              <Input
                id="speaker-dryer-duration"
                type="number"
                min={SPEAKER_DRYER_LIMITS.minimumDurationSeconds}
                max={SPEAKER_DRYER_LIMITS.maximumDurationSeconds}
                step="1"
                inputMode="numeric"
                value={durationValue}
                disabled={controlsDisabled}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const parsedValue = Number(nextValue);
                  setDurationValue(nextValue);
                  setRemainingSeconds(
                    Number.isFinite(parsedValue) ? parsedValue : 0,
                  );
                  setStatus("ready");
                  setError("");
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn
                  ? "5–60 seconds; default 20."
                  : "5–60 секунд; по умолчанию 20."}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="speaker-dryer-volume">
              {isEn
                ? `Output level: ${volumePercent}% (limited)`
                : `Уровень сигнала: ${volumePercent}% (ограничен)`}
            </Label>
            <input
              id="speaker-dryer-volume"
              type="range"
              min={SPEAKER_DRYER_LIMITS.minimumVolumePercent}
              max={SPEAKER_DRYER_LIMITS.maximumVolumePercent}
              step="1"
              value={volumePercent}
              disabled={controlsDisabled}
              onChange={(event) => setVolumePercent(Number(event.target.value))}
              className="mt-1.5 min-h-11 w-full accent-[var(--color-primary)]"
            />
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? "The in-tool level is capped at 25%; the device’s system volume still matters."
                : "Уровень внутри инструмента ограничен 25%; системная громкость устройства всё равно влияет на звук."}
            </p>
          </div>
        </AdvancedSettings>
      </section>
    </div>
  );
}
