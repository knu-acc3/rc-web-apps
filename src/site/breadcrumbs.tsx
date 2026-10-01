import Link from "@/ui/link";
import { ChevronRight, House } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Crumb } from "@/registry/types";

/**
 * One line that never scrolls: long names are cut with an ellipsis, and on a phone only the home link and the
 * nearest parent stay (the page title is right below anyway).
 */
export function Breadcrumbs({ items, current, locale, className }: { items: Crumb[]; current: string; locale: Locale; className?: string }) {
  const last = items.length - 1;
  return (
    <nav aria-label={locale === "ru" ? "Навигация по разделам" : "Breadcrumbs"} className={cn("mb-3 min-w-0 overflow-hidden", className)}>
      <ol className="flex min-w-0 items-center gap-1 text-sm whitespace-nowrap text-fg-3">
        {items.map((c, i) => (
          <li key={c.path.join("/") || "home"} className={cn("flex min-w-0 shrink items-center gap-1", i > 0 && i < last && "max-sm:hidden")}>
            {c.path.length === 0 ? (
              // Home is a house icon: the word takes a third of a phone's width.
              <Link href={href(locale, c.path)} className="btn btn-neutral btn-round size-8 shrink-0 [&_svg]:size-4" title={c.name}>
                <House aria-hidden />
                <span className="sr-only">{c.name}</span>
              </Link>
            ) : (
              <Link href={href(locale, c.path)} className="min-w-0 truncate rounded-md hover:text-accent hover:underline hover:underline-offset-2">
                {c.name}
              </Link>
            )}
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          </li>
        ))}
        <li aria-current="page" className="min-w-0 truncate text-fg-2">
          {current}
        </li>
      </ol>
    </nav>
  );
}
