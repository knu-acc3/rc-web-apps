"use client";

import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/cn";
import type { JsonNode } from "../lib/run";
import { CODE_T } from "../content/text";

const VALUE_CLASS: Record<JsonNode["t"], string> = {
  s: "text-ok",
  n: "text-accent",
  b: "text-warn",
  z: "text-fg-3",
  o: "text-fg-3",
  a: "text-fg-3",
};

function Node({ node, depth, locale, isIndex, autoOpen }: { node: JsonNode; depth: number; locale: Locale; isIndex: boolean; autoOpen: boolean }) {
  const [open, setOpen] = useState(autoOpen);
  const container = node.t === "o" || node.t === "a";
  const size = node.size ?? 0;
  const key =
    node.k === undefined ? null : isIndex ? (
      <span className="text-fg-3">{node.k}: </span>
    ) : (
      <span className="text-fg">
        {JSON.stringify(node.k)}
        <span className="text-fg-3">: </span>
      </span>
    );
  if (!container) {
    return (
      <li className="break-all py-px pl-5">
        {key}
        <span className={VALUE_CLASS[node.t]}>{node.t === "s" ? JSON.stringify(node.v) : node.v}</span>
      </li>
    );
  }
  const brackets = node.t === "o" ? ["{", "}"] : ["[", "]"];
  const hidden = size - (node.c?.length ?? 0);
  return (
    <li className="py-px">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} disabled={!size} className="inline-flex max-w-full items-start gap-1 rounded-[0.25rem] text-left hover:bg-surface-2 disabled:hover:bg-transparent">
        <ChevronRight aria-hidden className={cn("mt-[0.1875rem] size-4 shrink-0 text-fg-3 transition-transform", open && size ? "rotate-90" : "", !size && "invisible")} />
        <span className="break-all">
          {key}
          <span className="text-fg-3">
            {brackets[0]}
            {!open || !size ? (
              <>
                {size ? ` ${formatNumber(locale, size)} ` : ""}
                {brackets[1]}
              </>
            ) : null}
          </span>
        </span>
      </button>
      {open && size > 0 && (
        <>
          <ul className="ml-2 border-l border-line pl-2">
            {node.c?.map((c, i) => (
              <Node key={i} node={c} depth={depth + 1} locale={locale} isIndex={node.t === "a"} autoOpen={depth === 0 && (node.c?.length ?? 0) <= 20} />
            ))}
            {hidden > 0 && <li className="py-px pl-5 text-fg-3">{CODE_T[locale].more(formatNumber(locale, hidden))}</li>}
          </ul>
          <div className="pl-5 text-fg-3">{brackets[1]}</div>
        </>
      )}
    </li>
  );
}

/** Lazily expanded JSON tree: children are rendered only when their parent is open. */
export function JsonTree({ root, locale, label }: { root: JsonNode; locale: Locale; label: string }) {
  return (
    <ul aria-label={label} className="max-h-[34rem] min-h-32 overflow-auto px-2 py-2.5 font-mono text-sm leading-relaxed">
      <Node node={root} depth={0} locale={locale} isIndex={false} autoOpen />
    </ul>
  );
}
