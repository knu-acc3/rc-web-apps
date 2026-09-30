"use client";

import { useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { FlagIcon } from "./FlagIcon";

export interface CountrySelectOption {
  value: string;
  label: string;
  countryCode?: string;
  callingCode?: string;
  disabled?: boolean;
  suffix?: ReactNode;
}

export interface CountrySelectProps {
  value?: string;
  defaultValue?: string;
  options: readonly CountrySelectOption[];
  onValueChange?: (value: string) => void;
  placeholder?: ReactNode;
  ariaLabel: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  showFlag?: boolean;
  showCallingCode?: boolean;
  className?: string;
  contentClassName?: string;
}

/** Country picker with explicit flag/calling-code data supplied by each tool. */
export function CountrySelect({
  value,
  defaultValue,
  options,
  onValueChange,
  placeholder = "Select a country",
  ariaLabel,
  name,
  id,
  disabled,
  required,
  showFlag = true,
  showCallingCode = false,
  className,
  contentClassName,
}: CountrySelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const effectiveValue = value ?? uncontrolledValue;
  const selected =
    effectiveValue === undefined
      ? undefined
      : options.find((option) => option.value === effectiveValue);

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <Select
      value={effectiveValue}
      onValueChange={handleValueChange}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("h-11 min-h-11", className)}
      >
        {selected ? (
          <span className="flex min-w-0 items-center gap-2">
            {showFlag ? (
              <FlagIcon countryCode={selected.countryCode ?? selected.value} />
            ) : null}
            <span className="truncate">{selected.label}</span>
            {showCallingCode && selected.callingCode ? (
              <span className="shrink-0 text-[var(--color-text-muted)]">
                {selected.callingCode}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="truncate text-[var(--color-text-subtle)]">
            {placeholder}
          </span>
        )}
      </SelectTrigger>
      <SelectContent className={cn("max-h-80", contentClassName)}>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            textValue={`${option.label} ${option.callingCode ?? ""}`.trim()}
            className="min-h-11 py-2"
          >
            <span className="flex min-w-0 items-center gap-2">
              {showFlag ? (
                <FlagIcon countryCode={option.countryCode ?? option.value} />
              ) : null}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {showCallingCode && option.callingCode ? (
                <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
                  {option.callingCode}
                </span>
              ) : null}
              {option.suffix ? (
                <span className="shrink-0">{option.suffix}</span>
              ) : null}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
