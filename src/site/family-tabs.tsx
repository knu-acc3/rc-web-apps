import { href, type Locale } from "@/i18n/config";
import { ui } from "@/i18n/ui";
import { cn } from "@/lib/cn";
import { familyOf } from "@/registry/families";
import { resolveRelatedKey } from "@/registry/tool-section";
import type { LinkItem } from "@/registry/types";
import { Icon } from "@/ui/icon";

const cache = new Map<string, LinkItem | null>();
function link(slug: string, locale: Locale): LinkItem | null {
  const key = `${locale}:${slug}`;
  if (!cache.has(key)) cache.set(key, resolveRelatedKey(slug, locale));
  return cache.get(key)!;
}

/** "Таймер онлайн" → "Таймер": tabs only need the name. */
export const shortLabel = (label: string) => label.replace(/\s+(онлайн|online)$/i, "");

/**
 * Tabs to the neighbours of a tool ("Timer · Stopwatch · Alarm"), above the tool. Plain links in one scrollable row:
 * on a phone the row scrolls sideways instead of wrapping into a wall of chips.
 */
export function FamilyTabs({ slug, locale, className }: { slug: string; locale: Locale; className?: string }) {
  const family = familyOf(slug);
  if (!family) return null;
  const items = family.map((s) => ({ slug: s, link: link(s, locale) })).filter((x): x is { slug: string; link: LinkItem } => !!x.link);
  if (items.length < 2) return null;
  return (
    <nav aria-label={ui(locale).family} className={cn("-mx-4 mb-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0", className)}>
      <ul className="flex w-max gap-1.5">
        {items.map(({ slug: s, link: l }) => {
          const current = s === slug;
          return (
            <li key={s}>
              <a
                href={href(locale, l.path)}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors pointer-coarse:h-9",
                  current ? "border-transparent bg-accent text-accent-fg" : "border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg",
                )}
              >
                <Icon name={l.icon} className="size-4" strokeWidth={1.75} />
                {shortLabel(l.label)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
