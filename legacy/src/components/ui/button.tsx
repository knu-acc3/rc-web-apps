import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/cn";

const buttonVariants = cva(
  "inline-flex min-w-0 max-w-full items-center justify-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-[var(--radius-md)] font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-[var(--shadow-soft)]",
        secondary:
          "bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] border border-[var(--color-border)]",
        outline:
          "bg-transparent text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]",
        ghost:
          "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)]",
        soft: "bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:bg-[color-mix(in_oklab,var(--color-primary)_18%,transparent)]",
        danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
        link: "bg-transparent text-[var(--color-primary)] underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-11 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
        "icon-sm": "h-11 w-11",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, title, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isIconButton =
      size === "icon" || size === "icon-sm" || size === "icon-lg";
    const label =
      typeof props["aria-label"] === "string"
        ? props["aria-label"]
        : typeof title === "string"
          ? title
          : undefined;
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        title={title ?? (isIconButton ? label : undefined)}
        aria-label={props["aria-label"] ?? (isIconButton ? label : undefined)}
        data-icon-only={isIconButton ? "true" : undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
