import { describe, expect, it } from "vitest";
import { gzipSize, minifyCss } from "@/sections/code/cssmin";

describe("CSS minifier", () => {
  const m = (s: string) => minifyCss(s);
  it("basic whitespace and punctuation", () => {
    expect(m("a { color : red ; }")).toBe("a{color:red}");
    expect(m(".a  .b > .c + .d ~ .e {\n  margin: 0 auto;\n}")).toBe(".a .b>.c+.d~.e{margin:0 auto}");
    expect(m("a, b { color: red }")).toBe("a,b{color:red}");
  });
  it("keeps selector meaning and case", () => {
    expect(m("a :hover { x: y }")).toBe("a :hover{x:y}");
    expect(m("a:hover{x:y}")).toBe("a:hover{x:y}");
    expect(m("#MyID .ClassName { Color: Red }")).toBe("#MyID .ClassName{Color:Red}");
    expect(m(":is( .a , .b ) :where(p) > span { x: y }")).toBe(":is(.a,.b) :where(p)>span{x:y}");
    expect(m(".a:not(.b) .c { x: y }")).toBe(".a:not(.b) .c{x:y}");
  });
  it("keeps spaces in calc/min/max/clamp", () => {
    expect(m("div { width: calc(100% - 10px); height: calc( 1px + 2px ); }")).toBe("div{width:calc(100% - 10px);height:calc(1px + 2px)}");
    expect(m("a { width: clamp(1rem, 2vw + 1rem, 3rem) }")).toBe("a{width:clamp(1rem,2vw + 1rem,3rem)}");
    expect(m("a { margin: calc(-1 * var(--gap)) }")).toBe("a{margin:calc(-1 * var(--gap))}");
  });
  it("strings, url() and custom properties stay verbatim", () => {
    expect(m('a::after { content: "  {  } ; " }')).toBe('a::after{content:"  {  } ; "}');
    expect(m("a { background: url( \"a b.png\" ) no-repeat, url( x.png ) }")).toBe('a{background:url("a b.png") no-repeat,url(x.png)}');
    expect(m(":root { --main:  #06C ; --json: { \"a\" : 1 } ; }")).toBe(':root{--main:#06C;--json:{ "a" : 1 }}');
  });
  it("media queries, !important, comments, nesting", () => {
    expect(m("@media screen and (max-width: 600px) { .a { color: red !important } }")).toBe("@media screen and (max-width:600px){.a{color:red!important}}");
    expect(m("/*! keep */ a { b: c } /* drop */")).toBe("/*! keep */a{b:c}");
    expect(m(".a { color: red; &:hover { color: blue } }")).toBe(".a{color:red;&:hover{color:blue}}");
    expect(m("@import url(foo.css) screen;")).toBe("@import url(foo.css) screen;");
    expect(m("@font-face { font-family: 'X'; src: url(x.woff2) format('woff2') }")).toBe("@font-face{font-family:'X';src:url(x.woff2) format('woff2')}");
  });
  it("gzip size", async () => {
    const n = await gzipSize("a".repeat(1000));
    expect(n).toBeGreaterThan(10);
    expect(n).toBeLessThan(60);
  });
});
