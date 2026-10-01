import { describe, expect, it } from "vitest";
import { rangeToCidrs } from "@/tools/web/network/lib/cidr";
import { toDotted } from "@/tools/web/network/lib/ipv4";
import { compress, expand, mapV4, parseIPv6, parseV6Input, reverse4, reverse6, v6Info } from "@/tools/web/network/lib/ipv6";
import { special6 } from "@/tools/web/network/lib/special";

const v6 = (s: string) => {
  const r = parseIPv6(s);
  if (!r.ok) throw new Error(`${s}: ${r.error}`);
  return r.value.value;
};

describe("IPv6 parsing", () => {
  it("rejects malformed input", () => {
    expect(parseIPv6("1::2::3").ok).toBe(false);
    expect(parseIPv6("12345::").ok).toBe(false);
    expect(parseIPv6("1:2:3:4:5:6:7").ok).toBe(false);
    expect(parseIPv6("1:2:3:4:5:6:7:8:9").ok).toBe(false);
    expect(parseIPv6("1:2:3:4:5:6:7::8").ok).toBe(false);
    expect(parseIPv6("g::1").ok).toBe(false);
  });
  it("accepts zone ids and brackets", () => {
    const r = parseIPv6("fe80::1%eth0");
    expect(r.ok && r.value.zone).toBe("eth0");
    expect(v6("[2001:db8::1]")).toBe(v6("2001:db8::1"));
  });
});

describe("RFC 5952 compression", () => {
  it.each([
    ["2001:db8:0:0:1:0:0:1", "2001:db8::1:0:0:1"],
    ["2001:0db8:0000:0000:0000:0000:0002:0001", "2001:db8::2:1"],
    ["2001:db8:0:1:1:1:1:1", "2001:db8:0:1:1:1:1:1"],
    ["2001:db8:0:0:0:1:0:0", "2001:db8::1:0:0"],
    ["2001:DB8::0:1", "2001:db8::1"],
    ["0:0:0:0:0:0:0:0", "::"],
    ["0:0:0:0:0:0:0:1", "::1"],
    ["fe80:0:0:0:0:0:0:0", "fe80::"],
    ["::ffff:c000:0201", "::ffff:192.0.2.1"],
    ["::ffff:192.0.2.1", "::ffff:192.0.2.1"],
  ])("%s → %s", (a, b) => {
    expect(compress(v6(a))).toBe(b);
  });

  it("expands", () => {
    expect(expand(v6("2001:db8::1"))).toBe("2001:0db8:0000:0000:0000:0000:0000:0001");
  });
});

describe("IPv6 prefixes and reverse DNS", () => {
  it("network and last address", () => {
    const r = parseV6Input("2001:db8:abcd:12::5/64");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const i = v6Info(r.value.value, r.value.prefix);
    expect(compress(i.network)).toBe("2001:db8:abcd:12::");
    expect(compress(i.last)).toBe("2001:db8:abcd:12:ffff:ffff:ffff:ffff");
    expect(i.total).toBe(1n << 64n);
  });

  it("nibble format", () => {
    expect(reverse6(v6("2001:db8::567:89ab"))).toBe("b.a.9.8.7.6.5.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa");
    expect(reverse4(0xc0000201)).toBe("1.2.0.192.in-addr.arpa");
  });

  it("IPv4-mapped", () => {
    expect(compress(mapV4(0xc0000201))).toBe("::ffff:192.0.2.1");
    expect(expand(mapV4(0xc0000201))).toBe("0000:0000:0000:0000:0000:ffff:c000:0201");
    expect(toDotted(Number(v6("::ffff:10.0.0.1") & 0xffffffffn))).toBe("10.0.0.1");
  });

  it("special types", () => {
    expect(special6(v6("::1"))?.kind).toBe("loopback");
    expect(special6(v6("::"))?.kind).toBe("unspecified");
    expect(special6(v6("fe80::1"))?.kind).toBe("link-local");
    expect(special6(v6("fd12:3456::1"))?.kind).toBe("ula");
    expect(special6(v6("2001:db8::1"))?.kind).toBe("documentation");
    expect(special6(v6("::ffff:1.2.3.4"))?.kind).toBe("mapped");
    expect(special6(v6("ff02::1"))?.kind).toBe("multicast");
    expect(special6(v6("2a00:1450::1"))?.kind).toBe("public");
  });

  it("range to CIDR in IPv6", () => {
    const r = rangeToCidrs(v6("2001:db8::"), v6("2001:db8::ff"), 128);
    expect(r.map((b) => `${compress(b.start)}/${b.prefix}`)).toEqual(["2001:db8::/120"]);
  });
});
