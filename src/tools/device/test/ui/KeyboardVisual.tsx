"use client";

import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { KEYBOARD, KEYBOARD_HEIGHT, KEYBOARD_WIDTH } from "../lib/keyboard-layout";

export type LabelMode = "both" | "en" | "ru";

const U0 = 42; // px per key unit before the width is known (server render)
const U_MIN = 34; // narrower screens scroll the keyboard sideways inside its box
const U_MAX = 66;

/** Pixels per key unit: the keyboard fills the width of its box (within limits), so it grows on wide screens. */
function useUnit() {
  const ref = useRef<HTMLDivElement>(null);
  const [u, setU] = useState(U0);
  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box || typeof ResizeObserver === "undefined") return;
    const fit = () => {
      const cs = getComputedStyle(box);
      const w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      setU(Math.max(U_MIN, Math.min(U_MAX, Math.floor(w / KEYBOARD_WIDTH))));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);
  return [ref, u] as const;
}

/** Full-size keyboard; keys light up when held (accent) and once tested (green). */
export const KeyboardVisual = memo(function KeyboardVisual({ down, ever, labels }: { down: ReadonlySet<string>; ever: ReadonlySet<string>; labels: LabelMode }) {
  const [ref, U] = useUnit();
  const GAP = Math.round(U / 10);
  return (
    <div ref={ref} className="relative mx-auto" style={{ width: KEYBOARD_WIDTH * U, height: KEYBOARD_HEIGHT * U, fontSize: U / 3 }}>
      {KEYBOARD.map((k) => {
        const isDown = down.has(k.code);
        const tested = ever.has(k.code);
        const hasRu = !!k.ru && k.ru !== k.en.toUpperCase();
        return (
          <div
            key={k.code}
            data-code={k.code}
            className={cn(
              "absolute flex rounded-[0.5rem] leading-none transition-[background-color,color,transform,box-shadow] duration-75 select-none",
              isDown ? "translate-y-px bg-accent text-accent-fg shadow-none" : tested ? "bg-ok-soft text-ok shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]" : "bg-surface-2 text-fg-2 shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]",
              k.named ? "text-[0.72em]" : "text-[1em] font-medium",
            )}
            style={{ left: k.x * U, top: k.y * U, width: k.w * U - GAP, height: k.h * U - GAP }}
          >
            {labels === "both" && hasRu ? (
              <>
                <span className="absolute top-[0.35em] left-[0.4em]">{k.en}</span>
                <span className="absolute right-[0.4em] bottom-[0.35em] opacity-80">{k.ru}</span>
              </>
            ) : (
              <span className="m-auto px-1 text-center">{labels === "ru" && k.ru ? k.ru : k.en}</span>
            )}
          </div>
        );
      })}
    </div>
  );
});
