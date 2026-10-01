"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { readableTextColor, toHex, type Color } from "../lib/color";
import { CHECKER_STYLE } from "./ColorField";

interface StripItem {
  color: Color;
  /** Small caption above the hex (e.g. "50", "+30°"). */
  caption?: string;
}

/** A row of color swatches; clicking one copies its HEX. */
export function SwatchStrip({
  items,
  copyLabel,
  copiedLabel,
  className,
  tall = false,
}: {
  items: StripItem[];
  copyLabel: string;
  copiedLabel: string;
  className?: string;
  tall?: boolean;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <ul className={cn("grid auto-cols-fr grid-flow-col overflow-hidden rounded-[1rem] shadow-card", className)}>
      {items.map((it, i) => {
        const hex = toHex(it.color);
        const fg = readableTextColor(it.color);
        return (
          <li key={i} className="min-w-0" style={CHECKER_STYLE}>
            <button
              type="button"
              className={cn(
                "relative flex w-full flex-col items-center justify-end gap-0.5 px-0.5 pb-2 text-center after:pointer-events-none after:absolute after:inset-0 after:bg-current after:opacity-0 after:transition-opacity hover:after:opacity-10 focus-visible:outline-offset-[-3px] active:after:opacity-20",
                tall ? "h-28" : "h-20",
              )}
              style={{ background: hex, color: fg }}
              aria-label={`${copyLabel} ${hex}`}
              title={`${copyLabel} ${hex}`}
              onClick={async () => {
                if (await copyText(hex)) {
                  setCopied(i);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(null), 1200);
                }
              }}
            >
              {it.caption && <span className="text-[0.6875rem] leading-none">{it.caption}</span>}
              <span className="font-mono text-[0.6875rem] leading-tight font-medium break-all sm:text-xs">
                {copied === i ? (
                  <span className="inline-flex items-center gap-0.5 motion-safe:animate-[pop_200ms_ease-out]">
                    <Check className="size-4" strokeWidth={3} aria-hidden />
                    <span className="sr-only">{copiedLabel}</span>
                  </span>
                ) : (
                  hex.slice(1)
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
