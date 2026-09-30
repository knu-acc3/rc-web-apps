import type { ComponentType } from "react";
import type { Locale } from "@/i18n/config";

/** Every tool component receives the locale plus its preset props. */
export type ToolProps<P = object> = { locale: Locale } & P;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolLoader = () => Promise<{ default: ComponentType<any> }>;
export type ComponentMap = Record<string, ToolLoader>;
