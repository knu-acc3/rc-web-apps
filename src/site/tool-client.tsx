"use client";

import type { Locale } from "@/i18n/config";
import { TOOL_COMPONENTS } from "@/tools/tool-components";

/**
 * Client boundary for tool components. Each tool is its own next/dynamic chunk: a page loads only
 * the tool it shows, the chunk is preloaded from the HTML, and the server renders the tool.
 */
export function ToolClient({ id, locale, props }: { id: string; locale: Locale; props?: Record<string, unknown> }) {
  const Component = TOOL_COMPONENTS[id];
  if (!Component) throw new Error(`Unknown tool component: ${id}`);
  return <Component locale={locale} {...(props ?? {})} />;
}
