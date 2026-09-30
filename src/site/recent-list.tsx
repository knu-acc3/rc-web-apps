"use client";

import Link from "@/ui/link";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { readRecent, type RecentItem } from "@/lib/recent";

/** "Recently used" row on the home page (browser-only data). */
export function RecentList({ locale, title }: { locale: Locale; title: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only available after mount
    setItems(readRecent().filter((x) => x.locale === locale).slice(0, 8));
  }, [locale]);

  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-fg sm:text-2xl">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.path.join("/")}>
            <Link
              href={`/${locale}/${it.path.join("/")}`}
              className="chip"
            >
              {it.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
