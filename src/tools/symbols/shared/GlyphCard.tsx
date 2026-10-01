"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";

export interface GlyphCardProps {
  locale: Locale;
  glyph: string;
  name: string;
  /** Alternative forms, e.g. skin tones: rows of [glyph, label]. */
  variants?: { title: string; items: [string, string][] }[];
  /** Extra copy buttons: [label, value], e.g. HTML entity or U+ code. */
  codes?: [string, string][];
  /** Text symbol (monospace-friendly look) instead of a color emoji. */
  kind?: "emoji" | "symbol";
  /** Visible placeholder for invisible characters (spaces, joiners). */
  display?: string;
}

const T = {
  ru: { copy: "Копировать", copied: "Скопировано", selected: "Выбрано" },
  en: { copy: "Copy", copied: "Copied", selected: "Selected" },
} as const;

export default function GlyphCard({ locale, glyph, name, variants, codes, kind = "emoji", display }: GlyphCardProps) {
  const t = T[locale];
  const [current, setCurrent] = useState(glyph);
  const [label, setLabel] = useState("");
  return (
    <Panel className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-stretch sm:gap-6">
      <div
        className={cn(
          "flex size-40 shrink-0 select-all items-center justify-center rounded-[0.75rem] bg-surface-2 leading-none sm:size-48",
          kind === "emoji" ? "text-[6rem] sm:text-[7.5rem]" : "text-[5.5rem] text-fg sm:text-[6.875rem]",
        )}
        title={name}
      >
        {display ? <span className="rounded-[0.375rem] border border-dashed border-line-strong px-3 py-2 font-mono text-lg text-fg-3">{display}</span> : current}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton value={current} label={`${t.copy} ${display ? "" : current}`.trim()} copiedLabel={t.copied} variant="primary" size="md" />
          {codes?.map(([l, v]) => (
            <CopyButton key={l} value={v} label={l} copiedLabel={t.copied} variant="outline" size="md" className="font-mono" />
          ))}
        </div>
        {variants?.map((row) => (
          <div key={row.title}>
            <p className="mb-1.5 text-sm font-medium text-fg-2">{row.title}</p>
            <div role="group" aria-label={row.title} className="flex flex-wrap gap-1">
              {row.items.map(([g, l]) => (
                <button
                  key={g}
                  type="button"
                  title={l}
                  aria-label={`${g} ${l}`}
                  aria-pressed={current === g}
                  onClick={() => {
                    setCurrent(g);
                    setLabel(l);
                  }}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-[0.5rem] border text-[1.625rem] leading-none transition-colors",
                    current === g ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        ))}
        {variants?.length ? (
          <p className="min-h-5 text-sm text-fg-3">
            {label && (
              <>
                {t.selected}: {current} — {label}
              </>
            )}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
