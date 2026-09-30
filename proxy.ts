import { NextResponse, type NextRequest } from "next/server";
import { LEGACY_REDIRECTS } from "@/config/redirects";

/**
 * 301 redirects from the previous site's URLs (see src/config/redirects.ts). A map lookup keeps
 * ~800 legacy paths out of next.config redirects, which are matched one regex at a time.
 */
export function proxy(request: NextRequest) {
  const segs = request.nextUrl.pathname.split("/").filter(Boolean);
  const locale = segs[0] === "ru" || segs[0] === "en" ? segs.shift()! : "ru";
  const key = segs.join("/");
  let to = LEGACY_REDIRECTS[key];
  if (to === undefined && segs[0] === "catalog") to = "";
  if (to === undefined && segs[0] === "emojis") to = "emoji";
  if (to === undefined) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${to ? `/${to}` : ""}`;
  url.search = "";
  return NextResponse.redirect(url, 301);
}

// Only the first path segments the previous site used (with or without a locale prefix).
export const config = {
  matcher: [
    "/:locale(ru|en)/(tools|group|time-now|timer|what-is-my|actual-size|symbols|emojis|catalog|kz|favorites|privacy|terms)/:path*",
    "/(tools|group|time-now|timer|what-is-my|actual-size|symbols|emojis|catalog|kz|favorites|privacy|terms)/:path*",
  ],
};
