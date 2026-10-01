"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A row of chips or tabs that may not fit: it scrolls sideways, the edge that hides more items fades out, and round
 * ‹ › buttons appear on that side (mouse and touch alike). The mouse wheel scrolls it sideways while it can move.
 * The current item (`aria-current`, `aria-selected`, `aria-checked`) is scrolled into view on mount.
 */
export function ScrollRow({
  children,
  className,
  rowClassName,
  label,
  role,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Classes of the scrolling row itself (gap, padding). */
  rowClassName?: string;
  label?: string;
  /** ARIA role of the row itself (e.g. "tablist"): its children are the items. */
  role?: string;
  as?: "div" | "nav";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const start = el.scrollLeft <= 2;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
    };
    const cur = el.querySelector<HTMLElement>('[aria-current="page"],[aria-current="true"],[aria-selected="true"],[aria-checked="true"]');
    if (cur && el.scrollWidth > el.clientWidth) {
      const left = cur.offsetLeft - el.offsetLeft;
      if (left + cur.offsetWidth > el.clientWidth) el.scrollLeft = left - el.clientWidth / 2 + cur.offsetWidth / 2;
    }
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    ro?.observe(el);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) return;
      const canLeft = el.scrollLeft > 0;
      const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      if ((e.deltaY < 0 && canLeft) || (e.deltaY > 0 && canRight)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("scroll", sync);
      el.removeEventListener("wheel", onWheel);
      ro?.disconnect();
    };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: "smooth" });
  };
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={() => go(dir)}
      className={cn(
        "btn btn-elevated btn-round absolute top-1/2 z-10 size-8 -translate-y-1/2 [&_svg]:size-4",
        dir < 0 ? "left-0" : "right-0",
        (dir < 0 ? edges.start : edges.end) && "pointer-events-none opacity-0",
      )}
    >
      {dir < 0 ? <ChevronLeft /> : <ChevronRight />}
    </button>
  );

  return (
    <As aria-label={role ? undefined : label} className={cn("relative min-w-0", className)}>
      <div ref={ref} role={role} aria-label={role ? label : undefined} data-start={edges.start ? "1" : "0"} data-end={edges.end ? "1" : "0"} className={cn("scroll-row flex items-center gap-2 py-1", rowClassName)}>
        {children}
      </div>
      {arrow(-1)}
      {arrow(1)}
    </As>
  );
}
