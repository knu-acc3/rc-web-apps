"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Stop } from "@phosphor-icons/react";
import { AdvancedSettings } from "@/src/components/tool/AdvancedSettings";
import { ToolPrimaryAction } from "@/src/components/tool/workspace/ToolPrimaryAction";
import { ToolResult } from "@/src/components/tool/workspace/ToolResult";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useLanguage } from "@/src/i18n/LanguageContext";

export const METRONOME_LIMITS = {
  minimumBpm: 30,
  maximumBpm: 300,
  minimumBeatsPerBar: 2,
  maximumBeatsPerBar: 12,
  minimumVolumePercent: 5,
  maximumVolumePercent: 40,
  schedulerLookAheadMs: 25,
  scheduleAheadSeconds: 0.12,
} as const;

interface ScheduledClick {
  oscillator: OscillatorNode;
  gain: GainNode;
}


type AudioContextWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

const AUDIO_CONTEXT_RESUME_TIMEOUT_MS = 4_000;

export function secondsPerBeat(bpm: number): number {
  return 60 / bpm;
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

function releaseClick(click: ScheduledClick) {
  click.oscillator.onended = null;
  try {
    click.oscillator.stop();
  } catch {
    // The short node may already have stopped.
  }
  click.oscillator.disconnect();
  click.gain.disconnect();
}

function scheduleClick(
  context: AudioContext,
  scheduledClicks: Set<ScheduledClick>,
  when: number,
  accented: boolean,
  volumePercent: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const click: ScheduledClick = { oscillator, gain };
  const peak = (volumePercent / 100) * (accented ? 1 : 0.72);
  const attackEnd = when + 0.002;
  const releaseEnd = when + 0.045;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(accented ? 1320 : 880, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), attackEnd);
  gain.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);
  oscillator.connect(gain);
  gain.connect(context.destination);
  scheduledClicks.add(click);

  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
    scheduledClicks.delete(click);
  };
  oscillator.start(when);
  oscillator.stop(releaseEnd + 0.01);
}

export default function Metronome() {
  const { locale } = useLanguage();
  const isEn = locale === "en";
  const [bpmValue, setBpmValue] = useState("120");
  const [beatsPerBarValue, setBeatsPerBarValue] = useState("4");
  const [accentFirstBeat, setAccentFirstBeat] = useState(true);
  const [volumePercent, setVolumePercent] = useState(20);
  const [activeBpm, setActiveBpm] = useState(120);
  const [isStarting, setIsStarting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");

  const contextRef = useRef<AudioContext | null>(null);
  const resumeAbortRef = useRef<AbortController | null>(null);
  const schedulerTimerRef = useRef<number | null>(null);
  const scheduledClicksRef = useRef<Set<ScheduledClick>>(new Set());
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const startingRef = useRef(false);
  const runningRef = useRef(false);
  const mountedRef = useRef(true);
  const activeBpmRef = useRef(120);
  const beatsPerBarRef = useRef(4);
  const accentFirstBeatRef = useRef(true);
  const volumePercentRef = useRef(20);

  const stopAudio = useCallback((updateUi = true) => {
    resumeAbortRef.current?.abort();
    resumeAbortRef.current = null;
    startingRef.current = false;
    runningRef.current = false;
    if (schedulerTimerRef.current !== null) {
      window.clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }

    for (const click of scheduledClicksRef.current) {
      releaseClick(click);
    }
    scheduledClicksRef.current.clear();

    const context = contextRef.current;
    contextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close().catch(() => undefined);
    }

    if (updateUi && mountedRef.current) {
      setIsStarting(false);
      setIsRunning(false);
    }
  }, []);

  const startAudio = async () => {
    if (startingRef.current || runningRef.current) return;

    const bpm = Number(bpmValue);
    const beatsPerBar = Number(beatsPerBarValue);

    if (
      !Number.isInteger(bpm) ||
      bpm < METRONOME_LIMITS.minimumBpm ||
      bpm > METRONOME_LIMITS.maximumBpm
    ) {
      setError(
        isEn
          ? "Enter a whole BPM value from 30 to 300."
          : "Укажите целый темп от 30 до 300 BPM.",
      );
      return;
    }
    if (
      !Number.isInteger(beatsPerBar) ||
      beatsPerBar < METRONOME_LIMITS.minimumBeatsPerBar ||
      beatsPerBar > METRONOME_LIMITS.maximumBeatsPerBar
    ) {
      setError(
        isEn
          ? "Enter a whole time-signature count from 2 to 12."
          : "Укажите целое число долей в такте от 2 до 12.",
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

    try {
      const startedContext = new AudioContextConstructor();
      context = startedContext;
      contextRef.current = startedContext;
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
      if (!mountedRef.current || contextRef.current !== startedContext) {
        if (startedContext.state !== "closed") await startedContext.close();
        return;
      }
      if (startedContext.state !== "running") {
        throw new Error("Audio context did not start");
      }

      setError("");
      setActiveBpm(bpm);
      setIsRunning(true);
      runningRef.current = true;
      beatIndexRef.current = 0;
      nextBeatTimeRef.current = startedContext.currentTime + 0.05;

      activeBpmRef.current = bpm;
      beatsPerBarRef.current = beatsPerBar;
      accentFirstBeatRef.current = accentFirstBeat;
      volumePercentRef.current = volumePercent;

      const runScheduler = () => {
        if (!runningRef.current || contextRef.current !== startedContext)
          return;

        const currentBpm = activeBpmRef.current;
        const currentBeatsPerBar = beatsPerBarRef.current;
        const currentAccent = accentFirstBeatRef.current;
        const currentVolume = volumePercentRef.current;

        const beatDuration = secondsPerBeat(currentBpm);
        const lagSeconds = startedContext.currentTime - nextBeatTimeRef.current;
        if (lagSeconds > beatDuration) {
          const skippedBeats = Math.floor(lagSeconds / beatDuration);
          nextBeatTimeRef.current += skippedBeats * beatDuration;
          beatIndexRef.current =
            (beatIndexRef.current + skippedBeats) % currentBeatsPerBar;
        }
        const horizon =
          startedContext.currentTime + METRONOME_LIMITS.scheduleAheadSeconds;
        while (nextBeatTimeRef.current < horizon) {
          const isFirstBeat = beatIndexRef.current === 0;
          scheduleClick(
            startedContext,
            scheduledClicksRef.current,
            nextBeatTimeRef.current,
            currentAccent && isFirstBeat,
            currentVolume,
          );
          nextBeatTimeRef.current += beatDuration;
          beatIndexRef.current =
            (beatIndexRef.current + 1) % currentBeatsPerBar;
        }

        schedulerTimerRef.current = window.setTimeout(
          runScheduler,
          METRONOME_LIMITS.schedulerLookAheadMs,
        );
      };

      runScheduler();
    } catch {
      if (contextRef.current === context) {
        stopAudio(false);
      } else if (context && context.state !== "closed") {
        void context.close().catch(() => undefined);
      }
      if (mountedRef.current) {
        setIsRunning(false);
        setError(
          isEn
            ? "The browser could not start audio. Check its sound permissions."
            : "Браузер не смог запустить звук. Проверьте разрешение на воспроизведение.",
        );
      }
    } finally {
      startingRef.current = false;
      if (mountedRef.current) setIsStarting(false);
    }
  };

  const toggle = () => {
    if (startingRef.current) return;
    if (runningRef.current) {
      stopAudio();
      return;
    }
    void startAudio();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAudio(false);
    };
  }, [stopAudio]);

  useEffect(() => {
    activeBpmRef.current = activeBpm;
  }, [activeBpm]);

  useEffect(() => {
    const val = Number(beatsPerBarValue);
    if (Number.isInteger(val)) beatsPerBarRef.current = val;
  }, [beatsPerBarValue]);

  useEffect(() => {
    accentFirstBeatRef.current = accentFirstBeat;
  }, [accentFirstBeat]);

  useEffect(() => {
    volumePercentRef.current = volumePercent;
  }, [volumePercent]);

  const controlsDisabled = isStarting;
  const displayedBpm = isRunning ? activeBpm : Number(bpmValue) || "—";

  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="max-w-sm">
          <Label htmlFor="metronome-bpm">BPM</Label>
          <Input
            id="metronome-bpm"
            type="number"
            min={METRONOME_LIMITS.minimumBpm}
            max={METRONOME_LIMITS.maximumBpm}
            step="1"
            inputMode="numeric"
            value={bpmValue}
            disabled={controlsDisabled}
            onChange={(event) => {
              setBpmValue(event.target.value);
              setError("");
              const parsed = Number(event.target.value);
              if (
                Number.isInteger(parsed) &&
                parsed >= METRONOME_LIMITS.minimumBpm &&
                parsed <= METRONOME_LIMITS.maximumBpm
              ) {
                setActiveBpm(parsed);
                activeBpmRef.current = parsed;
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !controlsDisabled && !isRunning) void startAudio();
            }}
            aria-describedby="metronome-bpm-hint"
            className="mt-1.5 h-12 font-mono text-lg"
          />
          <p
            id="metronome-bpm-hint"
            className="mt-1.5 text-xs text-[var(--color-text-muted)]"
          >
            {isEn ? "30–300 beats per minute" : "30–300 ударов в минуту"}
          </p>
        </div>

        <ToolPrimaryAction
          type="button"
          className="mt-4"
          tone={isRunning ? "danger" : "primary"}
          loading={isStarting}
          loadingLabel={isEn ? "Starting…" : "Запускаем…"}
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
              ? "Stop metronome"
              : "Остановить метроном"
            : isEn
              ? "Start metronome"
              : "Запустить метроном"}
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
            status={isRunning ? "success" : "idle"}
            title={
              isRunning
                ? isEn
                  ? "Playing"
                  : "Играет"
                : isEn
                  ? "Stopped"
                  : "Остановлен"
            }
            description={
              isRunning
                ? isEn
                  ? "Clicks are scheduled slightly ahead with Web Audio."
                  : "Клики планируются немного заранее через Web Audio."
                : isEn
                  ? "Set BPM and press Start."
                  : "Укажите BPM и нажмите «Запустить»."
            }
            className="mt-5"
          >
            <p className="flex items-baseline gap-2 text-[var(--color-text)]">
              <span className="text-5xl font-black tabular-nums">
                {displayedBpm}
              </span>
              <span className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                BPM
              </span>
            </p>
            <p className="mt-3 text-xs leading-5 text-[var(--color-text-muted)]">
              {isEn
                ? "Timing can still vary with the browser, device load and audio hardware; this is not a studio timing reference."
                : "Тайминг может зависеть от браузера, нагрузки устройства и аудиосистемы; это не студийный эталон времени."}
            </p>
          </ToolResult>
        )}

        <AdvancedSettings
          className="mt-5"
          title={isEn ? "Advanced settings" : "Расширенные настройки"}
          description={
            isEn
              ? "Time signature, first-beat accent and volume"
              : "Размер такта, акцент первой доли и громкость"
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="metronome-beats-per-bar">
                {isEn ? "Beats per bar" : "Долей в такте"}
              </Label>
              <Input
                id="metronome-beats-per-bar"
                type="number"
                min={METRONOME_LIMITS.minimumBeatsPerBar}
                max={METRONOME_LIMITS.maximumBeatsPerBar}
                step="1"
                inputMode="numeric"
                value={beatsPerBarValue}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setBeatsPerBarValue(event.target.value);
                  setError("");
                }}
                className="mt-1.5 h-11"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {isEn ? "From 2 to 12." : "От 2 до 12."}
              </p>
            </div>

            <div>
              <Label htmlFor="metronome-volume">
                {isEn
                  ? `Click volume: ${volumePercent}%`
                  : `Громкость клика: ${volumePercent}%`}
              </Label>
              <input
                id="metronome-volume"
                type="range"
                min={METRONOME_LIMITS.minimumVolumePercent}
                max={METRONOME_LIMITS.maximumVolumePercent}
                step="1"
                value={volumePercent}
                disabled={controlsDisabled}
                onChange={(event) =>
                  setVolumePercent(Number(event.target.value))
                }
                className="mt-1.5 min-h-11 w-full accent-[var(--color-primary)]"
              />
            </div>
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-2.5 text-sm font-medium text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={accentFirstBeat}
              disabled={controlsDisabled}
              onChange={(event) => setAccentFirstBeat(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-[var(--color-primary)]"
            />
            <span>
              {isEn ? "Accent the first beat" : "Акцентировать первую долю"}
            </span>
          </label>
        </AdvancedSettings>
      </section>
    </div>
  );
}
