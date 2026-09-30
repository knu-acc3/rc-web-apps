// Self-hosts the zxing-wasm barcode reader so the QR scanner never fetches it from a CDN.
// Output: public/vendor/qr/zxing_reader-<version>.wasm (the version keeps the long cache safe).
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const wasm = require.resolve("zxing-wasm/reader/zxing_reader.wasm");
const { version } = JSON.parse(readFileSync(join(dirname(wasm), "../../package.json"), "utf8"));
const outDir = join(root, "public/vendor/qr");
mkdirSync(outDir, { recursive: true });
copyFileSync(wasm, join(outDir, `zxing_reader-${version}.wasm`));
console.log(`vendor-qr: zxing_reader-${version}.wasm`);
