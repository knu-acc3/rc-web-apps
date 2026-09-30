import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  CheckCircle,
  CircleNotch,
  Info,
  Tray,
  WarningCircle,
} from "@phosphor-icons/react";
import { cn } from "@/src/lib/cn";

export type ToolResultStatus =
  "idle" | "loading" | "success" | "error" | "empty";

export interface ToolResultProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  status?: ToolResultStatus;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  contentClassName?: string;
  framed?: boolean;
  showStatusIcon?: boolean;
}

const statusClasses: Record<ToolResultStatus, string> = {
  idle: "text-[var(--color-text-muted)]",
  loading: "text-[var(--color-primary)]",
  success: "text-[var(--color-success)]",
  error: "text-[var(--color-danger)]",
  empty: "text-[var(--color-text-subtle)]",
};

function ResultStatusIcon({ status }: { status: ToolResultStatus }) {
  const className = cn("h-5 w-5 shrink-0", statusClasses[status]);
  if (status === "loading") {
    return (
      <CircleNotch
        className={cn(className, "animate-spin")}
        aria-hidden="true"
      />
    );
  }
  if (status === "success") {
    return (
      <CheckCircle className={className} weight="fill" aria-hidden="true" />
    );
  }
  if (status === "error") {
    return (
      <WarningCircle className={className} weight="fill" aria-hidden="true" />
    );
  }
  if (status === "empty") {
    return <Tray className={className} aria-hidden="true" />;
  }
  return <Info className={className} aria-hidden="true" />;
}

/** Result region with calm hierarchy and accessible async/error announcements. */
export function ToolResult({
  status = "idle",
  title,
  description,
  actions,
  contentClassName,
  framed = false,
  showStatusIcon = true,
  className,
  children,
  ...props
}: ToolResultProps) {
  return (
    <section
      data-tool-result=""
      data-status={status}
      role={status === "error" ? "alert" : "status"}
      aria-live={status === "error" ? "assertive" : "polite"}
      aria-busy={status === "loading" || undefined}
      className={cn(
        "min-w-0 border-t border-[var(--color-border-subtle)] pt-5 sm:pt-6",
        framed &&
          "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/35 p-4 sm:p-5",
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-3 flex min-w-0 flex-wrap items-start gap-3">
          {showStatusIcon ? <ResultStatusIcon status={status} /> : null}
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="text-base font-bold leading-snug text-[var(--color-text)] sm:text-lg">
                {title}
              </h2>
            ) : null}
            {description ? (
              <div
                className={cn(
                  "mt-1 text-sm leading-relaxed",
                  status === "error"
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text-muted)]",
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex min-h-11 w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&_button]:min-h-11 [&_button]:min-w-11">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children ? (
        <div className={cn("min-w-0", contentClassName)}>{children}</div>
      ) : null}
    </section>
  );
}
