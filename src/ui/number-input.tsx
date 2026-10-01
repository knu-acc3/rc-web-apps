"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { clampNum, formatNum, parseNum, stepValue } from "@/lib/number-input";

const T = {
  ru: { dec: "Меньше", inc: "Больше" },
  en: { dec: "Decrease", inc: "Increase" },
} as const;

const H = { sm: "h-9 text-sm pointer-coarse:h-10", md: "h-10 text-[0.9375rem] pointer-coarse:h-11", lg: "h-12 text-lg", xl: "h-14 text-2xl" } as const;

/**
 * A number field with − and + at its ends instead of the browser's tiny spinner arrows. Type a value, press −/+
 * (hold to repeat, faster and faster), or use ↑/↓. The value is clamped to [min, max] when the field loses focus.
 */
export function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 0,
  suffix,
  placeholder,
  stepper = true,
  size = "md",
  locale = "ru",
  id,
  disabled,
  invalid,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  /** Unit inside the field: "px", "%", "КБ". */
  suffix?: string;
  placeholder?: string;
  /** false hides − / + (for big free values like a width in pixels). */
  stepper?: boolean;
  size?: keyof typeof H;
  locale?: "ru" | "en";
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const t = T[locale];
  const [text, setText] = useState(formatNum(value, decimals, locale));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    if (parseNum(text) !== value) setText(formatNum(value, decimals, locale));
  }

  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  });
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const bump = (dir: 1 | -1) => {
    const next = stepValue(valueRef.current, dir, step, min, max, decimals);
    valueRef.current = next;
    setText(formatNum(next, decimals, locale));
    onChange(next);
  };
  const stop = () => window.clearTimeout(timer.current);
  const startHold = (dir: 1 | -1, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button > 0) return;
    bump(dir);
    let delay = 420;
    const tick = () => {
      bump(dir);
      delay = Math.max(40, delay * 0.8);
      timer.current = window.setTimeout(tick, delay);
    };
    timer.current = window.setTimeout(tick, delay);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      bump(e.key === "ArrowUp" ? 1 : -1);
    }
  };

  return (
    <div className={cn("stepper", H[size], disabled && "opacity-60", className)} aria-invalid={invalid || undefined}>
      {stepper && <StepButton dir={-1} label={t.dec} disabled={disabled || (value !== null && value <= min)} onDown={startHold} onStop={stop} onKeyboard={bump} />}
      <input
        id={id}
        inputMode={decimals > 0 || min < 0 ? "decimal" : "numeric"}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onKeyDown={onKey}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseNum(e.target.value);
          if (e.target.value.trim() === "") onChange(null);
          else if (n !== null && n >= min && n <= max) onChange(clampNum(n, min, max, decimals));
        }}
        onBlur={() => {
          const n = parseNum(text);
          if (n === null) {
            setText(formatNum(value, decimals, locale));
            return;
          }
          const c = clampNum(n, min, max, decimals);
          setText(formatNum(c, decimals, locale));
          if (c !== value) onChange(c);
        }}
        className={cn("min-w-0 px-1", !stepper && "px-3.5 text-left")}
      />
      {suffix && <span className={cn("flex shrink-0 items-center text-sm font-medium text-fg-3", stepper ? "-ml-1 pr-0.5" : "pr-3.5")}>{suffix}</span>}
      {stepper && <StepButton dir={1} label={t.inc} disabled={disabled || (value !== null && value >= max)} onDown={startHold} onStop={stop} onKeyboard={bump} />}
    </div>
  );
}

/** − or + at an end of the field: a press steps once, holding repeats; Enter/Space (no pointer) steps too. */
function StepButton({
  dir,
  label,
  disabled,
  onDown,
  onStop,
  onKeyboard,
}: {
  dir: 1 | -1;
  label: string;
  disabled?: boolean;
  onDown: (dir: 1 | -1, e: PointerEvent<HTMLButtonElement>) => void;
  onStop: () => void;
  onKeyboard: (dir: 1 | -1) => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      aria-label={label}
      title={label}
      onPointerDown={(e) => onDown(dir, e)}
      onPointerUp={onStop}
      onPointerLeave={onStop}
      onPointerCancel={onStop}
      // A pointer press already stepped on pointerdown; `detail === 0` means keyboard activation.
      onClick={(e) => {
        if (e.detail === 0) onKeyboard(dir);
      }}
      className="btn btn-neutral btn-round stepper-btn shrink-0 [&_svg]:size-4"
    >
      {dir < 0 ? <Minus aria-hidden /> : <Plus aria-hidden />}
    </button>
  );
}
