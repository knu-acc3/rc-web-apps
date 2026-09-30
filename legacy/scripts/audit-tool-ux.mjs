import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const toolsDir = fileURLToPath(new URL("../src/tools/", import.meta.url));
const registryPath = fileURLToPath(new URL("../src/tools/registry.ts", import.meta.url));
const registrySource = await readFile(registryPath, "utf8");
const publicTools = [...registrySource.matchAll(
  /['"]([^'"]+)['"]\s*:\s*dyn\(\(\)\s*=>\s*import\(['"]@\/src\/tools\/([^'"]+)['"]\)\)/g,
)].map((match) => ({ slug: match[1], file: `${match[2]}.tsx` }));

const duplicateSlugs = publicTools.filter(
  (entry, index) => publicTools.findIndex((item) => item.slug === entry.slug) !== index,
);
if (duplicateSlugs.length > 0) {
  throw new Error(`Duplicate public tool slugs: ${duplicateSlugs.map((entry) => entry.slug).join(", ")}`);
}

const count = (source, pattern) => source.match(pattern)?.length ?? 0;
const results = [];

for (const { slug, file } of publicTools) {
  const source = await readFile(path.join(toolsDir, file), "utf8");
  const lines = source.split(/\r?\n/).length;
  const primarySource = source
    .replace(/<AdvancedSettings\b[\s\S]*?<\/AdvancedSettings>/g, "")
    .replace(/<details\b[\s\S]*?<\/details>/g, "");
  const controls = count(
    source,
    /<(?:input|select|textarea|Input|Textarea|SelectTrigger|Switch|Slider|MobileSlider)\b/g,
  );
  const primaryControls = count(
    primarySource,
    /<(?:input|select|textarea|Input|Textarea|SelectTrigger|Switch|Slider|MobileSlider)\b/g,
  );
  const cards = count(source, /<Card(?:\s|>)/g);
  const primaryCards = count(primarySource, /<Card(?:\s|>)/g);
  const disclosures = count(
    source,
    /<(?:AdvancedSettings|details|Accordion)\b/g,
  );
  const denseGrids = count(primarySource, /(?:grid-cols-[4-9]|grid-cols-\[)/g);
  const score =
    Math.max(0, primaryControls - 8) * 3 +
    Math.max(0, primaryCards - 6) * 2 +
    Math.max(0, lines - 1800) / 250 +
    denseGrids * 2;

  results.push({
    slug,
    file,
    lines,
    controls,
    primaryControls,
    cards,
    primaryCards,
    disclosures,
    denseGrids,
    score,
  });
}

const ranked = results
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(({ score, ...item }) => ({ ...item, score: Math.round(score) }));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ totalTools: publicTools.length, ranked }, null, 2));
} else {
  console.log(`Audited all ${publicTools.length} canonical public tools.`);
  console.log("Progressive-disclosure candidates (complete list):");
  console.table(ranked);
  console.log(
    "This is a heuristic report: review the primary task and result before hiding any control.",
  );
}
