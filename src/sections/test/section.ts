import { defineToolSection } from "@/registry/tool-section";

export const testSection = defineToolSection({
  id: "test",
  name: { ru: "Тесты устройств", en: "Device tests" },
  description: {
    ru: "Проверка микрофона, камеры, клавиатуры, мыши, экрана и динамиков",
    en: "Test your microphone, webcam, keyboard, mouse, screen and speakers",
  },
  icon: "MonitorSmartphone",
  hue: 180,
  category: "device",
  order: 1,
  tools: [],
});
