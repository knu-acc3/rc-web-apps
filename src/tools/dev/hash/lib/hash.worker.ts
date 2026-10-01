import { serve } from "@/tools/dev/shared/worker-host";
import type { AlgoId, KdfId } from "./algorithms";
import { hashBlob, hashBytes } from "./engine";
import * as kdf from "./kdf";

interface Common {
  algo: AlgoId;
  bits?: number;
  key?: Uint8Array;
}

serve({
  async text(p: Common & { data: Uint8Array }) {
    return hashBytes(p.algo, p.data, { bits: p.bits, key: p.key });
  },

  async multi(p: { data: Uint8Array; algos: AlgoId[] }) {
    const out: Record<string, string> = {};
    for (const a of p.algos) out[a] = await hashBytes(a, p.data);
    return out;
  },

  /** Hash several files one after another, streaming each in chunks. */
  async files(p: Common & { files: File[]; algos?: (AlgoId | null)[] }, ctx) {
    const out: (string | null)[] = [];
    const total = p.files.reduce((s, f) => s + f.size, 0) || 1;
    let before = 0;
    for (let i = 0; i < p.files.length; i++) {
      const f = p.files[i];
      const algo = p.algos ? p.algos[i] : p.algo;
      if (!algo) {
        out.push(null);
        before += f.size;
        continue;
      }
      ctx.progress(before / total, { index: i, done: 0 });
      out.push(
        await hashBlob(algo, f, { bits: p.bits, key: p.key }, (done) => {
          ctx.progress((before + done) / total, { index: i, done });
        }),
      );
      before += f.size;
      ctx.progress(before / total, { index: i, done: f.size, digest: out[i] });
    }
    return out;
  },

  async kdf(p: {
    kind: KdfId;
    op: "hash" | "verify";
    password: string;
    salt?: Uint8Array;
    encoded?: string;
    cost?: number;
    argon?: kdf.Argon2Params;
    scrypt?: kdf.ScryptParams;
    pbkdf2?: kdf.Pbkdf2Params;
  }) {
    if (p.op === "verify") {
      const e = p.encoded ?? "";
      if (p.kind === "bcrypt") return kdf.bcryptCheck(p.password, e);
      if (p.kind === "argon2") return kdf.argon2Check(p.password, e);
      if (p.kind === "scrypt") return kdf.scryptCheck(p.password, e);
      return kdf.pbkdf2Check(p.password, e);
    }
    const salt = p.salt!;
    if (p.kind === "bcrypt") return kdf.bcryptHash(p.password, p.cost ?? 10, salt);
    if (p.kind === "argon2") return kdf.argon2Hash(p.password, salt, p.argon!);
    if (p.kind === "scrypt") return kdf.scryptHash(p.password, salt, p.scrypt!);
    return kdf.pbkdf2Hash(p.password, salt, p.pbkdf2!);
  },
});
