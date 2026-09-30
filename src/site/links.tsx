import Link from "next/link";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { LinkItem } from "@/registry/types";
import { IconTile } from "@/ui/icon";

export function LinkChips({ items, locale, className }: { items: LinkItem[]; locale: Locale; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((it) => (
        <li key={it.path.join("/")}>
          <Link href={href(locale, it.path)} className="chip" title={it.hint}>
            {it.glyph && <span className="text-base leading-none">{it.glyph}</span>}
            {it.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LinkCards({ items, locale, className }: { items: LinkItem[]; locale: Locale; className?: string }) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((it) => (
        <li key={it.path.join("/")}>
          <ToolCard item={it} locale={locale} />
        </li>
      ))}
    </ul>
  );
}

export function ToolCard({ item, locale }: { item: LinkItem; locale: Locale }) {
  return (
    <Link href={href(locale, item.path)} className="card">
      {item.glyph ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-2xl">{item.glyph}</span>
      ) : (
        <IconTile name={item.icon} hue={item.hue} />
      )}
      <span className="min-w-0 flex-1">
        <span className="card-t">{item.label}</span>
        {item.hint && <span className="card-h">{item.hint}</span>}
      </span>
    </Link>
  );
}

export function GlyphGrid({
  items,
  locale,
  className,
}: {
  items: { glyph: string; label: string; path?: string[] }[];
  locale: Locale;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2", className)}>
      {items.map((it, i) => {
        const inner = (
          <>
            <span className="text-3xl leading-none">{it.glyph}</span>
            <span className="line-clamp-2 text-center text-[11px] leading-tight text-fg-3">{it.label}</span>
          </>
        );
        return (
          <li key={i}>
            {it.path ? (
              <Link href={href(locale, it.path)} className="glyph" title={it.label}>
                {inner}
              </Link>
            ) : (
              <div className="glyph">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
