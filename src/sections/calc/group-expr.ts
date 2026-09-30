import type { ToolDef } from "@/registry/types";
import { graphTool } from "./graph/def";
import { scientificTool } from "./scientific/def";

/** Expression-based tools, in hub order. */
export const tools: ToolDef[] = [scientificTool, graphTool];
