import { describe, expect, it } from "vitest";
import {
  decodeId,
  formatUuid,
  log10IdsForCollision,
  MAX_UUID,
  NAMESPACES,
  nanoid,
  NIL_UUID,
  ObjectIdGenerator,
  TimeUuidGenerator,
  UlidGenerator,
  ulidTime,
  uuidNameBased,
  uuidV4,
  type Rng,
} from "@/sections/uuid/engine";

/** Deterministic byte source for tests. */
function seqRng(start = 0): Rng {
  let x = start;
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = x++ & 0xff;
    return out;
  };
}

const T = Date.UTC(2022, 1, 22, 19, 22, 22);

describe("uuid versions and variant bits", () => {
  it("v4", () => {
    for (let i = 0; i < 50; i++) {
      const u = uuidV4();
      expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    expect(uuidV4(seqRng(0xff))).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab]/);
  });

  it("v3 / v5 RFC 9562 vectors", () => {
    expect(uuidNameBased(3, NAMESPACES.dns, "www.example.com")).toBe("5df41881-3aed-3515-88a7-2f4a814cf09e");
    expect(uuidNameBased(5, NAMESPACES.dns, "www.example.com")).toBe("2ed6657d-e927-568b-95e1-2665a8aea6a2");
    expect(() => uuidNameBased(5, "nope", "x")).toThrow();
  });

  it("v1 / v6 / v7 encode and decode timestamps", () => {
    const g = new TimeUuidGenerator(seqRng(1));
    const v1 = g.v1(T);
    const v6 = g.v6(T + 1);
    const v7 = g.v7(T);
    expect(v1[14]).toBe("1");
    expect(v6[14]).toBe("6");
    expect(v7[14]).toBe("7");
    for (const u of [v1, v6, v7]) expect("89ab").toContain(u[19]);
    const d1 = decodeId(v1);
    const d6 = decodeId(v6);
    const d7 = decodeId(v7);
    expect(d1.type === "uuid" && d1.ms).toBe(T);
    expect(d6.type === "uuid" && d6.ms).toBe(T + 1);
    expect(d7.type === "uuid" && d7.ms).toBe(T);
    expect(d1.type === "uuid" && d1.randomNode).toBe(true);
  });

  it("decodes RFC 9562 appendix A examples", () => {
    const v1 = decodeId("C232AB00-9414-11EC-B3C8-9F6BDECED846");
    expect(v1).toMatchObject({ type: "uuid", version: 1, variant: "rfc", ms: T, clockSeq: 0x33c8, node: "9f:6b:de:ce:d8:46" });
    const v6 = decodeId("1EC9414C-232A-6B00-B3C8-9F6BDECED846");
    expect(v6).toMatchObject({ type: "uuid", version: 6, ms: T });
    const v7 = decodeId("017F22E2-79B0-7CC3-98C4-DC0C0C07398F");
    expect(v7).toMatchObject({ type: "uuid", version: 7, ms: T });
    expect(new Date(T).toISOString()).toBe("2022-02-22T19:22:22.000Z");
  });

  it("v7 is strictly increasing within one millisecond (bulk)", () => {
    const g = new TimeUuidGenerator();
    const list = Array.from({ length: 5000 }, () => g.v7(T));
    const sorted = [...list].sort();
    expect(sorted).toEqual(list);
    expect(new Set(list).size).toBe(list.length);
  });

  it("v1 unique within one millisecond", () => {
    const g = new TimeUuidGenerator();
    const list = Array.from({ length: 12000 }, () => g.v1(T));
    expect(new Set(list).size).toBe(list.length);
  });
});

describe("formats and special UUIDs", () => {
  const u = "5df41881-3aed-3515-88a7-2f4a814cf09e";
  it("formats", () => {
    expect(formatUuid(u, { upper: true })).toBe("5DF41881-3AED-3515-88A7-2F4A814CF09E");
    expect(formatUuid(u, { braces: true, upper: true })).toBe("{5DF41881-3AED-3515-88A7-2F4A814CF09E}");
    expect(formatUuid(u, { dashes: false })).toBe("5df418813aed351588a72f4a814cf09e");
    expect(formatUuid(u, { urn: true })).toBe("urn:uuid:5df41881-3aed-3515-88a7-2f4a814cf09e");
  });
  it("nil and max", () => {
    expect(decodeId(NIL_UUID)).toMatchObject({ type: "uuid", special: "nil" });
    expect(decodeId(MAX_UUID.toUpperCase())).toMatchObject({ type: "uuid", special: "max" });
  });
  it("accepts braces / urn / no dashes", () => {
    for (const s of [`{${u}}`, `urn:uuid:${u}`, u.replace(/-/g, ""), u.toUpperCase()]) expect(decodeId(s)).toMatchObject({ type: "uuid", version: 3, canonical: u });
    expect(decodeId(`{${u}`).type).not.toBe("uuid");
  });
});

describe("ULID", () => {
  it("decodes the spec example timestamp", () => {
    expect(ulidTime("01ARYZ6S41TSV4RRFFQ69G5FAV")).toBe(1469918176385);
    expect(ulidTime("01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBe(1469922850259);
    expect(decodeId("01aryz6s41tsv4rrffq69g5fav")).toMatchObject({ type: "ulid", ms: 1469918176385 });
  });
  it("encodes time and increments monotonically", () => {
    const g = new UlidGenerator(seqRng(7));
    const a = g.next(1469918176385);
    const b = g.next(1469918176385);
    expect(a.slice(0, 10)).toBe("01ARYZ6S41");
    expect(b > a).toBe(true);
    expect(ulidTime(b)).toBe(1469918176385);
    expect(a).toMatch(/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/);
  });
  it("rejects invalid charset and overflow", () => {
    expect(decodeId("81ARZ3NDEKTSV4RRFFQ69G5FAV")).toMatchObject({ type: "invalid", reason: "ulid-overflow" });
    expect(decodeId("01ARZ3NDEKTSV4RRFFQ69G5FAI").type).toBe("invalid");
  });
});

describe("NanoID", () => {
  it("default length and alphabet", () => {
    const id = nanoid("0123456789abcdef", 21);
    expect(id).toMatch(/^[0-9a-f]{21}$/);
  });
  it("rejection sampling covers the alphabet uniformly (no modulo bias)", () => {
    // alphabet of 3: mask = 3, value 3 must be rejected
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const id = nanoid("abc", 3000, seqRng(0));
    for (const ch of id) counts[ch]++;
    expect(counts.a).toBe(1000);
    expect(counts.b).toBe(1000);
    expect(counts.c).toBe(1000);
  });
  it("validates the alphabet", () => {
    expect(() => nanoid("a", 5)).toThrow();
    expect(() => nanoid("aab", 5)).toThrow();
  });
  it("collision estimate (birthday bound)", () => {
    // 64^21 ≈ 2^126 → ~1.3e18 ids for 1 % chance
    const lg = log10IdsForCollision(64, 21, 0.01);
    expect(lg).toBeGreaterThan(18);
    expect(lg).toBeLessThan(18.3);
    // 10 digits: N = 1e10 → n = sqrt(2e10 · 0.01005) ≈ 14 177
    expect(Math.round(10 ** log10IdsForCollision(10, 10, 0.01))).toBeGreaterThan(14100);
    expect(Math.round(10 ** log10IdsForCollision(10, 10, 0.01))).toBeLessThan(14250);
  });
});

describe("ObjectId", () => {
  it("encodes seconds and increments the counter", () => {
    const g = new ObjectIdGenerator(seqRng(3));
    const a = g.next(T + 999);
    const b = g.next(T);
    expect(a).toMatch(/^[0-9a-f]{24}$/);
    expect(decodeId(a)).toMatchObject({ type: "objectid", ms: T });
    expect(parseInt(b.slice(18), 16)).toBe(parseInt(a.slice(18), 16) + 1);
    expect(decodeId("507f1f77bcf86cd799439011")).toMatchObject({ type: "objectid", ms: 1350508407000 });
  });
});

describe("detection", () => {
  it("nanoid-like and invalid", () => {
    expect(decodeId("V1StGXR8_Z5jdHi6B-myT").type).toBe("nanoid");
    expect(decodeId("hello").type).toBe("invalid");
    expect(decodeId("   ").type).toBe("invalid");
  });
});
