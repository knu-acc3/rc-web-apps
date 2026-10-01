import { describe, expect, it } from "vitest";
import { base64ToBytes, bytesToBase64, bytesToHex, hexToBytes, utf8Decode, utf8Encode } from "@/tools/dev/shared/bytes";
import { countsLabel, textStats } from "@/tools/dev/shared/labels";

describe("kit/bytes", () => {
  it("base64 RFC 4648 vectors", () => {
    const vec: [string, string][] = [
      ["", ""],
      ["f", "Zg=="],
      ["fo", "Zm8="],
      ["foo", "Zm9v"],
      ["foob", "Zm9vYg=="],
      ["fooba", "Zm9vYmE="],
      ["foobar", "Zm9vYmFy"],
    ];
    for (const [plain, b64] of vec) {
      expect(bytesToBase64(utf8Encode(plain))).toBe(b64);
      expect(utf8Decode(base64ToBytes(b64))).toBe(plain);
      expect(utf8Decode(base64ToBytes(b64.replace(/=/g, "")))).toBe(plain);
    }
  });

  it("base64 url-safe, unpadded, whitespace and UTF-8", () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf]);
    expect(bytesToBase64(bytes)).toBe("+/+/");
    expect(bytesToBase64(bytes, { urlSafe: true })).toBe("-_-_");
    expect([...base64ToBytes("-_-_")]).toEqual([0xfb, 0xff, 0xbf]);
    expect(utf8Decode(base64ToBytes("0J/RgNC4\n0LLQtdGC"))).toBe("Привет");
    expect(bytesToBase64(utf8Encode("Привет"))).toBe("0J/RgNC40LLQtdGC");
    expect(() => base64ToBytes("abc$")).toThrow();
    expect(() => base64ToBytes("a")).toThrow();
    expect(() => base64ToBytes("Zg==Zg")).toThrow();
  });

  it("hex", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
    expect([...hexToBytes("0x00:0f:FF")]).toEqual([0, 15, 255]);
    expect(() => hexToBytes("abc")).toThrow();
    expect(() => hexToBytes("zz")).toThrow();
  });
});

describe("kit/labels", () => {
  it("counts lines and code points", () => {
    expect(textStats("")).toEqual({ lines: 0, chars: 0 });
    expect(textStats("a\nb")).toEqual({ lines: 2, chars: 3 });
    expect(textStats("😀")).toEqual({ lines: 1, chars: 1 });
  });
  it("russian plurals", () => {
    expect(countsLabel("ru", 1, 21)).toBe("1 строка · 21 символ");
    expect(countsLabel("ru", 3, 5)).toBe("3 строки · 5 символов");
    expect(countsLabel("en", 1, 2)).toBe("1 line · 2 characters");
  });
});
