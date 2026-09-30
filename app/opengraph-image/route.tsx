import { ImageResponse } from "next/og";
import { siteConfig } from "@/src/config/site.config";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #262B31 0%, #1B1F24 50%, #E83322 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 80,
          fontWeight: 700,
          color: "white",
          marginBottom: 24,
          letterSpacing: "-2px",
        }}
      >
        {siteConfig.brandName}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          color: "rgba(255,255,255,0.85)",
          marginBottom: 16,
        }}
      >
        3 000+ Online Tools & Catalogs
      </div>
      <div
        style={{
          display: "flex",
          gap: "32px",
          marginTop: 32,
          fontSize: 22,
          color: "rgba(255,255,255,0.65)",
        }}
      >
        <span>Tools</span>
        <span>·</span>
        <span>World Time</span>
        <span>·</span>
        <span>1:1 Scale</span>
        <span>·</span>
        <span>Emojis</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 40,
          fontSize: 18,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {siteConfig.domain} — Free · Works in Browser
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
