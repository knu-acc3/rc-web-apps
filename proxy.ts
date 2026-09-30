import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_REDIRECTS } from "@/config/redirects";
import { allPaths } from "@/registry";
import { convertRedirect } from "@/sections/convert/section";

/**
 * Every page request passes here:
 *  - known pages go straight through;
 *  - old URLs (previous site, /convert/…, typed aliases like /km-to-miles, UPPER case, missing /ru) get a 301;
 *  - anything else is answered with the site's own 404 page and status 404. Unknown URLs never reach the
 *    page renderer, so they can't be cached (a flood of random URLs can't fill the disk).
 */
const LOCALES = new Set(["ru", "en"]);
/** Pages that live outside the section registry. */
const EXTRA = ["", "all"];

let known: Set<string> | null = null;
function knownPaths(): Set<string> {
  known ??= new Set([...EXTRA, ...allPaths().map((p) => p.join("/"))]);
  return known;
}

function to(request: NextRequest, locale: string, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${path ? `/${path}` : ""}`;
  url.search = "";
  return NextResponse.redirect(url, 301);
}

function legacy(rest: string[]): string | undefined {
  const key = rest.join("/");
  const hit = LEGACY_REDIRECTS[key];
  if (hit !== undefined) return hit;
  if (rest[0] === "catalog") return "all";
  if (rest[0] === "emojis") return "emoji";
  return undefined;
}

export function proxy(request: NextRequest) {
  const segs = request.nextUrl.pathname
    .split("/")
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });
  const hasLocale = LOCALES.has(segs[0]);
  const locale = hasLocale ? segs[0] : "ru";
  const rest = hasLocale ? segs.slice(1) : segs;
  const key = rest.join("/");
  const paths = knownPaths();

  if (hasLocale && paths.has(key)) return NextResponse.next();

  const old = legacy(rest);
  if (old !== undefined) return to(request, locale, old);
  const moved = convertRedirect(rest.map((s) => s.toLowerCase()));
  if (moved) return to(request, locale, moved.join("/"));
  const lower = key.toLowerCase();
  if (paths.has(lower) && (lower !== key || !hasLocale)) return to(request, locale, lower);
  const lowerLocale = segs[0]?.toLowerCase();
  if (!hasLocale && LOCALES.has(lowerLocale) && paths.has(segs.slice(1).join("/").toLowerCase())) return to(request, lowerLocale, segs.slice(1).join("/").toLowerCase());

  return NextResponse.rewrite(new URL(`/${locale}/404`, request.url), { status: 404 });
}

// Pages only: not Next's assets, generated images, sitemaps or any file with an extension.
export const config = {
  matcher: ["/((?!_next/|og/|fonts/|vendor/|sitemaps/|.*\\.[A-Za-z0-9]+$).*)"],
};
