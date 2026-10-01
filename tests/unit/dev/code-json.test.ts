import { describe, expect, it } from "vitest";
import { JsonParseError, parseJson, stringifyJson } from "@/tools/dev/shared/json";
import { normalizeNumber, Num, Obj, toJs } from "@/tools/dev/shared/value";

const err = (s: string, lenient = false) => {
  try {
    parseJson(s, { lenient });
  } catch (e) {
    return e as JsonParseError;
  }
  throw new Error("parsed");
};

describe("tolerant JSON", () => {
  it("keeps big integers and long decimals exactly", () => {
    const src = '{"id":12345678901234567890,"x":0.1000000000000000000001,"e":-1.5E+300,"n":[1,2]}';
    const { value } = parseJson(src);
    expect(stringifyJson(value, { indent: 0 })).toBe(src);
    expect((value as Obj).get("id")).toEqual(new Num("12345678901234567890"));
    expect(toJs(value, true)).toMatchObject({ id: 12345678901234567890n });
  });

  it("pretty-prints with key order kept (incl. integer-like keys)", () => {
    const { value } = parseJson('{"b":1,"2":2,"a":{"x":[],"y":{}}}');
    expect(stringifyJson(value, { indent: 2 })).toBe('{\n  "b": 1,\n  "2": 2,\n  "a": {\n    "x": [],\n    "y": {}\n  }\n}');
    expect(stringifyJson(value, { indent: 2, sortKeys: true }).startsWith('{\n  "2": 2')).toBe(true);
  });

  it("reports duplicate keys with positions and keeps both", () => {
    const { value, warnings } = parseJson('{\n  "a": 1,\n  "a": 2\n}');
    expect(warnings).toEqual([{ code: "dup-key", key: "a", line: 3, col: 3, offset: 14 }]);
    expect((value as Obj).entries).toHaveLength(2);
    expect((value as Obj).get("a")).toEqual(new Num("2"));
  });

  it("error positions (line / column in code points)", () => {
    expect(err('{"a": 1,}')).toMatchObject({ code: "unexpected-token", line: 1, col: 9 });
    expect(err('{\n  "a": 1\n  "b": 2\n}')).toMatchObject({ code: "expected-comma", line: 3, col: 3 });
    expect(err('{"😀": tru}')).toMatchObject({ code: "unexpected-token", line: 1, col: 7 });
    expect(err('{"a": 01}')).toMatchObject({ code: "bad-number" });
    expect(err('["a\tb"]')).toMatchObject({ code: "control-char", col: 4 });
    expect(err('{"a": "x\\q"}')).toMatchObject({ code: "bad-escape" });
    expect(err('{"a": 1} x')).toMatchObject({ code: "trailing-data", col: 10 });
    expect(err('{"a": [1, 2')).toMatchObject({ code: "unexpected-end" });
    expect(err("   ")).toMatchObject({ code: "empty" });
    expect(err("{'a': 1}")).toMatchObject({ code: "expected-key" });
  });

  it("lenient mode accepts comments, trailing commas, single quotes and BOM with warnings", () => {
    const { value, warnings } = parseJson("﻿{\n // c\n 'a': [1, 2,], /* x */\n \"b\": 'q',\n}", { lenient: true });
    expect(stringifyJson(value, { indent: 0 })).toBe('{"a":[1,2],"b":"q"}');
    expect(warnings.map((w) => w.code)).toEqual(["bom", "comment", "single-quote", "trailing-comma", "comment", "single-quote", "trailing-comma"]);
  });

  it("strings with escapes and unicode round-trip", () => {
    const src = '["\\u0414\\n\\"q\\"", "😀", "\\ud83d\\ude00"]';
    const { value } = parseJson(src);
    expect(value).toEqual(["Д\n\"q\"", "😀", "😀"]);
    expect(stringifyJson(value, { indent: 0, ascii: true })).toBe('["\\u0414\\n\\"q\\"","\\ud83d\\ude00","\\ud83d\\ude00"]');
  });

  it("handles deep nesting up to the limit and reports too-deep beyond it", () => {
    const deep = "[".repeat(1000) + "]".repeat(1000);
    expect(() => parseJson(deep)).not.toThrow();
    expect(err("[".repeat(1500) + "]".repeat(1500))).toMatchObject({ code: "too-deep" });
  });

  it("normalizes YAML/TOML number literals", () => {
    expect(normalizeNumber("012")).toBe("12");
    expect(normalizeNumber("+5")).toBe("5");
    expect(normalizeNumber("0x1F")).toBe("31");
    expect(normalizeNumber("0o17")).toBe("15");
    expect(normalizeNumber("1_000_000")).toBe("1000000");
    expect(normalizeNumber(".5")).toBe("0.5");
    expect(normalizeNumber("1.")).toBe("1");
    expect(normalizeNumber("abc")).toBeNull();
  });
});
