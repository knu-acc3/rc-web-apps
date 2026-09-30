"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { CopyButton } from "@/ui/copy-button";
import { Panel, PanelHeader } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { charFacts, INVISIBLE, type UnicodeClass } from "./invisible";
import { codePoint } from "./styles";
import type { Strings } from "./strings";

const COUNTS = ["1", "2", "3", "5", "10"] as const;
type Count = (typeof COUNTS)[number];

/** Blank/invisible characters with a width preview and copy buttons. */
export function InvisiblePanel({ locale, t }: { locale: Locale; t: Strings }) {
  const [count, setCount] = useState<Count>("1");
  const cls: Record<UnicodeClass, string> = {
    letter: t.unicodeLetter,
    symbol: t.unicodeSymbol,
    format: t.unicodeFormat,
    space: t.unicodeSpace,
    mark: t.unicodeMark,
  };
  return (
    <Panel>
      <PanelHeader
        title={t.invisibleTitle}
        actions={<Segmented label={t.copyCount} value={count} onChange={setCount} options={COUNTS.map((c) => ({ value: c, label: `×${c}` }))} size="sm" />}
      />
      <ul>
        {INVISIBLE.map((c) => {
          const ch = String.fromCodePoint(c.cp);
          const f = charFacts(c.cp);
          const label = c.label[locale];
          return (
            <li key={c.cp} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
              <span className="flex h-9 shrink-0 items-center font-mono text-fg-3" title={t.width} aria-hidden>
                [<span className="inline-block h-6 bg-accent-soft whitespace-pre">{ch}</span>]
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-fg">{label}</span>
                <span className="block text-[13px] text-fg-3">
                  {codePoint(ch)} · {cls[f.cls]}
                </span>
              </span>
              <CopyButton value={ch.repeat(Number(count))} label={`${t.copy}: ${label}`} copiedLabel={t.copied} size="icon" variant="outline" />
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
