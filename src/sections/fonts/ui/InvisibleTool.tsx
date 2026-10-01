"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/ui/copy-button";
import { Panel } from "@/ui/panel";
import { Segmented } from "@/ui/segmented";
import { charFacts, INVISIBLE, type UnicodeClass } from "../lib/invisible";
import { codePoint } from "../lib/styles";
import type { Strings } from "../content/strings";
import { useCopyFlash } from "../lib/use-flash";

const COUNTS = ["1", "2", "3", "5", "10"] as const;
type Count = (typeof COUNTS)[number];

/** Invisible characters: the selected one large with a copy button, the rest as a quiet list. */
export function InvisibleTool({ locale, t }: { locale: Locale; t: Strings }) {
  const [sel, setSel] = useState(0);
  const [count, setCount] = useState<Count>("1");
  const [copied, copy] = useCopyFlash<number>();
  const cls: Record<UnicodeClass, string> = {
    letter: t.unicodeLetter,
    symbol: t.unicodeSymbol,
    format: t.unicodeFormat,
    space: t.unicodeSpace,
    mark: t.unicodeMark,
  };
  const n = Number(count);
  const cur = INVISIBLE[sel];
  const curCh = String.fromCodePoint(cur.cp);

  return (
    <div className="flex flex-col gap-6">
      <Panel className="p-4 sm:p-5">
        <div className="text-[0.8125rem] font-medium text-fg-2">
          {cur.label[locale]} · {codePoint(curCh)}
        </div>
        <div className="mt-3 flex min-h-24 items-center justify-center rounded-[0.625rem] bg-surface-2 font-mono text-4xl text-fg-3" title={t.width}>
          <span aria-hidden>[</span>
          <span className="inline-block h-10 bg-accent-soft whitespace-pre">{curCh.repeat(n)}</span>
          <span aria-hidden>]</span>
        </div>
        <p className="mt-2 text-[0.8125rem] text-fg-3">{cur.use[locale]}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented label={t.copyCount} value={count} onChange={setCount} options={COUNTS.map((c) => ({ value: c, label: `×${c}` }))} size="sm" />
          <CopyButton value={curCh.repeat(n)} label={t.copy} copiedLabel={t.copied} variant="primary" size="md" />
        </div>
      </Panel>

      <ul className="divide-y divide-line overflow-hidden rounded-[0.75rem] border border-line bg-surface">
        {INVISIBLE.map((c, i) => {
          const ch = String.fromCodePoint(c.cp);
          return (
            <li key={c.cp}>
              <button
                type="button"
                aria-pressed={sel === i}
                title={t.clickToCopy}
                onClick={() => {
                  setSel(i);
                  void copy(i, ch.repeat(n));
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-2 focus-visible:bg-surface-2",
                  sel === i && "bg-accent-soft hover:bg-accent-soft",
                )}
              >
                <span aria-hidden className="flex w-16 shrink-0 items-center justify-center font-mono text-fg-3">
                  [<span className="inline-block h-5 bg-accent-soft whitespace-pre">{ch}</span>]
                </span>
                <span className="min-w-0 flex-1">
                  <span className="sr-only">{t.copy}: </span>
                  <span className="block truncate text-[0.9375rem] text-fg">{c.label[locale]}</span>
                  <span className="block text-[0.75rem] text-fg-3">
                    {codePoint(ch)} · {cls[charFacts(c.cp).cls]}
                  </span>
                </span>
                <span aria-hidden className={cn("shrink-0 [&_svg]:size-4", copied === i ? "text-ok" : "text-fg-3 opacity-60")}>
                  {copied === i ? <Check /> : <Copy />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {copied !== null ? t.copied : ""}
      </p>
    </div>
  );
}
