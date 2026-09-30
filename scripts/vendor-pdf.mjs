#!/usr/bin/env node
/**
 * Self-hosts the static assets the PDF section needs at runtime, so the tools
 * never talk to a CDN:
 *   public/vendor/pdf/cmaps/           Adobe CMaps for CJK text (pdfjs-dist)
 *   public/vendor/pdf/standard_fonts/  metrics/outlines for non-embedded base-14 fonts (pdfjs-dist)
 *   public/vendor/pdf/wasm/            JPEG 2000 / JBIG2 / ICC decoders (pdfjs-dist)
 *   public/vendor/pdf/iccs/            default CMYK profile (pdfjs-dist)
 *   public/vendor/pdf/fonts/           Noto Sans (OFL) for Cyrillic text stamping
 *
 * The pdf.js worker itself is bundled by Next (src/sections/pdf/engine/pdfjs.worker.ts),
 * so it always matches the installed pdfjs-dist version.
 *
 * Run after upgrading pdfjs-dist:  node scripts/vendor-pdf.mjs
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pdfjs = join(root, "node_modules", "pdfjs-dist");
const out = join(root, "public", "vendor", "pdf");

if (!existsSync(pdfjs)) {
  console.error("pdfjs-dist is not installed — run `npm ci` first.");
  process.exit(1);
}

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
  console.log(`  ${name}/: ${n} files`);
}

mkdirSync(out, { recursive: true });
console.log(`Vendoring pdf.js assets into ${out}`);
copyDir("cmaps");
copyDir("standard_fonts");
copyDir("iccs");
// Scripting (quickjs) is never enabled, so skip it.
copyDir("wasm", (f) => !f.startsWith("quickjs"));

const fontSrc = join(root, "legacy", "public", "fonts");
const fontDst = join(out, "fonts");
mkdirSync(fontDst, { recursive: true });
for (const f of ["NotoSans-Regular.ttf", "OFL-NotoSans.txt"]) {
  if (existsSync(join(fontSrc, f))) {
    cpSync(join(fontSrc, f), join(fontDst, f));
    console.log(`  fonts/${f}`);
  } else if (!existsSync(join(fontDst, f))) {
    console.warn(`  ! ${f} not found in legacy/public/fonts and not vendored yet`);
  }
}
console.log("Done.");
