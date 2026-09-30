import { ImageResponse } from "next/og";
import { getToolBySlug, toolGroups } from "@/src/data/tools";
import { getGroupName, getToolName } from "@/src/data/toolLocalization";
import {
  type Locale,
  isLocale,
  DEFAULT_LOCALE,
} from "@/src/i18n/index";
import { siteConfig } from "@/src/config/site.config";

const size = { width: 1200, height: 630 };

const SLOGANS: Record<Locale, string> = {
  ru: "Бесплатно, в браузере, без установки и регистрации",
  en: "Free, browser-based, no install required",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> },
) {
  const { locale, slug } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const tool = getToolBySlug(slug);
  const group = toolGroups.find((item) => item.id === tool?.groupId);
  const brandTitle = siteConfig.brandName;
  const brandInitial = (brandTitle || "U").charAt(0).toUpperCase();
  const title = tool ? getToolName(tool, safeLocale) : brandTitle;
  const subtitle = SLOGANS[safeLocale] ?? SLOGANS.en;
  const groupName = group
    ? getGroupName(group, safeLocale)
    : (safeLocale === "ru" ? "Онлайн-инструменты" : "Online tools");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "#eef0f4",
        color: "#08090c",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: "#08090c",
            color: "#eef0f4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 800,
          }}
        >
          {brandInitial}
        </div>
        <div style={{ fontSize: 34, fontWeight: 800 }}>{brandTitle}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            alignSelf: "flex-start",
            border: "2px solid #c9ced8",
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          {groupName}
        </div>
        <div
          style={{
            maxWidth: 920,
            fontSize: 72,
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ fontSize: 26, color: "#4b5563" }}>
        {subtitle}
      </div>
    </div>,
    size,
  );
}
