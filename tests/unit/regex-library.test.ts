import { describe, expect, it } from "vitest";
import { captureGroups, findAll, replace } from "@/sections/regex/lib/engine";
import { exportRegex, jsLiteralBody } from "@/sections/regex/lib/exporters";
import { LIBRARY, testerFlags, testerText } from "@/sections/regex/lib/library";

describe("regex library", () => {
  it("has ~60 unique, complete patterns", () => {
    expect(LIBRARY.length).toBeGreaterThanOrEqual(55);
    expect(new Set(LIBRARY.map((p) => p.slug)).size).toBe(LIBRARY.length);
    for (const p of LIBRARY) {
      expect(p.slug, p.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(p.match.length, `${p.slug} match`).toBeGreaterThanOrEqual(3);
      expect(p.noMatch.length, `${p.slug} noMatch`).toBeGreaterThanOrEqual(3);
      for (const k of ["ru", "en"] as const) {
        expect(p.name[k].length, p.slug).toBeGreaterThan(2);
        expect(p.what[k].length, p.slug).toBeGreaterThan(20);
        expect(p.limits[k].length, p.slug).toBeGreaterThan(20);
      }
    }
  });

  for (const p of LIBRARY) {
    it(`${p.slug}: examples`, () => {
      const re = new RegExp(p.pattern, p.flags.replace(/[gy]/g, ""));
      for (const s of p.match) expect(re.test(s), `${p.slug} should match ${JSON.stringify(s)}`).toBe(true);
      for (const s of p.noMatch) expect(re.test(s), `${p.slug} should NOT match ${JSON.stringify(s)}`).toBe(false);
      if (p.mode === "full") {
        // In the tester every example is on its own line with the m flag.
        const found = findAll(p.pattern, testerFlags(p), testerText(p)).matches.map((m) => m.text);
        for (const s of p.match.filter((x) => !x.includes("\n"))) expect(found, `${p.slug} tester line ${s}`).toContain(s);
      }
    });
  }
});

describe("regex engine", () => {
  it("zero-length matches don't loop and advance by code point with u", () => {
    expect(findAll("", "g", "abc").matches.map((m) => m.index)).toEqual([0, 1, 2, 3]);
    expect(findAll("", "gu", "😀a").matches.map((m) => m.index)).toEqual([0, 2, 3]);
    expect(findAll("x*", "g", "axxb").matches.map((m) => m.text)).toEqual(["", "xx", "", ""]);
  });
  it("caps the number of matches", () => {
    const r = findAll("a", "g", "a".repeat(50), 10);
    expect(r.matches).toHaveLength(10);
    expect(r.capped).toBe(true);
  });
  it("groups, named groups and d-flag indices", () => {
    const r = findAll("(?<y>\\d{4})-(\\d{2})", "gd", "on 2025-06 and 2026-01");
    expect(r.matches).toHaveLength(2);
    expect(r.matches[0].groups).toEqual(["2025", "06"]);
    expect(r.matches[0].named).toEqual({ y: "2025" });
    expect(r.matches[0].spans?.[0]).toEqual([3, 7]);
    expect(findAll("a", "", "aaa").matches).toHaveLength(1);
  });
  it("replacement semantics", () => {
    expect(replace("(\\w+)@(\\w+)", "g", "a@b c@d", "$2 at $1")).toBe("b at a d at c");
    expect(replace("(?<n>\\d+)", "", "x12y34", "[$<n>]")).toBe("x[12]y34");
    expect(replace("b", "g", "abc", "$$-$&-$`-$'")).toBe("a$-b-a-cc");
  });
  it("capture group names in order", () => {
    expect(captureGroups("(a)(?<x>b)(?:c)[(](?P<y>d)\\(e\\)")).toEqual([null, "x", "y"]);
  });
});

describe("code export", () => {
  const P = "(?<year>\\d{4})-(\\d{2})/x";
  it("JavaScript literal escapes slashes", () => {
    expect(jsLiteralBody("a/b[/]c\\/d")).toBe("a\\/b[/]c\\/d");
    expect(exportRegex("js", P, "gi").code).toContain("/(?<year>\\d{4})-(\\d{2})\\/x/gi");
  });
  it("Python: (?P<name>), \\g<1> and flags", () => {
    const r = exportRegex("python", P, "gim", "$<year>/$2 $&");
    expect(r.code).toContain("re.compile(r'(?P<year>\\d{4})-(\\d{2})/x', re.IGNORECASE | re.MULTILINE)");
    expect(r.code).toContain("pattern.sub(r'\\g<year>/\\g<2> \\g<0>', text)");
    expect(exportRegex("python", "\\k<a>(?<a>x)", "").code).toContain("(?P=a)(?P<a>x)");
    expect(exportRegex("python", "\\p{L}+", "u").warnings).toContain("py-unicode-props");
  });
  it("PHP: delimiter escaping and numbered replacement", () => {
    const r = exportRegex("php", P, "giu", "$<year>");
    expect(r.code).toContain("'/(?<year>\\\\d{4})-(\\\\d{2})\\\\/x/iu'");
    expect(r.code).toContain("'${1}'");
    expect(exportRegex("php", "it's", "").code).toContain("'/it\\'s/'");
  });
  it("Java: doubled backslashes and flags", () => {
    const r = exportRegex("java", 'a\\d"', "is");
    expect(r.code).toContain('Pattern.compile("a\\\\d\\"", Pattern.CASE_INSENSITIVE | Pattern.DOTALL)');
  });
  it("Go: raw string, inline flags, lookaround warning", () => {
    const r = exportRegex("go", "(?<=\\$)(?<n>\\d+)", "i");
    expect(r.code).toContain("regexp.MustCompile(`(?i)(?<=\\$)(?P<n>\\d+)`)");
    expect(r.warnings).toContain("go-lookaround");
    expect(exportRegex("go", "(a)\\1", "").warnings).toContain("go-backref");
  });
  it("C#: verbatim string with doubled quotes", () => {
    const r = exportRegex("csharp", 'say "hi"\\s', "im", "$1");
    expect(r.code).toContain('new Regex(@"say ""hi""\\s", RegexOptions.IgnoreCase | RegexOptions.Multiline)');
  });
});
