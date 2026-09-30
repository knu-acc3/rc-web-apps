/**
 * ZIP worker (JSZip): builds archives and reads them without blocking the page.
 * Protocol:
 *   { op: "build", entries: {path, file}[], level }            → progress… → { done: Blob }
 *   { op: "open", file, encoding }                              → { entries }
 *   { op: "extract", path }                                     → { blob }
 */
import type JSZipType from "jszip";

interface Scope {
  postMessage(msg: unknown): void;
  onmessage: ((e: MessageEvent<Req>) => void) | null;
}
type Req =
  | { id: number; op: "build"; entries: { path: string; file: Blob; date: number }[]; level: number }
  | { id: number; op: "open"; file: Blob; encoding: string }
  | { id: number; op: "extract"; path: string };

const scope = self as unknown as Scope;
let opened: JSZipType | null = null;

export interface ZipEntryInfo {
  path: string;
  dir: boolean;
  size: number;
  compressed: number;
  date: number;
  encrypted: boolean;
}

function decoder(encoding: string) {
  if (encoding === "auto") {
    const utf8 = new TextDecoder("utf-8", { fatal: true });
    const dos = new TextDecoder("ibm866");
    return (bytes: Uint8Array | number[]) => {
      const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      try {
        return utf8.decode(b);
      } catch {
        // Windows' built-in ZIP on Russian systems writes names in CP866 without the UTF-8 flag.
        return dos.decode(b);
      }
    };
  }
  const td = new TextDecoder(encoding);
  return (bytes: Uint8Array | number[]) => td.decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

scope.onmessage = async (e) => {
  const m = e.data;
  try {
    const { default: JSZip } = await import("jszip");
    if (m.op === "build") {
      const zip = new JSZip();
      for (const en of m.entries) zip.file(en.path, en.file, { date: new Date(en.date), binary: true });
      const blob = await zip.generateAsync(
        { type: "blob", compression: m.level > 0 ? "DEFLATE" : "STORE", compressionOptions: { level: Math.max(1, m.level) }, streamFiles: true },
        (meta) => scope.postMessage({ id: m.id, progress: meta.percent / 100 }),
      );
      scope.postMessage({ id: m.id, done: blob });
    } else if (m.op === "open") {
      opened = await JSZip.loadAsync(m.file, { decodeFileName: decoder(m.encoding) as unknown as (bytes: string[] | Uint8Array | Buffer) => string });
      const entries: ZipEntryInfo[] = [];
      opened.forEach((path, f) => {
        const d = (f as unknown as { _data?: { uncompressedSize?: number; compressedSize?: number } })._data;
        entries.push({ path, dir: f.dir, size: d?.uncompressedSize ?? 0, compressed: d?.compressedSize ?? 0, date: f.date?.getTime() ?? 0, encrypted: false });
      });
      scope.postMessage({ id: m.id, done: entries });
    } else if (m.op === "extract") {
      const f = opened?.file(m.path);
      if (!f) throw new Error("NOT_FOUND");
      const blob = await f.async("blob", (meta) => scope.postMessage({ id: m.id, progress: meta.percent / 100 }));
      scope.postMessage({ id: m.id, done: blob });
    }
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    scope.postMessage({ id: m.id, error: /encrypt/i.test(msg) ? "ENCRYPTED" : /end of central directory|corrupt|signature/i.test(msg) ? "CORRUPT" : msg });
  }
};
