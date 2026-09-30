'use client';

import React, { useState, useEffect, useRef } from 'react';
import { playTimerBeep } from '@/src/lib/audio/soundSynthesizer';
import { LapRecordsTable, type LapRecord } from './LapRecordsTable';
import { PictureInPicture, Bell, Eye } from '@phosphor-icons/react';

export interface UniversalTimerEngineProps {
  readonly defaultSeconds?: number;
  readonly mode?: 'timer' | 'stopwatch';
  readonly title?: string;
  readonly locale?: string;
}


interface DocumentPictureInPictureWindow extends Window {
  document: Document;
}

interface WindowWithDocPip extends Window {
  documentPictureInPicture?: {
    requestWindow: (options: { width: number; height: number }) => Promise<DocumentPictureInPictureWindow>;
  };
}

export function UniversalTimerEngine({
  defaultSeconds = 1500,
  mode = 'timer',
  title,
  locale = 'ru',
}: UniversalTimerEngineProps) {
  const isRu = locale !== 'en';
  const [currentMode, setCurrentMode] = useState<'timer' | 'stopwatch'>(mode);
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [stopwatchMs, setStopwatchMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const targetEpochRef = useRef<number | null>(null);
  const stopwatchStartRef = useRef<number | null>(null);
  const lastLapTimeRef = useRef<number>(0);
  const timeLeftRef = useRef(timeLeft);
  const stopwatchMsRef = useRef(stopwatchMs);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    stopwatchMsRef.current = stopwatchMs;
  }, [stopwatchMs]);

  const enableNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') setNotificationsEnabled(true);
    }
  };

  // Screen Wake Lock API
  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    async function manageWakeLock() {
      if (isRunning && 'wakeLock' in navigator && navigator.wakeLock) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          wakeLockRef.current = lock;
          setWakeLockActive(true);
          lock.addEventListener('release', () => {
            setWakeLockActive(false);
            wakeLockRef.current = null;
          });
        } catch {
          setWakeLockActive(false);
        }
      } else if (!isRunning && wakeLockRef.current) {
        try {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          setWakeLockActive(false);
        } catch {
          // ignore release errors
        }
      }
    }

    manageWakeLock();

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [isRunning]);

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || currentMode !== 'timer') return;

    targetEpochRef.current = Date.now() + timeLeftRef.current * 1000;

    const interval = setInterval(() => {
      if (!targetEpochRef.current) return;
      const remainingMs = targetEpochRef.current - Date.now();
      const remSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(remSec);

      if (remSec <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        playTimerBeep(880, 0.8);

        // Web Notification if tab is hidden
        if (
          typeof window !== 'undefined' &&
          document.hidden &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(isRu ? 'Время вышло!' : 'Time is up!', {
              body: title || (isRu ? 'Таймер завершил обратный отсчет' : 'Timer countdown finished'),
              icon: '/favicon.svg',
            });
          } catch {
            // ignore
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isRunning, currentMode, isRu, title]);

  // Stopwatch effect
  useEffect(() => {
    if (!isRunning || currentMode !== 'stopwatch') return;

    stopwatchStartRef.current = Date.now() - stopwatchMsRef.current;

    const interval = setInterval(() => {
      if (!stopwatchStartRef.current) return;
      setStopwatchMs(Date.now() - stopwatchStartRef.current);
    }, 50);

    return () => clearInterval(interval);
  }, [isRunning, currentMode]);

  // Dynamic document title update
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevTitle = document.title;

    if (isRunning) {
      if (currentMode === 'timer') {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        document.title = `(${formatted}) ${title || (isRu ? 'Таймер' : 'Timer')}`;
      } else {
        const sec = Math.floor(stopwatchMs / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        document.title = `(${formatted}) ${isRu ? 'Секундомер' : 'Stopwatch'}`;
      }
    }

    return () => {
      document.title = prevTitle;
    };
  }, [isRunning, timeLeft, stopwatchMs, currentMode, title, isRu]);

  // Picture-in-Picture mode
  const openPictureInPicture = async () => {
    if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        const win = window as WindowWithDocPip;
        if (!win.documentPictureInPicture) return;
        const pipWin = await win.documentPictureInPicture.requestWindow({
          width: 320,
          height: 160,
        });

        const root = document.createElement('div');
        root.style.cssText =
          'display:flex;align-items:center;justify-content:center;height:100vh;background:#090d16;color:#3b82f6;font-family:monospace;font-size:36px;font-weight:bold;';
        root.id = 'pip-display';
        pipWin.document.body.appendChild(root);

        const updatePip = () => {
          if (pipWin.closed) return;
          const el = pipWin.document.getElementById('pip-display');
          if (el) {
            const m = Math.floor(timeLeftRef.current / 60);
            const s = timeLeftRef.current % 60;
            el.innerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
          requestAnimationFrame(updatePip);
        };
        requestAnimationFrame(updatePip);
      } catch {
        // ignore
      }
    }
  };

  const handleLap = () => {
    if (currentMode !== 'stopwatch' || !isRunning) return;
    const lapTime = stopwatchMs - lastLapTimeRef.current;
    lastLapTimeRef.current = stopwatchMs;
    setLaps((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        lapTimeMs: lapTime,
        totalTimeMs: stopwatchMs,
      },
    ]);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (currentMode === 'timer') {
      setTimeLeft(defaultSeconds);
    } else {
      setStopwatchMs(0);
      lastLapTimeRef.current = 0;
      setLaps([]);
    }
  };

  // Timer formatting
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timerFormatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  // Stopwatch formatting
  const swMinutes = Math.floor(stopwatchMs / 60000);
  const swSeconds = Math.floor((stopwatchMs % 60000) / 1000);
  const swCs = Math.floor((stopwatchMs % 1000) / 10);
  const stopwatchFormatted = `${swMinutes.toString().padStart(2, '0')}:${swSeconds
    .toString()
    .padStart(2, '0')}.${swCs.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-6 p-6 border rounded-3xl bg-card max-w-md mx-auto w-full shadow-sm">
      {title && <h2 className="text-xl font-bold text-center">{title}</h2>}

      {/* Mode Switcher */}
      <div className="flex gap-2 p-1 bg-secondary rounded-2xl">
        <button
          onClick={() => {
            setIsRunning(false);
            setCurrentMode('timer');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentMode === 'timer'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          {isRu ? 'Таймер' : 'Timer'}
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setCurrentMode('stopwatch');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentMode === 'stopwatch'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          {isRu ? 'Секундомер' : 'Stopwatch'}
        </button>
      </div>

      {/* Digital readout */}
      <div className="text-5xl sm:text-6xl font-mono tabular-nums font-extrabold tracking-tight text-primary">
        {currentMode === 'timer' ? timerFormatted : stopwatchFormatted}
      </div>

      {/* Auxiliary Status Badges (Wake Lock, Notifications) */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {wakeLockActive && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <Eye size={14} /> {isRu ? 'Экран не уснет' : 'Wake Lock on'}
          </span>
        )}
        {!notificationsEnabled && (
          <button
            type="button"
            onClick={enableNotifications}
            className="flex items-center gap-1 hover:underline text-[11px]"
          >
            <Bell size={13} /> {isRu ? 'Включить звук оповещений' : 'Enable notifications'}
          </button>
        )}
      </div>

      {/* Timer Presets */}
      {currentMode === 'timer' && !isRunning && (
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { label: isRu ? '5 мин' : '5 min', sec: 300 },
            { label: isRu ? '15 мин' : '15 min', sec: 900 },
            { label: isRu ? '25 мин (Помодоро)' : '25 min (Pomodoro)', sec: 1500 },
            { label: isRu ? '45 мин' : '45 min', sec: 2700 },
            { label: isRu ? '1 час' : '1 hour', sec: 3600 },
          ].map((preset) => (
            <button
              key={preset.sec}
              onClick={() => {
                setTimeLeft(preset.sec);
              }}
              className="px-2.5 py-1 text-xs border rounded-lg hover:bg-secondary text-muted-foreground"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex-1 min-h-[48px] bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow"
        >
          {isRunning ? (isRu ? 'Пауза' : 'Pause') : isRu ? 'Старт' : 'Start'}
        </button>

        {currentMode === 'stopwatch' && isRunning && (
          <button
            onClick={handleLap}
            className="min-h-[48px] px-4 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
          >
            {isRu ? 'Круг' : 'Lap'}
          </button>
        )}

        <button
          onClick={handleReset}
          className="min-h-[48px] px-4 border rounded-xl hover:bg-secondary font-semibold active:scale-95 transition-all"
        >
          {isRu ? 'Сброс' : 'Reset'}
        </button>

        {typeof window !== 'undefined' && 'documentPictureInPicture' in window && (
          <button
            type="button"
            onClick={openPictureInPicture}
            className="min-h-[48px] px-3 border rounded-xl hover:bg-secondary text-muted-foreground"
            title={isRu ? 'Режим Picture-in-Picture (плавающее окно)' : 'Picture-in-Picture mode'}
          >
            <PictureInPicture size={18} />
          </button>
        )}
      </div>

      {/* Lap Table for stopwatch */}
      {currentMode === 'stopwatch' && (
        <LapRecordsTable laps={laps} onClear={() => setLaps([])} />
      )}
    </div>
  );
}
