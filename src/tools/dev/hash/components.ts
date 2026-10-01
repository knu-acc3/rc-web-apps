import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "hash/tool": () => import("./HashTool"),
  "hash/multi": () => import("./MultiHash"),
  "hash/password": () => import("./PasswordHash"),
  "hash/checksum": () => import("./Checksum"),
};
