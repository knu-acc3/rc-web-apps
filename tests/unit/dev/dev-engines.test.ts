import { describe, expect, it } from "vitest";
import { base64ToBytes, utf8Encode } from "@/tools/dev/shared/bytes";
import { detectBot } from "@/tools/dev/dev/data/bots";
import { applySymbolic, fromSymbolic, notes, parseOctal, toChmodSymbolic, toOctal, toSymbolic, umask } from "@/tools/dev/dev/lib/chmod";
import { parseCurl, shellSplit, toAxios, toFetch, toPython } from "@/tools/dev/dev/lib/curl";
import { escapeCsv, escapeJs, escapeRegex, escapeShell, escapeSql, unescapeCsv, unescapeJs, unescapeShell, unescapeSql } from "@/tools/dev/dev/lib/escape";
import { htmlToJsx, jsxAttrName, styleToObject } from "@/tools/dev/dev/lib/htmljsx";
import { asymVerify, cleanToken, generateKeyPair, hmacSign, hmacVerify, parseJwt, parseKey, signJwt, timeStatus } from "@/tools/dev/dev/lib/jwt";

describe("chmod", () => {
  it("octal ↔ symbolic incl. special bits", () => {
    const cases: [string, string][] = [
      ["755", "rwxr-xr-x"],
      ["644", "rw-r--r--"],
      ["600", "rw-------"],
      ["777", "rwxrwxrwx"],
      ["1777", "rwxrwxrwt"],
      ["1776", "rwxrwxrwT"],
      ["4755", "rwsr-xr-x"],
      ["4644", "rwSr--r--"],
      ["2755", "rwxr-sr-x"],
      ["2745", "rwxr-Sr-x"],
      ["6755", "rwsr-sr-x"],
      ["000", "---------"],
    ];
    for (const [o, s] of cases) {
      const m = parseOctal(o)!;
      expect(toSymbolic(m), o).toBe(s);
      expect(fromSymbolic(s), s).toBe(m);
      expect(toOctal(m, o.length as 3 | 4)).toBe(o);
    }
    expect(fromSymbolic("drwxrwxrwt")).toBe(0o1777);
    expect(fromSymbolic("-rw-r--r--")).toBe(0o644);
    expect(parseOctal("8")).toBeNull();
    expect(parseOctal("12345")).toBeNull();
  });

  it("symbolic operations", () => {
    expect(applySymbolic(0o644, "u+x")).toBe(0o744);
    expect(applySymbolic(0o775, "g-w")).toBe(0o755);
    expect(applySymbolic(0o777, "a=r")).toBe(0o444);
    expect(applySymbolic(0o600, "u=rwx,go=rx")).toBe(0o755);
    expect(applySymbolic(0o644, "a+X")).toBe(0o644);
    expect(applySymbolic(0o644, "a+X", true)).toBe(0o755);
    expect(applySymbolic(0o744, "a+X")).toBe(0o755);
    expect(applySymbolic(0o755, "u+s")).toBe(0o4755);
    expect(applySymbolic(0o755, "g+s")).toBe(0o2755);
    expect(applySymbolic(0o777, "+t")).toBe(0o1777);
    expect(applySymbolic(0o700, "go=u")).toBe(0o777);
    expect(applySymbolic(0o4755, "u=rwx")).toBe(0o755);
    expect(applySymbolic(0o2775, "g=rwx", true)).toBe(0o2775);
    expect(applySymbolic(0o644, "o-r,g+w")).toBe(0o660);
    expect(() => applySymbolic(0o644, "z+x")).toThrow();
    expect(toChmodSymbolic(0o755)).toBe("u=rwx,go=rx");
    expect(toChmodSymbolic(0o644)).toBe("u=rw,go=r");
    expect(toChmodSymbolic(0o777)).toBe("a=rwx");
    expect(toChmodSymbolic(0o750)).toBe("u=rwx,g=rx,o=");
    expect(toChmodSymbolic(0o1777)).toBe("u=rwx,g=rwx,o=rwxt");
  });

  it("umask", () => {
    expect(umask(0o022)).toEqual({ file: 0o644, dir: 0o755 });
    expect(umask(0o027)).toEqual({ file: 0o640, dir: 0o750 });
    expect(umask(0o077)).toEqual({ file: 0o600, dir: 0o700 });
  });

  it("notes: 1777 is explained, not flagged; 777 is dangerous", () => {
    const n1777 = notes(0o1777);
    expect(n1777.map((n) => n.code)).toEqual(["sticky-tmp"]);
    expect(n1777.every((n) => n.level !== "danger")).toBe(true);
    expect(notes(0o777).some((n) => n.level === "danger")).toBe(true);
    expect(notes(0o755).some((n) => n.level === "danger")).toBe(false);
    expect(notes(0o4777).map((n) => n.code)).toContain("setid-writable");
    expect(notes(0o600).map((n) => n.code)).toContain("private");
  });
});

describe("JWT", () => {
  // RFC 7515 Appendix A.1 (HS256)
  const A1 = "eyJ0eXAiOiJKV1QiLA0KICJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJqb2UiLA0KICJleHAiOjEzMDA4MTkzODAsDQogImh0dHA6Ly9leGFtcGxlLmNvbS9pc19yb290Ijp0cnVlfQ.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const A1_KEY = base64ToBytes("AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow");

  it("verifies the RFC 7515 A.1 HS256 example", () => {
    const p = parseJwt(A1);
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    expect(p.jwt.alg).toBe("HS256");
    expect(p.jwt.payload).toMatchObject({ iss: "joe", exp: 1300819380, "http://example.com/is_root": true });
    expect(hmacVerify("HS256", p.jwt.signingInput, p.jwt.signature, A1_KEY)).toBe(true);
    expect(hmacVerify("HS256", p.jwt.signingInput, p.jwt.signature, utf8Encode("wrong"))).toBe(false);
  });

  it("jwt.io example and signing round-trip", async () => {
    const t = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const p = parseJwt(`Bearer ${t}`);
    expect(p.ok && hmacVerify("HS256", p.jwt.signingInput, p.jwt.signature, utf8Encode("your-256-bit-secret"))).toBe(true);
    const signed = await signJwt({ alg: "HS256", typ: "JWT" }, '{"sub":"1234567890","name":"John Doe","iat":1516239022}', { secret: utf8Encode("your-256-bit-secret") });
    expect(signed).toBe(t);
    expect(hmacSign("HS512", "a.b", utf8Encode("k"))).toHaveLength(86);
  });

  it("decodes UTF-8 claims, strips Bearer/quotes, flags JWE and bad input", () => {
    const tok = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from('{"name":"Алия Нұрланқызы"}').toString("base64url")}.`;
    const p = parseJwt(`  "Bearer ${tok}"  `);
    expect(p.ok && (p.jwt.payload as { name: string }).name).toBe("Алия Нұрланқызы");
    expect(p.ok && p.jwt.alg).toBe("none");
    expect(cleanToken("Authorization: Bearer abc.def.ghi")).toBe("abc.def.ghi");
    expect(parseJwt("a.b.c.d.e")).toEqual({ ok: false, error: "jwe" });
    expect(parseJwt("abc")).toEqual({ ok: false, error: "parts" });
    expect(parseJwt("!!!.e30.")).toEqual({ ok: false, error: "header-b64" });
  });

  it("time checks with skew", () => {
    expect(timeStatus({ exp: 100, nbf: 50, iat: 40 }, 99)).toEqual({ exp: "valid", nbf: "ok", iat: "ok" });
    expect(timeStatus({ exp: 100 }, 100)).toEqual({ exp: "expired" });
    expect(timeStatus({ exp: 100 }, 120, 30)).toEqual({ exp: "valid" });
    expect(timeStatus({ nbf: 200, iat: 300 }, 100)).toEqual({ nbf: "future", iat: "future" });
  });

  it("ES256 / RS256 / PS256 sign + verify with generated keys (WebCrypto)", async () => {
    for (const alg of ["ES256", "RS256", "PS256", "ES384"] as const) {
      const { publicPem, privatePem } = await generateKeyPair(alg);
      const token = await signJwt({ alg, typ: "JWT" }, '{"sub":"x"}', { key: parseKey(privatePem) });
      const p = parseJwt(token);
      if (!p.ok) throw new Error("parse");
      expect(await asymVerify(alg, p.jwt.signingInput, p.jwt.signature, parseKey(publicPem)), alg).toBe(true);
      const tampered = p.jwt.signingInput.replace(/.$/, (c) => (c === "A" ? "B" : "A"));
      expect(await asymVerify(alg, tampered, p.jwt.signature, parseKey(publicPem))).toBe(false);
    }
  }, 30000);

  it("parses JWK / JWKS by kid and rejects unknown PEM", () => {
    expect(parseKey('{"keys":[{"kid":"a","kty":"oct","k":"AA"},{"kid":"b","kty":"oct","k":"AQ"}]}', "b")).toMatchObject({ kind: "jwk", jwk: { kid: "b" } });
    expect(parseKey('{"keys":[{"kid":"a"},{"kid":"b"}]}', "c")).toEqual({ kind: "error", error: "no-kid" });
    expect(parseKey("-----BEGIN EC PRIVATE KEY-----\nAAAA\n-----END EC PRIVATE KEY-----")).toEqual({ kind: "error", error: "unsupported-pem" });
  });
});

describe("User-Agent bots", () => {
  it("detects crawlers and tools", () => {
    const cases: [string, string | null][] = [
      ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "search"],
      ["Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)", "search"],
      ["Mozilla/5.0 (compatible; YandexImages/3.0; +http://yandex.com/bots)", "search"],
      ["Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36", "headless"],
      ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)", "ai"],
      ["TelegramBot (like TwitterBot)", "social"],
      ["curl/8.4.0", "http"],
      ["python-requests/2.31.0", "http"],
      ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36", null],
      ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", null],
    ];
    for (const [ua, kind] of cases) expect(detectBot(ua)?.kind ?? null, ua).toBe(kind);
  });
});

describe("cURL", () => {
  it("splits bash, $'…' and continuations", () => {
    expect(shellSplit(`curl 'https://a.b/c?d=1' \\\n  -H "X-Name: \\"q\\"" --data-raw $'a\\nb'`)).toEqual(["curl", "https://a.b/c?d=1", "-H", 'X-Name: "q"', "--data-raw", "a\nb"]);
  });
  it("parses a Chrome 'Copy as cURL' command", () => {
    const r = parseCurl(`curl 'https://api.example.com/v1/items' \\
  -H 'accept: application/json' \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer abc' \\
  --data-raw '{"name":"Тест","qty":2}' \\
  --compressed`);
    expect(r.method).toBe("POST");
    expect(r.url).toBe("https://api.example.com/v1/items");
    expect(r.headers).toContainEqual(["authorization", "Bearer abc"]);
    expect(r.body).toEqual({ kind: "json", text: '{"name":"Тест","qty":2}' });
    expect(toFetch(r)).toContain("JSON.stringify({");
    expect(toPython(r)).toContain("json=json_data");
    expect(toAxios(r)).toContain('method: "post"');
  });
  it("handles -u, -G, -F, -X, --json and bare hosts", () => {
    const a = parseCurl("curl -u user:pass example.com/api");
    expect(a.url).toBe("http://example.com/api");
    expect(a.headers).toContainEqual(["Authorization", "Basic dXNlcjpwYXNz"]);
    const g = parseCurl("curl -G https://x.y/s -d q=1 -d page=2");
    expect(g.url).toBe("https://x.y/s?q=1&page=2");
    expect(g.method).toBe("GET");
    const f = parseCurl("curl -F name=Ann -F file=@photo.jpg https://x.y/up");
    expect(f.body).toEqual({ kind: "form", fields: [{ name: "name", value: "Ann" }, { name: "file", value: "", file: "photo.jpg" }] });
    expect(toPython(f)).toContain("open('photo.jpg', \"rb\")");
    const x = parseCurl("curl -XDELETE https://x.y/1");
    expect(x.method).toBe("DELETE");
    const j = parseCurl(`curl --json '{"a":1}' https://x.y`);
    expect(j.headers).toContainEqual(["Content-Type", "application/json"]);
    expect(j.body).toMatchObject({ kind: "json" });
    const d = parseCurl("curl https://x.y -d a=1 -d b=2");
    expect(d.body).toEqual({ kind: "raw", text: "a=1&b=2" });
    expect(d.headers).toContainEqual(["Content-Type", "application/x-www-form-urlencoded"]);
    expect(() => parseCurl("wget x")).toThrow();
  });
});

describe("HTML → JSX", () => {
  it("attributes, style, void elements, comments, braces", () => {
    const { code, warnings } = htmlToJsx('<div class="a" style="color: red; font-size: 12px; -webkit-transform: none; z-index: 2"><label for="x">Имя {x}</label><input id="x" value="1" checked disabled><br><!-- c --></div>');
    expect(code).toContain('<div className="a" style={{ color: "red", fontSize: "12px", WebkitTransform: "none", zIndex: 2 }}>');
    expect(code).toContain('<label htmlFor="x">Имя {"{"}x{"}"}</label>');
    expect(code).toContain('<input id="x" defaultValue="1" defaultChecked disabled />');
    expect(code).toContain("<br />");
    expect(code).toContain("{/* c */}");
    expect(warnings).toEqual([]);
  });
  it("SVG attributes, events, fragments, component wrapper", () => {
    expect(jsxAttrName("stroke-width")).toBe("strokeWidth");
    expect(jsxAttrName("xlink:href")).toBe("xlinkHref");
    expect(jsxAttrName("viewbox")).toBe("viewBox");
    expect(jsxAttrName("data-id")).toBe("data-id");
    expect(jsxAttrName("aria-label")).toBe("aria-label");
    expect(jsxAttrName("onmouseenter")).toBe("onMouseEnter");
    expect(jsxAttrName("oncontextmenu")).toBe("onContextMenu");
    expect(jsxAttrName("tabindex")).toBe("tabIndex");
    const r = htmlToJsx('<p>a</p><button onclick="go()">b</button>', { component: "Demo" });
    expect(r.code).toContain("<>");
    expect(r.code).toContain("onClick={() => { go() }}");
    expect(r.code).toContain("export default function Demo()");
    expect(r.warnings).toContain("events");
    expect(styleToObject("--main: 1px; margin:0")).toBe('{{ "--main": "1px", margin: 0 }}');
  });
});

describe("string escaping", () => {
  it("JS", () => {
    expect(escapeJs('a"b\n\\', '"')).toBe('"a\\"b\\n\\\\"');
    expect(escapeJs("it's", "'")).toBe("'it\\'s'");
    expect(escapeJs("${x}`", "`")).toBe("`\\${x}\\``");
    expect(unescapeJs('"a\\"b\\n\\u0434\\x41\\u{1F600}"')).toBe('a"b\nдA😀');
  });
  it("SQL, regex, shell, CSV", () => {
    expect(escapeSql("O'Brien")).toBe("'O''Brien'");
    expect(escapeSql("a\\b", true)).toBe("'a\\\\b'");
    expect(unescapeSql("'O''Brien'")).toBe("O'Brien");
    expect(escapeRegex("1+1=2? (a.b)")).toBe("1\\+1=2\\? \\(a\\.b\\)");
    expect(new RegExp(escapeRegex("a.b*c")).test("a.b*c")).toBe(true);
    expect(escapeShell("it's here")).toBe("'it'\\''s here'");
    expect(escapeShell("safe-name.txt")).toBe("safe-name.txt");
    expect(unescapeShell("'it'\\''s here'")).toBe("it's here");
    expect(unescapeShell('"a \\"b\\" c"')).toBe('a "b" c');
    expect(escapeCsv('a,"b"')).toBe('"a,""b"""');
    expect(escapeCsv("plain")).toBe("plain");
    expect(unescapeCsv('"a,""b"""')).toBe('a,"b"');
  });
});
