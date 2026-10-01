// Generates src/tools/dev/encode/data/entities.json — the full WHATWG HTML5 named character
// reference list (2 231 names incl. the legacy ones that may omit the semicolon), taken offline
// from the html-entities package already present in node_modules.
// Output: { "names": [[name, chars, legacy01], …] } sorted by name.
// Run: node scripts/data/gen-encode-entities.mjs
import { mkdirSync, writeFileSync } from "node:fs";
// The subpath isn't exported, so import the file by URL.
const { namedReferences } = await import(new URL("../../node_modules/html-entities/dist/esm/named-references.js", import.meta.url).href);

const all = namedReferences.html5.entities; // "&name;" → chars and legacy "&name" → chars
const rows = [];
for (const [key, chars] of Object.entries(all)) {
  if (!key.endsWith(";")) continue;
  const name = key.slice(1, -1);
  const legacy = Object.prototype.hasOwnProperty.call(all, `&${name}`) ? 1 : 0;
  rows.push([name, chars, legacy]);
}
rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
const dir = new URL("../../src/tools/dev/encode/data/", import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL("entities.json", dir), JSON.stringify({ names: rows }) + "\n");
console.log(`${rows.length} entities, ${rows.filter((r) => r[2]).length} legacy`);
