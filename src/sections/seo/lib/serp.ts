/* Google snippet truncation by rendered pixel width. The measure function is injected so the
   logic is testable; in the browser it is backed by canvas measureText with Google's fonts. */

export type Measure = (text: string) => number;

/** Approximate limits used by Google's result layout (they change over time; treat as guidance). */
export const LIMITS = {
  desktop: { title: 600, description: 920 },
  mobile: { title: 1000, description: 680 },
} as const;

export const FONTS = {
  desktopTitle: "20px Arial, sans-serif",
  mobileTitle: "20px Arial, sans-serif",
  description: "14px Arial, sans-serif",
};

export const ELLIPSIS = " ...";

/**
 * Cut `text` so that it fits into `max` pixels, preferring a word boundary, and append an
 * ellipsis. Returns the original text when it already fits.
 */
export function truncateToWidth(text: string, max: number, measure: Measure, ellipsis = ELLIPSIS): { text: string; truncated: boolean; width: number } {
  const clean = text.replace(/\s+/g, " ").trim();
  const full = measure(clean);
  if (full <= max) return { text: clean, truncated: false, width: full };
  // Largest prefix length that fits together with the ellipsis (binary search).
  let lo = 0;
  let hi = clean.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(clean.slice(0, mid).trimEnd() + ellipsis) <= max) lo = mid;
    else hi = mid - 1;
  }
  let cut = clean.slice(0, lo);
  const space = cut.lastIndexOf(" ");
  // Back off to the last whole word unless that would throw away too much.
  if (lo < clean.length && clean[lo] !== " " && space > lo * 0.6) cut = cut.slice(0, space);
  cut = cut.replace(/[\s,;:–—-]+$/, "");
  const out = cut + ellipsis;
  return { text: out, truncated: true, width: measure(out) };
}

/** Human-readable URL line of a Google result: "example.com › blog › post". */
export function breadcrumbUrl(url: string): { site: string; path: string } {
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`);
    const parts = u.pathname
      .split("/")
      .filter(Boolean)
      .map((p) => {
        try {
          return decodeURIComponent(p);
        } catch {
          return p;
        }
      });
    return { site: u.hostname.replace(/^www\./, ""), path: parts.length ? ` › ${parts.join(" › ")}` : "" };
  } catch {
    return { site: url, path: "" };
  }
}

/** Escape a value for an HTML attribute. */
export function attr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escape text content for HTML. */
export function html(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
