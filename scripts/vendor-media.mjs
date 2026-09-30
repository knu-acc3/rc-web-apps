#!/usr/bin/env node
/**
 * Copy the ffmpeg.wasm fallback (single-thread core + the @ffmpeg/ffmpeg class worker)
 * into public/vendor/media/ so it is served from our own origin.
 *
 * Must run before `next build` / `next dev` (public/vendor/ is git-ignored):
 *   node scripts/vendor-media.mjs
 *
 * The video/audio tools load these files lazily, only when the browser's WebCodecs
 * cannot handle a file (AVI, WMV, FLV, MP3/FLAC/Vorbis encoding, missing codecs).
 */
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "public", "vendor", "media");

const files = [
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.js", "ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/esm/ffmpeg-core.wasm", "ffmpeg-core.wasm"],
  // The class worker and its two imports; loaded via FFmpeg.load({ classWorkerURL }).
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/worker.js", "worker.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/const.js", "const.js"],
  ["node_modules/@ffmpeg/ffmpeg/dist/esm/errors.js", "errors.js"],
];

mkdirSync(out, { recursive: true });
let total = 0;
for (const [from, to] of files) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.error(`vendor-media: missing ${from} — run "npm ci" first.`);
    process.exit(1);
  }
  copyFileSync(src, join(out, to));
  total += statSync(src).size;
}
console.log(`vendor-media: copied ${files.length} files (${(total / 1048576).toFixed(1)} MB) to public/vendor/media/`);
