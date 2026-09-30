import { describe, expect, it } from "vitest";

import {
  ApiRouteError,
  isBlockedPublicFetchHost,
  normalizePublicHttpUrl,
  resolvePublicHost,
} from "@/src/lib/apiSecurity";

describe("public URL security", () => {
  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.1.1",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])("blocks non-public address %s", (address) => {
    expect(isBlockedPublicFetchHost(address)).toBe(true);
  });

  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111", "example.com"])(
    "allows public host %s",
    (address) => {
      expect(isBlockedPublicFetchHost(address)).toBe(false);
    },
  );

  it("rejects integer and hexadecimal loopback URL forms", () => {
    expect(() => normalizePublicHttpUrl("http://2130706433")).toThrow(
      ApiRouteError,
    );
    expect(() => normalizePublicHttpUrl("http://0x7f000001")).toThrow(
      ApiRouteError,
    );
  });

  it("rejects DNS answers when any address is private", async () => {
    await expect(
      resolvePublicHost(new URL("https://rebind.example"), async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("returns the exact validated public DNS answers used for pinning", async () => {
    const records = [{ address: "93.184.216.34", family: 4 as const }];
    await expect(
      resolvePublicHost(
        new URL("https://example.com"),
        async () => records,
      ),
    ).resolves.toEqual(records);
  });
});
