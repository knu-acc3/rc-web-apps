import { defineToolSection } from "@/registry/tool-section";

export const passwordSection = defineToolSection({
  id: "password",
  name: { ru: "Пароли", en: "Passwords" },
  description: {
    ru: "Генератор надёжных паролей, парольных фраз и PIN, проверка надёжности",
    en: "Strong password, passphrase and PIN generator, strength checker",
  },
  icon: "Lock",
  hue: 120,
  category: "web",
  order: 1,
  tools: [],
});
