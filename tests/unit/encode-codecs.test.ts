import { describe, expect, it } from "vitest";
import { bytesToBase64, utf8Encode } from "@/sections/code/kit/bytes";
import { decodeToBlob, encodeBlob, sniffMime } from "@/sections/encode/b64file";
import {
  ascii85Decode,
  ascii85Encode,
  atbash,
  base32Decode,
  base32Encode,
  base58Decode,
  base58Encode,
  base64,
  baseToText,
  caesar,
  CYRILLIC,
  json,
  LATIN,
  qpDecode,
  qpEncode,
  rot13,
  rot47,
  textToBase,
  unicode,
  url,
  z85Decode,
  z85Encode,
} from "@/sections/encode/codecs";
import { decodeEntities, encodeEntities, ENTITY_COUNT } from "@/sections/encode/html";
import { decodeMorse, encodeMorse, morseTimeline, renderWav } from "@/sections/encode/morse";
import { spell } from "@/sections/encode/phonetic";
import { domainToAscii, domainToUnicode, punyDecode, punyEncode } from "@/sections/encode/punycode";

const u = (s: string) => utf8Encode(s);
const str = (b: Uint8Array) => new TextDecoder().decode(b);

describe("base64 codec", () => {
  it("encodes UTF-8, url-safe, unpadded, MIME wrap", () => {
    expect(base64.encode("Привет", {}).text).toBe("0J/RgNC40LLQtdGC");
    expect(base64.encode("ûÿ", { urlSafe: true }).text).toBe(bytesToBase64(u("ûÿ"), { urlSafe: true }));
    expect(base64.encode("a".repeat(100), { wrap: true }).text.split("\n")[0]).toHaveLength(76);
  });
  it("decodes tolerant input and reports bad characters with position", () => {
    expect(base64.decode("SGVsbG8", {}).text).toBe("Hello");
    expect(base64.decode("data:text/plain;base64,SGVsbG8=", {}).text).toBe("Hello");
    const bad = base64.decode("SGV$bG8=", {});
    expect(bad.error).toMatchObject({ code: "b64.char", pos: 3, detail: "$" });
    expect(base64.decode("/w==", {})).toMatchObject({ error: { code: "notUtf8" } });
  });
});

describe("url codec", () => {
  it("three encode modes", () => {
    const s = "a b&c=д/?";
    expect(url.encode(s, { mode: "component" }).text).toBe("a%20b%26c%3D%D0%B4%2F%3F");
    expect(url.encode(s, { mode: "uri" }).text).toBe("a%20b&c=%D0%B4/?");
    expect(url.encode("a b*~!", { mode: "form" }).text).toBe("a+b*%7E%21");
  });
  it("decodes with precise errors", () => {
    expect(url.decode("%D0%B4+x", { plus: true }).text).toBe("д x");
    expect(url.decode("100%", {}).error).toMatchObject({ code: "url.percent", pos: 3 });
    expect(url.decode("ok%E0%A4", {}).error).toMatchObject({ code: "url.utf8", pos: 2, detail: "%E0%A4" });
    expect(url.encode("\uD800", {}).error?.code).toBe("url.surrogate");
  });
});

describe("binary / hex / octal / decimal", () => {
  it("round-trips with grouping", () => {
    expect(textToBase("Hi", 2)).toBe("01001000 01101001");
    expect(textToBase("Hi", 16, { upper: true, sep: "" , group: 0 })).toBe("4869");
    expect(textToBase("Hi", 16, { prefix: true })).toBe("0x48 0x69");
    expect(textToBase("Hi", 8)).toBe("110 151");
    expect(textToBase("Hi", 10, { pad: false })).toBe("72 105");
    expect(textToBase("Hé", 16, { group: 2, sep: " " })).toBe("48c3 a9");
    expect(baseToText("01001000 01101001", 2).text).toBe("Hi");
    expect(baseToText("0100100001101001", 2).text).toBe("Hi");
    expect(baseToText("1001000 1101001", 2).text).toBe("Hi");
    expect(baseToText("0x48,0x69", 16).text).toBe("Hi");
    expect(baseToText("\\xd0\\xb4", 16).text).toBe("д");
    expect(baseToText("72 105", 10).text).toBe("Hi");
    expect(baseToText("110 151", 8).text).toBe("Hi");
  });
  it("reports errors", () => {
    expect(baseToText("0102", 2).error).toMatchObject({ code: "num.char", pos: 3, detail: "2" });
    expect(baseToText("300", 10).error?.code).toBe("num.range");
    expect(baseToText("72105", 10).error?.code).toBe("num.decimalSep");
    expect(baseToText("486", 16).error?.code).toBe("num.width");
  });
});

describe("base32 / base58 / base85 vectors", () => {
  it("RFC 4648 base32 and base32hex", () => {
    const v: [string, string, string][] = [
      ["", "", ""],
      ["f", "MY======", "CO======"],
      ["fo", "MZXQ====", "CPNG===="],
      ["foo", "MZXW6===", "CPNMU==="],
      ["foob", "MZXW6YQ=", "CPNMUOG="],
      ["fooba", "MZXW6YTB", "CPNMUOJ1"],
      ["foobar", "MZXW6YTBOI======", "CPNMUOJ1E8======"],
    ];
    for (const [p, b, h] of v) {
      expect(base32Encode(u(p))).toBe(b);
      expect(base32Encode(u(p), "hex")).toBe(h);
      expect(str(base32Decode(b))).toBe(p);
      expect(str(base32Decode(h, "hex"))).toBe(p);
    }
    expect(str(base32Decode(base32Encode(u("Hello"), "crockford").toLowerCase().replace(/0/g, "O"), "crockford"))).toBe("Hello");
  });
  it("base58 (Bitcoin alphabet)", () => {
    expect(base58Encode(u("Hello World"))).toBe("JxF12TrwUP45BMd");
    expect(base58Encode(new Uint8Array([0, 0, 1]))).toBe("112");
    expect(str(base58Decode("JxF12TrwUP45BMd"))).toBe("Hello World");
    expect([...base58Decode("112")]).toEqual([0, 0, 1]);
    expect(() => base58Decode("0OIl")).toThrow();
  });
  it("Ascii85 and Z85", () => {
    expect(ascii85Encode(u("Man "), false)).toBe("9jqo^");
    expect(ascii85Encode(u("Man is"), true)).toBe("<~9jqo^Bla~>");
    expect(ascii85Encode(new Uint8Array(4), false)).toBe("z");
    expect(str(ascii85Decode("<~9jqo^Bla~>"))).toBe("Man is");
    expect([...ascii85Decode("z")]).toEqual([0, 0, 0, 0]);
    const hw = new Uint8Array([0x86, 0x4f, 0xd2, 0x6f, 0xb5, 0x59, 0xf7, 0x5b]);
    expect(z85Encode(hw)).toBe("HelloWorld");
    expect([...z85Decode("HelloWorld")]).toEqual([...hw]);
  });
});

describe("escapes", () => {
  it("unicode escapes incl. astral characters", () => {
    expect(unicode.encode("Aд😀", { style: "js" }).text).toBe("A\\u0434\\uD83D\\uDE00");
    expect(unicode.encode("д😀", { style: "es6" }).text).toBe("\\u{434}\\u{1F600}");
    expect(unicode.encode("д", { style: "html" }).text).toBe("&#x434;");
    expect(unicode.encode("д😀", { style: "python" }).text).toBe("\\u0434\\U0001F600");
    expect(unicode.encode("Ab", { style: "uplus" }).text).toBe("U+0041 U+0062");
    expect(unicode.decode("A\\u0434\\uD83D\\uDE00 \\u{1F600} &#x434; &#1076; U+0041", {}).text).toBe("Aд😀 😀 д д A");
  });
  it("json escape", () => {
    expect(json.encode('a"b\n\tд', {}).text).toBe('"a\\"b\\n\\tд"');
    expect(json.encode("д", { ascii: true, quotes: false }).text).toBe("\\u0434");
    expect(json.decode('"a\\"b\\n\\u0434"', {}).text).toBe('a"b\nд');
    expect(json.decode("a\\qb", {}).error).toMatchObject({ code: "json.escape", pos: 1 });
  });
  it("quoted-printable soft breaks and charsets", () => {
    const long = "Съешь же ещё этих мягких французских булок, да выпей чаю.";
    const enc = qpEncode(long);
    for (const line of enc.split("\n")) expect(line.length).toBeLessThanOrEqual(76);
    expect(qpDecode(enc).text).toBe(long);
    expect(qpEncode("a b ")).toBe("a b=20");
    expect(qpEncode("x=1")).toBe("x=3D1");
    expect(qpDecode("=CF=F0=E8=E2=E5=F2", "windows-1251").text).toBe("Привет");
    expect(qpDecode("soft=\nbreak").text).toBe("softbreak");
  });
});

describe("classic ciphers", () => {
  it("rot13 / rot47", () => {
    expect(rot13("Hello, World!")).toBe("Uryyb, Jbeyq!");
    expect(rot13(rot13("abcXYZ"))).toBe("abcXYZ");
    expect(rot47("Hello")).toBe("w6==@");
  });
  it("caesar with Latin and Russian (33 letters incl. Ё)", () => {
    expect(CYRILLIC).toHaveLength(33);
    expect(caesar("abc xyz", 3, [LATIN])).toBe("def abc");
    expect(caesar("Привет", 3)).toBe("Тулезх");
    expect(caesar(caesar("Ёжик в тумане", 7), -7)).toBe("Ёжик в тумане");
    expect(caesar("Е", 1)).toBe("Ё");
  });
  it("atbash", () => {
    expect(atbash("Hello")).toBe("Svool");
    expect(atbash("Абя")).toBe("Яюа");
    expect(atbash(atbash("Съешь"))).toBe("Съешь");
  });
});

describe("HTML entities", () => {
  it("has the full WHATWG list", () => {
    expect(ENTITY_COUNT).toBe(2231);
  });
  it("decodes named (incl. legacy without semicolon), numeric and invalid references", () => {
    expect(decodeEntities("&laquo;Привет&raquo; &mdash; &copy; 2024 &hellip;")).toBe("«Привет» — © 2024 …");
    expect(decodeEntities("&amp &lt;b&gt; &copy2024")).toBe("& <b> ©2024");
    expect(decodeEntities("&#1055;&#x440;&#X438;")).toBe("При");
    expect(decodeEntities("&#0; &#xD800; &#x110000; &#150;")).toBe("� � � –");
    expect(decodeEntities("&notit; &unknown; & &#;")).toBe("¬it; &unknown; & &#;");
    expect(decodeEntities("&NotEqualTilde;")).toBe("≂̸");
  });
  it("encodes in several modes", () => {
    expect(encodeEntities(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    expect(encodeEntities("«д» ©", "named")).toBe("&laquo;&dcy;&raquo; &copy;");
    expect(encodeEntities("д😀", "decimal")).toBe("&#1076;&#128512;");
    expect(encodeEntities("д", "hex")).toBe("&#x434;");
  });
});

describe("Morse", () => {
  it("encodes Latin in any interface — SOS works", () => {
    expect(encodeMorse("SOS").text).toBe("... --- ...");
    expect(encodeMorse("sos help").text).toBe("... --- ... / .... . .-.. .--.");
    expect(encodeMorse("<SOS>").text).toBe("...---...");
  });
  it("encodes Russian and substitutes Kazakh letters", () => {
    expect(encodeMorse("Привет").text).toBe(".--. .-. .. .-- . -");
    expect(encodeMorse("Ёж").text).toBe(". ...-");
    const kz = encodeMorse("Қазақ");
    expect(kz.text).toBe("-.- .- --.. .- -.-");
    expect(kz.substituted).toEqual(["Қ", "қ"]);
    expect(encodeMorse("a#b").unknown).toEqual(["#"]);
  });
  it("decodes both alphabets and prosigns", () => {
    expect(decodeMorse("... --- ...").text).toBe("SOS");
    expect(decodeMorse("·−·· · −−").text).toBe("LEM");
    expect(decodeMorse(".--. .-. .. .-- . -", "cyrillic").text).toBe("ПРИВЕТ");
    expect(decodeMorse("...---...").text).toBe("<SOS>");
    expect(decodeMorse(".... .. / - .... . .-. .").text).toBe("HI THERE");
    expect(decodeMorse(".......... .-").unknown).toEqual([".........."]);
  });
  it("timing follows PARIS and Farnsworth", () => {
    // "PARIS " = 50 units; at 20 WPM one unit = 60 ms
    const { tones, total } = morseTimeline(".--. .- .-. .. ...", 20);
    expect(tones[0]).toEqual({ t: 0, d: 0.06 });
    expect(total + 7 * 0.06).toBeCloseTo(3, 5);
    const slow = morseTimeline(".- .-", 20, 10);
    expect(slow.total).toBeGreaterThan(morseTimeline(".- .-", 20).total);
    const wav = renderWav(tones, total, 600, 8000);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe("WAVE");
  });
});

describe("Punycode / IDN", () => {
  it("RFC 3492 samples", () => {
    expect(punyEncode("bücher")).toBe("bcher-kva");
    expect(punyEncode("3年B組金八先生")).toBe("3B-ww4c5e180e575a65lsy2b");
    expect(punyDecode("3B-ww4c5e180e575a65lsy2b")).toBe("3年B組金八先生");
    expect(punyEncode("ليهمابتكلموشعربي؟")).toBe("egbpdaj6bu4bxfgehfvwxn");
  });
  it("domains: .рф, .қаз, münchen.de, e-mail", () => {
    expect(domainToAscii("пример.рф")).toBe("xn--e1afmkfd.xn--p1ai");
    expect(domainToAscii("ҚАЗ")).toBe("xn--80ao21a");
    expect(domainToAscii("münchen.de")).toBe("xn--mnchen-3ya.de");
    expect(domainToAscii("info@пример.рф")).toBe("info@xn--e1afmkfd.xn--p1ai");
    expect(domainToUnicode("xn--e1afmkfd.xn--p1ai")).toBe("пример.рф");
    expect(domainToUnicode("XN--80AO21A")).toBe("қаз");
  });
});

describe("spelling alphabets", () => {
  it("NATO and Russian", () => {
    expect(spell("SOS 1", "nato")).toBe("Sierra Oscar Sierra / One");
    expect(spell("Юля", "russian")).toBe("Юрий Леонид Яков");
    expect(spell("ab", "russian")).toBe("Alfa Bravo");
  });
});

describe("chunked Base64 files", () => {
  it("chunked encoding equals one-shot encoding and decodes back", async () => {
    const data = new Uint8Array(100_003).map((_, i) => (i * 7 + 3) & 0xff);
    const blob = new Blob([data]);
    const enc = await encodeBlob(blob, {}, undefined, 3 * 1000);
    const text = await enc.text();
    expect(text).toBe(bytesToBase64(data));
    const dec = decodeToBlob(text.replace(/(.{76})/g, "$1\n"), undefined, 4 * 999);
    expect(new Uint8Array(await dec.blob.arrayBuffer())).toEqual(data);
    const uri = await (await encodeBlob(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], { type: "image/png" }), { dataUri: true })).text();
    expect(uri).toBe("data:image/png;base64,iVBORw==");
    expect(decodeToBlob(uri).mime).toBe("image/png");
    expect(sniffMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });
});
