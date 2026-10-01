"use client";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";

const T = {
  ru: { label: "Название", ph: "Название (необязательно)" },
  en: { label: "Title", ph: "Title (optional)" },
} as const;

/**
 * An optional headline typed right on the tool ("Pizza", "Final, 2nd half"), shown above the display. In full screen
 * it grows with the display and disappears when empty, so a projector shows only what was typed.
 */
export function ToolTitle({ value, onChange, locale, placeholder, full = false, className }: { value: string; onChange: (v: string) => void; locale: Locale; placeholder?: string; full?: boolean; className?: string }) {
  const t = T[locale];
  return (
    <input
      aria-label={t.label}
      placeholder={placeholder ?? t.ph}
      value={value}
      maxLength={60}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full max-w-xl truncate rounded-[0.5rem] border border-transparent bg-transparent px-2 text-center font-semibold text-fg-2 outline-none placeholder:font-normal placeholder:text-fg-3 hover:border-line focus:border-accent",
        full ? "text-[min(6vw,3rem)]" : "text-lg",
        full && !value && "hidden",
        className,
      )}
    />
  );
}
