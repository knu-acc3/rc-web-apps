import Link from "@/ui/link";
import { ChevronRight } from "lucide-react";
import { href, type Locale } from "@/i18n/config";
import type { Crumb } from "@/registry/types";

export function Breadcrumbs({ items, current, locale }: { items: Crumb[]; current: string; locale: Locale }) {
  return (
    <nav aria-label="breadcrumbs" className="mb-3 overflow-x-auto scrollbar-thin">
      <ol className="flex items-center gap-1 text-sm whitespace-nowrap text-fg-3">
        {items.map((c) => (
          <li key={c.path.join("/") || "home"} className="flex items-center gap-1">
            <Link href={href(locale, c.path)} className="hover:text-accent">
              {c.name}
            </Link>
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
