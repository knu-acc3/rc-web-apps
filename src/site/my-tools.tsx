"use client";

import { Clock3, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { onFavoritesChange, readFavorites, type FavoriteItem } from "@/lib/favorites";
import { readRecent } from "@/lib/recent";

/** Home page: the visitor's favourites and recently used tools (browser-only data). */
export function MyTools({ locale, labels }: { locale: Locale; labels: { favorites: string; recent: string } }) {
  const [fav, setFav] = useState<FavoriteItem[]>([]);
  const [recent, setRecent] = useState<FavoriteItem[]>([]);
  useEffect(() => {
    const sync = () => {
      const f = readFavorites().filter((x) => x.locale === locale);
      const keys = new Set(f.map((x) => x.path.join("/")));
      setFav(f);
      setRecent(readRecent().filter((x) => x.locale === locale && !keys.has(x.path.join("/"))).slice(0, 8));
    };
    sync();
    return onFavoritesChange(sync);
  }, [locale]);
  if (fav.length === 0 && recent.length === 0) return null;
  const row = (items: FavoriteItem[], title: string, Icon: typeof Star) =>
    items.length > 0 && (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <h2 className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-fg-2">
          <Icon className="size-4 text-accent" aria-hidden />
          {title}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {items.map((it) => (
            <li key={it.path.join("/")}>
              <a href={`/${locale}/${it.path.join("/")}`} className="chip">
                {it.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  return (
    <section className="panel flex flex-col gap-4 p-4 sm:p-5">
      {row(fav, labels.favorites, Star)}
      {row(recent, labels.recent, Clock3)}
    </section>
  );
}
