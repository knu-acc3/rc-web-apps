"use client";

import { Check, Link2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/cn";

const T = {
  ru: { add: "В избранное", remove: "Убрать из избранного", share: "Поделиться ссылкой", copied: "Ссылка скопирована" },
  en: { add: "Add to favourites", remove: "Remove from favourites", share: "Share link", copied: "Link copied" },
} as const;

const btn = "inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-fg-2 transition-colors hover:border-line-strong hover:text-fg";

/** ★ and share next to the page title: icons only, labelled for screen readers and tooltips. */
export function PageActions({ path, title, locale }: { path: string[]; title: string; locale: "ru" | "en" }) {
  const t = T[locale];
  const [fav, setFav] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const sync = () => setFav(isFavorite(path, locale));
    sync();
    return onFavoritesChange(sync);
  }, [path, locale]);

  async function share() {
    const url = window.location.href.split("#")[0];
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setFav(toggleFavorite({ path, title, locale }))}
        aria-pressed={fav}
        aria-label={fav ? t.remove : t.add}
        title={fav ? t.remove : t.add}
        className={cn(btn, fav && "border-accent text-accent hover:text-accent")}
      >
        <Star className={cn("size-[1.125rem]", fav && "fill-current")} aria-hidden />
      </button>
      <button type="button" onClick={share} aria-label={copied ? t.copied : t.share} title={copied ? t.copied : t.share} className={btn}>
        {copied ? <Check className="size-[1.125rem] text-ok" aria-hidden /> : <Link2 className="size-[1.125rem]" aria-hidden />}
      </button>
    </div>
  );
}
