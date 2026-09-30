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
}: {
  title: ReactNode;
  children: ReactNode;
  open?: boolean;
  className?: string;
  bodyClassName?: string;
  /** Short text on the right of the title (e.g. the current setting). */
  hint?: ReactNode;
}) {
  return (
    <details className={cn("fold", className)} open={open}>
      <summary>
        <span className="min-w-0">{title}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm font-normal text-fg-3">
          {hint && <span className="truncate">{hint}</span>}
          <ChevronDown className="fold-i size-4" aria-hidden />
        </span>
      </summary>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </details>
  );
}
