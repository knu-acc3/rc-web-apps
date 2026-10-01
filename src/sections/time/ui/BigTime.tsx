import { cn } from "@/lib/cn";
import { pad2, type ZonedParts } from "../lib/tz";

/**
 * Large clock digits. `parts` is null before hydration → a neutral placeholder
 * (the server never renders a guessed current time). Not a live region: screen
 * readers are not spammed every second.
 */
export function BigTime({ parts, seconds = true, h12 = false, className }: { parts: ZonedParts | null; seconds?: boolean; h12?: boolean; className?: string }) {
  let hh = "--";
  let mm = "--";
  let ss = "--";
  let ampm = "";
  if (parts) {
    let h = parts.h;
    if (h12) {
      ampm = h < 12 ? "AM" : "PM";
      h = h % 12 || 12;
    }
    hh = h12 ? String(h) : pad2(h);
    mm = pad2(parts.mi);
    ss = pad2(parts.s);
  }
  return (
    <div className={cn("tabular font-semibold leading-none tracking-tight text-fg", className)}>
      <span>
        {hh}:{mm}
      </span>
      {seconds && <span className="text-fg-3">:{ss}</span>}
      {ampm && <span className="ml-[0.2em] align-top text-[0.35em] font-medium text-fg-2">{ampm}</span>}
    </div>
  );
}
