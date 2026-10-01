import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import { familyOf } from "@/registry/families";
import { resolveRelatedKey } from "@/registry/tool-section";
import type { LinkItem } from "@/registry/types";
import { Icon } from "@/ui/icon";
import { ScrollRow } from "@/ui/scroll-row";

const cache = new Map<string, LinkItem | null>();
function link(slug: string, locale: Locale): LinkItem | null {
  const key = `${locale}:${slug}`;
  if (!cache.has(key)) cache.set(key, resolveRelatedKey(slug, locale));
  return cache.get(key)!;
}

/** "Таймер онлайн" → "Таймер": tabs only need the name. */
export const shortLabel = (label: string) => label.replace(/\s+(онлайн|online)$/i, "");

/**
 * Tabs to the neighbours of a tool ("Timer · Stopwatch · Alarm"), above the tool: Material chips in one row. When
 * they don't fit, the row scrolls sideways with ‹ › buttons and faded edges, and the current tool is scrolled into view.
 */
export function FamilyTabs({ slug, locale, className }: { slug: string; locale: Locale; className?: string }) {
  const family = familyOf(slug);
  if (!family) return null;
  const items = family.map((s) => ({ slug: s, link: link(s, locale) })).filter((x): x is { slug: string; link: LinkItem } => !!x.link);
  if (items.length < 2) return null;
  return (
    <ScrollRow as="nav" label={ui(locale).family} className={cn("-mx-4 mb-4 px-4 sm:mx-0 sm:px-0", className)}>
      {items.map(({ slug: s, link: l }) => {
        const current = s === slug;
        return (
          <a key={s} href={href(locale, l.path)} aria-current={current ? "page" : undefined} className="chip chip-filled shrink-0 font-semibold">
            <Icon name={l.icon} className="size-4" strokeWidth={2} />
            {shortLabel(l.label)}
          </a>
        );
      })}
    </ScrollRow>
  );
}
