/**
 * Pure helpers that turn a parsed User-Agent (ua-parser-js v1 result) and
 * User-Agent Client Hints into human-readable facts. No DOM access.
 */

export interface Brand {
  brand: string;
  version: string;
}

/** Subset of NavigatorUAData + getHighEntropyValues() we use. */
export interface Hints {
  brands?: Brand[];
  fullVersionList?: Brand[];
  mobile?: boolean;
  platform?: string;
  platformVersion?: string;
  architecture?: string;
  bitness?: string;
  model?: string;
  wow64?: boolean;
}

/** Shape of ua-parser-js v1 `getResult()` (all fields optional). */
export interface ParsedUa {
  browser?: { name?: string; version?: string; major?: string };
  engine?: { name?: string; version?: string };
  os?: { name?: string; version?: string };
  device?: { vendor?: string; model?: string; type?: string };
  cpu?: { architecture?: string };
}

export type Source = "hints" | "ua" | "platform";

/* ───────────── browser ───────────── */

const GREASE = /not[^a-z]*a[^a-z]*brand/i;

const BRAND_NAMES: Record<string, string> = {
  "Google Chrome": "Chrome",
  "Microsoft Edge": "Edge",
  "Microsoft Edge WebView2": "Edge WebView2",
  YaBrowser: "Yandex Browser",
  Yandex: "Yandex Browser",
  "Samsung Internet": "Samsung Internet",
  "Samsung Browser": "Samsung Internet",
  "Mobile Safari": "Safari",
  "Mobile Firefox": "Firefox",
  "Opera Touch": "Opera",
  "Android Browser": "Android Browser",
};

export const normalizeBrowserName = (name: string) => BRAND_NAMES[name] ?? name;

const GENERIC_CHROMIUM = new Set(["Chrome", "Chromium", "Chrome Headless", "Chrome WebView", "Mobile Chrome"]);

/** Real (non-GREASE) brands from Client Hints, preferring the full version list. */
export function realBrands(h: Hints | null | undefined): Brand[] {
  const list = h?.fullVersionList?.length ? h.fullVersionList : (h?.brands ?? []);
  return list.filter((b) => b.brand && !GREASE.test(b.brand));
}

export interface BrowserInfo {
  name: string | null;
  version: string | null;
  major: string | null;
  source: Source | null;
}

const majorOf = (v: string | null | undefined) => (v ? (v.split(".")[0] ?? null) : null);

/**
 * Browser name/version. Client Hints win for Chromium browsers because their
 * UA string is frozen (e.g. "Chrome/138.0.0.0"), but a specific UA-detected
 * browser (Opera, Yandex, Samsung…) beats a generic "Chrome"/"Chromium" brand.
 */
export function resolveBrowser(p: ParsedUa | null, h: Hints | null): BrowserInfo {
  const uaName = p?.browser?.name ? normalizeBrowserName(p.browser.name) : null;
  const uaVer = p?.browser?.version ?? null;
  const brands = realBrands(h);
  if (brands.length) {
    const specific = brands.find((b) => b.brand !== "Chromium" && b.brand !== "Google Chrome");
    const chrome = brands.find((b) => b.brand === "Google Chrome");
    const pick = specific ?? chrome ?? brands.find((b) => b.brand === "Chromium") ?? brands[0];
    const name = normalizeBrowserName(pick.brand);
    if (!specific && uaName && !GENERIC_CHROMIUM.has(uaName)) {
      return { name: uaName, version: uaVer, major: majorOf(uaVer), source: "ua" };
    }
    return { name, version: pick.version || null, major: majorOf(pick.version), source: "hints" };
  }
  if (uaName) return { name: uaName, version: uaVer, major: majorOf(uaVer), source: "ua" };
  return { name: null, version: null, major: null, source: null };
}

/** JavaScript engine by rendering engine name. */
export function jsEngine(engine: string | null | undefined): string | null {
  switch (engine) {
    case "Blink":
      return "V8";
    case "Gecko":
      return "SpiderMonkey";
    case "WebKit":
      return "JavaScriptCore";
    case "EdgeHTML":
      return "Chakra";
    default:
      return null;
  }
}

/** Chromium's reduced UA freezes the version to "<major>.0.0.0". */
export function isReducedUa(ua: string): boolean {
  return /Chrome\/\d+\.0\.0\.0\b/.test(ua) || /Android 10; K\)/.test(ua);
}

/* ───────────── operating system ───────────── */

export const MACOS_NAMES: readonly [number, string][] = [
  [11, "Big Sur"],
  [12, "Monterey"],
  [13, "Ventura"],
  [14, "Sonoma"],
  [15, "Sequoia"],
  [26, "Tahoe"],
];

export function macosName(version: string): string | null {
  const [maj, min] = version.split(".").map(Number);
  if (maj === 10) {
    const old: Record<number, string> = { 13: "High Sierra", 14: "Mojave", 15: "Catalina" };
    return old[min] ?? null;
  }
  return MACOS_NAMES.find(([v]) => v === maj)?.[1] ?? null;
}

/**
 * Windows version from Sec-CH-UA-Platform-Version (Microsoft mapping):
 * 0.1.0 = 7, 0.2.0 = 8, 0.3.0 = 8.1, 1–12 = Windows 10, 13+ = Windows 11.
 */
export function windowsFromPlatformVersion(pv: string): string | null {
  const [maj, min] = pv.split(".").map(Number);
  if (!Number.isFinite(maj)) return null;
  if (maj >= 13) return "11";
  if (maj >= 1) return "10";
  return ({ 1: "7", 2: "8", 3: "8.1" } as Record<number, string>)[min] ?? null;
}

/** "14.5.0" → "14.5", "15.0.0" → "15" */
export function shortVersion(v: string): string {
  const parts = v.split(".");
  while (parts.length > 1 && /^0*$/.test(parts[parts.length - 1])) parts.pop();
  return parts.slice(0, 2).join(".");
}

export type OsNote = "win-ambiguous" | "mac-frozen" | "ios-from-safari" | "ios-frozen" | "android-reduced" | "ipad-desktop";

export interface OsInfo {
  /** Family: Windows, macOS, iOS, iPadOS, Android, Linux, ChromeOS… */
  name: string | null;
  version: string | null;
  /** Human label, e.g. "Windows 11", "macOS 15 Sequoia", "Windows 10 / 11". */
  label: string | null;
  codename: string | null;
  source: Source | null;
  note: OsNote | null;
}

const OS_NAMES: Record<string, string> = { "Mac OS": "macOS", "Chromium OS": "ChromeOS", "Chrome OS": "ChromeOS" };

export function resolveOs(p: ParsedUa | null, h: Hints | null, maxTouchPoints = 0): OsInfo {
  const none: OsInfo = { name: null, version: null, label: null, codename: null, source: null, note: null };
  const plat = h?.platform?.trim();
  const pv = h?.platformVersion?.trim();
  if (plat && pv) {
    if (plat === "Windows") {
      const v = windowsFromPlatformVersion(pv);
      if (v) return { name: "Windows", version: v, label: `Windows ${v}`, codename: null, source: "hints", note: null };
    } else if (plat === "macOS") {
      const v = shortVersion(pv);
      const code = macosName(v);
      return { name: "macOS", version: v, label: `macOS ${v}${code ? ` ${code}` : ""}`, codename: code, source: "hints", note: null };
    } else if (plat === "Android") {
      const v = shortVersion(pv);
      return { name: "Android", version: v, label: `Android ${v}`, codename: null, source: "hints", note: null };
    } else if (plat === "Chrome OS" || plat === "ChromeOS") {
      return { name: "ChromeOS", version: pv, label: "ChromeOS", codename: null, source: "hints", note: null };
    } else if (plat === "Linux") {
      const distro = p?.os?.name && p.os.name !== "Linux" ? p.os.name : null;
      return { name: "Linux", version: null, label: distro ? `Linux (${distro})` : "Linux", codename: null, source: "hints", note: null };
    }
  }

  const rawName = p?.os?.name;
  if (!rawName) {
    if (plat) return { ...none, name: plat, label: plat, source: "hints" };
    return none;
  }
  const name = OS_NAMES[rawName] ?? rawName;
  const ver = p?.os?.version ?? null;

  if (name === "Windows") {
    if (ver === "10") return { name, version: null, label: "Windows 10 / 11", codename: null, source: "ua", note: "win-ambiguous" };
    return { name, version: ver, label: ver ? `Windows ${ver}` : "Windows", codename: null, source: "ua", note: null };
  }
  if (name === "macOS") {
    // iPadOS 13+ requests desktop sites and presents itself as a Mac.
    if (maxTouchPoints > 1) return { name: "iPadOS", version: null, label: "iPadOS", codename: null, source: "ua", note: "ipad-desktop" };
    if (!ver || ver.startsWith("10.15")) return { name, version: null, label: "macOS", codename: null, source: "ua", note: "mac-frozen" };
    const v = shortVersion(ver);
    const code = macosName(v);
    return { name, version: v, label: `macOS ${v}${code ? ` ${code}` : ""}`, codename: code, source: "ua", note: null };
  }
  if (name === "iOS") {
    const fam = p?.device?.type === "tablet" || p?.device?.model === "iPad" ? "iPadOS" : "iOS";
    const bName = p?.browser?.name ?? "";
    const bMaj = Number(p?.browser?.major);
    // Since iOS 26 Safari freezes the OS token at 18_6, but Safari's own version equals the OS version.
    if (/Safari/.test(bName) && bMaj >= 26 && p?.browser?.version) {
      const v = shortVersion(p.browser.version);
      return { name: fam, version: v, label: `${fam} ${v}`, codename: null, source: "ua", note: "ios-from-safari" };
    }
    const v = ver ? shortVersion(ver) : null;
    return { name: fam, version: v, label: v ? `${fam} ${v}` : fam, codename: null, source: "ua", note: v === "18.6" ? "ios-frozen" : null };
  }
  if (name === "Android") {
    if (p?.device?.model === "K") return { name, version: null, label: "Android", codename: null, source: "ua", note: "android-reduced" };
    const v = ver ? shortVersion(ver) : null;
    return { name, version: v, label: v ? `Android ${v}` : "Android", codename: null, source: "ua", note: null };
  }
  const v = ver ? shortVersion(ver) : null;
  return { name, version: v, label: v ? `${name} ${v}` : name, codename: null, source: "ua", note: null };
}

/* ───────────── device ───────────── */

export type DeviceType = "mobile" | "tablet" | "desktop" | "smarttv" | "console" | "wearable" | "xr" | "embedded";

export function resolveDeviceType(p: ParsedUa | null, h: Hints | null, maxTouchPoints = 0): DeviceType {
  const t = p?.device?.type;
  if (t === "mobile" || t === "tablet" || t === "smarttv" || t === "console" || t === "wearable" || t === "xr" || t === "embedded") return t;
  if (h?.mobile) return "mobile";
  // iPad in desktop mode reports "Macintosh" but has a touch screen.
  if (p?.os?.name === "Mac OS" && maxTouchPoints > 1) return "tablet";
  if (p?.os?.name === "Android") return "mobile";
  return "desktop";
}

/* ───────────── 32 / 64-bit ───────────── */

export type Bits = 32 | 64;

export interface BitnessInfo {
  /** OS / CPU bitness. */
  os: Bits | null;
  /** Bitness of the browser build. */
  browser: Bits | null;
  arch: "x86" | "arm" | null;
  source: Source | null;
  /** The UA / platform token the conclusion is based on. */
  token: string | null;
}

function archOf(s: string | undefined): "x86" | "arm" | null {
  if (!s) return null;
  if (/^arm/i.test(s)) return "arm";
  if (/^x86/i.test(s)) return "x86";
  return null;
}

/**
 * Bitness from Client Hints (architecture/bitness/wow64) or, failing that,
 * from well-known UA / navigator.platform tokens. Returns nulls when unknown.
 */
export function detectBitness(ua: string, h: Hints | null, platform = ""): BitnessInfo {
  if (h && (h.bitness === "64" || h.bitness === "32")) {
    const os: Bits = h.bitness === "64" ? 64 : 32;
    return { os, browser: h.wow64 ? 32 : os, arch: archOf(h.architecture), source: "hints", token: null };
  }
  const tests: [RegExp, Omit<BitnessInfo, "source" | "token">][] = [
    [/WOW64/i, { os: 64, browser: 32, arch: "x86" }],
    [/Win64|x64;|\bx64\b/, { os: 64, browser: 64, arch: "x86" }],
    [/aarch64|arm64/i, { os: 64, browser: 64, arch: "arm" }],
    [/armv8l/i, { os: 64, browser: 32, arch: "arm" }],
    [/x86_64|amd64/i, { os: 64, browser: 64, arch: "x86" }],
    [/armv[5-7]\w*/i, { os: 32, browser: 32, arch: "arm" }],
    [/i[3-6]86/i, { os: 32, browser: 32, arch: "x86" }],
  ];
  for (const [re, r] of tests) {
    const m = ua.match(re);
    if (m) return { ...r, source: "ua", token: m[0] };
  }
  // Chrome on Android reduces the UA, but navigator.platform still says "Linux aarch64" / "Linux armv8l".
  for (const [re, r] of tests) {
    const m = platform.match(re);
    if (m) return { ...r, source: "platform", token: m[0] };
  }
  if (/Windows NT/.test(ua)) return { os: 32, browser: 32, arch: "x86", source: "ua", token: "Windows NT" };
  // Every macOS release since 10.15 and every iOS since 11 is 64-bit only.
  if (/iPhone|iPad|iPod/.test(ua)) return { os: 64, browser: 64, arch: "arm", source: "platform", token: null };
  if (/Macintosh|Mac OS X/.test(ua)) return { os: 64, browser: 64, arch: null, source: "platform", token: null };
  return { os: null, browser: null, arch: null, source: null, token: null };
}

/* ───────────── GPU ───────────── */

export interface GpuName {
  vendor: string | null;
  model: string;
  /** Graphics API used by the browser (Direct3D 11, Metal, Vulkan, OpenGL). */
  backend: string | null;
  /** Software rasteriser — hardware acceleration is off or unavailable. */
  software: boolean;
  /** Browser generalised the model ("…, or similar"). */
  approximate: boolean;
}

function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const SOFTWARE = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i;

function backendName(s: string): string | null {
  if (/D3D11|Direct3D11/i.test(s)) return "Direct3D 11";
  if (/D3D9|Direct3D9/i.test(s)) return "Direct3D 9";
  if (/D3D12/i.test(s)) return "Direct3D 12";
  if (/Metal/i.test(s)) return "Metal";
  if (/Vulkan/i.test(s)) return "Vulkan";
  if (/OpenGL ES/i.test(s)) return "OpenGL ES";
  if (/OpenGL/i.test(s)) return "OpenGL";
  return null;
}

/** Parse a WebGL UNMASKED_RENDERER string, e.g. "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002503) Direct3D11 vs_5_0 ps_5_0, D3D11)". */
export function parseRenderer(raw: string): GpuName {
  const s = raw.trim();
  const software = SOFTWARE.test(s);
  const angle = s.match(/^ANGLE \((.*)\)$/s);
  if (angle) {
    const parts = splitTopLevel(angle[1]);
    const vendor = parts.length >= 3 ? parts[0] : null;
    let model = parts.length >= 3 ? parts[1] : (parts[0] ?? s);
    const tail = parts.slice(1).join(" ");
    const backend = backendName(tail);
    const vk = model.match(/^Vulkan [\d.]+ \((.*)\)$/);
    if (vk) model = vk[1];
    model = model
      .replace(/^ANGLE Metal Renderer:\s*/i, "")
      .replace(/\s*\(0x[0-9a-f]+\)/gi, "")
      .replace(/\s+Direct3D\S*.*$/i, "")
      .replace(/\/PCIe\/SSE2$/i, "")
      .replace(/\s+OpenGL.*$/i, "")
      .trim();
    return { vendor, model: model || s, backend, software, approximate: false };
  }
  const approximate = /,\s*or similar$/i.test(s);
  const model = s.replace(/,\s*or similar$/i, "").replace(/\/PCIe\/SSE2$/i, "").trim();
  return { vendor: null, model, backend: backendName(s), software, approximate };
}
