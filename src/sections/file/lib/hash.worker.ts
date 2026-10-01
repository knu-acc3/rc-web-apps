/** Streams a file through MD5, SHA-1 and SHA-256 (hash-wasm) off the main thread. */
interface Scope {
  postMessage(msg: unknown): void;
  onmessage: ((e: MessageEvent<{ file: Blob }>) => void) | null;
}
const scope = self as unknown as Scope;
const CHUNK = 4 * 1024 * 1024;

scope.onmessage = async (e) => {
  try {
    const { createMD5, createSHA1, createSHA256 } = await import("hash-wasm");
    const [md5, sha1, sha256] = await Promise.all([createMD5(), createSHA1(), createSHA256()]);
    md5.init();
    sha1.init();
    sha256.init();
    const file = e.data.file;
    for (let o = 0; o < file.size; o += CHUNK) {
      const buf = new Uint8Array(await file.slice(o, o + CHUNK).arrayBuffer());
      md5.update(buf);
      sha1.update(buf);
      sha256.update(buf);
      scope.postMessage({ progress: Math.min(1, (o + CHUNK) / file.size) });
    }
    scope.postMessage({ done: { md5: md5.digest("hex"), sha1: sha1.digest("hex"), sha256: sha256.digest("hex") } });
  } catch (err) {
    scope.postMessage({ error: String((err as Error)?.message ?? err) });
  }
};

export {};
