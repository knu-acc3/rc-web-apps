import type { ComponentProps, ReactNode } from "react";
import { IconButton } from "@/ui/button";

/** An icon button for the floating bar of a full-screen stage: it takes the bar's text colour (light or dark). */
export function BarButton({ label, icon, className, ...props }: Omit<ComponentProps<typeof IconButton>, "icon" | "label"> & { label: string; icon: ReactNode }) {
  return <IconButton label={label} icon={icon} className={`text-inherit! ${className ?? ""}`} {...props} />;
}
