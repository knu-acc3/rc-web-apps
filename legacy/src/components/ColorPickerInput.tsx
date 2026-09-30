"use client";

import React, { useState, useCallback, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Copy, Check } from "@phosphor-icons/react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";
import { writeClipboardText } from "@/src/utils/clipboard";

const PRESET_COLORS = [
  "#E83322",
  "#262B31",
  "#5B6470",
  "#FFFFFF",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
  "#000000",
  "#FFFFFF",
  "#F5F5F5",
  "#BDBDBD",
  "#616161",
];

interface ColorPickerInputProps {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
  size?: "small" | "medium";
  disabled?: boolean;
}

export default function ColorPickerInput({
  value,
  onChange,
  label,
  size = "medium",
  disabled = false,
}: ColorPickerInputProps) {
  const { locale } = useLanguage();
  const [pickerColor, setPickerColor] = useState(value);
  const [hexInput, setHexInput] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [copied, setCopied] = useState(false);
  const pendingColorRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  if (value !== syncedValue) {
    setSyncedValue(value);
    setPickerColor(value);
    setHexInput(value);
  }

  React.useEffect(() => {
    pendingColorRef.current = value;
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const emitChange = useCallback(
    (hex: string) => {
      pendingColorRef.current = hex;
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        onChange(pendingColorRef.current);
      });
    },
    [onChange],
  );

  const handleColorChange = useCallback(
    (hex: string) => {
      const normalized = hex.toUpperCase();
      setPickerColor(normalized);
      setHexInput(normalized);
      emitChange(normalized);
    },
    [emitChange],
  );

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHexInput(raw);
    const clean = raw.startsWith("#") ? raw : "#" + raw;
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      const normalized = clean.toUpperCase();
      setPickerColor(normalized);
      emitChange(normalized);
    }
  };

  const handleCopy = async () => {
    const ok = await writeClipboardText(safeColor);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const wellClass = size === "small" ? "h-11 w-12" : "h-11 w-16 sm:w-20";
  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(pickerColor)
    ? pickerColor
    : "#000000";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={label || safeColor}
          aria-label={label || safeColor}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-[var(--radius-sm)] border transition-all outline-none",
            "border-[var(--color-border-strong)] bg-[var(--color-surface-muted)]",
            wellClass,
            !disabled &&
              "cursor-pointer hover:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/30",
            disabled && "cursor-not-allowed opacity-50",
          )}
          style={{
            background:
              "repeating-conic-gradient(#d4d4d8 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px",
          }}
        >
          <span
            className="absolute inset-0"
            style={{ background: safeColor }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="max-h-[var(--radix-popover-content-available-height)] w-[280px] overflow-y-auto p-0"
        align="start"
        sideOffset={8}
      >
        <div className="[&_.react-colorful]:!w-full [&_.react-colorful]:!h-auto [&_.react-colorful]:!rounded-none [&_.react-colorful__saturation]:!h-[160px] [&_.react-colorful__saturation]:!rounded-t-[12px] [&_.react-colorful__saturation]:!border-b-0 [&_.react-colorful__hue]:!h-[14px] [&_.react-colorful__hue]:!m-3 [&_.react-colorful__hue]:!mb-0 [&_.react-colorful__hue]:!rounded-[7px] [&_.react-colorful__saturation-pointer]:!w-[18px] [&_.react-colorful__saturation-pointer]:!h-[18px] [&_.react-colorful__saturation-pointer]:!border-2 [&_.react-colorful__saturation-pointer]:!border-white [&_.react-colorful__hue-pointer]:!w-[18px] [&_.react-colorful__hue-pointer]:!h-[18px] [&_.react-colorful__hue-pointer]:!border-2 [&_.react-colorful__hue-pointer]:!border-white">
          <HexColorPicker color={safeColor} onChange={handleColorChange} />
        </div>

        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <Input
            value={hexInput}
            onChange={handleHexInput}
            placeholder="#000000"
            className="h-11 font-mono text-xs tracking-wider"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)]"
            aria-label="Copy"
          >
            {copied ? (
              <Check
                size={16}
                weight="bold"
                className="text-[var(--color-success)]"
              />
            ) : (
              <Copy size={16} />
            )}
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
            {locale === "en" ? "Quick pick" : "Быстрый выбор"}
          </div>
          <div className="grid grid-cols-4 gap-[5px]">
            {PRESET_COLORS.map((color, index) => (
              <button
                key={`${color}-${index}`}
                type="button"
                title={color}
                aria-label={color}
                onClick={() => handleColorChange(color)}
                className={cn(
                  "aspect-square w-full rounded-[5px] border transition-transform hover:scale-110 hover:z-10",
                  safeColor.toLowerCase() === color.toLowerCase()
                    ? "border-2 border-[var(--color-primary)]"
                    : "border-[var(--color-border)]",
                )}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
