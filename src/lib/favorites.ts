/** Favourite tools, stored per browser (no server). Components subscribe to "favorites-change". */
export interface FavoriteItem {
  path: string[];
  title: string;
  locale?: string;
}

const KEY = "favorites:v1";
const MAX = 30;
const EVENT = "favorites-change";

export function readFavorites(): FavoriteItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    return Array.isArray(list) ? list.filter((x) => Array.isArray(x.path) && typeof x.title === "string") : [];
  } catch {
    return [];
  }
}

export function isFavorite(path: string[], locale: string): boolean {
  const key = path.join("/");
  return readFavorites().some((x) => x.path.join("/") === key && x.locale === locale);
}

/** Add or remove; returns the new state. */
export function toggleFavorite(item: FavoriteItem): boolean {
  const key = item.path.join("/");
  const list = readFavorites();
  const has = list.some((x) => x.path.join("/") === key && x.locale === item.locale);
  const next = has ? list.filter((x) => !(x.path.join("/") === key && x.locale === item.locale)) : [item, ...list].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable (private mode)
  }
  window.dispatchEvent(new Event(EVENT));
  return !has;
}

export function onFavoritesChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener("storage", fn);
  };
}
