"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<Value extends string> {
  value: Value;
  options: readonly SegmentedControlOption<Value>[];
  onValueChange: (value: Value) => void;
  ariaLabel: string;
  name?: string;
  disabled?: boolean;
  mobileColumns?: 1 | 2 | 3 | 4;
  layout?: "equal" | "content";
  className?: string;
  optionClassName?: string;
}

const columnClasses: Record<
  NonNullable<SegmentedControlProps<string>["mobileColumns"]>,
  string
> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

/** Touch-friendly native radio group that wraps safely at 390px. */
export function SegmentedControl<Value extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  name,
  disabled = false,
  mobileColumns = 2,
  layout = "equal",
  className,
  optionClassName,
}: SegmentedControlProps<Value>) {
  const generatedName = useId();
  const radioName = name ?? generatedName;

  return (
    <fieldset
      disabled={disabled}
      className={cn("min-w-0 border-0 p-0", className)}
    >
      <legend className="sr-only">{ariaLabel}</legend>
      <div
        className={cn(
          "gap-1.5",
          layout === "equal"
            ? cn("grid", columnClasses[mobileColumns])
            : "flex flex-wrap",
        )}
      >
        {options.map((option, index) => {
          const id = `${generatedName}-${index}`;
          return (
            <div
              key={option.value}
              className={cn(layout === "content" && "min-w-fit")}
            >
              <input
                id={id}
                type="radio"
                name={radioName}
                value={option.value}
                checked={value === option.value}
                disabled={disabled || option.disabled}
                onChange={() => onValueChange(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  "flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-muted)] peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary-soft)] peer-checked:text-[var(--color-primary)] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-ring)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                  layout === "content" && "w-auto min-w-24",
                  optionClassName,
                )}
              >
                {option.icon ? (
                  <span
                    className="shrink-0 [&>svg]:h-4 [&>svg]:w-4"
                    aria-hidden="true"
                  >
                    {option.icon}
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block leading-snug">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block text-xs font-normal leading-snug text-[var(--color-text-muted)] peer-checked:text-current">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
