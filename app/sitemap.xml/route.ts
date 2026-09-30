import { liveSections } from "@/registry";
import { sitemapIndexXml, XML_HEADERS } from "@/site/sitemap";

export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapIndexXml(["core", ...liveSections().map((s) => s.id)]), { headers: XML_HEADERS });
}
