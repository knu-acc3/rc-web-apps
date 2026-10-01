import Link from "@/ui/link";
import { BRAND } from "@/config/brand";
import { href, type Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { LOGO } from "./logo-mark";

/** The orange cookie with a spark; it turns a little when the logo link is hovered. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox={LOGO.viewBox} className={cn("shrink-0 transition-transform duration-500 ease-[var(--ease-emph)] group-hover:rotate-[36deg]", className)}>
      <path d={LOGO.cookie} fill={LOGO.color} />
      <path d={LOGO.spark} fill="#fff" className="origin-center transition-transform duration-500 group-hover:-rotate-[36deg]" />
    </svg>
  );
}

export function Logo({ locale }: { locale: Locale }) {
  return (
    <Link href={href(locale)} className="group flex shrink-0 items-center gap-2.5 rounded-[0.625rem]" aria-label={BRAND.name}>
      <LogoMark className="size-9" />
      <span className="hidden text-[1.125rem] font-extrabold tracking-tight text-fg sm:inline">
        RC<span className="font-semibold text-fg-2"> Web App</span>
      </span>
    </Link>
  );
}
