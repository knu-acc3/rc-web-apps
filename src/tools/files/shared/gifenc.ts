/** Typed loader for `gifenc` (the package ships without type declarations). */

interface GifFrameOptions {
  palette?: number[][];
  /** Frame delay in milliseconds (gifenc stores it in 1/100 s). */
  delay?: number;
  /** -1 = play once, 0 = loop forever. Only used on the first frame. */
  repeat?: number;
  transparent?: boolean;
  transparentIndex?: number;
  dispose?: number;
}

interface GifEncoderApi {
  writeFrame(index: Uint8Array, width: number, height: number, opts?: GifFrameOptions): void;
  finish(): void;
  bytes(): Uint8Array;
  bytesView(): Uint8Array;
}

interface GifencModule {
  GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GifEncoderApi;
  quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: "rgb565" | "rgb444" | "rgba4444"; oneBitAlpha?: boolean | number; clearAlpha?: boolean }): number[][];
  applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: number[][], format?: "rgb565" | "rgb444" | "rgba4444"): Uint8Array;
}

export async function loadGifenc(): Promise<GifencModule> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore gifenc has no type declarations; the shape is described by GifencModule
  const mod = await import("gifenc");
  const m = mod as unknown as GifencModule & { default?: unknown };
  return m;
}
