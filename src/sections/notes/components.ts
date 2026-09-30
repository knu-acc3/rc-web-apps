import type { ComponentMap } from "../types";

export const components: ComponentMap = {
  "notes/notepad": () => import("./Notepad"),
  "notes/todo": () => import("./TodoList"),
};
