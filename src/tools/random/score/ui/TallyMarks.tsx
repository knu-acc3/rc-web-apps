"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { tallyGroups } from "../lib/score";

/** Four upright strokes and the fifth across them, in a 48 × 52 box. */
const XS = [8, 18, 28, 38];

/** Small fixed wobble so the marks look hand-drawn but never change between renders. */
const wob = (i: number, k: number) => ((((i + 1) * k) % 5) - 2) * 0.55;

function strokePath(i: number, inGroup: number): string {
  if (inGroup === 4) return `M${2 + wob(i, 3)} ${41 + wob(i, 7)}L${46 + wob(i, 5)} ${13 + wob(i, 11)}`;
  const x = XS[inGroup];
  return `M${x + wob(i, 7)} ${5 + Math.abs(wob(i, 3))}L${x + wob(i, 13)} ${47 - Math.abs(wob(i, 11))}`;
}

/** Height of one group: fewer marks are drawn bigger; `cqw` keeps them inside the box, `vmin` inside the screen. */
function groupHeight(groups: number, size: "md" | "full"): string {
  const steps: [number, string, string][] = [
    [2, "min(7rem,26cqw)", "min(34vmin,40vw)"],
    [4, "min(5.5rem,20cqw)", "min(24vmin,21vw)"],
    [8, "min(4.5rem,15cqw)", "min(18vmin,14vw)"],
    [20, "min(3.25rem,11cqw)", "min(12vmin,9vw)"],
    [50, "min(2.5rem,8cqw)", "min(8vmin,6vw)"],
  ];
  const hit = steps.find(([max]) => groups <= max);
  if (hit) return size === "md" ? hit[1] : hit[2];
  return size === "md" ? "min(1.75rem,6cqw)" : "min(5.5vmin,4vw)";
}

/**
 * Tally marks: groups of four strokes crossed by a fifth, a gap between groups, rows that wrap. The strokes added
 * since the last render draw themselves in (only when motion is allowed). `size`: "sm" — small fixed marks for a
 * list row, "md" — fills the box (fewer marks are bigger), "full" — the same for a full-screen view.
 */
export function TallyMarks({ count, size = "md", label, className }: { count: number; size?: "sm" | "md" | "full"; label: string; className?: string }) {
  const groups = tallyGroups(count);
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(count);

  useEffect(() => {
    const was = prev.current;
    prev.current = count;
    const root = ref.current;
    if (!root || count <= was || count - was > 25) return;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = was; i < count; i++) {
        const el = root.querySelector<SVGPathElement>(`[data-i="${i}"]`);
        el?.animate?.([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 240, delay: (i - was) * 45, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" });
      }
    } catch {
      // animations unavailable: the marks are simply there
    }
  }, [count]);

  const h = size === "sm" ? "1.25rem" : groupHeight(groups.length, size);
  const style = { ["--h" as string]: h, columnGap: "calc(var(--h) * 0.32)", rowGap: "calc(var(--h) * 0.26)" } as CSSProperties;
  const sw = size === "sm" ? 5 : 4;

  return (
    <div className={cn(size === "md" && "@container", "w-full", className)}>
      <div ref={ref} role="img" aria-label={label} className={cn("flex flex-wrap items-center", size === "sm" ? "justify-start" : "justify-center")} style={style}>
        {groups.length === 0 ? (
          <svg viewBox="0 0 48 52" className="h-(--h) w-[calc(var(--h)*0.923)] opacity-15" aria-hidden>
            <path d={strokePath(0, 1)} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" fill="none" />
          </svg>
        ) : (
          groups.map((n, g) => (
            <svg key={g} viewBox="0 0 48 52" className="h-(--h) w-[calc(var(--h)*0.923)] shrink-0 overflow-visible" aria-hidden>
              {Array.from({ length: n }, (_, k) => {
                const i = g * 5 + k;
                return (
                  <path
                    key={k}
                    data-i={i}
                    d={strokePath(i, k)}
                    pathLength={1}
                    strokeDasharray={1}
                    stroke={k === 4 ? "var(--tally-cross, currentColor)" : "currentColor"}
                    strokeWidth={sw}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
            </svg>
          ))
        )}
      </div>
    </div>
  );
}
