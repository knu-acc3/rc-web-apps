import type { ComponentMap } from "../../types";

export const components: ComponentMap = {
  "mime/search": () => import("./MimeSearch"),
  "mime/serve": () => import("./MimeServe"),
  "mime/detect": () => import("./MimeDetect"),
};
