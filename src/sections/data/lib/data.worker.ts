import { serve, WorkerFail } from "@/sections/code/kit/worker-host";
import { convert, ConvertError, type ConvertOptions, type Fmt } from "./convert";

serve({
  async convert(p: { from: Fmt; to: Fmt; text: string; opts: ConvertOptions }) {
    try {
      return await convert(p.from, p.to, p.text, p.opts);
    } catch (e) {
      if (e instanceof ConvertError) throw new WorkerFail(e.code, { code: e.code, line: e.line, col: e.col, detail: e.detail });
      throw e;
    }
  },
});
