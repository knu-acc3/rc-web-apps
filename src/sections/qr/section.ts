import { defineToolSection } from "@/registry/tool-section";

export const qrSection = defineToolSection({
  id: "qr",
  name: { ru: "QR-коды и штрихкоды", en: "QR codes & barcodes" },
  description: {
    ru: "Создание и сканирование QR-кодов и штрихкодов прямо в браузере, без регистрации",
    en: "Create and scan QR codes and barcodes right in your browser, no sign-up",
  },
  icon: "QrCode",
  hue: 0,
  category: "web",
  order: 2,
  tools: [],
});
