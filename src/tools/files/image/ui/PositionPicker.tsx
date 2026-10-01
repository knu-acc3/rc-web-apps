"use client";

import { Grid3x3 } from "lucide-react";
import { useRef } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Pos9 } from "../lib/types";

const ORDER: Pos9[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

const NAMES: Record<Locale, Record<Pos9 | "tile", string>> = {
  ru: {
    tl: "Сверху слева",
    tc: "Сверху по центру",
    tr: "Сверху справа",
    ml: "Слева по центру",
    mc: "По центру",
    mr: "Справа по центру",
    bl: "Снизу слева",
    bc: "Снизу по центру",
    br: "Снизу справа",
    tile: "Замостить всё изображение",
  },
  en: {
    tl: "Top left",
    tc: "Top centre",
    tr: "Top right",
    ml: "Middle left",
    mc: "Centre",
    mr: "Middle right",
    bl: "Bottom left",
    bc: "Bottom centre",
    br: "Bottom right",
    tile: "Tile over the whole image",
  },
};

/** 3×3 position grid + tile option; a radio group with arrow-key navigation. */
export function PositionPicker({
  value,
  onChange,
  locale,
  label,
  tile = true,
}: {
  value: Pos9 | "tile";
  onChange: (v: Pos9 | "tile") => void;
  locale: Locale;
  label: string;
  tile?: boolean;
}) {
  const n = NAMES[locale];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const all: (Pos9 | "tile")[] = tile ? [...ORDER, "tile"] : ORDER;
  const move = (i: number, d: number) => {
    const next = (i + d + all.length) % all.length;
    onChange(all[next]);
    refs.current[next]?.focus();
  };
  const btn = (p: Pos9 | "tile", i: number) => {
    const on = value === p;
    return (
      <button
        key={p}
        ref={(el) => {
          refs.current[i] = el;
        }}
        type="button"
        role="radio"
        aria-checked={on}
        aria-label={n[p]}
        title={n[p]}
        tabIndex={on ? 0 : -1}
        onClick={() => onChange(p)}
        onKeyDown={(e) => {
          const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? 3 : e.key === "ArrowUp" ? -3 : 0;
          if (!d) return;
          e.preventDefault();
          move(i, p === "tile" ? Math.sign(d) : d);
        }}
        className={cn(
          "flex items-center justify-center rounded-[0.3125rem] border transition-colors",
          p === "tile" ? "h-[4.75rem] w-9" : "size-6",
          on ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg-3 hover:border-line-strong",
        )}
      >
        {p === "tile" ? (
          <Grid3x3 className="size-4" aria-hidden />
        ) : (
          <span className={cn("size-1.5 rounded-full", on ? "bg-accent-fg" : "bg-fg-3")} aria-hidden />
        )}
      </button>
    );
  };
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg-2">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1.5">
        <div className="grid grid-cols-3 gap-1">{ORDER.map((p, i) => btn(p, i))}</div>
        {tile && btn("tile", 9)}
      </div>
    </div>
  );
}
