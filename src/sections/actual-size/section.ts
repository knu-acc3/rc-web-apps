import { defineToolSection } from "@/registry/tool-section";

export const actualSizeSection = defineToolSection({
  id: "actual-size",
  name: { ru: "Реальный размер", en: "Actual size" },
  description: {
    ru: "Онлайн-линейка и предметы в натуральную величину на экране после калибровки",
    en: "Online ruler and everyday objects shown at actual size after a quick calibration",
  },
  icon: "Ruler",
  hue: 60,
  category: "convert",
  order: 4,
  tools: [],
});
