'use client';

import React from 'react';

export interface LapRecord {
  readonly id: number;
  readonly lapTimeMs: number;
  readonly totalTimeMs: number;
}

export interface LapRecordsTableProps {
  readonly laps: readonly LapRecord[];
  readonly onClear?: () => void;
}

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export function LapRecordsTable({ laps, onClear }: LapRecordsTableProps) {
  if (laps.length === 0) return null;

  const handleExport = () => {
    const text = laps
      .map((l) => `Круг ${l.id}: ${formatMs(l.lapTimeMs)} (Общее: ${formatMs(l.totalTimeMs)})`)
      .join('\n');
    try {
      navigator.clipboard.writeText(text);
      alert('Круги скопированы в буфер обмена!');
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto p-4 border rounded-2xl bg-card">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm">Таблица кругов ({laps.length})</h4>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="text-xs px-2.5 py-1 border rounded-lg hover:bg-secondary font-medium"
          >
            Экспорт
          </button>
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs px-2.5 py-1 border rounded-lg hover:bg-destructive/20 text-destructive font-medium"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto divide-y divide-border text-xs">
        {laps.slice().reverse().map((lap) => (
          <div key={lap.id} className="flex justify-between py-2 font-mono">
            <span className="text-muted-foreground">Круг {lap.id}</span>
            <span className="font-semibold text-primary">{formatMs(lap.lapTimeMs)}</span>
            <span className="text-muted-foreground">{formatMs(lap.totalTimeMs)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
