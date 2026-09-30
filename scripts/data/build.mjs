// Runs every data generator in this folder (files named gen-*.mjs).
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
for (const f of readdirSync(dir).filter((f) => /^gen-.*\.mjs$/.test(f)).sort()) {
  console.log(`→ ${f}`);
  await import(pathToFileURL(join(dir, f)).href);
}
