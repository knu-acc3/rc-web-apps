import { UAParser } from "ua-parser-js";
import { describe, expect, it } from "vitest";
import {
  detectBitness,
  isReducedUa,
  jsEngine,
  macosName,
  parseRenderer,
  resolveBrowser,
  resolveDeviceType,
  resolveOs,
  windowsFromPlatformVersion,
  type Hints,
} from "@/tools/device/what-is-my/lib/ua";

const UA = {
  chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  firefoxWin64: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  firefoxWow64: "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:115.0) Gecko/20100101 Firefox/115.0",
  firefoxWin32: "Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  safariIos26: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  safariIos17: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
  linux64: "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
  linuxArm: "Mozilla/5.0 (X11; Linux aarch64; rv:140.0) Gecko/20100101 Firefox/140.0",
  opera: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 OPR/121.0.0.0",
};

const parse = (ua: string) => new UAParser(ua).getResult();

const chromeHints: Hints = {
  brands: [
    { brand: "Not)A;Brand", version: "8" },
    { brand: "Chromium", version: "138" },
    { brand: "Google Chrome", version: "138" },
  ],
  fullVersionList: [
    { brand: "Not)A;Brand", version: "8.0.0.0" },
    { brand: "Chromium", version: "138.0.7204.50" },
    { brand: "Google Chrome", version: "138.0.7204.50" },
  ],
  mobile: false,
  platform: "Windows",
  platformVersion: "19.0.0",
  architecture: "x86",
  bitness: "64",
  wow64: false,
};

describe("resolveBrowser", () => {
  it("prefers Client Hints full version over the frozen UA", () => {
    expect(resolveBrowser(parse(UA.chromeWin), chromeHints)).toEqual({ name: "Chrome", version: "138.0.7204.50", major: "138", source: "hints" });
  });

  it("uses a specific brand (Edge) over Chromium", () => {
    const h: Hints = { brands: [{ brand: "Microsoft Edge", version: "138" }, { brand: "Chromium", version: "138" }, { brand: "Not/A)Brand", version: "24" }] };
    expect(resolveBrowser(parse(UA.chromeWin), h).name).toBe("Edge");
  });

  it("keeps a UA-detected specific browser when hints are generic", () => {
    const h: Hints = { brands: [{ brand: "Chromium", version: "137" }, { brand: "Not/A)Brand", version: "24" }] };
    expect(resolveBrowser(parse(UA.opera), h)).toMatchObject({ name: "Opera", major: "121", source: "ua" });
  });

  it("falls back to the UA without hints", () => {
    expect(resolveBrowser(parse(UA.firefoxWin64), null)).toEqual({ name: "Firefox", version: "128.0", major: "128", source: "ua" });
    expect(resolveBrowser(parse(UA.safariIos17), null)).toMatchObject({ name: "Safari", version: "17.5" });
  });

  it("detects the frozen Chromium UA", () => {
    expect(isReducedUa(UA.chromeWin)).toBe(true);
    expect(isReducedUa(UA.firefoxWin64)).toBe(false);
  });

  it("maps rendering engines to JS engines", () => {
    expect(jsEngine("Blink")).toBe("V8");
    expect(jsEngine("Gecko")).toBe("SpiderMonkey");
    expect(jsEngine("WebKit")).toBe("JavaScriptCore");
    expect(jsEngine(undefined)).toBeNull();
  });
});

describe("resolveOs", () => {
  it("Windows 11 only via platformVersion ≥ 13", () => {
    expect(windowsFromPlatformVersion("15.0.0")).toBe("11");
    expect(windowsFromPlatformVersion("13.0.0")).toBe("11");
    expect(windowsFromPlatformVersion("10.0.0")).toBe("10");
    expect(windowsFromPlatformVersion("0.3.0")).toBe("8.1");
    expect(windowsFromPlatformVersion("0.1.0")).toBe("7");
    expect(resolveOs(parse(UA.chromeWin), chromeHints)).toMatchObject({ label: "Windows 11", source: "hints" });
    expect(resolveOs(parse(UA.chromeWin), { ...chromeHints, platformVersion: "10.0.0" }).label).toBe("Windows 10");
  });

  it("is honest when the UA cannot tell Windows 10 from 11", () => {
    expect(resolveOs(parse(UA.firefoxWin64), null)).toMatchObject({ label: "Windows 10 / 11", note: "win-ambiguous" });
    expect(resolveOs(parse(UA.firefoxWin32), null).label).toBe("Windows 7");
  });

  it("macOS: real version from hints, frozen 10.15.7 in the UA", () => {
    expect(macosName("15.5")).toBe("Sequoia");
    expect(macosName("26.0")).toBe("Tahoe");
    expect(resolveOs(parse(UA.safariMac), { platform: "macOS", platformVersion: "15.5.0" }).label).toBe("macOS 15.5 Sequoia");
    expect(resolveOs(parse(UA.safariMac), null)).toMatchObject({ label: "macOS", note: "mac-frozen" });
    expect(resolveOs(parse(UA.safariMac), null, 5)).toMatchObject({ name: "iPadOS", note: "ipad-desktop" });
  });

  it("iOS 26 frozen UA falls back to the Safari version", () => {
    expect(resolveOs(parse(UA.safariIos26), null)).toMatchObject({ label: "iOS 26", note: "ios-from-safari" });
    expect(resolveOs(parse(UA.safariIos17), null)).toMatchObject({ label: "iOS 17.5", note: null });
  });

  it("Android: reduced UA vs hints", () => {
    expect(resolveOs(parse(UA.chromeAndroid), null)).toMatchObject({ label: "Android", note: "android-reduced" });
    expect(resolveOs(parse(UA.chromeAndroid), { platform: "Android", platformVersion: "14.0.0", mobile: true }).label).toBe("Android 14");
  });
});

describe("resolveDeviceType", () => {
  it("classifies devices", () => {
    expect(resolveDeviceType(parse(UA.chromeWin), chromeHints)).toBe("desktop");
    expect(resolveDeviceType(parse(UA.safariIos17), null)).toBe("mobile");
    expect(resolveDeviceType(parse(UA.chromeAndroid), { mobile: true })).toBe("mobile");
    expect(resolveDeviceType(parse(UA.safariMac), null, 5)).toBe("tablet");
  });
});

describe("detectBitness", () => {
  it("Client Hints", () => {
    expect(detectBitness(UA.chromeWin, chromeHints)).toEqual({ os: 64, browser: 64, arch: "x86", source: "hints", token: null });
    expect(detectBitness(UA.chromeWin, { architecture: "x86", bitness: "64", wow64: true })).toMatchObject({ os: 64, browser: 32 });
    expect(detectBitness("", { architecture: "arm", bitness: "64" })).toMatchObject({ os: 64, browser: 64, arch: "arm" });
    expect(detectBitness("", { architecture: "x86", bitness: "32" })).toMatchObject({ os: 32, browser: 32 });
  });

  it("UA tokens", () => {
    expect(detectBitness(UA.firefoxWin64, null)).toMatchObject({ os: 64, browser: 64, arch: "x86", token: "Win64" });
    expect(detectBitness(UA.firefoxWow64, null)).toMatchObject({ os: 64, browser: 32, token: "WOW64" });
    expect(detectBitness(UA.firefoxWin32, null)).toMatchObject({ os: 32, browser: 32 });
    expect(detectBitness(UA.linux64, null)).toMatchObject({ os: 64, arch: "x86", token: "x86_64" });
    expect(detectBitness(UA.linuxArm, null)).toMatchObject({ os: 64, arch: "arm", token: "aarch64" });
    expect(detectBitness("Mozilla/5.0 (X11; Linux i686; rv:109.0)", null)).toMatchObject({ os: 32, arch: "x86" });
    expect(detectBitness("Mozilla/5.0 (X11; Linux armv7l)", null)).toMatchObject({ os: 32, arch: "arm" });
  });

  it("navigator.platform for reduced Android UAs, platform facts for Apple", () => {
    expect(detectBitness(UA.chromeAndroid, null, "Linux armv8l")).toMatchObject({ os: 64, browser: 32, arch: "arm", source: "platform" });
    expect(detectBitness(UA.chromeAndroid, null, "Linux aarch64")).toMatchObject({ os: 64, browser: 64, source: "platform" });
    expect(detectBitness(UA.chromeAndroid, null)).toEqual({ os: null, browser: null, arch: null, source: null, token: null });
    expect(detectBitness(UA.safariMac, null)).toMatchObject({ os: 64, arch: null, source: "platform" });
    expect(detectBitness(UA.safariIos17, null)).toMatchObject({ os: 64, arch: "arm" });
  });
});

describe("parseRenderer", () => {
  it("ANGLE Direct3D", () => {
    expect(parseRenderer("ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002503) Direct3D11 vs_5_0 ps_5_0, D3D11)")).toEqual({
      vendor: "NVIDIA",
      model: "NVIDIA GeForce RTX 3060",
      backend: "Direct3D 11",
      software: false,
      approximate: false,
    });
    expect(parseRenderer("ANGLE (Intel, Intel(R) UHD Graphics 620 (0x00005917) Direct3D11 vs_5_0 ps_5_0, D3D11)").model).toBe("Intel(R) UHD Graphics 620");
  });

  it("ANGLE Metal / Vulkan / OpenGL", () => {
    expect(parseRenderer("ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)")).toMatchObject({ vendor: "Apple", model: "Apple M2", backend: "Metal" });
    expect(parseRenderer("ANGLE (Intel, Vulkan 1.3.255 (Intel(R) UHD Graphics 620 (0x00005917)), Intel open-source Mesa driver)")).toMatchObject({
      model: "Intel(R) UHD Graphics 620",
      backend: "Vulkan",
    });
    expect(parseRenderer("ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1080/PCIe/SSE2, OpenGL 4.5.0 NVIDIA 535.54)")).toMatchObject({
      model: "NVIDIA GeForce GTX 1080",
      backend: "OpenGL",
    });
  });

  it("software renderers and generalised names", () => {
    expect(parseRenderer("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)").software).toBe(true);
    expect(parseRenderer("llvmpipe (LLVM 15.0.7, 256 bits)").software).toBe(true);
    expect(parseRenderer("NVIDIA GeForce GTX 980, or similar")).toMatchObject({ model: "NVIDIA GeForce GTX 980", approximate: true });
    expect(parseRenderer("Apple GPU")).toMatchObject({ model: "Apple GPU", vendor: null, software: false });
  });
});
