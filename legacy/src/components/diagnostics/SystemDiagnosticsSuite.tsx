'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  inspectClientHardware,
  type HardwareDiagnosticsResult,
} from '@/src/lib/diagnostics/hardwareInspector';
import { detectWebRtcIps } from '@/src/lib/diagnostics/webrtcLeakDetector';

const emptySubscribe = () => () => {};

export function SystemDiagnosticsSuite() {
  const hw = useSyncExternalStore<HardwareDiagnosticsResult | null>(
    emptySubscribe,
    inspectClientHardware,
    () => null
  );
  const [webrtc, setWebrtc] = useState<{
    candidateIps: readonly string[];
    hasLocalLeak: boolean;
  } | null>(null);
  const [clientIp, setClientIp] = useState<string | null>(null);

  useEffect(() => {
    detectWebRtcIps().then(setWebrtc);

    fetch('/api/diagnostics/ip')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ip) setClientIp(data.ip);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  if (!hw) {
    return <div className="p-4 text-center">Инициализация системных сенсоров...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto p-4">
      {/* Public IP */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Внешний IP адрес</h4>
        <div className="text-2xl font-bold mt-1 font-mono text-primary truncate">
          {clientIp || 'Определение...'}
        </div>
      </div>

      {/* CPU Cores */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Процессор (Логические ядра)</h4>
        <div className="text-2xl font-bold mt-1">{hw.cpuCores} Cores</div>
      </div>

      {/* Screen Resolution */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Разрешение экрана</h4>
        <div className="text-2xl font-bold mt-1">{hw.screenResolution}</div>
      </div>

      {/* Pixel Ratio */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Плотность пикселей (DPR)</h4>
        <div className="text-2xl font-bold mt-1">{hw.pixelRatio}x</div>
      </div>

      {/* Color Depth */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Глубина цвета</h4>
        <div className="text-2xl font-bold mt-1">{hw.colorDepth} bit</div>
      </div>

      {/* Device Memory */}
      <div className="p-4 border rounded-xl bg-card">
        <h4 className="text-sm font-medium text-muted-foreground">Оперативная память (RAM)</h4>
        <div className="text-2xl font-bold mt-1">
          {hw.deviceMemoryGb ? `≥ ${hw.deviceMemoryGb} GB` : 'Не поддерживается API'}
        </div>
      </div>

      {/* GPU */}
      <div className="p-4 border rounded-xl bg-card sm:col-span-2 md:col-span-3">
        <h4 className="text-sm font-medium text-muted-foreground">Видеоадаптер (GPU WebGL)</h4>
        <div className="text-base font-semibold mt-1 truncate">
          {hw.gpuRenderer || 'Определяется...'}
        </div>
      </div>

      {/* WebRTC Leak Status */}
      <div className="p-4 border rounded-xl bg-card sm:col-span-2 md:col-span-3">
        <h4 className="text-sm font-medium text-muted-foreground">Статус утечки WebRTC STUN</h4>
        <div className="text-sm mt-1">
          {webrtc ? (
            webrtc.hasLocalLeak ? (
              <span className="text-amber-500 font-bold">
                Обнаружены локальные IP: {webrtc.candidateIps.join(', ')}
              </span>
            ) : (
              <span className="text-emerald-500 font-bold">Утечки локальных IP не обнаружено</span>
            )
          ) : (
            'Сканирование сетевых интерфейсов...'
          )}
        </div>
      </div>
    </div>
  );
}
