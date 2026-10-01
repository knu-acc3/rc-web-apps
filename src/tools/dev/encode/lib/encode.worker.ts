import { serve, Transfer } from "@/tools/dev/shared/worker-host";
import { decodeToBlob, encodeBlob } from "./b64file";
import { loadCodec, type CodecId } from "./registry";
import type { CodecResult, Opts } from "./types";

serve({
  async run(p: { id: CodecId; dir: "encode" | "decode"; text: string; opts: Opts }): Promise<CodecResult | Transfer<CodecResult>> {
    const codec = await loadCodec(p.id);
    const r = p.dir === "encode" ? codec.encode(p.text, p.opts) : codec.decode(p.text, p.opts);
    return r.bytes ? new Transfer(r, [r.bytes.buffer as ArrayBuffer]) : r;
  },

  async fileToBase64(p: { file: File; urlSafe?: boolean; dataUri?: boolean }, ctx) {
    return encodeBlob(p.file, { urlSafe: p.urlSafe, dataUri: p.dataUri, mime: p.file.type }, (done) => ctx.progress(p.file.size ? done / p.file.size : 1));
  },

  async base64ToFile(p: { text: string }, ctx) {
    return decodeToBlob(p.text, (done) => ctx.progress(p.text.length ? done / p.text.length : 1));
  },
});
