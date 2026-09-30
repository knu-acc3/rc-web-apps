import { defineToolSection } from "@/registry/tool-section";

export const seoSection = defineToolSection({
  id: "seo",
  name: { ru: "SEO-инструменты", en: "SEO tools" },
  description: {
    ru: "Мета-теги, robots.txt, sitemap, UTM и превью сниппета",
    en: "Meta tags, robots.txt, sitemap, UTM and snippet preview",
  },
  icon: "Search",
  hue: 100,
  category: "web",
  order: 5,
  tools: [],
});
