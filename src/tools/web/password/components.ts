import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "password/generator": () => import("./PasswordGenerator"),
  "password/strength": () => import("./StrengthChecker"),
};
