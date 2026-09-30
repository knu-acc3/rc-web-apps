"use client";

import { lazy, Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { COMPONENTS } from "@/sections/components";

/* One lazy wrapper per tool, created once: each tool stays behind its own dynamic import. */
const LAZY = Object.fromEntries(Object.entries(COMPONENTS).map(([id, load]) => [id, lazy(load)]));

/**
 * Client boundary for tool components. A page loads only the chunk of the tool it shows;
 * the server still renders the tool into the HTML.
 */
export function ToolClient({ id, locale, props }: { id: string; locale: Locale; props?: Record<string, unknown> }) {
  const Component = LAZY[id];
  if (!Component) throw new Error(`Unknown tool component: ${id}`);
  return (
    <Suspense fallback={null}>
      <Component locale={locale} {...(props ?? {})} />
    </Suspense>
  );
}
