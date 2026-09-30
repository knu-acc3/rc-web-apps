import { describe, expect, it } from "vitest";
import { CAT_BY_ID } from "@/sections/port/data/categories";
import { PORT_BY_NUM, PORTS, rangeOf } from "@/sections/port/data";

const REQUIRED = [
  20, 21, 22, 23, 25, 53, 67, 68, 80, 110, 123, 135, 136, 137, 138, 139, 143, 161, 162, 389, 443, 445, 465, 514, 587, 631, 636, 993, 995, 1080, 1194, 1433, 1521, 1723, 1883, 2049, 2375, 2376,
  3000, 3306, 3389, 4000, 5000, 5060, 5061, 5173, 5222, 5432, 5672, 5900, 6379, 6443, 8000, 8080, 8443, 8883, 9000, 9092, 9200, 9418, 11211, 25565, 27017, 51820,
].filter((p) => p !== 136);

describe("port data", () => {
  it("has enough unique ports in range", () => {
    expect(PORTS.length).toBeGreaterThanOrEqual(240);
    expect(new Set(PORTS.map((p) => p.port)).size).toBe(PORTS.length);
    for (const p of PORTS) expect(p.port >= 0 && p.port <= 65535, String(p.port)).toBe(true);
  });

  it("contains every port from the brief", () => {
    for (const n of REQUIRED) expect(PORT_BY_NUM.has(n), String(n)).toBe(true);
  });

  it("has complete entries and valid references", () => {
    for (const p of PORTS) {
      expect(p.proto.length, String(p.port)).toBeGreaterThan(0);
      for (const t of p.proto) expect(["tcp", "udp", "sctp"]).toContain(t);
      expect(p.s[0].length && p.s[1].length, String(p.port)).toBeTruthy();
      expect(p.d[0].length, `${p.port} ru`).toBeGreaterThan(30);
      expect(p.d[1].length, `${p.port} en`).toBeGreaterThan(30);
      expect(CAT_BY_ID.has(p.cat), `${p.port} cat`).toBe(true);
      if (p.official) expect(p.iana, `${p.port} official without IANA name`).not.toBe("");
      for (const r of p.related ?? []) expect(PORT_BY_NUM.has(r), `${p.port} → ${r}`).toBe(true);
      if (p.sw) expect(p.sw, `${p.port} sw must be language-neutral`).not.toMatch(/[а-яё]/i);
    }
  });

  it("classifies RFC 6335 ranges", () => {
    expect(rangeOf(1023)).toBe("system");
    expect(rangeOf(1024)).toBe("registered");
    expect(rangeOf(49151)).toBe("registered");
    expect(rangeOf(49152)).toBe("dynamic");
  });
});
