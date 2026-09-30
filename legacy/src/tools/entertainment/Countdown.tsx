"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  BellSimple,
  BellSimpleSlash,
  Pause,
  Play,
  Timer,
  XCircle,
} from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

type TimerStatus = "idle" | "running" | "paused" | "finished";

interface DurationSuccess {
  ok: true;
  totalSeconds: number;
}

interface DurationError {
  ok: false;
  messageEn: string;
  messageRu: string;
}

type DurationResult = DurationSuccess | DurationError;

const MAX_DURATION_SECONDS = 24 * 60 * 60;

function parseOptionalInteger(value: string) {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseDuration(
  minutesInput: string,
  secondsInput: string,
): DurationResult {
  const minutes = parseOptionalInteger(minutesInput);
  const seconds = parseOptionalInteger(secondsInput);

  if (minutes === null || seconds === null) {
    return {
      ok: false,
      messageEn: "Minutes and seconds must be whole numbers.",
      messageRu: "Минуты и секунды должны быть целыми числами.",
    };
  }
  if (minutes < 0 || minutes > 1440) {
    return {
      ok: false,
      messageEn: "Minutes must be from 0 to 1440.",
      messageRu: "Количество минут должно быть от 0 до 1440.",
    };
  }
  if (seconds < 0 || seconds > 59) {
    return {
      ok: false,
      messageEn: "Seconds must be from 0 to 59.",
      messageRu: "Количество секунд должно быть от 0 до 59.",
    };
  }

  const totalSeconds = minutes * 60 + seconds;
  if (totalSeconds === 0) {
    return {
      ok: false,
      messageEn: "Set a duration greater than 0:00.",
      messageRu: "Укажите длительность больше 0:00.",
    };
  }
  if (totalSeconds > MAX_DURATION_SECONDS) {
    return {
      ok: false,
      messageEn: "The maximum countdown is 1440:00.",
      messageRu: "Максимальная длительность отсчёта — 1440:00.",
    };
  }

  return { ok: true, totalSeconds };
}

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function Countdown() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [label, setLabel] = useState("");
  const [activeLabel, setActiveLabel] = useState("");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingMs, setRemainingMs] = useState(0);
  const [error, setError] = useState<DurationError | null>(null);

  const deadlineRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

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
      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have stopped.
      }
      try {
        oscillator.disconnect();
      } catch {
        // Already disconnected.
      }
    }
    if (gain) {
      try {
        gain.disconnect();
      } catch {
        // Already disconnected.
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
    if (typeof window === "undefined") return;

    const current = audioContextRef.current;
    if (current && current.state !== "closed") {
      if (current.state === "suspended") {
        void current.resume().catch(() => undefined);
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
        void context.resume().catch(() => undefined);
      }
    } catch {
      audioContextRef.current = null;
    }
  }, []);

  const playCompletionTone = useCallback(() => {
    const context = audioContextRef.current;
    if (!context || context.state !== "running") {
      disposeAudio();
      return;
    }

    stopTone();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillatorRef.current = oscillator;
    gainRef.current = gain;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(640, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
    oscillator.onended = () => {
      try {
        oscillator.disconnect();
        gain.disconnect();
      } catch {
        // The nodes may have been cleared by reset or unmount.
      }
      if (oscillatorRef.current === oscillator) oscillatorRef.current = null;
      if (gainRef.current === gain) gainRef.current = null;
      if (audioContextRef.current === context) {
        audioContextRef.current = null;
        void context.close().catch(() => undefined);
      }
    };
  }, [disposeAudio, stopTone]);

  useEffect(() => {
    if (status !== "running") return;

    const tick = () => {
      const nextRemaining = Math.max(
        0,
        deadlineRef.current - performance.now(),
      );
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        clearTicker();
        setStatus("finished");
        if (soundEnabled) {
          playCompletionTone();
        } else {
          disposeAudio();
        }
      }
    };

    intervalRef.current = window.setInterval(tick, 100);
    tick();
    return clearTicker;
  }, [clearTicker, disposeAudio, playCompletionTone, soundEnabled, status]);

  useEffect(
    () => () => {
      clearTicker();
      disposeAudio();
    },
    [clearTicker, disposeAudio],
  );

  const isActive = status === "running" || status === "paused";
  const hasDurationInput = Boolean(minutes.trim() || seconds.trim());

  const startCountdown = () => {
    const parsed = parseDuration(minutes, seconds);
    if (!parsed.ok) {
      if (status === "finished") {
        setRemainingMs(0);
        setActiveLabel("");
        setStatus("idle");
      }
      setError(parsed);
      return;
    }

    clearTicker();
    disposeAudio();
    if (soundEnabled) prepareAudio();

    const durationMs = parsed.totalSeconds * 1000;
    deadlineRef.current = performance.now() + durationMs;
    setRemainingMs(durationMs);
    setActiveLabel(label.trim());
    setError(null);
    setStatus("running");
  };

  const pauseCountdown = () => {
    clearTicker();
    const nextRemaining = Math.max(0, deadlineRef.current - performance.now());
    setRemainingMs(nextRemaining);
    if (nextRemaining <= 0) {
      setStatus("finished");
      if (soundEnabled) playCompletionTone();
      else disposeAudio();
      return;
    }
    setStatus("paused");
  };

  const resumeCountdown = () => {
    if (remainingMs <= 0) return;
    if (soundEnabled) prepareAudio();
    deadlineRef.current = performance.now() + remainingMs;
    setStatus("running");
  };

  const resetCountdown = () => {
    clearTicker();
    disposeAudio();
    deadlineRef.current = 0;
    setRemainingMs(0);
    setActiveLabel("");
    setError(null);
    setStatus("idle");
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Timer size={23} weight="bold" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold">
              {isEn ? "Countdown timer" : "Таймер обратного отсчёта"}
            </h2>
            <p className="mt-0.5 text-sm leading-snug text-[var(--color-text-muted)]">
              {isEn
                ? "Set minutes and seconds, then start."
                : "Укажите минуты и секунды, затем запустите отсчёт."}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="countdown-minutes">
              {isEn ? "Minutes" : "Минуты"}
            </Label>
            <Input
              id="countdown-minutes"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              min={0}
              max={1440}
              step={1}
              value={minutes}
              disabled={isActive}
              onChange={(event) => {
                setMinutes(event.target.value);
                setError(null);
              }}
              placeholder="0"
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
          <div>
            <Label htmlFor="countdown-seconds">
              {isEn ? "Seconds" : "Секунды"}
            </Label>
            <Input
              id="countdown-seconds"
              type="number"
              inputMode="numeric"
              autoComplete="off"
              min={0}
              max={59}
              step={1}
              value={seconds}
              disabled={isActive}
              onChange={(event) => {
                setSeconds(event.target.value);
                setError(null);
              }}
              placeholder="00"
              className="mt-2 h-12 font-mono text-base"
            />
          </div>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          disabled={isActive || !hasDurationInput}
          onClick={startCountdown}
          leadingIcon={<Play size={20} weight="fill" aria-hidden="true" />}
        >
          {status === "finished"
            ? isEn
              ? "Start again"
              : "Запустить снова"
            : isEn
              ? "Start countdown"
              : "Запустить отсчёт"}
        </ToolPrimaryAction>

        <AdvancedSettings
          className="mt-4"
          title={isEn ? "Signal and label" : "Сигнал и подпись"}
          description={
            isEn
              ? `${soundEnabled ? "Short signal" : "Silent"} · ${label.trim() || "No label"}`
              : `${soundEnabled ? "Короткий сигнал" : "Без звука"} · ${label.trim() || "Без подписи"}`
          }
        >
          <button
            type="button"
            aria-pressed={soundEnabled}
            onClick={() => {
              const nextValue = !soundEnabled;
              setSoundEnabled(nextValue);
              if (nextValue && isActive) prepareAudio();
              if (!nextValue) disposeAudio();
            }}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 text-left text-sm font-semibold transition-colors",
              soundEnabled
                ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]",
            )}
          >
            {soundEnabled ? (
              <BellSimple size={20} weight="fill" aria-hidden="true" />
            ) : (
              <BellSimpleSlash size={20} aria-hidden="true" />
            )}
            {soundEnabled
              ? isEn
                ? "Short signal enabled"
                : "Короткий сигнал включён"
              : isEn
                ? "Signal disabled"
                : "Сигнал выключен"}
          </button>

          <div className="mt-4">
            <Label htmlFor="countdown-label">
              {isEn ? "Optional label" : "Необязательная подпись"}
            </Label>
            <Input
              id="countdown-label"
              value={label}
              maxLength={60}
              autoComplete="off"
              onChange={(event) => setLabel(event.target.value)}
              placeholder={isEn ? "Timer label" : "Подпись таймера"}
              className="mt-2 h-11"
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {isEn
              ? "The quiet 0.25-second tone is prepared only after you press Start or Resume."
              : "Тихий сигнал длительностью 0,25 секунды подготавливается только после нажатия «Запустить» или «Продолжить»."}
          </p>
        </AdvancedSettings>

        {error ? (
          <div
            className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-3"
            role="alert"
            aria-live="polite"
          >
            <XCircle
              size={22}
              weight="fill"
              className="shrink-0 text-[var(--color-danger)]"
              aria-hidden="true"
            />
            <p className="text-sm text-[var(--color-text)]">
              {isEn ? error.messageEn : error.messageRu}
            </p>
          </div>
        ) : null}
      </Card>

      {status !== "idle" ? (
        <Card
          className="p-5 text-center sm:p-6"
          aria-live="polite"
          aria-labelledby="countdown-result-title"
        >
          <h2
            id="countdown-result-title"
            className="text-sm font-semibold text-[var(--color-text-muted)]"
          >
            {activeLabel ||
              (status === "finished"
                ? isEn
                  ? "Time is up"
                  : "Время вышло"
                : isEn
                  ? "Time remaining"
                  : "Осталось времени")}
          </h2>
          <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-[var(--color-primary)] sm:text-6xl">
            {formatRemaining(remainingMs)}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            {status === "running"
              ? isEn
                ? "Running"
                : "Идёт отсчёт"
              : status === "paused"
                ? isEn
                  ? "Paused"
                  : "Пауза"
                : isEn
                  ? "Finished"
                  : "Завершено"}
          </p>

          {status === "running" || status === "paused" ? (
            <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={
                  status === "running" ? pauseCountdown : resumeCountdown
                }
                className="min-h-11"
              >
                {status === "running" ? (
                  <Pause size={18} weight="fill" aria-hidden="true" />
                ) : (
                  <Play size={18} weight="fill" aria-hidden="true" />
                )}
                {status === "running"
                  ? isEn
                    ? "Pause"
                    : "Пауза"
                  : isEn
                    ? "Resume"
                    : "Продолжить"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={resetCountdown}
                className="min-h-11"
              >
                <ArrowCounterClockwise size={18} aria-hidden="true" />
                {isEn ? "Reset" : "Сбросить"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={resetCountdown}
              className="mt-5 min-h-11"
            >
              <ArrowCounterClockwise size={18} aria-hidden="true" />
              {isEn ? "Reset" : "Сбросить"}
            </Button>
          )}
        </Card>
      ) : null}
    </div>
  );
}
