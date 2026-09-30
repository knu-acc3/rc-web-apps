import { describe, expect, it } from "vitest";
import { parseJson } from "@/sections/code/kit/json";
import { convert } from "@/sections/data/convert";
import { detectDelimiter, guardCell, parseCsv, toHtmlTable, toMarkdownTable, writeCsv } from "@/sections/data/csv";
import { parseEnv, writeEnv } from "@/sections/data/env";
import { recordsToRows } from "@/sections/data/tabular";
import { toTypeScript, toZod } from "@/sections/data/typegen";
import { parseXml } from "@/sections/data/xml";
import { dumpYaml, needsQuotes } from "@/sections/data/yaml";

describe("CSV", () => {
  it("RFC 4180 round-trip: quotes, delimiters, embedded newlines, BOM", () => {
    const rows = [
      ["name", "note", "sum"],
      ["Иван, мл.", 'сказал "да"', "-1.5"],
      ["multi", "line1\nline2", "0"],
      [" pad ", "", "12345678901234567890"],
    ];
    const csv = writeCsv(rows, { bom: true });
    expect(csv.startsWith("\uFEFFname,note,sum\r\n")).toBe(true);
    expect(csv).toContain('"Иван, мл.","сказал ""да""",-1.5');
    expect(parseCsv(csv).rows).toEqual(rows);
    const semi = writeCsv(rows, { delimiter: ";" });
    expect(parseCsv(semi).delimiter).toBe(";");
    expect(parseCsv(semi).rows).toEqual(rows);
  });
  it("detects the delimiter over several lines, respecting quotes", () => {
    expect(detectDelimiter('a;b;c\n"x,y";2;3\n4;5;6')).toBe(";");
    expect(detectDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(detectDelimiter("a,b\n1,2\n3,4")).toBe(",");
    expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
  });
  it("injection guard is opt-in and never touches numbers", () => {
    expect(writeCsv([["=SUM(A1)", "-5", "-1.5e3", "@x", "+7 701"]])).toBe("=SUM(A1),-5,-1.5e3,@x,+7 701");
    expect(writeCsv([["=SUM(A1)", "-5", "-1.5e3", "@x", "+7 701"]], { injectionGuard: true })).toBe("'=SUM(A1),-5,-1.5e3,'@x,'+7 701");
    expect(guardCell("-42")).toBe("-42");
    expect(guardCell("+5")).toBe("+5");
  });
  it("handles 100k rows without recursion problems", async () => {
    const arr = Array.from({ length: 100_000 }, (_, i) => ({ id: i, name: `n${i}`, v: -i }));
    const json = JSON.stringify(arr);
    const { output } = await convert("json", "csv", json);
    const lines = output.split("\r\n");
    expect(lines).toHaveLength(100_001);
    expect(lines[0]).toBe("id,name,v");
    expect(lines[5]).toBe("4,n4,-4");
    const back = await convert("csv", "json", output, { typed: true, indent: 0 });
    expect(back.output.startsWith('[{"id":0,"name":"n0","v":0},{"id":1')).toBe(true);
  });
  it("markdown and html tables", () => {
    expect(toMarkdownTable([["a", "b|c"], ["1", "2"]])).toBe("| a | b\\|c |\n| --- | --- |\n| 1 | 2 |");
    expect(toHtmlTable([["a"], ["<b>"]])).toContain("<td>&lt;b&gt;</td>");
  });
});

describe("JSON ↔ CSV", () => {
  it("flattens nested objects with dot paths and arrays by index", () => {
    const { value } = parseJson('[{"id":1,"user":{"name":"Ann","tags":["a","b"]},"big":12345678901234567890},{"id":2,"extra":true}]');
    expect(recordsToRows(value)).toEqual([
      ["id", "user.name", "user.tags.0", "user.tags.1", "big", "extra"],
      ["1", "Ann", "a", "b", "12345678901234567890", ""],
      ["2", "", "", "", "", "true"],
    ]);
    expect(recordsToRows(value, { arrays: "join" })[1]).toContain("a; b");
  });
  it("typed CSV → JSON keeps big numbers exact; strings stay strings otherwise", async () => {
    const csv = "id,amount,flag,name\n9007199254740993,-0.10,true,012\n";
    expect((await convert("csv", "json", csv, { typed: true, indent: 0 })).output).toBe('[{"id":9007199254740993,"amount":"-0.10","flag":true,"name":"012"}]\n'.replace('"-0.10"', "-0.10"));
    expect((await convert("csv", "json", csv, { indent: 0 })).output).toBe('[{"id":"9007199254740993","amount":"-0.10","flag":"true","name":"012"}]\n');
    expect((await convert("csv", "json", "a.b,a.c\n1,2", { typed: true, nested: true, indent: 0 })).output).toBe('[{"a":{"b":1,"c":2}}]\n');
  });
});

describe("YAML", () => {
  it("quotes YAML 1.1 ambiguities", () => {
    for (const s of ["yes", "no", "on", "off", "Y", "n", "true", "null", "~", "012", "1e3", "12:30", "2024-01-01", "0x1F", ".5", "", " lead", "- x", "a: b", "#tag", "@x", "*ref"]) expect(needsQuotes(s), s).toBe(true);
    for (const s of ["hello", "http://x", "Алматы", "a-b", "v1.2.3", "1.2.3"]) expect(needsQuotes(s), s).toBe(false);
  });
  it("JSON → YAML → JSON is lossless", async () => {
    const src = '{"country":"NO","answer":"yes","time":"12:30","date":"2024-01-01","zip":"012","big":12345678901234567890,"list":["- x","http://x",1.5,null,true],"nested":{"k":[{"a":1,"b":"on"}]},"text":"line1\\nline2\\n","empty":{},"arr":[]}';
    const y = await convert("json", "yaml", src);
    expect(y.output).toContain("country: 'NO'");
    expect(y.output).toContain("answer: 'yes'");
    expect(y.output).toContain("time: '12:30'");
    expect(y.output).toContain("big: 12345678901234567890");
    expect(y.output).toContain("  - '- x'");
    expect(y.output).toContain("text: |\n  line1\n  line2");
    const back = await convert("yaml", "json", y.output, { indent: 0 });
    expect(back.output.trim()).toBe(src);
  });
  it("YAML features: anchors, merge keys, block scalars, '- http://x' and '- 12:30', multi-doc", async () => {
    const y = "base: &b\n  a: 1\nchild:\n  <<: *b\n  c: 2\nlist:\n  - http://x\n  - 12:30\nfolded: >\n  a\n  b\nhex: 0x1F\n";
    const r = await convert("yaml", "json", y, { indent: 0 });
    expect(r.output.trim()).toBe('{"base":{"a":1},"child":{"a":1,"c":2},"list":["http://x","12:30"],"folded":"a b\\n","hex":31}');
    const multi = await convert("yaml", "json", "a: 1\n---\nb: 2\n", { indent: 0 });
    expect(multi.output.trim()).toBe('[{"a":1},{"b":2}]');
    expect(multi.warnings[0].code).toBe("yaml-multi");
    await expect(convert("yaml", "json", "a: [1, 2")).rejects.toMatchObject({ code: "yaml-syntax" });
  });
  it("dumps sequences of mappings", () => {
    const { value } = parseJson('[{"a":1,"b":{"c":2}},{"d":[1,2]}]');
    expect(dumpYaml(value)).toBe("- a: 1\n  b:\n    c: 2\n- d:\n    - 1\n    - 2\n");
  });
});

describe("XML", () => {
  it("parses with DOCTYPE, BOM, CDATA, entities and maps to JSON", async () => {
    const xml = '\uFEFF<?xml version="1.0"?>\n<!DOCTYPE note [<!ENTITY x "y">]>\n<catalog lang="ru">\n  <book id="1"><title>Мастер &amp; Маргарита</title><price>12345678901234567890</price></book>\n  <book id="2"><title><![CDATA[<b>Idiot</b>]]></title></book>\n  <empty/>\n</catalog>';
    const r = await convert("xml", "json", xml, { indent: 0 });
    expect(r.output.trim()).toBe('{"catalog":{"@lang":"ru","book":[{"@id":"1","title":"Мастер & Маргарита","price":"12345678901234567890"},{"@id":"2","title":"<b>Idiot</b>"}],"empty":""}}');
  });
  it("XML → CSV uses the repeated elements as rows", async () => {
    const r = await convert("xml", "csv", '<catalog><book id="1"><title>A</title></book><book id="2"><title>B</title></book></catalog>');
    expect(r.output).toBe("@id,title\r\n1,A\r\n2,B");
    const j = await convert("json", "csv", '{"data":[{"a":1},{"a":2}],"total":2}');
    expect(j.output).toBe("a\r\n1\r\n2");
  });
  it("reports errors with line and column", () => {
    expect(() => parseXml("<a>\n  <b></a>")).toThrowError(/mismatched-tag at 2:6/);
    expect(() => parseXml("<a>")).toThrowError(/unclosed-element/);
    expect(() => parseXml("<a/><b/>")).toThrowError(/multiple-roots/);
  });
  it("JSON → XML with attributes, arrays, escaping and name sanitizing", async () => {
    const r = await convert("json", "xml", '{"catalog":{"@lang":"ru","book":[{"title":"A & B"},{"title":"<C>"}],"2nd key":1}}');
    expect(r.output).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<catalog lang="ru">\n  <book>\n    <title>A &amp; B</title>\n  </book>\n  <book>\n    <title>&lt;C&gt;</title>\n  </book>\n  <_2nd_key>1</_2nd_key>\n</catalog>\n');
    expect(r.warnings[0]).toMatchObject({ code: "xml-renamed" });
    const arr = await convert("json", "xml", "[1,2]");
    expect(arr.output).toContain("<root>\n  <item>1</item>\n  <item>2</item>\n</root>");
  });
});

describe("TOML, JSONL, ENV", () => {
  it("TOML round-trip with big integers and dates", async () => {
    const toml = 'title = "x"\nbig = 12345678901234567890\n[owner]\nname = "Ann"\ndob = 1979-05-27T07:32:00Z\n';
    const j = await convert("toml", "json", toml, { indent: 0 });
    expect(j.output.trim()).toBe('{"title":"x","big":12345678901234567890,"owner":{"name":"Ann","dob":"1979-05-27T07:32:00.000Z"}}');
    const back = await convert("json", "toml", j.output);
    expect(back.output).toContain("big = 12345678901234567890");
    expect(back.output).toContain("[owner]");
    const n = await convert("json", "toml", '{"a":null,"b":1}');
    expect(n.warnings[0]).toMatchObject({ code: "toml-null", detail: "a" });
  });
  it("JSONL both ways with line errors", async () => {
    expect((await convert("jsonl", "json", '{"a":1}\n\n{"a":2}\n', { indent: 0 })).output.trim()).toBe('[{"a":1},{"a":2}]');
    expect((await convert("json", "jsonl", '[{"a":1},{"b":[1,2]}]')).output).toBe('{"a":1}\n{"b":[1,2]}\n');
    await expect(convert("jsonl", "json", '{"a":1}\n{"a":}\n')).rejects.toMatchObject({ line: 2 });
  });
  it("ENV parsing and writing", () => {
    const { value } = parseEnv('# c\nexport A=1\nB="x y # not comment"\nC=plain # comment\nD=\'lit $X\'\nE="multi\nline"\n');
    expect(value.entries).toEqual([
      ["A", "1"],
      ["B", "x y # not comment"],
      ["C", "plain"],
      ["D", "lit $X"],
      ["E", "multi\nline"],
    ]);
    const j = parseJson('{"db":{"host":"localhost","port":5432},"debug":true,"name":"My App"}').value;
    expect(writeEnv(j)).toBe('DB__HOST=localhost\nDB__PORT=5432\nDEBUG=true\nNAME="My App"\n');
  });
});

describe("TypeScript and Zod", () => {
  const { value } = parseJson('{"users":[{"id":1,"name":"Ann","email":null},{"id":2,"name":"Bob","email":"b@x.io","tags":["a"]}],"total":2,"meta":{"page-size":10}}');
  it("interfaces with optional fields and unions", () => {
    const ts = toTypeScript(value);
    expect(ts).toContain("export interface User {\n  id: number;\n  name: string;\n  email: null | string;\n  tags?: string[];\n}");
    expect(ts).toContain('export interface Meta {\n  "page-size": number;\n}');
    expect(ts).toContain("export interface Root {\n  users: User[];\n  total: number;\n  meta: Meta;\n}");
  });
  it("zod schema", () => {
    const z = toZod(value);
    expect(z).toContain("email: z.string().nullable(),");
    expect(z).toContain("tags: z.array(z.string()).optional(),");
    expect(z).toContain("export type Root = z.infer<typeof rootSchema>;");
  });
});
