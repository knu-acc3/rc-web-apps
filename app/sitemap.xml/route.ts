import { allSections } from "@/registry";
import { sitemapIndexXml, XML_HEADERS } from "@/site/sitemap";

export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapIndexXml(["core", ...allSections().map((s) => s.id)]), { headers: XML_HEADERS });
}
