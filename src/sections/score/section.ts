import { defineToolSection } from "@/registry/tool-section";
import { counterTool, scoreboardTool } from "./content";

/** Keeping score: a two-team scoreboard (with sport presets) and a tally counter. Tools live at /scoreboard, /counter. */
export const scoreSection = defineToolSection({
  id: "score",
  name: { ru: "Счёт", en: "Score" },
  description: {
    ru: "Табло для счёта игры на весь экран, счётчик нажатий, подсчёт голосов и посетителей, электронные чётки",
    en: "A full-screen scoreboard, a tally counter, vote and people counters and digital prayer beads",
  },
  icon: "Trophy",
  hue: 25,
  category: "random",
  order: 2,
  tools: [scoreboardTool, counterTool],
});
