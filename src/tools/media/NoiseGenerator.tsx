"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Stop } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import {
  ToolResult,
  type ToolResultStatus,
} from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const NOISE_GENERATOR_LIMITS = {
  minimumVolumePercent: 1,
  maximumVolumePercent: 30,
  maximumAutoStopSeconds: 3600,
  minimumToneFrequencyHz: 20,
  maximumToneFrequencyHz: 20000,
  bufferSeconds: 2,
  normalizedPeak: 0.9,
  fadeInSeconds: 0.25,
  fadeOutSeconds: 0.25,
  manualFadeOutSeconds: 0.15,
  resumeTimeoutMs: 4000,
} as const;

type NoiseType = "white" | "pink" | "brown" | "tone";
type PlaybackStatus =
  "ready" | "starting" | "running" | "stopping" | "finished";
type PlaybackSource = AudioBufferSourceNode | OscillatorNode;

interface ActivePlayback {
  context: AudioContext;
  source: PlaybackSource;
  gain: GainNode;
  endTime: number | null;
}

type AudioContextWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

const SILENCE_GAIN = 0.0001;

const NOISE_LABELS: Record<NoiseType, { en: string; ru: string }> = {
  white: { en: "White noise", ru: "Белый шум" },
  pink: { en: "Pink noise", ru: "Розовый шум" },
  brown: { en: "Brown noise", ru: "Коричневый шум" },
  tone: { en: "Pure tone", ru: "Чистый тон" },
};

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
  timeoutMs = NOISE_GENERATOR_LIMITS.resumeTimeoutMs,
) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | null = null;

    function clearResumeWait() {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      signal.removeEventListener("abort", abortResume);
    }

    const resolveResume = () => {
      if (settled) return;
      settled = true;
      clearResumeWait();
      resolve();
    };
    const rejectResume = (reason: unknown) => {
      if (settled) return;
      settled = true;
      clearResumeWait();
      reject(reason);
    };
    function abortResume() {
      rejectResume(
        new DOMException("Audio context resume aborted", "AbortError"),
      );
    }

    if (signal.aborted) {
      abortResume();
      return;
    }

    signal.addEventListener("abort", abortResume, { once: true });
    timeoutId = window.setTimeout(
      () => rejectResume(new Error("Audio context resume timed out")),
      timeoutMs,
    );

    try {
      void context.resume().then(resolveResume, rejectResume);
    } catch (error) {
      rejectResume(error);
    }
  });
}

function fillWhiteNoise(samples: Float32Array) {
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }
}

function fillPinkNoise(samples: Float32Array) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    samples[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
}

function fillBrownNoise(samples: Float32Array) {
  let previous = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = (previous + 0.02 * white) / 1.02;
    samples[index] = previous * 3.5;
  }
}

export function normalizeNoiseSamples(
  samples: Float32Array,
  targetPeak = NOISE_GENERATOR_LIMITS.normalizedPeak,
) {
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    peak = Math.max(peak, Math.abs(samples[index]));
  }

  if (peak === 0) return samples;
  const safeTargetPeak = Math.min(1, Math.max(0, targetPeak));
  const scale = safeTargetPeak / peak;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= scale;
  }
  return samples;
}

function createNoiseBuffer(
  context: AudioContext,
  type: Exclude<NoiseType, "tone">,
) {
  const frameCount = Math.max(
    1,
    Math.round(context.sampleRate * NOISE_GENERATOR_LIMITS.bufferSeconds),
  );
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);

  if (type === "white") fillWhiteNoise(samples);
  else if (type === "pink") fillPinkNoise(samples);
  else fillBrownNoise(samples);

  normalizeNoiseSamples(samples);
  return buffer;
}

function createPlaybackSource(
  context: AudioContext,
  type: NoiseType,
  frequencyHz: number,
): PlaybackSource {
  if (type === "tone") {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequencyHz, context.currentTime);
    return oscillator;
  }

  const source = context.createBufferSource();
  source.buffer = createNoiseBuffer(context, type);
  source.loop = true;
  return source;
}

function releasePlayback(playback: ActivePlayback) {
  playback.source.onended = null;
  try {
    playback.source.stop();
  } catch {
    // The source may already have reached its scheduled stop time.
  }
  playback.source.disconnect();
  playback.gain.disconnect();
  if (playback.context.state !== "closed") {
    void playback.context.close().catch(() => undefined);
  }
}

export default function NoiseGenerator() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [noiseType, setNoiseType] = useState<NoiseType>("white");
  const [volumePercent, setVolumePercent] = useState(10);
  const [autoStopValue, setAutoStopValue] = useState("0");
  const [frequencyValue, setFrequencyValue] = useState("440");
  const [status, setStatus] = useState<PlaybackStatus>("ready");
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState("");

  const activePlaybackRef = useRef<ActivePlayback | null>(null);
  const pendingContextRef = useRef<AudioContext | null>(null);
  const resumeControllerRef = useRef<AbortController | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const deadlineTimerRef = useRef<number | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const runningRef = useRef(false);
  const stoppingRef = useRef(false);
  const mountedRef = useRef(true);

  const clearRunTimers = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (deadlineTimerRef.current !== null) {
      window.clearTimeout(deadlineTimerRef.current);
      deadlineTimerRef.current = null;
    }
  }, []);

  const completePlayback = useCallback(
    (playback: ActivePlayback) => {
      if (activePlaybackRef.current !== playback) return;
      clearRunTimers();
      activePlaybackRef.current = null;
      runningRef.current = false;
      stoppingRef.current = false;
      releasePlayback(playback);

      if (mountedRef.current) {
        setStatus("finished");
        setRemainingSeconds(0);
      }
    },
    [clearRunTimers],
  );

  const stopPlayback = useCallback(
    (withFade = true) => {
      const resumeController = resumeControllerRef.current;
      resumeControllerRef.current = null;
      resumeController?.abort();

      const pendingContext = pendingContextRef.current;
      pendingContextRef.current = null;
      if (pendingContext && pendingContext.state !== "closed") {
        void pendingContext.close().catch(() => undefined);
      }

      clearRunTimers();
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }

      const playback = activePlaybackRef.current;
      runningRef.current = false;

      if (!playback) {
        stoppingRef.current = false;
        if (withFade && mountedRef.current) {
          setStatus("ready");
          setRemainingSeconds(null);
        }
        return;
      }
      playback.source.onended = null;

      if (withFade && playback.context.state === "running") {
        stoppingRef.current = true;
        if (mountedRef.current) setStatus("stopping");
        const now = playback.context.currentTime;
        try {
          playback.gain.gain.cancelAndHoldAtTime(now);
        } catch {
          playback.gain.gain.cancelScheduledValues(now);
          playback.gain.gain.setValueAtTime(
            Math.max(SILENCE_GAIN, playback.gain.gain.value),
            now,
          );
        }
        playback.gain.gain.exponentialRampToValueAtTime(
          SILENCE_GAIN,
          now + NOISE_GENERATOR_LIMITS.manualFadeOutSeconds,
        );
        try {
          playback.source.stop(
            now + NOISE_GENERATOR_LIMITS.manualFadeOutSeconds + 0.02,
          );
        } catch {
          // A scheduled automatic stop may already be completing.
        }

        cleanupTimerRef.current = window.setTimeout(
          () => {
            cleanupTimerRef.current = null;
            if (activePlaybackRef.current === playback) {
              activePlaybackRef.current = null;
            }
            releasePlayback(playback);
            stoppingRef.current = false;
            if (mountedRef.current) {
              setStatus("ready");
              setRemainingSeconds(null);
            }
          },
          (NOISE_GENERATOR_LIMITS.manualFadeOutSeconds + 0.08) * 1000,
        );
        return;
      }

      activePlaybackRef.current = null;
      stoppingRef.current = false;
      releasePlayback(playback);
      if (withFade && mountedRef.current) {
        setStatus("ready");
        setRemainingSeconds(null);
      }
    },
    [clearRunTimers],
  );

  const startPlayback = async () => {
    if (
      startingRef.current ||
      runningRef.current ||
      stoppingRef.current ||
      activePlaybackRef.current
    ) {
      return;
    }

    const autoStopSeconds = Number(autoStopValue);
    const frequencyHz = Number(frequencyValue);

    if (
      autoStopValue.trim() === "" ||
      !Number.isInteger(autoStopSeconds) ||
      autoStopSeconds < 0 ||
      autoStopSeconds > NOISE_GENERATOR_LIMITS.maximumAutoStopSeconds
    ) {
      setError(
        isEn
          ? "Enter a whole auto-stop time from 0 to 3600 seconds."
          : "Укажите целое время автоостановки от 0 до 3600 секунд.",
      );
      return;
    }

    if (
      noiseType === "tone" &&
      (frequencyValue.trim() === "" ||
        !Number.isFinite(frequencyHz) ||
        frequencyHz < NOISE_GENERATOR_LIMITS.minimumToneFrequencyHz ||
        frequencyHz > NOISE_GENERATOR_LIMITS.maximumToneFrequencyHz)
    ) {
      setError(
        isEn
          ? "Enter a tone frequency from 20 to 20,000 Hz."
          : "Укажите частоту тона от 20 до 20 000 Гц.",
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
    setStatus("starting");
    setError("");
    const context = new AudioContextConstructor();
    const resumeController = new AbortController();
    pendingContextRef.current = context;
    resumeControllerRef.current = resumeController;
    let playback: ActivePlayback | null = null;

    try {
      if (context.state === "suspended") {
        await resumeAudioContextWithTimeout(context, resumeController.signal);
      }
      if (!mountedRef.current || pendingContextRef.current !== context) {
        if (context.state !== "closed") await context.close();
        return;
      }
      if (context.state !== "running") {
        throw new Error("Audio context did not start");
      }

      const source = createPlaybackSource(context, noiseType, frequencyHz);
      const gain = context.createGain();
      const startTime = context.currentTime + 0.03;
      const targetGain = volumePercent / 100;
      const endTime = autoStopSeconds > 0 ? startTime + autoStopSeconds : null;

      gain.gain.setValueAtTime(SILENCE_GAIN, startTime);
      gain.gain.exponentialRampToValueAtTime(
        targetGain,
        startTime + NOISE_GENERATOR_LIMITS.fadeInSeconds,
      );
      if (endTime !== null) {
        gain.gain.setValueAtTime(
          targetGain,
          Math.max(
            startTime + NOISE_GENERATOR_LIMITS.fadeInSeconds,
            endTime - NOISE_GENERATOR_LIMITS.fadeOutSeconds,
          ),
        );
        gain.gain.exponentialRampToValueAtTime(SILENCE_GAIN, endTime);
      }

      source.connect(gain);
      gain.connect(context.destination);
      const startedPlayback: ActivePlayback = {
        context,
        source,
        gain,
        endTime,
      };
      playback = startedPlayback;
      activePlaybackRef.current = startedPlayback;
      pendingContextRef.current = null;
      source.onended = () => completePlayback(startedPlayback);
      source.start(startTime);
      if (endTime !== null) source.stop(endTime + 0.02);

      runningRef.current = true;
      setStatus("running");
      setRemainingSeconds(endTime === null ? null : autoStopSeconds);

      if (endTime !== null) {
        const updateCountdown = () => {
          if (
            !runningRef.current ||
            activePlaybackRef.current !== startedPlayback ||
            startedPlayback.endTime === null
          ) {
            return;
          }
          if (mountedRef.current) {
            setRemainingSeconds(
              Math.max(
                0,
                Math.ceil(
                  startedPlayback.endTime - startedPlayback.context.currentTime,
                ),
              ),
            );
          }
        };
        countdownIntervalRef.current = window.setInterval(updateCountdown, 250);
        const deadlineDelayMs = Math.max(
          0,
          (endTime - context.currentTime) * 1000 + 250,
        );
        deadlineTimerRef.current = window.setTimeout(
          () => completePlayback(startedPlayback),
          deadlineDelayMs,
        );
      }
    } catch {
      if (playback) {
        if (activePlaybackRef.current === playback) {
          activePlaybackRef.current = null;
        }
        releasePlayback(playback);
      } else if (context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
      runningRef.current = false;
      if (mountedRef.current) {
        setStatus("ready");
        setRemainingSeconds(null);
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
      if (resumeControllerRef.current === resumeController) {
        resumeControllerRef.current = null;
      }
      startingRef.current = false;
    }
  };

  const togglePlayback = () => {
    if (runningRef.current) {
      stopPlayback();
      return;
    }
    if (!startingRef.current && !stoppingRef.current) void startPlayback();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      startingRef.current = false;
      stoppingRef.current = false;
      stopPlayback(false);
    };
  }, [stopPlayback]);

  const controlsDisabled =
    status === "starting" || status === "running" || status === "stopping";
  const noiseLabel = NOISE_LABELS[noiseType][isEn ? "en" : "ru"];
  let resultStatus: ToolResultStatus = "idle";
  let resultTitle = isEn ? "Ready" : "Готово к запуску";
  let resultDescription = isEn
    ? "Choose a sound and press Start."
    : "Выберите звук и нажмите «Запустить».";

  if (error) {
    resultStatus = "error";
    resultTitle = isEn ? "Audio did not start" : "Звук не запущен";
    resultDescription = error;
  } else if (status === "starting") {
    resultStatus = "loading";
    resultTitle = isEn ? "Starting audio" : "Запускаем звук";
    resultDescription = isEn
      ? "Waiting for the browser audio context."
      : "Ожидаем запуск аудиоконтекста браузера.";
  } else if (status === "stopping") {
    resultStatus = "loading";
    resultTitle = isEn ? "Stopping audio" : "Останавливаем звук";
    resultDescription = isEn
      ? "The output level is fading down."
      : "Уровень сигнала плавно снижается.";
  } else if (status === "running") {
    resultStatus = "success";
    resultTitle = isEn ? "Sound is playing" : "Звук воспроизводится";
    resultDescription = isEn
      ? `${noiseLabel} started after your action.`
      : `${noiseLabel} запущен после вашего действия.`;
  } else if (status === "finished") {
    resultStatus = "success";
    resultTitle = isEn ? "Timer completed" : "Таймер завершён";
    resultDescription = isEn
      ? "Playback stopped at the selected deadline."
      : "Воспроизведение остановлено в заданный срок.";
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-sm">
          <Label htmlFor="noise-generator-type">
            {isEn ? "Sound type" : "Тип звука"}
          </Label>
          <select
            id="noise-generator-type"
            value={noiseType}
            disabled={controlsDisabled}
            onChange={(event) => {
              setNoiseType(event.target.value as NoiseType);
              setStatus("ready");
              setRemainingSeconds(null);
              setError("");
            }}
            aria-describedby="noise-generator-safety"
            className="mt-1.5 h-12 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="white">{isEn ? "White noise" : "Белый шум"}</option>
            <option value="pink">{isEn ? "Pink noise" : "Розовый шум"}</option>
            <option value="brown">
              {isEn ? "Brown noise" : "Коричневый шум"}
            </option>
            <option value="tone">{isEn ? "Pure tone" : "Чистый тон"}</option>
          </select>
        </div>

        <p
          id="noise-generator-safety"
          role="note"
          className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-surface-muted)] p-3 text-sm font-semibold leading-6 text-[var(--color-text)]"
        >
          {isEn
            ? "Start with low device volume and stop if the sound feels uncomfortable."
            : "Начните с низкой громкости устройства и остановите звук при дискомфорте."}
        </p>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          tone={
            status === "running" || status === "stopping" ? "danger" : "primary"
          }
          loading={status === "starting" || status === "stopping"}
          loadingLabel={
            status === "stopping"
              ? isEn
                ? "Stopping…"
                : "Останавливаем…"
              : isEn
                ? "Starting…"
                : "Запускаем…"
          }
          leadingIcon={
            status === "running" ? (
              <Stop size={20} weight="fill" aria-hidden="true" />
            ) : (
              <Play size={20} weight="fill" aria-hidden="true" />
            )
          }
          aria-pressed={status === "running"}
          onClick={togglePlayback}
        >
          {status === "running"
            ? isEn
              ? "Stop sound"
              : "Остановить звук"
            : isEn
              ? "Start sound"
              : "Запустить звук"}
        </ToolPrimaryAction>

        <ToolResult
          status={resultStatus}
          title={resultTitle}
          description={resultDescription}
          className="mt-5"
        >
          {status === "running" ? (
            <>
              <p className="flex items-baseline gap-2 text-[var(--color-text)]">
                <span className="text-4xl font-black tabular-nums sm:text-5xl">
                  {remainingSeconds === null
                    ? isEn
                      ? "Continuous"
                      : "Непрерывно"
                    : remainingSeconds}
                </span>
                {remainingSeconds === null ? null : (
                  <span className="text-sm font-bold text-[var(--color-text-muted)]">
                    {isEn ? "seconds left" : "секунд осталось"}
                  </span>
                )}
              </p>
              <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
                {isEn
                  ? "This generator makes an audio signal only; it does not provide treatment or guarantee any health effect."
                  : "Генератор создаёт только аудиосигнал; он не является лечением и не гарантирует эффект для здоровья."}
              </p>
            </>
          ) : null}
        </ToolResult>

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Output level, auto-stop and pure-tone frequency"
              : "Уровень сигнала, автоостановка и частота чистого тона"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="noise-generator-volume">
                {isEn
                  ? `Output level: ${volumePercent}%`
                  : `Уровень сигнала: ${volumePercent}%`}
              </Label>
              <input
                id="noise-generator-volume"
                type="range"
                min={NOISE_GENERATOR_LIMITS.minimumVolumePercent}
                max={NOISE_GENERATOR_LIMITS.maximumVolumePercent}
                step="1"
                value={volumePercent}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setVolumePercent(Number(event.target.value));
                  setStatus("ready");
                  setError("");
                }}
                className="mt-1.5 min-h-11 w-full accent-[var(--color-primary)]"
              />
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {isEn
                  ? "Default 10%; device volume still affects the result."
                  : "По умолчанию 10%; системная громкость устройства также влияет на результат."}
              </p>
            </div>

            <div>
              <Label htmlFor="noise-generator-auto-stop">
                {isEn ? "Auto-stop, seconds" : "Автоостановка, секунд"}
              </Label>
              <Input
                id="noise-generator-auto-stop"
                type="number"
                min="0"
                max={NOISE_GENERATOR_LIMITS.maximumAutoStopSeconds}
                step="1"
                inputMode="numeric"
                value={autoStopValue}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setAutoStopValue(event.target.value);
                  setStatus("ready");
                  setRemainingSeconds(null);
                  setError("");
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                {isEn
                  ? "0 plays continuously; maximum 3600 seconds."
                  : "0 — непрерывное воспроизведение; максимум 3600 секунд."}
              </p>
            </div>
          </div>

          {noiseType === "tone" ? (
            <div className="mt-4 max-w-sm">
              <Label htmlFor="noise-generator-frequency">
                {isEn ? "Frequency, Hz" : "Частота, Гц"}
              </Label>
              <Input
                id="noise-generator-frequency"
                type="number"
                min={NOISE_GENERATOR_LIMITS.minimumToneFrequencyHz}
                max={NOISE_GENERATOR_LIMITS.maximumToneFrequencyHz}
                step="1"
                inputMode="decimal"
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
                {isEn ? "20–20,000 Hz." : "20–20 000 Гц."}
              </p>
            </div>
          ) : null}
        </AdvancedSettings>
      </section>
    </div>
  );
}
