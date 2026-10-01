import { defineToolSection } from "@/registry/tool-section";
import { caseConverter } from "./content/case";
import { findAndReplace, removeExtraSpaces, removeHtmlTags, removeInvisibleCharacters, removeLineBreaks, textCleaner, typographTool } from "./content/clean";
import { wordCounter } from "./content/counter";
import {
  addLineNumbers,
  addPrefixSuffix,
  joinLinesTool,
  removeDuplicateLines,
  removeEmptyLines,
  repeatTextTool,
  reverseTextTool,
  sortLinesTool,
  splitText,
  wordFrequencyTool,
} from "./content/lines";
import { emailExtractor, loremIpsum, markdownEditor, numberExtractor, phoneNumberExtractor, textCompare, textToSpeech, urlExtractor } from "./content/misc";
import { keyboardLayoutConverter, transliterationTool } from "./content/translit";

/**
 * Text tools. A navigation group without a landing page ("Текст" is not a search query):
 * every tool lives at its own top-level URL (/word-counter, /case-converter, …).
 */
export const textSection = defineToolSection({
  id: "text",
  name: { ru: "Текст", en: "Text tools" },
  description: {
    ru: "Счётчик символов, регистр, очистка, сортировка, сравнение и транслитерация текста",
    en: "Word counter, case converter, cleaner, sorter, diff and transliteration",
  },
  icon: "Type",
  hue: 160,
  category: "text",
  order: 1,
  tools: [
    wordCounter,
    caseConverter,
    transliterationTool,
    keyboardLayoutConverter,
    removeDuplicateLines,
    sortLinesTool,
    textCompare,
    findAndReplace,
    textCleaner,
    removeLineBreaks,
    removeExtraSpaces,
    removeEmptyLines,
    removeInvisibleCharacters,
    removeHtmlTags,
    typographTool,
    loremIpsum,
    textToSpeech,
    markdownEditor,
    wordFrequencyTool,
    reverseTextTool,
    addLineNumbers,
    addPrefixSuffix,
    joinLinesTool,
    splitText,
    repeatTextTool,
    emailExtractor,
    urlExtractor,
    phoneNumberExtractor,
    numberExtractor,
  ],
});
