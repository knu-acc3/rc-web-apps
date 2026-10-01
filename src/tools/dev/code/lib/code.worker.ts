import { serve, WorkerFail } from "../../shared/worker-host";
import type { FormatLang, FormatOptions, MinifyLang, ValidateLang } from "./langs";
import { CodeError, formatCode, formatJsonText, minifyCode, validateCode } from "./run";

const wrap =
  <P, R>(fn: (p: P) => Promise<R> | R) =>
  async (p: P): Promise<R> => {
    try {
      return await fn(p);
    } catch (e) {
      if (e instanceof CodeError) throw new WorkerFail(e.fail.code, e.fail);
      throw e;
    }
  };

serve({
  format: wrap((p: { lang: FormatLang; text: string; opts: FormatOptions }) => formatCode(p.lang, p.text, p.opts)),
  json: wrap((p: { text: string; indent: number | "\t"; sortKeys?: boolean; ascii?: boolean; tree?: boolean }) => formatJsonText(p.text, p)),
  minify: wrap((p: { lang: MinifyLang; text: string; keepComments?: boolean }) => minifyCode(p.lang, p.text, { keepComments: p.keepComments })),
  validate: wrap((p: { lang: ValidateLang; text: string }) => validateCode(p.lang, p.text)),
});
