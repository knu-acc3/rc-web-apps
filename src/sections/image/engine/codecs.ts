/**
 * Single-threaded WebAssembly codecs, imported directly. The @jsquash package
 * entry points for AVIF and OxiPNG also reference their multi-threaded builds,
 * which spawn self-referencing module workers; those need cross-origin
 * isolation (never enabled here) and only slow down / break bundling.
 */

type Raw = { data: Uint8ClampedArray; width: number; height: number };

interface AvifModule {
  encode(data: Uint8Array, width: number, height: number, options: Record<string, number | boolean>): Uint8Array | null;
}

let avifModule: Promise<AvifModule> | null = null;

export async function encodeAvif(img: Raw, quality: number, speed: number): Promise<Uint8Array> {
  if (!avifModule) {
    avifModule = (async () => {
      const [{ default: factory }, { initEmscriptenModule }] = await Promise.all([
        import("@jsquash/avif/codec/enc/avif_enc.js"),
        import("@jsquash/avif/utils.js"),
      ]);
      return (await initEmscriptenModule(factory as never)) as unknown as AvifModule;
    })();
  }
  const m = await avifModule;
  const out = m.encode(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength), img.width, img.height, {
    quality,
    qualityAlpha: -1,
    denoiseLevel: 0,
    tileColsLog2: 0,
    tileRowsLog2: 0,
    speed,
    subsample: 1,
    chromaDeltaQ: false,
    sharpness: 0,
    tune: 0,
    enableSharpYUV: false,
    bitDepth: 8,
  });
  if (!out) throw new Error("ENCODE_FAILED");
  return out.slice();
}

let oxi: Promise<typeof import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js")> | null = null;

/** Lossless PNG optimisation (OxiPNG). */
export async function optimisePng(png: Uint8Array, level = 2): Promise<Uint8Array> {
  if (!oxi) {
    oxi = (async () => {
      const mod = await import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js");
      await mod.default();
      return mod;
    })();
  }
  const mod = await oxi;
  return mod.optimise(png, level, false, true).slice();
}
