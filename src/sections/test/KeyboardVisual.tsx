"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import { KEYBOARD, KEYBOARD_HEIGHT, KEYBOARD_WIDTH } from "./lib/keyboard-layout";

export type LabelMode = "both" | "en" | "ru";

const U = 42; // px per key unit
const GAP = 4;

/** Full-size keyboard; keys light up when held (accent) and once tested (green). */
export const KeyboardVisual = memo(function KeyboardVisual({
  down,
  ever,
  labels,
}: {
  down: ReadonlySet<string>;
  ever: ReadonlySet<string>;
  labels: LabelMode;
}) {
  return (
    <div className="relative mx-auto" style={{ width: KEYBOARD_WIDTH * U, height: KEYBOARD_HEIGHT * U }}>
      {KEYBOARD.map((k) => {
        const isDown = down.has(k.code);
        const tested = ever.has(k.code);
        const hasRu = !!k.ru && k.ru !== k.en.toUpperCase();
        return (
          <div
            key={k.code}
            data-code={k.code}
            className={cn(
              "absolute flex select-none rounded-[0.375rem] border leading-none transition-colors duration-75",
              isDown
                ? "border-accent bg-accent text-accent-fg"
                : tested
                  ? "border-ok/50 bg-ok-soft text-ok"
                  : "border-line-strong/70 bg-surface text-fg-2",
              k.named ? "text-[0.6875rem]" : "text-sm font-medium",
            )}
            style={{ left: k.x * U, top: k.y * U, width: k.w * U - GAP, height: k.h * U - GAP }}
          >
            {labels === "both" && hasRu ? (
              <>
                <span className="absolute left-1.5 top-1.5">{k.en}</span>
                <span className="absolute bottom-1.5 right-1.5 opacity-80">{k.ru}</span>
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
