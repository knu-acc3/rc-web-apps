/**
 * PDF section: self-hosts the static assets pdf.js and the stamping tools need
 * at runtime, so nothing is ever fetched from a CDN (run by scripts/vendor.mjs
 * on prebuild; public/vendor/ is generated and git-ignored):
 *   public/vendor/pdf/cmaps/           Adobe CMaps for CJK text (pdfjs-dist)
 *   public/vendor/pdf/standard_fonts/  data for non-embedded base-14 fonts (pdfjs-dist)
 *   public/vendor/pdf/wasm/            JPEG 2000 / JBIG2 / colour-management decoders (pdfjs-dist)
 *   public/vendor/pdf/iccs/            default CMYK profile (pdfjs-dist)
 *   public/vendor/pdf/fonts/           Noto Sans (SIL OFL) for Cyrillic text stamping,
 *                                      from src/tools/files/pdf/data/
 *
 * The pdf.js worker itself is bundled by Next (src/tools/files/pdf/lib/pdfjs.worker.ts),
 * so it always matches the installed pdfjs-dist version.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdfjs = join(root, "node_modules", "pdfjs-dist");
const out = join(root, "public", "vendor", "pdf");

if (!existsSync(pdfjs)) throw new Error("vendor-pdf: pdfjs-dist is not installed — run `npm ci` first.");

function copyDir(name, filter = () => true) {
  const src = join(pdfjs, name);
  const dst = join(out, name);
  rmSync(dst, { recursive: true, force: true });
  mkdirSync(dst, { recursive: true });
  let n = 0;
  for (const f of readdirSync(src)) {
    if (!filter(f)) continue;
    cpSync(join(src, f), join(dst, f));
    n++;
  }
  console.log(`  pdf/${name}/: ${n} files`);
}

mkdirSync(out, { recursive: true });
copyDir("cmaps");
copyDir("standard_fonts");
copyDir("iccs");
// Scripting (quickjs) is never enabled.
copyDir("wasm", (f) => !f.startsWith("quickjs"));

const fontSrc = join(root, "src", "tools", "files", "pdf", "data");
const fontDst = join(out, "fonts");
mkdirSync(fontDst, { recursive: true });
for (const f of ["NotoSans-Regular.ttf", "OFL-NotoSans.txt"]) cpSync(join(fontSrc, f), join(fontDst, f));
console.log("  pdf/fonts/: NotoSans-Regular.ttf, OFL-NotoSans.txt");
