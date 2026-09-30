import * as React from "react";
import { CircleNotch } from "@phosphor-icons/react";
import { Button, type ButtonProps } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";

export interface ToolPrimaryActionProps extends Omit<
  ButtonProps,
  "variant" | "size" | "asChild"
> {
  loading?: boolean;
  loadingLabel?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  tone?: "primary" | "danger";
  /** Full width at 390px, content width from the small breakpoint. */
  fullWidthOnMobile?: boolean;
  /** Opt-in for long mobile tools whose CTA must remain reachable. */
  stickyOnMobile?: boolean;
}

/** The one visually dominant action in a tool workflow. */
export const ToolPrimaryAction = React.forwardRef<
  HTMLButtonElement,
  ToolPrimaryActionProps
>(
  (
    {
      children,
      loading = false,
      loadingLabel,
      leadingIcon,
      trailingIcon,
      tone = "primary",
      fullWidthOnMobile = true,
      stickyOnMobile = false,
      disabled,
      className,
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      variant={tone}
      size="lg"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-tool-primary-action=""
      className={cn(
        "min-h-12 px-6 shadow-[var(--shadow-soft)]",
        fullWidthOnMobile && "w-full sm:w-auto sm:min-w-48",
        stickyOnMobile &&
          "sticky bottom-3 z-20 shadow-[var(--shadow-pop)] sm:static",
        className,
      )}
      {...props}
    >
      {loading ? (
        <CircleNotch size={20} className="animate-spin" aria-hidden="true" />
      ) : (
        leadingIcon
      )}
      <span className="min-w-0 truncate">
        {loading && loadingLabel !== undefined ? loadingLabel : children}
      </span>
      {!loading ? trailingIcon : null}
    </Button>
  ),
);

ToolPrimaryAction.displayName = "ToolPrimaryAction";
