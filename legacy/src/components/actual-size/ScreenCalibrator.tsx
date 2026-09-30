'use client';

import React from 'react';
import { useScreenPpi } from '@/src/hooks/useScreenPpi';

const CARD_STANDARD_WIDTH_MM = 85.60;
const CARD_STANDARD_HEIGHT_MM = 53.98;

export function ScreenCalibrator() {
  const { ppi, setPpi, isCalibrated } = useScreenPpi();
  const cardWidthPx = ppi > 0 ? (CARD_STANDARD_WIDTH_MM / 25.4) * ppi : 324;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const px = parseFloat(e.target.value);
    const newPpi = (px / CARD_STANDARD_WIDTH_MM) * 25.4;
    setPpi(newPpi);
  };

  const handleStep = (delta: number) => {
    const px = cardWidthPx + delta;
    const newPpi = (px / CARD_STANDARD_WIDTH_MM) * 25.4;
    setPpi(newPpi);
  };

  const cardHeightPx = (cardWidthPx * CARD_STANDARD_HEIGHT_MM) / CARD_STANDARD_WIDTH_MM;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto p-4 border rounded-2xl bg-card">
      <h3 className="text-lg font-bold text-center">
        Калибровка масштаба экрана 1:1
      </h3>
      <p className="text-sm text-muted-foreground text-center">
        Приложите стандартную пластиковую банковскую карту к экрану и настройте размер прямоугольника ниже до точного совпадения.
      </p>

      {/* Интерактивный контур пластиковой карты */}
      <div
        style={{ width: `${cardWidthPx}px`, height: `${cardHeightPx}px` }}
        className="relative border-2 border-dashed border-primary bg-primary/10 rounded-xl flex items-center justify-center select-none touch-none transition-all duration-75 max-w-full"
      >
        <span className="text-xs font-semibold text-primary">
          Банковская карта (85.60 × 53.98 мм)
        </span>
      </div>

      {/* Контроллеры настройки */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span>Текущий расчетный PPI: <b>{Math.round(ppi)} DPI</b></span>
          {isCalibrated && <span className="text-emerald-500 font-medium">✓ Откалибровано</span>}
        </div>

        <input
          type="range"
          min="180"
          max="600"
          step="0.5"
          value={cardWidthPx}
          onChange={handleSliderChange}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex gap-2 justify-center mt-2">
          <button
            onClick={() => handleStep(-1)}
            className="min-h-[44px] min-w-[44px] px-4 py-2 border rounded-lg hover:bg-secondary font-bold text-base"
          >
            −
          </button>
          <button
            onClick={() => handleStep(1)}
            className="min-h-[44px] min-w-[44px] px-4 py-2 border rounded-lg hover:bg-secondary font-bold text-base"
          >
            +
          </button>
          <button
            onClick={() => setPpi(96)}
            className="min-h-[44px] px-4 py-2 border rounded-lg hover:bg-secondary text-sm"
          >
            Сброс (96 DPI)
          </button>
        </div>
      </div>
    </div>
  );
}
