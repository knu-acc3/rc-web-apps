import { describe, expect, it } from "vitest";
import { eui64, linkLocalFromMac, macBits, macFormats, parseMac } from "@/tools/web/network/lib/mac";

const mac = (s: string) => {
  const r = parseMac(s);
  if (!r.ok) throw new Error(s);
  return r.bytes;
};

describe("MAC addresses", () => {
  it("parses common layouts", () => {
    for (const s of ["00:1A:2B:3C:4D:5E", "00-1a-2b-3c-4d-5e", "001a.2b3c.4d5e", "001A2B3C4D5E", "001a2b-3c4d5e"]) {
      expect(macFormats(mac(s)).colon).toBe("00:1a:2b:3c:4d:5e");
    }
    expect(parseMac("00:1a:2b:3c:4d").ok).toBe(false);
    expect(parseMac("00:1a:2b:3c:4d:5g").ok).toBe(false);
    expect(parseMac("0:1a:2b:3c:4d:5e:f").ok).toBe(false);
  });

  it("formats", () => {
    const f = macFormats(mac("001a2b3c4d5e"), true);
    expect(f).toEqual({ colon: "00:1A:2B:3C:4D:5E", hyphen: "00-1A-2B-3C-4D-5E", cisco: "001A.2B3C.4D5E", bare: "001A2B3C4D5E" });
  });

  it("I/G and U/L bits", () => {
    expect(macBits(mac("01:00:5e:00:00:fb")).multicast).toBe(true);
    expect(macBits(mac("02:00:00:00:00:01")).local).toBe(true);
    expect(macBits(mac("00:1a:2b:3c:4d:5e"))).toMatchObject({ multicast: false, local: false });
    expect(macBits(mac("ff:ff:ff:ff:ff:ff")).broadcast).toBe(true);
  });

  it("modified EUI-64", () => {
    expect(eui64(mac("00:1a:2b:3c:4d:5e"))).toBe("21a:2bff:fe3c:4d5e");
    expect(linkLocalFromMac(mac("52:54:00:12:34:56"))).toBe("fe80::5054:ff:fe12:3456");
  });
});
