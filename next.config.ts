import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

function isIndexableDeployment(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  if (process.env.CONTEXT) return process.env.CONTEXT === "production";
  return process.env.NODE_ENV === "production";
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  agentRules: false,
  skipTrailingSlashRedirect: true,
  allowedDevOrigins: [
    "192.168.56.1",
    "192.168.31.183",
    "192.168.31.*",
    "192.168.0.*",
    "192.168.1.*",
    "10.0.0.*",
    "localhost",
  ],
  // Transform barrel imports into direct file imports — avoids parsing the
  // entire 2000+ icon barrel and improves build + cold-start performance.
  experimental: {
    globalNotFound: true,
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: [
      "@phosphor-icons/react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "framer-motion",
      "react-colorful",
      "pdfjs-dist",
      "fuse.js",
      "zod",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  async redirects() {
    return [
      {
        source: "/tools/qr-generator",
        destination: "/ru/tools/qr-code-gen",
        permanent: true,
      },
      {
        source: "/tools/barcode-generator",
        destination: "/ru/tools/barcode-gen",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/qr-generator",
        destination: "/:locale/tools/qr-code-gen",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/barcode-generator",
        destination: "/:locale/tools/barcode-gen",
        permanent: true,
      },
      // Heading Checker → Keyword Density (tool removed)
      {
        source: "/tools/heading-checker",
        destination: "/ru/tools/keyword-density",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/heading-checker",
        destination: "/:locale/tools/keyword-density",
        permanent: true,
      },
      // Old OG Preview → SEO Meta Tool
      {
        source: "/tools/og-preview",
        destination: "/ru/tools/seo-meta-tool",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/og-preview",
        destination: "/:locale/tools/seo-meta-tool",
        permanent: true,
      },
      // Old Meta Generator → SEO Meta Tool
      {
        source: "/tools/meta-generator",
        destination: "/ru/tools/seo-meta-tool",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/meta-generator",
        destination: "/:locale/tools/seo-meta-tool",
        permanent: true,
      },
      // ── Phase 1A: Randomizers merged into random-picker ──
      {
        source: "/tools/coin-flip",
        destination: "/ru/tools/random-picker",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/coin-flip",
        destination: "/:locale/tools/random-picker",
        permanent: true,
      },
      {
        source: "/tools/dice-roller",
        destination: "/ru/tools/random-picker",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/dice-roller",
        destination: "/:locale/tools/random-picker",
        permanent: true,
      },
      {
        source: "/tools/wheel-spinner",
        destination: "/ru/tools/random-picker",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/wheel-spinner",
        destination: "/:locale/tools/random-picker",
        permanent: true,
      },
      {
        source: "/tools/decision-maker",
        destination: "/ru/tools/random-picker",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/decision-maker",
        destination: "/:locale/tools/random-picker",
        permanent: true,
      },
      // ── Phase 2A: 10 symbol pages → symbol-catalog ──
      {
        source: "/tools/symbols-common",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-common",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-math",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-math",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-arrows",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-arrows",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-stars",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-stars",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-typography",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-typography",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-graphic",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-graphic",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-people",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-people",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-animals",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-animals",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-popular",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-popular",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/tools/symbols-language-currency",
        destination: "/ru/tools/symbol-catalog",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/symbols-language-currency",
        destination: "/:locale/tools/symbol-catalog",
        permanent: true,
      },
      // ── Phase 2B: pdf-to-jpg, pdf-to-png → pdf-to-image ──
      {
        source: "/tools/pdf-to-jpg",
        destination: "/ru/tools/pdf-to-image",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/pdf-to-jpg",
        destination: "/:locale/tools/pdf-to-image",
        permanent: true,
      },
      {
        source: "/tools/pdf-to-png",
        destination: "/ru/tools/pdf-to-image",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/pdf-to-png",
        destination: "/:locale/tools/pdf-to-image",
        permanent: true,
      },
      // ── Phase 2C: text-diff → diff-checker ──
      {
        source: "/tools/text-diff",
        destination: "/ru/tools/diff-checker",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/text-diff",
        destination: "/:locale/tools/diff-checker",
        permanent: true,
      },
      // ── Phase 2D: word-counter, reading-time, token-counter → text-analyzer ──
      {
        source: "/tools/word-counter",
        destination: "/ru/tools/text-analyzer",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/word-counter",
        destination: "/:locale/tools/text-analyzer",
        permanent: true,
      },
      {
        source: "/tools/reading-time",
        destination: "/ru/tools/text-analyzer",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/reading-time",
        destination: "/:locale/tools/text-analyzer",
        permanent: true,
      },
      {
        source: "/tools/token-counter",
        destination: "/ru/tools/text-analyzer",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/token-counter",
        destination: "/:locale/tools/text-analyzer",
        permanent: true,
      },
      // ── Phase 2E: remove-pages-pdf → split-pdf ──
      {
        source: "/tools/remove-pages-pdf",
        destination: "/ru/tools/split-pdf",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/remove-pages-pdf",
        destination: "/:locale/tools/split-pdf",
        permanent: true,
      },
      // ── Phase 2G: blur-image → image-filters ──
      {
        source: "/tools/blur-image",
        destination: "/ru/tools/image-filters",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/blur-image",
        destination: "/:locale/tools/image-filters",
        permanent: true,
      },
      // ── Phase 1B: tone-generator → noise-generator ──
      {
        source: "/tools/tone-generator",
        destination: "/ru/tools/noise-generator",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/tone-generator",
        destination: "/:locale/tools/noise-generator",
        permanent: true,
      },
      // ── Phase 3I: esign-pdf → pdf-studio ──
      {
        source: "/tools/esign-pdf",
        destination: "/ru/tools/pdf-studio",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/esign-pdf",
        destination: "/:locale/tools/pdf-studio",
        permanent: true,
      },
      // ── Phase 1F: health calculators → body-metrics ──
      {
        source: "/tools/bmi-calc",
        destination: "/ru/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/bmi-calc",
        destination: "/:locale/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/tools/bmi-calculator",
        destination: "/ru/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/bmi-calculator",
        destination: "/:locale/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/tools/ideal-weight",
        destination: "/ru/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/ideal-weight",
        destination: "/:locale/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/tools/body-fat",
        destination: "/ru/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/body-fat",
        destination: "/:locale/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/tools/calorie-calc",
        destination: "/ru/tools/body-metrics",
        permanent: true,
      },
      {
        source: "/:locale(ru|en)/tools/calorie-calc",
        destination: "/:locale/tools/body-metrics",
        permanent: true,
      },
    ];
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const isIndexable = isIndexableDeployment();
    const cspConnectSrc = isProd
      ? "'self' https: blob:"
      : "'self' https: http: ws: wss: blob:";
    const cspScriptSrc = isProd
      ? "'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://va.vercel-scripts.com https://mc.yandex.ru"
      : "'self' 'unsafe-eval' 'unsafe-inline' blob: https://va.vercel-scripts.com https://mc.yandex.ru";

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "0" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
          },
          ...(!isIndexable
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          ...(isProd
            ? [
                { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
                { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
              ]
            : []),
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src ${cspScriptSrc}; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https:; connect-src ${cspConnectSrc} https://mc.yandex.ru; frame-src 'self' https://mc.yandex.ru; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none';`,
          },
        ],
      },
      ...(isProd
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      {
        source: "/offline.html",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
