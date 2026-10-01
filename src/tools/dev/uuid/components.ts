import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "uuid/generator": () => import("./UuidGenerator"),
  "uuid/name": () => import("./NameUuid"),
  "uuid/nanoid": () => import("./NanoIdTool"),
  "uuid/nil": () => import("./NilUuid"),
  "uuid/decoder": () => import("./UuidDecoder"),
};
