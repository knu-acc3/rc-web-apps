"use client";

import { Check, Link2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/favorites";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/button";

const T = {
  ru: { add: "В избранное", remove: "Убрать из избранного", share: "Поделиться ссылкой", copied: "Ссылка скопирована" },
  en: { add: "Add to favourites", remove: "Remove from favourites", share: "Share link", copied: "Link copied" },
} as const;

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
    <div className="flex shrink-0 items-center gap-1.5">
      <IconButton
        variant="tonal"
        onClick={() => setFav(toggleFavorite({ path, title, locale }))}
        selected={fav}
        label={fav ? t.remove : t.add}
        icon={<Star className={cn(fav && "fill-current")} aria-hidden />}
      />
      <IconButton variant="tonal" onClick={share} label={copied ? t.copied : t.share} icon={copied ? <Check aria-hidden /> : <Link2 aria-hidden />} />
    </div>
  );
}
