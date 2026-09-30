import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "numbers/roman": () => import("./RomanConverter"),
  "numbers/in-words": () => import("./NumberInWords"),
  "numbers/amount-in-words": () => import("./AmountInWords"),
  "numbers/base-converter": () => import("./BaseConverter"),
  "numbers/scientific-notation": () => import("./ScientificNotation"),
};
