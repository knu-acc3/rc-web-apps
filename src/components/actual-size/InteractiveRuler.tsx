'use client';

import React, { useState } from 'react';
import { useScreenPpi } from '@/src/hooks/useScreenPpi';

export function InteractiveRuler() {
  const { ppi } = useScreenPpi();
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');

  const pxPerMm = ppi / 25.4;
  const totalLengthMm = 300; // 30 см

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto p-4 border rounded-2xl bg-card">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Экранная линейка 1:1</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setUnit('cm')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              unit === 'cm' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Сантиметры
          </button>
          <button
            onClick={() => setUnit('inch')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              unit === 'inch' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Дюймы
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full border rounded-xl bg-slate-950 p-2 shadow-inner">
        <div
          style={{ width: `${totalLengthMm * pxPerMm}px`, height: '80px' }}
          className="relative select-none"
        >
          {Array.from({ length: totalLengthMm + 1 }).map((_, mm) => {
            const isCm = mm % 10 === 0;
            const isHalfCm = mm % 5 === 0 && !isCm;
            const height = isCm ? 36 : isHalfCm ? 22 : 12;

            return (
              <div
                key={mm}
                style={{ left: `${mm * pxPerMm}px`, height: `${height}px` }}
                className="absolute top-0 w-px bg-slate-400"
              >
                {isCm && (
                  <span className="absolute top-10 -left-2 text-[10px] text-slate-400 font-mono">
                    {unit === 'cm' ? mm / 10 : (mm / 25.4).toFixed(1)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
