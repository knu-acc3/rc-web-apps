import { describe, expect, it } from "vitest";
import { CHUNK, CryptError, decrypt, decryptText, encrypt, encryptText, isEncrypted, passwordBits } from "@/sections/file/lib/crypt";

const FAST = 2000; // iterations: real files use 600 000

async function bytes(b: Blob) {
  return new Uint8Array(await b.arrayBuffer());
}

describe("file encryption", () => {
  it("round-trips a multi-chunk file and its name", async () => {
    const data = new Uint8Array(CHUNK * 2 + 12345).map((_, i) => (i * 31) & 255);
    const enc = await encrypt(new Blob([data]), "пароль 123", { name: "отчёт.pdf", type: "application/pdf", size: data.length }, undefined, FAST);
    expect(isEncrypted(await bytes(enc.slice(0, 64)))).toBe(true);
    const { blob, meta } = await decrypt(enc, "пароль 123");
    expect(meta).toEqual({ name: "отчёт.pdf", type: "application/pdf", size: data.length });
    expect(await bytes(blob)).toEqual(data);
  });

  it("rejects a wrong password", async () => {
    const enc = await encrypt(new Blob(["secret"]), "right", { name: "a.txt", type: "text/plain", size: 6 }, undefined, FAST);
    await expect(decrypt(enc, "wrong")).rejects.toMatchObject({ code: "bad-password" });
  });

  it("detects tampering and truncation", async () => {
    const data = new Uint8Array(CHUNK + 100);
    const enc = await bytes(await encrypt(new Blob([data]), "pw", { name: "x", type: "", size: data.length }, undefined, FAST));
    const flipped = enc.slice();
    flipped[flipped.length - 50] ^= 1;
    await expect(decrypt(new Blob([flipped]), "pw")).rejects.toBeInstanceOf(CryptError);
    // Cut off the last chunk: the previous one isn't marked "last", so this fails too.
    const cut = enc.slice(0, 38 + CHUNK + 16);
    await expect(decrypt(new Blob([cut]), "pw")).rejects.toMatchObject({ code: "corrupt" });
  });

  it("says when a file isn't encrypted", async () => {
    await expect(decrypt(new Blob(["hello world, this is plain text, not encrypted at all"]), "pw")).rejects.toMatchObject({ code: "not-encrypted" });
  });

  it("encrypts text to Base64 and back", async () => {
    const c = await encryptText("Встречаемся в 7 🙂", "ключ", FAST);
    expect(c).toMatch(/^[A-Za-z0-9+/=]+$/);
    expect(await decryptText(c, "ключ")).toBe("Встречаемся в 7 🙂");
    // Same text, same password → different ciphertext (random salt and nonce).
    expect(await encryptText("a", "k", FAST)).not.toBe(await encryptText("a", "k", FAST));
  });

  it("estimates password strength", () => {
    expect(passwordBits("")).toBe(0);
    expect(passwordBits("1234")).toBeLessThan(20);
    expect(passwordBits("Корова-Луна-42-Ракета")).toBeGreaterThan(80);
  });
});
