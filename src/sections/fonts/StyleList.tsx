"use client";

import { Check, Copy } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { STYLE_NAMES } from "./names";
import { STYLES, X_LIMIT, xWeightedLength, type StyleId } from "./styles";
import type { Strings } from "./strings";

/**
 * Quiet list of styles. Each row is one button: click (or Enter) copies the
 * styled text and makes it the selected style — no per-row button clutter.
 */
export function StyleList({
  title,
  aside,
  ids,
  outputs,
  selected,
  copied,
  onPick,
  locale,
  t,
  cyr,
  xCounter,
}: {
  title: string;
  aside?: ReactNode;
  ids: StyleId[];
  outputs: Record<StyleId, string>;
  selected: StyleId;
  copied: StyleId | null;
  onPick: (id: StyleId) => void;
  locale: Locale;
  t: Strings;
  /** Input contains Cyrillic → mention styles that leave it unchanged. */
  cyr: boolean;
  xCounter?: boolean;
}) {
  if (!ids.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
        <h2 className="text-sm font-semibold text-fg-2">{title}</h2>
        {aside}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-[12px] border border-line bg-surface">
        {ids.map((id) => {
          const info = STYLES[id];
          const text = outputs[id];
          const isCopied = copied === id;
          const note = cyr && info.cyr !== "full" ? (info.cyr === "none" ? t.badgeNone : t.badgePartial) : null;
          const x = xCounter ? xWeightedLength(text) : 0;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onPick(id)}
                aria-pressed={selected === id}
                title={t.clickToCopy}
                className={cn(
                  "flex w-full items-center gap-3 px-4 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2",
                  info.random ? "overflow-hidden py-4" : "py-3",
                  selected === id && "bg-accent-soft hover:bg-accent-soft",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] leading-5 text-fg-3">
                    <span className="sr-only">{t.copy}: </span>
                    {STYLE_NAMES[id][locale]}
                    {note && <span> · {note}</span>}
                    {xCounter && <span className={cn("tabular", x > X_LIMIT && "text-err")}> · {x}/{X_LIMIT}</span>}
                  </span>
                  <span className="mt-0.5 block text-lg leading-relaxed whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">{text}</span>
                </span>
                <span aria-hidden className={cn("shrink-0 [&_svg]:size-4", isCopied ? "text-ok" : "text-fg-3 opacity-60")}>
                  {isCopied ? <Check /> : <Copy />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
