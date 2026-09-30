'use client';

import * as React from 'react';
import { Minus, Plus } from '@phosphor-icons/react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/cn';
import { useLanguage } from '@/src/i18n/LanguageContext';

export interface MobileSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  unit?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
  /** Show numeric input on the right (default false). */
  showNumeric?: boolean;
  /** Show +/- buttons (default false). */
  showStepButtons?: boolean;
}

/**
 * Focused, touch-friendly slider. Exact input and step buttons are opt-in for
 * tools where that precision is part of the primary task.
 */
export function MobileSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  hint,
  className,
  disabled,
  showNumeric = false,
  showStepButtons = false,
}: MobileSliderProps) {
  const { locale } = useLanguage();
  const isEn = locale === 'en';
  const rangeId = React.useId();
  const hintId = React.useId();
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const decimals = step.toString().split('.')[1]?.length ?? 0;
  const fmt = (v: number) => (decimals > 0 ? v.toFixed(decimals) : String(Math.round(v)));

  const set = (next: number) => {
    if (!disabled) onChange(clamp(next));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={rangeId} className="text-sm font-semibold text-[var(--color-text)]">{label}</label>
        <span className="font-mono text-sm font-bold text-[var(--color-text)]">
          {fmt(value)}
          {unit && <span className="ml-0.5 text-[var(--color-text-subtle)]">{unit}</span>}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {showStepButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => set(value - step)}
            disabled={disabled || value <= min}
            aria-label={isEn ? `Decrease ${label}` : `Уменьшить: ${label}`}
          >
            <Minus size={14} weight="bold" />
          </Button>
        )}
        <input
          id={rangeId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={e => set(Number(e.target.value))}
          aria-describedby={hint ? hintId : undefined}
          className="h-6 flex-1 cursor-pointer appearance-none rounded-[var(--radius-pill)] bg-[var(--color-surface-muted)] accent-[var(--color-primary)] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)]"
        />
        {showStepButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => set(value + step)}
            disabled={disabled || value >= max}
            aria-label={isEn ? `Increase ${label}` : `Увеличить: ${label}`}
          >
            <Plus size={14} weight="bold" />
          </Button>
        )}
        {showNumeric && (
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={e => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) set(v);
            }}
            className="h-10 w-20 text-right font-mono text-sm"
            inputMode="decimal"
            aria-label={isEn ? `${label}: exact value` : `${label}: точное значение`}
            aria-describedby={hint ? hintId : undefined}
          />
        )}
      </div>
      {hint && <p id={hintId} className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
