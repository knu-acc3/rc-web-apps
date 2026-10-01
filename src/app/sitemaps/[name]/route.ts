import { getSection, liveSections, sectionPaths } from "@/registry";
import { newestLastmod, sectionLastmod, urlsetXml, XML_HEADERS } from "@/site/sitemap";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ name: "core.xml" }, ...liveSections().map((s) => ({ name: `${s.id}.xml` }))];
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const id = name.replace(/\.xml$/, "");
  if (id === "core") return new Response(urlsetXml([[], ["all"]], newestLastmod(liveSections().map((s) => s.id))), { headers: XML_HEADERS });
  const section = getSection(id);
  if (!section) return new Response("Not found", { status: 404 });
  const paths = sectionPaths(section);
  return new Response(urlsetXml(paths, sectionLastmod(section.id)), { headers: XML_HEADERS });
}
