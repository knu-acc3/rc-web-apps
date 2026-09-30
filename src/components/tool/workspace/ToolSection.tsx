import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type ToolSectionVariant = "plain" | "separated" | "subtle";

export interface ToolSectionProps extends Omit<
  ComponentPropsWithoutRef<"section">,
  "title"
> {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  variant?: ToolSectionVariant;
  contentClassName?: string;
}

const variantClasses: Record<ToolSectionVariant, string> = {
  plain: "",
  separated: "border-t border-[var(--color-border-subtle)] pt-5 sm:pt-6",
  subtle:
    "rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]/45 px-3.5 py-4 sm:px-5 sm:py-5",
};

/** A semantic, open-layout region for inputs, controls, or secondary content. */
export function ToolSection({
  title,
  description,
  icon,
  actions,
  headingLevel = 2,
  variant = "plain",
  contentClassName,
  className,
  children,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ToolSectionProps) {
  const generatedTitleId = useId();
  const Heading = headingLevel === 2 ? "h2" : headingLevel === 3 ? "h3" : "h4";
  const titleId = title ? generatedTitleId : undefined;

  return (
    <section
      aria-labelledby={ariaLabelledBy ?? titleId}
      className={cn("min-w-0", variantClasses[variant], className)}
      {...props}
    >
      {title || description || actions ? (
        <div className="mb-3 flex min-w-0 flex-wrap items-start gap-3 sm:mb-4">
          {icon ? (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-primary)] [&>svg]:h-5 [&>svg]:w-5">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            {title ? (
              <Heading
                id={titleId}
                className="text-base font-bold leading-snug text-[var(--color-text)] sm:text-lg"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <div className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">
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
      <div className={cn("min-w-0", contentClassName)}>{children}</div>
    </section>
  );
}
