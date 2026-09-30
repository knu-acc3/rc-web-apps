import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const magickSource = existsSync(join(root, "node_modules/@imagemagick/magick-wasm/dist/x86/magick.wasm"))
  ? "node_modules/@imagemagick/magick-wasm/dist/x86/magick.wasm"
  : "node_modules/@imagemagick/magick-wasm/dist/magick.wasm";

const assets = [
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js", "public/vendor/ffmpeg/ffmpeg-core.js"],
  ["node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm", "public/vendor/ffmpeg/ffmpeg-core.wasm"],
  [magickSource, "public/vendor/imagemagick/magick.wasm"],
];

for (const [source, destination] of assets) {
  const outputPath = join(root, destination);
  await mkdir(dirname(outputPath), { recursive: true });
  await copyFile(join(root, source), outputPath);
}

console.log(`Synced ${assets.length} local WebAssembly assets.`);
