"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { prepare, searchIndex, type IndexedEntry, type PackedEntry } from "@/lib/search";

/** "Maybe you were looking for": the words of the broken URL run through the site search. */
export function NotFoundSuggestions({ locale, title }: { locale: Locale; title: string }) {
  const [items, setItems] = useState<IndexedEntry[]>([]);
  useEffect(() => {
    const words = decodeURIComponent(window.location.pathname)
      .replace(/^\/(ru|en)(?=\/|$)/, "")
      .split(/[/_\-.]+/)
      .filter((w) => w && !/^\d+$/.test(w))
      .join(" ");
    if (!words) return;
    let alive = true;
    fetch(`/${locale}/search.json`)
      .then((r) => r.json() as Promise<PackedEntry[]>)
      .then((packed) => {
        if (alive) setItems(searchIndex(prepare(packed), words).slice(0, 6));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [locale]);
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-fg">{title}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((e) => (
          <li key={e.path}>
            <a href={e.path} className="chip">
              {e.glyph && <span className="text-base leading-none">{e.glyph}</span>}
              {e.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
