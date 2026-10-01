import { createHash, createHmac, pbkdf2Sync, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { utf8Encode } from "@/sections/code/kit/bytes";
import { ALGOS, algosForHexLength, HMACS } from "@/sections/hash/lib/algorithms";
import { algoFromTag, digestMatches, formatDigest, normalizeExpected, parseSums } from "@/sections/hash/lib/digest";
import { hashBlob, hashBytes } from "@/sections/hash/lib/engine";
import { argon2Check, argon2Hash, bcryptCheck, bcryptHash, parsePbkdf2, parseScrypt, pbkdf2Check, pbkdf2Hash, pbkdf2Raw, scryptCheck, scryptHash, scryptRaw } from "@/sections/hash/lib/kdf";
import VECTORS from "@/sections/hash/data/vectors.json";

const u = (s: string) => utf8Encode(s);

/** Published reference digests (FIPS/RFC/official test suites). */
const KNOWN: Record<string, [string, string]> = {
  md5: ["d41d8cd98f00b204e9800998ecf8427e", "900150983cd24fb0d6963f7d28e17f72"],
  sha1: ["da39a3ee5e6b4b0d3255bfef95601890afd80709", "a9993e364706816aba3e25717850c26c9cd0d89d"],
  sha256: ["e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"],
  "sha512-256": ["c672b8d1ef56ed28ab87c3622c5114069bdd3ad7b8f9737498d0c01ecef0967a", "53048e2681941ef99b2e29b76b4c7dabe4c2d0c634fc6d46e0e2f13107e7af23"],
  "sha3-256": ["a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a", "3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532"],
  "keccak-256": ["c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470", "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"],
  blake3: ["af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262", "6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85"],
  blake2b: ["786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce", "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"],
  blake2s: ["69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9", "508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982"],
  ripemd160: ["9c1185a5c5e9fc54612808977ee8f548b2258d31", "8eb208f7e05d987a9b044a8e98c6b087f15a0bfc"],
  crc32: ["00000000", "352441c2"],
  adler32: ["00000001", "024d0127"],
  xxhash32: ["02cc5d05", "32d153ff"],
  xxhash64: ["ef46db3751d8e999", "44bc2cf5ad770999"],
  xxh3: ["2d06800538d394c2", "78af5f94892f3950"],
};

const NODE_ALGO: Record<string, string> = {
  md5: "md5",
  sha1: "sha1",
  sha224: "sha224",
  sha256: "sha256",
  sha384: "sha384",
  sha512: "sha512",
  "sha512-256": "sha512-256",
  "sha3-224": "sha3-224",
  "sha3-256": "sha3-256",
  "sha3-384": "sha3-384",
  "sha3-512": "sha3-512",
  ripemd160: "ripemd160",
};

describe("hash algorithms", () => {
  it("published vectors for '' and 'abc'", async () => {
    for (const [id, [empty, abc]] of Object.entries(KNOWN)) {
      expect(await hashBytes(id as never, u("")), `${id}("")`).toBe(empty);
      expect(await hashBytes(id as never, u("abc")), `${id}("abc")`).toBe(abc);
    }
  });

  it("CRC-32 / CRC-32C / Adler-32 check values", async () => {
    expect(await hashBytes("crc32", u("123456789"))).toBe("cbf43926");
    expect(await hashBytes("crc32c", u("123456789"))).toBe("e3069283");
    expect(await hashBytes("adler32", u("Wikipedia"))).toBe("11e60398");
  });

  it("agrees with node:crypto", async () => {
    const data = u("Привет, мир! 🚀 ".repeat(100));
    for (const [id, name] of Object.entries(NODE_ALGO)) {
      let ref: string;
      try {
        ref = createHash(name).update(data).digest("hex");
      } catch {
        continue; // algorithm not available in this Node/OpenSSL build
      }
      expect(await hashBytes(id as never, data), id).toBe(ref);
    }
  });

  it("vectors.json matches the engine for every algorithm", async () => {
    const d = VECTORS.digests as Record<string, string[]>;
    for (const a of ALGOS) {
      expect(d[a.id], a.id).toBeDefined();
      for (let i = 0; i < VECTORS.inputs.length; i++) expect(await hashBytes(a.id, u(VECTORS.inputs[i])), `${a.id} #${i}`).toBe(d[a.id][i]);
      expect(d[a.id][0].length, a.id).toBe((a.bits / 8) * 2);
    }
  });

  it("streamed (chunked) hashing equals one-shot hashing", async () => {
    const data = new Uint8Array(1_000_003);
    for (let i = 0; i < data.length; i++) data[i] = (i * 31 + 7) & 0xff;
    const blob = new Blob([data]);
    for (const id of ["sha256", "md5", "blake3", "crc32", "xxhash64", "sha512-256"] as const) {
      let calls = 0;
      const streamed = await hashBlob(id, blob, {}, () => calls++, 65_536);
      expect(streamed, id).toBe(await hashBytes(id, data));
      expect(calls).toBe(Math.ceil(data.length / 65_536));
    }
  });

  it("variable output length", async () => {
    expect((await hashBytes("blake2b", u("abc"), { bits: 256 })).length).toBe(64);
    expect((await hashBytes("blake3", u(""), { bits: 512 })).slice(0, 64)).toBe(KNOWN.blake3[0]);
  });
});

describe("HMAC", () => {
  const key = u("Jefe");
  const msg = u("what do ya want for nothing?");
  it("RFC 2202 (MD5, SHA-1) and RFC 4231 (SHA-256, SHA-512)", async () => {
    expect(await hashBytes("md5", msg, { key })).toBe("750c783e6ab0b503eaa86e310a5db738");
    expect(await hashBytes("sha1", msg, { key })).toBe("effcdf6ae5eb2fa2d27416d5f184df9c259a7c79");
    expect(await hashBytes("sha256", msg, { key })).toBe("5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843");
    expect(await hashBytes("sha512", msg, { key })).toBe(createHmac("sha512", "Jefe").update("what do ya want for nothing?").digest("hex"));
  });
  it("HMAC-SHA3-256 and HMAC-SHA512/256 agree with node:crypto", async () => {
    expect(await hashBytes("sha3-256", msg, { key })).toBe(createHmac("sha3-256", "Jefe").update("what do ya want for nothing?").digest("hex"));
    expect(await hashBytes("sha512-256", msg, { key })).toBe(createHmac("sha512-256", "Jefe").update("what do ya want for nothing?").digest("hex"));
  });
  it("every HMAC page maps to a real algorithm", () => {
    for (const h of HMACS) expect(ALGOS.some((a) => a.id === h.algo)).toBe(true);
  });
});

describe("password hashing", () => {
  const salt16 = new Uint8Array(16).map((_, i) => i * 7);
  it("bcrypt hash + verify ($2a/$2b/$2y)", async () => {
    const h = await bcryptHash("correct horse", 4, salt16);
    expect(h).toMatch(/^\$2b\$04\$[./A-Za-z0-9]{53}$/);
    expect(await bcryptCheck("correct horse", h)).toBe(true);
    expect(await bcryptCheck("wrong", h)).toBe(false);
    expect(await bcryptCheck("correct horse", h.replace("$2b$", "$2y$"))).toBe(true);
  });
  it("bcrypt published vector (OpenBSD test suite)", async () => {
    expect(await bcryptCheck("U*U", "$2a$05$CCCCCCCCCCCCCCCCCCCCC.E5YPO9kmyuRGyh0XouQYb4YMJKvyOeW")).toBe(true);
  });
  it("argon2id PHC string", async () => {
    const h = await argon2Hash("password", salt16, { memory: 64, iterations: 2, parallelism: 1, length: 32 });
    expect(h).toMatch(/^\$argon2id\$v=19\$m=64,t=2,p=1\$/);
    expect(await argon2Check("password", h)).toBe(true);
    expect(await argon2Check("Password", h)).toBe(false);
  });
  it("PBKDF2 RFC 6070 vectors", async () => {
    const p = u("password");
    const s = u("salt");
    const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");
    expect(hex(await pbkdf2Raw(p, s, { hash: "sha1", iterations: 1, length: 20 }))).toBe("0c60c80f961f0e71f3a9b524af6012062fe037a6");
    expect(hex(await pbkdf2Raw(p, s, { hash: "sha1", iterations: 2, length: 20 }))).toBe("ea6c014dc72d6f8ccd1ed92ace1d41f0d8de8957");
    expect(hex(await pbkdf2Raw(p, s, { hash: "sha1", iterations: 4096, length: 20 }))).toBe("4b007901b765489abead49d926f721d065a429c1");
    expect(hex(await pbkdf2Raw(p, s, { hash: "sha256", iterations: 1000, length: 32 }))).toBe(pbkdf2Sync("password", "salt", 1000, 32, "sha256").toString("hex"));
  });
  it("PBKDF2 encoded round-trip", async () => {
    const enc = await pbkdf2Hash("пароль", salt16, { hash: "sha256", iterations: 1000, length: 32 });
    expect(parsePbkdf2(enc).params).toEqual({ hash: "sha256", iterations: 1000, length: 32 });
    expect(await pbkdf2Check("пароль", enc)).toBe(true);
    expect(await pbkdf2Check("парол", enc)).toBe(false);
  });
  it("scrypt RFC 7914 vectors and round-trip", async () => {
    const hex = (b: Uint8Array) => Buffer.from(b).toString("hex");
    expect(hex(await scryptRaw(u(""), u(""), { ln: 4, r: 1, p: 1, length: 64 }))).toBe(
      "77d6576238657b203b19ca42c18a0497f16b4844e3074ae8dfdffa3fede21442fcd0069ded0948f8326a753a0fc81f17e8d3e0fb2e0d3628cf35e20c38d18906",
    );
    expect(hex(await scryptRaw(u("password"), u("NaCl"), { ln: 10, r: 8, p: 16, length: 64 }))).toBe(scryptSync("password", "NaCl", 64, { N: 1024, r: 8, p: 16 }).toString("hex"));
    const enc = await scryptHash("secret", salt16, { ln: 10, r: 8, p: 1, length: 32 });
    expect(parseScrypt(enc).params).toEqual({ ln: 10, r: 8, p: 1, length: 32 });
    expect(await scryptCheck("secret", enc)).toBe(true);
    expect(await scryptCheck("Secret", enc)).toBe(false);
  });
});

describe("helpers", () => {
  it("formats digests", () => {
    expect(formatDigest("00ff", "HEX")).toBe("00FF");
    expect(formatDigest("fbff", "base64")).toBe("+/8=");
    expect(formatDigest("fbff", "base64url")).toBe("-_8");
  });
  it("compares with expected values", () => {
    const h = KNOWN.sha256[1];
    expect(digestMatches(h, `  ${h.toUpperCase()} `)).toBe(true);
    expect(digestMatches(h, `sha256:${h}`)).toBe(true);
    expect(digestMatches(h, "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=")).toBe(true);
    expect(digestMatches(h, "ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0")).toBe(true);
    expect(digestMatches(h, h.slice(0, 63) + "0")).toBe(false);
    expect(normalizeExpected("0xABCD")).toBe("ABCD");
  });
  it("parses SHA256SUMS / BSD checksum files", () => {
    const sums = parseSums(
      [
        "# comment",
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  empty.txt",
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad *bin/abc.iso",
        "SHA256 (my file.zip) = E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",
        "MD5 (a.txt) = d41d8cd98f00b204e9800998ecf8427e",
      ].join("\n"),
    );
    expect(sums).toHaveLength(4);
    expect(sums[0]).toEqual({ hash: KNOWN.sha256[0], file: "empty.txt" });
    expect(sums[1].file).toBe("bin/abc.iso");
    expect(sums[2]).toMatchObject({ file: "my file.zip", algo: "sha256", hash: KNOWN.sha256[0] });
    expect(algoFromTag(sums[3].algo)).toBe("md5");
    expect(algoFromTag("SHA3-256")).toBe("sha3-256");
  });
  it("guesses algorithms from digest length", () => {
    expect(algosForHexLength(32)).toEqual(["md5"]);
    expect(algosForHexLength(64)[0]).toBe("sha256");
  });
});
