import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";

/** Tools of this group, in hub order. */
export const tools: ToolDef[] = [];

/** Component loaders of this group: "<section>/<name>": () => import("./<tool>/<Component>"). */
export const components: ComponentMap = {};
