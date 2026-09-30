/**
 * Browser feature-detection tables. Definitions are plain data + guarded test
 * functions: importing this module never touches the DOM, and every test
 * returns false (instead of throwing) outside a browser.
 */
import type { L10n } from "@/i18n/config";

export type FeatureGroup = "graphics" | "compute" | "media" | "devices" | "system" | "intl" | "css";

export const FEATURE_GROUPS: readonly { id: FeatureGroup; name: L10n }[] = [
  { id: "graphics", name: { ru: "Графика и видео", en: "Graphics & video" } },
  { id: "compute", name: { ru: "Вычисления и WebAssembly", en: "Compute & WebAssembly" } },
  { id: "media", name: { ru: "Камера, звук, связь", en: "Camera, audio, communication" } },
  { id: "devices", name: { ru: "Устройства и датчики", en: "Devices & sensors" } },
  { id: "system", name: { ru: "Файлы, буфер обмена, уведомления", en: "Files, clipboard, notifications" } },
  { id: "intl", name: { ru: "Интернационализация (Intl)", en: "Internationalization (Intl)" } },
  { id: "css", name: { ru: "Возможности CSS", en: "CSS features" } },
];

export interface FeatureDef {
  id: string;
  group: FeatureGroup;
  name: L10n;
  test: () => boolean;
}

type Obj = Record<string, unknown>;
const g = () => globalThis as unknown as Obj;
const nav = (): Obj | undefined => (typeof navigator === "undefined" ? undefined : (navigator as unknown as Obj));
const doc = (): Obj | undefined => (typeof document === "undefined" ? undefined : (document as unknown as Obj));
const inNav = (k: string) => {
  const n = nav();
  return !!n && k in n;
};
const inDoc = (k: string) => {
  const d = doc();
  return !!d && k in d;
};
const inWin = (k: string) => typeof window !== "undefined" && k in window;
const fn = (k: string) => typeof g()[k] === "function";
const intl = (k: string) => typeof Intl !== "undefined" && typeof (Intl as unknown as Obj)[k] === "function";

function css(...decls: string[]): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  return decls.some((d) => {
    try {
      return CSS.supports(d);
    } catch {
      return false;
    }
  });
}

function gl(type: "webgl" | "webgl2"): boolean {
  if (typeof document === "undefined") return false;
  try {
    const ctx = document.createElement("canvas").getContext(type) as WebGLRenderingContext | null;
    if (!ctx) return false;
    ctx.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

// Minimal modules from wasm-feature-detect (Apache-2.0): a v128 op and an atomic op.
const WASM_SIMD = [0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11];
const WASM_THREADS = [0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5, 4, 1, 3, 1, 1, 10, 11, 1, 9, 0, 65, 0, 254, 16, 2, 0, 26, 11];

function wasmValidates(bytes: number[]): boolean {
  try {
    return typeof WebAssembly === "object" && WebAssembly.validate(new Uint8Array(bytes));
  } catch {
    return false;
  }
}

const media = (k: string) => {
  const md = nav()?.mediaDevices as Obj | undefined;
  return !!md && typeof md[k] === "function";
};
const clip = (k: string) => {
  const c = nav()?.clipboard as Obj | undefined;
  return !!c && typeof c[k] === "function";
};

const same = (s: string): L10n => ({ ru: s, en: s });

export const FEATURES: readonly FeatureDef[] = [
  // graphics
  { id: "webgpu", group: "graphics", name: same("WebGPU"), test: () => inNav("gpu") },
  { id: "webgl", group: "graphics", name: same("WebGL 1"), test: () => gl("webgl") },
  { id: "webgl2", group: "graphics", name: same("WebGL 2"), test: () => gl("webgl2") },
  { id: "offscreen-canvas", group: "graphics", name: same("OffscreenCanvas"), test: () => fn("OffscreenCanvas") },
  { id: "webcodecs", group: "graphics", name: { ru: "WebCodecs (кодирование видео)", en: "WebCodecs (video encoding)" }, test: () => fn("VideoEncoder") && fn("VideoDecoder") },
  { id: "view-transitions", group: "graphics", name: same("View Transitions API"), test: () => inDoc("startViewTransition") },
  { id: "picture-in-picture", group: "graphics", name: { ru: "Картинка в картинке", en: "Picture-in-Picture" }, test: () => inDoc("pictureInPictureEnabled") },
  // compute
  { id: "wasm", group: "compute", name: same("WebAssembly"), test: () => typeof WebAssembly === "object" },
  { id: "wasm-simd", group: "compute", name: same("WebAssembly SIMD"), test: () => wasmValidates(WASM_SIMD) },
  { id: "wasm-threads", group: "compute", name: { ru: "WebAssembly threads (атомарные операции)", en: "WebAssembly threads (atomics)" }, test: () => wasmValidates(WASM_THREADS) },
  { id: "workers", group: "compute", name: same("Web Workers"), test: () => fn("Worker") },
  { id: "service-worker", group: "compute", name: same("Service Worker"), test: () => inNav("serviceWorker") },
  { id: "shared-array-buffer", group: "compute", name: same("SharedArrayBuffer"), test: () => fn("SharedArrayBuffer") },
  { id: "cross-origin-isolated", group: "compute", name: { ru: "crossOriginIsolated (на этой странице)", en: "crossOriginIsolated (on this page)" }, test: () => g().crossOriginIsolated === true },
  { id: "compression-streams", group: "compute", name: same("Compression Streams"), test: () => fn("CompressionStream") },
  // media & communication
  { id: "webrtc", group: "media", name: same("WebRTC"), test: () => fn("RTCPeerConnection") },
  { id: "get-user-media", group: "media", name: { ru: "Камера и микрофон (getUserMedia)", en: "Camera & microphone (getUserMedia)" }, test: () => media("getUserMedia") },
  { id: "get-display-media", group: "media", name: { ru: "Запись экрана (getDisplayMedia)", en: "Screen capture (getDisplayMedia)" }, test: () => media("getDisplayMedia") },
  { id: "media-recorder", group: "media", name: same("MediaRecorder"), test: () => fn("MediaRecorder") },
  { id: "web-audio", group: "media", name: same("Web Audio API"), test: () => fn("AudioContext") || fn("webkitAudioContext") },
  { id: "speech-synthesis", group: "media", name: { ru: "Синтез речи", en: "Speech synthesis" }, test: () => inWin("speechSynthesis") },
  { id: "speech-recognition", group: "media", name: { ru: "Распознавание речи", en: "Speech recognition" }, test: () => inWin("SpeechRecognition") || inWin("webkitSpeechRecognition") },
  { id: "websocket", group: "media", name: same("WebSocket"), test: () => fn("WebSocket") },
  { id: "webtransport", group: "media", name: same("WebTransport"), test: () => fn("WebTransport") },
  // devices
  { id: "webauthn", group: "devices", name: { ru: "WebAuthn (ключи доступа)", en: "WebAuthn (passkeys)" }, test: () => fn("PublicKeyCredential") },
  { id: "web-bluetooth", group: "devices", name: same("Web Bluetooth"), test: () => inNav("bluetooth") },
  { id: "webusb", group: "devices", name: same("WebUSB"), test: () => inNav("usb") },
  { id: "web-serial", group: "devices", name: same("Web Serial"), test: () => inNav("serial") },
  { id: "webhid", group: "devices", name: same("WebHID"), test: () => inNav("hid") },
  { id: "web-nfc", group: "devices", name: same("Web NFC"), test: () => inWin("NDEFReader") },
  { id: "gamepad", group: "devices", name: same("Gamepad API"), test: () => inNav("getGamepads") },
  { id: "vibration", group: "devices", name: { ru: "Вибрация", en: "Vibration" }, test: () => inNav("vibrate") },
  { id: "pointer-events", group: "devices", name: same("Pointer Events"), test: () => fn("PointerEvent") },
  { id: "touch-events", group: "devices", name: { ru: "Сенсорные события (touch)", en: "Touch events" }, test: () => inWin("ontouchstart") },
  { id: "geolocation", group: "devices", name: { ru: "Геолокация", en: "Geolocation" }, test: () => inNav("geolocation") },
  { id: "device-orientation", group: "devices", name: { ru: "Датчик ориентации", en: "Device orientation" }, test: () => inWin("DeviceOrientationEvent") },
  { id: "wake-lock", group: "devices", name: { ru: "Запрет сна экрана (Wake Lock)", en: "Screen Wake Lock" }, test: () => inNav("wakeLock") },
  { id: "battery", group: "devices", name: { ru: "Состояние батареи", en: "Battery status" }, test: () => inNav("getBattery") },
  // system integration
  { id: "clipboard-write", group: "system", name: { ru: "Буфер обмена: запись (Clipboard API)", en: "Clipboard API: write" }, test: () => clip("writeText") },
  { id: "clipboard-read", group: "system", name: { ru: "Буфер обмена: чтение картинок", en: "Clipboard API: read images" }, test: () => clip("read") },
  { id: "file-system-access", group: "system", name: { ru: "Доступ к файлам (File System Access)", en: "File System Access" }, test: () => inWin("showOpenFilePicker") },
  { id: "opfs", group: "system", name: { ru: "Приватная файловая система (OPFS)", en: "Origin Private File System" }, test: () => typeof (nav()?.storage as Obj | undefined)?.getDirectory === "function" },
  { id: "web-share", group: "system", name: { ru: "Меню «Поделиться» (Web Share)", en: "Web Share" }, test: () => inNav("share") },
  { id: "notifications", group: "system", name: { ru: "Уведомления", en: "Notifications" }, test: () => inWin("Notification") },
  { id: "push", group: "system", name: same("Push API"), test: () => inWin("PushManager") },
  { id: "payment-request", group: "system", name: same("Payment Request API"), test: () => inWin("PaymentRequest") },
  { id: "fullscreen", group: "system", name: { ru: "Полноэкранный режим", en: "Fullscreen API" }, test: () => typeof document !== "undefined" && "requestFullscreen" in document.documentElement },
  { id: "badging", group: "system", name: { ru: "Значок на иконке приложения", en: "App badging" }, test: () => inNav("setAppBadge") },
  { id: "indexeddb", group: "system", name: same("IndexedDB"), test: () => typeof g().indexedDB === "object" && g().indexedDB !== null },
  { id: "web-locks", group: "system", name: same("Web Locks"), test: () => inNav("locks") },
  // Intl
  { id: "intl-segmenter", group: "intl", name: same("Intl.Segmenter"), test: () => intl("Segmenter") },
  { id: "intl-display-names", group: "intl", name: same("Intl.DisplayNames"), test: () => intl("DisplayNames") },
  { id: "intl-list-format", group: "intl", name: same("Intl.ListFormat"), test: () => intl("ListFormat") },
  { id: "intl-relative-time", group: "intl", name: same("Intl.RelativeTimeFormat"), test: () => intl("RelativeTimeFormat") },
  { id: "intl-duration-format", group: "intl", name: same("Intl.DurationFormat"), test: () => intl("DurationFormat") },
  {
    id: "intl-week-info",
    group: "intl",
    name: { ru: "Первый день недели (Intl.Locale weekInfo)", en: "First day of week (Intl.Locale weekInfo)" },
    test: () => {
      if (!intl("Locale")) return false;
      const p = Intl.Locale.prototype as unknown as Obj;
      return "getWeekInfo" in p || "weekInfo" in p;
    },
  },
  { id: "intl-format-range", group: "intl", name: same("Intl.NumberFormat formatRange"), test: () => intl("NumberFormat") && typeof (Intl.NumberFormat.prototype as unknown as Obj).formatRange === "function" },
  // CSS
  { id: "css-container-queries", group: "css", name: { ru: "Контейнерные запросы (@container)", en: "Container queries (@container)" }, test: () => css("container-type: inline-size") },
  { id: "css-has", group: "css", name: { ru: "Селектор :has()", en: ":has() selector" }, test: () => css("selector(:has(a))") },
  { id: "css-subgrid", group: "css", name: same("Subgrid"), test: () => css("grid-template-columns: subgrid") },
  { id: "css-nesting", group: "css", name: { ru: "Вложенность CSS (&)", en: "CSS nesting (&)" }, test: () => css("selector(&)") },
  { id: "css-color-mix", group: "css", name: same("color-mix()"), test: () => css("color: color-mix(in srgb, red, blue)") },
  { id: "css-oklch", group: "css", name: same("OKLCH"), test: () => css("color: oklch(0.5 0.1 200)") },
  { id: "css-anchor", group: "css", name: { ru: "Якорное позиционирование", en: "Anchor positioning" }, test: () => css("anchor-name: --a") },
  { id: "css-scroll-timeline", group: "css", name: { ru: "Анимации от прокрутки", en: "Scroll-driven animations" }, test: () => css("animation-timeline: scroll()") },
  { id: "css-text-wrap-balance", group: "css", name: same("text-wrap: balance"), test: () => css("text-wrap: balance") },
  { id: "css-dvh", group: "css", name: { ru: "Единицы dvh / svh", en: "dvh / svh units" }, test: () => css("height: 100dvh") },
  { id: "css-field-sizing", group: "css", name: same("field-sizing: content"), test: () => css("field-sizing: content") },
  { id: "css-backdrop-filter", group: "css", name: same("backdrop-filter"), test: () => css("backdrop-filter: blur(2px)", "-webkit-backdrop-filter: blur(2px)") },
  { id: "css-houdini-property", group: "css", name: same("CSS.registerProperty (@property)"), test: () => typeof CSS !== "undefined" && typeof (CSS as unknown as Obj).registerProperty === "function" },
];

/** Run every detector; never throws. */
export function detectFeatures(list: readonly FeatureDef[] = FEATURES): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const f of list) {
    try {
      out[f.id] = f.test() === true;
    } catch {
      out[f.id] = false;
    }
  }
  return out;
}

/* ───────────── ECMAScript features ───────────── */

export interface EsFeature {
  id: string;
  /** ECMAScript edition year; 0 = newer than ES2025 / proposal. */
  year: number;
  name: string;
  test: () => boolean;
}

const proto = (ctor: string, method: string) => {
  const c = g()[ctor] as { prototype?: Obj } | undefined;
  return typeof c?.prototype?.[method] === "function";
};
const stat = (ctor: string, method: string) => {
  const c = g()[ctor] as Obj | undefined;
  return !!c && typeof c[method] === "function";
};

export const ES_FEATURES: readonly EsFeature[] = [
  { id: "array-includes", year: 2016, name: "Array.prototype.includes", test: () => proto("Array", "includes") },
  { id: "object-entries", year: 2017, name: "Object.entries / values", test: () => stat("Object", "entries") && stat("Object", "values") },
  { id: "pad-start", year: 2017, name: "String.prototype.padStart", test: () => proto("String", "padStart") },
  { id: "promise-finally", year: 2018, name: "Promise.prototype.finally", test: () => proto("Promise", "finally") },
  { id: "async-iterator", year: 2018, name: "Symbol.asyncIterator", test: () => typeof Symbol === "function" && typeof Symbol.asyncIterator === "symbol" },
  { id: "array-flat", year: 2019, name: "Array.prototype.flat / flatMap", test: () => proto("Array", "flat") && proto("Array", "flatMap") },
  { id: "from-entries", year: 2019, name: "Object.fromEntries", test: () => stat("Object", "fromEntries") },
  { id: "bigint", year: 2020, name: "BigInt", test: () => typeof g().BigInt === "function" },
  { id: "all-settled", year: 2020, name: "Promise.allSettled", test: () => stat("Promise", "allSettled") },
  { id: "global-this", year: 2020, name: "globalThis", test: () => typeof globalThis === "object" },
  { id: "replace-all", year: 2021, name: "String.prototype.replaceAll", test: () => proto("String", "replaceAll") },
  { id: "promise-any", year: 2021, name: "Promise.any", test: () => stat("Promise", "any") },
  { id: "weak-ref", year: 2021, name: "WeakRef", test: () => fn("WeakRef") },
  { id: "array-at", year: 2022, name: "Array.prototype.at", test: () => proto("Array", "at") },
  { id: "has-own", year: 2022, name: "Object.hasOwn", test: () => stat("Object", "hasOwn") },
  { id: "error-cause", year: 2022, name: "Error cause", test: () => (new Error("x", { cause: 1 }) as Error & { cause?: unknown }).cause === 1 },
  { id: "find-last", year: 2023, name: "Array.prototype.findLast", test: () => proto("Array", "findLast") },
  { id: "to-sorted", year: 2023, name: "toSorted / toReversed / with", test: () => proto("Array", "toSorted") && proto("Array", "with") },
  { id: "group-by", year: 2024, name: "Object.groupBy / Map.groupBy", test: () => stat("Object", "groupBy") && stat("Map", "groupBy") },
  { id: "with-resolvers", year: 2024, name: "Promise.withResolvers", test: () => stat("Promise", "withResolvers") },
  { id: "well-formed", year: 2024, name: "String.prototype.isWellFormed", test: () => proto("String", "isWellFormed") },
  { id: "array-buffer-transfer", year: 2024, name: "ArrayBuffer.prototype.transfer", test: () => proto("ArrayBuffer", "transfer") },
  { id: "set-methods", year: 2025, name: "Set.prototype.union / intersection", test: () => proto("Set", "union") && proto("Set", "intersection") },
  {
    id: "iterator-helpers",
    year: 2025,
    name: "Iterator helpers",
    test: () => {
      const it = g().Iterator as { prototype?: Obj } | undefined;
      return typeof it?.prototype?.map === "function";
    },
  },
  { id: "promise-try", year: 2025, name: "Promise.try", test: () => stat("Promise", "try") },
  { id: "regexp-escape", year: 2025, name: "RegExp.escape", test: () => stat("RegExp", "escape") },
  { id: "float16", year: 2025, name: "Float16Array", test: () => fn("Float16Array") },
  { id: "base64", year: 0, name: "Uint8Array.fromBase64", test: () => stat("Uint8Array", "fromBase64") },
  { id: "is-error", year: 0, name: "Error.isError", test: () => stat("Error", "isError") },
  { id: "sum-precise", year: 0, name: "Math.sumPrecise", test: () => stat("Math", "sumPrecise") },
  { id: "from-async", year: 0, name: "Array.fromAsync", test: () => stat("Array", "fromAsync") },
  { id: "temporal", year: 0, name: "Temporal", test: () => typeof g().Temporal === "object" && g().Temporal !== null },
];

export function detectEs(list: readonly EsFeature[] = ES_FEATURES): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const f of list) {
    try {
      out[f.id] = f.test() === true;
    } catch {
      out[f.id] = false;
    }
  }
  return out;
}

/**
 * Highest ECMAScript edition whose features (and all earlier ones in the list)
 * are supported. Null when even the oldest checked edition is incomplete.
 */
export function esLevel(list: readonly EsFeature[], results: Record<string, boolean>): number | null {
  const years = [...new Set(list.filter((f) => f.year > 0).map((f) => f.year))].sort((a, b) => a - b);
  let level: number | null = null;
  for (const y of years) {
    if (list.filter((f) => f.year === y).every((f) => results[f.id])) level = y;
    else break;
  }
  return level;
}
