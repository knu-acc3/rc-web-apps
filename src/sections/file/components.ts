import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "file/zip": () => import("./CreateZip"),
  "file/unzip": () => import("./Unzip"),
  "file/info": () => import("./FileTypeChecker"),
  "file/rename": () => import("./BatchRename"),
  "file/split": () => import("./SplitFile"),
  "file/join": () => import("./JoinFiles"),
  "file/base64": () => import("./FileBase64"),
  "file/encrypt": () => import("./EncryptFile"),
};
