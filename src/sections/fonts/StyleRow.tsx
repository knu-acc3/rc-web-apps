"use client";

import { RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";
import { CopyButton } from "@/ui/copy-button";
import { Badge } from "@/ui/panel";
import { STYLE_NAMES } from "./names";
import { STYLES, type StyleId } from "./styles";
import type { Strings } from "./strings";

export function CyrBadge({ id, show, t }: { id: StyleId; show: boolean; t: Strings }) {
  const s = STYLES[id].cyr;
  if (!show || s === "full") return null;
  return (
    <Badge tone={s === "none" ? "neutral" : "warn"} className="px-2! py-0! text-[12px]!">
      {s === "none" ? t.badgeNone : t.badgePartial}
    </Badge>
  );
}

/** One style in the results list: name (link to its page), output, copy. */
export function StyleRow({
  id,
  locale,
  text,
  t,
  cyr,
  extra,
  onRegenerate,
}: {
  id: StyleId;
  locale: Locale;
  text: string;
  t: Strings;
  /** Input contains Cyrillic → show the support badge. */
  cyr: boolean;
  extra?: ReactNode;
  onRegenerate?: () => void;
}) {
  const name = STYLE_NAMES[id][locale];
  const random = STYLES[id].random;
  return (
    <li className={cn("flex items-start gap-3 border-b border-line px-4 last:border-b-0", random ? "overflow-hidden py-4" : "py-3")}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fg-3">
          <Link href={href(locale, ["fonts", id])} className="font-medium text-fg-2 hover:text-accent">
            {name}
          </Link>
          <CyrBadge id={id} show={cyr} t={t} />
          {extra}
        </div>
        <p className="mt-1 text-lg leading-relaxed whitespace-pre-wrap text-fg [overflow-wrap:anywhere]">{text}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1 pt-0.5">
        {onRegenerate && (
          <Button variant="ghost" size="icon-sm" onClick={onRegenerate} aria-label={`${t.regenerate}: ${name}`} title={t.regenerate}>
            <RefreshCw aria-hidden />
          </Button>
        )}
        <CopyButton value={text} size="icon-sm" variant="ghost" label={`${t.copy}: ${name}`} copiedLabel={t.copied} />
      </div>
    </li>
  );
}
