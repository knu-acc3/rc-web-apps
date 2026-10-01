import { defineToolSection } from "@/registry/tool-section";
import { generatorTools } from "./content/generators";
import { mediaTools } from "./content/media-tools";

export const audioSection = defineToolSection({
  id: "audio",
  name: { ru: "Аудио", en: "Audio" },
  description: {
    ru: "Конвертация и обрезка аудио, диктофон и генераторы звука",
    en: "Convert and trim audio, voice recorder and sound generators",
  },
  icon: "AudioLines",
  hue: 320,
  category: "files",
  order: 4,
  tools: [...mediaTools, ...generatorTools],
});
