/* Barcode detection: native BarcodeDetector when it supports the formats, otherwise zxing-wasm
   loaded on demand from /vendor/qr (never from a CDN). Nothing leaves the device. */

export interface Detected {
  text: string;
  format: string;
}

export type Detect = (src: HTMLVideoElement | ImageBitmap | Blob) => Promise<Detected[]>;

interface NativeDetector {
  detect(src: ImageBitmapSource): Promise<{ rawValue: string; format: string }[]>;
}
interface NativeDetectorCtor {
  new (o: { formats: string[] }): NativeDetector;
  getSupportedFormats(): Promise<string[]>;
}

const NATIVE_ALL = ["qr_code", "ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "code_93", "codabar", "itf", "data_matrix", "pdf417", "aztec"];

const NATIVE_NAME: Record<string, string> = {
  qr_code: "QR Code",
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  code_93: "Code 93",
  codabar: "Codabar",
  itf: "ITF",
  data_matrix: "Data Matrix",
  pdf417: "PDF417",
  aztec: "Aztec",
};

export async function nativeDetector(all: boolean): Promise<Detect | null> {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    const supported = await Ctor.getSupportedFormats();
    if (!supported?.includes("qr_code")) return null;
    const formats = all ? NATIVE_ALL.filter((f) => supported.includes(f)) : ["qr_code"];
    const d = new Ctor({ formats });
    return async (src) => {
      const input = src instanceof Blob ? await createImageBitmap(src) : src;
      const r = await d.detect(input);
      return r.map((x) => ({ text: x.rawValue, format: NATIVE_NAME[x.format] ?? x.format }));
    };
  } catch {
    return null;
  }
}

type Zxing = typeof import("zxing-wasm/reader");
let zxing: Promise<Zxing> | null = null;

function loadZxing(): Promise<Zxing> {
  zxing ??= import("zxing-wasm/reader").then(async (z) => {
    await z.prepareZXingModule({
      overrides: { locateFile: (path: string, prefix: string) => (path.endsWith(".wasm") ? `/vendor/qr/zxing_reader-${z.ZXING_WASM_VERSION}.wasm` : prefix + path) },
      fireImmediately: true,
    });
    return z;
  });
  zxing.catch(() => {
    zxing = null;
  });
  return zxing;
}

export async function zxingDetector(all: boolean): Promise<Detect> {
  const z = await loadZxing();
  let canvas: HTMLCanvasElement | null = null;
  return async (src) => {
    let input: Blob | ImageData;
    if (src instanceof Blob) input = src;
    else {
      const w = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
      const h = src instanceof HTMLVideoElement ? src.videoHeight : src.height;
      if (!w || !h) return [];
      canvas ??= document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return [];
      ctx.drawImage(src, 0, 0, w, h);
      input = ctx.getImageData(0, 0, w, h);
    }
    const res = await z.readBarcodes(input, { formats: all ? [] : ["QRCode", "MicroQRCode"], tryHarder: true, maxNumberOfSymbols: 4 });
    return res.filter((r) => r.isValid).map((r) => ({ text: r.text, format: r.format }));
  };
}

/** Human names for zxing format ids. */
export function formatName(f: string): string {
  const map: Record<string, string> = { QRCode: "QR Code", MicroQRCode: "Micro QR", EAN13: "EAN-13", EAN8: "EAN-8", UPCA: "UPC-A", UPCE: "UPC-E", Code128: "Code 128", Code39: "Code 39", Code93: "Code 93", ITF: "ITF", ITF14: "ITF-14", DataMatrix: "Data Matrix", PDF417: "PDF417", Aztec: "Aztec", Codabar: "Codabar", DataBar: "GS1 DataBar", DataBarExp: "GS1 DataBar Expanded" };
  return map[f] ?? f;
}
