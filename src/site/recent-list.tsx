"use client";

import Link from "next/link";
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
    <section className="mb-12">
      <h2 className="mb-3 text-xl font-semibold text-fg">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.path.join("/")}>
            <Link
              href={`/${locale}/${it.path.join("/")}`}
              className="inline-flex h-9 items-center rounded-full border border-line bg-surface px-3.5 text-sm text-fg hover:border-accent hover:text-accent"
            >
              {it.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
