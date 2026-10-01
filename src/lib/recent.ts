/** Recently opened tools, stored per browser (no server). */
interface RecentItem {
  path: string[];
  title: string;
  locale?: string;
}

const KEY = "recent-tools:v2";
const MAX = 12;

export function readRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(list) ? list.filter((x) => Array.isArray(x.path) && typeof x.title === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecent(item: RecentItem): void {
  try {
    const key = item.path.join("/");
    const list = readRecent().filter((x) => !(x.path.join("/") === key && x.locale === item.locale));
    list.unshift(item);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage unavailable (private mode) — ignore
  }
}
