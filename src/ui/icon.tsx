import "server-only";
import * as Lucide from "lucide-react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/cn";

type IconComponent = React.ComponentType<LucideProps>;

/**
 * Render a lucide icon by name. SERVER ONLY — client components must import
 * icons directly from "lucide-react" so only the used icons are bundled.
 */
export function Icon({ name, className, ...props }: { name?: string } & LucideProps) {
  const Cmp = ((name && (Lucide as unknown as Record<string, IconComponent>)[name]) || Lucide.Wrench) as IconComponent;
  return <Cmp aria-hidden className={className} {...props} />;
}

/** Section/tool icon on a tinted square using the section hue. */
export function IconTile({ name, hue, size = "md", className }: { name?: string; hue?: number; size?: "sm" | "md" | "lg"; className?: string }) {
  const box = size === "sm" ? "size-8 rounded-[8px] [&_svg]:size-4" : size === "lg" ? "size-12 rounded-[12px] [&_svg]:size-6" : "size-10 rounded-[10px] [&_svg]:size-5";
  return (
    <span className={cn("sec-icon inline-flex shrink-0 items-center justify-center", box, className)} style={{ ["--hue" as string]: hue ?? 225 }}>
      <Icon name={name} strokeWidth={1.75} />
    </span>
  );
}
