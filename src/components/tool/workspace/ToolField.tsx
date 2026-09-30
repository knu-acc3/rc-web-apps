import { useId, type HTMLAttributes, type ReactNode } from "react";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/cn";

export interface ToolFieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}

export interface ToolFieldProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  label: ReactNode;
  children: ReactNode | ((controlProps: ToolFieldControlProps) => ReactNode);
  controlId?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optionalLabel?: ReactNode;
  labelAction?: ReactNode;
  orientation?: "vertical" | "responsive-horizontal";
  controlClassName?: string;
}

/**
 * Uniform label/hint/error wrapper. The render-prop form wires ARIA attributes
 * automatically; plain children remain available for low-friction migrations.
 */
export function ToolField({
  label,
  children,
  controlId,
  hint,
  error,
  required = false,
  optionalLabel,
  labelAction,
  orientation = "vertical",
  controlClassName,
  className,
  ...props
}: ToolFieldProps) {
  const generatedId = useId();
  const id = controlId ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const controlProps: ToolFieldControlProps = {
    id,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    "aria-required": required ? true : undefined,
  };
  const control =
    typeof children === "function" ? children(controlProps) : children;

  return (
    <div
      className={cn(
        "min-w-0",
        orientation === "responsive-horizontal" &&
          "sm:grid sm:grid-cols-[minmax(9rem,12rem)_minmax(0,1fr)] sm:items-start sm:gap-4",
        className,
      )}
      {...props}
    >
      <div className="mb-2 flex min-h-5 min-w-0 items-start justify-between gap-2 sm:mb-2">
        <Label htmlFor={id} className="min-w-0 leading-snug">
          {label}
          {required ? (
            <span
              className="ml-1 text-[var(--color-danger)]"
              aria-hidden="true"
            >
              *
            </span>
          ) : optionalLabel ? (
            <span className="ml-1 font-normal text-[var(--color-text-subtle)]">
              {optionalLabel}
            </span>
          ) : null}
        </Label>
        {labelAction ? <div className="shrink-0">{labelAction}</div> : null}
      </div>
      <div className={cn("min-w-0", controlClassName)}>
        {control}
        {hint ? (
          <div
            id={hintId}
            className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-muted)]"
          >
            {hint}
          </div>
        ) : null}
        {error ? (
          <div
            id={errorId}
            role="alert"
            className="mt-1.5 text-xs font-medium leading-relaxed text-[var(--color-danger)]"
          >
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
