import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "regex/tester": () => import("./RegexTester"),
};
