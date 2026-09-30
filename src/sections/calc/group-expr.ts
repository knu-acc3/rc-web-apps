import type { ToolDef } from "@/registry/types";
import type { ComponentMap } from "../types";
import { graphTool } from "./graph/def";
import { scientificTool } from "./scientific/def";

/** Expression-based tools, in hub order. */
export const tools: ToolDef[] = [scientificTool, graphTool];

export const components: ComponentMap = {
  "calc/scientific": () => import("./scientific/Scientific"),
  "calc/graph": () => import("./graph/Graph"),
};
