import { liveSections } from "@/registry";
import { newestLastmod, sectionLastmod, sitemapIndexXml, XML_HEADERS } from "@/site/sitemap";

export const dynamic = "force-static";

export function GET() {
  const ids = liveSections().map((s) => s.id);
  return new Response(sitemapIndexXml([{ name: "core", lastmod: newestLastmod(ids) }, ...ids.map((id) => ({ name: id, lastmod: sectionLastmod(id) }))]), { headers: XML_HEADERS });
}
