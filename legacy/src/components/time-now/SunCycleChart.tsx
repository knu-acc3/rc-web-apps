'use client';

import React from 'react';
import type { SolarCalculationResult } from '@/src/lib/time-now/solarMath';

export interface SunCycleChartProps {
  readonly solarData: SolarCalculationResult;
}

export function SunCycleChart({ solarData }: SunCycleChartProps) {
  const hours = Math.floor(solarData.dayLengthMinutes / 60);
  const minutes = solarData.dayLengthMinutes % 60;

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-2xl bg-card w-full max-w-md">
      <div className="flex justify-between items-center text-sm font-semibold">
        <span>Световой день: {hours} ч {minutes} мин</span>
        <span className={solarData.isDaylight ? 'text-amber-500 font-bold' : 'text-indigo-400 font-bold'}>
          {solarData.isDaylight ? '☀️ День' : '🌙 Ночь'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-secondary/50 rounded-xl">
          <div className="text-muted-foreground">Восход</div>
          <div className="text-sm font-bold mt-1 text-amber-500">{solarData.sunriseTimeString}</div>
        </div>
        <div className="p-2 bg-secondary/50 rounded-xl">
          <div className="text-muted-foreground">Зенит</div>
          <div className="text-sm font-bold mt-1 text-primary">{solarData.solarNoonTimeString}</div>
        </div>
        <div className="p-2 bg-secondary/50 rounded-xl">
          <div className="text-muted-foreground">Закат</div>
          <div className="text-sm font-bold mt-1 text-orange-500">{solarData.sunsetTimeString}</div>
        </div>
      </div>
    </div>
  );
}
