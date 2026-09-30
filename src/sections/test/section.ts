import { defineToolSection } from "@/registry/tool-section";
import { gamepadTool, keyboardTool, mouseTool, touchTool } from "./content/input";
import { microphoneTool, speakerTool, webcamTool } from "./content/media";
import { deadPixelTool, refreshRateTool } from "./content/screen";
import { clickSpeedTool, reactionTool, typingTool } from "./content/speed";

/**
 * Device tests. A navigation group only (no landing page): every test is a
 * top-level page, e.g. /microphone-test, /click-speed-test/5-seconds.
 */
export const testSection = defineToolSection({
  id: "test",
  name: { ru: "Тесты устройств", en: "Device tests" },
  description: {
    ru: "Проверка микрофона, камеры, динамиков, клавиатуры, мыши, экрана, тачскрина и геймпада, тесты скорости печати, кликов и реакции",
    en: "Check your microphone, webcam, speakers, keyboard, mouse, screen, touchscreen and gamepad; typing, click-speed and reaction tests",
  },
  icon: "MonitorSmartphone",
  hue: 180,
  category: "device",
  order: 1,
  tools: [
    microphoneTool,
    webcamTool,
    keyboardTool,
    clickSpeedTool,
    typingTool,
    deadPixelTool,
    speakerTool,
    mouseTool,
    refreshRateTool,
    reactionTool,
    touchTool,
    gamepadTool,
  ],
});
