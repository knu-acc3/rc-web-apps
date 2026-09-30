import { defineToolSection } from "@/registry/tool-section";
import { cpu, gpu, memory } from "./content/hardware";
import { dpi, screenResolution, viewport } from "./content/display";
import { language, timezone } from "./content/locale";
import { bitness, browser, device, os, userAgent } from "./content/system";
import { browserFeatures, cookies, doNotTrack, javascript, systemInfo } from "./content/web";

/**
 * "What is my…" — browser-only detection of the browser, OS, screen and device.
 * Navigation group only (no landing page): every tool is a top-level page named by its query.
 * Nothing here makes network requests, so there are no IP-address tools.
 */
export const whatIsMySection = defineToolSection({
  id: "what-is-my",
  name: { ru: "Что у меня", en: "What is my…" },
  description: {
    ru: "Браузер, система, разрешение экрана, часовой пояс и другие параметры устройства — определяются прямо в браузере",
    en: "Your browser, OS, screen resolution, time zone and other device details — detected right in your browser",
  },
  icon: "Info",
  hue: 210,
  category: "device",
  order: 2,
  // Order matters: sibling links under each tool follow it.
  tools: [browser, screenResolution, os, userAgent, timezone, bitness, device, viewport, gpu, cpu, memory, dpi, language, javascript, cookies, browserFeatures, doNotTrack, systemInfo],
});
