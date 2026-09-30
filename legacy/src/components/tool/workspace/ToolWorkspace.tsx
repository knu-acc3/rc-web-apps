import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import { usePlatformHotkeys } from "@/src/hooks/usePlatformHotkeys";
import { useGlobalFilePaste } from "@/src/hooks/useGlobalFilePaste";

export type ToolWorkspaceWidth = "sm" | "md" | "lg" | "xl" | "full";
export type ToolWorkspaceDensity = "compact" | "comfortable";

export interface ToolWorkspaceProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children: ReactNode;
  /** Optional draft restore/clear controls. */
  draftControls?: ReactNode;
  /** The single primary action for the workflow. */
  primaryAction?: ReactNode;
  /** A ToolResult or another result surface. */
  result?: ReactNode;
  /** Usually an existing AdvancedSettings component. */
  advanced?: ReactNode;
  maxWidth?: ToolWorkspaceWidth;
  density?: ToolWorkspaceDensity;
  busy?: boolean;
}

const widthClasses: Record<ToolWorkspaceWidth, string> = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

const densityClasses: Record<ToolWorkspaceDensity, string> = {
  compact: "gap-4 sm:gap-5",
  comfortable: "gap-5 sm:gap-7",
};

/**
 * Open, single-column-first workspace shared by every tool family.
 * Named slots keep the primary flow in a predictable order on small screens.
 */
export function ToolWorkspace({
  children,
  draftControls,
  primaryAction,
  result,
  advanced,
  maxWidth = "lg",
  density = "comfortable",
  busy = false,
  className,
  ...props
}: ToolWorkspaceProps) {
  usePlatformHotkeys({ disabled: busy });
  useGlobalFilePaste({ disabled: busy });

  return (
    <div
      data-tool-workspace=""
      data-density={density}
      aria-busy={busy || undefined}
      className={cn(
        "mx-auto flex w-full min-w-0 flex-col",
        widthClasses[maxWidth],
        densityClasses[density],
        className,
      )}
      {...props}
    >
      {draftControls ? (
        <div data-tool-draft-controls-slot="" className="flex justify-end pb-1">
          {draftControls}
        </div>
      ) : null}
      {children}
      {primaryAction ? (
        <div
          data-tool-primary-action-slot=""
          className="flex w-full items-center justify-stretch sm:justify-start"
        >
          {primaryAction}
        </div>
      ) : null}
      {result}
      {advanced ? (
        <div data-tool-advanced-slot="" className="pt-1">
          {advanced}
        </div>
      ) : null}
    </div>
  );
}
