// Tell Yandex and Bing (IndexNow) which pages changed after a deploy.
//
//   npm run indexnow                    every page in the live sitemaps
//   npm run indexnow -- --since=<git>   only sections changed since that commit (e.g. the previous deploy)
//   add --dry-run to print the URLs without sending them
//
// Reads the domain and key from src/config/brand.ts; the key file public/{key}.txt is deployed with the site.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : true];
  }),
);
const brand = fs.readFileSync(new URL("../src/config/brand.ts", import.meta.url), "utf8");
const domain = /domain:\s*"([^"]+)"/.exec(brand)?.[1];
const key = /indexNowKey:\s*"([^"]+)"/.exec(brand)?.[1];
if (!domain || !key) throw new Error("brand.ts: domain or indexNowKey is missing");
if (!fs.existsSync(new URL(`../public/${key}.txt`, import.meta.url))) throw new Error(`public/${key}.txt is missing`);
const site = args.site ?? `https://${domain}`; // --site=http://localhost:3000 to try it against a local build

async function text(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));

let files = locs(await text(`${site}/sitemap.xml`)).map((f) => f.replace(`https://${domain}`, site));
if (args.since) {
  // src/tools/<category>/<section>/… → that section; src/tools/<category>/shared/… → every section of the category.
  const changed = execFileSync("git", ["diff", "--name-only", `${args.since}..HEAD`, "--", "src/tools"], { encoding: "utf8" }).split("\n");
  const ids = new Set();
  for (const f of changed) {
    const [, , cat, id] = f.split("/");
    if (!cat || !id || id.includes(".")) continue;
    if (id !== "shared") ids.add(id);
    else for (const d of fs.readdirSync(new URL(`../src/tools/${cat}/`, import.meta.url))) if (d !== "shared" && !d.includes(".")) ids.add(d);
  }
  files = files.filter((f) => ids.has(f.replace(/^.*\/sitemaps\//, "").replace(/\.xml$/, "")));
  console.log(`changed sections: ${[...ids].join(", ") || "none"}`);
}
const urls = [];
for (const f of files) urls.push(...locs(await text(f)));
console.log(`${urls.length} URLs from ${files.length} sitemap(s)`);
if (args["dry-run"]) {
  console.log(urls.slice(0, 20).join("\n") + (urls.length > 20 ? "\n…" : ""));
  process.exit(0);
}
// One request takes up to 10 000 URLs; api.indexnow.org forwards them to every participating engine.
for (let i = 0; i < urls.length; i += 10000) {
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: domain, key, keyLocation: `${site}/${key}.txt`, urlList: urls.slice(i, i + 10000) }),
  });
  console.log(`batch ${i / 10000 + 1}: HTTP ${r.status}`);
  if (r.status >= 400) process.exitCode = 1;
}
