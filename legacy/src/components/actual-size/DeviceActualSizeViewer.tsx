'use client';

import React, { useState } from 'react';
import { useScreenPpi } from '@/src/hooks/useScreenPpi';
import type { DeviceSpec } from '@/src/types/actual-size';
import { ScreenCalibrator } from './ScreenCalibrator';
import devicesData from '@/src/data/actual-size/devices.json';
import { Scales, X } from '@phosphor-icons/react';

export interface DeviceActualSizeViewerProps {
  readonly device: DeviceSpec;
}

function renderDeviceSilhouette(device: DeviceSpec, widthPx: number, heightPx: number, isOverlay = false) {
  const name = device.modelRu || device.modelEn;
  const category = device.category;

  if (category === 'calibration') {
    // Bank card / ID card silhouette
    return (
      <div
        style={{ width: `${widthPx}px`, height: `${heightPx}px`, borderRadius: '12px' }}
        className={`relative border-2 ${
          isOverlay ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-800'
        } shadow-2xl flex flex-col justify-between p-3 select-none`}
      >
        <div className="flex justify-between items-start">
          <div className="w-9 h-7 rounded bg-amber-300/80 border border-amber-500/60" /> {/* Chip */}
          <div className="text-[10px] font-mono text-slate-400">85.6 × 54.0 mm</div>
        </div>
        <div className="text-center font-bold text-xs text-slate-200">{name}</div>
        <div className="w-full h-3 rounded bg-slate-700/60" /> {/* Mag stripe mockup */}
      </div>
    );
  }

  if (category === 'watch') {
    // Smartwatch silhouette
    return (
      <div className="relative flex flex-col items-center">
        {/* Top strap */}
        <div className="w-14 h-4 bg-slate-700 rounded-t-md" />
        <div
          style={{ width: `${widthPx}px`, height: `${heightPx}px`, borderRadius: '28px' }}
          className={`relative border-3 ${
            isOverlay ? 'border-amber-400 bg-amber-500/20' : 'border-slate-600 bg-slate-900'
          } shadow-2xl flex flex-col justify-center items-center p-2 select-none`}
        >
          <div className="text-center text-slate-300 text-xs font-bold">{name}</div>
          <div className="text-[10px] text-slate-400 mt-1">Smartwatch 1:1</div>
        </div>
        {/* Bottom strap */}
        <div className="w-14 h-4 bg-slate-700 rounded-b-md" />
      </div>
    );
  }

  if (category === 'accessory') {
    // AirPods / AirTag / Case silhouette (smooth pebble/oval)
    return (
      <div
        style={{ width: `${widthPx}px`, height: `${heightPx}px`, borderRadius: '32px' }}
        className={`relative border-2 ${
          isOverlay ? 'border-amber-400 bg-amber-500/20' : 'border-slate-500 bg-slate-800'
        } shadow-2xl flex flex-col justify-center items-center p-3 select-none`}
      >
        <div className="w-2 h-2 rounded-full bg-slate-400 mb-1" /> {/* LED */}
        <div className="text-center text-slate-200 text-xs font-bold">{name}</div>
        <div className="text-[9px] text-slate-400 mt-0.5">1:1 Physical Scale</div>
      </div>
    );
  }

  if (category === 'tablet') {
    // Tablet silhouette (uniform thin bezels, large screen)
    return (
      <div
        style={{ width: `${widthPx}px`, height: `${heightPx}px`, borderRadius: '20px' }}
        className={`relative border-4 ${
          isOverlay ? 'border-amber-400 bg-amber-500/20' : 'border-slate-700 bg-slate-900'
        } shadow-2xl flex flex-col justify-between items-center p-3 select-none`}
      >
        <div className="w-2 h-2 bg-slate-700 rounded-full" /> {/* Front camera */}
        <div className="text-center text-slate-300 text-xs">
          <div className="font-bold">{name}</div>
          <div className="text-[10px] text-slate-400 mt-1">Tablet 1:1 Scale</div>
        </div>
        <div className="w-24 h-1 bg-slate-700 rounded-full" />
      </div>
    );
  }

  // Default: Smartphone silhouette
  return (
    <div
      style={{ width: `${widthPx}px`, height: `${heightPx}px`, borderRadius: '26px' }}
      className={`relative border-4 ${
        isOverlay ? 'border-amber-400 bg-amber-500/20' : 'border-slate-700 bg-slate-900'
      } shadow-2xl flex flex-col justify-between items-center p-3 select-none`}
    >
      {/* Dynamic island or speaker */}
      <div className="w-16 h-2 bg-slate-800 rounded-full" />

      {/* Screen Content Mock */}
      <div className="text-center text-slate-400 text-xs">
        <div className="font-bold text-slate-200">{name}</div>
        <div className="text-[10px] mt-1">Масштаб 1:1 на мониторе</div>
      </div>

      {/* Home bar */}
      <div className="w-20 h-1 bg-slate-700 rounded-full" />
    </div>
  );
}

export function DeviceActualSizeViewer({ device }: DeviceActualSizeViewerProps) {
  const { ppi } = useScreenPpi();
  const [compareSlug, setCompareSlug] = useState<string>('');

  const widthPx = (device.widthMm / 25.4) * ppi;
  const heightPx = (device.heightMm / 25.4) * ppi;

  const name = device.modelRu || device.modelEn;
  const depth = device.thicknessMm || 8;
  const diagonal = device.screenDiagonalInches || 6.1;

  const compareDevice = compareSlug
    ? (devicesData as DeviceSpec[]).find((d) => d.slug === compareSlug)
    : null;

  const compareWidthPx = compareDevice ? (compareDevice.widthMm / 25.4) * ppi : 0;
  const compareHeightPx = compareDevice ? (compareDevice.heightMm / 25.4) * ppi : 0;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto p-4 sm:p-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {name} — Реальный размер 1:1
        </h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {device.widthMm} × {device.heightMm} × {depth} мм · {diagonal}″ экран
        </p>
      </div>

      {/* Device Comparison Selector */}
      <div className="flex items-center gap-2 rounded-xl border bg-[var(--color-surface-muted)]/60 px-3 py-2 text-xs">
        <Scales size={16} className="text-[var(--color-primary)]" />
        <span className="font-medium">Сравнить с другим устройством:</span>
        <select
          value={compareSlug}
          onChange={(e) => setCompareSlug(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
        >
          <option value="">(Выберите устройство)</option>
          {(devicesData as DeviceSpec[])
            .filter((d) => d.slug !== device.slug)
            .map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.modelRu || d.modelEn} ({d.widthMm}×{d.heightMm} мм)
              </option>
            ))}
        </select>
        {compareDevice && (
          <button
            type="button"
            onClick={() => setCompareSlug('')}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] p-0.5"
            title="Отменить сравнение"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Comparison diff stats */}
      {compareDevice && (
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-semibold text-blue-500">
            ■ {name}: {device.widthMm} × {device.heightMm} мм
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-500">
            ■ {compareDevice.modelRu || compareDevice.modelEn}: {compareDevice.widthMm} × {compareDevice.heightMm} мм
          </span>
          <span className="text-[var(--color-text-muted)]">
            (Δ {Math.abs(device.widthMm - compareDevice.widthMm).toFixed(1)} мм по ширине,{' '}
            {Math.abs(device.heightMm - compareDevice.heightMm).toFixed(1)} мм по высоте)
          </span>
        </div>
      )}

      {/* 1:1 Scale Representation with optional overlay comparison */}
      <div className="relative overflow-auto max-w-full min-h-[300px] p-6 flex justify-center items-center bg-secondary/30 rounded-2xl border">
        {/* Base device */}
        {renderDeviceSilhouette(device, widthPx, heightPx)}

        {/* Comparison overlay */}
        {compareDevice && (
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-85">
            {renderDeviceSilhouette(compareDevice, compareWidthPx, compareHeightPx, true)}
          </div>
        )}
      </div>

      {/* Calibration component */}
      <ScreenCalibrator />
    </div>
  );
}
