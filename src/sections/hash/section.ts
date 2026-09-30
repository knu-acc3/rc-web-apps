import { defineToolSection } from "@/registry/tool-section";

export const hashSection = defineToolSection({
  id: "hash",
  name: { ru: "Хэши", en: "Hashes" },
  description: {
    ru: "MD5, SHA-256, SHA-3, CRC32, HMAC, bcrypt — для текста и файлов",
    en: "MD5, SHA-256, SHA-3, CRC32, HMAC, bcrypt — for text and files",
  },
  icon: "Fingerprint",
  hue: 280,
  category: "dev",
  order: 6,
  tools: [],
});
