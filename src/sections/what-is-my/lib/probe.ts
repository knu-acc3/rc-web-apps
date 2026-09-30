/**
 * Browser-only probes and stores for the what-is-my tools. Nothing here runs at
 * import time; every function must be called from an effect, a store
 * subscription or an event handler.
 */
import { useEffect, useState } from "react";
import {
  detectBitness,
  resolveBrowser,
  resolveDeviceType,
  resolveOs,
  type BitnessInfo,
  type BrowserInfo,
  type DeviceType,
  type Hints,
  type OsInfo,
  type ParsedUa,
} from "./ua";

interface UaDataLike {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
}

export interface GpuAdapterInfoLike {
  vendor?: string;
  architecture?: string;
  device?: string;
  description?: string;
}

interface GpuAdapterLike {
  info?: GpuAdapterInfoLike;
  requestAdapterInfo?: () => Promise<GpuAdapterInfoLike>;
  features?: Set<string>;
  isFallbackAdapter?: boolean;
}

export type Nav = Navigator & {
  userAgentData?: UaDataLike;
  deviceMemory?: number;
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string;
  gpu?: { requestAdapter: (opts?: Record<string, unknown>) => Promise<GpuAdapterLike | null> };
};

export const nav = () => navigator as Nav;

/* ───────────── one-shot async detection ───────────── */

/**
 * Run `detect` after mount (never during SSR/hydration) and return its result;
 * null while detecting. `detect` must be a stable (module-level) function.
 */
export function useDetected<T>(detect: () => T | Promise<T>, nonce = 0): T | null {
  const [state, setState] = useState<{ nonce: number; value: T } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(detect)
      .then(
        (value) => {
          if (alive) setState({ nonce, value });
        },
        () => {},
      );
    return () => {
      alive = false;
    };
  }, [detect, nonce]);
  return state && state.nonce === nonce ? state.value : null;
}

/* ───────────── live stores for useSyncExternalStore ───────────── */

export interface LiveStore<T> {
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T | null;
}

/** Wrap a reader so identical readings keep the same object identity. */
export function liveStore<T>(read: () => T, subscribe: (cb: () => void) => () => void): LiveStore<T> {
  let cache: { key: string; value: T } | null = null;
  return {
    subscribe,
    getSnapshot() {
      const value = read();
      const key = JSON.stringify(value);
      if (!cache || cache.key !== key) cache = { key, value };
      return cache.value;
    },
    getServerSnapshot: () => null,
  };
}

/** Calls `cb` at most once per animation frame. */
function throttled(cb: () => void): { run: () => void; cancel: () => void } {
  let raf = 0;
  return {
    run: () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        cb();
      });
    },
    cancel: () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

/** Fires when devicePixelRatio changes (zoom, moving the window to another monitor). */
function onDprChange(cb: () => void): () => void {
  let mq: MediaQueryList | null = null;
  const handler = () => {
    arm();
    cb();
  };
  function arm() {
    mq?.removeEventListener("change", handler);
    mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener("change", handler);
  }
  arm();
  return () => mq?.removeEventListener("change", handler);
}

const mq = (q: string) => typeof window.matchMedia === "function" && window.matchMedia(q).matches;

export interface ScreenSnapshot {
  cssW: number;
  cssH: number;
  availW: number;
  availH: number;
  dpr: number;
  colorDepth: number;
  orientation: string | null;
  angle: number | null;
  hdr: boolean;
  gamut: "rec2020" | "p3" | "srgb" | null;
  extended: boolean | null;
}

function readScreen(): ScreenSnapshot {
  const s = window.screen;
  const o = s.orientation as ScreenOrientation | undefined;
  const ext = (s as Screen & { isExtended?: boolean }).isExtended;
  return {
    cssW: s.width,
    cssH: s.height,
    availW: s.availWidth,
    availH: s.availHeight,
    dpr: window.devicePixelRatio || 1,
    colorDepth: s.colorDepth,
    orientation: o?.type ?? null,
    angle: typeof o?.angle === "number" ? o.angle : null,
    hdr: mq("(dynamic-range: high)"),
    gamut: mq("(color-gamut: rec2020)") ? "rec2020" : mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: srgb)") ? "srgb" : null,
    extended: typeof ext === "boolean" ? ext : null,
  };
}

function subscribeScreen(cb: () => void): () => void {
  const t = throttled(cb);
  window.addEventListener("resize", t.run);
  const o = window.screen.orientation as ScreenOrientation | undefined;
  o?.addEventListener?.("change", t.run);
  const offDpr = onDprChange(t.run);
  return () => {
    window.removeEventListener("resize", t.run);
    o?.removeEventListener?.("change", t.run);
    offDpr();
    t.cancel();
  };
}

export const screenStore = liveStore(readScreen, subscribeScreen);

export interface ViewportSnapshot {
  innerW: number;
  innerH: number;
  clientW: number;
  clientH: number;
  outerW: number;
  outerH: number;
  dpr: number;
  vv: { w: number; h: number; scale: number; left: number; top: number } | null;
}

function readViewport(): ViewportSnapshot {
  const de = document.documentElement;
  const vv = window.visualViewport;
  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    innerW: window.innerWidth,
    innerH: window.innerHeight,
    clientW: de.clientWidth,
    clientH: de.clientHeight,
    outerW: window.outerWidth,
    outerH: window.outerHeight,
    dpr: window.devicePixelRatio || 1,
    vv: vv ? { w: r(vv.width), h: r(vv.height), scale: r(vv.scale), left: r(vv.offsetLeft), top: r(vv.offsetTop) } : null,
  };
}

function subscribeViewport(cb: () => void): () => void {
  const t = throttled(cb);
  const vv = window.visualViewport;
  window.addEventListener("resize", t.run);
  vv?.addEventListener("resize", t.run);
  vv?.addEventListener("scroll", t.run);
  const offDpr = onDprChange(t.run);
  return () => {
    window.removeEventListener("resize", t.run);
    vv?.removeEventListener("resize", t.run);
    vv?.removeEventListener("scroll", t.run);
    offDpr();
    t.cancel();
  };
}

export const viewportStore = liveStore(readViewport, subscribeViewport);

/** Current second (epoch seconds), ticking once per second. */
export const clockStore: LiveStore<number> = {
  subscribe(cb) {
    let id: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      cb();
      id = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    id = setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    return () => clearTimeout(id);
  },
  getSnapshot: () => Math.floor(Date.now() / 1000),
  getServerSnapshot: () => null,
};

export interface PointerSnapshot {
  maxTouchPoints: number;
  pointer: "fine" | "coarse" | "none" | null;
  anyPointer: ("fine" | "coarse")[];
  hover: boolean;
}

function readPointer(): PointerSnapshot {
  return {
    maxTouchPoints: navigator.maxTouchPoints || 0,
    pointer: mq("(pointer: coarse)") ? "coarse" : mq("(pointer: fine)") ? "fine" : mq("(pointer: none)") ? "none" : null,
    anyPointer: [...(mq("(any-pointer: fine)") ? ["fine" as const] : []), ...(mq("(any-pointer: coarse)") ? ["coarse" as const] : [])],
    hover: mq("(hover: hover)"),
  };
}

function subscribePointer(cb: () => void): () => void {
  const queries = ["(pointer: coarse)", "(pointer: fine)", "(any-pointer: coarse)", "(any-pointer: fine)", "(hover: hover)"].map((q) => window.matchMedia(q));
  for (const q of queries) q.addEventListener("change", cb);
  return () => {
    for (const q of queries) q.removeEventListener("change", cb);
  };
}

export const pointerStore = liveStore(readPointer, subscribePointer);

/* ───────────── user agent ───────────── */

export interface UaSnapshot {
  ua: string;
  parsed: ParsedUa;
  hints: Hints | null;
  /** Raw high-entropy values object for display. */
  hintsRaw: Record<string, unknown> | null;
  platform: string;
  maxTouchPoints: number;
  browser: BrowserInfo;
  os: OsInfo;
  deviceType: DeviceType;
  bitness: BitnessInfo;
}

const HIGH_ENTROPY = ["architecture", "bitness", "model", "platformVersion", "fullVersionList", "wow64"];

async function readHints(): Promise<{ hints: Hints; raw: Record<string, unknown> } | null> {
  const uad = nav().userAgentData;
  if (!uad) return null;
  const low = { brands: uad.brands?.map((b) => ({ brand: b.brand, version: b.version })), mobile: uad.mobile, platform: uad.platform };
  let high: Record<string, unknown> = {};
  try {
    high = (await uad.getHighEntropyValues?.(HIGH_ENTROPY)) ?? {};
  } catch {
    /* denied by permissions policy */
  }
  const str = (k: string) => (typeof high[k] === "string" ? (high[k] as string) : undefined);
  const list = Array.isArray(high.fullVersionList) ? (high.fullVersionList as { brand: string; version: string }[]) : undefined;
  const hints: Hints = {
    ...low,
    fullVersionList: list?.map((b) => ({ brand: b.brand, version: b.version })),
    platformVersion: str("platformVersion"),
    architecture: str("architecture"),
    bitness: str("bitness"),
    model: str("model"),
    wow64: typeof high.wow64 === "boolean" ? high.wow64 : undefined,
  };
  return { hints, raw: { ...low, ...high } };
}

let uaPromise: Promise<UaSnapshot> | null = null;

/** Parse navigator.userAgent (ua-parser-js, loaded lazily) and merge Client Hints. Cached. */
export function detectUa(): Promise<UaSnapshot> {
  uaPromise ??= (async () => {
    const ua = navigator.userAgent;
    const mod = await import("ua-parser-js");
    // CommonJS interop differs between bundlers: named export, default.UAParser or the default itself.
    const Parser = mod.UAParser ?? mod.default?.UAParser ?? mod.default;
    const parsed = new Parser(ua).getResult() as ParsedUa;
    const h = await readHints();
    const hints = h?.hints ?? null;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const platform = navigator.platform || "";
    return {
      ua,
      parsed,
      hints,
      hintsRaw: h?.raw ?? null,
      platform,
      maxTouchPoints,
      browser: resolveBrowser(parsed, hints),
      os: resolveOs(parsed, hints, maxTouchPoints),
      deviceType: resolveDeviceType(parsed, hints, maxTouchPoints),
      bitness: detectBitness(ua, hints, platform),
    };
  })();
  return uaPromise;
}

/* ───────────── storage ───────────── */

export function storageWorks(kind: "localStorage" | "sessionStorage"): boolean {
  try {
    const s = window[kind];
    const k = "__wim_test__";
    s.setItem(k, "1");
    const ok = s.getItem(k) === "1";
    s.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}
