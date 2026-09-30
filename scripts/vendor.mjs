// Copies self-hosted third-party runtime assets (wasm, workers, fonts) into public/vendor/.
// Runs every scripts/vendor-*.mjs file; each one is owned by a section.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
for (const f of readdirSync(dir).filter((f) => /^vendor-.*\.mjs$/.test(f)).sort()) {
  console.log(`vendor: ${f}`);
  await import(pathToFileURL(join(dir, f)).href);
}
