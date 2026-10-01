"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/ui/button";

/**
 * The big round start/stop button of players, generators and recorders (Material FAB): accent while idle, red with a
 * soft pulsing halo while running. The caption under it repeats the action in words.
 */
export function Fab({
  label,
  icon,
  onClick,
  active = false,
  disabled,
  caption,
  className,
}: {
  /** Accessible name and tooltip: what pressing it does ("Воспроизвести", "Остановить"). */
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** Running: drawn red with a halo. */
  active?: boolean;
  disabled?: boolean;
  /** Visible text under the button (default: the label). */
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5", className)}>
      <span className="relative inline-flex">
        {active && <span aria-hidden className="pointer-events-none absolute -inset-2.5 rounded-full bg-err-soft motion-safe:animate-pulse" />}
        <Button
          variant="filled"
          size="icon-lg"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          title={label}
          className={cn("size-20! shadow-elev-2 sm:size-24! [&_svg]:size-9! sm:[&_svg]:size-10!", active && "bg-err! text-surface!")}
        >
          {icon}
        </Button>
      </span>
      <span aria-hidden className="text-center text-[0.9375rem] font-semibold text-fg">
        {caption ?? label}
      </span>
    </div>
  );
}
