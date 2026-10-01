import Link from "@/ui/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Material 3 buttons (styles: `.btn*` in globals.css).
 *  - filled   — the one main action of a tool (accent fill, shadow)
 *  - tonal    — important but not the main action (tinted fill)
 *  - outlined — a secondary action (outline, accent label)
 *  - text     — a quiet action in a row of others (accent label)
 *  - neutral  — toolbar icons (grey icon, state layer on hover)
 *  - elevated — an action on a tinted background (surface + shadow)
 *  - danger   — deleting things
 * Old names still work: primary → filled, secondary → tonal, outline → outlined, ghost → text (neutral for icons).
 */
export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "neutral" | "elevated" | "danger" | "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg";

const VARIANT: Record<ButtonVariant, string> = {
  filled: "btn-filled",
  primary: "btn-filled",
  tonal: "btn-tonal",
  secondary: "btn-tonal",
  outlined: "btn-outlined",
  outline: "btn-outlined",
  text: "btn-text",
  ghost: "btn-text",
  neutral: "btn-neutral",
  elevated: "btn-elevated",
  danger: "btn-danger",
};

/** Touch screens get finger-sized targets (40–48px); a mouse keeps the compact sizes. */
const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm [--btn-r:1.125rem] pointer-coarse:h-10",
  md: "h-10 px-5 text-[0.9375rem] [--btn-r:1.25rem] pointer-coarse:h-11",
  lg: "h-12 px-6 text-base [--btn-r:1.5rem] [&_svg]:size-5",
  xl: "h-14 px-8 text-lg [--btn-r:1.75rem] [&_svg]:size-6",
  icon: "btn-round size-10 pointer-coarse:size-11",
  "icon-sm": "btn-round size-8 [&_svg]:size-4 pointer-coarse:size-10",
  "icon-lg": "btn-round size-12 [&_svg]:size-6",
};

const isIcon = (size: Size) => size === "icon" || size === "icon-sm" || size === "icon-lg";

export function buttonClass(variant: ButtonVariant = "secondary", size: Size = "md", className?: string): string {
  // A "ghost" icon is a standard Material icon button (grey); a "ghost" with a label is a text button (accent).
  const v = variant === "ghost" && isIcon(size) ? "btn-neutral" : VARIANT[variant];
  return cn("btn", v, SIZE[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: Size; loading?: boolean; fullWidth?: boolean };

export function Button({ variant = "secondary", size = "md", className, type = "button", loading, fullWidth, disabled, children, ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, cn(fullWidth && "w-full", className))} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "secondary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  /** Read by screen readers and shown as a tooltip. */
  label: string;
  icon: ReactNode;
  variant?: "standard" | "filled" | "tonal" | "outlined";
  size?: "sm" | "md" | "lg";
  /** A toggle (★, sound on): announced as pressed and drawn filled while on. */
  selected?: boolean;
};

/** Material 3 icon button: round, a state layer on hover, morphs to a rounded square while pressed. */
export function IconButton({ label, icon, variant = "standard", size = "md", selected, className, type = "button", title, ...props }: IconButtonProps) {
  const v = variant === "standard" ? "neutral" : variant;
  return (
    <button
      type={type}
      aria-label={label}
      title={title ?? label}
      aria-pressed={selected}
      className={buttonClass(v, size === "sm" ? "icon-sm" : size === "lg" ? "icon-lg" : "icon", cn(selected && "btn-on", className))}
      {...props}
    >
      {icon}
    </button>
  );
}
