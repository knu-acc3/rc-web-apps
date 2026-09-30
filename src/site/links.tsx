import Link from "@/ui/link";
import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import type { LinkItem } from "@/registry/types";
import { IconTile } from "@/ui/icon";

function Chip({ it, locale }: { it: LinkItem; locale: Locale }) {
  return (
    <li>
      <a href={href(locale, it.path)} className="chip" title={it.hint}>
        {it.glyph && <span className="text-base leading-none">{it.glyph}</span>}
        {it.label}
      </a>
    </li>
  );
}

/**
 * Chip links. With `limit`, the rest stays in the HTML (crawlable) but folded behind "Show all · N" so long
 * variant lists don't bury the page.
 */
export function LinkChips({ items, locale, className, limit }: { items: LinkItem[]; locale: Locale; className?: string; limit?: number }) {
  const head = limit && items.length > limit + 4 ? items.slice(0, limit) : items;
  const rest = head === items ? [] : items.slice(head.length);
  return (
    <div className={className}>
      <ul className="flex flex-wrap gap-2">
        {head.map((it) => (
          <Chip key={it.path.join("/")} it={it} locale={locale} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-2">
          <summary className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-1 text-sm font-medium text-accent hover:underline group-open:hidden">
            {ui(locale).showAllCount} · {items.length}
          </summary>
          <ul className="flex flex-wrap gap-2">
            {rest.map((it) => (
              <Chip key={it.path.join("/")} it={it} locale={locale} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export function LinkCards({ items, locale, className }: { items: LinkItem[]; locale: Locale; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items.map((it) => (
        <li key={it.path.join("/")} className="min-w-0">
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
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[0.625rem] bg-surface-2 text-2xl">{item.glyph}</span>
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
    <ul className={cn("grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2", className)}>
      {items.map((it, i) => {
        const inner = (
          <>
            <span className="text-3xl leading-none">{it.glyph}</span>
            <span className="line-clamp-2 text-center text-[0.6875rem] leading-tight text-fg-3">{it.label}</span>
          </>
        );
        return (
          <li key={i}>
            {it.path ? (
              <a href={href(locale, it.path)} className="glyph" title={it.label}>
                {inner}
              </a>
            ) : (
              <div className="glyph">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
