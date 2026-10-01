import type { NextConfig } from "next";

/**
 * Content Security Policy: pages may load code, styles, images and data only from this site. There is no way
 * for a page to send what you type or open to another server: `connect-src`, `form-action` and `img-src`
 * don't allow other origins. `unsafe-inline` is needed for Next's inline bootstrap scripts (pages are static,
 * so per-request nonces aren't possible); `wasm-unsafe-eval` for the WebAssembly codecs; `blob:` for workers
 * and generated files.
 */
const CSP = [
  "default-src 'self'",
  // React's development build needs eval() for its debugging features; production never does.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob: mediastream:",
  "connect-src 'self' data: blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(self), microphone=(self), display-capture=(self), payment=(), usb=(), serial=(), hid=(), bluetooth=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    globalNotFound: true,
    // Pages rendered on first request stay in memory only; the build output on disk never grows.
    isrFlushToDisk: false,
  },
  images: { unoptimized: true },
  async redirects() {
    return [{ source: "/", destination: "/ru", permanent: true }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/vendor/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/legacy.css", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      // The service worker must be re-checked on every visit so a new version reaches people at once.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default nextConfig;
