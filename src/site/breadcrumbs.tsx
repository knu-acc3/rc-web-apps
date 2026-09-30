import Link from "@/ui/link";
import { ChevronRight, House } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import type { Crumb } from "@/registry/types";

export function Breadcrumbs({ items, current, locale, className }: { items: Crumb[]; current: string; locale: Locale; className?: string }) {
  return (
    <nav aria-label={locale === "ru" ? "Навигация по разделам" : "Breadcrumbs"} className={cn("mb-3 overflow-x-auto scrollbar-thin", className)}>
      <ol className="flex items-center gap-1 text-sm whitespace-nowrap text-fg-3">
        {items.map((c) => (
          <li key={c.path.join("/") || "home"} className="flex items-center gap-1">
            {c.path.length === 0 ? (
              // Home is a house icon: the word takes a third of a phone's width.
              <Link href={href(locale, c.path)} className="-m-1.5 inline-flex p-1.5 hover:text-accent" title={c.name}>
                <House className="size-4" aria-hidden />
                <span className="sr-only">{c.name}</span>
              </Link>
            ) : (
              <Link href={href(locale, c.path)} className="hover:text-accent">
                {c.name}
              </Link>
            )}
            <ChevronRight className="size-3.5" aria-hidden />
          </li>
        ))}
        <li aria-current="page" className="truncate text-fg-2">
          {current}
        </li>
      </ol>
    </nav>
  );
}
