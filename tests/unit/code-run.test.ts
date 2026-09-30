import { describe, expect, it } from "vitest";
import { SAMPLES, type FormatLang } from "@/sections/code/langs";
import { CodeError, formatCode, formatJsonText, minifyCode, validateCode } from "@/sections/code/run";

const failOf = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    if (e instanceof CodeError) return e.fail;
    throw e;
  }
  throw new Error("expected a failure");
};

describe("formatCode", () => {
  it("formats every sample without errors", async () => {
    for (const lang of ["html", "css", "scss", "less", "javascript", "typescript", "markdown", "yaml", "graphql", "xml", "sql"] as FormatLang[]) {
      const r = await formatCode(lang, SAMPLES[lang], { indent: "2" });
      expect(r.output.length, lang).toBeGreaterThan(10);
    }
  });
  it("honours indent, quotes and semicolons for JavaScript", async () => {
    const r = await formatCode("javascript", 'function f(){return "x"}', { indent: "4", singleQuote: true, semi: false });
    expect(r.output).toBe("function f() {\n    return 'x'\n}\n");
    const t = await formatCode("javascript", "if(a){b()}", { indent: "tab" });
    expect(t.output).toBe("if (a) {\n\tb();\n}\n");
  });
  it("reports syntax errors with 1-based positions", async () => {
    const f = await failOf(formatCode("javascript", "const a = 1;\nlet b = ;", { indent: "2" }));
    expect(f).toMatchObject({ code: "syntax", line: 2, col: 9 });
    const s = await failOf(formatCode("sql", "select * from where (", { indent: "2" }));
    expect(s.code).toBe("sql-parse");
    expect(s.line).toBe(1);
  });
  it("formats SQL per dialect and keyword case", async () => {
    const r = await formatCode("sql", "select `id` from t where x between 1 and 5", { indent: "2", dialect: "mysql", keywordCase: "upper" });
    expect(r.output).toContain("SELECT");
    expect(r.output).toContain("`id`");
    expect(r.output).toContain("x BETWEEN 1 AND 5");
    const l = await formatCode("sql", "SELECT a FROM t", { indent: "2", keywordCase: "lower" });
    expect(l.output).toContain("select");
  });
  it("formats XML fragments with a warning and rejects broken XML", async () => {
    const r = await formatCode("xml", "<a>1</a><b>2</b>", { indent: "2" });
    expect(r.warnings).toContain("xml-fragment");
    const f = await failOf(formatCode("xml", "<a><b></a>", { indent: "2" }));
    expect(f.code).toBe("xml-mismatched-tag");
  });
});

describe("formatJsonText", () => {
  it("keeps big numbers, reports duplicates and builds a tree", () => {
    const r = formatJsonText('{"a":12345678901234567890,"a":2,"b":[1,{"c":null}]}', { indent: 2, tree: true });
    expect(r.output).toContain("12345678901234567890");
    expect(r.warnings.map((w) => w.code)).toContain("dup-key");
    expect(r.tree?.t).toBe("o");
    expect(r.tree?.size).toBe(3);
    expect(r.depth).toBe(4);
  });
  it("sorts keys, minifies and escapes", () => {
    expect(formatJsonText('{"b":1,"a":"é"}', { indent: 0, sortKeys: true, ascii: true }).output).toBe('{"a":"\\u00e9","b":1}');
  });
  it("gives error positions", () => {
    try {
      formatJsonText('{\n  "a": 1\n  "b": 2\n}', { indent: 2 });
      throw new Error("no");
    } catch (e) {
      expect((e as CodeError).fail).toMatchObject({ code: "json-expected-comma", line: 3, col: 3 });
    }
  });
});

describe("minifyCode", () => {
  it("reports sizes and gzip sizes", async () => {
    const r = await minifyCode("css", ".a {\n  color: red;\n}\n");
    expect(r.output).toBe(".a{color:red}");
    expect(r.before).toBe(21);
    expect(r.after).toBe(13);
    expect(r.gzAfter).toBeGreaterThan(0);
  });
  it("minifies JSON losslessly", async () => {
    expect((await minifyCode("json", '{ "n": 1.10, "big": 12345678901234567890 }')).output).toBe('{"n":1.10,"big":12345678901234567890}');
  });
  it("maps JS errors to positions", async () => {
    const f = await failOf(minifyCode("javascript", 'let a = 1\nlet s = "abc'));
    expect(f).toMatchObject({ code: "js-unterminated-string", line: 2, col: 9 });
  });
});

describe("validateCode", () => {
  it("JSON: valid, strict errors and JSONC hint", async () => {
    const ok = await validateCode("json", '{"a":[1,2],"id":9007199254740993}');
    expect(ok.summary).toMatchObject({ kind: "object", depth: 3 });
    expect(ok.warnings.map((w) => w.code)).toContain("json-big-number");
    const f = await failOf(validateCode("json", '{"a":1,}'));
    expect(f.detail).toBe("jsonc");
  });
  it("YAML: errors with line and YAML 1.1 warnings", async () => {
    const ok = await validateCode("yaml", "country: NO\nlist:\n  - on\n");
    expect(ok.warnings.map((w) => w.detail)).toEqual(["NO", "on"]);
    const f = await failOf(validateCode("yaml", "a: 1\na: 2\n"));
    expect(f).toMatchObject({ code: "yaml-syntax", line: 2 });
    const tab = await failOf(validateCode("yaml", "a:\n\tb: 1\n"));
    expect(tab.code).toBe("yaml-syntax");
  });
  it("XML: summary and errors", async () => {
    const ok = await validateCode("xml", '<?xml version="1.0"?><!DOCTYPE a><a><b/><c>x</c></a>');
    expect(ok.summary).toEqual({ root: "a", elements: 3 });
    const f = await failOf(validateCode("xml", "<a>\n  <b>\n</a>"));
    expect(f).toMatchObject({ code: "xml-mismatched-tag", line: 3 });
  });
});
