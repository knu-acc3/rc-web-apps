import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "kaomoji/picker": () => import("./KaomojiPicker"),
};
