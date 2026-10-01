import { describe, expect, it } from "vitest";
import { format as formatSql } from "sql-formatter";
import { minifyJs } from "@/sections/code/lib/jsmin";
import { formatXml, minifyHtml, minifySql } from "@/sections/code/lib/markup";

describe("JS minifier (whitespace and comments only)", () => {
  it("removes comments and spaces but keeps word separators", () => {
    expect(minifyJs("const  a = 1 ; // one\nlet b = a + 2; /* two */")).toBe("const a=1;let b=a+2;");
    expect(minifyJs("function f ( x ) {\n  return x * 2;\n}")).toBe("function f(x){return x*2;}");
  });
  it("keeps line breaks where ASI or restricted productions depend on them", () => {
    expect(minifyJs("let a = 1\nlet b = 2")).toBe("let a=1\nlet b=2");
    expect(minifyJs("function f() {\n  return\n  42\n}")).toBe("function f(){return\n42}");
    expect(minifyJs("a\n++b")).toBe("a\n++b");
    expect(minifyJs("x = a\n!b")).toBe("x=a\n!b");
    expect(minifyJs("foo(\n  1,\n  2\n)")).toBe("foo(1,2)");
    expect(minifyJs("a = b\n  .c()\n  .d()")).toBe("a=b.c().d()");
  });
  it("does not glue operators or break numbers", () => {
    expect(minifyJs("a + +b; c - -d; e + ++f")).toBe("a+ +b;c- -d;e+ ++f");
    expect(minifyJs("1 .toString(); 1.5 .toFixed()")).toBe("1 .toString();1.5.toFixed()");
  });
  it("keeps strings, templates and regex literals verbatim", () => {
    expect(minifyJs('s = "a  //  b" + \'c /* d */\'')).toBe('s="a  //  b"+\'c /* d */\'');
    expect(minifyJs("t = `x  ${ a + `in ${ b }  ner` }  y`")).toBe("t=`x  ${ a + `in ${ b }  ner` }  y`");
    expect(minifyJs("r = /  a[/]b  /g.test(s)")).toBe("r=/  a[/]b  /g.test(s)");
    expect(minifyJs("x = a / b / c")).toBe("x=a/b/c");
    expect(minifyJs("return /re/ in x")).toBe("return/re/ in x");
    expect(minifyJs("x = a / /re/.source.length")).toBe("x=a/ /re/.source.length");
  });
  it("keeps /*! license comments and hashbang", () => {
    expect(minifyJs("/*! MIT */\nconst a = 1")).toBe("/*! MIT */const a=1");
    expect(minifyJs("#!/usr/bin/env node\nconsole.log( 1 )")).toBe("#!/usr/bin/env node\nconsole.log(1)");
    expect(minifyJs("/*! MIT */ const a = 1", { keepLicense: false })).toBe("const a=1");
  });
  it("reports unterminated literals", () => {
    expect(() => minifyJs('a = "abc')).toThrow("unterminated-string");
    expect(() => minifyJs("a = `abc")).toThrow("unterminated-template");
  });
});

describe("HTML minifier", () => {
  it("collapses whitespace but keeps inline spacing", () => {
    expect(minifyHtml("<div>\n  <p>Hello   <b>big</b>  world</p>\n</div>")).toBe("<div><p>Hello <b>big</b> world</p></div>");
  });
  it("removes comments transparently and keeps conditional ones", () => {
    expect(minifyHtml("<p>a <!-- x --> b</p>")).toBe("<p>a b</p>");
    expect(minifyHtml("<!--[if IE]><p>IE</p><![endif]-->")).toBe("<!--[if IE]><p>IE</p><![endif]-->");
  });
  it("keeps pre/textarea verbatim and minifies inline CSS", () => {
    expect(minifyHtml("<pre>  a\n   b </pre>\n<textarea> x  y </textarea>")).toBe("<pre>  a\n   b </pre><textarea> x  y </textarea>");
    expect(minifyHtml("<style>\n a { color : red ; }\n</style>")).toBe("<style>a{color:red}</style>");
  });
  it("tidies tags without touching attribute values", () => {
    expect(minifyHtml('<a   href = "x  y"\n   class="c">t</a>')).toBe('<a href="x  y" class="c">t</a>');
    expect(minifyHtml("<br />")).toBe("<br/>");
  });
});

describe("XML formatter", () => {
  const xml = '<?xml version="1.0"?>\n<!DOCTYPE note [<!ENTITY a "b">]><note id="1"><to>Tove</to><from/><!-- c --><body><![CDATA[x < y]]></body></note>';
  it("pretty-prints with DOCTYPE, comments and CDATA", () => {
    expect(formatXml(xml)).toBe(
      '<?xml version="1.0"?>\n<!DOCTYPE note [<!ENTITY a "b">]>\n<note id="1">\n  <to>Tove</to>\n  <from/>\n  <!-- c -->\n  <body><![CDATA[x < y]]></body>\n</note>\n',
    );
  });
  it("minifies and handles BOM", () => {
    expect(formatXml("\uFEFF<a>\n  <b> x </b>\n  <!-- c -->\n</a>", { minify: true })).toBe("<a><b> x </b></a>");
  });
  it("respects xml:space=preserve", () => {
    expect(formatXml('<a><p xml:space="preserve">  x  <i>y</i> </p></a>')).toBe('<a>\n  <p xml:space="preserve">  x  <i>y</i> </p>\n</a>\n');
  });
});

describe("SQL minifier", () => {
  it("collapses whitespace outside strings and comments", () => {
    expect(minifySql("SELECT  a ,\n  b\nFROM t -- note\nWHERE x = 'a   b' AND y IN ( 1 , 2 ) ;")).toBe("SELECT a,b FROM t WHERE x = 'a   b' AND y IN (1,2);");
  });
  it("keeps executable comments, hints and dollar-quoted bodies", () => {
    expect(minifySql("SELECT /*+ INDEX(t i) */ *  FROM t /* x */")).toBe("SELECT /*+ INDEX(t i) */ * FROM t");
    expect(minifySql("CREATE FUNCTION f() RETURNS int AS $$\n  -- body\n  SELECT 1;\n$$ LANGUAGE sql;")).toBe("CREATE FUNCTION f() RETURNS int AS $$\n  -- body\n  SELECT 1;\n$$ LANGUAGE sql;");
  });
  it("keeps line breaks after # lines", () => {
    expect(minifySql("SELECT 1 # comment\nFROM t")).toBe("SELECT 1 # comment\nFROM t");
  });
});

describe("sql-formatter regressions from the legacy tool", () => {
  it("keeps comments after --", () => {
    const out = formatSql("SELECT a -- the a column\nFROM t", { language: "sql" });
    expect(out).toContain("-- the a column");
    expect(out).toMatch(/-- the a column\nFROM/);
  });
  it("keeps spaces inside strings", () => {
    expect(formatSql("select 'a    b' from t", { language: "sql" })).toContain("'a    b'");
  });
  it("keeps BETWEEN … AND together", () => {
    const out = formatSql("select * from t where x between 1 and 5 and y = 2", { language: "sql", keywordCase: "upper" });
    expect(out).toContain("x BETWEEN 1 AND 5");
  });
  it("does not uppercase quoted identifiers", () => {
    const out = formatSql('select "select", `from` from "myTable"', { language: "mysql", keywordCase: "upper" });
    expect(out).toContain('"select"');
    expect(out).toContain("`from`");
    expect(out).toContain('"myTable"');
  });
});
