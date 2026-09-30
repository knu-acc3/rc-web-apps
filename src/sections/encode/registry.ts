/** Codec ids and lazy loaders (the HTML entity table is only loaded by HTML pages). */
import { fail, ok, type Codec } from "./types";

export type CodecId =
  | "base64"
  | "url"
  | "html"
  | "binary"
  | "octal"
  | "decimal"
  | "hex"
  | "base32"
  | "base58"
  | "base85"
  | "unicode"
  | "json"
  | "qp"
  | "rot"
  | "caesar"
  | "atbash"
  | "punycode";

export async function loadCodec(id: CodecId): Promise<Codec> {
  if (id === "html") return (await import("./html")).html;
  if (id === "punycode") {
    const p = await import("./punycode");
    return {
      encode: (s) => ok(s.split(/\r?\n/).map(p.domainToAscii).join("\n")),
      decode: (s) => {
        try {
          return ok(s.split(/\r?\n/).map(p.domainToUnicode).join("\n"));
        } catch {
          return fail("puny.bad");
        }
      },
    };
  }
  const c = await import("./codecs");
  switch (id) {
    case "base64":
      return c.base64;
    case "url":
      return c.url;
    case "binary":
      return c.numberCodec(2);
    case "octal":
      return c.numberCodec(8);
    case "decimal":
      return c.numberCodec(10);
    case "hex":
      return c.numberCodec(16);
    case "base32":
      return c.base32;
    case "base58":
      return c.base58;
    case "base85":
      return c.base85;
    case "unicode":
      return c.unicode;
    case "json":
      return c.json;
    case "qp":
      return c.qp;
    case "rot":
      return c.rot;
    case "caesar":
      return c.caesarCodec;
    default:
      return c.atbashCodec;
  }
}
