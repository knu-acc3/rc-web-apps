import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { optionLabels } from "@/lib/option-labels";

type CtlSize = "sm" | "md" | "lg";
const ctlSize: Record<CtlSize, string> = { sm: "h-9 text-sm pointer-coarse:h-10", md: "h-10 text-[0.9375rem] pointer-coarse:h-11", lg: "h-12 text-lg font-semibold" };

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

/**
 * A drop-down list: the browser's own <select> (native menus, keyboard and phone pickers) dressed as a Material 3
 * field — as wide as the chosen option, never cut off, with a chevron in a tinted circle so it reads as a list.
 *  - variant "outlined" (default) — a form field; "tonal" — a filled pill; "plain" — text with a chevron (a unit
 *    name above a big number);
 *  - fit "longest" (default) keeps the width when the choice changes; "selected" hugs the chosen option.
 * Inside a Field it stretches to the column like any input.
 */
export function Select({
  className,
  children,
  size = "md",
  variant = "outlined",
  fit = "longest",
  style,
  ...props
}: Omit<ComponentProps<"select">, "size"> & { size?: CtlSize; variant?: "outlined" | "tonal" | "plain"; fit?: "longest" | "selected" }) {
  const opts = optionLabels(children);
  const current = String(props.value ?? props.defaultValue ?? opts[0]?.value ?? "");
  const shown = fit === "selected" ? (opts.find((o) => o.value === current)?.label ?? opts[0]?.label ?? "") : opts.reduce((a, o) => (o.label.length > a.length ? o.label : a), "");
  const text = cn(ctlSize[size], size === "lg" && "text-base! font-semibold");
  return (
    <span className={cn("select", variant !== "outlined" && `select-${variant}`, className)} style={style}>
      <span aria-hidden className={cn("select-sizer leading-[2.5]", text)}>
        {shown || " "}
      </span>
      <select className={cn("select-native", text)} {...props}>
        {children}
      </select>
      <span aria-hidden className="select-icon">
        <ChevronDown />
      </span>
    </span>
  );
}

/** Material 3 checkbox: a 18px box with a drawn check. */
export function Checkbox({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("group inline-flex min-h-10 cursor-pointer items-center gap-3 text-[0.9375rem] text-fg select-none", className)}>
      <span className="relative isolate inline-flex size-[1.125rem] shrink-0">
        <input
          type="checkbox"
          className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[0.25rem] border-2 border-fg-2 bg-transparent transition-colors duration-150 checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <Check aria-hidden strokeWidth={3.5} className="pointer-events-none absolute left-[0.1875rem] top-[0.1875rem] size-3 scale-50 text-accent-fg opacity-0 transition-[opacity,transform] duration-150 peer-checked:scale-100 peer-checked:opacity-100" />
        <span aria-hidden className="pointer-events-none absolute -inset-2.5 -z-10 rounded-full bg-fg opacity-0 transition-opacity group-hover:opacity-[0.08]" />
      </span>
      <span>{label}</span>
    </label>
  );
}

/** Material 3 switch: the handle grows and shows a check when on (keyboard + screen reader friendly). */
export function Switch({ label, className, ...props }: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex min-h-10 cursor-pointer items-center gap-3 text-[0.9375rem] text-fg select-none", className)}>
      <span className="relative inline-flex h-8 w-[3.25rem] shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full border-2 border-outline bg-surface-2 transition-colors duration-200 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:opacity-50" />
        <span className="absolute left-2 top-2 flex size-4 items-center justify-center rounded-full bg-outline text-accent shadow-sm transition-all duration-200 ease-[var(--ease-emph)] peer-checked:left-[1.5rem] peer-checked:top-1 peer-checked:size-6 peer-checked:bg-accent-fg peer-active:scale-110 [&_svg]:opacity-0 peer-checked:[&_svg]:opacity-100">
          <Check aria-hidden strokeWidth={3} className="size-3.5 transition-opacity" />
        </span>
      </span>
      <span>{label}</span>
    </label>
  );
}

/**
 * Material 3 slider: a thick track filled up to the value and a round handle; while dragging, a bubble shows the
 * value (`format` turns it into text, e.g. "80 %").
 */
export function Slider({ className, style, format, ...props }: Omit<ComponentProps<"input">, "type"> & { format?: (v: number) => string }) {
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const v = Number(props.value ?? props.defaultValue ?? (min + max) / 2);
  const p = max > min ? Math.min(1, Math.max(0, (v - min) / (max - min))) : 0;
  return (
    <span className={cn("relative block w-full", className)} style={{ ...style, ["--p" as string]: p } as CSSProperties}>
      <input type="range" className="slider" {...props} />
      <span aria-hidden className="slider-bubble">
        {format ? format(v) : v}
      </span>
    </span>
  );
}
