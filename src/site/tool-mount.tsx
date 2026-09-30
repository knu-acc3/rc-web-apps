import type { Locale } from "@/i18n/config";
import type { ToolMount as ToolMountDef } from "@/registry/types";
import { ToolClient } from "./tool-client";

/** Renders a tool's client component (see ToolClient for how its code is split). */
export function ToolMount({ tool, locale }: { tool: ToolMountDef; locale: Locale }) {
  return <ToolClient id={tool.id} locale={locale} props={tool.props} />;
}
