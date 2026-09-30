import type { Locale } from "@/i18n/config";
import { COMPONENTS } from "@/sections/components";
import type { ToolMount as ToolMountDef } from "@/registry/types";

/**
 * Server component that renders a tool's client component. Only the chunk of
 * the rendered tool is sent to the browser.
 */
export async function ToolMount({ tool, locale }: { tool: ToolMountDef; locale: Locale }) {
  const load = COMPONENTS[tool.id];
  if (!load) throw new Error(`Unknown tool component: ${tool.id}`);
  const { default: Component } = await load();
  return <Component locale={locale} {...(tool.props ?? {})} />;
}
