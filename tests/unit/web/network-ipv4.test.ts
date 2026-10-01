import { describe, expect, it } from "vitest";
import { rangeToCidrs } from "@/tools/web/network/lib/cidr";
import { prefixForHosts, splitEqual, vlsm } from "@/tools/web/network/lib/divider";
import { adjacent, cidr4, parseIPv4, parseV4Input, prefixOfMask, subnetsOf, supernets, toDotted, v4Info } from "@/tools/web/network/lib/ipv4";
import { special4 } from "@/tools/web/network/lib/special";

const ip = (s: string) => {
  const r = parseIPv4(s);
  if (!r.ok) throw new Error(s);
  return r.value;
};

describe("IPv4 parsing", () => {
  it("parses strict dotted quads", () => {
    expect(parseIPv4("192.168.1.10")).toEqual({ ok: true, value: 0xc0a8010a });
    expect(parseIPv4("256.1.1.1")).toEqual({ ok: false, error: "octet" });
    expect(parseIPv4("1.2.3")).toEqual({ ok: false, error: "format" });
    expect(parseIPv4("010.0.0.1")).toEqual({ ok: false, error: "leading-zero" });
    expect(parseIPv4("0.0.0.0")).toEqual({ ok: true, value: 0 });
  });

  it("accepts CIDR, dotted mask and space-separated mask", () => {
    for (const s of ["10.1.2.3/24", "10.1.2.3/255.255.255.0", "10.1.2.3 255.255.255.0"]) {
      const r = parseV4Input(s);
      expect(r.ok && r.value.prefix).toBe(24);
    }
    expect(parseV4Input("10.1.2.3/255.0.255.0")).toEqual({ ok: false, error: "mask" });
    expect(parseV4Input("10.1.2.3/33")).toEqual({ ok: false, error: "prefix" });
    expect(prefixOfMask(ip("255.255.255.252"))).toBe(30);
  });
});

describe("IPv4 subnet math", () => {
  it("/24", () => {
    const i = v4Info(ip("192.168.1.10"), 24);
    expect(toDotted(i.mask)).toBe("255.255.255.0");
    expect(toDotted(i.wildcard)).toBe("0.0.0.255");
    expect(toDotted(i.network)).toBe("192.168.1.0");
    expect(toDotted(i.broadcast)).toBe("192.168.1.255");
    expect(toDotted(i.first)).toBe("192.168.1.1");
    expect(toDotted(i.last)).toBe("192.168.1.254");
    expect(i.total).toBe(256);
    expect(i.usable).toBe(254);
    expect(i.cls).toBe("C");
  });

  it("/31 point-to-point (RFC 3021)", () => {
    const i = v4Info(ip("10.0.0.1"), 31);
    expect(i.usable).toBe(2);
    expect(toDotted(i.first)).toBe("10.0.0.0");
    expect(toDotted(i.last)).toBe("10.0.0.1");
    expect(toDotted(i.wildcard)).toBe("0.0.0.1");
  });

  it("/32 host route", () => {
    const i = v4Info(ip("8.8.8.8"), 32);
    expect(i.usable).toBe(1);
    expect(i.total).toBe(1);
    expect(toDotted(i.first)).toBe("8.8.8.8");
    expect(toDotted(i.last)).toBe("8.8.8.8");
    expect(toDotted(i.wildcard)).toBe("0.0.0.0");
  });

  it("/0 whole address space", () => {
    const i = v4Info(ip("1.2.3.4"), 0);
    expect(toDotted(i.mask)).toBe("0.0.0.0");
    expect(toDotted(i.wildcard)).toBe("255.255.255.255");
    expect(toDotted(i.network)).toBe("0.0.0.0");
    expect(toDotted(i.broadcast)).toBe("255.255.255.255");
    expect(i.total).toBe(4294967296);
    expect(i.usable).toBe(4294967294);
  });

  it("containing supernets are computed from the address", () => {
    const s = supernets(ip("10.1.2.0"), 24).map(cidr4);
    expect(s.slice(0, 3)).toEqual(["10.1.2.0/23", "10.1.0.0/22", "10.1.0.0/21"]);
    expect(s).toContain("10.1.0.0/16");
    expect(s).toContain("10.0.0.0/8");
    expect(supernets(ip("192.168.1.130"), 26).map(cidr4)[0]).toBe("192.168.1.128/25");
  });

  it("adjacent subnets and listing", () => {
    expect(cidr4(adjacent(ip("192.168.1.0"), 24, 1)!)).toBe("192.168.2.0/24");
    expect(adjacent(ip("0.0.0.0"), 24, -1)).toBeNull();
    const l = subnetsOf({ network: ip("192.168.1.0"), prefix: 24 }, 26);
    expect(l.total).toBe(4);
    expect(l.items.map(cidr4)).toEqual(["192.168.1.0/26", "192.168.1.64/26", "192.168.1.128/26", "192.168.1.192/26"]);
  });
});

describe("special-purpose ranges", () => {
  it.each([
    ["100.64.0.1", "cgnat"],
    ["100.127.255.255", "cgnat"],
    ["198.18.0.1", "benchmark"],
    ["198.19.255.254", "benchmark"],
    ["10.2.3.4", "private"],
    ["172.31.0.1", "private"],
    ["192.168.0.1", "private"],
    ["127.0.0.1", "loopback"],
    ["169.254.1.1", "link-local"],
    ["192.0.2.55", "documentation"],
    ["203.0.113.9", "documentation"],
    ["224.0.0.251", "multicast"],
    ["240.0.0.1", "reserved"],
    ["255.255.255.255", "broadcast"],
  ])("%s → %s", (a, kind) => {
    expect(special4(ip(a))?.kind).toBe(kind);
  });

  it("public addresses are not special", () => {
    expect(special4(ip("8.8.8.8"))).toBeNull();
    expect(special4(ip("100.128.0.1"))).toBeNull();
    expect(special4(ip("198.20.0.1"))).toBeNull();
    expect(special4(ip("172.32.0.1"))).toBeNull();
  });
});

describe("range → CIDR", () => {
  it("minimal cover", () => {
    const r = rangeToCidrs(BigInt(ip("10.0.0.1")), BigInt(ip("10.0.0.10")), 32).map((b) => `${toDotted(Number(b.start))}/${b.prefix}`);
    expect(r).toEqual(["10.0.0.1/32", "10.0.0.2/31", "10.0.0.4/30", "10.0.0.8/31", "10.0.0.10/32"]);
  });
  it("aligned range is one block", () => {
    expect(rangeToCidrs(BigInt(ip("192.168.0.0")), BigInt(ip("192.168.255.255")), 32)).toEqual([{ start: BigInt(ip("192.168.0.0")), prefix: 16 }]);
    expect(rangeToCidrs(0n, 0xffffffffn, 32)).toEqual([{ start: 0n, prefix: 0 }]);
  });
});

describe("subnet divider", () => {
  it("splits into equal parts (rounded up to a power of two)", () => {
    const r = splitEqual({ network: ip("192.168.0.0"), prefix: 24 }, 3);
    expect(r.ok && r.value.newPrefix).toBe(26);
    expect(r.ok && r.value.subnets.map(cidr4)).toEqual(["192.168.0.0/26", "192.168.0.64/26", "192.168.0.128/26", "192.168.0.192/26"]);
    expect(splitEqual({ network: ip("10.0.0.0"), prefix: 31 }, 4)).toEqual({ ok: false, error: "too-many" });
  });

  it("host prefix sizes", () => {
    expect(prefixForHosts(1)).toBe(32);
    expect(prefixForHosts(2)).toBe(30);
    expect(prefixForHosts(2, true)).toBe(31);
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(62)).toBe(26);
    expect(prefixForHosts(63)).toBe(25);
  });

  it("VLSM allocates largest first", () => {
    const r = vlsm({ network: ip("192.168.10.0"), prefix: 24 }, [
      { name: "A", hosts: 20 },
      { name: "B", hosts: 100 },
      { name: "C", hosts: 2 },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.items.map((i) => `${i.name} ${cidr4(i.block)}`)).toEqual(["B 192.168.10.0/25", "A 192.168.10.128/27", "C 192.168.10.160/30"]);
    expect(r.value.free.map(cidr4)).toEqual(["192.168.10.164/30", "192.168.10.168/29", "192.168.10.176/28", "192.168.10.192/26"]);
  });

  it("VLSM reports when it does not fit", () => {
    const r = vlsm({ network: ip("192.168.10.0"), prefix: 24 }, [
      { name: "A", hosts: 200 },
      { name: "B", hosts: 100 },
    ]);
    expect(r).toEqual({ ok: false, error: "no-fit", name: "B" });
  });
});
