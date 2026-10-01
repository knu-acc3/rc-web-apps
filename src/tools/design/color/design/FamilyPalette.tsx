"use client";

import Link from "@/ui/link";
import { useEffect, useRef, useState } from "react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/clipboard";
import { Segmented } from "@/ui/segmented";

/** One shade of a palette family, precomputed on the server. */
export interface FamilyRow {
  step: string;
  /** sRGB hex (for Tailwind v4: gamut-mapped from OKLCH). */
  hex: string;
  /** Tailwind v4 OKLCH value. */
  oklch?: string;
  /** Tailwind v3 hex. */
  v3?: string;
  /** Token used in class names / variables, e.g. "red-500". */
  token: string;
  /** Readable text color on this swatch. */
  fg: string;
}

export interface FamilyData {
  slug: string;
  label: string;
  rows: FamilyRow[];
  /** Path of the family page. */
  path: string[];
}

type Fmt = "class" | "oklch" | "hex" | "v3" | "var";

const T = {
  ru: { format: "Что копировать", copy: "Копировать", copied: "Скопировано", cls: "Класс", var: "CSS-переменная", v3: "HEX v3" },
  en: { format: "What to copy", copy: "Copy", copied: "Copied", cls: "Class", var: "CSS variable", v3: "HEX v3" },
} as const;

function valueOf(r: FamilyRow, fmt: Fmt, kind: "tailwind" | "material"): string {
  switch (fmt) {
    case "class":
      return `bg-${r.token}`;
    case "oklch":
      return r.oklch ?? r.hex;
    case "v3":
      return r.v3 ?? r.hex;
    case "var":
      return kind === "tailwind" ? `var(--color-${r.token})` : `var(--md-${r.token})`;
    default:
      return r.hex;
  }
}

/** Shared view of Tailwind and Material palettes: all families (hub) or one family (detail). */
export default function FamilyPalette({ locale, kind, families, single = false }: { locale: Locale; kind: "tailwind" | "material"; families: FamilyData[]; single?: boolean }) {
  const t = T[locale];
  const [fmt, setFmt] = useState<Fmt>(kind === "tailwind" ? "class" : "hex");
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy(key: string, value: string) {
    if (await copyText(value)) {
      setCopied(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 1200);
    }
  }
  const options: { value: Fmt; label: string }[] =
    kind === "tailwind"
      ? [
          { value: "class", label: t.cls },
          { value: "oklch", label: "OKLCH (v4)" },
          { value: "hex", label: "HEX" },
          { value: "v3", label: t.v3 },
        ]
      : [
          { value: "hex", label: "HEX" },
          { value: "var", label: t.var },
        ];

  return (
    <div className="flex flex-col gap-4">
      <Segmented label={t.format} value={fmt} onChange={setFmt} options={options} size="sm" className="self-start" />
      {single ? (
        <ul className="overflow-hidden rounded-[1.25rem] shadow-card">
          {families[0].rows.map((r) => {
            const v = valueOf(r, fmt, kind);
            const key = `${families[0].slug}-${r.step}`;
            return (
              <li key={r.step}>
                <button
                  type="button"
                  className="relative flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left after:pointer-events-none after:absolute after:inset-0 after:bg-current after:opacity-0 after:transition-opacity hover:after:opacity-10 focus-visible:outline-offset-[-3px] active:after:opacity-20 sm:px-5 sm:py-4"
                  style={{ background: r.hex, color: r.fg }}
                  onClick={() => copy(key, v)}
                  aria-label={`${t.copy} ${v}`}
                >
                  <span className="text-lg font-semibold tabular">{r.step}</span>
                  <span className="min-w-0 truncate font-mono text-sm font-medium">{copied === key ? `✓ ${t.copied}` : v}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col gap-2.5">
          {families.map((f) => (
            <div key={f.slug} className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
              <Link href={href(locale, f.path)} className="truncate text-sm font-medium text-fg hover:text-accent">
                {f.label}
              </Link>
              <ul className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${f.rows.length}, minmax(0, 1fr))` }}>
                {f.rows.map((r) => {
                  const v = valueOf(r, fmt, kind);
                  const key = `${f.slug}-${r.step}`;
                  return (
                    <li key={r.step}>
                      <button
                        type="button"
                        title={`${r.token} · ${v}`}
                        aria-label={`${t.copy} ${v}`}
                        onClick={() => copy(key, v)}
                        className={cn(
                          "flex h-9 w-full items-center justify-center rounded-[0.375rem] text-[0.625rem] font-medium transition-[transform,box-shadow] duration-150 hover:relative hover:z-10 hover:scale-110 hover:shadow-elev-2 active:scale-100 sm:h-11",
                          copied === key && "text-sm font-bold",
                        )}
                        style={{ background: r.hex, color: r.fg }}
                      >
                        {copied === key ? "✓" : <span className="hidden md:inline">{r.step}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
