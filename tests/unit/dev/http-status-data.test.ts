import { describe, expect, it } from "vitest";
import { CODE_BY_NUM, CODES } from "@/tools/dev/http-status/data";
import { HEADERS } from "@/tools/dev/http-status/data/headers";

const IANA = [
  100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411,
  412, 413, 414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
];
const UNOFFICIAL = [419, 420, 444, 494, 495, 496, 497, 499, 520, 521, 522, 523, 524, 525, 526, 527, 530, 598, 599];

describe("HTTP status data", () => {
  it("has every IANA-registered code and the common unofficial ones", () => {
    for (const c of [...IANA, ...UNOFFICIAL]) expect(CODE_BY_NUM.has(c), String(c)).toBe(true);
    expect(CODES.length).toBeGreaterThanOrEqual(85);
    expect(new Set(CODES.map((c) => c.code)).size).toBe(CODES.length);
  });

  it("uses RFC 9110 names", () => {
    expect(CODE_BY_NUM.get(413)!.name).toBe("Content Too Large");
    expect(CODE_BY_NUM.get(422)!.name).toBe("Unprocessable Content");
    expect(CODE_BY_NUM.get(416)!.name).toBe("Range Not Satisfiable");
    expect(CODE_BY_NUM.get(418)!.name).toBe("(Unused)");
    expect(CODE_BY_NUM.get(306)!.name).toBe("(Unused)");
    expect(CODE_BY_NUM.get(308)!.name).toBe("Permanent Redirect");
  });

  it("marks exactly the RFC 9110 heuristically cacheable codes", () => {
    const cacheable = CODES.filter((c) => c.cacheable).map((c) => c.code);
    expect(cacheable).toEqual([200, 203, 204, 206, 300, 301, 308, 404, 405, 410, 414, 501]);
  });

  it("marks non-registered codes as unofficial", () => {
    for (const c of UNOFFICIAL) expect(CODE_BY_NUM.get(c)!.status, String(c)).toBe("unofficial");
    for (const c of IANA) expect(CODE_BY_NUM.get(c)!.status, String(c)).not.toBe("unofficial");
  });

  it("has complete texts, valid related codes and known headers", () => {
    for (const c of CODES) {
      for (const l of ["ru", "en"] as const) {
        const t = c[l];
        expect(t.s.length, `${c.code} ${l} summary`).toBeGreaterThan(20);
        expect(t.m.length, `${c.code} ${l} meaning`).toBeGreaterThan(20);
        expect(t.w.length).toBeGreaterThan(10);
        expect(t.c.length).toBeGreaterThan(0);
        expect(t.fc.length).toBeGreaterThan(0);
        expect(t.fs.length).toBeGreaterThan(0);
        expect(t.n.length).toBeGreaterThan(0);
      }
      for (const r of c.related) expect(CODE_BY_NUM.has(r), `${c.code} → ${r}`).toBe(true);
      for (const h of c.headers ?? []) expect(HEADERS[h], `${c.code} header ${h}`).toBeDefined();
      expect(c.example.length).toBeGreaterThan(10);
    }
  });
});
