import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Collapsible block: secondary tool settings ("Настройки"), long explanations. Closed by default so the main
 * action and result stay the only things in focus. Native <details>: works without JavaScript.
 */
export function Fold({
  title,
  children,
  open,
  className,
  bodyClassName,
  hint,
  variant = "card",
}: {
  title: ReactNode;
  children: ReactNode;
  open?: boolean;
  className?: string;
  bodyClassName?: string;
  /** Short text on the right of the title (e.g. the current setting). */
  hint?: ReactNode;
  /** "card" — a block of its own; "inline" — a text button with a chevron that opens the content below it. */
  variant?: "card" | "inline";
}) {
  return (
    <details className={cn("fold", variant === "inline" && "fold-inline", className)} open={open}>
      <summary>
        {variant === "inline" && (
          <span className="fold-i" aria-hidden>
            <ChevronDown className="size-4" />
          </span>
        )}
        <span className="min-w-0">{title}</span>
        {variant === "card" && (
          <span className="flex min-w-0 items-center gap-2 text-sm font-normal text-fg-3">
            {hint && <span className="truncate">{hint}</span>}
            <span className="fold-i" aria-hidden>
              <ChevronDown className="size-4" />
            </span>
          </span>
        )}
      </summary>
      <div className={cn(variant === "inline" ? "pt-3" : "px-4 pb-4 pt-1 sm:px-5", bodyClassName)}>{children}</div>
    </details>
  );
}
