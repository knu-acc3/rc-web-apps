// Builds the MIME reference data from mime-db (https://github.com/jshttp/mime-db).
// Output (committed, deterministic):
//   src/sections/mime/data/db.json     { ext: [[type, source, compressible, charset], …] } — server-side only
//   src/sections/mime/data/index.json  [[ext, "type1|type2"], …] — lazily loaded by the hub search
// mime-db is looked up in scripts/data/node_modules (npm --prefix scripts/data install),
// then in $MIME_DB_DIR, then in parent checkouts (useful inside git worktrees).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function findDb() {
  const candidates = [join(here, "node_modules/mime-db")];
  if (process.env.MIME_DB_DIR) candidates.push(process.env.MIME_DB_DIR);
  let dir = root;
  for (let i = 0; i < 6; i++) {
    dir = dirname(dir);
    candidates.push(join(dir, "scripts/data/node_modules/mime-db"));
  }
  for (const c of candidates) if (existsSync(join(c, "db.json"))) return c;
  throw new Error("mime-db not found: run `npm --prefix scripts/data install` or set MIME_DB_DIR");
}

const dbDir = findDb();
const db = JSON.parse(readFileSync(join(dbDir, "db.json"), "utf8"));
const version = JSON.parse(readFileSync(join(dbDir, "package.json"), "utf8")).version;

const SOURCE = { iana: "i", apache: "a", nginx: "n" };
const byExt = new Map();
for (const type of Object.keys(db).sort()) {
  const v = db[type];
  for (const ext of v.extensions ?? []) {
    if (!/^[a-z0-9][a-z0-9+.-]*$/.test(ext)) continue;
    if (!byExt.has(ext)) byExt.set(ext, []);
    byExt.get(ext).push([type, SOURCE[v.source] ?? "", v.compressible === true ? 1 : v.compressible === false ? 0 : null, v.charset ?? null]);
  }
}

const exts = [...byExt.keys()].sort();
const out = { _source: `mime-db ${version}` };
for (const e of exts) out[e] = byExt.get(e);
const index = exts.map((e) => [e, byExt.get(e).map((t) => t[0]).join("|")]);

const dataDir = join(root, "src/sections/mime/data");
writeFileSync(join(dataDir, "db.json"), JSON.stringify(out) + "\n");
writeFileSync(join(dataDir, "index.json"), JSON.stringify(index) + "\n");
console.log(`gen-mime: ${exts.length} extensions from mime-db ${version} (${dbDir})`);
