import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Base look of text inputs/selects (see .control in globals.css). */
export const controlClass = "control";
type CtlSize = "sm" | "md" | "lg";
const ctlSize: Record<CtlSize, string> = { sm: "h-9 text-sm", md: "h-10 text-[15px]", lg: "h-12 text-lg font-semibold" };

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
  aside,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
  /** Small element aligned to the right of the label (e.g. a unit toggle). */
  aside?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {(label || aside) && (
        <div className="flex min-h-5 items-center justify-between gap-2">
          {label && (
            <label htmlFor={htmlFor} className="text-sm font-medium text-fg-2">
              {label}
            </label>
          )}
          {aside}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-sm text-err" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-fg-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, size = "md", ...props }: Omit<ComponentProps<"input">, "size"> & { size?: CtlSize }) {
  return <input className={cn("control", ctlSize[size], className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn("control min-h-32 resize-y py-2.5 font-mono text-sm leading-relaxed", className)}
      spellCheck={false}
      {...props}
    />
  );
}

export function Select({
  className,
  selectClassName,
  children,
  size = "md",
  ...props
}: Omit<ComponentProps<"select">, "size"> & { size?: CtlSize; selectClassName?: string }) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn("control appearance-none pr-9", ctlSize[size], size === "lg" && "text-base! font-medium!", selectClassName)} {...props}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function Checkbox({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-fg select-none", className)}>
      <input type="checkbox" className="size-[18px] shrink-0 cursor-pointer rounded accent-[var(--accent)]" {...props} />
      <span>{label}</span>
    </label>
  );
}

/** Toggle switch built on a checkbox (keyboard + screen reader friendly). */
export function Switch({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2.5 text-[15px] text-fg select-none", className)}>
      <span className="relative inline-flex">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-6 w-10 rounded-full bg-line-strong transition-colors duration-150 peer-checked:bg-accent peer-focus-visible:ring-3 peer-focus-visible:ring-accent/30" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-4" />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function Slider({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return <input type="range" className={cn("h-2 w-full cursor-pointer accent-[var(--accent)]", className)} {...props} />;
}
