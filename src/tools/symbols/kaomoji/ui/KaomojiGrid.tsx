"use client";

import type { MouseEventHandler } from "react";
import s from "./KaomojiGrid.module.css";

/** Characters that usually render about twice as wide as Latin letters (CJK, fullwidth, box drawing, shapes). */
const WIDE = /[ᄀ-ᅟ─-◿⺀-꓏가-힣豈-﫿︰-﹏！-｠￠-￦]/u;

/** Approximate width in Latin-letter units; combining marks take no space. */
function visualWidth(k: string): number {
  let w = 0;
  for (const ch of k) w += /\p{M}/u.test(ch) ? 0 : WIDE.test(ch) ? 2 : 1;
  return w;
}

/** Long scenes get two columns so they stay on one line at 360 px. */
const isLong = (k: string) => visualWidth(k) > 13;

/**
 * Grid of kaomoji tiles. One shared click handler reads the kaomoji from the button text, so
 * hundreds of tiles don't each allocate a closure. Native buttons: Enter/Space work out of the box.
 */
export function KaomojiGrid({
  items,
  copied,
  onPick,
  copyLabel,
  size = "md",
}: {
  items: readonly string[];
  copied: string | null;
  onPick: MouseEventHandler<HTMLButtonElement>;
  copyLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <ul className={size === "sm" ? `${s.grid} ${s.small}` : s.grid}>
      {items.map((k) => (
        <li key={k} className={size === "md" && isLong(k) ? s.wide : undefined}>
          <button type="button" onClick={onPick} aria-label={`${copyLabel} ${k}`} data-copied={k === copied ? "" : undefined} className={s.tile}>
            {k}
          </button>
        </li>
      ))}
    </ul>
  );
}
