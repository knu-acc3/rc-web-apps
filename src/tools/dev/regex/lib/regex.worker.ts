import { serve } from "@/tools/dev/shared/worker-host";
import { findAll, replace } from "./engine";

serve({
  match(p: { pattern: string; flags: string; text: string; cap: number }) {
    return findAll(p.pattern, p.flags, p.text, p.cap);
  },
  replace(p: { pattern: string; flags: string; text: string; replacement: string }) {
    return replace(p.pattern, p.flags, p.text, p.replacement);
  },
});
