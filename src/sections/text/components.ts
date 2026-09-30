import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "text/word-counter": () => import("./WordCounter"),
  "text/case": () => import("./CaseConverter"),
  "text/dedupe": () => import("./RemoveDuplicates"),
  "text/sort": () => import("./SortLines"),
  "text/reverse": () => import("./ReverseText"),
  "text/replace": () => import("./FindReplace"),
  "text/clean": () => import("./TextCleaner"),
  "text/typograph": () => import("./Typograph"),
  "text/layout": () => import("./LayoutFixer"),
  "text/translit": () => import("./Transliteration"),
  "text/compare": () => import("./TextCompare"),
  "text/lorem": () => import("./LoremGenerator"),
  "text/tts": () => import("./TextToSpeech"),
  "text/extract": () => import("./Extractor"),
  "text/markdown": () => import("./MarkdownEditor"),
  "text/lines": () => import("./LineTools"),
  "text/frequency": () => import("./WordFrequency"),
  "text/repeat": () => import("./RepeatText"),
};
