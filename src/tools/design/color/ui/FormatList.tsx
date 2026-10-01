"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { formatColor, type Color, type ColorFormat } from "../lib/color";

const FORMAT_LABEL: Record<ColorFormat, string> = {
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  hwb: "HWB",
  hsv: "HSV",
  cmyk: "CMYK",
  lab: "Lab",
  lch: "LCH",
  oklab: "OKLab",
  oklch: "OKLCH",
  p3: "Display P3",
};

const DEFAULT: ColorFormat[] = ["hex", "rgb", "hsl", "hwb", "hsv", "cmyk", "lab", "lch", "oklab", "oklch", "p3"];

const T = {
  ru: { copy: "Копировать", copied: "Скопировано" },
  en: { copy: "Copy", copied: "Copied" },
} as const;

/**
 * Quiet list of a color in every format. The whole row copies its value (a faint copy icon, brighter on hover);
 * a copied row turns green and says so.
 */
export function FormatList({ color, locale, formats = DEFAULT, className }: { color: Color; locale: Locale; formats?: ColorFormat[]; className?: string }) {
  const t = T[locale];
  const [copied, setCopied] = useState<ColorFormat | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <ul className={cn("grid gap-0.5 sm:grid-cols-2", className)}>
      {formats.map((f) => {
        const v = formatColor(color, f);
        const done = copied === f;
        return (
          <li key={f} className="min-w-0">
            <button
              type="button"
              className={cn(
                "group flex min-h-12 w-full items-center justify-between gap-2 rounded-[0.75rem] px-3 py-1.5 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2 active:bg-surface-3",
                done && "bg-ok-soft hover:bg-ok-soft",
              )}
              title={`${t.copy} ${FORMAT_LABEL[f]}`}
              onClick={async () => {
                if (await copyText(v)) {
                  setCopied(f);
                  if (timer.current) clearTimeout(timer.current);
                  timer.current = setTimeout(() => setCopied(null), 1200);
                }
              }}
            >
              <span className="min-w-0">
                <span className={cn("block text-xs", done ? "font-medium text-ok" : "text-fg-3")}>{done ? t.copied : FORMAT_LABEL[f]}</span>
                <code className="block font-mono text-[0.8125rem] break-all text-fg">{v}</code>
              </span>
              <span className={cn("shrink-0 transition-opacity", done ? "text-ok" : "text-fg-3 opacity-40 group-hover:opacity-100 group-focus-visible:opacity-100")}>
                {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                <span className="sr-only">{done ? t.copied : t.copy}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
