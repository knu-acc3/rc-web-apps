import { defineToolSection } from "@/registry/tool-section";

export const encodeSection = defineToolSection({
  id: "encode",
  name: { ru: "Кодирование", en: "Encoding" },
  description: {
    ru: "Base64, URL, HTML-сущности, двоичный код, азбука Морзе и другие кодировки",
    en: "Base64, URL, HTML entities, binary, Morse code and other encodings",
  },
  icon: "Binary",
  hue: 190,
  category: "dev",
  order: 5,
  tools: [],
});
