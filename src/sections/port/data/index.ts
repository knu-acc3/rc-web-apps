import { PORTS_HIGH } from "./ports-high";
import { PORTS_REGISTERED } from "./ports-registered";
import { PORTS_SYSTEM } from "./ports-system";
import type { PortDef } from "./types";

export const PORTS: PortDef[] = [...PORTS_SYSTEM, ...PORTS_REGISTERED, ...PORTS_HIGH].sort((a, b) => a.port - b.port);
export const PORT_BY_NUM = new Map(PORTS.map((p) => [p.port, p]));

export type RangeKind = "system" | "registered" | "dynamic";
/** RFC 6335 port ranges. */
export function rangeOf(port: number): RangeKind {
  if (port <= 1023) return "system";
  if (port <= 49151) return "registered";
  return "dynamic";
}

export type { PortDef };
