import { defineToolSection } from "@/registry/tool-section";
import { COLOR_TOOLS } from "./content/colors";
import { burnInTool, flashingLightTool, mirrorTool, monitorTestTool, stuckPixelTool } from "./content/tools";

/**
 * Screen tools: full-screen colours (white, black, red… screen), flashing light, an online mirror and monitor tests.
 * A navigation group only: every tool is a top-level page (/white-screen, /monitor-test/gamma).
 */
export const screenSection = defineToolSection({
  id: "screen",
  name: { ru: "Экран", en: "Screen" },
  description: {
    ru: "Белый и цветной экран на весь экран, мигающий свет, зеркало через камеру, тест монитора, выгорания и исправление застрявших пикселей",
    en: "Full-screen white and colour screens, flashing light, a camera mirror, monitor and burn-in tests and a stuck pixel fixer",
  },
  icon: "MonitorPlay",
  hue: 45,
  category: "device",
  order: 1.5,
  tools: [COLOR_TOOLS[0], COLOR_TOOLS[1], monitorTestTool, mirrorTool, flashingLightTool, stuckPixelTool, burnInTool, ...COLOR_TOOLS.slice(2)],
});
