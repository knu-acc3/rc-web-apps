import Link from "@/ui/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[0.5rem] font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.125rem] [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "bg-surface-2 text-fg hover:bg-line",
  ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
  outline: "border border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
  danger: "bg-err-soft text-err hover:bg-err hover:text-white",
};

/** Touch screens get finger-sized targets (40–44px); a mouse keeps the compact sizes. */
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm pointer-coarse:h-10",
  md: "h-10 px-4 text-[0.9375rem] pointer-coarse:h-11",
  lg: "h-12 px-5 text-base",
  icon: "size-10 pointer-coarse:size-11",
  "icon-sm": "size-8 [&_svg]:size-4 pointer-coarse:size-10",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", className?: string): string {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "secondary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
