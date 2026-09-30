import type { ReactNode } from "react";
import { GlobeHemisphereWest } from "@phosphor-icons/react";
import { cn } from "@/src/lib/cn";

export interface FlagIconProps {
  countryCode?: string;
  label?: string;
  src?: string;
  fallback?: ReactNode;
  size?: "sm" | "md" | "lg";
  decorative?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-5 text-sm",
  md: "h-5 w-7 text-base",
  lg: "h-7 w-9 text-xl",
} as const;

function countryCodeToEmoji(countryCode?: string) {
  const normalized = countryCode?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) return undefined;
  return String.fromCodePoint(
    ...Array.from(normalized).map((letter) => 127397 + letter.charCodeAt(0)),
  );
}

/** Flag asset slot with an emoji/code fallback and no remote dependency. */
export function FlagIcon({
  countryCode,
  label,
  src,
  fallback,
  size = "md",
  decorative = true,
  className,
}: FlagIconProps) {
  const emoji = countryCodeToEmoji(countryCode);
  const accessibleLabel =
    label ?? (countryCode ? `${countryCode.toUpperCase()} flag` : "Flag");
  const accessibilityProps = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": accessibleLabel } as const);

  if (src) {
    return (
      <span
        {...accessibilityProps}
        className={cn(
          "inline-block shrink-0 rounded-[2px] border border-black/10 bg-cover bg-center bg-no-repeat shadow-sm",
          sizeClasses[size],
          className,
        )}
        style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
      />
    );
  }

  return (
    <span
      {...accessibilityProps}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] leading-none [font-family:'Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif]",
        sizeClasses[size],
        className,
      )}
    >
      {emoji ?? fallback ?? <GlobeHemisphereWest className="h-full w-full" />}
    </span>
  );
}
