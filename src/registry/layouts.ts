import type { PageLayout, PageModel } from "./types";

/**
 * Page layout by task type — pages don't all look the same:
 *  - file:      file in → result out (PDF, images, media): centred title, big drop area
 *  - screen:    a big display (timers, clocks, device tests): compact title, wide tool
 *  - reference: look something up (emoji, symbols, codes): title band, content grid below
 *  - compute:   input → answer (calculators, converters, text, developer tools)
 */
const BY_SECTION: Record<string, PageLayout> = {
  pdf: "file",
  image: "file",
  video: "file",
  audio: "file",
  file: "file",
  timer: "screen",
  countdown: "screen",
  time: "screen",
  test: "screen",
  "actual-size": "screen",
  emoji: "reference",
  symbols: "reference",
  kaomoji: "reference",
  "http-status": "reference",
  mime: "reference",
  port: "reference",
};

export function layoutOf(page: PageModel): PageLayout {
  if (page.layout) return page.layout;
  if (page.kind === "hub" || page.kind === "static") return "reference";
  return BY_SECTION[page.sectionId] ?? "compute";
}

/** Tools where people type personal data: show a concrete "nothing leaves your browser" note. */
const SENSITIVE = new Set([
  "credit-card-validator",
  "bin",
  "iban-validator",
  "iin-validator",
  "inn-validator",
  "snils-validator",
  "ogrn-validator",
  "ogrnip",
  "password-generator",
  "password-strength-checker",
  "jwt-decoder",
  "jwt-encoder",
  "hash-generator",
  "file-checksum",
  "notes",
  "todo-list",
  "packing-list",
]);

export function isSensitive(page: PageModel): boolean {
  return SENSITIVE.has(page.path[0]) || layoutOf(page) === "file";
}
